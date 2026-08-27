import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

/* Fabrique les deux icones de Serpentin a partir de serpentin/icone.html.
   Le dessin est en SVG, donc la reduction en 192 reste nette. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const JEU = path.join(HERE, "..", "serpentin");
const URL = pathToFileURL(path.join(JEU, "icone.html")).href;

const navigateur = await chromium.launch();
const faites = [];

for (const [taille, echelle] of [[512, 1], [192, 192 / 512]]) {
  const ctx = await navigateur.newContext({
    viewport: { width: 512, height: 512 },
    deviceScaleFactor: echelle,
  });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "networkidle" });
  const fichier = path.join(JEU, `icone-${taille}.png`);
  await p.locator(".icone").screenshot({ path: fichier });
  faites.push({ taille, fichier });
  await ctx.close();
}

await navigateur.close();
console.log(JSON.stringify({ faites }, null, 2));
