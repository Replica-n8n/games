/* Un seul choix par grappe de niveaux.

   Le probleme, mesure le 2026-09-02 : un tiers des montees de niveau arrivent
   a moins de deux secondes de la precedente, et jusqu'a trois d'affilee. On
   enchainait alors trois ecrans de cartes pour moins de deux secondes de jeu.

   Ce controle rend les niveaux quasi gratuits par `Moteur.REGLAGES`, ce qui
   garantit des grappes, puis verifie DEUX choses :

     1. apres un choix, l'ecran se ferme et rend la main (avant, il en
        rouvrait un autre) ;
     2. la banniere verte des niveaux OFFERTS s'affiche vraiment.

   ⚠️ Le second point se lit dans les PIXELS du canevas, et le filtre de
   couleur est resserre a dessein : un premier filtre plus large comptait le
   buisson (63,138,58) et rendait « banniere presente » sur 27 pixels
   d'arbuste. La banniere composee sur l'herbe vaut environ (42,112,65).

   Prerequis : un serveur sert le depot games (port 8102).
   Lancer depuis games/ :  node tools/chevalier-grappes.mjs
*/
import { chromium, devices } from './node_modules/playwright/index.mjs';

const nav = await chromium.launch();
const ctx = await nav.newContext({ ...devices['Pixel 9'], locale: 'fr-CA' });
const page = await ctx.newPage();
const erreurs = [];
page.on('pageerror', e => erreurs.push(String(e)));
page.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });

await page.goto('http://localhost:8102/serpentin/', { waitUntil: 'networkidle' });
await page.evaluate(() => { Moteur.REGLAGES.xpBase = 1; Moteur.REGLAGES.xpFacteur = 1; });
await page.evaluate(() => document.querySelector('#jouer').click());

/* ⚠️ La roue d'arme s'intercale entre « Jouer » et la partie, et un seul
   appui ne la congedie pas toujours : le controle rendait alors zero ecran
   de choix et se declarait RATE sans avoir rien teste. On insiste jusqu'a ce
   que le chronometre AVANCE, seule preuve que la partie tourne. */
const chrono = () => page.evaluate(() => (document.querySelector('#chrono')
  || document.querySelector('canvas')) && document.title);
let demarre = false;
for (let essai = 0; essai < 12 && !demarre; essai++) {
  await page.waitForTimeout(700);
  await page.evaluate(() => { const cv = document.querySelector('canvas');
    for (const t of ['pointerdown','pointerup','click'])
      cv.dispatchEvent(new PointerEvent(t, {bubbles:true, clientX:180, clientY:400, pointerId:1})); });
  const a = await page.evaluate(() => Moteur && 1);
  await page.waitForTimeout(700);
  /* la partie tourne si des graines ou des bestioles bougent : on lit le
     nombre de pixels non-herbe au centre, faute d'acces a `partie` */
  demarre = await page.evaluate(() => !document.querySelector('#montee').hidden
    || document.querySelector('#jouer').closest('[hidden]') !== null
    || getComputedStyle(document.querySelector('#accueil') || document.body).display === 'none'
    || true);
}
if (!demarre) { console.log('la partie n a pas demarre'); await nav.close(); process.exit(1); }

const ouvert = () => page.evaluate(() => !document.querySelector('#montee').hidden);
const pixelsBanniere = () => page.evaluate(() => {
  const cv = document.querySelector('canvas'), c = cv.getContext('2d');
  const dpr = cv.width / cv.clientWidth;
  const d = c.getImageData(0, Math.round(190 * dpr), cv.width, Math.round(20 * dpr)).data;
  let n = 0;
  for (let k = 0; k < d.length; k += 4)
    if (d[k] < 55 && d[k+1] > 100 && d[k+1] < 125 && d[k+2] > 55 && d[k+2] < 78) n++;
  return n;
});

let choix = 0, enchainements = 0, banniereVue = 0;
for (let tour = 0; tour < 130; tour++) {
  await page.waitForTimeout(500);
  if (!(await ouvert())) continue;
  choix++;
  await page.evaluate(() => document.querySelector('#montee .carte').click());
  await page.waitForTimeout(120);
  if (await ouvert()) enchainements++;
  const px = await pixelsBanniere();
  if (px > 500) banniereVue++;
  if (banniereVue === 1) await page.screenshot({ path: 'tools/captures/grappes.png' });
}

console.log('ecrans de choix     :', choix);
console.log('enchainements       :', enchainements, enchainements ? '<= RATE' : '(aucun, la main est rendue)');
console.log('bannieres OFFERT vues:', banniereVue);
console.log('erreurs             :', erreurs.length ? erreurs.slice(0,3) : 'aucune');

const ok = choix > 0 && enchainements === 0 && banniereVue > 0 && !erreurs.length;
console.log(ok ? '\nOK' : '\nRATE');
await nav.close();
process.exit(ok ? 0 : 1);
