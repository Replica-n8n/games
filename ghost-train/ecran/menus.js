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

/**
 * La gare : le tableau des départs. Une ligne par mission, la note gagnée et les
 * secrets trouvés ; une mission pas encore jouable est « SUPPRIMÉ ».
 * @param {CanvasRenderingContext2D} ctx @param {any} s sauvegarde
 * @param {{installer: boolean, heure: string, version: string}} o
 * @returns {Zone[]}
 */
export function gare(ctx, s, o) {
  preparer();
  fond(ctx);
  rect(ctx, NOIR, 8, 6, 304, 124); rect(ctx, '#ffd23a', 10, 8, 300, 120); rect(ctx, '#e8203a', 10, 8, 300, 24);
  ecrire(ctx, 'GHOST TRAIN', 18, 15, { sc: 2, gras: true, coul: '#fff27a', contour: NOIR });
  ecrire(ctx, o.heure, 302, 18, { droite: true, coul: '#ffffff' });
  ecrire(ctx, 'DÉPARTS', 16, 38, { coul: '#7a5a8a' });
  ecrire(ctx, 'NOTE', 168, 38, { coul: '#7a5a8a' }); ecrire(ctx, 'SECRETS', 208, 38, { coul: '#7a5a8a' });
  const zones = [];
  ORDRE.forEach((id, k) => {
    const y = 52 + k * 17, existe = MISSIONS_EXISTANTES.includes(id), libre = existe && ouverte(s, id);
    const m = s.missions[id], heure = ['19:84', '20:13', '21:00', '23:59'][k];
    const coul = libre ? NOIR : '#9a7aa0';
    if (libre) rect(ctx, '#fff0a0', 12, y - 4, 296, 16);
    ecrire(ctx, heure, 16, y, { coul });
    ecrire(ctx, NOMS[id], 50, y, { coul });
    if (!existe) { rect(ctx, '#9a7aa0', 48, y + 3, NOMS[id].length * 6, 1); ecrire(ctx, 'SUPPRIMÉ', 300, y, { droite: true, coul: '#e8203a' }); return; }
    if (m && m.note) ecrire(ctx, m.note, 176, y, { coul: '#e8203a', gras: true });
    const trouves = MISSIONS[id].secrets.filter((x) => s.dossier.includes(x)).length;
    ecrire(ctx, `${trouves}/${MISSIONS[id].secrets.length}`, 214, y, { coul });
    if (libre) {
      ecrire(ctx, 'PARTIR >', 300, y, { droite: true, coul: '#e8203a', gras: true });
      zones.push({ id: 'partir:' + id, x: 12, y: y - 4, w: 296, h: 16, label: `Partir : ${NOMS[id].toLowerCase()}` });
    } else ecrire(ctx, 'FERMÉ', 300, y, { droite: true, coul });
  });
  ctx.drawImage(S.piece, 16, 113); ecrire(ctx, `${s.pieces} PIÈCES`, 26, 113, { coul: NOIR });
  ecrire(ctx, o.version, 302, 113, { droite: true, coul: '#9a7aa0' });
  const boutons = [['reglages', 'RÉGLAGES', 'Réglages']];
  if (o.installer) boutons.unshift(['installer', 'INSTALLER', 'Installer le jeu']);
  const larg = 96, x0 = 160 - (boutons.length * larg + (boutons.length - 1) * 8) / 2;
  boutons.forEach(([id, t, label], k) => {
    const x = Math.round(x0 + k * (larg + 8));
    bouton(ctx, x, 146, larg, 24, t, { vif: id === 'installer' });
    zones.push({ id, x, y: 146, w: larg, h: 24, label });
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
  ecrire(ctx, `PIÈCES GARDÉES : ${b.pieces}`, 160, 80, { centre: true, coul: '#e8203a', gras: true });
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
  ecrire(ctx, version, 294, 158, { droite: true, coul: '#9a7aa0' });
  return zones;
}

/** En portrait : la toile n'est qu'une bande, on demande de tourner. */
export function tourner(ctx) {
  fond(ctx);
  // en portrait la toile n'est qu'une bande : des lettres x3 pour rester lisibles
  ['TOURNE TON', 'TÉLÉPHONE', "À L'HORIZONTALE"].forEach((l, k) => ecrire(ctx, l, 160, 40 + k * 36, { sc: 3, centre: true, coul: '#fff27a', contour: NOIR }));
}
