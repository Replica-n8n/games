// Le 3e étage de l'hôtel : les combles. Trois pièces :
//   la CHAMBRE 13 : le lit à baldaquin, l'armoire, la fenêtre à la lune, la porte « 13 » ;
//     le petit lustre (il tombe), la boîte à bijoux (des pièces) ;
//   la LINGERIE : des draps étendus sur des cordes, la lessiveuse de cuivre, la chaudière,
//     les piles de linge ; la corde (elle lâche ses draps sur le milieu), le panier (des pièces) ;
//   les COMBLES : les chevrons, les toiles d'araignée, la lucarne ronde, les malles, le
//     paravent ; la lanterne pendue (elle tombe sur qui passe dessous), le vieux coffre (des pièces).
import { R, P, L, boite, ovale, mur, quad, sol, plafond, piece, aretes, eclairer, toile, h32, NOIR, FOND } from './peinture.js';
import { hauteurChute } from '../moteur/rayon.js';

const BOIS = ['#8a5232', '#5e3420', '#3a1e12'];
const OR = ['#ffe890', '#e0b040', '#9a6a18'];
const CUIVRE = ['#ffb07a', '#d0703a', '#8a3a1a'];
const DRAP = ['#ffffff', '#e4e2ee', '#a8a4bc'];
const PLANCHE = ['#6e5a46', '#5e4a38', '#4c3a2c'];

function vise(c, charge, besoin, f) { if (charge > 0) { c.globalAlpha = Math.min(1, charge / besoin) * 0.6; f(); c.globalAlpha = 1; } }
function flamme(c, x, y, t) { const v = Math.sin(t * 13 + x) > 0.3 ? 1 : 0; R(c, '#ff9a2a', x - 1, y - 4, 2, 4); R(c, '#fff2a0', x - 1 + v, y - 3, 1, 2); }
const tremble = (t, a) => (a > 0 ? (((t * 30) | 0) & 1 ? 1 : -1) : 0);
/** Une lueur verte qui dit « quelque chose va sortir d'ici ». */
function lueur(c, x, y, w, h) { c.globalAlpha = 0.45; R(c, '#c8ff8a', x, y, w, h); c.globalAlpha = 1; }

