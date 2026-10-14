import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Capture la planche des trois directions (tools/mockup-conviction-directions.html)
   dans docs/conviction-directions.png. Les polices de la maquette viennent du
   réseau : lancer en ligne. */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const p = await nav.newPage({ viewport: { width: 1250, height: 900 }, deviceScaleFactor: 2 });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
await p.goto(srv.base + "tools/mockup-conviction-directions.html");
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(500);
const manquantes = await p.evaluate(() => ["Big Shoulders Stencil Display", "Bricolage Grotesque", "Bowlby One", "Rubik", "Atkinson Hyperlegible", "Instrument Sans"].filter((f) => !document.fonts.check(`${f.startsWith("Big") ? "900 " : ""}16px "${f}"`)));
await p.locator("#planche").screenshot({ path: path.join(ICI, "..", "docs", "conviction-directions.png") });
await nav.close();
srv.arreter();
console.log(erreurs.length || manquantes.length ? `✗ erreurs : ${erreurs.join(" | ")} · polices absentes : ${manquantes.join(", ")}` : "✓ planche écrite : docs/conviction-directions.png");
