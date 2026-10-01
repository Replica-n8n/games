import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
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
    await p.clock.runFor(1200 + 100);
    verifier(`${h} px · robot : « ${contenu.robot.robot} » ${contenu.robot.parties[0]}, le robot est là`,
      (await texte("#mot-robot")) === contenu.robot.robot && (await texte("#partie-robot")) === contenu.robot.parties[0]
      && (await p.$eval("#le-robot", (r) => !r.hidden)) && (await p.$eval("#le-spaghetti", (s) => s.hidden)));
    verifier(`${h} px · robot : pendant l'exercice, 12 mots au plus à lire`, (await mots("#robot .scene-outil")) <= 12, String(await mots("#robot .scene-outil")));
    await tient("robot spaghetti");
    await p.waitForTimeout(300);
    if (h === 732) await p.screenshot({ path: path.join(OUT, "ppm-robot.png") });
    await p.clock.runFor(5000);
    verifier(`${h} px · robot : puis « ${contenu.robot.spaghetti} », tout mou`,
      (await texte("#mot-robot")) === contenu.robot.spaghetti && (await p.$eval("#le-spaghetti", (s) => !s.hidden)));
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
    verifier(`${h} px · un seul endroit où lire : les réponses juste sous la bulle de Minus`, lieu.rep - lieu.bulle >= 0 && lieu.rep - lieu.bulle <= 20, `${Math.round(lieu.rep - lieu.bulle)} px`);
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
    await choix.nth(textes.indexOf(bonne)).click();
    await p.waitForTimeout(700);
    verifier(`${h} px · la bonne phrase : Minus rétrécit (affiché), « ${contenu.reponds.ok} »`,
      (await hMinus()) < depart * 0.85 && (await texte("#bulle-minus")) === contenu.reponds.ok, `${Math.round(depart)} → ${Math.round(await hMinus())} px`);
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
    const lignes = p.locator("#liste-themes .theme-ligne");
    verifier(`${h} px · la bonne réponse ouvre les ${sensibles.length} peurs, toutes sur « Non »`,
      (await lignes.count()) === sensibles.length && (await p.$$eval("#liste-themes .opt-choix[aria-pressed=true]", (b) => b.map((x) => x.textContent))).every((x) => x === contenu.mesMinus.non));
    const m = await p.evaluate(() => {
      const opts = [...document.querySelectorAll("#liste-themes .opt-choix, #mes-minus-fini")].map((b) => b.getBoundingClientRect());
      const petits = [...document.querySelectorAll("#mes-minus *")].filter((x) => x.offsetParent && [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
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
    await lignes.nth(iNoir).locator(".opt-choix").nth(1).click();
    await p.click("#mes-minus-fini");
    await p.click('#outils .outil[data-outil="reponds"]');
    const tous2 = await p.evaluate(() => window.ppm.reponds().tous);
    verifier(`${h} px · « Non » les retire`, idsNoir.every((id) => !tous2.includes(id)));
    verifier(`${h} px · « Pour les grands » : aucune erreur`, erreurs.length === 0, erreurs.join(" | "));
  } catch (e) { verifier(`${h} px · « Pour les grands » : le parcours va jusqu'au bout`, false, e.message.split(/\r?\n/)[0]); }
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
