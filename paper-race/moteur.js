// ===== Circuit quadrillé : moteur v3 =====
// Dimensions de la course EN COURS (l'interface les lit) ; chaque circuit a
// les siennes (cols, rows), 21 x 26 par défaut. Le moteur, lui, lit toujours
// celles du circuit qu'on lui passe : deux circuits peuvent coexister.
let COLS = 21, ROWS = 26;
const colsDe = (tk) => tk.cols || 21, rowsDe = (tk) => tk.rows || 26;
function dimensions(tk) { COLS = colsDe(tk); ROWS = rowsDe(tk); }

// Un circuit : des rectangles de bitume, moins des îlots.
// Les pièges (huile, flaques, accélérateurs) ont été retirés le 2026-09-18 :
// sur des courses d'une vingtaine de coups, ils ne changeaient rien.
const PETITS = [
  {
    id: 'ovale', nom: "L'ovale", outers: [[1, 1, 19, 24]], islands: [[6, 6, 14, 19]],
    depart: { y: 12, x0: 1, x1: 6 }, sens: 1, par: 18
  },
  {
    id: 'epingle', nom: "L'épingle", outers: [[1, 1, 19, 24]], islands: [[5, 5, 15, 12], [10, 11, 15, 20]],
    depart: { y: 8, x0: 1, x1: 5 }, sens: 1, par: 19
  },
  {
    id: 's', nom: 'Le S', outers: [[1, 1, 19, 24]], islands: [[5, 5, 12, 11], [9, 10, 14, 18]],
    depart: { y: 8, x0: 1, x1: 5 }, sens: 1, par: 17
  }
];

// Circuits réels ADAPTÉS (2026-09-18) : une ligne centrale et une demi-largeur.
// Chaque virage est exagéré pour rester plus grand que la piste, sinon on passe
// tout droit à travers (vu au prototype : les chicanes de Monza disparaissaient).
// Ligne de départ sur une ligne droite qui MONTE : le moteur compte l'avancement
// vers le haut. Noms de lieux seulement, jamais « F1 » ni « Grand Prix ».
const REELS = [
  {
    id: 'montreal', par: 45, nom: 'Montréal', cols: 42, rows: 80, demi: 2,
    trace: [
      [14, 22], [14, 12],             // ligne droite des stands
      [12, 7], [16, 4], [22, 5],      // Senna : gauche puis droite
      [26, 9],                        // vers le bas
      [26, 20], [34, 24], [34, 28], [26, 32], // chicane
      [26, 40], [34, 44], [34, 48], [26, 52], // chicane
      [26, 62],
      [25, 70], [20, 74], [14, 74], [9, 70],  // l'épingle
      [9, 32],                        // la ligne droite du Casino
      [14, 28]                        // la dernière chicane (mur des champions)
    ],
    depart: { y: 18, x0: 12, x1: 16 }
  },
  {
    id: 'spa', par: 61, nom: 'Spa', cols: 62, rows: 62, demi: 2,
    trace: [
      [8, 52], [8, 14],               // ligne droite des stands
      [9, 9], [13, 7], [17, 10], [18, 16], // la Source, épingle à droite
      [18, 28],                       // la descente
      [16, 33], [19, 38], [25, 40],   // Eau Rouge et le Raidillon
      [36, 40],                       // Kemmel
      [40, 36], [44, 32], [44, 26],   // les Combes
      [43, 14],                       // Malmedy
      [44, 8], [48, 5], [52, 8], [52, 14], // Rivage
      [53, 22], [57, 28],             // Pouhon
      [57, 40], [55, 48],             // Stavelot
      [50, 54], [36, 56],             // Blanchimont
      [27, 57], [22, 51], [17, 51], [13, 56] // l'arrêt de bus
    ],
    depart: { y: 44, x0: 6, x1: 10 }
  },
  {
    id: 'monaco', par: 50, nom: 'Monaco', cols: 54, rows: 70, demi: 2,
    trace: [
      [6, 60], [6, 30], [8, 26], [12, 25], [18, 13], [19, 8], [24, 4], [31, 4], [35, 8],
      [40, 13], [42, 18], [39, 22], [31, 22], [26, 25], [26, 30], [31, 32], [42, 32], [47, 36],
      [49, 44], [47, 52], [42, 57], [37, 57], [34, 63], [29, 63], [25, 60], [21, 63], [17, 66],
      [11, 66], [7, 64]
    ],
    depart: { y: 46, x0: 4, x1: 8 }
  },
  {
    id: 'monza', par: 37, nom: 'Monza', cols: 44, rows: 76, demi: 2,
    trace: [
      [8, 68], [8, 22], [8, 18], [15, 15], [15, 10], [16, 6], [22, 4], [26, 4], [29, 10], [33, 10],
      [37, 13], [38, 19], [37, 38], [40, 42], [34, 48], [36, 53], [36, 62], [34, 68], [28, 72],
      [18, 72], [11, 71]
    ],
    depart: { y: 52, x0: 6, x1: 10 }
  }
];
for (const t of REELS) { t.sens = 1; t.outers = []; t.islands = []; }
// LE CHAMPIONNAT : rangé du plus facile au plus dur, dans l'ordre MESURÉ par
// tools/paper-race-difficulte.js (freinages du tour parfait + 3 x accidents d'un
// joueur correct). Ce contrôle échoue si l'ordre n'est plus le bon.
const ORDRE = ['s', 'epingle', 'ovale', 'monza', 'montreal', 'monaco', 'spa'];
const TRACKS = ORDRE.map(id => PETITS.concat(REELS).find(t => t.id === id));

