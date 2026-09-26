/* Démarrage et écrans : accueil, météo de Minus, SOS.
   Aucun texte destiné à l'enfant ici : [data-texte="a.b"] reçoit la valeur de
   contenu.json à ce chemin, [data-aria] son libellé, et les écrans construits en JS
   prennent leurs mots dans `contenu`. Tout élément du HTML reste FACULTATIF pour ce
   script : Pages peut servir un HTML et un JS de deux versions différentes. */
import { chargerContenu } from "./contenu.js";
import { chargerPersonnage, poserTaille } from "./personnages.js";
import { lancerBulle } from "./bulle.js";
import { sosDepart, sosSuivant, remplir } from "./sos.js";
import { lireEtat, ecrireEtat } from "./etat.js";
import { noterMeteo, recompenser, niveauDe, jourLocal, bonusCombat } from "./jeu.js";
import { combatDepart, choixDuTour, repondre, combatGagne } from "./combat.js";
import { nouveauMemo, toucherCarte, refermer, memoGagne } from "./memo.js";
import { tresorsDepart, toucherTresor, tresorSuivant, tresorsFinis } from "./tresors.js";

const $ = (s) => document.querySelector(s);
const ECRANS = ["accueil", "meteo", "sos", "entrainement", "souffle", "tresors", "memo", "combat", "victoire"];
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
  // Une fois : demander à Chrome de ne pas effacer la progression quand le téléphone
  // manque de place. Sur Android, pas de question posée, il décide seul.
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

/* ---------- Navigation ----------
   Chaque écran est une entrée de l'historique : le bouton retour d'Android ramène
   à l'écran d'avant au lieu de fermer le jeu. */
let profondeur = 0;

function montrer(id) {
  if (!document.getElementById(id)) return;
  ECRANS.forEach((e) => { const s = document.getElementById(e); if (s) s.hidden = e !== id; });
  // Quitter un écran arrête ce qui y tournait : la bulle, le minuteur du mémo.
  arreterBulle();
  clearTimeout(memoMinuteur);
  if (id === "meteo") ouvrirMeteo();
  if (id === "sos") ouvrirSos();
  if (id === "entrainement") ouvrirEntrainement();
  if (id === "souffle") ouvrirSouffle();
  if (id === "tresors") ouvrirTresors();
  if (id === "memo") ouvrirMemo();
  if (id === "combat") ouvrirCombat();
  if (id === "victoire") ouvrirVictoire();
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
  montrer(ECRANS.includes(s.ecran) ? s.ecran : "accueil");
});

/* ---------- Accueil ---------- */
let bientotMinuteur = null;
function bientot() {
  const b = $("#bientot");
  if (!b) return;
  b.textContent = contenu.accueil.bientot;
  b.hidden = false;
  clearTimeout(bientotMinuteur);
  bientotMinuteur = setTimeout(() => { b.hidden = true; }, 2600);
}

function brancherAccueil() {
  const lier = (id, action) => { const b = document.getElementById(id); if (b) b.addEventListener("click", action); };
  lier("vers-meteo", () => aller("meteo"));
  lier("vers-calme", () => { preparerSos(false); aller("sos"); });
  lier("vers-entrainement", () => aller("entrainement"));
  lier("vers-combat", () => aller("combat"));
  lier("victoire-accueil", revenirAccueil);
  lier("victoire-rejouer", () => aller("combat"));
  lier("vers-diplomes", bientot);
  document.querySelectorAll("[data-retour]").forEach((b) => b.addEventListener("click", revenir));
}

/* ---------- Météo de Minus ---------- */
let choixMeteo = -1;

async function construireMeteo() {
  const grille = $("#grille");
  if (!grille) return;
  const cartes = await Promise.all(contenu.meteo.niveaux.map(async (n, i) => {
    const b = bouton("niveau", null, () => choisirMeteo(i));
    b.setAttribute("aria-pressed", "false");
    b.append(await chargerPersonnage(n.id === "endormi" ? "petit-minus-endormi" : "petit-minus"),
      el("span", "niveau-l", n.label), el("span", "niveau-s", n.sousLabel));
    return b;
  }));
  grille.replaceChildren(...cartes);
}

