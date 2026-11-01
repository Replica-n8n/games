// Le boss vaincu ne s'aspire pas d'un coup : il se PÊCHE (règles dans PECHE, constantes.js),
// puis le piège l'avale dans un tourbillon (ASPIRE). Pendant ce temps le rayon ne sert qu'à
// ça : `pasPartie` appelle `pecher` ou `aspirer` à la place de `rayon`.
import { DT, PECHE, ASPIRE, ECHAPPE, CANON, SCEAU } from './constantes.js';
import { ESPECES } from '../contenu/especes.js';
import { evt } from './fantomes.js';
import { capturer } from './rayon.js';
import { ouvrirSceau } from './sceaux.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Les règles de la pêche pour ce boss : `niveau` 0 (le maître d'hôtel) à 3 (la gouvernante). @param {any} e */
export function reglesPeche(e) {
  const n = ESPECES[e.type].peche || 0;
  return {
    // l'élan reste annoncé aussi longtemps partout : c'est ce qui permet à un enfant de suivre
    // (mesuré au robot enfant : un rien de chauffe en plus par coup triplait les lignes cassées)
    tire: PECHE.tire * (1 - 0.06 * n), coupChauffe: PECHE.coupChauffe, annonce: PECHE.annonce,
    entreCoups: PECHE.entreCoups,
  };
}

/** La vie du boss est vide : on le tient, la pêche commence. @param {any} p @param {any} e */
export function debutPeche(p, e) {
  if (p.peche || p.aspire) return;
  e.pv = 0; e.bouclier = false; e.etourdi = 0; p.tenu = null;
  // ce qui reste dans la salle part avec lui (tirs, livres, renforts), et plus rien ne sort
  for (const f of p.ents) if (f !== e && (f.hostile || f.garde) && f.etat !== 'cap') capturer(p, f, 1, true);
  p.attente = []; for (const k in p.s.alerte) p.s.alerte[k] = 0;
  const dir = e.x < 160 ? -1 : 1, R = reglesPeche(e);
  p.peche = {
    e, R, prog: (e.meilleure || 0) * PECHE.fatigue, force: Math.pow(PECHE.pitie, e.casses || 0), x0: e.x, y0: e.y, dir,
    tDir: 2.8, coup: 0, tCoup: 2.4, bien: false, annonce: false, dejaAnnonce: false,
    zx: clamp(e.x - dir * PECHE.ecart, 20, 300), zy: clamp(e.y + 18, 40, 148),
  };
  p.chauffe = Math.min(p.chauffe, 0.2); p.surchauffe = false;
  evt(p, { type: 'texte', s: 'ATTRAPE-LE !', x: 160, y: 30, col: '#fff27a', sc: 2 });
  evt(p, { type: 'texte', s: 'DOIGT DANS LE CERCLE', x: 160, y: 50, col: '#6ee03a' });
  evt(p, { type: 'son', nom: 'pret' }); evt(p, { type: 'vibre', ms: 60 });
}

