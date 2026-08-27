import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";

/* Ce que ce controle prouve, et rien d'autre :
   la page s'ouvre, le service worker prend le controle au rechargement,
   et le jeu se relance HORS LIGNE. Un manifest.json present ne prouve rien.
   Le serveur est local : un service worker demande un contexte sur, et
   127.0.0.1 en est un, contrairement a file://  */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(HERE, "..");
const OUT = path.join(HERE, "captures") + path.sep;
fs.mkdirSync(OUT, { recursive: true });

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
};

const servis = [];
const serveur = http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split("?")[0]);
  if (rel.endsWith("/")) rel += "index.html";
  const fichier = path.join(RACINE, rel);
  if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier)) {
    servis.push({ rel, code: 404 });
    res.writeHead(404).end("non");
    return;
  }
  const type = TYPES[path.extname(fichier)] || "application/octet-stream";
  servis.push({ rel, code: 200, type });
  res.writeHead(200, { "content-type": type });
  fs.createReadStream(fichier).pipe(res);
});

await new Promise((ok) => serveur.listen(0, "127.0.0.1", ok));
const BASE = `http://127.0.0.1:${serveur.address().port}/serpentin/`;

const navigateur = await chromium.launch();
const ctx = await navigateur.newContext({ ...devices["Pixel 9"] });
const p = await ctx.newPage();
const erreurs = [];
p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
p.on("pageerror", (e) => erreurs.push("pageerror: " + e.message));

/* 1. la page s'ouvre */
await p.goto(BASE, { waitUntil: "networkidle" });
const peint = () => p.evaluate(() => {
  const cv = document.getElementById("jeu");
  const c = cv.getContext("2d").getImageData(Math.round(cv.width / 2), 30, 1, 1).data;
  return {
    version: window.serpentin && window.serpentin.version,
    taille: window.serpentin && window.serpentin.taille(),
    pixel: [c[0], c[1], c[2]],
    controle: !!navigator.serviceWorker.controller,
  };
});
const ouverture = await peint();
await p.screenshot({ path: OUT + "serpentin-01-ouverture.png" });

/* 2. le service worker s'installe, puis prend le controle au rechargement */
await p.evaluate(() => navigator.serviceWorker.ready.then(() => true));
await p.reload({ waitUntil: "networkidle" });
const apresRechargement = await peint();

/* 3. hors ligne */
await ctx.setOffline(true);
await p.reload({ waitUntil: "domcontentloaded" });
await p.waitForTimeout(400);
const horsLigne = await peint();
await p.screenshot({ path: OUT + "serpentin-02-hors-ligne.png" });

await navigateur.close();
serveur.close();

const vert = (px) => px[1] > px[0] && px[1] > px[2] && px[1] > 100;
const bilan = {
  ouverture,
  apresRechargement,
  horsLigne,
  erreurs,
  servis: servis.filter((s) => s.rel.startsWith("/serpentin/")),
};
const ok =
  ouverture.version === "etape-1" &&
  apresRechargement.controle === true &&
  horsLigne.version === "etape-1" &&
  vert(horsLigne.pixel) &&
  erreurs.length === 0;

console.log(JSON.stringify(bilan, null, 2));
console.log(ok ? "\nOK : la page s'ouvre, le sw prend le controle, et ca se relance hors ligne."
               : "\nRATE : voir le bilan ci dessus.");
process.exit(ok ? 0 : 1);
