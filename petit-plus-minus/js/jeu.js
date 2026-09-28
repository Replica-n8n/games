/* Logique PURE du jeu : ni DOM, ni stockage, ni horloge implicite.
   Chaque fonction reçoit ce dont elle a besoin (l'instant, les réglages) et rend un
   nouvel état au lieu de modifier celui qu'on lui passe : c'est ce qui la rend testable
   dans Node (tests/jeu.test.js). Pas d'étoiles ni de niveaux (tranché le 2026-09-27,
   après le test de l'enfant) : l'enfant choisit ses outils, rien ne pousse à rejouer. */

export function etatVide() {
  return { format: 1, meteo: [], themes: {}, sos: [] };
}

/* La jauge de Minus, notée pour en parler avec un parent (pas pour surveiller).
   Plafonnée : le stockage ne grossit jamais sans fin. Changer d'avis dans les 10 minutes
   remplace la note au lieu d'en ajouter une : la jauge se touche d'un doigt. */
export const MAX_METEO = 400;
const CHANGER_D_AVIS_MS = 10 * 60 * 1000;

export function noterMeteo(etat, niveau, instant) {
  const liste = etat.meteo || [];
  const derniere = liste.at(-1);
  const base = derniere && instant - derniere.t < CHANGER_D_AVIS_MS ? liste.slice(0, -1) : liste;
  return { ...etat, meteo: [...base, { t: instant, niveau }].slice(-MAX_METEO) };
}

/* La trace du SOS, pour le futur espace parent : d'où il est venu et la réponse de
   l'enfant à « Minus a-t-il rétréci ? ». Notée en silence à la fin. `remplacer` : revenu
   en arrière dans le MÊME SOS, l'enfant a changé sa réponse ; une seule trace par SOS. */
export const MAX_SOS = 400;

export function noterSos(etat, depuis, reponse, instant, remplacer) {
  const liste = etat.sos || [];
  const base = remplacer && liste.length ? liste.slice(0, -1) : liste;
  return { ...etat, sos: [...base, { t: instant, depuis, reponse }].slice(-MAX_SOS) };
}

/* Les paires dont le thème est actif. `reglages` (« Pour les grands ») peut activer ou
   retirer un thème ; sans réglage, seul compte `parDefaut` dans contenu.json. Les thèmes
   sensibles (enlèvement, parents, feu…) sont éteints par défaut : Minus dit la pensée à
   voix haute, il ne doit pas faire naître une peur que l'enfant n'a pas. */
export function pairesActives(contenu, reglages) {
  return contenu.paires.filter((p) => {
    const theme = contenu.themes && contenu.themes[p.theme];
    const actif = reglages && p.theme in reglages ? reglages[p.theme] : theme && theme.parDefaut;
    return actif === true;
  });
}

/* « Pour les grands » : allumer ou éteindre un thème. Rend un nouvel état. */
export function choisirTheme(etat, theme, actif) {
  return { ...etat, themes: { ...(etat.themes || {}), [theme]: actif === true } };
}

/* Le hasard est passé en paramètre : Math.random dans le jeu, une suite fixe en test. */
export function melanger(liste, hasard) {
  const l = [...liste];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}
