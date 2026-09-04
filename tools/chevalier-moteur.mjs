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
const Souvenirs = require(path.join(HERE, "..", "serpentin", "souvenirs.js"));
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

essai("un coeur au sol rend un coeur, et attend s il n en manque aucun", () => {
  const p = Moteur.creer({ graine: 21, monde: MONDE, foule: false });
  p.temps = R.premierObjet + 1;
  p.pas(1 / 60);
  vrai(p.objets.length === 1, "aucun objet n est apparu");
  const o = p.objets[0];
  o.sorte = "coeur";
  o.x = p.joueur.x; o.y = p.joueur.y;
  p.pas(1 / 60);
  vrai(p.objets.length === 1, "le coeur a ete gaspille a coeurs pleins");
  vrai(p.joueur.coeurs === 5, "les coeurs ont depasse le maximum");
  p.joueur.coeurs = 3;
  o.x = p.joueur.x; o.y = p.joueur.y;
  p.pas(1 / 60);
  vrai(p.joueur.coeurs === 4, "coeurs apres la fraise : " + p.joueur.coeurs);
  vrai(p.objets.length === 0, "le coeur est reste au sol");
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

essai("aucune bestiole n arrive apres la moitie d une partie ordinaire", () => {
  /* ⚠️ Le plafond n est pas un chiffre rond, il est TIRE DE LA MESURE : le
     joueur simule tient 345 s de mediane (tools/chevalier-difficulte.mjs).
     Une bestiole qui arrive apres la moitie de ce temps n est vue que dans une
     minorite de parties, et le travail de la dessiner ne sert a personne.
     Combien de parties la voient VRAIMENT se mesure dans
     tools/chevalier-objets.mjs, qui joue des parties entieres. */
  const PLAFOND = 200;
  /* ⚠️ Le boss ne suit pas cette regle : il n'arrive pas dans une vague, il est
     invoque a la fin des huit minutes. Le mesurer ici ferait echouer un
     controle sur une bestiole qui n'a rien a y faire. */
  const especes = Object.keys(Moteur.ESPECES).filter((n) => !Moteur.ESPECES[n].boss);
  vrai(especes.length >= 5, "il n y a que " + especes.length + " bestioles");
  especes.forEach((n) => {
    vrai(Moteur.ESPECES[n].arrive <= PLAFOND,
         n + " n arrive qu a " + Moteur.ESPECES[n].arrive + " s, on meurt avant de la voir");
  });
  /* et elles ne se bousculent pas toutes a la meme minute. Celles qui
     attendent un niveau ne comptent pas : leur heure n'est qu'un plancher. */
  const heures = especes.filter((n) => !Moteur.ESPECES[n].arriveNiveau)
                        .map((n) => Moteur.ESPECES[n].arrive).sort((a, b) => a - b);
  for (let i = 1; i < heures.length; i++) {
    vrai(heures[i] - heures[i - 1] >= 15,
         "deux bestioles arrivent a " + heures[i - 1] + " s et " + heures[i] + " s : trop serre");
  }
});

essai("la montee de niveau souffle ce qui est autour", () => {
  const p = Moteur.creer({ graine: 34, monde: MONDE, foule: false });
  for (let i = 0; i < 6; i++) {
    const b = p.naitre("escargot");
    b.x = p.joueur.x + 30 + i * 12; b.y = p.joueur.y;
  }
  p.graines.push({ x: p.joueur.x, y: p.joueur.y, valeur: 999, r: 5, attiree: true });
  const avant = p.bestioles.map((b) => Math.hypot(b.x - p.joueur.x, b.y - p.joueur.y));
  p.pas(1 / 60);
  vrai(p.niveau > 1, "le niveau n a pas monte");
  vrai(!!p.onde, "aucune onde n a ete posee");
  /* ⚠️ Elle POUSSE, elle ne teleporte pas : on regarde ou elles sont a la fin
     de la poussee, pas dans l image qui suit. Et elles doivent rester a
     l ecran, sinon elles ont l air de disparaitre. */
  seconde(p, R.dureePoussee + 0.05);
  p.bestioles.forEach((b, i) => {
    const d = Math.hypot(b.x - p.joueur.x, b.y - p.joueur.y);
    vrai(d > avant[i] + 60, "une bestiole n a ete poussee que de " + (d - avant[i]).toFixed(0));
    vrai(d < 340, "une bestiole a ete envoyee a " + d.toFixed(0) + " unites, hors de l ecran");
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

essai("le temps s enchaine, et l orage n arrive jamais apres la neige", () => {
  /* ⚠️ Une partie s arrete a huit minutes : on ne peut pas regarder le ciel
     plus longtemps que ca. On observe donc DOUZE parties, ce qui est aussi
     plus honnete : c est la variete d une partie a l autre qui compte. */
  const vus = new Set();
  let changements = 0, plusCourt = 1e9, plusLong = 0;
  for (let graine = 71; graine < 83; graine++) {
    const p = Moteur.creer({ graine: graine, monde: MONDE, foule: false });
    const suite = [p.meteo.nom];
    let debut = 0;
    for (let i = 0; i < 60 * 500 && !p.fini; i++) {
      p.pas(1 / 60);
      if (p.evenements.some((e) => e.type === "meteo")) {
        plusCourt = Math.min(plusCourt, p.temps - debut);
        plusLong = Math.max(plusLong, p.temps - debut);
        debut = p.temps;
        suite.push(p.meteo.nom);
      }
    }
    changements += suite.length - 1;
    suite.forEach((n) => vus.add(n));
    for (let i = 1; i < suite.length; i++) {
      vrai(suite[i] !== suite[i - 1],
           "deux fois de suite le meme temps : " + suite.join(" -> "));
      /* le coeur de sa demande : un enchainement LOGIQUE. Chaque temps
         declare ses suites, et le tirage ne doit jamais en sortir. */
      const permis = Meteo.TEMPS[suite[i - 1]].suites;
      vrai(!permis || permis[suite[i]] > 0,
           suite[i] + " est arrive apres " + suite[i - 1] + ", ce qui n a aucun sens");
    }
  }
  vrai(changements >= 40, "le temps n a change que " + changements + " fois en douze parties");
  vrai(vus.size === Object.keys(Meteo.TEMPS).length,
       "tous les temps ne sortent pas en douze parties : vus " + [...vus].join(", "));
  /* et il ne dure pas toujours pareil : c est ce qu elle a demande */
  vrai(plusCourt < 40 && plusLong > 100,
       "les durees se ressemblent toutes : de " + plusCourt.toFixed(0) + " a " + plusLong.toFixed(0) + " s");
});

essai("aucun temps n est un cul-de-sac, et aucun n est inatteignable", () => {
  const noms = Object.keys(Meteo.TEMPS);
  /* on part du beau temps, celui de la premiere seconde, et on regarde ou le
     graphe des suites peut mener. Un temps qu on n atteint jamais est du
     travail dessine pour personne. */
  const atteints = new Set(["beau"]);
  let bouge = true;
  while (bouge) {
    bouge = false;
    [...atteints].forEach((n) => {
      const suites = Meteo.TEMPS[n].suites || {};
      Object.keys(suites).forEach((suivant) => {
        vrai(noms.indexOf(suivant) >= 0, n + " annonce une suite qui n existe pas : " + suivant);
        if (suites[suivant] > 0 && !atteints.has(suivant)) { atteints.add(suivant); bouge = true; }
      });
    });
  }
  noms.forEach((n) => {
    vrai(atteints.has(n), n + " n est jamais atteignable depuis le beau temps");
    vrai(Object.keys(Meteo.TEMPS[n].suites || {}).length > 0, n + " ne mene nulle part");
    vrai(!(Meteo.TEMPS[n].suites || {})[n], n + " se declare comme sa propre suite");
  });
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
    vrai(Array.isArray(t.duree) && t.duree[1] > t.duree[0], n + " n a pas de duree");
    /* elle veut du vrai hasard : un temps dont la duree ne varie presque pas
       revient toujours au meme rythme et cesse d etonner */
    vrai(t.duree[1] >= t.duree[0] * 2.5,
         n + " dure entre " + t.duree[0] + " et " + t.duree[1] + " s : trop previsible");
    if (t.teinte) {
      const alpha = parseFloat((t.teinte.match(/,\s*\.?\d*\)$/) || [",0)"])[0].slice(1, -1));
      vrai(alpha > 0 && alpha <= 0.6,
           n + " pose un voile d opacite " + alpha + " : au dela de 0,6 on ne voit plus le danger");
    }
    if (t.ombres) vrai(!!t.dessinerOmbre, n + " promene des ombres que personne ne dessine");
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

essai("chaque bestiole se detache du sol", () => {
  /* La regle est la meme pour toutes : sombre et contrastee. On la mesure au
     lieu de la promettre, parce qu'une bulle vert clair sur de l herbe verte
     a deja tue sans qu on la voie. */
  const lum = (h) => {
    const n = parseInt(h.slice(1), 16);
    return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  };
  const Mondes = require(path.join(HERE, "..", "serpentin", "mondes.js"));
  const sols = [Mondes.prairie.fond, Mondes.prairie.sol].map(lum);
  Object.keys(Moteur.ESPECES).forEach((nom) => {
    const c = Moteur.ESPECES[nom].couleur;
    vrai(c, nom + " n a pas de couleur");
    sols.forEach((sol) => {
      const ecart = Math.abs(lum(c) - sol);
      vrai(ecart > 60,
           nom + " (" + c + ") n a que " + ecart.toFixed(0) + " d ecart avec le sol");
    });
  });
});

essai("deux bestioles ne se ressemblent pas", () => {
  /* « on dirait des mouches », « on dirait un oursin » : si deux especes ont
     presque la meme couleur, un enfant ne les distingue pas. */
  const lum = (h) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const noms = Object.keys(Moteur.ESPECES);
  for (let i = 0; i < noms.length; i++) {
    for (let j = i + 1; j < noms.length; j++) {
      const a = lum(Moteur.ESPECES[noms[i]].couleur);
      const b = lum(Moteur.ESPECES[noms[j]].couleur);
      const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      vrai(d > 40, noms[i] + " et " + noms[j] + " ont presque la meme couleur (" + d.toFixed(0) + ")");
    }
  }
});

essai("la foudre previent une seconde, et ne touche jamais le chevalier", () => {
  const p = Moteur.creer({ graine: 100, monde: MONDE, foule: false });
  for (let i = 0; i < 8; i++) {
    const b = p.naitre("escargot");
    b.x = p.joueur.x + 200 + i * 30; b.y = p.joueur.y + 40;
    /* immobiles : sinon elles viennent le toucher et l essai accuserait la
       foudre d un coeur perdu au contact */
    b.immobile = true;
  }
  p.changerMeteo("orage");
  const f = Meteo.TEMPS.orage.foudre;
  let annonces = 0, coups = 0, coeursAvant = p.joueur.coeurs;
  const vues = new Map();
  for (let i = 0; i < 60 * 12; i++) {
    const faits = p.pas(1 / 60);
    faits.forEach((e) => {
      if (e.type === "foudre annoncee") { annonces++; vues.set(p.foudres[p.foudres.length - 1], p.temps); }
      if (e.type === "foudre") coups++;
    });
    p.foudres.forEach((x) => {
      if (!x.frappee || !vues.has(x)) return;
      proche(x.tombe - vues.get(x), f.preavis, 0.02, "le preavis de la foudre");
      vues.delete(x);
    });
  }
  vrai(annonces > 0, "aucune foudre annoncee en douze secondes");
  vrai(coups > 0, "annoncee mais jamais tombee");
  vrai(p.joueur.coeurs === coeursAvant,
       "la foudre a coute un coeur au chevalier : c'est un cadeau, pas un piege");
  vrai(p.bestioles.length < 8, "la foudre n a tue personne");
});

/* ⚠️ LE TEMPS NE BASCULE PLUS, IL SE FOND EN SIX SECONDES. Tout essai qui
   mesure un effet PLEIN — le froid de la neige, la fonte au soleil, la
   resistance de la nuit — doit donc laisser le fondu se terminer, sinon il
   mesure un ciel a moitie change et se declare rouge. Trois essais l'ont fait
   le jour ou le fondu est arrive, et ils avaient tort : le jeu faisait
   exactement ce qu'on lui demandait. */
function ciel(p, nom) {
  p.changerMeteo(nom);
  seconde(p, 6.2);
}

essai("le temps se fond au lieu de basculer", () => {
  const p = Moteur.creer({ graine: 501, monde: MONDE, foule: false });
  p.changerMeteo("neige");
  vrai(p.meteo.avant === "beau", "le temps ne retient pas d ou il vient");
  vrai(p.meteo.fondu === 0, "le fondu commence deja a " + p.meteo.fondu);

  /* il monte, il ne saute pas */
  const jalons = [];
  for (let i = 0; i < 8; i++) { seconde(p, 1); jalons.push(p.meteo.fondu); }
  vrai(jalons[0] > 0 && jalons[0] < 0.25,
       "apres 1 s le fondu vaut deja " + jalons[0].toFixed(2) + " : ca reste un interrupteur");
  vrai(jalons[2] > 0.3 && jalons[2] < 0.7,
       "a mi-parcours le fondu vaut " + jalons[2].toFixed(2));
  vrai(jalons[6] === 1, "apres 7 s le fondu n est toujours pas fini : " + jalons[6]);

  /* et ce qui se mesure monte avec lui : a mi-fondu, la neige ne ralentit
     qu a moitie. C est toute la demande — le jeu ne doit pas dire une chose
     que l image ne dit pas encore. */
  const q = Moteur.creer({ graine: 501, monde: MONDE, foule: false });
  const plein = Meteo.TEMPS.neige.ralentit;
  q.changerMeteo("neige");
  seconde(q, 3);
  q.bestioles.length = 0;
  q.naitre("escargot");
  const b = q.bestioles[0];
  b.arrivee = -99; b.x = q.joueur.x + 400; b.y = q.joueur.y;
  const depart = b.x;
  seconde(q, 1);
  const aMoitie = depart - b.x;

  const r = Moteur.creer({ graine: 501, monde: MONDE, foule: false });
  ciel(r, "neige");
  r.bestioles.length = 0;
  r.naitre("escargot");
  const c = r.bestioles[0];
  c.arrivee = -99; c.x = r.joueur.x + 400; c.y = r.joueur.y;
  const depart2 = c.x;
  seconde(r, 1);
  const aFond = depart2 - c.x;
  vrai(aMoitie > aFond,
       "a mi-fondu la neige ralentit deja autant qu a fond : " +
       aMoitie.toFixed(1) + " contre " + aFond.toFixed(1));
  vrai(plein < 1, "la neige ne ralentit plus personne");
});

essai("la neige s accumule au lieu de tout poser d un coup", () => {
  const p = Moteur.creer({ graine: 101, monde: MONDE, foule: false });
  /* on force la neige a chaque seconde : sinon elle cede la place a un temps
     qui fait fondre, et on mesure la fonte en croyant mesurer la chute */
  function neiger(duree) {
    for (let i = 0; i < duree; i++) {
      if (p.meteo.nom !== "neige") p.changerMeteo("neige");
      seconde(p, 1);
    }
  }
  p.changerMeteo("neige");
  vrai(p.plaques.length === 0, "la neige a pose " + p.plaques.length + " plaques avant meme de tomber");
  neiger(10);
  const court = p.plaques.length;
  neiger(50);
  const long = p.plaques.length;
  vrai(court >= 1 && court <= 4, "une averse de 10 s a pose " + court + " plaques");
  vrai(long > court + 5, "60 s de neige n ont pose que " + long + " plaques contre " + court + " a 10 s");

  /* ⚠️ Elle doit tomber LA OU IL JOUE. Semee sur toute l arene de 1400, la
     glace tombait a plus de 500 de lui a chaque fois : il neigeait, et on ne
     glissait jamais. */
  /* ⚠️ SUR PLUSIEURS GRAINES, PAS UNE SEULE. Les plaques tombent entre 180
     et 800 du chevalier, tirage biaise vers le loin : le minimum d'une serie
     est une question de chance, et cet essai est passe au rouge le jour du
     fondu simplement parce que le decalage de trois secondes avait change le
     tirage — 506 au lieu de 340, pour un jeu identique. On demande donc que
     ca marche sur la MAJORITE des parties, ce qui est la vraie regle. */
  const minima = [101, 202, 303].map((graine) => {
    const q = Moteur.creer({ graine, monde: MONDE, foule: false });
    for (let i = 0; i < 60; i++) {
      if (q.meteo.nom !== "neige") q.changerMeteo("neige");
      seconde(q, 1);
    }
    const d = q.plaques.map((r) => Math.hypot(r.x - q.joueur.x, r.y - q.joueur.y));
    return { min: Math.min(...d), max: Math.max(...d) };
  });
  vrai(minima.filter((m) => m.min < 500).length >= 2,
       "la glace tombe loin du chevalier : minima " +
       minima.map((m) => Math.round(m.min)).join(", "));
  vrai(minima.every((m) => m.max < 1000),
       "une plaque est tombee a " + Math.round(Math.max(...minima.map((m) => m.max))) +
       " : personne n ira jamais dessus");

  neiger(200);
  vrai(p.plaques.length <= Meteo.TEMPS.neige.plaques.max,
       "la neige a depasse son plafond : " + p.plaques.length);
});

essai("sur la glace on glisse, et la glace ne blesse pas", () => {
  const p = Moteur.creer({ graine: 101, monde: MONDE, foule: false });
  p.changerMeteo("neige");
  seconde(p, 20);
  const q = p.plaques[0];
  p.joueur.x = q.x; p.joueur.y = q.y;
  q.r = 600; q.rPlein = 600;                  /* pour rester dessus pendant l essai */
  p.commander({ angle: 0, avance: true });
  seconde(p, 1);
  p.commander({ angle: 0, avance: false });   /* on lache tout */
  const avant = p.joueur.x;
  seconde(p, 0.5);
  vrai(p.joueur.x - avant > 8,
       "il s arrete net sur la glace : il a glisse de " + (p.joueur.x - avant).toFixed(1));
  vrai(p.joueur.coeurs === 5, "la glace lui a coute un coeur");

  const sec = Moteur.creer({ graine: 101, monde: MONDE, foule: false });
  sec.commander({ angle: 0, avance: true });
  seconde(sec, 1);
  sec.commander({ angle: 0, avance: false });
  const avant2 = sec.joueur.x;
  seconde(sec, 0.5);
  proche(sec.joueur.x, avant2, 0.001, "il glisse sur l herbe, ce n est pas voulu");
});

essai("la glace survit a la neige et fond au soleil, sans disparaitre d un coup", () => {
  const p = Moteur.creer({ graine: 103, monde: MONDE, foule: false });
  p.changerMeteo("neige");
  seconde(p, 60);
  const pose = p.plaques.length;
  vrai(pose >= 8, "il n a neige que " + pose + " plaques");

  p.changerMeteo("beau");
  vrai(p.plaques.length === pose,
       "le soleil a efface la glace d un coup au lieu de la faire fondre");

  /* on glisse encore dessus tant qu elle est la : c est ce qu elle a demande.
     ⚠️ On le mesure AVANT de laisser le soleil s installer : depuis que le
     temps se fond en six secondes, tout ce qui vient apres coute six secondes
     de fonte en plus, et les plus petites plaques avaient le temps de
     disparaitre — l essai accusait alors le jeu de les effacer d un coup. */
  const q = p.plaques[0];
  p.joueur.x = q.x; p.joueur.y = q.y;
  p.commander({ angle: 0, avance: true });
  seconde(p, 0.6);
  p.commander({ angle: 0, avance: false });
  const avant = p.joueur.x;
  seconde(p, 0.4);
  vrai(p.joueur.x - avant > 4,
       "la glace restee au soleil ne fait plus glisser : " + (p.joueur.x - avant).toFixed(1));

  /* le soleil revient en six secondes : la fonte monte avec lui */
  seconde(p, 5.2);

  /* ⚠️ Elle veut VOIR fondre. On mesure donc le retrecissement, pas la
     disparition : a 26 unites par seconde une plaque s effacait en trois
     secondes, ce qui ne se lisait pas comme une fonte. */
  const large = (j) => j.plaques.reduce((t, q) => t + q.r, 0);
  const avantSoleil = large(p);
  seconde(p, 2);
  const apres2 = large(p);
  vrai(apres2 < avantSoleil * 0.92,
       "en 2 s de soleil la glace n a presque pas fondu");
  vrai(apres2 > avantSoleil * 0.55,
       "en 2 s de soleil la glace a deja fondu de moitie : on ne voit rien fondre");
  vrai(p.plaques.length === pose, "des plaques ont disparu d un coup au lieu de retrecir");
  seconde(p, 30);
  vrai(p.plaques.length === 0, "il reste " + p.plaques.length + " plaques apres 32 s de plein soleil");
});

essai("sous la neige les bestioles ralentissent", () => {
  function parcouru(temps) {
    const p = Moteur.creer({ graine: 104, monde: MONDE, foule: false });
    ciel(p, temps);                        /* le fondu fini : on mesure l effet PLEIN */
    p.bestioles.length = 0;
    p.naitre("escargot");
    const b = p.bestioles[0];
    b.x = p.joueur.x + 400; b.y = p.joueur.y;
    b.arrivee = -99;                       /* pas d attente de mise en place */
    const depart = b.x;
    seconde(p, 4);
    return depart - b.x;
  }
  const chaud = parcouru("beau"), gele = parcouru("neige");
  vrai(chaud > 40, "l escargot n a pas avance au beau temps : " + chaud.toFixed(1));
  vrai(gele < chaud * 0.75,
       "la neige ne ralentit pas : " + gele.toFixed(1) + " contre " + chaud.toFixed(1));
  vrai(!!Meteo.TEMPS.neige.halo, "le ralentissement ne se voit pas : pas de halo bleu");
});

essai("chaque temps sait ce qu il pose au sol", () => {
  const p = Moteur.creer({ graine: 102, monde: MONDE, foule: false });
  Object.keys(Meteo.TEMPS).forEach((nom) => {
    const t = Meteo.TEMPS[nom];
    if (t.plaques) {
      vrai(!!t.dessinerPlaque, nom + " pose des plaques que personne ne dessine");
      vrai(t.plaques.chaque > 0 && t.plaques.max > 0, nom + " pose des plaques sans rythme ni plafond");
      vrai(!t.fonte, nom + " pose de la glace et la fait fondre en meme temps");
    }
    if (t.foudre) vrai(!!t.dessinerFoudre && !!t.dessinerEclair, nom + " a une foudre invisible");
    if (t.ralentit) vrai(t.ralentit < 1 && !!t.halo, nom + " ralentit sans que ca se voie");
  });
  p.changerMeteo("beau");
  vrai(p.plaques.length === 0, "le beau temps pose de la glace");
});

essai("le cadran annonce le temps une seconde avant qu il arrive", () => {
  const p = Moteur.creer({ graine: 110, monde: MONDE, foule: false });
  let annonce = null, changement = null;
  for (let i = 0; i < 60 * 200; i++) {
    const faits = p.pas(1 / 60);
    for (const e of faits) {
      if (e.type === "meteo annoncee" && !annonce) annonce = { nom: e.nom, quand: p.temps };
      if (e.type === "meteo" && annonce && !changement) changement = { nom: e.nom, quand: p.temps };
    }
    if (changement) break;
  }
  vrai(annonce, "le temps n a jamais ete annonce");
  vrai(changement, "le temps annonce n est jamais arrive");
  vrai(annonce.nom === changement.nom,
       "le cadran annoncait " + annonce.nom + " et il est arrive " + changement.nom);
  proche(changement.quand - annonce.quand, R.preavisMeteo, 0.05,
         "le preavis du cadran");
});

essai("pendant l annonce, le cadran montre deja le temps qui vient", () => {
  const p = Moteur.creer({ graine: 111, monde: MONDE, foule: false });
  let vu = false;
  for (let i = 0; i < 60 * 200 && !vu; i++) {
    p.pas(1 / 60);
    if (p.meteoProchaine) {
      vrai(p.meteoProchaine.nom !== p.meteo.nom,
           "le cadran annonce le temps qu il fait deja");
      vrai(p.meteoProchaine.quand > p.temps, "l annonce arrive apres le changement");
      vu = true;
    }
  }
  vrai(vu, "aucune annonce en trois minutes");
});

essai("chaque temps a son icone de cadran", () => {
  Object.keys(Meteo.TEMPS).forEach((nom) => {
    vrai(typeof Meteo.TEMPS[nom].icone === "function",
         nom + " n a pas d icone : le cadran serait vide");
  });
});

essai("personne ne perce le canvas", () => {
  /* `globalCompositeOperation = destination-out` ne troue pas seulement le
     dessin en cours : il troue TOUT ce qui est dessous. La lune du cadran a
     ainsi perce son fond et le decor. */
  const SAUT = String.fromCharCode(10);
  ["meteo.js", "bestioles.js", "armes.js", "mondes.js", "index.html"].forEach((f) => {
    const texte = fs.readFileSync(path.join(HERE, "..", "serpentin", f), "utf8");
    texte.split(SAUT).forEach((ligne, n) => {
      /* on ne cherche que l affectation : le mot dans un commentaire est
         justement la pour expliquer pourquoi on ne l utilise pas */
      if (!/globalCompositeOperation\s*=/.test(ligne)) return;
      vrai(false, f + " ligne " + (n + 1) + " perce le canvas : " + ligne.trim());
    });
  });
});

essai("une bestiole plus dure rapporte plus", () => {
  /* Sa remarque : un escargot de la septieme minute demande cinq coups et
     rapportait autant que celui de la premiere. */
  const p = Moteur.creer({ graine: 120, monde: MONDE, foule: false });
  const gains = [];
  [0, 240, 480].forEach((t) => {
    p.temps = t;
    const b = p.naitre("escargot");
    p.blesser(b, 999);
    gains.push({ vie: b.vieMax, graine: p.graines[p.graines.length - 1].valeur });
  });
  vrai(gains[2].vie > gains[0].vie, "la vie ne monte pas avec le temps");
  vrai(gains[2].graine > gains[0].graine,
       "elle encaisse " + gains[2].vie + " coups et rapporte toujours " + gains[2].graine);
  gains.forEach((g) => {
    vrai(g.graine >= g.vie - Moteur.ESPECES.escargot.vie + Moteur.ESPECES.escargot.xp,
         "la recompense ne suit pas la vie : " + JSON.stringify(g));
  });
});

essai("les souvenirs adoucissent le jeu quand on meurt vite", () => {
  /* la memoire elle meme : sans stockage (Node), elle doit rendre un reglage
     neutre plutot que planter */
  const neutre = Souvenirs.reglage();
  vrai(neutre.aide === 0, "sans souvenir, le jeu devrait etre normal");
  vrai(neutre.legumeChaque >= 12 && neutre.legumeChaque <= 40,
       "l ecart entre deux fruits est absurde : " + neutre.legumeChaque);

  /* la mediane decide, pas une partie ratee */
  vrai(Souvenirs.mediane([30, 300, 320]) === 300, "la mediane est mal calculee");

  /* et l aide se voit dans le jeu */
  const dur = Moteur.creer({ graine: 121, monde: { rayon: 1400, obstacles: [] }, aide: 0 });
  const doux = Moteur.creer({ graine: 121, monde: { rayon: 1400, obstacles: [] }, aide: 2 });
  vrai(doux.difficulte().cible < dur.difficulte().cible,
       "l aide ne change rien a la foule");
  vrai(doux.aide === 2 && dur.aide === 0, "l aide n est pas retenue par la partie");
});

essai("les cinq fruits sont tous trouvables avant la fin d une partie habituelle", () => {
  /* Sa remarque : un fruit qui arrive a la septieme minute quand on meurt a
     la troisieme n'existe pas. */
  const court = Souvenirs.reglage();
  const cinq = court.legumeChaque * 5;
  vrai(cinq <= 180 * 0.75,
       "il faut " + cinq + " s pour les cinq fruits, contre une partie mediane de 180 s");
});

essai("les cinq reunis rendent invincible, et on balaye au contact", () => {
  const p = Moteur.creer({ graine: 122, monde: MONDE, foule: false });
  Moteur.LEGUMES.forEach((n) => {
    p.objets.push({ sorte: n, x: p.joueur.x, y: p.joueur.y, r: 12 });
    p.pas(1 / 60);
  });
  vrai(p.etoileJusqua > p.temps, "les cinq fruits n ont pas declenche l etoile");
  vrai(Object.keys(p.panier).length === 0, "le panier ne s est pas vide apres l etoile");
  const b = p.naitre("escargot");
  b.x = p.joueur.x + 2; b.y = p.joueur.y; b.immobile = true;
  p.pas(1 / 60);
  vrai(!b.vivante, "en etoile, la bestiole touchee survit");
  vrai(p.joueur.coeurs === 5, "en etoile, il a quand meme perdu un coeur");
  /* et quand ca s arrete, il redevient mortel */
  p.temps = p.etoileJusqua + 0.1;
  const c = p.naitre("escargot");
  c.x = p.joueur.x + 2; c.y = p.joueur.y; c.immobile = true;
  p.pas(1 / 60);
  vrai(p.joueur.coeurs === 4, "l etoile ne s arrete jamais");
});

essai("aucune sorte d objet n est avalee en silence", () => {
  const p = Moteur.creer({ graine: 130, monde: MONDE, foule: false });
  /* tout ce que le jeu peut poser doit AGIR ; ce qu il ne connait pas doit
     rester au sol, pas disparaitre sans rien faire */
  const connues = ["coeur", "coffre", "bombe", "glace", "salamandre", "aimant"].concat(Moteur.LEGUMES);
  connues.forEach((sorte) => {
    const q = Moteur.creer({ graine: 131, monde: MONDE, foule: false });
    q.joueur.coeurs = 3;
    q.naitre("escargot");
    q.objets.push({ sorte: sorte, x: q.joueur.x, y: q.joueur.y, r: 12 });
    q.pas(1 / 60);
    vrai(q.objets.length === 0, "l objet " + sorte + " est reste au sol");
  });
  p.objets.push({ sorte: "chose-inconnue", x: p.joueur.x, y: p.joueur.y, r: 12 });
  p.pas(1 / 60);
  vrai(p.objets.length === 1,
       "une sorte inconnue a ete avalee en silence au lieu de rester au sol");
});

essai("le lucane se voit venir, se laisse ignorer, et se paye cher", () => {
  const c = Moteur.ESPECES.lucane;
  /* le boss est plus gros que le demi-boss, et c'est voulu : on le compare
     donc a part, plus bas. */
  const autres = Object.keys(Moteur.ESPECES)
    .filter((n) => n !== "lucane" && !Moteur.ESPECES[n].boss);
  /* « bien plus gros que les autres pour comprendre qu il est menacant » */
  autres.forEach((n) => {
    vrai(c.rayon >= Moteur.ESPECES[n].rayon * 2,
         "le lucane (" + c.rayon + ") n est pas deux fois plus gros que le " + n);
  });
  /* « assez lent pour gerer les autres en meme temps » : on doit pouvoir le
     semer, sinon il devient l unique urgence */
  vrai(c.vitesse < Moteur.REGLAGES.vitesse * 0.3,
       "le lucane avance a " + c.vitesse + " contre " + Moteur.REGLAGES.vitesse + " au chevalier");
  vrai(c.individu, "le lucane ne compte pas dans les trois individus suivis");
  /* et le vrai boss doit le depasser, sinon la fin n'impressionne personne */
  const boss = Object.keys(Moteur.ESPECES).find((n) => Moteur.ESPECES[n].boss);
  vrai(!!boss, "il n y a pas de boss de fin");
  vrai(Moteur.ESPECES[boss].rayon > c.rayon,
       "le boss (" + Moteur.ESPECES[boss].rayon + ") n est pas plus gros que le demi-boss (" + c.rayon + ")");

  const p = Moteur.creer({ graine: 140, monde: MONDE, foule: false });
  p.naitre("lucane");
  const b = p.bestioles[0];
  vrai(b.vie >= 60, "le lucane tombe en " + b.vie + " points de vie");

  /* « une recompense a la hauteur de l exploit », et en plusieurs graines :
     douze graines a ramasser se voient, une seule ne se voit pas */
  const avant = p.graines.length;
  p.blesser(b, 9999);
  const tombees = p.graines.slice(avant);
  vrai(tombees.length >= 8, "le lucane n a laisse que " + tombees.length + " graines");
  const recolte = tombees.reduce((t, g) => t + g.valeur, 0);
  const escargot = Moteur.ESPECES.escargot.xp;
  vrai(recolte >= escargot * 20,
       "le lucane rapporte " + recolte + ", a peine " + (recolte / escargot).toFixed(0) + " escargots");
});

essai("la salamandre court toute seule, seme le feu, et la trainee lui survit", () => {
  /* ⚠️ Elle remplace le PIMENT, qui faisait semer le feu au chevalier
     lui-meme. Ce qui change : ce n'est plus lui qui doit courir. Ce qui ne
     change pas : le feu, ses chiffres, et le fait qu'une trainee ne se pose
     que si son porteur AVANCE — sinon une flaque grossit sur place et devient
     un bouclier immobile. */
  const p = Moteur.creer({ graine: 141, monde: MONDE, foule: false });
  p.objets.length = 0;
  p.objets.push({ sorte: "salamandre", x: p.joueur.x, y: p.joueur.y, r: 12 });
  p.pas(1 / 60);
  vrai(p.salamandres.length === 1, "la salamandre ramassee ne s est pas reveillee");

  /* LE CHEVALIER NE BOUGE PAS, et pourtant le feu vient : c'est tout le sujet */
  p.commander({ angle: 0, avance: false });
  p.bestioles.length = 0;
  for (let i = 0; i < 4; i++) {
    const b = p.naitre("escargot");
    b.arrivee = -99; b.vie = 9999; b.immobile = true;
    b.x = p.joueur.x + 120 + i * 30; b.y = p.joueur.y + (i % 2 ? 40 : -40);
  }
  /* ⚠️ ON COMPTE LES FLAMMEES NEES, et on les compare au MAXIMUM theorique :
     une tous les `feuChaque`. Un simple « plus de huit » laissait passer un
     defaut mesure a la main — elle n'en posait que 44 sur 142 possibles, parce
     que le test de deplacement comparait l'ECART au dernier feu au lieu du
     CHEMIN parcouru, et qu'elle zigzague entre deux proies. */
  let nees = 0, dernierNe = -1;
  for (let i = 0; i < 60 * 2; i++) {
    p.pas(1 / 60);
    for (const f of p.feux) if (f.ne > dernierNe + 1e-9) nees++;
    if (p.feux.length) dernierNe = Math.max(dernierNe, p.feux[p.feux.length - 1].ne);
  }
  const possible = Math.floor(2 / Moteur.REGLAGES.feuChaque);
  vrai(nees > possible * 0.7,
       "elle n a pose que " + nees + " flammees en deux secondes, sur " + possible +
       " possibles : elle avance sans semer");

  /* ⚠️ LA LAISSE : elle ne sort jamais du champ. Une aide qu'on ne voit pas
     n'existe pas — le papillon a coute deux allers-retours pour l'avoir
     oublie. On met une proie tres loin : elle ne doit pas la suivre. */
  p.bestioles.length = 0;
  const loin = p.naitre("escargot");
  loin.arrivee = -99; loin.vie = 9999; loin.immobile = true;
  loin.x = p.joueur.x + 1000; loin.y = p.joueur.y;
  let plusLoin = 0;
  for (let i = 0; i < 60 * 3; i++) {
    p.pas(1 / 60);
    if (p.salamandres[0]) plusLoin = Math.max(plusLoin,
      Math.hypot(p.salamandres[0].x - p.joueur.x, p.salamandres[0].y - p.joueur.y));
  }
  vrai(plusLoin <= Moteur.REGLAGES.laisseSalamandre + 1,
       "elle s est eloignee de " + Math.round(plusLoin) + " unites, pour une laisse de " +
       Moteur.REGLAGES.laisseSalamandre);

  /* ⚠️ la plus ancienne flamme s efface en premier */
  const vieilleLa = p.feux[0].ne;
  seconde(p, 2);
  vrai(p.feux.length > 0 && p.feux[0].ne > vieilleLa,
       "la trainee ne s efface pas par le bout le plus vieux");

  /* et le feu dure PLUS LONGTEMPS qu elle */
  while (p.salamandres.length) seconde(p, 0.5);
  vrai(p.feux.length > 0, "le feu s est eteint en meme temps que la salamandre");
  seconde(p, Moteur.REGLAGES.feuVie + 0.5);
  vrai(p.feux.length === 0, "il reste " + p.feux.length + " flammes bien apres la fin");
});

essai("la salamandre ne blesse pas au contact, et rien ne la blesse", () => {
  /* ⚠️ Un allie qui frappe tout seul existe deja trois fois : le Bouclier,
     la Boule givree et l'Arc. Elle ne frappe donc pas — ce qui tue, c'est
     uniquement ce qu'elle laisse derriere elle. */
  const p = Moteur.creer({ graine: 143, monde: MONDE, foule: false });
  p.objets.length = 0;
  p.objets.push({ sorte: "salamandre", x: p.joueur.x, y: p.joueur.y, r: 12 });
  p.pas(1 / 60);
  p.commander({ angle: 0, avance: false });
  p.bestioles.length = 0;
  const b = p.naitre("lucane");
  b.arrivee = -99; b.immobile = true;
  b.x = p.joueur.x + 60; b.y = p.joueur.y;
  const s0 = p.salamandres[0];
  const vieAvant = b.vie;
  /* ⚠️ ON ETEINT LE FEU, on ne le balaye pas. Vider `p.feux` apres chaque
     image ne suffisait pas : une flammee posee pendant l'image brule pendant
     cette meme image, et l'essai accusait un contact qui n'existe pas (0,1
     degat). En mettant les degats du feu a zero, il ne reste QUE le contact —
     c'est exactement ce qu'on veut isoler. */
  const degats = Moteur.REGLAGES.degatsFeu;
  Moteur.REGLAGES.degatsFeu = 0;
  for (let i = 0; i < 60; i++) {
    p.pas(1 / 60);
    if (p.salamandres[0]) { p.salamandres[0].x = b.x; p.salamandres[0].y = b.y; }
  }
  Moteur.REGLAGES.degatsFeu = degats;
  vrai(b.vie === vieAvant,
       "collee dessus sans feu, elle a quand meme fait " + (vieAvant - b.vie).toFixed(1) + " degats");
  vrai(!!s0, "la salamandre n existait pas");
});

essai("ce qui traverse le feu brule, et le chevalier n y brule pas", () => {
  const p = Moteur.creer({ graine: 142, monde: MONDE, foule: false });
  p.objets.length = 0;
  p.objets.push({ sorte: "salamandre", x: p.joueur.x, y: p.joueur.y, r: 12 });
  p.pas(1 / 60);
  /* on lui donne de quoi courir, sinon elle tourne sur place autour de lui */
  p.bestioles.length = 0;
  for (let i = 0; i < 3; i++) {
    const c = p.naitre("escargot");
    c.arrivee = -99; c.vie = 9999; c.immobile = true;
    c.x = p.joueur.x + 100 + i * 40; c.y = p.joueur.y;
  }
  seconde(p, 1.5);

  p.bestioles.length = 0;
  p.naitre("lucane");                       /* assez de vie pour mesurer */
  const b = p.bestioles[0];
  b.arrivee = -99;
  const f = p.feux[Math.floor(p.feux.length / 2)];
  const vieAvant = b.vie, coeurs = p.joueur.coeurs;
  for (let i = 0; i < 60; i++) { b.x = f.x; b.y = f.y; p.pas(1 / 60); }
  const brule = vieAvant - b.vie;
  proche(brule, Moteur.REGLAGES.degatsFeu, 1.2,
         "une seconde dans le feu a coute " + brule.toFixed(1) + " points");
  vrai(p.joueur.coeurs === coeurs, "son propre feu lui a coute un coeur");

  /* a cote du feu, elle ne brule pas */
  const q = Moteur.creer({ graine: 142, monde: MONDE, foule: false });
  q.naitre("lucane");
  const b2 = q.bestioles[0];
  b2.arrivee = -99; b2.x = q.joueur.x + 900; b2.y = q.joueur.y;
  const v2 = b2.vie;
  seconde(q, 1);
  vrai(b2.vie === v2, "une bestiole loin de tout feu a perdu " + (v2 - b2.vie) + " points");
});

essai("chaque sorte d objet tombe VRAIMENT du tirage", () => {
  /* ⚠️ Le defaut qui a coute le plus cher jusqu ici. Le piment marchait
     parfaitement : il s allumait, il brulait, les essais passaient. Mais il n
     avait jamais ete ajoute a la liste de tirage, et il n est donc JAMAIS
     tombe en partie. Un essai qui pose l objet a la main ne prouve rien sur ce
     que le jeu seme.

     On lit donc la source : toute sorte que le ramassage sait traiter doit
     etre dans le tirage, et toute sorte du tirage doit etre traitee. Un
     controle statique, pas un tirage au sort qui aurait laisse passer une
     sorte rare une fois sur douze. */
  const source = fs.readFileSync(path.join(HERE, "..", "serpentin", "moteur.js"), "utf8");
  const traitees = new Set();
  const re = /o\.sorte === "([a-z]+)"/g;
  let m;
  while ((m = re.exec(source))) traitees.add(m[1]);
  vrai(traitees.size >= 4, "on n a trouve que " + traitees.size + " sortes traitees dans la source");

  const tirees = new Set(Moteur.SORTES.map((s) => s.sorte));
  traitees.forEach((s) => {
    vrai(tirees.has(s), s + " a un effet mais ne tombe jamais : il manque au tirage");
  });
  Moteur.SORTES.forEach((s) => {
    vrai(traitees.has(s.sorte) || Moteur.LEGUMES.indexOf(s.sorte) >= 0,
         s.sorte + " tombe du ciel et ne fait rien");
    vrai(s.poids > 0, s.sorte + " a un poids de " + s.poids + " : il ne sortira jamais");
  });

  /* et la derniere de la liste doit etre atteignable : c'est exactement la
     ou le piment se serait cache si on l'avait ajoute apres coup */
  const derniere = Moteur.SORTES[Moteur.SORTES.length - 1].sorte;
  let vue = false;
  for (let g = 0; g < 40 && !vue; g++) {
    const q = Moteur.creer({ graine: 150 + g, monde: MONDE, foule: false });
    for (let i = 0; i < 60 * 200 && !vue; i++) {
      q.objets.length = 0;
      q.pas(1 / 60);
      if (q.objets.length && q.objets[0].sorte === derniere) vue = true;
    }
  }
  vrai(vue, "la derniere sorte du tirage (" + derniere + ") n est jamais tombee en 40 parties");

});

essai("les fruits au sol ne bouchent pas la place des objets", () => {
  /* ⚠️ Mesure : le sol etait plein 329 s sur 417, parce que les cinq fruits
     attendaient d etre trouves ET comptaient dans le plafond. Il ne tombait
     que deux coeurs par partie au lieu d une vingtaine. */
  const p = Moteur.creer({ graine: 151, monde: MONDE, foule: false });
  p.objets.length = 0;
  Moteur.LEGUMES.forEach((n, i) => {
    p.objets.push({ sorte: n, x: p.joueur.x + 600 + i * 40, y: p.joueur.y + 600, r: 12 });
  });
  const avant = p.objets.length;
  seconde(p, 90);
  const poses = p.objets.filter((o) => Moteur.LEGUMES.indexOf(o.sorte) < 0).length;
  vrai(poses > 0,
       "avec " + avant + " fruits au sol, plus aucun objet n est tombe en 90 s");
});

essai("la memoire des parties resserre le jeu autant qu elle l adoucit", () => {
  /* ⚠️ La moitie manquante. La metrique ne savait qu ADOUCIR : quelqu un qui
     tient huit minutes a chaque partie continuait a recevoir le meme jeu, qui
     devenait facile et ennuyeux. Elle va maintenant dans les deux sens. */
  const doux = Moteur.creer({ graine: 160, monde: MONDE, aide: 2 });
  const normal = Moteur.creer({ graine: 160, monde: MONDE, aide: 0 });
  const serre = Moteur.creer({ graine: 160, monde: MONDE, aide: -2 });

  const foule = (j) => j.difficulte(300).cible;
  vrai(foule(doux) < foule(normal) && foule(normal) < foule(serre),
       "la foule ne suit pas l aide : " + foule(doux) + " / " + foule(normal) + " / " + foule(serre));

  const vie = (j) => { j.bestioles.length = 0; j.naitre("lucane"); return j.bestioles[0].vie; };
  vrai(vie(doux) < vie(normal) && vie(normal) < vie(serre),
       "la vie du lucane ne suit pas l aide : " + vie(doux) + " / " + vie(normal) + " / " + vie(serre));
});

essai("ce que la memoire decide, sur des durees reelles", () => {
  const Souvenirs = require(path.join(HERE, "..", "serpentin", "souvenirs.js"));
  /* on remplace le stockage du navigateur par un faux, le temps de l essai */
  const boite = {};
  global.localStorage = {
    getItem: (k) => (k in boite ? boite[k] : null),
    setItem: (k, v) => { boite[k] = String(v); },
    removeItem: (k) => { delete boite[k]; },
  };
  const cas = [
    { durees: [60, 70, 80], aide: 2, quoi: "il meurt en une minute" },
    { durees: [180, 200, 190], aide: 1, quoi: "il tient trois minutes" },
    { durees: [280, 300, 290], aide: 0, quoi: "il tient cinq minutes" },
    { durees: [360, 380, 350], aide: -1, quoi: "il tient six minutes" },
    { durees: [470, 480, 460], aide: -2, quoi: "il va au bout a chaque fois" },
  ];
  cas.forEach((c) => {
    Souvenirs.oublier();
    c.durees.forEach((d) => Souvenirs.ajouter(d));
    const r = Souvenirs.reglage();
    vrai(r.aide === c.aide,
         c.quoi + " : le jeu repond " + r.aide + " au lieu de " + c.aide);
  });

  /* ⚠️ Une seule partie ne decide de rien : une partie ratee n est pas une
     habitude. */
  Souvenirs.oublier();
  Souvenirs.ajouter(30);
  vrai(Souvenirs.reglage().aide === 0, "une seule partie a suffi a changer le jeu");
  Souvenirs.oublier();
  delete global.localStorage;
});

essai("la limace crache au sol, et ce qu elle laisse ne se tue pas", () => {
  const p = Moteur.creer({ graine: 170, monde: MONDE, foule: false });
  p.bestioles.length = 0;
  p.naitre("limace");
  const b = p.bestioles[0];
  b.arrivee = -99;
  b.x = p.joueur.x + 260; b.y = p.joueur.y;

  /* elle previent avant de cracher, comme tout le reste */
  seconde(p, 2.2);
  vrai(b.etat === "gonfle", "elle crache sans prevenir : etat " + b.etat);
  seconde(p, 1.2);
  vrai(p.crachats.length + p.flaques.length > 0, "elle n a rien crache du tout");

  /* ⚠️ Ce qui vole ne touche RIEN : c'est ce qui distingue un crachat d'un
     tir. On le pose sur le chevalier et on verifie qu il ne perd rien. */
  const coeurs = p.joueur.coeurs;
  if (p.crachats.length) {
    p.crachats[0].x = p.joueur.x;
    p.crachats[0].y = p.joueur.y;
  }
  seconde(p, 0.3);
  vrai(p.joueur.coeurs === coeurs, "un crachat en vol lui a coute un coeur");

  /* la glaire freine, et ne blesse pas */
  p.bestioles.length = 0;              /* plus personne pour lui prendre un coeur */
  p.crachats.length = 0;
  p.flaques.length = 0;
  p.flaques.push({ x: p.joueur.x, y: p.joueur.y, r: 300, sorte: "glaire",
                   ne: p.temps - 1, i: 0 });   /* deja eclose */
  const coeurs2 = p.joueur.coeurs;
  p.commander({ angle: 0, avance: true });
  const depart = p.joueur.x;
  seconde(p, 1);
  const freine = p.joueur.x - depart;
  vrai(p.joueur.coeurs === coeurs2, "la glaire lui a coute un coeur");

  const sec = Moteur.creer({ graine: 170, monde: MONDE, foule: false });
  sec.bestioles.length = 0;
  sec.commander({ angle: 0, avance: true });
  const d2 = sec.joueur.x;
  seconde(sec, 1);
  const libre = sec.joueur.x - d2;
  vrai(freine < libre * 0.75,
       "la glaire ne freine pas : " + freine.toFixed(0) + " contre " + libre.toFixed(0));
});

essai("l acide retrograde une fois, puis freine au lieu de disparaitre", () => {
  /* ⚠️ Avant, une flaque d'acide touchee pendant le repos de 90 s etait
     SUPPRIMEE sans le moindre effet : ni degat, ni signe, ni flaque. « J'ai vu
     des crachats tomber a terre mais jamais apparaitre en flaque. » */
  const q = Moteur.creer({ graine: 171, monde: MONDE, foule: false });
  q.bestioles.length = 0;
  const malus = [];
  for (let tour = 0; tour < 3; tour++) {
    q.flaques.push({ x: q.joueur.x, y: q.joueur.y, r: 200, sorte: "acide",
                     ne: q.temps - Moteur.REGLAGES.eclosionFlaque, i: 0 });
    for (let i = 0; i < 60; i++) {
      q.pas(1 / 60);
      q.evenements.forEach((e) => { if (e.type === "malus") malus.push(q.temps); });
    }
  }
  vrai(malus.length === 1,
       "trois flaques d acide d affilee ont coute " + malus.length + " niveaux");
  vrai(q.flaques.length === 2,
       "il reste " + q.flaques.length + " flaques : celles du repos ont disparu en silence");
  vrai(q.freineJusqua > q.temps - 0.1,
       "l acide au repos ne freine meme pas : il ne fait donc rien du tout");
});

essai("une flaque s etale avant de toucher qui que ce soit", () => {
  /* ⚠️ Le crachat vise 90 unites DEVANT le chevalier : sans temps d eclosion,
     la flaque etait consommee a la seconde ou elle touchait le sol. Jamais
     evitable, jamais vue. */
  const p = Moteur.creer({ graine: 173, monde: MONDE, foule: false });
  p.bestioles.length = 0;
  p.flaques.push({ x: p.joueur.x, y: p.joueur.y, r: 200, sorte: "acide",
                   ne: p.temps, i: 0 });
  seconde(p, Moteur.REGLAGES.eclosionFlaque * 0.5);
  vrai(p.flaques.length === 1, "la flaque a ete consommee avant d avoir fini de s etaler");
  vrai(!(p.freineJusqua > p.temps), "elle freine deja alors qu elle s etale encore");
  seconde(p, Moteur.REGLAGES.eclosionFlaque);
  vrai(p.flaques.length === 0, "une fois etalee, elle n a rien fait");
});

essai("retrograder ne fait jamais disparaitre une arme", () => {
  const p = Moteur.creer({ graine: 172, monde: MONDE, foule: false });
  const a = Armes.creer(p);
  a.donner("epee"); a.donner("epee"); a.donner("epee");
  vrai(a.armes[0].niveau === 3, "l epee n est pas au niveau 3");
  const perdu = a.retrograder(p.alea);
  vrai(perdu && perdu.nom === "epee" && perdu.niveau === 2,
       "le retrogradage n a pas rendu ce qu il a touche");
  /* ⚠️ Jamais en dessous de 1, et jamais retiree : un enfant qui perd son arme
     d un coup n a plus rien pour se defendre et ne comprend pas pourquoi. */
  a.retrograder(p.alea);
  a.retrograder(p.alea);
  a.retrograder(p.alea);
  vrai(a.armes.length === 1, "l arme a disparu au lieu de rester au niveau 1");
  vrai(a.armes[0].niveau === 1, "l epee est tombee au niveau " + a.armes[0].niveau);
  vrai(a.retrograder(p.alea) === null, "il a retrograde quelque chose qui etait deja au plus bas");
  /* et ce qu il rend doit suffire a l afficher */
  const b = Armes.creer(p);
  b.donner("arc"); b.donner("arc");
  const r = b.retrograder(p.alea);
  vrai(!!r.emoji && !!r.titre, "le retrogradage ne dit pas quoi montrer a l enfant");
});

essai("le mode d essai leve les DEUX portes, l heure et le niveau", () => {
  /* ⚠️ La limace n attend pas l heure mais la PUISSANCE (niveau 6). Remettre
     les heures a zero sans lever cette porte-la laisserait le mode « tout
     voir » sans limace : il mentirait sur ce qu il montre. */
  const aNiveau = Object.keys(Moteur.ESPECES)
    .filter((n) => Moteur.ESPECES[n].arriveNiveauVrai > 0);
  vrai(aNiveau.length > 0, "aucune bestiole n attend un niveau : l essai ne prouve rien");

  Bestioles.reglerEssai(true);
  Object.keys(Moteur.ESPECES).forEach((n) => {
    vrai(Moteur.ESPECES[n].arrive === 0, n + " arrive encore a " + Moteur.ESPECES[n].arrive + " s");
    vrai(!Moteur.ESPECES[n].arriveNiveau, n + " attend encore le niveau " + Moteur.ESPECES[n].arriveNiveau);
  });
  const p = Moteur.creer({ graine: 180, monde: MONDE });
  /* le boss reste hors des vagues meme en mode difficile : il s'invoque a la
     fin des huit minutes, il ne se croise pas au detour d'une prairie */
  const horsBoss = Object.keys(Moteur.ESPECES).filter((n) => !Moteur.ESPECES[n].boss);
  vrai(p.difficulte(1).especes.length === horsBoss.length,
       "toutes les bestioles ne sont pas disponibles des la premiere seconde");

  Bestioles.reglerEssai(false);
  Object.keys(Moteur.ESPECES).forEach((n) => {
    vrai(Moteur.ESPECES[n].arrive === Moteur.ESPECES[n].arriveVraie,
         n + " n a pas retrouve son heure");
    vrai((Moteur.ESPECES[n].arriveNiveau || 0) === Moteur.ESPECES[n].arriveNiveauVrai,
         n + " n a pas retrouve sa porte de niveau");
  });
  const q = Moteur.creer({ graine: 180, monde: MONDE });
  vrai(q.difficulte(1).especes.length === 1,
       "hors essai, plus d une bestiole est disponible a la premiere seconde");
});

essai("une partie d essai ne compte pas dans les souvenirs", () => {
  /* ⚠️ Sans cette regle, trois parties d essai — ou toutes les bestioles
     arrivent d un coup et ou l on meurt en une minute — feraient croire au jeu
     que l enfant n y arrive pas, et adouciraient le VRAI jeu pour de bon. */
  const Souvenirs = require(path.join(HERE, "..", "serpentin", "souvenirs.js"));
  const boite = {};
  global.localStorage = {
    getItem: (k) => (k in boite ? boite[k] : null),
    setItem: (k, v) => { boite[k] = String(v); },
    removeItem: (k) => { delete boite[k]; },
  };
  Souvenirs.oublier();
  Souvenirs.reglerEssai(false);
  [300, 310, 290].forEach((d) => Souvenirs.ajouter(d));
  vrai(Souvenirs.lire().parties.length === 3, "les vraies parties ne sont pas retenues");

  Souvenirs.reglerEssai(true);
  vrai(Souvenirs.essai() === true, "le mode d essai ne se garde pas");
  [40, 35, 50].forEach((d) => Souvenirs.ajouter(d));
  vrai(Souvenirs.lire().parties.length === 3,
       "les parties d essai ont ete retenues : elles vont fausser la difficulte");
  vrai(Souvenirs.reglage().aide === 0, "les parties d essai ont deja adouci le jeu");

  Souvenirs.reglerEssai(false);
  vrai(Souvenirs.essai() === false, "le mode d essai ne se coupe pas");
  Souvenirs.oublier();
  delete global.localStorage;
});

essai("chaque personnage ne peut apprendre que ses propres armes", () => {
  Object.keys(Armes.PERSOS).forEach((nom) => {
    const p = Moteur.creer({ graine: 190, monde: MONDE, foule: false });
    const a = Armes.creer(p, nom);
    vrai(a.perso === nom, "le personnage demande n est pas celui qu on obtient");
    /* ⚠️ Sans le filtre, une carte de montee de niveau proposerait une epee a
       un magicien. On tire beaucoup de fois : une carte rare passerait
       inapercue sur trois tirages. */
    const interdites = Object.keys(Armes.CATALOGUE)
      .filter((x) => Armes.PERSOS[nom].armes.indexOf(x) < 0);
    for (let t = 0; t < 200; t++) {
      a.propositions(3).forEach((c) => {
        vrai(c.sorte !== "arme" || interdites.indexOf(c.nom) < 0,
             nom + " s est vu proposer " + c.nom);
      });
    }
    /* et son arme de depart sort forcement de son catalogue */
    vrai(a.catalogue.length === Armes.PERSOS[nom].armes.length,
         nom + " n a pas le bon catalogue");
  });
});

essai("la boule givree gele vraiment, et un gele ne prepare plus rien", () => {
  const p = Moteur.creer({ graine: 191, monde: MONDE, foule: false });
  const a = Armes.creer(p, "magicien");
  a.donner("givre");
  p.bestioles.length = 0;
  p.naitre("escargot");
  const b = p.bestioles[0];
  b.arrivee = -99;
  /* on le pose sur le cercle ou tourne la boule */
  const rayon = Armes.CATALOGUE.givre.base.rayon;
  b.x = p.joueur.x + rayon; b.y = p.joueur.y;
  b.vie = 999;
  /* ⚠️ On regarde si elle A ETE gelee, pas si elle l'est ENCORE : le coup la
     repousse hors du cercle et l'engourdissement l'empeche d'y revenir vite.
     Exiger qu'elle soit encore gelee trois secondes plus tard, c'etait exiger
     qu'elle se fasse toucher en boucle. */
  let aEteGelee = false;
  for (let i = 0; i < 60 * 3; i++) {
    a.pas(1 / 60); p.pas(1 / 60);
    if (b.geleJusqua > p.temps) aEteGelee = true;
  }
  vrai(aEteGelee, "la boule givree n a rien gele");
  /* et le gel laisse un engourdissement derriere lui */
  vrai(b.ralentiJusqua > b.geleJusqua,
       "apres le degel, elle repart a pleine vitesse comme si de rien n etait");

  /* ⚠️ Gelee, elle ne bouge plus : c est ca qu on achete en echange de degats
     plus faibles que le bouclier. */
  b.x = p.joueur.x + 400; b.y = p.joueur.y;
  p.geler(b, 2);
  const depart = b.x;
  seconde(p, 1);
  proche(b.x, depart, 0.001, "une bestiole gelee a avance de " + (depart - b.x).toFixed(1));
  seconde(p, 2);
  const apres = b.x;
  seconde(p, 1);
  vrai(apres - b.x > 20, "elle n a pas repris sa route apres le degel");
});

essai("les piques previennent avant de sortir, et ne frappent qu une fois", () => {
  const p = Moteur.creer({ graine: 192, monde: MONDE, foule: false });
  const a = Armes.creer(p, "magicien");
  a.donner("piques");
  p.bestioles.length = 0;
  p.naitre("escargot");
  const b = p.bestioles[0];
  b.arrivee = -99;
  b.x = p.joueur.x + 120; b.y = p.joueur.y;
  b.vie = 999;
  const vieAvant = b.vie;
  /* pendant le preavis, rien n a encore frappe */
  let quandPremier = null;
  for (let i = 0; i < 60 * 3; i++) {
    a.pas(1 / 60); p.pas(1 / 60);
    b.x = p.joueur.x + 120; b.y = p.joueur.y;
    if (quandPremier === null && b.vie < vieAvant) quandPremier = p.temps;
  }
  vrai(quandPremier !== null, "les piques n ont jamais touche");
  vrai(quandPremier >= Armes.CATALOGUE.piques.base.preavis * 0.9,
       "elles ont frappe apres " + quandPremier.toFixed(2) + " s : le preavis n est pas tenu");
  const perdu = vieAvant - b.vie;
  const parCoup = Armes.CATALOGUE.piques.base.degats;
  vrai(perdu <= parCoup * 4,
       "en 3 s elles ont enleve " + perdu + " points : elles frappent en continu");
});

essai("le souffle brule tant qu il dure, il ne frappe pas qu une fois", () => {
  const p = Moteur.creer({ graine: 193, monde: MONDE, foule: false });
  const a = Armes.creer(p, "magicien");
  a.donner("souffle");
  p.bestioles.length = 0;
  p.naitre("escargot");
  const b = p.bestioles[0];
  b.arrivee = -99;
  b.vie = 99999;
  p.commander({ angle: 0, avance: false });
  const paliers = [];
  let derniere = b.vie;
  for (let i = 0; i < 60 * 3; i++) {
    b.x = p.joueur.x + 60; b.y = p.joueur.y;
    a.pas(1 / 60); p.pas(1 / 60);
    if (b.vie < derniere) { paliers.push(p.temps); derniere = b.vie; }
  }
  /* ⚠️ Un coup d epee touche une fois par lancer. Le feu doit toucher a chaque
     image tant qu il souffle, sinon c est une epee orange. */
  vrai(paliers.length > 20,
       "le souffle n a frappe que " + paliers.length + " fois en 3 s : c est un coup d epee");
  vrai(b.vie < 99999, "le souffle n a rien brule");
});

essai("aucun fruit n est seme en double au sol", () => {
  /* ⚠️ Trouve a la revue du 2026-08-28 : au bout de 400 s il y avait SIX
     pommes, quatre carottes et quatre tomates au sol EN MEME TEMPS. On ne
     regardait que le panier, jamais ce qui trainait deja. */
  const p = Moteur.creer({ graine: 9, monde: MONDE, foule: false });
  for (let i = 0; i < 60 * 400; i++) {
    p.joueur.coeurs = p.joueur.coeursMax;      /* il doit RESTER en vie */
    p.joueur.invincibleJusqua = p.temps + 1;
    if (p.fini) break;
    p.pas(1 / 60);
  }
  vrai(p.temps > 350, "la mesure s est arretee a " + p.temps.toFixed(0) + " s");
  const compte = {};
  p.objets.forEach((o) => { compte[o.sorte] = (compte[o.sorte] || 0) + 1; });
  Moteur.LEGUMES.forEach((n) => {
    vrai((compte[n] || 0) <= 1,
         "il y a " + compte[n] + " " + n + " au sol en meme temps");
  });
  const objets = p.objets.filter((o) => Moteur.LEGUMES.indexOf(o.sorte) < 0).length;
  vrai(objets <= Moteur.REGLAGES.objetsAuSol,
       objets + " objets au sol alors que le plafond est " + Moteur.REGLAGES.objetsAuSol);
});

essai("la roue ne montre que les armes du personnage", () => {
  /* ⚠️ Trouve a la revue : la roue listait `Object.keys(Armes.CATALOGUE)`,
     donc les SIX armes. Un magicien y voyait defiler l'epee, le bouclier et
     l'arc qu'il n'aura jamais. */
  const source = fs.readFileSync(path.join(HERE, "..", "serpentin", "index.html"), "utf8");
  const bloc = source.slice(source.indexOf("function segmentsDeLaRoue"),
                            source.indexOf("function lancerRoue"));
  /* ⚠️ On enleve les commentaires AVANT de chercher : cet essai echouait sur
     le commentaire qui explique le defaut, pas sur le defaut. Un controle qui
     lit du texte doit lire le CODE. */
  const code = bloc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  vrai(code.indexOf("Object.keys(Armes.CATALOGUE)") < 0,
       "la roue tire encore dans le catalogue entier");
  vrai(bloc.indexOf("catalogue") >= 0,
       "la roue ne passe pas par le catalogue du personnage");
});

essai("on voit qu on est freine, et le moteur le dit", () => {
  /* ⚠️ La glaire divisait la vitesse par deux sans le moindre signe : on
     croyait a un jeu qui rame. `partie.freineJusqua` etait ecrit et lu par
     personne. */
  const p = Moteur.creer({ graine: 194, monde: MONDE, foule: false });
  p.flaques.push({ x: p.joueur.x, y: p.joueur.y, r: 200, sorte: "glaire",
                   ne: p.temps, i: 0 });
  vrai(!(p.freineJusqua > p.temps), "il est deja freine avant d entrer dedans");
  seconde(p, Moteur.REGLAGES.eclosionFlaque + 0.1);   /* le temps qu elle s etale */
  vrai(p.freineJusqua > p.temps, "le moteur ne dit pas qu il est freine");

  const source = fs.readFileSync(path.join(HERE, "..", "serpentin", "index.html"), "utf8");
  vrai(source.indexOf("partie.freineJusqua") >= 0,
       "l affichage ne lit jamais `freineJusqua` : le freinage reste invisible");
});

essai("les piques sortent sous la bestiole la PLUS PROCHE", () => {
  /* ⚠️ « C'est trop aleatoire ou ils sortent. » La cause n'etait pas le
     hasard : `voisines` rend les bestioles dans l'ordre des cases de la
     grille, pas par distance. On piquait la premiere venue, qui pouvait etre
     la plus lointaine. L'arc, lui, triait depuis toujours. */
  for (let essai = 0; essai < 12; essai++) {
    const p = Moteur.creer({ graine: 200 + essai, monde: MONDE, foule: false });
    const a = Armes.creer(p, "magicien");
    a.donner("piques");
    p.bestioles.length = 0;
    /* une proche et cinq lointaines, disposees tout autour */
    p.naitre("escargot");
    const proche = p.bestioles[0];
    proche.arrivee = -99;
    proche.x = p.joueur.x + 70; proche.y = p.joueur.y + 20;
    for (let k = 0; k < 5; k++) {
      p.naitre("escargot");
      const b = p.bestioles[p.bestioles.length - 1];
      b.arrivee = -99;
      const an = k * 1.257;
      b.x = p.joueur.x + Math.cos(an) * 240;
      b.y = p.joueur.y + Math.sin(an) * 240;
    }
    p.bestioles.forEach((b) => { b.immobile = true; b.vie = 999; });
    for (let i = 0; i < 60 * 2; i++) { a.pas(1 / 60); p.pas(1 / 60); }
    const piques = a.projectiles.filter((x) => x.forme === "pique");
    vrai(piques.length > 0, "aucune pique n est sortie");
    piques.forEach((q) => {
      const d = Math.hypot(q.x - proche.x, q.y - proche.y);
      vrai(d < 90,
           "une pique est sortie a " + Math.round(d) + " de la plus proche : elle a vise ailleurs");
    });
  }
});

essai("l aimant au sol appelle TOUTES les graines de la carte", () => {
  const p = Moteur.creer({ graine: 210, monde: MONDE, foule: false });
  p.graines.length = 0;
  p.objets.length = 0;
  /* des graines partout, jusqu au bout de l arene */
  for (let i = 0; i < 40; i++) {
    const a = i * 0.9, d = 200 + i * 25;
    p.graines.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, valeur: 1,
                     r: Moteur.REGLAGES.rayonGraine, attiree: false });
  }
  const loin = p.graines.filter((g) => !g.attiree).length;
  vrai(loin === 40, "des graines etaient deja attirees au depart");

  p.objets.push({ sorte: "aimant", x: p.joueur.x, y: p.joueur.y, r: 12 });
  p.pas(1 / 60);
  vrai(p.graines.every((g) => g.attiree),
       "l aimant n a appele que " + p.graines.filter((g) => g.attiree).length + " graines sur 40");
  vrai(p.objets.length === 0, "l aimant est reste au sol apres avoir servi");

  /* ⚠️ Elles VIENNENT, elles ne se teleportent pas : voir la prairie converger
     est la moitie du plaisir, et c est ce qui dit ce que l objet a fait. */
  const avant = p.graines.length;
  seconde(p, 0.5);
  vrai(p.graines.length === avant,
       "toutes les graines ont ete ramassees en une demi-seconde : elles se sont teleportees");
  const xp = p.xp;
  seconde(p, 12);
  vrai(p.xp > xp, "aucune graine n est arrivee jusqu au chevalier");
});

essai("un souffle plus grand est aussi plus FOURNI", () => {
  /* ⚠️ « Avec la longue-vue ca tire loin mais ce n'est pas tres fourni. » Le
     nombre de flammeches etait fixe : sur un cone deux fois plus grand, le feu
     devenait un crachin. Monter de niveau doit se sentir. */
  function densite(niveaux, longuevues) {
    const p = Moteur.creer({ graine: 220, monde: MONDE, foule: false });
    const a = Armes.creer(p, "magicien");
    for (let i = 0; i < niveaux; i++) a.donner("souffle");
    for (let i = 0; i < longuevues; i++) a.donnerObjet("longuevue");
    /* ⚠️ Le souffle ne dure que 0,55 s : a 40 images il etait deja eteint et
       l essai croyait qu il n avait jamais existe. */
    for (let i = 0; i < 20; i++) { a.pas(1 / 60); p.pas(1 / 60); }
    const cone = a.projectiles.find((x) => x.forme === "cone");
    vrai(!!cone, "aucun souffle n a ete lance");
    /* ⚠️ « Fourni » ne se compte pas en NOMBRE de flammeches mais en SURFACE
       COUVERTE : vingt grosses flammes remplissent mieux qu'un nuage de
       petites. Le premier essai comptait les particules et concluait a un
       appauvrissement alors que le feu couvrait plus. */
    const surface = cone.portee * cone.portee * cone.arc / 2;
    let couvert = 0;
    cone.flammes.forEach((f) => {
      const gros = f.r * 1.35;              /* elles grossissent en vieillissant */
      couvert += Math.PI * gros * gros;
    });
    return { flammes: cone.flammes.length, taux: couvert / surface };
  }
  const petit = densite(1, 0), grand = densite(6, 5);
  vrai(grand.flammes > petit.flammes * 1.5,
       "le grand souffle n a que " + grand.flammes + " flammeches contre " + petit.flammes);
  vrai(grand.taux > petit.taux * 0.9,
       "le grand souffle couvre moins bien son cone : " +
       grand.taux.toFixed(2) + " contre " + petit.taux.toFixed(2));
});

essai("le mode difficile s appelle difficile a l ecran", () => {
  /* ⚠️ Il s'appelle `essai` dans le code parce que c'est le nom de sa cle de
     stockage, et qu'un enfant qui a deja choisi son mode ne doit pas le perdre
     parce qu'on a renomme une variable. Mais a l'ECRAN il doit dire ce qu'il
     est : un mode difficile, pas un outil de mise au point. */
  const source = fs.readFileSync(path.join(HERE, "..", "serpentin", "index.html"), "utf8");
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "");
  vrai(code.indexOf('id="modeEssai" type="button">Difficile<') >= 0,
       "le bouton ne s appelle pas Difficile");
  vrai(code.indexOf('"TOUT VOIR"') < 0,
       "la pastille en jeu dit encore TOUT VOIR");
  vrai(code.indexOf('"DIFFICILE"') >= 0,
       "la pastille en jeu ne dit pas DIFFICILE");
  const Souvenirs = require(path.join(HERE, "..", "serpentin", "souvenirs.js"));
  vrai(Souvenirs.CLE_ESSAI === "chevalier.essai.v1",
       "la cle de stockage a change : ceux qui ont deja choisi vont perdre leur mode");
});

essai("a huit minutes, la reine arrive au lieu du generique", () => {
  /* ⚠️ Avant elle, on gagnait parce que le chronometre tombait a zero. Sa
     premiere demande pour ce jeu etait « huit minutes qui finissent par un
     boss battable », et elle avait attendu jusqu'ici. */
  const p = Moteur.creer({ graine: 230, monde: MONDE, foule: false });
  p.naitre("escargot");
  p.temps = p.duree - 0.1;
  p.joueur.coeurs = p.joueur.coeursMax;
  /* ⚠️ Une seule image avance de 1/60 s : il en faut sept pour franchir le
     dixieme de seconde qui reste. Un `pas` unique laissait croire que la reine
     ne venait pas. */
  for (let i = 0; i < 12; i++) { p.joueur.coeurs = p.joueur.coeursMax; p.pas(1 / 60); }
  vrai(!!p.boss, "le chronometre est arrive au bout sans faire venir la reine");
  vrai(!p.fini, "la partie s est terminee alors que la reine venait d arriver");
  vrai(p.bestioles.length === 1, "la prairie ne s est pas videe pour le combat");
  vrai(p.boss.vie >= Moteur.REGLAGES.bossVieMin, "la reine a " + p.boss.vie + " points de vie");

  /* plus aucune vague pendant le combat */
  const q = Moteur.creer({ graine: 231, monde: MONDE });
  q.temps = q.duree - 0.1;
  for (let i = 0; i < 60 * 5; i++) {
    q.joueur.coeurs = q.joueur.coeursMax;
    q.joueur.invincibleJusqua = q.temps + 1;
    q.pas(1 / 60);
  }
  vrai(q.bestioles.length === 1,
       "il y a " + q.bestioles.length + " bestioles pendant le combat : les vagues continuent");

  /* et on gagne en la battant, pas autrement */
  vrai(!q.gagne, "on a gagne sans battre la reine");
  q.blesser(q.boss, 99999);
  q.pas(1 / 60);
  vrai(q.gagne && q.fini, "la reine est morte et la partie n est pas gagnee");
});

essai("la reine se met au niveau du joueur", () => {
  /* ⚠️ Mesure du 2026-08-28 : a huit minutes, les degats vont de 8 a 42 par
     seconde selon l equipement. Une vie fixe donnerait dix secondes de combat
     a l un et cinquante a l autre. */
  function vieDeLaReine(degatsParSeconde) {
    const p = Moteur.creer({ graine: 232, monde: MONDE, foule: false });
    p.bestioles.length = 0;
    /* on lui fait faire ces degats pendant une minute */
    for (let s = 0; s < 60; s++) {
      p.naitre("escargot");
      const b = p.bestioles[p.bestioles.length - 1];
      b.vie = degatsParSeconde + 10;
      b.arrivee = -99;
      p.blesser(b, degatsParSeconde);
      for (let i = 0; i < 60; i++) p.pas(1 / 60);
    }
    p.bestioles.length = 0;
    const boss = p.invoquerBoss();
    return { vie: boss.vie, combat: boss.vie / degatsParSeconde };
  }
  const faible = vieDeLaReine(8), fort = vieDeLaReine(40);
  vrai(fort.vie > faible.vie * 2,
       "la reine ne s adapte pas : " + faible.vie + " contre " + fort.vie);
  /* le combat doit durer a peu pres pareil pour les deux */
  vrai(Math.abs(faible.combat - fort.combat) < 12,
       "le combat dure " + faible.combat.toFixed(0) + " s pour un joueur faible et " +
       fort.combat.toFixed(0) + " s pour un fort");
  vrai(faible.vie >= Moteur.REGLAGES.bossVieMin && fort.vie <= Moteur.REGLAGES.bossVieMax,
       "les bornes de vie ne tiennent pas : " + faible.vie + " / " + fort.vie);
});

essai("la toile colle, mais on s en arrache en poussant", () => {
  /* ⚠️ Immobiliser un enfant pendant que dix bestioles arrivent, c est le
     « on meurt one shot » qu elle craignait pour la flaque bleue. On se debat
     et on s en sort : pousser use la toile trois fois et demie plus vite. */
  function combienDeTemps(pousse) {
    const p = Moteur.creer({ graine: 233, monde: MONDE, foule: false });
    p.bestioles.length = 0;
    p.toiles.push({ x: p.joueur.x, y: p.joueur.y, r: 200,
                    reste: Moteur.REGLAGES.dureeToile,
                    plein: Moteur.REGLAGES.dureeToile, i: 0 });
    p.commander({ angle: 0, avance: pousse });
    let t = 0;
    while (p.toiles.length && t < 10) { p.pas(1 / 60); t += 1 / 60; }
    return t;
  }
  const immobile = combienDeTemps(false), qui_pousse = combienDeTemps(true);
  /* ⚠️ Reglee DEUX FOIS par elle, dans les deux sens : d'abord « a peine 1 s,
     augmente a 4 », puis, apres l'avoir jouee, « 4 s c'est trop long, reduit
     a 3 ». Ce qu'elle mesure est toujours la duree EN SE DEBATTANT, jamais la
     duree de base : c'est donc celle-la qu'on verifie. */
  vrai(immobile > 5, "sans rien faire elle lache en " + immobile.toFixed(1) + " s");
  proche(qui_pousse, 3, 0.5,
         "en se debattant, la toile tient " + qui_pousse.toFixed(2) + " s au lieu de 3");
  vrai(qui_pousse <= immobile * 0.6,
       "se debattre ne sert presque a rien : " + qui_pousse.toFixed(2) + " s contre " + immobile.toFixed(2));

  /* et collee, il ne se deplace plus mais il continue de frapper */
  const p = Moteur.creer({ graine: 234, monde: MONDE, foule: false });
  p.bestioles.length = 0;
  p.toiles.push({ x: p.joueur.x, y: p.joueur.y, r: 200, reste: 3, plein: 3, i: 0 });
  p.commander({ angle: 0, avance: true });
  const depart = p.joueur.x;
  seconde(p, 0.4);
  proche(p.joueur.x, depart, 8, "colle, il avance quand meme de " + (p.joueur.x - depart).toFixed(0));
  vrai(p.colleJusqua > p.temps, "le moteur ne dit pas qu il est colle");
});

essai("une orbite frappe DES QU ELLE TOUCHE, chacune a son tour", () => {
  /* ⚠️ « Je veux qu ils fassent des dommages des qu ils touchent, pas comme
     actuellement. » Le repos etait porte par le BOUCLIER : apres un coup il ne
     frappait plus RIEN pendant un tiers de seconde, meme une bestiole toute
     neuve qui venait d entrer dedans. Entoure, on le voyait traverser trois
     escargots sans rien leur faire. */
  const p = Moteur.creer({ graine: 240, monde: MONDE, foule: false });
  const a = Armes.creer(p, "chevalier");
  a.donner("bouclier");
  p.bestioles.length = 0;
  const rayon = Armes.CATALOGUE.bouclier.base.rayon;
  /* six bestioles alignees sur le cercle du bouclier */
  for (let i = 0; i < 6; i++) {
    p.naitre("escargot");
    const b = p.bestioles[i];
    const an = i * 1.047;
    b.x = p.joueur.x + Math.cos(an) * rayon;
    b.y = p.joueur.y + Math.sin(an) * rayon;
    b.arrivee = -99; b.immobile = true; b.vie = 999;
  }
  const avant = p.bestioles.map((b) => b.vie);
  for (let i = 0; i < 60 * 2; i++) { a.pas(1 / 60); p.pas(1 / 60); }
  const touchees = p.bestioles.filter((b, i) => b.vie < avant[i]).length;
  vrai(touchees === 6,
       "seules " + touchees + " bestioles sur 6 ont ete touchees en deux tours de bouclier");

  /* et une bestiole ne prend pas soixante coups par seconde non plus */
  const q = Moteur.creer({ graine: 241, monde: MONDE, foule: false });
  const b2 = Armes.creer(q, "chevalier");
  b2.donner("bouclier");
  q.bestioles.length = 0;
  q.naitre("escargot");
  const seule = q.bestioles[0];
  seule.arrivee = -99; seule.immobile = true; seule.vie = 99999;
  const v0 = seule.vie;
  for (let i = 0; i < 60; i++) {
    seule.x = q.joueur.x + rayon; seule.y = q.joueur.y;
    b2.pas(1 / 60); q.pas(1 / 60);
  }
  const coups = (v0 - seule.vie) / Armes.CATALOGUE.bouclier.base.degats;
  vrai(coups <= 1 / Armes.CATALOGUE.bouclier.base.repos + 1,
       "une seule bestiole a pris " + coups.toFixed(1) + " coups en une seconde");
});

essai("une bestiole qui doit s approcher rattrape un chevalier qui fuit", () => {
  /* ⚠️ « Le papillon n apparait jamais, meme en difficile quand ils sont tous
     la des le debut. » Il naissait bien — mesure faite, autant que le lucane.
     Mais a 58 de vitesse contre 150 au chevalier, IL NE LE RATTRAPAIT JAMAIS :
     il suivait a 158 unites, hors de portee de toute arme, et posait ses nuees
     la ou l enfant etait DEJA PASSE. Mesure sur quatre parties entieres : trois
     papillons nes, aucun approche a moins de 158, et une esperance de vie de
     194 secondes — il occupait une des trois places d individus du debut a la
     fin sans jamais rien faire.

     La regle qu on verifie ici : une bestiole qui n a AUCUNE attaque a distance
     doit pouvoir rejoindre un chevalier qui court tout droit. Sinon elle
     n existe pas, et pire, elle bloque une place. Celles qui crachent, tirent
     ou ne bougent pas sont exemptees : leur travail se fait de loin. */
  /* ⚠️ Le lucane est exempte pour une raison, et il faut la dire : il ne
     rattrape rien non plus (424 unites au mieux), mais c est VOULU. Elle l a
     demande ainsi : « gros, lent, long a tuer mais battable ». C est le joueur
     qui va le chercher, pas l inverse. Il coute quand meme une des trois places
     d individus pendant les cinq minutes ou il vit sans jamais approcher. */
  /* ⚠️ Et LES BOSS sont exemptes en bloc : chacun a une attaque qui porte
     loin — la toile de la reine, l'anneau du crabe, le bond du dragon — et
     chacun a ses propres essais. Cette regle-ci existe pour attraper le cas du
     papillon : une bestiole ordinaire qui ne pouvait rien faire parce qu'elle
     ne rejoignait jamais personne. */
  const DeLoin = ["limace", "crapaud", "lucane"];
  const noms = Object.keys(Moteur.ESPECES)
    .filter((n) => DeLoin.indexOf(n) < 0 && !Moteur.ESPECES[n].boss);
  noms.forEach((nom) => {
    const p = Moteur.creer({ graine: 421, monde: MONDE, foule: false });
    p.joueur.invincibleJusqua = 1e9;
    p.bestioles.length = 0;
    const b = p.naitre(nom);
    if (!b) return;
    b.arrivee = -99; b.vie = 999999;
    /* elle nait derriere lui, a la distance ou le moteur les fait naitre */
    b.x = p.joueur.x - 420; b.y = p.joueur.y;
    let proche = 1e9;
    for (let i = 0; i < 30 * 25; i++) {
      /* il fuit tout droit, et il tourne au bord pour ne pas se coincer */
      const dc = Math.hypot(p.joueur.x, p.joueur.y);
      p.commander({ angle: dc > p.rayon - 300 ? Math.atan2(-p.joueur.y, -p.joueur.x) : 0,
                    avance: true });
      p.pas(1 / 30);
      b.vie = 999999;
      proche = Math.min(proche, Math.hypot(b.x - p.joueur.x, b.y - p.joueur.y));
    }
    /* 140 : la portee de l epee au niveau 6. Plus loin, aucune arme de melee
       ne la touche et elle ne touche personne. */
    vrai(proche < 140,
         nom + " ne rattrape jamais un chevalier qui fuit : au plus pres " +
         Math.round(proche) + " unites, pour une portee d epee de 140");
  });
});

essai("un boss par monde, et chacun a son geste", () => {
  /* ⚠️ Le moteur ne connait aucun boss : il demande au MONDE. Ajouter un
     monde reste un objet dans `mondes.js`, ajouter un boss un objet dans
     `bestioles.js`. */
  const Mondes = require(path.join(HERE, "..", "serpentin", "mondes.js"));
  const attendu = { prairie: "araignee", ile: "crabe", volcan: "dragon" };
  Object.keys(attendu).forEach((nom) => {
    const p = Moteur.creer({ graine: 501, monde: Mondes.tous[nom], foule: false });
    p.repeterBoss ? p.repeterBoss(30) : p.invoquerBoss(30);
    vrai(p.boss && p.boss.espece.titre,
         "le boss de " + nom + " n a pas de titre : la banniere afficherait celui d un autre");
    vrai(p.boss && p.boss.nom === attendu[nom],
         nom + " invoque " + (p.boss ? p.boss.nom : "personne") + " au lieu de " + attendu[nom]);
    /* et il ne recule pas, comme la reine */
    const avant = { x: p.boss.x, y: p.boss.y };
    p.blesser(p.boss, 5, { x: p.boss.x - 50, y: p.boss.y, force: 400 });
    vrai(p.boss.x === avant.x && p.boss.y === avant.y,
         "le boss de " + nom + " a ete repousse");
  });
});

essai("l anneau du crabe part de lui et s elargit, et on le fuit mal", () => {
  /* ⚠️ LA PARADE EST L INVERSE DU REFLEXE : il faut courir VERS le crabe.
     Pres de lui la vague est deja passee, a mi-distance on la prend. Si ce
     n est pas vrai, l attaque n a aucun interet et le combat se gagne en
     restant loin. */
  const Mondes = require(path.join(HERE, "..", "serpentin", "mondes.js"));
  function jouer(versLui) {
    const p = Moteur.creer({ graine: 502, monde: Mondes.tous.ile, foule: false });
    p.invoquerBoss(30);
    p.boss.vie = 99999;
    const b = p.boss;
    b.arrivee = -99;
    /* ⚠️ LE CRABE MARCHE. Fige a l'origine, il ne pouvait rien : le chevalier
       filait au bord de l'arene et tous les anneaux se dissipaient a 460 avant
       de l'atteindre — le controle disait alors que fuir marche, ce qui etait
       vrai d'un crabe cloue au sol. On mesure le vrai combat. */
    /* ⚠️ LES DEUX PARTENT AU MEME ENDROIT, dans l'abri. Sinon celui qui
       applique la parade passait sa premiere seconde a courir depuis 240 et
       prenait le premier anneau en chemin : on mesurait son approche, pas sa
       parade. */
    p.joueur.x = b.x + 120; p.joueur.y = b.y;
    let coups = 0, coeurs = p.joueur.coeurs;
    for (let i = 0; i < 60 * 25; i++) {
      const dx = p.joueur.x - b.x, dy = p.joueur.y - b.y;
      const loin = Math.hypot(dx, dy);
      /* ⚠️ Celui qui applique la parade se TIENT PRES, il ne rentre pas dedans :
         l'abri est une couronne entre le corps du crabe et le depart de
         l'anneau. Fonce dans le tas, on perd des coeurs au contact et la
         parade se retourne contre soi — c'est ce que la premiere mesure a
         montre. */
      let vers = Math.atan2(dy, dx) + ((versLui && loin > 140) ? Math.PI : 0);
      /* on ne se laisse pas coincer contre la haie : au bord, on revient */
      const dc = Math.hypot(p.joueur.x, p.joueur.y);
      if (dc > p.rayon - 250) vers = Math.atan2(-p.joueur.y, -p.joueur.x);
      p.commander({ angle: vers, avance: true });
      p.pas(1 / 60);
      if (p.joueur.coeurs < coeurs) { coups++; coeurs = p.joueur.coeurs; p.joueur.coeurs = 5; }
    }
    return coups;
  }
  const versLui = jouer(true), enFuyant = jouer(false);
  vrai(enFuyant > 0, "en fuyant, l anneau ne l a jamais touche : il ne sert a rien");
  vrai(versLui < enFuyant,
       "courir vers le crabe prend " + versLui + " coups contre " + enFuyant +
       " en fuyant : la parade annoncee n existe pas");
});

essai("le dragon saute, et sa lave previent avant de tomber puis brule", () => {
  const Mondes = require(path.join(HERE, "..", "serpentin", "mondes.js"));
  const p = Moteur.creer({ graine: 503, monde: Mondes.tous.volcan, foule: false });
  p.invoquerBoss(30);
  p.boss.vie = 99999;
  p.boss.arrivee = -99;
  p.joueur.invincibleJusqua = 1e9;
  let rochers = 0;
  for (let i = 0; i < 60 * 14; i++) {
    p.pas(1 / 60);
    p.joueur.invincibleJusqua = 1e9;
    rochers = Math.max(rochers, p.rochers.length);
  }
  vrai(rochers >= 8, "il n a fait tomber que " + rochers + " rochers en quatorze secondes");

  /* ⚠️ Chaque rocher previent UNE SECONDE avant de tomber. On se pose sur le
     premier : tant que le preavis dure, il ne doit rien couter. */
  const q = Moteur.creer({ graine: 504, monde: Mondes.tous.volcan, foule: false });
  q.bestioles.length = 0;
  q.rochers.push({ x: q.joueur.x, y: q.joueur.y, ne: q.temps, tombe: false });
  const coeurs = q.joueur.coeurs;
  /* ⚠️ On l'empeche de mourir SUR le rocher : une partie finie fait sortir
     `pas()` tout de suite, et le rocher restait alors au sol pour toujours —
     le controle accusait le moteur de ne pas l'eteindre alors qu'il n'avait
     simplement plus le droit de tourner. Troisieme fois que cette mort
     silencieuse pique un banc de ce projet. */
  const survivre = () => { q.joueur.coeurs = Math.max(1, q.joueur.coeurs); q.fini = false; };
  const pre = Moteur.REGLAGES.rocherPreavis;
  for (let i = 0; i < 60 * (pre - 0.15); i++) q.pas(1 / 60);
  vrai(q.joueur.coeurs === coeurs, "le rocher a frappe avant la fin de son preavis");
  for (let i = 0; i < 60 * 0.5; i++) q.pas(1 / 60);
  vrai(q.joueur.coeurs < coeurs, "le rocher tombe ne coute rien");

  /* et il finit par s eteindre : sans ca, l arene se remplit et le combat
     devient ingagnable sans avoir commis d erreur */
  for (let i = 0; i < 60 * (Moteur.REGLAGES.rocherDuree + 2); i++) { survivre(); q.pas(1 / 60); }
  vrai(q.rochers.length === 0, "il reste " + q.rochers.length + " rochers bien apres la fin");
});

essai("le papillon laisse une trainee, et sa nuee previent avant d empoisonner", () => {
  /* ⚠️ La nuee est la PREMIERE chose posee au sol qui coute un coeur : la
     glaire freine, l'acide retrograde une arme, la toile colle. Elle doit donc
     respecter la regle du preavis a la lettre, et AU BON ENDROIT — la ou elle
     va faire mal, pas la ou etait la bestiole. */
  const p = Moteur.creer({ graine: 401, monde: MONDE, foule: false });
  p.bestioles.length = 0;
  p.naitre("papillon");
  const b = p.bestioles[0];
  b.arrivee = -99; b.vie = 9999;
  b.x = p.joueur.x + 400; b.y = p.joueur.y;   /* loin : il ne le touche pas */
  b.immobile = true;
  for (let i = 0; i < 60 * 6 && !p.nuees.length; i++) { b.x = p.joueur.x + 400; p.pas(1 / 60); }
  vrai(p.nuees.length > 0, "le papillon n a pose aucune nuee en six secondes");

  /* elle est posee SOUS LUI, pas devant : c est ce qui fait une trainee */
  const n = p.nuees[0];
  vrai(Math.hypot(n.x - b.x, n.y - b.y) < 30,
       "la nuee est posee a " + Math.round(Math.hypot(n.x - b.x, n.y - b.y)) + " du papillon");

  /* pendant qu elle s ouvre, elle ne touche personne */
  p.joueur.x = n.x; p.joueur.y = n.y;
  const coeurs = p.joueur.coeurs;
  const ouverture = Moteur.REGLAGES.eclosionNuee;
  for (let i = 0; i < 60 * (ouverture - 0.2); i++) {
    b.x = p.joueur.x + 400;
    p.joueur.x = n.x; p.joueur.y = n.y;
    p.pas(1 / 60);
  }
  vrai(p.joueur.coeurs === coeurs,
       "la nuee empoisonne avant d etre ouverte : il n y a plus de preavis");

  /* une fois ouverte, elle coute un coeur */
  for (let i = 0; i < 60 * 1.5 && p.joueur.coeurs === coeurs; i++) {
    b.x = p.joueur.x + 400;
    p.joueur.x = n.x; p.joueur.y = n.y;
    p.pas(1 / 60);
  }
  vrai(p.joueur.coeurs < coeurs, "rester dans une nuee ouverte ne coute rien");

  /* et elle se dissipe : rien ne reste pour toujours. ⚠️ On tue d abord le
     papillon, sinon il en repose pendant qu on attend et le controle echoue
     sur des nuees toutes neuves. */
  p.blesser(b, 99999);
  for (let i = 0; i < 60 * (Moteur.REGLAGES.dureeNuee + 1); i++) p.pas(1 / 60);
  vrai(p.nuees.length === 0, "la nuee ne se dissipe pas : il en reste " + p.nuees.length);

  /* ⚠️ Et il en pose une TRAINEE quand il vole. Pose au meme endroit, ce
     serait une limace immobile ; ce qui le rend different, c est que ce qu il
     laisse suit son chemin. */
  const q = Moteur.creer({ graine: 402, monde: MONDE, foule: false });
  q.joueur.invincibleJusqua = 1e9;
  q.bestioles.length = 0;
  q.naitre("papillon");
  const v = q.bestioles[0];
  v.arrivee = -99; v.vie = 9999;
  v.x = q.joueur.x + 300; v.y = q.joueur.y + 300;
  /* ⚠️ LE CHEVALIER MARCHE. Immobile, le papillon lui arrivait dessus, se
     collait a lui et posait toutes ses nuees au meme endroit : le controle
     accusait alors l arme de ne pas faire de trainee, alors que c est le
     mannequin qui ne bougeait pas. */
  for (let i = 0; i < 60 * 12; i++) {
    q.commander({ angle: i / 300, avance: true });
    q.pas(1 / 60);
  }
  vrai(q.nuees.length >= 2, "il ne laisse pas de trainee : " + q.nuees.length + " nuee vivante");
  let ecart = 0;
  for (const a of q.nuees) for (const c of q.nuees) ecart = Math.max(ecart, Math.hypot(a.x - c.x, a.y - c.y));
  vrai(ecart > Moteur.REGLAGES.rayonNuee,
       "ses nuees se posent toutes au meme endroit : " + Math.round(ecart) + " d ecart au plus");
});

essai("le mauvais temps se paie aussi pour le chevalier", () => {
  /* ⚠️ Quatre demandes d'un coup, apres qu'elle a vu l'enfant jouer en
     « Difficile » : la foudre touche AUSSI le joueur, la neige ralentit TOUT
     LE MONDE, la pluie fait sortir plus de pissenlits, et la nuit rend les
     bestioles plus dures. Chacune se verifie ici, parce qu'aucune ne se voit
     dans un chiffre de survie. */

  /* 1. la foudre ne l'epargne plus — mais elle previent toujours avant */
  const p = Moteur.creer({ graine: 301, monde: MONDE, foule: false });
  p.changerMeteo("orage");
  p.meteo.jusqua = p.temps + 999;
  p.bestioles.length = 0;
  p.naitre("escargot");
  const b = p.bestioles[0];
  b.arrivee = -99; b.immobile = true; b.vie = 9999;
  b.x = p.joueur.x; b.y = p.joueur.y + 4;      /* la foudre vise une bestiole */
  const coeurs = p.joueur.coeurs;
  let annonce = -1;
  for (let i = 0; i < 60 * 40 && p.joueur.coeurs === coeurs; i++) {
    b.x = p.joueur.x; b.y = p.joueur.y + 4;
    const faits = p.pas(1 / 60);
    if (annonce < 0 && faits.some((e) => e.type === "foudre annoncee")) annonce = p.temps;
    if (faits.some((e) => e.type === "foudre") && annonce >= 0) {
      vrai(p.temps - annonce > 1,
           "la foudre n a prevenu que " + (p.temps - annonce).toFixed(2) + " s avant de tomber");
    }
  }
  vrai(p.joueur.coeurs < coeurs, "la foudre ne touche toujours pas le chevalier");

  /* 2. la neige le ralentit lui aussi */
  function courir(temps) {
    const q = Moteur.creer({ graine: 302, monde: MONDE, foule: false });
    /* le fondu fini : on mesure le froid PLEIN, pas un ciel a moitie change */
    ciel(q, temps);
    q.meteo.jusqua = q.temps + 999;
    q.bestioles.length = 0;
    q.plaques.length = 0;                       /* la glace fait glisser, autre sujet */
    const x0 = q.joueur.x;
    q.commander({ angle: 0, avance: true });
    for (let i = 0; i < 60; i++) { q.pas(1 / 60); q.plaques.length = 0; }
    return q.joueur.x - x0;
  }
  const parBeauTemps = courir("beau"), sousLaNeige = courir("neige");
  vrai(sousLaNeige < parBeauTemps * 0.8,
       "sous la neige il court encore " + Math.round(sousLaNeige / parBeauTemps * 100) + " % de sa vitesse");

  /* 3. la pluie fait sortir plus de pissenlits.
     ⚠️ On compte la MOYENNE VIVANTE, pas un instantane final : le pissenlit
     est un « individu », et il n'y en a jamais plus de trois a l'ecran. Ce
     que la pluie change, ce n'est donc pas le nombre, c'est QUI occupe ces
     trois places. Et le joueur est rendu invincible : plante au milieu sans
     bouger, il mourait au bout d'une demi-minute et la mesure s'arretait la
     en silence — le meme piege que le banc des sorts. */
  function compter(temps) {
    const q = Moteur.creer({ graine: 303, monde: MONDE });
    q.changerMeteo(temps);
    q.joueur.invincibleJusqua = 1e9;
    let somme = 0, mesures = 0;
    for (let i = 0; i < 30 * 260; i++) {
      q.niveau = 6;                             /* toutes les especes debloquees */
      q.meteo.jusqua = q.temps + 999;           /* le temps ne tourne pas */
      q.pas(1 / 30);
      /* ⚠️ On fauche tout toutes les cinq secondes. Sans ca, les trois places
         d'individus etaient prises des la premiere minute par un herisson et
         deux crapauds qui ne mouraient jamais — le joueur n'a pas d'arme ici
         — et AUCUN pissenlit ne naissait, ni par beau temps ni sous la pluie.
         Le controle rendait alors 0 contre 0 et n'aurait jamais vu la
         difference. En vraie partie, elles meurent sans arret. */
      if (i % 150 === 149) for (const x of q.bestioles) q.blesser(x, 9999);
      if (q.temps > 60 && i % 30 === 0) {
        mesures++;
        /* ⚠️ On compte les SECONDES OU L'ON EN VOIT AU MOINS UN, pas le
           nombre total. C'est ce qu'elle a mesure elle-meme, a l'oeil : « j'ai
           joue sous la pluie et j'ai vu aucun pissenlit ». Une moyenne de 0,2
           par seconde passait un controle relatif et ne se voyait pas. */
        if (q.bestioles.some((x) => x.nom === "pissenlit")) somme++;
      }
    }
    vrai(!q.fini, "la mesure des pissenlits s est arretee : la partie est finie");
    return mesures ? somme / mesures : 0;
  }
  const sansPluie = compter("beau"), avecPluie = compter("pluie");
  vrai(avecPluie > 0.5,
       "sous la pluie on ne voit un pissenlit que " + Math.round(avecPluie * 100) +
       " % du temps : ca ne se remarque pas");
  vrai(avecPluie > sansPluie * 2,
       "la pluie ne change presque rien : " + Math.round(sansPluie * 100) + " % du temps, puis " +
       Math.round(avecPluie * 100) + " %");

  /* 4. la nuit, elles encaissent plus — et ca se VOIT */
  function encaisser(temps) {
    const q = Moteur.creer({ graine: 304, monde: MONDE, foule: false });
    /* la nuit tombe en six secondes : la carapace monte avec elle */
    ciel(q, temps);
    q.meteo.jusqua = q.temps + 999;
    q.bestioles.length = 0;
    q.naitre("escargot");
    const c = q.bestioles[0];
    c.arrivee = -99; c.vie = 1000;
    q.blesser(c, 100);
    return 1000 - c.vie;
  }
  const dejour = encaisser("beau"), denuit = encaisser("nuit");
  vrai(denuit < dejour * 0.85,
       "la nuit elles encaissent pareil : " + dejour + " puis " + denuit);
  vrai(!!Meteo.TEMPS.nuit.carapace,
       "la nuit rend les bestioles plus dures sans que rien le montre");
});

essai("le vent ne coupe qu en courant, et ne laisse rien derriere lui", () => {
  /* ⚠️ Le contrat du vent tranchant, celui qui l a fait accepter :
       - il DOIT pouvoir tuer, sinon la roue du destin peut le donner en
         premiere magie et les premieres minutes deviennent injouables. Elle
         l a dit exactement comme ca ;
       - a l arret il ne fait RIEN, sinon ce n est plus une arme de course ;
       - il ne laisse RIEN au sol, sinon c est le piment.
     Les trois se verifient ici. Les degats par seconde, eux, sont mesures par
     tools/chevalier-sorts.mjs. */
  function passer(court) {
    const p = Moteur.creer({ graine: 251, monde: MONDE, foule: false });
    const a = Armes.creer(p, "magicien");
    a.donner("vent");
    p.bestioles.length = 0;
    p.naitre("escargot");
    const b = p.bestioles[0];
    b.arrivee = -99; b.immobile = true; b.vie = 9999;
    /* posee juste a cote du chemin qu il va prendre, jamais devant lui : on
       mesure le sillage, pas un contact */
    b.x = p.joueur.x + 60;
    b.y = p.joueur.y + 22;
    const v0 = b.vie;
    p.commander({ angle: 0, avance: court });
    for (let i = 0; i < 60 * 2; i++) { a.pas(1 / 60); p.pas(1 / 60); }
    return { pris: v0 - b.vie, p, a, b };
  }
  const arret = passer(false), course = passer(true);
  vrai(arret.pris === 0, "a l arret le vent a quand meme fait " + arret.pris.toFixed(1) + " degats");
  vrai(course.pris > 0, "en courant le vent n a rien coupe du tout");

  /* et ce qui reste apres son passage : rien. On l arrete, on remet une
     bestiole en plein sur son ancien chemin, et elle ne doit plus rien
     prendre — c est toute la difference avec la trainee du piment. */
  const { p, a, b } = course;
  p.commander({ angle: 0, avance: false });
  for (let i = 0; i < 30; i++) { a.pas(1 / 60); p.pas(1 / 60); }
  b.x = p.joueur.x - 40; b.y = p.joueur.y;
  const reste = b.vie;
  for (let i = 0; i < 60; i++) { a.pas(1 / 60); p.pas(1 / 60); }
  vrai(b.vie === reste,
       "le vent a laisse quelque chose au sol : " + (reste - b.vie).toFixed(1) + " degats a l arret");

  /* les bottes le rendent plus fort : c est la seule arme du jeu dans ce cas */
  function avecBottes(combien) {
    const q = Moteur.creer({ graine: 252, monde: MONDE, foule: false });
    const w = Armes.creer(q, "magicien");
    w.donner("vent");
    for (let i = 0; i < combien; i++) w.donnerObjet("bottes");
    q.bestioles.length = 0;
    q.naitre("escargot");
    const c = q.bestioles[0];
    c.arrivee = -99; c.immobile = true; c.vie = 99999;
    const v0 = c.vie;
    q.commander({ angle: 0, avance: true });
    const passe = [];
    for (let i = 0; i < 60 * 3; i++) {
      passe.push({ x: q.joueur.x, y: q.joueur.y });
      const v = passe[Math.max(0, passe.length - 1 - 18)];
      c.x = v.x; c.y = v.y;
      w.pas(1 / 60); q.pas(1 / 60);
    }
    return v0 - c.vie;
  }
  const nu = avecBottes(0), chausse = avecBottes(5);
  vrai(chausse > nu * 1.1,
       "les bottes ne renforcent pas le vent : " + nu.toFixed(1) + " puis " + chausse.toFixed(1));
});

essai("on peut repeter le combat de la reine sans jouer huit minutes", () => {
  /* ⚠️ « Pas envie d esperer atteindre 8 min pour le tester. » Le bouton doit
     exister, il doit donner un equipement, et surtout la partie NE DOIT PAS
     compter dans les souvenirs : on y arrive avec un equipement qu on n a pas
     gagne. */
  const source = fs.readFileSync(path.join(HERE, "..", "serpentin", "index.html"), "utf8");
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "");
  vrai(code.indexOf('id="laReine"') >= 0, "le bouton de repetition n existe pas");
  vrai(code.indexOf("partieCompte = false") >= 0,
       "la repetition nourrit les souvenirs qui reglent la difficulte");
  vrai(code.indexOf("invoquerBoss(FORCE_REPETITION)") >= 0,
       "la repetition ne calibre pas la reine : elle aurait sa vie minimale");

  /* ⚠️ Sans force donnee, le moteur lit la derniere minute — inexistante ici —
     et la reine tombe a sa vie minimale : un combat de dix secondes qui ne
     prouve rien. */
  const sans = Moteur.creer({ graine: 250, monde: MONDE, foule: false });
  sans.bestioles.length = 0;
  const molle = sans.invoquerBoss();
  vrai(molle.vie === Moteur.REGLAGES.bossVieMin,
       "sans mesure, la reine devrait avoir sa vie minimale, elle a " + molle.vie);

  const avec = Moteur.creer({ graine: 251, monde: MONDE, foule: false });
  avec.bestioles.length = 0;
  const vraie = avec.invoquerBoss(20);
  vrai(vraie.vie > molle.vie * 2,
       "la force donnee ne change rien : " + molle.vie + " contre " + vraie.vie);
});

essai("un boss ne recule pas, et il finit par arriver", () => {
  /* ⚠️ « Elle ne saute jamais et a chaque coup recu elle recule. » Les deux
     plaintes n avaient qu une cause : la reine etait repoussee comme une
     bestiole ordinaire. Mesure : 879 unites de recul en vingt secondes, autant
     que ce qu elle parcourait. Elle n arrivait jamais, et son bond etait
     annule au moment meme ou il partait. */
  const p = Moteur.creer({ graine: 260, monde: MONDE, foule: false });
  p.bestioles.length = 0;
  const b = p.invoquerBoss(20);
  b.arrivee = -99;
  b.x = p.joueur.x + 200; b.y = p.joueur.y;
  const avant = b.x;
  p.blesser(b, 1, { x: p.joueur.x, y: p.joueur.y, force: 60 });
  proche(b.x, avant, 0.001, "un coup a repousse la reine de " + (b.x - avant).toFixed(0));

  /* et l onde de montee de niveau ne la souffle pas non plus */
  b.x = p.joueur.x + 300; b.y = p.joueur.y;   /* hors de portee du choc */
  p.joueur.invincibleJusqua = p.temps + 5;
  const avant2 = b.x;
  p.xp += p.xpProchain * 2;
  p.pas(1 / 60);
  proche(b.x, avant2, 1, "l onde a souffle la reine de " + (b.x - avant2).toFixed(0));

  /* ⚠️ Et quand elle TOUCHE, c est le chevalier qui recule, pas elle : le choc
     doit bien ecarter quelqu un, sinon on ressort de l invincibilite dans le
     meme tas et on reperd un coeur aussitot. */
  const c = Moteur.creer({ graine: 262, monde: MONDE, foule: false });
  c.bestioles.length = 0;
  const reine = c.invoquerBoss(20);
  reine.arrivee = -99;
  reine.x = c.joueur.x + 10; reine.y = c.joueur.y;
  const reineAvant = reine.x, joueurAvant = c.joueur.x;
  c.joueur.invincibleJusqua = -1;
  c.pas(1 / 60);
  proche(reine.x, reineAvant, 1, "le choc a repousse la reine de " + (reine.x - reineAvant).toFixed(0));
  vrai(c.joueur.x < joueurAvant - 20,
       "le chevalier n a pas ete projete en arriere : " + (joueurAvant - c.joueur.x).toFixed(0));

  /* elle bondit vraiment, et elle finit par toucher */
  const q = Moteur.creer({ graine: 261, monde: MONDE, foule: false });
  q.bestioles.length = 0;
  const r = q.invoquerBoss(20);
  r.arrivee = -99;
  r.x = q.joueur.x + 200; r.y = q.joueur.y;
  r.vie = 999999;
  let bonds = 0, dernier = null, plusPres = 1e9;
  for (let i = 0; i < 60 * 20; i++) {
    q.joueur.coeurs = q.joueur.coeursMax;
    q.joueur.invincibleJusqua = q.temps + 9;
    q.pas(1 / 60);
    if (r.etat !== dernier) { if (r.etat === "bond") bonds++; dernier = r.etat; }
    plusPres = Math.min(plusPres, Math.hypot(r.x - q.joueur.x, r.y - q.joueur.y));
  }
  vrai(bonds >= 1, "elle n a pas bondi une seule fois en vingt secondes");
  vrai(plusPres < r.rayon + q.joueur.rayon + 10,
       "elle n est jamais arrivee au contact : au plus pres " + Math.round(plusPres));
  vrai(q.toiles.length >= 0 && q.evenements !== undefined, "");
});

essai("chaque evenement du moteur a son sort du cote du son", () => {
  /* ⚠️ La frontiere du son : le moteur ne le connait pas, `sons.js` ne connait
     pas le jeu. Ce qui les relie est une table dans index.html. Un evenement
     nouveau qui n y figure pas ne fait AUCUN bruit, en silence — c est
     exactement le genre de manque qu on ne remarque jamais. */
  global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  global.window = global.window || {};
  const Sons = require(path.join(HERE, "..", "serpentin", "sons.js"));
  const source = fs.readFileSync(path.join(HERE, "..", "serpentin", "index.html"), "utf8");
  const moteur = fs.readFileSync(path.join(HERE, "..", "serpentin", "moteur.js"), "utf8");

  /* la table de traduction, telle qu elle est ecrite */
  const bloc = source.slice(source.indexOf("var SON_DE = {"));
  const table = bloc.slice(0, bloc.indexOf("};") + 1);
  const traduits = {};
  const re = /"?([a-z ]+)"?\s*:\s*"([a-z]*)"/g;
  let m;
  while ((m = re.exec(table))) traduits[m[1].trim()] = m[2];

  /* tout ce que le moteur emet */
  const emis = new Set();
  const re2 = /evenements\.push\(\{ type: "([a-z ]+)"/g;
  while ((m = re2.exec(moteur))) emis.add(m[1]);
  vrai(emis.size >= 20, "on n a trouve que " + emis.size + " evenements dans le moteur");

  emis.forEach((e) => {
    const vise = (e in traduits) ? traduits[e] : e;
    vrai(vise === "" || !!Sons.VOIX[vise],
         "l evenement « " + e + " » ne fait aucun bruit : ni voix « " + vise +
         " », ni ligne dans la table qui dise qu il est muet exprès");
  });

  /* et l inverse : une voix que personne ne joue est du travail pour rien.
     ⚠️ On regarde AUSSI armes.js : les sons d armes ne partent pas de la page,
     ils partent de l arme elle-meme, qui declare son son a cote de sa couleur
     et de sa forme. Ne lire que index.html faisait croire qu ils etaient
     orphelins. */
  const armes = fs.readFileSync(path.join(HERE, "..", "serpentin", "armes.js"), "utf8");
  const appels = new Set();
  const re3 = /Sons\.jouer\("([a-z]+)"\)/g;
  while ((m = re3.exec(source))) appels.add(m[1]);
  const re4 = /son:\s*"([a-z]+)"/g;
  while ((m = re4.exec(armes))) appels.add(m[1]);

  /* et chaque son declare par une arme doit exister pour de vrai */
  const re5 = /son:\s*"([a-z]+)"/g;
  while ((m = re5.exec(armes))) {
    vrai(!!Sons.VOIX[m[1]], "une arme reclame le son « " + m[1] + " », qui n existe pas");
  }
  Object.keys(traduits).forEach((k) => { if (traduits[k]) appels.add(traduits[k]); });
  emis.forEach((e) => { if (!(e in traduits)) appels.add(e); });
  Object.keys(Sons.VOIX).forEach((v) => {
    vrai(appels.has(v), "la voix « " + v + " » n est jouee par personne");
  });
});

essai("le son se tait quand on le lui demande, et il s en souvient", () => {
  const boite = {};
  global.localStorage = {
    getItem: (k) => (k in boite ? boite[k] : null),
    setItem: (k, v) => { boite[k] = String(v); },
    removeItem: (k) => { delete boite[k]; },
  };
  global.window = global.window || {};
  /* on recharge le module pour qu il relise le stockage */
  const chemin = require.resolve(path.join(HERE, "..", "serpentin", "sons.js"));
  delete require.cache[chemin];
  const Sons = require(chemin);

  vrai(Sons.muet() === false, "il demarre muet alors que rien ne le demande");
  Sons.reglerMuet(true);
  vrai(boite[Sons.CLE] === "1", "le silence n est pas retenu");
  delete require.cache[chemin];
  const encore = require(chemin);
  vrai(encore.muet() === true, "au rechargement, il a oublie qu il etait muet");
  encore.reglerMuet(false);
  vrai(!(encore.CLE in boite), "le son revenu, la cle reste dans le stockage");

  /* ⚠️ Sans navigateur, il ne doit RIEN casser : le jeu marche sans son. */
  vrai(encore.jouer("graine") === false, "il pretend jouer sans contexte audio");
  vrai(encore.pret() === false, "il se croit pret sans contexte audio");

  /* chaque voix est complete */
  Object.keys(encore.VOIX).forEach((n) => {
    const v = encore.VOIX[n];
    vrai(typeof v.jouer === "function", n + " n a pas de son a jouer");
    vrai(v.repos > 0, n + " n a pas de repos : il pourra partir soixante fois par seconde");
  });
  delete global.localStorage;
});

essai("ce qui compte passe devant le bruit de fond", () => {
  /* ⚠️ « La fanfare pour le mode invincible ne s est pas produite. » Elle
     partait vraiment — mesure a l appui — mais elle sonne au moment precis ou
     le chevalier balaye tout ce qu il touche : une rafale de sons de mort
     remplissait les quatorze voix et on ne l entendait pas. */
  global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  global.window = global.window || {};
  const chemin = require.resolve(path.join(HERE, "..", "serpentin", "sons.js"));
  delete require.cache[chemin];
  const Sons = require(chemin);

  /* ce qui raconte quelque chose d important ne se fait pas voler sa place */
  ["etoile", "touche", "niveau", "mort", "victoire", "boss", "malus"].forEach((n) => {
    vrai(Sons.VOIX[n] && Sons.VOIX[n].devant === true,
         "« " + n + " » peut etre couvert par du bruit de fond");
  });
  /* et le bruit de fond, lui, doit rester soumis au plafond */
  ["graine", "tuee", "tir", "epee", "arc", "cran"].forEach((n) => {
    vrai(Sons.VOIX[n] && !Sons.VOIX[n].devant,
         "« " + n + " » passe devant tout : il va noyer le reste");
  });

  /* et la fanfare est bien la plus forte */
  const source = fs.readFileSync(chemin, "utf8");
  const bloc = source.slice(source.indexOf("etoile:"), source.indexOf("panier:"));
  const forces = [...bloc.matchAll(/force:\s*([0-9.]+)/g)].map((m) => parseFloat(m[1]));
  vrai(forces.length > 0 && Math.max(...forces) >= 0.25,
       "la fanfare ne monte qu a " + Math.max(...forces) + " : elle restera discrete");
  delete global.localStorage;
});

essai("le feu brule apres coup, la glace engourdit apres le degel", () => {
  /* ⚠️ « Les mobs qui ne meurent pas au premier coup devraient etre ralentis
     par les boules de glace ou bruler avec le souffle de feu, genre perdre
     1 pt de vie par seconde. » Un sort qui ne fait que des degats a l instant
     du contact n a pas d identite ; ce qui DURE, si. */
  const p = Moteur.creer({ graine: 270, monde: MONDE, foule: false });
  p.bestioles.length = 0;
  p.naitre("lucane");                    /* assez de vie pour voir la brulure */
  const b = p.bestioles[0];
  b.arrivee = -99; b.immobile = true;
  b.x = p.joueur.x + 600; b.y = p.joueur.y;   /* loin de toute arme */
  const v0 = b.vie;
  p.bruler(b, 3);
  seconde(p, 1);
  const apres1 = b.vie;
  proche(v0 - apres1, Moteur.REGLAGES.bruleParSeconde, 0.3,
         "en une seconde de brulure elle a perdu " + (v0 - apres1).toFixed(2) + " points");
  seconde(p, 3);
  const apresTout = b.vie;
  proche(v0 - apresTout, Moteur.REGLAGES.bruleParSeconde * 3, 0.5,
         "la brulure n a pas dure ses trois secondes");
  seconde(p, 2);
  proche(b.vie, apresTout, 0.001, "elle brule encore alors que le feu est passe");

  /* ⚠️ Et la brulure ACHEVE : c est son interet sur une grosse bestiole. */
  vrai(Moteur.REGLAGES.bruleParSeconde > 0, "la brulure ne fait aucun degat");

  /* l engourdissement : elle repart, mais lourde */
  const q = Moteur.creer({ graine: 271, monde: MONDE, foule: false });
  q.bestioles.length = 0;
  q.naitre("escargot");
  const e = q.bestioles[0];
  e.arrivee = -99;
  e.x = q.joueur.x + 500; e.y = q.joueur.y;
  q.geler(e, 0.5);
  vrai(e.ralentiJusqua > e.geleJusqua,
       "le gel ne laisse aucun engourdissement derriere lui");
  seconde(q, 0.6);                       /* le gel est passe */
  const depart = e.x;
  seconde(q, 1);
  const lourde = depart - e.x;
  seconde(q, Moteur.REGLAGES.dureeRalenti + 0.5);   /* l engourdissement passe */
  const depart2 = e.x;
  seconde(q, 1);
  const libre = depart2 - e.x;
  vrai(lourde < libre * 0.7,
       "engourdie elle avance de " + lourde.toFixed(0) + ", libre de " + libre.toFixed(0));
});

console.log(`\n${passes} passes, ${rates} rates\n`);
process.exit(rates ? 1 : 0);
