// Les personnages de One Piece SANS visage humain (Imu, Shaka et les robots),
// dessinés d'après leurs IMAGES (fiche : docs/conviction-onepiece-personnages.md).
// Même carré de 120 et mêmes expressions que les créatures (bete.js). Les
// humains, eux, sont des bustes avec un costume (costumes.js).

import { dessiner, T, L, l } from './bete.js';

/** @typedef {import('../engine/types.js').Person} Person */
/** @typedef {import('./bete.js').Dessin} Dessin */

const S = '14 6 92 92';
/** Le cou et les épaules. @param {string} c */
const epaules = (c) => `<path d="M6 122C8 100 26 90 46 86h28c20 4 38 14 40 36z" fill="${c}"${L}/>`;

/** @type {Record<string, Dessin>} */
const PERSOS = {
  // ---------- La Rêverie ----------
  imu: {
    fond: '#2e2232', serre: S,
    // Une aura rouge sombre derrière, la silhouette, un liseré de lumière sur le bord.
    corps: `<circle cx="60" cy="60" r="56" fill="#4a2030" opacity=".55"/><circle cx="60" cy="58" r="40" fill="#6a2838" opacity=".35"/>`
      + `<path d="M0 122C4 94 28 80 60 80s56 14 60 42z" fill="#0b090d"/><path d="M14 122C20 102 36 92 60 90" stroke="#7a2a3a" stroke-width="2" fill="none" opacity=".7"/>`
      + [[42, 34, 8], [47, 24, 5], [53, 16, 2], [60, 10, 0], [67, 16, -2], [73, 24, -5], [78, 34, -8]].map(([x, y, d]) => `<path d="M${x - 3.2} ${y + 18}L${x + d * 0.4} ${y}L${x + 3.2} ${y + 18}z" fill="#0b090d"/><path d="M${x + d * 0.4} ${y}L${x + 3.2} ${y + 18}" stroke="#8a2a3a" stroke-width="1" opacity=".6"/>`).join('')
      + `<ellipse cx="60" cy="56" rx="22" ry="28" fill="#0b090d"/><path d="M40 46c2-14 10-22 20-24" stroke="#8a2a3a" stroke-width="1.6" fill="none" opacity=".7"/><path d="M48 80h24v12H48z" fill="#0b090d"/>`,
    yeux: [[51, 56, 4.6], [69, 56, 4.6]], bouche: [60, 72, 0], sansBouche: true,
    oeil: (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r * 2.2}" fill="#e0303a" opacity=".16"/><circle cx="${x}" cy="${y}" r="${r}" fill="#e8303c"/><circle cx="${x}" cy="${y}" r="${r * 0.6}" fill="none" stroke="#3a060c" stroke-width="1.6"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.22}" fill="#ffb0b0"/>`,
  },
  // ---------- Egghead ----------
  shaka: {
    fond: '#dde3ee', serre: S,
    corps: epaules('#1f2c56') + `<path d="M6 122C8 104 20 94 36 90" stroke="#3a4a7a" stroke-width="3" fill="none" opacity=".7"/>`
      + `<path d="M44 90v32M76 90v32" stroke="#f2c230" stroke-width="3.4"/><path d="M60 92v30" stroke="#8a93aa" stroke-width="2" stroke-dasharray="3 2"/>`
      + `<path d="M26 104l10 8M94 104l-10 8" stroke="#f2c230" stroke-width="2.6" stroke-linecap="round"/>`
      // La capuche, ses plis, puis le casque noir brillant.
      + `<path d="M28 94c-4-32 6-64 32-68 26 4 36 36 32 68z" fill="#1f2c56"${L}/><path d="M36 84c-2-20 4-40 14-48M84 84c2-20-4-40-14-48" stroke="#33447a" stroke-width="2.4" fill="none"/>`
      + `<path d="M37 70c0-26 9-40 23-40s23 14 23 40c0 13-10 21-23 21S37 83 37 70z" fill="#141418"${L}/>`
      + `<path d="M44 40c4-6 10-8 16-8" stroke="#5a5a66" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M76 52c2 6 2 14 0 22" stroke="#3a3a44" stroke-width="2" fill="none"/>`
      + `<rect x="43" y="50" width="34" height="25" rx="5" fill="#26262e" stroke="#4a4a56" stroke-width="1.2"/>`
      + `<rect x="47" y="54" width="10" height="17" rx="4" fill="none" stroke="#f2c230" stroke-width="3"/><path d="M63 57l4-3v17" stroke="#f2c230" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<path d="M45 52l8 0" stroke="#fff" stroke-width="1.4" opacity=".35"/>`,
    yeux: [], bouche: [60, 82, 0], sansBouche: true,
  },
  edison: {
    fond: '#e0efd9', serre: S,
    corps: epaules('#3f9a44') + `<path d="M6 122C8 104 20 94 36 90" stroke="#6ac06a" stroke-width="3" fill="none" opacity=".7"/><path d="M46 94h28v24H46z" fill="#f4f4ef"${L}/><path d="M50 100h20M50 106h20M50 112h12" stroke="#c8c8c0" stroke-width="1.6"/>`
      // Les oreilles de lapin (des prises) avec leur intérieur clair.
      + `<path d="M38 42c-8-16-8-32 0-38 8 4 10 18 8 36z" fill="#3f9a44"${L}/><path d="M82 42c8-16 8-32 0-38-8 4-10 18-8 36z" fill="#3f9a44"${L}/>`
      + `<path d="M40 36c-3-9-3-20 0-26M80 36c3-9 3-20 0-26" stroke="#e8f4e4" stroke-width="3.4" stroke-linecap="round"/>`
      + `<circle cx="60" cy="60" r="27" fill="#3f9a44"${L}/><path d="M38 52c2-14 12-22 22-22" stroke="#7ad07a" stroke-width="4" fill="none" stroke-linecap="round"/>`
      + `<ellipse cx="60" cy="65" rx="20" ry="17" fill="#f4f4ef"${L}/><path d="M44 72c4 6 10 9 16 9s12-3 16-9" stroke="#d8d8d0" stroke-width="2" fill="none"/>`
      + `<path d="M39 54h42v13H39z" fill="#141418"/><path d="M41 56h10" stroke="#5a5a66" stroke-width="1.6"/>`
      + `<path d="M52 40c-2.4 0-3.6 1.6-3.6 3.6s1.2 3.6 3.6 3.6 3.6-1.6 3.6-3.6-1.2-3.6-3.6-3.6zM63 40h5l-2.6 3c2.4 0 3.6 1.2 3.6 2.8s-1.6 2.8-3.6 2.8" stroke="#141418" stroke-width="1.8" fill="none"/>`
      + `<circle cx="38" cy="66" r="2" fill="#2a6a2e"/><circle cx="82" cy="66" r="2" fill="#2a6a2e"/>`,
    yeux: [[52, 60, 4], [68, 60, 4]], bouche: [60, 75, 6],
  },
  pythagore: {
    fond: '#f2e4d8', serre: S,
    corps: `<path d="M8 122C10 98 32 86 60 86s50 12 52 36z" fill="#f2e6cc"${L}/><path d="M20 122c2-18 18-28 40-28s38 10 40 28" fill="#d23c36"/><path d="M28 108c6-8 16-12 26-12" stroke="#f08070" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`
      + `<rect x="49" y="102" width="9" height="13" rx="4" fill="none" stroke="#f2e6cc" stroke-width="2.6"/><path d="M70 115V102l-7 9h10" stroke="#f2e6cc" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      // Les antennes, puis la tête en œuf : rouge dessus, crème dessous.
      + `<path d="M50 26l-4-14M70 26l4-14" ${l(2.6)}/><circle cx="46" cy="10" r="3.6" fill="#f2c230"${l(1.4)}/><circle cx="74" cy="10" r="3.6" fill="#f2c230"${l(1.4)}/><circle cx="45" cy="9" r="1.2" fill="#fff"/><circle cx="73" cy="9" r="1.2" fill="#fff"/>`
      + `<ellipse cx="60" cy="56" rx="29" ry="31" fill="#f2e6cc"${L}/><path d="M36 72c6 10 14 14 24 14s18-4 24-14" stroke="#d8c8a8" stroke-width="2.6" fill="none"/>`
      + `<path d="M31 54c0-19 12-29 29-29s29 10 29 29c-8 2-18 3-29 3s-21-1-29-3z" fill="#d23c36"${L}/><path d="M40 40c4-6 10-9 18-10" stroke="#f08070" stroke-width="3.4" fill="none" stroke-linecap="round"/>`
      + `<rect x="39" y="52" width="42" height="15" rx="7.5" fill="#141418" stroke="#4a4a56" stroke-width="1.2"/><path d="M44 55h8" stroke="#fff" stroke-width="1.4" opacity=".35"/>`
      + `<circle cx="33" cy="60" r="2.4" fill="#a8a294"/><circle cx="87" cy="60" r="2.4" fill="#a8a294"/>`,
    yeux: [[52, 59.5, 4], [68, 59.5, 4]], bouche: [60, 76, 8],
  },
};

/** Les personnages connus (pour la validation des enquêtes). */
export const PERSOS_CONNUS = Object.keys(PERSOS);

/** @param {Person} person @param {'' | 'choc' | 'fier'} [mood] @param {boolean} [serre] */
export function onepiece(person, mood = '', serre = false) {
  return dessiner(PERSOS[/** @type {string} */ (person.look.perso)] ?? PERSOS.imu, person, mood, serre);
}
