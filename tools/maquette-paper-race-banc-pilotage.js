// Banc : est-ce que jouer avec les cartes de pilotage change la difficulté ?
// Un robot (le fantôme du jeu, au niveau donné) court SEUL un tour, avec ou sans
// cartes. Avec cartes : s'il veut un point sans sa carte, il le force tant que le
// moteur n'est pas à `seuil` ; au-delà, il prend le meilleur point permis.
const E = require('../paper-race/moteur.js');

const PAQUET = ['accel', 'accel', 'accel', 'accel', 'accel', 'accel', 'frein', 'frein', 'frein', 'frein', 'frein',
  'gauche', 'gauche', 'gauche', 'gauche', 'droite', 'droite', 'droite', 'droite', 'froid', 'froid'];
const MAIN = 5, SURCHAUFFE = 5;
const vitesse = (v) => Math.max(Math.abs(v[0]), Math.abs(v[1]));
function alea(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function melange(a, r) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function cap(car) {
  if (car.v[0] || car.v[1]) return car.v;
  const t = car.trail;
  for (let i = t.length - 1; i > 0; i--) if (t[i][0] !== t[i - 1][0] || t[i][1] !== t[i - 1][1]) return [t[i][0] - t[i - 1][0], t[i][1] - t[i - 1][1]];
  return [0, -1];
}
function categorie(car, dx, dy) {
  if (!dx && !dy) return 'tout';
  const h = cap(car), n = Math.hypot(h[0], h[1]), hx = h[0] / n, hy = h[1] / n, f = dx * hx + dy * hy;
  if (f > 0.35) return 'accel';
  if (f < -0.35) return 'frein';
  return dx * hy - dy * hx > 0 ? 'gauche' : 'droite';
}

function course(ti, niveau, mode, seed, seuil, secours) {
  const r = alea(seed * 7919 + ti * 31 + 1);
  const race = E.newRace(ti, 1, null);
  race.cars[1].p = [-50, -50]; race.cars[1].fini = true;      // seul sur la piste
  const car = race.cars[0];
  const jeu = { paquet: melange(PAQUET, r), main: [], defausse: [], temp: 0 };
  const piocher = () => { while (jeu.main.length < MAIN) { if (!jeu.paquet.length) { jeu.paquet = melange(jeu.defausse, r); jeu.defausse = []; } jeu.main.push(jeu.paquet.pop()); } };
  piocher();
  let forces = 0, tours = 0, surch = 0;
  while (!car.fini && car.coups < 300) {
    race.turn = 0; tours++;
    if (mode === 'libre') { const q = E.aiChoice(race, niveau, r); if (q) E.play(race, q); else E.stuck(race); continue; }
    // Refroidir dès qu'il chauffe
    if (jeu.temp >= 2 && jeu.main.includes('froid')) { jeu.main.splice(jeu.main.indexOf('froid'), 1); jeu.defausse.push('froid'); jeu.temp = Math.max(0, jeu.temp - 2); piocher(); }
    if (jeu.temp >= SURCHAUFFE) surch++;
    const ok = E.choices(race).filter(o => o.ok);
    if (!ok.length) { E.stuck(race); continue; }
    if (car.dehors) { const q = E.aiChoice(race, niveau, r); E.play(race, q || ok[0].p); continue; }
    const cat = (o) => categorie(car, o.dx, o.dy);
    // réglage 1 (son choix) : en surchauffe, freiner et tourner restent permis
    const permis = (o) => cat(o) === 'tout' || jeu.main.includes(cat(o)) || (secours && jeu.temp >= SURCHAUFFE && cat(o) !== 'accel');
    const q = E.aiChoice(race, niveau, r);
    let o = q && ok.find(x => x.p[0] === q[0] && x.p[1] === q[1]);
    let force = false;
    if (o && !permis(o)) {
      if (jeu.temp < seuil) force = true;
      else {
        // le meilleur point permis : celui qui survit et avance le plus
        const notes = ok.filter(permis).map(x => {
          const v = E.apresBoost(race.track, x.p, [x.p[0] - car.p[0], x.p[1] - car.p[1]]);
          const vit = E.survives(race, x.p, v, 3);
          return { x, s: (vit ? 1000 : 0) + E.progress(race.track, car.p, x.p) + E.meilleureAvance(race, x.p, v, 3, new Map(), 0) };
        }).sort((a, b) => b.s - a.s);
        o = notes.length ? notes[0].x : null;
      }
    }
    if (!o) { if (jeu.temp < SURCHAUFFE) { o = ok[0]; force = !permis(o); } else { E.stuck(race); continue; } }
    const c = cat(o);
    if (force) { jeu.temp++; forces++; }
    else if (c !== 'tout' && jeu.main.includes(c)) { jeu.main.splice(jeu.main.indexOf(c), 1); jeu.defausse.push(c); }
    E.play(race, o.p);
    if (!force && vitesse(car.v) <= 1 && jeu.temp > 0) jeu.temp--;
    piocher();
  }
  return { coups: car.coups, sorties: car.crashes, forces, surch };
}

const circuits = ['s', 'epingle', 'ovale', 'monza', 'monacovrai', 'spavrai'];
const N = +(process.argv[2] || 40);
const moy = (a, k) => a.reduce((t, x) => t + x[k], 0) / a.length;
console.log(`${N} courses par case, un tour, robot seul sur la piste\n`);
for (const niveau of ['normal']) {
  console.log(`--- fantôme « ${niveau} »`);
  console.log('circuit       libre                       cartes, surchauffe d\'avant                   cartes, réglage 1 (freiner toujours permis)');
  for (const id of circuits) {
    const ti = E.TRACKS.findIndex(t => t.id === id);
    const L = [], A = [], B = [];
    for (let s = 1; s <= N; s++) { L.push(course(ti, niveau, 'libre', s, 0)); A.push(course(ti, niveau, 'cartes', s, 5, false)); B.push(course(ti, niveau, 'cartes', s, 5, true)); }
    const f = (X) => `${moy(X, 'coups').toFixed(1)} coups, ${moy(X, 'sorties').toFixed(2)} sorties`;
    const g = (X) => `${f(X)}, ${moy(X, 'forces').toFixed(1)} forcés, ${moy(X, 'surch').toFixed(1)} en surchauffe`;
    const pct = (X) => ((moy(X, 'coups') / moy(L, 'coups') - 1) * 100).toFixed(0);
    console.log(`${id.padEnd(12)}  ${f(L).padEnd(26)} ${g(A)} (+${pct(A)} %)   |   ${g(B)} (+${pct(B)} %)`);
  }
}
