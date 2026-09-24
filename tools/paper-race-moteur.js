const E = require('../paper-race/moteur.js');
let fails = 0;
const check = (n, c) => { if (!c) { console.log('ECHEC: ' + n); fails++; } };

// piste
for (let ti = 0; ti < 3; ti++) {
  const tk = E.TRACKS[ti];
  check('depart sur la piste ' + ti, E.startCells(tk).every(p => E.onTrack(tk, p[0], p[1])));
  const r = tk.islands[0], c = [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2];
  check('le centre de l ilot est hors piste ' + ti, !E.onTrack(tk, Math.round(c[0]), Math.round(c[1])));
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

// sortie de piste : vitesse remise a zero ; depuis la v20 la voiture finit DANS le mur
// (elle le voulait ainsi), son point de retour, lui, est sur la piste
{
  const r = E.newRace(1, 1);
  const car = r.cars[0];
  car.p = [2, 3]; car.v = [-3, -3];
  const ev = E.play(r, [-1, 0]);
  check('sortie detectee', ev.type === 'sortie');
  check('vitesse remise a zero', car.v[0] === 0 && car.v[1] === 0);
  check('position : dans le mur, et le point de retour sur la piste', car.dehors === true && !E.onTrack(r.track, car.p[0], car.p[1]) && E.onTrack(r.track, car.retour[0], car.retour[1]), { p: car.p, retour: car.retour });
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
// championnat : la course continue jusqu'à l'arrivée du JOUEUR (voiture 0)
{
  const ti = E.TRACKS.findIndex(t => t.id === 'ovale');
  const r = E.newRace(ti, 1, 'joueur');
  check('mode joueur enregistré', r.fin === 'joueur');
  r.cars[1].fini = true; r.winner = 1;            // le fantôme est arrivé
  check('fantôme arrivé : la course n est pas finie', !E.finie(r));
  r.turn = 0; E.nextTurn(r);
  check('fantôme arrivé : le joueur rejoue tout de suite', r.turn === 0);
  r.cars[1].p = [r.cars[0].p[0], r.cars[0].p[1] - 1];
  check('une voiture arrivée ne bloque plus', !E.collision(r, r.cars[0].p, [r.cars[0].p[0], r.cars[0].p[1] - 2]));
  r.cars[0].fini = true;
  check('le joueur arrive : la course est finie', E.finie(r));
  const d = E.newRace(ti, 1);
  check('à deux : la course finit au premier arrivé', d.fin === 'premier' && (d.winner = 0, E.finie(d)));
}
// un tracé : sur la piste près de la ligne centrale, dehors au-delà de la demi-largeur
{
  const tk = E.TRACKS.find(t => t.trace);
  const a = tk.trace[0];
  check('tracé : la ligne centrale est sur la piste', E.onTrack(tk, a[0], a[1]));
  check('tracé : à demi-largeur + 1, on est dehors', !E.onTrack(tk, Math.round(a[0] + tk.demi + 1.5), a[1]));
  const r = E.newRace(E.TRACKS.indexOf(tk), 1);
  check('tracé : la course prend les dimensions du circuit', E.COLS === tk.cols && E.ROWS === tk.rows);
}
// ---------- courses à plusieurs (règles « grille ») ----------
{
  const G = E.TRACKS.findIndex(t => t.id === 'monza'), tk = E.TRACKS[G];
  const opt = (n, extra) => Object.assign({ n, regles: 'grille', grille: [...Array(n).keys()] }, extra || {});
  // la grille : sur la piste, distincte, la dernière rangée sur la ligne, jamais derrière
  E.TRACKS.forEach((t, i) => {
    for (let n = 2; n <= 6; n++) {
      if (!E.pelotonPermis(t) && n > 2) {
        let refuse = false; try { E.newRace(i, 1, 'tour', opt(n)); } catch (e) { refuse = true; }
        check('grille : ' + t.id + ' refuse ' + n + ' voitures', refuse);
        continue;
      }
      const r = E.newRace(i, 1, 'tour', opt(n));
      const cles = new Set(r.cars.map(c => c.p.join(',')));
      check('grille : ' + t.id + ' à ' + n + ' sur la piste', r.cars.every(c => E.onTrack(t, c.p[0], c.p[1])) && cles.size === n);
      check('grille : ' + t.id + ' à ' + n + ' jamais derrière la ligne', r.cars.every(c => c.p[1] <= t.depart.y) && r.cars.some(c => c.p[1] === t.depart.y));
    }
  });
  // la place tirée au sort : la voiture i part de la place grille[i]
  {
    const a = E.newRace(G, 1, 'tour', opt(4)), b = E.newRace(G, 1, 'tour', opt(4, { grille: [3, 2, 1, 0] }));
    check('grille tirée : la voiture 0 prend la place 3', b.cars[0].p.join() === a.cars[3].p.join());
    check('grille tirée : la place 0 joue en premier', b.turn === 3);
    check('grille : la rangée de devant a de l avance', a.cars[0].arc > a.cars[3].arc && a.cars[3].arc === 0);
  }
  // blocage : on s'arrête derrière la PREMIÈRE voiture rencontrée
  {
    const r = E.newRace(G, 1, 'tour', opt(3)), y = tk.depart.y - 8, x = 8;
    r.cars[0].p = [x, y]; r.cars[1].p = [x, y - 4]; r.cars[2].p = [x, y - 2]; r.turn = 0;
    E.play(r, [x, y - 6]);
    check('blocage : arrêt derrière la plus proche', r.cars[0].p.join() === [x, y - 1].join() && r.dernier.type === 'blocage');
  }
  // ⚠️ À DEUX, l'ordre qui tourne ferait jouer chacun DEUX FOIS de suite
  // (0 1 | 1 0 | 0 1) : elle l'a vu en jouant en ligne. À deux on alterne ;
  // à trois et plus, l'ordre tourne (et personne ne joue deux fois de suite).
  {
    const suite = (n) => {
      const r = E.newRace(G, 1, 'tour', opt(n));
      const out = [];
      for (let k = 0; k < 3 * n; k++) { out.push(r.turn); E.stuck(r); E.nextTurn(r); }
      return out.join('');
    };
    check('à deux : on alterne, jamais deux fois de suite', suite(2) === '010101');
    const s3 = suite(3), s4 = suite(4);
    check('à trois : l ordre tourne', s3 === '012120201');
    check('à trois et plus : personne ne joue deux fois de suite', ![...s3, ...s4].some((c, i, a) => i && c === a[i - 1]));
  }

  // ordre qui tourne, voiture abandonnée sautée mais toujours obstacle
  {
    const r = E.newRace(G, 1, 'tour', opt(3)), vu = [];
    for (let k = 0; k < 3; k++) { vu.push(r.turn); E.stuck(r); E.nextTurn(r); }
    check('ordre : 0, 1, 2 au premier tour de jeu', vu.join() === '0,1,2');
    check('ordre : la voiture 1 ouvre le second', r.turn === 1 && r.manche === 1);
    E.abandon(r, 1);
    check('abandon : on passe à la suivante', r.turn === 2);
    E.stuck(r); E.nextTurn(r);
    check('abandon : sautée dans la suite du tour', r.turn === 0);
    const q = r.cars[1].p;
    check('abandon : la voiture reste un obstacle', E.collision(r, [q[0], q[1] + 2], [q[0], q[1] - 2]));
    const z = E.newRace(G, 1, 'tour', opt(3));
    E.abandon(z, 0);
    while (z.manche < 3) { E.stuck(z); E.nextTurn(z); }
    check('abandon : ne rouvre jamais un tour de jeu', z.turn === 1);
    const f = E.newRace(G, 1, 'tour', opt(3, { ordre: 'fixe' }));
    for (let k = 0; k < 3; k++) { E.stuck(f); E.nextTurn(f); }
    check('ordre fixe : la voiture 0 ouvre toujours', f.turn === 0);
  }
  // aspiration : à 2 cases derrière, même sens, en fin de tour de jeu
  {
    const essai = (d, v1, fini1) => {
      const r = E.newRace(G, 1, 'tour', opt(2)), y = tk.depart.y - 12;
      r.cars[0].p = [8, y]; r.cars[0].v = [0, -2]; r.cars[0].arc = 20;
      r.cars[1].p = [8, y - d]; r.cars[1].v = v1; r.cars[1].arc = 20 + d; r.cars[1].fini = !!fini1;
      r.turn = 1; r.file = []; E.nextTurn(r);
      return r;
    };
    const r = essai(2, [0, -2]);
    check('aspiration : +1 derrière une voiture à 2 cases', r.cars[0].v.join() === '0,-3' && r.aspires.join() === '0');
    check('aspiration : pas pour celle de devant', r.cars[1].v.join() === '0,-2');
    check('aspiration : pas à 3 cases', essai(3, [0, -2]).cars[0].v.join() === '0,-2');
    check('aspiration : pas en sens contraire', essai(2, [0, 2]).cars[0].v.join() === '0,-2');
    check('aspiration : pas derrière une voiture arrivée', essai(2, [0, -2], true).cars[0].v.join() === '0,-2');
    const c = E.newRace(G, 1);
    check('classique : jamais d aspiration', c.regles === 'classique');
  }
  // photo-finish : deux arrivées dans le même tour, la plus tôt sur la ligne gagne
  {
    const r = E.newRace(G, 1, 'tour', opt(2)), L = tk.depart.y;
    r.cars[0].p = [7, L + 1]; r.cars[1].p = [9, L + 3];
    r.cars.forEach(c => { c.trail = [c.p.slice()]; c.arc = E.avanceDe(tk, c.p) - E.champ(tk).portee; });
    r.turn = 1; r.file = [0];
    E.play(r, [9, L - 1]); E.nextTurn(r);       // la voiture 1 joue d'abord, franchit aux 3/4
    check('photo-finish : la course attend la fin du tour de jeu', !E.finie(r) && r.turn === 0);
    E.play(r, [7, L - 2]); E.nextTurn(r);       // la voiture 0 franchit au 1/3
    const cl = E.classement(r);
    check('photo-finish : la course est finie', E.finie(r) && r.photo === true);
    check('photo-finish : la plus tôt sur la ligne gagne', r.winner === 0 && cl[0].voiture === 0 && cl[1].voiture === 1 && !cl[0].exaequo);
    check('coups joués : toutes les voitures', E.coupsJoues(r) === 2);
  }
  // classement : les non arrivées derrière, par avancée
  {
    const r = E.newRace(G, 1, 'tour', opt(3));
    r.cars[0].arc = 5; r.cars[1].arc = 9; r.cars[2].arc = 7;
    check('classement : par avancée', E.classement(r).map(c => c.voiture).join() === '1,2,0');
  }
}
// ---------- pièges en option, et une position par coup ----------
{
  const G = E.TRACKS.findIndex(t => t.id === 'monza'), tk = E.TRACKS[G];
  const zone = tk.zones.huile[0], c = [zone[0] + 1, zone[1] + 1];
  const avec = E.newRace(G, 1, 'tour', { n: 2, regles: 'grille' });
  const sans = E.newRace(G, 1, 'tour', { n: 2, regles: 'grille', pieges: false });
  check('pièges : présents par défaut', E.zoneDe(avec.track, c[0], c[1]) === 'huile' && avec.pieges === true);
  check('pièges : absents sur option', E.zoneDe(sans.track, c[0], c[1]) === null && sans.pieges === false);
  check('pièges : le circuit d origine garde les siens', E.zoneDe(tk, c[0], c[1]) === 'huile' && sans.track.id === tk.id && sans.track.trace === tk.trace);
  sans.cars[0].p = c.slice(); sans.cars[0].v = [0, -2]; sans.turn = 0;
  check('pièges : sans eux, l huile ne bloque plus la vitesse', E.choices(sans).filter(o => o.interdit).length === 0);
  const r = E.newRace(G, 1, 'tour', { n: 3, regles: 'grille' });
  for (let k = 0; k < 9; k++) { const q = E.aiChoice(r, 'normal', () => 0.5); if (q) E.play(r, q); else E.stuck(r); E.nextTurn(r); }
  check('pas : une position par coup joué', r.cars.every(c => c.pas.length === c.coups + 1));
  const d = E.newRace(G, 1);
  check('pas : aussi dans la course classique', d.cars[0].pas.length === 1);
  E.stuck(d);
  check('pas : coincé compte aussi', d.cars[0].pas.length === 2);
}
// ---- coincé en roulant : la voiture file dans le mur (v17) ----
// ⚠️ Elle s'arrêtait NET au milieu de la route, à n'importe quelle vitesse : vu
// par elle en jouant. Le cas vient d'une vraie course de référence (Montréal,
// l'ordinateur rapide) : lancée vers le bas à 5, rien de jouable.
{
  const i = E.TRACKS.findIndex(t => t.id === 'montrealvrai');
  const r = E.newRace(i, 1, 'joueur');
  r.turn = 0; r.cars[0].p = [9, 81]; r.cars[0].v = [-1, 5]; r.cars[1].p = [8, 70];
  check('coincé : le cas de Montréal est bien sans point jouable', E.choices(r).every(o => !o.ok));
  const bord = E.crashPoint(r.track, [9, 81], E.projected(r.cars[0]));
  const lg = r.cars[0].trail.length;
  const ev = E.stuck(r);
  // ⚠️ v20 : elle voulait la voiture DANS le mur, pas sur la dernière case de route
  // (« je devais sortir de piste mais il m'a arrêté avant le mur »)
  const c0 = r.cars[0], cheb = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
  const surLaLigne = (q) => { const [ax, ay] = [9, 81], [bx, by] = [8, 86]; return Math.abs((bx - ax) * (ay - q[1]) - (ax - q[0]) * (by - ay)) / Math.hypot(bx - ax, by - ay) <= 0.75; };
  check('coincé en roulant : la voiture finit HORS piste, dans le mur', !E.onTrack(r.track, c0.p[0], c0.p[1]) && c0.dehors === true, c0.p);
  check('coincé en roulant : juste après le bord, sur sa trajectoire', cheb(c0.p, bord) <= 1 && surLaLigne(c0.p), { p: c0.p, bord });
  check('coincé en roulant : son point de retour est la dernière case de route', c0.retour && c0.retour.join() === bord.join(), c0.retour);
  check('coincé en roulant : vitesse nulle, une sortie comptée, un coup joué', c0.v.join() === '0,0' && c0.crashes === 1 && c0.coups === 1);
  check('coincé en roulant : le tracé va jusque dans le mur', c0.trail.length === lg + 1 && c0.trail[lg].join() === c0.p.join());
  check('coincé en roulant : l événement le dit', ev.type === 'sortie' && ev.coince === true && ev.dehors === true);
  // l'avancement compte jusqu'au point de retour, pas jusqu'à l'herbe
  const t = E.newRace(i, 1, 'joueur'); t.turn = 0; t.cars[0].p = [9, 81]; t.cars[1].p = [8, 70];
  const arc0 = c0.arc;
  const ref = E.newRace(i, 1, 'joueur'); ref.cars[0].p = [9, 81]; ref.cars[0].arc = t.cars[0].arc;
  check('dehors : l avancement va jusqu au retour', c0.arc === t.cars[0].arc + E.progress(r.track, [9, 81], bord), { arc0, attendu: t.cars[0].arc + E.progress(r.track, [9, 81], bord) });
  // de là, on ne peut que revenir sur la route, à côté de l'endroit où l'on est sorti
  E.nextTurn(r); r.turn = 0;
  const retours = E.choices(r).filter(o => o.ok);
  check('dehors : on peut revenir sur la route', retours.length > 0);
  check('dehors : seulement sur la route, à côté de la sortie', !!c0.retour && retours.every(o => E.onTrack(r.track, o.p[0], o.p[1]) && cheb(o.p, c0.p) <= 1 && cheb(o.p, c0.retour) <= 1), retours.map(o => o.p));
  check('dehors : rester dans l herbe n est pas un choix', !E.choices(r).find(o => o.p.join() === c0.p.join()).ok);
  const choix = (c0.retour && retours.find(o => o.p.join() === c0.retour.join())) || retours[0];
  const arcAvant = c0.arc;
  if (choix) E.play(r, choix.p);
  check('dehors : revenu sur la route, la voiture n est plus dehors', !c0.dehors && E.onTrack(r.track, c0.p[0], c0.p[1]) && c0.retour === undefined, c0);
  check('dehors : l avancement repart du point de retour', c0.arc === arcAvant + (choix ? E.progress(r.track, bord, choix.p) : NaN), { arc: c0.arc, arcAvant });
  // une voiture sur la trajectoire : on s'arrête derrière elle (l'accrochage)
  const b = E.newRace(i, 1, 'joueur');
  b.turn = 0; b.cars[0].p = [9, 81]; b.cars[0].v = [0, 3]; b.cars[1].p = [9, 83];
  const eb = E.stuck(b);
  check('coincé en roulant : une voiture sur la route, on s arrête derrière', b.cars[0].p.join() === '9,82' && eb.type === 'blocage' && eb.coince === true, b.cars[0].p);
  // à l'arrêt, rien ne bouge : ni la voiture, ni son tracé
  const z = E.newRace(i, 1, 'joueur');
  const p0 = z.cars[0].p.slice(), t0 = z.cars[0].trail.length;
  const ez = E.stuck(z);
  check('coincé à l arrêt : la voiture reste, le tracé ne s allonge pas', z.cars[0].p.join() === p0.join() && z.cars[0].trail.length === t0 && ez.type === 'coince');
  check('règles : la version est exposée', E.REGLES >= 2);
}

// ---- on ne roule pas à contresens (v19) ----
// ⚠️ Une voiture pouvait faire demi-tour et rouler à l'envers : absurde, et à
// plusieurs elle bloquait les autres de face. Qui ROULE ne peut plus reculer ;
// à l'arrêt, tout est permis (comme sur les pièges), on repart toujours.
{
  const i = E.TRACKS.findIndex(t => t.id === 'ovale');
  const tk = E.TRACKS[i];
  // une case de ligne droite : devant elle on avance, derrière on recule
  let p = null, dir = null;
  for (let y = 2; y < 24 && !p; y++) for (let x = 2; x < 19 && !p; x++) {
    for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ok = [-3, -2, -1, 0, 1, 2].every(k => [-1, 0, 1].every(l => E.onTrack(tk, x + d[0] * k + d[1] * l, y + d[1] * k + d[0] * l)));
      if (ok && E.progress(tk, [x, y], [x + d[0], y + d[1]]) > 0 && E.progress(tk, [x, y], [x - d[0], y - d[1]]) < 0) { p = [x, y]; dir = d; break; }
    }
  }
  check('contresens : on trouve une ligne droite sur l ovale', !!p);
  const r = E.newRace(i, 1, 'joueur');
  r.turn = 0; r.cars[1].p = [1, 1];
  // elle recule déjà d'une case : continuer à reculer est interdit, freiner non
  r.cars[0].p = p.slice(); r.cars[0].v = [-dir[0], -dir[1]];
  const o = E.choices(r);
  const recule = o.filter(c => E.progress(tk, p, c.p) < 0);
  check('contresens : qui roule a des points qui reculent', recule.length > 0);
  check('contresens : aucun point jouable ne recule quand on roule', o.every(c => !c.ok || E.progress(tk, p, c.p) >= 0), o.filter(c => c.ok).map(c => c.p));
  check('contresens : ces points le disent', recule.every(c => c.contresens === true && !c.ok));
  check('contresens : freiner reste permis', o.some(c => c.ok && c.p[0] === p[0] && c.p[1] === p[1]));
  // à l'arrêt : un pas en arrière est permis
  r.cars[0].v = [0, 0];
  const a = E.choices(r).find(c => c.p[0] === p[0] - dir[0] && c.p[1] === p[1] - dir[1]);
  // ⚠️ v20 : « à l'arrêt tout est permis » laissait reculer, freiner, reculer encore :
  // elle a fait demi-tour plusieurs fois. À l'arrêt non plus, on ne recule pas.
  check('contresens : à l arrêt non plus, on ne recule pas', a && !a.ok && a.contresens, a);
  // ⚠️ sans exception : une voiture qui ne peut que reculer serait prise pour
  // toujours. Mesuré sur les 11 circuits : d'aucune case où l'on peut bouger il
  // n'est impossible d'aller vers l'avant (un premier compte, 136, prenait des
  // coins d'îlot d'où rien ne part ni n'arrive). Ce contrôle le garde vrai pour
  // tout circuit ajouté.
  let prises = [];
  for (const tk of E.TRACKS) {
    E.dimensions(tk);
    for (let y = 0; y <= (tk.rows || 26); y++) for (let x = 0; x <= (tk.cols || 21); x++) {
      if (!E.onTrack(tk, x, y)) continue;
      let bouge = false, avant = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const q = [x + dx, y + dy];
        if (!E.onTrack(tk, q[0], q[1]) || !E.segOk(tk, [x, y], q)) continue;
        bouge = true; if (E.progress(tk, [x, y], q) >= 0) avant = true;
      }
      if (bouge && !avant) prises.push(tk.id + ' ' + x + ',' + y);
    }
  }
  check('contresens : de toute case, on peut repartir vers l avant (11 circuits)', prises.length === 0, prises.slice(0, 5));
  check('contresens : la version des règles a changé', E.REGLES === 4);
}
console.log(fails === 0 ? 'SUITE COMPLETE OK' : fails + ' ECHEC(S) AU TOTAL');
// sans code de sortie, un echec s'affichait et la chaine de controles continuait
process.exitCode = fails ? 1 : 0;
