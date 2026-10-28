import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* La pastille « Update » de l'arcade (arcade-1.4.0) : l'arcade lit la version de
   chaque jeu dans le nom de sa réserve hors ligne et la compare à celle qu'on avait
   la dernière fois qu'on l'a ouvert d'ici (arcade-vu). On vérifie :
   - à la première visite, rien ne s'allume (tout serait « à jour ») ;
   - un jeu passé de x.5 à x.6 porte « Update », et sa phrase s'il est la grande tuile ;
   - une simple correction (3e chiffre) n'allume rien ;
   - une petite tuile n'a que la pastille ;
   - ouvrir le jeu depuis l'arcade éteint sa pastille.
   Capture : captures/arcade-updates.png */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const srv = await servir();
const navigateur = await chromium.launch();
const echecs = [];
const verifie = (nom, ok, detail) => { if (!ok) echecs.push(nom + (detail !== undefined ? " : " + detail : "")); };
const p = await navigateur.newPage({ viewport: { width: 360, height: 732 }, deviceScaleFactor: 2 });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(String(e)));
const charge = async () => { await p.reload({ waitUntil: "load" }); await p.waitForTimeout(700); };
const pastilles = () => p.$$eval("a.tuile .maj", (l) => l.map((x) => x.closest("a").dataset.jeu));

await p.goto(srv.base + "index.html", { waitUntil: "load" });
/* attendre que les huit jeux aient rangé leurs fichiers */
await p.waitForFunction(async () => (await caches.keys()).filter((n) => /\d+\.\d+\.\d+$/.test(n)).length >= 9, null, { timeout: 120000 });
await charge();
const installees = await p.evaluate(async () => (await caches.keys()).join(" | "));
verifie("première visite : aucune pastille", (await pastilles()).length === 0, (await pastilles()).join());
const vu = await p.evaluate(() => JSON.parse(localStorage.getItem("arcade-vu") || "{}"));
verifie("première visite : la version de chaque jeu est retenue", Object.keys(vu).length === 8, JSON.stringify(vu) + " / " + installees);
const bat = vu.bataille || [1, 6];

/* La Bataille avait la version d'avant : Update, et sa phrase sur la grande tuile */
await p.evaluate((b) => { const v = JSON.parse(localStorage.getItem("arcade-vu")); v.bataille = [b[0], b[1] - 1]; v.toto = [v.toto[0], v.toto[1] - 1]; localStorage.setItem("arcade-vu", JSON.stringify(v)); localStorage.setItem("arcade-dernier", "bataille"); }, bat);
await charge();
verifie("un jeu mis à jour porte « Update »", (await pastilles()).sort().join() === "bataille,toto", (await pastilles()).join());
verifie("la pastille dit « Update »", (await p.textContent("a.tuile.grand .maj")) === "Update");
const phrase = await p.$eval("a.tuile.grand", (a) => a.querySelector(".neuf") && a.querySelector(".neuf").textContent);
verifie("la grande tuile dit ce qui change", !!phrase && phrase.length > 10, phrase);
verifie("une petite tuile n'a que la pastille", (await p.$$eval('a.tuile:not(.grand) .neuf', (l) => l.length)) === 0);
verifie("la phrase ne touche pas le bouton", await p.$eval("a.tuile.grand", (a) => a.querySelector(".neuf").getBoundingClientRect().bottom <= a.querySelector("i").getBoundingClientRect().top));
await p.screenshot({ path: path.join(ICI, "captures", "arcade-updates.png") });

/* une correction seule (même x.y) n'allume rien */
await p.evaluate((b) => { const v = JSON.parse(localStorage.getItem("arcade-vu")); v.bataille = b; localStorage.setItem("arcade-vu", JSON.stringify(v)); }, bat);
await charge();
verifie("une correction n'allume pas la pastille", !(await pastilles()).includes("bataille"));

/* ouvrir Teeth of the Ocean depuis l'arcade éteint sa pastille */
await p.click('a.tuile[data-jeu="toto"]');
await p.waitForURL(/toto\//);
await p.goto(srv.base + "index.html", { waitUntil: "load" }); await p.waitForTimeout(700);
verifie("ouvrir le jeu éteint sa pastille", !(await pastilles()).includes("toto"), (await pastilles()).join());
verifie("aucune erreur de page", erreurs.length === 0, erreurs.join(" | "));
await navigateur.close();
srv.arreter();
console.log(echecs.length ? "ÉCHEC\n" + echecs.join("\n") : "arcade-updates : tout passe");
process.exit(echecs.length ? 1 : 0);
