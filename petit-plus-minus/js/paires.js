/* « Les paires », en fonctions PURES. Toutes les cartes sont visibles (le mémo à cartes
   cachées se jouait au hasard, vu au test de l'enfant) : Minus à gauche, les phrases à
   droite, l'enfant touche une pensée de Minus puis la phrase qui lui répond. */
import { melanger } from "./jeu.js";

export function nouvellesPaires(paires, nombre, hasard) {
  const ids = melanger(paires, hasard).slice(0, nombre).map((p) => p.id);
  return { ids, gauche: melanger(ids, hasard), droite: melanger(ids, hasard), faites: [], choisi: null };
}

/* cote : "minus" ou "plus". Rend { paires, evenement } : "choisi", "paire", "rate",
   "dabord" (une phrase touchée avant une pensée), ou "rien" (le même objet est rendu). */
export function toucherPaire(p, cote, id) {
  if (!p.ids.includes(id) || p.faites.includes(id)) return { paires: p, evenement: "rien" };
  if (cote === "minus") return { paires: { ...p, choisi: id }, evenement: "choisi" };
  if (p.choisi === null) return { paires: p, evenement: "dabord" };
  if (p.choisi === id) return { paires: { ...p, faites: [...p.faites, id], choisi: null }, evenement: "paire" };
  return { paires: p, evenement: "rate" };
}

export function pairesFinies(p) {
  return p.faites.length === p.ids.length;
}
