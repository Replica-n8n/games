// Les commandes : on pose le doigt (ou on clique) sur ce qu'on veut aspirer, et on
// garde appuyé. Au doigt, le viseur se place ECART pixels AU-DESSUS du doigt, pour
// qu'il ne cache pas sa cible ; à la souris, il est sous le curseur.
// La TORCHE (dès la bibliothèque) : on GARDE le bouton TORCHE, ou le clic droit, ou F.
// La SUPER (dès la salle de bal) : bouton SUPER, ou E, ou Espace.
// Échap ou P : pause. La super ne dure qu'un pas : `lire` la rend, puis l'oublie.
import { W, H, ECART } from './moteur/constantes.js';

/**
 * @param {HTMLCanvasElement} toile
 * @param {{torche: HTMLElement, super: HTMLElement}} boutons
 * @param {{actif: () => boolean, pause: () => void}} o
 */
export function brancherEntrees(toile, boutons, o) {
  const etat = { x: 160, y: 100, bas: false, torche: false, super: false };
  const api = {
    tactile: false,
    lire() { const e = { ...etat }; etat.super = false; return e; },
    relacher() { etat.bas = false; etat.torche = false; etat.super = false; },
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
    // le clic droit de la souris, gardé : la torche, là où l'on vise
    if (ev.pointerType === 'mouse' && ev.button === 2) { placer(ev); etat.torche = true; return; }
    try { toile.setPointerCapture(ev.pointerId); } catch { /* sans capture */ }
    placer(ev); etat.bas = true;
  });
  toile.addEventListener('pointermove', (ev) => {
    if (!o.actif()) return;
    // à la souris, un second bouton pressé ou lâché n'arrive qu'ici (pas de pointerdown) : on
    // relit les deux, sinon un clic gauche pendant que le droit tient la torche n'aspirait rien
    if (ev.pointerType === 'mouse') { etat.torche = (ev.buttons & 2) !== 0; etat.bas = (ev.buttons & 1) !== 0; }
    if (etat.bas || ev.pointerType === 'mouse') placer(ev);
  });
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) toile.addEventListener(t, (/** @type {any} */ ev) => { if (ev.pointerType === 'mouse' && ev.button === 2) etat.torche = false; else etat.bas = false; });
  toile.addEventListener('contextmenu', (ev) => ev.preventDefault());
  // les boutons TORCHE (gardé) et SUPER : ils ne prennent pas le doigt qui vise
  const bt = boutons.torche;
  bt.addEventListener('pointerdown', (ev) => { ev.preventDefault(); ev.stopPropagation(); if (!o.actif()) return; try { bt.setPointerCapture(ev.pointerId); } catch { /* sans capture */ } etat.torche = true; });
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) bt.addEventListener(t, () => { etat.torche = false; });
  boutons.super.addEventListener('pointerdown', (ev) => { ev.preventDefault(); ev.stopPropagation(); if (o.actif()) etat.super = true; });
  for (const b of [bt, boutons.super]) { b.addEventListener('click', (ev) => ev.preventDefault()); b.addEventListener('contextmenu', (ev) => ev.preventDefault()); }
  addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' || ev.key === 'p' || ev.key === 'P') o.pause();
    if (!o.actif()) return;
    if (ev.key === 'f' || ev.key === 'F') etat.torche = true;
    if (ev.key === 'e' || ev.key === 'E' || ev.key === ' ') { etat.super = true; ev.preventDefault(); }
  });
  addEventListener('keyup', (ev) => { if (ev.key === 'f' || ev.key === 'F') etat.torche = false; });
  addEventListener('blur', () => { etat.bas = false; etat.torche = false; });
  return api;
}
