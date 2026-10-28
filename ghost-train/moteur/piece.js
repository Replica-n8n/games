// La géométrie d'une pièce vue de face : un mur du fond, deux murs de côté, un
// plafond et un sol qui fuient vers le même point. Pur calcul : le contenu s'en
// sert pour placer cachettes et objets, l'écran pour les peindre aux mêmes places.
import { W, H } from './constantes.js';

/** Le mur du fond. */
export const FOND = { x0: 72, x1: 248, y0: 30, y1: 118 };

// w = profondeur : 0 au bord de l'écran, 1 au mur du fond (les pas proches prennent plus de place)
const fuite = (w) => (w * 2.6) / (1 + 1.6 * w);

/** Un point du mur de gauche (cote -1) ou de droite (cote 1) ; h de 0 (plafond) à 1 (sol). */
export function mur(cote, w, h) {
  const t = fuite(w), x = FOND.x0 * t;
  const yh = FOND.y0 * t, yb = H - (H - FOND.y1) * t;
  return [cote < 0 ? x : W - x, yh + h * (yb - yh)];
}
/** Le quadrilatère d'un morceau de mur de côté. */
export function quad(cote, w0, w1, h0, h1) { return [mur(cote, w0, h0), mur(cote, w1, h0), mur(cote, w1, h1), mur(cote, w0, h1)]; }
/** Un point du sol : u de -1 (gauche) à 1 (droite), w profondeur. */
export function sol(u, w) {
  const t = fuite(w);
  const xg = FOND.x0 * t, xd = W - FOND.x0 * t, y = H - (H - FOND.y1) * t;
  return [xg + (u + 1) / 2 * (xd - xg), y];
}
/** Un point du plafond. */
export function plafond(u, w) {
  const t = fuite(w);
  const xg = FOND.x0 * t, xd = W - FOND.x0 * t, y = FOND.y0 * t;
  return [xg + (u + 1) / 2 * (xd - xg), y];
}
