import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from './serveur.mjs';

/* L'hôtel hanté dans le vrai jeu (carte graphique allumée) : l'écran titre et le plan en
   pleine nuit, puis à l'éclair (normal, et adouci par les flashs réduits) ; images/s du plan.
   Captures dans docs/ghost-train-hante/.   node tools/ghost-train-hante-ui.mjs */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, '..', 'docs', 'ghost-train-hante');
mkdirSync(SORTIE, { recursive: true });
const srv = await servir();
const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await nav.newPage({ viewport: { width: 960, height: 540 }, hasTouch: true, isMobile: true });
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
const capture = (nom) => p.locator('#toile').screenshot({ path: path.join(SORTIE, nom + '.png') });
// attendre un moment de l'orage : d secondes après l'éclair (à 1/20 s près)
const apresEclair = (d) => p.waitForFunction((d) => { const x = (window.__essais.t + 6) % 12; return x >= d && x < d + 0.05; }, d, { timeout: 30000, polling: 'raf' });

async function ouvrir(reglages) {
  await p.goto(srv.base + 'ghost-train/?banc=' + Date.now());
  await p.evaluate((r) => { localStorage.setItem('ghost-train:sauvegarde', JSON.stringify({ v: 2, pieces: 320, missions: { rdc: { faite: true, note: 'A' } }, carnet: {} })); localStorage.setItem('ghost-train:reglages', JSON.stringify(r)); }, reglages);
  await p.reload();
  await p.waitForFunction(() => window.__essais && window.__essais.ecran === 'titre');
}
await ouvrir({ flashsReduits: false });
await apresEclair(3); await capture('1-titre-nuit');
await apresEclair(0.3); await capture('2-titre-eclair');
await p.locator('#zones [data-id="jouer"]').tap();
await apresEclair(2); await capture('3-plan-nuit');
await apresEclair(0.27); await capture('4-plan-eclair');
await apresEclair(0.5); await capture('5-plan-yeux');
// images/s du plan pendant un orage
const ips = await p.evaluate(() => new Promise((ok) => { let n = 0, pire = 0, av = performance.now(); const t0 = av; const f = (m) => { pire = Math.max(pire, m - av); av = m; if (++n < 240) requestAnimationFrame(f); else ok({ ips: n / ((m - t0) / 1000), pire }); }; requestAnimationFrame(f); }));
console.log(`images/s du plan : ${ips.ips.toFixed(1)}, pire image ${ips.pire.toFixed(0)} ms`);
if (ips.ips < 50) erreurs.push('le plan rame : ' + ips.ips.toFixed(1) + ' images/s');
await ouvrir({ flashsReduits: true });
await p.locator('#zones [data-id="jouer"]').tap();
await apresEclair(0.1); await capture('6-plan-eclair-doux');
await nav.close(); srv.fermer?.();
if (erreurs.length) { console.log('✗', erreurs); process.exit(1); }
console.log('✓ captures dans docs/ghost-train-hante/');
process.exit(0);
