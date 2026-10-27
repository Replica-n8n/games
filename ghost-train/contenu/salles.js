// Les salles, en données : leurs cachettes (d'où sortent les fantômes, en pixels de
// jeu, avec leur taille de départ) et ce qu'on y vise dans le décor. Le dessin de
// chaque salle (ecran/<salle>.js) peint ses cachettes et ses objets aux MÊMES places.
//
// Un objet : { id, x, y, w, h (sa boîte), besoin (secondes de rayon), effet }.
//   effet 'tombe'   : il tombe ; à `sol` il capture les fantômes à moins de `zone` de `cx`
//   effet 'pend'    : une casserole pendue en `cx` : elle tombe sur le premier fantôme dessous
//   effet 'pieces'  : il se brise et lâche `n` pièces
//   effet 'bouchon' : le bouchon part et assomme le fantôme le plus proche de nous
import { sol, mur } from '../moteur/piece.js';

const M = (cote, w, h) => { const [x, y] = mur(cote, w, h); return { x: Math.round(x), y: Math.round(y) }; };

/** Ce qui est posé sur la table de la salle à manger. */
export const TABLE = { pres: 0.2, loin: 0.86, large: 0.5 };
export const POS_MANGER = { cloche: sol(0, 0.8), candelabre: sol(-0.2, 0.58), bouteille: sol(-0.26, 0.34), soupiere: sol(0.24, 0.42), bord: sol(0, TABLE.pres)[1] };

