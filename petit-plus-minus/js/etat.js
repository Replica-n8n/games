/* Lecture et écriture de la progression.
   ⚠️ Toutes les apps de replica-n8n.github.io partagent le même localStorage :
   une seule clé, préfixée, et jamais de clear(). On AJOUTE des champs au fil des
   versions, on n'en renomme aucun : un champ absent est rempli par etatVide(),
   un champ inconnu (écrit par une version plus récente) est gardé tel quel. */
import { etatVide } from "./jeu.js";

export const CLE = "ppm:donnees";

export function lireEtat(stockage) {
  try {
    const brut = stockage && stockage.getItem(CLE);
    if (!brut) return etatVide();
    const lu = JSON.parse(brut);
    if (!lu || typeof lu !== "object" || Array.isArray(lu)) return etatVide();
    return { ...etatVide(), ...lu };
  } catch (e) {
    return etatVide();
  }
}

/* Rend false si le navigateur refuse (navigation privée, quota) : le jeu continue,
   seule la progression n'est pas gardée. */
export function ecrireEtat(stockage, etat) {
  try {
    stockage.setItem(CLE, JSON.stringify(etat));
    return true;
  } catch (e) {
    return false;
  }
}
