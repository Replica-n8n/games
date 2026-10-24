// Ghost Train : les écrans hors partie (gare, pause, défaite, bilan, réglages),
// dessinés sur la même toile en pixels. Chaque écran rend aussi ses ZONES : des
// rectangles en pixels de jeu que l'app couvre de vrais boutons HTML (le doigt,
// le clavier et le lecteur d'écran passent par eux, pas par la toile).
import { W, H } from '../moteur/constantes.js';
import { ORDRE, ouverte } from '../moteur/progression.js';
import { NOMS, MISSIONS_EXISTANTES, MISSIONS } from '../contenu/missions.js';
import { ecrire } from './police.js';
import { S, preparer } from './dessins.js';

const NOIR = '#120818';
const rect = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

/** @typedef {{id: string, x: number, y: number, w: number, h: number, label: string, presse?: boolean}} Zone */

/** Un bouton de bande dessinée. */
function bouton(ctx, x, y, w, h, texte, o = {}) {
  rect(ctx, NOIR, x, y, w, h);
  rect(ctx, o.vif ? '#ffd23a' : '#ffffff', x + 1, y + 1, w - 2, h - 2);
  rect(ctx, o.vif ? '#e8a020' : '#d8d8e8', x + 1, y + h - 4, w - 2, 3);
  ecrire(ctx, texte, x + w / 2, y + Math.round((h - 8) / 2), { centre: true, coul: NOIR, gras: !!o.vif });
}

/** Le fond commun : rayures violettes de papier peint. */
function fond(ctx) {
  rect(ctx, '#2c1c40', 0, 0, W, H);
  for (let i = 0; i < W; i += 16) rect(ctx, '#341f4c', i, 0, 8, H);
}

/** Un cadre de BD avec un titre sur bandeau rouge. */
function cadre(ctx, x, y, w, h, titre) {
  rect(ctx, NOIR, x, y, w, h); rect(ctx, '#ffd23a', x + 2, y + 2, w - 4, h - 4); rect(ctx, '#e8203a', x + 2, y + 2, w - 4, 22);
  ecrire(ctx, titre, x + w / 2, y + 6, { sc: 2, centre: true, gras: true, coul: '#fff27a', contour: NOIR });
}

/** Le wagon de l'agence vu de profil, nez à droite (35 pixels de haut) : noir, bande de danger, barre jaune. */
function wagonProfil(ctx, a, b) {
  rect(ctx, NOIR, a, b + 6, 62, 24); rect(ctx, NOIR, a + 46, b, 18, 30);
  rect(ctx, '#22222a', a + 1, b + 7, 60, 22); rect(ctx, '#3a3a46', a + 1, b + 7, 60, 2);
  rect(ctx, '#22222a', a + 47, b + 1, 16, 10); rect(ctx, '#3a3a46', a + 47, b + 1, 16, 2);
  // la bande de danger
  ctx.save(); ctx.beginPath(); ctx.rect(a + 1, b + 17, 62, 6); ctx.clip();
  rect(ctx, '#ffd23a', a + 1, b + 17, 62, 6); ctx.fillStyle = NOIR;
  for (let k = a - 6; k < a + 64; k += 8) { ctx.beginPath(); ctx.moveTo(k, b + 23); ctx.lineTo(k + 4, b + 23); ctx.lineTo(k + 10, b + 17); ctx.lineTo(k + 6, b + 17); ctx.fill(); }
  ctx.restore();
  rect(ctx, NOIR, a + 1, b + 16, 62, 1); rect(ctx, NOIR, a + 1, b + 23, 62, 1);
  rect(ctx, NOIR, a + 4, b + 2, 2, 6); rect(ctx, '#ffd23a', a, b + 2, 44, 3); rect(ctx, NOIR, a, b + 1, 44, 1);
  rect(ctx, '#ffffff', a + 30, b + 10, 12, 5); ecrire(ctx, 'GT', a + 36, b + 9, { centre: true, coul: '#e8203a' });
  for (const k of [10, 46]) { rect(ctx, NOIR, a + k - 5, b + 27, 11, 8); rect(ctx, '#5a5478', a + k - 4, b + 28, 9, 6); rect(ctx, '#c8c8d8', a + k - 1, b + 30, 3, 2); }
  rect(ctx, '#e8203a', a + 60, b + 12, 3, 4);
}

