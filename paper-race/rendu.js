// ===== Paper Race : le DESSIN (décor, voitures, rejeu, revoir la course) =====
// Chargé après moteur.js et sons.js, AVANT ui.js : il donne $, le canevas et la
// boucle d'affichage, que ui.js (écrans, sauvegarde, championnat) appelle.
// ⚠️ Les deux fichiers partagent leurs noms globaux (scripts classiques, pas de
// modules) : R, opts, mode, ligne… vivent dans ui.js et ligne.js, et ne sont lus
// ici qu'au moment de dessiner, jamais au chargement.

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
  if (revue) return posRevue(suivieRevue(), revue.t);
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
  if (camLibre) { camX = borneCam(camX, mapW() - vueW); camY = borneCam(camY, mapH() - vueH); return; }
  const f = viseeCamera();
  const tx = Math.max(0, Math.min(mapW() - vueW, gx(f[0]) - vueW / 2));
  const ty = Math.max(0, Math.min(mapH() - vueH, gy(f[1]) - vueH * 0.55));
  if (!camPose || REDUIT) { camX = tx; camY = ty; camPose = true; return; }
  camX += (tx - camX) * 0.18; camY += (ty - camY) * 0.18;
  camBouge = Math.abs(tx - camX) > 0.5 || Math.abs(ty - camY) > 0.5;
}

const borneCam = (v, max) => Math.max(0, Math.min(Math.max(0, max), v));
function recentrer() { camLibre = false; boucle(); }

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
// ⚠️ Un piège doit se reconnaître SANS notice : un joueur n'avait pas compris
// que les portions bleues étaient mouillées. On dessine donc des objets connus,
// une flaque d'eau et une tache d'huile, jamais des aplats. Le contour vient de
// formes.js et ENGLOBE toujours la zone (tools/paper-race-pieges.js le vérifie).
const COUL_PIEGE = { humide: '#2E6B99', huile: '#12141A', boost: '#B07814' };
const NOM_PIEGE = { humide: 'la flaque', huile: "la tache d'huile", boost: "l'accélérateur" };

