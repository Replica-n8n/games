import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

/* Principe 6 : tout le texte destiné à l'enfant vit dans contenu.json, pour qu'un
   parent ou un psychologue le relise sans toucher au code. On cherche donc, dans js/,
   les chaînes qui ressemblent à une phrase française (deux mots, une lettre).
   Exceptions voulues : contenu.js (messages d'erreur pour l'ADULTE qui relit le
   fichier) et demo.js (atelier, hors du jeu). */

const EXCEPTIONS = new Set(["contenu.js", "demo.js"]);
const dossier = new URL("../js/", import.meta.url);

test("aucune phrase pour l'enfant écrite dans js/", () => {
  const trouvees = [];
  for (const f of readdirSync(dossier)) {
    if (!f.endsWith(".js") || EXCEPTIONS.has(f)) continue;
    const code = readFileSync(new URL(f, dossier), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    for (const m of code.matchAll(/(["'`])((?:\\.|(?!\1).)*)\1/g)) {
      // Les balises d'un dessin SVG (« <circle cx=… ») ne sont pas du texte : on retire ce
      // qui est ENTRE chevrons, et on continue de chercher une phrase dans ce qui reste.
      const s = m[2].replace(/<[^<>]*>/g, "");
      // Une liste de classes CSS (« btn btn-sos ») : minuscules sans accent, un trait d'union.
      if (/^[a-z][a-z0-9-]*( [a-z][a-z0-9-]*)*$/.test(s.trim()) && s.includes("-")) continue;
      if (/[a-zA-ZÀ-ÿ]{2,}[\s’'][a-zA-ZÀ-ÿ]{2,}/.test(s) && !/^[\w.\-\/:?=&" ]*\s(format|image\/svg\+xml)/.test(s))
        trouvees.push(f + " : " + s);
    }
  }
  assert.deepEqual(trouvees, []);
});
