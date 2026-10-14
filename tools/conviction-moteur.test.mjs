// Pièce à conviction : tests du moteur.
//   node --test tools/conviction-moteur.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { boardOf, coord } from '../conviction/engine/board.js';
import { evalClue } from '../conviction/engine/clues.js';
import {
  evaluateClue, solve, findCulprit, validatePuzzle, nextHint, hintChain, rateDifficulty, LEVEL,
} from '../conviction/engine/index.js';

const load = () => JSON.parse(readFileSync(new URL('../conviction/puzzles/valcourt.json', import.meta.url), 'utf8'));
const V = load();
const B = boardOf(V);
/** @param {object} clue @param {object} pl @param {string} [self] */
const ev = (clue, pl, self = 'X') => evalClue(B, /** @type {any} */ (clue), self, pl);
const at = (/** @type {number} */ r, /** @type {number} */ c) => ({ X: [r, c] });

// ---------- Indices ----------

test('besideObject : voisin orthogonal ET même pièce', () => {
  const t = { type: 'besideObject', object: 'fourneau' }; // fourneau en A4, cuisine
  assert.equal(ev(t, at(2, 0)), true);
  assert.equal(ev(t, at(3, 1)), true);
  assert.equal(ev(t, at(2, 1)), false, 'en diagonale');
  const p = { type: 'besideObject', object: 'plante' }; // plante en C3, jardin d'hiver
  assert.equal(ev(p, at(1, 2)), false, 'C2 touche la plante mais est dans la bibliothèque');
  assert.equal(ev(p, at(2, 1)), false, 'B3 touche la plante mais est dans la cuisine');
  assert.equal(ev(p, at(2, 3)), true);
});

test('onObject, seated, inRoom, row, column', () => {
  assert.equal(ev({ type: 'onObject', object: 'banc' }, at(5, 4)), true);
  assert.equal(ev({ type: 'onObject', object: 'banc' }, at(5, 3)), false);
  assert.equal(ev({ type: 'seated' }, at(1, 3)), true, 'canapé');
  assert.equal(ev({ type: 'seated' }, at(1, 4)), false);
  assert.equal(ev({ type: 'inRoom', room: 'J' }, at(5, 5)), true);
  assert.equal(ev({ type: 'inRoom', room: 'J' }, at(5, 2)), false);
  assert.equal(ev({ type: 'row', index: 2 }, at(2, 4)), true);
  assert.equal(ev({ type: 'column', index: 2 }, at(2, 4)), false);
});

test('relative : direction, distance exacte, alignement', () => {
  const north = { type: 'relative', person: 'Y', dir: 'north' };
  assert.equal(ev(north, { X: [1, 0], Y: [3, 4] }), true);
  assert.equal(ev(north, { X: [3, 0], Y: [3, 4] }), false, 'même ligne');
  assert.equal(ev(north, { X: [1, 0] }), null, 'Y pas placé');
  assert.equal(ev({ ...north, distance: 2 }, { X: [1, 0], Y: [3, 4] }), true);
  assert.equal(ev({ ...north, distance: 1 }, { X: [1, 0], Y: [3, 4] }), false);
  assert.equal(ev({ ...north, aligned: true }, { X: [1, 0], Y: [3, 4] }), false);
  assert.equal(ev({ ...north, aligned: true }, { X: [1, 4], Y: [3, 4] }), true);
  assert.equal(ev({ type: 'relative', person: 'Y', dir: 'south' }, { X: [4, 0], Y: [3, 4] }), true);
  assert.equal(ev({ type: 'relative', person: 'Y', dir: 'east' }, { X: [0, 5], Y: [3, 4] }), true);
  assert.equal(ev({ type: 'relative', person: 'Y', dir: 'west', distance: 4 }, { X: [0, 0], Y: [3, 4] }), true);
});

