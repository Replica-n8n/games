import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : guidage vers le verrou (flèche rouge hors écran, cadre rouge à l'écran) et
   vers l'alpha ; et le narrateur qui ne radote pas. Captures toto-guidage-*.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CAPT = path.join(HERE, "captures");
const echecs = []; const verifie = (ok, q) => { console.log((ok ? "ok    " : "ÉCHEC ") + q); if (!ok) echecs.push(q); };
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctx = await nav.newContext({ ...devices["Pixel 9 landscape"], reducedMotion: "reduce" });
const p = await ctx.newPage();
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(400);
const place = (x, y, prep) => p.evaluate(([x, y, prep]) => { const E = window.__essais, P = E.P; eval(prep); clearInterval(window.__t);
  window.__t = setInterval(() => { P.x = x; P.y = y; P.vx = P.vy = 0; P.hp = 1e6; P.inv = 1; P.hunger = 100; }, 4); }, [x, y, prep]);
await place(1500, 700, "P.lvl=5;P.bosses={b0:true};Object.assign(P.nut,{p:0,f:0,m:0,mu:0})");
await p.waitForTimeout(1500); await p.screenshot({ path: path.join(CAPT, "toto-guidage-fleche.png") });
await place(2640, 700, ""); await p.waitForTimeout(1500); await p.screenshot({ path: path.join(CAPT, "toto-guidage-cadre.png") });
await place(1200, 700, "P.lvl=3;P.bosses={}"); await p.waitForTimeout(1500); await p.screenshot({ path: path.join(CAPT, "toto-guidage-alpha.png") });
/* Le narrateur : une esquive répétée ne se redit pas ; les répliques ne se suivent pas à l'identique. */
const r = await p.evaluate(() => { const E = window.__essais; const a = E.dire("esquive"), b = E.dire("esquive");
  const vus = []; for (let k = 0; k < 8; k++) { E.dire("boss"); vus.push(E.narr); } return { a, b, vus }; });
verifie(r.a && !r.b, "une deuxième esquive juste après ne relance pas la réplique");
verifie(r.vus.every((v, i) => i === 0 || v !== r.vus[i - 1]), "8 annonces d'alpha : jamais deux fois la même de suite");
verifie(new Set(r.vus).size >= 2, "plusieurs répliques différentes (" + new Set(r.vus).size + ")");
await nav.close(); srv.arreter();
console.log(echecs.length ? `\n${echecs.length} échec(s)` : "\nTout est vert."); process.exit(echecs.length ? 1 : 0);
