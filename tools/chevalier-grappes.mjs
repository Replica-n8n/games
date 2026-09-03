/* UNE CARTE PAR NIVEAU, MEME QUAND ILS TOMBENT TOUS ENSEMBLE.

   ⚠️ CE CONTROLE PROUVAIT L'INVERSE JUSQU'AU 2026-09-03, et il le prouvait
   bien : il exigeait qu'on gagne PLUS de niveaux que d'ecrans montres, parce
   que le jeu en offrait une partie sans rien demander. C'etait une idee a moi,
   tiree d'une mesure a moi ; personne ne l'avait demandee. En jeu elle donnait
   ceci, capture a l'appui : « a chaque niveau 3 et 4 j'ai une barre verte qui
   me dit que j'ai gagne une amelioration alors que ce n'est pas celle que j'ai
   choisi ». Le controle etait vert, et le jeu avait tort.

   ⚠️ ET IL JOUAIT POUR DE VRAI, ce qui lui coutait 54 secondes : il tenait le
   manche pendant une minute de vraie partie en esperant tomber sur des
   grappes. Elles ne se meritent pas, elles s'INJECTENT — une graine qui vaut
   le prix de trois niveaux, et les trois arrivent dans la meme image, ce qui
   est exactement ce qui lui arrive avec les graines des deux premieres
   bestioles. Le banc est passe a une dizaine de secondes, et il est devenu
   deterministe : plus de « seulement 2 niveaux gagnes, le controle n'a rien pu
   observer » selon l'humeur du tirage.

   Ce qu'il verifie :

     1. une grappe de n niveaux montre EXACTEMENT n ecrans ;
     2. chaque ecran d'une grappe dit ou il en est (« 1 sur 3 ») — trois cartes
        de suite sans explication ressemblent a un bug, avec le compte elles
        ressemblent a un cadeau ;
     3. un niveau seul ne dit rien du tout : « Choisis », sans compte ;
     4. la main revient au joueur une fois la grappe finie ;
     5. quand tout est au maximum, un niveau n'ouvre plus d'ecran ET ne laisse
        pas le jeu en pause. C'est le seul cas ou rien n'est propose, et il ne
        doit pas ressembler a une amelioration silencieuse : il n'y en a pas. */
import { chromium, devices } from './node_modules/playwright/index.mjs';
import { servir } from './serveur.mjs';

const site = await servir();
const nav = await chromium.launch();
const ctx = await nav.newContext({ ...devices['Pixel 9'], locale: 'fr-CA' });
const page = await ctx.newPage();
const erreurs = [];
page.on('pageerror', (e) => erreurs.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });

await page.goto(site.jeu, { waitUntil: 'networkidle' });
await page.evaluate(() => { window.jeu.choisirPerso('chevalier'); window.jeu.choisirMonde('prairie'); });
/* `commencer` plutot que le bouton Jouer : la roue du destin est une animation
   de 4,3 s qui n'a rien a voir avec ce qu'on mesure ici */
await page.evaluate(() => window.jeu.commencer(2026));
await page.waitForTimeout(300);

const ecrans = () => page.evaluate(() => ({
  ...window.jeu.ecrans(),
  titre: document.querySelector('#uMontee').textContent,
  niveau: window.jeu.partie().niveau,
  libres: window.jeu.armes().propositions(3).length,
}));

/* on pose une graine qui vaut le prix de n niveaux : ils naissent tous dans la
   meme image, comme quand on ramasse le tas laisse par les premieres bestioles */
const offrir = (n) => page.evaluate((k) => {
  const g = window.jeu.partie();
  g.bestioles.length = 0;                 /* personne ne vient nous tuer pendant */
  g.joueur.invincibleJusqua = 1e9;
  let besoin = 0;
  for (let i = 0; i < k; i++) besoin += Moteur.coutNiveau(g.niveau + i);
  g.graines.push({ x: g.joueur.x, y: g.joueur.y, valeur: besoin + 1, r: 5, attiree: true });
}, n);

/* ⚠️ 350 ms, PAS 250 : la carte suivante d'une grappe se leve un quart de
   seconde apres le clic — sans ce repos on croit la file vide alors qu'elle se
   deroule encore, et on compte un seul ecran pour trois niveaux. */
async function viderLaFile() {
  const vus = [];
  for (let i = 0; i < 12; i++) {
    const e = await ecrans();
    if (!e.montee) {
      if (!e.niveauxDus) break;
      await page.waitForTimeout(350);
      continue;
    }
    vus.push(e.titre);
    await page.evaluate(() => window.jeu.choisir(0));
    await page.waitForTimeout(350);
  }
  return vus;
}

const tours = [];
for (const combien of [1, 3, 2, 4]) {
  const avant = (await ecrans()).niveau;
  await offrir(combien);
  await page.waitForTimeout(900);          /* l'onde passe, puis la premiere carte */
  const titres = await viderLaFile();
  const apres = await ecrans();
  tours.push({
    demandes: combien,
    gagnes: apres.niveau - avant,
    ecrans: titres.length,
    titres,
    pause: apres.pause,
    libres: apres.libres,
  });
}

/* le cas ou il n'y a plus rien a proposer : on monte tout au maximum */
await page.evaluate(() => {
  const a = window.jeu.armes();
  for (let i = 0; i < 60; i++) {
    const c = a.propositions(1);
    if (!c.length) break;
    a.appliquer(c[0]);
  }
});
const avantSature = await ecrans();
await offrir(2);
await page.waitForTimeout(1200);
const sature = await ecrans();

console.log(JSON.stringify({ tours, sature: {
  restaitAProposer: avantSature.libres,
  niveauxGagnes: sature.niveau - avantSature.niveau,
  ecranOuvert: sature.montee,
  pause: sature.pause,
} , erreurs: erreurs.slice(0, 3) }, null, 1));

const rates = [];
tours.forEach((t) => {
  if (t.gagnes !== t.demandes) {
    rates.push(t.demandes + ' niveaux injectes, ' + t.gagnes + ' gagnes : le banc n a pas mesure ce qu il croit');
    return;
  }
  if (t.ecrans !== t.gagnes) {
    rates.push(t.gagnes + ' niveaux d un coup pour ' + t.ecrans + ' ecran(s) : ' +
               (t.gagnes - t.ecrans) + ' applique(s) sans rien demander');
  }
  t.titres.forEach((titre, i) => {
    const dit = /(\d+) sur (\d+)/.exec(titre);
    if (t.gagnes > 1 && (!dit || +dit[1] !== i + 1 || +dit[2] !== t.gagnes)) {
      rates.push('grappe de ' + t.gagnes + ' : l ecran ' + (i + 1) + ' affiche « ' + titre + ' »');
    }
    if (t.gagnes === 1 && dit) rates.push('un niveau seul affiche un compte : « ' + titre + ' »');
  });
  if (t.pause) rates.push('apres une grappe de ' + t.gagnes + ', le jeu reste en pause');
});
if (avantSature.libres !== 0) rates.push('le banc n a pas reussi a tout monter au maximum');
if (sature.montee) rates.push('tout est au maximum et un ecran de choix s ouvre quand meme');
if (sature.pause) rates.push('tout est au maximum et le jeu reste en pause');
if (erreurs.length) rates.push('la page a leve ' + erreurs.length + ' erreur(s)');

rates.forEach((m) => console.log('RATE : ' + m));
console.log(rates.length ? '\nRATE' :
  '\nOK : chaque niveau d une grappe a son ecran, chaque ecran dit ou il en est, ' +
  'et rien ne s applique en silence.');
await nav.close();
process.exit(rates.length ? 1 : 0);
