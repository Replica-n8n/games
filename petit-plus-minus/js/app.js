/* La boîte à outils : l'accueil (le calme, la jauge de Minus, les outils au même niveau),
   le SOS, et chaque outil. Aucun texte destiné à l'enfant ici : [data-texte="a.b"] reçoit
   la valeur de contenu.json à ce chemin, [data-aria] son libellé, et les écrans construits
   en JS prennent leurs mots dans `contenu`. Tout élément du HTML reste FACULTATIF pour ce
   script : Pages peut servir un HTML et un JS de deux versions différentes. */
import { chargerContenu } from "./contenu.js";
import { chargerPersonnage, poserTaille } from "./personnages.js";
import { lancerBulle } from "./bulle.js";
import { sosDepart, sosSuivant, remplir } from "./sos.js";
import { lireEtat, ecrireEtat } from "./etat.js";
import { noterMeteo, noterSos, pairesActives, choisirTheme } from "./jeu.js";
import { nouvellesPaires, toucherPaire, pairesFinies } from "./paires.js";
import { repondsDepart, choixReponds, repondre, repondsFini } from "./reponds.js";
import { tresorsDepart, toucherTresor, tresorSuivant, tresorsFinis } from "./tresors.js";

const $ = (s) => document.querySelector(s);
const ECRANS = ["accueil", "sos", "bougie", "robot", "souffle", "tresors", "paires", "reponds", "mes-minus"];
/* L'id de chaque outil de contenu.json, et l'écran qui l'ouvre. */
const ECRAN_DE = { bougie: "bougie", robot: "robot", bulle: "souffle", tresors: "tresors", paires: "paires", reponds: "reponds" };
let contenu = null;

/* ---------- Mémoire du jeu ----------
   Tout reste sur le téléphone (localStorage, clé préfixée ppm:). Si le navigateur
   refuse (navigation privée, quota), le jeu continue : seule la mémoire manque. */
let stockage = null;
try { stockage = window.localStorage; } catch (e) { stockage = null; }
let etat = lireEtat(stockage);
let persistanceDemandee = false;

function enregistrer(suivant) {
  etat = suivant;
  ecrireEtat(stockage, etat);
  // Une fois : demander à Chrome de ne pas effacer la mémoire quand le téléphone manque de place.
  if (!persistanceDemandee && navigator.storage && navigator.storage.persist) {
    persistanceDemandee = true;
    navigator.storage.persist().catch(() => {});
  }
}

function valeur(chemin) {
  return chemin.split(".").reduce((o, k) => (o == null ? undefined : o[k]), contenu);
}

function poserTextes() {
  document.querySelectorAll("[data-texte]").forEach((el) => {
    const v = valeur(el.dataset.texte);
    if (typeof v === "string") el.textContent = v;
  });
  document.querySelectorAll("[data-aria]").forEach((el) => {
    const v = valeur(el.dataset.aria);
    if (typeof v === "string") el.setAttribute("aria-label", v);
  });
}

function montrerPanne(erreurs) {
  const panne = $("#panne"), liste = $("#panne-liste");
  if (!panne || !liste) return;
  liste.replaceChildren(...erreurs.map((e) => Object.assign(document.createElement("li"), { textContent: e })));
  panne.hidden = false;
  ECRANS.forEach((id) => { const e = document.getElementById(id); if (e) e.hidden = true; });
}

function el(balise, classe, texte) {
  const e = document.createElement(balise);
  if (classe) e.className = classe;
  if (texte != null) e.textContent = texte;
  return e;
}
function bouton(classe, texte, action) {
  const b = el("button", classe, texte);
  b.type = "button";
  b.addEventListener("click", action);
  return b;
}
function icone(id) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("fill", "none");
  const u = document.createElementNS("http://www.w3.org/2000/svg", "use");
  u.setAttribute("href", "#" + id);
  svg.append(u);
  return svg;
}
/* Rejouer l'animation « non » (la carte ou la phrase qui ne va pas se secoue). */
function secouer(b) {
  b.classList.remove("non");
  void b.offsetWidth;
  b.classList.add("non");
}

/* Les minuteurs d'un outil (bougie, robot…) : tous arrêtés quand on quitte l'écran, sinon
   un exercice caché continuerait et écrirait sur l'écran suivant. */
let minuteurs = [];
function plusTard(ms, fn) { minuteurs.push(setTimeout(fn, ms)); }
function arreterMinuteurs() { minuteurs.forEach(clearTimeout); minuteurs = []; }

/* ---------- Navigation ----------
   Chaque écran est une entrée de l'historique : le bouton retour d'Android ramène
   à l'écran d'avant au lieu de fermer le jeu. */
let profondeur = 0;

