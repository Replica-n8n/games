// Pilotage des 4 modules. Validé en jeu par Julie (POC 3, 2026-10-19).
//
// direct (avion) : le module glisse vers la cible que le doigt déplace (lissage).
// elan (rover, sous-marin, vaisseau) : le module veut la VITESSE du doigt, avec une
// accélération bornée ; doigt levé, il glisse sur sa lancée et ralentit.
// ⚠️ Jamais de ressort vers un point fixe : essayé, il faisait trembler le module au
// lâcher (11 à 24 demi-tours) et annulait les courants (1 px de dérive au lieu de 164).
import { W, H } from './constantes.js';

/** @typedef {{ type: 'direct'|'elan', lissage?: number, acc?: number, frX?: number, frY?: number, vmax?: number, vmaxY?: number, zone: [number, number], bas?: boolean }} Module */

/** Plafond du module : au-dessus, c'est là où les ennemis arrivent. Un enfant y montait
 *  sans cesse et s'y faisait toucher à l'apparition (vu en jeu le 2026-10-22). Le même
 *  pour tous : le rover, bloqué à 48 % (la « moitié basse » de la POC 3), se sentait à
 *  l'étroit (Julie, 2026-10-22). Un trait s'allume quand on s'y appuie. */
export const PLAFOND = Math.round(H * 0.375);

/** @type {Record<string, Module>} */
export const MODULES = {
  avion:     { type: 'direct', lissage: 0.35, zone: [PLAFOND, H - 100] },
  rover:     { type: 'elan', acc: 0.45, frX: 0.95, frY: 0.88, vmax: 5.5, vmaxY: 3, zone: [PLAFOND, H - 100] },
  sousmarin: { type: 'elan', acc: 0.16, frX: 0.975, frY: 0.975, vmax: 3.4, vmaxY: 3.4, zone: [PLAFOND, H - 100], bas: true },
  vaisseau:  { type: 'elan', acc: 1.1, frX: 0.95, frY: 0.95, vmax: 9, vmaxY: 9, zone: [PLAFOND, H - 100] },
};

const borne = (v, a, b) => Math.max(a, Math.min(b, v));

/** @param {Module} M */
export function nouveauJoueur(M) {
  const y = Math.min(M.zone[1], H - 140);
  return { x: W / 2, y, cx: W / 2, cy: y, vx: 0, vy: 0, wx: 0, wy: 0, inv: 0, cad: 0, z: 0, saut: 0 };
}

/**
 * Une image de pilotage.
 * @param {ReturnType<typeof nouveauJoueur>} j
 * @param {Module} M
 * @param {{ touche: boolean, dx: number, dy: number }} entree  glissement du doigt pendant cette image
 * @param {{ fx: number, fy: number, lent: number }} [forces]  courants, attraction (en px/image²), ralentissement du sol
 */
export function piloter(j, M, entree, forces = { fx: 0, fy: 0, lent: 1 }) {
  if (M.type === 'direct') {
    j.cx += entree.dx; j.cy += entree.dy;
    j.cx += forces.fx * 8; j.cy += forces.fy * 8; // une force déplace la cible : on lutte en glissant
    const px = j.x, py = j.y;
    j.x += (j.cx - j.x) * M.lissage; j.y += (j.cy - j.y) * M.lissage;
    j.vx = j.x - px; j.vy = j.y - py;
  } else {
    const vmax = M.vmax * forces.lent, vmaxY = M.vmaxY * forces.lent;
    // Vitesse du doigt lissée : les événements n'arrivent pas à chaque image
    j.wx = j.wx * 0.5 + entree.dx * 0.5; j.wy = j.wy * 0.5 + entree.dy * 0.5;
    if (entree.touche) { j.vx += borne(j.wx - j.vx, -M.acc, M.acc); j.vy += borne(j.wy - j.vy, -M.acc, M.acc); }
    else { j.vx *= M.frX; j.vy *= M.frY; j.wx = j.wy = 0; }
    j.vx += forces.fx; j.vy += forces.fy;
    j.vx = borne(j.vx, -vmax, vmax); j.vy = borne(j.vy, -vmaxY, vmaxY);
    if (Math.abs(j.vx) < 0.02) j.vx = 0;
    if (Math.abs(j.vy) < 0.02) j.vy = 0;
    j.x += j.vx; j.y += j.vy;
    j.cx = j.x; j.cy = j.y;
  }
  const [y0, y1] = M.zone;
  if (j.x < 16 || j.x > W - 16) j.vx = 0;
  if (j.y < y0 || j.y > y1) j.vy = 0;
  j.x = borne(j.x, 16, W - 16); j.y = borne(j.y, y0, y1);
  j.cx = borne(j.cx, 16, W - 16); j.cy = borne(j.cy, y0, y1);
}
