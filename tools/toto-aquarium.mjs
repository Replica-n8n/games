import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : planche du Grand Bassin sans interface (vue d'ensemble, gradins, vannes,
   fond), en pleine vague et entre deux vagues, et images/s.
   `node tools/toto-aquarium.mjs [nom]` ; capture tools/captures/toto-aquarium[-nom].png. */
const HERE = path.dirname(fileURLToPath(import.meta.url)), nom = process.argv[2] ? "-" + process.argv[2] : "";
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctx = await nav.newContext({ ...(devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"]), deviceScaleFactor: 1.5 });
const p = await ctx.newPage();
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.message));
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(300);
await p.evaluate(() => { const E = window.__essais, P = E.P; P.lvl = 20; P.evo = { os: 3, ombre: 3, elec: 3 }; P.habit = "os"; E.allerA("aquarium", "E");
  for (const id of ["hud", "btns", "narr", "bossbar", "aide", "mini", "stat", "droite"]) { const el = document.getElementById(id); if (el) el.style.visibility = "hidden"; } });
const images = [];
const vue = async (titre, x, y, z, prep) => { await p.evaluate(([x, y, z, prep]) => { const E = window.__essais, P = E.P, I = E.INT; window.__zoom = z; window.__camCible = { x: x * I.T, y: I.oy + y * I.T }; eval(prep || "");
    clearInterval(window.__t); window.__t = setInterval(() => { P.x = 17 * I.T; P.y = I.oy + 9 * I.T; P.hp = 1e6; P.inv = 1; P.hunger = 100; }, 4); }, [x, y, z, prep]);
  await p.waitForTimeout(900); images.push({ titre, b64: (await p.screenshot()).toString("base64") }); };
await vue("vue d'ensemble, entre deux vagues", 17, 8.5, .42, "");
await vue("les gradins derrière la vitre", 12, 2.5, 1.1, "");
await vue("une vanne et le fond", 9, 14.2, 1.1, "");
await vue("le public acclame", 20, 1.8, 1.3, "E.INT.acclame=99");
await vue("en pleine vague", 17, 8, .7, "E.lancerVague();for(const q of E.INT.arene.aLacher)q.d=0");
const ips = await p.evaluate(async () => { let n = 0, pire = 0, l = performance.now(); const d = l; await new Promise((ok) => { const f = () => { const q = performance.now(); pire = Math.max(pire, q - l); l = q; n++; q - d < 2000 ? requestAnimationFrame(f) : ok(); }; requestAnimationFrame(f); }); return [n / 2, Math.round(pire)]; });
const planche = await ctx.newPage(); await planche.setViewportSize({ width: 1400, height: 400 });
await planche.setContent(`<body style="margin:0;background:#14263B;color:#fff;font:700 16px sans-serif"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px">${images.map((i) => `<figure style="margin:0"><img style="width:100%;border-radius:6px;display:block" src="data:image/png;base64,${i.b64}"><figcaption style="padding:3px 2px">${i.titre}</figcaption></figure>`).join("")}</div></body>`);
await planche.screenshot({ path: path.join(HERE, "captures", `toto-aquarium${nom}.png`), fullPage: true });
await nav.close(); srv.arreter();
console.log(`images/s : ${ips[0]}, pire image ${ips[1]} ms` + (erreurs.length ? " ; ERREURS : " + erreurs.join(" | ") : ""));
process.exit(erreurs.length || ips[0] < 50 ? 1 : 0);
