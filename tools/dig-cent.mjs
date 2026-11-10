// DIG : peut-on vraiment laver une trouvaille à 100 % au doigt ? La boue qui reste brille-t-elle ?
// node tools/dig-cent.mjs [numéro de fouille, 0 par défaut]
import { fileURLToPath } from 'node:url';
const { chromium, devices } = await import('file:///C:/Users/Julie/Claude - projet 1/vie/trophees-de-vie/node_modules/playwright/index.mjs');
const ici = fileURLToPath(new URL('..', import.meta.url)).split(String.fromCharCode(92)).join('/');
const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const p = await (await nav.newContext({ ...devices['Pixel 7'], viewport: { width: 412, height: 860 } })).newPage();
const err = []; p.on('pageerror', (e) => err.push(e.stack));
await p.goto('file:///' + ici + 'dig/index.html'); await p.waitForTimeout(1500);
const i = +(process.argv[2] || 0);
await p.evaluate((i) => { lancer(i); document.getElementById('go').click(); for (const e of [...M.values()]) if (e.t === 'sol' && e.y >= 1) retirer(e); verifierDecouvertes(); majHud(); document.getElementById('sortir').click(); }, i);
await p.waitForFunction(() => phase === 'lavage', null, { timeout: 20000 });
const nom = await p.evaluate(() => def.id); let vuBrille = false, tAssez = 0; const t0 = Date.now();
for (let pass = 0; pass < 900; pass++) {
  const s = await p.evaluate(() => ({ phase, pp: propreP(), assez, brille: brille > 0, reste: VIS.filter((e) => e.sale > 0.2).length }));
  if (s.phase !== 'lavage') break;
  if (s.brille && !vuBrille) { vuBrille = true; await p.screenshot({ path: ici + 'tools/captures/dig/' + nom + '-brille-debut.png' }); console.log('ça brille à', s.pp, '%, taches restantes', s.reste); }
  if (s.assez && !tAssez) { tAssez = Date.now(); await p.waitForTimeout(250); await p.screenshot({ path: ici + 'tools/captures/dig/' + nom + '-brille-assez.png' }); console.log('« terminer » proposé à', s.pp, '% après', (tAssez - t0) / 1000, 's, taches restantes', s.reste); }
  const c = await p.evaluate(() => { const r = toile.getBoundingClientRect(); const a = VIS.filter((e) => e.sale > 0.02);
    for (let k = 0; k < 20 && a.length; k++) { const e = a[Math.floor(Math.random() * a.length)], v = new THREE.Vector3(e.x + 0.5, e.y + 0.5 + squel.position.y, e.z + 0.5).project(cam);
      if (Math.abs(v.x) > 0.9 || v.y < -0.9 || v.y > 0.7) continue; const x = r.left + (v.x + 1) / 2 * r.width, y = r.top + (1 - v.y) / 2 * r.height, h = viser(x, y, squel.position.y, true);
      if (h && Math.hypot(h.e.x - e.x, h.e.y - e.y, h.e.z - e.z) < def.jetR) return { x, y }; }
    return null; });
  if (!c) { await p.evaluate(() => { az += 0.8; el = 0.3 + Math.random() * 1.0; }); await p.waitForTimeout(150); continue; }
  await p.mouse.move(c.x, c.y); await p.mouse.down(); await p.waitForTimeout(450); await p.mouse.up();
}
const f = await p.evaluate(() => ({ phase, pp: propreP(), reste: VIS.filter((e) => e.sale > 0.02).length }));
console.log(nom, f.phase === 'fin' ? '100 % atteint OK' : 'ECHEC : bloqué', f, 'en', (Date.now() - t0) / 1000, 's, dont', tAssez ? (Date.now() - tAssez) / 1000 : '?', 's après « terminer »');
await p.waitForTimeout(2000); await p.screenshot({ path: ici + 'tools/captures/dig/' + nom + '-cent-fin.png' });
console.log(await p.evaluate(() => document.getElementById('score').textContent));
await nav.close(); console.log(err.length ? err : 'aucune erreur');
