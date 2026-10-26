// Ghost Train : dessine une partie. L'écran LIT la partie et ne la modifie jamais ;
// ce qui n'existe qu'à l'écran (étincelles, pièces qui volent jusqu'au compteur,
// voile rouge d'un coup, bave) vit dans la « vue ».
// Pas de radio ni de bulle de dialogue (retirées le 2026-10-26, Julie : « on n'a pas le
// temps de regarder en bas pour lire quand les fantômes arrivent d'en haut ») : c'est un
// jeu d'arcade, il s'explique en jouant ; seules restent des consignes d'une ligne en haut.
import { W, H, CANON, SOL, COEURS, PLAFOND, FOCALE, FLASH } from '../moteur/constantes.js';
import { estBoss, estTir } from '../moteur/fantomes.js';
import { ESPECES } from '../contenu/especes.js';
import { projeter } from '../moteur/projection.js';
import { dessinerDecor } from './decor.js';
import { S, BLANC, preparer, spriteDe, wagon, appareil, coeur } from './dessins.js';
import { ecrire } from './police.js';

const NOIR = '#120818';
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const rect = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

/** @param {{flashsReduits: boolean}} reglages */
export function creeVue(reglages) {
  preparer();
  return { reglages, tactile: false, image: 0, t: 0, parts: [], pieces: [], textes: [], baves: [], flashs: [], onde: 0, rouge: 0, secousse: 0, eclair: 0, tEclair: 5, compteur: 0 };
}

/** Un événement de la partie, pour l'écran. @param {any} v @param {any} ev @param {any} p */
export function recevoir(v, ev, p) {
  const doux = v.reglages.flashsReduits;
  switch (ev.type) {
    case 'coup': v.rouge = doux ? 0.25 : 0.55; v.secousse = doux ? 0 : 0.3; break;
    case 'pieces':
      for (let i = 0; i < ev.n; i++) v.pieces.push({ x: ev.x + (i % 3 - 1) * 6, y: ev.y + ((i / 3) | 0) * 4, t: -i * 0.06, dur: 0.7 + (i % 4) * 0.05 });
      break;
    case 'pouf': if (ev.x !== undefined) eclats(v, ev.x, ev.y, 10, ['#ffffff', '#c8c4e0', '#fff27a'], 50); break;
    case 'secret':
      eclats(v, ev.x, ev.y, 18, ['#fff27a', '#ffffff', '#ff8a1c'], 70);
      v.textes.push({ s: 'AU DOSSIER !', x: ev.x, y: ev.y - 16, col: '#fff27a', t: 0, vie: 1.6 });
      break;
    case 'clac':
      v.textes.push({ s: 'CLAC !', x: ev.x, y: ev.y - 12, col: '#fff27a', t: 0, vie: 1 });
      eclats(v, ev.x, ev.y + 10, 12, ['#fff27a', '#ffffff', '#c8c8d8'], 60);
      break;
    case 'bave': {
      // un éclaboussement là où la goule a frappé : une masse irrégulière, des gouttelettes
      // projetées autour, et des coulures fines qui descendent
      let g = (v.image * 2654435761 + v.baves.length * 97) >>> 0;
      const hasard = () => ((g = (Math.imul(g, 1664525) + 1013904223) >>> 0) / 4294967296);
      const x = Math.max(36, Math.min(196, ev.x)), y = Math.max(34, Math.min(104, ev.y));
      const lobes = [], gouttes = [], eclats = [];
      for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2 + hasard(), d = 5 + hasard() * 9; lobes.push([Math.cos(a) * d, Math.sin(a) * d * 0.75, 7 + hasard() * 6]); }
      for (let k = 0; k < 9; k++) { const a = hasard() * Math.PI * 2, d = 20 + hasard() * 16; eclats.push([Math.cos(a) * d, Math.sin(a) * d * 0.8, 1.5 + hasard() * 2.5]); }
      for (let k = 0; k < 6; k++) gouttes.push({ dx: (hasard() - 0.5) * 34, larg: 1 + (hasard() * 3 | 0), vit: 22 + hasard() * 30, delai: hasard() * 0.6, max: 40 + hasard() * 60 });
      v.baves.push({ x, y, t: 0, lobes, gouttes, eclats });
      break;
    }
    case 'flash': v.flashs.push({ x: ev.x, y: ev.y, t: 0 }); break;
    case 'super': v.onde = 0.001; v.textes.push({ s: 'SUPER !', x: 160, y: 70, col: '#ff8ad0', t: 0, vie: 1.4 }); break;
    case 'parfait': v.textes.push({ s: 'PARFAIT !', x: ev.x, y: ev.y - 22, col: '#ff8ad0', t: 0, vie: 1.2 }); eclats(v, ev.x, ev.y, 12, ['#ff3fa4', '#3fe8ff', '#ffffff'], 60); break;
    case 'slam':
      v.textes.push({ s: 'SLAM !', x: ev.x, y: ev.y - 16, col: '#ffd23a', t: 0, vie: 1.2 });
      eclats(v, ev.x, ev.y, 16, ['#ffd23a', '#ffffff', '#ff8a1c'], 90); v.secousse = doux ? 0 : 0.2;
      break;
    case 'brise':
      v.textes.push({ s: 'BOUCLIER BRISÉ !', x: ev.x, y: ev.y - 20, col: '#3fe8ff', t: 0, vie: 1.4 });
      eclats(v, ev.x, ev.y, 24, ['#ff3030', '#3fe8ff', '#ffffff'], 90);
      break;
    case 'soin': v.textes.push({ s: '+1 CŒUR', x: 60, y: 30, col: '#ff8aa0', t: 0, vie: 1.6 }); break;
    // à l'aiguillage, la réplique passe tout de suite : une ancienne bulle de deux lignes cacherait le levier
  }
}

