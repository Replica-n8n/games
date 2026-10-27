// Le salon : cheminée et miroir au fond, armoire à droite du fond, horloge à gauche,
// fenêtre à la lune sur le mur de gauche, porte vers la cuisine sur le mur de droite,
// lustre au plafond, tapis rouge et guéridon au vase. Quatre cachettes : l'armoire,
// la fenêtre, la cheminée, le miroir.
import { R, P, L, boite, ovale, mur, quad, sol, plafond, piece, aretes, eclairer, toile, h32, NOIR, FOND } from './peinture.js';

const BOIS = ['#8a5232', '#5e3420', '#3a1e12'];
const BOIS_C = ['#a8683e', '#7a4628', '#4e2a18'];
const PIERRE = ['#bab2c4', '#8a8296', '#5c5468'];
const OR = ['#ffe890', '#e0b040', '#9a6a18'];
const PAPIER = '#2c4a3c', PAPIER_M = '#3c6050', PAPIER_S = '#1e3428';
const VELOURS = ['#d0384a', '#982030', '#5e1020'];

export const SALON = { peindre, animer };

function peindre() {
  const { t, c } = toile();
  piece(c, { plafond: '#2a1a2c', sol: '#5a3822', murG: PAPIER, murD: PAPIER, fond: PAPIER });

  // le plafond : des poutres qui fuient vers le fond, une traverse à mi-chemin
  for (let k = 0; k <= 6; k++) {
    const u = -1 + k / 3;
    const a = plafond(u, 0), b = plafond(u, 1);
    P(c, [[a[0] - 5, a[1]], [a[0] + 5, a[1]], [b[0] + 2, b[1]], [b[0] - 2, b[1]]], '#3e2618');
    L(c, '#56361f', a[0] - 5, a[1], b[0] - 2, b[1]);
  }
  for (const w of [0.35, 0.7]) { const a = plafond(-1, w), b = plafond(1, w); P(c, [[a[0], a[1] - 3], [b[0], b[1] - 3], [b[0], b[1] + 2], [a[0], a[1] + 2]], '#3e2618'); L(c, '#56361f', a[0], a[1] - 3, b[0], b[1] - 3); }

  // le papier peint à motif (fond et côtés), au-dessus des lambris
  const hautL = 0.62;
  for (let y = FOND.y0; y < 86; y++) for (let x = FOND.x0; x < FOND.x1; x++) {
    const mx = (x - FOND.x0) % 12, my = (y - FOND.y0) % 14;
    if (Math.abs(mx - 6) + Math.abs(my - 7) === 4) R(c, PAPIER_M, x, y, 1, 1);
    else if (mx === 6 && my === 7) R(c, PAPIER_M, x, y, 1, 1);
    if (mx === 0) R(c, PAPIER_S, x, y, 1, 1);
  }
  for (const cote of [-1, 1]) {
    for (let k = 0; k < 14; k++) {
      const w = k / 14, a = mur(cote, w, 0), b = mur(cote, w, hautL);
      L(c, PAPIER_S, a[0], a[1], b[0], b[1]);
      const m0 = mur(cote, w + 0.035, 0.1), m1 = mur(cote, w + 0.035, hautL - 0.05);
      for (let q = 0.1; q < hautL - 0.05; q += 0.09) { const p = mur(cote, w + 0.035, q); R(c, PAPIER_M, p[0] - 1, p[1], 2, 2); }
      void m0; void m1;
    }
    // les lambris de bois sous le papier peint, en panneaux
    P(c, quad(cote, 0, 1, hautL, 1), BOIS[1]);
    for (let k = 0; k < 9; k++) {
      const w0 = k / 9 + 0.02, w1 = (k + 1) / 9 - 0.02;
      P(c, quad(cote, w0, w1, hautL + 0.07, 0.93), BOIS[2]);
      const a = mur(cote, w0, hautL + 0.07), b = mur(cote, w1, hautL + 0.07);
      L(c, BOIS[0], a[0], a[1], b[0], b[1]);
    }
    const a = mur(cote, 0, hautL), b = mur(cote, 1, hautL);
    L(c, OR[1], a[0], a[1], b[0], b[1]); L(c, OR[2], a[0], a[1] + 1, b[0], b[1] + 1);
  }
  // lambris du fond
  R(c, BOIS[1], FOND.x0, 86, FOND.x1 - FOND.x0, FOND.y1 - 86);
  for (let x = FOND.x0 + 3; x < FOND.x1 - 10; x += 20) { R(c, BOIS[2], x, 90, 16, 24); R(c, BOIS[0], x, 90, 16, 1); }
  R(c, OR[1], FOND.x0, 86, FOND.x1 - FOND.x0, 1); R(c, OR[2], FOND.x0, 87, FOND.x1 - FOND.x0, 1);

  // le parquet : des lames qui fuient, des joints décalés
  for (let k = -12; k <= 12; k++) {
    const u = k / 6, a = sol(u, 0), b = sol(u, 1);
    L(c, '#3e2414', a[0], a[1], b[0], b[1]);
    for (let j = 0; j < 7; j++) {
      const w = (j + (k & 1 ? 0.5 : 0)) / 7, p0 = sol(u, w), p1 = sol(u + 1 / 6, w);
      L(c, '#3e2414', p0[0], p0[1], p1[0], p1[1]);
    }
  }
  for (let k = -12; k < 12; k++) { const a = sol(k / 6 + 0.04, 0), b = sol(k / 6 + 0.04, 1); L(c, '#6e462a', a[0], a[1], b[0], b[1]); }
  // le tapis rouge à bordure d'or
  const T = [sol(-0.55, 0.12), sol(0.55, 0.12), sol(0.55, 0.92), sol(-0.55, 0.92)];
  P(c, T, '#7a1a2a', NOIR);
  const T2 = [sol(-0.47, 0.2), sol(0.47, 0.2), sol(0.47, 0.86), sol(-0.47, 0.86)];
  P(c, T2, '#5a1020', OR[1]);
  const T3 = [sol(-0.3, 0.36), sol(0.3, 0.36), sol(0.3, 0.74), sol(-0.3, 0.74)];
  P(c, T3, '#7a1a2a', OR[2]);
  const mil = sol(0, 0.55); ovale(c, mil[0], mil[1], 10, 3, OR[2]); ovale(c, mil[0], mil[1], 6, 2, '#a02838');

  // la fenêtre du mur de gauche : rideaux de velours, lune, croisillons
  const F = quad(-1, 0.22, 0.6, 0.1, 0.5);
  P(c, quad(-1, 0.2, 0.62, 0.08, 0.52), NOIR);
  P(c, F, '#1a2850');
  for (let k = 0; k < 18; k++) { const p = mur(-1, 0.24 + h32(k * 7) * 0.34, 0.12 + h32(k * 13) * 0.36); R(c, h32(k) > 0.6 ? '#ffffff' : '#8aa0d8', p[0], p[1], 1, 1); }
  const lune = mur(-1, 0.36, 0.22); ovale(c, lune[0], lune[1], 7, 8, '#dce8ff'); ovale(c, lune[0] + 2, lune[1] - 1, 5, 6, '#f4f8ff'); ovale(c, lune[0] - 3, lune[1] + 2, 1.5, 1.5, '#b8c8ec');
  const m1 = mur(-1, 0.41, 0.1), m2 = mur(-1, 0.41, 0.5); L(c, BOIS[2], m1[0], m1[1], m2[0], m2[1]); L(c, BOIS[2], m1[0] + 1, m1[1], m2[0] + 1, m2[1]);
  const m3 = mur(-1, 0.22, 0.3), m4 = mur(-1, 0.6, 0.3); L(c, BOIS[2], m3[0], m3[1], m4[0], m4[1]);
  const ap = mur(-1, 0.2, 0.52), aq = mur(-1, 0.62, 0.52); P(c, [ap, aq, [aq[0], aq[1] + 3], [ap[0], ap[1] + 4]], BOIS_C[1], NOIR);
  for (const [w0, w1] of [[0.13, 0.27], [0.55, 0.69]]) {
    P(c, quad(-1, w0, w1, 0.04, 0.66), VELOURS[1], NOIR);
    for (let q = 0; q < 4; q++) { const ww = w0 + (w1 - w0) * (q + 0.5) / 4, a = mur(-1, ww, 0.06), b = mur(-1, ww, 0.64); L(c, q & 1 ? VELOURS[2] : VELOURS[0], a[0], a[1], b[0], b[1]); }
  }
  const tr = quad(-1, 0.1, 0.72, 0.02, 0.06); P(c, tr, OR[1], NOIR);

  // la porte vers la cuisine, sur le mur de droite
  P(c, quad(1, 0.32, 0.62, 0.16, 1), NOIR);
  P(c, quad(1, 0.34, 0.6, 0.19, 0.99), BOIS_C[1]);
  P(c, quad(1, 0.37, 0.57, 0.24, 0.55), BOIS_C[2]); P(c, quad(1, 0.37, 0.57, 0.62, 0.93), BOIS_C[2]);
  const poi = mur(1, 0.38, 0.6); ovale(c, poi[0], poi[1], 1.5, 2, OR[0]);
  // une applique à bougie de chaque côté de la porte
  for (const w of [0.24, 0.7]) { const p = mur(1, w, 0.3); R(c, NOIR, p[0] - 2, p[1] - 1, 4, 8); R(c, OR[1], p[0] - 1, p[1], 2, 6); R(c, '#f0e8d0', p[0] - 1, p[1] - 6, 2, 6); }

  // la cheminée de pierre, au milieu du fond
  boite(c, 116, 62, 88, 5, PIERRE);
  boite(c, 120, 67, 12, 51, PIERRE); boite(c, 188, 67, 12, 51, PIERRE);
  boite(c, 132, 67, 56, 9, PIERRE);
  boite(c, 156, 66, 8, 11, ['#d4cede', '#a69eb2', '#6e6680']);
  R(c, '#140a10', 132, 76, 56, 42);
  for (let y = 78; y < 116; y += 4) for (let x = 132 + ((y / 4) & 1) * 4; x < 186; x += 8) R(c, '#3a1414', x, y, 7, 3);
  R(c, '#0a0408', 136, 80, 48, 8);
  for (let y = 70; y < 118; y += 8) { R(c, PIERRE[2], 120, y, 12, 1); R(c, PIERRE[2], 188, y, 12, 1); }
  // les chenets et les bûches
  R(c, NOIR, 140, 106, 40, 8); boite(c, 141, 107, 38, 5, ['#8a5a3a', '#5e3a22', '#3a2214'], false);
  ovale(c, 142, 109, 2, 3, '#c89a6a'); ovale(c, 178, 109, 2, 3, '#c89a6a');
  boite(c, 138, 112, 3, 6, ['#6a6a7a', '#3a3a46', '#22222a']); boite(c, 179, 112, 3, 6, ['#6a6a7a', '#3a3a46', '#22222a']);
  boite(c, 112, 117, 96, 4, PIERRE);

  // le miroir doré au-dessus de la cheminée
  boite(c, 134, 32, 52, 28, OR);
  R(c, '#3a4a6e', 138, 36, 44, 20);
  for (let k = 0; k < 3; k++) L(c, '#5a6e98', 142 + k * 12, 54, 152 + k * 12, 38);
  R(c, OR[2], 158, 29, 4, 4); ovale(c, 160, 29, 3, 2, OR[0]);
  // les deux bougeoirs du manteau
  for (const x of [124, 196]) { R(c, NOIR, x - 3, 53, 6, 9); R(c, OR[1], x - 2, 58, 4, 4); R(c, OR[0], x - 1, 58, 1, 4); R(c, '#f4ecd8', x - 1, 50, 3, 8); }

  // l'horloge de parquet, à gauche du fond
  boite(c, 84, 40, 22, 6, BOIS); boite(c, 86, 46, 18, 22, BOIS);
  ovale(c, 95, 56, 7, 7, NOIR); ovale(c, 95, 56, 6, 6, '#f0e8d0');
  for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; R(c, '#5a4a3a', 95 + Math.cos(a) * 5, 56 + Math.sin(a) * 5, 1, 1); }
  L(c, NOIR, 95, 56, 95, 52); L(c, NOIR, 95, 56, 98, 57);
  boite(c, 88, 68, 14, 44, BOIS); R(c, '#1a0e08', 91, 72, 8, 32);
  boite(c, 86, 112, 18, 6, BOIS);

  // l'armoire (sans ses portes, peintes à part pour s'ouvrir)
  boite(c, 206, 40, 40, 6, BOIS); boite(c, 209, 46, 34, 68, BOIS);
  R(c, '#140a08', 211, 48, 30, 62);
  R(c, '#2a1810', 213, 50, 26, 2); for (let x = 215; x < 238; x += 5) R(c, '#3a2a20', x, 52, 1, 16);
  boite(c, 210, 114, 4, 4, BOIS); boite(c, 238, 114, 4, 4, BOIS);

  // le guéridon au premier plan, à droite
  ovale(c, 262, 160, 18, 4, '#1a0e0a');
  boite(c, 259, 138, 6, 20, BOIS);
  boite(c, 252, 156, 20, 3, BOIS);
  ovale(c, 262, 135, 31, 7, NOIR); ovale(c, 262, 134, 30, 6, BOIS[1]); ovale(c, 262, 133, 28, 4, BOIS[0]);
  ovale(c, 262, 133, 22, 3, '#f0e8e0'); ovale(c, 262, 133, 20, 2, '#d8ccc8');

  aretes(c, '#0c0610');
  eclairer(t, {
    amb: [0.38, 0.4, 0.55],
    sources: [
      { x: 160, y: 104, r: 120, ry: 0.8, f: 1.0, c: [1.25, 0.8, 0.45] },
      { x: 34, y: 62, r: 80, f: 0.55, c: [0.5, 0.65, 1.0] },
      { x: 124, y: 48, r: 34, f: 0.5, c: [1, 0.8, 0.5] }, { x: 196, y: 48, r: 34, f: 0.5, c: [1, 0.8, 0.5] },
      ...[mur(1, 0.24, 0.3), mur(1, 0.7, 0.3)].map(([x, y], k) => ({ x, y: y - 8, r: k ? 26 : 40, f: 0.5, c: [1, 0.8, 0.5] })),
    ],
  });
  return t;
}

