// La salle à manger : la longue table nappée qui fuit vers le fond, chaises de part
// et d'autre, candélabre et plat sous cloche ; au fond le passe-plat de la cuisine
// et le buffet ; un paysage encadré et une rangée d'assiettes aux murs.
// Quatre cachettes : sous la nappe, la cloche, le passe-plat, le buffet.
// À viser : la bouteille (le bouchon part et assomme un fantôme) et la soupière (pièces).
import { R, P, L, boite, ovale, mur, quad, sol, plafond, piece, aretes, eclairer, toile, NOIR, FOND, H } from './peinture.js';
import { TABLE, POS_MANGER } from '../contenu/salles.js';

const BOIS = ['#7a4a2a', '#52301a', '#341c0e'];
const OR = ['#ffe890', '#e0b040', '#9a6a18'];
const ARGENT = ['#ffffff', '#c8ccdc', '#7a7e94'];
const NAPPE = ['#ffffff', '#e4e2ee', '#a8a4bc'];
const TENTURE = '#5a1a2a', TENTURE_M = '#7a2a3a', TENTURE_S = '#3e0e1a';

const { pres: PRES, loin: LOIN, large: LARGE } = TABLE;
const POS = POS_MANGER, BORD = POS_MANGER.bord;

export const MANGER = { peindre, animer };

