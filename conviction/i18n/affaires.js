// Les textes des affaires inédites (engine/procedural.js) : écrits à trous,
// puisque personne ne les écrit à la main. Une affaire tire un mobile, et le
// mobile donne à la fois la fin du dénouement et l'aveu du coupable.
// Textes pour un enfant de 8 ans : « retrouvé mort », jamais de détail cru.

import { np, de, que } from './fr.js';
import { inRoom } from './temoignages.js';

/** @typedef {import('../engine/types.js').Puzzle} Puzzle */
/** @typedef {import('../engine/types.js').Person} Person */
/** @typedef {{ name: string, fem?: boolean }} Qui */
/** @typedef {{ verdict: (c: Qui, v: Qui) => string, aveu: (v: Qui) => string }} Mobile */

/** Le début de phrase : « Le Colonel Moutarde », « Watson ». @param {string} n */
const Np = (n) => { const x = np(n); return x.charAt(0).toUpperCase() + x.slice(1); };
/** « pour lui seul », « pour elle seule ». @param {Qui} q */
const pourSoi = (q) => (q.fem ? 'pour elle seule' : 'pour lui seul');

/** Les mobiles de tous les univers. @type {Mobile[]} */
const MOBILES = [
  { verdict: (c, v) => `${Np(v.name)} avait découvert le secret ${de(c.name)}, et allait tout raconter.`, aveu: (v) => `${Np(v.name)} savait tout. Un mot de plus, et tout le monde l'apprenait : je ne pouvais pas laisser faire.` },
  { verdict: (c, v) => `${Np(c.name)} voulait prendre la place ${de(v.name)}, depuis des années.`, aveu: () => `J'attendais mon tour depuis si longtemps. Il n'arrivait jamais, alors je l'ai pris.` },
  { verdict: (c, v) => `${Np(v.name)} avait gagné une dispute de trop contre ${np(c.name)}.`, aveu: () => `Toujours raison, toujours le dernier mot ! Cette fois, c'est moi qui ai eu le dernier mot.` },
  { verdict: (c, v) => `${Np(c.name)} croyait ${que(v.name)} cachait un trésor, et le voulait ${pourSoi(c)}.`, aveu: () => `Un trésor caché, et pas une pièce pour moi ? J'ai voulu ma part.` },
  { verdict: (c, v) => `${Np(v.name)} avait surpris ${np(c.name)} en train de tricher.`, aveu: () => `Je ne triche jamais… presque jamais. Et il fallait que ce soit justement ce jour-là.` },
  { verdict: (c, v) => `Une vieille jalousie : ${np(c.name)} n'avait jamais supporté que l'on préfère ${np(v.name)}.`, aveu: (v) => `Tout le monde préférait ${np(v.name)}. Moi, on ne me regardait jamais.` },
  { verdict: (c, v) => `${Np(v.name)} avait promis de garder un secret ${de(c.name)}, et venait de changer d'avis.`, aveu: () => `Une promesse est une promesse. Ce n'est pas moi qui l'ai rompue la première.` },
];
/** Les mobiles propres à un univers, en plus des autres. @type {Record<string, Mobile[]>} */
const PAR_UNIVERS = {
  'Le Trône de fer': [{ verdict: (c) => `${Np(c.name)} voulait le Trône de fer, et il n'y a qu'un trône.`, aveu: () => `Quand on joue au jeu des trônes, on gagne ou on meurt. Je n'avais pas envie de perdre.` }],
  'Le jeu de cartes': [{ verdict: (c) => `${Np(c.name)} voulait choisir l'atout du prochain tournoi.`, aveu: () => `L'atout, c'est tout. Qui choisit l'atout gagne la partie.` }],
  Cluedo: [{ verdict: (c) => `${Np(c.name)} venait d'apprendre que le testament ne lui laissait rien.`, aveu: () => `Rien, pas un sou, après toutes ces années ! Le testament devait changer.` }],
  'One Piece': [{ verdict: (c, v) => `${Np(c.name)} cherchait le One Piece, et ${np(v.name)} avait une carte.`, aveu: () => `Une carte vers le trésor le plus célèbre du monde. N'importe qui l'aurait prise.` }],
  'Sherlock Holmes': [{ verdict: (c, v) => `${Np(c.name)} voulait une lettre ${que(v.name)} gardait sous clé.`, aveu: () => `Cette lettre, c'était ma ruine. Il fallait la reprendre, coûte que coûte.` }],
};

