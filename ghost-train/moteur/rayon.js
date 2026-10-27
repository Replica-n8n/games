// Le rayon : on le garde appuyé sur ce qu'on vise. Il aspire le fantôme sous le
// viseur (le plus proche de nous), chauffe, et surchauffe s'il ne lâche jamais.
// Sans fantôme dessous, il charge l'objet du décor visé (lustre, casserole, vase…).
import { DT, RAYON } from './constantes.js';
import { ESPECES } from '../contenu/especes.js';
import { boite, evt } from './fantomes.js';

const dedans = (b, x, y, m = 0) => x >= b.x - m && x <= b.x + b.w + m && y >= b.y - m && y <= b.y + b.h + m;

/** @param {any} p @param {{x: number, y: number, bas: boolean}} entree */
export function rayon(p, entree) {
  const veut = !!entree.bas;
  p.visee.x = entree.x; p.visee.y = entree.y;
  if (veut && !p.surchauffe) {
    p.chauffe += RAYON.chauffe * DT;
    if (p.chauffe >= 1) {
      p.chauffe = 1; p.surchauffe = true; p.tenu = null;
      evt(p, { type: 'son', nom: 'surchauffe' }); evt(p, { type: 'texte', s: 'SURCHAUFFE !', x: 160, y: 150, col: '#ff5a3a' });
    }
  } else {
    p.chauffe = Math.max(0, p.chauffe - RAYON.refroidit * DT);
    if (p.surchauffe && p.chauffe <= RAYON.reprise) p.surchauffe = false;
  }
  p.tire = veut && !p.surchauffe;
  for (const o of Object.values(p.s.objets)) if (o !== p.vise) o.charge = Math.max(0, o.charge - DT);
  p.vise = null;
  if (!p.tire) { p.tenu = null; return; }
  const m = p.options.marge || 0, { x, y } = p.visee;
  // le fantôme tenu reste tenu tant que le viseur ne le quitte pas, sauf si quelque chose passe devant lui
  const vivants = p.ents.filter((e) => (e.etat === 'vit' || e.type === 'chat') && !e.mort).sort((a, b) => b.s - a.s);
  let cible = vivants.find((e) => dedans(boite(e), x, y, m));
  const t = p.tenu;
  if (t && !t.mort && t.etat === 'vit' && dedans(boite(t), x, y, m + 6) && (!cible || cible.s <= t.s)) cible = t;
  if (cible) {
    p.tenu = cible;
    if (cible.type === 'chat') {
      if (!cible.feule) { cible.feule = true; evt(p, { type: 'texte', s: 'PFFF !', x: cible.x, y: cible.y - 16, col: '#ffffff' }); evt(p, { type: 'son', nom: 'triste' }); }
      return;
    }
    cible.pv -= RAYON.puissance * DT;
    if (cible.pv <= 0) capturer(p, cible, 1);
    return;
  }
  p.tenu = null;
  for (const o of Object.values(p.s.objets)) {
    if (o.fait) continue;
    if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) {
      p.vise = o; o.charge += DT * 2;
      if (o.charge >= o.besoin) declencher(p, o);
      break;
    }
  }
}

/** Le fantôme est aspiré : il rapporte ses pièces (x mult par le décor). @param {any} p @param {any} e */
export function capturer(p, e, mult) {
  if (e.etat === 'cap' || e.mort) return;
  e.etat = 'cap'; e.tc = 0; if (p.tenu === e) p.tenu = null;
  const n = ESPECES[e.type].pieces * mult;
  p.pieces += n;
  if (!e.tir && !e.boss) { p.captures++; p.parEspece[e.type] = (p.parEspece[e.type] || 0) + 1; }
  evt(p, { type: 'pieces', x: e.x, y: e.y, n });
  evt(p, { type: 'son', nom: e.tir ? 'assiette' : 'capture' });
  // le boss capturé emporte tout ce qui reste dans la salle
  if (e.boss) for (const f of p.ents) if (f !== e && f.hostile) capturer(p, f, 1);
}

