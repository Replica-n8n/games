// Démarrage : textes de l'interface, réglages, chargement de l'enquête.
// L'accueil, la liste et les réglages arrivent à l'étape 5 ; d'ici là,
// `?enquete=<id>` choisit l'enquête, la première de la liste sinon.

import { UI } from '../i18n/fr.js';
import { affine } from '../i18n/typo.js';
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

// ---------- Service worker : hors ligne et mises à jour ----------
// Un rechargement ne redemande pas sw.js : il faut update(), à l'ouverture et
// à chaque retour sur l'onglet. Une nouvelle version ne recharge JAMAIS la page
// d'elle-même (on pourrait être en pleine enquête) : un bandeau propose de
// recharger, et la partie est sauvegardée à chaque geste.
if ('serviceWorker' in navigator) {
  const avait = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (avait) /** @type {HTMLElement} */ (document.getElementById('maj')).hidden = false;
  });
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    const maj = () => { reg.update().catch(() => {}); };
    maj();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) maj(); });
  }).catch(() => {});
  navigator.serviceWorker.ready.then((reg) => {
    if (!reg.active) return;
    const canal = new MessageChannel();
    canal.port1.onmessage = (e) => { const v = document.getElementById('version'); if (v) v.textContent = UI.version(String(e.data)); };
    reg.active.postMessage('version', [canal.port2]);
  }).catch(() => {});
}
/** @type {HTMLElement} */ (document.getElementById('recharger')).addEventListener('click', () => location.reload());

// ---------- Installer : un bouton sur l'accueil tant que l'app n'est pas installée ----------
// Chrome donne son invitation (beforeinstallprompt) ; sans elle (iPhone, ou
// invitation déjà refusée), le bouton dit où se trouve la commande.
/** @type {any} */
let invitation = null;
const installee = () => matchMedia('(display-mode: standalone)').matches || /** @type {any} */ (navigator).standalone === true;
const bouton = /** @type {HTMLButtonElement} */ (document.getElementById('installer'));
const aide = /** @type {HTMLElement} */ (document.getElementById('aide-installer'));
const majInstaller = () => { bouton.hidden = installee(); if (installee()) aide.hidden = true; };
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); invitation = e; majInstaller(); });
addEventListener('appinstalled', () => { invitation = null; majInstaller(); });
bouton.addEventListener('click', () => {
  if (invitation) { const i = invitation; invitation = null; i.prompt(); i.userChoice?.then(majInstaller, majInstaller); return; }
  aide.textContent = /iPhone|iPad|iPod/.test(navigator.userAgent) ? UI.aideIphone : UI.aideAutre;
  aide.hidden = !aide.hidden;
});
majInstaller();

/** @type {{ theme: string, guides: boolean, light: boolean | 'auto', vibrate: boolean }} */
const settings = { theme: 'system', guides: true, light: 'auto', vibrate: true, ...load('reglages', {}) };
if (settings.theme === 'light' || settings.theme === 'dark') document.documentElement.dataset.theme = settings.theme;

try {
  /** @type {string[]} */
  const ids = await (await fetch('puzzles/index.json')).json();
  const wanted = new URLSearchParams(location.search).get('enquete');
  if (wanted && ids.includes(wanted)) {
    /** @type {Puzzle} */
    const puzzle = affine(await (await fetch(`puzzles/${wanted}.json`)).json());
    save('derniere', wanted);
    const mounted = mountGame(puzzle, ids.indexOf(wanted) + 1, settings, { next: ids[ids.indexOf(wanted) + 1] ?? null });
    Object.assign(window, { __conviction: mounted });
  } else {
    /** @type {Puzzle[]} */
    const puzzles = await Promise.all(ids.map(async (id) => affine(await (await fetch(`puzzles/${id}.json`)).json())));
    mountHome(puzzles);
  }
} catch (err) {
  const e = /** @type {HTMLElement} */ (document.getElementById('erreur'));
  e.textContent = UI.introuvable;
  e.hidden = false;
  console.error(err);
}
