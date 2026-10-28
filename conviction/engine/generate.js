// Générateur d'enquêtes. Une histoire donne le décor (pièces, sols, meubles),
// les personnes, le coupable et la pièce du crime ; le générateur choisit qui
// était où, puis ajoute des témoignages vrais jusqu'à ce que la solution soit
// unique, retire ceux qui ne servent à rien, et mesure la difficulté avec
// `rateDifficulty`. Même graine = même enquête.

import { boardOf } from './board.js';
import { evalClue } from './clues.js';
import { solve } from './solver.js';
import { findCulprit } from './culprit.js';
import { rateDifficulty, LEVEL } from './hint.js';
import { validatePuzzle } from './validate.js';
import { testimony } from '../i18n/temoignages.js';

/** @typedef {import('./types.js').Puzzle} Puzzle */
/** @typedef {import('./types.js').Clue} Clue */
/** @typedef {import('./types.js').Pos} Pos */
/** @typedef {import('./types.js').Placement} Placement */
/** @typedef {import('./types.js').Difficulty} Difficulty */

/**
 * Une histoire : tout ce qu'il faut pour une enquête, sauf les témoignages et
 * la solution. `persons` n'a ni `clue` ni `testimony`.
 * @typedef {Omit<Puzzle, 'persons' | 'solution' | 'difficulty'> & {
 *   persons: Omit<import('./types.js').Person, 'clue' | 'testimony'>[],
 *   culprit: string, crimeRoom?: string,
 * }} Story
 */

/** Générateur pseudo-aléatoire à graine (mulberry32). @param {number} seed */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * La difficulté d'après la suite des déductions (niveaux de `hintChain`).
 * Seuils réglés sur des enquêtes générées : voir tools/conviction-generateur.mjs --mesure.
 * @param {number[]} levels @returns {Difficulty}
 */
export function classify(levels) {
  const n = (/** @type {number} */ l) => levels.filter((x) => x === l).length;
  const max = Math.max(...levels);
  if (max <= LEVEL.onlyOne && n(LEVEL.onlyOne) <= 2) return 'facile';
  if (max >= LEVEL.absurd && n(LEVEL.absurd) >= 2) return 'difficile';
  return 'moyen';
}

/**
 * @param {Story} story @param {Difficulty} difficulty @param {number} seed
 * @returns {Puzzle | null} une enquête valide de cette difficulté, ou null
 */
