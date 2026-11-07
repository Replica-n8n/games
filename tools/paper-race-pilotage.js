// Paper Race 1.12.0 : les cartes de pilotage changent-elles la difficulté du
// championnat ? Un robot (le fantôme « vite », qui joue près du par) court la
// VRAIE course du championnat contre le fantôme « normal », avec les vraies
// règles du moteur (piloteMarquer, piloteJouer, adrénaline et élan des deux
// côtés), puis sans cartes ni adrénaline. On compare ses coups et ses sorties.
// S'il ne peut pas jouer le point voulu sans carte, il le force tant que le
// moteur reste sous `SEUIL`, sinon il prend le meilleur point permis ; il joue
// Refroidir dès 2 crans et prend l'élan quand il survit.
// Usage : node tools/paper-race-pilotage.js [N]  (--controle : vérifie les seuils)
const E = require('../paper-race/moteur.js');
const N = +(process.argv.find(a => /^\d+$/.test(a)) || 20);
const SEUIL = +(process.env.SEUIL || 4);
function alea(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function meilleur(race, car, ok) {
  return ok.map(x => {
    const v = E.apresBoost(race.track, x.p, [x.p[0] - car.p[0], x.p[1] - car.p[1]]);
    return { x, s: (E.survives(race, x.p, v, 3) ? 1000 : 0) + E.progress(race.track, car.p, x.p) + E.meilleureAvance(race, x.p, v, 3, new Map(), 0) };
  }).sort((a, b) => b.s - a.s)[0].x;
}
function elan(race, j) {
  if (!E.piloteElanSur(race, j)) return false;
  race.cars[j].v = E.piloteElan(race.cars[j].v); return true;
}
function course(ti, cartes, seed) {
  const r = alea(seed * 7919 + ti * 31 + 1);
  const race = E.newRace(ti, 1, 'joueur');
  const moi = race.cars[0], jeu = cartes ? E.piloteNouveau(r) : null;
  let forces = 0, elans = 0, chaud = 0, garde = 0;
  while (!E.finie(race) && garde++ < 900) {
    const j = race.turn, car = race.cars[j];
    if (car.fini) { E.nextTurn(race); continue; }
    const derriere = cartes && E.piloteDerriere(race, j);
    if (j === 1) {
      const q = E.aiChoice(race, 'normal', r);
      const ev = q ? E.play(race, q) : E.stuck(race);
      if (derriere && ev.type !== 'sortie') elan(race, 1);
      E.nextTurn(race); continue;
    }
    if (jeu) {
      E.piloteAdrenaline(race, 0, jeu);
      if (jeu.temp >= 2) E.piloteRefroidir(jeu, r);
      if (E.piloteSurchauffe(jeu)) chaud++;
    }
    const opts = E.piloteMarquer(E.choices(race), car, jeu);
    const ok = opts.filter(o => o.ok);
    if (!ok.length) { E.stuck(race); E.piloteJouer(jeu, null, car, r); E.nextTurn(race); continue; }
    const q = E.aiChoice(race, 'rapide', r);
    let o = q && opts.find(x => x.p[0] === q[0] && x.p[1] === q[1]);
    // moteur presque chaud : un autre point sans coût s'il survit, sinon on paie
    // (forcer un freinage vaut mieux qu'une sortie : en surchauffe on freine encore)
    if (o && o.ok && o.force && jeu.temp >= SEUIL) {
      const sans = ok.filter(x => !x.force), m = sans.length ? meilleur(race, car, sans) : null;
      if (m && E.survives(race, m.p, E.apresBoost(race.track, m.p, [m.p[0] - car.p[0], m.p[1] - car.p[1]]), 3)) o = m;
    }
    if (!o || !o.ok) o = meilleur(race, car, ok);
    if (o.force) forces++;
    const ev = E.play(race, o.p);
    E.piloteJouer(jeu, o, car, r);
    if (derriere && !process.env.SANS_ELAN && ev.type !== "sortie" && elan(race, 0)) elans++;
    E.nextTurn(race);
  }
  return { coups: moi.coups, sorties: moi.crashes, forces, elans, chaud };
}
const moy = (a, k) => a.reduce((t, x) => t + x[k], 0) / a.length;
console.log(`${N} courses par circuit : le robot « vite » contre le fantôme « normal » du championnat\n`);
console.log('circuit        par   sans cartes         avec cartes                                  écart');
const ecarts = [];
for (let ti = 0; ti < E.TRACKS.length; ti++) { if (process.env.SEULS && !process.env.SEULS.split(",").includes(E.TRACKS[ti].id)) continue;
  const tk = E.TRACKS[ti], A = [], B = [];
  for (let s = 1; s <= N; s++) { A.push(course(ti, false, s)); B.push(course(ti, true, s)); }
  const e = moy(B, 'coups') / moy(A, 'coups') - 1;
  ecarts.push({ id: tk.id, e, a: moy(A, 'coups'), b: moy(B, 'coups'), par: tk.par });
  console.log(`${tk.id.padEnd(13)} ${String(tk.par).padStart(4)}   ${moy(A, 'coups').toFixed(1).padStart(5)} coups ${moy(A, 'sorties').toFixed(2)} s   `
    + `${moy(B, 'coups').toFixed(1).padStart(5)} coups ${moy(B, 'sorties').toFixed(2)} s, ${moy(B, 'forces').toFixed(1)} forcés, ${moy(B, 'elans').toFixed(1)} élans, ${moy(B, 'chaud').toFixed(1)} en surchauffe   `
    + `${e >= 0 ? '+' : ''}${(e * 100).toFixed(1)} %`);
}
module.exports = { ecarts };
