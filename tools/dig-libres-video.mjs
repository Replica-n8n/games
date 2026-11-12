// DIG : une vidéo des sept fouilles libres qui s'animent (pour montrer avant de publier).
// node tools/dig-libres-video.mjs
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const { chromium, devices } = await import('file:///C:/Users/Julie/Claude - projet 1/vie/trophees-de-vie/node_modules/playwright/index.mjs');
const ici = fileURLToPath(new URL('..', import.meta.url)).split(String.fromCharCode(92)).join('/');
const dossier = ici + 'tools/captures/dig/video/'; fs.rmSync(dossier, { recursive: true, force: true });
const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const ctx = await nav.newContext({ ...devices['Pixel 7'], viewport: { width: 412, height: 860 }, recordVideo: { dir: dossier, size: { width: 412, height: 860 } } });
const p = await ctx.newPage(); const err = []; p.on('pageerror', (e) => err.push(e.stack));
await p.goto('file:///' + ici + 'dig/index.html'); await p.waitForTimeout(1500);
for (const id of ['dinosaure', 'voiture', 'robot', 'dragon', 'vaisseau', 'pirate', 'mammouth']) {
  await p.evaluate((id) => { const i = NIV.findIndex((d) => d.id === id); ouvrirScene(i); distVoulue = distBase * 0.85; }, id);
  await p.waitForTimeout(id === 'pirate' || id === 'vaisseau' ? 9000 : 6000);
}
await ctx.close(); await nav.close();
const f = fs.readdirSync(dossier)[0]; fs.copyFileSync(dossier + f, ici + 'tools/captures/dig/fouilles-libres-animees.webm');
console.log(err.length ? err : 'aucune erreur', f);