function ouvrirMeteo() { choisirMeteo(-1); }

function choisirMeteo(i) {
  choixMeteo = i;
  const grille = $("#grille"), msg = $("#meteo-message"), suite = $("#meteo-suite");
  if (grille) [...grille.children].forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
  if (!msg || !suite) return;
  if (i < 0) { msg.replaceChildren(); suite.hidden = true; return; }
  const sos = contenu.meteo.niveaux[i].mode === "sos";
  msg.replaceChildren(el("div", "message " + (sos ? "message-sos" : "message-calme"),
    sos ? contenu.meteo.messageSos : contenu.meteo.messageCalme));
  suite.className = "btn " + (sos ? "btn-sos" : "btn-plus");
  suite.textContent = sos ? contenu.meteo.boutonSos : contenu.meteo.boutonEntrainement;
  suite.hidden = false;
}

function brancherMeteo() {
  const suite = $("#meteo-suite");
  if (suite) suite.addEventListener("click", () => {
    if (choixMeteo < 0) return;
    // Noté ici, au moment où l'enfant confirme, et pas à chaque carte touchée :
    // il a le droit de changer d'avis. Le SOS direct (« J'ai besoin de calme ») ne note rien.
    const niveau = contenu.meteo.niveaux[choixMeteo];
    enregistrer(noterMeteo(etat, niveau.id, Date.now()));
    if (niveau.mode === "sos") { preparerSos(true); aller("sos"); } else aller("entrainement");
  });
}

/* ---------- SOS ----------
   Calme : ni score, ni chrono, ni vibration. Un appui qui arrive juste après un
   changement d'étape est ignoré : le bouton suivant peut apparaître sous le doigt
   (« Refaire un souffle doux » puis « J'ai fini de respirer », au même endroit).
   Minus est MONTRÉ (critique impeccable du 2026-09-25) : à sa taille du début quand on
   dit la phrase et qu'on se demande s'il a rétréci, puis, à la fin, il prend la taille
   que l'ENFANT a choisie. Ce n'est pas un score, c'est un miroir : le jeu ne décide
   jamais à sa place s'il a rétréci. */
const GARDE_MS = 700;
// Taille de Minus à la fin, relative à celle du début, selon la réponse de l'enfant.
const TAILLE_FIN = { oui: 0.5, unPeu: 0.75, non: 1 };
let sos = null;
let sosDepuis = 0;
let tailleDepart = 1;
let arreterBulleEnCours = null;

function arreterBulle() {
  if (arreterBulleEnCours) { arreterBulleEnCours(); arreterBulleEnCours = null; }
}

/* Moyen : un Minus un peu moins gros qu'Énorme. Par « J'ai besoin de calme », on ne
   sait pas : on le montre gros, c'est ce que l'enfant ressent quand il appuie. */
function preparerSos(depuisMeteo) {
  const n = depuisMeteo && choixMeteo >= 0 ? contenu.meteo.niveaux[choixMeteo].id : null;
  tailleDepart = n === "moyen" ? 0.8 : 1;
}

function agirSos(action, sansGarde) {
  if (!sansGarde && performance.now() - sosDepuis < GARDE_MS) return;
  const suivant = sosSuivant(sos, action);
  if (suivant === sos) return;
  const changeEtape = suivant.etape !== sos.etape;
  sos = suivant;
  rendreSos(changeEtape);
}

function ouvrirSos() {
  sos = sosDepart(contenu.sos.respirations);
  rendreSos(true);
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
  return { s, minus };
}

