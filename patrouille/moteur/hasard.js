// Hasard à graine : même graine, même suite. Le moteur n'utilise JAMAIS Math.random,
// sinon une partie ne se rejoue plus à l'identique (bancs, robot, équilibrage).

/**
 * @param {number} graine
 */
export function creeHasard(graine = 1) {
  let s = graine >>> 0 || 1;
  const suivant = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  return {
    suivant,
    /** @param {number} a @param {number} b */
    entre: (a, b) => a + suivant() * (b - a),
    /** @param {number} n */
    entier: (n) => Math.floor(suivant() * n),
    /** @template T @param {T[]} t @returns {T} */
    choix: (t) => t[Math.floor(suivant() * t.length)],
    /** Tire une clé selon ses poids. @param {Record<string, number>} poids */
    pondere(poids) {
      let total = 0;
      for (const k in poids) total += poids[k];
      let r = suivant() * total;
      for (const k in poids) if ((r -= poids[k]) < 0) return k;
      return Object.keys(poids)[0];
    },
  };
}
