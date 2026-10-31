// Maquette Ghostel : le piège qui avale, la chauffe sous le doigt, le boss pêché au
// rayon, et la torche (deux façons de la tenir, pour comparer au doigt).
// Elle emprunte au vrai jeu la salle à manger, les sprites et la police, rien d'autre :
// les règles ci-dessous sont celles qu'on essaie.
import { MANGER } from 'gt/ecran/manger.js';
import { S, BLANC, preparer, coeur } from 'gt/ecran/dessins.js';
import { ecrire } from 'gt/ecran/police.js';
import { R, ovale, NOIR, toile } from 'gt/ecran/peinture.js';
import { SALLES } from 'gt/contenu/salles.js';

const W = 320, H = 180, DT = 1 / 60, ECART = 22;
// la chauffe du vrai jeu ; ce qui change : surchauffer fait LÂCHER le fantôme tenu
const RAYON = { puissance: 1.6, chauffe: 0.27, refroidit: 0.55, reprise: 0.33 };
// la pêche, façon Stardew Valley : UNE seule chose à faire, garder le doigt dans le cercle vert.
// Il se tient à l'opposé du boss (on tire contre lui, comme Luigi) ; quand le boss prend son élan
// il glisse de SON côté (on lui donne du mou, comme une canne) : ne pas suivre, c'est chauffer
// très vite et casser la ligne. Par seconde ; à chaque ligne cassée ses coups chauffent moins
// (`pitie`) et il repart moins loin (`fatigue` de la meilleure prise).
const PECHE = { tire: 0.16, tireChauffe: -0.12, horsChauffe: 0.25, horsRecul: 0.05, coupChauffe: 0.9, pitie: 0.6, fatigue: 0.4, coupDoux: 0.05, coupRecul: 0.1, lacheRecul: 0.08, coup: 0.8, annonce: 0.8, cercle: 15, ecart: 46 };
// l'aspiration finale (le mafuba de Dragon Ball) : tourbillon, il panique, s'agrippe, y passe
const ASPIRE = { choc: 0.5, lutte: 2.1, avale: 2.6, fin: 3.9, bonks: [2.95, 3.25, 3.5] };
const CENTRE = { x: 160, y: 104 };   // le cœur du tourbillon, au-dessus du piège
const TORCHE = { rayon: 26, use: 0.2, recharge: 0.16, reprise: 0.35, eblouit: 0.5, etourdi: 1.6 };
const PIEGE = { x: 160, y: 168 }, BOUCHE = { x: 160, y: 162 };
const BT = { x: 26, y: 150, r: 17 };              // le bouton TORCHE (pouce gauche)
const BMODE = { x: 236, y: 16, w: 82, h: 12 };     // changer de façon de tenir la torche
const LIBRE = 110;                                // en « pouce libre », la torche naît à gauche de cette ligne
const CACH = Object.values(SALLES.manger.cachettes);

const cv = /** @type {HTMLCanvasElement} */ (document.getElementById('toile'));
const ctx = /** @type {CanvasRenderingContext2D} */ (cv.getContext('2d'));
ctx.imageSmoothingEnabled = false;
preparer();
const fond = MANGER.peindre();
const nuit = toile();
const salle = { alerte: {}, objets: {}, ouvert: {}, fait: {} };

let mode = 'bouton';
/** @type {any} */ let J;
function nouvelle() {
  J = {
    t: 0, coeurs: 5, captures: 0, ents: [], chauffe: 0, surchauffe: false, tire: false, tenu: null,
    visee: { x: 160, y: 100 }, piegeOuvre: 0, piegeFlash: 0, boss: null, peche: null, fin: null, finT: 0,
    prochain: 1, textes: [], parts: [], bave: 0, secousse: 0, casses: 0, echappes: 0, surchauffes: 0,
    torche: { on: false, x: 160, y: 90, pile: 1, vide: false }, aide: 4,
  };
}
nouvelle();

// ---------- le son (Web Audio, rien à télécharger) ----------
const son = (() => {
  /** @type {AudioContext|null} */ let ac = null; let sif = null, gs = null;
  return {
    reveil() {
      if (ac) return;
      try {
        ac = new AudioContext(); sif = ac.createOscillator(); gs = ac.createGain();
        gs.gain.value = 0; sif.type = 'sine'; sif.connect(gs).connect(ac.destination); sif.start();
      } catch { ac = null; }
    },
    /** le sifflement de la chauffe, de plus en plus aigu et fort */
    chauffe(c, actif) {
      if (!ac) return;
      const g = actif && c > 0.5 ? (c - 0.5) * 0.14 : 0;
      gs.gain.setTargetAtTime(g, ac.currentTime, 0.04); sif.frequency.setTargetAtTime(500 + c * 1200, ac.currentTime, 0.04);
    },
    bip(f, d, type = 'square', v = 0.08, f2 = 0) {
      if (!ac) return;
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
      o.type = /** @type {OscillatorType} */ (type); o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d);
    },
  };
})();
const SONS = {
  clac: () => { son.bip(260, 0.1, 'square', 0.1, 90); setTimeout(() => son.bip(1400, 0.08, 'triangle', 0.06), 60); },
  surchauffe: () => son.bip(900, 0.35, 'sawtooth', 0.07, 200),
  casse: () => { son.bip(1200, 0.5, 'sawtooth', 0.09, 60); },
  coup: () => son.bip(110, 0.35, 'sawtooth', 0.09, 60),
  annonce: () => son.bip(330, 0.12, 'square', 0.05, 440),
  touche: () => son.bip(220, 0.3, 'triangle', 0.12, 50),
  sort: () => son.bip(180, 0.2, 'sine', 0.05, 360),
  tourbillon: () => { son.bip(70, 2.2, 'sawtooth', 0.07, 520); son.bip(140, 2.2, 'triangle', 0.05, 900); },
  cri: () => son.bip(700 + Math.random() * 300, 0.18, 'square', 0.04, 1300),
  bonk: () => son.bip(95, 0.16, 'square', 0.1, 45),
};
// la vibration du téléphone (Android) : ce qu'on SENT du fantôme qui se débat
const vibrer = (ms) => { if (window.__pilote) return; try { navigator.vibrate?.(ms); } catch { /* rien */ } };

// ---------- les doigts ----------
/** @type {Map<number, {role: string, x: number, y: number, souris: boolean}>} */
const doigts = new Map();
let toucheT = false;
const versJeu = (ev) => { const r = cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) * W / r.width, y: (ev.clientY - r.top) * H / r.height }; };
const dansR = (b, q) => q.x >= b.x && q.x <= b.x + b.w && q.y >= b.y && q.y <= b.y + b.h;
cv.addEventListener('contextmenu', (ev) => ev.preventDefault());
cv.addEventListener('pointerdown', (ev) => {
  ev.preventDefault(); son.reveil();
  const q = versJeu(ev);
  if (J.fin) { if (J.finT > 0.8) nouvelle(); return; }
  if (dansR(BMODE, q)) { mode = mode === 'bouton' ? 'libre' : 'bouton'; return; }
  let role = 'rayon';
  if (ev.pointerType === 'mouse') role = ev.button === 2 ? 'torche' : 'rayon';
  else if (mode === 'bouton' ? Math.hypot(q.x - BT.x, q.y - BT.y) < BT.r + 7 : q.x < LIBRE) role = 'torche';
  for (const d of doigts.values()) if (d.role === role) return;
  doigts.set(ev.pointerId, { role, x: q.x, y: q.y, souris: ev.pointerType === 'mouse' });
  try { cv.setPointerCapture(ev.pointerId); } catch { /* rien */ }
});
cv.addEventListener('pointermove', (ev) => { const d = doigts.get(ev.pointerId); if (!d) return; const q = versJeu(ev); d.x = q.x; d.y = q.y; });
const lever = (ev) => doigts.delete(ev.pointerId);
cv.addEventListener('pointerup', lever); cv.addEventListener('pointercancel', lever);
addEventListener('keydown', (ev) => { if (ev.key === 't' || ev.key === 'T') toucheT = true; });
addEventListener('keyup', (ev) => { if (ev.key === 't' || ev.key === 'T') toucheT = false; });

