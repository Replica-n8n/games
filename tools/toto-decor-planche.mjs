import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : planche du décor sans HUD, cadrée par la caméra (pas par la requin) :
   ciel et nuages, fond de chaque zone. `node tools/toto-decor-planche.mjs` ;
   capture tools/captures/toto-decor-planche.png. Échoue sur une erreur de page. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const VUES = [["ciel du bayou", 1200, -40, .7], ["ciel du large", 7000, -40, .7], ["fond du bayou", 1300, "fond", 1],
  ["fond de la plage", 4200, "fond", 1], ["fond du large", 7200, "fond", 1], ["ville", 4000, 180, .8]];
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctx = await nav.newContext({ ...(devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"]), deviceScaleFactor: 1.5 });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(400);
await p.evaluate(() => { for (const id of ["hud", "btns", "narr", "bossbar", "aide", "mini", "stat"]) { const el = document.getElementById(id); if (el) el.style.visibility = "hidden"; } const P = window.__essais.P; P.gates.g1 = P.gates.g2 = true; });
const images = [];
for (const [nom, x, y, z] of VUES) {
  await p.evaluate(([x, y, z]) => { const E = window.__essais, P = E.P; clearInterval(window.__t); window.__zoom = z;
    const cy = y === "fond" ? E.floorY(x) - 140 : y; window.__camCible = { x, y: cy };
    window.__t = setInterval(() => { E.ents.length = 0; P.x = x - 3000; P.y = 600; P.vx = P.vy = 0; P.hp = 1e5; P.inv = 1; }, 4); }, [x, y, z]);
  await p.waitForTimeout(700);
  images.push({ nom, b64: (await p.screenshot()).toString("base64") });
}
const planche = await ctx.newPage();
await planche.setViewportSize({ width: 1400, height: 400 });
await planche.setContent(`<body style="margin:0;background:#14263B;color:#fff;font:700 16px sans-serif"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px">${images.map((i) => `<figure style="margin:0"><img style="width:100%;border-radius:6px;display:block" src="data:image/png;base64,${i.b64}"><figcaption style="padding:3px 2px">${i.nom}</figcaption></figure>`).join("")}</div></body>`);
await planche.screenshot({ path: path.join(HERE, "captures", "toto-decor-planche.png"), fullPage: true });
await nav.close(); srv.arreter();
if (erreurs.length) { console.log("ERREURS :", erreurs); process.exit(1); }
console.log("ok");
