import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pairesActives, choisirTheme, etatVide } from "../js/jeu.js";

const contenu = JSON.parse(readFileSync(new URL("../contenu.json", import.meta.url), "utf8"));

test("par défaut, seuls les thèmes universels sont actifs", () => {
  const actives = pairesActives(contenu, null);
  const themes = new Set(actives.map((p) => p.theme));
  for (const t of themes) assert.equal(contenu.themes[t].parDefaut, true, t);
  for (const sensible of ["enlevement", "parents", "vomir", "feu", "noir"]) assert.ok(!themes.has(sensible), sensible);
  assert.ok(actives.length >= contenu.lesPaires.nombre, "assez de paires pour les paires");
  assert.ok(actives.length >= contenu.reponds.nombre, "assez de pensées pour Réponds à Minus");
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

test("choisir un thème l'allume, le refuser l'éteint, sans toucher au reste", () => {
  let e = etatVide();
  e = choisirTheme(e, "noir", true);
  assert.ok(pairesActives(contenu, e.themes).some((p) => p.theme === "noir"));
  e = choisirTheme(e, "noir", false);
  assert.ok(!pairesActives(contenu, e.themes).some((p) => p.theme === "noir"));
  assert.deepEqual(e.meteo, []);
  assert.deepEqual(etatVide().themes, {});
});
