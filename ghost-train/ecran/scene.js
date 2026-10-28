// Ghost Train : la partie à l'écran. Lit la partie sans jamais la modifier ; ce qui
// n'existe qu'à l'écran (étincelles, pièces qui volent, textes, bave, secousse) vit
// dans la « vue », nourrie par les événements du moteur.
import { W, H, CANON, FLASH } from '../moteur/constantes.js';
import { boite } from '../moteur/fantomes.js';
import { protege } from '../moteur/rayon.js';
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
import { FUMOIR, BIBLIOTHEQUE, ARCHIVES } from './etage1.js';
import { VESTIAIRE, BAL, KIOSQUE } from './etage2.js';
import { CHAMBRE, LINGERIE, COMBLES } from './etage3.js';

export const DESSINS = { salon: SALON, manger: MANGER, cuisine: CUISINE, fumoir: FUMOIR, bibliotheque: BIBLIOTHEQUE, archives: ARCHIVES, vestiaire: VESTIAIRE, bal: BAL, kiosque: KIOSQUE, chambre: CHAMBRE, lingerie: LINGERIE, combles: COMBLES };
/** @type {Record<string, HTMLCanvasElement>} */
export const FONDS = {};
/** Les salles se peignent une fois (lumière comprise) : mieux vaut le faire avant de jouer. */
export function peindreSalles(ids = Object.keys(DESSINS)) { preparer(); for (const id of ids) if (!FONDS[id]) FONDS[id] = DESSINS[id].peindre(); }

/** @param {any} reglages */
export function creeVue(reglages) {
  return { reglages, tactile: false, parts: [], textes: [], baves: [], flashs: [], onde: 0, secousse: 0, suivante: null, t: 0 };
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
    case 'flash': v.flashs.push({ x: ev.x, y: ev.y, t: 0 }); break;
    case 'super': v.onde = 0.001; break;
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
  for (const f of v.flashs) f.t += dt;
  v.flashs = v.flashs.filter((f) => f.t < 0.3);
  if (v.onde > 0) { v.onde += dt; if (v.onde > 1.6) v.onde = 0; }
}

/** Le dessin d'une entité à cet instant. @param {any} p @param {any} e */
function sprite(p, e) {
  if (e.type === 'ecto') return p.tenu === e ? S.ectoTenue : (((e.t * 5) | 0) & 1 ? S.ecto1 : S.ecto0);
  if (e.type === 'lumi') return e.fuite ? S.lumiTriste : (((e.t * 4) | 0) & 1 ? S.lumi1 : S.lumi0);
  if (e.type === 'garde' || e.type === 'tirLivre') return S.livre;
  return S[e.type];
}
const blanc = (e) => BLANC[e.type === 'ecto' ? 'ectoTenue' : e.type];

