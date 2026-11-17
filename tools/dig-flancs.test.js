// DIG : aucun relief ouvert sur le bord du plateau (Julie, 2026-11-16 : « les montagnes sont ouvertes »).
// Une colonne au bord de l'empreinte qui a du vide entre son pied et son sommet laisse voir dedans.
// node tools/dig-flancs.test.js
const NIV = require('../dig/modeles.js');
const DECOR = new Set(['sapins', 'arbres', 'palmiers', 'cyprès', 'oliviers', 'roseaux']);
// vus et voulus : les arbres de la jungle (tronc puis feuillage), le relief irrégulier de la falaise du Trésor,
// l'entrée du Siq dans le massif de Pétra, le fronton du temple, l'anneau de la bague, les pattes des squelettes
const VOULUS = { citeor: ['jungle'], tresor: ['falaise'], petra: ['massifs'], rue: ['temple'], trident: ['bague'], dinosaure: ['pattes'], mammouth: ['pattes'] };
let faute = 0;
for (const d of NIV) {
  const col = new Map();
  for (const e of d.vox.values()) { const k = e.x + ',' + e.z; (col.get(k) || col.set(k, []).get(k)).push(e); }
  const trous = {};
  for (const [k, es] of col) {
    const [x, z] = k.split(',').map(Number), ys = new Set(es.map((e) => e.y)), bas = Math.min(...ys);
    const solBas = bas > 1;
    const bord = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !col.has((x + a) + ',' + (z + b)));
    if (!bord) continue;
    const pleins = [...ys].sort((a, b) => a - b);
    // un trou de terrain : vide entre deux cases du même relief (pas sous un arbre, une branche ou un toit)
    for (let i = 1; i < pleins.length; i++) if (pleins[i] - pleins[i - 1] > 1) {
      const dessus = es.find((e) => e.y === pleins[i]), dessous = es.find((e) => e.y === pleins[i - 1]);
      if (dessus.part !== dessous.part && !(dessus.part === 'cimes')) continue;
      if (DECOR.has(dessus.part)) continue;
      if (solBas || (VOULUS[d.id] || []).includes(dessus.part)) continue;
      trous[dessus.part] = (trous[dessus.part] || 0) + 1;
    }
  }
  if (Object.keys(trous).length) { faute = 1; console.log(d.id, trous); }
}
console.log(faute ? 'reliefs ouverts' : 'aucun relief ouvert');
process.exit(faute);
