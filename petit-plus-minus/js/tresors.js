/* Chasse aux 5 trésors (ancrage 5-4-3-2-1), en fonctions PURES. `etapes` est la liste
   des nombres de trésors par étape, lue dans contenu.json (5, 4, 3, 2, 1). */

export function tresorsDepart() {
  return { etape: 0, trouves: 0 };
}

export function tresorsFinis(t, etapes) {
  return t.etape >= etapes.length;
}

export function toucherTresor(t, etapes) {
  if (tresorsFinis(t, etapes) || t.trouves >= etapes[t.etape]) return t;
  return { ...t, trouves: t.trouves + 1 };
}

export function tresorSuivant(t, etapes) {
  if (tresorsFinis(t, etapes) || t.trouves < etapes[t.etape]) return t;
  return { etape: t.etape + 1, trouves: 0 };
}
