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
    vitesseGoule: [1.1, 1.5], actions: {},
    consignes: TEXTES.hall.consignes,
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
          // les goules volantes passent l'une après l'autre : serrées, elles s'échappaient
          // (robot enfant : 54 % de captures) ; le danger vient des goules qui avancent en même temps
          vagues: [[0.3, 'gouleVol', 1], [1, 'goule', -1], [1.8, 'gouleVol', -1], [2.6, 'goule', 1], [3.6, 'gouleVol', 1],
            [4.2, 'goule', 0], [5.4, 'gouleVol', -1], [6, 'goule', -1], [7.2, 'gouleVol', 1], [7.8, 'goule', 1]],
          secret: { id: 'hall-plan', forme: 'plan', x: 1.95, y: -0.6, dz: 5 } } }] },
      } },
      // Deux arrêts de 5 goules, pas un de 10 : avec la surchauffe, dix goules en 11 s ne
      // se capturaient qu'à 59 % en gardant la détente (robot enfant, 2026-10-26).
      { z: 58, arret: { vagues: [[0.3, 'goule', -1.2], [0.9, 'goule', 1.2], [3, 'goule', 0], [4.8, 'goule', -0.6], [5.6, 'goule', 0.6]] } },
      { z: 66, arret: { vagues: [[0.4, 'goule', -1], [1.2, 'goule', 1], [3.2, 'goule', 0], [5, 'goule', -1.1], [5.8, 'goule', 1.1]] } },
      { z: 78, boss: 'majordome' },
    ],
  },

  // La Bibliothèque apprend le FLASH : le Drap ne se capture qu'une fois flashé,
  // l'Ombre ne se voit qu'au flash, les livres du Bibliothécaire tombent au flash.
  bibliotheque: {
    id: 'bibliotheque', numero: 2, nom: 'LA BIBLIOTHÈQUE', salle: 'bibliotheque', bpm: 124, volants: true,
    vitesseGoule: [1.2, 1.6], actions: { flash: true },
    consignes: TEXTES.bibliotheque.consignes,
    secrets: ['biblio-registre', 'biblio-carte', 'biblio-photo'],
    parcours: [
      { z: 8, arret: { vagues: [[0.5, 'goule', -0.6], [2, 'drap', 0.4], [5, 'goule', 0.8]] } },
      { z: 18, arret: { vagues: [[0.4, 'drap', -1], [1.6, 'goule', 1], [2.4, 'lumi', -1], [4.2, 'drap', 0.8], [5.6, 'ombre', 0]] } },
      { z: 28, arret: {
        vagues: [[0.4, 'goule', -1], [1.2, 'drap', 1], [3, 'ombre', -0.6], [4, 'goule', 0.6], [5.4, 'drap', 0]],
        secret: { id: 'biblio-registre', forme: 'affiche', x: 1.95, y: -0.6, dz: 6 } } },
      { z: 36, aiguillage: {
        g: { nom: '< ARCHIVES', danger: 1, gain: 1, etapes: [{ z: 46, arret: {
          vagues: [[0.4, 'drap', -1], [2.6, 'goule', 1], [4.8, 'drap', 0.4], [7, 'ombre', 0]],
          secret: { id: 'biblio-carte', forme: 'plan', x: -1.95, y: -0.6, dz: 5 } } }] },
        d: { nom: 'RÉSERVE >', danger: 2, gain: 2, etapes: [{ z: 46, arret: {
          vagues: [[0.3, 'ombre', -1], [1, 'drap', 1], [1.8, 'gouleVol', -1], [2.6, 'drap', -0.6], [3.6, 'ombre', 1],
            [4.4, 'goule', 0], [5.6, 'gouleVol', 1], [6.4, 'drap', 0.6]],
          secret: { id: 'biblio-photo', forme: 'portrait', x: 1.95, y: -0.6, dz: 5 } } }] },
      } },
      { z: 58, arret: { vagues: [[0.3, 'drap', -1.1], [1, 'goule', 1.1], [2.6, 'ombre', 0], [4.2, 'drap', 0.6], [5.4, 'goule', -0.6]] } },
      { z: 70, boss: 'bibliothecaire' },
    ],
  },
  // La Salle de bal apprend le RYTHME : capturer sur le temps est PARFAIT, et remplit
  // la super-attaque. L'orchestre fantôme tire sur les temps.
  bal: {
    id: 'bal', numero: 3, nom: 'LA SALLE DE BAL', salle: 'bal', bpm: 128, musique: 'bal', volants: true,
    vitesseGoule: [1.2, 1.6], actions: { flash: true, rythme: true, super: true },
    consignes: TEXTES.bal.consignes,
    secrets: ['bal-programme', 'bal-disque', 'bal-carton'],
    parcours: [
      { z: 8, arret: { vagues: [[0.5, 'goule', -0.5], [2, 'saxo', 0.6], [4.5, 'goule', 0.8]] } },
      { z: 18, arret: { vagues: [[0.4, 'saxo', -1], [1.4, 'goule', 1], [2.4, 'lumi', -1], [3.4, 'saxo', 1], [5, 'drap', 0]] } },
      { z: 28, arret: {
        vagues: [[0.3, 'saxo', -1.1], [0.6, 'saxo', 1.1], [2.4, 'goule', 0], [4, 'ombre', 0.5], [5.2, 'goule', -0.8]],
        secret: { id: 'bal-programme', forme: 'affiche', x: 1.95, y: -0.6, dz: 6 } } },
      { z: 36, aiguillage: {
        g: { nom: '< VESTIBULE', danger: 1, gain: 1, etapes: [{ z: 46, arret: {
          vagues: [[0.4, 'saxo', -1], [2.6, 'goule', 1], [4.6, 'saxo', 0.6], [6.6, 'drap', 0]],
          secret: { id: 'bal-disque', forme: 'plan', x: -1.95, y: -0.6, dz: 5 } } }] },
        d: { nom: 'PISTE >', danger: 2, gain: 2, etapes: [{ z: 46, arret: {
          // un saxophoniste à la fois : serrés, ils atteignaient le wagon (robot enfant : 35 %)
          vagues: [[0.3, 'saxo', -1.2], [1.6, 'gouleVol', -1], [2.8, 'saxo', 1.2], [4, 'gouleVol', 1],
            [5.2, 'goule', -0.6], [6.6, 'saxo', 0], [8, 'goule', 0.6]],
          secret: { id: 'bal-carton', forme: 'portrait', x: 1.95, y: -0.6, dz: 5 } } }] },
      } },
      { z: 58, arret: { vagues: [[0.3, 'saxo', -1], [0.9, 'saxo', 1], [2.6, 'goule', 0], [4.2, 'saxo', 0.5], [5.4, 'drap', -0.6]] } },
      { z: 70, boss: 'chef' },
    ],
  },
  // Le Grenier apprend le SLAM : tirer à l'opposé du fantôme qui se débat. Tout ce
  // qu'on a appris y sert, jusqu'à la Gouvernante.
  grenier: {
    id: 'grenier', numero: 4, nom: 'LE GRENIER', salle: 'grenier', bpm: 124, volants: true,
    vitesseGoule: [1.3, 1.7], actions: { flash: true, rythme: true, super: true, slam: true },
    consignes: TEXTES.grenier.consignes,
    secrets: ['grenier-malle', 'grenier-lettre', 'grenier-ticket'],
    parcours: [
      { z: 8, arret: { vagues: [[0.5, 'crane', 0], [4, 'goule', -0.8]] } },
      { z: 18, arret: { vagues: [[0.4, 'crane', -1], [1.6, 'goule', 1], [2.4, 'lumi', -1], [3.8, 'drap', 0.6], [5.2, 'crane', 0.8]] } },
      { z: 28, arret: {
        vagues: [[0.3, 'goule', -1.1], [0.8, 'crane', 1.1], [2.4, 'saxo', 0], [4, 'ombre', -0.4], [5.2, 'crane', 0]],
        secret: { id: 'grenier-malle', forme: 'affiche', x: 1.95, y: -0.6, dz: 6 } } },
      { z: 36, aiguillage: {
        g: { nom: '< MALLES', danger: 1, gain: 1, etapes: [{ z: 46, arret: {
          vagues: [[0.4, 'crane', -1], [2.6, 'goule', 1], [4.6, 'drap', 0.4], [6.6, 'crane', 0]],
          secret: { id: 'grenier-lettre', forme: 'plan', x: -1.95, y: -0.6, dz: 5 } } }] },
        d: { nom: 'CHARPENTE >', danger: 2, gain: 2, etapes: [{ z: 46, arret: {
          vagues: [[0.3, 'crane', -1.2], [0.8, 'crane', 1.2], [1.8, 'gouleVol', -1], [2.6, 'ombre', 0], [3.6, 'gouleVol', 1],
            [4.6, 'crane', -0.6], [5.6, 'goule', 0.6], [6.6, 'saxo', 0]],
          secret: { id: 'grenier-ticket', forme: 'portrait', x: 1.95, y: -0.6, dz: 5 } } }] },
      } },
      { z: 58, arret: { vagues: [[0.3, 'crane', -1], [1, 'goule', 1], [2.6, 'drap', 0], [4.2, 'crane', 0.6], [5.4, 'goule', -0.6]] } },
      { z: 70, boss: 'gouvernante' },
    ],
  },
};

// Les missions jouables ; une mission absente d'ici s'afficherait « X » à la gare
export const MISSIONS_EXISTANTES = ['hall', 'bibliotheque', 'bal', 'grenier'];
export const NOMS = { hall: 'LE GRAND HALL', bibliotheque: 'LA BIBLIOTHÈQUE', bal: 'LA SALLE DE BAL', grenier: 'LE GRENIER' };