function entrees() {
  if (window.__pilote) return window.__pilote(J);
  let rayon = null, torche = null;
  for (const d of doigts.values()) {
    const p = { x: d.x, y: d.y - (d.souris ? 0 : ECART), suit: d.souris || mode === 'bouton' };
    if (d.role === 'rayon') rayon = p; else torche = p;
  }
  if (toucheT && !torche) torche = { x: 0, y: 0, suit: true };
  return { rayon, torche };
}

// ---------- la partie ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sprite = (e) => e.type === 'ecto' ? S[((J.t * 4 + e.ph) | 0) & 1 ? 'ecto1' : 'ecto0'] : e.type === 'ombre' ? S.ombre : e.type === 'boss' ? S.majordome : S.assiette;
const boite = (e) => { const sp = sprite(e), w = sp.width * e.s, h = sp.height * e.s; return { x: e.x - w / 2, y: e.y - h / 2, w, h }; };
const sous = (e, x, y, m) => { const b = boite(e); return x >= b.x - m && x <= b.x + b.w + m && y >= b.y - m && y <= b.y + b.h + m; };
const texte = (s, x, y, col, sc = 1, vie = 1.2) => J.textes.push({ s, x, y, col, sc, t: 0, vie });
const vivants = () => J.ents.filter((e) => e.etat === 'vit');

function sortir() {
  const libres = CACH.filter((c) => !J.ents.some((e) => e.c === c && e.etat === 'vit'));
  if (!libres.length) return;
  const c = libres[(Math.random() * libres.length) | 0];
  const ombre = J.captures >= 1 && Math.random() < 0.45;
  J.ents.push({ type: ombre ? 'ombre' : 'ecto', c, x: c.x, y: c.y, s: c.s, pv: ombre ? 1 : 1.2, pv0: ombre ? 1 : 1.2, etat: 'vit', revele: 0, lumiere: 0, etourdi: 0, ph: Math.random() * 6, croit: ombre ? 0.2 : 0.3 });
  SONS.sort();
}

function pas() {
  J.t += DT; J.aide = Math.max(0, J.aide - DT);
  vieillir();
  if (J.fin) { J.finT += DT; son.chauffe(0, false); return; }
  if (J.aspire) { aspirer(); son.chauffe(0, false); return; }
  const E = entrees();
  if (E.rayon) { J.visee.x = clamp(E.rayon.x, 0, W); J.visee.y = clamp(E.rayon.y, 0, H); }
  lumiere(E.torche);
  if (J.peche) pecher(!!E.rayon); else tirer(!!E.rayon);
  bouger();
  son.chauffe(J.chauffe, J.tire);
  // l'arrivée des fantômes, puis du boss
  if (!J.boss && J.captures < 6) {
    J.prochain -= DT;
    if (J.prochain <= 0 && vivants().filter((e) => e.type !== 'assiette').length < 3) { sortir(); J.prochain = 1.7; }
  } else if (!J.boss && J.captures >= 6 && !J.ents.some((e) => e.type !== 'boss')) {
    J.boss = { type: 'boss', x: 160, y: 64, s: 1.25, pv: 7, pv0: 7, etat: 'vit', tTir: 2.2, ph: 0, etourdi: 0, revele: 0, lumiere: 0 };
    J.ents.push(J.boss); texte("LE MAÎTRE D'HÔTEL", 160, 40, '#ffffff', 2, 2); SONS.annonce();
  }
}

function lumiere(demande) {
  const T = J.torche;
  if (demande && !T.vide) { T.pile -= TORCHE.use * DT; if (T.pile <= 0) { T.pile = 0; T.vide = true; texte('PILE VIDE', BT.x + 26, BT.y - 30, '#fff27a'); } }
  else { T.pile = Math.min(1, T.pile + TORCHE.recharge * DT); if (T.vide && T.pile >= TORCHE.reprise) T.vide = false; }
  T.on = !!demande && !T.vide;
  if (T.on) { T.x = demande.suit ? J.visee.x : clamp(demande.x, 0, W); T.y = demande.suit ? J.visee.y : clamp(demande.y, 0, H); }
  for (const e of J.ents) {
    if (e.etat !== 'vit' || e.type === 'assiette') continue;
    const b = boite(e);
    const eclaire = T.on && Math.hypot(e.x - T.x, e.y - T.y) < TORCHE.rayon + Math.min(b.w, b.h) * 0.3;
    if (eclaire) {
      e.lumiere += DT;
      if (e.type === 'ombre') e.revele = 1.2;
      if (e.type !== 'boss' && e.lumiere > TORCHE.eblouit && e.etourdi <= 0) e.etourdi = TORCHE.etourdi;
    } else { e.lumiere = 0; e.revele = Math.max(0, e.revele - DT); }
    e.etourdi = Math.max(0, e.etourdi - DT);
  }
}

function refroidir() {
  J.chauffe = Math.max(0, J.chauffe - RAYON.refroidit * DT);
  if (J.surchauffe && J.chauffe <= RAYON.reprise) J.surchauffe = false;
}

function cibler() {
  const v = J.visee;
  const l = J.ents.filter((e) => e.etat === 'vit' && sous(e, v.x, v.y, e.type === 'assiette' ? 6 : 2) && (e.type !== 'ombre' || e.revele > 0));
  if (J.tenu && l.includes(J.tenu) && !l.some((e) => e.type === 'assiette' && J.tenu.type !== 'assiette')) return J.tenu;
  l.sort((a, b) => (b.type === 'assiette' ? 1 : 0) - (a.type === 'assiette' ? 1 : 0) || b.s - a.s);
  return l[0] || null;
}

function tirer(veut) {
  if (veut && !J.surchauffe) {
    J.chauffe += RAYON.chauffe * DT;
    if (J.chauffe >= 1) surchauffer();
  } else refroidir();
  J.tire = veut && !J.surchauffe;
  J.tenu = J.tire ? cibler() : null;
  const e = J.tenu;
  if (e) { e.pv -= RAYON.puissance * DT * (e.etourdi > 0 ? 1.4 : 1); if (e.pv <= 0) attraper(e); }
}

