/* LE CHAT GEANT, DE BOUT EN BOUT, DANS LE VRAI NAVIGATEUR.

   Le moteur est prouve par `chevalier-moteur.mjs` (les trois pattes, le calme,
   l'invocation qui epargne le boss). Ce controle-ci prouve ce que l'enfant
   VOIT et TOUCHE : le bouton n'existe pas tant que les trois pattes ne sont
   pas la, il apparait quand elles le sont, le toucher ARRETE le jeu le temps
   de la mise en scene, et on ressort sur un ecran vide ou toutes les graines
   volent vers le chevalier. Les captures `chat-*.png` montrent chaque etape.

   ⚠️ `force: true` sur le clic : le bouton BAT comme un coeur, et Playwright
   refuse de cliquer ce qui bouge. Un enfant, lui, n'a aucun mal. */
import { chromium, devices } from './node_modules/playwright/index.mjs';
import { servir } from './serveur.mjs';
const site = await servir();
const nav = await chromium.launch();
const ctx = await nav.newContext({ ...devices['Pixel 9'], locale: 'fr-CA' });
const page = await ctx.newPage();
const erreurs = [];
page.on('pageerror', (e) => { erreurs.push(String(e)); console.log('ERREUR ' + e); });
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ' + m.text()); });
await page.goto(site.jeu, { waitUntil: 'networkidle' });
await page.evaluate(() => { window.jeu.choisirPerso('chevalier'); window.jeu.choisirMonde('prairie'); window.jeu.commencer(12); });
await page.waitForTimeout(400);
const auDepart = await page.evaluate(() => !document.getElementById('boutonChat').hidden);

/* 1. les pattes en cours, et le chaton apparu hors ecran : la fleche */
await page.evaluate(() => {
  const p = window.jeu.partie();
  p.joueur.invincibleJusqua = 1e9;
  window.jeu.armes().armes.length = 0;
  p.tues = Math.round(p.chat.objectifTues * .6);
  p.chat.serie = p.chat.objectifSerie * .35;
  p.temps = p.chat.chatonA + 0.01;
});
await page.waitForTimeout(500);
await page.screenshot({ path: 'captures/chat-1-pattes.png' });

/* 2. le chaton a l ecran */
await page.evaluate(() => {
  const p = window.jeu.partie(), k = p.chat.chaton;
  p.joueur.x = k.x - 110; p.joueur.y = k.y + 60;
});
await page.waitForTimeout(500);
await page.screenshot({ path: 'captures/chat-2-chaton.png' });

/* 3. les trois pattes : le bouton bat */
await page.evaluate(() => {
  const p = window.jeu.partie();
  p.tues = p.chat.objectifTues;
  p.chat.serie = p.chat.objectifSerie;
  const k = p.chat.chaton; p.joueur.x = k.x; p.joueur.y = k.y;
  const j = p.joueur;
  for (let i = 0; i < 18; i++) {
    p.naitre(['escargot', 'abeille', 'herisson'][i % 3]);
    const b = p.bestioles[p.bestioles.length - 1];
    b.arrivee = -99; b.immobile = true;
    b.x = j.x + Math.cos(i * .7) * (110 + i * 14); b.y = j.y + Math.sin(i * .7) * (110 + i * 14) * 1.5;
  }
});
await page.waitForTimeout(600);
const bouton = await page.evaluate(() => !document.getElementById('boutonChat').hidden);
await page.screenshot({ path: 'captures/chat-3-pret.png' });

/* 4. l invocation, image par image */
const avant = await page.evaluate(() => window.jeu.partie().bestioles.filter((b) => b.vivante).length);
await page.click('#boutonChat', { force: true });   /* il bat : Playwright le croit instable */
let pendant = null;
for (const [nom, ms] of [['monte', 350], ['griffe1', 500], ['griffe2', 420], ['final', 440], ['repart', 500]]) {
  await page.waitForTimeout(ms);
  if (!pendant) pendant = await page.evaluate(() => ({ en: window.jeu.invocation(), pause: window.jeu.ecrans().pause }));
  await page.screenshot({ path: 'captures/chat-4-' + nom + '.png' });
}
/* on attend la FIN de la mise en scene, quelle que soit sa duree */
await page.waitForFunction(() => !window.jeu.invocation(), null, { timeout: 8000 });
await page.waitForTimeout(150);
const apres = await page.evaluate(() => ({
  vivantes: window.jeu.partie().bestioles.filter((b) => b.vivante).length,
  attirees: window.jeu.partie().graines.filter((g) => g.attiree).length,
  graines: window.jeu.partie().graines.length,
  utilise: window.jeu.partie().chat.utilise,
  pause: window.jeu.ecrans().pause,
  bouton: !document.getElementById('boutonChat').hidden,
}));
await page.waitForTimeout(900);
await page.screenshot({ path: 'captures/chat-5-graines.png' });
await nav.close();

const controles = [
  ["le bouton du chat est cache au debut de la partie", !auDepart],
  ["il apparait quand les trois pattes sont la", bouton],
  ["le toucher lance l invocation et arrete le jeu", !!pendant && pendant.en && pendant.pause],
  ["le coup de patte vide l ecran", apres.vivantes === 0],
  ["toutes les graines volent vers le chevalier", apres.graines > 0 && apres.attirees === apres.graines],
  ["le jeu reprend et le bouton disparait : une seule fois par partie", apres.utilise && !apres.pause && !apres.bouton],
  ["la page n a leve aucune erreur", erreurs.length === 0],
];
const rates = controles.filter(([, v]) => !v).map(([n]) => n);
rates.forEach((m) => console.log('RATE : ' + m));
console.log(rates.length ? 'RATE : ' + rates.length + ' controle(s)'
  : 'OK : le bouton attend les trois pattes, le chat vide l ecran, les graines arrivent, et il ne sert qu une fois.');
process.exit(rates.length ? 1 : 0);
