// Ghost Train : la partie à l'écran. Lit la partie sans jamais la modifier ; ce qui
// n'existe qu'à l'écran (étincelles, pièces qui volent, textes, bave, secousse) vit
// dans la « vue », nourrie par les événements du moteur.
import { W, H, CANON } from '../moteur/constantes.js';
import { boite } from '../moteur/fantomes.js';
import { etatSalle } from '../moteur/partie.js';
import { PASSAGE } from '../moteur/constantes.js';
import { ESPECES } from '../contenu/especes.js';
import { SALLES } from '../contenu/salles.js';
import { S, BLANC, coeur, preparer } from './dessins.js';
import { ecrire } from './police.js';
import { R, ovale, NOIR } from './peinture.js';
import { SALON } from './salon.js';
import { MANGER } from './manger.js';
import { CUISINE } from './cuisine.js';

const DESSINS = { salon: SALON, manger: MANGER, cuisine: CUISINE };
/** @type {Record<string, HTMLCanvasElement>} */
const FONDS = {};
/** Les salles se peignent une fois (lumière comprise) : mieux vaut le faire avant de jouer. */
export function peindreSalles(ids = Object.keys(DESSINS)) { preparer(); for (const id of ids) if (!FONDS[id]) FONDS[id] = DESSINS[id].peindre(); }

/** @param {any} reglages */
export function creeVue(reglages) {
  return { reglages, tactile: false, parts: [], textes: [], baves: [], secousse: 0, suivante: null, t: 0 };
}

/** Un événement du moteur devient quelque chose à voir. @param {any} v @param {any} ev */
export function recevoir(v, ev) {
  const doux = v.reglages.flashsReduits;
  switch (ev.type) {
    case 'texte': v.textes.push({ s: ev.s, x: ev.x, y: ev.y, col: ev.col, sc: ev.sc, t: 0, vie: ev.sc ? 1.6 : 1.1 }); break;
    case 'pieces':
      for (let k = 0; k < Math.min(12, ev.n + 2); k++) v.parts.push({ x: ev.x, y: ev.y, vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 80, t: 0, vie: 1.1, piece: k < ev.n });
      if (ev.eclats) for (let k = 0; k < 6; k++) v.parts.push({ x: ev.x, y: ev.y, vx: (Math.random() - 0.5) * 140, vy: -40 - Math.random() * 90, t: 0, vie: 0.9, col: ev.eclats });
      v.textes.push({ s: '+' + ev.n, x: ev.x, y: ev.y - 14, col: '#fff27a', t: 0, vie: 0.9 });
      break;
    case 'eclats': for (let k = 0; k < ev.n; k++) v.parts.push({ x: ev.x + (Math.random() - 0.5) * 30, y: ev.y, vx: (Math.random() - 0.5) * 220, vy: -30 - Math.random() * 120, t: 0, vie: 1, col: k & 1 ? ev.col : '#fff2a0' }); break;
    case 'bave': v.baves.push({ x: ev.x, y: ev.y, r: ev.r, t: 0, gouttes: [0, 1, 2, 3].map(() => ({ dx: (Math.random() - 0.5) * 30, v: 10 + Math.random() * 14 })) }); v.secousse = doux ? 0 : 0.3; break;
    case 'secousse': v.secousse = doux ? 0 : ev.f; break;
  }
}

/** @param {any} v @param {number} dt */
export function avancerVue(v, dt) {
  v.t += dt;
  for (const q of v.parts) { q.t += dt; if (q.piece && q.t > 0.35) { q.x += (300 - q.x) * 0.16; q.y += (9 - q.y) * 0.16; } else { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 160 * dt; } }
  v.parts = v.parts.filter((q) => q.t < q.vie);
  for (const t of v.textes) t.t += dt;
  v.textes = v.textes.filter((t) => t.t < t.vie);
  for (const b of v.baves) b.t += dt;
  v.baves = v.baves.filter((b) => b.t < 3.5);
  v.secousse = Math.max(0, v.secousse - dt);
}

