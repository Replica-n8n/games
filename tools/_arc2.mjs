import { chromium, devices } from './node_modules/playwright/index.mjs';
const nav = await chromium.launch();
const page = await (await nav.newContext({ ...devices['Pixel 9'] })).newPage();
page.on('pageerror', e => console.log('ERREUR', String(e)));
page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
await page.goto('https://replica-n8n.github.io/games/serpentin/', { waitUntil: 'networkidle' });
console.log('version', await page.evaluate(() => window.jeu.version));
const pastilles = await page.evaluate(() => [...document.querySelectorAll('#mondes button, #mondes [role=radio]')].map(b => b.textContent.trim()));
console.log('pastilles', pastilles);
await page.locator('#mondes').getByText("L'île").click();
await page.locator('#jouer').click();
await page.waitForTimeout(5000);
await page.locator('#menuBouton').click({ force: true });
await page.locator('#laboOuvrir').click();
await page.locator('#laboLancer').click();
for (let k = 0; k < 4; k++) {
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const a = window.jeu.armes(), p = window.jeu.partie();
    return { monde: window.jeu.mondeCourant(), armes: a.armes.map(x => x.nom + x.niveau),
      fleches: a.projectiles.filter(q => q.forme === 'fleche').map(q => q.feu ? 'F' : 'n').join(''),
      explosions: p.explosions.length, tues: p.tues, pause: window.jeu.ecrans().pause };
  });
  console.log(JSON.stringify(r));
}
await page.screenshot({ path: 'captures/enligne-arc-ile.png' });
await nav.close(); process.exit(0);
