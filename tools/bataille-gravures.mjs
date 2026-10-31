import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Les gravures, les nouveaux atouts et l'atlas (V1.6.0), joués à la main dans le vrai
   jeu : gagner un mois ouvre la gravure, puis la carte, puis l'atout ; la gravure
   reste sur la carte et se voit sur le tapis ; le mois gagné allume sa constellation
   et l'atlas (ouvert par le globe) le montre ; l'année maudite se choisit après Jouer
   (V1.8.0 : avant, l'atlas et les années étaient sur l'écran titre).
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
verifie("le titre ne propose plus l'atlas", (await p.locator("#atlasBtn").count()) === 0);
await p.click("#startBtn");

/* jouer des mois jusqu'à en gagner un (en vitesse) */
let gagne = false;
/* une année peut se perdre sans un seul mois gagné : on en rejoue une (au plus 40 mois) */
for (let m = 0; m < 40 && !gagne; m++) {
  if (await p.isVisible("#end")) await p.click("#againBtn"); if (await p.isVisible("#annees")) await p.click("#anneesOk");
  await p.click("#goBtn"); await p.evaluate(() => window.__essais.vitesse(12));
  await p.waitForFunction(() => window.__essais.etat().phase === "result", null, { timeout: 60000 });
  await p.evaluate(() => window.__essais.vitesse(1));
  gagne = /est à toi/.test(await p.textContent("#pageT"));
  if (gagne) { verifie("le mois gagné allume sa constellation", await p.isVisible("#pageN") && /s’allumen?t? dans ton atlas/.test(await p.textContent("#pageN")), await p.textContent("#pageN")); await photo("1-mois"); }
  await p.click("#goBtn");
  if (await p.isVisible("#end")) continue;
  /* la constellation allumée montre d'abord ce qu'elle donne */
  if (gagne && /^Nouvel/.test(await p.textContent("#choixT"))) await p.click("#choixOk");
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
await p.click("#startBtn");
if (await p.isVisible("#annees")) await p.click("#anneesOk");
await p.click("#globe");
await p.waitForSelector("#atlas:not([hidden])");
verifie("l'atlas montre les 12 constellations", (await p.locator("#atlasC > button").count()) === 12);
verifie("l'atlas garde la constellation gagnée", !gagne || (await p.locator("#atlasC .lu").count()) >= 1);
await feuille("atlas"); await photo("6-atlas");
await p.click("#atlasOk");
/* une année maudite ouverte : elle se choisit après Jouer */
await p.evaluate(() => { localStorage.setItem("bataille-atlas", JSON.stringify({ lu: { belier: 1, lion: 1, taureau: 1 }, ans: 4, max: 4, joue: 4 })); localStorage.removeItem("bataille-partie"); });
await p.reload({ waitUntil: "load" });
await p.click("#startBtn");
verifie("le choix d'année propose la maudite 4", /année maudite 4/.test(await p.textContent("#anneesOk")), await p.textContent("#anneesOk"));
await feuille("annees"); await photo("7-annees");
await p.click("#anneesOk");
verifie("l'année maudite 4 donne deux cartes gravées au Maudit", (await p.evaluate(() => window.__essais.gravures()[1].length + window.__essais.etat().unites.filter((u) => u.side < 0 && u.g).length)) === 2);
await p.evaluate(() => localStorage.removeItem("bataille-partie"));
await p.reload({ waitUntil: "load" });
await p.click("#startBtn"); await p.click("#anneesL .an >> nth=0"); await p.click("#anneesOk");
verifie("revenir à l'année de base", (await p.evaluate(() => window.__essais.atlas({}).pal)) === 0);
/* classique : rien de tout ça */
await p.goto(srv.base + "bataille/?classique", { waitUntil: "load" });
await p.click("#startBtn");
verifie("en classique, pas d'atlas", !(await p.isVisible("#globe")) && !(await p.isVisible("#annees")));
verifie("aucune erreur de page", erreurs.length === 0, erreurs.join(" | "));
await navigateur.close();
srv.arreter();
console.log(echecs.length ? "ÉCHEC\n" + echecs.join("\n") : "bataille-gravures : tout passe");
process.exit(echecs.length ? 1 : 0);
