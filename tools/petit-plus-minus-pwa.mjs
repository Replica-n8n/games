import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { servir } from "./serveur.mjs";

/* Banc du socle de petit-plus-minus/ (étape 1), dans Chromium au format Pixel 9.
   Ce qu'il prouve : la page s'affiche avec SES polices et SES textes (contenu.json),
   ne demande rien hors de son dossier, tient dans 732 et 640 px de haut sans texte
   sous 14 px, se relance HORS LIGNE avec un cache identique au dépôt, dit où est
   l'erreur quand contenu.json est cassé, et fait rétrécir Minus les pieds au sol.
   Sortie : une ligne par contrôle, code 1 si un seul échoue. */

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

/* 1. Premier lancement */
{
  const { ctx, p, erreurs, dehors } = await contexte();
  await p.goto(URL_JEU);
  await pret(p);
  await p.evaluate(() => document.fonts.ready);

  const textes = await p.$$eval("[data-texte]", (els) => els.map((e) => [e.dataset.texte, e.textContent]));
  const vides = textes.filter(([, t]) => !t.trim());
  verifier("chaque [data-texte] est rempli depuis contenu.json", vides.length === 0 && textes.length > 0, vides.map((v) => v[0]).join(", "));
  verifier("le titre vient de contenu.json", textes.some(([k, t]) => k === "accueil.titre" && t === contenu.accueil.titre));
  verifier("les deux personnages sont dans l'accueil", (await p.$$("#accueil .arene .perso-svg")).length === 2);

  const polices = await p.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/"/g, "")));
  verifier("Baloo 2 et Nunito sont chargées depuis le dossier", polices.includes("Baloo 2") && polices.includes("Nunito"), polices.join(", "));
  const titrePolice = await p.$eval(".titre-jeu", (e) => getComputedStyle(e).fontFamily);
  verifier("le titre est bien en Baloo 2", titrePolice.startsWith('"Baloo 2"'), titrePolice);

  const petits = await p.evaluate(() => [...document.querySelectorAll("body *")]
    .filter((e) => e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && e.offsetParent !== null)
    .map((e) => [e.textContent.trim().slice(0, 20), parseFloat(getComputedStyle(e).fontSize)]).filter(([, t]) => t < 14));
  verifier("aucun texte visible sous 14 px", petits.length === 0, JSON.stringify(petits));

  for (const h of [732, 640]) {
    await p.setViewportSize({ width: 360, height: h });
    await p.waitForTimeout(100);
    const trop = await p.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
    verifier(`l'accueil tient à 360 × ${h}`, trop <= 0, trop + " px de trop");
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
    const noms = await caches.keys();
    const nom = noms.find((n) => n.startsWith("petit-plus-minus:"));
    const c = await caches.open(nom);
    const out = {};
    for (const f of shell) {
      const r = await c.match(f);
      out[f] = r ? Array.from(new Uint8Array(await r.arrayBuffer())) : null;
    }
    return { noms, nom, out };
  }, SHELL);
  verifier("le cache porte le nom du jeu et de sa version", !!cache.nom && cache.nom.endsWith(":" + VERSION), cache.nom);
  const differents = SHELL.filter((f) => {
    const disque = path.join(JEU, f === "./" ? "index.html" : f);
    const b = cache.out[f];
    return !b || !Buffer.from(b).equals(fs.readFileSync(disque));
  });
  verifier("chaque fichier en cache est identique au dépôt", differents.length === 0, differents.join(", "));

  /* 3. Hors ligne */
  await ctx.setOffline(true);
  await p.reload();
  await pret(p).catch(() => {});
  const horsLigne = await p.evaluate(() => ({
    titre: document.querySelector(".titre-jeu")?.textContent || "",
    persos: document.querySelectorAll("#accueil .arene .perso-svg").length,
  }));
  verifier("le jeu se relance hors ligne, personnages compris", horsLigne.titre.includes(contenu.accueil.titre) && horsLigne.persos === 2, JSON.stringify(horsLigne));
  await ctx.setOffline(false);

  /* Un fichier oublié dans SHELL passe inaperçu en ligne : le service le range au
     vol au premier chargement contrôlé. Mais un téléphone qui installe le jeu et
     passe aussitôt hors ligne ne l'aurait pas. Vu en injectant l'oubli d'un
     personnage : tous les autres contrôles restaient verts. */
  const demandes = [...new Set(site.servis.map((s) => s.rel)
    .filter((r) => r.startsWith("/petit-plus-minus/") && !/\/(sw\.js|demo\.html|js\/demo\.js)$/.test(r))
    .map((r) => "." + r.slice("/petit-plus-minus".length).replace(/^\/index\.html$/, "/index.html")))];
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

/* 4 bis. Le parcours : accueil, météo, SOS, aux deux hauteurs.
   Chaque écran tient sans défiler et son bouton d'action est visible ; le retour
   d'Android ramène à l'écran d'avant ; les respirations suivent la bulle ; Minus est
   montré et prend, à la fin, la taille que l'enfant a choisie. */
