// Les costumes des personnages d'œuvres (One Piece…), posés sur les bustes
// (buste.js) : le visage, les yeux et les expressions restent ceux des
// bustes, le costume ajoute ce qui rend le personnage reconnaissable,
// dessiné d'après ses IMAGES (docs/conviction-onepiece-personnages.md).
// Chaque costume rend des couches : derriere (avant la tête), tissu
// (remplace la tenue), visage, poils, devant (après les yeux : une mèche
// peut cacher un œil), dessus, acc, apres, et éventuellement tete, bouches.

/**
 * @typedef {{ id: string, peau: string, poil: string, poilSombre: string, poilClair: string, ombre: string, base: string,
 *   fem: boolean, mood: string, victime: boolean, TRAIT: string,
 *   mix: (a: string, b: string, t: number) => string, miroir: (d: string) => string, rond: (x: number, y: number, r: number) => string,
 *   degrade: (n: string, c: string, k?: number) => string, bombe: (n: string, c: string) => string }} Ctx
 * @typedef {{ derriere?: [string, string][], tissu?: string, visage?: string, poils?: [string, string][], devant?: [string, string][],
 *   dessus?: string, acc?: string, apres?: string, tete?: string, sansOreilles?: boolean, bouches?: Record<string, string>, yeux?: string }} Couches
 * @typedef {{ couleurs?: { fond?: string, peau?: string, poil?: string, iris?: string, tenue?: string }, dessin: (c: Ctx) => Couches }} Costume
 */

const T = '#2b1d17';
const trait = (/** @type {number} */ w, c = T) => ` stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;

// ---------- Égypte : ce que partagent Isis, Nephthys et Osiris ----------
/** Le large collier (ousekh), en rangs de couleur. @param {string} a @param {string} b @param {string} d */
const collier = (a, b, d) => [a, b, a, d, b].map((x, k) => `<path d="M${40 - k * 4} 88C${46 - k * 3} ${100 + k * 4} ${74 + k * 3} ${100 + k * 4} ${80 + k * 4} 88" stroke="${x}" stroke-width="4.4" fill="none"/>`).join('')
  + `<path d="M22 88C30 112 90 112 98 88" stroke="${T}" stroke-width="1.2" fill="none"/>`;
/** Le trait de khôl qui prolonge l'œil vers la tempe. */
const khol = `<path d="M46.5 54.5L41 53.6M73.5 54.5L79 53.6" stroke="#120a06" stroke-width="1.8" stroke-linecap="round"/>`;
/** Une déesse : perruque noire droite, bandeau d'or, robe blanche, collier, et son hiéroglyphe sur la tête.
 * @param {Ctx} c @param {string} teinte la couleur du collier @param {string} glyphe @returns {Couches} */
const egyptienne = (c, teinte, glyphe) => ({
  sansOreilles: true,
  derriere: [['M36 54C34 32 44 22 60 22C76 22 86 32 84 54L86 96H68V62H52V96H34Z', `url(#${c.id}h)`]],
  tissu: `<path d="M14 122C16 104 30 94 46 90h28c16 4 30 14 32 32z" fill="${c.degrade('ro', '#f4efe4', 0.16)}" stroke="${T}" stroke-width="1.4"/>`
    + `<path d="M50 104v18M70 104v18" stroke="#ddd6c6" stroke-width="1.4"/>` + collier(teinte, '#d8b04a', '#b8442e'),
  devant: [['M42 52C40 36 48 27 60 27S80 36 78 52C72 46 66 44 60 44S48 46 42 52Z', `url(#${c.id}h)`],
    ['M42 50L37 96H48L46 58Z', `url(#${c.id}h)`], ['M78 50L83 96H72L74 58Z', `url(#${c.id}h)`]],
  dessus: `<path d="M41 46C50 41 70 41 79 46" stroke="#d8b04a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M41 46C50 41 70 41 79 46" stroke="${T}" stroke-width=".8" fill="none"/>` + glyphe,
  acc: khol + `<path d="M40 70v14M80 70v14" stroke="#4a3a5a" stroke-width="1" opacity=".5"/>`,
});

// ---------- Mythologies : ce que partagent les Grecs, les Nordiques, les Romains ----------
/** Les épaules nues (une tunique sur une seule épaule). @param {Ctx} c */
const epaulesNues = (c) => `<path d="M3 122C5 101 26 91 46 89h28c20 2 41 12 43 33z" fill="${c.peau}" stroke="${T}" stroke-width="1.4"/><path d="M20 112c6-10 16-16 26-18" stroke="${c.ombre}" stroke-width="2" fill="none" opacity=".5"/>`;
/** La toge blanche drapée, sa bande de couleur sur le pli. @param {Ctx} c @param {string} bande @param {string} [drap] */
const toge = (c, bande, drap = '#f4efe4') => `<path d="M3 122C5 101 26 91 46 89h28c20 2 41 12 43 33z" fill="${c.degrade('tg', drap, 0.16)}" stroke="${T}" stroke-width="1.4"/>`
  + `<path d="M46 90c4 8 24 8 28 0" stroke="#d6cdbb" stroke-width="1.6" fill="none"/><path d="M22 100C36 110 54 118 64 122M34 96C46 104 60 112 72 120" stroke="#d6cdbb" stroke-width="1.4" fill="none"/>`
  + `<path d="M28 93C42 104 60 113 78 122" stroke="${T}" stroke-width="7" fill="none"/><path d="M28 93C42 104 60 113 78 122" stroke="${bande}" stroke-width="5" fill="none"/>`;
/** Une plume d'Icare : une longue amande partie de l'épaule.
 *  @param {number} s côté (-1 gauche, 1 droite) @param {number} a angle depuis la verticale (degrés) @param {number} lg longueur */
