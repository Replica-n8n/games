// La note d'une mission, de S à C, sur quatre critères : part des fantômes
// capturés, Lumi épargné, cœurs perdus et parfaits (à partir de la salle de bal).
// ⚠️ SEUILS PROVISOIRES : ils seront réglés par le robot (étape 4 du plan),
// jamais au jugé. Ils ne servent qu'à faire tourner la gare en attendant.

export const SEUILS = {
  S: { part: 0.95, perdus: 0 },
  A: { part: 0.85, perdus: 1 },
  B: { part: 0.65, perdus: 3 },
};

/** @param {{prises: number, total: number, lumi: string, coeursPerdus: number}} b */
export function noteDe(b) {
  const part = b.total ? b.prises / b.total : 1;
  const lumiOk = b.lumi !== 'touche';
  if (lumiOk && part >= SEUILS.S.part && b.coeursPerdus <= SEUILS.S.perdus) return 'S';
  if (lumiOk && part >= SEUILS.A.part && b.coeursPerdus <= SEUILS.A.perdus) return 'A';
  if (part >= SEUILS.B.part && b.coeursPerdus <= SEUILS.B.perdus) return 'B';
  return 'C';
}
