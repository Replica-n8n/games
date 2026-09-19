// Paper Race : le relais des courses EN LIGNE (Cloudflare Worker + Durable Object).
//
// Il ne connaît PAS les règles : il garde la liste des coups d'une course, vérifie
// qui a le droit de jouer quelle voiture, et la relaie à tous les téléphones
// (2 à 6 places depuis pr-2 ; une salle de la v7 garde ses règles à deux). Chaque téléphone
// rejoue les coups avec le même moteur (moteur.js), qui ne laisse aucune place au
// hasard : tous voient la même course.
//
// Rien sur les joueurs : ni nom, ni compte, ni message libre. Une course tient
// dans un code de 4 caractères ; elle s'efface seule après 24 h sans un coup.
//
// ⚠️ WORKER_VERSION à changer à chaque modification : c'est la seule façon de
// savoir quel code tourne vraiment (GET / la renvoie).
const WORKER_VERSION = 'pr-2';
const ORIGINES = ['https://replica-n8n.github.io', 'http://127.0.0.1', 'http://localhost'];
const ALPHABET = 'ABCDEFGHJKMNPRSTUVWXYZ23456789';      // ni 0/O/Q, ni 1/I/L
const OUBLI = 24 * 3600 * 1000;
const CIRCUIT = /^[a-z]{1,20}$/;
// pr-2 : une salle a de 2 à 6 places ; une salle sans places est une salle de la v7
const v2 = (s) => Number.isInteger(s.places);
const places = (s) => v2(s) ? s.places : 2;

const autorise = (o) => !!o && ORIGINES.some((a) => o === a || o.startsWith(a + ':'));
function entetes(req) {
  const o = req.headers.get('Origin');
  return autorise(o) ? { 'Access-Control-Allow-Origin': o, 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'content-type', 'Vary': 'Origin' } : {};
}
const json = (req, obj, status) => new Response(JSON.stringify(obj), { status: status || 200, headers: { 'content-type': 'application/json', ...entetes(req) } });
const hasard = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return a; };
const nouveauCode = () => Array.from(hasard(4), (b) => ALPHABET[b % ALPHABET.length]).join('');
const nouveauJeton = () => Array.from(hasard(16), (b) => b.toString(16).padStart(2, '0')).join('');

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: entetes(req) });
    if (url.pathname === '/') return json(req, { paperRace: WORKER_VERSION });
    // un autre site ne peut pas se servir du relais
    if (!autorise(req.headers.get('Origin'))) return new Response('origine refusée', { status: 403 });

    // créer une course : on tire un code libre
    if (url.pathname === '/salles' && req.method === 'POST') {
      let corps = {};
      try { corps = await req.json(); } catch (e) { }
      if (!CIRCUIT.test(corps.circuit || '')) return json(req, { erreur: 'circuit' }, 400);
      if (corps.places !== undefined && !(Number.isInteger(corps.places) && corps.places >= 2 && corps.places <= 6)) return json(req, { erreur: 'places' }, 400);
      for (let essai = 0; essai < 8; essai++) {
        const code = nouveauCode();
        const salle = env.SALLES.get(env.SALLES.idFromName(code));
        const r = await salle.fetch('https://salle/creer', { method: 'POST', body: JSON.stringify({ code, circuit: corps.circuit, places: corps.places, pieges: corps.pieges }) });
        if (r.status === 200) return json(req, { code, ...(await r.json()) });
      }
      return json(req, { erreur: 'plein' }, 503);
    }
    // rejoindre une course : une connexion permanente (WebSocket)
    const m = url.pathname.match(/^\/salles\/([A-Z2-9]{4})\/ws$/);
    if (m && req.headers.get('Upgrade') === 'websocket') {
      const salle = env.SALLES.get(env.SALLES.idFromName(m[1]));
      return salle.fetch(req);
    }
    return new Response('introuvable', { status: 404 });
  }
};

export class Salle {
  constructor(state) { this.state = state; }

