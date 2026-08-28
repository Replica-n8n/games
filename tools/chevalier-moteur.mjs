import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

/* Le moteur du chevalier, essaye sans navigateur.

   Les regles se controlent ici, en une seconde, sans telephone et sans
   capture d'ecran. Deux d'entre elles ne sont pas decoratives et meritent
   d'etre gardees par un essai : la seconde d'invincibilite, et le plafond de
   trois individus a l'ecran. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
require(path.join(HERE, "..", "serpentin", "bestioles.js"));
const Moteur = require(path.join(HERE, "..", "serpentin", "moteur.js"));
const Armes = require(path.join(HERE, "..", "serpentin", "armes.js"));
const R = Moteur.REGLAGES;

let rates = 0, passes = 0;
function essai(nom, fn) {
  try { fn(); passes++; console.log("  ok   " + nom); }
  catch (e) { rates++; console.log("  RATE " + nom + "\n       " + e.message); }
}
function vrai(condition, message) { if (!condition) throw new Error(message); }
function proche(a, b, marge, message) {
  /* sans ce garde, une valeur manquante donne NaN et l'essai passe sans rien
     prouver. C'est deja arrive. */
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error(`${message} : valeur non chiffree, ${a} et ${b}`);
  }
  if (Math.abs(a - b) > marge) throw new Error(`${message} : ${a} attendu ${b} a ${marge} pres`);
}
function seconde(p, n = 1) { for (let i = 0; i < 60 * n; i++) p.pas(1 / 60); }

const MONDE = { rayon: 1400, obstacles: [], bots: null };

console.log("\nMoteur du chevalier\n");

essai("une partie neuve : le chevalier au centre, cinq coeurs, rien au sol", () => {
  const p = Moteur.creer({ graine: 1, monde: MONDE, foule: false });
  proche(p.joueur.x, 0, 0.001, "x");
  vrai(p.joueur.coeurs === 5, "coeurs : " + p.joueur.coeurs);
  vrai(p.bestioles.length === 0, "il y a deja des bestioles");
  vrai(p.graines.length === 0, "il y a deja des graines");
  vrai(p.niveau === 1 && p.xp === 0, "l'experience ne part pas de zero");
});

essai("il ne bouge que si on lui demande", () => {
  const p = Moteur.creer({ graine: 2, monde: MONDE, foule: false });
  p.commander({ angle: 0, avance: false });
  seconde(p);
  proche(p.joueur.x, 0, 0.001, "immobile");
  p.commander({ angle: 0, avance: true });
  seconde(p);
  proche(p.joueur.x, R.vitesse, R.vitesse * 0.02, "une seconde de marche");
});

essai("la haie ne blesse pas, elle arrete", () => {
  const p = Moteur.creer({ graine: 3, monde: MONDE, foule: false });
  p.commander({ angle: 0, avance: true });
  seconde(p, 14);
  proche(Math.hypot(p.joueur.x, p.joueur.y), p.rayon - p.joueur.rayon, 1, "distance au centre");
  vrai(p.joueur.coeurs === 5, "la haie a coute un coeur");
});

essai("un contact coute un coeur, et un seul pendant l invincibilite", () => {
  const p = Moteur.creer({ graine: 4, monde: MONDE, foule: false });
  /* trois bestioles collees au chevalier : sans invincibilite il perdrait
     trois coeurs dans la meme image */
  for (let i = 0; i < 3; i++) p.naitre("escargot");
  p.bestioles.forEach((b) => { b.x = p.joueur.x + 2; b.y = p.joueur.y; });
  p.pas(1 / 60);
  vrai(p.joueur.coeurs === 4, "apres le premier contact : " + p.joueur.coeurs);
  /* pendant toute l'invincibilite, meme colle, il ne perd rien */
  const colle = (n) => {
    for (let i = 0; i < n; i++) {
      p.bestioles.forEach((b) => { b.x = p.joueur.x + 2; b.y = p.joueur.y; });
      p.pas(1 / 60);
    }
  };
  colle(Math.floor(60 * R.invincibilite) - 5);
  vrai(p.joueur.coeurs === 4, "il a perdu des coeurs pendant l'invincibilite : " + p.joueur.coeurs);
  colle(20);
  vrai(p.joueur.coeurs === 3, "l'invincibilite ne s'est pas terminee : " + p.joueur.coeurs);
});

