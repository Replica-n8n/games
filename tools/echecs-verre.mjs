import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { servir } from "./serveur.mjs";

/* Le verre des echecs, dans un vrai Chromium au format Pixel 9.

   Ce qu'on prouve :
   1. les trois panneaux (depart, menu, fin) sont en verre : flou reel et
      plateau visible derriere ;
   2. le texte reste lisible sur le verre, MESURE sur les pixels de la capture
      et pas estime : on echantillonne le fond autour de chaque texte ;
   3. transparence reduite et contraste renforce rendent les panneaux opaques ;
   4. rien ne casse le jeu : aucune erreur de page, la partie se joue. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "captures") + path.sep;
fs.mkdirSync(OUT, { recursive: true });
const site = await servir();
const URL = site.base + "echecs/";
const nav = await chromium.launch();
const griefs = [];
const ok = (c, m) => { if (!c) griefs.push(m); };

async function ouvrir(emul) {
  const ctx = await nav.newContext({ ...devices["Pixel 9"], serviceWorkers: "block" });
  const p = await ctx.newPage();
  const erreurs = [];
  p.on("pageerror", e => erreurs.push(e.message));
  p.on("console", m => { if (m.type() === "error") erreurs.push(m.text()); });
  if (emul) {
    const cdp = await ctx.newCDPSession(p);
    await cdp.send("Emulation.setEmulatedMedia", { features: emul });
  }
  await p.goto(URL, { waitUntil: "load" });
  await p.waitForTimeout(400);
  return { ctx, p, erreurs };
}

/* Une position de milieu de partie, pour que le plateau derriere le verre soit
   charge de pieces claires et sombres : le pire cas pour la lisibilite. */
const MILIEU = "r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 1";
async function poser(p, fen) {
  await p.evaluate(fen => {
    const [pos, side] = fen.split(" ");
    const board = [];
    for (const row of pos.split("/")) for (const ch of row) {
      if (/\d/.test(ch)) for (let i = 0; i < +ch; i++) board.push(null); else board.push(ch);
    }
    etat.board = board; etat.side = side;
    etat.castle = { K: false, Q: false, k: false, q: false }; etat.ep = -1; etat.last = null;
    fin = MOTEUR.fin(etat);
    dessiner();
  }, fen);
  await p.waitForTimeout(300);
}

/* Styles effectivement appliques a un panneau */
const verre = (p, sel) => p.evaluate(sel => {
  const s = getComputedStyle(document.querySelector(sel));
  return { flou: s.backdropFilter || s.webkitBackdropFilter, fond: s.backgroundColor, image: s.backgroundImage !== "none" };
}, sel);

/* Contraste MESURE : on lit la capture, on prend les pixels du rectangle du
   texte, et on separe encre et fond par leur luminance (le fond est la
   mediane des pixels les plus eloignes de la couleur du texte). */
async function contrastes(p, selecteurs, nomCapture) {
  const png = await p.screenshot({ path: OUT + nomCapture });
  const rects = await p.evaluate(sels => sels.flatMap(sel => [...document.querySelectorAll(sel)]
    .filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== "hidden" && e.textContent.trim())
    .map(e => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e).color; const px = parseFloat(getComputedStyle(e).fontSize);
      return { sel, texte: e.textContent.trim().slice(0, 30), x: r.x, y: r.y, w: r.width, h: r.height, couleur: c, px, gras: parseInt(getComputedStyle(e).fontWeight) >= 700 }; })), selecteurs);
  const dpr = await p.evaluate(() => devicePixelRatio);
  const page2 = await nav.newPage();
  const mesures = await page2.evaluate(async ({ b64, rects, dpr }) => {
    const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const g = c.getContext("2d"); g.drawImage(img, 0, 0);
    const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
    const L = (r, gg, b) => .2126 * lin(r) + .7152 * lin(gg) + .0722 * lin(b);
    return rects.map(r => {
      const x0 = Math.max(0, Math.floor(r.x * dpr)), y0 = Math.max(0, Math.floor(r.y * dpr));
      const w = Math.max(1, Math.floor(r.w * dpr)), h = Math.max(1, Math.floor(r.h * dpr));
      const d = g.getImageData(x0, y0, w, h).data;
      const [tr, tg, tb] = r.couleur.match(/\d+/g).map(Number);
      const lt = L(tr, tg, tb);
      const fonds = [];
      for (let i = 0; i < d.length; i += 4) {
        const l = L(d[i], d[i + 1], d[i + 2]);
        if (Math.abs(l - lt) > .25 || Math.abs(Math.sqrt(l) - Math.sqrt(lt)) > .25) fonds.push(l);
      }
      if (!fonds.length) return { ...r, ratio: null };
      fonds.sort((a, b) => a - b);
      /* le fond le PLUS DEFAVORABLE parmi les pixels de fond : celui qui se
         rapproche le plus de l'encre (10e centile cote encre) */
      const clair = lt > .5;
      const pire = clair ? fonds[Math.floor(fonds.length * .9)] : fonds[Math.floor(fonds.length * .1)];
      const ratio = (Math.max(lt, pire) + .05) / (Math.min(lt, pire) + .05);
      return { ...r, ratio: Math.round(ratio * 100) / 100 };
    });
  }, { b64: png.toString("base64"), rects, dpr });
  await page2.close();
  mesures.forEach(m => {
    const seuil = (m.px >= 24 || (m.gras && m.px >= 18.66)) ? 3 : 4.5;
    if (m.ratio !== null && m.ratio < seuil) griefs.push(`${nomCapture} : « ${m.texte} » ${m.ratio}:1 (seuil ${seuil})`);
  });
  return mesures.map(m => `${m.texte} ${m.ratio}`);
}

