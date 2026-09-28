import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : photographie chaque état de l'interface (titre, jeu, infamie et boss,
   mutation, grotte, pause, mort), en Pixel 9 paysage, en 640x360, et en portrait.
   Captures dans tools/captures/toto-ui-*.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CAPT = path.join(HERE, "captures");
fs.mkdirSync(CAPT, { recursive: true });
const srv = await servir();
const nav = await chromium.launch();
const erreurs = [];
async function ouvrir(opts) {
  const ctx = await nav.newContext(opts);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  await p.goto(srv.base + "toto/");
  await p.evaluate(() => document.fonts.ready);
  return { ctx, p };
}
const photo = (p, nom) => p.screenshot({ path: path.join(CAPT, `toto-ui-${nom}.png`) });
const fige = (p, x, y, extra = "") => p.evaluate(([x, y, extra]) => { const E = window.__essais, P = E.P; clearInterval(window.__t);
  window.__t = setInterval(() => { P.x = x; P.y = y; P.vx = P.vy = 0; P.inv = 1; P.hp = Math.max(P.hp, 1); eval(extra); }, 4); }, [x, y, extra]);

const paysage = { ...(devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"]), deviceScaleFactor: 2 };
const { ctx, p } = await ouvrir(paysage);
await photo(p, "titre");
await p.click("#bNew"); await p.waitForTimeout(1200);
await photo(p, "jeu");
/* Infamie au rang 2, un drapeau qui monte, vie critique, boss engagé. */
await p.evaluate(() => { const P = window.__essais.P; P.rank = 2; P.infamy = 60; P.hp = 20; P.hunger = 15; P.dashCd = .8; });
await fige(p, 1900, 820, "P.hp=20;P.hunger=15");
await p.waitForTimeout(1500);
await photo(p, "danger");
/* Mutation possible, loin de toute grotte. */
await p.evaluate(() => { const P = window.__essais.P; P.rank = 0; P.infamy = 0; P.hp = 100; P.hunger = 90; Object.assign(P.nut, { p: 40, f: 30, m: 25, mu: 0 }); });
await fige(p, 2300, 700, "P.hp=100"); await p.waitForTimeout(1400);
await photo(p, "mutation");
/* Grotte : une mutation payable, une au maximum, les verrouillées. */
await p.evaluate(() => { const P = window.__essais.P; P.evo.corps = 3; P.evo.sonar = 1; Object.assign(P.nut, { p: 60, f: 20, m: 25, mu: 0 }); P.xp = 30; });
await fige(p, 600, 900); await p.waitForTimeout(900);
await p.evaluate(() => { clearInterval(window.__t); });
await p.click("#bGrot"); await p.waitForTimeout(400);
await photo(p, "grotte");
await p.click("#bLeave"); await p.waitForTimeout(200);
await p.click("#bPause"); await p.waitForTimeout(300);
await photo(p, "pause");
await p.click("#bResume");
await p.evaluate(() => { const P = window.__essais.P; P.hunger = 0; P.hp = .01; P.inv = 0; });
await p.waitForTimeout(700);
await photo(p, "mort");
await ctx.close();

/* Combat au stade Ado (caméra dézoomée) : le chiffre de dégâts garde sa taille à l'écran. */
const combat = await ouvrir(paysage);
await combat.p.click("#bNew"); await combat.p.waitForTimeout(600);
await combat.p.evaluate(() => { const E = window.__essais, P = E.P; P.lvl = 8; P.hp = 1e5; E.ents.length = 0; P.x = 1300; P.y = 700; P.vx = P.vy = 0; P.dang = 0; P.face = 1; P.biteCd = 0; });
await fige(combat.p, 1300, 700, "P.dang=0;P.face=1");
await combat.p.waitForTimeout(1800);
await combat.p.evaluate(() => { const E = window.__essais, P = E.P; E.ents.push(E.mkEnt("marteau", P.x + P.r * 2.6, P.y, { ai: "wander", spd: 0 })); });
await combat.p.waitForTimeout(260);
await photo(combat.p, "degats"); await combat.ctx.close();

const petit = await ouvrir({ ...paysage, viewport: { width: 640, height: 360 } });
await petit.p.click("#bNew"); await petit.p.waitForTimeout(1200);
await photo(petit.p, "640x360"); await petit.ctx.close();

const portrait = await ouvrir({ ...(devices["Pixel 9"] || devices["Pixel 7"]), deviceScaleFactor: 2 });
await photo(portrait.p, "portrait"); await portrait.ctx.close();

console.log(erreurs.length ? "erreurs : " + erreurs.join(" | ") : "aucune erreur");
await nav.close(); srv.arreter();
