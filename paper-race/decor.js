// ===== Paper Race : le DÉCOR hors piste, en papier découpé (1.11.0) =====
// Son choix sur la maquette tools/maquette-paper-race-decors.html (d'après les
// plateaux du jeu de société Heat) : de vrais lieux autour de la piste, découpés
// dans du papier de couleur et collés sur la feuille, avec leur petite ombre.
// Chargé après rendu.js : terrainTrace et buildTerrain l'appellent (s'il est là :
// Pages peut servir quelques minutes l'ancien HTML, qui ne charge pas ce fichier).
//
// Le PLAN (où vont la mer, la ville, la forêt) se calcule une fois par circuit, en
// cases, et ne dépend ni de l'écran ni du style. Le DESSIN se fait directement dans
// le décor du jeu, sans toile intermédiaire : sur un grand circuit, chacune pèse
// jusqu'à 18 Mo sur un téléphone. ⚠️ Rien ne s'approche de la piste (au moins 1,4
// case au-delà du bord), le quadrillage passe par-dessus, et pendant le ralenti
// (`fenetre`) on ne peint que la zone utile.

// le thème de chaque circuit : son lieu
const THEMES = {
  monacovrai: 'mer', monaco: 'mer',          // la mer, le port, la ville
  spavrai: 'foret', spa: 'foret',            // les Ardennes
  monzavrai: 'parc', monza: 'parc',          // le parc et ses lacs
  montrealvrai: 'ile', montreal: 'ile',      // l'île au milieu du fleuve
  s: 'campagne', epingle: 'campagne', ovale: 'campagne'
};
const TITRES_PLAN = {};

