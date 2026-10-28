import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Capture la planche à thème (tools/mockup-conviction-themes.html)
   dans docs/conviction-themes.png. */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const p = await nav.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
await p.goto(srv.base + "tools/mockup-conviction-themes.html");
await p.waitForSelector("body[data-pret]");
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(400);
await p.locator("#planche").screenshot({ path: path.join(ICI, "..", "docs", "conviction-themes.png") });
await nav.close();
srv.arreter();
console.log(erreurs.length ? `✗ erreurs : ${erreurs.join(" | ")}` : "✓ planche écrite : docs/conviction-themes.png");