essai("cinq coeurs perdus, la partie s'arrete", () => {
  const p = Moteur.creer({ graine: 5, monde: MONDE, foule: false });
  p.naitre("escargot");
  for (let i = 0; i < 60 * (R.invincibilite * 5 + 3); i++) {
    p.bestioles.forEach((b) => { b.x = p.joueur.x + 2; b.y = p.joueur.y; });
    p.pas(1 / 60);
  }
  vrai(p.joueur.coeurs === 0, "coeurs : " + p.joueur.coeurs);
  vrai(p.fini === true, "la partie n'est pas finie");
  vrai(p.joueur.vivant === false, "le chevalier est encore vivant");
});

essai("une bestiole tuee laisse une graine, qui donne de l'experience", () => {
  const p = Moteur.creer({ graine: 6, monde: MONDE, foule: false });
  const b = p.naitre("escargot");
  b.x = p.joueur.x + 300; b.y = p.joueur.y;
  p.blesser(b, 99);
  vrai(p.graines.length === 1, "graines : " + p.graines.length);
  vrai(p.tues === 1, "tues : " + p.tues);
  const avant = p.xp;
  /* le chevalier va la chercher */
  p.commander({ angle: 0, avance: true });
  seconde(p, 3);
  vrai(p.xp > avant, "l'experience n'a pas monte");
  vrai(p.graines.length === 0, "la graine est restee au sol");
});

essai("l'aimant attire a sa portee, et pas au dela", () => {
  const p = Moteur.creer({ graine: 7, monde: MONDE, foule: false });
  const loin = { x: p.joueur.x + R.aimant + 120, y: 0, valeur: 1, r: R.rayonGraine, attiree: false };
  const pres = { x: p.joueur.x + R.aimant - 15, y: 0, valeur: 1, r: R.rayonGraine, attiree: false };
  p.graines.push(loin, pres);
  p.pas(1 / 60);
  vrai(pres.attiree === true, "la graine a portee n'est pas attiree");
  vrai(loin.attiree === false, "une graine hors de portee est attiree");
});

essai("assez d'experience et on monte de niveau", () => {
  const p = Moteur.creer({ graine: 8, monde: MONDE, foule: false });
  const cout = p.xpProchain;
  for (let i = 0; i < cout; i++) {
    p.graines.push({ x: p.joueur.x, y: p.joueur.y, valeur: 1, r: 5, attiree: true });
    p.pas(1 / 60);
  }
  vrai(p.niveau === 2, "niveau : " + p.niveau);
  vrai(p.xpProchain > cout, "le niveau suivant ne coute pas plus cher");
});

essai("la foule monte avec les minutes, sans depasser le plafond", () => {
  const p = Moteur.creer({ graine: 9, monde: { rayon: 1400, obstacles: [] } });
  vrai(p.difficulte().cible === R.departFoule, "au depart : " + p.difficulte().cible);
  seconde(p, 6);
  vrai(p.bestioles.length === R.departFoule,
       "apres six secondes il y en a " + p.bestioles.length);
  p.temps = 3600;
  vrai(p.difficulte().cible === R.plafond, "le plafond n'est pas tenu");
});

