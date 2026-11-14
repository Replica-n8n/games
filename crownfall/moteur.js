// Moteur de règles SOLO du jeu du trône (titre provisoire).
//
// Pur : aucun accès au DOM, aucune horloge, aucun Math.random. Tout le hasard
// sort de `etat.alea`, donc même graine + mêmes actions = même partie.
// L'état est un objet simple, gelé, qui passe par JSON sans perte.
//
// Source des règles : le livret officiel de Regicide (RegicideRulesA4.pdf).
// Les sections citées en commentaire portent leur titre anglais du livret
// (SETUP, STEP ONE..FOUR, ANIMAL COMPANIONS, COMBOS, ENEMY IMMUNITY,
// DRAWING A DEFEATED ENEMY, YIELDING, GAME END, SOLO PLAY).
//
// Vocabulaire : le Château est la pile des 12 ennemis, la Taverne la pioche.
// Une carte est une chaîne « rang + lettre de couleur » : 'AC' (As de Cœur),
// '7K' (7 de Carreau), '10T' (10 de Trèfle), 'VP' (Valet de Pique), 'DC', 'RK'.
// Lettres : C = Cœur, K = Carreau, T = Trèfle, P = Pique.

export const FORMAT = 1;      // forme de l'état sauvegardé
export const MAIN_MAX = 8;    // SOLO PLAY : une seule main, limitée à 8 cartes
export const JOKERS = 2;      // SOLO PLAY : deux Jokers posés à côté

export const COULEURS = Object.freeze({ C: 'coeur', K: 'carreau', T: 'trefle', P: 'pique' });
const RANGS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'V', 'D', 'R'];

// STEP THREE (tableau) : PV et attaque des ennemis.
// DRAWING A DEFEATED ENEMY : en main, Valet 10, Dame 15, Roi 20.
export const FIGURES = Object.freeze({
  V: Object.freeze({ pv: 20, attaque: 10 }),
  D: Object.freeze({ pv: 30, attaque: 15 }),
  R: Object.freeze({ pv: 40, attaque: 20 }),
});

// ANIMAL COMPANIONS : Cœur se résout avant Carreau. Les deux noires
// n'agissent qu'aux étapes 3 (Trèfle) et 4 (Pique), leur ordre est indifférent.
const ORDRE_POUVOIRS = ['coeur', 'carreau', 'pique', 'trefle'];

// Règle de la passe en solo, voir `refusPasser`.
export const PASSES = Object.freeze(['jamais', 'une_fois']);

const CARTES = new Map();
for (const lettre of Object.keys(COULEURS)) {
  for (const rang of RANGS) {
    const figure = rang in FIGURES;
    CARTES.set(rang + lettre, Object.freeze({
      id: rang + lettre,
      rang,
      couleur: COULEURS[lettre],
      figure,
      valeur: rang === 'A' ? 1 : figure ? FIGURES[rang].attaque : Number(rang),
    }));
  }
}

/** Fiche d'une carte ({ id, rang, couleur, figure, valeur }) ou undefined. */
export function carte(id) {
  return CARTES.get(id);
}

/** Les 52 identifiants, dans un ordre fixe. */
export function toutesLesCartes() {
  return [...CARTES.keys()];
}

const somme = (ids) => ids.reduce((t, id) => t + CARTES.get(id).valeur, 0);

// ---------------------------------------------------------------- hasard

// mulberry32 : l'état du générateur est un entier 32 bits, rangé dans l'état
// du jeu. Rend [nombre dans [0, 1[, nouvel état].
function tirer(alea) {
  const a = (alea + 0x6D2B79F5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a];
}

function melanger(cartes, alea) {
  const pile = [...cartes];
  for (let i = pile.length - 1; i > 0; i--) {
    let r;
    [r, alea] = tirer(alea);
    const j = Math.floor(r * (i + 1));
    [pile[i], pile[j]] = [pile[j], pile[i]];
  }
  return [pile, alea];
}

// ---------------------------------------------------------------- état

function geler(objet) {
  for (const valeur of Object.values(objet)) {
    if (valeur && typeof valeur === 'object' && !Object.isFrozen(valeur)) geler(valeur);
  }
  return Object.freeze(objet);
}

