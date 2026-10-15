import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Pièce à conviction : l'écran de jeu joué pour de vrai, au format Pixel 9
   (360 × 732) puis petit écran (360 × 640, animations réduites), en clair et
   en sombre, puis sur grand écran. Ce que le banc refuse : une erreur de page,
   un texte sous 14 px, une cible sous 44 px, un défilement horizontal, un
   texte sous 4,5:1 (3:1 pour un grand texte, un pion ou une croix), une boucle
   de jeu (plan, pions, témoignage, outils, message) qui sort de l'écran, et
   tout geste qui ne fait pas ce qu'il annonce : toucher, glisser, clavier,
   barrer, annuler, rétablir, indice, vérifier, accuser, recharger.
   Captures : captures/conviction-*.png.
     node tools/conviction-ui.mjs            le banc
     node tools/conviction-ui.mjs --planche  plus la planche prototype / nouveau */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, "captures");
fs.mkdirSync(SORTIE, { recursive: true });
const PLANCHE = process.argv.includes("--planche");
const SOLUTION = { A: [4, 0], B: [1, 2], C: [0, 3], D: [5, 4], E: [2, 1], V: [3, 5] };
const ORDRE = ["A", "B", "C", "D", "E", "V"];

const srv = await servir();
const URL_JEU = srv.base + "conviction/?enquete=valcourt";
const navigateur = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const echecs = [];
const verifie = (nom, ok, detail) => { if (!ok) echecs.push(nom + (detail !== undefined ? " : " + detail : "")); };

async function ouvrir({ largeur = 360, hauteur = 732, sombre = false, reduit = false, mobile = true } = {}) {
  const ctx = await navigateur.newContext({
    ...(mobile ? devices["Pixel 9"] : {}),
    viewport: { width: largeur, height: hauteur },
    colorScheme: sombre ? "dark" : "light",
    reducedMotion: reduit ? "reduce" : "no-preference",
  });
  const p = await ctx.newPage();
  const erreurs = [];
  p.on("pageerror", (e) => erreurs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
  await p.goto(URL_JEU);
  await p.waitForSelector("#jeu:not([hidden])");
  await p.evaluate(() => document.fonts.ready);
  return { ctx, p, erreurs };
}

const cellule = (r, c) => `.cell[data-r="${r}"][data-c="${c}"]`;
const pions = (p) => p.evaluate(() => Object.fromEntries([...document.querySelectorAll(".cell")].filter((c) => !c.querySelector(".pawn").hidden).map((c) => [c.querySelector(".pawn").dataset.id, [+c.dataset.r, +c.dataset.c]])));
// Le message est vidé puis réécrit à l'image suivante : attendre qu'il revienne.
const statut = async (p) => { await p.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)))); await p.waitForFunction(() => document.getElementById("status").textContent.trim().length > 0); return p.textContent("#status"); };
// Toucher une puce déjà choisie la désélectionne (comme le prototype) : ne la toucher que si besoin.
const choisir = async (p, id) => { if ((await p.getAttribute(`#choix .chip[data-id="${id}"]`, "aria-pressed")) !== "true") await p.click(`#choix .chip[data-id="${id}"]`); };
const trie = (o) => JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]]));

