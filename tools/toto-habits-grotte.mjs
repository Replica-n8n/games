import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : le choix d'habit dans la grotte (cartes en grille, chacune avec son bonus),
   et des gros plans de la salle des bocaux du labo (bocaux, cuves, dauphin libéré,
   anguille d'un bocal). Captures toto-habits-grotte.png, toto-labo-gros-plan-*.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url)), CAPT = path.join(HERE, "captures");
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const p = await (await nav.newContext({ ...devices["Pixel 9 landscape"], deviceScaleFactor: 2 })).newPage();
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.message));
let echecs = 0; const verifie = (ok, m) => { console.log((ok ? "ok    " : "ÉCHEC ") + m); if (!ok) echecs++; };
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(300);
await p.evaluate(() => { const E = window.__essais, P = E.P; P.evo = { os: 3, ombre: 2, elec: 1, mutante: 1 }; P.habit = "mutante"; P.x = 600; P.y = E.floorY(600) - 120; });
await p.waitForTimeout(400); await p.evaluate(() => document.getElementById("bGrot").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))); await p.waitForTimeout(300);
const cartes = await p.evaluate(() => [...document.querySelectorAll("#habits .marque")].map((b) => { const r = b.getBoundingClientRect(); return { t: b.innerText.replace(/\s+/g, " "), w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left) }; }));
verifie(cartes.length === 5 && cartes.every((c) => / /.test(c.t)), "5 habits, chacun avec son bonus : " + cartes.map((c) => c.t).join(" | "));
verifie(new Set(cartes.map((c) => c.w)).size === 1 && new Set(cartes.map((c) => c.x)).size === 2, `cartes de même taille, sur deux colonnes (${cartes.map((c) => c.w + "×" + c.h).join(", ")})`);
await p.locator("#habits").screenshot({ path: path.join(CAPT, "toto-habits-grotte.png") });
await p.click("#bLeave");
// gros plans du labo
await p.evaluate(() => { const E = window.__essais, P = E.P; P.lvl = 20; P.bosses = { b0: 1, b1: 1, b2: 1, b3: 1, b4: 1 }; E.allerA("labo", "E"); for (const id of ["hud", "btns", "narr", "bossbar", "aide", "mini", "stat", "droite"]) { const el = document.getElementById(id); if (el) el.style.visibility = "hidden"; } });
const plan = async (nom, x, y, zoom, prep) => { await p.evaluate(([x, y, zoom, prep]) => { const E = window.__essais, P = E.P, I = E.INT; window.__zoom = zoom; window.__camCible = { x: x * I.T, y: I.oy + y * I.T }; eval(prep || ""); clearInterval(window.__t);
    window.__t = setInterval(() => { P.x = 40 * I.T; P.y = I.oy + 9 * I.T; P.hp = 1e6; P.inv = 1; P.hunger = 100; }, 4); }, [x, y, zoom, prep]); await p.waitForTimeout(700); await p.screenshot({ path: path.join(CAPT, `toto-labo-gros-plan-${nom}.png`) }); };
await plan("salle", 16.5, 7.5, .9, "for(const e of E.ents)if(e.type==='drone')e.dead=true");
await plan("cuve-et-bocaux", 14, 6, 2, "");
await plan("dauphin", 14, 6.5, 2, "const I=E.INT;E.ents.push(E.mkEnt('captif',14*I.T+40,I.oy+6.5*I.T,{libreT:99,spd:0}));I.casse.add('14,6')");
await plan("anguille", 13, 5.5, 2, "const I=E.INT;I.casse.add('13,5');E.ents.push(E.mkEnt('anguille',13*I.T+40,I.oy+5.8*I.T,{spd:0}))");
verifie(!erreurs.length, "console sans erreur " + erreurs.join(" | "));
await nav.close(); srv.arreter();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est vert."); process.exit(echecs ? 1 : 0);
