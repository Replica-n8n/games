import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

/* Le code mort, cherche a la machine.

   Trois choses que personne ne lit et qui trainent quand meme : un reglage
   qu'aucune ligne n'utilise, une fonction qu'aucune ligne n'appelle, une
   entree de catalogue oubliee. On les a deja trouvees a la main trois fois
   (l'aimant, les bottes, `normaliser`), donc autant les chercher tout seul. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const JEU = path.join(HERE, "..", "serpentin");

const FICHIERS = ["moteur.js", "armes.js", "bestioles.js", "mondes.js", "meteo.js", "index.html"];
const source = {};
for (const f of FICHIERS) source[f] = fs.readFileSync(path.join(JEU, f), "utf8");
const tout = FICHIERS.map((f) => source[f]).join("\n");

/* combien de fois un mot apparait, hors de sa propre declaration */
function usages(mot) {
  const m = tout.match(new RegExp("\\b" + mot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "g"));
  return m ? m.length : 0;
}

const morts = [];

/* 1. les reglages */
const bloc = source["moteur.js"].slice(
  source["moteur.js"].indexOf("var REGLAGES = {"),
  source["moteur.js"].indexOf("\n  };", source["moteur.js"].indexOf("var REGLAGES = {"))
);
for (const ligne of bloc.split("\n")) {
  const m = ligne.match(/^\s{4}(\w+):/);
  if (!m) continue;
  /* une fois pour la declaration, une fois au moins pour la lecture */
  if (usages(m[1]) < 2) morts.push("REGLAGES." + m[1] + " : declare et jamais lu");
}

/* 2. les fonctions declarees */
for (const f of FICHIERS) {
  const re = /function\s+(\w+)\s*\(/g;
  let m;
  while ((m = re.exec(source[f]))) {
    const nom = m[1];
    if (usages(nom) < 2) morts.push(f + " : function " + nom + " jamais appelee");
  }
}

/* 3. les champs des catalogues d'armes, d'objets et de bestioles */
const catalogues = [
  ["armes.js", /^\s{6}(\w+):/gm, "champ d'arme"],
];
for (const [f, re, quoi] of catalogues) {
  const vus = new Set();
  let m;
  while ((m = re.exec(source[f]))) vus.add(m[1]);
  for (const nom of vus) {
    if (usages(nom) < 2) morts.push(f + " : " + quoi + " `" + nom + "` jamais lu");
  }
}

console.log(morts.length ? "Code mort :" : "Aucun code mort.");
morts.forEach((l) => console.log("  " + l));
process.exit(morts.length ? 1 : 0);