// ———————————————————————————— la chambre 13 ————————————————————————————
export const CHAMBRE = {
  peindre() {
    const { t, c } = toile();
    const PAP = '#3a4a6a', PAP_M = '#5a6a8a', PAP_S = '#2a3650';
    piece(c, { plafond: '#2a2a3a', sol: '#4a3426', murG: PAP, murD: PAP, fond: PAP });
    // le papier peint à fleurs passées, une moulure, une tache d'humidité
    for (let y = FOND.y0 + 4; y < 86; y += 10) for (let x = FOND.x0 + ((y / 10) & 1) * 6; x < FOND.x1; x += 12) { R(c, PAP_M, x, y, 2, 2); R(c, PAP_S, x + 1, y + 2, 1, 2); }
    ovale(c, 228, 40, 12, 7, '#46506a');
    for (const cote of [-1, 1]) {
      for (let k = 0; k < 30; k++) { const p = mur(cote, h32(k * 7 + cote) * 0.95, 0.05 + h32(k * 3) * 0.55); R(c, PAP_M, p[0], p[1], 2, 2); }
      P(c, quad(cote, 0, 1, 0.64, 1), '#2a2230'); const a = mur(cote, 0, 0.64), b = mur(cote, 1, 0.64); L(c, '#8a8ab0', a[0], a[1], b[0], b[1]);
    }
    R(c, '#2a2230', FOND.x0, 88, FOND.x1 - FOND.x0, FOND.y1 - 88); R(c, '#8a8ab0', FOND.x0, 88, FOND.x1 - FOND.x0, 1);
    // le parquet usé, un tapis rond
    for (let k = -12; k <= 12; k++) { const a = sol(k / 6, 0), b = sol(k / 6, 1); L(c, '#33241a', a[0], a[1], b[0], b[1]); }
    const tp = sol(0, 0.45); ovale(c, tp[0], tp[1], 60, 16, NOIR); ovale(c, tp[0], tp[1], 58, 15, '#5a2a4a'); ovale(c, tp[0], tp[1], 44, 11, '#7a3a5a'); ovale(c, tp[0], tp[1], 30, 7, '#5a2a4a');
    // à gauche, la fenêtre à la lune
    P(c, quad(-1, 0.28, 0.6, 0.12, 0.52), NOIR); P(c, quad(-1, 0.3, 0.58, 0.14, 0.5), '#1a2850');
    const lu = mur(-1, 0.42, 0.26); ovale(c, lu[0], lu[1], 6, 7, '#dce8ff'); ovale(c, lu[0] + 1, lu[1] - 1, 4, 5, '#f4f8ff');
    { const a = mur(-1, 0.44, 0.14), b = mur(-1, 0.44, 0.5); L(c, BOIS[2], a[0], a[1], b[0], b[1]); }
    for (const [w0, w1] of [[0.22, 0.31], [0.57, 0.66]]) P(c, quad(-1, w0, w1, 0.08, 0.66), '#d8d0c0', NOIR);
    // à droite, la porte de la chambre : « 13 »
    P(c, quad(1, 0.34, 0.62, 0.16, 1), NOIR); P(c, quad(1, 0.36, 0.6, 0.19, 0.99), BOIS[1]);
    const pl = mur(1, 0.48, 0.3); R(c, NOIR, pl[0] - 6, pl[1] - 4, 12, 9); R(c, OR[1], pl[0] - 5, pl[1] - 3, 10, 7);
    R(c, NOIR, pl[0] - 3, pl[1] - 2, 1, 5); R(c, NOIR, pl[0] + 0, pl[1] - 2, 3, 1); R(c, NOIR, pl[0] + 2, pl[1] - 2, 1, 5); R(c, NOIR, pl[0] + 0, pl[1], 3, 1); R(c, NOIR, pl[0] + 0, pl[1] + 2, 3, 1);
    // l'armoire à glace, à gauche du fond (sa porte est peinte à part)
    boite(c, 78, 40, 36, 6, BOIS); boite(c, 80, 46, 32, 70, BOIS); R(c, '#0a0608', 83, 49, 26, 64);
    // le lit à baldaquin au milieu du fond
    for (const x of [122, 196]) boite(c, x, 34, 4, 82, BOIS);
    boite(c, 120, 30, 82, 6, BOIS);
    boite(c, 126, 76, 68, 22, BOIS_C());
    boite(c, 124, 94, 72, 12, DRAP); R(c, '#8a6aa0', 124, 98, 72, 8); for (let x = 128; x < 194; x += 8) R(c, '#a88ac0', x, 99, 4, 6);
    ovale(c, 140, 92, 10, 4, NOIR); ovale(c, 140, 91, 9, 3, '#ffffff'); ovale(c, 180, 92, 10, 4, NOIR); ovale(c, 180, 91, 9, 3, '#ffffff');
    R(c, '#120a10', 126, 106, 68, 10);
    // la table de nuit et sa lampe à droite du lit
    boite(c, 206, 92, 22, 24, BOIS); R(c, NOIR, 216, 80, 2, 12); P(c, [[208, 80], [226, 80], [222, 70], [212, 70]], '#e8c880', NOIR);
    aretes(c, '#0e0a14');
    eclairer(t, {
      amb: [0.38, 0.4, 0.55],
      sources: [
        { x: 217, y: 76, r: 90, f: 0.8, c: [1.25, 0.95, 0.6] },
        { x: 40, y: 60, r: 80, f: 0.55, c: [0.5, 0.65, 1.0] },
      ],
    });
    return t;
  },
  /** @param {CanvasRenderingContext2D} c @param {any} s @param {number} t */
  animer(c, s, t) {
    // les rideaux du baldaquin qui ondulent, ou s'écartent
    const ab = s.alerte.baldaquin, ob = s.ouvert.baldaquin, ec = ob * 14;
    for (const [x, sens] of [[126, 1], [184, -1]]) {
      const lw = 12 - ec * 0.6;
      for (let k = 0; k < lw; k += 3) R(c, k & 2 ? '#a83a5a' : '#c84a6a', x + (sens > 0 ? k : 10 - k) + Math.sin(t * (ab > 0 ? 14 : 1.5) + k) * (ab > 0 ? 2 : 0.6), 36, 3, 52);
    }
    R(c, '#c84a6a', 124, 36, 74, 6); for (let x = 126; x < 196; x += 8) ovale(c, x + 4, 42, 4, 2, '#a83a5a');
    if (ab > 0) lueur(c, 126, 36, 68, 4);
    // sous le lit : deux yeux, puis quelque chose sort
    if (s.alerte.lit > 0) { const d = tremble(t, 1); lueur(c, 126, 106, 68, 10); R(c, '#ff3030', 150 + d, 110, 3, 2); R(c, '#ff3030', 166 + d, 110, 3, 2); }
    // l'armoire : la porte à glace tremble, puis s'ouvre
    const oa = s.ouvert.armoire, ta = tremble(t, s.alerte.armoire), lw = Math.max(2, Math.round(26 * (1 - oa)));
    boite(c, 83 + ta - oa * 10, 49, lw, 64, ['#c8d6ff', '#7a88b0', '#4a5480'], true);
    if (lw > 6) { L(c, '#ffffff', 86 + ta, 104, 96 + ta, 56); R(c, OR[0], 83 + lw - 4 + ta, 80, 1, 4); }
    if (s.alerte.armoire > 0) lueur(c, 83, 110, 26, 3);
    // la fenêtre : un éclair
    if (s.alerte.fenetre > 0 && ((t * 12) | 0) % 3 !== 0) { c.globalAlpha = 0.6; P(c, quad(-1, 0.3, 0.58, 0.14, 0.5), '#e8f0ff'); c.globalAlpha = 1; }
    // la lampe de chevet qui grésille
    if (Math.sin(t * 7) > 0.92) { c.globalAlpha = 0.5; P(c, [[208, 80], [226, 80], [222, 70], [212, 70]], NOIR); c.globalAlpha = 1; }
    // la boîte à bijoux sur la table de nuit
    const bj = s.objets.bijoux;
    if (!bj.fait) {
      boite(c, 208, 86, 12, 6, ['#d84a8a', '#a82a6a', '#6a1a4a']); R(c, OR[1], 213, 88, 2, 2);
      vise(c, bj.charge, bj.besoin, () => R(c, '#ffffff', 208, 86, 12, 6));
    }
    // le petit lustre à pampilles
    const lu = s.objets.lustre;
    if (!lu.fini) {
      const y = Math.round(hauteurChute(lu)), x = Math.round(160 + (lu.chute ? 0 : Math.sin(t * 1.3) * 1.5));
      if (!lu.chute) L(c, '#3a3a46', 160, 0, x, y);
      R(c, NOIR, x - 13, y + 5, 26, 4); R(c, OR[1], x - 12, y + 6, 24, 2);
      for (let k = 0; k < 5; k++) { const bx = x - 10 + k * 5; R(c, '#f4ecd8', bx, y + 1, 2, 5); flamme(c, bx + 1, y + 1, t + k); R(c, '#c8e8ff', bx, y + 9, 1, 3 + (k & 1) * 2); }
      vise(c, lu.charge, lu.besoin, () => R(c, '#ffffff', x - 12, y + 6, 24, 2));
    }
  },
};
function BOIS_C() { return ['#a8683e', '#7a4628', '#4e2a18']; }

