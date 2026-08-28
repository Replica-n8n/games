import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

/* Les tableaux des armes et des objets, ecrits dans le README depuis le code.

   « Epee niveau 3 » ne veut rien dire tant qu'on ne sait pas ce que le
   niveau 3 change, et « +12 % de zone » encore moins. Ces tableaux sortent des
   donnees de armes.js, donc ils ne peuvent ni mentir ni vieillir : on les
   regenere, on ne les retape pas. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
require(path.join(HERE, "..", "serpentin", "bestioles.js"));
/* moteur.js d'abord : les tableaux d'objets citent ses valeurs de reference */
require(path.join(HERE, "..", "serpentin", "moteur.js"));
const Armes = require(path.join(HERE, "..", "serpentin", "armes.js"));

const ETIQUETTE = {
  degats: "dégâts", recharge: "délai (s)", portee: "portée",
  arc: "largeur (rad)", duree: "durée (s)", nombre: "nombre",
  rayon: "rayon", vitesse: "rotation", taille: "taille",
  perce: "traverse", repos: "repos (s)",
};

const lignes = [];

lignes.push("**Les armes.** Quatre emplacements, six niveaux chacune.");
lignes.push("");

for (const nom of Object.keys(Armes.CATALOGUE)) {
  const def = Armes.CATALOGUE[nom];
  const table = Armes.progression(nom);
  const cles = Object.keys(table[0]).filter((c) => c !== "niveau");
  const bougent = cles.filter((c) => table[0][c] !== table[table.length - 1][c]);
  const fixes = cles.filter((c) => !bougent.includes(c));

  lignes.push(`#### ${def.nom} ${def.emoji}`);
  lignes.push("");
  lignes.push(def.dit + ".");
  lignes.push("");
  lignes.push(`| Niveau | ${bougent.map((c) => ETIQUETTE[c] || c).join(" | ")} |`);
  lignes.push(`|---|${bougent.map(() => "---").join("|")}|`);
  for (const l of table) {
    lignes.push(`| ${l.niveau} | ${bougent.map((c) => l[c]).join(" | ")} |`);
  }
  if (fixes.length) {
    lignes.push("");
    lignes.push(
      "Ne bouge pas : " +
        fixes.map((c) => (ETIQUETTE[c] || c) + " " + table[0][c]).join(", ") + "."
    );
  }
  lignes.push("");
}

lignes.push("**Les objets.** Quatre emplacements, cinq niveaux chacun.");
lignes.push("");

for (const nom of Object.keys(Armes.OBJETS)) {
  const o = Armes.OBJETS[nom];
  lignes.push(`#### ${o.nom} ${o.emoji}`);
  lignes.push("");
  lignes.push("| Niveau | Effet | Ce que ça donne |");
  lignes.push("|---|---|---|");
  for (const l of Armes.progressionObjet(nom)) {
    lignes.push(`| ${l.niveau} | ${l.effet} | ${l.concret} |`);
  }
  lignes.push("");
}

const DEBUT = "<!-- tableaux des armes : engendre par tools/chevalier-tableaux.mjs -->";
const FIN = "<!-- fin des tableaux -->";
const bloc = DEBUT + "\n\n" + lignes.join("\n") + FIN + "\n";

const README = path.join(HERE, "..", "README.md");
const texte = fs.readFileSync(README, "utf8");
let neuf;
if (texte.includes(DEBUT)) {
  neuf = texte.slice(0, texte.indexOf(DEBUT)) + bloc + texte.slice(texte.indexOf(FIN) + FIN.length + 1);
} else {
  neuf = texte.replace(
    "### Régler en jouant",
    "### Ce que chaque niveau change\n\n" + bloc + "\n### Régler en jouant"
  );
}
fs.writeFileSync(README, neuf);

console.log(
  "README a jour : " +
    Object.keys(Armes.CATALOGUE).length + " armes et " +
    Object.keys(Armes.OBJETS).length + " objets, " +
    lignes.length + " lignes"
);
