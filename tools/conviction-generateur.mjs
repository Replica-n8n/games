// Pièce à conviction : fabrique les enquêtes à partir des histoires
// (tools/conviction-histoires.mjs) et réécrit conviction/puzzles/index.json.
// Chaque enquête porte sa graine : relancer donne exactement la même chose.
//   node tools/conviction-generateur.mjs             tout
//   node tools/conviction-generateur.mjs holmes-221b une histoire
// Les enquêtes écrites à la main (sans graine, comme Valcourt) ne sont
// jamais touchées. Ensuite : node tools/conviction-enquetes.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generate } from '../conviction/engine/generate.js';
import { HISTOIRES } from './conviction-histoires.mjs';

const DIR = fileURLToPath(new URL('../conviction/puzzles/', import.meta.url));

// --textes : réécrire seulement les témoignages des enquêtes générées, à partir
// de leurs indices (après une retouche du français, sans tout recalculer).
if (process.argv.includes('--textes')) {
  const { testimony } = await import('../conviction/i18n/temoignages.js');
  for (const f of readdirSync(DIR).filter((x) => x.endsWith('.json') && x !== 'index.json')) {
    const p = JSON.parse(readFileSync(DIR + f, 'utf8'));
    if (p.seed === undefined) continue;
    for (const x of p.persons) x.testimony = testimony(x.clue, p, x);
    writeFileSync(DIR + f, format(p));
    console.log(`✓ ${f}`);
  }
  process.exit(0);
}
// --looks : recopier les visages et les tenues des histoires dans les enquêtes
// déjà générées (après une retouche des costumes, sans tout recalculer).
if (process.argv.includes('--looks')) {
  for (const f of readdirSync(DIR).filter((x) => x.endsWith('.json') && x !== 'index.json')) {
    const p = JSON.parse(readFileSync(DIR + f, 'utf8'));
    const h = HISTOIRES.find((x) => p.id.startsWith(x.id + '-'));
    if (!h) continue;
    let n = 0;
    for (const x of p.persons) {
      const y = (h.chapitres?.[p.difficulty]?.persons ?? h.persons).find((z) => z.name === x.name);
      if (y && JSON.stringify(y.look) !== JSON.stringify(x.look)) { x.look = y.look; n++; }
    }
    if (n) { writeFileSync(DIR + f, format(p)); console.log(`✓ ${f} : ${n} tenue(s)`); }
  }
  process.exit(0);
}
const seule = process.argv[2];
const MAIN = ['valcourt']; // écrites à la main, en tête de liste
const ordre = [...MAIN];

for (const h of HISTOIRES) {
  const { variants, chapitres, ...commun } = h;
  for (const [k, difficulty] of variants.entries()) {
    // Plusieurs difficultés = des chapitres qui se suivent (tools/conviction-histoires.mjs).
    const story = variants.length > 1 ? { ...commun, ...(chapitres?.[difficulty] ?? {}), chapitre: k + 1 } : commun;
    const id = `${h.id}-${difficulty}`;
    ordre.push(id);
    if (seule && h.id !== seule) continue;
    const t = performance.now();
    let puzzle = null, seed = 0;
    // Graines différentes par histoire et difficulté, pour ne pas toujours tirer les mêmes.
    const base = [...id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) % 100000;
    for (seed = base; seed < base + 400 && !puzzle; seed++) puzzle = generate({ ...story, id }, difficulty, seed);
    if (!puzzle) { console.log(`✗ ${id} : aucune enquête ${difficulty} en 400 graines`); process.exitCode = 1; continue; }
    puzzle.seed = seed - 1;
    writeFileSync(`${DIR}${id}.json`, format(puzzle));
    console.log(`✓ ${id} · graine ${seed - 1} · ${Math.round(performance.now() - t)} ms`);
  }
}

// La liste, dans l'ordre des histoires ; on garde ce qui existe.
const existe = new Set(readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)));
writeFileSync(`${DIR}index.json`, JSON.stringify(ordre.filter((id) => existe.has(id))) + '\n');

// Le cache hors ligne doit contenir chaque enquête : la liste de sw.js suit.
const SW = fileURLToPath(new URL('../conviction/sw.js', import.meta.url));
const sw = readFileSync(SW, 'utf8');
const fin = sw.includes('\r\n') ? '\r\n' : '\n'; // le dépôt est en CRLF : garder ses fins de ligne
const liste = [...existe].sort().map((id) => `  "./puzzles/${id}.json"`).join(',' + fin);
const neuf = sw.replace(/(  "\.\/puzzles\/[^"]+\.json",?\r?\n)+/, liste + fin);
if (neuf !== sw) { writeFileSync(SW, neuf); console.log('sw.js : liste des enquêtes mise à jour. Penser à augmenter VERSION.'); }

/** JSON lisible : une ligne par case, par meuble, par indice. @param {object} p */
function format(p) {
  return JSON.stringify(p, null, 2)
    .replace(/\[\s+(-?\d+),\s+(-?\d+)\s+\]/g, '[$1, $2]')
    .replace(/"layout": \[([^\]]*)\]/, (m, x) => `"layout": [${x.replace(/\s+/g, ' ').trim()}]`)
    .replace(/"extras": \[([^\]]*)\]/g, (m, x) => `"extras": [${x.replace(/\s+/g, ' ').trim()}]`) + '\n';
}
