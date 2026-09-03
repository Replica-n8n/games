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

/* ⚠️ `attente` existe pour UNE raison : le vent tranchant n'existe que
   pendant qu'on court, et sa trainee met le temps de sa duree a se former.
   Capture au bout de 260 ms, on n'en voyait qu'un moignon. */
async function vue(nom, mise, attente = 260, geste = null) {
  await vivant();
  await p.evaluate(mise);
  /* ⚠️ `geste` existe parce que la page REPREND LA MAIN a chaque image : elle
     rappelle `commander` avec l'etat du manche, donc un `commander` pose
     depuis la console est efface au 16e de seconde suivant. Pour capturer une
     arme qui n'existe qu'en courant, il faut vraiment POUSSER LE MANCHE. */
  if (geste) await geste();
  await p.waitForTimeout(attente);
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

/* LA SALAMANDRE. Elle remplace le piment : le feu ne sort plus des pieds du
   chevalier, il sort des siens. La vue doit montrer les deux choses qu'on ne
   peut pas prouver par un chiffre — qu'elle se lit comme une salamandre, et
   que sa trainee reste PRES du chevalier, qui lui n'a pas bouge. */
faites.push(await (async function () {
  await vivant();
  await p.evaluate(() => {
    const g = window.jeu.partie();
    g.bestioles.length = 0;
    g.objets.length = 0;
    g.feux.length = 0;
    g.objets.push({ sorte: "salamandre", x: g.joueur.x, y: g.joueur.y, r: 12 });
    /* de quoi la faire courir : elle charge la plus proche */
    for (let i = 0; i < 5; i++) {
      const b = g.naitre("escargot");
      const an = i * 1.257;
      b.x = g.joueur.x + Math.cos(an) * 150;
      b.y = g.joueur.y + Math.sin(an) * 150;
      b.arrivee = -99; b.vie = 9999; b.immobile = true;
    }
  });
  await p.waitForTimeout(2200);       /* elle court, LUI ne bouge pas */
  await p.screenshot({ path: OUT + "salamandre.png" });
  return "salamandre";
})());

/* la meme, endormie dans l'herbe : c'est ce qu'on ramasse, et il ne faut pas
   la prendre pour un ennemi */
faites.push(await vue("salamandre-endormie", () => {
  const g = window.jeu.partie();
  g.bestioles.length = 0;
  g.objets.length = 0;
  g.feux.length = 0;
  g.salamandres.length = 0;
  for (let i = 0; i < 3; i++) {
    g.objets.push({ sorte: "salamandre", x: g.joueur.x + 90 + i * 80,
                    y: g.joueur.y - 40 + i * 50, r: 12 });
  }
  /* un crapaud a cote, pour comparer : c'est LUI qu'on pourrait confondre */
  const c = g.naitre("crapaud");
  c.x = g.joueur.x - 110; c.y = g.joueur.y + 40; c.arrivee = -99;
}, 500));

/* la limace : ses deux flaques doivent se distinguer d'un coup d'oeil, et le
   retrogradage doit se comprendre sans un mot */
faites.push(await vue("limace", () => {
  const g = window.jeu.partie();
  g.bestioles.length = 0;
  g.feux.length = 0; g.salamandres.length = 0; g.etoileJusqua = -1;
  g.flaques.length = 0; g.crachats.length = 0;
  g.naitre("limace");
  const b = g.bestioles[0];
  b.x = g.joueur.x + 175; b.y = g.joueur.y - 205; b.arrivee = -99;
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
  g.feux.length = 0; g.salamandres.length = 0; g.etoileJusqua = -1;
  g.flaques.length = 0; g.crachats.length = 0;
  /* ⚠️ Sans arme a perdre, l'acide ne fait rien : il faut donc en monter une
     pour que la vue montre quelque chose. */
  const a = window.jeu.armes();
  a.donner("epee"); a.donner("epee"); a.donner("epee");
  g.flaques.push({ x: g.joueur.x + 20, y: g.joueur.y + 30, r: 46,
                   sorte: "acide", ne: g.temps, i: 1.9 });
}));

/* les escargots, vus de pres : coquille, corps, antennes et bave */
faites.push(await vue("escargot", () => {
  const g = window.jeu.partie();
  g.bestioles.length = 0;
  g.feux.length = 0; g.flaques.length = 0; g.crachats.length = 0;
  g.etoileJusqua = -1; g.salamandres.length = 0;
  for (let i = 0; i < 5; i++) {
    g.naitre("escargot");
    const b = g.bestioles[i];
    const an = i * 1.257;
    b.x = g.joueur.x + Math.cos(an) * 120;
    b.y = g.joueur.y + Math.sin(an) * 120;
    b.angle = an + Math.PI;
    b.arrivee = -99; b.vie = 999; b.immobile = true;
  }
}));

/* le crapaud et le herisson, dans leurs deux etats chacun */
faites.push(await vue("crapaud-herisson", () => {
  const g = window.jeu.partie();
  g.bestioles.length = 0;
  g.feux.length = 0; g.flaques.length = 0; g.crachats.length = 0;
  g.etoileJusqua = -1; g.salamandres.length = 0;
  /* ⚠️ Le moteur ne laisse jamais plus de TROIS individus vivants : demander
     quatre crapauds et herissons en rend trois, et le quatrieme n'existe pas.
     On pose donc a la main ce que `naitre` a bien voulu rendre, et on complete
     en copiant — c'est une vue, pas une partie. */
  const modele = {};
  ["crapaud", "herisson"].forEach((n) => {
    g.bestioles.length = 0;
    g.naitre(n);
    modele[n] = g.bestioles[0];
  });
  g.bestioles.length = 0;
  ["crapaud", "crapaud", "herisson", "herisson"].forEach((n, i) => {
    const b = Object.assign({}, modele[n]);
    /* ⚠️ On ne peut pas poser l'etat a la main : `penser` le recalcule a
       chaque image. On regle donc ce dont il DEPEND — l'heure du prochain
       crachat pour le crapaud, la distance pour le herisson, qui se met en
       boule des qu'on est a moins de 210. */
    const prevenir = (i % 2) === 1;
    b.x = g.joueur.x - 105 + (i % 2) * 210;
    b.y = g.joueur.y - 120 + Math.floor(i / 2) * 260;
    if (n === "herisson" && !prevenir) {
      b.x = g.joueur.x - 130; b.y = g.joueur.y + 330;   /* trop loin pour se rouler */
    }
    b.arrivee = -99; b.vie = 999;
    b.angle = 0.6;
    if (n === "crapaud") {
      b.immobile = true;
      b.prochain = g.temps + (prevenir ? 0.4 : 6);
    } else {
      b.etat = prevenir ? "prepare" : "approche";
      b.jusqua = g.temps + 6;
      b.immobile = prevenir;
    }
    g.bestioles.push(b);
  });
}));

/* les deux personnages debout, cote a cote, a l'arret et en marche */
faites.push(await vue("persos", () => {
  const g = window.jeu.partie();
  g.bestioles.length = 0; g.graines.length = 0;
  g.feux.length = 0; g.flaques.length = 0; g.crachats.length = 0;
  g.etoileJusqua = -1; g.salamandres.length = 0;
  g.commander({ angle: 0, avance: false });
}));

/* le pissenlit : on doit voir que c'est une PLANTE, pas une boule de pique */
faites.push(await vue("pissenlit", () => {
  const g = window.jeu.partie();
  g.bestioles.length = 0;
  g.feux.length = 0;
  g.salamandres.length = 0;
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
  g.feux.length = 0;                  /* pas de feu de salamandre sur cette vue */
  g.salamandres.length = 0;
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
  g.salamandres.length = 0; g.etoileJusqua = -1;
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
/* LA PLUIE FAIT POUSSER LES PISSENLITS. « J'ai joue sous la pluie et j'ai vu
   aucun pissenlit » : la vue existe pour qu'on n'ait plus jamais a le
   decouvrir en jouant. */
faites.push(await vue("pluie", () => {
  const g = window.jeu.partie();
  window.jeu.changerLeTemps("pluie");
  g.bestioles.length = 0;
  g.feux.length = 0; g.flaques.length = 0; g.crachats.length = 0;
  g.etoileJusqua = -1; g.salamandres.length = 0;
}, 3000));

faites.push(await vue("nuageux", () => {
  const g = window.jeu.partie();
  g.plaques.length = 0;
  g.changerMeteo("nuageux");
  /* on les laisse ou le moteur les a semees : c'est ce que l'enfant verra */
}));

/* Le menu, et l'ecran de depart avec sa bascule Normal / Difficile.
   ⚠️ La bascule a DEMENAGE du menu vers l'ecran de choix du personnage : on
   passe donc par « Recommencer », qui ramene precisement la. Cliquee dans le
   menu, elle etait introuvable et la capture mourait sur un bouton invisible. */
await vivant();
await p.evaluate(() => window.jeu.menu("menuBouton"));
await p.waitForTimeout(300);
await p.screenshot({ path: OUT + "menu.png" });
faites.push("menu");

await p.click("#recommencer");
await p.waitForTimeout(400);
await p.screenshot({ path: OUT + "depart.png" });
faites.push("depart");
await p.click("#modeEssai");
await p.waitForTimeout(200);
await p.screenshot({ path: OUT + "depart-difficile.png" });
faites.push("depart-difficile");
await p.click("#modeNormal");
await p.waitForTimeout(200);
await p.click("#jouer");
await p.waitForTimeout(4600);

/* le magicien et ses trois sorts, tous montes */
/* LE PAPILLON et sa trainee de nuees toxiques. Il faut voir les trois etats
   d'un coup : une nuee qui s'ouvre encore (pale, petite, inoffensive), deux
   ouvertes (vertes, avec leurs bulles), et l'insecte au bout de sa trainee. */
faites.push(await vue("papillon", () => {
  const g = window.jeu.partie();
  g.bestioles.length = 0;
  g.feux.length = 0; g.flaques.length = 0; g.crachats.length = 0;
  g.nuees.length = 0;
  g.etoileJusqua = -1; g.salamandres.length = 0;
  g.naitre("papillon");
  const b = g.bestioles[0];
  b.arrivee = -99;
  b.x = g.joueur.x + 40; b.y = g.joueur.y - 150;
  b.vie = 999;
  /* la trainee deja posee, a trois ages differents */
  for (let i = 0; i < 3; i++) {
    g.nuees.push({ x: g.joueur.x + 30 - i * 82, y: g.joueur.y - 140 + i * 50,
                   /* la plus proche de lui est la plus JEUNE : c'est lui qui
                      vient de la poser, et elle s'ouvre encore */
                   r: 54, ne: g.temps - (0.3 + i * 1.3), i: i * 2.1 });
  }
  g.joueur.invincibleJusqua = g.temps + 5;
}, 500));

/* LA CHAUSSE-TRAPPE : elle aussi ne travaille qu'en marchant, mais a
   l'envers du vent — elle RESTE et mord ce qui vient derriere. */
faites.push(await vue("trappe", () => {
  const g = window.jeu.partie();
  const a = window.jeu.armes();
  a.armes.length = 0;
  a.donner("trappe"); a.donner("trappe"); a.donner("trappe");
  g.bestioles.length = 0;
  g.feux.length = 0; g.flaques.length = 0; g.crachats.length = 0;
  g.etoileJusqua = -1; g.salamandres.length = 0;
  for (let i = 0; i < 5; i++) {
    g.naitre("escargot");
    const b = g.bestioles[i];
    b.x = g.joueur.x - 70 - i * 40;
    b.y = g.joueur.y + (i % 2 ? 14 : -14);
    b.arrivee = -99;
    b.vie = 9999;
    b.immobile = true;
  }
}, 3200, async () => {
  await p.mouse.move(150, 700);
  await p.mouse.down();
  await p.mouse.move(300, 700, { steps: 4 });
}));
await p.mouse.up();

await p.evaluate(() => { window.jeu.choisirPerso("magicien"); });
await p.evaluate(() => window.jeu.menu("recommencer"));
await p.waitForTimeout(400);
await p.click("#jouer");
await p.waitForTimeout(4600);
faites.push(await vue("magicien", () => {
  const g = window.jeu.partie();
  const a = window.jeu.armes();
  a.donner("souffle"); a.donner("souffle"); a.donner("souffle");
  a.donner("givre"); a.donner("givre");
  a.donner("piques"); a.donner("piques");
  g.bestioles.length = 0;
  g.feux.length = 0; g.flaques.length = 0; g.crachats.length = 0;
  g.etoileJusqua = -1; g.salamandres.length = 0;
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
  g.etoileJusqua = -1; g.salamandres.length = 0;
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

/* LE VENT TRANCHANT : la seule arme qui n'existe que si l'on court. La
   capture doit donc montrer un magicien EN COURSE, avec sa trainee derriere
   lui et des bestioles dedans. Une capture a l'arret ne montrerait rien du
   tout — et ce serait juste. */
faites.push(await vue("vent", () => {
  const g = window.jeu.partie();
  const a = window.jeu.armes();
  /* ⚠️ Les vues s'enchainent sur la MEME partie : sans vider les armes, le
     magicien arrivait ici avec quatre boules givrees, et le gros anneau bleu
     de l'image n'etait pas le vent — c'etait leur fumee. */
  a.armes.length = 0;
  a.donner("vent"); a.donner("vent"); a.donner("vent");
  g.bestioles.length = 0;
  g.feux.length = 0; g.flaques.length = 0; g.crachats.length = 0;
  g.etoileJusqua = -1; g.salamandres.length = 0;
  for (let i = 0; i < 7; i++) {
    g.naitre("escargot");
    const b = g.bestioles[i];
    b.x = g.joueur.x + 30 + i * 30;
    b.y = g.joueur.y + (i % 2 ? 16 : -16);
    b.arrivee = -99;
    /* elles survivent a la capture : coupees puis mortes, on ne verrait rien */
    b.vie = 9999;
    b.immobile = true;
  }
}, 900, async () => {
  /* on pousse le manche vers la droite, et on le tient */
  await p.mouse.move(150, 700);
  await p.mouse.down();
  await p.mouse.move(300, 700, { steps: 4 });
}));
await p.mouse.up();

/* la reine des toiles : le boss de fin, sa barre de vie, et sa toile */
faites.push(await vue("reine", () => {
  const g = window.jeu.partie();
  g.bestioles.length = 0; g.graines.length = 0;
  g.feux.length = 0; g.flaques.length = 0; g.crachats.length = 0;
  g.etoileJusqua = -1; g.salamandres.length = 0;
  g.temps = g.duree - 0.05;
  for (let i = 0; i < 20; i++) { g.joueur.coeurs = g.joueur.coeursMax; g.pas(1 / 60); }
  if (g.boss) {
    g.boss.arrivee = -99;
    g.boss.x = g.joueur.x + 30;
    g.boss.y = g.joueur.y - 190;
    g.boss.vie = Math.round(g.boss.vieMax * 0.62);
    g.boss.etat = "toile";
  }
  g.toiles.push({ x: g.joueur.x - 120, y: g.joueur.y + 90, r: 58,
                  reste: 1.6, plein: 2.2, i: 0.7 });
}));

/* colle dans la toile : l'enfant doit comprendre qu'il faut pousser */
faites.push(await vue("colle", () => {
  const g = window.jeu.partie();
  g.toiles.length = 0;
  g.toiles.push({ x: g.joueur.x, y: g.joueur.y, r: 90, reste: 2, plein: 2.2, i: 1.1 });
  g.joueur.avance = true;
  for (let i = 0; i < 6; i++) g.pas(1 / 60);
}));

/* l'epee et les boucliers du chevalier : une vraie lame, de vrais ecus */
faites.push(await (async function () {
  await vivant();
  await p.evaluate(() => { window.jeu.choisirPerso("chevalier"); });
  await p.evaluate(() => window.jeu.menu("menuBouton"));
  await p.waitForTimeout(250);
  /* ⚠️ « Recommencer » ramene desormais au CHOIX DU PERSONNAGE, pas en jeu :
     il faut cliquer sur Jouer derriere, sinon la capture montre l'ecran de
     choix a la place de la vue demandee. */
  await p.click("#recommencer");
  await p.waitForTimeout(400);
  await p.click("#jouer");
  await p.waitForTimeout(4600);
  await p.evaluate(() => {
    const g = window.jeu.partie();
    const a = window.jeu.armes();
    a.armes.length = 0;
    for (let i = 0; i < 5; i++) { a.donner("epee"); a.donner("bouclier"); }
    g.bestioles.length = 0;
    g.feux.length = 0; g.flaques.length = 0; g.crachats.length = 0;
    g.etoileJusqua = -1; g.salamandres.length = 0;
    for (let i = 0; i < 4; i++) {
      g.naitre("escargot");
      const b = g.bestioles[i];
      const an = i * 1.4;
      b.x = g.joueur.x + Math.cos(an) * 78;
      b.y = g.joueur.y + Math.sin(an) * 78;
      b.arrivee = -99; b.vie = 9999; b.immobile = true;
    }
  });
  await p.waitForTimeout(120);
  await p.screenshot({ path: OUT + "epee.png" });
  return "epee";
})());

/* le grand souffle : monte au maximum, avec la longue-vue, il doit rester
   FOURNI et pas devenir un crachin qui porte loin */
faites.push(await vue("souffle-grand", () => {
  const g = window.jeu.partie();
  const a = window.jeu.armes();
  for (let i = 0; i < 6; i++) a.donner("souffle");
  for (let i = 0; i < 5; i++) a.donnerObjet("longuevue");
  g.bestioles.length = 0;
  g.flaques.length = 0; g.crachats.length = 0; g.feux.length = 0;
  g.etoileJusqua = -1; g.salamandres.length = 0;
  g.commander({ angle: 0.35, avance: false });
  for (let i = 0; i < 40; i++) { a.pas(1 / 60); g.pas(1 / 60); }
}));

/* la flaque de la limace : elle ne doit plus passer pour un buisson */
faites.push(await vue("flaques", () => {
  const g = window.jeu.partie();
  g.bestioles.length = 0;
  g.feux.length = 0; g.crachats.length = 0; g.flaques.length = 0;
  g.etoileJusqua = -1; g.salamandres.length = 0;
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
