import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : tranches 5 et 6, le laboratoire et le Spécimen Zéro. Vitres (Mâchoire en os),
   bocaux, cuves des captifs (libérés ou mangés), alerte et gardes, fléchettes qui
   endorment, cuves de mutagène qui soignent, Spécimen Zéro au robot, vraie fin et
   habit Mutante. Captures tools/captures/toto-labo-*.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url)), CAPT = path.join(HERE, "captures");
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const p = await (await nav.newContext({ ...(devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"]) })).newPage();
p.on("console", (m) => { if (m.text().startsWith("gardes")) console.log("      " + m.text()); });
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.stack.split(String.fromCharCode(10)).slice(0, 2).join(" < ")));
let echecs = 0; const verifie = (ok, m) => { console.log((ok ? "ok    " : "ÉCHEC ") + m); if (!ok) echecs++; };
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(300);
const MAX = { os: 3, ombre: 3, elec: 3, corps: 3, sonar: 2, estomac: 2 };
const prepare = (evo) => p.evaluate((evo) => { const E = window.__essais, P = E.P; if (E.INT) E.allerA(""); P.lvl = 20; P.evo = { ...evo }; P.habit = ""; P.bosses = { b0: 1, b1: 1, b2: 1, b3: 1, b4: 1 }; P.gates = { g1: 1, g2: 1, g3: 1 };
  P.epaveVue = true; P.vus = { epave: true, egouts: true }; P.carrefour = true; P.monde = { casse: ["egouts:29,10", "egouts:29,11", "egouts:29,12"], ouvert: ["egouts"] }; P.hunger = 100; P.alerte = 0; E.allerA("egouts", "E"); }, evo);
const va = (x, y, ms) => p.evaluate(async ([x, y, ms]) => { const E = window.__essais, P = E.P, I = E.INT, t0 = performance.now();
  await new Promise((ok) => { const f = () => { P.x = x * I.T; P.y = I.oy + y * I.T; P.vx = P.vy = 0; P.hunger = 100; if (performance.now() - t0 > ms) ok(); else requestAnimationFrame(f); }; f(); }); }, [x, y, ms]);
await prepare({ ...MAX, os: 0 }); await p.waitForTimeout(1300);
// du carrefour au labo
await p.evaluate(async () => { const E = window.__essais, P = E.P, t0 = performance.now();
  while (performance.now() - t0 < 6000 && !(E.INT && E.INT.id === "labo" && E.state === "play")) { if (E.state === "play" && E.INT.id === "egouts") { const I = E.INT; P.x = 45 * I.T; P.y = I.oy + 4.3 * I.T; P.vy = -2; } await new Promise((ok) => setTimeout(ok, 100)); } });
await p.waitForTimeout(400);
let r = await p.evaluate(() => ({ int: window.__essais.INT && window.__essais.INT.id, narr: window.__essais.narr, obj: document.getElementById("objt").textContent }));
verifie(r.int === "labo", "du carrefour au laboratoire : " + r.int);
verifie(/laboratoire/.test(r.narr), "annoncé : " + r.narr);
await p.screenshot({ path: path.join(CAPT, "toto-labo-arrivee.png") });
// la vitre de sécurité
const vitre = await p.evaluate(async () => { const E = window.__essais, P = E.P, I = E.INT, r = {};
  const pousse = async (ms) => { const t0 = performance.now(); await new Promise((ok) => { const f = () => { P.x = 9 * I.T; P.y = I.oy + 13 * I.T; P.vx = 3; P.vy = 0; P.dang = 0; P.face = 1; P.hp = 1e5; P.hunger = 100; if (performance.now() - t0 > ms) ok(); else requestAnimationFrame(f); }; f(); }); };
  P.biteCd = 0; await pousse(1500); r.sans = I.casse.has("10,13"); r.narr = E.narr; P.evo.os = 3; P.biteCd = 0; await pousse(2500); r.avec = I.casse.has("10,13"); r.alerte = P.alerte; r.expl = E.palm.stats.vitres || 0; return r; });
verifie(!vitre.sans, "sans Mâchoire en os, la vitre tient : " + vitre.narr);
verifie(vitre.avec && vitre.alerte > 5 && vitre.expl >= 1, `avec, elle vole en éclats (alerte ${Math.round(vitre.alerte)} %, exploit ${vitre.expl})`);
// la cuve d'un captif
const cap = await p.evaluate(async () => { const E = window.__essais, P = E.P, I = E.INT, l0 = E.palm.stats.liberes || 0; P.biteCd = 0;
  const t0 = performance.now(); await new Promise((ok) => { const f = () => { P.x = 13 * I.T + 20; P.y = I.oy + 6.5 * I.T; P.vx = 2; P.vy = 0; P.dang = 0; P.face = 1; P.hp = 1e5; if (I.casse.has("14,6") || performance.now() - t0 > 2500) ok(); else requestAnimationFrame(f); }; f(); });
  const c = E.ents.find((e) => e.type === "captif"); P.x = 40 * I.T; P.y = I.oy + 9 * I.T; await new Promise((ok) => setTimeout(ok, 10000));
  return { casse: I.casse.has("14,6"), captif: !!c, libres: (E.palm.stats.liberes || 0) - l0 }; });
verifie(cap.casse && cap.captif, "la cuve se brise, un captif en sort");
verifie(cap.libres === 1, "laissé filer, il est libéré (exploit Libératrice)");
await p.screenshot({ path: path.join(CAPT, "toto-labo-bocaux.png") });
// alerte, gardes, fléchettes
const al = await p.evaluate(async () => { const E = window.__essais, P = E.P, I = E.INT; for (const j of [12, 13, 14]) I.casse.add("26," + j); /* la seconde vitre ouverte : les gardes la voient d'où qu'ils sortent */ P.x = 24 * I.T; P.y = I.oy + 13 * I.T; E.alerter(40); await new Promise((ok) => setTimeout(ok, 300));
  const g = E.ents.filter((e) => e.type === "garde" && !e.dead).length; P.dodo = 0; const v0 = E.spd(); P.inv = 0; P.hp = 1e5; const t0 = performance.now();
  await new Promise((ok) => { const f = () => { P.x = 30 * I.T; P.y = I.oy + 13 * I.T; P.vx = P.vy = 0; P.inv = 0; P.biteCd = 9; P.dashT = 0; if (P.dodo > 0 || performance.now() - t0 > 9000) ok(); else requestAnimationFrame(f); }; f(); });
  const obj = document.getElementById("objt").textContent; console.log("gardes", E.ents.filter((e) => e.type === "garde").map((e) => (e.dead ? "mort " : "") + Math.round(e.x / I.T) + "," + Math.round((e.y - I.oy) / I.T) + " t" + e.tir.toFixed(1)).join(" "), "vus", E.ents.filter((e) => e.type === "garde" && !e.dead).map((e) => E.vueInt ? 1 : 0)); return { obj, g, dodo: P.dodo, lent: E.spd() / v0, barre: document.getElementById("bname").textContent }; });
verifie(/Spécimen/.test(al.obj), "objectif : " + al.obj);
verifie(al.g >= 2, `l'alerte à 40 % fait sortir ${al.g} gardes`);
verifie(al.dodo > 0 && al.lent < .9, `une fléchette l'endort (vitesse ×${al.lent.toFixed(2)})`);
verifie(/Alerte/.test(al.barre), "la barre montre l'alerte : " + al.barre);
await p.screenshot({ path: path.join(CAPT, "toto-labo-alerte.png") });
const baisse = await p.evaluate(async () => { const E = window.__essais, P = E.P, I = E.INT; for (const e of E.ents) if (e.type === "garde" || e.type === "drone") e.dead = true; const a0 = P.alerte; await new Promise((ok) => setTimeout(ok, 2000)); return [a0, P.alerte]; });
verifie(baisse[1] < baisse[0], `sans personne pour la voir, l'alerte redescend (${Math.round(baisse[0])} → ${Math.round(baisse[1])} %)`);
const soin = await p.evaluate(async () => { const E = window.__essais, P = E.P, I = E.INT; P.hp = 100; P.habit = "";
  const t0 = performance.now(); await new Promise((ok) => { const f = () => { P.x = 32.5 * I.T; P.y = I.oy + 4.5 * I.T; P.vx = P.vy = 0; P.inv = 1; if (performance.now() - t0 > 1500) ok(); else requestAnimationFrame(f); }; f(); }); return P.hp - 100; });
verifie(soin > 5, `une cuve de mutagène soigne (+${Math.round(soin)} PV)`);

// le Spécimen Zéro au robot, niveau 20 au maximum
for (const essai of [1, 2]) {
  await p.reload(); await p.click("#bNew"); await p.waitForTimeout(300); await prepare(MAX); await p.waitForTimeout(200);
  const rb = await p.evaluate(async () => { const E = window.__essais, P = E.P; E.allerA("labo", "E"); P.vus.labo = true; const I = E.INT, b = E.ents.find((e) => e.type === "specimen");
    P.x = 34 * I.T; P.y = I.oy + 9 * I.T; P.habit = "os"; const vieMax = 100 * 2.5 * 1.2 * (1 + .25 * 3); P.hp = vieMax; let perdu = 0, hpAvant = P.hp, t0 = performance.now(), colle = 0, recul = 0;
    await new Promise((ok) => { let last = performance.now(); const f = () => { const now = performance.now(), dt = (now - last) / 1000; last = now;
      if (P.hp < hpAvant) perdu += hpAvant - P.hp; P.hp = Math.max(P.hp, 1); hpAvant = P.hp; P.hunger = 100;
      const dx = b.x - P.x, dy = b.y - P.y, d = Math.hypot(dx, dy) || 1;
      if (b.mode === "charge" && d < 280 && P.dashCd <= 0) { P.dang = Math.atan2(dy, dx); E.dash(); }
      else if (recul > 0) { recul -= dt; P.vx = -dx / d * 5; P.vy = -dy / d * 5; }
      else { const c = b.r + P.r * 1.6; if (d > c) { P.vx = dx / d * 6; P.vy = dy / d * 6 } else { P.vx = P.vy = 0; colle += dt; if (colle > 1.2) { colle = 0; recul = .8 } } }
      P.dang = Math.atan2(dy, dx); P.face = dx > 0 ? 1 : -1;
      if (b.dead || now - t0 > 150000) ok(); else requestAnimationFrame(f); }; f(); });
    await new Promise((ok) => setTimeout(ok, 6000));
    return { tue: b.dead, s: Math.round((performance.now() - t0) / 1000) - 6, pct: Math.round(perdu / vieMax * 100), b6: !!P.bosses.b6, fin: document.getElementById("finale").classList.contains("on"), habit: P.habit, mut: P.evo.mutante }; });
  console.log(`      robot niv. 20 (essai ${essai}) : ${rb.tue ? "Spécimen tué en " + rb.s + " s" : "PAS tué en 150 s"}, vie perdue ${rb.pct} %`);
  verifie(rb.tue && rb.pct > 25 && rb.pct < 300, `essai ${essai} : le combat le plus dur du jeu, mais gagnable (${rb.s} s, ${rb.pct} %)`);
  if (essai === 1) {
    verifie(rb.b6 && rb.fin, "sa chute ouvre l'écran de la vraie fin");
    verifie(rb.mut === 1 && rb.habit === "mutante", "l'habit Mutante est débloqué et porté");
    await p.screenshot({ path: path.join(CAPT, "toto-labo-fin.png") });
    await p.click("#bFin"); await p.waitForTimeout(300);
    const apres = await p.evaluate(async () => { const E = window.__essais, P = E.P; P.hp = 100; await new Promise((ok) => setTimeout(ok, 1500)); return { st: E.state, hp: P.hp, obj: document.getElementById("objt").textContent }; });
    verifie(apres.st === "play" && apres.hp > 105, `on continue, et la Mutante se régénère (+${Math.round(apres.hp - 100)} PV en 1,5 s)`);
    await p.screenshot({ path: path.join(CAPT, "toto-labo-mutante.png") });
  }
}
verifie(!erreurs.length, "console sans erreur" + (erreurs.length ? " : " + erreurs.join(" | ") : ""));
await nav.close(); srv.arreter();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est vert."); process.exit(echecs ? 1 : 0);
