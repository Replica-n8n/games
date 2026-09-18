// ===== Circuit quadrillé : moteur v3 =====
const COLS = 21, ROWS = 26;

// Un circuit : des rectangles de bitume, moins des îlots.
// zones : huile (on ne peut pas changer de vitesse), humide (on ne peut que freiner),
//         boost (on gagne une case dans le sens de la marche en y arrivant).
const TRACKS = [
  {
    nom: "L'ovale", outers: [[1, 1, 19, 24]], islands: [[6, 6, 14, 19]],
    depart: { y: 12, x0: 1, x1: 6 }, sens: 1, par: 18, zones: {}
  },
  {
    nom: "L'épingle", outers: [[1, 1, 19, 24]], islands: [[5, 5, 15, 12], [10, 11, 15, 20]],
    depart: { y: 8, x0: 1, x1: 5 }, sens: 1, par: 19,
    zones: { humide: [[1, 15, 6, 20]] }
  },
  {
    nom: 'Le S', outers: [[1, 1, 19, 24]], islands: [[5, 5, 12, 11], [9, 10, 14, 18]],
    depart: { y: 8, x0: 1, x1: 5 }, sens: 1, par: 17,
    zones: { boost: [[15, 2, 19, 5]] }
  },
  {
    nom: 'La croix', outers: [[1, 1, 19, 24]], islands: [[5, 10, 15, 15], [8, 5, 12, 20]],
    depart: { y: 12, x0: 1, x1: 5 }, sens: 1, par: 19,
    zones: { huile: [[15, 17, 19, 21]] }
  },
  {
    nom: 'Le long ruban', outers: [[1, 1, 19, 24]], islands: [[5, 5, 15, 20]],
    depart: { y: 12, x0: 1, x1: 5 }, sens: 1, par: 19,
    zones: { boost: [[16, 2, 19, 5]], humide: [[2, 19, 6, 23]] }
  }
];

let PIEGES = true;   // les zones spéciales sont-elles actives

function setPieges(v) { PIEGES = !!v; }

function dansRect(r, x, y, e) {
  e = e || 0;
  return x >= r[0] - e && x <= r[2] + e && y >= r[1] - e && y <= r[3] + e;
}
function strictement(r, x, y, e) {
  e = e || 0;
  return x > r[0] + e && x < r[2] - e && y > r[1] + e && y < r[3] - e;
}

function onTrack(tk, x, y) {
  if (x < 0 || x > COLS || y < 0 || y > ROWS) return false;
  let dedans = false;
  for (const r of tk.outers) if (dansRect(r, x, y)) { dedans = true; break; }
  if (!dedans) return false;
  for (const r of tk.islands) if (strictement(r, x, y)) return false;
  return true;
}

function onTrackF(tk, x, y) {
  const e = 1e-6;
  let dedans = false;
  for (const r of tk.outers) if (dansRect(r, x, y, e)) { dedans = true; break; }
  if (!dedans) return false;
  for (const r of tk.islands) if (strictement(r, x, y, -e)) return false;
  return true;
}

function segOk(tk, a, b, steps) {
  steps = steps || Math.max(8, 7 * Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])));
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    if (!onTrackF(tk, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) return false;
  }
  return true;
}

function zoneDe(tk, x, y) {
  if (!PIEGES || !tk.zones) return null;
  for (const nom of ['huile', 'humide', 'boost']) {
    const z = tk.zones[nom];
    if (!z) continue;
    for (const r of z) if (dansRect(r, x, y)) return nom;
  }
  return null;
}