// Copie de travail : les tableaux sont recopiés, l'état reçu n'est jamais touché.
function brouillon(etat) {
  return {
    ...etat,
    regles: { ...etat.regles },
    chateau: [...etat.chateau],
    taverne: [...etat.taverne],
    defausse: [...etat.defausse],
    main: [...etat.main],
    table: [...etat.table],
    fin: etat.fin ? { ...etat.fin } : null,
  };
}

/**
 * Nouvelle partie (SETUP + SOLO PLAY).
 * `graine` : entier obligatoire, c'est à l'interface de le choisir.
 * `regles.passer` : 'jamais' (défaut, voir refusPasser) ou 'une_fois'.
 *
 * Forme de l'état :
 *   format, graine, alea, regles: { passer },
 *   phase: 'jouer' | 'defendre' | 'gagne' | 'perdu',
 *   chateau  : ennemis restants, chateau[0] = l'ennemi courant, face visible
 *   taverne  : pioche, taverne[0] = le dessus, la fin = le dessous
 *   defausse : la dernière carte du tableau est celle du dessus
 *   main     : cartes en main, dans l'ordre d'arrivée
 *   table    : cartes jouées contre l'ennemi courant (hors défausse)
 *   degats, bouclier : cumulés contre l'ennemi courant
 *   riposte  : ce qu'il faut couvrir en phase 'defendre', 0 sinon
 *   jokers   : Jokers encore disponibles
 *   aPasse   : le tour précédent était une passe
 *   tour, vaincus,
 *   fin: null | { issue: 'gagne', medaille, jokersUtilises }
 *             | { issue: 'perdu', raison: 'riposte' | 'bloque' }
 */
export function nouvellePartie({ graine, regles = {} } = {}) {
  if (!Number.isFinite(graine)) throw new TypeError('nouvellePartie : il faut une graine (un nombre).');
  const passer = regles.passer ?? 'jamais';
  if (!PASSES.includes(passer)) throw new TypeError(`nouvellePartie : regles.passer inconnu (${passer}).`);

  let alea = graine >>> 0;
  const lettres = Object.keys(COULEURS);
  // SETUP : Rois dessous, Dames au milieu, Valets dessus, chaque groupe
  // mélangé à part.
  let valets, dames, rois, taverne;
  [valets, alea] = melanger(lettres.map((l) => 'V' + l), alea);
  [dames, alea] = melanger(lettres.map((l) => 'D' + l), alea);
  [rois, alea] = melanger(lettres.map((l) => 'R' + l), alea);
  // SETUP : 2 à 10 et les 4 As (Animal Companions) ; aucun Joker dans la
  // Taverne à un joueur.
  [taverne, alea] = melanger(toutesLesCartes().filter((id) => !CARTES.get(id).figure), alea);

  return geler({
    format: FORMAT,
    graine: graine >>> 0,
    alea,
    regles: { passer },
    phase: 'jouer',
    chateau: [...valets, ...dames, ...rois],
    taverne: taverne.slice(MAIN_MAX),
    defausse: [],
    main: taverne.slice(0, MAIN_MAX),
    table: [],
    degats: 0,
    bouclier: 0,
    riposte: 0,
    jokers: JOKERS,
    aPasse: false,
    tour: 1,
    vaincus: 0,
    fin: null,
  });
}

// ---------------------------------------------------------------- lectures

/** L'ennemi courant, ou null si le Château est vide. */
export function ennemi(etat) {
  const fiche = CARTES.get(etat.chateau[0]);
  if (!fiche) return null;
  const { pv, attaque } = FIGURES[fiche.rang];
  return {
    id: fiche.id,
    rang: fiche.rang,
    couleur: fiche.couleur,   // il est immunisé au pouvoir de cette couleur
    pv,
    attaque,
    degats: etat.degats,
    pvRestants: Math.max(0, pv - etat.degats),
    bouclier: etat.bouclier,
    attaqueEffective: Math.max(0, attaque - etat.bouclier),
  };
}

/** Total des valeurs de la main (ce qu'elle peut encaisser au mieux). */
export function valeurMain(etat) {
  return somme(etat.main);
}

