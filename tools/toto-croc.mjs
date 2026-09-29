import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : gros plan d'un alligator ordinaire et de Ti-Croc (au repos, puis gueule
   ouverte en charge). `node tools/toto-croc.mjs avant` ou `apres` nomme la capture. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CAPT = path.join(HERE, "captures");
const nom = process.argv[2] || "apres";
const srv = await servir();
const nav = await chromium.launch();
const ctx = await nav.newContext({ ...(devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"]), deviceScaleFactor: 3 });
const p = await ctx.newPage();
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(400);
await p.evaluate(() => { for (const id of ["hud", "btns", "narr", "bossbar"]) document.getElementById(id).style.visibility = "hidden"; });
for (const [etat, mode] of [["repos", "circle"], ["charge", "charge"]]) {
  await p.evaluate((mode) => { const E = window.__essais, P = E.P; window.__zoom = 1.25;
    const croc = E.mkEnt("alligator", 1350, 760, { ai: "wander", spd: 0 });
    const boss = E.ents.find((e) => e.boss && e.boss.id === "b0");
    clearInterval(window.__t); window.__t = setInterval(() => { E.ents.length = 0; E.ents.push(croc, boss);
      croc.x = 1300; croc.y = 790; croc.vx = .8; croc.vy = 0; croc.face = 1; croc.bite = mode === "charge" ? .2 : 0;
      boss.x = 1660; boss.y = 800; boss.vx = -.8; boss.vy = 0; boss.face = -1; boss.mode = mode; boss.mt = 9;
      P.x = 1500; P.y = 700; P.vx = P.vy = 0; P.hp = 1e5; P.inv = 1; }, 4); }, mode);
  await p.waitForTimeout(900);
  await p.screenshot({ path: path.join(CAPT, `toto-croc-${nom}-${etat}.png`) });
}
await nav.close(); srv.arreter();
console.log("ok");
