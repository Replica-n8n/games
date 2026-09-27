/* Le combat, en fonctions PURES (tests/combat.test.js). Minus lance une pensée ; chaque
   pensée a SA meilleure réponse (la phrase de la même paire) : « super efficace ». Les
   autres phrases aident un peu, jamais de punition, et la même pensée revient tant que
   la meilleure n'a pas été trouvée. Minus ne disparaît jamais : à 0 il est minuscule. */

function melanger(liste, hasard) {
  const l = [...liste];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}

export function combatDepart(paires, regles, bonus, hasard) {
  const themes = Object.fromEntries(paires.map((p) => [p.id, p.theme]));
  return { ordre: melanger(paires.map((p) => p.id), hasard), themes, pensee: 0, minus: regles.tailleMinusDepart, plus: bonus, tour: 1 };
}

/* Les ids des phrases proposées : la meilleure et d'autres, mélangées à chaque tour
   pour que la bonne ne soit jamais toujours à la même place. Les autres viennent D'ABORD
   du même thème : face au monstre sous le lit, une phrase sur les chiens ne tenterait
   personne, et l'enfant n'aurait rien à réfléchir. */
export function choixDuTour(c, hasard, nombre = 3) {
  const meilleure = c.ordre[c.pensee];
  const theme = c.themes ? c.themes[meilleure] : undefined;
  const autres = c.ordre.filter((id) => id !== meilleure);
  const memeTheme = melanger(autres.filter((id) => (c.themes ? c.themes[id] : undefined) === theme), hasard);
  const reste = melanger(autres.filter((id) => (c.themes ? c.themes[id] : undefined) !== theme), hasard);
  return melanger([meilleure, ...[...memeTheme, ...reste].slice(0, nombre - 1)], hasard);
}

export function combatGagne(c) {
  return c.minus <= 0;
}

/* Rend { combat, resultat } : "super", "autre", "gagne", ou "rien" (réponse ignorée). */
export function repondre(c, phraseId, regles) {
  if (combatGagne(c) || !c.ordre.includes(phraseId)) return { combat: c, resultat: "rien" };
  const meilleure = phraseId === c.ordre[c.pensee];
  const d = meilleure ? regles.degatsMeilleurePhrase : regles.degatsAutrePhrase;
  const suivant = {
    ...c,
    minus: Math.max(0, c.minus - d),
    plus: Math.min(regles.forcePlusMax, c.plus + d),
    pensee: meilleure ? (c.pensee + 1) % c.ordre.length : c.pensee,
    tour: c.tour + 1,
  };
  return { combat: suivant, resultat: combatGagne(suivant) ? "gagne" : meilleure ? "super" : "autre" };
}
