import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* COULEURS des ronces de l'Épine (Julie, 2026-10-28 : « le vert me paraît jurer »).
   Planche : la ronce verte d'avant, A à contre-jour, B lie-de-vin, chacune à trois
   instants ; puis La Mort, passée du violet (réservé au Maudit) à la cendre.
   Sortie : bataille/docs/effets-maquette-ronces.png */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist"] });
const p = await nav.newPage({ viewport: { width: 360, height: 560 } });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(String(e)));
await p.goto(srv.base + "tools/mockup-bataille-effets.html", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.pret === "1");
await p.evaluate(() => window.__fx.arrete());
const lignes = [];
async function rangee(titre, regle, id, instants) {
  const imgs = [];
  for (const t of instants) {
    await p.evaluate(({ regle, id, t }) => { Object.assign(window, regle); window.__fx.image(id, t); }, { regle, id, t });
    imgs.push((await p.locator(".cadre").screenshot()).toString("base64"));
  }
  lignes.push({ titre, imgs });
}
/* la ronce d'avant, refaite à la main pour comparer */
await p.evaluate(() => { window.RONCE.V = { bord: "#1d3b1a", tige: "#3d7a2c", fane: "#594a22", lune: null, epine: "#c0303a", feuille: true }; });
await rangee("Avant : ronce verte", { ronce: "V" }, "epine", [0.62, 0.9, 1.7]);
await rangee("A : à contre-jour, bordée de lune", { ronce: "A" }, "epine", [0.62, 0.9, 1.7]);
await rangee("B : lie-de-vin, la vraie tige de ronce", { ronce: "B" }, "epine", [0.62, 0.9, 1.7]);
await rangee("La Mort : cendre au lieu du violet du Maudit", {}, "mort", [0.4, 0.85, 1.4]);
const q = await nav.newPage({ viewport: { width: 1200, height: 900 } });
await q.setContent(`<body style="margin:0;background:#05082a;color:#f4f2ff;font:500 16px Georgia;padding:18px">` +
  lignes.map((l) => `<div style="font:600 20px Georgia;color:#feca63;margin:10px 0 6px">${l.titre}</div><div style="display:flex;gap:8px">${l.imgs.map((b) => `<img src="data:image/png;base64,${b}" style="width:200px;border-radius:12px">`).join("")}</div>`).join("") + `</body>`);
await q.screenshot({ path: path.join(ICI, "..", "bataille", "docs", "effets-maquette-ronces.png"), fullPage: true });
await nav.close(); srv.arreter();
if (erreurs.length) { console.log("ERREURS\n" + erreurs.join("\n")); process.exit(1); }
console.log("planche : bataille/docs/effets-maquette-ronces.png");