// la surchauffe coûte : le fantôme tenu s'échappe, requinqué
function surchauffer() {
  J.chauffe = 1; J.surchauffe = true; J.surchauffes++; SONS.surchauffe();
  texte('SURCHAUFFE !', J.visee.x, J.visee.y - 22, '#ff5a3a');
  const e = J.tenu;
  if (e && e.type !== 'assiette') {
    if (e.type === 'boss') e.pv = Math.min(e.pv0, e.pv + 1.5);
    else { e.pv = e.pv0; e.s = Math.max(e.c.s, e.s - 0.45); e.revele = 0; }
    J.echappes++; texte("IL S'ÉCHAPPE !", e.x, e.y - 26, '#ff8aa0');
  }
  J.tenu = null;
}

function attraper(e) {
  J.tenu = null;
  if (e.type === 'boss') { debutPeche(); return; }
  if (e.type === 'assiette') { e.etat = 'mort'; for (let k = 0; k < 8; k++) J.parts.push({ x: e.x, y: e.y, vx: (Math.random() - 0.5) * 160, vy: -40 - Math.random() * 90, t: 0, vie: 0.8, col: k & 1 ? '#ffffff' : '#c8d8f0' }); return; }
  e.etat = 'cap'; e.tc = 0; e.x0 = e.x; e.y0 = e.y; e.s0 = e.s;
}

function debutPeche() {
  const b = J.boss;
  J.ents = J.ents.filter((e) => e.type !== 'assiette');
  const dir = b.x < 160 ? -1 : 1;
  J.peche = { prog: (b.meilleure || 0) * PECHE.fatigue, force: Math.pow(PECHE.pitie, J.casses), x0: b.x, y0: b.y, dir, tDir: 2.8, coup: 0, tCoup: 2.4, bien: false, annonce: false, dejaAnnonce: false, zx: b.x - dir * PECHE.ecart, zy: b.y + 18, vibre: 0 };
  J.chauffe = Math.min(J.chauffe, 0.2); J.surchauffe = false;
  texte('ATTRAPE-LE !', 160, 30, '#fff27a', 2, 1.6); texte('DOIGT DANS LE CERCLE', 160, 48, '#6ee03a', 1, 2.4); SONS.annonce(); vibrer(60);
}

function pecher(veut) {
  const P = J.peche, b = J.boss;
  P.tDir -= DT; if (P.tDir <= 0 && P.coup <= 0 && !P.annonce) { P.dir = -P.dir; P.tDir = 2.4 + Math.random() * 1.4; }
  if (P.coup > 0) { P.coup -= DT; if (P.coup <= 0) { P.tCoup = 2.2 + Math.random() * 1.2; P.dejaAnnonce = false; } }
  else {
    P.tCoup -= DT;
    if (P.tCoup <= 0) {
      P.coup = PECHE.coup; SONS.coup(); J.secousse = 0.25; vibrer(90);
      for (let k = 0; k < 10; k++) J.parts.push({ x: b.x, y: b.y, vx: P.dir * (40 + Math.random() * 120), vy: -60 + Math.random() * 60, t: 0, vie: 0.6, col: k & 1 ? '#6ee03a' : '#b8ff8a' });
    }
  }
  P.annonce = P.coup <= 0 && P.tCoup < PECHE.annonce;
  if (P.annonce && !P.dejaAnnonce) { P.dejaAnnonce = true; SONS.annonce(); }
  // il recule vers le piège à mesure qu'on le ramène ; il tire de son côté, prend son élan
  // (recule un peu, gonfle) puis bondit
  const cx = P.x0 + (BOUCHE.x - P.x0) * P.prog * 0.85, cy = P.y0 + (128 - P.y0) * P.prog;
  const off = P.coup > 0 ? 30 : P.annonce ? 4 : 14;
  b.x = clamp(cx + P.dir * off + (P.coup > 0 || P.annonce ? (Math.random() - 0.5) * (P.coup > 0 ? 6 : 3) : 0), 30, 290);
  b.y = cy + Math.sin(J.t * 5) * 2;
  b.s = 1.25 - P.prog * 0.45;
  // le cercle : à l'opposé du boss, ou de SON côté quand il s'élance (il y glisse pendant l'élan)
  const suit = P.coup > 0 || P.annonce;
  const zx = clamp(b.x + (suit ? P.dir * PECHE.ecart * 0.8 : -P.dir * PECHE.ecart), 20, 300), zy = clamp(b.y + 18, 40, 148);
  const k = 1 - Math.exp(-DT * (suit ? 6 : 3.5));
  P.zx += (zx - P.zx) * k; P.zy += (zy - P.zy) * k;
  J.tire = veut && !J.surchauffe;
  J.tenu = J.tire ? b : null;
  if (J.tire) {
    P.bien = Math.hypot(J.visee.x - P.zx, J.visee.y - P.zy) < PECHE.cercle + 3;
    if (P.coup > 0) { J.chauffe += (P.bien ? PECHE.coupDoux : PECHE.coupChauffe * P.force) * DT; P.prog -= PECHE.coupRecul * (P.bien ? 0.3 : 1) * DT; }
    else if (P.bien) { P.prog += PECHE.tire * DT; J.chauffe = Math.max(0, J.chauffe + PECHE.tireChauffe * DT); }
    else { P.prog -= PECHE.horsRecul * DT; J.chauffe += PECHE.horsChauffe * DT; }
    // ce qu'on sent : des petits coups quand on le tient, une ligne qui grince quand elle force
    const force = P.coup > 0 && !P.bien;
    P.vibre -= DT; if (P.vibre <= 0) { vibrer(force ? 30 : P.bien ? 8 : 0); P.vibre = force ? 0.1 : 0.22; }
    if (P.bien && Math.random() < 0.14) J.parts.push({ x: b.x + (Math.random() - 0.5) * 14 * b.s, y: b.y - 16 * b.s, vx: (Math.random() - 0.5) * 70, vy: -50 - Math.random() * 30, t: 0, vie: 0.5, col: '#8ad8ff' });
    if ((force || J.chauffe > 0.6) && Math.random() < 0.5) J.parts.push({ x: b.x + (Math.random() - 0.5) * 6, y: b.y + 6, vx: (Math.random() - 0.5) * 120, vy: -40 - Math.random() * 60, t: 0, vie: 0.35, col: Math.random() < 0.5 ? '#fff27a' : '#ffffff' });
    if (J.chauffe >= 1) { casser(); return; }
  } else { P.bien = false; refroidir(); P.prog -= PECHE.lacheRecul * DT; }
  P.prog = Math.max(0, P.prog); b.meilleure = Math.max(b.meilleure || 0, P.prog);
  if (P.prog >= 1) {
    J.peche = null; J.tire = false; J.tenu = null; J.ents = J.ents.filter((e) => e.type === 'boss');
    J.aspire = { t: 0, x0: b.x, y0: b.y, ang: 0, r: 0, r0: 0, spin: 0, taille: 1, etire: 1, dedans: false, bonk: 0, bonks: 0, cri: 0 };
    SONS.clac(); vibrer(120); J.piegeFlash = 0.3;
  }
}