function dansRect(r, x, y, e) {
  e = e || 0;
  return x >= r[0] - e && x <= r[2] + e && y >= r[1] - e && y <= r[3] + e;
}
function strictement(r, x, y, e) {
  e = e || 0;
  return x > r[0] + e && x < r[2] - e && y > r[1] + e && y < r[3] - e;
}

// Un circuit est soit une union de RECTANGLES moins des îlots, soit un TRACÉ :
// une ligne centrale fermée et une demi-largeur (`trace`, `demi`). Pour un
// tracé, « sur la piste » = à au plus `demi` de la ligne centrale, lu dans un
// masque calculé une fois au 1/8 de case.
const FIN = 8;
function distTrace(tk, x, y) {
  const P = tk.trace; let m = 1e9;
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
    let t = L ? ((x - a[0]) * dx + (y - a[1]) * dy) / L : 0;
    t = Math.max(0, Math.min(1, t));
    const ex = a[0] + t * dx - x, ey = a[1] + t * dy - y, d = ex * ex + ey * ey;
    if (d < m) m = d;
  }
  return Math.sqrt(m);
}
function masque(tk) {
  if (tk._masque) return tk._masque;
  const W = colsDe(tk) * FIN + 1, H = rowsDe(tk) * FIN + 1, M = new Uint8Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) M[j * W + i] = distTrace(tk, i / FIN, j / FIN) <= tk.demi ? 1 : 0;
  tk._masque = { M, W, H };
  return tk._masque;
}
function surTrace(tk, x, y) {
  const m = masque(tk), i = Math.round(x * FIN), j = Math.round(y * FIN);
  if (i < 0 || j < 0 || i >= m.W || j >= m.H) return false;
  return m.M[j * m.W + i] === 1;
}

function onTrack(tk, x, y) {
  if (x < 0 || x > colsDe(tk) || y < 0 || y > rowsDe(tk)) return false;
  if (tk.trace) return surTrace(tk, x, y);
  let dedans = false;
  for (const r of tk.outers) if (dansRect(r, x, y)) { dedans = true; break; }
  if (!dedans) return false;
  for (const r of tk.islands) if (strictement(r, x, y)) return false;
  return true;
}

function onTrackF(tk, x, y) {
  if (tk.trace) return surTrace(tk, x, y);
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

// Position le long de la boucle, de 0 (ligne de départ) à 1000 (juste avant de la repasser).
// On mesure la distance à la ligne dans les deux sens, la ligne servant de coupure ;
// le rapport des deux donne un repère qui progresse vraiment, même dans les virages larges.
function champ(tk) {
  if (tk._champ) return tk._champ;
  const COLS = colsDe(tk), ROWS = rowsDe(tk);
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
  if (p[0] < 0 || p[0] > colsDe(tk) || p[1] < 0 || p[1] > rowsDe(tk)) return 0;
  return c.val[c.idx(p[0], p[1])];
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

// fin : 'premier' (la course s'arrête au premier arrivé, à deux) ou 'joueur'
// (championnat : on court jusqu'à l'arrivée de la voiture 0, même si le
// fantôme est arrivé avant ; il sort alors de la piste).
function newRace(trackIndex, laps, fin) {
  const tk = TRACKS[trackIndex];
  dimensions(tk);
  const st = startCells(tk);
  return {
    ti: trackIndex, track: tk, laps: laps || 1, fin: fin === 'joueur' ? 'joueur' : 'premier',
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
  const autre = race.cars[1 - race.turn];
  if (autre.fini) return false;   // une voiture arrivée a quitté la piste
  return latticeOnSegment(from, to, autre.p);
}

function choices(race) {
  const car = race.cars[race.turn];
  const pr = projected(car);
  const out = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const q = [pr[0] + dx, pr[1] + dy];
      const piste = onTrack(race.track, q[0], q[1]) && segOk(race.track, car.p, q);
      const bloque = piste && collision(race, car.p, q);
      out.push({ p: q, dx, dy, ok: piste && !bloque, bloque: bloque });
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

  if (car.tour >= race.laps) {
    car.fini = true;
    if (race.winner === null) race.winner = race.turn;
    race.dernier = { type: 'arrivee', joueur: race.turn };
  }
  return race.dernier;
}

function finie(race) {
  return race.fin === 'joueur' ? race.cars[0].fini : race.winner !== null;
}

function nextTurn(race) {
  if (finie(race)) return;
  const autre = 1 - race.turn;
  if (!race.cars[autre].fini) race.turn = autre;
}

// ---------- IA ----------
function safety(race, p, v) {
  let n = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
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
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nv = [v[0] + dx, v[1] + dy];
      const np = [p[0] + nv[0], p[1] + nv[1]];
      if (!onTrack(tk, np[0], np[1]) || !segOk(tk, p, np)) continue;
      if (rec(np, nv, d - 1)) return true;
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
  let best = -Infinity;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const nv = [v[0] + dx, v[1] + dy];
    const np = [p[0] + nv[0], p[1] + nv[1]];
    if (!onTrack(tk, np[0], np[1]) || !segOk(tk, p, np)) continue;
    const g = progress(tk, p, np) + meilleureAvance(race, np, nv, prof - 1, memo);
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
    const v = v0;
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
    TRACKS, get COLS() { return COLS; }, get ROWS() { return ROWS; }, dimensions, distTrace, finie,
    onTrack, onTrackF, segOk, progress,
    startCells, startLine, newRace, champ, avanceDe, projected, choices, crashPoint, play, stuck, nextTurn,
    aiChoice, safety, survives, meilleureAvance, NIVEAUX, collision, latticeOnSegment, arret
  };
}
