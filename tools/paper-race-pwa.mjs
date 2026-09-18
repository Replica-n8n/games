import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { servir } from "./serveur.mjs";

/* Circuit quadrillé : le parcours complet, au format Pixel 9 puis 360 x 640.
   Ce que ce contrôle prouve :
   - la coquille tient : chaque identifiant lu par ui.js existe, VERSION est la
     même dans sw.js et ui.js, chaque fichier de SHELL existe ;
   - l'accueil et la course tiennent sans défiler, cibles de 44 px, texte de
     14 px au moins, clair ET sombre ;
   - on joue au doigt et au clavier, on annule, et la course survit à un
     rechargement ;
   - le service worker prend la main, range EXACTEMENT les fichiers du dépôt,
     et le jeu se relance hors ligne ;
   - une course va jusqu'au drapeau (animations réduites, pour aller vite).
   Captures dans tools/captures/paper-race-*.png. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const JEU = path.join(HERE, "..", "paper-race");
const OUT = path.join(HERE, "captures") + path.sep;
fs.mkdirSync(OUT, { recursive: true });

let echecs = 0;
const verifier = (nom, ok, detail) => {
  console.log((ok ? "ok    " : "ECHEC ") + nom + (detail !== undefined && !ok ? "  " + JSON.stringify(detail) : ""));
  if (!ok) echecs++;
};

/* ---------- 1. la coquille, sans navigateur ---------- */
const lire = (f) => fs.readFileSync(path.join(JEU, f), "utf8");
const html = lire("index.html"), ui = lire("ui.js"), sw = lire("sw.js");
const vUi = (ui.match(/const VERSION = '([^']+)'/) || [])[1];
const vSw = (sw.match(/var VERSION = "([^"]+)"/) || [])[1];
verifier("VERSION identique dans sw.js et ui.js", vUi && vUi === vSw, { vUi, vSw });
const declares = new Set([...html.matchAll(/id="([a-zA-Z0-9]+)"/g)].map((m) => m[1]));
const lus = new Set([...ui.matchAll(/\$\('([a-zA-Z0-9]+)'\)/g)].map((m) => m[1]));
const manquants = [...lus].filter((i) => !declares.has(i) && !["p0", "p1"].includes(i));
verifier("chaque $('id') de ui.js existe dans index.html", manquants.length === 0, manquants);
const SHELL = [...sw.matchAll(/"\.\/([^"]*)"/g)].map((m) => m[1]).filter((f) => f);
verifier("chaque fichier de SHELL existe", SHELL.every((f) => fs.existsSync(path.join(JEU, f))), SHELL);
const tous = ["index.html", "ui.js", "sons.js", "moteur.js", "sw.js", "manifest.json"].map(lire).join("\n");
verifier("aucun tiret cadratin", !tous.includes("—"));
verifier("aucune requête vers un autre site", !/fonts\.googleapis|fonts\.gstatic|https?:\/\/(?!replica-n8n)/.test(html + ui));

/* ---------- 2. dans le navigateur ---------- */
const site = await servir();
const URL_JEU = site.base + "paper-race/";
const navigateur = await chromium.launch();
const erreurs = [];
const suivre = (p) => {
  p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
  p.on("pageerror", (e) => erreurs.push("pageerror: " + e.message));
};

/* mesures communes : débordement, cibles, tailles de texte */
const mesurer = (p) => p.evaluate(() => {
  const vus = [...document.querySelectorAll("button")].filter((b) => {
    const r = b.getBoundingClientRect(), s = getComputedStyle(b);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && !b.closest("[hidden]");
  });
  const petits = vus.map((b) => { const r = b.getBoundingClientRect(); return { id: b.id || b.className, w: Math.round(r.width), h: Math.round(r.height) }; })
    .filter((x) => x.w < 44 || x.h < 44);
  const textes = [];
  const marche = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (marche.nextNode()) {
    const n = marche.currentNode, el = n.parentElement;
    if (!n.textContent.trim() || !el || el.closest("[hidden],[aria-hidden=true],svg")) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const t = parseFloat(getComputedStyle(el).fontSize);
    if (t < 14) textes.push({ texte: n.textContent.trim().slice(0, 30), t });
  }
  return {
    deborde: document.documentElement.scrollWidth > window.innerWidth + 1,
    petits, textes,
  };
});
const attendrePret = (p) => p.waitForFunction(() => document.querySelector(".padbtn:not([disabled])") && !occupe(), null, { timeout: 20000 });
const jouerCoup = async (p, k) => {
  await attendrePret(p);
  await p.evaluate((k) => { choisir(k); document.getElementById("go").click(); }, k);
  await p.waitForTimeout(100);
};
const etat = (p) => p.evaluate(() => ({ coups: R.cars.map((c) => c.coups), tour: R.turn, jeu: document.getElementById("game").style.display !== "none" }));

