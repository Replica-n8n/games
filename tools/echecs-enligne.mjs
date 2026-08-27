import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

/* Vérifie le jeu tel qu'il est servi par GitHub Pages, pas en local :
   codes HTTP, service worker, installabilité, et un coup joué hors ligne. */
const BASE = "https://replica-n8n.github.io/games/";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "captures") + path.sep;
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["Pixel 7"] });
const p = await ctx.newPage();
const errors = [];
p.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
p.on("pageerror", e => errors.push("pageerror: " + e.message));

const codes = {};
for (const u of ["", "echecs/", "echecs/manifest.json", "echecs/sw.js", "echecs/moteur-echecs.js", "echecs/moteur-dames.js", "echecs/icone-192.png", "echecs/icone-512.png"]) {
  const r = await ctx.request.get(BASE + u);
  codes[u || "(accueil)"] = r.status() + " " + (r.headers()["content-type"] || "").split(";")[0];
}

// accueil du depot
await p.goto(BASE, { waitUntil: "load" });
const accueil = await p.evaluate(() => ({
  titre: document.querySelector("h1").textContent,
  jeux: [...document.querySelectorAll("a.jeu strong")].map(e => e.textContent),
  iconeChargee: (() => { const i = document.querySelector("a.jeu img"); return i.naturalWidth > 0; })()
}));
await p.screenshot({ path: OUT + "web-01-accueil.png" });

// le jeu
await p.goto(BASE + "echecs/", { waitUntil: "load" });
await p.waitForTimeout(1500);
const manifeste = await p.evaluate(async () => {
  const l = document.querySelector('link[rel="manifest"]');
  const r = await fetch(l.href);
  const m = await r.json();
  return { nom: m.name, demarrage: m.start_url, affichage: m.display, icones: m.icons.length };
});

// service worker : enregistre puis controleur apres rechargement
const swAvant = await p.evaluate(() => navigator.serviceWorker.getRegistrations().then(r => r.length));
await p.reload({ waitUntil: "load" });
await p.waitForTimeout(1200);
const swApres = await p.evaluate(() => !!navigator.serviceWorker.controller);

// un coup joue en ligne
await p.evaluate(() => document.querySelector('.choix[data-jeu="echecs"]').click());
await p.waitForTimeout(400);
const tap = async i => { await p.evaluate(n => document.querySelector('.sq[data-i="' + n + '"]').click(), i); await p.waitForTimeout(150); };
await tap(52); await tap(36);
await p.waitForTimeout(600);
const apresCoup = await p.evaluate(() => ({
  statut: document.getElementById("status").textContent,
  pivote: document.getElementById("stage").classList.contains("flip")
}));
await p.screenshot({ path: OUT + "web-02-jeu.png" });

// hors ligne : c est la vraie preuve de la PWA
await ctx.setOffline(true);
let horsLigne = { charge: false, pieces: 0 };
try {
  await p.reload({ waitUntil: "load" });
  await p.waitForTimeout(800);
  horsLigne = await p.evaluate(() => ({
    charge: !!document.getElementById("board"),
    pieces: document.querySelectorAll(".piece").length,
    titre: document.title
  }));
} catch (e) { horsLigne.erreur = String(e).slice(0, 120); }
await p.screenshot({ path: OUT + "web-03-hors-ligne.png" });
await ctx.setOffline(false);

console.log(JSON.stringify({ codes, accueil, manifeste, swAvant, swApres, apresCoup, horsLigne, errors }, null, 2));
await browser.close();
