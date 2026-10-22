// Le décor peint de la Jungle (maquette validée par Julie le 2026-10-22) : on SURVOLE un
// sol, et les ronds verts sont devenus des arbres vus de haut. Chaque mission a son sol :
// une suite de tuiles d'un écran de haut, peintes UNE fois au début de la mission puis
// collées à chaque image (peindre à chaque image coûterait trop cher).
// Lumière unique en haut à gauche : les ombres tombent en bas à droite.
// Aucune donnée de la partie n'est modifiée ici.
import { W, H, DEFIL } from '../moteur/constantes.js';

const TH = H; // hauteur d'une tuile
const ECH = 2; // les tuiles sont peintes en double résolution

// ---------- les sols de chaque mission ----------
// pal : base, taches claires et sombres, herbe ; tuiles : la suite, qui revient en boucle ;
// arbres : les arbres où se cachent les ennemis (poids de chaque sorte).
const DECORS = {
  j1: { nom: 'La lisière', pal: ['#2a5a2e', '#33692f', '#24502a', '#3e7a3a'], tuiles: ['prairie', 'sentier', 'etang', 'prairie'], arbres: { feuillu: 3, fleurs: 1 } },
  j2: { nom: 'Sous les grandes feuilles', pal: ['#143520', '#1a4126', '#0f2c18', '#245c33'], tuiles: ['fougeres', 'tronc', 'rochers', 'fougeres'], arbres: { feuillu: 3, palmier: 1 } },
  j3: { nom: 'La rivière', pal: ['#173d22', '#1c4a29', '#143520', '#2d6b3b'], tuiles: ['riviere', 'riviereRochers', 'rivierePont', 'riviereCascade'], arbres: { feuillu: 2, palmier: 2 } },
  j4: { nom: 'La canopée', pal: ['#0f2a1a', '#143520', '#0b2214', '#1e4a2a'], tuiles: ['cimes', 'brume', 'lianes', 'cimes'], arbres: { feuillu: 4, fleurs: 1 } },
  j5: { nom: 'Le cœur de la jungle', pal: ['#1a3a26', '#21452d', '#132e1e', '#2f5e3a'], tuiles: ['marais', 'racines', 'marais', 'boue'], arbres: { feuillu: 2, palmier: 1, sombre: 2 } },
  jsecret: { nom: 'Le nid secret', pal: ['#1f4a2a', '#2a5a2e', '#183d22', '#3e7a3a'], tuiles: ['fleurs', 'nid', 'fleurs', 'cascadeOr'], arbres: { fleurs: 3, feuillu: 1 }, dore: true },
  jboss: { nom: 'Le temple du Caméléon', pal: ['#173d22', '#1c4a29', '#143520', '#2d6b3b'], tuiles: ['ruines', 'statues', 'ruines', 'parvis'], arbres: { feuillu: 2, palmier: 1 } },
};

function graine(n) { let a = n >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hachage = (s) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);

