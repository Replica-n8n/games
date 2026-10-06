/* La Bataille : le compteur des années jouées, et le réglage automatique du mode à atouts.

   À quoi il sert : savoir si les joueurs gagnent trop ou pas assez avec les
   atouts, et CORRIGER TOUT SEUL, sans que personne ait à lire des chiffres
   (demande de Julie, 2026-10-05). Puis s'arrêter : une mesure n'a pas à durer
   toujours.

   Ce qu'il reçoit, à la fin d'une année : la version du jeu, le mode, le résultat,
   le nombre de mois, l'écart de cartes, les atouts proposés et choisis, et le numéro
   du réglage avec lequel l'année a été jouée.

   Ce qu'il NE garde PAS, et c'est ce qui permet de ne rien demander aux joueurs
   (décision de Julie) : aucun identifiant de joueur ou d'appareil, aucune adresse
   IP, aucun navigateur, aucune date par partie. Il n'y a même pas une ligne par
   partie : seulement des compteurs. ⚠️ Le jour où l'on voudrait suivre UN joueur
   (un identifiant, même aléatoire), cette décision ne tient plus.

   COMMENT IL RÈGLE (fonction `regler`, pure, essayée par tools/bataille-reglage.mjs)
   Il compte par « réglage » : chaque fois qu'il change quelque chose, le numéro
   de réglage `g` augmente et les compteurs repartent de zéro, pour ne jamais mêler
   des années jouées avec des valeurs différentes.
   - Tous les MIN années à atouts : si les joueurs gagnent plus de HAUT, le Maudit
     reçoit un peu de vie en plus (`f`) ; moins de BAS, un peu de vie en moins. Par
     petits pas (PAS_F), entre 0,90 et 1,10 : le jeu fait boule de neige, 3 % de vie
     valent déjà une dizaine de points de victoire.
   - Un atout dont les années gagnent bien plus que la moyenne est affaibli (`s`),
     bien moins : renforcé ; presque jamais choisi : renforcé. Entre 0,5 et 1,5.
   - Quand STABLE années de suite n'appellent plus aucun changement, ou au bout de
     PLAFOND années en tout, la mesure S'ARRÊTE : le compteur répond `mesure:false`,
     les jeux cessent d'envoyer, et les derniers réglages restent servis.
   Pour relancer une mesure (nouvelles règles, nouveaux atouts) : augmenter SERIE.

   POST /fin        une année terminée ; répond les réglages en cours
   GET  /reglages   les réglages en cours
   GET  /           la page d'état (personne n'a besoin de la lire)
   Déployer : npx wrangler deploy (depuis ce dossier). */

export const SERIE = 1;
export const ATOUTS = ["vampire", "infirmerie", "garde", "pari", "coeurs", "piques", "carreaux", "trefles", "petits", "premier", "rempart", "renfort", "butin", "arcane"];
export const REGLE = { MIN: 120, STABLE: 300, PLAFOND: 3000, BAS: 0.48, HAUT: 0.62, PAS_F: 0.02, F_MIN: 0.9, F_MAX: 1.1, ECART: 0.15, MIN_ATOUT: 40, MIN_OFFERT: 60, PRISE_BASSE: 0.12, PAS_S: 0.15, S_MIN: 0.5, S_MAX: 1.5 };
const ORIGINES = ["https://replica-n8n.github.io"];
const DEPART = () => ({ g: 0, f: 1, s: {}, mesure: true, total: 0, fin: "" });

function cors(req) {
  const o = req.headers.get("Origin") || "";
  const ok = ORIGINES.includes(o) || /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(o);
  return { "Access-Control-Allow-Origin": ok ? o : ORIGINES[0], "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" };
}

/* Tout ce qui n'a pas exactement la forme attendue est refusé : le compteur est
   ouvert à tous, il ne doit accepter que des fins d'année plausibles. */