function eclats(v, x, y, n, cols, vit) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + i, s = 15 + ((i * 37) % 10) / 10 * vit;
    v.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, vie: 0.4 + (i % 3) * 0.12, col: cols[i % cols.length] });
  }
}

/** @param {any} v @param {any} p @param {number} dt */
export function avancerVue(v, p, dt) {
  v.t += dt; v.image++;
  for (const q of v.parts) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 40 * dt; }
  v.parts = v.parts.filter((q) => q.t < q.vie);
  for (const q of v.textes) { q.t += dt; q.y -= 12 * dt; }
  v.textes = v.textes.filter((q) => q.t < q.vie);
  for (const q of v.pieces) q.t += dt;
  for (const b of v.baves) b.t += dt;
  for (const f of v.flashs) f.t += dt;
  v.flashs = v.flashs.filter((f) => f.t < 0.3);
  if (v.onde > 0) { v.onde += dt; if (v.onde > 1.6) v.onde = 0; }
  v.baves = v.baves.filter((b) => b.t < 3.6);
  v.compteur += v.pieces.filter((q) => q.t >= q.dur).length;
  v.pieces = v.pieces.filter((q) => q.t < q.dur);
  v.rouge = Math.max(0, v.rouge - dt * 1.6); v.secousse = Math.max(0, v.secousse - dt);
  // L'éclair dans les fenêtres du hall : jamais avec les flashs réduits
  v.eclair = Math.max(0, v.eclair - dt * 3);
  v.tEclair -= dt;
  if (v.tEclair <= 0) { v.tEclair = 5 + ((v.image * 7) % 50) / 10; if (!v.reglages.flashsReduits) v.eclair = 1; }
  // Fantômes tenus par le rayon : des étincelles filent vers l'appareil
  if (p && p.cibleRayon && p.cibleRayon.boite && v.image % 3 === 0) {
    const b = p.cibleRayon.boite;
    v.parts.push({ x: b.cx + ((v.image * 13) % 12) - 6, y: b.cy + ((v.image * 7) % 12) - 6, vx: (CANON.x - b.cx) * 1.4, vy: (CANON.y - b.cy) * 1.4, t: 0, vie: 0.3, col: '#fff6c8' });
  }
}

