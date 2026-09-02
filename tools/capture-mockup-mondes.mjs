/* Capture PNG de la maquette des mondes.

   Le panneau navigateur ne photographie que la zone visible ; une maquette
   large de trois colonnes en perd deux. Playwright sait faire `fullPage`.

   Prerequis : un serveur sert le depot `games` (port 8102).
   Lancer depuis games/ :  node tools/capture-mockup-mondes.mjs
*/
import { chromium } from './node_modules/playwright/index.mjs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOSSIER = path.join(ICI, 'captures');
fs.mkdirSync(DOSSIER, { recursive: true });
const SORTIE = path.join(DOSSIER, 'mockup-mondes.png');

const navigateur = await chromium.launch();
const page = await navigateur.newPage({
  viewport: { width: 1240, height: 1100 },
  deviceScaleFactor: 2
});

await page.goto('http://localhost:8102/tools/mockup-mondes.html',
                { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

/* Les canevas sont peints par un script en fin de page : sans cette attente
   la capture attrape parfois des rectangles noirs. */
await page.waitForFunction(() => {
  const c = document.getElementById('volcanDetail');
  if (!c) return false;
  const d = c.getContext('2d').getImageData(180, 96, 1, 1).data;
  return d[0] + d[1] + d[2] > 0;
});
await page.waitForTimeout(200);

await page.screenshot({ path: SORTIE, fullPage: true });
console.log('capture :', SORTIE);
await navigateur.close();
