// Les personnages de One Piece, dessinés d'après leurs IMAGES (fiche :
// docs/conviction-onepiece-personnages.md). Même carré de 120 et mêmes
// expressions que les créatures (bete.js) : calme, démasqué, qui proteste,
// victime. De face.

import { dessiner, T, L, l } from './bete.js';

/** @typedef {import('../engine/types.js').Person} Person */
/** @typedef {import('./bete.js').Dessin} Dessin */

const S = '14 6 92 92';
/** Le cou et les épaules. @param {string} c */
const epaules = (c) => `<path d="M6 122C8 100 26 90 46 86h28c20 4 38 14 40 36z" fill="${c}"${L}/>`;
/** Un visage ovale. @param {number} cx @param {number} cy @param {number} rx @param {number} ry @param {string} peau */
const visage = (cx, cy, rx, ry, peau) => `<rect x="${cx - 7}" y="${cy + ry - 8}" width="14" height="16" fill="${peau}"${L}/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${peau}"${L}/>`;
/** Des sourcils. @param {number} y @param {string} c @param {number} [w] */
const sourcils = (y, c, w = 2.6) => `<path d="M47 ${y}c3-2 6-2 9-1M64 ${y - 1}c3-1 6-1 9 1" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;

/** @type {Record<string, Dessin>} */
const PERSOS = {
  // ---------- La Rêverie ----------
  cobra: {
    fond: '#efe2c4', serre: S,
    corps: `<path d="M34 96c-8-20-6-50 6-66 8-10 32-10 40 0 12 16 14 46 6 66z" fill="#1f1a1c"${L}/>`
      + `<path d="M40 40c-4 10-4 22-2 34M80 40c4 10 4 22 2 34M36 60c-2 10 0 22 4 30M84 60c2 10 0 22-4 30" stroke="#6a6468" stroke-width="2" fill="none"/>`
      + epaules('#4a2a5a') + `<path d="M44 88l16 22 16-22z" fill="#2f7a5a"${l(2)}/><path d="M48 88l12 16 12-16" stroke="#e0c040" stroke-width="2.4" fill="none"/>`
      + `<path d="M30 112h60l2 10H28z" fill="#e07a2a"${L}/><path d="M36 122v-4M44 122v-4M52 122v-4M60 122v-4M68 122v-4M76 122v-4M84 122v-4" stroke="#b8541a" stroke-width="1.6"/>`
      + visage(60, 54, 15, 19, '#b5805a') + sourcils(46, '#1f1a1c', 3.2)
      + `<path d="M60 54c-1 4-3 7-1 8" stroke="#8a5a3a" stroke-width="1.4" fill="none"/><path d="M50 66c4-2 7-2 10 0 3-2 6-2 10 0" stroke="#4a4448" stroke-width="2" fill="none"/>`
      + `<path d="M56 72c0 6 2 12 4 18 2-6 4-12 4-18z" fill="#1f1a1c"${l(1.4)}/><path d="M57 84h6" stroke="#e0c040" stroke-width="2"/>`,
    yeux: [[53, 53, 3], [67, 53, 3]], bouche: [60, 70, 8],
  },
  sabo: {
    fond: '#d6e2ec', serre: S,
    corps: epaules('#1c1c22') + `<path d="M46 88h28l-4 34H50z" fill="#2f5a9a"${l(1.6)}/>`
      + `<path d="M50 84c-6 4-8 10-4 14 4-2 8 0 10 4 2-4 6-4 8 0 2-4 6-6 10-4 4-4 2-10-4-14z" fill="#f6f4ee"${L}/><path d="M52 94c4 6 12 6 16 0" stroke="#c8c4bc" stroke-width="1.4" fill="none"/>`
      + `<path d="M40 70c-6-14-4-30 6-38h28c10 8 12 24 6 38z" fill="#e8c46a"${L}/>`
      + visage(60, 58, 15, 17, '#f3d2b4')
      + `<path d="M44 52c4-8 10-12 16-12 8 0 14 4 18 12-6-4-12-5-18-4-6 0-12 2-16 4z" fill="#e8c46a"${l(1.4)}/>`
      + `<path d="M64 52c4-1 8 0 11 3 1 4 0 8-3 10-3-3-6-6-8-13z" fill="#e8a088" opacity=".55"/>`
      + `<ellipse cx="60" cy="38" rx="34" ry="5" fill="#1c1c22"${L}/><path d="M44 38V12c0-3 32-3 32 0v26z" fill="#1c1c22"${L}/>`
      + `<path d="M44 30h32" stroke="#5a8ac8" stroke-width="5"/><circle cx="53" cy="30" r="4.4" fill="#7ab6e8"${l(1.6)}/><circle cx="67" cy="30" r="4.4" fill="#7ab6e8"${l(1.6)}/>`
      + sourcils(50, '#c8a040'),
    yeux: [[53, 58, 3.2], [67, 58, 3.2]], bouche: [60, 70, 7],
  },
  vivi: {
    fond: '#f4dce6', serre: S,
    corps: `<path d="M30 104c-6-26-4-60 10-74 10-10 30-10 40 0 14 14 16 48 10 74z" fill="#6cc4e0"${L}/>`
      + `<path d="M38 50c-4 16-4 34 0 50M82 50c4 16 4 34 0 50" stroke="#4aa4c4" stroke-width="2" fill="none"/>`
      + epaules('#f2a0c0') + `<path d="M6 122C8 104 18 94 34 90l8 32zM114 122c-2-18-12-28-28-32l-8 32z" fill="#c0303a"${L}/><path d="M34 90l8 32M86 90l-8 32" stroke="#e0c040" stroke-width="2.4"/>`
      + visage(60, 58, 14, 17, '#f2cba6')
      + `<path d="M44 52c2-12 8-18 16-18s14 6 16 18c-4-6-10-9-16-9s-12 3-16 9z" fill="#6cc4e0"${l(1.4)}/><path d="M46 52c-2 10-2 22 0 30M74 52c2 10 2 22 0 30" stroke="#6cc4e0" stroke-width="4" fill="none" stroke-linecap="round"/>`
      + `<circle cx="44" cy="64" r="2.4" fill="none" stroke="#e0c040" stroke-width="1.6"/><circle cx="76" cy="64" r="2.4" fill="none" stroke="#e0c040" stroke-width="1.6"/>`
      + `<g transform="translate(38 42)">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-4" rx="3" ry="4.4" fill="#d8303a" stroke="#8f1f23" stroke-width=".8" transform="rotate(${a})"/>`).join('')}<circle r="2" fill="#f2d16b"/></g>`
      + sourcils(51, '#4aa4c4', 1.8) + `<path d="M48 58l-2-1.4M72 58l2-1.4" ${l(1.4)}/>`,
    yeux: [[53, 59, 3.6], [67, 59, 3.6]], bouche: [60, 70, 6],
  },
  wapol: {
    fond: '#e6dcea', serre: S,
    corps: epaules('#b0303a') + `<circle cx="60" cy="104" r="2.4" fill="#e0c040"/><circle cx="60" cy="114" r="2.4" fill="#e0c040"/>`
      + Array.from({ length: 11 }, (_, k) => { const a = Math.PI * (0.9 + k * 0.12); return `<path d="M${(60 + Math.cos(a) * 26).toFixed(1)} ${(58 + Math.sin(a) * 24).toFixed(1)}l${(Math.cos(a) * 12).toFixed(1)} ${(Math.sin(a) * 12).toFixed(1)}" stroke="${T}" stroke-width="9" stroke-linecap="round"/><path d="M${(60 + Math.cos(a) * 26).toFixed(1)} ${(58 + Math.sin(a) * 24).toFixed(1)}l${(Math.cos(a) * 12).toFixed(1)} ${(Math.sin(a) * 12).toFixed(1)}" stroke="#6a3a8a" stroke-width="6" stroke-linecap="round"/>`; }).join('')
      + `<ellipse cx="60" cy="62" rx="27" ry="25" fill="#c9c2c4"${L}/>`
      + `<path d="M40 32c0-16 40-16 40 0v6H40z" fill="#1f1a24"${L}/><path d="M36 38h48" stroke="${T}" stroke-width="4" stroke-linecap="round"/>`
      + sourcils(46, '#4a2a5a', 3),
    yeux: [[51, 52, 3], [69, 52, 3]], bouche: [60, 72, 34],
    // La bouche de fer-blanc : un grand sourire plein de dents plates.
    bouches: {
      '': `<path d="M38 64c6 18 38 18 44 0z" fill="#f4f2ee"${L}/><path d="M44 66v9M50 66v12M56 66v13M62 66v13M68 66v12M74 66v9M40 71h40" stroke="#9a9590" stroke-width="1.4"/>`,
      choc: `<path d="M38 62h44c0 16-8 26-22 26S38 78 38 62z" fill="#4a1712"${L}/><path d="M38 62h44v6H38z" fill="#f4f2ee"${l(1.4)}/><path d="M44 62v6M50 62v6M56 62v6M62 62v6M68 62v6M74 62v6" stroke="#9a9590" stroke-width="1.2"/>`,
      fier: `<rect x="38" y="64" width="44" height="12" rx="3" fill="#f4f2ee"${L}/><path d="M44 64v12M50 64v12M56 64v12M62 64v12M68 64v12M74 64v12M38 70h44" stroke="#9a9590" stroke-width="1.4"/>`,
      victime: `<rect x="40" y="66" width="40" height="8" rx="3" fill="#dcd8d2"${L}/><path d="M46 66v8M52 66v8M58 66v8M64 66v8M70 66v8M76 66v8" stroke="#9a9590" stroke-width="1.2"/>`,
    },
  },
  neptune: {
    fond: '#cfe6ef', serre: S,
    corps: epaules('#f2cfb6') + `<path d="M20 108c6-4 10-2 14 2M86 110c4-4 8-6 14-2" stroke="#4a6a9a" stroke-width="2" fill="none"/>`
      + Array.from({ length: 22 }, (_, k) => { const a = Math.PI * (k / 21) * 2; const r = k % 2 ? 40 : 36; return `<circle cx="${(60 + Math.cos(a) * r * 0.9).toFixed(1)}" cy="${(70 + Math.sin(a) * r).toFixed(1)}" r="11" fill="#f08a2c"${l(2.4)}/>`; }).join('')
      + `<ellipse cx="60" cy="70" rx="34" ry="36" fill="#f08a2c"/>` + [[44, 80], [60, 90], [76, 80], [50, 98], [70, 98], [60, 104]].map(([x, y]) => `<path d="M${x - 5} ${y}c2-4 8-4 10 0" stroke="#c4641a" stroke-width="1.8" fill="none"/>`).join('')
      + `<ellipse cx="60" cy="52" rx="17" ry="14" fill="#f6d2b8"${L}/><circle cx="60" cy="56" r="4" fill="#e0605a"${l(1.4)}/>`
      + `<path d="M50 24l2-10 4 6 4-8 4 8 4-6 2 10z" fill="#e0b030"${l(1.6)}/><circle cx="60" cy="20" r="1.8" fill="#d8303a"/>`
      + sourcils(44, '#c4641a', 3),
    yeux: [[53, 49, 2.4], [67, 49, 2.4]], bouche: [60, 68, 10],
  },
  charlos: {
    fond: '#e2ecd8', serre: S,
    corps: epaules('#f4f4ef') + `<path d="M38 90c6 6 14 8 22 8s16-2 22-8l2 6c-6 6-14 8-24 8s-18-2-24-8z" fill="#5fa04a"${L}/><path d="M44 96c5 3 10 4 16 4s11-1 16-4" stroke="#e0c040" stroke-width="2.4" fill="none"/>`
      + `<circle cx="48" cy="112" r="3" fill="#4a7ab8"/><circle cx="72" cy="112" r="3" fill="#d8303a"/>`
      + `<path d="M52 36c-4-12 0-26 10-30 8-2 12 6 8 12-3 4-8 2-7-2-4 4-6 10-3 20z" fill="#1f1a1c"${L}/>`
      + `<path d="M42 50c0-12 8-18 18-18s18 6 18 18z" fill="#1f1a1c"${L}/>`
      + visage(60, 58, 16, 18, '#e2bd96') + `<path d="M44 52v18M76 52v18" stroke="#1f1a1c" stroke-width="4" stroke-linecap="round"/>`
      + sourcils(50, '#1f1a1c', 2.6) + `<path d="M58 60c-2 4-1 6 2 6" stroke="#a87a5a" stroke-width="1.6" fill="none"/>`,
    dessus: `<circle cx="60" cy="58" r="44" fill="#dff0f8" fill-opacity=".14" stroke="#9ccbe0" stroke-width="2"/><path d="M30 36c6-10 14-16 24-18" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`,
    yeux: [[53, 57, 3], [67, 57, 3]], bouche: [60, 72, 12],
    bouches: { '': `<path d="M52 72c4-3 12-3 16 0-4 3-12 3-16 0z" fill="#c46a5a"${l(1.6)}/>` },
  },
  imu: {
    fond: '#3a2a36', serre: S,
    corps: `<path d="M2 122C6 92 30 80 60 80s54 12 58 42z" fill="#0c0a0e"/>`
      + [[46, 28, 6], [52, 22, 2], [60, 18, 0], [68, 22, -2], [74, 28, -6]].map(([x, y, d]) => `<path d="M${x - 3} ${y + 10}l${d / 2} -${y - 2}l3 ${y - 2}z" fill="#0c0a0e"/>`).join('')
      + `<ellipse cx="60" cy="56" rx="22" ry="28" fill="#0c0a0e"/><path d="M48 80h24v8H48z" fill="#0c0a0e"/>`,
    yeux: [[51, 56, 4.6], [69, 56, 4.6]], bouche: [60, 72, 0], sansBouche: true,
    // Des yeux rouges cerclés, sans pupille.
    oeil: (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#e0303a"/><circle cx="${x}" cy="${y}" r="${r * 0.55}" fill="none" stroke="#3a0a0e" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="${r * 1.6}" fill="#e0303a" opacity=".18"/>`,
  },
  // ---------- Egghead ----------
  vegapunk: {
    fond: '#f2e4e8', serre: S,
    corps: epaules('#f6f6f2') + `<path d="M48 88l12 30 12-30z" fill="#f2a0b0"${l(1.6)}/><circle cx="56" cy="96" r="1.6" fill="#d8303a"/><circle cx="62" cy="104" r="1.6" fill="#d8303a"/><circle cx="58" cy="112" r="1.6" fill="#d8303a"/>`
      + [-1, 1].map((s) => Array.from({ length: 5 }, (_, k) => `<path d="M${60 + s * 14} ${44 + k * 6}l${s * (16 - k * 2)} ${-6 + k * 2}" stroke="${T}" stroke-width="7" stroke-linecap="round"/><path d="M${60 + s * 14} ${44 + k * 6}l${s * (16 - k * 2)} ${-6 + k * 2}" stroke="#f4f4f2" stroke-width="4.6" stroke-linecap="round"/>`).join('')).join('')
      + visage(60, 62, 16, 22, '#f4d2b8')
      + `<path d="M42 44c0-16 8-26 18-26s18 10 18 26c-6 2-12 3-18 3s-12-1-18-3z" fill="#d33a2e"${L}/><path d="M50 26c4-4 8-5 12-4" stroke="#f08a7a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
      + `<path d="M60 18c0-6 2-10 4-12" ${l(3)}/><path d="M63 10c6-4 12-2 14 2-6 2-10 1-14-2z" fill="#5fa04a"${l(1.4)}/>`
      + `<ellipse cx="60" cy="64" rx="4" ry="3.4" fill="#e8b49a"${l(1.4)}/>`
      + `<path d="M46 72c4-4 10-4 14-1 4-3 10-3 14 1-4 4-10 5-14 2-4 3-10 2-14-2z" fill="#f4f4f2"${l(1.4)}/>`
      + sourcils(52, '#d8d4d0', 3),
    // Sa langue, toujours sortie, qui pend jusqu'à la poitrine.
    dessus: `<path d="M56 78c-2 14 0 30 4 36 4-6 6-22 4-36z" fill="#e87a90"${l(1.6)}/><path d="M60 82v24" stroke="#c45a70" stroke-width="1.2"/>`,
    yeux: [[55, 57, 2.8], [65, 57, 2.8]], bouche: [60, 78, 6],
  },
  york: {
    fond: '#f6e2c8', serre: S,
    corps: `<path d="M30 104c-6-26-4-60 10-74 10-10 30-10 40 0 14 14 16 48 10 74z" fill="#f0cf6a"${L}/>`
      + epaules('#f08a2c')
      + `<rect x="47" y="102" width="9" height="13" rx="4" fill="none" stroke="#fff" stroke-width="2.6"/><path d="M71 103c-4-1-8 2-8 7v1m0 0c0-3 2-4 4-4s4 1 4 4-2 4-4 4-4-1-4-4z" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`
      + visage(60, 58, 14, 16, '#f8d8bc')
      + `<path d="M44 52c2-12 8-18 16-18s14 6 16 18c-6-5-10-7-16-7s-10 2-16 7z" fill="#f0cf6a"${l(1.4)}/>`
      + `<path d="M42 38h36" stroke="${T}" stroke-width="4"/><circle cx="51" cy="36" r="6" fill="#f08a2c"${L}/><circle cx="69" cy="36" r="6" fill="#f08a2c"${L}/><circle cx="51" cy="36" r="2.6" fill="#ffd8a8"/><circle cx="69" cy="36" r="2.6" fill="#ffd8a8"/>`
      + [[49, 65], [52, 66], [68, 66], [71, 65]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#c4783a"/>`).join('') + sourcils(51, '#d8a840', 1.8),
    dessus: `<path d="M58 71c0 4 1 6 3 6s3-2 3-6z" fill="#e87a90"${l(1.2)}/>`,
    yeux: [[53, 58, 3.6], [67, 58, 3.6]], bouche: [60, 70, 7],
  },
  lilith: {
    fond: '#e6dcf0', serre: S,
    corps: epaules('#6a3ab0') + `<path d="M20 104c10-4 20-4 30 0M70 104c10-4 20-4 30 0M14 116c14-4 26-4 36 0M70 116c12-4 24-4 36 0" stroke="#4a2a8a" stroke-width="2" fill="none"/>`
      + `<path d="M46 84h28v10c-8 4-20 4-28 0z" fill="#f4b8c8"${L}/>`
      + `<path d="M38 74c-6-18-2-36 10-42 8-4 18-4 26 0 12 6 14 24 8 42z" fill="#f08a3a"${L}/>`
      + visage(60, 58, 14, 16, '#f6d6c0') + `<rect x="66" y="64" width="9" height="5" rx="1.4" fill="#f2e2c8" stroke="#c8a888" stroke-width="1" transform="rotate(-14 70 66)"/>`
      + `<path d="M34 54c0-16 12-28 26-28s26 12 26 28" stroke="${T}" stroke-width="5" fill="none"/><rect x="28" y="50" width="10" height="18" rx="4" fill="#2a2a30"${L}/><rect x="82" y="50" width="10" height="18" rx="4" fill="#2a2a30"${L}/>`
      + sourcils(51, '#c4642a', 1.8),
    // La mèche qui lui cache un œil.
    dessus: `<path d="M42 46c4-10 12-14 22-12-4 4-6 10-6 18-2 6-6 10-12 12-4-4-6-10-4-18z" fill="#f08a3a"${L}/><path d="M64 36c6 2 10 6 12 12" stroke="#c4642a" stroke-width="2" fill="none"/>`,
    yeux: [[53, 59, 3.6], [67, 59, 3.6]], bouche: [60, 71, 6],
  },
  atlas: {
    fond: '#fbe4ea', serre: S,
    corps: epaules('#e05a6a') + `<path d="M54 96h12v12h6l-12 12-12-12h6z" fill="#f2d16b"${l(1.4)}/>`
      + `<path d="M38 88c6-4 14-6 22-6s16 2 22 6c-4 6-12 8-22 8s-18-2-22-8z" fill="#f8f6f2"${L}/>`
      + [[34, 50], [36, 36], [46, 26], [60, 22], [74, 26], [84, 36], [86, 50], [32, 64], [88, 64]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12" fill="${x < 60 ? '#f8f4ee' : x > 60 ? '#f6a6c0' : '#fbd0dc'}"${L}/>`).join('')
      + `<path d="M30 58c-8 0-12 6-10 12 2 4 8 4 10 0 0-3-3-4-5-2" fill="none"${l(5)}/><path d="M30 58c-8 0-12 6-10 12 2 4 8 4 10 0 0-3-3-4-5-2" fill="none" stroke="#a8763a" stroke-width="3"/>`
      + `<path d="M90 58c8 0 12 6 10 12-2 4-8 4-10 0 0-3 3-4 5-2" fill="none"${l(5)}/><path d="M90 58c8 0 12 6 10 12-2 4-8 4-10 0 0-3 3-4 5-2" fill="none" stroke="#a8763a" stroke-width="3"/>`
      + visage(60, 60, 16, 16, '#f8dcc4') + `<ellipse cx="49" cy="66" rx="4" ry="2.4" fill="#f08a9a" opacity=".6"/><ellipse cx="71" cy="66" rx="4" ry="2.4" fill="#f08a9a" opacity=".6"/>`
      + `<path d="M44 50c4-8 10-10 16-10s12 2 16 10c-6-2-10-3-16-3s-10 1-16 3z" fill="#fbd0dc"${l(1.2)}/>`,
    yeux: [[52, 59, 4.6], [68, 59, 4.6]], bouche: [60, 71, 6],
  },
  shaka: {
    fond: '#dfe4ee', serre: S,
    corps: epaules('#22305a') + `<path d="M44 88v34M76 88v34" stroke="#f2c230" stroke-width="3"/><path d="M28 96l10 10M92 96l-10 10" stroke="#f2c230" stroke-width="2.4"/>`
      + `<path d="M30 92c-4-30 6-62 30-66 24 4 34 36 30 66z" fill="#22305a"${L}/>`
      + `<path d="M38 70c0-24 8-38 22-38s22 14 22 38c0 12-10 20-22 20s-22-8-22-20z" fill="#18181c"${L}/>`
      + `<rect x="44" y="50" width="32" height="24" rx="4" fill="#2a2a30"/><rect x="47" y="54" width="10" height="16" rx="4" fill="none" stroke="#f2c230" stroke-width="3"/><path d="M63 57l4-3v16" stroke="#f2c230" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<path d="M44 46c6-4 26-4 32 0" stroke="#4a4a54" stroke-width="2.4" fill="none"/>`,
    yeux: [], bouche: [60, 82, 0], sansBouche: true,
  },
  edison: {
    fond: '#e2f0dc', serre: S,
    corps: epaules('#4aa04a') + `<path d="M48 96h24v20H48z" fill="#f4f4ef"${L}/>`
      + `<path d="M40 40c-6-14-6-28 0-34 6 4 8 16 6 32zM80 40c6-14 6-28 0-34-6 4-8 16-6 32z" fill="#4aa04a"${L}/><path d="M42 36c-2-8-2-18 0-24M78 36c2-8 2-18 0-24" stroke="#e8f2e4" stroke-width="3" stroke-linecap="round"/>`
      + `<circle cx="60" cy="60" r="26" fill="#4aa04a"${L}/><ellipse cx="60" cy="64" rx="19" ry="17" fill="#f4f4ef"${L}/>`
      + `<path d="M40 54h40v12H40z" fill="#18181c"/><path d="M53 40c-2 0-3 1.4-3 3s1 3 3 3 3-1.4 3-3-1-3-3-3zM62 40h4l-2 3c2 0 3 1 3 2.4 0 1.4-1.4 2.4-3 2.4" stroke="#18181c" stroke-width="1.6" fill="none"/>`,
    yeux: [[52, 60, 4], [68, 60, 4]], bouche: [60, 74, 6],
  },
  pythagore: {
    fond: '#f0e2d6', serre: S,
    corps: `<path d="M8 122C10 98 32 86 60 86s50 12 52 36z" fill="#f2e6cc"${L}/><path d="M20 122c2-18 18-28 40-28s38 10 40 28" fill="#d8403a"/>`
      + `<rect x="49" y="102" width="9" height="13" rx="4" fill="none" stroke="#f2e6cc" stroke-width="2.6"/><path d="M70 115V102l-7 9h10" stroke="#f2e6cc" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<path d="M50 24l-4-12M70 24l4-12" ${l(2.6)}/><circle cx="46" cy="10" r="3.4" fill="#f2c230"${l(1.4)}/><circle cx="74" cy="10" r="3.4" fill="#f2c230"${l(1.4)}/>`
      + `<ellipse cx="60" cy="54" rx="28" ry="30" fill="#f2e6cc"${L}/><path d="M32 52c0-18 12-28 28-28s28 10 28 28c-8 2-18 3-28 3s-20-1-28-3z" fill="#d8403a"${L}/>`
      + `<rect x="40" y="52" width="40" height="14" rx="7" fill="#18181c"/>`,
    yeux: [[52, 59, 4], [68, 59, 4]], bouche: [60, 74, 8],
  },
};

/** Les personnages connus (pour la validation des enquêtes). */
export const PERSOS_CONNUS = Object.keys(PERSOS);

/** @param {Person} person @param {'' | 'choc' | 'fier'} [mood] @param {boolean} [serre] */
export function onepiece(person, mood = '', serre = false) {
  return dessiner(PERSOS[/** @type {string} */ (person.look.perso)] ?? PERSOS.sabo, person, mood, serre);
}