for (const h of [732, 640]) {
  const { ctx, p, erreurs } = await contexte({ serviceWorkers: "block", viewport: { width: 360, height: h } });
  await p.clock.install();
  // Un parcours qui déraille (écran absent, bouton introuvable) est un échec NOMMÉ, pas un plantage muet.
  try {
  await p.goto(URL_JEU);
  await pret(p);
  await p.evaluate(() => document.fonts.ready);
  const garde = await p.evaluate(() => window.ppm.garde) + 100;
  const visible = (id) => p.evaluate((id) => { const e = document.getElementById(id); return !!e && !e.hidden; }, id);
  const texte = (s) => p.$eval(s, (e) => e.textContent.trim()).catch(() => null);
  const petits = () => p.evaluate(() => [...document.querySelectorAll("body *")]
    .filter((e) => e.offsetParent !== null && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
    .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 14).map((e) => e.textContent.trim().slice(0, 20)));
  const tient = async (nom, bouton) => {
    const m = await p.evaluate((b) => {
      const el = b && document.querySelector(b);
      return { trop: document.scrollingElement.scrollHeight - innerHeight, bas: el ? el.getBoundingClientRect().bottom : 0 };
    }, bouton);
    const pt = await petits();
    verifier(`${h} px · ${nom} : tient, bouton visible, rien sous 14 px`, m.trop <= 0 && m.bas <= h && pt.length === 0,
      `${m.trop} px de trop, bouton à ${Math.round(m.bas)}${pt.length ? ", petits : " + pt.join(" / ") : ""}`);
  };

  await tient("accueil", "#vers-meteo");
  const styles = await p.evaluate(() => ["vers-calme", "vers-meteo"].map((id) => getComputedStyle(document.getElementById(id)).backgroundColor));
  verifier(`${h} px · « J'ai besoin de calme » est un bouton plein, d'une autre couleur que l'action du jour`,
    styles[0] !== "rgba(0, 0, 0, 0)" && styles[0] !== "rgb(255, 255, 255)" && styles[0] !== styles[1], styles.join(" / "));
  verifier(`${h} px · le bouton du jour dit où il mène`, (await texte("#vers-meteo")) === contenu.accueil.boutonPartir);
  const entr = await p.$eval("#vers-entrainement", (e) => e.getBoundingClientRect().width);
  verifier(`${h} px · « Mes diplômes » (pas encore fait) est caché, « Entraîner » prend la place`,
    (await p.$eval("#vers-diplomes", (e) => e.hidden)) && entr > 300, `${Math.round(entr)} px`);

  await p.click("#vers-meteo");
  verifier(`${h} px · « C'est parti » ouvre la météo`, await visible("meteo"));
  await p.goBack();
  verifier(`${h} px · le retour d'Android ramène à l'accueil`, await visible("accueil") && !(await visible("meteo")));

  await p.click("#vers-meteo");
  const cartes = p.locator("#grille .niveau");
  verifier(`${h} px · 4 niveaux de Minus`, (await cartes.count()) === 4);
  await cartes.nth(0).click();
  verifier(`${h} px · Endormi : message calme et bouton d'entraînement`,
    (await texte("#meteo-message")) === contenu.meteo.messageCalme && (await texte("#meteo-suite")) === contenu.meteo.boutonEntrainement);
  await p.click("#meteo-suite");
  verifier(`${h} px · Endormi : « S'entraîner » ouvre l'entraînement`, await visible("entrainement"));
  await p.goBack();
  await cartes.nth(3).click();
  const presse = await cartes.evaluateAll((cs) => cs.map((c) => c.getAttribute("aria-pressed")));
  verifier(`${h} px · Énorme : une seule carte choisie, message SOS`,
    presse.join() === "false,false,false,true" && (await texte("#meteo-message")) === contenu.meteo.messageSos);
  await tient("météo, Énorme choisi", "#meteo-suite");
  // Vu à 640 px : les cornes du Minus « Énorme » sortaient de sa carte.
  const debords = await cartes.evaluateAll((cs) => cs.filter((c) => {
    const s = c.querySelector(".perso-svg").getBoundingClientRect(), b = c.getBoundingClientRect();
    return s.top < b.top + 2 || s.left < b.left || s.right > b.right;
  }).length);
  verifier(`${h} px · chaque Minus tient dans sa carte`, debords === 0, debords + " carte(s)");
  if (h === 640) await p.screenshot({ path: path.join(OUT, "ppm-meteo-640.png") });

  await p.click("#meteo-suite");
  verifier(`${h} px · « SOS Minus » ouvre le SOS`, await visible("sos"));
  // Les respirations suivent la bulle (8 s chacune) : l'horloge simulée avance à notre place.
  const CYCLE = 8000, N = contenu.sos.respirations;
  const faites = () => p.$$eval("#sos-corps .points i.fait", (x) => x.length);
  const boutons = () => p.$$eval("#sos-actions button", (x) => x.length);
  await p.clock.runFor(300);
  await tient("SOS, respiration", null);
  await p.clock.runFor(CYCLE);
  verifier(`${h} px · lecteur d'écran : « ${contenu.sos.souffle.compteUne.replace("{n}", "1").replace("{total}", N)} », au singulier`,
    (await p.$eval("#sos-corps .pour-lecteur", (e) => e.textContent)) === contenu.sos.souffle.compteUne.replace("{n}", "1").replace("{total}", String(N)));
  await p.clock.runFor(CYCLE * (N - 2));
  verifier(`${h} px · la bulle compte seule, et rien à appuyer avant la dernière respiration`,
    (await faites()) === N - 1 && (await boutons()) === 0, `${await faites()} faites, ${await boutons()} bouton(s)`);
  await p.clock.runFor(CYCLE);
  verifier(`${h} px · après ${N} respirations, « ${contenu.sos.souffle.boutonSuite} » apparaît`,
    (await faites()) === N && (await texte("#sos-actions .btn")) === contenu.sos.souffle.boutonSuite);
  if (h === 732) await p.screenshot({ path: path.join(OUT, "ppm-sos-souffle.png") });
  await p.click("#sos-actions .btn");
  verifier(`${h} px · un appui dès son apparition est ignoré (il peut arriver sous le doigt)`, !!(await p.$("#sos-corps .zone-bulle")));
  await p.clock.runFor(CYCLE * 2);
  verifier(`${h} px · la bulle continue sans dépasser ${N}`, (await faites()) === N);
  await p.click("#sos-actions .btn");
  const phrases = p.locator("#sos-actions .phrase");
  verifier(`${h} px · les phrases magiques`, (await phrases.count()) === contenu.sos.phrases.length);
  const hautChoix = await phrases.first().evaluate((e) => e.getBoundingClientRect().top);
  verifier(`${h} px · les phrases sont sous le pouce`, hautChoix >= h / 3, `première à ${Math.round(hautChoix)} px`);
  await tient("SOS, choix de la phrase", null);
  // Retour Android depuis le choix : la respiration revient FAITE (3 sur 3), bouton compris.
  await p.goBack();
  await p.waitForTimeout(100);
  await p.clock.runFor(garde);
  verifier(`${h} px · retour depuis le choix : les ${N} respirations restent faites, le bouton est là`,
    (await faites()) === N && (await texte("#sos-actions .btn")) === contenu.sos.souffle.boutonSuite, `${await faites()} faites`);
  await p.click("#sos-actions .btn");
  await p.clock.runFor(garde);
  await phrases.nth(1).click();
  const attendue = contenu.paires.find((x) => x.id === contenu.sos.phrases[1]).phrase;
  verifier(`${h} px · la phrase choisie est affichée, avec Petit Plus et Minus`,
    ((await texte(".citation")) || "").includes(attendue) && (await p.$$("#sos-corps .scene-sos .perso-svg")).length === 2);
  // Le geste de retour d'Android remonte d'UNE étape, il n'efface plus tout le SOS.
  await p.goBack();
  await p.waitForTimeout(100);
  verifier(`${h} px · retour Android en plein SOS : on revient au choix de la phrase, pas à la météo`,
    (await visible("sos")) && (await p.$$("#sos-actions .phrase")).length === contenu.sos.phrases.length);
  await p.clock.runFor(garde);
  await p.locator("#sos-actions .phrase").nth(1).click();
  await tient("SOS, dire la phrase", "#sos-actions .btn");
  await p.clock.runFor(garde);
  await p.click("#sos-actions .btn");
  const reps = await p.$$eval("#sos-actions .rep", (rs) => rs.map((r) => ({
    e: parseFloat(r.querySelector(".perso-svg").style.getPropertyValue("--echelle")), c: getComputedStyle(r).borderTopColor })));
  verifier(`${h} px · « a-t-il rétréci ? » montre Minus, et chaque réponse porte un Minus de sa taille`,
    (await p.$$("#sos-corps .scene-sos")).length === 1 && reps.length === 3 && reps[0].e < reps[1].e && reps[1].e < reps[2].e,
    JSON.stringify(reps.map((r) => r.e)));
  verifier(`${h} px · les trois réponses ont la même couleur`, new Set(reps.map((r) => r.c)).size === 1, reps.map((r) => r.c).join(" / "));
  const hautRep = await p.$eval("#sos-actions .rep", (e) => e.getBoundingClientRect().top);
  verifier(`${h} px · les réponses sont sous le pouce`, hautRep >= h / 3, `première à ${Math.round(hautRep)} px`);
  await tient("SOS, Minus a-t-il rétréci", null);
  /* On mesure la taille AFFICHÉE, pas la valeur demandée : une première version du
     banc vérifiait --echelle, restait verte, et la capture montrait un Minus intact. */
  const hauteurMinus = () => p.$eval("#sos-corps .scene-minus .perso-svg", (s) => s.getBoundingClientRect().height);
  const avantFin = await hauteurMinus();
  await p.clock.runFor(garde);
  await p.click(".rep-unPeu");
  await p.clock.runFor(100);
  await p.waitForTimeout(800); // la transition CSS suit l'horloge réelle
  const rapport = (await hauteurMinus()) / avantFin;
  verifier(`${h} px · « Un peu » : Minus prend la taille choisie par l'enfant (affichée)`, Math.abs(rapport - 0.75) < 0.03, rapport.toFixed(3));
  const traceSos = await p.evaluate(() => window.ppm.etat().sos.at(-1));
  verifier(`${h} px · la fin du SOS est notée en silence (venu de la météo, « un peu »)`,
    traceSos && traceSos.depuis === "meteo" && traceSos.reponse === "unPeu", JSON.stringify(traceSos));
  verifier(`${h} px · « Un peu » : la fin propose un souffle ou le retour`,
    (await texte("#sos-corps .sos-titre")) === contenu.sos.fins.unPeu.titre && (await boutons()) === 2);
  verifier(`${h} px · « Un peu » : le rappel de l'adulte reste entier`, (await texte("#rappel-adulte")) === contenu.sos.rappelAdulte);
  verifier(`${h} px · la fin rend la phrase de courage choisie`, ((await texte("#sos-corps .fin-phrase-texte")) || "").includes(attendue));
  await tient("SOS, fin", "#sos-actions .btn2");
  if (h === 732) await p.screenshot({ path: path.join(OUT, "ppm-sos-fin.png") });
  // Revenir changer sa réponse dans le MÊME SOS remplace la trace, n'en ajoute pas une.
  const nbTraces = await p.evaluate(() => window.ppm.etat().sos.length);
  await p.goBack();
  await p.waitForTimeout(100);
  await p.clock.runFor(garde);
  await p.click(".rep-non");
  await p.clock.runFor(100);
  const apresNon = await p.evaluate(() => ({ n: window.ppm.etat().sos.length, r: window.ppm.etat().sos.at(-1).reponse }));
  verifier(`${h} px · changer sa réponse dans le même SOS remplace la trace`, apresNon.n === nbTraces && apresNon.r === "non", JSON.stringify(apresNon));
  const echellePlus = await p.$eval("#sos-corps .scene-plus .perso-svg", (s) => parseFloat(s.style.getPropertyValue("--echelle")) || 1);
  verifier(`${h} px · « Non » : Petit Plus grandit près de Minus, rappel court`,
    echellePlus > 1 && (await p.$$("#sos-corps .scene-proche")).length === 1 && (await texte("#rappel-adulte")) === contenu.sos.rappelAdulteCourt);
  await tient("SOS, fin « Non »", "#sos-actions .btn");
  await p.clock.runFor(garde);
  await p.click("#sos-actions .btn");
  await p.waitForTimeout(150);
  verifier(`${h} px · « Refaire un souffle » repart à zéro`,
    (await p.$$("#sos-corps .zone-bulle")).length === 1 && (await faites()) === 0 && (await boutons()) === 0);
  // Après « Refaire », le retour ne remonte plus l'ancien SOS fini : il sort vers la météo.
  await p.goBack();
  await p.waitForTimeout(150);
  verifier(`${h} px · après « Refaire », le retour ne remonte pas l'ancien SOS`, (await visible("meteo")) && !(await visible("sos")));
  await p.goForward();
  await p.waitForTimeout(150);
  await p.click("#sos-retour");
  await p.waitForTimeout(150);
  const garde4 = await p.$$eval("#grille .niveau", (cs) => cs.map((c) => c.getAttribute("aria-pressed")).join());
  verifier(`${h} px · « Retour » quitte tout le SOS et ramène à la météo, le choix gardé`,
    (await visible("meteo")) && garde4 === "false,false,false,true", garde4);

  await p.goBack();
  await p.click("#vers-calme");
  verifier(`${h} px · « J'ai besoin de calme » ouvre le SOS en un appui`, await visible("sos"));
  await p.clock.runFor(CYCLE * N + 300);
  await p.clock.runFor(garde); await p.click("#sos-actions .btn");
  await p.clock.runFor(garde); await p.locator("#sos-actions .phrase").first().click();
  await p.clock.runFor(garde); await p.click("#sos-actions .btn");
  await p.clock.runFor(garde);
  const avantOui = await p.$eval("#sos-corps .scene-minus .perso-svg", (s) => s.getBoundingClientRect().height);
  await p.click(".rep-oui");
  await p.clock.runFor(100);
  await p.waitForTimeout(800);
  const rapportOui = (await p.$eval("#sos-corps .scene-minus .perso-svg", (s) => s.getBoundingClientRect().height)) / avantOui;
  verifier(`${h} px · « Oui » : Minus devient deux fois plus petit (affiché)`, Math.abs(rapportOui - 0.5) < 0.03, rapportOui.toFixed(3));
  verifier(`${h} px · « Oui » : pas de « Refaire », seulement le retour`, (await boutons()) === 1);
  const traceCalme = await p.evaluate(() => window.ppm.etat().sos.at(-1));
  verifier(`${h} px · SOS par « J'ai besoin de calme » : noté « calme », « oui »`, traceCalme && traceCalme.depuis === "calme" && traceCalme.reponse === "oui");
  verifier(`${h} px · « Oui » : le rappel ne dit plus « Minus est gros aujourd'hui »`, (await texte("#rappel-adulte")) === contenu.sos.rappelAdulteCourt);
  if (h === 732) await p.screenshot({ path: path.join(OUT, "ppm-sos-oui.png") });
  await p.clock.runFor(garde);
  await p.click("#sos-actions .btn2");
  await p.clock.runFor(300);
  verifier(`${h} px · « Retour à l'accueil » ramène à l'accueil`, await visible("accueil"));
  verifier(`${h} px · aucune erreur dans la console`, erreurs.length === 0, erreurs.join(" | "));
  } catch (e) {
    verifier(`${h} px · le parcours va jusqu'au bout`, false, e.message.split(/\r?\n/)[0]);
  }
  await ctx.close();
}

