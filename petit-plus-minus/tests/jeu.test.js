import { test } from "node:test";
import assert from "node:assert/strict";
import { jourLocal, niveauDe, bonusCombat, gagnerEtoiles, etatVide, noterMeteo, MAX_METEO } from "../js/jeu.js";

const LIMITES = { etoilesMaxParJourJeux: 4, etoilesParNiveau: 10 };
const midi = (j) => new Date(2026, 8, j, 12, 0, 0).getTime();

test("le jour est le jour LOCAL, pas celui de l'UTC", () => {
  assert.equal(jourLocal(new Date(2026, 8, 25, 23, 59).getTime()), "2026-09-25");
  assert.equal(jourLocal(new Date(2026, 8, 26, 0, 1).getTime()), "2026-09-26");
  assert.equal(jourLocal(new Date(2026, 0, 5, 8, 0).getTime()), "2026-01-05");
});

test("niveau 1 au départ, 10 étoiles par niveau", () => {
  assert.deepEqual(niveauDe(0, 10), { niveau: 1, dansNiveau: 0, parNiveau: 10 });
  assert.deepEqual(niveauDe(9, 10), { niveau: 1, dansNiveau: 9, parNiveau: 10 });
  assert.deepEqual(niveauDe(10, 10), { niveau: 2, dansNiveau: 0, parNiveau: 10 });
  assert.deepEqual(niveauDe(37, 10), { niveau: 4, dansNiveau: 7, parNiveau: 10 });
});

test("bonus de combat = niveau, plafonné", () => {
  assert.equal(bonusCombat(1, 4), 1);
  assert.equal(bonusCombat(4, 4), 4);
  assert.equal(bonusCombat(9, 4), 4);
});

test("les étoiles des jeux s'arrêtent au plafond du jour", () => {
  let e = etatVide();
  let r = gagnerEtoiles(e, 2, "jeu", midi(25), LIMITES);
  assert.equal(r.gagnees, 2); assert.equal(r.plafondAtteint, false);
  r = gagnerEtoiles(r.etat, 1, "jeu", midi(25), LIMITES);
  r = gagnerEtoiles(r.etat, 2, "jeu", midi(25), LIMITES);
  assert.equal(r.gagnees, 1, "seule 1 étoile restait sous le plafond de 4");
  assert.equal(r.plafondAtteint, true);
  assert.equal(r.etat.etoiles, 4);
  r = gagnerEtoiles(r.etat, 1, "jeu", midi(25), LIMITES);
  assert.equal(r.gagnees, 0);
  assert.equal(r.etat.etoiles, 4);
});

test("le plafond repart à zéro le lendemain, même app restée ouverte", () => {
  let r = gagnerEtoiles(etatVide(), 4, "jeu", new Date(2026, 8, 25, 23, 58).getTime(), LIMITES);
  assert.equal(r.plafondAtteint, true);
  r = gagnerEtoiles(r.etat, 1, "jeu", new Date(2026, 8, 26, 0, 2).getTime(), LIMITES);
  assert.equal(r.gagnees, 1);
  assert.equal(r.etat.etoiles, 5);
});

test("les missions de la vraie vie ne comptent pas dans le plafond", () => {
  let r = gagnerEtoiles(etatVide(), 4, "jeu", midi(25), LIMITES);
  r = gagnerEtoiles(r.etat, 3, "mission", midi(25), LIMITES);
  assert.equal(r.gagnees, 3);
  assert.equal(r.etat.etoiles, 7);
  r = gagnerEtoiles(r.etat, 1, "jeu", midi(25), LIMITES);
  assert.equal(r.gagnees, 0, "une mission ne rouvre pas le plafond des jeux");
});

test("gagner des étoiles ne modifie pas l'état reçu", () => {
  const e = etatVide();
  const copie = JSON.stringify(e);
  gagnerEtoiles(e, 2, "jeu", midi(25), LIMITES);
  assert.equal(JSON.stringify(e), copie);
});

test("une quantité absurde ne fait rien", () => {
  for (const n of [0, -2, 1.5, NaN, "3"]) {
    const r = gagnerEtoiles(etatVide(), n, "jeu", midi(25), LIMITES);
    assert.equal(r.gagnees, 0, String(n));
  }
});

test("la météo est notée avec son instant, sans toucher à l'état reçu", () => {
  const e = etatVide();
  const n = noterMeteo(e, "enorme", midi(25));
  assert.deepEqual(n.meteo, [{ t: midi(25), niveau: "enorme" }]);
  assert.deepEqual(e.meteo, []);
  assert.equal(n.etoiles, e.etoiles);
});

test("l'historique de la météo garde les plus récentes, sans grossir sans fin", () => {
  let e = etatVide();
  for (let i = 0; i < MAX_METEO + 5; i++) e = noterMeteo(e, "petit", i);
  assert.equal(e.meteo.length, MAX_METEO);
  assert.equal(e.meteo[0].t, 5);
  assert.equal(e.meteo.at(-1).t, MAX_METEO + 4);
});

test("un état ancien sans météo reçoit quand même la sienne", () => {
  const ancien = { format: 1, etoiles: 3, jeuxDuJour: { jour: "", etoiles: 0 } };
  assert.equal(noterMeteo(ancien, "moyen", 1).meteo.length, 1);
});
