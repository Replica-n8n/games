/* LE LABO, ET CE QU'IL DONNE A VALIDER.

   « Creer un mode pour tester toutes les nouveautes directement, avec des
   interrupteurs pour toutes les armes et tous les bonus. » On controle, dans
   le vrai navigateur :
   1. le Labo s'ouvre depuis le menu, avec un interrupteur par arme et par
      objet, et ce qui est « a valider » est allume d'office ;
   2. Lancer donne les armes allumees au NIVEAU MAX, sans limite de quatre, et
      la partie ne compte pas dans les souvenirs ;
   3. invincible : une bestiole collee au chevalier ne lui prend rien ;
   4. l'epee legendaire lance bien ses salves (capture `labo-salve.png`) ;
   5. la carte du niveau max est doree et annonce le pouvoir. */
import { chromium, devices } from './node_modules/playwright/index.mjs';
import { servir } from './serveur.mjs';
const site = await servir();
const nav = await chromium.launch();
const ctx = await nav.newContext({ ...devices['Pixel 9'], locale: 'fr-CA' });
const page = await ctx.newPage();
const erreurs = [], rates = [];
page.on('pageerror', (e) => { erreurs.push(String(e)); console.log('ERREUR ' + e); });
function verifier(ok, nom) { console.log((ok ? 'ok    ' : 'RATE  ') + nom); if (!ok) rates.push(nom); }

await page.goto(site.jeu, { waitUntil: 'networkidle' });
await page.locator('#jouer').click();
await page.waitForTimeout(300);
await page.locator('#menuBouton').click({ force: true });
await page.locator('#laboOuvrir').click();

const ecran = await page.evaluate(() => ({
  vu: !document.getElementById('labo').hidden,
  armes: document.querySelectorAll('#laboArmes .inter').length,
  objets: document.querySelectorAll('#laboObjets .inter').length,
  nArmes: Object.keys(Armes.CATALOGUE).length, nObjets: Object.keys(Armes.OBJETS).length,
  arc: document.getElementById('labo-arc').classList.contains('pris'),
  etiquette: !!document.querySelector('#labo-arc .neuf')
}));
verifier(ecran.vu && ecran.armes === ecran.nArmes && ecran.objets === ecran.nObjets,
  'le Labo montre ' + ecran.armes + ' armes et ' + ecran.objets + ' objets');
verifier(ecran.arc && ecran.etiquette, 'l arc, a valider, est allume d office');
await page.screenshot({ path: 'captures/labo-ecran.png' });

/* on allume en plus cinq autres armes et deux objets : plus de quatre */
for (const n of ['epee', 'bouclier', 'trappe', 'souffle', 'givre', 'bottes', 'sablier']) {
  await page.locator('#labo-' + n).click();
}
await page.locator('#labo-bouclier').click();   /* et on en rééteint une */
await page.locator('#laboLancer').click();
await page.waitForTimeout(300);

const partie = await page.evaluate(() => {
  const a = window.jeu.armes();
  return {
    armes: a.armes.map((x) => x.nom + x.niveau).sort().join(' '),
    objets: a.objets.map((x) => x.nom + x.niveau).sort().join(' '),
    ecrans: window.jeu.ecrans(),
    intouchable: window.jeu.partie().intouchable,
    max: Armes.MAX_NIVEAU, maxObjet: Armes.MAX_OBJET_NIVEAU
  };
});
const attendues = ['arc', 'epee', 'givre', 'souffle', 'trappe'].map((n) => n + partie.max).join(' ');
verifier(partie.armes === attendues, 'cinq armes au niveau max : ' + partie.armes);
verifier(partie.objets === ['bottes', 'sablier'].map((n) => n + partie.maxObjet).join(' '), 'deux objets au max : ' + partie.objets);
verifier(!partie.ecrans.menu && !partie.ecrans.pause && !partie.ecrans.roue, 'la partie tourne, sans roue ni menu');

