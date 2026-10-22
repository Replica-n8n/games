// Dessin d'une mission en FORMES SIMPLES (aucun graphisme définitif : la direction B
// viendra après). Ne modifie jamais la partie : il lit seulement son état.
import { W, H, DEFIL, ZT, ZB } from '../moteur/constantes.js';
import { ARMES } from '../moteur/tirs.js';
import { solPeint, arbrePeint, aUnSol } from './decor.js';

const COUL = { rouge: '#ff3b5c', bleu: '#4fd6ff', cristal: '#87f3ff', ami: '#5fd68a' };

/** Trace la forme d'un ennemi centrée sur l'origine. */
function forme(ctx, f, r, rot = 0) {
  ctx.beginPath();
  const poly = (n, dec) => { for (let i = 0; i < n; i++) { const a = dec + rot + (i / n) * Math.PI * 2; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); };
  if (f === 'rond') ctx.arc(0, 0, r, 0, Math.PI * 2);
  else if (f === 'tri') poly(3, Math.PI / 2);
  else if (f === 'carre') poly(4, Math.PI / 4);
  else if (f === 'losange') poly(4, 0);
  else if (f === 'penta') poly(5, -Math.PI / 2);
  else if (f === 'hexa') poly(6, 0);
  else if (f === 'barre') ctx.rect(-r * 1.4, -r * 0.45, r * 2.8, r * 0.9);
  else if (f === 'demi') { ctx.arc(0, 0, r, Math.PI, 0); ctx.closePath(); }
  else if (f === 'pince') { // le scorpion : corps, deux pinces, la queue recourbée
    ctx.ellipse(0, 2, r * 0.6, r * 0.8, 0, 0, Math.PI * 2);
    for (const s of [-1, 1]) { ctx.moveTo(s * r * 0.95 + r * 0.42, -r * 0.7); ctx.arc(s * r * 0.95, -r * 0.7, r * 0.42, 0, Math.PI * 2); }
    ctx.moveTo(r * 0.25, r * 1.05); ctx.arc(0, r * 1.05, r * 0.25, 0, Math.PI * 2);
  }
  else if (f === 'cactus') { // vu de haut : une boule côtelée et ses deux bras
    ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
    for (const s of [-1, 1]) { ctx.moveTo(s * r * 1.15 + r * 0.32, 0); ctx.arc(s * r * 1.15, 0, r * 0.32, 0, Math.PI * 2); }
  }
  else if (f === 'ver') { for (let i = 0; i < 5; i++) { const y = -r * 0.8 + i * r * 0.42, rr = r * (0.62 - i * 0.07), cx = Math.sin(rot * 3 + i) * 6; ctx.moveTo(cx + rr, y); ctx.arc(cx, y, rr, 0, Math.PI * 2); } }
  else if (f === 'boulet') { ctx.arc(0, 0, r, 0, Math.PI * 2); }
  else if (f === 'etoile') { for (let i = 0; i < 16; i++) { const a = rot + (i / 16) * Math.PI * 2, rr = i % 2 ? r * 0.5 : r; i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); }
}

/** Petite icône d'un cadeau : une forme par arme, une par bonus. */
export function icone(ctx, c, r = 13) {
  ctx.fillStyle = '#fff'; ctx.strokeStyle = c.arme ? '#3d7bff' : '#ff3d6e'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.rect(-r, -r, r * 2, r * 2); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#1b2a6b'; ctx.fillStyle = '#1b2a6b';
  ctx.beginPath();
  const a = c.arme, b = c.bonus;
  if (a === 'crayon') { ctx.moveTo(0, -8); ctx.lineTo(0, 8); }
  if (a === 'arrosoir') for (const [x, y] of [[-4, 2], [0, -4], [4, 2]]) { ctx.moveTo(x + 2, y); ctx.arc(x, y, 2, 0, Math.PI * 2); }
  if (a === 'elastiques') for (let i = -2; i <= 2; i++) { ctx.moveTo(0, 5); ctx.lineTo(i * 3, -6); }
  if (a === 'avions') { ctx.moveTo(0, -7); ctx.lineTo(6, 6); ctx.lineTo(0, 3); ctx.lineTo(-6, 6); ctx.closePath(); }
  if (a === 'billes') { ctx.moveTo(-1, 0); ctx.arc(-4, 0, 3, 0, Math.PI * 2); ctx.moveTo(7, 0); ctx.arc(4, 0, 3, 0, Math.PI * 2); }
  if (a === 'bulles' || b === 'bouclier') ctx.arc(0, 0, 7, 0, Math.PI * 2);
  if (b === 'aimant') { ctx.moveTo(-6, -7); ctx.lineTo(-6, 1); ctx.arc(0, 1, 6, Math.PI, 0, true); ctx.lineTo(6, -7); }
  if (b === 'compagnons') { ctx.moveTo(-1, 0); ctx.arc(-5, 0, 3, 0, Math.PI * 2); ctx.moveTo(9, 0); ctx.arc(5, 0, 3, 0, Math.PI * 2); }
  if (b === 'etoile') for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? 3 : 8; i ? ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) : ctx.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); }
  if (b === 'coeur') { ctx.moveTo(0, 6); ctx.bezierCurveTo(-10, -2, -4, -9, 0, -3); ctx.bezierCurveTo(4, -9, 10, -2, 0, 6); }
  (a === 'avions' || b === 'etoile' || b === 'coeur') ? ctx.fill() : ctx.stroke();
}

