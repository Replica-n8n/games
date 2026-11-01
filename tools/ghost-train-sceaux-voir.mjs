import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from './serveur.mjs';

/* La maquette des sceaux, jouée à la souris : on aspire chaque fantôme, puis on trace
   son sceau en suivant ses jalons. Captures dans docs/ghost-train-sceaux/.
     node tools/ghost-train-sceaux-voir.mjs */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, '..', 'docs', 'ghost-train-sceaux');
mkdirSync(SORTIE, { recursive: true });
const srv = await servir();
const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await nav.newPage({ viewport: { width: 1280, height: 720 } });
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
await p.goto(srv.base + 'tools/mockup-ghost-train-sceaux.html');
await p.waitForFunction(() => document.body.dataset.pret === '1');
// sans le titre, la toile tient dans la fenêtre : une capture ne fait plus défiler la page
await p.evaluate(() => { document.querySelector('h1').remove(); document.querySelector('p.intro').remove(); });
const toile = p.locator('#toile'), r = await toile.boundingBox();
const ecran = ([x, y]) => [r.x + x / 320 * r.width, r.y + y / 180 * r.height];
const capture = (nom) => toile.screenshot({ path: path.join(SORTIE, nom + '.png') });
const J = () => p.evaluate(() => { const j = window.__maquette; return { etat: j.etat, e: { x: j.e.x, y: j.e.y, n: j.e.n, type: j.e.type }, jalons: j.sceau && j.sceau.jalons }; });
const attendre = async (f, ms = 8000) => { const t0 = Date.now(); for (;;) { const j = await J(); if (f(j)) return j; if (Date.now() - t0 > ms) throw new Error('attente : ' + j.etat); await p.waitForTimeout(16); } };

async function aspirer(nom) {
  await attendre((j) => j.etat === 'vise');
  let j = await J(); await p.mouse.move(...ecran([j.e.x, j.e.y])); await p.mouse.down();
  for (let k = 0; ; k++) {
    j = await J(); if (j.etat === 'sceau') break;
    await p.mouse.move(...ecran([j.e.x, j.e.y]));
    if (nom && k === 20) await capture(nom + '-aspire');
    await p.waitForTimeout(16);
  }
  await p.mouse.up();
  return j;
}
async function tracer(j, nom, jusque = 1) {
  const a = j.jalons, fin = Math.round((a.length - 1) * jusque);
  await p.mouse.move(...ecran(a[0])); await p.mouse.down();
  for (let i = 1; i <= fin; i++) {
    await p.mouse.move(...ecran(a[i]), { steps: 2 });
    if (nom && i === Math.round(fin * 0.6)) await capture(nom + '-trace');
  }
  if (jusque < 1) return;
  await p.mouse.up();
}

const vus = [];
for (const [i, nom] of [[0, '1-trait'], [1, '2-v'], [2, '3-z'], [3, '4-rond'], [4, '5-vague']]) {
  await p.evaluate((i) => { window.__maquette.figer = false; document.getElementById('debut'); }, i);
  const j = await aspirer(i === 2 ? nom : null);
  await p.waitForTimeout(400); await capture(nom + '-sceau');
  await tracer(j, nom);
  await attendre((x) => x.etat === 'scelle'); await p.waitForTimeout(250); await capture(nom + '-scelle');
  vus.push(nom);
  await attendre((x) => x.etat === 'arrive' || x.etat === 'vise');
}
// la Gouvernante, trois sceaux
let j = await aspirer('7-gouv');
for (let k = 0; k < 3; k++) {
  if (k > 0) j = await attendre((x) => x.etat === 'sceau');
  await p.waitForTimeout(300); await capture('7-gouv-sceau' + (k + 1));
  await tracer(j, null);
}
await attendre((x) => x.etat === 'scelle'); await p.waitForTimeout(300); await capture('7-gouv-scellee');
vus.push('gouvernante');
await attendre((x) => x.etat === 'arrive' || x.etat === 'vise');
// un raté : on lève le doigt à mi-chemin et on laisse filer le temps
{
  const j = await aspirer(null);
  await tracer(j, null, 0.5); await p.mouse.up();
  await capture('6-leve');
  await attendre((x) => x.etat === 'rate', 9000); await p.waitForTimeout(150); await capture('6-rate');
  vus.push('rate');
  await attendre((x) => x.etat === 'vise');
  const j2 = await aspirer(null); await tracer(j2, null);
  await attendre((x) => x.etat === 'scelle');
  await attendre((x) => x.etat === 'vise');
}
// le même sceau, tracé à l'envers, doit compter aussi
{
  const j = await aspirer(null);
  const a = [...j.jalons].reverse();
  await p.mouse.move(...ecran(a[0])); await p.mouse.down();
  for (let i = 1; i < a.length; i++) await p.mouse.move(...ecran(a[i]), { steps: 2 });
  await p.mouse.up();
  await attendre((x) => x.etat === 'scelle', 3000);
  vus.push('envers');
}
await nav.close(); srv.fermer?.();
if (erreurs.length) { console.log('✗ erreurs :', erreurs); process.exit(1); }
console.log('✓ joué :', vus.join(', '));
process.exit(0);
