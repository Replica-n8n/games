// Indices : une déduction simple et justifiée, en texte.
// Ordre : une erreur du joueur d'abord (deux pions sur une ligne, un pion
// mal placé), puis la déduction la plus simple qui place quelqu'un :
//   1. une seule case possible pour une personne ;
//   2. une ligne ou une colonne que seule une personne peut occuper ;
//   3. une personne enfermée dans une ligne ou une colonne, qui la prend aux autres ;
//   4. l'absurde : « si X était en B3, Y n'aurait plus de place » ;
//   5. en dernier recours, la réponse.
// Les étapes 2 à 4 ne placent personne : elles retirent des cases, puis on
// recommence, et le texte final raconte ce chemin. Le niveau le plus haut
// atteint mesure la difficulté.

import { boardOf, coord, samePos } from './board.js';
import { evalClue } from './clues.js';
import { candidates, fits } from './solver.js';
import { HINT, lineName } from '../i18n/fr.js';

/** @typedef {import('./types.js').Puzzle} Puzzle */
/** @typedef {import('./types.js').Placement} Placement */
/** @typedef {import('./types.js').Pos} Pos */
/** @typedef {import('./board.js').Board} Board */

/**
 * Pourquoi une case a été retirée à une personne. `step` = l'étape du
 * raisonnement qui l'a retirée, citée dans le texte si l'explication s'en sert.
 * @typedef {{ type: 'reserved', by: string, line: 'row' | 'col', index: number, step: number }
 *   | { type: 'mustLine', line: 'row' | 'col', index: number, step: number }
 *   | { type: 'absurd', other: string }} Reason
 */

/**
 * @typedef {{
 *   kind: 'conflict' | 'wrong' | 'complete' | 'deduction' | 'reveal',
 *   text: string, cells: Pos[], level: number,
 *   place?: { person: string, pos: Pos },
 * }} Hint
 */

export const LEVEL = { single: 1, onlyOne: 2, confined: 3, absurd: 4, reveal: 5 };

/** @param {Puzzle} puzzle @param {Placement} placement @returns {Hint} */
export function nextHint(puzzle, placement) {
  const b = boardOf(puzzle);
  const placed = puzzle.persons.filter((p) => placement[p.id]);
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placement[placed[i].id], c = placement[placed[j].id];
      const line = a[0] === c[0] ? lineName('row', a[0]) : a[1] === c[1] ? lineName('col', a[1]) : null;
      if (line) return { kind: 'conflict', text: HINT.conflict(placed[i].name, placed[j].name, line), cells: [a, c], level: 0 };
    }
  }
  for (const p of placed) {
    const pos = placement[p.id];
    if (!samePos(pos, puzzle.solution[p.id])) return { kind: 'wrong', text: HINT.wrong(p.name), cells: [pos], level: 0 };
  }
  if (placed.length === puzzle.persons.length) {
    const victim = puzzle.persons.find((p) => p.victim);
    return { kind: 'complete', text: HINT.complete, cells: victim ? [placement[victim.id]] : [], level: 0 };
  }
  return deduce(b, placement);
}