function fond(ctx, p) {
  if (aUnSol(p)) return solPeint(ctx, p); // le sol peint de la mission (decor.js)
  const [a, b] = p.planete.fond;
  ctx.fillStyle = a; ctx.fillRect(0, 0, W, H);
  const dec = (p.t * DEFIL) % 80;
  ctx.fillStyle = b;
  for (let y = -80 + dec; y < H; y += 80) ctx.fillRect(0, y, W, 40);
}

function feuillage(ctx, p) {
  for (const t of p.terrain) {
    if (t.k !== 'feuille') continue;
    const tremble = p.ennemis.some((e) => e.cache && e.feuille === t && e.age > 30) ? Math.sin(p.t * 1.2) * 3 : 0;
    if (p.mission.planete === 'jungle') { arbrePeint(ctx, p, t, tremble); continue; } // un arbre vu de haut
    ctx.fillStyle = 'rgba(30,110,50,.95)';
    for (const [dx, dy, s] of t.bouts) { ctx.beginPath(); ctx.arc(t.x + dx * t.r + tremble, t.y + dy * t.r, t.r * s, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(80,170,90,.6)';
    for (const [dx, dy, s] of t.bouts) { ctx.beginPath(); ctx.arc(t.x + dx * t.r - 4 + tremble, t.y + dy * t.r - 4, t.r * s * 0.6, 0, Math.PI * 2); ctx.fill(); }
  }
}

function ennemi(ctx, e, p, zones) {
  if (e.cache && e.def.monticule) { monticule(ctx, e); return; } // sous le sable : seul son monticule se voit
  ctx.save(); ctx.translate(e.x, e.y);
  if (e.def.taille === 'cage') {
    const dore = p.mission.cages[e.cid]?.dore;
    ctx.fillStyle = dore ? '#ffd700' : COUL.ami; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = e.flash ? '#fff' : dore ? '#ffd700' : e.def.couleur; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, e.r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); for (let x = -8; x <= 8; x += 8) { ctx.moveTo(x, -e.r + 2); ctx.lineTo(x, e.r - 2); } ctx.stroke();
    ctx.restore(); return;
  }
  if (e.type === 'porteur') { ctx.fillStyle = 'rgba(255,224,102,.25)'; ctx.beginPath(); ctx.arc(0, 0, e.r + 9 + Math.sin(e.age * 0.2) * 2, 0, Math.PI * 2); ctx.fill(); }
  if (e.def.comportement === 'cache' && !e.cache && e.surgi < 20) ctx.scale(0.5 + e.surgi / 40, 0.5 + e.surgi / 40);
  ctx.fillStyle = e.flash ? '#fff' : e.def.couleur; ctx.strokeStyle = '#0a0f2e'; ctx.lineWidth = 2;
  forme(ctx, e.def.forme, e.r, e.rot); ctx.fill(); ctx.stroke();
  if (e.etourdi > 0) {
    ctx.fillStyle = '#ffe14d';
    for (let k = 0; k < 3; k++) { const a = e.age * 0.15 + k * 2.1; const sx = Math.cos(a) * (e.r + 4), sy = -e.r - 6 + Math.sin(a) * 4; ctx.beginPath(); for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 1.8 : 4.2; i ? ctx.lineTo(sx + Math.cos(an) * rr, sy + Math.sin(an) * rr) : ctx.moveTo(sx + Math.cos(an) * rr, sy + Math.sin(an) * rr); } ctx.closePath(); ctx.fill(); }
  }
  if (e.def.forme === 'boulet') { ctx.strokeStyle = '#3e2f1e'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = e.rot + i * 2.1; ctx.moveTo(Math.cos(a) * e.r * 0.2, Math.sin(a) * e.r * 0.2); ctx.lineTo(Math.cos(a) * e.r * 0.85, Math.sin(a) * e.r * 0.85); } ctx.stroke(); }
  if (e.pvMax > 2 && e.pv < e.pvMax) { ctx.fillStyle = '#000a'; ctx.fillRect(-e.r, e.r + 4, e.r * 2, 3); ctx.fillStyle = '#7f7'; ctx.fillRect(-e.r, e.r + 4, (e.r * 2 * e.pv) / e.pvMax, 3); }
  if (zones) { ctx.strokeStyle = '#f00'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, e.r, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
}

function copain(ctx, p) {
  const c = p.copain;
  if (!c) return;
  ctx.save(); ctx.translate(c.x, c.y);
  ctx.fillStyle = COUL.ami; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-11, -11, 22, 22, 6); ctx.fill(); ctx.stroke();
  if (c.etat === 'fuit') { // il appelle à l'aide : une bulle avec un point d'exclamation
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(14, -20, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d00'; ctx.font = '900 15px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', 14, -19);
  }
  ctx.restore();
}