function montrer(id) {
  if (!document.getElementById(id)) return;
  ECRANS.forEach((e) => { const s = document.getElementById(e); if (s) s.hidden = e !== id; });
  // Quitter un écran arrête ce qui y tournait : la bulle, les minuteurs des exercices.
  arreterBulle();
  arreterMinuteurs();
  if (id === "sos") ouvrirSos();
  if (id === "bougie") ouvrirBougie();
  if (id === "robot") ouvrirRobot();
  if (id === "souffle") ouvrirSouffle();
  if (id === "tresors") ouvrirTresors();
  if (id === "paires") ouvrirPaires();
  if (id === "reponds") ouvrirReponds();
  if (id === "mes-minus") ouvrirMesMinus();
  window.scrollTo(0, 0);
  const titre = document.querySelector("#" + id + " [tabindex='-1']");
  if (titre) titre.focus({ preventScroll: true });
}

function aller(id) {
  profondeur++;
  history.pushState({ ecran: id, n: profondeur }, "");
  montrer(id);
}
function revenir() {
  if (profondeur > 0) history.back(); else montrer("accueil");
}
function revenirAccueil() {
  if (profondeur > 0) history.go(-profondeur); else montrer("accueil");
}
window.addEventListener("popstate", (e) => {
  const s = e.state || { ecran: "accueil", n: 0 };
  profondeur = s.n || 0;
  // Dans le SOS, chaque étape est une entrée d'historique : le retour d'Android ramène à
  // l'étape d'avant au lieu d'effacer tout le SOS (le geste de bord est facile d'une main).
  if (s.ecran === "sos" && s.sos && !document.getElementById("sos").hidden) {
    if (refaireEnCours) {
      // « Refaire » : revenu au tout premier écran du SOS, on y repart de zéro. Les étapes
      // de l'ancien SOS seront écrasées par les nouvelles : le retour ne les remonte plus.
      refaireEnCours = false;
      sos = sosDepart(contenu.sos.respirations);
      sosPas = 0;
      sosNote = false;
      history.replaceState({ ecran: "sos", n: profondeur, sos, sosPas }, "");
    } else {
      sos = s.sos;
      sosPas = s.sosPas || 0;
    }
    rendreSos(true);
    return;
  }
  montrer(ECRANS.includes(s.ecran) ? s.ecran : "accueil");
});

/* Un bouton de fin d'outil ignore l'appui qui arrive juste après son apparition : il peut
   naître sous le doigt qui vient de toucher la dernière carte ou la dernière gemme. */
let depuisFin = 0;
function boutonFin(classe, texte, action) {
  return bouton(classe, texte, () => { if (performance.now() - depuisFin >= 400) action(); });
}
/* La fin de chaque outil : « Encore une fois » (discret) et « C'est fait » (retour). */
function poserFin(id, encore) {
  const f = document.getElementById(id);
  if (!f) return;
  depuisFin = performance.now();
  f.replaceChildren(boutonFin("btn2", contenu.textes.encore, encore), boutonFin("btn btn-plus", contenu.textes.cestFait, revenir));
  f.hidden = false;
}
function cacherFin(id) {
  const f = document.getElementById(id);
  if (f) { f.hidden = true; f.replaceChildren(); }
}
function poserPoints(id, total, faits) {
  const p = document.getElementById(id);
  if (p) p.replaceChildren(...Array.from({ length: total }, (_, i) => el("i", i < faits ? "fait" : "")));
}

/* ---------- Accueil : le calme, la jauge, les outils ---------- */
let niveauJauge = null;

function construireAccueil() {
  const lier = (id, action) => { const b = document.getElementById(id); if (b) b.addEventListener("click", action); };
  lier("vers-calme", () => aller("sos"));
  lier("vers-grands", () => aller("mes-minus"));
  lier("mes-minus-fini", revenir);
  lier("barriere-valider", validerBarriere);
  lier("sos-retour", quitterSos);
  const rep = $("#barriere-reponse");
  if (rep) rep.addEventListener("keydown", (e) => { if (e.key === "Enter") validerBarriere(); });
  document.querySelectorAll("[data-retour]").forEach((b) => b.addEventListener("click", revenir));

  const outils = $("#outils");
  if (outils) outils.replaceChildren(...contenu.outils.filter((o) => ECRAN_DE[o.id]).map((o) => {
    const b = bouton("outil o-" + o.id, null, () => aller(ECRAN_DE[o.id]));
    b.dataset.outil = o.id;
    b.append(icone("o-" + o.id), el("span", null, o.titre));
    return b;
  }));
}

async function construireJauge() {
  const jauge = $("#jauge");
  if (!jauge) return;
  const crans = await Promise.all(contenu.jauge.niveaux.map(async (n, i) => {
    const b = bouton("cran", null, () => choisirNiveau(i));
    b.setAttribute("aria-pressed", "false");
    b.append(await chargerPersonnage(n.id === "endormi" ? "petit-minus-endormi" : "petit-minus"), el("span", "cran-l", n.label));
    return b;
  }));
  jauge.replaceChildren(...crans);
}

/* L'enfant se situe en un appui : c'est noté (pour en parler avec un parent), le conseil
   s'affiche, et les outils qui aident à ce niveau sont surlignés. Rien n'est imposé. */
