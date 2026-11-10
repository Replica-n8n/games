// DIG : un robot joue l'essai au doigt (amphore, dézoom, villa, étagère) et capture chaque étape.
// node tools/dig-essai.mjs
const { chromium, devices } = await import('file:///C:/Users/Julie/Claude - projet 1/vie/trophees-de-vie/node_modules/playwright/index.mjs');
import { fileURLToPath } from 'node:url';
const ici = fileURLToPath(new URL('..', import.meta.url)).split(String.fromCharCode(92)).join('/');
const OUT = ici + 'tools/captures/dig/';
const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const ctx = await nav.newContext({ ...devices['Pixel 7'], viewport: { width: 412, height: 860 } });
const err = []; const p = await ctx.newPage(); p.on('pageerror', (e) => err.push(e.stack)); p.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); });
await p.goto('file:///' + ici + 'dig/index.html'); await p.waitForTimeout(2500);
const photo = (n) => p.screenshot({ path: OUT + n + '.png' });
const etat = () => p.evaluate(() => ({ phase, degage, dessines: terre.count, vu: [...vu], os: OS.length, vis: VIS.length, osDansM: [...M.values()].filter((e) => e.t === 'os').length, propre: propreP(), propres: [...propres], terre: [...M.values()].filter((e) => e.t === 'sol').length }));
const ips = async () => p.evaluate(() => new Promise((r) => { let n = 0, pire = 0, d = performance.now(), t = d; const f = (x) => { n++; pire = Math.max(pire, x - t); t = x; if (x - d < 2000) requestAnimationFrame(f); else r({ ips: Math.round(n / 2), pire: Math.round(pire) }); }; requestAnimationFrame(f); }));
const ecran = (x, y, z) => p.evaluate(([x, y, z]) => { const v = new THREE.Vector3(x, y, z).project(cam); const r = toile.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; }, [x, y, z]);