// le mafuba : le piège s'ouvre en grand, un tourbillon vert se lève, le boss panique, s'agrippe
// deux ou trois fois, tourne de plus en plus vite et y passe ; le couvercle claque, ça cogne
// dedans, puis plus rien
function aspirer() {
  const A = J.aspire, b = J.boss, t = (A.t += DT);
  if (t < ASPIRE.choc) {
    // le choc : il sursaute sur place
    b.x = A.x0 + (Math.random() - 0.5) * 2; b.y = A.y0 - Math.sin((t / ASPIRE.choc) * Math.PI) * 8;
    A.cy = CENTRE.y; A.r0 = A.r = Math.max(40, Math.hypot(b.x - CENTRE.x, b.y - CENTRE.y)); A.ang = Math.atan2(b.y - CENTRE.y, b.x - CENTRE.x);
    if (t + DT >= ASPIRE.choc) { SONS.tourbillon(); vibrer(200); }
    return;
  }
  A.cri -= DT; if (t < ASPIRE.avale && A.cri <= 0) { SONS.cri(); A.cri = 0.22 + Math.random() * 0.15; }
  if (t < ASPIRE.lutte) {
    // il tourne et se rapproche, mais s'agrippe trois fois (le rayon remonte d'un coup)
    const k = (t - ASPIRE.choc) / (ASPIRE.lutte - ASPIRE.choc);
    const agrippe = Math.pow(Math.max(0, Math.sin(k * Math.PI * 3)), 3) * 16 * (1 - k);
    A.r = A.r0 * (1 - 0.72 * k) + agrippe;
    A.ang += DT * (1.6 + k * 5) * (1 - agrippe / 24);
    A.spin = Math.sin(t * 9) * 0.5 + k * 0.8; A.taille = 1; A.etire = 1 + 0.15 * Math.sin(t * 13);
    if (agrippe > 12 && Math.random() < 0.1) vibrer(40);
  } else if (t < ASPIRE.avale) {
    // il y passe : de plus en plus petit, étiré, en toupie
    const k = (t - ASPIRE.lutte) / (ASPIRE.avale - ASPIRE.lutte);
    // le cœur du tourbillon descend dans le piège et l'emporte
    A.r = A.r0 * 0.28 * (1 - k * k); A.ang += DT * 14; A.spin += DT * 24; A.taille = 1 - 0.9 * k; A.etire = 1 + 1.6 * k;
    A.cy = CENTRE.y + (BOUCHE.y - CENTRE.y) * k * k;
  } else if (!A.dedans) {
    A.dedans = true; J.piegeFlash = 0.5; J.secousse = 0.45; SONS.clac(); vibrer(260);
    for (let k = 0; k < 18; k++) J.parts.push({ x: PIEGE.x, y: PIEGE.y - 4, vx: (Math.random() - 0.5) * 220, vy: -40 - Math.random() * 120, t: 0, vie: 0.9, col: k & 1 ? '#6ee03a' : '#ffffff' });
  }
  b.x = CENTRE.x + Math.cos(A.ang) * A.r; b.y = A.cy + Math.sin(A.ang) * A.r * 0.8;
  // dedans, il cogne contre le couvercle, trois fois
  A.bonk = Math.max(0, A.bonk - DT);
  if (A.dedans && A.bonks < ASPIRE.bonks.length && t >= ASPIRE.bonks[A.bonks]) {
    A.bonks++; A.bonk = 0.2; SONS.bonk(); vibrer(40);
    for (let k = 0; k < 4; k++) J.parts.push({ x: PIEGE.x + (Math.random() - 0.5) * 20, y: PIEGE.y - 4, vx: (Math.random() - 0.5) * 30, vy: -20, t: 0, vie: 0.6, fumee: true });
  }
  if (t >= ASPIRE.fin) { J.aspire = null; J.boss = null; J.ents = []; J.fin = 'gagne'; J.finT = 0; J.captures++; }
}

function casser() {
  const b = J.boss;
  J.chauffe = 1; J.surchauffe = true; J.peche = null; J.tenu = null; J.casses++;
  b.pv = b.pv0 * 0.25; b.s = 1.25; b.y = 64; b.tTir = 1.6;
  texte('LA LIGNE CASSE !', 160, 34, '#ff5a3a', 2, 1.6); SONS.casse(); J.secousse = 0.35; vibrer(300);
  for (let k = 0; k < 14; k++) J.parts.push({ x: b.x, y: b.y + 20, vx: (Math.random() - 0.5) * 200, vy: -30 - Math.random() * 100, t: 0, vie: 0.9, col: k & 1 ? '#ff3fa4' : '#3fe8ff' });
}

function frapper(e) {
  e.etat = 'mort'; J.coeurs--; J.bave = 0.7; J.secousse = 0.3; SONS.touche();
  if (J.coeurs <= 0) { J.fin = 'perdu'; J.finT = 0; }
}

function bouger() {
  for (const e of J.ents) {
    if (e.etat === 'cap') {
      e.tc += DT;
      if (e.tc >= (e.dureeCap || 0.55)) {
        e.etat = 'mort'; J.piegeFlash = 0.4; SONS.clac();
        if (e.type === 'boss') { J.boss = null; J.fin = 'gagne'; J.finT = 0; } else { J.captures++; texte('+3', PIEGE.x + 22, PIEGE.y - 14, '#fff27a'); }
      }
      continue;
    }
    if (e.etat !== 'vit') continue;
    if (e.type === 'ecto' || e.type === 'ombre') {
      if (e.etourdi <= 0) e.s += e.croit * DT * (J.tenu === e ? 0.4 : 1);
      if (e.s >= 2.4) frapper(e);
    } else if (e.type === 'assiette') {
      e.k += DT / 2.1; e.x = e.ax + (e.bx - e.ax) * e.k; e.y = e.ay + (e.by - e.ay) * e.k - Math.sin(e.k * Math.PI) * 18; e.s = 0.6 + e.k * 1.8;
      if (e.k >= 1) frapper(e);
    } else if (e.type === 'boss' && !J.peche) {
      e.x = 160 + Math.sin(J.t * 0.6) * 55; e.y += (64 - e.y) * 0.05; e.s = 1.25;
      e.tTir -= DT * (J.tenu === e ? 0.5 : 1);
      if (e.tTir <= 0) {
        e.tTir = 2.6;
        J.ents.push({ type: 'assiette', x: e.x, y: e.y, ax: e.x, ay: e.y, bx: 100 + Math.random() * 120, by: 110 + Math.random() * 20, k: 0, s: 0.6, pv: 0.12, pv0: 0.12, etat: 'vit', ph: 0, etourdi: 0, revele: 1, lumiere: 0 });
      }
    }
  }
  J.ents = J.ents.filter((e) => e.etat !== 'mort');
  const avale = J.ents.some((e) => e.etat === 'cap') || !!J.peche || (!!J.aspire && !J.aspire.dedans);
  J.piegeOuvre += ((avale ? 1 : 0) - J.piegeOuvre) * 0.2;
  // la vapeur quand ça chauffe
  if (J.tire && J.chauffe > 0.7 && Math.random() < 0.4) J.parts.push({ x: BOUCHE.x + (Math.random() - 0.5) * 16, y: BOUCHE.y, vx: (Math.random() - 0.5) * 20, vy: -30 - Math.random() * 20, t: 0, vie: 0.7, fumee: true });
  if (J.surchauffe && Math.random() < 0.5) J.parts.push({ x: J.visee.x + (Math.random() - 0.5) * 10, y: J.visee.y, vx: (Math.random() - 0.5) * 16, vy: -24, t: 0, vie: 0.8, fumee: true });
}

