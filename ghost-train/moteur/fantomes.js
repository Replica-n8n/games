// Ghost Train : naissance et comportement de tout ce qui vit dans le couloir
// (fantômes, assiettes, Lumi, panneaux d'aiguillage, secrets du décor).
import { COEURS, AIGUILLE, Y_LEVIER } from './constantes.js';
import { ESPECES } from '../contenu/especes.js';
import { evt, son, moment } from './evenements.js';
import { coup, soigner } from './joueur.js';

const lerp = (a, b, k) => a + (b - a) * k;

/** Ce qui empêche le wagon de repartir. @param {any} e */
export const bloque = (e) => e.bloque && e.etat !== 'cap' && !e.mort;

/**
 * @param {any} p @param {string} type @param {number} x
 * @param {any} [o] options propres à l'espèce (secret, côté du panneau…)
 */
export function naitre(p, type, x, o = {}) {
  const E = ESPECES[type];
  const e = {
    type, x, bx: x, y: 0, z: p.camZ + 13, t: 0, ph: p.h.entre(0, 6), etat: 'vit',
    pv: E.pv ?? 1, pv0: E.pv ?? 1, taille: E.taille, alpha: 1, pieces: E.pieces || 0,
    bloque: !!E.bloque, lutte: !!E.lutte, hostile: !!E.hostile, prio: E.prio || 0,
    ox: 0, oy: 0, tenu: false, boite: null, mort: false,
    // lutte : le fantôme tire dans une direction, et la change de temps en temps
    traction: { dx: 1, dy: 0, t: 0 },
  };
  switch (type) {
    case 'goule': e.vit = p.h.entre(...(p.mission.vitesseGoule || [1.4, 1.9])); e.ondule = p.h.entre(1.4, 2.4); break;
    case 'gouleVol': e.dir = x < 0 ? 1 : -1; e.x = -e.dir * 3.4; e.dist = p.h.entre(4.5, 6.5); e.z = p.camZ + e.dist; break;
    case 'lumi':
      e.dir = x < 0 ? 1 : -1; e.x = -e.dir * 2.7; e.z = p.camZ + 5; p.lumi.vue = true;
      son(p, 'lumi'); moment(p, 'lumi'); break;
    case 'levier': e.cote = o.cote; e.z = p.camZ + AIGUILLE.levier; e.y = Y_LEVIER; e.charge = 0; e.vise = false; e.verrouille = false; break;
    case 'secret':
      e.id = o.id; e.forme = o.forme; e.x = o.x; e.y = o.y; e.z = p.camZ + o.dz; e.charge = 0; moment(p, 'indice'); break;
    case 'majordome':
      e.z = p.camZ + 6.5; e.entree = 0; e.alpha = 0; e.tAssiette = 3; e.phase = 1; e.y = 1.2;
      e.places = null; e.tPlaces = 0; break;
    case 'leurre': Object.assign(e, o); break;
  }
  if (e.hostile) p.total++;
  p.ents.push(e);
  if (type === 'goule' || type === 'gouleVol') moment(p, 'goule');
  return e;
}

/** Le fantôme tenu par le rayon se débat. @param {any} p @param {any} e @param {number} dt */
function lutter(p, e, dt) {
  e.traction.t -= dt;
  if (e.traction.t <= 0) {
    const a = p.h.entre(0, Math.PI * 2);
    e.traction.dx = Math.cos(a); e.traction.dy = Math.sin(a) * 0.7; e.traction.t = p.h.entre(0.7, 1.2);
  }
  const k = 0.7;
  e.ox = Math.max(-1.2, Math.min(1.2, e.ox + e.traction.dx * k * dt));
  e.oy = Math.max(-0.5, Math.min(0.5, e.oy + e.traction.dy * k * 0.6 * dt));
}

/** Arrivé contre le wagon, le fantôme frappe puis disparaît. @param {any} p @param {any} e @param {number} dt */
function attaquer(p, e, dt) {
  e.at = (e.at || 0) + dt;
  e.z -= 3 * dt; e.x *= 0.92; e.y = lerp(e.y, 0, 0.1);
  if (e.at > 0.32 && !e.frappe) {
    e.frappe = true;
    // la goule s'écrase sur la vitre : l'écran en garde la bave
    evt(p, { type: 'bave', x: e.boite ? e.boite.cx : 160, y: e.boite ? e.boite.cy : 80 });
    coup(p);
  }
  if (e.at > 0.48) e.mort = true;
}

/** @param {any} p @param {any} src */
function lancerAssiette(p, src) {
  const a = naitre(p, 'assiette', src.x + src.ox);
  a.y = src.y + src.oy; a.z = src.z - 0.2;
  a.tx = p.h.entre(-0.45, 0.45); a.ty = p.h.entre(-0.15, 0.3); a.vit = p.h.entre(3.0, 3.6);
  son(p, 'assiette');
}

