import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";
import { findCulprit } from "../conviction/engine/index.js";

// Première visite d'une enquête : le dossier s'ouvre ; on le referme pour jouer.
const fermerDossier = async (p) => { if (await p.isVisible("#dossier[open]").catch(() => false)) await p.click("#b-ouvrir"); await p.waitForTimeout(150); if (await p.isVisible(".tuto").catch(() => false)) await p.click('.tuto [data-t="passer"]'); };

/* Pièce à conviction : TOUTES les enquêtes, jouées au doigt sur un Pixel 9
   (360 × 732), une sur deux en sombre. Pour chacune : pas d'erreur de page,
   aucun texte sous 14 px, cases d'au moins 44 px (41 en 8×8 : voir style.css),
   contrastes des textes, notes et croix sur CE décor ; la solution posée case
   par case ouvre l'accusation, le bon coupable classe l'affaire. Puis
   l'accueil, en clair et en sombre. Captures : captures/conviction-e-*.png.
     node tools/conviction-enquetes-ui.mjs [--planche] */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, "captures");
fs.mkdirSync(SORTIE, { recursive: true });
const DIR = path.join(ICI, "..", "conviction", "puzzles");
// Une seule enquête : node tools/conviction-enquetes-ui.mjs <id>
const seule = process.argv.slice(2).find((x) => !x.startsWith("--"));
const toutes = JSON.parse(fs.readFileSync(path.join(DIR, "index.json"), "utf8"));
const ids = toutes.filter((id) => !seule || id === seule);
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const echecs = [];
const verifie = (nom, ok, detail) => { if (!ok) echecs.push(nom + (detail !== undefined ? " : " + detail : "")); };

