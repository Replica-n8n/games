import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Capture la planche de la direction « planètes »
   (tools/mockup-patrouille-planetes.html) dans docs/patrouille-planetes.png. */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const p = await nav.newPage({ viewport: { width: 1640, height: 900 }, deviceScaleFactor: 2 });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
await p.goto(srv.base + "tools/mockup-patrouille-planetes.html?nc=" + Date.now());
await p.waitForSelector("body[data-pret]");
await p.locator("#planche").screenshot({ path: path.join(ICI, "..", "docs", "patrouille-planetes.png") });
await nav.close();
srv.arreter();
if (erreurs.length) { console.log("✗ erreurs :", erreurs.join(" | ")); process.exit(1); }
console.log("✓ planche écrite : docs/patrouille-planetes.png");