/** Un pas de pêche. @param {any} p @param {{x: number, y: number, bas: boolean}} entree */
export function pecher(p, entree) {
  const P = p.peche, b = P.e, R = P.R, v = p.visee;
  v.vx = (entree.x - v.x) / DT; v.vy = (entree.y - v.y) / DT; v.x = entree.x; v.y = entree.y;
  p.sous = null; p.ricoche = false; p.vise = null;
  P.tDir -= DT;
  if (P.tDir <= 0 && P.coup <= 0 && !P.annonce) { P.dir = -P.dir; P.tDir = p.h.entre(PECHE.entreSens[0], PECHE.entreSens[1]); }
  if (P.coup > 0) { P.coup -= DT; if (P.coup <= 0) { P.tCoup = p.h.entre(R.entreCoups[0], R.entreCoups[1]); P.dejaAnnonce = false; } }
  else {
    P.tCoup -= DT;
    if (P.tCoup <= 0) {
      P.coup = PECHE.coup;
      evt(p, { type: 'son', nom: 'elan' }); evt(p, { type: 'secousse', f: 0.25 }); evt(p, { type: 'vibre', ms: 90 });
      evt(p, { type: 'eclats', x: b.x, y: b.y, n: 10, col: '#6ee03a' });
    }
  }
  P.annonce = P.coup <= 0 && P.tCoup < R.annonce;
  if (P.annonce && !P.dejaAnnonce) { P.dejaAnnonce = true; evt(p, { type: 'son', nom: 'grogne' }); }
  // il recule vers le piège à mesure qu'on le ramène ; il tire de son côté, prend son élan
  // (recule un peu, gonfle) puis bondit
  const cx = P.x0 + (CANON.x - P.x0) * P.prog * 0.85, cy = P.y0 + (128 - P.y0) * P.prog;
  b.x = clamp(cx + P.dir * (P.coup > 0 ? 30 : P.annonce ? 4 : 14), 30, 290);
  b.y = cy + Math.sin(p.t * 5) * 2;
  b.s = 1.25 - P.prog * 0.45;
  // le cercle : à l'opposé du boss, ou de SON côté quand il s'élance (il y glisse pendant l'élan)
  const suit = P.coup > 0 || P.annonce;
  const zx = clamp(b.x + (suit ? P.dir * PECHE.ecart * 0.8 : -P.dir * PECHE.ecart), 20, 300), zy = clamp(b.y + 18, 40, 148);
  const k = 1 - Math.exp(-DT * (suit ? 6 : 3.5));
  P.zx += (zx - P.zx) * k; P.zy += (zy - P.zy) * k;
  p.tire = !!entree.bas;
  p.tenu = p.tire ? b : null;
  if (p.tire) {
    P.bien = Math.hypot(v.x - P.zx, v.y - P.zy) < PECHE.cercle + PECHE.marge;
    if (P.coup > 0) { p.chauffe += (P.bien ? PECHE.coupDoux : R.coupChauffe * P.force) * DT; P.prog -= PECHE.coupRecul * (P.bien ? 0.3 : 1) * DT; }
    else if (P.bien) { P.prog += R.tire * DT; p.chauffe = Math.max(0, p.chauffe + PECHE.tireChauffe * DT); }
    else { P.prog -= PECHE.horsRecul * DT; p.chauffe += PECHE.horsChauffe * DT; }
    if (p.chauffe >= 1) return casser(p);
  } else {
    P.bien = false; P.prog -= PECHE.lacheRecul * DT;
    p.chauffe = Math.max(0, p.chauffe - 0.55 * DT);
  }
  P.prog = Math.max(0, P.prog); b.meilleure = Math.max(b.meilleure || 0, P.prog);
  if (P.prog >= 1) {
    p.peche = null; p.tire = false; p.tenu = null;
    // aux combles, la Gouvernante se débat encore : des sceaux d'affilée avant le piège
    if ((p.mission.actions || {}).sceaux) ouvrirSceau(p, b, SCEAU.boss);
    else debutAspire(p, b);
  }
}

/** Le piège s'ouvre et avale le boss. @param {any} p @param {any} b */
export function debutAspire(p, b) {
  p.aspire = { e: b, t: 0, x0: b.x, y0: b.y, ang: 0, r: 0, r0: 0, cy: ASPIRE.cy, spin: 0, taille: 1, etire: 1, dedans: false, bonk: 0, bonks: 0 };
  evt(p, { type: 'son', nom: 'clac' }); evt(p, { type: 'vibre', ms: 120 });
}

/** La ligne casse (ou un sceau de la Gouvernante se brise) : il repart avec un quart de sa vie, et le combat reprend. @param {any} p */
export function casser(p, b = p.peche.e, texte = 'LA LIGNE CASSE !') {
  // le rayon reste chaud mais ne se bloque pas : bloqué, l'enfant restait sans arme devant les
  // notes du Chef et perdait 4 parties sur 10 au bal (mesuré au robot)
  p.chauffe = 0.6; p.surchauffe = false; p.peche = null; p.tenu = null; p.tire = false; p.casses++;
  b.casses = (b.casses || 0) + 1; b.pv = b.pv0 * PECHE.casse; b.s = 1.25; b.tTir = 1.6;
  evt(p, { type: 'texte', s: texte, x: 160, y: 34, col: '#ff5a3a', sc: 2 });
  evt(p, { type: 'son', nom: 'casse' }); evt(p, { type: 'secousse', f: 0.35 }); evt(p, { type: 'vibre', ms: 300 });
  evt(p, { type: 'eclats', x: b.x, y: b.y + 20, n: 14, col: '#ff3fa4' });
}

