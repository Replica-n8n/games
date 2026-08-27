import { chromium, devices } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

/* Rejoue la position signalée le 2026-08-27 : roi noir en f7, échec du fou c4,
   aucune case pour le roi, mais deux pièces peuvent parer en e6.
   Vérifie que le jeu ne crie pas « mat » et qu il montre les parades. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const URL = pathToFileURL(path.join(HERE, "..", "echecs", "index.html")).href;
const OUT = path.join(HERE, "captures") + path.sep;
fs.mkdirSync(OUT, { recursive: true });

const FEN = "2b2b2/5k2/7r/1PP2P1p/1pBQ2nP/rn2R3/8/2B1K3 b - - 0 1";

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["Pixel 7"] });
const p = await ctx.newPage();
const errors = [];
p.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
p.on("pageerror", e => errors.push("pageerror: " + e.message));

await p.goto(URL, { waitUntil: "load" });
await p.evaluate(() => document.getElementById("startBtn").click());
await p.evaluate(() => document.getElementById("optFixed").click());
await p.waitForTimeout(300);

// on pose la position directement : tout est global dans la page
await p.evaluate(fen => {
  const [pos, side] = fen.split(" ");
  const board = [];
  for (const row of pos.split("/")) for (const ch of row) {
    if (/\d/.test(ch)) for (let i = 0; i < +ch; i++) board.push(null); else board.push(ch);
  }
  state.board = board;
  state.side = side;
  state.castle = { K: false, Q: false, k: false, q: false };
  state.ep = -1;
  state.last = { from: 61, to: 26 };
  finish();
  render();
}, FEN);
await p.waitForTimeout(400);

const etat = await p.evaluate(() => ({
  statut: document.getElementById("status").textContent,
  finDePartie: !!state.over,
  surcouche: !document.getElementById("overlay").classList.contains("hidden"),
  roiEnRouge: !!document.querySelector(".sq.check")
}));
await p.screenshot({ path: OUT + "parade-01-echec.png" });

// on touche le roi, qui ne peut pas bouger
await p.evaluate(() => document.querySelector('.sq[data-i="13"]').click());
await p.waitForTimeout(500);
const apresRoi = await p.evaluate(() => {
  const noms = [...document.querySelectorAll(".sq.aide")]
    .map(e => { const i = +e.dataset.i; return "abcdefgh"[i % 8] + (8 - Math.floor(i / 8)); });
  return { message: document.getElementById("footnote").textContent, entourees: noms };
});
await p.screenshot({ path: OUT + "parade-02-aide.png" });

// on joue la parade proposee : fou c8 en e6
await p.evaluate(() => document.querySelector('.sq[data-i="2"]').click());
await p.waitForTimeout(200);
await p.evaluate(() => document.querySelector('.sq[data-i="20"]').click());
await p.waitForTimeout(500);
const apresParade = await p.evaluate(() => ({
  statut: document.getElementById("status").textContent,
  encoreEnEchec: !!document.querySelector(".sq.check"),
  anneaux: document.querySelectorAll(".sq.aide").length
}));
await p.screenshot({ path: OUT + "parade-03-pare.png" });

console.log(JSON.stringify({ etat, apresRoi, apresParade, errors }, null, 2));
await browser.close();
