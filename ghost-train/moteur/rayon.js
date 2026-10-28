// Le rayon : on le garde appuyé sur ce qu'on vise. Il aspire le fantôme sous le
// viseur (le plus proche de nous), chauffe, et surchauffe s'il ne lâche jamais.
// Sans fantôme dessous, il charge l'objet du décor visé (lustre, casserole, vase…).
// Les gestes des étages : le FLASH (bibliothèque), le RYTHME et la SUPER (salle de
// bal), le SLAM (combles).
import { DT, RAYON, FLASH, RYTHME, SLAM } from './constantes.js';
import { ESPECES } from '../contenu/especes.js';
import { boite, evt } from './fantomes.js';

const dedans = (b, x, y, m = 0) => x >= b.x - m && x <= b.x + b.w + m && y >= b.y - m && y <= b.y + b.h + m;
/** Ce qu'on peut viser : vivant, pas caché (une Ombre que le flash n'a pas révélée passe sous le rayon). */
const visable = (e) => !e.mort && (e.etat === 'vit' || e.type === 'chat' || e.type === 'lumi') && !(e.cache && e.revele <= 0) && !e.fuite;
/** Un boss protégé : ses livres tournent encore, ou son bouclier est levé. @param {any} p @param {any} e */
export const protege = (p, e) => (e.type === 'bibliothecaire' && p.ents.some((x) => x.garde && !x.mort && x.etat === 'vit')) || (e.type === 'gouvernante' && e.bouclier);
/** Sur le temps : le rythme dit PARFAIT à moins de `fenetre` d'un temps. @param {any} p */
export const surLeTemps = (p) => p.phase < RYTHME.fenetre || p.phase > 1 - RYTHME.fenetre;

/** @param {any} p @param {{x: number, y: number, bas: boolean, flash?: boolean, super?: boolean}} entree */
export function rayon(p, entree) {
  const A = p.mission.actions || {};
  // la vitesse du viseur, pour le slam
  const v = p.visee;
  v.vx = (entree.x - v.x) / DT; v.vy = (entree.y - v.y) / DT;
  v.x = entree.x; v.y = entree.y;
  p.flashCD = Math.max(0, p.flashCD - DT);
  if (entree.flash && A.flash) flasher(p, v.x, v.y);
  if (entree.super && A.super) superAttaque(p);
  onde(p);
  p.ricoche = false;
  const m = p.options.marge || 0, { x, y } = v;
  // un tir sous le viseur passe toujours en premier : il part du corps du boss, et sinon le boss le cachait
  const vivants = p.ents.filter(visable).sort((a, b) => (+b.tir - +a.tir) || (b.s - a.s));
  // ce qui est sous le viseur, même sans tirer : le viseur devient rose sur Lumi
  p.sous = vivants.find((e) => dedans(boite(e), x, y, m + (e.tir ? 6 : 0))) || null;
  const veut = !!entree.bas;
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
  // le fantôme tenu reste tenu tant que le viseur ne le quitte pas (un fantôme qui lutte se tient
  // de plus loin : on tire du doigt à l'opposé), sauf si quelque chose passe devant lui
  let cible = p.sous;
  const t = p.tenu;
  if (t && visable(t) && t.etat === 'vit' && dedans(boite(t), x, y, m + (t.lutte ? SLAM.prise : 6)) && (!cible || (!cible.tir && cible.s <= t.s))) cible = t;
  if (!cible) {
    p.tenu = null;
    for (const o of Object.values(p.s.objets)) {
      if (o.fait) continue;
      if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) {
        p.vise = o; o.charge += DT * 2;
        if (o.charge >= o.besoin) declencher(p, o);
        break;
      }
    }
    return;
  }
  p.tenu = cible;
  if (cible.type === 'chat') {
    if (!cible.feule) { cible.feule = true; evt(p, { type: 'texte', s: 'PFFF !', x: cible.x, y: cible.y - 16, col: '#ffffff' }); evt(p, { type: 'son', nom: 'triste' }); }
    return;
  }
  if (cible.type === 'lumi') {
    // on ne capture pas Lumi : il pleure et s'en va, et l'étage le retient
    cible.fuite = true; p.lumi.touche = (p.lumi.touche || 0) + 1; p.tenu = null;
    evt(p, { type: 'texte', s: 'PAS LUMI !', x: cible.x, y: cible.y - 20, col: '#ff8aa0' }); evt(p, { type: 'son', nom: 'triste' });
    return;
  }
  if (cible.boss && protege(p, cible)) { p.ricoche = true; return; }
  // un petit fantôme qui lutte s'aspire à demi-force (le slam l'achève) ; un boss a déjà ses protections
  const faible = cible.lutte && !cible.boss && cible.etourdi <= 0 ? SLAM.faible : 1;
  cible.pv -= RAYON.puissance * faible * DT;
  if (cible.lutte) slammer(p, cible);
  if (cible.pv <= 0) capturer(p, cible, 1);
}

