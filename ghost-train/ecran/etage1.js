// Le 1er étage de l'hôtel : la bibliothèque. Trois pièces :
//   le FUMOIR : horloge, vitrine à alcools, globe terrestre, fauteuils de cuir, fenêtre,
//     ventilateur au plafond (il tombe) et le globe (il s'ouvre : des pièces) ;
//   la BIBLIOTHÈQUE : des livres sur tous les murs, l'échelle, le passage secret, la table
//     de lecture et sa lampe verte, le lustre de bronze (il tombe), l'encrier (des pièces) ;
//   les ARCHIVES : classeurs de fer, fichier à tiroirs, monte-charge, cartons, l'ampoule
//     pendue (elle tombe sur qui passe dessous), le petit coffre-fort (des pièces).
import { R, P, L, boite, ovale, mur, quad, sol, plafond, piece, aretes, eclairer, toile, h32, NOIR, FOND } from './peinture.js';
import { hauteurChute } from '../moteur/rayon.js';

const BOIS = ['#8a5232', '#5e3420', '#3a1e12'];
const BOIS_C = ['#a8683e', '#7a4628', '#4e2a18'];
const OR = ['#ffe890', '#e0b040', '#9a6a18'];
const CUIR = ['#a8502a', '#7a3418', '#4a1c0c'];
const FER = ['#a8acbc', '#7a7e90', '#4a4e60'];
const LIVRES = ['#8e2c2c', '#2c6040', '#2e3e84', '#a08030', '#6e2e70', '#3a5a6a', '#9a5a2a'];
const VELOURS = ['#d0384a', '#982030', '#5e1020'];