const plume = (s, a, lg) => {
  const bx = 60 + s * 30, by = 96, r = a * Math.PI / 180, dx = s * Math.sin(r), dy = -Math.cos(r), nx = -dy, ny = dx, w = 11;
  const P = (/** @type {number} */ x, /** @type {number} */ y) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  const tx = bx + dx * lg, ty = by + dy * lg;
  return `M${P(bx, by)} C${P(bx + nx * w + dx * lg * 0.35, by + ny * w + dy * lg * 0.35)} ${P(tx + nx * w * 0.7, ty + ny * w * 0.7)} ${P(tx, ty)} C${P(tx - nx * w * 0.7, ty - ny * w * 0.7)} ${P(bx - nx * w + dx * lg * 0.35, by - ny * w + dy * lg * 0.35)} ${P(bx, by)}Z`;
};
/** Les plumes d'une aile, de la plus haute à la plus basse. */
const AILE = [[22, 84], [42, 80], [62, 72], [82, 62], [102, 50]];
/** La couronne de laurier, feuille à feuille autour de la tête. @param {Ctx} c */
const laurier = (c) => [-1, 1].map((s) => [0, 1, 2, 3, 4, 5].map((k) => {
  const a = Math.PI * (1.08 + k * 0.075), x = 60 + s * -19 * Math.cos(a), y = 52 + 22 * Math.sin(a);
  const r = (s * (k * 14 - 70)).toFixed(0);
  return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="2.6" ry="5.2" fill="${c.victime ? '#9aa48a' : '#6f9a3a'}" stroke="${T}" stroke-width=".9" transform="rotate(${r} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
}).join('')).join('') + `<path d="M42 50C44 38 50 32 56 30M78 50C76 38 70 32 64 30" stroke="#d8b04a" stroke-width="1.4" fill="none"/>`;
/** La cuirasse de bronze et la cape sur les épaules. @param {Ctx} c @param {string} cape */
const cuirasse = (c, cape) => `<path d="M8 122C10 100 26 92 42 90L48 102C38 108 34 116 32 122Z" fill="${c.degrade('ca', cape)}" stroke="${T}" stroke-width="1.4"/>${'<path d="M8 122C10 100 26 92 42 90L48 102C38 108 34 116 32 122Z" fill="CAPE" stroke="T" stroke-width="1.4"/>'.replace('CAPE', `url(#${c.id}ca)`).replace('T', T).replace(/M8 122C10 100 26 92 42 90L48 102C38 108 34 116 32 122Z/, c.miroir('M8 122C10 100 26 92 42 90L48 102C38 108 34 116 32 122Z'))}`
  + `<path d="M30 122C32 104 42 94 52 92h16c10 2 20 12 22 30z" fill="${c.degrade('cu', '#c8963a')}" stroke="${T}" stroke-width="1.4"/><path d="M44 104c6 4 12 4 16 0 4 4 10 4 16 0M60 104v16M50 114c3 2 7 2 10 0 3 2 7 2 10 0" stroke="#8a6020" stroke-width="1.6" fill="none"/>`;

// ---------- Remis d'équerre : la couleur et un détail signature ----------
/** Un costume léger : le fond et la couleur de la tenue, et des couches en plus.
 *  @param {string} fond @param {string} tenue @param {(c: Ctx) => Couches} [plus] @returns {Costume} */
const signe = (fond, tenue, plus = () => ({})) => ({ couleurs: { fond, tenue }, dessin: plus });
/** Le lion d'or des Lannister. @param {number} x @param {number} y */
const lion = (x, y) => `<circle cx="${x}" cy="${y}" r="6" fill="#d8b04a" stroke="${T}" stroke-width="1.2"/><path d="M${x - 3} ${y + 1}c0-4 2-5 4-5s3 2 2 4c2 0 3 2 1 3-1 1-3 1-4 0-1 1-3 1-3-2z" fill="#8a5a1a"/>`;
/** Une chaîne d'or sur la poitrine. @param {Ctx} c */
const chaine = (c) => `<path d="M46 90C50 100 70 100 74 90" stroke="${c.victime ? '#b8b4a8' : '#e0b84a'}" stroke-width="2.2" fill="none" stroke-dasharray="2.4 1.6"/>`;
/** La truite d'argent des Tully. @param {number} x @param {number} y */
const poisson = (x, y) => `<path d="M${x - 7} ${y}c3-4 9-4 12 0-3 4-9 4-12 0z M${x + 5} ${y}l4-3v6z" fill="#c9d4dc" stroke="${T}" stroke-width="1.1"/><circle cx="${x - 4}" cy="${y - 0.6}" r=".9" fill="${T}"/>`;
/** La tête de loup des Stark. @param {number} x @param {number} y */
const loup = (x, y) => `<path d="M${x - 6} ${y - 6}l2 5 4-2 4 2 2-5 1 8c-1 4-4 6-7 6s-6-2-7-6z" fill="#c9ccd4" stroke="${T}" stroke-width="1.1"/><circle cx="${x - 2}" cy="${y + 1}" r=".8" fill="${T}"/><circle cx="${x + 2}" cy="${y + 1}" r=".8" fill="${T}"/>`;
/** Une rose (Tyrell) en or ou en fleur. @param {number} x @param {number} y @param {string} c */
const rose = (x, y, c) => `<circle cx="${x}" cy="${y}" r="5.4" fill="${c}" stroke="${T}" stroke-width="1.1"/><path d="M${x - 3} ${y}c1-3 5-3 6 0M${x - 2} ${y + 2}c1 2 3 2 4 0M${x} ${y - 3}c-2 1-2 4 0 5" stroke="${T}" stroke-width=".9" fill="none" opacity=".7"/><path d="M${x - 5} ${y + 5}l-4 3M${x + 5} ${y + 5}l4 3" stroke="#3f7a3a" stroke-width="2" stroke-linecap="round"/>`;
/** Le gros pull à torsades (Ransom). */
const tricot = () => `<path d="M12 122C14 104 30 94 46 90h28c16 4 32 14 34 32z" fill="#e8dcc0" stroke="${T}" stroke-width="1.4"/><path d="M44 90c4 6 28 6 32 0" stroke="#c9b894" stroke-width="5" fill="none"/>`
  + [34, 50, 70, 86].map((x) => `<path d="M${x} 100c3 3 3 6 0 9s-3 6 0 9M${x + 4} 100c-3 3-3 6 0 9s3 6 0 9" stroke="#c9b894" stroke-width="2" fill="none"/>`).join('');
/** Une veste de tweed à chevrons. @param {string} fond */
const tweed = (fond) => `<path d="M46 90L40 92L48 122M74 90L80 92L72 122" stroke="${T}" stroke-width="1.4" fill="none"/>`
  + [24, 32, 88, 96].map((x) => `<path d="M${x} 100l3 4-3 4 3 4-3 4" stroke="${fond}" stroke-width="1.2" fill="none" opacity=".6"/>`).join('');

// ---------- Les figures du jeu de cartes (le portrait officiel français) ----------
// Vues sur les cartes de Wikimedia Commons (« King of hearts fr.svg »…) : partout
// du rouge, du bleu, de l'or, et la bande noire perlée qui coupe la carte en biais.
/** Une couleur passée au gris pour la victime. @param {Ctx} c @param {string} x */
const terne = (c, x) => (c.victime ? c.mix(x, '#8d939b', 0.55) : x);
/** La robe d'une figure : une couleur de chaque côté, l'empiècement d'or, la bande perlée.
 *  @param {Ctx} c @param {string} g @param {string} d @param {string} [motif] dessiné sous la bande */
const carte = (c, g, d, motif = '') => {
  const or = terne(c, '#e0b040');
  const perles = Array.from({ length: 9 }, (_, k) => { const t = (k + 0.5) / 9; return `<circle cx="${(26 + t * 70).toFixed(1)}" cy="${(122 - t * 30).toFixed(1)}" r="1.5" fill="#f4f2ec"/>`; }).join('');
  return `<path d="M3 122C5 101 26 91 46 89H60V122Z" fill="${c.degrade('cg', terne(c, g))}"/><path d="M60 89h14c20 2 41 12 43 33H60Z" fill="${c.degrade('cd', terne(c, d))}"/>`
    + `<path d="M38 90C44 106 76 106 82 90L74 89H46Z" fill="${c.degrade('ce', or, 0.3)}" stroke="${T}" stroke-width="1.2"/><path d="M44 94C50 102 70 102 76 94" stroke="${c.mix(or, '#000000', 0.35)}" stroke-width="1.2" fill="none" stroke-dasharray="3 2"/>`
    + `<path d="M3 122C5 101 26 91 46 89h28c20 2 41 12 43 33" stroke="${T}" stroke-width="1.4" fill="none"/>${motif}`
    + `<path d="M24 122L98 90" stroke="${T}" stroke-width="7.4"/>${perles}`;
};
/** Le voile blanc des dames, et leur petite couronne. @param {Ctx} c @param {string} [voile] @returns {Couches} */
const dame = (c, voile = '#f4f2ec', v = c.degrade('vo', terne(c, voile), 0.22)) => ({
  derriere: [['M30 100C26 74 30 34 60 20C90 34 94 74 90 100Z', v]],
  devant: [['M30 100C26 74 30 34 60 20C90 34 94 74 90 100C85 90 81 78 79 64C77 46 70 36 60 36C50 36 43 46 41 64C39 78 35 90 30 100Z', v],
    ['M47 28L48 16L53.5 22L60 13L66.5 22L72 16L73 28C66 26 54 26 47 28Z', c.degrade('co', terne(c, '#e0b040'), 0.3)]],
  dessus: `<circle cx="60" cy="21" r="1.8" fill="#b8323a"/><circle cx="48" cy="16" r="1.3" fill="#f6dc8a"/><circle cx="72" cy="16" r="1.3" fill="#f6dc8a"/>`,
});
/** La toque plate des valets, sa bande de couleur, les cheveux au carré à la mâchoire.
 *  @param {Ctx} c @param {string} toque @param {string} bande @returns {Couches} */
const valet = (c, toque, bande) => ({
  derriere: [['M38 44C36 58 38 70 44 76C50 78 70 78 76 76C82 70 84 58 82 44Z', `url(#${c.id}h)`]],
  devant: [['M41 44C39 56 40 66 45 74C47 66 47 56 47 48Z', `url(#${c.id}h)`], ['M79 44C81 56 80 66 75 74C73 66 73 56 73 48Z', `url(#${c.id}h)`],['M38 40C36 26 47 19 60 19C73 19 84 26 82 40C72 36 48 36 38 40Z', c.degrade('to', terne(c, toque), 0.3)],
    ['M37 40C47 34 73 34 83 40L83 45C73 39 47 39 37 45Z', terne(c, bande)]],
});
/** Une fleur tenue à la main (les dames). @param {number} x @param {number} y @param {string} f */
const fleur = (x, y, f) => `<path d="M${x} ${y + 4}l-3 22" stroke="#3f7a3a" stroke-width="2.2" stroke-linecap="round"/><path d="M${x - 1.6} ${y + 12}c-5-2-7 0-8 3 4 1 6 0 8-3z" fill="#4f9a4a" stroke="${T}" stroke-width=".8"/>`
  + [0, 72, 144, 216, 288].map((a) => `<ellipse cx="${x}" cy="${y - 3}" rx="2.8" ry="3.8" fill="${f}" stroke="${T}" stroke-width=".8" transform="rotate(${a} ${x} ${y})"/>`).join('') + `<circle cx="${x}" cy="${y}" r="1.8" fill="#f6d36b"/>`;
/** Un sceptre d'or. @param {number} x */
const sceptre = (x) => `<path d="M${x} 122V80" stroke="${T}" stroke-width="5" stroke-linecap="round"/><path d="M${x} 122V80" stroke="#e0b040" stroke-width="3" stroke-linecap="round"/><circle cx="${x}" cy="78" r="4.6" fill="#e0b040" stroke="${T}" stroke-width="1.3"/><path d="M${x} 74v-6M${x - 2.4} 70.4h4.8" stroke="${T}" stroke-width="1.6" stroke-linecap="round"/>`;
/** Un bouclier rond doré, sa fleur gravée. @param {number} x @param {number} y @param {number} r */
const rondache = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#e0b040" stroke="${T}" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="${r * 0.7}" fill="none" stroke="#a8822a" stroke-width="1.2"/>`
  + [0, 45, 90, 135].map((a) => `<path d="M${x} ${y - r * 0.6}V${y + r * 0.6}" stroke="#a8822a" stroke-width="1.2" transform="rotate(${a} ${x} ${y})"/>`).join('') + `<circle cx="${x}" cy="${y}" r="2.4" fill="#b8323a" stroke="${T}" stroke-width=".8"/>`;
/** Une arme d'hast tenue droite : la hampe de bois, puis le fer (hallebarde : pointe, lame en
 *  croissant et crochet ; hache : un large fer arrondi). Dessinée debout, puis penchée de `a` degrés.
 *  @param {number} x @param {number} y le pied de la hampe @param {number} a @param {'hallebarde' | 'hache'} fer
 *  @param {boolean} [gauche] le fer tourné vers la gauche (l'arme tenue à gauche, loin du visage) */
const arme = (x, y, a, fer, gauche = false) => {
  const metal = `fill="#d4d8de" stroke="${T}" stroke-width="1.4" stroke-linejoin="round"`;
  const tete = fer === 'hallebarde'
    ? `<path d="M0 -92L-3.4 -74H3.4Z" ${metal}/><path d="M2 -74C12 -78 19 -72 20 -60C14 -63 8 -63 2 -60Z" ${metal}/><path d="M-2 -72L-11 -68L-2 -64Z" ${metal}/>`
      + `<path d="M5 -72C11 -73 15 -70 17 -64" stroke="#ffffff" stroke-width="1.2" fill="none" opacity=".8"/>`
    : `<path d="M2 -80C16 -86 26 -74 24 -56C20 -60 10 -62 2 -60Z" ${metal}/><path d="M-2 -76L-8 -72V-64L-2 -64Z" ${metal}/>`
      + `<path d="M6 -78C15 -80 21 -72 21 -62" stroke="#ffffff" stroke-width="1.4" fill="none" opacity=".8"/>`;
  return `<g transform="translate(${x} ${y})${gauche ? ' scale(-1 1)' : ''} rotate(${a})"><path d="M0 0V-80" stroke="${T}" stroke-width="5.6" stroke-linecap="round"/><path d="M0 0V-80" stroke="#8a5a32" stroke-width="3.4" stroke-linecap="round"/>`
    + `<path d="M-.8 -4V-76" stroke="#b07a48" stroke-width="1" opacity=".8"/>${tete}<path d="M-3 -62h6M-3 -58h6" stroke="#e0b040" stroke-width="1.6"/></g>`;
};
/** Le fond de chaque couleur : pique et trèfle froids, cœur et carreau chauds. */
const FOND = { pique: '#e2e5ec', coeur: '#f6dfdc', carreau: '#f8e6d4', trefle: '#e2ecdc' };

/** @type {Record<string, Costume>} */
export const COSTUMES = {
  // ---------- La Rêverie ----------
  cobra: {
    couleurs: { fond: '#efe2c4', peau: '#b9835c', poil: '#1e1a1c', iris: '#3a2416', tenue: '#3f2350' },
    dessin: (c) => ({
      // La grande crinière noire ondulée, mèches grises.
      derriere: [['M36 56 C30 34 42 18 60 18 C78 18 90 34 84 56 C88 72 86 88 80 98 C72 92 70 80 72 68 L48 68 C50 80 48 92 40 98 C34 88 32 72 36 56Z', c.degrade('cr', '#2a2428', 0.4)]],
      tissu: `<path d="M46 87 L60 112 L74 87Z" fill="${c.degrade('tu', '#2f8a62')}"/><path d="M47 87 L60 108 L73 87" stroke="#e8c24a" stroke-width="2.6" fill="none"/>`
        + `<path d="M46 87 C40 96 36 108 34 122M74 87 C80 96 84 108 86 122" stroke="#2a1838" stroke-width="2" fill="none"/>`
        + `<path d="M30 110 C44 106 76 106 90 110 L92 122 L28 122Z" fill="${c.degrade('ec', '#e8822e')}" stroke="${T}" stroke-width="1.6"/><path d="M34 116 L36 122M42 115 L43 122M50 114 L50 122M58 114 L58 122M66 114 L66 122M74 115 L73 122M82 116 L80 122" stroke="#b05a1a" stroke-width="1.4"/>`,
      devant: [['M42 50 C40 36 48 26 60 26 C72 26 80 36 78 50 C74 42 68 38 60 38 C52 38 46 42 42 50Z', c.degrade('fr', '#2a2428', 0.4)]],
      dessus: `<path d="M44 46 C46 40 50 36 54 34M76 46 C74 40 70 36 66 34" stroke="#8a8488" stroke-width="1.4" fill="none" opacity=".8"/>`
        + `<path d="M38 70 C36 80 38 90 42 96M82 70 C84 80 82 90 78 96" stroke="#6a6468" stroke-width="1.2" fill="none" opacity=".7"/>`,
      // La moustache fine et la barbiche pointue, nouée d'un anneau d'or.
      poils: [['M54 72 C54 80 57 90 60 98 C63 90 66 80 66 72 C63 74 57 74 54 72Z', '#2a2428']],
      acc: `<path d="M51 66.5 C55 64 58 64.5 60 65.6 C62 64.5 65 64 69 66.5" stroke="#2a2428" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M57 86 L63 86" stroke="#e8c24a" stroke-width="2.6"/>`
        + `<path d="M46 46.5 C49.5 44.2 53.5 44 56.8 45.4M63.2 45.4 C66.5 44 70.5 44.2 74 46.5" stroke="#1e1a1c" stroke-width="3.2" fill="none" stroke-linecap="round"/>`,
    }),
  },
  sabo: {
    couleurs: { fond: '#d6e2ec', peau: '#f5d6bc', poil: '#e8c25e', iris: '#2a3a5a', tenue: '#1e1e26' },
    dessin: (c) => ({
      derriere: [['M40 50 C38 36 46 26 60 26 C74 26 82 36 80 50 C82 60 82 70 78 78 C74 72 74 64 74 58 L46 58 C46 64 46 72 42 78 C38 70 38 60 40 50Z', `url(#${c.id}h)`]],
      tissu: `<path d="M50 86 L60 104 L70 86Z" fill="${c.degrade('gi', '#2f5aa0')}"/><path d="M52 92 L68 92M53 98 L67 98" stroke="#20407a" stroke-width="1"/>`
        // La grande cravate à jabot.
        + `<path d="M50 84 C44 90 44 98 50 100 C52 104 56 106 60 104 C64 106 68 104 70 100 C76 98 76 90 70 84 C66 88 54 88 50 84Z" fill="#fbfaf6" stroke="${T}" stroke-width="1.6"/>`
        + `<path d="M52 92 C55 95 58 95 60 93 C62 95 65 95 68 92M53 98 C56 100 64 100 67 98" stroke="#cfcac0" stroke-width="1.2" fill="none"/>`
        + `<path d="M46 87 L38 92 L48 122M74 87 L82 92 L72 122" stroke="#3a3a46" stroke-width="1.6" fill="none"/>`,
      devant: [
        // Les mèches blondes ondulées jusqu'à la mâchoire.
        ['M41 52 C38 38 46 28 60 28 C74 28 82 38 79 52 C77 46 74 42 70 40 C70 46 66 48 62 46 C60 49 54 50 50 46 C47 48 44 50 41 52Z', `url(#${c.id}h)`],
        ['M42 50 C40 58 40 68 44 76 C46 70 46 62 46 56Z', `url(#${c.id}h)`], ['M78 50 C80 58 80 68 76 76 C74 70 74 62 74 56Z', `url(#${c.id}h)`],
        // Le haut-de-forme et ses lunettes d'aviateur.
        ['M46 36 L45 10 C51 7 69 7 75 10 L74 36Z', c.degrade('hf', '#26262e', 0.5)],
        ['M32 37 C32 32 46 31 60 31 C74 31 88 32 88 37 C88 41 74 41 60 41 C46 41 32 41 32 37Z', '#1a1a20'],
      ],
      dessus: `<path d="M45.5 26 L74.5 26 L74.6 32 L45.4 32Z" fill="#4a7ac0"/>`
        + [52, 68].map((x) => `<circle cx="${x}" cy="27.5" r="5.4" fill="#2a3a5a" stroke="${T}" stroke-width="1.4"/><circle cx="${x}" cy="27.5" r="3.8" fill="${c.bombe('lu' + x, '#7ec0ee')}"/><circle cx="${x - 1.4}" cy="26" r="1.1" fill="#fff"/>`).join('')
        + `<path d="M52 13 L52 24" stroke="#3a3a46" stroke-width="2"/>`,
      // La cicatrice de brûlure autour de l'œil gauche.
      acc: `<path d="M63 47 C68 45 75 46 77 51 C78 57 76 62 72 63 C68 62 64 58 63 53Z" fill="#d8826a" opacity=".22"/><path d="M64 49 C66 48 70 48 72 50M74 58 C75 60 74 62 72 62" stroke="#a85a48" stroke-width=".9" fill="none" opacity=".7"/>`,
    }),
  },
  vivi: {
    couleurs: { fond: '#f6dde6', peau: '#f3cfae', poil: '#58bfe0', iris: '#3a2416', tenue: '#f2a6c4' },
    dessin: (c) => ({
      tissu: `<path d="M47 87 C52 95 68 95 73 87" fill="${c.peau}"/><path d="M46 88 C52 98 68 98 74 88" stroke="#e07aa0" stroke-width="2" fill="none"/>`
        // La cape rouge bordée d'or, sur les épaules.
        + `<path d="M8 122 C10 104 22 94 40 90 L46 100 C38 106 34 114 32 122Z" fill="${c.degrade('ca', '#c62e3c')}" stroke="${T}" stroke-width="1.4"/><path d="M112 122 C110 104 98 94 80 90 L74 100 C82 106 86 114 88 122Z" fill="${c.degrade('cb', '#c62e3c')}" stroke="${T}" stroke-width="1.4"/>`
        + `<path d="M40 90 L46 100 C38 106 34 114 32 122M80 90 L74 100 C82 106 86 114 88 122" stroke="#e8c24a" stroke-width="2.4" fill="none"/>`,
      devant: [['M42 52 C42 66 40 76 36 84 C42 82 46 72 46 60Z', `url(#${c.id}h)`], ['M78 52 C78 66 80 76 84 84 C78 82 74 72 74 60Z', `url(#${c.id}h)`]],
      // La fleur rouge piquée dans les cheveux.
      dessus: `<g transform="translate(40 36)">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-4.6" rx="3.4" ry="4.8" fill="${c.bombe('fl' + a, '#e0303c')}" stroke="#8f1f23" stroke-width=".8" transform="rotate(${a})"/>`).join('')}<circle r="2.4" fill="#f6d36b" stroke="#a8822a" stroke-width=".6"/></g>`,
      acc: `<circle cx="43" cy="66" r="3" fill="none" stroke="#e8c24a" stroke-width="1.6"/><circle cx="77" cy="66" r="3" fill="none" stroke="#e8c24a" stroke-width="1.6"/>`,
    }),
  },
  wapol: {
    couleurs: { fond: '#e8dcec', peau: '#d6cfcc', poil: '#6a3a8c', iris: '#2a1a3a', tenue: '#b42e3a' },
    dessin: (c) => ({
      sansOreilles: true,
      // La crinière violette en pointes, autour d'une grosse tête.
      derriere: Array.from({ length: 13 }, (_, k) => { const a = Math.PI * (0.82 + k * 0.105); const x = 60 + Math.cos(a) * 30, y = 54 + Math.sin(a) * 28; const p = (/** @type {number} */ d, /** @type {number} */ f) => `${(60 + Math.cos(a + d) * 30 * f).toFixed(1)} ${(54 + Math.sin(a + d) * 28 * f).toFixed(1)}`; return /** @type {[string, string]} */ ([`M${p(-0.14, 0.95)} L${p(0, 1.5)} L${p(0.14, 0.95)}Z`, `url(#${c.id}h)`]); }),
      tete: 'M34 54 C34 36 46 28 60 28 C74 28 86 36 86 54 C86 70 78 84 60 84 C42 84 34 70 34 54Z',
      tissu: `<circle cx="60" cy="104" r="2.6" fill="#f2c94c" stroke="#a8822a" stroke-width=".8"/><circle cx="60" cy="114" r="2.6" fill="#f2c94c" stroke="#a8822a" stroke-width=".8"/><path d="M46 87 C40 96 36 108 34 122M74 87 C80 96 84 108 86 122" stroke="#7a1a24" stroke-width="2" fill="none"/>`,
      devant: [['M42 38 C40 22 50 14 60 14 C70 14 80 22 78 38Z', c.degrade('ch', '#22202a', 0.4)], ['M36 40 C36 34 84 34 84 40 C84 44 36 44 36 40Z', '#16141c']],
      // La bouche de fer-blanc : un sourire géant aux dents plates.
      bouches: {
        '': `<path d="M38 66 C44 84 76 84 82 66Z" fill="#f6f4ef" stroke="${T}" stroke-width="2"/><path d="M44 68 V76M50 68 V79M56 68 V80M62 68 V80M68 68 V79M74 68 V76M40 72 H80" stroke="#a8a29c" stroke-width="1.4"/>`,
        choc: `<path d="M38 64 H82 C82 82 72 92 60 92 C48 92 38 82 38 64Z" fill="#4a1712" stroke="${T}" stroke-width="2"/><path d="M38 64 H82 V71 H38Z" fill="#f6f4ef" stroke="${T}" stroke-width="1.4"/><path d="M44 64 V71M50 64 V71M56 64 V71M62 64 V71M68 64 V71M74 64 V71" stroke="#a8a29c" stroke-width="1.2"/>`,
        fier: `<rect x="38" y="66" width="44" height="13" rx="3" fill="#f6f4ef" stroke="${T}" stroke-width="2"/><path d="M44 66 V79M50 66 V79M56 66 V79M62 66 V79M68 66 V79M74 66 V79M38 72.5 H82" stroke="#a8a29c" stroke-width="1.4"/>`,
        victime: `<rect x="40" y="68" width="40" height="8" rx="3" fill="#dcd8d2" stroke="${T}" stroke-width="2"/><path d="M46 68 V76M52 68 V76M58 68 V76M64 68 V76M70 68 V76M76 68 V76" stroke="#a8a29c" stroke-width="1.2"/>`,
      },
    }),
  },
  neptune: {
    couleurs: { fond: '#cfe7f1', peau: '#f6d4bc', poil: '#ef8a2a', iris: '#2a1a12', tenue: '#f2cfb6' },
    dessin: (c) => ({
      sansOreilles: true,
      // Cheveux et barbe orange en grosses boucles qui mangent le bas du visage.
      derriere: Array.from({ length: 14 }, (_, k) => { const a = Math.PI * 2 * k / 14; return /** @type {[string, string]} */ ([c.rond(60 + Math.cos(a) * 30, 64 + Math.sin(a) * 34, 12), c.bombe('cb' + k, '#ef8a2a')]); }),
      tissu: `<path d="M24 106 C30 102 36 104 38 110M96 106 C90 102 84 104 82 110" stroke="#4a6aa0" stroke-width="2" fill="none"/>`,
      poils: [['M38 58 C34 76 40 98 60 106 C80 98 86 76 82 58 C76 66 70 68 60 68 C50 68 44 66 38 58Z', c.bombe('ba', '#ef8a2a')]],
      visage: [[46, 80], [60, 92], [74, 80], [52, 98], [68, 98], [44, 92], [76, 92]].map(([x, y]) => `<path d="M${x - 5} ${y} C${x - 3} ${y - 4} ${x + 3} ${y - 4} ${x + 5} ${y}" stroke="#b85a14" stroke-width="1.6" fill="none"/>`).join(''),
      devant: [['M50 30 L48 18 L53 23 L56 13 L60 20 L64 13 L67 23 L72 18 L70 30Z', c.degrade('co', '#f2c040', 0.25)]],
      dessus: `<circle cx="60" cy="27" r="2" fill="#d8303c"/><circle cx="53" cy="27" r="1.3" fill="#3a8ad0"/><circle cx="67" cy="27" r="1.3" fill="#3a8ad0"/>`,
      acc: `<circle cx="60" cy="62" r="4.4" fill="${c.bombe('ne', '#e8605a')}" stroke="${T}" stroke-width="1.2"/>`,
      bouches: { '': '<path d="M55 72 C58 74 62 74 65 72" stroke="#8a3a12" stroke-width="1.8" fill="none" stroke-linecap="round"/>' },
    }),
  },
  charlos: {
    couleurs: { fond: '#e4eeda', peau: '#e3be98', poil: '#1e1a1c', iris: '#2a1a12', tenue: '#f6f6f2' },
    dessin: (c) => ({
      tissu: `<path d="M38 88 C46 96 74 96 82 88 L84 96 C76 104 44 104 36 96Z" fill="${c.degrade('cv', '#5fa04a')}" stroke="${T}" stroke-width="1.4"/><path d="M42 96 C50 101 70 101 78 96" stroke="#f2c94c" stroke-width="2.4" fill="none"/>`
        + [[46, 108, '#4a7ac0'], [60, 110, '#d8303c'], [74, 108, '#f2c94c'], [52, 118, '#5fa04a'], [68, 118, '#4a7ac0']].map(([x, y, col]) => `<circle cx="${x}" cy="${y}" r="3" fill="${col}" stroke="${T}" stroke-width="1"/>`).join('')
        + `<path d="M30 104 C34 100 36 98 40 98M90 104 C86 100 84 98 80 98" stroke="#d8d8d0" stroke-width="2" fill="none"/>`,
      devant: [
        // La boucle de cheveux dressée et les longs favoris.
        ['M53 32 C48 20 52 6 62 4 C70 4 72 12 68 16 C65 18 62 16 62 13 C58 16 56 24 60 32Z', c.degrade('bo', '#2a2428', 0.4)],
        ['M42 52 C40 38 48 30 60 30 C72 30 80 38 78 52 C74 44 68 40 60 40 C52 40 46 44 42 52Z', `url(#${c.id}h)`],
        ['M43 50 C42 58 43 66 46 72 L48 70 C46 64 46 56 47 50Z', `url(#${c.id}h)`], ['M77 50 C78 58 77 66 74 72 L72 70 C74 64 74 56 73 50Z', `url(#${c.id}h)`],
      ],
      // La bulle de résine autour de la tête.
      apres: `<circle cx="60" cy="52" r="40" fill="#dff1fa" fill-opacity=".12" stroke="#9dcde4" stroke-width="2.4"/><path d="M28 36 C34 24 44 16 56 14" stroke="#ffffff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".75"/><circle cx="86" cy="30" r="3" fill="#ffffff" opacity=".6"/>`,
      bouches: { '': `<path d="M53 69 C56 66.5 64 66.5 67 69 C64 72.5 56 72.5 53 69Z" fill="#c66a5c" stroke="${T}" stroke-width="1.2"/><path d="M53 69 C57 70.4 63 70.4 67 69" stroke="#8a3a2e" stroke-width="1"/>` },
    }),
  },
  // ---------- Egghead ----------
  vegapunk: {
    couleurs: { fond: '#f3e4e9', peau: '#f5d4bc', poil: '#f4f2ee', iris: '#2a1a12', tenue: '#f8f8f4' },
    // Revu sur les images (2026-10-17) : un long crâne chauve coiffé d'une petite
    // pomme, de grosses touffes blanches en pointes de chaque côté (un hérisson),
    // une épaisse moustache tombante. Pas de langue pendue : il est la victime.
    dessin: (c) => {
      const blanc = c.bombe('vb', '#f6f4f0');
      // Les touffes : des pointes qui rayonnent depuis les tempes, sur trois rangs.
      const pointes = [-1, 1].flatMap((s) => [[30, 38, 40], [38, 30, 52], [46, 24, 64], [54, 28, 76], [62, 36, 86]].flatMap(([y, l, a], k) => [0, 1].map((r) => {
        const x0 = 60 + s * (14 + r * 4), y0 = y + 6 + r * 3, ang = (a + r * 8) * Math.PI / 180, len = l - r * 6;
        const x1 = x0 + s * Math.sin(ang) * len, y1 = y0 - Math.cos(ang) * len * 0.55;
        return /** @type {[string, string]} */ ([`M${x0} ${y0 - 5} L${x1.toFixed(1)} ${y1.toFixed(1)} L${x0 + s * 2} ${y0 + 6}Z`, blanc]);
      })));
      return {
        sansOreilles: true,
        // Un visage long, le crâne haut et chauve.
        tete: 'M45 44 C45 30 51 24 60 24 C69 24 75 30 75 44 C76 58 74 70 70 77 C67 82 63 84 60 84 C57 84 53 82 50 77 C46 70 44 58 45 44Z',
        derriere: pointes,
        tissu: `<path d="M48 86 L60 116 L72 86Z" fill="${c.degrade('ro', '#f4a2b4')}"/>` + [[56, 94], [62, 102], [58, 110], [64, 92]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="#d8303c"/>`).join('')
          + `<path d="M48 86 L40 92 L52 122M72 86 L80 92 L68 122" stroke="#cfcac0" stroke-width="1.6" fill="none"/>`,
        // La petite pomme rouge posée sur le crâne, sa queue et sa feuille.
        dessus: `<path d="M50 24 C46 14 52 8 60 10 C68 8 74 14 70 24 C66 27 54 27 50 24Z" fill="${c.bombe('po', '#d8352a')}" stroke="${T}" stroke-width="1.6"/><path d="M53 15 C55 12 58 11 60 12" stroke="#ffffff" stroke-width="2.2" fill="none" opacity=".6" stroke-linecap="round"/>`
          + `<path d="M60 10 C60 6 61 3 63 1" stroke="${T}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M62 3 C67 -1 73 1 75 4 C70 6 66 5 62 3Z" fill="#5fa04a" stroke="${T}" stroke-width="1.1"/>`
          + `<path d="M50 34 C54 30 58 29 62 30" stroke="#ffffff" stroke-width="2" fill="none" opacity=".45" stroke-linecap="round"/>`,
        // Les sourcils blancs broussailleux, un long nez, la grosse moustache tombante.
        acc: `<path d="M45 46 C48 42 53 41 57 43M63 43 C67 41 72 42 75 46" stroke="${T}" stroke-width="5.4" fill="none" stroke-linecap="round"/><path d="M45 46 C48 42 53 41 57 43M63 43 C67 41 72 42 75 46" stroke="#f4f2ee" stroke-width="3.6" fill="none" stroke-linecap="round"/>`
          + `<path d="M58 52 C57 58 56 62 57 65 C59 67 62 67 63 65" stroke="${c.ombre}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
        // La moustache passe DEVANT la bouche (comme dans l'anime) ; une bouche
        // n'apparaît dessous que pour crier ou protester.
        bouches: { '': '', victime: '', choc: `<ellipse cx="60" cy="80.5" rx="4" ry="2.8" fill="#4a1712" stroke="${T}" stroke-width="1.2"/>`, fier: `<path d="M55 79.5 C57 82 63 82 65 79.5Z" fill="#4a1712" stroke="${T}" stroke-width="1.2"/>` },
        apres: `<path d="M42 74 C42 66 50 63 60 66 C70 63 78 66 78 74 C76 80 72 82 68 79 C66 76 63 74 60 74 C57 74 54 76 52 79 C48 82 44 80 42 74Z" fill="${blanc}" stroke="${T}" stroke-width="1.8" stroke-linejoin="round"/>`
          + `<path d="M50 70 C48 73 47 76 47 78M56 69 C55 72 55 75 55 77M64 69 C65 72 65 75 65 77M70 70 C72 73 73 76 73 78" stroke="#c9c4ba" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
      };
    },
  },
  york: {
    couleurs: { fond: '#f7e3c8', peau: '#f8dac0', poil: '#f2d06a', iris: '#3a7ab8', tenue: '#f08a2c' },
    dessin: (c) => ({
      // La capuche orange derrière la tête.
      derriere: [['M30 104 C24 80 30 52 44 44 L76 44 C90 52 96 80 90 104Z', c.degrade('ca', '#f08a2c')]],
      tissu: `<path d="M50 86 L60 96 L70 86" stroke="#c4641a" stroke-width="2" fill="none"/><rect x="45" y="104" width="10" height="14" rx="4.6" fill="none" stroke="#fff" stroke-width="2.8"/><path d="M73 105 C68 104 63 107 63 112 C63 116 66 118 68.5 118 C71 118 73 116 73 113.5 C73 111 71 109 68.5 109 C66 109 63.5 110.5 63 112.5" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/>`,
      // Ses lunettes orange relevées sur la tête.
      dessus: `<path d="M41 34 C50 30 70 30 79 34" stroke="${T}" stroke-width="3.6" fill="none"/>` + [51, 69].map((x) => `<circle cx="${x}" cy="32" r="6.4" fill="#c4641a" stroke="${T}" stroke-width="1.4"/><circle cx="${x}" cy="32" r="4.4" fill="${c.bombe('yl' + x, '#ffb060')}"/><circle cx="${x - 1.6}" cy="30.4" r="1.2" fill="#fff"/>`).join(''),
      visage: [[48, 62], [51, 63.5], [53.5, 61.6], [66.5, 61.6], [69, 63.5], [72, 62]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".8" fill="#c97a46"/>`).join(''),
      apres: c.victime ? '' : `<path d="M57.6 70.5 C57.6 75 58.6 77 60.4 77 C62.2 77 63.2 75 63.2 70.5Z" fill="#ec8098" stroke="${T}" stroke-width="1.1"/>`,
    }),
  },
  lilith: {
    couleurs: { fond: '#e7ddf2', peau: '#f6d8c4', poil: '#f08a3a', iris: '#3a2416', tenue: '#6a3cb4' },
    dessin: (c) => ({
      tissu: `<path d="M48 84 L72 84 L73 96 C66 99 54 99 47 96Z" fill="${c.degrade('pu', '#f4b4c6')}" stroke="${T}" stroke-width="1.2"/>`
        + `<path d="M18 106 C30 100 40 100 48 104M72 104 C80 100 90 100 102 106M12 118 C26 112 38 112 46 116M74 116 C82 112 94 112 108 118" stroke="#4a2a8a" stroke-width="2" fill="none"/>`,
      // La mèche orange qui lui cache un œil.
      devant: [['M40 54 C36 36 46 24 60 24 C74 24 84 34 80 52 C76 44 72 40 66 38 C64 44 60 48 56 50 C56 56 54 62 48 66 C44 62 44 58 44 54 C42 54 41 54 40 54Z', `url(#${c.id}h)`]],
      // Le casque audio et le pansement sur la joue.
      dessus: `<path d="M36 56 C34 38 46 26 60 26 C74 26 86 38 84 56" stroke="${T}" stroke-width="5" fill="none"/><path d="M36 56 C34 38 46 26 60 26 C74 26 86 38 84 56" stroke="#3a3a44" stroke-width="2.6" fill="none"/>`
        + `<rect x="30" y="50" width="11" height="18" rx="5" fill="${c.degrade('h1', '#2a2a32', 0.4)}" stroke="${T}" stroke-width="1.6"/><rect x="79" y="50" width="11" height="18" rx="5" fill="${c.degrade('h2', '#2a2a32', 0.4)}" stroke="${T}" stroke-width="1.6"/>`,
      acc: `<g transform="rotate(-14 70 64)"><rect x="65" y="61" width="11" height="6" rx="2" fill="#f4e6cc" stroke="#c8a888" stroke-width=".9"/><path d="M69 61 V67M72 61 V67" stroke="#d8c0a0" stroke-width=".7"/></g>`,
    }),
  },
  atlas: {
    couleurs: { fond: '#fce4ec', peau: '#f8dcc6', poil: '#f6a8c2', iris: '#3a7ab8', tenue: '#e45a6c' },
    dessin: (c) => {
      const blanc = c.bombe('cw', '#f7f3ee'), rose = c.bombe('cp', '#f6a8c2');
      const nuage = [[36, 48], [38, 34], [48, 24], [60, 20], [72, 24], [82, 34], [84, 48], [34, 62], [86, 62], [40, 74], [80, 74]];
      return {
        sansOreilles: true,
        // La chevelure en nuage, moitié blanche, moitié rose.
        derriere: nuage.map(([x, y]) => /** @type {[string, string]} */ ([c.rond(x, y, 12), x < 60 ? blanc : x > 60 ? rose : c.bombe('cm', '#fbd2de')])),
        tissu: `<path d="M38 88 C46 82 74 82 82 88 C76 96 44 96 38 88Z" fill="#faf8f4" stroke="${T}" stroke-width="1.4"/><path d="M54 98 H66 V108 H72 L60 120 L48 108 H54Z" fill="#f6d36b" stroke="${T}" stroke-width="1.2"/>`,
        devant: [[c.rond(50, 34, 8), blanc], [c.rond(60, 31, 8), c.bombe('cn', '#fbd2de')], [c.rond(70, 34, 8), rose]],
        // Les cornes de bélier.
        dessus: [-1, 1].map((s) => `<path d="M${60 + s * 26} 56 C${60 + s * 36} 54 ${60 + s * 40} 62 ${60 + s * 36} 68 C${60 + s * 32} 72 ${60 + s * 27} 68 ${60 + s * 30} 64 C${60 + s * 32} 62 ${60 + s * 34} 64 ${60 + s * 33} 66" fill="none" stroke="${T}" stroke-width="6.4" stroke-linecap="round"/><path d="M${60 + s * 26} 56 C${60 + s * 36} 54 ${60 + s * 40} 62 ${60 + s * 36} 68 C${60 + s * 32} 72 ${60 + s * 27} 68 ${60 + s * 30} 64 C${60 + s * 32} 62 ${60 + s * 34} 64 ${60 + s * 33} 66" fill="none" stroke="#b07a3e" stroke-width="3.8" stroke-linecap="round"/>`).join(''),
        visage: '<ellipse cx="49" cy="63" rx="5" ry="3" fill="#f0788c" opacity=".45"/><ellipse cx="71" cy="63" rx="5" ry="3" fill="#f0788c" opacity=".45"/>',
      };
    },
  },
  // ---------- Égypte (mythologie, domaine public) ----------
  // Fiche : docs/conviction-egypte-personnages.md, d'après les peintures des tombes.
  isis: {
    couleurs: { fond: '#f1e2c2', peau: '#dba46c', poil: '#15111a', iris: '#2a1a10', tenue: '#f4efe4' },
    // Sur la tête, le hiéroglyphe du TRÔNE (son nom).
    dessin: (c) => egyptienne(c, '#2e5d9f', `<path d="M49 25V6h7v11h15v8z" fill="${c.bombe('tr', '#d8b04a')}" stroke="${T}" stroke-width="1.6" stroke-linejoin="round"/><path d="M52 9v13M59 20h9" stroke="#2e5d9f" stroke-width="2"/>`),
  },
  nephthys: {
    couleurs: { fond: '#dcebe0', peau: '#d9a06a', poil: '#15111a', iris: '#2a1a10', tenue: '#f4efe4' },
    // Sur la tête, la MAISON surmontée d'une corbeille (son nom).
    dessin: (c) => egyptienne(c, '#3a9a8a', `<path d="M48 12h24c0 6-5 9-12 9s-12-3-12-9z" fill="${c.bombe('co', '#d8b04a')}" stroke="${T}" stroke-width="1.6" stroke-linejoin="round"/><path d="M51 21v6h18v-6" fill="none" stroke="${T}" stroke-width="5.2" stroke-linejoin="round"/><path d="M51 21v6h18v-6" fill="none" stroke="#3a9a8a" stroke-width="2.6" stroke-linejoin="round"/>`),
  },
  osiris: {
    couleurs: { fond: '#e8e6cc', peau: '#6fa86a', poil: '#2a2018', iris: '#2a1a10', tenue: '#f4f1e8' },
    dessin: (c) => ({
      sansOreilles: true,
      // Le linceul blanc, le collier, puis la crosse et le fléau croisés sur la poitrine.
      tissu: `<path d="M3 122C5 101 26 91 46 89h28c20 2 41 12 43 33z" fill="${c.degrade('li', '#f4f1e8', 0.18)}" stroke="${T}" stroke-width="1.4"/>`
        + `<path d="M24 112l18-10M80 100l18 12M30 120l26-14M66 106l26 14" stroke="#d6d0c0" stroke-width="1.6"/>`
        + collier('#d8b04a', '#2e5d9f', '#b8442e')
        + `<path d="M44 122L74 96" stroke="${T}" stroke-width="6" stroke-linecap="round"/><path d="M44 122L74 96" stroke="#d8b04a" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="3 3"/><path d="M74 96c4-4 2-10-3-10s-7 4-5 7" fill="none" stroke="${T}" stroke-width="5" stroke-linecap="round"/><path d="M74 96c4-4 2-10-3-10s-7 4-5 7" fill="none" stroke="#2e5d9f" stroke-width="2.6" stroke-linecap="round"/>`
        + `<path d="M78 122L48 96" stroke="${T}" stroke-width="5" stroke-linecap="round"/><path d="M78 122L48 96" stroke="#d8b04a" stroke-width="2.6" stroke-linecap="round"/><path d="M48 96l-8 10M48 96l-11 6M48 96l-6 12" stroke="#2e5d9f" stroke-width="2.4" stroke-linecap="round"/>`,
      // La barbe postiche tressée, recourbée au bout.
      poils: [['M55 74 L57 96 C57 101 64 102 66 97 C67 94 65 92 63 94 L65 74 C62 76 58 76 55 74Z', c.degrade('ba', '#2a2018', 0.3)]],
      acc: `<path d="M57 80h7M57.4 85h7M57.8 90h6.6" stroke="#6a5240" stroke-width="1.2"/>` + khol,
      // La couronne atef : un bulbe blanc, une plume d'autruche de chaque côté.
      dessus: `<path d="M44 46C40 30 34 14 38 2c6 8 10 26 12 44z" fill="${c.degrade('pg', '#efe9d8', 0.2)}" stroke="${T}" stroke-width="1.6" stroke-linejoin="round"/><path d="M76 46c4-16 10-32 6-44-6 8-10 26-12 44z" fill="${c.degrade('pd', '#efe9d8', 0.2)}" stroke="${T}" stroke-width="1.6" stroke-linejoin="round"/>`
        + `<path d="M40 14l6 4M39 24l7 3M41 34l6 2M80 14l-6 4M81 24l-7 3M79 34l-6 2" stroke="#b8b0a0" stroke-width="1.2"/>`
        + `<path d="M46 48C44 30 50 12 56 6c2-3 6-3 8 0 6 6 12 24 10 42z" fill="${c.degrade('at', '#f7f4ea', 0.16)}" stroke="${T}" stroke-width="1.8" stroke-linejoin="round"/>`
        + `<path d="M52 40c0-12 3-22 7-28" stroke="#ffffff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/><circle cx="60" cy="5" r="3.4" fill="#d8b04a" stroke="${T}" stroke-width="1.2"/>`
        + `<path d="M45 46h30v5H45z" fill="#d8b04a" stroke="${T}" stroke-width="1.4"/>`,
    }),
  },
  // ---------- Mythologies : la Crète, Asgard, Rome ----------
  // Fiche : docs/conviction-mythes-personnages.md (d'après vases, peintures, bustes).
  thesee: {
    couleurs: { fond: '#f2e0c8', tenue: '#b8442e' },
    dessin: (c) => ({
      // La tunique courte rouge sur une épaule, le baudrier de l'épée.
      tissu: epaulesNues(c) + `<path d="M28 122C30 106 38 96 50 92L84 94c12 6 20 16 22 28z" fill="${c.degrade('ch', '#b8442e')}" stroke="${T}" stroke-width="1.4"/><path d="M50 92C44 100 40 110 38 122" stroke="#8a2a1e" stroke-width="1.6" fill="none"/>`
        + `<path d="M74 92L42 122" stroke="${T}" stroke-width="6" stroke-linecap="round"/><path d="M74 92L42 122" stroke="#8a5a32" stroke-width="3.6" stroke-linecap="round"/><circle cx="62" cy="103" r="2.6" fill="#d8b04a" stroke="${T}" stroke-width="1"/>`,
    }),
  },
  ariane: {
    couleurs: { fond: '#dfe6f2', tenue: '#2e5d9f' },
    dessin: (c) => ({
      tissu: `<path d="M3 122C5 101 26 91 46 89h28c20 2 41 12 43 33z" fill="${c.degrade('ro', '#2e5d9f')}" stroke="${T}" stroke-width="1.4"/>`
        + `<path d="M22 110c12 4 64 4 76 0M18 118c14 4 70 4 84 0" stroke="#d8b04a" stroke-width="2.4" fill="none"/><path d="M46 90c4 8 24 8 28 0" stroke="#d8b04a" stroke-width="2.4" fill="none"/>`
        // Le fil rouge, qui court d'une épaule à l'autre.
        + `<path d="M24 104C40 96 56 112 72 100S92 98 98 104" stroke="${T}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M24 104C40 96 56 112 72 100S92 98 98 104" stroke="#d8303c" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
      dessus: `<path d="M41 44C50 39 70 39 79 44" stroke="#d8b04a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M41 44C50 39 70 39 79 44" stroke="${T}" stroke-width=".8" fill="none"/>`,
    }),
  },
  dedale: {
    couleurs: { fond: '#ece2cc' },
    // Le compas de l'inventeur, glissé dans le tablier.
    dessin: () => ({ apres: `<path d="M56 98l-8 22M56 98l8 22" stroke="${T}" stroke-width="3.4" stroke-linecap="round"/><path d="M56 98l-8 22M56 98l8 22" stroke="#c9c0ac" stroke-width="1.8" stroke-linecap="round"/><circle cx="56" cy="98" r="2.6" fill="#d8b04a" stroke="${T}" stroke-width="1"/>` }),
  },
  icare: {
    couleurs: { fond: '#dcecf6' },
    dessin: (c) => ({
      // Les ailes : un éventail de longues plumes de chaque côté, la cire dorée à leur pied
      // (les premiers essais ressemblaient à des lames, puis à des sapins).
      derriere: [-1, 1].flatMap((s) => AILE.map(([a, lg], k) => /** @type {[string, string]} */ ([plume(s, a, lg), k % 2 ? c.bombe('pa' + s, '#efe8d8') : c.bombe('pb' + s, '#f8f4ea')]))),
      tissu: `<path d="M3 122C5 101 26 91 46 89h28c20 2 41 12 43 33z" fill="${c.degrade('tu', '#f2ead8', 0.16)}" stroke="${T}" stroke-width="1.4"/><path d="M46 90c4 8 24 8 28 0" stroke="#c9c0ac" stroke-width="1.6" fill="none"/>`,
      apres: [-1, 1].map((s) => `<ellipse cx="${60 + s * 31}" cy="96" rx="7" ry="5" fill="#e0a83a" stroke="${T}" stroke-width="1.3"/><path d="M${60 + s * 29} 94c${s * 3}-2 ${s * 6}-2 ${s * 8} 0" stroke="#f6d36b" stroke-width="1.4" fill="none"/>`).join(''),
    }),
  },
  minos: {
    couleurs: { fond: '#ece0f0', tenue: '#6a2a7a' },
    dessin: (c) => ({
      tissu: `<path d="M3 122C5 101 26 91 46 89h28c20 2 41 12 43 33z" fill="${c.degrade('ma', '#6a2a7a')}" stroke="${T}" stroke-width="1.4"/><path d="M46 90C44 102 42 112 42 122M74 90C76 102 78 112 78 122" stroke="#d8b04a" stroke-width="2.6" fill="none"/>`,
      // La couronne de lys et ses plumes.
      dessus: `<path d="M42 38h36l-2 6H44z" fill="${c.bombe('cr', '#d8b04a')}" stroke="${T}" stroke-width="1.4"/>`
        + [[48, 30], [60, 26], [72, 30]].map(([x, y]) => `<path d="M${x} 38c-5-3-6-8-4-12 2 2 3 4 4 6 1-2 2-4 4-6 2 4 1 9-4 12z" fill="#f4efe4" stroke="${T}" stroke-width="1.1"/>`).join('')
        + `<path d="M60 26C56 14 60 6 66 2C66 10 64 18 60 26Z" fill="#3a8a8a" stroke="${T}" stroke-width="1.2"/><path d="M60 26C66 16 74 12 80 12C76 18 68 22 60 26Z" fill="#b8442e" stroke="${T}" stroke-width="1.2"/>`,
    }),
  },
  pasiphae: {
    couleurs: { fond: '#f6e6c8', tenue: '#e0a03a' },
    dessin: (c) => ({
      tissu: `<path d="M3 122C5 101 26 91 46 89h28c20 2 41 12 43 33z" fill="${c.degrade('ro', '#e0a03a')}" stroke="${T}" stroke-width="1.4"/>`
        + `<path d="M20 110c14 4 66 4 80 0M16 118c16 4 72 4 88 0" stroke="#2e5d9f" stroke-width="2.6" fill="none"/><path d="M46 90c4 8 24 8 28 0" stroke="#b8442e" stroke-width="2.6" fill="none"/>`,
      dessus: `<path d="M44 40C50 34 70 34 76 40L72 42C66 38 54 38 48 42Z" fill="${c.bombe('di', '#d8b04a')}" stroke="${T}" stroke-width="1.3"/><circle cx="60" cy="36" r="2.6" fill="#2e5d9f" stroke="${T}" stroke-width="1"/>`,
      acc: `<circle cx="43" cy="64" r="2.6" fill="none" stroke="#d8b04a" stroke-width="1.6"/><circle cx="77" cy="64" r="2.6" fill="none" stroke="#d8b04a" stroke-width="1.6"/>`,
    }),
  },
  baldr: {
    // Le dieu de la lumière : un fond doré (un halo cerclé faisait cadre).
    couleurs: { fond: '#fde49a', poil: '#f2cf5a', tenue: '#f6f2e8' },
    dessin: (c) => ({
      tissu: `<path d="M3 122C5 101 26 91 46 89h28c20 2 41 12 43 33z" fill="${c.degrade('tu', '#f6f2e8', 0.16)}" stroke="${T}" stroke-width="1.4"/><path d="M46 90c4 9 24 9 28 0" stroke="#d8b04a" stroke-width="3" fill="none"/><path d="M60 98v24" stroke="#d8b04a" stroke-width="2.4"/>`,
    }),
  },
  loki: {
    couleurs: { fond: '#e2eedc', poil: '#c0522f', tenue: '#2f7a4a' },
    dessin: (c) => ({
      tissu: `<path d="M3 122C5 101 26 91 46 89h28c20 2 41 12 43 33z" fill="${c.degrade('tu', '#2f7a4a')}" stroke="${T}" stroke-width="1.4"/>`
        + `<path d="M8 122C12 100 26 92 40 90L48 104C40 110 36 116 34 122Z" fill="${c.degrade('ca', '#a8381f')}" stroke="${T}" stroke-width="1.4"/><circle cx="44" cy="96" r="3.4" fill="#d8b04a" stroke="${T}" stroke-width="1.1"/>`,
      // Le sourire en coin et les sourcils en accent : le rusé.
      acc: `<path d="M45 45.5L56 47.5M75 43.5L64 47" stroke="${c.poilSombre}" stroke-width="2.6" stroke-linecap="round"/>`,
      bouches: { '': `<path d="M53 68c4 2 9 2 14-2" stroke="${T}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M67 66l2-2" stroke="${T}" stroke-width="1.6" stroke-linecap="round"/>` },
    }),
  },
  hod: {
    couleurs: { fond: '#ece4d6', tenue: '#7a5a3a' },
    dessin: (c) => ({
      tissu: `<path d="M3 122C5 101 26 91 46 89h28c20 2 41 12 43 33z" fill="${c.degrade('tu', '#7a5a3a')}" stroke="${T}" stroke-width="1.4"/><path d="M30 96L92 122" stroke="#d8c8a0" stroke-width="1.6"/><path d="M26 92C40 104 50 116 52 122" stroke="${T}" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M26 92C40 104 50 116 52 122" stroke="#a8784a" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      // Le frère aveugle : un bandeau sur les yeux.
      devant: [['M41 50C50 47 70 47 79 50L79 59C70 57 50 57 41 59Z', c.degrade('ba', '#8a8478', 0.2)]],
      acc: `<path d="M44 53.5C52 52 68 52 76 53.5" stroke="#6a655c" stroke-width="1" fill="none"/>`,
    }),
  },
  thor: {
    couleurs: { fond: '#e2e6ee', poil: '#c0522f', tenue: '#8a929c' },
    dessin: (c) => ({
      // La cotte de mailles, puis le marteau Mjölnir sur l'épaule.
      tissu: `<path d="M3 122C5 101 26 91 46 89h28c20 2 41 12 43 33z" fill="${c.degrade('cm', '#8a929c')}" stroke="${T}" stroke-width="1.4"/>`
        + [100, 106, 112, 118].map((y) => `<path d="M${22 + (y - 100) / 3} ${y}h${76 - (y - 100) / 1.5}" stroke="#6a727c" stroke-width="1.2" stroke-dasharray="2 2"/>`).join(''),
      apres: `<path d="M92 122L84 98" stroke="${T}" stroke-width="7" stroke-linecap="round"/><path d="M92 122L84 98" stroke="#7a5232" stroke-width="4.4" stroke-linecap="round"/><path d="M72 86l20-6 4 12-20 6z" fill="${c.bombe('ma', '#9aa1aa')}" stroke="${T}" stroke-width="1.8" stroke-linejoin="round"/><path d="M76 89l14-4" stroke="#dfe3e8" stroke-width="1.6" stroke-linecap="round"/>`,
      acc: `<path d="M56 82l-1 8M60 83v9M64 82l1 8" stroke="#8a3a1e" stroke-width="1.4" stroke-linecap="round"/>`,
    }),
  },
  odin: {
    couleurs: { fond: '#dde4ee', tenue: '#2f4b7a' },
    dessin: (c) => ({
      tissu: `<path d="M3 122C5 101 26 91 46 89h28c20 2 41 12 43 33z" fill="${c.degrade('ma', '#2f4b7a')}" stroke="${T}" stroke-width="1.4"/><path d="M46 90L54 122M74 90L66 122" stroke="#1f3458" stroke-width="2" fill="none"/>`,
      // Un seul œil : le cache-œil sur le gauche.
      devant: [['M45.5 50C49 48 55 48 58 51C58 57 55 60 51.5 60C48 60 45.5 56 45.5 50Z', '#1d1a1f']],
      acc: `<path d="M44 46L80 40M44 52L40 54" stroke="#1d1a1f" stroke-width="1.6" stroke-linecap="round"/>`,
      // Le chapeau à large bord du voyageur.
      dessus: `<path d="M26 40C36 32 84 32 94 40C88 44 32 44 26 40Z" fill="${c.degrade('cl', '#4a5568', 0.3)}" stroke="${T}" stroke-width="1.8" stroke-linejoin="round"/><path d="M42 38C42 22 50 14 60 14S78 22 78 38C70 40 50 40 42 38Z" fill="${c.degrade('ch', '#4a5568', 0.3)}" stroke="${T}" stroke-width="1.8"/><path d="M48 32C52 22 58 19 64 19" stroke="#7a8496" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
    }),
  },
  frigg: {
    couleurs: { fond: '#e2eaf4', poil: '#f2d06a', tenue: '#3a6aa8' },
    dessin: (c) => ({
      tissu: `<path d="M3 122C5 101 26 91 46 89h28c20 2 41 12 43 33z" fill="${c.degrade('ro', '#3a6aa8')}" stroke="${T}" stroke-width="1.4"/><path d="M46 90c4 8 24 8 28 0" stroke="#e8e4d6" stroke-width="2.6" fill="none"/>`
        // Les clés de la maison, à la ceinture.
        + `<path d="M74 104v12M78 104v10" stroke="#d8b04a" stroke-width="2.4" stroke-linecap="round"/><circle cx="76" cy="102" r="3" fill="none" stroke="#d8b04a" stroke-width="2"/>`,
      // Les tresses blondes en couronne.
      dessus: `<path d="M42 40C46 30 74 30 78 40" stroke="${T}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M42 40C46 30 74 30 78 40" stroke="${c.poil}" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="4 2"/><path d="M45 41C50 37 70 37 75 41" stroke="#c9ccd4" stroke-width="2" fill="none"/>`,
    }),
  },
  nanna: {
    couleurs: { fond: '#e4f0dc', poil: '#f2d06a', tenue: '#3f8a4a' },
    dessin: (c) => ({
      tissu: `<path d="M3 122C5 101 26 91 46 89h28c20 2 41 12 43 33z" fill="${c.degrade('ro', '#3f8a4a')}" stroke="${T}" stroke-width="1.4"/>`
        // Le collier d'or, un torque.
        + `<path d="M46 90C50 100 70 100 74 90" stroke="${T}" stroke-width="5.4" fill="none" stroke-linecap="round"/><path d="M46 90C50 100 70 100 74 90" stroke="#d8b04a" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,
    }),
  },
  cesar: {
    couleurs: { fond: '#efe3cf', peau: '#e8c4a0', poil: '#6a5442' },
    dessin: (c) => ({
      tissu: toge(c, '#6a2a7a'),
      dessus: laurier(c),
      // Le visage maigre : des joues creusées.
      visage: `<path d="M47 62c1 4 3 7 5 9M73 62c-1 4-3 7-5 9" stroke="${c.ombre}" stroke-width="1.3" fill="none" opacity=".7"/>`,
    }),
  },
  brutus: { couleurs: { fond: '#ece4d4' }, dessin: (c) => ({ tissu: toge(c, '#a8381f') }) },
  decimus: { couleurs: { fond: '#e2e6e0' }, dessin: (c) => ({ tissu: toge(c, '#3a6a4a') }) },
  antoine: { couleurs: { fond: '#f0e2d6' }, dessin: (c) => ({ tissu: cuirasse(c, '#b8302a') }) },
  lepide: { couleurs: { fond: '#e2e4ec' }, dessin: (c) => ({ tissu: cuirasse(c, '#2f4b7a') }) },
  spurinna: {
    couleurs: { fond: '#e6e0ec' },
    dessin: (c) => ({
      tissu: toge(c, '#4a3a5a', '#d8d0c4'),
      // Le bonnet pointu de l'haruspice, sa tige et son brin d'olivier.
      dessus: `<path d="M43 42C43 28 50 20 60 18C70 20 77 28 77 42C68 44 52 44 43 42Z" fill="${c.degrade('ap', '#efe9dc', 0.2)}" stroke="${T}" stroke-width="1.8"/><path d="M60 18V4" stroke="${T}" stroke-width="2.6" stroke-linecap="round"/><path d="M60 6c4-2 8-1 10 1-3 2-7 2-10-1z" fill="#6b8a3a" stroke="${T}" stroke-width="1"/><path d="M50 34c2-8 6-12 10-13" stroke="#ffffff" stroke-width="2.2" fill="none" opacity=".6" stroke-linecap="round"/>`,
    }),
  },
  // ---------- Remis d'équerre (2026-10-17) : ce qui rend chacun reconnaissable ----------
  // Le buste garde sa coiffure et sa tenue ; le costume y met la couleur de sa
  // maison ou de son nom, et un détail signature vu sur les images.
  // Le Trône de fer : les couleurs des maisons.
  cersei: signe('#f2dcc8', '#9a1f1f', (c) => ({ acc: lion(64, 100), apres: chaine(c) })),
  jaime: signe('#f2e2c0', '#c8a040', () => ({ apres: `<path d="M84 122C84 112 88 104 96 104C102 104 104 110 102 116L100 122Z" fill="${'#e8c04a'}" stroke="${T}" stroke-width="1.6"/><path d="M90 110l2 6M95 108l1 7" stroke="#a8822a" stroke-width="1.2"/>` + lion(52, 102) })),
  joffrey: signe('#f2dcc8', '#b8302a', () => ({ acc: lion(60, 104) })),
  tyrion: signe('#f2dcc8', '#7a2a1e', () => ({ acc: `<path d="M60 96l5 4-5 4-5-4z" fill="#d8b04a" stroke="${T}" stroke-width="1.1"/><path d="M54 104h12" stroke="#d8b04a" stroke-width="2.4"/>` })),
  sansa: signe('#dfe4ea', '#3a4656', () => ({ acc: `<path d="M44 92C50 102 70 102 76 92" stroke="#c9ccd4" stroke-width="2" fill="none" stroke-dasharray="2 2"/><path d="M60 100l3 4-3 3-3-3z" fill="#c9ccd4" stroke="${T}" stroke-width="1"/>` })),
  catelyn: signe('#dce6f0', '#2f5a8a', () => ({ acc: poisson(60, 102) })),
  edmure: signe('#dce6f0', '#2f5a8a', () => ({ acc: poisson(60, 104), apres: `<path d="M40 92L44 122M80 92L76 122" stroke="#a8381f" stroke-width="3"/>` })),
  robb: signe('#e2e6ea', '#4a4e56', () => ({ acc: loup(60, 104) })),
  littlefinger: signe('#e2e4ea', '#2a2e36', () => ({ acc: `<path d="M56 94c4-3 9-3 12 0l3-2-1 4c-2 3-6 4-9 3l-3 3-1-3c-2-1-2-3-1-5z" fill="#c9ccd4" stroke="${T}" stroke-width="1"/>`, visage: `<path d="M50 74c3 4 7 6 10 6s7-2 10-6" stroke="${'#3a3030'}" stroke-width="2.6" fill="none" opacity=".7"/>` })),
  varys: signe('#eae0ee', '#6a4a7a', () => ({ apres: `<path d="M40 92L44 122M80 92L76 122" stroke="#d8b04a" stroke-width="2"/>` })),
  olenna: signe('#e0ecdc', '#3f7a4a', () => ({ acc: rose(60, 102, '#d8b04a') })),
  margaery: signe('#e0ecdc', '#4f9a5a', () => ({ acc: rose(60, 100, '#d8b04a'), dessus: rose(44, 42, '#f2c4d0') })),
  walder: signe('#e4e4e2', '#4a4a50', () => ({ acc: `<path d="M54 98h12v8H54z" fill="#6a7a8a" stroke="${T}" stroke-width="1"/><path d="M56 98v8M60 98v8M64 98v8" stroke="#3a4a5a" stroke-width="1"/>` })),
  bolton: signe('#efdcdc', '#7a2a2a', () => ({ acc: `<path d="M54 96l6 10 6-10" stroke="#e8b0a8" stroke-width="2.4" fill="none"/>` })),

  // Cluedo : chacun porte la couleur de son nom.
  moutarde: signe('#f4e6b8', '#c8962a'), rose: signe('#f6d6dc', '#c62e3c'), pervenche: signe('#dce4f6', '#3a6ac0'),
  olive: signe('#dcecd6', '#3f7a3a'), violet: signe('#e6dcf0', '#6a2a8a'), leblanc: signe('#f0eeea', '#f4f2ec'),
  peche: signe('#fae4d6', '#f0a07a'), brun: signe('#ece0d4', '#7a4a2a'),

  // Benoit Blanc.
  ransom: signe('#efe6d6', '#e8dcc0', () => ({ tissu: tricot() })),
  harlan: signe('#e6e4e2', '#2a2a30', () => ({ acc: `<path d="M54 96l6 6 6-6M60 102v18" stroke="#c9302c" stroke-width="2.2" fill="none"/>` })),
  marta: signe('#e2ece6', '#4a7a8a'),
  birdie: signe('#e2f0dc', '#3f9a4a', () => ({ acc: `<path d="M46 90C52 100 68 100 74 90" stroke="#d8b04a" stroke-width="3" fill="none"/>` })),
  helen: signe('#f2f0ea', '#f4f2ec', () => ({ acc: `<path d="M50 88L60 102L70 88" stroke="#c9c4ba" stroke-width="2" fill="none"/>` })),
  duke: signe('#fae0e6', '#e0607a', () => ({ apres: [[44, 104], [70, 110], [56, 118], [80, 100], [36, 116]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="#f6d36b" stroke="${T}" stroke-width=".8"/><circle cx="${x}" cy="${y}" r="1.2" fill="#3f9a4a"/>`).join('') })),
  miles: signe('#e6ead8', '#8a9a5a'),

  // Sherlock Holmes.
  watson: signe('#e6e0d2', '#6a5236', () => ({ tissu: tweed('#6a5236') })),
  irene: signe('#ece0f2', '#5a2a7a', () => ({ acc: `<path d="M46 90C52 98 68 98 74 90" stroke="#f2f0ea" stroke-width="2.6" fill="none" stroke-dasharray="1 3" stroke-linecap="round"/>` })),
  lestrade: signe('#e2e4e6', '#3a4048'),
  hudson: signe('#efe6d6', '#6a3a4a'),

  // ---------- Les figures du jeu de cartes ----------
  // Rois : la couronne et la barbe viennent du buste (`hat: 'couronne'`, `barbe`) ; César, imberbe.
  david: { couleurs: { fond: FOND.pique, poil: '#eceae4' }, dessin: (c) => ({
    tissu: carte(c, '#c62e3c', '#2f4b9a') + `<path d="M46 89L40 122M74 89L80 122" stroke="#1d1a1f" stroke-width="6"/>`,
    // La harpe du roi David.
    apres: `<path d="M20 122C18 108 22 96 32 90C36 98 40 108 42 122Z" fill="none" stroke="${T}" stroke-width="5" stroke-linejoin="round"/><path d="M20 122C18 108 22 96 32 90C36 98 40 108 42 122Z" fill="none" stroke="#e0b040" stroke-width="3" stroke-linejoin="round"/>`
      + [25, 30, 35].map((x) => `<path d="M${x} ${x === 30 ? 96 : 102}V121" stroke="#f6f2e4" stroke-width=".9"/>`).join(''),
  }) },
  charlemagne: { couleurs: { fond: FOND.coeur, poil: '#f2f0ea' }, dessin: (c) => ({
    tissu: carte(c, '#c62e3c', '#1d1a1f') + `<path d="M86 100C92 104 98 112 100 122" stroke="#2f4b9a" stroke-width="8" fill="none"/>`,
    // L'épée levée.
    apres: `<path d="M98 122V74" stroke="${T}" stroke-width="6" stroke-linecap="round"/><path d="M98 118V74" stroke="#dfe3e8" stroke-width="3.6" stroke-linecap="round"/><path d="M90 112h16" stroke="${T}" stroke-width="5" stroke-linecap="round"/><path d="M90 112h16" stroke="#e0b040" stroke-width="3" stroke-linecap="round"/>`,
  }) },
  'cesar-carreau': { couleurs: { fond: FOND.carreau }, dessin: (c) => ({
    // La robe à bandes rouges, bleues et or.
    tissu: carte(c, '#c62e3c', '#c62e3c', [100, 108, 116].map((y) => `<path d="M${10 + (y - 100) / 2} ${y}C40 ${y - 4} 80 ${y - 4} ${110 - (y - 100) / 2} ${y}" stroke="${terne(c, '#2f4b9a')}" stroke-width="3" fill="none"/>`).join('')),
    apres: sceptre(16),
  }) },
  alexandre: { couleurs: { fond: FOND.trefle, poil: '#8a6a4a' }, dessin: (c) => ({
    tissu: carte(c, '#2f4b9a', '#c62e3c'),
    // Le globe d'or du conquérant.
    apres: `<circle cx="98" cy="108" r="9" fill="${c.bombe('gl', '#e0b040')}" stroke="${T}" stroke-width="1.6"/><path d="M89 108h18M98 99v-6M95 95h6" stroke="${T}" stroke-width="1.4"/>` + sceptre(16),
  }) },
  // Dames : le voile et la petite couronne (sauf Judith, en capuche bleue), une fleur.
  pallas: { couleurs: { fond: FOND.pique, poil: '#e8c25e' }, dessin: (c) => ({
    ...dame(c, '#e0b040'), tissu: carte(c, '#c62e3c', '#e0a030'),
    apres: fleur(20, 96, '#d8303c'),
  }) },
  judith: { couleurs: { fond: FOND.coeur, poil: '#5a3a22' }, dessin: (c) => ({
    ...dame(c, '#2f4b9a'),
    // L'hermine : blanc moucheté de noir sur les épaules.
    tissu: carte(c, '#c62e3c', '#2f4b9a') + `<path d="M3 122C5 108 14 99 26 94L34 122Z" fill="#f4f2ec"/><path d="M117 122C115 108 106 99 94 94L86 122Z" fill="#f4f2ec"/>`
      + [[12, 112], [20, 104], [24, 116], [108, 112], [100, 104], [96, 116]].map(([x, y]) => `<path d="M${x} ${y}v4M${x - 1.4} ${y + 4}h2.8" stroke="${T}" stroke-width="1.3"/>`).join(''),
    apres: fleur(100, 96, '#d8303c'),
  }) },
  rachel: { couleurs: { fond: FOND.carreau, poil: '#6a4a2a' }, dessin: (c) => ({
    ...dame(c), tissu: carte(c, '#2f4b9a', '#c62e3c'),
    apres: fleur(100, 94, '#c62e3c'),
  }) },
  argine: { couleurs: { fond: FOND.trefle, poil: '#3a2a1e' }, dessin: (c) => ({
    ...dame(c), tissu: carte(c, '#c62e3c', '#e0a030'),
    // L'éventail plié.
    apres: `<path d="M96 120L84 94C90 90 98 89 104 92Z" fill="#f4f2ec" stroke="${T}" stroke-width="1.4" stroke-linejoin="round"/><path d="M96 120L88 92M96 120L94 90M96 120L100 90" stroke="#c9c0ac" stroke-width="1"/>`,
  }) },
  // Valets : la toque plate, les cheveux au carré.
  ogier: { couleurs: { fond: FOND.pique, poil: '#e8c25e' }, dessin: (c) => ({
    ...valet(c, '#c62e3c', '#e0b040'), tissu: carte(c, '#c62e3c', '#e0a030'),
    // La plume jaune piquée sur la toque.
    dessus: `<path d="M74 34C80 22 88 14 98 12C94 20 86 30 76 38Z" fill="#f2c94c" stroke="${T}" stroke-width="1.3" stroke-linejoin="round"/><path d="M76 36C82 26 88 19 95 15" stroke="#c49a2a" stroke-width="1" fill="none"/>`,
  }) },
  lahire: { couleurs: { fond: FOND.coeur, poil: '#5a3a22' }, dessin: (c) => ({
    ...valet(c, '#2f4b9a', '#c62e3c'), tissu: carte(c, '#2f4b9a', '#c62e3c'),
    // La hallebarde.
    apres: arme(98, 124, 0, 'hallebarde'),
  }) },
  hector: { couleurs: { fond: FOND.carreau, poil: '#8a5a32' }, dessin: (c) => ({
    ...valet(c, '#c62e3c', '#2f4b9a'), tissu: carte(c, '#c62e3c', '#2f4b9a'),
    // La hache d'armes de Troie, posée sur l'épaule.
    apres: arme(30, 128, 2, 'hache', true),
  }) },
  lancelot: { couleurs: { fond: FOND.trefle, poil: '#6a4a2a' }, dessin: (c) => ({
    ...valet(c, '#2f4b9a', '#c62e3c'), tissu: carte(c, '#2f4b9a', '#c62e3c'),
    apres: rondache(100, 106, 13),
  }) },
};

/** Les personnages qui ont un costume (pour la validation). */
export const COSTUMES_CONNUS = Object.keys(COSTUMES);
