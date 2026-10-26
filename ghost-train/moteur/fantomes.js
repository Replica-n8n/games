// Ghost Train : naissance et comportement de tout ce qui vit dans le couloir
// (fantômes, boss, projectiles, Lumi, levier d'aiguillage, secrets du décor).
import { COEURS, AIGUILLE, Y_LEVIER } from './constantes.js';
import { ESPECES } from '../contenu/especes.js';
import { evt, son, moment } from './evenements.js';
import { coup, soigner } from './joueur.js';

const lerp = (a, b, k) => a + (b - a) * k;

/** Ce qui empêche le wagon de repartir. @param {any} e */
export const bloque = (e) => e.bloque && e.etat !== 'cap' && !e.mort;
/** Un projectile. @param {any} e */
export const estTir = (e) => !!ESPECES[e.type].tir;
/** Un boss. @param {any} e */
export const estBoss = (e) => !!ESPECES[e.type].boss;

/**
 * @param {any} p @param {string} type @param {number} x
 * @param {any} [o] options propres à l'espèce (secret, côté du levier…)
 */
export function naitre(p, type, x, o = {}) {
  const E = ESPECES[type];
  const e = {
    type, x, bx: x, y: 0, z: p.camZ + 13, t: 0, ph: p.h.entre(0, 6), etat: 'vit',
    pv: E.pv ?? 1, pv0: E.pv ?? 1, taille: E.taille, alpha: 1, pieces: E.pieces || 0,
    bloque: !!E.bloque, lutte: !!E.lutte, hostile: !!E.hostile, prio: E.prio || 0,
    ox: 0, oy: 0, tenu: false, boite: null, mort: false, etourdi: 0, revele: 0, tire: 0,
    // lutte : le fantôme tire dans une direction, et la change de temps en temps ;
    // `slam` monte quand le viseur tire à l'opposé (à partir du Grenier)
    traction: { dx: 1, dy: 0, t: 0 }, slam: 0,
  };
  if (E.boss) { e.entree = 0; e.alpha = 0; e.y = 1.2; e.z = p.camZ + 6.5; }
  switch (type) {
    case 'goule': e.vit = p.h.entre(...(p.mission.vitesseGoule || [1.4, 1.9])); e.ondule = p.h.entre(1.4, 2.4); break;
    case 'gouleVol': e.dir = x < 0 ? 1 : -1; e.x = -e.dir * 3.4; e.dist = p.h.entre(4.5, 6.5); e.z = p.camZ + e.dist; break;
    case 'lumi':
      e.dir = x < 0 ? 1 : -1; e.x = -e.dir * 2.7; e.z = p.camZ + 5; p.lumi.vue = true;
      son(p, 'lumi'); moment(p, 'lumi'); break;
    case 'levier': e.cote = o.cote; e.z = p.camZ + AIGUILLE.levier; e.y = Y_LEVIER; e.charge = 0; e.vise = false; e.verrouille = false; break;
    case 'secret':
      e.id = o.id; e.forme = o.forme; e.x = o.x; e.y = o.y; e.z = p.camZ + o.dz; e.charge = 0; moment(p, 'indice'); break;
    case 'majordome': e.tAssiette = 3; e.phase = 1; break;
    case 'leurre': Object.assign(e, o); break;
    // le Drap se lève du plancher, presque transparent : il faut le flasher pour le capturer
    case 'drap': e.z = p.camZ + p.h.entre(7, 9); e.vit = 0.75; e.leve = 0; break;
    // l'Ombre rôde quelques secondes, invisible sauf ses yeux, puis s'en va
    case 'ombre': e.z = p.camZ + p.h.entre(5, 6.5); e.vie = 12; break;
    case 'bibliothecaire': e.tLivre = 3.2; e.expose = 0; e.vagueLivres = 0; break;
    case 'livre': e.angle = o.angle || 0; break;
    // le Saxophoniste garde ses distances et joue sur les temps
    case 'saxo': e.z = p.camZ + p.h.entre(10, 12); e.garde = p.h.entre(6.5, 8); e.notes = 0; e.temps = -1; e.aTirer = 2 + p.h.entier(3); break;
    case 'chef': e.temps = -1; e.renforts = false; break;
    case 'crane': e.tirs = 0; e.tTir = 1.6; break;
    case 'gouvernante': e.bouclier = false; e.tBouclier = 4; e.tTir = 3.5; e.tAppel = 8; break;
  }
  if (e.hostile) p.total++;
  p.ents.push(e);
  if (type === 'goule' || type === 'gouleVol') moment(p, 'goule');
  if (type === 'drap') moment(p, 'drap');
  if (type === 'ombre') moment(p, 'ombre');
  if (type === 'saxo') moment(p, 'saxo');
  if (type === 'crane') moment(p, 'crane');
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
    // le fantôme s'écrase sur la vitre : l'écran en garde la bave
    evt(p, { type: 'bave', x: e.boite ? e.boite.cx : 160, y: e.boite ? e.boite.cy : 80 });
    coup(p);
  }
  if (e.at > 0.48) e.mort = true;
}

