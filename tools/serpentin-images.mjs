import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { servir } from "./serveur.mjs";

/* Combien coute une image, arene pleine.

   On force le score a un million : la population monte tout de suite a son
   plafond, 22 serpents, et on laisse tourner. Le jeu se mesure en deux
   morceaux, le moteur et le dessin, parce que si ca coince il faut savoir
   lequel des deux.

   ⚠️ C'est du Chromium sans ecran sur un portable, pas un Pixel 9a. Le
   chiffre qui compte pour un telephone, c'est le temps de travail par image :
   au dela de 16,7 ms, les 60 images par seconde sont perdues. */

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
await p.evaluate(() => {
  window.serpentin.demarrer("prairie", 4242);
  const partie = window.serpentin.partie();
  partie.score = 1000000;   /* l'arene se remplit a son plafond des la premiere image */
});
await p.waitForTimeout(6000);

const mesures = [];
for (let i = 0; i < 4; i++) {
  /* on mesure le jeu vivant : si le joueur s est fait avoir, on relance */
  await p.evaluate(() => {
    if (window.serpentin.partie().fini) document.getElementById("rejouer").click();
    window.serpentin.partie().score = 1000000;
  });
  await p.waitForTimeout(2500);
  const m = await p.evaluate(() => window.serpentin.mesure());
  if (m) mesures.push(m);
}
await p.screenshot({ path: OUT + "serpentin-09-arene-pleine.png" });

const etat = await p.evaluate(() => {
  const j = window.serpentin.partie().joueur;
  const partie = window.serpentin.partie();
  const roles = {};
  partie.serpents.forEach((s) => { roles[s.role || "joueur"] = (roles[s.role || "joueur"] || 0) + 1; });
  return { serpents: partie.serpents.length, fleurs: partie.fleurs.length, roles, joueurVivant: j.vivant };
});

await navigateur.close();
site.arreter();

const moyenne = (cle) => mesures.reduce((t, m) => t + m[cle], 0) / mesures.length;
const bilan = {
  etat,
  mesures,
  moyennes: {
    images: Math.round(moyenne("images")),
    moteur: +moyenne("moteur").toFixed(2),
    dessin: +moyenne("dessin").toFixed(2),
    travail: +(moyenne("moteur") + moyenne("dessin")).toFixed(2),
  },
  erreurs,
};

console.log(JSON.stringify(bilan, null, 2));

const BUDGET = 16.7;
const ok =
  mesures.length >= 3 &&
  etat.serpents >= 22 &&
  bilan.moyennes.travail < BUDGET &&
  erreurs.length === 0;

console.log(ok
  ? `\nOK : ${bilan.moyennes.travail} ms de travail par image a ${etat.serpents} serpents, sous les ${BUDGET} ms qui donnent 60 images par seconde.`
  : `\nRATE : ${bilan.moyennes.travail} ms de travail par image, il en faut moins de ${BUDGET}.`);
process.exit(ok ? 0 : 1);
