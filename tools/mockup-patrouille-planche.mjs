import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Capture la planche visuelle de La Patrouille des Jouets
   (tools/mockup-patrouille-planche.html) dans docs/patrouille-planche.png.
   Échoue sur une erreur de page. */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const p = await nav.newPage({ viewport: { width: 1480, height: 1000 }, deviceScaleFactor: 2 });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
p.on("console", (m) => m.type() === "error" && erreurs.push(m.text()));
await p.goto(srv.base + "tools/mockup-patrouille-planche.html?nc=" + Date.now());
await p.waitForSelector("body[data-pret]");
await p.waitForTimeout(300);
const sortie = path.join(ICI, "..", "docs", "patrouille-planche.png");
await p.locator("#planche").screenshot({ path: sortie });
// Le téléphone seul, en taille réelle, pour juger la carte.
await p.locator(".tel").screenshot({ path: path.join(ICI, "..", "docs", "patrouille-carte.png") });
await nav.close();
srv.arreter();
if (erreurs.length) {
  console.log(`✗ erreurs : ${erreurs.join(" | ")}`);
  process.exit(1);
}
console.log("✓ planche écrite : docs/patrouille-planche.png et docs/patrouille-carte.png");
