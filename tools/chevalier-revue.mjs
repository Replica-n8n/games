import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { servir } from "./serveur.mjs";

/* La revue, dans un VRAI navigateur.

   Tout ce qu'on ne peut pas prouver au moteur seul : ce que coute une image,
   ce que le stockage coute vraiment, ce que la page garde en memoire, et ce
   qu'un pouce peut atteindre sur un Pixel 9.

   ⚠️ Node n'est pas un navigateur. Un `localStorage` simule en memoire coute
   deux millisecondes la ou celui de Chrome peut en couter cent. Ces mesures se
   font donc ici, pas dans un essai de moteur. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const site = await servir();
const navigateur = await chromium.launch();
const ctx = await navigateur.newContext({ ...devices["Pixel 9"] });
const p = await ctx.newPage();
const erreurs = [];
p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
p.on("pageerror", (e) => erreurs.push("pageerror: " + e.message));

await p.goto(site.jeu, { waitUntil: "networkidle" });
await p.waitForTimeout(300);

/* --------------------------------------------- 1. le cout du stockage */
const stockage = await p.evaluate(() => {
  const N = 60 * 480;                       /* une partie de huit minutes */
  const t0 = performance.now();
  for (let i = 0; i < N; i++) localStorage.getItem("chevalier.essai.v1");
  const t1 = performance.now();
  return { lectures: N, total: +(t1 - t0).toFixed(1), parImage: +((t1 - t0) / N).toFixed(4) };
});

await p.click("#jouer");
await p.waitForTimeout(4400);

/* --------------------------------------------- 2. le cout d'une image */
async function mesurerImages(etiquette) {
  return await p.evaluate(() => {
    const g = window.jeu.partie();
    /* on remplit l'ecran comme en fin de partie */
    while (g.bestioles.length < 60) g.naitre("escargot");
    const t0 = performance.now();
    for (let i = 0; i < 240; i++) { g.pas(1 / 60); }
    const t1 = performance.now();
    return { moteur: +((t1 - t0) / 240).toFixed(3), bestioles: g.bestioles.length };
  }).then((r) => ({ etiquette, ...r }));
}
const imagesNormal = await mesurerImages("normal");

/* --------------------------------------------- 3. ce que la page retient */
const fuites = await p.evaluate(() => {
  const g = window.jeu.partie();
  const avant = {
    projectiles: window.jeu.armes().projectiles.length,
    explosions: g.explosions.length,
    feux: g.feux.length,
    flaques: g.flaques.length,
    crachats: g.crachats.length,
    foudres: g.foudres.length,
    plaques: g.plaques.length,
    ombres: g.ombres.length,
    graines: g.graines.length,
    objets: g.objets.length,
  };
  /* ⚠️ IL DOIT RESTER EN VIE. Une partie finie fait sortir `pas()` tout de
     suite : sans ces deux lignes, on simule zero image et on conclut qu'il n'y
     a aucune fuite. C'est le piege qui a deja fausse trois mesures ici. */
  let images = 0;
  for (let i = 0; i < 60 * 200; i++) {
    g.joueur.coeurs = g.joueur.coeursMax;
    g.joueur.invincibleJusqua = g.temps + 1;
    if (g.fini) break;
    g.pas(1 / 60);
    images++;
  }
  const apres = {
    projectiles: window.jeu.armes().projectiles.length,
    explosions: g.explosions.length,
    feux: g.feux.length,
    flaques: g.flaques.length,
    crachats: g.crachats.length,
    foudres: g.foudres.length,
    plaques: g.plaques.length,
    ombres: g.ombres.length,
    graines: g.graines.length,
    objets: g.objets.length,
    bestioles: g.bestioles.length,
  };
  return { avant, apres, imagesSimulees: images, temps: Math.round(g.temps) };
});

/* --------------------------------------------- 4. ce qu'un pouce atteint */
/* ⚠️ Un bouton CACHE mesure zero par zero. Mesurer sans ouvrir son ecran
   d'abord donnait dix-huit faux griefs et zero vrai. On ouvre donc chaque
   ecran, on mesure ce qui s'y voit, et on referme. */
const mesurerVisibles = () => p.evaluate(() => {
  const sortie = [];
  const vu = (e, nom) => {
    const r = e.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;      /* pas a l'ecran */
    sortie.push({ nom: nom, l: Math.round(r.width), h: Math.round(r.height),
                  bas: Math.round(window.innerHeight - r.bottom) });
  };
  document.querySelectorAll("button, .perso, .carte").forEach((e) => {
    vu(e, e.id || e.className.split(" ")[0]);
  });
  return sortie;
});

