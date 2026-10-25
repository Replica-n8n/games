import { ecrire } from './police.js';

// Ghost Train : les dessins, direction « Série B » (choisie le 2026-10-24) :
// pixel art de bande dessinée, contours noirs épais, couleurs franches, trois
// tons par matière (lumière en haut à gauche). Chaque forme est décrite au pixel
// par une fonction (i, j) -> partie, puis peinte UNE fois et gardée en cache.

const NOIR = '#120818';
const d2 = (i, j, cx, cy, rx, ry) => ((i - cx) / rx) ** 2 + ((j - cy) / ry) ** 2;
const seg = (i, j, ax, ay, bx, by) => {
  const vx = bx - ax, vy = by - ay, k = Math.max(0, Math.min(1, ((i - ax) * vx + (j - ay) * vy) / (vx * vx + vy * vy)));
  return Math.hypot(i - ax - vx * k, j - ay - vy * k);
};

/** Trois tons par partie : lumière, base, ombre. */
const PAL = {
  corps: ['#c8ff5a', '#6ee03a', '#2c9a2a'], ventre: ['#f0ffa0', '#c8f070', '#8ac040'], oeil: ['#ffffff', '#ffffff', '#d8d8e8'],
  pupille: [NOIR, NOIR, NOIR], paupiere: ['#6ee03a', '#3cb02e', '#2c8a2a'], bouche: ['#3a0a18', '#3a0a18', '#3a0a18'],
  dent: ['#ffffff', '#fff8d8', '#d8d0b0'], langue: ['#ff9ab0', '#ff5a7a', '#c02a50'],
  peau: ['#e8f4ff', '#a8c8e8', '#6a88b0'], orbite: ['#1a1030', '#1a1030', '#1a1030'], lueur: ['#ff3030', '#ff3030', '#ff3030'],
  moustache: ['#ffffff', '#e0e0f0', '#a0a0c0'], habit: ['#5a4a9a', '#3a2a70', '#22184a'], habit2: ['#4a3a8a', '#2e2260', '#1c1440'],
  chemise: ['#ffffff', '#f0f0ff', '#c0c0e0'], noeud: ['#ff4a4a', '#d01a2a', '#901020'], metal: ['#fff0a0', '#f0c040', '#b08020'],
  gant: ['#ffffff', '#f0f0ff', '#c0c0e0'], drap: ['#ffffff', '#e8ecff', '#aab0e0'], main: ['#d8dcff', '#c0c6f0', '#9098d0'],
  chapeau: ['#5a5a6a', '#2a2a36', '#16161e'], ruban: ['#ff4a4a', '#d01a2a', '#901020'], larme: ['#bff0ff', '#7fd0ff', '#3a8ad0'],
  assiette: ['#ffffff', '#e8eaf8', '#9aa0c8'], filet: ['#f0c040', '#f0c040', '#b08020'],
  papier: ['#fff4d0', '#f0e0b0', '#c0a878'], encre: ['#3a2010', '#3a2010', '#3a2010'], rouge: ['#ff6a4a', '#e8203a', '#a01020'],
  bleu: ['#8ad0ff', '#3a8ad0', '#1a4a90'], bois: ['#c8743a', '#8a4a1e', '#5a2a0e'], piece: ['#fff6a0', '#f0c040', '#b08020'],
  fonte: ['#5a5a6a', '#3a3a46', '#22222a'], fer: ['#c8c8d8', '#8a8aa0', '#5a5478'], poids: ['#ff6a4a', '#e8203a', '#a01020'],
  plaque: ['#ffffff', '#f0f0ff', '#c0c0e0'],
};
const SOMBRES = new Set(['pupille', 'bouche', 'orbite', 'encre']);

