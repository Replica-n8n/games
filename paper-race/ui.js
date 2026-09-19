// ===== Paper Race : interface (tracé animé, écrans, sauvegarde) =====
// Le moteur (moteur.js) et le son (sons.js) sont chargés avant ce fichier.
// ⚠️ VERSION existe aussi dans sw.js : les changer ensemble, un essai les compare.
const VERSION = 'paper-race-v8';
const BLEU = '#2B4C8C', ROUGE = '#B03A2E', ENCRE = '#1B2430';
// Les quatre autres voitures sont CALCULÉES (tools/paper-race-couleurs.mjs) :
// texte blanc lisible dessus, distinctes pour les trois daltonismes. Le numéro
// peint sur chaque voiture double la couleur, qui n'est jamais seule.
const COUL = [BLEU, ROUGE, '#2C7865', '#9255D5', '#880A5D', '#241E14'];
const NOMS = ['Bleu', 'Rouge', 'Vert', 'Violet', 'Prune', 'Noir'];
const ADJ = ['bleue', 'rouge', 'verte', 'violette', 'prune', 'noire'];
const CLE_REGLAGES = 'paper-race.reglages.v1';
const CLE_COURSE = 'paper-race.course.v1';

let R = null;
let mode = 'solo';   // le championnat d'abord ; 'gp' (Grand Prix), 'duo', 'ligne' se choisissent
let level = 'normal';
let nbVoitures = 4;  // en Grand Prix : le joueur + 1 à 5 fantômes

// qui joue sans qu'on touche l'écran : le fantôme du championnat, ceux du Grand Prix
const estFantome = (p) => (mode === 'solo' && p === 1) || (mode === 'gp' && p !== 0);
// à plus de deux, les voitures portent leur numéro
const numerote = () => R && R.cars.length > 2;
function tirage(n) {
  const g = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [g[i], g[j]] = [g[j], g[i]]; }
  return g;
}
let ti = 0;
let selected = null;
let opts = [];
let aiBusy = false;
let flash = null;
let anim = null;        // {pa, from, to, t, dur, crash}
let replay = null;      // {t, dur, then}
let cellPx = 21, PAD = 6;
let raf = null;
let jeton = 0;          // change à chaque course : un minuteur d'une course finie ne joue pas dans la suivante
let precedent = null;   // l'état juste avant le dernier coup du joueur, pour « Annuler »
let ligne = null;       // la course en ligne (ligne.js), ou rien

const REDUIT = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (id) => document.getElementById(id);
const cv = $('board');
const ctx = cv.getContext('2d');

// ================= géométrie =================
let terrain = null;

// Petit circuit : il tient entier à l'écran, comme toujours. Grand circuit
// (un vrai tracé) : on garde l'échelle d'un petit circuit, lisible au doigt, et
// une CAMÉRA suit la voiture, avec une mini-carte du circuit entier. Le
// quadrillage reste comptable : vue de dessus, jamais de perspective.
let vueW = 0, vueH = 0, camX = 0, camY = 0, grand = false, camPose = false, camBouge = false;
const mapW = () => cellPx * COLS + 2 * PAD, mapH = () => cellPx * ROWS + 2 * PAD;

function layout() {
  const wrap = $('boardwrap');
  const w = Math.min(wrap.clientWidth || 360, 440) - 4;
  const h = (wrap.clientHeight || 0) - 4;
  const parLargeur = Math.floor((w - 2 * PAD) / COLS);
  const parHauteur = h > 60 ? Math.floor((h - 2 * PAD) / ROWS) : parLargeur;
  // l'échelle d'un petit circuit de 21 x 26 dans la même place
  const lisible = Math.max(11, Math.min(Math.floor((w - 2 * PAD) / 21), h > 60 ? Math.floor((h - 2 * PAD) / 26) : 99));
  grand = Math.min(parLargeur, parHauteur) < lisible;
  cellPx = grand ? lisible : Math.max(9, Math.min(parLargeur, parHauteur));
  vueW = grand ? w : mapW();
  vueH = grand ? Math.max(160, h) : mapH();
  const dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(vueW * dpr); cv.height = Math.round(vueH * dpr);
  cv.style.width = vueW + 'px'; cv.style.height = vueH + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  $('minicarte').hidden = !grand;
  camPose = false;
  terrain = null;
}

// Ce que la caméra regarde : la voiture qui bouge, sinon celle qui joue, un peu
// devant elle (là où sa lancée l'emmène), pour voir venir le virage.
function viseeCamera() {
  if (replay) {
    const p = (mode === 'solo' || mode === 'gp') ? 0 : (R.winner === null ? 0 : R.winner);
    return tipOf(R.cars[p].trail, replay.t);
  }
  if (anim) {
    const t = R.cars[anim.pa].trail, a = t[t.length - 2], b = anim.to, k = easeOut(anim.t);
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  }
  const car = R.cars[R.turn];
  return [car.p[0] + car.v[0] * 0.9, car.p[1] + car.v[1] * 0.9];
}
function majCamera() {
  camBouge = false;
  if (!grand) { camX = 0; camY = 0; return; }
  const f = viseeCamera();
  const tx = Math.max(0, Math.min(mapW() - vueW, gx(f[0]) - vueW / 2));
  const ty = Math.max(0, Math.min(mapH() - vueH, gy(f[1]) - vueH * 0.55));
  if (!camPose || REDUIT) { camX = tx; camY = ty; camPose = true; return; }
  camX += (tx - camX) * 0.18; camY += (ty - camY) * 0.18;
  camBouge = Math.abs(tx - camX) > 0.5 || Math.abs(ty - camY) > 0.5;
}

const gx = (c) => PAD + c * cellPx;
const gy = (r) => PAD + r * cellPx;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const lerp = (a, b, t) => a + (b - a) * t;

// ================= le décor, dessiné une seule fois =================
function alea(seed) {
  let a = seed >>> 0;
  return () => { a ^= a << 13; a >>>= 0; a ^= a >> 17; a ^= a << 5; a >>>= 0; return a / 4294967296; };
}

function neuf(W, H, dpr) {
  const c = document.createElement('canvas');
  c.width = W * dpr; c.height = H * dpr;
  const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { c, x };
}

// La piste : les rectangles de bitume, moins les îlots.
function formePiste(tk, W, H, dpr, couleur) {
  const { c, x } = neuf(W, H, dpr);
  x.fillStyle = couleur;
  for (const r of tk.outers) x.fillRect(gx(r[0]), gy(r[1]), (r[2] - r[0]) * cellPx, (r[3] - r[1]) * cellPx);
  x.globalCompositeOperation = 'destination-out';
  for (const r of tk.islands) x.fillRect(gx(r[0]), gy(r[1]), (r[2] - r[0]) * cellPx, (r[3] - r[1]) * cellPx);
  return c;
}

// Anneau collé à l'extérieur d'une forme : on la dilate puis on l'évide.
function anneau(forme, d, couleur, W, H, dpr) {
  const { c, x } = neuf(W, H, dpr);
  for (const [ox, oy] of [[-d, 0], [d, 0], [0, -d], [0, d], [-d, -d], [d, -d], [-d, d], [d, d]])
    x.drawImage(forme, ox, oy, W, H);
  x.globalCompositeOperation = 'destination-out';
  x.drawImage(forme, 0, 0, W, H);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = couleur; x.fillRect(0, 0, W, H);
  return c;
}

function vibreur(c, x0, y0, x1, y1, cote) {
  const dx = x1 - x0, dy = y1 - y0;
  const L = Math.hypot(dx, dy); if (!L) return;
  const ux = dx / L, uy = dy / L, nx = -uy * cote, ny = ux * cote;
  const ep = 0.26, pas = 0.5;
  for (let t = 0; t + 0.001 < L; t += pas) {
    const t2 = Math.min(L, t + pas);
    const ax = x0 + ux * t, ay = y0 + uy * t, bx = x0 + ux * t2, by = y0 + uy * t2;
    c.beginPath();
    c.moveTo(gx(ax), gy(ay)); c.lineTo(gx(bx), gy(by));
    c.lineTo(gx(bx + nx * ep), gy(by + ny * ep)); c.lineTo(gx(ax + nx * ep), gy(ay + ny * ep));
    c.closePath();
    c.fillStyle = (Math.round(t / pas) % 2) ? '#F4F1EC' : '#C0392B';
    c.fill();
  }
}

// Les pièges, dessinés dans leur rectangle ; l'appelant les découpe au bitume.
// L'accélérateur montre le sens de la course (lu dans la carte d'avancement).
function sensEn(tk, x, y) {
  let best = [1, 0], g = -1e9;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (!onTrack(tk, x + dx, y + dy)) continue;
    const p = progress(tk, [x, y], [x + dx, y + dy]);
    if (p > g) { g = p; best = [dx, dy]; }
  }
  return best;
}
function pieges(c, tk) {
  const Z = tk.zones || {};
  const dessine = (r, fond, motif) => {
    const X = gx(r[0]), Y = gy(r[1]), Wd = (r[2] - r[0]) * cellPx, Hd = (r[3] - r[1]) * cellPx;
    c.fillStyle = fond; c.fillRect(X, Y, Wd, Hd);
    motif(X, Y, Wd, Hd, r);
  };
  for (const r of (Z.huile || [])) dessine(r, 'rgba(38,40,50,0.45)', (X, Y, Wd, Hd) => {
    c.fillStyle = 'rgba(20,22,30,0.4)';
    for (let k = 0; k < 5; k++) {
      c.beginPath();
      c.ellipse(X + Wd * (0.2 + 0.16 * k), Y + Hd * (0.3 + 0.12 * (k % 3)), Wd * 0.13, Hd * 0.09, 0, 0, 6.2832);
      c.fill();
    }
  });
  for (const r of (Z.humide || [])) dessine(r, 'rgba(72,132,176,0.34)', (X, Y, Wd, Hd) => {
    c.strokeStyle = 'rgba(40,96,140,0.45)'; c.lineWidth = 1.6;
    for (let k = -Hd; k < Wd; k += 7) { c.beginPath(); c.moveTo(X + k, Y + Hd); c.lineTo(X + k + Hd, Y); c.stroke(); }
  });
  for (const r of (Z.boost || [])) dessine(r, 'rgba(242,193,78,0.42)', (X, Y, Wd, Hd) => {
    const cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2;
    const [dx, dy] = sensEn(tk, Math.round(cx), Math.round(cy));
    const a = Math.atan2(dy, dx), t = cellPx * 0.7;
    c.save(); c.strokeStyle = 'rgba(176,120,20,0.75)'; c.lineWidth = 2.6; c.lineCap = 'round'; c.lineJoin = 'round';
    for (let k = -1; k <= 1; k++) {
      c.save(); c.translate(gx(cx) + Math.cos(a) * k * t * 1.3, gy(cy) + Math.sin(a) * k * t * 1.3); c.rotate(a);
      c.beginPath(); c.moveTo(-t * 0.5, -t); c.lineTo(t * 0.5, 0); c.lineTo(-t * 0.5, t); c.stroke();
      c.restore();
    }
    c.restore();
  });
}

function bbox(rects) {
  let a = 1e9, b = 1e9, cc = -1e9, d = -1e9;
  for (const r of rects) { a = Math.min(a, r[0]); b = Math.min(b, r[1]); cc = Math.max(cc, r[2]); d = Math.max(d, r[3]); }
  return [a, b, cc, d];
}

