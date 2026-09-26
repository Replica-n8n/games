/* Les personnages sont les SVG de personnages/, insérés dans la page (pas en <img>)
   pour pouvoir les animer. Chacun est créé UNE fois : un élément recréé naît à son
   état final et sa transition ne joue jamais. On change ensuite sa taille avec
   poserTaille(), ancrée en bas (les pieds restent au sol, voir css/jeu.css). */

const sources = {};

export async function chargerPersonnage(nom) {
  if (!sources[nom]) {
    sources[nom] = fetch("./personnages/" + nom + ".svg").then((r) => {
      if (!r.ok) throw new Error(nom + " : " + r.status);
      return r.text();
    });
  }
  /* Un échec (réseau coupé avant l'installation) n'est PAS gardé : le prochain appel
     retente. Et on rend un dessin vide au lieu de lever : le SOS attendait la fée pour
     afficher la bulle, une image décorative ne doit jamais bloquer un écran. */
  let texte;
  try {
    texte = await sources[nom];
  } catch (e) {
    delete sources[nom];
    const vide = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    vide.setAttribute("class", "perso-svg");
    vide.setAttribute("aria-hidden", "true");
    return vide;
  }
  const doc = new DOMParser().parseFromString(texte, "image/svg+xml");
  const svg = doc.documentElement;
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  svg.setAttribute("class", "perso-svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  return document.importNode(svg, true);
}

/* 1 = taille normale. Minus ne descend jamais à zéro : un peu de peur reste normal. */
export function poserTaille(svg, echelle) {
  svg.style.setProperty("--echelle", String(echelle));
}