// ———————————————————————————— la lingerie ————————————————————————————
export const LINGERIE = {
  peindre() {
    const { t, c } = toile();
    const CHAUX = '#a8a49a', CHAUX_S = '#8a867c';
    piece(c, { plafond: '#5a564e', sol: '#6a6258', murG: CHAUX, murD: CHAUX, fond: CHAUX });
    // la chaux écaillée, les poutres apparentes
    for (let k = 0; k < 50; k++) { const x = FOND.x0 + h32(k * 3) * 176, y = FOND.y0 + h32(k * 5) * 86; R(c, CHAUX_S, x, y, 3, 2); }
    for (const cote of [-1, 1]) for (let k = 0; k < 40; k++) { const p = mur(cote, h32(k * 11 + cote) * 0.95, h32(k * 17)); R(c, CHAUX_S, p[0], p[1], 3, 2); }
    for (let k = 0; k <= 4; k++) { const a = plafond(-1 + k / 2, 0), b = plafond(-1 + k / 2, 1); P(c, [[a[0] - 5, a[1]], [a[0] + 5, a[1]], [b[0] + 2, b[1]], [b[0] - 2, b[1]]], '#4a3a2a'); }
    // les tomettes rouges
    for (let j = 0; j < 8; j++) for (let i = 0; i < 16; i++) {
      const u0 = -1 + i / 8, u1 = -1 + (i + 1) / 8, w0 = j / 8, w1 = (j + 1) / 8;
      P(c, [sol(u0, w0), sol(u1, w0), sol(u1, w1), sol(u0, w1)], (i + j) % 3 === 0 ? '#8a4a32' : (i + j) % 3 === 1 ? '#7a3e2a' : '#6e3624', '#4a2a1a');
    }
    // les piles de linge sur des étagères, à gauche du fond
    for (let j = 0; j < 4; j++) {
      R(c, BOIS[1], 76, 52 + j * 16, 40, 2);
      for (let k = 0; k < 3; k++) for (let q = 0; q < 3; q++) R(c, ['#f4f0e8', '#d8e4f0', '#f0d8d8'][(k + j) % 3], 78 + k * 13, 49 + j * 16 - q * 3, 11, 2);
    }
    // la chaudière, à droite du fond (sa porte de foyer est peinte à part)
    boite(c, 204, 56, 38, 62, ['#5a5a6e', '#33333f', '#1c1c24']);
    R(c, '#1c1c24', 216, 30, 12, 26); R(c, NOIR, 215, 30, 1, 26);
    ovale(c, 223, 66, 7, 5, NOIR); ovale(c, 223, 66, 6, 4, '#e0d8c8'); L(c, '#e8203a', 223, 66, 226, 63);
    R(c, '#c8a040', 206, 110, 34, 2);
    // la lessiveuse de cuivre, au premier plan à gauche (son couvercle est peint à part)
    boite(c, 34, 140, 66, 36, CUIVRE); ovale(c, 67, 140, 33, 6, NOIR); ovale(c, 67, 140, 32, 5, CUIVRE[2]);
    for (const x of [44, 90]) R(c, CUIVRE[2], x, 146, 3, 26);
    // la planche à repasser, à droite devant
    P(c, [[220, 140], [300, 136], [304, 142], [222, 146]], '#e8e0d0', NOIR); L(c, NOIR, 240, 146, 252, 176); L(c, NOIR, 286, 142, 272, 176);
    aretes(c, '#3a362e');
    eclairer(t, {
      amb: [0.46, 0.46, 0.5],
      sources: [
        { x: 160, y: 20, r: 140, ry: 0.9, f: 0.7, c: [1.15, 1.05, 0.85] },
        { x: 223, y: 92, r: 50, f: 0.5, c: [1.3, 0.7, 0.3] },
      ],
    });
    return t;
  },
  /** @param {CanvasRenderingContext2D} c @param {any} s @param {number} t */
  animer(c, s, t) {
    // la porte du foyer de la chaudière, et ses braises
    const oc = s.ouvert.chaudiere, ac = s.alerte.chaudiere;
    boite(c, 213 - oc * 8, 82, 20, 18, ['#5a5a6e', '#33333f', '#1c1c24']);
    for (let x = 216; x < 230; x += 3) { const v = (Math.sin(t * 7 + x) + 1) / 2; R(c, ac > 0 ? '#c8ff8a' : v > 0.5 ? '#ff9a2a' : '#d0381a', x - oc * 8, 92, 2, 4); }
    if (ac > 0) lueur(c, 206, 100, 34, 3);
    // la vapeur qui monte du tuyau
    for (let k = 0; k < 3; k++) { const ph = (t * 0.5 + k / 3) % 1; c.globalAlpha = (1 - ph) * 0.4; ovale(c, 222 + Math.sin(ph * 6) * 4, 30 - ph * 20, 3 + ph * 4, 2 + ph * 2, '#e8e8f0'); c.globalAlpha = 1; }
    // le couvercle de la lessiveuse qui saute
    const sl = s.alerte.cuve > 0 ? Math.abs(Math.sin(t * 22)) * 4 : s.ouvert.cuve * 14;
    ovale(c, 67, 138 - sl, 34, 6, NOIR); ovale(c, 67, 137 - sl, 33, 5, CUIVRE[1]); ovale(c, 60, 136 - sl, 10, 2, CUIVRE[0]); R(c, NOIR, 64, 131 - sl, 6, 4);
    if (s.alerte.cuve > 0) for (let k = 0; k < 4; k++) { const ph = (t * 1.5 + k / 4) % 1; c.globalAlpha = 1 - ph; R(c, '#c8ff8a', 50 + k * 10, 132 - ph * 16, 3, 3); c.globalAlpha = 1; }
    // la pile de linge qui glisse
    if (s.alerte.etagere > 0 || s.ouvert.etagere > 0) { const d = tremble(t, s.alerte.etagere) * 2 + s.ouvert.etagere * 6; R(c, '#f4f0e8', 78 + d, 81 - 6, 11, 2); R(c, '#d8e4f0', 91 + d, 81 - 9, 11, 2); if (s.alerte.etagere > 0) lueur(c, 76, 98, 40, 3); }
    // les draps étendus sur deux cordes (la corde du milieu se vise : elle lâche)
    const co = s.objets.corde, ad = s.alerte.draps, od = s.ouvert.draps;
    for (const [y, x0, x1, n] of [[56, 96, 224, 4]]) {
      L(c, NOIR, x0, y, x1, y);
      for (let k = 0; k < n; k++) {
        const x = x0 + 6 + k * 31, vent = Math.sin(t * (ad > 0 ? 9 : 1.4) + k) * (ad > 0 ? 3 : 1.5), ecarte = od > 0 && k > 0 && k < 3 ? (k === 1 ? -8 : 8) * od : 0;
        P(c, [[x + ecarte, y], [x + 26 + ecarte, y], [x + 26 + ecarte + vent, y + 40], [x + ecarte + vent, y + 42]], DRAP[k & 1 ? 1 : 0], NOIR);
        L(c, DRAP[2], x + 13 + ecarte, y + 2, x + 13 + ecarte + vent, y + 40);
        R(c, '#c8a060', x + 2 + ecarte, y - 1, 2, 3); R(c, '#c8a060', x + 22 + ecarte, y - 1, 2, 3);
      }
    }
    if (ad > 0) lueur(c, 128, 96, 64, 3);
    if (!co.fini) {
      const y = Math.round(hauteurChute(co));
      L(c, '#d8c8a0', 70, y + 4, 250, y + 4); L(c, NOIR, 70, y + 5, 250, y + 5);
      for (let k = 0; k < 5; k++) { const x = 84 + k * 34, v = Math.sin(t * 1.6 + k) * 1.5; P(c, [[x, y + 4], [x + 24, y + 4], [x + 24 + v, y + 22], [x + v, y + 23]], ['#f0d8d8', '#d8e4f0'][k & 1], NOIR); }
      vise(c, co.charge, co.besoin, () => R(c, '#ffffff', 70, y + 2, 180, 5));
    }
    // le panier de linge (visé : on y trouve des pièces oubliées)
    const pa = s.objets.panier;
    if (!pa.fait) {
      boite(c, 120, 150, 40, 26, ['#c8a060', '#a07a40', '#6a4a20']);
      for (let x = 122; x < 158; x += 4) R(c, '#6a4a20', x, 152, 1, 22);
      for (let k = 0; k < 4; k++) R(c, ['#f4f0e8', '#d8e4f0', '#f0d8d8', '#e8d0f0'][k], 124 + k * 8, 146 - (k & 1) * 2, 8, 5);
      vise(c, pa.charge, pa.besoin, () => R(c, '#ffffff', 120, 144, 40, 32));
    }
  },
};

