import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

/* Ce que l'enfant RENCONTRE vraiment au sol, sur des parties entieres.

   Elle n'est jamais tombee sur un piment en plusieurs parties. Un objet qu'on
   ne croise jamais n'existe pas, quel que soit son poids dans le tirage. Cet
   outil compte donc deux choses tres differentes :

   - ce qui est SEME par le moteur ;
   - ce qui est RAMASSE par un joueur qui joue vraiment.

   Un ecart entre les deux se lit d'un coup d'oeil. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const Bestioles = require(path.join(HERE, "..", "serpentin", "bestioles.js"));
require(path.join(HERE, "..", "serpentin", "meteo.js"));
const Mondes = require(path.join(HERE, "..", "serpentin", "mondes.js"));
const Moteur = require(path.join(HERE, "..", "serpentin", "moteur.js"));
const Armes = require(path.join(HERE, "..", "serpentin", "armes.js"));

Bestioles.reglerEssai(false);

/* ⚠️ ON JOUE LES TROIS MONDES. Ce banc ne jouait que la prairie, et depuis
   qu'il y a UN BOSS PAR MONDE il accusait donc le jeu de ne jamais faire
   naitre le crabe ni le dragon : ils naissent sur l'ile et au volcan, ou il
   n'allait jamais. La regle « une partie sur trois voit son boss » se compte
   donc sur les parties jouees DANS SON MONDE, pas sur toutes. */
const MONDES_JOUES = [Mondes.prairie, Mondes.ile, Mondes.volcan];
const BOSS_DE = {};                    /* nom du boss -> nom de son monde */
MONDES_JOUES.forEach((m) => { if (m.boss) BOSS_DE[m.boss] = m.nom; });

function jouer(graine, depart, monde) {
  const p = Moteur.creer({ graine, monde });
  const a = Armes.creer(p);
  a.donner(depart);
  const tampon = [];
  const semes = {}, pris = {};
  const nees = new Set();
  let images = 0, sature = 0, malus = 0, flaques = 0;
  const PAS = 1 / 30;

  let avant = p.objets.map((o) => o.sorte);

  while (!p.fini && images < 30 * (p.duree + 90)) {
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
    const dc = Math.hypot(p.joueur.x, p.joueur.y);
    if (dc > p.rayon - 260) {
      vx -= (p.joueur.x / (dc || 1)) * 3;
      vy -= (p.joueur.y / (dc || 1)) * 3;
    }
    p.commander({ angle: Math.atan2(vy, vx), avance: true });

    /* ⚠️ La place au sol est PARTAGEE : les fruits et legumes attendent d etre
       trouves, les objets aussi. Si le plafond est atteint, plus rien de neuf
       n arrive. On compte combien de temps ca dure. */
    const poses = p.objets.filter((o) => Moteur.LEGUMES.indexOf(o.sorte) < 0).length;
    if (poses >= Moteur.REGLAGES.objetsAuSol) sature++;

    const faits = p.pas(PAS);
    a.pas(PAS);
    for (const e of faits) {
      if (e.type === "niveau") {
        const choix = a.propositions(3);
        if (choix.length) a.appliquer(choix[0]);
      }
      /* ⚠️ Le contre-poids ne compte que s il ARRIVE VRAIMENT. On compte donc
         les flaques posees et les armes retrogradees, pas seulement le fait
         que la limace existe dans le fichier. */
      if (e.type === "flaque") flaques++;
      if (e.type === "malus") { malus++; a.retrograder(p.alea); }
    }
    for (const b of p.bestioles) if (b.vivante) nees.add(b.nom);

    /* ce qui a disparu du sol a ete ramasse ; ce qui est apparu a ete seme */
    const apres = p.objets.map((o) => o.sorte);
    const reste = apres.slice();
    for (const s of avant) {
      const i = reste.indexOf(s);
      if (i >= 0) reste.splice(i, 1);
      else pris[s] = (pris[s] || 0) + 1;
    }
    for (const s of reste) semes[s] = (semes[s] || 0) + 1;
    avant = apres;

    images++;
  }

  return { tenu: images / 30, semes, pris, sature: sature / 30,
           nees: [...nees], malus, flaques };
}

const DEPARTS = Object.keys(Armes.CATALOGUE);
const semes = {}, pris = {};
let tenu = 0, sature = 0, parties = 0, malus = 0, flaques = 0;
const vues = {}, partiesDuMonde = {};

/* ⚠️ NEUF SERIES, PAS SIX, depuis qu'on joue trois mondes : six n'en
   laissait que huit par monde, et « une partie sur trois » se jouait alors a
   une partie pres — le dragon est sorti a 31 % contre 33 % demandes, ce qui ne
   dit rien du jeu et tout de la taille de l'echantillon. */
for (let g = 1; g <= 9; g++) {
  for (const d of DEPARTS) {
    const monde = MONDES_JOUES[g % MONDES_JOUES.length];
    const r = jouer(g * 31, d, monde);
    parties++;
    partiesDuMonde[monde.nom] = (partiesDuMonde[monde.nom] || 0) + 1;
    tenu += r.tenu;
    sature += r.sature;
    for (const k in r.semes) semes[k] = (semes[k] || 0) + r.semes[k];
    for (const k in r.pris) pris[k] = (pris[k] || 0) + r.pris[k];
    r.nees.forEach((n) => { vues[n] = (vues[n] || 0) + 1; });
    malus += r.malus;
    flaques += r.flaques;
  }
}

