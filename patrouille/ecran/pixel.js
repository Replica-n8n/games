// Le style « 16 bits » (option de la carte, 2026-10-22) : la même partie, dessinée en
// pixel art dans l'esprit de A Link to the Past (nos dessins, aucun sprite de Nintendo).
// Tout se peint dans une toile de 120 × 214 points (le jeu divisé par 3), puis s'agrandit
// sans lissage. Les petits personnages sont des sprites écrits en lettres ; les deux boss
// reprennent leur dessin vectoriel, réduit au tiers, ce qui le pixelise. L'interface
// (cœurs, messages) reste celle du jeu, dessinée par-dessus.
// Ne modifie jamais la partie.
import { W, H, DEFIL } from '../moteur/constantes.js';
import { dessinerBoss } from './rendu.js';

const LW = 120, LH = 214, K = 3; // résolution « console » et facteur d'agrandissement
const NOIR = '#000000';
let bas = null, bx = null;
function toile() {
  if (!bas) { bas = document.createElement('canvas'); bas.width = LW; bas.height = LH; bx = bas.getContext('2d'); }
  return bx;
}
function hasard(g) { let a = g >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hachage = (s) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
const px = (x, c, X, Y) => { x.fillStyle = c; x.fillRect(Math.round(X), Math.round(Y), 1, 1); };
const rect = (x, c, X, Y, w, h) => { x.fillStyle = c; x.fillRect(Math.round(X), Math.round(Y), w, h); };
/** Un disque pixelisé : contour, ombre en bas à droite, reflets en haut à gauche. */
function boule(x, cx, cy, r, c) {
  cx = Math.round(cx); cy = Math.round(cy);
  for (let j = -r - 1; j <= r + 1; j++) for (let i = -r - 1; i <= r + 1; i++) {
    const d = Math.hypot(i, j);
    if (d > r + 0.5) continue;
    let col = c.mid;
    if (d > r - 0.6) col = c.trait;
    else if (i + j > r * 0.55) col = c.ombre;
    else if (i + j < -r * 0.6 && (i * 3 + j * 5) % 4 !== 0) col = c.clair;
    px(x, col, cx + i, cy + j);
  }
}
function ovale(x, cx, cy, rx, ry, c, bord) {
  for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) {
    const d = (i / rx) ** 2 + (j / ry) ** 2;
    if (d > 1) continue;
    px(x, bord && d > 0.78 ? bord : c, cx + i, cy + j);
  }
}

// ---------- les sprites ----------
// Chaque sprite est une liste de lignes ; une lettre = une couleur de sa palette, « . » =
// transparent. Peint une fois dans sa propre toile (et sa version blanche, quand il est
// touché), puis collé.
const S = {};
function def(nom, pal, lignes) { S[nom] = { pal, lignes }; }
def('avion', { k: NOIR, v: '#58d070', V: '#a8f0b0', o: '#287838', w: '#ffffff', b: '#2850c0', y: '#f8d840' },
  ['......k......', '.....kvk.....', '.....kVk.....', '....kvwvk....', '....kvbvk....', '...kkvvvkk...', '.kkvvvvvvvkk.', 'kvvvVvvvVvvvk', 'kooookvkooook', '.kk..kvk..kk.', '.....kvk.....', '....kvvvk....', '....kkykk....']);
def('rover', { k: NOIR, o: '#f8a040', O: '#ffd090', r: '#c06020', g: '#484050', b: '#283860', w: '#fff0c0' },
  ['..kk.....kk..', '.kggkwkwkggk.', '.kggkkkkkggk.', '..kkoOOOokk..', '...kobbbok...', '...kobbbok...', '...koooook...', '...kOooook...', '.kggkooookggk', '.kggkrrrrkggk', '..kk.kkkk.kk.']);
def('luciole', { k: NOIR, y: '#f8e858', Y: '#fffcc0', g: '#506030', w: '#e0f0f0' }, ['.kk.kk.', 'kwwkwwk', '.kgggk.', '.kgggk.', '.kyYyk.', '..kyk..', '...k...']);
def('luciole2', { k: NOIR, y: '#f8e858', Y: '#fffcc0', g: '#506030', w: '#e0f0f0' }, ['.......', 'kkk.kkk', 'wwkgkww', '.kgggk.', '.kyYyk.', '..kyk..', '...k...']);
def('graine', { k: NOIR, w: '#e8d8a0', b: '#a06030' }, ['kk.......', 'kwk......', '.kwk.....', '..kbbk...', '..kbbbk..', '...kbbk..', '.....kwk.', '......kwk', '.......kk']);
def('graine2', { k: NOIR, w: '#e8d8a0', b: '#a06030' }, ['.......kk', '......kwk', '.....kwk.', '...kbbk..', '..kbbbk..', '..kbbk...', '.kwk.....', 'kwk......', 'kk.......']);
def('scarabee', { k: NOIR, o: '#ff7a3d', O: '#ffc090' }, ['.k.....k.', '..k...k..', '..kkkkk..', '.kooOook.', 'kooOkoook', 'koOokoook', 'kooOkoook', '.kookook.', 'k.kkkkk.k']);
def('perroquet', { k: NOIR, g: '#40a048', b: '#2860c0', r: '#e03030', w: '#ffffff', y: '#f8c040' },
  ['k...........k', 'gk.........kg', 'ggk..kkk..kgg', '.bggkrrrkggb.', '..bgkrwrkgb..', '....krrrk....', '....kryrk....', '.....kyk.....', '......k......']);
