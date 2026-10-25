// Assemble le jeu (modules ES de patrouille/) en UN fichier, pour le publier en page
// privée et y jouer sur téléphone pendant la construction. Ne sert pas à la prod :
// GitHub Pages sert les modules tels quels.
//   node tools/patrouille-paquet.mjs  →  tools/poc/patrouille-jeu.html
// Règles que le code du jeu respecte pour être assemblable : imports sur une ligne
// « import { a, b as c } from './x.js'; », exports en « export function / export const ».
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..', 'patrouille');
const modules = new Map();

function charger(rel) {
  if (modules.has(rel)) return;
  let code = readFileSync(path.join(RACINE, rel), 'utf8').replace(/\r\n/g, '\n');
  const deps = [];
  code = code.replace(/^import\s*\{([^}]+)\}\s*from\s*'([^']+)';[ \t]*$/gm, (_, noms, src) => {
    const cible = path.posix.normalize(path.posix.join(path.posix.dirname(rel), src));
    deps.push(cible);
    const liste = noms.split(',').map((n) => n.trim()).filter(Boolean).map((n) => n.replace(/\s+as\s+/, ': ')).join(', ');
    return `const { ${liste} } = __req(${JSON.stringify(cible)});`;
  });
  if (/^\s*import\s/m.test(code)) throw new Error(`${rel} : import non pris en charge`);
  const exports = [];
  code = code.replace(/^export\s+(function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm, (_, mot, nom) => { exports.push(nom); return `${mot} ${nom}`; });
  if (/^\s*export\s/m.test(code)) throw new Error(`${rel} : export non pris en charge`);
  modules.set(rel, `__def(${JSON.stringify(rel)}, function (__req) {\n${code}\nreturn { ${exports.join(', ')} };\n});`);
  for (const d of deps) charger(d);
}
charger('jeu.js');

const html = readFileSync(path.join(RACINE, 'index.html'), 'utf8');
const corps = html.slice(html.indexOf('<!--corps-->') + 12, html.indexOf('<!--/corps-->'));
const style = readFileSync(path.join(RACINE, 'style.css'), 'utf8');
const sortie = `<title>Star Patrol</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${style}
</style>
${corps}
<script>
'use strict';
const __defs = new Map(), __faits = new Map();
function __def(nom, f) { __defs.set(nom, f); }
function __req(nom) {
  if (!__faits.has(nom)) { if (!__defs.has(nom)) throw new Error('module absent : ' + nom); __faits.set(nom, {}); __faits.set(nom, __defs.get(nom)(__req)); }
  return __faits.get(nom);
}
${[...modules.values()].join('\n')}
__req('jeu.js');
</script>
`;
const fichier = path.join(ICI, 'poc', 'patrouille-jeu.html');
writeFileSync(fichier, sortie);
console.log(`✓ ${modules.size} modules assemblés dans tools/poc/patrouille-jeu.html (${Math.round(sortie.length / 1024)} Ko)`);
