import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { servir } from "./serveur.mjs";

/* Pièce à conviction, l'app installable. Ce que le banc prouve :
   1. SHELL (sw.js) contient TOUT ce que le jeu charge, et rien qui n'existe pas ;
   2. après la première visite, le cache contient chaque fichier À L'OCTET PRÈS
      comme dans le dépôt (un relais de Pages pourrait servir l'ancien) ;
   3. réseau coupé, l'accueil et une enquête se rechargent et se jouent ;
   4. une version suivante s'installe seule, fait le ménage de l'ancien cache,
      propose de recharger par un bandeau et ne recharge JAMAIS d'elle-même ;
   5. le bouton « Installer » est là tant que l'app n'est pas installée.
     node tools/conviction-pwa.mjs             contre le dépôt
     node tools/conviction-pwa.mjs --enligne   contre la production (1 à 4) */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const JEU = path.join(ICI, "..", "conviction");
const ENLIGNE = process.argv.includes("--enligne");
const echecs = [];
const verifie = (nom, ok, detail) => { if (!ok) echecs.push(nom + (detail !== undefined ? " : " + detail : "")); };

const swTexte = fs.readFileSync(path.join(JEU, "sw.js"), "utf8");
const VERSION = swTexte.match(/var VERSION = "([^"]+)"/)[1];
const SHELL = [...swTexte.match(/var SHELL = \[([\s\S]*?)\];/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

// 1. SHELL contre le disque.
for (const f of SHELL) if (f !== "./") verifie(`SHELL : ${f} existe`, fs.existsSync(path.join(JEU, f)));
const puzzles = JSON.parse(fs.readFileSync(path.join(JEU, "puzzles", "index.json"), "utf8"));
for (const id of puzzles) verifie(`SHELL contient l'enquête ${id}`, SHELL.includes(`./puzzles/${id}.json`));

const srv = ENLIGNE ? null : await servir();
const BASE = ENLIGNE ? "https://replica-n8n.github.io/games/conviction/" : srv.base + "conviction/";
const nav = await chromium.launch();
const ctx = await nav.newContext({ ...devices["Pixel 9"] });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));

// Première visite : l'accueil, puis une enquête de chaque taille, pour voir tout ce qui est chargé.
const charges = new Set();
p.on("request", (r) => { const u = new URL(r.url()); if (u.href.startsWith(BASE)) charges.add("./" + u.pathname.slice(new URL(BASE).pathname.length)); });
await p.goto(BASE);
await p.waitForSelector("#accueil:not([hidden])");
for (const id of [puzzles[0], puzzles.find((x) => x.includes("dix")) ?? puzzles[1]]) {
  await p.goto(BASE + "?enquete=" + id);
  await p.waitForSelector("#jeu:not([hidden])");
}
await p.evaluate(() => navigator.serviceWorker.ready);
for (const f of charges) {
  const propre = f.split("?")[0];
  if (propre === "./sw.js") continue;
  verifie(`SHELL contient ${propre}, que le jeu charge`, SHELL.includes(propre) || propre === "./");
}

// 2. Le cache, fichier par fichier, contre le dépôt.
await p.reload();
await p.waitForFunction(() => !!navigator.serviceWorker.controller);
// Lu depuis un onglet à part, fermé ensuite : un cache ouvert dans une page
// bloque sa suppression, et l'activation de la version suivante attendrait.
const lecteur = await ctx.newPage();
await lecteur.goto(BASE + "manifest.json");
const cache = await lecteur.evaluate(async (v) => {
  const noms = await caches.keys();
  const nom = noms.find((k) => k.startsWith("conviction:") && k.endsWith(":" + v));
  if (!nom) return { noms };
  const c = await caches.open(nom);
  const out = {};
  for (const req of await c.keys()) {
    const buf = await (await c.match(req)).arrayBuffer();
    out[new URL(req.url).pathname] = Array.from(new Uint8Array(buf)).reduce((h, b) => (h * 31 + b) >>> 0, 7);
  }
  return { nom, out };
}, VERSION);
await lecteur.close();
verifie(`un cache conviction:…:${VERSION} existe`, !!cache.nom, JSON.stringify(cache.noms));
if (cache.nom) {
  const racine = new URL(BASE).pathname;
  for (const f of SHELL) {
    if (f === "./") continue;
    const cle = racine + f.slice(2);
    // En ligne, la référence est ce qui est publié (main dans git, fins de ligne
    // LF) ; le disque d'un poste Windows peut être en CRLF.
    const octets = ENLIGNE ? execFileSync("git", ["show", `origin/main:conviction/${f.slice(2)}`], { cwd: JEU }) : fs.readFileSync(path.join(JEU, f));
    const disque = Array.from(octets).reduce((h, b) => (h * 31 + b) >>> 0, 7);
    verifie(`cache = dépôt : ${f}`, cache.out[cle] === disque, cache.out[cle] === undefined ? "absent" : "contenu différent");
  }
}

