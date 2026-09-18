const E = require('../paper-race/moteur.js');
let fails = 0;
const check = (n, c) => { if (!c) { console.log('ECHEC: ' + n); fails++; } };

// piste
for (let ti = 0; ti < 3; ti++) {
  const tk = E.TRACKS[ti];
  check('depart sur la piste ' + ti, E.startCells(tk).every(p => E.onTrack(tk, p[0], p[1])));
  const c = E.centerOf(tk);
  check('le centre est hors piste ' + ti, !E.onTrack(tk, Math.round(c[0]), Math.round(c[1])));
}

// un segment qui traverse l'ilot central est refuse
{
  const tk = E.TRACKS[1];
  check('traversee interdite', !E.segOk(tk, [2, 10], [14, 10]));
  check('ligne droite permise', E.segOk(tk, [2, 10], [2, 4]));
}

// neuf choix, tous distincts et centres sur le point projete
{
  const r = E.newRace(1, 1);
  r.cars[0].v = [-3, -1];
  const ch = E.choices(r);
  check('9 choix', ch.length === 9);
  const pr = E.projected(r.cars[0]);
  check('le 5e est le point projete', ch[4].p[0] === pr[0] && ch[4].p[1] === pr[1]);
  check('tous distincts', new Set(ch.map(c => c.p.join(','))).size === 9);
}

// sortie de piste : vitesse remise a zero, position sur la piste
{
  const r = E.newRace(1, 1);
  const car = r.cars[0];
  car.p = [2, 3]; car.v = [-3, -3];
  const ev = E.play(r, [-1, 0]);
  check('sortie detectee', ev.type === 'sortie');
  check('vitesse remise a zero', car.v[0] === 0 && car.v[1] === 0);
  check('position revenue sur la piste', E.onTrack(r.track, car.p[0], car.p[1]));
}

// course complete : IA contre IA sur les trois circuits
function course(ti, la, lb, seed) {
  let s = seed;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const r = E.newRace(ti, 1);
  let n = 0;
  while (r.winner === null && n < 400) {
    const lvl = r.turn === 0 ? la : lb;
    const q = E.aiChoice(r, lvl, rnd);
    const before = r.cars[r.turn].p.slice();
    if (q === null) { E.stuck(r); E.nextTurn(r); n++; continue; }
    E.play(r, q);
    if (!E.onTrack(r.track, r.cars[r.turn].p[0], r.cars[r.turn].p[1]))
      return { err: 'voiture hors piste apres le coup depuis ' + before };
    E.nextTurn(r);
    n++;
  }
  return { winner: r.winner, coups: r.cars.map(c => c.coups), crashes: r.cars.map(c => c.crashes) };
}

for (let ti = 0; ti < 3; ti++) {
  let cs = [], cr = [], bloq = 0;
  for (let s = 1; s <= 25; s++) {
    const res = course(ti, 'normal', 'normal', s * 7919);
    if (res.err) { console.log('ERREUR ' + res.err); fails++; break; }
    if (res.winner === null) bloq++;
    else { cs.push(res.coups[res.winner]); cr.push(res.crashes[0] + res.crashes[1]); }
  }
  cs.sort((a, b) => a - b);
  console.log(E.TRACKS[ti].nom + ' : coups du vainqueur median', cs[cs.length >> 1],
    'min', cs[0], 'max', cs[cs.length - 1],
    '| sorties moyennes', (cr.reduce((a, b) => a + b, 0) / cr.length).toFixed(1),
    '| jamais fini', bloq);
  check('toutes les courses finissent sur ' + E.TRACKS[ti].nom, bloq === 0);
}

// hierarchie des niveaux
let w = [0, 0];
for (let s = 1; s <= 30; s++) {
  const r = course(1, 'rapide', 'tranquille', s * 104729);
  if (r.winner === 0) w[0]++; else if (r.winner === 1) w[1]++;
}
console.log('rapide contre tranquille:', w);
check('le rapide domine', w[0] > w[1]);

console.log(fails === 0 ? 'TOUS LES TESTS PASSENT' : fails + ' ECHEC(S)');

// ---- regle de non-collision ----
{
  const r = E.newRace(1, 1);
  r.cars[0].p = [2, 10]; r.cars[0].v = [0, -2];
  r.cars[1].p = [2, 8];
  const ch = E.choices(r);
  const cible = ch.find(c => c.p[0] === 2 && c.p[1] === 8);
  check('le point occupe est refuse', cible && !cible.ok && cible.bloque);
  const derriere = ch.find(c => c.p[0] === 2 && c.p[1] === 7);
  check('on ne traverse pas la voiture adverse', derriere && !derriere.ok && derriere.bloque);
  const cote = ch.find(c => c.p[0] === 3 && c.p[1] === 8);
  check('les points a cote restent libres', cote && cote.ok);
}
{
  const r = E.newRace(1, 1);
  r.cars[0].p = [2, 10]; r.cars[0].v = [0, -2];
  r.cars[1].p = [2, 8];
  const ev = E.play(r, [2, 6]);
  check('accrochage detecte', ev.type === 'blocage');
  check('arret juste avant la voiture', r.cars[0].p[0] === 2 && r.cars[0].p[1] === 9);
  check('vitesse remise a zero apres accrochage', r.cars[0].v[0] === 0 && r.cars[0].v[1] === 0);
}
// courses avec la regle active
{
  let bloq = 0, coinces = 0, ok = true;
  for (let s = 1; s <= 30; s++) {
    let x = s * 7919;
    const rnd = () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; };
    const r = E.newRace(1, 1);
    let n = 0;
    while (r.winner === null && n < 400) {
      const q = E.aiChoice(r, 'normal', rnd);
      if (q === null) { E.stuck(r); coinces++; }
      else {
        E.play(r, q);
        const me = r.cars[r.turn], lui = r.cars[1 - r.turn];
        if (me.p[0] === lui.p[0] && me.p[1] === lui.p[1]) { ok = false; }
      }
      E.nextTurn(r); n++;
    }
    if (r.winner === null) bloq++;
  }
  check('jamais deux voitures au meme point', ok);
  check('les courses se terminent avec la regle', bloq === 0);
  console.log('avec non-collision : courses bloquees', bloq, '| joueurs coinces', coinces);
}
console.log(fails === 0 ? 'SUITE COMPLETE OK' : fails + ' ECHEC(S) AU TOTAL');
// sans code de sortie, un echec s'affichait et la chaine de controles continuait
process.exitCode = fails ? 1 : 0;
