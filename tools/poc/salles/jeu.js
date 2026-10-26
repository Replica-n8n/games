// Maquette « les salles » : on ne roule plus dans un couloir, on s'arrête dans de
// vraies pièces. Les fantômes sortent des CACHETTES (qui tremblent, s'éclairent ou
// fument juste avant), s'approchent, et frappent s'ils arrivent jusqu'à nous. Le
// décor se vise : le lustre et les casseroles tombent sur les fantômes, le vase et
// le bocal sont pleins de pièces. Plus de wagon ni d'appareil : tout l'écran est à
// la pièce. Le doigt vise un peu AU-DESSUS de lui, pour ne pas cacher sa cible.
import { S, BLANC, preparer, coeur, peindre } from '../../../ghost-train/ecran/dessins.js';
import { ecrire } from '../../../ghost-train/ecran/police.js';
import { demarrer, rayon, jouerMusique, bruitage } from '../../../ghost-train/son.js';
import { SALON } from './salon.js';
import { CUISINE } from './cuisine.js';
import { W, H, R, NOIR, ovale } from './peinture.js';

const DT = 1 / 60;
const toileJeu = /** @type {HTMLCanvasElement} */ (document.getElementById('toile'));
const ctx = /** @type {CanvasRenderingContext2D} */ (toileJeu.getContext('2d'));
ctx.imageSmoothingEnabled = false;
preparer();

// le chat noir des fausses alertes
const CHAT = peindre(20, 14, (i, j) => {
  const corps = ((i - 9) / 7) ** 2 + ((j - 8) / 4) ** 2 <= 1, tete = ((i - 16) / 3.6) ** 2 + ((j - 5) / 3.4) ** 2 <= 1;
  const oreille = (j >= 0 && j <= 2 && (i === 14 || i === 18 || (j === 2 && (i === 15 || i === 17))));
  const queue = (i <= 3 && j >= 2 && j <= 8 && Math.abs(i - (1 + (8 - j) * 0.3)) < 1.2);
  const pattes = j >= 11 && j <= 13 && (i === 5 || i === 7 || i === 12 || i === 14);
  if (tete && j === 5 && (i === 15 || i === 18)) return 'metal';
  return corps || tete || oreille || queue || pattes ? 'chapeau' : null;
});

const SALLES = [SALON, CUISINE];
const FONDS = SALLES.map((s) => s.peindre());

// Le déroulé de chaque salle : [seconde, action, ...]. « attendre » met le déroulé en
// pause tant qu'un fantôme est là.
const SCRIPTS = [
  [
    [1.2, 'consigne', 'VISE UN FANTÔME ET GARDE LE DOIGT', 4],
    [2, 'sort', 'goule', 'armoire'],
    [5, 'sort', 'goule', 'fenetre'],
    [6.5, 'consigne', 'SURVEILLE LES CACHETTES !', 3],
    [8, 'sort', 'drap', 'cheminee'],
    [11, 'chat', 'armoire'],
    [14, 'sort', 'goule', 'miroir'], [14.6, 'sort', 'goule', 'fenetre'],
    [18, 'sort', 'crane', 'cheminee'],
    [22, 'bou'],
    [25, 'sort', 'goule', 'armoire', 1], [25.3, 'sort', 'goule', 'cheminee', 1], [25.8, 'sort', 'drap', 'miroir', 1],
    [26.4, 'consigne', 'TIRE SUR LE LUSTRE !', 3.5],
    [31, 'sort', 'goule', 'fenetre'], [31.5, 'sort', 'crane', 'miroir'],
    [35, 'sort', 'goule', 'cheminee'], [35.4, 'sort', 'goule', 'armoire'], [35.8, 'sort', 'drap', 'fenetre'],
    [36, 'attendre'],
  ],
  [
    [1.5, 'sort', 'goule', 'vaisselier'],
    [4, 'sort', 'drap', 'marmite'],
    [7, 'sort', 'goule', 'four', 2], [7.5, 'consigne', 'FAIS TOMBER LES CASSEROLES !', 3.5],
    [10.5, 'sort', 'crane', 'fenetre'],
    [14, 'chat', 'vaisselier'],
    [16, 'sort', 'goule', 'four', 2], [16.4, 'sort', 'goule', 'vaisselier', 2],
    [20, 'bou'],
    [23, 'sort', 'drap', 'marmite'], [23.5, 'sort', 'crane', 'fenetre'],
    [27, 'sort', 'goule', 'vaisselier'], [27.4, 'sort', 'goule', 'four'], [27.8, 'sort', 'drap', 'marmite'],
    [28, 'attendre'],
    [29, 'boss'],
    [30, 'attendre'],
  ],
];

const ESP = {
  goule: { pv: 1.2, pieces: 3, croit: 0.3 },
  drap: { pv: 0.9, pieces: 3, croit: 0.4 },
  crane: { pv: 1.0, pieces: 4, croit: 0.45 },
  ecto: { pv: 0.12, pieces: 1, tir: true },
  assiette: { pv: 0.12, pieces: 1, tir: true },
  majordome: { pv: 7, pieces: 30, boss: true },
  chat: { pv: 99, pieces: 0 },
};
const FRAPPE = 2.4;
const RAY = { puissance: 1.6, chauffe: 0.27, refroidit: 0.55, reprise: 0.33 };

