// Lecture et écriture de la sauvegarde dans le navigateur. Chaque accès est protégé :
// stockage bloqué, plein, vide ou corrompu, le jeu démarre quand même.
import { normaliser } from './moteur/progression.js';

const CLE = 'patrouille:sauvegarde';

export function lire() {
  try { return normaliser(JSON.parse(localStorage.getItem(CLE) || 'null')); }
  catch { return normaliser(null); }
}

/** @param {any} s */
export function ecrire(s) {
  try { localStorage.setItem(CLE, JSON.stringify(s)); return true; }
  catch { return false; }
}

export function effacer() {
  try { localStorage.removeItem(CLE); } catch { /* rien à faire */ }
}
