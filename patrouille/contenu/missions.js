// Toutes les missions qui existent, rangées par identifiant.
import { MISSIONS_JUNGLE } from './missions-jungle.js';

/** @type {Record<string, any>} */
export const MISSIONS = { ...MISSIONS_JUNGLE };
export const MISSIONS_EXISTANTES = Object.keys(MISSIONS);
