import { test } from "node:test";
import assert from "node:assert/strict";
import { combatDepart, choixDuTour, repondre, combatGagne } from "../js/combat.js";

const PAIRES = [
  { id: "a", pensee: "pa", phrase: "fa" }, { id: "b", pensee: "pb", phrase: "fb" },
  { id: "c", pensee: "pc", phrase: "fc" }, { id: "d", pensee: "pd", phrase: "fd" },
  { id: "e", pensee: "pe", phrase: "fe" },
];
const REGLES = { tailleMinusDepart: 10, forcePlusMax: 12, degatsMeilleurePhrase: 3, degatsAutrePhrase: 1, choixParTour: 3 };
const sansHasard = () => 0;

test("le combat part de la taille de Minus et du bonus d'entraînement", () => {
  const c = combatDepart(PAIRES, REGLES, 2, sansHasard);
  assert.equal(c.minus, 10);
  assert.equal(c.plus, 2);
  assert.equal(c.tour, 1);
  assert.equal(c.ordre.length, 5);
});

test("chaque tour propose 3 phrases, dont la meilleure, toutes différentes", () => {
  const c = combatDepart(PAIRES, REGLES, 1, Math.random);
  for (let k = 0; k < 20; k++) {
    const choix = choixDuTour({ ...c, tour: k + 1 }, Math.random);
    assert.equal(choix.length, 3);
    assert.equal(new Set(choix).size, 3);
    assert.ok(choix.includes(c.ordre[c.pensee]), "la meilleure réponse est proposée");
  }
});

test("la meilleure phrase : super efficace, Minus −3, Plus +3, pensée suivante", () => {
  let c = combatDepart(PAIRES, REGLES, 2, sansHasard);
  const meilleure = c.ordre[c.pensee];
  const r = repondre(c, meilleure, REGLES);
  assert.equal(r.resultat, "super");
  assert.equal(r.combat.minus, 7);
  assert.equal(r.combat.plus, 5);
  assert.equal(r.combat.pensee, 1);
  assert.equal(r.combat.tour, 2);
});

test("une autre phrase aide un peu, jamais de punition, et la même pensée revient", () => {
  let c = combatDepart(PAIRES, REGLES, 2, sansHasard);
  const autre = c.ordre.find((id) => id !== c.ordre[c.pensee]);
  const r = repondre(c, autre, REGLES);
  assert.equal(r.resultat, "autre");
  assert.equal(r.combat.minus, 9);
  assert.equal(r.combat.plus, 3);
  assert.equal(r.combat.pensee, 0, "la même pensée revient");
});

test("Minus ne descend pas sous zéro, Plus ne dépasse pas son maximum", () => {
  let c = { ...combatDepart(PAIRES, REGLES, 4, sansHasard), minus: 1, plus: 11 };
  const r = repondre(c, c.ordre[c.pensee], REGLES);
  assert.equal(r.combat.minus, 0);
  assert.equal(r.combat.plus, 12);
  assert.equal(r.resultat, "gagne");
  assert.equal(combatGagne(r.combat), true);
});

test("4 bonnes réponses suffisent, et les pensées tournent si besoin", () => {
  let c = combatDepart(PAIRES, REGLES, 1, sansHasard);
  let n = 0;
  while (!combatGagne(c) && n < 20) { c = repondre(c, c.ordre[c.pensee], REGLES).combat; n++; }
  assert.equal(n, 4);
  const court = combatDepart(PAIRES.slice(0, 2), REGLES, 1, sansHasard);
  let d = court; for (let k = 0; k < 3; k++) d = repondre(d, d.ordre[d.pensee], REGLES).combat;
  assert.ok(d.pensee < 2, "l'index reste dans la liste");
});

test("une réponse après la victoire, ou inconnue, ne change rien", () => {
  let c = { ...combatDepart(PAIRES, REGLES, 1, sansHasard), minus: 0 };
  assert.equal(repondre(c, "a", REGLES).combat, c);
  const d = combatDepart(PAIRES, REGLES, 1, sansHasard);
  assert.equal(repondre(d, "zzz", REGLES).combat, d);
});

test("les essais sur une même pensée se comptent, et repartent à zéro à la pensée suivante", () => {
  let c = combatDepart(PAIRES, REGLES, 1, sansHasard);
  const autre = c.ordre.find((id) => id !== c.ordre[c.pensee]);
  c = repondre(c, autre, REGLES).combat;
  c = repondre(c, autre, REGLES).combat;
  assert.equal(c.essais, 2);
  c = repondre(c, c.ordre[c.pensee], REGLES).combat;
  assert.equal(c.essais, 0);
});
