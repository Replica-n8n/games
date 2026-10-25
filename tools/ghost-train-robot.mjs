// Ghost Train : fait jouer chaque mission par les robots et mesure durée, note,
// pièces, cœurs perdus et part des défaites. Sans navigateur, des dizaines de
// parties par seconde.
//   node tools/ghost-train-robot.mjs [n=40]
import { creePartie, pasPartie } from '../ghost-train/moteur/partie.js';
import { MISSIONS, MISSIONS_EXISTANTES } from '../ghost-train/contenu/missions.js';
import { creeBot } from './ghost-train-bot.mjs';

const N = Number(process.argv[2]) || 40;
const moy = (t) => t.reduce((a, b) => a + b, 0) / (t.length || 1);

export function jouer(id, profil, graine, voie) {
  const p = creePartie({ mission: MISSIONS[id], graine });
  const bot = creeBot(profil, { voie, graine: graine * 7 + 1 });
  let n = 0;
  while (p.etat !== 'fini' && p.etat !== 'mort' && n++ < 60 * 400) pasPartie(p, bot(p));
  return p;
}

for (const id of MISSIONS_EXISTANTES) {
  for (const profil of ['expert', 'enfant']) {
    const parts = [];
    for (let g = 1; g <= N; g++) parts.push(jouer(id, profil, g, g % 2 ? 'g' : 'd'));
    const finies = parts.filter((p) => p.etat === 'fini');
    const notes = {};
    for (const p of finies) notes[p.bilan.note] = (notes[p.bilan.note] || 0) + 1;
    console.log(`${id} · ${profil.padEnd(6)} : ${Math.round(100 * (1 - finies.length / N))} % de défaites, ` +
      `${Math.round(moy(finies.map((p) => p.t)))} s, ${Math.round(moy(finies.map((p) => p.pieces)))} pièces, ` +
      `${moy(parts.map((p) => p.coeursPerdus)).toFixed(1)} cœurs perdus, capturés ${Math.round(100 * moy(finies.map((p) => p.prises / p.total)))} %, ` +
      `notes ${JSON.stringify(notes)}`);
  }
}