/** Le slam : un coup sec du doigt à l'opposé de la traction ; la jauge pleine, un gros coup. @param {any} p @param {any} e */
function slammer(p, e) {
  const v = p.visee, le = -(v.vx * e.traction.dx + v.vy * e.traction.dy);
  if (le > SLAM.vitesse) e.slam += le * DT / SLAM.trajet;
  if (e.slam >= 1) {
    e.slam = 0; e.pv -= e.pv0 * (e.boss ? SLAM.coupBoss : SLAM.coup); p.pieces += 2; p.slams++;
    evt(p, { type: 'texte', s: 'SLAM !', x: e.x, y: e.y - 20, col: '#ffd23a' }); evt(p, { type: 'pieces', x: e.x, y: e.y, n: 2 });
    evt(p, { type: 'eclats', x: e.x, y: e.y, n: 14, col: '#ffd23a' }); evt(p, { type: 'secousse', f: 0.2 }); evt(p, { type: 'son', nom: 'slam' });
  }
}

/** Le fantôme est aspiré : il rapporte ses pièces (x mult par le décor). @param {any} p @param {any} e */
export function capturer(p, e, mult, parSuper = false) {
  if (e.etat === 'cap' || e.mort) return;
  e.etat = 'cap'; e.tc = 0; if (p.tenu === e) p.tenu = null;
  const A = p.mission.actions || {};
  const parfait = !!A.rythme && !parSuper && !e.tir && !e.garde && surLeTemps(p);
  if (A.super && !parSuper && !e.tir && !e.garde) {
    const avant = p.jauge;
    p.jauge = Math.min(1, p.jauge + (parfait ? RYTHME.parfait : RYTHME.normal));
    if (avant < 1 && p.jauge >= 1) { evt(p, { type: 'son', nom: 'pret' }); evt(p, { type: 'texte', s: 'SUPER PRÊTE !', x: 160, y: 150, col: '#ff8ad0' }); }
  }
  if (parfait) { p.parfaits++; evt(p, { type: 'texte', s: 'PARFAIT !', x: e.x, y: e.y - 24, col: '#ff8ad0' }); evt(p, { type: 'son', nom: 'parfait' }); }
  const n = ESPECES[e.type].pieces * mult * (parfait ? 2 : 1);
  p.pieces += n;
  if (e.hostile && !e.tir && !e.boss) { p.captures++; p.parEspece[e.type] = (p.parEspece[e.type] || 0) + 1; }
  evt(p, { type: 'pieces', x: e.x, y: e.y, n });
  evt(p, { type: 'son', nom: e.tir || e.garde ? 'pop' : 'capture' });
  // le boss capturé emporte tout ce qui reste dans la salle
  if (e.boss) for (const f of p.ents) if (f !== e && (f.hostile || f.garde) && f.type !== 'lumi') capturer(p, f, 1, true);
}

/** Le flash, autour du viseur. @param {any} p @param {number} x @param {number} y */
export function flasher(p, x, y) {
  if (p.flashCD > 0 || p.etat !== 'jeu') return;
  p.flashCD = FLASH.recharge; p.flashs++;
  evt(p, { type: 'flash', x, y }); evt(p, { type: 'son', nom: 'flash' });
  for (const e of p.ents) {
    if (e.etat !== 'vit' || e.mort || e.tir) continue;
    const b = boite(e), d = Math.hypot(e.x - x, e.y - y), portee = FLASH.portee + Math.max(b.w, b.h) * 0.35;
    if (e.cache && d < portee * 1.8) { e.revele = FLASH.revele; if (d < portee) e.etourdi = FLASH.etourdi; continue; }
    if (d > portee) continue;
    if (e.garde) { capturer(p, e, 1, true); continue; }
    if (e.type === 'gouvernante') {
      if (e.bouclier) { e.bouclier = false; e.tBouclier = 4.5; evt(p, { type: 'texte', s: 'BOUCLIER BRISÉ !', x: e.x, y: e.y - 30, col: '#3fe8ff' }); evt(p, { type: 'son', nom: 'brise' }); }
      e.etourdi = 1.8; continue;
    }
    if (e.hostile && !e.boss) e.etourdi = FLASH.etourdi;
  }
}

