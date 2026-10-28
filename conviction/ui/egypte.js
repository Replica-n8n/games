// Les dieux d'Égypte à tête d'animal, dessinés d'après les peintures des
// tombes (fiche : docs/conviction-egypte-personnages.md). De PROFIL tournés
// vers la droite, comme dans la peinture égyptienne et comme nos créatures
// (bete.js) : même carré de 120, même contour, mêmes expressions. Isis,
// Nephthys et Osiris sont des bustes avec un costume (costumes.js).

import { dessiner, L, l } from './bete.js';

/** @typedef {import('../engine/types.js').Person} Person */
/** @typedef {import('./bete.js').Dessin} Dessin */

const PEAU = '#b8683e';
/** Les épaules, la peau ocre rouge des hommes peints. */
const epaules = `<path d="M2 122C4 102 22 92 44 90h26c22 2 42 12 46 32z" fill="${PEAU}"${L}/><path d="M14 112c6-10 16-16 28-18" stroke="#d68a5a" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
/** Le large collier (ousekh) : des rangs or, bleu, rouge. */
const collier = [['#d8b04a', 0], ['#2e5d9f', 1], ['#d8b04a', 2], ['#b8442e', 3], ['#3a9a8a', 4]]
  .map(([c, k]) => `<path d="M${34 - +k * 3} 92C${42 - +k * 2} ${102 + +k * 4} ${76 + +k * 2} ${102 + +k * 4} ${86 + +k * 3} 92" stroke="${c}" stroke-width="4.6" fill="none"/>`).join('')
  + `<path d="M19 92C30 114 90 114 101 92" ${l(1.4)}/>`;
/** La coiffe rayée qui tombe derrière la tête sur l'épaule. @param {string} a @param {string} b */
const coiffe = (a, b) => `<path d="M30 46C30 34 40 26 52 26h10l-4 64H26c-2-16 0-30 4-44z" fill="${a}"${L}/>`
  // Les rayures suivent le bord de la coiffe (elles dépassaient en haut, vu en gros plan).
  + [[34, 35.5], [44, 31], [54, 29.6], [64, 28.6], [74, 27.6], [84, 26.8]].map(([y, x]) => `<path d="M${x} ${y}H${61 - (y - 26) / 16}" stroke="${b}" stroke-width="4.4"/>`).join('');
/** Un œil égyptien : en amande, cerclé de khôl qui file vers l'arrière. */
const oeil = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ r, /** @type {boolean} */ choc) =>
  `<path d="M${x - r * 2.4} ${y - r * 0.2}L${x - r * 1.3} ${y}" stroke="#120a06" stroke-width="1.6" stroke-linecap="round"/>`
  + `<path d="M${x - r * 1.4} ${y}C${x - r * 0.6} ${y - r * (choc ? 1.5 : 1.1)} ${x + r * 0.8} ${y - r * (choc ? 1.5 : 1.1)} ${x + r * 1.5} ${y}C${x + r * 0.8} ${y + r * (choc ? 1.3 : 0.9)} ${x - r * 0.6} ${y + r * (choc ? 1.3 : 0.9)} ${x - r * 1.4} ${y}z" fill="#fff" stroke="#120a06" stroke-width="1.6"/>`
  + `<circle cx="${x + r * 0.15}" cy="${y}" r="${r * (choc ? 0.45 : 0.62)}" fill="#120a06"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.25}" r="${r * 0.2}" fill="#fff"/>`;