// ———————————————————————————— les combles ————————————————————————————
export const COMBLES = {
  peindre() {
    const { t, c } = toile();
    piece(c, { plafond: '#2a2018', sol: PLANCHE[1], murG: PLANCHE[1], murD: PLANCHE[1], fond: PLANCHE[2] });
    // les planches des murs, les chevrons qui montent vers le faîte
    for (let y = FOND.y0; y < FOND.y1; y += 6) { R(c, (y / 6) & 1 ? PLANCHE[1] : PLANCHE[2], FOND.x0, y, FOND.x1 - FOND.x0, 6); R(c, '#201810', FOND.x0, y, FOND.x1 - FOND.x0, 1); }
    for (const cote of [-1, 1]) for (let q = 0; q < 1; q += 0.06) { const a = mur(cote, 0, q), b = mur(cote, 1, q); L(c, '#201810', a[0], a[1], b[0], b[1]); }
    for (let k = 0; k < 7; k++) { const w = k / 6.5; for (const cote of [-1, 1]) { const a = mur(cote, w, 0), b = mur(cote, w, 1); L(c, '#3a2a1c', a[0], a[1], b[0], b[1]); L(c, '#3a2a1c', a[0] + cote, a[1], b[0] + cote, b[1]); } }
    for (let k = 0; k <= 4; k++) { const a = plafond(-1 + k / 2, 0), b = plafond(-1 + k / 2, 1); P(c, [[a[0] - 6, a[1]], [a[0] + 6, a[1]], [b[0] + 2, b[1]], [b[0] - 2, b[1]]], '#3a2a1c'); }
    // les planches du plancher
    for (let k = -10; k <= 10; k++) { const a = sol(k / 5, 0), b = sol(k / 5, 1); L(c, '#201810', a[0], a[1], b[0], b[1]); }
    // la lucarne ronde au milieu du fond, la lune dedans
    ovale(c, 160, 52, 20, 20, NOIR); ovale(c, 160, 52, 18, 18, '#1a2850');
    for (let k = 0; k < 8; k++) R(c, '#8aa0d8', 146 + h32(k * 3) * 28, 38 + h32(k * 7) * 28, 1, 1);
    ovale(c, 166, 46, 6, 6, '#dce8ff'); ovale(c, 167, 45, 4, 4, '#f4f8ff');
    R(c, BOIS[2], 159, 34, 2, 36); R(c, BOIS[2], 142, 51, 36, 2);
    // des toiles d'araignée dans les coins
    for (const [x0, y0, sx] of [[FOND.x0, FOND.y0, 1], [FOND.x1, FOND.y0, -1], [0, 0, 1], [320, 0, -1]]) {
      for (let r = 6; r < 30; r += 6) for (let a = 0; a < Math.PI / 2; a += 0.3) R(c, '#b4b4c8', x0 + sx * Math.cos(a) * r, y0 + Math.sin(a) * r, 1, 1);
      for (let a = 0; a <= Math.PI / 2 + 0.01; a += Math.PI / 8) L(c, '#8a8aa0', x0, y0, x0 + sx * Math.cos(a) * 30, y0 + Math.sin(a) * 30);
    }
    // les malles, à gauche du fond (le couvercle de la grande est peint à part)
    boite(c, 74, 104, 40, 14, ['#6a4a8a', '#4a2a6a', '#2a1a4a']); for (const x of [80, 104]) R(c, OR[2], x, 104, 2, 14);
    boite(c, 80, 98, 30, 8, ['#8a5a3a', '#6a3a22', '#4a2414']);
    // un cheval à bascule, à droite du fond
    P(c, [[186, 116], [214, 116], [210, 112], [190, 112]], BOIS[1], NOIR);
    boite(c, 192, 94, 20, 12, ['#f4ecd8', '#d8ccb8', '#a89c88']); boite(c, 208, 84, 8, 12, ['#f4ecd8', '#d8ccb8', '#a89c88']);
    R(c, '#c8303a', 192, 94, 20, 2); R(c, NOIR, 212, 87, 2, 2); for (const x of [194, 208]) R(c, NOIR, x, 106, 2, 6);
    // le paravent, à droite (ses feuilles sont peintes à part)
    // le vieux coffre au premier plan, à gauche
    aretes(c, '#140e0a');
    eclairer(t, {
      amb: [0.38, 0.38, 0.46],
      sources: [
        { x: 160, y: 52, r: 100, f: 0.65, c: [0.55, 0.7, 1.05] },
        { x: 160, y: 30, r: 130, ry: 0.9, f: 0.5, c: [1.2, 0.9, 0.55] },
      ],
    });
    return t;
  },
  /** @param {CanvasRenderingContext2D} c @param {any} s @param {number} t */
  animer(c, s, t) {
    // la lucarne : un éclair
    if (s.alerte.lucarne > 0 && ((t * 12) | 0) % 3 !== 0) { c.globalAlpha = 0.6; ovale(c, 160, 52, 18, 18, '#e8f0ff'); c.globalAlpha = 1; L(c, '#ffffff', 154, 36, 158, 50); L(c, '#ffffff', 158, 50, 155, 56); }
    // le couvercle de la malle violette
    const sm = s.alerte.malle > 0 ? Math.abs(Math.sin(t * 22)) * 4 : s.ouvert.malle * 12;
    boite(c, 72, 100 - sm, 44, 6, ['#7a5a9a', '#5a3a7a', '#3a2a5a']);
    if (s.alerte.malle > 0) lueur(c, 74, 104, 40, 2);
    // entre les poutres : des poussières qui tombent, deux yeux rouges
    if (s.alerte.poutres > 0) { for (let k = 0; k < 6; k++) R(c, '#c8b8a0', 96 + k * 6, 24 + ((t * 60 + k * 9) % 30), 1, 1); R(c, '#ff3030', 104, 30, 2, 2); R(c, '#ff3030', 112, 30, 2, 2); }
    // le paravent à trois feuilles : il tremble, puis se replie
    const op = s.ouvert.paravent, tp = tremble(t, s.alerte.paravent);
    for (let k = 0; k < 3; k++) {
      const x = 224 + k * 14 - op * k * 10 + tp, y0 = 70 + (k & 1) * 2;
      P(c, [[x, y0], [x + 14, y0 + (k & 1 ? -2 : 2)], [x + 14, y0 + 48], [x, y0 + 48]], k & 1 ? '#8a3a4a' : '#a84a5a', NOIR);
      for (let q = 0; q < 3; q++) ovale(c, x + 7, y0 + 12 + q * 12, 3, 4, '#e0b040');
    }
    if (s.alerte.paravent > 0) lueur(c, 224, 116, 42, 3);
    // le vieux coffre (visé : il s'ouvre, des pièces)
    const co = s.objets.coffre;
    if (!co.fait) {
      boite(c, 26, 140, 60, 34, ['#8a5a3a', '#6a3a22', '#4a2414']); ovale(c, 56, 140, 30, 6, NOIR); ovale(c, 56, 139, 29, 5, '#7a4a2a');
      for (const x of [34, 76]) R(c, OR[2], x, 136, 3, 38); R(c, OR[1], 52, 150, 8, 8); R(c, NOIR, 55, 153, 2, 3);
      vise(c, co.charge, co.besoin, () => R(c, '#ffffff', 26, 134, 60, 40));
    } else { boite(c, 26, 140, 60, 34, ['#8a5a3a', '#6a3a22', '#4a2414']); R(c, '#1a0e08', 29, 142, 54, 8); P(c, [[26, 140], [86, 140], [80, 118], [32, 118]], '#7a4a2a', NOIR); }
    // la lanterne pendue au faîte
    const la = s.objets.lanterne;
    if (!la.fini) {
      const y = Math.round(hauteurChute(la)), x = Math.round(160 + (la.chute ? 0 : Math.sin(t * 1.5) * 2));
      if (!la.chute) L(c, NOIR, 160, 0, x, y);
      boite(c, x - 6, y, 12, 16, ['#5a5a6e', '#33333f', '#1c1c24']); R(c, '#ffd070', x - 4, y + 3, 8, 10); flamme(c, x, y + 11, t);
      c.globalAlpha = 0.12; ovale(c, x, y + 30, 34, 26, '#ffd070'); c.globalAlpha = 1;
      vise(c, la.charge, la.besoin, () => R(c, '#ffffff', x - 6, y, 12, 16));
    }
  },
};
