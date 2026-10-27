// Les commandes : on pose le doigt (ou on clique) sur ce qu'on veut aspirer, et on
// garde appuyé. Au doigt, le viseur se place ECART pixels AU-DESSUS du doigt, pour
// qu'il ne cache pas sa cible ; à la souris, il est sous le curseur.
// Le FLASH (dès la bibliothèque) : bouton FLASH, ou clic droit, ou F.
// La SUPER (dès la salle de bal) : bouton SUPER, ou E, ou Espace.
// Échap ou P : pause. Un geste ne dure qu'un pas : `lire` le rend, puis l'oublie.
import { W, H, ECART } from './moteur/constantes.js';

/**
 * @param {HTMLCanvasElement} toile
 * @param {{flash: HTMLElement, super: HTMLElement}} boutons
 * @param {{actif: () => boolean, pause: () => void}} o
 */
export function brancherEntrees(toile, boutons, o) {
  const etat = { x: 160, y: 100, bas: false, flash: false, super: false };
  const api = {
    tactile: false,
    lire() { const e = { ...etat }; etat.flash = false; etat.super = false; return e; },
    relacher() { etat.bas = false; etat.flash = false; etat.super = false; },
  };
  const placer = (ev) => {
    const r = toile.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width * W, y = (ev.clientY - r.top) / r.height * H;
    api.tactile = ev.pointerType === 'touch' || ev.pointerType === 'pen';
    etat.x = Math.max(0, Math.min(W, x)); etat.y = Math.max(0, Math.min(H, y - (api.tactile ? ECART : 0)));
  };
  toile.addEventListener('pointerdown', (ev) => {
    if (!o.actif()) return;
    ev.preventDefault();
    // le clic droit de la souris : le flash, là où l'on vise
    if (ev.pointerType === 'mouse' && ev.button === 2) { placer(ev); etat.flash = true; return; }
    try { toile.setPointerCapture(ev.pointerId); } catch { /* sans capture */ }
    placer(ev); etat.bas = true;
  });
  toile.addEventListener('pointermove', (ev) => { if (o.actif() && (etat.bas || ev.pointerType === 'mouse')) placer(ev); });
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) toile.addEventListener(t, (/** @type {any} */ ev) => { if (!(ev.pointerType === 'mouse' && ev.button === 2)) etat.bas = false; });
  toile.addEventListener('contextmenu', (ev) => ev.preventDefault());
  // les boutons FLASH et SUPER : ils ne prennent pas le doigt qui vise
  for (const [b, cle] of /** @type {[HTMLElement, 'flash' | 'super'][]} */ ([[boutons.flash, 'flash'], [boutons.super, 'super']])) {
    b.addEventListener('pointerdown', (ev) => { ev.preventDefault(); ev.stopPropagation(); if (o.actif()) etat[cle] = true; });
    b.addEventListener('click', (ev) => ev.preventDefault());
  }
  addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' || ev.key === 'p' || ev.key === 'P') o.pause();
    if (!o.actif()) return;
    if (ev.key === 'f' || ev.key === 'F') etat.flash = true;
    if (ev.key === 'e' || ev.key === 'E' || ev.key === ' ') { etat.super = true; ev.preventDefault(); }
  });
  addEventListener('blur', () => { etat.bas = false; });
  return api;
}
