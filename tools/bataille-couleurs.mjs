import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/* Les couleurs des trois directions de La Bataille, CALCULÉES et jamais choisies
   à l'œil : chaque rôle est un ton (0 = noir, 100 = blanc) d'une teinte tirée du
   sujet (feutre, bois, laiton, nuit, encres du tarot de Marseille). Le script
   mesure ensuite chaque paire texte/fond et échoue sous 4,5:1 (3:1 pour le gros
   texte et les formes). Sortie : mockup-bataille-palette.js, lu par la maquette.
   Les cartes à jouer gardent leurs couleurs d'objet (celles du POC). */

const ICI = path.dirname(fileURLToPath(import.meta.url));
/* index.js de la bibliothèque ne se charge pas sous Node (imports sans extension) : on prend les deux modules utiles. */
const lib = path.join(ICI, "..", "..", "petits-plus", "node_modules", "@material", "material-color-utilities");
const { TonalPalette } = await import(pathToFileURL(path.join(lib, "palettes", "tonal_palette.js")).href);
const { argbFromHex, hexFromArgb } = await import(pathToFileURL(path.join(lib, "utils", "string_utils.js")).href);

const teinte = (hex) => TonalPalette.fromInt(argbFromHex(hex));
const G = { feutre: teinte("#1b5a3d"), bois: teinte("#5a3420"), laiton: teinte("#e6b450"), nuit: teinte("#1a2466"),
  maudit: teinte("#8a62c8"), papier: teinte("#e8d6a8"), rouge: teinte("#c8362b"), bleu: teinte("#2c5aa0"), jaune: teinte("#e8b830"), aurore: teinte("#2aa6a0") };
const t = (nom, ton) => hexFromArgb(G[nom].tone(ton));

const DIRECTIONS = {
  tapis: { nom: "Le tapis",
    ciel1: t("nuit", 7), ciel2: t("nuit", 24), texte: t("laiton", 95), texte2: t("nuit", 86),
    tapis: t("feutre", 34), tapis2: t("feutre", 22), marque: t("feutre", 88),
    bande: t("bois", 16), surface: t("bois", 20), surface2: t("bois", 10), surTexte: t("laiton", 92),
    accent: t("laiton", 76), surAccent: t("bois", 8), moi: t("laiton", 76), lui: t("maudit", 72), moiPlein: t("laiton", 76), luiPlein: t("maudit", 55), choix: t("laiton", 80),
    papier: t("papier", 90), encre: t("bois", 6), encre2: t("bois", 30) },
  lame: { nom: "La lame",
    ciel1: t("bleu", 18), ciel2: t("bleu", 26), texte: t("papier", 95), texte2: t("jaune", 85),
    tapis: t("bleu", 36), tapis2: t("bleu", 28), marque: t("papier", 92),
    bande: t("papier", 90), surface: t("papier", 90), surface2: t("papier", 82), surTexte: t("bois", 6),
    accent: t("rouge", 44), surAccent: t("papier", 98), moi: t("jaune", 40), lui: t("maudit", 42), moiPlein: t("jaune", 78), luiPlein: t("maudit", 55), choix: t("jaune", 85),
    papier: t("papier", 95), encre: t("bois", 6), encre2: t("bois", 30) },
  nuit: { nom: "Nuit claire",
    ciel1: t("nuit", 5), ciel2: t("nuit", 20), texte: t("nuit", 96), texte2: t("nuit", 84),
    tapis: t("nuit", 16), tapis2: t("nuit", 10), marque: t("nuit", 90), lueur: t("aurore", 50),
    bande: t("nuit", 14), surface: t("nuit", 14), surface2: t("nuit", 9), surTexte: t("nuit", 95),
    accent: t("laiton", 84), surAccent: t("nuit", 8), moi: t("laiton", 84), lui: t("maudit", 76), moiPlein: t("laiton", 84), luiPlein: t("maudit", 60), choix: t("laiton", 88),
    papier: t("nuit", 22), encre: t("nuit", 96), encre2: t("nuit", 82) },
};

/* texte, fond, seuil : ce que la maquette pose réellement l'un sur l'autre. */
const PAIRES = [
  ["texte", "ciel2", 4.5], ["texte2", "ciel2", 4.5], ["surTexte", "surface", 4.5], ["surTexte", "bande", 4.5],
  ["surAccent", "accent", 4.5], ["moi", "bande", 3], ["lui", "bande", 3], ["encre", "papier", 4.5], ["encre2", "papier", 4.5],
  ["marque", "tapis", 4.5], ["accent", "surface", 3], ["choix", "tapis", 3],
];
const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const rates = [];
for (const [cle, d] of Object.entries(DIRECTIONS)) for (const [a, b, seuil] of PAIRES) {
  const c = contraste(d[a], d[b]);
  if (c < seuil) rates.push(`${cle} : ${a} ${d[a]} sur ${b} ${d[b]} = ${c.toFixed(2)} (il faut ${seuil})`);
}
fs.writeFileSync(path.join(ICI, "mockup-bataille-palette.js"),
  "/* Écrit par tools/bataille-couleurs.mjs : ne pas modifier à la main. */\nwindow.PALETTE = " + JSON.stringify(DIRECTIONS, null, 1) + ";\n");
console.log(rates.length ? "CONTRASTES INSUFFISANTS\n" + rates.join("\n") : "bataille-couleurs : toutes les paires passent");
process.exit(rates.length ? 1 : 0);
