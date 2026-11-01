// Ghost Train : la partie à l'écran. Lit la partie sans jamais la modifier ; ce qui
// n'existe qu'à l'écran (étincelles, pièces qui volent, textes, bave, secousse) vit
// dans la « vue », nourrie par les événements du moteur.
import { W, H, CANON, TORCHE, PIEGE, PECHE, ASPIRE } from '../moteur/constantes.js';
import { boite } from '../moteur/fantomes.js';
import { protege } from '../moteur/rayon.js';
import { etatSalle } from '../moteur/partie.js';
import { PASSAGE } from '../moteur/constantes.js';
import { ESPECES } from '../contenu/especes.js';
import { SALLES } from '../contenu/salles.js';
import { S, BLANC, coeur, preparer } from './dessins.js';
import { ecrire } from './police.js';
import { R, ovale, NOIR, toile, h32 } from './peinture.js';
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
  return { reglages, tactile: false, parts: [], textes: [], baves: [], sels: [], onde: 0, secousse: 0, suivante: null, t: 0 };
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
    case 'super': v.onde = 0.001; break;
    // un sceau de sel qui prend (il s'illumine) ou qui se brise (il s'éparpille)
    case 'sel': v.sels.push({ traits: ev.traits, eclat: !!ev.eclat, t: 0 }); break;
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
  for (const q of v.sels) q.t += dt;
  v.sels = v.sels.filter((q) => q.t < 0.8);
  v.secousse = Math.max(0, v.secousse - dt);
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
  if ((p.mission.actions || {}).torche) obscurite(ctx, p);
  alertes(ctx, p);
  bouchons(ctx, p);
  if (p.aspire) tourbillon(ctx, p);
  for (const e of [...p.ents].sort((a, b) => a.s - b.s)) {
    if (e.etat === 'cap') continue;
    if (p.peche && p.peche.e === e) bossPeche(ctx, p, e);
    else if (p.aspire && p.aspire.e === e) { if (!p.aspire.dedans) bossPeche(ctx, p, e); }
    else entite(ctx, p, e);
  }
  ctx.restore();
  for (const e of p.ents) if (e.etat === 'cap') avale(ctx, p, e);
  rayonDessin(ctx, p);
  gouttes(p, v);
  piege(ctx, p, v);
  if (p.peche) cercle(ctx, p);
  if (p.sceau) sceauDessin(ctx, p);
  selsVue(ctx, v);
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

