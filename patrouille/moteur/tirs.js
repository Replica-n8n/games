// Tirs du joueur : le tir de base de chaque module, et les 6 armes spéciales à munitions
// (une seule à la fois ; en ramasser une autre la remplace, munitions pleines).

/** @typedef {{ x: number, y: number, vx?: number, vy?: number, dmg?: number, r?: number, forme?: string, perce?: Set<object>, vie?: number, guide?: boolean, rebond?: number, zone?: number, acc?: number }} Balle */
/** @typedef {(b: Balle) => void} Ajoute */
/** @typedef {{ suivant: () => number, entre: (a: number, b: number) => number }} Hasard */

/** @type {Record<string, { nom: string, mun: number, cad: number, couleur: string, tir: (j: {x:number,y:number}, ajoute: Ajoute, h: Hasard) => void }>} */
export const ARMES = {
  crayon:     { nom: 'Lance-crayons', mun: 40, cad: 14, couleur: '#ffe14d',
    tir(j, a) { a({ x: j.x, y: j.y - 18, vy: -12, dmg: 2, perce: new Set(), forme: 'trait' }); } },
  arrosoir:   { nom: 'Arrosoir', mun: 220, cad: 3, couleur: '#6fd3ff',
    tir(j, a, h) { a({ x: j.x + h.entre(-4, 4), y: j.y - 16, vx: h.entre(-0.8, 0.8), vy: -6.5, dmg: 1, vie: 30, forme: 'goutte' }); } },
  elastiques: { nom: 'Élastiques', mun: 30, cad: 14, couleur: '#ff9de2',
    tir(j, a) { for (let i = -2; i <= 2; i++) a({ x: j.x, y: j.y - 14, vx: i * 1.8, vy: -8, dmg: 1, forme: 'rond' }); } },
  avions:     { nom: 'Avions téléguidés', mun: 24, cad: 24, couleur: '#c6ff6f',
    tir(j, a) { for (const s of [-1, 1]) a({ x: j.x + s * 12, y: j.y, vx: s * 2, vy: -4, dmg: 3, guide: true, vie: 150, forme: 'fleche' }); } },
  billes:     { nom: 'Billes', mun: 30, cad: 16, couleur: '#ffffff',
    tir(j, a) { for (const s of [-1, 1]) a({ x: j.x, y: j.y - 14, vx: s * 3, vy: -7, dmg: 1, rebond: 3, vie: 200, r: 5, forme: 'rond' }); } },
  bulles:     { nom: 'Grosses bulles', mun: 20, cad: 22, couleur: '#9fe8ff',
    tir(j, a) { a({ x: j.x, y: j.y - 18, vy: -3.5, dmg: 3, zone: 46, r: 11, forme: 'bulle' }); } },
};
export const LISTE_ARMES = Object.keys(ARMES);

/**
 * Tir de base. Le niveau vient du Hangar (0 à 3) : cadence, puis tir double, puis éventail.
 * Le sous-marin tire des torpilles qui partent lentement et accélèrent.
 * @param {string} module @param {number} niveau
 * @returns {{ cad: number, tir: (j: {x:number,y:number}, a: Ajoute) => void }}
 */
export function tirBase(module, niveau) {
  const cad = [12, 9, 9, 7][niveau] ?? 12;
  const une = module === 'sousmarin'
    ? (j, a, dx = 0, vx = 0) => a({ x: j.x + dx, y: j.y - 16, vx, vy: -2.5, acc: -0.22, dmg: 2, r: 5, forme: 'torpille' })
    : (j, a, dx = 0, vx = 0) => a({ x: j.x + dx, y: j.y - 16, vx });
  return {
    cad,
    tir(j, a) {
      if (niveau >= 2) { une(j, a, -6); une(j, a, 6); } else une(j, a);
      if (niveau >= 3) { une(j, a, -8, -1.4); une(j, a, 8, 1.4); }
    },
  };
}
