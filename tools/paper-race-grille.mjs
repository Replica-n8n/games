import { chromium, webkit, devices } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { servir } from "./serveur.mjs";

/* Paper Race : les courses à plusieurs (v8), dans le navigateur.
   Ce que ce contrôle prouve :
   - « À deux » court avec la grille : tirée au sort, jusqu'au classement ;
   - le Grand Prix à 6 sur Spa va jusqu'au classement de 6 voitures, les
     petits circuits y sont refusés à plus de deux, et l'attente entre deux
     coups du joueur reste courte (animations normales) ;
   - annuler en Grand Prix défait le coup du joueur ET les réponses des fantômes ;
   - une course à 6 survit à un rechargement, une sauvegarde v7 (à deux,
     classique) se reprend avec ses règles, le championnat reste classique ;
   - l'écran tient à 360 x 640 et sur iPhone : 44 px, pas de débordement.
   Captures dans tools/captures/paper-race-grille-*.png. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "captures") + path.sep;
fs.mkdirSync(OUT, { recursive: true });
let echecs = 0;
const verifier = (nom, ok, detail) => {
  console.log((ok ? "ok    " : "ECHEC ") + nom + (detail !== undefined && !ok ? "  " + JSON.stringify(detail) : ""));
  if (!ok) echecs++;
};

const site = await servir();
const URL_JEU = site.base + "paper-race/";
const erreurs = [];
const suivre = (p) => {
  p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
  p.on("pageerror", (e) => erreurs.push("pageerror: " + e.message));
};
const pret = async (p) => {
  try { await p.waitForFunction(() => (R && finie(R)) || ((document.querySelector(".padbtn:not([disabled])") || !document.getElementById("go").disabled) && !occupe()), null, { timeout: 30000 }); }
  catch (e) {
    const etat = await p.evaluate(() => ({ turn: R.turn, file: R.file, manche: R.manche, aiBusy, depart, anim: !!anim, replay: !!replay, rejeu: !!rejeu, fantome: estFantome(R.turn),
      opts: opts.filter((o) => o.ok).length, cars: R.cars.map((c) => ({ p: c.p, v: c.v, fini: c.fini })), win: document.getElementById("win").style.display, go: document.getElementById("go").textContent }));
    console.log("BLOQUÉ", JSON.stringify(etat)); throw e;
  }
};
const fini = (p) => p.evaluate(() => !!R && finie(R));
// un coup du joueur : le choix que ferait un fantôme « normal », au doigt
async function jouerUnCoup(p) {
  const k = await p.evaluate(() => {
    const q = aiChoice(R, "normal", Math.random);
    return q === null ? -1 : opts.findIndex((o) => o.p[0] === q[0] && o.p[1] === q[1]);
  });
  if (k >= 0) await p.locator(`.padbtn[data-k="${k}"]`).click();
  await p.locator("#go").click();
}
async function jusquAuDrapeau(p, max = 400) {
  for (let i = 0; i < max; i++) {
    await pret(p);
    if (await fini(p)) break;
    await jouerUnCoup(p);
  }
  await p.waitForFunction(() => document.getElementById("win").style.display === "flex", null, { timeout: 30000 });
}
const reglages = (p, o) => p.evaluate((o) => localStorage.setItem("paper-race.reglages.v1", JSON.stringify(o)), o);
const mesurer = (p) => p.evaluate(() => {
  const vus = [...document.querySelectorAll("button")].filter((b) => {
    const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !b.closest("[hidden]");
  });
  return {
    deborde: document.documentElement.scrollWidth > window.innerWidth + 1,
    petits: vus.map((b) => { const r = b.getBoundingClientRect(); return { id: b.id || b.className, w: Math.round(r.width), h: Math.round(r.height) }; }).filter((x) => x.w < 44 || x.h < 44),
  };
});

const chrome = await chromium.launch();

/* ---------- 1. À deux : la grille, jusqu'au classement ---------- */
{
  const ctx = await chrome.newContext({ ...devices["Pixel 9"], reducedMotion: "reduce" });
  const p = await ctx.newPage(); suivre(p);
  await p.goto(URL_JEU);
  await reglages(p, { mode: "duo", level: "normal", circuit: "monza" });
  await p.reload();
  await p.locator("#jouer").click();
  await pret(p);
  const r0 = await p.evaluate(() => ({ regles: R.regles, n: R.cars.length }));
  verifier("à deux : la course suit les règles de la grille", r0.regles === "grille" && r0.n === 2, r0);
  const ouvre = new Set();
  for (let i = 0; i < 16; i++) ouvre.add(await p.evaluate(() => { start(); return R.turn; }));
  verifier("à deux : la grille est tirée au sort (Bleu ne commence plus toujours)", ouvre.size === 2, [...ouvre]);
  await pret(p);
  await jusquAuDrapeau(p);
  const f = await p.evaluate(() => ({ items: document.querySelectorAll("#winclass li").length, cache: document.getElementById("winclass").hidden, titre: document.getElementById("wintitle").textContent }));
  verifier("à deux : classement de 2 voitures à l'arrivée", f.items === 2 && !f.cache && /gagne en \d+ coups/.test(f.titre), f);
  await p.screenshot({ path: OUT + "paper-race-grille-01-duo-arrivee.png" });

  // revoir la course : lecture, pause, vitesse, curseur, coup par coup
  await p.click("#revoir");
  await p.waitForFunction(() => !!revue && !document.getElementById("revuebar").hidden && document.getElementById("bas").hidden, null, { timeout: 5000 });
  const qr0 = await p.evaluate(() => ({ t: revue.t, pause: revue.pause, max: revue.max, info: document.getElementById("revInfo").textContent }));
  // animations réduites : la revue s'ouvre en pause, on lance la lecture à la main
  if (qr0.pause) await p.click("#revLecture");
  await p.waitForTimeout(900);
  const qr1 = await p.evaluate(() => revue.t);
  verifier("revoir : la lecture avance toute seule", qr1 > qr0.t && qr0.max > 5, { qr0, qr1 });
  await p.click("#revLecture");
  const qr2 = await p.evaluate(() => revue.t);
  await p.waitForTimeout(500);
  const qr3 = await p.evaluate(() => ({ t: revue.t, pause: revue.pause, label: document.getElementById("revLecture").getAttribute("aria-label") }));
  verifier("revoir : pause arrête la course", qr3.pause && qr3.t === qr2 && qr3.label === "Lecture", { qr2, qr3 });
  await p.click("#revVitesse");
  const v = await p.evaluate(() => ({ v: revue.vitesse, txt: document.getElementById("revVitesse").textContent }));
  verifier("revoir : la vitesse change (1× puis 2×)", v.v === 2 && v.txt === "2×", v);
  await p.evaluate(() => { const c = document.getElementById("revCurseur"); c.value = String(Math.floor(revue.max / 2)); c.dispatchEvent(new Event("input")); });
  const milieu = await p.evaluate(() => revue.t);
  await p.click("#revSuiv");
  const suiv = await p.evaluate(() => ({ t: revue.t, info: document.getElementById("revInfo").textContent }));
  verifier("revoir : curseur au milieu, puis un coup plus loin", suiv.t === milieu + 1 && new RegExp("Coup " + (milieu + 1) + " sur").test(suiv.info), { milieu, suiv });
  const tailles = await mesurer(p);
  verifier("revoir : cibles de 44 px, rien ne déborde", !tailles.deborde && tailles.petits.length === 0, tailles);
  await p.screenshot({ path: OUT + "paper-race-grille-08-revoir.png" });
  await p.click("#revFermer");
  const ferme = await p.evaluate(() => ({ revue, win: document.getElementById("win").style.display, bas: document.getElementById("bas").hidden }));
  verifier("revoir : « Fermer » rend la carte d'arrivée", ferme.revue === null && ferme.win === "flex" && !ferme.bas, ferme);
  await ctx.close();
}

