/* Un seul choix par grappe de niveaux.

   Le probleme, mesure le 2026-09-02 : un tiers des montees de niveau arrivent
   a moins de deux secondes de la precedente, et jusqu'a trois d'affilee. On
   enchainait alors trois ecrans de cartes pour moins de deux secondes de jeu.

   Ce controle rend les niveaux quasi gratuits par `Moteur.REGLAGES`, ce qui
   garantit des grappes, puis verifie trois choses :

     1. des niveaux arrivent VRAIMENT en grappe (sinon on ne teste rien) ;
     2. apres un choix, l'ecran se ferme et rend la main ;
     3. beaucoup plus de niveaux sont gagnes que d'ecrans montres : c'est la
        definition meme de « un seul choix par grappe ».

   ⚠️ DEUX RAISONS POUR LESQUELLES CE CONTROLE NE PROUVAIT RIEN, corrigees le
   2026-08-31 :

   - il attendait qu'un serveur tourne deja sur le port 8102, alors que tous
     les autres outils ouvrent le leur avec `serveur.mjs`. Lance comme les
     autres, il mourait sur ERR_CONNECTION_REFUSED.
   - surtout, IL N'APPUYAIT JAMAIS SUR LE MANCHE. Le chevalier restait plante
     au milieu du pre : il ne tuait rien, ne ramassait rien, ne montait pas
     d'un seul niveau. L'outil rendait « 0 ecran de choix » et se declarait
     RATE sur sa propre incapacite a jouer. C'est la troisieme fois qu'un banc
     de ce projet mesure un joueur immobile : voir `chevalier-sorts.mjs` et
     `chevalier-parcours.mjs`. */
import { chromium, devices } from './node_modules/playwright/index.mjs';
import { servir } from './serveur.mjs';

const site = await servir();
const nav = await chromium.launch();
const ctx = await nav.newContext({ ...devices['Pixel 9'], locale: 'fr-CA' });
const page = await ctx.newPage();
const erreurs = [];
page.on('pageerror', e => erreurs.push(String(e)));
page.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });

await page.goto(site.jeu, { waitUntil: 'networkidle' });
/* des niveaux presque gratuits : c'est ce qui fabrique les grappes */
await page.evaluate(() => { Moteur.REGLAGES.xpBase = 1; Moteur.REGLAGES.xpFacteur = 1; });
await page.evaluate(() => window.jeu.choisirPerso('chevalier'));
await page.click('#jouer');
await page.waitForTimeout(4300);                 /* la roue du destin tourne */

/* on TIENT le manche pendant tout le controle, et on tourne : sans ca il ne
   tue rien et il meurt avant le premier niveau */
await page.mouse.move(120, 640);
await page.mouse.down();

const etat = () => page.evaluate(() => {
  const p = window.jeu.partie();
  return { temps: +p.temps.toFixed(1), niveau: p.niveau, fini: p.fini,
           montee: !document.querySelector('#montee').hidden };
});

let ecrans = 0, enchaines = 0, niveauMax = 1, fin = null;
for (let t = 0; t < 90; t++) {
  await page.mouse.move(120 + Math.cos(t * 0.5) * 110, 640 + Math.sin(t * 0.5) * 110);
  await page.waitForTimeout(400);
  const e = await etat();
  fin = e;
  niveauMax = Math.max(niveauMax, e.niveau);
  if (e.fini) break;
  if (!e.montee) continue;
  ecrans++;
  await page.evaluate(() => document.querySelector('#montee .carte').click());
  await page.waitForTimeout(150);
  /* l'ecran doit rendre la main, pas en rouvrir un autre dans la foulee */
  if (await page.evaluate(() => !document.querySelector('#montee').hidden)) enchaines++;
  if (ecrans === 1) await page.screenshot({ path: 'captures/grappes.png' });
}
await page.mouse.up();

const gagnes = niveauMax - 1;
const offerts = gagnes - ecrans;
console.log(JSON.stringify({
  niveaux_gagnes: gagnes,
  ecrans_de_choix: ecrans,
  niveaux_offerts: offerts,
  enchainements: enchaines,
  fin,
  erreurs: erreurs.slice(0, 3),
}, null, 1));

const rates = [];
if (gagnes < 5) rates.push('seulement ' + gagnes + ' niveaux gagnes : le controle n a rien pu observer');
if (ecrans === 0) rates.push('aucun ecran de choix montre : on ne choisit plus jamais rien');
if (enchaines) rates.push(enchaines + ' fois un ecran s est rouvert juste apres un choix');
if (offerts <= 0) rates.push('aucun niveau offert : chaque niveau demande encore un choix');
if (erreurs.length) rates.push('la page a leve ' + erreurs.length + ' erreur(s)');
rates.forEach(m => console.log('RATE : ' + m));
console.log(rates.length ? '\nRATE' :
  '\nOK : ' + gagnes + ' niveaux gagnes pour ' + ecrans + ' ecrans de choix, ' +
  offerts + ' offerts, et jamais deux ecrans de suite.');
await nav.close();
process.exit(rates.length ? 1 : 0);
