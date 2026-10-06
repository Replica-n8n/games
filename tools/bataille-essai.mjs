import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* L'essai du rogue-lite (bataille/?essai) : entre deux mois, un atout à choisir
   parmi trois. On vérifie que le choix apparaît, qu'il s'applique au mois suivant
   seulement, que le Maudit en reçoit un aussi, qu'une année entière se joue sans
   perdre de carte, et que SANS « ?essai » rien de tout ça n'existe.
   Captures : captures/bataille-essai-*.png. */

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
const finDuMois = async () => { await p.click("#goBtn"); await p.evaluate(() => window.__essais.vitesse(12)); await p.waitForFunction(() => window.__essais.etat().phase === "result", null, { timeout: 60000 }); await p.evaluate(() => window.__essais.vitesse(1)); };

/* avec « ?classique » : la bataille d'avant */
await p.goto(srv.base + "bataille/?classique", { waitUntil: "load" });
await p.click("#startBtn");
await finDuMois();
await p.click("#goBtn");
verifie("avec ?classique, aucun choix n'apparaît", !(await p.isVisible("#choix")) && (await p.evaluate(() => window.__essais.etat().round)) === 2);
verifie("avec ?classique, aucune récompense n'agit", await p.evaluate(() => { const e = window.__essais.essai(); return !e.actif && Object.keys(e.mods).length === 0; }));

/* l'adresse normale : les atouts */
await p.evaluate(() => localStorage.clear());
await p.goto(srv.base + "bataille/", { waitUntil: "load" });
await p.evaluate(() => document.fonts.ready);
await p.click("#startBtn");
await finDuMois();
await p.click("#goBtn");
verifie("le choix apparaît après le premier mois", await p.isVisible("#choix"));
const options = await p.$$eval("#choixL .option", (l) => l.map((b) => [b.dataset.atout, b.querySelector("strong").textContent, b.querySelector("span").textContent, b.getBoundingClientRect().height]));
verifie("trois atouts différents, chacun avec son nom et sa phrase", options.length === 3 && new Set(options.map((o) => o[0])).size === 3 && options.every((o) => o[1] && o[2].length > 10), JSON.stringify(options.map((o) => o[1])));
verifie("chaque atout est une cible d'au moins 44 px", options.every((o) => o[3] >= 44));
const petits = await p.evaluate(() => [...document.querySelectorAll("#choix *")].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 14).length);
verifie("aucun texte sous 14 px dans le choix", petits === 0);
verifie("le choix tient dans l'écran", await p.evaluate(() => { const r = document.querySelector("#choix .feuille").getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }));
await p.screenshot({ path: path.join(SORTIE, "bataille-essai-choix.png") });
await p.click("#choixL .option >> nth=0");
let e = await p.evaluate(() => window.__essais.essai());
verifie("l'atout choisi s'applique, et le Maudit a le sien", e.atout === options[0][0] && !!e.lui && !!e.mods[1] && !!e.mods[-1], JSON.stringify(e));
verifie("le placement rappelle les deux atouts", (await p.textContent("#astuce")).includes("Ton atout : " + options[0][1]));
await p.waitForTimeout(300);
await p.screenshot({ path: path.join(SORTIE, "bataille-essai-placement.png") });
/* fermer et rouvrir en plein mois : l'atout et les choix sont toujours là */
await p.reload({ waitUntil: "load" });
await p.click("#startBtn");
const apres = await p.evaluate(() => window.__essais.essai());
verifie("après un rechargement, l'atout du mois est toujours là", apres.atout === e.atout && apres.lui === e.lui && !!apres.mods[1], JSON.stringify(apres).slice(0, 120));
/* un atout réglé par le compteur : renforcé il pèse plus, affaibli moins, et « rien » reste « rien » */
const aj = await p.evaluate(() => { const a = window.__essais.ajuste; return [a({ vie: 1.15 }, 1.2).vie, a({ armure: 0.75 }, 0.8).armure, a({ degats: 1.4, vie: 0.8 }, 0.5), a({ butin: 2 }, 0.5).butin, a({ vampire: 0.2 }, 1)]; });
verifie("un atout se renforce et s'affaiblit autour de « rien »", Math.abs(aj[0] - 1.18) < 1e-9 && Math.abs(aj[1] - 0.8) < 1e-9 && Math.abs(aj[2].degats - 1.2) < 1e-9 && aj[2].vie === 0.8 && aj[3] === 1 && aj[4].vampire === 0.2, JSON.stringify(aj));

/* le reste de l'année : un choix par mois, toujours 32 cartes */
let garde = 0, fini = false;
while (!fini && garde++ < 14) {
  await finDuMois();
  const d = await p.evaluate(() => window.__essais.etat());
  verifie("mois " + d.round + " : 32 cartes en tout", d.moi + d.lui === 32, d.moi + " + " + d.lui);
  await p.click("#goBtn");
  fini = await p.isVisible("#end");
  if (!fini) { verifie("mois " + d.round + " : un nouveau choix", await p.isVisible("#choix")); await p.click("#choixL .option >> nth=" + (garde % 3)); }
}
verifie("l'année d'essai se termine", fini);
await p.click("#againBtn");
verifie("une nouvelle année repart sans atout", await p.evaluate(() => { const x = window.__essais.essai(); return x.atout === null && Object.keys(x.mods).length === 0; }));
verifie("aucune erreur de page", erreurs.length === 0, erreurs.join(" | "));
await navigateur.close();
srv.arreter();
console.log(echecs.length ? "ÉCHEC\n" + echecs.join("\n") : "bataille-essai : tout passe");
process.exit(echecs.length ? 1 : 0);
