import { chromium, devices } from './node_modules/playwright/index.mjs';
import { servir } from './serveur.mjs';
const site = await servir();
const nav = await chromium.launch();
const ctx = await nav.newContext({ ...devices['Pixel 9'], locale: 'fr-CA' });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('ERREUR ' + e));
await page.goto(site.jeu, { waitUntil: 'networkidle' });
/* --- 1. le cocotier --- */
await page.evaluate(() => { window.jeu.choisirPerso('chevalier'); window.jeu.choisirMonde('ile'); });
await page.evaluate(() => window.jeu.commencer(7));
await page.waitForTimeout(600);
await page.evaluate(() => {
  const p = window.jeu.partie();
  const o = p.obstacles.find(o => Math.hypot(o.x, o.y) < 700);
  p.joueur.x = o.x; p.joueur.y = o.y - o.r * 3;
});
await page.waitForTimeout(300);
await page.screenshot({ path: 'captures/sonde-cocotier.png' });
/* --- 2. le sol du volcan --- */
const p2 = await ctx.newPage();
await p2.goto(site.jeu, { waitUntil: 'networkidle' });
await p2.evaluate(() => { window.jeu.choisirPerso('chevalier'); window.jeu.choisirMonde('volcan'); });
await p2.evaluate(() => window.jeu.commencer(3));
await p2.waitForTimeout(700);
await p2.screenshot({ path: 'captures/sonde-volcan.png' });
await nav.close();
process.exit(0);