/** Un billet : talon perforé à gauche. */
function billet(ctx, a, b, w, h, texte, talon) {
  rect(ctx, NOIR, a, b, w, h); rect(ctx, '#fff4d0', a + 1, b + 1, w - 2, h - 2);
  rect(ctx, talon, a + 1, b + 1, 12, h - 2);
  for (let k = b + 3; k < b + h - 2; k += 4) rect(ctx, NOIR, a + 13, k, 1, 2);
  ecrire(ctx, texte, a + 13 + (w - 13) / 2, b + Math.round((h - 7) / 2), { centre: true, coul: NOIR });
}

// Le ciel ne change pas : ses étoiles sont tirées une fois
const ETOILES = [];
{ let g = 7; for (let i = 0; i < 60; i++) { g = (Math.imul(g, 1664525) + 1013904223) >>> 0; ETOILES.push([g % 320, (g >> 9) % 70, i % 5 === 0]); } }

/** La mission proposée : la première ouverte pas encore faite, sinon la dernière ouverte. @param {any} s */
export function proposee(s) {
  const libres = ORDRE.filter((id) => MISSIONS_EXISTANTES.includes(id) && ouverte(s, id));
  return libres.find((id) => !(s.missions[id] && s.missions[id].faite)) || libres[libres.length - 1];
}

/**
 * La gare, direction « Le quai de minuit » (choisie par Julie le 2026-10-24 sur
 * docs/ghost-train-gare.png) : le quai sous la lune, le wagon qui attend, la Goule
 * géante au-dessus du tunnel, et le tableau des départs suspendu, lettres claires
 * sur noir. On touche une ligne pour choisir, PARTIR pour y aller.
 * Contrastes : tools/ghost-train-couleurs.mjs.
 * @param {CanvasRenderingContext2D} ctx @param {any} s sauvegarde
 * @param {{installer: boolean, heure: string, choisie: string, image: number}} o
 * @returns {Zone[]}
 */
