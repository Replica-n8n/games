// Ghost Train : les écrans hors partie (titre, plan du manoir, pause, défaite,
// bilan, réglages), dessinés sur la même toile en pixels. Chaque écran rend aussi
// ses ZONES : des rectangles en pixels de jeu que l'app couvre de vrais boutons
// HTML (le doigt, le clavier et le lecteur d'écran passent par eux, pas par la toile).
import { W, H } from '../moteur/constantes.js';
import { ORDRE, ouverte } from '../moteur/progression.js';
import { MISSIONS, ETAGES, MISSIONS_EXISTANTES } from '../contenu/missions.js';
import { ecrire } from './police.js';
import { peindreFacade, dessinerManoir, bouton as boutonBD, zoneEtage, zoneEtiquette } from './manoir.js';
import { R, NOIR } from './peinture.js';

/** @typedef {{id: string, x: number, y: number, w: number, h: number, label: string, presse?: boolean}} Zone */

/** @type {HTMLCanvasElement | null} */
let facade = null;
const laFacade = () => (facade = facade || peindreFacade());

/** Un bouton de bande dessinée, blanc ou jaune (vif). */
function bouton(ctx, x, y, w, h, texte, o = {}) {
  R(ctx, NOIR, x, y, w, h);
  R(ctx, o.vif ? '#ffd23a' : '#ffffff', x + 1, y + 1, w - 2, h - 2);
  R(ctx, o.vif ? '#e8a020' : '#d8d8e8', x + 1, y + h - 4, w - 2, 3);
  ecrire(ctx, texte, x + w / 2, y + Math.round((h - 8) / 2), { centre: true, coul: NOIR, gras: !!o.vif });
}

/** Un cadre de BD avec un titre sur bandeau rouge. */
function cadre(ctx, x, y, w, h, titre) {
  R(ctx, NOIR, x, y, w, h); R(ctx, '#ffd23a', x + 2, y + 2, w - 4, h - 4); R(ctx, '#e8203a', x + 2, y + 2, w - 4, 22);
  ecrire(ctx, titre, x + w / 2, y + 6, { sc: 2, centre: true, gras: true, coul: '#fff27a', contour: NOIR });
}

/** Le manoir derrière un écran, assombri. */
function fondManoir(ctx, s, t, voile) {
  dessinerManoir(ctx, laFacade(), { ouverts: etagesOuverts(s), t, etiquettes: false });
  ctx.globalAlpha = voile; R(ctx, NOIR, 0, 0, W, H); ctx.globalAlpha = 1;
}

/** Les étages qui s'éclairent : ouverts ET déjà construits. @param {any} s */
function etagesOuverts(s) { return ORDRE.filter((id) => ouverte(s, id) && MISSIONS_EXISTANTES.includes(id)); }

/** La mission proposée : la première ouverte pas encore faite, sinon la dernière ouverte. @param {any} s */
export function proposee(s) {
  const ouv = etagesOuverts(s);
  return ouv.find((id) => !(s.missions[id] && s.missions[id].faite)) || ouv[ouv.length - 1] || 'rdc';
}

/**
 * L'écran titre : le manoir la nuit, le nom, « Touche pour jouer ».
 * @param {CanvasRenderingContext2D} ctx @param {any} s
 * @param {{installer: boolean, t: number, aide?: string, nouvelle?: boolean}} o @returns {Zone[]}
 */
export function titre(ctx, s, o) {
  fondManoir(ctx, s, o.t, 0.45);
  ecrire(ctx, 'GHOST', 160, 14, { centre: true, sc: 3, coul: '#6ee03a', contour: NOIR, ombre: '#2c9a2a', ombreD: 2 });
  ecrire(ctx, 'TRAIN', 160, 42, { centre: true, sc: 3, coul: '#6ee03a', contour: NOIR, ombre: '#2c9a2a', ombreD: 2 });
  if (((o.t * 2) | 0) & 1) ecrire(ctx, 'TOUCHE POUR JOUER', 160, 126, { centre: true, coul: '#fff27a', contour: NOIR, gras: true });
  const zones = [{ id: 'jouer', x: 60, y: 70, w: 200, h: 70, label: 'Jouer' }];
  if (o.installer) { boutonBD(ctx, 98, 148, 124, 18, 'INSTALLER LE JEU'); zones.push({ id: 'installer', x: 98, y: 148, w: 124, h: 18, label: 'Installer le jeu' }); }
  if (o.aide) ecrire(ctx, o.aide, 160, 106, { centre: true, coul: '#ffffff', contour: NOIR });
  ecrire(ctx, 'RÉGLAGES', 314, 168, { droite: true, coul: '#c8b8e0', contour: NOIR });
  zones.push({ id: 'reglages', x: 254, y: 162, w: 64, h: 18, label: 'Réglages' });
  if (o.nouvelle) {
    R(ctx, NOIR, 4, 150, 86, 26); R(ctx, '#6ee03a', 5, 151, 84, 24);
    ecrire(ctx, 'NOUVELLE', 47, 154, { centre: true, coul: NOIR, gras: true }); ecrire(ctx, 'VERSION : ICI', 47, 165, { centre: true, coul: NOIR });
    zones.push({ id: 'recharger', x: 4, y: 150, w: 86, h: 26, label: 'Nouvelle version prête : recharger' });
  }
  return zones;
}

