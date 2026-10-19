import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Banc de la POC 3 : (1) mesure la réponse de chaque véhicule à un même geste
   (cible déplacée de 150 px vers la droite) : temps pour arriver, dépassement ;
   (2) un robot joue la mission de chaque véhicule et capture le milieu de la mission
   dans docs/patrouille-poc3-<véhicule>.png. Échoue sur une erreur de page. */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const invincible = process.argv.includes("--invincible");
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const p = await nav.newPage({ viewport: { width: 400, height: 760 }, deviceScaleFactor: 2 });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
await p.goto(srv.base + "patrouille/poc3.html?nc=" + Date.now());
await p.waitForTimeout(300);

// (1) Réponse au geste, sans ennemis : on fige le script
const reponse = await p.evaluate(() => {
  const P = window.__poc, out = {};
  for (const v of ['avion', 'rover', 'sousmarin', 'vaisseau']) {
    P.lancer(v); const S = P.S; S.script = []; S.terrain = [];
    // Départ à gauche : loin du bord droit, sinon c'est le bord qui arrête le véhicule et le dépassement ment
    S.j.x = S.j.cx = 90; S.j.vx = 0; const x0 = 90; S.j.cx = x0 + 150;
    let arrive = null, max = 0, pose = null;
    for (let k = 0; k < 300; k++) { P.pas(); const d = S.j.x - x0; max = Math.max(max, d); if (arrive === null && d >= 135) arrive = k; if (pose === null && arrive !== null && Math.abs(d - 150) < 5 && Math.abs(S.j.vx) < 0.3) pose = k; }
    out[v] = { arriveEnImages: arrive, depassementPx: Math.round(max - 150), poseEnImages: pose };
    S.enJeu = false;
  }
  return out;
});
console.log("réponse à un geste de 150 px :", JSON.stringify(reponse));

const robot = `(() => {
  const P = window.__poc, S = P.S, j = S.j;
  let cible = null, basY = -1;
  for (const e of S.ennemis) if (!e.cache && e.y > basY && e.y < j.y - 40 && e.y > 0) { basY = e.y; cible = e.x; }
  for (const o of S.objets) if (o.k !== 'bouton' && o.y > 0) cible = o.x;
  let dx = 0;
  for (const b of S.tirsE) { const d = Math.hypot(b.x - j.x, b.y - j.y); if (!b.bleu && d < 70) dx += (j.x - b.x) / (d * d) * 1100; }
  j.cx = (cible ?? 180) + dx;
  j.cy = S.M.zone[1] - 20;
  if (S.jauge >= 100 && S.ennemis.length > 5) document.getElementById('superb').click();
})()`;
for (const v of ['avion', 'rover', 'sousmarin', 'vaisseau']) {
  await p.evaluate(({ v, inv }) => { window.__poc.opt.invincible = inv; window.__poc.lancer(v); }, { v, inv: invincible });
  let capt = false, fin = null, morts = 0, sable = 0, n = 0;
  for (let k = 0; k < 120 * 60; k += 30) {
    const e = await p.evaluate(({ code }) => {
      const P = window.__poc;
      let sable = 0;
      for (let i = 0; i < 30; i++) { if (!P.S || !P.S.enJeu) break; eval(code); P.pas(); if (P.S.veh === 'rover' && P.S.terrain.some((t) => t.k === 'sable' && Math.abs(P.S.j.x - t.x) < t.w / 2 && Math.abs(P.S.j.y - (t.y + t.h / 2)) < t.h / 2)) sable++; }
      const S = P.S, vis = (id) => !document.getElementById(id).classList.contains('cache');
      return { t: S.t, ennemis: S.ennemis.length, tirsE: S.tirsE.length, coups: S.coups, sauts: S.sauts, mort: vis('mort'), bilan: vis('bilan'), sable, planete: !!S.planete, caches: S.ennemis.filter((x) => x.cache).length };
    }, { code: robot });
    sable += e.sable;
    const interessant = v === 'rover' ? e.t > 22 * 60 : v === 'vaisseau' ? e.planete && e.ennemis >= 3 : v === 'avion' ? e.caches >= 1 && e.ennemis >= 4 : e.t > 28 * 60 && e.ennemis >= 3;
    if (!capt && interessant) { capt = true; await p.screenshot({ path: path.join(ICI, "..", "docs", `patrouille-poc3-${v}.png`) }); }
    if (e.mort) { morts++; await p.evaluate(() => document.getElementById('d-reprendre').click()); if (morts > 5) { fin = 'trop de morts'; break; } continue; }
    if (e.bilan) { fin = `fini à ${Math.round(e.t / 60)} s, ${e.coups} coups${v === 'rover' ? `, ${e.sauts} sauts, ${(sable / 60).toFixed(1)} s dans le sable mou` : ''}`; break; }
  }
  console.log(v.padEnd(10), fin, morts ? `(${morts} morts)` : '', capt ? '' : '(pas de capture)');
}
await nav.close();
srv.arreter();
if (erreurs.length) { console.log("✗ erreurs :", erreurs.join(" | ")); process.exit(1); }
console.log("✓ aucune erreur de page");
