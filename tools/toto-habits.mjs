import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : gros plans de la requin dans chaque habit (naturel, os, ombre,
   bio-électrique), aux niveaux 1 et 3 de la mutation ; puis une grotte avec tous
   les trophées du palmarès, l'onglet Palmarès, et le choix de l'habit.
   Captures dans tools/captures/toto-habit-*.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CAPT = path.join(HERE, "captures");
fs.mkdirSync(CAPT, { recursive: true });
const srv = await servir();
const nav = await chromium.launch();
const ctx = await nav.newContext({ ...(devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"]), deviceScaleFactor: 3 });
const p = await ctx.newPage();
const erreurs = []; p.on("pageerror", (e) => erreurs.push(String(e)));
await p.addInitScript(() => { localStorage.setItem("toto-aide", "1");
  localStorage.setItem("toto-palmares", JSON.stringify({ v: 1, stats: { humains: 100, saut: 400, bateaux: 15, manges: 1000, alphas: 3, semes: 15, esquives: 30 }, alphas: { b0: true, b1: true, b2: true }, marques: {} })); });
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(500);
const pose = (habit, niv, bouche) => p.evaluate(([habit, niv, bouche]) => { const E = window.__essais, P = E.P;
  P.evo = habit ? { [habit]: niv } : {}; P.habit = habit; window.__zoom = 3.2; clearInterval(window.__t);
  window.__t = setInterval(() => { E.ents.length = 0; P.x = 1500; P.y = 430; P.vx = P.vy = 0; P.dang = 0; P.face = 1; P.hp = 1e5; P.inv = 0; P.biteT = bouche ? .2 : 0; P.biteCd = 9; }, 4); }, [habit, niv, bouche]);
for (const [habit, niv] of [["", 0], ["os", 1], ["os", 3], ["ombre", 1], ["ombre", 3], ["elec", 1], ["elec", 3]]) {
  await pose(habit, niv, false); await p.waitForTimeout(700);
  await p.screenshot({ path: path.join(CAPT, `toto-habit-${habit || "naturel"}-${niv}.png`) });
  if (niv === 3) { await pose(habit, niv, true); await p.waitForTimeout(250); await p.screenshot({ path: path.join(CAPT, `toto-habit-${habit}-${niv}-gueule.png`) }); }
}
/* Une grotte et ses trophées. */
await p.evaluate(() => { const E = window.__essais, P = E.P; clearInterval(window.__t); window.__zoom = 1.25; P.evo = { os: 2, ombre: 1 }; P.habit = "os"; P.bosses = { b0: true, b1: true };
  window.__t = setInterval(() => { P.x = 600; P.y = 930; P.vx = P.vy = 0; }, 4); });
await p.waitForTimeout(1500);
await p.screenshot({ path: path.join(CAPT, "toto-habit-grotte-trophees.png") });
await p.evaluate(() => { clearInterval(window.__t); window.__zoom = 0; });
await p.click("#bGrot"); await p.waitForTimeout(300);
await p.screenshot({ path: path.join(CAPT, "toto-habit-choix.png") });
await p.click("#tPalm"); await p.evaluate(() => document.querySelector("#pPalm").scrollTop = 9999); await p.waitForTimeout(250);
await p.screenshot({ path: path.join(CAPT, "toto-habit-palmares.png") });
console.log(erreurs.length ? "erreurs : " + erreurs.join(" | ") : "aucune erreur");
await nav.close(); srv.arreter();
