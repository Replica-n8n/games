// Une partie = la liste de ses actions. Le plan se recalcule en les rejouant :
// annuler et rétablir déplacent seulement un curseur, et la sauvegarde est
// cette liste. Aucun DOM ici : testé dans Node.

import { nextHint, findCulprit, samePos } from '../engine/index.js';

/** @typedef {import('../engine/types.js').Puzzle} Puzzle */
/** @typedef {import('../engine/types.js').Placement} Placement */
/** @typedef {import('../engine/types.js').Pos} Pos */
/** @typedef {import('../engine/hint.js').Hint} Hint */

/**
 * `note` : une initiale au crayon dans une case (« peut-être ici »).
 * @typedef {{ t: 'place', p: string, pos: Pos }
 *   | { t: 'remove', p: string }
 *   | { t: 'mark', pos: Pos }
 *   | { t: 'note', p: string, pos: Pos }
 *   | { t: 'clear' }} Action
 */

/**
 * @typedef {{
 *   v: 1, puzzle: string, actions: Action[], cursor: number,
 *   hints: number, elapsed: number, time: number | null, accused: string | null,
 * }} Save
 */

/** @param {Pos} pos */
const cellKey = ([r, c]) => `${r},${c}`;

/**
 * Rejoue les actions jusqu'au curseur.
 * Poser quelqu'un efface ses notes partout, et toutes les notes de sa ligne,
 * de sa colonne et de sa case : plus personne ne peut y être. Annuler les
 * fait revenir, puisque tout se rejoue.
 * @param {Action[]} actions @param {number} upto
 * @returns {{ placement: Placement, marks: Set<string>, notes: Map<string, Set<string>> }}
 */
export function replay(actions, upto) {
  /** @type {Placement} */
  let placement = {};
  let marks = new Set();
  /** @type {Map<string, Set<string>>} case -> initiales notées */
  let notes = new Map();
  for (const a of actions.slice(0, upto)) {
    if (a.t === 'place') {
      for (const id in placement) if (id !== a.p && samePos(placement[id], a.pos)) delete placement[id];
      placement[a.p] = a.pos;
      marks.delete(cellKey(a.pos));
      for (const [k, set] of notes) {
        const [r, c] = k.split(',').map(Number);
        if (r === a.pos[0] || c === a.pos[1]) notes.delete(k);
        else { set.delete(a.p); if (!set.size) notes.delete(k); }
      }
    } else if (a.t === 'remove') {
      delete placement[a.p];
    } else if (a.t === 'mark') {
      const k = cellKey(a.pos);
      if (marks.has(k)) marks.delete(k); else { marks.add(k); notes.delete(k); }
    } else if (a.t === 'note') {
      const k = cellKey(a.pos);
      const set = notes.get(k) ?? new Set();
      if (set.has(a.p)) set.delete(a.p); else set.add(a.p);
      if (set.size) notes.set(k, set); else notes.delete(k);
      marks.delete(k);
    } else if (a.t === 'clear') {
      placement = {};
      marks = new Set();
      notes = new Map();
    }
  }
  return { placement, marks, notes };
}

export class Game {
  /** @param {Puzzle} puzzle @param {Save | null} [saved] */
  constructor(puzzle, saved) {
    this.puzzle = puzzle;
    const ok = saved && saved.v === 1 && saved.puzzle === puzzle.id && Array.isArray(saved.actions);
    /** @type {Action[]} */
    this.actions = ok ? saved.actions : [];
    this.cursor = ok ? Math.min(saved.cursor, this.actions.length) : 0;
    this.hints = ok ? saved.hints : 0;
    /** Temps de jeu cumulé, en ms, hors périodes où l'onglet est caché. */
    this.elapsed = ok ? saved.elapsed : 0;
    /** Temps au premier plan juste, figé (le record viendra de là). */
    this.time = ok ? saved.time : null;
    this.accused = ok ? saved.accused : null;
    /** @type {number | null} instant du dernier départ du chronomètre */
    this.since = null;
    /** @type {Placement} */
    this.placement = {};
    /** @type {Set<string>} */
    this.marks = new Set();
    /** @type {Map<string, Set<string>>} */
    this.notes = new Map();
    this.refresh();
  }

