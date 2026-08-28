import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { servir } from "./serveur.mjs";

/* Les vues du jeu, une image par chose qu'on ne peut pas prouver au moteur.

   Un essai peut dire que la trainee de feu existe, que la glace fond, que le
   lucane est trois fois plus large. Aucun ne peut dire qu'on les VOIT. Ces
   captures sont la pour etre regardees. */

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

await p.goto(site.jeu, { waitUntil: "networkidle" });
await p.waitForTimeout(300);
/* ⚠️ L'ecran de choix se capture AVANT de cliquer sur Jouer : apres, il n'est
   plus la, et la vue montrait une partie en cours. */
await p.evaluate(() => { window.jeu.choisirPerso("chevalier"); });
await p.waitForTimeout(200);
await p.screenshot({ path: OUT + "choix.png" });

await p.click("#jouer");
await p.waitForTimeout(4200);             /* la roue du destin tourne */

/* Une capture ne doit pas dependre de la partie precedente : s'il est mort
   pendant la vue d'avant, on relance avant de mettre en place. */
async function vivant() {
  const fini = await p.evaluate(() => window.jeu.partie().fini);
  if (!fini) return;
  await p.click("#rejouer");
  await p.waitForTimeout(4200);
}

async function vue(nom, mise) {
  await vivant();
  await p.evaluate(mise);
  await p.waitForTimeout(260);
  /* une montee de niveau arrete le jeu et couvre l'ecran : on choisit et on
     continue, sinon la capture ne montre que trois cartes */
  for (let i = 0; i < 4; i++) {
    /* ⚠️ Les cartes existent dans la page meme quand l'ecran est cache : il
       faut demander si elles sont VISIBLES, sinon on attend trente secondes un
       clic sur un element invisible. */
    const carte = p.locator(".carte").first();
    if (!(await carte.isVisible().catch(() => false))) break;
    await carte.click();
    await p.waitForTimeout(200);
    await p.evaluate(mise);
    await p.waitForTimeout(200);
  }
  await p.screenshot({ path: OUT + nom + ".png" });
  return nom;
}

const faites = ["choix"];

/* le lucane, a cote d'un escargot pour l'echelle */
faites.push(await vue("lucane", () => {
  const g = window.jeu.partie();
  g.bestioles.length = 0;
  g.naitre("lucane");
  g.naitre("escargot");
  const [c, e] = g.bestioles;
  c.x = g.joueur.x + 110; c.y = g.joueur.y - 40; c.arrivee = -99;
  e.x = g.joueur.x + 110; e.y = g.joueur.y + 60; e.arrivee = -99;
}));

/* le lucane qui ecarte ses pinces : le preavis d'une seconde */
faites.push(await vue("lucane-pince", () => {
  const g = window.jeu.partie();
  g.bestioles[0].etat = "pince";
  g.bestioles[0].prochain = g.temps + 0.4;
}));

/* la trainee de feu du piment, en pleine course */
faites.push(await (async function () {
  await vivant();
  await p.evaluate(() => {
    const g = window.jeu.partie();
    g.bestioles.length = 0;
    g.objets.length = 0;
    g.objets.push({ sorte: "piment", x: g.joueur.x, y: g.joueur.y, r: 12 });
  });
  /* ⚠️ On le fait marcher au POUCE, pas en appelant `commander` : la boucle
     de la page reecrit la commande a chaque image depuis le joystick, donc un
     ordre donne de l exterieur ne survit pas une seule image. */
  const cx = 110, cy = 732 - 110;
  await p.mouse.move(cx, cy);
  await p.mouse.down();
  for (let i = 0; i < 64; i++) {
    const a = i * 0.1;
    await p.mouse.move(cx + Math.cos(a) * 60, cy + Math.sin(a) * 60);
    await p.waitForTimeout(26);
  }
  await p.mouse.up();
  await p.screenshot({ path: OUT + "piment.png" });
  return "piment";
})());

/* la limace : ses deux flaques doivent se distinguer d'un coup d'oeil, et le
   retrogradage doit se comprendre sans un mot */
faites.push(await vue("limace", () => {
  const g = window.jeu.partie();
  g.bestioles.length = 0;
  g.feux.length = 0; g.pimentJusqua = -1; g.etoileJusqua = -1;
  g.flaques.length = 0; g.crachats.length = 0;
  g.naitre("limace");
  const b = g.bestioles[0];
  b.x = g.joueur.x + 40; b.y = g.joueur.y - 150; b.arrivee = -99;
  b.angle = 1.9;
  b.etat = "gonfle"; b.tours = 3;
  g.flaques.push({ x: g.joueur.x - 110, y: g.joueur.y + 40, r: 46,
                   sorte: "glaire", ne: g.temps, i: 0.4 });
  g.flaques.push({ x: g.joueur.x + 30, y: g.joueur.y + 150, r: 46,
                   sorte: "acide", ne: g.temps, i: 1.9 });
  g.crachats.push({ depX: b.x, depY: b.y, x: g.joueur.x + 60, y: g.joueur.y - 40,
                    butX: g.joueur.x - 20, butY: g.joueur.y + 240,
                    haut: 40, ne: g.temps, sorte: "acide" });
}));

