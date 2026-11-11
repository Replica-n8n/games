// DIG : la vitrine et le début de chaque fouille d'une chaîne, pour juger un modèle sans jouer.
// node tools/dig-vues.mjs dite
import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";
const chaine = process.argv[2] || 'dite';
const srv = await servir(); const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const p = await (await nav.newContext({ ...devices['Pixel 7'], viewport: { width: 412, height: 860 } })).newPage();
const err = []; p.on('pageerror', (e) => err.push(e.stack));
await p.goto(srv.base + 'dig/'); await p.waitForFunction(() => window.__essais);
const ids = await p.evaluate((c) => NIV.map((d, i) => [i, d.id, d.libre ? 'libres' : d.chaine]).filter((x) => x[2] === c), chaine);
for (const [i, id] of ids) {
  await p.evaluate((i) => { lancer(i); document.getElementById('go').click(); document.getElementById('indice').hidden = true; }, i); await p.waitForTimeout(700);
  await p.screenshot({ path: `tools/captures/dig/vue-${id}-debut.png` });
  await p.evaluate((i) => ouvrirVitrine(i), i); await p.waitForTimeout(900); await p.screenshot({ path: `tools/captures/dig/vue-${id}-vitrine.png` });
  await p.evaluate(() => { az += 2.2; }); await p.waitForTimeout(400); await p.screenshot({ path: `tools/captures/dig/vue-${id}-vitrine2.png` });
  await p.evaluate(() => fermerVitrine());
}
await p.evaluate(() => ouvrirEtagere()); await p.waitForTimeout(500); await p.screenshot({ path: `tools/captures/dig/vue-${chaine}-etagere.png` });
await nav.close(); srv.arreter(); console.log(err.length ? err : 'aucune erreur');
