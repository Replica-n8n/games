import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : gros plans de la requin avec toutes les mutations au niveau 3 et toutes les
   marques du palmarès portées, gueule fermée puis ouverte ; puis l'onglet Palmarès et
   la grotte. Captures dans tools/captures/toto-marques-*.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CAPT = path.join(HERE, "captures");
fs.mkdirSync(CAPT, { recursive: true });
const srv = await servir();
const nav = await chromium.launch();
const ctx = await nav.newContext({ ...(devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"]), deviceScaleFactor: 3 });
const p = await ctx.newPage();
const erreurs = []; p.on("pageerror", (e) => erreurs.push(String(e)));
/* Un palmarès complet : tous les exploits à l'or, toutes les marques portées. */
await p.addInitScript(() => { const stats = { humains: 100, saut: 400, bateaux: 15, manges: 1000, alphas: 3, semes: 15, esquives: 30 };
  const marques = { dentor: true, hamecon: true, filet: true, griffes: true, ancre: true, harpon: true, croix: true };
  localStorage.setItem("toto-palmares", JSON.stringify({ v: 1, stats, alphas: { b0: true, b1: true, b2: true }, marques })); localStorage.setItem("toto-aide", "1"); });
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(500);
const pose = (bouche) => p.evaluate((bouche) => { const E = window.__essais, P = E.P; P.evo = { os: 3, ombre: 3, elec: 3, sonar: 3, estomac: 3, corps: 3 };
  window.__zoom = 3.2; clearInterval(window.__t); window.__t = setInterval(() => { E.ents.length = 0; P.x = 1500; P.y = 430; P.vx = P.vy = 0; P.dang = 0; P.face = 1; P.hp = 1e5; P.inv = 0; P.biteT = bouche ? .2 : 0; P.biteCd = 9; }, 4); }, bouche);
await pose(false); await p.waitForTimeout(1800);
await p.screenshot({ path: path.join(CAPT, "toto-marques-requin.png") });
await pose(true); await p.waitForTimeout(400);
await p.screenshot({ path: path.join(CAPT, "toto-marques-gueule.png") });
/* Sans aucune marque ni mutation, pour comparer. */
await p.evaluate(() => { const E = window.__essais; for (const m in E.palm.marques) E.palm.marques[m] = false; });
await p.evaluate(() => { const E = window.__essais, P = E.P; clearInterval(window.__t); window.__t = setInterval(() => { E.ents.length = 0; P.evo = {}; P.x = 1500; P.y = 430; P.vx = P.vy = 0; P.dang = 0; P.face = 1; P.biteT = 0; P.biteCd = 9; }, 4); });
await p.waitForTimeout(600);
await p.screenshot({ path: path.join(CAPT, "toto-marques-avant.png") });
/* Grotte : onglet Palmarès, puis Mutations avec une mutation clé payable. */
await p.evaluate(() => { const E = window.__essais, P = E.P; for (const m in E.palm.marques) E.palm.marques[m] = true; clearInterval(window.__t); window.__zoom = 0;
  P.evo = { sonar: 1 }; P.bosses = { b0: true }; Object.assign(P.nut, { p: 60, f: 40, m: 30, mu: 2 }); P.x = 600; P.y = 900; });
await p.waitForTimeout(900);
await p.click("#bGrot"); await p.waitForTimeout(300);
await p.screenshot({ path: path.join(CAPT, "toto-marques-mutations.png") });
await p.click("#tPalm"); await p.waitForTimeout(300);
await p.screenshot({ path: path.join(CAPT, "toto-marques-palmares.png") });
await p.evaluate(() => document.querySelector("#pPalm").scrollTop = 9999); await p.waitForTimeout(200);
await p.screenshot({ path: path.join(CAPT, "toto-marques-porter.png") });
console.log(erreurs.length ? "erreurs : " + erreurs.join(" | ") : "aucune erreur");
await nav.close(); srv.arreter();
