// Missions de la Jungle (avion). Des données seulement : [seconde, { f: formation, ... }].
// Règles du genre : la première vague est facile ; un ennemi nouveau arrive d'abord
// SEUL, puis mélangé ; des respirations entre les passages chargés.

// Le feuillage du début de mission, déjà à l'écran
const DECOR = [
  [0, { f: 'feuillage', x: 70, r: 60, y: 120 }], [0, { f: 'feuillage', x: 290, r: 70, y: 260 }],
  [0, { f: 'feuillage', x: 110, r: 55, y: 420 }], [0, { f: 'feuillage', x: 270, r: 65, y: 560 }],
];
// Du feuillage qui revient régulièrement
const feuilles = (de, a, pas = 6) => {
  const v = [];
  for (let t = de, i = 0; t < a; t += pas, i++) v.push([t, { f: 'feuillage', x: i % 2 ? 280 : 80, r: 55 + (i % 3) * 10 }]);
  return v;
};
const tri = (vagues) => vagues.sort((a, b) => a[0] - b[0]);

export const MISSIONS_JUNGLE = {
  j1: {
    id: 'j1', planete: 'jungle', nom: 'La lisière',
    cages: { a: { arme: 'crayon' }, b: { arme: 'elastiques' }, c: { bonus: true } },
    vagues: tri([
      ...DECOR, ...feuilles(4, 120),
      [1, { f: 'message', texte: 'Glisse le doigt n\'importe où : l\'avion suit' }],
      [4, { f: 'V', type: 'luciole', n: 5, x: 180 }],
      [9, { f: 'V', type: 'luciole', n: 5, x: 250 }],
      [13, { f: 'ligne', type: 'graine', n: 4 }],
      [17, { f: 'cage', id: 'a', x: 100 }],
      [19, { f: 'V', type: 'luciole', n: 5, x: 120 }],
      [24, { f: 'cote', type: 'scarabee', n: 6, cote: -1, y: 150 }],
      [30, { f: 'porteur' }],
      [33, { f: 'seul', type: 'perroquet', x: 240 }],
      [40, { f: 'ligne', type: 'graine', n: 4 }], [41, { f: 'V', type: 'luciole', n: 3, x: 180 }],
      [46, { f: 'cage', id: 'b', x: 270 }],
      [49, { f: 'cote', type: 'scarabee', n: 6, cote: 1, y: 170 }],
      [55, { f: 'seul', type: 'perroquet', x: 90 }], [57, { f: 'seul', type: 'perroquet', x: 270 }],
      [64, { f: 'pluie', type: 'gloutonnet', n: 3 }],
      [69, { f: 'V', type: 'luciole', n: 5, x: 110 }], [69, { f: 'V', type: 'luciole', n: 5, x: 250 }],
      [74, { f: 'porteur' }],
      [77, { f: 'cage', id: 'c', x: 180 }],
      [80, { f: 'ligne', type: 'graine', n: 5 }], [82, { f: 'cote', type: 'scarabee', n: 6, cote: -1, y: 130 }],
      [89, { f: 'seul', type: 'perroquet', x: 180 }], [90, { f: 'V', type: 'luciole', n: 5, x: 180 }],
      [97, { f: 'cote', type: 'scarabee', n: 6, cote: 1, y: 150 }], [98, { f: 'pluie', type: 'gloutonnet', n: 3 }],
      [104, { f: 'seul', type: 'perroquet', x: 80 }], [104, { f: 'seul', type: 'perroquet', x: 280 }],
      [108, { f: 'V', type: 'luciole', n: 7, x: 180 }],
      [113, { f: 'ligne', type: 'graine', n: 5 }], [114, { f: 'cote', type: 'scarabee', n: 6, cote: -1, y: 140 }],
      [120, { f: 'V', type: 'luciole', n: 5, x: 110 }], [120, { f: 'V', type: 'luciole', n: 5, x: 250 }],
      [121, { f: 'fin' }],
    ]),
  },
  j2: {
    id: 'j2', planete: 'jungle', nom: 'Sous les grandes feuilles',
    cages: { d: { arme: 'arrosoir' }, e: { arme: 'billes' }, f: { bonus: true } },
    vagues: tri([
      ...DECOR, ...feuilles(4, 118, 7),
      [3, { f: 'V', type: 'luciole', n: 5, x: 180 }],
      [7, { f: 'message', texte: 'Le feuillage cache des plantes : il tremble avant qu\'elles surgissent' }],
      [8, { f: 'feuillage', x: 180, r: 75, cache: 'plante' }],
      [14, { f: 'cote', type: 'scarabee', n: 6, cote: -1, y: 150 }],
      [18, { f: 'cage', id: 'd', x: 90 }],
      [20, { f: 'seul', type: 'champignon', x: 260 }],
      [26, { f: 'pluie', type: 'gloutonnet', n: 3 }],
      [30, { f: 'porteur' }],
      [33, { f: 'feuillage', x: 80, r: 60, cache: 'plante' }], [35, { f: 'feuillage', x: 280, r: 60, cache: 'plante' }],
      [40, { f: 'seul', type: 'perroquet', x: 180 }], [41, { f: 'ligne', type: 'graine', n: 4 }],
      [47, { f: 'cage', id: 'e', x: 270 }],
      [49, { f: 'seul', type: 'champignon', x: 90 }], [50, { f: 'V', type: 'luciole', n: 5, x: 240 }],
      [56, { f: 'cote', type: 'scarabee', n: 6, cote: 1, y: 160 }], [58, { f: 'feuillage', x: 180, r: 70, cache: 'plante' }],
      [64, { f: 'pluie', type: 'gloutonnet', n: 4 }],
      [69, { f: 'porteur' }],
      [72, { f: 'cage', id: 'f', x: 180 }],
      [75, { f: 'seul', type: 'champignon', x: 70 }], [75, { f: 'seul', type: 'champignon', x: 290 }],
      [81, { f: 'seul', type: 'perroquet', x: 100 }], [82, { f: 'seul', type: 'perroquet', x: 260 }], [83, { f: 'V', type: 'luciole', n: 5, x: 180 }],
      [89, { f: 'feuillage', x: 90, r: 60, cache: 'plante' }], [90, { f: 'feuillage', x: 270, r: 60, cache: 'plante' }],
      [94, { f: 'cote', type: 'scarabee', n: 6, cote: -1, y: 130 }], [95, { f: 'ligne', type: 'graine', n: 5 }],
      [101, { f: 'pluie', type: 'gloutonnet', n: 4 }], [102, { f: 'seul', type: 'champignon', x: 180 }],
      [107, { f: 'V', type: 'luciole', n: 5, x: 180 }],
      [112, { f: 'message', texte: 'Un arbre-ruche ! Il fabrique des lucioles' }],
      [113, { f: 'seul', type: 'arbreRuche', x: 180 }],
      [114, { f: 'fin' }],
    ]),
  },
};
