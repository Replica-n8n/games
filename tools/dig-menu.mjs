// DIG : le menu au doigt. L'accueil, les chaînes, les fouilles libres, l'étagère, la vitrine (admirer, rejouer).
// node tools/dig-menu.mjs
import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";
const srv = await servir(); const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const ctx = await nav.newContext({ ...devices['Pixel 7'], viewport: { width: 412, height: 860 } }); const p = await ctx.newPage();
const err = [], echecs = []; p.on('pageerror', (e) => err.push(e.stack));
const verifie = (nom, ok, d) => { console.log((ok ? 'OK    ' : 'ECHEC ') + nom + (d !== undefined ? ' : ' + JSON.stringify(d) : '')); if (!ok) echecs.push(nom); };
const photo = (n) => p.screenshot({ path: 'tools/captures/dig/menu-' + n + '.png' });
const vue = () => p.evaluate(() => document.getElementById('etagere').hidden ? null : [...document.querySelectorAll('#etagere section')].find((s) => !s.hidden).dataset.vue);
// la pioche et le pinceau sont-ils recouverts par le menu ?
const outilsCaches = () => p.evaluate(() => ['pioche', 'pinceau'].every((id) => { const b = document.getElementById(id).getBoundingClientRect(), e = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return !!e && !!e.closest('#etagere'); }));
const petits = () => p.evaluate(() => [...document.querySelectorAll('#etagere section:not([hidden]) button')].filter((b) => b.getClientRects().length).map((b) => b.getBoundingClientRect()).filter((r) => r.height < 44 || r.width < 44).length);
await p.goto(srv.base + 'dig/'); await p.waitForFunction(() => window.__essais); await p.waitForTimeout(600);

// 1. une première visite
verifie("on arrive sur l'accueil", await vue() === 'accueil');
verifie('accueil : ni pioche ni pinceau', await outilsCaches());
verifie('accueil : aucun bouton sous 44 px', await petits() === 0);
verifie('le bouton du bas propose de commencer', (await p.textContent('#continuer')).startsWith('Commencer'), await p.textContent('#continuer'));
await photo('1-accueil-vide');
await p.click('[data-aller="etagere"]');
verifie('étagère vide : elle le dit', (await p.textContent('#motEtagere')).includes('vide'));
await photo('2-etagere-vide');
await p.click('#etagere section:not([hidden]) .dos');
verifie("« Menu » ramène à l'accueil", await vue() === 'accueil');

// 2. au milieu du jeu : des trouvailles dans trois chaînes et une fouille libre
await p.evaluate(() => { fait.pompei = 4; fait.dite = 2; fait.tokyo = 1; libresFaits.add('dinosaure'); dernier = 'dite'; sauver(); ouvrirEtagere('accueil'); });
await p.waitForTimeout(500);
verifie('le bouton du bas reprend la dernière chaîne jouée', (await p.textContent('#continuer')) === 'Continuer : Dité (3 sur 4)', await p.textContent('#continuer'));
await photo('3-accueil');
await p.click('[data-aller="chaines"]'); await p.waitForTimeout(300);
verifie('chaînes : ni pioche ni pinceau', await outilsCaches());
verifie('chaînes : aucun bouton sous 44 px', await petits() === 0);
const suites = await p.evaluate(() => [...document.querySelectorAll('.rayon')].map((x) => (x.querySelector('.aller') || x.querySelector('.fini')).textContent).join('|'));
verifie('une chaîne finie le dit, les autres proposent la suite', suites === 'Chaîne complète|Continuer|Continuer|Commencer|Commencer', suites);
await photo('4-chaines');
await p.evaluate(() => document.querySelector('#etagere .dedans').scrollTo(0, 9999)); await p.waitForTimeout(200); await photo('4b-chaines-bas');
await p.evaluate(() => ouvrirEtagere('libres')); await p.waitForTimeout(300); await photo('5-libres');
await p.evaluate(() => ouvrirEtagere('etagere')); await p.waitForTimeout(300);
verifie('étagère : seulement les 8 trouvailles', await p.locator('#vitrines .case').count() === 8, await p.locator('#vitrines .case').count());
await photo('6-etagere');

// 3. la vitrine : admirer, rejouer
await p.click('#vitrines .case[data-i="1"]'); await p.waitForTimeout(900);
verifie("vitrine : « Rejouer » et « Retour » en bas, pas d'outils", await p.evaluate(() => ['rejouer', 'retour'].every((id) => document.getElementById(id).getClientRects().length) && ['pioche', 'pinceau'].every((id) => !document.getElementById(id).getClientRects().length)));
verifie('vitrine : aucune carte de fouille par-dessus', await p.evaluate(() => !document.getElementById('intro').getClientRects().length && !document.getElementById('fin').getClientRects().length));
await photo('7-vitrine');
await p.click('#rejouer'); await p.waitForTimeout(600);
verifie("rejouer lance la fouille, sans rien retirer de l'étagère", await p.evaluate(() => def.id === 'villa' && !document.getElementById('intro').hidden && fait.pompei === 4));
await photo('8-rejouer');
await p.click('#go'); await p.waitForTimeout(300);
verifie('en creusant : la pioche et le pinceau sont là', await p.evaluate(() => ['pioche', 'pinceau'].every((id) => { const el = document.getElementById(id), b = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(b.left + 20, b.top + 20)); })));
await p.click('#ouvrirEtagere'); await p.waitForTimeout(300);
verifie("« Menu » en jeu : l'accueil propose de reprendre", await vue() === 'accueil' && (await p.textContent('#continuer')) === 'Reprendre la fouille');
await photo('9-pause');
await p.click('#continuer');
verifie('reprendre referme le menu sur la même fouille', await vue() === null && await p.evaluate(() => def.id === 'villa' && phase === 'fouille'));

// 4. la progression et la dernière chaîne survivent au rechargement
await p.reload(); await p.waitForFunction(() => window.__essais); await p.waitForTimeout(500);
verifie('après rechargement : accueil, et la dernière chaîne jouée', await vue() === 'accueil' && (await p.textContent('#continuer')) === 'Continuer : Dité (3 sur 4)', await p.textContent('#continuer'));
await p.click('#continuer'); await p.waitForTimeout(500);
verifie('« Continuer » lance la bonne fouille', await p.evaluate(() => def.id === 'rempart' && !document.getElementById('intro').hidden));
await nav.close(); srv.arreter(); console.log(err.length ? err : 'aucune erreur'); process.exit(echecs.length || err.length ? 1 : 0);
