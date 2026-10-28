// Lecture et écriture dans le navigateur. Deux clés séparées : la progression
// (qu'une défaite n'efface jamais) et les réglages. Chaque accès est protégé :
// stockage bloqué, plein, vide ou corrompu, le jeu démarre quand même.
import { normaliser } from './moteur/progression.js';

const CLE = 'ghost-train:sauvegarde', CLE_REGLAGES = 'ghost-train:reglages';

export function lire() {
  try { return normaliser(JSON.parse(localStorage.getItem(CLE) || 'null')); } catch { return normaliser(null); }
}
/** @param {any} s */
export function ecrire(s) {
  try { localStorage.setItem(CLE, JSON.stringify(s)); return true; } catch { return false; }
}

const moinsDeMouvement = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const niveau = (v, d) => (Number.isFinite(v) ? Math.max(0, Math.min(1, Math.round(v * 5) / 5)) : d);

/** Les réglages ; les flashs réduits sont activés d'office si le téléphone demande moins d'animations. */
export function lireReglages() {
  let r = null;
  try { r = JSON.parse(localStorage.getItem(CLE_REGLAGES) || 'null'); } catch { r = null; }
  r = r && typeof r === 'object' ? r : {};
  return {
    musique: niveau(r.musique, 0.6), sons: niveau(r.sons, 0.8), aide: !!r.aide,
    flashsReduits: typeof r.flashsReduits === 'boolean' ? r.flashsReduits : moinsDeMouvement(),
  };
}
/** @param {any} r */
export function ecrireReglages(r) {
  try { localStorage.setItem(CLE_REGLAGES, JSON.stringify(r)); } catch { /* refusé : le réglage vaut pour cette visite */ }
}
