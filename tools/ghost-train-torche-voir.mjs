import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from './serveur.mjs';

/* La torche à l'écran : le robot expert joue la bibliothèque, mais garde la torche
   allumée sur l'Ombre qui arrive, puis sur le Bibliothécaire et ses livres. Captures
   dans docs/ghost-train-torche/ (tactile, pour voir le bouton et sa pile).
     node tools/ghost-train-torche-voir.mjs */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, '..', 'docs', 'ghost-train-torche');
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
// un vrai toucher, pour que le jeu se croie sur téléphone (bouton TORCHE dessiné)
await p.touchscreen.tap(5, 5);
await p.evaluate(async () => {
  const { creeRobot } = await import('./moteur/joueur.js');
  const expert = creeRobot('expert', 13);
  window.__essais.lancer('biblio');
  window.__essais.piloter((P) => {
    const d = { ...expert(P) };
    const o = P.ents.find((e) => e.type === 'ombre' && e.etat === 'vit' && !e.mort);
    const b = P.boss && !P.boss.mort && P.boss.etat === 'vit' && !P.peche && !P.aspire ? P.boss : null;
    const livres = P.ents.some((e) => e.garde && e.etat === 'vit');
    if (o && o.s > 0.9) return { x: o.x, y: o.y, bas: o.revele > 0 && o.lumiere > 0.6, torche: true, super: false };
    if (b && livres) return { x: b.x, y: b.y, bas: false, torche: true, super: false };
    return d;
  });
});
const MOMENTS = [
  ['1-ombre-eclairee', (e) => e.allumee && e.ombreLumiere > 0.2 && e.ombreLumiere < 0.45],
  ['2-ombre-etourdie', (e) => e.allumee && e.ombreEtourdie],
  ['3-pile-basse', (e) => e.allumee && e.pile < 0.35],
  ['4-livres-eclaires', (e) => e.allumee && e.salle === 'archives' && e.livres >= 2],
  ['5-pile-vide', (e) => e.vide],
];
const vus = new Set();
const debut = Date.now();
while (Date.now() - debut < 200000 && vus.size < MOMENTS.length) {
  const e = await p.evaluate(() => {
    const P = window.__essais.partie;
    if (!P) return { ecran: window.__essais.ecran };
    const o = P.ents.find((x) => x.type === 'ombre' && x.etat === 'vit');
    return { ecran: window.__essais.ecran, salle: P.salle, allumee: P.torche.on, pile: P.torche.pile, vide: P.torche.vide,
      ombreLumiere: o ? o.lumiere || 0 : 0, ombreEtourdie: !!(o && o.etourdi > 0 && o.lumiere > 0), livres: P.ents.filter((x) => x.garde && x.etat === 'vit').length };
  });
  for (const [nom, cond] of MOMENTS) if (!vus.has(nom) && e.salle && cond(e)) { vus.add(nom); await capture(nom); }
  if (e.ecran === 'bilan' || e.ecran === 'defaite') break;
  await p.waitForTimeout(30);
}
await nav.close(); srv.fermer?.();
const manque = MOMENTS.map(([n]) => n).filter((n) => !vus.has(n));
if (erreurs.length) { console.log('✗ erreurs :', erreurs); process.exit(1); }
console.log(`✓ ${vus.size} captures dans docs/ghost-train-torche/` + (manque.length ? ` (jamais vus : ${manque.join(', ')})` : ''));
process.exit(0);
