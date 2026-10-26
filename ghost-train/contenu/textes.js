// Les consignes, par mission : une ligne en haut de l'écran, là où arrivent les
// fantômes. (La radio de la cheffe a été retirée le 2026-10-26 : c'est un jeu
// d'arcade, il s'explique en jouant.) En MAJUSCULES : la police
// du jeu n'a que des capitales (avec leurs accents). Tutoiement, rien d'accordé
// au masculin ou au féminin pour la recrue.
// Une consigne part une seule fois par mission, au « moment » qui porte son nom
// (moteur/evenements.js), et reste à l'écran jusqu'à son moment `fin`.

export const TEXTES = {
  hall: {
    consignes: {
      goule: { texte: 'GARDE LE RAYON SUR LA GOULE', fin: 'capture' },
      chaud: { texte: 'LÂCHE AVANT LA SURCHAUFFE', fin: 'frais' },
      surchauffe: { texte: 'LÂCHE POUR REFROIDIR', fin: 'refroidi' },
      aiguillage: { texte: 'VISE LE LEVIER POUR CHANGER DE VOIE', fin: 'choix' },
      bossMoitie: { texte: 'VISE CELUI QUI A UN MONOCLE', fin: 'capture' },
    },
  },
};
