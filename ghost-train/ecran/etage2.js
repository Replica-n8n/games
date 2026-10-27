// Le 2e étage de l'hôtel : la salle de bal. Trois pièces :
//   le VESTIAIRE : portants de manteaux sur les deux murs, le comptoir et ses tickets
//     numérotés, une malle ; le lustre art déco (il tombe), le pot à pourboires (des pièces) ;
//   la SALLE DE BAL : miroirs, néons, la piste qui s'allume sur les temps, la scène et son
//     rideau ; la boule à facettes (elle tombe), la pyramide de coupes (des pièces) ;
//   le KIOSQUE : la conque de l'orchestre, le piano à queue, la grosse caisse, les pupitres ;
//     le projecteur pendu (il tombe sur qui passe dessous), la trompette (des pièces).
// Le rythme se voit : la piste, les néons et les projecteurs battent la mesure (p.phase).
import { R, P, L, boite, ovale, mur, quad, sol, plafond, piece, aretes, eclairer, toile, h32, NOIR, FOND } from './peinture.js';
import { hauteurChute } from '../moteur/rayon.js';

const BOIS = ['#8a5232', '#5e3420', '#3a1e12'];
const OR = ['#ffe890', '#e0b040', '#9a6a18'];
const VELOURS = ['#d0384a', '#982030', '#5e1020'];
const NEON_M = '#ff3fa4', NEON_C = '#3fe8ff';
const MANTEAUX = ['#3a3a5a', '#6a2a2a', '#2a4a3a', '#7a6a4a', '#4a2a5a', '#2a2a2a', '#8a4a2a'];

function vise(c, charge, besoin, f) { if (charge > 0) { c.globalAlpha = Math.min(1, charge / besoin) * 0.6; f(); c.globalAlpha = 1; } }
function flamme(c, x, y, t) { const v = Math.sin(t * 13 + x) > 0.3 ? 1 : 0; R(c, '#ff9a2a', x - 1, y - 4, 2, 4); R(c, '#fff2a0', x - 1 + v, y - 3, 1, 2); }
/** Ce qui bat la mesure : 1 juste sur le temps, puis s'éteint. */
const pouls = (p) => (p && p.phase !== undefined ? Math.max(0, 1 - p.phase * 3) : 0);
/** Un rang de manteaux pendus sur un mur de côté. */
function portant(c, cote, w0, w1, graine) {
  const a = mur(cote, w0, 0.28), b = mur(cote, w1, 0.28);
  L(c, NOIR, a[0], a[1] - 1, b[0], b[1] - 1); L(c, '#c8c8d8', a[0], a[1], b[0], b[1]);
  for (let k = 0; k < 9; k++) {
    const w = w0 + (w1 - w0) * (k + 0.5) / 9, l = 0.05 * (1 - w * 0.4);
    const col = MANTEAUX[(h32(graine + k) * MANTEAUX.length) | 0];
    P(c, quad(cote, w - l, w + l, 0.3, 0.66 + h32(graine + k * 3) * 0.06), col, NOIR);
    const col0 = mur(cote, w, 0.3); R(c, '#c8c8d8', col0[0], col0[1] - 2, 1, 3);
    const bt = mur(cote, w, 0.42); R(c, OR[1], bt[0], bt[1], 1, 1);
    if (h32(graine + k * 5) > 0.6) { const ch = mur(cote, w, 0.2); ovale(c, ch[0], ch[1], 4 * (1 - w * 0.4), 2, NOIR); ovale(c, ch[0], ch[1] - 1, 3 * (1 - w * 0.4), 2, col); }
  }
}
/** Le lustre art déco : un cône de verre doré. */
function lustreDeco(c, x, y, viser) {
  x = Math.round(x);
  R(c, NOIR, x - 1, y, 3, 6);
  P(c, [[x - 14, y + 16], [x + 14, y + 16], [x + 6, y + 5], [x - 6, y + 5]], OR[1], NOIR);
  for (let k = -2; k <= 2; k++) L(c, OR[0], x + k * 2, y + 6, x + k * 5, y + 15);
  R(c, '#fff6c8', x - 10, y + 16, 20, 2);
  if (viser > 0) { c.globalAlpha = Math.min(1, viser) * 0.6; P(c, [[x - 14, y + 16], [x + 14, y + 16], [x + 6, y + 5], [x - 6, y + 5]], '#ffffff'); c.globalAlpha = 1; }
}

