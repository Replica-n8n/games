import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : filme la requin qui longe la surface au bayou puis à la plage, pour voir
   la parallaxe bouger. Vidéo dans tools/captures/toto-parallaxe.webm. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CAPT = path.join(HERE, "captures");
const srv = await servir();
const nav = await chromium.launch();
const profil = devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"];
const ctx = await nav.newContext({ ...profil, deviceScaleFactor: 1, recordVideo: { dir: CAPT, size: profil.viewport } });
const page = await ctx.newPage();
await page.goto(srv.base + "toto/");
await page.click("#bNew");
await page.evaluate(async () => {
  const P = window.__essais.P; P.gates.g1 = P.gates.g2 = true; for (const g of window.__essais.GATES) g.hp = 0;
  const nage = (x0, x1, ms) => new Promise((ok) => { const t0 = performance.now();
    const f = () => { const k = Math.min(1, (performance.now() - t0) / ms); P.x = x0 + (x1 - x0) * k; P.y = 390 + Math.sin(k * 12) * 30; P.vx = 6; P.vy = 0; P.hp = 1e6; P.hunger = 100; P.inv = 1; P.dang = 0; P.face = 1;
      k < 1 ? requestAnimationFrame(f) : ok(); }; f(); });
  /* Une seule traversée continue, pour voir aussi les passages d'une zone à l'autre. */
  await nage(1900, 6700, 22000);
});
const video = await page.video().path();
await ctx.close(); await nav.close(); srv.arreter();
const cible = path.join(CAPT, "toto-parallaxe.webm");
fs.renameSync(video, cible);
console.log(cible, Math.round(fs.statSync(cible).size / 1024) + " Ko");
