// L'hôtel qui fait peur (2.6.0, maquette `tools/mockup-ghost-train-hante.html`, Julie a tout
// gardé) : des nuages qui passent sur la lune et assombrissent la nuit, du brouillard au pied
// de l'hôtel, un vieil arbre au visage creusé qui se révèle à l'éclair, un orage toutes les
// douze secondes, quelqu'un derrière une fenêtre, des yeux dans la lucarne, des chauves-souris
// et la pluie. Tout est fonction du temps t : rien à retenir d'une image à l'autre.
// `fond` se dessine sur la façade AVANT les fenêtres et les étiquettes, `devant` après.
import { R, P, ovale, NOIR, W, H } from './peinture.js';

const h = (n) => { n = Math.imul(n ^ 61, 9); n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); return ((n ^ (n >>> 15)) >>> 0) / 4294967296; };

/** Un orage toutes les 12 s ; décalé pour qu'à t = 0 (écrans figés) il ne tonne pas. */
export const ORAGE = { periode: 12, decale: 6, tonnerre: 0.7 };
/** Le temps depuis le dernier éclair. @param {number} t */
export const depuisEclair = (t) => (t + ORAGE.decale) % ORAGE.periode;
/** Deux coups rapprochés, puis il s'éteint ; adouci (un seul, au tiers) si les flashs sont réduits. */
export function flash(t, doux = false) {
  const d = depuisEclair(t);
  if (doux) return d < 0.6 ? 0.3 * (1 - d / 0.6) : 0;
  return d < 0.08 ? 1 : d < 0.16 ? 0.2 : d < 0.26 ? 0.8 : d < 0.7 ? 0.8 * (1 - (d - 0.26) / 0.44) : 0;
}
/** Le tonnerre gronde entre t0 et t1 ? (un peu après l'éclair) @param {number} t0 @param {number} t1 */
export function tonne(t0, t1) {
  const a = depuisEclair(t0), b = depuisEclair(t1), x = ORAGE.tonnerre;
  return b >= a ? a < x && b >= x : a < x || b >= x;
}

// --- le ciel : nuages qui passent sur la lune -------------------------------------------------
function nuage(c, x, y, l) {
  const bouts = [[0, 0, l * 0.5, 5], [-l * 0.25, -3, l * 0.22, 5], [l * 0.18, -4, l * 0.26, 6]];
  for (const [dx, dy, rx, ry] of bouts) ovale(c, x + dx, y + dy, rx + 1, ry + 1, '#1c1236');
  for (const [dx, dy, rx, ry] of bouts) ovale(c, x + dx, y + dy, rx, ry, l > 80 ? '#2a2050' : '#3a2e5e');
  R(c, '#5a4e8a', x - l * 0.3, y - 6, l * 0.4, 1);
}
/** Trois nuages lents ; rend combien la lune est cachée (0 à 1). */
function lune(c, t) {
  let cache = 0;
  [[4, 0, 50, 70], [4, 210, 44, 50], [2.5, 90, 62, 90]].forEach(([v, d, y, l]) => {
    const x = ((t * v + d) % 420) - 60;
    if (Math.abs(x - 46) < l * 0.5) cache = Math.max(cache, 1 - Math.abs(x - 46) / (l * 0.5));
    nuage(c, x, y, l);
  });
  return cache;
}

