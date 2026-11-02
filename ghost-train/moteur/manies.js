// Les manières des fantômes, d'après Luigi's Mansion (maquette `tools/mockup-ghost-train-mansion.html`,
// idées 1 à 3 choisies par Julie le 2026-11-02) : les MÊMES fantômes ne se prennent pas pareil.
//   ÉQUIPÉS (`e.equipe`) : la casserole (le rayon glisse sur le cuivre jusqu'à ce qu'elle brûle et
//     tombe), les lunettes noires (la torche ne l'éblouit pas ; éclairé, il les ôte pour rire ; il ne
//     s'aspire qu'étourdi), le masque (le rayon ne prend que sur le temps), le bonnet (il dort, voir
//     plus bas). Règles dans MANIES.
//   PRIS SUR LE FAIT (`e.occupe`) : déjà dans la salle à l'entrée, il mange, lit, danse ou ronfle et
//     ne vient pas vers nous. Le rayon sur lui le prend PAR SURPRISE (pièces doublées, il ne bouge
//     plus). S'il remarque quelque chose (sa `veille` est écoulée, la torche, un voisin capturé), il
//     file dans la cachette la plus proche et en ressort pour se battre.
//   CACHÉS (`p.caches`) : un fantôme (ou des pièces) dans un meuble, sans alerte. Le rayon posé sur la
//     cachette la fouille ; le meuble tremble de temps en temps pour qu'on ne reste pas bloqué. La salle
//     n'est finie que quand tous les cachés sont sortis.
import { DT, MANIES } from './constantes.js';
import { naitre, evt } from './fantomes.js';
import { SALLES } from '../contenu/salles.js';

const proche = (p, x, y) => Object.entries(SALLES[p.salle].cachettes).sort(([, a], [, b]) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0][0];

/** Lui met son équipement (les lunettes le rendent malin : il ne s'aspire qu'étourdi). @param {any} e @param {string|null} [equipe] */
export function equiper(e, equipe) { e.equipe = equipe || null; e.malin = equipe === 'lunettes'; return e; }

/** Un fantôme occupé, posé là dès l'entrée, en `pos` = [x, y, échelle, phase de sa danse]. @param {any} p @param {number[]} pos */
export function occuper(p, type, quoi, pos, equipe = null) {
  const [x, y, s, ph] = pos, e = equiper(naitre(p, type, x, y, s), equipe);
  e.etat = 'vit'; e.occupe = quoi; e.cible = s; if (ph !== undefined) e.ph = ph; e.veille = MANIES.veille[quoi]; e.ox = x; e.oy = y;
  return e;
}

/** Il nous a vus (« ! ») : il file dans la cachette la plus proche et en ressortira pour se battre. @param {any} p @param {any} e */
export function remarquer(p, e) {
  if (!e.occupe || e.surpris || e.mort) return;
  const c = proche(p, e.x, e.y);
  e.mort = true; p.vus--;
  if (p.tenu === e) p.tenu = null;
  p.s.alerte[c] = MANIES.retour; p.s.tremble[c] = 0;
  p.attente.push({ t: MANIES.retour, type: e.type, cachette: c, vise: 0, equipe: e.equipe === 'bonnet' ? null : e.equipe });
  evt(p, { type: 'texte', s: '!', x: e.x, y: e.y - 22, col: '#ff5a3a', sc: 2 }); evt(p, { type: 'son', nom: 'hein' });
}

/** Un pas d'un fantôme occupé : il fait ce qu'il fait, sur place. @param {any} p @param {any} e */
export function vivreOccupe(p, e) {
  if (e.surpris) return;
  e.veille -= DT;
  if (e.occupe === 'danse') { const a = e.t * 1.6 + e.ph; e.x = e.ox + Math.cos(a) * 30; e.y = e.oy + Math.sin(a) * 6; e.s = e.cible * (1 + Math.sin(a) * 0.08); }
  else e.y = e.oy + Math.sin(e.t * (e.occupe === 'ronfle' ? 1.2 : 3)) * (e.occupe === 'ronfle' ? 1.5 : 0.8);
  if (e.veille <= 0) remarquer(p, e);
}

