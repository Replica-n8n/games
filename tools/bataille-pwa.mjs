import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* La Bataille est-elle une vraie PWA ? Le service s'installe, son cache contient
   chaque fichier du SHELL À L'IDENTIQUE du dépôt, le jeu se relance hors ligne
   et une partie démarre sans erreur de page. Capture : captures/bataille-pwa.png. */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const JEU = path.join(ICI, "..", "bataille");
const srv = await servir();
const navigateur = await chromium.launch();
const ctx = await navigateur.newContext({ viewport: { width: 360, height: 732 } });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(String(e)));
const echecs = [];
const verifie = (nom, ok, detail) => { if (!ok) echecs.push(nom + (detail ? " : " + detail : "")); };

await p.goto(srv.base + "bataille/", { waitUntil: "load" });
await p.evaluate(() => navigator.serviceWorker.ready);
/* On coupe le réseau TOUT DE SUITE après l'installation : ce qui n'est pas dans
   SHELL n'a alors aucune autre occasion d'entrer dans le cache. */
await ctx.setOffline(true);
await p.reload({ waitUntil: "load" });
verifie("le service contrôle la page", await p.evaluate(() => !!navigator.serviceWorker.controller));

const cache = await p.evaluate(async () => {
  const noms = (await caches.keys()).filter((k) => k.indexOf("bataille:") === 0);
  const c = await caches.open(noms[0]);
  const sortie = {};
  for (const req of await c.keys()) {
    const octets = new Uint8Array(await (await c.match(req)).arrayBuffer());
    let h = 0; for (const o of octets) h = (h * 31 + o) >>> 0;
    sortie[new URL(req.url).pathname.replace(/^.*\/bataille\//, "") || "./"] = [octets.length, h];
  }
  return { noms, sortie };
});
const version = /VERSION = "([^"]+)"/.exec(fs.readFileSync(path.join(JEU, "sw.js"), "utf8"))[1];
verifie("un seul cache, à la bonne version", cache.noms.length === 1 && cache.noms[0].endsWith(":" + version), cache.noms.join());
for (const f of ["index.html", "polices/fraunces-600-latin.woff2", "polices/outfit-latin.woff2", "manifest.json", "icone-192.png", "icone-512.png"]) {
  const octets = fs.readFileSync(path.join(JEU, f));
  let h = 0; for (const o of octets) h = (h * 31 + o) >>> 0;
  const vu = cache.sortie[f];
  verifie("cache identique au dépôt : " + f, vu && vu[0] === octets.length && vu[1] === h);
}
const manifeste = JSON.parse(fs.readFileSync(path.join(JEU, "manifest.json"), "utf8"));
for (const i of manifeste.icons) verifie("icône présente : " + i.src, fs.existsSync(path.join(JEU, i.src)));

await p.click("#startBtn");
await p.click("#goBtn");
await p.waitForTimeout(2500);
verifie("hors ligne, le combat tourne", (await p.evaluate(() => window.__essais.etat().phase)) === "fight");
verifie("hors ligne, les polices du jeu sont là", await p.evaluate(() => document.fonts.check('600 20px Fraunces') && document.fonts.check('700 20px Outfit')));
verifie("le titre affiche la version du service", (await p.textContent("#version")) === version, await p.textContent("#version"));
verifie("aucune erreur de page", erreurs.length === 0, erreurs.join(" | "));
fs.mkdirSync(path.join(ICI, "captures"), { recursive: true });
await p.screenshot({ path: path.join(ICI, "captures", "bataille-pwa.png") });

await navigateur.close();
srv.arreter();
console.log(echecs.length ? "ÉCHEC\n" + echecs.join("\n") : "bataille-pwa : tout passe (" + version + ")");
process.exit(echecs.length ? 1 : 0);
