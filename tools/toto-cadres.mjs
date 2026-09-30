import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";

/* toto : le cadre rouge clignotant s'affiche-t-il sur chaque verrou (écluse, digue,
   barrière) quand c'est l'étape de l'histoire, avec ET sans mutation payable ?
   Lit `__essais.guide` (l'id du verrou encadré à la dernière image). */
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const p = await (await nav.newContext({ ...devices["Pixel 9 landscape"] })).newPage();
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.message));
let echecs = 0; const verifie = (ok, m) => { console.log((ok ? "ok    " : "ÉCHEC ") + m); if (!ok) echecs++; };
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(400);
const CAS = [["g1", 2650, "P.lvl=5;P.bosses={b0:true};P.evo={};P.gates={}"],
  ["g2", 5650, "P.lvl=9;P.bosses={b0:true,b1:true};P.evo={os:1};P.gates={g1:true}"],
  ["g3", 8850, "P.lvl=12;P.bosses={b0:true,b1:true,b2:true};P.evo={os:1,elec:1};P.gates={g1:true,g2:true}"]];
for (const [id, x, prep] of CAS) for (const riche of [false, true]) {
  const r = await p.evaluate(async ([x, prep, riche]) => { const E = window.__essais, P = E.P; eval(prep);
    P.nut = riche ? { p: 999, f: 999, m: 999, mu: 999 } : { p: 0, f: 0, m: 0, mu: 0 }; for (const g of E.GATES) g.hp = P.gates[g.id] ? 0 : g.max;
    const t0 = performance.now(); await new Promise((ok) => { const f = () => { P.x = x; P.y = 900; P.vx = P.vy = 0; P.hp = 1e6; P.inv = 1; P.hunger = 100; if (performance.now() - t0 > 900) ok(); else requestAnimationFrame(f); }; f(); });
    return { guide: E.guide, obj: document.getElementById("objt").textContent }; }, [x, prep, riche]);
  verifie(r.guide === id, `${id} ${riche ? "avec" : "sans"} mutation payable : cadre ${r.guide || "ABSENT"} (objectif : ${r.obj})`);
}
verifie(!erreurs.length, "console sans erreur " + erreurs.join(" | "));
await nav.close(); srv.arreter();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est vert."); process.exit(echecs ? 1 : 0);
