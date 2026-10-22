// Maquette jouable du décor de la Jungle : greffe tools/poc/decor-jungle.js dans le jeu
// assemblé (tools/poc/patrouille-jeu.html, à refaire avec patrouille-paquet.mjs), à la
// place de fond() et feuillage() de rendu.js. Puis photographie la même mission, aux
// mêmes instants, avant et après la greffe.
//   node tools/patrouille-decor.mjs [dossier-des-captures]
//   →  tools/poc/patrouille-decor.html (jouable) + avant-*.png / apres-*.png
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const POC = path.join(ICI, 'poc');
const sortieCaptures = process.argv[2] || POC;
const jeu = readFileSync(path.join(POC, 'patrouille-jeu.html'), 'utf8');
const decor = readFileSync(path.join(POC, 'decor-jungle.js'), 'utf8');

// Le bloc à remplacer : de « function fond(ctx, p) { » jusqu'à « function ennemi( » (rendu.js)
const debut = jeu.indexOf('function fond(ctx, p) {'), fin = jeu.indexOf('function ennemi(', debut);
if (debut < 0 || fin < 0) throw new Error('fond() ou ennemi() introuvable dans le jeu assemblé');
const greffe = jeu.slice(0, debut) + decor + '\n' + jeu.slice(fin);
const fichier = path.join(POC, 'patrouille-decor.html');
writeFileSync(fichier, greffe.replace('<title>Star Patrol</title>', '<title>Star Patrol, décor de la Jungle</title>'));
console.log('✓ maquette jouable : tools/poc/patrouille-decor.html');

const INSTANTS = [12, 50, 95]; // secondes de la mission
const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
for (const [nom, f] of [['avant', path.join(POC, 'patrouille-jeu.html')], ['apres', fichier]]) {
  const p = await nav.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2 });
  const erreurs = []; p.on('pageerror', (e) => erreurs.push(e.message));
  await p.goto(pathToFileURL(f).href); await p.waitForTimeout(300);
  await p.evaluate(() => { window.__patrouille.opt.invincible = true; window.__patrouille.lancer('j3'); });
  let fait = 0;
  for (const s of INSTANTS) {
    await p.evaluate((n) => { for (let k = 0; k < n; k++) window.__patrouille.pasJeu(); }, (s - fait) * 60); fait = s;
    await p.waitForTimeout(120);
    await p.screenshot({ path: path.join(sortieCaptures, `${nom}-${s}s.png`) });
  }
  // images par seconde sur 3 s de jeu réel (avec la carte graphique)
  const ips = await p.evaluate(() => new Promise((ok) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else ok(Math.round(n / 3)); }; requestAnimationFrame(f); }));
  console.log(`${nom} : ${ips} images/s${erreurs.length ? ' · erreurs : ' + erreurs.join(' | ') : ''}`);
  await p.close();
}
await nav.close();