/** @type {any} */ let p = null;
let ecran = 'titre', tEcran = 0, tps = 0;
const visee = { x: 160, y: 90 }, doigt = { bas: false, tactile: false };
const essais = { bot: false, enfant: false, invincible: false };
let reflexe = 0, viseBot = null;

function etatSalle(Sl) {
  const z = () => Object.fromEntries(Object.keys(Sl.cachettes).map((k) => [k, 0]));
  return { alerte: z(), ouvert: z(), objets: Object.fromEntries(Sl.objets.map((o) => [o.id, { ...o, charge: 0 }])) };
}
function nouvellePartie() {
  p = { coeurs: 5, pieces: 0, captures: 0, vus: 0, t: 0, chauffe: 0, surchauffe: false, tenu: null, parts: [], textes: [], baves: [], secousse: 0, consigne: null, duree: 0 };
  entrerSalle(0);
}
function entrerSalle(n) {
  p.salle = n; p.ts = 0; p.ents = []; p.attente = []; p.script = SCRIPTS[n].map((x) => x.slice()); p.s = etatSalle(SALLES[n]); p.boss = null; p.nettoyee = 0;
  p.titre = 2;
}

// ——— la partie ———
function pas() {
  p.t += DT; p.ts += DT; p.duree += DT;
  const Sl = SALLES[p.salle], st = p.s;
  for (const k in st.alerte) st.alerte[k] = Math.max(0, st.alerte[k] - DT);
  for (const k in st.ouvert) st.ouvert[k] = Math.max(0, st.ouvert[k] - DT * 0.7);
  if (p.titre > 0) p.titre -= DT;
  if (p.consigne) { p.consigne.t -= DT; if (p.consigne.t <= 0) p.consigne = null; }

  // le déroulé
  while (p.script.length && p.ts >= p.script[0][0]) {
    const [, quoi, a, b, c] = p.script[0];
    if (quoi === 'attendre') { if (p.ents.some((e) => e.hostile) || p.attente.length) { p.ts = p.script[0][0]; break; } p.script.shift(); continue; }
    p.script.shift();
    if (quoi === 'consigne') p.consigne = { texte: a, t: b };
    else if (quoi === 'sort') { st.alerte[b] = 0.8; p.attente.push({ t: 0.8, type: a, cachette: b, vise: c || 0 }); }
    else if (quoi === 'chat') { st.alerte[a] = 0.8; p.attente.push({ t: 0.8, type: 'chat', cachette: a }); }
    else if (quoi === 'bou') {
      const e = naitre('drap', 110 + Math.random() * 100, 92, 1.7); e.croit = 0.5; e.etat = 'vit';
      p.textes.push({ s: 'BOU !', x: e.x, y: 40, col: '#ffffff', t: 0, vie: 1, sc: 3 }); p.secousse = 0.35; bruitage('rire');
    } else if (quoi === 'boss') { st.alerte.four = 1.2; p.attente.push({ t: 1.2, type: 'majordome', cachette: 'four' }); }
  }
  for (const a of p.attente) {
    a.t -= DT;
    if (a.t > 0) continue;
    const c = Sl.cachettes[a.cachette];
    st.ouvert[a.cachette] = 1;
    const e = naitre(a.type, c.x, c.y, c.s * 0.4);
    e.cible = c.s; e.vise = a.vise;
    if (a.type === 'majordome') { p.boss = e; e.cible = 1.25; p.textes.push({ s: 'LE MAJORDOME !', x: 160, y: 40, col: '#ff8ad0', t: 0, vie: 1.6, sc: 2 }); p.consigne = { texte: 'CASSE SES ASSIETTES !', t: 3 }; bruitage('boss'); }
    else if (a.type === 'chat') bruitage('pop');
    else bruitage('pouf');
  }
  p.attente = p.attente.filter((a) => a.t > 0);

  for (const e of p.ents) bouger(e);
  objets();
  rayonDuJeu();
  p.ents = p.ents.filter((e) => !e.mort);

  // la salle est nettoyée : on passe à la suivante
  if (!p.script.length && !p.attente.length && !p.ents.some((e) => e.hostile || e.type === 'chat')) {
    if (!p.nettoyee) { p.nettoyee = 1.6; p.textes.push({ s: p.salle === 0 ? 'SALLE NETTOYÉE !' : 'LE MANOIR EST PROPRE !', x: 160, y: 60, col: '#fff27a', t: 0, vie: 1.6, sc: 2 }); bruitage('victoire'); }
    p.nettoyee -= DT;
    if (p.nettoyee <= 0) { if (p.salle + 1 < SALLES.length) { ecran = 'passage'; tEcran = 0; } else { ecran = 'bilan'; tEcran = 0; rayon(false); } }
  }
  for (const q of p.parts) { q.t += DT; if (q.piece && q.t > 0.35) { q.x += (300 - q.x) * 0.16; q.y += (9 - q.y) * 0.16; } else { q.x += q.vx * DT; q.y += q.vy * DT; q.vy += 160 * DT; } }
  p.parts = p.parts.filter((q) => q.t < q.vie);
  for (const t of p.textes) t.t += DT;
  p.textes = p.textes.filter((t) => t.t < t.vie);
  for (const b of p.baves) b.t += DT;
  p.baves = p.baves.filter((b) => b.t < 3.5);
  p.secousse = Math.max(0, p.secousse - DT);
}

