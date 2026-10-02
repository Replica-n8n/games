import { chromium, devices } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { servir } from "./serveur.mjs";

/* Banc de petit-plus-minus/ (la boîte à outils), dans Chromium au format Pixel 9.
   Ce qu'il prouve : la page s'affiche avec SES polices et SES textes (contenu.json), ne
   demande rien hors de son dossier, se relance HORS LIGNE avec un cache identique au
   dépôt, dit où est l'erreur quand contenu.json est cassé ; chaque écran tient dans 732
   et 640 px sans texte sous 14 px ; la jauge, le SOS, chaque outil et « Pour les grands »
   font ce qu'ils disent. Sortie : une ligne par contrôle, code 1 si un seul échoue. */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const JEU = path.join(ICI, "..", "petit-plus-minus");
const OUT = path.join(ICI, "captures");
fs.mkdirSync(OUT, { recursive: true });

const resultats = [];
const verifier = (nom, ok, detail = "") => { resultats.push(ok); console.log((ok ? "ok    " : "ÉCHEC ") + nom + (detail ? "  · " + detail : "")); };

const sw = fs.readFileSync(path.join(JEU, "sw.js"), "utf8");
const VERSION = sw.match(/var VERSION = "([^"]+)"/)[1];
const SHELL = [...sw.slice(sw.indexOf("var SHELL")).split("];")[0].matchAll(/"(\.\/[^"]*)"/g)].map((m) => m[1]);
const contenu = JSON.parse(fs.readFileSync(path.join(JEU, "contenu.json"), "utf8"));
const T = contenu.textes;
const titreOutil = (id) => contenu.outils.find((o) => o.id === id).titre;

const site = await servir();
const URL_JEU = site.base + "petit-plus-minus/";
const navigateur = await chromium.launch();

async function contexte(opts = {}) {
  const ctx = await navigateur.newContext({ ...devices["Pixel 9"], ...opts });
  const p = await ctx.newPage();
  const erreurs = [], dehors = [];
  p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
  p.on("pageerror", (e) => erreurs.push("pageerror: " + e.message));
  ctx.on("request", (r) => { if (!r.url().startsWith(site.base)) dehors.push(r.url()); });
  return { ctx, p, erreurs, dehors };
}
const pret = (p) => p.waitForSelector("html[data-personnages]", { timeout: 8000 });

/* Les mesures communes à tous les parcours. */
function outilsDe(p, h) {
  const visible = (id) => p.evaluate((id) => { const e = document.getElementById(id); return !!e && !e.hidden; }, id);
  const texte = (s) => p.$eval(s, (e) => e.textContent.trim()).catch(() => null);
  const tient = async (nom) => {
    const m = await p.evaluate(() => {
      const e = [...document.querySelectorAll(".ecran")].find((x) => !x.hidden);
      const b = [...e.querySelectorAll("button")].filter((x) => x.offsetParent).map((x) => x.getBoundingClientRect());
      const petits = [...e.querySelectorAll("*")].filter((x) => x.offsetParent !== null && [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
        .filter((x) => parseFloat(getComputedStyle(x).fontSize) < 14).map((x) => x.textContent.trim().slice(0, 16));
      return { trop: document.scrollingElement.scrollHeight - innerHeight, bas: Math.max(0, ...b.map((r) => r.bottom)),
        cible: Math.min(99, ...b.map((r) => Math.min(r.height, r.width))), petits, large: document.scrollingElement.scrollWidth - innerWidth };
    });
    verifier(`${h} px · ${nom} : tient, cibles ≥ 44 px, rien sous 14 px`, m.trop <= 0 && m.bas <= h && m.petits.length === 0 && m.cible >= 44 && m.large <= 0,
      `${m.trop} px de trop, bouton le plus bas à ${Math.round(m.bas)}, plus petite cible ${Math.round(m.cible)}${m.petits.length ? ", petits : " + m.petits.join(" / ") : ""}`);
  };
  return { visible, texte, tient };
}

/* 1. Premier lancement */
{
  const { ctx, p, erreurs, dehors } = await contexte();
  await p.goto(URL_JEU);
  await pret(p);
  await p.evaluate(() => document.fonts.ready);

  const textes = await p.$$eval("[data-texte]", (els) => els.map((e) => [e.dataset.texte, e.textContent]));
  const vides = textes.filter(([, t]) => !t.trim());
  verifier("chaque [data-texte] est rempli depuis contenu.json", vides.length === 0 && textes.length > 0, vides.map((v) => v[0]).join(", "));
  verifier("le titre (pour le lecteur d'écran) vient de contenu.json", textes.some(([k, t]) => k === "accueil.titre" && t === contenu.accueil.titre));
  const outils = await p.$$eval("#outils .outil", (bs) => bs.map((b) => b.dataset.outil));
  verifier("l'accueil montre tous les outils, dans l'ordre de contenu.json", outils.join() === contenu.outils.map((o) => o.id).join(), outils.join());
  verifier("la jauge a ses quatre Minus", (await p.$$("#jauge .cran .perso-svg")).length === 4);

  const polices = await p.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/"/g, "")));
  verifier("Baloo 2 et Nunito sont chargées depuis le dossier", polices.includes("Baloo 2") && polices.includes("Nunito"), polices.join(", "));
  const police = await p.$eval(".outil", (e) => getComputedStyle(e).fontFamily);
  verifier("les outils sont en Baloo 2", police.startsWith('"Baloo 2"'), police);

  for (const h of [732, 640]) {
    await p.setViewportSize({ width: 360, height: h });
    await p.waitForTimeout(100);
    const trop = await p.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
    verifier(`l'accueil tient à 360 × ${h}`, trop <= 0, trop + " px de trop");
    await p.waitForTimeout(250);
    await p.screenshot({ path: path.join(OUT, `ppm-accueil-${h}.png`) });
  }
  await p.setViewportSize(devices["Pixel 9"].viewport);

  const csp = await p.$eval('meta[http-equiv="Content-Security-Policy"]', (m) => m.content).catch(() => "");
  verifier("la politique de sécurité interdit toute autre origine", /default-src 'self'/.test(csp));

  /* 2. Service worker, version, cache comparé au dépôt */
  await p.reload();
  await pret(p);
  await p.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 8000 });
  const version = await p.evaluate(() => window.ppm.versionDuService());
  verifier("le service dit sa version", version === VERSION, version + " / " + VERSION);
  const cache = await p.evaluate(async (shell) => {
    const nom = (await caches.keys()).find((n) => n.startsWith("petit-plus-minus:"));
    const c = await caches.open(nom);
    const out = {};
    for (const f of shell) { const r = await c.match(f); out[f] = r ? Array.from(new Uint8Array(await r.arrayBuffer())) : null; }
    return { nom, out };
  }, SHELL);
  verifier("le cache porte le nom du jeu et de sa version", !!cache.nom && cache.nom.endsWith(":" + VERSION), cache.nom);
  const differents = SHELL.filter((f) => !cache.out[f] || !Buffer.from(cache.out[f]).equals(fs.readFileSync(path.join(JEU, f === "./" ? "index.html" : f))));
  verifier("chaque fichier en cache est identique au dépôt", differents.length === 0, differents.join(", "));

  /* 3. Hors ligne */
  await ctx.setOffline(true);
  await p.reload();
  await pret(p).catch(() => {});
  const horsLigne = await p.evaluate(() => ({ outils: document.querySelectorAll("#outils .outil").length, jauge: document.querySelectorAll("#jauge .perso-svg").length }));
  verifier("le jeu se relance hors ligne, outils et jauge compris", horsLigne.outils === contenu.outils.length && horsLigne.jauge === 4, JSON.stringify(horsLigne));
  await ctx.setOffline(false);

  /* Un fichier oublié dans SHELL passe inaperçu en ligne : le service le range au vol. Mais
     un téléphone qui installe le jeu et passe aussitôt hors ligne ne l'aurait pas. */
  const demandes = [...new Set(site.servis.map((s) => s.rel)
    .filter((r) => r.startsWith("/petit-plus-minus/") && !/\/(sw\.js|demo\.html|js\/demo\.js)$/.test(r))
    .map((r) => "." + r.slice("/petit-plus-minus".length)))];
  const horsListe = demandes.filter((f) => !SHELL.includes(f));
  verifier("tout fichier demandé par la page est dans SHELL", horsListe.length === 0, horsListe.join(", "));
  verifier("aucune requête hors du site", dehors.length === 0, dehors.join(", "));
  verifier("aucune erreur dans la console", erreurs.length === 0, erreurs.join(" | "));
  await ctx.close();
}

/* 4. contenu.json cassé par une relecture : l'adulte voit où */
{
  const { ctx, p } = await contexte({ serviceWorkers: "block" });
  const casse = structuredClone(contenu);
  casse.sos.phrases.push("peur-du-noir");
  await p.route("**/contenu.json", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify(casse) }));
  await p.goto(URL_JEU);
  await p.waitForSelector("#panne:not([hidden])", { timeout: 5000 }).catch(() => {});
  const liste = await p.$$eval("#panne-liste li", (li) => li.map((l) => l.textContent));
  verifier("un contenu cassé affiche la clé fautive", liste.some((l) => l.startsWith("sos.phrases") && l.includes("peur-du-noir")), liste.join(" / "));
  await ctx.close();
}

