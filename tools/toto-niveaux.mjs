import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : planche des trois niveaux de chaque habit (os, ombre, bio-électrique),
   gueule fermée, côte à côte. Capture tools/captures/toto-niveaux.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CAPT = path.join(HERE, "captures");
const srv = await servir();
const nav = await chromium.launch();
const ctx = await nav.newContext({ ...(devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"]), deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(400);
await p.evaluate(() => { document.getElementById("hud").style.display = "none"; document.getElementById("btns").style.display = "none"; document.getElementById("narr").style.display = "none"; });
const vue = p.viewportSize(), cadre = { x: vue.width / 2 - 170, y: vue.height / 2 - 95, width: 340, height: 190 };
const images = [];
for (const habit of ["os", "ombre", "elec"]) for (const niv of [1, 2, 3]) {
  await p.evaluate(([habit, niv]) => { const E = window.__essais, P = E.P; P.evo = { [habit]: niv }; P.habit = habit; window.__zoom = 2.6; clearInterval(window.__t);
    window.__t = setInterval(() => { E.ents.length = 0; P.x = 1500; P.y = 700; P.vx = P.vy = 0; P.dang = 0; P.face = 1; P.hp = 1e5; P.inv = 0; P.biteT = 0; P.biteCd = 9; P.t = 0; }, 4); }, [habit, niv]);
  await p.waitForTimeout(700);
  images.push({ habit, niv, b64: (await p.screenshot({ clip: cadre })).toString("base64") });
}
const noms = { os: "Os", ombre: "Ombre", elec: "Bio-électrique" };
const planche = await ctx.newPage();
await planche.setViewportSize({ width: 1080, height: 700 });
await planche.setContent(`<body style="margin:0;background:#14263B;font:700 18px sans-serif;color:#fff"><div style="display:grid;grid-template-columns:110px repeat(3,320px);gap:8px;padding:12px">
  <div></div>${[1, 2, 3].map((n) => `<div style="text-align:center">Niveau ${n}</div>`).join("")}
  ${["os", "ombre", "elec"].map((h) => `<div style="align-self:center">${noms[h]}</div>` + images.filter((i) => i.habit === h).map((i) => `<img style="width:320px;border-radius:6px" src="data:image/png;base64,${i.b64}">`).join("")).join("")}</div></body>`);
await planche.screenshot({ path: path.join(CAPT, "toto-niveaux.png"), fullPage: true });
await nav.close(); srv.arreter();
console.log("ok");
