// Ce que le monde fait au module. Tranche 1 : le feuillage de la Jungle.
// Les sols du Désert, les courants de l'Océan et l'attraction de la Ceinture viennent
// avec leurs tranches ; forces() est déjà le point d'entrée du pilotage.
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

/** Fait défiler le terrain avec le décor et oublie ce qui est sorti. @param {any} p */
export function majMilieux(p) {
  for (const t of p.terrain) t.y += DEFIL;
  p.terrain = p.terrain.filter((t) => t.y < H + 160);
}

/** Forces appliquées au module cette image (aucune dans la Jungle). @param {any} p */
export function forces(p) {
  return { fx: 0, fy: 0, lent: 1 };
}
