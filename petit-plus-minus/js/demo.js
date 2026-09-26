// Atelier (demo.html) : pas une page du jeu.
import { chargerPersonnage, poserTaille } from "./personnages.js";
import { lancerBulle } from "./bulle.js";

const places = [...document.querySelectorAll("[data-perso]")];
const [plus, minus] = await Promise.all(places.map(async (p) => {
  const svg = await chargerPersonnage(p.dataset.perso);
  p.replaceChildren(svg);
  return svg;
}));

// Mêmes bornes que le combat de la maquette du kit : Minus de 1 à 0,28, Plus de 0,5 à 1,3.
let taille = 10;
function poser() {
  poserTaille(minus, 0.28 + taille * 0.072);
  poserTaille(plus, 0.5 + (10 - taille) / 10 * 0.8);
}
poser();
document.getElementById("plus-petit").onclick = () => { taille = Math.max(0, taille - 3); poser(); };
document.getElementById("recommencer").onclick = () => { taille = 10; poser(); };

const contenu = await fetch("./contenu.json").then((r) => r.json());
lancerBulle(document.querySelector(".bulle"), document.querySelector(".mot-bulle"),
  { inspire: contenu.sos.motInspire, souffle: contenu.sos.motSouffle });
window.ppmDemo = { minus, plus };