/** Une rangée de livres de x à x + w, posée sur y (le bas), haute de h. */
function livres(c, x, y, w, h, graine) {
  for (let i = 0, k = 0; i < w; k++) {
    const lw = 2 + ((h32(graine + k * 7) * 3) | 0), lh = h - ((h32(graine + k * 13) * 4) | 0);
    if (i + lw > w) break;
    R(c, LIVRES[(h32(graine + k) * LIVRES.length) | 0], x + i, y - lh, lw, lh);
    R(c, '#00000055', x + i + lw - 1, y - lh, 1, lh);
    if (lw > 2) R(c, '#ffffff22', x + i, y - lh + 2, lw, 1);
    i += lw;
  }
}
/** Une bibliothèque de face : montants, tablettes, livres. */
function rayonnage(c, x, y, w, h, graine, tab = 16) {
  boite(c, x, y, w, h, BOIS);
  R(c, '#1a0e08', x + 2, y + 2, w - 4, h - 4);
  for (let ty = y + 2 + tab; ty <= y + h - 2; ty += tab) { livres(c, x + 2, ty, w - 4, tab - 3, graine + ty * 31); R(c, BOIS[0], x + 2, ty, w - 4, 2); }
}
/** Une bibliothèque sur un mur de côté : des bandes de livres qui fuient. */
function rayonnageCote(c, cote, w0, w1, h0, h1, graine, n = 5) {
  P(c, quad(cote, w0, w1, h0, h1), '#1a0e08', NOIR);
  for (let r = 0; r < n; r++) {
    const ha = h0 + (h1 - h0) * r / n, hb = h0 + (h1 - h0) * (r + 1) / n;
    for (let k = 0; k < 26; k++) {
      const wa = w0 + (w1 - w0) * k / 26, wb = w0 + (w1 - w0) * (k + 0.85) / 26;
      P(c, quad(cote, wa, wb, ha + 0.012, hb - 0.006 - h32(graine + r * 40 + k) * 0.02), LIVRES[(h32(graine + r * 91 + k * 3) * LIVRES.length) | 0]);
    }
    P(c, quad(cote, w0, w1, hb - 0.008, hb + 0.004), BOIS[1]);
  }
  P(c, quad(cote, w0, w0 + 0.02, h0, h1), BOIS[2]); P(c, quad(cote, w1 - 0.02, w1, h0, h1), BOIS[2]);
}
/** Une fenêtre à la lune sur un mur de côté, et ses rideaux. */
function fenetreCote(c, cote, w0, w1, h0, h1) {
  P(c, quad(cote, w0 - 0.02, w1 + 0.02, h0 - 0.02, h1 + 0.02), NOIR);
  P(c, quad(cote, w0, w1, h0, h1), '#1a2850');
  for (let k = 0; k < 12; k++) { const p = mur(cote, w0 + h32(k * 7) * (w1 - w0), h0 + h32(k * 13) * (h1 - h0)); R(c, '#8aa0d8', p[0], p[1], 1, 1); }
  const lu = mur(cote, w0 + (w1 - w0) * 0.35, h0 + (h1 - h0) * 0.3); ovale(c, lu[0], lu[1], 5, 6, '#dce8ff'); ovale(c, lu[0] + 1, lu[1] - 1, 3.5, 4.5, '#f4f8ff');
  const a = mur(cote, (w0 + w1) / 2, h0), b = mur(cote, (w0 + w1) / 2, h1); L(c, BOIS[2], a[0], a[1], b[0], b[1]);
  const d = mur(cote, w0, (h0 + h1) / 2), e = mur(cote, w1, (h0 + h1) / 2); L(c, BOIS[2], d[0], d[1], e[0], e[1]);
  for (const [a0, a1] of [[w0 - 0.08, w0 + 0.03], [w1 - 0.03, w1 + 0.08]]) {
    P(c, quad(cote, a0, a1, h0 - 0.06, h1 + 0.14), VELOURS[1], NOIR);
    for (let q = 0; q < 3; q++) { const ww = a0 + (a1 - a0) * (q + 0.5) / 3, m0 = mur(cote, ww, h0 - 0.04), m1 = mur(cote, ww, h1 + 0.12); L(c, q & 1 ? VELOURS[2] : VELOURS[0], m0[0], m0[1], m1[0], m1[1]); }
  }
}
/** L'éclair dans une fenêtre de côté. */
function eclair(c, cote, w0, w1, h0, h1, t) {
  if (((t * 12) | 0) % 3 === 0) return;
  c.globalAlpha = 0.6; P(c, quad(cote, w0, w1, h0, h1), '#e8f0ff'); c.globalAlpha = 1;
  const a = mur(cote, w0 + 0.05, h0), b = mur(cote, w0 + 0.1, (h0 + h1) / 2), d = mur(cote, w0 + 0.06, h1);
  L(c, '#ffffff', a[0], a[1], b[0], b[1]); L(c, '#ffffff', b[0], b[1], d[0], d[1]);
}
/** Le halo blanc d'un objet visé. */
function vise(c, charge, besoin, f) { if (charge > 0) { c.globalAlpha = Math.min(1, charge / besoin) * 0.6; f(); c.globalAlpha = 1; } }
/** Une flamme de bougie qui vacille. */
function flamme(c, x, y, t) { const v = Math.sin(t * 13 + x) > 0.3 ? 1 : 0; R(c, '#ff9a2a', x - 1, y - 4, 2, 4); R(c, '#fff2a0', x - 1 + v, y - 3, 1, 2); }
/** Un fauteuil club de cuir, vu de dos (on est assis en face) : un haut dossier capitonné, deux accoudoirs ronds. */
function fauteuil(c, x, y, w, h) {
  ovale(c, x + w / 2, y + h - 2, w * 0.5, 5, '#120a08');
  // les accoudoirs, en boudins
  for (const ax of [x, x + w - 14]) { boite(c, ax, y + 22, 14, h - 22, CUIR); ovale(c, ax + 7, y + 22, 7, 5, NOIR); ovale(c, ax + 7, y + 22, 6, 4, CUIR[0]); }
  // le dossier, arrondi en haut, ses boutons de capiton
  const dx = x + 10, dw = w - 20;
  R(c, NOIR, dx - 1, y + 7, dw + 2, h - 6); R(c, CUIR[1], dx, y + 8, dw, h - 8);
  ovale(c, dx + dw / 2, y + 8, dw / 2 + 1, 7, NOIR); ovale(c, dx + dw / 2, y + 8, dw / 2, 6, CUIR[1]); ovale(c, dx + dw / 2 - 8, y + 5, dw / 4, 2, CUIR[0]);
  for (let j = 0; j < 3; j++) for (let k = 0; k < 5; k++) {
    const bx = dx + 6 + k * ((dw - 12) / 4) + (j & 1 ? (dw - 12) / 8 : 0), by = y + 10 + j * 9;
    if (bx > dx + dw - 5) continue;
    R(c, CUIR[2], bx, by, 2, 2); L(c, CUIR[2], bx - 3, by - 3, bx, by); L(c, CUIR[0], bx + 2, by + 2, bx + 4, by + 4);
  }
  R(c, CUIR[2], dx + dw - 2, y + 8, 2, h - 8);
}
/** Le lustre de bronze : une couronne et ses bougies. */
function lustreBronze(c, x, y, t, viser) {
  x = Math.round(x);
  R(c, NOIR, x - 17, y + 5, 34, 5); R(c, '#b07a3a', x - 16, y + 6, 32, 3); R(c, '#e0a860', x - 16, y + 6, 32, 1);
  ovale(c, x, y + 12, 5, 4, NOIR); ovale(c, x, y + 12, 4, 3, '#b07a3a');
  R(c, NOIR, x - 1, y, 3, 6); R(c, '#7a4a1a', x, y, 1, 6);
  for (let k = 0; k < 7; k++) { const bx = x - 15 + k * 5; R(c, '#f4ecd8', bx, y + 1, 2, 5); flamme(c, bx + 1, y + 1, t + k); }
  if (viser > 0) { c.globalAlpha = Math.min(1, viser) * 0.6; R(c, '#ffffff', x - 16, y + 6, 32, 3); c.globalAlpha = 1; }
}