/**
 * La main peut-elle couvrir la riposte ? En phase 'defendre', c'est la
 * riposte en cours ; sinon, celle que l'ennemi infligerait maintenant.
 */
export function peutCouvrir(etat) {
  const e = ennemi(etat);
  const due = etat.phase === 'defendre' ? etat.riposte : e ? e.attaqueEffective : 0;
  return valeurMain(etat) >= due;
}

/** Médaille (SOLO PLAY) : 'or' sans Joker, 'argent' avec un, 'bronze' avec deux. null hors victoire. */
export function medaille(etat) {
  if (etat.phase !== 'gagne') return null;
  return ['or', 'argent', 'bronze'][JOKERS - etat.jokers];
}

const refus = (code, raison) => ({ ok: false, code, raison });

function refusListe(cartes) {
  if (!Array.isArray(cartes) || cartes.length === 0) return refus('vide', 'Aucune carte choisie.');
  for (const id of cartes) {
    if (!CARTES.has(id)) return refus('inconnue', `Carte inconnue : ${String(id)}.`);
  }
  if (new Set(cartes).size !== cartes.length) return refus('doublon', 'La même carte est choisie deux fois.');
  return null;
}

/**
 * Une sélection forme-t-elle un coup, indépendamment de la partie en cours ?
 * Rend { ok: true, genre: 'seule' | 'compagnon' | 'combo', valeur }
 * ou { ok: false, code, raison }.
 */
export function analyserSelection(cartes) {
  const r = refusListe(cartes);
  if (r) return r;
  const fiches = cartes.map((id) => CARTES.get(id));
  const valeur = somme(cartes);
  if (fiches.length === 1) return { ok: true, genre: 'seule', valeur };

  // ANIMAL COMPANIONS : un As va seul ou avec UNE autre carte, qui peut être
  // un autre As ou une figure. COMBOS : un As n'entre jamais dans un combo et
  // trois As ne forment pas un combo.
  if (fiches.some((f) => f.rang === 'A')) {
    if (fiches.length === 2) return { ok: true, genre: 'compagnon', valeur };
    return refus('as', 'Un As se joue seul ou avec une seule autre carte.');
  }

  // COMBOS : 2, 3 ou 4 cartes du même rang, total de 10 au plus. Cela exclut
  // de fait les figures (deux Valets = 20) et les paires au-delà de 5.
  if (fiches.some((f) => f.rang !== fiches[0].rang)) {
    return refus('rangs', 'Plusieurs cartes ensemble doivent avoir le même rang (ou un As et une autre carte).');
  }
  if (fiches[0].figure) return refus('figures', 'Les figures ne se combinent pas entre elles.');
  if (valeur > 10) return refus('total', `Un combo ne dépasse pas 10 (ici ${valeur}).`);
  return { ok: true, genre: 'combo', valeur };
}

function refusPhase(etat, attendue) {
  if (etat.phase === 'gagne' || etat.phase === 'perdu') return refus('finie', 'La partie est finie.');
  if (etat.phase !== attendue) {
    return attendue === 'jouer'
      ? refus('phase', 'Il faut d’abord encaisser la riposte.')
      : refus('phase', 'Il n’y a pas de riposte à encaisser.');
  }
  return null;
}

function refusEnMain(etat, cartes) {
  const absente = cartes.find((id) => !etat.main.includes(id));
  return absente ? refus('pas_en_main', `${absente} n’est pas dans la main.`) : null;
}

function refusJouer(etat, cartes) {
  return refusPhase(etat, 'jouer') || refusListe(cartes) || refusEnMain(etat, cartes)
    || (analyserSelection(cartes).ok ? null : analyserSelection(cartes));
}

// YIELDING : « A player may not yield if every other player has yielded on
// their last turn. » Le livret n'a aucune phrase propre au solo. Sans autre
// joueur, la condition est toujours remplie : lue à la lettre, la passe est
// donc INTERDITE en solo. C'est aussi ce qu'applique l'adaptation sous
// licence de Board Game Arena (« A player may not Yield in solo »). D'où le
// défaut 'jamais'. La variante 'une_fois' (passer, mais jamais deux tours de
// suite) reste disponible à la création de la partie.
function refusPasser(etat) {
  const r = refusPhase(etat, 'jouer');
  if (r) return r;
  if (etat.regles.passer === 'jamais') return refus('passe_interdite', 'On ne passe pas en solo.');
  if (etat.aPasse) return refus('passe_repetee', 'Impossible de passer deux tours de suite.');
  return null;
}