export function gare(ctx, s, o) {
  preparer();
  for (let y = 0; y < 145; y++) { const k = y / 145; rect(ctx, `rgb(${Math.round(20 + 24 * k)},${Math.round(10 + 10 * k)},${Math.round(40 + 20 * k)})`, 0, y, 320, 1); }
  for (const [x, y, clair] of ETOILES) rect(ctx, clair && ((o.image >> 5) + x) % 7 ? '#fff6c8' : '#6a5a8a', x, y, 1, 1);
  ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(196, 52, 9, 0, 7); ctx.fill();
  ctx.fillStyle = '#2a1840'; ctx.beginPath(); ctx.arc(200, 49, 8, 0, 7); ctx.fill();
  // la façade du train fantôme : la Goule géante au-dessus du tunnel
  rect(ctx, '#3a2050', 210, 40, 110, 105);
  for (let k = 210; k < 320; k += 12) rect(ctx, '#341c48', k, 40, 6, 105);
  ctx.drawImage(S.gouleTenue, 210, 24, 110, 110);
  rect(ctx, '#07040f', 242, 104, 46, 37);
  rect(ctx, NOIR, 208, 6, 110, 18); rect(ctx, '#e8203a', 209, 7, 108, 16);
  for (let k = 211; k < 316; k += 6) {
    const on = ((k / 6 | 0) + (o.image >> 4)) % 2;
    rect(ctx, on ? '#fff27a' : '#ffb030', k, 8, 2, 2); rect(ctx, on ? '#ffb030' : '#fff27a', k, 20, 2, 2);
  }
  ecrire(ctx, 'GHOST TRAIN', 263, 12, { centre: true, gras: true, coul: '#fff27a', contour: NOIR });
  // le quai, les rails, le wagon qui attend
  rect(ctx, '#4a3a5a', 0, 145, 320, 3);
  for (let k = 0; k < 320; k += 16) rect(ctx, (k / 16) % 2 ? '#c8c4e0' : '#2c2848', k, 148, 16, 8);
  rect(ctx, '#1e1430', 0, 156, 320, 24); rect(ctx, '#2a1c40', 0, 156, 320, 1);
  for (let k = 0; k < 250; k += 8) rect(ctx, '#5a3618', k, 143, 5, 3);
  rect(ctx, '#9a9ab0', 0, 141, 250, 2); rect(ctx, '#dadce8', 0, 141, 250, 1);
  wagonProfil(ctx, 112, 107);
  ctx.drawImage(S.lumi0, 186, 120, 18, 23);
  // le tableau des départs, suspendu
  rect(ctx, '#3a2a1c', 30, 0, 2, 8); rect(ctx, '#3a2a1c', 168, 0, 2, 8);
  rect(ctx, NOIR, 8, 6, 172, 98); rect(ctx, '#f0c040', 9, 7, 170, 96); rect(ctx, NOIR, 11, 9, 166, 92);
  ecrire(ctx, 'DÉPARTS', 16, 13, { coul: '#ffd23a', gras: true });
  ecrire(ctx, o.heure, 172, 13, { droite: true, coul: '#ffd23a' });
  const zones = [];
  ORDRE.forEach((id, k) => {
    const y = 30 + k * 18, existe = MISSIONS_EXISTANTES.includes(id), libre = existe && ouverte(s, id), m = s.missions[id];
    if (id === o.choisie) { rect(ctx, '#3a2a5a', 12, y - 5, 164, 17); if ((o.image >> 4) & 1) ecrire(ctx, '>', 15, y, { coul: '#ffd23a' }); }
    ecrire(ctx, NOMS[id], 23, y, { coul: libre ? '#fff6c8' : '#8a7aa0' });
    if (!libre) { ecrire(ctx, 'X', 172, y, { droite: true, coul: '#8a7aa0' }); return; }
    const trouves = MISSIONS[id].secrets.filter((x) => s.dossier.includes(x)).length;
    ecrire(ctx, `${trouves}/${MISSIONS[id].secrets.length}`, 152, y, { droite: true, coul: '#c8c4e0' });
    ecrire(ctx, m && m.note ? m.note : '-', 172, y, { droite: true, coul: '#ffd23a', gras: true });
    zones.push({ id: 'choisir:' + id, x: 11, y: y - 6, w: 166, h: 18, label: `${NOMS[id].toLowerCase()}${m && m.note ? ', note ' + m.note : ''}`, presse: id === o.choisie });
  });
  ctx.drawImage(S.piece, 254, 148); ecrire(ctx, String(s.pieces), 264, 148, { coul: '#fff27a', contour: NOIR });
  // PARTIR, et les billets
  rect(ctx, NOIR, 8, 157, 112, 21); rect(ctx, '#ffd23a', 9, 158, 110, 19); rect(ctx, '#e8a020', 9, 174, 110, 3);
  ecrire(ctx, 'PARTIR', 64, 160, { centre: true, sc: 2, gras: true, coul: NOIR });
  zones.push({ id: 'partir:' + o.choisie, x: 8, y: 157, w: 112, h: 21, label: `Partir : ${NOMS[o.choisie].toLowerCase()}` });
  const billets = [['reglages', 'RÉGLAGES', 'Réglages', '#e8203a']];
  if (o.installer) billets.push(['installer', 'INSTALLER', 'Installer le jeu', '#6ee03a']);
  billets.forEach(([id, t, label, talon], k) => {
    const x = 126 + k * 98;
    billet(ctx, x, 158, 92, 20, t, talon);
    zones.push({ id, x, y: 158, w: 92, h: 20, label });
  });
  return zones;
}

/** @param {CanvasRenderingContext2D} ctx @returns {Zone[]} */
export function pause(ctx) {
  ctx.globalAlpha = 0.75; rect(ctx, '#07040f', 0, 0, W, H); ctx.globalAlpha = 1;
  cadre(ctx, 70, 30, 180, 120, 'PAUSE');
  bouton(ctx, 90, 66, 140, 28, 'REPRENDRE', { vif: true });
  bouton(ctx, 90, 104, 140, 28, 'RETOUR À LA GARE');
  return [{ id: 'reprendre', x: 90, y: 66, w: 140, h: 28, label: 'Reprendre' }, { id: 'gare', x: 90, y: 104, w: 140, h: 28, label: 'Abandonner et revenir à la gare' }];
}

/** @param {CanvasRenderingContext2D} ctx @param {any} b bilan @returns {Zone[]} */
export function defaite(ctx, b) {
  fond(ctx);
  cadre(ctx, 40, 14, 240, 150, 'LE WAGON RECULE');
  ecrire(ctx, 'PLUS DE CŒURS. LA MISSION EST COURTE :', 160, 50, { centre: true, coul: NOIR });
  ecrire(ctx, 'ON LA REPREND DU DÉBUT.', 160, 62, { centre: true, coul: NOIR });
  ecrire(ctx, `PIÈCES GARDÉES : ${b.pieces}`, 160, 80, { centre: true, coul: NOIR, gras: true });
  bouton(ctx, 60, 100, 200, 26, 'RECOMMENCER', { vif: true });
  bouton(ctx, 60, 132, 200, 24, 'GARE');
  return [{ id: 'rejouer', x: 60, y: 100, w: 200, h: 26, label: 'Recommencer la mission' }, { id: 'gare', x: 60, y: 132, w: 200, h: 24, label: 'Revenir à la gare' }];
}

