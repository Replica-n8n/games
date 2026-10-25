// Ghost Train : une mission, du départ à la note. Pur : aucun DOM, aucun
// Math.random. L'écran lit la partie et ses événements, il ne la modifie jamais.
import { CY, COEURS, DT } from './constantes.js';
import { creeHasard } from './hasard.js';
import { pasEntite } from './fantomes.js';
import { avancerRail } from './rail.js';
import { pasRayon } from './actions.js';
import { calerBoites } from './projection.js';
import { moment } from './evenements.js';
import { noteDe } from './notes.js';

/**
 * @param {{mission: any, graine?: number, sauvegarde?: any, options?: any}} o
 * options : marge (pixels de tolérance du viseur), verrou (pixels avant de
 * lâcher un fantôme tenu), balance (le wagon tangue en roulant), invincible,
 * puissance et chauffe (multiplicateurs de l'atelier)
 */
export function creePartie({ mission, graine = 1, sauvegarde = null, options = {} }) {
  const p = {
    mission, h: creeHasard(graine),
    options: { marge: 3, verrou: 14, balance: true, invincible: false, puissance: 1, chauffe: 1, ...options },
    t: 0, camZ: 0, marche: 0, horizon: CY,
    rail: 'roule', suite: [...mission.parcours], cible: null, file: [], tArret: 0, tVide: 0, tAig: 0,
    voie: null, branche: null, croisiere: 5, levier: null, fourche: null, portique: null, gain: 1, tClac: -9,
    coeurs: COEURS, invul: 0, coeursPerdus: 0,
    chauffe: 0, surchauffe: 0, tire: false, verrou: null, cibleRayon: null, sous: null, visee: { x: 160, y: 90 },
    ents: [], boss: null, evenements: [], vus: new Set(), consigne: null,
    pieces: 0, captures: {}, total: 0, prises: 0, parfaits: 0,
    secrets: [], dejaTrouves: new Set(sauvegarde ? sauvegarde.dossier : []),
    lumi: { vue: false, touche: false, sauve: false },
    etat: 'jeu', tFin: 0, tMort: 0, bilan: null,
  };
  p.cible = p.suite.shift();
  moment(p, 'debut');
  return p;
}

/** @param {any} p @param {boolean} fini */
function faireBilan(p, fini) {
  const b = {
    mission: p.mission.id, fini, pieces: p.pieces, captures: { ...p.captures },
    prises: p.prises, total: p.total, coeursPerdus: p.coeursPerdus, parfaits: p.parfaits,
    lumi: !p.lumi.vue ? 'absent' : p.lumi.touche ? 'touche' : 'epargne',
    secrets: [...p.secrets], duree: p.t, note: null,
  };
  if (fini) b.note = noteDe(b);
  return b;
}

/**
 * Un pas de 1/60 s.
 * @param {any} p
 * @param {{x: number, y: number, tire: boolean}} entree viseur en pixels d'écran
 */
export function pasPartie(p, entree) {
  if (p.etat === 'fini' || p.etat === 'mort') return;
  const dt = DT;
  p.t += dt;
  if (p.etat === 'mourant') {
    p.tMort -= dt;
    if (p.tMort <= 0) { p.etat = 'mort'; p.bilan = faireBilan(p, false); }
    return;
  }
  avancerRail(p, dt);
  calerBoites(p);
  pasRayon(p, entree, dt);
  for (const e of p.ents) pasEntite(p, e, dt);
  p.ents = p.ents.filter((e) => !e.mort);
  calerBoites(p);
  p.invul = Math.max(0, p.invul - dt);
  if (p.tFin > 0 && p.etat === 'jeu') {
    p.tFin -= dt;
    if (p.tFin <= 0) { p.etat = 'fini'; p.bilan = faireBilan(p, true); moment(p, 'fin'); }
  }
}
