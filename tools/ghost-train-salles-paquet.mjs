// Assemble la maquette « les salles » (modules ES de tools/poc/salles/, plus les
// dessins, la police et les sons de ghost-train/) en UN fichier, pour la publier en
// page privée et y jouer sur téléphone. Tiré de patrouille-paquet.mjs.
//   node tools/ghost-train-salles-paquet.mjs  →  tools/poc/ghost-train-salles.html
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
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
charger('tools/poc/salles/jeu.js');

const html = readFileSync(path.join(RACINE, 'tools/poc/salles/index.html'), 'utf8');
const corps = html.slice(html.indexOf('<body>') + 6, html.indexOf('<script type="module"'));
const style = html.slice(html.indexOf('<style>') + 7, html.indexOf('</style>'));
const sortie = `<title>Essai des salles</title>
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
__req('tools/poc/salles/jeu.js');
</script>
`;
const fichier = path.join(ICI, 'poc', 'ghost-train-salles.html');
writeFileSync(fichier, sortie);
console.log(`✓ ${modules.size} modules assemblés dans tools/poc/ghost-train-salles.html (${Math.round(sortie.length / 1024)} Ko)`);