// ———————————————————————————— le vestiaire ————————————————————————————
export const VESTIAIRE = {
  peindre() {
    const { t, c } = toile();
    const MUR = '#5a1e24', MUR_M = '#7a2a30';
    piece(c, { plafond: '#2a1418', sol: '#2a2028', murG: MUR, murD: MUR, fond: MUR });
    // la tenture rouge à chevrons d'or (art déco)
    for (let x = FOND.x0; x < FOND.x1; x += 12) for (let y = FOND.y0 + 4; y < 82; y += 12) { L(c, MUR_M, x, y + 6, x + 6, y); L(c, MUR_M, x + 6, y, x + 12, y + 6); }
    R(c, OR[1], FOND.x0, 82, FOND.x1 - FOND.x0, 2);
    R(c, '#2a1014', FOND.x0, 84, FOND.x1 - FOND.x0, FOND.y1 - 84);
    for (const cote of [-1, 1]) {
      P(c, quad(cote, 0, 1, 0.62, 1), '#2a1014'); const a = mur(cote, 0, 0.62), b = mur(cote, 1, 0.62); L(c, OR[1], a[0], a[1], b[0], b[1]);
      portant(c, cote, 0.12, 0.86, cote > 0 ? 50 : 10);
    }
    // le sol en damier noir et or, en losanges
    for (let j = 0; j < 7; j++) for (let i = 0; i < 12; i++) {
      if ((i + j) & 1) continue;
      const u0 = -1 + i / 6, u1 = -1 + (i + 1) / 6, w0 = j / 7, w1 = (j + 1) / 7;
      P(c, [sol(u0, w0), sol(u1, w0), sol(u1, w1), sol(u0, w1)], '#3a3040');
    }
    // le comptoir au fond, le tableau des tickets derrière, la sonnette
    boite(c, 104, 40, 112, 36, BOIS);
    R(c, '#1a0e08', 107, 43, 106, 30);
    for (let j = 0; j < 3; j++) for (let k = 0; k < 10; k++) {
      const x = 111 + k * 10, y = 46 + j * 9;
      R(c, '#c8c8d8', x + 2, y, 1, 2);
      if (h32(j * 10 + k) > 0.3) { R(c, NOIR, x, y + 2, 6, 5); R(c, '#f4ecd8', x + 1, y + 3, 4, 3); R(c, '#e8203a', x + 2, y + 4, 2, 1); }
    }
    boite(c, 96, 88, 128, 8, ['#a8683e', '#7a4628', '#4e2a18']); boite(c, 100, 96, 120, 22, BOIS);
    for (let x = 108; x < 216; x += 18) R(c, OR[2], x, 100, 10, 14);
    ovale(c, 196, 86, 4, 2, NOIR); ovale(c, 196, 85, 3, 2, OR[1]); R(c, NOIR, 196, 81, 1, 2);
    // le porte-parapluies à gauche, devant
    boite(c, 32, 138, 22, 36, ['#7a7e90', '#4a4e60', '#2a2e3a']);
    for (const [x, col] of /** @type {[number, string][]} */ ([[36, '#2a2a2a'], [42, '#8a2a2a'], [48, '#2a4a8a']])) { L(c, NOIR, x, 138, x - 2, 112); L(c, col, x + 1, 138, x - 1, 113); P(c, [[x - 8, 116], [x + 4, 116], [x - 2, 108]], col, NOIR); }
    // la malle au premier plan à droite (son couvercle est peint à part)
    boite(c, 236, 146, 64, 32, ['#9a6a3a', '#6e4626', '#462a16']);
    for (const x of [250, 286]) R(c, OR[2], x, 146, 3, 32);
    R(c, OR[1], 266, 150, 6, 6);
    aretes(c, '#120608');
    eclairer(t, {
      amb: [0.42, 0.38, 0.42],
      sources: [
        { x: 160, y: 30, r: 140, ry: 0.85, f: 0.85, c: [1.25, 0.95, 0.6] },
        { x: 160, y: 96, r: 60, f: 0.3, c: [1.1, 0.9, 0.6] },
      ],
    });
    return t;
  },
  /** @param {CanvasRenderingContext2D} c @param {any} s @param {number} t */
  animer(c, s, t) {
    // les portants : les manteaux s'agitent quand quelque chose s'y cache
    for (const [k, cote] of [['portantG', -1], ['portantD', 1]]) {
      if (s.alerte[k] <= 0) continue;
      const p = mur(cote, 0.5, 0.45), d = ((t * 24) | 0) & 1 ? 2 : -2;
      c.globalAlpha = 0.5; ovale(c, p[0] + d, p[1], 16, 22, '#c8ff8a'); c.globalAlpha = 1;
    }
    // derrière le comptoir : les tickets s'envolent
    if (s.alerte.comptoir > 0 || s.ouvert.comptoir > 0) for (let k = 0; k < 6; k++) {
      const ph = ((t * 1.5 + k / 6) % 1), x = 120 + k * 16 + Math.sin(ph * 8 + k) * 6, y = 84 - ph * 40;
      R(c, NOIR, x - 1, y - 1, 6, 5); R(c, '#f4ecd8', x, y, 4, 3);
    }
    if (s.alerte.comptoir > 0) { c.globalAlpha = 0.45; R(c, '#c8ff8a', 100, 92, 120, 3); c.globalAlpha = 1; }
    // la malle : le couvercle saute
    const sm = s.alerte.malle > 0 ? Math.abs(Math.sin(t * 22)) * 4 : s.ouvert.malle * 14;
    boite(c, 234, 138 - sm, 68, 10, ['#b07a4a', '#8a5a32', '#5a3a1e']); R(c, OR[2], 250, 138 - sm, 3, 10); R(c, OR[2], 286, 138 - sm, 3, 10);
    if (s.alerte.malle > 0) { c.globalAlpha = 0.5; R(c, '#c8ff8a', 236, 146, 64, 2); c.globalAlpha = 1; }
    // le pot à pourboires sur le comptoir
    const pb = s.objets.pourboire;
    if (!pb.fait) {
      R(c, NOIR, 117, 76, 14, 13); R(c, '#9ad0e8', 118, 77, 12, 11); R(c, '#e0c040', 119, 82, 10, 6); R(c, '#fff6a0', 120, 82, 3, 1); R(c, '#ffffff', 119, 78, 1, 5);
      vise(c, pb.charge, pb.besoin, () => R(c, '#ffffff', 118, 77, 12, 11));
    }
    // le lustre art déco
    const lu = s.objets.lustre;
    if (!lu.fini) {
      const y = Math.round(hauteurChute(lu)), ba = lu.chute ? 0 : Math.sin(t * 1.2) * 1.2;
      if (!lu.chute) L(c, '#3a3a46', 160, 0, 160 + ba, y);
      lustreDeco(c, 160 + ba, y, lu.charge / lu.besoin);
    }
  },
};

