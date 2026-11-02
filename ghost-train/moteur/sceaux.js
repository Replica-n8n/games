// Les sceaux (combles) : un coriace aspiré jusqu'à SCEAU.seuil est sonné, et un sceau s'ouvre
// autour de lui : un signe d'alchimiste à verser en sel, en un ou deux traits. Le doigt le trace là où il est (`fx`, `fy` : sans le décalage du
// viseur). Pendant ce temps, `pasPartie` appelle `sceller` à la place de `rayon`, et le reste de
// la salle avance au ralenti. La Gouvernante pêchée en demande SCEAU.boss d'affilée avant le piège.
import { DT, SCEAU, W, H, MANIES } from './constantes.js';
import { evt } from './fantomes.js';
import { capturer } from './rayon.js';
import { debutAspire, casser } from './peche.js';

const cercle = (r, n = 40) => Array.from({ length: n + 1 }, (_, k) => { const a = -Math.PI / 2 + (k / n) * Math.PI * 2; return [Math.cos(a) * r, Math.sin(a) * r]; });
const etoile = Array.from({ length: 6 }, (_, k) => { const a = -Math.PI / 2 + k * (Math.PI * 4 / 5); return [Math.cos(a) * 0.95, Math.sin(a) * 0.95]; });
const haut = [[0, -0.9], [0.85, 0.6], [-0.85, 0.6], [0, -0.9]], bas = [[0, 0.9], [-0.85, -0.6], [0.85, -0.6], [0, 0.9]];
const ferme = (pts) => Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 0.01;
/**
 * Les sceaux de sel (maquette validée par Julie le 2026-11-01) : des signes d'alchimiste, en
 * unités de -1 à 1, versés autour du fantôme. Chacun est une liste de TRAITS, tracés dans
 * l'ordre ; un trait fermé (qui revient à son départ) se prend dans les deux sens, un trait
 * ouvert par l'un ou l'autre bout.
 */
export const FORMES = {
  feu: [haut],
  eau: [bas],
  etoile: [etoile],
  sel: [cercle(0.85), [[-0.85, 0], [0.85, 0]]],
  air: [haut, [[-0.62, 0.05], [0.62, 0.05]]],
  pentacle: [etoile, cercle(1.05, 44)],
};

/** Où écrire pendant un sceau : sous lui s'il est haut, au-dessus sinon (jamais sur le dessin). @param {any} S */
const ligne = (S) => (S.cy < 90 ? S.cy + S.r + 22 : Math.max(36, S.cy - S.r - 30));

/** Ce fantôme demande-t-il un sceau ? @param {any} p @param {any} e */
export const scellable = (p, e) => !!(p.mission.actions || {}).sceaux && !e.boss && !e.tir && !!e.sceau;

/** Les jalons d'un trait, tous les SCEAU.pas pixels. @param {number[][]} coins */
function jalonner(coins) {
  const jalons = [coins[0]];
  for (let i = 1; i < coins.length; i++) {
    const [ax, ay] = coins[i - 1], [bx, by] = coins[i], k = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / SCEAU.pas));
    for (let j = 1; j <= k; j++) jalons.push([ax + (bx - ax) * j / k, ay + (by - ay) * j / k]);
  }
  return jalons;
}

