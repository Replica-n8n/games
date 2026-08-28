import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { servir } from "./serveur.mjs";

/* Le parcours du jeu en Chromium, profil Pixel 9 (360 x 732 points CSS).
   Son telephone est un Pixel 9a, que Playwright ne connait pas : le Pixel 9 a
   la meme dalle et un ecran plus etroit, donc c'est le cas le plus dur pour
   placer un HUD.

   Ce que ce controle prouve : le jeu demarre, le pouce deplace le chevalier,
   les bestioles arrivent, les armes tuent, les graines se ramassent, la montee
   de niveau ARRETE le jeu et les trois cartes marchent, et la mort mene a
   l'ecran de fin. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "captures") + path.sep;
fs.mkdirSync(OUT, { recursive: true });

const site = await servir();
const navigateur = await chromium.launch();
const ctx = await navigateur.newContext({ ...devices["Pixel 9"] });
const p = await ctx.newPage();
const erreurs = [];
p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
p.on("pageerror", (e) => erreurs.push("pageerror: " + e.message));

const etat = () => p.evaluate(() => {
  const g = window.jeu.partie();
  return {
    temps: +g.temps.toFixed(1),
    bestioles: g.bestioles.length,
    graines: g.graines.length,
    tues: g.tues,
    xp: g.xp,
    niveau: g.niveau,
    coeurs: g.joueur.coeurs,
    x: +g.joueur.x.toFixed(0),
    y: +g.joueur.y.toFixed(0),
    fini: g.fini,
    projectiles: window.jeu.armes().projectiles.length,
    armes: window.jeu.armes().armes.map((a) => a.nom + " " + a.niveau),
    ecrans: window.jeu.ecrans(),
  };
});

await p.goto(site.jeu, { waitUntil: "networkidle" });
await p.waitForTimeout(300);
const auDepart = await etat();
await p.screenshot({ path: OUT + "chevalier-01-depart.png" });

/* la roue : elle ne decide rien, elle montre l'arme que la partie a deja
   tiree. Si elle s'arretait sur autre chose, ce serait du theatre. */
await p.click("#jouer");
await p.waitForTimeout(600);
const roueQuiTourne = await p.evaluate(() => ({
  roue: window.jeu.roue(),
  pause: window.jeu.ecrans().pause,
  arme: window.jeu.armeDeDepart(),
}));
await p.waitForTimeout(2600);
await p.screenshot({ path: OUT + "chevalier-09-roue.png" });
const roueArretee = await p.evaluate(() => ({
  roue: window.jeu.roue(),
  arme: window.jeu.armeDeDepart(),
  nomAffiche: document.getElementById("roueNom").textContent,
  nomAttendu: Armes.CATALOGUE[window.jeu.armeDeDepart()].nom,
}));
await p.waitForTimeout(1400);
const apresRoue = await p.evaluate(() => ({
  ecrans: window.jeu.ecrans(),
  armes: window.jeu.armes().armes.map((a) => a.nom),
  arme: window.jeu.armeDeDepart(),
}));

/* on commence, graine fixe : un controle qui echoue doit etre rejouable */
await p.evaluate(() => window.jeu.commencer(2026));
await p.waitForTimeout(400);

/* le pouce tire vers le haut : le chevalier doit se deplacer */
const [, HAUT] = auDepart.ecrans ? await p.evaluate(() => window.jeu.taille()) : [0, 0];
const avantDeplacement = await etat();
await p.mouse.move(110, HAUT - 210);
await p.mouse.down();
await p.mouse.move(110, HAUT - 300, { steps: 6 });
await p.waitForTimeout(900);
const enMarche = await etat();
await p.mouse.up();

/* on laisse le jeu tourner : les armes tuent, les graines montent le niveau */
await p.waitForTimeout(4500);
const apresUnPeu = await etat();
await p.screenshot({ path: OUT + "chevalier-02-jeu.png" });

/* la montee de niveau : le jeu doit etre ARRETE pendant le choix */
let montee = null, avantChoix = null, apresChoix = null;
for (let i = 0; i < 40 && !montee; i++) {
  const e = await etat();
  if (e.ecrans.montee) montee = e;
  else await p.waitForTimeout(500);
}
if (montee) {
  await p.screenshot({ path: OUT + "chevalier-03-niveau.png" });
  avantChoix = await etat();
  await p.waitForTimeout(700);
  const pendant = await etat();
  montee.jeuArrete = Math.abs(pendant.temps - avantChoix.temps) < 0.05;
  await p.evaluate(() => window.jeu.choisir(0));
  await p.waitForTimeout(600);
  apresChoix = await etat();
}