const PLACES = [-1.3, 0, 1.3];
/** Le vrai et ses deux leurres changent de place. @param {any} p @param {any} boss */
function melanger(p, boss) {
  const ordre = [0, 1, 2];
  for (let i = 2; i > 0; i--) { const j = p.h.entier(i + 1); [ordre[i], ordre[j]] = [ordre[j], ordre[i]]; }
  boss.cible = PLACES[ordre[0]];
  p.ents.filter((x) => x.type === 'leurre' && !x.mort).forEach((l, k) => { l.cible = PLACES[ordre[k + 1]]; });
  son(p, 'pouf');
}

/** @param {any} p @param {any} e @param {number} dt */
function majordome(p, e, dt) {
  e.entree += dt; e.alpha = Math.min(1, e.entree / 1.5);
  e.z = p.camZ + 6.5 + Math.sin(e.t * 0.5) * 0.4 + (e.tenu ? 0.3 : 0);
  if (e.phase === 1) e.x = Math.sin(e.t * 0.6) * 1.2;
  else e.x += (e.cible - e.x) * Math.min(1, dt * 3);
  e.y = lerp(1.2, -0.45 + Math.sin(e.t * 1.3) * 0.15, Math.min(1, e.entree / 1.5));
  if (e.entree < 1.6) return;
  e.tAssiette -= dt;
  if (e.tAssiette <= 0) { lancerAssiette(p, e); e.tAssiette = e.phase === 1 ? 2.6 : 1.9; }
  if (e.phase === 1 && e.pv <= e.pv0 / 2) {
    e.phase = 2; e.tPlaces = 4;
    for (let k = 0; k < 2; k++) naitre(p, 'leurre', e.x, { z: e.z, y: e.y, alpha: 1 });
    melanger(p, e);
    moment(p, 'bossMoitie');
  }
  if (e.phase === 2) { e.tPlaces -= dt; if (e.tPlaces <= 0) { e.tPlaces = 4; melanger(p, e); } }
}

/** @param {any} p @param {any} e @param {number} dt */
export function pasEntite(p, e, dt) {
  e.t += dt;
  if (e.etat === 'cap') {
    e.ct += dt;
    if (e.ct >= e.cdur) { e.mort = true; son(p, 'piege'); }
    return;
  }
  if (e.etat === 'vit' && e.lutte) {
    if (e.tenu) lutter(p, e, dt);
    else { e.ox *= Math.pow(0.3, dt); e.oy *= Math.pow(0.3, dt); }
  }
  const d = e.z - p.camZ;
  switch (e.type) {
    case 'goule':
      if (e.etat === 'vit') {
        e.z += (e.tenu ? 0.4 : -e.vit) * dt;
        e.x = e.bx + Math.sin(e.t * e.ondule + e.ph) * 0.7;
        e.y = -0.15 + Math.sin(e.t * 3.1 + e.ph) * 0.18;
        if (d < 1.5) e.etat = 'attaque';
      } else if (e.etat === 'attaque') attaquer(p, e, dt);
      break;
    case 'gouleVol':
      // 2,6 pas par seconde : l'enfant n'en attrapait que 73 % dans le vestiaire
      e.x += e.dir * 2.0 * dt; e.z = p.camZ + e.dist + (e.tenu ? 0.3 : 0);
      e.y = -0.3 + Math.sin(e.t * 5) * 0.25;
      if (e.dir * e.x > 3.6) e.mort = true;
      break;
    case 'assiette': {
      e.z -= e.vit * dt;
      const k = Math.min(1, dt * 1.3);
      e.x += (e.tx - e.x) * k; e.y += (e.ty - e.y) * k;
      if (e.z - p.camZ < 0.6) { e.mort = true; evt(p, { type: 'casse' }); coup(p); }
      break;
    }
    case 'lumi':
      if (e.etat === 'vit') {
        e.x += e.dir * 0.62 * dt; e.z = p.camZ + 5; e.y = -0.2 + Math.sin(e.t * 2.4) * 0.15;
        if (e.dir * e.x > 2.8) {
          e.mort = true; p.lumi.sauve = true;
          if (p.coeurs < COEURS) soigner(p);
          son(p, 'merci'); moment(p, 'lumiSauve');
        }
      } else {
        e.y -= 1.5 * dt; e.z += 3 * dt; e.x += e.dir * 1.2 * dt; e.alpha -= dt * 0.7;
        if (e.alpha <= 0) e.mort = true;
      }
      break;
    case 'levier':
      // le rayon doit quitter le levier avant de pouvoir le rebasculer
      if (!e.vise) { e.verrouille = false; e.charge = Math.max(0, e.charge - dt * 2); }
      e.vise = false;
      break;
    case 'secret': if (d < 0.4) e.mort = true; break;
    case 'majordome': majordome(p, e, dt); break;
    case 'leurre': {
      const b = p.boss;
      if (!b || b.mort || b.etat === 'cap') { e.mort = true; break; }
      e.x += (e.cible - e.x) * Math.min(1, dt * 3); e.z = b.z; e.y = b.y + Math.sin(e.t * 1.7 + e.ph) * 0.05;
      // un leurre vacille, translucide : un enfant doit voir le vrai sans chercher le monocle
      e.alpha = 0.55 + 0.2 * Math.sin(e.t * 5 + e.ph);
      break;
    }
  }
}
