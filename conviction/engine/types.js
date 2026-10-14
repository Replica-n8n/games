// Types du moteur, en JSDoc : vérifiés par `tsc --checkJs`, aucun build.
// Une case est [ligne, colonne], numérotées depuis 0. « C2 » = colonne C,
// ligne 2, soit [1, 2].

/** @typedef {readonly [number, number]} Pos */

/** @typedef {'block' | 'seat' | 'floor'} FurnitureKind */

/**
 * @typedef {'etagere' | 'piano' | 'cheminee' | 'fourneau' | 'table' | 'plante'
 *   | 'fontaine' | 'fauteuil' | 'canape' | 'chaise' | 'banc'} FurnitureType
 */

/** @typedef {{ id: string, name: string }} Room */

/** @typedef {{ type: FurnitureType, cells: Pos[] }} FurniturePiece */

/** @typedef {'north' | 'south' | 'east' | 'west'} Dir */

/**
 * Indice déclaratif. Jamais de fonction dans les données.
 * - `relative` : je suis au `dir` de `person`. `distance` = écart exact de
 *   lignes (nord, sud) ou de colonnes (est, ouest) ; `aligned` = même colonne
 *   (nord, sud) ou même ligne (est, ouest).
 * - `aloneWith` : dans la même pièce que `person`, et personne d'autre.
 * - `alone` : seul dans sa pièce.
 * @typedef {{ type: 'besideObject', object: FurnitureType }
 *   | { type: 'onObject', object: FurnitureType }
 *   | { type: 'inRoom', room: string }
 *   | { type: 'seated' }
 *   | { type: 'row', index: number }
 *   | { type: 'column', index: number }
 *   | { type: 'relative', person: string, dir: Dir, distance?: number, aligned?: boolean }
 *   | { type: 'besidePerson', person: string }
 *   | { type: 'sameRoom', person: string }
 *   | { type: 'aloneWith', person: string }
 *   | { type: 'alone' }
 *   | { type: 'not', clue: Clue }
 *   | { type: 'and', clues: Clue[] }
 *   | { type: 'or', clues: Clue[] }} Clue
 */

/**
 * @typedef {{
 *   id: string, name: string, role: string, color: string,
 *   victim?: boolean, clue: Clue, testimony: string
 * }} Person
 */

/** @typedef {'facile' | 'moyen' | 'difficile'} Difficulty */

/**
 * @typedef {{
 *   id: string, title: string, theme: string, difficulty: Difficulty,
 *   size: number, intro: string, floor: string,
 *   rooms: Room[], layout: string[], furniture: FurniturePiece[],
 *   persons: Person[], solution: Record<string, Pos>, verdict: string
 * }} Puzzle
 */

/** Placement partiel ou complet : id de personne -> case. */
/** @typedef {Record<string, Pos>} Placement */

/** Logique à trois valeurs : `null` = pas encore décidable. */
/** @typedef {boolean | null} Tri */

export {};
