import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

/* Les degats par seconde de chaque arme et de chaque sort, mesures.

   Le magicien doit valoir le chevalier, pas « a peu pres ». Chaque sort
   remplace une arme precise, et on compare les paires :

     souffle ↔ epee      givre ↔ bouclier      piques ↔ arc

   On mesure a bout portant (34 unites, la bestiole collee) et a distance
   (140), parce qu'une arme qui ne frappe que devant ne se juge pas au meme
   endroit qu'une arme qui vise loin.

   ⚠️ Le mannequin ne meurt pas et ne bouge pas : on mesure l'arme, pas la
   capacite du joueur simule a rester en vie.

   ⚠️ ET LE JOUEUR NON PLUS NE BOUGEAIT PAS. C'etait sans consequence tant que
   toutes les armes valaient la meme chose a l'arret — puis est arrivé le vent,
   dont toute la force vient du deplacement. Mesure sur ce banc-la, il rendait
   ZERO et le controle aurait conclu qu'il ne sert a rien. On sait faire courir
   le joueur maintenant : il tourne en rond a vitesse connue, et le mannequin
   est pose la ou l'arme peut le toucher — devant pour ce qui frappe devant,
   sur le cercle pour ce qui tourne, SUR LE CHEMIN DEJA PARCOURU pour le vent.
   Les paires historiques, elles, restent mesurees a l'arret : leurs chiffres
   ne dependent pas de la course, et on ne change pas un etalon en cours de
   route. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const Bestioles = require(path.join(HERE, "..", "serpentin", "bestioles.js"));
require(path.join(HERE, "..", "serpentin", "meteo.js"));
const Mondes = require(path.join(HERE, "..", "serpentin", "mondes.js"));
const Moteur = require(path.join(HERE, "..", "serpentin", "moteur.js"));
const Armes = require(path.join(HERE, "..", "serpentin", "armes.js"));

Bestioles.ESPECES.mannequin = {
  nom: "mannequin", vie: 999999, vitesse: 0, rayon: 14, xp: 1,
  individu: false, arrive: 0, couleur: "#11131f",
  penser: function (b) { b.immobile = true; },
};
Bestioles.ESPECES.mannequin.arriveVraie = 0;
Bestioles.ESPECES.mannequin.arriveNiveauVrai = 0;

const MONDE = Mondes.prairie;
const SECONDES = 12;
const SAUT = String.fromCharCode(10);
/* le joueur tourne en rond : a 150 unites par seconde et 0,9 radian par
   seconde, son cercle fait 167 de rayon — largement dans la prairie, donc il
   ne touche jamais la haie et ne perd jamais sa vitesse. */
const TOURNE = 0.9;
/* ou l'on pose le mannequin pour mesurer le vent : la ou le personnage etait
   il y a trois dixiemes de seconde, c'est-a-dire en plein dans sa trainee.

   ⚠️ PAS PLUS PRES. A dix images (25 unites) le mannequin TOUCHAIT le
   personnage, qui mourait a 7,3 s : la mesure s'arretait la, sans rien dire,
   et rendait 18 coups au lieu de 24. C'est la troisieme fois que ce banc ment
   par une mort silencieuse — d'ou le controle `verifierVivant` plus bas, qui
   fait echouer la mesure au lieu de rendre un chiffre trop bas. */
const RETARD = 18;

/* ⚠️ Une arme qui TOURNE ne se mesure pas la ou on veut : elle ne frappe que
   sur son cercle. Mise a 34 ou a 140, la boule givree rendait zero et le
   controle passait en disant que tout allait bien. On place donc la cible sur
   le cercle, et on note que ces deux-la ne se comparent qu'entre elles. */
function ouMesurer(nom, niveaux, distance) {
  const def = Armes.CATALOGUE[nom];
  if (def.type !== "orbite") return distance;
  const rayon = def.base.rayon + (def.parNiveau.rayon || 0) * (niveaux - 1);
  return rayon;
}

