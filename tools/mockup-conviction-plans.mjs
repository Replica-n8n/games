import { chromium, devices } from "playwright";
import fs from "node:fs";
import { servir } from "./serveur.mjs";

/* Planche de TOUS les plans, tels qu'en jeu (pour juger si les lieux se ressemblent).
   node tools/mockup-conviction-plans.mjs <png> [id,id…] */
const [sortie, filtre] = process.argv.slice(2);
const ids = JSON.parse(fs.readFileSync("conviction/puzzles/index.json", "utf8")).filter((id) => !filtre || filtre.split(",").includes(id));
// Un plan par histoire : le premier chapitre.
const vus = new Set(), garde = [];
for (const id of ids) { const h = id.replace(/-(facile|moyen|difficile)$/, ""); if (!vus.has(h) || filtre) { vus.add(h); garde.push(id); } }
const srv = await servir(); const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctx = await nav.newContext({ ...devices["Pixel 9"] }); const p = await ctx.newPage();
await p.addInitScript(() => localStorage.setItem("conviction:tuto", "true"));
const images = [];
for (const id of garde) {
  await p.goto(`${srv.base}conviction/?enquete=${id}`); await p.waitForSelector("#jeu:not([hidden])");
  if (await p.isVisible("#dossier[open]")) await p.click("#b-ouvrir");
  await p.waitForTimeout(250);
  images.push({ id, b64: (await p.locator(".maquette").screenshot()).toString("base64") });
}
const page = await nav.newPage({ viewport: { width: 1900, height: 1000 } });
await page.setContent(`<body style="margin:0;background:#c9d0d6;font:700 15px system-ui"><div id="g" style="display:grid;grid-template-columns:repeat(6,300px);gap:14px;padding:14px;width:max-content">${images.map((x) => `<div><img src="data:image/png;base64,${x.b64}" style="width:300px;display:block;border-radius:8px"><div style="margin-top:4px">${x.id}</div></div>`).join("")}</div></body>`);
await page.locator("#g").screenshot({ path: sortie });
await nav.close(); srv.arreter();
console.log(`✓ ${garde.length} plans : ${sortie}`);