for (const theme of ["light", "dark"]) {
  const ctx = await navigateur.newContext({ ...devices["Pixel 9"], colorScheme: theme });
  const p = await ctx.newPage();
  suivre(p);
  await p.goto(URL_JEU, { waitUntil: "networkidle" });
  await p.evaluate(() => { localStorage.clear(); });
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(300);
  const accueil = await mesurer(p);
  const jouerVisible = await p.evaluate(() => document.getElementById("jouer").getBoundingClientRect().bottom <= window.innerHeight);
  verifier(`[${theme}] accueil : pas de défilement de côté`, !accueil.deborde);
  verifier(`[${theme}] accueil : cibles de 44 px`, accueil.petits.length === 0, accueil.petits);
  verifier(`[${theme}] accueil : texte de 14 px au moins`, accueil.textes.length === 0, accueil.textes);
  verifier(`[${theme}] accueil : « Jouer » visible sans défiler`, jouerVisible);
  await p.screenshot({ path: OUT + `paper-race-${theme}-01-accueil.png` });
  if (theme === "dark") {
    await p.click("#solo");
    await p.waitForTimeout(600);
    /* les niveaux apparaissent en mode seul : ils doivent se voir, pas naître
       sous le bouton « Jouer » collé en bas (vu sur capture, pas par la mesure) */
    const niv = await p.evaluate(() => ({ bas: document.getElementById("rapide").getBoundingClientRect().bottom, jouer: document.getElementById("jouer").getBoundingClientRect().top }));
    verifier("[dark] seul : les niveaux se voient au-dessus de « Jouer »", niv.bas <= niv.jouer, niv);
    await p.screenshot({ path: OUT + "paper-race-dark-02-accueil-seul.png" });
    await p.click("#duo");
    await ctx.close();
    continue;
  }

  /* la course à deux */
  await p.click("#jouer");
  await attendrePret(p);
  const course = await mesurer(p);
  verifier("course : pas de défilement de côté", !course.deborde);
  verifier("course : cibles de 44 px", course.petits.length === 0, course.petits);
  verifier("course : texte de 14 px au moins", course.textes.length === 0, course.textes);
  await jouerCoup(p, 1);
  await jouerCoup(p, 1);
  await jouerCoup(p, 1);
  await attendrePret(p);
  const apres3 = await etat(p);
  verifier("trois coups joués au doigt", apres3.coups.join() === "2,1" && apres3.tour === 1, apres3);
  await p.screenshot({ path: OUT + "paper-race-light-03-course.png" });

  /* le clavier : 8 = vers le haut, Entrée = tracer */
  await p.keyboard.press("8");
  await p.keyboard.press("Enter");
  await p.waitForTimeout(100);
  await attendrePret(p);
  const clavier = await etat(p);
  verifier("un coup joué au clavier", clavier.coups.join() === "2,2" && clavier.tour === 0, clavier);

  /* annuler : on revient au coup d'avant, une seule fois */
  const pouvait = await p.evaluate(() => !document.getElementById("annuler").disabled);
  await p.click("#annuler");
  await p.waitForTimeout(100);
  const annule = await etat(p);
  const encore = await p.evaluate(() => !document.getElementById("annuler").disabled);
  verifier("annuler ramène au coup d'avant", pouvait && annule.coups.join() === "2,1" && annule.tour === 1, annule);
  verifier("on n'annule qu'un coup", !encore);

  /* la course survit à un rechargement */
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(400);
  const recharge = await etat(p);
  verifier("rechargée, la course reprend où elle en était", recharge.jeu && recharge.coups.join() === "2,1" && recharge.tour === 1, recharge);

  /* retour à l'accueil, puis « Reprendre » */
  await p.click("#menubtn");
  await p.waitForTimeout(200);
  await p.screenshot({ path: OUT + "paper-race-light-04-reglages.png" });
  const reglages = await mesurer(p);
  verifier("réglages : cibles de 44 px", reglages.petits.length === 0, reglages.petits);
  await p.click("#accueil");
  await p.waitForTimeout(200);
  const carte = await p.evaluate(() => !document.getElementById("reprendre").hidden && document.getElementById("reprendreInfo").textContent);
  verifier("l'accueil propose de reprendre", !!carte, carte);
  await p.screenshot({ path: OUT + "paper-race-light-05-reprendre.png" });
  await p.click("#reprendre");
  await p.waitForTimeout(200);
  const repris = await etat(p);
  verifier("« Reprendre » rend la même course", repris.jeu && repris.coups.join() === "2,1", repris);

  /* le service worker, et le hors ligne */
  await p.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(300);
  const controle = await p.evaluate(() => !!navigator.serviceWorker.controller);
  verifier("le service worker contrôle la page", controle);
  const cache = await p.evaluate(async () => {
    const noms = (await caches.keys()).filter((k) => k.indexOf("paper-race:") === 0);
    const c = await caches.open(noms[0]);
    const out = { noms, fichiers: {} };
    for (const req of await c.keys()) {
      const res = await c.match(req);
      const buf = new Uint8Array(await res.arrayBuffer());
      let h = 0; for (const b of buf) h = (h * 31 + b) >>> 0;
      out.fichiers[new URL(req.url).pathname] = { n: buf.length, h };
    }
    return out;
  });
  const hacher = (f) => { const buf = fs.readFileSync(path.join(JEU, f)); let h = 0; for (const b of buf) h = (h * 31 + b) >>> 0; return { n: buf.length, h }; };
  const differents = SHELL.filter((f) => {
    const c = cache.fichiers["/paper-race/" + f], d = hacher(f);
    return !c || c.n !== d.n || c.h !== d.h;
  });
  verifier("un seul cache, nommé paper-race:portée:version", cache.noms.length === 1 && cache.noms[0].endsWith(":" + vSw), cache.noms);
  verifier("le cache contient exactement les fichiers du dépôt", differents.length === 0, differents);
  const diag = await p.evaluate(() => new Promise((ok) => {
    document.getElementById("menubtn").click();
    setTimeout(() => { const t = document.getElementById("menuDiag").textContent; ok({ t, reparer: !document.getElementById("reparer").hidden }); }, 1800);
  }));
  verifier("le menu dit la version du service", diag.t.includes("service " + vSw.replace("paper-race-", "")) && !diag.reparer, diag);
  await p.keyboard.press("Escape");
  await ctx.setOffline(true);
  await p.reload({ waitUntil: "domcontentloaded" });
  await p.waitForTimeout(600);
  const horsLigne = await p.evaluate(() => ({ jeu: document.getElementById("game").style.display !== "none", coups: R && R.cars.map((c) => c.coups), police: document.fonts.check("800 16px 'Bricolage Grotesque'") }));
  verifier("hors ligne, le jeu se relance avec sa course et ses polices", horsLigne.jeu && horsLigne.coups.join() === "2,1" && horsLigne.police, horsLigne);
  await p.screenshot({ path: OUT + "paper-race-light-06-hors-ligne.png" });
  await ctx.setOffline(false);
  await ctx.close();
}

