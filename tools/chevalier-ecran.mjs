/* LE JEU NE PEINT PAS PLUS DE PIXELS QU'IL N'EN FAUT, ET IL TIENT SUR UN GRAND ECRAN.

   « Un PC d'aujourd'hui fait tourner des mondes ouverts en 3D, et un jeu 2D fait
   ramer mon navigateur ? » Mesure du 2026-09-14, navigateur de test, ecran
   1920x1080 en densite 2 (un portable Retina, un ecran 4K a 200 %) :

                  avant    apres
       prairie    24-29    56-60 images par seconde
       ile        23-24    43-45
       volcan        18    50-51

   Deux causes, trouvees en retirant les couches une par une :
   - le canvas peignait 8,3 millions de pixels par image, huit fois un
     telephone. Le JavaScript ne bougeait pas (1,4 ms), la PEINTURE si.
     -> un budget de 2,6 millions de pixels ;
   - le decor fixe du sol (rides, dalles) etait retrace a chaque image sous la
     decoupe ronde de l'arene. -> peint une fois par tuile, puis recopie ; et les
     cocotiers de l'ile peints une fois en image.

   Ce controle garde les deux choses qui ne doivent pas bouger, et qui se
   verifient sans dependre de la vitesse de la machine :
     1. un grand ecran ne depasse pas le budget de pixels ;
     2. un telephone n'est PAS touche : il garde toute sa finesse.
   Les images par seconde sont affichees, pas exigees : elles dependent de la
   machine qui fait tourner le controle, et un seuil y serait un tirage au sort. */
import { chromium, devices } from './node_modules/playwright/index.mjs';
import { servir } from './serveur.mjs';

const BUDGET = 2600000;
const site = await servir();
const nav = await chromium.launch();
const erreurs = [];

async function mesurer(nom, options, monde) {
  const ctx = await nav.newContext(options);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => erreurs.push(String(e)));
  await page.goto(site.jeu, { waitUntil: 'networkidle' });
  const r = await page.evaluate(async (m) => {
    window.jeu.choisirPerso('chevalier'); window.jeu.choisirMonde(m); window.jeu.commencer(9);
    window.jeu.partie().joueur.invincibleJusqua = 1e9;
    await new Promise((ok) => setTimeout(ok, 1200));
    let n = 0; const t0 = performance.now();
    await new Promise((ok) => { (function f(){ n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else ok(); })(); });
    const cv = document.getElementById('jeu');
    return { l: cv.width, h: cv.height, css: [innerWidth, innerHeight], natif: devicePixelRatio, ips: Math.round(n / 3) };
  }, monde);
  await ctx.close();
  return { nom, monde, ...r };
}

const grand = { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 };
const lignes = [];
for (const monde of ['prairie', 'ile', 'volcan']) lignes.push(await mesurer('grand ecran', grand, monde));
const tel = await mesurer('telephone', { ...devices['Pixel 9'] }, 'volcan');
await nav.close();

lignes.concat([tel]).forEach((x) =>
  console.log(x.nom.padEnd(12) + x.monde.padEnd(8) + ' toile ' + x.l + 'x' + x.h +
              ' (' + (x.l * x.h / 1e6).toFixed(2) + ' M pixels)  ' + x.ips + ' images/s'));

const rates = [];
lignes.forEach((x) => {
  if (x.l * x.h > BUDGET * 1.02) rates.push('grand ecran ' + x.monde + ' : ' + (x.l * x.h / 1e6).toFixed(1) + ' M pixels, au-dela du budget');
});
const attendu = Math.round(tel.css[0] * Math.min(2, tel.natif)) * Math.round(tel.css[1] * Math.min(2, tel.natif));
if (tel.l * tel.h !== attendu) rates.push('le telephone a perdu de la finesse : ' + tel.l + 'x' + tel.h);
if (erreurs.length) rates.push('la page a leve ' + erreurs.length + ' erreur(s)');
rates.forEach((m) => console.log('RATE : ' + m));
console.log(rates.length ? '\nRATE' : '\nOK : un grand ecran reste sous le budget de pixels, et le telephone garde toute sa finesse.');
process.exit(rates.length ? 1 : 0);
