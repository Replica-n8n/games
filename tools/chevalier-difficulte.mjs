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
require(path.join(HERE, "..", "serpentin", "bestioles.js"));
const Moteur = require(path.join(HERE, "..", "serpentin", "moteur.js"));
const Armes = require(path.join(HERE, "..", "serpentin", "armes.js"));

const MONDE = {
  rayon: 1400,
  obstacles: { nombre: 90, rayonMin: 16, rayonMax: 30, loinDuCentre: 200 },
};

function jouer(graine) {
  const p = Moteur.creer({ graine, monde: MONDE });
  const a = Armes.creer(p);
  a.donner("bouclier");
  const tampon = [];
  let images = 0;

  while (!p.fini && images < 60 * (p.duree + 2)) {
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

    const faits = p.pas(1 / 60);
    a.pas(1 / 60);
    if (faits.some((e) => e.type === "niveau")) {
      const choix = a.propositions(3);
      if (choix.length) a.appliquer(choix[0]);
    }
    images++;
  }

  return {
    graine,
    tenu: +(images / 60).toFixed(1),
    niveau: p.niveau,
    tues: p.tues,
    armes: a.armes.map((x) => x.nom + " " + x.niveau).join(", "),
    gagne: p.gagne,
  };
}

const parties = [];
for (let g = 1; g <= 8; g++) parties.push(jouer(g * 137));

const temps = parties.map((x) => x.tenu).sort((a, b) => a - b);
const median = temps[Math.floor(temps.length / 2)];
const bilan = {
  parties,
  leMoinsBon: temps[0],
  median,
  leMeilleur: temps[temps.length - 1],
  gagnees: parties.filter((x) => x.gagne).length,
};

console.log(JSON.stringify(bilan, null, 2));

/* Ce qu'on veut : un joueur correct tient largement plus que les 2-3 minutes
   dont elle parlait, sans gagner a tous les coups. */
const ok = median >= 240 && bilan.leMoinsBon >= 120 && bilan.gagnees < parties.length;

console.log(ok
  ? `\nOK : mediane ${median} s, le moins bon ${bilan.leMoinsBon} s, ${bilan.gagnees} parties gagnees sur ${parties.length}.`
  : `\nRATE : mediane ${median} s, le moins bon ${bilan.leMoinsBon} s, ${bilan.gagnees} gagnees sur ${parties.length}. Il en faut au moins 240 de mediane.`);
process.exit(ok ? 0 : 1);