/** Le dessin d'une entité à cet instant. @param {any} p @param {any} e */
function sprite(p, e) {
  if (e.type === 'goule') return p.tenu === e ? S.gouleTenue : (((e.t * 5) | 0) & 1 ? S.goule1 : S.goule0);
  return S[e.type];
}
const blanc = (e) => BLANC[e.type === 'goule' ? 'gouleTenue' : e.type];

/** @param {CanvasRenderingContext2D} ctx @param {any} p @param {any} v */
export function dessinerPartie(ctx, p, v) {
  ctx.fillStyle = NOIR; ctx.fillRect(0, 0, W, H);
  if (p.etat === 'passage') { passage(ctx, p, v); hud(ctx, p, v); return; }
  peindreSalles([p.salle]);
  const sx = v.secousse > 0 ? Math.round((Math.random() - 0.5) * 6 * v.secousse / 0.3) : 0, sy = v.secousse > 0 ? Math.round((Math.random() - 0.5) * 4) : 0;
  ctx.save(); ctx.translate(sx, sy);
  ctx.drawImage(FONDS[p.salle], 0, 0);
  DESSINS[p.salle].animer(ctx, p.s, p.t);
  alertes(ctx, p);
  bouchons(ctx, p);
  for (const e of [...p.ents].sort((a, b) => a.s - b.s)) entite(ctx, p, e);
  ctx.restore();
  rayonDessin(ctx, p);
  for (const q of v.parts) {
    if (q.piece) ctx.drawImage(S.piece, Math.round(q.x - 4), Math.round(q.y - 4));
    else R(ctx, q.col || '#fff6c8', q.x, q.y, 2, 2);
  }
  baves(ctx, v);
  hud(ctx, p, v);
}

// une cachette qui va s'ouvrir : un halo et un « ! » qui rebondit au-dessus
function alertes(ctx, p) {
  const C = SALLES[p.salle].cachettes;
  for (const [k, a] of Object.entries(p.s.alerte)) {
    if (a <= 0) continue;
    const c = C[k], r = 14 + (1 - Math.min(1, a / 0.8)) * 8;
    ctx.globalAlpha = 0.5 + 0.4 * Math.sin(p.t * 20);
    ctx.strokeStyle = '#fff27a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    ecrire(ctx, '!', c.x, c.y - r - 14 - Math.abs(Math.sin(p.t * 9)) * 4, { centre: true, sc: 2, coul: '#fff27a', contour: NOIR });
  }
}

// le bouchon de champagne qui file vers sa cible
function bouchons(ctx, p) {
  for (const o of Object.values(p.s.objets)) {
    if (!o.vol || o.fini) continue;
    const c = o.vol.cible, k = o.vol.k, tx = c ? c.x : o.vol.x0, ty = c ? c.y : o.vol.y0 - 40;
    const x = o.vol.x0 + (tx - o.vol.x0) * k, y = o.vol.y0 + (ty - o.vol.y0) * k - Math.sin(k * Math.PI) * 20;
    R(ctx, NOIR, x - 3, y - 3, 6, 6); R(ctx, '#c8a060', x - 2, y - 2, 4, 4); R(ctx, '#f0d090', x - 2, y - 2, 2, 1);
  }
}