// Un tracé se peint au TRAIT : la piste est exactement l'ensemble des points à
// moins de `demi` de la ligne centrale, c'est-à-dire un trait de largeur
// 2 x demi, joints et bouts arrondis. Une seule toile, sans dilatation : sur un
// grand circuit, chaque toile intermédiaire coûte des dizaines de Mo.
function terrainTrace(tk, W, H, dpr) {
  const { c: cnv, x: c } = neuf(W, H, dpr);
  const rnd = alea(1000 + ti * 77);
  c.fillStyle = '#DCE8D2'; c.fillRect(0, 0, W, H);
  c.strokeStyle = '#B4CFA4'; c.lineWidth = 1.1; c.lineCap = 'round';
  const brins = Math.min(5000, Math.round(800 * COLS * ROWS / (21 * 26)));
  for (let k = 0; k < brins; k++) {
    const X = gx(rnd() * COLS), Y = gy(rnd() * ROWS), h = 2 + rnd() * 3;
    c.beginPath(); c.moveTo(X, Y); c.lineTo(X + (rnd() - 0.5) * 2, Y - h); c.stroke();
  }
  const trait = (larg, coul) => {
    c.beginPath();
    tk.trace.forEach((q, i) => i ? c.lineTo(gx(q[0]), gy(q[1])) : c.moveTo(gx(q[0]), gy(q[1])));
    c.closePath();
    c.lineWidth = larg; c.strokeStyle = coul; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke();
  };
  trait((2 * tk.demi + 1.2) * cellPx, '#E6D5A9');      // dégagement de sable
  trait(2 * tk.demi * cellPx + 4, '#5A6473');           // bord de piste
  trait(2 * tk.demi * cellPx, '#D6D8D1');               // bitume
  if (tk.zones) {
    const { c: zc, x: zx } = neuf(W, H, dpr);
    pieges(zx, tk);
    zx.globalCompositeOperation = 'destination-in';
    zx.beginPath();
    tk.trace.forEach((q, i) => i ? zx.lineTo(gx(q[0]), gy(q[1])) : zx.moveTo(gx(q[0]), gy(q[1])));
    zx.closePath(); zx.lineWidth = 2 * tk.demi * cellPx; zx.lineJoin = 'round'; zx.lineCap = 'round'; zx.strokeStyle = '#000'; zx.stroke();
    c.drawImage(zc, 0, 0, W, H);
  }
  // vibreurs : un liseré rouge et blanc sur le bord, là où le tracé tourne fort
  const P = tk.trace;
  for (let i = 0; i < P.length; i++) {
    const a = P[(i + P.length - 1) % P.length], b = P[i], d = P[(i + 1) % P.length];
    const u = [b[0] - a[0], b[1] - a[1]], v = [d[0] - b[0], d[1] - b[1]];
    const ang = Math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1]);
    if (Math.abs(ang) < 0.7) continue;
    // à l'extérieur du virage
    const lu = Math.hypot(u[0], u[1]) || 1, lv = Math.hypot(v[0], v[1]) || 1;
    const bis = [u[0] / lu - v[0] / lv, u[1] / lu - v[1] / lv], lb = Math.hypot(bis[0], bis[1]) || 1;
    const cx = b[0] + bis[0] / lb * (tk.demi - 0.15), cy = b[1] + bis[1] / lb * (tk.demi - 0.15);
    const dir = Math.atan2(bis[1], bis[0]) + Math.PI / 2;
    for (let k = -2; k <= 2; k++) {
      c.fillStyle = (k & 1) ? '#F4F1EC' : '#C0392B';
      c.beginPath(); c.arc(gx(cx + Math.cos(dir) * k * 0.45), gy(cy + Math.sin(dir) * k * 0.45), cellPx * 0.2, 0, 6.2832); c.fill();
    }
  }
  // damier de départ
  const L = tk.depart, sy = gy(L.y), n = Math.round(L.x1 - L.x0);
  for (let k = 0; k < n * 2; k++) {
    const xx = gx(L.x0 + k / 2), ww = cellPx / 2;
    c.fillStyle = (k % 2) ? '#22282F' : '#F4F1EC'; c.fillRect(xx, sy - cellPx * 0.22, ww, cellPx * 0.22);
    c.fillStyle = (k % 2) ? '#F4F1EC' : '#22282F'; c.fillRect(xx, sy, ww, cellPx * 0.22);
  }
  // quadrillage par-dessus
  c.globalAlpha = 0.42; c.strokeStyle = '#5E86A6';
  for (let k = 0; k <= COLS; k++) { c.beginPath(); c.moveTo(gx(k), gy(0)); c.lineTo(gx(k), gy(ROWS)); c.lineWidth = k % 5 === 0 ? 1.2 : 0.7; c.stroke(); }
  for (let k = 0; k <= ROWS; k++) { c.beginPath(); c.moveTo(gx(0), gy(k)); c.lineTo(gx(COLS), gy(k)); c.lineWidth = k % 5 === 0 ? 1.2 : 0.7; c.stroke(); }
  c.globalAlpha = 1;
  // sens de la course : un chevron toutes les 14 cases, au milieu de la piste
  let reste = 7;
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], L2 = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let t = reste; t < L2; t += 14) chevron(c, a[0] + (b[0] - a[0]) * t / L2, a[1] + (b[1] - a[1]) * t / L2, b[0] - a[0], b[1] - a[1]);
    reste = ((reste - L2) % 14 + 14) % 14;
  }
  return cnv;
}

function buildTerrain() {
  const W = mapW(), H = mapH();
  // au plus 2 pixels par point : un grand circuit à 3 fois la densité de l'écran
  // pèserait plus de 60 Mo
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const tk = R.track;
  if (tk.trace) return terrainTrace(tk, W, H, dpr);
  const { c: cnv, x: c } = neuf(W, H, dpr);
  const rnd = alea(1000 + ti * 77);

  c.fillStyle = '#FAFBF8'; c.fillRect(0, 0, W, H);

  // herbe partout, le bitume passera par-dessus
  c.fillStyle = '#DCE8D2'; c.fillRect(0, 0, W, H);
  c.strokeStyle = '#B4CFA4'; c.lineWidth = 1.1; c.lineCap = 'round';
  for (let k = 0; k < 800; k++) {
    const X = gx(rnd() * COLS), Y = gy(rnd() * ROWS), h = 2 + rnd() * 3;
    c.beginPath(); c.moveTo(X, Y); c.lineTo(X + (rnd() - 0.5) * 2, Y - h); c.stroke();
  }

  const forme = formePiste(tk, W, H, dpr, '#D6D8D1');

  // dégagement de sable autour de la piste
  const sable = anneau(forme, Math.max(6, cellPx * 0.6), '#E6D5A9', W, H, dpr);
  c.drawImage(sable, 0, 0, W, H);
  c.save();
  c.globalAlpha = 0.5; c.fillStyle = '#CDB47F';
  for (let k = 0; k < 500; k++) c.fillRect(gx(rnd() * COLS), gy(rnd() * ROWS), 1.2, 1.2);
  c.restore();

  // bitume
  c.drawImage(forme, 0, 0, W, H);
  c.save();
  c.beginPath();
  for (const r of tk.outers) c.rect(gx(r[0]), gy(r[1]), (r[2] - r[0]) * cellPx, (r[3] - r[1]) * cellPx);
  c.clip();
  c.fillStyle = 'rgba(120,128,120,0.13)';
  for (let k = 0; k < 1200; k++) c.fillRect(gx(rnd() * COLS), gy(rnd() * ROWS), 1.1, 1.1);
  c.restore();

  // vibreurs, toujours dans les limites du bitume
  const masque = formePiste(tk, W, H, dpr, '#000');
  const { c: zc, x: zx } = neuf(W, H, dpr);
  const LG = 2.6;
  for (const r of tk.outers) {
    const [a, b, d, e] = r;
    vibreur(zx, a, b + LG, a, b, 1); vibreur(zx, a, b, a + LG, b, -1);
    vibreur(zx, d - LG, b, d, b, -1); vibreur(zx, d, b, d, b + LG, -1);
    vibreur(zx, d, e - LG, d, e, -1); vibreur(zx, d, e, d - LG, e, -1);
    vibreur(zx, a + LG, e, a, e, 1); vibreur(zx, a, e, a, e - LG, 1);
  }
  const LI = 2.0;
  for (const r of tk.islands) {
    const [a, b, d, e] = r;
    vibreur(zx, a, b + LI, a, b, -1); vibreur(zx, a, b, a + LI, b, 1);
    vibreur(zx, d - LI, b, d, b, 1); vibreur(zx, d, b, d, b + LI, 1);
    vibreur(zx, d, e - LI, d, e, 1); vibreur(zx, d, e, d - LI, e, 1);
    vibreur(zx, a + LI, e, a, e, -1); vibreur(zx, a, e, a, e - LI, -1);
  }
  pieges(zx, tk);
  zx.globalCompositeOperation = 'destination-in';
  zx.drawImage(masque, 0, 0, W, H);
  c.drawImage(zc, 0, 0, W, H);

  // bord de piste
  c.drawImage(anneau(forme, 2, '#5A6473', W, H, dpr), 0, 0, W, H);

  // piles de pneus aux coins extérieurs
  const O = tk.outers[0];
  for (const [px, py] of [[O[0] + 0.5, O[1] + 0.5], [O[2] - 0.5, O[1] + 0.5], [O[2] - 0.5, O[3] - 0.5], [O[0] + 0.5, O[3] - 0.5]]) {
    for (let k = -1; k <= 1; k++) {
      const X = gx(px) + k * cellPx * 0.42, Y = gy(py);
      c.beginPath(); c.arc(X, Y, cellPx * 0.16, 0, 6.2832); c.fillStyle = '#3A4048'; c.fill();
      c.beginPath(); c.arc(X, Y, cellPx * 0.07, 0, 6.2832); c.fillStyle = '#E8EAE6'; c.fill();
    }
  }

  // damier de départ, horizontal
  const L = startLine(tk), sy = gy(L.y), n = Math.round(L.x1 - L.x0);
  for (let k = 0; k < n * 2; k++) {
    const xx = gx(L.x0 + k / 2), ww = cellPx / 2;
    c.fillStyle = (k % 2) ? '#22282F' : '#F4F1EC';
    c.fillRect(xx, sy - cellPx * 0.22, ww, cellPx * 0.22);
    c.fillStyle = (k % 2) ? '#F4F1EC' : '#22282F';
    c.fillRect(xx, sy, ww, cellPx * 0.22);
  }

  // quadrillage par-dessus
  c.globalAlpha = 0.42;
  for (let k = 0; k <= COLS; k++) {
    c.beginPath(); c.moveTo(gx(k), gy(0)); c.lineTo(gx(k), gy(ROWS));
    c.strokeStyle = '#5E86A6'; c.lineWidth = k % 5 === 0 ? 1.2 : 0.7; c.stroke();
  }
  for (let k = 0; k <= ROWS; k++) {
    c.beginPath(); c.moveTo(gx(0), gy(k)); c.lineTo(gx(COLS), gy(k));
    c.strokeStyle = '#5E86A6'; c.lineWidth = k % 5 === 0 ? 1.2 : 0.7; c.stroke();
  }
  c.globalAlpha = 1;

  // sens de la course
  const B = bbox(tk.islands), s = tk.sens;
  const pts = [
    [(O[0] + B[0]) / 2, (B[1] + B[3]) / 2, 0, -s],
    [(B[0] + B[2]) / 2, (O[1] + B[1]) / 2, s, 0],
    [(B[2] + O[2]) / 2, (B[1] + B[3]) / 2, 0, s],
    [(B[0] + B[2]) / 2, (B[3] + O[3]) / 2, -s, 0]
  ];
  for (const [x, y, dx, dy] of pts) {
    if (onTrack(tk, Math.round(x), Math.round(y))) chevron(c, x, y, dx, dy);
  }

  return cnv;
}

// ================= rendu =================
let secousse = 0;

