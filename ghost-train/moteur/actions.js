// Ghost Train : le rayon de capture. On vise en pixels d'écran ; le rayon tient
// ce qui est sous le viseur, chauffe, et capture le fantôme dont les points de
// vie tombent à zéro. Viser Lumi coûte un cœur ; viser un panneau choisit la
// voie ; viser un secret du décor le range au dossier.
import { RAYON } from './constantes.js';
import { dans } from './projection.js';
import { evt, son, moment } from './evenements.js';
import { coup } from './joueur.js';
import { basculer } from './rail.js';
import { ESPECES } from '../contenu/especes.js';

/** @param {any} p @param {any} e */
const touchable = (p, e) => e.etat === 'vit' && !e.mort && !!e.boite && !(e.type === 'majordome' && e.entree < 1.6);

/** Ce qui est sous le viseur : le plus prioritaire, puis le plus proche. @param {any} p @param {number} x @param {number} y */
export function viser(p, x, y) {
  let mieux = null;
  for (const e of p.ents) {
    if (!touchable(p, e) || !dans(e.boite, x, y, p.options.marge)) continue;
    if (!mieux || e.prio < mieux.prio || (e.prio === mieux.prio && e.z < mieux.z)) mieux = e;
  }
  return mieux;
}

/** @param {any} p @param {any} e */
function capturer(p, e) {
  e.etat = 'cap'; e.ct = 0; e.cdur = e.type === 'majordome' ? 1.8 : 0.7;
  e.capX = e.boite.cx; e.capY = e.boite.cy; e.capT = e.boite.w;
  p.prises++;
  const page = ESPECES[e.type].carnet;
  if (page) p.captures[page] = (p.captures[page] || 0) + 1;
  // sur une voie qui paie double (le vestiaire), chaque capture rapporte `gain` fois plus
  const n = e.pieces * (p.gain || 1);
  p.pieces += n;
  evt(p, { type: 'pieces', n, x: e.boite.cx, y: e.boite.cy });
  son(p, 'capture'); moment(p, 'capture');
  if (e === p.boss) {
    p.tFin = 2.4;
    for (const l of p.ents) if (l.type === 'leurre' || l.type === 'assiette') { l.mort = true; evt(p, { type: 'pouf', x: l.boite?.cx, y: l.boite?.cy }); }
    son(p, 'victoire');
  }
}

/** Le rayon agit sur e pendant dt. @param {any} p @param {any} e @param {number} dt */
function frapper(p, e, dt) {
  const P = RAYON.puissance * p.options.puissance;
  switch (e.type) {
    case 'lumi':
      e.etat = 'fuite'; p.lumi.touche = true;
      coup(p, true); son(p, 'triste'); moment(p, 'lumiTouche');
      return;
    case 'assiette': case 'leurre':
      e.pv -= P * dt;
      if (e.pv <= 0) {
        e.mort = true; evt(p, { type: 'pouf', x: e.boite.cx, y: e.boite.cy });
        son(p, e.type === 'leurre' ? 'rire' : 'pop');
        if (e.type === 'leurre') moment(p, 'leurre');
      }
      return;
    case 'levier':
      e.vise = true;
      if (e.verrouille) return;
      e.charge += dt;
      if (e.charge >= 0.35) { e.charge = 0; e.verrouille = true; basculer(p); }
      return;
    case 'secret':
      e.charge += dt;
      if (e.charge >= 0.5) {
        e.mort = true; p.secrets.push(e.id);
        evt(p, { type: 'secret', id: e.id, x: e.boite.cx, y: e.boite.cy });
        son(p, 'secret'); moment(p, 'secret');
      }
      return;
  }
  if (!e.lutte) return;
  e.tenu = true;
  e.pv -= P * RAYON.faible * dt;
  if (e.pv <= 0) capturer(p, e);
}

/**
 * @param {any} p
 * @param {{x: number, y: number, tire: boolean}} entree
 * @param {number} dt
 */
export function pasRayon(p, entree, dt) {
  p.visee.x = entree.x; p.visee.y = entree.y;
  // ce qui est sous le viseur, même sans tirer : l'écran colore le viseur (Lumi en rose)
  p.sous = viser(p, entree.x, entree.y);
  for (const e of p.ents) e.tenu = false;
  if (p.surchauffe > 0) {
    p.surchauffe -= dt;
    if (p.surchauffe <= 0) { p.surchauffe = 0; p.chauffe = RAYON.reprise; moment(p, 'refroidi'); }
  }
  p.tire = entree.tire && p.surchauffe <= 0 && p.etat === 'jeu';
  p.cibleRayon = null;
  if (!p.tire) {
    p.verrou = null;
    if (p.surchauffe <= 0) p.chauffe = Math.max(0, p.chauffe - RAYON.refroidit * dt);
    return;
  }
  p.chauffe += RAYON.chauffe * p.options.chauffe * dt;
  if (p.chauffe >= RAYON.alerte) moment(p, 'chaud');
  if (p.chauffe >= 1) {
    p.chauffe = 1; p.surchauffe = RAYON.surchauffe; p.verrou = null; p.tire = false;
    son(p, 'surchauffe'); moment(p, 'surchauffe');
    return;
  }
  // Le verrou garde le fantôme tenu même si le viseur glisse un peu : il se débat.
  // Mais ce qui passe DEVANT lui sous le viseur gagne : sinon une assiette lancée
  // par le Majordome ne se visait plus tant que le rayon le tenait.
  const v = p.verrou, direct = viser(p, entree.x, entree.y);
  const garde = v && touchable(p, v) && dans(v.boite, entree.x, entree.y, p.options.verrou) && !(direct && direct !== v && direct.z < v.z);
  const c = garde ? v : direct;
  p.verrou = c && c.lutte ? c : null;
  p.cibleRayon = c;
  if (c) frapper(p, c, dt);
}
