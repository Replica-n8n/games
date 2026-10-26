import { chromium } from 'playwright';
import { servir } from './serveur.mjs';

/* Maquette « les salles » : capture une salle seule, sans le jeu.
     node tools/ghost-train-salles-voir.mjs salon "&alerte&ouvert" sortie.png */
const [, , salle = 'salon', extra = '', sortie = 'salle.png'] = process.argv;
const srv = await servir();
const nav = await chromium.launch();
const p = await nav.newPage({ viewport: { width: 1280, height: 720 } });
const err = [];
p.on('pageerror', (e) => err.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); });
await p.goto(srv.base + `tools/poc/salles/voir.html?salle=${salle}${extra}`);
await p.waitForSelector('body[data-pret]', { timeout: 15000 }).catch(() => err.push('jamais prête'));
await p.locator('canvas').screenshot({ path: sortie });
await nav.close();
srv.arreter();
console.log(err.length ? '✗ ' + err.join(' | ') : '✓ ' + sortie);
