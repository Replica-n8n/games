// Ghost Train : ce que fait la recrue. On vise en pixels d'écran.
//   le RAYON tient ce qui est sous le viseur, chauffe, et capture le fantôme dont les
//     points de vie tombent à zéro ; viser Lumi coûte un cœur, viser le levier le
//     bascule, viser un secret du décor le ramasse ;
//   le FLASH (dès la Bibliothèque) étourdit autour du viseur, révèle le Drap et
//     l'Ombre, fait tomber les livres du Bibliothécaire, brise le bouclier de la Gouvernante ;
//   le PARFAIT (dès la Salle de bal) : une capture sur le temps de la musique remplit
//     davantage la SUPER-ATTAQUE, qui capture tout ce qui est à l'écran ;
//   le SLAM (dès le Grenier) : tirer le viseur à l'opposé du fantôme qui se débat.
import { RAYON, FLASH, RYTHME, SLAM } from './constantes.js';
import { dans } from './projection.js';
import { evt, son, moment } from './evenements.js';
import { coup } from './joueur.js';
import { basculer } from './rail.js';
import { estBoss, estTir } from './fantomes.js';
import { ESPECES } from '../contenu/especes.js';

/** Ce qui peut être visé maintenant. @param {any} p @param {any} e */
export const touchable = (p, e) => e.etat === 'vit' && !e.mort && !!e.boite
  && !(e.entree !== undefined && e.entree < 1.6)
  && !((e.type === 'drap' || e.type === 'ombre') && e.revele <= 0 && e.etourdi <= 0);

/** Ce qui est sous le viseur : le plus prioritaire, puis le plus proche. @param {any} p @param {number} x @param {number} y */
export function viser(p, x, y) {
  let mieux = null;
  for (const e of p.ents) {
    if (!touchable(p, e) || !dans(e.boite, x, y, p.options.marge)) continue;
    if (!mieux || e.prio < mieux.prio || (e.prio === mieux.prio && e.z < mieux.z)) mieux = e;
  }
  return mieux;
}

/** Sur le temps de la musique ? @param {any} p */
export const surLeTemps = (p) => p.phase < RYTHME.fenetre || p.phase > 1 - RYTHME.fenetre;

/** @param {any} p @param {any} e @param {boolean} [parSuper] */
function capturer(p, e, parSuper = false) {
  e.etat = 'cap'; e.ct = 0; e.cdur = estBoss(e) ? 1.8 : 0.7;
  e.capX = e.boite.cx; e.capY = e.boite.cy; e.capT = e.boite.w;
  p.prises++;
  const page = ESPECES[e.type].carnet;
  if (page) p.captures[page] = (p.captures[page] || 0) + 1;
  const A = p.mission.actions || {};
  const parfait = !!A.rythme && !parSuper && surLeTemps(p);
  if (parfait) { p.parfaits++; evt(p, { type: 'parfait', x: e.boite.cx, y: e.boite.cy }); son(p, 'parfait'); moment(p, 'parfait'); }
  if (A.super && !parSuper) {
    const avant = p.jauge;
    p.jauge = Math.min(1, p.jauge + (parfait ? RYTHME.parfait : RYTHME.normal));
    if (avant < 1 && p.jauge >= 1) { son(p, 'pret'); moment(p, 'superPret'); }
  }
  // un parfait paie double ; le vestiaire aussi (`gain`)
  const n = e.pieces * (p.gain || 1) * (parfait ? 2 : 1);
  p.pieces += n;
  evt(p, { type: 'pieces', n, x: e.boite.cx, y: e.boite.cy });
  son(p, 'capture'); moment(p, 'capture');
  if (e === p.boss) {
    p.tFin = 2.4;
    for (const l of p.ents) if (l !== e && l.etat === 'vit' && (l.type === 'leurre' || l.type === 'livre' || estTir(l))) {
      l.mort = true; evt(p, { type: 'pouf', x: l.boite?.cx, y: l.boite?.cy });
    }
    son(p, 'victoire');
  }
}

