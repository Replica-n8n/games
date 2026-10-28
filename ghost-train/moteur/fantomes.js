// Les fantômes, en pixels de jeu : une position (x, y), une échelle s (1 = leur
// dessin à taille réelle). Ils sortent d'une cachette petits, grandissent en venant
// vers nous et frappent à FRAPPE. Le moteur ne dessine rien : l'écran pose chaque
// dessin dans sa boîte (`boite`), là même où l'on vise.
import { FRAPPE, DT, COEURS } from './constantes.js';
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
    hostile: !d.ami && !d.garde, tir: !!d.tir, boss: !!d.boss, garde: !!d.garde, croit: d.croit || 0, ph: h.entre(0, 6),
    tx: h.entre(70, 250), ty: h.entre(96, 110), tTir: 1.8, tirs: 0, cible: s, vise: 0, mort: false,
    // la lutte aux combles, le flash à la bibliothèque
    lutte: !!d.lutte && !!(p.mission.actions || {}).slam, slam: 0, traction: { dx: 1, dy: 0, t: 0 },
    etourdi: 0, revele: 0, cache: !!d.cache, alpha: 1, temps: -1,
  };
  if (e.hostile && !e.tir && !e.boss) p.vus++;
  p.ents.push(e);
  return e;
}

/** Un tir part d'un fantôme vers nous (un crachat, une assiette, une note, un livre). @param {any} p @param {any} src */
export function tirer(p, src, type, dur) {
  const e = naitre(p, type, src.x, src.y + 4, 0.35);
  e.etat = 'vit'; e.x0 = e.x; e.y0 = e.y; e.k = 0; e.dur = dur;
  e.tx = p.h.entre(90, 230); e.ty = p.h.entre(80, 120);
  evt(p, { type: 'son', nom: type === 'assiette' ? 'assiette' : type === 'note' ? 'note' : type === 'tirLivre' ? 'livres' : 'crache' });
  return e;
}

/** Le fantôme est arrivé jusqu'à nous : un cœur de moins et de la bave. @param {any} p @param {any} e */
export function frapper(p, e) {
  e.mort = true;
  if (p.tenu === e) p.tenu = null;
  evt(p, { type: 'son', nom: 'coup' });
  if (p.options.invincible) return;
  p.coeurs--; p.coeursPerdus++;
  evt(p, { type: 'bave', x: e.x, y: Math.min(140, e.y), r: e.tir ? 12 : 18 });
  evt(p, { type: 'coup', par: e.type, salle: p.salle });
}

/** Des renforts sortent de deux cachettes loin du boss. @param {any} p @param {any} e */
function renforts(p, e, type) {
  const libres = Object.keys(p.s.alerte).filter((k) => Math.abs(SALLE(p, k).x - e.x) > 30);
  for (const c of libres.slice(0, 2)) { p.s.alerte[c] = 0.8; p.attente.push({ t: 0.8, type, cachette: c, vise: 0 }); }
}

/** Les livres qui tournent autour du Bibliothécaire. @param {any} p @param {any} e */
function appelerLivres(p, e) {
  for (let k = 0; k < 4; k++) { const l = naitre(p, 'garde', e.x, e.y, 1); l.etat = 'vit'; l.angle = (k / 4) * Math.PI * 2; }
  evt(p, { type: 'son', nom: 'livres' });
}

/** Les boss : ils vont et viennent au fond, et chacun a sa manière de se défendre. Tenu dans le rayon,
 * un boss ralentit et tire deux fois moins : ça paie d'attaquer. @param {any} p @param {any} e */
