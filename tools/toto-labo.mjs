import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : le laboratoire (2e version) et le Spécimen Zéro en trois temps.
   Salle des spécimens ratés (cuves d'exposition géantes), bocaux et cuves de captifs
   qu'on brise en FONÇANT (pas en frôlant), le Spécimen derrière sa vitre (phase 1),
   en miroir de l'habit porté (phase 2), gonflé avec le bassin qui se vide et les
   captifs libérés en renfort (phase 3). Robot équipé comme une vraie fin de partie
   (4es niveaux). Captures tools/captures/toto-labo-*.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url)), CAPT = path.join(HERE, "captures");
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctx = await nav.newContext({ ...(devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"]) });
const p = await ctx.newPage();
p.on("console", (m) => { if (m.text().startsWith("dbg")) console.log("      " + m.text()); });
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.stack.split(String.fromCharCode(10)).slice(0, 2).join(" < ")));
let echecs = 0; const verifie = (ok, m) => { console.log((ok ? "ok    " : "ÉCHEC ") + m); if (!ok) echecs++; };
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
const MAX4 = { os: 4, ombre: 4, elec: 4, corps: 4, sonar: 3, estomac: 3 };
const entrer = (evo, habit) => p.evaluate(([evo, habit]) => { const E = window.__essais, P = E.P; if (E.INT) E.allerA(""); P.lvl = 20; P.evo = { ...evo, mutante: 0 }; P.habit = habit;
  P.bosses = { b0: 1, b1: 1, b2: 1, b3: 1, b4: 1 }; P.gates = { g1: 1, g2: 1, g3: 1 }; P.epaveVue = true; P.vus = { epave: true, egouts: true, aquarium: true, labo: true }; P.carrefour = true;
  P.monde = { casse: [], ouvert: ["egouts"], libres: [] }; P.hunger = 100; P.alerte = 0; P.nut = { p: 0, f: 0, m: 0, mu: 0, pu: 0 }; E.allerA("labo", "E"); }, [evo, habit]);
const tient = (src, ms) => p.evaluate(async ([src, ms]) => { const E = window.__essais, P = E.P, I = E.INT, f0 = new Function("E", "P", "I", src), t0 = performance.now();
  await new Promise((ok) => { const f = () => { f0(E, P, I); if (performance.now() - t0 > ms) ok(); else requestAnimationFrame(f); }; f(); }); }, [src, ms]);
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(300);
await entrer(MAX4, "os"); await p.waitForTimeout(1300);
await p.evaluate(() => { for (const id of ["narr", "aide"]) document.getElementById(id).style.visibility = "hidden"; });
await tient("P.x=24*I.T;P.y=I.oy+11*I.T;P.vx=P.vy=0;P.hp=1e6;P.inv=1;P.hunger=100", 600);
await p.screenshot({ path: path.join(CAPT, "toto-labo-specimens.png") });
/* plan large des cuves d'exposition, sans interface */
await p.evaluate(() => { for (const id of ["hud", "btns", "bossbar", "mini", "stat", "droite"]) { const el = document.getElementById(id); if (el) el.style.visibility = "hidden"; } const I = window.__essais.INT; window.__zoom = .55; window.__camCible = { x: 24 * I.T, y: I.oy + 8.5 * I.T }; });
await tient("P.x=24*I.T;P.y=I.oy+12*I.T;P.vx=P.vy=0;P.hp=1e6;P.inv=1", 700);
await p.screenshot({ path: path.join(CAPT, "toto-labo-cuves.png") });
await p.evaluate(() => { const I = window.__essais.INT; window.__camCible = { x: 43 * I.T, y: I.oy + 10 * I.T }; });
await tient("P.x=43*I.T;P.y=I.oy+8*I.T;P.vx=P.vy=0;P.hp=1e6;P.inv=1", 700);
await p.screenshot({ path: path.join(CAPT, "toto-labo-cuves-captifs.png") });
await p.evaluate(() => { const I = window.__essais.INT; window.__camCible = { x: 62 * I.T, y: I.oy + 8 * I.T }; });
await tient("P.x=58*I.T;P.y=I.oy+12*I.T;P.vx=P.vy=0;P.hp=1e6;P.inv=1", 700);
await p.screenshot({ path: path.join(CAPT, "toto-labo-bassin-essai.png") });
await p.evaluate(() => { window.__zoom = 0; window.__camCible = null; for (const id of ["hud", "btns", "bossbar", "mini", "stat", "droite"]) { const el = document.getElementById(id); if (el) el.style.visibility = ""; } });
// frôler un bocal ne le casse plus ; foncer dedans, oui
const boc = await p.evaluate(async () => { const E = window.__essais, P = E.P, I = E.INT, g = () => I.casse.has("15,17"); P.biteCd = 0;
  const t0 = performance.now(); await new Promise((ok) => { const f = () => { P.x = 14.2 * I.T; P.y = I.oy + 18 * I.T; P.vx = 3; P.vy = 0; P.dang = 0; P.face = 1; P.hp = 1e6; if (performance.now() - t0 > 1500) ok(); else requestAnimationFrame(f); }; f(); });
  const frole = g();
  for (let k = 0; k < 4 && !g(); k++) { P.x = 13.6 * I.T; P.y = I.oy + 18 * I.T; P.dashCd = 0; P.dang = 0; P.face = 1; E.dash(); await new Promise((ok) => setTimeout(ok, 450)); }
return { frole, casse: g(), mutant: E.ents.some((e) => e.type === "mutant" && !e.dead) }; });
verifie(!boc.frole, "frôler un bocal géant ne le casse plus");
verifie(boc.casse && boc.mutant, "foncer dedans le brise, et un raté du Centre en sort");
// une cuve de captif : au sprint, le captif sort et file vers la sortie
const cap = await p.evaluate(async () => { const E = window.__essais, P = E.P, I = E.INT;
  for (let k = 0; k < 4 && !I.casse.has("37,11"); k++) { P.x = 36 * I.T; P.y = I.oy + 12.5 * I.T; P.dashCd = 0; P.dang = 0; P.face = 1; E.dash(); await new Promise((ok) => setTimeout(ok, 450)); }
  const c = E.ents.find((e) => e.ai === "captif" && !e.dead); P.x = 60 * I.T; P.y = I.oy + 12 * I.T; await new Promise((ok) => setTimeout(ok, 13000));
  return { casse: I.casse.has("37,11"), r: c && c.r, libres: (P.monde.libres || []).length }; });
verifie(cap.casse && cap.r >= 40, `la cuve cède, un dauphin à sa taille en sort (rayon ${cap.r})`);
verifie(cap.libres === 1, "laissé filer, il est libéré et s'en souviendra");
await tient("P.x=43*I.T;P.y=I.oy+9*I.T;P.vx=P.vy=0;P.hp=1e6;P.inv=1", 500);
await p.screenshot({ path: path.join(CAPT, "toto-labo-captifs.png") });
// le Spécimen derrière sa vitre : intouchable, il cogne et appelle des renforts
const ph1 = await p.evaluate(async () => { const E = window.__essais, P = E.P, I = E.INT, b = E.ents.find((e) => e.type === "specimen"); const hp0 = b.hp; const t0 = performance.now();
  await new Promise((ok) => { const f = () => { P.x = 58 * I.T; P.y = I.oy + 12 * I.T; P.vx = P.vy = 0; P.hp = 1e6; P.inv = 1; if (performance.now() - t0 > 7000) ok(); else requestAnimationFrame(f); }; f(); });
  return { phase: b.phase, perdu: hp0 - b.hp, coups: I.coupsVitre || 0, gardes: E.ents.filter((e) => e.type === "garde" && !e.dead).length }; });
verifie(ph1.phase === 1 && ph1.perdu === 0, "phase 1 : derrière la vitre, il est intouchable");
verifie(ph1.coups >= 1 && ph1.gardes >= 2, `il cogne la vitre (${ph1.coups} coups) et appelle ${ph1.gardes} gardes`);
await p.screenshot({ path: path.join(CAPT, "toto-labo-vitre.png") });

// le combat complet, au robot, avec l'équipement d'une vraie fin de partie
for (const [habit, captifs] of [["os", 0], ["ombre", 3]]) {
  await p.reload(); await p.click("#bNew"); await p.waitForTimeout(300); await entrer(MAX4, habit); await p.waitForTimeout(200);
  const r = await p.evaluate(async ([captifs]) => { const E = window.__essais, P = E.P, I = E.INT, b = E.ents.find((e) => e.type === "specimen"), cl = (v, a, c) => Math.max(a, Math.min(c, v));
    P.monde.libres = [37, 42, 47].slice(0, captifs); P.x = 58 * I.T; P.y = I.oy + 12 * I.T;
    const vieMax = 100 * 2.5 * (1 + .25 * 4); P.hp = vieMax; let perdu = 0, hpAvant = P.hp, t0 = performance.now(), colle = 0, recul = 0, tVitre = 0, tP3 = 0, copie = "", bu = 0, allies = 0;
    await new Promise((ok) => { let last = performance.now(); const f = () => { const now = performance.now(), dt = (now - last) / 1000; last = now;
      if (P.hp < hpAvant) perdu += hpAvant - P.hp; hpAvant = P.hp; P.hunger = 100;
      if (b.phase === 1) { P.x = 61.1 * I.T; P.y = cl(b.y, I.oy + 4 * I.T, I.oy + 20 * I.T); P.vx = 3; P.vy = 0; P.dang = 0; P.face = 1; if (P.dashCd <= 0) E.dash(); }
      else { if (!tVitre) { tVitre = (now - t0) / 1000; copie = b.copie; }
        if (b.phase === 3 && !tP3) { tP3 = (now - t0) / 1000; allies = E.ents.filter((e) => e.allie).length; }
        /* comme une joueuse : un garde tout proche, on le gobe d'abord */
        const g = E.ents.filter((e) => e.type === "garde" && !e.dead).sort((u, v) => Math.hypot(u.x - P.x, u.y - P.y) - Math.hypot(v.x - P.x, v.y - P.y))[0];
        const cib = g && Math.hypot(g.x - P.x, g.y - P.y) < 350 && !(I.onde && !I.onde.fait) ? g : b;
        const o = I.onde, dx = cib.x - P.x, dy = cib.y - P.y, d = Math.hypot(dx, dy) || 1;
        if (o && !o.fait && o.t > .45 && Math.hypot(P.x - o.x, P.y - o.y) < o.R + P.r && P.dashCd <= 0) { P.dang = Math.atan2(-dy, -dx); E.dash(); }
        else if (b.mode === "charge" && d < 300 && P.dashCd <= 0) { P.dang = Math.atan2(dy, dx); E.dash(); }
        else if (recul > 0) { recul -= dt; P.vx = -dx / d * 5; P.vy = -dy / d * 5; }
        else { const c = cib.r + P.r * 1.5; if (d > c) { P.vx = dx / d * 6; P.vy = dy / d * 6 } else { P.vx = P.vy = 0; colle += dt; if (colle > 1.2) { colle = 0; recul = .8 } } }
        P.dang = Math.atan2(dy, dx); P.face = dx > 0 ? 1 : -1; }
      bu = b.bu || 0; if (b.dead || E.state === "dead" || now - t0 > 200000) ok(); else requestAnimationFrame(f); }; f(); });
    return { morte: E.state === "dead", tue: b.dead, s: Math.round((performance.now() - t0) / 1000), tVitre: Math.round(tVitre), tP3: Math.round(tP3), pct: Math.round(perdu / vieMax * 100), copie, bu, allies }; }, [captifs]);
  console.log(`      robot (habit ${habit}, ${captifs} captif(s) libéré(s)) : ${r.morte ? "la requin MEURT à " + r.s + " s" : r.tue ? "tué en " + r.s + " s" : "PAS tué en 200 s"} ; vitre tombée à ${r.tVitre} s, copie « ${r.copie} », phase 3 à ${r.tP3} s avec ${r.allies} allié(s), a bu ${r.bu} fois, vie perdue ${r.pct} %`);
  verifie(r.tue && r.s >= (captifs ? 25 : 35) && r.s <= 150, `habit ${habit} : un combat long et à épisodes (${r.s} s${captifs ? ", plus court avec les captifs" : ""})`);
  verifie(r.pct >= 40 && r.pct < 100, `habit ${habit} : une vraie menace (${r.pct} % de vie perdue)`);
  verifie(r.copie === habit, `il copie l'habit porté (${r.copie})`);
  if (captifs) verifie(r.allies === captifs, `les ${captifs} captifs libérés viennent aider en phase 3`);
  if (habit === "ombre") await p.screenshot({ path: path.join(CAPT, "toto-labo-fin-combat.png") });
}
verifie(!erreurs.length, "console sans erreur" + (erreurs.length ? " : " + erreurs.join(" | ") : ""));
await nav.close(); srv.arreter();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est vert."); process.exit(echecs ? 1 : 0);
