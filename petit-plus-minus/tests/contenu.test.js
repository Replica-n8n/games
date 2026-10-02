import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { verifierContenu } from "../js/contenu.js";

const vrai = () => JSON.parse(readFileSync(new URL("../contenu.json", import.meta.url), "utf8"));

test("le vrai contenu.json est valide", () => {
  assert.deepEqual(verifierContenu(vrai()), []);
});

// Chaque casse ressemble à une erreur qu'un parent ou un psychologue peut faire en relisant.
const casses = [
  ["jauge.niveaux", (c) => c.jauge.niveaux.pop()],
  ["jauge.niveaux[1].outils", (c) => { c.jauge.niveaux[1].outils.push("combat"); }],
  ["jauge.niveaux[3].conseil", (c) => { c.jauge.niveaux[3].conseil = ""; }],
  ["outils[2].id", (c) => { c.outils[2].id = "memo"; }],
  ["bougie.tours", (c) => { c.bougie.tours = "3"; }],
  ["robot.parties", (c) => { c.robot.parties = []; }],
  ["bulle.compte", (c) => { c.bulle.compte = "respirations"; }],
  ["chasse.suivant", (c) => { delete c.chasse.suivant; }],
  ["lesPaires.nombre", (c) => { c.lesPaires.nombre = 11; }],
  ["lesPaires.cartePlus", (c) => { c.lesPaires.cartePlus = "Plus répond"; }],
  ["reponds.pensee", (c) => { c.reponds.pensee = "Minus dit"; }],
  ["reponds.nombre", (c) => { c.reponds.nombre = 0; }],
  ["textes.cestFait", (c) => { delete c.textes.cestFait; }],
  ["sos.phrases", (c) => { c.sos.phrases.push("inconnue"); }],
  ["paires[2].phrase", (c) => { c.paires[2].phrase = ""; }],
  ["paires", (c) => { c.paires[1].id = c.paires[0].id; }],
  ["sos.fins.unPeu", (c) => { delete c.sos.fins.unPeu; }],
  ["sos.phraseTitre", (c) => { delete c.sos.phraseTitre; }],
  ["accueil.boutonCalme", (c) => { c.accueil.boutonCalme = "  "; }],
  ["tresors", (c) => { c.tresors = {}; }],
  ["sos.souffle.compte", (c) => { c.sos.souffle.compte = "respirations"; }],
  ["sos.verif.unPeu", (c) => { delete c.sos.verif.unPeu; }],
  ["paires[3].theme", (c) => { c.paires[3].theme = "inventé"; }],
  ["paires[1].phrase", (c) => { c.paires[1].phrase = "x".repeat(67); }],
  ["themes.feu.nomEnfant", (c) => { delete c.themes.feu.nomEnfant; }],
  ["mesMinus.consigne", (c) => { c.mesMinus.consigne = ""; }],
  ["mesMinus.aide", (c) => { c.mesMinus.aide = []; }],
  ["mesMinus.barriereQuestion", (c) => { c.mesMinus.barriereQuestion = "Combien font 7 × 8 ?"; }],
  ["themes.noir.parDefaut", (c) => { c.themes.noir.parDefaut = "oui"; }],
  ["sos.phrases", (c) => { c.sos.phrases.push("monstre"); }],
  ["pas.affronter", (c) => { c.pas.affronter = ""; }],
  ["pas.fait", (c) => { c.pas.fait = "Fait souvent"; }],
  ["pas.bravo.pareil", (c) => { delete c.pas.bravo.pareil; }],
  ["pas.trucs", (c) => { delete c.pas.trucs; }],
  ["pas.construire.conseils", (c) => { c.pas.construire.conseils = [""]; }],
  ["pas.construire.taille", (c) => { c.pas.construire.taille = "Minus"; }],
  ["outils[6].id", (c) => { c.outils[6].id = "escalier"; }],
  ["yoga.consigne", (c) => { c.yoga.consigne = ""; }],
  ["yoga.respirations", (c) => { c.yoga.respirations = 0; }],
  ["yoga.postures[1].id", (c) => { c.yoga.postures[1].id = "lotus"; }],
  ["yoga.postures[4].nom", (c) => { delete c.yoga.postures[4].nom; }],
  ["yoga.postures", (c) => { c.yoga.postures = []; }],
];

for (const [cle, casser] of casses) {
  test(`un contenu cassé dit où : ${cle}`, () => {
    const c = vrai();
    casser(c);
    const erreurs = verifierContenu(c);
    assert.ok(erreurs.length > 0, "aucune erreur signalée");
    assert.ok(erreurs.some((e) => e.startsWith(cle)), `attendu « ${cle} », reçu : ${erreurs.join(" / ")}`);
  });
}

test("un fichier qui n'est pas un objet est refusé sans planter", () => {
  for (const v of [null, [], "texte", 3]) assert.ok(verifierContenu(v).length > 0);
});
