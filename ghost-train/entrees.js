// Ghost Train : les commandes. Au doigt, le pouce de visée glisse n'importe où
// sur sa moitié d'écran (visée RELATIVE, comme la POC : le doigt ne cache pas la
// cible) et l'autre pouce tient le bouton TIRER ; FLASH et SUPER sont à côté.
// À la souris, on vise où est le pointeur, le clic gauche tient le rayon, le clic
// droit flashe. Au clavier, flèches et Espace, F pour le flash, E pour la super.
import { W, H } from './moteur/constantes.js';

const SENSIBILITE = 1.7;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/**
 * @param {HTMLCanvasElement} toile
 * @param {HTMLElement} bTirer le bouton TIRER (tenu)
 * @param {{flash: HTMLElement, super: HTMLElement}} boutons FLASH et SUPER (une pression)
 * @param {{gaucher: () => boolean, actif: () => boolean, pause: () => void}} o
 */
export function brancherEntrees(toile, bTirer, boutons, o) {
  const etat = { x: W / 2, y: H / 2, souris: false, doigt: null, lx: 0, ly: 0, tireDoigt: false, tireSouris: false, touches: {}, tactile: false, flash: false, super: false };
  const local = (ev) => { const r = toile.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width * W, (ev.clientY - r.top) / r.height * H]; };

  toile.addEventListener('pointerdown', (ev) => {
    if (!o.actif()) return;
    ev.preventDefault();
    const [x, y] = local(ev);
    if (ev.pointerType === 'mouse') {
      etat.tactile = false; etat.x = clamp(x, 2, W - 3); etat.y = clamp(y, 2, H - 3);
      if (ev.button === 0) etat.tireSouris = true;
      if (ev.button === 2) etat.flash = true;
      return;
    }
    etat.tactile = true;
    // la moitié de visée : la gauche, ou la droite pour un gaucher
    if ((x < W * 0.62) !== o.gaucher() && etat.doigt === null) {
      etat.doigt = ev.pointerId; etat.lx = x; etat.ly = y;
      try { toile.setPointerCapture(ev.pointerId); } catch { /* sans capture, ça marche quand même */ }
    }
  });
  toile.addEventListener('pointermove', (ev) => {
    const [x, y] = local(ev);
    if (ev.pointerType === 'mouse') { etat.x = clamp(x, 2, W - 3); etat.y = clamp(y, 2, H - 3); return; }
    if (ev.pointerId !== etat.doigt) return;
    etat.x = clamp(etat.x + (x - etat.lx) * SENSIBILITE, 2, W - 3);
    etat.y = clamp(etat.y + (y - etat.ly) * SENSIBILITE, 2, H - 3);
    etat.lx = x; etat.ly = y;
  });
  const lever = (ev) => {
    if (ev.pointerType === 'mouse') { if (ev.button === 0) etat.tireSouris = false; return; }
    if (ev.pointerId === etat.doigt) etat.doigt = null;
  };
  toile.addEventListener('pointerup', lever);
  toile.addEventListener('pointercancel', lever);
  toile.addEventListener('contextmenu', (ev) => ev.preventDefault());

  bTirer.addEventListener('pointerdown', (ev) => { ev.preventDefault(); etat.tactile = true; etat.tireDoigt = true; try { bTirer.setPointerCapture(ev.pointerId); } catch { /* idem */ } });
  const lacher = () => { etat.tireDoigt = false; };
  bTirer.addEventListener('pointerup', lacher);
  bTirer.addEventListener('pointercancel', lacher);
  bTirer.addEventListener('lostpointercapture', lacher);
  bTirer.addEventListener('contextmenu', (ev) => ev.preventDefault());
  for (const [cle, b] of /** @type {[string, HTMLElement][]} */ ([['flash', boutons.flash], ['super', boutons.super]])) {
    b.addEventListener('pointerdown', (ev) => { ev.preventDefault(); etat.tactile = true; etat[cle] = true; });
    b.addEventListener('contextmenu', (ev) => ev.preventDefault());
  }

  addEventListener('keydown', (ev) => {
    if (!o.actif()) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ev.code)) ev.preventDefault();
    if (ev.code === 'KeyP' || ev.code === 'Escape') { if (!ev.repeat) o.pause(); return; }
    if (!ev.repeat && (ev.code === 'KeyF' || ev.code === 'KeyC')) { etat.flash = true; return; }
    if (!ev.repeat && ev.code === 'KeyE') { etat.super = true; return; }
    etat.touches[ev.code] = true;
  });
  addEventListener('keyup', (ev) => { etat.touches[ev.code] = false; });
  addEventListener('blur', () => relacher());

  function relacher() { etat.tireDoigt = false; etat.tireSouris = false; etat.doigt = null; etat.touches = {}; etat.flash = false; etat.super = false; }

  return {
    /** L'entrée du pas : le clavier déplace le viseur à 170 pixels par seconde. @param {number} dt */
    lire(dt) {
      const k = etat.touches, v = 170 * dt;
      if (k.ArrowLeft || k.KeyA || k.KeyQ) etat.x -= v;
      if (k.ArrowRight || k.KeyD) etat.x += v;
      if (k.ArrowUp || k.KeyW || k.KeyZ) etat.y -= v;
      if (k.ArrowDown || k.KeyS) etat.y += v;
      etat.x = clamp(etat.x, 2, W - 3); etat.y = clamp(etat.y, 2, H - 3);
      // flash et super ne valent qu'un pas : appuyer, c'est déclencher une fois
      const flash = etat.flash, sup = etat.super; etat.flash = false; etat.super = false;
      return { x: etat.x, y: etat.y, tire: etat.tireDoigt || etat.tireSouris || !!k.Space || !!k.KeyX, flash, super: sup };
    },
    relacher,
    centrer() { etat.x = W / 2; etat.y = H / 2; },
    get tactile() { return etat.tactile; },
  };
}