/**
 * Ce qui bouge dans le salon : le feu, les flammes, le balancier, les portes de
 * l'armoire, l'éclair à la fenêtre, le reflet du miroir, le lustre et le vase.
 * @param {CanvasRenderingContext2D} c @param {any} s l'état de la salle @param {number} t
 */
function animer(c, s, t) {
  // le feu : des langues qui montent, vertes quand quelque chose va sortir
  const vert = s.alerte.cheminee > 0;
  const F = vert ? ['#d8ff8a', '#6ee03a', '#2c9a2a'] : ['#fff2a0', '#ff9a2a', '#d0381a'];
  for (let k = 0; k < 9; k++) {
    const x = 144 + k * 4, haut = 9 + Math.sin(t * 9 + k * 1.7) * 4 + (k > 2 && k < 7 ? 6 : 0) + (vert ? 8 : 0);
    R(c, F[2], x, 106 - haut, 4, haut); R(c, F[1], x + 1, 106 - haut * 0.7, 2, haut * 0.7); R(c, F[0], x + 1, 106 - haut * 0.35, 2, haut * 0.35);
  }
  // les flammes des bougies
  const ap = [mur(1, 0.24, 0.3), mur(1, 0.7, 0.3)].map(([x, y]) => [Math.round(x), Math.round(y) - 6]);
  for (const [x, y] of [[124, 50], [196, 50], ...ap]) {
    const v = Math.sin(t * 13 + x) > 0.3 ? 1 : 0;
    R(c, '#ff9a2a', x - 1 + v * 0, y - 4, 2, 4); R(c, '#fff2a0', x - 1 + v, y - 3, 1, 2);
  }
  // le balancier de l'horloge
  const bx = 95 + Math.sin(t * 3.2) * 3;
  L(c, '#c8a040', 95, 73, bx, 96); ovale(c, bx, 97, 2.5, 2.5, OR[1]); R(c, OR[0], bx - 1, 96, 1, 1);
  // les portes de l'armoire : elles tremblent, puis s'ouvrent en grand
  const tremble = s.alerte.armoire > 0 ? (((t * 30) | 0) & 1 ? 1 : -1) : 0;
  const o = s.ouvert.armoire;
  porte(c, 211 + tremble, 48, 15, 62, o, -1); porte(c, 226 - tremble, 48, 15, 62, o, 1);
  // le reflet qui passe dans le miroir, blanc quand quelque chose va sortir
  if (s.alerte.miroir > 0) {
    c.globalAlpha = 0.5 + Math.sin(t * 25) * 0.3; R(c, '#c8f0ff', 138, 36, 44, 20); c.globalAlpha = 1;
  } else { const rx = 138 + ((t * 18) % 70); if (rx < 180) { c.globalAlpha = 0.35; L(c, '#c8d8ff', rx, 54, rx + 8, 38); c.globalAlpha = 1; } }
  // l'éclair dans la fenêtre
  if (s.alerte.fenetre > 0 && ((t * 12) | 0) % 3 !== 0) {
    c.globalAlpha = 0.6; P(c, quad(-1, 0.22, 0.6, 0.1, 0.5), '#e8f0ff'); c.globalAlpha = 1;
    const a = mur(-1, 0.3, 0.1), b = mur(-1, 0.34, 0.25), d = mur(-1, 0.3, 0.32), e = mur(-1, 0.36, 0.48);
    L(c, '#ffffff', a[0], a[1], b[0], b[1]); L(c, '#ffffff', b[0], b[1], d[0], d[1]); L(c, '#ffffff', d[0], d[1], e[0], e[1]);
  }
  // le lustre, qui se balance doucement, ou qui tombe
  const lu = s.objets.lustre;  // chute : voir hauteurChute (moteur/rayon.js), mêmes nombres
  if (!lu.fini) {
    const chute = lu.chute || 0, y0 = 4 + chute * chute * 150, ba = lu.chute ? 0 : Math.sin(t * 1.3) * 1.5;
    if (!lu.chute) L(c, '#3a3a46', 160, 0, 160 + ba, y0 + 6);
    lustre(c, 160 + ba, y0 + 6, t, lu.charge / 0.45);
  }
  // le vase sur le guéridon
  const va = s.objets.vase;
  if (!va.fait) vase(c, 262, 116, va.charge / 0.3);
}

