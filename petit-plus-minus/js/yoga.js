/* Petit yoga : les postures que montre le chat (js/chat.js). PUR.
   Une posture = seize articulations dans un cadre de 300 × 290 (le tapis est à y = 258).
   `vue` : 0 de face, 1 de profil. G = le côté le plus loin quand il est de profil. `dos`
   courbe le buste. Le nom affiché de chaque posture est dans contenu.json.

   Le choix des postures vient des sources lues le 2026-10-01 (docs/GAME_DESIGN.md,
   « Petit yoga ») : jamais le lotus (la seule blessure grave rapportée chez un jeune),
   rien sur la tête ni sur les épaules, rien qui appuie sur le cou. Dans l'arbre, le pied
   se pose SOUS le genou. Trois respirations par posture, puis on change. */

export const CADRE = { largeur: 300, hauteur: 290, tapis: 258 };

export const DEBOUT = { vue: 0, j: { tete: [150, 72], cou: [150, 102], dos: [150, 140], bassin: [150, 176],
  epG: [133, 110], coG: [124, 146], maG: [122, 182], epD: [167, 110], coD: [176, 146], maD: [178, 182],
  haG: [141, 178], geG: [140, 220], piG: [138, 250], haD: [159, 178], geD: [160, 220], piD: [162, 250] } };

export const POSTURES = {
  // Debout sur un pied, l'autre posé contre le mollet ; les mains jointes devant la poitrine.
  arbre: { vue: 0, j: { tete: [150, 72], cou: [150, 102], dos: [150, 140], bassin: [150, 176],
    epG: [133, 112], coG: [116, 146], maG: [145, 130], epD: [167, 112], coD: [184, 146], maD: [155, 130],
    haG: [140, 178], geG: [102, 200], piG: [148, 228], haD: [160, 178], geD: [160, 220], piD: [162, 250] } },
  // À quatre pattes, le dos rond, la tête qui pend.
  dosrond: { vue: 1, j: { tete: [72, 172], cou: [98, 150], dos: [152, 92], bassin: [208, 150],
    epG: [112, 150], coG: [114, 204], maG: [114, 250], epD: [100, 152], coD: [100, 204], maD: [100, 250],
    haG: [214, 152], geG: [214, 250], piG: [268, 250], haD: [202, 154], geD: [200, 250], piD: [256, 250] } },
  // Sur le ventre, la poitrine levée, les avant-bras au sol (un cobra doux, sans tendre les bras).
  cobra: { vue: 1, j: { tete: [96, 158], cou: [112, 190], dos: [146, 244], bassin: [192, 242],
    epG: [122, 198], coG: [128, 248], maG: [90, 250], epD: [112, 200], coD: [114, 250], maD: [74, 250],
    haG: [192, 244], geG: [238, 248], piG: [282, 250], haD: [190, 244], geD: [234, 250], piD: [278, 250] } },
  // Assis, les pieds joints, les genoux ouverts, les mains sur les pieds.
  papillon: { vue: 0, j: { tete: [150, 108], cou: [150, 138], dos: [150, 180], bassin: [150, 222],
    epG: [133, 146], coG: [116, 196], maG: [140, 240], epD: [167, 146], coD: [184, 196], maD: [160, 240],
    haG: [138, 228], geG: [82, 236], piG: [143, 250], haD: [162, 228], geD: [218, 236], piD: [157, 250] } },
  // Le repos : replié sur les genoux, le front vers le sol, les bras le long du corps.
  graine: { vue: 1, j: { tete: [86, 232], cou: [110, 230], dos: [150, 190], bassin: [204, 218],
    epG: [124, 234], coG: [168, 246], maG: [212, 250], epD: [116, 236], coD: [160, 248], maD: [204, 250],
    haG: [206, 220], geG: [152, 250], piG: [228, 250], haD: [200, 222], geD: [146, 250], piD: [222, 250] } },
};

export const ARTICULATIONS = Object.keys(DEBOUT.j);

/* Entre deux postures : le chat est la MÊME silhouette, il glisse de l'une à l'autre. */
export function entre(a, b, t) {
  return { vue: a.vue + (b.vue - a.vue) * t,
    j: Object.fromEntries(ARTICULATIONS.map((k) => [k, a.j[k].map((x, i) => x + (b.j[k][i] - x) * t)])) };
}
/* Départ et arrivée en douceur. */
export const doux = (k) => (k < .5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k));

/* Le rythme, en millisecondes : le temps de changer de posture, puis des respirations
   comme celles de la bougie (inspirer 4 s, souffler 6 s). */
export const RYTHME = { pret: 2000, change: 4000, inspire: 4000, souffle: 6000 };
