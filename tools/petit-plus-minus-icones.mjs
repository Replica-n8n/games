import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

/* Fabrique les icônes de petit-plus-minus/ à partir du SVG de Petit Plus.
   Fond : l'arène lilas et son sol vert, comme sur l'accueil. L'icône « maskable »
   garde le personnage dans le cercle central de 80 % (zone sûre d'Android). */

const JEU = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "petit-plus-minus");
const fee = fs.readFileSync(path.join(JEU, "personnages", "petit-plus.svg"), "utf8")
  .replace(/ width="\d+"/, "").replace(/ height="\d+"/, "");

const page = (taille, part) => `<!doctype html><html><body style="margin:0">
<div style="width:${taille}px;height:${taille}px;background:#F3E6FF;position:relative;overflow:hidden">
  <div style="position:absolute;left:0;right:0;bottom:0;height:${taille * 0.24}px;background:#D9F2E6"></div>
  <div style="position:absolute;left:50%;bottom:${taille * (1 - part) / 2 + taille * 0.02}px;
    width:${taille * part * 0.85}px;transform:translateX(-50%)">${fee}</div>
</div></body></html>`;

const navigateur = await chromium.launch();
const p = await navigateur.newPage();
for (const [nom, taille, part] of [["icone-192.png", 192, 0.9], ["icone-512.png", 512, 0.9], ["icone-maskable-512.png", 512, 0.68]]) {
  await p.setViewportSize({ width: taille, height: taille });
  await p.setContent(page(taille, part));
  await p.screenshot({ path: path.join(JEU, nom) });
  console.log(nom);
}
await navigateur.close();