// ———————————————————————————— la salle de bal ————————————————————————————
export const BAL = {
  peindre() {
    const { t, c } = toile();
    piece(c, { plafond: '#150c26', sol: '#1e1236', murG: '#5a6890', murD: '#5a6890', fond: '#2a1a40' });
    // les miroirs des murs de côté, entre des pilastres d'or
    for (const cote of [-1, 1]) {
      for (let k = 0; k < 5; k++) {
        const w0 = 0.04 + k * 0.2, w1 = w0 + 0.16;
        P(c, quad(cote, w0, w1, 0.14, 0.78), '#5a6890', NOIR);
        for (let q = 0; q < 2; q++) { const a = mur(cote, w0 + 0.02 + q * 0.06, 0.74), b = mur(cote, w0 + 0.08 + q * 0.06, 0.18); L(c, '#c8d6ff', a[0], a[1], b[0], b[1]); }
        P(c, quad(cote, w1, w1 + 0.04, 0.06, 1), OR[1], NOIR);
      }
      P(c, quad(cote, 0, 1, 0.78, 1), '#2a1a40'); const a = mur(cote, 0, 0.78), b = mur(cote, 1, 0.78); L(c, OR[1], a[0], a[1], b[0], b[1]);
    }
    // au fond : la scène, son cadre doré (le rideau est peint à part)
    boite(c, 104, 36, 112, 72, OR);
    R(c, '#0a0610', 108, 40, 104, 64);
    boite(c, 96, 104, 128, 14, ['#6a3a7a', '#4a2a5a', '#2a1a3a']);
    for (let x = 100; x < 222; x += 10) R(c, OR[2], x, 108, 6, 2);
    // deux palmiers en pot, de part et d'autre de la scène
    for (const x of [86, 234]) {
      boite(c, x - 7, 100, 14, 18, OR); R(c, '#3a2a1a', x - 1, 74, 2, 26);
      for (const [dx, dy] of [[-12, -4], [12, -3], [-8, 6], [9, 6], [0, -10]]) for (let k = 0; k < 12; k++) { const f = k / 12; R(c, k & 1 ? '#3a8a3a' : '#2a6a2a', x + dx * f, 76 + dy * f + Math.sin(f * 3) * 2, 3, 2); }
    }
    // la piste : des dalles qui s'allument (peintes à part sur les temps), leurs joints
    for (let j = 0; j < 7; j++) { const a = sol(-1, j / 7), b = sol(1, j / 7); L(c, '#0e0818', a[0], a[1], b[0], b[1]); }
    for (let k = -6; k <= 6; k++) { const a = sol(k / 6, 0), b = sol(k / 6, 1); L(c, '#0e0818', a[0], a[1], b[0], b[1]); }
    // la table des coupes, au premier plan à droite
    boite(c, 248, 148, 52, 6, ['#ffffff', '#e4e2ee', '#a8a4bc']); R(c, '#e4e2ee', 250, 154, 48, 26);
    aretes(c, '#0a0614');
    eclairer(t, {
      amb: [0.5, 0.46, 0.6],
      sources: [
        { x: 160, y: 70, r: 110, ry: 0.8, f: 0.6, c: [1.2, 0.8, 1.1] },
        { x: 160, y: 150, r: 120, ry: 0.5, f: 0.4, c: [0.8, 0.9, 1.3] },
      ],
    });
    return t;
  },
  /** @param {CanvasRenderingContext2D} c @param {any} s @param {number} t @param {any} p */
  animer(c, s, t, p) {
    const k = pouls(p), n = p ? p.nTemps || 0 : 0;
    // la piste qui s'allume sur les temps
    for (let j = 0; j < 7; j++) for (let i = 0; i < 12; i++) {
      const hv = h32(i * 73 + j * 19 + n * 31);
      if ((hv * 4 | 0) !== 0) continue;
      const u0 = -1 + i / 6, u1 = -1 + (i + 1) / 6, w0 = j / 7, w1 = (j + 1) / 7;
      c.globalAlpha = 0.35 + k * 0.55;
      P(c, [sol(u0 + 0.01, w0 + 0.01), sol(u1 - 0.01, w0 + 0.01), sol(u1 - 0.01, w1 - 0.01), sol(u0 + 0.01, w1 - 0.01)], [NEON_M, NEON_C, '#ffd34a', '#9a5cff'][(hv * 16 | 0) & 3]);
    }
    c.globalAlpha = 1;
    // les néons le long du plafond
    for (const [cote, col] of [[-1, NEON_M], [1, NEON_C]]) { const a = mur(cote, 0, 0.1), b = mur(cote, 1, 0.1); c.globalAlpha = 0.6 + k * 0.4; L(c, col, a[0], a[1], b[0], b[1]); L(c, col, a[0], a[1] + 1, b[0], b[1] + 1); c.globalAlpha = 1; }
    R(c, n & 1 ? NEON_M : NEON_C, 108, 37, 104, 2);
    // le rideau de scène : il s'agite, puis s'écarte
    const or = s.ouvert.rideau, tr = s.alerte.rideau > 0 ? Math.sin(t * 30) * 2 : 0, lw = Math.round(52 * (1 - or * 0.7));
    for (const [x0, sens] of [[108, 1], [212 - lw, -1]]) {
      R(c, VELOURS[1], x0, 40, lw, 64);
      for (let x = 0; x < lw; x += 5) R(c, (x / 5) & 1 ? VELOURS[2] : VELOURS[0], x0 + x + (sens > 0 ? tr : -tr), 40, 2, 64);
    }
    R(c, VELOURS[0], 108, 40, 104, 6); for (let x = 108; x < 212; x += 8) ovale(c, x + 4, 46, 4, 2, VELOURS[1]);
    if (s.alerte.rideau > 0) { c.globalAlpha = 0.45; R(c, '#c8ff8a', 108, 100, 104, 3); c.globalAlpha = 1; }
    // un miroir qui se trouble
    for (const [kk, cote] of [['miroirG', -1], ['miroirD', 1]]) {
      if (s.alerte[kk] <= 0) continue;
      c.globalAlpha = 0.5 + Math.sin(t * 25) * 0.3; P(c, quad(cote, 0.44, 0.6, 0.16, 0.76), '#c8f0ff'); c.globalAlpha = 1;
    }
    // la trappe de la piste
    const op = s.ouvert.piste, ap = s.alerte.piste;
    if (ap > 0 || op > 0) {
      const q = [sol(-0.14, 0.22), sol(0.14, 0.22), sol(0.14, 0.42), sol(-0.14, 0.42)];
      P(c, q, op > 0 ? '#05030a' : '#2a1a40', NOIR);
      if (ap > 0) { c.globalAlpha = 0.5 + Math.sin(t * 20) * 0.3; P(c, q, '#c8ff8a'); c.globalAlpha = 1; }
    }
    // la pyramide de coupes (visée, elle s'écroule : des pièces)
    const co = s.objets.coupes;
    if (!co.fait) {
      for (const [r, n2] of [[0, 4], [1, 3], [2, 2], [3, 1]]) for (let q = 0; q < n2; q++) {
        const x = 256 + q * 10 + r * 5, y = 140 - r * 9;
        R(c, NOIR, x - 1, y - 1, 8, 7); R(c, '#e8f4ff', x, y, 6, 4); R(c, '#ffe890', x + 1, y + 1, 4, 2); R(c, '#c8d8e8', x + 2, y + 4, 2, 3);
      }
      vise(c, co.charge, co.besoin, () => R(c, '#ffffff', 254, 112, 44, 36));
    }
    // la boule à facettes (elle tourne, ses reflets courent sur les murs)
    const bo = s.objets.boule;
    if (!bo.fini) {
      const y = Math.round(hauteurChute(bo));
      if (!bo.chute) { R(c, NOIR, 159, 0, 3, y); R(c, '#7a7a86', 160, 0, 1, y); }
      ovale(c, 160, y + 9, 10, 10, NOIR); ovale(c, 160, y + 9, 9, 9, '#9aa0b8');
      for (let a = 0; a < 6; a++) for (let b = 0; b < 4; b++) { const v = h32(a * 7 + b + ((t * 6) | 0)); R(c, v > 0.6 ? '#ffffff' : v > 0.3 ? '#c8d0e8' : '#6a7088', 153 + a * 2.4, y + 2 + b * 3.6, 2, 2); }
      if (!bo.chute) for (let q = 0; q < 10; q++) { const a = t * 0.8 + q * 0.63, x = 160 + Math.cos(a) * 150, yy = 60 + Math.sin(a * 1.7) * 40; c.globalAlpha = 0.5; R(c, '#ffffff', x, yy, 2, 2); c.globalAlpha = 1; }
      vise(c, bo.charge, bo.besoin, () => ovale(c, 160, y + 9, 9, 9, '#ffffff'));
    }
  },
};