function dps(nom, niveaux, distance, mouvement = "immobile") {
  const p = Moteur.creer({ graine: 5, monde: MONDE, foule: false });
  const perso = Armes.PERSOS.chevalier.armes.indexOf(nom) >= 0 ? "chevalier" : "magicien";
  const a = Armes.creer(p, perso);
  for (let i = 0; i < niveaux; i++) a.donner(nom);
  if (mouvement === "bottes") for (let i = 0; i < 5; i++) a.donnerObjet("bottes");
  const court = mouvement !== "immobile";
  p.bestioles.length = 0;
  p.naitre("mannequin");
  const b = p.bestioles[0];
  b.arrivee = -99;
  p.commander({ angle: 0, avance: court });
  /* ⚠️ On mesure une ARME, pas la survie d'un joueur simule : le mannequin ne
     doit jamais pouvoir le tuer. Sans ca, une cible posee trop pres arrete la
     mesure au milieu et le resultat est simplement trop bas. */
  p.joueur.invincibleJusqua = 1e9;
  const passe = [];
  for (let i = 0; i < 60 * SECONDES; i++) {
    const angle = court ? (i / 60) * TOURNE : 0;
    p.commander({ angle, avance: court });
    passe.push({ x: p.joueur.x, y: p.joueur.y });
    if (passe.length > 90) passe.shift();
    /* on le remet en place et on le remplit : il sert de cible, pas de proie.
       On leve aussi son gel, sinon la boule givree se mesurerait elle-meme. */
    const ou = placer(nom, niveaux, distance, p, angle, passe);
    b.x = ou.x;
    b.y = ou.y;
    b.vie = Math.max(b.vie, 500000);
    b.geleJusqua = -1;
    a.pas(1 / 60);
    p.pas(1 / 60);
  }
  verifierVivant(p, nom, niveaux, mouvement);
  return (999999 - b.vie) / SECONDES;
}

/* ⚠️ Un banc qui s'arrete au milieu rend un chiffre trop bas SANS RIEN DIRE.
   C'est arrive : le joueur mourait a 7,3 s d'une mesure de 12 s. On refuse le
   resultat plutot que de le publier. */
function verifierVivant(p, nom, niveaux, mouvement) {
  if (p.fini || !p.joueur.vivant) {
    console.log("RATE : la mesure de " + nom + " niveau " + niveaux + " (" + mouvement +
                ") s est arretee a " + p.temps.toFixed(1) + " s sur " + SECONDES +
                " : le joueur est mort, le chiffre ne vaut rien.");
    process.exit(1);
  }
}

/* Ou poser le mannequin pour que l'arme mesuree puisse le toucher. Se tromper
   ici, c'est mesurer zero et croire l'arme inutile — c'est deja arrive avec la
   boule givree, mesuree hors de son cercle. */
function placer(nom, niveaux, distance, p, angle, passe) {
  const j = p.joueur;
  /* ⚠️ Le vent ET la trappe se mesurent au meme endroit : DERRIERE le
     joueur, sur le chemin qu'il vient de parcourir. Ce sont les deux armes du
     jeu qui ne travaillent qu'en marchant. */
  if (Armes.CATALOGUE[nom].type === "sillage" || Armes.CATALOGUE[nom].type === "trappe") {
    /* dans la trainee : la ou il etait il y a RETARD images */
    const v = passe[Math.max(0, passe.length - 1 - RETARD)];
    return { x: v.x, y: v.y };
  }
  const d = ouMesurer(nom, niveaux, distance);
  return { x: j.x + Math.cos(angle) * d, y: j.y + Math.sin(angle) * d };
}

const PAIRES = [
  { arme: "epee", sort: "souffle" },
  { arme: "bouclier", sort: "givre" },
  { arme: "arc", sort: "piques" },
];
const NIVEAUX = [1, 3, 6];

const lignes = [];
const ecarts = [];
for (const { arme, sort } of PAIRES) {
  for (const n of NIVEAUX) {
    for (const d of [34, 140]) {
      const orbite = Armes.CATALOGUE[arme].type === "orbite";
      /* pour les orbites, une seule mesure suffit : elles ne connaissent qu'un
         rayon. La mesurer deux fois donnerait deux fois le meme chiffre. */
      if (orbite && d === 140) continue;
      const a = dps(arme, n, d), b = dps(sort, n, d);
      /* ⚠️ Si l'une des deux ne PORTE PAS jusque-la, il n'y a pas d'ecart a
         mesurer : il y a un echange voulu, et c'est lui qu'on verifie plus
         bas. Compter 100 % d'ecart ici ferait echouer le controle sur une
         difference qui est le sujet meme du personnage. */
      const comparable = a > 0.4 && b > 0.4;
      const ecart = comparable ? Math.abs(a - b) / Math.max(a, b, 0.001) : 0;
      if (comparable) ecarts.push({ arme, sort, niveau: n, distance: d, ecart });
      lignes.push({
        paire: arme + " / " + sort, niveau: n, distance: d,
        arme: +a.toFixed(1), sort: +b.toFixed(1),
        ecart: comparable ? Math.round(ecart * 100) + " %" : "-",
      });
    }
  }
}