def('plante', { k: NOIR, g: '#4f9a3a', p: '#e868a8', P: '#ffb0d8', m: '#5a1430' },
  ['..k.....k..', '.kgk...kgk.', 'kgggk.kgggk', '.kgkkkkkgk.', '..kpppppk..', '.kpPkkkPpk.', '.kpkmmmkpk.', '.kpPkkkPpk.', '..kpppppk..', '.kgk...kgk.', '..k.....k..']);
def('champignon', { k: NOIR, r: '#e03838', w: '#ffffff' }, ['...kkkkk...', '.kkrrwrrkk.', 'krrwrrrrwrk', 'krrrrwrrrrk', 'kwrrrrrrwrk', '.kkrrrrrkk.', '...kwwwk...', '...kwwwk...', '....kkk....']);
def('gloutonnet', { k: NOIR, v: '#8a6cff', V: '#c8b8ff', w: '#ffffff' }, ['..kkkkk..', '.kvvvvvk.', 'kvVkkkvvk', 'kvkwkwkvk', 'kvkkkkkvk', 'kvvkkkVvk', '.kvvvvvk.', '..kkkkk..']);
def('porteur', { k: NOIR, y: '#ffe066', r: '#ff3d6e', w: '#ffffff' }, ['....k....', '...kyk...', 'kkkyyykkk', 'kyyrwryyk', '.kyrrryk.', '..kyyyk..', '.kyk.kyk.', '.kk...kk.']);
def('chasseur', { k: NOIR, m: '#d94dff', M: '#f0a8ff', w: '#ffffff' }, ['...k...', '..kmk..', '.kmMmk.', 'kmmwmmk', '.kmmmk.', '..kmk..', '...k...']);
def('vautour', { k: NOIR, m: '#a08868', M: '#d0b898', w: '#f8f0e0', y: '#f8b840' }, ['k.........k', 'mk.......km', 'Mmk.kwk.kmM', '.mmkwwwkmm.', '..kkkykkk..', '....kyk....', '.....k.....']);
def('herbe', { k: NOIR, h: '#d8c06a' }, ['..kkkkk..', '.kh.h.hk.', 'khkhkhkhk', 'k.hkhkh.k', 'khkhkhkhk', 'k.hkhkh.k', 'khkhkhkhk', '.kh.h.hk.', '..kkkkk..']);
def('hoplie', { k: NOIR, b: '#3878f0', B: '#80d0ff', v: '#6040c8', n: '#202040' }, ['.k.....k.', 'k.k.k.k.k', '..knnnk..', '.kbBbvbk.', 'kbBbkbvvk', 'kbBbkbvvk', 'kbbbkbvvk', 'kbbbkvvvk', '.kbbkvvk.', 'k.kkkkk.k', '.k.....k.']);
def('scorpion', { k: NOIR, o: '#e0603a', O: '#ffa070', y: '#f8d040' }, ['....kyyk...', '....kook...', '....kook...', '...kooook..', '..koooOok..', '..kooOook..', '...kooook..', '..kokkkok..', '.kok...kok.', 'kok.....kok', 'kk.......kk']);
def('cactus', { k: NOIR, g: '#5aa860', G: '#a8e0a0' }, ['....kkk....', '...kgGgk...', '..kgGgggk..', 'kkkgggggkkk', 'kgkgGgggkgk', 'kgkgggggkgk', 'kkkgggGgkkk', '..kgggggk..', '...kgggk...', '....kkk....']);
def('taupe', { k: NOIR, m: '#8a6a52', M: '#b89880', p: '#ff90b0', w: '#f0d0b0' }, ['...kkkkk...', '..kmmmmmk..', '.kmMmmmMmk.', 'kmmkmmmkmmk', 'kmmmmmmmmmk', '.kmmmpmmmk.', '..kwmmmwk..', '.kwk...kwk.', '..k.....k..']);
def('copain', { k: NOIR, w: '#ffffff', b: '#2850c0', B: '#80b0ff', g: '#5fd68a' }, ['..kkkkk..', '.kwwwwwk.', 'kwbbbbbwk', 'kwbBbbbwk', 'kwwwwwwwk', '.kggggk..', '.kgk.kgk.', '..k...k..']);
def('cristal', { k: NOIR, c: '#58e0ff', C: '#d8faff', d: '#2890c0' }, ['..k..', '.kCk.', 'kCcck', 'kcccd', 'kccdk', '.kdk.', '..k..']);
def('tirBleu', { k: '#102860', b: '#40c0ff', w: '#ffffff' }, ['.kk.', 'kwbk', 'kbbk', '.kk.']);
def('tirRouge', { k: '#400008', r: '#ff3040', y: '#ffd040' }, ['.kk.', 'kyrk', 'krrk', '.kk.']);
def('cadeauArme', { k: NOIR, w: '#ffffff', b: '#3d7bff', y: '#f8d840' }, ['kkkkkkk', 'kwwbwwk', 'kwwbwwk', 'kbbybbk', 'kwwbwwk', 'kwwbwwk', 'kkkkkkk']);
def('cadeauBonus', { k: NOIR, w: '#ffffff', r: '#ff3d6e', y: '#f8d840' }, ['kkkkkkk', 'kwwrwwk', 'kwwrwwk', 'krryrrk', 'kwwrwwk', 'kwwrwwk', 'kkkkkkk']);
def('caisse', { k: NOIR, b: '#b07a3f', B: '#e0b070' }, ['kkkkkkkkk', 'kBbbbbbBk', 'kbBbbbBbk', 'kbbBbBbbk', 'kbbbBbbbk', 'kbbBbBbbk', 'kbBbbbBbk', 'kBbbbbbBk', 'kkkkkkkkk']);
def('tremplin', { k: NOIR, b: '#c08040', B: '#8a5a28', w: '#fff0c0' }, ['kkkkkkkkkkkkkkkkkkkkk', 'kbbbbbbbbbbbbbbbbbbbk', 'kbbwbbbbbbwbbbbbbwbbk', 'kbwbwbbbbwbwbbbbwbwbk', 'kwbbbwbbwbbbwbbwbbbwk', 'kbbbbbbbbbbbbbbbbbbbk', 'kBBBBBBBBBBBBBBBBBBBk', 'kkkkkkkkkkkkkkkkkkkkk']);