essai("jamais plus de trois individus vivants", () => {
  const p = Moteur.creer({ graine: 10, monde: MONDE, foule: false });
  /* une espece qui demande d'etre suivie une par une */
  Moteur.ESPECES.essai = { nom: "essai", vie: 1, vitesse: 40, rayon: 10, xp: 1,
                           individu: true, arrive: 0 };
  let nes = 0;
  for (let i = 0; i < 12; i++) if (p.naitre("essai")) nes++;
  delete Moteur.ESPECES.essai;
  vrai(nes === R.plafondIndividus,
       nes + " individus sont nes, le plafond est " + R.plafondIndividus);
});

essai("les armes frappent seules et tuent", () => {
  const p = Moteur.creer({ graine: 11, monde: MONDE, foule: false });
  const a = Armes.creer(p);
  a.donner("epee");
  const b = p.naitre("escargot");
  b.x = p.joueur.x + 40; b.y = p.joueur.y;   /* devant lui, dans l'axe */
  for (let i = 0; i < 60; i++) { p.pas(1 / 60); a.pas(1 / 60); }
  vrai(p.tues === 1, "l'epee n'a rien tue");
});

essai("les trois cartes ne proposent jamais deux fois la meme chose", () => {
  const p = Moteur.creer({ graine: 12, monde: MONDE, foule: false });
  const a = Armes.creer(p);
  a.donner("epee");
  for (let tour = 0; tour < 30; tour++) {
    const choix = a.propositions(3);
    const noms = choix.map((c) => c.sorte + ":" + c.nom);
    vrai(new Set(noms).size === noms.length, "doublon dans les cartes : " + noms.join(", "));
    a.appliquer(choix[0]);
    vrai(a.armes.length <= Armes.MAX_ARMES, "plus de " + Armes.MAX_ARMES + " armes");
    vrai(a.objets.length <= Armes.MAX_OBJETS, "plus de " + Armes.MAX_OBJETS + " objets");
    a.armes.forEach((x) => vrai(x.niveau <= Armes.MAX_NIVEAU, x.nom + " depasse le niveau maximum"));
  }
});

essai("le heaume remplit TOUS les coeurs, pas seulement un de plus", () => {
  const p = Moteur.creer({ graine: 20, monde: MONDE, foule: false });
  const a = Armes.creer(p);
  p.joueur.coeurs = 2;
  a.donnerObjet("heaume");
  vrai(p.joueur.coeursMax === 6, "coeurs maximum : " + p.joueur.coeursMax);
  vrai(p.joueur.coeurs === 6,
       "il repart avec " + p.joueur.coeurs + " coeurs sur " + p.joueur.coeursMax +
       " : un coeur de plus quand il en reste deux ne recompense rien");
  p.joueur.coeurs = 1;
  a.donnerObjet("heaume");
  vrai(p.joueur.coeursMax === 7 && p.joueur.coeurs === 7,
       "au deuxieme heaume : " + p.joueur.coeurs + " sur " + p.joueur.coeursMax);
});

essai("une fraise rend un coeur, et attend s il n en manque aucun", () => {
  const p = Moteur.creer({ graine: 21, monde: MONDE, foule: false });
  p.temps = R.premierObjet + 1;
  p.pas(1 / 60);
  vrai(p.objets.length === 1, "aucun objet n est apparu");
  const o = p.objets[0];
  o.sorte = "fraise";
  o.x = p.joueur.x; o.y = p.joueur.y;
  p.pas(1 / 60);
  vrai(p.objets.length === 1, "la fraise a ete gaspillee a coeurs pleins");
  vrai(p.joueur.coeurs === 5, "les coeurs ont depasse le maximum");
  p.joueur.coeurs = 3;
  o.x = p.joueur.x; o.y = p.joueur.y;
  p.pas(1 / 60);
  vrai(p.joueur.coeurs === 4, "coeurs apres la fraise : " + p.joueur.coeurs);
  vrai(p.objets.length === 0, "la fraise est restee au sol");
});

