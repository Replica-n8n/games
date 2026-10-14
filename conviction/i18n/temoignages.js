// Écrire un témoignage à partir de son indice, en français.
// « J'étais assise dans le salon, à côté du piano, mais pas dans la colonne C. »
// La victime ne parle pas : « Le corps gisait dans la cuisine… ».
// Seuls les indices que le générateur produit sont écrits : un `and` de
// morceaux positifs, et des `not` d'un seul morceau.

import { FURNITURE } from '../engine/furniture.js';
import { FURNITURE_NAMES, que, de } from './fr.js';

/** @typedef {import('../engine/types.js').Clue} Clue */
/** @typedef {import('../engine/types.js').Puzzle} Puzzle */
/** @typedef {import('../engine/types.js').Person} Person */

/** « le piano » -> « du piano », « la table » -> « de la table », « l'armoire » -> « de l'armoire ». @param {string} the */
export const deLe = (the) => (the.startsWith('le ') ? `du ${the.slice(3)}` : `de ${the}`);

/** Préposition d'une pièce : son champ `in`, sinon « dans la pièce X ». @param {Puzzle} p @param {string} id */
export function inRoom(p, id) {
  const r = p.rooms.find((x) => x.id === id);
  return r?.in ?? `dans la pièce « ${r?.name ?? id} »`;
}

const DIR = { north: 'au nord', south: 'au sud', east: "à l'est", west: "à l'ouest" };

/**
 * Le morceau de phrase d'un indice simple (« dans le salon »), ou null.
 * @param {Clue} c @param {Puzzle} p @param {Person} self
 * @returns {string | null}
 */
export function fragment(c, p, self) {
  const name = (/** @type {string} */ id) => p.persons.find((x) => x.id === id)?.name ?? id;
  const assis = self.victim ? 'sur un siège' : self.fem ? 'assise' : 'assis';
  switch (c.type) {
    case 'inRoom': return inRoom(p, c.room);
    case 'besideObject': return `à côté ${deLe(FURNITURE_NAMES[c.object].the)}`;
    case 'onObject': return FURNITURE[c.object] === 'seat' && !self.victim ? `${assis} sur ${FURNITURE_NAMES[c.object].the}` : `sur ${FURNITURE_NAMES[c.object].the}`;
    case 'seated': return assis;
    case 'row': return `sur la ligne ${c.index + 1}`;
    case 'column': return `dans la colonne ${String.fromCharCode(65 + c.index)}`;
    case 'relative': return c.aligned && c.distance === 1 ? `juste ${DIR[c.dir]} ${de(name(c.person))}` : `plus ${DIR[c.dir]} ${que(name(c.person))}`;
    case 'besidePerson': return `à côté ${de(name(c.person))}`;
    case 'sameRoom': return `dans la même pièce ${que(name(c.person))}`;
    case 'alone': return self.fem ? 'seule dans la pièce' : 'seul dans la pièce';
    default: return null;
  }
}

/**
 * Le témoignage complet, ou null si l'indice ne s'écrit pas.
 * @param {Clue} clue @param {Puzzle} p @param {Person} self
 * @returns {string | null}
 */
export function testimony(clue, p, self) {
  const parts = clue.type === 'and' ? clue.clues : [clue];
  /** @type {string[]} */ const pos = [];
  /** @type {string[]} */ const neg = [];
  for (const c of parts) {
    if (c.type === 'not') {
      // « pas assis » se dit « debout ».
      if (c.clue.type === 'seated') { pos.push(self.victim ? 'à même le sol' : 'debout'); continue; }
      const f = fragment(c.clue, p, self);
      if (!f) return null;
      neg.push(f);
    } else {
      const f = fragment(c, p, self);
      if (!f) return null;
      pos.push(f);
    }
  }
  // « debout » et « assis » d'abord, puis le lieu, puis le reste.
  pos.sort((a, b) => rank(a) - rank(b));
  const debut = self.victim ? 'Le corps gisait' : "J'étais";
  const debutNeg = self.victim ? "Le corps n'était" : "Je n'étais";
  if (!pos.length) return `${debutNeg} ${neg.length === 1 ? `pas ${neg[0]}` : `ni ${neg.join(' ni ')}`}.`;
  let s = `${debut} ${joinPos(pos)}`;
  if (neg.length) s += `, mais pas ${neg.join(' ni ')}`;
  return `${s}.`;
}

/** Ordre des morceaux : la posture, le meuble, la pièce, puis le reste. @param {string} f */
function rank(f) {
  if (/^(assise?|debout|sur un siège|à même le sol)/.test(f)) return 0;
  if (/^sur (le|la|l') /.test(f) && !/^sur la ligne/.test(f)) return 1;
  if (/^(dans|au|sur|dehors)/.test(f) && !/colonne|ligne|même pièce/.test(f)) return 2;
  if (/^à côté (du|de la|de l')/.test(f)) return 3;
  return 4;
}

/**
 * « assise sur le fauteuil dans le salon, à côté du piano » : la posture, le
 * meuble et la pièce s'enchaînent sans virgule, le reste est séparé.
 * @param {string[]} pos
 */
function joinPos(pos) {
  let s = pos[0];
  for (let i = 1; i < pos.length; i++) {
    const lie = rank(pos[i - 1]) <= 1 && (rank(pos[i]) === 1 || rank(pos[i]) === 2);
    s += (lie ? ' ' : ', ') + pos[i];
  }
  return s;
}
