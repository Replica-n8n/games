// Point d'entrée du moteur : logique pure, sans DOM, utilisable dans le
// navigateur comme dans Node (tests et validation des enquêtes).
export { evaluateClue } from './clues.js';
export { solve } from './solver.js';
export { findCulprit } from './culprit.js';
export { validatePuzzle } from './validate.js';
export { nextHint, hintChain, rateDifficulty, LEVEL } from './hint.js';
export { boardOf, coord, samePos } from './board.js';
export { FURNITURE } from './furniture.js';