  refresh() {
    const { placement, marks, notes } = replay(this.actions, this.cursor);
    this.placement = placement;
    this.marks = marks;
    this.notes = notes;
  }

  /** @param {Action} action @param {number} [now] */
  do(action, now = Date.now()) {
    // Le chronomètre part au premier geste, pas à l'ouverture.
    this.start(now);
    this.actions = this.actions.slice(0, this.cursor);
    this.actions.push(action);
    this.cursor++;
    this.refresh();
    this.settle(now);
  }

  get canUndo() { return this.cursor > 0; }
  get canRedo() { return this.cursor < this.actions.length; }

  /** @param {number} [now] */
  undo(now = Date.now()) {
    if (!this.canUndo) return false;
    this.cursor--;
    this.refresh();
    this.settle(now);
    return true;
  }

  /** @param {number} [now] */
  redo(now = Date.now()) {
    if (!this.canRedo) return false;
    this.cursor++;
    this.refresh();
    this.settle(now);
    return true;
  }

  /** @param {Pos} pos @returns {string | null} */
  occupant(pos) {
    for (const id in this.placement) if (samePos(this.placement[id], pos)) return id;
    return null;
  }

  /** @param {Pos} pos */
  marked(pos) { return this.marks.has(cellKey(pos)); }

  /** Initiales notées au crayon dans la case, dans l'ordre des personnes. @param {Pos} pos @returns {string[]} */
  notesAt(pos) {
    const set = this.notes.get(cellKey(pos));
    return set ? this.puzzle.persons.map((p) => p.id).filter((id) => set.has(id)) : [];
  }

  /** Le plan est-il exactement la solution ? */
  get solved() {
    return this.puzzle.persons.every((p) => this.placement[p.id] && samePos(this.placement[p.id], this.puzzle.solution[p.id]));
  }

  /** Personnes qui partagent une ligne ou une colonne. */
  conflicts() {
    const bad = new Set();
    const ids = Object.keys(this.placement);
    for (const a of ids) for (const b of ids) {
      if (a < b && (this.placement[a][0] === this.placement[b][0] || this.placement[a][1] === this.placement[b][1])) { bad.add(a); bad.add(b); }
    }
    return bad;
  }

  /** @returns {Hint} */
  /** @param {number} [now] */
  hint(now = Date.now()) {
    this.start(now);
    const h = nextHint(this.puzzle, this.placement);
    if (h.kind !== 'complete') this.hints++;
    return h;
  }

  /** @param {string} id @returns {boolean} juste ou non */
  accuse(id) {
    this.accused = id;
    return findCulprit(this.puzzle, this.puzzle.solution) === id;
  }

  // ---------- Chronomètre ----------

  get running() { return this.since !== null; }

  /** Le chronomètre court (ou repart) si la partie est commencée. @param {number} [now] */
  resume(now = Date.now()) {
    if (this.actions.length) this.start(now);
  }

  /** @param {number} [now] */
  start(now = Date.now()) {
    if (this.since === null && this.time === null) this.since = now;
  }

  /** @param {number} [now] */
  pause(now = Date.now()) {
    if (this.since !== null) { this.elapsed += now - this.since; this.since = null; }
  }

  /** @param {number} [now] */
  clock(now = Date.now()) {
    if (this.time !== null) return this.time;
    return this.elapsed + (this.since === null ? 0 : now - this.since);
  }

  /** Fige le temps au premier plan juste. @param {number} now */
  settle(now) {
    if (this.time === null && this.solved) {
      this.pause(now);
      this.time = this.elapsed;
    }
  }

  /** @param {number} [now] @returns {Save} */
  toJSON(now = Date.now()) {
    return {
      v: 1, puzzle: this.puzzle.id, actions: this.actions, cursor: this.cursor,
      hints: this.hints, elapsed: this.elapsed + (this.since === null ? 0 : now - this.since),
      time: this.time, accused: this.accused,
    };
  }
}

/** « 4:07 », « 1:02:09 ». @param {number} ms */
export function formatClock(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}
