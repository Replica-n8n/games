import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : la PWA sur un Pixel 9 en paysage. Vérifie que la page se charge sans
   erreur avec ses polices, que le service worker prend la main, que son cache
   contient EXACTEMENT les fichiers du dépôt (octet par octet), qu'une partie
   démarre et que le requin bouge, puis que le jeu se relance hors ligne.
   Capture dans tools/captures/toto-*.png. `node tools/toto-pwa.mjs --enligne`
   fait pareil contre la version publiée. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const JEU = path.join(HERE, "..", "toto");
const CAPT = path.join(HERE, "captures");
fs.mkdirSync(CAPT, { recursive: true });

const sw = fs.readFileSync(path.join(JEU, "sw.js"), "utf8");
const SHELL = JSON.parse(sw.slice(sw.indexOf("var SHELL = ") + 12, sw.indexOf("];") + 1));
const echecs = [];
const verifie = (ok, quoi) => { console.log((ok ? "ok    " : "ÉCHEC ") + quoi); if (!ok) echecs.push(quoi); };

for (const f of SHELL) if (f !== "./") verifie(fs.existsSync(path.join(JEU, f)), "présent dans le dépôt : " + f);

/* `--enligne` : la même batterie contre ce que GitHub Pages sert vraiment. */
const ENLIGNE = process.argv.includes("--enligne");
const srv = ENLIGNE ? { arreter() {} } : await servir();
const url = ENLIGNE ? "https://replica-n8n.github.io/games/toto/" : srv.base + "toto/";
console.log("URL testée : " + url);
const nav = await chromium.launch();
const profil = devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"];
const ctx = await nav.newContext({ ...profil });
const page = await ctx.newPage();
const erreurs = [];
page.on("pageerror", (e) => erreurs.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });

await page.goto(url);
await page.waitForFunction(() => navigator.serviceWorker.ready.then(() => true));
await page.reload();
verifie(await page.evaluate(() => !!navigator.serviceWorker.controller), "le service worker contrôle la page");
await page.evaluate(() => document.fonts.ready);
verifie(await page.evaluate(() => document.fonts.check("800 20px 'Big Shoulders Stencil'") && document.fonts.check("700 14px 'Barlow Semi Condensed'")), "polices du pochoir et de la grotesque chargées");
verifie(await page.evaluate(() => [...document.querySelectorAll("link")].every((l) => !l.href.includes("googleapis"))), "aucune police demandée à Google");