function choisirNiveau(i) {
  const n = contenu.jauge.niveaux[i];
  niveauJauge = n.id;
  enregistrer(noterMeteo(etat, n.id, Date.now()));
  [...($("#jauge")?.children || [])].forEach((c, k) => c.setAttribute("aria-pressed", String(k === i)));
  const conseil = $("#conseil");
  if (conseil) conseil.textContent = n.conseil;
  document.querySelectorAll("#outils .outil").forEach((o) => o.classList.toggle("suggere", n.outils.includes(o.dataset.outil)));
}

/* ---------- SOS ----------
   Calme : ni score, ni chrono, ni vibration. Un appui qui arrive juste après un
   changement d'étape est ignoré : le bouton suivant peut apparaître sous le doigt.
   Minus est MONTRÉ : à sa taille du début quand on dit la phrase et qu'on se demande s'il
   a rétréci, puis, à la fin, il prend la taille que l'ENFANT a choisie. Un miroir, pas un
   score : le jeu ne décide jamais à sa place s'il a rétréci. */
const GARDE_MS = 700;
// Taille de Minus à la fin, relative à celle du début, selon la réponse de l'enfant.
const TAILLE_FIN = { oui: 0.5, unPeu: 0.75, non: 1 };
let sos = null;
let sosDepuis = 0;
let sosPas = 0;
let sosNote = false;
let refaireEnCours = false;
let arreterBulleEnCours = null;

function arreterBulle() {
  if (arreterBulleEnCours) { arreterBulleEnCours(); arreterBulleEnCours = null; }
}

/* La taille de Minus au début du SOS suit la jauge : « Moyen », un peu moins gros.
   Sans jauge touchée, on le montre gros : c'est ce que l'enfant ressent quand il appuie. */
function tailleDepart() {
  return niveauJauge === "moyen" ? 0.8 : 1;
}

function agirSos(action, sansGarde) {
  if (!sansGarde && performance.now() - sosDepuis < GARDE_MS) return;
  const suivant = sosSuivant(sos, action);
  if (suivant === sos) return;
  // « Refaire » repart du tout premier écran du SOS : sinon, le retour remontait un SOS déjà
  // fini, et l'enfant pouvait y répondre une 2e fois (critique du 2026-09-27).
  if (action.type === "refaire" && sosPas > 0) { refaireEnCours = true; history.go(-sosPas); return; }
  const changeEtape = suivant.etape !== sos.etape;
  sos = suivant;
  if (changeEtape) {
    profondeur++;
    sosPas++;
    history.pushState({ ecran: "sos", n: profondeur, sos, sosPas }, "");
    // La trace du SOS, en silence ; une seule par SOS (revenir changer sa réponse la remplace).
    if (sos.etape === "fin") {
      enregistrer(noterSos(etat, "calme", sos.reponse, Date.now(), sosNote));
      sosNote = true;
    }
  } else {
    // Une respiration comptée : l'historique la retient. Sinon le retour depuis le choix de
    // la phrase remettait la respiration à 0 sur 3, et cachait le bouton pendant 24 s.
    history.replaceState({ ecran: "sos", n: profondeur, sos, sosPas }, "");
  }
  rendreSos(changeEtape);
}

function ouvrirSos() {
  sos = sosDepart(contenu.sos.respirations);
  sosPas = 0;
  sosNote = false;
  refaireEnCours = false;
  history.replaceState({ ecran: "sos", n: profondeur, sos, sosPas }, "");
  rendreSos(true);
}

/* Le bouton retour de l'en-tête QUITTE le SOS (toutes ses étapes d'un coup) ; le geste
   de retour d'Android, lui, remonte d'une étape. */
function quitterSos() {
  if (profondeur > sosPas) history.go(-(sosPas + 1)); else montrer("accueil");
}

function phraseDe(id) {
  const p = contenu.paires.find((x) => x.id === id);
  return p ? p.phrase : "";
}

/* La scène : Petit Plus et Petit Minus côte à côte, les pieds au sol. */
async function scene(tailleMinus) {
  const [plus, minus] = await Promise.all([chargerPersonnage("petit-plus"), chargerPersonnage("petit-minus")]);
  poserTaille(minus, tailleMinus);
  const s = el("div", "scene-sos");
  const pp = el("div", "scene-plus"), pm = el("div", "scene-minus");
  pp.append(plus);
  pm.append(minus);
  s.append(pp, pm);
  return { s, minus, plus };
}

