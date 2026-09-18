const E = require('../paper-race/moteur.js');

// Recherche en largeur sur (position, vitesse, secteurs franchis) pour trouver
// le nombre minimal de coups qui boucle le tour.
function par(tk, vmax) {
  vmax = vmax || 7;
  const D = E.champ(tk).max + 1;
  const st = E.startCells(tk);
  const V = 2 * vmax + 1;
  const vus = new Set();
  const file = [];
  for (const p of st) {
    file.push({ x: p[0], y: p[1], vx: 0, vy: 0, tour: 0, n: 0 });
    vus.add(p[0] + ',' + p[1] + ',0,0,0');
  }
  let t = 0;
  while (t < file.length) {
    const cur = file[t++];
    if (cur.tour >= 1) return cur.n;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      let nvx = cur.vx + dx, nvy = cur.vy + dy;
      if (Math.abs(nvx) > vmax || Math.abs(nvy) > vmax) continue;
      const nx = cur.x + nvx, ny = cur.y + nvy;
      if (!E.onTrack(tk, nx, ny)) continue;
      if (!E.segOk(tk, [cur.x, cur.y], [nx, ny])) continue;
      const a = E.avanceDe(tk, [cur.x, cur.y]), b = E.avanceDe(tk, [nx, ny]);
      let delta = b - a, tour = cur.tour;
      if (delta < -D / 2) tour++;
      else if (delta > D / 2) tour--;
      if (tour < 0) continue;
      const k = nx + ',' + ny + ',' + nvx + ',' + nvy + ',' + tour;
      if (vus.has(k)) continue;
      vus.add(k);
      file.push({ x: nx, y: ny, vx: nvx, vy: nvy, tour, n: cur.n + 1 });
    }
  }
  return null;
}

// largeur minimale du couloir, pour repérer les circuits impraticables
function largeurMin(tk) {
  let mini = 99;
  for (let y = 0; y <= E.ROWS; y++) {
    let run = 0;
    for (let x = 0; x <= E.COLS; x++) {
      if (E.onTrack(tk, x, y)) run++;
      else { if (run > 0 && run < mini) mini = run; run = 0; }
    }
    if (run > 0 && run < mini) mini = run;
  }
  for (let x = 0; x <= E.COLS; x++) {
    let run = 0;
    for (let y = 0; y <= E.ROWS; y++) {
      if (E.onTrack(tk, x, y)) run++;
      else { if (run > 0 && run < mini) mini = run; run = 0; }
    }
    if (run > 0 && run < mini) mini = run;
  }
  return mini;
}

function pilote(ti, lvl, seed) {
  let s = seed;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const r = E.newRace(ti, 1); r.cars[1].fini = true;
  let n = 0;
  while (!r.cars[0].fini && n < 200) {
    const q = E.aiChoice(r, lvl, rnd);
    if (q === null) { E.stuck(r); } else { E.play(r, q); }
    n++;
    if (r.winner !== null) break;
  }
  return { coups: r.cars[0].coups, crashes: r.cars[0].crashes, fini: r.cars[0].fini };
}

console.log('circuit'.padEnd(16), 'largeur', 'depart', 'par', ' IA rapide (moy)', 'sorties');
const pars = [];
for (let i = 0; i < E.TRACKS.length; i++) {
  const tk = E.TRACKS[i];
  const st = E.startCells(tk);
  const departOk = st.every(p => E.onTrack(tk, p[0], p[1]));
  const p = par(tk);
  pars.push(p);
  let tot = 0, cr = 0, fails = 0;
  for (let s = 1; s <= 12; s++) {
    const r = pilote(i, 'rapide', s * 7919, false);
    if (!r.fini) fails++;
    tot += r.coups; cr += r.crashes;
  }
  console.log(tk.nom.padEnd(16), String(largeurMin(tk)).padEnd(7), String(departOk).padEnd(6),
    String(p).padEnd(4), (tot / 12).toFixed(1).padStart(14), String(cr).padStart(7),
    fails ? '  ECHECS:' + fails : '');
}
console.log('\npars =', JSON.stringify(pars));
// deux departs distincts ?
for (const tk of E.TRACKS) {
  const st = E.startCells(tk);
  console.log(tk.nom.padEnd(16), 'depart', JSON.stringify(st),
    'distincts', st[0][0] !== st[1][0] || st[0][1] !== st[1][1],
    'sur piste', st.every(p => E.onTrack(tk, p[0], p[1])));
}