/** @param {number} w @param {number} h @param {(i: number, j: number) => string|null} f */
export function peindre(w, h, f) {
  const m = [];
  for (let j = 0; j < h; j++) { m[j] = []; for (let i = 0; i < w; i++) m[j][i] = f(i, j); }
  const at = (i, j) => (j < 0 || j >= h || i < 0 || i >= w) ? null : m[j][i];
  const c = document.createElement('canvas'); c.width = w + 2; c.height = h + 2;
  const x = c.getContext('2d');
  x.fillStyle = NOIR;
  for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) {
    if (at(i, j)) continue;
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) if (at(i + a, j + b)) { x.fillRect(i + 1, j + 1, 1, 1); break; }
  }
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const p = m[j][i]; if (!p) continue;
    const r = PAL[p] || ['#f0f', '#f0f', '#f0f'];
    let col = r[1];
    if (!SOMBRES.has(p)) {
      const dehors = (a, b) => at(i + a, j + b) !== p;
      if (dehors(0, -1) || dehors(-1, -1)) col = r[0];
      else if (dehors(1, 1) || dehors(0, 1) || dehors(1, 0) || dehors(2, 2)) col = r[2];
    }
    x.fillStyle = col; x.fillRect(i + 1, j + 1, 1, 1);
  }
  return c;
}

/** @param {HTMLCanvasElement} src @param {string} col */
function silhouette(src, col) {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
  return c;
}

/** La Goule. image 0/1 : la queue ondule. tenue : la bouche s'ouvre en grand. */
function goule(image, tenue) {
  const ond = image ? 1 : -1;
  return (i, j) => {
    let corps = d2(i, j, 16, 11, 10.5, 9.5) <= 1;
    if (!corps && j >= 11 && j <= 30) {
      const cx = 16 + (j > 20 ? (j - 20) * 0.55 * ond + (image ? 0 : (j - 20) * 0.2) : 0);
      const hw = j <= 27 ? 9.5 - (j - 11) * 0.42 + Math.sin(j * 0.9) * 0.6 : 2.6 - (j - 27) * 0.8;
      if (Math.abs(i - cx) <= hw) corps = true;
    }
    const bras = tenue ? -2 : 0;
    if (!corps && (d2(i, j, 5, 17 + bras, 2.6, 2) <= 1 || d2(i, j, 27, 16 + bras, 2.6, 2) <= 1)) corps = true;
    if (!corps) return null;
    if (d2(i, j, tenue ? 10.5 : 11, 8, 1.5, 1.5) <= 1 || d2(i, j, 21.5, 9.2, 1, 1) <= 1) return 'pupille';
    if (d2(i, j, 10.5, 7.5, 3.4, 3.4) <= 1) return 'oeil';
    if (d2(i, j, 21.5, 8.5, 2.3, 2.3) <= 1) return j <= 8 ? 'paupiere' : 'oeil';
    const ry = tenue ? 4.6 : 3.6;
    if (d2(i, j, 16, 15.5, 7.5, ry) <= 1 && j >= 13) {
      if ((j <= 14 && i % 2 === 0 && i > 10 && i < 23) || (i === 19 && j >= 17 && j <= 18)) return 'dent';
      if (d2(i, j, 18, 17.5 + (tenue ? 1 : 0), 3, 1.6) <= 1) return 'langue';
      return 'bouche';
    }
    if (d2(i, j, 16, 22, 6, 5) <= 1) return 'ventre';
    return 'corps';
  };
}

