// Les commandes : on pose le doigt (ou on clique) sur ce qu'on veut aspirer, et on
// garde appuyé. Au doigt, le viseur se place ECART pixels AU-DESSUS du doigt, pour
// qu'il ne cache pas sa cible ; à la souris, il est sous le curseur.
// Échap ou P : pause.
import { W, H, ECART } from './moteur/constantes.js';

/**
 * @param {HTMLCanvasElement} toile
 * @param {{actif: () => boolean, pause: () => void}} o
 */
export function brancherEntrees(toile, o) {
  const etat = { x: 160, y: 100, bas: false };
  const api = { tactile: false, lire: () => etat, relacher() { etat.bas = false; } };
  const placer = (ev) => {
    const r = toile.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width * W, y = (ev.clientY - r.top) / r.height * H;
    api.tactile = ev.pointerType === 'touch' || ev.pointerType === 'pen';
    etat.x = Math.max(0, Math.min(W, x)); etat.y = Math.max(0, Math.min(H, y - (api.tactile ? ECART : 0)));
  };
  toile.addEventListener('pointerdown', (ev) => {
    if (!o.actif()) return;
    ev.preventDefault();
    try { toile.setPointerCapture(ev.pointerId); } catch { /* sans capture */ }
    placer(ev); etat.bas = true;
  });
  toile.addEventListener('pointermove', (ev) => { if (o.actif() && (etat.bas || ev.pointerType === 'mouse')) placer(ev); });
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) toile.addEventListener(t, () => { etat.bas = false; });
  toile.addEventListener('contextmenu', (ev) => ev.preventDefault());
  addEventListener('keydown', (ev) => { if (ev.key === 'Escape' || ev.key === 'p' || ev.key === 'P') o.pause(); });
  addEventListener('blur', () => { etat.bas = false; });
  return api;
}