/* Le cache, comparé au dépôt : c'est lui que le téléphone sert. */
const cache = await page.evaluate(async () => {
  const noms = (await caches.keys()).filter((k) => k.startsWith("toto:"));
  const c = await caches.open(noms[0]);
  const out = { noms, fichiers: {} };
  for (const req of await c.keys()) {
    let b = new Uint8Array(await (await c.match(req)).arrayBuffer());
    /* Fichiers texte : sans les 
, Windows les écrit en CRLF, Pages les sert en LF. */
    if (/(\/|\.html|\.json|\.js)$/.test(new URL(req.url).pathname)) b = b.filter((x) => x !== 13);
    out.fichiers[new URL(req.url).pathname] = b.length + ":" + b.reduce((h, x) => (h * 31 + x) >>> 0, 7);
  }
  return out;
});
verifie(cache.noms.length === 1, "un seul cache toto : " + cache.noms.join(", "));
for (const f of SHELL) {
  let disque = fs.readFileSync(path.join(JEU, f === "./" ? "index.html" : f));
  if (/(\/|\.html|\.json|\.js)$/.test(f)) disque = disque.filter((x) => x !== 13);
  const attendu = disque.length + ":" + disque.reduce((h, x) => (h * 31 + x) >>> 0, 7);
  const cle = new URL(url).pathname + f.replace(/^\.\//, "");
  verifie(cache.fichiers[cle] === attendu, "cache identique au dépôt : " + f);
}

await page.screenshot({ path: path.join(CAPT, "toto-titre.png") });
/* Le bouton qui lance la partie doit se voir sans défiler (un titre plus long
   l'avait poussé hors de l'écran en paysage). */
const bouton = await page.locator("#bNew").boundingBox();
verifie(bouton && bouton.y + bouton.height <= profil.viewport.height, "« Plonger » visible sans défiler, en paysage");
verifie(await page.isVisible("#title .bInst"), "« Installer le jeu » sur l'écran titre, comme les autres jeux");

/* Une partie : Plonger, nager à droite, mordre. */
await page.click("#bNew");
await page.waitForTimeout(400);
const avant = await page.evaluate(() => getComputedStyle(document.getElementById("title")).display);
verifie(avant === "none", "l'écran titre disparaît après « Plonger »");
const narr = await page.textContent("#narr");
verifie(/requin-bouledogue/.test(narr), "le narrateur ouvre la partie : " + narr);
const miniAvant = await page.evaluate(() => document.getElementById("mini").toDataURL());
await page.keyboard.down("ArrowRight");
await page.waitForTimeout(1800);
await page.keyboard.press("ShiftLeft");
await page.waitForTimeout(600);
await page.keyboard.up("ArrowRight");
const miniApres = await page.evaluate(() => document.getElementById("mini").toDataURL());
verifie(miniAvant !== miniApres, "le requin bouge (la minicarte a changé)");
verifie((await page.textContent("#stg")) === "Bébé" && (await page.textContent("#objt")).length > 10, "HUD : stade et objectif affichés");
await page.screenshot({ path: path.join(CAPT, "toto-partie.png") });

/* Morsure automatique : pas de bouton, elle part dès qu'une proie touche la gueule.
   Un poisson posé DERRIÈRE la queue ne doit pas être mangé, un autre posé devant oui. */
verifie(!(await page.$("#bBite")), "plus de bouton « Mordre »");
verifie(await page.isVisible("#bDash"), "le bouton « Foncer » reste");
const morsure = await page.evaluate(async () => {
  const E = window.__essais, P = E.P;
  const attendre = (ms) => new Promise((ok) => setTimeout(ok, ms));
  /* On l'immobilise tournée à droite, loin des autres bêtes. */
  E.ents.length = 0; P.x = 1200; P.y = 900; P.vx = P.vy = 0; P.dang = 0; P.face = 1; P.biteCd = 0;
  const fige = setInterval(() => { P.x = 1200; P.y = 900; P.vx = P.vy = 0; P.dang = 0; }, 5);
  const derriere = E.mkEnt("poisson", P.x - P.r * 1.6, P.y, { ai: "wander", spd: 0 });
  E.ents.push(derriere);
  await attendre(500);
  const survit = !derriere.dead;
  const avant = { xp: P.xp, lvl: P.lvl, p: P.nut.p };
  const devant = E.mkEnt("poisson", P.x + P.r * 1.4, P.y, { ai: "wander", spd: 0 });
  E.ents.push(devant);
  await attendre(500);
  clearInterval(fige);
  return { survit, mange: devant.dead, proteines: P.nut.p - avant.p };
});
verifie(morsure.survit, "un poisson derrière la queue n'est pas mordu");
verifie(morsure.mange && morsure.proteines > 0, "un poisson devant la gueule est mangé sans rien toucher (+" + morsure.proteines + " protéines)");

/* HUD : chaque barre porte son nom à gauche. */
const noms = await page.$$eval("#stat .jauge > span:first-child", (l) => l.map((x) => x.textContent));
verifie(noms.join(",") === "Vie,Ventre,Croissance", "barres nommées à gauche : " + noms.join(", "));

/* Montée de niveau : grand « Niveau N ! » et onde qui repousse les bêtes. */
const niveau = await page.evaluate(async () => {
  const E = window.__essais, P = E.P;
  const attendre = (ms) => new Promise((ok) => setTimeout(ok, ms));
  E.ents.length = 0; P.x = 1200; P.y = 900; P.vx = P.vy = 0; P.dang = 0; P.face = 1; P.biteCd = 0;
  P.xp = 25 + 8 * P.lvl * P.lvl - 1;
  const voisin = E.mkEnt("tortue", P.x - P.r * 3, P.y, { ai: "wander", spd: 0 });
  E.ents.push(voisin);
  const d0 = Math.hypot(voisin.x - P.x, voisin.y - P.y), lvl0 = P.lvl;
  E.ents.push(E.mkEnt("poisson", P.x + P.r * 1.4, P.y, { ai: "wander", spd: 0 }));
  await attendre(250);
  const gros = E.texts.find((t) => t.big);
  return { lvl0, lvl: P.lvl, texte: gros && gros.t, recul: Math.hypot(voisin.x - P.x, voisin.y - P.y) - d0 };
});
verifie(niveau.lvl === niveau.lvl0 + 1, "le poisson fait monter de niveau (" + niveau.lvl0 + " → " + niveau.lvl + ")");
verifie(/Niveau \d+ !/.test(niveau.texte || ""), "grand texte au-dessus d'elle : " + niveau.texte);
verifie(niveau.recul > 20, "l'onde repousse la bête voisine de " + Math.round(niveau.recul) + " px");
await page.waitForTimeout(150);
await page.screenshot({ path: path.join(CAPT, "toto-niveau.png") });

/* Mutation payable : badge, objectif, et flèche vers la grotte. */
await page.evaluate(() => { const P = window.__essais.P; P.x = 2300; P.y = 900; Object.assign(P.nut, { p: 30, f: 20, m: 15 }); });
await page.waitForTimeout(400);
verifie(await page.isVisible("#mutok"), "badge « Mutation prête » affiché");
verifie(/grotte/.test(await page.textContent("#objt")), "l'objectif envoie à la grotte");
verifie(/muter/.test(await page.textContent("#narr")), "le narrateur le dit : " + (await page.textContent("#narr")));
await page.screenshot({ path: path.join(CAPT, "toto-mutation.png") });
await page.evaluate(() => { Object.assign(window.__essais.P.nut, { p: 0, f: 0, m: 0 }); });
await page.waitForTimeout(300);
verifie(!(await page.isVisible("#mutok")), "le badge disparaît sans assez de nutriments");

/* Verrous : il faut l'alpha de la zone, en plus de la force. */
const verrous = await page.evaluate(async () => {
  const E = window.__essais, P = E.P, G = E.GATES;
  const attendre = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const essai = async (gi, prep) => {
    const g = G[gi]; g.hp = g.max; delete P.gates[g.id]; prep();
    const t = setInterval(() => { E.ents.length = 0; P.hp = 1e6;
      if (gi === 0) { P.x = g.x - 18 - P.r + 3; P.y = 500; P.vx = 8; P.dashT = .3; }
      else { P.x = g.x - 26 - P.r * 1.6; P.y = 450; P.vx = P.vy = 0; P.dang = 0; P.face = 1; } }, 4);
    await attendre(1500); clearInterval(t);
    return g.max - g.hp;
  };
  const r = {};
  r.ecluseSansAlpha = await essai(0, () => { P.lvl = 5; P.bosses = {}; });
  r.ecluseAvecAlpha = await essai(0, () => { P.lvl = 5; P.bosses = { b0: true }; });
  r.digueSansAlpha = await essai(1, () => { P.evo.os = 1; P.bosses = { b0: true }; });
  r.digueAvecAlpha = await essai(1, () => { P.evo.os = 1; P.bosses = { b0: true, b1: true }; });
  P.lvl = 1; P.bosses = {}; P.evo = {}; P.dashT = 0;
  for (const g of G) { g.hp = g.max; delete P.gates[g.id]; }
  return r;
});
verifie(verrous.ecluseSansAlpha === 0 && verrous.ecluseAvecAlpha > 0, "écluse : tient sans Ti-Croc vaincu, cède avec (" + JSON.stringify(verrous) + ")");
verifie(verrous.digueSansAlpha === 0 && verrous.digueAvecAlpha > 0, "digue : tient sans Lame-d'Argent vaincue, cède avec la mâchoire en os");

/* Nageurs : la couleur du maillot ne dépend plus de leur position. */
const maillot = await page.evaluate(async () => {
  const E = window.__essais, n = E.mkEnt("nageur", 3300, 304);
  const vu = new Set(); for (let k = 0; k < 12; k++) { n.x = 3300 + k * 0.37; vu.add(n.suit); } return Number.isInteger(n.suit) ? vu.size : 0;
});
verifie(maillot === 1, "un nageur garde la même couleur en bougeant");

/* Options : le bouton met en pause, Reprendre relance. */
await page.click("#bPause");
verifie((await page.evaluate(() => window.__essais.state)) === "pause" && (await page.isVisible("#pause")), "le bouton d'options met en pause");
const xFige = await page.evaluate(() => window.__essais.P.x);
await page.waitForTimeout(400);
verifie((await page.evaluate(() => window.__essais.P.x)) === xFige, "rien ne bouge pendant la pause");
verifie(await page.isVisible("#pause .bInst"), "« Installer le jeu » proposé dans les options");
await page.screenshot({ path: path.join(CAPT, "toto-pause.png") });
await page.click("#bResume");
verifie((await page.evaluate(() => window.__essais.state)) === "play", "« Reprendre » relance la partie");

/* Hors ligne : le jeu doit se relancer depuis le cache. */
await ctx.setOffline(true);
await page.reload();
await page.evaluate(() => document.fonts.ready);
verifie((await page.textContent("h1")) === "Teeth of the Ocean", "se relance hors ligne");
verifie(await page.evaluate(() => document.fonts.check("800 20px 'Big Shoulders Stencil'")), "polices présentes hors ligne");
await page.screenshot({ path: path.join(CAPT, "toto-horsligne.png") });

verifie(erreurs.length === 0, "console sans erreur" + (erreurs.length ? " : " + erreurs.join(" | ") : ""));
await nav.close();
srv.arreter();
console.log(echecs.length ? `\n${echecs.length} échec(s)` : "\nTout est vert.");
process.exit(echecs.length ? 1 : 0);
