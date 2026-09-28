import { test } from "node:test";
import assert from "node:assert/strict";
import { nouvellesPaires, toucherPaire, pairesFinies } from "../js/paires.js";
import { repondsDepart, choixReponds, repondre, repondsFini } from "../js/reponds.js";
import { tresorsDepart, toucherTresor, tresorSuivant, tresorsFinis } from "../js/tresors.js";

const PAIRES = [
  { id: "a1", theme: "a" }, { id: "a2", theme: "a" }, { id: "b1", theme: "b" },
  { id: "b2", theme: "b" }, { id: "c1", theme: "c" },
];
const sansHasard = () => 0;

/* ---------- Les paires ---------- */

test("les paires tirent N pensées, toutes visibles des deux côtés", () => {
  const p = nouvellesPaires(PAIRES, 3, Math.random);
  assert.equal(p.ids.length, 3);
  assert.deepEqual([...p.gauche].sort(), [...p.ids].sort());
  assert.deepEqual([...p.droite].sort(), [...p.ids].sort());
});

test("Minus puis la bonne phrase : une paire", () => {
  let p = nouvellesPaires(PAIRES, 3, sansHasard);
  const id = p.ids[0];
  let r = toucherPaire(p, "minus", id);
  assert.equal(r.evenement, "choisi");
  r = toucherPaire(r.paires, "plus", id);
  assert.equal(r.evenement, "paire");
  assert.deepEqual(r.paires.faites, [id]);
  assert.equal(r.paires.choisi, null);
});

test("une mauvaise phrase ne compte pas, la pensée reste choisie", () => {
  const p = nouvellesPaires(PAIRES, 3, sansHasard);
  const r = toucherPaire(toucherPaire(p, "minus", p.ids[0]).paires, "plus", p.ids[1]);
  assert.equal(r.evenement, "rate");
  assert.equal(r.paires.faites.length, 0);
  assert.equal(r.paires.choisi, p.ids[0]);
});

test("une phrase touchée avant une pensée : on le dit", () => {
  const p = nouvellesPaires(PAIRES, 3, sansHasard);
  assert.equal(toucherPaire(p, "plus", p.ids[0]).evenement, "dabord");
});

test("une carte déjà faite, ou inconnue, ne fait rien", () => {
  let p = nouvellesPaires(PAIRES, 3, sansHasard);
  const id = p.ids[0];
  p = toucherPaire(toucherPaire(p, "minus", id).paires, "plus", id).paires;
  assert.equal(toucherPaire(p, "minus", id).paires, p);
  assert.equal(toucherPaire(p, "minus", "zzz").paires, p);
});

test("toutes les paires trouvées : fini", () => {
  let p = nouvellesPaires(PAIRES, 3, Math.random);
  for (const id of p.ids) p = toucherPaire(toucherPaire(p, "minus", id).paires, "plus", id).paires;
  assert.equal(pairesFinies(p), true);
});

/* ---------- Réponds à Minus ---------- */

test("deux phrases : la bonne, et une autre d'un AUTRE thème", () => {
  for (let k = 0; k < 40; k++) {
    const r = repondsDepart(PAIRES, 3, Math.random);
    const choix = choixReponds(r, Math.random);
    const bonne = r.ordre[r.k];
    assert.equal(choix.length, 2);
    assert.ok(choix.includes(bonne));
    const autre = choix.find((id) => id !== bonne);
    assert.notEqual(r.themes[autre], r.themes[bonne], `${bonne} / ${autre}`);
  }
});

test("un seul thème actif : l'autre phrase vient du même thème, faute de mieux", () => {
  const r = repondsDepart([{ id: "x", theme: "t" }, { id: "y", theme: "t" }], 2, sansHasard);
  const choix = choixReponds(r, sansHasard);
  assert.equal(new Set(choix).size, 2);
});

test("la bonne phrase fait avancer ; l'autre ne coûte rien, la pensée reste", () => {
  let r = repondsDepart(PAIRES, 3, sansHasard);
  const bonne = r.ordre[0], autre = r.tous.find((id) => id !== bonne);
  let x = repondre(r, autre);
  assert.equal(x.resultat, "encore");
  assert.equal(x.reponds.k, 0);
  assert.equal(x.reponds.essais, 1);
  x = repondre(x.reponds, bonne);
  assert.equal(x.resultat, "bien");
  assert.equal(x.reponds.k, 1);
  assert.equal(x.reponds.essais, 0);
});

test("après la dernière pensée : fini, et plus rien ne bouge", () => {
  let r = repondsDepart(PAIRES, 3, sansHasard);
  let dernier;
  while (!repondsFini(r)) { dernier = repondre(r, r.ordre[r.k]); r = dernier.reponds; }
  assert.equal(dernier.resultat, "fini");
  assert.equal(repondre(r, r.ordre[0]).reponds, r);
});

/* ---------- Chasse aux trésors ---------- */

const ETAPES = [5, 4, 3, 2, 1];

test("les trésors se trouvent un par un, sans dépasser le nombre de l'étape", () => {
  let t = tresorsDepart();
  for (let k = 0; k < 7; k++) t = toucherTresor(t, ETAPES);
  assert.equal(t.trouves, 5);
});

test("on ne passe à l'étape suivante qu'une fois tous les trésors trouvés", () => {
  let t = toucherTresor(tresorsDepart(), ETAPES);
  assert.equal(tresorSuivant(t, ETAPES), t);
  for (let k = 0; k < 4; k++) t = toucherTresor(t, ETAPES);
  assert.deepEqual(tresorSuivant(t, ETAPES), { etape: 1, trouves: 0 });
});

test("la chasse est finie après la 5e étape (15 trésors)", () => {
  let t = tresorsDepart();
  for (const n of ETAPES) {
    for (let k = 0; k < n; k++) t = toucherTresor(t, ETAPES);
    t = tresorSuivant(t, ETAPES);
  }
  assert.equal(tresorsFinis(t, ETAPES), true);
  assert.equal(toucherTresor(t, ETAPES), t);
});
