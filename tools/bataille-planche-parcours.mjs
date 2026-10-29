/* Planche des captures de bataille-parcours.mjs (à lancer après lui) : bataille/docs/parcours-jeu.png */
import { chromium } from "playwright";
import fs from "node:fs";
const L = [["1-accueil","L'accueil"],["7-annees","Après Jouer"],["2-bandeau","Le mois s'annonce"],["4-pose","Il file à sa place"],["8-atlas","Le globe : l'atlas"],["5-nouveau","Nouvelle gravure"],["11-ciel","Deux étoiles : le ciel"],["6-fin","Le bilan"]];
const img = (n) => "data:image/png;base64," + fs.readFileSync("captures/bataille-parcours-" + n + ".png").toString("base64");
const html = `<body style="margin:0;background:#05082a;padding:20px;font-family:Georgia;color:#feca63"><div style="display:grid;grid-template-columns:repeat(4,360px);gap:20px">${L.map(([n,t])=>`<div><div style="font-size:20px;margin-bottom:8px">${t}</div><img src="${img(n)}" style="width:360px;border-radius:20px"></div>`).join("")}</div></body>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1540, height: 800 } });
await p.setContent(html); await p.screenshot({ path: "../bataille/docs/parcours-jeu.png", fullPage: true }); await b.close();
