// Ghost Train : les nombres du jeu. Tout est en pixels de jeu (320 x 180) et en
// secondes ; la boucle avance à 60 pas par seconde, quel que soit l'écran.

export const W = 320;
export const H = 180;
export const FPS = 60;
export const DT = 1 / FPS;
export const COEURS = 5;
/** Un fantôme qui grandit jusque-là est sur nous : il frappe. */
export const FRAPPE = 2.4;
/** Une cachette prévient aussi longtemps avant de s'ouvrir. */
export const ALERTE = 0.8;
/** Le panoramique d'une salle à la suivante. */
export const PASSAGE = 1.3;
/** Le doigt vise aussi haut AU-DESSUS de lui, pour ne pas cacher sa cible. */
export const ECART = 22;
/** Le rayon : ce qu'il aspire par seconde, et sa chauffe. Surchauffe à 1, il repart à `reprise`. */
export const RAYON = { puissance: 1.6, chauffe: 0.27, refroidit: 0.55, reprise: 0.33, alerte: 0.75 };
/** D'où part le rayon : le bas de l'écran, au milieu. */
export const CANON = { x: 160, y: 196 };