/**
 * Le mafuba : le piège s'ouvre en grand, un tourbillon vert se lève, le boss panique, s'agrippe
 * trois fois, tourne de plus en plus vite et y passe ; le couvercle claque, ça cogne dedans,
 * puis plus rien. @param {any} p
 */
export function aspirer(p) {
  const A = p.aspire, b = A.e, t = (A.t += DT);
  p.tire = false; p.tenu = null;
  if (t < ASPIRE.choc) {
    // le choc : il sursaute sur place
    b.y = A.y0 - Math.sin((t / ASPIRE.choc) * Math.PI) * 8;
    A.r0 = A.r = Math.max(40, Math.hypot(b.x - ASPIRE.cx, b.y - ASPIRE.cy)); A.ang = Math.atan2(b.y - ASPIRE.cy, b.x - ASPIRE.cx);
    if (t + DT >= ASPIRE.choc) { evt(p, { type: 'son', nom: 'tourbillon' }); evt(p, { type: 'vibre', ms: 200 }); }
    return;
  }
  if (t < ASPIRE.lutte) {
    // il tourne et se rapproche, mais s'agrippe trois fois (il remonte d'un coup)
    const k = (t - ASPIRE.choc) / (ASPIRE.lutte - ASPIRE.choc);
    const agrippe = Math.pow(Math.max(0, Math.sin(k * Math.PI * 3)), 3) * 16 * (1 - k);
    A.r = A.r0 * (1 - 0.72 * k) + agrippe;
    A.ang += DT * (1.6 + k * 5) * (1 - agrippe / 24);
    A.spin = Math.sin(t * 9) * 0.5 + k * 0.8; A.etire = 1 + 0.15 * Math.sin(t * 13);
    if (((t * 60) | 0) % 14 === 0) evt(p, { type: 'son', nom: 'cri' });
  } else if (t < ASPIRE.avale) {
    // il y passe : de plus en plus petit, étiré, en toupie, et le cœur du tourbillon descend dans le piège
    const k = (t - ASPIRE.lutte) / (ASPIRE.avale - ASPIRE.lutte);
    A.r = A.r0 * 0.28 * (1 - k * k); A.ang += DT * 14; A.spin += DT * 24; A.taille = 1 - 0.9 * k; A.etire = 1 + 1.6 * k;
    A.cy = ASPIRE.cy + (CANON.y - ASPIRE.cy) * k * k;
  } else if (!A.dedans) {
    A.dedans = true;
    evt(p, { type: 'son', nom: 'clac' }); evt(p, { type: 'secousse', f: 0.45 }); evt(p, { type: 'vibre', ms: 260 });
    evt(p, { type: 'eclats', x: CANON.x, y: CANON.y, n: 18, col: '#6ee03a' });
  }
  b.x = ASPIRE.cx + Math.cos(A.ang) * A.r; b.y = A.cy + Math.sin(A.ang) * A.r * 0.8;
  // dedans, il cogne contre le couvercle, trois fois
  A.bonk = Math.max(0, A.bonk - DT);
  if (A.dedans && A.bonks < ASPIRE.bonks.length && t >= ASPIRE.bonks[A.bonks]) {
    A.bonks++; A.bonk = 0.2; evt(p, { type: 'son', nom: 'bonk' }); evt(p, { type: 'vibre', ms: 40 });
  }
  if (t >= ASPIRE.fin) {
    p.aspire = null; b.pris = true;
    capturer(p, b, 1, true); b.mort = true;
    evt(p, { type: 'texte', s: 'CAPTURÉ !', x: 160, y: 70, col: '#ffd23a', sc: 2 });
  }
}

/** La surchauffe fait lâcher le fantôme tenu : il s'échappe, requinqué. @param {any} p */
export function echapper(p) {
  const e = p.tenu;
  if (!e || e.etat !== 'vit' || e.mort || !e.hostile || e.tir) return;
  if (e.boss) e.pv = Math.min(e.pv0, e.pv + ECHAPPE.boss);
  else { e.pv = e.pv0; e.s = Math.max(0.5, e.s - ECHAPPE.recul); e.revele = 0; }
  p.echappes++;
  evt(p, { type: 'texte', s: "IL S'ÉCHAPPE !", x: e.x, y: e.y - 26, col: '#ff8aa0' });
}
