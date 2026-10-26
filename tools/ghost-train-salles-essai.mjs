import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from './serveur.mjs';

/* Maquette « les salles » : le robot joue le salon puis la cuisine dans le
   navigateur (carte graphique allumée), on capture les moments qui comptent,
   on mesure les images/s, et on échoue sur une erreur ou une partie bloquée.
     node tools/ghost-train-salles-essai.mjs [page]   (page : index.html par défaut,
     ou ../ghost-train-salles.html pour la page assemblée) */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, '..', 'docs', 'ghost-train-salles' + (process.argv.includes('--enfant') ? '-enfant' : ''));
mkdirSync(SORTIE, { recursive: true });
const page = process.argv.slice(2).find((a) => !a.startsWith('--')) || 'index.html';
const enfant = process.argv.includes('--enfant');
const srv = await servir();
const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await nav.newPage({ viewport: { width: 1280, height: 720 } });
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
await p.goto(srv.base + 'tools/poc/salles/' + page);
await p.waitForFunction(() => window.__salles);
await p.waitForTimeout(400);
await p.locator('canvas').screenshot({ path: path.join(SORTIE, '00-titre.png') });

// Les moments à capturer : [nom, condition sur l'état]
const MOMENTS = [
  ['01-salon-alerte', (e) => e.salle === 0 && e.alerte.length > 0 && e.ts > 1.9],
  ['02-salon-goule', (e) => e.salle === 0 && e.ents.some((x) => x === 'goule:vit') && e.ts > 3.5],
  ['03-salon-chat', (e) => e.salle === 0 && e.ents.includes('chat:vit')],
  ['04-salon-crane', (e) => e.salle === 0 && e.ents.some((x) => x === 'crane:vit' || x === 'ecto:vit')],
  ['05-salon-lustre', (e) => e.salle === 0 && e.objets.lustre && e.ts > 26],
  ['06-passage', (e) => e.ecran === 'passage'],
  ['07-cuisine', (e) => e.salle === 1 && e.ts > 5 && e.ents.some((x) => x.endsWith(':vit'))],
  ['08-cuisine-casserole', (e) => e.salle === 1 && Object.entries(e.objets).some(([k, v]) => k.startsWith('casserole') && v)],
  ['09-boss', (e) => e.salle === 1 && e.boss && e.ents.includes('assiette:vit')],
  ['10-bilan', (e) => e.ecran === 'bilan' || e.ecran === 'defaite'],
];
await p.evaluate((enfant) => { window.__salles.essais.bot = true; window.__salles.essais.enfant = enfant; window.__salles.lancer(); }, enfant);
const faits = new Set();
const debut = Date.now();
let dernier = null;
await p.evaluate(() => { window.__images = 0; window.__pire = 0; let a = performance.now(); const f = (t) => { window.__images++; window.__pire = Math.max(window.__pire, t - a); a = t; requestAnimationFrame(f); }; requestAnimationFrame(f); });
while (Date.now() - debut < 150000) {
  const e = await p.evaluate(() => window.__salles.etat());
  dernier = e;
  for (const [nom, cond] of MOMENTS) {
    if (faits.has(nom) || !cond(e)) continue;
    faits.add(nom);
    await p.locator('canvas').screenshot({ path: path.join(SORTIE, nom + '.png') });
  }
  if (e.ecran === 'bilan' || e.ecran === 'defaite') { await p.waitForTimeout(1200); await p.locator('canvas').screenshot({ path: path.join(SORTIE, '10-bilan.png') }); break; }
  await p.waitForTimeout(120);
}
const duree = (Date.now() - debut) / 1000;
const { images, pire } = await p.evaluate(() => ({ images: window.__images, pire: window.__pire }));
await nav.close();
srv.arreter();
console.log(`fin : ${dernier.ecran}, salle ${dernier.salle}, ${dernier.captures}/${dernier.vus} fantômes, ${dernier.pieces} pièces, ${dernier.coeurs} cœurs, ${Math.round(duree)} s`);
console.log(`images/s : ${(images / duree).toFixed(1)} en moyenne, pire image ${Math.round(pire)} ms`);
const manque = MOMENTS.map(([n]) => n).filter((n) => !faits.has(n));
if (manque.length) console.log('✗ moments jamais vus : ' + manque.join(', '));
if (erreurs.length) console.log('✗ erreurs : ' + erreurs.join(' | '));
if (dernier.ecran !== 'bilan' && !enfant) console.log('✗ le robot n\'a pas fini les deux salles');
if (erreurs.length || (!enfant && (manque.length || dernier.ecran !== 'bilan'))) process.exit(1);
console.log(`✓ ${faits.size + 1} captures dans docs/ghost-train-salles/`);
