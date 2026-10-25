import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Photographie ghost-train/icone.html en icone-192.png, icone-512.png et
   icone-maskable-512.png. Échoue sur une erreur de page.
     node tools/ghost-train-icones.mjs */
const JEU = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "ghost-train");
const srv = await servir();
const nav = await chromium.launch();
const erreurs = [];
for (const [taille, classe, nom] of [[512, ".icone", "icone-512.png"], [192, ".icone", "icone-192.png"], [512, ".masquable", "icone-maskable-512.png"]]) {
  const p = await nav.newPage({ viewport: { width: 1100, height: 1100 }, deviceScaleFactor: taille / 512 });
  p.on("pageerror", (e) => erreurs.push(e.message));
  await p.goto(srv.base + "ghost-train/icone.html");
  await p.waitForSelector("body[data-pret]");
  await p.locator(classe).screenshot({ path: path.join(JEU, nom) });
  await p.close();
}
await nav.close();
srv.arreter();
if (erreurs.length) { console.log("✗ " + erreurs.join(" | ")); process.exit(1); }
console.log("✓ icônes écrites");