/* 4 ter. La mémoire : la météo confirmée est notée, survit au rechargement, le SOS
   direct ne note rien, les clés des autres jeux (même origine) ne sont pas touchées,
   et un navigateur qui refuse de stocker n'empêche pas d'aller au SOS. */
{
  const { ctx, p, erreurs } = await contexte({ serviceWorkers: "block" });
  try {
    await p.addInitScript(() => { if (!localStorage.getItem("chevalier:score")) localStorage.setItem("chevalier:score", "99"); });
    await p.goto(URL_JEU);
    await pret(p);
    const lu = () => p.evaluate(() => JSON.parse(localStorage.getItem("ppm:donnees") || "null"));
    await p.click("#vers-meteo");
    await p.locator("#grille .niveau").nth(1).click();
    await p.locator("#grille .niveau").nth(3).click();
    verifier("mémoire : rien n'est noté tant que l'enfant n'a pas confirmé", (await lu()) === null);
    await p.click("#meteo-suite");
    let d = await lu();
    verifier("mémoire : la météo confirmée est notée (Énorme seulement)", d && d.meteo.length === 1 && d.meteo[0].niveau === "enorme" && Math.abs(d.meteo[0].t - Date.now()) < 60000, JSON.stringify(d && d.meteo));
    await p.reload();
    await pret(p);
    verifier("mémoire : elle survit au rechargement", (await p.evaluate(() => window.ppm.etat().meteo.length)) === 1);
    await p.click("#vers-calme");
    verifier("mémoire : « J'ai besoin de calme » ne note rien", (await lu()).meteo.length === 1);
    const cles = await p.evaluate(() => Object.keys(localStorage).sort());
    verifier("mémoire : une seule clé à nous, celle du voisin intacte",
      cles.join() === "chevalier:score,ppm:donnees" && (await p.evaluate(() => localStorage.getItem("chevalier:score"))) === "99", cles.join());
    verifier("mémoire : aucune erreur dans la console", erreurs.length === 0, erreurs.join(" | "));
  } catch (e) { verifier("mémoire : le parcours va jusqu'au bout", false, e.message.split(/\r?\n/)[0]); }
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
    await p.click("#vers-meteo");
    await p.locator("#grille .niveau").nth(3).click();
    await p.click("#meteo-suite");
    verifier("stockage refusé : le SOS s'ouvre quand même", await p.evaluate(() => !document.getElementById("sos").hidden));
    verifier("stockage refusé : aucune erreur", erreurs.length === 0, erreurs.join(" | "));
  } catch (e) { verifier("stockage refusé : le parcours va jusqu'au bout", false, e.message.split(/\r?\n/)[0]); }
  await ctx.close();
}