// bruit lisse (valeurs sur une grille, interpolées)
function bruitDecor(seed) {
  const h = (x, y) => { let n = (x * 374761393 + y * 668265263 + seed * 982451653) | 0; n = (n ^ (n >>> 13)) * 1274126177 | 0; return ((n ^ (n >>> 16)) >>> 0) / 4294967295; };
  const lisse = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = lisse(x - x0), fy = lisse(y - y0);
    const a = h(x0, y0), b = h(x0 + 1, y0), c = h(x0, y0 + 1), d = h(x0 + 1, y0 + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}

// La distance (en cases) du centre de chaque case au BORD de la piste : exacte pour
// un tracé, par propagation pour un circuit en rectangles.
function distancesAuBord(tk) {
  const W = colsDe(tk), H = rowsDe(tk), d = new Float32Array(W * H);
  if (tk.trace) { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) d[y * W + x] = distTrace(tk, x + 0.5, y + 0.5) - tk.demi; return d; }
  d.fill(1e9);
  const file = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (onTrackF(tk, x + 0.5, y + 0.5)) { d[y * W + x] = -0.5; file.push(y * W + x); }
  // deux passes de chanfrein (1 et 1,414) : assez juste pour poser des arbres
  for (let pass = 0; pass < 2; pass++) {
    const ordre = pass ? [...Array(W * H).keys()].reverse() : [...Array(W * H).keys()];
    for (const i of ordre) {
      const x = i % W, y = (i / W) | 0;
      for (const [dx, dy, w] of [[-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1], [-1, -1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [1, 1, 1.414]]) {
        const a = x + dx, b = y + dy; if (a < 0 || b < 0 || a >= W || b >= H) continue;
        const v = d[b * W + a] + w; if (v < d[i]) d[i] = v;
      }
    }
  }
  return d;
}

function planDecor(tk) {
  if (tk._plan) return tk._plan;
  const W = colsDe(tk), H = rowsDe(tk), theme = THEMES[tk.id] || 'campagne';
  let graine = 7; for (const ch of tk.id) graine = (graine * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = alea(graine), n1 = bruitDecor(graine % 997), n2 = bruitDecor((graine >> 3) % 991);
  const idx = (x, y) => y * W + x, d = distancesAuBord(tk);
  const LIBRE = 1.4;
  const libre = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d[idx(x, y)] > LIBRE;
  // dehors (relié au bord de la feuille) ou dedans (enclos par la piste)
  const zone = new Int8Array(W * H), file = [];
  const graineZ = (x, y) => { if (libre(x, y) && !zone[idx(x, y)]) { zone[idx(x, y)] = 1; file.push([x, y]); } };
  for (let x = 0; x < W; x++) { graineZ(x, 0); graineZ(x, H - 1); }
  for (let y = 0; y < H; y++) { graineZ(0, y); graineZ(W - 1, y); }
  for (let t = 0; t < file.length; t++) { const [x, y] = file[t]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) graineZ(x + dx, y + dy); }
  for (let i = 0; i < W * H; i++) if (!zone[i] && d[i] > LIBRE) zone[i] = 2;

  const P = { W, H, eau: new Uint8Array(W * H), parc: new Uint8Array(W * H), champ: new Uint8Array(W * H),
    batiments: [], arbres: [], bateaux: [], pontons: [], tentes: [], tribunes: [] };
  // rien sur les panneaux de vitesse : ils doivent rester nets
  const pans = (tk.panneaux || []).map(p => [p[3], p[4]]);
  const pris = pans.map(p => p.slice());
  const loin = (x, y, r) => pris.every(q => Math.hypot(q[0] - x, q[1] - y) >= r);
  const prendre = (x, y) => pris.push([x, y]);
  const surSol = (x, y) => { const i = idx(Math.floor(x), Math.floor(y)); return x >= 0 && y >= 0 && x < W && y < H && zone[i] && !P.eau[i]; };
  const arbre = (x, y, r, sorte, ecart) => { if (surSol(x, y) && d[idx(Math.floor(x), Math.floor(y))] > LIBRE + 0.3 && loin(x, y, ecart)) { prendre(x, y); P.arbres.push({ x, y, r, sorte }); } };
  const maison = (x, y, w, h, c, extra) => {
    if (!surSol(x, y) || d[idx(Math.floor(x), Math.floor(y))] < LIBRE + 0.7 || !loin(x, y, Math.max(w, h) * 0.8 + 0.4)) return false;
    prendre(x, y); P.batiments.push(Object.assign({ x, y, w, h, rot: (rnd() - 0.5) * 0.25, c }, extra || {})); return true;
  };

  if (theme === 'mer' || theme === 'ile') {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = idx(x, y); if (zone[i] !== 1) continue;
      // la mer à l'est (Monaco) ; le fleuve tout autour de l'île (Montréal)
      if (theme === 'mer' ? x / W + 0.22 * (n1(x * 0.09, y * 0.09) - 0.5) > 0.7 : d[i] > 5 + 3 * n1(x * 0.12, y * 0.12)) P.eau[i] = 1;
    }
  }
  if (theme === 'foret') {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = idx(x, y); if (!zone[i]) continue;
      if (zone[i] === 1 && n2(x * 0.06, y * 0.06) > 0.74) P.eau[i] = 1;
      else if (n1(x * 0.07, y * 0.07) > 0.67) P.champ[i] = 1;
      else P.parc[i] = 1;
    }
  } else {
    for (let i = 0; i < W * H; i++) if (zone[i] && !P.eau[i]) P.parc[i] = 1;
    if (theme === 'parc') for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = idx(x, y); if (zone[i] === 1 && d[i] > 3 && n2(x * 0.08, y * 0.08) > 0.75) { P.eau[i] = 1; P.parc[i] = 0; } }
  }

  // la côte : des pontons et des bateaux, puis des palmiers
  const cote = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = idx(x, y); if (!P.eau[i]) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !P.eau[idx(x + a, y + b)])) cote.push([x, y]);
  }
  if (theme === 'mer') {
    for (const [x, y] of cote) if (rnd() < 0.05 && d[idx(x, y)] < 14) {
      const L = 3 + Math.floor(rnd() * 3);
      P.pontons.push({ x: x + 0.5, y: y + 0.5, L });
      for (let k = 1; k < L; k++) if (rnd() < 0.8) P.bateaux.push({ x: x + 0.5 + k, y: y + 0.5 + (k % 2 ? 0.85 : -0.85), a: 0, L: 1.4 + rnd() * 0.7 });
    }
  }
  const nbBateaux = theme === 'mer' ? 46 : theme === 'ile' ? 14 : 5;
  for (let k = 0; k < 1500 && P.bateaux.length < nbBateaux && cote.length; k++) {
    const [x, y] = cote[Math.floor(rnd() * cote.length)];
    const bx = x + 0.5 + (rnd() - 0.5) * 8, by = y + 0.5 + (rnd() - 0.5) * 8, i = idx(Math.floor(bx), Math.floor(by));
    if (bx < 1 || by < 1 || bx >= W - 1 || by >= H - 1 || !P.eau[i] || !loin(bx, by, 2.2)) continue;
    const autour = [[1.5, 0], [-1.5, 0], [0, 1.2], [0, -1.2]].every(([a, b]) => P.eau[idx(Math.floor(bx + a), Math.floor(by + b))]);
    if (!autour) continue;
    prendre(bx, by); P.bateaux.push({ x: bx, y: by, a: (rnd() - 0.5) * 0.8, L: 1.2 + rnd() * 1.3 });
  }
  if (theme === 'mer' || theme === 'ile') for (const [x, y] of cote) if (rnd() < 0.14) {
    for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const tx = x + a + 0.5, ty = y + b + 0.5; if (!P.eau[idx(x + a, y + b)]) { arbre(tx, ty, 0.7, theme === 'mer' ? 'palmier' : 'feuillu', 1.6); break; } }
  }

  // la ville, le village, les maisons
  if (theme === 'mer') {
    for (let y = 0; y < H; y += 2.6) for (let x = 0; x < W; x += 2.6) {
      const cx = x + 1.3 + (rnd() - 0.5) * 0.6, cy = y + 1.3 + (rnd() - 0.5) * 0.6;
      if (cx >= W || cy >= H) continue;
      const dd = d[idx(Math.floor(cx), Math.floor(cy))];
      if (dd < 2 || dd > 8 + 5 * n2(cx * 0.1, cy * 0.1) || n1(cx * 0.2 + 9, cy * 0.2) < 0.32 || rnd() < 0.25) continue;
      const grand = rnd() < 0.2;
      maison(cx, cy, grand ? 2.4 : 1.4 + rnd() * 0.6, grand ? 1.8 : 1.3 + rnd() * 0.5, Math.floor(rnd() * 4));
    }
  } else if (theme === 'ile' || theme === 'parc' || theme === 'campagne') {
    const nb = theme === 'campagne' ? 6 : 14;
    for (let k = 0; k < 3000 && P.batiments.length < nb; k++) {
      const x = 1 + rnd() * (W - 2), y = 1 + rnd() * (H - 2);
      maison(x, y, 1.3 + rnd() * 0.5, 1.1 + rnd() * 0.4, Math.floor(rnd() * 4));
    }
  }
  // le grand bâtiment du lieu, dans la plus grande boucle : le casino (dôme), une villa
  let best = -1, bi = -1;
  for (let i = 0; i < W * H; i++) if (zone[i] === 2 && !P.eau[i] && d[i] > best) { best = d[i]; bi = i; }
  if (bi >= 0 && best > 2.6 && theme !== 'foret') {
    const cx = bi % W + 0.5, cy = Math.floor(bi / W) + 0.5;
    P.batiments = P.batiments.filter(b => Math.hypot(b.x - cx, b.y - cy) > 2.8);
    if (loin(cx, cy, 1.5)) P.batiments.push({ x: cx, y: cy, w: theme === 'campagne' ? 2.4 : 3.4, h: theme === 'campagne' ? 1.8 : 2.4, rot: 0, c: 4, dome: theme === 'mer' });
  }
  if (theme === 'foret') {
    // le village dans un champ près de la piste, le camping près d'une ligne droite
    const champs = []; for (let i = 0; i < W * H; i++) if (P.champ[i] && d[i] < 10) champs.push(i);
    const c0 = champs[Math.floor(champs.length / 2)];
    if (c0 != null) {
      const vx = c0 % W, vy = Math.floor(c0 / W);
      for (let k = 0; k < 400 && P.batiments.length < 14; k++) maison(vx + (rnd() - 0.5) * 12, vy + (rnd() - 0.5) * 12, 1.2 + rnd() * 0.5, 1 + rnd() * 0.4, Math.floor(rnd() * 4));
      maison(vx + 0.5, vy - 2, 1, 2.2, 5, { clocher: true });
    }
    let t0 = null;
    for (let k = 0; k < 5000 && P.tentes.length < 12; k++) {
      const x = rnd() * W, y = rnd() * H, i = idx(Math.floor(x), Math.floor(y));
      if (!surSol(x, y) || d[i] < 2 || d[i] > 4 || !loin(x, y, 1.3)) continue;
      if (t0 && Math.hypot(t0[0] - x, t0[1] - y) > 6) continue;
      if (!t0) t0 = [x, y];
      prendre(x, y); P.tentes.push({ x, y, c: Math.floor(rnd() * 4) });
    }
  }

  // les tribunes : le long de la ligne droite des stands (et des deux plus longues)
  const dep = tk.depart, mx = (dep.x0 + dep.x1) / 2;
  const essaieTribune = (cx, cy, L, ux, uy, nx, ny) => {
    for (let t = -L / 2; t <= L / 2; t += 0.5) for (const e of [-0.75, 0.75]) {
      const x = cx + ux * t + nx * e, y = cy + uy * t + ny * e;
      if (!libre(Math.floor(x), Math.floor(y)) || P.eau[idx(Math.floor(x), Math.floor(y))]) return false;
    }
    if (pans.some(p => Math.hypot(p[0] - cx, p[1] - cy) < L / 2 + 1)) return false;
    P.tribunes.push({ x: cx, y: cy, L, ang: Math.atan2(uy, ux), nx, ny });
    const vide = (b) => !(Math.abs((b.x - cx) * ux + (b.y - cy) * uy) < L / 2 + 1.2 && Math.abs((b.x - cx) * nx + (b.y - cy) * ny) < 2.2);
    P.batiments = P.batiments.filter(vide); P.arbres = P.arbres.filter(vide); P.tentes = P.tentes.filter(vide);
    prendre(cx, cy);
    return true;
  };
  if (tk.trace) {
    const T = tk.trace, segs = [];
    for (let i = 0; i < T.length; i++) { const a = T[i], b = T[(i + 1) % T.length]; segs.push({ a, b, L: Math.hypot(b[0] - a[0], b[1] - a[1]) }); }
    const dseg = (p, s) => { const dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1], L = dx * dx + dy * dy; let t = L ? ((p[0] - s.a[0]) * dx + (p[1] - s.a[1]) * dy) / L : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(s.a[0] + t * dx - p[0], s.a[1] + t * dy - p[1]); };
    const stand = segs.reduce((m, s) => { const t = dseg([mx, dep.y], s); return t < m.t ? { s, t } : m; }, { t: 1e9 }).s;
    for (const s of [stand, ...segs.filter(s => s !== stand).sort((u, v) => v.L - u.L).slice(0, 2)]) {
      const ux = (s.b[0] - s.a[0]) / s.L, uy = (s.b[1] - s.a[1]) / s.L, L = Math.min(9, s.L * 0.6);
      for (const c of [1, -1]) { const nx = -uy * c, ny = ux * c, off = tk.demi + 2.1; if (essaieTribune((s.a[0] + s.b[0]) / 2 + nx * off, (s.a[1] + s.b[1]) / 2 + ny * off, L, ux, uy, nx, ny)) break; }
    }
  } else {
    // circuit en rectangles : la ligne droite du départ monte ; la tribune dans l'îlot
    for (const [cx, nx] of [[dep.x1 + 1.7, 1], [dep.x0 - 1.7, -1]]) if (essaieTribune(cx, dep.y - 2.5, 5, 0, -1, nx, 0)) break;
  }

  // les arbres : la forêt, les jardins et les collines
  const sapins = theme === 'foret';
  if (sapins) {
    for (let y = 0; y < H; y += 1.25) for (let x = (Math.round(y / 1.25) % 2) * 0.6; x < W; x += 1.25) {
      const tx = x + (rnd() - 0.5) * 0.6, ty = y + (rnd() - 0.5) * 0.6;
      if (tx < 0 || ty < 0 || tx >= W || ty >= H || !P.parc[idx(Math.floor(tx), Math.floor(ty))]) continue;
      arbre(tx, ty, 0.55 + rnd() * 0.3, rnd() < 0.8 ? 'sapin' : 'feuillu', 1);
    }
  } else {
    const essais = W * H * (theme === 'campagne' ? 0.9 : 0.5);
    for (let k = 0; k < essais; k++) {
      const x = rnd() * W, y = rnd() * H, i = idx(Math.floor(x), Math.floor(y));
      if (!P.parc[i]) continue;
      arbre(x, y, 0.55 + rnd() * 0.35, 'feuillu', d[i] > 9 ? 1.15 : 1.9);
    }
  }
  P.titre = tk.nom;
  P.d = d;
  tk._plan = P;
  return P;
}