export function generate(story, difficulty, seed, accept = (/** @type {{ levels: number[], max: number, reveals: number }} */ d) => d.reveals === 0 && classify(d.levels) === difficulty) {
  const R = rng(seed);
  const pick = (/** @type {any[]} */ xs) => xs[Math.floor(R() * xs.length)];
  const shuffle = (/** @type {any[]} */ xs) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /** @type {Puzzle} */
  const puzzle = {
    ...story, difficulty, solution: {},
    persons: story.persons.map((p) => ({ ...p, clue: { type: 'seated' }, testimony: '' })),
  };
  delete /** @type {any} */ (puzzle).culprit;
  delete /** @type {any} */ (puzzle).crimeRoom;
  const b = boardOf(puzzle);
  const n = puzzle.size;
  const victim = /** @type {import('./types.js').Person} */ (puzzle.persons.find((p) => p.victim));

  // 1. Qui était où : la victime et le coupable seuls dans la pièce du crime.
  const sol = place();
  if (!sol) return null;
  puzzle.solution = sol;
  if (findCulprit(puzzle, sol) !== story.culprit) return null;

  // 2. Les morceaux de témoignage vrais pour chacun, pondérés selon la difficulté.
  const atoms = new Map(puzzle.persons.map((p) => [p.id, pool(p.id)]));

  /** @type {Map<string, Clue[]>} */
  const chosen = new Map(puzzle.persons.map((p) => [p.id, []]));
  const apply = () => {
    for (const p of puzzle.persons) {
      const cs = /** @type {Clue[]} */ (chosen.get(p.id));
      p.clue = cs.length === 1 ? cs[0] : { type: 'and', clues: cs };
    }
  };
  const count = (limit = 12) => { apply(); return solve(puzzle, limit).length; };

  for (const p of puzzle.persons) /** @type {Clue[]} */ (chosen.get(p.id)).push(weighted(/** @type {Weighted[]} */ (atoms.get(p.id))).clue);
  const MAX_PER = difficulty === 'facile' ? 3 : 3;
  for (let guard = 0; guard < 60 && count() > 1; guard++) {
    // Essayer quelques ajouts et garder celui qui retire le plus de solutions.
    let best = null, bestCount = Infinity;
    for (let k = 0; k < 10; k++) {
      const p = pick(puzzle.persons);
      const cs = /** @type {Clue[]} */ (chosen.get(p.id));
      if (cs.length >= MAX_PER) continue;
      const a = weighted(/** @type {Weighted[]} */ (atoms.get(p.id))).clue;
      if (cs.some((c) => JSON.stringify(c) === JSON.stringify(a))) continue;
      // Une même personne citée deux fois sonne faux (« plus au nord que Cersei, plus à l'est que Cersei »).
      const cite = (/** @type {Clue} */ c) => (c.type === 'not' ? c.clue : c);
      const ref = (/** @type {Clue} */ c) => { const x = cite(c); return 'person' in x ? x.person : null; };
      if (ref(a) && cs.some((c) => ref(c) === ref(a))) continue;
      // Deux pièces pour une seule personne aussi (« dans le salon, mais pas dans la cuisine »),
      // deux fois la même sorte de lien, ou une ligne ET une colonne (la case exacte).
      const sorte = (/** @type {Clue} */ c) => { const x = cite(c); return x.type === 'relative' ? `relative-${x.dir}` : x.type === 'row' || x.type === 'column' ? 'ligne' : x.type; };
      if (cs.some((c) => sorte(c) === sorte(a) && !['besideObject', 'onObject'].includes(cite(a).type))) continue;
      cs.push(a);
      const k2 = count();
      cs.pop();
      if (k2 >= 1 && k2 < bestCount) { bestCount = k2; best = { id: p.id, a }; }
    }
    if (best) /** @type {Clue[]} */ (chosen.get(best.id)).push(best.a);
  }
  if (count(2) !== 1) return null;

  // 3. Retirer ce qui ne sert à rien (chacun garde au moins un morceau).
  for (const p of shuffle(puzzle.persons)) {
    const cs = /** @type {Clue[]} */ (chosen.get(p.id));
    for (const a of shuffle(cs)) {
      if (cs.length <= 1) break;
      const i = cs.indexOf(a);
      cs.splice(i, 1);
      if (count(2) !== 1) cs.splice(i, 0, a);
    }
  }
  apply();

  // 4. Difficulté mesurée, jamais devinée : on refuse ce qui ne correspond pas.
  const d = rateDifficulty(puzzle);
  if (!accept(d)) return null;

  // 5. Les témoignages, écrits depuis les indices.
  for (const p of puzzle.persons) {
    const t = testimony(p.clue, puzzle, p);
    if (!t) return null;
    p.testimony = t;
  }
  return validatePuzzle(puzzle).ok ? puzzle : null;

  // ---------------------------------------------------------------

  /** @returns {Placement | null} */
  function place() {
    const crimeRooms = story.crimeRoom ? [story.crimeRoom] : puzzle.rooms.map((r) => r.id);
    for (let t = 0; t < 400; t++) {
      const crime = pick(crimeRooms);
      const cells = b.free.filter(([r, c]) => b.room(r, c) === crime);
      const v = pick(cells);
      const k = pick(cells.filter(([r, c]) => r !== v[0] && c !== v[1]) ?? []);
      if (!v || !k) continue;
      /** @type {Placement} */
      const pl = { [victim.id]: v, [story.culprit]: k };
      const others = shuffle(puzzle.persons.filter((p) => p.id !== victim.id && p.id !== story.culprit).map((p) => p.id));
      if (fill(pl, others, 0, crime)) return pl;
    }
    return null;
  }

  /** @param {Placement} pl @param {string[]} ids @param {number} i @param {string} crime @returns {boolean} */
  function fill(pl, ids, i, crime) {
    if (i === ids.length) return true;
    const rows = new Set(Object.values(pl).map((p) => p[0])), cols = new Set(Object.values(pl).map((p) => p[1]));
    const cands = shuffle(b.free.filter(([r, c]) => !rows.has(r) && !cols.has(c) && b.room(r, c) !== crime));
    for (const pos of cands.slice(0, 6)) {
      pl[ids[i]] = pos;
      if (fill(pl, ids, i + 1, crime)) return true;
      delete pl[ids[i]];
    }
    return false;
  }

  /** @typedef {{ clue: Clue, w: number }} Weighted */

  /** Morceaux vrais pour `id`, avec leur poids. @param {string} id @returns {Weighted[]} */
  function pool(id) {
    const me = puzzle.solution[id];
    const self = /** @type {import('./types.js').Person} */ (puzzle.persons.find((p) => p.id === id));
    const [r, c] = me;
    const hard = difficulty === 'difficile' ? 3 : difficulty === 'moyen' ? 1.5 : 0.6;
    const easy = difficulty === 'facile' ? 3 : difficulty === 'moyen' ? 1.2 : 0.6;
    /** @type {Weighted[]} */
    const out = [];
    const add = (/** @type {Clue} */ clue, /** @type {number} */ w) => { if (evalClue(b, clue, id, puzzle.solution) === true) out.push({ clue, w }); };
    const room = b.room(r, c);
    // Le coupable ne dit jamais qu'il était dans la pièce du crime : il se désignerait.
    if (!(id === story.culprit && room === b.room(...puzzle.solution[victim.id]))) add({ type: 'inRoom', room }, 3 * easy);
    const types = [...new Set(puzzle.furniture.map((f) => f.type))];
    for (const t of types) {
      add({ type: 'besideObject', object: t }, 3 * easy);
      add({ type: 'onObject', object: t }, 3 * easy);
    }
    if (b.seat(r, c)) add({ type: 'seated' }, 2 * easy); else add({ type: 'not', clue: { type: 'seated' } }, 1);
    add({ type: 'row', index: r }, 0.3 * easy);
    add({ type: 'column', index: c }, 0.3 * easy);
    for (const other of puzzle.rooms) if (other.id !== room) add({ type: 'not', clue: { type: 'inRoom', room: other.id } }, 0.6 * hard);
    for (const t of types) add({ type: 'not', clue: { type: 'besideObject', object: t } }, 0.25 * hard);
    for (const o of puzzle.persons) {
      if (o.id === id) continue;
      // Rien qui désigne d'emblée le coupable : pas de lien direct coupable-victime.
      const pair = new Set([id, o.id]);
      if (pair.has(victim.id) && pair.has(story.culprit)) continue;
      for (const dir of /** @type {const} */ (['north', 'south', 'east', 'west'])) {
        add({ type: 'relative', person: o.id, dir }, 1.4 * hard);
        add({ type: 'relative', person: o.id, dir, distance: 1, aligned: true }, 1.4 * hard);
      }
      add({ type: 'besidePerson', person: o.id }, 1.5 * hard);
      add({ type: 'sameRoom', person: o.id }, 1 * hard);
      add({ type: 'not', clue: { type: 'sameRoom', person: o.id } }, 0.5 * hard);
    }
    if (!self.victim && id !== story.culprit) add({ type: 'alone' }, 1);
    return out;
  }

  /** @param {Weighted[]} xs */
  function weighted(xs) {
    const total = xs.reduce((s, x) => s + x.w, 0);
    let t = R() * total;
    for (const x of xs) { t -= x.w; if (t <= 0) return x; }
    return xs[xs.length - 1];
  }
}