function naitre(type, x, y, s) {
  const d = ESP[type];
  const e = { type, x, y, s, t: 0, pv: d.pv, pv0: d.pv, etat: 'sort', hostile: type !== 'chat', tir: !!d.tir, croit: d.croit || 0, ph: Math.random() * 6, tx: 70 + Math.random() * 180, ty: 96 + Math.random() * 14, tTir: 1.8, tirs: 0, mort: false };
  if (!e.tir && e.hostile && type !== 'majordome') p.vus++;
  p.ents.push(e);
  return e;
}

function bouger(e) {
  e.t += DT;
  if (e.etat === 'cap') { e.tc += DT; if (e.tc > 0.45) e.mort = true; return; }
  if (e.etat === 'sort') { e.s += (e.cible - e.s) * 0.12; if (Math.abs(e.s - e.cible) < 0.03 || e.t > 0.6) e.etat = 'vit'; if (e.type !== 'chat') return; }
  if (e.type === 'chat') {
    const dir = e.x < 160 ? -1 : 1;
    e.x += dir * (e.feule ? 260 : 120) * DT; e.y += (150 - e.y) * 0.08; e.s = 1.2;
    if (e.x < -30 || e.x > 350) e.mort = true;
    return;
  }
  if (e.tir) {
    e.k = Math.min(1, e.k + DT / e.dur);
    e.x = e.x0 + (e.tx - e.x0) * e.k; e.y = e.y0 + (e.ty - e.y0) * e.k; e.s = 0.35 + 1.75 * e.k;
    if (e.k >= 1) frapper(e);
    return;
  }
  const tenu = p.tenu === e;
  if (e.type === 'majordome') {
    e.x = 160 + Math.sin(e.t * (tenu ? 0.3 : 0.7)) * 50; e.y = 66 + Math.sin(e.t * 2) * 3;
    e.tTir -= DT;
    if (e.tTir <= 0) { tirer(e, 'assiette', 1.7); e.tTir = e.pv < e.pv0 / 2 ? 1.6 : 2.1; }
    if (!e.renforts && e.pv < e.pv0 / 2) { e.renforts = true; for (const c of ['vaisselier', 'marmite']) { p.s.alerte[c] = 0.8; p.attente.push({ t: 0.8, type: 'goule', cachette: c }); } }
    return;
  }
  if (e.type === 'crane' && e.tirs < 3) {
    e.x += (e.tx - e.x) * 0.01; e.y = 58 + Math.sin(e.t * 2) * 5; e.s += (0.85 - e.s) * 0.05;
    e.tTir -= DT;
    if (e.tTir <= 0) { tirer(e, 'ecto', 1.5); e.tirs++; e.tTir = 2.4; }
    return;
  }
  // la cible : au centre pour les vagues du lustre (1) ou des casseroles (2)
  if (e.vise === 1 && !e.vu) { e.tx = 130 + Math.random() * 60; e.vu = 1; }
  if (e.vise === 2 && !e.vu) { e.tx = [121, 160, 199][(Math.random() * 3) | 0]; e.vu = 1; }
  if (!tenu) e.s += e.croit * DT * (e.type === 'drap' && !e.vise ? 1 : 1);
  else e.s = Math.max(0.5, e.s - 0.05 * DT);
  const zig = e.type === 'drap' ? Math.sin(e.t * 3 + e.ph) * 30 : Math.sin(e.t * 1.3 + e.ph) * 10;
  e.x += (e.tx + zig - e.x) * (tenu ? 0.005 : 0.025);
  e.y += (e.ty - 22 + e.s * 10 - e.y) * 0.03 + Math.sin(e.t * 4 + e.ph) * 0.15;
  if (e.s >= FRAPPE) frapper(e);
}

function tirer(src, type, dur) {
  const e = naitre(type, src.x, src.y + 4, 0.35);
  e.etat = 'vit'; e.x0 = e.x; e.y0 = e.y; e.k = 0; e.dur = dur;
  e.tx = 90 + Math.random() * 140; e.ty = 80 + Math.random() * 40;
  bruitage(type === 'assiette' ? 'assiette' : 'crache');
}

