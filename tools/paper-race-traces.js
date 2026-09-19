// Paper Race : des VRAIS tracés aux tracés jouables sur le quadrillage.
//
// Source : bacinger/f1-circuits (licence MIT, © Tomislav Bacinger), rangée dans
// tools/donnees/circuits/ avec sa licence. Pour chaque circuit :
//   1. on le tourne pour que la ligne de départ MONTE à l'écran (le moteur compte
//      l'avancement vers le haut) ;
//   2. on le met à l'échelle de la carte ;
//   3. on le « gonfle » : deux bouts de piste éloignés sur le tracé mais proches
//      sur la carte se repoussent jusqu'à 7 cases (sinon leurs pistes se touchent
//      et ouvrent un raccourci ; paper-race-circuits.js exige 6), pendant qu'un
//      ressort garde chaque point près de sa place réelle et que le lissage garde
//      la courbe : les épingles s'élargissent, la forme reste ;
//   4. on simplifie (Douglas-Peucker) et on arrondit aux cases.
// Usage : node tools/paper-race-traces.js [id] [taille] [--json fichier]
//         node tools/paper-race-traces.js --controle   (moteur.js = ce que sort l'outil)
// Un tracé qui sort d'ici se regarde à côté du vrai AVANT d'entrer dans moteur.js :
// le contrôle des raccourcis ne dit pas si la forme est restée reconnaissable.
const fs = require('fs'), path = require('path');

const SOURCES = {
  spavrai: { f: 'be-1925', taille: 80 },
  monzavrai: { f: 'it-1922', taille: 72 },
  monacovrai: { f: 'mc-1929', taille: 76 },
  montrealvrai: { f: 'ca-1978', taille: 80 }
};
const CIBLE = 7.5;     // marge : l arrondi aux cases peut perdre un demi-case

function lire(f) {
  const g = JSON.parse(fs.readFileSync(path.join(__dirname, 'donnees', 'circuits', f + '.geojson'), 'utf8'));
  const c = g.features[0].geometry.coordinates;
  const lat0 = c.reduce((s, x) => s + x[1], 0) / c.length;
  let pts = c.map(x => [x[0] * 111320 * Math.cos(lat0 * Math.PI / 180), -x[1] * 110540]);
  if (Math.hypot(pts[0][0] - pts.at(-1)[0], pts[0][1] - pts.at(-1)[1]) < 1) pts = pts.slice(0, -1);
  return pts;
}
function tourne(pts, taille) {
  const a = pts[0], b = pts[3], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const r = -Math.PI / 2 - ang, c = Math.cos(r), s = Math.sin(r);
  pts = pts.map(p => [p[0] * c - p[1] * s, p[0] * s + p[1] * c]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const e = taille / Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  return { pts: pts.map(p => [(p[0] - Math.min(...xs)) * e + 4, (p[1] - Math.min(...ys)) * e + 4]), metresParCase: 1 / e };
}
function reechantillonne(P, pas) {
  const out = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!L) continue;
    const n = Math.max(1, Math.floor(L / pas));
    for (let k = 0; k < n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
  }
  return out;
}
function gonfle(P, iters) {
  let Q = reechantillonne(P, 1), ancre = Q.map(p => p.slice());
  for (let it = 0; it < iters; it++) {
    const n = Q.length, F = Q.map(() => [0, 0]);
    for (let i = 0; i < n; i++) for (let j = i + 12; j < n; j++) {
      if (n - (j - i) < 12) continue;
      const dx = Q[j][0] - Q[i][0], dy = Q[j][1] - Q[i][1], d2 = dx * dx + dy * dy;
      if (d2 >= CIBLE * CIBLE) continue;
      const d = Math.sqrt(d2) || 1e-6, f = (CIBLE - d) * 0.25 / d;
      F[i][0] -= dx * f; F[i][1] -= dy * f; F[j][0] += dx * f; F[j][1] += dy * f;
    }
    for (let i = 0; i < n; i++) {
      const a = Q[(i - 1 + n) % n], b = Q[(i + 1) % n];
      F[i][0] += ((a[0] + b[0]) / 2 - Q[i][0]) * 0.15 + (ancre[i][0] - Q[i][0]) * 0.01;
      F[i][1] += ((a[1] + b[1]) / 2 - Q[i][1]) * 0.15 + (ancre[i][1] - Q[i][1]) * 0.01;
    }
    // un pas plafonné : sans ça, les répulsions s'emballaient (Monaco à grande échelle
    // enflait sans fin et le rééchantillonnage produisait des millions de points)
    for (let i = 0; i < n; i++) {
      const f = Math.hypot(F[i][0], F[i][1]), k = f > 0.4 ? 0.4 / f : 1;
      Q[i][0] += F[i][0] * k; Q[i][1] += F[i][1] * k;
    }
    if (it % 50 === 49) {
      const R = reechantillonne(Q, 1);
      ancre = R.map((_, i) => ancre[Math.floor(i * ancre.length / R.length)].slice());
      Q = R;
    }
  }
  return Q;
}
function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const a = pts[0], b = pts.at(-1), L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-9;
  let dmax = 0, i0 = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i], d = Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / L;
    if (d > dmax) { dmax = d; i0 = i; }
  }
  if (dmax <= tol) return [a, b];
  return dp(pts.slice(0, i0 + 1), tol).slice(0, -1).concat(dp(pts.slice(i0), tol));
}
function ecartMin(P, demi) {
  const pts = [], pas = 0.25;
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let k = 0; k < L / pas; k++) pts.push([a[0] + (b[0] - a[0]) * k * pas / L, a[1] + (b[1] - a[1]) * k * pas / L]);
  }
  let e = 1e9;
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    const arc = Math.min(j - i, pts.length - (j - i)) * pas;
    if (arc < 5 * demi) continue;
    e = Math.min(e, Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]));
  }
  return { ecart: e, tour: pts.length * pas };
}

