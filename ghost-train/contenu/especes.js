// Les fantômes et ce qu'ils lancent. pv : ce que le rayon doit aspirer (il aspire
// 1,6 par seconde) ; pieces : ce que rapporte une capture ; croit : de combien il
// grandit par seconde en venant vers nous (il frappe à 2,4) ; taille : sa toile en
// pixels (le dessin, contour compris), qui donne sa boîte à l'écran.
export const ESPECES = {
  ecto: { pv: 1.2, pieces: 3, croit: 0.3, taille: [34, 34] },
  drap: { pv: 0.9, pieces: 3, croit: 0.4, taille: [36, 38] },
  crane: { pv: 1.0, pieces: 4, croit: 0.45, taille: [28, 28] },
  crachat: { pv: 0.12, pieces: 1, tir: true, taille: [11, 11] },
  assiette: { pv: 0.12, pieces: 1, tir: true, taille: [15, 15] },
  majordome: { pv: 7, pieces: 30, boss: true, taille: [38, 46], nom: "LE MAÎTRE D'HÔTEL" },
  // le chat des fausses alertes : on ne le capture pas
  chat: { pv: Infinity, pieces: 0, ami: true, taille: [22, 16] },
};