/* ---------- 2. Grand Prix à 6 ---------- */
{
  const ctx = await chrome.newContext({ ...devices["Pixel 9"], reducedMotion: "reduce" });
  const p = await ctx.newPage(); suivre(p);
  await p.goto(URL_JEU);
  await p.locator("#solo").click();
  await p.locator("#grandprix").click();
  await p.locator("#v6").click();
  const acc = await p.evaluate(() => ({ mode, n: nbVoitures, circuit: TRACKS[ti].id, s: document.getElementById("tk0").getAttribute("aria-disabled") }));
  verifier("accueil : Grand Prix à 6, un grand circuit choisi", acc.mode === "gp" && acc.n === 6 && pelotonPermisId(acc.circuit), acc);
  verifier("accueil : Le S refusé à 6", acc.s === "true", acc);
  await p.evaluate(() => document.getElementById("tk0").click());   // aria-disabled : Playwright refuse le clic
  await p.waitForFunction(() => document.getElementById("toastAccueil").textContent, null, { timeout: 3000 }).catch(() => { });
  const apres = await p.evaluate(() => ({ circuit: TRACKS[ti].id, toast: document.getElementById("toastAccueil").textContent }));
  verifier("accueil : toucher Le S à 6 dit pourquoi, sans le choisir", apres.circuit !== "s" && /trop étroit/.test(apres.toast), apres);
  await p.screenshot({ path: OUT + "paper-race-grille-02-accueil-gp.png" });
  const spa = await p.evaluate(() => TRACKS.findIndex((t) => t.id === "spa"));
  await p.locator("#tk" + spa).click();
  await p.locator("#jouer").click();
  await pret(p);
  const d = await p.evaluate(() => ({ n: R.cars.length, puces: document.querySelectorAll("#plrow .pl").length, serre: document.getElementById("plrow").classList.contains("serre"), regles: R.regles }));
  const pg = await p.evaluate(() => ({ pieges: R.pieges, zones: !!R.track.zones, origine: !!TRACKS[ti].zones }));
  verifier("Grand Prix : pièges présents par défaut", pg.pieges && pg.zones && pg.origine, pg);
  verifier("Grand Prix : 6 voitures, 6 pastilles", d.n === 6 && d.puces === 6 && d.serre && d.regles === "grille", d);
  const m = await mesurer(p);
  verifier("Grand Prix : rien ne déborde, cibles de 44 px", !m.deborde && m.petits.length === 0, m);
  await p.screenshot({ path: OUT + "paper-race-grille-03-gp-depart.png" });

  // annuler : on revient avant SON coup, les réponses des fantômes comprises
  const avant = await p.evaluate(() => ({ c: R.cars.map((c) => c.coups).join(), m: R.manche }));
  await jouerUnCoup(p);
  await pret(p);
  const milieu = await p.evaluate(() => R.cars[0].coups);
  await p.locator("#annuler").click();
  const annule = await p.evaluate(() => ({ c: R.cars.map((c) => c.coups).join(), m: R.manche }));
  verifier("Grand Prix : annuler défait ton coup et ceux des fantômes", milieu > 0 && annule.c === avant.c && annule.m === avant.m, { avant, milieu, annule });

  // la course survit à un rechargement
  for (let i = 0; i < 3; i++) { await pret(p); await jouerUnCoup(p); }
  await pret(p);
  const g1 = await p.evaluate(() => JSON.stringify({ c: R.cars.map((c) => c.p), m: R.manche, t: R.turn, g: R.grille }));
  await p.reload();
  await pret(p);
  const g2 = await p.evaluate(() => JSON.stringify({ c: R.cars.map((c) => c.p), m: R.manche, t: R.turn, g: R.grille }));
  verifier("Grand Prix : la course à 6 reprend après un rechargement", g1 === g2, { g1, g2 });

  await jusquAuDrapeau(p);
  const f = await p.evaluate(() => ({ items: document.querySelectorAll("#winclass li").length, titre: document.getElementById("wintitle").textContent, photo: R.photo }));
  verifier("Grand Prix : classement de 6 voitures à l'arrivée", f.items === 6 && /Victoire|Tu finis \d/.test(f.titre), f);
  await p.screenshot({ path: OUT + "paper-race-grille-04-gp-arrivee.png" });
  await ctx.close();
}
function pelotonPermisId(id) { return ["monza", "montreal", "monaco", "spa"].includes(id); }