essai("la bombe tue tout ce qui est vivant", () => {
  const p = Moteur.creer({ graine: 22, monde: MONDE, foule: false });
  for (let i = 0; i < 8; i++) {
    const b = p.naitre("escargot");
    b.x = p.joueur.x + 200 + i * 30;
  }
  p.objets.push({ sorte: "bombe", x: p.joueur.x, y: p.joueur.y, r: R.rayonObjet });
  p.pas(1 / 60);
  vrai(p.bestioles.length === 0, "il en reste " + p.bestioles.length);
  vrai(p.tues === 8, "tues : " + p.tues);
  vrai(p.objets.length === 0, "la bombe est restee au sol");
});

essai("la glace fige tout le monde dix secondes", () => {
  const p = Moteur.creer({ graine: 23, monde: MONDE, foule: false });
  const b = p.naitre("escargot");
  b.x = p.joueur.x + 300; b.y = p.joueur.y;
  const depart = b.x;
  p.objets.push({ sorte: "glace", x: p.joueur.x, y: p.joueur.y, r: R.rayonObjet });
  p.pas(1 / 60);
  const depart2 = b.x;      /* apres l'image ou la glace se declenche */
  seconde(p, 3);
  proche(b.x, depart2, 0.001, "elle a bouge pendant la glace");
  p.temps += R.dureeGel;
  seconde(p, 1);
  vrai(Math.abs(b.x - depart2) > 20, "elle ne repart pas apres la glace");
});

essai("le coffre donne une poignee de graines", () => {
  const p = Moteur.creer({ graine: 24, monde: MONDE, foule: false });
  p.objets.push({ sorte: "coffre", x: p.joueur.x, y: p.joueur.y, r: R.rayonObjet });
  p.pas(1 / 60);
  vrai(p.xp === R.grainesCoffre, "experience : " + p.xp);
  vrai(p.niveau > 1, "le coffre n a pas fait monter de niveau");
});

essai("le choc repousse ce qui est colle", () => {
  const p = Moteur.creer({ graine: 25, monde: MONDE, foule: false });
  const b = p.naitre("escargot");
  b.x = p.joueur.x + 2; b.y = p.joueur.y;
  p.pas(1 / 60);
  vrai(p.joueur.coeurs === 4, "il n a pas ete touche");
  const loin = Math.hypot(b.x - p.joueur.x, b.y - p.joueur.y);
  vrai(loin > 60, "la bestiole est restee collee : " + loin.toFixed(0) + " unites");
});

essai("l invincibilite dure ce qui est ecrit", () => {
  const p = Moteur.creer({ graine: 26, monde: MONDE, foule: false });
  vrai(R.invincibilite >= 1.5,
       "l invincibilite est de " + R.invincibilite + " s, c est trop court pour sortir d un groupe");
  const b = p.naitre("escargot");
  b.x = p.joueur.x + 2; b.y = p.joueur.y;
  p.pas(1 / 60);
  const t = p.temps;
  proche(p.joueur.invincibleJusqua - t, R.invincibilite, 0.02, "duree de l invincibilite");
});

essai("aucune declaration ne traine apres le `return partie`", () => {
  /* Trois fois de suite, du code place apres le return n a jamais ete
     execute : les fonctions remontent, pas les variables. `partie.blesser`,
     puis `var tampon`, puis `var SORTES` sont devenus undefined en silence.
     Ce garde coute deux lignes et ferme le piege. */
  const source = fs.readFileSync(path.join(HERE, "..", "serpentin", "moteur.js"), "utf8");
  const apres = source.slice(source.indexOf("return partie;") + 14);
  /* exactement quatre espaces : le corps meme de `creer`. Plus profond,
     c est l interieur d une fonction, et la c est normal. */
  const coupables = apres.split("\n").filter((l) => /^ {4}var\s+\w+\s*=/.test(l));
  vrai(coupables.length === 0,
       "declaration jamais executee apres le return : " + coupables.join(" | "));
});

console.log(`\n${passes} passes, ${rates} rates\n`);
process.exit(rates ? 1 : 0);