// ———————————————————————————— le fumoir ————————————————————————————
export const FUMOIR = {
  peindre() {
    const { t, c } = toile();
    const PAP = '#26382c', PAP_M = '#34503c', PAP_S = '#182418';
    piece(c, { plafond: '#2a1a18', sol: '#4a2a18', murG: PAP, murD: PAP, fond: PAP });
    for (let k = 0; k <= 6; k++) { const a = plafond(-1 + k / 3, 0), b = plafond(-1 + k / 3, 1); P(c, [[a[0] - 4, a[1]], [a[0] + 4, a[1]], [b[0] + 2, b[1]], [b[0] - 2, b[1]]], '#3a2418'); }
    for (let x = FOND.x0 + 7; x < FOND.x1; x += 14) R(c, PAP_M, x, FOND.y0, 1, 56);
    for (const cote of [-1, 1]) {
      for (let k = 0; k < 16; k++) { const a = mur(cote, k / 16, 0), b = mur(cote, k / 16, 0.6); L(c, k & 1 ? PAP_S : PAP_M, a[0], a[1], b[0], b[1]); }
      P(c, quad(cote, 0, 1, 0.6, 1), BOIS[1]);
      for (let k = 0; k < 8; k++) P(c, quad(cote, k / 8 + 0.02, (k + 1) / 8 - 0.02, 0.67, 0.93), BOIS[2]);
      const a = mur(cote, 0, 0.6), b = mur(cote, 1, 0.6); L(c, OR[1], a[0], a[1], b[0], b[1]);
    }
    R(c, BOIS[1], FOND.x0, 86, FOND.x1 - FOND.x0, FOND.y1 - 86); R(c, OR[1], FOND.x0, 86, FOND.x1 - FOND.x0, 1);
    for (let x = FOND.x0 + 3; x < FOND.x1 - 10; x += 20) { R(c, BOIS[2], x, 90, 16, 24); R(c, BOIS[0], x, 90, 16, 1); }
    // le parquet et un tapis persan bleu nuit
    for (let k = -12; k <= 12; k++) { const a = sol(k / 6, 0), b = sol(k / 6, 1); L(c, '#2e1a0e', a[0], a[1], b[0], b[1]); }
    P(c, [sol(-0.6, 0.1), sol(0.6, 0.1), sol(0.6, 0.9), sol(-0.6, 0.9)], '#1e2a5a', NOIR);
    P(c, [sol(-0.5, 0.18), sol(0.5, 0.18), sol(0.5, 0.82), sol(-0.5, 0.82)], '#8a2030', OR[2]);
    P(c, [sol(-0.3, 0.34), sol(0.3, 0.34), sol(0.3, 0.66), sol(-0.3, 0.66)], '#1e2a5a', OR[1]);
    // à gauche : une bibliothèque basse et un râtelier de pipes
    rayonnageCote(c, -1, 0.3, 0.8, 0.3, 0.6, 11, 2);
    for (let k = 0; k < 4; k++) { const p = mur(-1, 0.38 + k * 0.1, 0.2); R(c, NOIR, p[0] - 1, p[1] - 6, 3, 8); R(c, '#6a3a1a', p[0], p[1] - 5, 1, 6); ovale(c, p[0] + 1, p[1] + 2, 2, 1.5, '#3a1e0e'); }
    // à droite : la fenêtre
    fenetreCote(c, 1, 0.3, 0.6, 0.12, 0.5);
    // l'horloge de parquet, à gauche du fond (sa porte vitrée est peinte à part)
    boite(c, 82, 38, 26, 6, BOIS); boite(c, 84, 44, 22, 24, BOIS);
    ovale(c, 95, 56, 8, 8, NOIR); ovale(c, 95, 56, 7, 7, '#f0e8d0');
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; R(c, '#5a4a3a', 95 + Math.cos(a) * 5.5, 56 + Math.sin(a) * 5.5, 1, 1); }
    L(c, NOIR, 95, 56, 95, 51); L(c, NOIR, 95, 56, 99, 57);
    boite(c, 86, 68, 18, 44, BOIS); R(c, '#120a06', 88, 70, 14, 40);
    boite(c, 84, 112, 22, 6, BOIS);
    // la vitrine à alcools au milieu du fond (ses portes vitrées sont peintes à part)
    boite(c, 132, 44, 56, 6, BOIS); boite(c, 134, 50, 52, 68, BOIS);
    R(c, '#0e1018', 137, 53, 46, 54);
    for (const y of [70, 88]) R(c, BOIS[0], 137, y, 46, 2);
    for (const [y, n] of [[70, 6], [88, 5], [106, 4]]) for (let k = 0; k < n; k++) {
      const x = 141 + k * (40 / n), hb = 9 + ((h32(y + k) * 5) | 0), col = ['#5a8a3a', '#a07a2a', '#7a1a2a', '#c8c0a0', '#3a5a8a', '#8a4a1a'][(k + y) % 6];
      R(c, NOIR, x - 1, y - hb - 1, 5, hb + 1); R(c, col, x, y - hb, 3, hb); R(c, '#ffffff', x, y - hb + 2, 1, 2); R(c, col, x + 1, y - hb - 3, 1, 3);
    }
    boite(c, 134, 108, 52, 10, BOIS); R(c, OR[1], 158, 112, 4, 2);
    // le globe terrestre, à droite du fond (sur son pied)
    R(c, NOIR, 211, 100, 3, 18); R(c, NOIR, 226, 100, 3, 18); R(c, BOIS[1], 212, 100, 1, 17); R(c, BOIS[1], 227, 100, 1, 17);
    boite(c, 206, 116, 28, 3, BOIS);
    // les deux fauteuils club, au premier plan
    fauteuil(c, 18, 126, 96, 54); fauteuil(c, 206, 126, 96, 54);
    // un guéridon et son cendrier, entre les deux
    ovale(c, 160, 160, 16, 4, NOIR); ovale(c, 160, 159, 15, 3, BOIS[0]); R(c, NOIR, 158, 162, 5, 18); R(c, BOIS[1], 159, 162, 3, 18);
    ovale(c, 160, 157, 6, 2, '#7a7e90'); R(c, '#f0e8d0', 162, 154, 6, 2); R(c, '#ff5a2a', 168, 154, 1, 2);
    aretes(c, '#0c0806');
    eclairer(t, {
      amb: [0.4, 0.4, 0.46],
      sources: [
        { x: 160, y: 80, r: 130, ry: 0.8, f: 0.7, c: [1.2, 0.85, 0.5] },
        { x: 290, y: 70, r: 70, f: 0.5, c: [0.5, 0.65, 1.0] },
        { x: 160, y: 150, r: 60, f: 0.4, c: [1.2, 0.7, 0.4] },
      ],
    });
    return t;
  },
  /** @param {CanvasRenderingContext2D} c @param {any} s @param {number} t */
  animer(c, s, t) {
    // le balancier derrière la porte vitrée de l'horloge ; la porte s'ouvre
    const bx = 95 + Math.sin(t * 3.2) * 4;
    L(c, '#c8a040', 95, 72, bx, 98); ovale(c, bx, 99, 3, 3, OR[1]);
    const oh = s.ouvert.horloge, th = s.alerte.horloge > 0 ? (((t * 30) | 0) & 1) : 0;
    const lw = Math.max(2, Math.round(14 * (1 - oh)));
    R(c, NOIR, 88 - oh * 10 + th, 70, lw, 40); R(c, '#3a4a6e', 89 - oh * 10 + th, 71, Math.max(1, lw - 2), 38);
    if (lw > 6) { c.globalAlpha = 0.4; L(c, '#c8d8ff', 90 + th, 106, 99 + th, 76); c.globalAlpha = 1; }
    if (s.alerte.horloge > 0) { c.globalAlpha = 0.5; R(c, '#c8ff8a', 88, 108, 14, 2); c.globalAlpha = 1; }
    // les portes vitrées de la vitrine
    const ov = s.ouvert.vitrine, tv = s.alerte.vitrine > 0 ? (((t * 30) | 0) & 1 ? 1 : -1) : 0, vw = Math.max(2, Math.round(23 * (1 - ov)));
    for (const x of [137 + tv - ov * 8, 183 - vw - tv + ov * 8]) {
      R(c, BOIS[2], x, 53, vw, 54);
      if (vw > 4) { c.globalAlpha = 0.25; R(c, '#c8d8ff', x + 1, 54, vw - 2, 52); c.globalAlpha = 1; L(c, '#c8d8ff', x + 2, 100, x + vw - 3, 60); }
    }
    if (s.alerte.vitrine > 0) { c.globalAlpha = 0.45; R(c, '#c8ff8a', 137, 53, 46, 54); c.globalAlpha = 1; }
    // la fenêtre
    if (s.alerte.fenetre > 0) eclair(c, 1, 0.3, 0.6, 0.12, 0.5, t);
    // derrière le fauteuil de gauche : il tremble
    if (s.alerte.fauteuil > 0) { const d = ((t * 30) | 0) & 1; c.globalAlpha = 0.5; R(c, '#c8ff8a', 34 + d, 122, 64, 3); c.globalAlpha = 1; }
    // la fumée des cigares, qui monte et se perd
    for (let k = 0; k < 6; k++) {
      const ph = (t * 0.15 + k / 6) % 1, x = 166 + Math.sin(ph * 9 + k) * 10 + ph * 20, y = 152 - ph * 110;
      c.globalAlpha = (1 - ph) * 0.35; ovale(c, x, y, 3 + ph * 8, 2 + ph * 4, '#c8c8d8'); c.globalAlpha = 1;
    }
    // le globe, qui tourne doucement (visé assez longtemps, il s'ouvre : c'est un bar plein de pièces)
    const gl = s.objets.globe;
    if (!gl.fait) {
      ovale(c, 220, 88, 14, 14, NOIR); ovale(c, 220, 88, 13, 13, '#2a5aa0');
      for (let k = 0; k < 4; k++) { const x = 220 + Math.sin(t * 0.6 + k * 1.6) * 9; if (Math.cos(t * 0.6 + k * 1.6) > 0) ovale(c, x, 82 + k * 4, 3, 2.5, '#3a8a3a'); }
      ovale(c, 216, 83, 4, 3, '#5a8ad0');
      c.strokeStyle = OR[1]; c.lineWidth = 1; c.beginPath(); c.arc(220, 88, 15, -Math.PI * 0.9, Math.PI * 0.1); c.stroke();
      vise(c, gl.charge, gl.besoin, () => ovale(c, 220, 88, 13, 13, '#ffffff'));
    } else { ovale(c, 220, 96, 13, 5, NOIR); ovale(c, 220, 95, 12, 4, '#2a5aa0'); R(c, '#e0b040', 214, 92, 12, 2); }
    // le ventilateur au plafond, qui tourne (ou qui tombe)
    const ve = s.objets.ventilo;
    if (!ve.fini) {
      const y = Math.round(hauteurChute(ve));
      if (!ve.chute) { R(c, NOIR, 159, 0, 3, y + 2); R(c, '#4a4a56', 160, 0, 1, y + 2); }
      const a = ve.chute ? t * 2 : t * 9;
      for (let k = 0; k < 4; k++) {
        const an = a + k * Math.PI / 2, dx = Math.cos(an) * 20, dy = Math.sin(an) * 3;
        P(c, [[160, y + 4], [160 + dx - dy * 0.3, y + 4 + dy - 2], [160 + dx + dy * 0.3, y + 4 + dy + 2]], BOIS_C[1], NOIR);
      }
      ovale(c, 160, y + 4, 4, 3, NOIR); ovale(c, 160, y + 4, 3, 2, OR[1]);
      vise(c, ve.charge, ve.besoin, () => ovale(c, 160, y + 4, 18, 4, '#ffffff'));
    }
  },
};