/** Le rayon prend-il ce fantôme ? Sinon il glisse (et l'équipement réagit). @param {any} p @param {any} e */
export function prend(p, e) {
  if (e.occupe && !e.surpris) {
    e.surpris = true;
    evt(p, { type: 'texte', s: 'PAR SURPRISE !', x: e.x, y: e.y - 24, col: '#6ee03a' }); evt(p, { type: 'son', nom: 'parfait' });
  }
  if (e.equipe === 'casserole') {
    e.chaud = (e.chaud || 0) + DT;
    if (e.chaud >= MANIES.casserole) {
      e.equipe = null;
      evt(p, { type: 'texte', s: 'AÏE ! ÇA BRÛLE !', x: e.x, y: e.y - 24, col: '#ffb07a' }); evt(p, { type: 'son', nom: 'clac' });
      evt(p, { type: 'eclats', x: e.x, y: e.y - 10, n: 8, col: '#ff9a5a' });
    }
    return false;
  }
  if (e.malin && !(e.etourdi > 0)) return false;
  if (e.equipe === 'masque' && !(p.phase < MANIES.masque || p.phase > 1 - MANIES.masque)) return false;
  return true;
}

/** La torche sur lui. Rend vrai si elle peut l'étourdir. @param {any} p @param {any} e */
export function eclaireManie(p, e) {
  if (e.occupe && !e.surpris) { remarquer(p, e); return false; }
  if (e.equipe === 'lunettes') {
    if (e.lumiere >= MANIES.lunettes) {
      e.equipe = null; e.lumiere = 0;
      evt(p, { type: 'texte', s: 'HAHA ! IL ENLÈVE SES LUNETTES', x: e.x, y: e.y - 24, col: '#fff27a' }); evt(p, { type: 'son', nom: 'rire' });
      evt(p, { type: 'lunettes', x: e.x, y: e.y });
    }
    return false;
  }
  return true;
}

/** Un fantôme capturé : ses voisins occupés le remarquent. @param {any} p @param {any} e */
export function alentour(p, e) {
  for (const f of p.ents) if (f !== e && f.occupe && !f.surpris && Math.hypot(f.x - e.x, f.y - e.y) < MANIES.voisin) remarquer(p, f);
}

/** Les meubles qui cachent quelqu'un tremblent de temps en temps. @param {any} p */
export function indices(p) {
  const st = p.s;
  for (const k in st.tremble) st.tremble[k] = Math.max(0, st.tremble[k] - DT);
  const calme = !p.ents.some((e) => e.hostile && !e.occupe);
  for (const c of p.caches) {
    if (!c.type) continue;
    c.indice -= DT * (calme ? 2 : 1);
    if (c.indice <= 0) { st.tremble[c.cachette] = 0.3; c.indice = MANIES.indice; evt(p, { type: 'son', nom: 'toc' }); }
  }
}

/** Le rayon posé sur une cachette la fouille. @param {any} p @param {number} x @param {number} y */
export function fouiller(p, x, y) {
  const C = SALLES[p.salle].cachettes;
  const c = p.caches.find((q) => Math.hypot(C[q.cachette].x - x, C[q.cachette].y - y) < MANIES.portee);
  if (!c) return false;
  c.f += DT; p.s.tremble[c.cachette] = 0.1;
  if (c.f < MANIES.fouille) return true;
  p.caches.splice(p.caches.indexOf(c), 1);
  const k = C[c.cachette];
  p.s.ouvert[c.cachette] = 1;
  if (c.type) {
    const e = equiper(naitre(p, c.type, k.x, k.y, k.s * 0.6), c.equipe); e.cible = k.s * 1.1;
    evt(p, { type: 'texte', s: 'BOUH !', x: k.x, y: k.y - 26, col: '#ffffff', sc: 2 }); evt(p, { type: 'son', nom: 'rire' }); evt(p, { type: 'secousse', f: 0.2 });
  } else {
    p.pieces += c.pieces;
    evt(p, { type: 'pieces', x: k.x, y: k.y, n: c.pieces }); evt(p, { type: 'son', nom: 'brise' });
  }
  return true;
}

/** Il reste des fantômes cachés ? @param {any} p */
export const resteCaches = (p) => p.caches.some((c) => c.type);