// dès la bibliothèque, les pièces sont dans la pénombre (les fantômes, eux, se voient) ;
// la torche y perce un rond de lumière, et son faisceau part d'en bas à gauche, du pouce
const NUIT = { voile: 'rgba(8, 4, 22, 0.5)', ox: 40, oy: 186 };
/** @type {{t: HTMLCanvasElement, c: CanvasRenderingContext2D} | null} */ let nuit = null;
function obscurite(ctx, p) {
  if (!nuit) nuit = toile();
  const c = nuit.c, T = p.torche, r = TORCHE.portee;
  c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, W, H);
  c.fillStyle = NUIT.voile; c.fillRect(0, 0, W, H);
  if (T.on) {
    c.globalCompositeOperation = 'destination-out';
    const a = Math.atan2(T.y - NUIT.oy, T.x - NUIT.ox), px = Math.cos(a + Math.PI / 2), py = Math.sin(a + Math.PI / 2);
    c.globalAlpha = 0.45; c.beginPath();
    c.moveTo(NUIT.ox - px * 4, NUIT.oy - py * 4); c.lineTo(T.x - px * r, T.y - py * r); c.lineTo(T.x + px * r, T.y + py * r); c.lineTo(NUIT.ox + px * 4, NUIT.oy + py * 4); c.fill();
    c.globalAlpha = 1;
    const g = c.createRadialGradient(T.x, T.y, 4, T.x, T.y, r);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.75, 'rgba(0,0,0,0.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.beginPath(); c.arc(T.x, T.y, r, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'source-over';
  }
  ctx.drawImage(nuit.t, 0, 0);
  // la lampe grésille un peu
  if (T.on) { ctx.globalAlpha = 0.14 + Math.random() * 0.03; ctx.fillStyle = '#fff2b0'; ctx.beginPath(); ctx.arc(T.x, T.y, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
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
  // étourdi par la torche : trois étoiles tournent au-dessus de lui
  if (e.etourdi > 0) for (let i = 0; i < 3; i++) { const an = p.t * 6 + i * 2.1; R(ctx, '#fff27a', Math.round(e.x + Math.cos(an) * b.w * 0.45), Math.round(b.y - 3 + Math.sin(an) * 3), 2, 2); }
  // la vie d'un fantôme qu'on aspire
  if (e.hostile && !e.tir && !e.boss && e.pv < e.pv0) {
    const bw = Math.max(12, Math.round(b.w * 0.6)), bx = Math.round(e.x - bw / 2), by = Math.round(b.y - 5);
    R(ctx, NOIR, bx - 1, by - 1, bw + 2, 4); R(ctx, '#6ee03a', bx, by, Math.round(bw * e.pv / e.pv0), 2);
  }
  // un tir qui arrive se signale par un anneau rouge et blanc
  if (e.tir && e.k > 0.5) { ctx.strokeStyle = (((p.t * 10) | 0) & 1) ? '#ff3030' : '#ffffff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(e.x, e.y, b.w * 0.7, 0, Math.PI * 2); ctx.stroke(); }
}

// le sel (maquette validée par Julie le 2026-11-01) : des grains d'un pixel, serrés le long du
// trait, chacun avec son petit contour sombre ; `graine` fixe leur place (ils ne grouillent pas)
function semer(pts) {
  const out = [];
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay)));
    for (let k = 0; k < n; k++) out.push([ax + (bx - ax) * k / n, ay + (by - ay) * k / n]);
  }
  return out;
}
function sel(ctx, pts, graine, col = '#ffffff', ecart = 0) {
  const pp = semer(pts);
  const grain = (i, g) => {
    const a = i * 3 + g + graine, dx = (h32(a) - 0.5) * 2.2, dy = (h32(a + 7919) - 0.5) * 2.2;
    return h32(a * 11 + 5) < 0.7 ? [Math.round(pp[i][0] + dx * (1 + ecart)), Math.round(pp[i][1] + dy * (1 + ecart))] : null;
  };
  for (const [c, d, w] of [[NOIR, -1, 3], [col, 0, 1]]) {
    ctx.fillStyle = c;
    for (let i = 0; i < pp.length; i++) for (let g = 0; g < 2; g++) { const q = grain(i, g); if (q) ctx.fillRect(q[0] + d, q[1] + d, w, w); }
  }
}
// le sceau (combles) : la pièce s'assombrit, le fantôme sonné reste en avant, le signe à verser en
// pointillés, le sel déjà versé, le point de départ du trait en cours (numéroté s'il y en a deux),
// le temps qui reste
function sceauDessin(ctx, p) {
  const S = p.sceau, e = S.e, t = S.t;
  ctx.globalAlpha = 0.5; R(ctx, NOIR, 0, 0, W, H); ctx.globalAlpha = 1;
  const b = boite(e), sp = sprite(p, e), clair = ((p.t * 6) | 0) % 4 === 0 && blanc(e);
  ctx.drawImage(clair ? blanc(e) : sp, Math.round(b.x + Math.sin(p.t * 40) * 0.8), Math.round(b.y), Math.round(b.w), Math.round(b.h));
  for (let i = 0; i < 3; i++) { const an = p.t * 6 + i * 2.1; R(ctx, '#fff27a', Math.round(e.x + Math.cos(an) * b.w * 0.45), Math.round(b.y - 3 + Math.sin(an) * 3), 2, 2); }
  const graine = e.id * 97;
  S.traits.forEach((T, k) => {
    if (k < S.i) { sel(ctx, T.coins, graine + k * 50); return; }
    // le guide : un grain pâle tous les 5 pixels
    ctx.fillStyle = '#7a6a9a'; semer(T.coins).forEach(([x, y], i) => { if (i % 5 === 0) ctx.fillRect(Math.round(x), Math.round(y), 1, 1); });
  });
  const T = S.trace, cour = S.traits[S.i];
  if (T) {
    const c = T.cand.reduce((x, y) => (y.i > x.i ? y : x));
    if (c.i > 1) sel(ctx, c.l.slice(0, c.i).concat([[T.x, T.y]]), graine + S.i * 50 + (c.l === cour.jalons ? 0 : 25));
    // quelques grains tombent sous le doigt qui verse
    for (let k = 0; k < 4; k++) R(ctx, '#ffffff', T.x + (h32(k + ((p.t * 20) | 0)) - 0.5) * 4, T.y - 10 + ((p.t * 40 + k * 4) % 10), 1, 1);
  } else {
    // le point qui brille, numéroté quand le sceau a deux traits
    const [sx, sy] = cour.jalons[0], r = 6 + (((t * 4) | 0) & 1);
    ctx.strokeStyle = NOIR; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#fff27a'; ctx.lineWidth = 1; ctx.stroke();
    if (S.traits.length > 1) ecrire(ctx, String(S.i + 1), sx - 2, sy - 3, { coul: '#fff27a', contour: NOIR });
    else R(ctx, '#fff27a', sx - 1, sy - 1, 3, 3);
  }
  // le temps qui reste : une bande sous le sceau, verte puis rouge qui clignote
  const tous = S.traits.flatMap((q) => q.coins), haut = Math.min(...tous.map((q) => q[1])), bas = Math.max(...tous.map((q) => q[1]));
  const k = Math.max(0, S.reste / S.duree), bw = S.r * 2, bx = S.cx - S.r, by = Math.round(Math.min(H - 20, bas + 7));
  R(ctx, NOIR, bx - 1, by - 1, bw + 2, 5); R(ctx, '#3a2a4a', bx, by, bw, 3);
  R(ctx, k < 0.3 && ((t * 8) | 0) & 1 ? '#ffffff' : k < 0.3 ? '#ff3030' : '#6ee03a', bx, by, Math.round(bw * k), 3);
  // au-dessus : les traits du sceau, puis (la Gouvernante) combien de sceaux il reste
  const marques = [];
  if (S.traits.length > 1) S.traits.forEach((q, i) => marques.push(i < S.i ? '#6ee03a' : i === S.i ? '#fff27a' : '#5a4a6a'));
  if (S.total > 1) { if (marques.length) marques.push(null); for (let i = 0; i < S.total; i++) marques.push(i < S.n ? '#6ee03a' : i === S.n ? '#ff8ad0' : '#5a4a6a'); }
  marques.forEach((col, i) => {
    if (!col) return;
    const x = Math.round(S.cx - (marques.length - 1) * 4 + i * 8), y = Math.round(haut - 13);
    R(ctx, NOIR, x - 3, y, 6, 6); R(ctx, col, x - 2, y + 1, 4, 4);
  });
}
// ce qu'il reste d'un sceau : le sel qui s'illumine et s'efface, ou qui s'éparpille
function selsVue(ctx, v) {
  for (const q of v.sels) {
    const k = q.t / 0.8;
    ctx.globalAlpha = 1 - k;
    if (q.eclat) {
      ctx.globalAlpha = (1 - k) * 0.3;
      for (const tr of q.traits) { ctx.strokeStyle = '#8ae8ff'; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(tr[0][0], tr[0][1]); for (const [x, y] of tr) ctx.lineTo(x, y); ctx.stroke(); }
      ctx.globalAlpha = 1 - k;
      q.traits.forEach((tr, i) => sel(ctx, tr, 300 + i * 50, '#e0faff'));
    } else q.traits.forEach((tr, i) => sel(ctx, tr, 300 + i * 50, '#c8c0d0', k * 6));
    ctx.globalAlpha = 1;
  }
}

