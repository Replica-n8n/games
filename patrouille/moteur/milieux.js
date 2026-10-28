// Ce que le monde fait au module.
// Jungle : le feuillage (au-dessus du sol, des plantes s'y cachent).
// Désert : le sol du rover (POC 3 validée par Julie le 2026-10-19). Les rochers bloquent
// le rover ET les tirs, des deux côtés : on peut s'y abriter ; le sable mou ralentit de
// moitié ; un tremplin fait sauter, et en l'air rien ne touche.
// L'Océan (courants) et la Ceinture (attraction) viendront avec leurs tranches ;
// forces() est déjà le point d'entrée du pilotage.
import { DEFIL, H } from './constantes.js';

/**
 * Une touffe de feuillage : au-dessus du sol, sous le module. Des plantes s'y cachent.
 * @param {any} p @param {number} x @param {number} r @param {number} [y]
 */
export function feuillage(p, x, r, y = -r) {
  const bouts = Array.from({ length: 6 }, () => [p.hv.entre(-0.7, 0.7), p.hv.entre(-0.7, 0.7), p.hv.entre(0.45, 0.7)]);
  const t = { k: 'feuille', x, y, r, bouts };
  p.terrain.push(t);
  return t;
}

/** Un rocher (Désert) : il bloque le rover et arrête les tirs. @param {any} p */
export function rocher(p, x, r = 22, y = -r) { const t = { k: 'rocher', x, y, r, forme: p.hv.entier(4) }; p.terrain.push(t); return t; }
/** Une plaque de sable mou : y est son bord haut. @param {any} p */
export function sable(p, x, w = 130, h = 100, y = -h) { const t = { k: 'sable', x, y, w, h }; p.terrain.push(t); return t; }
/** Durée d'un saut, en images. 80 : assez pour passer par-dessus une muraille de rochers. */
export const SAUT = 80;
/**
 * Un tremplin : y est son centre. Au-dessus, un arc de cristaux qu'on n'attrape qu'en
 * l'air (la récompense du saut, comme les pièces de Mario) : il défile avec le sol et
 * passe sous le rover pendant le saut. @param {any} p
 */
export function tremplin(p, x, y = -24, cristaux = true) {
  const t = { k: 'tremplin', x, y, w: 64, h: 26 };
  p.terrain.push(t);
  if (cristaux) for (let i = 0; i < 5; i++) p.objets.push({ k: 'cristalHaut', x, y: y - 22 - i * 15, h: Math.sin(((i + 1) / 6) * Math.PI) });
  return t;
}
/** Une muraille de rochers sur toute la largeur, et un tremplin pour la sauter. @param {any} p */
export function muraille(p, xTremplin, y = -20) {
  for (let x = 18; x <= 342; x += 34) rocher(p, x, 16, y);
  tremplin(p, xTremplin, y + 34, false);
}

/** Fait défiler le terrain avec le décor et oublie ce qui est sorti. @param {any} p */
export function majMilieux(p) {
  for (const t of p.terrain) t.y += DEFIL;
  p.terrain = p.terrain.filter((t) => t.y < H + 160);
}

const auSol = (p) => p.module === 'rover' && p.j.z < 0.3;

/** Le rover roule-t-il dans du sable mou ? @param {any} p */
export function surSable(p) {
  const j = p.j;
  return auSol(p) && p.terrain.some((t) => t.k === 'sable' && Math.abs(j.x - t.x) < t.w / 2 && j.y > t.y && j.y < t.y + t.h);
}

/** Forces appliquées au module cette image. Le sable mou ralentit le rover de moitié. @param {any} p */
export function forces(p) {
  return { fx: 0, fy: 0, lent: surSable(p) ? 0.5 : 1 };
}

/**
 * L'atterrissage : une onde qui étourdit les ennemis au sol tout proches (1,5 s sans
 * bouger ni tirer) et les blesse un peu. @param {any} p
 */