// SOLO PLAY : le Joker se retourne a) au début de l'étape 1, avant de jouer,
// ou b) au début de l'étape 4, avant d'encaisser. Ces deux moments sont
// exactement les phases 'jouer' et 'defendre'.
function refusJoker(etat) {
  if (etat.phase === 'gagne' || etat.phase === 'perdu') return refus('finie', 'La partie est finie.');
  if (etat.jokers <= 0) return refus('plus_de_joker', 'Les deux Jokers ont déjà servi.');
  return null;
}

// STEP FOUR : défausser pour un total au moins égal à l'attaque, « one at a
// time ». On s'arrête donc dès que le total est atteint : une sélection dont
// on pourrait retirer une carte sans cesser de couvrir est refusée.
function refusDefausser(etat, cartes) {
  const r = refusPhase(etat, 'defendre') || refusListe(cartes) || refusEnMain(etat, cartes);
  if (r) return r;
  const total = somme(cartes);
  if (total < etat.riposte) {
    return { ...refus('insuffisant', `Il manque ${etat.riposte - total} pour couvrir ${etat.riposte}.`), manque: etat.riposte - total };
  }
  const plusPetite = Math.min(...cartes.map((id) => CARTES.get(id).valeur));
  if (total - plusPetite >= etat.riposte) return refus('excessif', 'Une carte de trop : la riposte est déjà couverte sans elle.');
  return null;
}

const bilan = (r, plus = {}) => (r ? r : { ok: true, ...plus });

/**
 * Ce que la sélection en cours permet. Ne modifie rien.
 * Rend { phase, jouer, defausser, passer, joker, ajoutables } où chacun des
 * quatre premiers vaut { ok: true, ... } ou { ok: false, code, raison }, et
 * `ajoutables` liste les cartes de la main qu'on peut encore ajouter à la
 * sélection sans la rendre illégale (pour griser les autres).
 */
export function coupsLegaux(etat, selection = []) {
  const lisible = Array.isArray(selection) && selection.every((id) => CARTES.has(id));
  const total = lisible ? somme(selection) : 0;
  const jouer = bilan(refusJouer(etat, selection), { valeur: total });
  const defausser = bilan(refusDefausser(etat, selection), { total });
  const libres = lisible ? etat.main.filter((id) => !selection.includes(id)) : [];
  let ajoutables = [];
  if (etat.phase === 'jouer') {
    ajoutables = libres.filter((id) => !refusJouer(etat, [...selection, id]));
  } else if (etat.phase === 'defendre') {
    // Ajoutable tant que la sélection ne couvre pas déjà la riposte.
    ajoutables = total >= etat.riposte ? [] : libres;
  }
  return {
    phase: etat.phase,
    jouer,
    defausser,
    passer: bilan(refusPasser(etat)),
    joker: bilan(refusJoker(etat)),
    ajoutables,
  };
}

function sousEnsembles(ids) {
  const tous = [];
  for (let masque = 1; masque < 1 << ids.length; masque++) {
    tous.push(ids.filter((_, i) => masque & (1 << i)));
  }
  return tous;
}

/** Toutes les actions légales de l'état (pour un robot, un test, une aide). */
export function actionsLegales(etat) {
  const actions = [];
  if (etat.phase === 'jouer') {
    for (const cartes of sousEnsembles(etat.main)) {
      if (cartes.length <= 4 && analyserSelection(cartes).ok) actions.push({ type: 'jouer', cartes });
    }
    if (!refusPasser(etat)) actions.push({ type: 'passer' });
  } else if (etat.phase === 'defendre') {
    for (const cartes of sousEnsembles(etat.main)) {
      if (!refusDefausser(etat, cartes)) actions.push({ type: 'defausser', cartes });
    }
  }
  if (!refusJoker(etat)) actions.push({ type: 'joker' });
  return actions;
}