export function lire(d) {
  if (!d || typeof d !== "object") return null;
  if (typeof d.v !== "string" || !/^(V\d{1,4}|banc)$/.test(d.v)) return null;
  if (d.mode !== "normal" && d.mode !== "essai") return null;
  if (!["g", "p", "e"].includes(d.r)) return null;
  if (!Number.isInteger(d.mois) || d.mois < 1 || d.mois > 12) return null;
  if (!Number.isInteger(d.ecart) || d.ecart < -32 || d.ecart > 32) return null;
  const g = d.g === undefined ? 0 : d.g;
  if (!Number.isInteger(g) || g < 0 || g > 9999) return null;
  const choix = Array.isArray(d.choix) ? d.choix : [];
  if (choix.length > 11) return null;
  for (const c of choix) {
    if (!c || !Array.isArray(c.o) || c.o.length < 1 || c.o.length > 3 || !c.o.every((a) => ATOUTS.includes(a)) || !c.o.includes(c.c)) return null;
  }
  return { v: d.v, mode: d.mode, r: d.r, mois: d.mois, ecart: d.ecart, g, choix };
}

/* Décide, à partir des compteurs du réglage en cours, s'il faut changer quelque
   chose. `c` : { g, e, p, offert:{}, choisi:{}, avec:{atout:{g,e,p}} }.
   Rend le nouvel état (g augmenté s'il a changé quelque chose) et la raison. */
export function regler(etat, c) {
  const R = REGLE, n = c.g + c.e + c.p, suivant = { ...etat, s: { ...etat.s } }, raisons = [];
  if (!etat.mesure) return { etat: suivant, raisons };
  if (etat.total >= R.PLAFOND) { suivant.mesure = false; suivant.fin = "plafond"; return { etat: suivant, raisons: ["plafond de " + R.PLAFOND + " années atteint : la mesure s'arrête"] }; }
  if (n < R.MIN || n % 20 !== 0) return { etat: suivant, raisons };
  const p = c.g / n, borne = (v, a, b) => Math.round(Math.max(a, Math.min(b, v)) * 100) / 100;
  if (p > R.HAUT && etat.f < R.F_MAX) { suivant.f = borne(etat.f + R.PAS_F, R.F_MIN, R.F_MAX); raisons.push("victoires " + Math.round(p * 100) + " % : le Maudit gagne de la vie (" + suivant.f + ")"); }
  else if (p < R.BAS && etat.f > R.F_MIN) { suivant.f = borne(etat.f - R.PAS_F, R.F_MIN, R.F_MAX); raisons.push("victoires " + Math.round(p * 100) + " % : le Maudit perd de la vie (" + suivant.f + ")"); }
  for (const a of ATOUTS) {
    const av = c.avec[a] || { g: 0, e: 0, p: 0 }, na = av.g + av.e + av.p, s = etat.s[a] || 1, o = c.offert[a] || 0, ch = c.choisi[a] || 0;
    let ns = s;
    if (na >= R.MIN_ATOUT && av.g / na > p + R.ECART) ns = s - R.PAS_S;
    else if (na >= R.MIN_ATOUT && av.g / na < p - R.ECART) ns = s + R.PAS_S;
    else if (o >= R.MIN_OFFERT && ch / o < R.PRISE_BASSE) ns = s + R.PAS_S;
    ns = borne(ns, R.S_MIN, R.S_MAX);
    if (ns !== s) { suivant.s[a] = ns; raisons.push(a + " : " + (ns < s ? "affaibli" : "renforcé") + " (" + ns + ")"); }
  }
  if (raisons.length) suivant.g = etat.g + 1;
  else if (n >= R.STABLE) { suivant.mesure = false; suivant.fin = "stable"; raisons.push(n + " années sans rien à changer : la mesure s'arrête"); }
  return { etat: suivant, raisons };
}
const publics = (e) => ({ g: e.g, f: e.f, s: e.s, mesure: e.mesure });