/** @param {CanvasRenderingContext2D} ctx @param {any} p @param {any} v */
export function dessinerPartie(ctx, p, v) {
  ctx.fillStyle = NOIR; ctx.fillRect(0, 0, W, H);
  if (p.etat === 'passage') { passage(ctx, p, v); hud(ctx, p, v); return; }
  peindreSalles([p.salle]);
  const sx = v.secousse > 0 ? Math.round((Math.random() - 0.5) * 6 * v.secousse / 0.3) : 0, sy = v.secousse > 0 ? Math.round((Math.random() - 0.5) * 4) : 0;
  ctx.save(); ctx.translate(sx, sy);
  ctx.drawImage(FONDS[p.salle], 0, 0);
  DESSINS[p.salle].animer(ctx, p.s, p.t, p);
  alertes(ctx, p);
  bouchons(ctx, p);
  for (const e of [...p.ents].sort((a, b) => a.s - b.s)) entite(ctx, p, e);
  ctx.restore();
  rayonDessin(ctx, p);
  // le flash : un éclat blanc autour du viseur (moins fort avec les flashs réduits)
  for (const f of v.flashs) {
    const k = f.t / 0.3; ctx.globalAlpha = (1 - k) * (v.reglages.flashsReduits ? 0.3 : 0.75); ctx.fillStyle = '#fffbe0';
    ctx.beginPath(); ctx.arc(f.x, f.y, FLASH.portee * (0.6 + k * 0.6), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // la super-attaque : des anneaux rose, cyan et blanc qui partent du centre
  if (v.onde > 0) {
    const Rr = v.onde * 260, a = Math.max(0, Math.min(1, 1 - v.onde / 1.6));
    for (const [dr, c] of /** @type {[number, string][]} */ ([[0, '#ffffff'], [-14, '#ff3fa4'], [-28, '#3fe8ff']])) {
      if (Rr + dr <= 0) continue;
      ctx.globalAlpha = a; ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(160, 82, Rr + dr, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
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
  const tenu = p.tenu === e && p.tire, tr = tenu ? (((p.t * 30) | 0) & 1 ? 1 : -1) : 0;
  // le bouclier de la Gouvernante : un halo rouge qui palpite autour d'elle
  if (e.type === 'gouvernante' && e.bouclier) {
    ctx.globalAlpha = 0.45 + 0.3 * Math.sin(p.t * 20);
    ctx.strokeStyle = '#ff3030'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(e.x, e.y, b.w * 0.62, b.h * 0.58, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.globalAlpha = (e.etat === 'sort' ? 0.6 : 1) * (e.cache ? e.alpha : e.type === 'lumi' && e.fuite ? Math.max(0, e.alpha) : 1);
  ctx.drawImage(tenu && ((p.t * 16) | 0) % 3 === 0 && blanc(e) ? blanc(e) : sp, Math.round(b.x + tr), Math.round(b.y), Math.round(b.w), Math.round(b.h));
  // l'Ombre cachée : on ne voit que ses yeux et son sourire
  if (e.cache && e.alpha < 1) { ctx.globalAlpha = 0.9; ctx.drawImage(S.ombreYeux, Math.round(b.x), Math.round(b.y), Math.round(b.w), Math.round(b.h)); }
  ctx.globalAlpha = 1;
  // étourdi par le flash : trois étoiles tournent au-dessus de lui
  if (e.etourdi > 0) for (let i = 0; i < 3; i++) { const an = p.t * 6 + i * 2.1; R(ctx, '#fff27a', Math.round(e.x + Math.cos(an) * b.w * 0.45), Math.round(b.y - 3 + Math.sin(an) * 3), 2, 2); }
  // le slam : une flèche orange montre où il tire ; la jauge se remplit d'un coup sec à l'opposé
  if (e.lutte && p.tenu === e && p.tire) {
    const ax = Math.round(e.x + e.traction.dx * (b.w * 0.5 + 8)), ay = Math.round(e.y + e.traction.dy * (b.h * 0.5 + 8));
    for (let i = 0; i < 5; i++) R(ctx, '#ff8a1c', Math.round(ax - e.traction.dx * i * 2), Math.round(ay - e.traction.dy * i * 2), 2, 2);
    R(ctx, '#fff6c8', ax, ay, 2, 2);
    const bw = Math.max(14, Math.round(b.w * 0.7)), bx = Math.round(e.x - bw / 2), by = Math.round(b.y + b.h + 3);
    R(ctx, NOIR, bx - 1, by - 1, bw + 2, 4); R(ctx, '#ff8a1c', bx, by, Math.round(bw * Math.min(1, e.slam)), 2);
  }
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
  const couleurs = p.ricoche ? [['#3fe8ff', 3, -2], ['#3fe8ff', 3, 2], ['#c8f8ff', 2, 0]] : [['#ff3fa4', 3, -2], ['#3fe8ff', 3, 2], ['#ffffff', 2, 0]];
  for (const [col, l, dx] of /** @type {[string, number, number][]} */ (couleurs)) {
    ctx.strokeStyle = col; ctx.lineWidth = l; ctx.beginPath(); ctx.moveTo(pts[0][0] + dx, pts[0][1]);
    for (const [x, y] of pts) ctx.lineTo(x + dx, y);
    ctx.stroke();
  }
  ovale(ctx, x1, y1, 4, 4, '#ffffff');
}

function viseur(ctx, p, v) {
  const x = Math.round(p.visee.x), y = Math.round(p.visee.y);
  const sous = p.sous;
  const col = p.surchauffe ? '#ff5a3a' : p.ricoche ? '#3fe8ff' : sous && sous.type === 'lumi' ? '#ff8aa0' : p.tenu ? (p.tenu.type === 'chat' ? '#ff8aa0' : '#ff3030') : '#ffffff';
  ctx.globalAlpha = v.tactile && !p.tire ? 0.5 : 1;
  const seg = (c, o) => { R(ctx, c, x - 8 - o, y - o, 5 + 2 * o, 1 + 2 * o); R(ctx, c, x + 4 - o, y - o, 5 + 2 * o, 1 + 2 * o); R(ctx, c, x - o, y - 8 - o, 1 + 2 * o, 5 + 2 * o); R(ctx, c, x - o, y + 4 - o, 1 + 2 * o, 5 + 2 * o); };
  seg(NOIR, 1); seg(col, 0);
  if (sous && sous.type === 'lumi') ecrire(ctx, '!', x + 9, y - 14, { coul: '#ff8aa0', contour: NOIR, gras: true });
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
    const bw = 120, bx = 100, gard = protege(p, p.boss);
    ecrire(ctx, ESPECES[p.boss.type].nom, 160, 4, { centre: true, coul: '#ffffff', contour: NOIR });
    R(ctx, NOIR, bx - 1, 13, bw + 2, 6); R(ctx, gard ? '#3fe8ff' : '#b46cff', bx, 14, Math.round(bw * Math.max(0, p.boss.pv) / p.boss.pv0), 4);
  }
  // la super-attaque se remplit sous les cœurs ; un point bat la mesure dès qu'il y a du rythme
  const A = p.mission.actions || {};
  if (A.super) {
    const plein = p.jauge >= 1;
    R(ctx, NOIR, 4, 14, 48, 6); R(ctx, '#2a1a3a', 5, 15, 46, 4);
    R(ctx, plein && ((p.t * 8) | 0) & 1 ? '#ffffff' : '#ff3fa4', 5, 15, Math.round(46 * p.jauge), 4);
    ecrire(ctx, 'SUPER', 56, 14, { coul: plein ? '#ffffff' : '#c8b8e0', contour: NOIR });
  }
  if (A.rythme) { const bat = p.phase < 0.2; R(ctx, NOIR, 4, 22, 7, 7); R(ctx, bat ? '#ff3fa4' : '#3a2050', 5, 23, 5, 5); if (bat) R(ctx, '#ffffff', 6, 24, 3, 3); }
  if (p.etat === 'jeu' && p.titre > 0) {
    const a = Math.min(1, p.titre * 2);
    ecrire(ctx, SALLES[p.salle].nom, 160, 40, { centre: true, sc: 2, coul: '#ffffff', contour: NOIR, alpha: a });
    ecrire(ctx, `SALLE ${p.n + 1} SUR ${p.mission.salles.length}`, 160, 60, { centre: true, coul: '#c8b8e0', contour: NOIR, alpha: a });
  } else if (p.etat === 'jeu' && p.consigne) {
    const t = p.consigne.texte.replace('{GARDE}', v.tactile ? 'GARDE LE DOIGT' : 'GARDE LE CLIC').replace('{FLASH}', v.tactile ? 'BOUTON FLASH' : 'CLIC DROIT').replace('{SUPER}', v.tactile ? 'BOUTON SUPER' : 'TOUCHE E');
    ecrire(ctx, t, 160, p.boss ? 24 : (A.super ? 30 : 22), { centre: true, coul: '#fff27a', contour: NOIR, gras: true });
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
  ctx.save(); ctx.translate(-dx, 0); ctx.drawImage(FONDS[p.salle], 0, 0); DESSINS[p.salle].animer(ctx, p.s, p.t, p); ctx.restore();
  R(ctx, '#3a1e12', W - dx, 0, 16, H); R(ctx, NOIR, W - dx + 7, 0, 2, H);
  ctx.save(); ctx.translate(W + 16 - dx, 0); ctx.drawImage(FONDS[suite], 0, 0); DESSINS[suite].animer(ctx, v.suivante.s, p.t, p); ctx.restore();
}
