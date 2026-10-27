// Les robots qui jouent à notre place, pour équilibrer et pour les bancs. Ils
// lisent la partie et rendent ce qu'un doigt rendrait : { x, y, bas, flash, super }.
//   'expert' : vise vite et juste, pense au décor, flashe ce qui se cache, slamme net
//   'enfant' : vise moins vite, réagit avec un temps de retard, oublie le décor,
//              flashe et slamme maladroitement
import { DT } from './constantes.js';
import { creeHasard } from './hasard.js';
import { boite } from './fantomes.js';
import { protege } from './rayon.js';

const dedans = (b, x, y, m = 0) => x >= b.x - m && x <= b.x + b.w + m && y >= b.y - m && y <= b.y + b.h + m;

/** @param {'expert'|'enfant'} niveau @param {number} [graine] */
export function creeRobot(niveau, graine = 7) {
  const h = creeHasard(graine), enfant = niveau === 'enfant';
  const doigt = { x: 160, y: 100, bas: false, flash: false, super: false };
  let reflexe = 0, vise = null, coup = 0, attente = 0, sens = 1, retard = 0, focus = null;
  return (/** @type {any} */ p) => {
    doigt.flash = false; doigt.super = false;
    if (p.etat !== 'jeu') { doigt.bas = false; return doigt; }
    const A = p.mission.actions || {};
    const vivants = p.ents.filter((e) => e.etat === 'vit' && !e.mort && e.type !== 'chat' && e.type !== 'lumi');
    const lumi = p.ents.find((e) => e.type === 'lumi' && !e.fuite && !e.mort);
    const tirs = vivants.filter((e) => e.tir).sort((a, b) => b.k - a.k);
    const caches = vivants.filter((e) => e.cache && e.revele <= 0);
    const boss = p.boss && !p.boss.mort && p.boss.etat === 'vit' ? p.boss : null;
    const tenu = p.tenu && p.tenu.etat === 'vit' && !p.tenu.mort ? p.tenu : null;
    retard -= DT;

    // la super : pleine, devant du monde ou un boss
    if (A.super && p.jauge >= 1 && (vivants.filter((e) => e.hostile && !e.tir).length >= (enfant ? 2 : 3) || boss)) {
      if (!enfant || retard <= 0) { doigt.super = true; retard = enfant ? h.entre(0.5, 1.2) : 0; }
    }

    // le slam : tenu, il se débat ; un coup sec du doigt à l'opposé
    if (A.slam && tenu && tenu.lutte && p.tire) {
      if (coup > 0) {
        coup--;
        const pas = enfant ? 6 : 9;
        doigt.x = Math.max(0, Math.min(320, doigt.x - tenu.traction.dx * pas * sens)); doigt.y = Math.max(0, Math.min(180, doigt.y - tenu.traction.dy * pas * sens));
        doigt.bas = true; return doigt;
      }
      attente -= DT;
      if (attente <= 0) { coup = enfant ? 12 : 8; attente = enfant ? h.entre(0.9, 1.6) : 0.5; sens = enfant && h.suivant() < 0.25 ? -1 : 1; }
    }

    let cible = null, flasher = false;
    if (enfant) {
      const g = vivants.filter((e) => !e.garde && (!e.tir || e.k > 0.45)).sort((a, b) => (b.tir ? 3 : b.s) - (a.tir ? 3 : a.s))[0];
      reflexe -= DT;
      if (reflexe <= 0) { vise = g ? { x: g.x + h.entre(-4, 4), y: g.y + h.entre(-4, 4), e: g } : null; reflexe = h.entre(0.35, 0.65); }
      if (vise && vise.e && !vise.e.mort && vise.e.etat === 'vit') { vise.x += (vise.e.x - vise.x) * 0.05; vise.y += (vise.e.y - vise.y) * 0.05; }
      cible = vise;
      // l'enfant flashe ce qui se cache quand ça devient gros, et le boss protégé de temps en temps
      if (A.flash && p.flashCD <= 0) {
        const c = caches.filter((e) => e.s > 1.2).sort((a, b) => b.s - a.s)[0];
        if (c) { cible = { x: c.x, y: c.y }; flasher = true; }
        else if (boss && protege(p, boss) && h.suivant() < 0.02) { cible = { x: boss.x, y: boss.y }; flasher = true; }
      }
    } else {
      // le plus pressé d'abord : un fantôme qui va frapper passe avant un tir encore loin
      // il garde sa cible tant qu'une autre n'est pas nettement plus pressée (sinon, entre deux fantômes
      // de même taille, il changeait à chaque image et n'en tenait aucun)
      const tenir = (liste) => { const best = liste[0]; if (!best) return null; if (focus && liste.includes(focus) && focus.s >= best.s - 0.3) return focus; focus = best; return best; };
      const presse = tenir(vivants.filter((e) => !e.tir && !e.garde && !(e.cache && e.revele <= 0) && e.s > 1.9).sort((x, y) => y.s - x.s));
      if (presse && !(tirs.length && tirs[0].k > 0.7)) cible = { x: presse.x, y: presse.y + 2 };
      if (!cible && tirs.length && tirs[0].k > 0.25) cible = { x: tirs[0].x, y: tirs[0].y };
      // ce qui se cache, on le flashe avant qu'il arrive
      if (!cible && A.flash && p.flashCD <= 0) {
        const c = caches.filter((e) => e.s > 0.8).sort((a, b) => b.s - a.s)[0];
        if (c) { cible = { x: c.x, y: c.y }; flasher = true; }
        else if (boss && protege(p, boss)) { cible = { x: boss.x, y: boss.y }; flasher = true; }
      }
      // les livres qui protègent le Bibliothécaire : on les crève un à un
      if (!cible && boss && boss.type === 'bibliothecaire' && protege(p, boss)) { const l = vivants.filter((e) => e.garde).sort((a, b) => b.y - a.y)[0]; if (l) cible = { x: l.x, y: l.y }; }
      // un fantôme presque sur nous passe avant le décor
      const urgent = tenir(vivants.filter((e) => !e.tir && !e.garde && !(e.cache && e.revele <= 0) && e.s > 1.75).sort((x, y) => y.s - x.s));
      if (!cible && urgent) cible = { x: urgent.x, y: urgent.y + 2 };
      const pres = (cx, zone) => vivants.filter((e) => !e.tir && !e.boss && !e.garde && Math.abs(e.x - cx) < zone && e.s > 0.65).length;
      // le décor, seulement si rien n'est sur le point de frapper
      const calme = !vivants.some((e) => !e.tir && !e.garde && e.s > 1.9);
      for (const o of Object.values(p.s.objets)) {
        if (cible || o.fait || !calme) continue;
        if (o.effet === 'tombe' && pres(o.cx, o.zone - 10) >= 2) cible = { x: o.x + o.w / 2, y: o.y + o.h / 2 };
        if (o.effet === 'pend' && vivants.some((e) => !e.tir && !e.boss && !e.garde && Math.abs(e.x - o.cx) < 10 && e.s > 1)) cible = { x: o.x + o.w / 2, y: o.y + o.h / 2 };
        if (o.effet === 'bouchon' && vivants.some((e) => !e.tir && !e.boss && e.s > 0.9)) cible = { x: o.x + o.w / 2, y: o.y + o.h / 2 };
      }
      if (!cible) { const g = tenir(vivants.filter((e) => !e.tir && !e.garde && !(e.cache && e.revele <= 0) && !(e.boss && protege(p, e))).sort((a, b) => b.s - a.s)); if (g) cible = { x: g.x, y: g.y + 2 }; }
      if (!cible && p.ts > 8) for (const o of Object.values(p.s.objets)) if (!o.fait && o.effet === 'pieces') { cible = { x: o.x + o.w / 2, y: o.y + o.h / 2 }; break; }
    }
    if (!cible) { doigt.bas = false; return doigt; }
    const dx = cible.x - doigt.x, dy = cible.y - doigt.y, d = Math.hypot(dx, dy), v = (enfant ? 230 : 420) * DT;
    if (d > v) { doigt.x += dx / d * v; doigt.y += dy / d * v; } else { doigt.x = cible.x; doigt.y = cible.y; }
    if (flasher) { doigt.bas = false; if (d < 12) doigt.flash = true; return doigt; }
    // jamais le rayon sur Lumi (l'enfant, lui, ne fait pas toujours attention)
    const surLumi = lumi && dedans(boite(lumi), doigt.x, doigt.y, 4);
    doigt.bas = d < 14 && !(p.chauffe > 0.85 && !tirs.length) && !(surLumi && (!enfant || h.suivant() < 0.97));
    return doigt;
  };
}
