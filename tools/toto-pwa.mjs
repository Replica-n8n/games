import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : la PWA sur un Pixel 9 en paysage. Vérifie que la page se charge sans
   erreur avec ses polices, que le service worker prend la main, que son cache
   contient EXACTEMENT les fichiers du dépôt (octet par octet), qu'une partie
   démarre et que le requin bouge, puis que le jeu se relance hors ligne.
   Capture dans tools/captures/toto-*.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const JEU = path.join(HERE, "..", "toto");
const CAPT = path.join(HERE, "captures");
fs.mkdirSync(CAPT, { recursive: true });

const sw = fs.readFileSync(path.join(JEU, "sw.js"), "utf8");
const SHELL = JSON.parse(sw.slice(sw.indexOf("var SHELL = ") + 12, sw.indexOf("];") + 1));
const echecs = [];
const verifie = (ok, quoi) => { console.log((ok ? "ok    " : "ÉCHEC ") + quoi); if (!ok) echecs.push(quoi); };

for (const f of SHELL) if (f !== "./") verifie(fs.existsSync(path.join(JEU, f)), "présent dans le dépôt : " + f);

const srv = await servir();
const url = srv.base + "toto/";
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
verifie(await page.evaluate(() => document.fonts.check("20px Bungee") && document.fonts.check("600 14px Rubik")), "polices Bungee et Rubik chargées");
verifie(await page.evaluate(() => [...document.querySelectorAll("link")].every((l) => !l.href.includes("googleapis"))), "aucune police demandée à Google");

/* Le cache, comparé au dépôt : c'est lui que le téléphone sert. */
const cache = await page.evaluate(async () => {
  const noms = (await caches.keys()).filter((k) => k.startsWith("toto:"));
  const c = await caches.open(noms[0]);
  const out = { noms, fichiers: {} };
  for (const req of await c.keys()) {
    const b = new Uint8Array(await (await c.match(req)).arrayBuffer());
    out.fichiers[new URL(req.url).pathname] = b.length + ":" + b.reduce((h, x) => (h * 31 + x) >>> 0, 7);
  }
  return out;
});
verifie(cache.noms.length === 1, "un seul cache toto : " + cache.noms.join(", "));
for (const f of SHELL) {
  const disque = fs.readFileSync(path.join(JEU, f === "./" ? "index.html" : f));
  const attendu = disque.length + ":" + disque.reduce((h, x) => (h * 31 + x) >>> 0, 7);
  const cle = "/toto/" + f.replace(/^\.\//, "");
  verifie(cache.fichiers[cle] === attendu, "cache identique au dépôt : " + f);
}

await page.screenshot({ path: path.join(CAPT, "toto-titre.png") });
/* Le bouton qui lance la partie doit se voir sans défiler (un titre plus long
   l'avait poussé hors de l'écran en paysage). */
const bouton = await page.locator("#bNew").boundingBox();
verifie(bouton && bouton.y + bouton.height <= profil.viewport.height, "« Plonger » visible sans défiler, en paysage");

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

/* Hors ligne : le jeu doit se relancer depuis le cache. */
await ctx.setOffline(true);
await page.reload();
await page.evaluate(() => document.fonts.ready);
verifie((await page.textContent("h1")) === "Teeth of the Ocean", "se relance hors ligne");
verifie(await page.evaluate(() => document.fonts.check("20px Bungee")), "polices présentes hors ligne");
await page.screenshot({ path: path.join(CAPT, "toto-horsligne.png") });

verifie(erreurs.length === 0, "console sans erreur" + (erreurs.length ? " : " + erreurs.join(" | ") : ""));
await nav.close();
srv.arreter();
console.log(echecs.length ? `\n${echecs.length} échec(s)` : "\nTout est vert.");
process.exit(echecs.length ? 1 : 0);
