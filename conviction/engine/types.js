// Types du moteur, en JSDoc : vérifiés par `tsc --checkJs`, aucun build.
// Une case est [ligne, colonne], numérotées depuis 0. « C2 » = colonne C,
// ligne 2, soit [1, 2].

/** @typedef {readonly [number, number]} Pos */

/** @typedef {'block' | 'seat' | 'floor'} FurnitureKind */

/**
 * @typedef {'etagere' | 'piano' | 'cheminee' | 'fourneau' | 'table' | 'plante'
 *   | 'fontaine' | 'fauteuil' | 'canape' | 'chaise' | 'banc' | 'bureau' | 'tonneau'
 *   | 'coffre' | 'armure' | 'statue' | 'armoire' | 'comptoir' | 'lit' | 'banquette'
 *   | 'trone' | 'transat' | 'tabouret' | 'tapis' | 'ancre' | 'champignon' | 'souche' | 'rocher' | 'nenuphar' | 'pissenlit' | 'corail' | 'anemone' | 'coquillage'
 *   | 'ecran' | 'cuve' | 'sphere' | 'console' | 'capsule' | 'arbre' | 'siege'
 *   | 'obelisque' | 'sphinx' | 'palmier' | 'barque' | 'sarcophage' | 'jarre' | 'brasero'} FurnitureType
 */

/**
 * Pièce. `material` = son sol, dessiné sur le plan (voir decor.js).
 * @typedef {{ id: string, name: string, material: string, in?: string }} Room
 */

/**
 * Apparence d'une personne, dessinée en portrait (voir decor.js pour les
 * valeurs permises et ui/buste.js pour le dessin). Une créature des autres
 * jeux de l'Arcade n'a qu'une `espece` (ui/bete.js).
 * @typedef {{
 *   skin?: string, hair?: string, hairColor?: string, outfit?: string,
 *   hat?: string, extras?: string[], espece?: string, perso?: string,
 * }} Look
 */

/** Un meuble par case de `cells` ; avec `grand`, UN seul objet dessiné sur toutes (un rectangle). @typedef {{ type: FurnitureType, cells: Pos[], grand?: boolean }} FurniturePiece */

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
 *   id: string, name: string, role: string, color: string, look: Look,
 *   victim?: boolean, fem?: boolean, clue: Clue, testimony: string
 * }} Person
 */

/** @typedef {'facile' | 'moyen' | 'difficile'} Difficulty */

/** Lumière posée sur la maquette (voir style.css). @typedef {'jour' | 'soir' | 'nuit' | 'neige' | 'bougie' | 'orage'} Ambiance */
/** Ce qu'on voit sur les cases hors plan (« . »). @typedef {'nuages' | 'nuit-etoilee' | 'mer' | 'rails' | 'fleuve'} Dehors */

/**
 * @typedef {{
 *   id: string, title: string, theme: string, difficulty: Difficulty,
 *   size: number, intro: string, floor: string, ambiance?: Ambiance, dehors?: Dehors,
 *   collection?: string, source?: string, chapitre?: number, sousTitre?: string, aveu?: string,
 *   plan?: number,
 *   rooms: Room[], layout: string[], furniture: FurniturePiece[],
 *   persons: Person[], solution: Record<string, Pos>, verdict: string
 * }} Puzzle
 */

/** Placement partiel ou complet : id de personne -> case. */
/** @typedef {Record<string, Pos>} Placement */

/** Logique à trois valeurs : `null` = pas encore décidable. */
/** @typedef {boolean | null} Tri */

export {};