/* 4 quater. L'entraînement : le niveau, les trois jeux, les étoiles et leur plafond.
   Horloge simulée pour la bulle (8 s par respiration) et le mémo (1,4 s de verrou). */
for (const h of [732, 640]) {
  const { ctx, p, erreurs } = await contexte({ serviceWorkers: "block", viewport: { width: 360, height: h } });
  await p.clock.install({ time: new Date(2026, 8, 25, 10, 0) });
  try {
    await p.goto(URL_JEU);
    await pret(p);
    await p.evaluate(() => document.fonts.ready);
    const J = contenu.jeux;
    const visible = (id) => p.evaluate((id) => { const e = document.getElementById(id); return !!e && !e.hidden; }, id);
    const texte = (s) => p.$eval(s, (e) => e.textContent.trim()).catch(() => null);
    const etoiles = () => p.evaluate(() => window.ppm.etat().etoiles);
    const tient = async (nom) => {
      const m = await p.evaluate(() => {
        const e = [...document.querySelectorAll(".ecran")].find((x) => !x.hidden);
        const b = [...e.querySelectorAll(".jeu-actions button, .btn")].filter((x) => x.offsetParent).map((x) => x.getBoundingClientRect().bottom);
        const petits = [...e.querySelectorAll("*")].filter((x) => x.offsetParent !== null && [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
          .filter((x) => parseFloat(getComputedStyle(x).fontSize) < 14).map((x) => x.textContent.trim().slice(0, 16));
        return { trop: document.scrollingElement.scrollHeight - innerHeight, bas: Math.max(0, ...b), petits };
      });
      verifier(`${h} px · ${nom} : tient, boutons visibles, rien sous 14 px`, m.trop <= 0 && m.bas <= h && m.petits.length === 0,
        `${m.trop} px de trop, bouton le plus bas à ${Math.round(m.bas)}${m.petits.length ? ", petits : " + m.petits.join(" / ") : ""}`);
    };
    const attendre = (ms) => p.clock.runFor(ms);

    await p.click("#vers-entrainement");
    verifier(`${h} px · l'entraînement : niveau 1, trois jeux jouables`,
      (await texte("#niveau-nom")) === J.hub.niveau.replace("{n}", "1") && (await p.$$(".carte-jeu")).length === 3,
      `${await texte("#niveau-nom")}, ${(await p.$$(".carte-jeu")).length} jeux`);
    const feeNiv1 = await p.$eval(".niveau-plus .perso-svg", (s) => parseFloat(s.style.getPropertyValue("--echelle")));
    verifier(`${h} px · niveau 1 : « +1 de force », la fée encore petite`, (await texte("#niveau-force")) === contenu.jeux.hub.force.replace("{n}", "1") && feeNiv1 < 0.75, String(feeNiv1));
    verifier(`${h} px · « 0 étoile » au singulier`, (await texte("#niveau-texte")) === J.hub.progressionUne.replace("{k}", "0").replace("{total}", "10").replace("{suivant}", "2"), await texte("#niveau-texte"));
    await tient("entraînement");

    // Souffle magique
    await p.click(".jeu-souffle");
    verifier(`${h} px · le Souffle magique s'ouvre`, await visible("souffle"));
    await attendre(300);
    await tient("Souffle magique");
    await attendre(8000 * 2);
    verifier(`${h} px · Souffle : pas de récompense avant la 3e respiration`, (await p.$$("#souffle .recompense")).length === 0 && (await etoiles()) === 0);
    await attendre(8000);
    verifier(`${h} px · Souffle fini : la bulle ne dit plus « Inspire »`, await p.$eval("#souffle .mot-bulle", (m) => m.hidden || !m.offsetParent));
    verifier(`${h} px · Souffle : 3 respirations, +1 étoile`,
      (await p.$$("#souffle .points i.fait")).length === 3 && (await texte("#souffle .recompense")) === J.etoile && (await etoiles()) === 1);
    await tient("Souffle magique fini");
    if (h === 732) await p.screenshot({ path: path.join(OUT, "ppm-souffle-fin.png") });
    await attendre(500);
    await p.click("#souffle-actions .btn");
    verifier(`${h} px · « Retour à l'entraînement » y ramène, 1 étoile comptée`,
      (await visible("entrainement")) && (await texte("#niveau-texte")) === J.hub.progressionUne.replace("{k}", "1").replace("{total}", "10").replace("{suivant}", "2"), await texte("#niveau-texte"));

    // Chasse aux trésors
    await p.click(".jeu-tresors");
    verifier(`${h} px · la chasse aux trésors s'ouvre`, await visible("tresors"));
    await tient("trésors, 1re étape");
    await p.waitForTimeout(300); // le fondu d'apparition de l'écran suit l'horloge réelle
    if (h === 640) await p.screenshot({ path: path.join(OUT, "ppm-tresors-640.png") });
    for (const [k, etape] of contenu.tresors.entries()) {
      const gemmes = p.locator("#tresors-corps .gemme");
      if ((await gemmes.count()) !== etape.n) { verifier(`${h} px · trésors, étape ${k + 1} : ${etape.n} gemmes`, false, String(await gemmes.count())); break; }
      for (let i = 0; i < etape.n; i++) await gemmes.nth(i).click();
      await gemmes.nth(0).click();
      if (k === 0) verifier(`${h} px · trésors : une gemme de trop ne compte pas, le bouton suit`,
        (await p.$$("#tresors-corps .gemme.trouvee")).length === 5 && (await texte("#tresors-actions .btn")) === J.tresors.suivant);
      await p.click("#tresors-actions .btn");
      if (k === 0) verifier(`${h} px · trésors : un appui juste après l'apparition du bouton est ignoré`, (await p.$$("#tresors-corps .gemme")).length === 5);
      await attendre(450);
      await p.click("#tresors-actions .btn");
    }
    await p.waitForSelector("#tresors .recompense", { timeout: 3000 });
    verifier(`${h} px · trésors : 15 trésors, +1 étoile`,
      (await texte("#tresors-corps .tresor-titre")) === J.tresors.finTitre.replace("{total}", "15") && (await etoiles()) === 2);
    await tient("trésors, fin");
    await attendre(450);
    await p.click("#tresors-actions .btn");

    // Mémo
    await p.click(".jeu-memo");
    verifier(`${h} px · le mémo s'ouvre avec 8 cartes cachées`, (await p.$$("#memo-grille .carte:not(.minus):not(.plus)")).length === 8);
    await tient("mémo");
    const cartes = await p.evaluate(() => window.ppm.memo().cartes);
    const autre = cartes.findIndex((c) => c.paire !== cartes[0].paire);
    await p.locator("#memo-grille .carte").nth(0).click();
    await p.locator("#memo-grille .carte").nth(autre).click();
    verifier(`${h} px · mémo : deux cartes différentes, le message encourage`, (await texte("#memo-message")) === J.memo.rate);
    await p.locator("#memo-grille .carte").nth(3).click();
    verifier(`${h} px · mémo : rien ne s'ouvre pendant le verrou`, (await p.$$("#memo-grille .carte.minus, #memo-grille .carte.plus")).length === 2);
    await attendre(1500);
    verifier(`${h} px · mémo : elles se referment`, (await p.$$("#memo-grille .carte.minus, #memo-grille .carte.plus")).length === 0);
    const jouerTout = async () => {
      const cs = await p.evaluate(() => window.ppm.memo().cartes);
      for (const id of [...new Set(cs.map((c) => c.paire))]) {
        const [i, j] = cs.map((c, k) => (c.paire === id ? k : -1)).filter((k) => k >= 0);
        await p.locator("#memo-grille .carte").nth(i).click();
        await p.locator("#memo-grille .carte").nth(j).click();
      }
    };
    await jouerTout();
    verifier(`${h} px · mémo gagné : « ${J.memo.gagne.slice(0, 30)}… », +2 étoiles`,
      (await texte("#memo-message")) === J.memo.gagne && (await texte("#memo .recompense")) === J.etoiles.replace("{n}", "2") && (await etoiles()) === 4);
    await tient("mémo gagné");
    if (h === 732) await p.screenshot({ path: path.join(OUT, "ppm-memo-gagne.png") });

    // Plafond du jour : plus de « Rejouer » sous « à demain », un seul retour.
    verifier(`${h} px · plafond atteint : la fin ne propose plus « Rejouer »`,
      (await p.$$("#memo-actions button")).length === 1 && (await p.$$("#memo-actions .btn2")).length === 0);
    await attendre(450);
    await p.click("#memo-actions .btn");
    await p.click(".jeu-memo");
    await jouerTout();
    verifier(`${h} px · au plafond : le jeu reste ouvert, 0 étoile, « à demain »`,
      (await texte("#memo .recompense")) === contenu.limites.messageFinRituel && (await etoiles()) === 4);
    await attendre(450);
    await p.click("#memo-actions .btn");
    verifier(`${h} px · l'entraînement dit « à demain » au plafond, le combat se fait discret`,
      await p.evaluate(() => !document.getElementById("plafond").hidden && document.getElementById("vers-combat").classList.contains("btn-calme")));

    // Le lendemain, les étoiles reviennent
    await p.clock.setSystemTime(new Date(2026, 8, 26, 9, 0));
    await p.click(".jeu-souffle");
    await attendre(8000 * 3 + 300);
    verifier(`${h} px · le lendemain, le Souffle redonne une étoile`, (await etoiles()) === 5);
    verifier(`${h} px · entraînement : aucune erreur dans la console`, erreurs.length === 0, erreurs.join(" | "));
  } catch (e) { verifier(`${h} px · l'entraînement va jusqu'au bout`, false, e.message.split(/\r?\n/)[0]); }
  await ctx.close();
}

/* Passer un niveau : Petit Plus le dit. */
{
  const { ctx, p, erreurs } = await contexte({ serviceWorkers: "block" });
  await p.clock.install({ time: new Date(2026, 8, 25, 10, 0) });
  try {
    await p.addInitScript(() => localStorage.setItem("ppm:donnees", JSON.stringify({ format: 1, etoiles: 9, jeuxDuJour: { jour: "", etoiles: 0 }, meteo: [] })));
    await p.goto(URL_JEU);
    await pret(p);
    await p.click("#vers-entrainement");
    await p.click(".jeu-souffle");
    await p.clock.runFor(8000 * 3 + 300);
    verifier("niveau : « Petit Plus passe au niveau 2 ! »", (await p.$eval("#souffle .niveau-gagne", (e) => e.textContent).catch(() => "")) === contenu.jeux.niveauGagne.replace("{n}", "2"));
    await p.clock.runFor(500);
    await p.click("#souffle-actions .btn");
    verifier("niveau : l'entraînement affiche le niveau 2", (await p.$eval("#niveau-nom", (e) => e.textContent)) === contenu.jeux.hub.niveau.replace("{n}", "2"));
    verifier("niveau : aucune erreur", erreurs.length === 0, erreurs.join(" | "));
  } catch (e) { verifier("niveau : le parcours va jusqu'au bout", false, e.message.split(/\r?\n/)[0]); }
  await ctx.close();
}

/* 4 quinquies. Le combat : le bonus d'entraînement, une réponse qui aide un peu, un appui
   ignoré pendant l'animation, Minus qui rétrécit les pieds au sol sans jamais disparaître,
   puis la victoire. */
for (const h of [732, 640]) {
  const { ctx, p, erreurs } = await contexte({ serviceWorkers: "block", viewport: { width: 360, height: h } });
  await p.clock.install({ time: new Date(2026, 8, 25, 10, 0) });
  try {
    // 25 étoiles : niveau 3, donc Petit Plus commence avec 3 de force.
    await p.addInitScript(() => localStorage.setItem("ppm:donnees", JSON.stringify({ format: 1, etoiles: 25, jeuxDuJour: { jour: "", etoiles: 0 }, meteo: [] })));
    await p.goto(URL_JEU);
    await pret(p);
    await p.evaluate(() => document.fonts.ready);
    const C = contenu.combat, E = C.ecran;
    const visible = (id) => p.evaluate((id) => { const e = document.getElementById(id); return !!e && !e.hidden; }, id);
    const texte = (s) => p.$eval(s, (e) => e.textContent.trim()).catch(() => null);
    const etat = () => p.evaluate(() => window.ppm.combat());
    // Le bas se mesure par rapport à l'arène : c'est le sol.
    const minus = () => p.$eval("#combat .combat-minus .perso-svg", (s) => { const r = s.getBoundingClientRect(); return { h: r.height, bas: s.closest(".arene").getBoundingClientRect().bottom - r.bottom }; });
    const hautChoix = () => p.$eval("#combat-actions .choix-combat", (b) => b.getBoundingClientRect().top);
    const tient = async (nom) => {
      const m = await p.evaluate(() => {
        const e = [...document.querySelectorAll(".ecran")].find((x) => !x.hidden);
        const b = [...e.querySelectorAll("button")].filter((x) => x.offsetParent).map((x) => x.getBoundingClientRect().bottom);
        const petits = [...e.querySelectorAll("*")].filter((x) => x.offsetParent !== null && [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
          .filter((x) => parseFloat(getComputedStyle(x).fontSize) < 14).map((x) => x.textContent.trim().slice(0, 16));
        return { trop: document.scrollingElement.scrollHeight - innerHeight, bas: Math.max(0, ...b), petits };
      });
      verifier(`${h} px · ${nom} : tient, boutons visibles, rien sous 14 px`, m.trop <= 0 && m.bas <= h && m.petits.length === 0,
        `${m.trop} px de trop, bouton le plus bas à ${Math.round(m.bas)}${m.petits.length ? ", petits : " + m.petits.join(" / ") : ""}`);
    };
    const phraseDe = (id) => contenu.paires.find((x) => x.id === id).phrase;
    const choix = p.locator("#combat-actions .choix-combat");
    const cliquerPhrase = async (phrase) => { const n = await choix.count(); for (let i = 0; i < n; i++) if ((await choix.nth(i).textContent()).trim() === phrase) { await choix.nth(i).click(); return true; } return false; };

    await p.click("#vers-entrainement");
    await tient("entraînement avec le bouton du combat");
    const feeNiv3 = await p.$eval(".niveau-plus .perso-svg", (s) => parseFloat(s.style.getPropertyValue("--echelle")));
    verifier(`${h} px · niveau 3 : la force au combat est écrite, la fée a grandi`,
      (await texte("#niveau-force")) === contenu.jeux.hub.force.replace("{n}", "3") && feeNiv3 > 0.85, String(feeNiv3));
    await p.click("#vers-combat");
    verifier(`${h} px · le combat s'ouvre`, await visible("combat"));
    await p.waitForTimeout(300);
    let c = await etat();
    verifier(`${h} px · lecteur d'écran : la pensée de Minus est annoncée`, (await p.$eval("#pensee", (e) => e.getAttribute("aria-live"))) === "polite");
    verifier(`${h} px · niveau 3 : Petit Plus commence avec 3 de force`,
      c.plus === 3 && (await texte("#combat-message")) === C.messages.debut.replace("{bonus}", "3") && (await texte("#force-valeur")) === "3"
      && (await p.$eval("#bloc-plus", (e) => e.getAttribute("aria-label"))) === E.forcePlus + " : " + E.forceValeur.replace("{n}", "3").replace("{max}", "12"));
    const lignes = await p.$$eval("#combat .jauge-ligne", (ls) => ls.map((l) => Math.round(l.getBoundingClientRect().height)));
    verifier(`${h} px · chaque nom de jauge tient sur une ligne`, lignes.every((x) => x <= 22), lignes.join(" / "));
    verifier(`${h} px · 3 phrases proposées, dont la meilleure`, (await choix.count()) === 3);
    await tient("combat");
    if (h === 732) await p.screenshot({ path: path.join(OUT, "ppm-combat.png") });
    /* Rien ne doit sauter quand la pensée ou le message change : sinon les phrases à
       choisir bougent sous le doigt. On essaie TOUTES les pensées et tous les messages
       (l'ordre du combat est tiré au hasard : attendre qu'un saut arrive ne prouve rien). */
    const hauteurs = await p.evaluate(({ pensees, messages }) => {
      const pe = document.getElementById("pensee"), me = document.getElementById("combat-message");
      const [p0, m0] = [pe.textContent, me.textContent];
      const hp = pensees.map((x) => { pe.textContent = x; return pe.getBoundingClientRect().height; });
      const hm = messages.map((x) => { me.textContent = x; return me.getBoundingClientRect().height; });
      pe.textContent = p0; me.textContent = m0;
      return { hp, hm };
    }, {
      pensees: [...contenu.paires.map((x) => E.pensee.replace("{pensee}", x.pensee)), E.finPensee],
      messages: [C.messages.debut.replace("{bonus}", "4"), C.messages.autre, C.messages.victoire,
        ...contenu.paires.map((x) => C.messages.superEfficace.replace("{phrase}", x.phrase))],
    });
    const stable = (l) => Math.max(...l) - Math.min(...l) < 1;
    verifier(`${h} px · la pensée garde la même hauteur, quelle qu'elle soit`, stable(hauteurs.hp), hauteurs.hp.map(Math.round).join(" / "));
    verifier(`${h} px · le message garde la même hauteur, quel qu'il soit`, stable(hauteurs.hm), hauteurs.hm.map(Math.round).join(" / "));
    const depart = await minus();

    // Une autre phrase : elle aide un peu, la même pensée revient.
    const meilleure = phraseDe(c.ordre[c.pensee]);
    const choixAvant = await hautChoix();
    const textes = await choix.allTextContents();
    const autre = textes.map((x) => x.trim()).find((x) => x !== meilleure);
    await cliquerPhrase(autre);
    c = await etat();
    verifier(`${h} px · une autre phrase aide un peu (Minus 9), sans punition`,
      c.minus === 9 && c.pensee === 0 && (await texte("#combat-message")) === C.messages.autre);
    const fondPresque = await p.$eval("#combat-message", (e) => getComputedStyle(e).backgroundColor);
    verifier(`${h} px · « presque » en lilas, pas aux couleurs d'erreur`, fondPresque === "rgb(243, 230, 255)", fondPresque);
    // Pendant l'animation, un appui est ignoré.
    await cliquerPhrase(meilleure);
    verifier(`${h} px · pendant l'animation, un appui ne compte pas`, (await etat()).minus === 9);
    await p.clock.runFor(600);
    await p.waitForTimeout(600);
    verifier(`${h} px · après un « presque », les mêmes choix dans le même ordre`,
      JSON.stringify((await choix.allTextContents()).map((x) => x.trim())) === JSON.stringify(textes.map((x) => x.trim())));
    verifier(`${h} px · au 1er « presque », pas encore d'indice`, (await p.$$("#combat-actions .indice")).length === 0);
    await cliquerPhrase(autre);
    await p.clock.runFor(600);
    await p.waitForTimeout(600);
    verifier(`${h} px · au 2e « presque », l'indice est dit en mots`, (await texte("#combat-message")) === C.messages.indice);
    const indice = await p.$$eval("#combat-actions .indice", (b) => b.map((x) => x.textContent.trim()));
    verifier(`${h} px · au 2e « presque », la meilleure phrase brille (et elle seule)`, indice.length === 1 && indice[0] === meilleure, indice.join(" / "));
    await cliquerPhrase(meilleure);
    c = await etat();
    verifier(`${h} px · la meilleure phrase : super efficace, Minus 5`,
      c.minus === 5 && c.essais === 0 && (await texte("#combat-message")) === C.messages.superEfficace.replace("{phrase}", meilleure));
    await p.waitForTimeout(700);
    const apres = await minus();
    verifier(`${h} px · la pensée change, les phrases ne bougent pas sous le doigt`, Math.abs((await hautChoix()) - choixAvant) < 1, `${choixAvant} → ${await hautChoix()}`);
    verifier(`${h} px · Minus rétrécit (affiché), les pieds au sol`, apres.h < depart.h * 0.85 && Math.abs(apres.bas - depart.bas) < 1,
      `${depart.h.toFixed(0)} → ${apres.h.toFixed(0)} px, bas ${depart.bas.toFixed(1)} → ${apres.bas.toFixed(1)}`);

    for (let k = 0; k < 5 && !(await etat()).minus === false; k++) {
      c = await etat();
      if (c.minus <= 0) break;
      await p.clock.runFor(600);
      await cliquerPhrase(phraseDe(c.ordre[c.pensee]));
    }
    c = await etat();
    await p.waitForTimeout(700);
    const fin = await minus();
    verifier(`${h} px · victoire : Minus minuscule mais toujours là, « Pff… »`,
      c.minus === 0 && fin.h > 5 && fin.h < depart.h * 0.35 && (await texte("#pensee")) === E.finPensee, `${fin.h.toFixed(0)} px`);
    verifier(`${h} px · victoire : le message et « Voir ma victoire »`,
      (await texte("#combat-message")) === C.messages.victoire && (await texte("#combat-actions .btn")) === E.voirVictoire);
    await tient("combat gagné");
    // À la victoire, Petit Plus est à sa taille maximale : sa tête ne doit pas passer sous les jauges.
    const chevauche = await p.evaluate(() => {
      const j = document.querySelector("#combat .jauges").getBoundingClientRect();
      const s = document.querySelector("#combat .combat-plus .perso-svg").getBoundingClientRect();
      return Math.round(j.bottom - s.top);
    });
    verifier(`${h} px · Petit Plus au plus grand ne passe pas sous les jauges`, (await etat()).plus === 12 && chevauche <= 0, `${chevauche} px de chevauchement`);
    await p.clock.runFor(450);
    await p.click("#combat-actions .btn");
    verifier(`${h} px · l'écran de victoire, avec la phrase qui a gagné`, (await visible("victoire")) && ((await texte("#victoire-phrase")) || "").length > 4);
    await p.waitForTimeout(300);
    await tient("victoire");
    if (h === 732) await p.screenshot({ path: path.join(OUT, "ppm-victoire.png") });
    verifier(`${h} px · victoire : « À demain ! » est le bouton plein, « Rejouer » discret`,
      (await p.$eval("#victoire-accueil", (b) => b.classList.contains("btn") && b.textContent.trim())) === contenu.combat.victoire.aDemain
      && (await p.$eval("#victoire-rejouer", (b) => b.classList.contains("btn2"))));
    await p.goBack();
    await p.waitForTimeout(150);
    verifier(`${h} px · retour depuis la victoire : l'entraînement, pas un combat neuf`, await visible("entrainement"));
    await p.goForward();
    await p.waitForTimeout(150);
    await p.click("#victoire-rejouer");
    await p.waitForTimeout(150);
    const neuf = await etat();
    const grand = await minus();
    verifier(`${h} px · « Rejouer » : un nouveau combat, Minus de retour à sa taille tout de suite`,
      (await visible("combat")) && neuf.minus === 10 && neuf.tour === 1 && Math.abs(grand.h - depart.h) < 2, `${grand.h.toFixed(0)} px`);
    verifier(`${h} px · combat : aucune erreur dans la console`, erreurs.length === 0, erreurs.join(" | "));
  } catch (e) { verifier(`${h} px · le combat va jusqu'au bout`, false, e.message.split(/\r?\n/)[0]); }
  await ctx.close();
}

/* 4 sexies. Installer : dans le navigateur, un bouton pour l'adulte ; sans invitation de
   Chrome, il montre le chemin par le menu ; avec, il l'ouvre ; installé, il disparaît. */
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
    verifier("installer : le bouton est visible dans le navigateur", await vis(p, "installer"));
    const r = await p.$eval("#installer", (b) => b.getBoundingClientRect());
    verifier("installer : une cible d'au moins 44 px, sous « C'est parti »", r.height >= 44 && r.top >= (await p.$eval("#vers-meteo", (b) => b.getBoundingClientRect().bottom)));
    await p.click("#installer");
    const ra = await p.$eval("#installer-aide", (e) => { const r = e.getBoundingClientRect(); return { haut: r.top, bas: r.bottom, h: innerHeight }; });
    verifier("installer : sans invitation, le chemin par le menu ⋮ s'affiche DANS l'écran",
      (await vis(p, "installer-aide")) && (await p.$eval("#installer-aide", (e) => e.textContent)) === contenu.accueil.installerAide
      && ra.haut >= 0 && ra.bas <= ra.h, JSON.stringify(ra));
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
    verifier("installer : avec invitation, le bouton ouvre la fenêtre de Chrome", (await p.evaluate(() => window.__invite)) === 1 && !(await vis(p, "installer-aide")));
  });

  await cas("déjà installé", () => {
    const vrai = matchMedia.bind(window);
    window.matchMedia = (q) => (q.includes("display-mode: standalone") ? { matches: true, media: q, addEventListener() {}, removeEventListener() {} } : vrai(q));
  }, async (p) => {
    verifier("installer : dans l'app installée, le bouton n'existe pas", !(await vis(p, "installer")));
  });
}

/* 4 septies. Constats de la revue du 2026-09-26, reproduits. */
{
  // Le dessin de la fée du SOS ne charge pas : la bulle et le bouton doivent quand même venir.
  const { ctx, p, erreurs } = await contexte({ serviceWorkers: "block" });
  await p.clock.install({ time: new Date(2026, 8, 26, 10, 0) });
  try {
    await p.route("**/petit-plus-calme.svg", (r) => r.abort());
    await p.goto(URL_JEU);
    await pret(p);
    await p.click("#vers-calme");
    // Le chargement raté prend du temps RÉEL : attendre la bulle avant d'avancer l'horloge simulée.
    await p.waitForSelector("#sos-corps .bulle", { timeout: 5000 });
    await p.clock.runFor(8000 * contenu.sos.respirations + 300);
    verifier("revue : sans le dessin de la fée, le SOS garde sa bulle et son bouton",
      (await p.$$("#sos-corps .bulle")).length === 1 && (await p.$eval("#sos-actions .btn", (b) => b.textContent).catch(() => "")) === contenu.sos.souffle.boutonSuite);
  } catch (e) { verifier("revue : SOS sans dessin, le parcours va jusqu'au bout", false, e.message.split(/\r?\n/)[0]); }
  await ctx.close();
}
{
  // Ouvrir le Souffle magique et repartir pendant le chargement (fée lente à venir) :
  // aucune bulle cachée, donc aucune étoile donnée en cachette.
  const c2 = await contexte({ serviceWorkers: "block" });
  await c2.p.clock.install({ time: new Date(2026, 8, 26, 10, 0) });
  try {
    await c2.p.route("**/petit-plus.svg", async (r) => { await new Promise((ok) => setTimeout(ok, 600)); await r.continue(); });
    await c2.p.goto(URL_JEU);
    await c2.p.waitForSelector("html[data-pret]");
    await c2.p.click("#vers-entrainement");
    await c2.p.click(".jeu-souffle");
    await c2.p.goBack();
    await c2.p.waitForTimeout(1500);
    await c2.p.click("#vers-calme").catch(() => {});
    await c2.p.goBack().catch(() => {});
    await c2.p.clock.runFor(8000 * 4);
    verifier("revue : Souffle quitté pendant le chargement, aucune étoile donnée en cachette",
      (await c2.p.evaluate(() => window.ppm.etat().etoiles)) === 0, String(await c2.p.evaluate(() => window.ppm.etat().etoiles)));
  } catch (e) { verifier("revue : Souffle quitté, le parcours va jusqu'au bout", false, e.message.split(/\r?\n/)[0]); }
  await c2.ctx.close();
}

/* 4 octies. Les textes les plus longs, partout où ils s'affichent, tous thèmes activés :
   une carte du mémo, les 3 choix du combat, la pensée, la citation du SOS. Le tirage est
   au hasard : attendre qu'un texte long tombe ne prouverait rien, on les pose nous-mêmes. */
for (const h of [732, 640]) {
  const { ctx, p, erreurs } = await contexte({ serviceWorkers: "block", viewport: { width: 360, height: h } });
  await p.clock.install({ time: new Date(2026, 8, 26, 10, 0) });
  try {
    await p.goto(URL_JEU);
    await pret(p);
    await p.evaluate(() => document.fonts.ready);
    const parLongueur = (l) => [...l].sort((a, b) => b.length - a.length);
    const phrases = parLongueur(contenu.paires.map((x) => x.phrase));
    const pensees = parLongueur(contenu.paires.map((x) => x.pensee));
    const trop = () => p.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);

    // Mémo : la carte la plus chargée (étiquette + phrase la plus longue) ne déborde pas.
    await p.click("#vers-entrainement");
    await p.click(".jeu-memo");
    const debordeCarte = await p.evaluate(({ tag, texte, tagM, penseeM }) => {
      const cartes = document.querySelectorAll("#memo-grille .carte");
      const poser = (b, t, x) => { b.className = "carte plus"; b.replaceChildren(Object.assign(document.createElement("span"), { className: "carte-tag", textContent: t }), Object.assign(document.createElement("span"), { className: "carte-texte", textContent: x })); };
      poser(cartes[0], tag, texte);
      poser(cartes[1], tagM, penseeM);
      return [cartes[0], cartes[1]].map((b) => b.scrollHeight - b.clientHeight);
    }, { tag: contenu.jeux.memo.tagPlus, texte: phrases[0], tagM: contenu.jeux.memo.tagMinus, penseeM: pensees[0] });
    verifier(`${h} px · mémo : la phrase et la pensée les plus longues tiennent dans leur carte`, debordeCarte.every((d) => d <= 0), `débord ${debordeCarte.join(" / ")} px`);

    // Combat : les 3 phrases les plus longues comme choix, la pensée la plus longue.
    await p.goBack();
    await p.click("#vers-combat");
    await p.waitForTimeout(100);
    const hPensee = await p.$eval("#pensee", (e) => e.getBoundingClientRect().height);
    await p.evaluate(({ choix, pensee }) => {
      document.querySelectorAll("#combat-actions .choix-combat span").forEach((s, i) => { s.textContent = choix[i]; });
      document.getElementById("pensee").textContent = "« " + pensee + " »";
    }, { choix: phrases.slice(0, 3), pensee: pensees[0] });
    const hPensee2 = await p.$eval("#pensee", (e) => e.getBoundingClientRect().height);
    const t1 = await trop();
    verifier(`${h} px · combat : les 3 phrases les plus longues et la pensée la plus longue tiennent`, t1 <= 0 && Math.abs(hPensee2 - hPensee) < 1, `${t1} px de trop, pensée ${Math.round(hPensee)} → ${Math.round(hPensee2)}`);
    verifier(`${h} px · textes longs : aucune erreur`, erreurs.length === 0, erreurs.join(" | "));
  } catch (e) { verifier(`${h} px · textes longs : le parcours va jusqu'au bout`, false, e.message.split(/\r?\n/)[0]); }
  await ctx.close();
}

