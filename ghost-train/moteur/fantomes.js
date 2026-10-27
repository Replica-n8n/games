// Les fantômes, en pixels de jeu : une position (x, y), une échelle s (1 = leur
// dessin à taille réelle). Ils sortent d'une cachette petits, grandissent en venant
// vers nous et frappent à FRAPPE. Le moteur ne dessine rien : l'écran pose chaque
// dessin dans sa boîte (`boite`), là même où l'on vise.
import { FRAPPE, DT } from './constantes.js';
import { ESPECES } from '../contenu/especes.js';
import { SALLES } from '../contenu/salles.js';

const SALLE = (p, k) => SALLES[p.salle].cachettes[k];

let numero = 0;

/** La boîte d'une entité à l'écran. @param {any} e */
export function boite(e) {
  const [tw, th] = ESPECES[e.type].taille, w = tw * e.s, h = th * e.s;
  return { x: e.x - w / 2, y: e.y - h / 2, w, h };
}

/** @param {any} p @param {any} ev */
export function evt(p, ev) { p.evenements.push(ev); }

/** Un fantôme (ou un tir, ou le chat) naît en (x, y) à l'échelle s. @param {any} p */
export function naitre(p, type, x, y, s) {
  const d = ESPECES[type], h = p.h;
  const e = {
    id: ++numero, type, x, y, s, t: 0, pv: d.pv, pv0: d.pv, etat: 'sort', tc: 0,
    hostile: !d.ami, tir: !!d.tir, boss: !!d.boss, croit: d.croit || 0, ph: h.entre(0, 6),
    tx: h.entre(70, 250), ty: h.entre(96, 110), tTir: 1.8, tirs: 0, cible: s, vise: 0, mort: false,
  };
  if (e.hostile && !e.tir && !e.boss) p.vus++;
  p.ents.push(e);
  return e;
}

/** Un tir part d'un fantôme vers nous (un crachat, une assiette). @param {any} p @param {any} src */
export function tirer(p, src, type, dur) {
  const e = naitre(p, type, src.x, src.y + 4, 0.35);
  e.etat = 'vit'; e.x0 = e.x; e.y0 = e.y; e.k = 0; e.dur = dur;
  e.tx = p.h.entre(90, 230); e.ty = p.h.entre(80, 120);
  evt(p, { type: 'son', nom: type === 'assiette' ? 'assiette' : 'crache' });
}

/** Le fantôme est arrivé jusqu'à nous : un cœur de moins et de la bave. @param {any} p @param {any} e */
export function frapper(p, e) {
  e.mort = true;
  if (p.tenu === e) p.tenu = null;
  evt(p, { type: 'son', nom: 'coup' });
  if (p.options.invincible) return;
  p.coeurs--; p.coeursPerdus++;
  evt(p, { type: 'bave', x: e.x, y: Math.min(140, e.y), r: e.tir ? 12 : 18 });
  evt(p, { type: 'coup' });
}

/** Un pas de vie d'une entité. @param {any} p @param {any} e */
export function bouger(p, e) {
  e.t += DT;
  if (e.etat === 'cap') { e.tc += DT; if (e.tc > 0.45) e.mort = true; return; }
  if (e.etat === 'sort') {
    e.s += (e.cible - e.s) * 0.12;
    if (Math.abs(e.s - e.cible) < 0.03 || e.t > 0.6) e.etat = 'vit';
    if (e.type !== 'chat') return;
  }
  if (e.type === 'chat') {
    // il descend de sa cachette et file vers le bord le plus proche
    const dir = e.x < 160 ? -1 : 1;
    e.x += dir * (e.feule ? 260 : 120) * DT; e.y += (150 - e.y) * 0.08; e.s = 1.2;
    if (e.x < -30 || e.x > 350) e.mort = true;
    return;
  }
  if (e.tir) {
    e.k = Math.min(1, e.k + DT / e.dur);
    e.x = e.x0 + (e.tx - e.x0) * e.k; e.y = e.y0 + (e.ty - e.y0) * e.k; e.s = 0.35 + 1.75 * e.k;
    if (e.k >= 1) frapper(p, e);
    return;
  }
  const tenu = p.tenu === e;
  if (e.type === 'majordome') {
    // il va et vient au fond, lance une assiette toutes les 2 s, appelle deux goules à mi-vie
    e.x = 160 + Math.sin(e.t * (tenu ? 0.3 : 0.7)) * 50; e.y = 66 + Math.sin(e.t * 2) * 3;
    e.tTir -= DT;
    if (e.tTir <= 0) { tirer(p, e, 'assiette', 1.7); e.tTir = e.pv < e.pv0 / 2 ? 1.6 : 2.1; }
    if (!e.renforts && e.pv < e.pv0 / 2) {
      e.renforts = true;
      const libres = Object.keys(p.s.alerte).filter((k) => Math.abs(SALLE(p, k).x - e.x) > 30);
      for (const c of libres.slice(0, 2)) { p.s.alerte[c] = 0.8; p.attente.push({ t: 0.8, type: 'goule', cachette: c, vise: 0 }); }
    }
    return;
  }
  if (e.type === 'crane' && e.tirs < 3) {
    // il flotte loin et crache trois fois avant de venir
    e.x += (e.tx - e.x) * 0.01; e.y = 58 + Math.sin(e.t * 2) * 5; e.s += (0.85 - e.s) * 0.05;
    e.tTir -= DT;
    if (e.tTir <= 0) { tirer(p, e, 'ecto', 1.5); e.tirs++; e.tTir = 2.4; }
    return;
  }
  // vise 1 : il vient au milieu (sous le lustre) ; vise 2 : sous une casserole
  if (e.vise === 1 && !e.vu) { e.tx = p.h.entre(130, 190); e.vu = 1; }
  if (e.vise === 2 && !e.vu) { e.tx = p.h.choix([121, 160, 199]); e.vu = 1; }
  if (!tenu) e.s += e.croit * DT;
  else e.s = Math.max(0.5, e.s - 0.05 * DT);
  const zig = e.type === 'drap' ? Math.sin(e.t * 3 + e.ph) * 30 : Math.sin(e.t * 1.3 + e.ph) * 10;
  e.x += (e.tx + zig - e.x) * (tenu ? 0.005 : 0.025);
  e.y += (e.ty - 22 + e.s * 10 - e.y) * 0.03 + Math.sin(e.t * 4 + e.ph) * 0.15;
  if (e.s >= FRAPPE) frapper(p, e);
}
