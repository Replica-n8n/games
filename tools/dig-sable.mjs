// DIG : le sable fin de l'Atlantide. Creusé par-dessous, il tombe ; au bord d'un trou, il glisse. Rien ne reste en l'air.
// node tools/dig-sable.mjs
import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";
const srv = await servir(); const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const p = await (await nav.newContext({ ...devices['Pixel 7'], viewport: { width: 412, height: 860 } })).newPage();
const err = [], echecs = []; p.on('pageerror', (e) => err.push(e.stack));
const verifie = (nom, ok, d) => { console.log((ok ? 'OK    ' : 'ECHEC ') + nom + (d !== undefined ? ' : ' + JSON.stringify(d) : '')); if (!ok) echecs.push(nom); };
await p.goto(srv.base + 'dig/'); await p.waitForFunction(() => window.__essais);
const etat = () => p.evaluate(() => { const sol = [...M.values()].filter((e) => e.t === 'sol');
  return { terre: sol.length, corailEnLAir: sol.filter((e) => e.s === 'corail' && e.y >= 2 && !M.has(cle(e.x, e.y - 1, e.z))).length, enLAir: sol.filter((e) => SOLS[e.s].coule && e.y >= 2 && !M.has(cle(e.x, e.y - 1, e.z))).length, malDessines: sol.filter((e) => !!e.montre !== aLAir(e)).length,
    cles: sol.filter((e) => M.get(cle(e.x, e.y, e.z)) !== e).length, attente: coulees.size, hauteur: Math.max(...sol.map((e) => e.y)) }; });
for (const id of ['trident', 'ile']) {
  await p.evaluate((id) => { lancer(NIV.findIndex((d) => d.id === id)); document.getElementById('go').click(); document.getElementById('indice').hidden = true; document.getElementById('pioche').click(); }, id); await p.waitForTimeout(600);
  const avant = await etat(); await p.screenshot({ path: `tools/captures/dig/sable-${id}-1.png` });
  // creuser par le CÔTÉ, en bas du bloc : le sable du dessus doit descendre
  await p.evaluate(() => { az = 0.5; el = 0.45; }); await p.waitForTimeout(300);
  // un point de l'écran qui touche le FLANC du bloc, à mi-hauteur, loin des boutons
  const pt2 = await p.evaluate(() => { const r = toile.getBoundingClientRect(); for (let y = r.height * 0.75; y > 150; y -= 12) for (let x = 60; x < r.width - 60; x += 12) { const h = viser(r.left + x, r.top + y); if (h && h.e.t === 'sol' && h.e.y >= 4 && h.e.y <= BY - 4 && (h.e.x === 0 || h.e.x === BX - 1 || h.e.z === 0 || h.e.z === BZ - 1)) return { x: r.left + x, y: r.top + y }; } return null; });
  await p.mouse.move(pt2.x, pt2.y); await p.mouse.down(); await p.waitForTimeout(1200); await p.screenshot({ path: `tools/captures/dig/sable-${id}-2.png` }); await p.waitForTimeout(2500); await p.mouse.up();
  await p.waitForFunction(() => coulees.size === 0, null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(200);
  const apres = await etat(); await p.screenshot({ path: `tools/captures/dig/sable-${id}-3.png` });
  verifie(id + ' : la pioche a creusé', apres.terre < avant.terre, { avant: avant.terre, apres: apres.terre });
  verifie(id + ' : le dessus est descendu', apres.hauteur <= avant.hauteur && apres.enLAir === 0, apres);
  verifie(id + ' : aucun cube de sable en l\'air, tout est dessiné où il faut', apres.enLAir === 0 && apres.malDessines === 0 && apres.cles === 0 && apres.attente === 0, apres);
  // tout le reste se dégage encore : pioche et pinceau partout, le sable retombe, on recommence
  const fin = await p.evaluate(async () => { const terre = () => [...M.values()].filter((e) => e.t === 'sol' && e.y >= 1); let tours = 0;
    while (terre().length && tours < 40) { tours++; for (const o of ['pioche', 'pinceau']) { outil = o; for (const e of terre()) if (M.get(cle(e.x, e.y, e.z)) === e) frapper({ e, avant: [e.x, e.y, e.z] }); }
      while (coulees.size) couler(); }
    verifierDecouvertes(); majHud(); return { reste: terre().length, tours, sortir: !document.getElementById('sortir').hidden }; });
  verifie(id + ' : tout se dégage, « Sortir » apparaît', fin.reste === 0 && fin.sortir, fin);
}
await nav.close(); srv.arreter(); console.log(err.length ? err : 'aucune erreur'); process.exit(echecs.length || err.length ? 1 : 0);