/* ---------- 3. seul contre le fantôme : annuler défait aussi sa réponse ---------- */
{
  const ctx = await navigateur.newContext({ ...devices["Pixel 9"], reducedMotion: "reduce" });
  const p = await ctx.newPage();
  suivre(p);
  await p.goto(URL_JEU, { waitUntil: "networkidle" });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: "networkidle" });
  await p.click("#solo");
  await p.click("#jouer");
  await jouerCoup(p, 1);
  await attendrePret(p);
  const apres = await etat(p);
  verifier("le fantôme répond", apres.coups.join() === "1,1" && apres.tour === 0, apres);
  await p.click("#annuler");
  await p.waitForTimeout(100);
  const annule = await etat(p);
  verifier("en solo, annuler défait le coup ET la réponse", annule.coups.join() === "0,0" && annule.tour === 0, annule);

  /* une course jusqu'au drapeau : chaque voiture suit le choix de l'ordinateur */
  /* à deux : le fantôme réfléchit plus d'une seconde par coup, ce banc ne
     l'attendrait pas. Une limite de TEMPS, pas un nombre de tours : un
     compte de tours coupait la course au cinquième coup. */
  await p.evaluate(() => { document.getElementById("menubtn").click(); document.getElementById("accueil").click(); document.getElementById("duo").click(); document.getElementById("jouer").click(); });
  await p.waitForFunction(() => !depart, null, { timeout: 10000 });
  const fini = await p.evaluate(async () => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    const fin = Date.now() + 90000;
    while (Date.now() < fin && R.winner === null) {
      if (occupe()) { await w(30); continue; }
      const q = aiChoice(R, "rapide");
      if (q === null) { document.getElementById("go").click(); await w(60); continue; }
      choisir(opts.findIndex((o) => o.p[0] === q[0] && o.p[1] === q[1]));
      document.getElementById("go").click();
      await w(60);
    }
    for (let i = 0; i < 100 && document.getElementById("win").style.display !== "flex"; i++) await w(50);
    return { gagnant: R.winner, titre: document.getElementById("wintitle").textContent, sous: document.getElementById("winsub").textContent,
      sauvee: localStorage.getItem("paper-race.course.v1") };
  });
  verifier("la course va jusqu'au drapeau", fini.gagnant !== null && fini.titre.length > 0, fini);
  verifier("une course finie n'est plus proposée à la reprise", fini.sauvee === null, fini.sauvee);
  await p.screenshot({ path: OUT + "paper-race-light-07-arrivee.png" });
  await ctx.close();
}

