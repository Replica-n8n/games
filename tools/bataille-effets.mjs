import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Les gravures se VOIENT-elles en combat ? (Julie, 2026-10-28 : « à part la gravure
   sur la carte, on ne voit pas leurs effets », le givre surtout.) Un combat posé à
   la main, cinq gravures de chaque côté, joué au ralenti : on vérifie que chaque
   gravure qui agit lance son effet (tools/bataille-effets-jeu.mjs les photographie un
   par un), que le givre prend sa cible dans la glace, que les noms s'écrivent ; et que la constellation déjà gagnée
   brille en or en haut. Captures : captures/bataille-effets-*.png, et la planche
   bataille/docs/effets-gravures.png. */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, "captures");
fs.mkdirSync(SORTIE, { recursive: true });
const srv = await servir();
const navigateur = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist"] });
const echecs = [];
const verifie = (nom, ok, detail) => { if (!ok) echecs.push(nom + (detail !== undefined ? " : " + detail : "")); };
const p = await navigateur.newPage({ viewport: { width: 360, height: 732 }, deviceScaleFactor: 2 });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(String(e)));
await p.goto(srv.base + "bataille/", { waitUntil: "load" });
await p.click("#startBtn");

/* 1. la constellation du mois, éteinte puis allumée */
const mois = await p.evaluate(() => window.__essais.etat().mois);
await p.evaluate((m) => window.__essais.allume(m, false), mois);
await p.screenshot({ path: path.join(SORTIE, "bataille-effets-0-eteinte.png"), clip: { x: 0, y: 0, width: 360, height: 160 } });
await p.evaluate((m) => window.__essais.allume(m, true), mois);
verifie("le nom du signe passe en or", await p.evaluate(() => document.getElementById("signe").classList.contains("lu")));
verifie("le point du mois passe en or", await p.evaluate(() => document.querySelector("#annee i.ici").classList.contains("lu")));
await p.screenshot({ path: path.join(SORTIE, "bataille-effets-1-allumee.png"), clip: { x: 0, y: 0, width: 360, height: 160 } });

/* 2. un combat aux gravures, au ralenti */
await p.evaluate(() => {
  const E = window.__essais;
  /* tapis : mes cartes 0 à 4, celles du Maudit 5 à 9 */
  ["givre", "ailes", "epine", "phenix", "sangsue"].forEach((g, i) => E.carte(i, g));
  ["bouclier", "eclair", "givre", "epine", "ailes"].forEach((g, i) => E.carte(5 + i, g));
  E.vitesse(0.6);
});
await p.click("#goBtn");
const vus = { effets: 0, noms: 0, gel: 0 }, ids = new Set();
let n = 0, msImage = NaN;
for (let i = 0; i < 70; i++) {
  await p.waitForTimeout(110);
  const e = await p.evaluate(() => window.__essais.effets());
  for (const k in vus) vus[k] = Math.max(vus[k], e[k]);
  e.ids.forEach((x) => ids.add(x.replace("+", "")));
  /* on photographie les instants où il se passe le plus de choses */
  if (n < 4 && e.effets >= 2 && i % 3 === 0) await p.screenshot({ path: path.join(SORTIE, "bataille-effets-" + (2 + n++) + ".png") });
  if (i === 12) msImage = await p.evaluate(() => window.__essais.peins(60) / 60);
  if ((await p.evaluate(() => window.__essais.etat().phase)) === "result") break;
}
/* dix gravures en jeu ne doivent pas coûter d'images : 16 ms = 60 images/s */
verifie("une image se peint en moins de 16 ms, dix gravures en jeu", msImage < 16, msImage);
verifie("les gravures qui agissent lancent leur effet", ids.size >= 3, [...ids].join());
verifie("le grand nom s'écrit", vus.noms >= 1, vus.noms);
verifie("le givre prend sa cible dans la glace", vus.gel >= 1, vus.gel);
verifie("au moins deux instants photographiés", n >= 2, n);
verifie("aucune erreur de page", erreurs.length === 0, erreurs.join(" | "));

/* la planche : le haut éteint puis allumé, et les instants du combat */
const imgs = ["0-eteinte", "1-allumee"].map((x) => `<img src="${srv.base}tools/captures/bataille-effets-${x}.png" style="width:360px;border-radius:12px">`).join("");
const combat = Array.from({ length: n }, (_, i) => `<img src="${srv.base}tools/captures/bataille-effets-${2 + i}.png" style="width:300px;border-radius:18px">`).join("");
const q = await navigateur.newPage({ viewport: { width: 1600, height: 900 } });
await q.goto(srv.base + "tools/");
await q.setContent(`<body style="margin:0;background:#05082a;color:#f4f2ff;font:600 18px Georgia;padding:16px"><div style="display:flex;gap:16px;align-items:center">${imgs}<span>avant / après : le mois déjà gagné brille en or</span></div><div style="display:flex;gap:16px;margin-top:16px">${combat}</div></body>`);
await q.waitForLoadState("networkidle");
await q.screenshot({ path: path.join(ICI, "..", "bataille", "docs", "effets-gravures.png"), fullPage: true });
await navigateur.close();
srv.arreter();
console.log(echecs.length ? "ÉCHEC\n" + echecs.join("\n") : "bataille-effets : tout passe (" + JSON.stringify(vus) + ", " + msImage.toFixed(1) + " ms par image)");
process.exit(echecs.length ? 1 : 0);
