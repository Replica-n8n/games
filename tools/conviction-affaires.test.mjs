// Les affaires inédites (conviction/engine/procedural.js) : un numéro donne
// toujours la même affaire, valide, aux initiales distinctes ; l'identifiant
// suffit à la refaire ; l'affaire du jour est la même pour tout le monde.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { catalogue, essai, depuisId, affaireDuJour, universJouables, idAffaire } from '../conviction/engine/procedural.js';
import { validatePuzzle, findCulprit } from '../conviction/engine/index.js';
import { nomCourt } from '../conviction/engine/decor.js';

const DIR = fileURLToPath(new URL('../conviction/puzzles/', import.meta.url));
const ids = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
const cat = catalogue(ids.map((/** @type {string} */ id) => JSON.parse(readFileSync(`${DIR}${id}.json`, 'utf8'))));

/** Les premières affaires réussies à partir d'un numéro. @param {any} o @param {number} n */
function premieres(o, n) {
  const out = [];
  for (let k = 0; out.length < n && k < 400; k++) {
    const p = essai(cat, { ...o, numero: o.numero + k });
    if (p) out.push(p);
  }
  return out;
}

test('chaque univers jouable a assez de monde et ses lieux', () => {
  assert.ok(universJouables(cat).length >= 15);
  assert.ok(cat.lieux.every((l) => l.size <= 7), 'pas de grande grille : trop lente pour un téléphone');
});

test('une affaire réussie est valide, son coupable est celui de la solution, ses initiales distinctes', () => {
  for (const mode of /** @type {const} */ (['whatif', 'melange'])) {
    for (const p of premieres({ mode, numero: 9000, penche: 'moyen' }, 4)) {
      assert.ok(validatePuzzle(p).ok, `${p.id} : ${validatePuzzle(p).errors.join(' ; ')}`);
      assert.ok(findCulprit(p, p.solution));
      const suspects = p.persons.filter((x) => !x.victim);
      assert.equal(new Set(suspects.map((x) => nomCourt(x.name)[0])).size, suspects.length, p.id);
      assert.ok(p.intro.length > 40 && p.verdict.length > 40 && (p.aveu ?? '').length > 20, p.id);
      assert.ok(!/undefined|null|\s,/.test(p.intro + p.verdict + p.aveu), `${p.id} : texte troué`);
    }
  }
});

test('un What if reste dans son univers', () => {
  for (const p of premieres({ mode: 'whatif', univers: 'Cluedo', numero: 300, penche: 'moyen' }, 2)) {
    const noms = new Set((cat.gens.get('Cluedo') ?? []).map((g) => g.name));
    assert.ok(p.persons.every((x) => noms.has(x.name)), p.id);
  }
});

test("même numéro = même affaire, et l'identifiant la refait", () => {
  const [p] = premieres({ mode: 'whatif', numero: 4200, univers: 'Le Trône de fer', penche: 'moyen' }, 1);
  const q = depuisId(cat, p.id);
  assert.ok(q);
  assert.deepEqual(q.solution, p.solution);
  assert.equal(q.intro, p.intro);
  assert.equal(p.id, idAffaire({ mode: 'whatif', univers: 'Le Trône de fer', penche: 'moyen', numero: Number(p.id.split('m').pop()) }));
});

test("l'affaire du jour : moyenne, la même à chaque calcul", () => {
  const a = affaireDuJour(cat, 20261026), b = depuisId(cat, 'affaire-jour-20261026');
  assert.ok(a && b);
  assert.equal(a.id, 'affaire-jour-20261026');
  assert.equal(a.difficulty, 'moyen');
  assert.deepEqual(a.solution, b.solution);
});
