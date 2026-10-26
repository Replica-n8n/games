// Maquette « les salles » : les outils pour peindre une pièce vue de face.
// Une pièce = un mur du fond, deux murs de côté, un plafond et un sol, qui
// fuient vers le même point. On peint à plat, puis la LUMIÈRE passe sur tout
// (cheminée, lune, bougies), tramée en quelques paliers comme sur une console 16 bits.

export const NOIR = '#120818';
export const W = 320;
export const H = 180;
/** Le mur du fond. */
export const FOND = { x0: 72, x1: 248, y0: 30, y1: 118 };

/** @param {CanvasRenderingContext2D} c */
export function R(c, col, x, y, w, h) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
/** @param {CanvasRenderingContext2D} c @param {number[][]} pts */
export function P(c, pts, col, trait) {
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  for (let k = 1; k < pts.length; k++) c.lineTo(pts[k][0], pts[k][1]);
  c.closePath(); c.fillStyle = col; c.fill();
  if (trait) { c.strokeStyle = trait; c.lineWidth = 1; c.stroke(); }
}
/** Un trait d'un pixel, sans flou. */
export function L(c, col, x0, y0, x1, y1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  c.fillStyle = col;
  for (let k = 0; k <= n; k++) c.fillRect(Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), 1, 1);
}
/** Une boîte en relief : contour noir, lumière en haut à gauche, ombre en bas à droite. @param {string[]} t [lumière, base, ombre] */
export function boite(c, x, y, w, h, t, contour = true) {
  if (contour) R(c, NOIR, x - 1, y - 1, w + 2, h + 2);
  R(c, t[1], x, y, w, h);
  R(c, t[0], x, y, w, 1); R(c, t[0], x, y, 1, h);
  R(c, t[2], x, y + h - 1, w, 1); R(c, t[2], x + w - 1, y, 1, h);
}
/** Un disque plein, ou une ellipse. */
export function ovale(c, cx, cy, rx, ry, col) {
  c.fillStyle = col;
  for (let y = Math.ceil(-ry); y <= ry; y++) {
    const dx = rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2));
    c.fillRect(Math.round(cx - dx), Math.round(cy + y), Math.round(dx * 2), 1);
  }
}

// Les murs de côté : w = profondeur (0 bord de l'écran, 1 mur du fond), h = hauteur (0 plafond, 1 sol)
const fuite = (w) => (w * 2.6) / (1 + 1.6 * w);
/** Un point du mur de gauche (cote -1) ou de droite (cote 1). */
export function mur(cote, w, h) {
  const t = fuite(w), x = FOND.x0 * t;
  const yh = FOND.y0 * t, yb = H - (H - FOND.y1) * t;
  return [cote < 0 ? x : W - x, yh + h * (yb - yh)];
}
/** Le quadrilatère d'un morceau de mur de côté. */
export function quad(cote, w0, w1, h0, h1) { return [mur(cote, w0, h0), mur(cote, w1, h0), mur(cote, w1, h1), mur(cote, w0, h1)]; }
/** Un point du sol : u de -1 (gauche) à 1 (droite), w profondeur. */
export function sol(u, w) {
  const t = fuite(w);
  const xg = FOND.x0 * t, xd = W - FOND.x0 * t, y = H - (H - FOND.y1) * t;
  return [xg + (u + 1) / 2 * (xd - xg), y];
}
/** Un point du plafond. */
export function plafond(u, w) {
  const t = fuite(w);
  const xg = FOND.x0 * t, xd = W - FOND.x0 * t, y = FOND.y0 * t;
  return [xg + (u + 1) / 2 * (xd - xg), y];
}

/** Les cinq faces de la pièce, en aplats. */
export function piece(c, cols) {
  P(c, [[0, 0], [W, 0], [FOND.x1, FOND.y0], [FOND.x0, FOND.y0]], cols.plafond);
  P(c, [[0, H], [W, H], [FOND.x1, FOND.y1], [FOND.x0, FOND.y1]], cols.sol);
  P(c, [[0, 0], [FOND.x0, FOND.y0], [FOND.x0, FOND.y1], [0, H]], cols.murG);
  P(c, [[W, 0], [FOND.x1, FOND.y0], [FOND.x1, FOND.y1], [W, H]], cols.murD);
  R(c, cols.fond, FOND.x0, FOND.y0, FOND.x1 - FOND.x0, FOND.y1 - FOND.y0);
}
/** Les arêtes de la pièce, d'un trait sombre. */
export function aretes(c, col) {
  L(c, col, 0, 0, FOND.x0, FOND.y0); L(c, col, W, 0, FOND.x1, FOND.y0);
  L(c, col, 0, H, FOND.x0, FOND.y1); L(c, col, W, H, FOND.x1, FOND.y1);
  L(c, col, FOND.x0, FOND.y0, FOND.x0, FOND.y1); L(c, col, FOND.x1, FOND.y0, FOND.x1, FOND.y1);
  L(c, col, FOND.x0, FOND.y0, FOND.x1, FOND.y0); L(c, col, FOND.x0, FOND.y1, FOND.x1, FOND.y1);
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16);
/**
 * La lumière de la pièce, tramée : chaque pixel reçoit l'ambiance plus ses sources,
 * puis la force est ramenée à des paliers de 0,14 avec une trame de Bayer 4 x 4.
 * @param {HTMLCanvasElement} toile @param {{amb: number[], sources: {x: number, y: number, r: number, f: number, c: number[]}[]}} lum
 */
export function eclairer(toile, lum) {
  const c = toile.getContext('2d');
  const img = c.getImageData(0, 0, toile.width, toile.height), d = img.data;
  const PAS = 0.14;
  for (let y = 0; y < toile.height; y++) for (let x = 0; x < toile.width; x++) {
    let r = lum.amb[0], g = lum.amb[1], b = lum.amb[2];
    for (const s of lum.sources) {
      const k = 1 - Math.hypot((x - s.x) / s.r, (y - s.y) / (s.r * (s.ry || 1)));
      if (k > 0) { const f = k * k * s.f; r += f * s.c[0]; g += f * s.c[1]; b += f * s.c[2]; }
    }
    // le bord de l'écran plonge dans le noir
    const v = Math.hypot((x - 160) / 190, (y - 86) / 120);
    if (v > 0.6) { const q = Math.max(0, 1 - (v - 0.6) * 1.3); r *= q; g *= q; b *= q; }
    const seuil = BAYER[(y & 3) * 4 + (x & 3)];
    const i = (y * toile.width + x) * 4;
    const pal = (f) => (Math.floor(f / PAS + seuil) * PAS);
    d[i] = Math.min(255, d[i] * pal(r)); d[i + 1] = Math.min(255, d[i + 1] * pal(g)); d[i + 2] = Math.min(255, d[i + 2] * pal(b));
  }
  c.putImageData(img, 0, 0);
}

/** Une toile hors écran. */
export function toile(w = W, h = H) {
  const t = document.createElement('canvas'); t.width = w; t.height = h;
  const c = t.getContext('2d'); c.imageSmoothingEnabled = false;
  return { t, c };
}
/** Un petit hasard fixe, pour que les motifs ne bougent jamais. */
export function h32(n) { n = Math.imul(n ^ 61 ^ (n >>> 16), 9); n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967296; }