async function rendreSos(nouvelleEtape) {
  const corps = $("#sos-corps"), actions = $("#sos-actions");
  if (!corps || !actions) return;
  sosDepuis = performance.now();
  const T = contenu.sos;
  const titre = (t) => { const h = el("h2", "sos-titre", t); h.tabIndex = -1; return h; };
  const rappel = $("#rappel-adulte");
  if (rappel) rappel.textContent = sos.etape === "fin" && sos.reponse === "oui" ? T.rappelAdulteCourt : T.rappelAdulte;

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
      arreterBulleEnCours = lancerBulle(zone.querySelector(".bulle"), mot, { inspire: T.motInspire, souffle: T.motSouffle },
        () => agirSos({ type: "respiration" }, true));
    }
    const points = corps.querySelector(".points");
    points.replaceChildren(...Array.from({ length: sos.total }, (_, i) => el("i", i < sos.souffles ? "fait" : "")));
    const annonce = corps.querySelector(".pour-lecteur");
    if (sos.souffles > 0) annonce.textContent = remplir(T.souffle.compte, { n: sos.souffles, total: sos.total });
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
    const { s } = await scene(tailleDepart);
    corps.replaceChildren(titre(T.dire.titre), s, el("div", "citation", "« " + phraseDe(sos.phrase) + " »"),
      el("p", "consigne", T.dire.consigne));
    actions.replaceChildren(bouton("btn btn-sos", T.dire.bouton, () => agirSos({ type: "dite" })));
  } else if (sos.etape === "verif") {
    const { s } = await scene(tailleDepart);
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
    const { s, minus } = await scene(tailleDepart);
    corps.replaceChildren(titre(f.titre), s, el("div", "fin", f.texte));
    // Minus part de sa taille du début et prend celle que l'enfant a choisie (500 ms, sans rebond).
    requestAnimationFrame(() => requestAnimationFrame(() => poserTaille(minus, tailleDepart * TAILLE_FIN[sos.reponse])));
    const retour = bouton("btn2 btn2-sos", T.boutonAccueil, revenirAccueil);
    actions.replaceChildren(...(sos.reponse !== "oui" ? [bouton("btn btn-sos", T.boutonRefaire, () => agirSos({ type: "refaire" }))] : []), retour);
  }
  if (nouvelleEtape) {
    const h = corps.querySelector(".sos-titre");
    if (h && !document.getElementById("sos").hidden) h.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}

/* ---------- Entraînement ----------
   Les trois jeux jouables aujourd'hui. Les autres (Robot et spaghetti, Boîte à soucis,
   Échelle du courage) n'ont pas de carte tant qu'ils n'existent pas : une carte qui ne
   mène nulle part est une impasse (critique impeccable du 2026-09-25). */
const JEUX = ["souffle", "tresors", "memo"];
const ICONES = { souffle: "i-bulle", tresors: "i-gemme", memo: "i-etoile" };
const SENS = { vue: "i-vue", toucher: "i-toucher", ouie: "i-ouie", odorat: "i-odorat", gout: "i-gout" };
let depuisJeu = 0;

function jeu(id) { return contenu.entrainement.find((j) => j.id === id); }

function icone(id) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("fill", "none");
  const u = document.createElementNS("http://www.w3.org/2000/svg", "use");
  u.setAttribute("href", "#" + id);
  svg.append(u);
  return svg;
}

/* Un bouton d'écran de jeu ignore l'appui qui arrive juste après son apparition : il
   peut naître sous le doigt qui vient de toucher la dernière gemme ou la dernière carte. */
function boutonJeu(classe, texte, action) {
  return bouton(classe, texte, () => { if (performance.now() - depuisJeu >= 400) action(); });
}

function construireEntrainement() {
  document.querySelectorAll("[data-jeu]").forEach((h) => { const j = jeu(h.dataset.jeu); if (j) h.textContent = j.titre; });
  const liste = $("#liste-jeux");
  if (!liste) return;
  liste.replaceChildren(...JEUX.filter(jeu).map((id) => {
    const j = jeu(id);
    const b = bouton("carte-jeu jeu-" + id, null, () => aller(id));
    const textes = el("span", "carte-jeu-textes");
    textes.append(el("span", "carte-jeu-titre", j.titre), el("span", "carte-jeu-desc", j.description));
    b.append(icone(ICONES[id]), textes);
    return b;
  }));
}