/* 5. La jauge : un appui note le niveau, surligne les outils qui aident, et survit au
   rechargement ; « J'ai besoin de calme » ne note rien ; les clés des autres jeux (même
   origine) ne sont pas touchées ; un navigateur qui refuse de stocker n'empêche rien. */
{
  const { ctx, p, erreurs } = await contexte({ serviceWorkers: "block" });
  try {
    await p.addInitScript(() => { if (!localStorage.getItem("chevalier:score")) localStorage.setItem("chevalier:score", "99"); });
    await p.goto(URL_JEU);
    await pret(p);
    const lu = () => p.evaluate(() => JSON.parse(localStorage.getItem("ppm:donnees") || "null"));
    const crans = p.locator("#jauge .cran");
    verifier("jauge : rien n'est noté avant un appui", (await lu()) === null);
    await crans.nth(1).click();
    await crans.nth(3).click();
    const d = await lu();
    verifier("jauge : changer d'avis tout de suite remplace la note (Énorme seulement)", d && d.meteo.length === 1 && d.meteo[0].niveau === "enorme", JSON.stringify(d && d.meteo));
    const enorme = contenu.jauge.niveaux[3];
    const sugg = await p.$$eval("#outils .outil.suggere", (bs) => bs.map((b) => b.dataset.outil));
    verifier("jauge : Énorme surligne la bougie et le robot, et le conseil s'affiche",
      sugg.join() === enorme.outils.join() && (await p.$eval("#conseil", (e) => e.textContent)) === enorme.conseil, sugg.join());
    /* Le surlignage se MESURE : un cadre ambre de 4 px sur fond blanc existait bien dans le
       code, mais ne se voyait presque pas à l'écran. Contraste du cadre sur la page (3:1 au
       moins), épaisseur, et un fond différent des tuiles non conseillées. */
    const vu = await p.evaluate(() => {
      const lum = (c) => { const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map((x) => x / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
      const oui = getComputedStyle(document.querySelector("#outils .outil.suggere")), non = getComputedStyle(document.querySelector("#outils .outil:not(.suggere)"));
      return { cadre: +ratio(oui.outlineColor, getComputedStyle(document.body).backgroundColor).toFixed(1), epais: parseFloat(oui.outlineWidth),
        fondDifferent: oui.backgroundColor !== non.backgroundColor, sansCadre: non.outlineStyle === "none" || parseFloat(non.outlineWidth) === 0 };
    });
    verifier("jauge : un outil conseillé se VOIT (cadre ≥ 4 px à 7:1 au moins sur la page, fond différent des autres)",
      vu.cadre >= 7 && vu.epais >= 4 && vu.fondDifferent && vu.sansCadre, JSON.stringify(vu));
    verifier("jauge : un seul Minus choisi", (await crans.evaluateAll((cs) => cs.map((c) => c.getAttribute("aria-pressed")))).join() === "false,false,false,true");
    await p.reload();
    await pret(p);
    verifier("jauge : la note survit au rechargement", (await p.evaluate(() => window.ppm.etat().meteo.length)) === 1);
    await p.click("#vers-calme");
    verifier("jauge : « J'ai besoin de calme » ne note rien", (await lu()).meteo.length === 1);
    const cles = await p.evaluate(() => Object.keys(localStorage).sort());
    verifier("mémoire : une seule clé à nous, celle du voisin intacte",
      cles.join() === "chevalier:score,ppm:donnees" && (await p.evaluate(() => localStorage.getItem("chevalier:score"))) === "99", cles.join());
    verifier("jauge : aucune erreur", erreurs.length === 0, erreurs.join(" | "));
  } catch (e) { verifier("jauge : le parcours va jusqu'au bout", false, e.message.split(/\r?\n/)[0]); }
  await ctx.close();
}
{
  const { ctx, p, erreurs } = await contexte({ serviceWorkers: "block" });
  try {
    await p.addInitScript(() => {
      Storage.prototype.setItem = () => { throw new DOMException("refus", "QuotaExceededError"); };
      Storage.prototype.getItem = () => { throw new DOMException("refus", "SecurityError"); };
    });
    await p.goto(URL_JEU);
    await pret(p);
    await p.locator("#jauge .cran").nth(3).click();
    await p.click("#vers-calme");
    verifier("stockage refusé : la jauge et le SOS marchent quand même", await p.evaluate(() => !document.getElementById("sos").hidden));
    verifier("stockage refusé : aucune erreur", erreurs.length === 0, erreurs.join(" | "));
  } catch (e) { verifier("stockage refusé : le parcours va jusqu'au bout", false, e.message.split(/\r?\n/)[0]); }
  await ctx.close();
}

/* 6. Le SOS, aux deux hauteurs : respirations au rythme de la bulle, retour d'Android
   étape par étape, Minus montré et qui prend la taille choisie par l'enfant. */
for (const h of [732, 640]) {
  const { ctx, p, erreurs } = await contexte({ serviceWorkers: "block", viewport: { width: 360, height: h } });
  await p.clock.install();
  try {
    await p.goto(URL_JEU);
    await pret(p);
    await p.evaluate(() => document.fonts.ready);
    const { visible, texte, tient } = outilsDe(p, h);
    const garde = await p.evaluate(() => window.ppm.garde) + 100;
    const CYCLE = 8000, N = contenu.sos.respirations;
    const faites = () => p.$$eval("#sos-corps .points i.fait", (x) => x.length);
    const boutons = () => p.$$eval("#sos-actions button", (x) => x.length);

    await tient("accueil");
    // L'accueil à une main : le calme sous le pouce, et pas de vide entre les blocs.
    const place = await p.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect();
      const outils = r("#outils"), calme = r("#vers-calme"), liens = r("#accueil .liens-bas"), jauge = r("#accueil .jauge-carte");
      return { calmeHaut: calme.top, vides: [outils.top - jauge.bottom, calme.top - outils.bottom, liens.top - calme.bottom, innerHeight - liens.bottom].map(Math.round) };
    });
    verifier(`${h} px · « J'ai besoin de calme » est en bas, sous le pouce`, place.calmeHaut > h * 0.6, `haut à ${Math.round(place.calmeHaut)} px`);
    verifier(`${h} px · l'accueil remplit l'écran : aucun vide de plus de 24 px`, place.vides.every((v) => v >= 0 && v <= 24), place.vides.join(" / "));
    verifier(`${h} px · le calme reste le premier bouton pour un lecteur d'écran`, (await p.$eval("#accueil button", (b) => b.id)) === "vers-calme");
    // La jauge sur « Moyen » : le SOS montre un Minus un peu moins gros.
    await p.locator("#jauge .cran").nth(2).click();
    await p.click("#vers-calme");
    verifier(`${h} px · « J'ai besoin de calme » ouvre le SOS en un appui`, await visible("sos"));
    await p.clock.runFor(300);
    await tient("SOS, respiration");
    await p.clock.runFor(CYCLE);
    verifier(`${h} px · lecteur d'écran : « 1 respiration » au singulier`,
      (await p.$eval("#sos-corps .pour-lecteur", (e) => e.textContent)) === contenu.sos.souffle.compteUne.replace("{n}", "1").replace("{total}", String(N)));
    await p.clock.runFor(CYCLE * (N - 2));
    verifier(`${h} px · la bulle compte seule, rien à appuyer avant la dernière respiration`, (await faites()) === N - 1 && (await boutons()) === 0);
    await p.clock.runFor(CYCLE);
    verifier(`${h} px · après ${N} respirations, « ${contenu.sos.souffle.boutonSuite} » apparaît`,
      (await faites()) === N && (await texte("#sos-actions .btn")) === contenu.sos.souffle.boutonSuite);
    if (h === 732) await p.screenshot({ path: path.join(OUT, "ppm-sos-souffle.png") });
    await p.click("#sos-actions .btn");
    verifier(`${h} px · un appui dès son apparition est ignoré (il peut arriver sous le doigt)`, !!(await p.$("#sos-corps .zone-bulle")));
    await p.clock.runFor(garde);
    await p.click("#sos-actions .btn");
    const phrases = p.locator("#sos-actions .phrase");
    verifier(`${h} px · les phrases de courage, sous le pouce`, (await phrases.count()) === contenu.sos.phrases.length
      && (await phrases.first().evaluate((e) => e.getBoundingClientRect().top)) >= h / 3);
    await tient("SOS, choix de la phrase");
    await p.goBack();
    await p.waitForTimeout(100);
    await p.clock.runFor(garde);
    verifier(`${h} px · retour depuis le choix : les ${N} respirations restent faites, le bouton est là`,
      (await faites()) === N && (await texte("#sos-actions .btn")) === contenu.sos.souffle.boutonSuite);
    await p.click("#sos-actions .btn");
    await p.clock.runFor(garde);
    await phrases.nth(1).click();
    const attendue = contenu.paires.find((x) => x.id === contenu.sos.phrases[1]).phrase;
    verifier(`${h} px · la phrase choisie est affichée, avec Petit Plus et Minus`,
      ((await texte(".citation")) || "").includes(attendue) && (await p.$$("#sos-corps .scene-sos .perso-svg")).length === 2);
    await p.goBack();
    await p.waitForTimeout(100);
    verifier(`${h} px · retour Android en plein SOS : on revient au choix de la phrase`,
      (await visible("sos")) && (await p.$$("#sos-actions .phrase")).length === contenu.sos.phrases.length);
    await p.clock.runFor(garde);
    await phrases.nth(1).click();
    await tient("SOS, dire la phrase");
    await p.clock.runFor(garde);
    await p.click("#sos-actions .btn");
    const reps = await p.$$eval("#sos-actions .rep", (rs) => rs.map((r) => ({
      e: parseFloat(r.querySelector(".perso-svg").style.getPropertyValue("--echelle")), c: getComputedStyle(r).borderTopColor })));
    verifier(`${h} px · chaque réponse porte un Minus de sa taille, toutes de la même couleur`,
      reps.length === 3 && reps[0].e < reps[1].e && reps[1].e < reps[2].e && new Set(reps.map((r) => r.c)).size === 1);
    await tient("SOS, Minus a-t-il rétréci");
    const hauteurMinus = () => p.$eval("#sos-corps .scene-minus .perso-svg", (s) => s.getBoundingClientRect().height);
    const avantFin = await hauteurMinus();
    await p.clock.runFor(garde);
    await p.click(".rep-unPeu");
    await p.clock.runFor(100);
    await p.waitForTimeout(800); // la transition CSS suit l'horloge réelle
    const rapport = (await hauteurMinus()) / avantFin;
    verifier(`${h} px · « Un peu » : Minus prend la taille choisie par l'enfant (affichée)`, Math.abs(rapport - 0.75) < 0.03, rapport.toFixed(3));
    const trace = await p.evaluate(() => window.ppm.etat().sos.at(-1));
    verifier(`${h} px · la fin du SOS est notée en silence`, trace && trace.depuis === "calme" && trace.reponse === "unPeu", JSON.stringify(trace));
    verifier(`${h} px · la fin rend la phrase de courage choisie`, ((await texte("#sos-corps .fin-phrase-texte")) || "").includes(attendue));
    await tient("SOS, fin");
    if (h === 732) await p.screenshot({ path: path.join(OUT, "ppm-sos-fin.png") });
    const nbTraces = await p.evaluate(() => window.ppm.etat().sos.length);
    await p.goBack();
    await p.waitForTimeout(100);
    await p.clock.runFor(garde);
    await p.click(".rep-non");
    await p.clock.runFor(100);
    const apresNon = await p.evaluate(() => ({ n: window.ppm.etat().sos.length, r: window.ppm.etat().sos.at(-1).reponse }));
    verifier(`${h} px · changer sa réponse dans le même SOS remplace la trace`, apresNon.n === nbTraces && apresNon.r === "non");
    verifier(`${h} px · « Non » : Petit Plus grandit près de Minus, rappel court`,
      (await p.$$("#sos-corps .scene-proche")).length === 1 && (await texte("#rappel-adulte")) === contenu.sos.rappelAdulteCourt);
    await tient("SOS, fin « Non »");
    await p.clock.runFor(garde);
    await p.click("#sos-actions .btn");
    await p.waitForTimeout(150);
    verifier(`${h} px · « Refaire un souffle » repart à zéro`, (await faites()) === 0 && (await boutons()) === 0);
    await p.goBack();
    await p.waitForTimeout(150);
    verifier(`${h} px · après « Refaire », le retour ne remonte pas l'ancien SOS`, (await visible("accueil")) && !(await visible("sos")));
    await p.goForward();
    await p.waitForTimeout(150);
    await p.click("#sos-retour");
    await p.waitForTimeout(150);
    verifier(`${h} px · « Retour » quitte tout le SOS et ramène à l'accueil`, await visible("accueil"));
    verifier(`${h} px · SOS : aucune erreur`, erreurs.length === 0, erreurs.join(" | "));
  } catch (e) { verifier(`${h} px · le SOS va jusqu'au bout`, false, e.message.split(/\r?\n/)[0]); }
  await ctx.close();
}

