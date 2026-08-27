import { chromium, devices } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

/* Parcours complet du jeu en Chromium, profil Pixel 7.
   Prerequis : npm i playwright && npx playwright install chromium
   Les captures atterrissent dans tools/captures/ (ignore par git). */
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
await p.waitForTimeout(400);

const tap = async i => {
  await p.evaluate(n => document.querySelector('.sq[data-i="' + n + '"]').click(), i);
  await p.waitForTimeout(120);
};
const shot = async n => p.screenshot({ path: OUT + n });
const click = async sel => { await p.evaluate(s => document.querySelector(s).click(), sel); await p.waitForTimeout(420); };

await shot("and-01-depart.png");
const introWords = await p.evaluate(() =>
  document.getElementById("overlay").innerText.split("\n").map(t => t.trim()).filter(Boolean));

await click("#startBtn");
await shot("and-02-plateau.png");

// repartition du vide vertical
const space = await p.evaluate(() => {
  const r = s => { const b = document.querySelector(s).getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height), w: Math.round(b.width) }; };
  const stage = r("#stage"), board = r("#board"), foot = r(".footnote"), bar = r("#barBlack");
  return {
    viewport: { w: innerWidth, h: innerHeight },
    topbar: r(".topbar"), stage, board, bar, foot,
    videAuDessus: stage.top - r(".topbar").bottom,
    videEnDessous: foot.top - stage.bottom,
    scroll: { h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth },
    carre: Math.round(document.querySelector(".sq").getBoundingClientRect().width)
  };
});

// un coup : le plateau doit pivoter
await tap(52); await tap(36);
await p.waitForTimeout(600);
const pivote = await p.evaluate(() => document.getElementById("stage").classList.contains("flip"));
await shot("and-03-pivote.png");

// prise pour remplir les bandeaux
await tap(11); await tap(27); await p.waitForTimeout(500);
await tap(36); await tap(27); await p.waitForTimeout(600);
const loot = await p.evaluate(() => ({
  blancs: document.getElementById("lootWhite").innerText.trim(),
  noirs: document.getElementById("lootBlack").innerText.trim(),
  barreActive: document.getElementById("barBlack").classList.contains("turn") ? "noirs" : "blancs"
}));
await shot("and-04-prise.png");

// menu : les deux options de plateau
await click("#menuBtn");
await shot("and-05-menu.png");
const menuAvant = await p.evaluate(() => ({
  pivot: document.getElementById("optPivot").classList.contains("on"),
  fixe: document.getElementById("optFixed").classList.contains("on")
}));
await click("#optFixed");
const apresFixe = await p.evaluate(() => ({
  flip: document.getElementById("stage").classList.contains("flip"),
  pivot: document.getElementById("optPivot").classList.contains("on"),
  fixe: document.getElementById("optFixed").classList.contains("on"),
  memoire: localStorage.getItem("echecs.plateau")
}));
await click("#closeBtn");
await shot("and-06-fixe.png");

// le choix survit au rechargement
await p.reload({ waitUntil: "load" });
await p.waitForTimeout(400);
const apresRechargement = await p.evaluate(() => ({
  fixe: document.getElementById("optFixed").classList.contains("on")
}));

// mat de l imbecile
await click("#startBtn");
for (const [a, b] of [[53, 45], [12, 28], [54, 38], [3, 39]]) { await tap(a); await tap(b); await p.waitForTimeout(420); }
const mat = await p.evaluate(() => document.getElementById("status").textContent);
await shot("and-07-mat.png");

// l ecran de fin arrive apres un temps, pour laisser voir la position
const avant = await p.evaluate(() => document.getElementById("overlay").classList.contains("hidden"));
await p.waitForTimeout(1400);
const ecranFin = await p.evaluate(() => ({
  visible: !document.getElementById("overlay").classList.contains("hidden"),
  intro: !document.getElementById("faceIntro").hidden,
  titre: document.getElementById("endTitle").textContent,
  sous: document.getElementById("endSub").textContent,
  bouton: document.getElementById("againBtn").textContent,
  hauteurBouton: Math.round(document.getElementById("againBtn").getBoundingClientRect().height)
}));
await shot("and-08-fin.png");

// recommencer relance directement une partie
await click("#againBtn");
const apresRecommencer = await p.evaluate(() => ({
  voile: document.body.classList.contains("veil"),
  pieces: document.querySelectorAll(".piece").length,
  statut: document.getElementById("status").textContent
}));
await shot("and-09-nouvelle.png");

console.log(JSON.stringify({ introWords, space, pivote, loot, menuAvant, apresFixe, apresRechargement, mat, matPasCouvertTdSuite: avant, ecranFin, apresRecommencer, errors }, null, 2));
await browser.close();
