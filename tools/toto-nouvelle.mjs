import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";

/* toto : « Nouvelle partie » repart de zéro, palmarès et trophées compris, mais
   seulement après confirmation quand une partie existe ; une mort n'efface rien. */
const srv = await servir();
const nav = await chromium.launch();
const p = await (await nav.newContext({ ...devices["Pixel 9 landscape"] })).newPage();
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.message));
let echecs = 0; const verifie = (ok, m) => { console.log((ok ? "ok    " : "ÉCHEC ") + m); if (!ok) echecs++; };
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/");
verifie((await p.textContent("#bNew")) === "Plonger", "premier lancement : « Plonger » démarre directement");
await p.click("#bNew"); await p.waitForTimeout(300);
// une partie avancée, des exploits d'or
await p.evaluate(() => { const E = window.__essais, P = E.P; P.lvl = 12; P.bosses = { b0: 1 }; for (const x of E.EXPLOITS) E.palm.stats[x.id] = x.s[2]; E.palm.alphas.b0 = true; E.exploit("manges", 1); localStorage.setItem("toto-save", JSON.stringify({ lvl: 12, xp: 0, nut: { p: 0, f: 0, m: 0, mu: 0 }, evo: {}, bosses: { b0: 1 }, gates: {}, grotto: 0 })); });
// mourir n'efface pas le palmarès
await p.evaluate(() => { const P = window.__essais.P; P.hunger = 0; P.hp = .01; }); await p.waitForTimeout(500);
let tro = await p.evaluate(() => window.__essais.trophees().length);
verifie(tro >= 7, `une mort laisse les trophées (${tro})`);
await p.click("#bResp"); await p.waitForTimeout(200);
await p.reload(); await p.waitForTimeout(300);
verifie((await p.textContent("#bNew")) === "Nouvelle partie" && await p.isVisible("#bCont"), "avec une partie : « Nouvelle partie » et « Continuer »");
await p.click("#bNew"); await p.waitForTimeout(200);
verifie(await p.isVisible("#title") && /effacer/.test(await p.textContent("#bNew")), "un premier appui demande confirmation : " + (await p.textContent("#bNew")));
await p.waitForTimeout(4500);
verifie((await p.textContent("#bNew")) === "Nouvelle partie", "sans second appui, rien n'est effacé et le bouton revient");
tro = await p.evaluate(() => JSON.parse(localStorage.getItem("toto-palmares")).stats.manges || 0);
verifie(tro > 0, "le palmarès est intact après l'hésitation");
await p.click("#bNew"); await p.waitForTimeout(200); await p.click("#bNew"); await p.waitForTimeout(400);
const apres = await p.evaluate(() => { const E = window.__essais; return { st: E.state, lvl: E.P.lvl, tro: E.trophees().length, stats: Object.keys(E.palm.stats).length, alphas: Object.keys(E.palm.alphas).length, save: localStorage.getItem("toto-save") }; });
verifie(apres.st === "play" && apres.lvl === 1, "le second appui lance une partie neuve (niveau 1)");
verifie(apres.tro === 0 && apres.stats === 0 && apres.alphas === 0, "palmarès et trophées remis à zéro");
verifie(!apres.save, "l'ancienne partie est effacée");
verifie(!erreurs.length, "console sans erreur " + erreurs.join(" | "));
await nav.close(); srv.arreter();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est vert."); process.exit(echecs ? 1 : 0);
