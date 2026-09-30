import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";

/* toto : le bonus de l'habit porté. Mêmes mutations, seul l'habit change :
   vitesse et sprint (ombre), dégâts reçus (os), faim (naturel), décharge (élec),
   et la grotte affiche le bonus de l'habit porté. */
const srv = await servir();
const nav = await chromium.launch();
const p = await (await nav.newContext({ ...devices["Pixel 9 landscape"] })).newPage();
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.message));
let echecs = 0; const verifie = (ok, m) => { console.log((ok ? "ok    " : "ÉCHEC ") + m); if (!ok) echecs++; };
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(300);
const m = await p.evaluate(async () => { const E = window.__essais, P = E.P, r = {}; P.evo = { os: 1, ombre: 1, elec: 1 }; P.lvl = 10;
  for (const h of ["", "os", "ombre", "elec"]) { P.habit = h; P.inv = 0; P.hp = 1000; E.damagePlayer(10); r[h] = { spd: E.spd(), dash: E.dashMax(), degats: 1000 - P.hp }; }
  const faim = {}; for (const h of ["", "os"]) { P.habit = h; P.hunger = 100; const t0 = performance.now(); await new Promise((ok) => setTimeout(ok, 1500)); faim[h] = (100 - P.hunger) / ((performance.now() - t0) / 1000); }
  return { r, faim }; });
verifie(Math.abs(m.r.ombre.spd / m.r.os.spd - 1.1) < .01, `ombre : vitesse ×${(m.r.ombre.spd / m.r.os.spd).toFixed(2)}`);
verifie(Math.abs(m.r.ombre.dash / m.r.os.dash - .8) < .01, `ombre : sprint ×${(m.r.ombre.dash / m.r.os.dash).toFixed(2)} d'attente`);
verifie(Math.abs(m.r.os.degats - 8) < .01 && Math.abs(m.r.ombre.degats - 10) < .01, `os : 10 de dégâts deviennent ${m.r.os.degats} (ombre : ${m.r.ombre.degats})`);
verifie(m.faim[""] < m.faim.os * .8, `naturel : faim ${m.faim[""].toFixed(2)}/s contre ${m.faim.os.toFixed(2)}/s`);
await p.evaluate(() => { const P = window.__essais.P; P.habit = "os"; P.x = 600; P.y = window.__essais.floorY(600) - 120; });
await p.waitForTimeout(300); await p.evaluate(() => document.getElementById("bGrot").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })));
await p.waitForTimeout(300);
const txt = await p.textContent("#habits");
verifie(/Cuirasse/.test(txt), "la grotte affiche le bonus de l'habit porté : " + txt.replace(/\s+/g, " ").slice(-60));
verifie(!erreurs.length, "console sans erreur " + erreurs.join(" | "));
await nav.close(); srv.arreter();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est vert."); process.exit(echecs ? 1 : 0);