/**
 * Le plan du manoir : un étage par mission ; on touche un étage ouvert, puis « Entrer ».
 * @param {CanvasRenderingContext2D} ctx @param {any} s @param {{choisie: string, t: number}} o @returns {Zone[]}
 */
export function manoir(ctx, s, o) {
  const ouverts = etagesOuverts(s), bientot = ORDRE.filter((id) => ouverte(s, id) && !MISSIONS_EXISTANTES.includes(id));
  const notes = Object.fromEntries(ORDRE.filter((id) => s.missions[id] && s.missions[id].note).map((id) => [id, s.missions[id].note]));
  dessinerManoir(ctx, laFacade(), { ouverts, bientot, choisi: o.choisie, notes, t: o.t });
  ecrire(ctx, 'LE MANOIR', 6, 6, { coul: '#ffffff', contour: NOIR, gras: true });
  ecrire(ctx, ETAGES[o.choisie].salles, 6, 17, { coul: '#c8b8e0', contour: NOIR });
  ecrire(ctx, String(s.pieces).padStart(4, '0'), 314, 6, { droite: true, coul: '#fff27a', contour: NOIR, gras: true });
  const zones = [];
  for (const id of ORDRE) {
    const libre = ouverts.includes(id), nom = ETAGES[id].nom.toLowerCase();
    const label = libre ? `Choisir : ${nom}` : bientot.includes(id) ? `${nom} : bientôt` : `${nom} : fermé`;
    const a = zoneEtage(id), b = zoneEtiquette(id);
    zones.push({ id: 'choisir:' + id, ...a, label }, { id: 'choisir:' + id + ':e', ...b, label });
  }
  const pret = ouverts.includes(o.choisie);
  boutonBD(ctx, 232, 158, 84, 18, 'ENTRER', pret);
  zones.push({ id: 'entrer', x: 232, y: 158, w: 84, h: 18, label: `Entrer : ${ETAGES[o.choisie].nom.toLowerCase()}` });
  return zones;
}

/** @param {CanvasRenderingContext2D} ctx @returns {Zone[]} */
export function pause(ctx) {
  ctx.globalAlpha = 0.75; R(ctx, '#07040f', 0, 0, W, H); ctx.globalAlpha = 1;
  cadre(ctx, 70, 30, 180, 120, 'PAUSE');
  bouton(ctx, 90, 66, 140, 28, 'REPRENDRE', { vif: true });
  bouton(ctx, 90, 104, 140, 28, 'QUITTER L\'ÉTAGE');
  return [{ id: 'reprendre', x: 90, y: 66, w: 140, h: 28, label: 'Reprendre' }, { id: 'manoir', x: 90, y: 104, w: 140, h: 28, label: 'Quitter et revenir au plan du manoir' }];
}

/** @param {CanvasRenderingContext2D} ctx @param {any} b @param {any} s @returns {Zone[]} */
export function defaite(ctx, b, s) {
  fondManoir(ctx, s, 0, 0.6);
  cadre(ctx, 40, 14, 240, 150, 'ILS T\'ONT EU !');
  ecrire(ctx, 'PLUS DE CŒURS. L\'ÉTAGE EST COURT :', 160, 50, { centre: true, coul: NOIR });
  ecrire(ctx, 'ON LE REPREND DEPUIS LE DÉBUT.', 160, 62, { centre: true, coul: NOIR });
  ecrire(ctx, `PIÈCES GARDÉES : ${b.pieces}`, 160, 80, { centre: true, coul: NOIR, gras: true });
  bouton(ctx, 60, 100, 200, 26, 'RECOMMENCER', { vif: true });
  bouton(ctx, 60, 132, 200, 24, 'PLAN DU MANOIR');
  return [{ id: 'rejouer', x: 60, y: 100, w: 200, h: 26, label: 'Recommencer l\'étage' }, { id: 'manoir', x: 60, y: 132, w: 200, h: 24, label: 'Revenir au plan du manoir' }];
}