/** Le Majordome. leurre : sans monocle (c'est ainsi qu'on reconnaît le vrai). */
function majordome(leurre) {
  return (i, j) => {
    const r = Math.hypot(i - 18.5, j - 8);
    if (!leurre && r >= 2.2 && r <= 3.1) return 'metal';
    if (!leurre && i === 21 && j >= 11 && j <= 16 && j % 2 === 1) return 'metal';
    if (d2(i, j, 27, 22.5, 5, 1.3) <= 1) return 'metal';
    if (i >= 25 && i <= 28 && j >= 19 && j <= 21) return 'chemise';
    if (d2(i, j, 27.5, 24, 1.5, 1.5) <= 1 || d2(i, j, 9, 31, 1.5, 1.5) <= 1) return 'gant';
    if (seg(i, j, 21, 19, 27, 24) <= 1.6 || seg(i, j, 11, 19, 9, 30) <= 1.6) return 'habit';
    if (d2(i, j, 16, 9, 6, 7.5) <= 1) {
      if ((Math.abs(i - 13.5) < 0.6 || Math.abs(i - 18.5) < 0.6) && Math.abs(j - 8) < 0.6) return 'lueur';
      if (d2(i, j, 13.5, 8, 1.8, 1.6) <= 1 || d2(i, j, 18.5, 8, 1.8, 1.6) <= 1) return 'orbite';
      if (((j === 11 || j === 12) && Math.abs(i - 16) <= 4) || (j === 10 && (i === 11 || i === 21))) return 'moustache';
      if (j === 14 && Math.abs(i - 16) <= 2) return 'orbite';
      return 'peau';
    }
    if ((j === 16 || j === 17) && Math.abs(i - 16) <= 2) return 'noeud';
    if (j >= 16 && j <= 36) {
      const hw = 5 + (j - 16) * 0.25;
      if (Math.abs(i - 16) <= hw) {
        if (j <= 26 && Math.abs(i - 16) <= Math.max(0, (26 - j) * 0.35)) return 'chemise';
        if (i === 16 && (j === 29 || j === 32)) return 'metal';
        return 'habit';
      }
    }
    if (j > 36 && j <= 43) { const hw = 7 - (j - 36) * 0.95, cx = 16 + Math.sin(j * 0.7) * 1.2; if (Math.abs(i - cx) <= hw) return 'habit2'; }
    return null;
  };
}

/** Lumi, le fantôme timide au chapeau. triste : les yeux fermés et une larme. */
function lumi(image, triste) {
  return (i, j) => {
    if (j >= 1 && j <= 4 && i >= 11 + (4 - j) * 0.3 && i <= 16 + (4 - j) * 0.3) return j === 4 ? 'ruban' : 'chapeau';
    if (j === 5 && i >= 9 && i <= 18) return 'chapeau';
    let drap = false;
    if (j <= 15 && d2(i, j, 11, 15, 8, 9) <= 1) drap = true;
    if (j > 15 && j <= 24 + Math.sin(i * 1.3 + image * 1.5) * 1.5 && Math.abs(i - 11) <= 8 + (j - 15) * 0.18) drap = true;
    if (!drap) return null;
    if (triste) {
      if (j === 14 && (Math.abs(i - 8) <= 1 || Math.abs(i - 14) <= 1)) return 'pupille';
      if ((i === 15 && (j === 15 || j === 16)) || (i === 7 && j === 16)) return 'larme';
    } else if (d2(i, j, 8, 14, 1.6, 1.9) <= 1 || d2(i, j, 14, 14, 1.6, 1.9) <= 1) return (i === 7 || i === 13) && j === 13 ? 'oeil' : 'pupille';
    if (d2(i, j, 9, 18, 2.2, 1.6) <= 1 || d2(i, j, 13, 18, 2.2, 1.6) <= 1) return 'main';
    return 'drap';
  };
}

const assiette = (i, j) => {
  const r = d2(i, j, 6, 6, 6, 6);
  if (r > 1) return null;
  if (r > 0.7) return 'filet';
  return d2(i, j, 6, 6, 3, 3) <= 1 ? 'assiette' : 'assiette';
};

/** Un panneau d'aiguillage, flèche vers la gauche ou la droite. */
function panneau(cote) {
  return (i, j) => {
    if (i >= 8 && i <= 10 && j >= 12) return 'bois';
    if (i < 1 || i > 17 || j < 1 || j > 12) return null;
    const x = cote === 'g' ? 18 - i : i;
    if (j >= 5 && j <= 8 && x >= 4 && x <= 11) return 'papier';
    if (x >= 11 && x <= 15 && Math.abs(j - 6.5) <= (15 - x) * 0.9) return 'papier';
    return 'rouge';
  };
}

/** Les secrets du décor : une affiche de foire, un portrait, un plan. */
/**
 * Le levier d'aiguillage, comme au bord des vraies voies : un socle de fonte
 * boulonné, un bras de fer qui bascule autour de son axe, un contrepoids rouge au
 * bout, et un disque blanc à flèche qui dit de quel côté la voie est donnée.
 * cote : 'g' (bras penché à gauche, voie de gauche) ou 'd'. 26 x 36 pixels.
 */
