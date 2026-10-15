// Validation d'une enquête : données cohérentes, solution unique égale à
// celle notée, coupable unique. La CI refuse toute enquête qui échoue ici.

import { boardOf, inside, coord, samePos } from './board.js';
import { isFurnitureType } from './furniture.js';
import { PAWN_COLORS } from './colors.js';
import { MATERIALS, LOOK, AMBIANCES, nomCourt } from './decor.js';
import { referencedPersons } from './clues.js';
import { solve } from './solver.js';
import { findCulprit } from './culprit.js';

/** @typedef {import('./types.js').Puzzle} Puzzle */
/** @typedef {import('./types.js').Clue} Clue */
/** @typedef {import('./types.js').Placement} Placement */

/**
 * @typedef {{
 *   ok: boolean, errors: string[], solutions: number, culprit: string | null
 * }} Validation
 */

const DIRS = ['north', 'south', 'east', 'west'];
const DIFFICULTIES = ['facile', 'moyen', 'difficile'];

/** @param {Puzzle} puzzle @returns {Validation} */
export function validatePuzzle(puzzle) {
  const errors = structure(puzzle);
  if (errors.length) return { ok: false, errors, solutions: 0, culprit: null };

  const sols = solve(puzzle, 2);
  if (sols.length === 0) errors.push('Aucune solution.');
  if (sols.length > 1) errors.push(`Plusieurs solutions, par exemple :\n  ${show(puzzle, sols[0])}\n  ${show(puzzle, sols[1])}`);
  let culprit = null;
  if (sols.length === 1) {
    const [sol] = sols;
    for (const p of puzzle.persons) {
      if (!samePos(sol[p.id], puzzle.solution[p.id])) {
        errors.push(`La solution notée place ${p.name} en ${coord(puzzle.solution[p.id])}, le solveur en ${coord(sol[p.id])}.`);
      }
    }
    culprit = findCulprit(puzzle, sol);
    if (!culprit) errors.push("Personne n'est seul avec la victime : pas de coupable unique.");
  }
  return { ok: errors.length === 0, errors, solutions: sols.length, culprit };
}

/** @param {Puzzle} p @param {Placement} sol */
const show = (p, sol) => p.persons.map((x) => `${x.name} ${coord(sol[x.id])}`).join(', ');

/**
 * Cohérence des données, avant tout calcul.
 * @param {Puzzle} p @returns {string[]}
 */
function structure(p) {
  /** @type {string[]} */
  const e = [];
  const req = /** @type {const} */ (['id', 'title', 'theme', 'intro', 'floor', 'verdict']);
  for (const k of req) if (typeof p[k] !== 'string' || !p[k].trim()) e.push(`Champ « ${k} » manquant.`);
  if (!DIFFICULTIES.includes(p.difficulty)) e.push(`Difficulté inconnue : ${p.difficulty}.`);
  if (p.ambiance !== undefined && !AMBIANCES.includes(p.ambiance)) e.push(`Ambiance inconnue : ${p.ambiance}.`);
  const n = p.size;
  if (!Number.isInteger(n) || n < 4 || n > 9) return [...e, `Taille invalide : ${n}.`];

  // Plan
  if (!Array.isArray(p.layout) || p.layout.length !== n || p.layout.some((row) => row.length !== n)) {
    return [...e, `Le plan doit faire ${n} lignes de ${n} lettres.`];
  }
  const roomIds = new Set(p.rooms.map((r) => r.id));
  if (roomIds.size !== p.rooms.length) e.push('Deux pièces ont le même id.');
  for (const r of p.rooms) if (!MATERIALS.includes(r.material)) e.push(`La pièce ${r.name} a un sol inconnu « ${r.material} ».`);
  for (const row of p.layout) for (const ch of row) if (!roomIds.has(ch)) e.push(`Lettre de pièce inconnue dans le plan : ${ch}.`);
  if (e.length) return e;
  for (const r of p.rooms) {
    const cells = countCells(p, r.id);
    if (!cells) e.push(`La pièce ${r.name} n'a aucune case.`);
    else if (connected(p, r.id) !== cells) e.push(`La pièce ${r.name} est coupée en deux.`);
  }

  // Meubles
  const seen = new Set();
  for (const f of p.furniture) {
    if (!isFurnitureType(f.type)) { e.push(`Meuble inconnu : ${f.type}.`); continue; }
    for (const [r, c] of f.cells) {
      if (!inside(n, r, c)) { e.push(`Meuble ${f.type} hors du plan.`); continue; }
      const k = r * n + c;
      if (seen.has(k)) e.push(`Deux meubles en ${coord([r, c])}.`);
      seen.add(k);
    }
  }

  // Personnes
  if (p.persons.length !== n) e.push(`Il faut ${n} personnes (une par ligne), il y en a ${p.persons.length}.`);
  const victims = p.persons.filter((x) => x.victim);
  if (victims.length !== 1) e.push(`Il faut exactement une victime, il y en a ${victims.length}.`);
  const ids = new Set(p.persons.map((x) => x.id));
  if (ids.size !== p.persons.length) e.push('Deux personnes ont le même id.');
  // Les notes au crayon montrent l'initiale du nom court, sur la couleur du
  // pion : unique parmi les suspects ; la victime a sa propre pastille.
  const suspects = p.persons.filter((x) => !x.victim);
  const initials = new Set(suspects.map((x) => nomCourt(x.name)[0]));
  if (initials.size !== suspects.length) e.push('Deux personnes ont la même initiale (le pion ne les distinguerait pas).');
  const colors = new Set();
  const furnTypes = new Set(p.furniture.map((f) => f.type));
  for (const x of p.persons) {
    if (!x.testimony || !x.name || !x.role) e.push(`${x.id} : nom, rôle ou témoignage manquant.`);
    if (!x.victim) {
      if (!PAWN_COLORS.includes(x.color)) e.push(`${x.name} : couleur inconnue « ${x.color} ».`);
      if (colors.has(x.color)) e.push(`${x.name} : couleur déjà prise.`);
      colors.add(x.color);
    }
    e.push(...lookErrors(x.look, x.name));
    e.push(...clueErrors(x.clue, x.name, n, roomIds, furnTypes));
    for (const ref of referencedPersons(x.clue)) {
      if (!ids.has(ref)) e.push(`${x.name} cite une personne inconnue : ${ref}.`);
      if (ref === x.id) e.push(`${x.name} : son indice renvoie à son propre id.`);
    }
  }

  // Solution notée
  const b = boardOf(p);
  for (const x of p.persons) {
    const pos = p.solution?.[x.id];
    if (!pos || !inside(n, pos[0], pos[1])) { e.push(`Solution : ${x.name} n'a pas de case valide.`); continue; }
    if (b.blocked(pos[0], pos[1])) e.push(`Solution : ${x.name} est sur un meuble en ${coord(pos)}.`);
  }
  return e;
}

