// La cuisine : la grande cuisinière de fonte au fond (le four et la marmite),
// le vaisselier à gauche, la fenêtre et l'évier à droite, des étagères de bocaux
// sur les côtés, des casseroles pendues au plafond, le carrelage noir et blanc.
// Quatre cachettes : le four, la marmite, le vaisselier, la fenêtre.
import { R, P, L, boite, ovale, mur, quad, sol, plafond, piece, aretes, eclairer, toile, h32, NOIR, FOND } from './peinture.js';

const FONTE = ['#5a5a6e', '#33333f', '#1c1c24'];
const LAITON = ['#ffe890', '#d0a040', '#8a5a18'];
const CUIVRE = ['#ffb07a', '#d0703a', '#8a3a1a'];
const BOIS = ['#9a6a3a', '#6e4626', '#462a16'];
const ENDUIT = '#8a6a44', ENDUIT_S = '#6e5234';
const FAIENCE = ['#f4f0e0', '#d8d2bc', '#a8a08a'];

export const CUISINE = { peindre, animer };

function peindre() {
  const { t, c } = toile();
  piece(c, { plafond: '#2a2024', sol: '#d8d2bc', murG: ENDUIT, murD: ENDUIT, fond: ENDUIT });

  // le plafond : une grosse poutre en travers, d'où pendent les casseroles
  for (let k = 0; k <= 4; k++) { const a = plafond(-1 + k / 2, 0), b = plafond(-1 + k / 2, 1); L(c, '#3a2c2c', a[0], a[1], b[0], b[1]); }
  const pa = plafond(-1, 0.42), pb = plafond(1, 0.42);
  P(c, [[pa[0], pa[1] - 4], [pb[0], pb[1] - 4], [pb[0], pb[1] + 5], [pa[0], pa[1] + 5]], BOIS[1], NOIR);
  L(c, BOIS[0], pa[0], pa[1] - 3, pb[0], pb[1] - 3);
  L(c, '#3a3a46', 100, pa[1] + 6, 220, pa[1] + 6);

  // l'enduit fissuré en haut, la faïence en bas (fond et côtés)
  const hautF = 0.55;
  for (let k = 0; k < 40; k++) { const x = FOND.x0 + h32(k * 3) * 176, y = FOND.y0 + h32(k * 5) * 40; R(c, ENDUIT_S, x, y, 2, 1); }
  L(c, ENDUIT_S, 92, 32, 96, 42); L(c, ENDUIT_S, 96, 42, 94, 50); L(c, ENDUIT_S, 232, 31, 228, 38);
  const yF = 78;
  R(c, FAIENCE[1], FOND.x0, yF, FOND.x1 - FOND.x0, FOND.y1 - yF);
  for (let y = yF; y < FOND.y1; y += 6) R(c, FAIENCE[2], FOND.x0, y, FOND.x1 - FOND.x0, 1);
  for (let y = yF; y < FOND.y1; y += 6) for (let x = FOND.x0 + ((y / 6) & 1) * 3; x < FOND.x1; x += 6) R(c, FAIENCE[2], x, y, 1, 6);
  R(c, '#3a6ab0', FOND.x0, yF, FOND.x1 - FOND.x0, 2);
  for (const cote of [-1, 1]) {
    for (let k = 0; k < 30; k++) { const p = mur(cote, h32(k * 11 + cote) * 0.95, h32(k * 17) * hautF); R(c, ENDUIT_S, p[0], p[1], 2, 1); }
    P(c, quad(cote, 0, 1, hautF, 1), FAIENCE[1]);
    for (let k = 0; k < 16; k++) { const a = mur(cote, k / 16, hautF), b = mur(cote, k / 16, 1); L(c, FAIENCE[2], a[0], a[1], b[0], b[1]); }
    for (let q = hautF; q < 1; q += 0.075) { const a = mur(cote, 0, q), b = mur(cote, 1, q); L(c, FAIENCE[2], a[0], a[1], b[0], b[1]); }
    const a = mur(cote, 0, hautF), b = mur(cote, 1, hautF); L(c, '#3a6ab0', a[0], a[1], b[0], b[1]); L(c, '#3a6ab0', a[0], a[1] + 1, b[0], b[1] + 1);
    // une étagère de bocaux et de bouteilles
    for (const hq of [0.24, 0.42]) {
      P(c, quad(cote, 0.05, 0.55, hq, hq + 0.025), BOIS[1], NOIR);
      for (let k = 0; k < 6; k++) {
        const w = 0.1 + k * 0.075; if (cote < 0 && hq === 0.42 && k === 1) continue;
        const p = mur(cote, w, hq), haut = 6 + (h32(k + hq * 100) * 5 | 0), larg = 4 - (w > 0.4 ? 1 : 0);
        const col = ['#5a8a3a', '#a03a2a', '#d8c070', '#3a5a8a', '#8a5a2a', '#6a3a6a'][(k + (hq > 0.3 ? 3 : 0)) % 6];
        R(c, NOIR, p[0] - larg / 2 - 1, p[1] - haut - 1, larg + 2, haut + 1); R(c, col, p[0] - larg / 2, p[1] - haut, larg, haut); R(c, '#ffffff', p[0] - larg / 2, p[1] - haut + 1, 1, 2);
      }
    }
  }

  // le carrelage noir et blanc, en damier qui fuit
  const N = 8, PROF = 7;
  for (let j = 0; j < PROF; j++) for (let i = 0; i < N * 2; i++) {
    if ((i + j) & 1) continue;
    const u0 = -1 + i / N, u1 = -1 + (i + 1) / N, w0 = j / PROF, w1 = (j + 1) / PROF;
    P(c, [sol(u0, w0), sol(u1, w0), sol(u1, w1), sol(u0, w1)], '#2a2630');
  }

  // le vaisselier à gauche du fond
  boite(c, 78, 38, 38, 5, BOIS);
  boite(c, 80, 43, 34, 40, BOIS); R(c, '#2a1a10', 82, 45, 30, 36);
  for (const y of [56, 68, 80]) R(c, BOIS[0], 82, y, 30, 2);
  for (const [y, n] of [[46, 3], [58, 3], [70, 3]]) for (let k = 0; k < n; k++) { const x = 87 + k * 10; ovale(c, x, y + 5, 4.5, 5, NOIR); ovale(c, x, y + 5, 4, 4.5, '#e8ecf4'); ovale(c, x, y + 5, 2.5, 3, '#a8c0e0'); }
  boite(c, 78, 83, 38, 4, BOIS);
  boite(c, 80, 87, 34, 29, BOIS); boite(c, 112, 116, 0, 0, BOIS, false);
  boite(c, 80, 115, 4, 3, BOIS); boite(c, 110, 115, 4, 3, BOIS);

  // la cuisinière de fonte : hotte, plaques, four, rambarde de laiton
  P(c, [[126, 30], [194, 30], [204, 52], [116, 52]], ENDUIT_S, NOIR);
  R(c, '#5a4630', 118, 50, 84, 3);
  boite(c, 118, 74, 84, 44, FONTE);
  boite(c, 116, 72, 88, 4, FONTE);
  R(c, LAITON[1], 118, 79, 84, 2); R(c, LAITON[0], 118, 79, 84, 1);
  for (const x of [118, 200]) R(c, LAITON[2], x, 79, 2, 4);
  // la porte du four (peinte à part pour s'ouvrir) : ici son trou noir
  R(c, '#0a0608', 142, 88, 36, 24);
  // le foyer à gauche, la réserve à bois à droite
  boite(c, 122, 88, 16, 12, FONTE); for (let x = 124; x < 136; x += 3) R(c, '#0a0608', x, 90, 2, 8);
  boite(c, 182, 88, 16, 24, FONTE); R(c, LAITON[1], 188, 98, 4, 2);
  boite(c, 122, 102, 16, 10, FONTE); R(c, LAITON[1], 128, 106, 4, 2);
  boite(c, 116, 114, 88, 4, FONTE);

  // la fenêtre au-dessus de l'évier, à droite du fond
  boite(c, 206, 40, 40, 32, BOIS);
  R(c, '#1a2850', 210, 44, 32, 24);
  for (let k = 0; k < 9; k++) R(c, '#8aa0d8', 211 + h32(k * 3) * 30, 45 + h32(k * 7) * 22, 1, 1);
  ovale(c, 234, 52, 4, 4, '#dce8ff');
  R(c, BOIS[2], 225, 44, 2, 24); R(c, BOIS[2], 210, 55, 32, 2);
  boite(c, 204, 72, 44, 3, BOIS);
  // l'évier de pierre et son robinet
  boite(c, 208, 84, 36, 10, ['#cac4b8', '#9a948a', '#6a645c']); R(c, '#4a4640', 211, 85, 30, 3);
  R(c, LAITON[1], 224, 76, 2, 9); R(c, LAITON[1], 224, 76, 6, 2);
  boite(c, 210, 94, 32, 22, BOIS); R(c, BOIS[2], 225, 96, 1, 18);

  // la table de bois au premier plan, à gauche
  P(c, [[16, 140], [104, 140], [114, 150], [6, 150]], BOIS[0], NOIR);
  R(c, BOIS[1], 6, 150, 108, 4); R(c, NOIR, 6, 154, 108, 1);
  boite(c, 12, 155, 5, 25, BOIS); boite(c, 103, 155, 5, 25, BOIS);
  // un pain, un couteau, une miche de fromage sur la table
  ovale(c, 40, 142, 12, 5, NOIR); ovale(c, 40, 141, 11, 4, '#c88a3a'); for (let k = 0; k < 3; k++) L(c, '#8a5a1a', 34 + k * 5, 139, 36 + k * 5, 143);
  P(c, [[70, 146], [92, 144], [92, 146], [70, 147]], '#c8c8d8', NOIR);
  P(c, [[62, 146], [78, 146], [72, 139]], '#f0d050', NOIR);

  aretes(c, '#1a1014');
  eclairer(t, {
    amb: [0.42, 0.42, 0.5],
    sources: [
      { x: 160, y: 96, r: 90, ry: 0.9, f: 0.55, c: [1.2, 0.75, 0.4] },
      { x: 226, y: 58, r: 70, f: 0.55, c: [0.55, 0.7, 1.0] },
      { x: 160, y: 40, r: 120, ry: 0.7, f: 0.45, c: [1, 0.9, 0.7] },
    ],
  });
  return t;
}

