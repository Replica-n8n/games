// ===== Circuit quadrillé : moteur v3 =====
// Dimensions de la course EN COURS (l'interface les lit) ; chaque circuit a
// les siennes (cols, rows), 21 x 26 par défaut. Le moteur, lui, lit toujours
// celles du circuit qu'on lui passe : deux circuits peuvent coexister.
let COLS = 21, ROWS = 26;
const colsDe = (tk) => tk.cols || 21, rowsDe = (tk) => tk.rows || 26;
function dimensions(tk) { COLS = colsDe(tk); ROWS = rowsDe(tk); }

// Un circuit : des rectangles de bitume, moins des îlots.
// ⚠️ Un piège se pose sur une LIGNE DROITE, juste avant un virage, et couvre
// toute la largeur. Posé DANS un virage, il est mortel : sur l'huile on ne tourne
// pas, sur le mouillé on ne fait que freiner, donc la sortie de piste est
// certaine (vu à Monza, Eau Rouge et la Piscine au premier essai : le fantôme
// prudent piétinait devant sans jamais entrer).
// Les PIÈGES (`zones`, des rectangles en cases) : huile (on ne peut pas changer
// de vitesse), humide (on ne peut que freiner), boost (on gagne une case dans le
// sens de la marche en y arrivant). Retirés un temps quand les courses faisaient
// 20 coups ; remis quand un joueur a tout fini en or : sur les vrais circuits ils
// ont la place de compter. Ils font partie du circuit : le par les prend en compte.
const PETITS = [
  {
    id: 'ovale', nom: "L'ovale", outers: [[1, 1, 19, 24]], islands: [[6, 6, 14, 19]],
    depart: { y: 12, x0: 1, x1: 6 }, sens: 1, par: 18
  },
  {
    id: 'epingle', nom: "L'épingle", outers: [[1, 1, 19, 24]], islands: [[5, 5, 15, 12], [10, 11, 15, 20]],
    depart: { y: 8, x0: 1, x1: 5 }, sens: 1, par: 19,
    zones: { humide: [[1, 15, 6, 20]] }
  },
  {
    id: 's', nom: 'Le S', outers: [[1, 1, 19, 24]], islands: [[5, 5, 12, 11], [9, 10, 14, 18]],
    depart: { y: 8, x0: 1, x1: 5 }, sens: 1, par: 17,
    zones: { boost: [[15, 2, 19, 5]] }
  }
];

