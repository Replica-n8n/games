import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from './serveur.mjs';

/* Planche d'un étage de Ghostel (ses trois salles, au repos et en alerte) :
     node tools/ghost-train-etage-planche.mjs biblio   →  docs/ghost-train-etage-biblio.png */
const etage = process.argv[2] || 'rdc';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const srv = await servir();
const nav = await chromium.launch();
const p = await nav.newPage({ viewport: { width: 1400, height: 1300 } });
const err = [];
p.on('pageerror', (e) => err.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); });
await p.goto(srv.base + `tools/mockup-ghost-train-etage.html?etage=${etage}`);
await p.waitForSelector('body[data-pret]', { timeout: 20000 }).catch(() => err.push('jamais prête'));
await p.locator('#planche').screenshot({ path: path.join(ICI, '..', 'docs', `ghost-train-etage-${etage}.png`) });
await nav.close();
srv.arreter();
console.log(err.length ? '✗ ' + err.join(' | ') : `✓ docs/ghost-train-etage-${etage}.png`);
