// Maquette du décor de la Jungle, greffée dans le vrai jeu par tools/patrouille-decor.mjs
// (remplace fond() et feuillage() de patrouille/ecran/rendu.js le temps de la maquette).
// Même esprit qu'aujourd'hui, formes simples et aplats, mais on SURVOLE quelque chose :
// une rivière qui serpente, des rochers, un tronc couché, un étang, les ruines du temple.
// Les ronds verts deviennent des arbres vus de haut (feuillu, palmier, arbre en fleurs).
// Le sol est peint UNE fois dans une longue bande qui boucle, puis collé à chaque image.

const BANDE = 2400; // longueur de la bande de sol, qui boucle sans couture
let solPeint = null;

function graine(n) { let a = n >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// La rivière, en deux tronçons : elle sort par la droite vers 1000, puis revient par la
// gauche vers 1500 ; entre les deux, on survole la clairière, l'étang et le temple.
const RIVIERES = [
  [[250, -120], [250, 0], [205, 220], [270, 450], [320, 680], [390, 860], [470, 980], [560, 1080]],
  [[-200, 1420], [-60, 1540], [90, 1760], [150, 1980], [215, 2200], [250, 2400], [250, 2520]],
];
function courbe(x, pts) { // Catmull-Rom : passe par chaque point
  x.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    x.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
}
function tache(x, r, cx, cy, rx, ry, couleur) {
  x.beginPath();
  for (let i = 0; i <= 18; i++) { const a = i / 18 * Math.PI * 2, k = 0.85 + r() * 0.3; i ? x.lineTo(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k) : x.moveTo(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k); }
  x.closePath(); x.fillStyle = couleur; x.fill();
}
function rocher(x, r, cx, cy, s) {
  x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(cx + s * 0.25, cy + s * 0.3, s, s * 0.8, 0, 0, Math.PI * 2); x.fill();
  tache(x, r, cx, cy, s, s * 0.82, '#66705f');
  tache(x, r, cx - s * 0.22, cy - s * 0.22, s * 0.6, s * 0.48, '#848d7a');
  x.fillStyle = 'rgba(90,150,70,.55)'; x.beginPath(); x.ellipse(cx + s * 0.3, cy - s * 0.35, s * 0.35, s * 0.2, 0.4, 0, Math.PI * 2); x.fill(); // mousse
}
function tronc(x, cx, cy, long, ang) {
  x.save(); x.translate(cx, cy); x.rotate(ang);
  x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.roundRect(-long / 2 + 5, -9 + 7, long, 18, 9); x.fill();
  x.fillStyle = '#6b4a2b'; x.beginPath(); x.roundRect(-long / 2, -9, long, 18, 9); x.fill();
  x.strokeStyle = '#4e3520'; x.lineWidth = 2; for (let k = -long / 2 + 14; k < long / 2 - 8; k += 16) { x.beginPath(); x.moveTo(k, -7); x.lineTo(k + 8, -4); x.stroke(); }
  x.fillStyle = '#c9a26a'; x.beginPath(); x.ellipse(long / 2 - 2, 0, 5, 9, 0, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#8a6a3c'; x.lineWidth = 1.2; x.beginPath(); x.ellipse(long / 2 - 2, 0, 2.5, 5, 0, 0, Math.PI * 2); x.stroke();
  x.fillStyle = 'rgba(90,150,70,.7)'; x.beginPath(); x.ellipse(-long / 6, -4, 10, 4, 0, 0, Math.PI * 2); x.fill();
  x.restore();
}
function nenuphar(x, cx, cy, s, ang) {
  x.fillStyle = '#4f9a48'; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, s, ang + 0.35, ang + Math.PI * 2 - 0.35); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(30,70,30,.5)'; x.lineWidth = 1; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(ang + Math.PI) * s * 0.8, cy + Math.sin(ang + Math.PI) * s * 0.8); x.stroke();
}
function fleurette(x, cx, cy, c) { x.fillStyle = c; for (let k = 0; k < 5; k++) { const a = k * 1.256; x.beginPath(); x.arc(cx + Math.cos(a) * 2.6, cy + Math.sin(a) * 2.6, 2.2, 0, Math.PI * 2); x.fill(); } x.fillStyle = '#ffd36a'; x.beginPath(); x.arc(cx, cy, 1.6, 0, Math.PI * 2); x.fill(); }

function peindreSol() {
  const c = document.createElement('canvas'); c.width = W * 2; c.height = BANDE * 2;
  const x = c.getContext('2d'); x.scale(2, 2); const r = graine(23);
  // le sol de la jungle : le vert d'aujourd'hui, en taches au lieu de bandes
  x.fillStyle = '#173d22'; x.fillRect(0, 0, W, BANDE);
  for (let i = 0; i < 90; i++) tache(x, r, r() * W, 40 + r() * (BANDE - 80), 30 + r() * 50, 20 + r() * 36, r() < 0.5 ? '#1c4a29' : '#143520');
  for (let i = 0; i < 700; i++) { const px = r() * W, py = 10 + r() * (BANDE - 20); x.strokeStyle = r() < 0.5 ? '#245c33' : '#2d6b3b'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(px, py); x.lineTo(px - 2, py - 4); x.moveTo(px, py); x.lineTo(px + 2, py - 4); x.stroke(); } // touffes d'herbe

  // la clairière et son sentier (entre la rivière et les ruines)
  tache(x, r, 120, 1180, 110, 90, '#2a5a2e'); tache(x, r, 130, 1190, 80, 62, '#356b35');
  x.strokeStyle = '#7a6a42'; x.lineWidth = 9; x.lineCap = 'round'; x.setLineDash([14, 9]);
  x.beginPath(); courbe(x, [[200, 1000], [150, 1090], [110, 1180], [150, 1290], [230, 1370], [300, 1420]]); x.stroke(); x.setLineDash([]);

  // la rivière : berge de sable, eau, reflets
  const bande = (larg, coul) => { x.strokeStyle = coul; x.lineWidth = larg; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); for (const R of RIVIERES) courbe(x, R); x.stroke(); };
  bande(70, '#0f2c18'); bande(62, '#8a7a4a'); bande(50, '#2a6e7d'); bande(28, '#3a8a97');
  x.save(); x.strokeStyle = 'rgba(210,240,240,.55)'; x.lineWidth = 2; x.lineCap = 'round';
  for (const R of RIVIERES) for (let i = 0; i < R.length - 1; i++) { // petits reflets le long du courant
    const [a, b] = R[i], [c, d] = R[i + 1], n = Math.floor(Math.hypot(c - a, d - b) / 44);
    for (let k = 0; k < n; k++) {
      const rx = a + (c - a) * k / n + (r() - 0.5) * 16, y = b + (d - b) * k / n;
      if (rx < -10 || rx > W + 10 || y < 20 || y > BANDE - 20) continue;
      x.beginPath(); x.moveTo(rx - 7, y); x.quadraticCurveTo(rx, y - 4, rx + 7, y); x.stroke();
    }
  }
  x.restore();
  // rochers dans et au bord de la rivière, tronc couché en pont
  [[188, 260, 11], [236, 330, 8], [296, 600, 12], [334, 660, 7], [70, 1690, 10], [118, 1730, 13], [184, 2110, 9], [252, 2260, 11], [40, 380, 9], [330, 1900, 10]].forEach(([a, b, s]) => rocher(x, r, a, b, s));
  tronc(x, 165, 2000, 96, -0.35);

  // l'étang aux nénuphars, et les ruines du temple du Caméléon
  tache(x, r, 270, 1190, 52, 40, '#8a7a4a'); tache(x, r, 270, 1190, 46, 34, '#2a6e7d'); tache(x, r, 262, 1184, 30, 20, '#3a8a97');
  [[248, 1176, 9, 0.4], [286, 1200, 11, 2], [262, 1210, 7, 4], [296, 1170, 8, 5.2]].forEach(([a, b, s, g]) => nenuphar(x, a, b, s, g));
  fleurette(x, 286, 1198, '#e58ab0');
  // dalles du temple, piliers vus de haut, marches ; de la mousse dessus
  x.save(); x.translate(110, 1420);
  x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(-58, -36, 128, 96);
  x.fillStyle = '#6f7a63'; x.fillRect(-64, -44, 128, 96);
  x.strokeStyle = '#4f5a46'; x.lineWidth = 2; for (let i = -64; i <= 64; i += 32) { x.beginPath(); x.moveTo(i, -44); x.lineTo(i, 52); x.stroke(); } for (let j = -44; j <= 52; j += 24) { x.beginPath(); x.moveTo(-64, j); x.lineTo(64, j); x.stroke(); }
  x.fillStyle = '#5c6652'; x.fillRect(-28, 52, 56, 10); x.fillRect(-20, 62, 40, 8);
  for (const [a, b] of [[-50, -30], [50, -30], [-50, 38], [50, 38]]) { x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.arc(a + 4, b + 5, 11, 0, Math.PI * 2); x.fill(); x.fillStyle = '#9aa38a'; x.beginPath(); x.arc(a, b, 11, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#6f7a63'; x.beginPath(); x.arc(a, b, 6, 0, Math.PI * 2); x.stroke(); }
  x.fillStyle = 'rgba(80,140,60,.65)'; tache(x, r, -18, -10, 22, 12, 'rgba(80,140,60,.6)'); tache(x, r, 30, 30, 16, 9, 'rgba(80,140,60,.6)');
  x.restore();
  // fleurs semées sur le sol
  for (let i = 0; i < 70; i++) fleurette(x, r() * W, 10 + r() * (BANDE - 20), ['#c8362b', '#ffd36a', '#e58ab0', '#f2ead3'][i % 4]);
  return c;
}

function fond(ctx, p) {
  if (p.mission.planete !== 'jungle') return fondSimple(ctx, p);
  if (!solPeint) solPeint = peindreSol();
  // la bande défile vers le bas : on montre la portion qui finit à « dec », et la suivante au-dessus
  const dec = (p.t * DEFIL) % BANDE;
  const y0 = BANDE - H - dec; // haut de la portion visible dans la bande
  for (const [yb, yEcran] of [[y0, 0], [y0 + BANDE, 0]]) {
    const haut = Math.max(0, yb), bas = Math.min(BANDE, yb + H);
    if (bas <= haut) continue;
    ctx.drawImage(solPeint, 0, haut * 2, W * 2, (bas - haut) * 2, 0, yEcran + (haut - yb), W, bas - haut);
  }
}
function fondSimple(ctx, p) {
  const [a, b] = p.planete.fond;
  ctx.fillStyle = a; ctx.fillRect(0, 0, W, H);
  const dec = (p.t * DEFIL) % 80;
  ctx.fillStyle = b;
  for (let y = -80 + dec; y < H; y += 80) ctx.fillRect(0, y, W, 40);
}

// --- les arbres vus de haut (là où se cachent les ennemis) ---
const ARBRES = new Map(); // un arbre se peint une fois puis se colle
function arbre(type, rayon) {
  const cle = type + ':' + Math.round(rayon);
  if (ARBRES.has(cle)) return ARBRES.get(cle);
  const t = Math.ceil(rayon * 2.6), c = document.createElement('canvas'); c.width = c.height = t * 2;
  const x = c.getContext('2d'); x.scale(2, 2); x.translate(t / 2, t / 2); const r = graine(type.length * 97 + Math.round(rayon));
  const R = rayon;
  // ombre au sol, décalée vers le bas à droite (le soleil est en haut à gauche)
  x.fillStyle = 'rgba(0,0,0,.32)'; x.beginPath(); x.ellipse(R * 0.18, R * 0.24, R * 1.02, R * 0.95, 0, 0, Math.PI * 2); x.fill();
  if (type === 'palmier') {
    x.fillStyle = '#5b4630'; x.beginPath(); x.arc(0, 0, R * 0.16, 0, Math.PI * 2); x.fill();
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2 + r() * 0.2;
      x.save(); x.rotate(a);
      x.beginPath(); x.moveTo(R * 0.1, 0); x.quadraticCurveTo(R * 0.6, -R * 0.28, R * 1.05, 0); x.quadraticCurveTo(R * 0.6, R * 0.28, R * 0.1, 0);
      x.fillStyle = k % 2 ? '#2f7d3c' : '#3a9147'; x.fill();
      x.strokeStyle = '#7fd08a'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(R * 0.12, 0); x.lineTo(R, 0); x.stroke();
      x.strokeStyle = 'rgba(15,50,20,.55)'; x.lineWidth = 1; for (let j = 0.3; j < 0.95; j += 0.13) { x.beginPath(); x.moveTo(R * j, 0); x.lineTo(R * (j + 0.07), -R * 0.16 * (1 - j)); x.moveTo(R * j, 0); x.lineTo(R * (j + 0.07), R * 0.16 * (1 - j)); x.stroke(); }
      x.restore();
    }
    x.fillStyle = '#7a5a36'; x.beginPath(); x.arc(0, 0, R * 0.13, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#c9a26a'; for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(Math.cos(k * 2.1) * R * 0.08, Math.sin(k * 2.1) * R * 0.08, R * 0.05, 0, Math.PI * 2); x.fill(); } // noix de coco
  } else {
    // houppier en lobes : sombre dessous, clair vers la lumière
    const lobes = Array.from({ length: 8 }, (_, k) => { const a = k / 8 * Math.PI * 2 + r() * 0.4; return [Math.cos(a) * R * 0.55, Math.sin(a) * R * 0.55, R * (0.42 + r() * 0.12)]; });
    x.fillStyle = '#185c2a'; for (const [a, b, s] of lobes) { x.beginPath(); x.arc(a, b, s, 0, Math.PI * 2); x.fill(); }
    x.beginPath(); x.arc(0, 0, R * 0.6, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#237236'; for (const [a, b, s] of lobes) { x.beginPath(); x.arc(a - s * 0.12, b - s * 0.14, s * 0.78, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = '#2f8a45'; for (const [a, b, s] of lobes) if (a + b < R * 0.3) { x.beginPath(); x.arc(a - s * 0.25, b - s * 0.28, s * 0.5, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = '#4fb062'; for (const [a, b, s] of lobes) if (a + b < 0) { x.beginPath(); x.ellipse(a - s * 0.32, b - s * 0.36, s * 0.24, s * 0.16, -0.7, 0, Math.PI * 2); x.fill(); }
    // feuilles en petites touches, et les fleurs de l'arbre en fleurs
    x.strokeStyle = 'rgba(10,40,18,.45)'; x.lineWidth = 1.2;
    for (let k = 0; k < 26; k++) { const a = r() * Math.PI * 2, d = r() * R * 0.85; const px = Math.cos(a) * d, py = Math.sin(a) * d; x.beginPath(); x.arc(px, py, 3, 0.3, 2.4); x.stroke(); }
    if (type === 'fleurs') for (let k = 0; k < 14; k++) { const a = r() * Math.PI * 2, d = r() * R * 0.8; fleurette(x, Math.cos(a) * d, Math.sin(a) * d, k % 3 ? '#e58ab0' : '#f2ead3'); }
  }
  const res = { c, t };
  ARBRES.set(cle, res);
  return res;
}
function feuillage(ctx, p) {
  for (const t of p.terrain) {
    if (t.k !== 'feuille') continue;
    const tremble = p.ennemis.some((e) => e.cache && e.feuille === t && e.age > 30) ? Math.sin(p.t * 1.2) * 3 : 0;
    if (p.mission.planete !== 'jungle') continue;
    const choix = Math.floor(Math.abs(t.bouts[0][0] * 1000)) % 5; // le même arbre tout le long de sa descente
    const a = arbre(choix < 3 ? 'feuillu' : choix < 4 ? 'palmier' : 'fleurs', t.r * 1.05);
    ctx.drawImage(a.c, t.x - a.t / 2 + tremble, t.y - a.t / 2, a.t, a.t);
  }
}
