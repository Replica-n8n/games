// Ghost Train : le wagon sur ses rails. Le parcours d'une mission est une suite
// d'étapes posées à une profondeur z : un arrêt (des vagues de fantômes), un
// aiguillage (deux voies au choix) ou le boss. Le wagon roule jusqu'à l'étape,
// s'arrête, et repart quand plus rien ne le bloque.
//
// L'aiguillage, comme sur les vrais chemins de fer (choisi par Julie, planche
// docs/ghost-train-levier.png) : un levier au bord de la voie donne la voie de
// gauche ; viser le levier le bascule (CLAC) et donne l'autre. Le wagon part
// sur la voie donnée au bout du délai. Le décor lit `p.fourche` (rails qui
// bifurquent, deux tunnels) et l'écran lit `p.portique` (les plaques des voies).
import { CY, VITESSE_RAIL, DELAI_AIGUILLAGE, AIGUILLE } from './constantes.js';
import { naitre, bloque } from './fantomes.js';
import { moment, son, evt } from './evenements.js';

// Après un CLAC, le wagon attend au moins ce temps avant de partir
const APRES_CLAC = 1.2;

/** @param {any} p @param {any} c */
function arriver(p, c) {
  p.camZ = c.z;
  if (c.arret) {
    p.rail = 'arret'; p.tArret = 0; p.tVide = 0;
    p.file = c.arret.vagues.map(([t, type, x]) => ({ t, type, x })).sort((a, b) => a.t - b.t);
    const s = c.arret.secret;
    if (s && !p.dejaTrouves.has(s.id)) naitre(p, 'secret', s.x, s);
    if (c.arret.moment) moment(p, c.arret.moment);
  } else if (c.aiguillage) {
    p.rail = 'aiguillage'; p.tAig = 0; p.tClac = -9;
    const a = c.aiguillage;
    p.levier = naitre(p, 'levier', -1.1, { cote: 'g' });
    p.fourche = { z0: p.camZ + AIGUILLE.levier, zMur: p.camZ + AIGUILLE.tunnels, cote: 'g' };
    p.portique = { z: p.camZ + AIGUILLE.portique, g: a.g, d: a.d };
    son(p, 'levier'); moment(p, 'aiguillage');
  } else if (c.boss) {
    p.rail = 'boss';
    p.boss = naitre(p, c.boss, 0);
    son(p, 'boss'); moment(p, 'boss');
  }
}

/** @param {any} p */
function repartir(p) { p.rail = 'roule'; p.cible = p.suite.shift() || null; }

/** Le rayon a basculé le levier. @param {any} p */
export function basculer(p) {
  if (p.rail !== 'aiguillage' || !p.levier) return;
  const cote = p.levier.cote === 'g' ? 'd' : 'g';
  p.levier.cote = cote; p.fourche.cote = cote; p.tClac = p.tAig;
  evt(p, { type: 'clac', x: p.levier.boite ? p.levier.boite.cx : 120, y: p.levier.boite ? p.levier.boite.y : 70 });
  son(p, 'clac'); moment(p, 'clac');
}

/** Le délai est passé : le wagon part sur la voie que donne le levier. @param {any} p */
export function choisirVoie(p) {
  if (p.rail !== 'aiguillage') return;
  const cote = p.levier ? p.levier.cote : 'g', voie = p.cible.aiguillage[cote];
  if (p.levier) p.levier.mort = true;
  p.levier = null; p.fourche = null;
  p.suite.unshift(...voie.etapes);
  // Le décor de la voie va de l'aiguillage à l'étape qui suit la voie ; ses pièces valent `gain`
  p.branche = { cote, z0: p.camZ, z1: p.suite[voie.etapes.length] ? p.suite[voie.etapes.length].z : p.camZ + 999 };
  p.voie = cote; p.gain = voie.gain || 1;
  son(p, 'aiguille'); moment(p, 'choix'); moment(p, cote === 'g' ? 'voieG' : 'voieD');
  repartir(p);
}

/** @param {any} p @param {number} dt */
export function avancerRail(p, dt) {
  const c = p.cible;
  if (p.rail === 'roule') {
    p.camZ += VITESSE_RAIL * dt; p.marche += dt;
    if (p.branche && p.gain !== 1 && p.camZ >= p.branche.z1) p.gain = 1;
    if (p.portique && p.camZ > p.portique.z + 0.5) p.portique = null;
    if (c && p.camZ >= c.z) arriver(p, c);
    p.croisiere -= dt;
    if (p.croisiere <= 0 && p.mission.volants && p.rail === 'roule' && c && c.z - p.camZ > 6) {
      naitre(p, 'gouleVol', p.h.choix([-1, 1]));
      p.croisiere = p.h.entre(2.5, 5);
    }
  } else if (p.rail === 'arret') {
    p.tArret += dt;
    while (p.file.length && p.file[0].t <= p.tArret) { const q = p.file.shift(); naitre(p, q.type, q.x); }
    if (!p.file.length && !p.ents.some(bloque)) { p.tVide += dt; if (p.tVide > 0.9) repartir(p); }
    else p.tVide = 0;
  } else if (p.rail === 'aiguillage') {
    p.tAig += dt;
    if (p.tAig >= DELAI_AIGUILLAGE && p.tAig >= p.tClac + APRES_CLAC) choisirVoie(p);
  }
  p.horizon = CY + (p.rail === 'roule' && p.options.balance ? Math.round(Math.sin(p.marche * 9)) : 0);
}