/* le retrogradage : il doit se comprendre SANS un mot, au dessus du chevalier */
faites.push(await vue("malus", () => {
  const g = window.jeu.partie();
  g.bestioles.length = 0;
  g.feux.length = 0; g.pimentJusqua = -1; g.etoileJusqua = -1;
  g.flaques.length = 0; g.crachats.length = 0;
  /* ⚠️ Sans arme a perdre, l'acide ne fait rien : il faut donc en monter une
     pour que la vue montre quelque chose. */
  const a = window.jeu.armes();
  a.donner("epee"); a.donner("epee"); a.donner("epee");
  g.flaques.push({ x: g.joueur.x + 20, y: g.joueur.y + 30, r: 46,
                   sorte: "acide", ne: g.temps, i: 1.9 });
}));

/* le pissenlit : on doit voir que c'est une PLANTE, pas une boule de pique */
faites.push(await vue("pissenlit", () => {
  const g = window.jeu.partie();
  g.bestioles.length = 0;
  g.feux.length = 0;
  g.pimentJusqua = -1;
  g.etoileJusqua = -1;
  ["pissenlit", "pissenlit", "escargot"].forEach((n) => g.naitre(n));
  g.bestioles.forEach((b, i) => {
    b.x = g.joueur.x - 80 + i * 90;
    b.y = g.joueur.y - 110;
    b.arrivee = -99;
    b.immobile = true;
  });
  g.bestioles[1].etat = "gonfle";
  g.bestioles[1].jusqua = g.temps + 5;
}));

/* les cinq fruits reunis : invincible, et il balaye tout ce qu'il touche */
faites.push(await vue("etoile", () => {
  const g = window.jeu.partie();
  g.bestioles.length = 0;
  g.feux.length = 0;                  /* pas de feu du piment sur cette vue */
  g.pimentJusqua = -1;
  Moteur.LEGUMES.forEach((n) => { g.panier[n] = true; });
  g.etoileJusqua = g.temps + 9;
  for (let i = 0; i < 7; i++) {
    g.naitre("escargot");
    const b = g.bestioles[i];
    const a = i * (6.2832 / 7);
    b.x = g.joueur.x + Math.cos(a) * 90;
    b.y = g.joueur.y + Math.sin(a) * 90;
    b.arrivee = -99;
  }
}));

/* le panier a moitie rempli : les cinq pastilles ne doivent pas se toucher */
faites.push(await vue("panier", () => {
  const g = window.jeu.partie();
  g.etoileJusqua = -1;
  g.bestioles.length = 0;
  g.panier = { carotte: true, tomate: true };
}));

/* la neige : les bestioles ont un halo bleu, et la glace s'accumule */
faites.push(await vue("neige", () => {
  const g = window.jeu.partie();
  g.commander({ angle: 0, avance: false });
  g.changerMeteo("neige");
  for (let i = 0; i < 60 * 40; i++) g.pas(1 / 60);
  g.bestioles.length = 0;
  g.naitre("escargot"); g.naitre("abeille"); g.naitre("herisson");
  g.bestioles.forEach((b, i) => {
    b.x = g.joueur.x - 70 + i * 70; b.y = g.joueur.y - 90; b.arrivee = -99;
  });
}));

/* le soleil apres la neige : la glace est encore la, et elle fond */
faites.push(await vue("fonte", () => {
  const g = window.jeu.partie();
  g.changerMeteo("beau");
  for (let i = 0; i < 60 * 3; i++) g.pas(1 / 60);
}));

/* la nuit : la lanterne, les lucioles, les graines qui luisent */
faites.push(await vue("nuit", () => {
  const g = window.jeu.partie();
  g.plaques.length = 0; g.flaques.length = 0; g.feux.length = 0;
  g.pimentJusqua = -1; g.etoileJusqua = -1;
  g.changerMeteo("nuit");
  g.bestioles.length = 0;
  for (let i = 0; i < 4; i++) {
    g.naitre("escargot");
    const b = g.bestioles[i];
    b.x = g.joueur.x - 130 + i * 110;
    b.y = g.joueur.y - 150;
    b.arrivee = -99; b.immobile = true;
  }
  for (let i = 0; i < 14; i++) {
    const a = i * 0.9;
    g.graines.push({ x: g.joueur.x + Math.cos(a) * (90 + i * 16),
                     y: g.joueur.y + Math.sin(a) * (60 + i * 12),
                     valeur: 1, r: 7, attiree: false });
  }
}));

/* l'orage : ses nuages projettent leur ombre, comme un vrai ciel charge */
faites.push(await vue("orage", () => {
  const g = window.jeu.partie();
  g.bestioles.length = 0; g.graines.length = 0;
  g.changerMeteo("orage");
  for (let i = 0; i < 60 * 4; i++) g.pas(1 / 60);
}));

