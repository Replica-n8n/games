// ===== Paper Race : interface (tracé animé, écrans, sauvegarde) =====
// Le moteur (moteur.js) et le son (sons.js) sont chargés avant ce fichier.
// ⚠️ VERSION existe aussi dans sw.js : les changer ensemble, un essai les compare.
const VERSION = 'paper-race-v3';
const BLEU = '#2B4C8C', ROUGE = '#B03A2E', ENCRE = '#1B2430';
const COUL = [BLEU, ROUGE];
const NOMS = ['Bleu', 'Rouge'];
const ADJ = ['bleue', 'rouge'];
const CLE_REGLAGES = 'paper-race.reglages.v1';
const CLE_COURSE = 'paper-race.course.v1';

let R = null;
let mode = 'duo';
let level = 'normal';
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

const REDUIT = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (id) => document.getElementById(id);
const cv = $('board');
const ctx = cv.getContext('2d');

// ================= géométrie =================
let terrain = null;

function layout() {
  const wrap = $('boardwrap');
  const w = Math.min(wrap.clientWidth || 360, 420);
  const h = wrap.clientHeight || 0;
  const parLargeur = Math.floor((w - 2 * PAD) / COLS);
  const parHauteur = h > 60 ? Math.floor((h - 2 * PAD) / ROWS) : parLargeur;
  cellPx = Math.max(9, Math.min(parLargeur, parHauteur));
  const W = cellPx * COLS + 2 * PAD, H = cellPx * ROWS + 2 * PAD;
  const dpr = window.devicePixelRatio || 1;
  cv.width = W * dpr; cv.height = H * dpr;
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  terrain = null;
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

function bbox(rects) {
  let a = 1e9, b = 1e9, cc = -1e9, d = -1e9;
  for (const r of rects) { a = Math.min(a, r[0]); b = Math.min(b, r[1]); cc = Math.max(cc, r[2]); d = Math.max(d, r[3]); }
  return [a, b, cc, d];
}

function buildTerrain() {
  const W = cellPx * COLS + 2 * PAD, H = cellPx * ROWS + 2 * PAD;
  const dpr = window.devicePixelRatio || 1;
  const { c: cnv, x: c } = neuf(W, H, dpr);
  const tk = R.track;
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
  const W = cellPx * COLS + 2 * PAD, H = cellPx * ROWS + 2 * PAD;
  if (!terrain) terrain = buildTerrain();
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (secousse > 0.2 && !REDUIT) {
    ctx.translate((Math.random() - 0.5) * secousse, (Math.random() - 0.5) * secousse);
    secousse *= 0.86;
  } else secousse = 0;
  ctx.drawImage(terrain, 0, 0, W, H);

  // ---- traces ----
  for (let p = 0; p < 2; p++) {
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
  const libre = R.winner === null && !anim && !replay && opts.length;
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
        const adv = COUL[1 - R.turn];
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
  for (let p = 0; p < 2; p++) {
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
    drawCar(pos, COUL[p], ang);
  }
  ctx.restore();
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

const caps = [-Math.PI / 2, -Math.PI / 2];
const capsAvant = [null, null];

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

function drawCar(p, col, ang) {
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
}

// ================= bande de rejeu =================
let rejeu = null;
let dernierMoment = -9;
const zoomRejeu = () => Math.max(2.2, Math.min(3.4, 52 / cellPx));

function momentFort(ev, pa, depart, arrivee, avantMoi, avantLui) {
  if (ev.type === 'arrivee') return null;
  if (ev.type === 'sortie') return 'Sortie de piste';
  if (ev.type === 'blocage') return 'Accrochage';
  const apresMoi = avanceDe(R.track, arrivee);
  if (avantMoi < avantLui && apresMoi > avantLui) return 'Dépassement';
  const restant = choices(R).filter(o => o.ok).length;
  if (restant <= 2) return 'Au ras du mur';
  const vit = Math.max(Math.abs(arrivee[0] - depart[0]), Math.abs(arrivee[1] - depart[1]));
  if (vit >= 5) return 'Pleine vitesse';
  return null;
}

function lancerRejeu(label, pa, from, to, fin) {
  const cv2 = $('rejeu');
  const Wb = cellPx * COLS + 2 * PAD;
  const H = Math.min(132, Math.round(Wb * 0.34));
  const dpr = window.devicePixelRatio || 1;
  cv2.width = Wb * dpr; cv2.height = H * dpr;
  cv2.style.width = Wb + 'px'; cv2.style.height = H + 'px';
  cv2.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  const teintes = { 'Sortie de piste': '#B03A2E', 'Accrochage': '#B03A2E', 'Au ras du mur': '#C2760F',
    'Dépassement': '#2B4C8C', 'Pleine vitesse': '#1F6B4E' };
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
  g.drawImage(terrain, 0, 0, cellPx * COLS + 2 * PAD, cellPx * ROWS + 2 * PAD);

  for (let p = 0; p < 2; p++) {
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

  const autre = 1 - pa;
  petiteVoiture(g, R.cars[autre].p, COUL[autre], caps[autre]);
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
  if (!besoin && R && R.winner === null && opts.length && opts.filter(o => o.ok).length <= 3 && !REDUIT) besoin = true;
  render();
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
  if (o.bloque) return "Occupé par l'autre voiture";
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

function occupe() {
  return depart || aiBusy || !!anim || !!replay || !!rejeu || (mode === 'solo' && R && R.turn === 1);
}

function renderPad() {
  const pad = $('pad');
  const avaitFocus = document.activeElement && document.activeElement.classList.contains('padbtn')
    ? +document.activeElement.dataset.k : -1;
  const bloque = occupe() || R.winner !== null;
  const car = R.cars[R.turn];
  pad.innerHTML = opts.map((o, k) => {
    const dis = !o.ok || bloque;
    const on = selected === k;
    const ex = 12 + (k % 3 - 1) * 7, ey = 12 + ((k / 3 | 0) - 1) * 7;
    let inner;
    if (o.bloque) inner = '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M7 12h10" stroke-linecap="round"></path></svg>';
    else if (!o.ok) inner = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6 L18 18M18 6 L6 18"></path></svg>';
    else if (k === 4) inner = '<span class="egal" aria-hidden="true">=</span>';
    else inner = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 12 L${ex} ${ey}"></path><circle cx="${ex}" cy="${ey}" r="2.6" fill="currentColor" stroke="none"></circle></svg>`;
    const etat = o.ok ? '' : (o.bloque ? ' pris' : ' ko');
    return `<button type="button" class="padbtn b${R.turn}${on ? ' on' : ''}${etat}" data-k="${k}" ${dis ? 'disabled' : ''} aria-pressed="${on}" aria-label="${padLabel(k, o, car)}">${inner}</button>`;
  }).join('');
  for (const b of pad.querySelectorAll('.padbtn')) {
    b.addEventListener('click', () => choisir(+b.dataset.k));
  }
  // innerHTML recrée les boutons : sans ça, le clavier perdait sa place à chaque choix
  if (avaitFocus >= 0) { const b = pad.querySelector(`[data-k="${avaitFocus}"]`); if (b && !b.disabled) b.focus(); }
}

function choisir(k) {
  if (!R || R.winner !== null || occupe()) return;
  if (!opts[k] || !opts[k].ok) return;
  selected = k; sonClic(); refresh();
}

// ================= bandeaux =================
const pct = (car) => Math.round(Math.max(0, Math.min(1, (car.tour + avanceDe(R.track, car.p) / R.D) / R.laps)) * 100);
const nomDe = (p) => (mode === 'solo' && p === 1) ? 'Fantôme' : (mode === 'solo' ? 'Toi' : NOMS[p]);

function renderBars() {
  for (let p = 0; p < 2; p++) {
    const car = R.cars[p];
    const actif = R.turn === p && R.winner === null;
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
  $('stop').classList.toggle('alerte', !!dehors && R.winner === null);
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
  $('issues').classList.toggle('alerte', peu && R.winner === null);
  const bloque = occupe();
  const coince = R.winner === null && opts.length > 0 && dispo === 0;
  const go = $('go');
  go.textContent = R.winner !== null ? 'Terminé'
    : (mode === 'solo' && R.turn === 1) ? 'Le fantôme réfléchit…'
      : coince ? "Coincé : je m'arrête" : 'Tracer';
  go.disabled = coince ? bloque : (selected === null || !opts[selected] || !opts[selected].ok || bloque);
  go.className = R.winner === null ? 'b' + R.turn : 'fin';
  $('annuler').disabled = !peutAnnuler();
}

function refresh() { renderPad(); renderBars(); renderInfo(); render(); boucle(); }

function newOpts() {
  opts = choices(R);
  selected = null;
  const ok = opts.map((o, k) => o.ok ? k : -1).filter(k => k >= 0);
  if (ok.length === 1) selected = ok[0];
  if (ok.length <= 3 && R.winner === null) sonTension();
}

// ================= mémoire : annuler, reprendre =================
// L'état de la course tient en JSON ; seul le circuit (et son cache de champ) se
// rebranche depuis TRACKS.
function instantane() {
  return JSON.parse(JSON.stringify({
    v: 1, ti: R.ti, laps: R.laps, cars: R.cars, turn: R.turn, winner: R.winner, dernier: R.dernier,
    mode, level, caps, capsAvant, dernierMoment
  }));
}

function restaurer(o) {
  if (!o || o.v !== 1 || !TRACKS[o.ti] || !Array.isArray(o.cars) || o.cars.length !== 2) return false;
  for (const c of o.cars) if (!c || !Array.isArray(c.p) || !Array.isArray(c.v) || !Array.isArray(c.trail)) return false;
  mode = o.mode === 'solo' ? 'solo' : 'duo';
  if (NIVEAUX[o.level]) level = o.level;
  ti = o.ti;
  R = newRace(o.ti, o.laps || 1);
  R.cars = JSON.parse(JSON.stringify(o.cars));
  R.turn = o.turn === 1 ? 1 : 0;
  R.winner = (o.winner === 0 || o.winner === 1) ? o.winner : null;
  R.dernier = o.dernier || null;
  if (Array.isArray(o.caps)) { caps[0] = o.caps[0]; caps[1] = o.caps[1]; }
  if (Array.isArray(o.capsAvant)) { capsAvant[0] = o.capsAvant[0]; capsAvant[1] = o.capsAvant[1]; }
  dernierMoment = typeof o.dernierMoment === 'number' ? o.dernierMoment : -9;
  return true;
}

function sauverCourse(ecran) {
  if (!R) return;
  try {
    if (R.winner !== null) { localStorage.removeItem(CLE_COURSE); return; }
    const o = instantane(); o.ecran = ecran || 'jeu';
    localStorage.setItem(CLE_COURSE, JSON.stringify(o));
  } catch (e) { }
}

function lireCourse() {
  try {
    const o = JSON.parse(localStorage.getItem(CLE_COURSE) || 'null');
    if (o && o.v === 1 && TRACKS[o.ti] && o.winner === null && Array.isArray(o.cars) && o.cars.length === 2) return o;
  } catch (e) { }
  return null;
}

function peutAnnuler() {
  return !!precedent && !!R && R.winner === null && !occupe();
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
  if (!(mode === 'solo' && pa === 1)) precedent = instantane();
  const ev = play(R, opts[k].p);
  const arrivee = car.p.slice();
  const len = Math.hypot(arrivee[0] - depart[0], arrivee[1] - depart[1]);
  const j = jeton;
  flash = null;
  opts = []; selected = null;
  renderPad(); renderInfo();

  const vit = Math.max(Math.abs(depart[0] - arrivee[0]), Math.abs(depart[1] - arrivee[1]));
  const dur = REDUIT ? 1 : Math.min(320, 180 + len * 16);
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

  const avantMoi = avanceDe(R.track, depart), avantLui = avanceDe(R.track, R.cars[1 - pa].p);

  const suite = () => {
    if (j !== jeton) return;
    if (ev.type === 'sortie') {
      flash = ev;
      toast(`Sortie de piste : la voiture ${ADJ[ev.joueur]} repart à l'arrêt`);
    }
    if (ev.type === 'blocage') toast(`Accrochage : la voiture ${ADJ[ev.joueur]} s'arrête derrière l'autre`);
    if (R.winner !== null) {
      precedent = null; sauverCourse(); renderInfo();
      setTimeout(() => { if (j === jeton) lancerReplay(() => drapeau(showWin)); }, 280);
      return;
    }
    nextTurn(R); newOpts(); refresh();
    sauverCourse('jeu');
    if (mode === 'solo' && R.turn === 1) setTimeout(() => { if (j === jeton) aiTurn(); }, 480);
  };

  const apres = () => {
    if (j !== jeton) return;
    const m = REDUIT ? null : momentFort(ev, pa, depart, arrivee, avantMoi, avantLui);
    if (m && dernierMoment < R.cars[0].coups + R.cars[1].coups - 1) {
      dernierMoment = R.cars[0].coups + R.cars[1].coups;
      lancerRejeu(m, pa, depart, arrivee, suite);
    } else suite();
  };
  if (len === 0 || REDUIT) { setTimeout(apres, 40); render(); return; }
  anim = { pa, to: arrivee, t: 0, t0: performance.now(), dur: dur, fin: apres };
  boucle();
}

function forceArret() {
  const j = jeton;
  if (!(mode === 'solo' && R.turn === 1)) precedent = instantane();
  const ev = stuck(R);
  sonSortie();
  toast(`La voiture ${ADJ[ev.joueur]} n'a plus aucune trajectoire : elle s'arrête net`);
  opts = []; selected = null;
  if (R.winner !== null) { setTimeout(() => { if (j === jeton) lancerReplay(() => drapeau(showWin)); }, 300); return; }
  nextTurn(R); newOpts(); refresh();
  sauverCourse('jeu');
  if (mode === 'solo' && R.turn === 1) setTimeout(() => { if (j === jeton) aiTurn(); }, 480);
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
  if (!R || R.winner !== null) return;
  const j = jeton;
  aiBusy = true; renderInfo();
  setTimeout(() => {
    if (j !== jeton) return;
    const q = aiChoice(R, level, Math.random);
    if (q === null) { aiBusy = false; forceArret(); return; }
    const k = opts.findIndex(o => o.p[0] === q[0] && o.p[1] === q[1]);
    selected = k >= 0 ? k : 4;
    render();
    setTimeout(() => { if (j !== jeton) return; aiBusy = false; commit(selected); }, 500);
  }, 340);
}

cv.addEventListener('click', (ev) => {
  if (!R || R.winner !== null || occupe()) return;
  const b = cv.getBoundingClientRect();
  const x = ev.clientX - b.left, y = ev.clientY - b.top;
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

function showWin() {
  const p = R.winner, gagnant = R.cars[p], autre = R.cars[1 - p];
  const par = TRACKS[ti].par, ec = gagnant.coups - par;
  const solo = mode === 'solo';
  $('wincard').className = 'wincard b' + p;
  $('wintitle').textContent = solo
    ? (p === 0 ? `Tu boucles le tour en ${gagnant.coups} coups !` : `Le fantôme boucle le tour en ${gagnant.coups} coups.`)
    : `${NOMS[p]} boucle le tour en ${gagnant.coups} coups !`;
  let sub;
  if (solo && p === 1) {
    sub = `Tu en étais à ${pct(autre)} % du tour. Le par est à ${par} : à toi de le battre.`;
  } else {
    sub = ec <= 0 ? 'Pile le par : le tour parfait !'
      : `Le par est à ${par} : ${ec} coup${ec > 1 ? 's' : ''} à gagner la prochaine fois.`;
    sub += gagnant.crashes ? ` ${gagnant.crashes} sortie${gagnant.crashes > 1 ? 's' : ''} de piste.` : ' Sans une seule sortie de piste.';
  }
  $('winsub').textContent = sub;
  $('win').style.display = 'flex';
  $('again').focus();
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

function start() {
  remiseAZero();
  R = newRace(ti, 1);
  precedent = null;
  dernierMoment = -9;
  caps[0] = -Math.PI / 2; caps[1] = -Math.PI / 2;
  capsAvant[0] = null; capsAvant[1] = null;
  newOpts();
  montrerJeu();
  layout(); refresh();
  requestAnimationFrame(() => { layout(); render(); });
  audio(); saveReglages(); sauverCourse('jeu');
  const j = jeton;
  feuxDepart(() => { refresh(); if (mode === 'solo' && R.turn === 1) setTimeout(() => { if (j === jeton) aiTurn(); }, 400); });
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
  if (mode === 'solo' && R.turn === 1) { const j = jeton; setTimeout(() => { if (j === jeton) aiTurn(); }, 500); }
  return true;
}

function versAccueil() {
  if (R && R.winner === null) sauverCourse('accueil');
  remiseAZero();
  $('drapeau').style.display = 'none'; $('win').style.display = 'none';
  $('game').style.display = 'none'; $('menu').style.display = 'flex';
  majAccueil();
  $('jouer').focus();
}

function saveReglages() {
  try { localStorage.setItem(CLE_REGLAGES, JSON.stringify({ mode, level, ti, sonOn })); } catch (e) { }
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
  const enCourse = $('game').style.display !== 'none';
  $('recommencer').hidden = !enCourse;
  $('accueil').hidden = !enCourse;
  verifierInstalle();
  diagnostic();
}

// ================= accueil =================
function vignette(k) {
  const tk = TRACKS[k], s = 2, W = COLS * s + 2, H = ROWS * s + 2;
  const c = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px';
  const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const X = (v) => 1 + v * s;
  x.fillStyle = '#DCE8D2'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#5A6473';
  for (const r of tk.outers) x.fillRect(X(r[0]) - 1, X(r[1]) - 1, (r[2] - r[0]) * s + 2, (r[3] - r[1]) * s + 2);
  x.fillStyle = '#D6D8D1';
  for (const r of tk.outers) x.fillRect(X(r[0]), X(r[1]), (r[2] - r[0]) * s, (r[3] - r[1]) * s);
  x.fillStyle = '#5A6473';
  for (const r of tk.islands) x.fillRect(X(r[0]) - 1, X(r[1]) - 1, (r[2] - r[0]) * s + 2, (r[3] - r[1]) * s + 2);
  x.fillStyle = '#DCE8D2';
  for (const r of tk.islands) x.fillRect(X(r[0]), X(r[1]), (r[2] - r[0]) * s, (r[3] - r[1]) * s);
  const L = tk.depart;
  for (let i = L.x0; i < L.x1; i++) { x.fillStyle = (i % 2) ? '#22282F' : '#F4F1EC'; x.fillRect(X(i), X(L.y) - 1, s, 3); }
  return c;
}

function majCircuits() {
  for (let k = 0; k < TRACKS.length; k++) {
    const b = $('tk' + k);
    b.setAttribute('aria-pressed', k === ti);
    b.setAttribute('aria-label', `${TRACKS[k].nom}, par ${TRACKS[k].par}`);
    b.innerHTML = `<span><b>${TRACKS[k].nom}</b><i>par ${TRACKS[k].par}</i></span><span class="coche" aria-hidden="true">✓</span>`;
    b.prepend(vignette(k));
  }
}

function majAccueil() {
  majCircuits();
  $('duo').setAttribute('aria-pressed', mode === 'duo');
  $('solo').setAttribute('aria-pressed', mode === 'solo');
  $('niveaux').hidden = mode !== 'solo';
  for (const j of ['tranquille', 'normal', 'rapide']) $(j).setAttribute('aria-pressed', j === level);
  const o = lireCourse();
  $('reprendre').hidden = !o;
  if (o) {
    const qui = o.mode === 'solo' ? 'contre le fantôme' : 'à deux';
    $('reprendreInfo').textContent = `${TRACKS[o.ti].nom}, ${qui} · ${o.cars[0].coups + o.cars[1].coups} coups joués`;
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
const estIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function verifierInstalle() {
  const b = $('installer'), astuce = $('astuce');
  if (dansLApplication() || installeCetteFois) { b.hidden = true; astuce.hidden = true; return; }
  // dans le doute, on montre : un bouton en trop se ferme, un bouton absent n'existe pas
  b.hidden = false;
  astuce.hidden = !estIOS;
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
  } else {
    // pas d'invitation du navigateur (iPhone, ou déjà refusée) : on dit où appuyer
    $('astuce').textContent = estIOS ? "Sur iPhone : Partager, puis « Sur l'écran d'accueil »."
      : "Dans Chrome : les 3 points en haut à droite, puis « Ajouter à l'écran d'accueil ».";
    $('astuce').hidden = false;
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
  if (document.visibilityState === 'hidden' && R && R.winner === null && $('game').style.display !== 'none') sauverCourse('jeu');
});

$('go').addEventListener('click', () => {
  if (!R || R.winner !== null || occupe()) return;
  if (opts.length && opts.filter(o => o.ok).length === 0) { forceArret(); return; }
  if (selected !== null && opts[selected] && opts[selected].ok) commit(selected);
});
$('annuler').addEventListener('click', annuler);
$('menubtn').addEventListener('click', () => ouvrir('reglages'));
$('reglagesBtn').addEventListener('click', () => ouvrir('reglages'));
$('reglesBtn').addEventListener('click', () => ouvrir('regles'));
$('recommencer').addEventListener('click', () => { fermer(); start(); });
$('accueil').addEventListener('click', () => { fermer(); versAccueil(); });
$('again').addEventListener('click', () => { $('drapeau').style.display = 'none'; start(); });
$('backmenu').addEventListener('click', versAccueil);
// le drapeau à damier reste plein écran après l'arrivée : sans l'enlever, le
// rejeu passait DERRIÈRE lui et le bouton ne montrait rien
$('revoir').addEventListener('click', () => { $('win').style.display = 'none'; $('drapeau').style.display = 'none'; lancerReplay(showWin); });
// sans animations, le rejeu dure une milliseconde : un bouton qui ne montre rien n'est pas proposé
$('revoir').hidden = REDUIT;
$('jouer').addEventListener('click', start);
$('reprendre').addEventListener('click', () => { const o = lireCourse(); if (!o || !reprendre(o)) majAccueil(); });

$('duo').addEventListener('click', () => { mode = 'duo'; majAccueil(); saveReglages(); });
$('solo').addEventListener('click', () => {
  mode = 'solo'; majAccueil(); saveReglages();
  // sur un petit écran, les niveaux naissent sous le pli : on les amène au-dessus du bouton
  $('niveaux').scrollIntoView({ block: 'nearest', behavior: REDUIT ? 'auto' : 'smooth' });
});
for (const id of ['tranquille', 'normal', 'rapide']) {
  $(id).addEventListener('click', () => { level = id; majAccueil(); saveReglages(); });
}
for (let k = 0; k < TRACKS.length; k++) {
  $('tk' + k).addEventListener('click', () => { ti = k; majAccueil(); saveReglages(); });
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
    if (typeof s.ti === 'number' && TRACKS[s.ti]) ti = s.ti;
    if (typeof s.sonOn === 'boolean') sonOn = s.sonOn;
    if (s.mode === 'solo' || s.mode === 'duo') mode = s.mode;
  }
  $('menuVersion').textContent = VERSION.replace('paper-race-', '');
  // une course laissée en plein jeu (rechargement, mise à jour, app tuée) reprend
  // directement ; une course laissée depuis l'accueil attend qu'on la reprenne
  const o = lireCourse();
  if (o && o.ecran === 'jeu' && reprendre(o)) return;
  $('menu').style.display = 'flex';
  majAccueil();
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
    if (R && R.winner === null && $('game').style.display !== 'none') sauverCourse('jeu');
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
