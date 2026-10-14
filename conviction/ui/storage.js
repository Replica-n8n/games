// Petit module autour de localStorage. L'origine est partagée avec toutes nos
// apps : tout est préfixé. Une lecture ou une écriture peut échouer (navigation
// privée, stockage plein) : le jeu continue, il ne retient simplement rien.

import { STORAGE_PREFIX } from '../config.js';

/** @template T @param {string} key @param {T} fallback @returns {T} */
export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** @param {string} key @param {unknown} value */
export function save(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Rien à faire : la partie reste jouable sans sauvegarde.
  }
}
