import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from './serveur.mjs';

/* La maquette du boss pêché (tools/poc/peche/) jouée par deux robots, dans le navigateur :
   « enfant » garde le doigt posé TOUT le temps et suit le cercle de la pêche lentement, avec
   un temps de retard ; « malin » relâche quand le rayon chauffe et suit le cercle vite.
   On compte les lignes cassées, les surchauffes et les parties gagnées, et on capture
   les moments dans docs/ghost-train-peche/.
     node tools/ghost-train-peche-banc.mjs [parties] */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, '..', 'docs', 'ghost-train-peche');
mkdirSync(SORTIE, { recursive: true });
const N = Number(process.argv[2] || 12);
const srv = await servir();
const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await nav.newPage({ viewport: { width: 1280, height: 720 } });
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
await p.goto(srv.base + 'tools/poc/peche/?banc=' + Date.now());
await p.waitForFunction(() => window.__m);
await p.evaluate(() => { window.__fige = true; });

for (const niveau of ['enfant', 'malin']) {
  const r = await p.evaluate(({ niveau, N }) => {
    const malin = niveau === 'malin';
    // le doigt de la pêche : il voit le cercle avec un temps de retard et le rejoint à vitesse limitée
    const vu = [], doigt = { x: 160, y: 100 };
    const suivre = (J) => {
      const P = J.peche; vu.push([P.zx, P.zy]);
      const [cx, cy] = vu[Math.max(0, vu.length - 1 - Math.round((malin ? 0.2 : 0.45) * 60))];
      const dx = cx - doigt.x, dy = cy - doigt.y, d = Math.hypot(dx, dy), v = (malin ? 320 : 180) / 60;
      if (d > v) { doigt.x += dx / d * v; doigt.y += dy / d * v; } else { doigt.x = cx; doigt.y = cy; }
      return { x: doigt.x, y: doigt.y };
    };
    window.__pilote = (J) => {
      const vivants = J.ents.filter((e) => e.etat === 'vit');
      if (J.peche) return { rayon: suivre(J), torche: null };
      vu.length = 0; doigt.x = J.visee.x; doigt.y = J.visee.y;
      const assiette = vivants.filter((e) => e.type === 'assiette').sort((a, b) => b.k - a.k)[0];
      const ombre = vivants.find((e) => e.type === 'ombre' && e.revele <= 0 && e.s > (malin ? 0.8 : 1.2));
      const cible = assiette || vivants.filter((e) => e.type !== 'assiette' && (e.type !== 'ombre' || e.revele > 0)).sort((a, b) => b.s - a.s)[0];
      if (ombre && !assiette) return { rayon: { x: ombre.x, y: ombre.y }, torche: { suit: true, x: 0, y: 0 } };
      if (!cible) return { rayon: malin ? null : { x: J.visee.x, y: J.visee.y }, torche: null };
      if (malin && J.chauffe > 0.8 && !assiette) return { rayon: null, torche: null };
      return { rayon: { x: cible.x, y: cible.y }, torche: null };
    };
    const res = [];
    for (let k = 0; k < N; k++) {
      window.__m.nouvelle();
      let n = 0, debutPeche = 0, tPeche = 0;
      while (!window.__m.J.fin && n < 60 * 240) { window.__m.avancer(1); n++; if (window.__m.J.peche && !debutPeche) debutPeche = n; if (window.__m.J.peche) tPeche++; }
      const J = window.__m.J;
      res.push({ fin: J.fin || 'temps', s: Math.round(n / 60), casses: J.casses, surchauffes: J.surchauffes, echappes: J.echappes, coeurs: J.coeurs, peche: Math.round(tPeche / 60) });
    }
    window.__pilote = null;
    return res;
  }, { niveau, N });
  const g = r.filter((x) => x.fin === 'gagne').length, moy = (k) => (r.reduce((a, x) => a + x[k], 0) / r.length).toFixed(1);
  const premiere = r.filter((x) => x.casses === 0 && x.fin === 'gagne').length;
  console.log(`${niveau} : ${g}/${N} gagnées, pêché du premier coup ${premiere}/${N}, lignes cassées ${moy('casses')}, surchauffes ${moy('surchauffes')}, échappés ${moy('echappes')}, cœurs restants ${moy('coeurs')}, partie ${moy('s')} s dont pêche ${moy('peche')} s`);
  console.log('   ' + r.map((x) => `${x.fin[0]}${x.casses}`).join(' '));
}