/* la neige qui s'entasse, puis le soleil qui la fait fondre */
faites.push(await vue("neige-tas", () => {
  const g = window.jeu.partie();
  g.bestioles.length = 0; g.graines.length = 0;
  g.commander({ angle: 0, avance: false });
  g.changerMeteo("neige");
  for (let i = 0; i < 60 * 100; i++) {
    g.joueur.coeurs = g.joueur.coeursMax;
    if (g.meteo.nom !== "neige") g.changerMeteo("neige");
    g.pas(1 / 60);
  }
}));

faites.push(await vue("neige-fonte", () => {
  const g = window.jeu.partie();
  g.changerMeteo("beau");
  for (let i = 0; i < 60 * 6; i++) { g.joueur.coeurs = g.joueur.coeursMax; g.pas(1 / 60); }
}));

/* les nuages : leur ombre passe sur le sol */
faites.push(await vue("nuageux", () => {
  const g = window.jeu.partie();
  g.plaques.length = 0;
  g.changerMeteo("nuageux");
  /* on les laisse ou le moteur les a semees : c'est ce que l'enfant verra */
}));

/* le menu, avec l'interrupteur du mode d'essai */
await vivant();
await p.evaluate(() => window.jeu.menu("menuBouton"));
await p.waitForTimeout(300);
await p.click("#modeEssai");
await p.waitForTimeout(4600);
await p.evaluate(() => window.jeu.menu("menuBouton"));
await p.waitForTimeout(300);
await p.screenshot({ path: OUT + "menu.png" });
faites.push("menu");
await p.click("#modeNormal");
await p.waitForTimeout(4600);

/* le magicien et ses trois sorts, tous montes */
await p.evaluate(() => { window.jeu.choisirPerso("magicien"); });
await p.evaluate(() => window.jeu.menu("recommencer"));
await p.waitForTimeout(4600);
faites.push(await vue("magicien", () => {
  const g = window.jeu.partie();
  const a = window.jeu.armes();
  a.donner("souffle"); a.donner("souffle"); a.donner("souffle");
  a.donner("givre"); a.donner("givre");
  a.donner("piques"); a.donner("piques");
  g.bestioles.length = 0;
  g.feux.length = 0; g.flaques.length = 0; g.crachats.length = 0;
  g.etoileJusqua = -1; g.pimentJusqua = -1;
  for (let i = 0; i < 5; i++) {
    g.naitre("escargot");
    const b = g.bestioles[i];
    b.x = g.joueur.x + 90 + (i % 3) * 55;
    b.y = g.joueur.y - 60 + i * 34;
    b.arrivee = -99;
  }
  g.commander({ angle: 0.3, avance: false });
}));
/* les sorts en action : le souffle en flammeches, la fumee glacee, des
   bestioles gelees avec leurs eclats de givre */
faites.push(await vue("sorts", () => {
  const g = window.jeu.partie();
  const a = window.jeu.armes();
  a.donner("souffle");
  a.donner("givre");
  g.bestioles.length = 0;
  g.feux.length = 0; g.flaques.length = 0; g.crachats.length = 0;
  g.etoileJusqua = -1; g.pimentJusqua = -1;
  /* ⚠️ Elles doivent SURVIVRE a la capture : gelees puis tuees dans la meme
     seconde, on ne voyait aucun givre a l'image. */
  for (let i = 0; i < 6; i++) {
    g.naitre("escargot");
    const b = g.bestioles[i];
    const an = i * 1.047 + 0.4;
    b.x = g.joueur.x + Math.cos(an) * 110;
    b.y = g.joueur.y + Math.sin(an) * 110;
    b.arrivee = -99;
    b.vie = 9999;
    b.immobile = true;
    g.geler(b, 6);
  }
  g.commander({ angle: 0, avance: false });
}));

/* la flaque de la limace : elle ne doit plus passer pour un buisson */
faites.push(await vue("flaques", () => {
  const g = window.jeu.partie();
  g.bestioles.length = 0;
  g.feux.length = 0; g.crachats.length = 0; g.flaques.length = 0;
  g.etoileJusqua = -1; g.pimentJusqua = -1;
  g.flaques.push({ x: g.joueur.x - 100, y: g.joueur.y + 60, r: 46,
                   sorte: "glaire", ne: g.temps - 1, i: 0.4 });
  g.flaques.push({ x: g.joueur.x + 90, y: g.joueur.y + 150, r: 46,
                   sorte: "acide", ne: g.temps - 1, i: 1.9 });
}));

await p.evaluate(() => { window.jeu.choisirPerso("chevalier"); });

await navigateur.close();
site.arreter();

console.log(JSON.stringify({ vues: faites, erreurs }, null, 2));
console.log(erreurs.length
  ? "\nRATE : " + erreurs.join(" | ")
  : "\nOK : " + faites.length + " vues dans tools/captures/, aucune erreur de page.");
process.exit(erreurs.length ? 1 : 0);