function frapper(e) {
  e.mort = true;
  if (p.tenu === e) p.tenu = null;
  if (essais.invincible) return;
  p.coeurs--;
  p.baves.push({ x: e.x, y: Math.min(140, e.y), r: e.tir ? 12 : 18, t: 0, gouttes: [0, 1, 2, 3].map(() => ({ dx: (Math.random() - 0.5) * 30, v: 10 + Math.random() * 14 })) });
  p.secousse = 0.3; bruitage('coup');
  if (p.coeurs <= 0) { ecran = 'defaite'; tEcran = 0; rayon(false); bruitage('defaite'); }
}

function boite(e) {
  const sp = sprite(e), w = sp.width * e.s, h = sp.height * e.s;
  return { x: e.x - w / 2, y: e.y - h / 2, w, h };
}
function sprite(e) {
  switch (e.type) {
    case 'goule': return p.tenu === e ? S.gouleTenue : (((e.t * 5) | 0) & 1 ? S.goule1 : S.goule0);
    case 'chat': return CHAT;
    default: return S[e.type];
  }
}
const dedans = (b, x, y, m = 0) => x >= b.x - m && x <= b.x + b.w + m && y >= b.y - m && y <= b.y + b.h + m;

function rayonDuJeu() {
  const tire = doigt.bas && !p.surchauffe;
  if (doigt.bas && !p.surchauffe) { p.chauffe += RAY.chauffe * DT; if (p.chauffe >= 1) { p.chauffe = 1; p.surchauffe = true; p.tenu = null; bruitage('surchauffe'); p.textes.push({ s: 'SURCHAUFFE !', x: 160, y: 150, col: '#ff5a3a', t: 0, vie: 1.2 }); } }
  else { p.chauffe = Math.max(0, p.chauffe - RAY.refroidit * DT); if (p.surchauffe && p.chauffe <= RAY.reprise) p.surchauffe = false; }
  rayon(tire);
  p.tire = tire;
  for (const o of Object.values(p.s.objets)) if (o !== p.vise) o.charge = Math.max(0, o.charge - DT);
  p.vise = null;
  if (!tire) { p.tenu = null; return; }
  // le fantôme tenu reste tenu tant que le viseur ne le quitte pas, sauf si quelque chose passe devant
  const vivants = p.ents.filter((e) => e.etat !== 'cap' && e.etat !== 'sort' || e.type === 'chat').sort((a, b) => b.s - a.s);
  let cible = vivants.find((e) => dedans(boite(e), visee.x, visee.y));
  if (p.tenu && !p.tenu.mort && p.tenu.etat === 'vit' && dedans(boite(p.tenu), visee.x, visee.y, 6) && (!cible || cible.s <= p.tenu.s)) cible = p.tenu;
  if (cible) {
    p.tenu = cible;
    if (cible.type === 'chat') { if (!cible.feule) { cible.feule = true; p.textes.push({ s: 'PFFF !', x: cible.x, y: cible.y - 16, col: '#ffffff', t: 0, vie: 1 }); bruitage('triste'); } return; }
    cible.pv -= RAY.puissance * DT;
    if (cible.pv <= 0) capturer(cible, 1);
    return;
  }
  p.tenu = null;
  for (const o of Object.values(p.s.objets)) {
    if (o.fait || o.chute) continue;
    if (visee.x >= o.x && visee.x <= o.x + o.w && visee.y >= o.y && visee.y <= o.y + o.h) { p.vise = o; o.charge += DT * 2; if (o.charge >= o.besoin) declencher(o); break; }
  }
}

function capturer(e, mult) {
  e.etat = 'cap'; e.tc = 0; if (p.tenu === e) p.tenu = null;
  const n = ESP[e.type].pieces * mult;
  p.pieces += n; if (!e.tir && e.type !== 'majordome') p.captures++;
  for (let k = 0; k < Math.min(12, n + 2); k++) p.parts.push({ x: e.x, y: e.y, vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 80, t: 0, vie: 1.1, piece: k < n });
  p.textes.push({ s: '+' + n, x: e.x, y: e.y - 14, col: '#fff27a', t: 0, vie: 0.9 });
  bruitage(e.tir ? 'assiette' : 'capture');
  if (e.type === 'majordome') { for (const f of p.ents) if (f !== e && (f.tir || f.hostile)) capturer(f, 1); }
}

function declencher(o) {
  o.fait = true;
  if (o.id === 'lustre' || o.id.startsWith('casserole')) { o.chute = 0.001; bruitage('clac'); return; }
  const n = o.id === 'bocal' ? 8 : 6;
  p.pieces += n; bruitage('brise');
  for (let k = 0; k < n + 6; k++) p.parts.push({ x: o.x + o.w / 2, y: o.y + o.h / 2, vx: (Math.random() - 0.5) * 140, vy: -40 - Math.random() * 90, t: 0, vie: 1.2, piece: k < n, col: k >= n ? '#8ab8ff' : null });
  p.textes.push({ s: '+' + n, x: o.x + o.w / 2, y: o.y - 6, col: '#fff27a', t: 0, vie: 1 });
}