function render() {
  if (!R) return;
  const W = mapW(), H = mapH();
  if (!terrain) terrain = buildTerrain();
  ctx.clearRect(0, 0, vueW, vueH);
  ctx.save();
  majCamera();
  ctx.translate(-Math.round(camX), -Math.round(camY));
  if (secousse > 0.2 && !REDUIT) {
    ctx.translate((Math.random() - 0.5) * secousse, (Math.random() - 0.5) * secousse);
    secousse *= 0.86;
  } else secousse = 0;
  ctx.drawImage(terrain, 0, 0, W, H);

  // ---- traces ----
  for (let p = 0; p < R.cars.length; p++) {
    const pts = R.cars[p].trail;
    if (replay) { drawPartial(pts, COUL[p], replay.t); continue; }
    if (anim && anim.pa === p) {
      drawTrail(pts.slice(0, -1), COUL[p]);
      const a = pts[pts.length - 2], b = anim.to;
      const k = easeOut(anim.t);
      ctx.beginPath();
      ctx.moveTo(gx(a[0]), gy(a[1]));
      ctx.lineTo(gx(lerp(a[0], b[0], k)), gy(lerp(a[1], b[1], k)));
      ctx.strokeStyle = COUL[p]; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.stroke();
      continue;
    }
    drawTrail(pts, COUL[p]);
  }

  // ---- sortie de piste ----
  if (flash && flash.type === 'sortie' && !anim && !replay) {
    const a = flash.stop, b = flash.vise;
    ctx.setLineDash([5, 4]); ctx.strokeStyle = ROUGE; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(gx(a[0]), gy(a[1])); ctx.lineTo(gx(b[0]), gy(b[1])); ctx.stroke();
    ctx.setLineDash([]);
    const x = gx(b[0]), y = gy(b[1]);
    ctx.strokeStyle = ROUGE; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y + 6);
    ctx.moveTo(x + 6, y - 6); ctx.lineTo(x - 6, y + 6); ctx.stroke();
  }

  // ---- les neuf choix ----
  const libre = !finie(R) && !anim && !replay && opts.length;
  if (libre) {
    const car = R.cars[R.turn], col = COUL[R.turn];
    const pr = projected(car);
    ctx.setLineDash([4, 5]); ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.moveTo(gx(car.p[0]), gy(car.p[1])); ctx.lineTo(gx(pr[0]), gy(pr[1])); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;

    distanceArret(car, col);
    if (selected !== null && opts[selected] && opts[selected].ok) ombreSuivante(opts[selected].p, car.p);

    opts.forEach((o, k) => {
      const x = gx(o.p[0]), y = gy(o.p[1]);
      if (o.ok) {
        const on = selected === k;
        ctx.beginPath(); ctx.arc(x, y, cellPx * 0.42, 0, 6.2832);
        ctx.fillStyle = '#FAFBF8'; ctx.globalAlpha = 0.72; ctx.fill();
        ctx.fillStyle = col; ctx.globalAlpha = on ? 0.34 : 0.15; ctx.fill(); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(x, y, cellPx * 0.26, 0, 6.2832);
        if (on) { ctx.fillStyle = col; ctx.fill(); }
        else { ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.stroke(); }
      } else if (o.bloque) {
        const b = bloqueur(R, car.p, o.p), adv = COUL[Math.max(0, R.cars.indexOf(b))];
        ctx.beginPath(); ctx.arc(x, y, cellPx * 0.32, 0, 6.2832);
        ctx.fillStyle = 'rgba(250,251,248,0.8)'; ctx.fill();
        ctx.strokeStyle = adv; ctx.lineWidth = 2.2; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - cellPx * 0.18, y); ctx.lineTo(x + cellPx * 0.18, y);
        ctx.lineCap = 'round'; ctx.stroke();
      } else {
        ctx.globalAlpha = 0.55; ctx.strokeStyle = ROUGE; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4);
        ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });

    if (selected !== null && opts[selected].ok) {
      const q = opts[selected].p;
      ctx.strokeStyle = col; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(gx(car.p[0]), gy(car.p[1])); ctx.lineTo(gx(q[0]), gy(q[1])); ctx.stroke();
    }
  }

  // ---- voitures ----
  for (let p = 0; p < R.cars.length; p++) {
    let pos = R.cars[p].p;
    if (replay) pos = tipOf(R.cars[p].trail, replay.t);
    else if (anim && anim.pa === p) {
      const a = R.cars[p].trail[R.cars[p].trail.length - 2], b = anim.to, k = easeOut(anim.t);
      pos = [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
    }
    let ang = caps[p];
    if (replay) { const a = dirAt(R.cars[p].trail, replay.t); if (a !== null) ang = a; }
    else if (anim && anim.pa === p) {
      const a0 = R.cars[p].trail[R.cars[p].trail.length - 2], b0 = anim.to;
      if (b0[0] !== a0[0] || b0[1] !== a0[1]) ang = Math.atan2(b0[1] - a0[1], b0[0] - a0[0]);
      caps[p] = ang;
    } else {
      const v = R.cars[p].v;
      if (v[0] || v[1]) { ang = Math.atan2(v[1], v[0]); caps[p] = ang; }
    }
    if (anim && anim.pa === p) fantomes(p, ang);
    if (libre && p === R.turn) halo(pos, opts.filter(o => o.ok).length);
    // arrivé avant le joueur, le fantôme a quitté la piste : on le devine à peine
    const parti = R.cars[p].fini && !finie(R) && !replay;
    if (parti) { ctx.save(); ctx.globalAlpha = 0.3; }
    drawCar(pos, COUL[p], ang, numerote() ? p + 1 : 0);
    if (parti) ctx.restore();
  }
  ctx.restore();
  if (grand) miniCarte();
}

// La mini-carte : le circuit entier, les deux voitures, et ce que montre l'écran.
function miniCarte() {
  const m = $('minicarte'), tk = R.track;
  const L = 84, e = Math.min(L / COLS, L * 1.3 / ROWS), w = Math.round(COLS * e + 8), h = Math.round(ROWS * e + 8);
  const dpr = window.devicePixelRatio || 1;
  if (m.width !== w * dpr) { m.width = w * dpr; m.height = h * dpr; m.style.width = w + 'px'; m.style.height = h + 'px'; }
  const g = m.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const X = (v) => 4 + v * e;
  g.fillStyle = '#DCE8D2'; g.fillRect(0, 0, w, h);
  g.beginPath(); tk.trace.forEach((q, i) => i ? g.lineTo(X(q[0]), X(q[1])) : g.moveTo(X(q[0]), X(q[1]))); g.closePath();
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.lineWidth = 2 * tk.demi * e + 2; g.strokeStyle = '#5A6473'; g.stroke();
  g.lineWidth = 2 * tk.demi * e; g.strokeStyle = '#D6D8D1'; g.stroke();
  const D = tk.depart; g.fillStyle = '#22282F'; g.fillRect(X(D.x0), X(D.y) - 1, (D.x1 - D.x0) * e, 2);
  // la zone visible
  g.strokeStyle = 'rgba(27,36,48,.7)'; g.lineWidth = 1.2;
  g.strokeRect(X((camX - PAD) / cellPx), X((camY - PAD) / cellPx), vueW / cellPx * e, vueH / cellPx * e);
  for (let p = 0; p < R.cars.length; p++) {
    const q = replay ? tipOf(R.cars[p].trail, replay.t) : R.cars[p].p;
    g.beginPath(); g.arc(X(q[0]), X(q[1]), 3.4, 0, 6.2832);
    g.fillStyle = COUL[p]; g.globalAlpha = R.cars[p].fini && !finie(R) ? 0.35 : 1; g.fill();
    g.globalAlpha = 1; g.lineWidth = 1.2; g.strokeStyle = '#FAFBF8'; g.stroke();
  }
}

// traînée de vitesse : quelques copies décalées derrière la voiture
function fantomes(p, ang) {
  const pts = R.cars[p].trail;
  const a = pts[pts.length - 2], b = anim.to;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (len < 1.5) return;
  const k = easeOut(anim.t);
  for (let i = 1; i <= 3; i++) {
    const kk = k - i * 0.055 * Math.min(3, len);
    if (kk <= 0) continue;
    const pos = [lerp(a[0], b[0], kk), lerp(a[1], b[1], kk)];
    ctx.save(); ctx.globalAlpha = 0.16 * (4 - i) / 3;
    drawCar(pos, COUL[p], ang);
    ctx.restore();
  }
  // filets d'air
  const pos = [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  ctx.save();
  ctx.strokeStyle = 'rgba(250,251,248,0.75)'; ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const off = (i - 1.5) * cellPx * 0.22;
    const dx = Math.cos(ang), dy = Math.sin(ang);
    const nx = -dy, ny = dx;
    const L = cellPx * (0.5 + len * 0.28) * (0.5 + Math.random() * 0.6);
    const x0 = gx(pos[0]) + nx * off - dx * cellPx * 0.5;
    const y0 = gy(pos[1]) + ny * off - dy * cellPx * 0.5;
    ctx.lineWidth = 1.8;
    ctx.globalAlpha = 0.5 * (1 - anim.t * 0.5);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 - dx * L, y0 - dy * L); ctx.stroke();
  }
  ctx.restore();
}

function distanceArret(car, col) {
  if (!car.v[0] && !car.v[1]) return;
  const a = arret(car);
  const dehors = !onTrack(R.track, a.point[0], a.point[1]) || !segOk(R.track, car.p, a.point);
  const teinte = dehors ? ROUGE : '#5A6878';
  ctx.save();
  ctx.setLineDash([2, 6]); ctx.strokeStyle = teinte; ctx.lineWidth = 2; ctx.globalAlpha = 0.65;
  ctx.beginPath(); ctx.moveTo(gx(car.p[0]), gy(car.p[1])); ctx.lineTo(gx(a.point[0]), gy(a.point[1])); ctx.stroke();
  ctx.setLineDash([]);
  const x = gx(a.point[0]), y = gy(a.point[1]), r = cellPx * 0.3;
  ctx.globalAlpha = 0.9; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y - r);
  ctx.moveTo(x - r, y + r); ctx.lineTo(x + r, y + r);
  ctx.strokeStyle = teinte; ctx.stroke();
  ctx.restore();
}

function ombreSuivante(q, from) {
  const v = [q[0] - from[0], q[1] - from[1]];
  const pr = [q[0] + v[0], q[1] + v[1]];
  ctx.setLineDash([3, 4]); ctx.strokeStyle = '#5A6878'; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.moveTo(gx(q[0]), gy(q[1])); ctx.lineTo(gx(pr[0]), gy(pr[1])); ctx.stroke();
  ctx.setLineDash([]);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const n = [pr[0] + dx, pr[1] + dy];
      const ok = onTrack(R.track, n[0], n[1]) && segOk(R.track, q, n);
      const x = gx(n[0]), y = gy(n[1]);
      if (ok) {
        ctx.globalAlpha = 0.72; ctx.fillStyle = '#48566A';
        ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 6.2832); ctx.fill();
      } else {
        ctx.globalAlpha = 0.4; ctx.strokeStyle = ROUGE; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + 3, y + 3);
        ctx.moveTo(x + 3, y - 3); ctx.lineTo(x - 3, y + 3); ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
}

function halo(pos, dispo) {
  if (dispo > 3) return;
  const puls = REDUIT ? 0.5 : (Math.sin(performance.now() / 260) + 1) / 2;
  const r = cellPx * (0.62 + 0.16 * puls);
  ctx.beginPath(); ctx.arc(gx(pos[0]), gy(pos[1]), r, 0, 6.2832);
  ctx.strokeStyle = ROUGE; ctx.lineWidth = 2.4; ctx.globalAlpha = 0.28 + 0.34 * puls;
  ctx.stroke(); ctx.globalAlpha = 1;
}

function chevron(c, x, y, dx, dy) {
  const X = gx(x), Y = gy(y), s = cellPx * 0.42;
  c.save(); c.translate(X, Y); c.rotate(Math.atan2(dy, dx));
  c.globalAlpha = 0.34; c.strokeStyle = '#3F4A57'; c.lineWidth = 2.6;
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-s * 0.6, -s); c.lineTo(s * 0.5, 0); c.lineTo(-s * 0.6, s); c.stroke();
  c.restore(); c.globalAlpha = 1;
}

function drawTrail(pts, col) {
  if (pts.length < 2) return;
  ctx.beginPath(); ctx.moveTo(gx(pts[0][0]), gy(pts[0][1]));
  for (let i = 1; i < pts.length; i++) ctx.lineTo(gx(pts[i][0]), gy(pts[i][1]));
  ctx.strokeStyle = 'rgba(250,251,248,0.75)'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
  ctx.fillStyle = col;
  for (let i = 0; i < pts.length - 1; i++) {
    ctx.beginPath(); ctx.arc(gx(pts[i][0]), gy(pts[i][1]), 2.4, 0, 6.2832); ctx.fill();
  }
}

function longueurs(pts) {
  const L = [0]; let tot = 0;
  for (let i = 1; i < pts.length; i++) {
    tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    L.push(tot);
  }
  return { L, tot };
}

function tipOf(pts, frac) {
  if (pts.length < 2) return pts[0];
  const { L, tot } = longueurs(pts);
  const cible = tot * frac;
  for (let i = 1; i < pts.length; i++) {
    if (L[i] >= cible) {
      const k = (cible - L[i - 1]) / (L[i] - L[i - 1] || 1);
      return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)];
    }
  }
  return pts[pts.length - 1];
}

function drawPartial(pts, col, frac) {
  if (pts.length < 2) return;
  const { L, tot } = longueurs(pts);
  const cible = tot * frac;
  ctx.beginPath(); ctx.moveTo(gx(pts[0][0]), gy(pts[0][1]));
  let n = 0;
  for (let i = 1; i < pts.length; i++) {
    if (L[i] <= cible) { ctx.lineTo(gx(pts[i][0]), gy(pts[i][1])); n = i; }
    else {
      const k = (cible - L[i - 1]) / (L[i] - L[i - 1] || 1);
      ctx.lineTo(gx(lerp(pts[i - 1][0], pts[i][0], k)), gy(lerp(pts[i - 1][1], pts[i][1], k)));
      break;
    }
  }
  ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
  ctx.fillStyle = col;
  for (let i = 0; i <= n; i++) {
    ctx.beginPath(); ctx.arc(gx(pts[i][0]), gy(pts[i][1]), 2.4, 0, 6.2832); ctx.fill();
  }
}

const caps = Array(6).fill(-Math.PI / 2);
const capsAvant = Array(6).fill(null);

function dirAt(pts, frac) {
  if (pts.length < 2) return null;
  const { L, tot } = longueurs(pts);
  const cible = tot * frac;
  for (let i = 1; i < pts.length; i++) {
    if (L[i] >= cible || i === pts.length - 1) {
      const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1];
      if (dx || dy) return Math.atan2(dy, dx);
    }
  }
  return null;
}

