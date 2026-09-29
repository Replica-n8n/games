import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";

/* toto : la 4e zone, le golfe profond. Vérifie la barrière électrifiée (elle
   électrocute, ne cède qu'au sprint avec la queue bio-électrique ET la Matriarche
   vaincue), la pression des abysses (Ancienne seulement), la suite des objectifs,
   Vieux-Borgne, les créatures du golfe et une vieille sauvegarde sans g3. */
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctx = await nav.newContext({ ...(devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"]) });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
let echecs = 0;
const verifie = (ok, msg) => { console.log((ok ? "ok    " : "ÉCHEC ") + msg); if (!ok) echecs++; };
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(400);

/* Pousse la requin contre la barrière pendant ms, au sprint ou non. */
const pousse = (sprint, ms) => p.evaluate(async ([sprint, ms]) => {
  const E = window.__essais, P = E.P, t0 = performance.now();
  await new Promise((ok) => { const f = () => { P.x = 9000 - 18 - P.r - 1; P.y = 1500; P.vx = 6; P.vy = 0; P.hunger = 100;
    if (sprint) { P.dashT = .3; P.dashCd = 0; } if (performance.now() - t0 > ms) ok(); else requestAnimationFrame(f); }; f(); });
  return { x: P.x, hp: P.hp, max: 100 * 1.95, ouverte: !!P.gates.g3, g: E.GATES[2].hp, narr: E.narr };
}, [sprint, ms]);

// 1. sans rien : la barrière tient et électrocute (d'abord nager un peu au large, pour que
// l'annonce de la zone passe avant d'arriver au mur, comme en jeu)
await p.evaluate(async () => { const P = window.__essais.P; P.gates.g1 = P.gates.g2 = true; P.lvl = 12; P.bosses = { b0: true, b1: true }; P.evo = {}; P.nut = { p: 0, f: 0, m: 0, mu: 0 };
  const t0 = performance.now(); await new Promise((ok) => { const f = () => { P.x = 8700; P.y = 1500; P.vx = P.vy = 0; if (performance.now() - t0 > 300) ok(); else requestAnimationFrame(f); }; f(); });
  window.__essais.taire(); P.hp = 195; });
let r = await pousse(true, 1500);
verifie(!r.ouverte && r.x < 9000, `sans la Matriarche, la barrière tient (x ${Math.round(r.x)})`);
verifie(r.hp < 195, `elle électrocute : vie ${Math.round(r.hp)} / 195`);
verifie(/Matriarche/.test(r.narr), "le narrateur désigne la Matriarche : " + r.narr);
// 2. Matriarche vaincue, pas de queue électrique
await p.evaluate(() => { const P = window.__essais.P; P.bosses.b2 = true; P.hp = 195; });
r = await pousse(true, 1500);
verifie(!r.ouverte, "sans queue bio-électrique, elle tient encore");
// 3. queue électrique, sans sprint
await p.evaluate(() => { const P = window.__essais.P; P.evo = { elec: 1 }; P.hp = 195; });
r = await pousse(false, 1500);
verifie(!r.ouverte, "queue chargée mais sans sprint : elle tient (" + r.narr + ")");
// 4. au sprint : elle grille
await p.evaluate(() => { window.__essais.P.hp = 1e5; });
r = await pousse(true, 3500);
verifie(r.ouverte, `au sprint avec la queue : grillée (points restants ${r.g})`);

// 5. pression des abysses
const pression = (lvl) => p.evaluate(async (lvl) => { const P = window.__essais.P; P.lvl = lvl; P.hp = 1000; const t0 = performance.now();
  await new Promise((ok) => { const f = () => { P.x = 11000; P.y = 2900; P.vx = P.vy = 0; P.hunger = 100; if (performance.now() - t0 > 1200) ok(); else requestAnimationFrame(f); }; f(); });
  return 1000 - P.hp; }, lvl);
const pa = await pression(12), pn = await pression(16);
verifie(pa > 5, `Adulte dans les abysses : la pression blesse (${Math.round(pa)} PV perdus)`);
verifie(pn < 1, `Ancienne dans les abysses : rien (${Math.round(pn)} PV)`);

// 6. suite des objectifs
const obj = await p.evaluate(() => { const E = window.__essais, P = E.P, o = [];
  P.nut = { p: 0, f: 0, m: 0, mu: 0 }; P.rustinDown = false;
  const lire = () => document.getElementById("objt").textContent;
  P.evo = { os: 1 }; P.gates.g3 = false; P.lvl = 13; o.push(E.objectiveId());
  P.evo = { os: 1, elec: 1 }; o.push(E.objectiveId());
  P.gates.g3 = true; o.push(E.objectiveId());
  P.lvl = 16; o.push(E.objectiveId());
  P.bosses.b3 = true; o.push(E.objectiveId()); P.bosses.b3 = false; return o; });
verifie(obj.join(",") === "elec,g3,ancienne,b3,rustin", "objectifs après la Matriarche : " + obj.join(" > "));

// 7. Vieux-Borgne existe et tombe
const vb = await p.evaluate(async () => { const E = window.__essais, P = E.P, b = E.ents.find((e) => e.boss && e.boss.id === "b3");
  if (!b) return null; const y = b.y, fy = E.floorY(b.x); b.hp = 1; P.lvl = 16; P.x = b.x - b.r - P.r; P.y = b.y; P.dang = 0; P.face = 1; P.biteCd = 0;
  await new Promise((ok) => setTimeout(ok, 800)); return { y: Math.round(y), fy: Math.round(fy), mort: b.dead, battu: !!P.bosses.b3, narr: E.narr }; });
verifie(vb && vb.y < vb.fy && vb.y > 2500, `Vieux-Borgne au fond du golfe (y ${vb && vb.y}, fond ${vb && vb.fy})`);
verifie(vb && vb.battu && /Vieux-Borgne/.test(vb.narr), "Vieux-Borgne tombe, et le narrateur le dit : " + (vb && vb.narr));

// 8. créatures du golfe et méduse qui pique
const cr = await p.evaluate(async () => { const E = window.__essais, P = E.P; P.hp = 1e5; const vus = new Set(), t0 = performance.now();
  await new Promise((ok) => { const f = () => { P.x = 10300; P.y = 2000; P.vx = P.vy = 0; P.hunger = 100; P.hp = 1e5; P.inv = 1; for (const e of E.ents) if (e.kind === "ani") vus.add(e.type); if (performance.now() - t0 > 4000) ok(); else requestAnimationFrame(f); }; f(); });
  const m = E.mkEnt("meduse", P.x + 5, P.y + 30); E.ents.push(m); P.inv = 0; P.biteT = 0; P.biteCd = 9; const hp = P.hp;
  await new Promise((ok) => setTimeout(ok, 300)); return { vus: [...vus], pique: P.hp < hp }; });
verifie(["calmar", "meduse", "baudroie"].every((t) => cr.vus.includes(t)), "créatures du golfe : " + cr.vus.join(", "));
verifie(cr.pique, "une méduse pique au contact");

// 9. vieille sauvegarde (sans g3, sans b3)
await p.evaluate(() => localStorage.setItem("toto-save", JSON.stringify({ lvl: 12, xp: 0, nut: { p: 0, f: 0, m: 0, mu: 0 }, evo: { os: 2 }, bosses: { b0: true, b1: true }, gates: { g1: true, g2: true }, grotto: 2, rustinDown: false, habit: "os" })));
await p.reload(); await p.click("#bCont"); await p.waitForTimeout(600);
const vs = await p.evaluate(() => ({ st: window.__essais.state, g: window.__essais.GATES[2].hp, obj: document.getElementById("objt").textContent }));
verifie(vs.st === "play" && vs.g === 4, `vieille sauvegarde : la partie reprend, barrière intacte (${vs.obj})`);

verifie(!erreurs.length, "console sans erreur" + (erreurs.length ? " : " + erreurs.join(" | ") : ""));
await nav.close(); srv.arreter();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est vert.");
process.exit(echecs ? 1 : 0);