/* 7. Les outils, aux deux hauteurs. Horloge simulée pour les exercices minutés. */
for (const h of [732, 640]) {
  const { ctx, p, erreurs } = await contexte({ serviceWorkers: "block", viewport: { width: 360, height: h } });
  await p.clock.install();
  try {
    await p.goto(URL_JEU);
    await pret(p);
    await p.evaluate(() => document.fonts.ready);
    const { visible, texte, tient } = outilsDe(p, h);
    const ouvrir = (id) => p.click(`#outils .outil[data-outil="${id}"]`);
    const finie = (id) => p.evaluate((id) => !document.getElementById(id).hidden && document.getElementById(id).children.length === 2, id);
    const mots = (s) => p.$eval(s, (e) => e.innerText.split(/\s+/).filter(Boolean).length);
    /* Ce qui est AFFICHÉ, mesuré : `.hidden` sur un SVG ne cache rien, et une première
       version de ce banc lisait cette propriété sans effet, verte alors que le robot
       restait à l'écran pendant « Spaghetti… ». */
    const affiche = (s) => p.$eval(s, (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== "none"; });
    const vibre = () => p.$eval("#le-robot", (e) => getComputedStyle(e).animationName !== "none");

    // La bougie : 3 × (fleur 4 s, bougie 6 s), rien à toucher avant la fin.
    await ouvrir("bougie");
    verifier(`${h} px · la bougie s'ouvre`, await visible("bougie"));
    await p.clock.runFor(1000 + 100);
    verifier(`${h} px · bougie : « ${contenu.bougie.fleur} », la fleur grandit`, (await texte("#mot-bougie")) === contenu.bougie.fleur && (await p.$eval("#fleur", (f) => f.classList.contains("grande"))));
    verifier(`${h} px · bougie : pendant l'exercice, 12 mots au plus à lire`, (await mots("#bougie .scene-outil")) <= 12, String(await mots("#bougie .scene-outil")));
    await tient("la bougie");
    await p.waitForTimeout(300);
    if (h === 732) await p.screenshot({ path: path.join(OUT, "ppm-bougie.png") });
    await p.clock.runFor(4000);
    verifier(`${h} px · bougie : « ${contenu.bougie.bougie} », la flamme se couche`, (await texte("#mot-bougie")) === contenu.bougie.bougie && (await p.$eval("#flamme", (f) => f.classList.contains("soufflee"))));
    verifier(`${h} px · bougie : rien à toucher pendant l'exercice`, !(await finie("fin-bougie")));
    await p.clock.runFor(6000 + 10000 * (contenu.bougie.tours - 1));
    verifier(`${h} px · bougie : ${contenu.bougie.tours} tours, puis « ${T.bravo} » et les boutons de fin`,
      (await p.$$("#points-bougie i.fait")).length === contenu.bougie.tours && (await texte("#mot-bougie")) === T.bravo && (await finie("fin-bougie")));
    await tient("la bougie, finie");
    await p.clock.runFor(500);
    await p.locator("#fin-bougie .btn").click();
    verifier(`${h} px · « ${T.cestFait} » ramène à l'accueil`, await visible("accueil"));

    // Quitter un exercice en cours l'arrête pour de bon.
    await ouvrir("bougie");
    await p.clock.runFor(3000);
    await p.goBack();
    await p.clock.runFor(60000);
    verifier(`${h} px · bougie quittée en cours : elle s'arrête, rien ne s'écrit en cachette`,
      (await visible("accueil")) && (await p.$$("#points-bougie i.fait")).length === 0);

    // Robot spaghetti : raide 5 s, mou 10 s, une partie du corps à la fois.
    await ouvrir("robot");
    verifier(`${h} px · robot : avant de commencer, le robot attend sans vibrer`, (await affiche("#le-robot")) && !(await vibre()) && !(await affiche("#le-spaghetti")));
    await p.clock.runFor(1200 + 100);
    verifier(`${h} px · robot : « ${contenu.robot.robot} » ${contenu.robot.parties[0]}, le robot est là`,
      (await texte("#mot-robot")) === contenu.robot.robot && (await texte("#partie-robot")) === contenu.robot.parties[0]
      && (await affiche("#le-robot")) && !(await affiche("#le-spaghetti")) && (await vibre()));
    verifier(`${h} px · robot : pendant l'exercice, 12 mots au plus à lire`, (await mots("#robot .scene-outil")) <= 12, String(await mots("#robot .scene-outil")));
    await tient("robot spaghetti");
    await p.waitForTimeout(300);
    if (h === 732) await p.screenshot({ path: path.join(OUT, "ppm-robot.png") });
    await p.clock.runFor(5000);
    verifier(`${h} px · robot : puis « ${contenu.robot.spaghetti} », tout mou`,
      (await texte("#mot-robot")) === contenu.robot.spaghetti && (await affiche("#le-spaghetti")) && !(await affiche("#le-robot")));
    await p.waitForTimeout(300);
    if (h === 732) await p.screenshot({ path: path.join(OUT, "ppm-spaghetti.png") });
    await p.clock.runFor(10000);
    verifier(`${h} px · robot : la partie suivante, ${contenu.robot.parties[1]}`, (await texte("#partie-robot")) === contenu.robot.parties[1]);
    await p.clock.runFor(15000 * (contenu.robot.parties.length - 1));
    verifier(`${h} px · robot : toutes les parties, puis les boutons de fin`,
      (await p.$$("#points-robot i.fait")).length === contenu.robot.parties.length && (await finie("fin-robot")));
    await tient("robot spaghetti, fini");
    await p.clock.runFor(500);
    await p.locator("#fin-robot .btn").click();

    // La bulle
    await ouvrir("bulle");
    await p.clock.runFor(300);
    await tient("la bulle");
    await p.clock.runFor(8000 * contenu.bulle.respirations);
    verifier(`${h} px · la bulle : ${contenu.bulle.respirations} respirations, puis les boutons de fin`,
      (await p.$$("#points-souffle i.fait")).length === contenu.bulle.respirations && (await finie("fin-souffle")));
    await p.clock.runFor(500);
    await p.locator("#fin-souffle .btn").click();

    // 5 trésors
    await ouvrir("tresors");
    await tient("5 trésors, 1re étape");
    for (const [k, etape] of contenu.tresors.entries()) {
      const gemmes = p.locator("#tresors-corps .gemme");
      if ((await gemmes.count()) !== etape.n) { verifier(`${h} px · trésors, étape ${k + 1}`, false, String(await gemmes.count())); break; }
      for (let i = 0; i < etape.n; i++) await gemmes.nth(i).click();
      await gemmes.nth(0).click();
      if (k === 0) verifier(`${h} px · trésors : une gemme de trop ne compte pas, le bouton suit`,
        (await p.$$("#tresors-corps .gemme.trouvee")).length === 5 && (await texte("#tresors-actions .btn")) === contenu.chasse.suivant);
      await p.click("#tresors-actions .btn");
      if (k === 0) verifier(`${h} px · trésors : un appui juste après l'apparition du bouton est ignoré`, (await p.$$("#tresors-corps .gemme")).length === 5);
      await p.clock.runFor(450);
      await p.click("#tresors-actions .btn");
    }
    await p.waitForSelector("#tresors-corps .tresor-titre", { timeout: 3000 });
    verifier(`${h} px · trésors : 15 trésors, sans étoile ni score`, (await texte("#tresors-corps .tresor-titre")) === contenu.chasse.finTitre.replace("{total}", "15")
      && (await p.$$("#tresors .recompense")).length === 0);
    await tient("5 trésors, fin");
    await p.clock.runFor(450);
    await p.locator("#tresors-actions .btn").click();

    // Les paires : toutes les cartes visibles
    await ouvrir("paires");
    const n = contenu.lesPaires.nombre;
    verifier(`${h} px · les paires : ${n} pensées et ${n} phrases, toutes visibles`,
      (await p.$$("#colonnes .carte-minus")).length === n && (await p.$$("#colonnes .carte-plus")).length === n
      && (await p.$$eval("#colonnes .carte", (cs) => cs.every((c) => c.offsetParent && c.textContent.trim().length > 3))));
    await tient("les paires");
    await p.waitForTimeout(300);
    if (h === 732) await p.screenshot({ path: path.join(OUT, "ppm-paires.png") });
    const ids = await p.evaluate(() => window.ppm.paires().ids);
    const carte = (cote, id) => p.locator(`#colonnes .carte-${cote}[data-id="${id}"]`);
    await carte("plus", ids[0]).click();
    verifier(`${h} px · paires : une phrase avant une pensée, on le dit`, (await texte("#retour-paires")) === contenu.lesPaires.dabord);
    await carte("minus", ids[0]).click();
    await carte("plus", ids[1]).click();
    verifier(`${h} px · paires : la mauvaise phrase ne compte pas, et on le dit`,
      (await p.evaluate(() => window.ppm.paires().faites.length)) === 0 && (await texte("#retour-paires")) === contenu.lesPaires.encore);
    for (const id of ids) { await carte("minus", id).click(); await carte("plus", id).click(); }
    verifier(`${h} px · paires : toutes trouvées, puis les boutons de fin`,
      (await texte("#retour-paires")) === contenu.lesPaires.toutes && (await finie("fin-paires")));
    await tient("les paires, finies");
    await p.clock.runFor(500);
    await p.locator("#fin-paires .btn").click();

    // Réponds à Minus : la bulle juste au-dessus des deux réponses
    await ouvrir("reponds");
    await p.waitForTimeout(700);
    const r0 = await p.evaluate(() => window.ppm.reponds());
    const phraseDe = (id) => contenu.paires.find((x) => x.id === id).phrase;
    const choix = p.locator("#reponses .rep-phrase");
    verifier(`${h} px · Réponds à Minus : sa pensée, et deux phrases`,
      (await texte("#bulle-minus")) === contenu.reponds.pensee.replace("{pensee}", contenu.paires.find((x) => x.id === r0.ordre[0]).pensee) && (await choix.count()) === 2);
    const lieu = await p.evaluate(() => ({ bulle: document.getElementById("bulle-minus").getBoundingClientRect().bottom, rep: document.querySelector("#reponses .rep-phrase").getBoundingClientRect().top }));
    verifier(`${h} px · un seul endroit où lire : la bulle de Minus, la consigne, puis les réponses, sans trou`, lieu.rep - lieu.bulle >= 0 && lieu.rep - lieu.bulle <= 64, `${Math.round(lieu.rep - lieu.bulle)} px`);
    /* Ce qui dit à l'enfant QUOI faire, mesuré : la consigne est affichée entre la bulle et
       les réponses ; chaque réponse a l'ombre d'un bouton et l'étoile de Plus ; tant qu'il n'a
       rien touché, elles bougent pour l'inviter. */
    const invite = await p.evaluate(() => {
      const c = document.getElementById("reponds-consigne").getBoundingClientRect(), bulle = document.getElementById("bulle-minus").getBoundingClientRect();
      const reps = [...document.querySelectorAll("#reponses .rep-phrase")];
      return { consigne: document.getElementById("reponds-consigne").textContent, entre: c.top >= bulle.bottom && c.bottom <= reps[0].getBoundingClientRect().top, visible: c.height > 0 && getComputedStyle(document.getElementById("reponds-consigne")).visibility === "visible",
        ombre: reps.every((b) => getComputedStyle(b).boxShadow !== "none"), etoile: reps.every((b) => { const s = b.querySelector("svg"); return s && s.getBoundingClientRect().width >= 20; }),
        bouge: reps.every((b) => getComputedStyle(b).animationName === "invite") };
    });
    verifier(`${h} px · Réponds à Minus dit quoi faire : « ${contenu.reponds.consigne} », des réponses en forme de boutons, qui invitent à toucher`,
      invite.consigne === contenu.reponds.consigne && invite.entre && invite.visible && invite.ombre && invite.etoile && invite.bouge, JSON.stringify(invite));
    await tient("Réponds à Minus");
    await p.waitForTimeout(300);
    if (h === 732) await p.screenshot({ path: path.join(OUT, "ppm-reponds.png") });
    const hMinus = () => p.$eval("#reponds .reponds-minus .perso-svg", (s) => s.getBoundingClientRect().height);
    const depart = await hMinus();
    const textes = (await choix.allTextContents()).map((x) => x.trim());
    const bonne = phraseDe(r0.ordre[0]);
    const mauvaise = textes.findIndex((x) => x !== bonne);
    await choix.nth(mauvaise).click();
    await p.waitForTimeout(600);
    verifier(`${h} px · l'autre phrase ne coûte rien : Minus garde sa taille, la pensée reste`,
      Math.abs((await hMinus()) - depart) < 1 && (await p.evaluate(() => window.ppm.reponds().k)) === 0);
    verifier(`${h} px · après son premier appui, les réponses ne bougent plus`,
      await p.$$eval("#reponses .rep-phrase", (bs) => bs.every((b) => getComputedStyle(b).animationName !== "invite")));
    await choix.nth(textes.indexOf(bonne)).click();
    await p.waitForTimeout(700);
    verifier(`${h} px · la bonne phrase : Minus rétrécit (affiché), « ${contenu.reponds.ok} », la consigne s'efface le temps qu'il parle`,
      (await hMinus()) < depart * 0.85 && (await texte("#bulle-minus")) === contenu.reponds.ok && (await p.$eval("#reponds-consigne", (c) => getComputedStyle(c).visibility)) === "hidden", `${Math.round(depart)} → ${Math.round(await hMinus())} px`);
    for (let k = 1; k < contenu.reponds.nombre; k++) {
      await p.clock.runFor(1500);
      const r = await p.evaluate(() => window.ppm.reponds());
      const b = phraseDe(r.ordre[r.k]);
      const tx = (await choix.allTextContents()).map((x) => x.trim());
      await choix.nth(tx.indexOf(b)).click();
    }
    await p.waitForTimeout(700);
    verifier(`${h} px · Réponds à Minus : « ${contenu.reponds.fin} », Minus tout petit mais là, boutons de fin`,
      (await texte("#bulle-minus")) === contenu.reponds.fin && (await hMinus()) > 5 && (await hMinus()) < depart * 0.5 && (await finie("fin-reponds")));
    await tient("Réponds à Minus, fini");
    await p.clock.runFor(500);
    await p.locator("#fin-reponds .btn2").click();
    await p.waitForTimeout(150);
    verifier(`${h} px · « ${T.encore} » : une nouvelle partie, Minus de retour à sa taille`,
      (await p.evaluate(() => window.ppm.reponds().k)) === 0 && Math.abs((await hMinus()) - depart) < 2);
    verifier(`${h} px · aucun écran ne parle d'étoiles ni de niveau`, !(await p.evaluate(() => /étoile|niveau \d/i.test(document.body.innerText))));
    verifier(`${h} px · outils : aucune erreur`, erreurs.length === 0, erreurs.join(" | "));
  } catch (e) { verifier(`${h} px · les outils vont jusqu'au bout`, false, e.message.split(/\r?\n/)[0]); }
  await ctx.close();
}