function ouvrirEntrainement() {
  const L = contenu.limites, J = contenu.jeux.hub;
  const { niveau, dansNiveau, parNiveau } = niveauDe(etat.etoiles, L.etoilesParNiveau);
  const nom = $("#niveau-nom"), jauge = $("#jauge"), txt = $("#niveau-texte"), plafond = $("#plafond"), aide = $("#niveau-aide");
  if (nom) nom.textContent = remplir(J.niveau, { n: niveau });
  if (jauge) jauge.style.width = Math.round((dansNiveau / parNiveau) * 100) + "%";
  if (txt) txt.textContent = remplir(dansNiveau <= 1 ? J.progressionUne : J.progression, { k: dansNiveau, total: parNiveau, suivant: niveau + 1 });
  // Au plafond du jour, Petit Plus dit « à demain » ; les jeux restent ouverts, sans étoile.
  const aujourdhui = etat.jeuxDuJour && etat.jeuxDuJour.jour === jourLocal(Date.now()) ? etat.jeuxDuJour.etoiles : 0;
  const auPlafond = aujourdhui >= L.etoilesMaxParJourJeux;
  if (plafond) plafond.hidden = !auPlafond;
  if (aide) aide.hidden = auPlafond;
}

/* La récompense d'un jeu fini : les étoiles (dans la limite du jour), et le niveau. */
function recompense(idJeu) {
  const r = recompenser(etat, jeu(idJeu).etoiles, Date.now(), contenu.limites);
  enregistrer(r.etat);
  const J = contenu.jeux;
  const bloc = el("div", "jeu-corps");
  const pastille = el("div", "recompense");
  if (r.gagnees > 0) {
    pastille.append(icone("i-etoile"), el("span", null, r.gagnees === 1 ? J.etoile : remplir(J.etoiles, { n: r.gagnees })));
  } else {
    pastille.append(el("span", null, contenu.limites.messageFinRituel));
  }
  pastille.setAttribute("role", "status");
  bloc.append(pastille);
  if (r.niveauApres > r.niveauAvant) bloc.append(el("div", "niveau-gagne", remplir(J.niveauGagne, { n: r.niveauApres })));
  return bloc;
}

/* Rejouer et Retour côte à côte : empilés, ils poussaient le bas de l'écran hors du
   téléphone à la fin du Souffle (vu au banc, 12 px à 732, 38 px à 640). */
function actionsFin(idJeu, rejouer, classeRetour, classeRejouer) {
  const J = contenu.jeux;
  const rangee = el("div", "fin-actions");
  rangee.append(boutonJeu("btn2 " + classeRejouer, J.rejouer, rejouer), boutonJeu("btn " + classeRetour, J.retour, revenir));
  return [rangee];
}

/* --- Souffle magique : 3 respirations au rythme de la bulle --- */
let souffleFaites = 0;

async function ouvrirSouffle() {
  const corps = $("#souffle-corps"), actions = $("#souffle-actions");
  if (!corps || !actions) return;
  arreterBulle();
  depuisJeu = performance.now();
  const S = contenu.jeux.souffle;
  souffleFaites = 0;
  const zone = el("div", "zone-bulle");
  const bulle = el("div", "bulle bulle-souffle");
  const fee = await chargerPersonnage("petit-plus");
  // Quitté pendant le chargement : une bulle lancée ici tournerait cachée, donnerait une
  // étoile sans rien montrer et arrêterait la bulle de l'écran affiché (revue du 2026-09-26).
  if (document.getElementById("souffle").hidden) return;
  fee.classList.add("fee-souffle");
  zone.append(bulle, fee);
  const mot = el("div", "mot-bulle");
  mot.setAttribute("aria-hidden", "true");
  const points = el("div", "points");
  points.setAttribute("aria-hidden", "true");
  const annonce = el("p", "pour-lecteur");
  annonce.setAttribute("aria-live", "polite");
  corps.replaceChildren(zone, mot, points, annonce);
  actions.replaceChildren();
  const maj = () => {
    const c = $("#souffle-compteur");
    if (c) c.textContent = remplir(S.compteur, { n: Math.min(souffleFaites + 1, S.respirations), total: S.respirations });
    points.replaceChildren(...Array.from({ length: S.respirations }, (_, i) => el("i", i < souffleFaites ? "fait" : "")));
    if (souffleFaites > 0) annonce.textContent = remplir(S.compteur, { n: souffleFaites, total: S.respirations });
  };
  maj();
  const arret = lancerBulle(bulle, mot, { inspire: S.motInspire, souffle: S.motSouffle }, () => {
    souffleFaites++;
    maj();
    if (souffleFaites >= S.respirations) {
      arret();
      if (arreterBulleEnCours === arret) arreterBulleEnCours = null;
      mot.hidden = true; // fini : la bulle se tait, elle ne dit plus « Inspire… »
      depuisJeu = performance.now();
      corps.append(recompense("souffle"));
      actions.replaceChildren(...actionsFin("souffle", ouvrirSouffle, "btn-plus", "btn2-souffle"));
    }
  });
  arreterBulleEnCours = arret;
}

