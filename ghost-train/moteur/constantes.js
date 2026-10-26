// Ghost Train : les nombres partagés par le moteur et l'écran.
// L'écran du jeu fait 320 x 180 pixels, agrandi sans lissage. Le monde est un
// couloir : x de gauche à droite (murs à ±DEMI_LARGEUR), y vers le BAS (sol à SOL),
// z vers le fond. La caméra est assise dans le wagon, à z = camZ.

export const W = 320, H = 180;
export const FPS = 60, DT = 1 / FPS;

// Projection : un point à distance d se dessine à FOCALE / d pixels par unité
export const CX = 160, CY = 82, FOCALE = 150;
export const DEMI_LARGEUR = 2.0, SOL = 1.15, PLAFOND = -1.5, PORTEE = 17;

export const VITESSE_RAIL = 3.4; // unités par seconde quand le wagon roule
export const COEURS = 5;
export const DELAI_AIGUILLAGE = 4; // le wagon part sur la voie que donne le levier
// Où se posent portique, levier (et aiguilles) et tunnels, en pas devant le wagon arrêté
export const AIGUILLE = { portique: 3.5, levier: 5, tunnels: 10 };
// Le centre du levier : son socle pose sur le sol
export const Y_LEVIER = 1.15 - 0.65;

// Le rayon (repris de la POC) : dégâts par seconde, part des dégâts sur un
// fantôme qui n'est pas étourdi, chauffe par seconde de tir, refroidissement,
// durée de la surchauffe et chauffe au moment où elle se termine (un tiers : à 0,55 le
// rayon resurchauffait 1,7 s après être reparti), et le seuil où l'appareil prévient
export const RAYON = { puissance: 1.6, faible: 0.45, chauffe: 0.27, refroidit: 0.55, surchauffe: 1.7, reprise: 0.33, alerte: 0.75 };

// Le bout de l'appareil, d'où part le rayon, en pixels d'écran
export const CANON = { x: 206, y: 126 };

// Le flash (dès la Bibliothèque) : rayon d'effet autour du viseur en pixels, recharge,
// durée de l'étourdissement, et combien de temps un Drap ou une Ombre restent visibles
export const FLASH = { portee: 36, recharge: 0.9, etourdi: 2.4, revele: 3.5 };
// Le rythme (dès la Salle de bal) : une capture est PARFAITE si elle tombe à moins
// de `fenetre` battement d'un temps ; la super-attaque se remplit de `parfait` par
// capture parfaite, de `normal` sinon, et frappe `degats` sur un boss
export const RYTHME = { fenetre: 0.2, parfait: 0.2, normal: 0.09, degats: 3 };
// Le slam (dès le Grenier) : tirer le viseur à l'opposé du fantôme qui se débat, plus
// vite que `vitesse` pixels par seconde, charge la jauge ; pleine, le fantôme perd `coup` de sa vie
export const SLAM = { vitesse: 25, coup: 0.6 };
