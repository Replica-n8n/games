/* « Réponds à Minus », en fonctions PURES (il remplace le combat). Minus dit une pensée,
   deux phrases sont proposées : la sienne, et une autre d'un AUTRE thème. Au test, trois
   choix d'un même thème faisaient hésiter l'enfant entre des phrases toutes justes. Une
   phrase qui ne répond pas ne coûte rien : la même pensée reste, on essaie l'autre. */
import { melanger } from "./jeu.js";

export function repondsDepart(paires, nombre, hasard) {
  return {
    ordre: melanger(paires, hasard).slice(0, nombre).map((p) => p.id),
    tous: paires.map((p) => p.id),
    themes: Object.fromEntries(paires.map((p) => [p.id, p.theme])),
    k: 0,
    essais: 0,
  };
}

export function repondsFini(r) {
  return r.k >= r.ordre.length;
}

export function choixReponds(r, hasard) {
  const bonne = r.ordre[r.k];
  const autres = r.tous.filter((id) => id !== bonne);
  const ailleurs = autres.filter((id) => r.themes[id] !== r.themes[bonne]);
  const reserve = ailleurs.length ? ailleurs : autres;
  const autre = reserve[Math.floor(hasard() * reserve.length)];
  return melanger([bonne, autre], hasard);
}

/* Rend { reponds, resultat } : "bien", "fini", "encore" (pas la bonne), "rien". */
export function repondre(r, id) {
  if (repondsFini(r) || !r.tous.includes(id)) return { reponds: r, resultat: "rien" };
  if (id !== r.ordre[r.k]) return { reponds: { ...r, essais: r.essais + 1 }, resultat: "encore" };
  const suivant = { ...r, k: r.k + 1, essais: 0 };
  return { reponds: suivant, resultat: repondsFini(suivant) ? "fini" : "bien" };
}
