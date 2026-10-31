import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* MAQUETTE « rejouable seul » : gravures, atouts qui changent une règle, atlas.
   Photographie tools/mockup-bataille-rejouable.html en une planche de quatre écrans.
   Sortie : bataille/docs/maquette-rejouable.png */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const srv = await servir();
const navigateur = await chromium.launch();
const p = await navigateur.newPage({ viewport: { width: 1584, height: 900 }, deviceScaleFactor: 1.5 });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(String(e)));
await p.goto(srv.base + "tools/mockup-bataille-rejouable.html", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.pret === "1");
await p.screenshot({ path: path.join(ICI, "..", "bataille", "docs", "maquette-rejouable.png"), fullPage: true });
await navigateur.close();
srv.arreter();
if (erreurs.length) { console.log("ÉCHEC\n" + erreurs.join("\n")); process.exit(1); }
console.log("maquette : bataille/docs/maquette-rejouable.png");
