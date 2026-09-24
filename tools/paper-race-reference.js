// Paper Race : empreinte des courses « classiques » (championnat et duo v7).
// Toute modification du moteur doit redonner EXACTEMENT cette sortie pour une
// course créée sans options : c'est la preuve que le championnat n'a pas bougé.
//   node tools/paper-race-reference.js > sortie.txt
//   node tools/paper-race-reference.js --controle   (compare à tools/references/paper-race-championnat.txt)
// v11 : les 4 vrais tracés ajoutés ; les 210 courses des 7 circuits d'avant sont restées identiques.
// v17 : coincé en roulant, la voiture file dans le mur (voulu). 50 courses ont changé,
// EXACTEMENT parmi les 64 qui avaient un « coincé » en roulant, aucune autre ; les 14
// restées pareilles sont des voitures arrêtées net par une autre juste devant.
const fs = require('fs'), path = require('path');
const E = require('../paper-race/moteur.js');
const lignes = [];
const empreinte = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16).padStart(8, '0'); };
for (let i = 0; i < E.TRACKS.length; i++) {
  for (const fin of ['joueur', 'premier']) {
    for (const lvl of ['tranquille', 'normal', 'rapide']) {
      for (let g = 1; g <= 5; g++) {
        let s = g * 7919; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
        const r = E.newRace(i, 1, fin);
        let n = 0;
        while (!E.finie(r) && n++ < 600) {
          const q = E.aiChoice(r, lvl, rnd);
          if (q === null) E.stuck(r); else E.play(r, q);
          E.nextTurn(r);
        }
        const trace = r.cars.map(c => c.trail.map(p => p.join(',')).join(' ')).join(' | ');
        lignes.push([E.TRACKS[i].id, fin, lvl, g, 'gagnant ' + r.winner, 'coups ' + r.cars.map(c => c.coups).join('/'),
          'sorties ' + r.cars.map(c => c.crashes).join('/'), 'trace ' + empreinte(trace)].join(' '));
      }
    }
  }
}
const sortie = lignes.join('\n') + '\n';
if (process.argv.includes('--controle')) {
  const ref = fs.readFileSync(path.join(__dirname, 'references', 'paper-race-championnat.txt'), 'utf8').replace(/\r\n/g, '\n');
  const a = ref.split('\n'), b = sortie.split('\n');
  const diff = b.filter((l, k) => l !== a[k]);
  if (diff.length || a.length !== b.length) { console.log('ECHEC : ' + diff.length + ' courses classiques ont changé, ex. ' + diff[0]); process.exit(1); }
  console.log('OK : ' + (b.length - 1) + ' courses classiques identiques à la référence');
} else process.stdout.write(sortie);
