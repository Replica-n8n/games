import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from './serveur.mjs';

/* Ghostel dans le navigateur (carte graphique allumée) : le robot expert joue les
   étages 2 à 4 (bibliothèque, salle de bal, combles) ; on capture chaque salle, chaque
   geste et chaque boss dans docs/ghost-train-ui/, on mesure les images/s, et on échoue
   sur une erreur de page, un moment jamais vu ou un étage pas fini.
     node tools/ghost-train-etages-ui.mjs */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, '..', 'docs', 'ghost-train-ui');
mkdirSync(SORTIE, { recursive: true });
const srv = await servir();
const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await nav.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
const capture = (nom) => p.locator('#toile').screenshot({ path: path.join(SORTIE, nom + '.png') });
await p.goto(srv.base + 'ghost-train/?banc=' + Date.now());
await p.waitForFunction(() => window.__essais && window.__essais.ecran === 'titre');

const ETAGES = {
  biblio: [
    ['21-fumoir', (e) => e.salle === 'fumoir' && e.ts > 6 && e.ents.some((x) => x.startsWith('ombre'))],
    ['22-flash', (e) => e.salle !== 'archives' && e.flash],
    ['23-lumi', (e) => e.ents.includes('lumi:vit')],
    ['24-bibliotheque', (e) => e.salle === 'bibliotheque' && e.ts > 8],
    ['25-archives', (e) => e.salle === 'archives' && e.ts > 6],
    ['26-bibliothecaire', (e) => e.salle === 'archives' && e.boss && e.ents.filter((x) => x === 'garde:vit').length >= 3],
  ],
  bal: [
    ['31-vestiaire', (e) => e.salle === 'vestiaire' && e.ts > 6 && e.ents.includes('saxo:vit')],
    ['32-parfait', (e) => e.parfaits > 0 && e.salle === 'vestiaire'],
    ['33-bal', (e) => e.salle === 'bal' && e.ts > 6],
    ['34-super', (e) => e.onde],
    ['35-kiosque', (e) => e.salle === 'kiosque' && e.ts > 5],
    ['36-chef', (e) => e.salle === 'kiosque' && e.boss && e.ents.includes('note:vit')],
  ],
  grenier: [
    ['41-chambre', (e) => e.salle === 'chambre' && e.ts > 5],
    ['42-slam', (e) => e.slamTenu],
    ['43-lingerie', (e) => e.salle === 'lingerie' && e.ts > 6],
    ['44-combles', (e) => e.salle === 'combles' && e.ts > 5],
    ['45-gouvernante', (e) => e.salle === 'combles' && e.boss && e.ents.includes('gouvernante:vit')],
  ],
};
let images = 0, temps = 0, pire = 0;
const vus = new Set();
for (const [id, moments] of Object.entries(ETAGES)) {
  await p.evaluate(async (id) => {
    const { creeRobot } = await import('./moteur/joueur.js');
    window.__essais.lancer(id);
    window.__essais.piloter(creeRobot('expert', 13));
    window.__images = 0; window.__pire = 0; let a = performance.now();
    if (!window.__compte) { window.__compte = true; const f = (t) => { window.__images++; window.__pire = Math.max(window.__pire, t - a); a = t; requestAnimationFrame(f); }; requestAnimationFrame(f); }
  }, id);
  const debut = Date.now();
  while (Date.now() - debut < 200000) {
    const e = await p.evaluate(() => {
      const P = window.__essais.partie;
      if (!P) return { ecranJeu: window.__essais.ecran };
      return { ecranJeu: window.__essais.ecran, salle: P.salle, ts: P.ts, ents: P.ents.map((x) => x.type + ':' + x.etat), boss: !!(P.boss && !P.boss.mort), bouclier: !!(P.boss && P.boss.bouclier),
        flash: P.flashCD > 0.6, parfaits: P.parfaits, onde: P.superT > 0.2 && P.superT < 0.6, slamTenu: !!(P.tenu && P.tenu.lutte && P.tire && P.tenu.slam > 0.3), coeurs: P.coeurs };
    });
    for (const [nom, cond] of moments) if (!vus.has(nom) && e.salle && cond(e)) { vus.add(nom); await capture(nom); }
    if (e.ecranJeu === 'bilan' || e.ecranJeu === 'defaite') break;
    await p.waitForTimeout(60);
  }
  const d = (Date.now() - debut) / 1000;
  const r = await p.evaluate(() => ({ images: window.__images, pire: window.__pire, ecran: window.__essais.ecran }));
  images += r.images; temps += d; pire = Math.max(pire, r.pire);
  if (r.ecran !== 'bilan') erreurs.push(`le robot n'a pas fini l'étage ${id} (${r.ecran})`);
  else await capture(`4${id.length}-bilan-${id}`);
  console.log(`${id} : ${r.ecran}, ${Math.round(d)} s`);
}
await nav.close();
srv.arreter();
console.log(`images/s : ${(images / temps).toFixed(1)} en moyenne, pire image ${Math.round(pire)} ms`);
const manque = Object.values(ETAGES).flat().map(([n]) => n).filter((n) => !vus.has(n));
if (manque.length) erreurs.push('moments jamais vus : ' + manque.join(', '));
if (erreurs.length) { console.log('✗ ' + erreurs.join('\n✗ ')); process.exit(1); }
console.log(`✓ ${vus.size} captures dans docs/ghost-train-ui/`);