/* 8. Installer : dans le navigateur, un lien pour l'adulte ; sans invitation de Chrome,
   il montre le chemin par le menu DANS l'écran ; avec, il l'ouvre ; installé, il disparaît. */
{
  const cas = async (nom, initScript, fn) => {
    const { ctx, p, erreurs } = await contexte({ serviceWorkers: "block" });
    try {
      if (initScript) await p.addInitScript(initScript);
      await p.goto(URL_JEU);
      await pret(p);
      await fn(p);
      verifier(`installer, ${nom} : aucune erreur`, erreurs.length === 0, erreurs.join(" | "));
    } catch (e) { verifier(`installer, ${nom} : le parcours va jusqu'au bout`, false, e.message.split(/\r?\n/)[0]); }
    await ctx.close();
  };
  const vis = (p, id) => p.evaluate((id) => !document.getElementById(id).hidden, id);
  await cas("sans invitation de Chrome", null, async (p) => {
    verifier("installer : le lien est visible dans le navigateur, cible de 44 px", (await vis(p, "installer")) && (await p.$eval("#installer", (b) => b.getBoundingClientRect().height)) >= 44);
    await p.click("#installer");
    const ra = await p.$eval("#installer-aide", (e) => { const r = e.getBoundingClientRect(); return { haut: r.top, bas: r.bottom, h: innerHeight }; });
    verifier("installer : le chemin par le menu ⋮ s'affiche DANS l'écran", (await vis(p, "installer-aide")) && ra.haut >= 0 && ra.bas <= ra.h, JSON.stringify(ra));
  });
  await cas("avec invitation de Chrome", () => {
    window.__invite = 0;
    addEventListener("load", () => setTimeout(() => {
      const e = new Event("beforeinstallprompt", { cancelable: true });
      e.prompt = () => { window.__invite++; };
      e.userChoice = Promise.resolve({ outcome: "accepted" });
      dispatchEvent(e);
    }, 50));
  }, async (p) => {
    await p.waitForTimeout(200);
    await p.click("#installer");
    verifier("installer : avec invitation, le lien ouvre la fenêtre de Chrome", (await p.evaluate(() => window.__invite)) === 1 && !(await vis(p, "installer-aide")));
  });
  await cas("déjà installé", () => {
    const vrai = matchMedia.bind(window);
    window.matchMedia = (q) => (q.includes("display-mode: standalone") ? { matches: true, media: q, addEventListener() {}, removeEventListener() {} } : vrai(q));
  }, async (p) => {
    verifier("installer : dans l'app installée, le lien n'existe pas", !(await vis(p, "installer")));
  });
}

/* 9. Constats de revue, reproduits. */
{
  // Le dessin de la fée du SOS ne charge pas : la bulle et le bouton doivent quand même venir.
  const { ctx, p } = await contexte({ serviceWorkers: "block" });
  await p.clock.install();
  try {
    await p.route("**/petit-plus-calme.svg", (r) => r.abort());
    await p.goto(URL_JEU);
    await pret(p);
    await p.click("#vers-calme");
    await p.waitForSelector("#sos-corps .bulle", { timeout: 5000 });
    await p.clock.runFor(8000 * contenu.sos.respirations + 300);
    verifier("revue : sans le dessin de la fée, le SOS garde sa bulle et son bouton",
      (await p.$eval("#sos-actions .btn", (b) => b.textContent).catch(() => "")) === contenu.sos.souffle.boutonSuite);
  } catch (e) { verifier("revue : SOS sans dessin, le parcours va jusqu'au bout", false, e.message.split(/\r?\n/)[0]); }
  await ctx.close();
}
{
  // Quitter la bulle pendant le chargement de la fée, puis ouvrir le SOS : la bulle cachée
  // ne doit ni tourner, ni arrêter celle du SOS.
  const { ctx, p } = await contexte({ serviceWorkers: "block" });
  await p.clock.install();
  try {
    await p.route("**/petit-plus.svg", async (r) => { await new Promise((ok) => setTimeout(ok, 600)); await r.continue(); });
    await p.goto(URL_JEU);
    await p.waitForSelector("html[data-pret]");
    await p.click('#outils .outil[data-outil="bulle"]');
    await p.goBack();
    await p.waitForTimeout(1500);
    await p.click("#vers-calme");
    await p.waitForSelector("#sos-corps .bulle", { timeout: 5000 });
    await p.clock.runFor(8000 * contenu.sos.respirations + 300);
    verifier("revue : une bulle quittée pendant son chargement ne gêne pas le SOS",
      (await p.$$("#sos-corps .points i.fait")).length === contenu.sos.respirations);
  } catch (e) { verifier("revue : bulle quittée, le parcours va jusqu'au bout", false, e.message.split(/\r?\n/)[0]); }
  await ctx.close();
}