/* Un ecran de choix peut etre ouvert : tant qu'il l'est, le jeu est arrete et
   rien n'avance. On le vide avant de mesurer quoi que ce soit. */
async function deverrouiller() {
  for (let i = 0; i < 6; i++) {
    const e = await p.evaluate(() => window.jeu.ecrans());
    if (!e.montee) return;
    await p.evaluate(() => window.jeu.choisir(0));
    await p.waitForTimeout(200);
  }
}

/* On repart d'une partie neuve pour la suite : apres vingt secondes a
   attendre une montee de niveau sans bouger, le chevalier est souvent mort,
   et une partie finie n'avance plus du tout. */
await p.evaluate(() => window.jeu.commencer(7));
await p.waitForTimeout(300);

/* le coeur au sol : le seul soin de la partie. On la pose nous memes plutot que
   d'attendre qu'elle tombe : ce qu'on veut prouver, c'est le ramassage. */
await deverrouiller();
const fraise = await p.evaluate(() => {
  const g = window.jeu.partie();
  g.joueur.coeurs = 2;
  /* l'arene est videe : l'invincibilite ne suffit pas comme abri, le heaume
     la remet a 1,8 s des qu'il est choisi */
  g.bestioles.length = 0;
  g.objets.length = 0;
  g.objets.push({ sorte: "coeur", x: g.joueur.x + 30, y: g.joueur.y, r: 12 });
  return { avant: g.joueur.coeurs };
});
await p.screenshot({ path: OUT + "chevalier-05-fraise.png" });
await p.evaluate(() => {
  const g = window.jeu.partie();
  g.objets[0].x = g.joueur.x;
  g.objets[0].y = g.joueur.y;
});
await p.waitForTimeout(400);
await deverrouiller();
fraise.apres = (await etat()).coeurs;
fraise.resteAuSol = await p.evaluate(() => window.jeu.partie().objets.length);

/* plusieurs niveaux d'un coup : il doit y avoir un ecran de choix PAR niveau.
   Un coffre en donne trois, et deux cartes disparaissaient en silence. */
await deverrouiller();
const troisNiveaux = await p.evaluate(() => {
  const g = window.jeu.partie();
  g.bestioles.length = 0;
  g.objets.length = 0;
  const avant = g.niveau;
  /* de quoi passer trois niveaux d'un coup */
  let besoin = 0;
  let n = g.niveau;
  for (let k = 0; k < 3; k++) besoin += Moteur.coutNiveau(n + k);
  g.graines.push({ x: g.joueur.x, y: g.joueur.y, valeur: besoin + 1, r: 5, attiree: true });
  return { avant };
});
await p.waitForTimeout(900);
const apres3 = await p.evaluate(() => ({
  niveau: window.jeu.partie().niveau,
  ecrans: window.jeu.ecrans(),
}));
let ecransVus = 0;
for (let i = 0; i < 6; i++) {
  const e = await p.evaluate(() => window.jeu.ecrans());
  if (!e.montee) break;
  ecransVus++;
  await p.evaluate(() => window.jeu.choisir(0));
  await p.waitForTimeout(250);
}
troisNiveaux.gagnes = apres3.niveau - troisNiveaux.avant;
troisNiveaux.ecransVus = ecransVus;
troisNiveaux.finPause = (await p.evaluate(() => window.jeu.ecrans())).pause;

/* le menu, et l'entree d'installation */
await p.evaluate(() => document.getElementById("menuBouton").click());
await p.waitForTimeout(300);
const menuOuvert = await p.evaluate(() => window.jeu.ecrans());
await p.screenshot({ path: OUT + "chevalier-06-menu.png" });
await p.evaluate(() => window.jeu.menu("installer"));
await p.waitForTimeout(200);
const apresInstaller = await p.evaluate(() => window.jeu.ecrans());
await p.evaluate(() => window.jeu.menu("fermer"));
await p.waitForTimeout(200);
const menuFerme = await p.evaluate(() => window.jeu.ecrans());

/* ⚠️ L'interrupteur « Tout voir » : il doit vraiment faire arriver toutes les
   bestioles tout de suite, se garder d'une fois sur l'autre, et surtout ne pas
   nourrir les souvenirs qui reglent la difficulte. */