/**
 * Aperçu d'un coup avant de le valider. Ne modifie rien et ne dévoile aucune
 * carte cachée : les pioches sont données en NOMBRE.
 *
 * Rend { ok: false, code, raison } si le coup est illégal, sinon :
 *   cartes, valeur,
 *   pouvoirs : [{ couleur, x, actif, bloque: null | 'immunite', effet }]
 *       effet : coeur { recyclees }, carreau { piochees },
 *               pique { bouclier (total après) }, trefle { degats }
 *   double, degats (de ce coup), degatsTotal, pvRestants,
 *   vaincu, exact (tué pile à 0), recrute (= exact : il ira sur la Taverne),
 *   victoire (c'était le dernier ennemi),
 *   riposte (0 si vaincu), valeurMainRestante,
 *   couverture : 'aucune' (rien à encaisser), 'oui', 'non',
 *                'selon_pioche' (non couvert, mais le Carreau pioche)
 */
export function apercu(etat, cartes) {
  const r = refusJouer(etat, cartes);
  if (r) return r;
  const cible = ennemi(etat);
  const x = somme(cartes);
  const jouees = new Set(cartes.map((id) => CARTES.get(id).couleur));
  const active = (couleur) => jouees.has(couleur) && couleur !== cible.couleur;

  const recyclees = active('coeur') ? Math.min(x, etat.defausse.length) : 0;
  const place = MAIN_MAX - (etat.main.length - cartes.length);
  const piochees = active('carreau') ? Math.min(x, place, etat.taverne.length + recyclees) : 0;
  const bouclier = etat.bouclier + (active('pique') ? x : 0);
  const double = active('trefle');
  const degats = double ? 2 * x : x;
  const degatsTotal = etat.degats + degats;

  const effets = {
    coeur: { recyclees },
    carreau: { piochees },
    pique: { bouclier },
    trefle: { degats },
  };
  const pouvoirs = ORDRE_POUVOIRS.filter((c) => jouees.has(c)).map((couleur) => ({
    couleur,
    x,
    actif: active(couleur),
    bloque: active(couleur) ? null : 'immunite',
    effet: active(couleur) ? effets[couleur] : null,
  }));

  const vaincu = degatsTotal >= cible.pv;
  const exact = degatsTotal === cible.pv;
  const riposte = vaincu ? 0 : Math.max(0, cible.attaque - bouclier);
  const valeurMainRestante = valeurMain(etat) - x;
  let couverture = 'aucune';
  if (riposte > 0) {
    couverture = valeurMainRestante >= riposte ? 'oui' : piochees > 0 ? 'selon_pioche' : 'non';
  }
  return {
    ok: true,
    cartes: [...cartes],
    valeur: x,
    pouvoirs,
    double,
    degats,
    degatsTotal,
    pvRestants: Math.max(0, cible.pv - degatsTotal),
    vaincu,
    exact,
    recrute: exact,
    victoire: vaincu && etat.chateau.length === 1,
    riposte,
    valeurMainRestante,
    couverture,
  };
}

// ---------------------------------------------------------------- résolution

function piocher(e, combien) {
  const n = Math.max(0, Math.min(combien, MAIN_MAX - e.main.length, e.taverne.length));
  const piochees = e.taverne.splice(0, n);
  e.main.push(...piochees);
  return piochees;
}

function perdre(e, journal, raison) {
  e.phase = 'perdu';
  e.riposte = 0;
  e.fin = { issue: 'perdu', raison };
  journal.push({ type: 'fin', issue: 'perdu', raison });
}

// Début de l'étape 1. GAME END : on perd aussi si l'on ne peut ni jouer ni
// passer. Une main non vide permet toujours de jouer une carte seule ; avec
// une main vide il reste la passe (si la règle l'autorise) ou un Joker.
function debutTour(e, journal) {
  e.phase = 'jouer';
  e.riposte = 0;
  e.tour += 1;
  if (e.main.length === 0 && refusPasser(e) && refusJoker(e)) perdre(e, journal, 'bloque');
}