function vieillir() {
  for (const q of J.parts) { q.t += DT; q.x += q.vx * DT; q.y += q.vy * DT; if (!q.fumee) q.vy += 160 * DT; }
  J.parts = J.parts.filter((q) => q.t < q.vie);
  for (const t of J.textes) t.t += DT;
  J.textes = J.textes.filter((t) => t.t < t.vie);
  J.bave = Math.max(0, J.bave - DT); J.secousse = Math.max(0, J.secousse - DT); J.piegeFlash = Math.max(0, J.piegeFlash - DT);
}

// ---------- le dessin ----------
function dessiner() {
  ctx.fillStyle = NOIR; ctx.fillRect(0, 0, W, H);
  const sx = J.secousse > 0 ? Math.round((Math.random() - 0.5) * 6) : 0;
  ctx.save(); ctx.translate(sx, 0);
  ctx.drawImage(fond, 0, 0);
  try { MANGER.animer(ctx, salle, J.t); } catch { /* la maquette n'a pas tout l'état d'une salle */ }
  obscurite();
  if (J.aspire) tourbillon();
  const tri = [...J.ents].filter((e) => e.etat === 'vit').sort((a, b) => a.s - b.s);
  for (const e of tri) if (e.type === 'boss' && (J.peche || J.aspire)) { if (!J.aspire || !J.aspire.dedans) bossDessin(e); } else entite(e);
  ctx.restore();
  for (const e of J.ents) if (e.etat === 'cap') avalé(e);
  rayon();
  if (J.peche) pecheUI();
  piege();
  if (J.peche) cercle();
  if (!J.aspire) viseur();
  for (const q of J.parts) {
    if (q.fumee) { ctx.globalAlpha = 0.5 * (1 - q.t / q.vie); ovale(ctx, q.x, q.y, 2 + q.t * 6, 2 + q.t * 5, '#d8d0e0'); ctx.globalAlpha = 1; }
    else R(ctx, q.col || '#fff6c8', q.x, q.y, 2, 2);
  }
  hud();
  for (const t of J.textes) ecrire(ctx, t.s, t.x, t.y - t.t * 10, { centre: true, sc: t.sc, coul: t.col, contour: NOIR, gras: true, alpha: Math.min(1, (t.vie - t.t) * 3) });
  if (J.bave > 0) { ctx.globalAlpha = J.bave * 0.5; ctx.fillStyle = '#6ee03a'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  if (J.fin) finUI();
}

// la pièce est dans la pénombre ; la torche y perce un rond de lumière
function obscurite() {
  const c = nuit.c, T = J.torche;
  c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, W, H);
  c.fillStyle = 'rgba(8, 4, 22, 0.5)'; c.fillRect(0, 0, W, H);
  if (T.on) {
    const ox = mode === 'bouton' ? 70 : T.x - 14, oy = 186, r = TORCHE.rayon;
    c.globalCompositeOperation = 'destination-out';
    const ang = Math.atan2(T.y - oy, T.x - ox), px = Math.cos(ang + Math.PI / 2), py = Math.sin(ang + Math.PI / 2);
    c.globalAlpha = 0.45; c.beginPath(); c.moveTo(ox - px * 4, oy - py * 4); c.lineTo(T.x - px * r, T.y - py * r); c.lineTo(T.x + px * r, T.y + py * r); c.lineTo(ox + px * 4, oy + py * 4); c.fill();
    c.globalAlpha = 1;
    const g = c.createRadialGradient(T.x, T.y, 4, T.x, T.y, r);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.75, 'rgba(0,0,0,0.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.beginPath(); c.arc(T.x, T.y, r, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'source-over';
  }
  ctx.drawImage(nuit.t, 0, 0);
  if (T.on) { ctx.globalAlpha = 0.14 + Math.random() * 0.03; ctx.fillStyle = '#fff2b0'; ctx.beginPath(); ctx.arc(T.x, T.y, TORCHE.rayon, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
}

function entite(e) {
  const sp = sprite(e), b = boite(e), tenu = J.tenu === e && J.tire;
  if (e.type !== 'assiette') { ctx.globalAlpha = 0.35; ovale(ctx, e.x, Math.min(176, 118 + (e.s - 0.5) * 30), b.w * 0.3, 2 + e.s, NOIR); ctx.globalAlpha = 1; }
  const wob = e.type === 'ecto' || e.type === 'ombre' ? Math.sin(J.t * 2 + e.ph) * 2 : 0;
  ctx.globalAlpha = e.type === 'ombre' ? Math.min(1, 0.05 + e.revele) : 1;
  const img = tenu && ((J.t * 16) | 0) % 3 === 0 && BLANC[e.type === 'boss' ? 'majordome' : e.type === 'ecto' ? 'ecto0' : e.type] ? BLANC[e.type === 'boss' ? 'majordome' : e.type === 'ecto' ? 'ecto0' : e.type] : sp;
  ctx.drawImage(img, Math.round(b.x + wob), Math.round(b.y), Math.round(b.w), Math.round(b.h));
  ctx.globalAlpha = 1;
  // l'Ombre hors de la lumière : on ne voit que ses yeux
  if (e.type === 'ombre' && e.revele <= 0) { ctx.globalAlpha = 0.9; ctx.drawImage(S.ombreYeux, Math.round(b.x + wob), Math.round(b.y), Math.round(b.w), Math.round(b.h)); ctx.globalAlpha = 1; }
  if (e.etourdi > 0) for (let i = 0; i < 3; i++) { const an = J.t * 6 + i * 2.1; R(ctx, '#fff27a', Math.round(e.x + Math.cos(an) * b.w * 0.45), Math.round(b.y - 3 + Math.sin(an) * 3), 2, 2); }
  if ((e.type === 'ecto' || e.type === 'ombre') && e.pv < e.pv0) {
    const bw = Math.max(12, Math.round(b.w * 0.6)), bx = Math.round(e.x - bw / 2), by = Math.round(b.y - 5);
    R(ctx, NOIR, bx - 1, by - 1, bw + 2, 4); R(ctx, '#6ee03a', bx, by, Math.round(bw * e.pv / e.pv0), 2);
  }
  if (e.type === 'assiette' && e.k > 0.5) { ctx.strokeStyle = (((J.t * 10) | 0) & 1) ? '#ff3030' : '#ffffff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(e.x, e.y, b.w * 0.7, 0, Math.PI * 2); ctx.stroke(); }
}

// la capture : le fantôme s'étire et file le long du rayon jusque dans le piège
function avalé(e) {
  const sp = sprite(e), d = e.dureeCap || 0.55, k = Math.min(1, e.tc / d), kk = k * k;
  const x = e.x0 + (BOUCHE.x - e.x0) * kk, y = e.y0 + (BOUCHE.y - e.y0) * kk;
  const ang = Math.atan2(BOUCHE.y - e.y0, BOUCHE.x - e.x0) - Math.PI / 2;
  const w = sp.width * e.s0 * (1 - 0.8 * k), h = sp.height * e.s0 * (1 + 0.9 * k) * (1 - 0.6 * kk);
  // la traînée
  ctx.globalAlpha = 0.5;
  for (let i = 1; i <= 5; i++) { const f = Math.max(0, kk - i * 0.06); R(ctx, i & 1 ? '#3fe8ff' : '#ff3fa4', e.x0 + (BOUCHE.x - e.x0) * f - 1, e.y0 + (BOUCHE.y - e.y0) * f - 1, 3, 3); }
  ctx.globalAlpha = 1 - k * 0.3;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang * k);
  const img = ((e.tc * 24) | 0) & 1 ? (BLANC[e.type === 'boss' ? 'majordome' : e.type === 'ecto' ? 'ecto0' : e.type] || sp) : sp;
  ctx.drawImage(img, Math.round(-w / 2), Math.round(-h / 2), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  ctx.restore(); ctx.globalAlpha = 1;
}

// la couleur de la chauffe : blanc, puis jaune, puis rouge
const couleurChauffe = (c) => c > 0.75 ? '#ff3a2a' : c > 0.5 ? '#ffd23a' : '#ffffff';

function rayon() {
  if (!J.tire) return;
  const x0 = BOUCHE.x, y0 = BOUCHE.y - 2;
  let x1 = J.visee.x, y1 = J.visee.y, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  if (J.peche) {
    // le rayon accroché au boss se courbe vers le doigt qui tire
    x1 = J.boss.x; y1 = J.boss.y + 6; cx = (x0 + x1) / 2 + (J.visee.x - (x0 + x1) / 2) * 0.7; cy = (y0 + y1) / 2 + (J.visee.y - (y0 + y1) / 2) * 0.7;
  }
  // à la pêche le rayon est une ligne tendue : une onde qui court dessus, plus forte quand il tire
  const P = J.peche, force = P && P.coup > 0 && !P.bien;
  const n = P ? 20 : 12, tremble = P ? 1.5 + J.chauffe * 3 : 4 + J.chauffe * 8, pts = [];
  const amp = !P ? 0 : force ? 6 : P.coup > 0 || P.annonce ? 3.5 : 2;
  const lx = x1 - x0, ly = y1 - y0, ll = Math.hypot(lx, ly) || 1, nx = -ly / ll, ny = lx / ll;
  for (let k = 0; k <= n; k++) {
    const f = k / n, a = (1 - f) * (1 - f), bq = 2 * f * (1 - f), c = f * f;
    const j = k === 0 || k === n ? 0 : (Math.random() - 0.5) * tremble;
    const o = Math.sin(f * Math.PI) * amp * Math.sin(f * 16 - J.t * 32);
    pts.push([a * x0 + bq * cx + c * x1 + j + nx * o, a * y0 + bq * cy + c * y1 + j + ny * o]);
  }
  const coeurR = force && ((J.t * 12) | 0) & 1 ? '#ffffff' : force ? '#ff3a2a' : couleurChauffe(J.chauffe);
  for (const [col, l, dx] of /** @type {[string, number, number][]} */ ([['#ff3fa4', 3, -2], ['#3fe8ff', 3, 2], [coeurR, 2, 0]])) {
    ctx.strokeStyle = col; ctx.lineWidth = l; ctx.beginPath(); ctx.moveTo(pts[0][0] + dx, pts[0][1]);
    for (const [x, y] of pts) ctx.lineTo(x + dx, y);
    ctx.stroke();
  }
  ovale(ctx, x1, y1, 4, 4, coeurR);
}

// la pêche : UN seul signe à suivre, le cercle vert (aucune flèche, aucun « ! » à comprendre)
function cercle() {
  const P = J.peche, x = Math.round(P.zx), y = Math.round(P.zy), r = PECHE.cercle * (1 + 0.1 * Math.sin(J.t * 8));
  // pas dedans : des points qui filent du viseur vers le cercle
  if (!P.bien) {
    const vx = x - J.visee.x, vy = y - J.visee.y, d = Math.hypot(vx, vy);
    if (d > r + 6) for (let s = ((J.t * 40) % 7) + 8; s < d - r; s += 7) R(ctx, '#d8ffd0', Math.round(J.visee.x + vx / d * s) - 1, Math.round(J.visee.y + vy / d * s) - 1, 2, 2);
  }
  if (P.bien) { ctx.globalAlpha = 0.3; ctx.fillStyle = '#6ee03a'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.lineWidth = 5; ctx.strokeStyle = NOIR; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 3; ctx.strokeStyle = P.bien ? '#6ee03a' : ((J.t * 6) | 0) & 1 ? '#d8ffd0' : '#6ee03a'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  if (!P.bien) { ovale(ctx, x, y, 3, 3, NOIR); ovale(ctx, x, y, 2, 2, '#ffffff'); }
}

// le boss pêché ou aspiré : penché, étiré, gonflé, avec la tête qui va avec
function bossDessin(e) {
  const P = J.peche, A = J.aspire;
  let rot = 0, sx = 1, sy = 1, humeur = 'effort', blanc = false;
  if (P) {
    if (P.annonce) { const g = 1.08 + 0.06 * Math.sin(J.t * 40); sx = g; sy = g; rot = -P.dir * 0.15; humeur = 'colere'; }
    else if (P.coup > 0) { sx = 1.18; sy = 0.86; rot = P.dir * 0.45; humeur = 'colere'; }
    else { rot = P.dir * 0.22; if (P.bien && J.tire) { sx = 0.9; sy = 1.12; } }
    blanc = J.tire && P.bien && ((J.t * 16) | 0) % 4 === 0;
  } else if (A) {
    humeur = 'panique'; rot = A.spin; sx = A.taille / Math.sqrt(A.etire); sy = A.taille * A.etire;
  }
  if (!A) { ctx.globalAlpha = 0.35; ovale(ctx, e.x, Math.min(176, 118 + (e.s - 0.5) * 30), 13 * e.s, 2 + e.s, NOIR); ctx.globalAlpha = 1; }
  ctx.save(); ctx.translate(Math.round(e.x), Math.round(e.y)); ctx.rotate(rot); ctx.scale(e.s * sx, e.s * sy);
  // les bras qui battent l'air (aspiré) ou qui s'arc-boutent (pêché)
  const bat = A ? Math.sin(J.t * 34) : 0;
  for (const c of [-1, 1]) {
    const ex = -2 + c * 5, a = A ? -Math.PI / 2 + c * (0.9 + bat * 0.8) : P && P.coup > 0 ? c * 0.3 + Math.PI / 2 : Math.PI / 2 + c * 0.6;
    const hx = ex + Math.cos(a) * 12, hy = -3 + Math.sin(a) * 12;
    ctx.strokeStyle = NOIR; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ex, -3); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.strokeStyle = '#3a3050'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ex, -3); ctx.lineTo(hx, hy); ctx.stroke();
    ovale(ctx, hx, hy, 2, 2, '#ffffff');
  }
  ctx.drawImage(blanc && BLANC.majordome ? BLANC.majordome : S.majordome, -18, -22);
  visage(humeur);
  ctx.restore();
  if (A && !A.dedans && A.t > ASPIRE.choc) {
    const j = () => (Math.random() - 0.5) * 2;
    ecrire(ctx, A.t < ASPIRE.lutte ? 'NOOOON !' : 'AAAAH !', e.x + j(), e.y - 34 * e.s * A.taille - 4 + j(), { centre: true, coul: '#ffffff', contour: NOIR, gras: true });
  } else if (A) ecrire(ctx, '!!', e.x, e.y - 36, { centre: true, sc: 2, coul: '#fff27a', contour: NOIR });
}

// la tête, dessinée par-dessus le sprite (en pixels du sprite, centre 18,22)
function visage(humeur) {
  const yeux = [[-4.5, -14], [0.5, -14]];
  if (humeur === 'panique') {
    // des yeux ronds, minuscules pupilles, bouche grande ouverte, sourcils tout en haut
    for (const [x, y] of yeux) { ovale(ctx, x, y, 2.8, 3, NOIR); ovale(ctx, x, y, 2.2, 2.4, '#ffffff'); R(ctx, NOIR, x - 0.5 + Math.sin(J.t * 20), y - 0.5, 1, 1); }
    ovale(ctx, -2, -7.5, 2.6, 3.2, NOIR); ovale(ctx, -2, -7, 1.6, 2, '#a01030');
    ctx.strokeStyle = NOIR; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-7.5, -18); ctx.lineTo(-3, -19.5); ctx.moveTo(-1, -19.5); ctx.lineTo(3.5, -18); ctx.stroke();
    // les gouttes de peur
    R(ctx, '#8ad8ff', 4, -19 + ((J.t * 30) % 4), 1, 2); R(ctx, '#8ad8ff', -9, -17 + ((J.t * 26) % 5), 1, 2);
    return;
  }
  // sourcils froncés (plus encore quand il s'élance), dents serrées
  const dur = humeur === 'colere';
  ctx.strokeStyle = NOIR; ctx.lineWidth = 1.2; ctx.beginPath();
  ctx.moveTo(-7.5, dur ? -18.5 : -17.5); ctx.lineTo(-3, -16); ctx.moveTo(-1, -16); ctx.lineTo(3.5, dur ? -18.5 : -17.5); ctx.stroke();
  if (dur) for (const [x, y] of yeux) R(ctx, ((J.t * 12) | 0) & 1 ? '#ff3030' : '#fff27a', x - 1, y - 1, 2, 2);
  R(ctx, NOIR, -5, -9.5, 7, 3); R(ctx, '#ffffff', -4.5, -9, 6, 2); R(ctx, NOIR, -4.5, -8.2, 6, 0.6);
}

// le tourbillon vert qui se lève du piège : des coups de pinceau qui tournent (plus vite au
// centre) et filent vers le cœur, comme le mafuba ; un entonnoir de lumière le relie au piège
const PINCEAU = Array.from({ length: 110 }, (_, i) => {
  const h = (n) => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
  return { r: h(1), a: h(2) * Math.PI * 2, l: 0.35 + h(3) * 0.8, w: 0.6 + h(4) * 0.9, c: (h(5) * 5) | 0 };
});
function tourbillon() {
  const A = J.aspire, t = A.t, cx = CENTRE.x, cy = A.cy;
  const e = t < 0.3 ? 0 : t < 0.8 ? (t - 0.3) / 0.5 : t < ASPIRE.avale ? 1 : Math.max(0, 1 - (t - ASPIRE.avale) / 0.35);
  if (e <= 0) return;
  const Rm = 230 * e;
  ctx.globalAlpha = 0.55 * e; ctx.fillStyle = '#0c3412'; ctx.fillRect(-4, 0, W + 8, H);
  ctx.globalAlpha = 0.25 * e; ctx.fillStyle = '#d8ffb0'; ctx.beginPath(); ctx.ellipse(cx, cy, Rm * 0.3, Rm * 0.24, 0, 0, Math.PI * 2); ctx.fill();
  // l'entonnoir
  ctx.globalAlpha = 0.5 * e; ctx.fillStyle = '#f0fff0';
  ctx.beginPath(); ctx.moveTo(BOUCHE.x - 8, BOUCHE.y); ctx.lineTo(cx - 22 * e, cy); ctx.lineTo(cx + 22 * e, cy); ctx.lineTo(BOUCHE.x + 8, BOUCHE.y); ctx.fill();
  const cols = ['#145a24', '#1f8a3a', '#6ee03a', '#b8ff8a', '#f0fff0'];
  ctx.lineCap = 'round';
  for (const p of PINCEAU) {
    const r = Rm * ((((p.r - t * 0.25) % 1) + 1) % 1) + 6;
    const a = p.a + t * (2 + 140 / (r + 20));
    ctx.strokeStyle = cols[p.c]; ctx.globalAlpha = 0.85 * e * Math.min(1, r / 30);
    ctx.lineWidth = Math.max(1, r * 0.09 * p.w);
    ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.8, 0, a, a + p.l); ctx.stroke();
  }
  ctx.lineCap = 'butt'; ctx.globalAlpha = 1;
  ovale(ctx, cx, cy, 12 * e, 9 * e, '#ffffff');
}

