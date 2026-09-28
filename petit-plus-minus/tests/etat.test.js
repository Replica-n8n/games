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
  assert.deepEqual(e.meteo, []);
  assert.equal(e.format, 1);
});

test("écrire puis relire rend la même chose", () => {
  const s = stockage();
  const e = { ...lireEtat(s), themes: { noir: true } };
  assert.equal(ecrireEtat(s, e), true);
  assert.equal(lireEtat(s).themes.noir, true);
});

test("les clés des autres apps ne sont pas touchées", () => {
  const s = stockage({ "chevalier:score": "99" });
  ecrireEtat(s, { ...lireEtat(s), themes: { noir: true } });
  assert.equal(s.d["chevalier:score"], "99");
  assert.deepEqual(Object.keys(s.d).sort(), ["chevalier:score", CLE].sort());
});

test("des données illisibles donnent un état neuf, sans planter", () => {
  assert.deepEqual(lireEtat(stockage({ [CLE]: "{pas du json" })).meteo, []);
  assert.deepEqual(lireEtat(stockage({ [CLE]: "[1,2]" })).meteo, []);
});

test("un champ ajouté plus tard est rempli, un champ inconnu est gardé", () => {
  const s = stockage({ [CLE]: JSON.stringify({ format: 1, etoiles: 5, futur: "x" }) });
  const e = lireEtat(s);
  assert.equal(e.etoiles, 5, "un champ d'une ancienne version est gardé");
  assert.equal(e.futur, "x");
  assert.deepEqual(e.sos, []);
});

test("un stockage qui refuse (navigation privée, quota) ne fait pas planter", () => {
  const casse = { getItem() { throw new Error("refus"); }, setItem() { throw new Error("quota"); } };
  assert.deepEqual(lireEtat(casse).meteo, []);
  assert.equal(ecrireEtat(casse, lireEtat(casse)), false);
  assert.deepEqual(lireEtat(undefined).meteo, []);
});
