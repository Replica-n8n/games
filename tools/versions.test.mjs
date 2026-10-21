// Les numéros de version de chaque jeu et de l'arcade.
//   node --test tools/versions.test.mjs
// Trois chiffres, majeur.mineur.correctif, depuis le 2026-10-17 : « v82 » laissait
// croire à 82 changements majeurs, c'était un compteur de publications. Chaque jeu
// raconte les siens dans docs/<jeu>-versions.md, dont la DERNIÈRE ligne du tableau
// doit être la version du dépôt : on n'augmente pas le numéro sans dire pourquoi.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lire = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const JEUX = [
  { doc: 'arcade', sw: 'sw.js', prefixe: 'arcade-' },
  { doc: 'bataille', sw: 'bataille/sw.js', prefixe: 'V' },
  { doc: 'conviction', sw: 'conviction/sw.js', prefixe: 'conviction-' },
  { doc: 'echecs', sw: 'echecs/sw.js', prefixe: 'damier-' },
  // témoins : recopiés exprès, pour voir un fichier d'une autre version dans le cache
  { doc: 'patrouille', sw: 'patrouille/sw.js', prefixe: 'patrouille-' },
  { doc: 'paper-race', sw: 'paper-race/sw.js', prefixe: 'paper-race-', temoin: ['paper-race/ui.js', /const VERSION = '([^']+)'/] },
  { doc: 'petit-plus-minus', sw: 'petit-plus-minus/sw.js', prefixe: 'ppm-' },
  { doc: 'serpentin', sw: 'serpentin/sw.js', prefixe: 'chevalier-', temoin: ['serpentin/index.html', /var VERSION = "([^"]+)"/] },
  { doc: 'toto', sw: 'toto/sw.js', prefixe: 'toto-' },
];

for (const j of JEUX) {
  test(`${j.doc} : trois chiffres, racontés dans docs/${j.doc}-versions.md`, () => {
    const v = /var VERSION = "([^"]+)"/.exec(lire(j.sw))?.[1] ?? '';
    assert.ok(v.startsWith(j.prefixe), `${j.sw} : VERSION = ${v}, attendu ${j.prefixe}…`);
    const n = v.slice(j.prefixe.length);
    assert.match(n, /^\d+\.\d+\.\d+$/, `${j.sw} : VERSION = ${v}`);
    const lignes = lire(`docs/${j.doc}-versions.md`).split('\n').filter((l) => /^\| \d+\.\d+\.\d+ \|/.test(l));
    const derniere = lignes.at(-1)?.split('|')[1].trim();
    assert.equal(derniere, n, `docs/${j.doc}-versions.md finit à ${derniere}, le dépôt est à ${n}`);
    if (j.temoin) {
      const t = j.temoin[1].exec(lire(j.temoin[0]))?.[1];
      assert.equal(t, v, `${j.temoin[0]} dit ${t}, ${j.sw} dit ${v}`);
    }
  });
}
