/* Planche des bustes en gros plan : node tools/mockup-conviction-bustes.mjs <sortie.png> "s=160&k=10&m=,choc,fier&n=Nom,Nom" */
import { chromium } from "playwright";
import { servir } from "./serveur.mjs";
const [sortie, q] = process.argv.slice(2);
const srv = await servir();
const nav = await chromium.launch();
const p = await nav.newPage({ viewport: { width: 1700, height: 900 } });
p.on("pageerror", (e) => console.log("ERR", e.message));
await p.goto(srv.base + "tools/mockup-conviction-bustes.html?" + (q ?? ""));
await p.waitForSelector("body[data-pret]", { timeout: 15000 });
await p.locator("#p").screenshot({ path: sortie });
await nav.close(); srv.arreter();