export const SALLES = {
  salon: {
    nom: 'LE HALL',
    cachettes: {
      ascenseur: { x: 226, y: 84, s: 0.7 },
      fenetre: { x: 34, y: 62, s: 0.6 },
      cheminee: { x: 160, y: 100, s: 0.6 },
      miroir: { x: 160, y: 46, s: 0.55 },
    },
    objets: [
      { id: 'lustre', x: 146, y: 16, w: 28, h: 18, besoin: 0.45, effet: 'tombe', cx: 160, zone: 60, sol: 100 },
      { id: 'vase', x: 254, y: 116, w: 16, h: 18, besoin: 0.3, effet: 'pieces', n: 6 },
    ],
  },
  manger: {
    nom: 'LE RESTAURANT',
    cachettes: {
      nappe: { x: 160, y: POS_MANGER.bord + 14, s: 0.7 },
      cloche: { x: POS_MANGER.cloche[0], y: POS_MANGER.cloche[1] - 10, s: 0.5 },
      passeplat: { x: 160, y: 60, s: 0.55 },
      buffet: { x: 222, y: 86, s: 0.6 },
    },
    objets: [
      { id: 'bouteille', x: POS_MANGER.bouteille[0] - 6, y: POS_MANGER.bouteille[1] - 24, w: 12, h: 26, besoin: 0.3, effet: 'bouchon' },
      { id: 'soupiere', x: POS_MANGER.soupiere[0] - 12, y: POS_MANGER.soupiere[1] - 14, w: 24, h: 16, besoin: 0.3, effet: 'pieces', n: 6 },
    ],
  },
  cuisine: {
    nom: 'LA CUISINE',
    cachettes: {
      four: { x: 160, y: 104, s: 0.6 },
      marmite: { x: 160, y: 62, s: 0.55 },
      vaisselier: { x: 96, y: 100, s: 0.6 },
      fenetre: { x: 225, y: 60, s: 0.55 },
    },
    objets: [
      { id: 'casserole0', x: 113, y: 18, w: 16, h: 18, besoin: 0.3, effet: 'pend', cx: 121 },
      { id: 'casserole1', x: 152, y: 18, w: 16, h: 18, besoin: 0.3, effet: 'pend', cx: 160 },
      { id: 'casserole2', x: 191, y: 18, w: 16, h: 18, besoin: 0.3, effet: 'pend', cx: 199 },
      { id: 'bocal', x: 12, y: 74, w: 14, h: 16, besoin: 0.3, effet: 'pieces', n: 8 },
    ],
  },
  // le 1er étage : la bibliothèque
  fumoir: {
    nom: 'LE FUMOIR',
    cachettes: {
      horloge: { x: 95, y: 90, s: 0.5 },
      vitrine: { x: 160, y: 82, s: 0.55 },
      fenetre: { ...M(1, 0.45, 0.31), s: 0.55 },
      fauteuil: { x: 66, y: 124, s: 0.7 },
    },
    objets: [
      { id: 'ventilo', x: 138, y: 10, w: 44, h: 16, besoin: 0.45, effet: 'tombe', cx: 160, zone: 60, sol: 100, eclats: '#c8a070' },
      { id: 'globe', x: 205, y: 73, w: 30, h: 30, besoin: 0.3, effet: 'pieces', n: 7, eclats: '#5a8ad0' },
    ],
  },
  bibliotheque: {
    nom: 'LA BIBLIOTHÈQUE',
    cachettes: {
      passage: { x: 160, y: 84, s: 0.6 },
      rayonG: { ...M(-1, 0.5, 0.5), s: 0.55 },
      rayonD: { ...M(1, 0.5, 0.5), s: 0.55 },
      echelle: { x: 96, y: 46, s: 0.45 },
    },
    objets: [
      { id: 'lustre', x: 142, y: 10, w: 36, h: 16, besoin: 0.45, effet: 'tombe', cx: 160, zone: 60, sol: 100 },
      { id: 'encrier', x: 138, y: 124, w: 18, h: 24, besoin: 0.3, effet: 'pieces', n: 6, eclats: '#5a5a9a' },
    ],
  },
  archives: {
    nom: 'LES ARCHIVES',
    cachettes: {
      fichier: { x: 160, y: 84, s: 0.6 },
      monte: { x: 223, y: 63, s: 0.5 },
      classeur: { ...M(-1, 0.49, 0.6), s: 0.6 },
      cartons: { x: 258, y: 104, s: 0.6 },
    },
    objets: [
      { id: 'ampoule', x: 150, y: 22, w: 20, h: 22, besoin: 0.3, effet: 'pend', cx: 160 },
      { id: 'coffre', x: 34, y: 138, w: 34, h: 32, besoin: 0.3, effet: 'pieces', n: 8, eclats: '#e0b040' },
    ],
  },
  // le 2e étage : la salle de bal
  vestiaire: {
    nom: 'LE VESTIAIRE',
    cachettes: {
      portantG: { ...M(-1, 0.5, 0.45), s: 0.55 },
      portantD: { ...M(1, 0.5, 0.45), s: 0.55 },
      comptoir: { x: 160, y: 84, s: 0.6 },
      malle: { x: 268, y: 134, s: 0.7 },
    },
    objets: [
      { id: 'lustre', x: 144, y: 10, w: 32, h: 20, besoin: 0.45, effet: 'tombe', cx: 160, zone: 60, sol: 100, eclats: '#fff6c8' },
      { id: 'pourboire', x: 115, y: 74, w: 18, h: 16, besoin: 0.3, effet: 'pieces', n: 7, eclats: '#9ad0e8' },
    ],
  },
  bal: {
    nom: 'LA SALLE DE BAL',
    cachettes: {
      rideau: { x: 160, y: 76, s: 0.6 },
      miroirG: { ...M(-1, 0.52, 0.46), s: 0.55 },
      miroirD: { ...M(1, 0.52, 0.46), s: 0.55 },
      piste: { x: 160, y: 140, s: 0.7 },
    },
    objets: [
      { id: 'boule', x: 148, y: 10, w: 24, h: 22, besoin: 0.45, effet: 'tombe', cx: 160, zone: 60, sol: 100, eclats: '#c8d0e8' },
      { id: 'coupes', x: 254, y: 112, w: 44, h: 36, besoin: 0.3, effet: 'pieces', n: 8, eclats: '#e8f4ff' },
    ],
  },
  kiosque: {
    nom: 'LE KIOSQUE À MUSIQUE',
    cachettes: {
      pupitres: { x: 160, y: 88, s: 0.6 },
      piano: { x: 100, y: 96, s: 0.55 },
      caisse: { x: 222, y: 106, s: 0.55 },
      coulisse: { ...M(1, 0.49, 0.55), s: 0.6 },
    },
    objets: [
      { id: 'projecteur', x: 150, y: 22, w: 20, h: 14, besoin: 0.3, effet: 'pend', cx: 160 },
      { id: 'trompette', x: 238, y: 134, w: 36, h: 20, besoin: 0.3, effet: 'pieces', n: 7, eclats: '#ffe890' },
    ],
  },
  // le 3e étage : les combles
  chambre: {
    nom: 'LA CHAMBRE 13',
    cachettes: {
      armoire: { x: 96, y: 82, s: 0.6 },
      lit: { x: 160, y: 112, s: 0.6 },
      baldaquin: { x: 160, y: 54, s: 0.5 },
      fenetre: { ...M(-1, 0.44, 0.32), s: 0.55 },
    },
    objets: [
      { id: 'lustre', x: 146, y: 10, w: 28, h: 18, besoin: 0.45, effet: 'tombe', cx: 160, zone: 60, sol: 100, eclats: '#c8e8ff' },
      { id: 'bijoux', x: 205, y: 82, w: 18, h: 13, besoin: 0.3, effet: 'pieces', n: 7, eclats: '#d84a8a' },
    ],
  },
  lingerie: {
    nom: 'LA LINGERIE',
    cachettes: {
      draps: { x: 160, y: 78, s: 0.55 },
      cuve: { x: 67, y: 128, s: 0.6 },
      chaudiere: { x: 223, y: 90, s: 0.55 },
      etagere: { x: 96, y: 74, s: 0.5 },
    },
    objets: [
      { id: 'corde', x: 70, y: 30, w: 180, h: 26, besoin: 0.45, effet: 'tombe', haut: 30, cx: 160, zone: 70, sol: 100, eclats: '#f0d8d8' },
      { id: 'panier', x: 118, y: 142, w: 44, h: 34, besoin: 0.3, effet: 'pieces', n: 6, eclats: '#f4f0e8' },
    ],
  },
  combles: {
    nom: 'LES COMBLES',
    cachettes: {
      malle: { x: 94, y: 96, s: 0.55 },
      lucarne: { x: 160, y: 52, s: 0.5 },
      poutres: { x: 108, y: 32, s: 0.45 },
      paravent: { x: 246, y: 92, s: 0.6 },
    },
    objets: [
      { id: 'lanterne', x: 152, y: 22, w: 16, h: 18, besoin: 0.3, effet: 'pend', cx: 160 },
      { id: 'coffre', x: 26, y: 134, w: 60, h: 40, besoin: 0.3, effet: 'pieces', n: 10, eclats: '#e0b040' },
    ],
  },
};