async function rendreSos(nouvelleEtape) {
  const corps = $("#sos-corps"), actions = $("#sos-actions");
  if (!corps || !actions) return;
  sosDepuis = performance.now();
  const T = contenu.sos;
  const titre = (t) => { const h = el("h2", "sos-titre", t); h.tabIndex = -1; return h; };
  const rappel = $("#rappel-adulte");
  // Rappel court quand la fin parle déjà de l'adulte (« non ») ou quand Minus a rétréci (« oui »).
  if (rappel) rappel.textContent = sos.etape === "fin" && sos.reponse !== "unPeu" ? T.rappelAdulteCourt : T.rappelAdulte;

  if (sos.etape === "souffle") {
    if (nouvelleEtape) {
      arreterBulle();
      const zone = el("div", "zone-bulle");
      const mot = el("div", "mot-bulle");
      mot.setAttribute("aria-hidden", "true");
      const fee = await chargerPersonnage("petit-plus-calme");
      // Quitté pendant le chargement : ne rien lancer sur un écran caché.
      if (document.getElementById("sos").hidden) return;
      fee.classList.add("fee");
      zone.append(el("div", "bulle"), fee);
      const points = el("div", "points");
      points.setAttribute("aria-hidden", "true");
      // Pour un lecteur d'écran : le compte est annoncé 3 fois en tout, pas le mot toutes les 4 s.
      const annonce = el("p", "pour-lecteur");
      annonce.setAttribute("aria-live", "polite");
      corps.replaceChildren(titre(T.souffle.titre), el("p", "consigne", T.souffle.consigne), zone, mot, points, annonce);
      actions.replaceChildren();
      setTimeout(() => { if (sos && sos.etape === "souffle" && sos.souffles === 0) annonce.textContent = T.motInspire; }, 600);
      arreterBulleEnCours = lancerBulle(zone.querySelector(".bulle"), mot, { inspire: T.motInspire, souffle: T.motSouffle },
        () => agirSos({ type: "respiration" }, true));
    }
    const points = corps.querySelector(".points");
    points.replaceChildren(...Array.from({ length: sos.total }, (_, i) => el("i", i < sos.souffles ? "fait" : "")));
    const annonce = corps.querySelector(".pour-lecteur");
    if (sos.souffles > 0) annonce.textContent = remplir(sos.souffles <= 1 ? T.souffle.compteUne : T.souffle.compte, { n: sos.souffles, total: sos.total });
    // Le bouton pour continuer n'apparaît qu'après la dernière respiration.
    if (sos.souffles >= sos.total && !actions.firstChild) {
      actions.replaceChildren(bouton("btn btn-sos", T.souffle.boutonSuite, () => agirSos({ type: "suite" })));
    }
    return;
  }

  arreterBulle();
  if (sos.etape === "choix") {
    corps.replaceChildren(titre(T.choix.titre), el("p", "consigne", T.choix.consigne));
    actions.replaceChildren(...T.phrases.map((id) => bouton("phrase", phraseDe(id), () => agirSos({ type: "phrase", id }))));
  } else if (sos.etape === "dire") {
    const { s } = await scene(tailleDepart());
    corps.replaceChildren(titre(T.dire.titre), s, el("div", "citation", "« " + phraseDe(sos.phrase) + " »"),
      el("p", "consigne", T.dire.consigne));
    actions.replaceChildren(bouton("btn btn-sos", T.dire.bouton, () => agirSos({ type: "dite" })));
  } else if (sos.etape === "verif") {
    const { s } = await scene(tailleDepart());
    corps.replaceChildren(titre(T.verif.titre), s);
    // Chaque réponse porte un Minus à la taille qu'elle décrit : l'enfant peut répondre sans lire.
    const reponses = await Promise.all(["oui", "unPeu", "non"].map(async (v) => {
      const b = bouton("rep rep-" + v, null, () => agirSos({ type: "reponse", valeur: v }));
      const m = await chargerPersonnage("petit-minus");
      m.classList.add("rep-minus");
      poserTaille(m, TAILLE_FIN[v]);
      const place = el("span", "rep-place");
      place.append(m);
      b.append(place, el("span", null, T.verif[v]));
      return b;
    }));
    actions.replaceChildren(...reponses);
  } else if (sos.etape === "fin") {
    const f = T.fins[sos.reponse];
    const depart = tailleDepart();
    const { s, minus, plus } = await scene(depart);
    // « Non » : Minus garde sa taille (le miroir), mais Petit Plus se rapproche et grandit :
    // l'enfant qui va le plus mal ne finit pas seul face au plus gros Minus du jeu.
    if (sos.reponse === "non") { s.classList.add("scene-proche"); poserTaille(plus, 1.2); }
    // La phrase de courage revient à la fin : c'est l'outil qu'il emporte dans la vraie vie.
    const carte = el("div", "fin-phrase");
    const textes = el("div");
    textes.append(el("div", "fin-phrase-titre", T.phraseTitre), el("div", "fin-phrase-texte", "« " + phraseDe(sos.phrase) + " »"));
    carte.append(icone("i-etoile"), textes);
    corps.replaceChildren(titre(f.titre), s, carte, el("div", "fin", f.texte));
    // Minus part de sa taille du début et prend celle que l'enfant a choisie (500 ms, sans rebond).
    requestAnimationFrame(() => requestAnimationFrame(() => poserTaille(minus, depart * TAILLE_FIN[sos.reponse])));
    const retour = bouton("btn2 btn2-sos", T.boutonAccueil, revenirAccueil);
    if (sos.reponse !== "oui") {
      const rangee = el("div", "fin-actions");
      rangee.append(retour, bouton("btn btn-sos", T.boutonRefaire, () => agirSos({ type: "refaire" })));
      actions.replaceChildren(rangee);
    } else actions.replaceChildren(retour);
  }
  if (nouvelleEtape) {
    const h = corps.querySelector(".sos-titre");
    if (h && !document.getElementById("sos").hidden) h.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}

/* ---------- La bougie ----------
   Sentir la fleur (inspirer 4 s), souffler la bougie (expirer 6 s) : l'expiration plus
   longue que l'inspiration calme le corps. Rien à lire ni à toucher pendant l'exercice. */
const FLEUR_MS = 4000, BOUGIE_MS = 6000;

function ouvrirBougie() {
  const B = contenu.bougie, mot = $("#mot-bougie"), fleur = $("#fleur"), flamme = $("#flamme");
  if (!mot || !fleur || !flamme) return;
  cacherFin("fin-bougie");
  let tour = 0;
  poserPoints("points-bougie", B.tours, 0);
  fleur.classList.remove("grande");
  flamme.classList.remove("soufflee");
  mot.textContent = contenu.textes.pret;
  const cycle = () => {
    flamme.classList.remove("soufflee");
    fleur.classList.add("grande");
    mot.textContent = B.fleur;
    plusTard(FLEUR_MS, () => {
      fleur.classList.remove("grande");
      flamme.classList.add("soufflee");
      mot.textContent = B.bougie;
      plusTard(BOUGIE_MS, () => {
        tour++;
        poserPoints("points-bougie", B.tours, tour);
        if (tour < B.tours) cycle();
        else { flamme.classList.remove("soufflee"); mot.textContent = contenu.textes.bravo; poserFin("fin-bougie", ouvrirBougie); }
      });
    });
  };
  plusTard(1000, cycle);
}

/* ---------- Robot spaghetti ----------
   Relaxation musculaire pour enfants : tout raide comme un robot (5 s), puis tout mou
   comme un spaghetti (10 s), une partie du corps à la fois. */
const ROBOT_MS = 5000, SPAGHETTI_MS = 10000;

function ouvrirRobot() {
  const R = contenu.robot, mot = $("#mot-robot"), partie = $("#partie-robot"), robot = $("#le-robot"), spag = $("#le-spaghetti");
  if (!mot || !partie || !robot || !spag) return;
  cacherFin("fin-robot");
  let tour = 0;
  const total = R.parties.length;
  poserPoints("points-robot", total, 0);
  /* ⚠️ Ce sont des SVG : `.hidden = true` n'y fait RIEN (la propriété n'existe que sur les
     éléments HTML), il faut l'attribut. Le robot restait affiché pendant « Spaghetti… »
     (vu par la mère le 2026-10-01). `raide` : il ne vibre que pendant « Robot ! ». */
  const montrerRobot = (oui, raide) => {
    robot.toggleAttribute("hidden", !oui);
    spag.toggleAttribute("hidden", oui);
    robot.classList.toggle("raide", !!raide);
  };
  montrerRobot(true, false);
  mot.textContent = contenu.textes.pret;
  partie.textContent = "";
  const cycle = () => {
    montrerRobot(true, true);
    mot.textContent = R.robot;
    partie.textContent = R.parties[tour];
    plusTard(ROBOT_MS, () => {
      montrerRobot(false);
      mot.textContent = R.spaghetti;
      partie.textContent = R.mou;
      plusTard(SPAGHETTI_MS, () => {
        tour++;
        poserPoints("points-robot", total, tour);
        if (tour < total) cycle();
        else { mot.textContent = contenu.textes.bravo; partie.textContent = ""; poserFin("fin-robot", ouvrirRobot); }
      });
    });
  };
  plusTard(1200, cycle);
}

/* ---------- La bulle : respirer au rythme de la bulle, avec Petit Plus ---------- */
async function ouvrirSouffle() {
  const corps = $("#souffle-corps");
  if (!corps) return;
  cacherFin("fin-souffle");
  const S = contenu.bulle;
  let faites = 0;
  const zone = el("div", "zone-bulle");
  const bulle = el("div", "bulle bulle-souffle");
  const fee = await chargerPersonnage("petit-plus");
  // Quitté pendant le chargement : une bulle lancée ici tournerait cachée, et son arrêt
  // couperait la bulle de l'écran affiché (revue du 2026-09-26).
  if (document.getElementById("souffle").hidden) return;
  fee.classList.add("fee-souffle");
  zone.append(bulle, fee);
  const mot = el("div", "mot-bulle");
  mot.setAttribute("aria-hidden", "true");
  const points = el("div", "points");
  points.id = "points-souffle";
  points.setAttribute("aria-hidden", "true");
  const annonce = el("p", "pour-lecteur");
  annonce.setAttribute("aria-live", "polite");
  corps.replaceChildren(zone, mot, points, annonce);
  poserPoints("points-souffle", S.respirations, 0);
  const arret = lancerBulle(bulle, mot, { inspire: S.motInspire, souffle: S.motSouffle }, () => {
    faites++;
    poserPoints("points-souffle", S.respirations, faites);
    annonce.textContent = remplir(S.compte, { n: faites, total: S.respirations });
    if (faites >= S.respirations) {
      arret();
      if (arreterBulleEnCours === arret) arreterBulleEnCours = null;
      mot.textContent = contenu.textes.bravo;
      poserFin("fin-souffle", ouvrirSouffle);
    }
  });
  arreterBulleEnCours = arret;
}

/* ---------- Chasse aux 5 trésors : ancrage 5-4-3-2-1 ---------- */
const SENS = { vue: "i-vue", toucher: "i-toucher", ouie: "i-ouie", odorat: "i-odorat", gout: "i-gout" };
let chasse = tresorsDepart();

function ouvrirTresors() {
  chasse = tresorsDepart();
  rendreTresors(true);
}

function rendreTresors(nouvelleEtape) {
  const corps = $("#tresors-corps"), actions = $("#tresors-actions"), pts = $("#tresors-points");
  if (!corps || !actions) return;
  const E = contenu.tresors, T = contenu.chasse, etapes = E.map((x) => x.n);
  if (nouvelleEtape) depuisFin = performance.now();
  if (pts) {
    pts.replaceChildren(...E.map((_, i) => el("i", i < chasse.etape ? "fait" : i === chasse.etape ? "encours" : "")));
    pts.setAttribute("aria-label", remplir(T.etape, { n: Math.min(chasse.etape + 1, E.length), total: E.length }));
  }
  if (tresorsFinis(chasse, etapes)) {
    corps.replaceChildren();
    chargerPersonnage("petit-plus").then((f) => {
      f.classList.add("fee-fin");
      const total = etapes.reduce((a, b) => a + b, 0);
      corps.replaceChildren(f, el("div", "tresor-titre", remplir(T.finTitre, { total })), el("p", "tresor-aide", T.finTexte));
    });
    depuisFin = performance.now();
    const rangee = el("div", "fin-actions");
    rangee.append(boutonFin("btn2", contenu.textes.encore, ouvrirTresors), boutonFin("btn btn-plus", contenu.textes.cestFait, revenir));
    actions.replaceChildren(rangee);
    return;
  }
  const etape = E[chasse.etape], n = etape.n;
  if (nouvelleEtape) {
    const sens = el("div", "sens");
    sens.append(icone(SENS[etape.sens] || "i-gemme"));
    const gemmes = el("div", "gemmes");
    for (let i = 0; i < n; i++) {
      const g = bouton("gemme", null, () => {
        const suivant = toucherTresor(chasse, etapes);
        if (suivant === chasse) return;
        chasse = suivant;
        if (navigator.vibrate) navigator.vibrate(15);
        rendreTresors(false);
      });
      g.append(icone("i-gemme"));
      gemmes.append(g);
    }
    corps.replaceChildren(sens, el("div", "tresor-titre", etape.titre), el("p", "tresor-aide", etape.aide), gemmes, el("div", "tresor-compte"));
    corps.querySelector(".tresor-compte").setAttribute("aria-live", "polite");
    actions.replaceChildren();
  }
  // L'enfant touche une gemme par chose trouvée : les gemmes se remplissent dans l'ordre.
  [...corps.querySelectorAll(".gemme")].forEach((g, i) => {
    const trouvee = i < chasse.trouves;
    g.classList.toggle("trouvee", trouvee);
    g.setAttribute("aria-label", remplir(trouvee ? T.tresorTrouve : T.tresor, { i: i + 1 }));
  });
  const complet = chasse.trouves >= n;
  corps.querySelector(".tresor-compte").textContent = complet ? T.tousTrouves : remplir(T.compte, { k: chasse.trouves, n });
  if (complet && !actions.firstChild) {
    depuisFin = performance.now();
    const dernier = chasse.etape === E.length - 1;
    actions.replaceChildren(boutonFin("btn btn-tresor", dernier ? T.terminer : T.suivant, () => {
      chasse = tresorSuivant(chasse, etapes);
      rendreTresors(true);
      window.scrollTo(0, 0);
    }));
  }
}

/* ---------- Les paires : toutes les cartes visibles ---------- */
let paires = null;

function ouvrirPaires() {
  const P = contenu.lesPaires, cols = $("#colonnes");
  if (!cols) return;
  cacherFin("fin-paires");
  paires = nouvellesPaires(pairesActives(contenu, etat.themes || null), P.nombre, Math.random);
  const msg = $("#retour-paires");
  if (msg) msg.textContent = "";
  const carte = (id, cote) => {
    const p = contenu.paires.find((x) => x.id === id);
    const texte = cote === "minus" ? p.pensee : p.phrase;
    const b = bouton("carte carte-" + cote, texte, () => toucherCarte(b, cote, id));
    b.dataset.id = id;
    b.dataset.cote = cote;
    b.setAttribute("aria-pressed", "false");
    b.setAttribute("aria-label", remplir(cote === "minus" ? P.carteMinus : P.cartePlus, { t: texte }));
    return b;
  };
  const gauche = el("div", "colonne"), droite = el("div", "colonne");
  gauche.append(...paires.gauche.map((id) => carte(id, "minus")));
  droite.append(...paires.droite.map((id) => carte(id, "plus")));
  cols.replaceChildren(gauche, droite);
}

function toucherCarte(b, cote, id) {
  const r = toucherPaire(paires, cote, id);
  if (r.evenement === "rien") return;
  paires = r.paires;
  const P = contenu.lesPaires, msg = $("#retour-paires");
  document.querySelectorAll("#colonnes .carte").forEach((c) => {
    c.setAttribute("aria-pressed", String(c.dataset.cote === "minus" && c.dataset.id === paires.choisi));
    c.classList.toggle("faite", paires.faites.includes(c.dataset.id));
  });
  if (r.evenement === "paire") {
    if (navigator.vibrate) navigator.vibrate(15);
    if (msg) msg.textContent = pairesFinies(paires) ? P.toutes : P.oui;
    if (pairesFinies(paires)) poserFin("fin-paires", ouvrirPaires);
  } else if (r.evenement === "rate" || r.evenement === "dabord") {
    secouer(b);
    if (msg) msg.textContent = r.evenement === "rate" ? P.encore : P.dabord;
  } else if (msg) msg.textContent = "";
}

/* ---------- Réponds à Minus ----------
   Minus dit une pensée juste au-dessus des deux réponses : un seul endroit où lire (au
   combat, l'enfant ne savait plus où regarder). La bonne phrase le fait rétrécir, l'autre
   ne coûte rien : elle se secoue, on essaie l'autre. */
let reponds = null;
let verrouReponds = 0;

function taillesReponds() {
  const fait = reponds.k / reponds.ordre.length;
  return { minus: 1 - 0.66 * fait, plus: 0.8 + 0.25 * fait };
}

function ouvrirReponds() {
  cacherFin("fin-reponds");
  reponds = repondsDepart(pairesActives(contenu, etat.themes || null), contenu.reponds.nombre, Math.random);
  verrouReponds = 0;
  const minus = $("#reponds .reponds-minus .perso-svg"), plus = $("#reponds .reponds-plus .perso-svg");
  // Minus reprend sa taille tout de suite, sans animation : on commence une nouvelle partie.
  [minus, plus].forEach((s) => { if (s) { s.style.transition = "none"; poserTaille(s, s === minus ? 1 : 0.8); } });
  requestAnimationFrame(() => requestAnimationFrame(() => [minus, plus].forEach((s) => { if (s) s.style.transition = ""; })));
  rendreReponds();
}

function rendreReponds() {
  const R = contenu.reponds, bulle = $("#bulle-minus"), liste = $("#reponses");
  if (!bulle || !liste) return;
  bulle.classList.remove("ok");
  const p = contenu.paires.find((x) => x.id === reponds.ordre[reponds.k]);
  bulle.textContent = remplir(R.pensee, { pensee: p.pensee });
  liste.replaceChildren(...choixReponds(reponds, Math.random).map((id) =>
    bouton("rep-phrase", phraseDe(id), (e) => choisirReponse(e.currentTarget, id))));
}

function choisirReponse(b, id) {
  if (performance.now() < verrouReponds) return;
  const r = repondre(reponds, id);
  if (r.resultat === "rien") return;
  reponds = r.reponds;
  const R = contenu.reponds, bulle = $("#bulle-minus"), liste = $("#reponses"), annonce = $("#reponds-annonce");
  if (r.resultat === "encore") {
    secouer(b);
    if (annonce) annonce.textContent = R.encore;
    return;
  }
  if (navigator.vibrate) navigator.vibrate(15);
  const t = taillesReponds();
  const minus = $("#reponds .reponds-minus .perso-svg"), plus = $("#reponds .reponds-plus .perso-svg");
  if (minus) poserTaille(minus, t.minus);
  if (plus) poserTaille(plus, t.plus);
  if (bulle) { bulle.classList.add("ok"); bulle.textContent = r.resultat === "fini" ? R.fin : R.ok; }
  if (liste) liste.replaceChildren();
  if (r.resultat === "fini") { poserFin("fin-reponds", ouvrirReponds); return; }
  verrouReponds = performance.now() + 1400;
  plusTard(1400, () => { if (!repondsFini(reponds)) rendreReponds(); });
}

/* ---------- Pour les grands ----------
   L'enfant choisit, AVEC un adulte, les peurs qu'il connaît : comme le thermomètre de la
   peur des TCC, construit ensemble. Seuls les thèmes éteints par défaut y sont, des plus
   légers aux plus lourds. La barrière : un calcul qu'un enfant de 8 ans ne fait pas de
   tête ; lue seule, la liste pourrait faire naître une peur (docs/PHRASES.md). */
let barriere = null;

function poserBarriere() {
  const a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4), c = 11 + Math.floor(Math.random() * 9);
  barriere = a * b + c;
  const q = $("#barriere-question");
  if (q) { q.textContent = remplir(contenu.mesMinus.barriereQuestion, { a, b, c }); Object.assign(q.dataset, { a, b, c }); }
  const r = $("#barriere-reponse");
  if (r) r.value = "";
}

