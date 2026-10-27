// Le plan du manoir : la façade la nuit, quatre étages, une mission par étage.
// Le rez-de-chaussée en bas (le salon, la salle à manger, la cuisine), la
// bibliothèque au 1er, la salle de bal au 2e, le grenier sous le toit.
// Un étage ouvert s'éclaire de la couleur de sa mission ; un étage fermé reste noir.
import { R, P, L, boite, ovale, toile, h32, NOIR, W, H } from './peinture.js';
import { ecrire } from './police.js';

const PIERRE = ['#7a6a8a', '#544660', '#382c44'];
const TOIT = ['#4a3a5a', '#2e2238', '#1c1424'];
/** Les étages, du bas vers le haut : y du plancher, hauteur, couleur des fenêtres. */
export const ETAGES = [
  { id: 'rdc', nom: 'REZ-DE-CHAUSSÉE', y: 180, h: 38, lum: ['#fff2a0', '#ffb040'] },
  { id: 'biblio', nom: 'BIBLIOTHÈQUE', y: 142, h: 38, lum: ['#c8ffb0', '#6ee03a'] },
  { id: 'bal', nom: 'SALLE DE BAL', y: 104, h: 38, lum: ['#ffb0e0', '#ff3fa4'] },
  { id: 'grenier', nom: 'GRENIER', y: 66, h: 36, lum: ['#c8f0ff', '#3fe8ff'] },
];
const HAUT = 66;
const X0 = 96, X1 = 224;

/** La façade, peinte une fois (sans lumière aux fenêtres). */
export function peindreFacade() {
  const { t, c } = toile();
  // le ciel de nuit, la lune, les étoiles, les nuages
  for (let y = 0; y < H; y++) { const k = y / H; R(c, k < 0.3 ? '#140c2a' : k < 0.6 ? '#1c1236' : '#241640', 0, y, W, 1); }
  for (let k = 0; k < 60; k++) R(c, h32(k) > 0.8 ? '#ffffff' : '#8a80c0', h32(k * 7) * W, h32(k * 13) * 110, 1, 1);
  ovale(c, 46, 50, 16, 16, '#3a3060'); ovale(c, 46, 50, 13, 13, '#dce8ff'); ovale(c, 50, 47, 10, 10, '#f4f8ff'); ovale(c, 41, 54, 2.5, 2.5, '#b8c8ec'); ovale(c, 49, 42, 1.5, 1.5, '#c8d4f0');
  for (const [x, y, l] of [[30, 40, 60], [210, 52, 50], [60, 78, 40]]) { R(c, '#2e2450', x, y, l, 3); R(c, '#3a2e5e', x + 6, y - 2, l - 14, 2); }
  // les collines et les arbres morts
  for (let x = 0; x < W; x++) { const y = 150 + Math.sin(x * 0.03) * 6 + Math.sin(x * 0.11) * 2; R(c, '#120a1c', x, y, 1, H - y); }
  for (const [x, hh] of [[22, 40], [48, 28], [282, 36], [304, 24]]) {
    R(c, '#0c0614', x, 150 - hh, 3, hh);
    for (let k = 0; k < 4; k++) { const y = 150 - hh + 4 + k * 7, d = (k & 1 ? 1 : -1); L(c, '#0c0614', x + 1, y, x + 1 + d * (10 - k * 2), y - 6); }
  }
  // la cheminée sur le toit
  boite(c, 200, 18, 10, 26, ['#8a4a3a', '#6a3428', '#4a2018']);
  // le corps du manoir : quatre étages de pierre, une corniche entre chacun
  boite(c, X0, HAUT, X1 - X0, H - HAUT, PIERRE);
  for (const e of ETAGES.slice(1, 3)) { R(c, NOIR, X0 - 3, e.y - 1, X1 - X0 + 6, 4); R(c, PIERRE[0], X0 - 2, e.y, X1 - X0 + 4, 2); }
  for (let y = HAUT + 4; y < 180; y += 5) for (let x = X0 + ((y / 5) & 1) * 6; x < X1; x += 12) R(c, PIERRE[2], x, y, 1, 4);
  // le grand toit d'ardoise, le grenier dessous, et sa lucarne ronde
  P(c, [[X0 - 8, HAUT + 2], [X1 + 8, HAUT + 2], [190, 30], [130, 30]], TOIT[1], NOIR);
  for (let y = 34; y < HAUT; y += 4) { const k = (y - 30) / (HAUT + 2 - 30), xa = 130 - (130 - X0 + 8) * k, xb = 190 + (X1 + 8 - 190) * k; L(c, TOIT[2], xa, y, xb, y); }
  P(c, [[126, 30], [194, 30], [194, 26], [126, 26]], TOIT[0], NOIR);
  R(c, NOIR, X0 - 9, HAUT + 1, X1 - X0 + 18, 3); R(c, PIERRE[0], X0 - 8, HAUT + 1, X1 - X0 + 16, 1);
  // la porte d'entrée et son perron
  boite(c, 148, 154, 24, 24, ['#6a3a20', '#4a2414', '#2a140a']); ovale(c, 160, 154, 12, 6, NOIR); ovale(c, 160, 155, 11, 5, '#4a2414');
  R(c, '#e0b040', 167, 167, 2, 2);
  boite(c, 140, 177, 40, 3, PIERRE);
  return t;
}

