// Les visages du jeu, partout (pions, vignettes, scène d'accusation), dessinés
// depuis le `look` de chaque personne dans un carré de 120 :
// un contour d'un seul tenant (toutes les silhouettes tracées d'abord en
// épais, remplies ensuite par-dessus), du volume par dégradés, des cheveux
// qui couvrent le crâne, une barbe qui se distingue des cheveux.


import { bete } from './bete.js';
import { COSTUMES } from './costumes.js';

/** @typedef {import('../engine/types.js').Person} Person */

/** Teintes des pions, les mêmes que dans style.css (--p-*). */
const PAWN_HEX = {
  ocre: '#8a5800', sapin: '#1d6b42', prune: '#6b3fa0', brique: '#a8381f',
  canard: '#0f6878', rose: '#a82e6a', ardoise: '#44566a',
};
/** @typedef {'' | 'choc' | 'fier'} Humeur */

const SKIN = { clair: '#f6d5bb', rose: '#efc29f', hale: '#dca07a', mat: '#c08660', brun: '#9c6844', fonce: '#6a432e' };
const HAIR = { chatain: '#7a4a2c', brun: '#4a2c1a', noir: '#24191a', roux: '#c0522f', blond: '#e0bd62', gris: '#a3a8ae', blanc: '#eceae6' };
const TRAIT = '#2b1d17';
let uid = 0;