const CACHE = new Map();
function peint(nom, blanc) {
  const cle = nom + (blanc ? '!' : '');
  if (CACHE.has(cle)) return CACHE.get(cle);
  const { pal, lignes } = S[nom];
  const c = document.createElement('canvas'); c.width = lignes[0].length; c.height = lignes.length;
  const x = c.getContext('2d');
  lignes.forEach((l, j) => [...l].forEach((ch, i) => { if (ch !== '.') px(x, blanc ? (ch === 'k' ? NOIR : '#ffffff') : pal[ch], i, j); }));
  CACHE.set(cle, c);
  return c;
}
/** Colle un sprite centré sur un point du JEU (coordonnées 360 × 640). */
function sprite(x, nom, gx, gy, blanc = false) {
  const c = peint(nom, blanc);
  x.drawImage(c, Math.round(gx / K - c.width / 2), Math.round(gy / K - c.height / 2));
}

// ---------- les sols, une suite de tuiles par mission (comme le style peint) ----------
const PALETTES = {
  jungle: { herbe: '#48a048', fonce: '#307830', clair: '#78c060' },
  desert: { herbe: '#e0c880', fonce: '#c8b068', clair: '#a88848' },
};
const ARBRE = { trait: '#082010', mid: '#287838', ombre: '#185828', clair: '#68b850' };
const ARBRE_SOMBRE = { trait: '#081808', mid: '#1c6030', ombre: '#104020', clair: '#4c9840' };
const BUISSON = { trait: '#082010', mid: '#58b048', ombre: '#388030', clair: '#a8e080' };
const ROC = { trait: NOIR, mid: '#908878', ombre: '#686058', clair: '#d0c8b8' };
function houppier(x, cx, cy, R, c) {
  for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) if (Math.hypot(i, j * 1.1) <= R) px(x, 'rgba(0,0,0,.25)', cx + i + 2, cy + j + 3);
  const lobes = [[0, 0, R - 2]]; for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; lobes.push([Math.round(Math.cos(a) * R * 0.55), Math.round(Math.sin(a) * R * 0.55), Math.round(R * 0.5)]); }
  for (const [dx, dy, rr] of lobes) boule(x, cx + dx, cy + dy, Math.max(2, rr), c);
}
function riviere(x, cx0, amp) { // elle entre et sort au même endroit : les tuiles se raccordent
  for (let Y = 0; Y < LH; Y++) {
    const c = cx0 + Math.round(Math.sin(Y / LH * Math.PI * 2) * amp), l = 10;
    rect(x, '#a07840', c - l - 3, Y, 2, 1); rect(x, '#a07840', c + l + 1, Y, 2, 1);
    rect(x, '#203890', c - l - 1, Y, 1, 1); rect(x, '#203890', c + l, Y, 1, 1);
    rect(x, '#4878d8', c - l, Y, l * 2, 1);
    for (let X = c - l; X < c + l; X++) if ((X * 7 + Y * 3) % 17 === 0) rect(x, '#c8e0ff', X, Y, 2, 1);
  }
}
function falaises(x) {
  const T = ['#503018', '#a06030', '#c87840', '#e0a060'];
  for (const cote of [-1, 1]) for (let Y = 0; Y < LH; Y++) {
    const l = 18 + Math.round(Math.sin(Y / LH * Math.PI * 2 + (cote > 0 ? 2 : 0)) * 4);
    for (let t = 0; t < 3; t++) { const w = l - t * 6, X = cote < 0 ? 0 : LW - w; rect(x, T[t + 1], X, Y, w, 1); px(x, T[0], cote < 0 ? w : LW - w - 1, Y); }
    if (Y % 9 === 0) rect(x, T[0], cote < 0 ? l - 10 : LW - l + 6, Y, 4, 1);
  }
}
function mare(x, cx, cy, rx, ry, bord = '#2848a0') {
  ovale(x, cx, cy, rx + 1, ry + 1, '#a07840'); ovale(x, cx, cy, rx, ry, '#4878d8', bord);
  for (let k = 0; k < rx; k += 3) px(x, '#c8e0ff', cx - rx / 2 + k, cy - 1);
}
function palmier(x, r, cx, cy) {
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; for (let d = 1; d < 7; d++) { px(x, d === 6 ? '#082010' : k % 2 ? '#3f8a3a' : '#58b048', cx + Math.cos(a) * d, cy + Math.sin(a) * d); } }
  rect(x, '#704020', cx - 1, cy - 1, 2, 2);
}
function crane(x, cx, cy) { const L = ['.kkkk.', 'kwwwwk', 'kwkwkw', 'kwwwwk', '.kwwk.']; L.forEach((l, j) => [...l].forEach((ch, i) => { if (ch !== '.') px(x, ch === 'k' ? NOIR : '#f8f0e0', cx + i, cy + j); })); }
function blocs(x, r, cx, cy, n) { for (let k = 0; k < n; k++) { const X = cx + Math.round((r() - 0.5) * 40), Y = cy + Math.round((r() - 0.5) * 30), w = 6 + Math.floor(r() * 5), h = 4 + Math.floor(r() * 4); rect(x, 'rgba(0,0,0,.25)', X + 1, Y + 2, w, h); rect(x, NOIR, X - 1, Y - 1, w + 2, h + 2); rect(x, '#d0a868', X, Y, w, h); rect(x, '#f0d098', X, Y, w, 1); } }

