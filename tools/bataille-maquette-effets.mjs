import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* MAQUETTE des effets (tools/mockup-bataille-effets.html) : trois instants de
   chaque effet en planches (gravures, arcanes), et une vidéo des seize à la suite.
   Sorties : bataille/docs/effets-maquette-gravures.png, -arcanes.png, -video.webm */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.join(ICI, "..", "bataille", "docs");
const TMP = path.join(ICI, "captures", "effets");
fs.mkdirSync(TMP, { recursive: true });
const srv = await servir();
const navigateur = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist"] });
const erreurs = [];
/* trois instants par effet : l'élan, le choc, ce qui reste */
const INSTANTS = { phenix: [0.6, 1.25, 1.9], givre: [0.4, 1.0, 2.3], epine: [0.45, 0.6, 1.0], ailes: [0.4, 0.8, 1.3], bouclier: [0.38, 0.5, 0.9],
  sangsue: [0.6, 0.85, 1.3], criniere: [0.7, 1.4, 1.6], eclair: [0.2, 0.85, 0.95], heritage: [0.5, 1.0, 1.6],
  tour: [0.4, 0.6, 0.9], mort: [0.8, 1.3, 1.7], force: [0.3, 0.45, 1.0], roue: [0.5, 1.2, 1.9], temperance: [0.5, 1.0, 1.4], etoile: [0.5, 0.8, 1.3], soleil: [0.4, 0.66, 1.2] };

const p = await navigateur.newPage({ viewport: { width: 360, height: 560 }, deviceScaleFactor: 1 });
p.on("pageerror", (e) => erreurs.push(String(e)));
await p.goto(srv.base + "tools/mockup-bataille-effets.html", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.pret === "1");
await p.evaluate(() => window.__fx.arrete());
const ordre = await p.evaluate(() => window.__fx.ordre);
for (const id of ordre) for (const [i, t] of INSTANTS[id].entries()) {
  await p.evaluate(({ id, t }) => window.__fx.image(id, t), { id, t });
  await p.locator(".cadre").screenshot({ path: path.join(TMP, id + "-" + i + ".png") });
}
const noms = await p.evaluate(() => Object.fromEntries(window.__fx.ordre.map((id) => [id, window.__fx.fx[id].nom])));
async function planche(ids, fichier, titre) {
  const q = await navigateur.newPage({ viewport: { width: 1700, height: 900 } });
  await q.goto(srv.base + "tools/");
  const cases = ids.map((id) => `<div style="display:flex;flex-direction:column;gap:6px"><div style="font:600 20px Georgia;color:#feca63">${noms[id]}</div><div style="display:flex;gap:6px">${[0, 1, 2].map((i) => `<img src="${srv.base}tools/captures/effets/${id}-${i}.png" style="width:170px;border-radius:12px">`).join("")}</div></div>`).join("");
  await q.setContent(`<body style="margin:0;background:#05082a;color:#f4f2ff;font:500 16px Georgia;padding:18px"><div style="font:600 24px Georgia;margin-bottom:14px">${titre}</div><div style="display:grid;grid-template-columns:repeat(3,auto);gap:22px 26px;justify-content:start">${cases}</div></body>`);
  await q.waitForLoadState("networkidle");
  await q.screenshot({ path: path.join(DOCS, fichier), fullPage: true });
  await q.close();
}
await planche(ordre.slice(0, 9), "effets-maquette-gravures.png", "Les gravures : l'élan, le choc, ce qui reste");
await planche(ordre.slice(9), "effets-maquette-arcanes.png", "Les arcanes : l'élan, le choc, ce qui reste");

/* la vidéo : les seize, en vrai temps */
const ctx = await navigateur.newContext({ viewport: { width: 360, height: 560 }, recordVideo: { dir: TMP, size: { width: 360, height: 560 } } });
const v = await ctx.newPage();
v.on("pageerror", (e) => erreurs.push(String(e)));
await v.goto(srv.base + "tools/mockup-bataille-effets.html", { waitUntil: "load" });
await v.waitForFunction(() => document.body.dataset.pret === "1");
for (const id of ordre) {
  await v.evaluate((id) => window.__fx.joue(id), id);
  await v.waitForTimeout(Math.round((await v.evaluate((id) => window.__fx.fx[id].d, id)) * 1000 + 400));
}
const video = await v.video().path();
await ctx.close();
fs.copyFileSync(video, path.join(DOCS, "effets-maquette-video.webm"));
await navigateur.close();
srv.arreter();
if (erreurs.length) { console.log("ERREURS\n" + erreurs.join("\n")); process.exit(1); }
console.log("maquette des effets : bataille/docs/effets-maquette-*.png et -video.webm");
