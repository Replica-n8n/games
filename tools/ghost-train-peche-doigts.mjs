import { chromium } from 'playwright';
import { servir } from './serveur.mjs';
/* La maquette du boss pêché au doigt : deux doigts posés en même temps (CDP), dans les
   deux façons de tenir la torche. node tools/ghost-train-peche-doigts.mjs */
const srv = await servir();
const nav = await chromium.launch();
const ctxN = await nav.newContext({ viewport: { width: 800, height: 450 }, hasTouch: true, isMobile: true });
const p = await ctxN.newPage();
const erreurs = []; p.on('pageerror', (e) => erreurs.push(e.message));
await p.goto(srv.base + 'tools/poc/peche/');
await p.waitForFunction(() => window.__m);
const cdp = await ctxN.newCDPSession(p);
const r = await p.locator('#toile').boundingBox();
const px = (x, y) => ({ x: r.x + x * r.width / 320, y: r.y + y * r.height / 180 });
const toucher = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((q, i) => ({ ...px(q.x, q.y), id: q.id ?? i })) });
let ok = true;
const voir = async (nom, attendu) => {
  await p.waitForTimeout(200);
  const e = await p.evaluate(() => { const J = window.__m.J; return { torche: J.torche.on, tire: J.tire, vx: Math.round(J.visee.x), vy: Math.round(J.visee.y), tx: Math.round(J.torche.x), ty: Math.round(J.torche.y) }; });
  const bon = Object.entries(attendu).every(([k, v]) => e[k] === v);
  ok &&= bon; console.log(`${bon ? '✓' : '✗'} ${nom} ${JSON.stringify(e)}`);
};
// bouton : pouce sur le bouton TORCHE, doigt droit qui vise
await toucher('touchStart', [{ x: 26, y: 150, id: 1 }]);
await toucher('touchMove', [{ x: 26, y: 150, id: 1 }, { x: 240, y: 122, id: 2 }]);
await toucher('touchStart', [{ x: 26, y: 150, id: 1 }, { x: 240, y: 122, id: 2 }]);
await voir('bouton : torche et rayon ensemble', { torche: true, tire: true, vx: 240, vy: 100, tx: 240, ty: 100 });
await toucher('touchEnd', []);
await voir('bouton : tout lâché', { torche: false, tire: false });
// libre : le pouce gauche pointe la lumière lui-même
await p.evaluate(() => window.__m.mode('libre'));
await toucher('touchStart', [{ x: 60, y: 110, id: 3 }]);
await toucher('touchStart', [{ x: 60, y: 110, id: 3 }, { x: 250, y: 120, id: 4 }]);
await voir('libre : torche où est le pouce', { torche: true, tire: true, tx: 60, ty: 88, vx: 250, vy: 98 });
await toucher('touchMove', [{ x: 140, y: 100, id: 3 }, { x: 250, y: 120, id: 4 }]);
await voir('libre : le pouce emmène la lumière', { torche: true, tx: 140, ty: 78 });
await toucher('touchEnd', []);
await nav.close(); srv.arreter();
if (erreurs.length) { console.log('✗ ' + erreurs.join('\n✗ ')); ok = false; }
process.exit(ok ? 0 : 1);
