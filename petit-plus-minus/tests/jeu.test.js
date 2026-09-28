import { test } from "node:test";
import assert from "node:assert/strict";
import { etatVide, noterMeteo, MAX_METEO, noterSos, MAX_SOS, melanger } from "../js/jeu.js";

const midi = new Date(2026, 8, 25, 12, 0, 0).getTime();
const MIN = 60 * 1000;

test("un état neuf : ni étoiles ni niveaux, seulement ce qu'on note", () => {
  assert.deepEqual(etatVide(), { format: 1, meteo: [], themes: {}, sos: [] });
});

test("la jauge est notée avec son instant, sans toucher à l'état reçu", () => {
  const e = etatVide();
  const n = noterMeteo(e, "enorme", midi);
  assert.deepEqual(n.meteo, [{ t: midi, niveau: "enorme" }]);
  assert.deepEqual(e.meteo, []);
});

test("changer d'avis dans les 10 minutes remplace la note, après elle s'ajoute", () => {
  let e = noterMeteo(etatVide(), "petit", midi);
  e = noterMeteo(e, "enorme", midi + 2 * MIN);
  assert.deepEqual(e.meteo.map((x) => x.niveau), ["enorme"]);
  e = noterMeteo(e, "moyen", midi + 30 * MIN);
  assert.deepEqual(e.meteo.map((x) => x.niveau), ["enorme", "moyen"]);
});

test("l'historique de la jauge garde les plus récentes, sans grossir sans fin", () => {
  let e = etatVide();
  const pas = 11 * MIN;
  for (let i = 0; i < MAX_METEO + 5; i++) e = noterMeteo(e, "petit", i * pas);
  assert.equal(e.meteo.length, MAX_METEO);
  assert.equal(e.meteo[0].t, 5 * pas);
});

test("un état ancien, avec des étoiles et sans météo, se lit encore", () => {
  const ancien = { format: 1, etoiles: 3, jeuxDuJour: { jour: "", etoiles: 0 } };
  assert.equal(noterMeteo(ancien, "moyen", 1).meteo.length, 1);
});

test("le SOS garde une trace discrète : d'où il vient, et la réponse de l'enfant", () => {
  const e = noterSos(etatVide(), "calme", "unPeu", midi);
  assert.deepEqual(e.sos, [{ t: midi, depuis: "calme", reponse: "unPeu" }]);
  let f = etatVide();
  for (let i = 0; i < MAX_SOS + 3; i++) f = noterSos(f, "calme", "oui", i);
  assert.equal(f.sos.length, MAX_SOS);
});

test("une réponse changée dans le même SOS remplace la trace, elle ne s'ajoute pas", () => {
  let e = noterSos(etatVide(), "calme", "oui", midi);
  e = noterSos(e, "calme", "non", midi + 5000, true);
  assert.equal(e.sos.length, 1);
  assert.equal(e.sos[0].reponse, "non");
  e = noterSos(e, "calme", "unPeu", midi + 9000);
  assert.equal(e.sos.length, 2);
});

test("mélanger garde tous les éléments, et un hasard fixe donne un ordre fixe", () => {
  const l = [1, 2, 3, 4, 5];
  assert.deepEqual(melanger(l, Math.random).sort(), l);
  assert.deepEqual(melanger(l, () => 0), melanger(l, () => 0));
  assert.deepEqual(l, [1, 2, 3, 4, 5], "la liste reçue n'est pas touchée");
});