// la couleur de la chauffe, au cœur du rayon : blanc, puis jaune, puis rouge
const couleurChauffe = (c) => c > 0.75 ? '#ff3a2a' : c > 0.5 ? '#ffd23a' : '#ffffff';

function rayonDessin(ctx, p) {
  if (!p.tire) return;
  const P = p.peche, force = !!P && P.coup > 0 && !P.bien;
  const x0 = CANON.x, y0 = CANON.y - 2;
  let x1 = p.visee.x, y1 = p.visee.y, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  if (P) {
    // le rayon accroché au boss se courbe vers le doigt qui tire, et une onde court dessus
    x1 = P.e.x; y1 = P.e.y + 6; cx = (x0 + x1) / 2 + (p.visee.x - (x0 + x1) / 2) * 0.7; cy = (y0 + y1) / 2 + (p.visee.y - (y0 + y1) / 2) * 0.7;
  }
  const n = P ? 20 : 9, tremble = P ? 1.5 + p.chauffe * 3 : 8, amp = !P ? 0 : force ? 6 : P.coup > 0 || P.annonce ? 3.5 : 2;
  const lx = x1 - x0, ly = y1 - y0, ll = Math.hypot(lx, ly) || 1, nx = -ly / ll, ny = lx / ll, pts = [];
  for (let k = 0; k <= n; k++) {
    const f = k / n, a = (1 - f) * (1 - f), bq = 2 * f * (1 - f), c = f * f, j = k === 0 || k === n ? 0 : (Math.random() - 0.5) * tremble;
    const o = Math.sin(f * Math.PI) * amp * Math.sin(f * 16 - p.t * 32);
    pts.push([a * x0 + bq * cx + c * x1 + j + nx * o, a * y0 + bq * cy + c * y1 + j + ny * o]);
  }
  const coeurR = force ? (((p.t * 12) | 0) & 1 ? '#ffffff' : '#ff3a2a') : couleurChauffe(p.chauffe);
  const couleurs = p.ricoche ? [['#3fe8ff', 3, -2], ['#3fe8ff', 3, 2], ['#c8f8ff', 2, 0]] : [['#ff3fa4', 3, -2], ['#3fe8ff', 3, 2], [coeurR, 2, 0]];
  for (const [col, l, dx] of /** @type {[string, number, number][]} */ (couleurs)) {
    ctx.strokeStyle = col; ctx.lineWidth = l; ctx.beginPath(); ctx.moveTo(pts[0][0] + dx, pts[0][1]);
    for (const [x, y] of pts) ctx.lineTo(x + dx, y);
    ctx.stroke();
  }
  ovale(ctx, x1, y1, 4, 4, coeurR);
}

