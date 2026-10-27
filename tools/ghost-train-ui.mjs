import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from './serveur.mjs';

/* Ghost Train dans le navigateur (carte graphique allumée) : l'écran titre, le plan
   du manoir, puis le robot expert joue tout l'étage ; on capture les moments qui
   comptent dans docs/ghost-train-ui/, on mesure les images/s, et on échoue sur une
   erreur de page, un moment jamais vu ou un étage pas fini.
   Les écrans de pause, de défaite et de réglages sont capturés aussi.
     node tools/ghost-train-ui.mjs */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, '..', 'docs', 'ghost-train-ui');
mkdirSync(SORTIE, { recursive: true });
const srv = await servir();
const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await nav.newPage({ viewport: { width: 1280, height: 720 } });
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
const capture = (nom) => p.locator('#toile').screenshot({ path: path.join(SORTIE, nom + '.png') });
const ecran = () => p.evaluate(() => window.__essais.ecran);

await p.goto(srv.base + 'ghost-train/?banc=' + Date.now());
await p.waitForFunction(() => window.__essais && window.__essais.ecran === 'titre');
await p.waitForTimeout(700);
await capture('01-titre');
await p.locator('[data-id="jouer"]').click();
await p.waitForTimeout(300);
if (await ecran() !== 'manoir') erreurs.push('« jouer » ne mène pas au plan du manoir');
await capture('02-manoir');
await p.locator('[data-id="reglages"]').count().then((n) => n && null);
await p.locator('[data-id="entrer"]').click();
await p.waitForTimeout(200);
if (await ecran() !== 'jeu') erreurs.push('« entrer » ne lance pas l\'étage');

// le robot joue à la place du doigt
await p.evaluate(async () => {
  const { creeRobot } = await import('./moteur/joueur.js');
  const r = creeRobot('expert', 11);
  window.__essais.piloter(r);
  window.__images = 0; window.__pire = 0; let a = performance.now();
  const f = (t) => { window.__images++; window.__pire = Math.max(window.__pire, t - a); a = t; requestAnimationFrame(f); };
  requestAnimationFrame(f);
});
const MOMENTS = [
  ['03-salon-titre', (e) => e.salle === 'salon' && e.titre > 0.5],
  ['04-salon-alerte', (e) => e.salle === 'salon' && e.alerte.length > 0 && e.ts > 1.9],
  ['05-salon-ecto', (e) => e.salle === 'salon' && e.ents.includes('ecto:vit') && e.ts > 3.5],
  ['06-salon-chat', (e) => e.salle === 'salon' && e.ents.includes('chat:vit')],
  ['07-salon-bou', (e) => e.salle === 'salon' && e.ts > 22.1 && e.ts < 23],
  ['08-salon-lustre', (e) => e.salle === 'salon' && e.objets.lustre],
  ['09-passage', (e) => e.etat === 'passage' && e.tPassage > 0.6],
  ['10-manger', (e) => e.salle === 'manger' && e.ts > 4.5 && e.ents.some((x) => x.endsWith(':vit'))],
  ['11-manger-nappe', (e) => e.salle === 'manger' && e.alerte.includes('nappe')],
  ['12-manger-bouchon', (e) => e.salle === 'manger' && e.objets.bouteille],
  ['13-cuisine', (e) => e.salle === 'cuisine' && e.ts > 5 && e.ents.some((x) => x.endsWith(':vit'))],
  ['14-cuisine-casserole', (e) => e.salle === 'cuisine' && Object.entries(e.objets).some(([k, v]) => k.startsWith('casserole') && v)],
  ['15-boss', (e) => e.salle === 'cuisine' && e.boss && e.ents.includes('assiette:vit')],
];
const vus = new Set(), debut = Date.now();
let dernier = null;
while (Date.now() - debut < 200000) {
  const e = await p.evaluate(() => {
    const P = window.__essais.partie;
    if (!P) return { ecranJeu: window.__essais.ecran };
    return { ecranJeu: window.__essais.ecran, etat: P.etat, salle: P.salle, ts: P.ts, titre: P.titre, tPassage: P.tPassage, alerte: Object.entries(P.s.alerte).filter(([, v]) => v > 0).map(([k]) => k),
      ents: P.ents.map((x) => x.type + ':' + x.etat), objets: Object.fromEntries(Object.entries(P.s.objets).map(([k, o]) => [k, !!o.fait])), boss: !!(P.boss && !P.boss.mort), coeurs: P.coeurs, captures: P.captures, vus: P.vus, pieces: P.pieces };
  });
  dernier = e;
  for (const [nom, cond] of MOMENTS) if (!vus.has(nom) && e.salle && cond(e)) { vus.add(nom); await capture(nom); }
  if (e.ecranJeu === 'bilan' || e.ecranJeu === 'defaite') break;
  await p.waitForTimeout(100);
}
const duree = (Date.now() - debut) / 1000;
const { images, pire } = await p.evaluate(() => ({ images: window.__images, pire: window.__pire }));
await p.waitForTimeout(300);
const fin = await ecran();
await capture('16-' + fin);
if (fin !== 'bilan') erreurs.push(`le robot n'a pas fini l'étage (${fin})`);

// la sauvegarde a retenu l'étage, le plan l'affiche
await p.locator('[data-id="manoir"]').click();
await p.waitForTimeout(300);
await capture('17-manoir-apres');
const sauve = await p.evaluate(() => window.__essais.sauvegarde);
if (!(sauve.missions.rdc && sauve.missions.rdc.faite)) erreurs.push('la sauvegarde ne retient pas l\'étage fini');

// pause, défaite, réglages
await p.evaluate(() => { window.__essais.piloter(null); window.__essais.lancer('rdc'); });
await p.waitForTimeout(2500);
await p.locator('#b-pause').click();
await p.waitForTimeout(200);
await capture('18-pause');
await p.locator('[data-id="reprendre"]').click();
await p.evaluate(() => { const P = window.__essais.partie; P.coeurs = 1; P.ents.push({ id: 999, type: 'ecto', x: 160, y: 100, s: 2.39, t: 0, pv: 1, pv0: 1, etat: 'vit', tc: 0, hostile: true, tir: false, boss: false, croit: 0.3, ph: 0, tx: 160, ty: 100, tTir: 9, tirs: 0, cible: 2.4, vise: 0, mort: false }); });
await p.waitForTimeout(800);
if (await ecran() !== 'defaite') erreurs.push('perdre le dernier cœur ne mène pas à l\'écran de défaite');
await capture('19-defaite');
await p.locator('[data-id="manoir"]').click();
await p.evaluate(() => window.__essais.montrer('titre'));
await p.waitForTimeout(200);
await p.locator('[data-id="reglages"]').click();
await p.waitForTimeout(300);
await capture('20-reglages');

await nav.close();
srv.arreter();
console.log(`étage : ${dernier.captures}/${dernier.vus} fantômes, ${dernier.pieces} pièces, ${dernier.coeurs} cœurs, ${Math.round(duree)} s`);
console.log(`images/s : ${(images / duree).toFixed(1)} en moyenne, pire image ${Math.round(pire)} ms`);
const manque = MOMENTS.map(([n]) => n).filter((n) => !vus.has(n));
if (manque.length) erreurs.push('moments jamais vus : ' + manque.join(', '));
if (erreurs.length) { console.log('✗ ' + erreurs.join('\n✗ ')); process.exit(1); }
console.log(`✓ captures dans docs/ghost-train-ui/ (${vus.size + 7})`);