const SOLS = {
  // Jungle
  j1: (x, r, k) => { base(x, r, '#58b050', '#3c8a38', '#88d070'); sentier(x, 30); fleurs(x, r, 30); for (let i = 0; i < 4; i++) boule(x, 10 + r() * 100, 10 + r() * 190, 4, BUISSON); },
  j2: (x, r, k) => { base(x, r, '#3c8a40', '#2a6a30', '#68b050'); for (let i = 0; i < 30; i++) fougere(x, 6 + r() * 108, 6 + r() * 200); if (k % 2) tronc(x, 30, 90, 40); },
  j3: (x, r, k) => { base(x, r, '#48a048', '#307830', '#78c060'); riviere(x, 82, 9); if (k % 2) pont(x, 82, 100); fleurs(x, r, 10); },
  j4: (x, r, k) => { base(x, r, '#245a30', '#1a4424', '#3a7a40'); for (let i = 0; i < 6; i++) houppier(x, 10 + r() * 100, 10 + r() * 190, 9, ARBRE_SOMBRE); for (let i = 0; i < 60; i++) px(x, 'rgba(230,250,240,.35)', r() * LW, r() * LH); },
  j5: (x, r, k) => { base(x, r, '#3a7a40', '#2a5a30', '#5a9a50'); for (let i = 0; i < 5; i++) mare(x, 14 + r() * 92, 16 + r() * 180, 7 + Math.floor(r() * 6), 4 + Math.floor(r() * 3)); },
  jsecret: (x, r, k) => { base(x, r, '#58b050', '#3c8a38', '#88d070'); fleurs(x, r, 90); if (k % 2) nid(x, 60, 100); },
  jboss: (x, r, k) => { // le chemin du temple : des dalles de pierre moussues, posées en quinconce
    base(x, r, '#48a048', '#307830', '#78c060');
    rect(x, '#5a5448', 48, 0, 24, LH);
    for (let Y = 0, l = 0; Y < LH; Y += 7, l++) for (let X = 48 + (l % 2 ? -5 : 0); X < 72; X += 10) {
      const x0 = Math.max(49, X + 1), x1 = Math.min(71, X + 9);
      if (x1 - x0 < 2) continue;
      rect(x, '#a8a090', x0, Y + 1, x1 - x0, 5); rect(x, '#d0c8b8', x0, Y + 1, x1 - x0, 1);
      if (r() < 0.4) px(x, '#5a9a40', x0 + Math.floor(r() * (x1 - x0)), Y + 4);
    }
    if (k % 2) for (const X of [30, 90]) { boule(x, X, 70, 5, ROC); boule(x, X, 150, 5, ROC); }
  },
  // Désert
  d1: (x, r, k) => { sable(x, r); rides(x, r, 30); },
  d2: (x, r, k) => { sable(x, r); for (const X0 of [52, 66]) for (let Y = 0; Y < LH; Y++) if (Y % 3) px(x, '#a88848', X0 + Math.round(Math.sin(Y / 30) * 4), Y); for (let i = 0; i < 6; i++) boule(x, r() * LW, r() * LH, 2, ROC); },
  d3: (x, r, k) => { sable(x, r); falaises(x); if (k % 2) { crane(x, 60, 90); for (let i = 0; i < 5; i++) { rect(x, NOIR, 72 + i * 3, 100, 2, 7); rect(x, '#f8f0e0', 72 + i * 3, 101, 1, 5); } } },
  d4: (x, r, k) => { sable(x, r); rides(x, r, 40); for (let i = 0; i < 14; i++) { const Y = r() * LH; for (let X = 0; X < LW; X += 2) px(x, 'rgba(255,240,210,.35)', X, Y + X * 0.4); } },
  d5: (x, r, k) => { sable(x, r); if (k % 2 === 0) { ovale(x, 60, 100, 26, 18, '#78b050'); mare(x, 60, 100, 15, 9); for (const [a, b] of [[30, 84], [92, 90], [40, 120], [84, 118]]) palmier(x, r, a, b); } else rides(x, r, 20); },
  dsecret: (x, r, k) => { sable(x, r); blocs(x, r, 40, 70, 6); blocs(x, r, 84, 150, 5); },
  dboss: (x, r, k) => { sable(x, r); if (k >= 2) { ovale(x, 60, 106, 46, 36, '#b88a52'); ovale(x, 62, 110, 36, 28, '#9a6e3e'); for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; boule(x, 60 + Math.cos(a) * 42, 106 + Math.sin(a) * 33, 3, ROC); } } else { crane(x, 40, 80); blocs(x, r, 80, 140, 4); } },
};
function base(x, r, herbe, fonce, clair) {
  rect(x, herbe, 0, 0, LW, LH);
  for (let k = 0; k < 380; k++) { const X = Math.floor(r() * LW), Y = Math.floor(r() * LH); px(x, fonce, X, Y); px(x, fonce, X + 1, Y - 1); px(x, clair, X - 1, Y - 1); }
}
function sable(x, r) {
  rect(x, '#e0c880', 0, 0, LW, LH);
  for (let k = 0; k < 520; k++) px(x, r() < 0.6 ? '#c8b068' : '#a88848', Math.floor(r() * LW), Math.floor(r() * LH));
}
function rides(x, r, n) { for (let k = 0; k < n; k++) { const X = Math.floor(r() * 100) + 5, Y = 4 + Math.floor(r() * 204); rect(x, '#c8b068', X, Y, 6, 1); rect(x, '#c8b068', X + 2, Y - 1, 3, 1); } }
function sentier(x, cx0) { for (let Y = 0; Y < LH; Y++) { const c = cx0 + Math.round(Math.sin(Y / LH * Math.PI * 2) * 6); rect(x, '#c8a060', c - 4, Y, 8, 1); if (Y % 5 === 0) px(x, '#a07840', c - 2 + (Y % 3), Y); px(x, '#906830', c - 5, Y); px(x, '#906830', c + 4, Y); } }
function fleurs(x, r, n) { for (let k = 0; k < n; k++) { const X = Math.floor(r() * LW), Y = Math.floor(r() * LH); px(x, k % 2 ? '#f8d840' : '#e84040', X, Y); px(x, '#ffffff', X + 1, Y); } }
function fougere(x, cx, cy) { for (const [i, j] of [[0, -2], [-2, 0], [2, 0], [-1, 1], [1, 1], [0, 2], [-2, -2], [2, -2]]) px(x, (i + j) % 2 ? '#88d070' : '#58a048', cx + i, cy + j); }
function tronc(x, cx, cy, l) { rect(x, NOIR, cx - 1, cy - 1, l + 2, 7); rect(x, '#a06830', cx, cy, l, 5); rect(x, '#704018', cx, cy + 4, l, 1); ovale(x, cx + l, cy + 2, 2, 3, '#e0b070', NOIR); }
function pont(x, cx, cy) { for (let k = 0; k < 4; k++) { const Y = cy + k * 4; rect(x, NOIR, cx - 16, Y, 33, 4); rect(x, '#b07038', cx - 15, Y + 1, 31, 2); } }
function nid(x, cx, cy) { ovale(x, cx, cy, 16, 12, '#8a6a3c', '#5a4630'); ovale(x, cx, cy, 10, 7, '#5a4630'); for (const [a, b] of [[-4, -1], [3, -2], [0, 3]]) ovale(x, cx + a, cy + b, 2, 3, '#f8d840', NOIR); }

