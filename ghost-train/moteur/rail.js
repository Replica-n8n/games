// Ghost Train : le wagon sur ses rails. Le parcours d'une mission est une suite
// d'étapes posées à une profondeur z : un arrêt (des vagues de fantômes), un
// aiguillage (deux voies au choix) ou le boss. Le wagon roule jusqu'à l'étape,
// s'arrête, et repart quand plus rien ne le bloque.
import { CY, VITESSE_RAIL, DELAI_AIGUILLAGE } from './constantes.js';
import { naitre, bloque } from './fantomes.js';
import { moment, son } from './evenements.js';

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
    p.rail = 'aiguillage'; p.tAig = 0;
    naitre(p, 'levier', -0.8, { cote: 'g' });
    naitre(p, 'levier', 0.8, { cote: 'd' });
    son(p, 'levier'); moment(p, 'aiguillage');
  } else if (c.boss) {
    p.rail = 'boss';
    p.boss = naitre(p, c.boss, 0);
    son(p, 'boss'); moment(p, 'boss');
  }
}

/** @param {any} p */
function repartir(p) { p.rail = 'roule'; p.cible = p.suite.shift() || null; }

/** Le joueur a visé un panneau (ou le délai est passé). @param {any} p @param {'g'|'d'} cote */
export function choisirVoie(p, cote) {
  if (p.rail !== 'aiguillage') return;
  const voie = p.cible.aiguillage[cote];
  for (const e of p.ents) if (e.type === 'levier') e.mort = true;
  p.suite.unshift(...voie);
  // Le décor de la voie choisie va de l'aiguillage à l'étape qui suit la voie
  p.branche = { cote, z0: p.camZ, z1: p.suite[voie.length] ? p.suite[voie.length].z : p.camZ + 999 };
  p.voie = cote;
  son(p, 'aiguille'); moment(p, 'choix');
  repartir(p);
}

/** @param {any} p @param {number} dt */
export function avancerRail(p, dt) {
  const c = p.cible;
  if (p.rail === 'roule') {
    p.camZ += VITESSE_RAIL * dt; p.marche += dt;
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
    if (p.tAig >= DELAI_AIGUILLAGE) choisirVoie(p, 'g');
  }
  p.horizon = CY + (p.rail === 'roule' && p.options.balance ? Math.round(Math.sin(p.marche * 9)) : 0);
}
