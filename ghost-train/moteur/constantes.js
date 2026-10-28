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
/** Le flash (dès la bibliothèque) : sa portée autour du viseur, sa recharge, ce qu'il fait. */
export const FLASH = { portee: 36, recharge: 0.9, etourdi: 2.4, revele: 3.5 };
/** Le rythme (salle de bal) : la fenêtre autour du temps, ce que remplit une capture, ce que la super ôte à un boss. */
export const RYTHME = { fenetre: 0.2, parfait: 0.25, normal: 0.09, degats: 3 };
/** Le slam (combles) : un coup sec du doigt à l'opposé de la traction ; `trajet` pixels pour le remplir. */
export const SLAM = { trajet: 45, vitesse: 120, coup: 0.6, coupBoss: 0.25, faible: 0.45, prise: 40 };