/** Un projectile part de src vers le wagon. @param {any} p @param {any} src @param {string} type */
export function lancer(p, src, type, vit = [3.0, 3.6]) {
  const a = naitre(p, type, src.x + src.ox);
  a.y = src.y + src.oy; a.z = src.z - 0.2;
  a.tx = p.h.entre(-0.45, 0.45); a.ty = p.h.entre(-0.15, 0.3); a.vit = p.h.entre(vit[0], vit[1]);
  son(p, type === 'note' ? 'note' : type === 'ecto' ? 'crache' : 'assiette');
  return a;
}

/** Le boss arrive en fondu, du plancher vers sa place. @param {any} e @param {number} dt @param {number} y0 */
function entrer(e, dt, y0) {
  e.entree += dt; e.alpha = Math.min(1, e.entree / 1.5);
  e.y = lerp(1.2, y0, Math.min(1, e.entree / 1.5));
  return e.entree >= 1.6;
}

const PLACES = [-1.3, 0, 1.3];
/** Le vrai Majordome et ses deux leurres changent de place. @param {any} p @param {any} boss */
function melanger(p, boss) {
  const ordre = [0, 1, 2];
  for (let i = 2; i > 0; i--) { const j = p.h.entier(i + 1); [ordre[i], ordre[j]] = [ordre[j], ordre[i]]; }
  boss.cible = PLACES[ordre[0]];
  p.ents.filter((x) => x.type === 'leurre' && !x.mort).forEach((l, k) => { l.cible = PLACES[ordre[k + 1]]; });
  son(p, 'pouf');
}

/** @param {any} p @param {any} e @param {number} dt */
function majordome(p, e, dt) {
  e.z = p.camZ + 6.5 + Math.sin(e.t * 0.5) * 0.4 + (e.tenu ? 0.3 : 0);
  if (e.phase === 1) e.x = Math.sin(e.t * 0.6) * 1.2;
  else e.x += (e.cible - e.x) * Math.min(1, dt * 3);
  if (!entrer(e, dt, -0.45 + Math.sin(e.t * 1.3) * 0.15)) return;
  e.tAssiette -= dt;
  if (e.tAssiette <= 0) { lancer(p, e, 'assiette'); e.tAssiette = e.phase === 1 ? 2.6 : 1.9; }
  if (e.phase === 1 && e.pv <= e.pv0 / 2) {
    e.phase = 2; e.tPlaces = 4;
    for (let k = 0; k < 2; k++) naitre(p, 'leurre', e.x, { z: e.z, y: e.y, alpha: 1 });
    melanger(p, e);
    moment(p, 'bossMoitie');
  }
  if (e.phase === 2) { e.tPlaces -= dt; if (e.tPlaces <= 0) { e.tPlaces = 4; melanger(p, e); } }
}