const TUILES = new Map();
function tuile(id, k) {
  const cle = id + ':' + (k % 4);
  if (TUILES.has(cle)) return TUILES.get(cle);
  const c = document.createElement('canvas'); c.width = LW; c.height = LH;
  const x = c.getContext('2d');
  (SOLS[id] ?? (id[0] === 'd' ? SOLS.d1 : SOLS.j1))(x, hasard(hachage(cle)), k % 4);
  TUILES.set(cle, c);
  return c;
}
function sol(x, p) {
  if (p.mission.planete !== 'jungle' && p.mission.planete !== 'desert') { const pal = PALETTES.jungle; rect(x, pal.herbe, 0, 0, LW, LH); return; }
  const d = Math.floor(p.t * DEFIL / K), k0 = Math.floor(d / LH), haut = d - k0 * LH;
  x.drawImage(tuile(p.mission.id, k0), 0, haut);
  x.drawImage(tuile(p.mission.id, k0 + 1), 0, haut - LH);
}

// ---------- le terrain ----------
const ARBRES = new Map();
function arbre16(R, sombre) {
  const cle = R + (sombre ? 's' : '');
  if (ARBRES.has(cle)) return ARBRES.get(cle);
  const t = R * 2 + 8, c = document.createElement('canvas'); c.width = c.height = t;
  houppier(c.getContext('2d'), t / 2, t / 2, R, sombre ? ARBRE_SOMBRE : ARBRE);
  ARBRES.set(cle, c);
  return c;
}
function terrain(x, p) {
  for (const t of p.terrain) {
    const X = Math.round(t.x / K), Y = Math.round(t.y / K);
    if (t.k === 'sable') {
      const cx = X, cy = Math.round((t.y + t.h / 2) / K), rx = Math.round(t.w / 2 / K), ry = Math.round(t.h / 2 / K);
      for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) { const d = (i / rx) ** 2 + (j / ry) ** 2; if (d > 1) continue; px(x, d > 0.82 ? ((i + j) % 2 ? '#a88848' : '#f8e8b8') : (j % 4 === 0 && i % 3 !== 0 ? '#d8bc80' : '#f8e8b8'), cx + i, cy + j); }
    } else if (t.k === 'tremplin') sprite(x, 'tremplin', t.x, t.y);
  }
}
function rochers(x, p) {
  for (const t of p.terrain) if (t.k === 'rocher') boule(x, t.x / K, t.y / K, Math.max(3, Math.round(t.r / K)), ROC);
}
function feuillage(x, p) {
  for (const t of p.terrain) {
    if (t.k !== 'feuille') continue;
    const tremble = p.ennemis.some((e) => e.cache && e.feuille === t && e.age > 30) ? (Math.floor(p.t / 4) % 2 ? 1 : -1) : 0;
    const c = arbre16(Math.max(5, Math.round(t.r / K)), p.mission.id === 'j4' || p.mission.id === 'j5');
    x.drawImage(c, Math.round(t.x / K - c.width / 2) + tremble, Math.round(t.y / K - c.height / 2));
  }
}