  async etat() { return (await this.state.storage.get('salle')) || null; }
  async ranger(s) {
    s.maj = Date.now();
    await this.state.storage.put('salle', s);
    await this.state.storage.setAlarm(Date.now() + OUBLI);
  }
  presents(s) {
    const p = Array(places(s)).fill(false);
    // une connexion qui se ferme figure encore dans la liste : on ne compte que les ouvertes
    for (const ws of this.state.getWebSockets()) { if (ws.readyState !== 1) continue; const a = ws.deserializeAttachment(); if (a && a.siege >= 0 && a.siege < p.length) p[a.siege] = true; }
    return p;
  }
  diffuser(obj) {
    const t = JSON.stringify(obj);
    for (const ws of this.state.getWebSockets()) { try { ws.send(t); } catch (e) { } }
  }
  // ce que chaque téléphone reçoit en arrivant (ou quand son coup est refusé)
  photo(s, siege, extra) {
    const o = { t: 'etat', version: WORKER_VERSION, code: s.code, circuit: s.circuit, coups: s.coups, manche: s.manche, siege, presents: this.presents(s) };
    if (v2(s)) { o.places = s.places; o.pieges = s.pieges; o.depart = s.depart; }
    return Object.assign(o, extra || {});
  }

  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/creer') {
      if (await this.etat()) return new Response('pris', { status: 409 });
      const { code, circuit, places: n, pieges } = await req.json();
      const jeton = nouveauJeton();
      // pr-2 : de 2 à 6 places ; sans « places », une salle de la v7 (deux, règles d'origine)
      const s = { code, circuit, coups: [], jetons: [jeton, null], manche: 1 };
      if (Number.isInteger(n)) { s.places = n; s.pieges = pieges !== false; s.depart = null; s.jetons = [jeton, ...Array(n - 1).fill(null)]; }
      await this.ranger(s);
      return new Response(JSON.stringify({ jeton, siege: 0 }));
    }
    const s = await this.etat();
    const [client, serveur] = Object.values(new WebSocketPair());
    this.state.acceptWebSocket(serveur);
    const refuser = (code, raison, texte) => {
      serveur.send(JSON.stringify({ t: 'erreur', raison }));
      serveur.close(code, texte);
      return new Response(null, { status: 101, webSocket: client });
    };
    if (!s) return refuser(4004, 'inconnue', 'course inconnue');
    // un siège se retrouve par son jeton ; sinon, la première place libre
    const jeton = url.searchParams.get('jeton') || '';
    let siege = jeton ? s.jetons.indexOf(jeton) : -1;
    let nouveau = null;
    if (siege < 0) {
      // course partie : les places vides sont devenues des fantômes
      if (v2(s) && s.depart) return refuser(4011, 'commencee', 'course commencée');
      siege = s.jetons.indexOf(null);
      if (siege < 0) return refuser(4009, 'complete', 'course complète');
      nouveau = nouveauJeton(); s.jetons[siege] = nouveau; await this.ranger(s);
    }
    serveur.serializeAttachment({ siege });
    serveur.send(JSON.stringify(this.photo(s, siege, { jeton: nouveau || jeton })));
    this.diffuser({ t: 'presence', presents: this.presents(s) });
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, texte) {
    const moi = ws.deserializeAttachment();
    let m; try { m = JSON.parse(texte); } catch (e) { return; }
    const s = await this.etat();
    if (!s || !moi) return;
    const refus = () => ws.send(JSON.stringify(this.photo(s, moi.siege, { refuse: true })));
    if (m.t === 'coup' && !v2(s)) {
      // v7, à deux : les tours alternent strictement, le coup n est au siège n % 2
      const ok = Number.isInteger(m.n) && m.n === s.coups.length && m.n % 2 === moi.siege
        && Number.isInteger(m.k) && m.k >= 0 && m.k <= 9 && s.coups.length < 1000;
      if (!ok) return refus();
      s.coups.push(m.k);
      await this.ranger(s);
      this.diffuser({ t: 'coup', n: m.n, k: m.k, manche: s.manche });
    } else if (m.t === 'coup') {
      // pr-2 : le relais ne sait pas à qui c'est le tour (l'ordre tourne, des voitures
      // arrivent) ; il vérifie l'ordre des coups et QUI a le droit de jouer quelle
      // voiture. Un coup hors tour est ignoré pareil par tous les téléphones.
      // k : 0-8 le pavé, 9 coincé, 10 abandon (soi-même, ou l'hôte pour un absent).
      const hote = moi.siege === 0, v = m.v;
      const permis = !!s.depart && Number.isInteger(v) && v >= 0 && v < s.places && Number.isInteger(m.k) && m.k >= 0 && m.k <= 10
        && (v === moi.siege || (hote && (m.k === 10 || s.depart.fantomes.includes(v))));
      const ok = Number.isInteger(m.n) && m.n === s.coups.length && s.coups.length < 3000 && permis;
      if (!ok) return refus();
      s.coups.push({ v, k: m.k });
      await this.ranger(s);
      this.diffuser({ t: 'coup', n: m.n, k: m.k, v, manche: s.manche });
    } else if (m.t === 'depart' && v2(s)) {
      // l'hôte lance la course : la grille qu'il a tirée ; les places vides deviennent des fantômes
      const g = m.grille, n = s.places;
      const ok = moi.siege === 0 && !s.depart && s.coups.length === 0 && m.manche === s.manche && Array.isArray(g) && g.length === n
        && g.every((x) => Number.isInteger(x) && x >= 0 && x < n) && new Set(g).size === n;
      if (!ok) return refus();
      s.depart = { grille: g, fantomes: s.jetons.map((j, i) => j === null ? i : -1).filter((i) => i >= 0) };
      await this.ranger(s);
      this.diffuser({ t: 'depart', manche: s.manche, depart: s.depart });
    } else if (m.t === 'revanche' && Number.isInteger(m.manche) && m.manche === s.manche) {
      s.coups = []; s.manche++;
      if (v2(s)) s.depart = null;
      await this.ranger(s);
      const o = { t: 'etat', code: s.code, circuit: s.circuit, coups: [], manche: s.manche, presents: this.presents(s), revanche: true };
      if (v2(s)) { o.places = s.places; o.pieges = s.pieges; o.depart = null; }
      this.diffuser(o);
    }
  }

  async webSocketClose(ws) {
    try { ws.close(); } catch (e) { }
    const s = await this.etat();
    if (s) this.diffuser({ t: 'presence', presents: this.presents(s) });
  }

  async alarm() {
    // 24 h sans un coup : la course est oubliée
    for (const ws of this.state.getWebSockets()) { try { ws.close(4010, 'course expirée'); } catch (e) { } }
    await this.state.storage.deleteAll();
  }
}
