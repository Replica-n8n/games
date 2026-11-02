// Les rayons de la boutique : deux brins de couleur autour du cœur, qui garde, lui, les
// couleurs de la chauffe (blanc, jaune, rouge). `arc` : les couleurs filent le long du rayon.
// Prix réglés sur les pièces mesurées au robot (2026-11-02) : environ 850 pour tout
// l'hôtel, de quoi s'offrir le premier dès l'ouverture et trois au premier tour.
// ⚠️ Un `id` ne change jamais : la sauvegarde le retient.

/** @typedef {{id: string, nom: string, prix: number, a: string, b: string, arc?: boolean, texte: string}} Rayon */
/** @type {Rayon[]} */
export const RAYONS = [
  { id: 'neon', nom: 'NÉON 80', prix: 0, a: '#ff3fa4', b: '#3fe8ff', texte: 'ROSE ET CYAN, COMME L\'ENSEIGNE.' },
  { id: 'ecto', nom: 'ECTO', prix: 150, a: '#6ee03a', b: '#2a9a3a', texte: 'LE VERT DES FANTÔMES.' },
  { id: 'or', nom: 'OR', prix: 250, a: '#ffd23a', b: '#ff8a1c', texte: 'LE JAUNE DES PIÈCES.' },
  { id: 'glace', nom: 'GLACE', prix: 300, a: '#8ae8ff', b: '#3a6aff', texte: 'UNE LAMPE DE FRIGO À MINUIT.' },
  { id: 'spectre', nom: 'SPECTRE', prix: 400, a: '#b07aff', b: '#ff9af0', texte: 'VIOLET ET MAUVE.' },
  { id: 'braise', nom: 'BRAISE', prix: 450, a: '#ff4a2a', b: '#ffa02a', texte: 'ROUGE ET ORANGE.' },
  { id: 'arc', nom: 'ARC-EN-CIEL', prix: 750, a: '#ff3fa4', b: '#3fe8ff', arc: true, texte: 'LES COULEURS DÉFILENT.' },
];
export const RAYON_DEPART = 'neon';
