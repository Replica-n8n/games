// Ghostel : les écrans hors partie (titre, plan de l'hôtel, pause, défaite,
// bilan, réglages, boutique), dessinés sur la même toile en pixels. Chaque écran rend aussi
// ses ZONES : des rectangles en pixels de jeu que l'app couvre de vrais boutons
// HTML (le doigt, le clavier et le lecteur d'écran passent par eux, pas par la toile).
import { W, H } from '../moteur/constantes.js';
import { ORDRE, ouverte } from '../moteur/progression.js';
import { MISSIONS, ETAGES, MISSIONS_EXISTANTES } from '../contenu/missions.js';
import { ecrire } from './police.js';
import { peindreFacade, dessinerManoir, bouton as boutonBD, zoneEtage, zoneEtiquette, ZONE_BOUTIQUE } from './manoir.js';
import { R, P, ovale, NOIR } from './peinture.js';
import { RAYONS } from '../contenu/rayons.js';
import { boutiqueOuverte, possede } from '../moteur/boutique.js';
import { brin } from './brins.js';
import { S, preparer } from './dessins.js';

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

/** L'hôtel derrière un écran, assombri. */
/** `doux` : les flashs réduits ; la nuit hantée ne vit que derrière l'écran titre (t > 0), les autres écrans sont figés. */
function fondManoir(ctx, s, t, voile, doux = false) {
  dessinerManoir(ctx, laFacade(), { ouverts: etagesOuverts(s), t, etiquettes: false, boutique: boutiqueOuverte(s), hante: t > 0, doux });
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
 * L'écran titre : l'hôtel la nuit, le nom, « Touche pour jouer ».
 * @param {CanvasRenderingContext2D} ctx @param {any} s
 * @param {{installer: boolean, t: number, aide?: string, nouvelle?: boolean, doux?: boolean}} o @returns {Zone[]}
 */
export function titre(ctx, s, o) {
  fondManoir(ctx, s, o.t, 0.45, o.doux);
  ecrire(ctx, 'GHOSTEL', 160, 24, { centre: true, sc: 4, coul: '#6ee03a', contour: NOIR, ombre: '#2c9a2a', ombreD: 2 });
  ecrire(ctx, 'HÔTEL HANTÉ', 160, 60, { centre: true, coul: '#ffb0e0', contour: NOIR, gras: true });
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
 * Le plan de l'hôtel : un étage par mission ; on touche un étage ouvert, puis « Entrer ».
 * La boutique s'y touche aussi ; fermée, une bulle dit quand elle ouvre (`o.bulle`).
 * @param {CanvasRenderingContext2D} ctx @param {any} s @param {{choisie: string, t: number, bulle?: boolean, doux?: boolean}} o @returns {Zone[]}
 */
export function manoir(ctx, s, o) {
  const ouverts = etagesOuverts(s), bientot = ORDRE.filter((id) => ouverte(s, id) && !MISSIONS_EXISTANTES.includes(id));
  const notes = Object.fromEntries(ORDRE.filter((id) => s.missions[id] && s.missions[id].note).map((id) => [id, s.missions[id].note]));
  const bouvert = boutiqueOuverte(s);
  dessinerManoir(ctx, laFacade(), { ouverts, bientot, choisi: o.choisie, notes, t: o.t, boutique: bouvert, hante: true, doux: o.doux });
  ecrire(ctx, 'L\'HÔTEL', 6, 6, { coul: '#ffffff', contour: NOIR, gras: true });
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
  // ENTRER se range à droite de la boutique
  boutonBD(ctx, 278, 158, 38, 18, 'ENTRER', pret, false);
  zones.push({ id: 'entrer', x: 278, y: 150, w: 42, h: 30, label: `Entrer : ${ETAGES[o.choisie].nom.toLowerCase()}` });
  if (bouvert && !s.boutiqueVue) {
    const vif = ((o.t * 3) | 0) % 2 === 0;
    R(ctx, NOIR, 164, 134, 58, 11); R(ctx, vif ? '#6ee03a' : '#c8ffb0', 165, 135, 56, 9);
    ecrire(ctx, 'NOUVEAU !', 193, 136, { centre: true, coul: NOIR });
  }
  if (o.bulle) {
    R(ctx, NOIR, 82, 84, 156, 24); R(ctx, '#ffffff', 83, 85, 154, 22);
    P(ctx, [[220, 107], [234, 107], [244, 134]], '#ffffff', NOIR);
    ecrire(ctx, 'ELLE OUVRE QUAND LE', 160, 88, { centre: true, coul: NOIR });
    ecrire(ctx, 'REZ-DE-CHAUSSÉE EST FINI', 160, 97, { centre: true, coul: NOIR });
  }
  zones.push({ id: 'boutique', ...ZONE_BOUTIQUE, label: bouvert ? (s.boutiqueVue ? 'Boutique' : 'Boutique : nouveau') : 'Boutique : fermée, elle ouvre quand le rez-de-chaussée est fini' });
  return zones;
}

/** @param {CanvasRenderingContext2D} ctx @returns {Zone[]} */
export function pause(ctx) {
  ctx.globalAlpha = 0.75; R(ctx, '#07040f', 0, 0, W, H); ctx.globalAlpha = 1;
  cadre(ctx, 70, 30, 180, 120, 'PAUSE');
  bouton(ctx, 90, 66, 140, 28, 'REPRENDRE', { vif: true });
  bouton(ctx, 90, 104, 140, 28, 'QUITTER L\'ÉTAGE');
  return [{ id: 'reprendre', x: 90, y: 66, w: 140, h: 28, label: 'Reprendre' }, { id: 'manoir', x: 90, y: 104, w: 140, h: 28, label: 'Quitter et revenir au plan de l\'hôtel' }];
}

/** @param {CanvasRenderingContext2D} ctx @param {any} b @param {any} s @returns {Zone[]} */
export function defaite(ctx, b, s) {
  fondManoir(ctx, s, 0, 0.6);
  cadre(ctx, 40, 14, 240, 150, 'ILS T\'ONT EU !');
  ecrire(ctx, 'PLUS DE CŒURS. L\'ÉTAGE EST COURT :', 160, 50, { centre: true, coul: NOIR });
  ecrire(ctx, 'ON LE REPREND DEPUIS LE DÉBUT.', 160, 62, { centre: true, coul: NOIR });
  ecrire(ctx, `PIÈCES GARDÉES : ${b.pieces}`, 160, 80, { centre: true, coul: NOIR, gras: true });
  bouton(ctx, 60, 100, 200, 26, 'RECOMMENCER', { vif: true });
  bouton(ctx, 60, 132, 200, 24, 'PLAN DE L\'HÔTEL');
  return [{ id: 'rejouer', x: 60, y: 100, w: 200, h: 26, label: 'Recommencer l\'étage' }, { id: 'manoir', x: 60, y: 132, w: 200, h: 24, label: 'Revenir au plan de l\'hôtel' }];
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
  bouton(ctx, 166, 136, 120, 26, 'PLAN DE L\'HÔTEL', { vif: true });
  return [{ id: 'rejouer', x: 34, y: 136, w: 120, h: 26, label: 'Rejouer l\'étage' }, { id: 'manoir', x: 166, y: 136, w: 120, h: 26, label: 'Revenir au plan de l\'hôtel' }];
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

const piece = (c, x, y) => { ovale(c, x, y, 4, 4, NOIR); ovale(c, x, y, 3, 3, '#ffd23a'); R(c, '#fff27a', x - 1, y - 2, 1, 2); R(c, '#c88a10', x, y - 1, 1, 3); };
function coche(c, x, y) { for (const [cc, o] of /** @type {[string, number][]} */ ([[NOIR, 1], ['#6ee03a', 0]])) { c.fillStyle = cc; for (const [a, b] of [[0, 3], [1, 4], [2, 5], [3, 4], [4, 3], [5, 2], [6, 1], [7, 0]]) c.fillRect(x + a - o, y + b - o, 1 + 2 * o, 2 + 2 * o); } }
/** Un rayon d'essai, du coin de la vitre jusqu'à l'ecto, aux couleurs du rayon choisi. */
function essai(c, t, x0, y0, x1, y1, r) {
  const pts = [];
  for (let k = 0; k <= 9; k++) { const f = k / 9, j = k === 0 || k === 9 ? 0 : Math.sin(t * 50 + k * 2.3) * 3; pts.push([x0 + (x1 - x0) * f + j, y0 + (y1 - y0) * f + j * 0.6]); }
  for (const [cote, l, dx] of [[0, 3, -2], [1, 3, 2], [-1, 2, 0]]) {
    c.lineWidth = l;
    for (let k = 1; k < pts.length; k++) {
      c.strokeStyle = cote < 0 ? '#ffffff' : brin(r, /** @type {0 | 1} */ (cote), k / 9, t);
      c.beginPath(); c.moveTo(pts[k - 1][0] + dx, pts[k - 1][1]); c.lineTo(pts[k][0] + dx, pts[k][1]); c.stroke();
    }
  }
  ovale(c, x1, y1, 3, 3, '#ffffff');
}

/**
 * La boutique (maquette validée le 2026-11-02) : les rayons en tubes sur l'étagère, l'essai
 * du rayon choisi à droite, le comptoir en bas (acheter, ou le prendre en main).
 * @param {CanvasRenderingContext2D} c @param {any} s @param {{choix: string, t: number}} o @returns {Zone[]}
 */
export function boutique(c, s, o) {
  preparer();
  const t = o.t, k0 = Math.max(0, RAYONS.findIndex((r) => r.id === o.choix)), r = RAYONS[k0], zones = [];
  for (let y = 0; y < H; y++) R(c, y < 110 ? (y % 12 < 6 ? '#2a1838' : '#24142e') : '#1c1024', 0, y, W, 1);
  for (let y = 6; y < 110; y += 12) for (let x = (y / 12 & 1) * 8; x < W; x += 16) R(c, '#3a2450', x, y, 2, 2);
  bouton(c, 4, 4, 50, 16, 'RETOUR');
  zones.push({ id: 'plan', x: 0, y: 0, w: 58, h: 24, label: 'Retour au plan de l\'hôtel' });
  ecrire(c, 'LA BOUTIQUE', 120, 8, { centre: true, coul: '#fff27a', contour: NOIR, gras: true });
  piece(c, 268, 10); ecrire(c, String(s.pieces).padStart(4, '0'), 314, 6, { droite: true, coul: '#fff27a', contour: NOIR, gras: true });
  // les tubes sur l'étagère
  R(c, NOIR, 6, 84, 178, 6); R(c, '#8a5a30', 7, 85, 176, 3); R(c, '#5a3418', 7, 88, 176, 1);
  RAYONS.forEach((v, k) => {
    const x = 18 + k * 23, leve = k === k0 ? 4 + Math.round(Math.sin(t * 4)) : 0, y = 44 - leve, a = possede(s, v.id);
    if (k === k0) { c.globalAlpha = 0.25; ovale(c, x + 7, y + 20, 13, 22, brin(v, 0, 0.5, t)); c.globalAlpha = 1; }
    R(c, NOIR, x, y, 14, 40); R(c, '#2a2438', x + 1, y + 1, 12, 38);
    for (let yy = y + 4; yy < y + 36; yy++) {
      const f = (yy - y) / 40, o1 = Math.round(Math.sin(t * 9 + yy * 0.6)), o2 = Math.round(Math.sin(t * 9 + yy * 0.6 + 2));
      R(c, brin(v, 0, f, t), x + 3 + o1, yy, 2, 1); R(c, brin(v, 1, f, t), x + 9 + o2, yy, 2, 1); R(c, '#ffffff', x + 6, yy, 2, 1);
    }
    R(c, '#c8c8d8', x - 1, y - 2, 16, 3); R(c, '#c8c8d8', x - 1, y + 39, 16, 3); R(c, '#ffffff', x + 2, y + 2, 1, 14);
    if (a) coche(c, x + 3, 94);
    else ecrire(c, String(v.prix), x + 7, 94, { centre: true, coul: s.pieces >= v.prix ? '#fff27a' : '#8a7a9a' });
    if (v.id === s.rayon) R(c, '#6ee03a', x + 2, 104, 10, 2);
    if (k === k0) R(c, '#fff27a', x - 2, 107, 18, 2);
    zones.push({ id: 'rayon:' + v.id, x: x - 4, y: 30, w: 22, h: 80, label: `Rayon ${v.nom.toLowerCase()} : ${a ? (v.id === s.rayon ? 'en main' : 'à toi') : v.prix + ' pièces'}`, presse: k === k0 });
  });
  // l'essai, à droite
  R(c, NOIR, 192, 26, 122, 78); R(c, '#1a1226', 193, 27, 120, 76);
  for (let y = 80; y < 103; y++) R(c, y % 4 < 2 ? '#2a1a2a' : '#24162a', 193, y, 120, 1);
  ecrire(c, 'ESSAI', 197, 30, { coul: '#b8a6c8' });
  const ex = 284 + Math.sin(t * 1.3) * 3, ey = 52, dx = ((t * 30) | 0) & 1 ? 1 : -1;
  c.drawImage(S.ectoTenue, Math.round(ex - 15 + dx), ey - 15, 30, 30);
  essai(c, t, 200, 102, ex, ey + 2, r);
  // le comptoir
  R(c, NOIR, 0, 112, W, 6); R(c, '#8a5a30', 0, 113, W, 3); R(c, '#5a3418', 0, 116, W, 1);
  R(c, '#3a2214', 0, 118, W, H - 118); for (let x = 8; x < W; x += 40) R(c, '#2a160c', x, 120, 1, 60);
  R(c, NOIR, 8, 124, 304, 50); R(c, '#1e1028', 9, 125, 302, 48);
  ecrire(c, r.nom, 16, 130, { sc: 2, coul: '#ffffff', contour: NOIR, gras: true });
  ecrire(c, r.texte, 16, 150, { coul: '#c8b8e0' });
  if (possede(s, r.id)) {
    const enMain = r.id === s.rayon;
    ecrire(c, enMain ? 'C\'EST TON RAYON' : 'DÉJÀ À TOI', 16, 162, { coul: '#6ee03a' });
    bouton(c, 222, 146, 84, 22, enMain ? 'EN MAIN' : 'PRENDRE', { vif: !enMain });
    if (!enMain) zones.push({ id: 'prendre', x: 218, y: 142, w: 92, h: 30, label: `Prendre le rayon ${r.nom.toLowerCase()}` });
  } else {
    const assez = s.pieces >= r.prix;
    piece(c, 20, 165);
    ecrire(c, assez ? r.prix + ' PIÈCES' : r.prix + ' PIÈCES : IL T\'EN MANQUE ' + (r.prix - s.pieces), 27, 162, { coul: assez ? '#fff27a' : '#8a7a9a' });
    if (assez) { bouton(c, 222, 146, 84, 22, 'ACHETER', { vif: true }); zones.push({ id: 'acheter', x: 218, y: 142, w: 92, h: 30, label: `Acheter le rayon ${r.nom.toLowerCase()} pour ${r.prix} pièces` }); }
    else { R(c, NOIR, 222, 146, 84, 22); R(c, '#4a3a5a', 223, 147, 82, 20); ecrire(c, 'ACHETER', 264, 153, { centre: true, coul: '#8a7a9a' }); }
  }
  return zones;
}

/** En portrait : la toile n'est qu'une bande, on demande de tourner. */
export function tourner(ctx) {
  R(ctx, '#140c2a', 0, 0, W, H);
  ['TOURNE TON', 'TÉLÉPHONE', "À L'HORIZONTALE"].forEach((l, k) => ecrire(ctx, l, 160, 40 + k * 36, { sc: 3, centre: true, coul: '#fff27a', contour: NOIR }));
}