// Position le long de la boucle, de 0 (ligne de départ) à 1000 (juste avant de la repasser).
// On mesure la distance à la ligne dans les deux sens, la ligne servant de coupure ;
// le rapport des deux donne un repère qui progresse vraiment, même dans les virages larges.
function champ(tk) {
  if (tk._champ) return tk._champ;
  const L = tk.depart;
  const N = (COLS + 1) * (ROWS + 1);
  const idx = (x, y) => y * (COLS + 1) + x;
  const coupe = (x0, y0, x1, y1) => {
    if (x0 !== x1) return false;
    if (x0 < L.x0 || x0 > L.x1) return false;
    return (y0 > L.y && y1 <= L.y) || (y0 <= L.y && y1 > L.y);
  };
  const bfs = (graines) => {
    const d = new Int32Array(N).fill(-1);
    const file = [];
    for (const [x, y] of graines) if (onTrack(tk, x, y) && d[idx(x, y)] === -1) { d[idx(x, y)] = 0; file.push([x, y]); }
    let t = 0;
    while (t < file.length) {
      const [x, y] = file[t++];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx > COLS || ny < 0 || ny > ROWS) continue;
        if (!onTrack(tk, nx, ny)) continue;
        if (coupe(x, y, nx, ny)) continue;
        if (d[idx(nx, ny)] !== -1) continue;
        d[idx(nx, ny)] = d[idx(x, y)] + 1;
        file.push([nx, ny]);
      }
    }
    return d;
  };
  const apres = [], avant = [];
  for (let x = L.x0; x <= L.x1; x++) { apres.push([x, L.y]); avant.push([x, L.y + 1]); }
  const dA = bfs(apres), dB = bfs(avant);
  // dA croît le long du tour, dB décroît : leur différence progresse partout,
  // y compris en travers d'un virage large où la seule distance saturerait.
  const val = new Int32Array(N);
  let mn = 1e9, mx = -1e9;
  for (let y = 0; y <= ROWS; y++) for (let x = 0; x <= COLS; x++) {
    const i = idx(x, y);
    if (!onTrack(tk, x, y)) continue;
    const a = dA[i] < 0 ? 0 : dA[i], b = dB[i] < 0 ? 0 : dB[i];
    val[i] = a - b;
    if (val[i] < mn) mn = val[i];
    if (val[i] > mx) mx = val[i];
  }
  for (let i = 0; i < N; i++) val[i] -= mn;
  const portee = mx - mn + 2;
  tk._champ = { val, idx, portee, max: mx - mn };
  return tk._champ;
}

function avanceDe(tk, p) {
  const c = champ(tk);
  if (p[0] < 0 || p[0] > COLS || p[1] < 0 || p[1] > ROWS) return 0;
  return c.val[c.idx(p[0], p[1])];
}

function centerOf(tk) {
  let sx = 0, sy = 0, n = 0;
  for (const r of tk.islands) { sx += (r[0] + r[2]) / 2; sy += (r[1] + r[3]) / 2; n++; }
  return n ? [sx / n, sy / n] : [(tk.outers[0][0] + tk.outers[0][2]) / 2, (tk.outers[0][1] + tk.outers[0][3]) / 2];
}

function angleAt(tk, p) {
  const c = centerOf(tk);
  return Math.atan2(p[1] - c[1], p[0] - c[0]);
}

function progress(tk, a, b) {
  const P = champ(tk).portee;
  let delta = avanceDe(tk, b) - avanceDe(tk, a);
  if (delta < -P / 2) delta += P;
  else if (delta > P / 2) delta -= P;
  return delta;
}

function startLine(tk) { return tk.depart; }

function startCells(tk) {
  const d = tk.depart;
  const m = Math.floor((d.x0 + d.x1) / 2);
  return [[m - 1, d.y], [m + 1, d.y]];
}

function newRace(trackIndex, laps) {
  const tk = TRACKS[trackIndex];
  const st = startCells(tk);
  return {
    ti: trackIndex, track: tk, laps: laps || 1,
    cars: [0, 1].map(i => ({
      p: st[i].slice(), v: [0, 0], trail: [st[i].slice()],
      arc: 0, tour: 0, coups: 0, crashes: 0, fini: false
    })),
    D: champ(tk).portee,
    turn: 0, winner: null, dernier: null
  };
}

const projected = (car) => [car.p[0] + car.v[0], car.p[1] + car.v[1]];

function latticeOnSegment(a, b, p) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const ex = p[0] - a[0], ey = p[1] - a[1];
  if (dx * ey - dy * ex !== 0) return false;
  const dot = ex * dx + ey * dy;
  if (dot <= 0) return false;
  if (dot > dx * dx + dy * dy) return false;
  return true;
}
function pgcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; }
function collision(race, from, to) {
  return latticeOnSegment(from, to, race.cars[1 - race.turn].p);
}

// Contrainte imposée par la case où l'on se trouve.
function contrainte(tk, car) {
  const z = zoneDe(tk, car.p[0], car.p[1]);
  if (z === 'huile') return 'huile';
  if (z === 'humide') return 'humide';
  return null;
}

function accelAutorisee(c, dx, dy, v) {
  if (c === 'huile') return dx === 0 && dy === 0;
  if (c === 'humide') return Math.abs(v[0] + dx) <= Math.abs(v[0]) && Math.abs(v[1] + dy) <= Math.abs(v[1]);
  return true;
}

function choices(race) {
  const car = race.cars[race.turn];
  const pr = projected(car);
  const c = contrainte(race.track, car);
  const out = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const q = [pr[0] + dx, pr[1] + dy];
      const permis = accelAutorisee(c, dx, dy, car.v);
      const piste = onTrack(race.track, q[0], q[1]) && segOk(race.track, car.p, q);
      const bloque = permis && piste && collision(race, car.p, q);
      out.push({
        p: q, dx, dy,
        ok: permis && piste && !bloque,
        bloque: bloque,
        interdit: !permis
      });
    }
  }
  return out;
}

