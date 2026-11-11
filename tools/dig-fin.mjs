// DIG : la fin de chaîne (le grand retour, puis la ville vivante), sans rejouer les quatre fouilles.
// node tools/dig-fin.mjs
import { fileURLToPath } from 'node:url';
const { chromium, devices } = await import('file:///C:/Users/Julie/Claude - projet 1/vie/trophees-de-vie/node_modules/playwright/index.mjs');
const ici = fileURLToPath(new URL('..', import.meta.url)).split(String.fromCharCode(92)).join('/');
const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const p = await (await nav.newContext({ ...devices['Pixel 7'], viewport: { width: 412, height: 860 } })).newPage();
const err = []; p.on('pageerror', (e) => err.push(e.stack));
const photo = (n) => p.screenshot({ path: ici + 'tools/captures/dig/' + n + '.png' });
const ips = () => p.evaluate(() => new Promise((r) => { let n = 0, d = performance.now(); const f = (x) => { n++; if (x - d < 2000) requestAnimationFrame(f); else r(Math.round(n / 2)); }; requestAnimationFrame(f); }));
await p.goto('file:///' + ici + 'dig/index.html'); await p.waitForTimeout(1500);
await p.evaluate(() => { lancer(3); document.getElementById('go').click(); document.getElementById('indice').hidden = true; for (const e of [...M.values()]) if (e.t === 'sol' && e.y >= 1) retirer(e); verifierDecouvertes(); majHud(); document.getElementById('sortir').click(); });
await p.waitForFunction(() => phase === 'lavage', null, { timeout: 30000 });
await p.evaluate(() => terminer()); await p.waitForTimeout(2000); await photo('fin-0-carte');
console.log('bouton', await p.evaluate(() => document.getElementById('suite').textContent));
await p.click('#suite');
await p.click('#ouvrirEtagere').catch(() => {}); console.log('étagère pendant le retour', await p.evaluate(() => document.getElementById('etagere').hidden ? 'fermée OK' : 'OUVERTE ECHEC'));
for (const [n, ms] of [['1', 1200], ['2', 2600], ['3', 2000], ['4', 1800], ['5', 2600], ['6', 2500]]) { await p.waitForTimeout(ms); await photo('fin-retour-' + n); }
await p.waitForFunction(() => phase === 'vivante', null, { timeout: 20000 }); await p.waitForTimeout(4200); await photo('fin-vivante-1');
console.log('ville vivante : images/s', await ips(), await p.evaluate(() => ({ fenetres: vie.fenPos.length, flotte: vie.flotte.length, soir })));
await p.evaluate(() => { az = 0.2; el = 0.5; distVoulue = distBase * 0.5; }); await p.waitForTimeout(1500); await photo('fin-vivante-2');
await p.evaluate(() => { az = 2.4; el = 0.45; }); await p.waitForTimeout(600); await photo('fin-vivante-3');
// la vitrine reste de jour, et le soir revient en la quittant
await p.click('#retour'); await p.waitForTimeout(500); await p.evaluate(() => document.querySelector('.case[data-i="3"]').click()); await p.waitForTimeout(900);
console.log('vitrine : soir =', await p.evaluate(() => soir), '(attendu 0)'); await photo('fin-vitrine');
await p.click('#retour'); await p.waitForTimeout(300); await p.evaluate(() => ouvrirEtagere('accueil')); await p.click('#continuer'); await p.waitForTimeout(500);
console.log('retour à la ville : soir =', await p.evaluate(() => soir), 'bouton visible', await p.evaluate(() => !document.getElementById('retour').hidden));
// repartir creuser remet le jour
await p.evaluate(() => lancer(4)); await p.waitForTimeout(500); console.log('nouvelle fouille : soir =', await p.evaluate(() => soir), 'vie', await p.evaluate(() => vie));
await nav.close(); console.log(err.length ? err : 'aucune erreur');