function levier(cote) {
  const s = cote === 'g' ? -1 : 1, px = 13, py = 27, tx = px + s * 9, ty = 6;
  return (i, j) => {
    // le disque indicateur sur son poteau, à l'opposé du bras
    const dx = px - s * 9, dy = 10;
    if (d2(i, j, dx, dy, 4.2, 4.2) <= 1) {
      const a = (i - dx) * s; // flèche vers le côté donné
      if (j === dy && a >= -2 && a <= 2) return 'encre';
      if (Math.abs(j - dy) === 1 && a === 1) return 'encre';
      return 'plaque';
    }
    if (i === dx && j > dy + 3 && j < 28) return 'fer';
    if (d2(i, j, tx, ty, 3.4, 3.4) <= 1) return 'poids';
    if (seg(i, j, px, py, tx, ty) <= 1.3) return 'fer';
    if (d2(i, j, px, py, 2.6, 2.6) <= 1) return 'metal';
    if (j >= 28 && j <= 35 && i >= 4 && i <= 22) return ((i === 6 || i === 20) && j === 30) ? 'metal' : 'fonte';
    return null;
  };
}

const SECRETS = {
  affiche: (i, j) => {
    if (i < 0 || i > 13 || j < 0 || j > 18) return null;
    if (j <= 4) return 'rouge';
    if (j >= 7 && j <= 12 && d2(i, j, 6.5, 9.5, 4, 3) <= 1) return d2(i, j, 6.5, 9.5, 2, 1.5) <= 1 ? 'encre' : 'corps';
    if (j === 15 || j === 17) return i > 1 && i < 12 ? 'encre' : 'papier';
    return 'papier';
  },
  portrait: (i, j) => {
    if (i < 0 || i > 13 || j < 0 || j > 16) return null;
    if (i <= 1 || i >= 12 || j <= 1 || j >= 15) return 'metal';
    if (d2(i, j, 6.5, 6.5, 3, 3.5) <= 1) return (j === 6 && (i === 5 || i === 8)) ? 'encre' : 'peau';
    if (j >= 3 && j <= 4 && i >= 4 && i <= 9) return 'chapeau';
    if (j >= 10) return 'habit';
    return 'bleu';
  },
  plan: (i, j) => {
    if (i < 0 || i > 17 || j < 0 || j > 12) return null;
    if ((i === 4 || i === 11) && j > 1 && j < 11) return 'encre';
    if ((j === 4 || j === 9) && i > 1 && i < 16) return 'encre';
    if (Math.hypot(i - 14, j - 2) < 1.5) return 'rouge';
    return 'bleu';
  },
};

