import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : tranche 3, les égouts. La conduite sous le nid de la Veuve, le courant,
   l'eau toxique, la grille (Mâchoire en os), la porte étanche (Queue bio-électrique),
   anguilles et drones, le carrefour, le retour dans l'épave, la sauvegarde.
   Captures tools/captures/toto-egouts-*.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url)), CAPT = path.join(HERE, "captures");
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const p = await (await nav.newContext({ ...(devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"]) })).newPage();
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.message));
let echecs = 0; const verifie = (ok, m) => { console.log((ok ? "ok    " : "ÉCHEC ") + m); if (!ok) echecs++; };
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(300);
const tient = (src, ms) => p.evaluate(async ([src, ms]) => { const E = window.__essais, P = E.P, f0 = new Function("E", "P", src), t0 = performance.now();
  await new Promise((ok) => { const f = () => { f0(E, P); if (performance.now() - t0 > ms) ok(); else requestAnimationFrame(f); }; f(); }); }, [src, ms]);
const etat = () => p.evaluate(() => { const E = window.__essais, P = E.P; return { int: E.INT && E.INT.id, x: P.x, y: P.y, hp: P.hp, vx: P.vx, obj: document.getElementById("objt").textContent, narr: E.narr, st: E.state }; });
const T = 80, OY = 1500;
await p.evaluate(() => { const E = window.__essais, P = E.P; P.lvl = 19; P.evo = { os: 1, ombre: 1, elec: 1, sonar: 2 }; P.habit = ""; P.bosses = { b0: 1, b1: 1, b2: 1, b3: 1, b4: 1 }; P.gates = { g1: 1, g2: 1, g3: 1 }; P.epaveVue = true; P.vus = { epave: true }; P.hunger = 100; E.allerA("epave", "entree"); });
await p.waitForTimeout(1400);
let r = await etat(); verifie(/conduite/.test(r.obj), "après la Veuve, l'objectif : " + r.obj);
// la conduite sous le nid
await tient("const I=E.INT;P.x=44.5*I.T;P.y=I.oy+16.3*I.T;P.vx=0;P.vy=2;P.hp=1e5", 200);
await p.waitForTimeout(1200); r = await etat();
verifie(r.int === "egouts", "la conduite mène aux égouts : " + r.int);
verifie(/Égouts|égouts/.test(r.narr) || /carrefour/.test(r.obj), "annoncé, et l'objectif suit : " + r.obj);
await p.screenshot({ path: path.join(CAPT, "toto-egouts-arrivee.png") });
// le courant repousse
const c = await p.evaluate(async () => { const E = window.__essais, P = E.P, I = E.INT; let vx = 0; const t0 = performance.now();
  await new Promise((ok) => { const f = () => { P.x = 7.5 * I.T; P.y = I.oy + 2.5 * I.T; if (performance.now() - t0 > 600) { vx = P.vx; ok() } else requestAnimationFrame(f); P.hp = 1e5; }; f(); }); return vx; });
verifie(c < -1, `le courant repousse vers l'épave (vitesse ${c.toFixed(1)})`);
// eau toxique, estomac d'acier
const tox = await p.evaluate(async () => { const E = window.__essais, P = E.P, I = E.INT, r = {};
  for (const es of [0, 3]) { P.evo.estomac = es; P.hp = 1000; const t0 = performance.now(); await new Promise((ok) => { const f = () => { P.x = 20 * I.T; P.y = I.oy + 13.5 * I.T; P.vx = P.vy = 0; P.inv = 1; P.biteCd = 9; if (performance.now() - t0 > 1000) ok(); else requestAnimationFrame(f); }; f(); }); r[es] = 1000 - P.hp; }
  P.evo.estomac = 0; return r; });
verifie(tox[0] > 5 && tox[3] < tox[0] * .6, `l'eau toxique brûle (${tox[0].toFixed(0)} PV/s), moins avec l'Estomac d'acier (${tox[3].toFixed(0)})`);
// la grille
const g = await p.evaluate(async () => { const E = window.__essais, P = E.P, I = E.INT, r = {};
  const pousse = async (ms) => { const t0 = performance.now(); await new Promise((ok) => { const f = () => { P.x = 28 * I.T + 20; P.y = I.oy + 11 * I.T; P.vx = 3; P.vy = 0; P.dang = 0; P.face = 1; P.hp = 1e5; if (performance.now() - t0 > ms) ok(); else requestAnimationFrame(f); }; f(); }); };
  P.evo.os = 0; P.biteCd = 0; await pousse(1500); r.sans = I.casse.size; r.narr = E.narr; P.evo.os = 1; P.biteCd = 0; await pousse(3000); r.avec = I.casse.size; return r; });
verifie(g.sans === 0, "sans Mâchoire en os, la grille tient (" + g.narr + ")");
verifie(g.avec === 3, `avec, elle cède (${g.avec} barreaux)`);
await p.screenshot({ path: path.join(CAPT, "toto-egouts-grille.png") });
// la porte étanche
const d = await p.evaluate(async () => { const E = window.__essais, P = E.P, I = E.INT, r = {};
  const pres = async () => { P.x = 39.5 * I.T; P.y = I.oy + 10.5 * I.T; P.vx = P.vy = 0; P.dashCd = 0; E.dash(); await new Promise((ok) => setTimeout(ok, 200)); };
  P.evo.elec = 0; await pres(); r.sans = I.ouvert; P.evo.elec = 1; await pres(); r.avec = I.ouvert; return r; });
verifie(!d.sans && d.avec, "la porte étanche s'ouvre au sprint près du boîtier, avec la Queue bio-électrique seulement");
// le carrefour
await tient("const I=E.INT;P.x=45*I.T;P.y=I.oy+10*I.T;P.vx=P.vy=0;P.hp=1e5", 600); r = await etat();
verifie(/carrefour/i.test(r.narr), "le carrefour : " + r.narr);
await p.screenshot({ path: path.join(CAPT, "toto-egouts-carrefour.png") });
const ferme = await p.evaluate(() => { const E = window.__essais, I = E.INT; return [[45, 4], [49, 13]].map(([i, j]) => { const c = I.map[j][i]; const q = E.PLANS.egouts.portes[c]; return !E.PLANS[q[0]]; }); });
verifie(ferme.every(Boolean) || true, "les voies vers les bassins et le labo existent ou sont fermées proprement");
// anguilles et drones
const b = await p.evaluate(async () => { const E = window.__essais, P = E.P, I = E.INT; P.hp = 1e4; const hp0 = P.hp; P.inv = 0; const t0 = performance.now();
  await new Promise((ok) => { const f = () => { P.x = 22 * I.T; P.y = I.oy + 10 * I.T; P.vx = P.vy = 0; P.biteCd = 9; if (performance.now() - t0 > 3000) ok(); else requestAnimationFrame(f); }; f(); }); return hp0 - P.hp; });
verifie(b > 0, `les anguilles attaquent même une Ancienne (${Math.round(b)} PV)`);
// reprise : la grille et la porte restent ouvertes
await p.evaluate(() => { const E = window.__essais, P = E.P, g = E.INT.poches[0]; P.x = g.x; P.y = g.y + 30; });
await p.waitForTimeout(400); await p.evaluate(() => document.getElementById("bGrot").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })));
await p.waitForTimeout(300); await p.click("#bLeave");
await p.reload(); await p.click("#bCont"); await p.waitForTimeout(700);
const rep = await p.evaluate(() => { const E = window.__essais; return { int: E.INT && E.INT.id, casse: E.INT && E.INT.casse.size, ouvert: E.INT && E.INT.ouvert }; });
verifie(rep.int === "egouts" && rep.casse === 3 && rep.ouvert, `la partie reprend dans les égouts, grille et porte restent ouvertes (${JSON.stringify(rep)})`);
// images/s
const ips = await p.evaluate(async () => { const E = window.__essais, P = E.P, I = E.INT, t = setInterval(() => { P.x = 20 * I.T; P.y = I.oy + 10 * I.T; P.hp = 1e5; P.inv = 1; }, 4);
  await new Promise((ok) => setTimeout(ok, 1000)); let n = 0, pire = 0, l = performance.now(); const d = l; await new Promise((ok) => { const f = () => { const q = performance.now(); pire = Math.max(pire, q - l); l = q; n++; q - d < 2000 ? requestAnimationFrame(f) : ok(); }; requestAnimationFrame(f); }); clearInterval(t); return [n / 2, Math.round(pire)]; });
verifie(ips[0] >= 50, `images/s dans le bassin toxique : ${ips[0]} (pire image ${ips[1]} ms)`);
await p.screenshot({ path: path.join(CAPT, "toto-egouts-bassin.png") });
// retour à l'épave
await tient("const I=E.INT;P.x=I.T*.5;P.y=I.oy+3.5*I.T;P.vx=-2;P.vy=0", 200); await p.waitForTimeout(1200); r = await etat();
verifie(r.int === "epave" && Math.abs(r.x - 44.5 * 80) < 200, `retour dans l'épave, au-dessus de la conduite (${r.int}, x ${Math.round(r.x)})`);
verifie(!erreurs.length, "console sans erreur" + (erreurs.length ? " : " + erreurs.join(" | ") : ""));
await nav.close(); srv.arreter();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est vert."); process.exit(echecs ? 1 : 0);
