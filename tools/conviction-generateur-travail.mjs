// Un ouvrier du générateur (tools/conviction-generateur.mjs) : il essaie les
// graines debut, debut + pas, debut + 2 pas… jusqu'à `fin`, et rend la
// première enquête trouvée. Le générateur en lance un par cœur du processeur.
import { parentPort, workerData } from 'node:worker_threads';
import { generate } from '../conviction/engine/generate.js';

const { story, difficulty, debut, pas, fin } = workerData;
for (let seed = debut; seed < fin; seed += pas) {
  const puzzle = generate(story, difficulty, seed);
  if (puzzle) { parentPort?.postMessage({ seed, puzzle }); process.exit(0); }
  if ((seed - debut) % (pas * 10) === 0) parentPort?.postMessage({ essai: seed });
}
parentPort?.postMessage({ seed: null });
