// Les trophées : des raisons de rejouer (sans indice, sans faux pas, vite…).
// Gagnés au moment où l'affaire est classée (ceux d'une partie), ou en
// arrivant sur l'accueil, qui connaît toutes les enquêtes (collections).
// Rangés sous `trophees` : { id: date du gain }.

import { load, save } from './storage.js';

/** @typedef {import('../engine/types.js').Puzzle} Puzzle */
/** @typedef {{ id: string, nom: string, desc: string, rang: 'bronze' | 'argent' | 'or' }} Trophee */

/** @type {Trophee[]} */
export const TROPHEES = [
  { id: 'premiere', nom: 'Première affaire', desc: 'Classer une enquête.', rang: 'bronze' },
  { id: 'sang-froid', nom: 'Sang-froid', desc: "Classer une enquête sans accuser d'innocent.", rang: 'bronze' },
  { id: 'flair', nom: 'Flair', desc: 'Classer une enquête sans indice.', rang: 'argent' },
  { id: 'eclair', nom: 'Éclair', desc: 'Classer une enquête en moins de 3 minutes.', rang: 'argent' },
  { id: 'la-suite', nom: 'La suite', desc: 'Classer un chapitre 2.', rang: 'argent' },
  { id: 'sans-faute', nom: 'Sans faute', desc: 'Ni indice, ni innocent accusé, en moyen ou difficile.', rang: 'or' },
  { id: 'grand-detective', nom: 'Grand détective', desc: 'Classer une enquête difficile.', rang: 'or' },
  { id: 'collection', nom: 'Collectionneur', desc: "Classer toutes les enquêtes d'une collection.", rang: 'or' },
  { id: 'tout', nom: 'Toutes classées', desc: 'Classer toutes les enquêtes du jeu.', rang: 'or' },
];

/** @returns {Record<string, number>} */
export const obtenus = () => load('trophees', {});

/** Range les trophées gagnés, rend ceux qui sont nouveaux. @param {string[]} ids */
function ranger(ids) {
  const deja = obtenus();
  const neufs = ids.filter((id) => !deja[id]);
  if (neufs.length) { for (const id of neufs) deja[id] = Date.now(); save('trophees', deja); }
  return neufs.map((id) => /** @type {Trophee} */ (TROPHEES.find((t) => t.id === id)));
}

/** Une affaire classée : les trophées de cette partie.
 *  @param {Puzzle} p @param {{ hints: number, wrong: number, time: number }} r */
export function gagnerPartie(p, r) {
  const ids = ['premiere'];
  if (!r.wrong) ids.push('sang-froid');
  if (!r.hints) ids.push('flair');
  if (r.time < 180_000) ids.push('eclair');
  if ((p.chapitre ?? 1) > 1) ids.push('la-suite');
  if (!r.hints && !r.wrong && p.difficulty !== 'facile') ids.push('sans-faute');
  if (p.difficulty === 'difficile') ids.push('grand-detective');
  return ranger(ids);
}

/** Sur l'accueil : collections complètes, tout classé, et les trophées que les
 *  records d'avant (parties jouées avant les trophées) méritaient déjà.
 *  @param {Puzzle[]} puzzles @param {Record<string, { time: number, hints: number }>} records */
export function gagnerAccueil(puzzles, records) {
  const ids = [];
  const faits = puzzles.filter((p) => records[p.id]);
  if (faits.length) ids.push('premiere');
  for (const p of faits) {
    const r = records[p.id];
    if (!r.hints) ids.push('flair');
    if (r.time < 180_000) ids.push('eclair');
    if ((p.chapitre ?? 1) > 1) ids.push('la-suite');
    if (p.difficulty === 'difficile') ids.push('grand-detective');
  }
  const collections = new Set(puzzles.map((p) => p.collection));
  for (const c of collections) if (puzzles.filter((p) => p.collection === c).every((p) => records[p.id])) ids.push('collection');
  if (puzzles.length && faits.length === puzzles.length) ids.push('tout');
  return ranger([...new Set(ids)]);
}

/** La médaille d'un trophée (SVG). @param {Trophee} t @param {boolean} gagne */
export function medaille(t, gagne) {
  const c = !gagne ? ['#4a4440', '#3a3430'] : t.rang === 'or' ? ['#f2c94c', '#b8892a'] : t.rang === 'argent' ? ['#dfe4ea', '#9aa3ad'] : ['#e0a070', '#9a5a2e'];
  return `<svg viewBox="0 0 48 56" aria-hidden="true"><path d="M14 2h8l4 16h-8zM34 2h-8l-4 16h8z" fill="${gagne ? '#a8323a' : '#3a3430'}"/>`
    + `<circle cx="24" cy="34" r="19" fill="${c[1]}"/><circle cx="24" cy="34" r="15.5" fill="${c[0]}"/>`
    + (gagne ? `<circle cx="22" cy="32" r="6" fill="none" stroke="${c[1]}" stroke-width="2.6"/><path d="M26.5 36.5l5 5" stroke="${c[1]}" stroke-width="3" stroke-linecap="round"/>` : `<path d="M20 30a4 4 0 1 1 6 3.5c-1.4.8-2 1.6-2 3M24 41v.5" stroke="#6a625a" stroke-width="2.6" fill="none" stroke-linecap="round"/>`)
    + '</svg>';
}