/** Le slam : le viseur tire à l'opposé du fantôme, la jauge monte ; pleine, un gros coup. */
function slammer(p, e, dt) {
  const v = p.visee, le = -(v.vx * e.traction.dx + v.vy * e.traction.dy);
  if (le > SLAM.vitesse) e.slam += dt * Math.min(le, 260) / 170;
  if (e.slam >= 1) {
    e.slam = 0; e.pv -= e.pv0 * SLAM.coup;
    p.pieces += 2;
    evt(p, { type: 'slam', x: e.boite.cx, y: e.boite.cy }); evt(p, { type: 'pieces', n: 2, x: e.boite.cx, y: e.boite.cy });
    son(p, 'slam'); moment(p, 'slam');
  }
}

/** Le rayon agit sur e pendant dt. @param {any} p @param {any} e @param {number} dt */
function frapper(p, e, dt) {
  const P = RAYON.puissance * p.options.puissance;
  if (estTir(e) || e.type === 'leurre' || e.type === 'livre') {
    e.pv -= P * dt;
    if (e.pv <= 0) {
      e.mort = true; evt(p, { type: 'pouf', x: e.boite.cx, y: e.boite.cy });
      son(p, e.type === 'leurre' ? 'rire' : 'pop');
      if (e.type === 'leurre') moment(p, 'leurre');
    }
    return;
  }
  switch (e.type) {
    case 'lumi':
      e.etat = 'fuite'; p.lumi.touche = true;
      coup(p, true); son(p, 'triste'); moment(p, 'lumiTouche');
      return;
    case 'levier':
      e.vise = true;
      if (e.verrouille) return;
      e.charge += dt;
      if (e.charge >= 0.35) { e.charge = 0; e.verrouille = true; basculer(p); }
      return;
    case 'secret':
      e.charge += dt;
      if (e.charge >= 0.5) {
        e.mort = true; p.secrets.push(e.id);
        evt(p, { type: 'secret', id: e.id, x: e.boite.cx, y: e.boite.cy });
        son(p, 'secret'); moment(p, 'secret');
      }
      return;
  }
  if (!e.lutte) return;
  // protégé : le rayon ricoche (livres du Bibliothécaire, bouclier de la Gouvernante)
  const livres = e.type === 'bibliothecaire' && p.ents.some((x) => x.type === 'livre' && !x.mort);
  if (livres || (e.type === 'gouvernante' && e.bouclier)) {
    p.ricoche = true;
    moment(p, e.type === 'gouvernante' ? 'bouclierTouche' : 'bibliProtege');
    return;
  }
  e.tenu = true;
  e.pv -= P * (e.etourdi > 0 ? 1 : RAYON.faible) * dt;
  if ((p.mission.actions || {}).slam) slammer(p, e, dt);
  if (e.pv <= 0) capturer(p, e);
}

/** Le flash, autour du viseur. @param {any} p @param {number} x @param {number} y */
export function flasher(p, x, y) {
  if (!(p.mission.actions || {}).flash || p.flashCD > 0 || p.etat !== 'jeu') return;
  p.flashCD = FLASH.recharge;
  evt(p, { type: 'flash', x, y }); son(p, 'flash'); moment(p, 'flash');
  for (const e of p.ents) {
    if (e.etat !== 'vit' || !e.boite || estTir(e)) continue;
    const b = e.boite, d = Math.hypot(b.cx - x, b.cy - y), portee = FLASH.portee + Math.max(b.w, b.h) * 0.35;
    if (e.type === 'ombre' && d < portee * 1.8) { e.revele = FLASH.revele; if (d < portee) e.etourdi = FLASH.etourdi; continue; }
    if (d > portee) continue;
    if (e.type === 'livre') { e.mort = true; evt(p, { type: 'pouf', x: b.cx, y: b.cy }); son(p, 'pop'); moment(p, 'livreTombe'); continue; }
    if (e.type === 'drap') { e.revele = FLASH.revele; e.etourdi = FLASH.etourdi; continue; }
    if (e.type === 'gouvernante') {
      if (e.entree < 1.6) continue;
      if (e.bouclier) { e.bouclier = false; e.tBouclier = 4.5; evt(p, { type: 'brise', x: b.cx, y: b.cy }); son(p, 'brise'); moment(p, 'bouclierBrise'); }
      e.etourdi = 1.8; continue;
    }
    if (e.lutte && !estBoss(e)) e.etourdi = FLASH.etourdi;
  }
}

