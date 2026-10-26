// Ghost Train : fait jouer chaque mission par les robots et mesure durée, note,
// pièces, cœurs perdus et part des défaites, puis ARRÊT PAR ARRÊT la part des
// fantômes capturés. Sans navigateur, des dizaines de parties par seconde.
//   node tools/ghost-train-robot.mjs [n=40]
//   node tools/ghost-train-robot.mjs [n] --controle   échoue si un arrêt descend sous
//     80 % de captures pour l'enfant (la mission 1 apprend, elle ne doit rien rendre impossible),
//     70 % sur une voie à deux têtes de mort, choisie pour être dangereuse (le vestiaire)
import { creePartie, pasPartie } from '../ghost-train/moteur/partie.js';
import { MISSIONS, MISSIONS_EXISTANTES } from '../ghost-train/contenu/missions.js';
import { creeBot } from './ghost-train-bot.mjs';

const N = Number(process.argv[2]) || 40;
const CONTROLE = process.argv.includes('--controle');
const SEUIL_ARRET = 0.8, SEUIL_DANGER = 0.7;
/** Le seuil d'un arrêt : plus bas sur une voie annoncée dangereuse. */
function seuil(id, cle) {
  const [, z, voie] = /^z([\d.]+)(?: (g|d))?$/.exec(cle) || [];
  if (!voie) return SEUIL_ARRET;
  const aig = MISSIONS[id].parcours.find((e) => e.aiguillage && e.aiguillage[voie].etapes.some((x) => String(x.z) === z));
  return aig && aig.aiguillage[voie].danger >= 2 ? SEUIL_DANGER : SEUIL_ARRET;
}
const moy = (t) => t.reduce((a, b) => a + b, 0) / (t.length || 1);

/** Joue une partie ; `arrets` reçoit, pour chaque arrêt (par son z), les prises et le total. */
export function jouer(id, profil, graine, voie, arrets = null) {
  const p = creePartie({ mission: MISSIONS[id], graine });
  const bot = creeBot(profil, { voie, graine: graine * 7 + 1 });
  let n = 0, cle = null, debut = null;
  while (p.etat !== 'fini' && p.etat !== 'mort' && n++ < 60 * 400) {
    if (arrets) {
      if (p.rail === 'arret' && cle === null) { cle = `z${p.camZ}${p.voie ? ' ' + p.voie : ''}`; debut = { pr: p.prises, to: p.total }; }
      if (p.rail !== 'arret' && cle !== null) {
        const a = arrets[cle] || (arrets[cle] = { pr: 0, to: 0 });
        a.pr += p.prises - debut.pr; a.to += p.total - debut.to; cle = null;
      }
    }
    pasPartie(p, bot(p));
  }
  return p;
}

let echecs = 0;
for (const id of MISSIONS_EXISTANTES) {
  for (const profil of ['expert', 'enfant']) {
    const parts = [], arrets = {};
    for (let g = 1; g <= N; g++) parts.push(jouer(id, profil, g, g % 2 ? 'g' : 'd', arrets));
    const finies = parts.filter((p) => p.etat === 'fini');
    const notes = {};
    for (const p of finies) notes[p.bilan.note] = (notes[p.bilan.note] || 0) + 1;
    console.log(`${id} · ${profil.padEnd(6)} : ${Math.round(100 * (1 - finies.length / N))} % de défaites, ` +
      `${Math.round(moy(finies.map((p) => p.t)))} s, ${Math.round(moy(finies.map((p) => p.pieces)))} pièces, ` +
      `${moy(parts.map((p) => p.coeursPerdus)).toFixed(1)} cœurs perdus, capturés ${Math.round(100 * moy(finies.map((p) => p.prises / p.total)))} %, ` +
      `notes ${JSON.stringify(notes)}`);
    const ligne = Object.entries(arrets).sort((a, b) => parseFloat(a[0].slice(1)) - parseFloat(b[0].slice(1)))
      .map(([k, a]) => { const part = a.to ? a.pr / a.to : 1, min = seuil(id, k); if (profil === 'enfant' && part < min) echecs++; return `${k} ${Math.round(100 * part)} %${min < SEUIL_ARRET ? ' (voie dangereuse, seuil 70 %)' : ''}`; });
    console.log(`    par arrêt : ${ligne.join(' · ')}`);
  }
}
if (CONTROLE) {
  if (echecs) { console.log(`✗ ${echecs} arrêt(s) sous leur seuil de captures pour l'enfant`); process.exit(1); }
  console.log("✓ chaque arrêt au-dessus de son seuil pour l'enfant (80 %, 70 % sur une voie dangereuse)");
}
