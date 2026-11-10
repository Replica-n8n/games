const { chromium, devices } = await import('file:///C:/Users/Julie/Claude - projet 1/vie/trophees-de-vie/node_modules/playwright/index.mjs');
const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const ctx = await nav.newContext({ ...devices['Pixel 7'], viewport: { width: 412, height: 860 } });
const err = [];
const p = await ctx.newPage(); p.on('pageerror', (e) => err.push(e.stack));
await p.goto('file:///' + process.cwd().split(String.fromCharCode(92)).join('/') + '/index.html'); await p.waitForTimeout(2000);
await p.screenshot({ path: 'g-0-intro.png' });
await p.click('#go'); await p.waitForTimeout(300);
const st = () => p.evaluate(() => JSON.stringify({ vu: [...vu], os: OS.length, osDansM: [...M.values()].filter((e) => e.t === 'os').length, propre: propreP(), propres: [...propres] }));
// pioche à fond, doigt posé non-stop sur le crâne et autour
const pt = await p.evaluate(() => { const v = new THREE.Vector3(7, 5, 12).project(cam); const r = toile.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; });
await p.mouse.move(pt.x, pt.y); await p.mouse.down();
for (let i = 0; i < 60; i++) { await p.mouse.move(pt.x - 60 + (i % 6) * 25, pt.y - 80 + Math.floor(i / 6) * 18, { steps: 2 }); await p.waitForTimeout(50); }
await p.mouse.up(); await p.waitForTimeout(300);
console.log('pioche à fond', await st()); await p.screenshot({ path: 'g-1-pioche.png' });
await p.evaluate(() => { for (const e of [...M.values()]) if (e.t === 'sol' && e.y >= 2) retirer(e); verifierDecouvertes(); majHud(); });
await p.waitForTimeout(2300); await p.click('#sortir'); await p.waitForTimeout(3600);
await p.screenshot({ path: 'g-2-lavage.png' });
// laver : balayage du doigt sur le squelette
const box = await p.evaluate(() => { const r = toile.getBoundingClientRect(); return { w: r.width, h: r.height, t: r.top }; });
const t1 = Date.now();
await p.mouse.move(100, 400);
for (let pass = 0; pass < 120; pass++) {
  const cible = await p.evaluate(() => { const r0 = toile.getBoundingClientRect(); const pr = (e) => new THREE.Vector3(e.x + 0.5, e.y + 1 + squel.position.y, e.z + 0.5).project(cam); const e = VIS.filter((e) => e.sale > 0.08 && Math.abs(pr(e).x) < 0.95 && pr(e).y > -0.95 && pr(e).y < 0.75).sort((a, b) => b.sale - a.sale)[0]; if (!e) return null; const v = pr(e); const r = toile.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; });
  if (!cible) break;
  await p.mouse.move(cible.x, cible.y); await p.mouse.down();
  for (let i = 0; i < 8; i++) { await p.mouse.move(cible.x + Math.sin(i) * 10, cible.y + Math.cos(i * 1.3) * 10, { steps: 2 }); await p.waitForTimeout(60); }
  if (pass === 25) await p.screenshot({ path: 'g-3-jet.png' });
  await p.mouse.up();
  if (await p.evaluate(() => !lavage)) break;
}
console.log('lavage', await st(), (Date.now() - t1) / 1000, 's');
await p.waitForTimeout(2200); await p.screenshot({ path: 'g-4-fin.png' });
await nav.close(); console.log(err.length ? err : 'aucune erreur');
