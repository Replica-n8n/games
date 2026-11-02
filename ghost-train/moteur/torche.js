// La torche : un rond de lumière là où vise le rayon, tant que le pouce gauche tient le
// bouton et que la pile n'est pas vide (règles dans TORCHE, constantes.js).
import { DT, TORCHE } from './constantes.js';
import { ESPECES } from '../contenu/especes.js';
import { boite, evt } from './fantomes.js';
import { capturer } from './rayon.js';
import { eclaireManie } from './manies.js';

/** La torche d'une partie neuve. */
export const torcheNeuve = () => ({ on: false, x: 160, y: 90, pile: 1, vide: false });

/** Ce que touche la lumière : à `portee` du centre, un peu plus pour un gros fantôme. @param {any} p @param {any} e */
export function eclaire(p, e) {
  const T = p.torche, b = boite(e);
  return T.on && Math.hypot(e.x - T.x, e.y - T.y) < TORCHE.portee + Math.min(b.w, b.h) * 0.3;
}

/** Un pas de torche. @param {any} p @param {boolean} demande */
export function eclairer(p, demande) {
  const T = p.torche;
  if (demande && !T.vide) {
    T.pile -= TORCHE.use * DT;
    if (T.pile <= 0) { T.pile = 0; T.vide = true; evt(p, { type: 'texte', s: 'PILE VIDE', x: 52, y: 128, col: '#fff27a' }); evt(p, { type: 'son', nom: 'vide' }); }
  } else {
    T.pile = Math.min(1, T.pile + TORCHE.recharge * DT);
    if (T.vide && T.pile >= TORCHE.reprise) T.vide = false;
  }
  const on = demande && !T.vide;
  if (on && !T.on) evt(p, { type: 'son', nom: 'torche' });
  T.on = on; T.x = p.visee.x; T.y = p.visee.y;
  for (const e of p.ents) {
    if (e.etat !== 'vit' || e.mort || e.tir || ESPECES[e.type].ami || !eclaire(p, e)) { e.lumiere = 0; continue; }
    e.lumiere = (e.lumiere || 0) + DT;
    if (e.cache) e.revele = Math.max(e.revele, TORCHE.revele);
    if (e.garde) { if (e.lumiere >= TORCHE.garde) capturer(p, e, 1, true); continue; }
    if (!eclaireManie(p, e)) continue;
    if (e.lumiere < TORCHE.eblouit) continue;
    if (e.type === 'gouvernante') {
      if (e.bouclier) {
        e.bouclier = false; e.tBouclier = 4.5; e.etourdi = 1.8;
        evt(p, { type: 'texte', s: 'BOUCLIER BRISÉ !', x: e.x, y: e.y - 30, col: '#3fe8ff' }); evt(p, { type: 'son', nom: 'brise' });
      }
      continue;
    }
    if (e.hostile && !e.boss && e.etourdi <= 0) e.etourdi = TORCHE.etourdi;
  }
}