/* --- Chasse aux 5 trésors : ancrage 5-4-3-2-1 --- */
let chasse = tresorsDepart();

function ouvrirTresors() {
  chasse = tresorsDepart();
  rendreTresors(true);
}

function rendreTresors(nouvelleEtape) {
  const corps = $("#tresors-corps"), actions = $("#tresors-actions"), pts = $("#tresors-points");
  if (!corps || !actions) return;
  const E = contenu.tresors, T = contenu.jeux.tresors, etapes = E.map((x) => x.n);
  if (nouvelleEtape) depuisJeu = performance.now();
  if (pts) {
    pts.replaceChildren(...E.map((_, i) => el("i", i < chasse.etape ? "fait" : i === chasse.etape ? "encours" : "")));
    pts.setAttribute("aria-label", remplir(T.etape, { n: Math.min(chasse.etape + 1, E.length), total: E.length }));
  }
  if (tresorsFinis(chasse, etapes)) {
    corps.replaceChildren();
    chargerPersonnage("petit-plus").then((f) => {
      f.classList.add("fee-fin");
      const total = etapes.reduce((a, b) => a + b, 0);
      corps.replaceChildren(f, el("div", "tresor-titre", remplir(T.finTitre, { total })), el("p", "tresor-aide", T.finTexte), recompense("tresors"));
    });
    actions.replaceChildren(...actionsFin("tresors", ouvrirTresors, "btn-plus", "btn2-tresor"));
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
    depuisJeu = performance.now();
    const dernier = chasse.etape === E.length - 1;
    actions.replaceChildren(boutonJeu("btn btn-tresor", dernier ? T.terminer : T.suivant, () => {
      chasse = tresorSuivant(chasse, etapes);
      rendreTresors(true);
      window.scrollTo(0, 0);
    }));
  }
}

/* --- Mémo des phrases --- */
let memo = null;
let memoMinuteur = null;

function ouvrirMemo() {
  clearTimeout(memoMinuteur);
  const M = contenu.jeux.memo;
  memo = nouveauMemo(contenu.paires, M.nombrePaires, Math.random);
  const grille = $("#memo-grille");
  if (!grille) return;
  depuisJeu = performance.now();
  grille.replaceChildren(...memo.cartes.map((_, i) => bouton("carte", null, () => toucherMemo(i))));
  grille.hidden = false;
  $("#memo-apprises")?.remove();
  const msg = $("#memo-message");
  if (msg) { msg.className = "memo-message"; msg.textContent = M.depart; }
  $("#memo-actions")?.replaceChildren();
  rendreMemo();
}

function toucherMemo(i) {
  const r = toucherCarte(memo, i);
  if (r.evenement === "rien") return;
  memo = r.memo;
  const M = contenu.jeux.memo, msg = $("#memo-message");
  if (r.evenement === "paire" && msg) {
    const p = contenu.paires.find((x) => x.id === r.paire);
    msg.className = "memo-message bien";
    msg.textContent = memoGagne(memo) ? M.gagne : remplir(M.paire, { phrase: p.phrase });
    if (navigator.vibrate) navigator.vibrate(15);
  } else if (r.evenement === "rate" && msg) {
    msg.className = "memo-message encore";
    msg.textContent = M.rate;
    memoMinuteur = setTimeout(() => { memo = refermer(memo); rendreMemo(); }, 1400);
  }
  rendreMemo();
  if (memoGagne(memo)) {
    depuisJeu = performance.now();
    const actions = $("#memo-actions");
    const fin = recompense("memo");
    if (actions) actions.replaceChildren(fin, ...actionsFin("memo", ouvrirMemo, "btn-plus", "btn2-memo"));
    /* Gagné : les cartes laissent place aux phrases magiques apprises, à relire. Les
       garder avec la récompense et les boutons dépassait l'écran de 150 px. */
    const grille = $("#memo-grille");
    if (grille) {
      const liste = el("ul", "memo-apprises");
      liste.id = "memo-apprises";
      liste.append(...memo.trouvees.map((id) => el("li", null, contenu.paires.find((x) => x.id === id).phrase)));
      grille.hidden = true;
      grille.before(liste);
    }
  }
}