// Étape 4. Une riposte nulle (bouclier au moins égal à l'attaque) ne demande
// rien : on enchaîne sur le tour suivant. Le moment b) du Joker n'y perd
// rien, puisque le moment a) du tour suivant arrive sans rien entre les deux.
function riposter(e, journal) {
  const cible = ennemi(e);
  const due = cible.attaqueEffective;
  journal.push({ type: 'riposte', montant: due, attaque: cible.attaque, bouclier: e.bouclier });
  if (due === 0) return debutTour(e, journal);
  e.phase = 'defendre';
  e.riposte = due;
  // STEP FOUR : si la main ne suffit pas, c'est perdu... sauf s'il reste un
  // Joker, qui se retourne justement avant d'encaisser.
  if (somme(e.main) < due && e.jokers === 0) perdre(e, journal, 'riposte');
}

function jouer(e, cartes, journal) {
  const cible = ennemi(e);
  const x = somme(cartes);
  e.main = e.main.filter((id) => !cartes.includes(id));
  // Les cartes jouées restent sur la table, hors défausse, jusqu'à la mort
  // de l'ennemi (STEP THREE, ii).
  e.table.push(...cartes);
  e.aPasse = false;
  journal.push({ type: 'joue', cartes: [...cartes], valeur: x });

  // Étape 2. Une couleur ne s'applique qu'une fois, même jouée deux fois
  // (ANIMAL COMPANIONS). ENEMY IMMUNITY : la couleur de l'ennemi est sans
  // effet, mais la valeur compte dans les dégâts.
  const jouees = new Set(cartes.map((id) => CARTES.get(id).couleur));
  let double = false;
  for (const couleur of ORDRE_POUVOIRS) {
    if (!jouees.has(couleur)) continue;
    if (couleur === cible.couleur) {
      journal.push({ type: 'pouvoir', couleur, x, applique: false, raison: 'immunite' });
      continue;
    }
    if (couleur === 'coeur') {
      // HEARTS : mélanger la défausse, en glisser X (ou moins) SOUS la Taverne.
      let melangee;
      [melangee, e.alea] = melanger(e.defausse, e.alea);
      const n = Math.min(x, melangee.length);
      e.taverne.push(...melangee.slice(0, n));
      e.defausse = melangee.slice(n);
      journal.push({ type: 'pouvoir', couleur, x, applique: true, recyclees: n });
    } else if (couleur === 'carreau') {
      // DIAMONDS : jamais au-delà de la main maximale, et aucune pénalité si
      // la Taverne est vide.
      journal.push({ type: 'pouvoir', couleur, x, applique: true, piochees: piocher(e, x) });
    } else if (couleur === 'pique') {
      // SPADES : cumulatif jusqu'à la mort de l'ennemi.
      e.bouclier += x;
      journal.push({ type: 'pouvoir', couleur, x, applique: true, bouclier: e.bouclier });
    } else {
      // CLUBS : tout le total compte double (exemple du livret : 3 de
      // Carreau, Pique et Trèfle = 18 dégâts).
      double = true;
      journal.push({ type: 'pouvoir', couleur, x, applique: true });
    }
  }

  // Étape 3.
  const degats = double ? 2 * x : x;
  e.degats += degats;
  journal.push({ type: 'degats', montant: degats, double, total: e.degats, pv: cible.pv });
  if (e.degats < cible.pv) return riposter(e, journal);

  // STEP THREE (i) : pile à 0, l'ennemi va face cachée sur la Taverne ;
  // sinon à la défausse. (ii) les cartes jouées contre lui vont à la défausse.
  const exact = e.degats === cible.pv;
  e.chateau.shift();
  if (exact) e.taverne.unshift(cible.id);
  else e.defausse.push(cible.id);
  journal.push({ type: 'ennemi_vaincu', ennemi: cible.id, exact, vers: exact ? 'taverne' : 'defausse' });
  journal.push({ type: 'table_defaussee', cartes: [...e.table] });
  e.defausse.push(...e.table);
  e.table = [];
  e.degats = 0;
  e.bouclier = 0;
  e.vaincus += 1;

  if (e.chateau.length === 0) {
    e.phase = 'gagne';
    const jokersUtilises = JOKERS - e.jokers;
    e.fin = { issue: 'gagne', medaille: ['or', 'argent', 'bronze'][jokersUtilises], jokersUtilises };
    journal.push({ type: 'fin', ...e.fin });
    return;
  }
  // (iii) on révèle le suivant, (iv) le joueur rejoue sans riposte.
  journal.push({ type: 'ennemi_revele', ennemi: e.chateau[0] });
  debutTour(e, journal);
}

