import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pairesActives } from "../js/jeu.js";
import { combatDepart, choixDuTour } from "../js/combat.js";

const contenu = JSON.parse(readFileSync(new URL("../contenu.json", import.meta.url), "utf8"));

test("par défaut, seuls les thèmes universels sont actifs", () => {
  const actives = pairesActives(contenu, null);
  const themes = new Set(actives.map((p) => p.theme));
  for (const t of themes) assert.equal(contenu.themes[t].parDefaut, true, t);
  for (const sensible of ["enlevement", "parents", "vomir", "feu", "noir"]) assert.ok(!themes.has(sensible), sensible);
  assert.ok(actives.length >= contenu.jeux.memo.nombrePaires, "assez de paires pour le mémo");
});

test("un parent peut activer un thème précis, et en retirer un", () => {
  const avecNoir = pairesActives(contenu, { noir: true });
  assert.ok(avecNoir.some((p) => p.theme === "noir"));
  const sansEcole = pairesActives(contenu, { ecole: false });
  assert.ok(!sansEcole.some((p) => p.theme === "ecole"));
});

test("les phrases du SOS sont toujours parmi les paires actives par défaut", () => {
  const ids = new Set(pairesActives(contenu, null).map((p) => p.id));
  for (const id of contenu.sos.phrases) assert.ok(ids.has(id), id);
});

const PAIRES = [
  { id: "a1", theme: "a" }, { id: "a2", theme: "a" }, { id: "a3", theme: "a" },
  { id: "b1", theme: "b" }, { id: "b2", theme: "b" }, { id: "c1", theme: "c" },
];
const REGLES = { tailleMinusDepart: 10, forcePlusMax: 12, degatsMeilleurePhrase: 3, degatsAutrePhrase: 1, choixParTour: 3 };

test("au combat, les autres phrases viennent d'abord du même thème", () => {
  for (let k = 0; k < 30; k++) {
    const c = combatDepart(PAIRES, REGLES, 1, Math.random);
    const meilleure = c.ordre[c.pensee];
    const theme = c.themes[meilleure];
    const choix = choixDuTour(c, Math.random, 3);
    const memes = PAIRES.filter((p) => p.theme === theme && p.id !== meilleure).length;
    const autresDuTheme = choix.filter((id) => id !== meilleure && c.themes[id] === theme).length;
    assert.equal(autresDuTheme, Math.min(memes, 2), `${meilleure} : ${choix}`);
  }
});