function viseur(ctx, p, v) {
  const x = Math.round(p.visee.x), y = Math.round(p.visee.y);
  const sous = p.sous;
  const col = p.surchauffe ? '#ff5a3a' : p.ricoche ? '#3fe8ff' : sous && sous.type === 'lumi' ? '#ff8aa0' : p.tenu ? (p.tenu.type === 'chat' ? '#ff8aa0' : '#ff3030') : '#ffffff';
  ctx.globalAlpha = v.tactile && !p.tire ? 0.5 : 1;
  const seg = (c, o) => { R(ctx, c, x - 8 - o, y - o, 5 + 2 * o, 1 + 2 * o); R(ctx, c, x + 4 - o, y - o, 5 + 2 * o, 1 + 2 * o); R(ctx, c, x - o, y - 8 - o, 1 + 2 * o, 5 + 2 * o); R(ctx, c, x - o, y + 4 - o, 1 + 2 * o, 5 + 2 * o); };
  seg(NOIR, 1); seg(col, 0);
  // la chauffe se lit LÀ où l'on regarde : un anneau autour du viseur, vert, jaune, puis rouge qui clignote
  const c = p.chauffe;
  if (c > 0.02) {
    const r = 12, clig = c > 0.75 && ((p.t * 8) | 0) & 1;
    ctx.lineWidth = 4; ctx.strokeStyle = NOIR; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = '#3a2a4a'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = p.surchauffe ? '#ff3a2a' : clig ? '#ffffff' : c > 0.75 ? '#ff3a2a' : c > 0.5 ? '#ffd23a' : '#6ee03a';
    ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, c)); ctx.stroke();
  }
  if (sous && sous.type === 'lumi') ecrire(ctx, '!', x + 9, y - 14, { coul: '#ff8aa0', contour: NOIR, gras: true });
  ctx.globalAlpha = 1;
}

