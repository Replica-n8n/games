// Paper Race : chaque circuit du championnat tient-il debout ?
// - la piste est d'un seul tenant, sans raccourci ;
// - le par affiché est bien le tour parfait que trouve le solveur ;
// - l'ordinateur finit toutes ses courses, aux trois niveaux.
const E = require('../paper-race/moteur.js');
const S = require('fs');
const src = S.readFileSync(require('path').join(__dirname, 'paper-race-solveur.js'), 'utf8');
const par = new Function('E', src.slice(src.indexOf('function par('), src.indexOf('// largeur minimale')) + '; return par;')(E);

let fails = 0;
const check = (n, c) => { if (!c) { console.log('ECHEC: ' + n); fails++; } };

// Circuit en rectangles : les îlots forment UN bloc loin du bord, sinon un
// passage s'ouvre par le milieu et le par s'effondre ; couloir de 5 cases.
function topoRect(tk) {
  const O = tk.outers[0], C = tk.cols || 21, R = tk.rows || 26;
  const trou = [], piste = [];
  for (let y = 0; y <= R; y++) for (let x = 0; x <= C; x++) {
    if (E.onTrack(tk, x, y)) piste.push([x, y]);
    else if (x >= O[0] && x <= O[2] && y >= O[1] && y <= O[3]) trou.push([x, y]);
  }
  const k = p => p[0] + ':' + p[1];
  const cx = (arr) => { const s = new Set(arr.map(k)); const v = new Set([k(arr[0])]); const st = [arr[0]];
    while (st.length) { const [x, y] = st.pop(); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = (x + a) + ':' + (y + b); if (s.has(q) && !v.has(q)) { v.add(q); st.push([x + a, y + b]); } } }
    return v.size === arr.length; };
  let m = 99;
  for (let y = 0; y <= R; y++) { let r = 0; for (let x = 0; x <= C; x++) { if (E.onTrack(tk, x, y)) r++; else { if (r > 0 && r < m) m = r; r = 0; } } if (r > 0 && r < m) m = r; }
  for (let x = 0; x <= C; x++) { let r = 0; for (let y = 0; y <= R; y++) { if (E.onTrack(tk, x, y)) r++; else { if (r > 0 && r < m) m = r; r = 0; } } if (r > 0 && r < m) m = r; }
  const touche = trou.some(p => p[0] === O[0] || p[0] === O[2] || p[1] === O[1] || p[1] === O[3]);
  check(tk.nom + ' : îlots d un seul bloc', cx(trou));
  check(tk.nom + ' : îlots loin du bord', !touche);
  check(tk.nom + ' : piste d un seul tenant', cx(piste));
  check(tk.nom + ' : couloir de 5 cases au moins', m >= 5);
  return 'couloir ' + m;
}

// Circuit en tracé : deux bouts de la ligne centrale éloignés SUR LE TRACÉ ne
// doivent pas être voisins SUR LA CARTE, sinon leurs pistes se touchent et
// ouvrent un raccourci (vu au prototype : la Rascasse rejoignait la ligne
// droite des stands). Et le tracé reste dans sa carte.
function topoTrace(tk) {
  const P = tk.trace, pts = [], pas = 0.25;
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let k = 0; k < L / pas; k++) pts.push([a[0] + (b[0] - a[0]) * k * pas / L, a[1] + (b[1] - a[1]) * k * pas / L]);
  }
  let ecart = 1e9;
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    const arc = Math.min(j - i, pts.length - (j - i)) * pas;
    if (arc < 5 * tk.demi) continue;
    ecart = Math.min(ecart, Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]));
  }
  const dedans = P.every(p => p[0] - tk.demi >= 1 && p[1] - tk.demi >= 1 && p[0] + tk.demi <= tk.cols - 1 && p[1] + tk.demi <= tk.rows - 1);
  check(tk.nom + ' : pas de raccourci (écart ' + ecart.toFixed(1) + ')', ecart >= 2 * tk.demi + 2);
  check(tk.nom + ' : le tracé tient dans sa carte', dedans);
  return 'écart ' + ecart.toFixed(1);
}

function course(ti, lvl, seed) {
  let s = seed; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const r = E.newRace(ti, 1);
  let n = 0;
  while (r.winner === null && n < 500) {
    const q = E.aiChoice(r, lvl, rnd);
    if (q === null) E.stuck(r); else E.play(r, q);
    E.nextTurn(r); n++;
  }
  return { fini: r.winner !== null, coups: r.winner !== null ? r.cars[r.winner].coups : null };
}

const N = +(process.env.N || 6);
console.log('circuit'.padEnd(15), 'topologie'.padEnd(12), 'départ', 'par', ' ordinateur (finies, coups moyens)');
for (let i = 0; i < E.TRACKS.length; i++) {
  const tk = E.TRACKS[i];
  const t = tk.trace ? topoTrace(tk) : topoRect(tk);
  const st = E.startCells(tk);
  check(tk.nom + ' : départs sur la piste', st.every(p => E.onTrack(tk, p[0], p[1])));
  const p = par(tk, 12);
  // le par affiché au joueur doit être celui que le solveur trouve
  check(tk.nom + ' : par affiché ' + tk.par + ', calculé ' + p, p === tk.par);
  const cols = [];
  for (const lvl of ['tranquille', 'normal', 'rapide']) {
    let f = 0, c = 0;
    for (let s = 1; s <= N; s++) { const r = course(i, lvl, s * 7919); if (r.fini) { f++; c += r.coups; } }
    check(tk.nom + ' ' + lvl + ' : l ordinateur finit toutes ses courses', f === N);
    cols.push(f + '/' + N + ' ' + (f ? (c / f).toFixed(0) : '-'));
  }
  console.log(tk.nom.padEnd(15), t.padEnd(12), 'ok    ', String(p).padStart(3), ' ', cols.join('  '));
}
console.log(fails === 0 ? 'CIRCUITS OK' : fails + ' ECHEC(S)');
process.exitCode = fails ? 1 : 0;
