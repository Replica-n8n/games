// Les formations : ce qu'une fiche de mission peut demander, en données seulement.
// Une vague est [seconde, { f: 'nom', ...réglages }] ; ici, chaque nom devient des ennemis.
import { W } from './constantes.js';
import { feuillage, rocher, sable, tremplin } from './milieux.js';
import { creerCopain } from './allies.js';
import { creerBoss } from './boss.js';

/** @type {Record<string, (p: any, v: any) => void>} */
export const FORMATIONS = {
  // n ennemis en V, pointe en bas, centrés sur x
  V(p, { type, n = 5, x = W / 2 }) { for (let i = 0; i < n; i++) { const k = i - (n - 1) / 2; p.ajouter(type, x + k * 26, -20 - Math.abs(k) * 22); } },
  // n ennemis répartis sur la largeur, en escalier
  ligne(p, { type, n = 4 }) { for (let i = 0; i < n; i++) p.ajouter(type, 60 + i * (240 / Math.max(1, n - 1)), -20 - i * 30, { ph: i }); },
  // n ennemis qui entrent par un côté à la hauteur y (pour « piquer »)
  cote(p, { type, n = 6, cote = -1, y = 150 }) {
    for (let i = 0; i < n; i++) p.ajouter(type, cote < 0 ? -20 - i * 26 : W + 20 + i * 26, y, { vx: cote < 0 ? 2.4 : -2.4, delai: 50 + i * 10 });
  },
  // n ennemis éparpillés, l'un après l'autre
  pluie(p, { type, n = 3 }) { for (let i = 0; i < n; i++) p.ajouter(type, p.h.entre(40, W - 40), -20 - i * 40); },
  // un seul ennemi
  seul(p, { type, x = W / 2 }) { p.ajouter(type, x, -24, { vx: x < W / 2 ? 1.6 : -1.6 }); },
  // un porteur de cadeau qui traverse
  porteur(p) { p.ajouter('porteur', -20, 120, { vx: 1.6, y0: p.h.entre(100, 170) }); },
  // une cage d'astronaute déclarée dans la fiche (cages: { id: contenu })
  cage(p, { id, x = W / 2 }) { p.ajouterCage(id, x, -20); },
  // une touffe de feuillage, avec éventuellement un ennemi caché dessous
  feuillage(p, { x = W / 2, r = 65, y, cache }) {
    const t = feuillage(p, x, r, y);
    if (cache) p.ajouter(cache, t.x, t.y, { cache: true, feuille: t });
  },
  // ---- Désert ----
  // un rocher (bloque le rover et les tirs) ; une plaque de sable mou ; un tremplin
  rocher(p, { x = W / 2, r = 22 }) { rocher(p, x, r); },
  sable(p, { x = W / 2, w = 130, h = 100 }) { sable(p, x, w, h); },
  tremplin(p, { x = W / 2 }) { tremplin(p, x); },
  // des ennemis cachés sous des monticules, qui jailliront (scarabées des sables)
  monticules(p, { type = 'scarabeeSable', n = 3, x = W / 2 }) {
    for (let i = 0; i < n; i++) p.ajouter(type, Math.max(30, Math.min(W - 30, x + (i - (n - 1) / 2) * 50)), 40 + (i % 2) * 30, { cache: true });
  },
  // une taupe : son monticule apparaît là où le rover va passer si rien ne bouge
  taupe(p, { x }) { p.ajouter('taupe', x ?? p.j.x, p.j.y - 108, { cache: true }); },
  // un copain poursuivi par trois chasseurs (le sauver ouvre la mission secrète si la fiche le dit)
  copain(p) { creerCopain(p); },
  // une caisse qui contient le robot de combat
  caisse(p, { x = W / 2 }) { p.objets.push({ k: 'caisse', x, y: -20, vx: 0, vy: 0.8 }); },
  // le drapeau : à zéro cœur, on repartira d'ici
  drapeau(p) { p.poserDrapeau(); },
  // l'alerte avant le boss, puis le calme
  alerte(p) { p.alerte = 3 * 60; },
  // le boss de la planète
  boss(p, { type }) { creerBoss(p, type); },
  // un message en bas de l'écran
  message(p, { texte }) { p.message(texte); },
  // plus rien n'arrive : la mission finit quand l'écran est vide
  fin(p) { p.fin = true; },
};
