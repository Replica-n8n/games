// L'atelier des affaires inédites : un Worker, pour que l'écran ne fige jamais
// pendant qu'on fabrique une enquête (un essai prend 0,5 à 1 s sur un
// téléphone, et il en faut souvent plusieurs). Il lit les enquêtes publiées
// (depuis le cache hors ligne), puis répond à trois ordres :
// - { cmd: 'jour', jour } : l'affaire du jour ;
// - { cmd: 'refaire', id } : une affaire depuis son identifiant ;
// - { cmd: 'chercher', taches, depart, pas } : des essais sans fin, numéro
//   après numéro, à tour de rôle sur les tâches ; chaque affaire réussie est
//   envoyée (la page range, et arrête l'atelier quand elle a ce qu'il faut).

import { catalogue, essai, affaireDuJour, depuisId } from '../engine/procedural.js';

/** @typedef {import('../engine/procedural.js').Catalogue} Catalogue */

/** @type {Promise<Catalogue> | null} */
let cat = null;
const charger = async () => {
  const ids = await (await fetch('../puzzles/index.json')).json();
  return catalogue(await Promise.all(ids.map(async (/** @type {string} */ id) => (await fetch(`../puzzles/${id}.json`)).json())));
};

self.onmessage = async (/** @type {MessageEvent} */ ev) => {
  const m = ev.data;
  cat ??= charger();
  const c = await cat;
  if (m.cmd === 'jour') self.postMessage({ type: 'jour', puzzle: affaireDuJour(c, m.jour) });
  else if (m.cmd === 'refaire') self.postMessage({ type: 'refaire', puzzle: depuisId(c, m.id) });
  else if (m.cmd === 'chercher') {
    for (let k = 0; ; k++) {
      const t = m.taches[k % m.taches.length];
      const numero = m.depart + k * m.pas;
      const p = essai(c, { mode: t.mode, univers: t.univers, numero, penche: t.difficulty });
      self.postMessage({ type: 'essai', puzzle: p, tache: t });
      // Rendre la main entre deux essais : un ordre d'arrêt passe par terminate(), mais la page respire.
      await new Promise((ok) => setTimeout(ok, 0));
    }
  }
};
