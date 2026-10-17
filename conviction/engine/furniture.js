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
  bureau: 'block',
  tonneau: 'block',
  coffre: 'block',
  armure: 'block',
  statue: 'block',
  armoire: 'block',
  comptoir: 'block',
  lit: 'seat',
  banquette: 'seat',
  trone: 'seat',
  transat: 'seat',
  tabouret: 'seat',
  tapis: 'floor',
  ancre: 'block',
  champignon: 'block',
  souche: 'seat',
  rocher: 'block',
  nenuphar: 'seat',
  pissenlit: 'block',
  corail: 'block',
  anemone: 'seat',
  coquillage: 'seat',
  ecran: 'block',
  cuve: 'block',
  sphere: 'block',
  console: 'block',
  capsule: 'block',
  arbre: 'block',
  siege: 'seat',
  obelisque: 'block',
  sphinx: 'block',
  palmier: 'block',
  barque: 'seat',
  sarcophage: 'block',
  jarre: 'block',
  brasero: 'block',
};

/** @param {string} t @returns {t is FurnitureType} */
export const isFurnitureType = (t) => Object.hasOwn(FURNITURE, t);
