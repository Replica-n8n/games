import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

/* Ce que coute la foule, moteur seul, sans navigateur.

   Le jeu en affichera 60. On mesure quand meme a 300, le plafond du jeu de
   reference, pour savoir de combien de marge on dispose avant d'ecrire la
   premiere arme. Le budget d'une image a 60 images par seconde est 16,7 ms,
   dessin compris : le moteur doit en prendre une petite part. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
/* ⚠️ IL MANQUAIT `bestioles.js` ET `meteo.js`. Sans eux, le moteur retombe
   sur son bestiaire de secours — UN escargot — et sur son seul temps de
   secours. Cet outil mesurait donc le cout de 300 escargots identiques dans
   une prairie sans ciel, pas celui du jeu qu'on joue : ni papillon, ni ses
   nuees, ni lucane, ni gel, ni neige. Meme trou que dans
   `chevalier-difficulte.mjs`, trouve le meme jour. */
const Bestioles = require(path.join(HERE, "..", "serpentin", "bestioles.js"));
Bestioles.reglerEssai(false);
require(path.join(HERE, "..", "serpentin", "meteo.js"));
const Moteur = require(path.join(HERE, "..", "serpentin", "moteur.js"));

const MONDE = {
  rayon: 1400,
  obstacles: { nombre: 90, rayonMin: 16, rayonMax: 30, loinDuCentre: 200 },
};

function mesurer(combien, secondes = 10) {
  Moteur.REGLAGES.plafond = combien;
  Moteur.REGLAGES.departFoule = combien;
  const p = Moteur.creer({ graine: 7, monde: MONDE });
  /* ⚠️ Le chevalier meurt en cinq secondes au milieu de 300 bestioles, et
     `pas()` sort aussitot : sans ca, on mesurerait une fonction vide. */
  const immortel = () => { p.joueur.coeurs = 5; p.joueur.vivant = true; p.fini = false; };
  /* on remplit d'abord, on mesure ensuite : la naissance n'est pas le sujet */
  for (let i = 0; i < 60 * 6; i++) {
    immortel();
    p.commander({ angle: Math.sin(i / 90) * 3, avance: true });
    p.pas(1 / 60);
  }
  const images = 60 * secondes;
  const t0 = process.hrtime.bigint();
  let tours = 0;
  for (let i = 0; i < images; i++) {
    immortel();
    p.commander({ angle: Math.sin(i / 90) * 3, avance: true });
    p.pas(1 / 60);
    tours++;
  }
  const t1 = process.hrtime.bigint();
  return {
    bestioles: p.bestioles.length,
    tours,
    tempsJoue: +p.temps.toFixed(1),
    msParImage: +(Number(t1 - t0) / 1e6 / images).toFixed(3),
  };
}

const bilan = {
  "60 (le plafond du jeu)": mesurer(60),
  "150": mesurer(150),
  "300 (le plafond du jeu de reference)": mesurer(300),
};

console.log(JSON.stringify(bilan, null, 2));

const BUDGET = 16.7;
const cher = bilan["300 (le plafond du jeu de reference)"].msParImage;
const normal = bilan["60 (le plafond du jeu)"].msParImage;
/* le garde qui manquait : une mesure qui ne joue rien ne prouve rien */
const joue = Object.values(bilan).every((m) => m.tempsJoue > 9 && m.tours === 600);
const ok = joue && normal < BUDGET / 4 && cher < BUDGET;

console.log(ok
  ? `\nOK : ${normal} ms a 60 bestioles, ${cher} ms a 300, pour un budget de ${BUDGET} ms.`
  : `\nRATE : ${normal} ms a 60 et ${cher} ms a 300, budget ${BUDGET} ms.`);
process.exit(ok ? 0 : 1);