function validerBarriere() {
  const r = $("#barriere-reponse"), rate = $("#barriere-rate");
  if (!r) return;
  if (Number(r.value.trim()) === barriere) {
    $("#barriere").hidden = true;
    $("#mes-minus-contenu").hidden = false;
    remplirMesMinus();
  } else {
    if (rate) { rate.textContent = contenu.mesMinus.barriereRate; rate.hidden = false; }
    poserBarriere();
  }
}

function ouvrirMesMinus() {
  const aide = $("#aide-parent");
  if (aide) aide.replaceChildren(...contenu.mesMinus.aide.map((x) => el("p", null, x)));
  const b = $("#barriere"), c = $("#mes-minus-contenu"), rate = $("#barriere-rate");
  if (b) b.hidden = false;
  if (c) c.hidden = true;
  if (rate) rate.hidden = true;
  poserBarriere();
}

function remplirMesMinus() {
  const liste = $("#liste-themes");
  if (!liste) return;
  const M = contenu.mesMinus;
  const themes = Object.entries(contenu.themes).filter(([k, th]) => !k.startsWith("_") && th.parDefaut === false);
  liste.replaceChildren(...themes.map(([k, th]) => {
    const ligne = el("div", "theme-ligne");
    ligne.setAttribute("role", "group");
    ligne.setAttribute("aria-label", th.nomEnfant);
    const deux = el("div", "choix-deux");
    const poser = () => {
      const actif = !!(etat.themes && etat.themes[k] === true);
      deux.children[0].setAttribute("aria-pressed", String(actif));
      deux.children[1].setAttribute("aria-pressed", String(!actif));
    };
    // La coche du bouton confirme le choix : un message en plus recouvrait des boutons.
    deux.append(bouton("opt-choix", M.oui, () => { enregistrer(choisirTheme(etat, k, true)); poser(); }),
      bouton("opt-choix", M.non, () => { enregistrer(choisirTheme(etat, k, false)); poser(); }));
    poser();
    ligne.append(el("span", "theme-nom", th.nomEnfant), deux);
    return ligne;
  }));
}

