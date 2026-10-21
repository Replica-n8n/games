// Le copain à sauver (idée de Star Fox) et le robot de combat (idée de Metal Slug).
import { W, SEC } from './constantes.js';

/** Un copain astronaute arrive par le bas, poursuivi par trois chasseurs. @param {any} p */
export function creerCopain(p) {
  const x = p.h.entre(80, W - 80);
  p.copain = { x, y: 700, etat: 'fuit', age: 0 };
  for (let i = 0; i < 3; i++) p.ajouter('chasseur', x + (i - 1) * 30, 750 + i * 22);
  p.message('Un copain appelle à l\'aide ! Abats ses poursuivants', 3 * SEC);
}

/** Un chasseur l'a rattrapé : il est emporté (le rater ne coûte rien d'autre). @param {any} p */
export function attraperCopain(p) {
  if (!p.copain || p.copain.etat !== 'fuit') return;
  p.copain.etat = 'pris';
  p.message('Trop tard, le copain est emporté…', 2.5 * SEC);
}

/** @param {any} p @param {(o: any) => void} balle */
export function majCopain(p, balle) {
  const c = p.copain;
  if (!c) return;
  c.age++;
  if (c.etat === 'fuit') {
    if (c.y > 260) c.y -= 1.3;
    c.x = Math.max(20, Math.min(W - 20, c.x + Math.sin(c.age * 0.04) * 1.4));
    if (!p.ennemis.some((e) => e.type === 'chasseur' && !e.mort)) {
      c.etat = 'ami'; p.copainSauve = true;
      p.message(p.mission.ouvreSecret ? 'Copain sauvé ! Il t\'aide, et un chemin secret s\'ouvre' : 'Copain sauvé ! Il t\'aide', 3 * SEC);
    }
  } else if (c.etat === 'pris') {
    c.y -= 2.5;
    if (c.y < -30) p.copain = null;
  } else {
    // Allié : il vole à côté du module et tire avec lui jusqu'à la fin de la mission
    c.x += (p.j.x - 38 - c.x) * 0.12; c.y += (p.j.y + 12 - c.y) * 0.12;
    if (c.age % 14 === 0) balle({ x: c.x, y: c.y - 10 });
  }
}

/** Le module monte dans le robot de combat : 20 s, il encaisse 5 coups. @param {any} p */
export function monterRobot(p) {
  p.robot = { t: 20 * SEC, pv: 5 };
  p.message('Le robot de combat ! Il encaisse 5 coups', 2.5 * SEC);
}

/** @param {any} p */
export function descendreRobot(p) {
  for (let i = 0; i < 16; i++) p.effets.push({ x: p.j.x, y: p.j.y, vx: p.hv.entre(-4, 4), vy: p.hv.entre(-4, 4), vie: 40, couleur: ['#e33', '#3a3', '#36f', '#fd2'][i % 4] });
  p.robot = null;
  p.j.inv = 70;
  p.message('Le robot se démonte !', 1.5 * SEC);
}