/**
 * @param {Clue} clue @param {string} who @param {number} n
 * @param {Set<string>} rooms @param {Set<string>} furn @returns {string[]}
 */
function clueErrors(clue, who, n, rooms, furn) {
  const bad = (/** @type {string} */ m) => [`${who} : ${m}`];
  if (!clue || typeof clue !== 'object') return bad('indice manquant.');
  switch (clue.type) {
    case 'besideObject': case 'onObject':
      if (!isFurnitureType(clue.object)) return bad(`meuble inconnu « ${clue.object} ».`);
      if (!furn.has(clue.object)) return bad(`aucun meuble « ${clue.object} » dans ce plan.`);
      return [];
    case 'inRoom':
      return rooms.has(clue.room) ? [] : bad(`pièce inconnue « ${clue.room} ».`);
    case 'seated': case 'alone':
      return [];
    case 'row': case 'column':
      return Number.isInteger(clue.index) && clue.index >= 0 && clue.index < n ? [] : bad(`numéro de ${clue.type === 'row' ? 'ligne' : 'colonne'} hors du plan.`);
    case 'relative':
      if (!DIRS.includes(clue.dir)) return bad(`direction inconnue « ${clue.dir} ».`);
      if (clue.distance !== undefined && !(Number.isInteger(clue.distance) && clue.distance > 0)) return bad('distance invalide.');
      return typeof clue.person === 'string' ? [] : bad('personne manquante.');
    case 'besidePerson': case 'sameRoom': case 'aloneWith':
      return typeof clue.person === 'string' ? [] : bad('personne manquante.');
    case 'not':
      return clueErrors(clue.clue, who, n, rooms, furn);
    case 'and': case 'or':
      if (!Array.isArray(clue.clues) || clue.clues.length < 2) return bad(`« ${clue.type} » demande au moins deux indices.`);
      return clue.clues.flatMap((c) => clueErrors(c, who, n, rooms, furn));
    default:
      return bad(`type d'indice inconnu « ${/** @type {{type: string}} */ (clue).type} ».`);
  }
}

/**
 * @param {import('./types.js').Look | undefined} look @param {string} who
 * @returns {string[]}
 */
function lookErrors(look, who) {
  if (!look || typeof look !== 'object') return [`${who} : apparence manquante.`];
  const e = [];
  for (const k of /** @type {const} */ (['skin', 'hair', 'hairColor', 'outfit'])) {
    if (!LOOK[k].includes(look[k])) e.push(`${who} : apparence « ${k} » inconnue (${look[k]}).`);
  }
  if (look.hat !== undefined && !LOOK.hat.includes(look.hat)) e.push(`${who} : chapeau inconnu (${look.hat}).`);
  for (const x of look.extras ?? []) if (!LOOK.extras.includes(x)) e.push(`${who} : détail inconnu (${x}).`);
  return e;
}

/** @param {Puzzle} p @param {string} id */
function countCells(p, id) {
  let k = 0;
  for (const row of p.layout) for (const ch of row) if (ch === id) k++;
  return k;
}

/** Nombre de cases atteintes depuis la première case de la pièce. @param {Puzzle} p @param {string} id */
function connected(p, id) {
  const n = p.size;
  /** @type {[number, number][]} */
  const stack = [];
  for (let r = 0; r < n && !stack.length; r++) for (let c = 0; c < n; c++) if (p.layout[r][c] === id) { stack.push([r, c]); break; }
  const seen = new Set([stack[0][0] * n + stack[0][1]]);
  while (stack.length) {
    const [r, c] = /** @type {[number, number]} */ (stack.pop());
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const R = r + dr, C = c + dc;
      if (inside(n, R, C) && p.layout[R][C] === id && !seen.has(R * n + C)) { seen.add(R * n + C); stack.push([R, C]); }
    }
  }
  return seen.size;
}
