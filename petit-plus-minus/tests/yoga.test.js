import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { POSTURES, DEBOUT, ARTICULATIONS, CADRE, RYTHME, entre, doux } from "../js/yoga.js";
import { dessinChat } from "../js/chat.js";

const contenu = JSON.parse(readFileSync(new URL("../contenu.json", import.meta.url), "utf8"));
const toutes = { debout: DEBOUT, ...POSTURES };

test("chaque posture a ses seize articulations, toutes dans le cadre et au-dessus du tapis", () => {
  for (const [nom, p] of Object.entries(toutes)) {
    assert.deepEqual(Object.keys(p.j), ARTICULATIONS, nom);
    for (const [k, [x, y]] of Object.entries(p.j)) {
      assert.ok(x >= 20 && x <= CADRE.largeur - 10, `${nom}.${k} : x = ${x}`);
      assert.ok(y >= 40 && y <= CADRE.tapis - 6, `${nom}.${k} : y = ${y} (le tapis est à ${CADRE.tapis})`);
    }
  }
});

test("le chat ne se pose jamais sur la tête : elle reste au-dessus du bassin ou du tapis", () => {
  for (const [nom, p] of Object.entries(POSTURES)) {
    const plusBas = Math.max(...["piG", "piD", "geG", "geD"].map((k) => p.j[k][1]));
    assert.ok(p.j.tete[1] < plusBas, `${nom} : la tête (${p.j.tete[1]}) est plus bas que les jambes (${plusBas})`);
  }
});

test("dans l'arbre, le pied se pose SOUS le genou de la jambe d'appui, jamais dessus", () => {
  const a = POSTURES.arbre.j;
  assert.ok(a.piG[1] > a.geD[1] + 4, `pied à ${a.piG[1]}, genou d'appui à ${a.geD[1]}`);
});

test("le yoga du jeu n'a ni lotus ni posture sur la tête ou les épaules", () => {
  for (const interdit of ["lotus", "poirier", "chandelle", "tete", "epaules"]) assert.equal(Object.hasOwn(POSTURES, interdit), false, interdit);
});

test("les postures de contenu.json sont toutes connues, chacune avec un nom court", () => {
  assert.ok(contenu.yoga.postures.length >= 3);
  for (const p of contenu.yoga.postures) {
    assert.ok(Object.hasOwn(POSTURES, p.id), p.id);
    assert.ok(p.nom.split(/\s+/).length <= 3, `« ${p.nom} » : un nom, pas une phrase`);
  }
  assert.equal(contenu.yoga.postures.at(-1).id, "graine", "on finit par le repos");
});

test("entre deux postures : on part de l'une, on arrive à l'autre, sans saut au milieu", () => {
  const a = POSTURES.arbre, b = POSTURES.dosrond;
  assert.deepEqual(entre(a, b, 0), a);
  assert.deepEqual(entre(a, b, 1), b);
  const m = entre(a, b, .5);
  assert.equal(m.vue, .5);
  assert.deepEqual(m.j.tete, [(a.j.tete[0] + b.j.tete[0]) / 2, (a.j.tete[1] + b.j.tete[1]) / 2]);
  assert.equal(doux(0), 0);
  assert.equal(doux(1), 1);
  assert.ok(doux(.25) < .25 && doux(.75) > .75, "départ et arrivée en douceur");
});

test("le souffle dure plus longtemps que l'inspiration, comme à la bougie", () => {
  assert.ok(RYTHME.souffle > RYTHME.inspire);
  assert.ok(RYTHME.change >= 3000, "le temps de changer de posture");
});

test("le dessin du chat : du SVG lisible pour chaque posture et chaque état", () => {
  for (const [nom, p] of Object.entries(toutes)) for (const yeux of [false, true]) for (const queue of [-1, 0, 1]) {
    const svg = dessinChat(p.j, p.vue, { yeux, queue });
    assert.ok(svg.startsWith("<path") && svg.length > 1500, nom);
    assert.equal(/NaN|undefined|Infinity/.test(svg), false, nom + " : un nombre illisible");
    assert.equal(/style=/.test(svg), false, nom + " : pas de style en ligne (la page l'interdit)");
  }
});

test("le contour est d'un seul tenant : tous les contours d'abord, les aplats ensuite", () => {
  const svg = dessinChat(DEBOUT.j, 0);
  const dernierContour = svg.lastIndexOf('"#7A4210"'), premierAplat = svg.search(/(stroke|fill)="rgb\(/);
  assert.ok(dernierContour > 0 && premierAplat > 0);
  assert.ok(dernierContour < premierAplat, "un contour est tracé après un aplat : il ferait un trait à une jointure");
});

test("les yeux se ferment pendant le souffle, la queue ondule", () => {
  const p = POSTURES.papillon;
  assert.notEqual(dessinChat(p.j, p.vue, { yeux: true }), dessinChat(p.j, p.vue, { yeux: false }));
  assert.notEqual(dessinChat(p.j, p.vue, { queue: 1 }), dessinChat(p.j, p.vue, { queue: -1 }));
});
