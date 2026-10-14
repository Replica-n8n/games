// Portraits : chaque personne est dessinée à partir de son `look` (peau,
// cheveux, chapeau, tenue, détails), en SVG, dans un carré de 40. La couleur
// du pion habille la tenue et teinte le fond. Une victime a les yeux fermés.

/** @typedef {import('../engine/types.js').Person} Person */

/** Teintes des pions, les mêmes que dans style.css. */
export const PAWN_HEX = {
  ocre: '#8a5800', sapin: '#1d6b42', prune: '#6b3fa0', brique: '#a8381f',
  canard: '#0f6878', rose: '#a82e6a', ardoise: '#44566a',
};
const SKIN = { clair: '#f5d3b8', rose: '#f1c49e', hale: '#e2a985', mat: '#c98d68', brun: '#a8714c', fonce: '#6e4630' };
const HAIR = { chatain: '#6b3e26', brun: '#3f2516', noir: '#1f1612', roux: '#b8452c', blond: '#d9b45a', gris: '#9aa0a7', blanc: '#e6e6e6' };

/** Mélange deux couleurs hexadécimales. @param {string} a @param {string} b @param {number} t part de b */
function mix(a, b, t) {
  const p = (/** @type {string} */ h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

/** @param {Person} person @returns {string} un <svg> complet */
export function portrait(person) {
  const L = person.look;
  const base = person.victim ? '#4a4f57' : (PAWN_HEX[/** @type {keyof typeof PAWN_HEX} */ (person.color)] ?? '#44566a');
  const fond = person.victim ? '#c9ccd1' : mix(base, '#ffffff', 0.62);
  const peau = SKIN[/** @type {keyof typeof SKIN} */ (L.skin)] ?? SKIN.rose;
  const poil = HAIR[/** @type {keyof typeof HAIR} */ (L.hairColor)] ?? HAIR.brun;
  const extras = new Set(L.extras ?? []);

  // Derrière la tête : cheveux longs.
  let derriere = '';
  if (L.hair === 'long') derriere = `<path d="M10 34c-2-10-1-24 10-24s12 14 10 24c-2-4-3-9-3-13-3-2-11-2-14 0 0 4-1 9-3 13z" fill="${poil}"/>`;

  // Corps et tenue.
  const epaules = 'M5 40c1-8 7-11 15-11s14 3 15 11z';
  let corps = '';
  switch (L.outfit) {
    case 'tablier':
      corps = `<path d="${epaules}" fill="${base}"/><path d="M13 31h14v9H13z" fill="#fafafa"/><path d="M13 31l-2-2M27 31l2-2" stroke="#fafafa" stroke-width="1.6"/>`;
      break;
    case 'livree':
      corps = `<path d="${epaules}" fill="${mix(base, '#000000', 0.55)}"/><path d="M16 29l4 9 4-9z" fill="#ffffff"/>`;
      break;
    case 'robe':
      corps = `<path d="${epaules}" fill="${base}"/><path d="M15 29.5q5 4 10 0" fill="${peau}"/>`;
      break;
    case 'chemise':
      corps = `<path d="${epaules}" fill="${base}"/><path d="M16 29l4 4 4-4" fill="none" stroke="${mix(base, '#ffffff', 0.45)}" stroke-width="1.6"/><path d="M13 30v10M27 30v10" stroke="${mix(base, '#000000', 0.4)}" stroke-width="2.2"/>`;
      break;
    default: // costume
      corps = `<path d="${epaules}" fill="${person.victim ? '#4a4f57' : '#30353c'}"/><path d="M17 29l3 7 3-7z" fill="#f2f2f2"/><path d="M20 31v6" stroke="${base}" stroke-width="2"/>`;
  }

  // Cheveux devant / au-dessus de la tête.
  let cheveux = '';
  switch (L.hair) {
    case 'court': cheveux = `<path d="M11.5 18.5c0-5.5 3.5-8.5 8.5-8.5s8.5 3 8.5 8.5c-1-2.2-2.5-3.6-8.5-3.6s-7.5 1.4-8.5 3.6z" fill="${poil}"/>`; break;
    case 'chignon': cheveux = `<path d="M11 21c-1-7 3-11.5 9-11.5S30 14 29 21c-1-3-2-6-4-7-3 2-8 2.5-11 1.5-1.5 1.5-2.5 3-3 5.5z" fill="${poil}"/><circle cx="20" cy="7.5" r="4" fill="${poil}"/>`; break;
    case 'long': cheveux = `<path d="M12.5 15c2.5-4 12.5-4 15 0-3 1.5-12 1.5-15 0z" fill="${poil}"/>`; break;
    case 'degarni': cheveux = `<path d="M11.5 20c-.5-4 .5-6 2-7M28.5 20c.5-4-.5-6-2-7" stroke="${poil}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`; break;
    case 'boucle': cheveux = [[13, 13], [17, 10.5], [21.5, 10], [26, 12], [28.5, 16], [11.5, 17]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${poil}"/>`).join(''); break;
    default: cheveux = '';
  }

  // Chapeau.
  let chapeau = '';
  switch (L.hat) {
    case 'toque': chapeau = `<rect x="12" y="9" width="16" height="4" rx="1" fill="#ffffff" stroke="#d6d6d6" stroke-width=".6"/><circle cx="14" cy="6.5" r="4" fill="#ffffff"/><circle cx="20" cy="4.5" r="4.5" fill="#ffffff"/><circle cx="26" cy="6.5" r="4" fill="#ffffff"/>`; break;
    case 'paille': chapeau = `<ellipse cx="20" cy="12.5" rx="14" ry="3.6" fill="#d9b45a"/><path d="M13 12.5c0-5 3-7.5 7-7.5s7 2.5 7 7.5z" fill="#e6c46e"/><path d="M13 11.3h14" stroke="#8a5a2b" stroke-width="1.8"/>`; break;
    case 'casquette': chapeau = `<path d="M11.5 15c0-5 3.5-7.5 8.5-7.5s8.5 2.5 8.5 7.5z" fill="${mix(base, '#000000', 0.3)}"/><path d="M20 15h12c0 1.5-2 2.4-6 2.4H20z" fill="${mix(base, '#000000', 0.45)}"/>`; break;
    case 'bibi': chapeau = `<ellipse cx="24" cy="11" rx="6" ry="2.5" fill="${mix(base, '#000000', 0.35)}"/><path d="M26 10c3-5 6-6 8-5-2 1-4 3-6 6z" fill="#e6c46e"/>`; break;
  }

  // Visage.
  const yeux = person.victim
    ? '<path d="M15.5 19.5h3M21.5 19.5h3" stroke="#3b2a22" stroke-width="1.2" stroke-linecap="round"/>'
    : '<circle cx="17" cy="19.5" r="1.1" fill="#2a1a12"/><circle cx="23" cy="19.5" r="1.1" fill="#2a1a12"/>';
  const bouche = person.victim || extras.has('moustache') ? '' : '<path d="M18 24.5q2 1.5 4 0" stroke="#7a3a2a" stroke-width="1" fill="none" stroke-linecap="round"/>';
  let details = '';
  if (extras.has('moustache')) details += `<path d="M16.5 23.4q3.5-2.2 7 0q-1.8 1.4-3.5.5q-1.7.9-3.5-.5z" fill="${L.hairColor === 'gris' || L.hairColor === 'blanc' ? '#8a9097' : poil}"/>`;
  if (extras.has('barbe')) details += `<path d="M12 21c1 6 4 9 8 9s7-3 8-9c-2 3-4 4-8 4s-6-1-8-4z" fill="${poil}"/>`;
  if (extras.has('lunettes')) details += '<circle cx="17" cy="19.5" r="2.6" fill="none" stroke="#2a1a12" stroke-width=".9"/><circle cx="23" cy="19.5" r="2.6" fill="none" stroke="#2a1a12" stroke-width=".9"/><path d="M19.6 19.5h.8" stroke="#2a1a12" stroke-width=".9"/>';
  if (extras.has('boucles')) details += '<circle cx="11.5" cy="22.5" r="1.1" fill="#f3e3a0"/><circle cx="28.5" cy="22.5" r="1.1" fill="#f3e3a0"/>';
  if (extras.has('ruban')) details += '<path d="M25 11.5l3.5-2.5v4z" fill="#f3e3a0"/>';
  if (extras.has('noeud')) details += '<path d="M17 31.5l3 1.5 3-1.5v3l-3-1.5-3 1.5z" fill="#111111"/>';

  return `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><rect width="40" height="40" fill="${fond}"/>${derriere}${corps}<rect x="17.5" y="25" width="5" height="5" fill="${peau}"/><circle cx="20" cy="19" r="8.5" fill="${peau}"/>${cheveux}${chapeau}${yeux}${bouche}${details}</svg>`;
}
