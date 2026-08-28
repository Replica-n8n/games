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
const Meteo = require(path.join(HERE, "..", "serpentin", "meteo.js"));
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

essai("la bombe tue tout ce qui est vivant, apres les avoir fait rougir", () => {
  const p = Moteur.creer({ graine: 22, monde: MONDE, foule: false });
  for (let i = 0; i < 8; i++) {
    const b = p.naitre("escargot");
    /* x ET y : `naitre` les pose en cercle, sans fixer y elles restaient hors
       de portee de la bombe et l'essai accusait le moteur a tort */
    b.x = p.joueur.x + 200 + i * 20;
    b.y = p.joueur.y;
  }
  p.objets.push({ sorte: "bombe", x: p.joueur.x, y: p.joueur.y, r: R.rayonObjet });
  p.pas(1 / 60);
  vrai(p.objets.length === 0, "la bombe est restee au sol");
  seconde(p, R.dureeBrulure + 0.2);
  vrai(p.bestioles.length === 0, "il en reste " + p.bestioles.length);
  vrai(p.tues === 8, "tues : " + p.tues);
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

essai("le coffre repand ses graines par terre", () => {
  const p = Moteur.creer({ graine: 24, monde: MONDE, foule: false });
  p.objets.push({ sorte: "coffre", x: p.joueur.x + 200, y: p.joueur.y, r: R.rayonObjet });
  p.joueur.x += 200;                       /* il marche dessus */
  p.pas(1 / 60);
  vrai(p.graines.length === R.grainesCoffre,
       "graines au sol : " + p.graines.length + ", il en faut " + R.grainesCoffre);
  vrai(p.xp === 0, "le coffre a donne l'experience tout seul, sans qu'on ramasse");
  vrai(p.objets.length === 0, "le coffre est reste au sol");
  /* et elles se ramassent */
  const avant = p.xp;
  p.graines.forEach((g) => { g.x = p.joueur.x; g.y = p.joueur.y; });
  p.pas(1 / 60);
  vrai(p.xp > avant, "les graines du coffre ne se ramassent pas");
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

essai("le herisson previent avant de charger", () => {
  const p = Moteur.creer({ graine: 30, monde: MONDE, foule: false });
  const h = p.naitre("herisson");
  h.x = p.joueur.x + 340; h.y = p.joueur.y;
  const vus = [];
  for (let i = 0; i < 60 * 5; i++) {
    p.pas(1 / 60);
    if (vus[vus.length - 1] !== h.etat) vus.push(h.etat);
  }
  vrai(vus.indexOf("prepare") >= 0, "il n a jamais prevenu : " + vus.join(" -> "));
  vrai(vus.indexOf("charge") > vus.indexOf("prepare"),
       "il a charge sans prevenir : " + vus.join(" -> "));

  /* le preavis dure au moins une seconde, immobile */
  const q = Moteur.creer({ graine: 31, monde: MONDE, foule: false });
  const h2 = q.naitre("herisson");
  h2.x = q.joueur.x + 310; h2.y = q.joueur.y;
  q.pas(1 / 60);
  let images = 0;
  while (h2.etat !== "charge" && images < 60 * 4) { q.pas(1 / 60); images++; }
  vrai(images >= 55, "le preavis n a dure que " + (images / 60).toFixed(2) + " s");
});

essai("le crapaud ne bouge pas, il tire", () => {
  const p = Moteur.creer({ graine: 32, monde: MONDE, foule: false });
  const c = p.naitre("crapaud");
  c.x = p.joueur.x + 260; c.y = p.joueur.y;
  const depart = { x: c.x, y: c.y };
  let bulles = 0;
  for (let i = 0; i < 60 * 6; i++) {
    p.pas(1 / 60);
    bulles = Math.max(bulles, p.tirs.length);
  }
  proche(c.x, depart.x, 0.001, "il a bouge");
  vrai(bulles > 0, "il n a jamais tire");
  vrai(p.joueur.coeurs < 5, "ses bulles ne touchent pas");
});

essai("le pissenlit eclate, et il y laisse sa peau", () => {
  const p = Moteur.creer({ graine: 33, monde: MONDE, foule: false });
  const d = p.naitre("pissenlit");
  d.x = p.joueur.x + 170; d.y = p.joueur.y;
  let explose = false;
  for (let i = 0; i < 60 * 6; i++) {
    if (p.pas(1 / 60).some((e) => e.type === "explosion")) explose = true;
  }
  vrai(explose, "il n a jamais eclate");
  vrai(d.vivante === false, "il a survecu a son explosion");
  vrai(p.joueur.coeurs === 4, "coeurs apres l explosion : " + p.joueur.coeurs);
  vrai(p.graines.length > 0, "il n a pas laisse sa graine");
});

essai("les cinq bestioles arrivent avant la troisieme minute", () => {
  const especes = Object.keys(Moteur.ESPECES);
  vrai(especes.length >= 5, "il n y a que " + especes.length + " bestioles");
  especes.forEach((n) => {
    vrai(Moteur.ESPECES[n].arrive <= 180,
         n + " n arrive qu a " + Moteur.ESPECES[n].arrive + " s, on meurt avant de la voir");
  });
});

essai("la montee de niveau souffle ce qui est autour", () => {
  const p = Moteur.creer({ graine: 34, monde: MONDE, foule: false });
  for (let i = 0; i < 6; i++) {
    const b = p.naitre("escargot");
    b.x = p.joueur.x + 30 + i * 12; b.y = p.joueur.y;
  }
  p.graines.push({ x: p.joueur.x, y: p.joueur.y, valeur: 999, r: 5, attiree: true });
  p.pas(1 / 60);
  vrai(p.niveau > 1, "le niveau n a pas monte");
  vrai(!!p.onde, "aucune onde n a ete posee");
  p.bestioles.forEach((b) => {
    const d = Math.hypot(b.x - p.joueur.x, b.y - p.joueur.y);
    vrai(d >= R.ondeNiveau, "une bestiole est restee a " + d.toFixed(0) + " unites");
  });
});

essai("le bouclier frappe tout ce qu il touche, pas seulement le premier", () => {
  const p = Moteur.creer({ graine: 35, monde: MONDE, foule: false });
  const a = Armes.creer(p);
  a.donner("bouclier");
  /* six escargots colles les uns aux autres, la ou le bouclier passe */
  const r = Armes.CATALOGUE.bouclier.base.rayon;
  for (let i = 0; i < 6; i++) {
    const b = p.naitre("escargot");
    const ang = i * 0.12;
    b.x = p.joueur.x + Math.cos(ang) * r;
    b.y = p.joueur.y + Math.sin(ang) * r;
    b.immobile = true;
  }
  /* une seule image : le bouclier est deja sur eux */
  p.joueur.invincibleJusqua = 1e9;
  const avant = p.tues;
  for (let i = 0; i < 3; i++) { a.pas(1 / 60); p.pas(1 / 60); }
  vrai(p.tues - avant >= 4,
       "il n en a tue que " + (p.tues - avant) + " sur six colles ensemble");
});

essai("l aimant aspire de plus en plus loin", () => {
  const p = Moteur.creer({ graine: 40, monde: MONDE, foule: false });
  const a = Armes.creer(p);
  const poser = (loin) => {
    const g = { x: p.joueur.x + loin, y: p.joueur.y, valeur: 1, r: 5, attiree: false };
    p.graines.length = 0;
    p.graines.push(g);
    a.pas(1 / 60);
    p.pas(1 / 60);
    return g.attiree;
  };
  vrai(poser(R.aimant + 60) === false, "sans aimant, il aspire deja trop loin");
  a.donnerObjet("aimant");
  a.donnerObjet("aimant");
  a.donnerObjet("aimant");
  vrai(p.bonus.aimant > 1, "l objet aimant ne remonte pas jusqu au moteur : " + p.bonus.aimant);
  vrai(poser(R.aimant + 60) === true,
       "avec trois aimants il n aspire pas plus loin (portee " + (R.aimant * p.bonus.aimant).toFixed(0) + ")");
});

essai("les bottes font courir plus vite", () => {
  const nu = Moteur.creer({ graine: 41, monde: MONDE, foule: false });
  const an = Armes.creer(nu);
  nu.commander({ angle: 0, avance: true });
  for (let i = 0; i < 60; i++) { an.pas(1 / 60); nu.pas(1 / 60); }

  const chausse = Moteur.creer({ graine: 41, monde: MONDE, foule: false });
  const ac = Armes.creer(chausse);
  ac.donnerObjet("bottes");
  ac.donnerObjet("bottes");
  chausse.commander({ angle: 0, avance: true });
  for (let i = 0; i < 60; i++) { ac.pas(1 / 60); chausse.pas(1 / 60); }

  vrai(chausse.joueur.x > nu.joueur.x + 10,
       "les bottes ne changent rien : " + nu.joueur.x.toFixed(0) + " contre " + chausse.joueur.x.toFixed(0));
});

essai("la bombe fait rougir avant de tuer", () => {
  const p = Moteur.creer({ graine: 42, monde: MONDE, foule: false });
  for (let i = 0; i < 5; i++) {
    const b = p.naitre("escargot");
    b.x = p.joueur.x + 60 + i * 20; b.y = p.joueur.y;
  }
  p.objets.push({ sorte: "bombe", x: p.joueur.x, y: p.joueur.y, r: R.rayonObjet });
  p.pas(1 / 60);
  vrai(p.bestioles.length === 5, "elles sont mortes dans la meme image, on n a rien vu");
  vrai(p.bestioles.every((b) => b.brule), "aucune ne rougit");
  vrai(p.explosions.length === 1, "aucun souffle a l ecran");
  seconde(p, R.dureeBrulure + 0.2);
  vrai(p.bestioles.length === 0, "il en reste " + p.bestioles.length + " apres la brulure");
  vrai(p.explosions.length === 0, "le souffle ne s efface jamais");
});

essai("l arme de depart n est pas toujours la meme", () => {
  /* c'est l'affichage qui tire l'arme, mais le tirage doit dependre de la
     graine de la partie : deux graines differentes, deux armes possibles */
  const vues = new Set();
  for (let g = 1; g <= 40; g++) {
    const p = Moteur.creer({ graine: g * 31, monde: MONDE, foule: false });
    const noms = Object.keys(Armes.CATALOGUE);
    vues.add(noms[Math.floor(p.alea() * noms.length)]);
  }
  vrai(vues.size >= 3, "seulement " + vues.size + " armes de depart possibles sur 40 tirages");
});

essai("les gantelets ajoutent des degats a plat, et ca se voit sur un gros", () => {
  /* L'epee fait 3. Sur une bestiole de 4 points de vie, il faut deux coups ;
     avec un gantelet (+1 a plat) un seul suffit. La vie est fixee ici et pas
     lue d'une espece : regler une bestiole ne doit pas casser cet essai, ce
     qui vient d'arriver quand le herisson est passe de 4 a 6. */
  function coups(gantelets){
    const p = Moteur.creer({ graine: 50, monde: MONDE, foule: false });
    const a = Armes.creer(p);
    a.donner("epee");
    for (let i = 0; i < gantelets; i++) a.donnerObjet("gantelets");
    const b = p.naitre("herisson");
    b.x = p.joueur.x + 40; b.y = p.joueur.y;
    b.immobile = true;
    b.vie = 4;
    p.joueur.invincibleJusqua = 1e9;
    let frappes = 0;
    for (let i = 0; i < 60 * 6 && b.vivante; i++) {
      const avant = b.vie;
      a.pas(1 / 60); p.pas(1 / 60);
      b.x = p.joueur.x + 40; b.y = p.joueur.y;    /* on le remet en place */
      if (b.vie < avant) frappes++;
    }
    return frappes;
  }
  const sans = coups(0), avec = coups(1);
  vrai(sans >= 2, "sans gantelet il tombe deja en " + sans + " coup");
  vrai(avec < sans, "avec un gantelet il faut toujours " + avec + " coups, comme sans");
});

essai("un coup repousse la bestiole", () => {
  const p = Moteur.creer({ graine: 51, monde: MONDE, foule: false });
  const b = p.naitre("crapaud");        /* six points de vie : il survit au coup */
  b.x = p.joueur.x + 60; b.y = p.joueur.y;
  const avant = b.x;
  p.blesser(b, 1, { x: p.joueur.x, y: p.joueur.y, force: 30 });
  vrai(b.vivante, "il est mort, l essai ne prouve rien");
  vrai(b.x > avant + 20, "il n a pas recule : " + avant.toFixed(0) + " puis " + b.x.toFixed(0));
});

essai("aucun objet ne reste sans effet", () => {
  /* L aimant et les bottes n ont rien fait pendant des heures, et les
     gantelets ne changeaient rien tant que tout mourait en un coup. Ce garde
     verifie que chaque objet touche vraiment quelque chose. */
  Object.keys(Armes.OBJETS).forEach((nom) => {
    /* une partie neuve par objet : il n'y a que quatre emplacements, et les
       derniers seraient refuses sans qu'on s'en apercoive */
    const p = Moteur.creer({ graine: 52, monde: MONDE, foule: false });
    const a = Armes.creer(p);
    a.donner("epee");
    const def = Armes.OBJETS[nom];
    const lus = {
      vitesse: () => p.bonus.vitesse,
      aimant: () => p.bonus.aimant,
      degats: () => a.aPlat("degats") + a.multiplicateur("degats") + a.recul(),
      zone: () => a.multiplicateur("zone"),
      recharge: () => a.multiplicateur("recharge"),
      coeur: () => p.joueur.coeursMax
    }[def.effet];
    vrai(!!lus, "l objet " + nom + " a un effet que personne ne lit : " + def.effet);
    const avant = lus();
    a.donnerObjet(nom);
    a.pas(1 / 60);
    vrai(lus() > avant, "l objet " + nom + " ne change rien du tout");
  });
});

essai("la grille ne confond jamais deux cases", () => {
  /* Le OU exclusif d'origine retournait les bits hauts sur un indice negatif :
     1196 des 2601 cases de l'arene se confondaient deux a deux, et la grille
     rendait des bestioles situees a l'autre bout. */
  const CASE = 70;
  const cle = (cx, cy) => Math.floor((cx * CASE) / CASE) * 8388608 + Math.floor((cy * CASE) / CASE);
  const vues = new Map();
  let collisions = 0;
  for (let cx = -30; cx <= 30; cx++) {
    for (let cy = -30; cy <= 30; cy++) {
      const k = cle(cx, cy);
      if (vues.has(k)) collisions++; else vues.set(k, 1);
    }
  }
  vrai(collisions === 0, collisions + " collisions de cles sur 61 x 61 cases");
});

essai("le gel ne supprime pas le preavis d une seconde", () => {
  const p = Moteur.creer({ graine: 60, monde: MONDE, foule: false });
  const c = p.naitre("crapaud");
  c.x = p.joueur.x + 200; c.y = p.joueur.y;
  p.joueur.invincibleJusqua = 1e9;
  seconde(p, 3);
  p.tirs.length = 0;
  const restait = c.prochain - p.tempsActif;
  vrai(restait > 1.2, "l essai commence trop pres du tir : " + restait.toFixed(2) + " s");
  p.gelJusqua = p.temps + R.dureeGel;
  seconde(p, R.dureeGel + 0.05);
  vrai(p.tirs.length === 0,
       "il a tire pendant ou juste apres le gel, sans prevenir");
  vrai(c.etat !== "gonfle" || restait <= 1.05,
       "il gonfle deja alors qu il lui restait " + restait.toFixed(2) + " s avant le gel");
  /* et il reprend normalement ensuite */
  seconde(p, 2);
  vrai(p.tirs.length > 0, "il ne tire plus jamais apres un gel");
});

essai("la glace fige aussi ce qui est deja en l air", () => {
  const p = Moteur.creer({ graine: 61, monde: MONDE, foule: false });
  p.joueur.invincibleJusqua = 1e9;
  p.tirs.push({ x: p.joueur.x + 300, y: p.joueur.y, vx: -150, vy: 0, r: 8, vie: 5, couleur: "#fff" });
  p.gelJusqua = p.temps + R.dureeGel;
  const avant = p.tirs[0].x;
  seconde(p, 1);
  vrai(p.tirs.length === 1, "la bulle a disparu pendant le gel");
  proche(p.tirs[0].x, avant, 0.001, "la bulle a avance pendant le gel");
});

essai("aucun cout de niveau ne peut valoir zero", () => {
  const garde = R.xpBase;
  R.xpBase = 0;
  vrai(Moteur.coutNiveau(1) >= 1, "cout nul : gagnerXp bouclerait a l infini");
  R.xpBase = -5;
  vrai(Moteur.coutNiveau(3) >= 1, "cout negatif : gagnerXp bouclerait a l infini");
  R.xpBase = garde;
});

essai("la foule atteint vraiment sa cible", () => {
  const p = Moteur.creer({ graine: 62, monde: { rayon: 1400, obstacles: [] } });
  const immortel = () => { p.joueur.coeurs = 5; p.joueur.vivant = true; p.fini = false; };
  /* on se place a la cinquieme minute, la ou trois especes sur cinq sont des
     individus et ou les naissances etaient massivement refusees */
  p.temps = 300;
  for (let i = 0; i < 60 * 40; i++) { immortel(); p.pas(1 / 60); }
  const cible = p.difficulte().cible;
  vrai(p.bestioles.length >= cible - 2,
       p.bestioles.length + " bestioles pour une cible de " + cible);
  const individus = p.bestioles.filter((b) => b.espece.individu).length;
  vrai(individus <= R.plafondIndividus, individus + " individus, le plafond est " + R.plafondIndividus);
});

essai("il fait beau au depart, le temps de comprendre le jeu", () => {
  const p = Moteur.creer({ graine: 70, monde: MONDE, foule: false });
  vrai(p.meteo.nom === "beau", "il fait deja " + p.meteo.nom + " au lancement");
  seconde(p, R.meteoDepart - 2);
  vrai(p.meteo.nom === "beau", "le temps a change au bout de " + p.temps.toFixed(0) + " s");
});

essai("le temps change tout seul, et jamais deux fois de suite le meme", () => {
  const p = Moteur.creer({ graine: 71, monde: MONDE, foule: false });
  const suite = [p.meteo.nom];
  for (let i = 0; i < 60 * 400; i++) {
    p.pas(1 / 60);
    if (p.evenements.some((e) => e.type === "meteo")) suite.push(p.meteo.nom);
  }
  vrai(suite.length >= 4, "le temps n a change que " + (suite.length - 1) + " fois en 400 s");
  for (let i = 1; i < suite.length; i++) {
    vrai(suite[i] !== suite[i - 1],
         "deux fois de suite le meme temps : " + suite.join(" -> "));
  }
  const vus = new Set(suite);
  vrai(vus.size === Object.keys(Meteo.TEMPS).length,
       "tous les temps ne sortent pas : " + [...vus].join(", "));
});

essai("le temps ne change aucune regle du jeu", () => {
  /* la pluie et la nuit sont du decor : deux parties menees exactement pareil
     doivent finir pareil, quel que soit le temps */
  function jouer(temps) {
    const p = Moteur.creer({ graine: 72, monde: MONDE, foule: false });
    p.meteo = { nom: temps, debut: 0, jusqua: 1e9 };
    const b = p.naitre("escargot");
    b.x = p.joueur.x + 2; b.y = p.joueur.y;
    for (let i = 0; i < 60 * 8; i++) {
      b.x = p.joueur.x + 2; b.y = p.joueur.y;
      p.pas(1 / 60);
    }
    return { coeurs: p.joueur.coeurs, x: +p.joueur.x.toFixed(3) };
  }
  const beau = jouer("beau"), nuit = jouer("nuit"), pluie = jouer("pluie");
  vrai(beau.coeurs === nuit.coeurs && beau.coeurs === pluie.coeurs,
       "les coeurs perdus changent avec le temps : " +
       JSON.stringify([beau.coeurs, nuit.coeurs, pluie.coeurs]));
  vrai(beau.x === nuit.x && beau.x === pluie.x, "le deplacement change avec le temps");
});

essai("chaque temps sait se dessiner, et aucun ne masque les bestioles", () => {
  Object.keys(Meteo.TEMPS).forEach((n) => {
    const t = Meteo.TEMPS[n];
    vrai(typeof t.poids === "number" && t.poids > 0, n + " n a pas de poids");
    vrai(Array.isArray(t.duree) && t.duree[1] > t.duree[0], n + " n a pas de duree");
    /* le voile se peint sur le sol, sous les bestioles : il doit rester
       translucide, sinon la nuit cache ce qui tue */
    if (t.teinte) {
      const alpha = parseFloat((t.teinte.match(/,\s*\.?\d*\)$/) || [",0)"])[0].slice(1, -1));
      vrai(alpha > 0 && alpha <= 0.6,
           n + " pose un voile d opacite " + alpha + " : au dela de 0,6 on ne voit plus le danger");
    }
  });
});

essai("chaque carte dit ce que le niveau change", () => {
  Object.keys(Armes.CATALOGUE).forEach((nom) => {
    const def = Armes.CATALOGUE[nom];
    const un = Armes.resume({ sorte: "arme", nom, def, niveau: 1 });
    const deux = Armes.resume({ sorte: "arme", nom, def, niveau: 2 });
    vrai(un === def.dit, nom + " niveau 1 devrait dire ce que l arme fait");
    vrai(deux !== un && deux.length > 3,
         nom + " niveau 2 ne dit pas ce qui change : \"" + deux + "\"");
    vrai(deux.split(",").length <= 2,
         nom + " annonce plus de deux changements : \"" + deux + "\"");
  });
  Object.keys(Armes.OBJETS).forEach((nom) => {
    const t = Armes.resume({ sorte: "objet", nom, def: Armes.OBJETS[nom], niveau: 2 });
    vrai(t && t.length > 3, "l objet " + nom + " ne dit rien");
  });
});

essai("le tableau des armes montre les valeurs reellement utilisees", () => {
  /* `nombre` et `perce` sont arrondis a l usage : un tableau qui montrerait
     1,34 fleche mentirait */
  const arc = Armes.progression("arc");
  arc.forEach((l) => {
    vrai(Number.isInteger(l.nombre), "nombre non entier au niveau " + l.niveau + " : " + l.nombre);
    vrai(Number.isInteger(l.perce), "perce non entier au niveau " + l.niveau + " : " + l.perce);
  });
  vrai(arc[0].nombre === 1 && arc[5].nombre === 6, "l arc ne gagne pas une fleche par niveau");
  const b = Armes.progression("bouclier");
  vrai(b[0].nombre === 1 && b[5].nombre === 6, "le bouclier ne gagne pas un bouclier par niveau");
});

essai("plus aucun reglage ne passe par l adresse", () => {
  /* le parametre d URL servait au jeu de serpent ; il permettait aussi de
     figer l onglet avec un reglage a zero */
  const page = fs.readFileSync(path.join(HERE, "..", "serpentin", "index.html"), "utf8");
  vrai(page.indexOf("reglagesDeLAdresse") < 0, "la lecture des reglages par l adresse est encore la");
  vrai(page.indexOf('get("mesure")') > 0, "?mesure=1 a disparu, il sert a mesurer sur le telephone");
});

essai("chaque objet a son tableau, et il bouge vraiment", () => {
  Object.keys(Armes.OBJETS).forEach((nom) => {
    const l = Armes.progressionObjet(nom);
    vrai(l.length === Armes.MAX_OBJET_NIVEAU,
         nom + " n a que " + l.length + " niveaux dans son tableau");
    l.forEach((r) => {
      vrai(r.effet && r.effet.length > 1, nom + " niveau " + r.niveau + " : effet vide");
      vrai(r.concret && r.concret.length > 3,
           nom + " niveau " + r.niveau + " : rien de concret a montrer");
    });
    vrai(l[0].concret !== l[l.length - 1].concret,
         nom + " donne la meme chose au niveau 1 et au niveau " + l.length);
  });
});

essai("ce que les bestioles lancent se voit sur l herbe", () => {
  /* Une bulle vert clair sur de l herbe verte tue sans qu on la voie venir.
     Mesure : elle avait un ecart de luminance de 22 avec le sol, quand chaque
     bestiole en a plus de 100. */
  const lum = (h) => {
    const n = parseInt(h.slice(1), 16);
    return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  };
  const Mondes = require(path.join(HERE, "..", "serpentin", "mondes.js"));
  const sols = [Mondes.prairie.fond, Mondes.prairie.sol];

  const p = Moteur.creer({ graine: 80, monde: MONDE, foule: false });
  const c = p.naitre("crapaud");
  c.x = p.joueur.x + 200; c.y = p.joueur.y;
  p.joueur.invincibleJusqua = 1e9;
  /* on attrape la bulle DES qu'elle part : plus tard elle a deja touche le
     chevalier et disparu, et l'essai croirait qu'il n'a rien lance */
  let bulle = null, rayonBulle = 0;
  for (let i = 0; i < 60 * 6 && !bulle; i++) {
    p.pas(1 / 60);
    if (p.tirs.length) { bulle = p.tirs[0].couleur; rayonBulle = p.tirs[0].r; }
  }
  vrai(bulle, "le crapaud n a rien lance en six secondes");
  sols.forEach((sol) => {
    const ecart = Math.abs(lum(bulle) - lum(sol));
    vrai(ecart > 60,
         "la bulle " + bulle + " n a que " + ecart.toFixed(0) +
         " d ecart avec le sol " + sol + " : on ne la verra pas venir");
  });
  vrai(rayonBulle >= 9, "la bulle ne fait que " + rayonBulle + " de rayon");
});

essai("la version de la page et celle du service worker sont les memes", () => {
  /* Sinon on ne sait plus ce qui tourne sur le telephone, et c est arrive :
     elle a joue deux corrections en retard sans le savoir. */
  const page = fs.readFileSync(path.join(HERE, "..", "serpentin", "index.html"), "utf8");
  const sw = fs.readFileSync(path.join(HERE, "..", "serpentin", "sw.js"), "utf8");
  const dansPage = (page.match(/var VERSION = "([^"]+)"/) || [])[1];
  const dansSw = (sw.match(/var VERSION = "([^"]+)"/) || [])[1];
  vrai(dansPage && dansSw, "une des deux versions est introuvable");
  vrai(dansPage === dansSw,
       "la page dit " + dansPage + " et le service worker " + dansSw);
});

essai("la page se recharge quand une nouvelle version prend la main", () => {
  const page = fs.readFileSync(path.join(HERE, "..", "serpentin", "index.html"), "utf8");
  vrai(page.indexOf("controllerchange") > 0,
       "rien ne recharge la page : une version installee servirait son cache indefiniment");
  vrai(page.indexOf("reg.update()") > 0, "on ne demande jamais s il y a du neuf");
});

essai("le herisson finit par toucher un chevalier qui bouge", () => {
  /* Trois fois de suite elle a dit qu il s arretait sans jamais toucher. Deux
     causes trouvees : il se preparait trop loin, et surtout il allait a 60
     quand le chevalier marche a 150, donc il ne rattrapait jamais personne. */
  const p = Moteur.creer({ graine: 90, monde: MONDE, foule: false });
  const a = Armes.creer(p);
  a.donner("bouclier");
  a.donner("bouclier");
  a.donner("bouclier");
  p.joueur.invincibleJusqua = 1e9;
  const h = p.naitre("herisson");
  h.x = p.joueur.x + 420; h.y = p.joueur.y;
  let mini = Infinity, charge = false;
  for (let i = 0; i < 60 * 30 && h.vivante; i++) {
    const dx = p.joueur.x - h.x, dy = p.joueur.y - h.y, d = Math.hypot(dx, dy) || 1;
    /* le chevalier fuit, comme un joueur */
    p.commander({ angle: Math.atan2(dy, dx), avance: d < 260 });
    a.pas(1 / 60); p.pas(1 / 60);
    if (h.etat === "charge") charge = true;
    const dd = Math.hypot(h.x - p.joueur.x, h.y - p.joueur.y);
    if (dd < mini) mini = dd;
  }
  vrai(charge, "il n a jamais charge");
  vrai(mini <= p.joueur.rayon + h.rayon,
       "il n a jamais touche : au plus pres " + mini.toFixed(0) +
       ", le contact est a " + (p.joueur.rayon + h.rayon));
});

essai("une bestiole plus lente que le chevalier ne peut jamais l atteindre", () => {
  /* le garde de fond : toute bestiole qui doit toucher au corps a corps doit
     pouvoir suivre. Le chevalier marche a REGLAGES.vitesse. */
  const lentes = Object.keys(Moteur.ESPECES).filter((n) => {
    const e = Moteur.ESPECES[n];
    return e.vitesse > 0 && e.vitesse < R.vitesse * 0.55 && !e.penser;
  });
  vrai(lentes.length <= 2,
       "trop de bestioles trop lentes pour jamais toucher : " + lentes.join(", "));
});

console.log(`\n${passes} passes, ${rates} rates\n`);
process.exit(rates ? 1 : 0);
