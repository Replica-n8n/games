/* Fabrique echecs/artifact.html depuis echecs/index.html : la même page sans
   les balises d'enveloppe, sans les <link> du manifeste, sans le service
   worker, et avec les deux moteurs recopiés à l'intérieur, puisqu'un artifact
   est une page seule qui ne peut rien charger à côté d'elle.
   Le fichier produit est ignoré par git.

   Le bloc à retirer est délimité dans index.html par les marqueurs
   @artifact-retirer-debut et @artifact-retirer-fin : pas de découpage devinant
   les accolades, et pas de piège de fin de ligne. */
const fs = require("fs");
const path = require("path");

const dossier = path.join(__dirname, "..", "echecs");
const s = fs.readFileSync(path.join(dossier, "index.html"), "utf8");

let head = s.slice(s.indexOf("<title>"), s.indexOf("</style>") + "</style>".length);
head = head.replace(/[ \t]*\r?\n<link [^>]*>/g, "");

let body = s.slice(s.indexOf("<body>") + "<body>".length, s.indexOf("</body>"));

const debut = body.indexOf("/* @artifact-retirer-debut */");
const fin = body.indexOf("/* @artifact-retirer-fin */");
if (debut < 0 || fin < 0) throw new Error("marqueurs @artifact-retirer introuvables dans index.html");
body = body.slice(0, debut) + body.slice(fin + "/* @artifact-retirer-fin */".length);

body = body.replace(/<script src="\.\/([^"]+)"><\/script>/g, (_, f) =>
  "<script>\n/* " + f + " */\n" + fs.readFileSync(path.join(dossier, f), "utf8") + "\n</script>");
if (/<script src=/.test(body)) throw new Error("un <script src> n'a pas été recopié");

const out = head + "\n" + body.trim() + "\n";
for (const interdit of ["serviceWorker", "manifest"]) {
  if (out.includes(interdit)) throw new Error("il reste « " + interdit + " » dans l'artifact");
}
fs.writeFileSync(path.join(dossier, "artifact.html"), out);
console.log("artifact.html reconstruit, " + out.length + " caractères");