const touchables = [];
const vus = new Set();
const ajouter = (liste) => liste.forEach((t) => {
  if (vus.has(t.nom)) return;
  vus.add(t.nom);
  touchables.push(t);
});

/* le menu */
await p.evaluate(() => window.jeu.menu("menuBouton"));
await p.waitForTimeout(250);
ajouter(await mesurerVisibles());
await p.evaluate(() => window.jeu.menu("fermer"));
await p.waitForTimeout(250);

/* les cartes de montee de niveau */
await p.evaluate(() => {
  const g = window.jeu.partie();
  g.xp += g.xpProchain * 3;
});
await p.waitForTimeout(1600);
ajouter(await mesurerVisibles());
const carteVisible = await p.evaluate(() => !!document.querySelector(".carte") &&
  document.querySelector(".carte").getBoundingClientRect().height > 0);
if (carteVisible) { await p.click(".carte"); await p.waitForTimeout(300); }

/* l'ecran de fin */
await p.evaluate(() => {
  const g = window.jeu.partie();
  g.joueur.coeurs = 1;
  g.joueur.invincibleJusqua = 0;
  if (!g.bestioles.length) g.naitre("escargot");
  const b = g.bestioles[0];
  b.x = g.joueur.x; b.y = g.joueur.y; b.arrivee = -99;
});
await p.waitForTimeout(2500);
ajouter(await mesurerVisibles());

/* et l'ecran de depart, sur une page neuve */
await p.goto(site.jeu, { waitUntil: "networkidle" });
await p.waitForTimeout(400);
ajouter(await mesurerVisibles());

await navigateur.close();
site.arreter();

/* --------------------------------------------- le verdict */
const griefs = [];

/* ⚠️ Une lecture de stockage par image est un acces synchrone dans la boucle
   de dessin. Le seuil est bas a dessein : rien de synchrone n'a sa place la. */
if (stockage.parImage * 60 > 0.5) {
  griefs.push("le stockage coute " + (stockage.parImage * 60).toFixed(2) +
              " ms par seconde de jeu, lu depuis la boucle de dessin");
}

if (imagesNormal.moteur > 4) {
  griefs.push("le moteur prend " + imagesNormal.moteur + " ms par image a " +
              imagesNormal.bestioles + " bestioles (budget 16,7)");
}

/* ⚠️ Ce qui ne se vide jamais finit par tout ralentir. Un tableau qui grossit
   sans plafond sur huit minutes est une fuite, meme si personne ne la voit. */
/* ⚠️ Et on verifie que la mesure a bien TOURNE avant de la croire. */
if (fuites.imagesSimulees < 60 * 150) {
  griefs.push("la mesure de fuites n a simule que " + fuites.imagesSimulees +
              " images : elle ne prouve rien");
}
Object.keys(fuites.apres).forEach((k) => {
  if (k === "bestioles") return;
  const n = fuites.apres[k];
  const plafonds = { graines: 400, objets: 40, feux: 80, flaques: 40, plaques: 40,
                     ombres: 20, crachats: 20, foudres: 20, projectiles: 200,
                     explosions: 40 };
  if (n > (plafonds[k] || 50)) {
    griefs.push(k + " a atteint " + n + " apres 200 s sans etre ramasse : plafond " +
                (plafonds[k] || 50));
  }
});

/* ⚠️ 44 points CSS, c'est le minimum tenable au pouce. En dessous, un enfant
   de 8 ans rate la cible. */
if (!touchables.length) griefs.push("aucune cible mesuree : le controle ne prouve rien");
touchables.forEach((t) => {
  if (t.h < 44) griefs.push(t.nom + " ne fait que " + t.h + " points de haut (44 minimum)");
  if (t.l < 44) griefs.push(t.nom + " ne fait que " + t.l + " points de large");
});

console.log(JSON.stringify({ stockage, imagesNormal, fuites, touchables, erreurs }, null, 2));
console.log(griefs.length
  ? "\nRATE :\n  - " + griefs.join("\n  - ")
  : "\nOK : stockage, images, memoire et cibles au pouce, tout tient.");
process.exit(griefs.length || erreurs.length ? 1 : 0);
