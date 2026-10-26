// Les affaires inédites : des enquêtes tirées au sort dans le téléphone, à
// partir des lieux et des personnages des enquêtes publiées. Une affaire a un
// numéro : le même numéro redonne exactement la même enquête.
// - « What if » : le lieu et les personnes d'un même univers, mais n'importe
//   qui peut mourir et n'importe qui peut être coupable ;
// - « Grand mélange » : n'importe qui, n'importe où ;
// - l'affaire du jour : un « What if » dont le numéro est la date.
// Pur, sans DOM : tourne dans le navigateur (dans un Worker) comme dans Node.

import { boardOf } from './board.js';
import { validatePuzzle } from './validate.js';
import { generate, rng, classify } from './generate.js';
import { nomCourt, PAWN_COLORS } from './decor.js';
import { textesAffaire } from '../i18n/affaires.js';

/** @typedef {import('./types.js').Puzzle} Puzzle */
/** @typedef {import('./types.js').Difficulty} Difficulty */
/** @typedef {import('./generate.js').Story} Story */
/** @typedef {Omit<import('./types.js').Person, 'clue' | 'testimony'>} Gens */
/** @typedef {Pick<Puzzle, 'collection' | 'theme' | 'floor' | 'size' | 'ambiance' | 'dehors' | 'rooms' | 'layout' | 'furniture'> & { univers: string, places: number }} Lieu */
/** @typedef {{ lieux: Lieu[], gens: Map<string, Gens[]>, tous: Gens[] }} Catalogue */
/** @typedef {'whatif' | 'melange'} Mode */

// Les collections qui réunissent des mondes différents : l'univers y est le lieu
// (Égypte, Crète, Asgard et Rome ne se mélangent pas en « What if »).
const PAR_LIEU = ['Mythologies', 'Grands classiques', 'Agatha Christie', "Les invités de l'Arcade"];

/** L'univers d'une enquête. @param {Pick<Puzzle, 'collection' | 'theme'>} p */
export const universDe = (p) => (PAR_LIEU.includes(p.collection ?? '') ? p.theme : p.collection ?? p.theme);

/** Les lieux et les gens des enquêtes publiées. Les grandes grilles (8×8) sont
 *  laissées de côté : un téléphone y chercherait trop longtemps.
 *  @param {Puzzle[]} puzzles @returns {Catalogue} */
export function catalogue(puzzles) {
  /** @type {Lieu[]} */ const lieux = [];
  /** @type {Map<string, Gens[]>} */ const gens = new Map();
  const vus = new Set(), lieuxVus = new Set();
  for (const p of puzzles) {
    if (p.size > 7) continue;
    const u = universDe(p);
    if (!lieuxVus.has(p.theme)) {
      lieuxVus.add(p.theme);
      lieux.push({ univers: u, places: p.persons.length, collection: p.collection, theme: p.theme, floor: p.floor, size: p.size, ambiance: p.ambiance, dehors: p.dehors, rooms: p.rooms, layout: p.layout, furniture: p.furniture });
    }
    for (const x of p.persons) {
      if (vus.has(x.name)) continue;
      vus.add(x.name);
      const { clue, testimony, victim, color, ...reste } = x;
      const g = { ...reste, role: x.role.replace(/, victime$/, ''), color: '' };
      gens.set(u, [...(gens.get(u) ?? []), g]);
    }
  }
  return { lieux, gens, tous: [...gens.values()].flat() };
}

/** Les univers où l'on peut jouer un « What if » (assez de monde pour le lieu). @param {Catalogue} cat */
export const universJouables = (cat) => [...new Set(cat.lieux.filter((l) => (cat.gens.get(l.univers)?.length ?? 0) >= l.places).map((l) => l.univers))];

/** Le numéro de l'affaire du jour : la date, 20261026. @param {Date} d */
export const numeroDuJour = (d) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

/**
 * Tire au sort une histoire : lieu, distribution, victime, coupable, pièce du crime.
 * @param {Catalogue} cat @param {{ mode: Mode, numero: number, univers?: string, jour?: boolean }} o
 * @returns {(Story & { aveu: string, sousTitre: string }) | null}
 */
