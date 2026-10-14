// Dessins des meubles (repris du prototype), au trait, couleur du texte.

/** @typedef {import('../engine/types.js').FurnitureType} FurnitureType */

const S = 'stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"';

/** @type {Record<FurnitureType, string>} */
const PATHS = {
  etagere: `<rect x="3" y="2" width="18" height="20" ${S}/><path d="M3 8h18M3 14h18M6 5v3M9 5v3M14 11v3M17 11v3M7 17v3M11 17v3" ${S}/>`,
  fauteuil: `<path d="M6 11V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5" ${S}/><path d="M4 11a2 2 0 0 1 4 0v3h8v-3a2 2 0 0 1 4 0v6H4z" ${S}/><path d="M6 17v3M18 17v3" ${S}/>`,
  piano: `<rect x="2" y="5" width="20" height="14" ${S}/><path d="M2 12h20M6 12v7M10 12v7M14 12v7M18 12v7" ${S}/><path d="M5 12V9h2v3M12 12V9h2v3" ${S}/>`,
  canape: `<path d="M5 10V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" ${S}/><path d="M2 11a2 2 0 0 1 3 0v3h14v-3a2 2 0 0 1 3 0v6H2z" ${S}/><path d="M5 17v2M19 17v2" ${S}/>`,
  cheminee: `<path d="M2 4h20M4 4v17h16V4" ${S}/><path d="M8 21v-7a4 4 0 0 1 8 0v7" ${S}/><path d="M12 19c-1.5 0-2-1-2-2 0-1.5 2-2 2-3.5.8 1 2 1.8 2 3.5 0 1-.5 2-2 2z" ${S}/>`,
  fourneau: `<rect x="3" y="3" width="18" height="18" ${S}/><circle cx="8.5" cy="8.5" r="2.5" ${S}/><circle cx="15.5" cy="8.5" r="2.5" ${S}/><circle cx="8.5" cy="15.5" r="2.5" ${S}/><circle cx="15.5" cy="15.5" r="2.5" ${S}/>`,
  table: `<rect x="3" y="7" width="18" height="10" rx="1" ${S}/><path d="M6 4v3M12 4v3M18 4v3M6 17v3M12 17v3M18 17v3" ${S}/>`,
  chaise: `<path d="M7 3v9h10V3" ${S}/><path d="M6 12h12M7 12v9M17 12v9M7 7h10" ${S}/>`,
  plante: `<path d="M7 15h10l-1.5 6h-7z" ${S}/><path d="M12 15V9M12 11c-3 0-5-2-5-5 3 0 5 2 5 5zM12 9c0-3 2-5 5-5 0 3-2 5-5 5z" ${S}/>`,
  fontaine: `<circle cx="12" cy="12" r="9" ${S}/><circle cx="12" cy="12" r="5" ${S}/><path d="M12 12V8M10 9c1-1.5 3-1.5 4 0" ${S}/>`,
  banc: `<path d="M3 10h18M3 14h18M5 14v6M19 14v6M5 10V6M19 10V6" ${S}/>`,
};

/** @param {FurnitureType} type @param {string} [cls] */
export const furnitureIcon = (type, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${PATHS[type]}</svg>`;

/** Flèches d'annuler et de rétablir. */
export const UNDO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" ${S} stroke-width="2"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" ${S} stroke-width="2"/></svg>`;
export const REDO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 14 5-5-5-5" ${S} stroke-width="2"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" ${S} stroke-width="2"/></svg>`;
