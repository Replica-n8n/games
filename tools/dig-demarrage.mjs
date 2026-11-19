// DIG : au lancement, l'accueil s'affiche tout de suite (Julie, 2026-11-19 : la carte « Creuser » restait plusieurs
// secondes avant l'accueil). On mesure, avec une partie bien avancée, quand l'accueil apparaît et ce qu'on voit avant.
// node tools/dig-demarrage.mjs
import { fileURLToPath } from 'node:url';
const { chromium, devices } = await import('file:///C:/Users/Julie/Claude - projet 1/vie/trophees-de-vie/node_modules/playwright/index.mjs');
const ici = fileURLToPath(new URL('..', import.meta.url)).split(String.fromCharCode(92)).join('/');
const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const ctx = await nav.newContext({ ...devices['Pixel 7'], viewport: { width: 412, height: 860 } });
const p = await ctx.newPage(); const err = []; p.on('pageerror', (e) => err.push(e.message));
const url = 'file:///' + ici + 'dig/index.html';
await p.goto(url); await p.waitForTimeout(500);
await p.evaluate(() => { for (const c of CHAINES) fait[c] = Math.min(longueur(c), 4); fait.uruk = 1; dernier = 'uruk'; for (const d of NIV) if (d.libre) libresFaits.add(d.id); sauver(); });
await p.addInitScript(() => { window.__vu = []; const t0 = performance.now();
  const voir = () => { const i = document.getElementById('intro'), e = document.getElementById('etagere');
    if (i && e) window.__vu.push([Math.round(performance.now() - t0), !i.hidden && !i.closest('[hidden]') ? 'carte' : '', !e.hidden ? 'accueil' : '']); if (window.__vu.length < 400) requestAnimationFrame(voir); };
  requestAnimationFrame(voir); });
const t = Date.now(); await p.reload(); await p.waitForFunction(() => !document.getElementById('etagere').hidden);
const vu = await p.evaluate(() => window.__vu);
const carte = vu.filter(([, c, a]) => c && !a);
console.log('accueil visible après', Date.now() - t, 'ms ;', carte.length ? `ÉCHEC : la carte seule vue pendant ${carte.at(-1)[0]} ms` : 'jamais de carte seule à l\'écran', err.length ? err : 'aucune erreur');
await nav.close();
process.exit(carte.length ? 1 : 0);
