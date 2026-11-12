// DIG : le sable de l'Atlantide coule-t-il en douceur ? (Julie : « on dirait un bug graphique tellement c'est saccadé »)
// Pendant l'écoulement, on mesure à chaque image : le temps de l'image, et de combien chaque cube de sable a bougé À L'ÉCRAN.
// Un cube qui saute d'une case entière en une image se téléporte : c'est ce qui se lit comme un bug.
// node tools/dig-sable-fluide.mjs [photos]
import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";
const srv = await servir(); const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const p = await (await nav.newContext({ ...devices['Pixel 7'], viewport: { width: 412, height: 860 } })).newPage();
const err = []; p.on('pageerror', (e) => err.push(e.stack));
await p.goto(srv.base + 'dig/'); await p.waitForFunction(() => window.__essais);
await p.evaluate(() => { lancer(NIV.findIndex((d) => d.id === 'ile')); document.getElementById('go').click(); document.getElementById('indice').hidden = true; document.getElementById('pioche').click(); az = 0.5; el = 0.45; });
await p.waitForTimeout(800);
// on ouvre une galerie dans le flanc, en bas : tout le sable au-dessus doit descendre
const res = await p.evaluate(async () => {
  for (const e of [...M.values()]) if (e.t === 'sol' && e.y >= 3 && e.y <= 6 && e.z >= 8 && e.z <= 12 && e.x <= 14) retirer(e);
  for (let x = 0; x <= 14; x++) for (let z = 8; z <= 12; z++) autour(x, z);
  const pos = new Map(), sauts = [], dts = []; let t0 = performance.now(), tp = t0, images = 0, bougent = 0;
  await new Promise((fin) => { const f = (t) => { dts.push(t - tp); tp = t; let max = 0;
      for (const e of M.values()) { if (e.t !== 'sol' || !SOLS[e.s].coule || !e.montre) continue; const a = e.im.instanceMatrix.array, y = a[e.i * 16 + 13], x = a[e.i * 16 + 12], z = a[e.i * 16 + 14];
        const q = pos.get(e); if (q) { const d = Math.hypot(x - q[0], y - q[1], z - q[2]); if (d > 0.001) { bougent++; max = Math.max(max, d); } } pos.set(e, [x, y, z]); }
      sauts.push(max); images++; if (t - t0 < 4000) requestAnimationFrame(f); else fin(); }; requestAnimationFrame(f); });
  const tri = [...dts].sort((a, b) => a - b), mvt = sauts.filter((s) => s > 0.001);
  return { images, ips: Math.round(images / 4), pireImage: Math.round(tri[tri.length - 1]), mediane: Math.round(tri[tri.length >> 1]), imagesAvecMouvement: mvt.length,
    teleportations: mvt.filter((s) => s >= 0.9).length, sautMoyen: +(mvt.reduce((a, b) => a + b, 0) / Math.max(1, mvt.length)).toFixed(2), encoreEnAttente: coulees.size };
});
console.log(res);
console.log(res.teleportations === 0 && res.imagesAvecMouvement > 20 ? 'OK    le sable glisse sans se téléporter' : 'ECHEC le sable saute de case en case', '|', res.pireImage <= 50 ? 'OK    aucune image de plus de 50 ms' : 'ECHEC image de ' + res.pireImage + ' ms');
if (process.argv[2] === 'photos') for (let k = 0; k < 6; k++) { await p.evaluate(() => { for (const e of [...M.values()]) if (e.t === 'sol' && e.y >= 3 && e.y <= 4 && e.z >= 13 && e.z <= 15 && e.x <= 14) retirer(e); for (let x = 0; x <= 14; x++) for (let z = 12; z <= 16; z++) autour(x, z); }); await p.waitForTimeout(120); await p.screenshot({ path: `tools/captures/dig/sable-fluide-${k}.png` }); }
await nav.close(); srv.arreter(); console.log(err.length ? err : 'aucune erreur');