// --- le vieil arbre, à gauche, et son visage dans l'écorce ------------------------------------
function arbre(c, t, f) {
  const x = 40, y = 154, bois = f > 0.05 ? '#1c1024' : '#0a0512', creux = '#000000';
  P(c, [[x - 12, y], [x - 7, y - 8], [x - 8, y - 26], [x - 10, y - 40], [x - 6, y - 52], [x + 2, y - 56], [x + 8, y - 50], [x + 7, y - 36], [x + 9, y - 22], [x + 8, y - 8], [x + 14, y]], bois, NOIR);
  const bal = Math.sin(t * 1.1) * 1.5;
  for (const [x0, y0, x1, y1, l] of [
    [x - 7, y - 46, x - 24, y - 58, 3], [x - 20, y - 56, x - 30, y - 54, 2], [x - 24, y - 58, x - 28, y - 68, 2],
    [x + 6, y - 48, x + 26 + bal, y - 62, 3], [x + 22 + bal, y - 60, x + 34 + bal, y - 60, 2], [x + 26 + bal, y - 62, x + 30 + bal, y - 72, 2], [x + 34 + bal, y - 60, x + 40 + bal, y - 54, 1],
    [x, y - 55, x - 2, y - 72, 2], [x - 2, y - 66, x + 8, y - 76, 1], [x - 8, y - 30, x - 24, y - 36, 2], [x - 24, y - 36, x - 28, y - 30, 1],
    [x + 8, y - 28, x + 24 + bal, y - 36, 2], [x + 24 + bal, y - 36, x + 30 + bal, y - 32, 1],
  ]) { c.strokeStyle = bois; c.lineWidth = l; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
  // le visage : deux creux en amande, une bouche dentée ; à l'éclair, les yeux s'allument
  const lit = f > 0.05, oeil = lit ? '#fff27a' : t % 7 < 0.2 ? '#4a3010' : creux;
  P(c, [[x - 7, y - 40], [x - 1, y - 37], [x - 2, y - 34], [x - 7, y - 35]], creux);
  P(c, [[x + 8, y - 40], [x + 2, y - 37], [x + 3, y - 34], [x + 8, y - 35]], creux);
  R(c, oeil, x - 5, y - 37, 2, 2); R(c, oeil, x + 4, y - 37, 2, 2);
  if (lit) { c.globalAlpha = 0.4; ovale(c, x - 4, y - 36, 4, 3, '#fff27a'); ovale(c, x + 5, y - 36, 4, 3, '#fff27a'); c.globalAlpha = 1; }
  P(c, [[x - 6, y - 28], [x - 2, y - 30], [x + 2, y - 28], [x + 6, y - 30], [x + 7, y - 20], [x + 1, y - 17], [x - 6, y - 20]], creux);
  if (lit) for (const dx of [-4, 0, 4]) { R(c, '#c8b8e0', x + dx, y - 28, 1, 3); R(c, '#c8b8e0', x + dx + 1, y - 20, 1, 2); }
}

// --- le brouillard qui rampe au pied de l'hôtel -----------------------------------------------
function brume(c, t, devant) {
  for (let k = 0; k < (devant ? 6 : 9); k++) {
    const v = (devant ? 9 : 5) + (k % 3) * 2, x = ((h(k + (devant ? 50 : 0)) * 400 + t * v) % 420) - 50;
    const y = devant ? 172 + h(k * 3) * 8 : 150 + h(k * 7) * 18, rx = 28 + h(k * 5) * 30;
    c.globalAlpha = devant ? 0.13 : 0.2; ovale(c, x, y, rx, devant ? 5 : 7, '#8a7ab0'); ovale(c, x + rx * 0.3, y - 2, rx * 0.6, 4, '#a898c8');
  }
  c.globalAlpha = 1;
}

// --- quelqu'un passe derrière une fenêtre, des yeux dans la lucarne ---------------------------
/** Les fenêtres où passe quelqu'un : celles des étages fermés, sinon toutes (y du haut). */
function fenetre(c, t, fermes) {
  const n = Math.floor(t / 5), d = t - n * 5;
  if (d > 1.8 || !fermes.length) return;
  if (d < 0.25 && ((d * 30) | 0) & 1) return;
  const y = fermes[Math.floor(h(n * 3) * fermes.length)], x = 102 + Math.floor(h(n) * 5) * 25;
  R(c, '#8a5a20', x, y, 14, 22); R(c, '#c88a30', x + 1, y + 1, 8, 18);
  const sx = x - 4 + (d / 1.8) * 22;
  c.save(); c.beginPath(); c.rect(x, y, 14, 22); c.clip();
  ovale(c, sx, y + 9, 3, 3.5, NOIR); P(c, [[sx - 6, y + 22], [sx - 4, y + 13], [sx + 4, y + 13], [sx + 6, y + 22]], NOIR);
  c.restore();
  R(c, NOIR, x + 7, y, 1, 22); R(c, NOIR, x, y + 11, 14, 1);
}
function lucarne(c, t) {
  const d = (t + 3) % 9;
  if (d > 2.2) return;
  const ouv = d < 0.3 ? d / 0.3 : d > 1.9 ? (2.2 - d) / 0.3 : d > 1.1 && d < 1.2 ? 0 : 1, hh = Math.round(ouv * 2);
  if (!hh) return;
  for (const x of [156, 163]) { R(c, '#ff3a2a', x - 1, 49 - hh, 3, hh * 2); R(c, '#fff27a', x, 49 - hh + 1, 1, Math.max(1, hh * 2 - 2)); }
}

function chauves(c, t) {
  const d = t % 7;
  if (d > 3) return;
  for (let k = 0; k < 3; k++) {
    const x = -10 + d * 70 + k * 9, y = 60 - d * 8 + Math.sin(d * 9 + k) * 3 + k * 4, haut = ((t * 12 + k) | 0) & 1;
    R(c, NOIR, x - 1, y, 3, 2);
    if (haut) { R(c, NOIR, x - 4, y - 2, 3, 1); R(c, NOIR, x + 2, y - 2, 3, 1); } else { R(c, NOIR, x - 4, y + 1, 3, 1); R(c, NOIR, x + 2, y + 1, 3, 1); }
  }
}
function pluie(c, t) {
  c.strokeStyle = '#8a80c0'; c.globalAlpha = 0.35; c.lineWidth = 1; c.beginPath();
  for (let k = 0; k < 70; k++) { const x = ((h(k) * 360 + t * 40) % 360) - 20, y = ((h(k * 9) * 200 + t * 260 + k * 13) % 200) - 10; c.moveTo(x, y); c.lineTo(x - 3, y + 7); }
  c.stroke(); c.globalAlpha = 1;
}
function eclair(c, t) {
  let x = 220 + h(Math.floor((t + ORAGE.decale) / ORAGE.periode)) * 70;
  const pts = [[x, 0]];
  for (let y = 12; y < 66; y += 9) { x += (h(y + Math.floor(t / ORAGE.periode)) - 0.5) * 16; pts.push([x, y]); }
  for (const [col, l] of [['#8a80ff', 3], ['#ffffff', 1]]) { c.strokeStyle = col; c.lineWidth = l; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const [a, b] of pts) c.lineTo(a, b); c.stroke(); }
}