function boss(p, e, tenu) {
  const lent = tenu ? 0.3 : 1;
  if (e.type === 'majordome') {
    e.x = 160 + Math.sin(e.t * 0.7 * lent) * 50; e.y = 66 + Math.sin(e.t * 2) * 3;
    e.tTir -= DT * (tenu ? 0.5 : 1);
    if (e.tTir <= 0) { tirer(p, e, 'assiette', 1.7); e.tTir = e.pv < e.pv0 / 2 ? 1.6 : 2.1; }
    if (!e.renforts && e.pv < e.pv0 / 2) { e.renforts = true; renforts(p, e, 'ecto'); }
    return;
  }
  if (e.type === 'bibliothecaire') {
    // quatre livres le protègent ; il en lance un de temps en temps ; sans eux, il est à découvert 6 s
    e.x = 160 + Math.sin(e.t * 0.5 * lent) * 50; e.y = 64 + Math.sin(e.t * 1.2) * 4;
    if (!e.vague) { appelerLivres(p, e); e.vague = 1; e.tLivre = 3.2; e.expose = 0; return; }
    const livres = p.ents.filter((x) => x.garde && !x.mort && x.etat === 'vit');
    if (livres.length) {
      e.expose = 0;
      e.tLivre -= DT * (tenu ? 0.5 : 1);
      if (e.tLivre <= 0) { const l = livres[0]; l.mort = true; tirer(p, l, 'tirLivre', 1.6); e.tLivre = 3.2 - Math.min(1.2, e.vague * 0.3); }
    } else {
      if (e.expose <= 0) { e.expose = 6; evt(p, { type: 'texte', s: 'À DÉCOUVERT !', x: e.x, y: e.y - 34, col: '#fff27a' }); }
      e.expose -= DT;
      if (e.expose <= 0.01) { appelerLivres(p, e); e.vague++; }
    }
    return;
  }
  if (e.type === 'chef') {
    // il bat la mesure : une note tous les quatre temps (trois à mi-vie), et deux saxophonistes
    e.x = 160 + Math.sin(p.nTemps * Math.PI / 2) * 45 * lent; e.y = 62 + (p.phase < 0.2 ? -3 : 0);
    if (p.nTemps !== e.temps) { e.temps = p.nTemps; if (e.temps % ((e.pv < e.pv0 / 2 ? 3 : 4) * (tenu ? 2 : 1)) === 0) tirer(p, e, 'note', 2.3); }
    if (!e.renforts && e.pv < e.pv0 / 2) { e.renforts = true; renforts(p, e, 'saxo'); }
    return;
  }
  if (e.type === 'gouvernante') {
    // un bouclier qui va et vient (le flash le brise), un crachat par salve (deux à mi-vie), des ectos en renfort
    e.x = 160 + Math.sin(e.t * 0.65 * lent) * 50; e.y = 66 + Math.sin(e.t * 1.3) * 5;
    if (e.tBouclier === undefined) { e.bouclier = false; e.tBouclier = 4; e.tTir = 3.5; e.tAppel = 8; }
    if (e.etourdi > 0) return;
    e.tBouclier -= DT;
    if (e.tBouclier <= 0) { e.bouclier = !e.bouclier; e.tBouclier = e.bouclier ? 3.5 : 4; if (e.bouclier) evt(p, { type: 'son', nom: 'pret' }); }
    e.tTir -= DT * (tenu ? 0.5 : 1);
    if (e.tTir <= 0) { for (let k = 0; k < (e.pv < e.pv0 / 2 ? 2 : 1); k++) tirer(p, e, 'crachat', 2.0); e.tTir = 3.8 - (1 - e.pv / e.pv0) * 1.0; }
    e.tAppel -= DT;
    if (e.tAppel <= 0) { renforts(p, e, 'ecto'); e.tAppel = 9; }
  }
}

