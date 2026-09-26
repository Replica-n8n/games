/* contenu.json est relu et modifié par un parent ou un psychologue, pas par un
   développeur. verifierContenu() dit donc OÙ est l'erreur (le chemin de la clé)
   au lieu de laisser un écran planter plus loin sans explication.
   Chaque message commence par le chemin : les tests s'appuient dessus. */

const estTexte = (v) => typeof v === "string" && v.trim() !== "";
const estEntierPositif = (v) => Number.isInteger(v) && v > 0;
const estObjet = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

export function verifierContenu(c) {
  const erreurs = [];
  const err = (chemin, quoi) => erreurs.push(chemin + " : " + quoi);
  const texte = (chemin, v) => { if (!estTexte(v)) err(chemin, "texte manquant ou vide"); };
  const entier = (chemin, v) => { if (!estEntierPositif(v)) err(chemin, "nombre entier positif attendu"); };

  if (!estObjet(c)) { err("(fichier)", "le fichier doit contenir un objet { … }"); return erreurs; }

  if (!estObjet(c.accueil)) err("accueil", "section manquante");
  else ["surtitre", "titre", "sousTitre", "intro", "nomPlus", "nomMinus", "vs", "boutonCalme",
    "boutonPartir", "boutonEntrainer", "boutonDiplomes", "bientot", "retour"]
    .forEach((k) => texte("accueil." + k, c.accueil[k]));

  // La météo : exactement 4 niveaux, chacun mène à l'entraînement ou au SOS.
  const m = c.meteo;
  if (!estObjet(m)) err("meteo", "section manquante");
  else {
    ["question", "sousTitre", "messageCalme", "messageSos", "boutonEntrainement", "boutonSos"]
      .forEach((k) => texte("meteo." + k, m[k]));
    if (!Array.isArray(m.niveaux) || m.niveaux.length !== 4) err("meteo.niveaux", "il faut exactement 4 niveaux");
    else m.niveaux.forEach((n, i) => {
      const p = "meteo.niveaux[" + i + "]";
      texte(p + ".id", n && n.id); texte(p + ".label", n && n.label); texte(p + ".sousLabel", n && n.sousLabel);
      if (!n || (n.mode !== "entrainement" && n.mode !== "sos")) err(p + ".mode", "« entrainement » ou « sos » attendu");
    });
  }

  // Les paires pensée de Minus / phrase de Plus, désignées ailleurs par leur id.
  const ids = new Set();
  if (!Array.isArray(c.paires) || c.paires.length === 0) err("paires", "liste de paires manquante");
  else c.paires.forEach((p, i) => {
    texte("paires[" + i + "].id", p && p.id);
    texte("paires[" + i + "].pensee", p && p.pensee);
    texte("paires[" + i + "].phrase", p && p.phrase);
    if (p && ids.has(p.id)) err("paires", "l'id « " + p.id + " » est utilisé deux fois");
    if (p) ids.add(p.id);
  });

  const co = c.combat;
  if (!estObjet(co)) err("combat", "section manquante");
  else {
    ["tailleMinusDepart", "forcePlusMax", "degatsMeilleurePhrase", "degatsAutrePhrase", "choixParTour", "bonusMax"]
      .forEach((k) => entier("combat." + k, co[k]));
    if (estEntierPositif(co.degatsMeilleurePhrase) && estEntierPositif(co.degatsAutrePhrase) &&
        co.degatsMeilleurePhrase <= co.degatsAutrePhrase)
      err("combat.degatsMeilleurePhrase", "doit être plus grand que degatsAutrePhrase");
    if (estEntierPositif(co.choixParTour) && Array.isArray(c.paires) && co.choixParTour > c.paires.length)
      err("combat.choixParTour", "plus de choix (" + co.choixParTour + ") que de paires (" + c.paires.length + ")");
    const msg = co.messages;
    if (!estObjet(msg)) err("combat.messages", "section manquante");
    else {
      ["debut", "superEfficace", "autre", "victoire", "victoireSousTexte"].forEach((k) => texte("combat.messages." + k, msg[k]));
      if (estTexte(msg.debut) && !msg.debut.includes("{bonus}")) err("combat.messages.debut", "doit contenir {bonus}");
      if (estTexte(msg.superEfficace) && !msg.superEfficace.includes("{phrase}")) err("combat.messages.superEfficace", "doit contenir {phrase}");
    }
    const ec = co.ecran, vi = co.victoire;
    if (!estObjet(ec)) err("combat.ecran", "section manquante");
    else {
      ["tour", "forcePlus", "tailleMinus", "forceValeur", "minusDit", "pensee", "finPensee", "voirVictoire"]
        .forEach((k) => texte("combat.ecran." + k, ec[k]));
      if (!Array.isArray(ec.tailles) || ec.tailles.length !== co.tailleMinusDepart + 1 || !ec.tailles.every(estTexte))
        err("combat.ecran.tailles", "il faut un mot par taille de Minus, de 0 à " + co.tailleMinusDepart);
      if (estTexte(ec.pensee) && !ec.pensee.includes("{pensee}")) err("combat.ecran.pensee", "doit contenir {pensee}");
    }
    if (!estObjet(vi)) err("combat.victoire", "section manquante");
    else ["surtitre", "titre", "pff", "phraseTitre", "accueil"].forEach((k) => texte("combat.victoire." + k, vi[k]));
  }

  if (!Array.isArray(c.entrainement) || c.entrainement.length === 0) err("entrainement", "liste des jeux manquante");
  else c.entrainement.forEach((j, i) => {
    texte("entrainement[" + i + "].id", j && j.id); texte("entrainement[" + i + "].titre", j && j.titre);
    entier("entrainement[" + i + "].etoiles", j && j.etoiles);
  });

  if (!Array.isArray(c.tresors) || c.tresors.length === 0) err("tresors", "liste des étapes manquante");
  else c.tresors.forEach((t, i) => {
    entier("tresors[" + i + "].n", t && t.n); texte("tresors[" + i + "].titre", t && t.titre); texte("tresors[" + i + "].aide", t && t.aide);
  });

  const s = c.sos;
  if (!estObjet(s)) err("sos", "section manquante");
  else {
    entier("sos.respirations", s.respirations);
    ["titre", "retour", "rappelAdulte", "rappelAdulteCourt", "motInspire", "motSouffle", "boutonRefaire", "boutonAccueil"]
      .forEach((k) => texte("sos." + k, s[k]));
    const etapes = { souffle: ["titre", "consigne", "boutonSuite", "compte"], choix: ["titre", "consigne"],
      dire: ["titre", "consigne", "bouton"], verif: ["titre", "oui", "unPeu", "non"] };
    for (const [etape, cles] of Object.entries(etapes)) {
      if (!estObjet(s[etape])) { err("sos." + etape, "section manquante"); continue; }
      cles.forEach((k) => texte("sos." + etape + "." + k, s[etape][k]));
    }
    if (estObjet(s.souffle) && estTexte(s.souffle.compte) && !(s.souffle.compte.includes("{n}") && s.souffle.compte.includes("{total}")))
      err("sos.souffle.compte", "doit contenir {n} et {total}");
    if (!Array.isArray(s.phrases) || s.phrases.length === 0) err("sos.phrases", "liste manquante");
    else s.phrases.forEach((id) => { if (!ids.has(id)) err("sos.phrases", "« " + id + " » ne correspond à aucune paire"); });
    if (!estObjet(s.fins)) err("sos.fins", "section manquante");
    else ["oui", "unPeu", "non"].forEach((k) => {
      const f = s.fins[k];
      if (!estObjet(f)) err("sos.fins." + k, "fin manquante");
      else { texte("sos.fins." + k + ".titre", f.titre); texte("sos.fins." + k + ".texte", f.texte); }
    });
  }

  /* Les écrans d'entraînement : chaque texte, et les {repères} que le code remplit. */
  const j = c.jeux;
  if (!estObjet(j)) err("jeux", "section manquante");
  else {
    const textes = {
      "": ["retour", "rejouer", "etoile", "etoiles", "niveauGagne"],
      hub: ["titre", "niveau", "progression", "progressionUne", "aide", "combat"],
      souffle: ["compteur", "consigne", "motInspire", "motSouffle"],
      tresors: ["etape", "compte", "tousTrouves", "suivant", "terminer", "tresor", "tresorTrouve", "finTitre", "finTexte"],
      memo: ["consigne", "compteur", "depart", "paire", "rate", "gagne", "tagMinus", "tagPlus", "carteCachee"],
    };
    for (const [sec, cles] of Object.entries(textes)) {
      const o = sec ? j[sec] : j;
      if (!estObjet(o)) { err("jeux." + sec, "section manquante"); continue; }
      cles.forEach((k) => texte("jeux." + (sec ? sec + "." : "") + k, o[k]));
    }
    const reperes = [["etoiles", "{n}"], ["niveauGagne", "{n}"], ["hub.niveau", "{n}"], ["hub.progression", "{k}"],
      ["hub.progression", "{suivant}"], ["souffle.compteur", "{n}"], ["tresors.compte", "{k}"], ["tresors.tresor", "{i}"],
      ["memo.compteur", "{k}"], ["memo.paire", "{phrase}"], ["memo.carteCachee", "{i}"]];
    for (const [chemin, r] of reperes) {
      const v = chemin.split(".").reduce((o, k) => (o == null ? o : o[k]), j);
      if (estTexte(v) && !v.includes(r)) err("jeux." + chemin, "doit contenir " + r);
    }
    if (estObjet(j.souffle)) entier("jeux.souffle.respirations", j.souffle.respirations);
    if (estObjet(j.memo)) {
      entier("jeux.memo.nombrePaires", j.memo.nombrePaires);
      if (Array.isArray(c.paires) && estEntierPositif(j.memo.nombrePaires) && j.memo.nombrePaires > c.paires.length)
        err("jeux.memo.nombrePaires", "plus de paires demandées que de paires écrites");
    }
  }

  const l = c.limites;
  if (!estObjet(l)) err("limites", "section manquante");
  else {
    ["dureeRituelMinutes", "etoilesMaxParJourJeux", "etoilesParNiveau"].forEach((k) => entier("limites." + k, l[k]));
    texte("limites.messageFinRituel", l.messageFinRituel);
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
