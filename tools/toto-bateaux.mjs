import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : planche des bateaux et du baril en gros plan (sans HUD).
   Chasseur à l'arrêt, chasseur lancé (sillage), Rustin, baril.
   `node tools/toto-bateaux.mjs` ; capture tools/captures/toto-bateaux.png.
   Échoue si la page lève une erreur pendant le dessin. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CAPT = path.join(HERE, "captures");
const cas = [
  { nom: "chasseur à l'arrêt", rustin: false, vx: 0, zoom: 2.4 },
  { nom: "chasseur lancé", rustin: false, vx: 2.2, zoom: 2.4 },
  { nom: "Rustin", rustin: true, vx: 0, zoom: 1.5 },
  { nom: "Rustin lancé", rustin: true, vx: -2.4, zoom: 1.5 },
  { nom: "baril", baril: true, zoom: 5 },
];
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctx = await nav.newContext({ ...(devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"]), deviceScaleFactor: 2 });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(400);
await p.evaluate(() => { for (const id of ["hud", "btns", "narr", "bossbar", "aide"]) document.getElementById(id).style.visibility = "hidden"; });
const vue = p.viewportSize(), images = [];
for (const c of cas) {
  await p.evaluate((c) => { const E = window.__essais, P = E.P; clearInterval(window.__t); window.__zoom = c.zoom;
    const b = c.baril ? { kind: "barrel", x: 1500, y: 360, vy: 0, t: 0, dead: false, r: 10, flash: 0 }
      : { kind: "boat", rustin: c.rustin, x: 1500, y: 296, vx: c.vx, w: c.rustin ? 190 : 120, hp: 70, maxhp: 90, spd: 0, fire: 99, bar: 99, t: 0, flash: 0, dead: false, leave: false, r: 60 };
    window.__camCible = { x: 1500, y: c.baril ? 360 : c.rustin ? 250 : 275 };
    window.__t = setInterval(() => { E.ents.length = 0; E.ents.push(b); P.x = 1500 + (c.vx < 0 ? -250 : 250); P.y = 520; P.vx = P.vy = 0; P.hp = 1e5; P.inv = 1;
      if (c.baril) { b.y = 360; b.vy = 0; b.t = 1; } else { b.x = 1500; b.vx = c.vx; b.fire = b.bar = 99; } }, 4); }, c);
  await p.waitForTimeout(900);
  images.push({ nom: c.nom, b64: (await p.screenshot({ clip: { x: vue.width / 2 - 200, y: vue.height / 2 - 150, width: 400, height: 260 } })).toString("base64") });
}
const planche = await ctx.newPage();
await planche.setViewportSize({ width: 1260, height: 400 });
await planche.setContent(`<body style="margin:0;background:#14263B;color:#fff;font:700 18px sans-serif"><div style="display:flex;flex-wrap:wrap;gap:10px;padding:12px">${images.map((i) => `<figure style="margin:0"><img style="width:400px;border-radius:6px;display:block" src="data:image/png;base64,${i.b64}"><figcaption style="padding:4px 2px">${i.nom}</figcaption></figure>`).join("")}</div></body>`);
await planche.screenshot({ path: path.join(CAPT, "toto-bateaux.png"), fullPage: true });
await nav.close(); srv.arreter();
if (erreurs.length) { console.log("ERREURS :", erreurs); process.exit(1); }
console.log("ok");
