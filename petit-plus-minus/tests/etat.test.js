import { test } from "node:test";
import assert from "node:assert/strict";
import { lireEtat, ecrireEtat, CLE } from "../js/etat.js";

function stockage(initial = {}) {
  const d = { ...initial };
  return {
    d,
    getItem: (k) => (k in d ? d[k] : null),
    setItem: (k, v) => { d[k] = String(v); },
    removeItem: (k) => { delete d[k]; },
  };
}

test("la clé est préfixée : d'autres jeux vivent sur la même origine", () => {
  assert.ok(CLE.startsWith("ppm:"));
});

test("rien de stocké : un état neuf", () => {
  const e = lireEtat(stockage());
  assert.equal(e.etoiles, 0);
  assert.equal(e.format, 1);
});

test("écrire puis relire rend la même chose", () => {
  const s = stockage();
  const e = { ...lireEtat(s), etoiles: 12 };
  assert.equal(ecrireEtat(s, e), true);
  assert.equal(lireEtat(s).etoiles, 12);
});

test("les clés des autres apps ne sont pas touchées", () => {
  const s = stockage({ "chevalier:score": "99" });
  ecrireEtat(s, { ...lireEtat(s), etoiles: 3 });
  assert.equal(s.d["chevalier:score"], "99");
  assert.deepEqual(Object.keys(s.d).sort(), ["chevalier:score", CLE].sort());
});

test("des données illisibles donnent un état neuf, sans planter", () => {
  assert.equal(lireEtat(stockage({ [CLE]: "{pas du json" })).etoiles, 0);
  assert.equal(lireEtat(stockage({ [CLE]: "[1,2]" })).etoiles, 0);
});

test("un champ ajouté plus tard est rempli, un champ inconnu est gardé", () => {
  const s = stockage({ [CLE]: JSON.stringify({ format: 1, etoiles: 5, futur: "x" }) });
  const e = lireEtat(s);
  assert.equal(e.etoiles, 5);
  assert.equal(e.futur, "x");
  assert.deepEqual(e.jeuxDuJour, { jour: "", etoiles: 0 });
});

test("un stockage qui refuse (navigation privée, quota) ne fait pas planter", () => {
  const casse = { getItem() { throw new Error("refus"); }, setItem() { throw new Error("quota"); } };
  assert.equal(lireEtat(casse).etoiles, 0);
  assert.equal(ecrireEtat(casse, lireEtat(casse)), false);
  assert.equal(lireEtat(undefined).etoiles, 0);
});
