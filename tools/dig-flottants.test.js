// DIG : rien ne flotte dans le vide (Julie, 2026-11-17 : le drapeau du donjon de Camelot flottait au-dessus du toit).
// Un groupe de voxels qui ne touche pas le sol, ni directement ni par ses voisins (face, arête ou coin), flotte.
// node tools/dig-flottants.test.js
const NIV = require('../dig/modeles.js');
// ce qui vole pour de vrai, ou ce qui est voulu en l'air
const VOLE = new Set(['chauves-souris', 'oiseaux', 'nuages', 'mouettes', 'corbeaux', 'papillons', 'lucioles', 'étoiles', 'fumée', 'flammes']);
let faute = 0;
for (const d of NIV) {
  const reste = new Map([...d.vox.values()].map((e) => [e.x + ',' + e.y + ',' + e.z, e])), vus = new Set(), file = [];
  for (const [k, e] of reste) if (e.y === 1) { vus.add(k); file.push(e); }
  while (file.length) { const e = file.pop();
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) { const k = (e.x + a) + ',' + (e.y + b) + ',' + (e.z + c); if (reste.has(k) && !vus.has(k)) { vus.add(k); file.push(reste.get(k)); } } }
  const seuls = {};
  for (const [k, e] of reste) if (!vus.has(k) && !VOLE.has(e.part)) (seuls[e.part] = seuls[e.part] || []).push(k);
  if (Object.keys(seuls).length) { faute = 1; console.log(d.id, Object.fromEntries(Object.entries(seuls).map(([p, l]) => [p, l.length + ' : ' + l.slice(0, 4).join(' ')]))); }
}
console.log(faute ? 'des voxels flottent' : 'rien ne flotte');
process.exit(faute);