/* 4 nonies. « Mes Minus », pour un adulte avec l'enfant : derrière un petit calcul, depuis
   « Pour les grands » sur l'accueil. Le choix change vraiment les pensées de Minus, survit
   au rechargement ; cibles de 44 px, rien sous 14 px, pas de défilement de côté. */
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
    verifier(`${h} px · plus de lien vers les peurs dans l'écran de l'enfant`, (await p.$$("#entrainement #vers-mes-minus")).length === 0);
    await p.click("#vers-grands");
    verifier(`${h} px · « Pour les grands » ouvre d'abord la barrière, la liste reste cachée`, !(await cache("barriere")) && (await cache("mes-minus-contenu")));
    const aide = await p.$$eval("#aide-parent p", (ps) => ps.map((x) => x.textContent));
    verifier(`${h} px · le parent lit d'abord à quoi sert le jeu, ce qu'il garde, quand consulter`,
      aide.length === contenu.mesMinus.aide.length && aide.every((x, i) => x === contenu.mesMinus.aide[i]));
    await p.fill("#barriere-reponse", "12");
    await p.click("#barriere-valider");
    verifier(`${h} px · une mauvaise réponse ne l'ouvre pas, et dit pourquoi`,
      (await cache("mes-minus-contenu")) && (await p.$eval("#barriere-rate", (e) => !e.hidden && e.textContent)) === contenu.mesMinus.barriereRate);
    const ouvrir = await p.$eval("#barriere-valider", (b) => b.getBoundingClientRect().bottom);
    verifier(`${h} px · avant le calcul, « Ouvrir » est entier dans l'écran`, ouvrir <= h, `${Math.round(ouvrir)} px`);
    await passer();
    verifier(`${h} px · l'aide au parent reste lisible après le calcul`, !(await cache("aide-parent")));
    const lignes = p.locator("#liste-themes .theme-ligne");
    verifier(`${h} px · la bonne réponse ouvre les ${sensibles.length} peurs, toutes sur « Non »`,
      !(await cache("mes-minus-contenu")) && (await lignes.count()) === sensibles.length
      && (await p.$$eval("#liste-themes .opt-choix[aria-pressed=true]", (b) => b.map((x) => x.textContent))).every((x) => x === contenu.mesMinus.non));
    const m = await p.evaluate(() => {
      const opts = [...document.querySelectorAll("#liste-themes .opt-choix, #mes-minus-fini")].map((b) => b.getBoundingClientRect());
      const petits = [...document.querySelectorAll("#mes-minus *")].filter((x) => x.offsetParent && [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
        .filter((x) => parseFloat(getComputedStyle(x).fontSize) < 14).length;
      return { minH: Math.min(...opts.map((r) => r.height)), large: document.scrollingElement.scrollWidth - innerWidth, petits };
    });
    verifier(`${h} px · « Mes Minus » : cibles de 44 px, rien sous 14 px, pas de défilement de côté`, m.minH >= 44 && m.large <= 0 && m.petits === 0, JSON.stringify(m));
    if (h === 732) { await p.waitForTimeout(300); await p.screenshot({ path: path.join(OUT, "ppm-mes-minus.png"), fullPage: true }); }

    const iNoir = sensibles.findIndex(([k]) => k === "noir");
    await lignes.nth(iNoir).locator(".opt-choix").first().click();
    // Aucun message ne vient se poser sur un bouton : ni le retour, ni « C'est fait ».
    verifier(`${h} px · un choix n'affiche aucun message par-dessus les boutons`, await p.evaluate(() => document.getElementById("bientot").hidden));
    verifier(`${h} px · « Oui » allume le thème et le montre coché`,
      (await p.evaluate(() => window.ppm.etat().themes.noir)) === true && (await lignes.nth(iNoir).locator(".opt-choix").first().getAttribute("aria-pressed")) === "true");
    await p.click("#mes-minus-fini");
    verifier(`${h} px · « C'est fait » ramène à l'accueil`, !(await cache("accueil")));
    await p.reload();
    await pret(p);
    await p.click("#vers-entrainement");
    await p.click("#vers-combat");
    const ordre = await p.evaluate(() => window.ppm.combat().ordre);
    const idsNoir = contenu.paires.filter((x) => x.theme === "noir").map((x) => x.id);
    verifier(`${h} px · après rechargement, les pensées du noir sont dans le combat`, idsNoir.every((id) => ordre.includes(id)), ordre.join(","));
    verifier(`${h} px · premier combat sans étoile : pas de « grâce à ton entraînement »`,
      (await p.$eval("#combat-message", (e) => e.textContent)) === contenu.combat.messages.debutSansEntrainement.replace("{bonus}", "1"));
    await p.goBack();
    await p.goBack();
    await p.click("#vers-grands");
    verifier(`${h} px · revenir sur « Pour les grands » redemande le calcul`, (await cache("mes-minus-contenu")) && !(await cache("barriere")));
    await passer();
    await lignes.nth(iNoir).locator(".opt-choix").nth(1).click();
    await p.click("#mes-minus-fini");
    await p.click("#vers-entrainement");
    await p.click("#vers-combat");
    const ordre2 = await p.evaluate(() => window.ppm.combat().ordre);
    verifier(`${h} px · « Non » les retire`, idsNoir.every((id) => !ordre2.includes(id)));
    verifier(`${h} px · « Mes Minus » : aucune erreur`, erreurs.length === 0, erreurs.join(" | "));
  } catch (e) { verifier(`${h} px · « Mes Minus » : le parcours va jusqu'au bout`, false, e.message.split(/\r?\n/)[0]); }
  await ctx.close();
}

