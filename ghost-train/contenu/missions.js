// Les missions, en données. Une étape du parcours est posée à une profondeur z :
//   { z, arret: { vagues: [[seconde, espèce, x]], secret?, moment? } }
//   { z, aiguillage: { g: voie, d: voie } }   les deux voies vont au même z
//     voie = { nom, danger (1 ou 2 têtes de mort), gain (pièces x1 ou x2), etapes: [étapes] }
//   { z, boss: 'espèce' }
// Un secret : { id, forme, x (±2 = contre un mur), y, dz (devant l'arrêt) }.
// Trois secrets par mission : un par voie de l'aiguillage, un sur le tronc commun.
import { TEXTES } from './textes.js';

export const MISSIONS = {
  hall: {
    id: 'hall', numero: 1, nom: 'LE GRAND HALL', salle: 'hall', bpm: 124, volants: true,
    // le hall apprend le rayon : des goules lentes, jamais plus de deux à la fois au début
    vitesseGoule: [1.1, 1.5],
    radio: TEXTES.hall.radio, consignes: TEXTES.hall.consignes,
    secrets: ['hall-affiche', 'hall-portrait', 'hall-plan'],
    parcours: [
      { z: 8, arret: { vagues: [[0.5, 'goule', 0], [5, 'goule', 0.8]] } },
      { z: 18, arret: { vagues: [[0.4, 'goule', -1], [2, 'lumi', -1], [2.6, 'goule', 1], [5, 'goule', 0]] } },
      { z: 28, arret: {
        vagues: [[0.4, 'goule', -1], [1.4, 'goule', 1], [4, 'goule', -0.5], [5, 'goule', 0.6]],
        secret: { id: 'hall-affiche', forme: 'affiche', x: 1.95, y: -0.55, dz: 6 } } },
      // La galerie, calme : des goules une à une. Le vestiaire, dangereux : une nuée de
      // goules volantes en plus des goules, et tout y paie double.
      { z: 36, aiguillage: {
        g: { nom: '< GALERIE', danger: 1, gain: 1, etapes: [{ z: 46, arret: {
          vagues: [[0.4, 'goule', -1], [2.6, 'goule', 1], [5, 'goule', 0], [7.4, 'goule', -0.6]],
          secret: { id: 'hall-portrait', forme: 'portrait', x: -1.95, y: -0.6, dz: 5 } } }] },
        d: { nom: 'VESTIAIRE >', danger: 2, gain: 2, etapes: [{ z: 46, arret: {
          vagues: [[0.3, 'gouleVol', 1], [0.8, 'gouleVol', -1], [1.4, 'goule', 0], [2, 'gouleVol', 1], [2.6, 'gouleVol', -1],
            [3.2, 'goule', -1], [3.8, 'gouleVol', 1], [4.4, 'goule', 1], [5, 'gouleVol', -1], [5.6, 'gouleVol', 1], [6.4, 'goule', 0]],
          secret: { id: 'hall-plan', forme: 'plan', x: 1.95, y: -0.6, dz: 5 } } }] },
      } },
      { z: 58, arret: { vagues: [[0.3, 'goule', -1.2], [0.9, 'goule', 1.2], [3, 'goule', 0], [4.6, 'goule', -0.6], [5.4, 'goule', 0.6], [7.5, 'goule', -1], [8.2, 'goule', 1], [10, 'goule', 0], [10.6, 'goule', -1.1], [11.2, 'goule', 1.1]] } },
      { z: 70, boss: 'majordome' },
    ],
  },
};

// Les missions jouables aujourd'hui ; les autres s'affichent « SUPPRIMÉ » à la gare
export const MISSIONS_EXISTANTES = ['hall'];
export const NOMS = { hall: 'LE GRAND HALL', bibliotheque: 'LA BIBLIOTHÈQUE', bal: 'LA SALLE DE BAL', grenier: 'LE GRENIER' };