/* ---------- 3. l'attente entre deux coups, animations normales ---------- */
{
  const ctx = await chrome.newContext({ ...devices["Pixel 9"] });
  const p = await ctx.newPage(); suivre(p);
  await p.goto(URL_JEU);
  await reglages(p, { mode: "gp", level: "normal", voitures: 6, circuit: "monza" });
  await p.reload();
  // l'interrupteur des pièges : visible hors championnat, et la course suit
  const sw = await p.evaluate(() => ({ vu: !document.getElementById("pieges").hidden, etat: document.getElementById("pieges").getAttribute("aria-checked") }));
  await p.click("#pieges");
  const sw2 = await p.evaluate(() => ({ etat: document.getElementById("pieges").getAttribute("aria-checked"), txt: document.getElementById("piegesEtat").textContent, garde: JSON.parse(localStorage.getItem("paper-race.reglages.v1")).pieges }));
  verifier("pièges : un interrupteur hors championnat, retenu", sw.vu && sw.etat === "true" && sw2.etat === "false" && sw2.txt === "non" && sw2.garde === false, { sw, sw2 });
  await p.locator("#jouer").click();
  const sans = await p.evaluate(() => ({ pieges: R.pieges, zones: R.track.zones, origine: !!TRACKS[ti].zones }));
  verifier("pièges : la course part sans pièges, le circuit garde les siens", sans.pieges === false && !sans.zones && sans.origine, sans);
  await p.evaluate(() => { mode = "solo"; majAccueil(); });
  const champ = await p.evaluate(() => document.getElementById("pieges").hidden);
  verifier("pièges : pas d'interrupteur pour le championnat", champ);
  await p.evaluate(() => { mode = "gp"; majAccueil(); });
  const attentes = [];
  for (let i = 0; i < 6; i++) {
    await pret(p);
    if (await fini(p)) break;
    await jouerUnCoup(p);
    const t0 = Date.now();
    await pret(p);
    attentes.push(Date.now() - t0);
  }
  // les ralentis (Dépassement, Sortie) ajoutent ~1,2 s quand ils passent : on juge la médiane
  const med = attentes.slice().sort((a, b) => a - b)[Math.floor(attentes.length / 2)];
  verifier("Grand Prix à 6 : attente médiane entre deux de tes coups sous 4 s", med < 4000, attentes);
  await p.screenshot({ path: OUT + "paper-race-grille-05-gp-en-course.png" });
  await ctx.close();
}

