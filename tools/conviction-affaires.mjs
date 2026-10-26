// Les affaires inédites (conviction/engine/procedural.js) : combien de temps
// pour en fabriquer une, combien échouent, par mode et par difficulté.
//   node tools/conviction-affaires.mjs [n]      n affaires par case (20 par défaut)
// Chaque affaire trouvée est revalidée (solution unique, coupable unique).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { catalogue, affaire, universJouables } from '../conviction/engine/procedural.js';
import { validatePuzzle } from '../conviction/engine/index.js';

const DIR = fileURLToPath(new URL('../conviction/puzzles/', import.meta.url));
const ids = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
const cat = catalogue(ids.map((id) => JSON.parse(readFileSync(`${DIR}${id}.json`, 'utf8'))));
const n = Number(process.argv[2] ?? 20);
console.log(`${cat.lieux.length} lieux, ${cat.tous.length} personnages, univers jouables : ${universJouables(cat).join(', ')}`);
let faux = 0;
for (const mode of /** @type {const} */ (['whatif', 'melange'])) {
  for (const difficulty of /** @type {const} */ (['facile', 'moyen', 'difficile'])) {
    const temps = [];
    let rate = 0;
    for (let k = 0; k < n; k++) {
      const r = affaire(cat, { mode, numero: 1000 + k * 37, difficulty, budget: 120000 });
      if (!r) { rate++; continue; }
      temps.push(r.ms);
      if (!validatePuzzle(r.puzzle).ok) faux++;
    }
    temps.sort((a, b) => a - b);
    const q = (/** @type {number} */ x) => temps[Math.min(temps.length - 1, Math.floor(x * temps.length))] ?? 0;
    console.log(`${mode.padEnd(8)} ${difficulty.padEnd(10)} réussies ${n - rate}/${n} · médiane ${q(0.5)} ms · 9 sur 10 sous ${q(0.9)} ms · pire ${q(1)} ms`);
  }
}
if (faux) { console.log(`✗ ${faux} affaires invalides`); process.exitCode = 1; }