/* ---------- Installer ----------
   Chrome envoie « beforeinstallprompt » quand IL le décide : sur le Pixel, il ne l'a
   parfois jamais envoyé alors que tout était installable. Le bouton montre donc aussi le
   chemin par le menu. Dans l'app installée, il n'existe pas. */
let invitation = null;
let aideMinuteur = null;
const estInstalle = () => {
  try { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch (e) { return false; }
};
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); invitation = e; majInstaller(); });
window.addEventListener("appinstalled", () => { invitation = null; majInstaller(); });

function majInstaller() {
  const b = $("#installer");
  if (b) b.hidden = estInstalle();
  if (estInstalle()) { const a = $("#installer-aide"); if (a) a.hidden = true; }
}

function brancherInstaller() {
  const b = $("#installer");
  if (!b) return;
  b.addEventListener("click", async () => {
    if (invitation) {
      const i = invitation;
      invitation = null;
      i.prompt();
      try { await i.userChoice; } catch (e) { /* refusé ou fermé : rien à faire */ }
      majInstaller();
    } else {
      const a = $("#installer-aide");
      if (!a) return;
      a.hidden = !a.hidden;
      clearTimeout(aideMinuteur);
      if (!a.hidden) aideMinuteur = setTimeout(() => { a.hidden = true; }, 9000);
    }
  });
  majInstaller();
}

