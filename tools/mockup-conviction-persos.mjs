import { chromium } from "playwright";
import { servir } from "./serveur.mjs";

/* Planche des personnages d'une collection : node tools/mockup-conviction-persos.mjs "<collection>" <png> */
const [col, sortie] = process.argv.slice(2);
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const p = await nav.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 1 });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
await p.goto(srv.base + "tools/mockup-conviction-persos.html?c=" + encodeURIComponent(col));
await p.waitForSelector("body[data-pret]");
await p.waitForTimeout(300);
await p.locator("#planche").screenshot({ path: sortie });
await nav.close();
srv.arreter();
console.log(erreurs.length ? `✗ ${erreurs.join(" | ")}` : `✓ ${sortie}`);