/** Le Bibliothécaire : quatre livres tournent autour de lui et le protègent ; il en lance un de temps en temps. */
function bibliothecaire(p, e, dt) {
  e.z = p.camZ + 6.5 + Math.sin(e.t * 0.5) * 0.3 + (e.tenu ? 0.3 : 0);
  e.x = Math.sin(e.t * 0.5) * 1.1;
  if (!entrer(e, dt, -0.4 + Math.sin(e.t * 1.2) * 0.12)) return;
  const livres = p.ents.filter((x) => x.type === 'livre' && !x.mort);
  if (!e.vagueLivres) { appelerLivres(p, e); e.vagueLivres = 1; return; }
  if (livres.length) {
    e.tLivre -= dt;
    if (e.tLivre <= 0) { const l = livres[0]; l.mort = true; lancer(p, l, 'tirLivre', [2.6, 3.0]); e.tLivre = 3.2 - Math.min(1.4, e.vagueLivres * 0.4); }
  } else {
    // sans ses livres, il est à découvert quelques secondes, puis il en rappelle
    if (e.expose <= 0) { e.expose = 6; moment(p, 'bibliSansLivres'); }
    e.expose -= dt;
    if (e.expose <= 0) { appelerLivres(p, e); e.vagueLivres++; }
  }
}
function appelerLivres(p, e) {
  for (let k = 0; k < 4; k++) naitre(p, 'livre', e.x, { angle: (k / 4) * Math.PI * 2 });
  son(p, 'livres');
}

/** Le Chef d'orchestre bat la mesure : une note tous les deux temps ; à mi-vie, deux saxophonistes le rejoignent. */
function chef(p, e, dt) {
  e.z = p.camZ + 6.5 + (e.tenu ? 0.3 : 0);
  e.x = Math.sin(p.nTemps * Math.PI / 2) * 1.0;
  if (!entrer(e, dt, -0.4 + (p.phase < 0.2 ? -0.08 : 0))) return;
  if (p.nTemps !== e.temps) {
    e.temps = p.nTemps;
    if (e.temps % 2 === 0) lancer(p, e, 'note', [2.6, 3.0]);
  }
  if (!e.renforts && e.pv <= e.pv0 / 2) {
    e.renforts = true;
    for (const x of [-1.4, 1.4]) { const s = naitre(p, 'saxo', x); s.z = e.z + 1; s.garde = 7; }
    moment(p, 'chefMoitie');
  }
}

/** La Gouvernante : un bouclier qui va et vient (le flash le brise), de l'ectoplasme, des goules en renfort. */
function gouvernante(p, e, dt) {
  e.z = p.camZ + 6.5 + Math.sin(e.t * 0.5) * 0.5 + (e.tenu ? 0.3 : 0);
  e.x = Math.sin(e.t * 0.65) * 1.25;
  if (!entrer(e, dt, -0.4 + Math.sin(e.t * 1.3) * 0.2)) return;
  if (e.etourdi > 0) return;
  e.tBouclier -= dt;
  if (e.tBouclier <= 0) { e.bouclier = !e.bouclier; e.tBouclier = e.bouclier ? 3.5 : 4; if (e.bouclier) moment(p, 'bouclier'); }
  e.tTir -= dt;
  // deux crachats par salve : à trois, l'enfant perdait 2,3 cœurs contre elle (robot, 2026-10-26)
  if (e.tTir <= 0) { for (let k = 0; k < 2; k++) lancer(p, e, 'ecto'); e.tTir = 3.8 - (1 - e.pv / e.pv0) * 1.3; }
  e.tAppel -= dt;
  if (e.tAppel <= 0) { for (const dx of [-0.8, 0.8]) { const g = naitre(p, 'goule', e.x + dx); g.z = e.z; } e.tAppel = 9; }
}

