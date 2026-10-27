// Les missions, en données. Une mission = trois salles qui se suivent ; chaque salle
// a son déroulé, une liste d'actions [seconde, action, ...] comptées depuis l'entrée :
//   ['sort', espèce, cachette, vise?]  la cachette prévient 0,8 s, puis le fantôme sort
//                                      (vise 1 : il vient au milieu, sous le lustre ;
//                                       vise 2 : il vient sous une casserole)
//   ['chat', cachette]                 fausse alerte : le chat noir sort et file
//   ['bou']                            un drap surgit en plein écran
//   ['consigne', texte, durée]         une ligne en haut de l'écran
//   ['boss', cachette]                 le boss de la mission sort (dernière salle)
//   ['attendre']                       la suite attend que la salle soit vide
// Le premier étage seulement existe (tranche 1) ; les autres s'affichent « bientôt ».

export const MISSIONS = {
  rdc: {
    id: 'rdc', numero: 1, nom: 'LE REZ-DE-CHAUSSÉE', etage: 'rdc', bpm: 124, musique: 'manoir',
    salles: ['salon', 'manger', 'cuisine'], boss: 'majordome',
    deroules: {
      salon: [
        [1.2, 'consigne', 'VISE UN FANTÔME ET {GARDE}', 4],
        [2, 'sort', 'ecto', 'ascenseur'],
        [5, 'sort', 'ecto', 'fenetre'],
        [6.5, 'consigne', 'SURVEILLE LES CACHETTES !', 3],
        [8, 'sort', 'drap', 'cheminee'],
        [11, 'chat', 'ascenseur'],
        [11.4, 'consigne', 'LE CHAT, ON LE LAISSE TRANQUILLE', 3],
        [14, 'sort', 'ecto', 'miroir'], [14.6, 'sort', 'ecto', 'fenetre'],
        [18, 'sort', 'crane', 'cheminee'],
        [18.6, 'consigne', 'CASSE SES CRACHATS AVANT QU\'ILS ARRIVENT', 3.5],
        [22, 'bou'],
        [25, 'sort', 'ecto', 'ascenseur', 1], [25.3, 'sort', 'ecto', 'cheminee', 1], [25.8, 'sort', 'drap', 'miroir', 1],
        [26.4, 'consigne', 'TIRE SUR LE LUSTRE !', 3.5],
        [31, 'sort', 'ecto', 'fenetre'], [31.5, 'sort', 'crane', 'miroir'],
        [35, 'sort', 'ecto', 'cheminee'], [35.4, 'sort', 'ecto', 'ascenseur'], [35.8, 'sort', 'drap', 'fenetre'],
        [36, 'attendre'],
      ],
      manger: [
        [1.5, 'sort', 'ecto', 'buffet'],
        [4, 'sort', 'drap', 'passeplat'],
        [6.5, 'sort', 'ecto', 'cloche'],
        [7, 'consigne', 'LA BOUTEILLE : SON BOUCHON ASSOMME !', 3.5],
        [10.5, 'chat', 'buffet'],
        [13, 'sort', 'ecto', 'nappe'], [13.5, 'sort', 'crane', 'passeplat'],
        [17, 'bou'],
        [20, 'sort', 'ecto', 'cloche'], [20.4, 'sort', 'drap', 'buffet'], [20.8, 'sort', 'ecto', 'nappe'],
        [25, 'sort', 'crane', 'cloche'], [25.5, 'sort', 'ecto', 'passeplat'],
        [29, 'sort', 'ecto', 'buffet'], [29.3, 'sort', 'ecto', 'nappe'], [29.6, 'sort', 'drap', 'cloche'],
        [30, 'attendre'],
      ],
      cuisine: [
        [1.5, 'sort', 'ecto', 'vaisselier'],
        [4, 'sort', 'drap', 'marmite'],
        [7, 'sort', 'ecto', 'four', 2], [7.5, 'consigne', 'FAIS TOMBER LES CASSEROLES !', 3.5],
        [10.5, 'sort', 'crane', 'fenetre'],
        [14, 'chat', 'vaisselier'],
        [16, 'sort', 'ecto', 'four', 2], [16.4, 'sort', 'ecto', 'vaisselier', 2],
        [20, 'bou'],
        [23, 'sort', 'drap', 'marmite'], [23.5, 'sort', 'crane', 'fenetre'],
        [27, 'sort', 'ecto', 'vaisselier'], [27.4, 'sort', 'ecto', 'four'], [27.8, 'sort', 'drap', 'marmite'],
        [28, 'attendre'],
        [29, 'boss', 'four'],
        [29.4, 'consigne', 'CASSE SES ASSIETTES !', 3],
        [30, 'attendre'],
      ],
    },
  },
};

/** Les étages de l'hôtel, du bas vers le haut, et ce qu'on y trouve. */
export const ETAGES = {
  rdc: { nom: 'REZ-DE-CHAUSSÉE', salles: 'HALL, RESTAURANT, CUISINE' },
  biblio: { nom: 'BIBLIOTHÈQUE', salles: 'FUMOIR, BIBLIOTHÈQUE, ARCHIVES' },
  bal: { nom: 'SALLE DE BAL', salles: 'VESTIAIRE, SALLE DE BAL, KIOSQUE' },
  grenier: { nom: 'COMBLES', salles: 'CHAMBRE 13, LINGERIE, COMBLES' },
};
export const MISSIONS_EXISTANTES = Object.keys(MISSIONS);
