// Ghost Train : contraste des paires de couleurs du jeu (WCAG 2), et ce que voit
// une personne daltonienne (simulation de Viénot, protanopie et deutéranopie).
// Notre police fait 7 pixels de jeu, soit 15 à 30 px à l'écran : elle compte
// comme un « petit texte » (4,5:1 exigés) sauf les titres agrandis (3:1).
//   node tools/ghost-train-couleurs.mjs
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const L = (h) => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contraste = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

// Viénot, Brettel et Mollon (1999), dans l'espace linéaire
const VIENOT = {
  protanopie: [[0.11238, 0.88762, 0], [0.11238, 0.88762, 0], [0.00401, -0.00401, 1]],
  deuteranopie: [[0.29275, 0.70725, 0], [0.29275, 0.70725, 0], [-0.02234, 0.02234, 1]],
};
const gamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function simuler(h, m) {
  const v = hex(h).map(lin), o = m.map((r) => Math.max(0, Math.min(1, r[0] * v[0] + r[1] * v[1] + r[2] * v[2])));
  return '#' + o.map((c) => Math.round(gamma(c) * 255).toString(16).padStart(2, '0')).join('');
}

// La gare « Le quai de minuit » (1.1.0). L'ancienne gare jaune et rouge (1.0.x)
// avait cinq paires sous le seuil, dont le rouge sur jaune à 3,09:1.
export const PAIRES = [
  // [texte, fond, où, seuil]
  ['#ffd23a', '#120818', 'Gare : DÉPARTS, heure, notes, sur le tableau noir', 4.5],
  ['#fff6c8', '#120818', 'Gare : missions ouvertes', 4.5],
  ['#fff6c8', '#3a2a5a', 'Gare : mission choisie (ligne surlignée)', 4.5],
  ['#ffd23a', '#3a2a5a', 'Gare : note de la mission choisie', 4.5],
  ['#8a7aa0', '#120818', 'Gare : salles fermées', 4.5],
  ['#c8c4e0', '#3a2a5a', 'Gare : secrets trouvés, ligne choisie', 4.5],
  ['#120818', '#ffd23a', 'Gare : PARTIR ; menus : boutons jaunes et textes', 4.5],
  ['#120818', '#fff4d0', 'Gare : billets RÉGLAGES, INSTALLER', 4.5],
  ['#fff27a', '#e8203a', 'Enseigne GHOST TRAIN et titres des menus (gras, contour noir)', 3],
  ['#120818', '#ffffff', 'Boutons blancs, bulle de la radio', 4.5],
  ['#e8203a', '#ffffff', 'Note du bilan (x5) et « CHEFFE : » (gras)', 3],
];

const rond = (x) => x.toFixed(2).replace('.', ',');
let faibles = 0;
for (const [t, f, ou, seuil] of PAIRES) {
  const c = contraste(t, f);
  const p = contraste(simuler(t, VIENOT.protanopie), simuler(f, VIENOT.protanopie));
  const d = contraste(simuler(t, VIENOT.deuteranopie), simuler(f, VIENOT.deuteranopie));
  const ok = c >= seuil;
  if (!ok) faibles++;
  console.log(`${ok ? '✓' : '✗'} ${rond(c).padStart(5)}:1 (exigé ${rond(seuil)})  protan ${rond(p)}  deutan ${rond(d)}  ${t} sur ${f} · ${ou}`);
}
// Le rouge et le jaune côte à côte : se distinguent-ils encore pour un œil daltonien ?
for (const [nom, m] of Object.entries(VIENOT)) {
  const r = simuler('#e8203a', m), j = simuler('#ffd23a', m);
  console.log(`${nom} : rouge ${'#e8203a'} → ${r}, jaune ${'#ffd23a'} → ${j}, contraste entre eux ${rond(contraste(r, j))}:1`);
}
console.log(faibles ? `✗ ${faibles} paire(s) sous le seuil` : '✓ toutes les paires passent');