export function tirer(cat, { mode, numero, univers, jour }) {
  const R = rng(numero * 7919 + (mode === 'melange' ? 1 : 0));
  const pick = (/** @type {any[]} */ xs) => xs[Math.floor(R() * xs.length)];
  const melanger = (/** @type {any[]} */ xs) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const jouables = universJouables(cat);
  const u = mode === 'whatif' ? (univers && jouables.includes(univers) ? univers : pick(jouables)) : undefined;
  const lieu = pick(cat.lieux.filter((l) => (u ? l.univers === u : true) && (!u || (cat.gens.get(u)?.length ?? 0) >= l.places)));
  if (!lieu) return null;
  const pool = melanger(u ? cat.gens.get(u) ?? [] : cat.tous);
  // La victime d'abord ; puis des suspects aux initiales toutes différentes (les notes au crayon).
  const [victime, ...autres] = pool;
  /** @type {Gens[]} */ const suspects = [];
  const initiales = new Set();
  for (const g of autres) {
    if (suspects.length === lieu.places - 1) break;
    const i = nomCourt(g.name)[0];
    if (initiales.has(i)) continue;
    initiales.add(i);
    suspects.push(g);
  }
  if (suspects.length < lieu.places - 1) return null;
  const couleurs = melanger(PAWN_COLORS);
  const ids = 'ABCDEFGHIJKLMNOPQRSTU';
  const persons = [
    ...suspects.map((g, k) => ({ ...g, id: ids[k], color: couleurs[k] })),
    { ...victime, id: 'V', color: 'victime', victim: true },
  ];
  const coupable = pick(persons.filter((p) => !p.victim)).id;
  const { univers: _u, places: _p, ...decor } = lieu;
  const base = { ...decor, persons, culprit: coupable };
  const crimes = melanger(lieu.rooms.map((/** @type {import('./types.js').Room} */ r) => r.id)).filter((id) => !impasse({ ...base, crimeRoom: id }));
  if (!crimes.length) return null;
  const crimeRoom = crimes[0];
  const textes = textesAffaire(base, { mode, numero, jour, univers: lieu.univers, culprit: coupable, crimeRoom, R });
  return { ...base, ...textes, id: 'affaire', collection: lieu.collection, crimeRoom };
}

/** Un univers dans une adresse : « Le Trône de fer » -> « le-trone-de-fer ». @param {string} u */
export const slugUnivers = (u) => u.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** L'identifiant d'une affaire, qui suffit à la refaire : affaire-whatif-cluedo-m4266,
 *  affaire-melange-x-f3110, affaire-jour-20261026.
 *  @param {{ mode: Mode, numero: number, univers?: string, jour?: boolean, penche: Difficulty }} o */
export const idAffaire = (o) => (o.jour ? `affaire-jour-${Math.floor(o.numero / 100)}` : `affaire-${o.mode}-${o.univers ? slugUnivers(o.univers) : 'x'}-${o.penche[0]}${o.numero}`);

/** L'affaire du jour : le premier numéro du jour qui donne une affaire moyenne.
 *  Le même pour tout le monde, puisque tout se calcule depuis la date.
 *  @param {Catalogue} cat @param {number} jour 20261026 @returns {Puzzle | null} */
export function affaireDuJour(cat, jour) {
  /** @type {Puzzle | null} */ let repli = null;
  for (let k = 0; k < 100; k++) {
    const p = essai(cat, { mode: 'whatif', numero: jour * 100 + k, jour: true, penche: 'moyen' });
    if (p?.difficulty === 'moyen') return p;
    repli ??= p;
  }
  return repli;
}

/** Refait une affaire depuis son identifiant (un lien partagé, une sauvegarde perdue).
 *  @param {Catalogue} cat @param {string} id @returns {Puzzle | null} */
export function depuisId(cat, id) {
  const jour = /^affaire-jour-(\d{8})$/.exec(id);
  if (jour) return affaireDuJour(cat, Number(jour[1]));
  const m = /^affaire-(whatif|melange)-([a-z0-9-]+)-([fmd])(\d+)$/.exec(id);
  if (!m) return null;
  const univers = m[2] === 'x' ? undefined : universJouables(cat).find((u) => slugUnivers(u) === m[2]);
  if (m[2] !== 'x' && !univers) return null;
  const penche = /** @type {Difficulty} */ ({ f: 'facile', m: 'moyen', d: 'difficile' }[m[3]]);
  return essai(cat, { mode: /** @type {Mode} */ (m[1]), univers, numero: Number(m[4]), penche });
}

