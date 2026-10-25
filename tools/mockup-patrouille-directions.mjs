import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Capture la planche des trois directions artistiques
   (tools/mockup-patrouille-directions.html) dans docs/patrouille-directions.png,
   et rend les mesures faites sur les pixels : contraste des tirs contre le décor
   (seuil 3:1) et écart de couleur entre les mondes d'une même direction. */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const p = await nav.newPage({ viewport: { width: 1640, height: 1000 }, deviceScaleFactor: 2 });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
await p.goto(srv.base + "tools/mockup-patrouille-directions.html?nc=" + Date.now());
await p.waitForSelector("body[data-pret]");
const M = await p.evaluate(() => window.MESURES);
await p.locator("#planche").screenshot({ path: path.join(ICI, "..", "docs", "patrouille-directions.png") });
await nav.close();
srv.arreter();

const fr = (x) => x.toFixed(1).replace(".", ",");
let rates = 0;
for (const [dir, planetes] of Object.entries(M)) {
  const lignes = Object.entries(planetes).filter(([k]) => k !== "ecart").map(([pl, m]) => {
    const ok = Math.min(m.rouge, m.bleu) >= 3; if (!ok) rates++;
    return `${ok ? "✓" : "✗"} ${pl} rouge ${fr(m.rouge)} bleu ${fr(m.bleu)}`;
  });
  console.log(`${dir} (ΔE min ${Math.round(planetes.ecart.min)}, ${planetes.ecart.paire}) : ${lignes.join(" · ")}`);
}
if (erreurs.length) { console.log("✗ erreurs :", erreurs.join(" | ")); process.exit(1); }
if (rates) { console.log(`✗ ${rates} écran(s) sous 3:1`); process.exit(1); }
console.log("✓ planche écrite : docs/patrouille-directions.png");
