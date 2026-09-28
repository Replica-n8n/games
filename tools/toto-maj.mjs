import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : un téléphone qui a la version en cours doit récupérer la SUIVANTE par un
   simple retour au jeu, sans que personne n'appelle update() à la main (le navigateur
   ne redemande pas toujours sw.js au rechargement). On publie une fausse version
   suivante en changeant VERSION dans sw.js, puis on la remet. Et : sous
   « animations réduites », une secousse d'écran ne bouge rien. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SW = path.join(HERE, "..", "toto", "sw.js");
const orig = fs.readFileSync(SW, "utf8");
const v = orig.match(/var VERSION = "([^"]+)"/)[1];
const suivante = v + "-essai";
const echecs = [];
const verifie = (ok, quoi) => { console.log((ok ? "ok    " : "ÉCHEC ") + quoi); if (!ok) echecs.push(quoi); };
const srv = await servir();
const nav = await chromium.launch();
try {
  const ctx = await nav.newContext({ ...devices["Pixel 9 landscape"] });
  const p = await ctx.newPage();
  await p.goto(srv.base + "toto/");
  await p.waitForFunction(() => navigator.serviceWorker.ready.then(() => true)); await p.reload();
  fs.writeFileSync(SW, orig.replace(`"${v}"`, `"${suivante}"`));
  await p.reload();
  let caches = [];
  for (let t = 0; t < 12 && !(caches.some((k) => k.endsWith(suivante)) && !caches.some((k) => k.endsWith(":" + v))); t++) { await p.waitForTimeout(1000); caches = await p.evaluate(async () => (await caches.keys()).filter((k) => k.startsWith("toto:"))); }
  verifie(caches.some((k) => k.endsWith(suivante)), "la version suivante s'installe seule au rechargement (" + caches.join(", ") + ")");
  verifie(!caches.some((k) => k.endsWith(":" + v)), "l'ancien cache est supprimé");
  await ctx.close();

  const calme = await nav.newContext({ ...devices["Pixel 9 landscape"], reducedMotion: "reduce" });
  const q = await calme.newPage();
  await q.goto(srv.base + "toto/"); await q.click("#bNew"); await q.waitForTimeout(300);
  verifie(await q.evaluate(() => { window.__essais.shake(14); return window.__essais.shakeA === 0; }), "animations réduites : pas de secousse d'écran");
  await calme.close();
  const normal = await nav.newContext({ ...devices["Pixel 9 landscape"] });
  const r = await normal.newPage();
  await r.goto(srv.base + "toto/"); await r.click("#bNew"); await r.waitForTimeout(300);
  verifie(await r.evaluate(() => { window.__essais.shake(14); return window.__essais.shakeA > 10; }), "sans ce réglage, la secousse reste");
} finally {
  fs.writeFileSync(SW, orig);
  await nav.close(); srv.arreter();
}
console.log(echecs.length ? `\n${echecs.length} échec(s)` : "\nTout est vert.");
process.exit(echecs.length ? 1 : 0);
