import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Capture la planche des trois directions du train fantôme
   (tools/mockup-train-directions.html) dans docs/train-directions.png.
   Échoue sur une erreur de page. Rien ne vient du réseau. */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const srv = await servir();
const nav = await chromium.launch();
const p = await nav.newPage({ viewport: { width: 1404, height: 900 } });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
await p.goto(srv.base + "tools/mockup-train-directions.html");
await p.waitForTimeout(300);
const sortie = path.join(ICI, "..", "docs", "train-directions.png");
await p.locator("#planche").screenshot({ path: sortie });
await nav.close();
srv.arreter();
if (erreurs.length) { console.log("✗ " + erreurs.join(" | ")); process.exit(1); }
console.log("✓ planche écrite : docs/train-directions.png");