test('besidePerson et sameRoom', () => {
  assert.equal(ev({ type: 'besidePerson', person: 'Y' }, { X: [4, 2], Y: [4, 3] }), true);
  assert.equal(ev({ type: 'besidePerson', person: 'Y' }, { X: [2, 3], Y: [2, 4] }), false, 'mur entre jardin et salon');
  assert.equal(ev({ type: 'besidePerson', person: 'Y' }, { X: [2, 1], Y: [2, 2] }), false, 'mur entre cuisine et jardin');
  assert.equal(ev({ type: 'sameRoom', person: 'Y' }, { X: [0, 0], Y: [1, 2] }), true);
  assert.equal(ev({ type: 'sameRoom', person: 'Y' }, { X: [0, 0], Y: [0, 3] }), false);
  assert.equal(ev({ type: 'sameRoom', person: 'Y' }, { X: [0, 0] }), null);
});

test('aloneWith et alone : faux dès qu\'un tiers entre, vrai seulement plan complet', () => {
  const t = { type: 'aloneWith', person: 'V' };
  // Dorian (banc E6) et Victor (F4) dans le jardin d'hiver.
  const full = { ...V.solution };
  assert.equal(evalClue(B, t, 'D', full), true);
  const partial = { D: [5, 4], V: [3, 5] };
  assert.equal(evalClue(B, t, 'D', partial), null, 'les autres pourraient encore entrer');
  assert.equal(evalClue(B, t, 'D', { ...partial, A: [2, 3] }), false, 'un tiers dans la pièce');
  assert.equal(evalClue(B, t, 'D', { D: [5, 4], V: [0, 5] }), false, 'pas la même pièce');
  assert.equal(evalClue(B, t, 'D', { D: [5, 4], A: [2, 3] }), false, 'victime absente mais un tiers est là');
  assert.equal(evalClue(B, { type: 'alone' }, 'B', full), true, 'Bastien seul à la bibliothèque');
  assert.equal(evalClue(B, { type: 'alone' }, 'A', full), false, 'Agathe et Eugénie en cuisine');
  assert.equal(evalClue(B, { type: 'alone' }, 'B', { B: [1, 2] }), null);
});

test('not, and, or en logique à trois valeurs', () => {
  const T = { type: 'seated' }, F = { type: 'row', index: 5 }, N = { type: 'sameRoom', person: 'Y' };
  const pl = at(1, 3); // canapé : assis, ligne 2
  assert.equal(ev({ type: 'not', clue: T }, pl), false);
  assert.equal(ev({ type: 'not', clue: N }, pl), null);
  assert.equal(ev({ type: 'and', clues: [T, F] }, pl), false);
  assert.equal(ev({ type: 'and', clues: [T, N] }, pl), null);
  assert.equal(ev({ type: 'and', clues: [F, N] }, pl), false, 'un faux suffit');
  assert.equal(ev({ type: 'or', clues: [F, N] }, pl), null);
  assert.equal(ev({ type: 'or', clues: [T, N] }, pl), true, 'un vrai suffit');
  assert.equal(ev({ type: 'or', clues: [F, F] }, pl), false);
});

test('evaluateClue : personne non placée, témoignages de Valcourt', () => {
  assert.equal(evaluateClue(V, {}, 'A'), null);
  for (const p of V.persons) assert.equal(evaluateClue(V, V.solution, p.id), true, p.name);
  assert.equal(evaluateClue(V, { V: [4, 5] }, 'V'), false, 'F5 touche la fontaine');
  assert.throws(() => evaluateClue(V, {}, 'Z'));
});

// ---------- Solveur ----------

test('solve : Valcourt a une seule solution, celle du prototype', () => {
  const sols = solve(V);
  assert.equal(sols.length, 1);
  assert.deepEqual(sols[0], V.solution);
});

test('solve : détecte deux solutions et s\'arrête à la limite', () => {
  const p = load();
  // Dorian n'a plus de témoignage utile. (Retirer celui d'Eugénie ne
  // suffirait pas : il est superflu, elle tombe sur la dernière case libre.)
  p.persons[3].clue = { type: 'or', clues: [{ type: 'seated' }, { type: 'not', clue: { type: 'seated' } }] };
  assert.equal(solve(p).length, 2);
  assert.ok(solve(p, 10).length > 2);
});

test('solve : aucune solution', () => {
  const p = load();
  p.persons[0].clue = { type: 'onObject', object: 'piano' }; // case bloquée
  assert.equal(solve(p).length, 0);
});

// ---------- Coupable ----------

