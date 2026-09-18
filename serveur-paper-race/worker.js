// Paper Race : le relais des courses EN LIGNE (Cloudflare Worker + Durable Object).
//
// Il ne connaît PAS les règles : il garde la liste des coups d'une course, vérifie
// que chacun joue à son tour, et la relaie aux deux téléphones. Chaque téléphone
// rejoue les coups avec le même moteur (moteur.js), qui ne laisse aucune place au
// hasard : les deux voient la même course.
//
// Rien sur les joueurs : ni nom, ni compte, ni message libre. Une course tient
// dans un code de 4 caractères ; elle s'efface seule après 24 h sans un coup.
//
// ⚠️ WORKER_VERSION à changer à chaque modification : c'est la seule façon de
// savoir quel code tourne vraiment (GET / la renvoie).
const WORKER_VERSION = 'pr-1';
const ORIGINES = ['https://replica-n8n.github.io', 'http://127.0.0.1', 'http://localhost'];
const ALPHABET = 'ABCDEFGHJKMNPRSTUVWXYZ23456789';      // ni 0/O/Q, ni 1/I/L
const OUBLI = 24 * 3600 * 1000;
const CIRCUIT = /^[a-z]{1,20}$/;

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
      for (let essai = 0; essai < 8; essai++) {
        const code = nouveauCode();
        const salle = env.SALLES.get(env.SALLES.idFromName(code));
        const r = await salle.fetch('https://salle/creer', { method: 'POST', body: JSON.stringify({ code, circuit: corps.circuit }) });
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
  presents() {
    const p = [false, false];
    // une connexion qui se ferme figure encore dans la liste : on ne compte que les ouvertes
    for (const ws of this.state.getWebSockets()) { if (ws.readyState !== 1) continue; const s = ws.deserializeAttachment(); if (s && s.siege >= 0) p[s.siege] = true; }
    return p;
  }
  diffuser(obj) {
    const t = JSON.stringify(obj);
    for (const ws of this.state.getWebSockets()) { try { ws.send(t); } catch (e) { } }
  }

  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/creer') {
      if (await this.etat()) return new Response('pris', { status: 409 });
      const { code, circuit } = await req.json();
      const jeton = nouveauJeton();
      await this.ranger({ code, circuit, coups: [], jetons: [jeton, null], manche: 1 });
      return new Response(JSON.stringify({ jeton, siege: 0 }));
    }
    const s = await this.etat();
    const [client, serveur] = Object.values(new WebSocketPair());
    this.state.acceptWebSocket(serveur);
    if (!s) {
      serveur.send(JSON.stringify({ t: 'erreur', raison: 'inconnue' }));
      serveur.close(4004, 'course inconnue');
      return new Response(null, { status: 101, webSocket: client });
    }
    // un siège se retrouve par son jeton ; le second siège va au premier arrivé
    const jeton = url.searchParams.get('jeton') || '';
    let siege = s.jetons.indexOf(jeton);
    let nouveau = null;
    if (siege < 0 || !jeton) {
      if (s.jetons[1] === null) { siege = 1; nouveau = nouveauJeton(); s.jetons[1] = nouveau; await this.ranger(s); }
      else siege = -1;
    }
    if (siege < 0) {
      serveur.send(JSON.stringify({ t: 'erreur', raison: 'complete' }));
      serveur.close(4009, 'course complète');
      return new Response(null, { status: 101, webSocket: client });
    }
    serveur.serializeAttachment({ siege });
    serveur.send(JSON.stringify({ t: 'etat', version: WORKER_VERSION, code: s.code, circuit: s.circuit, coups: s.coups, manche: s.manche, siege, jeton: nouveau || jeton, presents: this.presents() }));
    this.diffuser({ t: 'presence', presents: this.presents() });
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, texte) {
    const moi = ws.deserializeAttachment();
    let m; try { m = JSON.parse(texte); } catch (e) { return; }
    const s = await this.etat();
    if (!s || !moi) return;
    if (m.t === 'coup') {
      // à deux, les tours alternent strictement : le coup n est au siège n % 2
      const ok = Number.isInteger(m.n) && m.n === s.coups.length && m.n % 2 === moi.siege
        && Number.isInteger(m.k) && m.k >= 0 && m.k <= 9 && s.coups.length < 1000;
      if (!ok) { ws.send(JSON.stringify({ t: 'etat', code: s.code, circuit: s.circuit, coups: s.coups, manche: s.manche, siege: moi.siege, presents: this.presents(), refuse: true })); return; }
      s.coups.push(m.k);
      await this.ranger(s);
      this.diffuser({ t: 'coup', n: m.n, k: m.k, manche: s.manche });
    } else if (m.t === 'revanche' && Number.isInteger(m.manche) && m.manche === s.manche) {
      s.coups = []; s.manche++;
      await this.ranger(s);
      this.diffuser({ t: 'etat', code: s.code, circuit: s.circuit, coups: [], manche: s.manche, presents: this.presents(), revanche: true });
    }
  }

  async webSocketClose(ws) {
    try { ws.close(); } catch (e) { }
    this.diffuser({ t: 'presence', presents: this.presents() });
  }

  async alarm() {
    // 24 h sans un coup : la course est oubliée
    for (const ws of this.state.getWebSockets()) { try { ws.close(4010, 'course expirée'); } catch (e) { } }
    await this.state.storage.deleteAll();
  }
}