/* invincible, et les salves */
await page.evaluate(() => {
  const a = window.jeu.armes();
  a.armes.splice(0, a.armes.length, a.armes.find((x) => x.nom === 'epee'));
  const p = window.jeu.partie(), j = p.joueur;
  j.angle = 0;
  for (let i = 0; i < 10; i++) {
    p.naitre('escargot');
    const b = p.bestioles[p.bestioles.length - 1];
    b.arrivee = -99; b.immobile = true; b.vie = b.vieMax = 1e5;
    b.x = j.x + 150 + i * 30; b.y = j.y + (i % 2 ? 25 : -25);
  }
  p.naitre('escargot');
  const c = p.bestioles[p.bestioles.length - 1];
  c.arrivee = -99; c.x = j.x; c.y = j.y + 5;
});
let salve = false;
for (let i = 0; i < 40 && !salve; i++) {
  await page.waitForTimeout(50);
  salve = await page.evaluate(() => window.jeu.armes().projectiles
    ? window.jeu.armes().projectiles.some((p) => p.forme === 'salve' && p.vie < p.duree * .75 && p.vie > p.duree * .5) : null);
}
await page.screenshot({ path: 'captures/labo-salve.png' });
const apres = await page.evaluate(() => ({ coeurs: window.jeu.partie().joueur.coeurs, max: window.jeu.partie().joueur.coeursMax }));
verifier(salve !== null, 'les projectiles sont lisibles par le controle');
verifier(salve, 'l epee legendaire lance une salve');
verifier(apres.coeurs === apres.max, 'invincible : ' + apres.coeurs + ' coeurs sur ' + apres.max);

/* la carte doree : tout le reste est deja au maximum, la seule carte
   possible est l'epee niveau 6 */
await page.evaluate(() => {
  const a = window.jeu.armes();
  a.armes.length = 0; a.objets.length = 0;
  ['epee', 'bouclier', 'arc', 'trappe'].forEach((n) => a.donner(n));
  a.armes.forEach((x) => { x.niveau = Armes.MAX_NIVEAU; });
  a.armes[0].niveau = Armes.MAX_NIVEAU - 1;
  ['bottes', 'gantelets', 'sablier', 'longuevue'].forEach((n) => {
    for (let i = 0; i < Armes.MAX_OBJET_NIVEAU; i++) a.donnerObjet(n);
  });
  const p = window.jeu.partie(), j = p.joueur;
  for (const b of p.bestioles) b.vivante = false;
  p.graines.push({ x: j.x, y: j.y, valeur: 40, r: 5, attiree: false });
});
let carte = null;
for (let i = 0; i < 20 && !carte; i++) {
  await page.waitForTimeout(250);
  carte = await page.evaluate(() => {
    const c = [...document.querySelectorAll('#cartes .carte.legende')];
    return c.length ? c[0].textContent : null;
  });
}
verifier(carte && /légendaire/.test(carte), 'la carte du niveau max est doree : ' + carte);
if (carte) await page.screenshot({ path: 'captures/labo-carte.png' });

/* on choisit la carte doree : l'ecran des cartes arrete le jeu */
await page.evaluate(() => { const c = document.querySelector('#cartes .carte'); if (c) c.click(); });
await page.waitForTimeout(400);

/* les doubles des bottes legendaires : on court en rond, on capture */
await page.evaluate(() => {
  const a = window.jeu.armes();
  a.armes.length = 0; a.objets.length = 0;
  a.objets.push({ nom: 'bottes', def: Armes.OBJETS.bottes, niveau: Armes.MAX_OBJET_NIVEAU });
  const p = window.jeu.partie();
  for (const b of p.bestioles) b.vivante = false;
});
/* le pouce sur le manche, qui tourne : il court en rond */
const [, HAUT] = await page.evaluate(() => window.jeu.taille());
await page.mouse.move(110, HAUT - 255);
await page.mouse.down();
for (let i = 0; i < 12; i++) {
  await page.mouse.move(110 + Math.cos(i * 0.5) * 110, HAUT - 255 + Math.sin(i * 0.5) * 110);
  await page.waitForTimeout(70);
}
const doubles = await page.evaluate(() => window.jeu.doubles());
await page.screenshot({ path: 'captures/labo-bottes.png' });
await page.mouse.up();
verifier(doubles >= 3, 'les bottes legendaires laissent ' + doubles + ' doubles en courant');
await page.waitForTimeout(600);
const arret = await page.evaluate(() => window.jeu.doubles());
verifier(arret === 0, 'a l arret, la trainee s eteint (' + arret + ')');

