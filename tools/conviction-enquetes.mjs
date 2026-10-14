// Pièce à conviction : valide toutes les enquêtes (données cohérentes,
// solution unique égale à celle notée, coupable unique) et mesure leur
// difficulté. Code de sortie 1 si une seule enquête échoue : la CI s'arrête.
//   node tools/conviction-enquetes.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validatePuzzle, rateDifficulty } from '../conviction/engine/index.js';

const dir = fileURLToPath(new URL('../conviction/puzzles/', import.meta.url));
const listed = JSON.parse(readFileSync(dir + 'index.json', 'utf8'));
const files = readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'index.json').map((f) => f.slice(0, -5));
let bad = 0;
for (const f of files) if (!listed.includes(f)) { console.log(`✗ ${f}.json n'est pas dans index.json`); bad++; }

for (const id of listed) {
  let puzzle;
  try { puzzle = JSON.parse(readFileSync(`${dir}${id}.json`, 'utf8')); }
  catch (e) { console.log(`✗ ${id} : fichier illisible (${e.message})`); bad++; continue; }
  if (puzzle.id !== id) { console.log(`✗ ${id} : son champ id vaut « ${puzzle.id} »`); bad++; }
  const t = performance.now();
  const v = validatePuzzle(puzzle);
  const ms = Math.round(performance.now() - t);
  if (!v.ok) {
    bad++;
    console.log(`✗ ${id}\n  ${v.errors.join('\n  ')}`);
    continue;
  }
  const d = rateDifficulty(puzzle);
  const culprit = puzzle.persons.find((p) => p.id === v.culprit).name;
  console.log(`✓ ${id} (${puzzle.difficulty}, ${puzzle.size}×${puzzle.size}) · coupable ${culprit} · niveaux ${d.levels.join(' ')}${d.reveals ? ` · ${d.reveals} réponse(s) donnée(s)` : ''} · ${ms} ms`);
}
if (bad) { console.log(`\n${bad} problème(s).`); process.exit(1); }