function drawCar(p, col, ang, num) {
  const x = gx(p[0]), y = gy(p[1]);
  const Lo = cellPx * 0.92, La = cellPx * 0.54, r = La * 0.3;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(ang);
  // halo clair pour rester lisible sur le bitume
  ctx.beginPath(); ctx.arc(0, 0, cellPx * 0.52, 0, 6.2832);
  ctx.fillStyle = 'rgba(250,251,248,0.8)'; ctx.fill();
  // roues
  ctx.fillStyle = '#2B3138';
  const rw = Lo * 0.2, rh = La * 0.2;
  for (const [ox, oy] of [[-Lo * 0.26, -La * 0.5], [-Lo * 0.26, La * 0.5], [Lo * 0.26, -La * 0.5], [Lo * 0.26, La * 0.5]]) {
    ctx.beginPath(); ctx.rect(ox - rw / 2, oy - rh / 2, rw, rh); ctx.fill();
  }
  // carrosserie
  ctx.beginPath();
  ctx.moveTo(-Lo / 2 + r, -La / 2);
  ctx.arcTo(Lo / 2, -La / 2, Lo / 2, La / 2, r * 1.6);
  ctx.arcTo(Lo / 2, La / 2, -Lo / 2, La / 2, r * 1.6);
  ctx.arcTo(-Lo / 2, La / 2, -Lo / 2, -La / 2, r);
  ctx.arcTo(-Lo / 2, -La / 2, Lo / 2, -La / 2, r);
  ctx.closePath();
  ctx.fillStyle = col; ctx.fill();
  ctx.strokeStyle = 'rgba(20,26,34,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
  // pare-brise et aileron
  ctx.beginPath();
  ctx.ellipse(Lo * 0.06, 0, Lo * 0.17, La * 0.28, 0, 0, 6.2832);
  ctx.fillStyle = 'rgba(250,251,248,0.85)'; ctx.fill();
  ctx.fillStyle = 'rgba(20,26,34,0.45)';
  ctx.fillRect(-Lo * 0.5, -La * 0.42, Lo * 0.08, La * 0.84);
  ctx.restore();
  // le numéro, toujours droit, dans une pastille à la couleur de la voiture
  if (num) {
    const r = Math.max(6.5, cellPx * 0.3);
    ctx.save();
    ctx.beginPath(); ctx.arc(x + cellPx * 0.42, y - cellPx * 0.42, r, 0, 6.2832);
    ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = '#FAFBF8'; ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.font = `800 ${Math.round(r * 1.35)}px 'Bricolage Grotesque', sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(num), x + cellPx * 0.42, y - cellPx * 0.42 + 0.5);
    ctx.restore();
  }
}

// ================= bande de rejeu =================
let rejeu = null;
let dernierMoment = -9;
const zoomRejeu = () => Math.max(2.2, Math.min(3.4, 52 / cellPx));

function momentFort(ev, pa, depart, arrivee, avantMoi, avantAutres) {
  if (ev.type === 'arrivee') return null;
  if (ev.type === 'sortie') return 'Sortie de piste';
  if (ev.type === 'boost') return 'Accélérateur';
  if (ev.type === 'blocage') return 'Accrochage';
  const apresMoi = avanceDe(R.track, arrivee);
  if (avantAutres.some(a => a !== null && avantMoi < a && apresMoi > a)) return 'Dépassement';
  const restant = choices(R).filter(o => o.ok).length;
  if (restant <= 2) return 'Au ras du mur';
  const vit = Math.max(Math.abs(arrivee[0] - depart[0]), Math.abs(arrivee[1] - depart[1]));
  if (vit >= 5) return 'Pleine vitesse';
  return null;
}

function lancerRejeu(label, pa, from, to, fin) {
  const cv2 = $('rejeu');
  const Wb = vueW;
  const H = Math.min(132, Math.round(Wb * 0.34));
  const dpr = window.devicePixelRatio || 1;
  cv2.width = Wb * dpr; cv2.height = H * dpr;
  cv2.style.width = Wb + 'px'; cv2.style.height = H + 'px';
  cv2.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  const teintes = { 'Sortie de piste': '#B03A2E', 'Accrochage': '#B03A2E', 'Au ras du mur': '#C2760F',
    'Dépassement': '#2B4C8C', 'Accélérateur': '#8A6510', 'Pleine vitesse': '#1F6B4E' };
  $('rejeulabel').textContent = label;
  $('rejeulabel').style.background = teintes[label] || '#22282F';
  $('rejeubox').classList.add('on');
  souffle(0.3, 1800, 500, 0.06, 1.2);
  rejeu = { pa, from, to, t: 0, t0: performance.now(), dur: 1150, W: Wb, H, fin };
  boucle();
}

function dessineRejeu() {
  const cv2 = $('rejeu'), g = cv2.getContext('2d');
  const { pa, from, to, t, W, H } = rejeu;
  g.clearRect(0, 0, W, H);
  g.fillStyle = '#0E1218'; g.fillRect(0, 0, W, H);
  if (!terrain) return;

  const k = Math.min(1, t * 1.15);
  const pos = [lerp(from[0], to[0], k), lerp(from[1], to[1], k)];
  const ang = (to[0] !== from[0] || to[1] !== from[1])
    ? Math.atan2(to[1] - from[1], to[0] - from[0]) : caps[pa];

  g.save();
  g.beginPath(); g.rect(0, 0, W, H); g.clip();
  g.translate(W / 2, H * 0.62);
  g.scale(zoomRejeu(), zoomRejeu());
  g.rotate(-(ang + Math.PI / 2));
  g.translate(-gx(pos[0]), -gy(pos[1]));
  g.drawImage(terrain, 0, 0, mapW(), mapH());

  for (let p = 0; p < R.cars.length; p++) {
    const pts = R.cars[p].trail;
    const jusque = (p === pa) ? pts.slice(0, -1) : pts;
    if (jusque.length > 1) {
      g.beginPath(); g.moveTo(gx(jusque[0][0]), gy(jusque[0][1]));
      for (let i = 1; i < jusque.length; i++) g.lineTo(gx(jusque[i][0]), gy(jusque[i][1]));
      g.strokeStyle = COUL[p]; g.lineWidth = 2.4 / 1; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
    }
  }
  g.beginPath();
  g.moveTo(gx(from[0]), gy(from[1]));
  g.lineTo(gx(pos[0]), gy(pos[1]));
  g.strokeStyle = COUL[pa]; g.lineWidth = 3; g.lineCap = 'round'; g.stroke();

  R.cars.forEach((c, autre) => { if (autre !== pa && !c.fini) petiteVoiture(g, c.p, COUL[autre], caps[autre]); });
  petiteVoiture(g, pos, COUL[pa], ang);
  g.restore();

  // filets de vitesse, en repère écran
  const vit = Math.max(Math.abs(to[0] - from[0]), Math.abs(to[1] - from[1]));
  if (vit >= 2 && t < 0.9) {
    g.save();
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const x = (i * 97 + Math.round(t * 600)) % W;
      const L = 14 + vit * 7;
      g.globalAlpha = 0.16 + 0.2 * Math.random();
      g.beginPath(); g.moveTo(x, (i * 53) % H); g.lineTo(x, ((i * 53) % H) + L); g.stroke();
    }
    g.restore();
  }

  // liseré du haut, comme une incrustation télé
  g.fillStyle = 'rgba(14,18,24,0.55)';
  g.fillRect(0, 0, W, 3);
}

function petiteVoiture(g, p, col, ang) {
  const x = gx(p[0]), y = gy(p[1]);
  const Lo = cellPx * 0.92, La = cellPx * 0.54;
  g.save(); g.translate(x, y); g.rotate(ang);
  g.fillStyle = '#2B3138';
  const rw = Lo * 0.2, rh = La * 0.2;
  for (const [ox, oy] of [[-Lo * 0.26, -La * 0.5], [-Lo * 0.26, La * 0.5], [Lo * 0.26, -La * 0.5], [Lo * 0.26, La * 0.5]])
    g.fillRect(ox - rw / 2, oy - rh / 2, rw, rh);
  g.fillStyle = col;
  g.beginPath(); g.rect(-Lo / 2, -La / 2, Lo, La); g.fill();
  g.strokeStyle = 'rgba(16,20,26,0.55)'; g.lineWidth = 1; g.stroke();
  g.fillStyle = 'rgba(250,251,248,0.85)';
  g.beginPath(); g.ellipse(Lo * 0.06, 0, Lo * 0.17, La * 0.28, 0, 0, 6.2832); g.fill();
  g.restore();
}

function finRejeu() {
  $('rejeubox').classList.remove('on');
  const f = rejeu.fin; rejeu = null;
  if (f) f();
}

// ================= boucle =================
function tick(now) {
  raf = null;
  let besoin = false;
  if (anim) {
    anim.t = Math.min(1, (now - anim.t0) / anim.dur);
    if (anim.t >= 1) { const fin = anim.fin; anim = null; if (fin) fin(); }
    besoin = true;
  }
  if (rejeu) {
    rejeu.t = Math.min(1, (now - rejeu.t0) / rejeu.dur);
    dessineRejeu();
    if (rejeu.t >= 1) finRejeu();
    besoin = true;
  }
  if (replay) {
    replay.t = Math.min(1, (now - replay.t0) / replay.dur);
    if (replay.t >= 1) { const fin = replay.fin; replay = null; if (fin) fin(); }
    besoin = true;
  }
  if (!besoin && R && !finie(R) && opts.length && opts.filter(o => o.ok).length <= 3 && !REDUIT) besoin = true;
  render();
  if (camBouge) besoin = true;
  if ($('game').style.display !== 'none' && besoin) raf = requestAnimationFrame(tick);
}
function boucle() { if (!raf) raf = requestAnimationFrame(tick); }

// ================= pavé =================
// Le repère du pavé est celui de l'écran (haut = vers le haut de la feuille).
// Son nom parlé, lui, dépend de la vitesse : « haut » accélère une voiture qui
// monte et freine une voiture qui descend.
const DIR_ECRAN = ['vers le haut à gauche', 'vers le haut', 'vers le haut à droite',
  'vers la gauche', 'sur place', 'vers la droite',
  'vers le bas à gauche', 'vers le bas', 'vers le bas à droite'];

function padLabel(k, o, car) {
  if (o.interdit) return contrainte(R.track, car) === 'huile' ? "Impossible sur l'huile : la vitesse ne change pas" : 'Impossible sur la piste mouillée : on ne peut que freiner';
  if (o.bloque) return 'Occupé par une autre voiture';
  if (!o.ok) return 'Hors piste';
  const dx = o.dx, dy = o.dy, v = car.v;
  if (!dx && !dy) return (v[0] || v[1]) ? 'Garder la même vitesse' : 'Rester sur place';
  if (!v[0] && !v[1]) return 'Partir ' + DIR_ECRAN[k];
  const dot = dx * v[0] + dy * v[1];
  const tour = v[0] * dy - v[1] * dx;          // y vers le bas : positif = vers la droite
  const cote = tour > 0 ? 'à droite' : tour < 0 ? 'à gauche' : '';
  if (dot > 0) return 'Accélérer' + (cote ? ' en tournant ' + cote : '');
  if (dot < 0) return 'Freiner' + (cote ? ' en tournant ' + cote : '');
  return 'Tourner ' + cote;
}

// en ligne : on attend son tour, la connexion, et le départ
const attenteLigne = () => mode === 'ligne' && !!ligne && ligne.actif && !!R && (R.turn !== ligne.siege || !ligne.connecte || !ligne.lancee);
function occupe() {
  return depart || aiBusy || !!anim || !!replay || !!rejeu || (!!R && estFantome(R.turn)) || attenteLigne();
}

function renderPad() {
  const pad = $('pad');
  const avaitFocus = document.activeElement && document.activeElement.classList.contains('padbtn')
    ? +document.activeElement.dataset.k : -1;
  const bloque = occupe() || finie(R);
  const car = R.cars[R.turn];
  pad.innerHTML = opts.map((o, k) => {
    const dis = !o.ok || bloque;
    const on = selected === k;
    const ex = 12 + (k % 3 - 1) * 7, ey = 12 + ((k / 3 | 0) - 1) * 7;
    let inner;
    if (o.interdit) inner = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"></path></svg>';
    else if (o.bloque) inner = '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M7 12h10" stroke-linecap="round"></path></svg>';
    else if (!o.ok) inner = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6 L18 18M18 6 L6 18"></path></svg>';
    else if (k === 4) inner = '<span class="egal" aria-hidden="true">=</span>';
    else inner = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 12 L${ex} ${ey}"></path><circle cx="${ex}" cy="${ey}" r="2.6" fill="currentColor" stroke="none"></circle></svg>`;
    const etat = o.ok ? '' : (o.bloque ? ' pris' : (o.interdit ? ' zone' : ' ko'));
    return `<button type="button" class="padbtn b${R.turn}${on ? ' on' : ''}${etat}" data-k="${k}" ${dis ? 'disabled' : ''} aria-pressed="${on}" aria-label="${padLabel(k, o, car)}">${inner}</button>`;
  }).join('');
  for (const b of pad.querySelectorAll('.padbtn')) {
    b.addEventListener('click', () => choisir(+b.dataset.k));
  }
  // innerHTML recrée les boutons : sans ça, le clavier perdait sa place à chaque choix
  if (avaitFocus >= 0) { const b = pad.querySelector(`[data-k="${avaitFocus}"]`); if (b && !b.disabled) b.focus(); }
}

function choisir(k) {
  if (!R || finie(R) || occupe()) return;
  if (!opts[k] || !opts[k].ok) return;
  selected = k; sonClic(); refresh();
}

// ================= bandeaux =================
const pct = (car) => Math.round(Math.max(0, Math.min(1, (car.tour + avanceDe(R.track, car.p) / R.D) / R.laps)) * 100);
const nomDe = (p) => mode === 'ligne' && ligne ? (p === ligne.siege ? 'Toi' : NOMS[p])
  : (mode === 'solo' && p === 1) ? 'Fantôme' : ((mode === 'solo' || mode === 'gp') && p === 0) ? 'Toi' : NOMS[p];