/* Tailles, cibles, défilement, et ce qui doit rester dans l'écran. */
async function mesures(p, nom, { boucle = true } = {}) {
  const m = await p.evaluate(() => {
    const vu = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest("[hidden], details:not([open]) > :not(summary)") && getComputedStyle(el).visibility !== "hidden" && getComputedStyle(el).display !== "none"; };
    const petits = [...document.querySelectorAll("body *")].filter((el) => vu(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
      .map((el) => [el.id || el.className || el.tagName, parseFloat(getComputedStyle(el).fontSize)]).filter((x) => x[1] < 13.99);
    const cibles = [...document.querySelectorAll("button, summary")].filter(vu).map((b) => { const r = b.getBoundingClientRect(); return [b.id || b.className || b.textContent.trim(), Math.round(r.width), Math.round(r.height)]; });
    // Positions dans l'écran (un message long fait défiler la page juste ce qu'il faut).
    const bas = (id) => { const e = document.getElementById(id); return e && vu(e) ? Math.round(e.getBoundingClientRect().bottom) : 0; };
    const haut = (id) => Math.round(document.getElementById(id).getBoundingClientRect().top);
    return { petits, cibles, large: document.documentElement.scrollWidth, haut: innerHeight, status: bas("status"), grille: haut("grille"), outils: Math.max(...[...document.querySelectorAll(".tools")].map((t) => Math.round(t.getBoundingClientRect().bottom))) };
  });
  verifie(nom + " : aucun texte sous 14 px", m.petits.length === 0, JSON.stringify(m.petits.slice(0, 5)));
  const petitesCibles = m.cibles.filter((c) => c[1] < 44 || c[2] < 44);
  verifie(nom + " : cibles d'au moins 44 px", petitesCibles.length === 0, JSON.stringify(petitesCibles.slice(0, 5)));
  verifie(nom + " : pas de défilement horizontal", m.large <= innerWidthOf(nom), m.large);
  if (boucle) {
    verifie(nom + " : les outils tiennent dans l'écran", m.outils <= m.haut, m.outils + " > " + m.haut);
    if (m.haut >= 700) verifie(nom + " : le message d'état tient dans l'écran", m.status <= m.haut, m.status + " > " + m.haut);
    verifie(nom + " : le haut du plan reste visible", m.grille >= -8, m.grille);
  }
  return m;
}
const innerWidthOf = (nom) => (nom.includes("bureau") ? 1280 : 360);

/* Contrastes calculés sur les couleurs réelles de chaque texte visible et de
   son fond (premier ancêtre opaque), plus les pions et les croix sur les pièces. */
async function contrastes(p, nom) {
  const r = await p.evaluate(() => {
    // rgb(0-255) ou color(srgb 0-1) : color-mix() rend la seconde forme.
    const parse = (s) => { const k = s.startsWith("color(") ? 255 : 1; const m = s.replace(/^color\(srgb/, "").match(/[\d.]+/g).map(Number); return { r: m[0] * k, g: m[1] * k, b: m[2] * k, a: m.length > 3 ? m[3] : 1 }; };
    const lum = ({ r, g, b }) => [r, g, b].map((n) => { n /= 255; return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
    const mix = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const fond = (el) => {
      const pile = [];
      for (let e = el; e; e = e.parentElement) {
        const c = parse(getComputedStyle(e).backgroundColor);
        if (c.a > 0) { pile.push(c); if (c.a >= 1) break; }
      }
      let bg = parse(getComputedStyle(document.body).backgroundColor);
      for (const c of pile.reverse()) bg = mix(c, bg);
      return bg;
    };
    const vu = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest("[hidden]") && getComputedStyle(el).visibility !== "hidden"; };
    const faibles = [];
    for (const el of document.querySelectorAll("body *")) {
      if (!vu(el) || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const cs = getComputedStyle(el);
      const size = parseFloat(cs.fontSize), gras = Number(cs.fontWeight) >= 700;
      const seuil = size >= 24 || (gras && size >= 18.66) ? 3 : 4.5;
      let fg = parse(cs.color);
      const bg = fond(el);
      // Une opacité sur le texte ou un ancêtre le rapproche du fond de la page.
      let op = 1;
      for (let e = el; e; e = e.parentElement) op *= Number(getComputedStyle(e).opacity);
      fg = mix({ ...fg, a: fg.a * op }, bg);
      const x = ratio(fg, bg);
      if (x < seuil) faibles.push([el.id || el.className || el.tagName, x.toFixed(2), seuil]);
    }
    // Pions sur chaque couleur de pièce, croix sur chaque pièce.
    const objets = [];
    const pieces = [...new Set([...document.querySelectorAll(".cell")].map((c) => getComputedStyle(c).backgroundColor))].map(parse);
    for (const chip of document.querySelectorAll("#choix .chip i")) {
      const fondPion = parse(getComputedStyle(chip).backgroundColor);
      const lettre = parse(getComputedStyle(chip).color);
      let op = 1;
      for (let e = chip; e; e = e.parentElement) op *= Number(getComputedStyle(e).opacity);
      objets.push(["initiale " + chip.textContent + (op < 1 ? " (pâlie)" : ""), op < 1 ? Math.min(ratio(lettre, fondPion), 1 + (ratio(lettre, fondPion) - 1) * op) : ratio(lettre, fondPion), 3]);
    }
    // La croix est posée sur un voile (fond de .mark) au-dessus du sol : mesurer ce mélange.
    const m = getComputedStyle(document.querySelector(".mark"));
    const croix = parse(m.color), voile = parse(m.backgroundColor);
    for (const pc of pieces) objets.push(["croix sur pièce", ratio(croix, mix(voile, pc)), 3]);
    return { faibles, objets: objets.filter((o) => o[1] < o[2]).map((o) => [o[0], o[1].toFixed(2)]) };
  });
  verifie(nom + " : textes contrastés", r.faibles.length === 0, JSON.stringify(r.faibles.slice(0, 6)));
  verifie(nom + " : pions et croix contrastés", r.objets.length === 0, JSON.stringify(r.objets));
}

// ---------- 1. Pixel 9, clair : la partie complète ----------
{
  const { ctx, p, erreurs } = await ouvrir();
  await mesures(p, "clair 732");
  await contrastes(p, "clair");
  await p.screenshot({ path: path.join(SORTIE, "conviction-depart-clair.png") });

  const chrono0 = await p.textContent("#chrono");
  await p.waitForTimeout(1200);
  verifie("le chronomètre attend le premier geste", (await p.textContent("#chrono")) === chrono0, await p.textContent("#chrono"));

  // Indice : Bastien en C2, surligné, compté.
  await p.click("#b-indice");
  verifie("l'indice parle de Bastien en C2", /Bastien.*C2/.test(await statut(p)), await p.textContent("#status"));
  verifie("l'indice surligne C2", await p.$eval(cellule(1, 2), (e) => e.classList.contains("hl")));
  verifie("l'indice est compté", (await p.textContent("#nb-indices")) === "1");

  // Toucher-toucher : choisir B, toucher C2.
  await choisir(p, 'B');
  await p.click(cellule(1, 2));
  verifie("toucher-toucher place Bastien en C2", JSON.stringify((await pions(p)).B) === "[1,2]", JSON.stringify(await pions(p)));
  verifie("une case bloquée refuse le pion", await (async () => { await choisir(p, 'A'); await p.click(cellule(3, 0), { force: true }); return /fourneau/.test(await statut(p)) && !(await pions(p)).A; })());

  // Glisser : la puce de Dorian jusqu'au banc E6.
  const glisse = async (de, vers) => {
    const a = await p.locator(de).boundingBox(), b = await p.locator(vers).boundingBox();
    await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await p.mouse.down();
    await p.mouse.move(a.x + a.width / 2 + 20, a.y + a.height / 2 - 20, { steps: 3 });
    await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
    await p.mouse.up();
  };
  await glisse('#choix .chip[data-id="D"]', cellule(5, 3));
  verifie("glisser la puce de Dorian le pose en D6", JSON.stringify((await pions(p)).D) === "[5,3]", JSON.stringify(await pions(p)));
  await glisse(`${cellule(5, 3)} .pawn`, cellule(5, 4));
  verifie("glisser le pion le déplace en E6", JSON.stringify((await pions(p)).D) === "[5,4]", JSON.stringify(await pions(p)));
  verifie("glisser ne laisse pas de fantôme", await p.$eval("#fantome", (e) => e.hidden));

  // Annuler, rétablir.
  await p.click("#b-annuler");
  verifie("annuler ramène Dorian en D6", JSON.stringify((await pions(p)).D) === "[5,3]");
  await p.click("#b-retablir");
  verifie("rétablir le remet en E6", JSON.stringify((await pions(p)).D) === "[5,4]");

  // Barrer : mode, puis une croix, puis l'enlever.
  await p.click("#m-barrer");
  await p.click(cellule(0, 5));
  verifie("barrer pose une croix", await p.$eval(`${cellule(0, 5)} .mark`, (e) => !e.hidden));
  await p.click(cellule(0, 5));
  verifie("rebarrer l'enlève", await p.$eval(`${cellule(0, 5)} .mark`, (e) => e.hidden));
  await p.click("#m-placer");

  // Clavier : touche 3 = Céleste, flèches jusqu'à D1, Entrée.
  await p.focus(cellule(0, 0));
  await p.keyboard.press("3");
  for (let i = 0; i < 3; i++) await p.keyboard.press("ArrowRight");
  verifie("les flèches déplacent le focus", await p.evaluate(() => document.activeElement?.dataset.c === "3" && document.activeElement?.dataset.r === "0"));
  await p.keyboard.press("Enter");
  verifie("Entrée place Céleste en D1", JSON.stringify((await pions(p)).C) === "[0,3]", JSON.stringify(await pions(p)));
  await p.keyboard.press("ArrowDown"); await p.keyboard.press("ArrowDown");
  await p.keyboard.press("x");
  verifie("X barre la case qui a le focus", await p.$eval(`${cellule(2, 3)} .mark`, (e) => !e.hidden));
  await p.keyboard.press("Control+z");
  verifie("Ctrl+Z annule la croix", await p.$eval(`${cellule(2, 3)} .mark`, (e) => e.hidden));

  // Crayon : noter Agathe en A3 et A5, puis la poser en A5 efface ses notes.
  await choisir(p, "A");
  await p.click("#m-crayon");
  await p.click(cellule(2, 0));
  await p.click(cellule(4, 0));
  const notes = async (r, c) => p.$eval(`${cellule(r, c)} .notes`, (e) => e.textContent);
  verifie("le crayon note Agathe en A3 et A5", (await notes(2, 0)) === "A" && (await notes(4, 0)) === "A", (await notes(2, 0)) + "/" + (await notes(4, 0)));
  await p.click(cellule(4, 0));
  verifie("toucher encore efface la note", (await notes(4, 0)) === "");
  await p.click(cellule(4, 0));
  await p.click("#m-placer");

  // Le témoignage s'éclaire : Victor = colonne F, pas à côté de la fontaine.
  await choisir(p, "V");
  const eclairees = await p.$$eval(".cell.eclaire", (els) => els.map((e) => e.dataset.r + "," + e.dataset.c).sort().join(" "));
  verifie("le témoignage de Victor éclaire F1, F2, F4, F6", eclairees === "0,5 1,5 3,5 5,5", eclairees);
  verifie("le message compte les cases éclairées", /4 cases correspondent/.test(await statut(p)), await p.textContent("#status"));

  // Vérifier : Agathe mal placée en B4 (pas à côté du fourneau ? si : B4 touche A4). On prend A6.
  await choisir(p, 'A');
  await p.click(cellule(5, 0));
  verifie("un pion sur une ligne prise est signalé", /ligne ou une colonne/.test(await statut(p)), await p.textContent("#status"));
  await p.click(cellule(5, 0)); // retire
  await choisir(p, 'E');
  await p.click(cellule(4, 0));   // Eugénie en A5 (cuisine, mais fausse)
  verifie("poser Eugénie en A5 efface la note d'Agathe sur sa ligne", (await notes(4, 0)) === "" && (await notes(2, 0)) === "", (await notes(2, 0)) + "/" + (await notes(4, 0)));
  await p.click("#b-verifier");
  const ouE = await p.textContent('.suspect[data-id="E"] .where');
  verifie("vérifier montre le témoignage respecté d'Eugénie", /A5 ✓/.test(ouE), ouE);

  // Fin juste : placer tout le monde à sa place.
  await p.click(cellule(4, 0)); // retire Eugénie
  for (const id of ORDRE) {
    const [r, c] = SOLUTION[id];
    const ici = (await pions(p))[id];
    if (ici && ici[0] === r && ici[1] === c) continue;
    await choisir(p, id);
    await p.click(cellule(r, c));
  }
  verifie("le plan juste ouvre l'accusation", await p.isVisible("#accuse"));
  const temps = await p.textContent("#chrono");
  await p.waitForTimeout(1100);
  verifie("le chronomètre s'arrête au plan juste", (await p.textContent("#chrono")) === temps);
  await mesures(p, "clair 732 fin", { boucle: false });
  await p.click('[data-acc="A"]');
  verifie("accuser Agathe : un innocent en prison", /innocent/i.test(await p.textContent("#verdict")));
  verifie("l'innocent accusé ne peut plus l'être", await p.$eval('[data-acc="A"]', (b) => b.disabled));
  await p.click('[data-acc="D"]');
  verifie("accuser Dorian : affaire classée", /classée/i.test(await p.textContent("#verdict")));
  verifie("le bilan compte l'innocent accusé", /1 innocent accusé/.test(await p.textContent("#verdict")), await p.textContent("#verdict .bilan"));
  verifie("une fois l'affaire classée, on n'accuse plus", !(await p.isVisible("#acc")));
  verifie("plan juste : les outils s'effacent, « ⋯ » reste", !(await p.isVisible("#b-indice")) && (await p.isVisible("#plus summary")));
  await p.screenshot({ path: path.join(SORTIE, "conviction-fin-clair.png"), fullPage: true });

  // Recharger : tout revient.
  await p.reload();
  await p.waitForSelector("#jeu:not([hidden])");
  verifie("la partie revient au rechargement", trie(await pions(p)) === trie(SOLUTION), JSON.stringify(await pions(p)));
  verifie("le verdict revient au rechargement", /classée/i.test(await p.textContent("#verdict")));
  verifie("le compteur d'indices revient", (await p.textContent("#nb-indices")) === "1");

  // Recommencer (dans le menu ⋯) s'annule.
  await p.click("#plus summary");
  await p.click("#b-recommencer");
  verifie("recommencer vide le plan", Object.keys(await pions(p)).length === 0);
  await p.click("#b-annuler");
  verifie("annuler remet le plan", Object.keys(await pions(p)).length === 6);
  verifie("clair : aucune erreur de page", erreurs.length === 0, erreurs.join(" | "));
  await ctx.close();
}

// ---------- 1 bis. Ce que la critique impeccable du 2026-10-15 a fait changer ----------
{
  const { ctx, p, erreurs } = await ouvrir();
  await p.click('#choix .chip[data-id="A"]');
  await p.click('#choix .chip[data-id="A"]');
  verifie("toucher le visage déjà choisi le garde choisi", (await p.getAttribute('#choix .chip[data-id="A"]', "aria-pressed")) === "true");
  await p.click('#choix .chip[data-id="E"]');
  verifie("le témoignage d'Eugénie nomme la cuisine sur le plan", await p.isVisible('.roomname[data-room="C"]'));
  verifie("les autres pièces ne sont pas nommées sur le téléphone", !(await p.isVisible('.roomname[data-room="S"]')));
  await p.click(cellule(0, 2)); // Eugénie en C1, dans la bibliothèque : faux
  verifie("posée, sa puce porte un point neutre, pas une coche", await p.$eval('#choix .chip[data-id="E"]', (e) => e.classList.contains("placed") && !e.classList.contains("juste")));
  await p.click("#b-verifier");
  verifie("Vérifier nomme la personne contredite", /contredit : Eugénie/.test(await statut(p)), await p.textContent("#status"));
  verifie("Vérifier cercle de rouge son pion", await p.$eval(`${cellule(0, 2)} .pawn`, (e) => e.classList.contains("faux")));
  verifie("et marque sa puce", await p.$eval('#choix .chip[data-id="E"]', (e) => e.classList.contains("faux")));
  verifie("1 bis : aucune erreur", erreurs.length === 0, erreurs.join(" | "));
  await ctx.close();
}

// ---------- 2. Chronomètre en pause quand la page est cachée ----------
{
  const { ctx, p } = await ouvrir();
  await p.click(cellule(1, 2));
  await p.evaluate(() => { Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
  const avant = await p.evaluate(() => window.__conviction.game.clock());
  await p.waitForTimeout(1500);
  const apres = await p.evaluate(() => window.__conviction.game.clock());
  verifie("caché, le chronomètre ne court pas", apres - avant < 50, `${avant} puis ${apres}`);
  await p.evaluate(() => { Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
  await p.waitForTimeout(1100);
  verifie("visible, il repart", (await p.evaluate(() => window.__conviction.game.clock())) - apres >= 900);
  await ctx.close();
}

// ---------- 3. Sombre, petit écran, animations réduites, grand écran ----------
for (const [nom, opts] of [
  ["sombre 732", { sombre: true }],
  ["clair 640", { hauteur: 640, reduit: true }],
  ["sombre 640", { hauteur: 640, sombre: true, reduit: true }],
]) {
  const { ctx, p, erreurs } = await ouvrir(opts);
  await mesures(p, nom);
  if (nom === "sombre 732") await contrastes(p, "sombre");
  // Une partie en cours, pour des captures parlantes.
  for (const id of ["B", "D", "C"]) { await choisir(p, id); await p.click(cellule(...SOLUTION[id])); }
  await choisir(p, 'V');
  await p.click("#m-barrer"); await p.click(cellule(0, 5)); await p.click("#m-placer");
  await choisir(p, 'V');
  // Playwright fait défiler la page pour atteindre un bouton : on repart du
  // haut pour ne mesurer que le défilement que le jeu fait lui-même.
  await p.evaluate(() => scrollTo(0, 0));
  await p.$eval("#b-indice", (b) => b.click());
  await statut(p);
  await p.waitForTimeout(1200); // le défilement doux jusqu'au message
  await mesures(p, nom + " en cours");
  await contrastes(p, nom + " en cours");
  await p.screenshot({ path: path.join(SORTIE, `conviction-${nom.replace(" ", "-")}.png`) });
  verifie(nom + " : aucune erreur de page", erreurs.length === 0, erreurs.join(" | "));
  await ctx.close();
}
{
  const { ctx, p, erreurs } = await ouvrir({ largeur: 1280, hauteur: 900, mobile: false });
  await mesures(p, "bureau", { boucle: false });
  for (const id of ["B", "D", "C"]) { await p.click(`.suspect[data-id="${id}"]`); await p.click(cellule(...SOLUTION[id])); }
  await p.screenshot({ path: path.join(SORTIE, "conviction-bureau.png") });
  verifie("bureau : aucune erreur de page", erreurs.length === 0, erreurs.join(" | "));
  await ctx.close();
}

// ---------- 4. Planche : prototype et nouvelle version, même partie ----------
if (PLANCHE) {
  const etat = { B: [1, 2], D: [5, 4], C: [0, 3] };
  const vues = [];
  for (const sombre of [false, true]) {
    for (const quoi of ["poc", "jeu"]) {
      const ctx = await navigateur.newContext({ ...devices["Pixel 9"], colorScheme: sombre ? "dark" : "light" });
      const p = await ctx.newPage();
      if (quoi === "poc") {
        // Le prototype était une page d'artifact, sans balise viewport : on la
        // lui donne, sinon un téléphone l'affiche en largeur de bureau.
        await p.addInitScript(() => document.addEventListener("DOMContentLoaded", () => { const m = document.createElement("meta"); m.name = "viewport"; m.content = "width=device-width, initial-scale=1"; document.head.prepend(m); }));
        await p.goto(srv.base + "docs/conviction-poc-valcourt.html");
        await p.evaluate((pos) => localStorage.setItem("murdoku-valcourt-v1", JSON.stringify({ pos, marks: { "0,5": 1 }, sel: "V", mode: "place" })), etat);
        await p.reload();
        await p.waitForTimeout(800);
      } else {
        await p.goto(URL_JEU);
        await p.waitForSelector("#jeu:not([hidden])");
        for (const [id, pos] of Object.entries(etat)) { await choisir(p, id); await p.click(cellule(...pos)); }
        await p.click("#m-barrer"); await p.click(cellule(0, 5));
        // Notes au crayon : Agathe et Eugénie en cuisine.
        await p.click("#m-crayon");
        for (const [id, cases] of [["A", [[2, 0], [4, 0]]], ["E", [[2, 0], [2, 1], [4, 0]]]]) { await choisir(p, id); for (const c of cases) await p.click(cellule(...c)); }
        await p.click("#m-placer");
        await choisir(p, 'V');
      }
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(700);
      const f = path.join(SORTIE, `planche-${quoi}-${sombre ? "sombre" : "clair"}.png`);
      await p.screenshot({ path: f });
      vues.push({ f, titre: `${quoi === "poc" ? "Prototype" : "Pièce à conviction"} · ${sombre ? "sombre" : "clair"}` });
      await ctx.close();
    }
  }
  const ctx = await navigateur.newContext({ viewport: { width: 1600, height: 900 } });
  const p = await ctx.newPage();
  const img = (f) => "data:image/png;base64," + fs.readFileSync(f).toString("base64");
  await p.setContent(`<body style="margin:0;background:#cfd6dc;font:600 22px system-ui;display:flex;gap:24px;padding:24px">${vues.map((v) => `<figure style="margin:0;text-align:center"><figcaption style="margin-bottom:10px">${v.titre}</figcaption><img src="${img(v.f)}" style="width:360px;height:732px;display:block;box-shadow:0 4px 18px rgb(0 0 0/.25)"></figure>`).join("")}</body>`);
  await p.screenshot({ path: path.join(ICI, "..", "docs", "conviction-planche-etape3.png"), fullPage: true });
  await ctx.close();
}

await navigateur.close();
srv.arreter();
if (echecs.length) { console.log("✗ " + echecs.length + " problème(s) :\n  " + echecs.join("\n  ")); process.exit(1); }
console.log("✓ Pièce à conviction : écran de jeu conforme");
process.exit(0);