// 3. Hors ligne : l'accueil et une enquête se rechargent et se jouent.
await ctx.setOffline(true);
await p.goto(BASE);
await p.waitForSelector("#accueil:not([hidden])", { timeout: 8000 }).catch(() => {});
verifie("hors ligne : l'accueil liste toutes les enquêtes", (await p.$$eval(".variante", (e) => e.length).catch(() => 0)) === puzzles.length);
const enq = puzzles.find((x) => x.startsWith("westeros")) ?? puzzles[0];
await p.goto(BASE + "?enquete=" + enq);
await p.waitForSelector("#jeu:not([hidden])", { timeout: 8000 }).catch(() => {});
const jouable = await p.evaluate(async () => {
  const c = document.querySelector(".cell:not(.blocked)");
  if (!c) return false;
  c.click();
  await new Promise((r) => setTimeout(r, 100));
  return !!document.querySelector(".cell .pawn:not([hidden])");
});
verifie("hors ligne : une enquête se joue (un pion se pose)", jouable);
verifie("hors ligne : les polices sont là", await p.evaluate(() => document.fonts.check('16px "Atkinson Hyperlegible"')));
await ctx.setOffline(false);

// 4. Mise à jour (contre le dépôt seulement : on sert un sw.js de version suivante).
if (!ENLIGNE) {
  const SUIVANTE = VERSION + "-essai";
  // Le navigateur va chercher sw.js lui-même (Playwright ne l'intercepte pas) :
  // la version suivante est écrite sur le disque le temps de l'essai, et
  // l'original revient quoi qu'il arrive.
  const swChemin = path.join(JEU, "sw.js");
  const remettre = () => fs.writeFileSync(swChemin, swTexte);
  process.on("exit", remettre);
  fs.writeFileSync(swChemin, swTexte.replace(`var VERSION = "${VERSION}"`, `var VERSION = "${SUIVANTE}"`));
  // Un cache d'une autre app de la même origine : la mise à jour ne doit pas y toucher.
  await p.evaluate(() => caches.open("bataille:/games/bataille/:V12").then((c) => c.put("/temoin", new Response("x"))));
  const pions = await p.$$eval(".cell .pawn:not([hidden])", (e) => e.length);
  let recharge = false;
  p.on("framenavigated", (f) => { if (f === p.mainFrame()) recharge = true; });
  await p.evaluate(() => { Object.defineProperty(document, "hidden", { value: false, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
  await p.waitForSelector("#maj:not([hidden])", { timeout: 15000 }).catch(() => {});
  verifie("une nouvelle version propose de recharger", await p.isVisible("#maj"));
  verifie("elle ne recharge jamais la page d'elle-même", !recharge);
  verifie("la partie en cours est intacte", (await p.$$eval(".cell .pawn:not([hidden])", (e) => e.length)) === pions);
  // Le ménage se fait à l'activation : lui laisser jusqu'à 45 s.
  // (waitForFunction ne patiente pas sur une promesse : une vraie boucle.)
  const t0 = Date.now();
  while (Date.now() - t0 < 45000 && (await p.evaluate((v) => caches.keys().then((k) => k.some((x) => x.startsWith("conviction:") && x.endsWith(":" + v))), VERSION))) await p.waitForTimeout(500);
  const noms = await p.evaluate(() => caches.keys());
  verifie("l'ancien cache est supprimé, le nouveau est là", noms.some((k) => k.endsWith(":" + SUIVANTE)) && !noms.some((k) => k.endsWith(":" + VERSION)), noms.join(", "));
  remettre();
  verifie("le cache d'une autre app survit à la mise à jour", noms.includes("bataille:/games/bataille/:V12"), noms.join(", "));

  // 5. Installer : sans invitation de Chrome, le bouton dit où est la commande.
  await p.goto(BASE);
  await p.waitForSelector("#accueil:not([hidden])");
  verifie("le bouton Installer est sur l'accueil", await p.isVisible("#installer"));
  await p.click("#installer");
  verifie("sans invitation, il explique où installer", await p.isVisible("#aide-installer"));
  verifie("la version s'affiche sur l'accueil", /Version/.test(await p.textContent("#version")), await p.textContent("#version"));
}

verifie("aucune erreur de page", erreurs.length === 0, erreurs.join(" | "));
await nav.close();
srv?.arreter();
if (echecs.length) { console.log(`✗ ${echecs.length} problème(s) :\n  ` + echecs.join("\n  ")); process.exit(1); }
console.log(`✓ Pièce à conviction ${VERSION} : installable, hors ligne, mises à jour${ENLIGNE ? " (production)" : ""}`);
process.exit(0);
