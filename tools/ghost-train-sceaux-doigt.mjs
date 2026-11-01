import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from './serveur.mjs';

/* Les sceaux au VRAI doigt (événements tactiles, comme sur un téléphone) : le robot expert
   joue les combles jusqu'au premier sceau, puis on lui reprend la main et on trace avec des
   touchers simulés, en passant par entrees.js (le doigt trace là où il est, sans décalage).
   Captures dans docs/ghost-train-sceaux/jeu-*.png.
     node tools/ghost-train-sceaux-doigt.mjs */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, '..', 'docs', 'ghost-train-sceaux');
mkdirSync(SORTIE, { recursive: true });
const srv = await servir();
const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await nav.newPage({ viewport: { width: 960, height: 540 }, hasTouch: true, isMobile: true });
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
const cdp = await p.context().newCDPSession(p);
const capture = (nom) => p.locator('#toile').screenshot({ path: path.join(SORTIE, nom + '.png') });
await p.goto(srv.base + 'ghost-train/?banc=' + Date.now());
await p.waitForFunction(() => window.__essais && window.__essais.ecran === 'titre');
await p.touchscreen.tap(5, 5);
const r = await p.locator('#toile').boundingBox();
const ecran = ([x, y]) => ({ x: r.x + x / 320 * r.width, y: r.y + y / 180 * r.height });
const toucher = (type, pt) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ ...ecran(pt), id: 1 }] });

async function premierSceau(salle) {
  await p.evaluate(async (salle) => {
    const { creeRobot } = await import('./moteur/joueur.js');
    const expert = creeRobot('expert', 11);
    window.__essais.lancer('grenier'); window.__essais.invincible();
    // le robot joue, mais rend la main dès qu'un sceau s'ouvre
    window.__essais.piloter((P) => (P.sceau && P.salle === salle ? { x: 160, y: 90, fx: 160, fy: 90, bas: false } : expert(P)));
  }, salle);
  await p.waitForFunction((salle) => { const P = window.__essais.partie; return P && P.sceau && P.salle === salle && P.sceau.t > 0.3; }, salle, { timeout: 200000 });
  await p.evaluate(() => window.__essais.piloter(null));
  return p.evaluate(() => { const S = window.__essais.partie.sceau; return { jalons: S.jalons, forme: S.forme, n: window.__essais.partie.sceaux }; });
}
async function tracer(jalons, nom, jusque = 1) {
  const fin = Math.round((jalons.length - 1) * jusque);
  await toucher('touchStart', jalons[0]);
  for (let i = 1; i <= fin; i++) {
    await toucher('touchMove', jalons[i]); await p.waitForTimeout(20);
    if (nom && i === Math.round(fin * 0.6)) await capture(nom);
  }
  await toucher('touchEnd');
}

const bilan = [];
const s1 = await premierSceau('chambre');
await capture('jeu-1-sonne');
await tracer(s1.jalons, 'jeu-2-trace');
await p.waitForTimeout(150);
const apres = await p.evaluate(() => ({ n: window.__essais.partie.sceaux, ouvert: !!window.__essais.partie.sceau }));
bilan.push(`chambre (${s1.forme}) : ${apres.n > s1.n && !apres.ouvert ? 'scellé au doigt' : 'RATÉ'}`);
if (!(apres.n > s1.n)) erreurs.push('le tracé au doigt n\'a pas scellé');
await capture('jeu-3-scelle');
// un tracé qui part du mauvais endroit : rien ne compte
const s2 = await premierSceau('lingerie');
const loin = [s2.jalons[0][0] + 40, s2.jalons[0][1] + 30];
await toucher('touchStart', loin); await toucher('touchMove', [loin[0] + 20, loin[1]]); await toucher('touchEnd');
const faux = await p.evaluate(() => !!window.__essais.partie.sceau && !window.__essais.partie.sceau.trace);
bilan.push(`lingerie (${s2.forme}) : départ loin du point ${faux ? 'refusé' : 'ACCEPTÉ À TORT'}`);
if (!faux) erreurs.push('un tracé loin du point a compté');
await tracer(s2.jalons, null);
await nav.close(); srv.fermer?.();
if (erreurs.length) { console.log('✗', erreurs); process.exit(1); }
console.log('✓ ' + bilan.join(' ; '));
process.exit(0);
