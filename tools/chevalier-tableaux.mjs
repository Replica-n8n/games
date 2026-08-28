import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

/* Le tableau des armes, ecrit dans le README depuis le code.

   « Epee niveau 3 » ne veut rien dire tant qu'on ne sait pas ce que le
   niveau 3 change. Ce tableau sort des donnees de armes.js, donc il ne peut
   pas mentir ni vieillir : on le regenere, on ne le retape pas. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const Armes = require(path.join(HERE, "..", "serpentin", "armes.js"));

const ETIQUETTE = {
  degats: "dégâts", recharge: "délai (s)", portee: "portée",
  arc: "largeur (rad)", duree: "durée (s)", nombre: "nombre",
  rayon: "rayon", vitesse: "rotation", taille: "taille",
  perce: "traverse", repos: "repos (s)",
};

let sortie = "";
for (const nom of Object.keys(Armes.CATALOGUE)) {
  const def = Armes.CATALOGUE[nom];
  const lignes = Armes.progression(nom);
  const cles = Object.keys(lignes[0]).filter((c) => c !== "niveau");
  const bougent = cles.filter((c) => lignes[0][c] !== lignes[lignes.length - 1][c]);
  const fixes = cles.filter((c) => !bougent.includes(c));

  sortie += `#### ${def.nom} ${def.emoji}\n\n`;
  sortie += `| Niveau | ${bougent.map((c) => ETIQUETTE[c] || c).join(" | ")} |\n`;
  sortie += `|---|${bougent.map(() => "---").join("|")}|\n`;
  for (const l of lignes) {
    sortie += `| ${l.niveau} | ${bougent.map((c) => l[c]).join(" | ")} |\n`;
  }
  if (fixes.length) {
    sortie += `\nNe bouge pas : ${fixes.map((c) => (ETIQUETTE[c] || c) + " " + lignes[0][c]).join(", ")}.\n`;
  }
  sortie += "\n";
}

sortie += "#### Les objets\n\n| Objet | Par niveau |\n|---|---|\n";
for (const nom of Object.keys(Armes.OBJETS)) {
  const o = Armes.OBJETS[nom];
  const pas = o.plat ? `+${o.pas} à plat` : `+${Math.round(o.pas * 100)} %`;
  sortie += `| ${o.emoji} **${o.nom}** | ${pas} · ${o.dit} |\n`;
}

const README = path.join(HERE, "..", "README.md");
const texte = fs.readFileSync(README, "utf8");
const DEBUT = "<!-- tableaux des armes : engendre par tools/chevalier-tableaux.mjs -->";
const FIN = "<!-- fin des tableaux -->";
const bloc = DEBUT + "\n\n" + sortie + FIN;

let neuf;
if (texte.includes(DEBUT)) {
  neuf = texte.slice(0, texte.indexOf(DEBUT)) + bloc + texte.slice(texte.indexOf(FIN) + FIN.length);
} else {
  neuf = texte.replace("### Régler en jouant", "### Ce que chaque niveau change\n\n" + bloc + "\n### Régler en jouant");
}
fs.writeFileSync(README, neuf);
console.log("README a jour : " + (sortie.match(/\n/g) || []).length + " lignes de tableau");
