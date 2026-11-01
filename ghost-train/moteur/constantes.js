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
/** Le piège, posé en bas au milieu : le rayon sort de sa bouche, les fantômes capturés y tombent. */
export const PIEGE = { x: 160, y: 168 };
/** D'où part le rayon : la bouche du piège. */
export const CANON = { x: 160, y: 162 };
/**
 * La torche (dès la bibliothèque, maquette jouée par Julie, mode « bouton » choisi le 2026-10-31) :
 * on la garde allumée du pouce gauche, elle éclaire là où vise le rayon. Sa pile se vide en
 * `1/use` secondes et se recharge éteinte ; vide, elle reprend à `reprise`. Ce qu'elle éclaire
 * (à `portee` du viseur) : une Ombre se révèle et le reste `revele` secondes ; tenu `eblouit`
 * secondes, un fantôme est étourdi, le bouclier de la Gouvernante se brise ; un livre qui garde
 * le Bibliothécaire tombe dès `garde` secondes.
 */
export const TORCHE = { portee: 26, use: 0.2, recharge: 0.16, reprise: 0.35, revele: 2, eblouit: 0.5, garde: 0.15, etourdi: 1.6 };
/** Le rythme (salle de bal) : la fenêtre autour du temps, ce que remplit une capture, ce que la super ôte à un boss. */
export const RYTHME = { fenetre: 0.2, parfait: 0.25, normal: 0.09, degats: 3 };
/**
 * Les sceaux (combles, d'après Ghostwire: Tokyo ; maquette validée par Julie le 2026-11-01) : un
 * coriace aspiré jusqu'à `seuil` de sa vie est sonné, et un sceau s'ouvre sur lui (rayon `r`,
 * `rBoss`). On le trace d'un seul trait, à `tol` pixels près, en partant à moins de `depart` d'un
 * bout ; il y a un jalon tous les `pas` pixels. `duree` (`dureeBoss`) secondes pour tracer, sinon
 * il reprend `rate` de sa vie. Pendant le tracé, le reste de la salle n'avance qu'un pas sur `lent`.
 */
export const SCEAU = { seuil: 0.35, tol: 13, depart: 18, pas: 8, r: 26, rBoss: 30, duree: 4.5, dureeBoss: 3.2, rate: 0.7, lent: 3, bonus: 2, boss: 3 };
/** La surchauffe coûte : le fantôme tenu s'échappe (sa vie revient, il recule de `recul`) ; un boss reprend `boss` de vie. */
export const ECHAPPE = { recul: 0.45, boss: 0.5 };
/**
 * Le boss vaincu se PÊCHE (maquette validée par Julie le 2026-10-30, d'après Stardew Valley,
 * Luigi's Mansion et Ghostbusters) : UN seul signe, le cercle vert, où garder le doigt. Il se
 * tient à l'opposé du boss (on tire contre lui) ; quand le boss prend son élan (`annonce`,
 * puis `coup`), il glisse de SON côté : on lui donne du mou. Par seconde : bien tirer fait
 * avancer la prise ET refroidit (sinon l'enfant qui ne lâche jamais casse vingt fois) ; hors du
 * cercle on chauffe, et pendant un coup on chauffe très vite : à 1, la ligne casse (le boss
 * repart avec `casse` de sa vie). À chaque ligne cassée ses coups chauffent moins (`pitie`) et
 * il repart de `fatigue` de sa meilleure prise. `niveau` (de 0 à 3, dans ESPECES) le durcit.
 */
export const PECHE = {
  tire: 0.16, tireChauffe: -0.12, horsChauffe: 0.25, horsRecul: 0.05, coupChauffe: 0.9, coupDoux: 0.05, coupRecul: 0.1, lacheRecul: 0.08,
  pitie: 0.6, fatigue: 0.4, casse: 0.25, coup: 0.8, annonce: 0.8, entreCoups: [2.2, 3.4], entreSens: [2.4, 3.8], cercle: 15, marge: 3, ecart: 46,
};
/** L'aspiration finale (le mafuba de Dragon Ball, son idée) : le choc, la lutte (il s'agrippe), il y passe, puis il cogne trois fois dans le piège. */
export const ASPIRE = { choc: 0.5, lutte: 2.1, avale: 2.6, fin: 3.9, bonks: [2.95, 3.25, 3.5], cx: 160, cy: 104 };
