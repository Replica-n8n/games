// Du monde à l'écran. Le moteur calcule lui-même où chaque chose se dessine :
// la visée se fait en pixels d'écran, et l'écran dessine aux MÊMES boîtes.
import { CX, FOCALE } from './constantes.js';

/** @param {any} p @param {number} x @param {number} y @param {number} z */
export function projeter(p, x, y, z) {
  const d = z - p.camZ;
  if (d < 0.25) return null;
  const s = FOCALE / d;
  return { x: CX + x * s, y: p.horizon + y * s, s, d };
}

/** La boîte d'une entité à l'écran, ou null si elle est derrière la caméra. @param {any} p @param {any} e */
export function boite(p, e) {
  const pr = projeter(p, e.x + e.ox, e.y + e.oy, e.z);
  if (!pr) return null;
  const t = Math.max(2, e.taille * pr.s);
  return { x: pr.x - t / 2, y: pr.y - t / 2, w: t, h: t, cx: pr.x, cy: pr.y, d: pr.d, s: pr.s };
}

/** @param {any} p */
export function calerBoites(p) { for (const e of p.ents) e.boite = boite(p, e); }

/** Le point (x, y) est-il dans la boîte, agrandie de m pixels ? @param {any} b @param {number} x @param {number} y @param {number} m */
export const dans = (b, x, y, m) => !!b && x >= b.x - m && x <= b.x + b.w + m && y >= b.y - m && y <= b.y + b.h + m;
