import { chromium, devices } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

/* L invitation d installation de Chrome n arrive jamais en automatisation :
   on la simule pour vérifier notre câblage, puis on contrôle le manifeste
   servi en ligne contre les critères de Chrome. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const URL = pathToFileURL(path.join(HERE, "..", "echecs", "index.html")).href;
const OUT = path.join(HERE, "captures") + path.sep;
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["Pixel 7"] });
const p = await ctx.newPage();
const errors = [];
p.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
p.on("pageerror", e => errors.push("pageerror: " + e.message));

await p.goto(URL, { waitUntil: "load" });
await p.evaluate(() => document.getElementById("startBtn").click());
await p.waitForTimeout(300);

const avant = await p.evaluate(() => document.getElementById("installBtn").hidden);

// Chrome nous passe l invitation
await p.evaluate(() => {
  window.__demande = 0;
  const e = new Event("beforeinstallprompt");
  e.prompt = () => { window.__demande++; };
  e.userChoice = Promise.resolve({ outcome: "accepted" });
  window.dispatchEvent(e);
});
const apres = await p.evaluate(() => ({
  cache: document.getElementById("installBtn").hidden,
  visible: document.getElementById("installBtn").offsetHeight > 0,
  libelle: document.getElementById("installBtn").innerText.split("\n")[0]
}));

await p.evaluate(() => document.getElementById("menuBtn").click());
await p.waitForTimeout(400);
await p.screenshot({ path: OUT + "install-01-menu.png" });

// on touche « Installer le jeu »
await p.evaluate(() => document.getElementById("installBtn").click());
await p.waitForTimeout(400);
const apresClic = await p.evaluate(() => ({
  demandeAppelee: window.__demande,
  cacheEnsuite: document.getElementById("installBtn").hidden,
  menuFerme: !document.getElementById("sheet").classList.contains("on")
}));

// le manifeste servi en ligne contre les criteres de Chrome
const r = await ctx.request.get("https://replica-n8n.github.io/games/echecs/manifest.json");
const m = await r.json();
const criteres = {
  nom: !!(m.name || m.short_name),
  icone192: m.icons.some(i => i.sizes === "192x192" && i.type === "image/png"),
  icone512: m.icons.some(i => i.sizes === "512x512" && i.type === "image/png"),
  maskable: m.icons.some(i => (i.purpose || "").includes("maskable")),
  affichage: ["standalone", "fullscreen", "minimal-ui"].includes(m.display),
  depart: !!m.start_url,
  identite: !!m.id
};

console.log(JSON.stringify({ avant, apres, apresClic, criteres, errors }, null, 2));
await browser.close();
