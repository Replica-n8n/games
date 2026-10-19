import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Banc de la POC : un robot joue le Jardin en entier (invincible puis normal),
   vérifie drapeaux, cadeaux, super-pouvoir, boss, mort et reprise.
   Capture docs/patrouille-poc-*.png. */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const p = await nav.newPage({ viewport: { width: 400, height: 760 }, deviceScaleFactor: 2 });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
await p.goto(srv.base + "tools/poc/poc.html?nc=" + Date.now());
await p.waitForTimeout(300);
await p.screenshot({ path: path.join(ICI, "..", "docs", "patrouille-poc-menu.png") });

// Robot : se place sous l'ennemi le plus bas, esquive les tirs proches, ramasse les cadeaux.
const robot = `(() => {
  const P = window.__poc, S = P.S, j = S.j;
  let cible = S.boss ? S.boss.x : null, basY = -1;
  for (const e of S.ennemis) if (e.y > basY && e.y < j.y - 40) { basY = e.y; cible = e.x; }
  for (const o of S.objets) if (o.k === 'cadeau') cible = o.x;
  let dx = 0;
  for (const b of S.tirsE) { const d = Math.hypot(b.x - j.x, b.y - j.y); if (d < 60) dx += (j.x - b.x) / (d * d) * 900; }
  j.cx = Math.max(16, Math.min(344, (cible ?? 180) + dx));
  if (S.jauge >= 100 && (S.boss || S.ennemis.length > 6)) document.getElementById('superb').click();
})()`;

async function jouer(invincible, maxSec) {
  await p.evaluate((inv) => { document.getElementById('o-invincible').checked = inv; document.getElementById('o-depart').value = '0'; document.getElementById('b-jouer').click(); }, invincible);
  const journal = { drapeaux: [], cadeaux: 0, supers: 0, bossVu: false, morts: 0, fin: null, captures: 0 };
  for (let s = 0; s < maxSec * 60; s += 30) {
    const etat = await p.evaluate(({ code, n }) => {
      const P = window.__poc;
      for (let k = 0; k < n; k++) { if (!P.S || !P.S.enJeu) break; eval(code); P.pas(); }
      const S = P.S;
      const vis = (id) => !document.getElementById(id).classList.contains('cache');
      return S && { t: S.t, drap: S.drapeau, boss: !!S.boss, bossHp: S.boss?.hp, double: S.double, bouclier: S.bouclier, aimant: S.aimantG, jauge: S.jauge, coeurs: S.coeurs, boutons: S.boutons, mort: vis('mort'), gagne: vis('gagne'), tirsE: S.tirsE.length, ennemis: S.ennemis.length };
    }, { code: robot, n: 30 });
    if (!etat) break;
    if (!journal.drapeaux.includes(etat.drap) && etat.drap) journal.drapeaux.push(etat.drap);
    if (etat.double > 0 || etat.bouclier || etat.aimant > 0) journal.cadeaux++;
    if (etat.jauge < (journal.jaugeAvant ?? 0) - 50) journal.supers++;
    journal.jaugeAvant = etat.jauge;
    if (etat.boss) journal.bossVu = true;
    if (etat.mort) {
      journal.morts++;
      await p.screenshot({ path: path.join(ICI, "..", "docs", "patrouille-poc-mort.png") });
      await p.evaluate(() => document.getElementById('d-reprendre').click());
      if (journal.morts > 12) { journal.fin = 'trop de morts'; break; }
    }
    if (etat.gagne) { journal.fin = `gagné à ${Math.round(etat.t / 60)} s, ${etat.boutons} boutons`; break; }
    // Captures : en pleine vague, au boss
    if (invincible && journal.captures === 0 && etat.ennemis >= 7 && etat.tirsE >= 4) { await p.screenshot({ path: path.join(ICI, "..", "docs", "patrouille-poc-vague.png") }); journal.captures++; }
    if (invincible && journal.captures === 1 && etat.boss && etat.bossHp < 80 && etat.tirsE >= 10) { await p.screenshot({ path: path.join(ICI, "..", "docs", "patrouille-poc-boss.png") }); journal.captures++; }
  }
  return journal;
}

const j1 = await jouer(true, 260);
console.log("robot invincible :", JSON.stringify(j1));
await p.evaluate(() => document.getElementById('g-menu')?.click());
const j2 = await jouer(false, 400);
console.log("robot normal     :", JSON.stringify(j2));
await nav.close();
srv.arreter();
if (erreurs.length) { console.log("✗ erreurs :", erreurs.join(" | ")); process.exit(1); }
console.log("✓ aucune erreur de page");
