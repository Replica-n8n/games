// Les créatures des autres jeux de l'Arcade, en portraits : les bestioles du
// chevalier (games/serpentin/) et les habitants du récif du requin
// (games/toto/). Même carré de 120 que les bustes humains (buste.js), même
// contour d'un seul tenant, de PROFIL (tournés vers la droite), mêmes expressions : calme, démasqué (« choc »),
// qui proteste (« fier »), et la victime aux yeux fermés.

/** @typedef {import('../engine/types.js').Person} Person */
/** @typedef {'' | 'choc' | 'fier'} Humeur */

const T = '#2b1d17';
const L = ` stroke="${T}" stroke-width="3" stroke-linejoin="round"`;
const l = (/** @type {number} */ w) => ` stroke="${T}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;

/**
 * Chaque espèce : le fond, le corps (avec son contour), les yeux [x, y, rayon],
 * la bouche [x, y, largeur] et ce qui passe devant le visage.
 * @type {Record<string, { fond: string, corps: string, yeux: [number, number, number][], bouche: [number, number, number], dessus?: string, dy?: number, cadre?: string }>}
 */
const ESPECES = {
  // Tous de PROFIL, tournés vers la droite, comme dans leurs jeux (Julie a
  // refusé les portraits de face, 2026-10-16). Un seul œil visible.
  // ---------- Le monde du chevalier ----------
  escargot: {
    fond: '#d9e8c4',
    corps: `<path d="M2 116c0-8 6-12 16-12h66c10 0 16-6 16-18V58c0-10 6-16 12-16s8 6 8 14v40c0 12-8 20-20 20z" fill="#d8c79a"${L}/>`
      + `<path d="M94 46l-2-22M104 44l6-24" ${l(3)}/><path d="M94 46l-2-22M104 44l6-24" stroke="#d8c79a" stroke-width="1.4"/>`
      + `<circle cx="44" cy="70" r="36" fill="#c06a30"${L}/><path d="M44 70m-26 0a26 26 0 1 1 26 26 19 19 0 1 1-19-19 12 12 0 1 1 12 12 6 6 0 1 1-6-6" stroke="#7a3f18" stroke-width="4" fill="none"/>`
      + `<path d="M22 46c8-10 20-14 32-12" stroke="#e08a50" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    yeux: [[110, 20, 6.5]], bouche: [112, 78, 10], cadre: 'translate(-20 12)',
    dessus: `<circle cx="92" cy="22" r="4" fill="#fff"${l(2)}/><circle cx="93" cy="22" r="2" fill="#120a06"/>`,
  },
  lucane: {
    fond: '#e6d9c4',
    corps: `<path d="M20 112l-6 8M36 114l-2 6M56 114l2 6" ${l(3)}/>`
      + `<ellipse cx="44" cy="88" rx="38" ry="24" fill="#3a2418"${L}/><path d="M12 82c14-10 40-12 62-4" stroke="#6b4428" stroke-width="3" fill="none"/>`
      + `<path d="M74 64c4-10 14-14 24-12 8 2 12 10 10 20-2 10-12 16-22 14-8-2-14-10-12-22z" fill="#4a2c1e"${L}/>`
      // La mandibule, une grande pince recourbée vers l'avant.
      + `<path d="M100 66c8-8 12-20 10-34 6 4 10 10 10 18 0 2-2 4-4 4l-2-6c-2 8-6 14-12 20z" fill="#7a4a2c"${L}/><path d="M102 80c8 2 14 0 18-4-2 6-8 10-16 10z" fill="#7a4a2c"${L}/>`
      + `<path d="M88 52c-2-10-8-16-16-18" ${l(2.4)}/>`,
    yeux: [[92, 64, 6]], bouche: [104, 78, 8],
  },
  araignee: {
    fond: '#e2d6ea',
    corps: [0, 1, 2, 3].map((k) => `<path d="M${66 + k * 6} 86c${-10 + k * 6} 6 ${-16 + k * 8} 16 ${-22 + k * 14} 30" ${l(5.4)}/><path d="M${66 + k * 6} 86c${-10 + k * 6} 6 ${-16 + k * 8} 16 ${-22 + k * 14} 30" stroke="#3a2a4a" stroke-width="2.8" fill="none" stroke-linecap="round"/>`).join('')
      + `<ellipse cx="36" cy="72" rx="34" ry="30" fill="#2e2238"${L}/><path d="M18 64l14 10 14-10" stroke="#c0392b" stroke-width="4" fill="none"/>`
      + `<circle cx="82" cy="76" r="22" fill="#3e2e4c"${L}/>`
      + `<path d="M68 56l4-16 8 10 6-14 6 14 8-10 2 16z" fill="#d9b45a" stroke="#8a6a2a" stroke-width="1.6" stroke-linejoin="round"/><circle cx="83" cy="45" r="2.4" fill="#c0392b"/>`
      + `<path d="M100 88c6 2 8 8 6 12M96 92c4 4 4 8 2 12" ${l(2.4)}/>`,
    yeux: [[90, 70, 7]], bouche: [98, 86, 8],
    dessus: `<circle cx="80" cy="64" r="2.6" fill="#120a06"/><circle cx="98" cy="62" r="2.2" fill="#120a06"/>`,
  },
  crapaud: {
    fond: '#cfe3d8',
    corps: `<path d="M4 116c0-30 16-56 46-62 24-4 46 4 58 20 8 10 8 22 0 30-8 8-22 12-40 12z" fill="#7aab4f"${L}/>`
      + `<path d="M40 116c10-6 26-8 42-6" stroke="#5a8a3a" stroke-width="3" fill="none"/><path d="M24 116c4-14 12-18 22-18s14 8 14 18z" fill="#6d9a46"${L}/>`
      + `<circle cx="82" cy="54" r="15" fill="#7aab4f"${L}/>`
      + `<circle cx="30" cy="78" r="3" fill="#5a8a3a"/><circle cx="52" cy="66" r="2.4" fill="#5a8a3a"/><circle cx="62" cy="88" r="2.6" fill="#5a8a3a"/>`
      + `<path d="M70 86c14 2 28 0 40-6" stroke="#d9e2a8" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    yeux: [[84, 52, 9]], bouche: [100, 80, 22],
  },
  herisson: {
    fond: '#efe1cc',
    corps: Array.from({ length: 11 }, (_, k) => { const a = Math.PI * (0.92 + k * 0.08); const x = 54 + Math.cos(a) * 52, y = 82 + Math.sin(a) * 52; const b = 54 + Math.cos(a - 0.1) * 34, c = 82 + Math.sin(a - 0.1) * 34, d = 54 + Math.cos(a + 0.1) * 34, e = 82 + Math.sin(a + 0.1) * 34; return `<path d="M${b.toFixed(1)} ${c.toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}L${d.toFixed(1)} ${e.toFixed(1)}z" fill="#6b4a32"${L}/>`; }).join('')
      + `<path d="M6 116c0-30 20-50 48-50s34 20 34 50z" fill="#5a3e2a"${L}/>`
      + `<path d="M64 90c0-16 10-26 24-26 10 0 16 8 22 16l8 6-6 4c-8 6-16 10-26 10-14 0-22-4-22-10z" fill="#e2c49a"${L}/>`
      + `<circle cx="117" cy="86" r="4" fill="#1c1410"/><path d="M78 116v-8M94 116v-8" ${l(3)}/>`,
    yeux: [[90, 78, 5]], bouche: [106, 94, 8],
  },
  papillon: {
    fond: '#e8e4f2',
    corps: `<path d="M50 70C34 40 30 12 52 6c18-4 26 30 22 60z" fill="#f2a33a"${L}/><path d="M48 72C20 74 4 90 12 106c8 12 30 4 42-28z" fill="#e0703a"${L}/>`
      + `<circle cx="52" cy="30" r="8" fill="#fff4d6"/><circle cx="26" cy="96" r="5" fill="#fff4d6"/><path d="M48 18c4 10 6 22 6 34" stroke="#c4782a" stroke-width="2" fill="none"/>`
      + `<path d="M20 80c20-4 46-6 66-2 4 2 4 6 0 8-20 4-46 2-66-2z" fill="#3a2a2a"${L}/>`
      + `<circle cx="94" cy="78" r="13" fill="#4a3434"${L}/><path d="M98 66c4-12 10-20 18-24M92 66c0-12 2-22 8-30" ${l(2.4)}/><circle cx="116" cy="42" r="2.6" fill="${T}"/><circle cx="100" cy="36" r="2.6" fill="${T}"/>`,
    yeux: [[99, 76, 4]], bouche: [105, 85, 5],
  },
  // ---------- Le golfe du requin ----------
  requin: {
    fond: '#cfe6ef',
    corps: `<path d="M44 48c4-20 16-34 34-40-4 14-4 28 0 40z" fill="#6f7c82"${L}/>`
      + `<path d="M-6 66c20-20 56-28 92-22 18 4 30 12 34 22-6 12-20 20-40 24-32 6-64 0-86-8z" fill="#8b979c"${L}/>`
      + `<path d="M10 84c24 8 54 10 80 4 12-2 22-8 26-14-6 4-14 6-24 7-30 3-58 2-82 3z" fill="#eef2f2"/>`
      + `<path d="M58 62c2 6 2 12 0 18M64 61c2 6 2 12 0 18M70 61c2 6 2 12 0 18" stroke="#5f6b70" stroke-width="2" fill="none"/>`
      + `<path d="M40 90c-4 10-12 18-22 22 12 0 24-6 30-18z" fill="#6f7c82"${L}/>`,
    yeux: [[94, 58, 4.6]], bouche: [104, 74, 18],
    dessus: `<path d="M94 72l3 4 3-4 3 4 3-4 3 4" stroke="#fff" stroke-width="1.6" fill="none" stroke-linejoin="round"/>`,
  },
  orque: {
    fond: '#d6e6ef',
    corps: `<path d="M36 44c2-22 10-36 22-42 0 14 2 28 8 40z" fill="#1c1e22"${L}/>`
      + `<path d="M-6 70c16-24 52-34 88-30 24 4 38 14 38 28 0 12-16 22-40 26-34 6-66 0-86-8z" fill="#1c1e22"${L}/>`
      + `<path d="M14 90c26 8 56 10 82 4 10-2 18-6 22-12-8 4-16 6-26 7-30 3-56 1-78 1z" fill="#f4f6f6"/>`
      + `<ellipse cx="78" cy="56" rx="12" ry="6" fill="#f4f6f6" transform="rotate(-8 78 56)"/><path d="M44 90c-2 10-10 18-20 22 12 0 22-6 28-18z" fill="#1c1e22"${L}/>`,
    yeux: [[96, 62, 4]], bouche: [106, 76, 16],
  },
  barracuda: {
    fond: '#dbe8ea',
    corps: `<path d="M-6 70c20-14 50-20 80-18 18 2 34 6 44 14l6 6-8 2c-12 4-26 8-42 8-30 2-58-2-80-6z" fill="#9fb4bf"${L}/>`
      + `<path d="M6 82c26 6 56 6 84 2 10-2 20-4 26-8-8 2-18 4-28 4-28 2-56 2-82 2z" fill="#dfe8ec"/>`
      + `<path d="M14 66l8 6M28 62l8 6M42 60l8 6M56 58l8 6" stroke="#6f8792" stroke-width="2.4" stroke-linecap="round"/>`
      + `<path d="M40 52l6-12 10 12zM46 86l6 12 8-12z" fill="#7f97a3"${l(1.4)}/>`,
    yeux: [[96, 64, 6]], bouche: [110, 76, 14],
    dessus: `<path d="M100 74l2 4 2-4 2 4 2-4 2 4 2-4" stroke="#fff" stroke-width="1.6" fill="none" stroke-linejoin="round"/>`,
  },
  pieuvre: {
    fond: '#efdfe6',
    corps: [0, 1, 2, 3, 4].map((k) => { const x = 50 + k * 13; return `<path d="M${x} 86c-6 10 ${k % 2 ? 10 : -6} 18 ${k % 2 ? 4 : -2} 32" stroke="${T}" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M${x} 86c-6 10 ${k % 2 ? 10 : -6} 18 ${k % 2 ? 4 : -2} 32" stroke="#8e3a5e" stroke-width="8" fill="none" stroke-linecap="round"/>`; }).join('')
      + `<path d="M10 52C10 24 34 8 58 14c24 6 40 26 42 50 2 18-10 28-32 28-34 0-58-14-58-40z" fill="#a8456e"${L}/><circle cx="34" cy="34" r="3.6" fill="#c46a8e"/><circle cx="50" cy="24" r="2.6" fill="#c46a8e"/><circle cx="26" cy="54" r="2.8" fill="#c46a8e"/>`
      // La voilette de veuve : chapeau noir incliné et dentelle.
      + `<path d="M22 22c8-14 28-20 46-12 6 2 10 6 12 10-14-4-38-4-58 2z" fill="#1c1418"${L}/><path d="M76 20c6 10 8 24 4 38" stroke="#1c1418" stroke-width="2" fill="none" stroke-dasharray="3 2"/>`,
    yeux: [[82, 60, 8]], bouche: [94, 80, 10],
  },
  tortue: {
    fond: '#e4ebcf',
    corps: `<path d="M-4 96c0-30 22-52 52-52s46 18 50 42z" fill="#8a6a3a"${L}/><path d="M10 92c6-16 18-30 34-34M50 58c14 2 26 12 32 26M30 92l8-20h22l8 20" stroke="#5e4424" stroke-width="3" fill="none"/>`
      + `<path d="M-4 96h104c0 8-8 12-20 12H10c-10 0-14-4-14-12z" fill="#c2a46a"${L}/>`
      + `<path d="M92 84c4-16 12-28 22-28 8 0 10 8 8 16-2 10-10 18-24 18z" fill="#8fb06a"${L}/>`
      + `<path d="M64 106c10 4 22 10 30 16-12 0-24-4-32-10z" fill="#8fb06a"${L}/>`,
    yeux: [[110, 66, 5]], bouche: [116, 80, 8], cadre: 'translate(-18 -4)',
  },
  dauphin: {
    fond: '#d2e9f2',
    corps: `<path d="M40 46c4-16 14-28 26-32-2 12 0 24 6 34z" fill="#6f97b0"${L}/>`
      + `<path d="M-6 74c18-24 52-34 82-30 16 2 26 8 32 16l14 4c2 4 0 6-4 8l-12 2c-8 10-24 16-42 18-30 4-54-4-70-18z" fill="#82a9c2"${L}/>`
      + `<path d="M14 88c22 8 46 8 66 2 10-3 18-8 24-14-8 4-18 6-28 7-22 2-42 2-62 5z" fill="#e6f0f4"/>`
      + `<path d="M44 92c-4 10-12 16-22 20 12 0 22-6 28-16z" fill="#6f97b0"${L}/><circle cx="70" cy="48" r="2.4" fill="#5d8aa6"/>`,
    yeux: [[92, 62, 4.6]], bouche: [112, 72, 10],
  },
  cachalot: {
    fond: '#d2dbe2',
    corps: `<path d="M-8 40h88c22 0 36 8 36 24v20c0 18-14 26-36 28-28 2-60 0-88-6z" fill="#5c6670"${L}/>`
      + `<path d="M40 100c22 2 46 2 66-2 6-2 10-4 12-8l-74 2z" fill="#4a535c"${L}/><path d="M48 98h68" stroke="${T}" stroke-width="2"/>`
      + `<path d="M58 99l3 4 3-4 3 4 3-4 3 4 3-4 3 4 3-4" stroke="#f2efe6" stroke-width="1.6" fill="none"/>`
      // Vieux-Borgne : les cicatrices d'un vieux combattant.
      + `<path d="M20 52l18 12M30 46l6 12M84 48l14 18M70 78l12 4" stroke="#8e98a2" stroke-width="2.6" stroke-linecap="round"/>`,
    yeux: [[70, 70, 5]], bouche: [96, 92, 12],
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
  // Cadré sur la tête, qui est à droite : les créatures sont de profil.
  const vb = serre ? '28 14 92 92' : '0 0 120 120';
  return `<svg viewBox="${vb}" aria-hidden="true" focusable="false"><rect x="-10" y="-10" width="140" height="140" fill="${v ? '#c9ccd1' : e.fond}"/><g${e.cadre ? ` transform="${e.cadre}"` : ''}><g${v ? ' opacity=".82"' : ''}${e.dy ? ` transform="translate(0 ${e.dy})"` : ''}>${e.corps}</g>${yeux}${e.dessus ?? ''}${sourcils}${bouche}</g>${emotion}</svg>`;
}
