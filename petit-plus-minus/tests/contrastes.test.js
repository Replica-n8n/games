import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Recalcule, depuis les variables de css/jeu.css, les paires de docs/DESIGN.md.
   Texte : 4,5:1. Objet (bord, étoile, bulle) et bouton en gros texte : 3:1. */

const css = readFileSync(new URL("../css/jeu.css", import.meta.url), "utf8");
const racine = css.slice(css.indexOf(":root{"), css.indexOf("}", css.indexOf(":root{")));
const v = Object.fromEntries([...racine.matchAll(/--([\w-]+):(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]));
v.blanc = "#FFFFFF";

const lum = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  .reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0);
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const paires = [
  ["encre", "creme", 4.5, "texte principal"],
  ["encre2", "creme", 4.5, "texte secondaire"],
  ["encre2", "blanc", 4.5, "sous-titres des cartes"],
  ["titre", "creme", 4.5, "surtitre"],
  ["plus", "blanc", 4.5, "nom de Petit Plus"],
  ["minus-f", "blanc", 4.5, "nom de Petit Minus"],
  ["minus-f", "creme", 4.5, "sous-titre de l'accueil"],
  ["plus-f", "plus-fond", 4.5, "message calme"],
  ["sos-t", "sos-fond", 4.5, "texte du SOS"],
  ["sos-t2", "sos-fond", 4.5, "consignes du SOS"],
  ["sos-t", "blanc", 4.5, "mot de la bulle"],
  ["orange-o", "erreur-fond", 4.5, "panne de contenu"],
  ["blanc", "orange", 3, "bouton orange (gros texte)"],
  ["blanc", "sos", 3, "bouton SOS (gros texte)"],
  ["blanc", "plus", 3, "bouton vert (gros texte)"],
  ["etoile-c", "creme", 3, "contour de l'étoile"],
  ["carte-bord", "blanc", 3, "bord d'une carte non choisie"],
  ["bulle-bord", "sos-fond", 3, "bord de la bulle"],
  ["bulle-bord", "bulle", 3, "bord de la bulle sur son fond"],
  ["bulle-souffle-bord", "plus-fond", 3, "bord de la bulle du Souffle magique"],
  ["bulle-souffle-bord", "bulle-souffle", 3, "bord de la bulle du Souffle sur son fond"],
  ["plus-f", "plus-fond", 4.5, "textes du Souffle magique"],
  ["tresor-t", "tresor-fond", 4.5, "textes de la chasse aux trésors"],
  ["tresor-t2", "tresor-fond", 4.5, "aide de la chasse aux trésors"],
  ["tresor", "blanc", 4.5, "carte et gemmes de la chasse aux trésors"],
  ["memo-t", "memo-fond", 4.5, "titre du mémo"],
  ["blanc", "memo", 3, "étoile au dos des cartes du mémo"],
  ["minus-f", "arene", 4.5, "carte « Minus dit »"],
  ["orange-o", "badge", 4.5, "texte de la récompense"],
  ["etoile-c", "badge", 3, "contour de l'étoile sur son badge"],
  ["memo", "blanc", 4.5, "carte du mémo"],
];

for (const [t, f, seuil, usage] of paires) {
  test(`${usage} : ${t} sur ${f} ≥ ${seuil}:1`, () => {
    assert.ok(v[t] && v[f], `variable absente : ${!v[t] ? t : f}`);
    const r = ratio(v[t], v[f]);
    assert.ok(r >= seuil, `${r.toFixed(2)}:1`);
  });
}
