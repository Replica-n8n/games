/* Le déroulé du SOS, en fonctions PURES : souffle → choix → dire → verif → fin.
   Une action qui ne correspond pas à l'étape en cours ne change rien : c'est ce qui
   rend un double appui ou un clic arrivé en retard sans effet (tests/sos.test.js). */

export function sosDepart(total) {
  return { etape: "souffle", souffles: 0, total, phrase: null, reponse: null };
}

const REPONSES = ["oui", "unPeu", "non"];

export function sosSuivant(e, action) {
  switch (action.type) {
    /* Les respirations viennent de la BULLE (un cycle de 8 s = une respiration), pas
       d'un bouton : l'enfant regarde la bulle au lieu de compter ses appuis. Le compte
       s'arrête au total, la bulle continue, et c'est l'enfant qui décide de passer à la
       suite (critique impeccable du 2026-09-25). */
    case "respiration":
      if (e.etape !== "souffle" || e.souffles >= e.total) return e;
      return { ...e, souffles: e.souffles + 1 };
    case "suite":
      return e.etape === "souffle" && e.souffles >= e.total ? { ...e, etape: "choix" } : e;
    case "phrase":
      return e.etape === "choix" ? { ...e, phrase: action.id, etape: "dire" } : e;
    case "dite":
      return e.etape === "dire" ? { ...e, etape: "verif" } : e;
    case "reponse":
      return e.etape === "verif" && REPONSES.includes(action.valeur) ? { ...e, reponse: action.valeur, etape: "fin" } : e;
    case "refaire":
      return e.etape === "fin" ? sosDepart(e.total) : e;
    default:
      return e;
  }
}

/* "{n} respirations sur {total}" : les nombres s'insèrent dans le texte de contenu.json. */
export function remplir(modele, valeurs) {
  return modele.replace(/\{(\w+)\}/g, (tout, k) => (k in valeurs ? String(valeurs[k]) : tout));
}
