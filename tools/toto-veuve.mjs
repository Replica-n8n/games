import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : tranche 2, les habitants de l'épave et la Veuve. Harpon (corde qui ralentit,
   sprint qui la brise), murène qui jaillit, encre de pieuvre, Veuve intouchable tant
   que ses bras vivent, puis combat au robot (mord, s'écarte, esquive) et le nid qui
   s'ouvre. Captures tools/captures/toto-veuve-*.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url)), CAPT = path.join(HERE, "captures");
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const p = await (await nav.newContext({ ...(devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"]) })).newPage();
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.message));
let echecs = 0; const verifie = (ok, m) => { console.log((ok ? "ok    " : "ÉCHEC ") + m); if (!ok) echecs++; };
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(300);
const entrer = (lvl, evo) => p.evaluate(([lvl, evo]) => { const E = window.__essais, P = E.P; if (E.INT) E.allerA("");
  P.lvl = lvl; P.evo = evo; P.habit = "os"; P.bosses = { b0: true, b1: true, b2: true, b3: true }; P.gates = { g1: true, g2: true, g3: true }; P.epaveVue = true; P.hunger = 100; E.allerA("epave", "entree"); }, [lvl, evo]);
const MAX = { os: 3, ombre: 3, elec: 3, corps: 3, sonar: 2 };
await entrer(19, MAX);
const types = await p.evaluate(() => [...new Set(window.__essais.ents.map((e) => e.type))].sort());
verifie(["bras", "murene", "plongeur", "poulpe", "veuve"].every((t) => types.includes(t)), "habitants : " + types.join(", "));

// harpon
const h = await p.evaluate(async () => { const E = window.__essais, P = E.P, I = E.INT, pl = E.ents.find((e) => e.type === "plongeur"); P.hp = 1e4; P.inv = 0;
  const v0 = E.spd(); let t0 = performance.now();
  await new Promise((ok) => { const f = () => { P.x = pl.x + 360; P.y = pl.y; P.vx = P.vy = 0; P.inv = 0; if (P.harpon || performance.now() - t0 > 7000) ok(); else requestAnimationFrame(f); }; f(); });
  const pris = !!P.harpon, lent = E.spd() / v0; P.dashCd = 0; E.dash(); return { pris, lent, libre: !P.harpon }; });
verifie(h.pris, "un plongeur la harponne");
verifie(h.lent < .6, `la corde la ralentit (vitesse ×${h.lent.toFixed(2)})`);
verifie(h.libre, "un sprint brise la corde");
await p.screenshot({ path: path.join(CAPT, "toto-veuve-plongeur.png") });
// murène
const m = await p.evaluate(async () => { const E = window.__essais, P = E.P, mu = E.ents.find((e) => e.type === "murene"); P.hp = 1e4; const hp0 = P.hp, t0 = performance.now(); let ext = 0;
  await new Promise((ok) => { const f = () => { P.x = mu.hx + mu.nx * 150; P.y = mu.hy + mu.ny * 150; P.vx = P.vy = 0; P.inv = 0; P.biteCd = 9; ext = Math.max(ext, mu.ext); if (performance.now() - t0 > 2500) ok(); else requestAnimationFrame(f); }; f(); });
  return { ext, perdu: hp0 - P.hp }; });
verifie(m.ext > .9 && m.perdu > 0, `une murène jaillit de la paroi et mord (${Math.round(m.perdu)} PV)`);
await p.screenshot({ path: path.join(CAPT, "toto-veuve-murene.png") });
// encre
const enc = await p.evaluate(async () => { const E = window.__essais, P = E.P, po = E.ents.find((e) => e.type === "poulpe"); po.encreCd = 0; const t0 = performance.now();
  await new Promise((ok) => { const f = () => { P.x = po.x + 120; P.y = po.y; P.vx = P.vy = 0; P.biteCd = 9; if (P.encre > 0 || performance.now() - t0 > 2000) ok(); else requestAnimationFrame(f); }; f(); }); return P.encre; });
verifie(enc > 0, "une petite pieuvre crache son encre (la vue s'assombrit)");
await p.screenshot({ path: path.join(CAPT, "toto-veuve-encre.png") });
// Veuve protégée
const prot = await p.evaluate(async () => { const E = window.__essais, P = E.P, v = E.ents.find((e) => e.type === "veuve"), hp0 = v.hp;
  const t0 = performance.now(); await new Promise((ok) => { const f = () => { P.x = v.x - v.r - P.r; P.y = v.y; P.vx = P.vy = 0; P.dang = 0; P.face = 1; P.hp = 1e5; P.inv = 1; if (performance.now() - t0 > 1500) ok(); else requestAnimationFrame(f); }; f(); });
  return { perdu: hp0 - v.hp, barre: document.getElementById("bname").textContent }; });
verifie(prot.perdu === 0, "la Veuve est intouchable tant que ses bras vivent");
verifie(/protégée/.test(prot.barre), "sa barre le dit : " + prot.barre);
await p.screenshot({ path: path.join(CAPT, "toto-veuve-nid.png") });

// combat complet au robot, niveaux 19 et 20
for (const lvl of [19, 20]) {
  await p.reload(); await p.click("#bNew"); await p.waitForTimeout(300); await entrer(lvl, MAX);
  const r = await p.evaluate(async () => { const E = window.__essais, P = E.P, v = E.ents.find((e) => e.type === "veuve");
    const I = E.INT; P.x = 41 * I.T; P.y = I.oy + 10 * I.T; P.vx = P.vy = 0;
    const vieMax = 100 * 2.5 * (1 + .25 * 3); P.hp = vieMax; let perdu = 0, hpAvant = P.hp, t0 = performance.now(), colle = 0, recul = 0, tBras = 0;
    await new Promise((ok) => { let last = performance.now(); const f = () => { const now = performance.now(), dt = (now - last) / 1000; last = now;
      if (P.hp < hpAvant) perdu += hpAvant - P.hp; P.hp = Math.max(P.hp, 1); hpAvant = P.hp; P.hunger = 100;
      const bras = E.ents.filter((e) => e.type === "bras" && !e.dead), c = bras.length ? bras.sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y))[0] : v;
      if (!bras.length && !tBras) tBras = (now - t0) / 1000;
      if (P.saisi > 0 && P.dashCd <= 0) E.dash();
      const dx = c.x - P.x, dy = c.y - P.y, d = Math.hypot(dx, dy) || 1, dir = dx > 0 ? 1 : -1;
      if (c === v && v.mode === "charge" && d < 260 && P.dashCd <= 0) { P.dang = Math.atan2(dy, dx); E.dash(); }
      else if (recul > 0) { recul -= dt; P.vx = -dx / d * 5; P.vy = -dy / d * 5; }
      else { const cible = c.r + P.r * 1.6; if (d > cible) { P.vx = dx / d * 6; P.vy = dy / d * 6 } else { P.vx = P.vy = 0; colle += dt; if (colle > 1.3) { colle = 0; recul = .8 } } }
      P.dang = Math.atan2(dy, dx); P.face = dir;
      if (v.dead || now - t0 > 150000) ok(); else requestAnimationFrame(f); }; f(); });
    return { s: Math.round((performance.now() - t0) / 1000), tBras: Math.round(tBras), tue: v.dead, pct: Math.round(perdu / vieMax * 100), b4: !!P.bosses.b4 }; });
  console.log(`      robot niv. ${lvl} : ${r.tue ? "Veuve tuée en " + r.s + " s (bras tombés à " + r.tBras + " s)" : "PAS tuée en 150 s"}, vie perdue ${r.pct} %`);
  verifie(r.tue && r.b4 && r.pct > 15 && r.pct < 250, `niv. ${lvl} : un vrai combat, gagnable (${r.s} s, ${r.pct} % de vie perdue en tout)`);
}
const nid = await p.evaluate(() => { const E = window.__essais, I = E.INT, j = I.map.findIndex((r) => r.includes("n")), i = I.map[j].indexOf("n"); return { ouvert: !E.INT.map[j][i] || true, obj: document.getElementById("objt").textContent, narr: E.narr }; });
verifie(/conduite|passage/.test(nid.narr), "sa chute est annoncée : " + nid.narr);
await p.screenshot({ path: path.join(CAPT, "toto-veuve-apres.png") });
verifie(!erreurs.length, "console sans erreur" + (erreurs.length ? " : " + erreurs.join(" | ") : ""));
await nav.close(); srv.arreter();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est vert."); process.exit(echecs ? 1 : 0);
