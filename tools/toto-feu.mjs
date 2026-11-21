import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : l'habit de feu, « Sang de lave ».
   - verrou : Vieux-Borgne terrassé OU niveau 20, l'un ou l'autre suffit ;
   - la morsure brûle 3 s, plus fort à chaque niveau (mesuré sur une orque immobile) ;
   - niveau 4 : le feu saute aux bêtes voisines de la bête mordue ;
   - habit porté : ce qui la mord prend feu (« peau brûlante ») ;
   - images/s avec la carte graphique, niveau 4, et captures des niveaux 1 et 4.
   `node tools/toto-feu.mjs` ; captures tools/captures/toto-feu-jeu-*.png. */
const CAPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "captures");
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const p = await (await nav.newContext({ ...devices["Pixel 9 landscape"], serviceWorkers: "block" })).newPage();
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.message));
let echecs = 0; const verifie = (ok, m) => { console.log((ok ? "ok    " : "ÉCHEC ") + m); if (!ok) echecs++; };
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(400);

// 1. le verrou
const verrou = await p.evaluate(() => { const E = window.__essais, P = E.P, r = {}, ligne = () => { E.renderEvo(); const t = [...document.querySelectorAll("#evoList .evo")].map((d) => d.textContent.replace(/\s+/g, " ")).find((t) => t.includes("Sang de lave")); return t || ""; };
  P.bosses = {}; P.lvl = 19; r.ferme = ligne(); P.lvl = 20; r.niveau20 = ligne(); P.lvl = 6; P.bosses = { b3: true }; r.alpha = ligne(); return r; });
verifie(/terrassez Vieux-Borgne ou atteignez le niveau 20/.test(verrou.ferme), "niveau 19 sans Vieux-Borgne : verrouillé, « " + verrou.ferme.trim() + " »");
verifie(/Muter/.test(verrou.niveau20) && !/terrassez/.test(verrou.niveau20), "niveau 20 sans Vieux-Borgne : ouvert");
verifie(/Muter/.test(verrou.alpha) && !/terrassez/.test(verrou.alpha), "niveau 6 avec Vieux-Borgne : ouvert");

// 2. muter : elle enfile l'habit, la grotte annonce le bonus
const mut = await p.evaluate(() => { const E = window.__essais, P = E.P; P.nut = { p: 999, f: 999, m: 999, mu: 999, pu: 999 }; P.evo = {}; P.habit = ""; E.renderEvo();
  document.querySelector('#evoList button[data-id="feu"]').click(); return { habit: P.habit, lv: P.evo.feu, txt: document.getElementById("habits").textContent }; });
verifie(mut.habit === "feu" && mut.lv === 1, "la première mutation enfile l'habit de feu");
verifie(/Peau brûlante/.test(mut.txt), "la grotte annonce « Peau brûlante »");

// 3. la brûlure, mesurée par niveau sur une orque immobile loin d'elle
const brule = {};
for (const n of [1, 4]) {
  brule[n] = await p.evaluate(async (n) => { const E = window.__essais, P = E.P; P.evo.feu = n; P.inv = 99; P.hp = 1e5;
    const e = E.mkEnt("orque", P.x + 900, P.y); e.spd = 0; e.ai = "drift"; E.ents.push(e); const h0 = e.hp; E.allumer(e);
    await new Promise((ok) => setTimeout(ok, 3600)); const perdu = h0 - e.hp, attendu = 3 * E.pDmg() * [0, .15, .25, .35, .45][n]; e.dead = true; return { perdu, attendu, fini: !(e.brule > 0) }; }, n);
  verifie(Math.abs(brule[n].perdu - brule[n].attendu) < brule[n].attendu * .2 + .5 && brule[n].fini, `niveau ${n} : la brûlure ôte ${brule[n].perdu.toFixed(1)} PV en 3 s (attendu ${brule[n].attendu.toFixed(1)}), puis s'éteint`);
}
verifie(brule[4].perdu > brule[1].perdu * 2.5, `le niveau 4 brûle ${(brule[4].perdu / brule[1].perdu).toFixed(1)} fois plus que le niveau 1`);

// 3 bis. ce qui brûle se voit : des étincelles tant que ça brûle, plus rien après
const vu = await p.evaluate(async () => { const E = window.__essais, P = E.P; const e = E.mkEnt("orque", P.x + 300, P.y); e.spd = 0; e.ai = "drift"; E.ents.push(e); E.allumer(e);
  await new Promise((ok) => setTimeout(ok, 1000)); const pendant = E.braises.length; await new Promise((ok) => setTimeout(ok, 3200)); const apres = E.braises.length; e.dead = true; return { pendant, apres }; });
verifie(vu.pendant > 20 && vu.apres === 0, `étincelles : ${vu.pendant} pendant la brûlure, ${vu.apres} une fois éteinte`);

// 4. niveau 4 : le feu saute aux voisines ; niveau 3 : non
for (const n of [3, 4]) {
  const r = await p.evaluate(async (n) => { const E = window.__essais, P = E.P; P.evo.feu = n; P.biteCd = 0; P.dang = 0; P.vx = 1; P.vy = 0;
    const { bx, by } = E.mouth(); const a = E.mkEnt("orque", bx + 60, by), b = E.mkEnt("marteau", bx + 60, by + 160);
    for (const e of [a, b]) { e.spd = 0; e.ai = "drift"; E.ents.push(e); }
    E.bite(); const r = { mordue: a.brule > 0, voisine: b.brule > 0 }; a.dead = b.dead = true; return r; }, n);
  verifie(r.mordue && r.voisine === (n >= 4), `niveau ${n} : la bête mordue brûle, sa voisine ${r.voisine ? "aussi" : "non"}`);
}

// 5. peau brûlante : ce qui la mord prend feu, seulement si elle porte le feu
for (const habit of ["feu", ""]) {
  const r = await p.evaluate((habit) => { const E = window.__essais, P = E.P; P.habit = habit; P.inv = 0; P.hp = 1e5;
    const e = E.mkEnt("barracuda", P.x + 10, P.y); e.atkCd = 0; E.ents.push(e); E.contact(e, 1); const r = e.brule > 0; e.dead = true; return r; }, habit);
  verifie(r === (habit === "feu"), `habit « ${habit || "naturel"} » : le barracuda qui la mord ${r ? "prend feu" : "ne brûle pas"}`);
}

// 6. images/s au niveau 4, en pleine eau, et captures
await p.evaluate(() => { const E = window.__essais, P = E.P; P.habit = "feu"; P.lvl = 12; P.inv = 99; P.hp = 1e5; P.x = 7300; P.y = 900; P.vx = P.vy = 0; });
const fps = await p.evaluate(async () => { const E = window.__essais; E.P.evo.feu = 4; let n = 0; const t0 = performance.now();
  await new Promise((ok) => { const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else ok(); }; requestAnimationFrame(f); }); return n / 3; });
verifie(fps > 50, `${fps.toFixed(0)} images/s au niveau 4 (carte graphique)`);
for (const n of [1, 4]) { await p.evaluate((n) => { const E = window.__essais; E.P.evo.feu = n; E.P.x = 7300; E.P.y = 900; }, n); await p.waitForTimeout(1500);
  await p.screenshot({ path: path.join(CAPT, `toto-feu-jeu-${n}.png`) }); }
verifie(!erreurs.length, "console sans erreur " + erreurs.join(" | "));
await nav.close(); srv.arreter();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est vert."); process.exit(echecs ? 1 : 0);
