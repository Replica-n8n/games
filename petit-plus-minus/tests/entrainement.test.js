import { test } from "node:test";
import assert from "node:assert/strict";
import { etatVide, recompenser } from "../js/jeu.js";
import { nouveauMemo, toucherCarte, refermer, memoGagne } from "../js/memo.js";
import { tresorsDepart, toucherTresor, tresorSuivant, tresorsFinis } from "../js/tresors.js";

const LIMITES = { etoilesMaxParJourJeux: 4, etoilesParNiveau: 10 };
const midi = new Date(2026, 8, 25, 12).getTime();

/* ---------- Récompense ---------- */

test("une récompense dit combien d'étoiles, et si Petit Plus change de niveau", () => {
  let r = recompenser({ ...etatVide(), etoiles: 9 }, 1, midi, LIMITES);
  assert.equal(r.gagnees, 1);
  assert.equal(r.niveauAvant, 1);
  assert.equal(r.niveauApres, 2);
  r = recompenser(etatVide(), 2, midi, LIMITES);
  assert.equal(r.niveauApres, 1);
});

test("au plafond du jour, la récompense est zéro et le dit", () => {
  let r = recompenser(etatVide(), 4, midi, LIMITES);
  assert.equal(r.plafondAtteint, true);
  r = recompenser(r.etat, 1, midi, LIMITES);
  assert.equal(r.gagnees, 0);
  assert.equal(r.plafondAtteint, true);
  assert.equal(r.niveauAvant, r.niveauApres);
});

/* ---------- Mémo ---------- */

const PAIRES = [
  { id: "a", pensee: "pa", phrase: "fa" }, { id: "b", pensee: "pb", phrase: "fb" },
  { id: "c", pensee: "pc", phrase: "fc" }, { id: "d", pensee: "pd", phrase: "fd" },
  { id: "e", pensee: "pe", phrase: "fe" },
];
// Un hasard prévisible : toujours 0 → aucun mélange, les cartes restent dans l'ordre.
const sansHasard = () => 0;
const indices = (m, id) => m.cartes.map((c, i) => (c.paire === id ? i : -1)).filter((i) => i >= 0);

test("un mémo tire N paires, chacune en deux cartes (pensée de Minus, phrase de Plus)", () => {
  const m = nouveauMemo(PAIRES, 4, Math.random);
  assert.equal(m.cartes.length, 8);
  const parPaire = {};
  for (const c of m.cartes) (parPaire[c.paire] ||= []).push(c.sorte);
  assert.equal(Object.keys(parPaire).length, 4);
  for (const s of Object.values(parPaire)) assert.deepEqual(s.sort(), ["minus", "plus"]);
});

test("deux cartes de la même paire restent ouvertes et comptent", () => {
  let m = nouveauMemo(PAIRES, 4, sansHasard);
  const [i, j] = indices(m, m.cartes[0].paire);
  let r = toucherCarte(m, i);
  assert.equal(r.evenement, "ouverte");
  r = toucherCarte(r.memo, j);
  assert.equal(r.evenement, "paire");
  assert.equal(r.paire, m.cartes[i].paire);
  assert.deepEqual(r.memo.ouvertes, []);
  assert.equal(r.memo.trouvees.length, 1);
});

test("deux cartes différentes se verrouillent, puis se referment", () => {
  let m = nouveauMemo(PAIRES, 4, sansHasard);
  const i = 0, j = m.cartes.findIndex((c) => c.paire !== m.cartes[0].paire);
  let r = toucherCarte(toucherCarte(m, i).memo, j);
  assert.equal(r.evenement, "rate");
  assert.equal(r.memo.verrou, true);
  assert.equal(toucherCarte(r.memo, 3).memo, r.memo, "rien ne bouge pendant le verrou");
  const ferme = refermer(r.memo);
  assert.deepEqual(ferme.ouvertes, []);
  assert.equal(ferme.verrou, false);
});

test("toucher une carte déjà ouverte ou trouvée ne fait rien (double appui)", () => {
  let m = nouveauMemo(PAIRES, 4, sansHasard);
  const r1 = toucherCarte(m, 0);
  assert.equal(toucherCarte(r1.memo, 0).memo, r1.memo);
  const [i, j] = indices(m, m.cartes[0].paire);
  const r2 = toucherCarte(toucherCarte(m, i).memo, j);
  assert.equal(toucherCarte(r2.memo, i).memo, r2.memo);
});

test("le mémo est gagné quand toutes les paires sont trouvées", () => {
  let m = nouveauMemo(PAIRES, 4, sansHasard);
  for (const id of [...new Set(m.cartes.map((c) => c.paire))]) {
    const [i, j] = indices(m, id);
    m = toucherCarte(toucherCarte(m, i).memo, j).memo;
  }
  assert.equal(memoGagne(m), true);
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
  t = tresorSuivant(t, ETAPES);
  assert.deepEqual(t, { etape: 1, trouves: 0 });
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
