// Commande relative : on glisse n'importe où, le module reproduit le mouvement du doigt.
// lire() rend le glissement accumulé depuis la lecture précédente (une fois par image).

/**
 * @param {HTMLElement} zone  l'élément qui reçoit le doigt (le canvas)
 * @param {{ echelle: () => number, sens?: number }} reglages
 */
export function brancherDoigt(zone, { echelle, sens = 1.25 }) {
  let doigt = null, dx = 0, dy = 0;
  zone.addEventListener('pointerdown', (ev) => {
    doigt = { id: ev.pointerId, x: ev.clientX, y: ev.clientY };
    zone.setPointerCapture?.(ev.pointerId);
  });
  zone.addEventListener('pointermove', (ev) => {
    if (!doigt || ev.pointerId !== doigt.id) return;
    dx += ((ev.clientX - doigt.x) / echelle()) * sens;
    dy += ((ev.clientY - doigt.y) / echelle()) * sens;
    doigt.x = ev.clientX; doigt.y = ev.clientY;
  });
  const lacher = (ev) => { if (doigt && ev.pointerId === doigt.id) doigt = null; };
  zone.addEventListener('pointerup', lacher);
  zone.addEventListener('pointercancel', lacher);
  return {
    /** @param {boolean} bas  vrai quand le décor défile vers le bas (sous-marin) : on inverse dy */
    lire(bas = false) {
      const e = { touche: doigt !== null, dx, dy: bas ? -dy : dy };
      dx = dy = 0;
      return e;
    },
    relacher() { doigt = null; dx = dy = 0; },
  };
}
