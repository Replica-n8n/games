// Planche du décor peint : chaque mission de la Jungle à deux instants, dans le vrai jeu.
// Vérifie aussi qu'aucune erreur ne survient et mesure les images/s AVEC la carte graphique.
//   node tools/patrouille-decor-planche.mjs   →  docs/patrouille-decor-planche.png
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from './serveur.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.join(ICI, '..', 'docs');
const MISSIONS = ['j1', 'j2', 'j3', 'j4', 'j5', 'jsecret', 'jboss'];
const INSTANTS = [6, 40];
const srv = await servir();
const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const p = await nav.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2 });
const erreurs = []; p.on('pageerror', (e) => erreurs.push(e.message));
await p.goto(srv.base + 'patrouille/index.html?nc=' + Date.now()); await p.waitForTimeout(400);
const images = {};
for (const id of MISSIONS) {
  await p.evaluate((m) => { window.__patrouille.opt.invincible = true; window.__patrouille.lancer(m); }, id);
  let fait = 0;
  for (const s of INSTANTS) {
    await p.evaluate((n) => { for (let k = 0; k < n; k++) window.__patrouille.pasJeu(); }, (s - fait) * 60); fait = s;
    await p.waitForTimeout(100);
    images[`${id}-${s}`] = (await p.screenshot()).toString('base64');
  }
}
const ips = await p.evaluate(() => new Promise((ok) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else ok(Math.round(n / 3)); }; requestAnimationFrame(f); }));
const html = `<body style="margin:0;background:#f5ebd8;font:700 20px sans-serif;color:#1b1612;padding:12px">
${INSTANTS.map((s) => `<div style="margin:6px 0">À ${s} s</div><div style="display:flex;gap:8px">${MISSIONS.map((id) => `<figure style="margin:0;text-align:center"><img src="data:image/png;base64,${images[`${id}-${s}`]}"><figcaption>${id}</figcaption></figure>`).join('')}</div>`).join('')}
<style>img{width:240px;height:427px;border:2px solid #1b1612;border-radius:12px;display:block}</style></body>`;
const q = await nav.newPage({ viewport: { width: 1780, height: 1000 } });
await q.setContent(html); await q.screenshot({ path: path.join(DOCS, 'patrouille-decor-planche.png'), fullPage: true });
await nav.close(); srv.arreter();
console.log(`${ips} images/s${erreurs.length ? ' · ✗ erreurs : ' + erreurs.join(' | ') : ' · aucune erreur'}`);
if (erreurs.length) process.exit(1);
