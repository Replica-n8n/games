import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

/* Vérifie petit-plus-minus/ sur la PRODUCTION (GitHub Pages), au format Pixel 9 :
   la version servie est celle du dépôt, le service worker prend la main, le cache
   contient les fichiers du dépôt octet par octet, et le jeu se relance hors ligne.
   ⚠️ Pages met jusqu'à ~10 min à servir un push : si la version diffère, attendre. */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const JEU = path.join(ICI, "..", "petit-plus-minus");
const URL_JEU = process.env.BASE || "https://replica-n8n.github.io/games/petit-plus-minus/";
const sw = fs.readFileSync(path.join(JEU, "sw.js"), "utf8");
const VERSION = sw.match(/var VERSION = "([^"]+)"/)[1];
const SHELL = [...sw.slice(sw.indexOf("var SHELL")).split("];")[0].matchAll(/"(\.\/[^"]*)"/g)].map((m) => m[1]);

const res = [];
const verifier = (nom, ok, d = "") => { res.push(ok); console.log((ok ? "ok    " : "ÉCHEC ") + nom + (d ? "  · " + d : "")); };

const b = await chromium.launch();
const ctx = await b.newContext({ ...devices["Pixel 9"] });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });

await p.goto(URL_JEU);
await p.waitForSelector("html[data-personnages]", { timeout: 15000 });
await p.reload();
await p.waitForSelector("html[data-personnages]", { timeout: 15000 });
await p.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 15000 });
const v = await p.evaluate(() => window.ppm.versionDuService());
verifier("la production sert la version du dépôt", v === VERSION, `${v} / ${VERSION}`);

const cache = await p.evaluate(async (shell) => {
  const nom = (await caches.keys()).find((n) => n.startsWith("petit-plus-minus:"));
  const c = await caches.open(nom);
  const out = {};
  for (const f of shell) { const r = await c.match(f); out[f] = r ? Array.from(new Uint8Array(await r.arrayBuffer())) : null; }
  return out;
}, SHELL);
/* La référence est ce que Git a PUBLIÉ (git show HEAD:…), pas la copie de travail : sous
   Windows, core.autocrlf réécrit les fichiers locaux en CRLF au changement de branche,
   alors que Pages sert du LF. Comparer au disque faisait échouer tous les fichiers texte. */
const publie = (f) => execFileSync("git", ["show", "HEAD:petit-plus-minus/" + (f === "./" ? "index.html" : f.slice(2))], { cwd: path.join(ICI, "..") });
const diff = SHELL.filter((f) => !cache[f] || !Buffer.from(cache[f]).equals(publie(f)));
verifier("le cache installé est identique au dépôt, fichier par fichier", diff.length === 0, diff.join(", "));

await ctx.setOffline(true);
await p.reload();
await p.waitForSelector("html[data-personnages]", { timeout: 15000 }).catch(() => {});
const hl = await p.evaluate(() => ({ outils: document.querySelectorAll("#outils .outil").length, jauge: document.querySelectorAll("#jauge .perso-svg").length }));
verifier("hors ligne, le jeu se relance avec ses outils et la jauge", hl.outils >= 6 && hl.jauge === 4, JSON.stringify(hl));
await p.screenshot({ path: path.join(ICI, "captures", "ppm-production.png") });
verifier("aucune erreur dans la console", erreurs.length === 0, erreurs.join(" | "));
await b.close();
const n = res.filter((r) => !r).length;
console.log(n ? `\n${n} contrôle(s) en échec` : `\n${res.length} contrôles, tous verts`);
process.exit(n ? 1 : 0);