async function niveau(nom, cible) {
  console.log('---', nom, await etat(), await ips());
  // 1. la pioche tenue sans arrêt sur la trouvaille : elle ne doit rien lui enlever
  const pt = await ecran(...cible);
  await p.mouse.move(pt.x, pt.y); await p.mouse.down();
  for (let i = 0; i < 70; i++) { await p.mouse.move(pt.x - 50 + (i % 7) * 16, pt.y - 40 + Math.floor(i / 7) * 9, { steps: 2 }); await p.waitForTimeout(50); }
  await p.mouse.up(); await p.waitForTimeout(400);
  console.log('pioche tenue', await etat()); await photo(nom + '-2-pioche');
  { const r = await p.evaluate(() => { const sol = [...M.values()].filter((e) => e.t === 'sol'); const faux = sol.filter((e) => e.montre !== aLAir(e)).length, L = terre.userData.L; let places = 0; for (let i = 0; i < L.length; i++) if (L[i].i !== i || (i < terre.count) !== !!L[i].montre) places++; return { sol: sol.length, dessines: terre.count, faux, places }; });
    console.log('terre dessinée après la pioche', r, r.faux || r.places ? 'ECHEC' : 'OK'); }
  // 2. le pinceau au même endroit
  await p.evaluate(() => document.getElementById('pinceau').click());
  await p.mouse.move(pt.x, pt.y); await p.mouse.down();
  for (let i = 0; i < 40; i++) { await p.mouse.move(pt.x - 50 + (i % 7) * 16, pt.y - 40 + Math.floor(i / 7) * 9, { steps: 2 }); await p.waitForTimeout(50); }
  await p.mouse.up(); await p.waitForTimeout(400);
  console.log('pinceau', await etat()); await photo(nom + '-3-pinceau');
  // 2 bis. le cas de Julie : presque toute la terre partie à la pioche, la trouvaille encore sous sa dernière couche
  await p.evaluate(() => { const colle = (e) => V6.some(([a, b, c]) => def.vox.has(cle(e.x + a, e.y + b, e.z + c))); for (const e of [...M.values()]) if (e.t === 'sol' && e.y >= 1 && e.x < BX / 2 && !colle(e)) retirer(e); verifierDecouvertes(); majHud(); });
  await p.waitForTimeout(300); console.log('moitié piochée, dernière couche intacte', await etat()); await photo(nom + '-3b-couche');
  // 3. le reste de la terre est retiré par le banc (un robot ne sait pas fouiller comme une personne)
  await p.evaluate(() => { for (const e of [...M.values()]) if (e.t === 'sol' && e.y >= 1) retirer(e); verifierDecouvertes(); majHud(); });
  await p.waitForTimeout(2400); await photo(nom + '-4-degage');
  { const e = await etat(), manque = await p.evaluate(() => def.parts.filter((pt) => !vu.has(pt))), cache = await p.evaluate(() => document.getElementById('sortir').hidden);
    console.log('toute la terre retirée : dégagé', e.degage, '%, morceaux manquants', manque, 'bouton Sortir', cache ? 'CACHÉ' : 'visible', manque.length || cache ? 'ECHEC' : 'OK'); }
  await p.evaluate(() => document.getElementById('sortir').click()); await p.waitForTimeout(6500);
  console.log('lavage', await etat(), await ips()); await photo(nom + '-5-boue');
  // 3 bis. pendant le lavage, glisser À CÔTÉ de la trouvaille doit tourner la caméra, sans arroser
  { const a0 = await p.evaluate(() => az), s0 = (await etat()).propre; const lib = await p.evaluate(() => { const b = toile.getBoundingClientRect(); for (let y = 130; y < b.height - 80; y += 10) for (const x of [20, b.width - 20, 60, b.width - 60]) if (!viser(b.left + x, b.top + y, squel.position.y, true)) return { x: b.left + x, y: b.top + y }; return null; });
    await p.mouse.move(lib.x, lib.y); await p.mouse.down(); await p.mouse.move(lib.x + (lib.x < 200 ? 150 : -150), lib.y, { steps: 6 }); await p.mouse.up();
    const a1 = await p.evaluate(() => az); console.log('glissé à côté pendant le lavage : az', a0.toFixed(2), '->', a1.toFixed(2), a1 !== a0 && (await etat()).propre === s0 ? 'OK' : 'ECHEC'); }
  // 4. laver au doigt, en tournant de temps en temps
  const t1 = Date.now();
  for (let pass = 0; pass < 400; pass++) {
    const c = await p.evaluate(() => { const r = toile.getBoundingClientRect(); const pr = (e) => new THREE.Vector3(e.x + 0.5, e.y + 0.5 + squel.position.y, e.z + 0.5).project(cam);
      const a = VIS.filter((e) => e.sale > 0.15).map((e) => ({ e, v: pr(e) })).filter((o) => Math.abs(o.v.x) < 0.9 && o.v.y > -0.9 && o.v.y < 0.7);
      for (let k = 0; k < 12 && a.length; k++) { const o = a[Math.floor(Math.random() * a.length)]; const h = viser(r.left + (o.v.x + 1) / 2 * r.width, r.top + (1 - o.v.y) / 2 * r.height, squel.position.y, true); if (h && h.e.sale > 0.15) return { x: r.left + (o.v.x + 1) / 2 * r.width, y: r.top + (1 - o.v.y) / 2 * r.height }; }
      return null; });
    if (await p.evaluate(() => phase !== 'lavage')) break;
    if (await p.evaluate(() => !document.getElementById('assez').hidden)) { await photo(nom + '-6b-brille'); await p.click('#assez'); break; }
    if (!c) { await p.evaluate(() => { az += 0.8; }); await p.waitForTimeout(150); continue; }
    await p.mouse.move(c.x, c.y); await p.mouse.down();
    for (let i = 0; i < 8; i++) { await p.mouse.move(c.x + Math.sin(i) * 12, c.y + Math.cos(i * 1.3) * 12, { steps: 2 }); await p.waitForTimeout(60); }
    await p.mouse.up();
    if (pass === 12) await photo(nom + '-6-jet');
  }
  console.log('lavé en', (Date.now() - t1) / 1000, 's', await etat());
  await p.waitForTimeout(2600); await photo(nom + '-7-fin');
}