const eme = (r) => r === 1 ? '1er' : r + 'e';

function renderBars() {
  const row = $('plrow'), n = R.cars.length;
  if (row.children.length !== n) row.innerHTML = R.cars.map((c, p) => `<div class="pl b${p}" id="p${p}"></div>`).join('');
  row.classList.toggle('serre', n > 2);
  if (n > 2) {
    // à plus de deux : le numéro de chaque voiture et sa place dans la course
    const cl = classement(R);
    for (let p = 0; p < n; p++) {
      const car = R.cars[p], rang = cl.find(c => c.voiture === p).rang;
      const actif = R.turn === p && !finie(R);
      const el = $('p' + p);
      el.className = 'pl b' + p + (actif ? ' actif' : '');
      el.setAttribute('aria-label', `${nomDe(p)}, voiture ${p + 1} : ${eme(rang)}${car.abandon ? ', a quitté la course' : ''}${actif ? ', à son tour' : ''}`);
      el.innerHTML = `<span class="rond" style="background:${COUL[p]}" aria-hidden="true">${p + 1}</span><span class="rang" aria-hidden="true">${eme(rang)}</span>`;
    }
    return;
  }
  for (let p = 0; p < 2; p++) {
    const car = R.cars[p];
    const actif = R.turn === p && !finie(R);
    const el = $('p' + p);
    el.className = 'pl b' + p + (actif ? ' actif' : '');
    el.setAttribute('aria-label', `${nomDe(p)} : ${car.coups} coups, ${pct(car)} % du tour${actif ? ', à son tour' : ''}`);
    el.innerHTML = `<span class="dot" style="background:${COUL[p]}"></span>
      <span class="pname">${nomDe(p)}</span>
      <span class="jauge"><i style="width:${pct(car)}%;background:${COUL[p]}"></i></span>
      <span class="num" aria-hidden="true">${car.coups}</span>`;
  }
}

function renderInfo() {
  const car = R.cars[R.turn];
  $('speed').textContent = Math.max(Math.abs(car.v[0]), Math.abs(car.v[1]));
  const a = arret(car);
  const dehors = (car.v[0] || car.v[1]) && (!onTrack(R.track, a.point[0], a.point[1]) || !segOk(R.track, car.p, a.point));
  $('stop').textContent = a.coups;
  // course finie : plus rien à craindre, pas d'alerte rouge sur des chiffres figés
  $('stop').classList.toggle('alerte', !!dehors && !finie(R));
  const dispo = opts.filter(o => o.ok).length;
  let txt = dispo + '/9', peu = dispo <= 3;
  if (selected !== null && opts[selected] && opts[selected].ok) {
    const q = opts[selected].p;
    const v = [q[0] - car.p[0], q[1] - car.p[1]];
    const pr = [q[0] + v[0], q[1] + v[1]];
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const t = [pr[0] + dx, pr[1] + dy];
      if (onTrack(R.track, t[0], t[1]) && segOk(R.track, q, t)) n++;
    }
    txt = dispo + ' → ' + n; peu = n <= 3;
  }
  $('issues').textContent = txt;
  $('issues').classList.toggle('alerte', peu && !finie(R));
  const bloque = occupe();
  const coince = !finie(R) && opts.length > 0 && dispo === 0;
  const go = $('go');
  const autreLigne = mode === 'ligne' && ligne ? 1 - ligne.siege : -1;
  go.textContent = finie(R) ? 'Terminé'
    : (mode === 'solo' && R.turn === 1) ? 'Le fantôme réfléchit…'
      : (mode === 'gp' && estFantome(R.turn)) ? `À ${NOMS[R.turn]}, ${placeDansLeTour()} sur ${vivantes()}`
      : mode === 'ligne' && ligne && !ligne.connecte ? 'Reconnexion…'
      : mode === 'ligne' && ligne && !ligne.lancee ? "En attente de l'autre joueur…"
      : mode === 'ligne' && ligne && !ligne.presents[autreLigne] && R.turn === autreLigne ? `${NOMS[autreLigne]} s'est absenté…`
      : mode === 'ligne' && ligne && R.turn !== ligne.siege ? `Au tour de ${NOMS[R.turn]}…`
      : coince ? "Coincé : je m'arrête" : 'Tracer';
  go.disabled = coince ? bloque : (selected === null || !opts[selected] || !opts[selected].ok || bloque);
  go.className = !finie(R) ? 'b' + R.turn : 'fin';
  $('annuler').disabled = !peutAnnuler();
  const z = finie(R) ? null : contrainte(R.track, car), arrete = !car.v[0] && !car.v[1];
  $('zonemsg').textContent = !z ? '' : arrete ? (z === 'huile' ? "Flaque d'huile : repars doucement" : 'Piste mouillée : repars doucement')
    : z === 'huile' ? "Flaque d'huile : impossible de changer de vitesse" : 'Piste mouillée : tu ne peux que freiner';
  $('zonemsg').hidden = !z;
}

// dans le tour de jeu : combien de voitures ont déjà joué, et combien roulent encore
const vivantes = () => R.cars.filter(c => !c.fini && !c.abandon).length;
const placeDansLeTour = () => vivantes() - (R.file ? R.file.length : 0);

function refresh() { renderPad(); renderBars(); renderInfo(); render(); boucle(); }

function newOpts() {
  opts = choices(R);
  selected = null;
  const ok = opts.map((o, k) => o.ok ? k : -1).filter(k => k >= 0);
  if (ok.length === 1) selected = ok[0];
  if (ok.length <= 3 && !finie(R)) sonTension();
}

// ================= championnat =================
// Seul, on court le championnat : les circuits s'ouvrent dans l'ordre (rangé du
// plus facile au plus dur par tools/paper-race-difficulte.js), le suivant dès
// qu'on a FINI le précédent, gagné ou pas. Chaque circuit garde ton meilleur
// tour et sa médaille face au par. À deux, on court librement sur ce qui est
// ouvert. Aucune série, aucun rendez-vous : rien ne se perd si on ne vient pas.
// ⚠️ v2 (2026-09-18) : les pièges sont revenus et les pars ont changé, un record
// d'avant ne se compare plus. Les médailles repartent de zéro ; les circuits
// déjà FINIS restent ouverts (on lit aussi v1 pour ça).
const CLE_RECORDS = 'paper-race.records.v2', CLE_RECORDS_V1 = 'paper-race.records.v1';
function lireRecords(cle) {
  try { const r = JSON.parse(localStorage.getItem(cle) || '{}'); return r && typeof r === 'object' ? r : {}; } catch (e) { return {}; }
}
const records = () => lireRecords(CLE_RECORDS);
// Or : à 5 % du tour parfait, le niveau de l'ordinateur « vite ». Argent : à
// 20 %. Bronze : avoir fini. (10 % et 30 % d'abord : un joueur a tout fini en or.)
function seuils(tk) { return { or: Math.ceil(tk.par * 1.05), argent: Math.ceil(tk.par * 1.2) }; }
function medaille(tk, coups) {
  if (!coups) return null;
  const s = seuils(tk);
  return coups <= s.or ? 'or' : coups <= s.argent ? 'argent' : 'bronze';
}
const NOM_MEDAILLE = { or: "d'or", argent: "d'argent", bronze: 'de bronze' };
function ouvert(k) { return k === 0 || !!records()[TRACKS[k - 1].id] || !!lireRecords(CLE_RECORDS_V1)[TRACKS[k - 1].id]; }
// le circuit à courir ensuite : le premier ouvert jamais fini, sinon le dernier ouvert
function prochain() {
  const r = Object.assign({}, lireRecords(CLE_RECORDS_V1), records()); let dernier = 0;
  for (let k = 0; k < TRACKS.length; k++) {
    if (!ouvert(k)) break;
    dernier = k;
    if (!r[TRACKS[k].id]) return k;
  }
  return dernier;
}
function noterRecord(tk, coups) {
  const r = records(), avant = r[tk.id] ? r[tk.id].coups : null;
  const mieux = avant === null || coups < avant;
  if (mieux) { r[tk.id] = { coups }; try { localStorage.setItem(CLE_RECORDS, JSON.stringify(r)); } catch (e) { } }
  return { avant, mieux };
}
function svgMedaille(m, t) {
  const c = { or: ['#E2B33C', '#9C7414'], argent: ['#C9CED6', '#6E7683'], bronze: ['#CD8B55', '#8A5226'] }[m];
  return `<svg class="medaille" width="${t}" height="${t}" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2h3l1 6-3 1zM13 2h3l-1 7-3-1z" fill="#2B4C8C"/><circle cx="12" cy="15" r="7" fill="${c[0]}" stroke="${c[1]}" stroke-width="1.6"/><path d="M12 11.2l1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z" fill="${c[1]}" opacity=".7"/></svg>`;
}

// ================= mémoire : annuler, reprendre =================
// L'état de la course tient en JSON ; seul le circuit (et son cache de champ) se
// rebranche depuis TRACKS.
// v3 (v8) : une course « grille » garde aussi sa grille, son ordre et son tour de jeu.
const CHAMPS_GRILLE = ['n', 'grille', 'ordre', 'manche', 'file', 'arrivees', 'aspires', 'abandons', 'terminee', 'photo'];
function instantane() {
  const o = {
    v: 3, id: R.track.id, fin: R.fin, laps: R.laps, cars: R.cars, turn: R.turn, winner: R.winner, dernier: R.dernier,
    regles: R.regles || 'classique', mode, level, caps, capsAvant, dernierMoment
  };
  if (R.regles === 'grille') for (const k of CHAMPS_GRILLE) o[k] = R[k];
  return JSON.parse(JSON.stringify(o));
}
const courseValide = (o) => o && (o.v === 2 || o.v === 3) && indexDe(o.id) >= 0 && Array.isArray(o.cars)
  && o.cars.length >= 2 && o.cars.length <= 6 && (o.regles === 'grille' || o.cars.length === 2)
  && o.cars.every(c => c && Array.isArray(c.p) && Array.isArray(c.v) && Array.isArray(c.trail))
  && (o.regles !== 'grille' || (Array.isArray(o.grille) && o.grille.length === o.cars.length && Array.isArray(o.file)));

// ⚠️ v2 : le circuit se retrouve par son id. Avant la v4 on rangeait son NUMÉRO,
// et l'ordre des circuits a changé avec le championnat : une course v1 aurait
// repris sur un autre circuit. Elle est simplement ignorée.
const indexDe = (id) => TRACKS.findIndex(t => t.id === id);
function restaurer(o) {
  if (!courseValide(o)) return false;
  mode = o.mode === 'solo' || o.mode === 'gp' ? o.mode : 'duo';
  if (NIVEAUX[o.level]) level = o.level;
  ti = indexDe(o.id);
  const n = o.cars.length;
  if (o.regles === 'grille') {
    R = newRace(ti, o.laps || 1, 'tour', { n, regles: 'grille', grille: o.grille, ordre: o.ordre });
    for (const k of CHAMPS_GRILLE) if (o[k] !== undefined) R[k] = JSON.parse(JSON.stringify(o[k]));
    if (mode === 'gp') nbVoitures = n;
  } else R = newRace(ti, o.laps || 1, o.fin);
  R.cars = JSON.parse(JSON.stringify(o.cars));
  R.turn = Number.isInteger(o.turn) && o.turn >= 0 && o.turn < n ? o.turn : 0;
  R.winner = Number.isInteger(o.winner) && o.winner >= 0 && o.winner < n ? o.winner : null;
  R.dernier = o.dernier || null;
  if (Array.isArray(o.caps)) o.caps.forEach((c, i) => { if (i < 6) caps[i] = c; });
  if (Array.isArray(o.capsAvant)) o.capsAvant.forEach((c, i) => { if (i < 6) capsAvant[i] = c; });
  dernierMoment = typeof o.dernierMoment === 'number' ? o.dernierMoment : -9;
  return true;
}

function sauverCourse(ecran) {
  if (!R || mode === 'ligne') return;   // en ligne, c'est le relais qui garde la course
  try {
    if (finie(R)) { localStorage.removeItem(CLE_COURSE); return; }
    const o = instantane(); o.ecran = ecran || 'jeu';
    localStorage.setItem(CLE_COURSE, JSON.stringify(o));
  } catch (e) { }
}

function lireCourse() {
  try {
    const o = JSON.parse(localStorage.getItem(CLE_COURSE) || 'null');
    if (courseValide(o)) {
      const fini = o.regles === 'grille' ? !!o.terminee : o.fin === 'joueur' ? o.cars[0].fini : o.winner !== null;
      if (!fini) return o;
    }
  } catch (e) { }
  return null;
}

function peutAnnuler() {
  if (mode === 'ligne') return false;
  return !!precedent && !!R && !finie(R) && !occupe();
}

function annuler() {
  if (!peutAnnuler()) return;
  const o = precedent; precedent = null;
  jeton++;
  restaurer(o);
  flash = null;
  newOpts(); refresh();
  sauverCourse('jeu');
  toast('Coup annulé');
}

