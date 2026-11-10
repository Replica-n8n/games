// DIG : le rôle de chaque outil. La pioche s'arrête à la dernière couche, le pinceau n'enlève QUE la dernière couche.
// Et le jet d'eau éclabousse. node tools/dig-outils.mjs
import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";
const srv = await servir(); const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const p = await (await nav.newContext({ ...devices['Pixel 7'], viewport: { width: 412, height: 860 } })).newPage();
const err = [], echecs = []; p.on('pageerror', (e) => err.push(e.stack));
const verifie = (nom, ok, d) => { console.log((ok ? 'OK    ' : 'ECHEC ') + nom + (d !== undefined ? ' : ' + JSON.stringify(d) : '')); if (!ok) echecs.push(nom); };
await p.goto(srv.base + 'dig/'); await p.waitForFunction(() => window.__essais);
for (const id of ['amphore', 'villa', 'quartier']) {
  const r = await p.evaluate((id) => {
    lancer(NIV.findIndex((d) => d.id === id)); document.getElementById('go').click();
    const terre = () => [...M.values()].filter((e) => e.t === 'sol' && e.y >= 1);
    const colles = () => terre().filter((e) => colle(e.x, e.y, e.z));
    const n0 = terre().length, c0 = colles().length;
    // 1. le pinceau, partout : il ne doit enlever que de la terre qui touche la trouvaille
    outil = 'pinceau'; for (const e of terre()) if (M.has(cle(e.x, e.y, e.z))) frapper({ e, avant: [e.x, e.y + 1, e.z] });
    const n1 = terre().length, c1 = colles().length, meublesColles = colles().filter((e) => SOLS[e.s].doux).length;
    // 2. la pioche, partout : elle ne doit laisser que de la terre meuble collée (qu'il n'y a plus) et le socle
    outil = 'pioche'; for (let k = 0; k < 4; k++) for (const e of terre()) if (M.has(cle(e.x, e.y, e.z))) frapper({ e, avant: [e.x, e.y, e.z] });
    const n2 = terre().length; verifierDecouvertes(); majHud();
    return { terre: n0, collee: c0, apresPinceau: n1, enleveeAuPinceau: n0 - n1, colleeRestante: c1, meublesCollesRestants: meublesColles, apresPioche: n2, sortir: !document.getElementById('sortir').hidden };
  }, id);
  verifie(id + ' : le pinceau seul n\'enlève que la dernière couche', r.enleveeAuPinceau <= r.collee && r.enleveeAuPinceau > 0 && r.meublesCollesRestants === 0, r);
  verifie(id + ' : pinceau puis pioche, il ne reste rien et « Sortir » apparaît', r.apresPioche === 0 && r.sortir, { reste: r.apresPioche, sortir: r.sortir });
}
// 3. l'ordre naturel : la pioche d'abord laisse exactement la dernière couche
const o = await p.evaluate(() => { lancer(0); document.getElementById('go').click(); const terre = () => [...M.values()].filter((e) => e.t === 'sol' && e.y >= 1);
  outil = 'pioche'; for (let k = 0; k < 4; k++) for (const e of terre()) if (M.has(cle(e.x, e.y, e.z))) frapper({ e, avant: [e.x, e.y, e.z] });
  const reste = terre(); return { reste: reste.length, toutesCollees: reste.every((e) => colle(e.x, e.y, e.z) && SOLS[e.s].doux) }; });
verifie('la pioche seule laisse la dernière couche, et rien d\'autre', o.reste > 0 && o.toutesCollees, o);
// 4. les éclaboussures du jet
await p.evaluate(() => { outil = 'pinceau'; for (const e of [...M.values()]) if (e.t === 'sol' && e.y >= 1) retirer(e); verifierDecouvertes(); majHud(); document.getElementById('sortir').click(); });
await p.waitForFunction(() => phase === 'lavage', null, { timeout: 20000 });
const c = await p.evaluate(() => { const r = toile.getBoundingClientRect(), e = OS.find((q) => q.part === 'panse' && q.y === 9 && viser(...((v) => [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height])(new THREE.Vector3(q.x + 0.5, q.y + 0.5 + squel.position.y, q.z + 0.5).project(cam)), squel.position.y, true)); const v = new THREE.Vector3(e.x + 0.5, e.y + 0.5 + squel.position.y, e.z + 0.5).project(cam); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; });
await p.mouse.move(c.x, c.y); await p.mouse.down(); await p.waitForTimeout(700);
const gouttes = await p.evaluate(() => E.filter((e) => e.vie > 0).length);
await p.screenshot({ path: 'tools/captures/dig/jet-eclaboussures.png' }); await p.mouse.up();
verifie('le jet éclabousse', gouttes >= 20, gouttes + ' gouttes en l\'air');
await nav.close(); srv.arreter(); console.log(err.length ? err : 'aucune erreur'); process.exit(echecs.length || err.length ? 1 : 0);
