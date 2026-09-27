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
  ["meteo.niveaux", (c) => c.meteo.niveaux.pop()],
  ["meteo.niveaux[1].mode", (c) => { c.meteo.niveaux[1].mode = "combat"; }],
  ["sos.phrases", (c) => { c.sos.phrases.push("inconnue"); }],
  ["paires[2].phrase", (c) => { c.paires[2].phrase = ""; }],
  ["paires", (c) => { c.paires[1].id = c.paires[0].id; }],
  ["combat.degatsMeilleurePhrase", (c) => { c.combat.degatsMeilleurePhrase = "3"; }],
  ["combat.choixParTour", (c) => { c.combat.choixParTour = 11; }],
  ["combat.messages.debut", (c) => { c.combat.messages.debut = "Petit Plus arrive !"; }],
  ["sos.fins.unPeu", (c) => { delete c.sos.fins.unPeu; }],
  ["limites.etoilesParNiveau", (c) => { delete c.limites.etoilesParNiveau; }],
  ["accueil.boutonCalme", (c) => { c.accueil.boutonCalme = "  "; }],
  ["tresors", (c) => { c.tresors = {}; }],
  ["sos.souffle.compte", (c) => { c.sos.souffle.compte = "respirations"; }],
  ["sos.verif.unPeu", (c) => { delete c.sos.verif.unPeu; }],
  ["meteo.boutonSos", (c) => { c.meteo.boutonSos = ""; }],
  ["accueil.boutonPartir", (c) => { delete c.accueil.boutonPartir; }],
  ["jeux.memo.paire", (c) => { c.jeux.memo.paire = "Paire trouvée !"; }],
  ["jeux.memo.nombrePaires", (c) => { c.jeux.memo.nombrePaires = 11; }],
  ["paires[3].theme", (c) => { c.paires[3].theme = "inventé"; }],
  ["paires[1].phrase", (c) => { c.paires[1].phrase = "x".repeat(67); }],
  ["themes.feu.nomEnfant", (c) => { delete c.themes.feu.nomEnfant; }],
  ["mesMinus.consigne", (c) => { c.mesMinus.consigne = ""; }],
  ["themes.noir.parDefaut", (c) => { c.themes.noir.parDefaut = "oui"; }],
  ["sos.phrases", (c) => { c.sos.phrases.push("monstre"); }],
  ["jeux.tresors.suivant", (c) => { delete c.jeux.tresors.suivant; }],
  ["combat.ecran.tailles", (c) => { c.combat.ecran.tailles.pop(); }],
  ["combat.victoire.titre", (c) => { c.combat.victoire.titre = ""; }],
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
