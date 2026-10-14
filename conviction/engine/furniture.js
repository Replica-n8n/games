// Ce que chaque meuble fait à sa case. Les noms affichés vivent dans
// i18n/fr.js, les dessins dans l'interface.
// - block : personne ne peut s'y tenir (case hachurée) ;
// - seat  : on peut s'y tenir, et on y est « assis » ;
// - floor : repère au sol, on peut s'y tenir debout.

/** @typedef {import('./types.js').FurnitureType} FurnitureType */
/** @typedef {import('./types.js').FurnitureKind} FurnitureKind */

/** @type {Record<FurnitureType, FurnitureKind>} */
export const FURNITURE = {
  etagere: 'block',
  piano: 'block',
  cheminee: 'block',
  fourneau: 'block',
  table: 'block',
  plante: 'block',
  fontaine: 'block',
  fauteuil: 'seat',
  canape: 'seat',
  chaise: 'seat',
  banc: 'seat',
};

/** @param {string} t @returns {t is FurnitureType} */
export const isFurnitureType = (t) => Object.hasOwn(FURNITURE, t);
