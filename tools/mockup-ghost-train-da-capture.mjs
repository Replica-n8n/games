import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from './serveur.mjs';
/* La planche « sceaux et pêche », figée à quelques instants, en PNG dans docs/ghost-train-da/.
     node tools/mockup-ghost-train-da-capture.mjs */
const ICI = path.dirname(fileURLToPath(import.meta.url)), SORTIE = path.join(ICI, '..', 'docs', 'ghost-train-da');
mkdirSync(SORTIE, { recursive: true });
const srv = await servir(), nav = await chromium.launch(), erreurs = [];
const p = await nav.newPage({ viewport: { width: 1400, height: 900 } });
p.on('pageerror', (e) => erreurs.push(e.message));
for (const [t, nom] of [[1.9, 'trace'], [2.95, 'reussi'], [0.7, 'dehors'], [3.0, 'dedans'], [4.4, 'elan']]) {
  await p.goto(srv.base + 'tools/mockup-ghost-train-da-sceaux-peche.html?t=' + t);
  await p.waitForFunction(() => document.body.dataset.pret === '1');
  const id = ['trace', 'reussi'].includes(nom) ? '#sceaux' : '#peche';
  await p.locator(id).screenshot({ path: path.join(SORTIE, `${id.slice(1)}-${nom}.png`) });
}
await nav.close(); srv.fermer?.();
if (erreurs.length) { console.log('✗', erreurs); process.exit(1); }
console.log('✓ captures dans docs/ghost-train-da/'); process.exit(0);
