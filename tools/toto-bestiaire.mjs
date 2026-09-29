import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : bestiaire, une espèce par case en gros plan (dessin figé, sans HUD).
   `node tools/toto-bestiaire.mjs poisson chat alligator` ; capture
   tools/captures/toto-bestiaire.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CAPT = path.join(HERE, "captures");
const especes = process.argv.slice(2).length ? process.argv.slice(2) : ["poisson", "chat", "alligator"];
const srv = await servir();
const nav = await chromium.launch();
const ctx = await nav.newContext({ ...(devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"]), deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(400);
await p.evaluate(() => { for (const id of ["hud", "btns", "narr", "bossbar", "aide"]) document.getElementById(id).style.visibility = "hidden"; });
const vue = p.viewportSize(), images = [];
for (const esp of especes) {
  await p.evaluate((esp) => { const E = window.__essais, P = E.P; const [nom, alpha] = esp.split(":");
    const b = E.mkEnt(nom, 0, 0, alpha ? { ai: "wander", spd: 0, r: ({ barracuda: 46, orque: 95, cachalot: 130 })[nom] || 62, boss: { id: "essai", nom: "alpha", reco: 1 }, mode: "circle" } : { ai: "wander", spd: 0 });
    const zoom = Math.min(4, 150 / (b.r * 3)); window.__zoom = zoom; clearInterval(window.__t);
    window.__camCible = { x: 1500, y: (nom === 'nageur' || nom === 'chasseur') ? 296 : 700 };
    window.__t = setInterval(() => { E.ents.length = 0; E.ents.push(b); P.x = 400; P.y = 600; P.vx = P.vy = 0; b.x = 1500; b.y = (b.type === 'nageur' || b.type === 'chasseur') ? 304 : 700; b.vx = .6; b.vy = 0; b.face = 1; b.hp = b.maxhp; P.hp = 1e5; P.inv = 1; }, 4); }, esp);
  await p.waitForTimeout(900);
  images.push({ esp, b64: (await p.screenshot({ clip: { x: vue.width / 2 - 190, y: vue.height / 2 - 100, width: 380, height: 200 } })).toString("base64") });
}
const planche = await ctx.newPage();
await planche.setViewportSize({ width: 1200, height: 400 });
await planche.setContent(`<body style="margin:0;background:#14263B;color:#fff;font:700 18px sans-serif"><div style="display:flex;flex-wrap:wrap;gap:10px;padding:12px">${images.map((i) => `<figure style="margin:0"><img style="width:380px;border-radius:6px;display:block" src="data:image/png;base64,${i.b64}"><figcaption style="padding:4px 2px">${i.esp}</figcaption></figure>`).join("")}</div></body>`);
await planche.screenshot({ path: path.join(CAPT, "toto-bestiaire.png"), fullPage: true });
await nav.close(); srv.arreter(); console.log("ok");
