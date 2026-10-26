// Les espèces : des données, pas de logique (leur comportement est dans moteur/fantomes.js).
//   pv       points de vie du rayon (1 = une seconde et demie de rayon sans étourdir)
//   taille   largeur dans le monde (en unités du couloir)
//   pieces   lâchées à la capture
//   hostile  compte dans le total des fantômes de la mission (et donc dans la note)
//   bloque   le wagon ne repart pas tant qu'il est là
//   lutte    se débat quand le rayon le tient (et se « slamme » à partir du Grenier)
//   boss     entre en fondu, a une barre de vie, et sa capture finit la mission
//   tir      projectile : un coup de rayon le détruit, il blesse s'il arrive au wagon
//   carnet   la page du carnet où il se range

/** @type {Record<string, {pv?: number, taille: number, pieces?: number, hostile?: boolean, bloque?: boolean, lutte?: boolean, boss?: boolean, tir?: boolean, carnet?: string, prio?: number, nom?: string}>} */
export const ESPECES = {
  goule: { pv: 1, taille: 0.9, pieces: 3, hostile: true, bloque: true, lutte: true, carnet: 'goule' },
  gouleVol: { pv: 0.5, taille: 0.7, pieces: 2, hostile: true, lutte: true, carnet: 'goule' },
  majordome: { pv: 8, taille: 2.2, pieces: 20, hostile: true, bloque: true, lutte: true, boss: true, carnet: 'majordome', nom: 'LE MAJORDOME' },
  leurre: { pv: 0.25, taille: 2.2 },
  // la Bibliothèque
  drap: { pv: 2, taille: 1.1, pieces: 5, hostile: true, bloque: true, lutte: true, carnet: 'drap' },
  // l'Ombre retient le wagon tant qu'elle rôde : partie après le départ, elle comptait comme ratée
  ombre: { pv: 1, taille: 0.85, pieces: 8, hostile: true, bloque: true, lutte: true, carnet: 'ombre' },
  bibliothecaire: { pv: 9, taille: 2.2, pieces: 25, hostile: true, bloque: true, lutte: true, boss: true, carnet: 'bibliothecaire', nom: 'LE BIBLIOTHÉCAIRE' },
  livre: { pv: 0.3, taille: 0.6 },
  // la Salle de bal
  saxo: { pv: 1.3, taille: 1, pieces: 4, hostile: true, bloque: true, lutte: true, carnet: 'saxo' },
  chef: { pv: 10, taille: 2.2, pieces: 30, hostile: true, bloque: true, lutte: true, boss: true, carnet: 'chef', nom: "LE CHEF D'ORCHESTRE" },
  // le Grenier
  crane: { pv: 1.4, taille: 0.8, pieces: 4, hostile: true, bloque: true, lutte: true, carnet: 'crane' },
  gouvernante: { pv: 12, taille: 2.4, pieces: 40, hostile: true, bloque: true, lutte: true, boss: true, carnet: 'gouvernante', nom: 'LA GOUVERNANTE' },
  // les projectiles
  assiette: { pv: 0.12, taille: 0.42, tir: true },
  note: { pv: 0.12, taille: 0.42, tir: true },
  ecto: { pv: 0.12, taille: 0.38, tir: true },
  tirLivre: { pv: 0.2, taille: 0.55, tir: true },
  lumi: { taille: 0.85 },
  levier: { taille: 0.95 },
  // un secret passe APRÈS les fantômes sous le viseur : un fantôme devant le cache
  secret: { taille: 0.7, prio: 1 },
};

/** Le nom affiché (carnet, à l'étape 3). */
export const CARNET = {
  goule: { nom: 'LA GOULE' }, majordome: { nom: 'LE MAJORDOME' },
  drap: { nom: 'LE DRAP' }, ombre: { nom: "L'OMBRE" }, bibliothecaire: { nom: 'LE BIBLIOTHÉCAIRE' },
  saxo: { nom: 'LE SAXOPHONISTE' }, chef: { nom: "LE CHEF D'ORCHESTRE" },
  crane: { nom: 'LE CRÂNE CRACHEUR' }, gouvernante: { nom: 'LA GOUVERNANTE' },
};