export class Compteur {
  constructor(etat) {
    this.sql = etat.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS compteurs (cle TEXT PRIMARY KEY, n INTEGER NOT NULL)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS notes (cle TEXT PRIMARY KEY, val TEXT NOT NULL)");
  }
  plus(cle, de = 1) { this.sql.exec("INSERT INTO compteurs (cle, n) VALUES (?, ?) ON CONFLICT(cle) DO UPDATE SET n = n + excluded.n", cle, de); }
  note(cle, defaut) { const l = [...this.sql.exec("SELECT val FROM notes WHERE cle = ?", cle)]; return l.length ? JSON.parse(l[0].val) : defaut; }
  noter(cle, val) { this.sql.exec("INSERT INTO notes (cle, val) VALUES (?, ?) ON CONFLICT(cle) DO UPDATE SET val = excluded.val", cle, JSON.stringify(val)); }
  compteurs(prefixe) { const c = {}; for (const l of this.sql.exec("SELECT cle, n FROM compteurs WHERE cle LIKE ?", prefixe + "%")) c[l.cle.slice(prefixe.length)] = l.n; return c; }
  duReglage(g) {
    const b = this.compteurs("s" + SERIE + "|g" + g + "|"), c = { g: b["annee|g"] || 0, e: b["annee|e"] || 0, p: b["annee|p"] || 0, offert: {}, choisi: {}, avec: {} };
    for (const [k, n] of Object.entries(b)) { const [quoi, a, r] = k.split("|"); if (quoi === "offert") c.offert[a] = n; if (quoi === "choisi") c.choisi[a] = n; if (quoi === "avec") (c.avec[a] = c.avec[a] || { g: 0, e: 0, p: 0 })[r] = n; }
    return c;
  }
  async fetch(req) {
    const url = new URL(req.url), cle = "etat" + SERIE;
    let etat = this.note(cle, DEPART());
    if (req.method === "POST" && url.pathname === "/fin") {
      if (!etat.mesure) return Response.json(publics(etat), { status: 410 });
      const d = lire(await req.json().catch(() => null));
      if (!d) return new Response("refusé", { status: 400 });
      /* « banc » : les essais des outils, comptés à part, jamais dans le réglage. */
      if (d.v === "banc") { this.plus("banc|" + d.mode + "|" + d.r); return Response.json(publics(etat)); }
      if (d.mode === "normal") { this.plus("s" + SERIE + "|normal|" + d.r); return Response.json(publics(etat)); }
      etat.total++;
      /* une année jouée avec un ancien réglage ne dit rien du réglage en cours */
      if (d.g === etat.g) {
        const b = "s" + SERIE + "|g" + etat.g + "|";
        this.plus(b + "annee|" + d.r); this.plus(b + "mois", d.mois); this.plus(b + "ecart", d.ecart);
        const pris = new Set();
        for (const c of d.choix) { for (const a of c.o) this.plus(b + "offert|" + a); this.plus(b + "choisi|" + c.c); pris.add(c.c); }
        for (const a of pris) this.plus(b + "avec|" + a + "|" + d.r);
        const { etat: suivant, raisons } = regler(etat, this.duReglage(etat.g));
        if (raisons.length) { const j = this.note("journal" + SERIE, []); j.push({ g: etat.g, n: etat.total, raisons }); this.noter("journal" + SERIE, j.slice(-60)); }
        etat = suivant;
      }
      this.noter(cle, etat);
      return Response.json(publics(etat));
    }
    if (url.pathname === "/reglages") return Response.json(publics(etat));
    return Response.json({ etat, journal: this.note("journal" + SERIE, []), encours: this.duReglage(etat.g), normal: this.compteurs("s" + SERIE + "|normal|") });
  }
}

