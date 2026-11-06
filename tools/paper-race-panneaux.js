// Les panneaux de vitesse (1.10.0) : avant chaque virage, la vitesse du TOUR PARFAIT
// à cet endroit (le solveur), plantée dans l'herbe au bord de la piste.
//   node tools/paper-race-panneaux.js             affiche la ligne à mettre dans moteur.js
//   node tools/paper-race-panneaux.js --controle  échoue si moteur.js n'est plus à jour
// Un virage = un palier de vitesse plus bas que ce qui l'entoure : sur les petits
// circuits le tour parfait roule entre 2 et 4, une case de moins est déjà un virage.
// ⚠️ Un panneau se plante sur l'herbe à 4 cases au moins d'un autre : au fond d'une
// épingle, deux virages voisins plantaient leurs panneaux côte à côte (on les croyait
// un seul) ; et faute d'herbe à 2 cases, le panneau tombait sur le bitume.
const E = require('../paper-race/moteur.js');

function tourParfait(tk) {
  const D = E.champ(tk).max + 1, vmax = 7, vus = new Set(), file = [];
  for (const p of E.startCells(tk)) { file.push({ x: p[0], y: p[1], vx: 0, vy: 0, tour: 0, par: null }); vus.add(p + ',0,0,0'); }
  for (let t = 0; t < file.length; t++) {
    const cur = file[t];
    if (cur.tour >= 1) { const ch = []; for (let s = cur; s; s = s.par) ch.push([s.x, s.y]); return ch.reverse(); }
    const cc = E.contrainte(tk, { p: [cur.x, cur.y] });
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!E.accelAutorisee(cc, dx, dy, [cur.vx, cur.vy])) continue;
      let nvx = cur.vx + dx, nvy = cur.vy + dy;
      if (Math.abs(nvx) > vmax || Math.abs(nvy) > vmax) continue;
      const nx = cur.x + nvx, ny = cur.y + nvy;
      if (!E.onTrack(tk, nx, ny) || !E.segOk(tk, [cur.x, cur.y], [nx, ny])) continue;
      if (E.progress(tk, [cur.x, cur.y], [nx, ny]) < 0) continue;
      const d = E.avanceDe(tk, [nx, ny]) - E.avanceDe(tk, [cur.x, cur.y]);
      let tour = cur.tour; if (d < -D / 2) tour++; else if (d > D / 2) tour--;
      if (tour < 0) continue;
      [nvx, nvy] = E.apresBoost(tk, [nx, ny], [nvx, nvy]);
      const k = nx + ',' + ny + ',' + nvx + ',' + nvy + ',' + tour;
      if (vus.has(k)) continue;
      vus.add(k); file.push({ x: nx, y: ny, vx: nvx, vy: nvy, tour, par: cur });
    }
  }
  return null;
}

function panneaux(tk) {
  E.dimensions(tk);
  const ch = tourParfait(tk); if (!ch) throw new Error(tk.id + ' : pas de tour parfait');
  const vit = (a, b) => Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
  const s = ch.map((p, i) => i ? vit(ch[i - 1], p) : 0);
  const W = E.COLS, H = E.ROWS, out = [];
  for (let i = 2; i < ch.length - 1; i++) {
    if (!(s[i] < s[i - 1])) continue;
    let j = i; while (j + 1 < ch.length && s[j + 1] === s[i]) j++;
    if (j + 1 >= ch.length || s[j + 1] < s[i]) continue;   // pas encore le bas du freinage
    // un vrai virage fait freiner : 2 cases de moins que la vitesse d'avant, ou 3 et moins
    // (sinon des « 5 » et « 6 » sur de simples creux de ligne droite)
    let pic = 0; for (let k = Math.max(1, i - 6); k < i; k++) pic = Math.max(pic, s[k]);
    if (!(pic - s[i] >= 2 || s[i] <= 3)) continue;
    const p = ch[Math.floor((i + j) / 2)];
    let best = null, bd = 99;
    for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
      const q = [p[0] + dx, p[1] + dy];
      if (q[0] < 1 || q[1] < 1 || q[0] > W - 1 || q[1] > H - 1 || E.onTrack(tk, q[0], q[1])) continue;
      const loin = out.length ? Math.min(...out.map(o => Math.hypot(o[3] - q[0], o[4] - q[1]))) : 99;
      if (loin < 4) continue;
      const d = Math.hypot(dx, dy) - Math.min(loin, 20) * 0.01;   // à égalité, le plus loin des autres
      if (d < bd) { bd = d; best = q; }
    }
    // le tour parfait s'arrête parfois net au fond d'une épingle : « 0 » dérouterait, « 1 » = au pas
    if (best) out.push([Math.max(1, s[i]), p[0], p[1], best[0], best[1]]);
  }
  return out;
}

const res = {};
for (const tk of E.TRACKS) res[tk.id] = panneaux(tk);
const ligne = 'const PANNEAUX = ' + JSON.stringify(res).replace(/"(\w+)":/g, '$1: ') + ';';
if (process.argv.includes('--controle')) {
  const src = require('fs').readFileSync(require('path').join(__dirname, '../paper-race/moteur.js'), 'utf8');
  if (!src.includes(ligne)) { console.error('PANNEAUX pas à jour dans moteur.js. Attendu :\n' + ligne); process.exit(1); }
  for (const tk of E.TRACKS) if (!res[tk.id].length) { console.error(tk.id + ' : aucun panneau'); process.exit(1); }
  console.log('PANNEAUX OK : ' + E.TRACKS.map(t => t.id + ' ' + res[t.id].length).join(', '));
} else {
  for (const tk of E.TRACKS) console.error(tk.id.padEnd(13), res[tk.id].map(p => p[0]).join(' '));
  console.log(ligne);
}