// Ce qui tombe : le lustre écrase le milieu de la pièce, une casserole ce qui est sous elle
function objets() {
  for (const o of Object.values(p.s.objets)) {
    if (!o.chute || o.fini) continue;
    o.chute += DT * 1.7;
    if (o.id === 'lustre') {
      const y = 10 + o.chute * o.chute * 150;
      if (y > 100) {
        o.fini = true; p.secousse = 0.4; bruitage('coup');
        let n = 0;
        for (const e of p.ents) if (e.hostile && !e.tir && e.etat === 'vit' && e.type !== 'majordome' && Math.abs(e.x - 160) < 60) { capturer(e, 2); n++; }
        p.textes.push({ s: n ? `BOUM ! ${n} D'UN COUP` : 'BOUM !', x: 160, y: 70, col: '#ff8ad0', t: 0, vie: 1.6, sc: n ? 1 : 2 });
        for (let k = 0; k < 20; k++) p.parts.push({ x: 160 + (Math.random() - 0.5) * 30, y: 100, vx: (Math.random() - 0.5) * 220, vy: -30 - Math.random() * 120, t: 0, vie: 1, col: k & 1 ? '#ffe890' : '#fff2a0' });
      }
    } else {
      const k = +o.id.slice(-1), x = 121 + k * 39, y = 22 + o.chute * o.chute * 150 + 6;
      const sous = p.ents.find((e) => e.hostile && !e.tir && e.etat === 'vit' && e.type !== 'majordome' && Math.abs(e.x - x) < boite(e).w / 2 + 6 && y >= boite(e).y);
      if (sous) { o.fini = true; capturer(sous, 2); p.textes.push({ s: 'CLANG !', x, y: y - 12, col: '#ffb07a', t: 0, vie: 1.2 }); bruitage('clac'); }
      else if (y > 150) { o.fini = true; p.textes.push({ s: 'CLANG', x, y: 140, col: '#c8b8e0', t: 0, vie: 0.8 }); bruitage('clac'); }
    }
  }
}

// ——— le robot des essais ———
function robot() {
  if (!p) return;
  const vivants = p.ents.filter((e) => e.etat === 'vit' && e.type !== 'chat');
  let cible = null;
  const tirs = vivants.filter((e) => e.tir).sort((a, b) => b.k - a.k);
  if (tirs.length && tirs[0].k > 0.25) cible = { x: tirs[0].x, y: tirs[0].y };
  const ob = p.s.objets;
  if (!cible && ob.lustre && !ob.lustre.fait && vivants.filter((e) => !e.tir && Math.abs(e.x - 160) < 50 && e.s > 0.9).length >= 2) cible = { x: 160, y: 24 };
  if (!cible) for (let k = 0; k < 3; k++) { const o = ob['casserole' + k]; if (o && !o.fait && vivants.some((e) => !e.tir && Math.abs(e.x - (121 + k * 39)) < 10 && e.s > 1)) cible = { x: 121 + k * 39, y: 27 }; }
  if (!cible) { const g = vivants.filter((e) => !e.tir).sort((a, b) => b.s - a.s)[0]; if (g) cible = { x: g.x, y: g.y + 2 }; }
  if (!cible && p.ts > 8) for (const id of ['vase', 'bocal']) { const o = ob[id]; if (o && !o.fait) cible = { x: o.x + o.w / 2, y: o.y + o.h / 2 }; }
  // l'enfant : il ne pense pas au décor, il réagit avec un temps de retard et vise moins vite
  if (essais.enfant) {
    const g = vivants.filter((e) => !e.tir || e.k > 0.45).sort((a, b) => (b.tir ? 3 : b.s) - (a.tir ? 3 : a.s))[0];
    reflexe -= DT;
    if (reflexe <= 0) { viseBot = g ? { x: g.x + (Math.random() - 0.5) * 8, y: g.y + (Math.random() - 0.5) * 8, e: g } : null; reflexe = 0.35 + Math.random() * 0.3; }
    if (viseBot && viseBot.e && !viseBot.e.mort && viseBot.e.etat === 'vit') { viseBot.x += (viseBot.e.x - viseBot.x) * 0.05; viseBot.y += (viseBot.e.y - viseBot.y) * 0.05; }
    cible = viseBot;
  }
  if (!cible) { doigt.bas = false; return; }
  const dx = cible.x - visee.x, dy = cible.y - visee.y, d = Math.hypot(dx, dy), v = (essais.enfant ? 230 : 420) * DT;
  if (d > v) { visee.x += dx / d * v; visee.y += dy / d * v; } else { visee.x = cible.x; visee.y = cible.y; }
  doigt.bas = d < 14 && !(p.chauffe > 0.85 && !tirs.length);
}