/* 10. Les textes les plus longs, posés partout où ils s'affichent (le tirage est au
   hasard : attendre qu'un texte long tombe ne prouverait rien). */
for (const h of [732, 640]) {
  const { ctx, p, erreurs } = await contexte({ serviceWorkers: "block", viewport: { width: 360, height: h } });
  try {
    await p.goto(URL_JEU);
    await pret(p);
    await p.evaluate(() => document.fonts.ready);
    const parLongueur = (l) => [...l].sort((a, b) => b.length - a.length);
    const phrases = parLongueur(contenu.paires.map((x) => x.phrase));
    const pensees = parLongueur(contenu.paires.map((x) => x.pensee));
    const trop = () => p.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
    await p.click('#outils .outil[data-outil="paires"]');
    await p.evaluate(({ ph, pe }) => {
      document.querySelectorAll("#colonnes .carte-plus").forEach((c, i) => { c.textContent = ph[i]; });
      document.querySelectorAll("#colonnes .carte-minus").forEach((c, i) => { c.textContent = pe[i]; });
    }, { ph: phrases, pe: pensees });
    const t1 = await trop();
    verifier(`${h} px · paires : les textes les plus longs tiennent dans l'écran`, t1 <= 0, `${t1} px de trop`);
    await p.goBack();
    await p.click('#outils .outil[data-outil="reponds"]');
    await p.waitForTimeout(100);
    const hBulle = await p.$eval("#bulle-minus", (e) => e.getBoundingClientRect().height);
    await p.evaluate(({ ph, pe, modele }) => {
      document.querySelectorAll("#reponses .rep-phrase").forEach((b, i) => { b.textContent = ph[i]; });
      document.getElementById("bulle-minus").textContent = modele.replace("{pensee}", pe);
    }, { ph: phrases, pe: pensees[0], modele: contenu.reponds.pensee });
    const t2 = await trop();
    const hBulle2 = await p.$eval("#bulle-minus", (e) => e.getBoundingClientRect().height);
    verifier(`${h} px · Réponds à Minus : la pensée et les phrases les plus longues tiennent, la bulle ne saute pas`,
      t2 <= 0 && Math.abs(hBulle2 - hBulle) < 1, `${t2} px de trop, bulle ${Math.round(hBulle)} → ${Math.round(hBulle2)}`);
    verifier(`${h} px · textes longs : aucune erreur`, erreurs.length === 0, erreurs.join(" | "));
  } catch (e) { verifier(`${h} px · textes longs : le parcours va jusqu'au bout`, false, e.message.split(/\r?\n/)[0]); }
  await ctx.close();
}

/* 11. « Pour les grands » : derrière un petit calcul. Le choix des peurs change vraiment les
   pensées de Minus, survit au rechargement ; cibles de 44 px, rien sous 14 px. */
