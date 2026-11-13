// DIG : les messages pendant la fouille (Julie : « le message du pinceau est pile où le doigt creuse, il spamme, il part trop vite ;
// " Bassin " au beau milieu de l'écran »). Mesuré avant la 1.16.0 : 14 bulles en 20 s à 22 px du doigt, 8 cartes empilées au milieu.
// Un robot tient la pioche 20 s sur la villa, puis dégage tout d'un coup. On vérifie :
//  - le conseil du pinceau vient UNE fois, loin du doigt (au-dessus des outils), reste lisible, et part quand on touche le Pinceau ;
//  - les morceaux trouvés ensemble font UN bandeau (« n morceaux dégagés »), sous les pastilles, pas au milieu.
// node tools/dig-messages.mjs [id de la fouille, villa par défaut]
import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";
const id = process.argv[2] || 'villa';
const srv = await servir(); const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const p = await (await nav.newContext({ ...devices['Pixel 7'], viewport: { width: 412, height: 860 } })).newPage();
const err = [], echecs = []; p.on('pageerror', (e) => err.push(e.stack));
const verifie = (nom, ok, d) => { console.log((ok ? 'OK    ' : 'ECHEC ') + nom + (d !== undefined ? ' : ' + JSON.stringify(d) : '')); if (!ok) echecs.push(nom); };
await p.goto(srv.base + 'dig/'); await p.waitForFunction(() => window.__essais);
await p.evaluate((id) => { lancer(NIV.findIndex((d) => d.id === id)); document.getElementById('go').click(); document.getElementById('indice').hidden = true;
  // on relève, à chaque image, ce qui s'affiche
  window.__m = { conseils: [], bandeaux: [] }; let c0 = true, b0 = '';
  const f = () => { const c = document.getElementById('conseil'), b = document.getElementById('bandeau');
    if (!c.hidden && c0) { const r = c.getBoundingClientRect(); __m.conseils.push({ t: performance.now(), txt: c.textContent, haut: r.top, bas: r.bottom, doigt: geste ? [geste.x, geste.y] : null }); }
    c0 = c.hidden; if (!b.hidden && b.innerHTML !== b0) { const r = b.getBoundingClientRect(); __m.bandeaux.push({ txt: b.textContent, haut: r.top, sousPastilles: r.top >= document.getElementById('os').getBoundingClientRect().bottom }); }
    b0 = b.hidden ? '' : b.innerHTML; requestAnimationFrame(f); }; requestAnimationFrame(f); }, id);
await p.waitForTimeout(600);
const cible = await p.evaluate(() => { const r = toile.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.45 }; });
await p.mouse.move(cible.x, cible.y); await p.mouse.down();
for (let i = 0; i < 200; i++) { await p.mouse.move(cible.x - 60 + (i % 9) * 15, cible.y - 30 + Math.floor(i / 9) % 5 * 15, { steps: 2 }); await p.waitForTimeout(100); }
await p.mouse.up();
await p.screenshot({ path: 'tools/captures/dig/messages-conseil.png' });
let m = await p.evaluate(() => __m);
const c = m.conseils.filter((x) => x.txt.includes('pinceau'));
verifie('le conseil du pinceau vient une seule fois en 20 s', c.length === 1, m.conseils.map((x) => x.txt.slice(0, 40)));
verifie('il est loin du doigt (au-dessus des outils, sous la zone où l\'on creuse)', c.length && c[0].doigt && c[0].haut > c[0].doigt[1] + 60, c[0] && { haut: Math.round(c[0].haut), doigt: c[0].doigt.map(Math.round) });
verifie('il est encore là, lisible, plusieurs secondes après', await p.evaluate(() => !document.getElementById('conseil').hidden && document.getElementById('pinceau').classList.contains('appel')));
await p.click('#pinceau'); await p.waitForTimeout(200);
verifie('toucher le Pinceau le fait partir, et éteint le bouton', await p.evaluate(() => document.getElementById('conseil').hidden && !document.getElementById('pinceau').classList.contains('appel')));
// tout dégager d'un coup : plusieurs morceaux ensemble
await p.evaluate(() => { for (const e of [...M.values()]) if (e.t === 'sol' && e.y >= 1) retirer(e); verifierDecouvertes(); majHud(); }); await p.waitForTimeout(450);
await p.screenshot({ path: 'tools/captures/dig/messages-bandeau.png' });
m = await p.evaluate(() => __m); const dernier = m.bandeaux[m.bandeaux.length - 1];
verifie('les morceaux trouvés ensemble font UN bandeau qui les compte', dernier && /\d+ morceaux dégagés/.test(dernier.txt) && await p.evaluate(() => document.querySelectorAll('.bandeau').length === 1), dernier && dernier.txt);
verifie('le bandeau est sous les pastilles, pas au milieu', m.bandeaux.length && m.bandeaux.every((b) => b.sousPastilles && b.haut < 260), m.bandeaux.map((b) => Math.round(b.haut)));
verifie('leurs pastilles s\'allument', await p.evaluate(() => document.querySelectorAll('#os span.neuf').length >= 2));
await nav.close(); srv.arreter(); console.log(err.length ? err : 'aucune erreur'); process.exit(echecs.length || err.length ? 1 : 0);
