import { chromium } from 'playwright';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { servir } from './serveur.mjs';
/* La boutique de l'hôtel (trois emplacements, ouverte et fermée, puis dedans), figée,
   en PNG dans docs/ghost-train-da/.   node tools/mockup-ghost-train-boutique-capture.mjs */
const ICI = path.dirname(fileURLToPath(import.meta.url)), SORTIE = path.join(ICI, '..', 'docs', 'ghost-train-da');
mkdirSync(SORTIE, { recursive: true });
const srv = await servir(), nav = await chromium.launch(), erreurs = [];
const p = await nav.newPage({ viewport: { width: 1000, height: 900 } });
p.on('pageerror', (e) => erreurs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
await p.goto(srv.base + 'tools/mockup-ghost-train-boutique.html?t=1.1');
await p.waitForFunction(() => document.body.dataset.pret === '1');
await p.waitForTimeout(300);
for (const id of ['dir-a', 'dir-b', 'dir-c', 'dedans']) await p.locator('#' + id).screenshot({ path: path.join(SORTIE, `boutique-${id.replace('dir-', '')}.png`) });
await nav.close(); srv.fermer?.();
if (erreurs.length) { console.log('✗', erreurs); process.exit(1); }
console.log('✓'); process.exit(0);