/* Les cartes sont créées une fois par partie et mises à jour sur place : le focus du
   clavier et le lecteur d'écran restent sur la carte touchée. */
function rendreMemo() {
  const M = contenu.jeux.memo, grille = $("#memo-grille"), compteur = $("#memo-compteur");
  if (compteur) compteur.textContent = remplir(M.compteur, { k: memo.trouvees.length, n: memo.cartes.length / 2 });
  if (!grille) return;
  [...grille.children].forEach((b, i) => {
    const c = memo.cartes[i], p = contenu.paires.find((x) => x.id === c.paire);
    const visible = memo.ouvertes.includes(i) || memo.trouvees.includes(c.paire);
    const etatCarte = visible ? c.sorte + (memo.trouvees.includes(c.paire) ? " trouvee" : "") : "cachee";
    if (b.dataset.etat === etatCarte) return;
    b.dataset.etat = etatCarte;
    b.className = "carte " + (visible ? etatCarte : "");
    if (!visible) {
      b.replaceChildren(icone("i-etoile"));
      b.setAttribute("aria-label", remplir(M.carteCachee, { i: i + 1 }));
    } else {
      const tag = c.sorte === "minus" ? M.tagMinus : M.tagPlus, texte = c.sorte === "minus" ? p.pensee : p.phrase;
      b.replaceChildren(el("span", "carte-tag", tag), el("span", "carte-texte", texte));
      b.setAttribute("aria-label", tag + " : " + texte);
    }
  });
}

/* ---------- Combat ----------
   Petit Plus commence avec la force de son entraînement (son niveau, plafonné). Minus
   rétrécit et Petit Plus grandit, les pieds au sol, 500 ms sans rebond (le kit avait un
   rebond : il faisait regrossir Minus une fraction de seconde). Les choix sont ignorés
   pendant l'animation : un deuxième appui compterait une réponse de trop. */
const ANIMATION_COMBAT_MS = 550;
let combat = null;
let verrouCombat = 0;
let phraseGagnante = null;

/* Petit Plus va de la moitié à sa pleine taille : plus grande, sa tête passait de 30 px
   sous les jauges à la victoire (vu au banc). Minus va de pleine taille à 0,28. */
function tailles(c) {
  const R = contenu.combat;
  return { minus: 0.28 + (c.minus / R.tailleMinusDepart) * 0.72, plus: 0.5 + (c.plus / R.forcePlusMax) * 0.5 };
}

function poserTaillesCombat(sansAnimation) {
  const plus = $("#combat .combat-plus .perso-svg"), minus = $("#combat .combat-minus .perso-svg");
  if (!plus || !minus) return;
  const t = tailles(combat);
  [plus, minus].forEach((s) => s.classList.toggle("sans-transition", !!sansAnimation));
  poserTaille(plus, t.plus);
  poserTaille(minus, t.minus);
  if (sansAnimation) requestAnimationFrame(() => requestAnimationFrame(() => [plus, minus].forEach((s) => s.classList.remove("sans-transition"))));
}

function ouvrirCombat() {
  const R = contenu.combat;
  const bonus = bonusCombat(niveauDe(etat.etoiles, contenu.limites.etoilesParNiveau).niveau, R.bonusMax);
  // phraseGagnante n'est PAS remise à zéro : un retour arrière depuis ce nouveau combat
  // rouvre l'écran de victoire précédent, qui doit garder SA phrase.
  combat = combatDepart(contenu.paires, R, bonus, Math.random);
  verrouCombat = 0;
  const msg = $("#combat-message");
  if (msg) { msg.className = "combat-message"; msg.textContent = remplir(R.messages.debut, { bonus }); }
  poserTaillesCombat(true);
  rendreCombat();
}

