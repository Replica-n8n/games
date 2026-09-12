import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { servir } from "./serveur.mjs";

/* L'ecran de depart « livre d'images », dans un VRAI navigateur, au format
   d'un Pixel 9.

   Ce qu'on prouve ici, et qu'une capture seule ne prouve pas :
   1. les polices viennent bien du depot, et pas d'un repli silencieux ;
   2. plus aucun emoji dans ce qui s'affiche au depart ;
   3. tout l'ecran tient sans defiler, sans que deux blocs se chevauchent ;
   4. aucun texte des blasons ne sort de l'ecu (sa pointe mange les bords) ;
   5. chaque cible fait 44 points au moins ;
   6. la coche suit bien le choix Normal / Difficile ;
   7. le reglage « reduire les animations » coupe les rebonds. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "captures") + path.sep;
const site = await servir();
const navigateur = await chromium.launch();
const griefs = [];
const erreurs = [];

async function ouvrir(options) {
  const ctx = await navigateur.newContext({ ...devices["Pixel 9"], ...options });
  const p = await ctx.newPage();
  p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
  p.on("pageerror", (e) => erreurs.push("pageerror: " + e.message));
  await p.goto(site.jeu, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  return { ctx, p };
}

const { ctx, p } = await ouvrir({});

/* ------------------------------------------------ 1. les polices */
const polices = await p.evaluate(async () => {
  const demandes = ['800 20px "Baloo 2"', '400 16px "Andika"', '700 16px "Andika"'];
  const r = {};
  for (const d of demandes) {
    const faces = await document.fonts.load(d, "Qui es-tu");
    r[d] = faces.length > 0 && faces.every((f) => f.status === "loaded");
  }
  r.titre = getComputedStyle(document.querySelector("#depart .titre")).fontFamily;
  return r;
});
const servisPolices = site.servis.filter((s) => s.rel.includes("/polices/"));
Object.entries(polices).forEach(([k, v]) => {
  if (k !== "titre" && v !== true) griefs.push("police non chargee : " + k);
});
if (!servisPolices.length || servisPolices.some((s) => s.code !== 200))
  griefs.push("polices mal servies depuis le depot : " + JSON.stringify(servisPolices));

/* ------------------------------------------------ 2. plus d'emoji */
const emojis = await p.evaluate(() => {
  const motif = /\p{Extended_Pictographic}/u;
  const trouves = [];
  document.querySelectorAll("#depart *").forEach((e) => {
    if (e.id === "mondeHasard") return;          /* cachee en normal, voir plus bas */
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) return;
    for (const n of e.childNodes) {
      if (n.nodeType === 3 && motif.test(n.nodeValue)) trouves.push(n.nodeValue.trim());
    }
  });
  return trouves;
});
if (emojis.length) griefs.push("emojis encore affiches au depart : " + emojis.join(" "));

const icones = await p.evaluate(() => [...document.querySelectorAll(".perso")].map((b) => ({
  perso: b.dataset.perso,
  embleme: b.querySelectorAll(".ic svg").length,
  sorts: b.querySelectorAll(".sorts svg").length,
})));
icones.forEach((i) => {
  if (i.embleme !== 1 || i.sorts !== 4) griefs.push(i.perso + " : " + i.embleme + " embleme, " + i.sorts + " sorts dessines (1 et 4 attendus)");
});
const pastilles = await p.evaluate(() => document.querySelectorAll("#mondes .rond svg").length);
if (pastilles !== 3) griefs.push(pastilles + " emblemes de monde dessines (3 attendus)");

/* ------------------------------------------------ 3. l'ecran tient */
const tenue = await p.evaluate(() => {
  const blocs = ["#depart .titre", "#persos", "#bascule", "#mondes", "#jouer"]
    .map((s) => { const r = document.querySelector(s).getBoundingClientRect();
      return { s, haut: Math.round(r.top), bas: Math.round(r.bottom) }; });
  const chevauchements = [];
  for (let i = 1; i < blocs.length; i++)
    if (blocs[i].haut < blocs[i - 1].bas) chevauchements.push(blocs[i - 1].s + " / " + blocs[i].s);
  return { blocs, hauteur: innerHeight, chevauchements };
});
tenue.blocs.forEach((b) => {
  if (b.haut < 0 || b.bas > tenue.hauteur) griefs.push(b.s + " sort de l'ecran (" + b.haut + " a " + b.bas + " sur " + tenue.hauteur + ")");
});
tenue.chevauchements.forEach((c) => griefs.push("chevauchement : " + c));