/** @param {string} a @param {string} b @param {number} t part de b */
function mix(a, b, t) {
  const p = (/** @type {string} */ h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

/** Symétrique d'un chemin autour de x = 60 (commandes absolues M L C Q Z seulement). @param {string} d */
function miroir(d) {
  let i = 0;
  return d.replace(/-?\d+(\.\d+)?/g, (n) => (i++ % 2 === 0 ? String(120 - Number(n)) : n));
}

/**
 * @param {Person} person
 * @param {Humeur} [mood]
 * @param {boolean} [serre] cadré sur le visage (pions, vignettes) plutôt que le buste entier
 * @returns {string} un <svg> complet
 */
export function buste(person, mood = '', serre = false) {
  // Une créature des autres jeux de l'Arcade a son propre dessin.
  if (person.look.espece) return bete(person, mood, serre);
  const L = person.look;
  const id = `b${++uid}`;
  // Un personnage d'œuvre (One Piece…) : un costume ajoute ses signes distinctifs (costumes.js).
  const K = L.perso ? COSTUMES[L.perso] : undefined;
  const fem = !!person.fem;
  const vieux = L.hair === 'degarni' || L.hairColor === 'gris' || L.hairColor === 'blanc';
  const base = person.victim ? '#5b616a' : (PAWN_HEX[/** @type {keyof typeof PAWN_HEX} */ (person.color)] ?? '#44566a');
  const fond = person.victim ? '#c9ccd1' : K?.couleurs?.fond ?? mix(base, '#ffffff', 0.62);
  let peau = K?.couleurs?.peau ?? SKIN[/** @type {keyof typeof SKIN} */ (L.skin)] ?? SKIN.rose;
  if (person.victim) peau = mix(peau, '#b9c0c8', 0.35);
  const poil = K?.couleurs?.poil ?? HAIR[/** @type {keyof typeof HAIR} */ (L.hairColor)] ?? HAIR.brun;
  const ombre = mix(peau, '#5a2414', 0.28);
  const poilSombre = mix(poil, '#120806', 0.4);
  const poilClair = mix(poil, '#ffffff', 0.3);
  const sourcil = mix(poil, '#1a0e08', vieux || L.hairColor === 'blond' ? 0.45 : 0.25);
  const iris = K?.couleurs?.iris ?? (L.hairColor === 'blond' ? '#3f74a8' : L.hairColor === 'roux' ? '#4f7d4a' : '#5a3a22');
  const extras = new Set(L.extras ?? []);
  const chap = L.hat ?? '';
  const couvre = chap === 'voile' || chap === 'capuche';

  /** Silhouettes : [chemin, remplissage]. Tracées deux fois (contour épais, puis remplissage). */
  /** @type {[string, string][]} */ const arriere = [];
  /** @type {[string, string][]} */ const devant = [];
  /** @type {[string, string][]} */ const poils = [];
  /** Détails dessinés sans contour épais, par couche. */
  let tissu = '', visage = '', cheveuxDet = '', dessus = '';

  const grad = (/** @type {string} */ n, /** @type {string} */ c, k = 0.28) =>
    `<linearGradient id="${id}${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(c, '#ffffff', 0.14)}"/><stop offset="1" stop-color="${mix(c, '#000000', k)}"/></linearGradient>`;
  const defs = [
    `<radialGradient id="${id}f" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="${mix(fond, '#ffffff', 0.35)}"/><stop offset="1" stop-color="${mix(fond, '#000000', 0.08)}"/></radialGradient>`,
    `<radialGradient id="${id}p" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="${mix(peau, '#ffffff', 0.2)}"/><stop offset=".7" stop-color="${peau}"/><stop offset="1" stop-color="${mix(peau, '#5a2414', 0.12)}"/></radialGradient>`,
    `<linearGradient id="${id}o" x1="0" x2="1"><stop offset=".45" stop-color="${ombre}" stop-opacity="0"/><stop offset="1" stop-color="${ombre}" stop-opacity=".7"/></linearGradient>`,
    grad('h', poil, 0.3),
  ];
  /** Ce que le costume dessine (costumes.js). */
  const X = K ? K.dessin({
    id, peau, poil, poilSombre, poilClair, ombre, base, fem, mood, victime: !!person.victim, mix, miroir, rond, TRAIT,
    degrade: (/** @type {string} */ n, /** @type {string} */ c, k = 0.3) => { defs.push(grad(n, c, k)); return `url(#${id}${n})`; },
    bombe: (/** @type {string} */ n, /** @type {string} */ c) => { defs.push(`<radialGradient id="${id}${n}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${mix(c, '#ffffff', 0.45)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${mix(c, '#000000', 0.35)}"/></radialGradient>`); return `url(#${id}${n})`; },
  }) : {};

  // ---------- Cheveux derrière la tête ----------
  if (L.hair === 'long' && !couvre) arriere.push(['M40 50 C38 30 48 21 60 21 C72 21 82 30 80 50 C81 66 84 82 89 98 L31 98 C36 82 39 66 40 50Z', `url(#${id}h)`]);
  if (L.hair === 'chignon' && !couvre) arriere.push(['M60 9 C67 9 71 14 71 20 C71 26 67 30 60 30 C53 30 49 26 49 20 C49 14 53 9 60 9Z', `url(#${id}h)`]);
  if (L.hair === 'degarni' && !couvre) {
    const touffe = 'M47 37 C40.5 39.5 37 47 37.5 55 C38 61 40.5 65.5 45.5 67 L46.5 61 C44.5 55 44.5 46 48 40Z';
    arriere.push([touffe, `url(#${id}h)`]);
    arriere.push([miroir(touffe), `url(#${id}h)`]);
  }
  if (L.hair === 'boucle' && fem) for (const [x, y] of [[41, 62], [79, 62], [43, 72], [77, 72]]) arriere.push([rond(x, y, 7), `url(#${id}h)`]);
  if (couvre) {
    const c = chap === 'voile' ? (person.victim ? '#8d939b' : mix(base, '#ffffff', 0.2)) : mix(base, '#000000', 0.35);
    defs.push(grad('v', c, 0.3));
    arriere.push(['M30 100 C26 74 30 34 60 20 C90 34 94 74 90 100Z', `url(#${id}v)`]);
  }

  arriere.push(...(X.derriere ?? []));

  // ---------- Corps et tenue ----------
  const corps = 'M8 122 C10 101 25 91 45 87 C50 86 54 85 56 85 L64 85 C66 85 70 86 75 87 C95 91 110 101 112 122Z';
  const tenue = {
    robe: base, tablier: base, chemise: mix(base, '#ffffff', 0.25), fourrure: base,
    costume: person.victim ? '#555b63' : '#323840', livree: mix(base, '#000000', 0.55), armure: '#9aa1aa',
    uniforme: mix(base, '#000000', 0.35), soutane: '#222226', manteau: mix(base, '#000000', 0.15),
    pourpoint: base, tunique: mix(base, '#8a6a4a', 0.45), maillot: base, cire: '#f2c230', salopette: '#26344d',
  }[L.outfit ?? 'costume'] ?? '#323840';
  const tenueFinale = K?.couleurs?.tenue ?? tenue;
  defs.push(grad('c', tenueFinale, 0.35));
  arriere.push([corps, `url(#${id}c)`]);
  const fonce = mix(tenue, '#000000', 0.35);
  switch (L.outfit) {
    case 'robe':
      tissu = `<path d="M47 87 C52 97 68 97 73 87 C66 89 54 89 47 87Z" fill="${peau}"/><path d="M45 87 C51 99 69 99 75 87" fill="none" stroke="${mix(base, '#ffffff', 0.45)}" stroke-width="2.4"/><path d="M28 104 C30 98 32 95 36 93M92 104 C90 98 88 95 84 93" stroke="${fonce}" stroke-width="1.4" fill="none" opacity=".6"/>`;
      break;
    case 'tablier':
      tissu = `<path d="M47 87 C52 95 68 95 73 87" fill="${peau}"/><path d="M44 100 L76 100 L80 122 L40 122Z" fill="#f7f4ee" stroke="#d8d2c6" stroke-width="1"/><path d="M48 100 L50 88M72 100 L70 88" stroke="#f7f4ee" stroke-width="3"/><path d="M52 108 L68 108 L67 116 L53 116Z" fill="none" stroke="#d8d2c6" stroke-width="1"/>`;
      break;
    case 'chemise':
      tissu = `<path d="M54 86 L60 98 L66 86Z" fill="${peau}"/><path d="M52 85 L55 95 L60 89 L65 95 L68 85" fill="${mix(tenue, '#ffffff', 0.5)}" stroke="${fonce}" stroke-width="1"/><path d="M60 98 L60 122" stroke="${fonce}" stroke-width="1"/><circle cx="60" cy="106" r="1.2" fill="${fonce}"/><circle cx="60" cy="115" r="1.2" fill="${fonce}"/><path d="M40 90 L44 122M80 90 L76 122" stroke="${mix(base, '#000000', 0.45)}" stroke-width="4"/>`;
      break;
    case 'livree':
      tissu = `<path d="M50 86 L60 112 L70 86Z" fill="#fbfbfb"/><path d="M50 86 L42 94 L56 120 L60 112Z" fill="${fonce}"/><path d="M70 86 L78 94 L64 120 L60 112Z" fill="${fonce}"/><path d="M54 89 L60 92 L66 89 L66 95 L60 92 L54 95Z" fill="#141414"/><circle cx="60" cy="100" r="1.3" fill="#c9c9c9"/><circle cx="60" cy="107" r="1.3" fill="#c9c9c9"/>`;
      break;
    case 'armure':
      tissu = `<path d="M22 104 C22 94 30 88 42 88 C46 94 46 100 42 106 C34 108 26 108 22 104Z" fill="#b6bcc4" stroke="#5c626a" stroke-width="1.5"/><path d="M98 104 C98 94 90 88 78 88 C74 94 74 100 78 106 C86 108 94 108 98 104Z" fill="#b6bcc4" stroke="#5c626a" stroke-width="1.5"/><path d="M50 86 L70 86 L72 94 L48 94Z" fill="#8a9099" stroke="#5c626a" stroke-width="1.2"/><path d="M52 96 L68 96 L66 122 L54 122Z" fill="${base}"/><circle cx="30" cy="98" r="1.4" fill="#5c626a"/><circle cx="90" cy="98" r="1.4" fill="#5c626a"/><path d="M26 101 C32 96 38 95 42 97M94 101 C88 96 82 95 78 97" stroke="#e1e5ea" stroke-width="1.3" fill="none"/>`;
      break;
    case 'uniforme':
      tissu = `<path d="M51 84 L69 84 L70 92 L50 92Z" fill="${fonce}" stroke="#d9b45a" stroke-width="1"/><path d="M60 92 L60 122" stroke="${fonce}" stroke-width="1.2"/>${[98, 106, 114].map((y) => `<circle cx="60" cy="${y}" r="1.7" fill="#e3c26a" stroke="#a8822a" stroke-width=".6"/>`).join('')}<path d="M26 94 L42 89 L43 94 L28 99Z" fill="#e3c26a" stroke="#a8822a" stroke-width=".8"/><path d="M94 94 L78 89 L77 94 L92 99Z" fill="#e3c26a" stroke="#a8822a" stroke-width=".8"/><path d="M30 99 L30 104M34 98 L34 103M38 96 L38 101M90 99 L90 104M86 98 L86 103M82 96 L82 101" stroke="#e3c26a" stroke-width="1.2"/><path d="M44 96 L76 118" stroke="${mix(base, '#ffffff', 0.15)}" stroke-width="4" opacity=".9"/>`;
      break;
    case 'soutane':
      tissu = `<path d="M52 84 L68 84 L68 90 L52 90Z" fill="#1a1a1d"/><rect x="57" y="85" width="6" height="5" rx="1" fill="#ffffff"/>${[98, 106, 114].map((y) => `<circle cx="60" cy="${y}" r="1.2" fill="#3a3a40"/>`).join('')}`;
      break;
    case 'manteau':
      tissu = `<path d="M52 86 L60 104 L68 86Z" fill="${extras.has('noeud') ? '#ffffff' : '#e9e4da'}"/><path d="M52 86 L40 92 L46 100 L40 104 L56 122 L60 104Z" fill="${fonce}"/><path d="M68 86 L80 92 L74 100 L80 104 L64 122 L60 104Z" fill="${fonce}"/><path d="M56 88 L64 88 L62 102 L60 104 L58 102Z" fill="${mix(base, '#ffffff', 0.15)}"/>`;
      break;
    case 'fourrure': {
      const f = person.victim ? '#d9d6cf' : '#ece2cf';
      const touffes = [];
      for (let i = 0; i <= 12; i++) { const x = 18 + i * 7; const y = 99 - Math.sin((i / 12) * Math.PI) * 10; touffes.push(`${x} ${y}`); }
      tissu = `<path d="M47 87 C52 95 68 95 73 87" fill="${peau}"/><path d="M16 104 C24 90 42 86 60 92 C78 86 96 90 104 104 C98 110 92 106 86 110 C80 104 74 108 68 104 C64 108 56 108 52 104 C46 108 40 104 34 110 C28 106 22 110 16 104Z" fill="${f}" stroke="${mix(f, '#000000', 0.25)}" stroke-width="1.2"/>`
        + touffes.map((t) => `<path d="M${t} q2 -3 4 0" stroke="${mix(f, '#000000', 0.18)}" stroke-width="1" fill="none"/>`).join('')
        + `<path d="M54 106 L66 106 L64 122 L56 122Z" fill="${mix(base, '#000000', 0.25)}"/>`;
      break;
    }
    case 'salopette':
      // Le marin : pull de laine bleu marine, salopette cirée jaune à bretelles, écharpe rouge.
      tissu = [34, 42, 78, 86].map((x) => `<path d="M${x} 100 L${x + (x < 60 ? -2 : 2)} 122" stroke="#1c2738" stroke-width="1" opacity=".7"/>`).join('')
        + `<path d="M44 102 L76 102 L78 122 L42 122Z" fill="#e8b020" stroke="#a87a10" stroke-width="1.4"/><path d="M50 106 L70 106 L69 114 L51 114Z" fill="#d9a018" stroke="#a87a10" stroke-width="1"/><circle cx="60" cy="109" r="1.4" fill="#5a4a2a"/>`
        + `<path d="M44 102 L38 88M76 102 L82 88" stroke="#e8b020" stroke-width="5" stroke-linecap="round"/><path d="M44 102 L38 88M76 102 L82 88" stroke="#a87a10" stroke-width="1" opacity=".6"/>`
        + `<path d="M48 84 C54 90 66 90 72 84 L74 90 C66 96 54 96 46 90Z" fill="#c0392b" stroke="#8f1f23" stroke-width="1"/><path d="M64 92 L70 108 L64 110 L60 94Z" fill="#c0392b" stroke="#8f1f23" stroke-width="1"/>`;
      break;
    case 'cire':
      // Ciré de marin : jaune, col montant, gros boutons, bavette du pull dessous.
      tissu = `<path d="M50 84 L70 84 L72 94 L48 94Z" fill="#e0ae1c" stroke="#a8800e" stroke-width="1.2"/><path d="M54 94 L66 94 L64 104 L56 104Z" fill="#2f4b62"/><path d="M60 104 L60 122" stroke="#a8800e" stroke-width="1.6"/>`
        + [108, 116].map((y) => `<circle cx="64" cy="${y}" r="2" fill="#3a3d40"/>`).join('') + `<path d="M30 104 C34 100 38 98 42 98M90 104 C86 100 82 98 78 98" stroke="#c4920e" stroke-width="1.4" fill="none"/>`;
      break;
    case 'maillot':
      // Maillot de bain : épaules nues, deux bretelles.
      tissu = `<path d="M8 122 C10 101 25 91 45 87 C52 86 68 86 75 87 C95 91 110 101 112 122 L84 122 C82 110 78 102 74 98 C66 102 54 102 46 98 C42 102 38 110 36 122Z" fill="${peau}"/>`
        + `<path d="M46 98 C46 92 44 89 42 88M74 98 C74 92 76 89 78 88" stroke="${mix(base, '#000000', 0.2)}" stroke-width="3" fill="none"/><path d="M36 122 C38 110 42 102 46 98 C54 102 66 102 74 98 C78 102 82 110 84 122" fill="none" stroke="${mix(base, '#ffffff', 0.4)}" stroke-width="2"/>`;
      break;
    case 'pourpoint': {
      // Moyen Âge, noble : pourpoint matelassé à col montant, cape agrafée.
      const cape = mix(base, '#000000', 0.45);
      tissu = `<path d="M52 84 L68 84 L69 91 L51 91Z" fill="${fonce}"/>`
        + [48, 54, 60, 66, 72].map((x) => `<path d="M${x} 92 L${x + (x - 60) * 0.25} 122" stroke="${fonce}" stroke-width="1" opacity=".55"/>`).join('')
        + [96, 102, 108, 114].map((y) => `<circle cx="60" cy="${y}" r="1.3" fill="${mix(base, '#ffffff', 0.5)}"/>`).join('')
        + `<path d="M8 122 C10 101 25 91 45 87 C40 96 36 108 34 122Z" fill="${cape}"/><path d="M112 122 C110 101 95 91 75 87 C80 96 84 108 86 122Z" fill="${cape}"/>`
        + `<path d="M45 87 C40 96 36 108 34 122M75 87 C80 96 84 108 86 122" stroke="${mix(cape, '#000000', 0.3)}" stroke-width="1.2" fill="none"/>`
        + `<circle cx="44" cy="91" r="3.2" fill="#d9b45a" stroke="#8a6a2a" stroke-width=".8"/><circle cx="44" cy="91" r="1.2" fill="#8a6a2a"/>`;
      break;
    }
    case 'tunique':
      // Moyen Âge, gens de maison et d'armes : tunique de laine lacée au col.
      tissu = `<path d="M50 85 C54 92 66 92 70 85" fill="${peau}"/><path d="M48 85 C53 94 67 94 72 85" fill="none" stroke="${fonce}" stroke-width="2.2"/>`
        + `<path d="M57 92 L63 96 M63 92 L57 96 M57 96 L63 100 M63 96 L57 100" stroke="#6a4a2a" stroke-width="1"/>`
        + `<path d="M30 102 C34 100 38 99 42 99M90 102 C86 100 82 99 78 99" stroke="${fonce}" stroke-width="1.2" fill="none" opacity=".6"/>`;
      break;
    default: // costume
      tissu = `<path d="M51 86 L60 108 L69 86Z" fill="#f4f4f2"/><path d="M51 86 L43 93 L54 120 L60 108Z" fill="${mix(tenue, '#000000', 0.3)}"/><path d="M69 86 L77 93 L66 120 L60 108Z" fill="${mix(tenue, '#000000', 0.3)}"/>`
        + (extras.has('noeud') ? '' : `<path d="M58 89 L62 89 L63.5 104 L60 108 L56.5 104Z" fill="${person.victim ? '#6a7079' : base}"/>`);
  }
  if (extras.has('noeud')) tissu += '<path d="M53 88 L60 91.5 L67 88 L67 95 L60 91.5 L53 95Z" fill="#141414"/>';
  if (extras.has('collier')) tissu += Array.from({ length: 11 }, (_, i) => { const a = Math.PI * (0.15 + 0.7 * i / 10); return `<circle cx="${(60 - Math.cos(a) * 13).toFixed(1)}" cy="${(86 + Math.sin(a) * 9).toFixed(1)}" r="1.5" fill="#f4eee0" stroke="#bdb39c" stroke-width=".4"/>`; }).join('');

  if (X.tissu !== undefined) tissu = X.tissu;

  // ---------- Cou, oreilles, visage ----------
  const cou = 'M52 66 L52 88 C56 90 64 90 68 88 L68 66Z';
  const tete = X.tete ?? (fem
    ? 'M44 50 C44 36 51 29 60 29 C69 29 76 36 76 50 C76 59 73 67 69 72 C66 75.5 63 77 60 77 C57 77 54 75.5 51 72 C47 67 44 59 44 50Z'
    : 'M43 50 C43 36 50 29 60 29 C70 29 77 36 77 50 C77 58 75.5 65 72 70.5 C68.5 75.5 64.5 77.5 60 77.5 C55.5 77.5 51.5 75.5 48 70.5 C44.5 65 43 58 43 50Z');
  const oreille = 'M45 49 C40 46 38 55 41 60 C42 62 44 62.5 46 61Z';
  arriere.push([cou, ombre]);
  if (!couvre && L.hair !== 'long' && !X.sansOreilles) { arriere.push([oreille, peau]); arriere.push([miroir(oreille), peau]); }
  arriere.push([tete, `url(#${id}p)`]);
  visage += `<path d="${tete}" fill="url(#${id}o)"/>`;
  if (!couvre && L.hair !== 'long') visage += `<path d="M43 52 C41.5 52 41.5 57 43.5 58M77 52 C78.5 52 78.5 57 76.5 58" stroke="${ombre}" stroke-width="1.2" fill="none"/>`;
  visage += `<ellipse cx="50" cy="62" rx="4.5" ry="2.4" fill="#e0675a" opacity="${fem ? 0.3 : 0.18}"/><ellipse cx="70" cy="62" rx="4.5" ry="2.4" fill="#e0675a" opacity="${fem ? 0.3 : 0.18}"/>`;
  visage += `<path d="M60.5 55 C59.5 59 57.5 61.5 58.2 63.2 C59.2 64.6 61.6 64.6 63 63.4" stroke="${mix(peau, '#5a2414', 0.45)}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
  if (vieux && !person.victim) visage += `<path d="M42.5 53.5 l3 1M77.5 53.5 l-3 1M52 64 C50.5 66 50.5 68 51.5 70M68 64 C69.5 66 69.5 68 68.5 70M53 41 C57 40 63 40 67 41" stroke="${mix(peau, '#5a2414', 0.35)}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".8"/>`;
  if (mood === 'choc' && !person.victim) visage += `<clipPath id="${id}x"><rect width="120" height="45"/></clipPath><path d="${tete}" fill="#46599a" opacity=".32" clip-path="url(#${id}x)"/><path d="M53 33 L53 41M57 32 L57 42M61 32 L61 42M65 32 L65 41" stroke="#2f3c6e" stroke-width="1" opacity=".6"/>`;

  visage += X.visage ?? '';
  poils.push(...(X.poils ?? []));

  // ---------- Barbe et moustache ----------
  const longue = vieux || L.hair === 'long' || chap === 'couronne' || chap === 'bonnet' || L.outfit === 'armure' || L.outfit === 'fourrure';
  let barbe = '';
  if (extras.has('barbe')) {
    const c = mix(poil, '#ffffff', L.hairColor === 'noir' ? 0.08 : 0);
    if (longue) {
      poils.push(['M43 52 C43 66 47 80 54 86 C57 88.5 63 88.5 66 86 C73 80 77 66 77 52 C75 60 73 64 70 66 C66 65 63 64.5 60 65.5 C57 64.5 54 65 50 66 C47 64 45 60 43 52Z', c]);
      barbe = `<path d="M50 72 C51 77 53 81 56 84M60 74 L60 86M70 72 C69 77 67 81 64 84M46 64 C47 70 49 74 51 77M74 64 C73 70 71 74 69 77" stroke="${poilSombre}" stroke-width=".9" fill="none" opacity=".55"/>`;
    } else {
      poils.push(['M51 69 C51 76 55 81.5 60 81.5 C65 81.5 69 76 69 69 C66 71.5 63 72 60 72 C57 72 54 71.5 51 69Z', c]);
      barbe = `<path d="M55 74 C56 77 58 79 60 79.5M65 74 C64 77 62 79 60 79.5" stroke="${poilSombre}" stroke-width=".8" fill="none" opacity=".5"/>`;
    }
    if (!extras.has('moustache') && !extras.has('moustache-ciree')) extras.add('moustache');
  }

  // ---------- Cheveux devant ----------
  const meche = (/** @type {string} */ d, w = 1.1) => `<path d="${d}" stroke="${poilSombre}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity=".55"/>`;
  const reflet = (/** @type {string} */ d) => `<path d="${d}" stroke="${poilClair}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>`;
  if (!couvre) {
    switch (L.hair) {
      case 'court':
        if (fem) {
          devant.push(['M39 68 C35 40 43 23 60 23 C77 23 85 40 81 68 C79 68 77 66 76.5 61 C76 51 74 44 70 40 C63 42 54 42 47 38 C45 44 44 51 43.5 61 C43 66 41 68 39 68Z', `url(#${id}h)`]);
          cheveuxDet = meche('M47 30 C54 26 64 26 72 31') + meche('M42 50 C42 58 42 63 41 66') + meche('M78 50 C78 58 78 63 79 66') + reflet('M50 28 C55 25.5 61 25.5 65 26.5');
        } else {
          devant.push(['M41 52 C38 36 46 23 60 23 C74 23 82 36 79 52 C78 47 76.5 43.5 74.5 41 C70 38.5 65 38 61 39.5 C56 41 51 41.5 46 41 C44 44.5 42 48 41 52Z', `url(#${id}h)`]);
          cheveuxDet = meche('M46 34 C52 29 62 27.5 70 30.5') + meche('M47 39 C53 35 62 34 72 37') + reflet('M52 27 C57 25 63 25 67 26.5') + `<path d="M43.5 50 L44.5 56M76.5 50 L75.5 56" stroke="${poilSombre}" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>`;
        }
        break;
      case 'long':
        devant.push(['M40 58 C38 34 48 23 60 23 C72 23 82 34 80 58 C80 71 82 83 87 96 C81 99 76 97 74 92 C72 81 74.5 67 74.5 56 C74.5 48 71 41 65 38 C63 41 61.5 43 60 45.5 C58.5 43 57 41 55 38 C49 41 45.5 48 45.5 56 C45.5 67 48 81 46 92 C44 97 39 99 33 96 C38 83 40 71 40 58Z', `url(#${id}h)`]);
        cheveuxDet = meche('M60 26 L60 44') + meche('M44 44 C42 60 42 78 38 92') + meche('M76 44 C78 60 78 78 82 92') + meche('M48 46 C47 60 48 76 44 90', 0.8) + meche('M72 46 C73 60 72 76 76 90', 0.8) + reflet('M52 28 C49 30 46 35 45 40') + reflet('M68 28 C71 30 74 35 75 40');
        break;
      case 'chignon':
        devant.push(['M42 51 C40 34 49 25 60 25 C71 25 80 34 78 51 C77 45 74 40 68 37 C63 35.5 57 35.5 52 37 C46.5 40 43.5 45 42 51Z', `url(#${id}h)`]);
        cheveuxDet = meche('M45 42 C49 34 55 30 60 29.5') + meche('M75 42 C71 34 65 30 60 29.5') + meche('M52 14 C56 12 64 12 68 14') + meche('M51 22 C56 25 64 25 69 22') + reflet('M54 28.5 C57 27.5 63 27.5 66 28.5');
        break;
      case 'boucle': {
        const pts = fem ? [[44, 44], [42, 54], [48, 33], [56, 27], [65, 27], [72, 33], [77, 44], [78, 54]] : [[45, 42], [49, 32], [57, 27], [65, 27], [72, 32], [76, 42]];
        for (const [x, y] of pts) devant.push([rond(x, y, 7.2), `url(#${id}h)`]);
        devant.push(['M46 42 C48 33 54 30 60 30 C66 30 72 33 74 42 C68 38 52 38 46 42Z', `url(#${id}h)`]);
        cheveuxDet = pts.map(([x, y]) => `<path d="M${x - 3} ${y + 1} C${x - 2} ${y - 3} ${x + 2} ${y - 3} ${x + 3} ${y}" stroke="${poilClair}" stroke-width="1.3" fill="none" opacity=".7"/>`).join('');
        break;
      }
      case 'degarni':
        cheveuxDet = `<ellipse cx="54" cy="35" rx="6" ry="2.6" fill="#ffffff" opacity=".35" transform="rotate(-18 54 35)"/>` + meche('M49 33 C54 31 62 31 68 33', 0.7);
        break;
    }
  } else if (L.hair !== 'degarni') {
    // Sous le voile ou la capuche : une frange de cheveux à la naissance du front.
    devant.push(['M45 46 C46 37 52 33 60 33 C68 33 74 37 75 46 C70 41 66 40 60 40 C54 40 50 41 45 46Z', `url(#${id}h)`]);
    cheveuxDet = meche('M50 39 C54 36 60 35.5 66 37');
  }

  // ---------- Chapeaux ----------
  const or = `url(#${id}or)`;
  if (chap === 'couronne' || chap === 'kepi' || chap === 'bibi') defs.push(`<linearGradient id="${id}or" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dc8a"/><stop offset=".55" stop-color="#d9b45a"/><stop offset="1" stop-color="#a8822a"/></linearGradient>`);
  switch (chap) {
    case 'couronne':
      devant.push(['M43 31 L45 14 L52 23 L60 10 L68 23 L75 14 L77 31 C70 28.5 50 28.5 43 31Z', or]);
      dessus += `<path d="M43 31 C50 28.5 70 28.5 77 31 L77 35 C70 32.5 50 32.5 43 35Z" fill="#c49a3e"/><circle cx="60" cy="25" r="2.6" fill="#b8323a" stroke="#7a1c22" stroke-width=".6"/><circle cx="50" cy="29" r="1.6" fill="#2f6fb0"/><circle cx="70" cy="29" r="1.6" fill="#2f6fb0"/><circle cx="45" cy="14" r="1.6" fill="#f6dc8a"/><circle cx="60" cy="10" r="1.8" fill="#f6dc8a"/><circle cx="75" cy="14" r="1.6" fill="#f6dc8a"/><path d="M47 20 L48 28M60 15 L60 24" stroke="#fff3c4" stroke-width="1.1" opacity=".7"/>`;
      break;
    case 'melon':
      devant.push(['M43 35 C43 20 51 13 60 13 C69 13 77 20 77 35Z', '#2c2622']);
      devant.push(['M36 36 C36 32 46 31 60 31 C74 31 84 32 84 36 C84 40 74 40 60 40 C46 40 36 40 36 36Z', '#231e1b']);
      dessus += '<path d="M43.5 31 C50 29 70 29 76.5 31 L76.8 34 C70 32.4 50 32.4 43.2 34Z" fill="#4a403a"/><path d="M50 19 C54 16 60 15.5 64 16.5" stroke="#5a504a" stroke-width="1.6" fill="none"/>';
      break;
    case 'haut-de-forme':
      devant.push(['M46 34 L46 5 C52 3 68 3 74 5 L74 34Z', '#1d1d21']);
      devant.push(['M35 35 C35 31 46 30 60 30 C74 30 85 31 85 35 C85 39 74 39 60 39 C46 39 35 39 35 35Z', '#18181b']);
      dessus += `<path d="M46 26 L74 26 L74 31 L46 31Z" fill="${mix(base, '#000000', 0.2)}"/><path d="M50 7 L50 25" stroke="#3a3a42" stroke-width="2"/>`;
      break;
    case 'paille':
      devant.push(['M46 32 L47.5 19 C53 17 67 17 72.5 19 L74 32Z', '#e6c46e']);
      devant.push(['M32 33 C32 29 44 28 60 28 C76 28 88 29 88 33 C88 37 76 38 60 38 C44 38 32 37 32 33Z', '#d9b45a']);
      dessus += `<path d="M46.8 25 L73.2 25 L73.6 30 L46.4 30Z" fill="${mix(base, '#000000', 0.15)}"/><path d="M36 33 C46 31 74 31 84 33M48 21 L72 21" stroke="#b8923e" stroke-width=".8" fill="none"/>`;
      break;
    case 'casquette':
      devant.push(['M41 38 C39 25 49 18 61 18 C73 18 82 25 80 38 C70 35 52 35 41 38Z', mix(base, '#000000', 0.3)]);
      devant.push(['M42 38 C52 34.5 66 34.5 77 38 C71 42.5 50 42.5 42 38Z', mix(base, '#000000', 0.48)]);
      dessus += `<circle cx="60" cy="19" r="1.6" fill="${mix(base, '#000000', 0.5)}"/><path d="M48 24 C54 21 66 21 72 24" stroke="${mix(base, '#ffffff', 0.15)}" stroke-width="1" fill="none"/>`;
      break;
    case 'chasse':
      devant.push(['M41 40 C40 24 49 15 60 15 C71 15 80 24 79 40Z', '#8a7a5a']);
      devant.push(['M41 38 C36 38 33 42 34 48 C38 46 41 44 43 41Z', '#7a6a4a']);
      devant.push([miroir('M41 38 C36 38 33 42 34 48 C38 46 41 44 43 41Z'), '#7a6a4a']);
      dessus += '<path d="M44 26 L76 26M42 32 L78 32M50 17 L48 39M60 15 L60 40M70 17 L72 39" stroke="#6a5a3c" stroke-width=".8"/><circle cx="60" cy="14.5" r="1.8" fill="#6a5a3c"/>';
      break;
    case 'bibi':
      devant.push(['M60 27 C62 22 72 20 80 24 C82 27 76 31 64 31 C61 30 59.5 29 60 27Z', mix(base, '#000000', 0.35)]);
      dessus += `<path d="M72 23 C76 14 84 10 90 11 C86 14 82 18 76 25Z" fill="#e6c46e" stroke="#a8822a" stroke-width=".6"/><path d="M75 23 C80 17 84 14 88 12.5" stroke="#a8822a" stroke-width=".6" fill="none"/><circle cx="66" cy="27" r="1.6" fill="${or}"/>`;
      break;
    case 'toque':
      devant.push(['M44 36 L44 26 C38 24 37 14 44 12 C46 4 56 2 60 8 C64 2 74 4 76 12 C83 14 82 24 76 26 L76 36Z', '#ffffff']);
      dessus += '<path d="M44 30 L76 30" stroke="#dcdcdc" stroke-width="1.2"/><path d="M52 12 C52 18 52 22 53 26M68 12 C68 18 68 22 67 26M60 9 L60 26" stroke="#e2e2e2" stroke-width="1" fill="none"/>';
      break;
    case 'kepi':
      devant.push(['M46 36 L47.5 18 C54 16 66 16 72.5 18 L74 36Z', mix(base, '#000000', 0.3)]);
      devant.push(['M44 36 C52 33.5 68 33.5 78 36 C74 41 52 41 44 36Z', '#18181b']);
      dessus += `<path d="M47 22 L73 22" stroke="${or}" stroke-width="1.6"/><path d="M47.3 30 L72.7 30" stroke="${or}" stroke-width="1.2"/><circle cx="60" cy="26" r="1.8" fill="${or}"/>`;
      break;
    case 'bonnet':
      // Bonnet de laine de marin, bord roulé côtelé.
      devant.push(['M41 42 C40 28 49 21 60 21 C71 21 80 28 79 42Z', '#4a4e5a']);
      devant.push(['M38 45 C38 37 82 37 82 45 C82 49 38 49 38 45Z', '#3c4049']);
      dessus += [44, 50, 56, 62, 68, 74].map((x) => `<path d="M${x} 39 L${x} 48" stroke="#2a2d34" stroke-width="1.6"/>`).join('') + '<path d="M48 29 C54 25 64 25 70 28" stroke="#5e6270" stroke-width="2" fill="none"/>';
      break;
    case 'suroit':
      // Suroît de marin : chapeau de pluie jaune, bord plus long derrière.
      devant.push(['M42 36 C42 22 50 16 60 16 C70 16 78 22 78 36Z', '#f2c230']);
      devant.push(['M30 38 C30 33 44 32 60 32 C76 32 92 34 94 42 C88 44 80 40 76 40 C66 39 54 39 44 40 C38 40 30 41 30 38Z', '#e0ae1c']);
      dessus += '<path d="M46 26 C52 22 68 22 74 26" stroke="#c4920e" stroke-width="1.4" fill="none"/><path d="M60 16 L60 32" stroke="#c4920e" stroke-width="1.2"/>';
      break;
    case 'voile':
    case 'capuche': {
      const ouv = 'M30 100 C26 74 30 34 60 20 C90 34 94 74 90 100 C85 90 81 78 79 64 C77 46 70 36 60 36 C50 36 43 46 41 64 C39 78 35 90 30 100Z';
      devant.push([ouv, `url(#${id}v)`]);
      const pli = chap === 'voile' ? mix(base, '#000000', 0.15) : mix(base, '#000000', 0.55);
      dessus += `<path d="M38 50 C34 66 33 82 34 96M82 50 C86 66 87 82 86 96M46 30 C52 26 60 25 66 27" stroke="${pli}" stroke-width="1.3" fill="none" opacity=".7"/>`;
      if (chap === 'voile') dessus += `<path d="M41 60 C42 46 49 37.5 60 37.5 C71 37.5 78 46 79 60" stroke="${mix(base, '#ffffff', 0.55)}" stroke-width="2.2" fill="none"/>`;
      break;
    }
  }
  if (extras.has('ruban')) dessus += `<path d="M72 30 L80 24 L80 34Z M72 30 L66 23 L64 33Z" fill="${mix(base, '#ffffff', 0.25)}" stroke="${mix(base, '#000000', 0.3)}" stroke-width=".8"/><circle cx="72" cy="30" r="2" fill="${mix(base, '#000000', 0.2)}"/>`;

  devant.push(...(X.devant ?? []));
  dessus += X.dessus ?? '';

  // ---------- Expression ----------
  const victime = !!person.victim;
  let yeux = '', sourcils = '', bouche = '', emotion = '';
  if (victime) {
    yeux = `<path d="M47.5 54 C49.5 56.5 54.5 56.5 56.5 54M63.5 54 C65.5 56.5 70.5 56.5 72.5 54" stroke="${TRAIT}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    sourcils = `<path d="M47 47.5 C50 46.5 54 46.5 56.5 47.5M63.5 47.5 C66 46.5 70 46.5 73 47.5" stroke="${sourcil}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    bouche = `<path d="M56 69.5 L64 69.5" stroke="#7a4a44" stroke-width="1.4" stroke-linecap="round"/>`;
  } else if (mood === 'choc') {
    yeux = [52, 68].map((x) => `<ellipse cx="${x}" cy="54" rx="5.6" ry="6" fill="#ffffff" stroke="${TRAIT}" stroke-width="1.4"/><circle cx="${x}" cy="54.6" r="1.4" fill="#120a06"/>`).join('');
    sourcils = `<path d="M45 46 C48 44.5 52 42.5 56 40.5M75 46 C72 44.5 68 42.5 64 40.5" stroke="${sourcil}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    bouche = '<path d="M53.5 71 C56 65.5 64 65.5 66.5 71 C66.5 75 63.5 76.5 60 76.5 C56.5 76.5 53.5 75 53.5 71Z" fill="#4a1712" stroke="#2b0d0a" stroke-width="1"/><path d="M55.6 69.4 C58 67.9 62 67.9 64.4 69.4 L63.9 70.6 C61.5 69.7 58.5 69.7 56.1 70.6Z" fill="#f4efe8"/><path d="M56.5 75 C58.5 73 61.5 73 63.5 75 C62 76 58 76 56.5 75Z" fill="#b84a40"/>';
    emotion = '<path d="M84 34 C88 40 89 44 86 46 C83 47.5 80.5 44.5 82 41 C82.8 38.6 83.2 37 84 34Z" fill="#bfe4f7" stroke="#3f84ab" stroke-width=".9"/><path d="M35 44 C37.5 48 38 50.5 36.2 51.8 C34.4 52.8 32.8 51 33.6 48.6 C34 47.2 34.4 46 35 44Z" fill="#bfe4f7" stroke="#3f84ab" stroke-width=".8"/>';
  } else {
    const r = mood === 'fier' ? 2.8 : 3;
    yeux = [52, 68].map((x) => `<ellipse cx="${x}" cy="54.5" rx="4.4" ry="3.5" fill="#ffffff"/><circle cx="${x + 0.4}" cy="54.8" r="${r}" fill="${iris}"/><circle cx="${x + 0.4}" cy="54.8" r="${r * 0.48}" fill="#120a06"/><circle cx="${x + 1.5}" cy="53.6" r="1" fill="#ffffff"/><path d="M${x - 4.8} 54.2 C${x - 3} 50.6 ${x + 3} 50.6 ${x + 4.8} 54.2" stroke="${TRAIT}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`).join('');
    if (fem) yeux += `<path d="M47.4 53 L45.6 51.6M72.6 53 L74.4 51.6" stroke="${TRAIT}" stroke-width="1.3" stroke-linecap="round"/>`;
    if (mood === 'fier') {
      sourcils = `<path d="M45 45 C48.5 45.5 52.5 47 56.5 49.5M75 45 C71.5 45.5 67.5 47 63.5 49.5" stroke="${sourcil}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
      bouche = '<path d="M54 68.5 C57 67 63 67 66 68.5 C65.5 73.5 63 75 60 75 C57 75 54.5 73.5 54 68.5Z" fill="#4a1712" stroke="#2b0d0a" stroke-width="1"/><path d="M55.3 68.9 C58 68 62 68 64.7 68.9 L64.3 70.3 C61.7 69.6 58.3 69.6 55.7 70.3Z" fill="#f4efe8"/><path d="M57 73.5 C59 72 61 72 63 73.5" fill="#c4554a"/>';
      emotion = '<path d="M80 31 C82 33 82 35 80 37M86 31 C84 33 84 35 86 37M80 31 C82 33 84 33 86 31M80 37 C82 35 84 35 86 37" stroke="#d23b3b" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    } else {
      sourcils = `<path d="M46.5 47.5 C49.5 45.2 53.5 45 56.5 46.3M63.5 46.3 C66.5 45 70.5 45.2 73.5 47.5" stroke="${sourcil}" stroke-width="${fem ? 1.8 : 2.4}" fill="none" stroke-linecap="round"/>`;
      bouche = fem
        ? '<path d="M55 68.6 C57.5 67.4 59 68 60 68.4 C61 68 62.5 67.4 65 68.6 C63 71.8 57 71.8 55 68.6Z" fill="#c4605a"/><path d="M55 68.6 C58 70 62 70 65 68.6" stroke="#8a3a2e" stroke-width="1" fill="none"/>'
        : '<path d="M55 68.8 C58 70.6 62 70.6 65 68.8" stroke="#8a3a2e" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M57 71.6 C59 72.4 61 72.4 63 71.6" stroke="' + ombre + '" stroke-width="1" fill="none" stroke-linecap="round"/>';
    }
  }

  if (X.bouches) bouche = X.bouches[victime ? 'victime' : mood] ?? X.bouches[''] ?? bouche;
  if (X.yeux) yeux = X.yeux;

  // ---------- Détails ----------
  let moust = '';
  const cMoust = mix(poil, '#000000', 0.1);
  if (extras.has('moustache')) moust = `<path d="M51.5 66.5 C54 63.5 57.5 63 60 65 C62.5 63 66 63.5 68.5 66.5 C66 67.6 63 67.4 60 66.2 C57 67.4 54 67.6 51.5 66.5Z" fill="${cMoust}" stroke="${poilSombre}" stroke-width=".8"/>`;
  if (extras.has('moustache-ciree')) moust = `<path d="M60 65 C56 62.5 50 62.5 47 65 C45.5 66.5 44 66 44 64 C42.5 67 45 69 48 67.6 C52 66 56 66.2 60 67 C64 66.2 68 66 72 67.6 C75 69 77.5 67 76 64 C76 66 74.5 66.5 73 65 C70 62.5 64 62.5 60 65Z" fill="${cMoust}" stroke="${poilSombre}" stroke-width=".8"/>`;
  let acc = '';
  if (extras.has('lunettes')) acc += `<circle cx="52" cy="54.5" r="6.4" fill="rgb(230 240 248 / .18)" stroke="#2a2420" stroke-width="1.5"/><circle cx="68" cy="54.5" r="6.4" fill="rgb(230 240 248 / .18)" stroke="#2a2420" stroke-width="1.5"/><path d="M58.4 54 C59.4 53 60.6 53 61.6 54M45.6 53.5 L43 52M74.4 53.5 L77 52" stroke="#2a2420" stroke-width="1.4" fill="none"/>`;
  if (extras.has('monocle')) acc += '<circle cx="68" cy="54.5" r="6.6" fill="rgb(220 235 245 / .25)" stroke="#d9b45a" stroke-width="1.6"/><path d="M73 59 C76 68 76 80 72 88" stroke="#d9b45a" stroke-width=".8" fill="none"/>';
  if (extras.has('cicatrice')) acc += '<path d="M68 42 L74 61" stroke="#a84a3a" stroke-width="1.6" stroke-linecap="round"/><path d="M68.6 46 L72 44.8M70 50.4 L73.4 49.2M71.3 54.8 L74.7 53.6" stroke="#a84a3a" stroke-width="1.1" stroke-linecap="round"/>';
  if (extras.has('pipe')) acc += '<path d="M64 71 C68 72 72 72 76 70" stroke="#3d2a1a" stroke-width="2.2" fill="none"/><path d="M75 64 L83 64 L83 72 C83 75 75 75 75 72Z" fill="#4a3220" stroke="#2b1d12" stroke-width="1"/>';
  if (extras.has('boucles')) acc += '<circle cx="43" cy="64.5" r="2.3" fill="#f3e3a0" stroke="#a8822a" stroke-width=".6"/><circle cx="77" cy="64.5" r="2.3" fill="#f3e3a0" stroke="#a8822a" stroke-width=".6"/>';

  acc += X.acc ?? '';

  // ---------- Assemblage ----------
  const silh = [...arriere, ...poils, ...devant];
  const contour = silh.map(([d]) => `<path d="${d}"/>`).join('');
  const remplir = (/** @type {[string, string][]} */ l, trait = false) => l.map(([d, f]) => `<path d="${d}" fill="${f}"${trait ? ` stroke="${TRAIT}" stroke-width="1" stroke-opacity=".55"` : ''}/>`).join('');
  return `<svg viewBox="${serre ? '19 11 82 82' : '0 0 120 120'}" aria-hidden="true" focusable="false"><defs>${defs.join('')}</defs>`
    + `<rect width="120" height="120" fill="url(#${id}f)"/>`
    + `<g fill="${TRAIT}" stroke="${TRAIT}" stroke-width="3.4" stroke-linejoin="round">${contour}</g>`
    + remplir(arriere) + tissu + visage
    + remplir(poils) + barbe + bouche + moust + yeux + sourcils
    + remplir(devant, true) + cheveuxDet + dessus + acc + (X.apres ?? '') + emotion
    + '</svg>';
}

/** Cercle en chemin (pour le contour commun). @param {number} x @param {number} y @param {number} r */
function rond(x, y, r) {
  return `M${x - r} ${y} C${x - r} ${y - r * 0.55} ${x - r * 0.55} ${y - r} ${x} ${y - r} C${x + r * 0.55} ${y - r} ${x + r} ${y - r * 0.55} ${x + r} ${y} C${x + r} ${y + r * 0.55} ${x + r * 0.55} ${y + r} ${x} ${y + r} C${x - r * 0.55} ${y + r} ${x - r} ${y + r * 0.55} ${x - r} ${y}Z`;
}
