/* La Bataille : le compteur des années jouées.

   À quoi il sert : savoir si les joueurs gagnent trop ou pas assez, surtout avec
   les atouts du rogue-lite, pour régler le jeu (méthode de Slay the Spire : combien
   de fois un atout est choisi, combien de fois il gagne).

   Ce qu'il reçoit, à la fin d'une année : la version du jeu, le mode (normal ou
   essai), le résultat, le nombre de mois joués, l'écart de cartes, et pour chaque
   choix les atouts proposés et celui qui a été pris.

   Ce qu'il NE garde PAS, et c'est ce qui permet de ne rien demander aux joueurs
   (décision de Julie, 2026-10-05) : aucun identifiant de joueur ou d'appareil,
   aucune adresse IP, aucun navigateur, aucune date par partie. Il n'y a même pas
   une ligne par partie : seulement des compteurs qu'on augmente. ⚠️ Le jour où
   l'on voudrait suivre UN joueur (un identifiant, même aléatoire), cette
   décision ne tient plus et il faut le dire aux joueurs.

   POST /fin        une année terminée (voir `lire`)
   GET  /           la page des résultats
   GET  /resultats  les compteurs bruts, en JSON
   Déployer : npx wrangler deploy (depuis ce dossier). */

const ORIGINES = ["https://replica-n8n.github.io"];
const ATOUTS = ["vampire", "infirmerie", "garde", "pari", "coeurs", "piques", "carreaux", "trefles", "petits", "premier", "rempart", "renfort", "butin", "arcane"];

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
  const choix = Array.isArray(d.choix) ? d.choix : [];
  if (choix.length > 11) return null;
  for (const c of choix) {
    if (!c || !Array.isArray(c.o) || c.o.length < 1 || c.o.length > 3 || !c.o.every((a) => ATOUTS.includes(a)) || !c.o.includes(c.c)) return null;
  }
  return { v: d.v, mode: d.mode, r: d.r, mois: d.mois, ecart: d.ecart, choix };
}

export class Compteur {
  constructor(etat) {
    this.sql = etat.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS compteurs (cle TEXT PRIMARY KEY, n INTEGER NOT NULL)");
  }
  plus(cle, de = 1) { this.sql.exec("INSERT INTO compteurs (cle, n) VALUES (?, ?) ON CONFLICT(cle) DO UPDATE SET n = n + excluded.n", cle, de); }
  async fetch(req) {
    const url = new URL(req.url);
    if (req.method === "POST" && url.pathname === "/fin") {
      const d = lire(await req.json().catch(() => null));
      if (!d) return new Response("refusé", { status: 400 });
      const b = d.v + "|" + d.mode;
      this.plus("annee|" + b + "|" + d.r);
      this.plus("mois|" + b, d.mois);
      this.plus("ecart|" + b, d.ecart);
      const pris = new Set();
      for (const c of d.choix) { for (const a of c.o) this.plus("offert|" + d.v + "|" + a); this.plus("choisi|" + d.v + "|" + c.c); pris.add(c.c); }
      for (const a of pris) this.plus("avec|" + d.v + "|" + a + "|" + d.r);
      return new Response("ok");
    }
    const lignes = {};
    for (const l of this.sql.exec("SELECT cle, n FROM compteurs")) lignes[l.cle] = l.n;
    return Response.json(lignes);
  }
}

function page(c) {
  const versions = [...new Set(Object.keys(c).filter((k) => k.startsWith("annee|")).map((k) => k.split("|")[1]))].filter((v) => /^V\d+$/.test(v)).sort((a, b) => Number(b.slice(1)) - Number(a.slice(1)));
  const n = (k) => c[k] || 0, pc = (a, b) => (b ? Math.round((100 * a) / b) + " %" : "·");
  let h = "";
  for (const v of versions) {
    h += "<h2>" + v + "</h2><table><tr><th>Mode</th><th>Années</th><th>Gagnées</th><th>Égalités</th><th>Perdues</th><th>Mois joués</th><th>Écart moyen</th></tr>";
    for (const [mode, nom] of [["normal", "Normal"], ["essai", "Rogue-lite (essai)"]]) {
      const b = v + "|" + mode, g = n("annee|" + b + "|g"), e = n("annee|" + b + "|e"), p = n("annee|" + b + "|p"), t = g + e + p;
      if (t) h += "<tr><td>" + nom + "</td><td>" + t + "</td><td>" + pc(g, t) + "</td><td>" + pc(e, t) + "</td><td>" + pc(p, t) + "</td><td>" + (n("mois|" + b) / t).toFixed(1) + "</td><td>" + (n("ecart|" + b) / t).toFixed(1) + "</td></tr>";
    }
    h += "</table>";
    const lignes = ATOUTS.map((a) => { const o = n("offert|" + v + "|" + a), ch = n("choisi|" + v + "|" + a), g = n("avec|" + v + "|" + a + "|g"), t = g + n("avec|" + v + "|" + a + "|e") + n("avec|" + v + "|" + a + "|p"); return [a, o, ch, g, t]; }).filter((l) => l[1]);
    if (lignes.length) {
      h += "<table><tr><th>Atout</th><th>Proposé</th><th>Choisi</th><th>Taux de prise</th><th>Années avec</th><th>Gagnées avec</th></tr>";
      for (const [a, o, ch, g, t] of lignes.sort((x, y) => y[2] / y[1] - x[2] / x[1])) h += "<tr><td>" + a + "</td><td>" + o + "</td><td>" + ch + "</td><td>" + pc(ch, o) + "</td><td>" + t + "</td><td>" + pc(g, t) + "</td></tr>";
      h += "</table>";
    }
  }
  return `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>La Bataille · mesures</title>
<style>body{margin:0;padding:20px 16px 40px;background:#000644;color:#f4f2ff;font:500 16px system-ui,sans-serif}h1{font:600 26px Georgia,serif;margin:0 0 4px}h2{font:600 20px Georgia,serif;color:#feca63;margin:26px 0 8px}p{color:#caceff;margin:0 0 8px;max-width:60ch;line-height:1.4}
table{border-collapse:collapse;margin:0 0 14px;width:100%;max-width:760px}th,td{text-align:right;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.14);font-variant-numeric:tabular-nums}th:first-child,td:first-child{text-align:left}th{color:#caceff;font-weight:500;font-size:14px}div{overflow-x:auto}</style>
<h1>La Bataille · mesures</h1><p>Années terminées par les joueurs, par version. Aucun joueur n'est identifié : ce sont des compteurs. Sous une centaine d'années, un pourcentage ne veut pas dire grand-chose.</p><div>${h || "<p>Aucune année reçue pour l'instant.</p>"}</div></html>`;
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
      return new Response(await r.text(), { status: r.status, headers: cors(req) });
    }
    if (req.method !== "GET") return new Response("non", { status: 405, headers: cors(req) });
    const brut = await (await compteur.fetch("https://compteur/lire")).json();
    if (url.pathname === "/resultats") return Response.json(brut, { headers: cors(req) });
    return new Response(page(brut), { headers: { "content-type": "text/html; charset=utf-8" } });
  },
};