/** Le nom d'un univers à l'écran, quand celui des données dit mal de quoi il s'agit. */
const NOMS = /** @type {Record<string, string>} */ ({ 'Affaires originales': 'Valcourt', 'Château du Glandier': 'La chambre jaune', 'Écosse': 'Macbeth', 'Danemark': 'Hamlet' });
/** @param {string} u */
export const nomUnivers = (u) => NOMS[u] ?? u;
/** Le visage qui dit un univers au premier coup d'œil. */
export const EMBLEMES_UNIVERS = /** @type {Record<string, string>} */ ({
  'Affaires originales': 'Victor', 'Sherlock Holmes': 'Dr Watson', 'Hercule Poirot': 'Dragomiroff', 'Village anglais': 'Clement',
  'Le Trône de fer': 'Cersei', 'Château du Glandier': 'Frédéric Larsan', 'Écosse': 'Lady Macbeth', 'Danemark': 'Hamlet',
  'Cluedo': 'Colonel Moutarde', 'Benoit Blanc': 'Harlan Thrombey', 'La forêt du chevalier': 'Le Crapaud', 'Le golfe du requin': 'Le Bouledogue',
  'One Piece': 'Sabo', "L'Égypte des dieux": 'Anubis', 'La Crète': 'Le Minotaure', 'Asgard': 'Thor', 'Rome': 'Jules César', 'Le jeu de cartes': 'Judith',
});

/** Les moments de la journée, pour l'intro. */
const MOMENTS = { jour: 'en plein jour', soir: 'un soir', nuit: 'en pleine nuit', neige: 'un soir de neige', bougie: 'à la lueur des bougies', orage: "un soir d'orage" };

/**
 * Le titre, l'intro, le dénouement et l'aveu d'une affaire.
 * @param {Omit<Puzzle, 'solution' | 'difficulty' | 'persons'> & { persons: Omit<Person, 'clue' | 'testimony'>[] }} p
 * @param {{ mode: 'whatif' | 'melange', numero: number, jour?: boolean, univers: string, culprit: string, crimeRoom: string, R: () => number }} o
 */
export function textesAffaire(p, { mode, numero, jour, univers, culprit, crimeRoom, R }) {
  const v = /** @type {Omit<Person, 'clue' | 'testimony'>} */ (p.persons.find((x) => x.victim));
  const c = /** @type {Omit<Person, 'clue' | 'testimony'>} */ (p.persons.find((x) => x.id === culprit));
  const mobiles = [...MOBILES, ...(mode === 'whatif' ? PAR_UNIVERS[univers] ?? [] : [])];
  const m = mobiles[Math.floor(R() * mobiles.length)];
  const mort = v.fem ? 'retrouvée morte' : 'retrouvé mort';
  const lui = v.fem ? 'elle' : 'lui';
  const moment = MOMENTS[p.ambiance ?? 'soir'] ?? 'un soir';
  const lieu = p.floor;
  const suspects = p.persons.filter((x) => !x.victim);
  const debut = mode === 'melange'
    ? `Une porte s'est ouverte entre les mondes. ${Np(suspects[0].name)}, ${np(suspects[1].name)}, ${np(suspects[2].name)} et les autres sont tous arrivés au même endroit : ${lieu}, ${moment}.`
    : `Et si, cette fois, tout s'était passé autrement ? ${lieu}, ${moment}.`;
  const seul = c.fem ? 'seule' : 'seul';
  return {
    title: jour ? 'L\'affaire du jour' : `Affaire n° ${numero}`,
    sousTitre: mode === 'melange' ? 'Grand mélange' : `What if · ${nomUnivers(univers)}`,
    intro: `${debut} ${Np(v.name)}, ${v.role}, est ${mort}. Qui était seul avec ${lui} ?`,
    verdict: `${Np(c.name)} était ${seul} avec ${np(v.name)} ${inRoom(/** @type {any} */ (p), crimeRoom)}. ${m.verdict(c, v)}`,
    aveu: m.aveu(v),
  };
}
