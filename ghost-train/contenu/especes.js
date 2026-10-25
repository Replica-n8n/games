// Les espèces : des données, pas de logique (leur comportement est dans moteur/fantomes.js).
//   pv       points de vie du rayon (1 = une seconde et demie de rayon sans étourdir)
//   taille   largeur dans le monde (en unités du couloir)
//   pieces   lâchées à la capture
//   hostile  compte dans le total des fantômes de la mission (et donc dans la note)
//   bloque   le wagon ne repart pas tant qu'il est là
//   lutte    se débat quand le rayon le tient
//   carnet   la page du carnet où il se range

/** @type {Record<string, {pv?: number, taille: number, pieces?: number, hostile?: boolean, bloque?: boolean, lutte?: boolean, carnet?: string, prio?: number}>} */
export const ESPECES = {
  goule: { pv: 1, taille: 0.9, pieces: 3, hostile: true, bloque: true, lutte: true, carnet: 'goule' },
  gouleVol: { pv: 0.5, taille: 0.7, pieces: 2, hostile: true, lutte: true, carnet: 'goule' },
  majordome: { pv: 8, taille: 2.2, pieces: 20, hostile: true, bloque: true, lutte: true, carnet: 'majordome' },
  leurre: { pv: 0.25, taille: 2.2 },
  assiette: { pv: 0.12, taille: 0.42 },
  lumi: { taille: 0.85 },
  levier: { taille: 0.95 },
  // un secret passe APRÈS les fantômes sous le viseur : un fantôme devant le cache
  secret: { taille: 0.7, prio: 1 },
};

/** Le texte du carnet (étape 3) et le nom affiché. */
export const CARNET = {
  goule: { nom: 'LA GOULE' },
  majordome: { nom: 'LE MAJORDOME' },
};
