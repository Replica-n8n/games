// Toutes les missions qui existent, rangées par identifiant.
import { MISSIONS_JUNGLE } from './missions-jungle.js';
import { MISSIONS_DESERT } from './missions-desert.js';

/** @type {Record<string, any>} */
export const MISSIONS = { ...MISSIONS_JUNGLE, ...MISSIONS_DESERT };
export const MISSIONS_EXISTANTES = Object.keys(MISSIONS);
