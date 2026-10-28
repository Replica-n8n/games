import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Les gravures, les nouveaux atouts et l'atlas (V13), joués à la main dans le vrai
   jeu : gagner un mois ouvre la gravure, puis la carte, puis l'atout ; la gravure
   reste sur la carte et se voit sur le tapis ; le mois gagné allume sa constellation
   et l'atlas le montre ; l'année maudite choisie se dit sur l'écran titre.
   Captures : captures/bataille-gravures-*.png */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, "captures");
fs.mkdirSync(SORTIE, { recursive: true });
const srv = await servir();
const navigateur = await chromium.launch();
const echecs = [];
const verifie = (nom, ok, detail) => { if (!ok) echecs.push(nom + (detail !== undefined ? " : " + detail : "")); };
const ctx = await navigateur.newContext({ viewport: { width: 360, height: 732 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(String(e)));
const photo = (nom) => p.screenshot({ path: path.join(SORTIE, "bataille-gravures-" + nom + ".png") });
/* La feuille tient dans l'écran, et chaque cible fait 44 px. */
const feuille = (nom) => p.evaluate(() => { const f = [...document.querySelectorAll(".feuille")].find((x) => x.offsetParent); const r = f.getBoundingClientRect();
  const petits = [...f.querySelectorAll("button")].filter((b) => b.offsetParent && (b.getBoundingClientRect().height < 44 || b.getBoundingClientRect().width < 44)).length;
  return { haut: r.top, bas: r.bottom, deborde: f.scrollHeight > f.clientHeight + 1, petits }; }).then((m) => verifie(nom + " : la feuille tient dans l'écran, cibles de 44 px", m.haut >= 0 && m.bas <= 732 && !m.deborde && m.petits === 0, JSON.stringify(m)));

await p.goto(srv.base + "bataille/", { waitUntil: "load" });
await p.evaluate(() => navigator.serviceWorker.ready); await p.reload({ waitUntil: "load" });
verifie("le titre propose l'atlas", await p.isVisible("#atlasBtn"));
await p.click("#startBtn");

/* jouer des mois jusqu'à en gagner un (en vitesse) */
let gagne = false;
for (let m = 0; m < 11 && !gagne; m++) {
  await p.click("#goBtn"); await p.evaluate(() => window.__essais.vitesse(12));
  await p.waitForFunction(() => window.__essais.etat().phase === "result", null, { timeout: 60000 });
  await p.evaluate(() => window.__essais.vitesse(1));
  gagne = /est à toi/.test(await p.textContent("#pageT"));
  if (gagne) { verifie("le mois gagné allume sa constellation", await p.isVisible("#pageN") && /s’allume dans ton atlas/.test(await p.textContent("#pageN")), await p.textContent("#pageN")); await photo("1-mois"); }
  await p.click("#goBtn");
  if (await p.isVisible("#end")) break;
  if (!gagne) { verifie("un mois perdu ne propose pas de gravure", !(await p.isVisible("[data-gravure]"))); await p.click("#choixL .option >> nth=0"); }
}
verifie("un mois gagné dans l'année", gagne);
if (gagne) {
  verifie("trois gravures proposées", (await p.locator("[data-gravure]").count()) === 3);
  await feuille("gravure"); await photo("2-gravure");
  const g = await p.getAttribute("[data-gravure] >> nth=0", "data-gravure");
  await p.click("[data-gravure] >> nth=0");
  verifie("la carte se choisit dans tout ton paquet", (await p.locator(".pc").count()) === (await p.evaluate(() => window.__essais.paquets()[0].length)));
  verifie("rien ne se grave avant d'avoir touché une carte", !(await p.isVisible("#choixOk")));
  await p.click(".pc:not(:disabled) >> nth=0");
  await feuille("carte"); await photo("3-carte");
  const nom = await p.textContent("#choixOk");
  await p.click("#choixOk");
  const gr = await p.evaluate(() => window.__essais.gravures()[0]);
  verifie("la gravure est posée sur la carte choisie", gr.length >= 1 && gr.some((x) => x.endsWith(":" + g)), gr.join() + " / " + nom);
  verifie("puis vient l'atout", await p.isVisible("[data-atout]"));
  await feuille("atout"); await photo("4-atout");
  await p.click("#choixL .option >> nth=0");
  /* la gravure se voit sur le tapis : poser la carte gravée en jeu */
  await p.evaluate((g) => { const E = window.__essais; E.force({}); }, g);
  const surTapis = await p.evaluate(() => window.__essais.etat().unites.some((u) => u.side > 0 && u.g));
  if (surTapis) await photo("5-tapis");
}
/* l'atlas, après un rechargement : il se souvient */
await p.reload({ waitUntil: "load" });
await p.click("#atlasBtn");
await p.waitForSelector("#atlas:not([hidden])");
verifie("l'atlas montre les 12 constellations", (await p.locator("#atlasC > div").count()) === 12);
verifie("l'atlas garde la constellation gagnée", !gagne || (await p.locator("#atlasC .lu").count()) >= 1);
verifie("9 marches d'années, seules les ouvertes se touchent", (await p.locator("#atlasP button").count()) === 9 && (await p.locator("#atlasP button:disabled").count()) === 8 - (await p.evaluate(() => window.__essais.atlas({}).max)));
await feuille("atlas"); await photo("6-atlas");
await p.click("#atlasOk");
/* une année maudite ouverte : elle se dit sur le bouton Jouer, et l'atlas la change */
await p.evaluate(() => { localStorage.setItem("bataille-atlas", JSON.stringify({ lu: { belier: 1, lion: 1, taureau: 1 }, ans: 4, max: 4, joue: 4 })); localStorage.removeItem("bataille-partie"); });
await p.reload({ waitUntil: "load" });
verifie("le bouton dit l'année maudite", /année maudite 4/.test(await p.textContent("#startBtn")), await p.textContent("#startBtn"));
verifie("l'année maudite 4 donne deux cartes gravées au Maudit", (await p.evaluate(() => window.__essais.gravures()[1].length + window.__essais.etat().unites.filter((u) => u.side < 0 && u.g).length)) === 2);
await p.click("#atlasBtn"); await photo("7-atlas-maudit");
await p.click("#atlasP button >> nth=0"); await p.click("#atlasOk");
verifie("revenir à l'année de base", (await p.textContent("#startBtn")) === "Jouer" && (await p.evaluate(() => window.__essais.atlas({}).pal)) === 0, await p.textContent("#startBtn"));
/* classique : rien de tout ça */
await p.goto(srv.base + "bataille/?classique", { waitUntil: "load" });
verifie("en classique, pas d'atlas", !(await p.isVisible("#atlasBtn")));
verifie("aucune erreur de page", erreurs.length === 0, erreurs.join(" | "));
await navigateur.close();
srv.arreter();
console.log(echecs.length ? "ÉCHEC\n" + echecs.join("\n") : "bataille-gravures : tout passe");
process.exit(echecs.length ? 1 : 0);
