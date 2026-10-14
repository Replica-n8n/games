// Pièce à conviction : état d'une partie (actions, annuler, chronomètre).
//   node --test tools/conviction-partie.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game, replay, formatClock } from '../conviction/ui/state.js';

const V = JSON.parse(readFileSync(new URL('../conviction/puzzles/valcourt.json', import.meta.url), 'utf8'));

test('replay : placer déloge l\'occupant et efface la croix, effacer vide tout', () => {
  const { placement, marks } = replay([
    { t: 'mark', pos: [0, 3] },
    { t: 'place', p: 'A', pos: [0, 3] },
    { t: 'place', p: 'B', pos: [0, 3] },
    { t: 'mark', pos: [5, 5] },
    { t: 'mark', pos: [4, 5] },
    { t: 'mark', pos: [4, 5] },
  ], 6);
  assert.deepEqual(placement, { B: [0, 3] });
  assert.deepEqual([...marks], ['5,5']);
  assert.deepEqual(replay([{ t: 'place', p: 'A', pos: [1, 1] }, { t: 'clear' }], 2).placement, {});
});

test('notes au crayon : basculer, effacées par une pose sur leur ligne, leur colonne ou leur personne', () => {
  const g = new Game(V);
  g.do({ t: 'note', p: 'A', pos: [2, 0] });
  g.do({ t: 'note', p: 'E', pos: [2, 0] });
  g.do({ t: 'note', p: 'A', pos: [4, 0] });
  g.do({ t: 'note', p: 'E', pos: [2, 1] });
  g.do({ t: 'note', p: 'C', pos: [5, 5] });
  assert.deepEqual(g.notesAt([2, 0]), ['A', 'E']);
  g.do({ t: 'note', p: 'E', pos: [2, 0] });
  assert.deepEqual(g.notesAt([2, 0]), ['A'], 'renoter efface');
  g.do({ t: 'place', p: 'A', pos: [4, 0] });
  assert.deepEqual(g.notesAt([2, 0]), [], "les notes d'Agathe partent, et la colonne A est prise");
  assert.deepEqual(g.notesAt([4, 0]), []);
  assert.deepEqual(g.notesAt([2, 1]), ['E'], 'ailleurs, les notes des autres restent');
  assert.deepEqual(g.notesAt([5, 5]), ['C']);
  g.do({ t: 'mark', pos: [5, 5] });
  assert.deepEqual(g.notesAt([5, 5]), [], 'barrer efface les notes de la case');
  g.undo(); g.undo();
  assert.deepEqual(g.notesAt([2, 0]), ['A'], 'annuler la pose rend les notes');
});

test('annuler et rétablir, et une nouvelle action efface ce qu\'on pouvait rétablir', () => {
  const g = new Game(V);
  g.do({ t: 'place', p: 'B', pos: [1, 2] });
  g.do({ t: 'place', p: 'D', pos: [5, 4] });
  assert.ok(g.undo());
  assert.deepEqual(g.placement, { B: [1, 2] });
  assert.ok(g.canRedo);
  assert.ok(g.redo());
  assert.deepEqual(g.placement, { B: [1, 2], D: [5, 4] });
  g.undo();
  g.do({ t: 'remove', p: 'B' });
  assert.equal(g.canRedo, false);
  assert.deepEqual(g.placement, {});
  g.undo(); g.undo();
  assert.equal(g.canUndo, false);
  assert.equal(g.undo(), false);
});

test('recommencer s\'annule aussi', () => {
  const g = new Game(V);
  g.do({ t: 'place', p: 'B', pos: [1, 2] });
  g.do({ t: 'clear' });
  assert.deepEqual(g.placement, {});
  g.undo();
  assert.deepEqual(g.placement, { B: [1, 2] });
});

test('conflits, plan juste, accusation', () => {
  const g = new Game(V);
  g.do({ t: 'place', p: 'A', pos: [2, 0] });
  g.do({ t: 'place', p: 'E', pos: [2, 1] });
  assert.deepEqual([...g.conflicts()].sort(), ['A', 'E']);
  g.do({ t: 'clear' });
  for (const [p, pos] of Object.entries(V.solution)) g.do({ t: 'place', p, pos });
  assert.ok(g.solved);
  assert.equal(g.accuse('A'), false);
  assert.equal(g.accuse('D'), true);
  assert.equal(g.accused, 'D');
});

test('chronomètre : en pause quand l\'onglet est caché, figé au plan juste', () => {
  const g = new Game(V);
  g.start(1000);
  assert.equal(g.clock(4000), 3000);
  g.pause(4000);
  assert.equal(g.clock(60000), 3000, 'caché : le temps ne court pas');
  g.start(60000);
  const entries = Object.entries(V.solution);
  for (const [p, pos] of entries) g.do({ t: 'place', p, pos }, 62000);
  assert.equal(g.time, 5000);
  assert.equal(g.clock(999999), 5000);
  g.start(70000);
  assert.equal(g.running, false, 'ne repart pas une fois résolu');
  g.undo(71000);
  assert.equal(g.clock(80000), 5000, 'annuler après la fin ne relance pas le record');
});

test('le chronomètre part au premier geste, et reprend une partie commencée', () => {
  const g = new Game(V);
  g.resume(0);
  assert.equal(g.clock(5000), 0, 'ouvert sans jouer : rien ne court');
  g.do({ t: 'mark', pos: [0, 2] }, 5000);
  assert.equal(g.clock(7000), 2000);
  const h = new Game(V, g.toJSON(7000));
  h.resume(10000);
  assert.equal(h.clock(11000), 3000);
});

test('indices comptés, sauf « plan complet »', () => {
  const g = new Game(V);
  const h = g.hint();
  assert.equal(h.place?.person, 'B');
  assert.equal(g.hints, 1);
  for (const [p, pos] of Object.entries(V.solution)) g.do({ t: 'place', p, pos });
  assert.equal(g.hint().kind, 'complete');
  assert.equal(g.hints, 1);
});

test('sauvegarde : se relit à l\'identique, refuse une autre enquête ou un vieux format', () => {
  const g = new Game(V);
  g.start(0);
  g.do({ t: 'place', p: 'B', pos: [1, 2] }, 10);
  g.do({ t: 'mark', pos: [0, 0] }, 10);
  g.undo(10);
  g.hint();
  const s = JSON.parse(JSON.stringify(g.toJSON(2500)));
  const h = new Game(V, s);
  assert.deepEqual(h.placement, { B: [1, 2] });
  assert.equal(h.canRedo, true);
  assert.equal(h.hints, 1);
  assert.equal(h.clock(), 2500);
  assert.deepEqual(new Game(V, { ...s, puzzle: 'autre' }).placement, {});
  assert.deepEqual(new Game(V, { ...s, v: 0 }).placement, {});
});

test('formatClock', () => {
  assert.equal(formatClock(0), '0:00');
  assert.equal(formatClock(247000), '4:07');
  assert.equal(formatClock(3729000), '1:02:09');
});