// Le Scarabée géant, vu de dessus, tête vers le joueur (d'après de vrais scarabées
// rhinocéros et hercule vus de dessus) : deux élytres brillants séparés par une couture,
// un bouclier derrière la tête d'où part une grande corne recourbée, que pince une corne
// plus courte, et six pattes articulées et épineuses. Bleu métal, puis rouge vif quand il
// se fâche (phase 2). Enfoui, un gros monticule et un sillon le suivent, et le bout de sa
// corne dépasse du sable. Contour d'un seul tenant : sombre et épais d'abord, puis rempli.
function scarabeeGeant(ctx, b, p, zones) {
  const ENC = '#0a0f2e';
  if (b.cache) {
    const sens = Math.sign((b.cibleX ?? b.x) - b.x) || 1;
    // le sillon : un bourrelet de sable avec un creux sombre au milieu, derrière lui
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(184,137,79,.9)'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(-20 * sens, 4); ctx.quadraticCurveTo(-70 * sens, 10, -130 * sens, 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(107,74,43,.7)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-20 * sens, 4); ctx.quadraticCurveTo(-70 * sens, 10, -130 * sens, 2); ctx.stroke();
    // le monticule, qui bouge
    const g = Math.sin(b.age * 0.4) * 2;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(5, 8, 44, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b8894f'; ctx.beginPath(); ctx.ellipse(0, g, 42, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d6aa6c'; ctx.beginPath(); ctx.ellipse(-10, -6 + g, 22, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 1.8; for (let i = 0; i < 6; i++) { const a = i * 1.05; ctx.beginPath(); ctx.moveTo(0, g); ctx.lineTo(Math.cos(a) * 34, Math.sin(a) * 18 + g); ctx.stroke(); }
    // le bout de la corne qui dépasse, du côté où il va
    ctx.fillStyle = ENC; ctx.beginPath(); ctx.moveTo(14 * sens, 2 + g); ctx.quadraticCurveTo(34 * sens, 0 + g, 40 * sens, -14 + g); ctx.quadraticCurveTo(30 * sens, -2 + g, 14 * sens, -6 + g); ctx.closePath(); ctx.fill();
    return;
  }
  ctx.translate(0, -14); // la corne dépasse devant : le corps reste dans la zone qu'on touche
  const colere = b.phase === 2;
  const coque = b.flash ? '#ffffff' : colere ? '#d9452b' : '#2f6fb5';
  const fonce = b.flash ? '#dddddd' : colere ? '#8f2414' : '#1c3f75';
  const reflet = colere ? 'rgba(255,214,170,.75)' : 'rgba(190,230,255,.75)';
  const corne = b.flash ? '#eeeeee' : '#1c1830';
  const pas = Math.sin(b.age * 0.2);
  // six pattes : hanche, genou, bout ; les deux de devant vers l'avant
  const pattes = [];
  for (const s of [-1, 1]) {
    pattes.push([[s * 24, 30], [s * 46, 44 + pas * 3 * s], [s * 52, 70 + pas * 2 * s]]);
    pattes.push([[s * 30, 4], [s * 56, 0 - pas * 3 * s], [s * 66, 18 - pas * 2 * s]]);
    pattes.push([[s * 28, -22], [s * 52, -34 + pas * 3 * s], [s * 60, -56 + pas * 2 * s]]);
  }
  const elytres = () => { ctx.beginPath(); ctx.ellipse(0, -8, 36, 42, 0, 0, Math.PI * 2); };
  const bouclier = () => { ctx.beginPath(); ctx.moveTo(-28, 30); ctx.quadraticCurveTo(-30, 52, 0, 56); ctx.quadraticCurveTo(30, 52, 28, 30); ctx.quadraticCurveTo(0, 22, -28, 30); ctx.closePath(); };
  const grandeCorne = () => { ctx.beginPath(); ctx.moveTo(-9, 48); ctx.quadraticCurveTo(-6, 80, 0, 98); ctx.quadraticCurveTo(10, 84, 9, 48); ctx.closePath(); };
  const petiteCorne = () => { ctx.beginPath(); ctx.moveTo(-6, 58); ctx.quadraticCurveTo(-12, 72, -4, 84); ctx.quadraticCurveTo(-2, 72, 4, 58); ctx.closePath(); };
  const trait = (pts, larg, coul) => { ctx.strokeStyle = coul; ctx.lineWidth = larg; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(...pts[0]); for (const q of pts.slice(1)) ctx.lineTo(...q); ctx.stroke(); };
  // 1. contour
  for (const pt of pattes) trait(pt, 11, ENC);
  ctx.lineWidth = 6; ctx.strokeStyle = ENC; elytres(); ctx.stroke(); bouclier(); ctx.stroke(); grandeCorne(); ctx.stroke(); petiteCorne(); ctx.stroke();
  // 2. remplissage
  for (const pt of pattes) {
    trait(pt, 6, fonce);
    // les épines du tibia
    const [k, f] = [pt[1], pt[2]]; ctx.strokeStyle = ENC; ctx.lineWidth = 2;
    for (const t of [0.35, 0.65]) { const x = k[0] + (f[0] - k[0]) * t, y = k[1] + (f[1] - k[1]) * t; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sign(f[0]) * 5, y - 3); ctx.stroke(); }
  }
  ctx.fillStyle = coque; elytres(); ctx.fill();
  ctx.save(); elytres(); ctx.clip();
  ctx.fillStyle = fonce; ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.ellipse(14, 0, 22, 44, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; // l'ombre, côté opposé à la lumière
  ctx.strokeStyle = reflet; ctx.lineWidth = 4; ctx.lineCap = 'round'; // les reflets de la carapace
  ctx.beginPath(); ctx.moveTo(-22, -34); ctx.quadraticCurveTo(-26, -8, -18, 18); ctx.stroke();
  ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-10, -42); ctx.quadraticCurveTo(-13, -26, -11, -12); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = ENC; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(0, 32); ctx.stroke(); // la couture entre les élytres
  ctx.fillStyle = fonce; bouclier(); ctx.fill();
  ctx.fillStyle = reflet; ctx.beginPath(); ctx.ellipse(-12, 36, 8, 3.5, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = corne; grandeCorne(); ctx.fill(); petiteCorne(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-3, 56); ctx.quadraticCurveTo(-2, 76, 0, 90); ctx.stroke();
  // les yeux, de chaque côté de la corne : jaunes, puis rouges de colère
  ctx.fillStyle = colere ? '#ffd23f' : '#ffe14d';
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 16, 50, 3.6, 0, Math.PI * 2); ctx.fill(); }
  if (colere) { ctx.strokeStyle = ENC; ctx.lineWidth = 2.4; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 22, 44); ctx.lineTo(s * 11, 47); ctx.stroke(); } } // les sourcils froncés
  if (zones) { ctx.strokeStyle = '#f00'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 14, b.r, 0, Math.PI * 2); ctx.stroke(); }
}

