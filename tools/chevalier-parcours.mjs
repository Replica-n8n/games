import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { servir } from "./serveur.mjs";

/* Le parcours du jeu en Chromium, profil Pixel 9 (360 x 732 points CSS).
   Son telephone est un Pixel 9a, que Playwright ne connait pas : le Pixel 9 a
   la meme dalle et un ecran plus etroit, donc c'est le cas le plus dur pour
   placer un HUD.

   Ce que ce controle prouve : le jeu demarre, le pouce deplace le chevalier,
   les bestioles arrivent, les armes tuent, les graines se ramassent, la montee
   de niveau ARRETE le jeu et les trois cartes marchent, et la mort mene a
   l'ecran de fin. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "captures") + path.sep;
fs.mkdirSync(OUT, { recursive: true });

const site = await servir();
const navigateur = await chromium.launch();
const ctx = await navigateur.newContext({ ...devices["Pixel 9"] });
const p = await ctx.newPage();
const erreurs = [];
p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
p.on("pageerror", (e) => erreurs.push("pageerror: " + e.message));

const etat = () => p.evaluate(() => {
  const g = window.jeu.partie();
  return {
    temps: +g.temps.toFixed(1),
    bestioles: g.bestioles.length,
    graines: g.graines.length,
    tues: g.tues,
    xp: g.xp,
    niveau: g.niveau,
    coeurs: g.joueur.coeurs,
    x: +g.joueur.x.toFixed(0),
    y: +g.joueur.y.toFixed(0),
    fini: g.fini,
    projectiles: window.jeu.armes().projectiles.length,
    armes: window.jeu.armes().armes.map((a) => a.nom + " " + a.niveau),
    ecrans: window.jeu.ecrans(),
  };
});

await p.goto(site.jeu, { waitUntil: "networkidle" });
await p.waitForTimeout(300);
const auDepart = await etat();
await p.screenshot({ path: OUT + "chevalier-01-depart.png" });

/* on commence, graine fixe : un controle qui echoue doit etre rejouable */
await p.evaluate(() => window.jeu.commencer(2026));
await p.waitForTimeout(400);

/* le pouce tire vers le haut : le chevalier doit se deplacer */
const [, HAUT] = auDepart.ecrans ? await p.evaluate(() => window.jeu.taille()) : [0, 0];
const avantDeplacement = await etat();
await p.mouse.move(110, HAUT - 210);
await p.mouse.down();
await p.mouse.move(110, HAUT - 300, { steps: 6 });
await p.waitForTimeout(900);
const enMarche = await etat();
await p.mouse.up();

/* on laisse le jeu tourner : les armes tuent, les graines montent le niveau */
await p.waitForTimeout(2500);
const apresUnPeu = await etat();
await p.screenshot({ path: OUT + "chevalier-02-jeu.png" });

/* la montee de niveau : le jeu doit etre ARRETE pendant le choix */
let montee = null, avantChoix = null, apresChoix = null;
for (let i = 0; i < 40 && !montee; i++) {
  const e = await etat();
  if (e.ecrans.montee) montee = e;
  else await p.waitForTimeout(500);
}
if (montee) {
  await p.screenshot({ path: OUT + "chevalier-03-niveau.png" });
  avantChoix = await etat();
  await p.waitForTimeout(700);
  const pendant = await etat();
  montee.jeuArrete = Math.abs(pendant.temps - avantChoix.temps) < 0.05;
  await p.evaluate(() => window.jeu.choisir(0));
  await p.waitForTimeout(600);
  apresChoix = await etat();
}

/* la mort : on retire les coeurs et on attend l'ecran de fin */
await p.evaluate(() => { window.jeu.partie().joueur.coeurs = 1; });
await p.waitForTimeout(6000);
const apresMort = await etat();
await p.screenshot({ path: OUT + "chevalier-04-fin.png" });

await navigateur.close();
site.arreter();

const bilan = { auDepart, avantDeplacement, enMarche, apresUnPeu, montee, apresChoix, apresMort, erreurs };
console.log(JSON.stringify(bilan, null, 2));

const bouge = Math.hypot(enMarche.x - avantDeplacement.x, enMarche.y - avantDeplacement.y) > 60;
const ok =
  auDepart.ecrans.depart === true &&
  auDepart.ecrans.pause === true &&
  bouge &&
  apresUnPeu.bestioles > 5 &&
  apresUnPeu.tues > 0 &&
  apresUnPeu.xp > 0 &&
  !!montee &&
  montee.ecrans.cartes === 3 &&
  montee.jeuArrete === true &&
  apresChoix.ecrans.montee === false &&
  apresMort.fini === true &&
  apresMort.ecrans.fin === true &&
  erreurs.length === 0;

console.log(ok
  ? "\nOK : le chevalier bouge, les armes tuent, la montee de niveau arrete le jeu, et la mort mene a l'ecran de fin."
  : "\nRATE : voir le bilan ci dessus.");
process.exit(ok ? 0 : 1);
