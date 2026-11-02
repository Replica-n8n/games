import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from './serveur.mjs';

/* Les manières des fantômes à l'écran (moteur/manies.js) : chaque salle qui en a est jouée seule,
   avec un doigt réglé pour montrer le moment, et photographiée. Échoue si un moment n'arrive pas.
   Captures dans docs/ghost-train-manies/.
     node tools/ghost-train-manies-voir.mjs */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, '..', 'docs', 'ghost-train-manies');
mkdirSync(SORTIE, { recursive: true });
const srv = await servir();
const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await nav.newPage({ viewport: { width: 1280, height: 720 } });
const erreurs = [], rates = [];
p.on('pageerror', (e) => erreurs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
await p.goto(srv.base + 'ghost-train/?banc=' + Date.now());
await p.waitForFunction(() => window.__essais && window.__essais.ecran === 'titre');

// chaque scène : la mission et sa salle, le doigt (texte de fonction, lu dans la page), et les moments
const SCENES = [
  { nom: 'diner', mission: 'rdc', salle: 'manger', doigt: `(P) => { const e = P.ents.find((x) => x.occupe === 'mange'); return P.t < 1.6 || !e ? { x: 40, y: 40, bas: false } : { x: e.x, y: e.y, bas: true }; }`,
    moments: [['1-il-dine', `P.t > 1.2 && P.ents.some((x) => x.occupe === 'mange' && !x.surpris)`], ['2-par-surprise', `P.ents.some((x) => x.surpris && x.pv < x.pv0 * 0.6)`]] },
  { nom: 'cuisine', mission: 'rdc', salle: 'cuisine', doigt: `(P) => {
      const C = window.__C, cas = P.ents.find((x) => x.equipe === 'casserole' && x.etat === 'vit');
      if (cas) return { x: cas.x, y: cas.y, bas: true };
      if (P.t < 5) return { x: 300, y: 170, bas: false };
      const q = P.caches[0]; if (q) { const k = C.cuisine.cachettes[q.cachette]; return { x: k.x, y: k.y, bas: P.t > 6.5 }; }
      return window.__robot(P); }`,
    avant: `P => { P.deroule = P.deroule.filter((a) => a[1] !== 'sort' || a[0] < 1); P.deroule.push([0.1, 'sort', 'ecto', 'four', 0, 'casserole']); P.deroule.sort((a, b) => a[0] - b[0]); }`,
    moments: [['3-casserole-chauffe', `P.ents.some((x) => x.equipe === 'casserole' && x.chaud > 0.6)`], ['4-le-meuble-tremble', `P.caches.length === 2 && P.s.tremble.fenetre > 0.15 && !P.tire`], ['5-fouille-bouh', `P.ents.some((x) => x.type === 'ecto' && x.t < 0.5) && P.caches.length < 2`]] },
  { nom: 'lunettes', mission: 'biblio', salle: 'fumoir', doigt: `(P) => { const e = P.ents.find((x) => x.malin && x.etat === 'vit'); if (!e) return { x: 40, y: 40, bas: false }; return e.etourdi > 0 ? { x: e.x, y: e.y, bas: true } : { x: e.x, y: e.y, bas: false, torche: true }; }`,
    avant: `P => { P.deroule = [[0.5, 'sort', 'ecto', 'vitrine', 0, 'lunettes'], [99, 'attendre']]; }`,
    moments: [['6-lunettes-eclaire', `P.ents.some((x) => x.equipe === 'lunettes' && x.lumiere > 0.4)`], ['7-il-les-enleve', `P.ents.some((x) => x.malin && !x.equipe && !(x.etourdi > 0)) && window.__essais.vue.parts.some((q) => q.lunettes && q.t > 0.25)`]] },
  { nom: 'lecteur', mission: 'biblio', salle: 'bibliotheque', doigt: `(P) => ({ x: 40, y: 40, bas: false })`,
    moments: [['8-il-lit', `P.t > 1.2 && P.ents.some((x) => x.occupe === 'lit')`]] },
  { nom: 'bal', mission: 'bal', salle: 'bal', doigt: `(P) => { const m = P.ents.find((x) => x.equipe === 'masque' && x.etat === 'vit'); if (m) return { x: m.x, y: m.y, bas: true }; return { x: 40, y: 40, bas: false }; }`,
    avant: `P => { P.deroule.push([2.2, 'sort', 'ecto', 'miroirD', 0, 'masque']); P.deroule.sort((a, b) => a[0] - b[0]); }`,
    moments: [['9-ils-dansent', `P.t > 1.3 && P.ents.filter((x) => x.occupe === 'danse').length === 2`], ['10-masque-glisse', `P.ricoche && P.ents.some((x) => x.equipe === 'masque' && P.tenu === x)`]] },
  { nom: 'dormeur', mission: 'grenier', salle: 'chambre', doigt: `(P) => { const e = P.ents.find((x) => x.occupe === 'ronfle'); return P.t < 2 || !e ? { x: 300, y: 40, bas: false } : { x: e.x, y: e.y, bas: true }; }`,
    moments: [['11-il-ronfle', `P.t > 1.5 && P.ents.some((x) => x.occupe === 'ronfle' && !x.surpris)`], ['12-sceau-du-dormeur', `P.sceau && P.sceau.e.surpris && P.sceau.t > 0.3`]] },
];

for (const S of SCENES) {
  await p.evaluate(async ({ S }) => {
    const { MISSIONS } = await import('./contenu/missions.js');
    const { SALLES } = await import('./contenu/salles.js');
    const { creeRobot } = await import('./moteur/joueur.js');
    window.__C = SALLES; window.__robot = creeRobot('expert', 5);
    const m = MISSIONS[S.mission], id = 'essai-' + S.nom;
    MISSIONS[id] = { ...m, id, salles: [S.salle], deroules: { [S.salle]: m.deroules[S.salle] } };
    window.__essais.lancer(id);
    const P = window.__essais.partie;
    P.options.invincible = true; P.titre = 0;
    if (S.avant) eval(S.avant)(P);
    window.__essais.piloter(eval(S.doigt));
  }, { S });
  const vus = new Set(), debut = Date.now();
  while (Date.now() - debut < 40000 && vus.size < S.moments.length) {
    const ok = await p.evaluate((ms) => { const P = window.__essais.partie; return ms.map(([, c]) => { try { return !!eval(c); } catch { return false; } }); }, S.moments);
    for (const [k, [nom]] of S.moments.entries()) if (ok[k] && !vus.has(nom)) { vus.add(nom); await p.locator('#toile').screenshot({ path: path.join(SORTIE, nom + '.png') }); }
    await p.waitForTimeout(25);
  }
  for (const [nom] of S.moments) if (!vus.has(nom)) rates.push(nom);
  await p.evaluate(() => window.__essais.piloter(null));
}
await nav.close(); srv.fermer?.();
if (erreurs.length) console.log('✗ erreurs :', erreurs.slice(0, 5));
if (rates.length) console.log('✗ moments jamais vus :', rates.join(', '));
if (erreurs.length || rates.length) process.exit(1);
console.log('✓ manières vues à l\'écran, captures dans docs/ghost-train-manies/');
process.exit(0);
