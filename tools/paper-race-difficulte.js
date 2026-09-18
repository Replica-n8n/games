// Paper Race : la difficulté de chaque circuit, MESURÉE, et l'ordre du championnat.
//
// Mesure : le TOUR PARFAIT, trouvé par recherche en largeur, et ce qu'il exige.
//   freinages = coups du tour parfait où la vitesse baisse
//   accidents = sorties + « coincé » par course d'un joueur correct (l'ordinateur
//               « normal »), sur N courses : ce que coûte un freinage raté
//   difficulté = freinages + 3 x accidents
// Chaque freinage est une décision à anticiper plusieurs coups avant : c'est
// exactement ce qui rend un circuit difficile dans ce jeu. Un premier essai
// mesurait les coups perdus par l'ordinateur « tranquille » : il classait « La
// croix » comme le plus facile de tous, parce que cet ordinateur est lent
// PARTOUT par construction. Il mesurait sa prudence, pas le circuit.
//
// Le championnat doit suivre cet ordre : TRACKS est rangé du plus facile au
// plus dur, et `--controle` échoue si ce n'est plus vrai.
const E = require('../paper-race/moteur.js');
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'paper-race-solveur.js'), 'utf8');
const par = new Function('E', src.slice(src.indexOf('function par('), src.indexOf('// largeur minimale')) + '; return par;')(E);

// le tour parfait, avec son chemin (même recherche que le solveur du par)
function tourParfait(tk, vmax) {
  vmax = vmax || 12;
  const D = E.champ(tk).max + 1;
  const vus = new Set(), file = [];
  for (const p of E.startCells(tk)) { file.push({ x: p[0], y: p[1], vx: 0, vy: 0, tour: 0, n: 0, pere: -1 }); vus.add(p[0] + ',' + p[1] + ',0,0,0'); }
  for (let t = 0; t < file.length; t++) {
    const cur = file[t];
    if (cur.tour >= 1) {
      const vit = []; for (let k = t; k >= 0; k = file[k].pere) vit.push(Math.max(Math.abs(file[k].vx), Math.abs(file[k].vy)));
      return { n: cur.n, vitesses: vit.reverse() };
    }
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const vx = cur.vx + dx, vy = cur.vy + dy;
      if (Math.abs(vx) > vmax || Math.abs(vy) > vmax) continue;
      const nx = cur.x + vx, ny = cur.y + vy;
      if (!E.onTrack(tk, nx, ny) || !E.segOk(tk, [cur.x, cur.y], [nx, ny])) continue;
      const a = E.avanceDe(tk, [cur.x, cur.y]), b = E.avanceDe(tk, [nx, ny]);
      let tour = cur.tour; const d = b - a;
      if (d < -D / 2) tour++; else if (d > D / 2) tour--;
      if (tour < 0) continue;
      const k = nx + ',' + ny + ',' + vx + ',' + vy + ',' + tour;
      if (vus.has(k)) continue;
      vus.add(k);
      file.push({ x: nx, y: ny, vx, vy, tour, n: cur.n + 1, pere: t });
    }
  }
  return null;
}

function accidents(ti) {
  let acc = 0;
  for (let g = 1; g <= N; g++) {
    let s = g * 7919; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    const r = E.newRace(ti, 1);
    for (let n = 0; r.winner === null && n < 500; n++) {
      const q = E.aiChoice(r, 'normal', rnd);
      if (q === null) { E.stuck(r); acc++; } else if (E.play(r, q).type === 'sortie') acc++;
      E.nextTurn(r);
    }
  }
  return acc / N;
}
const N = +(process.env.N || 8);

const lignes = [];
for (let i = 0; i < E.TRACKS.length; i++) {
  const tk = E.TRACKS[i];
  const t = tourParfait(tk);
  let freinages = 0, vmax = 0;
  for (let k = 1; k < t.vitesses.length; k++) { if (t.vitesses[k] < t.vitesses[k - 1]) freinages++; vmax = Math.max(vmax, t.vitesses[k]); }
  const acc = accidents(i);
  lignes.push({ i, id: tk.id, nom: tk.nom, par: t.n, parAffiche: tk.par, freinages, vmax, acc, score: freinages + 3 * acc });
}
console.log('circuit'.padEnd(15), 'par', 'affiché', 'freinages', 'vitesse max', 'accidents', 'difficulté');
for (const l of lignes) console.log(l.nom.padEnd(15), String(l.par).padStart(3), String(l.parAffiche).padStart(7), String(l.freinages).padStart(9), String(l.vmax).padStart(11), l.acc.toFixed(2).padStart(9), l.score.toFixed(1).padStart(10));
const tri = lignes.slice().sort((a, b) => a.score - b.score || a.par - b.par).map(l => l.id);
console.log('\nordre mesuré :', tri.join(' < '));
if (process.argv.includes('--controle')) {
  const ordre = E.TRACKS.map(t => t.id);
  const ok = ordre.join() === tri.join();
  console.log(ok ? 'CHAMPIONNAT DANS L ORDRE' : 'ECHEC : TRACKS n est pas range du plus facile au plus dur (' + ordre.join(' < ') + ')');
  process.exitCode = ok ? 0 : 1;
}