function retournerJoker(e, journal) {
  // SOLO PLAY : défausser la main, repiocher jusqu'à 8. Cela ne compte pas
  // comme une pioche pour l'immunité d'un ennemi de Carreau, et le Joker
  // n'annule aucune immunité.
  const defaussees = [...e.main];
  e.defausse.push(...defaussees);
  e.main = [];
  const piochees = piocher(e, MAIN_MAX);
  e.jokers -= 1;
  journal.push({ type: 'joker', defaussees, piochees, restants: e.jokers });
  if (e.phase === 'defendre') {
    if (somme(e.main) < e.riposte && e.jokers === 0) perdre(e, journal, 'riposte');
  } else if (e.main.length === 0 && refusPasser(e) && refusJoker(e)) {
    perdre(e, journal, 'bloque');
  }
}

/**
 * Applique une action et rend { ok: true, etat, journal } ou, si elle est
 * illégale, { ok: false, code, raison } (l'état reçu n'est jamais modifié).
 *
 * Actions :
 *   { type: 'jouer', cartes: [...] }      étape 1, puis 2, 3 et l'entrée en 4
 *   { type: 'passer' }                    étape 1, droit à la riposte
 *   { type: 'joker' }                     début de l'étape 1 ou de l'étape 4
 *   { type: 'defausser', cartes: [...] }  étape 4
 *
 * Journal, dans l'ordre où l'interface doit l'animer :
 *   { type: 'joue', cartes, valeur }
 *   { type: 'pouvoir', couleur, x, applique: false, raison: 'immunite' }
 *   { type: 'pouvoir', couleur: 'coeur', x, applique: true, recyclees }
 *   { type: 'pouvoir', couleur: 'carreau', x, applique: true, piochees: [...] }
 *   { type: 'pouvoir', couleur: 'pique', x, applique: true, bouclier }
 *   { type: 'pouvoir', couleur: 'trefle', x, applique: true }
 *   { type: 'degats', montant, double, total, pv }
 *   { type: 'ennemi_vaincu', ennemi, exact, vers: 'taverne' | 'defausse' }
 *   { type: 'table_defaussee', cartes }
 *   { type: 'ennemi_revele', ennemi }
 *   { type: 'passe' }
 *   { type: 'riposte', montant, attaque, bouclier }
 *   { type: 'defausse', cartes, total, riposte }
 *   { type: 'joker', defaussees, piochees, restants }
 *   { type: 'fin', issue: 'gagne', medaille, jokersUtilises }
 *   { type: 'fin', issue: 'perdu', raison: 'riposte' | 'bloque' }
 */
export function appliquer(etat, action) {
  const type = action && action.type;
  let r;
  if (type === 'jouer') r = refusJouer(etat, action.cartes);
  else if (type === 'passer') r = refusPasser(etat);
  else if (type === 'joker') r = refusJoker(etat);
  else if (type === 'defausser') r = refusDefausser(etat, action.cartes);
  else r = refus('action', `Action inconnue : ${String(type)}.`);
  if (r) return r;

  const e = brouillon(etat);
  const journal = [];
  if (type === 'jouer') {
    jouer(e, action.cartes, journal);
  } else if (type === 'passer') {
    // YIELDING : droit à l'étape 4, sans pouvoir ni dégâts.
    e.aPasse = true;
    journal.push({ type: 'passe' });
    riposter(e, journal);
  } else if (type === 'joker') {
    retournerJoker(e, journal);
  } else {
    // STEP FOUR : les cartes encaissées vont à la défausse, dans l'ordre donné.
    e.main = e.main.filter((id) => !action.cartes.includes(id));
    e.defausse.push(...action.cartes);
    journal.push({ type: 'defausse', cartes: [...action.cartes], total: somme(action.cartes), riposte: e.riposte });
    debutTour(e, journal);
  }
  return { ok: true, etat: geler(e), journal };
}
