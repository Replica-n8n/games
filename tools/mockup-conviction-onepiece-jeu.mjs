import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";
import { findCulprit } from "../conviction/engine/index.js";

/* Les deux enquêtes One Piece EN JEU, sur un Pixel 9 : le plan au début, la
   scène d'accusation, l'affaire classée. Captures dans docs/ (à montrer à
   Julie avant la mise en ligne). */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.join(ICI, "..", "docs");
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const erreurs = [];
for (const id of ["onepiece-reverie-moyen", "onepiece-egghead-difficile"]) {
  const puzzle = JSON.parse(fs.readFileSync(path.join(ICI, "..", "conviction", "puzzles", `${id}.json`), "utf8"));
  const ctx = await nav.newContext({ ...devices["Pixel 9"] });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(e.message));
  await p.goto(`${srv.base}conviction/?enquete=${id}`);
  await p.waitForSelector("#jeu:not([hidden])");
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(DOCS, `conviction-${id}-dossier.png`) });
  await p.click("#b-ouvrir");
  await p.waitForTimeout(150);
  if (await p.isVisible(".tuto").catch(() => false)) await p.click('.tuto [data-t="passer"]');
  await p.evaluate(() => scrollTo(0, 0));
  await p.screenshot({ path: path.join(DOCS, `conviction-${id}-plan.png`) });
  for (const x of puzzle.persons) {
    const [r, c] = puzzle.solution[x.id];
    if ((await p.getAttribute(`#choix .chip[data-id="${x.id}"]`, "aria-pressed")) !== "true") await p.click(`#choix .chip[data-id="${x.id}"]`);
    await p.click(`.cell[data-r="${r}"][data-c="${c}"]`);
  }
  await p.click(`[data-acc="${findCulprit(puzzle, puzzle.solution)}"]`);
  await p.waitForSelector(".scene .cri");
  await p.waitForTimeout(1600);
  await p.screenshot({ path: path.join(DOCS, `conviction-${id}-scene.png`) });
  await p.click('.scene [data-s="passer"]');
  await p.waitForSelector(".scene", { state: "detached" });
  await p.waitForTimeout(500);
  await p.locator("#verdict").scrollIntoViewIfNeeded();
  await p.screenshot({ path: path.join(DOCS, `conviction-${id}-fin.png`) });
  await ctx.close();
}
await nav.close();
srv.arreter();
console.log(erreurs.length ? `✗ erreurs : ${erreurs.join(" | ")}` : "✓ captures écrites dans docs/");
