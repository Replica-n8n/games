import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Des affaires inédites EN JEU, sur un Pixel 9 : le dossier (l'intro écrite à
   trous) et le plan. Captures dans docs/conviction-affaires/ (à montrer à
   Julie avant la mise en ligne). */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.join(ICI, "..", "docs", "conviction-affaires");
const EXEMPLES = [
  ["whatif-trone", "affaire=whatif&n=786&u=" + encodeURIComponent("Le Trône de fer")],
  ["whatif-cluedo", "affaire=whatif&n=4266&u=Cluedo"],
  ["melange", "affaire=melange&n=3110"],
  ["jour", "affaire=whatif&n=2026102600&jour"],
];
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const erreurs = [];
for (const [nom, q] of EXEMPLES) {
  const ctx = await nav.newContext({ ...devices["Pixel 9"] });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(`${nom} : ${e.message}`));
  await p.goto(`${srv.base}conviction/?${q}`);
  await p.waitForSelector("#jeu:not([hidden])", { timeout: 60000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(DOCS, `${nom}-dossier.png`) });
  await p.click("#b-ouvrir");
  await p.waitForTimeout(150);
  if (await p.isVisible(".tuto").catch(() => false)) await p.click('.tuto [data-t="passer"]');
  await p.evaluate(() => scrollTo(0, 0));
  await p.screenshot({ path: path.join(DOCS, `${nom}-plan.png`) });
  await ctx.close();
}
await nav.close();
srv.arreter();
console.log(erreurs.length ? `✗ erreurs : ${erreurs.join(" | ")}` : "✓ captures écrites dans docs/conviction-affaires/");