// proj : case -> pixel ; cell : taille d'une case en pixels ; cap : le sens de
// la marche (pour les chevrons). Sert au décor ET aux vignettes des règles.
function dessinPiege(c, type, rect, carte, proj, cell, cap) {
  const poly = contourPiege(rect, carte).map(proj);
  const chemin = () => {
    c.beginPath();
    poly.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
    c.closePath();
  };
  const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
  const gx0 = Math.min(...xs), gx1 = Math.max(...xs), gy0 = Math.min(...ys), gy1 = Math.max(...ys);
  const cx = (gx0 + gx1) / 2, cy = (gy0 + gy1) / 2, Wd = gx1 - gx0, Hd = gy1 - gy0;
  if (type === 'humide') {
    // une flaque : dégradé, liseré mouillé à l'intérieur, reflets du ciel
    chemin();
    const g = c.createLinearGradient(0, gy0, 0, gy1);
    g.addColorStop(0, 'rgba(96,152,196,0.55)'); g.addColorStop(0.45, 'rgba(38,96,142,0.72)'); g.addColorStop(1, 'rgba(96,152,196,0.55)');
    c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(24,74,112,0.85)'; c.lineWidth = Math.max(1.4, cell * 0.11); c.stroke();
    c.save(); chemin(); c.clip();
    c.strokeStyle = 'rgba(190,225,245,0.7)'; c.lineWidth = Math.max(1.6, cell * 0.14);
    const p2 = contourPiege(rect, carte, 0.25).map(proj);
    c.beginPath(); p2.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.stroke();
    // les reflets restent DANS la flaque (sinon des traits blancs flottent sur
    // le bitume et on ne voit plus où finit l'eau)
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = Math.max(1.4, cell * 0.12); c.lineCap = 'round';
    for (const [fx, fy, fl] of [[-0.28, -0.22, 0.3], [0.05, 0.02, 0.36], [-0.2, 0.26, 0.22], [0.18, 0.36, 0.2]]) {
      const x = cx + Wd * fx, y = cy + Hd * fy;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Wd * fl, y); c.stroke();
    }
    c.restore();
  } else if (type === 'huile') {
    // une tache : noire, irisée, avec des éclaboussures autour
    chemin();
    c.fillStyle = 'rgba(18,20,26,0.88)'; c.fill();
    c.strokeStyle = 'rgba(8,9,12,0.9)'; c.lineWidth = Math.max(1.4, cell * 0.1); c.stroke();
    c.save(); chemin(); c.clip();
    for (const [fx, fy, fr, coul] of [[-0.18, -0.16, 0.34, 'rgba(126,92,196,0.42)'], [0.14, 0.06, 0.4, 'rgba(56,168,150,0.38)'],
      [-0.1, 0.28, 0.28, 'rgba(206,146,60,0.38)'], [0.22, -0.3, 0.22, 'rgba(180,80,150,0.32)']]) {
      c.beginPath(); c.ellipse(cx + Wd * fx, cy + Hd * fy, Wd * fr, Hd * fr * 0.45, 0.3, 0, 6.2832);
      c.fillStyle = coul; c.fill();
    }
    c.restore();
    c.fillStyle = 'rgba(18,20,26,0.85)';
    for (const [fx, fy, fr] of [[-0.62, -0.42, 0.055], [0.6, -0.5, 0.045], [-0.6, 0.52, 0.05], [0.64, 0.44, 0.06], [-0.7, 0.05, 0.04]]) {
      c.beginPath(); c.ellipse(cx + Wd * fx, cy + Hd * fy, Wd * fr, Hd * fr * 0.8, 0.4, 0, 6.2832); c.fill();
    }
  } else {
    // l'accélérateur : inchangé, des chevrons dans le sens de la marche
    chemin();
    c.fillStyle = 'rgba(242,193,78,0.5)'; c.fill();
    c.strokeStyle = 'rgba(176,120,20,0.7)'; c.lineWidth = Math.max(1.2, cell * 0.08); c.stroke();
    const a = cap === undefined ? -Math.PI / 2 : cap, t = cell * 0.7;
    c.save(); c.strokeStyle = 'rgba(176,120,20,0.8)'; c.lineWidth = Math.max(1.8, cell * 0.16); c.lineCap = 'round'; c.lineJoin = 'round';
    for (let k = -1; k <= 1; k++) {
      c.save(); c.translate(cx + Math.cos(a) * k * t * 1.3, cy + Math.sin(a) * k * t * 1.3); c.rotate(a);
      c.beginPath(); c.moveTo(-t * 0.5, -t); c.lineTo(t * 0.5, 0); c.lineTo(-t * 0.5, t); c.stroke();
      c.restore();
    }
    c.restore();
  }
}

function pieges(c, tk) {
  const carte = [colsDe(tk), rowsDe(tk)];
  const proj = (p) => [gx(p[0]), gy(p[1])];
  for (const [type, rects] of Object.entries(tk.zones || {})) {
    for (const r of rects) {
      let cap;
      if (type === 'boost') {
        const [dx, dy] = sensEn(tk, Math.round((r[0] + r[2]) / 2), Math.round((r[1] + r[3]) / 2));
        cap = Math.atan2(dy, dx);
      }
      dessinPiege(c, type, r, carte, proj, cellPx, cap);
    }
  }
}

