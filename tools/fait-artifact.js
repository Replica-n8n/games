/* Fabrique echecs/artifact.html depuis echecs/index.html : la même page sans
   les balises d'enveloppe, sans les <link> du manifeste et sans le service
   worker, pour la publier en aperçu. Le fichier est ignoré par git. */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "echecs", "index.html");
const dest = path.join(__dirname, "..", "echecs", "artifact.html");
const s = fs.readFileSync(src, "utf8");

let head = s.slice(s.indexOf("<title>"), s.indexOf("</style>") + "</style>".length);
head = head.replace(/\n<link rel="[^"]+" href="[^"]+">/g, "");

let body = s.slice(s.indexOf("<body>") + "<body>".length, s.indexOf("</body>"));
body = body.replace(/if\("serviceWorker" in navigator[\s\S]*?\n\}\n/, "");

const out = head + "\n" + body.trim() + "\n";
for (const interdit of ["serviceWorker", "manifest"]) {
  if (out.includes(interdit)) throw new Error("il reste « " + interdit + " » dans l'artifact");
}
fs.writeFileSync(dest, out);
console.log("artifact.html reconstruit, " + out.length + " caractères");