// ---------- les ennemis ----------
const SPRITE_DE = { luciole: 'luciole', graine: 'graine', scarabee: 'scarabee', perroquet: 'perroquet', plante: 'plante', champignon: 'champignon', gloutonnet: 'gloutonnet', porteur: 'porteur', chasseur: 'chasseur', vautour: 'vautour', herbe: 'herbe', scarabeeSable: 'hoplie', scorpion: 'scorpion', cactus: 'cactus', taupe: 'taupe' };
function monticule(x, e) {
  const k = Math.min(1, e.age / (e.def.attente ?? 80)), r = Math.round(2 + k * (e.type === 'taupe' ? 5 : 3));
  const X = Math.round(e.x / K) + (k > 0.7 ? (Math.floor(e.age / 3) % 2 ? 1 : -1) : 0), Y = Math.round(e.y / K);
  ovale(x, X, Y, r + 1, Math.max(1, Math.round(r * 0.7)), '#b8894f', '#6b4a2b');
  px(x, '#f0d098', X - 1, Y - 1);
  for (let i = 0; i < Math.floor(k * 4); i++) px(x, '#6b4a2b', X + [-1, 1, 0, 2][i], Y + [0, 0, 1, -1][i]);
}
function ennemi(x, e, p) {
  if (e.cache && e.def.monticule) { monticule(x, e); return; }
  if (e.cache) return; // la plante cachée : le feuillage la recouvre
  const blanc = e.flash > 0, X = e.x, Y = e.y;
  if (e.def.taille === 'cage') {
    const dore = p.mission.cages[e.cid]?.dore, cx = Math.round(X / K), cy = Math.round(Y / K);
    boule(x, cx, cy, 5, dore ? { trait: NOIR, mid: '#ffe680', ombre: '#d8b030', clair: '#fffbe0' } : { trait: NOIR, mid: '#c8e8ff', ombre: '#90b8e0', clair: '#ffffff' });
    rect(x, '#2850c0', cx - 1, cy - 1, 3, 2); rect(x, '#ffffff', cx - 1, cy - 2, 3, 1);
    for (const i of [-4, -2, 0, 2, 4]) rect(x, dore ? '#a07010' : '#7a5a2a', cx + i, cy - 5 + Math.abs(i) / 2, 1, 10 - Math.abs(i));
    return;
  }
  const nom = SPRITE_DE[e.type];
  if (nom) {
    const anime = (e.type === 'luciole' || e.type === 'graine') && Math.floor(e.age / 6) % 2 ? nom + '2' : nom;
    if (e.etourdi > 0) for (let k = 0; k < 2; k++) px(x, '#ffe14d', Math.round(X / K) + Math.round(Math.cos(e.age * 0.2 + k * 3) * 5), Math.round(Y / K) - 6);
    sprite(x, S[anime] ? anime : nom, X, Y, blanc);
    if (e.pvMax > 2 && e.pv < e.pvMax) { const w = 8, cx = Math.round(X / K) - 4, cy = Math.round(Y / K) + 7; rect(x, NOIR, cx - 1, cy - 1, w + 2, 3); rect(x, '#70ff70', cx, cy, Math.round(w * e.pv / e.pvMax), 1); }
    return;
  }
  // les gros et les rochers qui roulent : dessinés en pixels, sans sprite fixe
  const cx = Math.round(X / K), cy = Math.round(Y / K);
  if (e.type === 'boulet') { boule(x, cx, cy, 6, blanc ? { trait: NOIR, mid: '#fff', ombre: '#ddd', clair: '#fff' } : { trait: NOIR, mid: '#9a7a5a', ombre: '#6a5038', clair: '#d0b090' }); const a = e.rot; px(x, NOIR, cx + Math.round(Math.cos(a) * 3), cy + Math.round(Math.sin(a) * 3)); px(x, NOIR, cx + Math.round(Math.cos(a + 2) * 3), cy + Math.round(Math.sin(a + 2) * 3)); }
  else if (e.type === 'ver') { for (let i = 4; i >= 0; i--) boule(x, cx + Math.round(Math.sin(e.age * 0.08 + i) * 2), cy - 8 + i * 4, 5 - Math.floor(i / 2), blanc ? { trait: NOIR, mid: '#fff', ombre: '#ddd', clair: '#fff' } : { trait: NOIR, mid: '#d9a35a', ombre: '#a07038', clair: '#f8d090' }); px(x, '#ff3040', cx - 2, cy + 8); px(x, '#ff3040', cx + 2, cy + 8); }
  else if (e.type === 'arbreRuche') { houppier(x, cx, cy, 10, ARBRE); boule(x, cx, cy, 5, blanc ? { trait: NOIR, mid: '#fff', ombre: '#ddd', clair: '#fff' } : { trait: NOIR, mid: '#ffae00', ombre: '#c87800', clair: '#ffe080' }); for (const [a, b] of [[-2, -1], [1, 1], [-1, 2]]) px(x, NOIR, cx + a, cy + b); }
  else boule(x, cx, cy, Math.max(3, Math.round(e.r / K)), { trait: NOIR, mid: e.def.couleur, ombre: e.def.couleur, clair: '#ffffff' });
  if (e.pvMax > 2 && e.pv < e.pvMax) { const w = 14, bx0 = cx - 7, by0 = cy + 12; rect(x, NOIR, bx0 - 1, by0 - 1, w + 2, 3); rect(x, '#70ff70', bx0, by0, Math.round(w * e.pv / e.pvMax), 1); }
}

