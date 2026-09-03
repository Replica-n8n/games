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

/* on laisse le jeu tourner : les armes tuent, les graines montent le niveau.
   ⚠️ SANS LACHER LE MANCHE. Plante au milieu du pre pendant quatre secondes et
   demie, il perdait trois coeurs sur cinq avant meme la suite du controle — et
   depuis la chausse-trappe, une arme qui ne travaille qu'en marchant, il ne
   tuait plus rien non plus. Un enfant ne lache pas son pouce au milieu d'une
   vague ; le controle ne doit pas le faire non plus. */
for (let i = 0; i < 9; i++) {
  await p.mouse.move(110 + Math.cos(i * 0.7) * 110, HAUT - 255 + Math.sin(i * 0.7) * 110);
  await p.waitForTimeout(500);
}
const apresUnPeu = await etat();
await p.screenshot({ path: OUT + "chevalier-02-jeu.png" });

/* la montee de niveau : le jeu doit etre ARRETE pendant le choix */
let montee = null, avantChoix = null, apresChoix = null;
/* ⚠️ IL FAUT MARCHER PENDANT CETTE ATTENTE. Elle se faisait a l'arret, et
   ca tenait tant que toutes les armes frappaient toutes seules. Depuis la
   chausse-trappe et le vent tranchant, deux armes qui ne travaillent QUE si
   l'on se deplace, un depart tire sur l'une des deux ne tuait rien du tout :
   pas de graine, pas de montee de niveau, et le chevalier mourait au bout de
   vingt secondes. Le controle echouait alors sur une montee de niveau
   introuvable, alors que le vrai probleme etait qu'on avait plante le joueur
   au milieu du pre. On tourne donc lentement, comme un enfant qui fuit. */
/* ⚠️ INVULNERABLE PENDANT TOUTE LA CHASSE AU NIVEAU, et il fallait le faire
   AVANT de marcher. Trace a l'appui : a l'entree du rattrapage il etait deja
   `fini: true, coeurs: 0` — il mourait pendant les vingt secondes de marche,
   une partie finie fait sortir `pas()` tout de suite, et tout ce qu'on
   injectait ensuite tombait dans le vide. Trois correctifs successifs se sont
   trompes de cause avant que la trace le dise. Ce qu'on prouve ici, c'est
   qu'une montee ARRETE LE JEU et montre trois cartes ; sa survie se mesure
   dans `chevalier-difficulte.mjs`, et sa mort est testee plus bas. */
await p.evaluate(() => { window.jeu.partie().joueur.invincibleJusqua = 1e9; });
/* ⚠️ ON ACCELERE LE MOTEUR PENDANT LA CHASSE. C'est le seul endroit de la
   suite ou l'on ATTEND du temps de jeu : vingt secondes de vraie marche pour
   esperer un niveau. `jeu.accelerer(8)` fait avancer le moteur de huit pas par
   image dessinee — meme jeu, meme regles, mais huit fois moins d'attente. On
   le remet a 1 juste apres : tout ce qui suit mesure des ecrans et des clics,
   qui n'ont rien a gagner a courir. */
await p.evaluate(() => window.jeu.accelerer(8));
for (let i = 0; i < 30 && !montee; i++) {
  const an = 6.3 + i * 0.5;
  await p.mouse.move(110 + Math.cos(an) * 110, HAUT - 255 + Math.sin(an) * 110);
  const e = await etat();
  if (e.ecrans.montee) montee = e;
  else await p.waitForTimeout(120);
}
await p.evaluate(() => window.jeu.accelerer(1));

/* ⚠️ ET SI LA CHANCE N'A PAS VOULU, ON PROVOQUE LE NIVEAU. L'arme de depart
   est tiree au sort : selon celle qu'on obtient, vingt secondes de marche
   suffisent ou ne suffisent pas a monter d'un niveau. Le controle rendait donc
   `montee: null` une fois sur deux et echouait sans qu'il y ait le moindre
   probleme dans le jeu — un essai qui tombe a pile ou face ne prouve rien et
   coute une enquete a chaque fois. Ce qu'on veut prouver ici, c'est que la
   montee ARRETE LE JEU et montre trois cartes ; d'ou vient l'experience n'a
   aucune importance. */
/* ⚠️ ON LE REND INVULNERABLE LE TEMPS DU RATTRAPAGE. Marcher ne suffisait
   pas : il tient trois coeurs sur cinq a la sixieme seconde, et une partie sur
   cinq il mourait quand meme avant d'avoir monte un niveau. Ce qu'on prouve
   ici, c'est qu'une montee ARRETE LE JEU et montre trois cartes — pas qu'il
   sait survivre, ce que mesure `chevalier-difficulte.mjs`. On lui rend sa
   fragilite juste apres, l'ecran de fin est teste plus bas. */