for (const h of [732, 640]) {
  const { ctx, p, erreurs } = await contexte({ serviceWorkers: "block", viewport: { width: 360, height: h } });
  try {
    await p.goto(URL_JEU);
    await pret(p);
    await p.evaluate(() => document.fonts.ready);
    const sensibles = Object.entries(contenu.themes).filter(([k, th]) => !k.startsWith("_") && th.parDefaut === false);
    const cache = (id) => p.evaluate((id) => document.getElementById(id).hidden, id);
    const passer = async () => {
      const r = await p.$eval("#barriere-question", (q) => Number(q.dataset.a) * Number(q.dataset.b) + Number(q.dataset.c));
      await p.fill("#barriere-reponse", String(r));
      await p.click("#barriere-valider");
    };
    await p.click("#vers-grands");
    verifier(`${h} px · « Pour les grands » : l'aide au parent, puis la barrière, la liste cachée`,
      !(await cache("barriere")) && (await cache("mes-minus-contenu")) && (await p.$$("#aide-parent p")).length === contenu.mesMinus.aide.length);
    await p.fill("#barriere-reponse", "12");
    await p.click("#barriere-valider");
    verifier(`${h} px · une mauvaise réponse ne l'ouvre pas, et dit pourquoi`,
      (await cache("mes-minus-contenu")) && (await p.$eval("#barriere-rate", (e) => !e.hidden && e.textContent)) === contenu.mesMinus.barriereRate);
    verifier(`${h} px · avant le calcul, « Ouvrir » est entier dans l'écran`, (await p.$eval("#barriere-valider", (b) => b.getBoundingClientRect().bottom)) <= h);
    await passer();
    const choix = await p.$$eval("#mes-minus-contenu .choix-grand", (bs) => bs.map((x) => x.querySelector(".titres").textContent));
    verifier(`${h} px · après le calcul : deux choix distincts, l'escalier et les pensées de Minus, pas une liste de peurs`,
      choix.join("|") === [contenu.mesMinus.menu.escalier.titre, contenu.mesMinus.menu.peurs.titre].join("|") && (await p.$$("#mes-minus .theme-ligne")).length === 0
      && (await p.$eval("#mes-minus-contenu", (m) => Math.max(...[...m.querySelectorAll("button")].map((x) => x.getBoundingClientRect().bottom)))) <= h, choix.join(" / "));
    await p.click("#vers-themes");
    const lignes = p.locator("#liste-themes .theme-ligne");
    verifier(`${h} px · la bonne réponse ouvre les ${sensibles.length} peurs, toutes sur « Non »`,
      (await lignes.count()) === sensibles.length && (await p.$$eval("#liste-themes .opt-choix[aria-pressed=true]", (b) => b.map((x) => x.textContent))).every((x) => x === contenu.mesMinus.non));
    const m = await p.evaluate(() => {
      const opts = [...document.querySelectorAll("#liste-themes .opt-choix, #mes-minus-fini")].map((b) => b.getBoundingClientRect());
      const petits = [...document.querySelectorAll("#themes *")].filter((x) => x.offsetParent && [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
        .filter((x) => parseFloat(getComputedStyle(x).fontSize) < 14).length;
      return { minH: Math.min(...opts.map((r) => r.height)), large: document.scrollingElement.scrollWidth - innerWidth, petits };
    });
    verifier(`${h} px · « Pour les grands » : cibles de 44 px, rien sous 14 px, pas de défilement de côté`, m.minH >= 44 && m.large <= 0 && m.petits === 0, JSON.stringify(m));
    const iNoir = sensibles.findIndex(([k]) => k === "noir");
    await lignes.nth(iNoir).locator(".opt-choix").first().click();
    verifier(`${h} px · « Oui » allume le thème et le montre coché`, (await p.evaluate(() => window.ppm.etat().themes.noir)) === true);
    await p.click("#mes-minus-fini");
    verifier(`${h} px · « C'est fait » ramène à l'accueil`, !(await cache("accueil")));
    await p.reload();
    await pret(p);
    await p.click('#outils .outil[data-outil="reponds"]');
    const idsNoir = contenu.paires.filter((x) => x.theme === "noir").map((x) => x.id);
    const tous = await p.evaluate(() => window.ppm.reponds().tous);
    verifier(`${h} px · après rechargement, les pensées du noir sont dans « Réponds à Minus »`, idsNoir.every((id) => tous.includes(id)));
    await p.goBack();
    await p.click("#vers-grands");
    verifier(`${h} px · revenir sur « Pour les grands » redemande le calcul`, await cache("mes-minus-contenu"));
    await passer();
    await p.click("#vers-themes");
    await lignes.nth(iNoir).locator(".opt-choix").nth(1).click();
    await p.click("#mes-minus-fini");
    await p.click('#outils .outil[data-outil="reponds"]');
    const tous2 = await p.evaluate(() => window.ppm.reponds().tous);
    verifier(`${h} px · « Non » les retire`, idsNoir.every((id) => !tous2.includes(id)));
    verifier(`${h} px · « Pour les grands » : aucune erreur`, erreurs.length === 0, erreurs.join(" | "));
  } catch (e) { verifier(`${h} px · « Pour les grands » : le parcours va jusqu'au bout`, false, e.message.split(/\r?\n/)[0]); }
  await ctx.close();
}

/* 10 bis. « Petit yoga » : un chat montre cinq postures, trois respirations chacune. Un seul
   mot à lire pendant l'exercice, rien à toucher ; le chat reste dans son cadre, ferme les
   yeux pendant le souffle, glisse d'une posture à l'autre (tout de suite en animations
   réduites). Horloge simulée : elle avance aussi les images du dessin. */
{
  const { POSTURES, RYTHME, CADRE } = await import(pathToFileURL(path.join(JEU, "js", "yoga.js")));
  const Y = contenu.yoga, RESPIRATION = RYTHME.inspire + RYTHME.souffle, POSE = RYTHME.change + Y.respirations * RESPIRATION;
  for (const [h, reduit] of [[732, false], [640, false], [732, true]]) {
    const nom = reduit ? "yoga, animations réduites" : `${h} px · yoga`;
    const { ctx, p, erreurs } = await contexte({ serviceWorkers: "block", viewport: { width: 360, height: h }, reducedMotion: reduit ? "reduce" : "no-preference" });
    await p.clock.install();
    try {
      await p.goto(URL_JEU);
      await pret(p);
      await p.evaluate(() => document.fonts.ready);
      const { visible, texte, tient } = outilsDe(p, h);
      const cache = (id) => p.evaluate((id) => document.getElementById(id).hidden, id);
      // Où est la tête du chat, et tient-il dans son cadre ? Mesuré sur le dessin affiché.
      const chat = () => p.evaluate(() => {
        const g = document.getElementById("yoga-chat"), t = g.querySelector('ellipse[rx="29"]'), b = g.getBBox();
        return { tete: t ? [Math.round(t.getAttribute("cx")), Math.round(t.getAttribute("cy"))] : null, yeux: g.dataset.yeux, posture: g.dataset.posture,
          boite: [b.x, b.y, b.x + b.width, b.y + b.height].map(Math.round) };
      });
      const pres = (a, b) => !!a && Math.hypot(a[0] - b[0], a[1] - b[1]) <= 3;
      const dansLeCadre = (b) => b[0] >= 0 && b[1] >= 0 && b[2] <= CADRE.largeur && b[3] <= CADRE.hauteur;
      /* L'horloge avance par SAUTS jusqu'à chaque échéance du yoga, puis 20 ms image par
         image. Simuler chaque image du chat pendant trois minutes prenait plus de dix
         minutes de banc ; et un saut qui enjambe une échéance retarde toute la suite (un
         minuteur échu pendant le saut ne part qu'à la fin du saut). */
      let maintenant = 0, bornes = [];
      const planifier = () => {
        maintenant = 0; bornes = [];
        let t = RYTHME.pret; bornes.push(t);
        for (let k = 0; k < Y.postures.length; k++) {
          t += RYTHME.change; bornes.push(t);
          for (let n = 0; n < Y.respirations; n++) { t += RYTHME.inspire; bornes.push(t); t += RYTHME.souffle; bornes.push(t); }
        }
      };
      const avancer = async (ms) => {
        const cible = maintenant + ms - 20;
        while (bornes.length && bornes[0] <= cible) { const b = bornes.shift(); if (b > maintenant) await p.clock.fastForward(b - maintenant); maintenant = Math.max(maintenant, b); }
        if (cible > maintenant) { await p.clock.fastForward(cible - maintenant); maintenant = cible; }
        await p.clock.runFor(20); maintenant += 20;
      };

      await p.click('#outils .outil[data-outil="yoga"]');
      if (!reduit) {
        const vignettes = await p.$$eval("#yoga-apercu .yoga-vignette", (v) => v.map((x) => ({ nom: x.textContent.trim(), dessin: x.querySelectorAll("svg path").length })));
        verifier(`${nom} : avant de commencer, les ${Y.postures.length} postures dessinées, dans l'ordre, et la consigne`,
          (await visible("yoga")) && vignettes.map((v) => v.nom).join("|") === Y.postures.map((x) => x.nom).join("|") && vignettes.every((v) => v.dessin > 10)
          && (await texte("#yoga-avant .pas-texte")) === Y.consigne && (await cache("yoga-pendant")));
        await tient("petit yoga, avant");
        await p.waitForTimeout(300);
        if (h === 732) await p.screenshot({ path: path.join(OUT, "ppm-yoga-avant.png") });
      }
      await p.click("#yoga-commencer");
      planifier();
      await avancer(100);
      let c = await chat();
      if (!reduit) verifier(`${nom} : « ${Y.commencer} » : « ${T.pret} », le chat debout, les yeux ouverts`,
        (await texte("#yoga-nom")) === T.pret && c.posture === "debout" && c.yeux === "ouverts" && dansLeCadre(c.boite) && (await cache("yoga-avant")), JSON.stringify(c));

      // Chaque posture : le nom, le chat qui la prend, puis les yeux fermés et le souffle.
      await avancer(RYTHME.pret);
      for (let i = 0; i < Y.postures.length; i++) {
        const po = Y.postures[i], cible = POSTURES[po.id].j.tete;
        await avancer(60);
        c = await chat();
        if (i === 1) {
          // Entre l'arbre et le dos rond, la tête change de place : on voit s'il glisse ou s'il saute.
          if (reduit) verifier(`${nom} : il prend la posture tout de suite, sans glisser`, pres(c.tete, cible), JSON.stringify(c.tete));
          else verifier(`${nom} : il glisse d'une posture à l'autre (au début, il n'est pas encore arrivé)`,
            !pres(c.tete, cible) && c.yeux === "ouverts" && dansLeCadre(c.boite), JSON.stringify(c.tete) + " vers " + JSON.stringify(cible));
        }
        await avancer(RYTHME.change - 60 + 200);
        c = await chat();
        const rond = await p.$eval("#yoga-souffle", (r) => r.classList.contains("grand"));
        if (!reduit) verifier(`${nom} : « ${po.nom} » : le chat y est, dans son cadre, les yeux fermés, le rond grossit`,
          (await texte("#yoga-nom")) === po.nom && c.posture === po.id && pres(c.tete, cible) && dansLeCadre(c.boite) && c.yeux === "fermes" && rond,
          JSON.stringify(c) + " rond " + rond);
        if (i === 0 && !reduit) {
          const lu = await p.evaluate(() => ({ mots: document.getElementById("yoga-pendant").innerText.split(/\s+/).filter(Boolean).length,
            boutons: [...document.querySelectorAll("#yoga button")].filter((b) => b.offsetParent && !b.classList.contains("retour")).length }));
          verifier(`${nom} : pendant l'exercice, 12 mots au plus à lire et rien à toucher`, lu.mots <= 12 && lu.boutons === 0, JSON.stringify(lu));
          await tient("petit yoga, pendant");
        }
        if (i === 1 && !reduit && h === 732) { await p.waitForTimeout(300); await p.screenshot({ path: path.join(OUT, "ppm-yoga-pendant.png") }); }
        await avancer(RYTHME.inspire);
        if (i === 0 && !reduit) verifier(`${nom} : après ${RYTHME.inspire / 1000} s, le rond rétrécit (on souffle)`, !(await p.$eval("#yoga-souffle", (r) => r.classList.contains("grand"))));
        await avancer(RESPIRATION - RYTHME.inspire - 200);
        if (i === 0 && !reduit) verifier(`${nom} : une respiration faite, un point plein`, (await p.$$("#points-yoga i.fait")).length === 1);
        await avancer(POSE - RYTHME.change - RESPIRATION);
      }
      await avancer(RYTHME.change);
      c = await chat();
      if (!reduit) {
        verifier(`${nom} : après les ${Y.postures.length} postures, « ${T.bravo} », le chat se relève, les deux boutons de fin`,
          (await texte("#yoga-nom")) === T.bravo && c.posture === "debout" && c.yeux === "ouverts" && (await p.$$("#fin-yoga button")).length === 2
          && (await p.$$("#yoga-suite i.fait")).length === Y.postures.length, JSON.stringify(c));
        await tient("petit yoga, fin");
        await p.locator("#fin-yoga button").first().click();
        planifier();
        await avancer(100);
        verifier(`${nom} : « ${T.encore} » recommence au début`, (await texte("#yoga-nom")) === T.pret && (await p.$$("#fin-yoga button")).length === 0 && (await p.$$("#yoga-suite i.fait")).length === 0);
        // Quitté en cours : tout s'arrête, rien ne s'écrit en cachette.
        await avancer(RYTHME.pret + RYTHME.change + 500);
        await p.click("#yoga .retour");
        await avancer(60000);
        verifier(`${nom} : quitté en cours, il s'arrête : le nom ne change plus, plus rien ne tourne`,
          (await visible("accueil")) && (await texte("#yoga-nom")) === Y.postures[0].nom && (await p.evaluate(() => window.ppm.yoga())) === null);
        await p.click('#outils .outil[data-outil="yoga"]');
        verifier(`${nom} : rouvert, on revoit d'abord les postures`, !(await cache("yoga-avant")) && (await cache("yoga-pendant")));
      }
      verifier(`${nom} : aucune erreur`, erreurs.length === 0, erreurs.join(" | "));
    } catch (e) { verifier(`${nom} : le parcours va jusqu'au bout`, false, e.message.split(/\r?\n/)[0]); }
    await ctx.close();
  }
}

/* 11 bis. « Mes petits pas » : l'adulte construit l'escalier derrière le calcul, l'enfant
   affronte une étape à la fois. Une étape compte même si Minus n'a pas rapetissé, c'est LUI
   qui décide de monter après 3 fois, les trucs viennent avant et jamais pendant, « trop dur »
   glisse une étape plus petite. Vrais délais (pas d'horloge simulée) : la fée glisse en CSS. */
for (const h of [732, 640]) {
  const { ctx, p, erreurs } = await contexte({ serviceWorkers: "block", viewport: { width: 360, height: h } });
  try {
    await p.goto(URL_JEU);
    await pret(p);
    await p.evaluate(() => document.fonts.ready);
    const { visible, texte, tient } = outilsDe(p, h);
    const P = contenu.pas, FOIS = 3;
    const attendre = (id) => p.waitForFunction((id) => !document.getElementById(id).hidden, id, { timeout: 4000 });
    const esc = () => p.evaluate(() => window.ppm.etat().escalier);
    const passer = async () => {
      const r = await p.$eval("#barriere-question", (q) => Number(q.dataset.a) * Number(q.dataset.b) + Number(q.dataset.c));
      await p.fill("#barriere-reponse", String(r));
      await p.click("#barriere-valider");
    };
    const lignes = () => p.$$eval("#liste-etapes .etape-champ", (l) => l.map((i) => i.value));
    const ecrireEtape = async (mots, taille) => {
      const avant = (await lignes()).length;
      await p.click("#etape-ajouter");
      await p.waitForFunction((n) => document.querySelectorAll("#liste-etapes li").length === n, avant + 1);
      await p.locator("#liste-etapes .etape-champ").last().fill(mots);
      if (taille != null) {
        await p.locator("#liste-etapes li").last().locator(".taille").nth(taille).click();
        await p.waitForFunction(([m, k]) => [...document.querySelectorAll("#liste-etapes li")].some((li) =>
          li.querySelector(".etape-champ").value === m && li.querySelectorAll(".taille")[k].getAttribute("aria-pressed") === "true"), [mots, taille]);
        await p.waitForTimeout(80);
      }
    };
    const feeSur = (i) => p.evaluate((i) => {
      const f = document.querySelector("#escalier-fee").getBoundingClientRect(), m = document.querySelectorAll("#marches .marche")[i].getBoundingClientRect();
      return { dx: Math.round((f.left + f.right) / 2 - (m.left + m.right) / 2), dy: Math.round(f.bottom - m.top), haut: Math.round(f.top) };
    }, i);
    const surMarche = (m) => Math.abs(m.dx) <= 2 && m.dy >= -2 && m.dy <= 8 && m.haut >= 0;
    // Un passage complet : avant, (sans truc), pendant, après, bravo, retour à l'escalier.
    const affronter = async (avant, apres, depart = "#pas-principal") => {
      await p.click(depart);
      await attendre("pas-avant");
      await p.locator("#jauge-avant .cran").nth(avant).click();
      await attendre("pas-trucs");
      await p.click("#trucs-pret");
      await p.click("#pendant-fait");
      await p.locator("#jauge-apres .cran").nth(apres).click();
      await attendre("pas-bravo");
      await p.click("#bravo-bouton");
      await attendre("pas");
    };

    // L'accueil : huit tuiles, deux par rangée, toutes de la même taille.
    const tuiles = await p.$$eval("#outils .outil", (bs) => bs.map((b) => { const r = b.getBoundingClientRect(); return Math.round(r.width) + "x" + Math.round(r.height); }));
    verifier(`${h} px · l'accueil : huit tuiles de la même taille, « ${P.titre} » en fait partie`,
      tuiles.length === 8 && new Set(tuiles).size === 1 && (await texte('#outils .outil[data-outil="pas"]')) === P.titre, [...new Set(tuiles)].join(" / "));
    await p.click('#outils .outil[data-outil="pas"]');
    verifier(`${h} px · petits pas : sans escalier, on dit qu'il se construit avec un grand`,
      (await visible("pas")) && !(await p.$eval("#pas-vide", (e) => e.hidden)) && (await p.$eval("#pas-plein", (e) => e.hidden)) && (await texte("#pas-vide .pas-grand")) === P.vide);
    await tient("petits pas, sans escalier");

    // L'adulte : le calcul, puis « Construire ».
    await p.click("#pas-vers-grands");
    verifier(`${h} px · petits pas : « ${P.avecUnGrand} » mène au calcul, pas à l'escalier`, (await visible("mes-minus")) && !(await p.$eval("#barriere", (e) => e.hidden)));
    await passer();
    verifier(`${h} px · venu de l'escalier : après le calcul, droit sur « ${P.construire.titre} », sans passer par la liste des peurs`,
      (await visible("construire")) && !(await visible("mes-minus")) && !(await visible("themes")) && (await p.$$("#construire-conseils p")).length === P.construire.conseils.length);
    await p.fill("#champ-peur", "Le noir");
    await p.fill("#champ-objectif", "dormir dans le noir");
    const LONGUE = "La veilleuse seulement, la porte presque fermée, cinq minutes de suite".slice(0, 66);
    await ecrireEtape("dormir seul", 3);
    await ecrireEtape("lumière douce", 0);
    await ecrireEtape(LONGUE, 2);
    await ecrireEtape("veilleuse", 1);
    verifier(`${h} px · construire : écrites dans le désordre, les étapes se rangent par la taille de Minus`,
      (await lignes()).join("|") === ["lumière douce", "veilleuse", LONGUE, "dormir seul"].join("|"), (await lignes()).join(" | "));
    verifier(`${h} px · construire : sur un escalier neuf, pas de « ${P.construire.glisser} »`, await p.$eval("#etape-glisser", (b) => b.hidden));
    const mc = await p.evaluate(() => {
      const b = [...document.querySelectorAll("#construire button, #construire input")].filter((x) => x.offsetParent).map((x) => x.getBoundingClientRect());
      const petits = [...document.querySelectorAll("#construire *")].filter((x) => x.offsetParent && [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
        .filter((x) => parseFloat(getComputedStyle(x).fontSize) < 14).length;
      return { cible: Math.round(Math.min(...b.map((r) => Math.min(r.width, r.height)))), large: document.scrollingElement.scrollWidth - innerWidth, petits };
    });
    verifier(`${h} px · construire : cibles de 44 px, rien sous 14 px, pas de défilement de côté`, mc.cible >= 44 && mc.large <= 0 && mc.petits === 0, JSON.stringify(mc));
    await p.click("#etape-ajouter"); // une ligne laissée vide
    await p.waitForFunction(() => document.querySelectorAll("#liste-etapes li").length === 5);
    await p.click("#construire-fini");
    await attendre("pas");
    verifier(`${h} px · « ${P.construire.fini} » ramène à l'escalier, sans repasser par le calcul`, (await visible("pas")) && !(await visible("mes-minus")));
    verifier(`${h} px · l'escalier : 4 marches (la ligne vide n'en est pas une), l'objectif affiché`,
      (await p.$$("#marches .marche")).length === 4 && (await texte("#pas-objectif-texte")) === "dormir dans le noir" && (await esc()).etapes.length === 4);
    const hauteurs = await p.$$eval("#marches .marche", (m) => m.map((x) => Math.round(x.getBoundingClientRect().height)));
    verifier(`${h} px · l'escalier monte : chaque marche plus haute que la précédente`, hauteurs.every((x, i) => i === 0 || x > hauteurs[i - 1] + 10), hauteurs.join(" < "));
    await p.waitForTimeout(700);
    verifier(`${h} px · la fée est posée sur la marche 1`, surMarche(await feeSur(0)), JSON.stringify(await feeSur(0)));
    await tient("l'escalier");
    verifier(`${h} px · la carte : « ${P.etape.replace("{n}", 1)} », rien de fait, et le bouton pour affronter`,
      (await texte("#pas-num")) === P.etape.replace("{n}", 1) && (await texte("#pas-etat")) === P.fait.replace("{n}", 0).replace("{total}", FOIS)
      && (await texte("#pas-phrase")) === "lumière douce" && (await texte("#pas-principal")) === P.affronter && (await texte("#pas-second")) === P.tropDur);
    await p.locator("#marches .marche").nth(2).click();
    verifier(`${h} px · toucher une marche montre son étape (la plus longue tient), sans changer celle à affronter`,
      (await texte("#pas-phrase")) === LONGUE && (await texte("#pas-etat")) === P.plusTard && (await esc()).ici === 0);
    await tient("l'escalier, étape la plus longue");
    if (h === 732) await p.screenshot({ path: path.join(OUT, "ppm-escalier.png") });

    // Un passage, pas à pas.
    await p.click("#pas-principal");
    await attendre("pas-avant");
    await tient("avant l'étape");
    await p.locator("#jauge-avant .cran").nth(3).click();
    await attendre("pas-trucs");
    verifier(`${h} px · les trucs viennent AVANT l'étape : bougie, robot, phrase de courage`,
      (await p.$$eval("#trucs-corps .truc", (b) => b.map((x) => x.textContent.trim()))).join("|") === [titreOutil("bougie"), titreOutil("robot"), P.trucs.phrase].join("|"));
    await tient("les trucs");
    await p.locator("#trucs-corps .truc").nth(2).click();
    verifier(`${h} px · sa phrase de courage : les ${contenu.sos.phrases.length} phrases du SOS`, (await p.$$("#trucs-corps .phrase")).length === contenu.sos.phrases.length);
    await tient("les trucs, choix de la phrase");
    const laPhrase = await p.locator("#trucs-corps .phrase").first().textContent();
    await p.locator("#trucs-corps .phrase").first().click();
    verifier(`${h} px · la phrase choisie s'affiche en grand`, ((await texte("#trucs-corps .citation")) || "").includes(laPhrase));
    await tient("les trucs, la phrase");
    await p.click("#trucs-pret");
    const pendant = await p.evaluate(() => ({ mots: [...document.querySelectorAll("#pas-pendant .pas-grand, #pas-pendant .pas-texte")].map((e) => e.innerText).join(" ").split(/\s+/).filter(Boolean).length,
      trucs: document.querySelectorAll("#pas-pendant .truc, #pas-pendant .phrase, #pas-pendant .citation").length, titre: document.getElementById("pendant-titre").textContent }));
    verifier(`${h} px · pendant l'étape : 12 mots au plus, aucun truc à l'écran`, (await visible("pas-pendant")) && pendant.mots <= 12 && pendant.trucs === 0 && pendant.titre === P.etape.replace("{n}", 1), JSON.stringify(pendant));
    await tient("pendant l'étape");
    await p.click("#pendant-fait");
    await tient("après l'étape");
    await p.locator("#jauge-apres .cran").nth(3).click();
    await attendre("pas-bravo");
    let e = await esc();
    verifier(`${h} px · Minus n'a pas rapetissé : l'étape compte quand même, et on félicite d'être resté`,
      e.etapes[0].fois === 1 && e.traces.length === 1 && e.traces[0].avant === 3 && e.traces[0].apres === 3 && (await texte("#bravo-texte")) === P.bravo.pareil
      && (await texte("#pas-bravo .pas-grand")) === P.bravo.grand, JSON.stringify(e.traces));
    await tient("bravo");
    // Revenir changer sa réponse : une seule fois comptée.
    await p.goBack();
    await attendre("pas-apres");
    await p.locator("#jauge-apres .cran").nth(0).click();
    await attendre("pas-bravo");
    e = await esc();
    await p.waitForFunction(() => document.querySelectorAll("#avant-apres .perso-svg").length === 2);
    const tailles = await p.$$eval("#avant-apres .perso-svg", (s) => s.map((x) => Math.round(x.getBoundingClientRect().width)));
    verifier(`${h} px · changer sa réponse ne compte pas deux fois ; Minus a rapetissé, on le montre et on le dit`,
      e.etapes[0].fois === 1 && e.traces.length === 1 && e.traces[0].apres === 0 && (await texte("#bravo-texte")) === P.bravo.petit && tailles[0] > tailles[1] + 20, `fois ${e.etapes[0].fois}, tailles ${tailles.join(" → ")}`);
    await p.click("#bravo-bouton");
    await attendre("pas");
    verifier(`${h} px · « ${P.bravo.bouton} » ramène à l'escalier : un rond plein, « ${P.fait.replace("{n}", 1).replace("{total}", FOIS)} »`,
      (await p.$$("#marches .marche.ici .ronds i.plein")).length === 1 && (await texte("#pas-etat")) === P.fait.replace("{n}", 1).replace("{total}", FOIS));

    // Avec un truc de la boîte, puis « J'arrête pour aujourd'hui » : rien n'est compté.
    await p.click("#pas-principal");
    await attendre("pas-avant");
    await p.locator("#jauge-avant .cran").nth(1).click();
    await attendre("pas-trucs");
    await p.locator("#trucs-corps .truc").nth(0).click();
    verifier(`${h} px · le truc « ${titreOutil("bougie")} » ouvre la bougie`, await visible("bougie"));
    await p.goBack();
    await attendre("pas-trucs");
    await p.click("#trucs-pret");
    await p.click("#pendant-arreter");
    await attendre("pas");
    verifier(`${h} px · « ${P.pendant.arreter} » ramène à l'escalier (même après un truc), sans rien compter ni reprocher`,
      (await esc()).etapes[0].fois === 1 && (await texte("#pas-principal")) === P.affronter);

    // Trois fois : il PEUT monter, rien ne monte à sa place.
    await affronter(2, 2);
    await affronter(2, 1);
    verifier(`${h} px · après ${FOIS} fois : « ${P.monter} » et « ${P.refaire} », la fée n'a pas bougé`,
      (await texte("#pas-principal")) === P.monter && (await texte("#pas-second")) === P.refaire && (await esc()).ici === 0 && surMarche(await feeSur(0)));
    await affronter(1, 1, "#pas-second");
    verifier(`${h} px · il peut refaire son étape : « ${P.faitPlus.replace("{n}", FOIS + 1)} »`, (await texte("#pas-etat")) === P.faitPlus.replace("{n}", FOIS + 1) && (await esc()).ici === 0);
    await p.click("#pas-principal");
    await p.waitForTimeout(100);
    const enRoute = await feeSur(1);
    await p.waitForTimeout(800);
    verifier(`${h} px · « ${P.monter} » : la fée glisse sur la marche 2, la marche 1 est acquise`,
      (await esc()).ici === 1 && surMarche(await feeSur(1)) && !surMarche(enRoute) && (await p.$$eval("#marches .marche", (m) => m[0].classList.contains("faite") && m[1].classList.contains("ici")))
      && (await texte("#pas-num")) === P.etape.replace("{n}", 2) && (await texte("#pas-principal")) === P.affronter, JSON.stringify({ enRoute, fin: await feeSur(1) }));

    // Trop dur : pas de reproche, et une étape plus petite se glisse avant.
    await p.click("#pas-second");
    verifier(`${h} px · « ${P.tropDur} » : « ${P.dur.grand} »`, (await visible("pas-dur")) && (await texte("#pas-dur .pas-grand")) === P.dur.grand);
    await tient("trop dur");
    await p.click("#dur-garder");
    await attendre("pas");
    await p.click("#pas-second");
    await p.click("#dur-grand");
    await passer();
    await p.waitForFunction(() => document.querySelectorAll("#liste-etapes li").length === 4);
    verifier(`${h} px · construire, escalier commencé : son étape est marquée, « ${P.construire.glisser} » est proposé`,
      !(await p.$eval("#etape-glisser", (b) => b.hidden)) && (await p.$$eval("#liste-etapes li", (l) => l.map((x) => x.classList.contains("courante")).join())) === "false,true,false,false");
    await p.click("#etape-glisser");
    await p.waitForFunction(() => document.querySelectorAll("#liste-etapes li").length === 5);
    verifier(`${h} px · la nouvelle étape arrive juste avant la sienne, prête à écrire`,
      await p.evaluate(() => { const c = [...document.querySelectorAll("#liste-etapes .etape-champ")]; return c[1].value === "" && document.activeElement === c[1] && c[2].value === "veilleuse"; }));
    await p.locator("#liste-etapes .etape-champ").nth(1).fill("veilleuse et couloir");
    await p.click("#construire-fini");
    await attendre("pas");
    e = await esc();
    verifier(`${h} px · de retour : 5 marches, la petite étape est la sienne, l'ancienne l'attend`,
      e.etapes.length === 5 && e.ici === 1 && e.etapes[1].texte === "veilleuse et couloir" && e.etapes[2].texte === "veilleuse" && (await texte("#pas-phrase")) === "veilleuse et couloir");
    await p.waitForTimeout(700);
    verifier(`${h} px · la fée est sur la marche 2 de l'escalier à 5 marches`, surMarche(await feeSur(1)), JSON.stringify(await feeSur(1)));

    // La mémoire, et la barrière.
    await p.reload();
    await pret(p);
    await p.click('#outils .outil[data-outil="pas"]');
    verifier(`${h} px · l'escalier survit au rechargement`, (await p.$$("#marches .marche")).length === 5 && (await texte("#pas-num")) === P.etape.replace("{n}", 2));
    await p.goBack();
    await p.click("#vers-grands");
    await passer();
    await p.click("#vers-construire");
    await p.goBack();
    verifier(`${h} px · retour depuis « Construire » : le menu des grands, sans refaire le calcul`,
      (await visible("mes-minus")) && (await p.$eval("#barriere", (b) => b.hidden)) && !(await p.$eval("#mes-minus-contenu", (b) => b.hidden)));
    await p.goBack();
    await p.goForward();
    await p.goForward();
    await p.waitForTimeout(250);
    verifier(`${h} px · repassé par l'accueil, puis avance d'Android : « Construire » ne s'ouvre pas sans le calcul`,
      !(await visible("construire")) && (await visible("mes-minus")) && !(await p.$eval("#barriere", (b) => b.hidden)));
    await passer();
    await p.click("#vers-construire");
    await p.waitForFunction(() => document.querySelectorAll("#liste-etapes li").length === 5);
    await ecrireEtape("six");
    await ecrireEtape("sept");
    verifier(`${h} px · sept étapes au plus : on ne peut plus en ajouter, et on le dit`,
      (await p.$eval("#etape-ajouter", (b) => b.hidden)) && (await p.$eval("#etape-glisser", (b) => b.hidden)) && !(await p.$eval("#etapes-plein", (b) => b.hidden)));
    await p.click("#construire-fini");
    await p.waitForTimeout(200);
    await p.click('#outils .outil[data-outil="pas"]');
    const large = await p.$$eval("#marches .marche", (m) => Math.round(Math.min(...m.map((x) => x.getBoundingClientRect().width))));
    verifier(`${h} px · à sept marches, chacune reste une cible de 44 px`, (await p.$$("#marches .marche")).length === 7 && large >= 44, large + " px");
    await tient("l'escalier à sept marches");
    await p.goBack();
    await p.click("#vers-grands");
    await passer();
    await p.click("#vers-construire");
    await p.waitForFunction(() => document.querySelectorAll("#liste-etapes li").length === 7);
    await p.locator("#liste-etapes .retirer").last().click();
    await p.waitForFunction(() => document.querySelectorAll("#liste-etapes li").length === 6);
    verifier(`${h} px · retirer une étape : il reste sur la sienne`, (await esc()).etapes.length === 6 && (await esc()).ici === 1);
    await p.click("#construire-vider");
    verifier(`${h} px · « ${P.construire.vider} » demande d'abord confirmation, rien n'est effacé`,
      (await texte("#construire-vider")) === P.construire.viderSur && (await esc()).etapes.length === 6);
    await p.click("#construire-vider");
    await p.waitForFunction(() => document.querySelectorAll("#liste-etapes li").length === 0);
    verifier(`${h} px · « ${P.construire.viderSur} » : l'escalier est vide, les champs aussi`,
      (await esc()).etapes.length === 0 && (await p.inputValue("#champ-peur")) === "" && (await texte("#construire-vider")) === P.construire.vider);
    verifier(`${h} px · petits pas : aucun écran ne parle d'étoiles ni de niveau`, !(await p.evaluate(() => /étoile|niveau \d|diplôme/i.test(document.body.innerText))));
    verifier(`${h} px · petits pas : aucune erreur`, erreurs.length === 0, erreurs.join(" | "));
  } catch (e) { verifier(`${h} px · petits pas : le parcours va jusqu'au bout`, false, e.message.split(/\r?\n/)[0]); }
  await ctx.close();
}

/* 12. L'atelier : Minus rétrécit les pieds au sol ; animations réduites : tout de suite,
   et la bulle garde son rythme par la teinte et le mot. */
for (const reduit of [false, true]) {
  const { ctx, p, erreurs } = await contexte({ serviceWorkers: "block", reducedMotion: reduit ? "reduce" : "no-preference" });
  await p.goto(URL_JEU + "demo.html");
  await p.waitForFunction(() => window.ppmDemo);
  await p.waitForTimeout(700);
  const boite = () => p.evaluate(() => { const r = window.ppmDemo.minus.getBoundingClientRect(); return { bas: r.bottom, haut: r.height }; });
  const avant = await boite();
  await p.click("#plus-petit");
  await p.waitForTimeout(reduit ? 50 : 60);
  const pendant = await boite();
  await p.waitForTimeout(700);
  const apres = await boite();
  const nom = reduit ? "animations réduites" : "animations normales";
  verifier(`${nom} : Minus rétrécit, les pieds au sol`, apres.haut < avant.haut * 0.85 && Math.abs(apres.bas - avant.bas) < 1);
  if (reduit) verifier("animations réduites : la taille change tout de suite", Math.abs(pendant.haut - apres.haut) < 1);
  else verifier("animations normales : la taille change en douceur", pendant.haut > apres.haut + 2);
  const bulle = () => p.evaluate(() => { const b = document.querySelector(".bulle"); return { t: getComputedStyle(b).transform, fond: getComputedStyle(b).backgroundColor, mot: document.querySelector(".mot-bulle").textContent }; });
  const b1 = await bulle();
  await p.waitForTimeout(4300);
  const b2 = await bulle();
  verifier(`${nom} : le mot de la bulle alterne`, b1.mot !== b2.mot);
  if (reduit) verifier("animations réduites : la bulle ne bouge pas, sa teinte change", b1.t === b2.t && b1.fond !== b2.fond);
  else verifier("animations normales : la bulle change de taille", b1.t !== b2.t);
  verifier(`${nom} : aucune erreur`, erreurs.length === 0, erreurs.join(" | "));
  await ctx.close();
}

await navigateur.close();
site.arreter();
const echecs = resultats.filter((r) => !r).length;
console.log(echecs ? `\n${echecs} contrôle(s) en échec sur ${resultats.length}` : `\n${resultats.length} contrôles, tous verts`);
process.exit(echecs ? 1 : 0);