// ---------- le joueur, ses tirs, les objets, les effets ----------
function joueur(x, p) {
  const j = p.j;
  if (j.inv > 0 && Math.floor(j.inv / 5) % 2) return;
  const cx = Math.round(j.x / K), cy = Math.round(j.y / K);
  if (p.robot) {
    rect(x, NOIR, cx - 7, cy - 7, 15, 13); rect(x, '#e33333', cx - 6, cy - 6, 13, 11); rect(x, '#ff8080', cx - 6, cy - 6, 13, 2);
    rect(x, '#3366ff', cx - 6, cy + 4, 4, 3); rect(x, '#3366ff', cx + 3, cy + 4, 4, 3);
    for (const i of [-4, 0, 4]) px(x, '#ffdd22', cx + i, cy - 8);
    return;
  }
  const z = j.z || 0;
  ovale(x, cx + 3 + Math.round(z * 5), cy + 4 + Math.round(z * 7), 4, 2, 'rgba(0,0,0,.3)');
  if (p.module === 'avion') ovale(x, cx + 4, cy + 6, 4, 2, 'rgba(0,0,0,.28)');
  sprite(x, p.module === 'rover' ? 'rover' : 'avion', j.x, j.y - z * 18);
  if (p.bouclier) for (let a = 0; a < 24; a++) px(x, '#88ffff', cx + Math.round(Math.cos(a / 24 * Math.PI * 2) * 9), cy + Math.round(Math.sin(a / 24 * Math.PI * 2) * 9));
  if (p.etoile > 0) for (let k = 0; k < 4; k++) px(x, `hsl(${(p.t * 12 + k * 90) % 360},90%,65%)`, cx + Math.round(Math.cos(p.t * 0.2 + k * 1.6) * 8), cy + Math.round(Math.sin(p.t * 0.2 + k * 1.6) * 8));
  if (p.compagnons > 0) for (let k = 0; k < 2; k++) { const a = p.t * 0.08 + k * Math.PI; rect(x, NOIR, cx + Math.round(Math.cos(a) * 10) - 2, cy + Math.round(Math.sin(a) * 10) - 2, 5, 5); rect(x, '#ffb3f0', cx + Math.round(Math.cos(a) * 10) - 1, cy + Math.round(Math.sin(a) * 10) - 1, 3, 3); }
  const plafond = p.M.zone[0];
  if (j.y < plafond + 8) for (let X = cx - 20; X <= cx + 20; X += 3) px(x, '#fff6d6', X, Math.round((plafond - 26) / K));
}
function tirsJoueur(x, p) {
  for (const b of p.tirsJ) {
    const X = Math.round(b.x / K), Y = Math.round(b.y / K);
    if (b.forme === 'trait') { rect(x, NOIR, X - 1, Y - 4, 3, 8); rect(x, '#ffe14d', X, Y - 3, 1, 6); }
    else if (b.forme === 'goutte') { rect(x, '#2a7aa0', X - 1, Y - 1, 2, 2); px(x, '#a8eaff', X - 1, Y - 1); }
    else if (b.forme === 'torpille') { rect(x, NOIR, X - 1, Y - 2, 3, 5); rect(x, '#e8f6ff', X, Y - 1, 1, 3); }
    else if (b.forme === 'fleche') { px(x, '#c6ff6f', X, Y - 1); rect(x, '#c6ff6f', X - 1, Y, 3, 1); px(x, NOIR, X, Y + 1); }
    else if (b.forme === 'bulle') { const r = Math.max(2, Math.round(b.r / K)); for (let a = 0; a < 16; a++) px(x, '#9fe8ff', X + Math.round(Math.cos(a / 16 * Math.PI * 2) * r), Y + Math.round(Math.sin(a / 16 * Math.PI * 2) * r)); }
    else if (b.forme === 'rond') { rect(x, NOIR, X - 1, Y - 1, 3, 3); px(x, '#ff9de2', X, Y); }
    else { rect(x, NOIR, X - 1, Y - 2, 3, 5); rect(x, '#fff8a0', X, Y - 1, 1, 3); }
  }
}
function objets(x, p) {
  for (const o of p.objets) {
    if (o.k === 'cristal') sprite(x, 'cristal', o.x, o.y);
    else if (o.k === 'cristalHaut') { ovale(x, Math.round(o.x / K), Math.round(o.y / K), 2, 1, 'rgba(0,0,0,.25)'); sprite(x, 'cristal', o.x, o.y - 30 - o.h * 30); }
    else if (o.k === 'caisse') sprite(x, 'caisse', o.x, o.y);
    else sprite(x, o.arme ? 'cadeauArme' : 'cadeauBonus', o.x, o.y);
  }
}
function effets(x, p) {
  for (const f of p.effets) {
    if (f.onde !== undefined) { const r = Math.round(f.onde / K); for (let a = 0; a < 48; a++) px(x, '#a0ff8c', Math.round(p.j.x / K + Math.cos(a / 48 * Math.PI * 2) * r), Math.round(p.j.y / K + Math.sin(a / 48 * Math.PI * 2) * r)); }
    else if (f.astronaute) { const X = Math.round(f.x / K), Y = Math.round(f.y / K); rect(x, NOIR, X - 2, Y - 2, 5, 5); rect(x, f.dore ? '#ffd700' : '#5fd68a', X - 1, Y - 1, 3, 3); }
    else if (f.zone || f.atterrit) { const r = Math.round((f.zone ? f.r * (1.2 - f.vie / 40) : 90 * (1 - f.vie / 24) + 10) / K); for (let a = 0; a < 28; a++) px(x, f.zone ? '#9fe8ff' : '#f0d296', Math.round(f.x / K + Math.cos(a / 28 * Math.PI * 2) * r), Math.round(f.y / K + Math.sin(a / 28 * Math.PI * 2) * r * (f.atterrit ? 0.6 : 1))); }
    else if (f.poussiere) px(x, '#f0e0b8', f.x / K, f.y / K);
    else if (f.vie > 4) px(x, f.couleur ?? '#ffffff', f.x / K, f.y / K);
  }
}

