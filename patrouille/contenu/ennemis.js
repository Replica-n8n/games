// Fiches des ennemis : un comportement commun (moteur/ennemis.js) + ses réglages + une
// forme provisoire. taille : petit (popcorn, un tir), moyen, gros, porteur, cage.
// Liste validée par Julie le 2026-10-19 (spec, « Ennemis »).

/** @type {Record<string, any>} */
export const ENNEMIS = {
  // ---- Communs à toutes les planètes ----
  gloutonnet: { nom: 'Gloutonnet', comportement: 'onduler', tir: 0.5, r: 11, pv: 2, taille: 'petit', forme: 'rond', couleur: '#8a6cff' },
  porteur:    { nom: 'Porteur', comportement: 'porteur', r: 13, pv: 3, taille: 'porteur', forme: 'penta', couleur: '#ffe066' },
  chasseur:   { nom: 'Chasseur', comportement: 'chasser', r: 9, pv: 2, taille: 'petit', forme: 'losange', couleur: '#d94dff' },
  cage:       { nom: 'Astronaute prisonnier', comportement: 'cage', r: 15, pv: 4, taille: 'cage', forme: 'cage', couleur: '#c9c6dc' },

  // ---- Jungle ----
  luciole:    { nom: 'Luciole', comportement: 'foncer', vitesse: 2.6, tir: 0.35, r: 11, pv: 1, taille: 'petit', forme: 'tri', couleur: '#ffe66d' },
  graine:     { nom: 'Graine-hélice', comportement: 'tournoyer', vitesse: 1.7, ampleur: 50, tir: 0.3, r: 9, pv: 1, taille: 'petit', forme: 'carre', couleur: '#c98a3e' },
  scarabee:   { nom: 'Scarabée', comportement: 'piquer', vitesse: 3.2, tir: 0.4, r: 10, pv: 1, taille: 'petit', forme: 'rond', couleur: '#ff7a3d' },
  perroquet:  { nom: 'Perroquet', comportement: 'viser', vitesseTir: 3.2, nTirs: 3, r: 14, pv: 5, taille: 'moyen', forme: 'barre', couleur: '#3de0ff', pBleu: 0.3 },
  plante:     { nom: 'Plante carnivore', comportement: 'cache', attente: 80, r: 14, pv: 4, taille: 'moyen', forme: 'etoile', couleur: '#ff8ad8', pBleu: 0.4 },
  champignon: { nom: 'Champignon', comportement: 'etoile', branches: 8, r: 15, pv: 7, taille: 'moyen', forme: 'demi', couleur: '#f4f4f4' },
  arbreRuche: { nom: 'Arbre-ruche', comportement: 'fabrique', pond: 'luciole', duree: 600, r: 30, pv: 40, taille: 'gros', forme: 'hexa', couleur: '#ffae00', pBleu: 0.3 },
};
