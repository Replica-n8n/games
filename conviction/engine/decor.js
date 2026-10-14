// Ce qu'une enquête peut citer pour son décor : le sol de chaque pièce et
// l'apparence de chaque personne. Ici, seulement les noms, pour que la
// validation refuse une faute de frappe ; le dessin vit dans l'interface
// (style.css pour les sols, ui/portraits.js pour les visages).

export const MATERIALS = ['parquet', 'tapis', 'carrelage', 'tomettes', 'pierre', 'marbre', 'planches', 'moquette'];

export const LOOK = {
  skin: ['clair', 'rose', 'hale', 'mat', 'brun', 'fonce'],
  hair: ['court', 'chignon', 'long', 'degarni', 'boucle', 'aucun'],
  hairColor: ['chatain', 'brun', 'noir', 'roux', 'blond', 'gris', 'blanc'],
  hat: ['toque', 'paille', 'casquette', 'bibi'],
  outfit: ['tablier', 'livree', 'robe', 'chemise', 'costume'],
  extras: ['noeud', 'moustache', 'boucles', 'ruban', 'lunettes', 'barbe'],
};
