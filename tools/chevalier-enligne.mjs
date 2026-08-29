import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

/* Ce que GitHub Pages sert vraiment.

   Un fichier present dans le depot ne prouve rien : ce qui compte, c'est ce
   que le telephone recoit. On verifie les codes et les types servis, puis on
   coupe le reseau et on recharge : si le jeu se relance, la PWA tient. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "captures") + path.sep;
fs.mkdirSync(OUT, { recursive: true });

const BASE = "https://replica-n8n.github.io/games/serpentin/";
/* ⚠️ La liste est LUE DANS LE SERVICE WORKER, pas ecrite ici. Ecrite a la
   main, elle a derive sans que rien ne le signale : `souvenirs.js` manquait
   depuis la v18 et `sons.js` depuis la v36, donc le controle disait « tout est
   servi » sans jamais les avoir demandes. */
const swLocal = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "serpentin", "sw.js"), "utf8");
const listeSw = [...swLocal.matchAll(/"\.\/([^"]*)"/g)].map((m) => m[1]).filter(Boolean);
const FICHIERS = ["", "sw.js"].concat([...new Set(listeSw)]);

const navigateur = await chromium.launch();
const ctx = await navigateur.newContext({ ...devices["Pixel 9"] });
const p = await ctx.newPage();
const erreurs = [];
p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
p.on("pageerror", (e) => erreurs.push("pageerror: " + e.message));

/* 1. ce que le serveur repond, fichier par fichier */
const servis = [];
for (const f of FICHIERS) {
  const r = await p.request.get(BASE + f);
  servis.push({ f: f || "(dossier)", code: r.status(), type: r.headers()["content-type"] });
}

/* 2. le jeu se lance */
await p.goto(BASE, { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
const enLigne = await p.evaluate(() => {
  const partie = window.jeu.partie();
  return {
    version: window.jeu.version,
    monde: window.jeu.monde().nom,
    obstacles: partie.obstacles.length,
    ecrans: window.jeu.ecrans(),
  };
});
await p.screenshot({ path: OUT + "serpentin-07-enligne.png" });

/* 3. hors ligne */
await p.evaluate(() => navigator.serviceWorker.ready.then(() => true));
await ctx.setOffline(true);
await p.reload({ waitUntil: "domcontentloaded" });
await p.waitForTimeout(1200);
const horsLigne = await p.evaluate(() => {
  const partie = window.jeu.partie();
  return {
    version: window.jeu.version,
    obstacles: partie.obstacles.length,
    controle: !!navigator.serviceWorker.controller,
  };
});
await p.screenshot({ path: OUT + "serpentin-08-enligne-hors-ligne.png" });

await navigateur.close();

console.log(JSON.stringify({ servis, enLigne, horsLigne, erreurs }, null, 2));

const ok =
  servis.every((s) => s.code === 200) &&
  servis.find((s) => s.f === "moteur.js").type.includes("javascript") &&
  enLigne.monde === "prairie" &&
  enLigne.obstacles === 90 &&
  enLigne.ecrans.depart === true &&
  horsLigne.controle === true &&
  horsLigne.obstacles === 90 &&
  erreurs.length === 0;

console.log(ok
  ? "\nOK : Pages sert tous les fichiers du service worker, le jeu tourne, et il se relance hors ligne."
  : "\nRATE : voir le bilan ci dessus.");
process.exit(ok ? 0 : 1);
