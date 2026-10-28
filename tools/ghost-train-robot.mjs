// Ghost Train : les robots jouent chaque mission, sans navigateur, avec le vrai
// moteur. Ce qu'ils mesurent : durée, défaites, cœurs perdus, notes, et la part
// des fantômes capturés SALLE PAR SALLE (une salle trop dure se voit tout de suite).
//   node tools/ghost-train-robot.mjs [n]          n parties par robot (40 par défaut)
//   node tools/ghost-train-robot.mjs --controle   échoue si un seuil n'est pas tenu :
//     l'expert ne perd jamais ; l'enfant perd au plus 15 % des parties et capture
//     au moins 80 % des fantômes de chaque salle.
import { creePartie, pasPartie } from '../ghost-train/moteur/partie.js';
import { creeRobot } from '../ghost-train/moteur/joueur.js';
import { MISSIONS } from '../ghost-train/contenu/missions.js';

const CONTROLE = process.argv.includes('--controle');
const N = Number(process.argv.find((a) => /^\d+$/.test(a))) || 40;
const echecs = [];

function jouer(mission, niveau, graine) {
  const p = creePartie({ mission, graine, options: {} });
  const robot = creeRobot(niveau, graine * 31 + 7);
  const parSalle = {};
  let salle = p.salle, vus0 = 0, prises0 = 0;
  for (let k = 0; k < 60 * 400 && p.etat !== 'fini' && p.etat !== 'mort'; k++) {
    pasPartie(p, robot(p));
    p.evenements.length = 0;
    if (p.salle !== salle) { parSalle[salle] = [p.captures - prises0, p.vus - vus0]; salle = p.salle; vus0 = p.vus; prises0 = p.captures; }
  }
  parSalle[salle] = [p.captures - prises0, p.vus - vus0];
  return { p, parSalle };
}

for (const mission of Object.values(MISSIONS)) {
  for (const niveau of ['expert', 'enfant']) {
    let defaites = 0, duree = 0, perdus = 0, pieces = 0;
    const notes = {}, salles = {};
    for (let g = 1; g <= N; g++) {
      const { p, parSalle } = jouer(mission, niveau, g);
      if (p.etat !== 'fini') defaites++;
      duree += p.t; perdus += p.coeursPerdus; pieces += p.pieces;
      if (p.bilan && p.bilan.note) notes[p.bilan.note] = (notes[p.bilan.note] || 0) + 1;
      for (const [s, [a, b]] of Object.entries(parSalle)) { salles[s] = salles[s] || [0, 0]; salles[s][0] += a; salles[s][1] += b; }
    }
    const pc = (a, b) => (b ? Math.round((a / b) * 100) : 100);
    console.log(`${mission.id} · ${niveau} : ${pc(defaites, N)} % de défaites, ${Math.round(duree / N)} s, ${Math.round(pieces / N)} pièces, ${(perdus / N).toFixed(1)} cœurs perdus, notes ${JSON.stringify(notes)}`);
    console.log('    par salle : ' + Object.entries(salles).map(([s, [a, b]]) => `${s} ${pc(a, b)} %`).join(' · '));
    if (niveau === 'expert' && defaites) echecs.push(`${mission.id} : l'expert perd ${defaites} fois`);
    if (niveau === 'enfant') {
      if (defaites / N > 0.15) echecs.push(`${mission.id} : l'enfant perd ${pc(defaites, N)} % des parties`);
      for (const [s, [a, b]] of Object.entries(salles)) if (pc(a, b) < 80) echecs.push(`${mission.id}, ${s} : l'enfant ne capture que ${pc(a, b)} %`);
    }
  }
}
if (CONTROLE) {
  if (echecs.length) { console.log('✗ ' + echecs.join('\n✗ ')); process.exit(1); }
  console.log('✓ l\'expert ne perd jamais, l\'enfant perd au plus 15 % et capture au moins 80 % par salle');
}
