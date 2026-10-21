// Dessin d'une mission en FORMES SIMPLES (aucun graphisme définitif : la direction B
// viendra après). Ne modifie jamais la partie : il lit seulement son état.
import { W, H, DEFIL, ZT, ZB } from '../moteur/constantes.js';
import { ARMES } from '../moteur/tirs.js';

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
    ctx.fillStyle = 'rgba(30,110,50,.95)';
    for (const [dx, dy, s] of t.bouts) { ctx.beginPath(); ctx.arc(t.x + dx * t.r + tremble, t.y + dy * t.r, t.r * s, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(80,170,90,.6)';
    for (const [dx, dy, s] of t.bouts) { ctx.beginPath(); ctx.arc(t.x + dx * t.r - 4 + tremble, t.y + dy * t.r - 4, t.r * s * 0.6, 0, Math.PI * 2); ctx.fill(); }
  }
}

function ennemi(ctx, e, p, zones) {
  ctx.save(); ctx.translate(e.x, e.y);
  if (e.def.taille === 'cage') {
    ctx.fillStyle = COUL.ami; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = e.flash ? '#fff' : e.def.couleur; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, e.r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); for (let x = -8; x <= 8; x += 8) { ctx.moveTo(x, -e.r + 2); ctx.lineTo(x, e.r - 2); } ctx.stroke();
    ctx.restore(); return;
  }
  if (e.type === 'porteur') { ctx.fillStyle = 'rgba(255,224,102,.25)'; ctx.beginPath(); ctx.arc(0, 0, e.r + 9 + Math.sin(e.age * 0.2) * 2, 0, Math.PI * 2); ctx.fill(); }
  if (e.def.comportement === 'cache' && !e.cache && e.surgi < 20) ctx.scale(0.5 + e.surgi / 40, 0.5 + e.surgi / 40);
  ctx.fillStyle = e.flash ? '#fff' : e.def.couleur; ctx.strokeStyle = '#0a0f2e'; ctx.lineWidth = 2;
  forme(ctx, e.def.forme, e.r, e.rot); ctx.fill(); ctx.stroke();
  if (e.def.pv > 2 && e.pv < e.def.pv) { ctx.fillStyle = '#000a'; ctx.fillRect(-e.r, e.r + 4, e.r * 2, 3); ctx.fillStyle = '#7f7'; ctx.fillRect(-e.r, e.r + 4, (e.r * 2 * e.pv) / e.def.pv, 3); }
  if (zones) { ctx.strokeStyle = '#f00'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, e.r, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
}

function joueur(ctx, p, zones) {
  const j = p.j;
  if (j.inv > 0 && Math.floor(j.inv / 5) % 2) return;
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
  for (const e of p.ennemis) if (e.cache) ennemi(ctx, e, p, opt.zones);
  feuillage(ctx, p);
  for (const o of p.objets) {
    ctx.save(); ctx.translate(o.x, o.y);
    if (o.k === 'cristal') { ctx.fillStyle = COUL.cristal; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(5, 0); ctx.lineTo(0, 6); ctx.lineTo(-5, 0); ctx.closePath(); ctx.fill(); }
    else icone(ctx, o);
    ctx.restore();
  }
  for (const e of p.ennemis) if (!e.cache) ennemi(ctx, e, p, opt.zones);
  tirsJoueur(ctx, p);
  joueur(ctx, p, opt.zones);
  tirsEnnemis(ctx, p);
  effets(ctx, p);
  ctx.restore();
}
