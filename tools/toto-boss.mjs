import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";

/* toto : combien de temps un alpha tient face à une requin qui reste collée à lui
   sans nager (la morsure part seule au contact), et combien de vie elle y laisse.
   Mesure l'équilibrage des boss, niveau par niveau. */
const srv = await servir();
const nav = await chromium.launch();
const ctx = await nav.newContext({ ...devices["Pixel 9 landscape"] });
const p = await ctx.newPage();
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(400);
for (const [bossId, niveaux] of [["b0", [1, 3, 5, 7]], ["b1", [7, 9]], ["b2", [10, 12]]]) for (const lvl of niveaux) {
  const r = await p.evaluate(async ([bossId, lvl]) => {
    const E = window.__essais, P = E.P;
    const b = E.ents.find((e) => e.boss && e.boss.id === bossId) || null;
    if (!b) return null;
    b.hp = b.maxhp; b.dead = false; b.x = b.hx; b.y = b.hy; b.mode = "idle";
    P.lvl = lvl; P.xp = 0; P.evo = lvl >= 7 ? { os: 1 } : {}; P.hp = 1e9; P.hunger = 100;
    const vieMax = 100 * [1, 1.45, 1.95, 2.5][lvl >= 15 ? 3 : lvl >= 10 ? 2 : lvl >= 5 ? 1 : 0];
    let perdu = 0, t0 = performance.now(), hpAvant = P.hp;
    await new Promise((ok) => { const f = () => {
      if (P.hp < hpAvant && hpAvant - P.hp < 1000) perdu += hpAvant - P.hp; P.hp = 1e9; hpAvant = P.hp; P.hunger = 100;
      const d = b.x > P.x ? 1 : -1; P.x = b.x - d * (b.r + P.r * .9); P.y = b.y; P.vx = P.vy = 0; P.dang = d > 0 ? 0 : Math.PI; P.face = d;
      if (b.dead || performance.now() - t0 > 60000) ok(); else requestAnimationFrame(f); }; f(); });
    return { lvl, s: Math.round((performance.now() - t0) / 100) / 10, tue: b.dead, perdu: Math.round(perdu), vieMax, pct: Math.round(perdu / vieMax * 100) };
  }, [bossId, lvl]);
  if (r) console.log(`${bossId} niv.${String(r.lvl).padStart(2)} : ${r.tue ? "tué en " + r.s + " s" : "PAS tué en 60 s"}, vie perdue ${r.perdu} (${r.pct} % de la vie max ${r.vieMax})`);
}
/* Jeu actif : mordre, s'écarter avant que l'alpha se débatte, foncer à travers sa charge. */
console.log("--- jeu actif (mord, s'écarte, esquive les charges) ---");
for (const [bossId, niveaux] of [["b0", [5, 7]], ["b1", [8, 10]], ["b2", [12, 14]]]) for (const lvl of niveaux) {
  await p.reload(); await p.click("#bNew"); await p.waitForTimeout(300);
  const r = await p.evaluate(async ([bossId, lvl]) => {
    const E = window.__essais, P = E.P, b = E.ents.find((e) => e.boss && e.boss.id === bossId);
    /* Équipement réaliste à ce stade de la partie. */
    P.lvl = lvl; P.evo = lvl >= 12 ? { os: 2, ombre: 1, corps: 1 } : lvl >= 7 ? { os: 1 } : {}; P.hunger = 100;
    const vieMax = 100 * [1, 1.45, 1.95, 2.5][lvl >= 15 ? 3 : lvl >= 10 ? 2 : lvl >= 5 ? 1 : 0] * (1 + .25 * (P.evo.corps || 0)); P.hp = vieMax;
    P.x = b.x - 300; P.y = b.y;
    let perdu = 0, hpAvant = P.hp, t0 = performance.now(), colle = 0, recul = 0, stun = 0;
    await new Promise((ok) => { let last = performance.now(); const f = () => { const now = performance.now(), dt = (now - last) / 1000; last = now;
      if (P.hp < hpAvant && hpAvant - P.hp < 1000) perdu += hpAvant - P.hp; P.hp = Math.max(P.hp, 1); hpAvant = P.hp; P.hunger = 100;
      const dx = b.x - P.x, dy = b.y - P.y, d = Math.hypot(dx, dy) || 1, dir = dx > 0 ? 1 : -1;
      if (b.mode === "stun") stun += dt;
      if (b.mode === "charge" && d < 260 && P.dashCd <= 0) { P.dang = Math.atan2(dy, dx); E.dash(); }
      else if (recul > 0) { recul -= dt; P.vx = -dir * 5; P.vy = (-dy / d) * 2; }
      else { const cible = b.r + P.r * 1.9; if (d > cible) { P.vx = dx / d * 6; P.vy = dy / d * 6 } else { P.vx = P.vy = 0; colle += dt; if (colle > 1.3) { colle = 0; recul = .9 } } }
      P.dang = Math.atan2(dy, dx); P.face = dir;
      if (b.dead || now - t0 > 90000) ok(); else requestAnimationFrame(f); }; f(); });
    return { lvl, s: Math.round((performance.now() - t0) / 100) / 10, tue: b.dead, pct: Math.round(perdu / vieMax * 100), stun: Math.round(stun * 10) / 10 };
  }, [bossId, lvl]);
  console.log(`${bossId} niv.${String(r.lvl).padStart(2)} : ${r.tue ? "tué en " + r.s + " s" : "PAS tué en 90 s"}, vie perdue ${r.pct} % de la vie max, alpha étourdi ${r.stun} s`);
}
await nav.close(); srv.arreter();
