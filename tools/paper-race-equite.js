// Paper Race : les courses à plusieurs sont-elles justes ?
// Fantômes « normal » tous identiques, grille dans l'ordre (voiture i = place i),
// N courses par circuit : part des victoires de chaque place de grille.
//   node tools/paper-race-equite.js              (contrôle : échoue si injuste)
//   node tools/paper-race-equite.js --ordre fixe (contrôle à rebours : DOIT échouer)
// Mesures d'origine : docs/superpowers/specs/2026-09-19-paper-race-grille-design.md
const E = require('../paper-race/moteur.js');
const N = +(process.env.N || 40);
const ordre = process.argv.includes('fixe') ? 'fixe' : 'tourne';
let echecs = 0;
const echec = (m) => { console.log('ECHEC : ' + m); echecs++; };

function course(i, n, seed) {
  let s = seed; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const r = E.newRace(i, 1, 'tour', { n, grille: [...Array(n).keys()], regles: 'grille', ordre });
  let garde = 0;
  while (!E.finie(r) && garde++ < 4000) {
    const q = E.aiChoice(r, 'normal', rnd);
    if (q === null) E.stuck(r); else E.play(r, q);
    E.nextTurn(r);
  }
  const c = E.classement(r);
  return c.length && !c[0].exaequo ? c[0].voiture : -1;
}
function banc(n, circuits) {
  const g = Array(n).fill(0); let total = 0;
  for (const i of circuits) for (let k = 1; k <= N; k++) { const w = course(i, n, k * 7919); if (w >= 0) g[w]++; total++; }
  return g.map(v => v / total);
}
const idx = (f) => E.TRACKS.map((t, i) => i).filter(i => f(E.TRACKS[i]));
const grands = idx(t => E.pelotonPermis(t)), tous = idx(() => true);

// les petits circuits sont trop étroits pour doubler à plusieurs : refusés dès 3
for (const i of idx(t => !E.pelotonPermis(t))) {
  let refuse = false; try { E.newRace(i, 1, 'tour', { n: 3, regles: 'grille' }); } catch (e) { refuse = true; }
  if (!refuse) echec(E.TRACKS[i].id + ' accepte une course à 3 voitures');
}
if (grands.length !== 4) echec('4 grands circuits attendus, ' + grands.length + ' trouvés');

const pc = (a) => a.map(x => Math.round(100 * x) + '%').join(' ');
const a2 = banc(2, tous);
console.log(`ordre ${ordre}, ${N} courses par circuit`);
console.log('2 voitures, 7 circuits   : ' + pc(a2) + ' (juste 50%)');
if (Math.max(...a2) > 0.6) echec('à 2, une place gagne plus de 60 %');
const a6 = banc(6, grands);
console.log('6 voitures, grands      : ' + pc(a6) + ' (juste 17%)');
if (Math.max(...a6) > 2 / 6) echec('à 6, une place gagne plus du double de sa part');
if (process.argv.includes('--tout')) console.log('4 voitures, grands      : ' + pc(banc(4, grands)) + ' (juste 25%)');
if (echecs) process.exit(1);
console.log('OK : courses à plusieurs équitables');
