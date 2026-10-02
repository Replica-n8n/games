/* contenu.json est relu et modifié par un parent ou un psychologue, pas par un
   développeur. verifierContenu() dit donc OÙ est l'erreur (le chemin de la clé)
   au lieu de laisser un écran planter plus loin sans explication.
   Chaque message commence par le chemin : les tests s'appuient dessus. */

const estTexte = (v) => typeof v === "string" && v.trim() !== "";
const estEntierPositif = (v) => Number.isInteger(v) && v > 0;
import { POSTURES } from "./yoga.js";

const estObjet = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/* Les outils de l'accueil : chacun a son écran dans index.html et son code dans app.js. */
export const OUTILS = ["bougie", "robot", "bulle", "tresors", "paires", "reponds", "pas", "yoga"];

export function verifierContenu(c) {
  const erreurs = [];
  const err = (chemin, quoi) => erreurs.push(chemin + " : " + quoi);
  const texte = (chemin, v) => { if (!estTexte(v)) err(chemin, "texte manquant ou vide"); };
  const entier = (chemin, v) => { if (!estEntierPositif(v)) err(chemin, "nombre entier positif attendu"); };
  const textes = (sec, cles) => {
    if (!estObjet(c[sec])) { err(sec, "section manquante"); return false; }
    cles.forEach((k) => texte(sec + "." + k, c[sec][k]));
    return true;
  };
  const repere = (chemin, v, r) => { if (estTexte(v) && !v.includes(r)) err(chemin, "doit contenir " + r); };

  if (!estObjet(c)) { err("(fichier)", "le fichier doit contenir un objet { … }"); return erreurs; }

  textes("accueil", ["titre", "boutonCalme", "retour", "installer", "installerAide", "pourLesGrands"]);
  textes("textes", ["pret", "bravo", "encore", "cestFait"]);

  // Les outils : la liste de l'accueil, dans l'ordre, chacun connu du code.
  if (!Array.isArray(c.outils) || c.outils.length === 0) err("outils", "liste des outils manquante");
  else c.outils.forEach((o, i) => {
    if (!o || !OUTILS.includes(o.id)) err("outils[" + i + "].id", "outil inconnu (connus : " + OUTILS.join(", ") + ")");
    texte("outils[" + i + "].titre", o && o.titre);
  });

  // La jauge de Minus : exactement 4 niveaux, chacun suggère des outils connus.
  if (textes("jauge", ["question", "aide"])) {
    const n = c.jauge.niveaux;
    if (!Array.isArray(n) || n.length !== 4) err("jauge.niveaux", "il faut exactement 4 niveaux");
    else n.forEach((x, i) => {
      const p = "jauge.niveaux[" + i + "]";
      texte(p + ".id", x && x.id); texte(p + ".label", x && x.label); texte(p + ".conseil", x && x.conseil);
      if (!x || !Array.isArray(x.outils) || x.outils.some((o) => !OUTILS.includes(o))) err(p + ".outils", "liste d'outils connus attendue");
    });
  }

  if (textes("bougie", ["titre", "fleur", "bougie"])) entier("bougie.tours", c.bougie.tours);
  if (textes("robot", ["titre", "robot", "spaghetti", "mou"])) {
    const pa = c.robot.parties;
    if (!Array.isArray(pa) || pa.length === 0 || !pa.every(estTexte)) err("robot.parties", "liste des parties du corps manquante");
  }
  if (textes("bulle", ["titre", "motInspire", "motSouffle", "compte"])) {
    entier("bulle.respirations", c.bulle.respirations);
    repere("bulle.compte", c.bulle.compte, "{n}");
  }
  if (textes("chasse", ["titre", "etape", "compte", "tousTrouves", "suivant", "terminer", "tresor", "tresorTrouve", "finTitre", "finTexte"])) {
    repere("chasse.compte", c.chasse.compte, "{k}");
    repere("chasse.tresor", c.chasse.tresor, "{i}");
    repere("chasse.finTitre", c.chasse.finTitre, "{total}");
  }
  if (!Array.isArray(c.tresors) || c.tresors.length === 0) err("tresors", "liste des étapes manquante");
  else c.tresors.forEach((t, i) => {
    entier("tresors[" + i + "].n", t && t.n); texte("tresors[" + i + "].titre", t && t.titre); texte("tresors[" + i + "].aide", t && t.aide);
  });

  // Les thèmes et les paires pensée de Minus / phrase de Plus, désignées ailleurs par leur id.
  const ids = new Set();
  const actifsParDefaut = new Set();
  if (!estObjet(c.themes)) err("themes", "section manquante");
  else for (const [k, th] of Object.entries(c.themes)) {
    if (k.startsWith("_")) continue;
    if (!estObjet(th)) { err("themes." + k, "thème mal écrit"); continue; }
    texte("themes." + k + ".nom", th.nom);
    if (typeof th.parDefaut !== "boolean") err("themes." + k + ".parDefaut", "true ou false attendu");
    if (th.parDefaut === true) actifsParDefaut.add(k);
    else texte("themes." + k + ".nomEnfant", th.nomEnfant); // affiché sur « Pour les grands »
  }
  const idsActifs = new Set();
  if (!Array.isArray(c.paires) || c.paires.length === 0) err("paires", "liste de paires manquante");
  else c.paires.forEach((p, i) => {
    texte("paires[" + i + "].id", p && p.id);
    texte("paires[" + i + "].pensee", p && p.pensee);
    texte("paires[" + i + "].phrase", p && p.phrase);
    /* Court : une phrase de courage se retient mieux, et plus longue elle débordait des
       cartes (vu au banc). */
    if (p && estTexte(p.phrase) && p.phrase.length > 66) err("paires[" + i + "].phrase", "trop longue (" + p.phrase.length + " caractères, 66 au plus)");
    if (p && estTexte(p.pensee) && p.pensee.length > 60) err("paires[" + i + "].pensee", "trop longue (" + p.pensee.length + " caractères, 60 au plus)");
    if (p && ids.has(p.id)) err("paires", "l'id « " + p.id + " » est utilisé deux fois");
    if (p) ids.add(p.id);
    if (p && estObjet(c.themes) && !estObjet(c.themes[p.theme])) err("paires[" + i + "].theme", "thème « " + p.theme + " » inconnu");
    if (p && actifsParDefaut.has(p.theme)) idsActifs.add(p.id);
  });
  const assez = (chemin, n) => {
    entier(chemin, n);
    if (estEntierPositif(n) && n > idsActifs.size) err(chemin, "plus de paires demandées (" + n + ") que de paires actives par défaut (" + idsActifs.size + ")");
  };
  if (textes("lesPaires", ["titre", "consigne", "dabord", "oui", "encore", "toutes", "carteMinus", "cartePlus"])) {
    assez("lesPaires.nombre", c.lesPaires.nombre);
    repere("lesPaires.carteMinus", c.lesPaires.carteMinus, "{t}");
    repere("lesPaires.cartePlus", c.lesPaires.cartePlus, "{t}");
  }
  if (textes("reponds", ["titre", "pensee", "consigne", "ok", "encore", "fin"])) {
    assez("reponds.nombre", c.reponds.nombre);
    repere("reponds.pensee", c.reponds.pensee, "{pensee}");
  }

  // Petit yoga : chaque posture nommée doit être une posture que le chat sait dessiner.
  if (textes("yoga", ["titre", "consigne", "commencer"])) {
    entier("yoga.respirations", c.yoga.respirations);
    const po = c.yoga.postures;
    if (!Array.isArray(po) || po.length === 0) err("yoga.postures", "liste des postures manquante");
    else po.forEach((x, i) => {
      if (!x || !Object.hasOwn(POSTURES, x.id)) err("yoga.postures[" + i + "].id", "posture inconnue (connues : " + Object.keys(POSTURES).join(", ") + ")");
      texte("yoga.postures[" + i + "].nom", x && x.nom);
    });
  }

  // Mes petits pas : l'escalier d'une peur, et l'écran où l'adulte le construit.
  if (textes("pas", ["titre", "objectif", "vide", "avecUnGrand", "etape", "etapeAria", "fait", "faitPlus", "solide", "plusTard", "enHaut",
    "aEcrire", "affronter", "monter", "refaire", "tropDur"])) {
    const P = c.pas;
    repere("pas.etape", P.etape, "{n}");
    repere("pas.etapeAria", P.etapeAria, "{t}");
    repere("pas.fait", P.fait, "{total}");
    repere("pas.faitPlus", P.faitPlus, "{n}");
    const sous = { avant: ["titre", "question"], trucs: ["titre", "question", "phrase", "phraseConsigne", "autres", "pret"],
      pendant: ["grand", "texte", "fait", "arreter"], apres: ["titre", "question"],
      bravo: ["titre", "grand", "petit", "pareil", "avant", "apres", "bouton"], dur: ["titre", "grand", "texte", "garder"],
      construire: ["ouvrir", "titre", "intro", "pas1", "peur", "objectif", "pas2", "aideEtapes", "etape", "exemple", "taille", "retirer",
        "ajouter", "glisser", "plein", "pas3", "fini", "vider", "viderSur"] };
    for (const [k, cles] of Object.entries(sous)) {
      if (!estObjet(P[k])) { err("pas." + k, "section manquante"); continue; }
      cles.forEach((x) => texte("pas." + k + "." + x, P[k][x]));
    }
    if (estObjet(P.construire)) {
      const co = P.construire.conseils;
      if (!Array.isArray(co) || co.length === 0 || !co.every(estTexte)) err("pas.construire.conseils", "liste de conseils pour le parent manquante");
      repere("pas.construire.taille", P.construire.taille, "{taille}");
      repere("pas.construire.retirer", P.construire.retirer, "{n}");
    }
  }

  const s = c.sos;
  if (!estObjet(s)) err("sos", "section manquante");
  else {
    entier("sos.respirations", s.respirations);
    ["titre", "retour", "rappelAdulte", "rappelAdulteCourt", "motInspire", "motSouffle", "boutonRefaire", "boutonAccueil", "phraseTitre"]
      .forEach((k) => texte("sos." + k, s[k]));
    const etapes = { souffle: ["titre", "consigne", "boutonSuite", "compte", "compteUne"], choix: ["titre", "consigne"],
      dire: ["titre", "consigne", "bouton"], verif: ["titre", "oui", "unPeu", "non"] };
    for (const [etape, cles] of Object.entries(etapes)) {
      if (!estObjet(s[etape])) { err("sos." + etape, "section manquante"); continue; }
      cles.forEach((k) => texte("sos." + etape + "." + k, s[etape][k]));
    }
    if (estObjet(s.souffle) && estTexte(s.souffle.compte) && !(s.souffle.compte.includes("{n}") && s.souffle.compte.includes("{total}")))
      err("sos.souffle.compte", "doit contenir {n} et {total}");
    if (!Array.isArray(s.phrases) || s.phrases.length === 0) err("sos.phrases", "liste manquante");
    else s.phrases.forEach((id) => {
      if (!ids.has(id)) err("sos.phrases", "« " + id + " » ne correspond à aucune paire");
      else if (!idsActifs.has(id)) err("sos.phrases", "« " + id + " » est dans un thème éteint par défaut : le SOS doit toujours marcher");
    });
    if (!estObjet(s.fins)) err("sos.fins", "section manquante");
    else ["oui", "unPeu", "non"].forEach((k) => {
      const f = s.fins[k];
      if (!estObjet(f)) err("sos.fins." + k, "fin manquante");
      else { texte("sos.fins." + k + ".titre", f.titre); texte("sos.fins." + k + ".texte", f.texte); }
    });
  }

  if (textes("mesMinus", ["titre", "consigne", "oui", "non", "barriereTitre", "barriereTexte", "barriereQuestion", "barriereValider", "barriereRate", "fini"])) {
    if (!Array.isArray(c.mesMinus.aide) || c.mesMinus.aide.length === 0) err("mesMinus.aide", "liste de paragraphes pour le parent manquante");
    else c.mesMinus.aide.forEach((x, i) => texte("mesMinus.aide[" + i + "]", x));
    const menu = c.mesMinus.menu;
    if (!estObjet(menu)) err("mesMinus.menu", "section manquante");
    else for (const k of ["escalier", "peurs"]) {
      if (!estObjet(menu[k])) { err("mesMinus.menu." + k, "choix manquant"); continue; }
      texte("mesMinus.menu." + k + ".titre", menu[k].titre);
      texte("mesMinus.menu." + k + ".texte", menu[k].texte);
    }
    const q = c.mesMinus.barriereQuestion;
    if (estTexte(q) && !["{a}", "{b}", "{c}"].every((r) => q.includes(r))) err("mesMinus.barriereQuestion", "doit contenir {a}, {b} et {c}");
  }

  return erreurs;
}

/* Côté navigateur : charge et vérifie. Rend { contenu, erreurs }. */
export async function chargerContenu(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return { contenu: null, erreurs: ["(fichier) : introuvable (" + res.status + ")"] };
    const contenu = await res.json();
    return { contenu, erreurs: verifierContenu(contenu) };
  } catch (e) {
    return { contenu: null, erreurs: ["(fichier) : illisible, " + e.message] };
  }
}
