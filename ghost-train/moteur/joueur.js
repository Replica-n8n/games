// Les cœurs de la recrue.
import { COEURS } from './constantes.js';
import { evt, son, moment } from './evenements.js';

/** Un coup reçu. `force` passe outre l'invulnérabilité (toucher Lumi au rayon).
 * @param {any} p @param {boolean} [force] */
export function coup(p, force = false) {
  if (p.etat !== 'jeu') return;
  if (p.invul > 0 && !force) return;
  if (p.options.invincible) { evt(p, { type: 'coup' }); return; }
  p.coeurs--; p.coeursPerdus++; p.invul = 1.1;
  evt(p, { type: 'coup' }); son(p, 'coup'); moment(p, 'coup');
  if (p.coeurs <= 0) { p.coeurs = 0; p.etat = 'mourant'; p.tMort = 1.4; son(p, 'defaite'); }
}

/** Un cœur rendu, jamais au-delà du maximum. @param {any} p */
export function soigner(p) { if (p.coeurs < COEURS) { p.coeurs++; evt(p, { type: 'soin' }); } }
