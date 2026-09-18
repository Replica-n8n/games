import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

/* Paper Race EN LIGNE : ce que GitHub Pages sert vraiment.
   Des codes 200 et un jeu qui s'ouvre ne prouvent rien : un service installé
   dans les 10 minutes qui suivent un envoi peut ranger l'ANCIEN fichier. On
   compare donc le cache installé au dépôt, octet par octet, puis on coupe le
   réseau et on relance. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const JEU = path.join(HERE, "..", "paper-race");
const URL_JEU = "https://replica-n8n.github.io/games/paper-race/";
const sw = fs.readFileSync(path.join(JEU, "sw.js"), "utf8");
const VERSION = sw.match(/var VERSION = "([^"]+)"/)[1];
const SHELL = [...sw.matchAll(/"\.\/([^"]*)"/g)].map((m) => m[1]).filter((f) => f);

let echecs = 0;
const verifier = (nom, ok, detail) => {
  console.log((ok ? "ok    " : "ECHEC ") + nom + (!ok && detail !== undefined ? "  " + JSON.stringify(detail) : ""));
  if (!ok) echecs++;
};
const hacher = (buf) => { let h = 0; for (const b of buf) h = (h * 31 + b) >>> 0; return { n: buf.length, h }; };

const navigateur = await chromium.launch();
const ctx = await navigateur.newContext({ ...devices["Pixel 9"] });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });

await p.goto(URL_JEU, { waitUntil: "networkidle" });
await p.evaluate(() => navigator.serviceWorker.ready.then(() => true));
await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(500);
const etat = await p.evaluate(async () => {
  const noms = (await caches.keys()).filter((k) => k.indexOf("paper-race:") === 0);
  const fichiers = {};
  if (noms[0]) {
    const c = await caches.open(noms[0]);
    for (const req of await c.keys()) {
      const buf = new Uint8Array(await (await c.match(req)).arrayBuffer());
      fichiers[new URL(req.url).pathname] = Array.from(buf);
    }
  }
  return { controle: !!navigator.serviceWorker.controller, noms, fichiers, version: VERSION };
});
verifier("le service worker contrôle la page", etat.controle);
verifier("la page annonce " + VERSION, etat.version === VERSION, etat.version);
verifier("un seul cache, à la bonne version", etat.noms.length === 1 && etat.noms[0].endsWith(":" + VERSION), etat.noms);
const differents = SHELL.filter((f) => {
  const c = etat.fichiers["/games/paper-race/" + f];
  if (!c) return true;
  /* ⚠️ contre le COMMIT publié, pas la copie locale : sous Windows Git
     l'extrait en CRLF, et Pages sert le LF du dépôt (faux rouge vu le jour même) */
  const publie = execFileSync("git", ["show", "origin/main:paper-race/" + f], { cwd: HERE, maxBuffer: 1 << 26 });
  const a = hacher(Uint8Array.from(c)), d = hacher(publie);
  return a.n !== d.n || a.h !== d.h;
});
verifier("le cache installé est exactement le dépôt", differents.length === 0, differents);

await p.click("#jouer");
await p.waitForFunction(() => document.querySelector(".padbtn:not([disabled])") && !occupe(), null, { timeout: 20000 });
await p.evaluate(() => { choisir(1); document.getElementById("go").click(); });
await p.waitForTimeout(1500);
await ctx.setOffline(true);
await p.reload({ waitUntil: "domcontentloaded" });
await p.waitForTimeout(800);
const horsLigne = await p.evaluate(() => ({ jeu: document.getElementById("game").style.display !== "none", coups: R && R.cars[0].coups }));
verifier("hors ligne, le jeu se relance avec sa course", horsLigne.jeu && horsLigne.coups === 1, horsLigne);
await p.screenshot({ path: path.join(HERE, "captures", "paper-race-enligne.png") });
verifier("aucune erreur dans la console", erreurs.length === 0, erreurs);

await navigateur.close();
console.log(echecs ? `\n${echecs} ECHEC(S)` : "\nPAPER RACE EN LIGNE OK");
process.exit(echecs ? 1 : 0);
