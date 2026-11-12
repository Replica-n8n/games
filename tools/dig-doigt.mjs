// DIG : le cercle sous le doigt. Il paraît quand on creuse ou qu'on lave, pile sous le doigt, et s'en va quand on lâche
// ou qu'on tourne le bloc. node tools/dig-doigt.mjs  ->  captures doigt-*.png
import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";
const srv = await servir(); const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const p = await (await nav.newContext({ ...devices['Pixel 7'], viewport: { width: 412, height: 860 } })).newPage();
const err = [], echecs = []; p.on('pageerror', (e) => err.push(e.stack));
const verifie = (nom, ok, d) => { console.log((ok ? 'OK    ' : 'ECHEC ') + nom + (d !== undefined ? ' : ' + JSON.stringify(d) : '')); if (!ok) echecs.push(nom); };
await p.goto(srv.base + 'dig/'); await p.waitForFunction(() => window.__essais);
const cercle = () => p.evaluate(() => { const d = document.getElementById('doigt'), r = d.getBoundingClientRect(), s = getComputedStyle(d); return { vu: +s.opacity > 0.9, lave: d.classList.contains('lave'), cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2), l: Math.round(r.width) }; });
await p.evaluate(() => { lancer(0); document.getElementById('go').click(); document.getElementById('indice').hidden = true; });
await p.waitForTimeout(600);
verifie('rien avant de toucher', !(await cercle()).vu);
// creuser : un point de la terre au milieu de l'écran
const pt = await p.evaluate(() => { const r = toile.getBoundingClientRect(); for (let y = r.height * 0.4; y < r.height * 0.8; y += 10) for (let x = r.width * 0.3; x < r.width * 0.7; x += 10) if (viser(r.left + x, r.top + y)) return { x: r.left + x, y: r.top + y }; });
await p.mouse.move(pt.x, pt.y); await p.mouse.down(); await p.waitForTimeout(250);
let c = await cercle(); verifie('en creusant : le cercle est là, centré sous le doigt, assez grand pour dépasser du doigt', c.vu && !c.lave && Math.abs(c.cx - pt.x) <= 2 && Math.abs(c.cy - pt.y) <= 2 && c.l >= 56, c);
await p.mouse.move(pt.x + 40, pt.y + 20, { steps: 4 }); await p.waitForTimeout(200); c = await cercle();
verifie('il suit le doigt', Math.abs(c.cx - pt.x - 40) <= 2 && Math.abs(c.cy - pt.y - 20) <= 2, c);
await p.screenshot({ path: 'tools/captures/dig/doigt-1-creuse.png' });
await p.mouse.up(); await p.waitForTimeout(250); verifie('lâché : il s\'en va', !(await cercle()).vu);
// tourner à côté du bloc : pas de cercle
await p.mouse.move(25, 250); await p.mouse.down(); await p.mouse.move(120, 260, { steps: 5 }); await p.waitForTimeout(200);
verifie('en tournant le bloc : pas de cercle', !(await cercle()).vu); await p.mouse.up();
// laver
await p.evaluate(() => { for (const e of [...M.values()]) if (e.t === 'sol' && e.y >= 1) retirer(e); verifierDecouvertes(); majHud(); document.getElementById('sortir').click(); });
await p.waitForFunction(() => phase === 'lavage', null, { timeout: 20000 }); await p.waitForTimeout(300);
const pl = await p.evaluate(() => { const r = toile.getBoundingClientRect(); for (let y = r.height * 0.3; y < r.height * 0.8; y += 8) for (let x = r.width * 0.3; x < r.width * 0.7; x += 8) if (viser(r.left + x, r.top + y, squel.position.y, true)) return { x: r.left + x, y: r.top + y }; });
await p.mouse.move(pl.x, pl.y); await p.mouse.down(); await p.waitForTimeout(400); c = await cercle();
verifie('en lavant : le cercle bleuté est là, sous le doigt', c.vu && c.lave && Math.abs(c.cx - pl.x) <= 2 && Math.abs(c.cy - pl.y) <= 2, c);
await p.screenshot({ path: 'tools/captures/dig/doigt-2-lave.png' });
await p.mouse.up(); await p.waitForTimeout(250); verifie('lâché : il s\'en va', !(await cercle()).vu);
await nav.close(); srv.arreter(); console.log(err.length ? err : 'aucune erreur'); process.exit(echecs.length || err.length ? 1 : 0);
