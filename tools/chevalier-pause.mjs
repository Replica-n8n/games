/* LE MENU ARRETE VRAIMENT LE JEU, ET PASSE AU DESSUS DE TOUT.

   Deux plaintes du 2026-09-15, en jouant : « apres une montee de niveau, si
   je fais pause pour couper le son, les cartes restent par dessus le menu » et
   « dans le menu le jeu n'est pas en pause, les mobs continuent de venir ».

   On controle ce qu'elle a fait, dans le vrai navigateur :
   1. cartes a l'ecran, on ouvre le menu : c'est le bouton Muet qui est sous le
      doigt, pas une carte, et le son se coupe ;
   2. menu ouvert, on choisit une carte « a travers » (ce que faisait son doigt)
      et la roue finit de tourner : le temps du jeu ne bouge pas d'un centieme ;
   3. l'explication du chat geant s'ouvre du menu et du choix du personnage,
      avec les chiffres du moteur. */
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

/* 3a. l'explication, depuis le choix du personnage */
await page.locator('#depart .aideChatOuvrir').click();
const aideDepart = await page.evaluate(() => ({
  vue: !document.getElementById('aideChat').hidden,
  tues: document.getElementById('aideTues').textContent,
  attendu: 'Bats ' + Moteur.REGLAGES.chatTues + ' bestioles'
}));
verifier(aideDepart.vue && aideDepart.tues === aideDepart.attendu,
  'explication du chat depuis le choix du personnage (' + aideDepart.tues + ')');
await page.locator('#aideChatFermer').click();

await page.evaluate(() => { window.jeu.choisirPerso('chevalier'); window.jeu.choisirMonde('prairie'); window.jeu.commencer(7); });
await page.waitForTimeout(300);

/* 1. une montee de niveau : on pose une grosse graine sous le chevalier */
await page.evaluate(() => {
  const p = window.jeu.partie(), j = p.joueur;
  j.invincibleJusqua = 1e9;
  p.graines.push({ x: j.x, y: j.y, valeur: 40, r: 5, attiree: false });
});
await page.waitForFunction(() => window.jeu.ecrans().cartes > 0, null, { timeout: 5000 });
await page.locator('#menuBouton').click();
const dessous = await page.evaluate(() => {
  const b = document.getElementById('sonNon').getBoundingClientRect();
  const el = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
  return el && el.id;
});
verifier(dessous === 'sonNon', 'menu ouvert sur les cartes : le bouton Muet est sous le doigt (' + dessous + ')');
await page.locator('#sonNon').click();
verifier(await page.evaluate(() => document.getElementById('sonNon').classList.contains('pris')), 'le son se coupe');

/* 2. menu ouvert : une carte choisie derriere, puis des bestioles tout pres */
const t0 = await page.evaluate(() => {
  const p = window.jeu.partie(), j = p.joueur;
  for (let i = 0; i < 6; i++) {
    p.naitre('escargot');
    const b = p.bestioles[p.bestioles.length - 1];
    b.arrivee = -99; b.x = j.x + 140 * Math.cos(i); b.y = j.y + 140 * Math.sin(i);
  }
  document.querySelector('#cartes .carte').click();
  return p.temps;
});
await page.waitForTimeout(1200);
const t1 = await page.evaluate(() => window.jeu.partie().temps);
verifier(t1 === t0, 'menu ouvert, carte choisie derriere : le jeu reste arrete (' + t0.toFixed(3) + ' -> ' + t1.toFixed(3) + ')');

/* 3b. l'explication, depuis le menu : chiffres de la partie en cours */
await page.locator('#menu .aideChatOuvrir').click();
const aideMenu = await page.evaluate(() => {
  const z = (id) => +getComputedStyle(document.getElementById(id)).zIndex;
  return { vue: !document.getElementById('aideChat').hidden, dessus: z('aideChat') > z('menu'),
           tues: document.getElementById('aideTues').textContent,
           attendu: 'Bats ' + window.jeu.partie().chat.objectifTues + ' bestioles' };
});
verifier(aideMenu.vue && aideMenu.dessus && aideMenu.tues === aideMenu.attendu, 'explication du chat depuis le menu');
await page.locator('#aideChatFermer').click();
await page.screenshot({ path: 'captures/pause-menu.png' });

await page.locator('#fermer').click();
/* la grosse graine a pu donner plusieurs niveaux : on choisit les cartes restantes */
for (let i = 0; i < 8; i++) {
  await page.waitForTimeout(400);
  if (!(await page.evaluate(() => window.jeu.ecrans().cartes))) break;
  await page.locator('#cartes .carte').first().click();
}
const t1b = await page.evaluate(() => window.jeu.partie().temps);
await page.waitForTimeout(600);
const t2 = await page.evaluate(() => window.jeu.partie().temps);
verifier(t2 > t1b, 'Continuer : le jeu repart');

/* 4. la roue qui finit pendant que le menu est ouvert */
await page.locator('#menuBouton').click();
await page.locator('#recommencer').click();
await page.locator('#jouer').click();
await page.waitForTimeout(200);
await page.locator('#menuBouton').click({ force: true });
const t3 = await page.evaluate(() => window.jeu.partie().temps);
await page.waitForTimeout(4500);
const e4 = await page.evaluate(() => ({ t: window.jeu.partie().temps, roue: window.jeu.ecrans().roue }));
verifier(!e4.roue && e4.t === t3, 'la roue finit menu ouvert : le jeu ne repart pas');

/* 5. Recommencer pendant les cartes : rien ne reste par dessus le choix du personnage */
await page.locator('#fermer').click();
await page.evaluate(() => {
  const p = window.jeu.partie(), j = p.joueur;
  p.graines.push({ x: j.x, y: j.y, valeur: 200, r: 5, attiree: false });
});
await page.waitForFunction(() => window.jeu.ecrans().cartes > 0, null, { timeout: 5000 });
await page.locator('#menuBouton').click();
await page.locator('#recommencer').click();
await page.waitForTimeout(500);
const e5 = await page.evaluate(() => window.jeu.ecrans());
verifier(e5.depart && !e5.montee && !e5.menu, 'Recommencer pendant les cartes : seul le choix du personnage reste');

verifier(erreurs.length === 0, 'aucune erreur de page');
await nav.close();
console.log(rates.length ? '\nRATE : ' + rates.join(' ; ') : '\nOK : le menu arrete le jeu et passe au dessus de tout.');
process.exit(rates.length ? 1 : 0);