/** @param {any} p @param {any} e @param {number} dt */
export function pasEntite(p, e, dt) {
  e.t += dt;
  if (e.etat === 'cap') {
    e.ct += dt;
    if (e.ct >= e.cdur) { e.mort = true; son(p, 'piege'); }
    return;
  }
  e.revele = Math.max(0, e.revele - dt);
  if (e.etat === 'vit' && e.lutte) {
    if (e.tenu) lutter(p, e, dt);
    else { e.ox *= Math.pow(0.3, dt); e.oy *= Math.pow(0.3, dt); e.slam = Math.max(0, e.slam - dt * 0.4); }
  }
  // Étourdi par le flash : il ne bouge plus, et le rayon le tient à pleine puissance
  if (e.etourdi > 0 && e.etat === 'vit') {
    e.etourdi -= dt;
    if (e.type === 'drap' || e.type === 'ombre') e.revele = Math.max(e.revele, 0.5);
    if (!estBoss(e)) { if (e.tenu) e.z += 0.3 * dt; return; }
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
    case 'drap':
      if (e.etat === 'vit') {
        e.leve = Math.min(1, e.leve + dt);
        e.y = lerp(1.0, -0.2, e.leve);
        // presque invisible ; le flash le révèle quelques secondes
        e.alpha = e.revele > 0 ? 1 : 0.14 + 0.08 * Math.sin(e.t * 4);
        e.z += (e.tenu ? 0.3 : -e.vit) * dt;
        e.x = e.bx + Math.sin(e.t * 0.8 + e.ph) * 0.4;
        if (d < 1.6) { e.etat = 'attaque'; e.alpha = 1; }
      } else if (e.etat === 'attaque') attaquer(p, e, dt);
      break;
    case 'ombre':
      e.alpha = e.revele > 0 ? Math.min(1, e.revele * 2) : 0;
      e.x = e.bx + Math.sin(e.t * 0.6) * 1.4; e.y = -0.5 + Math.sin(e.t * 1.7) * 0.2;
      e.vie -= dt;
      if (e.vie <= 0 && e.revele <= 0) e.mort = true;
      break;
    case 'livre': {
      const b = p.boss;
      if (!b || b.mort || b.etat === 'cap') { e.mort = true; break; }
      e.angle += dt * 1.6;
      e.x = b.x + Math.cos(e.angle) * 1.5; e.y = b.y + Math.sin(e.angle) * 0.6 - 0.1; e.z = b.z - 0.6 + Math.sin(e.angle) * 0.3;
      break;
    }
    case 'saxo':
      if (e.etat === 'vit') {
        if (d > e.garde && !e.tenu) e.z -= 1.7 * dt;
        if (e.tenu) e.z += 0.3 * dt;
        // il balance sur les temps et souffle une note tous les quatre temps
        if (p.nTemps !== e.temps) {
          e.temps = p.nTemps;
          if (d < e.garde + 1.5 && --e.aTirer <= 0) { lancer(p, e, 'note', [2.6, 3.1]); e.notes++; e.aTirer = 4; }
          if (e.notes >= 4) e.garde = 1.2;
        }
        e.x = e.bx + ((p.nTemps & 1) ? 0.35 : -0.35) * Math.min(1, p.phase * 4);
        e.y = -0.25 + (p.phase < 0.2 ? -0.08 : 0);
        if (d < 1.5) e.etat = 'attaque';
      } else if (e.etat === 'attaque') attaquer(p, e, dt);
      break;
    case 'crane':
      if (e.etat === 'vit') {
        if (e.tirs < 3) {
          if (d > 6.5 && !e.tenu) e.z -= 1.8 * dt;
          // tenu, il recule vite : il faut le slammer pour le faire céder
          if (e.tenu) e.z += 0.8 * dt;
          e.x = e.bx + Math.sin(e.t * 0.9 + e.ph) * 1.2; e.y = -0.45 + Math.sin(e.t * 2) * 0.15;
          e.tTir -= dt;
          if (e.tTir <= 0 && d < 8) { lancer(p, e, 'ecto'); e.tirs++; e.tTir = 2.4; }
        } else { e.z += (e.tenu ? 0.8 : -2.4) * dt; e.x *= 0.99; }
        if (d < 1.5) e.etat = 'attaque';
      } else if (e.etat === 'attaque') attaquer(p, e, dt);
      break;
    case 'assiette': case 'note': case 'ecto': case 'tirLivre': {
      e.z -= e.vit * dt;
      const k = Math.min(1, dt * 1.3);
      e.x += (e.tx - e.x) * k; e.y += (e.ty - e.y) * k;
      if (e.type === 'note') e.oy = Math.sin(e.t * 8 + e.ph) * 0.08;
      if (e.z - p.camZ < 0.6) {
        e.mort = true;
        evt(p, { type: e.type === 'ecto' ? 'bave' : 'casse', x: e.boite ? e.boite.cx : 160, y: e.boite ? e.boite.cy : 80 });
        coup(p);
      }
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
    case 'bibliothecaire': bibliothecaire(p, e, dt); break;
    case 'chef': chef(p, e, dt); break;
    case 'gouvernante': gouvernante(p, e, dt); break;
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