// ---------- pinceaux ----------
function tache(x, r, cx, cy, rx, ry, couleur) {
  x.beginPath();
  for (let i = 0; i <= 18; i++) { const a = i / 18 * Math.PI * 2, k = 0.85 + r() * 0.3; i ? x.lineTo(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k) : x.moveTo(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k); }
  x.closePath(); x.fillStyle = couleur; x.fill();
}
function courbe(x, pts) { // passe par chaque point (Catmull-Rom)
  x.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    x.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
}
function trait(x, pts, larg, coul, tirets) { x.save(); x.strokeStyle = coul; x.lineWidth = larg; x.lineCap = 'round'; x.lineJoin = 'round'; if (tirets) x.setLineDash(tirets); x.beginPath(); courbe(x, pts); x.stroke(); x.restore(); }
function fleurette(x, cx, cy, c, s = 1) { x.fillStyle = c; for (let k = 0; k < 5; k++) { const a = k * 1.256; x.beginPath(); x.arc(cx + Math.cos(a) * 2.6 * s, cy + Math.sin(a) * 2.6 * s, 2.2 * s, 0, Math.PI * 2); x.fill(); } x.fillStyle = '#ffd36a'; x.beginPath(); x.arc(cx, cy, 1.6 * s, 0, Math.PI * 2); x.fill(); }
function ombre(x, cx, cy, rx, ry) { x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(cx + rx * 0.25, cy + ry * 0.3, rx, ry, 0, 0, Math.PI * 2); x.fill(); }
function rocher(x, r, cx, cy, s) {
  ombre(x, cx, cy, s, s * 0.8);
  tache(x, r, cx, cy, s, s * 0.82, '#66705f');
  tache(x, r, cx - s * 0.22, cy - s * 0.22, s * 0.6, s * 0.48, '#848d7a');
  x.fillStyle = 'rgba(90,150,70,.55)'; x.beginPath(); x.ellipse(cx + s * 0.3, cy - s * 0.35, s * 0.35, s * 0.2, 0.4, 0, Math.PI * 2); x.fill();
}
function tronc(x, cx, cy, long, ang) {
  x.save(); x.translate(cx, cy); x.rotate(ang);
  x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.roundRect(-long / 2 + 5, -2, long, 18, 9); x.fill();
  x.fillStyle = '#6b4a2b'; x.beginPath(); x.roundRect(-long / 2, -9, long, 18, 9); x.fill();
  x.strokeStyle = '#4e3520'; x.lineWidth = 2; for (let k = -long / 2 + 14; k < long / 2 - 8; k += 16) { x.beginPath(); x.moveTo(k, -7); x.lineTo(k + 8, -4); x.stroke(); }
  x.fillStyle = '#c9a26a'; x.beginPath(); x.ellipse(long / 2 - 2, 0, 5, 9, 0, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#8a6a3c'; x.lineWidth = 1.2; x.beginPath(); x.ellipse(long / 2 - 2, 0, 2.5, 5, 0, 0, Math.PI * 2); x.stroke();
  x.fillStyle = 'rgba(90,150,70,.7)'; x.beginPath(); x.ellipse(-long / 6, -4, 10, 4, 0, 0, Math.PI * 2); x.fill();
  x.restore();
}
function eau(x, r, cx, cy, rx, ry, bord = '#8a7a4a') { tache(x, r, cx, cy, rx + 6, ry + 6, bord); tache(x, r, cx, cy, rx, ry, '#2a6e7d'); tache(x, r, cx - rx * 0.15, cy - ry * 0.15, rx * 0.6, ry * 0.55, '#3a8a97'); }
function nenuphar(x, cx, cy, s, ang) {
  x.fillStyle = '#4f9a48'; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, s, ang + 0.35, ang + Math.PI * 2 - 0.35); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(30,70,30,.5)'; x.lineWidth = 1; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(ang + Math.PI) * s * 0.8, cy + Math.sin(ang + Math.PI) * s * 0.8); x.stroke();
}
function etang(x, r, cx, cy, rx, ry) {
  eau(x, r, cx, cy, rx, ry);
  for (let k = 0; k < Math.round(rx / 9); k++) { const a = r() * Math.PI * 2, d = r() * 0.7; nenuphar(x, cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, 6 + r() * 5, r() * 6); }
  fleurette(x, cx + rx * 0.3, cy + ry * 0.1, '#e58ab0');
}
function fougere(x, r, cx, cy, s, coul = '#2f7d3c') {
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * Math.PI * 2 + r() * 0.4;
    x.save(); x.translate(cx, cy); x.rotate(a);
    x.fillStyle = k % 2 ? coul : '#3a9147'; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(s * 0.5, -s * 0.2, s, 0); x.quadraticCurveTo(s * 0.5, s * 0.2, 0, 0); x.fill();
    x.strokeStyle = 'rgba(160,220,150,.5)'; x.lineWidth = 1; x.beginPath(); x.moveTo(2, 0); x.lineTo(s * 0.9, 0); x.stroke();
    x.restore();
  }
}
function buisson(x, r, cx, cy, s, coul = '#1f6630') {
  ombre(x, cx, cy, s, s * 0.9);
  for (let k = 0; k < 5; k++) { const a = k * 1.256 + r(); x.fillStyle = coul; x.beginPath(); x.arc(cx + Math.cos(a) * s * 0.45, cy + Math.sin(a) * s * 0.45, s * 0.55, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = 'rgba(120,200,110,.35)'; x.beginPath(); x.arc(cx - s * 0.3, cy - s * 0.3, s * 0.35, 0, Math.PI * 2); x.fill();
}
function dalles(x, cx, cy, w, h, mousse, r) {
  x.save(); x.translate(cx, cy);
  x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(-w / 2 + 6, -h / 2 + 8, w, h);
  x.fillStyle = '#6f7a63'; x.fillRect(-w / 2, -h / 2, w, h);
  x.strokeStyle = '#4f5a46'; x.lineWidth = 2;
  for (let i = -w / 2; i <= w / 2 + 1; i += 32) { x.beginPath(); x.moveTo(i, -h / 2); x.lineTo(i, h / 2); x.stroke(); }
  for (let j = -h / 2; j <= h / 2 + 1; j += 24) { x.beginPath(); x.moveTo(-w / 2, j); x.lineTo(w / 2, j); x.stroke(); }
  if (mousse) for (let k = 0; k < Math.round(w * h / 3000); k++) tache(x, r, (r() - 0.5) * w * 0.8, (r() - 0.5) * h * 0.8, 10 + r() * 14, 6 + r() * 8, 'rgba(80,140,60,.55)');
  x.restore();
}
function pilier(x, cx, cy, s = 11, casse = false) {
  x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.arc(cx + 4, cy + 5, s, 0, Math.PI * 2); x.fill();
  x.fillStyle = casse ? '#848d7a' : '#9aa38a'; x.beginPath(); x.arc(cx, cy, s, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#6f7a63'; x.lineWidth = 1.6; x.beginPath(); x.arc(cx, cy, s * 0.55, 0, Math.PI * 2); x.stroke();
  if (casse) { x.strokeStyle = '#5c6652'; x.beginPath(); x.moveTo(cx - s * 0.6, cy - s * 0.2); x.lineTo(cx + s * 0.1, cy + s * 0.3); x.lineTo(cx + s * 0.5, cy - s * 0.1); x.stroke(); }
}
function statue(x, cx, cy) { // tête de caméléon en pierre, vue de haut : l'annonce du boss
  ombre(x, cx, cy, 22, 18);
  x.fillStyle = '#848d7a'; x.beginPath(); x.ellipse(cx, cy, 22, 17, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#9aa38a'; x.beginPath(); x.moveTo(cx - 20, cy - 4); x.quadraticCurveTo(cx, cy - 30, cx + 20, cy - 4); x.closePath(); x.fill(); // crête
  for (const s of [-1, 1]) { x.fillStyle = '#6f7a63'; x.beginPath(); x.arc(cx + s * 13, cy + 2, 6, 0, Math.PI * 2); x.fill(); x.fillStyle = '#c9b56a'; x.beginPath(); x.arc(cx + s * 13, cy + 2, 2.6, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = 'rgba(80,140,60,.55)'; x.beginPath(); x.ellipse(cx - 8, cy + 10, 9, 4, 0.3, 0, Math.PI * 2); x.fill();
}
function brume(x, r, cx, cy, rx, ry) { for (let k = 0; k < 4; k++) tache(x, r, cx + (r() - 0.5) * rx * 0.6, cy + (r() - 0.5) * ry * 0.6, rx * (0.6 + r() * 0.4), ry * (0.6 + r() * 0.4), 'rgba(220,240,230,.05)'); }
function cime(x, r, cx, cy, R, coul) { // la cime d'un arbre géant, tout en bas sous l'avion
  for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + r() * 0.5; tache(x, r, cx + Math.cos(a) * R * 0.5, cy + Math.sin(a) * R * 0.5, R * 0.5, R * 0.45, coul); }
  tache(x, r, cx, cy, R * 0.6, R * 0.55, coul);
  x.fillStyle = 'rgba(140,200,120,.12)'; x.beginPath(); x.arc(cx - R * 0.3, cy - R * 0.3, R * 0.4, 0, Math.PI * 2); x.fill();
}
function liane(x, r, pts) { trait(x, pts, 3, '#2a4a20'); for (let k = 1; k < pts.length; k++) { const [a, b] = pts[k]; x.fillStyle = '#3f7a3a'; x.beginPath(); x.ellipse(a + 5, b, 5, 2.6, 0.6, 0, Math.PI * 2); x.fill(); x.beginPath(); x.ellipse(a - 5, b + 4, 5, 2.6, -0.6, 0, Math.PI * 2); x.fill(); } }
function roseaux(x, r, cx, cy, n) { x.strokeStyle = '#6a8a3a'; x.lineWidth = 1.6; for (let k = 0; k < n; k++) { const px = cx + (r() - 0.5) * 30, py = cy + (r() - 0.5) * 20; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 6, py - 7 - r() * 5); x.stroke(); } }

function hutte(x, r, cx, cy) { // la hutte d'un explorateur, vue de haut : un toit de chaume rond
  ombre(x, cx, cy, 30, 28);
  x.fillStyle = '#b08a45'; x.beginPath(); x.arc(cx, cy, 30, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#c9a35a'; x.beginPath(); x.arc(cx - 3, cy - 3, 24, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(110,80,35,.6)'; x.lineWidth = 1.4;
  for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; x.beginPath(); x.moveTo(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6); x.lineTo(cx + Math.cos(a) * 29, cy + Math.sin(a) * 29); x.stroke(); }
  x.fillStyle = '#7a5a36'; x.beginPath(); x.arc(cx, cy, 6, 0, Math.PI * 2); x.fill();
  x.fillStyle = 'rgba(255,240,200,.25)'; x.beginPath(); x.arc(cx - 10, cy - 10, 9, 0, Math.PI * 2); x.fill();
}
function feuDeCamp(x, r, cx, cy) { // un rond de pierres, la cendre et quelques braises : on était là
  x.fillStyle = '#3a342c'; x.beginPath(); x.arc(cx, cy, 12, 0, Math.PI * 2); x.fill();
  for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; x.fillStyle = k % 2 ? '#848d7a' : '#9aa38a'; x.beginPath(); x.ellipse(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15, 4.4, 3.4, a, 0, Math.PI * 2); x.fill(); }
  for (let k = 0; k < 6; k++) { x.fillStyle = k % 2 ? '#ff9a3c' : '#ffd36a'; x.beginPath(); x.arc(cx + (r() - 0.5) * 12, cy + (r() - 0.5) * 12, 1.6 + r() * 1.4, 0, Math.PI * 2); x.fill(); }
  x.strokeStyle = '#5a4630'; x.lineWidth = 3; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx - 8, cy - 4); x.lineTo(cx + 7, cy + 5); x.moveTo(cx - 6, cy + 6); x.lineTo(cx + 8, cy - 5); x.stroke();
}
function racine(x, r, pts, larg) { // épaisse au départ, fine au bout, à moitié dans la terre
  for (let i = 0; i < pts.length - 1; i++) {
    const t = i / (pts.length - 1);
    x.globalAlpha = 1 - t * 0.55; // elle s'enfonce dans le sol en s'éloignant
    x.strokeStyle = '#3e2f1e'; x.lineWidth = larg * (1 - t * 0.8) + 1.5; x.lineCap = 'round';
    x.beginPath(); x.moveTo(...pts[i]); x.lineTo(...pts[i + 1]); x.stroke();
    x.strokeStyle = '#5e4630'; x.lineWidth = Math.max(1, larg * (1 - t * 0.8) * 0.3);
    x.beginPath(); x.moveTo(pts[i][0] - 1, pts[i][1] - 1); x.lineTo(pts[i + 1][0] - 1, pts[i + 1][1] - 1); x.stroke();
  }
  x.globalAlpha = 1;
}
// Une grosse souche vue de haut. Ses racines, peu nombreuses et inégales, partent surtout vers
// la mare (vers, en radians) : régulières tout autour, elles faisaient des pattes d'araignée.
function souche(x, r, cx, cy, R, vers) {
  const angles = [vers - 0.5, vers, vers + 0.45, vers + 2.4, vers - 2.2];
  angles.forEach((a0, k) => {
    const l = R * (k < 3 ? 2.4 + r() * 1.4 : 1 + r() * 0.6), courbe = (r() - 0.5) * 1.2;
    const pts = []; for (let j = 0; j <= 7; j++) { const t = j / 7, aa = a0 + courbe * t + Math.sin(t * 6 + k) * 0.12; pts.push([cx + Math.cos(aa) * (R * 0.75 + l * t), cy + Math.sin(aa) * (R * 0.75 + l * t)]); }
    racine(x, r, pts, R * (k < 3 ? 0.42 : 0.3));
    if (k === 1) { x.fillStyle = 'rgba(90,150,70,.55)'; const [mx, my] = pts[2]; x.beginPath(); x.ellipse(mx, my, 7, 3, a0, 0, Math.PI * 2); x.fill(); } // mousse
  });
  for (let k = 0; k < 10; k++) { const a = r() * Math.PI * 2, d = R * (1 + r() * 0.8); x.strokeStyle = '#2d6b3b'; x.lineWidth = 1.4; const px = cx + Math.cos(a) * d, py = cy + Math.sin(a) * d; x.beginPath(); x.moveTo(px, py); x.lineTo(px - 2, py - 4); x.moveTo(px, py); x.lineTo(px + 2, py - 4); x.stroke(); } // l'herbe pousse sur les racines
  ombre(x, cx, cy, R, R);
  x.fillStyle = '#4e3824'; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#9a7a4e'; x.beginPath(); x.arc(cx - 2, cy - 2, R * 0.78, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#7a5e3a'; x.lineWidth = 1.3; for (let k = 1; k <= 3; k++) { x.beginPath(); x.arc(cx - 2 + k * 0.6, cy - 2, R * 0.78 * k / 4, 0, Math.PI * 2); x.stroke(); }
  x.fillStyle = 'rgba(90,150,70,.75)'; x.beginPath(); x.ellipse(cx + R * 0.3, cy - R * 0.45, R * 0.5, R * 0.28, 0.5, 0, Math.PI * 2); x.fill();
}

// ---------- les tuiles ----------
// Le sol de base : la couleur de la mission en taches, des touffes d'herbe, des fleurs
function sol(x, r, pal, fleurs) {
  x.fillStyle = pal[0]; x.fillRect(0, 0, W, TH);
  for (let i = 0; i < 26; i++) tache(x, r, 40 + r() * (W - 80), 70 + r() * (TH - 140), 30 + r() * 46, 20 + r() * 32, r() < 0.5 ? pal[1] : pal[2]);
  for (let i = 0; i < 180; i++) { const px = r() * W, py = 6 + r() * (TH - 12); x.strokeStyle = r() < 0.5 ? pal[3] : pal[1]; x.lineWidth = 1.4; x.beginPath(); x.moveTo(px, py); x.lineTo(px - 2, py - 4); x.moveTo(px, py); x.lineTo(px + 2, py - 4); x.stroke(); }
  for (let i = 0; i < fleurs; i++) fleurette(x, 10 + r() * (W - 20), 10 + r() * (TH - 20), ['#c8362b', '#ffd36a', '#e58ab0', '#f2ead3'][i % 4]);
}
// La rivière d'une tuile : elle entre et sort à x = 250, toute droite, pour se raccorder à la suivante
function riviere(x, r, ondule, larg = 50) {
  const pts = [[250, -40], [250, 0], [250 - ondule, TH * 0.3], [250 + ondule * 0.6, TH * 0.62], [250, TH], [250, TH + 40]];
  trait(x, pts, larg + 20, '#0f2c18'); trait(x, pts, larg + 12, '#8a7a4a'); trait(x, pts, larg, '#2a6e7d'); trait(x, pts, larg * 0.56, '#3a8a97');
  x.save(); x.strokeStyle = 'rgba(210,240,240,.55)'; x.lineWidth = 2; x.lineCap = 'round';
  for (let k = 0; k < 14; k++) { const t = (k + 0.5) / 14, y = t * TH, cx = 250 + (t < 0.3 ? -ondule * t / 0.3 : t < 0.62 ? -ondule + (ondule * 1.6) * (t - 0.3) / 0.32 : ondule * 0.6 * (1 - (t - 0.62) / 0.38)) + (r() - 0.5) * 14; x.beginPath(); x.moveTo(cx - 7, y); x.quadraticCurveTo(cx, y - 4, cx + 7, y); x.stroke(); }
  x.restore();
  return (y) => { const t = y / TH; return 250 + (t < 0.3 ? -ondule * t / 0.3 : t < 0.62 ? -ondule + (ondule * 1.6) * (t - 0.3) / 0.32 : ondule * 0.6 * (1 - (t - 0.62) / 0.38)); };
}
// Un chemin ou une route reste DANS sa tuile : sinon il serait coupé net au raccord.
const TUILES = {
  prairie(x, r, d) { sol(x, r, d.pal, 40); for (let k = 0; k < 6; k++) buisson(x, r, 30 + r() * (W - 60), 40 + r() * (TH - 80), 10 + r() * 8, '#2c7a3a'); },
  sentier(x, r, d) { // un vrai chemin : il part de la hutte et monte jusqu'au feu de camp
    sol(x, r, d.pal, 26);
    const chemin = [[118, 118], [150, 220], [96, 330], [150, 440], [120, 528]];
    trait(x, chemin, 26, '#4e3c22'); trait(x, chemin, 20, '#9a8456'); trait(x, chemin, 7, '#b5a070', [10, 16]);
    for (let k = 0; k < 18; k++) { const t = r(), q = chemin[Math.min(chemin.length - 1, Math.floor(t * (chemin.length - 1)) + (r() < 0.5 ? 0 : 1))]; x.fillStyle = r() < 0.5 ? '#7d7a68' : '#a39d84'; x.beginPath(); x.ellipse(q[0] + (r() - 0.5) * 16, q[1] + (r() - 0.5) * 60, 2 + r() * 2, 1.6 + r(), r() * 3, 0, Math.PI * 2); x.fill(); } // cailloux
    hutte(x, r, 120, 560); feuDeCamp(x, r, 116, 92);
    for (let k = 0; k < 4; k++) rocher(x, r, 200 + r() * 130, 80 + r() * (TH - 160), 6 + r() * 5);
    buisson(x, r, 290, 230, 14, '#2c7a3a'); buisson(x, r, 40, 250, 11, '#2c7a3a');
  },
  etang(x, r, d) { sol(x, r, d.pal, 24); etang(x, r, 230, 300, 70, 50); roseaux(x, r, 170, 270, 12); roseaux(x, r, 290, 350, 10); buisson(x, r, 70, 480, 15, '#2c7a3a'); },
  fougeres(x, r, d) { sol(x, r, d.pal, 6); for (let k = 0; k < 22; k++) fougere(x, r, 20 + r() * (W - 40), 20 + r() * (TH - 40), 12 + r() * 10); for (let k = 0; k < 3; k++) rocher(x, r, 30 + r() * (W - 60), 50 + r() * (TH - 100), 7 + r() * 4); },
  tronc(x, r, d) { sol(x, r, d.pal, 6); tronc(x, 170, 260, 150, 0.4); tronc(x, 260, 470, 90, -0.6); for (let k = 0; k < 12; k++) fougere(x, r, 20 + r() * (W - 40), 20 + r() * (TH - 40), 10 + r() * 8); },
  rochers(x, r, d) { sol(x, r, d.pal, 8); for (let k = 0; k < 9; k++) rocher(x, r, 30 + r() * (W - 60), 40 + r() * (TH - 80), 8 + r() * 12); for (let k = 0; k < 8; k++) fougere(x, r, r() * W, r() * TH, 10 + r() * 6); },
  riviere(x, r, d) { sol(x, r, d.pal, 14); riviere(x, r, 50); },
  riviereRochers(x, r, d) { sol(x, r, d.pal, 12); const rx = riviere(x, r, 30); for (const y of [120, 240, 380, 520]) rocher(x, r, rx(y) + (r() - 0.5) * 30, y, 8 + r() * 6); rocher(x, r, 60, 300, 12); },
  rivierePont(x, r, d) { sol(x, r, d.pal, 12); const rx = riviere(x, r, 40); tronc(x, rx(320), 320, 110, -0.25); rocher(x, r, rx(150) - 40, 150, 10); buisson(x, r, 80, 450, 14); },
  riviereCascade(x, r, d) {
    sol(x, r, d.pal, 10); const rx = riviere(x, r, 20, 54);
    eau(x, r, rx(420), 430, 70, 46); // le bassin au pied de la chute
    for (let k = -3; k <= 3; k++) rocher(x, r, rx(300) + k * 13, 300 + (k % 2) * 4, 8);
    x.strokeStyle = 'rgba(240,250,250,.8)'; x.lineWidth = 2.4; x.lineCap = 'round';
    for (let k = 0; k < 14; k++) { const px = rx(320) - 34 + k * 5, y0 = 310 + (k % 3) * 2; x.beginPath(); x.moveTo(px, y0); x.lineTo(px + (r() - 0.5) * 3, y0 + 30 + r() * 20); x.stroke(); } // l'eau qui tombe
    for (let k = 0; k < 10; k++) { x.fillStyle = 'rgba(240,250,250,.6)'; x.beginPath(); x.arc(rx(380) + (r() - 0.5) * 70, 375 + r() * 20, 2 + r() * 3, 0, Math.PI * 2); x.fill(); } // écume
  },
  cimes(x, r, d) { sol(x, r, d.pal, 0); for (let k = 0; k < 7; k++) cime(x, r, 20 + r() * (W - 40), 40 + r() * (TH - 80), 40 + r() * 30, k % 2 ? '#1a4a28' : '#163f22'); brume(x, r, 180, 320, 160, 90); },
  brume(x, r, d) { sol(x, r, d.pal, 0); for (let k = 0; k < 4; k++) cime(x, r, r() * W, r() * TH, 36 + r() * 20, '#163f22'); for (let k = 0; k < 4; k++) brume(x, r, r() * W, 80 + r() * (TH - 160), 140, 80); },
  lianes(x, r, d) { sol(x, r, d.pal, 0); for (let k = 0; k < 5; k++) cime(x, r, r() * W, r() * TH, 34 + r() * 18, '#163f22'); for (let k = 0; k < 4; k++) { const y = 60 + k * 150; liane(x, r, [[-10, y], [90, y + 40], [200, y + 10], [W + 10, y + 50]]); } },
  marais(x, r, d) { sol(x, r, d.pal, 4); for (let k = 0; k < 5; k++) eau(x, r, 30 + r() * (W - 60), 50 + r() * (TH - 100), 30 + r() * 30, 18 + r() * 16, '#4a3d24'); for (let k = 0; k < 6; k++) nenuphar(x, r() * W, r() * TH, 6 + r() * 4, r() * 6); for (let k = 0; k < 6; k++) roseaux(x, r, r() * W, r() * TH, 10); },
  racines(x, r, d) { // les racines partent de grosses souches et plongent dans les mares
    sol(x, r, d.pal, 4);
    eau(x, r, 70, 300, 46, 26, '#4a3d24'); eau(x, r, 300, 250, 40, 24, '#4a3d24'); eau(x, r, 190, 560, 56, 28, '#4a3d24');
    souche(x, r, 130, 250, 24, Math.atan2(300 - 250, 70 - 130)); souche(x, r, 250, 430, 20, Math.atan2(560 - 430, 190 - 250));
    for (let k = 0; k < 5; k++) nenuphar(x, r() * W, r() * TH, 6 + r() * 4, r() * 6);
    roseaux(x, r, 60, 280, 10); roseaux(x, r, 210, 540, 12);
  },
  boue(x, r, d) { sol(x, r, d.pal, 2); for (let k = 0; k < 8; k++) tache(x, r, r() * W, r() * TH, 30 + r() * 30, 16 + r() * 14, '#4a3d24'); for (let k = 0; k < 14; k++) { x.fillStyle = 'rgba(30,20,10,.4)'; x.beginPath(); x.arc(r() * W, r() * TH, 2 + r() * 3, 0, Math.PI * 2); x.fill(); } tronc(x, 200, 300, 100, 1.1); },
  fleurs(x, r, d) { sol(x, r, d.pal, 110); for (let k = 0; k < 5; k++) buisson(x, r, r() * W, r() * TH, 12, '#2c7a3a'); },
  nid(x, r, d) { // le nid géant où dort l'astronaute doré
    sol(x, r, d.pal, 60); ombre(x, 180, 320, 80, 70);
    for (let k = 0; k < 90; k++) { const a = r() * Math.PI * 2, rr = 52 + r() * 26; x.strokeStyle = k % 3 ? '#8a6a3c' : '#6b4a2b'; x.lineWidth = 3; x.beginPath(); x.moveTo(180 + Math.cos(a) * rr, 320 + Math.sin(a) * rr); x.lineTo(180 + Math.cos(a + 0.5) * rr, 320 + Math.sin(a + 0.5) * rr); x.stroke(); }
    x.fillStyle = '#5a4630'; x.beginPath(); x.arc(180, 320, 52, 0, Math.PI * 2); x.fill();
    for (const [a, b] of [[164, 312], [192, 306], [182, 334]]) { x.fillStyle = '#f2d36a'; x.beginPath(); x.ellipse(a, b, 9, 12, 0.3, 0, Math.PI * 2); x.fill(); x.fillStyle = 'rgba(255,255,230,.6)'; x.beginPath(); x.ellipse(a - 3, b - 4, 3, 4, 0.3, 0, Math.PI * 2); x.fill(); }
  },
  cascadeOr(x, r, d) { TUILES.riviereCascade(x, r, d); },
  ruines(x, r, d) { sol(x, r, d.pal, 10); dalles(x, 110, 220, 128, 96, true, r); pilier(x, 60, 190); pilier(x, 160, 190, 11, true); dalles(x, 250, 470, 96, 72, true, r); pilier(x, 290, 440, 10, true); for (let k = 0; k < 4; k++) rocher(x, r, r() * W, r() * TH, 6 + r() * 5); },
  statues(x, r, d) { sol(x, r, d.pal, 8); trait(x, [[180, 40], [180, TH - 40]], 46, '#6f7a63'); trait(x, [[180, 40], [180, TH - 40]], 2, '#4f5a46', [24, 24]); for (const y of [140, 400]) { statue(x, 100, y); statue(x, 260, y); } },
  parvis(x, r, d) { sol(x, r, d.pal, 4); dalles(x, 180, 330, 320, 240, true, r); for (const [a, b] of [[40, 230], [320, 230], [40, 430], [320, 430]]) pilier(x, a, b, 14); },
};

const peintes = new Map(); // mission → tuiles peintes
function tuilesDe(id) {
  if (peintes.has(id)) return peintes.get(id);
  const d = DECORS[id] ?? DECORS.j1;
  const liste = d.tuiles.map((nom, k) => {
    const c = document.createElement('canvas'); c.width = W * ECH; c.height = TH * ECH;
    const x = c.getContext('2d'); x.scale(ECH, ECH);
    TUILES[nom](x, graine(hachage(id + nom + k)), d);
    // la lumière dorée du nid : un voile UNI (un dégradé par tuile laissait voir chaque raccord)
    if (d.dore) { x.fillStyle = 'rgba(255,215,110,.10)'; x.fillRect(0, 0, W, TH); }
    return c;
  });
  peintes.set(id, liste);
  return liste;
}

/** Dessine le sol de la mission (Jungle). @param {CanvasRenderingContext2D} ctx @param {any} p */
export function solPeint(ctx, p) {
  const tuiles = tuilesDe(p.mission.id), d = p.t * DEFIL, k0 = Math.floor(d / TH), haut = d - k0 * TH;
  // la tuile k0 descend sous l'écran, la suivante arrive par le haut
  ctx.drawImage(tuiles[k0 % tuiles.length], 0, haut, W, TH);
  ctx.drawImage(tuiles[(k0 + 1) % tuiles.length], 0, haut - TH, W, TH);
}

// ---------- les arbres vus de haut (où se cachent les ennemis) ----------
const ARBRES = new Map();
function arbre(type, rayon) {
  const cle = type + ':' + Math.round(rayon);
  if (ARBRES.has(cle)) return ARBRES.get(cle);
  const t = Math.ceil(rayon * 2.6), c = document.createElement('canvas'); c.width = c.height = t * ECH;
  const x = c.getContext('2d'); x.scale(ECH, ECH); x.translate(t / 2, t / 2); const r = graine(hachage(cle)), R = rayon;
  x.fillStyle = 'rgba(0,0,0,.32)'; x.beginPath(); x.ellipse(R * 0.18, R * 0.24, R * 1.02, R * 0.95, 0, 0, Math.PI * 2); x.fill();
  if (type === 'palmier') {
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
    x.fillStyle = '#c9a26a'; for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(Math.cos(k * 2.1) * R * 0.08, Math.sin(k * 2.1) * R * 0.08, R * 0.05, 0, Math.PI * 2); x.fill(); }
  } else {
    const [c0, c1, c2, c3] = type === 'sombre' ? ['#12442a', '#185a36', '#1f6a40', '#3a8a58'] : ['#185c2a', '#237236', '#2f8a45', '#4fb062'];
    const lobes = Array.from({ length: 8 }, (_, k) => { const a = k / 8 * Math.PI * 2 + r() * 0.4; return [Math.cos(a) * R * 0.55, Math.sin(a) * R * 0.55, R * (0.42 + r() * 0.12)]; });
    x.fillStyle = c0; for (const [a, b, s] of lobes) { x.beginPath(); x.arc(a, b, s, 0, Math.PI * 2); x.fill(); }
    x.beginPath(); x.arc(0, 0, R * 0.6, 0, Math.PI * 2); x.fill();
    x.fillStyle = c1; for (const [a, b, s] of lobes) { x.beginPath(); x.arc(a - s * 0.12, b - s * 0.14, s * 0.78, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = c2; for (const [a, b, s] of lobes) if (a + b < R * 0.3) { x.beginPath(); x.arc(a - s * 0.25, b - s * 0.28, s * 0.5, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = c3; for (const [a, b, s] of lobes) if (a + b < 0) { x.beginPath(); x.ellipse(a - s * 0.32, b - s * 0.36, s * 0.24, s * 0.16, -0.7, 0, Math.PI * 2); x.fill(); }
    x.strokeStyle = 'rgba(10,40,18,.45)'; x.lineWidth = 1.2;
    for (let k = 0; k < 26; k++) { const a = r() * Math.PI * 2, dd = r() * R * 0.85; x.beginPath(); x.arc(Math.cos(a) * dd, Math.sin(a) * dd, 3, 0.3, 2.4); x.stroke(); }
    if (type === 'fleurs') for (let k = 0; k < 14; k++) { const a = r() * Math.PI * 2, dd = r() * R * 0.8; fleurette(x, Math.cos(a) * dd, Math.sin(a) * dd, k % 3 ? '#e58ab0' : '#f2ead3'); }
  }
  const res = { c, t };
  ARBRES.set(cle, res);
  return res;
}

/** Dessine un arbre du feuillage, vu de haut ; sa sorte dépend de la mission. */
export function arbrePeint(ctx, p, t, decalX) {
  const poids = (DECORS[p.mission.id] ?? DECORS.j1).arbres, sortes = Object.entries(poids), total = sortes.reduce((s, [, w]) => s + w, 0);
  let tirage = (Math.floor(Math.abs(t.bouts[0][0] * 1000)) % 97) / 97 * total, sorte = sortes[0][0]; // le même arbre toute sa descente
  for (const [nom, w] of sortes) { if (tirage < w) { sorte = nom; break; } tirage -= w; }
  const a = arbre(sorte, t.r * 1.05);
  ctx.drawImage(a.c, t.x - a.t / 2 + decalX, t.y - a.t / 2, a.t, a.t);
}

/** Le nom de chaque mission décorée (pour les bancs). */
export const MISSIONS_DECOREES = Object.keys(DECORS);