/* ---------- 4. petit écran : 360 x 640 ---------- */
{
  const ctx = await navigateur.newContext({ ...devices["Pixel 9"], viewport: { width: 360, height: 640 } });
  const p = await ctx.newPage();
  suivre(p);
  await p.goto(URL_JEU, { waitUntil: "networkidle" });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: "networkidle" });
  const accueil = await mesurer(p);
  const jouerVisible = await p.evaluate(() => document.getElementById("jouer").getBoundingClientRect().bottom <= window.innerHeight);
  verifier("[640] accueil : « Jouer » sous le pouce sans défiler", jouerVisible);
  verifier("[640] accueil : cibles de 44 px", accueil.petits.length === 0, accueil.petits);
  await p.screenshot({ path: OUT + "paper-race-640-01-accueil.png" });
  await p.click("#solo");
  await p.waitForTimeout(600);
  const niv = await p.evaluate(() => ({ bas: document.getElementById("rapide").getBoundingClientRect().bottom, jouer: document.getElementById("jouer").getBoundingClientRect().top }));
  verifier("[640] seul : les niveaux se voient au-dessus de « Jouer »", niv.bas <= niv.jouer, niv);
  await p.screenshot({ path: OUT + "paper-race-640-01b-accueil-seul.png" });
  await p.click("#duo");
  await p.click("#jouer");
  await attendrePret(p);
  const m = await p.evaluate(() => {
    const go = document.getElementById("go").getBoundingClientRect(), b = document.getElementById("board").getBoundingClientRect();
    return { goBas: Math.round(go.bottom), plateau: Math.round(b.height), cellPx, hauteur: window.innerHeight };
  });
  const course = await mesurer(p);
  verifier("[640] course : tout tient, « Tracer » compris", m.goBas <= m.hauteur && m.cellPx >= 11, m);
  verifier("[640] course : cibles de 44 px", course.petits.length === 0, course.petits);
  await p.screenshot({ path: OUT + "paper-race-640-02-course.png" });
  await ctx.close();
}

verifier("aucune erreur dans la console", erreurs.length === 0, erreurs);
await navigateur.close();
site.arreter();
console.log(echecs ? `\n${echecs} ECHEC(S)` : "\nCIRCUIT PWA OK");
process.exit(echecs ? 1 : 0);