function peindre() {
  const { t, c } = toile();
  piece(c, { plafond: '#2a1622', sol: '#3e2418', murG: TENTURE, murD: TENTURE, fond: TENTURE });

  // le plafond à caissons
  for (let k = 0; k <= 4; k++) { const a = plafond(-1 + k / 2, 0), b = plafond(-1 + k / 2, 1); L(c, '#4a2a2a', a[0], a[1], b[0], b[1]); }
  for (const w of [0.3, 0.6, 0.85]) { const a = plafond(-1, w), b = plafond(1, w); L(c, '#4a2a2a', a[0], a[1], b[0], b[1]); }

  // la tenture rayée d'or au-dessus des lambris
  const hautL = 0.6;
  for (let x = FOND.x0; x < FOND.x1; x++) if ((x - FOND.x0) % 10 < 2) R(c, (x - FOND.x0) % 10 === 0 ? TENTURE_M : TENTURE_S, x, FOND.y0, 1, 54);
  for (const cote of [-1, 1]) {
    for (let k = 0; k < 18; k++) { const a = mur(cote, k / 18, 0), b = mur(cote, k / 18, hautL); L(c, k & 1 ? TENTURE_S : TENTURE_M, a[0], a[1], b[0], b[1]); }
    P(c, quad(cote, 0, 1, hautL, 1), BOIS[1]);
    for (let k = 0; k < 8; k++) { P(c, quad(cote, k / 8 + 0.02, (k + 1) / 8 - 0.02, hautL + 0.07, 0.93), BOIS[2]); }
    const a = mur(cote, 0, hautL), b = mur(cote, 1, hautL); L(c, OR[1], a[0], a[1], b[0], b[1]);
  }
  R(c, BOIS[1], FOND.x0, 84, FOND.x1 - FOND.x0, FOND.y1 - 84);
  for (let x = FOND.x0 + 4; x < FOND.x1 - 12; x += 22) { R(c, BOIS[2], x, 88, 18, 26); R(c, BOIS[0], x, 88, 18, 1); }
  R(c, OR[1], FOND.x0, 84, FOND.x1 - FOND.x0, 1);

  // le parquet en chevrons, sombre
  for (let k = -10; k <= 10; k++) { const a = sol(k / 5, 0), b = sol(k / 5, 1); L(c, '#2a160e', a[0], a[1], b[0], b[1]); }
  for (let j = 0; j < 9; j++) { const a = sol(-1, j / 9), b = sol(1, j / 9); L(c, '#2a160e', a[0], a[1], b[0], b[1]); }

  // à gauche : un paysage de montagne dans un cadre d'or
  P(c, quad(-1, 0.3, 0.62, 0.12, 0.48), NOIR);
  P(c, quad(-1, 0.32, 0.6, 0.14, 0.46), OR[1]);
  P(c, quad(-1, 0.35, 0.57, 0.18, 0.42), '#3a5a8a');
  P(c, [mur(-1, 0.35, 0.34), mur(-1, 0.43, 0.24), mur(-1, 0.5, 0.33), mur(-1, 0.54, 0.27), mur(-1, 0.57, 0.33), mur(-1, 0.57, 0.42), mur(-1, 0.35, 0.42)], '#2a4a3a');
  P(c, [mur(-1, 0.41, 0.27), mur(-1, 0.43, 0.24), mur(-1, 0.45, 0.27)], '#e8ecf4');
  // à droite : une rangée d'assiettes décoratives
  for (let k = 0; k < 4; k++) { const p = mur(1, 0.28 + k * 0.11, 0.2), r = 6.5 - k * 0.8; ovale(c, p[0], p[1], r * 0.7, r, NOIR); ovale(c, p[0], p[1], r * 0.62, r - 1, '#e8ecf4'); ovale(c, p[0], p[1], r * 0.35, r * 0.55, '#3a6ab0'); }
  // deux appliques sur chaque mur
  for (const cote of [-1, 1]) for (const w of [0.18, 0.75]) { const p = mur(cote, w, 0.36); R(c, NOIR, p[0] - 2, p[1] - 1, 4, 7); R(c, OR[1], p[0] - 1, p[1], 2, 5); R(c, '#f4ecd8', p[0] - 1, p[1] - 6, 2, 6); }

  // le passe-plat au fond (son volet est peint à part)
  boite(c, 136, 46, 48, 32, BOIS);
  R(c, '#120a08', 140, 50, 40, 24);
  R(c, '#3a2a1a', 142, 66, 36, 2);
  boite(c, 134, 77, 52, 3, BOIS);
  // le buffet à droite du fond, ses deux portes peintes à part
  boite(c, 198, 66, 48, 5, BOIS); boite(c, 200, 71, 44, 45, BOIS);
  R(c, '#140a08', 202, 74, 40, 40);
  for (let k = 0; k < 3; k++) { const x = 208 + k * 13; ovale(c, x, 62, 5, 4, NOIR); ovale(c, x, 62, 4.5, 3, ARGENT[1]); R(c, ARGENT[0], x - 2, 60, 2, 1); }
  boite(c, 202, 116, 4, 2, BOIS); boite(c, 238, 116, 4, 2, BOIS);
  // un palmier en pot à gauche du fond
  boite(c, 84, 102, 16, 16, ['#c87a4a', '#9a4a2a', '#6a2a14']);
  R(c, '#3a2a1a', 91, 70, 2, 32);
  for (const [dx, dy, l] of [[-14, -6, 1], [14, -4, 1], [-10, 6, 1], [12, 8, 1], [0, -12, 1]]) for (let k = 0; k < 14; k++) { const f = k / 14; R(c, k & 1 ? '#3a8a3a' : '#2a6a2a', 92 + dx * f, 72 + dy * f + Math.sin(f * 3) * 3 * l, 3, 2); }

  // les chaises, de part et d'autre de la table, du fond vers nous
  for (const cote of [-1, 1]) for (const w of [0.78, 0.52, 0.27]) {
    const pb = sol(cote * 0.8, w), h = 12 + (1 - w) * 26, l = 6 + (1 - w) * 12;
    const x = pb[0], y = pb[1];
    boite(c, x - l / 2, y - h * 1.6, l, h * 0.9, BOIS);
    R(c, '#8a2a3a', x - l / 2 + 2, y - h * 1.5, l - 4, h * 0.7);
  }

  // la table et sa nappe, qui fuient vers le fond
  const T = [sol(-LARGE * 0.72, LOIN), sol(LARGE * 0.72, LOIN), sol(LARGE, PRES), sol(-LARGE, PRES)];
  P(c, T, NAPPE[1], NOIR);
  for (let k = 0; k < 7; k++) { const a = sol(-LARGE * 0.72 + k * LARGE * 0.24, LOIN), b = sol(-LARGE + k * LARGE / 3, PRES); L(c, NAPPE[2], a[0], a[1], b[0], b[1]); }
  L(c, NAPPE[0], T[3][0], T[3][1], T[0][0], T[0][1]);
  // le bout de la nappe au fond, et le grand pan qui tombe devant nous (la cachette)
  const f0 = T[0], f1 = T[1];
  R(c, NAPPE[2], f0[0], f0[1], f1[0] - f0[0], 5); R(c, NOIR, f0[0], f0[1] + 5, f1[0] - f0[0], 1);
  const n0 = T[3], n1 = T[2], chute = 30;
  R(c, NOIR, n0[0] - 1, n0[1], n1[0] - n0[0] + 2, chute + 1);
  R(c, NAPPE[1], n0[0], n0[1], n1[0] - n0[0], chute);
  for (let x = n0[0] + 3; x < n1[0]; x += 7) { R(c, NAPPE[2], x, n0[1] + 2, 2, chute - 2); R(c, NAPPE[0], x + 2, n0[1] + 2, 1, chute - 2); }
  for (let x = n0[0]; x < n1[0]; x += 4) R(c, NAPPE[0], x, n0[1] + chute - 3, 2, 2);
  // un chemin de table rouge au milieu
  P(c, [sol(-0.06, LOIN), sol(0.06, LOIN), sol(0.1, PRES), sol(-0.1, PRES)], '#8a2030');
  R(c, '#8a2030', sol(-0.1, PRES)[0], n0[1], sol(0.1, PRES)[0] - sol(-0.1, PRES)[0], chute - 4);
  // assiettes et couverts le long de la table
  for (const w of [0.72, 0.5, 0.28]) for (const cote of [-1, 1]) {
    const p = sol(cote * LARGE * 0.62 * (1 - (w - PRES) * 0.35), w), r = 4 + (1 - w) * 6;
    ovale(c, p[0], p[1], r + 1, r * 0.4 + 1, NOIR); ovale(c, p[0], p[1], r, r * 0.4, '#ffffff'); ovale(c, p[0], p[1], r * 0.6, r * 0.24, '#d8dcec');
  }
  // le candélabre au milieu de la table
  const cd = POS.candelabre;
  R(c, NOIR, cd[0] - 2, cd[1] - 22, 5, 22); R(c, ARGENT[1], cd[0] - 1, cd[1] - 22, 3, 22);
  R(c, NOIR, cd[0] - 12, cd[1] - 20, 25, 3); R(c, ARGENT[1], cd[0] - 11, cd[1] - 19, 23, 1);
  for (const dx of [-11, 0, 11]) { R(c, NOIR, cd[0] + dx - 2, cd[1] - 31, 4, 11); R(c, '#f4ecd8', cd[0] + dx - 1, cd[1] - 30, 2, 10); }
  ovale(c, cd[0], cd[1], 7, 2, ARGENT[2]);

  aretes(c, '#140a10');
  eclairer(t, {
    amb: [0.5, 0.46, 0.56],
    sources: [
      { x: cd[0], y: cd[1] - 30, r: 140, ry: 0.85, f: 1.05, c: [1.25, 0.85, 0.5] },
      { x: 160, y: 60, r: 40, f: 0.35, c: [1.1, 0.8, 0.5] },
      ...[-1, 1].flatMap((cote) => [0.18, 0.75].map((w) => { const p = mur(cote, w, 0.36); return { x: p[0], y: p[1] - 6, r: 34, f: 0.5, c: [1, 0.8, 0.5] }; })),
    ],
  });
  return t;
}