/** Une porte d'armoire, ouverte de 0 à 1 (elle pivote vers nous). */
function porte(c, x, y, w, h, o, sens) {
  const lw = Math.max(2, Math.round(w * (1 - o)));
  const x0 = sens < 0 ? x : x + w - lw;
  const xo = sens < 0 ? x - Math.round(o * 8) : x + w - lw + Math.round(o * 8);
  boite(c, o > 0.05 ? xo : x0, y, lw, h, BOIS_C);
  if (lw > 6) { R(c, BOIS_C[2], (o > 0.05 ? xo : x0) + 2, y + 4, lw - 4, 24); R(c, BOIS_C[2], (o > 0.05 ? xo : x0) + 2, y + 34, lw - 4, 24); }
  if (o < 0.2) R(c, OR[0], sens < 0 ? x + w - 3 : x + 2, y + 30, 1, 3);
}

/** Le lustre : une couronne d'or, six bougies. viser : il s'éclaire quand on le vise. */
function lustre(c, x, y, t, viser) {
  x = Math.round(x);
  R(c, NOIR, x - 15, y + 5, 30, 5);
  R(c, OR[1], x - 14, y + 6, 28, 3); R(c, OR[0], x - 14, y + 6, 28, 1);
  ovale(c, x, y + 12, 5, 4, NOIR); ovale(c, x, y + 12, 4, 3, OR[1]); R(c, OR[0], x - 2, y + 10, 2, 1);
  R(c, NOIR, x - 1, y, 3, 6); R(c, OR[2], x, y, 1, 6);
  for (let k = 0; k < 6; k++) {
    const bx = x - 13 + k * 5;
    R(c, '#f4ecd8', bx, y + 1, 2, 5); R(c, NOIR, bx - 1, y + 1, 1, 5);
    const v = Math.sin(t * 11 + k) > 0 ? 1 : 0;
    R(c, '#ff9a2a', bx, y - 2, 2, 3); R(c, '#fff2a0', bx + v * 0, y - 1, 1, 1);
  }
  if (viser > 0) { c.globalAlpha = Math.min(1, viser) * 0.6; R(c, '#ffffff', x - 14, y + 6, 28, 3); c.globalAlpha = 1; }
}

/** Le vase de porcelaine bleue. */
function vase(c, x, y, viser) {
  ovale(c, x, y + 10, 7, 8, NOIR); ovale(c, x, y + 10, 6, 7, '#3a6ad0');
  ovale(c, x - 2, y + 8, 2, 4, '#8ab8ff');
  R(c, NOIR, x - 4, y - 1, 8, 5); R(c, '#3a6ad0', x - 3, y, 6, 4); R(c, '#8ab8ff', x - 3, y, 2, 1);
  for (let k = 0; k < 3; k++) R(c, '#f0f4ff', x - 3 + k * 3, y + 11, 1, 1);
  R(c, '#e0e8ff', x - 5, y + 13, 10, 1);
  if (viser > 0) { c.globalAlpha = Math.min(1, viser) * 0.6; ovale(c, x, y + 10, 6, 7, '#ffffff'); c.globalAlpha = 1; }
}
