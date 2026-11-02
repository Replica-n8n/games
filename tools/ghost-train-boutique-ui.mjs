import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from './serveur.mjs';

/* La boutique au doigt (vrais touchers sur les boutons HTML posés sur la toile) :
   fermée avant le rez-de-chaussée (la bulle répond), puis ouverte avec « NOUVEAU »,
   un rayon acheté, un autre trop cher, et le rayon acheté dans une vraie partie.
   Captures dans docs/ghost-train-boutique/.
     node tools/ghost-train-boutique-ui.mjs */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, '..', 'docs', 'ghost-train-boutique');
mkdirSync(SORTIE, { recursive: true });
const srv = await servir();
const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await nav.newPage({ viewport: { width: 960, height: 540 }, hasTouch: true, isMobile: true });
const erreurs = [], bilan = [];
p.on('pageerror', (e) => erreurs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
const capture = (nom) => p.locator('#toile').screenshot({ path: path.join(SORTIE, nom + '.png') });
const toucher = (id) => p.locator(`#zones [data-id="${id}"]`).tap();
const essais = (f) => p.evaluate(f);
const verifier = (oui, quoi) => { if (oui) bilan.push(quoi); else erreurs.push('raté : ' + quoi); };

async function ouvrir(sauvegarde) {
  await p.goto(srv.base + 'ghost-train/?banc=' + Date.now());
  await p.evaluate((s) => { if (s) localStorage.setItem('ghost-train:sauvegarde', JSON.stringify(s)); else localStorage.removeItem('ghost-train:sauvegarde'); }, sauvegarde);
  await p.reload();
  await p.waitForFunction(() => window.__essais && window.__essais.ecran === 'titre');
  if (sauvegarde) await capture('0-titre');
  await toucher('jouer');
  await p.waitForFunction(() => window.__essais.ecran === 'manoir');
}

// 1. avant le rez-de-chaussée : fermée, la bulle répond
await ouvrir(null);
const label = await p.locator('#zones [data-id="boutique"]').getAttribute('aria-label') || await p.locator('#zones [data-id="boutique"]').textContent();
verifier(/fermée/.test(label || ''), 'fermée annoncée au lecteur d\'écran');
await toucher('boutique'); await p.waitForTimeout(150);
verifier(await essais(() => window.__essais.ecran === 'manoir'), 'fermée, on reste sur le plan');
await capture('1-fermee-bulle');
verifier(await p.locator('#zones [data-id="entrer"]').isVisible(), 'ENTRER toujours là');

// 2. le rez-de-chaussée fini (sauvegarde d'avant la boutique) : NOUVEAU, puis dedans
await ouvrir({ v: 2, pieces: 320, missions: { rdc: { faite: true, note: 'A' } }, carnet: {} });
await p.waitForTimeout(400);
await capture('2-ouverte-nouveau');
await toucher('boutique');
await p.waitForFunction(() => window.__essais.ecran === 'boutique');
verifier(await essais(() => window.__essais.sauvegarde.boutiqueVue === true), 'NOUVEAU s\'éteint une fois entré');
await capture('3-dedans-neon');
await toucher('rayon:ecto'); await p.waitForTimeout(100);
await capture('4-ecto-a-acheter');
await toucher('acheter'); await p.waitForTimeout(100);
const s1 = await essais(() => window.__essais.sauvegarde);
verifier(s1.pieces === 170 && s1.rayon === 'ecto' && s1.rayons.includes('ecto'), `ecto acheté (${s1.pieces} pièces restent)`);
verifier(await essais(() => JSON.parse(localStorage.getItem('ghost-train:sauvegarde')).rayon === 'ecto'), 'achat écrit dans la sauvegarde');
await capture('5-ecto-en-main');
await toucher('rayon:arc'); await p.waitForTimeout(100);
verifier(await p.locator('#zones [data-id="acheter"]').count() === 0, 'arc-en-ciel trop cher : pas de bouton ACHETER');
await capture('6-arc-trop-cher');
await toucher('rayon:neon'); await toucher('prendre'); await p.waitForTimeout(100);
verifier(await essais(() => window.__essais.sauvegarde.rayon === 'neon'), 'le néon se reprend en main');
await toucher('rayon:ecto'); await toucher('prendre');
await toucher('plan');
await p.waitForFunction(() => window.__essais.ecran === 'manoir');
await capture('7-plan-apres');

// 3. le rayon acheté dans une vraie partie
await essais(async () => {
  const { creeRobot } = await import('./moteur/joueur.js');
  const expert = creeRobot('expert', 3);
  window.__essais.lancer('rdc'); window.__essais.invincible(); window.__essais.piloter(expert);
});
await p.waitForFunction(() => { const P = window.__essais.partie; return P && P.tire && P.tenu && P.ts > 4; }, null, { timeout: 60000 });
await essais(() => window.__essais.figer(true));
verifier(await essais(() => window.__essais.vue.rayon.id === 'ecto'), 'la partie tire avec le rayon en main');
await capture('8-partie-ecto');
// l'arc-en-ciel, pour voir ses couleurs filer en jeu
await essais(() => { window.__essais.vue.rayon = { id: 'arc', a: '#ff3fa4', b: '#3fe8ff', arc: true }; });
await p.waitForTimeout(100);
await capture('9-partie-arc');
await nav.close(); srv.fermer?.();
if (erreurs.length) { console.log('✗', erreurs); process.exit(1); }
console.log('✓ ' + bilan.join(' ; '));
process.exit(0);
