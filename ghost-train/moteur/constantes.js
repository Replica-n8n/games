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
export const DELAI_AIGUILLAGE = 4; // sans choix, le wagon prend la voie de gauche

// Le rayon (repris de la POC) : dégâts par seconde, part des dégâts sur un
// fantôme qui n'est pas étourdi, chauffe par seconde de tir, refroidissement,
// durée de la surchauffe et chauffe au moment où elle se termine
export const RAYON = { puissance: 1.6, faible: 0.45, chauffe: 0.27, refroidit: 0.55, surchauffe: 1.7, reprise: 0.55 };

// Le bout de l'appareil, d'où part le rayon, en pixels d'écran
export const CANON = { x: 213, y: 131 };
