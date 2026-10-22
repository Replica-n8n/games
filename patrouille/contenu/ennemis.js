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

  // ---- Désert (rover) : ce qui vit au sol défile avec lui ----
  vautour:       { nom: 'Vautour', comportement: 'piquer', vitesse: 3.4, tir: 0.35, r: 12, pv: 1, taille: 'petit', forme: 'tri', couleur: '#b9a38a' },
  herbe:         { nom: "Boule d'herbe sèche", comportement: 'rebondir', vitesse: 1.7, vitesseX: 2.2, tir: 0.25, r: 11, pv: 1, taille: 'petit', forme: 'rond', couleur: '#d8c06a' },
  scarabeeSable: { nom: 'Scarabée des sables', comportement: 'jaillir', attente: 70, vitesse: 3, r: 10, pv: 1, taille: 'petit', forme: 'rond', couleur: '#3a7bd5', monticule: true },
  scorpion:      { nom: 'Scorpion', comportement: 'suivre', sol: true, vitesse: 0.7, descente: 0.8, vitesseTir: 2.8, nTirs: 1, r: 14, pv: 5, taille: 'moyen', forme: 'pince', couleur: '#e0603a', pBleu: 0.3 },
  cactus:        { nom: 'Cactus-tourelle', comportement: 'etoile', sol: true, branches: 8, r: 15, pv: 7, taille: 'moyen', forme: 'cactus', couleur: '#5aa860' },
  taupe:         { nom: 'Taupe', comportement: 'taupe', sol: true, attente: 90, vitesseTir: 2.8, r: 14, pv: 4, taille: 'moyen', forme: 'demi', couleur: '#8a6a52', pBleu: 0.4, monticule: true },
  ver:           { nom: 'Ver des sables', comportement: 'fabrique', pond: 'vautour', duree: 600, r: 30, pv: 40, taille: 'gros', forme: 'ver', couleur: '#d9a35a', pBleu: 0.3 },
  boulet:        { nom: 'Rocher qui roule', comportement: 'rouler', vitesse: 2.2, r: 17, pv: 5, taille: 'moyen', forme: 'boulet', couleur: '#9a7a5a' },
};
