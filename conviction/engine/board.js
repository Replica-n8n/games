// Géométrie d'une enquête, calculée une fois : pièce et meuble de chaque
// case, voisins « à côté » (orthogonaux ET dans la même pièce). Une case
// HORS PLAN (« . » dans le plan) n'est d'aucune pièce et personne ne s'y
// tient : le plan dessine la forme du lieu (une île, un temple).

/** La lettre d'une case hors plan. */
export const HORS = '.';

import { FURNITURE } from './furniture.js';

/** @typedef {import('./types.js').Puzzle} Puzzle */
/** @typedef {import('./types.js').Pos} Pos */
/** @typedef {import('./types.js').FurnitureType} FurnitureType */

/**
 * @typedef {{
 *   puzzle: Puzzle, n: number,
 *   room: (r: number, c: number) => string,
 *   furniture: (r: number, c: number) => FurnitureType | null,
 *   blocked: (r: number, c: number) => boolean,
 *   hors: (r: number, c: number) => boolean,
 *   seat: (r: number, c: number) => boolean,
 *   beside: (r: number, c: number) => Pos[],
 *   free: Pos[],
 * }} Board
 */

/** @type {WeakMap<Puzzle, Board>} */
const cache = new WeakMap();

/** @param {Puzzle} puzzle @returns {Board} */
export function boardOf(puzzle) {
  const hit = cache.get(puzzle);
  if (hit) return hit;
  const n = puzzle.size;
  /** @type {(FurnitureType | null)[]} */
  const furn = new Array(n * n).fill(null);
  for (const piece of puzzle.furniture) {
    for (const [r, c] of piece.cells) if (inside(n, r, c)) furn[r * n + c] = piece.type;
  }
  /** @param {number} r @param {number} c */
  const room = (r, c) => puzzle.layout[r][c];
  /** @param {number} r @param {number} c */
  const furniture = (r, c) => furn[r * n + c];
  /** @param {number} r @param {number} c */
  const kind = (r, c) => {
    const f = furniture(r, c);
    return f ? FURNITURE[f] : null;
  };
  /** @type {Pos[][]} */
  const besideList = [];
  /** @type {Pos[]} */
  const free = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      /** @type {Pos[]} */
      const nb = [];
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const R = r + dr, C = c + dc;
        if (inside(n, R, C) && room(R, C) === room(r, c) && room(r, c) !== HORS) nb.push([R, C]);
      }
      besideList.push(nb);
      if (kind(r, c) !== 'block' && room(r, c) !== HORS) free.push([r, c]);
    }
  }
  /** @type {Board} */
  const board = {
    puzzle, n, room, furniture, free,
    blocked: (r, c) => kind(r, c) === 'block' || room(r, c) === HORS,
    hors: (r, c) => room(r, c) === HORS,
    seat: (r, c) => kind(r, c) === 'seat',
    beside: (r, c) => besideList[r * n + c],
  };
  cache.set(puzzle, board);
  return board;
}

/** @param {number} n @param {number} r @param {number} c */
export const inside = (n, r, c) => r >= 0 && c >= 0 && r < n && c < n;

/** « C2 » pour [1, 2]. @param {Pos} pos */
export const coord = ([r, c]) => String.fromCharCode(65 + c) + (r + 1);

/** @param {Pos} a @param {Pos} b */
export const samePos = (a, b) => a[0] === b[0] && a[1] === b[1];