/** Les fenêtres d'un étage, aux mêmes places sur la façade que sur la planche. @returns {any[]} */
function fenetres(e) {
  if (e.id === 'grenier') return [{ x: 160, y: 49, rond: 9 }];
  const n = e.id === 'rdc' ? 4 : 5, out = [];
  for (let k = 0; k < n; k++) {
    const x = e.id === 'rdc' ? [104, 124, 184, 204][k] : 102 + k * 25;
    out.push({ x, y: e.y - e.h + 8, w: 14, h: e.h - 16 });
  }
  return out;
}

/**
 * Le plan, dessiné à chaque image : les étages ouverts s'éclairent, le choisi palpite
 * et porte son nom ; un étage fermé a un cadenas.
 * @param {CanvasRenderingContext2D} c @param {HTMLCanvasElement} facade
 * @param {{ouverts: string[], bientot?: string[], choisi?: string, notes?: Record<string, string>, t: number, etiquettes?: boolean}} o
 */
export function dessinerManoir(c, facade, o) {
  c.drawImage(facade, 0, 0);
  for (const e of ETAGES) {
    const ouvert = o.ouverts.includes(e.id), choisi = o.choisi === e.id;
    for (const f of fenetres(e)) {
      if (f.rond) {
        ovale(c, f.x, f.y, f.rond + 1, f.rond + 1, NOIR);
        ovale(c, f.x, f.y, f.rond, f.rond, ouvert ? e.lum[1] : '#140c1c'); if (ouvert) ovale(c, f.x - 2, f.y - 2, f.rond * 0.5, f.rond * 0.5, e.lum[0]);
        R(c, NOIR, f.x - f.rond, f.y, f.rond * 2, 1); R(c, NOIR, f.x, f.y - f.rond, 1, f.rond * 2);
        continue;
      }
      boite(c, f.x - 1, f.y - 1, f.w + 2, f.h + 2, PIERRE);
      R(c, ouvert ? e.lum[1] : '#140c1c', f.x, f.y, f.w, f.h);
      if (ouvert) { R(c, e.lum[0], f.x + 1, f.y + 1, f.w - 6, f.h - 4); if (e.id === 'biblio') for (let x = f.x + 1; x < f.x + f.w - 1; x += 2) R(c, '#2a4a1a', x, f.y + f.h - 6, 1, 5); if (e.id === 'bal') R(c, '#3fe8ff', f.x, f.y + f.h - 3, f.w, 2); }
      R(c, NOIR, f.x + f.w / 2, f.y, 1, f.h); R(c, NOIR, f.x, f.y + f.h / 2, f.w, 1);
    }
    if (choisi) {
      const a = 0.55 + 0.35 * Math.sin(o.t * 5);
      c.globalAlpha = a; c.strokeStyle = e.lum[1]; c.lineWidth = 2; if (e.id === 'grenier') { c.beginPath(); c.arc(160, 49, 14, 0, Math.PI * 2); c.stroke(); } else c.strokeRect(X0 - 4, e.y - e.h + 3, X1 - X0 + 8, e.h - 4); c.globalAlpha = 1;
    }
    if (o.etiquettes !== false) {
      // l'étiquette : à gauche pour le bas et la salle de bal, à droite pour les autres
      const ey = e.id === 'grenier' ? 42 : e.y - e.h / 2 - 9, gauche = e.id === 'bal' || e.id === 'rdc';
      const w = 94, x = gauche ? 2 : W - 2 - w;
      c.globalAlpha = 0.85; R(c, NOIR, x, ey, w, 20); c.globalAlpha = 1;
      if (choisi) R(c, e.lum[1], gauche ? x + w - 2 : x, ey, 2, 20);
      const tx = gauche ? x + 3 : x + 5;
      if (ouvert) {
        ecrire(c, e.nom, tx, ey + 3, { coul: choisi ? '#ffffff' : '#c8b8e0' });
        const n = o.notes && o.notes[e.id];
        ecrire(c, n ? 'NOTE ' + n : 'À FAIRE', tx, ey + 12, { coul: n ? '#fff27a' : e.lum[1] });
      } else if (o.bientot && o.bientot.includes(e.id)) {
        ecrire(c, e.nom, tx, ey + 3, { coul: '#8a7a9a' });
        ecrire(c, 'BIENTÔT', tx, ey + 12, { coul: '#6a5a7a' });
      } else {
        ecrire(c, e.nom, tx, ey + 3, { coul: '#5a4a6a' });
        cadenas(c, tx, ey + 11); ecrire(c, 'FERMÉ', tx + 11, ey + 12, { coul: '#6a5a7a' });
      }
      L(c, choisi ? e.lum[1] : '#3a2e4a', gauche ? x + w : W - 2 - w, ey + 10, gauche ? X0 - 6 : X1 + 6, ey + 10);
    }
  }
}