/* ---------- Démarrage ---------- */
async function placerPersonnages() {
  await Promise.all([...document.querySelectorAll("[data-perso]")].map(async (place) => {
    place.replaceChildren(await chargerPersonnage(place.dataset.perso));
  }));
}

/* La version vient du SERVICE (celui qui sert les fichiers), pas de la page. */
function versionDuService() {
  return new Promise((ok) => {
    const sw = navigator.serviceWorker && navigator.serviceWorker.controller;
    if (!sw) return ok(null);
    const canal = new MessageChannel();
    canal.port1.onmessage = (e) => ok(e.data);
    sw.postMessage("version", [canal.port2]);
    setTimeout(() => ok(null), 1500);
  });
}

async function demarrer() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
  const r = await chargerContenu("./contenu.json");
  if (r.erreurs.length) { montrerPanne(r.erreurs); return; }
  contenu = r.contenu;
  poserTextes();
  construireAccueil();
  brancherInstaller();
  history.replaceState({ ecran: "accueil", n: 0 }, "");
  document.documentElement.dataset.pret = "";
  await Promise.all([placerPersonnages(), construireJauge()]).catch(() => {});
  document.documentElement.dataset.personnages = "";
}

// Pour les bancs d'essai (tools/petit-plus-minus-*.mjs).
window.ppm = { versionDuService, garde: GARDE_MS, etat: () => etat, sos: () => sos, paires: () => paires, reponds: () => reponds };

demarrer();
