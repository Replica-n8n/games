import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";

/* toto : peut-on SAUTER par-dessus un verrou (écluse, digue, barrière) sans avoir
   battu l'alpha ? Un robot niveau 3 fonce en diagonale vers la surface, sprint
   compris, depuis plusieurs profondeurs et angles, devant chaque verrou.
   `node tools/toto-saut.mjs`. */
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const p = await (await nav.newContext({ ...devices["Pixel 9 landscape"] })).newPage();
let echecs = 0; const verifie = (ok, m) => { console.log((ok ? "ok    " : "ÉCHEC ") + m); if (!ok) echecs++; };
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(300);
for (const [gi, nom] of [[0, "écluse"], [1, "digue"], [2, "barrière"]]) {
  const r = await p.evaluate(async (gi) => { const E = window.__essais, P = E.P, g = E.GATES[gi]; E.SURF = 300; let passe = 0, haut = 0, essais = 0, pire = "";
    for (const prof of [60, 150, 300]) for (const ang of [-.5, -.8, -1.1, -1.35]) for (const recul of [150, 300, 500]) { essais++;
      P.lvl = 3; P.hp = 1e5; P.hunger = 100; P.x = g.x - recul; P.y = E.SURF + prof; P.vx = 0; P.vy = 0; P.dashCd = 0; let sprint = false, min = 1e9;
      const t0 = performance.now();
      await new Promise((ok) => { const f = () => { P.hp = 1e5; if (P.y > E.SURF - 5) { P.vx = Math.cos(ang) * 9; P.vy = Math.sin(ang) * 9; P.dang = ang; P.face = 1; }
        if (!sprint && P.y < E.SURF + 80 && P.dashCd <= 0) { E.dash(); sprint = true; } min = Math.min(min, P.y - E.SURF);
        if (P.x > g.x + 40 || performance.now() - t0 > 1800) ok(); else requestAnimationFrame(f); }; f(); });
      if (-min > haut) haut = -min; if (P.x > g.x + 40) { passe++; pire = `prof ${prof}, angle ${ang}, recul ${recul}`; } }
    return { passe, essais, haut: Math.round(haut), pire }; }, gi);
  verifie(r.passe === 0, `${nom} : ${r.passe}/${r.essais} sauts passent par-dessus (saut le plus haut ${r.haut} px, le verrou monte à 420)${r.pire ? " ; ex. " + r.pire : ""}`);
}
await nav.close(); srv.arreter();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est vert."); process.exit(echecs ? 1 : 0);
