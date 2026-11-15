// Crownfall : un robot joue des parties ENTIÈRES par l'écran (clics sur les
// cartes et les boutons, jamais d'appel direct au moteur pour jouer), jusqu'à
// l'écran de fin. Échoue sur une erreur de console, un écran bloqué, ou un coup
// que l'interface refuse alors que le moteur l'accepte.
//   node tools/crownfall-parcours.mjs [parties=3] [--captures dossier]
import { chromium } from 'playwright';
import { servir as demarrer } from './serveur.mjs';

const args = process.argv.slice(2);
const PARTIES = Number(args.find((a) => /^\d+$/.test(a)) || 3);
const iCap = args.indexOf('--captures');
const CAPTURES = iCap >= 0 ? args[iCap + 1] : null;

const srv = await demarrer();
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: 360, height: 732 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const erreurs = [];
page.on('pageerror', (e) => erreurs.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
await page.goto(srv.base + 'crownfall/');
await page.waitForFunction(() => window.__crownfall);

const capturees = new Set();
async function capture(nom) {
  if (!CAPTURES || capturees.has(nom)) return;
  capturees.add(nom);
  await page.screenshot({ path: `${CAPTURES}/crownfall-${nom}.png` });
}

const calme = () => page.waitForFunction(() => !window.__crownfall.occupe(), null, { timeout: 15000 });

// Choisit un coup avec le moteur de la page (lecture seule), puis le JOUE par clics.
const choisir = () => page.evaluate(() => {
  const { etat, moteur: M } = window.__crownfall;
  const e = etat();
  const acts = M.actionsLegales(e);
  if (e.phase === 'jouer') {
    const coups = acts.filter((a) => a.type === 'jouer').map((a) => ({ a, p: M.apercu(e, a.cartes) }));
    const surs = coups.filter((c) => c.p.couverture !== 'non');
    const note = (c) => (c.p.exact ? 1000 : 0) + (c.p.vaincu ? 500 : 0) - c.p.riposte * 3 + c.p.degats - c.a.cartes.length;
    const pool = surs.length ? surs : (e.jokers ? [] : coups);
    if (!pool.length) return { type: 'joker' };
    pool.sort((x, y) => note(y) - note(x));
    return pool[0].a;
  }
  const d = acts.filter((a) => a.type === 'defausser');
  if (!d.length) return { type: 'joker' };
  const tot = (a) => a.cartes.reduce((t, id) => t + M.carte(id).valeur, 0);
  d.sort((x, y) => tot(x) - tot(y) || x.cartes.length - y.cartes.length);
  return d[0];
});

let victoires = 0, coups = 0;
for (let p = 0; p < PARTIES; p++) {
  await page.click('[data-act=jouer]');
  await calme();
  await capture('combat-debut');
  for (let n = 0; n < 400; n++) {
    const ecran = await page.evaluate(() => window.__crownfall.ecran());
    if (ecran === 'fin') break;
    const a = await choisir();
    if (a.type === 'joker') {
      await page.click('[data-act=joker]');
      await capture('joker');
      await page.click('[data-act=utiliserJoker]');
    } else {
      for (const id of a.cartes) {
        await page.click(`.main [data-carte="${id}"]`);
      }
      const sel = await page.evaluate(() => window.__crownfall.selection());
      if (sel.sort().join() !== [...a.cartes].sort().join()) throw new Error(`sélection ${sel} au lieu de ${a.cartes}`);
      if (a.type === 'jouer') { await capture('choix'); await page.click('[data-act=attaquer]'); }
      else { await capture('ecu'); await page.click('[data-act=encaisser]'); }
    }
    coups++;
    await calme();
    if (erreurs.length) throw new Error(erreurs.join('\n'));
  }
  const fin = await page.evaluate(() => window.__crownfall.etat().fin);
  if (!fin) throw new Error('partie bloquée sans fin');
  if (fin.issue === 'gagne') victoires++;
  await capture(fin.issue === 'gagne' ? 'victoire' : 'defaite');
  await page.click('[data-act=accueil]');
  await capture('accueil');
}
console.log(JSON.stringify({ parties: PARTIES, victoires, coups, erreurs }));
await nav.close();
srv.arreter();
if (erreurs.length) process.exit(1);
