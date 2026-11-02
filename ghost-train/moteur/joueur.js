// Les robots qui jouent à notre place, pour équilibrer et pour les bancs. Ils
// lisent la partie et rendent ce qu'un doigt rendrait : { x, y, bas, torche, super }.
//   'expert' : vise vite et juste, pense au décor, éclaire ce qui se cache, trace les sceaux net
//   'enfant' : vise moins vite, réagit avec un temps de retard, oublie le décor,
//              éclaire et trace en tremblant ; il lève le doigt avant la surchauffe
//   'tetu'   : le même enfant, qui ne lève JAMAIS le doigt (vu chez les enfants de Julie,
//              2026-10-30 : il surchauffe sans cesse et ne lit pas les messages)
// À la pêche d'un boss, les deux suivent le cercle vert : ils le voient avec un temps de
// retard et le rejoignent à vitesse limitée (l'enfant plus lentement).
import { DT } from './constantes.js';
import { creeHasard } from './hasard.js';
import { boite } from './fantomes.js';
import { protege } from './rayon.js';
import { SALLES } from '../contenu/salles.js';

const dedans = (b, x, y, m = 0) => x >= b.x - m && x <= b.x + b.w + m && y >= b.y - m && y <= b.y + b.h + m;

/** @param {'expert'|'enfant'|'tetu'} niveau @param {number} [graine] */
export function creeRobot(niveau, graine = 7) {
  const h = creeHasard(graine), tetu = niveau === 'tetu', enfant = niveau === 'enfant' || tetu;
  const doigt = { x: 160, y: 100, bas: false, torche: false, super: false };
  let lampe = 0, reflexe = 0, vise = null, retard = 0, focus = null, sceau = null, trait = -1, jalon = 0, pause = 0, souvenir = null;
  /** @type {[number, number][]} */ const vu = [];
  return (/** @type {any} */ p) => {
    doigt.torche = false; doigt.super = false;
    if (p.etat !== 'jeu') { doigt.bas = tetu && p.etat !== 'passage'; return doigt; }
    if (p.aspire) { doigt.bas = tetu; return doigt; }
    if (p.peche) {
      vu.push([p.peche.zx, p.peche.zy]);
      const [cx, cy] = vu[Math.max(0, vu.length - 1 - Math.round((enfant ? 0.45 : 0.2) / DT))];
      const dx = cx - doigt.x, dy = cy - doigt.y, d = Math.hypot(dx, dy), v = (enfant ? 180 : 320) * DT;
      if (d > v) { doigt.x += dx / d * v; doigt.y += dy / d * v; } else { doigt.x = cx; doigt.y = cy; }
      doigt.bas = true; return doigt;
    }
    vu.length = 0;
    // un sceau : pour chaque trait, lever le doigt, le poser au point qui brille, puis suivre le dessin (l'enfant
    // avec un temps de retard, plus lentement, en tremblant)
    if (p.sceau) {
      const S = p.sceau;
      if (sceau !== S || trait !== S.i) { pause = sceau === S ? (enfant ? h.entre(0.2, 0.4) : 0.08) : enfant ? h.entre(0.35, 0.7) : 0.12; sceau = S; trait = S.i; jalon = 0; doigt.bas = false; }
      pause -= DT;
      const [jx, jy] = S.jalons[Math.min(jalon, S.jalons.length - 1)], tr = enfant ? 4 : 0;
      if (pause > 0) { doigt.bas = false; doigt.x = jx; doigt.y = jy; }
      else {
        const dx = jx - doigt.x, dy = jy - doigt.y, d = Math.hypot(dx, dy), v = (enfant ? 110 : 240) * DT;
        if (d > v) { doigt.x += dx / d * v; doigt.y += dy / d * v; } else { doigt.x = jx + h.entre(-tr, tr); doigt.y = jy + h.entre(-tr, tr); jalon++; }
        doigt.bas = true;
      }
      doigt.fx = doigt.x; doigt.fy = doigt.y;
      return doigt;
    }
    sceau = null;
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

    let cible = null, lumiere = false;
    const pile = A.torche && !p.torche.vide;
    if (enfant) {
      const g = vivants.filter((e) => !e.garde && (!e.tir || e.k > 0.45)).sort((a, b) => (b.tir ? 3 : b.s) - (a.tir ? 3 : a.s))[0];
      reflexe -= DT;
      if (reflexe <= 0) { vise = g ? { x: g.x + h.entre(-4, 4), y: g.y + h.entre(-4, 4), e: g } : null; reflexe = h.entre(0.35, 0.65); }
      if (vise && vise.e && !vise.e.mort && vise.e.etat === 'vit') { vise.x += (vise.e.x - vise.x) * 0.05; vise.y += (vise.e.y - vise.y) * 0.05; }
      cible = vise;
      // rien à viser : il fouille le meuble qu'il a vu trembler (manies.js)
      if (!g) { const c = p.caches.find((q) => q.type && p.s.tremble[q.cachette] > 0) || (souvenir && p.caches.includes(souvenir) ? souvenir : null); souvenir = c; if (c) { const k = SALLES[p.salle].cachettes[c.cachette]; cible = { x: k.x, y: k.y }; } }
      // l'enfant éclaire ce qui se cache quand ça devient gros, et de temps en temps le boss protégé
      // (il garde alors la torche allumée un moment)
      lampe -= DT;
      if (pile) {
        const c = caches.filter((e) => e.s > 1.2).sort((a, b) => b.s - a.s)[0];
        if (boss && protege(p, boss) && lampe <= -1 && h.suivant() < 0.02) lampe = 1.4;
        if (c) { cible = { x: c.x, y: c.y }; lumiere = true; }
        else if (boss && protege(p, boss) && lampe > 0) { cible = { x: boss.x, y: boss.y }; lumiere = true; }
      }
    } else {
      // le plus pressé d'abord : un fantôme qui va frapper passe avant un tir encore loin
      // il garde sa cible tant qu'une autre n'est pas nettement plus pressée (sinon, entre deux fantômes
      // de même taille, il changeait à chaque image et n'en tenait aucun)
      const tenir = (liste) => { const best = liste[0]; if (!best) return null; if (focus && liste.includes(focus) && focus.s >= best.s - 0.3) return focus; focus = best; return best; };
      const presse = tenir(vivants.filter((e) => !e.tir && !e.garde && !(e.cache && e.revele <= 0) && e.s > 1.9).sort((x, y) => y.s - x.s));
      if (presse && !(tirs.length && tirs[0].k > 0.7)) cible = { x: presse.x, y: presse.y + 2 };
      if (!cible && tirs.length && tirs[0].k > 0.25) cible = { x: tirs[0].x, y: tirs[0].y };
      // un fantôme à casserole sous une casserole pendue : la faire tomber l'assomme d'un coup (manies.js)
      if (!cible) for (const o of Object.values(p.s.objets)) if (!o.fait && o.effet === 'pend' && vivants.some((e) => e.equipe === 'casserole' && Math.abs(e.x - o.cx) < 12 && e.s > 0.9)) { cible = { x: o.x + o.w / 2, y: o.y + o.h / 2 }; break; }
      // ce qui se cache, on l'éclaire avant qu'il arrive
      if (!cible && pile) {
        const c = caches.filter((e) => e.s > 0.8).sort((a, b) => b.s - a.s)[0];
        if (c) { cible = { x: c.x, y: c.y }; lumiere = true; }
        else if (boss && protege(p, boss)) { cible = { x: boss.x, y: boss.y }; lumiere = true; }
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
      // les meubles qui cachent quelqu'un (ou des pièces), quand il n'y a plus rien d'autre
      if (!cible && p.caches.length && !vivants.some((e) => !e.tir && !e.garde && !e.occupe && e.s > 1.2)) { const k = SALLES[p.salle].cachettes[p.caches[0].cachette]; cible = { x: k.x, y: k.y }; }
      if (!cible && p.ts > 8) for (const o of Object.values(p.s.objets)) if (!o.fait && o.effet === 'pieces') { cible = { x: o.x + o.w / 2, y: o.y + o.h / 2 }; break; }
    }
    if (!cible) { doigt.bas = tetu; return doigt; }
    // un fantôme à lunettes ne s'aspire qu'étourdi : on l'éclaire d'abord
    const malin = pile && !lumiere && vivants.find((e) => e.malin && !(e.etourdi > 0) && dedans(boite(e), cible.x, cible.y, 2));
    if (malin) lumiere = true;
    const dx = cible.x - doigt.x, dy = cible.y - doigt.y, d = Math.hypot(dx, dy), v = (enfant ? 230 : 420) * DT;
    if (d > v) { doigt.x += dx / d * v; doigt.y += dy / d * v; } else { doigt.x = cible.x; doigt.y = cible.y; }
    if (lumiere) { doigt.bas = false; doigt.torche = d < 16; return doigt; }
    // jamais le rayon sur Lumi (l'enfant, lui, ne fait pas toujours attention)
    const surLumi = lumi && dedans(boite(lumi), doigt.x, doigt.y, 4);
    doigt.bas = tetu ? !(surLumi && h.suivant() < 0.97) : d < 14 && !(p.chauffe > 0.85 && !tirs.length) && !(surLumi && (!enfant || h.suivant() < 0.97));
    return doigt;
  };
}
