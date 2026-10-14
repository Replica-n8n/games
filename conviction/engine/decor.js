// Ce qu'une enquête peut citer pour son décor : le sol de chaque pièce et
// l'apparence de chaque personne. Ici, seulement les noms, pour que la
// validation refuse une faute de frappe ; le dessin vit dans l'interface
// (style.css pour les sols, ui/portraits.js pour les visages).

export const AMBIANCES = ['jour', 'soir', 'nuit', 'neige', 'bougie', 'orage'];

export const MATERIALS = ['parquet', 'tapis', 'carrelage', 'tomettes', 'pierre', 'marbre', 'planches', 'moquette', 'pave', 'herbe', 'pont', 'paille', 'velours', 'neige', 'jaune'];

export const LOOK = {
  skin: ['clair', 'rose', 'hale', 'mat', 'brun', 'fonce'],
  hair: ['court', 'chignon', 'long', 'degarni', 'boucle', 'aucun'],
  hairColor: ['chatain', 'brun', 'noir', 'roux', 'blond', 'gris', 'blanc'],
  hat: ['toque', 'paille', 'casquette', 'bibi', 'haut-de-forme', 'melon', 'chasse', 'couronne', 'voile', 'capuche', 'kepi'],
  outfit: ['tablier', 'livree', 'robe', 'chemise', 'costume', 'armure', 'uniforme', 'soutane', 'manteau', 'fourrure'],
  extras: ['noeud', 'moustache', 'boucles', 'ruban', 'lunettes', 'barbe', 'monocle', 'pipe', 'cicatrice', 'collier', 'moustache-ciree'],
};
