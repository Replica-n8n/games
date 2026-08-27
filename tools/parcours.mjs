import { chromium, devices } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

/* Parcours complet des deux jeux en Chromium, profil Pixel 7 :
   choix du jeu, un coup, rotation, prises, menu, fin de partie, installation.
   Pour les dames, on pose des positions directement dans la page : tout le
   code de l'app est global, donc `etat` et `dessiner()` sont accessibles. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const URL = pathToFileURL(path.join(HERE, "..", "echecs", "index.html")).href;
const OUT = path.join(HERE, "captures") + path.sep;
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["Pixel 7"] });
const p = await ctx.newPage();
const erreurs = [];
p.on("console", m => { if (m.type() === "error") erreurs.push(m.text()); });
p.on("pageerror", e => erreurs.push("pageerror: " + e.message));

const clic = async (sel, attente = 350) => { await p.evaluate(s => document.querySelector(s).click(), sel); await p.waitForTimeout(attente); };
const touche = async i => { await p.evaluate(n => document.querySelector('.sq[data-i="' + n + '"]').click(), i); await p.waitForTimeout(140); };
const shot = async n => p.screenshot({ path: OUT + n });
const lire = fn => p.evaluate(fn);

await p.goto(URL, { waitUntil: "load" });
await p.waitForTimeout(400);

/* ---------- l ecran d accueil propose les deux jeux ---------- */
const accueil = await lire(() => ({
  mots: [...document.querySelectorAll(".choix")].map(e => e.innerText.trim()),
  hauteur: Math.round(document.querySelector(".choix").getBoundingClientRect().height),
  aucunBoutonStart: !document.getElementById("startBtn")
}));
await shot("duo-01-accueil.png");

/* ================= ECHECS ================= */
await clic('.choix[data-jeu="echecs"]');
const ech = await lire(() => ({
  cases: document.querySelectorAll(".sq").length,
  pieces: document.querySelectorAll(".piece").length,
  taille: Math.round(document.querySelector(".sq").getBoundingClientRect().width),
  statut: document.getElementById("status").textContent
}));
await touche(52); await touche(36);              // e2-e4
await p.waitForTimeout(600);
const echApres = await lire(() => ({
  statut: document.getElementById("status").textContent,
  pivote: document.getElementById("stage").classList.contains("flip")
}));
await shot("duo-02-echecs.png");

// mat de l imbecile
await touche(11); await touche(27);              // annule par un vrai enchainement
await p.waitForTimeout(300);
await clic("#menuBtn"); await clic("#resetBtn"); await clic("#resetBtn");
await p.waitForTimeout(400);
for (const [a, b] of [[53, 45], [12, 28], [54, 38], [3, 39]]) { await touche(a); await touche(b); await p.waitForTimeout(400); }
await p.waitForTimeout(1400);
const echFin = await lire(() => ({
  visible: !document.getElementById("overlay").classList.contains("hidden"),
  titre: document.getElementById("finTitre").textContent,
  sous: document.getElementById("finSous").textContent,
  roiCouche: !!document.querySelector(".roi-couche")
}));
await shot("duo-03-mat.png");

/* ================= DAMES ================= */
await clic("#changerBtn");
await clic('.choix[data-jeu="dames"]');
const dam = await lire(() => ({
  cases: document.querySelectorAll(".sq").length,
  pieces: document.querySelectorAll(".piece").length,
  jetons: document.querySelectorAll(".piece.jeton").length,
  taille: Math.round(document.querySelector(".sq").getBoundingClientRect().width),
  surCaseClaire: [...document.querySelectorAll(".sq.light")].filter(e => e.querySelector(".piece")).length,
  statut: document.getElementById("status").textContent
}));
await shot("duo-04-dames.png");

// un coup simple : pion de 61 vers 50
await touche(61);
const pointsMontres = await lire(() => document.querySelectorAll(".hint").length);
await touche(50);
await p.waitForTimeout(600);
const damApres = await lire(() => ({
  statut: document.getElementById("status").textContent,
  pivote: document.getElementById("stage").classList.contains("flip")
}));

