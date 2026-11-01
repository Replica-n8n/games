import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from './serveur.mjs';
/* La planche des sceaux de sel, figée, en PNG dans docs/ghost-train-da/.
     node tools/mockup-ghost-train-sceaux-2-capture.mjs */
const ICI = path.dirname(fileURLToPath(import.meta.url)), SORTIE = path.join(ICI, '..', 'docs', 'ghost-train-da');
const srv = await servir(), nav = await chromium.launch(), erreurs = [];
const p = await nav.newPage({ viewport: { width: 1400, height: 900 } });
p.on('pageerror', (e) => erreurs.push(e.message));
for (const [t, nom] of [[1.9, 'etoile'], [3.7, 'cercle'], [4.8, 'pris']]) {
  await p.goto(srv.base + 'tools/mockup-ghost-train-sceaux-sel.html?t=' + t);
  await p.waitForFunction(() => document.body.dataset.pret === '1');
  await p.locator('#grille').screenshot({ path: path.join(SORTIE, `sel-${nom}.png`) });
}
await nav.close(); srv.fermer?.();
if (erreurs.length) { console.log('✗', erreurs); process.exit(1); }
console.log('✓'); process.exit(0);
