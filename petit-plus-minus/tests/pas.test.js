import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FOIS, MAX_ETAPES, MAX_TRACES, escalierVide, lireEscalier, nettoyer, etapeCourante, peutMonter, enHaut, commence,
  nommer, ajouterEtape, glisserEtape, ecrireEtape, mesurerEtape, retirerEtape, affronter, monter,
} from "../js/pas.js";

/* Un escalier écrit dans le désordre, comme le ferait un parent : [texte, taille de Minus]. */
function escalier(...lignes) {
  return lignes.reduce((e, [texte, peur]) => {
    const a = ajouterEtape(e);
    const id = a.etapes.at(-1).id;
    return mesurerEtape(ecrireEtape(a, id, texte), id, peur);
  }, escalierVide());
}
const textes = (e) => e.etapes.map((x) => x.texte);
const nFois = (e, n, apres = 2) => Array.from({ length: n }).reduce((x, _, i) => affronter(x, 2, apres, 1000 + i), e);

test("les étapes se rangent de la moins effrayante à la plus effrayante", () => {
  const e = escalier(["dormir seul", 3], ["lumière douce", 0], ["porte fermée", 2], ["veilleuse", 1]);
  assert.deepEqual(textes(e), ["lumière douce", "veilleuse", "porte fermée", "dormir seul"]);
});

test("à peur égale, l'ordre d'écriture est gardé", () => {
  const e = escalier(["a", 2], ["b", 2], ["c", 1], ["d", 2]);
  assert.deepEqual(textes(e), ["c", "a", "b", "d"]);
});

test("une étape affrontée compte même si Minus n'a pas rapetissé", () => {
  const e = affronter(escalier(["a", 0], ["b", 1]), 2, 3, 5);
  assert.equal(etapeCourante(e).fois, 1);
  assert.deepEqual(e.traces, [{ t: 5, etape: etapeCourante(e).id, avant: 2, apres: 3 }]);
});

test("changer sa réponse dans le même passage ne compte pas deux fois", () => {
  let e = affronter(escalier(["a", 0], ["b", 1]), 2, 2, 5);
  e = affronter(e, 2, 0, 6, true);
  assert.equal(etapeCourante(e).fois, 1);
  assert.equal(e.traces.length, 1);
  assert.equal(e.traces[0].apres, 0);
});

test(`il ne peut monter qu'après ${FOIS} fois, et c'est lui qui décide`, () => {
  let e = nFois(escalier(["a", 0], ["b", 1]), FOIS - 1);
  assert.equal(peutMonter(e), false);
  assert.equal(monter(e), e);
  e = nFois(e, 1);
  assert.equal(peutMonter(e), true);
  assert.equal(e.ici, 0, "rien ne monte à sa place");
  e = nFois(e, 2);
  assert.equal(etapeCourante(e).fois, FOIS + 2, "il peut refaire son étape autant qu'il veut");
  e = monter(e);
  assert.equal(etapeCourante(e).texte, "b");
});

test("en haut : la dernière étape, affrontée assez de fois ; on ne monte pas plus haut", () => {
  let e = monter(nFois(escalier(["a", 0], ["b", 1]), FOIS));
  assert.equal(enHaut(e), false);
  e = nFois(e, FOIS);
  assert.equal(enHaut(e), true);
  assert.equal(peutMonter(e), false);
  assert.equal(monter(e), e);
});

test("trop dur : une étape plus petite se glisse AVANT la sienne, qui garde ce qu'il a fait", () => {
  let e = monter(nFois(escalier(["a", 0], ["b", 2], ["c", 3]), FOIS));
  e = affronter(e, 3, 3, 9);
  const g = glisserEtape(e);
  assert.equal(g.etapes.length, 4);
  assert.equal(etapeCourante(g).texte, "", "la nouvelle étape est la sienne, à écrire");
  assert.equal(etapeCourante(g).fois, 0);
  assert.deepEqual(g.etapes[2], e.etapes[1], "« b » l'attend, avec sa fois déjà faite");
  const ecrit = ecrireEtape(g, etapeCourante(g).id, "b en plus petit");
  assert.deepEqual(textes(ecrit), ["a", "b en plus petit", "b", "c"]);
});

