import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : photographie le décor de chaque zone (Pixel 9 en paysage), la requin
   figée près de la surface, et mesure les images par seconde à chaque endroit.
   Captures dans tools/captures/toto-decor-*.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CAPT = path.join(HERE, "captures");
fs.mkdirSync(CAPT, { recursive: true });
const LIEUX = [["bayou", 1500, 380], ["bayou-cabane", 0, 380], ["plage", 3500, 380], ["plage-ville", 4600, 380], ["large", 7100, 380], ["bayou-fond", 1500, 800]];

const srv = await servir();
/* Avec la carte graphique : sans elle, Chromium peint en logiciel et chaque dégradé
   plein écran coûte ~4 ms, d'où de faux creux à 11-15 images/s (vécu le 2026-09-28 :
   61 images/s partout avec la carte graphique). `LOGICIEL=1` pour l'ancien mode. */
const nav = await chromium.launch({ args: process.env.LOGICIEL ? [] : ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctx = await nav.newContext({ ...(devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"]) });
const page = await ctx.newPage();
const erreurs = [];
page.on("pageerror", (e) => erreurs.push(String(e)));
await page.goto(srv.base + "toto/");
await page.click("#bNew");
await page.waitForTimeout(300);
/* Les verrous ouverts, pour aller partout. */
await page.evaluate(() => { const P = window.__essais.P; P.gates.g1 = P.gates.g2 = true; P.hunger = 1e9; });

let echec = false;
for (let [nom, x, y] of LIEUX) {
  if (nom === "bayou-cabane") {
    /* La première cabane du bayou, pour la voir de près. */
    x = await page.evaluate(() => { for (let i = 0; i < 20; i++) { const h = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
      const xx = i * 230 + h(i) * 120; if (xx > 40 && xx < 2700 && h(i + 5) >= .25 && h(i + 11) > .84) return xx; } return 900; });
  }
  const ips = await page.evaluate(async ([x, y]) => {
    const P = window.__essais.P;
    const fige = () => { P.x = x; P.y = y; P.vx = P.vy = 0; P.hp = 1e6; P.inv = 1; };
    const t = setInterval(fige, 4); fige();
    await new Promise((ok) => setTimeout(ok, 1800));
    let n = 0; const debut = performance.now();
    await new Promise((ok) => { const f = () => { n++; performance.now() - debut < 1000 ? requestAnimationFrame(f) : ok(); }; requestAnimationFrame(f); });
    window.__fige = t;
    return n;
  }, [x, y]);
  await page.screenshot({ path: path.join(CAPT, `toto-decor-${nom}.png`) });
  await page.evaluate(() => clearInterval(window.__fige));
  console.log(`${nom.padEnd(13)} x=${Math.round(x)}  ${ips} images/s`);
  if (ips < (process.env.LOGICIEL ? 20 : 50)) echec = true;
}
if (erreurs.length) { console.log("erreurs : " + erreurs.join(" | ")); echec = true; }
await nav.close();
srv.arreter();
process.exit(echec ? 1 : 0);