/**
 * Dessine toute la mission en 16 bits, dans le même repère 360 × 640 que rendu.js.
 * @param {CanvasRenderingContext2D} ctx @param {any} p
 */
export function dessinerPartie16(ctx, p) {
  const x = toile();
  x.clearRect(0, 0, LW, LH);
  sol(x, p);
  terrain(x, p);
  for (const f of p.effets) if (f.poussiere) px(x, '#f0e0b8', f.x / K, f.y / K);
  for (const e of p.ennemis) if (e.cache) ennemi(x, e, p);
  feuillage(x, p);
  rochers(x, p);
  objets(x, p);
  for (const e of p.ennemis) if (!e.cache) ennemi(x, e, p);
  if (p.boss) { x.save(); x.scale(1 / K, 1 / K); dessinerBoss(x, p, false); x.restore(); } // le boss, réduit au tiers : il se pixelise
  if (p.copain) sprite(x, 'copain', p.copain.x, p.copain.y);
  tirsJoueur(x, p);
  joueur(x, p);
  for (const b of p.tirsE) sprite(x, b.bleu ? 'tirBleu' : 'tirRouge', b.x, b.y);
  effets(x, p);
  ctx.save();
  if (p.secousse > 0) ctx.translate(Math.sin(p.t * 7) * 2 * (p.secousse / 6), Math.cos(p.t * 9) * 2 * (p.secousse / 6));
  if (p.M.bas) { ctx.translate(0, H); ctx.scale(1, -1); }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bas, 0, 0, LW, LH, 0, 0, W, LH * K);
  ctx.restore();
}