function cadenas(c, x, y) {
  R(c, '#8a7a9a', x + 1, y, 5, 1); R(c, '#8a7a9a', x, y + 1, 1, 3); R(c, '#8a7a9a', x + 6, y + 1, 1, 3);
  R(c, '#c8a040', x - 1, y + 4, 9, 6); R(c, NOIR, x + 3, y + 6, 1, 2);
}

/** Un bouton de menu en case de BD : contour noir, ombre décalée. */
/** La boîte de l'étage à l'écran (façade et étiquette), pour y poser un bouton. */
export function zoneEtage(id) {
  const e = ETAGES.find((x) => x.id === id);
  return e.id === 'grenier' ? { x: 130, y: 30, w: 60, h: 36 } : { x: X0 - 4, y: e.y - e.h + 3, w: X1 - X0 + 8, h: e.h - 4 };
}
/** La boîte de l'étiquette d'un étage. */
export function zoneEtiquette(id) {
  const e = ETAGES.find((x) => x.id === id), gauche = e.id === 'bal' || e.id === 'rdc', w = 94;
  return { x: gauche ? 2 : W - 2 - w, y: e.id === 'grenier' ? 42 : e.y - e.h / 2 - 9, w, h: 20 };
}

export function bouton(c, x, y, w, h, texte, actif = true) {
  R(c, NOIR, x + 2, y + 2, w, h);
  R(c, NOIR, x - 1, y - 1, w + 2, h + 2);
  R(c, actif ? '#ffd23a' : '#4a3a5a', x, y, w, h);
  R(c, actif ? '#fff27a' : '#5a4a6a', x, y, w, 2);
  ecrire(c, texte, x + w / 2, y + h / 2 - 3, { centre: true, coul: actif ? '#120818' : '#8a7a9a', gras: true });
}