/* 5. Minus rétrécit les pieds au sol ; animations réduites : tout de suite */
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
  verifier(`${nom} : Minus rétrécit`, apres.haut < avant.haut * 0.85, `${avant.haut.toFixed(0)} → ${apres.haut.toFixed(0)} px`);
  verifier(`${nom} : ses pieds restent au sol`, Math.abs(apres.bas - avant.bas) < 1, `bas ${avant.bas.toFixed(1)} → ${apres.bas.toFixed(1)}`);
  if (reduit) verifier("animations réduites : la taille change tout de suite", Math.abs(pendant.haut - apres.haut) < 1);
  else verifier("animations normales : la taille change en douceur", pendant.haut > apres.haut + 2);

  // La bulle : sans animation elle ne bouge pas, mais sa teinte et le mot changent.
  const bulle = () => p.evaluate(() => { const b = document.querySelector(".bulle"); return { t: getComputedStyle(b).transform, fond: getComputedStyle(b).backgroundColor, mot: document.querySelector(".mot-bulle").textContent }; });
  const b1 = await bulle();
  await p.waitForTimeout(4300);
  const b2 = await bulle();
  verifier(`${nom} : le mot de la bulle alterne`, b1.mot !== b2.mot && [b1.mot, b2.mot].includes(contenu.sos.motInspire), `${b1.mot} / ${b2.mot}`);
  if (reduit) verifier("animations réduites : la bulle ne bouge pas, sa teinte change", b1.t === b2.t && b1.fond !== b2.fond);
  else verifier("animations normales : la bulle change de taille", b1.t !== b2.t);
  if (!reduit) await p.screenshot({ path: path.join(OUT, "ppm-demo.png") });
  verifier(`${nom} : aucune erreur dans la console`, erreurs.length === 0, erreurs.join(" | "));
  await ctx.close();
}

await navigateur.close();
site.arreter();
const echecs = resultats.filter((r) => !r).length;
console.log(echecs ? `\n${echecs} contrôle(s) en échec sur ${resultats.length}` : `\n${resultats.length} contrôles, tous verts`);
process.exit(echecs ? 1 : 0);