function atterrir(p) {
  const j = p.j;
  p.effets.push({ atterrit: true, x: j.x, y: j.y, vie: 24 });
  for (const e of p.ennemis) {
    if (!e.def.sol || e.cache || e.mort) continue;
    if ((e.x - j.x) ** 2 + (e.y - j.y) ** 2 > 90 * 90) continue;
    e.etourdi = 90; e.pv -= 1; e.flash = 4;
    if (e.pv <= 0) e.pv = 1; // l'onde étourdit, elle ne tue pas : le tir finit le travail
  }
  if (!p.vus.atterrir && p.ennemis.some((e) => e.etourdi)) { p.vus.atterrir = true; p.message('Atterrissage ! Les ennemis au sol sont sonnés', 2.5 * 60); }
}

/** Un point est-il dans un rocher ? (pour arrêter les tirs) @param {any} p */
export function dansRocher(p, b) {
  for (const t of p.terrain) if (t.k === 'rocher' && (b.x - t.x) ** 2 + (b.y - t.y) ** 2 < t.r * t.r) return t;
  return null;
}

/**
 * Après le pilotage : le rover bute contre les rochers (sauf en plein saut), un tremplin
 * le fait sauter, et il soulève de la poussière. @param {any} p
 */
export function solDuRover(p) {
  if (p.module !== 'rover') return;
  const j = p.j, [y0, y1] = p.M.zone;
  // Tremplin : un saut d'une seconde, la hauteur suit une demi-sinusoïde
  if (j.saut <= 0) for (const t of p.terrain) {
    if (t.k === 'tremplin' && Math.abs(j.x - t.x) < t.w / 2 && Math.abs(j.y - t.y) < t.h / 2) {
      j.saut = SAUT;
      if (!p.vus.saut) { p.vus.saut = true; p.message('Saut ! En l\'air, rien ne te touche', 2.5 * 60); }
    }
  }
  if (j.saut > 0) {
    j.saut--; j.z = Math.sin(((SAUT - j.saut) / SAUT) * Math.PI);
    if (j.saut === 0) atterrir(p);
  } else j.z = 0;
  if (j.z < 0.3) for (const t of p.terrain) {
    if (t.k !== 'rocher') continue;
    const dx = j.x - t.x, dy = j.y - t.y, d = Math.hypot(dx, dy) || 1, min = t.r + 13;
    if (d >= min) continue;
    const nx = dx / d, ny = dy / d;
    j.x = t.x + nx * min; j.y = t.y + ny * min;
    // Le rocher qui descend pousse le rover ; coincé en bas, il glisse sur le côté
    if (j.y > y1) { j.y = y1; j.x = t.x + (dx < 0 ? -1 : 1) * Math.sqrt(Math.max(0, min * min - (y1 - t.y) ** 2)); }
    if (j.y < y0) j.y = y0;
    const vn = j.vx * nx + j.vy * ny;
    if (vn < 0) { j.vx -= vn * nx; j.vy -= vn * ny; }
    j.cx = j.x; j.cy = j.y;
    if (!p.vus.rocher) { p.vus.rocher = true; p.message('Les rochers t\'abritent des tirs', 2.5 * 60); }
  }
  if (surSable(p) && !p.vus.sable) { p.vus.sable = true; p.message('Sable mou : ça ralentit', 2 * 60); }
  // Poussière : plus épaisse dans le sable ; tirée avec le hasard des effets (p.hv)
  const v = Math.hypot(j.vx, j.vy);
  if (j.z < 0.2 && v > 0.6) for (let k = 0; k < (surSable(p) ? 3 : 1); k++) {
    p.effets.push({ poussiere: true, x: j.x + p.hv.entre(-12, 12), y: j.y + 16, vx: p.hv.entre(-0.4, 0.4) - j.vx * 0.2, vy: DEFIL + p.hv.entre(0, 0.6), vie: 50, r: p.hv.entre(3, 6) });
  }
}