/* ------------------------------------------------ 4. le texte reste dans l'ecu */
const debordements = await p.evaluate(() => {
  /* On mesure l'ecu A PLAT : le blason choisi est incline, et un rectangle
     englobant incline ne dit rien de la forme. */
  const st = document.createElement("style");
  st.textContent = ".perso{transform:none !important}";
  document.head.appendChild(st);
  const POLY = [[0,0],[1,0],[1,.62],[.94,.76],[.82,.88],[.5,1],[.18,.88],[.06,.76],[0,.62]];
  const dedans = (x, y) => {
    let c = false;
    for (let i = 0, j = POLY.length - 1; i < POLY.length; j = i++) {
      const [xi, yi] = POLY[i], [xj, yj] = POLY[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const sortie = [];
  document.querySelectorAll(".perso").forEach((b) => {
    const I = b.querySelector(".i").getBoundingClientRect();
    const rects = [];
    b.querySelectorAll(".i b, .i .dit").forEach((t) => {
      const rg = document.createRange(); rg.selectNodeContents(t);
      [...rg.getClientRects()].forEach((r) => rects.push({ quoi: t.className || t.tagName, r }));
    });
    b.querySelectorAll(".i svg").forEach((s) => rects.push({ quoi: "icone", r: s.getBoundingClientRect() }));
    rects.forEach(({ quoi, r }) => {
      const coins = [[r.left, r.top], [r.right, r.top], [r.left, r.bottom], [r.right, r.bottom]];
      const hors = coins.filter(([x, y]) => !dedans((x - I.left) / I.width, (y - I.top) / I.height));
      if (hors.length) sortie.push(b.dataset.perso + " : " + quoi + " touche le bord de l'ecu");
    });
  });
  st.remove();
  return sortie;
});
debordements.forEach((d) => griefs.push(d));

/* ------------------------------------------------ 5. les cibles au pouce */
const cibles = await p.evaluate(() =>
  [...document.querySelectorAll(".perso, #bascule button, #mondes .monde, #jouer")].map((e) => {
    const r = e.getBoundingClientRect();
    return { nom: e.id || e.dataset.perso || e.className, l: Math.round(r.width), h: Math.round(r.height) };
  }));
cibles.forEach((c) => {
  if (c.l < 44 || c.h < 44) griefs.push(c.nom + " : " + c.l + " x " + c.h + " (44 minimum)");
});

await p.screenshot({ path: OUT + "depart-blasons.png" });

/* ------------------------------------------------ 6. la coche suit le choix */
const coche = async () => p.evaluate(() => ({
  normal: document.getElementById("modeNormal").classList.contains("pris"),
  difficile: document.getElementById("modeEssai").classList.contains("pris"),
  cocheNormal: getComputedStyle(document.getElementById("modeNormal"), "::before").content,
  cocheDifficile: getComputedStyle(document.getElementById("modeEssai"), "::before").content,
  hasard: !document.getElementById("mondeHasard").hidden,
}));
const avant = await coche();
await p.click("#modeEssai");
await p.waitForTimeout(150);
const apres = await coche();
await p.screenshot({ path: OUT + "depart-blasons-difficile.png" });
await p.click("#modeNormal");
await p.waitForTimeout(150);
if (!avant.normal || !avant.cocheNormal.includes("✓") || avant.cocheDifficile !== "none")
  griefs.push("en normal, la coche n'est pas sur Normal : " + JSON.stringify(avant));
if (!apres.difficile || !apres.cocheDifficile.includes("✓") || apres.cocheNormal !== "none")
  griefs.push("en difficile, la coche n'a pas suivi : " + JSON.stringify(apres));
if (!apres.hasard) griefs.push("en difficile, la ligne du hasard ne s'affiche plus");

/* ------------------------------------------------ 7. reduire les animations */
await ctx.close();
const calme = await ouvrir({ reducedMotion: "reduce" });
const transitions = await calme.p.evaluate(() => ({
  perso: getComputedStyle(document.querySelector(".perso")).transitionDuration,
  jouer: getComputedStyle(document.getElementById("jouer")).transitionDuration,
}));
Object.entries(transitions).forEach(([k, v]) => {
  if (v.split(",").some((d) => parseFloat(d) > 0)) griefs.push("animations reduites, mais " + k + " garde une transition de " + v);
});
await calme.ctx.close();

await navigateur.close();
site.arreter();

console.log(JSON.stringify({ polices, servisPolices, icones, tenue, cibles, avant, apres, transitions, erreurs }, null, 2));
if (erreurs.length) griefs.push("erreurs dans la page : " + erreurs.join(" | "));
console.log(griefs.length
  ? "\nRATE :\n  - " + griefs.join("\n  - ")
  : "\nOK : polices du depot, icones dessinees, ecran qui tient, texte dans les blasons, cibles au pouce, coche fidele, animations reductibles.");
process.exit(griefs.length ? 1 : 0);