/**
 * Un essai : le numéro tire l'histoire ET la graine, donc un numéro donne
 * toujours la même affaire (ou aucune). La difficulté n'est pas choisie mais
 * MESURÉE : `penche` n'oriente que le choix des témoignages.
 * @param {Catalogue} cat @param {{ mode: Mode, numero: number, univers?: string, jour?: boolean, penche: Difficulty }} o
 * @returns {Puzzle | null}
 */
export function essai(cat, o) {
  const story = tirer(cat, o);
  if (!story) return null;
  /** @type {Difficulty | null} */ let mesure = null;
  const p = generate(story, o.penche, o.numero, (d) => { mesure = d.reveals === 0 ? classify(d.levels) : null; return mesure !== null; });
  if (!p || !mesure) return null;
  p.difficulty = mesure;
  p.id = idAffaire(o);
  return p;
}

/**
 * Cherche, à partir de `numero`, la première affaire de la difficulté voulue.
 * `budget` borne le temps (ms) ; null si rien trouvé.
 * @param {Catalogue} cat @param {{ mode: Mode, numero: number, univers?: string, jour?: boolean, difficulty: Difficulty, budget?: number }} o
 * @returns {{ puzzle: Puzzle, essais: number, ms: number } | null}
 */
export function affaire(cat, { difficulty, budget = 60000, ...o }) {
  const t0 = Date.now();
  for (let k = 0; Date.now() - t0 < budget; k++) {
    const p = essai(cat, { ...o, numero: o.numero + k, penche: difficulty });
    if (p?.difficulty === difficulty) return { puzzle: p, essais: k + 1, ms: Date.now() - t0 };
  }
  return null;
}

/** Ce qui rend un plan impossible à remplir, ou null. Le coupable et la victime
 *  sont seuls dans la pièce du crime : il y faut deux cases libres sur deux
 *  lignes ET deux colonnes ; et chaque ligne, chaque colonne a quelqu'un.
 *  @param {any} story @returns {string | null} */
export function impasse(story) {
  // Le plan lui-même d'abord (une pièce coupée en deux, un meuble hors plan…) : vu sur Macbeth.
  const plan = validatePuzzle({ ...story, difficulty: 'facile', solution: {}, persons: story.persons.map((/** @type {any} */ p) => ({ ...p, clue: { type: 'seated' }, testimony: 'x' })) })
    .errors.filter((/** @type {string} */ e) => /pièce|plan|Meuble|ligne|colonne/.test(e) && !/[Ss]olution/.test(e));
  if (plan.length) return plan.join(' ; ');
  const b = boardOf(story);
  for (let i = 0; i < story.size; i++) {
    if (!b.free.some(([r]) => r === i)) return `la ligne ${i + 1} n'a aucune case libre`;
    if (!b.free.some(([, c]) => c === i)) return `la colonne ${String.fromCharCode(65 + i)} n'a aucune case libre`;
  }
  if (story.crimeRoom) {
    const k = b.free.filter(([r, c]) => b.room(r, c) === story.crimeRoom);
    const paires = k.flatMap(([r, c]) => k.filter(([R, C]) => R > r && C !== c).map(([R, C]) => [r, c, R, C]));
    if (!paires.length) return `la pièce du crime (${story.crimeRoom}) n'a pas deux cases libres sur deux lignes et deux colonnes`;
    // Les autres doivent tenir hors des lignes et colonnes du crime : une colonne dont les
    // seules cases libres sont sur ces lignes reste vide (vu sur le presbytère).
    const ok = paires.some(([r1, c1, r2, c2]) => {
      const lignes = new Set([r1, r2]), cols = new Set([c1, c2]);
      for (let i = 0; i < story.size; i++) {
        if (!lignes.has(i) && !b.free.some(([r, c]) => r === i && !cols.has(c) && b.room(r, c) !== story.crimeRoom)) return false;
        if (!cols.has(i) && !b.free.some(([r, c]) => c === i && !lignes.has(r) && b.room(r, c) !== story.crimeRoom)) return false;
      }
      return true;
    });
    if (!ok) return `aucune place pour le coupable et la victime ne laisse une case libre à chaque autre ligne et colonne`;
  }
  return null;
}