await p.evaluate(() => window.jeu.menu("menuBouton"));
await p.waitForTimeout(200);
await p.click("#modeEssai");
await p.waitForTimeout(4600);              /* la roue tourne, la partie repart */
const enEssai = await p.evaluate(() => {
  const g = window.jeu.partie();
  for (let i = 0; i < 60 * 6; i++) g.pas(1 / 60);
  return {
    marque: window.jeu.essai(),
    especes: [...new Set(g.bestioles.map((b) => b.nom))].sort(),
    possibles: g.difficulte(1).especes.length,
    partiesRetenues: window.jeu.souvenirs().parties,
  };
});

await p.evaluate(() => window.jeu.menu("menuBouton"));
await p.waitForTimeout(200);
await p.click("#modeNormal");
await p.waitForTimeout(4600);
const enNormal = await p.evaluate(() => ({
  marque: window.jeu.essai(),
  possibles: window.jeu.partie().difficulte(1).especes.length,
}));

/* La mort mene-t-elle a l'ecran de fin ? ⚠️ On ne l'ESPERE plus : avant, on
   retirait les coeurs et on attendait six secondes qu'une bestiole veuille
   bien le toucher. Une fois sur cinq personne ne venait, et le parcours ratait
   sans qu'aucun defaut existe. On pose donc une bestiole SUR lui. */
await p.evaluate(() => {
  const g = window.jeu.partie();
  g.joueur.coeurs = 1;
  g.joueur.invincibleJusqua = 0;   /* on lui retire l'abri de l'essai precedent */
  g.etoileJusqua = -1;             /* ni celui des cinq fruits */
  if (!g.bestioles.length) g.naitre("escargot");
  const b = g.bestioles[0];
  b.x = g.joueur.x;
  b.y = g.joueur.y;
  b.arrivee = -99;
});
await p.waitForTimeout(2500);
const apresMort = await etat();
await p.screenshot({ path: OUT + "chevalier-04-fin.png" });

await navigateur.close();
site.arreter();

const bilan = { auDepart, enEssai, enNormal, troisNiveaux, roueQuiTourne, roueArretee, apresRoue, avantDeplacement, enMarche, apresUnPeu, montee, apresChoix, fraise,
                menuOuvert, apresInstaller, menuFerme, apresMort, erreurs };
console.log(JSON.stringify(bilan, null, 2));

const bouge = Math.hypot(enMarche.x - avantDeplacement.x, enMarche.y - avantDeplacement.y) > 60;
const ok =
  auDepart.ecrans.depart === true &&
  auDepart.ecrans.pause === true &&
  /* la roue */
  roueQuiTourne.roue.visible === true &&
  roueQuiTourne.roue.tourne === true &&
  roueQuiTourne.pause === true &&
  roueArretee.roue.tourne === false &&
  roueArretee.roue.nom === roueArretee.arme &&
  roueArretee.nomAffiche.indexOf(roueArretee.nomAttendu) >= 0 &&
  apresRoue.ecrans.roue === false &&
  apresRoue.ecrans.pause === false &&
  apresRoue.armes.length === 1 &&
  apresRoue.armes[0] === apresRoue.arme &&
  bouge &&
  apresUnPeu.bestioles > 5 &&
  apresUnPeu.tues > 0 &&
  apresUnPeu.xp > 0 &&
  !!montee &&
  montee.ecrans.cartes === 3 &&
  montee.jeuArrete === true &&
  apresChoix.ecrans.montee === false &&
  fraise.apres > fraise.avant &&
  /* un ecran par niveau gagne */
  troisNiveaux.gagnes >= 3 &&
  troisNiveaux.ecransVus === troisNiveaux.gagnes &&
  troisNiveaux.finPause === false &&
  /* le menu arrete le jeu, et l'installation dit quoi faire meme sans
     l'invitation de Chrome, qui n'existe pas dans un navigateur sans ecran */
  menuOuvert.menu === true &&
  menuOuvert.pause === true &&
  apresInstaller.astuce === true &&
  menuFerme.menu === false &&
  /* l interrupteur */
  enEssai.marque === true &&
  enEssai.possibles >= 7 &&
  enNormal.marque === false &&
  enNormal.possibles === 1 &&
  menuFerme.pause === false &&
  apresMort.fini === true &&
  apresMort.ecrans.fin === true &&
  erreurs.length === 0;

console.log(ok
  ? "\nOK : le chevalier bouge, les armes tuent, la montee de niveau arrete le jeu, et la mort mene a l'ecran de fin."
  : "\nRATE : voir le bilan ci dessus.");
process.exit(ok ? 0 : 1);
