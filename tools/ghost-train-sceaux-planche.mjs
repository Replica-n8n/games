import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from './serveur.mjs';

/* Chaque sceau des combles sur chaque fantôme qui en demande un, dans chaque salle, tel que le
   jeu le dessine à son ouverture (le guide seul), puis à mi-tracé : pour voir un signe qui se
   perd sur le fantôme ou sur le décor. Planche : docs/ghost-train-sceaux-planche[-NOM].png
     node tools/ghost-train-sceaux-planche.mjs [NOM] */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const nom = process.argv[2] ? '-' + process.argv[2] : '';
mkdirSync(path.join(ICI, '..', 'docs'), { recursive: true });
const srv = await servir();
const nav = await chromium.launch();
const p = await nav.newPage({ viewport: { width: 1400, height: 900 } });
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(e.message));
await p.goto(srv.base + 'ghost-train/?banc=' + Date.now());
await p.waitForFunction(() => window.__essais && window.__essais.ecran === 'titre');
const n = await p.evaluate(async () => {
  const { dessinerPartie, creeVue } = await import('./ecran/scene.js');
  const { creePartie, etatSalle } = await import('./moteur/partie.js');
  const { naitre } = await import('./moteur/fantomes.js');
  const { ouvrirSceau, FORMES } = await import('./moteur/sceaux.js');
  const { MISSIONS } = await import('./contenu/missions.js');
  const M = MISSIONS.grenier, cases = [];
  for (const salle of M.salles) for (const forme of M.sceaux[salle]) for (const type of ['drap', 'crane', 'ombre']) cases.push({ salle, forme, type });
  for (const forme of M.sceaux.boss) cases.push({ salle: 'combles', forme, type: 'gouvernante' });
  const Z = 3, T = 100, cols = 6, planche = document.createElement('canvas');
  planche.width = cols * (T * 2 * Z + 12); planche.height = Math.ceil(cases.length / cols) * (T * Z + 22);
  const P = planche.getContext('2d'); P.fillStyle = '#120818'; P.fillRect(0, 0, planche.width, planche.height); P.imageSmoothingEnabled = false;
  const t = document.createElement('canvas'); t.width = 320; t.height = 180; const c = t.getContext('2d');
  cases.forEach((q, i) => {
    const x0 = (i % cols) * (T * 2 * Z + 12), y0 = Math.floor(i / cols) * (T * Z + 22);
    [0, 0.5].forEach((moitie, j) => {
      const pa = creePartie({ mission: M, graine: 7 });
      pa.salle = q.salle; pa.s = etatSalle(q.salle); pa.ents = []; pa.deroule = []; pa.titre = 0; pa.consigne = null;
      const e = naitre(pa, q.type, 150, 84, 0.8); e.etat = 'vole'; e.alpha = 1;
      // le sceau voulu, et pas un autre tiré au hasard
      pa.h.choix = () => q.forme;
      ouvrirSceau(pa, e, q.type === 'gouvernante' ? 3 : 1);
      const S = pa.sceau; S.t = 0.3;
      if (moitie) {
        const l = S.jalons, k = Math.max(2, Math.round(l.length * moitie));
        S.trace = { cand: [{ l, i: k }], x: l[k - 1][0], y: l[k - 1][1] }; S.leve = true;
      }
      pa.evenements = [];
      const v = creeVue({});
      dessinerPartie(c, pa, v);
      P.drawImage(t, S.cx - T / 2, S.cy - T / 2, T, T, x0 + j * T * Z, y0 + 16, T * Z, T * Z);
    });
    P.fillStyle = '#fff'; P.font = '13px sans-serif'; P.fillText(`${q.salle} · ${q.forme} · ${q.type}`, x0 + 4, y0 + 12);
  });
  planche.id = 'planche'; planche.style.cssText = 'position:absolute;left:0;top:0;z-index:99'; document.body.append(planche); window.__essais.figer(true);
  return cases.length;
});
await p.locator('#planche').screenshot({ path: path.join(ICI, '..', 'docs', `ghost-train-sceaux-planche${nom}.png`) });
await nav.close(); srv.fermer?.();
if (erreurs.length) { console.log('✗', erreurs); process.exit(1); }
console.log(`✓ ${n} sceaux, docs/ghost-train-sceaux-planche${nom}.png`); process.exit(0);