function page(d) {
  const e = d.etat, c = d.encours, n = c.g + c.e + c.p, pc = (a, b) => (b ? Math.round((100 * a) / b) + " %" : "·");
  const nn = (d.normal.g || 0) + (d.normal.e || 0) + (d.normal.p || 0);
  let h = "<p><b>" + (e.mesure ? "La mesure est en cours." : "La mesure est terminée (" + (e.fin === "stable" ? "plus rien à changer" : "plafond atteint") + ").") + "</b> " + e.total + " années à atouts reçues. Réglage n° " + e.g + " : vie du Maudit × " + e.f + (Object.keys(e.s).length ? ", atouts retouchés : " + Object.entries(e.s).map(([a, s]) => a + " × " + s).join(", ") : ", aucun atout retouché") + ".</p>";
  h += "<h2>Avec ce réglage</h2><p>" + n + " années : " + pc(c.g, n) + " gagnées, " + pc(c.e, n) + " égalités, " + pc(c.p, n) + " perdues. Sans atouts : " + nn + " années, " + pc(d.normal.g || 0, nn) + " gagnées.</p>";
  const lignes = ATOUTS.map((a) => { const av = c.avec[a] || { g: 0, e: 0, p: 0 }; return [a, c.offert[a] || 0, c.choisi[a] || 0, av.g, av.g + av.e + av.p]; }).filter((l) => l[1]);
  if (lignes.length) { h += "<table><tr><th>Atout</th><th>Proposé</th><th>Choisi</th><th>Prise</th><th>Années avec</th><th>Gagnées avec</th></tr>"; for (const [a, o, ch, g, t] of lignes.sort((x, y) => y[2] / y[1] - x[2] / x[1])) h += "<tr><td>" + a + "</td><td>" + o + "</td><td>" + ch + "</td><td>" + pc(ch, o) + "</td><td>" + t + "</td><td>" + pc(g, t) + "</td></tr>"; h += "</table>"; }
  if (d.journal.length) h += "<h2>Ce qu'il a changé tout seul</h2>" + d.journal.slice().reverse().map((j) => "<p>Après " + j.n + " années (réglage n° " + j.g + ") : " + j.raisons.join(" ; ") + ".</p>").join("");
  return `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>La Bataille · réglage</title>
<style>body{margin:0;padding:20px 16px 40px;background:#000644;color:#f4f2ff;font:500 16px system-ui,sans-serif}h1{font:600 26px Georgia,serif;margin:0 0 8px}h2{font:600 20px Georgia,serif;color:#feca63;margin:26px 0 8px}p{color:#caceff;margin:0 0 8px;max-width:64ch;line-height:1.4}b{color:#f4f2ff}
table{border-collapse:collapse;margin:0 0 14px;width:100%;max-width:760px}th,td{text-align:right;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.14);font-variant-numeric:tabular-nums}th:first-child,td:first-child{text-align:left}th{color:#caceff;font-weight:500;font-size:14px}div{overflow-x:auto}</style>
<h1>La Bataille · réglage automatique</h1><div>${h}</div></html>`;
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });
    const url = new URL(req.url), compteur = env.COMPTEUR.get(env.COMPTEUR.idFromName("bataille"));
    if (req.method === "POST" && url.pathname === "/fin") {
      const corps = await req.text();
      if (corps.length > 2000) return new Response("trop long", { status: 413, headers: cors(req) });
      /* On ne transmet QUE le corps : ni adresse, ni en-têtes du joueur. */
      const r = await compteur.fetch("https://compteur/fin", { method: "POST", body: corps });
      return new Response(await r.text(), { status: r.status, headers: { ...cors(req), "content-type": "application/json" } });
    }
    if (req.method !== "GET") return new Response("non", { status: 405, headers: cors(req) });
    if (url.pathname === "/reglages") return new Response(await (await compteur.fetch("https://compteur/reglages")).text(), { headers: { ...cors(req), "content-type": "application/json", "cache-control": "no-store" } });
    return new Response(page(await (await compteur.fetch("https://compteur/tout")).json()), { headers: { "content-type": "text/html; charset=utf-8" } });
  },
};