async function page(url, sombre) {
  const ctx = await nav.newContext({ ...devices["Pixel 9"], colorScheme: sombre ? "dark" : "light" });
  const p = await ctx.newPage();
  const erreurs = [];
  p.on("pageerror", (e) => erreurs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
  await p.goto(url);
  await p.evaluate(() => document.fonts.ready);
  return { ctx, p, erreurs };
}

/* Typographie : jamais d'espace ordinaire avant ; : ! ? » ni après « dans ce
   qui s'affiche (le navigateur couperait la ligne juste avant le signe), y
   compris les guillemets que la feuille de style pose autour des témoignages. */
async function typo(p, nom) {
  const r = await p.evaluate(() => {
    const t = document.body.innerText.split(/\n/).filter((l) => / [;:!?»]|« /.test(l));
    const q = [...document.querySelectorAll("q")].map((e) => getComputedStyle(e).quotes).filter((x) => /« | »/.test(x));
    return [...t, ...q];
  });
  verifie(`${nom} : espaces insécables (; : ! ? « »)`, r.length === 0, r.slice(0, 3).join(" | "));
}

/* Un nom de pièce ne sort jamais de sa rangée : il passait sous les murs et
   dans la pièce voisine (vu sur la Rêverie). */
async function nomsDansLeurPiece(p, nom) {
  const deborde = await p.$$eval(".roomname", (es) => es.filter((e) => {
    const c = e.parentElement.getBoundingClientRect(), r = e.getBoundingClientRect();
    return r.right > c.left + c.width * Number(getComputedStyle(e).getPropertyValue("--run")) + 1;
  }).map((e) => e.textContent));
  verifie(`${nom} : les noms de pièces tiennent dans leur pièce`, deborde.length === 0, deborde.join(", "));
}

/* Tailles et contrastes de ce qui est visible. */
async function mesure(p, nom, minCase) {
  const r = await p.evaluate((minCase) => {
    const parse = (s) => { const k = s.startsWith("color(") ? 255 : 1; const m = s.replace(/^color\(srgb/, "").match(/[\d.]+/g).map(Number); return { r: m[0] * k, g: m[1] * k, b: m[2] * k, a: m.length > 3 ? m[3] : 1 }; };
    const lum = ({ r, g, b }) => [r, g, b].map((n) => { n /= 255; return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
    const mix = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const vu = (el) => { const q = el.getBoundingClientRect(); return q.width > 0 && q.height > 0 && !el.closest("[hidden], .temoin.vide") && getComputedStyle(el).visibility !== "hidden" && getComputedStyle(el).display !== "none"; };
    const fond = (el) => { const pile = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c.a > 0) { pile.push(c); if (c.a >= 1) break; } } let bg = parse(getComputedStyle(document.body).backgroundColor); for (const c of pile.reverse()) bg = mix(c, bg); return bg; };
    const petits = [], faibles = [], cibles = [];
    for (const el of document.querySelectorAll("body *")) {
      if (!vu(el) || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const cs = getComputedStyle(el), size = parseFloat(cs.fontSize);
      if (size < 13.99) petits.push([el.className || el.tagName, size]);
      let op = 1; for (let e = el; e; e = e.parentElement) op *= Number(getComputedStyle(e).opacity);
      const bg = fond(el), fg = parse(cs.color);
      const x = ratio(mix({ ...fg, a: fg.a * op }, bg), bg);
      const seuil = size >= 24 || (Number(cs.fontWeight) >= 700 && size >= 18.66) ? 3 : 4.5;
      if (x < seuil) faibles.push([el.className || el.tagName, el.textContent.trim().slice(0, 12), x.toFixed(2)]);
    }
    for (const b of document.querySelectorAll("button, summary, a")) {
      if (!vu(b)) continue;
      const q = b.getBoundingClientRect(), min = b.classList.contains("cell") ? minCase : 44;
      if (q.width < min - 0.5 || q.height < min - 0.5) cibles.push([b.className || b.textContent.trim(), Math.round(q.width), Math.round(q.height)]);
    }
    // Toutes les cases ont la même taille, sans bordure qui mange l'intérieur,
    // et leur lueur (témoignage éclairé) a la même taille partout.
    const cases = [...document.querySelectorAll(".cell")];
    const tailles = cases.map((c) => { const q = c.getBoundingClientRect(); return [q.width, q.height]; });
    const bord = cases.filter((c) => parseFloat(getComputedStyle(c).borderTopWidth) + parseFloat(getComputedStyle(c).borderLeftWidth) > 0).length;
    const lueurs = cases.filter((c) => c.classList.contains("eclaire")).map((c) => { const a = getComputedStyle(c, "::after"); return [c.clientWidth, c.clientHeight, a.inset]; });
    const ecart = Math.max(...tailles.map((t) => t[0])) - Math.min(...tailles.map((t) => t[0])) + Math.max(...tailles.map((t) => t[1])) - Math.min(...tailles.map((t) => t[1]));
    const lueurEcart = lueurs.length ? Math.max(...lueurs.map((l) => l[0])) - Math.min(...lueurs.map((l) => l[0])) : 0;
    return { petits, faibles, cibles, large: document.documentElement.scrollWidth, ecart, bord, lueurEcart };
  }, minCase);
  verifie(`${nom} : toutes les cases ont la même taille`, r.ecart < 1, r.ecart.toFixed(2));
  verifie(`${nom} : aucune case n'a de bordure (les murs sont posés par-dessus)`, r.bord === 0, r.bord);
  verifie(`${nom} : les lueurs ont toutes la même taille`, r.lueurEcart < 1, r.lueurEcart);
  verifie(`${nom} : aucun texte sous 14 px`, r.petits.length === 0, JSON.stringify(r.petits.slice(0, 4)));
  verifie(`${nom} : textes contrastés`, r.faibles.length === 0, JSON.stringify(r.faibles.slice(0, 4)));
  verifie(`${nom} : cibles assez grandes`, r.cibles.length === 0, JSON.stringify(r.cibles.slice(0, 4)));
  verifie(`${nom} : pas de défilement horizontal`, r.large <= 360, r.large);
}

const choisir = async (p, id) => { if ((await p.getAttribute(`#choix .chip[data-id="${id}"]`, "aria-pressed")) !== "true") await p.click(`#choix .chip[data-id="${id}"]`); };

for (const [i, id] of ids.entries()) {
  const puzzle = JSON.parse(fs.readFileSync(path.join(DIR, `${id}.json`), "utf8"));
  const sombre = i % 2 === 1;
  const { ctx, p, erreurs } = await page(`${srv.base}conviction/?enquete=${id}`, sombre);
  await p.waitForSelector("#jeu:not([hidden])"); await fermerDossier(p);
  const nom = `${id} (${sombre ? "sombre" : "clair"})`;
  // Une note au crayon et une croix, pour mesurer leur contraste sur ce décor.
  const libres = await p.$$eval(".cell:not(.blocked)", (els) => els.map((e) => [+e.dataset.r, +e.dataset.c]));
  const [a, b2] = [libres[0], libres[libres.length - 1]];
  await choisir(p, puzzle.persons[0].id);
  await p.click("#m-crayon"); await p.click(`.cell[data-r="${a[0]}"][data-c="${a[1]}"]`);
  await p.click("#m-barrer"); await p.click(`.cell[data-r="${b2[0]}"][data-c="${b2[1]}"]`);
  await p.click("#m-placer");
  await mesure(p, nom, puzzle.size >= 8 ? 41 : 44);
  await typo(p, nom);
  await nomsDansLeurPiece(p, nom);
  // Playwright fait défiler la page pour atteindre une case : la capture repart du haut.
  await p.evaluate(() => scrollTo(0, 0));
  await p.screenshot({ path: path.join(SORTIE, `conviction-e-${id}.png`) });
  // La solution, case par case, au doigt.
  for (const [k, x] of puzzle.persons.entries()) {
    // Avant la dernière : le visage qui reste doit être à l'écran (à 7 ou 8, la
    // rangée défile, et la victime restait cachée à droite : vu par Julie).
    if (k === puzzle.persons.length - 1) {
      await p.waitForTimeout(450);
      const vu = await p.$eval(`.chip[data-id="${x.id}"]`, (e) => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; });
      verifie(`${nom} : le dernier visage à placer est à l'écran`, vu);
    }
    const [r, c] = puzzle.solution[x.id];
    await choisir(p, x.id);
    await p.click(`.cell[data-r="${r}"][data-c="${c}"]`);
  }
  verifie(`${nom} : la solution ouvre l'accusation`, await p.isVisible("#accuse"));
  const coupable = findCulprit(puzzle, puzzle.solution);
  await p.click(`[data-acc="${coupable}"]`);
  await p.waitForSelector(".scene .cri");
  await p.click('.scene [data-s="passer"]');
  await p.waitForSelector(".scene", { state: "detached" });
  verifie(`${nom} : le coupable classe l'affaire`, /classée/i.test(await p.textContent("#verdict")));
  verifie(`${nom} : la pièce du crime reste allumée`, (await p.$$eval(".cell.eteinte", (e) => e.length)) > 0);
  await p.waitForTimeout(500);
  await mesure(p, nom + " fin", puzzle.size >= 8 ? 41 : 44);
  await typo(p, nom + " fin");
  if (["poirot-orient-express-moyen", "westeros-pourpres-moyen", "holmes-221b-facile"].includes(id)) await p.locator("#verdict").scrollIntoViewIfNeeded(), await p.screenshot({ path: path.join(SORTIE, `conviction-e-${id}-fin.png`) });
  verifie(`${nom} : aucune erreur`, erreurs.length === 0, erreurs.join(" | "));
  await ctx.close();
}

for (const sombre of [false, true]) {
  const { ctx, p, erreurs } = await page(`${srv.base}conviction/`, sombre);
  await p.waitForSelector("#accueil:not([hidden])");
  // Le bureau : une enquête conseillée, puis une chemise par chapitre ; les suites sont scellées.
  const chemises = await p.$$eval(".chemise", (e) => e.length);
  verifie(`accueil : ${toutes.length} chemises sur les rayons`, chemises === toutes.length, chemises);
  verifie("accueil : l'enquête conseillée ouvre une enquête", /enquete=/.test((await p.getAttribute("#une", "href")) ?? ""));
  const scellees = await p.$$eval(".chemise.scellee", (e) => e.length);
  verifie("accueil : les chapitres 2 sont scellés au départ", scellees > 0, scellees);
  await p.click(".chemise.scellee >> nth=0");
  verifie("un chapitre scellé dit pourquoi", (await p.isVisible("#msg-scelle")) && /chapitre 1/.test(await p.textContent("#msg-scelle")));
  await p.waitForTimeout(3700);
  await mesure(p, `accueil (${sombre ? "sombre" : "clair"})`, 44);
  await p.screenshot({ path: path.join(SORTIE, `conviction-accueil-${sombre ? "sombre" : "clair"}.png`) });
  verifie("accueil : aucune erreur", erreurs.length === 0, erreurs.join(" | "));
  await ctx.close();
}

if (process.argv.includes("--planche")) {
  const vues = [
    ["Accueil", "conviction-accueil-clair.png"],
    ["Orient-Express · neige", "conviction-e-poirot-orient-express-difficile.png"],
    ["Noces pourpres · Port-Réal", "conviction-e-westeros-pourpres-moyen.png"],
    ["Ils étaient dix · 8×8, orage", `conviction-e-${ids.find((x) => x.startsWith("christie-dix")) ?? "christie-dix-moyen"}.png`],
    ["Chambre jaune · nuit", "conviction-e-leroux-chambre-jaune-facile.png"],
    ["Affaire classée", "conviction-e-westeros-pourpres-moyen-fin.png"],
  ].filter(([, f]) => fs.existsSync(path.join(SORTIE, f)));
  const ctx = await nav.newContext({ viewport: { width: 1600, height: 900 } });
  const p = await ctx.newPage();
  const img = (f) => "data:image/png;base64," + fs.readFileSync(path.join(SORTIE, f)).toString("base64");
  await p.setContent(`<body style="margin:0;background:#cfd6dc;font:600 20px system-ui;display:grid;grid-template-columns:repeat(${vues.length},300px);gap:20px;padding:24px;width:max-content">${vues.map(([t, f]) => `<figure style="margin:0;text-align:center"><figcaption style="margin-bottom:8px">${t}</figcaption><img src="${img(f)}" style="width:300px;display:block;box-shadow:0 4px 18px rgb(0 0 0/.25)"></figure>`).join("")}</body>`);
  await p.screenshot({ path: path.join(ICI, "..", "docs", "conviction-histoires.png"), fullPage: true });
  await ctx.close();
}

await nav.close();
srv.arreter();
if (echecs.length) { console.log(`✗ ${echecs.length} problème(s) :\n  ` + echecs.join("\n  ")); process.exit(1); }
console.log(`✓ ${ids.length} enquêtes jouées au doigt, accueil conforme`);
process.exit(0);
