// DIG : le début de quelques fouilles (le dessus du bloc, la fosse), pour juger le terrain sans jouer.
// node tools/dig-debuts.mjs [id id ...]
import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";
const ids = process.argv.length > 2 ? process.argv.slice(2) : ['amphore', 'villa', 'porte', 'echoppe', 'temple', 'carrefour', 'boulangerie', 'quartier', 'dragon'];
const srv = await servir(); const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const p = await (await nav.newContext({ ...devices['Pixel 7'], viewport: { width: 412, height: 860 } })).newPage();
const err = []; p.on('pageerror', (e) => err.push(e.stack));
await p.goto(srv.base + 'dig/'); await p.waitForFunction(() => window.__essais);
for (const id of ids) {
  const r = await p.evaluate((id) => { lancer(NIV.findIndex((d) => d.id === id)); document.getElementById('go').click(); document.getElementById('indice').hidden = true;
    const sol = [...M.values()].filter((e) => e.t === 'sol'); return { id, terre: sol.length, malDessines: sol.filter((e) => !!e.montre !== aLAir(e)).length, degage, vus: [...vu] }; }, id);
  await p.waitForTimeout(600); await p.screenshot({ path: `tools/captures/dig/debut-${id}.png` }); console.log(JSON.stringify(r));
}
await nav.close(); srv.arreter(); console.log(err.length ? err : 'aucune erreur');
