// Les espaces de la typographie française : une espace INSÉCABLE avant ; : ! ?
// et », après «. Avec une espace ordinaire, le navigateur peut couper la ligne
// juste avant le signe (« ; il l'a appris » commençait une ligne, vu dans un
// verdict). Fine (U+202F) avant ; ! ?, normale insécable (U+00A0) avant : et
// dans les guillemets.

/** @param {string} s */
export const fine = (s) => s
  .replace(/ ([;!?])/g, ' $1')
  .replace(/ ([:»])/g, ' $1')
  .replace(/« /g, '« ');

/**
 * Le même objet, chaque texte passé par `fine` : les chaînes, ce que rendent
 * les fonctions, et ce qu'il y a dans les tableaux et sous-objets.
 * @template T @param {T} x @returns {T}
 */
export function affine(x) {
  if (typeof x === 'string') return /** @type {T} */ (/** @type {unknown} */ (fine(x)));
  if (typeof x === 'function') {
    const f = /** @type {(...a: unknown[]) => unknown} */ (/** @type {unknown} */ (x));
    return /** @type {T} */ (/** @type {unknown} */ ((/** @type {unknown[]} */ ...a) => affine(f(...a))));
  }
  if (Array.isArray(x)) return /** @type {T} */ (/** @type {unknown} */ (x.map(affine)));
  if (x && typeof x === 'object') return /** @type {T} */ (Object.fromEntries(Object.entries(x).map(([k, v]) => [k, affine(v)])));
  return x;
}
