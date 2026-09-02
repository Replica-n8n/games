import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

/* Combien de temps tient un joueur correct ?

   Elle a dit : « tenir 2-3 minutes est un exploit, alors 8... ». Plutot que de
   regler au doigt mouille, on fait jouer le moteur par un joueur simule qui
   fait ce qu'un joueur fait : il s'ecarte de ce qui approche, il va chercher
   les graines et les objets, et il choisit une carte a chaque niveau.

   Ce n'est pas un enfant de 8 ans : c'est un plafond. Si le simulateur ne
   tient pas, un enfant ne tiendra pas non plus. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const Bestioles = require(path.join(HERE, "..", "serpentin", "bestioles.js"));
/* on mesure le VRAI jeu, pas le mode d essai qui fait tout arriver a zero */
Bestioles.reglerEssai(false);
/* ⚠️ IL MANQUAIT `meteo.js`. Sans lui, le moteur retombe sur un seul temps
   de secours — beau temps, sans fin — et l'outil qui juge si le jeu est trop
   dur ou trop facile jugeait donc un jeu SANS PLUIE, SANS NEIGE, SANS ORAGE ET
   SANS NUIT. Toutes les medianes publiees depuis que la meteo existe ont ete
   mesurees sur un jeu qui n'est pas celui qu'on joue. Trouve le jour ou elle a
   demande que le mauvais temps fasse mal : les chiffres n'avaient pas bouge
   d'un dixieme apres le changement, ce qui etait impossible. */
require(path.join(HERE, "..", "serpentin", "meteo.js"));
const Moteur = require(path.join(HERE, "..", "serpentin", "moteur.js"));
const Armes = require(path.join(HERE, "..", "serpentin", "armes.js"));

const MONDE = {
  rayon: 1400,
  obstacles: { nombre: 90, rayonMin: 16, rayonMax: 30, loinDuCentre: 200 },
};

/* Deux reglages par variable d'environnement, pour que le meme outil serve a
   deux questions : la difficulte de base (AIDE=0, 5 graines, rapide) et la
   preuve que la memoire des parties change vraiment quelque chose (GRAINES=25,
   sinon le bruit des graines couvre l'effet). */
const AIDE = Number(process.env.AIDE || 0);
const GRAINES = Number(process.env.GRAINES || 5);
/* ⚠️ Le magicien doit se JOUER aussi bien, pas seulement taper pareil : des
   degats egaux ne disent rien d'un sort qui demande de rester tourne vers la
   bestiole. On rejoue donc les memes parties avec lui. */
const PERSO = process.env.PERSO || "chevalier";

function jouer(graine, depart) {
  const p = Moteur.creer({ graine, monde: MONDE, aide: AIDE });
  const a = Armes.creer(p, PERSO);
  a.donner(depart);
  const tampon = [];
  let images = 0;

  /* 30 pas par seconde et non 60 : deux fois moins de calcul pour la meme
     courbe. Cet outil joue des parties ENTIERES, c'est lui qui coute le plus
     cher de tout le projet, et on le relance a chaque reglage. */
  /* ⚠️ La partie ne s'arrete plus a huit minutes : la reine arrive, et il
     faut la battre. Le plafond laisse donc quatre-vingt-dix secondes de
     combat — sans ca, l'outil coupait le combat en cours et comptait une
     defaite a chaque fois. */
  const PAS = 1 / 30;
  while (!p.fini && images < 30 * (p.duree + 90)) {
    /* fuir ce qui approche, ramasser ce qui traine */
    let vx = 0, vy = 0;
    p.voisines(p.joueur.x, p.joueur.y, 220, tampon);
    for (const b of tampon) {
      if (!b.vivante) continue;
      const dx = p.joueur.x - b.x, dy = p.joueur.y - b.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > 220) continue;
      const poids = (220 - d) / 220;
      vx += (dx / d) * poids * 2.4;
      vy += (dy / d) * poids * 2.4;
    }
    let proche = null, dm = Infinity;
    for (const g of p.graines.concat(p.objets)) {
      const d = Math.hypot(g.x - p.joueur.x, g.y - p.joueur.y);
      if (d < dm) { dm = d; proche = g; }
    }
    if (proche && dm < 400) {
      const d = dm || 1;
      vx += ((proche.x - p.joueur.x) / d) * 0.9;
      vy += ((proche.y - p.joueur.y) / d) * 0.9;
    }
    /* ne pas se coller a la haie */
    const dc = Math.hypot(p.joueur.x, p.joueur.y);
    if (dc > p.rayon - 260) {
      vx -= (p.joueur.x / (dc || 1)) * 3;
      vy -= (p.joueur.y / (dc || 1)) * 3;
    }
    p.commander({ angle: Math.atan2(vy, vx), avance: true });

    const faits = p.pas(PAS);
    a.pas(PAS);
    if (faits.some((e) => e.type === "niveau")) {
      const choix = a.propositions(3);
      if (choix.length) a.appliquer(choix[0]);
    }
    images++;
  }

  return {
    graine,
    depart,
    tenu: +(images / 30).toFixed(1),
    niveau: p.niveau,
    tues: p.tues,
    armes: a.armes.map((x) => x.nom + " " + x.niveau).join(", "),
    gagne: p.gagne,
  };
}