// Circuits réels ADAPTÉS (2026-09-18) : une ligne centrale et une demi-largeur.
// Chaque virage est exagéré pour rester plus grand que la piste, sinon on passe
// tout droit à travers (vu au prototype : les chicanes de Monza disparaissaient).
// Ligne de départ sur une ligne droite qui MONTE : le moteur compte l'avancement
// vers le haut. Noms de lieux seulement, jamais « F1 » ni « Grand Prix » ; un
// nom de vrai lieu seulement pour un tracé fidèle (les autres ont un nom inventé).
const REELS = [
  {
    id: 'montreal', par: 46, nom: "L'échelle", cols: 42, rows: 80, demi: 2,
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
    depart: { y: 18, x0: 12, x1: 16 },
    // de l'huile juste avant l'épingle (freiner AVANT d'y entrer), un accélérateur
    // sur le Casino ; à l'essai, l'huile placée avant le mur des champions tombait
    // là où le tour parfait roule déjà à vitesse constante : elle ne gênait personne
    zones: { huile: [[23, 54, 29, 60]], boost: [[6, 52, 12, 58]] }
  },
  {
    id: 'spa', par: 61, nom: 'Le fer à cheval', cols: 62, rows: 62, demi: 2,
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
    depart: { y: 44, x0: 6, x1: 10 },
    // la pluie dans la descente vers Eau Rouge, l'aspiration dans Kemmel,
    // l'huile dans Blanchimont juste avant l'arrêt de bus
    zones: { humide: [[15, 20, 21, 25]], boost: [[27, 37, 33, 43]], huile: [[30, 53, 35, 59]] }
  },
  {
    id: 'monaco', par: 52, nom: 'La baie', cols: 54, rows: 70, demi: 2,
    trace: [
      [6, 60], [6, 30], [8, 26], [12, 25], [18, 13], [19, 8], [24, 4], [31, 4], [35, 8],
      [40, 13], [42, 18], [39, 22], [31, 22], [26, 25], [26, 30], [31, 32], [42, 32], [47, 36],
      [49, 44], [47, 52], [42, 57], [37, 57], [34, 63], [29, 63], [25, 60], [21, 63], [17, 66],
      [11, 66], [7, 64]
    ],
    depart: { y: 46, x0: 4, x1: 8 },
    // la pluie dans la ligne droite des stands, l'huile à la sortie du tunnel,
    // juste avant la chicane du port
    zones: { humide: [[3, 36, 9, 41]], huile: [[37, 54, 42, 60]] }
  },
  {
    id: 'monza', par: 37, nom: 'Le canal', cols: 44, rows: 76, demi: 2,
    trace: [
      [8, 68], [8, 22], [8, 18], [15, 15], [15, 10], [16, 6], [22, 4], [26, 4], [29, 10], [33, 10],
      [37, 13], [38, 19], [37, 38], [40, 42], [34, 48], [36, 53], [36, 62], [34, 68], [28, 72],
      [18, 72], [11, 71]
    ],
    depart: { y: 52, x0: 6, x1: 10 },
    // l'aspiration dans la grande ligne droite, l'huile dans la contre-ligne
    // droite, juste avant la Parabolique
    zones: { boost: [[5, 36, 11, 42]], huile: [[33, 54, 39, 59]] }
  },
  // ---- les VRAIS tracés (v11) ----
  // Un joueur : « ton Spa ressemble au Red Bull Ring ». Il avait raison : les quatre
  // tracés ci-dessus, dessinés à la main, ne ressemblaient pas aux vrais. Ils
  // restent (sous des noms inventés : les records des joueurs y sont attachés) et
  // les vrais s'ajoutent, construits par tools/paper-race-traces.js depuis
  // bacinger/f1-circuits (licence MIT, © 2019-2025 Tomislav Bacinger ; licence
  // complète dans tools/donnees/circuits/LICENSE.md) : tournés pour que le départ
  // monte, mis à l'échelle, écartés là où deux bouts de piste se touchaient.
  // Pièges placés par le solveur là où ils pèsent (tools/paper-race-circuits.js).
  {
    id: 'spavrai', par: 59, nom: 'Spa', cols: 58, rows: 88, demi: 2,
    trace: [
      [42, 12], [42, 8], [43, 4], [47, 5], [49, 7], [54, 28], [54, 47], [48, 73], [42, 80], [38, 83],
      [33, 84], [31, 82], [31, 79], [32, 77], [36, 75], [37, 74], [41, 61], [41, 59], [39, 57], [37, 56],
      [34, 56], [22, 63], [20, 63], [16, 61], [8, 64], [5, 62], [4, 58], [5, 56], [9, 53], [15, 51],
      [27, 49], [31, 46], [35, 43], [36, 40], [40, 27], [42, 21]
    ],
    depart: { y: 12, x0: 40, x1: 44 },
    // la pluie dans la descente vers Eau Rouge, l'aspiration dans Kemmel, l'huile
    // avant Blanchimont
    zones: { humide: [[48, 12, 55, 19]], boost: [[51, 34, 57, 40]], huile: [[14, 48, 21, 55]] }
  },
  {
    id: 'monzavrai', par: 43, nom: 'Monza', cols: 44, rows: 79, demi: 2,
    trace: [
      [4, 51], [4, 35], [5, 29], [4, 22], [5, 19], [6, 16], [11, 12], [25, 9], [33, 4], [35, 4],
      [38, 5], [40, 8], [39, 14], [28, 23], [15, 36], [13, 45], [13, 64], [13, 72], [13, 74], [11, 75],
      [8, 75], [6, 74], [4, 73]
    ],
    depart: { y: 51, x0: 2, x1: 6 },
    // l'aspiration dans la grande ligne droite, l'huile avant la Parabolique
    zones: { boost: [[1, 40, 7, 46]], huile: [[10, 63, 17, 70]] }
  },
  {
    id: 'monacovrai', par: 61, nom: 'Monaco', cols: 60, rows: 90, demi: 2,
    trace: [
      [36, 22], [36, 17], [34, 13], [36, 11], [40, 8], [41, 8], [43, 13], [46, 13], [48, 10], [48, 6],
      [53, 4], [54, 5], [56, 7], [55, 12], [49, 27], [42, 36], [36, 41], [15, 51], [12, 53], [11, 56],
      [12, 61], [17, 73], [23, 82], [22, 84], [18, 86], [13, 81], [10, 75], [4, 61], [4, 56], [5, 52],
      [6, 49], [10, 46], [32, 34], [37, 31], [39, 29], [39, 27]
    ],
    depart: { y: 22, x0: 34, x1: 38 },
    // la pluie dans la descente vers le Portier, l'huile avant le Tabac
    zones: { humide: [[51, 11, 58, 18]], huile: [[15, 47, 22, 54]] }
  },
  {
    id: 'montrealvrai', par: 40, nom: 'Montréal', cols: 28, rows: 86, demi: 2,
    trace: [
      [6, 25], [6, 6], [8, 4], [12, 4], [17, 12], [17, 16], [21, 24], [21, 31], [23, 34], [24, 37],
      [23, 44], [22, 51], [18, 57], [15, 61], [13, 64], [12, 68], [11, 78], [10, 80], [8, 82], [5, 80],
      [4, 78], [4, 38], [6, 32]
    ],
    depart: { y: 25, x0: 4, x1: 8 },
    // l'huile avant l'épingle, l'aspiration dans la ligne droite du Casino
    zones: { huile: [[8, 73, 15, 80]], boost: [[1, 55, 7, 61]] }
  }
];
for (const t of REELS) { t.sens = 1; t.outers = []; t.islands = []; }
// LE CHAMPIONNAT : rangé du plus facile au plus dur, dans l'ordre MESURÉ par
// tools/paper-race-difficulte.js (freinages du tour parfait + 3 x accidents d'un
// joueur correct). Ce contrôle échoue si l'ordre n'est plus le bon.
const ORDRE = ['s', 'epingle', 'ovale', 'monza', 'montrealvrai', 'montreal', 'monzavrai', 'monaco', 'monacovrai', 'spavrai', 'spa'];
// Le par SANS pièges (option hors championnat) : le tour parfait n'est pas le même.
// Calculé par le solveur ; paper-race-circuits.js vérifie les deux.
const PAR_SANS_PIEGES = { s: 17, epingle: 19, ovale: 18, monza: 37, montreal: 45, monaco: 50, spa: 61, monzavrai: 41, montrealvrai: 37, monacovrai: 57, spavrai: 56 };
for (const t of PETITS.concat(REELS)) t.parSans = PAR_SANS_PIEGES[t.id];
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