for (let essai = 0; essai < 3 && !montee; essai++) {
  /* ⚠️ ON LAISSE D'ABORD LA FILE SE VIDER. Une grappe montre un ecran par
     niveau, separes d'un quart de seconde : injecter l'experience pendant que
     la file se deroule ajouterait un niveau a une grappe deja en cours, et on
     ne saurait plus quel ecran on mesure. On attend, puis on provoque.

     (Cette note disait l'inverse jusqu'au 2026-09-03 — « un niveau qui arrive
     a moins de deux secondes du dernier choix est OFFERT et n'ouvre aucun
     ecran » — parce que le jeu faisait ca, et que c'etait le defaut qu'elle a
     signale.) */
  /* ⚠️ IL CONTINUE DE MARCHER PENDANT CETTE ATTENTE, et c'est la deuxieme
     fois que ce controle se fait avoir par un chevalier immobile. Lache au
     milieu du pre il perd ses cinq coeurs en une vingtaine de secondes, et une
     partie finie fait sortir `pas()` tout de suite : la graine injectee
     restait au sol sans rien declencher, et le controle rendait `montee: null`
     une fois sur trois. */
  for (let w = 0; w < 6; w++) {
    await p.mouse.move(110 + Math.cos(w * 0.9) * 110, HAUT - 255 + Math.sin(w * 0.9) * 110);
    await p.waitForTimeout(450);
  }
  await p.evaluate(() => {
    const g = window.jeu.partie();
    /* ⚠️ CE QU'IL MANQUE VRAIMENT, pas le cout theorique du niveau. La
       graine valait `coutNiveau(niveau) + 1`, ce qui ignore l'experience deja
       accumulee ET le fait que `xpProchain` est fige au dernier passage de
       niveau : selon l'arme de depart tiree au sort, il en manquait encore et
       aucun ecran ne s'ouvrait. Le controle rendait `montee: null` une fois
       sur trois, et l'enquete a coute trois series de mesures. */
    g.graines.push({ x: g.joueur.x, y: g.joueur.y, r: 5, attiree: true,
                     valeur: g.xpProchain - g.xpNiveau + 1 });
  });
  await p.waitForTimeout(700);
  const e = await etat();
  if (e.ecrans.montee) montee = e;
}
await p.mouse.up();
await p.evaluate(() => {
  window.jeu.partie().joueur.invincibleJusqua = 0;
});
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
   rien n'avance. On le vide avant de mesurer quoi que ce soit.

   ⚠️ IL FAUT ATTENDRE PLUS DE 260 ms ENTRE DEUX CARTES. Depuis qu'une grappe
   montre un ecran PAR niveau, la carte suivante se leve un quart de seconde
   apres le clic. En n'attendant que 200 ms, cette boucle voyait « plus
   d'ecran », rendait la main, et l'ecran s'ouvrait juste apres : le clic
   suivant du banc tombait alors sur le voile, et Playwright mourait sur
   « <div id=montee> intercepts pointer events ». Trois fois de suite, sans que
   le jeu ait quoi que ce soit a se reprocher. Et il faut REGARDER une derniere
   fois apres la file vide, pour la meme raison. */
