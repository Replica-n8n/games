import { chromium } from 'playwright';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { servir } from './serveur.mjs';
/* Les fantômes « à la Luigi's Mansion » : une image par idée (carte entière, texte compris)
   dans docs/ghost-train-da/mansion-*.png.
     node tools/mockup-ghost-train-mansion-capture.mjs */
const ICI = path.dirname(fileURLToPath(import.meta.url)), SORTIE = path.join(ICI, '..', 'docs', 'ghost-train-da');
mkdirSync(SORTIE, { recursive: true });
const srv = await servir(), nav = await chromium.launch(), erreurs = [];
const p = await nav.newPage({ viewport: { width: 480, height: 900 }, deviceScaleFactor: 2 });
p.on('pageerror', (e) => erreurs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
const MOMENTS = [
  { equipe: 1.5, surpris: 1.5, fouille: 3.6, rare: 2.0 },
  { equipe: 5.8, surpris: 4.0, fouille: 4.8, rare: 4.8 },
];
for (const [k, m] of MOMENTS.entries()) {
  await p.goto(srv.base + 'tools/mockup-ghost-train-mansion.html?t=0&' + new URLSearchParams(Object.entries(m).map(([a, b]) => [a, String(b)])));
  await p.waitForFunction(() => document.body.dataset.pret === '1');
  await p.waitForTimeout(200);
  for (const id of Object.keys(m)) {
    const carte = p.locator(`.carte[data-id="${id}"]`);
    if (k === 0) await carte.screenshot({ path: path.join(SORTIE, `mansion-${id}.png`) });
    else await carte.locator('canvas.scene').screenshot({ path: path.join(SORTIE, `mansion-${id}-2.png`) });
  }
}
await nav.close(); srv.fermer?.();
if (erreurs.length) { console.log('✗', erreurs); process.exit(1); }
console.log('✓'); process.exit(0);