/** Ce qui bouge dans la salle à manger. @param {CanvasRenderingContext2D} c @param {any} s @param {number} t */
function animer(c, s, t) {
  // les flammes du candélabre et des appliques
  const cd = POS.candelabre;
  const fl = [[cd[0] - 11, cd[1] - 31], [cd[0], cd[1] - 31], [cd[0] + 11, cd[1] - 31]];
  for (const cote of [-1, 1]) for (const w of [0.18, 0.75]) { const p = mur(cote, w, 0.36); fl.push([Math.round(p[0]), Math.round(p[1]) - 6]); }
  for (const [x, y] of fl) { const v = Math.sin(t * 13 + x) > 0.3 ? 1 : 0; R(c, '#ff9a2a', x - 1, y - 4, 2, 4); R(c, '#fff2a0', x - 1 + v, y - 3, 1, 2); }
  // le volet du passe-plat : il tremble, puis remonte
  const op = s.ouvert.passeplat, tp = s.alerte.passeplat > 0 ? (((t * 30) | 0) & 1) : 0;
  const hv = Math.round(24 * (1 - op));
  if (hv > 1) { boite(c, 140, 50 + tp, 40, hv, BOIS, false); for (let y = 52; y < 50 + hv; y += 4) R(c, BOIS[2], 141, y + tp, 38, 1); }
  if (s.alerte.passeplat > 0) { c.globalAlpha = 0.5; R(c, '#c8ff8a', 140, 74, 40, 2); c.globalAlpha = 1; }
  // les portes du buffet
  const ob = s.ouvert.buffet, tb = s.alerte.buffet > 0 ? (((t * 30) | 0) & 1 ? 1 : -1) : 0;
  const lw = Math.max(2, Math.round(20 * (1 - ob)));
  boite(c, 202 + tb - ob * 8, 74, lw, 40, BOIS); boite(c, 242 - lw - tb + ob * 8, 74, lw, 40, BOIS);
  if (ob < 0.2) { R(c, OR[0], 220, 92, 1, 4); R(c, OR[0], 223, 92, 1, 4); }
  // la cloche sur son plat, au bout de la table : elle se soulève
  const pc = POS.cloche, oc = s.ouvert.cloche, sc = s.alerte.cloche > 0 ? Math.abs(Math.sin(t * 22)) * 3 : oc * 12;
  ovale(c, pc[0], pc[1] + 1, 12, 3, NOIR); ovale(c, pc[0], pc[1], 11, 2.5, ARGENT[1]);
  ovale(c, pc[0], pc[1] - 5 - sc, 9, 7, NOIR); ovale(c, pc[0], pc[1] - 5 - sc, 8, 6, ARGENT[1]); ovale(c, pc[0] - 3, pc[1] - 8 - sc, 3, 2, ARGENT[0]);
  R(c, NOIR, pc[0] - 2, pc[1] - 14 - sc, 4, 3); R(c, ARGENT[0], pc[0] - 1, pc[1] - 13 - sc, 2, 1);
  R(c, ARGENT[1], pc[0] - 9, pc[1] - 1, 18, 1);
  // la nappe qui gonfle quand quelque chose est dessous
  const on = s.ouvert.nappe, an = s.alerte.nappe;
  if (an > 0 || on > 0) {
    const g = an > 0 ? Math.abs(Math.sin(t * 18)) * 4 : on * 8;
    const x0 = Math.round(sol(-0.36, PRES)[0]), x1 = Math.round(sol(0.36, PRES)[0]);
    for (let x = x0; x < x1; x++) { const k = Math.sin((x - x0) / (x1 - x0) * Math.PI); R(c, NAPPE[0], x, BORD + 26 - g * k, 1, 2); R(c, NOIR, x, BORD + 30 - g * k * 0.3, 1, 1); }
    if (an > 0) { c.globalAlpha = 0.5; R(c, '#c8ff8a', x0, BORD + 29, x1 - x0, 2); c.globalAlpha = 1; }
  }
  // la bouteille de champagne et la soupière
  const bo = s.objets.bouteille;
  if (!bo.fait) {
    const x = Math.round(POS.bouteille[0]), y = Math.round(POS.bouteille[1]) - 22;
    R(c, NOIR, x - 4, y + 6, 9, 16); R(c, '#1a4a2a', x - 3, y + 7, 7, 14); R(c, '#3a8a4a', x - 2, y + 8, 1, 10);
    R(c, NOIR, x - 2, y, 5, 7); R(c, '#1a4a2a', x - 1, y + 1, 3, 6); R(c, OR[1], x - 2, y - 1, 5, 3); R(c, '#f0e0b0', x - 3, y + 12, 7, 4);
    if (bo.charge > 0) { c.globalAlpha = Math.min(1, bo.charge / 0.3) * 0.6; R(c, '#ffffff', x - 3, y, 7, 21); c.globalAlpha = 1; }
  }
  const so = s.objets.soupiere;
  if (!so.fait) {
    const x = Math.round(POS.soupiere[0]), y = Math.round(POS.soupiere[1]) - 6;
    ovale(c, x, y, 10, 6, NOIR); ovale(c, x, y, 9, 5, '#f4f4fc'); ovale(c, x - 3, y - 2, 3, 2, '#ffffff');
    R(c, '#3a6ab0', x - 9, y, 18, 1); ovale(c, x, y - 5, 6, 2, NOIR); ovale(c, x, y - 5, 5, 1.5, '#e8e8f4'); R(c, NOIR, x - 1, y - 9, 3, 3);
    R(c, NOIR, x - 12, y - 2, 3, 3); R(c, NOIR, x + 10, y - 2, 3, 3);
    if (so.charge > 0) { c.globalAlpha = Math.min(1, so.charge / 0.3) * 0.6; ovale(c, x, y, 9, 5, '#ffffff'); c.globalAlpha = 1; }
  }
}