/** La super-attaque : une onde qui capture tout ce qui est à l'écran et frappe les boss. @param {any} p */
export function superAttaque(p) {
  if (p.jauge < 1 || p.superT > 0 || p.etat !== 'jeu') return;
  p.jauge = 0; p.superT = 0.001; p.supers++;
  evt(p, { type: 'super' }); evt(p, { type: 'son', nom: 'super' }); evt(p, { type: 'texte', s: 'SUPER !', x: 160, y: 70, col: '#ff8ad0', sc: 2 });
}
/** @param {any} p */
function onde(p) {
  if (p.superT <= 0) return;
  const avant = p.superT;
  p.superT += DT;
  if (avant < 0.35 && p.superT >= 0.35) {
    for (const e of p.ents) {
      if (e.etat !== 'vit' || e.mort || e.type === 'lumi' || e.type === 'chat') continue;
      if (e.tir || e.garde) { capturer(p, e, 1, true); continue; }
      if (e.boss) { e.pv -= RYTHME.degats; if (e.type === 'gouvernante') e.bouclier = false; if (e.pv <= 0) capturer(p, e, 1, true); continue; }
      capturer(p, e, 1, true);
    }
  }
  if (p.superT > 1.6) p.superT = 0;
}

/** L'objet visé assez longtemps fait son effet. @param {any} p @param {any} o */
function declencher(p, o) {
  o.fait = true;
  if (o.effet === 'tombe' || o.effet === 'pend') { o.chute = 0.001; evt(p, { type: 'son', nom: 'clac' }); return; }
  if (o.effet === 'pieces') {
    p.pieces += o.n;
    evt(p, { type: 'son', nom: 'brise' }); evt(p, { type: 'pieces', x: o.x + o.w / 2, y: o.y + o.h / 2, n: o.n, eclats: o.eclats || '#8ab8ff' });
    return;
  }
  if (o.effet === 'bouchon') {
    // le bouchon file vers le fantôme le plus proche de nous
    const cible = p.ents.filter((e) => e.hostile && !e.tir && !e.boss && e.etat === 'vit' && visable(e)).sort((a, b) => b.s - a.s)[0];
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
    const touche = (e) => e.hostile && !e.tir && !e.boss && e.etat === 'vit' && !e.mort;
    if (o.effet === 'tombe') {
      if (hauteurChute(o) > o.sol) {
        o.fini = true; evt(p, { type: 'secousse', f: 0.4 }); evt(p, { type: 'son', nom: 'coup' });
        let n = 0;
        for (const e of p.ents) if (touche(e) && Math.abs(e.x - o.cx) < o.zone) { capturer(p, e, 2); n++; }
        evt(p, { type: 'texte', s: n ? `BOUM ! ${n} D'UN COUP` : 'BOUM !', x: o.cx, y: 70, col: '#ff8ad0', sc: n ? 1 : 2 });
        evt(p, { type: 'eclats', x: o.cx, y: o.sol, n: 20, col: o.eclats || '#ffe890' });
      }
    } else {
      const y = hauteurChute(o) + 6;
      const sous = p.ents.find((e) => touche(e) && Math.abs(e.x - o.cx) < boite(e).w / 2 + 6 && y >= boite(e).y);
      if (sous) { o.fini = true; capturer(p, sous, 2); evt(p, { type: 'texte', s: 'CLANG !', x: o.cx, y: y - 12, col: '#ffb07a' }); evt(p, { type: 'son', nom: 'clac' }); }
      else if (y > 150) { o.fini = true; evt(p, { type: 'texte', s: 'CLANG', x: o.cx, y: 140, col: '#c8b8e0' }); evt(p, { type: 'son', nom: 'clac' }); }
    }
  }
}

/** Où en est la chute d'un objet (le haut de son dessin). @param {any} o */
export function hauteurChute(o) {
  const c = o.chute || 0;
  return (o.haut !== undefined ? o.haut : o.effet === 'tombe' ? 10 : 22) + c * c * 150;
}
