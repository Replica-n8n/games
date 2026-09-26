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
  await p.click("#vers-diplomes");
  const bulleInfo = await p.$eval("#bientot", (e) => e.getBoundingClientRect());
  const partir = await p.$eval("#vers-meteo", (e) => e.getBoundingClientRect());
  verifier(`${h} px · « Mes diplômes » annonce que ça arrive, sans cacher « C'est parti »`,
    (await texte("#bientot")) === contenu.accueil.bientot && bulleInfo.bottom < partir.top);

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
  await p.clock.runFor(CYCLE * (N - 1));
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
  await p.clock.runFor(garde);
  await phrases.nth(1).click();
  const attendue = contenu.paires.find((x) => x.id === contenu.sos.phrases[1]).phrase;
  verifier(`${h} px · la phrase choisie est affichée, avec Petit Plus et Minus`,
    ((await texte(".citation")) || "").includes(attendue) && (await p.$$("#sos-corps .scene-sos .perso-svg")).length === 2);
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
  verifier(`${h} px · « Un peu » : la fin propose un souffle ou le retour`,
    (await texte("#sos-corps .sos-titre")) === contenu.sos.fins.unPeu.titre && (await boutons()) === 2);
  verifier(`${h} px · « Un peu » : le rappel de l'adulte reste entier`, (await texte("#rappel-adulte")) === contenu.sos.rappelAdulte);
  await tient("SOS, fin", "#sos-actions .btn2");
  if (h === 732) await p.screenshot({ path: path.join(OUT, "ppm-sos-fin.png") });
  await p.clock.runFor(garde);
  await p.click("#sos-actions .btn");
  verifier(`${h} px · « Refaire un souffle » repart à zéro`,
    (await p.$$("#sos-corps .zone-bulle")).length === 1 && (await faites()) === 0 && (await boutons()) === 0);
  await p.click("#sos [data-retour]");
  verifier(`${h} px · « Retour » depuis le SOS ramène à la météo`, await visible("meteo"));

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

    // Plafond du jour : on peut rejouer, sans étoile, et Petit Plus dit « à demain »
    await attendre(450);
    await p.click("#memo-actions .btn2");
    await jouerTout();
    verifier(`${h} px · au plafond : le jeu reste ouvert, 0 étoile, « à demain »`,
      (await texte("#memo .recompense")) === contenu.limites.messageFinRituel && (await etoiles()) === 4);
    await attendre(450);
    await p.click("#memo-actions .btn");
    verifier(`${h} px · l'entraînement dit « à demain » au plafond`, await p.evaluate(() => !document.getElementById("plafond").hidden));

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
    await p.click("#vers-combat");
    verifier(`${h} px · le combat s'ouvre`, await visible("combat"));
    await p.waitForTimeout(300);
    let c = await etat();
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
    // Pendant l'animation, un appui est ignoré.
    await cliquerPhrase(meilleure);
    verifier(`${h} px · pendant l'animation, un appui ne compte pas`, (await etat()).minus === 9);
    await p.clock.runFor(600);
    await p.waitForTimeout(600);
    await cliquerPhrase(meilleure);
    c = await etat();
    verifier(`${h} px · la meilleure phrase : super efficace, Minus 6`,
      c.minus === 6 && (await texte("#combat-message")) === C.messages.superEfficace.replace("{phrase}", meilleure));
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
