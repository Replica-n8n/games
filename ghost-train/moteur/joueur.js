// Les robots qui jouent à notre place, pour équilibrer et pour les bancs. Ils
// lisent la partie et rendent ce qu'un doigt rendrait : { x, y, bas }.
//   'expert' : vise vite et juste, pense au décor (lustre, casseroles, bouchon)
//   'enfant' : vise moins vite, réagit avec un temps de retard, oublie le décor
import { DT } from './constantes.js';
import { creeHasard } from './hasard.js';

/** @param {'expert'|'enfant'} niveau @param {number} [graine] */
export function creeRobot(niveau, graine = 7) {
  const h = creeHasard(graine), enfant = niveau === 'enfant';
  const doigt = { x: 160, y: 100, bas: false };
  let reflexe = 0, vise = null;
  return (/** @type {any} */ p) => {
    if (p.etat !== 'jeu') { doigt.bas = false; return doigt; }
    const vivants = p.ents.filter((e) => e.etat === 'vit' && e.type !== 'chat');
    const tirs = vivants.filter((e) => e.tir).sort((a, b) => b.k - a.k);
    const ob = p.s.objets;
    let cible = null;
    if (enfant) {
      const g = vivants.filter((e) => !e.tir || e.k > 0.45).sort((a, b) => (b.tir ? 3 : b.s) - (a.tir ? 3 : a.s))[0];
      reflexe -= DT;
      if (reflexe <= 0) { vise = g ? { x: g.x + h.entre(-4, 4), y: g.y + h.entre(-4, 4), e: g } : null; reflexe = h.entre(0.35, 0.65); }
      if (vise && vise.e && !vise.e.mort && vise.e.etat === 'vit') { vise.x += (vise.e.x - vise.x) * 0.05; vise.y += (vise.e.y - vise.y) * 0.05; }
      cible = vise;
    } else {
      if (tirs.length && tirs[0].k > 0.25) cible = { x: tirs[0].x, y: tirs[0].y };
      // un fantôme presque sur nous passe avant le décor
      const urgent = vivants.filter((e) => !e.tir && e.s > 1.75).sort((x, y) => y.s - x.s)[0];
      if (!cible && urgent) cible = { x: urgent.x, y: urgent.y + 2 };
      const pres = (cx, zone) => vivants.filter((e) => !e.tir && !e.boss && Math.abs(e.x - cx) < zone && e.s > 0.9).length;
      for (const o of Object.values(ob)) {
        if (cible || o.fait) continue;
        if (o.effet === 'tombe' && pres(o.cx, o.zone - 10) >= 2) cible = { x: o.x + o.w / 2, y: o.y + o.h / 2 };
        if (o.effet === 'pend' && vivants.some((e) => !e.tir && !e.boss && Math.abs(e.x - o.cx) < 10 && e.s > 1)) cible = { x: o.x + o.w / 2, y: o.y + o.h / 2 };
        if (o.effet === 'bouchon' && vivants.some((e) => !e.tir && !e.boss && e.s > 1.3)) cible = { x: o.x + o.w / 2, y: o.y + o.h / 2 };
      }
      if (!cible) { const g = vivants.filter((e) => !e.tir).sort((a, b) => b.s - a.s)[0]; if (g) cible = { x: g.x, y: g.y + 2 }; }
      if (!cible && p.ts > 8) for (const o of Object.values(ob)) if (!o.fait && o.effet === 'pieces') { cible = { x: o.x + o.w / 2, y: o.y + o.h / 2 }; break; }
    }
    if (!cible) { doigt.bas = false; return doigt; }
    const dx = cible.x - doigt.x, dy = cible.y - doigt.y, d = Math.hypot(dx, dy), v = (enfant ? 230 : 420) * DT;
    if (d > v) { doigt.x += dx / d * v; doigt.y += dy / d * v; } else { doigt.x = cible.x; doigt.y = cible.y; }
    doigt.bas = d < 14 && !(p.chauffe > 0.85 && !tirs.length);
    return doigt;
  };
}