// les captures : on joue en « malin » jusqu'aux moments voulus
const moments = [
  ['1-chauffe', (J) => J.tire && J.chauffe > 0.6 && !J.peche],
  ['2-torche', (J) => J.torche.on && J.ents.some((e) => e.type === 'ombre' && e.revele > 0)],
  ['3-avale', (J) => J.ents.some((e) => e.etat === 'cap' && e.tc > 0.25)],
  ['4-peche', (J) => J.peche && J.peche.bien && J.peche.prog > 0.3],
  ['5-coup', (J) => J.peche && J.peche.coup > 0.4],
  ['6-casse', (J) => J.textes.some((t) => t.s === 'LA LIGNE CASSE !' && t.t > 0.2)],
  ['7-panique', (J) => J.aspire && J.aspire.t > 0.3 && J.aspire.t < 0.45],
  ['8-tourbillon', (J) => J.aspire && J.aspire.t > 1.3],
  ['9-avale', (J) => J.aspire && J.aspire.t > 2.4],
  ['10-ca-cogne', (J) => J.aspire && J.aspire.bonk > 0.1],
  ['11-fin', (J) => J.fin && J.finT > 1],
];
const vus = new Set();
for (let essai = 0; essai < 6 && vus.size < moments.length; essai++) {
  await p.evaluate((casse) => {
    window.__m.nouvelle();
    window.__pilote = (J) => {
      const vivants = J.ents.filter((e) => e.etat === 'vit');
      if (J.fin) return { rayon: null, torche: null };
      // « casse » : il tire toujours à l'opposé, même quand le boss s'élance (la ligne casse)
      if (J.peche) { const P = J.peche, b = J.boss; return { rayon: casse && (P.coup > 0 || P.annonce) ? { x: b.x - P.dir * 46, y: P.zy } : { x: P.zx, y: P.zy }, torche: null }; }
      const assiette = vivants.filter((e) => e.type === 'assiette').sort((a, b) => b.k - a.k)[0];
      const ombre = vivants.find((e) => e.type === 'ombre' && e.revele <= 0 && e.s > 0.8);
      if (ombre && !assiette) return { rayon: { x: ombre.x, y: ombre.y }, torche: { suit: true, x: 0, y: 0 } };
      const cible = assiette || vivants.filter((e) => e.type !== 'assiette' && (e.type !== 'ombre' || e.revele > 0)).sort((a, b) => b.s - a.s)[0];
      return cible ? { rayon: { x: cible.x, y: cible.y + 2 }, torche: null } : { rayon: null, torche: null };
    };
  }, essai % 2 === 0);
  // le navigateur avance jusqu'au prochain moment pas encore vu, puis on capture
  const conds = '[' + moments.map(([n, c]) => `[${JSON.stringify(n)}, ${c.toString()}]`).join(',') + ']';
  for (;;) {
    const r = await p.evaluate(`(() => { const M = ${conds}, vus = ${JSON.stringify([...vus])};
      for (let n = 0; n < 60 * 240; n++) { window.__m.avancer(1); const J = window.__m.J;
        for (const [nom, c] of M) if (!vus.includes(nom) && c(J)) return nom;
        if (J.fin && J.finT > 1.5) return null; }
      return null; })()`);
    if (!r) break;
    await p.evaluate(() => window.__m.avancer(0, true));
    vus.add(r); await p.locator('#toile').screenshot({ path: path.join(SORTIE, r + '.png') });
  }
}
await nav.close();
srv.arreter();
const manque = moments.map(([n]) => n).filter((n) => !vus.has(n));
if (manque.length) console.log('moments jamais vus : ' + manque.join(', '));
if (erreurs.length) { console.log('✗ ' + erreurs.join('\n✗ ')); process.exit(1); }
console.log(`✓ ${vus.size} captures dans docs/ghost-train-peche/`);