// une vignette de piège pour les règles : un bout de piste, et le piège dessus
function vignettePiege(cv, type) {
  const cell = 15, cols = 7, rows = 5;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = cols * cell * dpr; cv.height = rows * cell * dpr;
  cv.style.width = cols * cell + 'px'; cv.style.height = rows * cell + 'px';
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = '#DCE8D2'; c.fillRect(0, 0, cols * cell, rows * cell);
  c.fillStyle = '#E6D5A9'; c.fillRect(0, 0, cols * cell, rows * cell);
  c.fillStyle = '#D6D8D1'; c.fillRect(0, cell * 0.6, cols * cell, rows * cell - cell * 1.2);
  c.strokeStyle = '#5A6473'; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(0, cell * 0.6); c.lineTo(cols * cell, cell * 0.6);
  c.moveTo(0, rows * cell - cell * 0.6); c.lineTo(cols * cell, rows * cell - cell * 0.6); c.stroke();
  const proj = (p) => [p[0] * cell, p[1] * cell];
  c.save();
  c.beginPath(); c.rect(0, cell * 0.6, cols * cell, rows * cell - cell * 1.2); c.clip();
  dessinPiege(c, type, [2, 1, 4, 3], [cols, rows], proj, cell, 0);
  c.restore();
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
    if (revue) { traceRevue(p, revue.t); continue; }
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
  const libre = !finie(R) && !anim && !replay && !revue && opts.length;
  if (libre) {
    const car = R.cars[R.turn], col = COUL[R.turn];
    const pr = projected(car);
    ctx.setLineDash([4, 5]); ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.moveTo(gx(car.p[0]), gy(car.p[1])); ctx.lineTo(gx(pr[0]), gy(pr[1])); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;

    distanceArret(car, col);
    if (aideOn && selected !== null && opts[selected] && opts[selected].ok) ombreSuivante(opts[selected].p, car.p);

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
    if (revue) pos = posRevue(p, revue.t);
    else if (replay) pos = tipOf(R.cars[p].trail, replay.t);
    else if (anim && anim.pa === p) {
      const a = R.cars[p].trail[R.cars[p].trail.length - 2], b = anim.to, k = easeOut(anim.t);
      pos = [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
    }
    let ang = caps[p];
    if (revue) { const a = capRevue(p, revue.t); if (a !== null) ang = a; }
    else if (replay) { const a = dirAt(R.cars[p].trail, replay.t); if (a !== null) ang = a; }
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
    const parti = R.cars[p].fini && !finie(R) && !replay && !revue;
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
    const q = revue ? posRevue(p, revue.t) : replay ? tipOf(R.cars[p].trail, replay.t) : R.cars[p].p;
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

// ================= revoir la course =================
// Pour voir où l'on peut gagner des coups : toutes les voitures avancent
// ENSEMBLE, coup par coup (`pas`, une position par coup), à la vitesse choisie ;
// pause, coup précédent / suivant, et un curseur pour aller où l'on veut.
let revue = null;              // { t (en coups), max, pause, vitesse, dernier }
const VITESSES = [0.5, 1, 2], MS_PAR_COUP = 480;
const pasDe = (p) => R.cars[p].pas || R.cars[p].trail;
function posRevue(p, t) {
  const l = pasDe(p), i = Math.floor(t);
  if (i >= l.length - 1) return l[l.length - 1];
  const f = t - i;
  return [lerp(l[i][0], l[i + 1][0], f), lerp(l[i][1], l[i + 1][1], f)];
}
function capRevue(p, t) {
  const l = pasDe(p);
  for (let i = Math.min(l.length - 1, Math.ceil(t)); i > 0; i--) {
    const dx = l[i][0] - l[i - 1][0], dy = l[i][1] - l[i - 1][1];
    if (dx || dy) return Math.atan2(dy, dx);
  }
  return null;
}
function traceRevue(p, t) {
  const l = pasDe(p), i = Math.min(Math.floor(t), l.length - 1);
  const pts = l.slice(0, i + 1);
  if (i < l.length - 1) pts.push(posRevue(p, t));
  drawTrail(pts, COUL[p]);
}
// la voiture qu'on suit : la tienne, sinon celle qui a gagné
function suivieRevue() {
  if (mode === 'solo' || mode === 'gp') return 0;
  if (mode === 'ligne' && ligne) return ligne.siege;
  return R.winner === null ? 0 : R.winner;
}
function ouvrirRevue() {
  $('win').style.display = 'none'; $('drapeau').style.display = 'none';
  const max = Math.max(...R.cars.map((c, p) => pasDe(p).length - 1));
  revue = { t: 0, max, pause: REDUIT, vitesse: revue ? revue.vitesse : 1, dernier: null };
  $('bas').hidden = true; $('revuebar').hidden = false;
  $('revCurseur').max = String(max);
  majRevue(); boucle();
  $('revLecture').focus();
}
function fermerRevue() {
  if (!revue) return;
  revue = null;
  $('revuebar').hidden = true; $('bas').hidden = false;
  render(); showWin();
}
function majRevue() {
  if (!revue) return;
  const p = suivieRevue(), i = Math.min(Math.round(revue.t), revue.max), l = pasDe(p);
  const k = Math.min(i, l.length - 1), a = l[Math.max(0, k - 1)], b = l[k];
  const vit = k ? Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) : 0;
  $('revInfo').textContent = `Coup ${i} sur ${revue.max} · ${nomDe(p) === 'Toi' ? 'ta vitesse' : 'vitesse de ' + NOMS[p]} ${vit}`;
  $('revCurseur').value = String(revue.t);
  $('revCurseur').setAttribute('aria-valuetext', `coup ${i} sur ${revue.max}`);
  const icone = revue.pause ? '<path d="M8 5v14l11-7z" fill="currentColor"/>' : '<path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/>';
  $('revLecture').innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">${icone}</svg>`;
  $('revLecture').setAttribute('aria-label', revue.pause ? 'Lecture' : 'Pause');
  const v = revue.vitesse;
  $('revVitesse').textContent = (v === 0.5 ? '½' : v) + '×';
  $('revVitesse').setAttribute('aria-label', `Vitesse : ${v === 0.5 ? 'moitié' : v === 1 ? 'normale' : 'double'}`);
}
function allerRevue(t) {
  revue.t = Math.max(0, Math.min(revue.max, t));
  revue.pause = true; revue.dernier = null;
  majRevue(); render();
}
function brancherRevue() {
  $('revLecture').addEventListener('click', () => {
    if (!revue) return;
    if (revue.pause && revue.t >= revue.max) revue.t = 0;     // relire depuis le début
    revue.pause = !revue.pause; revue.dernier = null;
    majRevue(); boucle();
  });
  $('revPrec').addEventListener('click', () => { if (revue) allerRevue(Math.ceil(revue.t) - 1); });
  $('revSuiv').addEventListener('click', () => { if (revue) allerRevue(Math.floor(revue.t) + 1); });
  $('revVitesse').addEventListener('click', () => {
    if (!revue) return;
    revue.vitesse = VITESSES[(VITESSES.indexOf(revue.vitesse) + 1) % VITESSES.length];
    majRevue();
  });
  $('revCurseur').addEventListener('input', () => { if (revue) allerRevue(+$('revCurseur').value); });
  $('revFermer').addEventListener('click', fermerRevue);
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
  if (revue && !revue.pause) {
    if (revue.dernier !== null) revue.t = Math.min(revue.max, revue.t + (now - revue.dernier) * revue.vitesse / MS_PAR_COUP);
    revue.dernier = now;
    if (revue.t >= revue.max) { revue.pause = true; revue.dernier = null; }
    majRevue();
    besoin = true;
  }
  if (!besoin && R && !finie(R) && opts.length && opts.filter(o => o.ok).length <= 3 && !REDUIT) besoin = true;
  render();
  if (camBouge) besoin = true;
  if ($('game').style.display !== 'none' && besoin) raf = requestAnimationFrame(tick);
}
function boucle() { if (!raf) raf = requestAnimationFrame(tick); }

