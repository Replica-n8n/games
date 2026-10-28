// Progression d'une séance à l'autre : missions finies, astronautes délivrés, armes
// découvertes, cristaux, améliorations du Hangar. Pur : la lecture et l'écriture
// dans le navigateur vivent dans sauvegarde.js.
import { LISTE_ARMES } from './tirs.js';

export const PLANETES_ORDRE = ['jungle', 'desert', 'ocean', 'ceinture'];
/** Les missions de chaque planète, dans l'ordre du chemin (la secrète est à part). */
export const CHEMINS = {
  jungle: ['j1', 'j2', 'j3', 'j4', 'j5', 'jboss'],
  desert: ['d1', 'd2', 'd3', 'd4', 'd5', 'dboss'],
  ocean: ['o1', 'o2', 'o3', 'o4', 'o5', 'oboss'],
  ceinture: ['c1', 'c2', 'c3', 'c4', 'c5', 'cboss'],
};
export const ORDRE_GLOBAL = PLANETES_ORDRE.flatMap((p) => CHEMINS[p]);
/** La mission secrète de chaque planète : hors du chemin, ouverte par un exploit (le copain). */
export const SECRETES = { jungle: 'jsecret', desert: 'dsecret', ocean: 'osecret', ceinture: 'csecret' };
const MODULES = ['avion', 'rover', 'sousmarin', 'vaisseau'];
/** Prix de chaque niveau, par amélioration. Réglés sur les cristaux qu'une mission LÂCHE
 *  (tools/patrouille-economie.mjs) : environ un achat par mission, jamais tout au maximum
 *  avant le boss. Les cœurs coûtent plus cher : un cœur de plus pèse plus que tout le reste
 *  sur la difficulté (mesuré par tools/patrouille-robot.mjs). */
export const PRIX_HANGAR = { tir: [60, 130, 220], aimant: [60, 130, 220], coeur: [100, 200, 320] };
export const VERSION_SAUVEGARDE = 1;

export function sauvegardeVide() {
  return {
    version: VERSION_SAUVEGARDE,
    cristaux: 0,
    armes: [],
    missions: {},
    hangar: Object.fromEntries(MODULES.map((m) => [m, { tir: 0, coeur: 0, aimant: 0 }])),
    secrets: Object.fromEntries(PLANETES_ORDRE.map((p) => [p, false])),
    derniere: null,
  };
}

const entier = (v, min, max) => (Number.isFinite(v) ? Math.max(min, Math.min(max, Math.floor(v))) : min);

/** Rend une sauvegarde valide à partir de n'importe quoi (vide, corrompue, ancienne). */
export function normaliser(brut) {
  const s = sauvegardeVide();
  if (!brut || typeof brut !== 'object') return s;
  s.cristaux = entier(brut.cristaux, 0, 1e7);
  if (Array.isArray(brut.armes)) s.armes = [...new Set(brut.armes.filter((a) => LISTE_ARMES.includes(a)))];
  if (brut.missions && typeof brut.missions === 'object' && !Array.isArray(brut.missions)) {
    for (const [id, m] of Object.entries(brut.missions)) {
      if (!m || typeof m !== 'object') continue;
      s.missions[id] = { fini: m.fini === true, cages: Array.isArray(m.cages) ? [...new Set(m.cages.filter((c) => typeof c === 'string'))] : [] };
    }
  }
  if (brut.hangar && typeof brut.hangar === 'object') {
    for (const m of MODULES) {
      const h = brut.hangar[m];
      if (h && typeof h === 'object') s.hangar[m] = { tir: entier(h.tir, 0, 3), coeur: entier(h.coeur, 0, 3), aimant: entier(h.aimant, 0, 3) };
    }
  }
  if (brut.secrets && typeof brut.secrets === 'object') for (const p of PLANETES_ORDRE) s.secrets[p] = brut.secrets[p] === true;
  if (typeof brut.derniere === 'string') s.derniere = brut.derniere;
  return s;
}

const fini = (s, id) => s.missions[id]?.fini === true;

/** Une mission est ouverte si c'est la toute première, ou si la précédente du chemin est finie
 *  (la première d'une planète s'ouvre quand le boss de la planète d'avant est battu). */
export function estOuverte(s, id) {
  const planeteSecrete = Object.keys(SECRETES).find((p) => SECRETES[p] === id);
  if (planeteSecrete) return s.secrets?.[planeteSecrete] === true;
  const i = ORDRE_GLOBAL.indexOf(id);
  if (i < 0) return false;
  return i === 0 || fini(s, ORDRE_GLOBAL[i - 1]);
}

/** La mission que propose « Continuer » : la première non finie parmi celles qui existent. */
export function prochaine(s, existantes = ORDRE_GLOBAL) {
  for (const id of ORDRE_GLOBAL) if (existantes.includes(id) && !fini(s, id)) return id;
  return existantes[existantes.length - 1] ?? 'j1';
}

/** Ajoute le résultat d'une mission réussie. Renvoie une nouvelle sauvegarde. */
export function appliquerBilan(s0, bilan) {
  const s = normaliser(JSON.parse(JSON.stringify(s0)));
  const m = (s.missions[bilan.mission] ||= { fini: false, cages: [] });
  m.fini = true;
  for (const c of bilan.cages ?? []) if (!m.cages.includes(c)) m.cages.push(c);
  for (const a of bilan.nouvellesArmes ?? []) if (!s.armes.includes(a) && LISTE_ARMES.includes(a)) s.armes.push(a);
  s.cristaux += Math.max(0, Math.floor(bilan.cristaux ?? 0));
  if (bilan.copainSauve && bilan.ouvreSecret && s.secrets[bilan.ouvreSecret] !== undefined) s.secrets[bilan.ouvreSecret] = true;
  s.derniere = bilan.mission;
  return s;
}

/** Achète le niveau suivant d'une amélioration ; renvoie la sauvegarde, inchangée si impossible. */
export function acheter(s0, module, amelio) {
  const s = normaliser(JSON.parse(JSON.stringify(s0)));
  const n = s.hangar[module]?.[amelio];
  if (n === undefined || n >= 3 || s.cristaux < PRIX_HANGAR[amelio][n]) return s;
  s.cristaux -= PRIX_HANGAR[amelio][n];
  s.hangar[module][amelio] = n + 1;
  return s;
}
