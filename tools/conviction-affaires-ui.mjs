import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";
import { findCulprit } from "../conviction/engine/index.js";

/* Les affaires inédites jouées au doigt sur un Pixel 9 : l'affaire du jour se
   prépare puis s'ouvre, une feuille « What if » tire une affaire, on la résout,
   « Une autre affaire » rouvre la feuille, le compte de la boîte monte ; un
   « Grand mélange » facile ; et un lien d'affaire dont la sauvegarde est
   effacée se refait à l'identique. Captures dans docs/conviction-affaires/. */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.join(ICI, "..", "docs", "conviction-affaires");
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctx = await nav.newContext({ ...devices["Pixel 9"] });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
const ok = (c, m) => { if (!c) { erreurs.push(m); console.log(`✗ ${m}`); } else console.log(`✓ ${m}`); };

/** Résout l'affaire ouverte au doigt, d'après sa solution rangée. */
async function resoudre() {
  await p.waitForSelector("#jeu:not([hidden])", { timeout: 60000 });
  const id = new URL(p.url()).searchParams.get("affaire");
  const puzzle = await p.evaluate((i) => JSON.parse(localStorage.getItem(`conviction:affaire:${i}`) ?? "null") ?? JSON.parse(localStorage.getItem("conviction:jour")).puzzle, id);
  await p.click("#b-ouvrir");
  if (await p.isVisible(".tuto").catch(() => false)) await p.click('.tuto [data-t="passer"]');
  for (const x of puzzle.persons) {
    const [r, c] = puzzle.solution[x.id];
    const chip = p.locator(`#choix .chip[data-id="${x.id}"]`);
    if ((await chip.getAttribute("aria-pressed")) !== "true") await chip.click();
    await p.click(`.cell[data-r="${r}"][data-c="${c}"]`);
  }
  await p.click(`[data-acc="${findCulprit(puzzle, puzzle.solution)}"]`);
  await p.waitForSelector(".scene .cri");
  await p.click('.scene [data-s="passer"]');
  await p.waitForSelector(".scene", { state: "detached" });
  return puzzle;
}

await p.goto(`${srv.base}conviction/`);
await p.waitForSelector("#inedites .boite");
ok(await p.isVisible(".une.jour.attente"), "l'affaire du jour se prépare d'abord");
let t = Date.now();
await p.waitForSelector(".une.jour:not(.attente)", { timeout: 180000 });
console.log(`  affaire du jour prête en ${Date.now() - t} ms`);
await p.waitForTimeout(400);
await p.screenshot({ path: path.join(DOCS, "vrai-accueil.png") });

// What if, au hasard, moyen : la réserve se remplit pendant qu'on lit la feuille.
await p.click('#inedites [data-mode="whatif"]');
await p.waitForSelector("dialog.choix[open]");
await p.screenshot({ path: path.join(DOCS, "vrai-feuille.png") });
await p.click('dialog.choix [data-d="moyen"]');
t = Date.now();
await p.click('dialog.choix [data-f="tirer"]');
await p.waitForURL(/affaire=/, { timeout: 240000 });
console.log(`  What if moyen tiré en ${Date.now() - t} ms`);
const a = await resoudre();
ok(a.difficulty === "moyen", `l'affaire tirée est moyenne (${a.difficulty})`);
await p.screenshot({ path: path.join(DOCS, "vrai-fin.png") });
ok(await p.isVisible('#verdict a[href*="inedite=whatif"]'), "« Une autre affaire » est proposée");
await p.click('#verdict a[href*="inedite=whatif"]');
await p.waitForSelector("dialog.choix[open]");
ok(true, "la feuille What if se rouvre");
await p.click('dialog.choix [data-f="fermer"]');
ok((await p.textContent('#inedites [data-mode="whatif"] .pas')).includes("1 résolue"), "la boîte compte l'affaire résolue");

// Grand mélange facile, un univers choisi n'existe pas ici.
await p.click('#inedites [data-mode="melange"]');
await p.click('dialog.choix [data-d="facile"]');
t = Date.now();
await p.click('dialog.choix [data-f="tirer"]');
await p.waitForURL(/affaire=/, { timeout: 240000 });
console.log(`  Grand mélange facile tiré en ${Date.now() - t} ms`);
await p.waitForSelector("#jeu:not([hidden])");
await p.screenshot({ path: path.join(DOCS, "vrai-melange.png") });

// Un lien partagé : la sauvegarde effacée, l'affaire se refait à l'identique.
const lien = p.url();
const id = new URL(lien).searchParams.get("affaire");
const avant = await p.evaluate((i) => localStorage.getItem(`conviction:affaire:${i}`), id);
await p.evaluate((i) => { localStorage.removeItem(`conviction:affaire:${i}`); localStorage.removeItem(`conviction:partie:${i}`); }, id);
await p.goto(lien);
await p.waitForSelector("#jeu:not([hidden])", { timeout: 120000 });
const apres = await p.evaluate((i) => localStorage.getItem(`conviction:affaire:${i}`), id);
ok(JSON.stringify(JSON.parse(avant).solution) === JSON.stringify(JSON.parse(apres).solution) && JSON.parse(avant).intro === JSON.parse(apres).intro, "un lien d'affaire se refait à l'identique");

// L'affaire du jour s'ouvre depuis sa carte.
await p.goto(`${srv.base}conviction/`);
await p.click(".une.jour");
await p.waitForSelector("#jeu:not([hidden])");
ok((await p.textContent("#titre")).includes("affaire du jour"), "l'affaire du jour s'ouvre");

await nav.close();
srv.arreter();
console.log(erreurs.length ? `✗ ${erreurs.length} problème(s) : ${erreurs.join(" | ")}` : "✓ affaires inédites jouées au doigt");
process.exitCode = erreurs.length ? 1 : 0;