// ———————————————————————————— la bibliothèque ————————————————————————————
export const BIBLIOTHEQUE = {
  peindre() {
    const { t, c } = toile();
    piece(c, { plafond: '#241612', sol: '#5a3a22', murG: '#1a0e08', murD: '#1a0e08', fond: '#1a0e08' });
    // le plafond à caissons, la galerie de livres jusqu'en haut
    for (let k = 0; k <= 4; k++) { const a = plafond(-1 + k / 2, 0), b = plafond(-1 + k / 2, 1); L(c, '#4a2a18', a[0], a[1], b[0], b[1]); }
    for (const w of [0.4, 0.75]) { const a = plafond(-1, w), b = plafond(1, w); L(c, '#4a2a18', a[0], a[1], b[0], b[1]); }
    rayonnageCote(c, -1, 0, 1, 0.02, 0.98, 5, 7);
    rayonnageCote(c, 1, 0, 1, 0.02, 0.98, 9, 7);
    rayonnage(c, FOND.x0, FOND.y0, 60, FOND.y1 - FOND.y0, 21, 14);
    rayonnage(c, FOND.x1 - 60, FOND.y0, 60, FOND.y1 - FOND.y0, 33, 14);
    // au milieu du fond : la bibliothèque qui pivote (le passage secret), son fronton
    rayonnage(c, 136, FOND.y0 + 6, 48, FOND.y1 - FOND.y0 - 6, 47, 14);
    R(c, BOIS_C[1], 132, FOND.y0, 56, 7); R(c, OR[1], 154, FOND.y0 + 2, 12, 3);
    // la tablette de la galerie, à mi-hauteur sur tout le tour
    const ga = mur(-1, 0, 0.48), gb = mur(-1, 1, 0.48), gc = mur(1, 1, 0.48), gd = mur(1, 0, 0.48);
    P(c, [ga, gb, [gb[0], gb[1] + 3], [ga[0], ga[1] + 6]], BOIS_C[1], NOIR); P(c, [gd, gc, [gc[0], gc[1] + 3], [gd[0], gd[1] + 6]], BOIS_C[1], NOIR);
    R(c, BOIS_C[1], FOND.x0, 72, FOND.x1 - FOND.x0, 3); R(c, NOIR, FOND.x0, 75, FOND.x1 - FOND.x0, 1);
    for (let x = FOND.x0; x < FOND.x1; x += 8) R(c, OR[2], x, 70, 1, 2);
    // l'échelle roulante appuyée à gauche du fond
    L(c, NOIR, 86, 34, 80, 118); L(c, NOIR, 106, 34, 112, 118); L(c, BOIS_C[0], 87, 34, 81, 118); L(c, BOIS_C[0], 105, 34, 111, 118);
    for (let k = 0; k < 9; k++) { const y = 40 + k * 9, f = (y - 34) / 84; R(c, BOIS_C[1], 87 - f * 6, y, 19 + f * 12, 2); }
    // le parquet en points de Hongrie, et la table de lecture au premier plan
    for (let k = -10; k <= 10; k++) { const a = sol(k / 5, 0), b = sol(k / 5, 1); L(c, '#3e2414', a[0], a[1], b[0], b[1]); }
    for (let j = 0; j < 8; j++) { const a = sol(-1, j / 8), b = sol(1, j / 8); L(c, '#6e462a', a[0], a[1], b[0], b[1]); }
    P(c, [[96, 140], [224, 140], [240, 154], [80, 154]], BOIS[0], NOIR); R(c, BOIS[1], 80, 154, 160, 5); R(c, NOIR, 80, 159, 160, 1);
    boite(c, 88, 160, 7, 20, BOIS); boite(c, 225, 160, 7, 20, BOIS);
    // des livres ouverts, une pile
    P(c, [[110, 146], [134, 144], [134, 150], [110, 152]], '#f4ecd0', NOIR); P(c, [[134, 144], [156, 146], [156, 152], [134, 150]], '#e8dcc0', NOIR);
    for (let k = 0; k < 4; k++) R(c, '#8a7a5a', 114 + k * 4, 147 - k * 0.4, 3, 1);
    for (let k = 0; k < 4; k++) boite(c, 184 + k, 142 - k * 4, 26 - k * 2, 4, [LIVRES[k], LIVRES[k], NOIR], false);
    // la lampe de banquier, son abat-jour vert
    R(c, NOIR, 166, 128, 2, 14); R(c, OR[1], 166, 128, 1, 14); ovale(c, 167, 143, 6, 2, OR[2]);
    P(c, [[156, 128], [180, 128], [176, 120], [160, 120]], '#2a8a4a', NOIR); R(c, '#5ac07a', 161, 121, 14, 1);
    aretes(c, '#0c0806');
    eclairer(t, {
      amb: [0.4, 0.38, 0.42],
      sources: [
        { x: 168, y: 134, r: 90, ry: 0.7, f: 0.9, c: [0.9, 1.15, 0.7] },
        { x: 160, y: 30, r: 120, ry: 0.8, f: 0.6, c: [1.2, 0.85, 0.5] },
      ],
    });
    return t;
  },
  /** @param {CanvasRenderingContext2D} c @param {any} s @param {number} t */
  animer(c, s, t) {
    // le passage secret : la bibliothèque du milieu tremble, puis pivote (on voit le noir derrière)
    const op = s.ouvert.passage, tp = s.alerte.passage > 0 ? (((t * 30) | 0) & 1) : 0;
    if (op > 0.05) { R(c, '#050204', 138, FOND.y0 + 8, 44 * op, FOND.y1 - FOND.y0 - 10); }
    if (s.alerte.passage > 0) { c.globalAlpha = 0.45; R(c, '#c8ff8a', 136 + tp, FOND.y1 - 3, 48, 3); c.globalAlpha = 1; }
    // les livres qui tombent des rayons de côté quand quelque chose va en sortir
    for (const [k, cote] of [['rayonG', -1], ['rayonD', 1]]) {
      if (s.alerte[k] <= 0 && s.ouvert[k] <= 0) continue;
      const base = mur(cote, 0.5, 0.45), tombe = (1 - s.alerte[k] / 0.8) * 30 + s.ouvert[k] * 20;
      for (let n = 0; n < 3; n++) R(c, LIVRES[n + 2], base[0] - 6 + n * 5, base[1] + tombe * (0.6 + n * 0.2), 4, 6);
      if (s.alerte[k] > 0) { c.globalAlpha = 0.45; ovale(c, base[0], base[1], 12, 16, '#c8ff8a'); c.globalAlpha = 1; }
    }
    // l'échelle : quelque chose remue tout en haut
    if (s.alerte.echelle > 0) { const d = ((t * 30) | 0) & 1; c.globalAlpha = 0.5; R(c, '#c8ff8a', 86 + d, 34, 20, 3); c.globalAlpha = 1; }
    // l'encrier sur la table (visé, il se brise : des pièces)
    const en = s.objets.encrier;
    if (!en.fait) {
      R(c, NOIR, 140, 138, 10, 8); R(c, '#2a2a5a', 141, 139, 8, 6); R(c, '#5a5a9a', 141, 139, 2, 2);
      L(c, '#f4f4f4', 146, 138, 152, 126); L(c, '#c8c8d8', 147, 138, 153, 126);
      vise(c, en.charge, en.besoin, () => R(c, '#ffffff', 140, 128, 14, 18));
    }
    // le lustre de bronze, qui se balance (ou qui tombe)
    const lu = s.objets.lustre;
    if (!lu.fini) {
      const y = Math.round(hauteurChute(lu)), ba = lu.chute ? 0 : Math.sin(t * 1.3) * 1.5;
      if (!lu.chute) L(c, '#3a3a46', 160, 0, 160 + ba, y);
      lustreBronze(c, 160 + ba, y, t, lu.charge / lu.besoin);
    }
  },
};