test('findCulprit : Dorian à Valcourt, personne si zéro ou deux', () => {
  assert.equal(findCulprit(V, V.solution), 'D');
  assert.equal(findCulprit(V, { ...V.solution, V: [0, 5] }), 'C', 'victime au salon avec Céleste');
  assert.equal(findCulprit(V, { ...V.solution, V: [2, 0] }), null, 'deux personnes en cuisine');
  assert.equal(findCulprit(V, { ...V.solution, V: [0, 0] }), 'B');
  const lonely = { ...V.solution, V: [2, 4] }; // salon, Céleste en D1
  assert.equal(findCulprit(V, lonely), 'C');
  assert.equal(findCulprit(V, { ...V.solution, C: [5, 5], V: [0, 5] }), null, 'victime seule au salon');
});

// ---------- Validation : chaque contrôle prouvé par un défaut injecté ----------

test('validatePuzzle : Valcourt est valide', () => {
  const v = validatePuzzle(V);
  assert.deepEqual(v.errors, []);
  assert.equal(v.culprit, 'D');
});

/** @param {(p: any) => void} broke @param {RegExp} expect */
const fails = (broke, expect) => {
  const p = load();
  broke(p);
  const v = validatePuzzle(p);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some((e) => expect.test(e)), `attendu ${expect}, reçu :\n${v.errors.join('\n')}`);
};

