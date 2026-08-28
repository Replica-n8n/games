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
   capacite du joueur simule a rester en vie. */

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

function dps(nom, niveaux, distance) {
  const p = Moteur.creer({ graine: 5, monde: MONDE, foule: false });
  const perso = Armes.PERSOS.chevalier.armes.indexOf(nom) >= 0 ? "chevalier" : "magicien";
  const a = Armes.creer(p, perso);
  for (let i = 0; i < niveaux; i++) a.donner(nom);
  p.bestioles.length = 0;
  p.naitre("mannequin");
  const b = p.bestioles[0];
  b.arrivee = -99;
  p.commander({ angle: 0, avance: false });
  for (let i = 0; i < 60 * SECONDES; i++) {
    /* on le remet en place et on le remplit : il sert de cible, pas de proie.
       On leve aussi son gel, sinon la boule givree se mesurerait elle-meme. */
    b.x = p.joueur.x + ouMesurer(nom, niveaux, distance);
    b.y = p.joueur.y;
    b.vie = Math.max(b.vie, 500000);
    b.geleJusqua = -1;
    a.pas(1 / 60);
    p.pas(1 / 60);
  }
  return (999999 - b.vie) / SECONDES;
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

const pires = ecarts.filter((e) => e.ecart > 0.4).concat(echanges.map(() => ({
  arme: "-", sort: "-", niveau: 0, distance: 0, ecart: 1,
})));
console.log(pires.length
  ? "\nRATE : " + pires.map((e) => e.arme + " vs " + e.sort + " au niveau " + e.niveau +
      " a " + e.distance + " : " + Math.round(e.ecart * 100) + " % d ecart").join(" | ")
  : "\nOK : aucun sort ne s ecarte de plus de 40 % de l arme qu il remplace.");
process.exit(pires.length ? 1 : 0);
