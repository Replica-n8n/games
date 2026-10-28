// Évaluation des indices, en logique à trois valeurs : vrai, faux, ou `null`
// tant que le placement partiel ne permet pas de trancher. Le solveur et
// « Vérifier » s'en servent sur des grilles incomplètes.

import { boardOf } from './board.js';

/** @typedef {import('./types.js').Puzzle} Puzzle */
/** @typedef {import('./types.js').Placement} Placement */
/** @typedef {import('./types.js').Clue} Clue */
/** @typedef {import('./types.js').Tri} Tri */
/** @typedef {import('./types.js').Pos} Pos */
/** @typedef {import('./board.js').Board} Board */

/**
 * Le témoignage de `personId` est-il respecté par `placement` ?
 * `null` si la personne n'est pas placée, ou si l'indice dépend de
 * personnes pas encore placées.
 * @param {Puzzle} puzzle @param {Placement} placement @param {string} personId
 * @returns {Tri}
 */
export function evaluateClue(puzzle, placement, personId) {
  const person = puzzle.persons.find((p) => p.id === personId);
  if (!person) throw new Error(`Personne inconnue : ${personId}`);
  return evalClue(boardOf(puzzle), person.clue, personId, placement);
}

/**
 * @param {Board} b @param {Clue} clue @param {string} self @param {Placement} pl
 * @returns {Tri}
 */
export function evalClue(b, clue, self, pl) {
  const me = pl[self];
  if (!me) return null;
  const [r, c] = me;
  switch (clue.type) {
    case 'besideObject':
      return b.beside(r, c).some(([R, C]) => b.furniture(R, C) === clue.object);
    case 'onObject':
      return b.furniture(r, c) === clue.object;
    case 'inRoom':
      return b.room(r, c) === clue.room;
    case 'seated':
      return b.seat(r, c);
    case 'row':
      return r === clue.index;
    case 'column':
      return c === clue.index;
    case 'relative': {
      const o = pl[clue.person];
      if (!o) return null;
      const vertical = clue.dir === 'north' || clue.dir === 'south';
      const sign = clue.dir === 'north' || clue.dir === 'west' ? 1 : -1;
      // Écart positif quand je suis bien du côté annoncé.
      const gap = vertical ? (o[0] - r) * sign : (o[1] - c) * sign;
      if (gap <= 0) return false;
      if (clue.distance !== undefined && gap !== clue.distance) return false;
      if (clue.aligned && (vertical ? o[1] !== c : o[0] !== r)) return false;
      return true;
    }
    case 'besidePerson': {
      const o = pl[clue.person];
      if (!o) return null;
      return b.beside(r, c).some(([R, C]) => R === o[0] && C === o[1]);
    }
    case 'sameRoom': {
      const o = pl[clue.person];
      if (!o) return null;
      return b.room(o[0], o[1]) === b.room(r, c);
    }
    case 'aloneWith': {
      const room = b.room(r, c);
      const o = pl[clue.person];
      if (o && b.room(o[0], o[1]) !== room) return false;
      const others = othersInRoom(b, pl, room, [self, clue.person]);
      if (others > 0) return false;
      return o && allPlaced(b, pl) ? true : null;
    }
    case 'alone': {
      const others = othersInRoom(b, pl, b.room(r, c), [self]);
      if (others > 0) return false;
      return allPlaced(b, pl) ? true : null;
    }
    case 'not': {
      const v = evalClue(b, clue.clue, self, pl);
      return v === null ? null : !v;
    }
    case 'and': {
      let open = false;
      for (const sub of clue.clues) {
        const v = evalClue(b, sub, self, pl);
        if (v === false) return false;
        if (v === null) open = true;
      }
      return open ? null : true;
    }
    case 'or': {
      let open = false;
      for (const sub of clue.clues) {
        const v = evalClue(b, sub, self, pl);
        if (v === true) return true;
        if (v === null) open = true;
      }
      return open ? null : false;
    }
  }
}

/** @param {Board} b @param {Placement} pl @param {string} room @param {string[]} except */
function othersInRoom(b, pl, room, except) {
  let k = 0;
  for (const id in pl) {
    if (except.includes(id)) continue;
    const [R, C] = pl[id];
    if (b.room(R, C) === room) k++;
  }
  return k;
}

/** @param {Board} b @param {Placement} pl */
const allPlaced = (b, pl) => b.puzzle.persons.every((p) => pl[p.id]);

/**
 * Toutes les personnes citées par un indice (pour valider les données).
 * @param {Clue} clue @returns {string[]}
 */
export function referencedPersons(clue) {
  switch (clue.type) {
    case 'relative': case 'besidePerson': case 'sameRoom': case 'aloneWith':
      return [clue.person];
    case 'not': return referencedPersons(clue.clue);
    case 'and': case 'or': return clue.clues.flatMap(referencedPersons);
    default: return [];
  }
}
