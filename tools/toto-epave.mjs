import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : tranche 1 des intérieurs (l'épave du Léviathan). Brèche fermée tant que
   Vieux-Borgne vit, entrée avec panneau de chargement, parois, frottement d'une
   Ancienne, poche d'air (grotte), mort et reprise dedans, sortie, images/s.
   Captures tools/captures/toto-epave-*.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url)), CAPT = path.join(HERE, "captures");
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctx = await nav.newContext({ ...(devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"]) });
const p = await ctx.newPage();
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.message));
let echecs = 0; const verifie = (ok, m) => { console.log((ok ? "ok    " : "ÉCHEC ") + m); if (!ok) echecs++; };
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(400);
const tient = (fn, ms) => p.evaluate(async ([src, ms]) => { const E = window.__essais, P = E.P, f0 = new Function("E", "P", src), t0 = performance.now();
  await new Promise((ok) => { const f = () => { f0(E, P); if (performance.now() - t0 > ms) ok(); else requestAnimationFrame(f); }; f(); }); }, [fn, ms]);
const etat = () => p.evaluate(() => { const E = window.__essais, P = E.P; return { int: E.INT && E.INT.id, x: P.x, y: P.y, hp: P.hp, st: E.state, obj: document.getElementById("objt").textContent, narr: E.narr, charge: document.getElementById("charge").classList.contains("on"), grotLieu: P.grotLieu, nearG: P.nearG }; });

// préparation : fin de partie, Ancienne niveau 18
await p.evaluate(() => { const P = window.__essais.P; P.lvl = 18; P.gates = { g1: true, g2: true, g3: true }; P.bosses = { b0: true, b1: true, b2: true }; P.evo = { os: 3, ombre: 3, elec: 3, sonar: 2 }; P.nut = { p: 0, f: 0, m: 0, mu: 0 }; for (const g of window.__essais.GATES) g.hp = 0; });
// 1. fermée tant que Vieux-Borgne vit
await tient("P.x=E.BRECHE.x+20;P.y=E.BRECHE.y;P.vx=P.vy=0;P.hp=1e5;P.hunger=100", 1200);
let r = await etat();
verifie(!r.int && !r.charge, "brèche fermée tant que Vieux-Borgne vit");
/* Vieux-Borgne, tout proche, s'annonce lui-même : sa barre « Vieux-Borgne » dit pourquoi. */
const barre = await p.textContent("#bname");
verifie(/Vieux-Borgne|encombrée/.test(r.narr + barre), "on sait pourquoi : " + r.narr + " / " + barre);
await p.evaluate(() => { const E = window.__essais, P = E.P; P.x = E.BRECHE.x + 400; P.y = E.BRECHE.y - 200; window.__camCible = { x: E.BRECHE.x + 150, y: E.BRECHE.y - 120 }; window.__zoom = .8; E.taire(); });
await p.waitForTimeout(500); await p.screenshot({ path: path.join(CAPT, "toto-epave-dehors-fermee.png") });
// 2. Vieux-Borgne vaincu : l'objectif, puis on entre
await p.evaluate(() => { const E = window.__essais, P = E.P; P.bosses.b3 = true; for (const e of E.ents) if (e.boss && e.boss.id === "b3") e.dead = true; window.__camCible = null; window.__zoom = 0; });
await p.waitForTimeout(400); r = await etat();
verifie(/épave/.test(r.obj), "objectif après Vieux-Borgne : " + r.obj);
await p.evaluate(() => { const E = window.__essais; window.__camCible = { x: E.BRECHE.x + 150, y: E.BRECHE.y - 120 }; window.__zoom = .8; });
await p.waitForTimeout(400); await p.screenshot({ path: path.join(CAPT, "toto-epave-dehors.png") });
await p.evaluate(() => { window.__camCible = null; window.__zoom = 0; });
await tient("P.x=E.BRECHE.x+10;P.y=E.BRECHE.y;P.vx=-1;P.vy=0", 150);
r = await etat(); verifie(r.charge, "le panneau de chargement s'affiche en passant la brèche");
await p.waitForTimeout(1200); r = await etat();
verifie(r.int === "epave" && r.st === "play", `dedans : ${r.int}, partie ${r.st}`);
verifie(/Léviathan/.test(r.narr), "première entrée annoncée : " + r.narr);
await p.waitForTimeout(300); r = await etat(); verifie(!/épave du Léviathan/.test(r.obj) || !/Entrer/.test(r.obj), "l'objectif « entrer » est rempli : " + r.obj);
await p.screenshot({ path: path.join(CAPT, "toto-epave-hall.png") });
// 3. les parois : foncer dans le plafond de la coursive ne fait jamais entrer dans un mur
const mur = await p.evaluate(async () => { const E = window.__essais, P = E.P, I = E.INT; let dedans = 0;
  for (let k = 0; k < 90; k++) { P.x = 15 * I.T + 40; P.y = I.oy + 9 * I.T + 40; P.vx = 0; P.vy = -14; P.dashT = 0; await new Promise((ok) => requestAnimationFrame(ok));
    const i = Math.floor(P.x / I.T), j = Math.floor((P.y - I.oy) / I.T); if (I.map[j][i] === "#") dedans++; }
  return { dedans, y: P.y - I.oy }; });
verifie(mur.dedans === 0, `jamais dans une paroi (${mur.dedans} images sur 90)`);
// 4. une Ancienne qui racle les parois ralentit et s'écorche
const fr = await p.evaluate(async () => { const E = window.__essais, P = E.P, I = E.INT; P.hp = 400; const hp0 = P.hp;
  for (let k = 0; k < 60; k++) { P.x = 5.5 * I.T; P.y = I.oy + 8 * I.T + P.r * .7; P.vx = 8; P.vy = -8; await new Promise((ok) => requestAnimationFrame(ok)); }
  return { perdu: hp0 - P.hp, cause: P.cause }; });
verifie(fr.perdu > 0 && /parois/.test(fr.cause), `frotter les parois coûte (${fr.perdu.toFixed(1)} PV, ${fr.cause})`);
// 5. la poche d'air : une grotte dedans
await tient("const g=E.INT.poches[0];P.x=g.x;P.y=g.y+40;P.vx=P.vy=0;P.hp=1e4", 500);
r = await etat(); verifie(r.nearG === 0, "la poche d'air sert de grotte (bouton Grotte)");
await p.screenshot({ path: path.join(CAPT, "toto-epave-poche.png") });
await p.evaluate(() => document.getElementById("bGrot").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })));
await p.waitForTimeout(300); await p.click("#bLeave"); r = await etat();
verifie(r.grotLieu === "epave", "muter dans la poche d'air la retient pour la reprise");
// 6. mourir dedans : on reprend dans la poche d'air
await p.evaluate(() => { const E = window.__essais, P = E.P; P.x = 30 * E.INT.T; P.y = E.INT.oy + 15 * E.INT.T; P.hunger = 0; P.hp = .01; });
await p.waitForTimeout(400);
const mort = await p.evaluate(() => ({ st: window.__essais.state, ou: document.getElementById("deadGrotte").textContent }));
verifie(mort.st === "dead" && /poche d'air/.test(mort.ou), "l'écran de mort renvoie à la poche d'air : " + mort.ou);
await p.click("#bResp");
await p.waitForTimeout(300); r = await etat();
verifie(r.int === "epave" && Math.abs(r.x - 3 * 80 - 40) < 80, `après la mort : reprise dans la poche d'air (${r.int}, x ${Math.round(r.x)})`);
// 7. reprendre la partie sauvegardée dedans
await p.reload(); await p.click("#bCont"); await p.waitForTimeout(700); r = await etat();
verifie(r.int === "epave", "la partie reprend dans l'épave (poche d'air)");
// 8. images/s dans l'escalier et la salle de bal
const ips = [];
for (const [i, j, nom] of [[25, 9, "escalier"], [43, 10, "salle-de-bal"]]) {
  const n = await p.evaluate(async ([i, j]) => { const E = window.__essais, P = E.P, I = E.INT; const t = setInterval(() => { P.x = i * I.T; P.y = I.oy + j * I.T; P.vx = P.vy = 0; P.hp = 1e5; P.inv = 1; P.hunger = 100; }, 4);
    await new Promise((ok) => setTimeout(ok, 1200)); let n = 0; const d = performance.now(); await new Promise((ok) => { const f = () => { n++; performance.now() - d < 1000 ? requestAnimationFrame(f) : ok(); }; requestAnimationFrame(f); }); clearInterval(t); return n; }, [i, j]);
  ips.push(n); await p.screenshot({ path: path.join(CAPT, `toto-epave-${nom}.png`) });
}
verifie(Math.min(...ips) >= 50, `images/s dedans : ${ips.join(", ")}`);
// 9. ressortir par la brèche
await tient("const I=E.INT;P.x=I.T*.5;P.y=I.oy+9*I.T;P.vx=-2;P.vy=0", 200);
await p.waitForTimeout(1200); r = await etat();
await p.waitForTimeout(1500);
const vb = await p.evaluate(() => window.__essais.ents.filter((e) => e.kind === "ani").length);
verifie(!r.int && Math.abs(r.x - 12100) < 400, `ressortie au golfe, devant la brèche (x ${Math.round(r.x)})`);
verifie(vb > 0, `le golfe se repeuple au retour (${vb} bêtes)`);
verifie(!erreurs.length, "console sans erreur" + (erreurs.length ? " : " + erreurs.join(" | ") : ""));
await nav.close(); srv.arreter();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est vert."); process.exit(echecs ? 1 : 0);
