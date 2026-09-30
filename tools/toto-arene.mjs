import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : tranche 4, le Grand Bassin. Entrée depuis le carrefour, vagues qui
   s'enchaînent, alphas de spectacle (sans toucher aux vrais alphas), mutagène pur,
   4e niveau de mutation, couronne au palmarès, et un robot qui joue les vagues
   au niveau 20 pour mesurer jusqu'où l'on tient. Captures toto-arene-*.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url)), CAPT = path.join(HERE, "captures");
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const p = await (await nav.newContext({ ...(devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"]) })).newPage();
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.stack.split(String.fromCharCode(10)).slice(0, 3).join(" < ")));
let echecs = 0; const verifie = (ok, m) => { console.log((ok ? "ok    " : "ÉCHEC ") + m); if (!ok) echecs++; };
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(300);
const MAX = { os: 3, ombre: 3, elec: 3, corps: 3, sonar: 2, estomac: 2 };
const prepare = () => p.evaluate((MAX) => { const E = window.__essais, P = E.P; if (E.INT) E.allerA(""); P.lvl = 20; P.evo = { ...MAX }; P.habit = "os"; P.bosses = { b0: 1, b1: 1, b2: 1, b3: 1, b4: 1 }; P.gates = { g1: 1, g2: 1, g3: 1 };
  P.epaveVue = true; P.vus = { epave: true, egouts: true }; P.carrefour = true; P.monde = { casse: ["egouts:29,10", "egouts:29,11", "egouts:29,12"], ouvert: ["egouts"] }; P.hunger = 100; E.allerA("egouts", "E"); }, MAX);
await prepare(); await p.waitForTimeout(1300);
await p.evaluate(async () => { const E = window.__essais, P = E.P, t0 = performance.now();
  while (performance.now() - t0 < 5000 && !(E.INT && E.INT.id === "aquarium" && E.state === "play")) { if (E.state === "play" && E.INT.id === "egouts") { const I = E.INT; P.x = 49.4 * I.T; P.y = I.oy + 13.5 * I.T; P.vx = 2; } await new Promise((ok) => setTimeout(ok, 100)); } });
await p.waitForTimeout(300);
let r = await p.evaluate(() => ({ int: window.__essais.INT && window.__essais.INT.id, obj: document.getElementById("objt").textContent, narr: window.__essais.narr }));
verifie(r.int === "aquarium", "du carrefour aux bassins publics : " + r.int);
verifie(/Grand Bassin/.test(r.obj + r.narr), "annoncé : " + r.narr);
await p.screenshot({ path: path.join(CAPT, "toto-arene-arrivee.png") });
// vague 1 : on la gagne (bêtes retirées), récompense
await p.waitForTimeout(4500);
const v1 = await p.evaluate(async () => { const E = window.__essais, P = E.P, I = E.INT; const n = E.ents.filter((e) => e.arene).length; const pu0 = P.nut.pu || 0;
  await new Promise((ok) => setTimeout(ok, 2500)); for (const e of E.ents) if (e.arene) e.dead = true; await new Promise((ok) => setTimeout(ok, 400));
  return { n, vague: I.arene.vague, gain: (P.nut.pu || 0) - pu0, record: E.palm.stats.arene, etat: I.arene.etat }; });
verifie(v1.vague === 1 && v1.n > 0, `vague 1 lâchée (${v1.n} bêtes déjà sorties des vannes)`);
verifie(v1.gain === 2 && v1.record === 1 && v1.etat === "attente", `vague gagnée : +${v1.gain} mutagène pur, record ${v1.record}, répit`);
// vague 5 : un alpha de spectacle
const v5 = await p.evaluate(async () => { const E = window.__essais, P = E.P, I = E.INT; I.arene.vague = 4; E.lancerVague(); await new Promise((ok) => setTimeout(ok, 3500));
  const b = E.ents.find((e) => e.boss && e.boss.spectacle && !e.dead); if (b) b.hp = 1; const t0 = performance.now();
  await new Promise((ok) => { const f = () => { if (b) { P.x = b.x - b.r - P.r; P.y = b.y; P.dang = 0; P.face = 1; P.biteCd = Math.min(P.biteCd, .1); } P.hp = 1e5; if (!b || b.dead || performance.now() - t0 > 3000) ok(); else requestAnimationFrame(f); }; f(); });
  return { nom: b && b.boss.nom, mort: b && b.dead, b0: P.bosses.spectacle_b0, vraiB0: P.bosses.b0 }; });
verifie(!!v5.nom, "vague 5 : " + v5.nom);
verifie(v5.mort && !v5.b0, "il tombe sans compter pour un vrai alpha");
await p.screenshot({ path: path.join(CAPT, "toto-arene-spectacle.png") });
// 4e niveau
const m4 = await p.evaluate(() => { const E = window.__essais, P = E.P; P.nut = { p: 999, f: 999, m: 999, mu: 99, pu: 30 }; P.x = E.INT.w * E.INT.T / 2; return 0; });
// images/s pendant une grosse vague
const ips = await p.evaluate(async () => { const E = window.__essais, P = E.P, I = E.INT; for (const e of E.ents) if (e.arene) e.dead = true; I.arene.vague = 11; E.lancerVague();
  const t = setInterval(() => { P.hp = 1e5; P.inv = 1; }, 4); await new Promise((ok) => setTimeout(ok, 4500));
  let n = 0, pire = 0, l = performance.now(); const d = l; await new Promise((ok) => { const f = () => { const q = performance.now(); pire = Math.max(pire, q - l); l = q; n++; q - d < 2000 ? requestAnimationFrame(f) : ok(); }; requestAnimationFrame(f); }); clearInterval(t);
  return [n / 2, Math.round(pire), E.ents.filter((e) => e.arene && !e.dead).length]; });
verifie(ips[0] >= 50, `images/s en pleine vague 12 (${ips[2]} bêtes) : ${ips[0]}, pire image ${ips[1]} ms`);
await p.screenshot({ path: path.join(CAPT, "toto-arene-vague.png") });

// robot : jusqu'où tient une Ancienne niveau 20 au maximum ?
await p.reload(); await p.click("#bNew"); await p.waitForTimeout(300); await prepare(); await p.waitForTimeout(300);
const robot = await p.evaluate(async () => { const E = window.__essais, P = E.P; E.allerA("aquarium", "E"); const I = E.INT; P.x = I.w * I.T / 2; P.y = I.oy + 8 * I.T;
  const t0 = performance.now(); let recul = 0, colle = 0;
  await new Promise((ok) => { let last = performance.now(); const f = () => { const now = performance.now(), dt = (now - last) / 1000; last = now; P.hunger = 100;
    const cibles = E.ents.filter((e) => !e.dead && e.arene); if (!cibles.length) { P.vx *= .9; P.vy *= .9; } else {
      const c = cibles.sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y))[0], dx = c.x - P.x, dy = c.y - P.y, d = Math.hypot(dx, dy) || 1;
      if (c.boss && c.mode === "charge" && d < 260 && P.dashCd <= 0) { P.dang = Math.atan2(dy, dx); E.dash(); }
      else if (P.saisi > 0 && P.dashCd <= 0) E.dash();
      else if (recul > 0) { recul -= dt; P.vx = -dx / d * 5; P.vy = -dy / d * 5; }
      else { const cible = c.r + P.r * 1.4; if (d > cible) { P.vx = dx / d * 6; P.vy = dy / d * 6 } else { P.vx = P.vy = 0; colle += dt; if (colle > 1.2) { colle = 0; recul = .7 } } if (d < 240 && P.dashCd <= 0 && cibles.length > 3) E.dash(); }
      P.dang = Math.atan2(dy, dx); P.face = dx > 0 ? 1 : -1; }
    if (E.state !== "play" || now - t0 > 180000) ok(); else requestAnimationFrame(f); }; f(); });
  return { vague: I.arene ? I.arene.vague : 0, mort: E.state === "dead", s: Math.round((performance.now() - t0) / 1000), reste: E.ents.filter((e) => e.arene && !e.dead).map((e) => e.type + '@' + Math.round(e.x / I.T) + ',' + Math.round((e.y - I.oy) / I.T) + (e.boss ? ' mode ' + e.mode : '')).join(' ') }; });
console.log('      reste :', robot.reste);
console.log(`      robot niv. 20 au maximum : ${robot.mort ? "mort à la vague " + robot.vague : "encore en vie à la vague " + robot.vague} après ${robot.s} s`);
verifie(robot.vague >= 5 && robot.vague <= 22, `la difficulté monte jusqu'à la battre (vague ${robot.vague})`);
verifie(!erreurs.length, "console sans erreur" + (erreurs.length ? " : " + erreurs.join(" | ") : ""));
await nav.close(); srv.arreter();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est vert."); process.exit(echecs ? 1 : 0);
