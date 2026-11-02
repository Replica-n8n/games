// La boutique de l'hôtel, en données : elle ouvre quand le rez-de-chaussée est fini ;
// un rayon s'achète une fois avec les pièces, puis se prend en main quand on veut.
// Chaque fonction rend une NOUVELLE sauvegarde (ou null si c'est refusé).
import { RAYONS } from '../contenu/rayons.js';
import { normaliser } from './progression.js';

/** @param {any} s */
export const boutiqueOuverte = (s) => !!(s.missions.rdc && s.missions.rdc.faite);
/** @param {any} s @param {string} id */
export const possede = (s, id) => s.rayons.includes(id);
/** Le rayon en main. @param {any} s */
export const rayonEnMain = (s) => RAYONS.find((r) => r.id === s.rayon) || RAYONS[0];

/** Acheter un rayon (et le prendre en main). @param {any} s @param {string} id */
export function acheter(s, id) {
  const r = RAYONS.find((x) => x.id === id);
  if (!r || !boutiqueOuverte(s) || possede(s, id) || s.pieces < r.prix) return null;
  const n = normaliser(s);
  n.pieces -= r.prix; n.rayons.push(id); n.rayon = id;
  return n;
}
/** Prendre en main un rayon déjà acheté. @param {any} s @param {string} id */
export function prendre(s, id) {
  if (!possede(s, id)) return null;
  const n = normaliser(s); n.rayon = id; return n;
}
/** La boutique a été vue : « NOUVEAU » s'éteint. @param {any} s */
export function vue(s) { const n = normaliser(s); n.boutiqueVue = true; return n; }
