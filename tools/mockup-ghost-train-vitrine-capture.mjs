import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from './serveur.mjs';
/* La vitrine (rayons, pièges, viseurs), figée, en PNG dans docs/ghost-train-da/.
     node tools/mockup-ghost-train-vitrine-capture.mjs */
const ICI = path.dirname(fileURLToPath(import.meta.url)), SORTIE = path.join(ICI, '..', 'docs', 'ghost-train-da');
const srv = await servir(), nav = await chromium.launch(), erreurs = [];
const p = await nav.newPage({ viewport: { width: 1400, height: 900 } });
p.on('pageerror', (e) => erreurs.push(e.message));
for (const [t, id] of [[0.95, 'rayons'], [0.8, 'pieges'], [2.0, 'viseurs'], [0.6, 'viseurs-blanc']]) {
  await p.goto(srv.base + 'tools/mockup-ghost-train-vitrine.html?t=' + t);
  await p.waitForFunction(() => document.body.dataset.pret === '1');
  await p.locator('#' + id.split('-')[0]).screenshot({ path: path.join(SORTIE, `vitrine-${id}.png`) });
}
await nav.close(); srv.fermer?.();
if (erreurs.length) { console.log('✗', erreurs); process.exit(1); }
console.log('✓'); process.exit(0);