/* ---------- 4. anciennes sauvegardes, championnat ---------- */
{
  const ctx = await chrome.newContext({ ...devices["Pixel 9"], reducedMotion: "reduce" });
  const p = await ctx.newPage(); suivre(p);
  await p.goto(URL_JEU);
  // une course à deux rangée par la v7 (format v2, sans règles)
  const v2 = await p.evaluate(() => {
    const r = newRace(TRACKS.findIndex((t) => t.id === "ovale"), 1, "premier");
    r.turn = 1; r.cars[0].coups = 1;
    return { v: 2, id: "ovale", fin: "premier", laps: 1, cars: r.cars, turn: 1, winner: null, dernier: null, mode: "duo", level: "normal", caps: [0, 0], capsAvant: [null, null], dernierMoment: -9, ecran: "jeu" };
  });
  await p.evaluate((o) => localStorage.setItem("paper-race.course.v1", JSON.stringify(o)), v2);
  await p.reload();
  await pret(p);
  const r = await p.evaluate(() => ({ regles: R.regles, turn: R.turn, n: R.cars.length, jeu: document.getElementById("game").style.display }));
  verifier("sauvegarde v7 : la course à deux reprend avec ses règles", r.regles === "classique" && r.turn === 1 && r.n === 2 && r.jeu === "flex", r);
  await p.evaluate(() => { localStorage.removeItem("paper-race.course.v1"); mode = "solo"; ti = 0; start(); });
  const c = await p.evaluate(() => ({ regles: R.regles, n: R.cars.length, fin: R.fin }));
  verifier("championnat : toujours la course de la v7", c.regles === "classique" && c.n === 2 && c.fin === "joueur", c);
  await ctx.close();
}

/* ---------- 5. petits écrans ---------- */
for (const [nom, lance, opts] of [["360x640", chrome, { ...devices["Pixel 9"], viewport: { width: 360, height: 640 } }], ["iPhone", null, { ...devices["iPhone 13"] }]]) {
  const nav = lance || await webkit.launch();
  const ctx = await nav.newContext({ ...opts, reducedMotion: "reduce" });
  const p = await ctx.newPage(); suivre(p);
  await p.goto(URL_JEU);
  await reglages(p, { mode: "gp", level: "normal", voitures: 6, circuit: "monaco" });
  await p.reload();
  const a = await mesurer(p);
  verifier(`${nom} : l'accueil du Grand Prix tient`, !a.deborde && a.petits.length === 0, a);
  const jouerVisible = await p.evaluate(() => { const r = document.getElementById("jouer").getBoundingClientRect(); return r.bottom <= window.innerHeight + 1; });
  verifier(`${nom} : « Jouer » reste sous le pouce`, jouerVisible);
  await p.screenshot({ path: OUT + `paper-race-grille-06-${nom}-accueil.png` });
  await p.locator("#jouer").click();
  await pret(p);
  const m = await mesurer(p);
  verifier(`${nom} : la course à 6 tient`, !m.deborde && m.petits.length === 0, m);
  await p.screenshot({ path: OUT + `paper-race-grille-07-${nom}-course.png` });
  await ctx.close();
  if (!lance) await nav.close();
}

verifier("aucune erreur dans la console", erreurs.length === 0, erreurs.slice(0, 5));
await chrome.close();
await site.fermer?.();
console.log(echecs ? `\n${echecs} ECHEC(S)` : "\nPAPER RACE GRILLE OK");
process.exit(echecs ? 1 : 0);