function crashPoint(tk, a, b) {
  let best = a;
  const N = Math.max(12, 8 * Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])));
  for (let k = 1; k <= N; k++) {
    const t = k / N;
    const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
    if (!onTrackF(tk, x, y)) break;
    const rx = Math.round(x), ry = Math.round(y);
    if (onTrack(tk, rx, ry) && segOk(tk, a, [rx, ry])) best = [rx, ry];
  }
  return best;
}

// Distance d'arrêt : en combien de coups, et jusqu'où.
function arret(car) {
  const n = Math.max(Math.abs(car.v[0]), Math.abs(car.v[1]));
  const d = (k) => Math.sign(k) * Math.abs(k) * (Math.abs(k) + 1) / 2;
  return { coups: n, point: [car.p[0] + d(car.v[0]), car.p[1] + d(car.v[1])] };
}

function majAvance(race, car, from, to) {
  const D = race.D;
  const a = avanceDe(race.track, from), b = avanceDe(race.track, to);
  let delta = b - a;
  if (delta < -D / 2) { delta += D; car.tour++; }
  else if (delta > D / 2) { delta -= D; car.tour--; }
  car.arc += delta;
}

function stuck(race) {
  const car = race.cars[race.turn];
  car.coups++; car.v = [0, 0];
  race.dernier = { type: 'coince', joueur: race.turn };
  return race.dernier;
}

function play(race, q) {
  const car = race.cars[race.turn];
  const from = car.p.slice();
  car.coups++;

  if (collision(race, from, q)) {
    const o = race.cars[1 - race.turn].p;
    const g = pgcd(q[0] - from[0], q[1] - from[1]);
    const ux = (q[0] - from[0]) / g, uy = (q[1] - from[1]) / g;
    let stop = [o[0] - ux, o[1] - uy];
    if (!onTrack(race.track, stop[0], stop[1]) || !segOk(race.track, from, stop)) stop = from.slice();
    majAvance(race, car, from, stop);
    if (stop[0] !== from[0] || stop[1] !== from[1]) car.trail.push(stop.slice());
    car.p = stop.slice(); car.v = [0, 0];
    race.dernier = { type: 'blocage', joueur: race.turn };
    return race.dernier;
  }

  const ok = onTrack(race.track, q[0], q[1]) && segOk(race.track, from, q);
  if (!ok) {
    const stop = crashPoint(race.track, from, q);
    majAvance(race, car, from, stop);
    car.trail.push(stop.slice());
    car.p = stop.slice(); car.v = [0, 0]; car.crashes++;
    race.dernier = { type: 'sortie', joueur: race.turn, vise: q.slice(), stop: stop.slice() };
    return race.dernier;
  }

  majAvance(race, car, from, q);
  car.v = [q[0] - from[0], q[1] - from[1]];
  car.p = q.slice();
  car.trail.push(q.slice());
  race.dernier = { type: 'coup', joueur: race.turn };

  // accélérateur : une case de plus dans le sens de la marche
  if (zoneDe(race.track, q[0], q[1]) === 'boost' && (car.v[0] || car.v[1])) {
    if (Math.abs(car.v[0]) >= Math.abs(car.v[1])) car.v[0] += Math.sign(car.v[0]) || 1;
    else car.v[1] += Math.sign(car.v[1]);
    race.dernier = { type: 'boost', joueur: race.turn };
  }

  if (car.tour >= race.laps) {
    car.fini = true;
    if (race.winner === null) race.winner = race.turn;
    race.dernier = { type: 'arrivee', joueur: race.turn };
  }
  return race.dernier;
}

function nextTurn(race) { if (race.winner === null) race.turn = 1 - race.turn; }

// ---------- IA ----------
function apresBoost(tk, p, v) {
  if (zoneDe(tk, p[0], p[1]) !== 'boost' || (!v[0] && !v[1])) return v;
  const w = [v[0], v[1]];
  if (Math.abs(w[0]) >= Math.abs(w[1])) w[0] += Math.sign(w[0]) || 1;
  else w[1] += Math.sign(w[1]);
  return w;
}

function safety(race, p, v) {
  let n = 0;
  const c = zoneDe(race.track, p[0], p[1]);
  const cc = c === 'huile' ? 'huile' : c === 'humide' ? 'humide' : null;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!accelAutorisee(cc, dx, dy, v)) continue;
    const nv = [v[0] + dx, v[1] + dy];
    const np = [p[0] + nv[0], p[1] + nv[1]];
    if (onTrack(race.track, np[0], np[1]) && segOk(race.track, p, np)) n++;
  }
  return n;
}

