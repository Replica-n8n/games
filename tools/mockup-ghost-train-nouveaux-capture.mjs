import { chromium } from 'playwright';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { servir } from './serveur.mjs';
/* Les nouveaux fantômes : planche et moments figés en PNG dans docs/ghost-train-da/nouveaux-*.png.
     node tools/mockup-ghost-train-nouveaux-capture.mjs */
const ICI = path.dirname(fileURLToPath(import.meta.url)), SORTIE = path.join(ICI, '..', 'docs', 'ghost-train-da');
mkdirSync(SORTIE, { recursive: true });
const srv = await servir(), nav = await chromium.launch(), erreurs = [];
const p = await nav.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 1 });
p.on('pageerror', (e) => erreurs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
// deux moments par fantôme : le piège, puis la bonne façon de l'attraper
const MOMENTS = [
  { groom: 2.4, papillon: 2.4, couple: 1.0, danseuse: 2.4, poupee: 2.2, malle: 2.0 },
  { groom: 4.4, papillon: 5.0, couple: 0.47, danseuse: 2.9, poupee: 5.6, malle: 4.4 },
];
for (const [k, m] of MOMENTS.entries()) {
  await p.goto(srv.base + 'tools/mockup-ghost-train-nouveaux.html?t=0&' + new URLSearchParams(Object.entries(m).map(([a, b]) => [a, String(b)])));
  await p.waitForFunction(() => document.body.dataset.pret === '1');
  await p.waitForTimeout(200);
  const cartes = p.locator('#scenes .carte');
  for (let i = 0; i < await cartes.count(); i++) await cartes.nth(i).locator('canvas').screenshot({ path: path.join(SORTIE, `nouveaux-${Object.keys(m)[i]}-${k + 1}.png`) });
}
await p.locator('#planche').screenshot({ path: path.join(SORTIE, 'nouveaux-planche.png') });
await p.locator('#melange').screenshot({ path: path.join(SORTIE, 'nouveaux-melange.png') });
await nav.close(); srv.fermer?.();
if (erreurs.length) { console.log('✗', erreurs); process.exit(1); }
console.log('✓'); process.exit(0);