/** Ce qui bouge dans la cuisine. @param {CanvasRenderingContext2D} c @param {any} s @param {number} t */
function animer(c, s, t) {
  // les braises du foyer
  for (let x = 124; x < 136; x += 3) { const v = (Math.sin(t * 7 + x) + 1) / 2; R(c, v > 0.5 ? '#ff9a2a' : '#d0381a', x, 95 + v * 2, 2, 3 - v * 2); }
  // la porte du four : elle tremble, puis s'abat
  const o = s.ouvert.four, tr = s.alerte.four > 0 ? (((t * 30) | 0) & 1) : 0;
  if (o < 0.5) {
    boite(c, 142, 88 - tr, 36, 24, FONTE);
    R(c, '#0a0608', 148, 93 - tr, 24, 12); R(c, '#2a1810', 149, 94 - tr, 22, 10);
    if (s.alerte.four > 0) { R(c, '#6ee03a', 149, 94 - tr, 22, 10); }
    R(c, LAITON[0], 152, 89 - tr, 16, 2);
  } else { boite(c, 142, 112, 36, 6, FONTE); R(c, LAITON[0], 152, 116, 16, 1); }
  // la marmite sur la plaque, la vapeur, le couvercle qui saute
  ovale(c, 160, 72, 16, 3, NOIR);
  boite(c, 145, 58, 30, 14, FONTE); R(c, '#4a4a5a', 147, 60, 4, 10);
  R(c, NOIR, 141, 61, 4, 4); R(c, NOIR, 175, 61, 4, 4);
  const saut = s.alerte.marmite > 0 ? Math.abs(Math.sin(t * 22)) * 4 : s.ouvert.marmite * 14;
  ovale(c, 160, 57 - saut, 17, 3, NOIR); ovale(c, 160, 56 - saut, 16, 2.5, FONTE[0]); R(c, NOIR, 158, 52 - saut, 4, 3);
  for (let k = 0; k < 4; k++) {
    const ph = (t * 0.6 + k * 0.25) % 1, x = 150 + k * 7 + Math.sin(t * 2 + k) * 3, y = 52 - ph * 20 - saut;
    c.globalAlpha = (1 - ph) * (s.alerte.marmite > 0 ? 0.9 : 0.5);
    R(c, s.alerte.marmite > 0 ? '#c8ff8a' : '#e8e8f0', x, y, 3, 3); c.globalAlpha = 1;
  }
  // les portes du bas du vaisselier
  const ov = s.ouvert.vaisselier, tv = s.alerte.vaisselier > 0 ? (((t * 30) | 0) & 1 ? 1 : -1) : 0;
  const lw = Math.max(2, Math.round(15 * (1 - ov)));
  boite(c, 82 + tv - ov * 6, 89, lw, 25, BOIS); boite(c, 112 - lw - tv + ov * 6, 89, lw, 25, BOIS);
  if (ov < 0.2) { R(c, LAITON[0], 95, 100, 1, 3); R(c, LAITON[0], 99, 100, 1, 3); }
  // l'éclair dans la fenêtre
  if (s.alerte.fenetre > 0 && ((t * 12) | 0) % 3 !== 0) { c.globalAlpha = 0.65; R(c, '#e8f0ff', 210, 44, 32, 24); c.globalAlpha = 1; L(c, '#ffffff', 214, 44, 218, 54); L(c, '#ffffff', 218, 54, 215, 58); L(c, '#ffffff', 215, 58, 220, 68); }
  // les casseroles de cuivre pendues à la poutre (elles tombent)
  for (let k = 0; k < 3; k++) {
    const ob = s.objets['casserole' + k]; if (ob.fini) continue;
    const x = 121 + k * 39, ch = ob.chute || 0, y = 22 + ch * ch * 150, ba = ob.chute ? 0 : Math.sin(t * 1.6 + k) * 1;
    if (!ob.chute) L(c, '#3a3a46', x, 13, x + ba, y - 4);
    casserole(c, x + ba, y, ob.charge / 0.3);
  }
  // le bocal de pièces sur l'étagère de gauche
  const bo = s.objets.bocal;
  if (!bo.fait) {
    const [x, y] = mur(-1, 0.175, 0.42);
    R(c, NOIR, x - 6, y - 15, 12, 15); R(c, '#9ad0e8', x - 5, y - 14, 10, 14); R(c, '#e0c040', x - 4, y - 7, 8, 6); R(c, '#fff6a0', x - 3, y - 7, 2, 1); R(c, '#fff6a0', x + 1, y - 5, 2, 1);
    R(c, '#a05a2a', x - 5, y - 16, 10, 3); R(c, '#ffffff', x - 4, y - 12, 1, 4);
    if (bo.charge > 0) { c.globalAlpha = Math.min(1, bo.charge / 0.3) * 0.6; R(c, '#ffffff', x - 5, y - 14, 10, 14); c.globalAlpha = 1; }
  }
}

function casserole(c, x, y, viser) {
  x = Math.round(x); y = Math.round(y);
  R(c, NOIR, x - 1, y - 6, 3, 6); R(c, CUIVRE[2], x, y - 6, 1, 6);
  R(c, NOIR, x + 5, y + 2, 9, 4); R(c, '#3a2214', x + 6, y + 3, 7, 2);
  ovale(c, x, y + 6, 8, 7, NOIR); ovale(c, x, y + 6, 7, 6, CUIVRE[1]); ovale(c, x - 2, y + 4, 3, 3, CUIVRE[0]); ovale(c, x + 3, y + 9, 3, 2, CUIVRE[2]);
  if (viser > 0) { c.globalAlpha = Math.min(1, viser) * 0.6; ovale(c, x, y + 6, 7, 6, '#ffffff'); c.globalAlpha = 1; }
}