/* Une arme de depart tiree au hasard : on mesure les trois separement, sinon
   une arme injouable se cache dans la moyenne. */
const DEPARTS = Armes.PERSOS[PERSO].armes;
const parties = [];
for (const depart of DEPARTS) {
  for (let g = 1; g <= GRAINES; g++) parties.push(jouer(g * 137, depart));
}

const parArme = {};
for (const depart of DEPARTS) {
  const t = parties.filter((x) => x.depart === depart).map((x) => x.tenu).sort((a, b) => a - b);
  parArme[depart] = {
    leMoinsBon: t[0],
    median: t[Math.floor(t.length / 2)],
    leMeilleur: t[t.length - 1],
  };
}

const temps = parties.map((x) => x.tenu).sort((a, b) => a - b);
const median = temps[Math.floor(temps.length / 2)];
const bilan = {
  parArme,
  parties: parties.map((x) => x.depart + " " + x.graine + " : " + x.tenu + " s, niveau " + x.niveau),
  leMoinsBon: temps[0],
  median,
  leMeilleur: temps[temps.length - 1],
  gagnees: parties.filter((x) => x.gagne).length,
};

console.log(JSON.stringify(bilan, null, 2));

/* Ce qu'on veut : un joueur correct tient largement plus que les 2-3 minutes
   dont elle parlait, sans gagner a tous les coups. */
/* Aucune arme de depart ne doit etre un piege : chacune doit tenir. */
const pireArme = Math.min(...Object.values(parArme).map((x) => x.median));

/* ⚠️ IL MANQUAIT UNE BORNE HAUTE. Cet outil verifiait serieusement que le jeu
   n'est pas trop DUR, et presque pas qu'il n'est pas trop FACILE : la seule
   limite etait « on ne gagne pas les vingt parties ». Un objet qui aurait fait
   passer les victoires de 4 a 15 serait donc sorti « OK ».
   Trouve en preparant l'epouvantail, un objet qui AIDE le joueur : le banc
   aurait ete incapable de dire qu'il casse le jeu.
   Les deux plafonds viennent de la mesure de reference du 2026-09-02 sur le
   jeu tel qu'il est : mediane 392 s, 4 parties gagnees sur 20. */
/* Reglables par l'environnement : pour les retoucher sans editer le code,
   et pour PROUVER que la branche « trop facile » se declenche vraiment,
   en une minute avec GRAINES=1 plutot qu'en huit. */
const PLAFOND_MEDIANE = Number(process.env.PLAFOND_MEDIANE || 600);
const PLAFOND_GAGNEES = Number(process.env.PLAFOND_GAGNEES || 8);

const tropFacile = median > PLAFOND_MEDIANE || bilan.gagnees > PLAFOND_GAGNEES;
const ok = median >= 240 && pireArme >= 180 && bilan.leMoinsBon >= 90 &&
           bilan.gagnees < parties.length && !tropFacile;

if(tropFacile){
  console.log(`
TROP FACILE : mediane ${median} s (plafond ${PLAFOND_MEDIANE}), `
            + `${bilan.gagnees} gagnees sur ${parties.length} (plafond ${PLAFOND_GAGNEES}).`);
}else{
  console.log(ok
    ? `
OK : mediane ${median} s, le moins bon ${bilan.leMoinsBon} s, ${bilan.gagnees} parties gagnees sur ${parties.length}.`
    : `
RATE : mediane ${median} s, le moins bon ${bilan.leMoinsBon} s, ${bilan.gagnees} gagnees sur ${parties.length}. Il en faut au moins 240 de mediane.`);
}
process.exit(ok ? 0 : 1);
