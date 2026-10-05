import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

/* Photographie la maquette portrait de La Bataille : la planche entière, puis
   chaque téléphone à part (pour regarder les détails avant de la montrer). */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, "captures");
fs.mkdirSync(SORTIE, { recursive: true });
const navigateur = await chromium.launch();
const p = await navigateur.newPage({ viewport: { width: 1660, height: 900 }, deviceScaleFactor: 2 });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(String(e)));
await p.goto(pathToFileURL(path.join(ICI, "mockup-bataille-portrait.html")).href, { waitUntil: "networkidle" });
await p.waitForFunction(() => document.body.dataset.pret === "1");
await p.screenshot({ path: path.join(SORTIE, "bataille-portrait-planche.png"), fullPage: true });
for (const t of await p.locator(".tel").all()) {
  await t.screenshot({ path: path.join(SORTIE, "bataille-portrait-" + (await t.getAttribute("data-scene")) + ".png") });
}
/* Rien sous 14 px : on mesure, on ne le suppose pas. */
const petits = await p.evaluate(() => [...document.querySelectorAll(".tel *")].filter((e) => e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 14).map((e) => e.className + " " + getComputedStyle(e).fontSize));
await navigateur.close();
if (erreurs.length || petits.length) { console.log("ÉCHEC", erreurs, petits); process.exit(1); }
console.log("planche et téléphones dans tools/captures/bataille-portrait-*.png");
