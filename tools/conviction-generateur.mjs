// Pièce à conviction : fabrique les enquêtes à partir des histoires
// (tools/conviction-histoires.mjs) et réécrit conviction/puzzles/index.json.
// Chaque enquête porte sa graine : relancer donne exactement la même chose.
//   node tools/conviction-generateur.mjs             tout
//   node tools/conviction-generateur.mjs holmes-221b une histoire
// Les enquêtes écrites à la main (sans graine, comme Valcourt) ne sont
// jamais touchées. Ensuite : node tools/conviction-enquetes.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { cpus } from 'node:os';
import { HISTOIRES } from './conviction-histoires.mjs';
import { AVEUX } from './conviction-aveux.mjs';
import { boardOf } from '../conviction/engine/board.js';
import { validatePuzzle } from '../conviction/engine/index.js';

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
    let n = 0;
    // L'aveu du coupable (tools/conviction-aveux.mjs), même pour Valcourt.
    if (AVEUX[p.id] && p.aveu !== AVEUX[p.id]) { p.aveu = AVEUX[p.id]; n++; }
    for (const x of p.persons) {
      const y = h && (h.chapitres?.[p.difficulty]?.persons ?? h.persons).find((z) => z.name === x.name);
      if (y && JSON.stringify(y.look) !== JSON.stringify(x.look)) { x.look = y.look; n++; }
    }
    if (n) { writeFileSync(DIR + f, format(p)); console.log(`✓ ${f} : ${n} changement(s)`); }
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
    // Un plan impossible se dit tout de suite, au lieu de 4 000 graines pour rien
    // (vu en redessinant le train et le bateau, 2026-10-17).
    const bouche = impasse(story);
    if (bouche) { console.log(`✗ ${id} : plan impossible, ${bouche}`); process.exitCode = 1; continue; }
    // Graines différentes par histoire et difficulté, pour ne pas toujours tirer les mêmes.
    const base = [...id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) % 100000;
    // Une 8×8 difficile demande des milliers de graines : un ouvrier par cœur.
    const essais = story.size >= 8 && difficulty === 'difficile' ? 4000 : 400;
    // Rien dans les premières graines (un plan redessiné, plus petit) : on cherche plus loin.
    // Une enquête déjà trouvée l'est dans les premières : elle ne change pas.
    const trouve = await chercher({ ...story, id }, difficulty, base, base + essais)
      ?? (essais < 4000 ? await chercher({ ...story, id }, difficulty, base + essais, base + 4000) : null);
    if (!trouve) { console.log(`✗ ${id} : aucune enquête ${difficulty} en ${Math.max(essais, 4000)} graines (l'ANCIEN fichier reste : à régler avant de publier)`); process.exitCode = 1; continue; }
    const { puzzle, seed } = trouve;
    puzzle.seed = seed;
    if (AVEUX[id]) puzzle.aveu = AVEUX[id];
    writeFileSync(`${DIR}${id}.json`, format(puzzle));
    console.log(`✓ ${id} · graine ${seed} · ${Math.round(performance.now() - t)} ms`);
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

/** Ce qui rend un plan impossible à remplir, ou null. Le coupable et la victime
 *  sont seuls dans la pièce du crime : il y faut deux cases libres sur deux
 *  lignes ET deux colonnes ; et chaque ligne, chaque colonne a quelqu'un.
 *  @param {any} story @returns {string | null} */
function impasse(story) {
  // Le plan lui-même d'abord (une pièce coupée en deux, un meuble hors plan…) : vu sur Macbeth.
  const plan = validatePuzzle({ ...story, difficulty: 'facile', solution: {}, persons: story.persons.map((/** @type {any} */ p) => ({ ...p, clue: { type: 'seated' }, testimony: 'x' })) })
    .errors.filter((/** @type {string} */ e) => /pièce|plan|Meuble|ligne|colonne/.test(e) && !/[Ss]olution/.test(e));
  if (plan.length) return plan.join(' ; ');
  const b = boardOf(story);
  for (let i = 0; i < story.size; i++) {
    if (!b.free.some(([r]) => r === i)) return `la ligne ${i + 1} n'a aucune case libre`;
    if (!b.free.some(([, c]) => c === i)) return `la colonne ${String.fromCharCode(65 + i)} n'a aucune case libre`;
  }
  if (story.crimeRoom) {
    const k = b.free.filter(([r, c]) => b.room(r, c) === story.crimeRoom);
    const paires = k.flatMap(([r, c]) => k.filter(([R, C]) => R > r && C !== c).map(([R, C]) => [r, c, R, C]));
    if (!paires.length) return `la pièce du crime (${story.crimeRoom}) n'a pas deux cases libres sur deux lignes et deux colonnes`;
    // Les autres doivent tenir hors des lignes et colonnes du crime : une colonne dont les
    // seules cases libres sont sur ces lignes reste vide (vu sur le presbytère).
    const ok = paires.some(([r1, c1, r2, c2]) => {
      const lignes = new Set([r1, r2]), cols = new Set([c1, c2]);
      for (let i = 0; i < story.size; i++) {
        if (!lignes.has(i) && !b.free.some(([r, c]) => r === i && !cols.has(c) && b.room(r, c) !== story.crimeRoom)) return false;
        if (!cols.has(i) && !b.free.some(([r, c]) => c === i && !lignes.has(r) && b.room(r, c) !== story.crimeRoom)) return false;
      }
      return true;
    });
    if (!ok) return `aucune place pour le coupable et la victime ne laisse une case libre à chaque autre ligne et colonne`;
  }
  return null;
}

/** Cherche une enquête sur tous les cœurs : chaque ouvrier essaie une graine
 *  sur N. Rend la première trouvée (sa graine la refait à l'identique).
 *  @param {any} story @param {string} difficulty @param {number} debut @param {number} fin
 *  @returns {Promise<{ seed: number, puzzle: any } | null>} */
function chercher(story, difficulty, debut, fin) {
  const n = Math.max(1, Math.min(cpus().length, fin - debut));
  return new Promise((ok) => {
    let restants = n, fini = false;
    const ouvriers = [];
    for (let w = 0; w < n; w++) {
      const o = new Worker(new URL('./conviction-generateur-travail.mjs', import.meta.url), { workerData: { story, difficulty, debut: debut + w, pas: n, fin } });
      ouvriers.push(o);
      o.on('message', (m) => {
        if (fini || m.essai !== undefined) return;
        if (m.seed !== null) { fini = true; for (const x of ouvriers) x.terminate(); ok(m); }
        else if (--restants === 0) { fini = true; ok(null); }
      });
      o.on('error', (e) => { console.error(e); if (--restants === 0 && !fini) { fini = true; ok(null); } });
    }
  });
}

/** JSON lisible : une ligne par case, par meuble, par indice. @param {object} p */
function format(p) {
  return JSON.stringify(p, null, 2)
    .replace(/\[\s+(-?\d+),\s+(-?\d+)\s+\]/g, '[$1, $2]')
    .replace(/"layout": \[([^\]]*)\]/, (m, x) => `"layout": [${x.replace(/\s+/g, ' ').trim()}]`)
    .replace(/"extras": \[([^\]]*)\]/g, (m, x) => `"extras": [${x.replace(/\s+/g, ' ').trim()}]`) + '\n';
}