// ---------- le dessin, en papier découpé ----------
const SOL_DECOR = { parc: '#78B65E', champ: '#E2C35C', eau: '#4C9BD3' };
const MURS_DECOR = ['#F2E4C9', '#EAD2B3', '#F6EEE0', '#E4C8A8', '#F8F1E2', '#F0E0C6'];
const TOITS_DECOR = ['#C9643F', '#B5523A', '#D88A4F', '#8E5A3C', '#5B7FA6', '#6B6B6B'];
const PUBLIC_DECOR = ['#E8452C', '#F29A2E', '#3D95E6', '#8A4FD0', '#E84F9A', '#2BAA6E'];
function nuanceHex(hex, k) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, v = (n >> 8) & 255, b = n & 255;
  const f = (c) => Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k));
  return `rgb(${f(r)},${f(v)},${f(b)})`;
}

// Peint le décor dans `c` (le décor du jeu, en px de la carte). ⚠️ Appelé APRÈS
// l'herbe et AVANT le sable et la piste : la piste reste par-dessus tout ce qui
// déborderait, et le quadrillage passe encore au-dessus.
function dessinerDecor(c, tk) {
  const P = planDecor(tk), C = cellPx, W = P.W, H = P.H;
  // pendant le ralenti, on ne peint que la zone (et un peu autour)
  const vu = fenetre
    ? (x, y, m) => gx(x) > fenetre.x - m * C && gx(x) < fenetre.x + fenetre.w + m * C && gy(y) > fenetre.y - m * C && gy(y) < fenetre.y + fenetre.h + m * C
    : () => true;
  // 1. les grandes surfaces : des ronds pleins par case (leur union est nette), une
  //    ombre décalée d'abord, d'une teinte opaque (des ombres transparentes qui se
  //    chevauchent feraient des taches plus sombres)
  const ronds = (grille, ox, oy) => {
    c.beginPath();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grille[y * W + x] && vu(x + 0.5, y + 0.5, 2)) {
      const X = gx(x + 0.5) + ox, Y = gy(y + 0.5) + oy; c.moveTo(X + C * 0.86, Y); c.arc(X, Y, C * 0.86, 0, 6.2832);
    }
  };
  for (const [nom, grille] of [['parc', P.parc], ['champ', P.champ], ['eau', P.eau]]) {
    if (!grille.some(v => v)) continue;
    ronds(grille, C * 0.18, C * 0.22); c.fillStyle = nom === 'eau' ? '#3A6E91' : 'rgba(60,80,50,0.22)'; c.fill();
    ronds(grille, 0, 0); c.fillStyle = SOL_DECOR[nom]; c.fill();
    if (nom === 'eau') {
      // des vaguelettes de papier plus clair
      c.save(); ronds(grille, 0, 0); c.clip();
      const r = alea(321); c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = Math.max(1.2, C * 0.16); c.lineCap = 'round';
      for (let k = 0; k < W * H * 0.06; k++) {
        const x = r() * W, y = r() * H; if (!grille[Math.floor(y) * W + Math.floor(x)] || !vu(x, y, 2)) continue;
        c.beginPath(); c.moveTo(gx(x), gy(y)); c.quadraticCurveTo(gx(x + 0.6), gy(y - 0.35), gx(x + 1.2), gy(y)); c.stroke();
      }
      c.restore();
    }
  }
  const ombre = (f) => { c.save(); c.translate(C * 0.12, C * 0.16); c.globalAlpha = 0.25; f('#000'); c.restore(); f(null); };
  // le coucher de soleil (scene.js) : de longues ombres vers l'est, le soleil est bas à
  // l'ouest. ⚠️ Toutes dans UN chemin rempli une fois : des ombres transparentes qui se
  // croisent feraient des taches plus sombres.
  if (typeof R !== 'undefined' && R && R.ciel && R.ciel.heure === 'couchant') {
    const dx = 2.6 * C, dy = 1.1 * C;
    const poly = (pts) => { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } if (a < 0) pts.reverse(); c.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) c.lineTo(p[0], p[1]); c.closePath(); };
    const balaye = (coins) => { // un polygone et sa copie poussée vers l'est, plus les quatre côtés qui les relient
      const loin = coins.map(([x, y]) => [x + dx, y + dy]);
      poly(coins.slice()); poly(loin.slice());
      for (let i = 0; i < coins.length; i++) { const j = (i + 1) % coins.length; poly([coins[i], coins[j], loin[j], loin[i]]); }
    };
    const rect = (x, y, w, h, a) => { const ca = Math.cos(a), sa = Math.sin(a); return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([u, v]) => [x + u * ca - v * sa, y + u * sa + v * ca]); };
    c.beginPath();
    for (const b of P.batiments) if (vu(b.x, b.y, 5)) balaye(rect(gx(b.x), gy(b.y), b.w * C, b.h * C, b.rot));
    for (const t of P.tribunes) if (vu(t.x, t.y, t.L + 4)) balaye(rect(gx(t.x), gy(t.y), t.L * C, 1.5 * C, t.ang));
    for (const t of P.tentes) if (vu(t.x, t.y, 4)) balaye(rect(gx(t.x), gy(t.y), C * 0.8, C * 0.8, 0));
    for (const a of P.arbres) if (vu(a.x, a.y, 4)) { const r = a.r * C * 0.9, x = gx(a.x), y = gy(a.y); balaye([0, 1, 2, 3, 4, 5, 6, 7].map(k => [x + Math.cos(k * 0.785) * r, y + Math.sin(k * 0.785) * r])); }
    c.fillStyle = 'rgba(58,36,64,.26)'; c.fill('nonzero');
  }
  // 2. les pontons et les bateaux
  for (const pt of P.pontons) if (vu(pt.x, pt.y, pt.L + 1)) ombre((o) => { c.fillStyle = o || '#C9A57A'; c.fillRect(gx(pt.x), gy(pt.y) - C * 0.18, pt.L * C, C * 0.36); });
  for (const b of P.bateaux) if (vu(b.x, b.y, 2)) {
    const L = b.L * C, l = L * 0.38;
    const coque = (g) => { g.beginPath(); g.moveTo(L / 2, 0); g.quadraticCurveTo(L * 0.2, -l, -L / 2, -l * 0.7); g.lineTo(-L / 2, l * 0.7); g.quadraticCurveTo(L * 0.2, l, L / 2, 0); g.closePath(); };
    c.save(); c.translate(gx(b.x), gy(b.y)); c.rotate(b.a);
    ombre((o) => { coque(c); c.fillStyle = o || '#FFFFFF'; c.fill(); });
    c.beginPath(); c.ellipse(-L * 0.08, 0, L * 0.18, l * 0.45, 0, 0, 6.2832); c.fillStyle = '#C9D6E2'; c.fill();
    c.restore();
  }
  // 3. les tribunes (le public y est peint ; la scène vivante le fera bouger)
  for (const t of P.tribunes) if (vu(t.x, t.y, t.L)) {
    c.save(); c.translate(gx(t.x), gy(t.y)); c.rotate(t.ang);
    const L = t.L * C, e = C * 1.5;
    ombre((o) => { c.fillStyle = o || '#ECE7DD'; c.fillRect(-L / 2, -e / 2, L, e); });
    for (let k = 0; k < 4; k++) {
      const yy = -e / 2 + (k + 0.5) * e / 4;
      for (let x = -L / 2 + C * 0.2; x < L / 2; x += C * 0.32) { c.fillStyle = PUBLIC_DECOR[(Math.floor(x / C * 3) + k * 7 + 60) % PUBLIC_DECOR.length]; c.globalAlpha = 0.7; c.fillRect(x, yy - C * 0.08, C * 0.16, C * 0.16); }
      c.globalAlpha = 1;
    }
    c.strokeStyle = '#2B4C8C'; c.lineWidth = Math.max(0.8, C * 0.07); c.strokeRect(-L / 2, -e / 2, L, e);
    c.restore();
  }
  // 4. les bâtiments, les arbres et les tentes, du haut vers le bas de la feuille
  const tous = [...P.batiments.map(o => ['b', o]), ...P.arbres.map(o => ['a', o]), ...P.tentes.map(o => ['t', o])].sort((u, v) => u[1].y - v[1].y);
  for (const [t, o] of tous) {
    if (!vu(o.x, o.y, 3)) continue;
    const x = gx(o.x), y = gy(o.y);
    if (t === 'b') {
      const w = o.w * C, h = o.h * C, mur = MURS_DECOR[o.c % MURS_DECOR.length], toit = TOITS_DECOR[o.c % TOITS_DECOR.length];
      c.save(); c.translate(x, y); c.rotate(o.rot);
      ombre((s) => { c.fillStyle = s || mur; c.fillRect(-w / 2, -h / 2, w, h); });
      c.fillStyle = toit; c.fillRect(-w / 2, -h / 2, w, h / 2);
      c.fillStyle = nuanceHex(toit, -0.18); c.fillRect(-w / 2, 0, w, h / 2);
      if (o.dome) { c.beginPath(); c.arc(0, 0, Math.min(w, h) * 0.32, 0, 6.2832); c.fillStyle = '#8FB9A8'; c.fill(); c.strokeStyle = '#2B4C8C'; c.lineWidth = Math.max(0.8, C * 0.07); c.stroke(); }
      if (o.clocher) { c.beginPath(); c.moveTo(0, -h / 2 - C * 0.5); c.lineTo(w / 2, -h / 2); c.lineTo(-w / 2, -h / 2); c.closePath(); c.fillStyle = '#5B5F66'; c.fill(); }
      c.restore();
    } else if (t === 'a') {
      const r = o.r * C;
      if (o.sorte === 'palmier') {
        c.save(); c.translate(x, y); c.strokeStyle = '#3E7D45'; c.lineWidth = Math.max(1, C * 0.1); c.lineCap = 'round';
        for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7 - r * 0.2, Math.cos(a) * r * 1.2, Math.sin(a) * r * 1.2); c.stroke(); }
        c.beginPath(); c.arc(0, 0, C * 0.09, 0, 6.2832); c.fillStyle = '#7A5A3A'; c.fill(); c.restore();
        continue;
      }
      const vert = o.sorte === 'sapin' ? '#2F6E3E' : '#4E9A4A';
      const forme = () => {
        c.beginPath();
        // ⚠️ un sapin vu du ciel en étoile se lisait comme une étoile : un rond un peu dentelé
        if (o.sorte === 'sapin') { for (let k = 0; k < 16; k++) { const a = k / 16 * 6.2832, rr = k % 2 ? r * 0.84 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); }
        else c.arc(x, y, r, 0, 6.2832);
      };
      ombre((s) => { forme(); c.fillStyle = s || vert; c.fill(); });
      c.beginPath(); c.arc(x - r * 0.25, y - r * 0.25, r * 0.42, 0, 6.2832); c.fillStyle = 'rgba(255,255,255,.18)'; c.fill();
      if (o.sorte === 'sapin') { c.beginPath(); c.arc(x, y, r * 0.3, 0, 6.2832); c.fillStyle = 'rgba(0,40,10,.28)'; c.fill(); }
    } else {
      const s = C * 0.85, col = ['#F4F1EC', '#E8452C', '#F2C84B', '#5B7FA6'][o.c];
      c.save(); c.translate(x, y);
      ombre((sh) => { c.fillStyle = sh || col; c.fillRect(-s / 2, -s / 2, s, s); });
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = Math.max(0.7, C * 0.05);
      c.beginPath(); c.moveTo(-s / 2, -s / 2); c.lineTo(s / 2, s / 2); c.moveTo(s / 2, -s / 2); c.lineTo(-s / 2, s / 2); c.stroke();
      c.restore();
    }
  }
}