function survives(race, p0, v0, depth) {
  const tk = race.track;
  const vu = new Set();
  const rec = (p, v, d) => {
    if (d <= 0) return true;
    const k = p[0] + ',' + p[1] + ',' + v[0] + ',' + v[1] + ',' + d;
    if (vu.has(k)) return false;
    vu.add(k);
    const z = zoneDe(tk, p[0], p[1]);
    const cc = z === 'huile' ? 'huile' : z === 'humide' ? 'humide' : null;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!accelAutorisee(cc, dx, dy, v)) continue;
      const nv = [v[0] + dx, v[1] + dy];
      const np = [p[0] + nv[0], p[1] + nv[1]];
      if (!onTrack(tk, np[0], np[1]) || !segOk(tk, p, np)) continue;
      if (rec(np, apresBoost(tk, np, nv), d - 1)) return true;
    }
    return false;
  };
  return rec(p0, v0, depth);
}

const NIVEAUX = {
  tranquille: { horizon: 1, prudence: 1.0, jitter: 4.0, timide: 2.6, vue: 2 },
  normal: { horizon: 3, prudence: 0.4, jitter: 1.2, timide: 0.6, vue: 3 },
  rapide: { horizon: 6, prudence: 0.12, jitter: 0.1, timide: -0.5, vue: 4 }
};

// Meilleur avancement cumulé atteignable en `prof` coups. Le gain du seul coup
// suivant est un mauvais guide : couper à la corde rapporte tout de suite et coûte
// cher deux coups plus loin.
function meilleureAvance(race, p, v, prof, memo) {
  if (prof <= 0) return 0;
  const tk = race.track;
  const k = p[0] + ',' + p[1] + ',' + v[0] + ',' + v[1] + ',' + prof;
  const vu = memo.get(k);
  if (vu !== undefined) return vu;
  const z = zoneDe(tk, p[0], p[1]);
  const cc = z === 'huile' ? 'huile' : z === 'humide' ? 'humide' : null;
  let best = -Infinity;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!accelAutorisee(cc, dx, dy, v)) continue;
    const nv = [v[0] + dx, v[1] + dy];
    const np = [p[0] + nv[0], p[1] + nv[1]];
    if (!onTrack(tk, np[0], np[1]) || !segOk(tk, p, np)) continue;
    const g = progress(tk, p, np) + meilleureAvance(race, np, apresBoost(tk, np, nv), prof - 1, memo);
    if (g > best) best = g;
  }
  if (best === -Infinity) best = -200;   // impasse
  memo.set(k, best);
  return best;
}

function aiChoice(race, level, rnd) {
  rnd = rnd || Math.random;
  const cfg = NIVEAUX[level] || NIVEAUX.normal;
  const car = race.cars[race.turn];
  const valides = choices(race).filter(c => c.ok);
  if (!valides.length) return null;

  const vit = Math.max(Math.abs(car.v[0]), Math.abs(car.v[1]));
  const vueMax = Math.max(2, Math.min(cfg.vue + 2, vit + 2));
  const memo = new Map();

  const notes = valides.map(c => {
    const v0 = [c.p[0] - car.p[0], c.p[1] - car.p[1]];
    const v = apresBoost(race.track, c.p, v0);
    let d = 0;
    while (d < vueMax && survives(race, c.p, v, d + 1)) d++;
    const gain = progress(race.track, car.p, c.p) + meilleureAvance(race, c.p, v, cfg.horizon, memo);
    const immobile = (v0[0] === 0 && v0[1] === 0 && car.v[0] === 0 && car.v[1] === 0) ? -60 : 0;
    const allure = Math.max(Math.abs(v[0]), Math.abs(v[1])) * (cfg.timide || 0);
    return { c, d, sc: gain + safety(race, c.p, v) * cfg.prudence + rnd() * cfg.jitter + immobile - allure };
  });

  for (let seuil = vueMax; seuil >= 1; seuil--) {
    let best = null;
    for (const n of notes) if (n.d >= seuil && (!best || n.sc > best.sc)) best = n;
    if (best) return best.c.p;
  }
  let best = null;
  for (const n of notes) if (!best || n.sc > best.sc) best = n;
  return best.c.p;
}

if (typeof module !== 'undefined') {
  module.exports = {
    TRACKS, COLS, ROWS, onTrack, onTrackF, segOk, centerOf, angleAt, progress, zoneDe,
    startCells, startLine, newRace, champ, avanceDe, projected, choices, crashPoint, play, stuck, nextTurn,
    aiChoice, safety, survives, apresBoost, meilleureAvance, NIVEAUX, collision, latticeOnSegment, arret, setPieges, contrainte
  };
}
