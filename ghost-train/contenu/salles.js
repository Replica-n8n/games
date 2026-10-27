// Les salles, en données : leurs cachettes (d'où sortent les fantômes, en pixels de
// jeu, avec leur taille de départ) et ce qu'on y vise dans le décor. Le dessin de
// chaque salle (ecran/<salle>.js) peint ses cachettes et ses objets aux MÊMES places.
//
// Un objet : { id, x, y, w, h (sa boîte), besoin (secondes de rayon), effet }.
//   effet 'tombe'   : il tombe ; à `sol` il capture les fantômes à moins de `zone` de `cx`
//   effet 'pend'    : une casserole pendue en `cx` : elle tombe sur le premier fantôme dessous
//   effet 'pieces'  : il se brise et lâche `n` pièces
//   effet 'bouchon' : le bouchon part et assomme le fantôme le plus proche de nous
import { sol } from '../moteur/piece.js';

/** Ce qui est posé sur la table de la salle à manger. */
export const TABLE = { pres: 0.2, loin: 0.86, large: 0.5 };
export const POS_MANGER = { cloche: sol(0, 0.8), candelabre: sol(-0.2, 0.58), bouteille: sol(-0.26, 0.34), soupiere: sol(0.24, 0.42), bord: sol(0, TABLE.pres)[1] };

export const SALLES = {
  salon: {
    nom: 'LE SALON',
    cachettes: {
      armoire: { x: 226, y: 80, s: 0.7 },
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
    nom: 'LA SALLE À MANGER',
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
};