// ================= tours =================
function commit(k) {
  const car = R.cars[R.turn];
  const depart = car.p.slice();
  const pa = R.turn;
  // en solo, annuler défait le coup du joueur ET la réponse du fantôme : on ne
  // garde donc que l'état d'avant un coup humain
  if (!estFantome(pa)) precedent = instantane();
  const nCoup = coupsJoues(R);
  const ev = play(R, opts[k].p);
  if (mode === 'ligne') coupLocal(nCoup, k);
  const arrivee = car.p.slice();
  const len = Math.hypot(arrivee[0] - depart[0], arrivee[1] - depart[1]);
  const j = jeton;
  flash = null;
  opts = []; selected = null;
  renderPad(); renderInfo();

  const vit = Math.max(Math.abs(depart[0] - arrivee[0]), Math.abs(depart[1] - arrivee[1]));
  // les fantômes du Grand Prix roulent plus vite à l'écran : jusqu'à cinq entre deux de tes coups
  const dur = REDUIT ? 1 : Math.min(320, 180 + len * 16) * (mode === 'gp' && pa !== 0 ? 0.6 : 1);
  if (ev.type === 'sortie' || ev.type === 'blocage') { sonSortie(); secousse = 14; }
  else {
    moteur(vit, dur / 1000);
    if (vit >= 4) secousse = Math.min(7, vit * 1.1);
    const avant = capsAvant[pa];
    if (avant !== null && len > 1) {
      let da = Math.abs(Math.atan2(arrivee[1] - depart[1], arrivee[0] - depart[0]) - avant);
      while (da > Math.PI) da = Math.abs(da - 2 * Math.PI);
      if (da > 0.45) sonCrisse(Math.min(1, da));
    }
  }
  capsAvant[pa] = len ? Math.atan2(arrivee[1] - depart[1], arrivee[0] - depart[0]) : capsAvant[pa];

  const avantMoi = avanceDe(R.track, depart);
  const avantAutres = R.cars.map((c, i) => i === pa || c.fini ? null : avanceDe(R.track, c.p));

  const suite = () => {
    if (j !== jeton) return;
    if (ev.type === 'sortie') {
      flash = ev;
      toast(`Sortie de piste : la voiture ${ADJ[ev.joueur]} repart à l'arrêt`);
    }
    if (ev.type === 'boost') { note(740, .12, .08, 'square'); note(980, .16, .08, 'square', .1); toast('Accélérateur : une case de plus'); }
    if (ev.type === 'blocage') toast(`Accrochage : la voiture ${ADJ[ev.joueur]} s'arrête derrière l'autre`);
    if (ev.type === 'arrivee' && !finie(R)) {
      if (R.regles === 'grille') toast(`${nomDe(pa) === 'Toi' ? 'Tu passes' : NOMS[pa] + ' passe'} la ligne : on finit le tour de jeu`);
      else toast('Le fantôme est arrivé : finis ton tour !');
    }
    // à plusieurs, la course s'arrête à la fin du tour de jeu : c'est nextTurn qui le dit
    if (!finie(R)) avancerTour();
    if (finie(R)) {
      precedent = null; sauverCourse(); conclure(); renderInfo();
      setTimeout(() => { if (j === jeton) lancerReplay(() => drapeau(showWin)); }, 280);
      return;
    }
    newOpts(); refresh();
    sauverCourse('jeu');
    if (estFantome(R.turn)) setTimeout(() => { if (j === jeton) aiTurn(); }, mode === 'gp' ? 90 : 480);
  };

  const apres = () => {
    if (j !== jeton) return;
    // en Grand Prix, seuls TES moments forts passent au ralenti : cinq fantômes, ce serait long
    const m = REDUIT || (mode === 'gp' && pa !== 0) ? null : momentFort(ev, pa, depart, arrivee, avantMoi, avantAutres);
    if (m && dernierMoment < coupsJoues(R) - 1) {
      dernierMoment = coupsJoues(R);
      lancerRejeu(m, pa, depart, arrivee, suite);
    } else suite();
  };
  if (len === 0 || REDUIT) { setTimeout(apres, 40); render(); return; }
  anim = { pa, to: arrivee, t: 0, t0: performance.now(), dur: dur, fin: apres };
  boucle();
}

function forceArret() {
  const j = jeton;
  if (!estFantome(R.turn)) precedent = instantane();
  const nCoup = coupsJoues(R);
  const ev = stuck(R);
  if (mode === 'ligne') coupLocal(nCoup, 9);
  sonSortie();
  toast(`La voiture ${ADJ[ev.joueur]} n'a plus aucune trajectoire : elle s'arrête net`);
  opts = []; selected = null;
  if (!finie(R)) avancerTour();
  if (finie(R)) { precedent = null; sauverCourse(); conclure(); setTimeout(() => { if (j === jeton) lancerReplay(() => drapeau(showWin)); }, 300); return; }
  newOpts(); refresh();
  sauverCourse('jeu');
  if (estFantome(R.turn)) setTimeout(() => { if (j === jeton) aiTurn(); }, mode === 'gp' ? 160 : 480);
}

// Au suivant. À plusieurs, la fin d'un tour de jeu donne l'aspiration : on la dit.
function avancerTour() {
  const m0 = R.manche;
  nextTurn(R);
  if (R.regles !== 'grille' || (R.manche === m0 && !finie(R)) || !R.aspires || !R.aspires.length) return;
  const qui = R.aspires.map(p => nomDe(p) === 'Toi' ? 'toi' : NOMS[p]);
  toast(`Aspiration : +1 de vitesse pour ${qui.join(', ')}`);
}

function lancerReplay(apres) {
  flash = null;
  replay = {
    t: 0, t0: performance.now(), dur: REDUIT ? 1 : 2600,
    fin: apres || showWin
  };
  boucle();
}

function aiTurn() {
  if (!R || finie(R)) return;
  const j = jeton;
  aiBusy = true; renderInfo();
  // en Grand Prix, jusqu'à cinq fantômes jouent entre deux de tes coups : ils vont plus vite
  const vif = mode === 'gp';
  setTimeout(() => {
    if (j !== jeton) return;
    const q = aiChoice(R, level, Math.random);
    if (q === null) { aiBusy = false; forceArret(); return; }
    const k = opts.findIndex(o => o.p[0] === q[0] && o.p[1] === q[1]);
    selected = k >= 0 ? k : 4;
    render();
    setTimeout(() => { if (j !== jeton) return; aiBusy = false; commit(selected); }, vif ? 150 : 500);
  }, vif ? 60 : 340);
}

cv.addEventListener('click', (ev) => {
  if (!R || finie(R) || occupe()) return;
  const b = cv.getBoundingClientRect();
  const x = ev.clientX - b.left - 2 + camX, y = ev.clientY - b.top - 2 + camY;
  let bk = -1, bd = 1e9;
  opts.forEach((o, k) => {
    if (!o.ok) return;
    const d = Math.hypot(gx(o.p[0]) - x, gy(o.p[1]) - y);
    if (d < bd) { bd = d; bk = k; }
  });
  if (bk >= 0 && bd < cellPx * 0.6) choisir(bk);
});

// ================= écrans =================
let minuteurToast = null;
function toast(txt) {
  const t = $('toast');
  // vidé puis réécrit : une même annonce deux fois de suite est relue
  t.textContent = '';
  t.classList.add('on');
  requestAnimationFrame(() => { t.textContent = txt; });
  clearTimeout(minuteurToast);
  minuteurToast = setTimeout(() => t.classList.remove('on'), 2600);
}

function drapeau(apres) {
  const d = $('drapeau');
  d.style.display = 'block';
  d.classList.remove('on');
  void d.offsetWidth;
  d.classList.add('on');
  souffle(0.9, 700, 220, 0.09, 0.7);
  note(523, .18, .09, 'triangle', .1); note(659, .18, .09, 'triangle', .26); note(880, .4, .1, 'triangle', .42);
  setTimeout(apres, REDUIT ? 60 : 1250);
}

let suivant = -1, bilan = null;
// ⚠️ Le bilan se fait UNE fois, à l'arrivée. Calculé dans showWin, « Revoir la
// course » le refaisait : le record venait d'être rangé, donc « Nouveau record »
// devenait « Ton record », et « Nouveau circuit ouvert » disparaissait.
function conclure() {
  bilan = null;
  if (mode !== 'solo') return;
  const tk = TRACKS[ti];
  const etaitOuvert = ti + 1 < TRACKS.length && ouvert(ti + 1);
  bilan = { etaitOuvert, rec: noterRecord(tk, R.cars[0].coups) };
}
function showWin() {
  const tk = TRACKS[ti], par = tk.par;
  const solo = mode === 'solo';
  suivant = -1;
  let titre, sub, m = null;
  if (solo) {
    // en championnat, la course va jusqu'à TON arrivée : c'est ton tour qui compte
    const moi = R.cars[0], fant = R.cars[1];
    if (!bilan) conclure();
    const { etaitOuvert, rec } = bilan;
    m = medaille(tk, moi.coups);
    titre = `Tu boucles le tour en ${moi.coups} coups !`;
    const s = seuils(tk);
    const cible = m === 'or' ? (moi.coups <= par ? 'Le tour parfait !' : `Le par est à ${par} : le tour parfait existe.`)
      : m === 'argent' ? `L'or est à ${s.or} coups.` : `L'argent est à ${s.argent} coups, l'or à ${s.or}.`;
    const record = rec.avant === null ? '' : rec.mieux ? ` Nouveau record, tu avais ${rec.avant}.` : ` Ton record : ${rec.avant}.`;
    const fantome = fant.fini ? ` Le fantôme a bouclé en ${fant.coups}.` : " Le fantôme n'était pas arrivé !";
    sub = cible + record + fantome;
    if (ti + 1 < TRACKS.length) {
      suivant = ti + 1;
      if (!etaitOuvert) sub += ` Nouveau circuit ouvert : ${TRACKS[ti + 1].nom}.`;
    }
  } else if (R.regles === 'grille' && mode !== 'ligne') {
    // à plusieurs : le classement complet
    const cl = classement(R), w = cl[0].voiture, gagnant = R.cars[w];
    const moi = mode === 'gp' ? cl.find(c => c.voiture === 0) : null;
    titre = moi ? (moi.rang === 1 ? `Victoire en ${gagnant.coups} coups !` : `Tu finis ${eme(moi.rang)} sur ${R.cars.length}`)
      : `${NOMS[w]} gagne en ${gagnant.coups} coups !`;
    const ec = gagnant.coups - par;
    sub = R.photo ? 'Photo-finish : plusieurs voitures ont passé la ligne dans le même tour de jeu, la première sur la ligne gagne.'
      : ec <= 0 ? 'Pile le par : le tour parfait !' : `Le par est à ${par} coups.`;
    $('winclass').innerHTML = cl.map(c => {
      const qui = nomDe(c.voiture);
      const note = c.abandon ? 'a quitté la course' : c.fini ? (R.photo && c.rang <= R.arrivees.length ? 'sur la ligne' : 'arrivée') : 'en course';
      return `<li><span class="rg">${eme(c.rang)}</span><span class="rond" style="background:${COUL[c.voiture]}">${c.voiture + 1}</span><span>${qui}${c.exaequo ? ' (ex aequo)' : ''} <i>${note}</i></span></li>`;
    }).join('');
  } else {
    const p = R.winner, gagnant = R.cars[p], ec = gagnant.coups - par;
    titre = mode === 'ligne' && ligne && p === ligne.siege ? `Tu boucles le tour en ${gagnant.coups} coups !`
      : `${NOMS[p]} boucle le tour en ${gagnant.coups} coups !`;
    sub = ec <= 0 ? 'Pile le par : le tour parfait !'
      : `Le par est à ${par} : ${ec} coup${ec > 1 ? 's' : ''} à gagner la prochaine fois.`;
    sub += gagnant.crashes ? ` ${gagnant.crashes} sortie${gagnant.crashes > 1 ? 's' : ''} de piste.` : ' Sans une seule sortie de piste.';
  }
  $('winclass').hidden = !(R.regles === 'grille' && mode !== 'ligne');
  $('wincard').className = 'wincard b' + (solo ? 0 : R.winner);
  $('winmedaille').innerHTML = m ? svgMedaille(m, 44) + `<span>Médaille ${NOM_MEDAILLE[m]}</span>` : '';
  $('winmedaille').hidden = !m;
  $('wintitle').textContent = titre;
  $('winsub').textContent = sub;
  $('suivant').hidden = suivant < 0;
  if (suivant >= 0) $('suivant').textContent = `Manche suivante : ${TRACKS[suivant].nom}`;
  $('again').className = suivant >= 0 ? 'outline' : 'light';
  $('again').textContent = mode === 'ligne' ? 'Revanche' : 'Refaire la course';
  $('backmenu').textContent = mode === 'ligne' ? 'Quitter la course en ligne' : 'Changer de circuit';
  $('win').style.display = 'flex';
  (suivant >= 0 ? $('suivant') : $('again')).focus();
}

let depart = false;

