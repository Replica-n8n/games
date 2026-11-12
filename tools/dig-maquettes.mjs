// DIG : photographie les fouilles libres en MAQUETTE (tools/dig-maquettes-libres.js), sans les mettre dans le jeu.
// node tools/dig-maquettes.mjs [libres|lisbonne]  -> lit tools/dig-maquettes-<nom>.js,  tools/captures/dig/maquette-<id>-*.png
import { chromium, devices } from "playwright";
import { readFileSync } from "node:fs";
import { servir } from "./serveur.mjs";
import { createRequire } from "node:module";
const require0 = () => createRequire(import.meta.url)("../dig/modeles.js").length;
const extra = readFileSync(new URL(`./dig-maquettes-${process.argv[2] || 'libres'}.js`, import.meta.url), 'utf8');
const srv = await servir(); const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const p = await (await nav.newContext({ ...devices['Pixel 7'], viewport: { width: 412, height: 860 } })).newPage();
const err = []; p.on('pageerror', (e) => err.push(e.stack));
await p.route('**/dig/modeles.js*', async (r) => { const rep = await r.fetch(); await r.fulfill({ response: rep, body: (await rep.text()) + '\n' + extra }); });
const avant = require0();
await p.goto(srv.base + 'dig/'); await p.waitForFunction(() => window.__essais);
const ids = await p.evaluate((n) => NIV.map((d, i) => [i, d.id]).slice(n), avant);
for (const [i, id] of ids) {
  await p.evaluate((i) => lancer(i), i); await p.waitForTimeout(600); await p.screenshot({ path: `tools/captures/dig/maquette-${id}-intro.png` });
  await p.evaluate(() => { document.getElementById('go').click(); document.getElementById('indice').hidden = true; }); await p.waitForTimeout(700);
  await p.screenshot({ path: `tools/captures/dig/maquette-${id}-debut.png` });
  await p.evaluate((i) => ouvrirVitrine(i), i); await p.waitForTimeout(900); await p.screenshot({ path: `tools/captures/dig/maquette-${id}-vitrine.png` });
  await p.evaluate(() => { az += 2.2; }); await p.waitForTimeout(400); await p.screenshot({ path: `tools/captures/dig/maquette-${id}-vitrine2.png` });
  await p.evaluate(() => fermerVitrine());
}
await nav.close(); srv.arreter(); console.log(ids.map((x) => x[1]).join(' '), err.length ? err : 'aucune erreur');
