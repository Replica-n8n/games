import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Capture une planche de Ghost Train (tools/mockup-ghost-train-<nom>.html, #planche)
   dans docs/ghost-train-<nom>.png. Échoue sur une erreur de page.
     node tools/mockup-ghost-train-capture.mjs lumi */
const nom = process.argv[2];
const ICI = path.dirname(fileURLToPath(import.meta.url));
const srv = await servir();
const nav = await chromium.launch();
const p = await nav.newPage({ viewport: { width: 1400, height: 900 } });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
await p.goto(srv.base + `tools/mockup-ghost-train-${nom}.html`);
await p.waitForSelector("body[data-pret]", { timeout: 10000 }).catch(() => erreurs.push("planche jamais prête"));
await p.locator("#planche").screenshot({ path: path.join(ICI, "..", "docs", `ghost-train-${nom}.png`) });
await nav.close();
srv.arreter();
if (erreurs.length) { console.log("✗ " + erreurs.join(" | ")); process.exit(1); }
console.log(`✓ docs/ghost-train-${nom}.png`);
