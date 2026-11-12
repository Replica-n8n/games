// DIG : les fouilles libres qui s'animent après le lavage (et depuis la galerie). Une planche par trouvaille.
// node tools/dig-libres-vivants.mjs [id]
import { fileURLToPath } from 'node:url';
const { chromium, devices } = await import('file:///C:/Users/Julie/Claude - projet 1/vie/trophees-de-vie/node_modules/playwright/index.mjs');
const ici = fileURLToPath(new URL('..', import.meta.url)).split(String.fromCharCode(92)).join('/');
const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const p = await (await nav.newContext({ ...devices['Pixel 7'], viewport: { width: 412, height: 860 } })).newPage();
const err = []; p.on('pageerror', (e) => err.push(e.stack));
await p.goto('file:///' + ici + 'dig/index.html'); await p.waitForTimeout(1500);
const ids = process.argv[2] ? [process.argv[2]] : ['dinosaure', 'voiture', 'robot', 'dragon', 'vaisseau', 'pirate', 'mammouth', 'requin'];
for (const id of ids) {
  const i = await p.evaluate((id) => NIV.findIndex((d) => d.id === id), id);
  await p.evaluate((i) => { lancer(i); document.getElementById('go').click(); document.getElementById('indice').hidden = true;
    for (const e of [...M.values()]) if (e.t === 'sol' && e.y >= 1 && !(def.fosse(e.x, e.y, e.z))) { /* garder la terre autour */ }
    for (const pt of def.parts) for (const e of decPart[pt]) for (const [a, b, c] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) { const s = M.get(cle(e.x + a, e.y + b, e.z + c)); if (s && s.t === 'sol') retirer(s); }
    verifierDecouvertes(); majHud(); document.getElementById('sortir').click(); }, i);
  await p.waitForFunction(() => phase === 'lavage', null, { timeout: 30000 });
  await p.evaluate(() => terminer()); await p.waitForTimeout(2000);
  const bouton = await p.evaluate(() => [document.getElementById('suite').textContent, !document.getElementById('finEtagere').hidden]);
  await p.click('#suite');
  for (const ms of [1500, 1500, 1200, 1200]) { await p.waitForTimeout(ms); await p.screenshot({ path: ici + `tools/captures/dig/vivant-${id}-${ms}-${Date.now() % 1000}.png` }); }
  console.log(id, 'bouton', bouton, 'phase', await p.evaluate(() => phase), 'bougeurs', await p.evaluate(() => vie.bougeurs.size));
}
// depuis la galerie
await p.evaluate(() => ouvrirEtagere('etagere')); await p.waitForTimeout(400);
const i0 = await p.evaluate(() => NIV.findIndex((d) => d.id === 'dinosaure'));
await p.evaluate((i) => ouvrirVitrine(i), i0); await p.waitForTimeout(2500);
await p.screenshot({ path: ici + 'tools/captures/dig/vivant-galerie.png' });
console.log('galerie : phase', await p.evaluate(() => phase), 'retour visible', await p.evaluate(() => !document.getElementById('retour').hidden));
await nav.close(); console.log(err.length ? err : 'aucune erreur');
