import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : les deux géants, ni proies ni ennemis. La Grande Blanche pendue à la jetée
   du port (le narrateur en parle une fois), et le mégalodon qui passe au fond du
   golfe sombre : seulement là, jamais dans un intérieur, une phrase la première
   fois, il repart, et les images/s tiennent pendant qu'il passe (AVEC la carte
   graphique). `node tools/toto-geants.mjs` ; captures tools/captures/toto-geants-*.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const p = await (await nav.newContext({ ...devices["Pixel 9 landscape"], deviceScaleFactor: 2 })).newPage();
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.message));
let echecs = 0; const verifie = (ok, m) => { console.log((ok ? "ok    " : "ÉCHEC ") + m); if (!ok) echecs++; };
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(400);
// la requin est tenue en place, rien ne la mord : on regarde le décor
const poser = (lvl, x, y) => p.evaluate(([lvl, x, y]) => { const E = window.__essais, P = E.P; clearInterval(window.__t); P.lvl = lvl; P.gates = { g1: 1, g2: 1, g3: 1 }; for (const g of E.GATES) g.hp = 0; P.bosses = { b0: 1, b1: 1, b2: 1, b3: 1 };
  window.__t = setInterval(() => { if (E.INT) return; P.x = x; P.y = y; P.vx = .6; P.vy = 0; P.dang = 0; P.face = 1; P.hp = 1e5; P.hunger = 100; for (const e of E.ents) if (e.boss || Math.hypot(e.x - x, e.y - y) < 520) e.dead = true; }, 4); }, [lvl, x, y]);
const etat = () => p.evaluate(() => { const E = window.__essais, m = E.mega; return { mega: m ? { x: Math.round(m.x), d: m.d, t: m.t } : null, cd: E.megaCd, narr: E.narr, vus: { ...E.P.vus } }; });

// 1. au bayou, il ne vient jamais
await poser(3, 1500, 700); await p.evaluate(() => { window.__essais.megaCd = 0; }); await p.waitForTimeout(700);
verifie(!(await etat()).mega, "au bayou, pas de mégalodon même quand son heure est venue");
await p.evaluate(() => { window.__essais.megaCd = 60; });

// 2. la Grande Blanche du port
const POT = await p.evaluate(() => window.__essais.POTENCE);
await poser(8, POT + 150, 372); await p.waitForTimeout(1300);
let e = await etat();
verifie(e.vus.blanche === true && /record du port/i.test(e.narr), `à la jetée du port, le narrateur en parle : « ${e.narr} »`);
await p.screenshot({ path: path.join(HERE, "captures", "toto-geants-blanche.png") });
await p.evaluate(() => { window.__essais.P.vus.blanche = true; document.getElementById("narr").textContent = ""; }); await poser(8, POT - 900, 372); await p.waitForTimeout(300); await poser(8, POT + 150, 372); await p.waitForTimeout(900);
verifie(!/record du port/i.test((await etat()).narr), "elle n'en reparle pas au passage suivant");

// 3. le mégalodon, dans le noir du golfe
await poser(17, 10400, 2150); await p.waitForTimeout(2600); // la caméra doit avoir rejoint la requin : il arrive par le bord de l'écran
 await p.evaluate(() => { window.__essais.megaCd = 0; document.getElementById("narr").textContent = ""; }); await p.waitForTimeout(400);
e = await etat(); verifie(!!e.mega, "au fond du golfe, il arrive quand son heure est venue");
verifie(e.cd > 100, `le prochain passage attend (${Math.round(e.cd)} s)`);
const vu = await p.evaluate(async () => { const E = window.__essais, t0 = performance.now(); let narr = "", centre = false;
  await new Promise((ok) => { const f = () => { const m = E.mega; if (m && /fond du golfe/.test(E.narr)) narr = E.narr; if (m && Math.abs(m.x - E.P.x) < 260) centre = true; if (centre || !m || performance.now() - t0 > 14000) ok(); else requestAnimationFrame(f); }; f(); }); return { narr, centre }; });
verifie(vu.centre, "il traverse l'écran"); verifie(!!vu.narr, `la première fois, le narrateur le dit : « ${vu.narr} »`);
await p.screenshot({ path: path.join(HERE, "captures", "toto-geants-megalodon.png") });
const ips = await p.evaluate(async () => { let n = 0; const t0 = performance.now(); await new Promise((ok) => { const f = () => { n++; performance.now() - t0 < 2000 ? requestAnimationFrame(f) : ok(); }; requestAnimationFrame(f); }); return Math.round(n / 2); });
verifie(ips >= 55, `pendant qu'il passe : ${ips} images/s`);
const parti = await p.evaluate(async () => { const E = window.__essais, t0 = performance.now(); await new Promise((ok) => { const f = () => (!E.mega || performance.now() - t0 > 25000) ? ok() : requestAnimationFrame(f); f(); }); return { parti: !E.mega, s: Math.round((performance.now() - t0) / 1000) }; });
verifie(parti.parti, `il repart (encore ${parti.s} s après le milieu de l'écran)`);
e = await etat(); verifie(e.vus.mega === true, "la rencontre est retenue");
const sauve = await p.evaluate(() => Object.keys(localStorage).some((k) => { try { const v = JSON.parse(localStorage.getItem(k)); return v && v.vus && v.vus.mega && v.vus.blanche; } catch (_) { return false; } }));
verifie(sauve, "et sauvée avec la partie");

// 4. au second passage, le narrateur se tait
await p.evaluate(() => { window.__essais.megaCd = 0; document.getElementById("narr").textContent = ""; });
const second = await p.evaluate(async () => { const E = window.__essais, t0 = performance.now(); let dit = false, vu = false; await new Promise((ok) => { const f = () => { if (E.mega) vu = true; if (/fond du golfe/.test(E.narr)) dit = true; performance.now() - t0 > 6000 ? ok() : requestAnimationFrame(f); }; f(); }); return { dit, vu }; });
verifie(second.vu && !second.dit, "au passage suivant, il passe sans un mot");

// 5. jamais dans un intérieur
const dedans = await p.evaluate(async () => { const E = window.__essais; clearInterval(window.__t); E.P.epaveVue = true; E.allerA("epave", "E"); E.megaCd = 0; await new Promise((ok) => setTimeout(ok, 800)); const r = { int: !!E.INT, mega: !!E.mega }; E.allerA(""); return r; });
verifie(dedans.int && !dedans.mega, "dans l'épave, pas de mégalodon");
verifie(!erreurs.length, "console sans erreur" + (erreurs.length ? " : " + [...new Set(erreurs)].join(" | ") : ""));
await nav.close(); srv.arreter();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est vert."); process.exit(echecs ? 1 : 0);