/** L'objet visé assez longtemps fait son effet. @param {any} p @param {any} o */
function declencher(p, o) {
  o.fait = true;
  if (o.effet === 'tombe' || o.effet === 'pend') { o.chute = 0.001; evt(p, { type: 'son', nom: 'clac' }); return; }
  if (o.effet === 'pieces') {
    p.pieces += o.n;
    evt(p, { type: 'son', nom: 'brise' }); evt(p, { type: 'pieces', x: o.x + o.w / 2, y: o.y + o.h / 2, n: o.n, eclats: '#8ab8ff' });
    return;
  }
  if (o.effet === 'bouchon') {
    // le bouchon file vers le fantôme le plus proche de nous
    const cible = p.ents.filter((e) => e.hostile && !e.tir && !e.boss && e.etat === 'vit').sort((a, b) => b.s - a.s)[0];
    o.vol = { x0: o.x + o.w / 2, y0: o.y, k: 0, cible: cible || null };
    evt(p, { type: 'son', nom: 'pop' }); evt(p, { type: 'texte', s: 'POP !', x: o.x + o.w / 2, y: o.y - 6, col: '#fff27a' });
  }
}

/** Ce qui tombe ou ce qui vole : le lustre, les casseroles, le bouchon. @param {any} p */
export function objets(p) {
  for (const o of Object.values(p.s.objets)) {
    if (o.fini) continue;
    if (o.vol) {
      o.vol.k += DT / 0.35;
      if (o.vol.k >= 1) {
        o.fini = true;
        const c = o.vol.cible;
        if (c && !c.mort && c.etat === 'vit') { capturer(p, c, 2); evt(p, { type: 'texte', s: 'BONK !', x: c.x, y: c.y - 16, col: '#ffb07a' }); }
        else { p.pieces += 2; evt(p, { type: 'pieces', x: o.vol.x0, y: o.vol.y0 - 30, n: 2 }); }
      }
      continue;
    }
    if (!o.chute) continue;
    o.chute += DT * 1.7;
    if (o.effet === 'tombe') {
      if (hauteurChute(o) > o.sol) {
        o.fini = true; evt(p, { type: 'secousse', f: 0.4 }); evt(p, { type: 'son', nom: 'coup' });
        let n = 0;
        for (const e of p.ents) if (e.hostile && !e.tir && !e.boss && e.etat === 'vit' && Math.abs(e.x - o.cx) < o.zone) { capturer(p, e, 2); n++; }
        evt(p, { type: 'texte', s: n ? `BOUM ! ${n} D'UN COUP` : 'BOUM !', x: o.cx, y: 70, col: '#ff8ad0', sc: n ? 1 : 2 });
        evt(p, { type: 'eclats', x: o.cx, y: o.sol, n: 20, col: '#ffe890' });
      }
    } else {
      const y = hauteurChute(o) + 6;
      const sous = p.ents.find((e) => e.hostile && !e.tir && !e.boss && e.etat === 'vit' && Math.abs(e.x - o.cx) < boite(e).w / 2 + 6 && y >= boite(e).y);
      if (sous) { o.fini = true; capturer(p, sous, 2); evt(p, { type: 'texte', s: 'CLANG !', x: o.cx, y: y - 12, col: '#ffb07a' }); evt(p, { type: 'son', nom: 'clac' }); }
      else if (y > 150) { o.fini = true; evt(p, { type: 'texte', s: 'CLANG', x: o.cx, y: 140, col: '#c8b8e0' }); evt(p, { type: 'son', nom: 'clac' }); }
    }
  }
}

/** Où en est la chute d'un objet (le haut de son dessin). @param {any} o */
export function hauteurChute(o) {
  const c = o.chute || 0;
  return o.effet === 'tombe' ? 10 + c * c * 150 : 22 + c * c * 150;
}