// ———————————————————————————— les archives ————————————————————————————
export const ARCHIVES = {
  peindre() {
    const { t, c } = toile();
    const MUR = '#4a4e5a', MUR_S = '#3a3e4a';
    piece(c, { plafond: '#22242c', sol: '#3a3a40', murG: MUR, murD: MUR, fond: MUR });
    // béton peint, tuyaux au plafond
    for (let k = 0; k < 40; k++) { const x = FOND.x0 + h32(k * 3) * 176, y = FOND.y0 + h32(k * 5) * 80; R(c, MUR_S, x, y, 3, 1); }
    const ta = plafond(-1, 0.55), tb = plafond(1, 0.55);
    for (const d of [0, 5]) { L(c, NOIR, ta[0], ta[1] + d, tb[0], tb[1] + d); L(c, '#7a6a5a', ta[0], ta[1] + d + 1, tb[0], tb[1] + d + 1); L(c, NOIR, ta[0], ta[1] + d + 2, tb[0], tb[1] + d + 2); }
    // les classeurs de fer le long des deux murs
    for (const cote of [-1, 1]) for (let k = 0; k < 5; k++) {
      const w0 = 0.06 + k * 0.18, w1 = w0 + 0.16;
      P(c, quad(cote, w0, w1, 0.38, 1), FER[1], NOIR);
      for (let j = 0; j < 4; j++) {
        const h0 = 0.4 + j * 0.15;
        P(c, quad(cote, w0 + 0.01, w1 - 0.01, h0, h0 + 0.13), FER[j & 1 ? 1 : 0]);
        const poi = mur(cote, (w0 + w1) / 2, h0 + 0.05); R(c, NOIR, poi[0] - 2, poi[1], 4, 2);
        const et = mur(cote, (w0 + w1) / 2, h0 + 0.09); R(c, '#e8dcc0', et[0] - 2, et[1], 4, 2);
      }
    }
    // le sol de béton, ses joints
    for (let j = 0; j < 6; j++) { const a = sol(-1, j / 6), b = sol(1, j / 6); L(c, '#2a2a30', a[0], a[1], b[0], b[1]); }
    for (let k = -3; k <= 3; k++) { const a = sol(k / 3, 0), b = sol(k / 3, 1); L(c, '#2a2a30', a[0], a[1], b[0], b[1]); }
    // le grand fichier à tiroirs, au milieu du fond (ses tiroirs sont peints à part)
    boite(c, 118, 56, 84, 62, BOIS);
    for (let j = 0; j < 5; j++) for (let k = 0; k < 7; k++) { const x = 121 + k * 11.5, y = 59 + j * 11; boite(c, x, y, 10, 9, BOIS_C, false); R(c, OR[1], x + 4, y + 5, 2, 1); R(c, '#e8dcc0', x + 3, y + 2, 4, 2); }
    // le monte-charge, à droite du fond (son volet grillagé est peint à part)
    boite(c, 208, 48, 30, 30, FER); R(c, '#0a0a0e', 211, 51, 24, 24);
    R(c, '#e8203a', 240, 58, 4, 4); R(c, NOIR, 240, 64, 4, 4);
    // à gauche du fond, des étagères de boîtes d'archives
    for (let j = 0; j < 4; j++) { R(c, FER[2], 78, 44 + j * 18, 34, 2); for (let k = 0; k < 4; k++) boite(c, 80 + k * 8, 34 + j * 18, 7, 10, ['#e8d4a8', '#c8b080', '#8a7448'], false); }
    // les cartons empilés devant, à droite
    for (const [x, y, w, h] of [[234, 140, 50, 40], [244, 108, 38, 32], [240, 92, 28, 18]]) { boite(c, x, y, w, h, ['#d8a860', '#b08040', '#7a5420']); R(c, '#8a6430', x + w / 2 - 1, y, 2, h); R(c, '#f4ecd8', x + 6, y + 6, 10, 5); }
    aretes(c, '#121218');
    eclairer(t, {
      amb: [0.36, 0.38, 0.44],
      sources: [
        { x: 160, y: 40, r: 140, ry: 0.9, f: 0.9, c: [1.2, 1.05, 0.7] },
        { x: 222, y: 62, r: 30, f: 0.3, c: [0.6, 0.8, 1.0] },
      ],
    });
    return t;
  },
  /** @param {CanvasRenderingContext2D} c @param {any} s @param {number} t */
  animer(c, s, t) {
    // les tiroirs du fichier : ils claquent, l'un s'ouvre en grand
    const af = s.alerte.fichier, of = s.ouvert.fichier;
    for (let j = 0; j < 5; j++) for (let k = 0; k < 7; k++) {
      const saute = af > 0 && h32(j * 7 + k + ((t * 8) | 0)) > 0.75 ? 2 : 0;
      if (saute || (of > 0 && j === 2 && k === 3)) { const x = 121 + k * 11.5, y = 59 + j * 11 + (of > 0 && j === 2 && k === 3 ? 4 * of : 0); boite(c, x - 1, y + saute, 12, 9, BOIS_C, true); }
    }
    if (af > 0) { c.globalAlpha = 0.4; R(c, '#c8ff8a', 118, 114, 84, 3); c.globalAlpha = 1; }
    // le volet grillagé du monte-charge : il tremble, puis remonte
    const om = s.ouvert.monte, tm = s.alerte.monte > 0 ? (((t * 30) | 0) & 1) : 0, hm = Math.round(24 * (1 - om));
    if (hm > 1) { R(c, FER[2], 211, 51 + tm, 24, hm); for (let x = 212; x < 235; x += 4) R(c, FER[0], x, 51 + tm, 1, hm); for (let y = 53; y < 51 + hm; y += 4) R(c, FER[0], 211, y + tm, 24, 1); }
    // le tiroir du classeur de gauche
    if (s.alerte.classeur > 0 || s.ouvert.classeur > 0) {
      const sort = s.alerte.classeur > 0 ? ((t * 30) | 0) & 1 : 0, ox = s.ouvert.classeur * 10;
      P(c, quad(-1, 0.42, 0.56, 0.55, 0.68).map(([x, y]) => [x + ox + sort, y]), FER[0], NOIR);
      if (s.alerte.classeur > 0) { const p = mur(-1, 0.49, 0.6); c.globalAlpha = 0.45; ovale(c, p[0], p[1], 10, 12, '#c8ff8a'); c.globalAlpha = 1; }
    }
    // la pile de cartons qui bascule
    if (s.alerte.cartons > 0) { const d = ((t * 24) | 0) & 1 ? 2 : -2; boite(c, 240 + d, 92, 28, 18, ['#d8a860', '#b08040', '#7a5420']); }
    // le petit coffre-fort, au sol à gauche (visé, il s'ouvre : des pièces)
    const co = s.objets.coffre;
    if (!co.fait) {
      boite(c, 34, 138, 34, 32, ['#7a7e90', '#4a4e60', '#2a2e3a']);
      ovale(c, 51, 154, 7, 7, NOIR); ovale(c, 51, 154, 6, 6, OR[1]); ovale(c, 51, 154, 2, 2, NOIR);
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + t * 0.3; R(c, NOIR, 51 + Math.cos(a) * 4.5, 154 + Math.sin(a) * 4.5, 1, 1); }
      R(c, OR[0], 62, 148, 2, 12);
      vise(c, co.charge, co.besoin, () => R(c, '#ffffff', 34, 138, 34, 32));
    } else { boite(c, 34, 138, 34, 32, ['#7a7e90', '#4a4e60', '#2a2e3a']); R(c, '#0a0a0e', 37, 141, 28, 26); P(c, [[34, 138], [22, 132], [22, 166], [34, 170]], '#4a4e60', NOIR); }
    // l'ampoule nue qui pend au milieu, qui se balance (ou qui tombe)
    const am = s.objets.ampoule;
    if (!am.fini) {
      const y = Math.round(hauteurChute(am)), ba = am.chute ? 0 : Math.sin(t * 1.7) * 3;
      if (!am.chute) L(c, NOIR, 160, 0, 160 + ba, y);
      const x = Math.round(160 + ba);
      R(c, NOIR, x - 3, y, 6, 5); R(c, '#7a7a86', x - 2, y + 1, 4, 3);
      ovale(c, x, y + 10, 6, 7, NOIR); ovale(c, x, y + 10, 5, 6, '#fff6c8'); ovale(c, x - 1, y + 8, 2, 3, '#ffffff');
      c.globalAlpha = 0.12; ovale(c, x, y + 40, 40, 36, '#fff6c8'); c.globalAlpha = 1;
      vise(c, am.charge, am.besoin, () => ovale(c, x, y + 10, 6, 7, '#ffffff'));
    }
  },
};
