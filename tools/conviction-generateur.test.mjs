// Pièce à conviction : générateur et témoignages écrits.
//   node --test tools/conviction-generateur.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generate, classify } from '../conviction/engine/generate.js';
import { validatePuzzle, findCulprit, rateDifficulty, boardOf } from '../conviction/engine/index.js';
import { testimony } from '../conviction/i18n/temoignages.js';
import { que, de, a, np, court } from '../conviction/i18n/fr.js';
import { HISTOIRES } from './conviction-histoires.mjs';

const DIR = new URL('../conviction/puzzles/', import.meta.url);
const lire = (/** @type {string} */ id) => JSON.parse(readFileSync(new URL(`${id}.json`, DIR), 'utf8'));
const ids = JSON.parse(readFileSync(new URL('index.json', DIR), 'utf8'));
const histoire = (/** @type {string} */ id) => { const { variants, ...h } = /** @type {any} */ (HISTOIRES.find((x) => x.id === id)); return h; };

test('même graine, même enquête, et le fichier publié est celui de sa graine', () => {
  const h = histoire('holmes-221b');
  const p1 = generate({ ...h, id: 't' }, 'facile', 54730);
  const p2 = generate({ ...h, id: 't' }, 'facile', 54730);
  assert.ok(p1);
  assert.deepEqual(p1, p2);
  // Le fichier publié est bien celui de sa graine.
  const pub = lire('holmes-221b-facile');
  const re = generate({ ...h, id: pub.id }, 'facile', pub.seed);
  assert.deepEqual(re?.solution, pub.solution);
  assert.deepEqual(re?.persons.map((x) => x.clue), pub.persons.map((/** @type {any} */ x) => x.clue));
});

test('une enquête générée est valide, son coupable est celui de l\'histoire, sa difficulté est mesurée', () => {
  for (const id of ids) {
    const p = lire(id);
    assert.ok(validatePuzzle(p).ok, id);
    if (p.seed === undefined) continue;
    const h = histoire(id.replace(/-(facile|moyen|difficile)$/, ''));
    assert.equal(findCulprit(p, p.solution), h.culprit, id);
    const d = rateDifficulty(p);
    assert.equal(d.reveals, 0, `${id} : il faudrait donner la réponse`);
    assert.equal(classify(d.levels), p.difficulty, `${id} : ${d.levels.join('')}`);
  }
});

test('le coupable ne dit jamais qu\'il était dans la pièce du crime', () => {
  for (const id of ids) {
    const p = lire(id);
    if (p.seed === undefined) continue;
    const b = boardOf(p);
    const k = findCulprit(p, p.solution);
    const [vr, vc] = p.solution[/** @type {any} */ (p.persons.find((/** @type {any} */ x) => x.victim)).id];
    const crime = b.room(vr, vc);
    const c = p.persons.find((/** @type {any} */ x) => x.id === k).clue;
    const parts = c.type === 'and' ? c.clues : [c];
    assert.ok(!parts.some((/** @type {any} */ x) => x.type === 'inRoom' && x.room === crime), id);
  }
});

test('chaque témoignage publié est bien celui de son indice (pas de texte périmé)', () => {
  for (const id of ids) {
    const p = lire(id);
    if (p.seed === undefined) continue;
    for (const x of p.persons) assert.equal(x.testimony, testimony(x.clue, p, x), `${id} · ${x.name} : relancer --textes`);
  }
});

test('le français des noms : élisions, titres, articles', () => {
  assert.equal(que('Eugénie'), "qu'Eugénie");
  assert.equal(que('Sansa'), 'que Sansa');
  assert.equal(que('Colonel Moran'), 'que le colonel Moran');
  assert.equal(de('Colonel Moran'), 'du colonel Moran');
  assert.equal(de('Irene Adler'), "d'Irene Adler");
  assert.equal(de('Princesse Dragomiroff'), 'de la princesse Dragomiroff');
  assert.equal(a('Juge Wargrave'), 'au juge Wargrave');
  assert.equal(np('Dr Watson'), 'le Dr Watson');
  assert.equal(court('Mrs Hudson'), 'Hudson');
  assert.equal(court('Hector MacQueen'), 'Hector');
  assert.equal(court('Lady Macbeth'), 'Lady Macbeth');
});

test('les témoignages se lisent : posture, meuble, pièce, puis le reste', () => {
  const p = lire('valcourt');
  const agathe = { ...p.persons[0], fem: true };
  const victor = p.persons[5];
  /** @param {any} clue @param {any} who */
  const t = (clue, who) => testimony(clue, p, who);
  assert.equal(t({ type: 'and', clues: [{ type: 'besideObject', object: 'piano' }, { type: 'inRoom', room: 'S' }, { type: 'seated' }] }, { ...agathe, look: agathe.look }),
    "J'étais assise dans la pièce « Salon », à côté du piano.");
  assert.equal(t({ type: 'and', clues: [{ type: 'onObject', object: 'canape' }, { type: 'not', clue: { type: 'column', index: 2 } }] }, agathe),
    "J'étais assise sur le canapé, mais pas dans la colonne C.");
  assert.equal(t({ type: 'relative', person: 'E', dir: 'north' }, agathe), "J'étais plus au nord qu'Eugénie.");
  assert.equal(t({ type: 'relative', person: 'B', dir: 'west', distance: 1, aligned: true }, agathe), "J'étais juste à l'ouest de Bastien.");
  assert.equal(t({ type: 'not', clue: { type: 'seated' } }, agathe), "J'étais debout.");
  assert.equal(t({ type: 'not', clue: { type: 'sameRoom', person: 'D' } }, agathe), "Je n'étais pas dans la même pièce que Dorian.");
  assert.equal(t({ type: 'besideObject', object: 'fontaine' }, victor), 'Le corps gisait à côté de la fontaine.');
  assert.equal(t({ type: 'seated' }, victor), 'Le corps gisait sur un siège.');
});