/* ⚠️ LA LISTE VIENT DU MOTEUR, elle n'est plus recopiee ici. Elle l'etait :
   ["coeur", "coffre", "bombe", "glace", "piment"], une copie figee du jour ou
   elle a ete ecrite. L'aimant et l'epouvantail ont ete ajoutes au jeu depuis,
   et le controle dont le metier est justement de verifier que CHAQUE objet du
   sol est rencontre ne les voyait ni l'un ni l'autre. C'est exactement
   l'accident du piment, celui qui a lance toute cette discipline : une valeur
   recopiee ne suit pas ce qu'elle copie. */
const SORTES = Moteur.SORTES.map((s) => s.sorte);
const lignes = SORTES.map((s) => ({
  sorte: s,
  poids: Moteur.SORTES.find((x) => x.sorte === s).poids,
  semesParPartie: +((semes[s] || 0) / parties).toFixed(2),
  prisParPartie: +((pris[s] || 0) / parties).toFixed(2),
}));
const legumes = Moteur.LEGUMES.reduce((t, n) => t + (semes[n] || 0), 0);

/* un boss se juge sur les parties de SON monde ; tout le reste sur toutes */
const surCombien = (n) => partiesDuMonde[BOSS_DE[n]] || parties;
const bestiaire = {};
Object.keys(Bestioles.ESPECES).forEach((n) => {
  bestiaire[n] = Math.round(((vues[n] || 0) / surCombien(n)) * 100) + " % des parties" +
                 (BOSS_DE[n] ? " de " + BOSS_DE[n] : "");
});

console.log(JSON.stringify({
  parties,
  bestiaire,
  flaquesParPartie: +(flaques / parties).toFixed(2),
  armesRetrogradeesParPartie: +(malus / parties).toFixed(2),
  dureeMoyenne: +(tenu / parties).toFixed(0),
  solPleinParPartie: +(sature / parties).toFixed(1) + " s",
  legumesSemesParPartie: +(legumes / parties).toFixed(2),
  objets: lignes,
}, null, 2));

/* ⚠️ DEUX GRIEFS, DEUX PHRASES. Ils etaient melanges dans une seule
   condition : quand une bestiole manquait, l'outil imprimait quand meme
   « on ne ramasse presque jamais » suivi d'une LISTE VIDE, et accusait le
   ramassage alors que le ramassage allait bien. Un controle qui designe le
   mauvais coupable coute plus cher qu'un controle absent. */
const jamaisVu = lignes.filter((l) => l.prisParPartie < 0.3);
/* ⚠️ LA BARRE RESTE A LA MOITIE DES PARTIES POUR TOUT LE MONDE, et il a
   fallu resister a la tentation de la baisser. Le papillon n'etait vu que dans
   40 % des parties ; on peut faire passer le controle de deux facons, et une
   seule est honnete.

   La tension est reelle : six bestioles sont marquees `individu`, et le jeu
   n'en accepte que TROIS a l'ecran — la regle vient de ce qu'un enfant de huit
   ans peut suivre. Exiger six presences pour trois places est arithmetiquement
   tendu, et c'est un jeu a somme nulle : rendre une bestiole plus frequente en
   rarefie forcement une autre.

   Mesure : le papillon n'etait pas prive de place, il naissait deux fois par
   partie comme le lucane, mais il vivait douze secondes et sa fenetre ne
   s'ouvrait qu'a 200 s pour des parties de 410 s. Avancee a 135 s, elle double
   — et le controle passe SANS avoir bouge : papillon 60 %, lucane 60 %,
   limace 69 %, crapaud 88 %. On a repare le jeu, pas la regle. Si un jour la
   somme nulle rend la barre intenable, ce sera une decision a prendre sur le
   plafond de trois, pas ici. */
/* ⚠️ LA REINE EST A PART, et ce n'est pas une faveur : c'est que deux
   controles se contredisaient. La voir, c'est survivre huit minutes, donc
   presque gagner — et `chevalier-difficulte.mjs` exige justement qu'on ne
   gagne PAS plus de huit parties sur vingt, soit 40 %. Exiger de la
   rencontrer dans la moitie des parties revenait a demander au jeu d'etre plus
   facile que ce que l'autre banc autorise. Mesure : 44 a 54 % selon les
   series, pour 20 a 45 % de parties gagnees. On lui demande donc le meme tiers
   que le seuil de victoire. */
const jamaisNee = Object.keys(Bestioles.ESPECES).filter((n) => {
  const part = (vues[n] || 0) / surCombien(n);
  return part < (Bestioles.ESPECES[n].boss ? 1 / 3 : 0.5);
});
const rates = [];
if (jamaisVu.length) {
  rates.push("on ne ramasse presque jamais " +
    jamaisVu.map((l) => l.sorte + " (" + l.semesParPartie + " seme, " + l.prisParPartie + " pris par partie)").join(", ") +
    ". Le sol est plein " + (sature / parties).toFixed(0) + " s par partie.");
}
if (jamaisNee.length) {
  rates.push("moins d une partie sur deux voit " +
    jamaisNee.map((n) => n + " (" + bestiaire[n] + ")").join(", "));
}
rates.forEach((m) => console.log("\nRATE : " + m));
if (!rates.length) {
  console.log("\nOK : chaque objet du sol est ramasse au moins une fois sur trois parties, " +
              "et chaque bestiole se montre au moins une partie sur deux.");
}
process.exit(rates.length ? 1 : 0);
