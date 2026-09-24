// Paper Race : les courses à plusieurs sont-elles justes ?
// Fantômes « normal » tous identiques, grille dans l'ordre (voiture i = place i),
// N courses par circuit : part des victoires de chaque place de grille.
//   node tools/paper-race-equite.js                (contrôle : échoue si injuste)
//   node tools/paper-race-equite.js --ordre fixe   (à rebours à 6 : DOIT échouer)
//   node tools/paper-race-equite.js --sans-tirage  (à rebours à 2 : DOIT échouer)
// À DEUX, on alterne (l'ordre qui tourne y ferait jouer chacun deux fois de
// suite) : l'équité vient alors du TIRAGE AU SORT de la grille, et c'est lui
// qu'on mesure — les victoires par JOUEUR, la place tirée à chaque course.
// Mesures d'origine : docs/superpowers/specs/2026-09-19-paper-race-grille-design.md
const E = require('../paper-race/moteur.js');
// ⚠️ 120 courses, pas 40 : à 40, la 3e place à 6 sur les vrais tracés tombait au
// hasard de part et d'autre du seuil (24 %, puis 31 % : du bruit). Sur 480 courses,
// v19 et v20 donnent le MÊME 27 % : un biais ancien, réel, juste sous le seuil.
const N = +(process.env.N || 120);
const ordre = process.argv.includes('fixe') ? 'fixe' : 'tourne';
let echecs = 0;
const echec = (m) => { console.log('ECHEC : ' + m); echecs++; };

function tirage(n, rnd) {
  const g = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [g[i], g[j]] = [g[j], g[i]]; }
  return g;
}
function course(i, n, seed, auSort) {
  let s = seed; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const grille = auSort ? tirage(n, rnd) : [...Array(n).keys()];
  const r = E.newRace(i, 1, 'tour', { n, grille, regles: 'grille', ordre });
  let garde = 0, chef = -1, changes = 0, manche = r.manche;
  while (!E.finie(r) && garde++ < 4000) {
    const q = E.aiChoice(r, 'normal', rnd);
    if (q === null) E.stuck(r); else E.play(r, q);
    E.nextTurn(r);
    // qui mène : une fois par TOUR DE JEU (sinon on compte les dépassements
    // d'une demi-case pendant le tour, et le signal se noie)
    if (r.manche === manche) continue;
    manche = r.manche;
    const cl = E.classement(r), t = cl[0].exaequo ? -1 : cl[0].voiture;
    if (t >= 0) { if (chef >= 0 && t !== chef) changes++; chef = t; }
  }
  const c = E.classement(r);
  return { gagnant: c.length && !c[0].exaequo ? c[0].voiture : -1, changes };
}
function banc(n, circuits, auSort) {
  const g = Array(n).fill(0); let total = 0, chg = 0;
  for (const i of circuits) for (let k = 1; k <= N; k++) {
    const x = course(i, n, k * 7919, auSort);
    if (x.gagnant >= 0) g[x.gagnant]++;
    chg += x.changes; total++;
  }
  const parts = g.map(v => v / total);
  parts.tete = chg / total;
  return parts;
}
const idx = (f) => E.TRACKS.map((t, i) => i).filter(i => f(E.TRACKS[i]));
const grands = idx(t => E.pelotonPermis(t)), tous = idx(() => true);

// les petits circuits sont trop étroits pour doubler à plusieurs : refusés dès 3
for (const i of idx(t => !E.pelotonPermis(t))) {
  let refuse = false; try { E.newRace(i, 1, 'tour', { n: 3, regles: 'grille' }); } catch (e) { refuse = true; }
  if (!refuse) echec(E.TRACKS[i].id + ' accepte une course à 3 voitures');
}
if (grands.length < 4) echec('au moins 4 grands circuits attendus, ' + grands.length + ' trouvés');

const pc = (a) => a.map(x => Math.round(100 * x) + '%').join(' ');
const auSort = !process.argv.includes('--sans-tirage');
const a2 = banc(2, tous, auSort);
console.log(`ordre ${ordre}, grille ${auSort ? 'tirée au sort' : 'fixe'}, ${N} courses par circuit`);
console.log(`2 voitures, ${tous.length} circuits  : ` + pc(a2) + ` (juste 50%, ${auSort ? 'par JOUEUR' : 'par PLACE'})`);
// à deux, on alterne : c'est le tirage de la grille qui doit égaliser les joueurs
if (Math.max(...a2) > 0.55) echec(`à 2, un ${auSort ? 'joueur' : 'place'} gagne plus de 55 % (sans tirage : 60 %)`);
// Deux familles : les circuits DESSINÉS à la main (étroits, on y double mal) et
// les VRAIS tracés (plus ouverts). L'ordre qui tourne se prouve sur les premiers
// (ordre fixe : 29 % à la pole, contre 18 %) ; sur les seconds, MESURÉ, les deux
// ordres se valent : ne pas prétendre le contraire.
const anciens = grands.filter(i => !/vrai$/.test(E.TRACKS[i].id));
const vrais = grands.filter(i => /vrai$/.test(E.TRACKS[i].id));
for (const [nom, ids, seuil] of [['dessinés   ', anciens, 0.25], ['vrais tracés', vrais, 0.28]]) {
  const a6 = banc(6, ids);
  console.log(`6 voitures, ${ids.length} ${nom} : ` + pc(a6) + ` (juste 17%) · la tête change ${a6.tete.toFixed(1)} fois par course`);
  if (Math.max(...a6) > seuil) echec(`à 6 sur les ${nom.trim()}, une place gagne ${Math.round(100 * Math.max(...a6))} % (plus de ${Math.round(100 * seuil)} %)`);
}
if (process.argv.includes('--tout')) console.log('4 voitures, grands      : ' + pc(banc(4, grands)) + ' (juste 25%)');
if (echecs) process.exit(1);
console.log('OK : courses à plusieurs équitables');
