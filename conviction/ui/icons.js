// Dessins des meubles et des flèches d'annulation.

/** @typedef {import('../engine/types.js').FurnitureType} FurnitureType */

const S = 'stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"';

// Meubles vus de dessus, en couleur, comme sur une maquette : ils posent une
// ombre (style.css) et se lisent même petits. Mêmes dessins dans la légende.
const O = ' stroke="rgb(0 0 0 / .35)" stroke-width=".6"';
const LIVRES = ['#b23a2a', '#2f6b8a', '#d9a13b', '#3f7a4a', '#7a4fb5', '#c2452a', '#e2d6bd'];

/** @type {Record<FurnitureType, string>} */
const PATHS = {
  etagere: `<rect x="1" y="4" width="22" height="16" rx="1" fill="#6b4224"${O}/>` + LIVRES.map((c, i) => `<rect x="${2.5 + i * 2.9}" y="5.5" width="2.4" height="13" fill="${c}"/>`).join(''),
  fauteuil: `<rect x="3" y="3" width="18" height="18" rx="5" fill="#7a2f3a"${O}/><rect x="6.5" y="8" width="11" height="10" rx="3" fill="#a5495a"/><rect x="3" y="3" width="18" height="5" rx="2.5" fill="#64242e"/>`,
  piano: `<path d="M3 3h16c2 0 3 2 3 4 0 3-3 3-3 7s2 4 2 6-1 3-3 3H3z" fill="#141414"${O}/><path d="M5 4.5h11" stroke="#555" stroke-width="1"/><rect x="3" y="3" width="3" height="20" fill="#f4f1ea"/><path d="M3 6h3M3 9h3M3 12h3M3 15h3M3 18h3M3 21h3" stroke="#141414" stroke-width=".6"/>`,
  canape: `<rect x="1" y="5" width="22" height="14" rx="4" fill="#3f5f7a"${O}/><rect x="1" y="5" width="22" height="5" rx="2.5" fill="#2f4b62"/><rect x="4" y="10" width="7.5" height="7" rx="2" fill="#56789a"/><rect x="12.5" y="10" width="7.5" height="7" rx="2" fill="#56789a"/>`,
  cheminee: `<rect x="1" y="2" width="22" height="20" rx="1" fill="#8e8a84"${O}/><rect x="5" y="6" width="14" height="12" rx="1" fill="#2a2420"/><path d="M12 17c-2.5 0-3.5-1.5-3.5-3.2 0-2 2.5-2.8 3-5 1.5 1.5 4 2.8 4 5 0 1.7-1 3.2-3.5 3.2z" fill="#f08a2c"/><path d="M12 17c-1.2 0-1.7-.8-1.7-1.6 0-1 1.2-1.4 1.6-2.6.8.8 1.8 1.4 1.8 2.6 0 .8-.5 1.6-1.7 1.6z" fill="#ffd36b"/>`,
  fourneau: `<rect x="2" y="2" width="20" height="20" rx="2" fill="#3a3d40"${O}/>` + [[8, 8], [16, 8], [8, 16], [16, 16]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#1c1e20" stroke="#6b6f73" stroke-width=".8"/>`).join(''),
  table: `<rect x="2" y="5" width="20" height="14" rx="1.5" fill="#9a6538"${O}/><path d="M2 9h20M2 14h20" stroke="#7d4f2a" stroke-width=".6"/><circle cx="12" cy="12" r="2.5" fill="#e8e1d0"/>`,
  chaise: `<rect x="5" y="7" width="14" height="13" rx="2" fill="#9a6538"${O}/><rect x="5" y="4" width="14" height="4" rx="1.5" fill="#6b4224"/>`,
  plante: `<circle cx="12" cy="12" r="6" fill="#8a4a2a"${O}/>` + [0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="12" cy="5.5" rx="3" ry="6" fill="${a % 120 ? '#4f8a3f' : '#3a6e2f'}" transform="rotate(${a} 12 12)"/>`).join('') + '<circle cx="12" cy="12" r="2.5" fill="#6aa84f"/>',
  fontaine: `<circle cx="12" cy="12" r="11" fill="#b9b3a8"${O}/><circle cx="12" cy="12" r="8.5" fill="#5aa6c8"/><circle cx="12" cy="12" r="5" fill="none" stroke="#bfe6f5" stroke-width=".8"/><circle cx="12" cy="12" r="2.4" fill="#b9b3a8"/>`,
  banc: `<rect x="1" y="7" width="22" height="10" rx="1.5" fill="#7d5130"${O}/><path d="M1 10.3h22M1 13.6h22" stroke="#5a3820" stroke-width=".8"/>`,
};

/** @param {FurnitureType} type @param {string} [cls] */
export const furnitureIcon = (type, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${PATHS[type]}</svg>`;

/** Flèches d'annuler et de rétablir. */
export const UNDO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" ${S} stroke-width="2"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" ${S} stroke-width="2"/></svg>`;
export const REDO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 14 5-5-5-5" ${S} stroke-width="2"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" ${S} stroke-width="2"/></svg>`;
