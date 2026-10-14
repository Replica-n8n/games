// Démarrage : textes de l'interface, réglages, chargement de l'enquête.
// L'accueil, la liste et les réglages arrivent à l'étape 5 ; d'ici là,
// `?enquete=<id>` choisit l'enquête, la première de la liste sinon.

import { UI } from '../i18n/fr.js';
import { mountGame } from './game.js';
import { mountHome } from './home.js';
import { load, save } from './storage.js';

/** @typedef {import('../engine/types.js').Puzzle} Puzzle */

for (const el of document.querySelectorAll('[data-t]')) {
  const v = UI[/** @type {keyof typeof UI} */ (/** @type {HTMLElement} */ (el).dataset.t)];
  if (typeof v === 'string') el.textContent = v;
}
for (const el of document.querySelectorAll('[data-t-label]')) {
  const v = UI[/** @type {keyof typeof UI} */ (/** @type {HTMLElement} */ (el).dataset.tLabel)];
  if (typeof v === 'string') el.setAttribute('aria-label', v);
}

const settings = { theme: 'system', guides: true, light: true, vibrate: true, ...load('reglages', {}) };
if (settings.theme === 'light' || settings.theme === 'dark') document.documentElement.dataset.theme = settings.theme;

try {
  /** @type {string[]} */
  const ids = await (await fetch('puzzles/index.json')).json();
  const wanted = new URLSearchParams(location.search).get('enquete');
  if (wanted && ids.includes(wanted)) {
    /** @type {Puzzle} */
    const puzzle = await (await fetch(`puzzles/${wanted}.json`)).json();
    save('derniere', wanted);
    const mounted = mountGame(puzzle, ids.indexOf(wanted) + 1, settings, { next: ids[ids.indexOf(wanted) + 1] ?? null });
    Object.assign(window, { __conviction: mounted });
  } else {
    /** @type {Puzzle[]} */
    const puzzles = await Promise.all(ids.map(async (id) => (await fetch(`puzzles/${id}.json`)).json()));
    mountHome(puzzles);
  }
} catch (err) {
  const e = /** @type {HTMLElement} */ (document.getElementById('erreur'));
  e.textContent = UI.introuvable;
  e.hidden = false;
  console.error(err);
}