/** Ouvre un sceau sur `e` ; `total` sceaux d'affilée (la Gouvernante, qui tire les grands). @param {any} p @param {any} e */
export function ouvrirSceau(p, e, total = 1, n = 0) {
  const M = p.mission.sceaux || {}, formes = (e.boss && M.boss) || M[p.salle] || ['feu'];
  const nom = p.h.choix(formes), r = e.boss ? SCEAU.rBoss : SCEAU.r;
  const cx = Math.max(r + 12, Math.min(W - r - 12, e.x)), cy = Math.max(r + 18, Math.min(H - r - 24, e.y));
  const traits = FORMES[nom].map((pts) => { const coins = pts.map(([x, y]) => [cx + x * r, cy + y * r]); return { coins, jalons: jalonner(coins), ferme: ferme(pts) }; });
  // le temps suit la longueur de sel à verser (un pentacle en demande trois fois plus qu'un triangle)
  const long = traits.reduce((a, T) => a + T.coins.slice(1).reduce((b, q, i) => b + Math.hypot(q[0] - T.coins[i][0], q[1] - T.coins[i][1]), 0), 0);
  // un fantôme pris par surprise (manies.js) laisse plus de temps
  const duree = (SCEAU.duree + long / (e.boss ? SCEAU.vitesseBoss : SCEAU.vitesse)) * (e.surpris ? MANIES.sceau : 1);
  // le doigt qui aspirait est encore posé : il devra se lever avant de tracer
  p.sceau = { e, forme: nom, traits, i: 0, jalons: traits[0].jalons, cx, cy, r, duree, reste: duree, total, n, trace: null, leve: false, t: 0 };
  p.tenu = null; p.tire = false;
  if (n === 0) {
    evt(p, { type: 'texte', s: e.boss ? 'ELLE SE DÉBAT ! VERSE LES SCEAUX' : 'SONNÉ ! VERSE LE SCEAU', x: 160, y: ligne(p.sceau), col: '#fff27a' });
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
  const T0 = S.traits[S.i];
  if (!entree.bas) {
    // lever le doigt efface le trait en cours, jamais ceux qui sont finis
    if (S.trace) evt(p, { type: 'texte', s: 'SANS LEVER LE DOIGT !', x: 160, y: ligne(S), col: '#fff27a' });
    S.leve = true; S.trace = null;
  } else if (S.leve && !S.trace) {
    // le doigt se pose : il part d'un bout (ou de l'autre), sinon on lui montre le point
    const a = T0.jalons, z = a.length - 1, pres = (q) => Math.hypot(x - q[0], y - q[1]) < SCEAU.depart, cand = [];
    if (pres(a[0])) { cand.push({ l: a, i: 1 }); if (T0.ferme) cand.push({ l: [...a].reverse(), i: 1 }); }
    if (!T0.ferme && pres(a[z])) cand.push({ l: [...a].reverse(), i: 1 });
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
    if (T.cand.some((c) => c.i >= c.l.length)) {
      // ce trait est versé : le suivant, s'il y en a un (le doigt se lève et repart de son point)
      if (S.i + 1 >= S.traits.length) return reussir(p);
      S.i++; S.jalons = S.traits[S.i].jalons; S.trace = null; S.leve = false;
      evt(p, { type: 'son', nom: 'pop' });
    }
  }
  if (S.reste <= 0) rater(p);
}

/** Où en est le tracé, de 0 à 1 (pour l'écran et les bancs). @param {any} S */
export function avance(S) {
  const enCours = S.trace ? Math.max(...S.trace.cand.map((c) => (c.i - 1) / (c.l.length - 1))) : 0;
  return (S.i + enCours) / S.traits.length;
}

function reussir(p) {
  const S = p.sceau, e = S.e;
  p.sceaux++;
  // le sel s'illumine (l'écran le garde un instant), et le fantôme est pris
  evt(p, { type: 'sel', traits: S.traits.map((T) => T.coins), eclat: true }); evt(p, { type: 'son', nom: 'parfait' }); evt(p, { type: 'vibre', ms: 40 });
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
  // le sel déjà versé s'éparpille
  evt(p, { type: 'sel', traits: S.traits.slice(0, S.i).map((T) => T.coins), brise: true });
  evt(p, { type: 'son', nom: 'casse' }); evt(p, { type: 'secousse', f: 0.25 });
  // la Gouvernante se libère comme d'une ligne cassée
  if (e.boss) { casser(p, e, 'ELLE SE LIBÈRE !'); return; }
  e.pv = e.pv0 * SCEAU.rate;
  evt(p, { type: 'texte', s: 'RATÉ ! IL REPREND DES FORCES', x: 160, y: 150, col: '#ff5a3a' });
}