function entite(ctx, p, e) {
  const sp = sprite(p, e), b = boite(e);
  if (e.etat === 'cap') {
    const k = e.tc / 0.45, x = e.x + (CANON.x - e.x) * k * k, y = e.y + (CANON.y - e.y) * k * k, s = e.s * (1 - k * 0.8);
    ctx.globalAlpha = 1 - k * 0.5;
    ctx.drawImage(((e.tc * 20) | 0) & 1 ? blanc(e) || sp : sp, Math.round(x - sp.width * s / 2), Math.round(y - sp.height * s / 2), Math.round(sp.width * s), Math.round(sp.height * s));
    ctx.globalAlpha = 1; return;
  }
  // une ombre au sol sous ceux qui flottent : elle dit où ils sont dans la pièce
  if (!e.tir && e.type !== 'chat') { ctx.globalAlpha = 0.35; ovale(ctx, e.x, Math.min(176, 118 + (e.s - 0.5) * 30), b.w * 0.3, 2 + e.s, NOIR); ctx.globalAlpha = 1; }
  ctx.globalAlpha = e.etat === 'sort' ? 0.6 : 1;
  const tenu = p.tenu === e && p.tire, tr = tenu ? (((p.t * 30) | 0) & 1 ? 1 : -1) : 0;
  ctx.drawImage(tenu && ((p.t * 16) | 0) % 3 === 0 && blanc(e) ? blanc(e) : sp, Math.round(b.x + tr), Math.round(b.y), Math.round(b.w), Math.round(b.h));
  ctx.globalAlpha = 1;
  // la vie d'un fantôme qu'on aspire
  if (e.hostile && !e.tir && !e.boss && e.pv < e.pv0) {
    const bw = Math.max(12, Math.round(b.w * 0.6)), bx = Math.round(e.x - bw / 2), by = Math.round(b.y - 5);
    R(ctx, NOIR, bx - 1, by - 1, bw + 2, 4); R(ctx, '#6ee03a', bx, by, Math.round(bw * e.pv / e.pv0), 2);
  }
  // un tir qui arrive se signale par un anneau rouge et blanc
  if (e.tir && e.k > 0.5) { ctx.strokeStyle = (((p.t * 10) | 0) & 1) ? '#ff3030' : '#ffffff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(e.x, e.y, b.w * 0.7, 0, Math.PI * 2); ctx.stroke(); }
}

function rayonDessin(ctx, p) {
  if (!p.tire) return;
  const { x: x0, y: y0 } = CANON, x1 = p.visee.x, y1 = p.visee.y, n = 9;
  const pts = [[x0, y0]];
  for (let k = 1; k < n; k++) { const f = k / n; pts.push([x0 + (x1 - x0) * f + (Math.random() - 0.5) * 8, y0 + (y1 - y0) * f + (Math.random() - 0.5) * 8]); }
  pts.push([x1, y1]);
  for (const [col, l, dx] of /** @type {[string, number, number][]} */ ([['#ff3fa4', 3, -2], ['#3fe8ff', 3, 2], ['#ffffff', 2, 0]])) {
    ctx.strokeStyle = col; ctx.lineWidth = l; ctx.beginPath(); ctx.moveTo(pts[0][0] + dx, pts[0][1]);
    for (const [x, y] of pts) ctx.lineTo(x + dx, y);
    ctx.stroke();
  }
  ovale(ctx, x1, y1, 4, 4, '#ffffff');
}

function viseur(ctx, p, v) {
  const x = Math.round(p.visee.x), y = Math.round(p.visee.y);
  const col = p.surchauffe ? '#ff5a3a' : p.tenu ? (p.tenu.type === 'chat' ? '#ff8aa0' : '#ff3030') : '#ffffff';
  ctx.globalAlpha = v.tactile && !p.tire ? 0.5 : 1;
  const seg = (c, o) => { R(ctx, c, x - 8 - o, y - o, 5 + 2 * o, 1 + 2 * o); R(ctx, c, x + 4 - o, y - o, 5 + 2 * o, 1 + 2 * o); R(ctx, c, x - o, y - 8 - o, 1 + 2 * o, 5 + 2 * o); R(ctx, c, x - o, y + 4 - o, 1 + 2 * o, 5 + 2 * o); };
  seg(NOIR, 1); seg(col, 0);
  ctx.globalAlpha = 1;
}

function baves(ctx, v) {
  for (const b of v.baves) {
    const a = b.t < 2.5 ? 1 : 1 - (b.t - 2.5); ctx.globalAlpha = Math.max(0, a) * 0.92;
    ovale(ctx, b.x, b.y, b.r + 1, b.r * 0.8 + 1, '#2c9a2a'); ovale(ctx, b.x, b.y, b.r, b.r * 0.8, '#6ee03a'); ovale(ctx, b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.35, b.r * 0.25, '#c8ff5a');
    for (const g of b.gouttes) { const l = Math.min(40, b.t * g.v); R(ctx, '#6ee03a', b.x + g.dx * 0.5, b.y, 3, l); ovale(ctx, b.x + g.dx * 0.5 + 1, b.y + l, 2.5, 3, '#6ee03a'); }
    ctx.globalAlpha = 1;
  }
}

function hud(ctx, p, v) {
  for (let k = 0; k < 5; k++) coeur(ctx, 4 + k * 11, 4, k < p.coeurs);
  ctx.drawImage(S.piece, 257, 5);
  ecrire(ctx, String(p.pieces).padStart(4, '0'), 296, 5, { droite: true, coul: '#fff27a', contour: NOIR, gras: true });
  // la pause, en haut à droite
  R(ctx, NOIR, 300, 2, 18, 18); R(ctx, '#ffffff', 301, 3, 16, 16); R(ctx, NOIR, 305, 6, 3, 10); R(ctx, NOIR, 310, 6, 3, 10);
  // la chauffe, toute petite, là d'où part le rayon
  const c = p.chauffe, clig = c > 0.75 && ((p.t * 6) | 0) & 1;
  R(ctx, NOIR, 135, 171, 50, 7); R(ctx, clig || p.surchauffe ? '#ff3030' : '#4a3a5a', 136, 172, 48, 5);
  R(ctx, c > 0.75 ? '#ff5a3a' : c > 0.5 ? '#ffd23a' : '#6ee03a', 137, 173, Math.round(46 * c), 3);
  if (p.boss && !p.boss.mort && p.boss.etat !== 'cap') {
    const bw = 120, bx = 100;
    ecrire(ctx, ESPECES[p.boss.type].nom, 160, 4, { centre: true, coul: '#ffffff', contour: NOIR });
    R(ctx, NOIR, bx - 1, 13, bw + 2, 6); R(ctx, '#b46cff', bx, 14, Math.round(bw * Math.max(0, p.boss.pv) / p.boss.pv0), 4);
  }
  if (p.etat === 'jeu' && p.titre > 0) {
    const a = Math.min(1, p.titre * 2);
    ecrire(ctx, SALLES[p.salle].nom, 160, 40, { centre: true, sc: 2, coul: '#ffffff', contour: NOIR, alpha: a });
    ecrire(ctx, `SALLE ${p.n + 1} SUR ${p.mission.salles.length}`, 160, 60, { centre: true, coul: '#c8b8e0', contour: NOIR, alpha: a });
  } else if (p.etat === 'jeu' && p.consigne) {
    const t = p.consigne.texte.replace('{GARDE}', v.tactile ? 'GARDE LE DOIGT' : 'GARDE LE CLIC');
    ecrire(ctx, t, 160, p.boss ? 24 : 22, { centre: true, coul: '#fff27a', contour: NOIR, gras: true });
  }
  for (const t of v.textes) ecrire(ctx, t.s, t.x, t.y - t.t * 14, { centre: true, sc: t.sc || 1, coul: t.col, contour: NOIR, gras: !t.sc, alpha: Math.min(1, (t.vie - t.t) * 3) });
  if (p.etat === 'jeu') viseur(ctx, p, v);
}

// d'une salle à la suivante : un panoramique vers la droite, par l'embrasure d'une porte
function passage(ctx, p, v) {
  const suite = p.mission.salles[p.n + 1];
  peindreSalles([p.salle, suite]);
  if (!v.suivante || v.suivante.id !== suite) v.suivante = { id: suite, s: etatSalle(suite) };
  const k = Math.min(1, p.tPassage / PASSAGE), e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2, dx = Math.round(e * (W + 16));
  ctx.save(); ctx.translate(-dx, 0); ctx.drawImage(FONDS[p.salle], 0, 0); DESSINS[p.salle].animer(ctx, p.s, p.t); ctx.restore();
  R(ctx, '#3a1e12', W - dx, 0, 16, H); R(ctx, NOIR, W - dx + 7, 0, 2, H);
  ctx.save(); ctx.translate(W + 16 - dx, 0); ctx.drawImage(FONDS[suite], 0, 0); DESSINS[suite].animer(ctx, v.suivante.s, p.t); ctx.restore();
}