test('validatePuzzle refuse les données incohérentes', () => {
  fails((p) => { p.persons[0].clue.type = 'besideObjet'; }, /type d'indice inconnu/);
  fails((p) => { p.persons[4].clue.room = 'K'; }, /pièce inconnue/);
  fails((p) => { p.persons[0].clue.object = 'tonneau'; }, /meuble inconnu/);
  fails((p) => { p.persons[0].clue.object = 'chaise'; p.furniture = p.furniture.filter((f) => f.type !== 'chaise'); }, /aucun meuble « chaise »/);
  fails((p) => { p.persons[1].name = 'Agnès'; }, /même initiale/);
  fails((p) => { p.persons[1].color = 'ocre'; }, /couleur déjà prise/);
  fails((p) => { p.persons[1].color = 'fuchsia'; }, /couleur inconnue/);
  fails((p) => { p.persons[5].victim = false; }, /une victime/);
  fails((p) => { p.persons.pop(); }, /Il faut 6 personnes/);
  fails((p) => { p.layout[0] = 'BBBSS'; }, /6 lignes de 6/);
  fails((p) => { p.layout[5] = 'CCCJJB'; }, /coupée en deux/);
  fails((p) => { p.layout[0] = 'BBBSSZ'; }, /Lettre de pièce inconnue/);
  fails((p) => { p.persons[0].clue = { type: 'besidePerson', person: 'Q' }; }, /personne inconnue/);
  fails((p) => { p.persons[0].clue = { type: 'column', index: 6 }; }, /hors du plan/);
  fails((p) => { p.solution.A = [3, 0]; }, /sur un meuble/);
  fails((p) => { p.difficulty = 'extrême'; }, /Difficulté inconnue/);
});

test('validatePuzzle refuse plusieurs solutions, une solution notée fausse, pas de coupable', () => {
  fails((p) => { p.persons[3].clue = { type: 'or', clues: [{ type: 'seated' }, { type: 'not', clue: { type: 'seated' } }] }; }, /Plusieurs solutions/);
  fails((p) => { p.solution.A = [2, 0]; }, /solution notée place Agathe en A3/);
  fails((p) => { p.persons[0].clue = { type: 'onObject', object: 'piano' }; }, /Aucune solution/);
  // Victime déplacée au salon, seule : plus de coupable.
  fails((p) => {
    p.persons[5].clue = { type: 'and', clues: [{ type: 'column', index: 5 }, { type: 'inRoom', room: 'S' }, { type: 'alone' }] };
    p.persons[2].clue = { type: 'and', clues: [{ type: 'besideObject', object: 'piano' }, { type: 'column', index: 3 }] };
  }, /coupable unique|Aucune solution/);
});

// ---------- Indices ----------

test('nextHint : Valcourt se résout par déductions, sans jamais donner la réponse', () => {
  const chain = hintChain(V);
  const placed = chain.filter((h) => h.place);
  assert.deepEqual(placed.map((h) => h.place?.person), ['B', 'D', 'C', 'V', 'E', 'A']);
  for (const h of placed) assert.deepEqual(h.place?.pos, V.solution[/** @type {string} */ (h.place?.person)]);
  assert.equal(chain.at(-1)?.kind, 'complete');
  assert.match(placed[0].text, /une seule case du plan correspond à son témoignage, C2/);
  assert.match(placed[2].text, /Personne d'autre que Céleste ne peut occuper la colonne D/);
  assert.match(placed[4].text, /qu'Eugénie/);
  const d = rateDifficulty(V);
  assert.equal(d.reveals, 0);
  assert.ok(d.max <= LEVEL.onlyOne, 'Valcourt est une enquête facile');
});

test('nextHint : depuis toute grille partielle juste, la case proposée est la bonne', () => {
  const ids = V.persons.map((p) => p.id);
  for (let mask = 0; mask < 1 << ids.length; mask++) {
    const pl = {};
    ids.forEach((id, i) => { if (mask & (1 << i)) pl[id] = V.solution[id]; });
    const h = nextHint(V, pl);
    if (Object.keys(pl).length === ids.length) { assert.equal(h.kind, 'complete'); continue; }
    assert.ok(h.place, `masque ${mask} : ${h.kind}`);
    assert.ok(!pl[h.place.person], 'propose une personne pas encore placée');
    assert.deepEqual(h.place.pos, V.solution[h.place.person], `masque ${mask} : ${h.text}`);
  }
});

test('nextHint : les erreurs du joueur passent avant les déductions', () => {
  const conflict = nextHint(V, { A: [2, 0], E: [2, 1] });
  assert.equal(conflict.kind, 'conflict');
  assert.match(conflict.text, /Agathe et Eugénie partagent la ligne 3/);
  const wrong = nextHint(V, { B: [1, 2], A: [2, 0] });
  assert.equal(wrong.kind, 'wrong');
  assert.match(wrong.text, /Agathe n'est pas à sa place/);
  assert.deepEqual(wrong.cells, [[2, 0]]);
});

// Variante de Valcourt trouvée par tirage : témoignages relatifs, solution
// unique, qui ne se résout pas sans l'absurde.
const ABSURDE = {
  A: { type: 'and', clues: [{ type: 'relative', person: 'V', dir: 'south' }, { type: 'inRoom', room: 'C' }] },
  B: { type: 'and', clues: [{ type: 'seated' }, { type: 'relative', person: 'V', dir: 'west' }] },
  C: { type: 'and', clues: [{ type: 'relative', person: 'B', dir: 'east' }, { type: 'relative', person: 'E', dir: 'north' }] },
  D: { type: 'seated' },
  E: { type: 'relative', person: 'V', dir: 'west' },
  V: { type: 'and', clues: [{ type: 'relative', person: 'B', dir: 'south' }, { type: 'relative', person: 'C', dir: 'east' }] },
};

test("nextHint : l'absurde place quelqu'un, et le texte ne cite que les étapes utiles", () => {
  const p = load();
  for (const x of p.persons) x.clue = ABSURDE[x.id];
  assert.equal(solve(p).length, 1);
  const chain = hintChain(p);
  const first = chain[0];
  assert.equal(first.level, LEVEL.absurd);
  assert.deepEqual(first.place?.pos, p.solution[/** @type {string} */ (first.place?.person)]);
  assert.match(first.text, /n'aurait plus de place/);
  assert.ok(first.text.length < 600, `texte trop long (${first.text.length})`);
  for (const h of chain) if (h.place) assert.deepEqual(h.place.pos, p.solution[h.place.person], h.text);
  assert.equal(rateDifficulty(p).reveals, 0);
});

test('nextHint : la réponse en dernier recours', () => {
  const q = load();
  const vide = { type: 'or', clues: [{ type: 'seated' }, { type: 'not', clue: { type: 'seated' } }] };
  const rev = nextHint({ ...q, persons: q.persons.map((x) => ({ ...x, clue: vide })) }, {});
  assert.equal(rev.kind, 'reveal');
  assert.equal(rev.level, LEVEL.reveal);
  assert.match(rev.text, new RegExp(`Agathe est en ${coord(q.solution.A)}`));
});
