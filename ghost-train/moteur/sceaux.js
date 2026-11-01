// Les sceaux (combles) : un coriace aspiré jusqu'à SCEAU.seuil est sonné, et un sceau s'ouvre
// sur lui. Le doigt le trace d'un seul trait, là où il est (`fx`, `fy` : sans le décalage du
// viseur). Pendant ce temps, `pasPartie` appelle `sceller` à la place de `rayon`, et le reste de
// la salle avance au ralenti. La Gouvernante pêchée en demande SCEAU.boss d'affilée avant le piège.
import { DT, SCEAU, W, H } from './constantes.js';
import { evt } from './fantomes.js';
import { capturer } from './rayon.js';
import { debutAspire, casser } from './peche.js';

const rond = (n) => Array.from({ length: n + 1 }, (_, k) => { const a = -Math.PI / 2 + (k / n) * Math.PI * 2; return [Math.cos(a) * 0.9, Math.sin(a) * 0.9]; });
/** Les formes, en unités de -1 à 1 ; `ferme` : un trait qui revient à son départ. */
export const FORMES = {
  trait: { pts: [[-1, 0], [1, 0]] },
  v: { pts: [[-0.9, -0.8], [0, 0.8], [0.9, -0.8]] },
  z: { pts: [[-0.9, -0.8], [0.9, -0.8], [-0.9, 0.8], [0.9, 0.8]] },
  rond: { pts: rond(24), ferme: true },
  vague: { pts: Array.from({ length: 17 }, (_, k) => { const x = -1 + k / 8; return [x, -Math.sin((x + 1) * Math.PI) * 0.55]; }) },
  triangle: { pts: [[0, -0.9], [0.9, 0.8], [-0.9, 0.8], [0, -0.9]], ferme: true },
};

/** Où écrire pendant un sceau : sous lui s'il est haut, au-dessus sinon (jamais sur le dessin). @param {any} S */
const ligne = (S) => (S.cy < 90 ? S.cy + S.r + 22 : Math.max(36, S.cy - S.r - 30));

/** Ce fantôme demande-t-il un sceau ? @param {any} p @param {any} e */
export const scellable = (p, e) => !!(p.mission.actions || {}).sceaux && !e.boss && !e.tir && !!e.sceau;

/** Ouvre un sceau sur `e` ; `total` sceaux d'affilée (la Gouvernante). @param {any} p @param {any} e */
export function ouvrirSceau(p, e, total = 1, n = 0) {
  const formes = (p.mission.sceaux || {})[p.salle] || ['trait'];
  const nom = p.h.choix(formes), f = FORMES[nom], r = e.boss ? SCEAU.rBoss : SCEAU.r;
  const cx = Math.max(r + 10, Math.min(W - r - 10, e.x)), cy = Math.max(r + 16, Math.min(H - r - 24, e.y));
  const coins = f.pts.map(([x, y]) => [cx + x * r, cy + y * r]), jalons = [coins[0]];
  for (let i = 1; i < coins.length; i++) {
    const [ax, ay] = coins[i - 1], [bx, by] = coins[i], k = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / SCEAU.pas));
    for (let j = 1; j <= k; j++) jalons.push([ax + (bx - ax) * j / k, ay + (by - ay) * j / k]);
  }
  const duree = e.boss ? SCEAU.dureeBoss : SCEAU.duree;
  // le doigt qui aspirait est encore posé : il devra se lever avant de tracer
  p.sceau = { e, forme: nom, ferme: !!f.ferme, coins, jalons, cx, cy, r, duree, reste: duree, total, n, trace: null, leve: false, t: 0 };
  p.tenu = null; p.tire = false;
  if (n === 0) {
    evt(p, { type: 'texte', s: e.boss ? 'ELLE SE DÉBAT ! TRACE LES SCEAUX' : 'SONNÉ ! TRACE LE SCEAU', x: 160, y: ligne(p.sceau), col: '#fff27a' });
    evt(p, { type: 'son', nom: 'pret' }); evt(p, { type: 'vibre', ms: 60 });
  }
}