/** Derrière les fenêtres et les étiquettes : ciel, chauves-souris, arbre, brume, ombre du nuage. */
export function fond(c, t, doux = false) {
  const cache = lune(c, t);
  chauves(c, t);
  arbre(c, t, flash(t, doux));
  brume(c, t, false);
  if (cache > 0) { c.globalAlpha = cache * 0.35; R(c, '#05020c', 0, 0, W, H); c.globalAlpha = 1; }
}
/**
 * Devant : la fenêtre, la lucarne, la pluie, la brume, puis l'éclair (le ciel blanchit,
 * l'arbre passe devant le voile pour que son visage se voie).
 * @param {CanvasRenderingContext2D} c @param {number} t @param {number[]} fermes y des fenêtres des étages fermés
 */
export function devant(c, t, fermes, doux = false) {
  fenetre(c, t, fermes);
  lucarne(c, t);
  pluie(c, t);
  brume(c, t, true);
  const f = flash(t, doux);
  if (f <= 0) return;
  c.globalAlpha = f * 0.55; R(c, '#e8e0ff', 0, 0, W, 150); c.globalAlpha = f * 0.35; R(c, '#e8e0ff', 0, 150, W, 30); c.globalAlpha = 1;
  if (!doux && f > 0.5 && depuisEclair(t) < 0.3) eclair(c, t);
  c.globalAlpha = Math.min(1, f * 1.4); arbre(c, t, f); c.globalAlpha = 1;
}
