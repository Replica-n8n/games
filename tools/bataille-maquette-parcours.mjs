import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* MAQUETTE du parcours : accueil, choix de l année, bandeau du mois, atlas, nouvelle gravure, fin.
   Photographie tools/mockup-bataille-parcours.html en une planche de neuf écrans.
   Sortie : bataille/docs/maquette-parcours.png */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const srv = await servir();
const navigateur = await chromium.launch();
const p = await navigateur.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1.5 });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(String(e)));
await p.goto(srv.base + "tools/mockup-bataille-parcours.html", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.pret === "1");
await p.screenshot({ path: path.join(ICI, "..", "bataille", "docs", "maquette-parcours.png"), fullPage: true });
await navigateur.close();
srv.arreter();
if (erreurs.length) { console.log("ÉCHEC\n" + erreurs.join("\n")); process.exit(1); }
console.log("maquette : bataille/docs/maquette-parcours.png");