/** @param {Board} b @param {Placement} placement @returns {Hint} */
function deduce(b, placement) {
  const P = b.puzzle;
  const pl = { ...placement };
  const name = (/** @type {string} */ id) => /** @type {import('./types.js').Person} */ (P.persons.find((p) => p.id === id)).name;
  const todo = P.persons.filter((p) => !pl[p.id]).map((p) => p.id);
  const key = (/** @type {Pos} */ [r, c]) => r * b.n + c;
  /** @type {Map<string, Map<number, Reason>>} */
  const elim = new Map(todo.map((id) => [id, new Map()]));
  const elimOf = (/** @type {string} */ id) => /** @type {Map<number, Reason>} */ (elim.get(id));
  /** @param {string} id @param {Placement} [where] */
  const cands = (id, where = pl) => candidates(b, where, id).filter((pos) => !elimOf(id).has(key(pos)));
  /** @type {{ text: string, person: string, kind: 'onlyOne' | 'confined', line?: 'row' | 'col', index?: number }[]} */
  const steps = [];
  let level = LEVEL.single;
  const IDX = { row: 0, col: 1 };

  for (let guard = 0; guard < 500; guard++) {
    /** @type {Map<string, Pos[]>} */
    const C = new Map(todo.map((id) => [id, cands(id)]));
    const cs = (/** @type {string} */ id) => /** @type {Pos[]} */ (C.get(id));

    // 1. Une seule case possible.
    for (const id of todo) if (cs(id).length === 1) return single(id, cs(id)[0]);

    // 2. Une ligne ou une colonne libre que seule une personne peut occuper.
    let moved = false;
    const used = { row: new Set(Object.values(pl).map((p) => p[0])), col: new Set(Object.values(pl).map((p) => p[1])) };
    for (const line of /** @type {const} */ (['row', 'col'])) {
      for (let idx = 0; idx < b.n && !moved; idx++) {
        if (used[line].has(idx)) continue;
        const who = todo.filter((id) => cs(id).some((pos) => pos[IDX[line]] === idx));
        if (who.length !== 1) continue;
        const q = who[0];
        const outside = cs(q).filter((pos) => pos[IDX[line]] !== idx);
        if (!outside.length) continue;
        for (const pos of outside) elimOf(q).set(key(pos), { type: 'mustLine', line, index: idx, step: steps.length });
        steps.push({ text: HINT.onlyOne(name(q), lineName(line, idx)), person: q, kind: 'onlyOne', line, index: idx });
        level = Math.max(level, LEVEL.onlyOne);
        moved = true;
      }
    }
    if (moved) continue;

    // 3. Une personne enfermée dans une ligne ou une colonne la prend aux autres.
    for (const id of todo) {
      const mine = cs(id);
      if (!mine.length) continue;
      for (const line of /** @type {const} */ (['row', 'col'])) {
        const idx = mine[0][IDX[line]];
        if (!mine.every((pos) => pos[IDX[line]] === idx)) continue;
        let hit = false;
        for (const other of todo) {
          if (other === id) continue;
          for (const pos of cs(other)) {
            if (pos[IDX[line]] !== idx) continue;
            elimOf(other).set(key(pos), { type: 'reserved', by: id, line, index: idx, step: steps.length });
            hit = true;
          }
        }
        if (hit) {
          steps.push({ text: HINT.confined(name(id), mine.map(coord), lineName(line, idx)), person: id, kind: 'confined' });
          level = Math.max(level, LEVEL.confined);
          moved = true;
          break;
        }
      }
      if (moved) break;
    }
    if (moved) continue;

    // 4. L'absurde : les cases d'une personne qui ne laisseraient plus de
    // place à quelqu'un. S'il ne lui en reste qu'une, on la place ; sinon on
    // retire ces cases et on recommence par les règles simples.
    /** @type {{ id: string, killed: [Pos, string][] } | null} */
    let first = null;
    for (const id of [...todo].sort((x, y) => cs(x).length - cs(y).length)) {
      /** @type {[Pos, string][]} */
      const killed = [];
      for (const pos of cs(id)) {
        const other = dead(id, pos);
        if (other) killed.push([pos, other]);
      }
      if (!killed.length || killed.length === cs(id).length) continue;
      if (killed.length === cs(id).length - 1) {
        for (const [pos, other] of killed) elimOf(id).set(key(pos), { type: 'absurd', other });
        level = Math.max(level, LEVEL.absurd);
        const left = /** @type {Pos} */ (cs(id).find((pos) => !killed.some(([k]) => samePos(k, pos))));
        return single(id, left);
      }
      first ??= { id, killed };
    }
    if (first) {
      for (const [pos, other] of first.killed) elimOf(first.id).set(key(pos), { type: 'absurd', other });
      level = Math.max(level, LEVEL.absurd);
      moved = true;
    }
    if (moved) continue;
    break;
  }

  // 5. Rien ne se déduit simplement : on donne la réponse.
  const id = todo[0];
  const pos = P.solution[id];
  return { kind: 'reveal', text: HINT.reveal(name(id), coord(pos)), cells: [pos], level: LEVEL.reveal, place: { person: id, pos } };

  /**
   * Si `id` était en `pos`, qui n'aurait plus de place ? On place aussi les
   * personnes qui n'ont plus qu'une case, jusqu'à l'impasse ou au calme.
   * @param {string} id @param {Pos} pos @returns {string | null}
   */
  function dead(id, pos) {
    /** @type {Placement} */
    const sim = { ...pl, [id]: pos };
    for (let changed = true; changed;) {
      changed = false;
      for (const q of todo) {
        if (sim[q]) continue;
        const c = cands(q, sim);
        if (!c.length) return q;
        if (c.length === 1) { sim[q] = c[0]; changed = true; }
      }
    }
    if (P.persons.every((p) => sim[p.id])) {
      const broken = P.persons.find((p) => evalClue(b, p.clue, p.id, sim) !== true);
      if (broken) return broken.id;
    }
    return null;
  }

  /** @param {string} id @param {Pos} pos @returns {Hint} */
  function single(id, pos) {
    const person = /** @type {import('./types.js').Person} */ (P.persons.find((p) => p.id === id));
    const clueCells = b.free.filter((cell) => evalClue(b, person.clue, id, { ...pl, [id]: cell }) !== false);
    const used = { row: new Set(), col: new Set() };
    for (const k in pl) { used.row.add(pl[k][0]); used.col.add(pl[k][1]); }
    /** @type {Map<string, { text: (cells: string[]) => string, cells: string[] }>} */
    const groups = new Map();
    /** @param {string} k @param {(cells: string[]) => string} text @param {string} cell */
    const add = (k, text, cell) => {
      const g = groups.get(k) ?? { text, cells: [] };
      g.cells.push(cell);
      groups.set(k, g);
    };
    for (const cell of clueCells) {
      if (samePos(cell, pos)) continue;
      const c = coord(cell);
      const why = elimOf(id).get(key(cell));
      if (used.row.has(cell[0]) || used.col.has(cell[1])) add('taken', HINT.taken, c);
      else if (!fits(b, pl, id, cell)) add('clash', HINT.clash, c);
      else if (why?.type === 'reserved') add(`r${why.by}${why.line}${why.index}`, (cs) => HINT.reserved(cs, lineName(why.line, why.index), name(why.by)), c);
      else if (why?.type === 'mustLine') add(`m${why.line}${why.index}`, (cs) => HINT.mustLine(cs, lineName(why.line, why.index), person.name), c);
      else if (why?.type === 'absurd') add(`a${why.other}`, (cs) => HINT.absurd(cs, name(why.other)), c);
    }
    // Une ligne que seule cette personne peut occuper, et où il ne lui reste
    // qu'une case : une seule phrase suffit.
    const own = steps.find((s) => s.person === id && s.kind === 'onlyOne' && s.line && pos[IDX[s.line]] === s.index);
    let text;
    if (own?.line !== undefined && own.index !== undefined) text = HINT.onlyOneHere(person.name, lineName(own.line, own.index), coord(pos));
    else if (clueCells.length === 1) text = HINT.onlyCell(person.name, coord(pos));
    else if (groups.size === 1 && groups.has('taken') && clueCells.length > 3) text = HINT.onlyFree(person.name, clueCells.length, coord(pos));
    else text = [HINT.leaves(person.name, clueCells.map(coord)), ...[...groups.values()].map((g) => g.text(g.cells)), HINT.remains(coord(pos))].join(' ');
    // Seules les étapes que l'explication cite sont racontées.
    const cited = new Set();
    if (!own) {
      for (const cell of clueCells) {
        const why = elimOf(id).get(key(cell));
        if (why && why.type !== 'absurd') cited.add(why.step);
      }
    }
    const before = steps.filter((s, i) => cited.has(i)).map((s) => s.text);
    return { kind: 'deduction', text: [...before, text].join(' '), cells: clueCells, level, place: { person: id, pos } };
  }
}

/**
 * Suite d'indices depuis une grille vide jusqu'au plan complet, en
 * appliquant chaque placement proposé. Sert aux tests et à la difficulté.
 * @param {Puzzle} puzzle @returns {Hint[]}
 */
export function hintChain(puzzle) {
  /** @type {Placement} */
  const pl = {};
  /** @type {Hint[]} */
  const out = [];
  for (let i = 0; i <= puzzle.persons.length; i++) {
    const h = nextHint(puzzle, pl);
    out.push(h);
    if (!h.place) break;
    pl[h.place.person] = h.place.pos;
  }
  return out;
}

/**
 * Difficulté mesurée : le niveau de déduction le plus haut dont on a besoin,
 * et combien de fois il faut donner la réponse faute de mieux.
 * @param {Puzzle} puzzle
 */
export function rateDifficulty(puzzle) {
  const chain = hintChain(puzzle).filter((h) => h.place);
  const levels = chain.map((h) => h.level);
  return {
    levels,
    max: Math.max(...levels),
    reveals: levels.filter((l) => l === LEVEL.reveal).length,
  };
}