/** @type {Record<string, Dessin>} */
const DIEUX = {
  // Tête de chacal noire, oreilles hautes et pointues, museau long et fin.
  anubis: {
    fond: '#ecdcb4', serre: '30 0 90 90',
    corps: epaules + collier + coiffe('#d8b04a', '#2e5d9f')
      + `<path d="M46 72v20h20V70z" fill="#1d1a1f"${L}/>`
      + `<path d="M50 36L46 2l18 26z" fill="#1d1a1f"${L}/><path d="M51 30l-2-20 9 14z" fill="#c9a24a"/>`
      + `<path d="M40 66C34 48 42 30 58 28c8-1 14 2 20 8l28 18c4 3 4 9-1 11L82 72c-10 10-30 10-42-6z" fill="#1d1a1f"${L}/>`
      + `<path d="M58 34c10 0 18 6 24 10M80 46l22 10" stroke="#55505c" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
      + `<path d="M64 30L62 4l14 30z" fill="#1d1a1f"${L}/><path d="M65 26l-1-14 7 15z" fill="#c9a24a"/>`
      + `<ellipse cx="107" cy="59" rx="3" ry="2.6" fill="#0a090b"/>`,
    yeux: [[70, 46, 4]], bouche: [94, 67, 16], oeil,
    bouches: {
      '': `<path d="M82 69l22-6" stroke="#8a8090" stroke-width="2" stroke-linecap="round"/>`,
      choc: `<path d="M80 69l26-7-6 12z" fill="#7a1a22" stroke="#0a090b" stroke-width="1.6" stroke-linejoin="round"/>`,
      fier: `<path d="M82 69l22-6" stroke="#8a8090" stroke-width="2" stroke-linecap="round"/><path d="M86 67.5l2 3 2-3.6 2 3.2 2-3.8 2 3" stroke="#f4f1e8" stroke-width="1.4" fill="none"/>`,
      victime: `<path d="M82 69l22-6" stroke="#6a6470" stroke-width="2" stroke-linecap="round"/>`,
    },
  },
  // Tête d'ibis sombre, long bec fin et courbé vers le bas.
  thot: {
    fond: '#d6e8e0', serre: '30 0 90 90', sansBouche: true,
    corps: epaules + collier + coiffe('#2f7fa8', '#3fa37a')
      + `<path d="M51 64v28h14V62z" fill="#1f2a3a"${L}/>`
      // Le bec : large à la base, fin et courbé vers le bas jusqu'à sa pointe.
      + `<path d="M70 39C88 39 102 52 109 72c3 7 4 14 3 20-3-4-6-10-9-16C96 62 86 56 72 54z" fill="#2a2f36"${L}/><path d="M76 43c12 1 22 10 28 24" stroke="#68727e" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
      + `<ellipse cx="59" cy="46" rx="16" ry="18" fill="#1f2a3a"${L}/><path d="M47 35c5-6 12-8 19-5" stroke="#46566e" stroke-width="3" fill="none" stroke-linecap="round"/>`
      + `<path d="M44 40l-8-2M44 46l-9 1M45 52l-8 3" stroke="#1f2a3a" stroke-width="3.4" stroke-linecap="round"/>`,
    yeux: [[66, 44, 3.8]], bouche: [80, 60, 6], oeil,
  },
  // L'animal de Seth : museau courbé vers le bas, oreilles droites au bout carré, rouge.
  seth: {
    fond: '#f0d6c4', serre: '30 0 90 90',
    corps: epaules + collier + coiffe('#2e5d9f', '#d8b04a')
      + `<path d="M46 72v20h20V70z" fill="#a83c28"${L}/>`
      // Les oreilles : deux tiges droites, au bout plat et évasé.
      + `<path d="M48 36l1-28-4-2V2h12v4l-4 2 1 28z" fill="#a83c28"${L}/>`
      + `<path d="M42 66C36 48 44 32 60 30c10 0 18 6 26 16 8 10 16 18 22 28 1 4-3 6-6 3-6-6-14-10-22-8-12 12-30 12-38-3z" fill="#b8442e"${L}/>`
      + `<path d="M62 36c10 2 18 10 24 18M88 52c6 6 12 12 16 20" stroke="#dc7a5a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
      + `<path d="M60 34l1-28-4-2V0h12v4l-4 2 1 28z" fill="#b8442e"${L}/><path d="M62.5 30V10" stroke="#dc7a5a" stroke-width="1.6" stroke-linecap="round"/>`,
    yeux: [[70, 46, 3.8]], bouche: [92, 70, 14], oeil,
    bouches: {
      '': `<path d="M82 70c6-2 12 0 18 4" stroke="#5a1a10" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      choc: `<path d="M80 70c8-4 16 0 22 6-8 2-16 2-22-6z" fill="#5a1010" stroke="#2b1d17" stroke-width="1.6" stroke-linejoin="round"/>`,
      fier: `<path d="M82 70c6-2 12 0 18 4" stroke="#5a1a10" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M86 70.5l1.6 3 1.6-3 1.6 3.2 1.6-2.8 1.6 3" stroke="#f4f1e8" stroke-width="1.3" fill="none"/>`,
      victime: `<path d="M82 70c6-2 12 0 18 4" stroke="#5a1a10" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    },
  },
};

// Le Minotaure (la Crète), de profil lui aussi : tête de taureau, cornes en
// croissant, mufle clair et anneau au nez (fiche : docs/conviction-mythes-personnages.md).
DIEUX.minotaure = {
  fond: '#ecdcc4', serre: '24 0 92 92',
  // Revu (2026-10-17) : le premier ressemblait à un cheval aux oreilles de lapin.
  // Une tête de taureau MASSIVE, un mufle court et large, les cornes qui partent
  // sur les CÔTÉS en croissant, les oreilles à plat dessous.
  corps: `<path d="M0 122C2 98 20 84 44 82h30c24 2 44 16 46 40z" fill="#9a5a3a"${L}/><path d="M14 108c8-12 20-18 32-20M106 108c-6-10-16-16-28-18" stroke="#b8784a" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`
    + `<path d="M40 66v24h36V64z" fill="#5a3a24"${L}/>`
    // La corne du fond, vers l'arrière.
    + `<path d="M46 36C36 30 24 30 12 18C16 32 28 42 44 46z" fill="#e6dcc0"${L}/>`
    + `<path d="M40 50l-20 0 12 10z" fill="#5a3a24"${L}/><path d="M38 52l-12 1 8 5z" fill="#c9a07a"/>`
    + `<path d="M34 70C28 50 36 30 56 26c18-4 32 6 38 18l8 14c4 8 0 16-8 18l-8 2c-8 10-22 14-36 10-8-2-12-8-16-18z" fill="#5a3a24"${L}/>`
    + `<path d="M84 46c12 2 20 10 20 20 0 8-8 12-18 10l-10-4z" fill="#c9a07a"${L}/><ellipse cx="96" cy="60" rx="2" ry="3" fill="#2b1d17"/><path d="M78 74c6 2 12 2 16 0" stroke="#2b1d17" stroke-width="1.6" fill="none"/>`
    + `<path d="M44 38c8-8 18-10 28-6" stroke="#7a5232" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M50 30c4 4 10 6 16 4" stroke="#3a2416" stroke-width="2" fill="none"/>`
    // La corne de devant, en croissant vers l'avant et le haut.
    + `<path d="M62 30C72 26 86 22 92 6C96 18 88 32 70 40z" fill="#efe4c8"${L}/><path d="M74 30c8-4 14-10 16-18" stroke="#ffffff" stroke-width="1.8" fill="none" opacity=".7" stroke-linecap="round"/>`,
  yeux: [[70, 46, 3.6]], bouche: [86, 76, 12],
  dessus: `<circle cx="98" cy="70" r="5" fill="none" stroke="#2b1d17" stroke-width="3.2"/><circle cx="98" cy="70" r="5" fill="none" stroke="#d8b04a" stroke-width="1.8"/>`,
};

/** Les dieux connus (pour la validation des enquêtes). */
export const DIEUX_CONNUS = Object.keys(DIEUX);

/** @param {Person} person @param {'' | 'choc' | 'fier'} [mood] @param {boolean} [serre] */
export function dieu(person, mood = '', serre = false) {
  return dessiner(DIEUX[/** @type {string} */ (person.look.perso)] ?? DIEUX.anubis, person, mood, serre);
}