// Le Grand Caméléon, vu de dessus, tête vers le joueur (d'après de vrais caméléons vus
// de dessus) : corps allongé et crête dentelée, tête en triangle, yeux en tourelle sur
// les côtés qui regardent chacun de leur côté, quatre pattes coudées aux pieds en pince,
// queue enroulée en spirale. Il change de couleur : vert, puis orange quand il se fâche
// (phase 2). Contour d'un seul tenant : tout est tracé en sombre et épais d'abord, puis
// rempli par-dessus.
const ENCRE_BOSS = '#0a0f2e';
function oeilTourelle(ctx, x, y, r, regard) {
  ctx.fillStyle = '#7ad66e'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(10,15,46,.45)'; ctx.lineWidth = 1.3;
  for (const k of [0.72, 0.46]) { ctx.beginPath(); ctx.arc(x + regard[0] * r * 0.15, y + regard[1] * r * 0.15, r * k, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = ENCRE_BOSS; ctx.beginPath(); ctx.arc(x + regard[0] * r * 0.42, y + regard[1] * r * 0.42, r * 0.26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + regard[0] * r * 0.42 - 1, y + regard[1] * r * 0.42 - 1, r * 0.09, 0, Math.PI * 2); ctx.fill();
}
function cameleon(ctx, b, p, zones) {
  const vers = (x, y) => { const a = Math.atan2(y, x); return [Math.cos(a), Math.sin(a)]; };
  if (b.cache) {
    // Fondu dans le feuillage : seuls ses yeux en tourelle dépassent ; le feuillage tremble avant qu'il ressorte
    const tremble = b.cycle > 390 ? Math.sin(p.t * 1.3) * 4 : 0;
    ctx.fillStyle = 'rgba(30,110,50,.96)';
    for (const [dx, dy, r] of [[-26, -6, 30], [24, -4, 32], [0, -24, 30], [0, 18, 28]]) { ctx.beginPath(); ctx.arc(dx + tremble, dy, r, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = ENCRE_BOSS; ctx.lineWidth = 3;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 13, 4, 8, 0, Math.PI * 2); ctx.stroke(); oeilTourelle(ctx, s * 13, 4, 8, s < 0 ? vers(p.j.x - b.x, p.j.y - b.y) : [Math.sin(b.age * 0.05), Math.cos(b.age * 0.04)]); }
    return;
  }
  // le dessin remonte de 16 px : la tête reste dans la zone qu'on touche (rayon b.r autour du centre)
  ctx.translate(0, -16);
  const colere = b.phase === 2;
  const peau = b.flash ? '#ffffff' : colere ? '#ff8a3d' : '#4fbf5a';
  const ombre = b.flash ? '#e8e8e8' : colere ? '#c4532a' : '#2f8a3e';
  const bandes = colere ? '#ffe14d' : '#ffd23f';
  const pas = Math.sin(b.age * 0.15);
  // la queue : un départ, puis une spirale qui se resserre
  const queue = [[0, -32], [2, -46]];
  for (let i = 0; i <= 26; i++) { const t = i / 26, a = Math.PI + t * Math.PI * 2.6, r = 14 - t * 11; queue.push([18 + Math.cos(a) * r, -60 + Math.sin(a) * r]); }
  // les pattes : épaule, coude, pied ; elles marchent un peu
  const pattes = [];
  for (const s of [-1, 1]) {
    pattes.push([[s * 18, 18], [s * 38, 10 + pas * 3 * s], [s * 44, 28 + pas * 2 * s]]);
    pattes.push([[s * 18, -18], [s * 38, -26 - pas * 3 * s], [s * 46, -12 - pas * 2 * s]]);
  }
  const tete = () => { ctx.beginPath(); ctx.moveTo(0, 64); ctx.quadraticCurveTo(-14, 56, -22, 40); ctx.quadraticCurveTo(-20, 26, 0, 22); ctx.quadraticCurveTo(20, 26, 22, 40); ctx.quadraticCurveTo(14, 56, 0, 64); ctx.closePath(); };
  const corps = () => { ctx.beginPath(); ctx.ellipse(0, 0, 27, 38, 0, 0, Math.PI * 2); };
  const trait = (pts, larg, coul, deg = 0) => {
    ctx.strokeStyle = coul; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < pts.length - 1; i++) { ctx.lineWidth = larg * (1 - deg * i / pts.length); ctx.beginPath(); ctx.moveTo(...pts[i]); ctx.lineTo(...pts[i + 1]); ctx.stroke(); }
  };
  // 1. le contour : tout en sombre et plus large
  trait(queue, 15, ENCRE_BOSS, 0.75);
  for (const pt of pattes) { trait(pt, 14, ENCRE_BOSS); ctx.fillStyle = ENCRE_BOSS; const [fx, fy] = pt[2]; ctx.beginPath(); ctx.arc(fx - 4, fy, 6.5, 0, Math.PI * 2); ctx.arc(fx + 4, fy, 6.5, 0, Math.PI * 2); ctx.fill(); }
  ctx.lineWidth = 6; ctx.strokeStyle = ENCRE_BOSS; corps(); ctx.stroke(); tete(); ctx.stroke();
  for (const s of [-1, 1]) { ctx.fillStyle = ENCRE_BOSS; ctx.beginPath(); ctx.arc(s * 21, 40, 13, 0, Math.PI * 2); ctx.fill(); }
  // 2. le remplissage
  trait(queue, 9, peau, 0.75);
  for (const pt of pattes) { trait(pt, 8, ombre); ctx.fillStyle = peau; const [fx, fy] = pt[2]; ctx.beginPath(); ctx.arc(fx - 4, fy, 3.6, 0, Math.PI * 2); ctx.arc(fx + 4, fy, 3.6, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = peau; corps(); ctx.fill();
  // les bandes de couleur, coupées au bord du corps
  ctx.save(); corps(); ctx.clip();
  ctx.strokeStyle = bandes; ctx.lineWidth = 6;
  for (const y of [-22, -4, 14]) { ctx.beginPath(); ctx.moveTo(-30, y + 6); ctx.quadraticCurveTo(0, y - 6, 30, y + 6); ctx.stroke(); }
  ctx.fillStyle = ombre; ctx.beginPath(); ctx.ellipse(10, 6, 16, 30, 0, 0, Math.PI * 2); ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1;
  ctx.restore();
  // la crête dentelée le long du dos
  ctx.fillStyle = ombre; ctx.beginPath(); ctx.moveTo(0, -36);
  for (let y = -36, k = 0; y <= 22; y += 6, k++) ctx.lineTo(k % 2 ? 4 : -4, y);
  ctx.lineTo(0, 22); ctx.closePath(); ctx.fill();
  ctx.fillStyle = peau; tete(); ctx.fill();
  ctx.fillStyle = ombre; ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(-7, 34); ctx.lineTo(7, 34); ctx.closePath(); ctx.fill(); // le casque
  ctx.strokeStyle = ENCRE_BOSS; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, 54); ctx.quadraticCurveTo(0, 58, 8, 54); ctx.stroke(); // la bouche
  // 3. les yeux en tourelle : l'un suit le joueur, l'autre regarde ailleurs
  const dx = p.j.x - b.x - 21, dy = p.j.y - b.y - 40;
  oeilTourelle(ctx, -21, 40, 10, vers(dx + 42, dy));
  oeilTourelle(ctx, 21, 40, 10, [Math.sin(b.age * 0.05), Math.cos(b.age * 0.037)]);
  // la langue, un éclair rose au moment où il tire
  const tir = colere ? (b.cycle % 90) - 20 : (b.age % 70);
  if (tir >= 0 && tir < 9) {
    const k = Math.sin((tir / 9) * Math.PI), [ux, uy] = vers(p.j.x - b.x, p.j.y - b.y - 64);
    ctx.strokeStyle = '#ff6fa8'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 62); ctx.lineTo(ux * 70 * k, 62 + uy * 70 * k); ctx.stroke();
    ctx.fillStyle = '#ff6fa8'; ctx.beginPath(); ctx.arc(ux * 70 * k, 62 + uy * 70 * k, 5, 0, Math.PI * 2); ctx.fill();
  }
  if (zones) { ctx.strokeStyle = '#f00'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 16, b.r, 0, Math.PI * 2); ctx.stroke(); }
}