function pecheUI() {
  const P = J.peche;
  // la prise : une barre jaune qui se remplit vers le piège
  const bw = 120, bx = 100;
  ecrire(ctx, "LE MAÎTRE D'HÔTEL", 160, 4, { centre: true, coul: '#ffffff', contour: NOIR });
  R(ctx, NOIR, bx - 1, 13, bw + 2, 6); R(ctx, '#3a2a10', bx, 14, bw, 4); R(ctx, '#ffd23a', bx, 14, Math.round(bw * P.prog), 4);
}

function piege() {
  const A = J.aspire, saute = A && A.bonk > 0;
  const x = PIEGE.x + (saute ? Math.round((Math.random() - 0.5) * 6) : 0), y = PIEGE.y - (saute ? Math.round(8 * Math.sin(A.bonk / 0.2 * Math.PI)) : 0), f = J.piegeFlash;
  if (saute) {
    // l'étoile du coup qu'il donne dedans
    const k = 1 - A.bonk / 0.2, sx = x + (A.bonks % 2 ? 10 : -10), sy = y - 8 - k * 6;
    for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4, l = i & 1 ? 4 : 8; ctx.strokeStyle = NOIR; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(an) * l, sy + Math.sin(an) * l); ctx.stroke(); ctx.strokeStyle = '#fff27a'; ctx.lineWidth = 1; ctx.stroke(); }
  }
  const o = A && !A.dedans ? 1.4 : J.piegeOuvre;
  // la colonne de lumière quand il est ouvert
  if (o > 0.05) {
    ctx.globalAlpha = 0.18 * o + f; ctx.fillStyle = f > 0 ? '#ffffff' : '#c8f8ff';
    ctx.beginPath(); ctx.moveTo(x - 9, y - 2); ctx.lineTo(x - 18, y - 30); ctx.lineTo(x + 18, y - 30); ctx.lineTo(x + 9, y - 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  // les deux mâchoires, qui s'ouvrent vers le haut
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(x + s * 15, y - 1); ctx.rotate(-s * o * 1.1);
    R(ctx, NOIR, s > 0 ? -16 : 0, -2, 16, 4); R(ctx, '#8a8098', s > 0 ? -15 : 1, -1, 14, 2);
    ctx.restore();
  }
  R(ctx, NOIR, x - 16, y - 1, 32, 13); R(ctx, '#4a4258', x - 15, y, 30, 11); R(ctx, '#6a6078', x - 15, y, 30, 2);
  for (let i = 0; i < 6; i++) R(ctx, i & 1 ? NOIR : '#ffd23a', x - 15 + i * 5, y + 7, 5, 3);
  const lampe = f > 0 ? '#ffffff' : o > 0.5 ? (((J.t * 8) | 0) & 1 ? '#ff3030' : '#ffd23a') : '#6a2030';
  R(ctx, lampe, x - 12, y + 3, 3, 3); R(ctx, lampe, x + 9, y + 3, 3, 3);
  ecrire(ctx, String(J.captures), x, y + 2, { centre: true, coul: '#c8f8ff' });
}

