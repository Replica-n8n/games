import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Planche des trois directions de l'accueil (tools/mockup-conviction-menu-2027.html) :
   le premier écran de chacune sur un téléphone de 360 × 732, et sa longueur en écrans.
   Écrit docs/conviction-menu-2027.png. */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(ICI, "..", "docs", "conviction-menu-2027");
fs.mkdirSync(TMP, { recursive: true });
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const erreurs = [];
const VUES = [["A", "A · Une seule pile, triée"], ["B", "B · Des onglets (Enquêtes)"], ["B2", "B · Des onglets (Inédites)"], ["C", "C · Le bureau, un seul écran"]];
const mesures = {};
for (const [d] of VUES) {
  const p = await nav.newPage({ viewport: { width: 360, height: 732 }, deviceScaleFactor: 2 });
  p.on("pageerror", (e) => erreurs.push(`${d} : ${e.message}`));
  await p.goto(`${srv.base}tools/mockup-conviction-menu-2027.html?d=${d}`);
  await p.waitForSelector("body[data-pret]", { state: "attached", timeout: 60000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  mesures[d] = await p.evaluate(() => ({ ecrans: (document.documentElement.scrollHeight / innerHeight).toFixed(2), cibles: document.querySelectorAll("a, button").length }));
  await p.screenshot({ path: path.join(TMP, `${d}.png`) });
  await p.close();
}
const p = await nav.newPage({ viewport: { width: 1600, height: 900 } });
await p.setContent(`<body style="margin:0;background:#c9d0d6;font:15px system-ui"><div id="pl" style="display:flex;gap:24px;padding:24px;width:max-content">${VUES.map(([d, t]) => `<figure style="margin:0"><img src="data:image/png;base64,${fs.readFileSync(path.join(TMP, d + ".png")).toString("base64")}" style="width:360px;border-radius:24px;box-shadow:0 8px 24px #0005;display:block"><figcaption style="margin-top:10px;font-weight:800">${t}</figcaption><small>${mesures[d].ecrans} écran(s) · ${mesures[d].cibles} cibles</small></figure>`).join("")}</div></body>`);
await p.locator("#pl").screenshot({ path: path.join(ICI, "..", "docs", "conviction-menu-2027.png") });
await nav.close();
srv.arreter();
console.log(JSON.stringify(mesures));
console.log(erreurs.length ? `✗ ${erreurs.join(" | ")}` : "✓ planche écrite : docs/conviction-menu-2027.png");
