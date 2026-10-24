// Ghost Train : dessine une partie. L'écran LIT la partie et ne la modifie jamais ;
// ce qui n'existe qu'à l'écran (étincelles, pièces qui volent jusqu'au compteur,
// voile rouge d'un coup, file des messages de la radio) vit dans la « vue ».
import { W, H, CANON, SOL, COEURS } from '../moteur/constantes.js';
import { projeter } from '../moteur/projection.js';
import { dessinerDecor } from './decor.js';
import { S, BLANC, preparer, spriteDe, wagon, appareil, coeur } from './dessins.js';
import { ecrire, couper } from './police.js';

const NOIR = '#120818';
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const rect = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

/** @param {{flashsReduits: boolean}} reglages */
export function creeVue(reglages) {
  preparer();
  return { reglages, image: 0, t: 0, parts: [], pieces: [], textes: [], radio: [], rouge: 0, secousse: 0, eclair: 0, tEclair: 5, compteur: 0 };
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
    case 'soin': v.textes.push({ s: '+1 CŒUR', x: 60, y: 30, col: '#ff8aa0', t: 0, vie: 1.6 }); break;
    case 'radio': v.radio.push({ texte: ev.texte, reste: Math.min(7, 2.5 + ev.texte.length / 16) }); break;
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
  v.compteur += v.pieces.filter((q) => q.t >= q.dur).length;
  v.pieces = v.pieces.filter((q) => q.t < q.dur);
  v.rouge = Math.max(0, v.rouge - dt * 1.6); v.secousse = Math.max(0, v.secousse - dt);
  if (v.radio.length) { v.radio[0].reste -= dt; if (v.radio[0].reste <= 0) v.radio.shift(); }
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
  if (e.type !== 'assiette' && e.type !== 'secret') {
    const sol = projeter(p, e.x + e.ox, SOL, e.z);
    if (sol) { ctx.globalAlpha = 0.3 * a; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(Math.round(sol.x), Math.round(sol.y), b.w * 0.32, Math.max(1, b.w * 0.07), 0, 0, Math.PI * 2); ctx.fill(); }
  }
  // le sprite remplit la boîte en largeur, sa hauteur suit ses proportions ; il respire un peu
  const q = e.type === 'assiette' || e.type === 'secret' || e.type === 'levier' ? 0 : Math.sin(e.t * 6 + e.ph) * 0.05;
  const w = b.w * (1 + q), h = (b.w * spr.height / spr.width) * (1 - q);
  let ox = 0, oy = 0;
  if (e.tenu) { ox = (v.image & 1) ? 1 : -1; oy = (v.image & 2) ? 1 : 0; }
  const x0 = Math.round(b.cx - w / 2 + ox), y0 = Math.round(b.cy - h / 2 + oy);
  ctx.globalAlpha = a;
  ctx.drawImage(spr, x0, y0, Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
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
  // une goule abîmée montre sa vie restante
  if (e.hostile && e.pv < e.pv0 && e.type !== 'majordome') {
    const bw = Math.max(10, Math.round(w * 0.7)), bx = Math.round(b.cx - bw / 2), by = y0 - 5;
    rect(ctx, NOIR, bx - 1, by - 1, bw + 2, 4); rect(ctx, '#6ee03a', bx, by, Math.round(bw * Math.max(0, e.pv) / e.pv0), 2);
  }
}

/** Le fantôme capturé file en tournoyant dans l'appareil. @param {CanvasRenderingContext2D} ctx */
function capture(ctx, e, v) {
  const k = clamp(e.ct / e.cdur, 0, 1), ek = k * k, cle = spriteDe(e), spr = S[cle];
  const x = e.capX + (CANON.x + 30 - e.capX) * ek, y = e.capY + (CANON.y + 4 - e.capY) * ek, t = Math.max(2, (1 - ek * 0.9) * e.capT);
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(k * 12);
  ctx.drawImage((v.image & 2) ? BLANC[cle] : spr, -t / 2, -t / 2, t, t * spr.height / spr.width);
  ctx.restore();
}

/** Le rayon : une onde orange cerclée de noir, un cœur jaune. */
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
  trait(4, ph, 0.35, NOIR, 4); trait(4, ph, 0.35, '#ff8a1c', 2); trait(1, ph * 1.7, 0.6, '#fff27a', 2);
  rect(ctx, (image & 1) ? '#fff6c8' : '#ff8a1c', Math.round(x1) - 3, Math.round(y1) - 3, 7, 7);
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

/** La bulle de la radio, au-dessus du wagon, à gauche de l'appareil. */
function radio(ctx, texte) {
  const lignes = couper(texte, 32), h = 17 + lignes.length * 10;
  const y = 146 - h;
  rect(ctx, NOIR, 5, y - 1, 204, h + 2); rect(ctx, '#ffffff', 6, y, 202, h);
  rect(ctx, NOIR, 20, y + h + 1, 7, 3); rect(ctx, '#ffffff', 21, y + h, 5, 2);
  ecrire(ctx, 'CHEFFE :', 11, y + 4, { coul: '#e8203a', gras: true });
  lignes.forEach((l, k) => ecrire(ctx, l, 11, y + 15 + k * 10, { coul: NOIR }));
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
  if (p.tire) {
    const c = p.cibleRayon, b = c && c.boite;
    rayon(ctx, b ? b.cx : p.visee.x, b ? b.cy : p.visee.y, v.image);
  }
  for (const e of p.ents) if (e.etat === 'cap') capture(ctx, e, v);
  for (const q of v.parts) { ctx.globalAlpha = clamp(1 - q.t / q.vie, 0, 1); rect(ctx, q.col, Math.round(q.x), Math.round(q.y), 1, 1); }
  ctx.globalAlpha = 1;
  wagon(ctx);
  appareil(ctx, p, v.image);
  // HUD : cœurs, pièces, consigne, boss, radio
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
    ecrire(ctx, 'LE MAJORDOME', 160, by - 1, { centre: true, coul: '#ffffff', contour: NOIR });
    rect(ctx, NOIR, bx - 1, by + 9, bw + 2, 6); rect(ctx, '#3a1020', bx, by + 10, bw, 4);
    rect(ctx, '#b46cff', bx, by + 10, Math.round(bw * Math.max(0, boss.pv) / boss.pv0), 4);
  }
  if (p.consigne && ((v.image >> 4) & 1 || v.reglages.flashsReduits)) {
    const y = boss && boss.entree > 1 ? 40 : 22;
    ecrire(ctx, p.consigne.texte, 160, y, { centre: true, coul: '#fff27a', contour: NOIR, gras: true });
  }
  if (p.rail === 'aiguillage') {
    const reste = Math.max(0, Math.ceil(4 - p.tAig));
    ecrire(ctx, 'AIGUILLAGE ' + reste, 160, 36, { centre: true, coul: '#ffffff', contour: NOIR });
  }
  for (const q of v.textes) ecrire(ctx, q.s, q.x, q.y, { centre: true, coul: q.col, contour: NOIR, alpha: clamp(1.4 - q.t / q.vie, 0, 1) });
  if (v.radio.length) radio(ctx, v.radio[0].texte);
  if (p.etat === 'jeu') {
    const sous = p.cibleRayon || p.sous;
    const col = sous ? (sous.type === 'lumi' ? '#ff8aa0' : sous.hostile ? '#ff3030' : '#fff27a') : '#ffffff';
    viseur(ctx, p.visee.x, p.visee.y, col);
    if (sous && sous.type === 'lumi') ecrire(ctx, '!', p.visee.x + 9, p.visee.y - 14, { coul: '#ff8aa0', contour: NOIR, gras: true });
  }
  if (v.rouge > 0) { ctx.globalAlpha = v.rouge; rect(ctx, '#ff1030', 0, 0, W, H); ctx.globalAlpha = 1; }
  if (p.etat === 'mourant') { ctx.globalAlpha = clamp(1 - p.tMort / 1.4, 0, 1) * 0.8; rect(ctx, '#07040f', 0, 0, W, H); ctx.globalAlpha = 1; }
}