// « node tools/dig-essai.mjs dite » ne joue que la chaîne de Dité, lancée depuis l'étagère
if (process.argv[2] === 'dite') {
  await p.click('#go'); await p.click('#ouvrirEtagere'); await p.waitForTimeout(400); await photo('dite-etagere-0');
  await p.evaluate(() => document.querySelector('.case[data-creuser="' + NIV.findIndex((d) => d.id === 'brasero') + '"]').click()); await p.waitForTimeout(700);
  await photo('brasero-0-intro'); await p.click('#go'); await p.waitForTimeout(400); await photo('brasero-1-debut');
  const SUITE = [['brasero', [6.5, 17, 6.5]], ['porte', [28, 18, 8]], ['rempart', [39.5, 11, 12.5]], ['cite', [46.5, 10, 33.5]]];
  for (const [k, [nom, cible]] of SUITE.entries()) {
    await niveau(nom, cible);
    await photo(nom + '-8-avant-dezoom'); await p.click('#suite');
    if (k < 3) { await p.waitForFunction(() => dezoom && dezoom.dur && !document.getElementById('poussiere').classList.contains('on')); await p.waitForTimeout(380);
      for (const [n, ms] of [['a', 0], ['b', 1500], ['c', 1200], ['d', 1200], ['e', 3500]]) { await p.waitForTimeout(ms); await photo('dite-dezoom' + (k + 1) + '-' + n); } }
  }
  for (const [n, ms] of [['a', 1500], ['b', 3000], ['c', 2500], ['d', 3500], ['e', 3500]]) { await p.waitForTimeout(ms); await photo('dite-retour-' + n); }
  await p.waitForFunction(() => phase === 'vivante', null, { timeout: 20000 }); await p.waitForTimeout(4500); await photo('dite-vivante-1'); console.log('cité vivante', await ips());
  await p.evaluate(() => { az = 0.3; el = 0.5; distVoulue *= 0.55; }); await p.waitForTimeout(1200); await photo('dite-vivante-2');
  await p.evaluate(() => { az = 2.6; el = 0.35; }); await p.waitForTimeout(800); await photo('dite-vivante-3');
  await p.click('#retour'); await p.waitForTimeout(900); await photo('dite-etagere');
  console.log('progression', await p.evaluate(() => ({ fait, libres: [...libresFaits] })));
  await nav.close(); console.log(err.length ? err : 'aucune erreur'); process.exit(0);
}
// « node tools/dig-essai.mjs libres » saute Pompéi et ne joue que les fouilles libres
if (process.argv[2] !== 'libres') {
await photo('amphore-0-intro'); await p.click('#go'); await p.waitForTimeout(400); await photo('amphore-1-debut');
await niveau('amphore', [8.5, 19, 6.5]);
await p.screenshot({ path: OUT + 'amphore-8-avant-dezoom.png' });
// le dézoom
await p.click('#suite');
await p.waitForFunction(() => dezoom && dezoom.dur && !document.getElementById('poussiere').classList.contains('on')); await p.waitForTimeout(380);
for (const [n, ms] of [['a', 0], ['b', 1500], ['c', 1200], ['d', 1200], ['e', 3500]]) { await p.waitForTimeout(ms); await photo('dezoom-' + n); }
await niveau('villa', [9, 9, 12]);
await p.screenshot({ path: OUT + 'villa-8-avant-dezoom.png' });
await p.click('#suite');
await p.waitForFunction(() => dezoom && dezoom.dur && !document.getElementById('poussiere').classList.contains('on')); await p.waitForTimeout(380);
for (const [n, ms] of [['a', 0], ['b', 1500], ['c', 1200], ['d', 1200], ['e', 3500]]) { await p.waitForTimeout(ms); await photo('dezoom2-' + n); }
await niveau('rue', [26, 12, 8]);
await p.screenshot({ path: OUT + 'rue-8-avant-dezoom.png' });
await p.click('#suite');
await p.waitForFunction(() => dezoom && dezoom.dur && !document.getElementById('poussiere').classList.contains('on')); await p.waitForTimeout(380);
for (const [n, ms] of [['a', 0], ['b', 1500], ['c', 1200], ['d', 1200], ['e', 3500]]) { await p.waitForTimeout(ms); await photo('dezoom3-' + n); }
await niveau('ville', [38, 16, 30]);
// la fin de chaîne : le grand retour jusqu'à l'amphore, puis la ville vivante
await p.click('#suite');
for (const [n, ms] of [['a', 1500], ['b', 3000], ['c', 2500], ['d', 3500], ['e', 3500]]) { await p.waitForTimeout(ms); await photo('retour-' + n); }
await p.waitForFunction(() => phase === 'vivante', null, { timeout: 20000 }); await p.waitForTimeout(4500); await photo('vivante-1'); console.log('ville vivante', await ips());
await p.evaluate(() => { az = 0.3; el = 0.55; distVoulue *= 0.6; }); await p.waitForTimeout(1200); await photo('vivante-2');
await p.click('#retour'); await p.waitForTimeout(900); await photo('etagere');
} else { await p.evaluate(() => { document.getElementById('intro').hidden = true; ouvrirEtagere(); }); await p.waitForTimeout(500); }
// les fouilles libres : on les lance depuis leur case « ? » de l'étagère
const num = (id) => p.evaluate((id) => NIV.findIndex((d) => d.id === id), id);
const LIBRES = [[await num('dinosaure'), 'dinosaure', [5, 19, 6]], [await num('voiture'), 'voiture', [15, 9, 7]], [await num('robot'), 'robot', [10, 25, 6]]];
for (const [i, nom, cible] of LIBRES) {
  await p.evaluate((i) => document.querySelector('.case[data-creuser="' + i + '"]').click(), i); await p.waitForTimeout(700);
  await photo(nom + '-0-intro'); await p.click('#go'); await p.waitForTimeout(400); await photo(nom + '-1-debut');
  await niveau(nom, cible);
  await p.click('#suite'); await p.waitForTimeout(700);
}
await photo('etagere-pleine');
await p.evaluate(() => document.querySelector('.case[data-i="3"]').click()); await p.waitForTimeout(900); await photo('vitrine-ville');
await p.evaluate(() => { az = 2.2; el = 0.5; distVoulue *= 0.55; }); await p.waitForTimeout(700); await photo('vitrine-ville-2');
console.log('vitrine de la ville', await ips());
await p.click('#retour'); await p.waitForTimeout(300);
await p.evaluate(() => document.querySelector('.case[data-i="2"]').click()); await p.waitForTimeout(900); await photo('vitrine-rue');
await p.evaluate(() => { az = -0.6; el = 0.55; distVoulue *= 0.6; }); await p.waitForTimeout(700); await photo('vitrine-rue-2');
await p.click('#retour'); await p.waitForTimeout(300);
await p.evaluate(() => document.querySelector('.case[data-i="1"]').click()); await p.waitForTimeout(900); await photo('vitrine-villa');
await p.evaluate(() => { az = 2.4; el = 0.9; }); await p.waitForTimeout(400); await photo('vitrine-villa-2');
await p.click('#retour'); await p.waitForTimeout(300);
await p.evaluate(() => document.querySelector('.case[data-i="0"]').click()); await p.waitForTimeout(900); await photo('vitrine-amphore');
await p.click('#retour'); await p.waitForTimeout(300);
for (const [i, nom] of LIBRES) { await p.evaluate((i) => document.querySelector('.case[data-i="' + i + '"]').click(), i); await p.waitForTimeout(900); await photo('vitrine-' + nom); await p.click('#retour'); await p.waitForTimeout(300); }
// la progression survit à un rechargement, si le stockage est permis
await p.reload(); await p.waitForTimeout(2000);
console.log('après rechargement', await p.evaluate(() => ({ fait, libres: [...libresFaits] })));
await nav.close(); console.log(err.length ? err : 'aucune erreur');
