// La scène d'accusation, plein écran, par-dessus le plan : le cri, la preuve,
// la chute du coupable, les barreaux. Accuser un innocent : il proteste.
// Toucher fait avancer, « Passer » va au bout. Animations réduites : les
// images s'enchaînent sans tremblement ni glissement.

import { SCENE } from '../i18n/fr.js';
import { buste } from './buste.js';

/** @typedef {import('../engine/types.js').Person} Person */

/**
 * @param {{ accused: Person, victim: Person, right: boolean, room: string, verdict: string,
 *   aveu?: string, vibrate: boolean }} o room : la pièce de l'accusé, comme « dans la grande salle » ;
 *   aveu : la réplique du coupable démasqué (sinon le récit des faits)
 * @returns {Promise<void>} quand la scène se ferme
 */
export function jouerScene(o) {
  const { accused: a, victim: v, right, room, verdict } = o;
  const avant = /** @type {HTMLElement | null} */ (document.activeElement);
  const el = document.createElement('div');
  el.className = 'scene';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', right ? SCENE.titre : SCENE.innocent);
  const visage = (/** @type {Person} */ p, /** @type {'' | 'choc' | 'fier'} */ m = '') => `<span class="buste" aria-hidden="true">${buste(p, m)}</span>`;
  const esc = (/** @type {string} */ s) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

  /** Les images, dans l'ordre. [classe, contenu, vibration] */
  /** @type {[string, string, number[]?][]} */
  const images = right
    ? [
      ['cri', `<div class="eclat" aria-hidden="true"><svg viewBox="0 0 340 150" preserveAspectRatio="none"><path d="M10 40 L60 10 L80 32 L130 4 L150 30 L210 6 L222 34 L290 8 L292 44 L334 50 L304 78 L332 110 L282 112 L276 146 L220 118 L180 146 L150 116 L96 144 L88 112 L30 128 L44 92 L4 76 L36 58 Z"/></svg><b>${SCENE.cri}</b></div>${visage(a)}<p class="nom">${esc(a.name)}</p>`, [30, 30, 60]],
      ['preuve', `<div class="duo">${visage(a)}<span class="seuls">${a.fem && v.fem ? 'seules' : SCENE.seuls}</span>${visage(v)}</div><p class="texte">${esc(SCENE.preuve(a.name, v.name, room, !!a.fem && !!v.fem))}</p>`],
      ['chute', `${visage(a, 'choc')}${o.aveu ? `<p class="bulle"><b>${esc(a.name)}</b>${esc(o.aveu)}</p>` : `<div class="recit"><b>${SCENE.faits}</b><p>${esc(verdict)}</p></div>`}`],
      ['cellule', `<div class="barreaux-cadre">${visage(a, 'choc')}<span class="barreaux" aria-hidden="true"></span></div><p class="clac" aria-hidden="true">${SCENE.clac}</p><p class="texte">${esc(SCENE.verrous(a.name, !!a.fem))}</p>`, [80]],
    ]
    : [['proteste', `${visage(a, 'fier')}<p class="bulle"><b>${esc(a.name)}</b>${esc(SCENE.proteste(room))}</p><p class="texte">${esc(SCENE.innocentTexte(v.name))}</p>`, [40, 60, 40]]];

  el.innerHTML = `<div class="image" aria-live="polite"></div><div class="actions"><button type="button" class="btn principal" data-s="suite"></button>${images.length > 1 ? `<button type="button" class="btn" data-s="passer">${SCENE.passer}</button>` : ''}</div>`;
  document.body.append(el);
  document.body.classList.add('en-scene');
  const zone = /** @type {HTMLElement} */ (el.querySelector('.image'));
  const suite = /** @type {HTMLButtonElement} */ (el.querySelector('[data-s="suite"]'));
  let i = -1;

  return new Promise((fin) => {
    const fermer = () => {
      document.removeEventListener('keydown', clavier);
      el.classList.add('sortie');
      const ok = () => { el.remove(); document.body.classList.remove('en-scene'); avant?.focus?.(); fin(); };
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) ok(); else setTimeout(ok, 180);
    };
    const avancer = () => {
      i++;
      if (i >= images.length) return fermer();
      const [cls, html, vib] = images[i];
      zone.className = `image ${cls}`;
      el.dataset.image = cls;
      const passer = /** @type {HTMLElement | null} */ (el.querySelector('[data-s="passer"]'));
      if (passer) passer.hidden = i === images.length - 1;
      zone.innerHTML = html;
      suite.textContent = i === images.length - 1 ? (right ? SCENE.classer : SCENE.reflechir) : SCENE.continuer;
      if (vib && o.vibrate) navigator.vibrate?.(vib);
      suite.focus();
    };
    /** @param {KeyboardEvent} e */
    const clavier = (e) => { if (e.key === 'Escape') fermer(); };
    document.addEventListener('keydown', clavier);
    el.addEventListener('click', (e) => {
      const b = /** @type {HTMLElement} */ (e.target).closest('[data-s]');
      if (b && /** @type {HTMLElement} */ (b).dataset.s === 'passer') return fermer();
      avancer();
    });
    avancer();
  });
}
