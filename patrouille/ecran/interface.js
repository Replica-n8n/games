// L'interface posée sur la mission : cœurs, cristaux, astronautes, arme, bonus, avancée,
// message. Dessinée dans le canvas, jamais retournée (même quand le décor défile vers le bas).
import { W, H, SEC } from '../moteur/constantes.js';
import { ARMES } from '../moteur/tirs.js';
import { DUREES } from '../moteur/bonus.js';
import { icone } from './rendu.js';

/**
 * @param {CanvasRenderingContext2D} ctx @param {any} p
 * @param {{ texte: string, reste: number } | null} message
 */
export function dessinerInterface(ctx, p, message) {
  // Avancée de la mission
  const fin = (p.vagues.find((v) => v[1].f === 'fin')?.[0] ?? 120) * SEC;
  ctx.fillStyle = '#ffffff22'; ctx.fillRect(12, 4, W - 72, 3);
  ctx.fillStyle = p.planete.couleur; ctx.fillRect(12, 4, Math.min(1, p.t / fin) * (W - 72), 3);
  // Cœurs
  for (let i = 0; i < p.coeursMax; i++) {
    ctx.fillStyle = i < p.coeurs ? '#ff4f6d' : '#3a2440';
    ctx.beginPath(); ctx.arc(20 + i * 24, 24, 9, 0, Math.PI * 2); ctx.fill();
  }
  if (p.bouclier) { ctx.strokeStyle = '#8ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(20 + p.coeursMax * 24, 24, 9, 0, Math.PI * 2); ctx.stroke(); }
  // Cristaux
  ctx.fillStyle = '#87f3ff'; ctx.beginPath(); ctx.moveTo(W / 2 - 4, 16); ctx.lineTo(W / 2 + 2, 24); ctx.lineTo(W / 2 - 4, 32); ctx.lineTo(W / 2 - 10, 24); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '700 18px system-ui,sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText(String(p.cristaux), W / 2 + 8, 25);
  // Astronautes de la mission
  Object.keys(p.mission.cages).forEach((id, i) => {
    ctx.fillStyle = p.cagesLibres.includes(id) ? '#5fd68a' : '#2c3a3a';
    ctx.beginPath(); ctx.arc(W - 118 + i * 16, 24, 6, 0, Math.PI * 2); ctx.fill();
  });
  // Arme et bonus en cours, avec leur temps restant
  let y = 46;
  // Pendant un calme, arme et bonus attendent : leur barre est grisée, avec le signe pause
  const ligne = (c, part, couleur, enPause) => {
    ctx.save(); ctx.globalAlpha = enPause ? 0.55 : 1; ctx.translate(22, y + 8); ctx.scale(0.7, 0.7); icone(ctx, c); ctx.restore();
    ctx.fillStyle = '#fff3'; ctx.fillRect(38, y + 5, 60, 6);
    ctx.fillStyle = enPause ? '#9aa3d0' : couleur; ctx.fillRect(38, y + 5, 60 * Math.max(0, part), 6);
    if (enPause) { ctx.fillStyle = '#fff'; ctx.fillRect(104, y + 2, 3, 12); ctx.fillRect(110, y + 2, 3, 12); }
    y += 24;
  };
  if (p.robot) { // le robot : son temps et ses 5 coups
    ctx.fillStyle = '#e33'; ctx.fillRect(14, y + 1, 16, 14);
    ctx.fillStyle = '#fff3'; ctx.fillRect(38, y + 5, 60, 6); ctx.fillStyle = '#e33'; ctx.fillRect(38, y + 5, (60 * p.robot.t) / (20 * SEC), 6);
    for (let i = 0; i < p.robot.pv; i++) { ctx.fillStyle = '#fd2'; ctx.fillRect(104 + i * 9, y + 3, 6, 10); }
    y += 24;
  }
  if (p.arme) ligne({ arme: p.arme.k }, p.arme.mun / ARMES[p.arme.k].mun, ARMES[p.arme.k].couleur, !p.actif);
  for (const b of ['aimant', 'compagnons', 'etoile']) if (p[b] > 0) ligne({ bonus: b }, p[b] / DUREES[b], '#fff', !p.actif && !(b === 'aimant' && p.objets.some((o) => o.k === 'cristal')));
  // Barre de vie du boss, et alerte avant son arrivée
  if (p.boss && p.boss.y > 0) {
    ctx.fillStyle = '#000a'; ctx.fillRect(40, 70, W - 80, 10);
    ctx.fillStyle = p.boss.phase === 1 ? '#ffd23f' : '#ff6a2a'; ctx.fillRect(40, 70, ((W - 80) * Math.max(0, p.boss.pv)) / p.boss.pvMax, 10);
  }
  if (p.alerte > 0 && Math.floor(p.alerte / 15) % 2) {
    ctx.fillStyle = '#ff4f6dcc'; ctx.fillRect(0, H / 2 - 30, W, 60);
    ctx.fillStyle = '#fff'; ctx.font = '800 30px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('ATTENTION !', W / 2, H / 2 + 2);
  }
  // Message, aux deux tiers de l'écran : près du regard, au-dessus du module
  if (message && message.reste > 0) {
    ctx.font = '700 15px system-ui,sans-serif'; ctx.textAlign = 'center';
    const l = Math.min(W - 16, ctx.measureText(message.texte).width + 28);
    ctx.globalAlpha = Math.min(1, message.reste / 20);
    ctx.fillStyle = '#060a26cc'; ctx.beginPath(); ctx.roundRect((W - l) / 2, H - 236, l, 34, 17); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(message.texte, W / 2, H - 218, W - 28);
    ctx.globalAlpha = 1;
  }
}