// une rafle de trois pions, imposee par la regle du maximum
await lire(() => {
  etat.plateau = etat.plateau.map(() => null);
  etat.plateau[72] = "P";
  [61, 41, 43].forEach(i => { etat.plateau[i] = "p"; });
  etat.plateau[9] = "p";            // pour que la partie ne soit pas finie
  etat.trait = "blanc";
  fin = MOTEUR.fin(etat);
  dessiner();
});
await p.waitForTimeout(300);
await touche(72);
const rafle1 = await lire(() => ({
  points: [...document.querySelectorAll(".hint")].map(e => +e.parentElement.dataset.i),
  mange: [...document.querySelectorAll(".sq.mange")].map(e => +e.dataset.i)
}));
await shot("duo-05-rafle.png");
await touche(50);
const rafle2 = await lire(() => ({
  message: document.getElementById("footnote").textContent,
  pieceEncoreAuDepart: !!document.querySelector('.sq[data-i="72"] .piece'),
  trace: document.querySelectorAll(".sq.trace").length
}));
await touche(32); await touche(54);
await p.waitForTimeout(600);
const rafle3 = await lire(() => ({
  arrivee: !!document.querySelector('.sq[data-i="54"] .piece'),
  restants: document.querySelectorAll(".piece").length,
  prisesAffichees: document.querySelectorAll("#lootBlanc .mini").length,
  statut: document.getElementById("status").textContent
}));

// promotion : un pion qui s arrete sur la derniere rangee devient dame
await lire(() => {
  etat.plateau = etat.plateau.map(() => null);
  etat.plateau[10] = "P";
  etat.plateau[99] = "p";
  etat.trait = "blanc";
  fin = MOTEUR.fin(etat);
  dessiner();
});
await touche(10); await touche(1);
await p.waitForTimeout(400);
const promotion = await lire(() => ({
  dame: !!document.querySelector('.sq[data-i="1"] .piece.dame')
}));

// prise obligatoire ailleurs : la piece touchee ne bouge pas, on montre qui peut
await lire(() => {
  etat.plateau = etat.plateau.map(() => null);
  etat.plateau[72] = "P";      // ce pion peut prendre
  etat.plateau[61] = "p";
  etat.plateau[94] = "P";      // celui-la ne peut pas
  etat.plateau[9] = "p";
  etat.trait = "blanc";
  fin = MOTEUR.fin(etat);
  dessiner();
});
await touche(94);
await p.waitForTimeout(400);
const obligatoire = await lire(() => ({
  message: document.getElementById("footnote").textContent,
  entourees: [...document.querySelectorAll(".sq.aide")].map(e => +e.dataset.i),
  statut: document.getElementById("status").textContent
}));
await shot("duo-06-obligatoire.png");

/* ================= menu et installation ================= */
await clic("#menuBtn");
const menu = await lire(() => ({
  jeuActif: document.getElementById("optDames").classList.contains("on"),
  echecsActif: document.getElementById("optEchecs").classList.contains("on"),
  pivot: document.getElementById("optPivot").classList.contains("on")
}));
await shot("duo-07-menu.png");
await clic("#optFixed");
const fixe = await lire(() => ({
  flip: document.getElementById("stage").classList.contains("flip"),
  memoire: localStorage.getItem("damier.plateau")
}));
await clic("#closeBtn");

// le jeu choisi survit au rechargement
await p.reload({ waitUntil: "load" });
await p.waitForTimeout(500);
const apresRechargement = await lire(() => ({
  jeuRetenu: localStorage.getItem("damier.jeu"),
  cases: document.querySelectorAll(".sq").length,
  choixPropose: !document.getElementById("faceChoix").hidden
}));

// invitation d installation simulee
await clic('.choix[data-jeu="dames"]');
const avantInvit = await lire(() => document.getElementById("installBtn").hidden);
await lire(() => {
  window.__demande = 0;
  const e = new Event("beforeinstallprompt");
  e.prompt = () => { window.__demande++; };
  e.userChoice = Promise.resolve({ outcome: "accepted" });
  window.dispatchEvent(e);
});
await clic("#menuBtn");
await clic("#installBtn");
const install = await lire(() => ({ demandeAppelee: window.__demande, cache: document.getElementById("installBtn").hidden }));

console.log(JSON.stringify({
  accueil, ech, echApres, echFin,
  dam, pointsMontres, damApres, rafle1, rafle2, rafle3, promotion, obligatoire,
  menu, fixe, apresRechargement, avantInvit, install, erreurs
}, null, 2));
await browser.close();
