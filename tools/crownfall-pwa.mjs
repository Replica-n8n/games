// Crownfall installable : le service range toute la coquille, la page marche
// HORS LIGNE après une première visite, la version s'affiche, le manifeste et les
// icônes répondent, et une partie en cours se reprend après rechargement.
//   node tools/crownfall-pwa.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { servir } from './serveur.mjs';

const srv = await servir();
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: 360, height: 732 } });
const p = await ctx.newPage();
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(String(e)));
p.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
let ok = true;
const verifie = (nom, vrai, detail = '') => { console.log(`${vrai ? 'ok ' : 'NON'} ${nom}${vrai ? '' : ' : ' + detail}`); if (!vrai) ok = false; };

const VERSION = /var VERSION = "([^"]+)"/.exec(readFileSync(new URL('../crownfall/sw.js', import.meta.url), 'utf8'))[1];
await p.goto(srv.base + 'crownfall/');
await p.evaluate(() => navigator.serviceWorker.ready);
await p.reload();
await p.waitForFunction(() => /Version/.test(document.getElementById('version')?.textContent || ''));
verifie('la version affichée est celle du service', (await p.textContent('#version')) === 'Version ' + VERSION.replace('crownfall-', ''), await p.textContent('#version'));

const SHELL = JSON.parse(/var SHELL = (\[[\s\S]*?\]);/.exec(readFileSync(new URL('../crownfall/sw.js', import.meta.url), 'utf8'))[1]);
const ranges = await p.evaluate(async () => {
  const k = (await caches.keys()).find((x) => x.startsWith('crownfall:'));
  return k ? (await (await caches.open(k)).keys()).map((r) => new URL(r.url).pathname) : [];
});
verifie('toute la coquille est rangée', SHELL.every((f) => ranges.includes('/crownfall/' + f.replace('./', ''))), ranges.join());
const manifeste = JSON.parse(readFileSync(new URL('../crownfall/manifest.json', import.meta.url), 'utf8'));
for (const ic of manifeste.icons) {
  const r = await p.request.get(srv.base + 'crownfall/' + ic.src.replace('./', ''));
  verifie(`icône ${ic.src}`, r.ok());
}

// Une partie commencée, puis hors ligne : elle se recharge et se reprend.
await p.click('[data-act=jouer]');
await p.waitForFunction(() => !window.__crownfall.occupe());
const main = await p.evaluate(() => window.__crownfall.etat().main);
await ctx.setOffline(true);
await p.reload();
await p.waitForFunction(() => window.__crownfall);
verifie('hors ligne, la page se charge', await p.isVisible('[data-act=reprendre]'));
await p.click('[data-act=reprendre]');
const apres = await p.evaluate(() => window.__crownfall.etat().main);
verifie('la partie reprend avec la même main', apres.join() === main.join(), `${apres} / ${main}`);
const police = await p.evaluate(() => document.fonts.check('800 20px "Grenze Gotisch"'));
verifie('les polices hébergées sont là hors ligne', police);
verifie('aucune erreur dans la console', !erreurs.length, erreurs.join('\n'));

await nav.close();
srv.arreter();
console.log(ok ? `crownfall-pwa : tout passe (${VERSION})` : 'crownfall-pwa : ÉCHEC');
process.exit(ok ? 0 : 1);