const piece = (i, j) => (d2(i, j, 3, 3, 3.2, 3.2) <= 1 ? (i === 2 && j <= 3 && j >= 2 ? 'chemise' : 'piece') : null);
const COEUR = ['..##.##..', '.#######.', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....'];

/** @type {Record<string, HTMLCanvasElement>} */
export const S = {};
/** Les silhouettes claires (fantôme tenu par le rayon, qui clignote). */
export const BLANC = {};
let pret = false;
export function preparer() {
  if (pret) return;
  pret = true;
  S.goule0 = peindre(32, 32, goule(0, false)); S.goule1 = peindre(32, 32, goule(1, false));
  S.gouleTenue = peindre(32, 32, goule(0, true));
  S.majordome = peindre(36, 44, majordome(false)); S.leurre = peindre(36, 44, majordome(true));
  S.lumi0 = peindre(22, 28, lumi(0, false)); S.lumi1 = peindre(22, 28, lumi(1, false)); S.lumiTriste = peindre(22, 28, lumi(0, true));
  S.assiette = peindre(13, 13, assiette);
  S.panneauG = peindre(19, 18, panneau('g')); S.panneauD = peindre(19, 18, panneau('d'));
  for (const k in SECRETS) S['secret_' + k] = peindre(18, 19, SECRETS[k]);
  S.piece = peindre(7, 7, piece);
  S.levierG = peindre(26, 36, levier('g')); S.levierD = peindre(26, 36, levier('d'));
  for (const k in S) BLANC[k] = silhouette(S[k], '#fff6c8');
}

/** Le sprite d'une entité à cet instant. @param {any} e */
export function spriteDe(e) {
  switch (e.type) {
    case 'goule': case 'gouleVol': return e.tenu ? 'gouleTenue' : (((e.t * 5) | 0) & 1 ? 'goule1' : 'goule0');
    case 'majordome': return 'majordome';
    case 'leurre': return 'leurre';
    case 'lumi': return e.etat === 'vit' ? (((e.t * 4) | 0) & 1 ? 'lumi1' : 'lumi0') : 'lumiTriste';
    case 'assiette': return 'assiette';
    case 'levier': return e.cote === 'g' ? 'panneauG' : 'panneauD';
    case 'secret': return 'secret_' + e.forme;
  }
  return 'assiette';
}

/** Un cœur de 9 x 8. @param {CanvasRenderingContext2D} ctx */
export function coeur(ctx, x, y, plein) {
  COEUR.forEach((r, j) => {
    for (let i = 0; i < 9; i++) {
      if (r[i] !== '#') continue;
      const bord = !(COEUR[j - 1] && COEUR[j - 1][i] === '#' && COEUR[j + 1] && COEUR[j + 1][i] === '#' && r[i - 1] === '#' && r[i + 1] === '#');
      ctx.fillStyle = bord ? NOIR : (plein ? (j < 3 && i < 4 ? '#ff8aa0' : '#e8203a') : '#4a3050');
      ctx.fillRect(x + i, y + j, 1, 1);
    }
  });
}

const rect = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

/** Un polygone : contour noir de 2 pixels d'abord, puis le remplissage. */
function poly(ctx, pts, col, contour = true) {
  const trace = () => { ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); };
  if (contour) { trace(); ctx.lineWidth = 2; ctx.strokeStyle = NOIR; ctx.stroke(); }
  trace(); ctx.fillStyle = col; ctx.fill();
}
function disque(ctx, a, b, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(a, b, r, 0, Math.PI * 2); ctx.fill(); }

/** Des rayures de danger jaunes et noires dans le quadrilatère pts. */
function danger(ctx, pts, pas = 10) {
  ctx.save();
  ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); ctx.clip();
  const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  const x0 = Math.min(...xs) - 20, x1 = Math.max(...xs) + 20, y0 = Math.min(...ys), y1 = Math.max(...ys);
  rect(ctx, '#ffd23a', x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = NOIR;
  for (let k = x0; k < x1; k += pas) { ctx.beginPath(); ctx.moveTo(k, y1); ctx.lineTo(k + pas / 2, y1); ctx.lineTo(k + pas / 2 + (y1 - y0), y0); ctx.lineTo(k + (y1 - y0), y0); ctx.fill(); }
  ctx.restore();
}

/**
 * L'avant du wagon, direction « matériel de l'agence » (choisie par Julie le
 * 2026-10-24 sur docs/ghost-train-materiel.png) : tableau de bord noir, bande de
 * danger, barre de sécurité jaune. @param {CanvasRenderingContext2D} ctx
 */
export function wagon(ctx) {
  rect(ctx, NOIR, 0, 152, 320, 28); rect(ctx, '#22222a', 0, 154, 320, 26); rect(ctx, '#3a3a46', 0, 154, 320, 2);
  danger(ctx, [[0, 166], [320, 166], [320, 174], [0, 174]], 12);
  rect(ctx, NOIR, 0, 165, 320, 1); rect(ctx, NOIR, 0, 174, 320, 1);
  rect(ctx, '#e8203a', 108, 157, 16, 4); rect(ctx, '#ff8a8a', 108, 157, 16, 1);
  rect(ctx, NOIR, 20, 142, 196, 7); rect(ctx, '#ffd23a', 21, 143, 194, 5); rect(ctx, '#fff27a', 21, 143, 194, 1); rect(ctx, '#b08a20', 21, 147, 194, 1);
  for (const a of [20, 209]) { rect(ctx, NOIR, a, 142, 7, 14); rect(ctx, '#ffd23a', a + 1, 143, 5, 12); rect(ctx, '#fff27a', a + 1, 143, 1, 12); }
}