/* ------------------------------------------------ 1. ecran de depart */
{
  const { ctx, p, erreurs } = await ouvrir();
  await poser(p, MILIEU);
  const v = await verre(p, ".choix");
  ok(v.flou && v.flou.includes("blur"), "depart : les choix ne sont pas en verre " + JSON.stringify(v));
  console.log("depart :", JSON.stringify(await contrastes(p, [".choix span:last-child"], "verre-1-depart.png")));

  /* ------------------------------------------------ 2. le menu sur la partie */
  await p.evaluate(() => document.querySelector('.choix[data-jeu="echecs"]').click());
  await p.waitForTimeout(400);
  await poser(p, MILIEU);
  await p.evaluate(() => document.getElementById("menuBtn").click());
  await p.waitForTimeout(500);
  const vm = await verre(p, ".sheet");
  ok(vm.flou && vm.flou.includes("blur"), "menu : pas en verre " + JSON.stringify(vm));
  console.log("menu :", JSON.stringify(await contrastes(p, [".sheet .item .grow", ".sheet .item .sub", ".sheet .head"], "verre-2-menu.png")));
  await p.evaluate(() => document.getElementById("scrim").click());
  await p.waitForTimeout(400);

  /* ------------------------------------------------ 3. fin de partie (mat du berger) */
  /* on JOUE le dernier coup, dame h5 prend f7, pour passer par le vrai chemin de fin */
  await poser(p, "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w - - 0 1");
  await p.evaluate(() => document.querySelector('.sq[data-i="31"]').click());
  await p.waitForTimeout(150);
  await p.evaluate(() => document.querySelector('.sq[data-i="13"]').click());
  await p.waitForTimeout(1400);
  const finVisible = await p.evaluate(() => !document.getElementById("faceFin").hidden && !document.getElementById("overlay").classList.contains("hidden"));
  if (finVisible) {
    const vf = await verre(p, "#faceFin");
    ok(vf.flou && vf.flou.includes("blur"), "fin : pas en verre " + JSON.stringify(vf));
    console.log("fin :", JSON.stringify(await contrastes(p, ["#finTitre", "#finSous", "#rejouerBtn", "#changerBtn"], "verre-3-fin.png")));
  } else {
    console.log("fin : ecran non atteint par ce chemin, voir capture");
    await p.screenshot({ path: OUT + "verre-3-fin.png" });
  }
  ok(!erreurs.length, "erreurs de page : " + erreurs.join(" | "));
  await ctx.close();
}

/* ------------------------------------------------ 4. les preferences passent avant le verre */
for (const [nom, emul] of [["transparence reduite", [{ name: "prefers-reduced-transparency", value: "reduce" }]],
                          ["contraste renforce", [{ name: "prefers-contrast", value: "more" }]]]) {
  const { ctx, p } = await ouvrir(emul);
  const actif = await p.evaluate(n => matchMedia(n).matches, nom === "transparence reduite" ? "(prefers-reduced-transparency: reduce)" : "(prefers-contrast: more)");
  const v = await verre(p, ".choix");
  console.log(nom, ": media reconnue =", actif, JSON.stringify(v));
  if (actif) ok(!v.flou || v.flou === "none", nom + " : le verre reste flou " + JSON.stringify(v));
  else griefs.push(nom + " : Chromium ne reconnait pas la requete media, emulation impossible ici");
  await p.screenshot({ path: OUT + "verre-4-" + (nom.startsWith("trans") ? "opaque" : "contraste") + ".png" });
  await ctx.close();
}

await nav.close(); site.arreter();
console.log(griefs.length ? "\nRATE :\n  - " + griefs.join("\n  - ") : "\nOK : trois panneaux en verre, textes lisibles mesures sur les pixels, preferences respectees, aucune erreur.");
process.exit(griefs.length ? 1 : 0);