function rendreCombat() {
  const R = contenu.combat, E = R.ecran;
  const tour = $("#combat-tour");
  if (tour) tour.textContent = remplir(E.tour, { n: combat.tour });
  const jp = $("#jauge-plus"), jm = $("#jauge-minus"), vp = $("#force-valeur");
  const taille = E.tailles[combat.minus] || "";
  if (jp) jp.style.width = Math.round((combat.plus / R.forcePlusMax) * 100) + "%";
  if (jm) jm.style.width = Math.round((combat.minus / R.tailleMinusDepart) * 100) + "%";
  if (vp) vp.textContent = String(combat.plus);
  $("#bloc-plus")?.setAttribute("aria-label", E.forcePlus + " : " + remplir(E.forceValeur, { n: combat.plus, max: R.forcePlusMax }));
  $("#bloc-minus")?.setAttribute("aria-label", E.tailleMinus + " : " + taille);
  const pensee = $("#pensee");
  const p = contenu.paires.find((x) => x.id === combat.ordre[combat.pensee]);
  if (pensee) pensee.textContent = combatGagne(combat) ? E.finPensee : remplir(E.pensee, { pensee: p.pensee });
  const actions = $("#combat-actions");
  if (!actions) return;
  if (combatGagne(combat)) {
    actions.replaceChildren(boutonJeu("btn btn-orange", E.voirVictoire, () => aller("victoire")));
    return;
  }
  const choix = choixDuTour(combat, Math.random, R.choixParTour);
  actions.replaceChildren(...choix.map((id) => {
    const b = bouton("choix-combat", null, () => choisirCombat(id));
    b.append(icone("i-etoile"), el("span", null, contenu.paires.find((x) => x.id === id).phrase));
    return b;
  }));
}

function choisirCombat(id) {
  if (performance.now() < verrouCombat) return;
  const R = contenu.combat;
  const r = repondre(combat, id, R);
  if (r.resultat === "rien") return;
  combat = r.combat;
  verrouCombat = performance.now() + ANIMATION_COMBAT_MS;
  depuisJeu = performance.now();
  const phrase = contenu.paires.find((x) => x.id === id).phrase;
  const msg = $("#combat-message");
  if (msg) {
    msg.className = "combat-message " + (r.resultat === "autre" ? "encore" : "bien");
    msg.textContent = r.resultat === "gagne" ? R.messages.victoire
      : r.resultat === "super" ? remplir(R.messages.superEfficace, { phrase }) : R.messages.autre;
  }
  if (r.resultat !== "autre" && navigator.vibrate) navigator.vibrate(15);
  if (r.resultat === "gagne") phraseGagnante = phrase;
  poserTaillesCombat(false);
  rendreCombat();
}

function ouvrirVictoire() {
  const txt = $("#victoire-phrase");
  const secours = contenu.paires[0].phrase;
  if (txt) txt.textContent = "« " + (phraseGagnante || secours) + " »";
}

/* ---------- Installer ----------
   Chrome envoie « beforeinstallprompt » quand IL le décide : sur le Pixel, il ne l'a
   parfois jamais envoyé alors que tout était installable (vu sur Petits plus). Le bouton
   montre donc aussi le chemin par le menu. Dans l'app installée, il n'existe pas. */
let invitation = null;
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
      if (a) a.hidden = !a.hidden;
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
  brancherAccueil();
  brancherMeteo();
  construireEntrainement();
  brancherInstaller();
  history.replaceState({ ecran: "accueil", n: 0 }, "");
  document.documentElement.dataset.pret = "";
  await Promise.all([placerPersonnages(), construireMeteo()]).catch(() => {});
  document.documentElement.dataset.personnages = "";
}

// Pour les bancs d'essai (tools/petit-plus-minus-*.mjs).
window.ppm = { versionDuService, garde: GARDE_MS, etat: () => etat, memo: () => memo, combat: () => combat };

demarrer();
