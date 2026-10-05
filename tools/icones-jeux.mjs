import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ICONES, page } from "./icones-dessins.mjs";

/* Les icônes redessinées des jeux (tools/icones-dessins.mjs).
   node tools/icones-jeux.mjs            la planche avant / après : captures/icones-planche.png
   node tools/icones-jeux.mjs --ecrire   écrit <jeu>/icone.html ; ensuite
                                         `node tools/chevalier-icones.mjs <jeu>` refait les PNG */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, "..");
if (process.argv.includes("--ecrire")) {
  for (const id of Object.keys(ICONES)) { fs.writeFileSync(path.join(RACINE, id, "icone.html"), page(id)); console.log(id + "/icone.html"); }
  process.exit(0);
}
const data = (f) => "data:image/png;base64," + fs.readFileSync(f).toString("base64");
const avant = (id) => { try { return data(path.join(ICI, "captures", "icone-avant-" + id + ".png")); } catch (e) { return data(path.join(RACINE, id, "icone-512.png")); } };
const svg = (id) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${ICONES[id].fond}"/>${ICONES[id].dessin}</svg>`;
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:28px 30px 34px;background:#0d0d14;color:#fff;font:500 16px system-ui,sans-serif;width:1180px}
h1{font:800 28px system-ui;margin:0 0 4px}p{margin:0 0 20px;color:#b9b6c9}
.l{display:grid;grid-template-columns:150px 1fr 1fr;gap:26px;align-items:center;margin-bottom:26px}
.l b{font-size:19px}.c{display:flex;gap:16px;align-items:flex-end}.c small{display:block;color:#b9b6c9;font-size:14px;margin-top:6px;text-align:center}
.i{border-radius:22%;overflow:hidden;display:block}.i svg,.i img{display:block;width:100%;height:100%}.r{border-radius:50%}
h2{font:700 18px system-ui;color:#feca63;margin:0}
</style><h1>Les icônes des jeux, redessinées</h1><p>La recette de l'icône de La Bataille : le héros du jeu, vivant, cerné d'un trait épais, sur la couleur de son monde. En grand, puis à la taille de l'écran d'accueil du téléphone, puis en rond (Android).</p>
<div class="l"><span></span><h2>Aujourd'hui</h2><h2>Proposée</h2></div>
${Object.keys(ICONES).map((id) => `<div class="l"><b>${ICONES[id].nom}</b>
<div class="c"><div><span class="i" style="width:200px;height:200px"><img src="${avant(id)}"></span></div><div><span class="i" style="width:64px;height:64px"><img src="${avant(id)}"></span></div></div>
<div class="c"><div><span class="i" style="width:200px;height:200px">${svg(id)}</span></div><div><span class="i" style="width:64px;height:64px">${svg(id)}</span></div><div><span class="i r" style="width:64px;height:64px">${svg(id)}</span></div></div></div>`).join("")}`;
fs.mkdirSync(path.join(ICI, "captures"), { recursive: true });
const nav = await chromium.launch(), p = await nav.newPage({ viewport: { width: 1240, height: 900 }, deviceScaleFactor: 1.5 });
await p.setContent(html);
await p.screenshot({ path: path.join(ICI, "captures", "icones-planche.png"), fullPage: true });
await nav.close();
console.log("captures/icones-planche.png");
