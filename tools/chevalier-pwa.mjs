import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { servir } from "./serveur.mjs";

/* Ce que ce controle prouve, et rien d'autre :
   la page s'ouvre, le service worker prend le controle au rechargement,
   et le jeu se relance HORS LIGNE. Un manifest.json present ne prouve rien. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "captures") + path.sep;
fs.mkdirSync(OUT, { recursive: true });

const site = await servir();
const navigateur = await chromium.launch();
const ctx = await navigateur.newContext({ ...devices["Pixel 9"] });
const p = await ctx.newPage();
const erreurs = [];
p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
p.on("pageerror", (e) => erreurs.push("pageerror: " + e.message));

const etat = () => p.evaluate(() => {
  const cv = document.getElementById("jeu");
  const c = cv.getContext("2d").getImageData(Math.round(cv.width / 2), 30, 1, 1).data;
  return {
    version: window.jeu && window.jeu.version,
    taille: window.jeu && window.jeu.taille(),
    pixel: [c[0], c[1], c[2]],
    controle: !!navigator.serviceWorker.controller,
  };
});

/* 1. la page s'ouvre */
await p.goto(site.jeu, { waitUntil: "networkidle" });
await p.waitForTimeout(500);
const ouverture = await etat();
await p.screenshot({ path: OUT + "serpentin-01-ouverture.png" });

/* 2. le service worker prend le controle au rechargement */
await p.evaluate(() => navigator.serviceWorker.ready.then(() => true));
await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(300);
const apresRechargement = await etat();

/* 3. hors ligne */
await ctx.setOffline(true);
await p.reload({ waitUntil: "domcontentloaded" });
await p.waitForTimeout(600);
const horsLigne = await etat();
await p.screenshot({ path: OUT + "serpentin-02-hors-ligne.png" });

/* 4. LE BOUTON « INSTALLER » DISPARAIT UNE FOIS LE JEU INSTALLE, ET REVIENT
      SI ON LE DESINSTALLE.

   ⚠️ On ne retient rien dans `localStorage` : ca survivrait a la
   desinstallation et le bouton disparaitrait POUR TOUJOURS, sans qu'aucune
   manipulation ne le ramene. On redemande au navigateur a chaque ouverture du
   menu — c'est exactement ce que ce controle verifie, en rouvrant le menu
   entre chaque etat.

   ⚠️ Et il y avait un piege, mesure : `getInstalledRelatedApps()` rend une
   liste VIDE des qu'on n'est pas servi depuis l'adresse declaree dans le
   manifeste, donc toujours en local. Sans priorite donnee a ce qu'on a vu de
   nos yeux (`appinstalled`), le bouton se recachait puis reapparaissait a
   l'ouverture suivante du menu. */
await ctx.setOffline(false);
await p.goto(site.jeu, { waitUntil: "networkidle" });
await p.evaluate(() => { window.jeu.choisirPerso("chevalier"); window.jeu.commencer(5); });

async function boutonInstaller(quoi) {
  await p.evaluate(() => document.getElementById("menuBouton").click());
  await p.waitForTimeout(250);
  const visible = await p.evaluate(() => !document.getElementById("installer").hidden);
  await p.evaluate(() => window.jeu.menu("fermer"));
  await p.waitForTimeout(120);
  return { quoi, visible };
}

const installation = [];
installation.push(await boutonInstaller("dans un onglet, pas installe"));
await p.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
installation.push(await boutonInstaller("apres l installation"));
await p.evaluate(() => {
  /* Chrome reemet `beforeinstallprompt` apres une desinstallation : c'est ce
     signal-la, et pas une memoire a nous, qui fait revenir le bouton */
  const e = new Event("beforeinstallprompt");
  e.prompt = () => {};
  e.userChoice = Promise.resolve({});
  window.dispatchEvent(e);
});
installation.push(await boutonInstaller("apres une desinstallation"));

/* et depuis l'application installee, ou proposer de l'installer n'a aucun sens */
const ctxApp = await navigateur.newContext({ ...devices["Pixel 9"] });
const pApp = await ctxApp.newPage();
await pApp.addInitScript(() => {
  const vrai = window.matchMedia;
  window.matchMedia = (q) => q.indexOf("standalone") >= 0
    ? { matches: true, media: q, onchange: null,
        addListener() {}, removeListener() {},
        addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } }
    : vrai.call(window, q);
});
await pApp.goto(site.jeu, { waitUntil: "networkidle" });
await pApp.evaluate(() => { window.jeu.choisirPerso("chevalier"); window.jeu.commencer(5); });
await pApp.evaluate(() => document.getElementById("menuBouton").click());
await pApp.waitForTimeout(250);
installation.push({
  quoi: "depuis l application installee",
  visible: await pApp.evaluate(() => !document.getElementById("installer").hidden),
});

await navigateur.close();
site.arreter();

const vert = (px) => px[1] > px[0] && px[1] > px[2] && px[1] > 100;
const nom = (v) => typeof v === "string" && v.length > 3;

console.log(JSON.stringify({
  ouverture, apresRechargement, horsLigne, installation, erreurs,
  servis: site.servis.filter((s) => s.rel.startsWith("/serpentin/")),
}, null, 2));

const attendu = [true, false, true, false];
const rates = [];
if (!nom(ouverture.version)) rates.push("la page n annonce pas de version");
if (apresRechargement.controle !== true) rates.push("le service worker ne prend pas le controle");
if (horsLigne.version !== ouverture.version) rates.push("hors ligne, la version servie n est pas la meme");
if (!vert(horsLigne.pixel)) rates.push("hors ligne, le jeu ne se dessine pas");
installation.forEach((e, i) => {
  if (e.visible !== attendu[i]) {
    rates.push("bouton installer " + (e.visible ? "visible" : "cache") +
               " " + e.quoi + " : on attendait " + (attendu[i] ? "visible" : "cache"));
  }
});
if (erreurs.length) rates.push("la page a leve " + erreurs.length + " erreur(s)");

rates.forEach((m) => console.log("RATE : " + m));
console.log(rates.length
  ? "\nRATE : " + rates.length + " controle(s)"
  : "\nOK : la page s'ouvre, le sw prend le controle, ca se relance hors ligne, " +
    "et le bouton installer s'efface une fois le jeu installe puis revient.");
process.exit(rates.length ? 1 : 0);
