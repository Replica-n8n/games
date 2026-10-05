import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

/* Photographie la maquette de l'arcade (tools/mockup-arcade.html) et refuse un
   texte sous 14 px dans les téléphones. */
const ICI = path.dirname(fileURLToPath(import.meta.url));
fs.mkdirSync(path.join(ICI, "captures"), { recursive: true });
const nav = await chromium.launch();
const p = await nav.newPage({ viewport: { width: 1300, height: 900 }, deviceScaleFactor: 1.5 });
await p.goto(pathToFileURL(path.join(ICI, "mockup-arcade.html")).href, { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
const petits = await p.evaluate(() => [...document.querySelectorAll(".tel *")].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 14).map((e) => e.className + " " + getComputedStyle(e).fontSize));
await p.screenshot({ path: path.join(ICI, "captures", "arcade-planche.png"), fullPage: true });
await nav.close();
if (petits.length) { console.log("ÉCHEC", petits); process.exit(1); }
console.log("captures/arcade-planche.png");
