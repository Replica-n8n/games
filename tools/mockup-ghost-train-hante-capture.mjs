import { chromium } from 'playwright';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { servir } from './serveur.mjs';
/* L'hôtel hanté : les moments figés en PNG dans docs/ghost-train-da/hante-*.png.
     node tools/mockup-ghost-train-hante-capture.mjs */
const ICI = path.dirname(fileURLToPath(import.meta.url)), SORTIE = path.join(ICI, '..', 'docs', 'ghost-train-da');
mkdirSync(SORTIE, { recursive: true });
const srv = await servir(), nav = await chromium.launch(), erreurs = [];
const p = await nav.newPage({ viewport: { width: 1000, height: 900 } });
p.on('pageerror', (e) => erreurs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
await p.goto(srv.base + 'tools/mockup-ghost-train-hante.html?t=3');
await p.waitForFunction(() => document.body.dataset.pret === '1');
await p.waitForTimeout(300);
const cartes = p.locator('#moments .carte');
for (let i = 0; i < await cartes.count(); i++) await cartes.nth(i).locator('canvas').screenshot({ path: path.join(SORTIE, `hante-${i + 1}.png`) });
await p.locator('#moments').screenshot({ path: path.join(SORTIE, 'hante-planche.png') });
await nav.close(); srv.fermer?.();
if (erreurs.length) { console.log('✗', erreurs); process.exit(1); }
console.log('✓'); process.exit(0);
