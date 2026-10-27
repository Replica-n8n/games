// Une partie : une mission de trois salles. Dans chaque salle, un déroulé fait
// sortir les fantômes des cachettes ; quand la salle est vide, on glisse à la
// suivante (« passage »). La partie ne dessine rien : elle laisse des événements
// (sons, textes, pièces, bave) que l'écran et le son lisent et vident.
import { DT, COEURS, ALERTE, PASSAGE } from './constantes.js';
import { creeHasard } from './hasard.js';
import { naitre, bouger, evt } from './fantomes.js';
import { rayon, objets } from './rayon.js';
import { noteDe } from './notes.js';
import { SALLES } from '../contenu/salles.js';
import { ESPECES } from '../contenu/especes.js';

/**
 * @param {{mission: any, graine?: number, options?: {marge?: number, invincible?: boolean}}} o
 */
export function creePartie(o) {
  const p = {
    mission: o.mission, h: creeHasard(o.graine || 1), options: o.options || {},
    t: 0, coeurs: COEURS, coeursPerdus: 0, pieces: 0, captures: 0, vus: 0, parEspece: {},
    chauffe: 0, surchauffe: false, tire: false, tenu: null, vise: null, visee: { x: 160, y: 90 },
    evenements: [], etat: 'jeu', tPassage: 0, bilan: null,
    // la salle en cours (remplie par entrer)
    n: 0, salle: '', ts: 0, ents: [], attente: [], deroule: [], s: null, consigne: null, titre: 0, boss: null, nettoyee: 0,
  };
  entrer(p, 0);
  return p;
}

/** L'état d'une salle : ses alertes, ses cachettes ouvertes, ses objets. */
export function etatSalle(id) {
  const S = SALLES[id];
  const zero = () => Object.fromEntries(Object.keys(S.cachettes).map((k) => [k, 0]));
  return { alerte: zero(), ouvert: zero(), objets: Object.fromEntries(S.objets.map((ob) => [ob.id, { ...ob, charge: 0 }])) };
}

/** @param {any} p @param {number} n */
function entrer(p, n) {
  p.n = n; p.salle = p.mission.salles[n]; p.ts = 0; p.ents = []; p.attente = [];
  p.deroule = p.mission.deroules[p.salle].map((a) => a.slice());
  p.s = etatSalle(p.salle); p.boss = null; p.nettoyee = 0; p.titre = 2; p.tenu = null; p.consigne = null;
  if (n > 0) evt(p, { type: 'son', nom: 'depart' });
}

/** Un pas de 1/60 s. @param {any} p @param {{x: number, y: number, bas: boolean}} entree */
export function pasPartie(p, entree) {
  if (p.etat === 'fini' || p.etat === 'mort') return;
  p.t += DT;
  if (p.etat === 'passage') {
    p.tPassage += DT; p.tire = false;
    if (p.tPassage >= PASSAGE) { p.etat = 'jeu'; entrer(p, p.n + 1); }
    return;
  }
  p.ts += DT;
  const S = SALLES[p.salle], st = p.s;
  for (const k in st.alerte) st.alerte[k] = Math.max(0, st.alerte[k] - DT);
  for (const k in st.ouvert) st.ouvert[k] = Math.max(0, st.ouvert[k] - DT * 0.7);
  if (p.titre > 0) p.titre -= DT;
  if (p.consigne) { p.consigne.t -= DT; if (p.consigne.t <= 0) p.consigne = null; }

  // le déroulé de la salle
  while (p.deroule.length && p.ts >= p.deroule[0][0]) {
    const [, quoi, a, b, c] = p.deroule[0];
    if (quoi === 'attendre') {
      if (p.ents.some((e) => e.hostile) || p.attente.length) { p.ts = p.deroule[0][0]; break; }
      p.deroule.shift(); continue;
    }
    p.deroule.shift();
    if (quoi === 'consigne') p.consigne = { texte: a, t: b };
    else if (quoi === 'sort') { st.alerte[b] = ALERTE; p.attente.push({ t: ALERTE, type: a, cachette: b, vise: c || 0 }); }
    else if (quoi === 'chat') { st.alerte[a] = ALERTE; p.attente.push({ t: ALERTE, type: 'chat', cachette: a, vise: 0 }); }
    else if (quoi === 'boss') { st.alerte[a] = ALERTE * 1.5; p.attente.push({ t: ALERTE * 1.5, type: p.mission.boss, cachette: a, vise: 0 }); }
    else if (quoi === 'bou') {
      const e = naitre(p, 'drap', p.h.entre(110, 210), 92, 1.7); e.croit = 0.5; e.etat = 'vit';
      evt(p, { type: 'texte', s: 'BOU !', x: e.x, y: 40, col: '#ffffff', sc: 3 }); evt(p, { type: 'secousse', f: 0.35 }); evt(p, { type: 'son', nom: 'rire' });
    }
  }
  for (const a of p.attente) {
    a.t -= DT;
    if (a.t > 0) continue;
    const c = S.cachettes[a.cachette];
    st.ouvert[a.cachette] = 1;
    const e = naitre(p, a.type, c.x, c.y, c.s * 0.4);
    e.cible = c.s; e.vise = a.vise;
    if (e.boss) { p.boss = e; e.cible = 1.25; evt(p, { type: 'texte', s: ESPECES[e.type].nom + ' !', x: 160, y: 40, col: '#ff8ad0', sc: 2 }); evt(p, { type: 'son', nom: 'boss' }); }
    else evt(p, { type: 'son', nom: a.type === 'chat' ? 'pop' : 'pouf' });
  }
  p.attente = p.attente.filter((a) => a.t > 0);

  for (const e of p.ents) bouger(p, e);
  if (p.coeurs <= 0) return finir(p, false);
  objets(p);
  rayon(p, entree);
  p.ents = p.ents.filter((e) => !e.mort);

  // la salle est vide : on passe à la suivante, ou la mission est finie
  if (!p.deroule.length && !p.attente.length && !p.ents.length) {
    if (!p.nettoyee) {
      const der = p.n + 1 >= p.mission.salles.length;
      p.nettoyee = 1.6;
      evt(p, { type: 'texte', s: der ? 'L\'ÉTAGE EST PROPRE !' : 'SALLE NETTOYÉE !', x: 160, y: 60, col: '#fff27a', sc: 2 });
      evt(p, { type: 'son', nom: 'victoire' });
    }
    p.nettoyee -= DT;
    if (p.nettoyee <= 0) {
      if (p.n + 1 < p.mission.salles.length) { p.etat = 'passage'; p.tPassage = 0; p.tire = false; p.tenu = null; }
      else finir(p, true);
    }
  }
}

/** @param {any} p @param {boolean} fini */
function finir(p, fini) {
  p.etat = fini ? 'fini' : 'mort'; p.tire = false;
  const b = { mission: p.mission.id, fini, pieces: p.pieces, captures: { ...p.parEspece }, prises: p.captures, total: p.vus, coeursPerdus: p.coeursPerdus, lumi: 'aucun', duree: p.t, salles: p.n + (fini ? 1 : 0), note: null };
  b.note = fini ? noteDe(b) : null;
  p.bilan = b;
}
