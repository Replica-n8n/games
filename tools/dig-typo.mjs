// DIG : pas de retour à la ligne après « ni avant ! ? : » (Julie, 2026-11-16), et les Carpates fermées sur le bord.
// node tools/dig-typo.mjs
import { fileURLToPath } from 'node:url';
const { chromium, devices } = await import('file:///C:/Users/Julie/Claude - projet 1/vie/trophees-de-vie/node_modules/playwright/index.mjs');
const ici = fileURLToPath(new URL('..', import.meta.url)).split(String.fromCharCode(92)).join('/');
const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const p = await (await nav.newContext({ ...devices['Pixel 7'], viewport: { width: 412, height: 860 } })).newPage();
const err = []; p.on('pageerror', (e) => err.push(e.stack));
const photo = (n) => p.screenshot({ path: ici + 'tools/captures/dig/' + n + '.png' });
await p.goto('file:///' + ici + 'dig/index.html'); await p.waitForTimeout(800);
const i = await p.evaluate(() => NIV.findIndex((d) => d.id === 'carpates'));
await p.evaluate((i) => { lancer(i); document.getElementById('go').click(); document.getElementById('indice').hidden = true; for (const e of [...M.values()]) if (e.t === 'sol' && e.y >= 1) retirer(e); verifierDecouvertes(); majHud(); document.getElementById('sortir').click(); }, i);
await p.waitForTimeout(800); await p.evaluate(() => { az = 0.5; el = 0.35; }); await p.waitForTimeout(800); await photo('typo-carpates-bord');
await p.evaluate(() => terminer()); await p.waitForTimeout(2200); await photo('typo-carpates-fin');
// toute la page : aucune espace ordinaire devant ! ? : ; » % ni après «
const fautes = await p.evaluate(() => { const r = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) if (/ [!?:;»%]|« /.test(n.nodeValue) && !n.parentElement.closest('script,style')) r.push(n.nodeValue.slice(0, 80)); return r; });
const rang = await p.evaluate(() => new Promise((r) => { const e = document.getElementById('rang'); e.textContent = "L'expédition « Dracula » est terminée !"; setTimeout(() => r(e.textContent), 50); }));
console.log('fiche :', JSON.stringify(rang));
console.log(fautes.length ? 'ESPACES ORDINAIRES : ' + JSON.stringify(fautes) : 'typographie OK', err.length ? err : 'aucune erreur');
await nav.close();
