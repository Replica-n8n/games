import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from './serveur.mjs';

/* Chaque cachette de chaque salle, au repos puis en train de trembler (alerte), en gros plan
   côte à côte : pour voir un meuble dessiné deux fois. Planche : docs/ghost-train-cachettes.png
     node tools/ghost-train-cachettes-planche.mjs */
const ICI = path.dirname(fileURLToPath(import.meta.url));
mkdirSync(path.join(ICI, '..', 'docs'), { recursive: true });
const srv = await servir();
const nav = await chromium.launch();
const p = await nav.newPage({ viewport: { width: 1400, height: 900 } });
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(e.message));
await p.goto(srv.base + 'ghost-train/?banc=' + Date.now());
await p.waitForFunction(() => window.__essais && window.__essais.ecran === 'titre');
const n = await p.evaluate(async () => {
  const { peindreSalles, FONDS, DESSINS } = await import('./ecran/scene.js');
  const { SALLES } = await import('./contenu/salles.js');
  const { etatSalle } = await import('./moteur/partie.js');
  peindreSalles();
  const cases = [];
  for (const [id, S] of Object.entries(SALLES)) for (const [k, c] of Object.entries(S.cachettes)) cases.push([id, k, c]);
  const Z = 3, T = 56, cols = 6, planche = document.createElement('canvas');
  planche.width = cols * (T * 2 * Z + 12); planche.height = Math.ceil(cases.length / cols) * (T * Z + 22);
  const P = planche.getContext('2d'); P.fillStyle = '#120818'; P.fillRect(0, 0, planche.width, planche.height); P.imageSmoothingEnabled = false;
  const t = document.createElement('canvas'); t.width = 320; t.height = 180; const c = t.getContext('2d');
  cases.forEach(([id, k, q], i) => {
    const x0 = (i % cols) * (T * 2 * Z + 12), y0 = Math.floor(i / cols) * (T * Z + 22);
    [0, 0.4].forEach((a, j) => {
      const s = etatSalle(id); s.alerte[k] = a;
      c.drawImage(FONDS[id], 0, 0); DESSINS[id].animer(c, s, 0.517, { t: 0.517, s });
      P.drawImage(t, q.x - T / 2, q.y - T / 2, T, T, x0 + j * T * Z, y0 + 16, T * Z, T * Z);
    });
    P.fillStyle = '#fff'; P.font = '13px sans-serif'; P.fillText(id + ' · ' + k, x0 + 4, y0 + 12);
  });
  planche.id = 'planche'; planche.style.cssText = 'position:absolute;left:0;top:0;z-index:99'; document.body.append(planche); window.__essais.figer(true);
  return cases.length;
});
await p.locator('#planche').screenshot({ path: path.join(ICI, '..', 'docs', 'ghost-train-cachettes.png') });
await nav.close(); srv.fermer?.();
if (erreurs.length) { console.log('✗', erreurs); process.exit(1); }
console.log(`✓ ${n} cachettes, docs/ghost-train-cachettes.png`); process.exit(0);