async function deverrouiller() {
  for (let i = 0; i < 8; i++) {
    const e = await p.evaluate(() => window.jeu.ecrans());
    if (!e.montee) {
      if (!e.niveauxDus) return;
      await p.waitForTimeout(350);      /* un niveau attend son ecran */
      continue;
    }
    await p.evaluate(() => window.jeu.choisir(0));
    await p.waitForTimeout(350);
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

/* ⚠️ REGLE INVERSEE LE 2026-09-02, et ce controle ne l'avait pas suivie.
   Il exigeait UN ECRAN PAR NIVEAU : un coffre en donnait trois, et deux
   cartes disparaissaient en silence. C'etait juste a l'epoque.

   Depuis « un seul choix par grappe », c'est exactement l'inverse qui est
   voulu : trois niveaux qui arrivent en moins de deux secondes ne doivent
   plus enchainer trois ecrans, les suivants sont OFFERTS. Le controle
   echouait donc sur la fonctionnalite elle-meme — 3 niveaux, 1 ecran.

   Ce qu'on verifie maintenant : au moins un ecran (les niveaux ne passent pas
   tous en silence), jamais plus d'ecrans que de niveaux, et la main rendue a
   la fin. Le detail de la grappe se mesure dans `chevalier-grappes.mjs`. */
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
/* ⚠️ ON ATTEND PLUS DE 260 ms ENTRE DEUX CARTES, et on ne s'arrete pas sur
   un ecran absent tant que la file n'est pas vide. La carte suivante d'une
   grappe se leve un quart de seconde apres le clic : en n'attendant que
   250 ms, cette boucle voyait « plus d'ecran », comptait un seul ecran pour
   trois niveaux, et laissait le jeu en pause — d'ou deux controles rouges
   trois fois sur quatre, sans que le jeu ait rien a se reprocher. */
let ecransVus = 0;
for (let i = 0; i < 8; i++) {
  const e = await p.evaluate(() => window.jeu.ecrans());
  if (!e.montee) {
    if (!e.niveauxDus) break;
    await p.waitForTimeout(350);
    continue;
  }
  ecransVus++;
  await p.evaluate(() => window.jeu.choisir(0));
  await p.waitForTimeout(350);
}
troisNiveaux.gagnes = apres3.niveau - troisNiveaux.avant;
troisNiveaux.ecransVus = ecransVus;
troisNiveaux.offerts = troisNiveaux.gagnes - ecransVus;
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

/* ⚠️ L'interrupteur « Difficile » : il doit vraiment faire arriver toutes les
   bestioles tout de suite, se garder d'une fois sur l'autre, et surtout ne pas
   nourrir les souvenirs qui reglent la difficulte.

   ⚠️ Il a DEMENAGE : il vit maintenant sur l'ecran de choix du personnage, plus
   dans le menu ⋯. On passe donc par « Recommencer », qui ramene precisement la.
   Clique dans le menu, il restait introuvable et le controle mourait sur un
   bouton invisible. */
/* ⚠️ ON VIDE LA FILE DES CARTES AVANT DE CLIQUER DANS LE MENU. Le jeu
   tourne pendant tout ce controle : un niveau peut tomber a n'importe quel
   moment, et le voile de l'ecran de choix intercepte alors le clic — trace a
   l'appui, « <b>Bottes</b> from <div id=montee> intercepts pointer events ».
   Ce n'est pas un defaut du jeu, c'est un banc qui clique sans regarder. */
await deverrouiller();
await deverrouiller();
await p.evaluate(() => window.jeu.menu("menuBouton"));
await p.waitForTimeout(200);
await p.click("#recommencer");
await p.waitForTimeout(400);
await p.click("#modeEssai");               /* sur l'ecran de depart : ca ne lance rien */
await p.click("#jouer");
await p.waitForTimeout(4600);              /* la roue tourne, la partie part */
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
await p.click("#recommencer");
await p.waitForTimeout(400);
await p.click("#modeNormal");
await p.click("#jouer");
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
/* ⚠️ CHAQUE VERIFICATION PORTE SON NOM. C'etait une seule chaine de
   quarante `&&` qui se resumait a « RATE : voir le bilan ci dessus », et il
   fallait relire deux cents lignes de JSON pour savoir laquelle avait lache.
   Un banc doit dire CE QUI casse, pas seulement QUE ca casse. */
const controles = [
  ["l ecran de depart s affiche et arrete le jeu", auDepart.ecrans.depart === true && auDepart.ecrans.pause === true],
  ["la roue tourne, le jeu attend", roueQuiTourne.roue.visible === true && roueQuiTourne.roue.tourne === true && roueQuiTourne.pause === true],
  ["la roue s arrete sur l arme qu elle annonce", roueArretee.roue.tourne === false && roueArretee.roue.nom === roueArretee.arme],
  ["le nom affiche est celui de l arme", roueArretee.nomAffiche.indexOf(roueArretee.nomAttendu) >= 0],
  ["apres la roue, le jeu part avec cette seule arme", apresRoue.ecrans.roue === false && apresRoue.ecrans.pause === false && apresRoue.armes.length === 1 && apresRoue.armes[0] === apresRoue.arme],
  ["le chevalier bouge", bouge],
  ["les bestioles arrivent", apresUnPeu.bestioles > 5],
  ["les armes tuent et rapportent", apresUnPeu.tues > 0 && apresUnPeu.xp > 0],
  ["une montee de niveau a ete observee", !!montee],
  ["elle montre trois cartes", !!montee && montee.ecrans.cartes === 3],
  ["elle ARRETE le jeu", !!montee && montee.jeuArrete === true],
  ["choisir referme l ecran", !!apresChoix && apresChoix.ecrans.montee === false],
  ["le coeur au sol soigne", fraise.apres > fraise.avant],
  ["trois niveaux d un coup donnent TROIS ecrans, un par niveau",
   troisNiveaux.gagnes >= 3 && troisNiveaux.ecransVus === troisNiveaux.gagnes],
  ["le jeu repart apres la grappe", troisNiveaux.finPause === false],
  ["le menu arrete le jeu", menuOuvert.menu === true && menuOuvert.pause === true],
  ["installer dit quoi faire sans l invitation de Chrome", apresInstaller.astuce === true],
  ["fermer le menu rend la main", menuFerme.menu === false && menuFerme.pause === false],
  ["le mode essai fait tout arriver tout de suite", enEssai.marque === true && enEssai.possibles >= 7],
  ["le mode normal ne nourrit pas les souvenirs", enNormal.marque === false && enNormal.possibles === 1],
  ["la mort mene a l ecran de fin", apresMort.fini === true && apresMort.ecrans.fin === true],
  ["la page n a leve aucune erreur", erreurs.length === 0],
];

const rates = controles.filter(([, vrai]) => !vrai).map(([nom]) => nom);
rates.forEach((m) => console.log("RATE : " + m));
console.log(rates.length
  ? "\nRATE : " + rates.length + " controle(s) sur " + controles.length
  : "\nOK : le chevalier bouge, les armes tuent, la montee de niveau arrete le jeu, et la mort mene a l'ecran de fin.");
process.exit(rates.length ? 1 : 0);