/** @param {CanvasRenderingContext2D} ctx @param {any} b bilan @param {any} m mission @returns {Zone[]} */
export function bilan(ctx, b, m) {
  fond(ctx);
  cadre(ctx, 20, 6, 280, 168, m.nom);
  rect(ctx, NOIR, 34, 40, 58, 58); rect(ctx, '#ffffff', 36, 42, 54, 54);
  ecrire(ctx, b.note, 63, 52, { sc: 5, centre: true, gras: true, coul: '#e8203a', contour: NOIR });
  const lignes = [
    ['FANTÔMES', `${b.prises}/${b.total}`],
    ['LUMI', b.lumi === 'touche' ? 'TOUCHÉ' : b.lumi === 'epargne' ? 'ÉPARGNÉ' : '-'],
    ['CŒURS PERDUS', String(b.coeursPerdus)],
    ['SECRETS', `${b.secrets.length} NOUVEAU${b.secrets.length > 1 ? 'X' : ''}`],
    ['PIÈCES', `+${b.pieces}`],
  ];
  lignes.forEach(([a, v], k) => {
    ecrire(ctx, a, 104, 42 + k * 11, { coul: NOIR });
    ecrire(ctx, v, 286, 42 + k * 11, { droite: true, coul: NOIR, gras: true });
  });
  bouton(ctx, 34, 136, 120, 26, 'REJOUER');
  bouton(ctx, 166, 136, 120, 26, 'GARE', { vif: true });
  return [{ id: 'rejouer', x: 34, y: 136, w: 120, h: 26, label: 'Rejouer la mission' }, { id: 'gare', x: 166, y: 136, w: 120, h: 26, label: 'Revenir à la gare' }];
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{musique: number, sons: number, aide: boolean, flashsReduits: boolean, gaucher: boolean}} r
 * @param {string} version
 * @returns {Zone[]}
 */
export function reglages(ctx, r, version) {
  fond(ctx);
  cadre(ctx, 14, 4, 292, 172, 'RÉGLAGES');
  const zones = [];
  const niveau = (y, nom, id, v) => {
    ecrire(ctx, nom, 28, y + 6, { coul: NOIR });
    bouton(ctx, 170, y, 24, 20, '-'); bouton(ctx, 270, y, 24, 20, '+');
    for (let i = 0; i < 5; i++) { rect(ctx, NOIR, 200 + i * 13, y + 4, 11, 12); rect(ctx, i < Math.round(v * 5) ? '#6ee03a' : '#4a3050', 201 + i * 13, y + 5, 9, 10); }
    zones.push({ id: id + ':-', x: 170, y, w: 24, h: 20, label: `${nom.toLowerCase()} moins fort` }, { id: id + ':+', x: 270, y, w: 24, h: 20, label: `${nom.toLowerCase()} plus fort` });
  };
  const choix = (y, nom, id, v) => {
    ecrire(ctx, nom, 28, y + 6, { coul: NOIR });
    bouton(ctx, 220, y, 74, 20, v ? 'OUI' : 'NON', { vif: v });
    zones.push({ id, x: 220, y, w: 74, h: 20, label: nom.toLowerCase(), presse: v });
  };
  niveau(32, 'MUSIQUE', 'musique', r.musique);
  niveau(56, 'SONS', 'sons', r.sons);
  choix(80, 'AIDE À LA VISÉE', 'aide', r.aide);
  choix(104, 'FLASHS RÉDUITS', 'flashsReduits', r.flashsReduits);
  choix(128, 'GAUCHER', 'gaucher', r.gaucher);
  bouton(ctx, 28, 152, 100, 20, 'RETOUR', { vif: true });
  zones.push({ id: 'retour', x: 28, y: 152, w: 100, h: 20, label: 'Retour à la gare' });
  ecrire(ctx, version, 294, 158, { droite: true, coul: NOIR });
  return zones;
}

/** En portrait : la toile n'est qu'une bande, on demande de tourner. */
export function tourner(ctx) {
  fond(ctx);
  // en portrait la toile n'est qu'une bande : des lettres x3 pour rester lisibles
  ['TOURNE TON', 'TÉLÉPHONE', "À L'HORIZONTALE"].forEach((l, k) => ecrire(ctx, l, 160, 40 + k * 36, { sc: 3, centre: true, coul: '#fff27a', contour: NOIR }));
}
