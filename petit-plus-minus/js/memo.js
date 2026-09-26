/* Mémo des phrases, en fonctions PURES : chaque pensée de Minus retrouve la phrase de
   Plus qui lui répond. Le hasard est passé en paramètre (tests/entrainement.test.js). */

function melanger(liste, hasard) {
  const l = [...liste];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}

export function nouveauMemo(paires, nombre, hasard) {
  const choisies = melanger(paires, hasard).slice(0, nombre);
  const cartes = choisies.flatMap((p) => [{ paire: p.id, sorte: "minus" }, { paire: p.id, sorte: "plus" }]);
  return { cartes: melanger(cartes, hasard), ouvertes: [], trouvees: [], verrou: false };
}

/* Rend { memo, evenement } : "ouverte", "paire" (avec son id), "rate" (le mémo reste
   verrouillé jusqu'à refermer()), ou "rien" (appui ignoré, le même mémo est rendu). */
export function toucherCarte(m, i) {
  const c = m.cartes[i];
  if (!c || m.verrou || m.ouvertes.includes(i) || m.trouvees.includes(c.paire)) return { memo: m, evenement: "rien" };
  const ouvertes = [...m.ouvertes, i];
  if (ouvertes.length < 2) return { memo: { ...m, ouvertes }, evenement: "ouverte" };
  const [a, b] = ouvertes.map((k) => m.cartes[k]);
  if (a.paire === b.paire && a.sorte !== b.sorte) {
    return { memo: { ...m, ouvertes: [], trouvees: [...m.trouvees, a.paire] }, evenement: "paire", paire: a.paire };
  }
  return { memo: { ...m, ouvertes, verrou: true }, evenement: "rate" };
}

export function refermer(m) {
  return { ...m, ouvertes: [], verrou: false };
}

export function memoGagne(m) {
  return m.trouvees.length * 2 === m.cartes.length;
}
