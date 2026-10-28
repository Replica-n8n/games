// Le coupable est la seule personne seule avec la victime dans une pièce :
// la pièce de la victime contient exactement deux personnes.

import { boardOf } from './board.js';

/** @typedef {import('./types.js').Puzzle} Puzzle */
/** @typedef {import('./types.js').Placement} Placement */

/**
 * Id du coupable, ou `null` si la pièce de la victime ne contient pas
 * exactement une autre personne.
 * @param {Puzzle} puzzle @param {Placement} solution @returns {string | null}
 */
export function findCulprit(puzzle, solution) {
  const b = boardOf(puzzle);
  const victim = puzzle.persons.find((p) => p.victim);
  if (!victim || !solution[victim.id]) return null;
  const [vr, vc] = solution[victim.id];
  const room = b.room(vr, vc);
  const with_ = puzzle.persons.filter((p) => {
    const pos = solution[p.id];
    return !p.victim && pos && b.room(pos[0], pos[1]) === room;
  });
  return with_.length === 1 ? with_[0].id : null;
}
