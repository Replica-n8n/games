// Les créatures des autres jeux de l'Arcade, en portraits : les bestioles du
// chevalier (games/serpentin/) et les habitants du récif du requin
// (games/toto/). Même carré de 120 que les bustes humains (buste.js), même
// contour d'un seul tenant, mêmes expressions : calme, démasqué (« choc »),
// qui proteste (« fier »), et la victime aux yeux fermés.

/** @typedef {import('../engine/types.js').Person} Person */
/** @typedef {'' | 'choc' | 'fier'} Humeur */

const T = '#2b1d17';
const L = ` stroke="${T}" stroke-width="3" stroke-linejoin="round"`;
const l = (/** @type {number} */ w) => ` stroke="${T}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;

/**
 * Chaque espèce : le fond, le corps (avec son contour), les yeux [x, y, rayon],
 * la bouche [x, y, largeur] et ce qui passe devant le visage.
 * @type {Record<string, { fond: string, corps: string, yeux: [number, number, number][], bouche: [number, number, number], dessus?: string, dy?: number }>}
 */
const ESPECES = {
  // ---------- Le monde du chevalier ----------
  escargot: {
    fond: '#d9e8c4',
    corps: `<path d="M40 120c0-30 10-52 28-60 4-12 2-24 6-34M88 120c2-34-4-56-14-64 2-14 6-22 12-34" fill="none"/>`
      + `<path d="M36 120c0-26 6-48 24-60 8-6 12-18 12-30h6c0 12-2 20 0 28 6-10 8-20 12-30h6c-2 12-6 22-10 32 10 10 14 30 14 60z" fill="#d8c79a"${L}/>`
      + `<path d="M74 30l-6-18M84 34l8-18" ${l(3)}/>`
      + `<circle cx="8" cy="96" r="40" fill="#b5652e"${L}/><path d="M8 96m-30 0a30 30 0 1 1 30 30 22 22 0 1 1 -22-22 14 14 0 1 1 14 14 7 7 0 1 1-7-7" stroke="#7a3f18" stroke-width="4" fill="none"/>`,
    yeux: [[68, 24, 7], [92, 28, 7]], bouche: [78, 90, 14], dy: 12,
  },
  lucane: {
    fond: '#e6d9c4',
    corps: `<path d="M30 120c0-24 12-36 30-36s30 12 30 36z" fill="#3a2418"${L}/><path d="M60 86v34" stroke="#5a3a26" stroke-width="2"/>`
      // Les mandibules : deux pinces qui partent de la bouche et se croisent en haut.
      + `<path d="M46 74C30 64 26 40 40 16c4 6 2 12 6 14l-6 6c-2 12 2 24 12 32z" fill="#7a4a2c"${L}/><path d="M74 74C90 64 94 40 80 16c-4 6-2 12-6 14l6 6c2 12-2 24-12 32z" fill="#7a4a2c"${L}/>`
      + `<path d="M40 30l-6 2M80 30l6 2" ${l(2.4)}/>`
      + `<path d="M34 64c0-16 12-24 26-24s26 8 26 24c0 12-12 22-26 22S34 76 34 64z" fill="#4a2c1e"${L}/><path d="M42 52c6-6 18-7 26-3" stroke="#8a5a3a" stroke-width="3" fill="none"/>`
      + `<path d="M40 48c-8 0-14-4-16-10M80 48c8 0 14-4 16-10" ${l(2.2)}/>`,
    yeux: [[49, 62, 6], [71, 62, 6]], bouche: [60, 76, 12],
  },
  araignee: {
    fond: '#e2d6ea',
    corps: [[-1, 0], [1, 0]].map(([s]) => [0, 1, 2, 3].map((k) => `<path d="M${60 + s * 22} ${70 + k * 8}c${s * 16} ${-10 + k * 4} ${s * 30} ${-6 + k * 8} ${s * 40} ${10 + k * 10}" ${l(5)}/><path d="M${60 + s * 22} ${70 + k * 8}c${s * 16} ${-10 + k * 4} ${s * 30} ${-6 + k * 8} ${s * 40} ${10 + k * 10}" stroke="#3a2a4a" stroke-width="2.6" fill="none" stroke-linecap="round"/>`).join('')).join('')
      + `<ellipse cx="60" cy="104" rx="30" ry="22" fill="#2e2238"${L}/><path d="M48 100l12 10 12-10" stroke="#c0392b" stroke-width="4" fill="none"/>`
      + `<circle cx="60" cy="64" r="26" fill="#3e2e4c"${L}/>`
      + `<path d="M42 40l4-16 8 10 6-14 6 14 8-10 4 16z" fill="#d9b45a" stroke="#8a6a2a" stroke-width="1.6" stroke-linejoin="round"/><circle cx="60" cy="33" r="2.4" fill="#c0392b"/>`,
    yeux: [[50, 62, 7.5], [70, 62, 7.5]], bouche: [60, 78, 12],
    dessus: `<circle cx="44" cy="50" r="3" fill="#120a06"/><circle cx="76" cy="50" r="3" fill="#120a06"/><circle cx="45" cy="49" r="1" fill="#fff"/><circle cx="77" cy="49" r="1" fill="#fff"/>`,
  },
  crapaud: {
    fond: '#cfe3d8',
    corps: `<path d="M18 120c0-30 18-44 42-44s42 14 42 44z" fill="#6d9a46"${L}/><path d="M34 120c2-16 12-26 26-26s24 10 26 26z" fill="#d9e2a8"/>`
      + `<path d="M18 74c0-22 18-36 42-36s42 14 42 36c0 14-18 22-42 22s-42-8-42-22z" fill="#7aab4f"${L}/>`
      + `<circle cx="40" cy="40" r="14" fill="#7aab4f"${L}/><circle cx="80" cy="40" r="14" fill="#7aab4f"${L}/>`
      + `<circle cx="30" cy="70" r="2.4" fill="#5a8a3a"/><circle cx="90" cy="66" r="2.4" fill="#5a8a3a"/><circle cx="70" cy="56" r="2" fill="#5a8a3a"/><circle cx="48" cy="58" r="1.8" fill="#5a8a3a"/>`,
    yeux: [[40, 40, 9], [80, 40, 9]], bouche: [60, 76, 34],
  },
  herisson: {
    fond: '#efe1cc',
    corps: Array.from({ length: 13 }, (_, k) => { const a = Math.PI * (0.95 + k * 0.09 / 1.04 * 1.15); const x = 60 + Math.cos(a) * 46, y = 74 + Math.sin(a) * 46; const b = 60 + Math.cos(a - 0.12) * 30, c = 74 + Math.sin(a - 0.12) * 30, d = 60 + Math.cos(a + 0.12) * 30, e = 74 + Math.sin(a + 0.12) * 30; return `<path d="M${b.toFixed(1)} ${c.toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}L${d.toFixed(1)} ${e.toFixed(1)}z" fill="#6b4a32"${L}/>`; }).join('')
      + `<path d="M24 120c0-26 16-40 36-40s36 14 36 40z" fill="#5a3e2a"${L}/>`
      + `<path d="M34 66c0-18 12-28 26-28s26 10 26 28c0 10-8 18-14 24l-12 14-12-14c-6-6-14-14-14-24z" fill="#e2c49a"${L}/>`
      + `<circle cx="60" cy="102" r="5" fill="#1c1410"/>`,
    yeux: [[51, 64, 5.5], [69, 64, 5.5]], bouche: [60, 86, 10],
  },
  papillon: {
    fond: '#e8e4f2',
    corps: `<path d="M60 70C40 40 6 30 10 60c3 22 30 26 50 14z" fill="#f2a33a"${L}/><path d="M60 70c20-30 54-40 50-10-3 22-30 26-50 14z" fill="#f2a33a"${L}/>`
      + `<path d="M60 76c-18 4-40 18-34 36 6 14 26 4 34-16z" fill="#e0703a"${L}/><path d="M60 76c18 4 40 18 34 36-6 14-26 4-34-16z" fill="#e0703a"${L}/>`
      + `<circle cx="30" cy="54" r="7" fill="#fff4d6"/><circle cx="90" cy="54" r="7" fill="#fff4d6"/><circle cx="38" cy="100" r="4" fill="#fff4d6"/><circle cx="82" cy="100" r="4" fill="#fff4d6"/>`
      + `<path d="M54 70c0-10 2-16 6-16s6 6 6 16-2 40-6 40-6-30-6-40z" fill="#3a2a2a"${L}/>`
      + `<circle cx="60" cy="48" r="13" fill="#4a3434"${L}/><path d="M54 37c-4-10-10-16-16-18M66 37c4-10 10-16 16-18" ${l(2.6)}/><circle cx="38" cy="19" r="3" fill="${T}"/><circle cx="82" cy="19" r="3" fill="${T}"/>`,
    yeux: [[55, 47, 4], [65, 47, 4]], bouche: [60, 55, 6],
  },
  // ---------- Le récif du requin ----------
  requin: {
    fond: '#cfe6ef',
    corps: `<path d="M64 26c4-14 14-22 26-24-4 8-6 18-4 30z" fill="#6f7c82"${L}/><path d="M8 120c4-22 18-34 34-38l-10-22 26 14h4l26-14-10 22c16 4 30 16 34 38z" fill="#7d8a90"${L}/>`
      + `<path d="M22 70c0-30 16-48 38-48s38 18 38 48c0 18-16 30-38 30S22 88 22 70z" fill="#8b979c"${L}/>`
      + `<path d="M30 80c8 12 18 16 30 16s22-4 30-16c-8 4-18 6-30 6s-22-2-30-6z" fill="#eef2f2"/>`
      + `<path d="M46 26c6-6 22-6 28 0" stroke="#a4b0b4" stroke-width="3" fill="none"/><path d="M28 64l6 4M28 72l6 3M92 64l-6 4M92 72l-6 3" stroke="#5f6b70" stroke-width="2"/>`,
    yeux: [[42, 56, 6], [78, 56, 6]], bouche: [60, 82, 34],
    dessus: `<path d="M46 85l3 4 3-4 3 4 3-4 3 4 3-4 3 4 3-4" stroke="#fff" stroke-width="1.8" fill="none" stroke-linejoin="round"/>`,
  },
  orque: {
    fond: '#d6e6ef',
    corps: `<path d="M10 120c4-26 22-40 50-40s46 14 50 40z" fill="#1c1e22"${L}/><path d="M34 120c4-14 14-22 26-22s22 8 26 22z" fill="#f4f6f6"/>`
      + `<path d="M20 66c0-28 18-46 40-46s40 18 40 46c0 20-18 32-40 32S20 86 20 66z" fill="#1c1e22"${L}/>`
      + `<path d="M28 74c6 14 18 20 32 20s26-6 32-20c-10 6-20 8-32 8s-22-2-32-8z" fill="#f4f6f6"/>`
      + `<ellipse cx="38" cy="52" rx="10" ry="6" fill="#f4f6f6" transform="rotate(-18 38 52)"/><ellipse cx="82" cy="52" rx="10" ry="6" fill="#f4f6f6" transform="rotate(18 82 52)"/>`,
    yeux: [[44, 62, 4.5], [76, 62, 4.5]], bouche: [60, 80, 26],
  },
  barracuda: {
    fond: '#dbe8ea',
    corps: `<path d="M16 120c6-22 22-32 44-32s38 10 44 32z" fill="#7f97a3"${L}/>`
      + `<path d="M30 60c0-24 14-40 30-40s30 16 30 40c0 22-12 38-30 44-18-6-30-22-30-44z" fill="#9fb4bf"${L}/>`
      + `<path d="M40 82c6 12 12 20 20 24 8-4 14-12 20-24-6 4-12 6-20 6s-14-2-20-6z" fill="#dfe8ec"/>`
      + `<path d="M36 40c8-4 20-5 28-2M38 70c6 2 12 3 18 2" stroke="#6f8792" stroke-width="2" fill="none"/>`,
    yeux: [[47, 50, 7.5], [73, 50, 7.5]], bouche: [60, 84, 22],
    dessus: `<path d="M48 86l3 5 3-5 3 5 3-5 3 5 3-5 3 5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linejoin="round"/>`,
  },
  pieuvre: {
    fond: '#efdfe6',
    corps: [0, 1, 2, 3, 4, 5].map((k) => { const x = 22 + k * 15; return `<path d="M${x} 84c-4 14 ${k % 2 ? 8 : -8} 22 ${k % 2 ? 0 : 4} 36" stroke="${T}" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M${x} 84c-4 14 ${k % 2 ? 8 : -8} 22 ${k % 2 ? 0 : 4} 36" stroke="#8e3a5e" stroke-width="8" fill="none" stroke-linecap="round"/>`; }).join('')
      + `<path d="M26 70c0-38 16-56 34-56s34 18 34 56c0 14-14 22-34 22S26 84 26 70z" fill="#a8456e"${L}/><circle cx="46" cy="36" r="3" fill="#c46a8e"/><circle cx="72" cy="30" r="2.4" fill="#c46a8e"/>`
      // La voilette de veuve : chapeau noir et dentelle.
      + `<path d="M30 34c4-14 18-22 30-22s26 8 30 22c-10-4-20-6-30-6s-20 2-30 6z" fill="#1c1418"${L}/><path d="M30 34c-2 10 0 22 6 30M90 34c2 10 0 22-6 30" stroke="#1c1418" stroke-width="2" fill="none" stroke-dasharray="3 2"/>`,
    yeux: [[47, 60, 8], [73, 60, 8]], bouche: [60, 78, 12],
  },
  tortue: {
    fond: '#e4ebcf',
    corps: `<path d="M6 120c6-26 26-38 54-38s48 12 54 38z" fill="#8a6a3a"${L}/><path d="M24 120l10-18 26-6 26 6 10 18" stroke="#5e4424" stroke-width="3" fill="none"/>`
      + `<path d="M34 66c0-22 12-38 26-38s26 16 26 38c0 18-12 30-26 30S34 84 34 66z" fill="#8fb06a"${L}/>`
      + `<path d="M44 48c4-4 8-6 12-6M66 44c4 0 8 2 10 6" stroke="#6d9050" stroke-width="2" fill="none"/><path d="M46 92c4-2 9-3 14-3s10 1 14 3" stroke="#6d9050" stroke-width="2" fill="none"/>`,
    yeux: [[50, 58, 6], [70, 58, 6]], bouche: [60, 78, 14],
  },
  dauphin: {
    fond: '#d2e9f2',
    corps: `<path d="M14 120c6-24 22-36 46-36s40 12 46 36z" fill="#6f97b0"${L}/>`
      + `<path d="M26 62c0-26 16-42 34-42s34 16 34 42c0 8-2 14-6 18 6 4 8 10 6 14-8 2-16-2-20-6-4 2-9 3-14 3-20 0-34-12-34-29z" fill="#82a9c2"${L}/>`
      + `<path d="M36 76c8 8 18 12 30 12 4 0 8-1 10-2" stroke="#e6f0f4" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="60" cy="26" r="2.4" fill="#5d8aa6"/>`,
    yeux: [[48, 56, 6], [70, 56, 6]], bouche: [72, 82, 16],
  },
  cachalot: {
    fond: '#d2dbe2',
    corps: `<path d="M4 120V58c0-24 18-36 56-36s56 12 56 36v62z" fill="#5c6670"${L}/>`
      + `<path d="M16 96c14 10 30 14 44 14s30-4 44-14" stroke="#4a535c" stroke-width="4" fill="none"/>`
      // Vieux-Borgne : les cicatrices d'un vieux combattant, l'œil gauche crevé.
      + `<path d="M22 40l18 14M28 34l6 12M84 34l14 22M92 30l4 8" stroke="#8e98a2" stroke-width="2.6" stroke-linecap="round"/>`
      + `<path d="M38 64l12-6M38 58l12 6" stroke="${T}" stroke-width="3.4" stroke-linecap="round"/>`,
    yeux: [[76, 62, 6]], bouche: [70, 90, 26],
  },
};

