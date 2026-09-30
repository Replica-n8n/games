import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : tous les trophées d'or exposés devant une grotte (aucun ne doit être
   caché par la gueule). Capture tools/captures/toto-trophees.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctx = await nav.newContext({ ...(devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"]), deviceScaleFactor: 2 });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(400);
const n = await p.evaluate(() => { for (const id of ["hud", "btns", "narr", "bossbar", "aide"]) document.getElementById(id).style.visibility = "hidden";
  const E = window.__essais; for (const x of E.EXPLOITS) E.palm.stats[x.id] = x.s[2];
  const P = E.P, g = { x: 3500 }; window.__zoom = 1.3; window.__camCible = { x: 3500, y: E.floorY(3500) - 60 };
  window.__t = setInterval(() => { E.ents.length = 0; P.x = 3500; P.y = 500; P.hp = 1e5; P.inv = 1; }, 4); return E.trophees().length; });
await p.waitForTimeout(800);
await p.screenshot({ path: path.join(HERE, "captures", "toto-trophees.png") });
await nav.close(); srv.arreter();
console.log(n + " trophées" + (erreurs.length ? " ; ERREURS : " + erreurs.join(" | ") : ""));
process.exit(erreurs.length ? 1 : 0);