console.log(JSON.stringify(lignes, null, 2));

/* ------------------------------------------------------------- LE VENT

   Il n'a pas d'arme jumelle chez le chevalier : c'est la quatrieme magie. On
   le compare donc a la MOYENNE des trois sorts qu'il rejoint, au meme niveau.

   Et surtout on verifie les deux choses qui font sa nature :
     - a l'arret il ne rend RIEN. C'est le contrat : « cours ! »
     - avec les bottes montees a fond il rend plus. C'est la seule arme du jeu
       dont un objet de deplacement augmente les degats. */
const QUATRIEMES = [
  { nom: "vent", trois: ["souffle", "givre", "piques"] },
  { nom: "trappe", trois: ["epee", "bouclier", "arc"] },
];
const fautes = [];
for (const { nom, trois } of QUATRIEMES) {
  const table = [];
  for (const n of NIVEAUX) {
    const moyenne = trois.reduce((t, s) => t + dps(s, n, 34), 0) / trois.length;
    const arret = dps(nom, n, 0, "immobile");
    const course = dps(nom, n, 0, "course");
    const bottes = dps(nom, n, 0, "bottes");
    const ecart = Math.abs(course - moyenne) / Math.max(course, moyenne, 0.001);
    table.push({
      niveau: n,
      "a l arret": +arret.toFixed(1),
      "en marchant": +course.toFixed(1),
      "bottes a fond": +bottes.toFixed(1),
      "moyenne des trois autres": +moyenne.toFixed(1),
      ecart: Math.round(ecart * 100) + " %",
    });
    if (arret > 0.2) fautes.push(nom + " niveau " + n + " frappe a l ARRET (" + arret.toFixed(1) + "/s) : ce n est plus une arme de deplacement");
    if (ecart > 0.4) fautes.push(nom + " niveau " + n + " s ecarte de " + Math.round(ecart * 100) + " % de la moyenne des trois autres");
  }
  console.log(SAUT + nom + ", mesure en se deplacant :");
  console.log(JSON.stringify(table, null, 2));
  /* les bottes ne renforcent que le VENT : la trappe se seme a la DISTANCE,
     donc courir plus vite n en pose pas plus au metre carre */
  if (nom === "vent" && table.some((v) => v["bottes a fond"] <= v["en marchant"] * 1.05)) {
    fautes.push("les bottes n augmentent pas le vent");
  }
}
fautes.forEach((m) => console.log("RATE : " + m));

/* ⚠️ La marge est large a dessein : deux sorts qui rendraient exactement les
   memes chiffres seraient la meme arme repeinte. Ce qu'on interdit, c'est
   qu'un personnage soit deux fois plus fort que l'autre. */
/* ⚠️ Ce que le souffle gagne en portee, il doit le rendre en largeur. Sans ce
   controle, on pourrait lui donner la portee de l'arc ET l'arc de l'epee, et
   le magicien serait simplement meilleur. */
const echanges = [];
PAIRES.forEach(({ arme, sort }) => {
  const A = Armes.CATALOGUE[arme], B = Armes.CATALOGUE[sort];
  if (A.base.portee === undefined || B.base.portee === undefined) return;
  if (A.base.arc === undefined || B.base.arc === undefined) return;
  const plusLoin = B.base.portee > A.base.portee;
  const plusLarge = B.base.arc > A.base.arc;
  if (plusLoin && plusLarge) {
    echanges.push(sort + " porte plus loin QUE " + arme + " et balaie plus large : il n echange rien");
  }
  if (!plusLoin && !plusLarge && B.base.portee < A.base.portee && B.base.arc < A.base.arc) {
    echanges.push(sort + " porte moins loin que " + arme + " ET balaie moins large : il ne sert a rien");
  }
});
echanges.forEach((m) => console.log("RATE : " + m));

const pires = ecarts.filter((e) => e.ecart > 0.4).concat(echanges.concat(fautes).map(() => ({
  arme: "-", sort: "-", niveau: 0, distance: 0, ecart: 1,
})));
console.log(pires.length
  ? "\nRATE : " + pires.map((e) => e.arme + " vs " + e.sort + " au niveau " + e.niveau +
      " a " + e.distance + " : " + Math.round(e.ecart * 100) + " % d ecart").join(" | ")
  : "\nOK : aucun sort ne s ecarte de plus de 40 % de l arme qu il remplace.");
process.exit(pires.length ? 1 : 0);
