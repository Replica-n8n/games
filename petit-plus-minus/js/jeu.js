/* Logique PURE du jeu : ni DOM, ni stockage, ni horloge implicite.
   Chaque fonction reçoit ce dont elle a besoin (l'instant, les limites) et
   rend un nouvel état au lieu de modifier celui qu'on lui passe : c'est ce qui
   la rend testable dans Node (tests/jeu.test.js). */

export function etatVide() {
  return { format: 1, etoiles: 0, jeuxDuJour: { jour: "", etoiles: 0 }, meteo: [] };
}

/* L'historique de la météo de Minus, pour en parler avec un parent (pas pour
   surveiller). Plafonné : une note par jour pendant plus d'un an, et le stockage
   ne grossit jamais sans fin. */
export const MAX_METEO = 400;

export function noterMeteo(etat, niveau, instant) {
  const meteo = [...(etat.meteo || []), { t: instant, niveau }].slice(-MAX_METEO);
  return { ...etat, meteo };
}

/* Le jour LOCAL de l'enfant, calculé à chaque usage : une app restée ouverte
   après minuit doit voir le nouveau jour, et l'UTC mettrait minuit à 2 h. */
export function jourLocal(instant) {
  const d = new Date(instant);
  const deux = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + deux(d.getMonth() + 1) + "-" + deux(d.getDate());
}

export function niveauDe(etoiles, parNiveau) {
  return { niveau: Math.floor(etoiles / parNiveau) + 1, dansNiveau: etoiles % parNiveau, parNiveau };
}

/* Tranché le 2026-09-25 : l'entraînement compte sans rendre le combat gagné d'avance. */
export function bonusCombat(niveau, max) {
  return Math.min(niveau, max);
}

/* source : "jeu" (mini-jeux, plafonnés par jour) ou "mission" (vraie vie, jamais plafonnée). */
export function gagnerEtoiles(etat, n, source, instant, limites) {
  if (!Number.isInteger(n) || n <= 0) return { etat, gagnees: 0, plafondAtteint: false };
  const jour = jourLocal(instant);
  const duJour = etat.jeuxDuJour && etat.jeuxDuJour.jour === jour ? etat.jeuxDuJour.etoiles : 0;
  let gagnees = n;
  let jeuxDuJour = { jour, etoiles: duJour };
  if (source === "jeu") {
    gagnees = Math.max(0, Math.min(n, limites.etoilesMaxParJourJeux - duJour));
    jeuxDuJour = { jour, etoiles: duJour + gagnees };
  }
  const suivant = { ...etat, etoiles: etat.etoiles + gagnees, jeuxDuJour };
  return { etat: suivant, gagnees, plafondAtteint: jeuxDuJour.etoiles >= limites.etoilesMaxParJourJeux };
}

/* Une récompense de mini-jeu : les étoiles (plafonnées par jour) et le niveau avant et
   après, pour que l'écran puisse dire « Petit Plus passe au niveau 3 ! ». */
export function recompenser(etat, n, instant, limites) {
  const avant = niveauDe(etat.etoiles, limites.etoilesParNiveau).niveau;
  const r = gagnerEtoiles(etat, n, "jeu", instant, limites);
  return { ...r, niveauAvant: avant, niveauApres: niveauDe(r.etat.etoiles, limites.etoilesParNiveau).niveau };
}
