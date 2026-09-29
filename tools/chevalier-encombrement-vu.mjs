/* LE PIRE MOMENT, VU A L'ECRAN DU TELEPHONE.

   `chevalier-encombrement.mjs` compte ; celui-ci MONTRE. Il rejoue dans le
   vrai jeu l'instant garde par la mesure — celui ou le chevalier avait le
   plus de choses a decider a la fois — et en fait une capture.

   ⚠️ Un chiffre ne dit pas si un ecran reste lisible : « 21 choses a decider »
   ne se juge qu'en le regardant. Les projectiles des armes du chevalier ne
   sont pas rejoues : ils renaissent d'eux-memes des la premiere seconde. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "./node_modules/playwright/index.mjs";
import { servir } from "./serveur.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const photo = JSON.parse(fs.readFileSync(path.join(HERE, "captures", "encombrement-pire.json"), "utf8"));

const site = await servir();
const nav = await chromium.launch();
const page = await (await nav.newContext({ ...devices["Pixel 9"] })).newPage();
const erreurs = [];
page.on("pageerror", (e) => { erreurs.push(String(e)); console.log("ERREUR " + e); });
await page.goto(site.jeu, { waitUntil: "networkidle" });

await page.evaluate((p) => {
  window.jeu.choisirPerso("chevalier");
  window.jeu.choisirMonde(p.monde);
  window.jeu.commencer(1);
}, photo);
await page.waitForTimeout(400);

const pose = await page.evaluate((p) => {
  const partie = window.jeu.partie(), a = window.jeu.armes();
  /* la carte en cours, s'il y en a une, et rien ne doit plus monter de niveau */
  const c = document.querySelector("#cartes .carte");
  if (c) c.click();
  partie.intouchable = true;
  partie.temps = p.t;
  partie.niveau = p.niveau;
  a.armes.length = 0; a.objets.length = 0;
  p.armes.forEach((x) => { for (let i = 0; i < x.niveau; i++) a.donner(x.nom); });
  p.objets.forEach((x) => { for (let i = 0; i < x.niveau; i++) a.donnerObjet(x.nom); });
  partie.joueur.x = p.joueur.x; partie.joueur.y = p.joueur.y; partie.joueur.angle = p.joueur.angle;
  for (const b of partie.bestioles) b.vivante = false;
  partie.bestioles.length = 0;
  partie.graines.length = 0; partie.objets.length = 0; partie.tirs.length = 0;
  for (const b of p.bestioles) {
    const ne = partie.naitre(b.espece);
    if (!ne) continue;
    ne.arrivee = -99; ne.x = b.x; ne.y = b.y; ne.angle = b.angle;
  }
  for (const g of p.graines) partie.graines.push({ x: g.x, y: g.y, valeur: g.valeur, r: 5, attiree: false });
  for (const o of p.sol) partie.objets.push({ sorte: o.sorte, x: o.x, y: o.y, r: 12, ne: partie.temps });
  for (const t of p.tirs) partie.tirs.push({ x: t.x, y: t.y, vx: t.vx, vy: t.vy, r: t.r, vie: t.vie, couleur: t.couleur });
  return { bestioles: partie.bestioles.length, graines: partie.graines.length, tirs: partie.tirs.length };
}, photo);

/* une seconde de jeu : la camera rejoint le chevalier et les armes repartent */
await page.waitForTimeout(1000);
const vu = await page.evaluate(() => {
  const p = window.jeu.partie(), j = p.joueur, [L, H] = window.jeu.taille();
  const dans = (o) => Math.abs(o.x - j.x) <= L / 2 && Math.abs(o.y - j.y) <= H / 2;
  const pres = (o) => Math.hypot(o.x - j.x, o.y - j.y) <= 220;
  const hostiles = p.bestioles.filter((b) => b.vivante && dans(b))
    .concat(p.tirs.filter(dans), p.crachats.filter(dans), p.rochers.filter(dans));
  return {
    bestioles: p.bestioles.filter((b) => b.vivante && dans(b)).length,
    graines: p.graines.filter(dans).length,
    armes: window.jeu.armes().projectiles.filter(dans).length,
    aDecider: hostiles.filter(pres).length,
  };
});
const ou = path.join(HERE, "captures", "encombrement-pire.png");
await page.screenshot({ path: ou });
await nav.close();

console.log(JSON.stringify({ rejoue: pose, aLEcran: vu, photo: ou }, null, 2));
console.log(erreurs.length ? "\nRATE : " + erreurs.join(" ; ")
  : "\nOK : le pire moment mesure est rejoue et capture.");
process.exit(erreurs.length ? 1 : 0);
