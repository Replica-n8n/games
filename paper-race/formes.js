// ===== Paper Race : la forme des pièges =====
// Géométrie PURE : aucun canvas, aucun DOM. rendu.js la dessine, et
// tools/paper-race-pieges.js la mesure hors navigateur.
//
// Une zone piégée est un rectangle en CASES : [x0, y0, x1, y1] désigne les
// cases x0..x1 et y0..y1, donc le terrain qui va de x0 - 0,5 à x1 + 0,5.
// ⚠️ Le contour ondulé doit ENGLOBER ce terrain, jamais rentrer dedans : sinon
// une case piégée se retrouve hors du dessin, et le joueur croit passer à côté
// alors qu'il sera ralenti. La marge (0,6 case) est donc plus grande que la
// demi-case, et l'ondulation ne fait que pousser vers l'extérieur.
const MARGE = 0.6, AMPLI = 0.35, PAS = 0.5;

// une ondulation douce, toujours entre 0 et 1, et toujours la même (aucun
// hasard : le décor est dessiné une fois et doit se redessiner à l'identique)
function ondule(t) {
  return 0.5 + 0.25 * Math.sin(t * 2.7) + 0.25 * Math.sin(t * 1.1 + 1.7);
}

// carte = [cols, rows] : le contour y est borné (une zone collée au bord
// déborderait sinon hors de la feuille ; ces zones ne touchent jamais le bord,
// la couverture reste donc entière)
function contourPiege(rect, carte, marge, ampli) {
  const m = marge === undefined ? MARGE : marge;
  const a = ampli === undefined ? AMPLI : ampli;
  const borne = (p) => carte ? [Math.max(0, Math.min(carte[0], p[0])), Math.max(0, Math.min(carte[1], p[1]))] : p;
  const x0 = rect[0] - 0.5 - m, y0 = rect[1] - 0.5 - m;
  const x1 = rect[2] + 0.5 + m, y1 = rect[3] + 0.5 + m;
  const pts = [];
  for (let x = x0; x < x1; x += PAS) pts.push(borne([x, y0 - a * ondule(x)]));
  for (let y = y0; y < y1; y += PAS) pts.push(borne([x1 + a * ondule(y + 7), y]));
  for (let x = x1; x > x0; x -= PAS) pts.push(borne([x, y1 + a * ondule(x + 13)]));
  for (let y = y1; y > y0; y -= PAS) pts.push(borne([x0 - a * ondule(y + 21), y]));
  return pts;
}

// un point est-il dans le polygone ? (lancer de rayon)
function dansPolygone(p, poly) {
  let dedans = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) dedans = !dedans;
  }
  return dedans;
}

if (typeof module !== 'undefined') module.exports = { contourPiege, dansPolygone, MARGE, AMPLI };