// la capture : le fantôme s'étire et file le long du rayon jusque dans le piège (il ne bouge plus
// dans le moteur une fois capturé : x, y sont d'où il part)
function avale(ctx, p, e) {
  const sp = sprite(p, e), k = Math.min(1, e.tc / 0.45), kk = k * k, b = CANON, x0 = e.x, y0 = e.y;
  const x = x0 + (b.x - x0) * kk, y = y0 + (b.y - y0) * kk, ang = (Math.atan2(b.y - y0, b.x - x0) - Math.PI / 2) * k;
  const [tw, th] = ESPECES[e.type].taille, w = tw * e.s * (1 - 0.8 * k), h = th * e.s * (1 + 0.9 * k) * (1 - 0.6 * kk);
  ctx.globalAlpha = 0.5;
  for (let i = 1; i <= 5; i++) { const f = Math.max(0, kk - i * 0.06); R(ctx, i & 1 ? '#3fe8ff' : '#ff3fa4', x0 + (b.x - x0) * f - 1, y0 + (b.y - y0) * f - 1, 3, 3); }
  ctx.globalAlpha = 1 - k * 0.3;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.drawImage(((e.tc * 24) | 0) & 1 ? blanc(e) || sp : sp, Math.round(-w / 2), Math.round(-h / 2), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  ctx.restore(); ctx.globalAlpha = 1;
}

// le piège : ouvert quand il avale, il compte les captures ; dedans, le boss cogne
function piege(ctx, p, v) {
  const A = p.aspire, saute = !!A && A.bonk > 0, avale = p.ents.some((e) => e.etat === 'cap') || !!p.peche || (!!A && !A.dedans);
  const x = PIEGE.x + (saute ? Math.round((Math.random() - 0.5) * 6) : 0), y = PIEGE.y - (saute ? Math.round(8 * Math.sin(A.bonk / 0.2 * Math.PI)) : 0);
  v.piege = (v.piege || 0) + ((avale ? 1 : 0) - (v.piege || 0)) * 0.2;
  const o = A && !A.dedans ? 1.4 : v.piege;
  if (o > 0.05) {
    ctx.globalAlpha = 0.18 * Math.min(1, o); ctx.fillStyle = '#c8f8ff';
    ctx.beginPath(); ctx.moveTo(x - 9, y - 2); ctx.lineTo(x - 18, y - 30); ctx.lineTo(x + 18, y - 30); ctx.lineTo(x + 9, y - 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  // les deux mâchoires, qui s'ouvrent vers le haut
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(x + s * 15, y - 1); ctx.rotate(-s * o * 1.1);
    R(ctx, NOIR, s > 0 ? -16 : 0, -2, 16, 4); R(ctx, '#8a8098', s > 0 ? -15 : 1, -1, 14, 2);
    ctx.restore();
  }
  R(ctx, NOIR, x - 16, y - 1, 32, 13); R(ctx, '#4a4258', x - 15, y, 30, 11); R(ctx, '#6a6078', x - 15, y, 30, 2);
  for (let i = 0; i < 6; i++) R(ctx, i & 1 ? NOIR : '#ffd23a', x - 15 + i * 5, y + 7, 5, 3);
  const lampe = o > 0.5 ? (((p.t * 8) | 0) & 1 ? '#ff3030' : '#ffd23a') : '#6a2030';
  R(ctx, lampe, x - 12, y + 3, 3, 3); R(ctx, lampe, x + 9, y + 3, 3, 3);
  ecrire(ctx, String(p.captures), x, y + 2, { centre: true, coul: '#c8f8ff' });
  if (saute) {
    // l'étoile du coup qu'il donne dedans
    const k = 1 - A.bonk / 0.2, sx = x + (A.bonks % 2 ? 10 : -10), sy = y - 8 - k * 6;
    for (let i = 0; i < 8; i++) {
      const an = i * Math.PI / 4, l = i & 1 ? 4 : 8;
      ctx.strokeStyle = NOIR; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(an) * l, sy + Math.sin(an) * l); ctx.stroke();
      ctx.strokeStyle = '#fff27a'; ctx.lineWidth = 1; ctx.stroke();
    }
  }
}

// la pêche : UN seul signe à suivre, le cercle vert (aucune flèche, aucun « ! » à comprendre)
// une main de 11 x 11, l'index levé : le bout du doigt se pose au centre du cercle
const MAIN = [
  '...##......', '..#ww#.....', '..#ww###...', '..#ww#ww##.', '.##ww#ww#w#', '#w#wwwwwww#',
  '#wwwwwwwww#', '.#wwwwwwww#', '.#wwwwwww#.', '..#wwwwww#.', '..########.',
];
function main(ctx, x, y) { MAIN.forEach((l, j) => [...l].forEach((ch, i) => { if (ch !== '.') R(ctx, ch === '#' ? NOIR : '#ffffff', x - 3 + i, y + j, 1, 1); })); }

// le cercle de la pêche (maquette P3 choisie par Julie le 2026-11-01 : un nouveau joueur ne le
// comprenait pas) : tant que le doigt n'y est pas, une main tapote dedans et « TIENS ICI » ;
// autour, la jauge jaune de la prise, qui se remplit quand on tient bien
function cercle(ctx, p) {
  const P = p.peche, x = Math.round(P.zx), y = Math.round(P.zy), r = PECHE.cercle * (1 + 0.1 * Math.sin(p.t * 8));
  const dedans = P.bien && p.tire;
  if (!dedans) {
    // pas dedans : des points filent du viseur vers le cercle
    const vx = x - p.visee.x, vy = y - p.visee.y, d = Math.hypot(vx, vy);
    if (d > r + 6) for (let s = ((p.t * 40) % 7) + 8; s < d - r; s += 7) R(ctx, '#d8ffd0', Math.round(p.visee.x + vx / d * s) - 1, Math.round(p.visee.y + vy / d * s) - 1, 2, 2);
  }
  if (dedans) { ctx.globalAlpha = 0.45; ctx.fillStyle = '#6ee03a'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.lineWidth = 5; ctx.strokeStyle = NOIR; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 3; ctx.strokeStyle = '#6ee03a'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  // la prise, autour
  const rj = PECHE.cercle + 5;
  ctx.lineWidth = 6; ctx.strokeStyle = NOIR; ctx.beginPath(); ctx.arc(x, y, rj, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 4; ctx.strokeStyle = '#3a2a4a'; ctx.stroke();
  if (P.prog > 0.005) { ctx.strokeStyle = P.coup > 0 && !P.bien ? '#ff3a2a' : '#ffd23a'; ctx.beginPath(); ctx.arc(x, y, rj, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, P.prog)); ctx.stroke(); }
  if (!dedans) { main(ctx, x, y - 1 + (((p.t * 3) | 0) & 1) * 2); ecrire(ctx, 'TIENS ICI', x, y - rj - 13, { centre: true, coul: '#d8ffd0', contour: NOIR, gras: true }); }
  else ecrire(ctx, 'RAMÈNE-LE !', x, y - rj - 13, { centre: true, coul: '#ffd23a', contour: NOIR, gras: true });
}

// la tête de chaque boss, en pixels de son dessin : yeux, bouche, épaules
const VISAGES = {
  majordome: { yeux: [[13.5, 8], [18.5, 8]], bouche: [16, 14], epaules: [[11, 19], [21, 19]] },
  bibliothecaire: { yeux: [[16, 12], [24, 12]], bouche: [20, 19], epaules: [[14, 24], [27, 23]] },
  chef: { yeux: [[17, 12.5], [23, 12.5]], bouche: [20, 19.5], epaules: [[14, 24], [26, 24]] },
  gouvernante: { yeux: [[16.5, 13.5], [23.5, 13.5]], bouche: [20, 18.5], epaules: [[14, 25], [26, 25]] },
};

// le boss pêché ou aspiré : penché, étiré, gonflé, des bras, et la tête qui va avec
function bossPeche(ctx, p, e) {
  const P = p.peche, A = p.aspire, sp = sprite(p, e), V = VISAGES[e.type] || VISAGES.majordome;
  let rot = 0, sx = 1, sy = 1, humeur = 'effort', clair = false, jx = 0;
  if (P) {
    if (P.annonce) { const g = 1.08 + 0.06 * Math.sin(p.t * 40); sx = g; sy = g; rot = -P.dir * 0.15; humeur = 'colere'; jx = (Math.random() - 0.5) * 3; }
    else if (P.coup > 0) { sx = 1.18; sy = 0.86; rot = P.dir * 0.45; humeur = 'colere'; jx = (Math.random() - 0.5) * 6; }
    else { rot = P.dir * 0.22; if (P.bien && p.tire) { sx = 0.9; sy = 1.12; } }
    clair = p.tire && P.bien && ((p.t * 16) | 0) % 4 === 0;
  } else if (A) { humeur = 'panique'; rot = A.spin; sx = A.taille / Math.sqrt(A.etire); sy = A.taille * A.etire; if (A.t < ASPIRE.choc) jx = (Math.random() - 0.5) * 2; }
  const [tw, th] = ESPECES[e.type].taille, kx = tw / sp.width, ky = th / sp.height;
  if (!A) { ctx.globalAlpha = 0.35; ovale(ctx, e.x, Math.min(176, 118 + (e.s - 0.5) * 30), tw * e.s * 0.3, 2 + e.s, NOIR); ctx.globalAlpha = 1; }
  ctx.save(); ctx.translate(Math.round(e.x + jx), Math.round(e.y)); ctx.rotate(rot); ctx.scale(e.s * sx * kx, e.s * sy * ky); ctx.translate(-sp.width / 2, -sp.height / 2);
  // les bras qui battent l'air (aspiré) ou qui s'arc-boutent (pêché)
  const bat = A ? Math.sin(p.t * 34) : 0;
  V.epaules.forEach(([ex, ey], i) => {
    const c = i ? 1 : -1, a = A ? -Math.PI / 2 + c * (0.9 + bat * 0.8) : P && P.coup > 0 ? c * 0.3 + Math.PI / 2 : Math.PI / 2 + c * 0.6;
    const hx = ex + Math.cos(a) * 12, hy = ey + Math.sin(a) * 12;
    ctx.strokeStyle = NOIR; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.strokeStyle = '#3a3050'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
    ovale(ctx, hx, hy, 2, 2, '#ffffff');
  });
  ctx.drawImage(clair && blanc(e) ? blanc(e) : sp, 0, 0);
  visage(ctx, p, V, humeur);
  ctx.restore();
  if (A && A.t > ASPIRE.choc) {
    const j = () => (Math.random() - 0.5) * 2;
    ecrire(ctx, A.t < ASPIRE.lutte ? 'NOOOON !' : 'AAAAH !', e.x + j(), e.y - th * e.s * A.taille / 2 - 8 + j(), { centre: true, coul: '#ffffff', contour: NOIR, gras: true });
  } else if (A) ecrire(ctx, '!!', e.x, e.y - th * e.s / 2 - 14, { centre: true, sc: 2, coul: '#fff27a', contour: NOIR });
}

// la tête par-dessus le dessin : sourcils et dents serrées à la pêche, panique dans le tourbillon
function visage(ctx, p, V, humeur) {
  const [mx, my] = V.bouche, [[ax, ay], [bx, by]] = V.yeux;
  if (humeur === 'panique') {
    for (const [x, y] of V.yeux) { ovale(ctx, x, y, 2.8, 3, NOIR); ovale(ctx, x, y, 2.2, 2.4, '#ffffff'); R(ctx, NOIR, x - 0.5 + Math.sin(p.t * 20), y - 0.5, 1, 1); }
    ovale(ctx, mx, my + 0.5, 2.6, 3.2, NOIR); ovale(ctx, mx, my + 1, 1.6, 2, '#a01030');
    ctx.strokeStyle = NOIR; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax - 3, ay - 4); ctx.lineTo(ax + 1.5, ay - 5.5); ctx.moveTo(bx - 1.5, by - 5.5); ctx.lineTo(bx + 3, by - 4); ctx.stroke();
    R(ctx, '#8ad8ff', bx + 3.5, by - 5 + ((p.t * 30) % 4), 1, 2); R(ctx, '#8ad8ff', ax - 4.5, ay - 3 + ((p.t * 26) % 5), 1, 2);
    return;
  }
  const dur = humeur === 'colere';
  ctx.strokeStyle = NOIR; ctx.lineWidth = 1.2; ctx.beginPath();
  ctx.moveTo(ax - 3, ay - (dur ? 4.5 : 3.5)); ctx.lineTo(ax + 1.5, ay - 2); ctx.moveTo(bx - 1.5, by - 2); ctx.lineTo(bx + 3, by - (dur ? 4.5 : 3.5)); ctx.stroke();
  if (dur) for (const [x, y] of V.yeux) R(ctx, ((p.t * 12) | 0) & 1 ? '#ff3030' : '#fff27a', x - 1, y - 1, 2, 2);
  R(ctx, NOIR, mx - 3.5, my - 1.5, 7, 3); R(ctx, '#ffffff', mx - 3, my - 1, 6, 2); R(ctx, NOIR, mx - 3, my - 0.2, 6, 0.6);
}

// le tourbillon vert qui se lève du piège : des coups de pinceau qui tournent (plus vite au centre)
// et filent vers le cœur, comme le mafuba ; un entonnoir de lumière le relie au piège
const PINCEAU = Array.from({ length: 110 }, (_, i) => {
  const h = (n) => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
  return { r: h(1), a: h(2) * Math.PI * 2, l: 0.35 + h(3) * 0.8, w: 0.6 + h(4) * 0.9, c: (h(5) * 5) | 0 };
});
function tourbillon(ctx, p) {
  const A = p.aspire, t = A.t, cx = ASPIRE.cx, cy = A.cy;
  const e = t < 0.3 ? 0 : t < 0.8 ? (t - 0.3) / 0.5 : t < ASPIRE.avale ? 1 : Math.max(0, 1 - (t - ASPIRE.avale) / 0.35);
  if (e <= 0) return;
  const Rm = 230 * e;
  ctx.globalAlpha = 0.55 * e; ctx.fillStyle = '#0c3412'; ctx.fillRect(-8, -8, W + 16, H + 16);
  ctx.globalAlpha = 0.25 * e; ctx.fillStyle = '#d8ffb0'; ctx.beginPath(); ctx.ellipse(cx, cy, Rm * 0.3, Rm * 0.24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.5 * e; ctx.fillStyle = '#f0fff0';
  ctx.beginPath(); ctx.moveTo(CANON.x - 8, CANON.y); ctx.lineTo(cx - 22 * e, cy); ctx.lineTo(cx + 22 * e, cy); ctx.lineTo(CANON.x + 8, CANON.y); ctx.fill();
  const cols = ['#145a24', '#1f8a3a', '#6ee03a', '#b8ff8a', '#f0fff0'];
  ctx.lineCap = 'round';
  for (const q of PINCEAU) {
    const r = Rm * ((((q.r - t * 0.25) % 1) + 1) % 1) + 6, a = q.a + t * (2 + 140 / (r + 20));
    ctx.strokeStyle = cols[q.c]; ctx.globalAlpha = 0.85 * e * Math.min(1, r / 30); ctx.lineWidth = Math.max(1, r * 0.09 * q.w);
    ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.8, 0, a, a + q.l); ctx.stroke();
  }
  ctx.lineCap = 'butt'; ctx.globalAlpha = 1;
  ovale(ctx, cx, cy, 12 * e, 9 * e, '#ffffff');
}

// à la pêche, ce qui part du boss : la sueur quand on le tient, des étincelles quand la ligne force
function gouttes(p, v) {
  const P = p.peche;
  if (!P || !p.tire) return;
  const b = P.e;
  if (P.bien && Math.random() < 0.14) v.parts.push({ x: b.x + (Math.random() - 0.5) * 14 * b.s, y: b.y - 16 * b.s, vx: (Math.random() - 0.5) * 70, vy: -50 - Math.random() * 30, t: 0, vie: 0.5, col: '#8ad8ff' });
  if (((P.coup > 0 && !P.bien) || p.chauffe > 0.6) && Math.random() < 0.5) v.parts.push({ x: b.x + (Math.random() - 0.5) * 6, y: b.y + 6, vx: (Math.random() - 0.5) * 120, vy: -40 - Math.random() * 60, t: 0, vie: 0.35, col: Math.random() < 0.5 ? '#fff27a' : '#ffffff' });
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
  if (p.boss && !p.boss.mort && p.boss.etat !== 'cap') {
    // sa vie, puis à la pêche la prise : une barre jaune qui se remplit vers le piège
    const bw = 120, bx = 100, gard = protege(p, p.boss), P = p.peche;
    ecrire(ctx, ESPECES[p.boss.type].nom, 160, 4, { centre: true, coul: '#ffffff', contour: NOIR });
    if (P) { R(ctx, NOIR, bx - 1, 13, bw + 2, 6); R(ctx, '#3a2a10', bx, 14, bw, 4); R(ctx, '#ffd23a', bx, 14, Math.round(bw * Math.min(1, P.prog)), 4); }
    else if (!p.aspire) { R(ctx, NOIR, bx - 1, 13, bw + 2, 6); R(ctx, gard ? '#3fe8ff' : '#b46cff', bx, 14, Math.round(bw * Math.max(0, p.boss.pv) / p.boss.pv0), 4); }
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
  } else if (p.etat === 'jeu' && p.consigne && !p.sceau) {
    const t = p.consigne.texte.replace('{GARDE}', v.tactile ? 'GARDE LE DOIGT' : 'GARDE LE CLIC').replace('{TORCHE}', v.tactile ? 'GARDE LE BOUTON TORCHE' : 'GARDE LE CLIC DROIT').replace('{SUPER}', v.tactile ? 'BOUTON SUPER' : 'TOUCHE E');
    ecrire(ctx, t, 160, p.boss ? 24 : (A.super ? 30 : 22), { centre: true, coul: '#fff27a', contour: NOIR, gras: true });
  }
  for (const t of v.textes) ecrire(ctx, t.s, t.x, t.y - t.t * 14, { centre: true, sc: t.sc || 1, coul: t.col, contour: NOIR, gras: !t.sc, alpha: Math.min(1, (t.vie - t.t) * 3) });
  if (p.etat === 'jeu' && !p.aspire && !p.sceau) viseur(ctx, p, v);
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