// le viseur porte la chauffe : un anneau qui se remplit et rougit
function viseur() {
  const x = Math.round(J.visee.x), y = Math.round(J.visee.y), c = J.chauffe;
  const tient = [...doigts.values()].some((d) => d.role === 'rayon') || window.__pilote;
  ctx.globalAlpha = tient ? 1 : 0.5;
  const col = J.surchauffe ? '#ff3a2a' : J.tenu ? '#ff3030' : '#ffffff';
  const seg = (cc, o) => { R(ctx, cc, x - 8 - o, y - o, 5 + 2 * o, 1 + 2 * o); R(ctx, cc, x + 4 - o, y - o, 5 + 2 * o, 1 + 2 * o); R(ctx, cc, x - o, y - 8 - o, 1 + 2 * o, 5 + 2 * o); R(ctx, cc, x - o, y + 4 - o, 1 + 2 * o, 5 + 2 * o); };
  seg(NOIR, 1); seg(col, 0);
  if (c > 0.02) {
    const r = 12, clig = c > 0.75 && ((J.t * 8) | 0) & 1;
    ctx.lineWidth = 4; ctx.strokeStyle = NOIR; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = '#3a2a4a'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = J.surchauffe ? '#ff3a2a' : clig ? '#ffffff' : c > 0.75 ? '#ff3a2a' : c > 0.5 ? '#ffd23a' : '#6ee03a';
    ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, c)); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function hud() {
  for (let k = 0; k < 5; k++) coeur(ctx, 4 + k * 11, 4, k < J.coeurs);
  if (J.boss && !J.peche && J.boss.etat === 'vit') {
    ecrire(ctx, "LE MAÎTRE D'HÔTEL", 160, 4, { centre: true, coul: '#ffffff', contour: NOIR });
    R(ctx, NOIR, 99, 13, 122, 6); R(ctx, '#b46cff', 100, 14, Math.round(120 * Math.max(0, J.boss.pv) / J.boss.pv0), 4);
  }
  // changer de torche
  R(ctx, NOIR, BMODE.x, BMODE.y, BMODE.w, BMODE.h); R(ctx, '#2a1a3a', BMODE.x + 1, BMODE.y + 1, BMODE.w - 2, BMODE.h - 2);
  ecrire(ctx, mode === 'bouton' ? 'TORCHE: BOUTON' : 'TORCHE: LIBRE', BMODE.x + BMODE.w / 2, BMODE.y + 3, { centre: true, coul: '#fff27a' });
  ecrire(ctx, 'CAPTURES ' + Math.min(6, J.captures) + '/6', 316, 4, { droite: true, coul: '#c8f8ff', contour: NOIR });
  // la torche : le bouton du pouce gauche, ou la ligne qui partage l'écran
  const T = J.torche;
  if (mode === 'bouton') {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = NOIR; ctx.beginPath(); ctx.arc(BT.x, BT.y, BT.r + 1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = T.on ? '#fff27a' : T.vide ? '#5a4a3a' : '#8a7a50'; ctx.beginPath(); ctx.arc(BT.x, BT.y, BT.r - 1, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    ctx.globalAlpha = 0.25; for (let y = 32; y < 176; y += 6) R(ctx, '#fff27a', LIBRE, y, 1, 3); ctx.globalAlpha = 1;
  }
  // la lampe dessinée, et sa pile tout autour
  const lx = mode === 'bouton' ? BT.x : 18, ly = mode === 'bouton' ? BT.y : 160;
  R(ctx, NOIR, lx - 7, ly - 3, 10, 7); R(ctx, '#3a3048', lx - 6, ly - 2, 8, 5);
  P2([[lx + 3, ly - 4], [lx + 8, ly - 7], [lx + 8, ly + 8], [lx + 3, ly + 5]], NOIR); P2([[lx + 3, ly - 3], [lx + 7, ly - 5], [lx + 7, ly + 6], [lx + 3, ly + 4]], T.on ? '#ffffff' : '#c8b878');
  ctx.lineWidth = 2; ctx.strokeStyle = T.vide ? '#ff3a2a' : '#6ee03a';
  ctx.beginPath(); ctx.arc(lx, ly, mode === 'bouton' ? BT.r + 3 : 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * T.pile); ctx.stroke();
  if (J.aide > 0) {
    const a = Math.min(1, J.aide);
    ecrire(ctx, mode === 'bouton' ? 'POUCE GAUCHE : TORCHE' : 'GAUCHE DE LA LIGNE : TORCHE', mode === 'bouton' ? 48 : 60, 132, { coul: '#fff27a', contour: NOIR, alpha: a });
    ecrire(ctx, 'DOIGT DROIT : RAYON', 200, 132, { coul: '#ffffff', contour: NOIR, alpha: a });
  }
}
function P2(pts, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y); ctx.fill(); }

function finUI() {
  ctx.globalAlpha = 0.75; ctx.fillStyle = NOIR; ctx.fillRect(60, 46, 200, 84); ctx.globalAlpha = 1;
  ctx.strokeStyle = J.fin === 'gagne' ? '#ffd23a' : '#ff3a2a'; ctx.lineWidth = 2; ctx.strokeRect(61, 47, 198, 82);
  ecrire(ctx, J.fin === 'gagne' ? 'CAPTURÉ !' : 'PERDU', 160, 56, { centre: true, sc: 3, coul: J.fin === 'gagne' ? '#ffd23a' : '#ff5a3a', contour: NOIR });
  ecrire(ctx, 'LIGNES CASSÉES : ' + J.casses, 160, 86, { centre: true, coul: '#ffffff' });
  ecrire(ctx, 'SURCHAUFFES : ' + J.surchauffes + '   ÉCHAPPÉS : ' + J.echappes, 160, 98, { centre: true, coul: '#c8b8e0' });
  if (J.finT > 0.8) ecrire(ctx, 'TOUCHE POUR REJOUER', 160, 114, { centre: true, coul: '#fff27a', alpha: 0.6 + 0.4 * Math.sin(J.t * 5) });
}

// ---------- la boucle ----------
let acc = 0, avant = performance.now();
function boucle(t) {
  requestAnimationFrame(boucle);
  acc += Math.min(0.1, (t - avant) / 1000); avant = t;
  if (!window.__fige) while (acc >= DT) { pas(); acc -= DT; }
  else acc = 0;
  dessiner();
}
requestAnimationFrame(boucle);

// pour les bancs : lire la partie, la piloter, avancer sans attendre
window.__m = { get J() { return J; }, nouvelle, mode: (m) => { if (m) mode = m; return mode; }, avancer: (n, voir = false) => { for (let i = 0; i < n; i++) pas(); if (voir) dessiner(); } };