test("une marche déjà montée ne bouge plus quand on change sa mesure", () => {
  let e = monter(nFois(escalier(["a", 0], ["b", 1], ["c", 2]), FOIS));
  e = mesurerEtape(e, e.etapes[0].id, 3);
  assert.deepEqual(textes(e), ["a", "b", "c"]);
  assert.equal(etapeCourante(e).texte, "b");
});

test("retirer une étape garde l'enfant sur la sienne", () => {
  let e = monter(nFois(escalier(["a", 0], ["b", 1], ["c", 2]), FOIS));
  const sansA = retirerEtape(e, e.etapes[0].id);
  assert.equal(etapeCourante(sansA).texte, "b");
  const sansC = retirerEtape(e, e.etapes[2].id);
  assert.equal(etapeCourante(sansC).texte, "b");
  const sansB = retirerEtape(e, e.etapes[1].id);
  assert.equal(etapeCourante(sansB).texte, "c");
  assert.equal(etapeCourante(retirerEtape(sansB, sansB.etapes[1].id)).texte, "a", "la dernière retirée : il redescend");
});

test("une étape tient sur une ligne : un retour à la ligne devient une espace", () => {
  const e = ajouterEtape(escalierVide());
  assert.equal(ecrireEtape(e, e.etapes[0].id, "la veilleuse,\nporte ouverte").etapes[0].texte, "la veilleuse, porte ouverte");
});

test("les lignes laissées vides ne deviennent pas des marches", () => {
  const e = ajouterEtape(ajouterEtape(escalier(["a", 0])));
  assert.equal(e.etapes.length, 3);
  assert.deepEqual(textes(nettoyer(e)), ["a"]);
  assert.deepEqual(nettoyer(escalierVide()).etapes, []);
});

test(`${MAX_ETAPES} étapes au plus : au-delà, rien ne s'ajoute`, () => {
  let e = escalierVide();
  for (let i = 0; i < MAX_ETAPES + 3; i++) e = ajouterEtape(e);
  assert.equal(e.etapes.length, MAX_ETAPES);
  assert.equal(glisserEtape(e), e);
  assert.equal(new Set(e.etapes.map((x) => x.id)).size, MAX_ETAPES, "chaque étape a son propre numéro");
});

test("la peur et l'objectif sont des textes libres, bornés", () => {
  const e = nommer(nommer(escalierVide(), "peur", "Le noir"), "objectif", "x".repeat(99));
  assert.equal(e.peur, "Le noir");
  assert.equal(e.objectif.length, 40);
  assert.equal(nommer(e, "etapes", "non"), e);
});

test("les traces ne grossissent pas sans fin", () => {
  const e = nFois(escalier(["a", 0]), MAX_TRACES + 5);
  assert.equal(e.traces.length, MAX_TRACES);
});

test("« a-t-il commencé ? » : non sur un escalier neuf, oui dès la première fois", () => {
  const e = escalier(["a", 0], ["b", 1]);
  assert.equal(commence(e), false);
  assert.equal(commence(affronter(e, 1, 1, 1)), true);
});

test("un escalier absent, ancien ou abîmé se lit sans planter", () => {
  for (const v of [undefined, null, 3, "x", [], {}, { etapes: "non" }]) assert.deepEqual(lireEscalier(v), escalierVide());
  const lu = lireEscalier({ peur: 7, etapes: [{ texte: "a", peur: 9, fois: -2 }, null, { id: 4, texte: "b", peur: 1, fois: 2 }], ici: 12 });
  assert.equal(lu.peur, "");
  assert.deepEqual(lu.etapes, [{ id: 1, texte: "a", peur: 3, fois: 0 }, { id: 4, texte: "b", peur: 1, fois: 2 }]);
  assert.equal(lu.ici, 1, "la marche notée n'existe pas : il est sur la dernière");
  assert.equal(lu.suite, 5, "le prochain numéro ne reprend jamais un numéro existant");
});
