// La radio de la cheffe et les consignes, par mission. En MAJUSCULES : la police
// du jeu n'a que des capitales (avec leurs accents). Tutoiement, rien d'accordé
// au masculin ou au féminin pour la recrue.
// Une réplique part une seule fois par mission, au « moment » qui porte son nom
// (moteur/evenements.js). Une consigne reste à l'écran jusqu'à son moment `fin`.

export const TEXTES = {
  hall: {
    radio: {
      debut: 'RECRUE, ICI LA BASE. LE WAGON ROULE TOUT SEUL. TOI, TU VISES.',
      goule: "UNE GOULE. GARDE LE RAYON SUR ELLE JUSQU'À CE QU'ELLE CÈDE.",
      capture: 'ET D\'UNE. LE PIÈGE A DE LA PLACE, CONTINUE.',
      surchauffe: 'TU AS TOUT FAIT CHAUFFER. LÂCHE LA DÉTENTE, ÇA REFROIDIT.',
      lumi: 'PAS LUI ! CELUI-LÀ A PEUR DE TOUT. LAISSE-LE PASSER.',
      lumiTouche: 'BRAVO. TU AS FAIT PLEURER UN FANTÔME.',
      lumiSauve: "IL T'A LAISSÉ UN PEU DE COURAGE. GARDE-LE.",
      // pendant l'aiguillage, une seule ligne : une bulle plus haute cacherait le levier
      aiguillage: 'TIRE SUR LE LEVIER, RECRUE.',
      clac: 'CLAC ! TU AS LE COUP DE MAIN.',
      voieG: 'LA GALERIE. LES PORTRAITS NE MORDENT PAS. ENFIN, PAS TOUS.',
      voieD: 'LE VESTIAIRE. ICI TOUT PAIE DOUBLE. ET TOUT MORD DOUBLE.',
      indice: 'QUELQUE CHOSE BRILLE SUR LE MUR. VISE-LE QUAND TU AS LE TEMPS.',
      secret: "ÇA, C'EST POUR LE DOSSIER DU MANOIR. BIEN VU.",
      coup: 'AÏE. ÇA, JE LE METS SUR TA NOTE DE FRAIS.',
      boss: 'LE MAJORDOME. IL SERT LE THÉ DEPUIS 1912. SERS-LUI LE RAYON.',
      bossMoitie: 'IL SE DÉDOUBLE. LE VRAI A GARDÉ SON MONOCLE.',
      leurre: 'UN FAUX. IL RIT, MAIS IL NE RIT PLUS.',
      fin: 'HALL NETTOYÉ. PAS MAL, POUR UNE RECRUE.',
    },
    consignes: {
      goule: { texte: 'GARDE LE RAYON SUR LA GOULE', fin: 'capture' },
      surchauffe: { texte: 'LÂCHE POUR REFROIDIR', fin: 'refroidi' },
      aiguillage: { texte: 'VISE LE LEVIER POUR CHANGER DE VOIE', fin: 'choix' },
      bossMoitie: { texte: 'VISE CELUI QUI A UN MONOCLE', fin: 'capture' },
    },
  },
};
