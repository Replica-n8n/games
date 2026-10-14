// Tous les textes de l'app, en français. Une traduction future = un fichier
// de plus avec les mêmes clés.

/** @typedef {import('../engine/types.js').FurnitureType} FurnitureType */

/** « A », « A et B », « A, B et C ». @param {string[]} xs */
export const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} et ${xs[xs.length - 1]}`);

/** « que Céleste », « qu'Eugénie ». @param {string} name */
export const que = (name) => (/^[aeiouyhàâéèêëîïôöûü]/i.test(name) ? `qu'${name}` : `que ${name}`);

/** Au-delà de 3 cases, on compte au lieu d'énumérer. @param {string[]} xs */
const few = (xs) => (xs.length > 3 ? `${xs.length} cases` : list(xs));

/** @param {number} k @param {string} one @param {string} many */
const agree = (k, one, many) => (k > 1 ? many : one);

/** @type {Record<FurnitureType, { name: string, the: string }>} */
export const FURNITURE_NAMES = {
  etagere: { name: 'Étagère', the: "l'étagère" },
  piano: { name: 'Piano', the: 'le piano' },
  cheminee: { name: 'Cheminée', the: 'la cheminée' },
  fourneau: { name: 'Fourneau', the: 'le fourneau' },
  table: { name: 'Table', the: 'la table' },
  plante: { name: 'Plante', the: 'la plante' },
  fontaine: { name: 'Fontaine', the: 'la fontaine' },
  fauteuil: { name: 'Fauteuil', the: 'le fauteuil' },
  canape: { name: 'Canapé', the: 'le canapé' },
  chaise: { name: 'Chaise', the: 'la chaise' },
  banc: { name: 'Banc', the: 'le banc' },
};

/** @param {'row' | 'col'} line @param {number} index */
export const lineName = (line, index) => (line === 'row' ? `la ligne ${index + 1}` : `la colonne ${String.fromCharCode(65 + index)}`);

export const HINT = {
  /** @param {string} a @param {string} b @param {string} line */
  conflict: (a, b, line) => `${a} et ${b} partagent ${line}. Une seule personne par ligne et par colonne.`,
  /** @param {string} name */
  wrong: (name) => `${name} n'est pas à sa place. Retirez ce pion et reprenez son témoignage.`,
  complete: 'Le plan est complet. Regardez qui partage une pièce avec la victime, et avec personne d\'autre.',
  /** @param {string} name @param {string} cell */
  onlyCell: (name, cell) => `${name} : une seule case du plan correspond à son témoignage, ${cell}.`,
  /** @param {string} name @param {number} k @param {string} cell */
  onlyFree: (name, k, cell) => `${name} : des ${k} cases de son témoignage, seule ${cell} a encore sa ligne et sa colonne libres.`,
  /** @param {string} name @param {string[]} cells */
  leaves: (name, cells) => `${name} : son témoignage laisse ${cells.length > 6 ? `${cells.length} cases` : list(cells)}.`,
  /** @param {string} cell */
  remains: (cell) => `Reste ${cell}.`,
  /** @param {string[]} cells */
  taken: (cells) => `${few(cells)} ${agree(cells.length, 'est', 'sont')} sur une ligne ou une colonne déjà prise.`,
  /** @param {string[]} cells */
  clash: (cells) => `${few(cells)} ${agree(cells.length, 'contredirait', 'contrediraient')} un autre témoignage.`,
  /** @param {string[]} cells @param {string} line @param {string} who */
  reserved: (cells, line, who) => `${few(cells)} ${agree(cells.length, 'est', 'sont')} sur ${line}, qui revient à ${who}.`,
  /** @param {string[]} cells @param {string} line @param {string} who */
  mustLine: (cells, line, who) => `${few(cells)} ${agree(cells.length, "n'est", 'ne sont')} pas sur ${line}, ${que(who)} doit occuper.`,
  /** @param {string[]} cells @param {string} who */
  absurd: (cells, who) => (cells.length > 3 ? `Sur ${cells.length} de ces cases` : `En ${list(cells)}`) + `, ${who} n'aurait plus de place.`,
  /** @param {string} who @param {string[]} cells @param {string} line */
  confined: (who, cells, line) => `Pour ${who}, il ne reste que ${list(cells)} : ${line} lui revient.`,
  /** @param {string} who @param {string} line @param {string} cell */
  onlyOneHere: (who, line, cell) => `Personne d'autre ${que(who)} ne peut occuper ${line}, et son témoignage n'y laisse plus que ${cell}.`,
  /** @param {string} who @param {string} line */
  onlyOne: (who, line) => `${who} est la seule personne qui peut encore occuper ${line}.`,
  /** @param {string} who @param {string} cell */
  reveal: (who, cell) => `${who} est en ${cell}.`,
};