function feuxDepart(apres) {
  const box = $('feux');
  const lampes = box.querySelectorAll('.lampe');
  const j = jeton;
  lampes.forEach(l => l.className = 'lampe');
  box.style.display = 'flex';
  depart = true;
  let i = 0;
  const fin = () => { if (j !== jeton) return; box.style.display = 'none'; depart = false; apres(); };
  const pas = () => {
    if (j !== jeton) return;
    if (i < lampes.length) {
      lampes[i].classList.add('rouge');
      sonBip(false);
      i++;
      setTimeout(pas, REDUIT ? 160 : 620);
    } else {
      setTimeout(() => {
        if (j !== jeton) return;
        lampes.forEach(l => { l.classList.remove('rouge'); l.classList.add('verte'); });
        sonBip(true);
        moteur(5, 0.5);
        setTimeout(fin, REDUIT ? 200 : 620);
      }, REDUIT ? 200 : 400 + Math.random() * 700);
    }
  };
  setTimeout(pas, 320);
}

function montrerJeu() {
  $('win').style.display = 'none';
  $('drapeau').style.display = 'none';
  $('menu').style.display = 'none';
  $('game').style.display = 'flex';
  $('trackname').textContent = TRACKS[ti].nom;
  $('parline').textContent = 'par ' + TRACKS[ti].par;
}

function remiseAZero() {
  jeton++;
  terrain = null;
  rejeu = null; anim = null; replay = null; flash = null; aiBusy = false; depart = false;
  $('rejeubox').classList.remove('on');
  $('feux').style.display = 'none';
}

// Le Grand Prix court sur tous les circuits, mais à plus de deux seulement sur
// les grands : les petits sont trop étroits pour doubler (mesuré, voir la spec).
const grandsCircuits = () => TRACKS.map((t, k) => k).filter(k => pelotonPermis(TRACKS[k]));
const circuitPermis = (k) => mode !== 'gp' || nbVoitures <= 2 || pelotonPermis(TRACKS[k]);

function start() {
  remiseAZero();
  if (mode === 'gp') { if (!circuitPermis(ti)) ti = grandsCircuits()[0]; }
  else if (!ouvert(ti)) ti = prochain();
  bilan = null;
  // le championnat garde la course de la v7 ; à deux et en Grand Prix, la grille
  if (mode === 'solo') R = newRace(ti, 1, 'joueur');
  else { const n = mode === 'gp' ? nbVoitures : 2; R = newRace(ti, 1, 'tour', { n, regles: 'grille', grille: tirage(n) }); }
  precedent = null;
  dernierMoment = -9;
  caps.fill(-Math.PI / 2);
  capsAvant.fill(null);
  newOpts();
  montrerJeu();
  layout(); refresh();
  requestAnimationFrame(() => { layout(); render(); });
  audio(); saveReglages(); sauverCourse('jeu');
  const j = jeton;
  feuxDepart(() => { refresh(); if (estFantome(R.turn)) setTimeout(() => { if (j === jeton) aiTurn(); }, 400); });
}

// Reprendre là où on en était : rechargement, écran éteint, application tuée.
function reprendre(o) {
  remiseAZero();
  if (!restaurer(o)) return false;
  precedent = null;
  newOpts();
  montrerJeu();
  layout(); refresh();
  requestAnimationFrame(() => { layout(); render(); });
  sauverCourse('jeu');
  if (estFantome(R.turn)) { const j = jeton; setTimeout(() => { if (j === jeton) aiTurn(); }, 500); }
  return true;
}

function versAccueil() {
  if (R && !finie(R)) sauverCourse('accueil');
  remiseAZero();
  $('drapeau').style.display = 'none'; $('win').style.display = 'none';
  $('game').style.display = 'none'; $('menu').style.display = 'flex';
  majAccueil();
  $('jouer').focus();
}

function saveReglages() {
  try { localStorage.setItem(CLE_REGLAGES, JSON.stringify({ mode, level, voitures: nbVoitures, circuit: TRACKS[ti].id, sonOn })); } catch (e) { }
}

// ================= feuilles (réglages, règles) =================
let ouvreur = null;
function ouvrir(id) {
  ouvreur = document.activeElement;
  $(id).hidden = false;
  if (id === 'reglages') majReglages();
  const corps = $(id).querySelector('.corps');
  if (corps) corps.scrollTop = 0;
  const b = $(id).querySelector('.corps button:not([hidden])');
  if (b) b.focus();
}
function fermer() {
  let ferme = false;
  for (const id of ['reglages', 'regles']) if (!$(id).hidden) { $(id).hidden = true; ferme = true; }
  if (ferme && ouvreur && ouvreur.focus) ouvreur.focus();
  return ferme;
}
for (const id of ['reglages', 'regles']) {
  $(id).addEventListener('click', (e) => { if (e.target === $(id) || e.target.closest('[data-fermer]')) fermer(); });
}

function majReglages() {
  $('sonOui').setAttribute('aria-pressed', sonOn);
  $('sonNon').setAttribute('aria-pressed', !sonOn);
  // ⚠️ au démarrage, la course est cachée par la FEUILLE DE STYLE : son style en
  // ligne est vide, et « !== 'none' » la croyait affichée. L'accueil proposait
  // donc « Recommencer la course » sans aucune course.
  const enCourse = $('game').style.display === 'flex';
  const enLigne = !!(ligne && ligne.actif);
  $('recommencer').hidden = !enCourse || enLigne;
  $('accueil').hidden = !enCourse || enLigne;
  $('quitterLigne').hidden = !enLigne;
  verifierInstalle();
  diagnostic();
}

// ================= accueil =================
// La vignette d'un circuit, dans une boîte fixe : chaque circuit a sa taille.
function vignette(k) {
  const tk = TRACKS[k], C = tk.cols || 21, Rw = tk.rows || 26;
  const BW = 44, BH = 54, e = Math.min((BW - 2) / C, (BH - 2) / Rw);
  const c = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  c.width = BW * dpr; c.height = BH * dpr; c.style.width = BW + 'px'; c.style.height = BH + 'px';
  const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const ox = (BW - C * e) / 2, oy = (BH - Rw * e) / 2;
  const X = (v) => ox + v * e, Y = (v) => oy + v * e;
  x.fillStyle = '#DCE8D2'; x.fillRect(0, 0, BW, BH);
  if (tk.trace) {
    x.beginPath(); tk.trace.forEach((q, i) => i ? x.lineTo(X(q[0]), Y(q[1])) : x.moveTo(X(q[0]), Y(q[1]))); x.closePath();
    x.lineJoin = 'round'; x.lineCap = 'round';
    x.lineWidth = 2 * tk.demi * e + 2; x.strokeStyle = '#5A6473'; x.stroke();
    x.lineWidth = 2 * tk.demi * e; x.strokeStyle = '#D6D8D1'; x.stroke();
  } else {
    x.fillStyle = '#5A6473';
    for (const r of tk.outers) x.fillRect(X(r[0]) - 1, Y(r[1]) - 1, (r[2] - r[0]) * e + 2, (r[3] - r[1]) * e + 2);
    x.fillStyle = '#D6D8D1';
    for (const r of tk.outers) x.fillRect(X(r[0]), Y(r[1]), (r[2] - r[0]) * e, (r[3] - r[1]) * e);
    x.fillStyle = '#5A6473';
    for (const r of tk.islands) x.fillRect(X(r[0]) - 1, Y(r[1]) - 1, (r[2] - r[0]) * e + 2, (r[3] - r[1]) * e + 2);
    x.fillStyle = '#DCE8D2';
    for (const r of tk.islands) x.fillRect(X(r[0]), Y(r[1]), (r[2] - r[0]) * e, (r[3] - r[1]) * e);
  }
  const L = tk.depart;
  x.fillStyle = '#22282F'; x.fillRect(X(L.x0), Y(L.y) - 1, (L.x1 - L.x0) * e, 2);
  return c;
}

const CADENAS = '<svg class="cadenas" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

// Les circuits, dans l'ordre du championnat : numéro de manche, vignette, nom,
// et ce qu'on y a fait. Un circuit fermé se VOIT (cadenas) et dit comment
// l'ouvrir : une fonction qu'on ne voit pas n'existe pas.
function majCircuits() {
  const r = records(), boite = $('circuits');
  if (boite.children.length !== TRACKS.length) {
    boite.innerHTML = TRACKS.map((t, k) => `<button class="tuile circ" id="tk${k}" type="button"></button>`).join('');
    for (let k = 0; k < TRACKS.length; k++) $('tk' + k).addEventListener('click', () => {
      if (mode === 'gp') {
        if (!circuitPermis(k)) { toastAccueil(`${TRACKS[k].nom} est trop étroit pour doubler à plusieurs : 2 voitures seulement`); return; }
      } else if (!ouvert(k)) { toastAccueil(`Finis ${TRACKS[k - 1].nom} pour ouvrir ${TRACKS[k].nom}`); return; }
      ti = k; majAccueil(); saveReglages();
    });
  }
  // en Grand Prix, tout est ouvert : le championnat ne ferme que le championnat
  const gp = mode === 'gp';
  for (let k = 0; k < TRACKS.length; k++) {
    const tk = TRACKS[k], b = $('tk' + k), ouv = gp || ouvert(k), rec = r[tk.id], m = rec ? medaille(tk, rec.coups) : null;
    const etroit = gp && !circuitPermis(k);
    b.classList.toggle('ferme', !ouv);
    b.classList.toggle('etroit', etroit);
    b.setAttribute('aria-pressed', k === ti && ouv && !etroit);
    b.setAttribute('aria-disabled', !ouv || etroit);
    const detail = etroit ? 'à deux seulement : trop étroit' : !ouv ? `Finis ${TRACKS[k - 1].nom}` : rec ? `record ${rec.coups} · par ${tk.par}` : `par ${tk.par}`;
    b.setAttribute('aria-label', `Manche ${k + 1} : ${tk.nom}, ${detail}${m ? ', médaille ' + NOM_MEDAILLE[m] : ''}${ouv ? '' : ', fermé'}`);
    b.innerHTML = `<span class="num-manche" aria-hidden="true">${k + 1}</span><span class="txt"><b>${tk.nom}</b><i>${detail}</i></span>`
      + (m ? svgMedaille(m, 26) : '') + (ouv ? '' : CADENAS) + '<span class="coche" aria-hidden="true">✓</span>';
    b.insertBefore(vignette(k), b.children[1]);
  }
}

// un message sur l'accueil (le bandeau de la course n'y est pas visible)
let minuteurAccueil = null;
function toastAccueil(txt) {
  const t = $('toastAccueil');
  t.textContent = '';
  t.classList.add('on');
  requestAnimationFrame(() => { t.textContent = txt; });
  clearTimeout(minuteurAccueil);
  minuteurAccueil = setTimeout(() => t.classList.remove('on'), 2600);
}

function majAccueil() {
  if (mode === 'gp') { if (!circuitPermis(ti)) ti = grandsCircuits()[0]; }
  else if (!ouvert(ti)) ti = prochain();
  majCircuits();
  const seul = mode === 'solo' || mode === 'gp';
  $('duo').setAttribute('aria-pressed', mode === 'duo');
  $('solo').setAttribute('aria-pressed', seul);
  $('enligne').setAttribute('aria-pressed', mode === 'ligne');
  $('championnat').setAttribute('aria-pressed', mode === 'solo');
  $('grandprix').setAttribute('aria-pressed', mode === 'gp');
  $('formule').hidden = !seul;
  $('voitures').hidden = mode !== 'gp';
  for (let n = 2; n <= 6; n++) $('v' + n).setAttribute('aria-pressed', n === nbVoitures);
  $('labNiveau').textContent = mode === 'gp' ? 'Les fantômes roulent' : 'Le fantôme roule';
  $('jouer').textContent = mode === 'ligne' ? 'Créer la course en ligne' : 'Jouer';
  $('niveaux').hidden = !seul;
  for (const j of ['tranquille', 'normal', 'rapide']) $(j).setAttribute('aria-pressed', j === level);
  const o = lireCourse();
  $('reprendre').hidden = !o;
  if (o) {
    const qui = o.mode === 'solo' ? 'championnat' : o.mode === 'gp' ? `Grand Prix à ${o.cars.length}` : 'à deux';
    $('reprendreInfo').textContent = `${TRACKS[indexDe(o.id)].nom}, ${qui} · ${o.cars.reduce((t, c) => t + c.coups, 0)} coups joués`;
  }
}

