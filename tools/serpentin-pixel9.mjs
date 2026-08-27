import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { servir } from "./serveur.mjs";

/* Le parcours de Serpentin en Chromium, profil Pixel 9.

   Son telephone est un Pixel 9a, que Playwright ne connait pas. Le profil
   Pixel 9 a la meme dalle et un ecran plus etroit en points CSS (360 x 732),
   donc c'est le cas le plus dur pour placer un HUD : on controle la dessus.

   Etape 3 : la prairie s'affiche, et le decor vient bien des donnees du
   monde. La frontiere se prouve en injectant un faux monde dans la page,
   sans toucher a un seul fichier : si l'affichage le peint, c'est qu'il ne
   sait rien de la prairie en dur. */

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
await p.waitForTimeout(1500);

const prairie = await p.evaluate(() => {
  const partie = window.serpentin.partie();
  const j = partie.joueur;
  return {
    monde: window.serpentin.monde().nom,
    serpents: partie.serpents.length,
    fleurs: partie.fleurs.length,
    obstacles: partie.obstacles.length,
    points: j.corps.length,
    aBouge: Math.hypot(j.x, j.y) > 40,
    score: partie.score,
    ecran: window.serpentin.taille(),
  };
});
await p.screenshot({ path: OUT + "serpentin-03-prairie.png" });

/* la frontiere : un monde inconnu, injecte a chaud */
const FOND = [90, 40, 140];
const faux = await p.evaluate((fond) => {
  const rgb = "rgb(" + fond.join(",") + ")";
  Mondes.ajouter({
    nom: "essai",
    titre: "Monde d'essai",
    rayon: 900,
    fleurs: 120,
    obstacles: { nombre: 14, rayonMin: 20, rayonMax: 34, loinDuCentre: 160 },
    fond: rgb,
    sol: "#3a1d55",
    ligne: "#6a3fa0",
    haie: "#d0a0ff",
    ombre: "rgba(0,0,0,.3)",
    couleursFleurs: ["#ffe45e"],
    couleurJoueur: "#5ef0d0",
    ventreJoueur: "#bffff0",
    couleursBots: ["#ff5fd0"],
    potions: [],
    dessinerObstacle: function (ctx, o, x, y, r) {
      ctx.fillStyle = "#8f6bff";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 6.2832);
      ctx.fill();
    },
  });
  window.serpentin.demarrer("essai");
  return true;
}, FOND);

await p.waitForTimeout(700);
const apresFaux = await p.evaluate(() => {
  const cv = document.getElementById("jeu");
  const c = cv.getContext("2d").getImageData(4, 4, 1, 1).data;
  const partie = window.serpentin.partie();
  return {
    monde: window.serpentin.monde().nom,
    coin: [c[0], c[1], c[2]],
    rayon: partie.rayon,
    fleurs: partie.fleurs.length,
  };
});
await p.screenshot({ path: OUT + "serpentin-04-frontiere.png" });

/* on rend la prairie */
await p.evaluate(() => window.serpentin.demarrer("prairie"));
await p.waitForTimeout(400);
await navigateur.close();
site.arreter();

/* Le damier du sol et le quadrillage passent par dessus le fond : on compare
   donc avec une marge, et on verifie surtout que le coin s'est eloigne du vert
   de la prairie. Une couleur ecrite en dur dans l'affichage n'aurait pas
   bouge du tout. */
const ecart = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
const VERT_PRAIRIE = [131, 199, 102];

console.log(JSON.stringify({ prairie, faux, apresFaux, erreurs }, null, 2));

const ok =
  prairie.monde === "prairie" &&
  prairie.fleurs === 1600 &&
  prairie.obstacles === 90 &&
  prairie.points > 1 &&
  prairie.aBouge &&
  prairie.score > 0 &&
  apresFaux.monde === "essai" &&
  apresFaux.rayon === 900 &&
  apresFaux.fleurs === 120 &&
  ecart(apresFaux.coin, FOND) <= 20 &&
  ecart(apresFaux.coin, VERT_PRAIRIE) > 60 &&
  erreurs.length === 0;

console.log(ok
  ? "\nOK : la prairie s'affiche, et un monde inconnu s'affiche aussi sans toucher a l'affichage."
  : "\nRATE : voir le bilan ci dessus.");
process.exit(ok ? 0 : 1);
