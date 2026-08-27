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
    version: window.serpentin && window.serpentin.version,
    taille: window.serpentin && window.serpentin.taille(),
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

await navigateur.close();
site.arreter();

const vert = (px) => px[1] > px[0] && px[1] > px[2] && px[1] > 100;
const etape = (v) => typeof v === "string" && /^etape-\d+$/.test(v);

console.log(JSON.stringify({
  ouverture, apresRechargement, horsLigne, erreurs,
  servis: site.servis.filter((s) => s.rel.startsWith("/serpentin/")),
}, null, 2));

const ok =
  etape(ouverture.version) &&
  apresRechargement.controle === true &&
  horsLigne.version === ouverture.version &&
  vert(horsLigne.pixel) &&
  erreurs.length === 0;

console.log(ok
  ? "\nOK : la page s'ouvre, le sw prend le controle, et ca se relance hors ligne."
  : "\nRATE : voir le bilan ci dessus.");
process.exit(ok ? 0 : 1);
