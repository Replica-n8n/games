// Les fantômes et ce qu'ils lancent. pv : ce que le rayon doit aspirer (il aspire
// 1,6 par seconde) ; pieces : ce que rapporte une capture ; croit : de combien il
// grandit par seconde en venant vers nous (il frappe à 2,4) ; taille : sa toile en
// pixels (le dessin, contour compris), qui donne sa boîte à l'écran.
//   lutte : se débat quand le rayon le tient (et se « slamme » aux combles)
//   cache : invisible tant que le flash ne l'a pas révélé (on ne voit que ses yeux)
//   garde : un livre qui tourne autour du Bibliothécaire et le protège
//   ami   : on ne le capture pas (le chat, Lumi)
export const ESPECES = {
  ecto: { pv: 1.2, pieces: 3, croit: 0.3, lutte: true, taille: [34, 34] },
  drap: { pv: 0.9, pieces: 3, croit: 0.4, lutte: true, taille: [36, 38] },
  crane: { pv: 1.0, pieces: 4, croit: 0.45, lutte: true, taille: [28, 28] },
  ombre: { pv: 1.0, pieces: 8, croit: 0.2, lutte: true, cache: true, taille: [33, 42] },
  livre: { pv: 0.5, pieces: 2, croit: 0.38, taille: [22, 19] },
  saxo: { pv: 1.3, pieces: 4, croit: 0.35, lutte: true, taille: [36, 42] },
  crachat: { pv: 0.12, pieces: 1, tir: true, taille: [11, 11] },
  assiette: { pv: 0.12, pieces: 1, tir: true, taille: [15, 15] },
  note: { pv: 0.12, pieces: 1, tir: true, taille: [12, 13] },
  tirLivre: { pv: 0.2, pieces: 1, tir: true, taille: [22, 19] },
  garde: { pv: 0.3, pieces: 1, garde: true, taille: [22, 19] },
  majordome: { pv: 7, pieces: 30, boss: true, lutte: true, taille: [38, 46], nom: "LE MAÎTRE D'HÔTEL" },
  bibliothecaire: { pv: 9, pieces: 35, boss: true, lutte: true, taille: [42, 50], nom: 'LE BIBLIOTHÉCAIRE' },
  chef: { pv: 8, pieces: 40, boss: true, lutte: true, taille: [42, 50], nom: "LE CHEF D'ORCHESTRE" },
  gouvernante: { pv: 12, pieces: 50, boss: true, lutte: true, taille: [42, 52], nom: 'LA GOUVERNANTE' },
  // on ne les capture pas
  chat: { pv: Infinity, pieces: 0, ami: true, taille: [22, 16] },
  lumi: { pv: Infinity, pieces: 0, ami: true, taille: [24, 30] },
};
