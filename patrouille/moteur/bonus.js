// Les 5 bonus, leurs durées et leurs chances d'apparaître.
import { SEC } from './constantes.js';

export const POIDS_BONUS = { bouclier: 25, aimant: 20, compagnons: 25, etoile: 20, coeur: 10 };
export const DUREES = { aimant: 10 * SEC, compagnons: 15 * SEC, etoile: 5 * SEC };
export const NOM_BONUS = {
  bouclier: 'Bouclier : il encaisse un coup',
  aimant: 'Aimant géant 10 s',
  compagnons: 'Drones-compagnons 15 s',
  etoile: 'Étoile : invincible 5 s',
  coeur: 'Un cœur en plus',
};

/** @param {any} p @param {string} b */
export function appliquerBonus(p, b) {
  if (b === 'bouclier') p.bouclier = true;
  if (b === 'aimant') p.aimant = DUREES.aimant;
  if (b === 'compagnons') p.compagnons = DUREES.compagnons;
  if (b === 'etoile') p.etoile = DUREES.etoile;
  if (b === 'coeur') p.coeurs = Math.min(p.coeursMax, p.coeurs + 1);
}