/** Le gant noir qui serre la poignée : dos de la main, quatre doigts repliés, pouce dessus, poignet côtelé. */
function gant(ctx, a, b) {
  const T = ['#5a5a6a', '#3a3a46', '#22222a'];
  // la poignée, sous la main
  rect(ctx, NOIR, a + 2, b - 4, 12, 36); rect(ctx, '#4a4a5a', a + 3, b - 3, 10, 34);
  // le poignet côtelé qui sort de l'écran
  poly(ctx, [[a + 16, b + 18], [a + 40, b + 14], [a + 44, b + 34], [a + 18, b + 34]], T[2]);
  for (let k = 0; k < 4; k++) rect(ctx, T[1], a + 22 + k * 5, b + 18, 2, 14);
  // le dos de la main
  poly(ctx, [[a + 8, b + 2], [a + 30, b - 2], [a + 34, b + 20], [a + 10, b + 24]], T[1]);
  rect(ctx, T[0], a + 14, b + 2, 14, 2);
  // quatre doigts qui entourent la poignée, bouts arrondis à gauche
  for (let k = 0; k < 4; k++) {
    const y = b + 3 + k * 5;
    poly(ctx, [[a, y + 1], [a + 2, y - 1], [a + 16, y - 1], [a + 16, y + 4], [a + 2, y + 4], [a, y + 3]], k % 2 ? T[1] : T[0]);
    rect(ctx, T[0], a + 3, y, 6, 1);
  }
  // le pouce posé sur le dessus
  poly(ctx, [[a + 6, b - 4], [a + 24, b - 6], [a + 26, b], [a + 8, b + 1]], T[0]);
  rect(ctx, '#7a7a8a', a + 10, b - 4, 8, 1);
}

/**
 * L'appareil de capture de l'agence, en bas à droite : boîtier noir anguleux,
 * bande de danger, barre de chauffe à 6 segments, canon à anneau rouge qui
 * rougeoie en surchauffe. Il recule d'un pixel quand on tire.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{chauffe: number, surchauffe: number, tire: boolean}} p @param {number} image
 */
export function appareil(ctx, p, image) {
  const r = p.tire ? (image & 1) : 0, chaud = p.surchauffe > 0, clign = (image >> 2) & 1;
  ctx.save(); ctx.translate(r, r);
  poly(ctx, [[226, 124], [306, 116], [318, 128], [320, 168], [236, 172], [224, 150]], '#2a2a36');
  poly(ctx, [[228, 126], [306, 118], [312, 124], [230, 132]], '#4a4a5a', false);
  danger(ctx, [[230, 148], [320, 140], [320, 150], [232, 158]]);
  // la barre de chauffe : 6 segments, du vert au rouge ; en surchauffe, tout clignote rouge
  // (sur l'avant du boîtier : le bouton TIRER, au doigt, couvre l'arrière)
  rect(ctx, NOIR, 232, 131, 36, 10);
  for (let k = 0; k < 6; k++) {
    const allume = chaud ? clign : p.chauffe > k / 6 + 0.01;
    rect(ctx, allume ? (chaud || k >= 5 ? '#ff3030' : k >= 3 ? '#ffd23a' : '#6ee03a') : '#3a3a4a', 234 + k * 5.5 | 0, 133, 4, 6);
  }
  rect(ctx, NOIR, 296, 156, 18, 9); rect(ctx, '#ffffff', 297, 157, 16, 7); ecrire(ctx, 'GT', 305, 157, { centre: true, coul: '#e8203a' });
  // le canon carré et son anneau
  poly(ctx, [[204, 118], [232, 124], [232, 142], [206, 134]], '#3a3a4a');
  rect(ctx, '#5a5a6a', 210, 122, 20, 2);
  disque(ctx, 206, 126, 7, NOIR);
  disque(ctx, 206, 126, 6, chaud ? (clign ? '#ff3030' : '#a01020') : '#e8203a');
  disque(ctx, 206, 126, 3, p.tire ? ((image & 2) ? '#ffffff' : '#ff8ad0') : '#ffd0d8');
  gant(ctx, 258, 150);
  ctx.restore();
}