/** @param {CanvasRenderingContext2D} ctx @param {any} b @param {any} s @returns {Zone[]} */
export function bilan(ctx, b, s) {
  fondManoir(ctx, s, 0, 0.6);
  cadre(ctx, 20, 6, 280, 168, MISSIONS[b.mission].nom);
  R(ctx, NOIR, 34, 40, 58, 58); R(ctx, '#ffffff', 36, 42, 54, 54);
  ecrire(ctx, b.note, 63, 52, { sc: 5, centre: true, gras: true, coul: '#e8203a', contour: NOIR });
  const lignes = [
    ['FANTÔMES', `${b.prises}/${b.total}`],
    ['CŒURS PERDUS', String(b.coeursPerdus)],
    ['TEMPS', `${Math.floor(b.duree / 60)} MIN ${String(Math.round(b.duree % 60)).padStart(2, '0')}`],
    ['PIÈCES', `+${b.pieces}`],
  ];
  lignes.forEach(([a, v], k) => {
    ecrire(ctx, a, 104, 46 + k * 13, { coul: NOIR });
    ecrire(ctx, v, 286, 46 + k * 13, { droite: true, coul: NOIR, gras: true });
  });
  bouton(ctx, 34, 136, 120, 26, 'REJOUER');
  bouton(ctx, 166, 136, 120, 26, 'PLAN DU MANOIR', { vif: true });
  return [{ id: 'rejouer', x: 34, y: 136, w: 120, h: 26, label: 'Rejouer l\'étage' }, { id: 'manoir', x: 166, y: 136, w: 120, h: 26, label: 'Revenir au plan du manoir' }];
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{musique: number, sons: number, aide: boolean, flashsReduits: boolean}} r
 * @param {string} version @param {any} s @returns {Zone[]}
 */
export function reglages(ctx, r, version, s) {
  fondManoir(ctx, s, 0, 0.6);
  cadre(ctx, 14, 4, 292, 172, 'RÉGLAGES');
  const zones = [];
  const niveau = (y, nom, id, v) => {
    ecrire(ctx, nom, 28, y + 6, { coul: NOIR });
    bouton(ctx, 170, y, 24, 20, '-'); bouton(ctx, 270, y, 24, 20, '+');
    for (let i = 0; i < 5; i++) { R(ctx, NOIR, 200 + i * 13, y + 4, 11, 12); R(ctx, i < Math.round(v * 5) ? '#6ee03a' : '#4a3050', 201 + i * 13, y + 5, 9, 10); }
    zones.push({ id: id + ':-', x: 170, y, w: 24, h: 20, label: `${nom.toLowerCase()} moins fort` }, { id: id + ':+', x: 270, y, w: 24, h: 20, label: `${nom.toLowerCase()} plus fort` });
  };
  const choix = (y, nom, id, v) => {
    ecrire(ctx, nom, 28, y + 6, { coul: NOIR });
    bouton(ctx, 220, y, 74, 20, v ? 'OUI' : 'NON', { vif: v });
    zones.push({ id, x: 220, y, w: 74, h: 20, label: nom.toLowerCase(), presse: v });
  };
  niveau(34, 'MUSIQUE', 'musique', r.musique);
  niveau(60, 'SONS', 'sons', r.sons);
  choix(86, 'AIDE À LA VISÉE', 'aide', r.aide);
  choix(112, 'FLASHS RÉDUITS', 'flashsReduits', r.flashsReduits);
  bouton(ctx, 28, 148, 100, 22, 'RETOUR', { vif: true });
  zones.push({ id: 'retour', x: 28, y: 148, w: 100, h: 22, label: 'Retour' });
  ecrire(ctx, version, 294, 156, { droite: true, coul: NOIR });
  return zones;
}

/** En portrait : la toile n'est qu'une bande, on demande de tourner. */
export function tourner(ctx) {
  R(ctx, '#140c2a', 0, 0, W, H);
  ['TOURNE TON', 'TÉLÉPHONE', "À L'HORIZONTALE"].forEach((l, k) => ecrire(ctx, l, 160, 40 + k * 36, { sc: 3, centre: true, coul: '#fff27a', contour: NOIR }));
}
