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
  bureau: `<rect x="1" y="4" width="22" height="15" rx="1" fill="#6e4426"${O}/><rect x="3" y="6" width="9" height="7" fill="#f2ead8" transform="rotate(-6 7 9)"/><path d="M4.5 8h6M4.5 10h5" stroke="#8a7f6a" stroke-width=".6"/><circle cx="18" cy="9" r="2" fill="#2a2a2a"/><path d="M17 15h4" stroke="#c9a24a" stroke-width="1.4"/>`,
  tonneau: `<circle cx="12" cy="12" r="10" fill="#8a5a33"${O}/><circle cx="12" cy="12" r="10" fill="none" stroke="#3d3d3d" stroke-width="1.6"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#6e4426" stroke-width=".8"/><circle cx="12" cy="12" r="1.4" fill="#3d2a1a"/>`,
  coffre: `<rect x="2" y="5" width="20" height="14" rx="2" fill="#7a4a26"${O}/><path d="M2 9h20M2 15h20" stroke="#3d3d3d" stroke-width="1.4"/><rect x="10" y="10.5" width="4" height="3" rx=".5" fill="#d9b45a"/>`,
  armure: `<circle cx="12" cy="12" r="10" fill="#4a4f57"${O}/><circle cx="12" cy="12" r="6.5" fill="#a9b0b8"/><path d="M8 12h8M12 8v8" stroke="#4a4f57" stroke-width="1.2"/><circle cx="12" cy="12" r="2" fill="#d9dde2"/>`,
  statue: `<rect x="3" y="3" width="18" height="18" rx="2" fill="#b9b3a8"${O}/><circle cx="12" cy="12" r="6" fill="#e6e2da"/><circle cx="12" cy="10" r="2.6" fill="#f2efe9"/><path d="M8 16c1.5-2.5 6.5-2.5 8 0" fill="#f2efe9"/>`,
  armoire: `<rect x="1" y="3" width="22" height="18" rx="1" fill="#5e3a20"${O}/><path d="M12 3v18" stroke="#3a2414" stroke-width="1.2"/><rect x="3" y="5" width="7" height="14" fill="#6e4426"/><rect x="14" y="5" width="7" height="14" fill="#6e4426"/><circle cx="10.6" cy="12" r=".9" fill="#d9b45a"/><circle cx="13.4" cy="12" r=".9" fill="#d9b45a"/>`,
  comptoir: `<rect x="1" y="6" width="22" height="12" rx="1.5" fill="#5e3a20"${O}/><rect x="1" y="6" width="22" height="4" fill="#8a5a33"/><circle cx="6" cy="14" r="1.6" fill="#c8e0e8"/><circle cx="12" cy="14" r="1.6" fill="#c8e0e8"/><circle cx="18" cy="14" r="1.6" fill="#c8e0e8"/>`,
  lit: `<rect x="3" y="1" width="18" height="22" rx="2" fill="#6e4426"${O}/><rect x="4.5" y="2.5" width="15" height="19" rx="1.5" fill="#e9e3d6"/><rect x="6" y="3.5" width="12" height="4" rx="2" fill="#fbf8f2"/><rect x="4.5" y="10" width="15" height="11.5" rx="1" fill="#7d93b2"/>`,
  banquette: `<rect x="1" y="6" width="22" height="12" rx="3" fill="#6b2a2a"${O}/><rect x="1" y="6" width="22" height="4" rx="2" fill="#4f1e1e"/><path d="M8.3 10v8M15.6 10v8" stroke="#4f1e1e" stroke-width=".8"/>`,
  trone: `<rect x="4" y="4" width="16" height="17" rx="2" fill="#7a2f3a"${O}/><rect x="3" y="2" width="18" height="5" rx="1" fill="#c9a24a"/><path d="M6 2l2-1.5L10 2M14 2l2-1.5L18 2" fill="#c9a24a"/><rect x="7" y="9" width="10" height="10" rx="1.5" fill="#a5495a"/>`,
  transat: `<rect x="6" y="1" width="12" height="22" rx="2" fill="#8a5a33"${O}/><path d="M7.5 3h9v18h-9z" fill="#f2f2f2"/><path d="M7.5 3h9M7.5 7h9M7.5 11h9M7.5 15h9M7.5 19h9" stroke="#2f6b8a" stroke-width="1.6"/>`,
  tabouret: `<circle cx="12" cy="12" r="6" fill="#9a6538"${O}/><circle cx="12" cy="12" r="4" fill="#b07a48"/>`,
  tapis: `<rect x="2" y="4" width="20" height="16" rx="1" fill="#8c2f3c"${O}/><rect x="4" y="6" width="16" height="12" fill="none" stroke="#e6c46e" stroke-width="1"/><path d="M12 8l3 4-3 4-3-4z" fill="#e6c46e"/>`,
};

/** @param {FurnitureType} type @param {string} [cls] */
export const furnitureIcon = (type, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${PATHS[type]}</svg>`;

/** Flèches d'annuler et de rétablir. */
export const UNDO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" ${S} stroke-width="2"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" ${S} stroke-width="2"/></svg>`;
export const REDO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 14 5-5-5-5" ${S} stroke-width="2"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" ${S} stroke-width="2"/></svg>`;
