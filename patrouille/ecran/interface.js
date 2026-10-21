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
  const ligne = (c, part, couleur) => {
    ctx.save(); ctx.translate(22, y + 8); ctx.scale(0.7, 0.7); icone(ctx, c); ctx.restore();
    ctx.fillStyle = '#fff3'; ctx.fillRect(38, y + 5, 60, 6);
    ctx.fillStyle = couleur; ctx.fillRect(38, y + 5, 60 * Math.max(0, part), 6);
    y += 24;
  };
  if (p.arme) ligne({ arme: p.arme.k }, p.arme.mun / ARMES[p.arme.k].mun, ARMES[p.arme.k].couleur);
  for (const b of ['aimant', 'compagnons', 'etoile']) if (p[b] > 0) ligne({ bonus: b }, p[b] / DUREES[b], '#fff');
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