/** Un pas de tracé. @param {any} p @param {{x: number, y: number, fx?: number, fy?: number, bas: boolean}} entree */
export function sceller(p, entree) {
  const S = p.sceau, e = S.e, x = entree.fx ?? entree.x, y = entree.fy ?? entree.y;
  p.tire = false; p.tenu = null; p.sous = null; p.vise = null; p.ricoche = false;
  p.visee.x = entree.x; p.visee.y = entree.y; p.visee.vx = 0; p.visee.vy = 0;
  p.chauffe = Math.max(0, p.chauffe - 0.55 * DT);
  // le fantôme a disparu (capturé autrement) : plus de sceau
  if (e.mort || e.etat === 'cap') { p.sceau = null; return; }
  S.t += DT; S.reste -= DT;
  if (!entree.bas) {
    if (S.trace) evt(p, { type: 'texte', s: "D'UN SEUL TRAIT !", x: 160, y: ligne(S), col: '#fff27a' });
    S.leve = true; S.trace = null;
  } else if (S.leve && !S.trace) {
    // le doigt se pose : il part d'un bout (ou de l'autre), sinon on lui montre le point
    const a = S.jalons, z = a.length - 1, pres = (q) => Math.hypot(x - q[0], y - q[1]) < SCEAU.depart, cand = [];
    if (pres(a[0])) { cand.push({ l: a, i: 1 }); if (S.ferme) cand.push({ l: [...a].reverse(), i: 1 }); }
    if (!S.ferme && pres(a[z])) cand.push({ l: [...a].reverse(), i: 1 });
    if (cand.length) S.trace = { cand, x, y };
    else { S.leve = false; evt(p, { type: 'texte', s: 'COMMENCE AU POINT QUI BRILLE', x: 160, y: ligne(S), col: '#fff27a' }); }
  } else if (S.trace) {
    // entre deux pas, le doigt a pu filer : on suit le chemin parcouru, tous les 3 pixels
    const T = S.trace, n = Math.max(1, Math.ceil(Math.hypot(x - T.x, y - T.y) / 3));
    for (let k = 1; k <= n; k++) {
      const px = T.x + (x - T.x) * k / n, py = T.y + (y - T.y) * k / n;
      for (const c of T.cand) while (c.i < c.l.length && Math.hypot(px - c.l[c.i][0], py - c.l[c.i][1]) < SCEAU.tol) c.i++;
    }
    T.x = x; T.y = y;
    if (T.cand.some((c) => c.i >= c.l.length)) return reussir(p);
  }
  if (S.reste <= 0) rater(p);
}

/** Où en est le tracé, de 0 à 1 (pour l'écran et les bancs). @param {any} S */
export function avance(S) {
  if (!S.trace) return 0;
  return Math.max(...S.trace.cand.map((c) => (c.i - 1) / (c.l.length - 1)));
}

function reussir(p) {
  const S = p.sceau, e = S.e;
  p.sceaux++;
  evt(p, { type: 'eclats', x: S.cx, y: S.cy, n: 16, col: '#fff27a' }); evt(p, { type: 'son', nom: 'parfait' }); evt(p, { type: 'vibre', ms: 40 });
  if (S.n + 1 < S.total) { p.sceau = null; ouvrirSceau(p, e, S.total, S.n + 1); evt(p, { type: 'texte', s: 'ENCORE !', x: 160, y: ligne(p.sceau), col: '#fff27a' }); return; }
  p.sceau = null;
  evt(p, { type: 'texte', s: 'SCELLÉ !', x: e.x, y: e.y - 24, col: '#6ee03a' });
  if (e.boss) { debutAspire(p, e); return; }
  p.pieces += SCEAU.bonus; evt(p, { type: 'pieces', x: e.x, y: e.y, n: SCEAU.bonus });
  capturer(p, e, 1);
}

function rater(p) {
  const S = p.sceau, e = S.e;
  p.sceau = null;
  evt(p, { type: 'son', nom: 'casse' }); evt(p, { type: 'secousse', f: 0.25 }); evt(p, { type: 'eclats', x: S.cx, y: S.cy, n: 12, col: '#ff3030' });
  // la Gouvernante se libère comme d'une ligne cassée
  if (e.boss) { casser(p, e, 'ELLE SE LIBÈRE !'); return; }
  e.pv = e.pv0 * SCEAU.rate;
  evt(p, { type: 'texte', s: 'RATÉ ! IL REPREND DES FORCES', x: 160, y: 150, col: '#ff5a3a' });
}
