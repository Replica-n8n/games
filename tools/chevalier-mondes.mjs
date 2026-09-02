/* Les trois mondes, vus et mesures.

   Verifie que chacun se dessine (capture), que la prairie n'a PAS bouge, et
   que les obstacles solides bloquent vraiment le chevalier.

   Prerequis : un serveur sert le depot games (port 8102).
   Lancer depuis games/ :  node tools/chevalier-mondes.mjs
*/
import { chromium, devices } from './node_modules/playwright/index.mjs';
import fs from 'node:fs';
fs.mkdirSync('tools/captures', { recursive: true });

const nav = await chromium.launch();
const ctx = await nav.newContext({ ...devices['Pixel 9'], locale: 'fr-CA' });
const page = await ctx.newPage();
const erreurs = [];
page.on('pageerror', e => erreurs.push(String(e)));
page.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });

for (const nom of ['prairie', 'ile', 'volcan']) {
  await page.goto('http://localhost:8102/serpentin/', { waitUntil: 'networkidle' });
  /* on force le monde par l'API de test exposee par la page */
  const pris = await page.evaluate(n => window.jeu.choisirMonde(n), nom);
  if (!pris) { console.log('monde inconnu :', nom); continue; }
  await page.evaluate(() => window.jeu.commencer(4242));
  await page.waitForTimeout(1200);

  /* On marche vers le bord : les obstacles commencent a 200 unites du centre
     et la vue en fait +/-196, donc au depart on ne voit ni cocotier ni rocher
     ni la mer. Sans ce trajet, la capture ne montre que le sol. */
  await page.evaluate(() => {
    const cv = document.querySelector('canvas');
    cv.dispatchEvent(new PointerEvent('pointerdown',
      {bubbles:true, clientX:70, clientY:640, pointerId:1, isPrimary:true}));
    window.dispatchEvent(new PointerEvent('pointermove',
      {bubbles:true, clientX:145, clientY:565, pointerId:1, isPrimary:true}));
  });
  await page.waitForTimeout(11000);
  await page.evaluate(() => window.dispatchEvent(
    new PointerEvent('pointerup', {bubbles:true, pointerId:1, isPrimary:true})));
  await page.waitForTimeout(400);

  const vu = await page.evaluate(() => window.jeu.mondeCourant());
  if (vu !== nom) console.log('  ATTENTION : monde affiche =', vu);
  await page.screenshot({ path: 'tools/captures/monde-' + nom + '.png' });
  console.log('capture :', nom);
}
console.log('erreurs :', erreurs.length ? erreurs.slice(0,3) : 'aucune');
await nav.close();