/* la bulle du bouclier legendaire : visible, puis elle eclate sur un coup */
await page.evaluate(() => {
  const a = window.jeu.armes();
  a.armes.length = 0; a.objets.length = 0;
  a.armes.push({ nom: 'bouclier', def: Armes.CATALOGUE.bouclier, niveau: Armes.MAX_NIVEAU, prochainTir: 0, tourne: 0 });
  const p = window.jeu.partie();
  for (const b of p.bestioles) b.vivante = false;
});
await page.waitForTimeout(400);
const prete = await page.evaluate(() => !!(window.jeu.partie().bulle && window.jeu.partie().bulle.prete));
await page.screenshot({ path: 'captures/labo-bulle.png' });
verifier(prete, 'le bouclier legendaire porte sa bulle');
const avantCoup = await page.evaluate(() => {
  const p = window.jeu.partie(), j = p.joueur;
  for (let i = 0; i < 8; i++) {
    p.naitre('escargot');
    const b = p.bestioles[p.bestioles.length - 1];
    b.arrivee = -99; b.immobile = true; b.vie = b.vieMax = 1e5;
    b.x = j.x + Math.cos(i * .785) * (i ? 95 : 0); b.y = j.y + Math.sin(i * .785) * (i ? 95 : 0);
  }
  return j.coeurs;
});
await page.waitForTimeout(160);
await page.screenshot({ path: 'captures/labo-bulle-eclate.png' });
const eclat = await page.evaluate(() => ({ prete: window.jeu.partie().bulle.prete, coeurs: window.jeu.partie().joueur.coeurs }));
verifier(!eclat.prete && eclat.coeurs === avantCoup, 'la bulle eclate sur le coup, sans prendre de coeur');

/* les fleches de feu de l'arc legendaire : un groupe d'escargots devant */
await page.evaluate(() => {
  const a = window.jeu.armes();
  a.armes.length = 0; a.objets.length = 0;
  a.armes.push({ nom: 'arc', def: Armes.CATALOGUE.arc, niveau: Armes.MAX_NIVEAU, prochainTir: 0, tourne: 0 });
  const p = window.jeu.partie(), j = p.joueur;
  p.bulle = null;
  for (const b of p.bestioles) b.vivante = false;
  for (let i = 0; i < 12; i++) {
    p.naitre('escargot');
    const b = p.bestioles[p.bestioles.length - 1];
    b.arrivee = -99; b.immobile = true; b.vie = b.vieMax = 1e5;
    b.x = j.x + 110 + (i % 4) * 30; b.y = j.y + 120 + Math.floor(i / 4) * 45;
  }
});
let vol = false;
for (let i = 0; i < 40 && !vol; i++) {
  await page.waitForTimeout(40);
  vol = await page.evaluate(() => window.jeu.armes().projectiles.some((p) => p.forme === 'fleche' && p.feu && p.vie < p.duree * .6));
}
await page.screenshot({ path: 'captures/labo-arc-vol.png' });
let boum = false;
for (let i = 0; i < 40 && !boum; i++) {
  await page.waitForTimeout(25);
  boum = await page.evaluate(() => window.jeu.partie().explosions.length > 0);
}
await page.screenshot({ path: 'captures/labo-arc-boum.png' });
verifier(vol, 'l arc legendaire tire des fleches de feu');
verifier(boum, 'les fleches de feu explosent a l impact');

verifier(erreurs.length === 0, 'aucune erreur de page');
await nav.close();
console.log(rates.length ? '\nRATE : ' + rates.join(' ; ') : '\nOK : le Labo donne ce qu il faut valider, au niveau max.');
process.exit(rates.length ? 1 : 0);