// ———————————————————————————— le kiosque ————————————————————————————
export const KIOSQUE = {
  peindre() {
    const { t, c } = toile();
    piece(c, { plafond: '#120a1c', sol: '#3a2418', murG: '#2a1a3a', murD: '#2a1a3a', fond: '#1a1028' });
    // la conque de l'orchestre au fond : des arcs de bois qui rentrent
    c.save(); c.beginPath(); c.rect(FOND.x0, FOND.y0, FOND.x1 - FOND.x0, FOND.y1 - FOND.y0); c.clip();
    for (let k = 0; k < 6; k++) {
      const m = k * 7;
      ovale(c, 160, 118, 92 - m, 84 - m, k & 1 ? '#5a3a20' : '#7a4e2a');
    }
    ovale(c, 160, 118, 48, 44, '#2a1a10');
    c.restore();
    R(c, '#1a1028', FOND.x0, FOND.y1, FOND.x1 - FOND.x0, 4);
    // l'estrade : des planches, une marche
    P(c, [[80, 118], [240, 118], [262, 132], [58, 132]], '#6e4626', NOIR);
    for (let k = 0; k < 8; k++) L(c, '#462a16', 80 + k * 20, 118, 58 + k * 26, 132);
    R(c, '#462a16', 58, 132, 204, 4);
    // les murs de côté : des rideaux de velours violet, des appliques
    for (const cote of [-1, 1]) {
      for (let k = 0; k < 14; k++) P(c, quad(cote, k / 14, (k + 1) / 14, 0, 1), k & 1 ? '#3a1a4a' : '#4a2a5a');
      for (const w of [0.3, 0.75]) { const p = mur(cote, w, 0.34); R(c, NOIR, p[0] - 2, p[1] - 1, 4, 7); R(c, OR[1], p[0] - 1, p[1], 2, 5); }
    }
    // à droite, la porte des coulisses (sur le mur), son panneau
    P(c, quad(1, 0.38, 0.6, 0.2, 1), NOIR); P(c, quad(1, 0.4, 0.58, 0.23, 0.99), '#5a3420');
    const pa = mur(1, 0.49, 0.32); R(c, NOIR, pa[0] - 6, pa[1] - 3, 12, 6); R(c, '#f4ecd8', pa[0] - 5, pa[1] - 2, 10, 4);
    // le parquet
    for (let k = -12; k <= 12; k++) { const a = sol(k / 6, 0), b = sol(k / 6, 1); L(c, '#2a160e', a[0], a[1], b[0], b[1]); }
    // le piano à queue, à gauche de l'estrade (son couvercle est peint à part)
    P(c, [[70, 100], [128, 98], [134, 110], [70, 114]], NOIR);
    P(c, [[72, 101], [126, 99], [131, 109], [72, 112]], '#1a1a22');
    R(c, '#f4f4f4', 74, 108, 40, 3); for (let x = 75; x < 114; x += 3) R(c, NOIR, x, 108, 1, 2);
    for (const x of [76, 122]) R(c, NOIR, x, 112, 3, 14);
    // la grosse caisse à droite (sa peau est peinte à part)
    ovale(c, 222, 106, 17, 17, NOIR); ovale(c, 222, 106, 16, 16, '#c8303a');
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; R(c, OR[1], 222 + Math.cos(a) * 15, 106 + Math.sin(a) * 15, 2, 2); }
    // les pupitres et les chaises, au milieu
    for (const x of [140, 160, 180]) { R(c, NOIR, x - 1, 100, 2, 16); P(c, [[x - 8, 92], [x + 8, 92], [x + 6, 102], [x - 6, 102]], '#2a2a32', NOIR); R(c, '#f4ecd8', x - 5, 94, 10, 6); }
    // un fauteuil au premier plan à gauche, une chaise où dort la trompette à droite
    boite(c, 238, 150, 40, 6, ['#a8683e', '#7a4628', '#4e2a18']); R(c, NOIR, 242, 156, 3, 24); R(c, NOIR, 271, 156, 3, 24);
    aretes(c, '#08040e');
    eclairer(t, {
      amb: [0.4, 0.36, 0.48],
      sources: [
        { x: 160, y: 96, r: 100, ry: 0.8, f: 0.8, c: [1.25, 1.0, 0.6] },
        { x: 70, y: 40, r: 70, f: 0.3, c: [1.0, 0.8, 1.2] }, { x: 250, y: 40, r: 70, f: 0.3, c: [1.0, 0.8, 1.2] },
      ],
    });
    return t;
  },
  /** @param {CanvasRenderingContext2D} c @param {any} s @param {number} t @param {any} p */
  animer(c, s, t, p) {
    const k = pouls(p);
    // les faisceaux qui battent la mesure
    for (const [x0, col] of /** @type {[number, string][]} */ ([[100, '#ff8ad0'], [220, '#8ad8ff']])) { c.globalAlpha = 0.08 + k * 0.12; P(c, [[x0, 0], [x0 + 8, 0], [160 + (x0 - 160) * 0.3 + 30, 132], [160 + (x0 - 160) * 0.3 - 30, 132]], col); c.globalAlpha = 1; }
    // le couvercle du piano qui claque
    const op = s.ouvert.piano, ap = s.alerte.piano > 0 ? Math.abs(Math.sin(t * 22)) * 4 : 0, lv = ap + op * 16;
    P(c, [[72, 100 - lv], [126, 98 - lv * 0.4], [131, 101], [72, 101]], '#22222c', NOIR);
    if (s.alerte.piano > 0) { c.globalAlpha = 0.5; R(c, '#c8ff8a', 72, 106, 54, 2); c.globalAlpha = 1; }
    // la peau de la grosse caisse qui vibre, puis se déchire
    const ac = s.alerte.caisse, oc = s.ouvert.caisse;
    ovale(c, 222, 106, 12 + (ac > 0 ? Math.sin(t * 40) : 0), 12, oc > 0.2 ? '#0a0610' : '#f4ecd8');
    // deux baguettes croisées sur la peau
    if (oc <= 0.2) { L(c, '#8a5232', 214, 98, 230, 114); L(c, '#8a5232', 230, 98, 214, 114); ovale(c, 214, 98, 2, 2, '#f4ecd8'); ovale(c, 230, 98, 2, 2, '#f4ecd8'); }
    if (ac > 0) { c.globalAlpha = 0.45; ovale(c, 222, 106, 14, 14, '#c8ff8a'); c.globalAlpha = 1; }
    // les partitions qui s'envolent des pupitres
    if (s.alerte.pupitres > 0 || s.ouvert.pupitres > 0) for (let q = 0; q < 5; q++) { const ph = (t * 1.2 + q / 5) % 1; R(c, '#f4ecd8', 140 + q * 10 + Math.sin(ph * 7) * 8, 92 - ph * 40, 6, 4); }
    if (s.alerte.pupitres > 0) { c.globalAlpha = 0.45; R(c, '#c8ff8a', 132, 112, 56, 3); c.globalAlpha = 1; }
    // la porte des coulisses : de la lumière sous la porte
    if (s.alerte.coulisse > 0) { c.globalAlpha = 0.6; P(c, quad(1, 0.4, 0.58, 0.95, 0.99), '#fff2a0'); c.globalAlpha = 1; }
    if (s.ouvert.coulisse > 0) P(c, quad(1, 0.4, 0.58, 0.23, 0.99), '#05030a');
    // les appliques
    for (const cote of [-1, 1]) for (const w of [0.3, 0.75]) { const q = mur(cote, w, 0.34); flamme(c, Math.round(q[0]), Math.round(q[1]) - 1, t); }
    // la trompette posée sur la chaise (visée : des pièces)
    const tr = s.objets.trompette;
    if (!tr.fait) {
      R(c, NOIR, 240, 143, 30, 6); R(c, OR[1], 241, 144, 22, 3); R(c, OR[0], 241, 144, 22, 1);
      P(c, [[262, 140], [272, 136], [272, 154], [262, 150]], OR[1], NOIR);
      for (const x of [248, 252, 256]) R(c, OR[2], x, 141, 2, 3);
      vise(c, tr.charge, tr.besoin, () => R(c, '#ffffff', 240, 136, 33, 18));
    }
    // le projecteur pendu à la herse
    const pr = s.objets.projecteur;
    if (!pr.fini) {
      const y = Math.round(hauteurChute(pr)), ba = pr.chute ? 0 : Math.sin(t * 1.4) * 1;
      if (!pr.chute) { L(c, NOIR, 160, 0, 160 + ba, y); R(c, '#3a3a46', 120, 8, 80, 3); }
      const x = Math.round(160 + ba);
      boite(c, x - 8, y, 16, 12, ['#5a5a6e', '#33333f', '#1c1c24']); ovale(c, x, y + 12, 6, 3, '#fff6c8');
      c.globalAlpha = 0.1 + k * 0.08; P(c, [[x - 6, y + 12], [x + 6, y + 12], [x + 30, y + 90], [x - 30, y + 90]], '#fff6c8'); c.globalAlpha = 1;
      vise(c, pr.charge, pr.besoin, () => R(c, '#ffffff', x - 8, y, 16, 12));
    }
  },
};
