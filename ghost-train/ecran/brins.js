// La couleur des deux brins d'un rayon de la boutique, au point f (0 au piège, 1 au bout) :
// fixe, ou qui file le long du rayon pour l'arc-en-ciel. Le cœur, lui, reste celui de la chauffe.
/** @param {import('../contenu/rayons.js').Rayon} r @param {0 | 1} cote @param {number} f @param {number} t */
export function brin(r, cote, f, t) {
  if (!r.arc) return cote ? r.b : r.a;
  return `hsl(${((f * 300 + t * 200 + cote * 160) % 360) | 0} 100% 62%)`;
}
