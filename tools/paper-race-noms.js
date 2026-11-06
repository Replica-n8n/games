// Les scripts de Paper Race sont des scripts CLASSIQUES : ils partagent leurs noms
// globaux, et quand deux fichiers déclarent la même fonction, le DERNIER chargé gagne
// sans rien dire. Vécu en 1.11.0 : scene.js déclarait drapeau() (les petits drapeaux
// au vent), ui.js avait déjà drapeau() (le grand drapeau d'arrivée) ; chaque petit
// drapeau relançait l'arrivée, à chaque image : 8 images/s au lieu de 60.
//   node tools/paper-race-noms.js     (échoue si un nom est déclaré deux fois)
const fs = require('fs'), path = require('path');
const dossier = path.join(__dirname, '..', 'paper-race');
const page = fs.readFileSync(path.join(dossier, 'index.html'), 'utf8');
const scripts = [...page.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const vus = new Map(), doublons = [];
for (const f of scripts) {
  const src = fs.readFileSync(path.join(dossier, f), 'utf8');
  for (const m of src.matchAll(/^(?:async\s+)?(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let|var|class)\s+([A-Za-z_$][\w$]*))/gm)) {
    const n = m[1] || m[2];
    if (vus.has(n) && vus.get(n) !== f) doublons.push(`${n} : ${vus.get(n)} et ${f}`);
    else vus.set(n, f);
  }
}
if (doublons.length) { console.error('NOMS EN DOUBLE (le dernier script chargé gagne) :\n  ' + doublons.join('\n  ')); process.exit(1); }
console.log(`NOMS OK : ${vus.size} noms globaux, ${scripts.length} scripts, aucun en double`);
