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
    dessin: (c) => ({
      sansOreilles: true,
      tete: 'M44 46 C44 36 51 32 60 32 C69 32 76 36 76 46 C77 60 74 72 70 78 C67 82 63 84 60 84 C57 84 53 82 50 78 C46 72 43 60 44 46Z',
      // Les cheveux blancs en pointes sur les côtés.
      derriere: [-1, 1].flatMap((s) => [0, 1, 2, 3, 4].map((k) => /** @type {[string, string]} */ ([`M${60 + s * 14} ${44 + k * 6} L${60 + s * (36 - k * 3)} ${38 + k * 7} L${60 + s * 15} ${49 + k * 6}Z`, '#f4f2ee']))),
      tissu: `<path d="M48 86 L60 116 L72 86Z" fill="${c.degrade('ro', '#f4a2b4')}"/>` + [[56, 94], [62, 102], [58, 110], [64, 92]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="#d8303c"/>`).join('')
        + `<path d="M48 86 L40 92 L52 122M72 86 L80 92 L68 122" stroke="#cfcac0" stroke-width="1.6" fill="none"/>`,
      // Le dessus du crâne est une pomme rouge, avec sa queue et sa feuille.
      devant: [['M42 42 C40 28 48 18 60 18 C72 18 80 28 78 42 C72 45 66 46 60 46 C54 46 48 45 42 42Z', c.bombe('po', '#d8352a')]],
      dessus: `<path d="M60 19 C60 13 62 9 64 7" stroke="${T}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M63 9 C69 4 76 6 78 10 C72 12 67 11 63 9Z" fill="#5fa04a" stroke="${T}" stroke-width="1.2"/><path d="M50 26 C54 22 58 21 62 22" stroke="#ffffff" stroke-width="2.6" fill="none" opacity=".55" stroke-linecap="round"/>`,
      poils: [['M45 70 C48 64 55 63 60 66 C65 63 72 64 75 70 C70 74 64 73 60 70 C56 73 50 74 45 70Z', '#f4f2ee']],
      // La langue toujours sortie, qui pend jusqu'à la poitrine.
      apres: `<path d="M55 74 C53 90 55 108 60 114 C65 108 67 90 65 74Z" fill="${c.degrade('la', '#ec8098', 0.2)}" stroke="${T}" stroke-width="1.6"/><path d="M60 78 V104" stroke="#c45a74" stroke-width="1.2"/>`,
    }),
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
};

/** Les personnages qui ont un costume (pour la validation). */
export const COSTUMES_CONNUS = Object.keys(COSTUMES);
