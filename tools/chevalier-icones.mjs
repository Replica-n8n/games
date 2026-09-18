import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

/* Fabrique les icones des deux jeux a partir de <jeu>/icone.html.
   `.icone` donne icone-512 et icone-192 (usage « any ») ; `.masquable` donne
   icone-maskable-512, celle qu'Android decoupe en rond et pose sur l'ecran de
   chargement. Le dessin est en SVG, donc la reduction en 192 reste nette. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const navigateur = await chromium.launch();
const faites = [];

/* `node chevalier-icones.mjs circuit` ne refait que ce jeu : refaire les autres
   changerait leurs PNG pour rien. */
const JEUX = process.argv.slice(2).length ? process.argv.slice(2) : ["serpentin", "echecs", "paper-race"];
for (const jeu of JEUX) {
  const JEU = path.join(HERE, "..", jeu);
  const URL = pathToFileURL(path.join(JEU, "icone.html")).href;
  for (const [nom, selecteur, echelle] of [["icone-512", ".icone", 1], ["icone-192", ".icone", 192 / 512], ["icone-maskable-512", ".masquable", 1]]) {
    const ctx = await navigateur.newContext({ viewport: { width: 512, height: 1100 }, deviceScaleFactor: echelle });
    const p = await ctx.newPage();
    await p.goto(URL, { waitUntil: "networkidle" });
    const fichier = path.join(JEU, nom + ".png");
    await p.locator(selecteur).screenshot({ path: fichier });
    faites.push(fichier);
    await ctx.close();
  }
}

await navigateur.close();
console.log(JSON.stringify({ faites }, null, 2));
