// Paper Race : les trois niveaux du fantôme sont-ils vraiment différents ?
//
// Un joueur a dit ne voir aucune différence entre « normal » et « vite » : mesuré
// le 2026-09-18, 1 à 4 coups d'écart sur 40 à 60, c'était vrai. Chaque niveau a
// maintenant une limite de vitesse (NIVEAUX.vmax dans moteur.js). Ce contrôle
// fait courir chaque niveau SEUL sur chaque circuit (son rythme propre, sans
// l'autre voiture) et vérifie que les niveaux restent séparés d'un écart qui se
// sent en jouant :
//   vite       : au plus 15 % au-dessus du par (même lui n'est pas parfait)
//   normal     : au moins 10 % plus lent que vite
//   tranquille : au moins 10 % plus lent que normal
const E = require('../paper-race/moteur.js');
const N = +(process.env.N || 10);
function tour(ti, lvl, seed) {
  let s = seed; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const r = E.newRace(ti, 1, 'joueur'); r.cars[1].fini = true;   // l'autre voiture est hors course
  for (let n = 0; n < 600 && !r.cars[0].fini; n++) { r.turn = 0; const q = E.aiChoice(r, lvl, rnd); if (q === null) E.stuck(r); else E.play(r, q); }
  return r.cars[0].fini ? r.cars[0].coups : 999;
}
let fails = 0;
const check = (n, c) => { if (!c) { console.log('ECHEC: ' + n); fails++; } };
console.log('circuit'.padEnd(12), 'par', ' tranquille', ' normal', '  vite', '   écarts (vite/par, normal/vite, tranquille/normal)');
for (let i = 0; i < E.TRACKS.length; i++) {
  const tk = E.TRACKS[i], m = {};
  for (const lvl of ['tranquille', 'normal', 'rapide']) { let t = 0; for (let g = 1; g <= N; g++) t += tour(i, lvl, g * 7919); m[lvl] = t / N; }
  const e1 = m.rapide / tk.par - 1, e2 = m.normal / m.rapide - 1, e3 = m.tranquille / m.normal - 1;
  console.log(tk.nom.padEnd(12), String(tk.par).padStart(3), m.tranquille.toFixed(1).padStart(10), m.normal.toFixed(1).padStart(7), m.rapide.toFixed(1).padStart(6),
    '   ' + [e1, e2, e3].map(x => (x >= 0 ? '+' : '') + Math.round(x * 100) + ' %').join('  '));
  check(tk.nom + ' : vite reste près du par (+15 % au plus)', e1 <= 0.15);
  check(tk.nom + ' : normal nettement plus lent que vite (+10 % au moins)', e2 >= 0.10);
  check(tk.nom + ' : tranquille nettement plus lent que normal (+10 % au moins)', e3 >= 0.10);
}
console.log(fails ? fails + ' ECHEC(S)' : 'NIVEAUX SEPARES');
process.exitCode = fails ? 1 : 0;
