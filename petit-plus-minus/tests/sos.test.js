import { test } from "node:test";
import assert from "node:assert/strict";
import { sosDepart, sosSuivant, remplir } from "../js/sos.js";

const avancer = (e, ...actions) => actions.reduce((s, a) => sosSuivant(s, a), e);

test("le SOS commence par respirer, aucune respiration faite", () => {
  assert.deepEqual(sosDepart(3), { etape: "souffle", souffles: 0, total: 3, phrase: null, reponse: null });
});

test("les respirations se comptent (au rythme de la bulle) sans dépasser le total", () => {
  let e = avancer(sosDepart(3), { type: "respiration" }, { type: "respiration" });
  assert.equal(e.souffles, 2);
  e = avancer(e, { type: "respiration" }, { type: "respiration" });
  assert.equal(e.souffles, 3, "la bulle continue, le compte s'arrête à 3");
  assert.equal(e.etape, "souffle", "c'est l'enfant qui décide de continuer");
});

test("on ne continue qu'après toutes les respirations", () => {
  let e = avancer(sosDepart(3), { type: "respiration" }, { type: "respiration" });
  assert.equal(sosSuivant(e, { type: "suite" }), e);
  e = avancer(e, { type: "respiration" }, { type: "suite" });
  assert.equal(e.etape, "choix");
});

test("le parcours complet : phrase, la dire, la réponse", () => {
  let e = avancer(sosDepart(3), ...Array(3).fill({ type: "respiration" }), { type: "suite" });
  e = sosSuivant(e, { type: "phrase", id: "danger" });
  assert.equal(e.etape, "dire"); assert.equal(e.phrase, "danger");
  e = sosSuivant(e, { type: "dite" });
  assert.equal(e.etape, "verif");
  e = sosSuivant(e, { type: "reponse", valeur: "unPeu" });
  assert.equal(e.etape, "fin"); assert.equal(e.reponse, "unPeu");
});

test("refaire un souffle doux repart de la respiration", () => {
  let e = avancer(sosDepart(3), ...Array(3).fill({ type: "respiration" }), { type: "suite" },
    { type: "phrase", id: "danger" }, { type: "dite" }, { type: "reponse", valeur: "non" });
  e = sosSuivant(e, { type: "refaire" });
  assert.deepEqual(e, sosDepart(3));
});

test("une action qui ne correspond pas à l'étape ne change rien (double appui, vieux clic)", () => {
  const e = sosDepart(3);
  assert.equal(sosSuivant(e, { type: "dite" }), e);
  assert.equal(sosSuivant(e, { type: "phrase", id: "x" }), e);
  const fin = avancer(e, ...Array(3).fill({ type: "respiration" }), { type: "suite" }, { type: "phrase", id: "a" }, { type: "dite" }, { type: "reponse", valeur: "oui" });
  assert.equal(sosSuivant(fin, { type: "respiration" }), fin);
  assert.equal(sosSuivant(avancer(e, ...Array(3).fill({ type: "respiration" }), { type: "suite" }, { type: "phrase", id: "a" }, { type: "dite" }), { type: "reponse", valeur: "peut-etre" }).etape, "verif");
});

test("remplir remplace les {clés} et laisse le reste", () => {
  assert.equal(remplir("{n} respirations sur {total}", { n: 2, total: 3 }), "2 respirations sur 3");
  assert.equal(remplir("rien à remplacer", { n: 1 }), "rien à remplacer");
  assert.equal(remplir("{inconnu} reste", {}), "{inconnu} reste");
});