/** La super-attaque : une onde qui capture tout ce qui est à l'écran et frappe les boss. @param {any} p */
export function superAttaque(p) {
  if (!(p.mission.actions || {}).super || p.jauge < 1 || p.superT > 0 || p.etat !== 'jeu') return;
  p.jauge = 0; p.superT = 0.001;
  evt(p, { type: 'super' }); son(p, 'super'); moment(p, 'super');
}
/** @param {any} p @param {number} dt */
function onde(p, dt) {
  if (p.superT <= 0) return;
  const avant = p.superT;
  p.superT += dt;
  if (avant < 0.35 && p.superT >= 0.35) {
    for (const e of p.ents) {
      if (e.etat !== 'vit' || !e.boite || e.type === 'lumi') continue;
      if (estTir(e) || e.type === 'livre') { e.mort = true; evt(p, { type: 'pouf', x: e.boite.cx, y: e.boite.cy }); continue; }
      if (!e.hostile || (e.entree !== undefined && e.entree < 1.6)) continue;
      if (estBoss(e)) { e.pv -= RYTHME.degats; if (e.type === 'gouvernante') e.bouclier = false; if (e.pv <= 0) capturer(p, e, true); continue; }
      capturer(p, e, true);
    }
  }
  if (p.superT > 1.6) p.superT = 0;
}

/**
 * @param {any} p
 * @param {{x: number, y: number, tire: boolean, flash?: boolean, super?: boolean}} entree
 * @param {number} dt
 */
export function pasRayon(p, entree, dt) {
  // la vitesse du viseur, pour le slam
  const v = p.visee;
  v.vx += (((entree.x - v.x) / dt) - v.vx) * 0.5; v.vy += (((entree.y - v.y) / dt) - v.vy) * 0.5;
  v.x = entree.x; v.y = entree.y;
  p.flashCD = Math.max(0, p.flashCD - dt);
  if (entree.flash) flasher(p, entree.x, entree.y);
  if (entree.super) superAttaque(p);
  onde(p, dt);
  p.ricoche = false;
  // ce qui est sous le viseur, même sans tirer : l'écran colore le viseur (Lumi en rose)
  p.sous = viser(p, entree.x, entree.y);
  for (const e of p.ents) e.tenu = false;
  if (p.surchauffe > 0) {
    p.surchauffe -= dt;
    if (p.surchauffe <= 0) { p.surchauffe = 0; p.chauffe = RAYON.reprise; moment(p, 'refroidi'); }
  }
  p.tire = entree.tire && p.surchauffe <= 0 && p.etat === 'jeu';
  p.cibleRayon = null;
  if (!p.tire) {
    p.verrou = null;
    if (p.surchauffe <= 0) p.chauffe = Math.max(0, p.chauffe - RAYON.refroidit * dt);
    if (p.chauffe < 0.5) moment(p, 'frais');
    return;
  }
  p.chauffe += RAYON.chauffe * p.options.chauffe * dt;
  if (p.chauffe >= RAYON.alerte) moment(p, 'chaud');
  if (p.chauffe >= 1) {
    p.chauffe = 1; p.surchauffe = RAYON.surchauffe; p.verrou = null; p.tire = false;
    son(p, 'surchauffe'); moment(p, 'surchauffe');
    return;
  }
  // Le verrou garde le fantôme tenu même si le viseur glisse un peu : il se débat.
  // Mais ce qui passe DEVANT lui sous le viseur gagne : sinon une assiette lancée
  // par le Majordome ne se visait plus tant que le rayon le tenait.
  const ve = p.verrou, direct = viser(p, entree.x, entree.y);
  const garde = ve && touchable(p, ve) && dans(ve.boite, entree.x, entree.y, p.options.verrou) && !(direct && direct !== ve && direct.z < ve.z);
  const c = garde ? ve : direct;
  p.verrou = c && c.lutte ? c : null;
  p.cibleRayon = c;
  if (c) frapper(p, c, dt);
}
