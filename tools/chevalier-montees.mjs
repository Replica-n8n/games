/* CE QUE CHAQUE MONTEE DE NIVEAU DONNE VRAIMENT, DANS UNE VRAIE PARTIE.

   Elle a joue en v57 et rapporte : « a chaque niveau 3 et 4 j'ai une barre
   verte qui me dit que j'ai gagne une amelioration alors que ce n'est pas
   celle que j'ai choisi », et « il n'y avait pas de coffre, juste quelques
   graines des 2-3 premiers mobs tues ».

   ⚠️ POURQUOI `chevalier-grappes.mjs` NE POUVAIT PAS LE VOIR : il met
   `xpBase = 1` et `xpFacteur = 1` pour FABRIQUER des grappes. Il prouve que
   le mecanisme marche ; il ne dit rien de sa FREQUENCE dans le vrai jeu. Ce
   banc-ci ne touche a aucun reglage.

   Il joue de vraies parties, sans toucher a un seul reglage, et note QUAND
   chaque niveau arrive et combien tombent dans la meme seconde.

   ⚠️ ET IL A MENTI UNE FOIS, le 2026-09-03 : son chevalier tournait en rond
   sans viser personne. Quatre parties de 45 s ne lui donnaient que SIX
   niveaux, quand elle en gagnait quatre en vingt-deux secondes. Un banc qui
   joue moins bien qu'elle ne mesure pas sa partie. Il FONCE donc sur la
   bestiole la plus proche : il tue, puis il passe sur les graines. */
import { chromium, devices } from './node_modules/playwright/index.mjs';
import { servir } from './serveur.mjs';

const DUREE = +(process.env.DUREE || 75);
const PARTIES = +(process.env.PARTIES || 5);
const MODE = process.env.MODE || 'difficile';

const site = await servir();
const nav = await chromium.launch();
const erreurs = [];
const parties = [];

for (let g = 0; g < PARTIES; g++) {
  const ctx = await nav.newContext({ ...devices['Pixel 9'], locale: 'fr-CA' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => erreurs.push(String(e)));
  await page.goto(site.jeu, { waitUntil: 'networkidle' });
  await page.evaluate((m) => {
    window.jeu.choisirPerso('chevalier');
    window.jeu.choisirMonde('prairie');
    if (m === 'difficile') window.jeu.choisirMode('difficile');
  }, MODE);
  await page.evaluate((s) => window.jeu.commencer(s), 1000 + g);

  await page.mouse.move(120, 640);
  await page.mouse.down();

  let niveau = 1, dernierEcran = -99, ecrans = 0;
  const montees = [];
  const debut = Date.now();
  let tour = 0;

  while (Date.now() - debut < DUREE * 1000) {
    tour++;
    /* on TIENT le manche et on tourne : un chevalier immobile ne ramasse rien */
    /* on vise la bestiole la plus proche : c'est ca, jouer */
    const cap = await page.evaluate(() => {
      const p = window.jeu.partie(), j = p.joueur;
      let m = null, dm = 1e9;
      for (const b of p.bestioles) {
        if (!b.vivante) continue;
        const d = Math.hypot(b.x - j.x, b.y - j.y);
        if (d < dm) { dm = d; m = b; }
      }
      /* a defaut, la graine la plus proche : ce sont elles qui font les niveaux */
      if (!m || dm > 500) for (const g of p.graines) {
        const d = Math.hypot(g.x - j.x, g.y - j.y);
        if (d < dm) { dm = d; m = g; }
      }
      return m ? Math.atan2(m.y - j.y, m.x - j.x) : null;
    });
    const a = cap === null ? tour * 0.09 : cap;
    await page.mouse.move(120 + Math.cos(a) * 115, 640 + Math.sin(a) * 115);
    const e = await page.evaluate(() => {
      const p = window.jeu.partie(), s = window.jeu.ecrans();
      return { t: +p.temps.toFixed(2), n: p.niveau, fini: p.fini,
               montee: s.montee, dus: s.niveauxDus,
               graines: p.graines ? p.graines.length : -1 };
    });
    if (e.fini) break;

    if (e.n > niveau) {
      for (let k = niveau + 1; k <= e.n; k++) montees.push({ niveau: k, t: e.t });
      niveau = e.n;
    }
    if (e.montee) {
      ecrans++;
      const libre = montees.filter((m) => !m.rendu);
      if (libre.length) libre[0].rendu = 'choix';
      dernierEcran = e.t;
      await page.evaluate(() => window.jeu.choisir(0));
      await page.waitForTimeout(340);   /* le repos de 260 ms entre deux cartes */
    }
    await page.waitForTimeout(60);
  }
  await page.mouse.up();
  parties.push({ graine: 1000 + g, niveaux: niveau - 1, ecrans, montees });
  await ctx.close();
}
await nav.close();

/* -------------------------------------------------------------- le rapport */
const toutes = parties.flatMap((p) => p.montees);
const parNiveau = {};
toutes.forEach((m) => {
  const c = (parNiveau[m.niveau] = parNiveau[m.niveau] || { choix: 0, quand: [] });
  c.choix++;
  c.quand.push(m.t);
});

console.log('\n' + PARTIES + ' parties de ' + DUREE + ' s, ' + MODE + ', chevalier, prairie\n');
console.log('niveau   fois   arrive vers');
Object.keys(parNiveau).map(Number).sort((a, b) => a - b).forEach((n) => {
  const c = parNiveau[n];
  const moy = (c.quand.reduce((a, b) => a + b, 0) / c.quand.length).toFixed(0);
  console.log(String(n).padStart(4) + String(c.choix).padStart(7) +
              ('   ' + moy + ' s').padStart(14));
});

/* la vraie question : combien de niveaux naissent dans la MEME seconde que le
   precedent ? C'est ca, une grappe, et c'est ca qui decide si l'ecran de choix
   doit dire « 1 sur 3 ». */
let ensemble = 0, plusRapide = 99;
parties.forEach((p) => {
  const t = p.montees.map((m) => m.t);
  for (let i = 1; i < t.length; i++) {
    if (t[i] - t[i - 1] < 1) ensemble++;
    plusRapide = Math.min(plusRapide, t[i] - t[i - 1]);
  }
});
console.log('\ntotal : ' + toutes.length + ' niveaux, dont ' + ensemble +
            ' a moins d une seconde du precedent (' +
            Math.round((ensemble / Math.max(1, toutes.length)) * 100) + ' %)');
console.log('le plus serre : ' + plusRapide.toFixed(2) + ' s entre deux niveaux');
const tot = parties.map((p) => p.niveaux + ' niveaux / ' + p.ecrans + ' ecrans').join('  |  ');
console.log('par partie : ' + tot);
if (erreurs.length) console.log('\nerreurs : ' + erreurs.slice(0, 3).join(' / '));
