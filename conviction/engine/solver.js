// Solveur : retour sur trace avec propagation. À chaque nœud, on calcule les
// cases encore possibles de chaque personne non placée (ligne et colonne
// libres, et aucun témoignage déjà placé ne devient faux), on s'arrête si
// une personne n'a plus de case, et on place d'abord celle qui en a le moins.

import { boardOf } from './board.js';
import { evalClue } from './clues.js';

/** @typedef {import('./types.js').Puzzle} Puzzle */
/** @typedef {import('./types.js').Placement} Placement */
/** @typedef {import('./types.js').Pos} Pos */
/** @typedef {import('./board.js').Board} Board */

/**
 * Toutes les solutions, en s'arrêtant à `limit` (2 suffit pour savoir si
 * la solution est unique).
 * @param {Puzzle} puzzle @param {number} [limit] @returns {Placement[]}
 */
export function solve(puzzle, limit = 2) {
  const b = boardOf(puzzle);
  /** @type {Placement[]} */
  const out = [];
  /** @param {Placement} pl */
  const rec = (pl) => {
    if (out.length >= limit) return;
    const todo = puzzle.persons.filter((p) => !pl[p.id]);
    if (!todo.length) {
      if (puzzle.persons.every((p) => evalClue(b, p.clue, p.id, pl) === true)) out.push({ ...pl });
      return;
    }
    let bestId = '';
    /** @type {Pos[] | null} */
    let best = null;
    for (const p of todo) {
      const cands = candidates(b, pl, p.id);
      if (!cands.length) return;
      if (!best || cands.length < best.length) { best = cands; bestId = p.id; }
    }
    for (const pos of /** @type {Pos[]} */ (best)) {
      pl[bestId] = pos;
      rec(pl);
      delete pl[bestId];
      if (out.length >= limit) return;
    }
  };
  rec({});
  return out;
}

/**
 * Cases où `id` peut encore aller : case libre, ligne et colonne inoccupées,
 * et aucun témoignage (le sien ou celui d'une personne placée) ne devient faux.
 * @param {Board} b @param {Placement} pl @param {string} id @returns {Pos[]}
 */
export function candidates(b, pl, id) {
  const rows = new Set(), cols = new Set();
  for (const k in pl) if (k !== id) { rows.add(pl[k][0]); cols.add(pl[k][1]); }
  /** @type {Pos[]} */
  const out = [];
  for (const pos of b.free) {
    if (rows.has(pos[0]) || cols.has(pos[1])) continue;
    if (fits(b, pl, id, pos)) out.push(pos);
  }
  return out;
}

/**
 * Placer `id` en `pos` ne rend aucun témoignage placé faux.
 * @param {Board} b @param {Placement} pl @param {string} id @param {Pos} pos
 */
export function fits(b, pl, id, pos) {
  const saved = pl[id];
  pl[id] = pos;
  let ok = true;
  for (const p of b.puzzle.persons) {
    if (pl[p.id] && evalClue(b, p.clue, p.id, pl) === false) { ok = false; break; }
  }
  if (saved) pl[id] = saved; else delete pl[id];
  return ok;
}