function construire(id, taille, iters) {
  const src = SOURCES[id];
  const { pts, metresParCase } = tourne(lire(src.f), taille || src.taille);
  const G = gonfle(pts, iters || 900);
  let m = 0; for (let i = 0; i < G.length; i++) if (Math.hypot(G[i][0] - G[0][0], G[i][1] - G[0][1]) > Math.hypot(G[m][0] - G[0][0], G[m][1] - G[0][1])) m = i;
  let S = dp(G.slice(0, m + 1), 0.5).slice(0, -1).concat(dp(G.slice(m).concat([G[0]]), 0.5).slice(0, -1));
  const x0 = Math.min(...S.map(p => p[0])), y0 = Math.min(...S.map(p => p[1]));
  S = S.map(p => [Math.round(p[0] - x0 + 4), Math.round(p[1] - y0 + 4)]).filter((p, i, a) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);
  // la ligne de départ : sur une ligne droite VERTICALE (le moteur compte l'avancement
  // vers le haut, et la grille pose ses rangées à y et y - 2). Les voisins du premier
  // point (le départ réel) sont alignés sur sa colonne s'ils en sont à 2 cases ou moins.
  const mx = S[0][0];
  for (const i of [1, S.length - 1]) if (Math.abs(S[i][0] - mx) <= 2) S[i][0] = mx;
  const depart = { y: S[0][1], x0: mx - 2, x1: mx + 2 };
  const cols = Math.max(...S.map(p => p[0])) + 4, rows = Math.max(...S.map(p => p[1])) + 4;
  return { id, trace: S, depart, cols, rows, metresParCase, reel: pts, ...ecartMin(S, 2) };
}

// l'arrondi aux cases peut rapprocher deux bouts de piste d'un demi-case : on essaie
// les tailles suivantes jusqu'à un tracé sans raccourci
function construireSur(id, taille) {
  const t0 = taille || SOURCES[id].taille;
  for (let t = t0; t < t0 + 12; t++) { const r = construire(id, t); if (r.ecart >= 6) return Object.assign(r, { taille: t }); }
  throw new Error(id + ' : aucun tracé sans raccourci');
}

module.exports = { construire, construireSur, SOURCES, lire, tourne };
if (require.main === module && process.argv.includes('--controle')) {
  const E = require('../paper-race/moteur.js');
  let ko = 0;
  for (const id of Object.keys(SOURCES)) {
    const r = construireSur(id), tk = E.TRACKS.find(t => t.id === id);
    const pareil = tk && JSON.stringify(tk.trace) === JSON.stringify(r.trace) && JSON.stringify(tk.depart) === JSON.stringify(r.depart)
      && tk.cols === r.cols && tk.rows === r.rows;
    if (!pareil) { console.log('ECHEC : ' + id + ' dans moteur.js ne sort pas de cet outil (retouché à la main ?)'); ko++; }
  }
  console.log(ko ? ko + ' ECHEC(S)' : 'TRACÉS OK : les ' + Object.keys(SOURCES).length + ' vrais tracés sortent de l\'outil');
  process.exitCode = ko ? 1 : 0;
} else if (require.main === module) {
  const ids = process.argv[2] && SOURCES[process.argv[2]] ? [process.argv[2]] : Object.keys(SOURCES);
  const taille = +process.argv[3] || 0;
  const tout = {};
  for (const id of ids) {
    const r = construireSur(id, taille);
    tout[id] = r;
    console.log(`${id.padEnd(13)} taille ${r.taille}, ${r.trace.length} points, tour ${r.tour.toFixed(0)} cases, carte ${r.cols} x ${r.rows}, écart min ${r.ecart.toFixed(1)} ${r.ecart >= 6 ? 'ok' : 'RACCOURCI'}`);
  }
  if (process.argv.includes('--json')) fs.writeFileSync(process.argv[process.argv.indexOf('--json') + 1], JSON.stringify(tout));
}