function zoneDe(tk, x, y) {
  if (!tk.zones) return null;
  for (const nom of ['huile', 'humide', 'boost']) {
    const z = tk.zones[nom];
    if (!z) continue;
    for (const r of z) if (dansRect(r, x, y)) return nom;
  }
  return null;
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

// Les petits circuits (5 cases de large, pas de tracé) sont trop étroits pour
// doubler à plusieurs : mesuré, la voiture à la corde du premier virage y gagne
// 50 à 60 % des courses à 4. Ils restent aux courses à deux.
function pelotonPermis(tk) { return !!tk.trace; }

// La grille d'une course à plusieurs : rangées de 2 (jusqu'à 4 voitures) ou de
// 3, 2 cases d'écart entre rangées, la dernière SUR la ligne. Jamais derrière :
// l'avancée y repasserait par l'arrivée et la voiture finirait au premier coup.
function grilleDe(tk, n) {
  if (n === 2) return startCells(tk);
  const d = tk.depart, m = Math.floor((d.x0 + d.x1) / 2);
  const cols = n <= 4 ? [m - 1, m + 1] : [m - 2, m, m + 2];
  const rangs = Math.ceil(n / cols.length), out = [];
  for (let k = 0; k < n; k++) out.push([cols[k % cols.length], d.y - 2 * (rangs - 1 - Math.floor(k / cols.length))]);
  return out;
}

// fin : 'premier' (la course s'arrête au premier arrivé, à deux) ou 'joueur'
// (championnat : on court jusqu'à l'arrivée de la voiture 0, même si le
// fantôme est arrivé avant ; il sort alors de la piste).
// opts.regles = 'grille' : course à plusieurs (2 à 6), grille tirée au sort
// (opts.grille[i] = place de la voiture i), ordre qui tourne, aspiration,
// photo-finish ; la course finit avec le tour de jeu où quelqu'un arrive.
// ⚠️ SANS opts, la course doit rester EXACTEMENT celle de la v7 : c'est le
// championnat (tools/paper-race-reference.js --controle le vérifie).
function newRace(trackIndex, laps, fin, opts) {
  const tk = TRACKS[trackIndex];
  dimensions(tk);
  const o = opts || {};
  if (o.regles === 'grille') return nouvelleGrille(trackIndex, tk, laps, o);
  const st = startCells(tk);
  return {
    ti: trackIndex, track: tk, laps: laps || 1, fin: fin === 'joueur' ? 'joueur' : 'premier',
    regles: 'classique',
    cars: [0, 1].map(i => ({
      p: st[i].slice(), v: [0, 0], trail: [st[i].slice()], pas: [st[i].slice()],
      arc: 0, tour: 0, coups: 0, crashes: 0, fini: false
    })),
    D: champ(tk).portee,
    turn: 0, winner: null, dernier: null
  };
}

// Les pièges sont une OPTION hors championnat : sans eux, la course roule sur une
// copie du circuit sans zones (le circuit d'origine et ses caches ne bougent pas).
function sansPieges(tk) {
  const c = Object.create(tk);
  c.zones = null;
  return c;
}

function nouvelleGrille(trackIndex, tk0, laps, o) {
  const tk = o.pieges === false ? sansPieges(tk0) : tk0;
  const n = o.n || 2;
  if (!(n >= 2 && n <= 6)) throw new Error('de 2 à 6 voitures');
  if (n > 2 && !pelotonPermis(tk)) throw new Error(tk.id + ' : trop étroit pour ' + n + ' voitures');
  const places = grilleDe(tk, n), grille = o.grille || [...Array(n).keys()];
  const L = tk.depart.y;
  const race = {
    ti: trackIndex, track: tk, laps: laps || 1, fin: 'tour', regles: 'grille',
    ordre: o.ordre === 'fixe' ? 'fixe' : 'tourne', n, grille: grille.slice(), pieges: o.pieges !== false,
    cars: grille.map(g => {
      const p = places[g];
      return {
        p: p.slice(), v: [0, 0], trail: [p.slice()], pas: [p.slice()],
        // la rangée de devant part avec son avance, pour le classement
        arc: avanceDe(tk, p) - avanceDe(tk, [p[0], L]), tour: 0, coups: 0, crashes: 0, fini: false
      };
    }),
    D: champ(tk).portee,
    turn: 0, winner: null, dernier: null,
    manche: 0, file: [], arrivees: [], aspires: [], abandons: 0, terminee: false, photo: false
  };
  commencerManche(race);
  return race;
}

// L'ordre qui tourne : au tour de jeu k, la place k mod n ouvre, puis les places
// suivantes. Mesuré : la voiture qui joue la première gagnait 71 % des duels ;
// avec l'ordre qui tourne et l'aspiration, 53 %.
function enCourse(car) { return !car.fini && !car.abandon; }
function commencerManche(race) {
  const n = race.n, k = race.ordre === 'fixe' ? 0 : race.manche % n, file = [];
  for (let j = 0; j < n; j++) {
    const v = race.grille.indexOf((k + j) % n);
    if (enCourse(race.cars[v])) file.push(v);
  }
  if (!file.length) { race.terminee = true; return; }
  race.turn = file.shift(); race.file = file;
}

// Aspiration : en fin de tour de jeu, une voiture qui roule à 2 cases ou moins
// derrière une autre, dans le même sens, gagne une case de vitesse.
function aspiration(race) {
  const gagnants = [];
  race.cars.forEach((me, j) => {
    if (!enCourse(me) || (!me.v[0] && !me.v[1])) return;
    const ok = race.cars.some((o, k) => k !== j && enCourse(o) && o.arc > me.arc &&
      Math.max(Math.abs(o.p[0] - me.p[0]), Math.abs(o.p[1] - me.p[1])) <= 2 &&
      me.v[0] * o.v[0] + me.v[1] * o.v[1] > 0);
    if (ok) gagnants.push(j);
  });
  for (const j of gagnants) {
    const w = race.cars[j].v.slice();
    if (Math.abs(w[0]) >= Math.abs(w[1])) w[0] += Math.sign(w[0]) || 1; else w[1] += Math.sign(w[1]);
    race.cars[j].v = w;
  }
  return gagnants;
}

// Où, sur son dernier segment, la voiture a franchi la ligne (0 = au départ du coup).
function franchissement(race, car) {
  const t = car.trail, a = t[t.length - 2], b = t[t.length - 1], L = race.track.depart.y;
  if (!a || a[1] === b[1]) return 1;
  return Math.max(0, Math.min(1, (a[1] - L) / (a[1] - b[1])));
}

// Classement : les arrivées d'abord (moins de coups, puis la plus tôt sur la
// ligne), puis les autres par avancée ; les abandons en dernier.
function classement(race) {
  const cle = (c) => c.fini ? [0, c.coups, franchissement(race, c)] : c.abandon ? [2, 0, 0] : [1, -c.arc, 0];
  const l = race.cars.map((c, j) => ({ voiture: j, k: cle(c) }));
  l.sort((a, b) => a.k[0] - b.k[0] || a.k[1] - b.k[1] || a.k[2] - b.k[2] || a.voiture - b.voiture);
  const egal = (x, e) => x && x.k[0] === e.k[0] && x.k[1] === e.k[1] && x.k[2] === e.k[2];
  return l.map((e, i) => ({
    voiture: e.voiture, rang: i + 1, fini: race.cars[e.voiture].fini, abandon: !!race.cars[e.voiture].abandon,
    exaequo: egal(l[i - 1], e) || egal(l[i + 1], e)
  }));
}

// Un joueur parti : sa voiture s'arrête là où elle est et reste un obstacle.
function abandon(race, j) {
  const car = race.cars[j];
  if (!car || !enCourse(car)) return;
  car.abandon = true; car.v = [0, 0]; race.abandons++;
  race.file = race.file.filter(v => v !== j);
  if (race.turn === j) nextTurn(race);
}

function coupsJoues(race) {
  return race.cars.reduce((t, c) => t + c.coups, 0) + (race.abandons || 0);
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
// La voiture qui arrête la trajectoire : la PREMIÈRE rencontrée. Une voiture
// arrivée a quitté la piste ; une voiture abandonnée reste un obstacle.
function bloqueur(race, from, to) {
  let best = null, bd = Infinity;
  race.cars.forEach((o, j) => {
    if (j === race.turn || o.fini || !latticeOnSegment(from, to, o.p)) return;
    const d = Math.abs(o.p[0] - from[0]) + Math.abs(o.p[1] - from[1]);
    if (d < bd) { bd = d; best = o; }
  });
  return best;
}
function collision(race, from, to) { return bloqueur(race, from, to) !== null; }

// Contrainte imposée par la case où l'on se trouve.
function contrainte(tk, car) {
  const z = zoneDe(tk, car.p[0], car.p[1]);
  return z === 'huile' || z === 'humide' ? z : null;
}
function contrainteEn(tk, p) {
  const z = zoneDe(tk, p[0], p[1]);
  return z === 'huile' || z === 'humide' ? z : null;
}
// ⚠️ À L'ARRÊT sur un piège, on repart à une case par coup. Sans ça, une voiture
// arrêtée sur l'huile (vitesse figée) ou le mouillé (freiner seulement) ne
// pouvait PLUS JAMAIS repartir : rester sur place était son seul coup. Vu en
// réglant les niveaux du fantôme, qui tournait sans fin ; le défaut datait des
// pièges d'origine (le « coincé » de La croix).
function accelAutorisee(c, dx, dy, v) {
  if (!v[0] && !v[1]) return true;
  if (c === 'huile') return dx === 0 && dy === 0;
  if (c === 'humide') return Math.abs(v[0] + dx) <= Math.abs(v[0]) && Math.abs(v[1] + dy) <= Math.abs(v[1]);
  return true;
}
// l'accélérateur : une case de plus dans le sens de la marche
function apresBoost(tk, p, v) {
  if (zoneDe(tk, p[0], p[1]) !== 'boost' || (!v[0] && !v[1])) return v;
  const w = [v[0], v[1]];
  if (Math.abs(w[0]) >= Math.abs(w[1])) w[0] += Math.sign(w[0]) || 1;
  else w[1] += Math.sign(w[1]);
  return w;
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
      out.push({ p: q, dx, dy, ok: permis && piste && !bloque, bloque, interdit: !permis });
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

// `pas` : la position après chaque coup, même quand on ne bouge pas (le rejeu
// s'en sert pour faire avancer toutes les voitures au même rythme)
function noterPas(car) { if (car.pas) car.pas.push(car.p.slice()); }

function stuck(race) {
  const car = race.cars[race.turn];
  car.coups++; car.v = [0, 0];
  noterPas(car);
  race.dernier = { type: 'coince', joueur: race.turn };
  return race.dernier;
}

function play(race, q) {
  const car = race.cars[race.turn];
  const from = car.p.slice();
  car.coups++;

  if (collision(race, from, q)) {
    const o = bloqueur(race, from, q).p;
    const g = pgcd(q[0] - from[0], q[1] - from[1]);
    const ux = (q[0] - from[0]) / g, uy = (q[1] - from[1]) / g;
    let stop = [o[0] - ux, o[1] - uy];
    if (!onTrack(race.track, stop[0], stop[1]) || !segOk(race.track, from, stop)) stop = from.slice();
    majAvance(race, car, from, stop);
    if (stop[0] !== from[0] || stop[1] !== from[1]) car.trail.push(stop.slice());
    car.p = stop.slice(); car.v = [0, 0];
    noterPas(car);
    race.dernier = { type: 'blocage', joueur: race.turn };
    return race.dernier;
  }

  const ok = onTrack(race.track, q[0], q[1]) && segOk(race.track, from, q);
  if (!ok) {
    const stop = crashPoint(race.track, from, q);
    majAvance(race, car, from, stop);
    car.trail.push(stop.slice());
    car.p = stop.slice(); car.v = [0, 0]; car.crashes++;
    noterPas(car);
    race.dernier = { type: 'sortie', joueur: race.turn, vise: q.slice(), stop: stop.slice() };
    return race.dernier;
  }

  majAvance(race, car, from, q);
  car.v = [q[0] - from[0], q[1] - from[1]];
  car.p = q.slice();
  car.trail.push(q.slice());
  noterPas(car);
  race.dernier = { type: 'coup', joueur: race.turn };
  if (zoneDe(race.track, q[0], q[1]) === 'boost' && (car.v[0] || car.v[1])) {
    car.v = apresBoost(race.track, q, car.v);
    race.dernier = { type: 'boost', joueur: race.turn };
  }

  if (car.tour >= race.laps) {
    car.fini = true;
    if (race.regles === 'grille') race.arrivees.push(race.turn);   // le gagnant se décide en fin de tour de jeu
    else if (race.winner === null) race.winner = race.turn;
    race.dernier = { type: 'arrivee', joueur: race.turn };
  }
  return race.dernier;
}

function finie(race) {
  if (race.regles === 'grille') return race.terminee;
  return race.fin === 'joueur' ? race.cars[0].fini : race.winner !== null;
}

function nextTurn(race) {
  if (race.regles === 'grille') {
    if (race.terminee) return;
    race.file = race.file.filter(v => enCourse(race.cars[v]));
    if (race.file.length) { race.turn = race.file.shift(); return; }
    // fin du tour de jeu : aspiration, puis photo-finish si quelqu'un est arrivé
    race.aspires = aspiration(race);
    if (race.arrivees.length) {
      race.terminee = true; race.photo = race.arrivees.length > 1;
      race.winner = classement(race)[0].voiture;
      return;
    }
    race.manche++;
    commencerManche(race);
    return;
  }
  if (finie(race)) return;
  const autre = 1 - race.turn;
  if (!race.cars[autre].fini) race.turn = autre;
}

// ---------- IA ----------
// ---------- l'ordinateur ----------
// Chaque recherche tient compte des pièges : sur l'huile ou le mouillé, seules
// certaines accélérations existent ; un accélérateur ajoute une case.
const vitesse = (v) => Math.max(Math.abs(v[0]), Math.abs(v[1]));
function suivants(tk, p, v, cap) {
  const cc = contrainteEn(tk, p), out = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!accelAutorisee(cc, dx, dy, v)) continue;
    const nv = [v[0] + dx, v[1] + dy];
    if (cap && vitesse(nv) > cap && vitesse(nv) > vitesse(v)) continue;
    const np = [p[0] + nv[0], p[1] + nv[1]];
    if (!onTrack(tk, np[0], np[1]) || !segOk(tk, p, np)) continue;
    out.push([np, apresBoost(tk, np, nv)]);
  }
  return out;
}

function safety(race, p, v) {
  return suivants(race.track, p, v, 0).length;
}

function survives(race, p0, v0, depth) {
  const tk = race.track;
  const vu = new Set();
  const rec = (p, v, d) => {
    if (d <= 0) return true;
    const k = p[0] + ',' + p[1] + ',' + v[0] + ',' + v[1] + ',' + d;
    if (vu.has(k)) return false;
    vu.add(k);
    for (const [np, nv] of suivants(tk, p, v, 0)) if (rec(np, nv, d - 1)) return true;
    return false;
  };
  return rec(p0, v0, depth);
}

// Les niveaux du fantôme. `vmax` est une LIMITE DE VITESSE : il ne dépasse
// jamais ce nombre de cases par coup. Elle se voit en jouant (on le double dans
// les lignes droites), là où la prudence seule ne changeait presque rien : entre
// « normal » et « vite », 1 à 4 coups d'écart sur 40 à 60 (mesuré, 2026-09-18).
// `distrait` : la part des coups où il prend le DEUXIÈME meilleur coup sûr. Sur
// les petits circuits on ne dépasse guère 3 cases, la limite de vitesse n'y
// mord pas : sans distraction, « normal » y collait à « vite ».
// Les valeurs sont réglées par tools/paper-race-niveaux.js, qui vérifie aussi
// que les niveaux restent bien séparés.
const NIVEAUX = {
  tranquille: { horizon: 1, prudence: 1.0, jitter: 4.0, timide: 2.6, vue: 2, vmax: 2 },
  normal: { horizon: 3, prudence: 0.4, jitter: 1.2, timide: 0.6, vue: 3, vmax: 3, distrait: 0.3 },
  rapide: { horizon: 6, prudence: 0.12, jitter: 0.1, timide: -0.5, vue: 4, vmax: 0 }
};

// Meilleur avancement cumulé atteignable en `prof` coups. Le gain du seul coup
// suivant est un mauvais guide : couper à la corde rapporte tout de suite et coûte
// cher deux coups plus loin.
function meilleureAvance(race, p, v, prof, memo, cap) {
  if (prof <= 0) return 0;
  const tk = race.track;
  const k = p[0] + ',' + p[1] + ',' + v[0] + ',' + v[1] + ',' + prof;
  const vu = memo.get(k);
  if (vu !== undefined) return vu;
  let best = -Infinity;
  for (const [np, nv] of suivants(tk, p, v, cap)) {
    const g = progress(tk, p, np) + meilleureAvance(race, np, nv, prof - 1, memo, cap);
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
  let valides = choices(race).filter(c => c.ok);
  if (!valides.length) return null;
  // la limite de vitesse : on n'accélère pas au-delà (freiner reste toujours permis)
  if (cfg.vmax) {
    const sages = valides.filter(c => { const v = [c.p[0] - car.p[0], c.p[1] - car.p[1]]; return vitesse(v) <= cfg.vmax || vitesse(v) <= vitesse(car.v); });
    if (sages.length) valides = sages;
  }

  const vit = vitesse(car.v);
  const vueMax = Math.max(2, Math.min(cfg.vue + 2, vit + 2));
  const memo = new Map();
  // ⚠️ ne pas faire les cent pas : repasser sur une case où l'on vient d'être est
  // pénalisé. Sans ça, le fantôme tranquille (qui ne voit qu'un coup devant)
  // allait à gauche puis à droite sans fin devant la flaque d'huile de Montréal :
  // près d'une épingle, un pas de côté « avance » un peu, et le retour aussi.
  const recentes = new Set(car.trail.slice(-8).map(q => q[0] + ',' + q[1]));

  const notes = valides.map(c => {
    const v0 = [c.p[0] - car.p[0], c.p[1] - car.p[1]];
    const v = apresBoost(race.track, c.p, v0);
    let d = 0;
    while (d < vueMax && survives(race, c.p, v, d + 1)) d++;
    const gain = progress(race.track, car.p, c.p) + meilleureAvance(race, c.p, v, cfg.horizon, memo, cfg.vmax);
    const immobile = (v0[0] === 0 && v0[1] === 0 && car.v[0] === 0 && car.v[1] === 0) ? -60 : 0;
    const allure = vitesse(v) * (cfg.timide || 0);
    const pietine = recentes.has(c.p[0] + ',' + c.p[1]) && !immobile ? -12 : 0;
    return { c, d, sc: gain + safety(race, c.p, v) * cfg.prudence + rnd() * cfg.jitter + immobile - allure + pietine };
  });

  // la survie est un FILTRE, jamais un objectif : sinon l'arrêt devient le plus sûr
  for (let seuil = vueMax; seuil >= 1; seuil--) {
    const surs = notes.filter(n => n.d >= seuil).sort((a, b) => b.sc - a.sc);
    if (!surs.length) continue;
    if (cfg.distrait && surs.length > 1 && rnd() < cfg.distrait) return surs[1].c.p;
    return surs[0].c.p;
  }
  let best = null;
  for (const n of notes) if (!best || n.sc > best.sc) best = n;
  return best.c.p;
}

if (typeof module !== 'undefined') {
  module.exports = {
    TRACKS, get COLS() { return COLS; }, get ROWS() { return ROWS; }, dimensions, distTrace, finie,
    onTrack, onTrackF, segOk, progress,
    startCells, startLine, newRace, grilleDe, pelotonPermis, classement, abandon, coupsJoues, bloqueur, franchissement, champ, avanceDe, projected, choices, crashPoint, play, stuck, nextTurn,
    aiChoice, safety, survives, meilleureAvance, NIVEAUX, zoneDe, contrainte, accelAutorisee, apresBoost, collision, latticeOnSegment, arret
  };
}