/** @param {CanvasRenderingContext2D} ctx @param {any} e @param {any} v @param {any} p */
function entite(ctx, e, v, p) {
  const b = e.boite;
  if (!b) return;
  const cle = spriteDe(e), spr = S[cle];
  const a = clamp(e.alpha * Math.min(1, 1.25 - b.d / 17), 0, 1);
  // ombre au sol
  if (!estTir(e) && e.type !== 'secret' && e.type !== 'ombre' && e.type !== 'livre') {
    const sol = projeter(p, e.x + e.ox, SOL, e.z);
    if (sol) { ctx.globalAlpha = 0.3 * a; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(Math.round(sol.x), Math.round(sol.y), b.w * 0.32, Math.max(1, b.w * 0.07), 0, 0, Math.PI * 2); ctx.fill(); }
  }
  // le sprite remplit la boîte en largeur, sa hauteur suit ses proportions ; il respire un peu
  const q = estTir(e) || e.type === 'secret' || e.type === 'levier' ? 0 : Math.sin(e.t * 6 + e.ph) * 0.05;
  const w = b.w * (1 + q), h = (b.w * spr.height / spr.width) * (1 - q);
  let ox = 0, oy = 0;
  if (e.tenu) { ox = (v.image & 1) ? 1 : -1; oy = (v.image & 2) ? 1 : 0; }
  const x0 = Math.round(b.cx - w / 2 + ox), y0 = Math.round(b.cy - h / 2 + oy);
  // le bouclier de la Gouvernante : un halo rouge qui palpite autour d'elle
  if (e.type === 'gouvernante' && e.bouclier) {
    ctx.globalAlpha = a * (0.45 + 0.3 * Math.sin(v.t * 20));
    ctx.strokeStyle = '#ff3030'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(b.cx, b.cy, w * 0.62, h * 0.58, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.globalAlpha = a;
  ctx.drawImage(spr, x0, y0, Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  // l'Ombre cachée : on ne voit que ses yeux et son sourire
  if (e.type === 'ombre' && e.alpha < 1) { ctx.globalAlpha = 0.9; ctx.drawImage(S.ombreYeux, x0, y0, Math.round(w), Math.round(h)); }
  if (e.tenu && (v.image & 2)) { ctx.globalAlpha = a * 0.7; ctx.drawImage(BLANC[cle], x0, y0, Math.round(w), Math.round(h)); }
  ctx.globalAlpha = 1;
  // un secret scintille, pour qu'on le remarque
  if (e.type === 'secret' && ((v.t * 1.5) % 2) < 0.5) {
    const k = ((v.t * 1.5) % 2) / 0.5, sx = Math.round(x0 + w * (0.2 + 0.6 * k)), sy = Math.round(y0 + h * 0.2);
    rect(ctx, '#fff27a', sx - 2, sy, 5, 1); rect(ctx, '#fff27a', sx, sy - 2, 1, 5); rect(ctx, '#ffffff', sx, sy, 1, 1);
  }
  // panneau ou secret en cours de visée : une jauge sous lui
  if ((e.type === 'levier' || e.type === 'secret') && e.charge > 0) {
    const max = e.type === 'levier' ? 0.35 : 0.5, bw = Math.max(14, Math.round(w));
    rect(ctx, NOIR, Math.round(b.cx - bw / 2) - 1, Math.round(y0 + h + 2), bw + 2, 4);
    rect(ctx, '#fff27a', Math.round(b.cx - bw / 2), Math.round(y0 + h + 3), Math.round(bw * Math.min(1, e.charge / max)), 2);
  }
  // étourdi par le flash : trois étoiles tournent au-dessus de lui
  if (e.etourdi > 0 && e.etat === 'vit') {
    for (let i = 0; i < 3; i++) { const an = v.t * 6 + i * 2.1; rect(ctx, '#fff27a', Math.round(b.cx + Math.cos(an) * w * 0.45), Math.round(y0 - 3 + Math.sin(an) * 3), 2, 2); }
  }
  // le slam : une flèche montre où le fantôme tire, la jauge orange se remplit en tirant à l'opposé
  if (e.tenu && (p.mission.actions || {}).slam) {
    const ax = Math.round(b.cx + e.traction.dx * (w * 0.5 + 8)), ay = Math.round(b.cy + e.traction.dy * (h * 0.5 + 8));
    for (let i = 0; i < 4; i++) rect(ctx, '#ff8a1c', Math.round(ax - e.traction.dx * i * 2), Math.round(ay - e.traction.dy * i * 2), 2, 2);
    rect(ctx, '#fff6c8', ax, ay, 2, 2);
    const bw = Math.max(12, Math.round(w * 0.7)), bx = Math.round(b.cx - bw / 2), by = Math.round(y0 + h + 3);
    rect(ctx, NOIR, bx - 1, by - 1, bw + 2, 4); rect(ctx, '#ff8a1c', bx, by, Math.round(bw * Math.min(1, e.slam)), 2);
  }
  // une goule abîmée montre sa vie restante
  if (e.hostile && e.pv < e.pv0 && !estBoss(e)) {
    const bw = Math.max(10, Math.round(w * 0.7)), bx = Math.round(b.cx - bw / 2), by = y0 - 5;
    rect(ctx, NOIR, bx - 1, by - 1, bw + 2, 4); rect(ctx, '#6ee03a', bx, by, Math.round(bw * Math.max(0, e.pv) / e.pv0), 2);
  }
}

/** Une plaque émaillée de chemin de fer : bleu, liseré blanc, lettres blanches (9:1). */
function plaque(ctx, cx, y, voie) {
  const w = voie.nom.length * 6 + 9, x0 = Math.round(cx - w / 2);
  rect(ctx, NOIR, cx - 12, y - 8, 2, 8); rect(ctx, NOIR, cx + 10, y - 8, 2, 8);
  rect(ctx, NOIR, x0 - 1, y - 1, w + 2, 22); rect(ctx, '#ffffff', x0, y, w, 20); rect(ctx, '#1a4a90', x0 + 1, y + 1, w - 2, 18);
  ecrire(ctx, voie.nom, cx, y + 3, { centre: true, coul: '#ffffff' });
  for (let k = 0; k < voie.danger; k++) { const a = x0 + 4 + k * 8; rect(ctx, '#ffffff', a, y + 12, 5, 4); rect(ctx, '#1a4a90', a + 1, y + 13, 1, 1); rect(ctx, '#1a4a90', a + 3, y + 13, 1, 1); }
  if (voie.gain > 1) { ctx.drawImage(S.piece, x0 + w - 22, y + 11); ecrire(ctx, 'X' + voie.gain, x0 + w - 13, y + 11, { coul: '#ffd23a' }); }
}

/** Le portique au-dessus de la voie, comme dans les gares : une poutre, une plaque par voie. Il passe au-dessus du wagon quand il repart. */
function portique(ctx, p) {
  const d = p.portique.z - p.camZ;
  if (d < 0.3) return;
  const y = Math.round(p.horizon + (PLAFOND + 0.15) * FOCALE / d);
  if (y < -40) return;
  rect(ctx, NOIR, 0, y - 1, 320, 6); rect(ctx, '#3a2a1c', 0, y, 320, 4); rect(ctx, '#5a3a24', 0, y, 320, 1);
  plaque(ctx, 96, y + 9, p.portique.g);
  plaque(ctx, 226, y + 9, p.portique.d);
}

/** La bave sur la vitre : contour noir de 2 pixels d'abord, deux verts, un reflet ; les coulures s'allongent puis tout s'efface. */
function bave(ctx, b) {
  ctx.globalAlpha = b.t < 2.6 ? 1 : Math.max(0, 1 - (b.t - 2.6));
  const disque = (x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(Math.round(x), Math.round(y), Math.max(0.5, r), 0, Math.PI * 2); ctx.fill(); };
  const long = (g) => Math.max(0, Math.min(g.max, (b.t - g.delai) * g.vit));
  const formes = (bord, c) => {
    for (const g of b.gouttes) { const x = Math.round(b.x + g.dx), l = long(g); rect(ctx, c, x - bord, b.y, g.larg + bord * 2, l); disque(x + g.larg / 2, b.y + l, g.larg * 0.8 + 0.6 + bord, c); }
    for (const [dx, dy, r] of b.lobes) disque(b.x + dx, b.y + dy, r + bord, c);
    for (const [dx, dy, r] of b.eclats) disque(b.x + dx, b.y + dy, r + bord, c);
  };
  formes(2, NOIR);
  formes(0, '#2c9a2a');
  for (const [dx, dy, r] of b.lobes) disque(b.x + dx - 1, b.y + dy - 1, r - 2, '#6ee03a');
  for (const g of b.gouttes) rect(ctx, '#6ee03a', Math.round(b.x + g.dx), b.y, Math.max(1, g.larg - 1), long(g) - 1);
  // un seul reflet en virgule, en haut à gauche de la masse
  rect(ctx, '#c8ff5a', Math.round(b.x - 8), Math.round(b.y - 9), 6, 2); rect(ctx, '#c8ff5a', Math.round(b.x - 10), Math.round(b.y - 7), 2, 4);
  ctx.globalAlpha = 1;
}

/** Le fantôme capturé file en tournoyant dans l'appareil. @param {CanvasRenderingContext2D} ctx */
function capture(ctx, e, v) {
  const k = clamp(e.ct / e.cdur, 0, 1), ek = k * k, cle = spriteDe(e), spr = S[cle];
  const x = e.capX + (CANON.x + 30 - e.capX) * ek, y = e.capY + (CANON.y + 4 - e.capY) * ek, t = Math.max(2, (1 - ek * 0.9) * e.capT);
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(k * 12);
  ctx.drawImage((v.image & 2) ? BLANC[cle] : spr, -t / 2, -t / 2, t, t * spr.height / spr.width);
  ctx.restore();
}

/** Le rayon de l'agence : un cœur blanc cerclé de noir, et deux filaments électriques, rose et cyan, qui s'enroulent autour. */
function rayon(ctx, x1, y1, image) {
  const x0 = CANON.x, y0 = CANON.y, dx = x1 - x0, dy = y1 - y0, len = Math.max(1, Math.hypot(dx, dy)), nx = -dy / len, ny = dx / len;
  const trait = (amp, ph, freq, col, t) => {
    ctx.fillStyle = col;
    for (let i = 0; i <= len; i++) {
      const k = i / len, o = Math.sin(k * len * freq + ph) * amp * Math.sin(k * Math.PI);
      ctx.fillRect(Math.round(x0 + dx * k + nx * o - t / 2), Math.round(y0 + dy * k + ny * o - t / 2), t, t);
    }
  };
  const ph = image * 0.45;
  trait(6, ph, 0.22, '#3fe8ff', 1); trait(6, ph + Math.PI, 0.22, '#ff3fa4', 1);
  trait(3, ph * 1.7, 0.5, NOIR, 4); trait(3, ph * 1.7, 0.5, '#ffffff', 2);
  rect(ctx, NOIR, Math.round(x1) - 4, Math.round(y1) - 4, 9, 9);
  rect(ctx, (image & 1) ? '#ffffff' : '#3fe8ff', Math.round(x1) - 3, Math.round(y1) - 3, 7, 7);
}

/** Le viseur, rouge sur un fantôme, rose sur Lumi (attention !), blanc ailleurs. */
function viseur(ctx, x, y, col) {
  x = Math.round(x); y = Math.round(y);
  const seg = (c, o) => {
    ctx.fillStyle = c;
    ctx.fillRect(x - 8 - o, y - o, 5 + 2 * o, 1 + 2 * o); ctx.fillRect(x + 4 - o, y - o, 5 + 2 * o, 1 + 2 * o);
    ctx.fillRect(x - o, y - 8 - o, 1 + 2 * o, 5 + 2 * o); ctx.fillRect(x - o, y + 4 - o, 1 + 2 * o, 5 + 2 * o);
    ctx.fillRect(x - o, y - o, 1 + 2 * o, 1 + 2 * o);
  };
  seg(NOIR, 1); seg(col, 0);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {any} p la partie
 * @param {any} v la vue
 */
export function dessinerPartie(ctx, p, v) {
  dessinerDecor(ctx, p, v.eclair);
  const vivants = p.ents.filter((e) => e.etat !== 'cap').sort((a, b) => b.z - a.z);
  for (const e of vivants) entite(ctx, e, v, p);
  if (p.portique) portique(ctx, p);
  if (p.tire) {
    const c = p.cibleRayon, b = c && c.boite;
    rayon(ctx, b ? b.cx : p.visee.x, b ? b.cy : p.visee.y, v.image);
  }
  for (const e of p.ents) if (e.etat === 'cap') capture(ctx, e, v);
  // le flash : un éclat blanc autour du viseur (moins fort avec les flashs réduits)
  for (const f of v.flashs) {
    const k = f.t / 0.3; ctx.globalAlpha = (1 - k) * (v.reglages.flashsReduits ? 0.3 : 0.75); ctx.fillStyle = '#fffbe0';
    ctx.beginPath(); ctx.arc(f.x, f.y, FLASH.portee * (0.6 + k * 0.6), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // la super-attaque : des anneaux rose, cyan et blanc qui partent du centre
  if (v.onde > 0) {
    const R = v.onde * 260, a = clamp(1 - v.onde / 1.6, 0, 1);
    for (const [dr, c] of /** @type {[number, string][]} */ ([[0, '#ffffff'], [-14, '#ff3fa4'], [-28, '#3fe8ff']])) {
      if (R + dr <= 0) continue;
      ctx.globalAlpha = a; ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(160, 82, R + dr, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  for (const q of v.parts) { ctx.globalAlpha = clamp(1 - q.t / q.vie, 0, 1); rect(ctx, q.col, Math.round(q.x), Math.round(q.y), 1, 1); }
  ctx.globalAlpha = 1;
  wagon(ctx);
  appareil(ctx, p, v.image);
  for (const b of v.baves) bave(ctx, b);
  // HUD : cœurs, pièces, consigne, boss
  for (let i = 0; i < COEURS; i++) coeur(ctx, 6 + i * 11, 6, i < p.coeurs || (p.invul > 0 && i === p.coeurs && (v.image & 4)));
  const pieces = v.compteur;
  ctx.drawImage(S.piece, 270, 5);
  ecrire(ctx, String(pieces).padStart(4, '0'), 314, 6, { droite: true, gras: true, coul: '#fff27a', contour: NOIR });
  for (const q of v.pieces) {
    if (q.t < 0) continue;
    const k = clamp(q.t / q.dur, 0, 1), e = k * k, cx = q.x, cy = q.y - 40;
    const x = (1 - e) * (1 - e) * q.x + 2 * (1 - e) * e * cx + e * e * 274, y = (1 - e) * (1 - e) * q.y + 2 * (1 - e) * e * cy + e * e * 9;
    ctx.drawImage(S.piece, Math.round(x - 4), Math.round(y - 4));
  }
  if (p.surchauffe > 0) ecrire(ctx, 'SURCHAUFFE !', CANON.x + 8, 104, { coul: (v.image >> 3) & 1 ? '#ff3030' : '#fff27a', contour: NOIR, gras: true });
  const boss = p.boss;
  if (boss && !boss.mort && boss.etat !== 'cap' && boss.entree > 1) {
    const bw = 140, bx = 90, by = 20;
    ecrire(ctx, ESPECES[boss.type].nom || '', 160, by - 1, { centre: true, coul: '#ffffff', contour: NOIR });
    rect(ctx, NOIR, bx - 1, by + 9, bw + 2, 6); rect(ctx, '#3a1020', bx, by + 10, bw, 4);
    rect(ctx, boss.bouclier ? '#ff3030' : '#b46cff', bx, by + 10, Math.round(bw * Math.max(0, boss.pv) / boss.pv0), 4);
  }
  // la super-attaque se remplit sous les cœurs ; un point bat la mesure dès qu'il y a du rythme
  const A = p.mission.actions || {};
  if (A.super) {
    const plein = p.jauge >= 1;
    rect(ctx, NOIR, 5, 17, 48, 7); rect(ctx, '#2a1a3a', 6, 18, 46, 5);
    rect(ctx, plein && (v.image >> 3) & 1 ? '#ffffff' : '#ff3fa4', 6, 18, Math.round(46 * p.jauge), 5);
    ecrire(ctx, 'SUPER', 57, 17, { coul: plein ? '#ffffff' : '#c8b8e0', contour: NOIR });
  }
  if (A.rythme) {
    const bat = p.phase < 0.2;
    rect(ctx, NOIR, 5, 27, 7, 7); rect(ctx, bat ? '#ff3fa4' : '#3a2050', 6, 28, 5, 5); if (bat) rect(ctx, '#ffffff', 7, 29, 3, 3);
  }
  if (A.flash && !v.tactile && p.flashCD <= 0 && p.etat === 'jeu') rect(ctx, '#fff27a', Math.round(p.visee.x) + 6, Math.round(p.visee.y) + 6, 2, 2);
  if (p.consigne && ((v.image >> 4) & 1 || v.reglages.flashsReduits)) {
    const y = p.portique ? 58 : boss && boss.entree > 1 ? 40 : (p.mission.actions || {}).super ? 38 : 22;
    // {FLASH} et {SUPER} : le bouton au doigt, la commande à la souris et au clavier
    const t = p.consigne.texte.replace('{FLASH}', v.tactile ? 'FLASH' : 'CLIC DROIT').replace('{SUPER}', v.tactile ? 'TOUCHE SUPER' : 'TOUCHE E');
    ecrire(ctx, t, 160, y, { centre: true, coul: '#fff27a', contour: NOIR, gras: true });
  }
  if (p.rail === 'aiguillage') {
    const reste = Math.max(0, Math.ceil(Math.max(4, p.tClac + 1.2) - p.tAig));
    ecrire(ctx, 'DÉPART ' + reste, 222, 69, { centre: true, coul: '#ffffff', contour: NOIR });
  }
  for (const q of v.textes) ecrire(ctx, q.s, q.x, q.y, { centre: true, coul: q.col, contour: NOIR, alpha: clamp(1.4 - q.t / q.vie, 0, 1) });
  if (p.etat === 'jeu') {
    const sous = p.cibleRayon || p.sous;
    const col = p.ricoche ? '#3fe8ff' : sous ? (sous.type === 'lumi' ? '#ff8aa0' : sous.hostile ? '#ff3030' : '#fff27a') : '#ffffff';
    viseur(ctx, p.visee.x, p.visee.y, col);
    if (sous && sous.type === 'lumi') ecrire(ctx, '!', p.visee.x + 9, p.visee.y - 14, { coul: '#ff8aa0', contour: NOIR, gras: true });
  }
  if (v.rouge > 0) { ctx.globalAlpha = v.rouge; rect(ctx, '#ff1030', 0, 0, W, H); ctx.globalAlpha = 1; }
  if (p.etat === 'mourant') { ctx.globalAlpha = clamp(1 - p.tMort / 1.4, 0, 1) * 0.8; rect(ctx, '#07040f', 0, 0, W, H); ctx.globalAlpha = 1; }
}