/** Les espèces connues (pour la validation des enquêtes). */
export const ESPECES_CONNUES = Object.keys(ESPECES);

/**
 * @param {Person} person @param {Humeur} [mood] @param {boolean} [serre] cadré sur la tête
 * @returns {string} un <svg> complet
 */
export function bete(person, mood = '', serre = false) {
  const e = ESPECES[/** @type {string} */ (person.look.espece)] ?? ESPECES.escargot;
  const v = !!person.victim;
  let yeux = '', sourcils = '', bouche = '', emotion = '';
  const [bx, by, bw] = e.bouche;
  if (v) {
    // La victime : yeux fermés, bouche close.
    yeux = e.yeux.map(([x, y, r]) => `<path d="M${x - r} ${y}c${r * 0.6} ${r * 0.7} ${r * 1.4} ${r * 0.7} ${r * 2} 0" ${l(2.4)}/>`).join('');
    bouche = `<path d="M${bx - bw / 2} ${by}h${bw}" ${l(2.4)}/>`;
  } else if (mood === 'choc') {
    yeux = e.yeux.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r * 1.45}" fill="#fff"${L.replace('3"', '2"')}/><circle cx="${x}" cy="${y + 0.5}" r="${Math.max(1.4, r * 0.3)}" fill="#120a06"/>`).join('');
    sourcils = e.yeux.map(([x, y, r], k) => `<path d="M${x - r * 1.4} ${y - r * 1.7 + (k ? 0 : 3)}L${x + r * 1.4} ${y - r * 1.7 + (k ? 3 : 0)}" ${l(2.6)}/>`).join('');
    bouche = `<ellipse cx="${bx}" cy="${by + 3}" rx="${Math.max(5, bw / 4)}" ry="7" fill="#4a1712"${L.replace('3"', '2"')}/>`;
    emotion = '<path d="M100 26c4 6 5 10 2 12-3 1.5-5.5-1.5-4-5 .8-2.4 1.2-4 2-7z" fill="#bfe4f7" stroke="#3f84ab" stroke-width="1"/><path d="M20 40c3 4.5 3.6 7 1.6 8.4-2 1-4-1-3-3.6.4-1.6.8-2.8 1.4-4.8z" fill="#bfe4f7" stroke="#3f84ab" stroke-width="1"/>';
  } else {
    yeux = e.yeux.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"${L.replace('3"', '2"')}/><circle cx="${x + r * 0.15}" cy="${y + r * 0.15}" r="${r * 0.55}" fill="#120a06"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.25}" r="${Math.max(0.9, r * 0.22)}" fill="#fff"/>`).join('');
    if (mood === 'fier') {
      sourcils = e.yeux.map(([x, y, r], k) => `<path d="M${x - r * 1.3} ${y - r * 1.5 + (k ? 3 : 0)}L${x + r * 1.3} ${y - r * 1.5 + (k ? 0 : 3)}" ${l(3)}/>`).join('');
      bouche = `<path d="M${bx - bw / 2} ${by}c${bw / 4} -3 ${bw * 0.75} -3 ${bw} 0c-3 7-${bw / 2 - 3} 9-${bw / 2} 9s-${bw / 2 - 3}-2-${bw / 2}-9z" fill="#4a1712"${L.replace('3"', '2"')}/>`;
      emotion = '<path d="M96 22c3 3 3 6 0 9M104 22c-3 3-3 6 0 9M96 22c3 3 6 3 8 0M96 31c3-3 6-3 8 0" stroke="#d23b3b" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    } else {
      bouche = `<path d="M${bx - bw / 2} ${by}c${bw / 4} ${bw / 6} ${bw * 0.75} ${bw / 6} ${bw} 0" ${l(2.6)}/>`;
    }
  }
  const vb = serre ? '14 8 92 92' : '0 0 120 120';
  return `<svg viewBox="${vb}" aria-hidden="true" focusable="false"><rect x="-10" y="-10" width="140" height="140" fill="${v ? '#c9ccd1' : e.fond}"/><g${v ? ' opacity=".82"' : ''}${e.dy ? ` transform="translate(0 ${e.dy})"` : ''}>${e.corps}</g>${yeux}${e.dessus ?? ''}${sourcils}${bouche}${emotion}</svg>`;
}