function boss(ctx, p, zones) {
  const b = p.boss;
  if (!b) return;
  ctx.save(); ctx.translate(b.x, b.y);
  if (b.type === 'scarabeeGeant') { scarabeeGeant(ctx, b, p, zones); ctx.restore(); return; }
  if (b.type === 'cameleon') { cameleon(ctx, b, p, zones); ctx.restore(); return; }
  ctx.restore();
}

// Le rover : une caisse et quatre roues. En saut, il grandit et son ombre s'écarte.
function rover(ctx, p) {
  const j = p.j, z = j.z || 0;
  ctx.fillStyle = 'rgba(0,0,0,' + (0.32 - z * 0.12) + ')'; ctx.beginPath(); ctx.ellipse(j.x + 4 + z * 16, j.y + 8 + z * 22, 17, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(j.x, j.y); ctx.scale(1 + z * 0.35, 1 + z * 0.35);
  ctx.rotate(Math.max(-0.35, Math.min(0.35, j.vx * 0.06)));
  ctx.fillStyle = '#2a2a2a'; for (const [a, b] of [[-14, -10], [14, -10], [-14, 11], [14, 11]]) { ctx.beginPath(); ctx.roundRect(a - 5, b - 7, 10, 14, 3); ctx.fill(); }
  ctx.fillStyle = p.etoile > 0 ? 'hsl(' + ((p.t * 12) % 360) + ',90%,65%)' : p.planete.couleur; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-11, -16, 22, 32, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5a3d1c'; ctx.beginPath(); ctx.roundRect(-7, -12, 14, 9, 3); ctx.fill(); // le pare-brise
  ctx.fillStyle = '#fff6d6'; ctx.beginPath(); ctx.arc(-6, -16, 2.4, 0, Math.PI * 2); ctx.arc(6, -16, 2.4, 0, Math.PI * 2); ctx.fill(); // les phares
  if (p.bouclier) { ctx.strokeStyle = '#8ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.stroke(); }
  if (p.aimant > 0) { ctx.strokeStyle = 'rgba(135,243,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.stroke(); }
  if (p.arme) { const A = ARMES[p.arme.k]; ctx.fillStyle = '#0008'; ctx.fillRect(-16, 22, 32, 4); ctx.fillStyle = A.couleur; ctx.fillRect(-16, 22, (32 * p.arme.mun) / A.mun, 4); }
  ctx.restore();
  if (p.compagnons > 0) for (let k = 0; k < 2; k++) {
    const a = p.t * 0.08 + k * Math.PI;
    ctx.save(); ctx.translate(j.x + Math.cos(a) * 30, j.y + Math.sin(a) * 30); ctx.rotate(p.t * 0.4);
    ctx.fillStyle = '#ffb3f0'; ctx.fillRect(-6, -6, 12, 12); ctx.restore();
  }
}

function joueur(ctx, p, zones) {
  const j = p.j;
  if (j.inv > 0 && Math.floor(j.inv / 5) % 2) return;
  if (p.robot) { // le robot de combat : plus gros, il encaisse
    ctx.save(); ctx.translate(j.x, j.y);
    ctx.fillStyle = '#e33'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.fillRect(-20, -20, 40, 34); ctx.strokeRect(-20, -20, 40, 34);
    ctx.fillStyle = '#36f'; ctx.fillRect(-18, 14, 14, 10); ctx.fillRect(4, 14, 14, 10);
    ctx.fillStyle = '#fd2'; for (const x of [-12, 0, 12]) { ctx.beginPath(); ctx.arc(x, -24, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    return;
  }
  // Au plafond, un trait pointillé s'allume au-dessus du module : on voit qu'on ne monte pas plus haut
  const plafond = p.M.zone[0];
  if (j.y < plafond + 8) {
    ctx.save(); ctx.globalAlpha = 0.55 * (1 - (j.y - plafond) / 8); ctx.strokeStyle = '#fff6d6'; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(Math.max(0, j.x - 70), plafond - 26); ctx.lineTo(Math.min(W, j.x + 70), plafond - 26); ctx.stroke(); ctx.restore();
  }
  if (p.module === 'rover') { rover(ctx, p); return; }
  if (p.module === 'avion') { ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(j.x + 11, j.y + 18, 14, 8, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.save(); ctx.translate(j.x, j.y);
  ctx.rotate(Math.max(-0.4, Math.min(0.4, j.vx * 0.05)));
  ctx.fillStyle = p.etoile > 0 ? `hsl(${(p.t * 12) % 360},90%,65%)` : p.planete.couleur;
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(16, 12); ctx.lineTo(0, 6); ctx.lineTo(-16, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (p.bouclier) { ctx.strokeStyle = '#8ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.stroke(); }
  if (p.aimant > 0) { ctx.strokeStyle = 'rgba(135,243,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.stroke(); }
  if (zones) {
    ctx.fillStyle = '#f00'; ctx.beginPath(); ctx.arc(0, 0, ZT, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COUL.bleu; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, ZB, 0, Math.PI * 2); ctx.stroke();
  }
  if (p.arme) { const A = ARMES[p.arme.k]; ctx.fillStyle = '#0008'; ctx.fillRect(-16, 22, 32, 4); ctx.fillStyle = A.couleur; ctx.fillRect(-16, 22, (32 * p.arme.mun) / A.mun, 4); }
  ctx.restore();
  if (p.compagnons > 0) for (let k = 0; k < 2; k++) {
    const a = p.t * 0.08 + k * Math.PI;
    ctx.save(); ctx.translate(j.x + Math.cos(a) * 30, j.y + Math.sin(a) * 30); ctx.rotate(p.t * 0.4);
    ctx.fillStyle = '#ffb3f0'; ctx.fillRect(-6, -6, 12, 12); ctx.restore();
  }
}


// ---------- Désert : le sol du rover ----------
// Sable mou : plus clair que le décor, ridé et bordé de pointillés, pour ne pas le
// confondre avec le sable ordinaire. Tremplin : planche et chevrons. Rocher : contour
// sombre, il se lit comme un obstacle.
function solDuDesert(ctx, p) {
  for (const t of p.terrain) {
    if (t.k === 'sable') {
      const cy = t.y + t.h / 2;
      ctx.fillStyle = 'rgba(250,228,180,.55)'; ctx.beginPath(); ctx.ellipse(t.x, cy, t.w / 2, t.h / 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(160,120,70,.45)'; ctx.lineWidth = 1.4;
      for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(t.x, cy + k * 12, t.w / 2 - 18, 5, 0, 0.15, Math.PI - 0.15); ctx.stroke(); }
      ctx.save(); ctx.setLineDash([3, 6]); ctx.strokeStyle = 'rgba(130,95,55,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(t.x, cy, t.w / 2, t.h / 2, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    } else if (t.k === 'tremplin') {
      ctx.save(); ctx.translate(t.x, t.y);
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(-t.w / 2 + 5, -t.h / 2 + 7, t.w, t.h);
      ctx.fillStyle = '#b07a3f'; ctx.fillRect(-t.w / 2, -t.h / 2, t.w, t.h);
      ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 2; ctx.strokeRect(-t.w / 2, -t.h / 2, t.w, t.h);
      ctx.strokeStyle = '#fff3c4'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(k * 18 - 7, 6); ctx.lineTo(k * 18, -5); ctx.lineTo(k * 18 + 7, 6); ctx.stroke(); }
      ctx.restore();
    }
  }
  for (const f of p.effets) if (f.poussiere) { ctx.fillStyle = `rgba(235,205,150,${(f.vie / 50) * 0.55})`; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill(); }
}
const LOBES = [[0, 0], [0.18, -0.12], [-0.15, 0.1], [0.1, 0.16]];
function rochers(ctx, p) {
  for (const t of p.terrain) {
    if (t.k !== 'rocher') continue;
    const [ox, oy] = LOBES[t.forme ?? 0];
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(t.x + 6, t.y + 8, t.r, t.r * 0.82, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a7458'; ctx.strokeStyle = '#3e2f1e'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.ellipse(t.x, t.y, t.r, t.r * 0.9, ox, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a89070'; ctx.beginPath(); ctx.ellipse(t.x - t.r * 0.25 + ox * 8, t.y - t.r * 0.25 + oy * 8, t.r * 0.5, t.r * 0.38, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(62,47,30,.6)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(t.x + t.r * 0.1, t.y - t.r * 0.2); ctx.lineTo(t.x + t.r * 0.35, t.y + t.r * 0.15); ctx.lineTo(t.x + t.r * 0.2, t.y + t.r * 0.45); ctx.stroke();
  }
}
// Un monticule qui grossit : l'annonce d'une taupe ou d'un scarabée des sables
function monticule(ctx, e) {
  const att = e.def.attente ?? 80, k = Math.min(1, e.age / att), tremble = k > 0.7 ? Math.sin(e.age * 1.4) * 2 : 0;
  const r = 8 + k * (e.type === 'taupe' ? 14 : 9);
  ctx.save(); ctx.translate(e.x + tremble, e.y);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(3, 4, r, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b8894f'; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d6aa6c'; ctx.beginPath(); ctx.ellipse(-r * 0.25, -r * 0.2, r * 0.5, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 1.6; // les fissures, de plus en plus nombreuses
  for (let i = 0; i < Math.floor(k * 5); i++) { const a = i * 1.3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.55); ctx.stroke(); }
  ctx.restore();
}

function tirsJoueur(ctx, p) {
  for (const b of p.tirsJ) {
    if (b.forme === 'trait') { ctx.fillStyle = '#ffe14d'; ctx.fillRect(b.x - 2, b.y - 16, 4, 32); }
    else if (b.forme === 'goutte') { ctx.fillStyle = '#6fd3ff'; ctx.beginPath(); ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2); ctx.fill(); }
    else if (b.forme === 'torpille') { ctx.fillStyle = '#e8f6ff'; ctx.beginPath(); ctx.ellipse(b.x, b.y, 3.5, 8, 0, 0, Math.PI * 2); ctx.fill(); }
    else if (b.forme === 'fleche') { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.vy, b.vx) + Math.PI / 2); ctx.fillStyle = '#c6ff6f'; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(5, 6); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill(); ctx.restore(); }
    else if (b.forme === 'bulle') { ctx.strokeStyle = '#9fe8ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke(); }
    else if (b.forme === 'rond') { ctx.fillStyle = '#ff9de2'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.fillStyle = '#fff3a0'; ctx.fillRect(b.x - 2, b.y - 7, 4, 14); }
  }
}

function tirsEnnemis(ctx, p) {
  for (const b of p.tirsE) {
    ctx.save(); ctx.translate(b.x, b.y);
    if (b.bleu) {
      ctx.fillStyle = 'rgba(79,214,255,.3)'; ctx.beginPath(); ctx.arc(0, 0, b.r + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = COUL.bleu; ctx.strokeStyle = '#04304a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-1.6, -1.6, 1.8, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(255,59,92,.45)'; ctx.beginPath(); ctx.arc(0, 0, b.r + 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = COUL.rouge; ctx.strokeStyle = '#3a0010'; ctx.lineWidth = 1; ctx.beginPath();
      for (let i = 0; i < 12; i++) { const a = p.t * 0.1 + (i * Math.PI) / 6, rr = i % 2 ? b.r * 0.6 : b.r + 2; i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
}

function effets(ctx, p) {
  for (const f of p.effets) {
    if (f.onde !== undefined) { ctx.strokeStyle = `rgba(160,255,140,${1 - f.onde / 800})`; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(p.j.x, p.j.y, f.onde, 0, Math.PI * 2); ctx.stroke(); }
    else if (f.astronaute) { ctx.globalAlpha = f.vie / 70; ctx.fillStyle = f.dore ? '#ffd700' : COUL.ami; ctx.beginPath(); ctx.arc(f.x, f.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
    else if (f.zone) { ctx.strokeStyle = `rgba(159,232,255,${f.vie / 16})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.2 - f.vie / 40), 0, Math.PI * 2); ctx.stroke(); }
    else if (f.poussiere) continue; // la poussière se dessine avec le sol
    else if (f.atterrit) { ctx.strokeStyle = 'rgba(240,210,150,' + (f.vie / 24) + ')'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(f.x, f.y + 8, 90 * (1 - f.vie / 24) + 10, (90 * (1 - f.vie / 24) + 10) * 0.6, 0, 0, Math.PI * 2); ctx.stroke(); }
    else { ctx.globalAlpha = f.vie / 30; ctx.fillStyle = f.couleur; ctx.fillRect(f.x - 2, f.y - 2, 4, 4); ctx.globalAlpha = 1; }
  }
}

/**
 * Dessine toute la mission dans un repère 360 × 640.
 * @param {CanvasRenderingContext2D} ctx @param {any} p @param {{ zones?: boolean }} [opt]
 */
export function dessinerPartie(ctx, p, opt = {}) {
  ctx.save();
  if (p.secousse > 0) ctx.translate(Math.sin(p.t * 7) * 2 * (p.secousse / 6), Math.cos(p.t * 9) * 2 * (p.secousse / 6));
  if (p.M.bas) { ctx.translate(0, H); ctx.scale(1, -1); }
  fond(ctx, p);
  solDuDesert(ctx, p);
  for (const e of p.ennemis) if (e.cache) ennemi(ctx, e, p, opt.zones);
  feuillage(ctx, p);
  rochers(ctx, p);
  for (const o of p.objets) {
    ctx.save(); ctx.translate(o.x, o.y);
    if (o.k === 'caisse') { ctx.fillStyle = '#b07a3f'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.fillRect(-14, -14, 28, 28); ctx.strokeRect(-14, -14, 28, 28); ctx.beginPath(); ctx.moveTo(-14, -14); ctx.lineTo(14, 14); ctx.moveTo(14, -14); ctx.lineTo(-14, 14); ctx.stroke(); }
    else if (o.k === 'cristalHaut') {
      const lev = 10 + o.h * 14;
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(0, 0, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(135,243,255,.35)'; ctx.beginPath(); ctx.arc(0, -lev, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = COUL.cristal; ctx.strokeStyle = '#0d4a63'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, -lev - 7); ctx.lineTo(6, -lev); ctx.lineTo(0, -lev + 7); ctx.lineTo(-6, -lev); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    else if (o.k === 'cristal') { ctx.fillStyle = COUL.cristal; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(5, 0); ctx.lineTo(0, 6); ctx.lineTo(-5, 0); ctx.closePath(); ctx.fill(); }
    else icone(ctx, o);
    ctx.restore();
  }
  for (const e of p.ennemis) if (!e.cache) ennemi(ctx, e, p, opt.zones);
  boss(ctx, p, opt.zones);
  copain(ctx, p);
  tirsJoueur(ctx, p);
  joueur(ctx, p, opt.zones);
  tirsEnnemis(ctx, p);
  effets(ctx, p);
  ctx.restore();
}
