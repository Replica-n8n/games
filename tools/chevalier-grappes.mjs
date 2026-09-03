/* UNE CARTE PAR NIVEAU, MEME QUAND ILS TOMBENT TOUS ENSEMBLE.

   ⚠️ CE CONTROLE PROUVAIT L'INVERSE JUSQU'AU 2026-09-03, et il le prouvait
   bien : il exigeait qu'on gagne plus de niveaux que d'ecrans montres, parce
   que le jeu en OFFRAIT une partie sans rien demander. C'etait une idee a moi,
   tiree d'une mesure a moi ; personne ne l'avait demandee. En jeu elle donnait
   ceci, rapporte capture a l'appui : « a chaque niveau 3 et 4 j'ai une barre
   verte qui me dit que j'ai gagne une amelioration alors que ce n'est pas
   celle que j'ai choisi ». Le controle etait vert, et le jeu avait tort.

   Il verifie donc maintenant :

     1. des niveaux arrivent VRAIMENT en grappe (sinon on ne teste rien) ;
     2. AUTANT d'ecrans que de niveaux gagnes : rien n'est applique en silence ;
     3. quand plusieurs sont en attente, l'ecran DIT lequel on en est
        (« 1 sur 3 ») : trois cartes de suite sans explication ressemblent a un
        bug, avec le compte elles ressemblent a un cadeau ;
     4. la main revient au joueur une fois la grappe finie.

   ⚠️ IL N'APPUYAIT MEME PAS SUR LE MANCHE avant le 2026-08-31 : le chevalier
   restait plante au milieu du pre, ne tuait rien, ne montait jamais, et
   l'outil se declarait RATE sur sa propre incapacite a jouer. */
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
await page.evaluate(() => { Moteur.REGLAGES.xpBase = 2; Moteur.REGLAGES.xpFacteur = 1.12; });
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
           dus: window.jeu.ecrans().niveauxDus,
           montee: !document.querySelector('#montee').hidden,
           titre: document.querySelector('#uMontee').textContent,
           /* ⚠️ QUAND TOUT EST AU MAXIMUM, un niveau ne donne plus rien et
              n'ouvre plus d'ecran : c'est normal, ce n'est pas une amelioration
              silencieuse. Sans ce compte, le controle accusait le jeu de 75
              niveaux « appliques en silence » qui n'appliquaient rien du tout. */
           libres: window.jeu.armes().propositions(3).length };
});

let ecrans = 0, comptes = 0, grappes = 0, niveauMax = 1, fin = null, bloque = 0;
for (let t = 0; t < 90; t++) {
  await page.mouse.move(120 + Math.cos(t * 0.5) * 110, 640 + Math.sin(t * 0.5) * 110);
  await page.waitForTimeout(400);
  let e = await etat();
  fin = e;
  niveauMax = Math.max(niveauMax, e.niveau);
  if (e.fini) break;
  if (!e.libres) break;             /* plus rien a proposer : on arrete de compter */
  if (!e.montee) continue;
  /* une grappe : on vide toute la file, un ecran a la fois */
  if (e.dus > 0) grappes++;
  while (e.montee) {
    ecrans++;
    if (/\d+ sur \d+/.test(e.titre)) comptes++;
    else if (e.dus > 0) bloque++;      /* plusieurs en attente et rien ne le dit */
    if (ecrans === 1) await page.screenshot({ path: 'captures/grappes.png' });
    await page.evaluate(() => window.jeu.choisir(0));
    await page.waitForTimeout(420);    /* les 260 ms de repos entre deux cartes */
    e = await etat();
  }
}
await page.mouse.up();

/* ⚠️ ON VIDE LA FILE AVANT DE COMPTER. Un ecran s'ouvre 0,6 s apres le
   niveau — le temps que l'onde passe — donc arreter la boucle pile entre les
   deux faisait accuser le jeu d'un niveau « applique en silence » qui n'avait
   simplement pas encore eu le temps de s'afficher. */
for (let k = 0; k < 8; k++) {
  await page.waitForTimeout(500);
  const e = await etat();
  fin = e;
  niveauMax = Math.max(niveauMax, e.niveau);
  if (!e.montee) { if (!e.dus) break; continue; }
  ecrans++;
  if (/\d+ sur \d+/.test(e.titre)) comptes++;
  await page.evaluate(() => window.jeu.choisir(0));
}

const gagnes = niveauMax - 1;
console.log(JSON.stringify({
  niveaux_gagnes: gagnes,
  ecrans_de_choix: ecrans,
  grappes: grappes,
  ecrans_qui_disent_le_compte: comptes,
  fin,
  erreurs: erreurs.slice(0, 3),
}, null, 1));

const rates = [];
if (gagnes < 5) rates.push('seulement ' + gagnes + ' niveaux gagnes : le controle n a rien pu observer');
if (!grappes) rates.push('aucune grappe observee : le controle n a rien pu prouver');
if (ecrans < gagnes) rates.push((gagnes - ecrans) + ' niveau(x) appliques SANS ecran de choix');
if (bloque) rates.push(bloque + ' ecran(s) d une grappe ne disent pas combien il en reste');
if (fin && fin.montee) rates.push('l ecran de choix ne rend jamais la main');
if (erreurs.length) rates.push('la page a leve ' + erreurs.length + ' erreur(s)');
rates.forEach(m => console.log('RATE : ' + m));
console.log(rates.length ? '\nRATE' :
  '\nOK : ' + gagnes + ' niveaux gagnes pour ' + ecrans + ' ecrans de choix, ' +
  grappes + ' grappe(s), et chacune dit ou elle en est.');
await nav.close();
process.exit(rates.length ? 1 : 0);
