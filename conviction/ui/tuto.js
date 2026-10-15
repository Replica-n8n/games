// Le tutoriel joué : la première enquête (Valcourt) guide les premiers
// gestes, une bulle à la fois, et attend que le joueur les fasse. Un nouveau
// venu n'a plus à lire les règles dans le dossier pour commencer.
// Rangé sous `tuto` une fois fini ou passé : il ne revient jamais.

import { TUTO } from '../i18n/fr.js';
import { load, save } from './storage.js';

/** @typedef {{ cible: string, texte: string, attend?: 'select' | 'place', bouton?: string }} Etape */

/**
 * @param {string} premier l'id de la première personne à choisir
 * @param {string} nom son nom court, pour les bulles
 * @param {() => void} [fin] appelé quand le tutoriel se termine ou est passé
 * @returns {{ evenement: (type: 'select' | 'place', id: string) => void, actif: () => boolean }}
 */
export function tutoriel(premier, nom, fin = () => {}) {
  /** @type {Etape[]} */
  const etapes = [
    { cible: '#choix', texte: TUTO.temoins, attend: 'select' },
    { cible: '#temoin', texte: TUTO.placer, attend: 'place' },
    { cible: '.maquette', texte: TUTO.regle, bouton: TUTO.compris },
    { cible: '#b-indice', texte: TUTO.aide, bouton: TUTO.aVous },
  ];
  let i = -1;
  const bulle = document.createElement('div');
  bulle.className = 'tuto';
  bulle.setAttribute('role', 'status');
  document.body.append(bulle);

  const finir = () => {
    save('tuto', true);
    document.querySelector('.tuto-cible')?.classList.remove('tuto-cible');
    bulle.remove();
    i = etapes.length;
    fin();
  };
  const suivante = () => {
    i++;
    document.querySelector('.tuto-cible')?.classList.remove('tuto-cible');
    if (i >= etapes.length) return finir();
    const e = etapes[i];
    const cible = /** @type {HTMLElement | null} */ (document.querySelector(e.cible));
    cible?.classList.add('tuto-cible');
    bulle.innerHTML = `<p>${e.texte.replaceAll('{premier}', nom)}</p><div class="tuto-actions">${e.bouton ? `<button type="button" class="btn principal" data-t="ok">${e.bouton}</button>` : ''}<button type="button" class="btn" data-t="passer">${TUTO.passer}</button></div><span class="tuto-n">${i + 1} / ${etapes.length}</span>`;
    placer(cible);
    /** @type {HTMLElement | null} */ (bulle.querySelector('[data-t="ok"]'))?.focus();
  };
  /** La bulle sous la cible, ou au-dessus s'il n'y a pas la place. @param {HTMLElement | null} cible */
  const placer = (cible) => {
    if (!cible) return;
    cible.scrollIntoView({ block: 'nearest' });
    const r = cible.getBoundingClientRect();
    const h = bulle.offsetHeight || 140;
    const dessous = r.bottom + 12 + h < innerHeight;
    bulle.style.top = `${Math.max(8, dessous ? r.bottom + 12 : r.top - h - 12)}px`;
    bulle.dataset.cote = dessous ? 'dessous' : 'dessus';
  };
  bulle.addEventListener('click', (ev) => {
    const t = /** @type {HTMLElement} */ (ev.target).closest('[data-t]');
    if (!t) return;
    if (/** @type {HTMLElement} */ (t).dataset.t === 'passer') finir(); else suivante();
  });
  addEventListener('resize', () => { if (i >= 0 && i < etapes.length) placer(document.querySelector(etapes[i].cible)); });
  suivante();

  return {
    evenement(type, id) {
      const e = etapes[i];
      if (!e || e.attend !== type) return;
      if (type === 'select' && id !== premier) return;
      suivante();
    },
    actif: () => i < etapes.length,
  };
}

/** Le tutoriel est-il à montrer ? Seulement pour la première enquête, une fois. */
export const tutoAFaire = () => !load('tuto', false);