/** Un pas de vie d'une entité. @param {any} p @param {any} e */
export function bouger(p, e) {
  e.t += DT;
  if (e.etat === 'cap') { e.tc += DT; if (e.tc > 0.45) e.mort = true; return; }
  if (e.etat === 'sort') {
    e.s += (e.cible - e.s) * 0.12;
    if (Math.abs(e.s - e.cible) < 0.03 || e.t > 0.6) e.etat = 'vit';
    if (e.type !== 'chat' && e.type !== 'lumi') return;
  }
  e.revele = Math.max(0, e.revele - DT);
  if (e.cache) e.alpha = e.revele > 0 ? Math.min(1, e.revele * 2) : 0;
  const tenu = p.tenu === e;
  // la lutte : tenu, il tire dans un sens qui change ; lâché, sa jauge de slam retombe
  if (e.lutte && e.etat === 'vit') {
    if (tenu) {
      e.traction.t -= DT;
      if (e.traction.t <= 0) { const a = p.h.entre(0, Math.PI * 2), dx = Math.cos(a), dy = Math.sin(a) * 0.7, n = Math.hypot(dx, dy); e.traction.dx = dx / n; e.traction.dy = dy / n; e.traction.t = p.h.entre(0.8, 1.3); }
      e.x = Math.max(20, Math.min(300, e.x + e.traction.dx * 26 * DT)); e.y = Math.max(30, Math.min(150, e.y + e.traction.dy * 18 * DT));
    } else e.slam = Math.max(0, e.slam - DT * 0.5);
  }
  // étourdi par le flash : il ne bouge plus (un boss continue, mais ne se défend plus)
  if (e.etourdi > 0) {
    e.etourdi -= DT;
    if (e.cache) e.revele = Math.max(e.revele, 0.5);
    if (!e.boss) return;
  }
  if (e.type === 'chat') {
    const dir = e.x < 160 ? -1 : 1;
    e.x += dir * (e.feule ? 260 : 120) * DT; e.y += (150 - e.y) * 0.08; e.s = 1.2;
    if (e.x < -30 || e.x > 350) e.mort = true;
    return;
  }
  if (e.type === 'lumi') {
    // Lumi traverse la pièce sans rien faire ; épargné, il nous rend un cœur
    if (e.dir === undefined) { e.dir = e.x < 160 ? 1 : -1; p.lumi.vue = true; }
    if (e.fuite) { e.y -= 50 * DT; e.x += e.dir * 60 * DT; e.alpha -= DT * 0.8; if (e.alpha <= 0) e.mort = true; return; }
    e.x += e.dir * 34 * DT; e.y = 84 + Math.sin(e.t * 2.4) * 5; e.s = 1;
    if (e.x < -20 || e.x > 340) {
      e.mort = true; p.lumi.epargne = (p.lumi.epargne || 0) + 1;
      if (p.coeurs < COEURS) p.coeurs++;
      evt(p, { type: 'texte', s: 'MERCI ! +1 CŒUR', x: 160, y: 70, col: '#ff8aa0' }); evt(p, { type: 'son', nom: 'merci' });
    }
    return;
  }
  if (e.garde) {
    const b = p.boss;
    if (!b || b.mort || b.etat === 'cap') { e.mort = true; return; }
    e.angle += DT * 1.6;
    e.x = b.x + Math.cos(e.angle) * 34 * b.s; e.y = b.y + Math.sin(e.angle) * 14 * b.s - 4; e.s = 0.9 + Math.sin(e.angle) * 0.15;
    return;
  }
  if (e.tir) {
    e.k = Math.min(1, e.k + DT / e.dur);
    e.x = e.x0 + (e.tx - e.x0) * e.k; e.y = e.y0 + (e.ty - e.y0) * e.k + (e.type === 'note' ? Math.sin(e.t * 9) * 3 : 0); e.s = 0.35 + 1.75 * e.k;
    if (e.k >= 1) frapper(p, e);
    return;
  }
  if (e.boss) return boss(p, e, tenu);
  if (e.type === 'crane' && e.tirs < 3) {
    // il flotte loin et crache trois fois avant de venir
    if (!tenu) { e.x += (e.tx - e.x) * 0.01; e.y = 58 + Math.sin(e.t * 2) * 5; }
    e.s += (0.85 - e.s) * 0.05;
    e.tTir -= DT;
    if (e.tTir <= 0) { tirer(p, e, 'crachat', 1.8); e.tirs++; e.tTir = 2.4; }
    return;
  }
  if (e.type === 'saxo' && (e.notes || 0) < 3) {
    // il reste au fond et souffle une note tous les quatre temps (trois en tout), en balançant sur la mesure
    e.notes = e.notes || 0; e.s += (0.8 - e.s) * 0.05;
    if (!tenu) { e.bx = e.bx === undefined ? e.x : e.bx; e.x = e.bx + ((p.nTemps & 1) ? 8 : -8) * Math.min(1, p.phase * 4); e.y = 60 + (p.phase < 0.2 ? -2 : 0); }
    if (p.nTemps !== e.temps) { e.temps = p.nTemps; e.aTirer = (e.aTirer === undefined ? 2 : e.aTirer) - 1; if (e.aTirer <= 0) { tirer(p, e, 'note', 1.9); e.notes++; e.aTirer = 4; } }
    return;
  }
  // vise 1 : il vient au milieu (sous ce qui tombe) ; vise 2 : sous une casserole
  if (e.vise === 1 && !e.vu) { e.tx = p.h.entre(130, 190); e.vu = 1; }
  if (e.vise === 2 && !e.vu) { const cx = SALLES[p.salle].objets.filter((o) => o.effet === 'pend').map((o) => o.cx); e.tx = cx.length ? p.h.choix(cx) : 160; e.vu = 1; }
  if (!tenu) e.s += e.croit * DT;
  else e.s = Math.max(0.5, e.s - 0.05 * DT);
  const zig = e.type === 'drap' || e.type === 'livre' ? Math.sin(e.t * 3 + e.ph) * 30 : Math.sin(e.t * 1.3 + e.ph) * 10;
  if (!tenu || !e.lutte) {
    e.x += (e.tx + zig - e.x) * (tenu ? 0.005 : 0.025);
    e.y += (e.ty - 22 + e.s * 10 - e.y) * 0.03 + Math.sin(e.t * 4 + e.ph) * 0.15;
  }
  if (e.s >= FRAPPE) frapper(p, e);
}
