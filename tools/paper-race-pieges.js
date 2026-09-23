// Paper Race : le dessin d'un piège couvre-t-il TOUTE la zone piégée ?
//
// Une zone est un rectangle en cases, sur toute la largeur de la piste. Le
// dessin (flaque, tache d'huile, chevrons) a un contour ondulé : il doit
// déborder vers l'extérieur, JAMAIS rentrer. Sinon une case piégée se retrouve
// hors du dessin, et le joueur croit passer à côté alors qu'il sera ralenti.
//
// On le mesure sur la géométrie, sans navigateur : chaque case piégée de la
// piste doit avoir son centre ET ses quatre coins dans le polygone.
//   node tools/paper-race-pieges.js
const E = require('../paper-race/moteur.js');
const F = require('../paper-race/formes.js');

let fails = 0;
const check = (n, c, detail) => { if (!c) { console.log('ECHEC: ' + n + (detail !== undefined ? '  ' + JSON.stringify(detail) : '')); fails++; } };

let zones = 0, cases = 0;
for (const tk of E.TRACKS) {
  E.dimensions(tk);
  const cols = tk.cols || E.COLS, rows = tk.rows || E.ROWS;
  for (const [type, rects] of Object.entries(tk.zones || {})) {
    for (const r of rects) {
      zones++;
      const poly = F.contourPiege(r, [cols, rows]);
      let dehors = null, horsCarte = null;
      for (let y = r[1]; y <= r[3] && !dehors; y++) {
        for (let x = r[0]; x <= r[2] && !dehors; x++) {
          if (!E.onTrack(tk, x, y)) continue;      // une case hors piste ne se roule pas
          cases++;
          for (const [dx, dy] of [[0, 0], [-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) {
            if (!F.dansPolygone([x + dx, y + dy], poly)) { dehors = { type, r, case: [x, y], coin: [dx, dy] }; break; }
          }
        }
      }
      check(tk.nom + ' ' + type + ' : le dessin couvre toute la zone', !dehors, dehors);
      for (const p of poly) if (p[0] < 0 || p[1] < 0 || p[0] > cols || p[1] > rows) horsCarte = p;
      check(tk.nom + ' ' + type + ' : le dessin tient dans la carte', !horsCarte, horsCarte);
    }
  }
}
console.log(`${zones} zones, ${cases} cases piégées sur la piste`);
console.log(fails === 0 ? 'PIÈGES OK' : fails + ' ECHEC(S)');
process.exitCode = fails ? 1 : 0;
