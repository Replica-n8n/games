// Ce qu'une enquête peut citer pour son décor : le sol de chaque pièce et
// l'apparence de chaque personne. Ici, seulement les noms, pour que la
// validation refuse une faute de frappe ; le dessin vit dans l'interface
// (style.css pour les sols, ui/buste.js pour les visages).

/** Couleurs de pions qu'une enquête peut citer (les teintes vivent dans style.css). */
export const PAWN_COLORS = ['ocre', 'sapin', 'prune', 'brique', 'canard', 'rose', 'ardoise'];

export const AMBIANCES = ['jour', 'soir', 'nuit', 'neige', 'bougie', 'orage'];

/** Ce qu'on voit sur les cases hors plan (« . » dans le plan), dessiné dans style.css. */
export const DEHORS = ['nuages', 'nuit-etoilee', 'mer'];

export const MATERIALS = ['parquet', 'tapis', 'carrelage', 'tomettes', 'pierre', 'marbre', 'planches', 'moquette', 'pave', 'herbe', 'pont', 'paille', 'velours', 'neige', 'jaune', 'sable', 'mousse', 'grotte', 'toile', 'mare', 'corail', 'kelp', 'abysses', 'acier', 'donnees', 'tole', 'pastel', 'serre', 'quai', 'gres', 'nil', 'palais', 'desert'];

export const LOOK = {
  skin: ['clair', 'rose', 'hale', 'mat', 'brun', 'fonce'],
  hair: ['court', 'chignon', 'long', 'degarni', 'boucle', 'aucun'],
  hairColor: ['chatain', 'brun', 'noir', 'roux', 'blond', 'gris', 'blanc'],
  hat: ['toque', 'paille', 'casquette', 'bibi', 'haut-de-forme', 'melon', 'chasse', 'couronne', 'voile', 'capuche', 'kepi', 'suroit', 'bonnet'],
  outfit: ['tablier', 'livree', 'robe', 'chemise', 'costume', 'armure', 'uniforme', 'soutane', 'manteau', 'fourrure', 'pourpoint', 'tunique', 'maillot', 'cire', 'salopette'],
  extras: ['noeud', 'moustache', 'boucles', 'ruban', 'lunettes', 'barbe', 'monocle', 'pipe', 'cicatrice', 'collier', 'moustache-ciree'],
  // Les créatures des autres jeux de l'Arcade (dessins : ui/bete.js).
  espece: ['escargot', 'lucane', 'araignee', 'crapaud', 'herisson', 'papillon', 'requin', 'orque', 'barracuda', 'pieuvre', 'tortue', 'dauphin', 'cachalot'],
  // Les personnages d'œuvres (One Piece) : un costume sur un buste (ui/costumes.js),
  // ou un dessin entier pour qui n'a pas de visage humain (ui/onepiece.js).
  perso: ['cobra', 'sabo', 'vivi', 'wapol', 'neptune', 'charlos', 'imu', 'vegapunk', 'york', 'lilith', 'atlas', 'shaka', 'edison', 'pythagore',
    'isis', 'nephthys', 'osiris', 'anubis', 'thot', 'seth'],
};

/**
 * Nom court sous un visage : « Mrs Hudson » -> « Hudson », « Hector MacQueen »
 * -> « Hector ». Un titre cède la place au nom de famille, sinon le prénom.
 * Son initiale est celle des notes au crayon : unique dans une enquête.
 * @param {string} name
 */
export function nomCourt(name) {
  // Un nom à article (« La Veuve », « L'Escargot ») : le mot qui suit l'article.
  if (/^L'/.test(name)) return name.slice(2).split(' ')[0];
  if (/^(Le|La|Les) /.test(name)) return name.split(' ')[1];
  const mots = name.split(' ');
  if (mots.length < 2) return name;
  if (mots[0] === 'Lady') return name;
  return /^(Mrs|Mr|Miss|Dr|Colonel|Général|Juge|Professeur|Princesse|Sir|Madame|Mademoiselle|Révérend|Docteur|Docteure|Directeur|Chambellan|Comte|Capitaine)$/.test(mots[0]) ? mots[mots.length - 1] : mots[0];
}