// ================= installation, version, réparation =================
// On ne retient jamais « installé » : ça survivrait à une désinstallation et le
// bouton ne reviendrait plus. On redemande au navigateur à chaque ouverture.
let invitation = null, installeCetteFois = false;
function dansLApplication() {
  return navigator.standalone === true ||
    ['standalone', 'fullscreen', 'minimal-ui'].some(m => window.matchMedia('(display-mode: ' + m + ')').matches);
}
const UA = navigator.userAgent;
const estIOS = /iPad|iPhone|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// un navigateur intégré (Instagram, Facebook, Messenger, Snapchat, l'app Google…)
// ne sait PAS ajouter une page à l'écran d'accueil : il faut ouvrir Safari
const integre = /FBAN|FBAV|FB_IAB|Instagram|Snapchat|Line\/|GSA\/|MicroMessenger|TikTok/i.test(UA);
const PARTAGER = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-label="Partager" role="img"><path d="M12 3v12"/><path d="m8 7 4-4 4 4"/><path d="M6 11H5v10h14V11h-1"/></svg>';
const PLUS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
function etapesInstallation() {
  if (estIOS && integre) return [
    'Cette page est ouverte dans une autre application : elle ne peut pas ajouter de jeu.',
    'Touche les 3 points ou le bouton de partage, puis « Ouvrir dans Safari ».',
    'Dans Safari, reviens ici et touche à nouveau ce bouton.'];
  if (estIOS) return [
    `Touche ${PARTAGER} Partager, en bas de Safari (en haut à droite dans Chrome).`,
    `Fais défiler et choisis ${PLUS} « Sur l'écran d'accueil ».`,
    'Touche « Ajouter » : Paper Race apparaît avec les autres applications.'];
  return [
    'Touche les 3 points en haut à droite de Chrome.',
    "Choisis « Ajouter à l'écran d'accueil », puis « Installer »."];
}
function verifierInstalle() {
  const b = $('installer'), astuce = $('astuce');
  if (dansLApplication() || installeCetteFois) { b.hidden = true; astuce.hidden = true; return; }
  // dans le doute, on montre : un bouton en trop se ferme, un bouton absent n'existe pas
  b.hidden = false;
  $('installerTexte').textContent = estIOS ? "Ajouter à l'écran d'accueil" : 'Installer le jeu';
  if (!navigator.getInstalledRelatedApps) return;
  navigator.getInstalledRelatedApps().then((liste) => {
    if (dansLApplication() || installeCetteFois) return;
    if (liste && liste.length) { b.hidden = true; astuce.hidden = true; }
  }).catch(() => { });
}
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); invitation = e; installeCetteFois = false; });
window.addEventListener('appinstalled', () => { invitation = null; installeCetteFois = true; verifierInstalle(); });
$('installer').addEventListener('click', () => {
  if (invitation) {
    invitation.prompt();
    invitation.userChoice.finally(() => { invitation = null; });
    return;
  }
  // pas d'invitation (iPhone, ou déjà refusée sur Android) : le bouton DÉPLIE les
  // étapes, et le montre en se transformant ; un second appui les replie
  const a = $('astuce');
  if (a.hidden) {
    $('astuceEtapes').innerHTML = etapesInstallation().map(t => `<li>${t}</li>`).join('');
    a.hidden = false;
    $('installer').setAttribute('aria-expanded', 'true');
    a.scrollIntoView({ block: 'nearest', behavior: REDUIT ? 'auto' : 'smooth' });
  } else {
    a.hidden = true;
    $('installer').setAttribute('aria-expanded', 'false');
  }
});

function diagnostic() {
  $('menuVersion').textContent = VERSION.replace('paper-race-', '');
  const bouts = { service: '…', caches: '…' };
  const montrer = () => { $('menuDiag').textContent = 'service ' + bouts.service + (window.majEchouee ? ' · mise à jour échouée' : '') + ' · caches ' + bouts.caches; };
  montrer();
  const sw = navigator.serviceWorker && navigator.serviceWorker.controller;
  if (!sw) { bouts.service = 'aucun'; montrer(); }
  else {
    const canal = new MessageChannel(); let repondu = false;
    canal.port1.onmessage = (e) => {
      repondu = true;
      bouts.service = String(e.data).replace('paper-race-', '');
      // la page et le service ne sont pas d'accord : on propose de tout remettre à plat
      $('reparer').hidden = e.data === VERSION;
      montrer();
    };
    sw.postMessage('version', [canal.port2]);
    setTimeout(() => { if (repondu) return; bouts.service = 'muet'; $('reparer').hidden = false; montrer(); }, 1500);
  }
  if (window.caches) caches.keys().then((cles) => {
    bouts.caches = cles.filter(k => k.indexOf('paper-race:') === 0).map(k => k.split(':').pop().replace('paper-race-', '')).join(', ') || 'aucun';
    montrer();
  }).catch(() => { });
}

// Réparer : on oublie ce que le téléphone a gardé de CE jeu (caches, service),
// puis on recharge. La course en cours, elle, est dans localStorage et revient.
$('reparer').addEventListener('click', () => {
  if (R && $('game').style.display !== 'none') sauverCourse('jeu');
  const fini = () => location.reload();
  const effacer = window.caches ? caches.keys().then(cles => Promise.all(cles.filter(k => k.indexOf('paper-race:') === 0).map(k => caches.delete(k)))) : Promise.resolve();
  const desinscrire = navigator.serviceWorker && navigator.serviceWorker.getRegistrations
    ? navigator.serviceWorker.getRegistrations().then(regs => Promise.all(regs.filter(g => g.scope.indexOf('/paper-race/') >= 0).map(g => g.unregister())))
    : Promise.resolve();
  Promise.all([effacer, desinscrire]).then(fini, fini);
});

// ================= branchements =================
function recaler() { if (R && $('game').style.display !== 'none') { layout(); render(); } }
window.addEventListener('resize', recaler);
window.addEventListener('orientationchange', () => setTimeout(recaler, 120));
if (window.visualViewport) window.visualViewport.addEventListener('resize', recaler);
// écran éteint, onglet quitté : on range la course tout de suite
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && R && !finie(R) && $('game').style.display !== 'none') sauverCourse('jeu');
});

$('go').addEventListener('click', () => {
  if (!R || finie(R) || occupe()) return;
  if (opts.length && opts.filter(o => o.ok).length === 0) { forceArret(); return; }
  if (selected !== null && opts[selected] && opts[selected].ok) commit(selected);
});
$('annuler').addEventListener('click', annuler);
$('menubtn').addEventListener('click', () => ouvrir('reglages'));
$('reglagesBtn').addEventListener('click', () => ouvrir('reglages'));
$('reglesBtn').addEventListener('click', () => ouvrir('regles'));
$('recommencer').addEventListener('click', () => { fermer(); start(); });
$('accueil').addEventListener('click', () => { fermer(); versAccueil(); });
$('again').addEventListener('click', () => {
  $('drapeau').style.display = 'none';
  // en ligne : la revanche se demande au relais, qui remet la course à zéro pour les deux
  if (mode === 'ligne' && ligne && ligne.actif) { $('win').style.display = 'none'; envoyer({ t: 'revanche', manche: ligne.manche }); return; }
  start();
});
$('suivant').addEventListener('click', () => { if (suivant < 0) return; ti = suivant; $('drapeau').style.display = 'none'; saveReglages(); start(); });
$('backmenu').addEventListener('click', () => { if (mode === 'ligne' && ligne && ligne.actif) finLigne(); else versAccueil(); });
// le drapeau à damier reste plein écran après l'arrivée : sans l'enlever, le
// rejeu passait DERRIÈRE lui et le bouton ne montrait rien
$('revoir').addEventListener('click', () => { $('win').style.display = 'none'; $('drapeau').style.display = 'none'; lancerReplay(showWin); });
// sans animations, le rejeu dure une milliseconde : un bouton qui ne montre rien n'est pas proposé
$('revoir').hidden = REDUIT;
$('jouer').addEventListener('click', () => { if (mode === 'ligne') creerLigne(); else start(); });
$('reprendre').addEventListener('click', () => { const o = lireCourse(); if (!o || !reprendre(o)) majAccueil(); });

$('duo').addEventListener('click', () => { mode = 'duo'; majAccueil(); saveReglages(); });
$('enligne').addEventListener('click', () => { mode = 'ligne'; majAccueil(); });
$('solo').addEventListener('click', () => {
  if (mode !== 'gp') mode = 'solo';
  majAccueil(); saveReglages();
  // sur un petit écran, les niveaux naissent sous le pli : on les amène au-dessus du bouton
  $('niveaux').scrollIntoView({ block: 'nearest', behavior: REDUIT ? 'auto' : 'smooth' });
});
$('championnat').addEventListener('click', () => { mode = 'solo'; majAccueil(); saveReglages(); });
$('grandprix').addEventListener('click', () => {
  mode = 'gp'; majAccueil(); saveReglages();
  $('voitures').scrollIntoView({ block: 'nearest', behavior: REDUIT ? 'auto' : 'smooth' });
});
for (let n = 2; n <= 6; n++) {
  $('v' + n).addEventListener('click', () => {
    nbVoitures = n;
    if (!circuitPermis(ti)) { ti = grandsCircuits()[0]; toastAccueil(`À ${n}, on court sur les grands circuits : ${TRACKS[ti].nom}`); }
    majAccueil(); saveReglages();
  });
}
for (const id of ['tranquille', 'normal', 'rapide']) {
  $(id).addEventListener('click', () => { level = id; majAccueil(); saveReglages(); });
}
$('sonOui').addEventListener('click', () => { sonOn = true; sonClic(); majReglages(); saveReglages(); });
$('sonNon').addEventListener('click', () => { sonOn = false; majReglages(); saveReglages(); });

// ================= clavier =================
// Chiffres du pavé numérique : 7 8 9 en haut, 1 2 3 en bas, 5 = même vitesse.
// Flèches : déplacer le choix. Entrée : tracer. Ctrl+Z ou Retour arrière : annuler.
const PAVE_NUM = { '7': 0, '8': 1, '9': 2, '4': 3, '5': 4, '6': 5, '1': 6, '2': 7, '3': 8 };
const FLECHES = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (fermer()) e.preventDefault(); return; }
  if (!$('reglages').hidden || !$('regles').hidden) return;
  if ($('game').style.display === 'none' || $('win').style.display === 'flex' || !R) return;
  if (e.altKey || e.metaKey) return;
  if ((e.ctrlKey && (e.key === 'z' || e.key === 'Z')) || (e.key === 'Backspace' && !e.ctrlKey)) {
    e.preventDefault(); annuler(); return;
  }
  if (e.ctrlKey) return;
  const chiffre = e.code && e.code.indexOf('Numpad') === 0 ? e.code.slice(6) : e.key;
  if (PAVE_NUM[chiffre] !== undefined) { e.preventDefault(); choisir(PAVE_NUM[chiffre]); return; }
  if (FLECHES[e.key]) {
    e.preventDefault();
    const [dx, dy] = FLECHES[e.key];
    const k0 = selected === null ? 4 : selected;
    const cx = (k0 % 3) + dx, cy = ((k0 / 3) | 0) + dy;
    if (cx >= 0 && cx <= 2 && cy >= 0 && cy <= 2) choisir(cy * 3 + cx);
    return;
  }
  if (e.key === 'Enter') {
    const a = document.activeElement;
    // Entrée sur un autre bouton (menu, annuler) garde son sens
    if (a && a.tagName === 'BUTTON' && !a.classList.contains('padbtn') && a.id !== 'go') return;
    e.preventDefault();
    if (!$('go').disabled) $('go').click();
  }
});

// ================= démarrage =================
(function init() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(CLE_REGLAGES) || 'null'); } catch (e) { }
  if (s) {
    if (NIVEAUX[s.level]) level = s.level;
    // le circuit par son id : l'ancien numéro (avant la v4) désignait un autre ordre
    if (typeof s.circuit === 'string' && indexDe(s.circuit) >= 0) ti = indexDe(s.circuit);
    if (typeof s.sonOn === 'boolean') sonOn = s.sonOn;
    if (s.mode === 'solo' || s.mode === 'duo' || s.mode === 'gp') mode = s.mode;
    if (Number.isInteger(s.voitures) && s.voitures >= 2 && s.voitures <= 6) nbVoitures = s.voitures;
  }
  $('menuVersion').textContent = VERSION.replace('paper-race-', '');
  // une course laissée en plein jeu (rechargement, mise à jour, app tuée) reprend
  // directement ; une course laissée depuis l'accueil attend qu'on la reprenne
  const o = lireCourse();
  $('menu').style.display = 'flex';
  majAccueil();
  // (un lien d'invitation #salle=CODE est lu par ligne.js, chargé APRÈS ce fichier)
  if (o && o.ecran === 'jeu' && !/salle=/.test(location.hash)) reprendre(o);
})();

// ================= service worker =================
// Le nouveau service prend la main tout seul (skipWaiting + claim), mais la page
// déjà chargée garde l'ancien code : on la recharge une fois, et seulement s'il
// y avait déjà un service (sinon, première visite, rien n'est périmé).
// La course en cours survit : elle est rangée après chaque coup.
if ('serviceWorker' in navigator) {
  let rechargeFaite = false;
  const avaitUnControleur = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (rechargeFaite || !avaitUnControleur) return;
    rechargeFaite = true;
    if (R && !finie(R) && $('game').style.display !== 'none') sauverCourse('jeu');
    location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const neuf = reg.installing;
        if (neuf) neuf.addEventListener('statechange', () => { if (neuf.state === 'redundant') window.majEchouee = true; });
      });
      return reg.update();
    }).catch(() => { });
  });
}
