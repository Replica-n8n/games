/* Fabrique echecs/artifact.html depuis echecs/index.html : la même page sans
   les balises d'enveloppe, sans les <link> du manifeste et sans le service
   worker, pour la publier en aperçu. Le fichier produit est ignoré par git.

   Le bloc à retirer est délimité dans index.html par les marqueurs
   @artifact-retirer-debut et @artifact-retirer-fin : pas de découpage devinant
   les accolades, et pas de piège de fin de ligne. */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "echecs", "index.html");
const dest = path.join(__dirname, "..", "echecs", "artifact.html");
const s = fs.readFileSync(src, "utf8");

let head = s.slice(s.indexOf("<title>"), s.indexOf("</style>") + "</style>".length);
head = head.replace(/[ \t]*\r?\n<link [^>]*>/g, "");

let body = s.slice(s.indexOf("<body>") + "<body>".length, s.indexOf("</body>"));
const debut = body.indexOf("/* @artifact-retirer-debut */");
const fin = body.indexOf("/* @artifact-retirer-fin */");
if (debut < 0 || fin < 0) throw new Error("marqueurs @artifact-retirer introuvables dans index.html");
body = body.slice(0, debut) + body.slice(fin + "/* @artifact-retirer-fin */".length);

const out = head + "\n" + body.trim() + "\n";
for (const interdit of ["serviceWorker", "manifest"]) {
  if (out.includes(interdit)) throw new Error("il reste « " + interdit + " » dans l'artifact");
}
fs.writeFileSync(dest, out);
console.log("artifact.html reconstruit, " + out.length + " caractères");