// ——— le dessin ———
function dessiner() {
  ctx.fillStyle = NOIR; ctx.fillRect(0, 0, W, H);
  if (ecran === 'titre') return titre();
  if (ecran === 'passage') return passage();
  const sx = p.secousse > 0 ? Math.round((Math.random() - 0.5) * 6 * p.secousse / 0.3) : 0, sy = p.secousse > 0 ? Math.round((Math.random() - 0.5) * 4) : 0;
  ctx.save(); ctx.translate(sx, sy);
  ctx.drawImage(FONDS[p.salle], 0, 0);
  SALLES[p.salle].animer(ctx, p.s, p.t);
  alertes();
  for (const e of [...p.ents].sort((a, b) => a.s - b.s)) entite(e);
  ctx.restore();
  rayonDessin();
  for (const q of p.parts) {
    if (q.piece) ctx.drawImage(S.piece, Math.round(q.x - 4), Math.round(q.y - 4));
    else R(ctx, q.col || '#fff6c8', q.x, q.y, 2, 2);
  }
  baves();
  hud();
  if (ecran === 'bilan' || ecran === 'defaite') fin();
}

function entite(e) {
  const sp = sprite(e), b = boite(e);
  if (e.etat === 'cap') {
    const k = e.tc / 0.45, x = e.x + (160 - e.x) * k * k, y = e.y + (200 - e.y) * k * k, s = e.s * (1 - k * 0.8);
    ctx.globalAlpha = 1 - k * 0.5;
    ctx.drawImage(((e.tc * 20) | 0) & 1 ? BLANC[e.type === 'goule' ? 'gouleTenue' : e.type] || sp : sp, Math.round(x - sp.width * s / 2), Math.round(y - sp.height * s / 2), Math.round(sp.width * s), Math.round(sp.height * s));
    ctx.globalAlpha = 1; return;
  }
  // une ombre sous ceux qui flottent, pour dire où ils sont dans la pièce
  if (!e.tir && e.type !== 'chat') { ctx.globalAlpha = 0.35; ovale(ctx, e.x, Math.min(176, 118 + (e.s - 0.5) * 30), b.w * 0.3, 2 + e.s, NOIR); ctx.globalAlpha = 1; }
  ctx.globalAlpha = e.etat === 'sort' ? 0.6 : 1;
  const tenu = p.tenu === e && p.tire, tr = tenu ? (((p.t * 30) | 0) & 1 ? 1 : -1) : 0;
  ctx.drawImage(tenu && ((p.t * 16) | 0) % 3 === 0 && BLANC[e.type] ? BLANC[e.type] : sp, Math.round(b.x + tr), Math.round(b.y), Math.round(b.w), Math.round(b.h));
  ctx.globalAlpha = 1;
  // la vie d'un fantôme qu'on aspire
  if (e.hostile && !e.tir && e.pv < e.pv0 && e.type !== 'majordome') {
    const bw = Math.max(12, Math.round(b.w * 0.6)), bx = Math.round(e.x - bw / 2), by = Math.round(b.y - 5);
    R(ctx, NOIR, bx - 1, by - 1, bw + 2, 4); R(ctx, '#6ee03a', bx, by, Math.round(bw * e.pv / e.pv0), 2);
  }
  // un tir qui arrive se signale par un anneau rouge
  if (e.tir && e.k > 0.5) { ctx.strokeStyle = (((p.t * 10) | 0) & 1) ? '#ff3030' : '#ffffff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(e.x, e.y, b.w * 0.7, 0, Math.PI * 2); ctx.stroke(); }
}

// une cachette qui va s'ouvrir : un halo et un « ! » qui rebondit au-dessus
function alertes() {
  const Sl = SALLES[p.salle];
  for (const [k, v] of Object.entries(p.s.alerte)) {
    if (v <= 0) continue;
    const c = Sl.cachettes[k], r = 14 + (1 - v) * 8;
    ctx.globalAlpha = 0.5 + 0.4 * Math.sin(p.t * 20);
    ctx.strokeStyle = '#fff27a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    ecrire(ctx, '!', c.x, c.y - r - 14 - Math.abs(Math.sin(p.t * 9)) * 4, { centre: true, sc: 2, coul: '#fff27a', contour: NOIR });
  }
}

function rayonDessin() {
  if (!p.tire) return;
  const x0 = 160, y0 = 196, x1 = visee.x, y1 = visee.y, n = 9;
  const pts = [[x0, y0]];
  for (let k = 1; k < n; k++) { const f = k / n; pts.push([x0 + (x1 - x0) * f + (Math.random() - 0.5) * 8, y0 + (y1 - y0) * f + (Math.random() - 0.5) * 8]); }
  pts.push([x1, y1]);
  for (const [col, l, dx] of [['#ff3fa4', 3, -2], ['#3fe8ff', 3, 2], ['#ffffff', 2, 0]]) {
    ctx.strokeStyle = col; ctx.lineWidth = l; ctx.beginPath(); ctx.moveTo(pts[0][0] + dx, pts[0][1]);
    for (const [x, y] of pts) ctx.lineTo(x + dx, y); ctx.stroke();
  }
  ovale(ctx, x1, y1, 4, 4, '#ffffff');
}

function viseur() {
  const x = Math.round(visee.x), y = Math.round(visee.y);
  const col = p && p.surchauffe ? '#ff5a3a' : p && p.tenu ? (p.tenu.type === 'chat' ? '#ff8aa0' : '#ff3030') : '#ffffff';
  const seg = (c, o) => { R(ctx, c, x - 8 - o, y - o, 5 + 2 * o, 1 + 2 * o); R(ctx, c, x + 4 - o, y - o, 5 + 2 * o, 1 + 2 * o); R(ctx, c, x - o, y - 8 - o, 1 + 2 * o, 5 + 2 * o); R(ctx, c, x - o, y + 4 - o, 1 + 2 * o, 5 + 2 * o); };
  seg(NOIR, 1); seg(col, 0);
}

function baves() {
  for (const b of p.baves) {
    const a = b.t < 2.5 ? 1 : 1 - (b.t - 2.5); ctx.globalAlpha = Math.max(0, a) * 0.92;
    ovale(ctx, b.x, b.y, b.r + 1, b.r * 0.8 + 1, '#2c9a2a'); ovale(ctx, b.x, b.y, b.r, b.r * 0.8, '#6ee03a'); ovale(ctx, b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.35, b.r * 0.25, '#c8ff5a');
    for (const g of b.gouttes) { const l = Math.min(40, b.t * g.v); R(ctx, '#6ee03a', b.x + g.dx * 0.5, b.y, 3, l); ovale(ctx, b.x + g.dx * 0.5 + 1, b.y + l, 2.5, 3, '#6ee03a'); }
    ctx.globalAlpha = 1;
  }
}

function hud() {
  for (let k = 0; k < 5; k++) coeur(ctx, 4 + k * 11, 4, k < p.coeurs);
  ctx.drawImage(S.piece, 277, 5);
  ecrire(ctx, String(p.pieces).padStart(4, '0'), 316, 5, { droite: true, coul: '#fff27a', contour: NOIR, gras: true });
  // la chauffe, toute petite, là d'où part le rayon
  const c = p.chauffe, clig = c > 0.75 && ((p.t * 6) | 0) & 1;
  R(ctx, NOIR, 135, 171, 50, 7); R(ctx, clig || p.surchauffe ? '#ff3030' : '#4a3a5a', 136, 172, 48, 5);
  R(ctx, c > 0.75 ? '#ff5a3a' : c > 0.5 ? '#ffd23a' : '#6ee03a', 137, 173, Math.round(46 * c), 3);
  if (p.boss && !p.boss.mort) {
    const bw = 120, bx = 100;
    ecrire(ctx, 'LE MAJORDOME', 160, 4, { centre: true, coul: '#ffffff', contour: NOIR });
    R(ctx, NOIR, bx - 1, 13, bw + 2, 6); R(ctx, '#b46cff', bx, 14, Math.round(bw * Math.max(0, p.boss.pv) / p.boss.pv0), 4);
  }
  if (p.titre > 0) ecrire(ctx, SALLES[p.salle].nom, 160, 40, { centre: true, sc: 2, coul: '#ffffff', contour: NOIR, alpha: Math.min(1, p.titre * 2) });
  else if (p.consigne) ecrire(ctx, p.consigne.texte.replace('GARDE LE DOIGT', doigt.tactile ? 'GARDE LE DOIGT' : 'GARDE LE CLIC'), 160, p.boss ? 24 : 22, { centre: true, coul: '#fff27a', contour: NOIR, gras: true });
  for (const t of p.textes) ecrire(ctx, t.s, t.x, t.y - t.t * 14, { centre: true, sc: t.sc || 1, coul: t.col, contour: NOIR, gras: !t.sc, alpha: Math.min(1, (t.vie - t.t) * 3) });
  if (ecran === 'jeu') viseur();
}

function titre() {
  ctx.drawImage(FONDS[0], 0, 0);
  ctx.globalAlpha = 0.55; R(ctx, NOIR, 0, 0, W, H); ctx.globalAlpha = 1;
  ecrire(ctx, 'GHOST', 160, 34, { centre: true, sc: 3, coul: '#6ee03a', contour: NOIR, ombre: '#2c9a2a', ombreD: 2 });
  ecrire(ctx, 'ESSAI : LES SALLES', 160, 66, { centre: true, coul: '#ffffff', contour: NOIR, gras: true });
  ecrire(ctx, 'LE SALON PUIS LA CUISINE', 160, 84, { centre: true, coul: '#c8b8e0', contour: NOIR });
  ecrire(ctx, 'LES FANTÔMES SORTENT DES CACHETTES :', 160, 104, { centre: true, coul: '#c8b8e0', contour: NOIR });
  ecrire(ctx, 'ARMOIRE, CHEMINÉE, FENÊTRE...', 160, 114, { centre: true, coul: '#c8b8e0', contour: NOIR });
  if (((tps * 2) | 0) & 1) ecrire(ctx, 'TOUCHE POUR COMMENCER', 160, 146, { centre: true, coul: '#fff27a', contour: NOIR, gras: true });
}

function passage() {
  const k = Math.min(1, tEcran / 1.3), e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2, dx = Math.round(e * (W + 16));
  ctx.save(); ctx.translate(-dx, 0); ctx.drawImage(FONDS[0], 0, 0); SALLES[0].animer(ctx, p.s, p.t + tEcran); ctx.restore();
  R(ctx, '#3a1e12', W - dx, 0, 16, H); R(ctx, NOIR, W - dx + 7, 0, 2, H);
  if (!p.suivante) p.suivante = etatSalle(SALLES[1]);
  ctx.save(); ctx.translate(W + 16 - dx, 0); ctx.drawImage(FONDS[1], 0, 0); SALLES[1].animer(ctx, p.suivante, p.t + tEcran); ctx.restore();
}

function fin() {
  ctx.globalAlpha = 0.7; R(ctx, NOIR, 40, 30, 240, 120); ctx.globalAlpha = 1;
  const ok = ecran === 'bilan';
  ecrire(ctx, ok ? 'BRAVO !' : 'LES FANTÔMES ONT GAGNÉ', 160, 40, { centre: true, sc: ok ? 2 : 1, coul: ok ? '#6ee03a' : '#ff5a3a', contour: NOIR, gras: !ok });
  const lignes = [['FANTÔMES', `${p.captures} / ${p.vus}`], ['PIÈCES', String(p.pieces)], ['CŒURS', `${Math.max(0, p.coeurs)} / 5`], ['TEMPS', `${Math.round(p.duree)} S`]];
  lignes.forEach(([a, b], k) => { ecrire(ctx, a, 70, 66 + k * 14, { coul: '#c8b8e0', contour: NOIR }); ecrire(ctx, b, 250, 66 + k * 14, { droite: true, coul: '#ffffff', contour: NOIR, gras: true }); });
  if (tEcran > 1 && ((tps * 2) | 0) & 1) ecrire(ctx, 'TOUCHE POUR REJOUER', 160, 128, { centre: true, coul: '#fff27a', contour: NOIR, gras: true });
}

// ——— la boucle ———
let reste = 0, avant = performance.now();
function image(maintenant) {
  requestAnimationFrame(image);
  reste += Math.min(0.1, (maintenant - avant) / 1000); avant = maintenant;
  while (reste >= DT) {
    reste -= DT; tps += DT; tEcran += DT;
    if (ecran === 'jeu') { if (essais.bot) robot(); pas(); }
    else if (ecran === 'passage') { if (tEcran >= 1.3) { entrerSalle(1); ecran = 'jeu'; } }
    else if (ecran === 'bilan' || ecran === 'defaite') { if (p) { for (const q of p.parts) q.t += DT; } }
  }
  dessiner();
}
requestAnimationFrame(image);

// ——— les entrées : le doigt vise un peu au-dessus de lui ———
const ECART = 22;
function placer(ev) {
  const r = toileJeu.getBoundingClientRect();
  const x = (ev.clientX - r.left) / r.width * W, y = (ev.clientY - r.top) / r.height * H;
  doigt.tactile = ev.pointerType === 'touch' || ev.pointerType === 'pen';
  visee.x = Math.max(0, Math.min(W, x)); visee.y = Math.max(0, Math.min(H, y - (doigt.tactile ? ECART : 0)));
}
toileJeu.addEventListener('pointerdown', (ev) => {
  ev.preventDefault(); demarrer();
  if (ecran === 'titre') { nouvellePartie(); ecran = 'jeu'; tEcran = 0; jouerMusique(true, 124, 'manoir'); return; }
  if ((ecran === 'bilan' || ecran === 'defaite') && tEcran > 1) { nouvellePartie(); ecran = 'jeu'; tEcran = 0; return; }
  toileJeu.setPointerCapture(ev.pointerId); placer(ev); doigt.bas = true;
});
toileJeu.addEventListener('pointermove', (ev) => { if (doigt.bas || ev.pointerType === 'mouse') placer(ev); });
for (const t of ['pointerup', 'pointercancel']) toileJeu.addEventListener(t, () => { doigt.bas = false; });
toileJeu.addEventListener('contextmenu', (ev) => ev.preventDefault());
document.addEventListener('visibilitychange', () => { if (document.hidden) { doigt.bas = false; rayon(false); } });

// Crochets des essais (robot, captures)
/** @type {any} */ (window).__salles = {
  essais,
  etat: () => ({ ecran, salle: p && p.salle, ts: p && p.ts, coeurs: p && p.coeurs, captures: p && p.captures, vus: p && p.vus, pieces: p && p.pieces, ents: p ? p.ents.map((e) => e.type + ':' + e.etat) : [], objets: p ? Object.fromEntries(Object.entries(p.s.objets).map(([k, o]) => [k, !!o.fait])) : {}, boss: !!(p && p.boss && !p.boss.mort), alerte: p ? Object.entries(p.s.alerte).filter(([, v]) => v > 0).map(([k]) => k) : [] }),
  lancer: () => { demarrer(); nouvellePartie(); ecran = 'jeu'; tEcran = 0; },
  viser: (x, y, bas) => { visee.x = x; visee.y = y; doigt.bas = bas; },
};
