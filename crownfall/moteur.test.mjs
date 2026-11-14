// Tests du moteur solo. Lancer depuis ce dossier : node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  nouvellePartie, appliquer, analyserSelection, coupsLegaux, actionsLegales,
  apercu, ennemi, peutCouvrir, medaille, toutesLesCartes, MAIN_MAX,
} from './moteur.js';

// Fabrique un état précis à partir d'une vraie partie : on remplace les piles
// voulues, puis on range toutes les cartes restantes dans la défausse (ou la
// Taverne) pour que les 52 cartes restent comptées une fois.
function etatDe(champs, { reste = 'taverne', regles } = {}) {
  const base = nouvellePartie({ graine: 1, regles });
  const e = {
    ...base, main: [], table: [], defausse: [], taverne: [], chateau: ['VP'], ...champs,
  };
  const prises = new Set([...e.main, ...e.table, ...e.defausse, ...e.taverne, ...e.chateau]);
  const libres = toutesLesCartes().filter((id) => !prises.has(id));
  // Les figures absentes du château sont rangées dans la défausse.
  if (!('reste' in champs)) e[reste] = [...e[reste], ...libres];
  return JSON.parse(JSON.stringify(e));
}

function jouer(etat, ...cartes) {
  const r = appliquer(etat, { type: 'jouer', cartes });
  assert.ok(r.ok, r.raison);
  return r;
}

const compter = (e) => [...e.chateau, ...e.taverne, ...e.defausse, ...e.main, ...e.table];

function verifierCartes(e) {
  const toutes = compter(e);
  assert.equal(toutes.length, 52, 'il faut 52 cartes');
  assert.equal(new Set(toutes).size, 52, 'aucune carte en double');
}

// ------------------------------------------------------------ sélections

test('As + Roi (21) est autorisé', () => {
  assert.deepEqual(analyserSelection(['AC', 'RP']), { ok: true, genre: 'compagnon', valeur: 21 });
  assert.equal(analyserSelection(['AC', 'AK']).ok, true);
});

test('une paire de Valets est interdite', () => {
  assert.equal(analyserSelection(['VC', 'VK']).ok, false);
});

test('2-2-2-2, 3-3-3, 5-5 autorisés ; 6-6 interdit', () => {
  assert.equal(analyserSelection(['2C', '2K', '2T', '2P']).valeur, 8);
  assert.equal(analyserSelection(['3C', '3K', '3T']).valeur, 9);
  assert.equal(analyserSelection(['5C', '5K']).valeur, 10);
  assert.equal(analyserSelection(['6C', '6K']).code, 'total');
});

test('un As ne rejoint pas un combo, rangs mêlés refusés', () => {
  assert.equal(analyserSelection(['AC', '2K', '2T']).code, 'as');
  assert.equal(analyserSelection(['AC', 'AK', 'AT']).code, 'as');
  assert.equal(analyserSelection(['3C', '4K']).code, 'rangs');
});

// ------------------------------------------------------------ pouvoirs

test('As de Cœur + 7 de Carreau : X = 8, Cœur recycle 8 PUIS Carreau pioche 8', () => {
  // Taverne vide : le Carreau ne peut piocher que ce que le Cœur vient d'y glisser.
  const e = etatDe({ main: ['AC', '7K'], taverne: [] }, { reste: 'defausse' });
  const { etat, journal } = jouer(e, 'AC', '7K');
  const coeur = journal.find((j) => j.couleur === 'coeur');
  const carreau = journal.find((j) => j.couleur === 'carreau');
  assert.equal(coeur.recyclees, 8);
  assert.equal(carreau.piochees.length, 8);
  assert.ok(journal.indexOf(coeur) < journal.indexOf(carreau));
  assert.equal(etat.main.length, 8);
  verifierCartes(etat);
});

test('le Carreau est limité par la main maximale', () => {
  const main = ['AC', '7K', '2T', '3T', '4T', '5T'];
  const e = etatDe({ main });
  const { etat, journal } = jouer(e, 'AC', '7K');
  assert.equal(journal.find((j) => j.couleur === 'carreau').piochees.length, MAIN_MAX - 4);
  assert.equal(etat.main.length, MAIN_MAX);
});

test('5 de Trèfle + 5 de Cœur contre un ennemi de Trèfle : 10 dégâts, Cœur actif', () => {
  const e = etatDe({ chateau: ['VT'], main: ['5T', '5C'] }, { reste: 'defausse' });
  const { etat, journal } = jouer(e, '5T', '5C');
  assert.equal(etat.degats, 10);
  assert.deepEqual(journal.find((j) => j.couleur === 'trefle'), { type: 'pouvoir', couleur: 'trefle', x: 10, applique: false, raison: 'immunite' });
  assert.equal(journal.find((j) => j.couleur === 'coeur').recyclees, 10);
});

test('le Trèfle double tout le total', () => {
  const e = etatDe({ chateau: ['DC'], main: ['3K', '3P', '3T'] });
  const { etat } = jouer(e, '3K', '3P', '3T');
  assert.equal(etat.degats, 18);
  assert.equal(etat.bouclier, 9);
});

test('Carreau avec Taverne vide : aucune pioche, pas de défaite', () => {
  const e = etatDe({ main: ['5K', '10C'], taverne: [] }, { reste: 'defausse' });
  const { etat, journal } = jouer(e, '5K');
  assert.deepEqual(journal.find((j) => j.couleur === 'carreau').piochees, []);
  assert.equal(etat.phase, 'defendre');
  assert.equal(etat.riposte, 10);
});

test('Cœur avec défausse vide : aucun effet', () => {
  const e = etatDe({ main: ['5C', '10K'], defausse: [] });
  const { etat, journal } = jouer(e, '5C');
  assert.equal(journal.find((j) => j.couleur === 'coeur').recyclees, 0);
  assert.equal(etat.taverne.length, e.taverne.length);
});

// ------------------------------------------------------------ riposte

test('bouclier au moins égal à l’attaque : riposte nulle, rien à défausser', () => {
  const e = etatDe({ chateau: ['VK'], main: ['10P', '2C'] });
  const { etat, journal } = jouer(e, '10P'); // contre VK : immunité Carreau, pas Pique
  assert.equal(journal.find((j) => j.type === 'riposte').montant, 0);
  assert.equal(etat.phase, 'jouer');
  assert.equal(etat.tour, e.tour + 1);
  assert.deepEqual(etat.main, ['2C']);
});

test('Pique contre un ennemi de Pique : pas de bouclier', () => {
  const e = etatDe({ chateau: ['VP', 'VC'], main: ['5P', '10C'] });
  const { etat } = jouer(e, '5P');
  assert.equal(etat.bouclier, 0);
  assert.equal(etat.riposte, 10);
});

test('le bouclier retombe à zéro à la mort de l’ennemi', () => {
  const e = etatDe({ chateau: ['VC', 'VK'], main: ['8P', '10T', '2C'] });
  let { etat } = jouer(e, '8P');
  assert.equal(etat.bouclier, 8);
  ({ etat } = appliquer(etat, { type: 'defausser', cartes: ['2C'] }));
  ({ etat } = jouer(etat, '10T'));
  assert.equal(etat.chateau[0], 'VK');
  assert.equal(etat.bouclier, 0);
  assert.equal(etat.degats, 0);
  assert.equal(etat.phase, 'jouer'); // rejoue sans riposte
});

test('défausser : il faut couvrir, sans carte de trop', () => {
  const e = etatDe({ main: ['3C', '10C', '9T', '2T'] });
  const { etat } = jouer(e, '3C'); // riposte 10
  assert.equal(appliquer(etat, { type: 'defausser', cartes: ['9T'] }).code, 'insuffisant');
  assert.equal(appliquer(etat, { type: 'defausser', cartes: ['10C', '2T'] }).code, 'excessif');
  assert.equal(appliquer(etat, { type: 'defausser', cartes: ['9T', '2T'] }).ok, true);
});

test('ne pas pouvoir couvrir sans Joker : perdu', () => {
  const e = etatDe({ main: ['2C', '3T'], jokers: 0 });
  const { etat, journal } = jouer(e, '2C');
  assert.equal(etat.phase, 'perdu');
  assert.deepEqual(etat.fin, { issue: 'perdu', raison: 'riposte' });
  assert.equal(journal.at(-1).type, 'fin');
});

// ------------------------------------------------------------ ennemi vaincu

test('ennemi tué pile à 0 : sur la Taverne, pioché au Carreau suivant', () => {
  const e = etatDe({ chateau: ['VC', 'DP'], degats: 15, main: ['5P', '2K'] });
  let { etat, journal } = jouer(e, '5P');
  assert.equal(journal.find((j) => j.type === 'ennemi_vaincu').vers, 'taverne');
  assert.equal(etat.taverne[0], 'VC');
  assert.ok(etat.defausse.includes('5P'));
  ({ etat } = jouer(etat, '2K'));
  assert.ok(etat.main.includes('VC'));
  verifierCartes(etat);
});

test('ennemi tué au-delà : à la défausse', () => {
  const e = etatDe({ chateau: ['VC', 'DP'], degats: 15, main: ['6P'] });
  const { etat } = jouer(e, '6P');
  assert.equal(etat.defausse.at(-2), 'VC');
  assert.notEqual(etat.taverne[0], 'VC');
});

test('une figure recrutée vaut sa valeur et garde son pouvoir', () => {
  const e = etatDe({ chateau: ['DP'], main: ['VK'], taverne: ['2C', '3C'] }, { reste: 'defausse' });
  const { etat } = jouer(e, 'VK');
  assert.equal(etat.degats, 10);
  assert.deepEqual(etat.main, ['2C', '3C']);
});

test('dernier Roi vaincu : gagné', () => {
  const e = etatDe({ chateau: ['RC'], degats: 39, main: ['AP'] });
  const { etat } = jouer(e, 'AP');
  assert.equal(etat.phase, 'gagne');
  assert.equal(medaille(etat), 'or');
});

// ------------------------------------------------------------ passe et main vide

test('en solo, passer est refusé par défaut (YIELDING lu à la lettre)', () => {
  const e = nouvellePartie({ graine: 3 });
  assert.equal(appliquer(e, { type: 'passer' }).code, 'passe_interdite');
});

test('variante une_fois : passer, mais pas deux tours de suite', () => {
  const e = etatDe({ main: ['10C', '10T'], bouclier: 10 }, { regles: { passer: 'une_fois' } });
  const { etat } = appliquer(e, { type: 'passer' });
  assert.equal(etat.phase, 'jouer');
  assert.equal(appliquer(etat, { type: 'passer' }).code, 'passe_repetee');
});

test('main vide (variante une_fois) : passer obligatoire, perdu à la riposte', () => {
  const e = etatDe({ main: [], jokers: 0 }, { regles: { passer: 'une_fois' } });
  assert.deepEqual(actionsLegales(e), [{ type: 'passer' }]);
  const { etat } = appliquer(e, { type: 'passer' });
  assert.deepEqual(etat.fin, { issue: 'perdu', raison: 'riposte' });
});

test('main vide, rien d’autre à faire : perdu (GAME END)', () => {
  const e = etatDe({ chateau: ['VK'], main: ['10P'], jokers: 0 });
  const { etat } = jouer(e, '10P'); // riposte nulle, main vide
  assert.deepEqual(etat.fin, { issue: 'perdu', raison: 'bloque' });
});

test('main vide avec un Joker : on doit le retourner', () => {
  const e = etatDe({ chateau: ['VK'], main: ['10P'], jokers: 1 });
  const { etat } = jouer(e, '10P');
  assert.equal(etat.phase, 'jouer');
  assert.deepEqual(actionsLegales(etat), [{ type: 'joker' }]);
});

// ------------------------------------------------------------ Joker

test('Joker au début de l’étape 1 et de l’étape 4, refusé au troisième', () => {
  let etat = nouvellePartie({ graine: 7 });
  let r = appliquer(etat, { type: 'joker' });
  assert.ok(r.ok);
  assert.equal(r.etat.jokers, 1);
  assert.equal(r.etat.main.length, 8);
  assert.equal(r.journal[0].defaussees.length, 8);
  etat = r.etat;
  // Jouer une petite carte non Pique pour subir une riposte.
  const petite = etat.main.find((id) => !id.endsWith('P') && !id.endsWith('K') && !id.startsWith('10'));
  etat = jouer(etat, petite).etat;
  assert.equal(etat.phase, 'defendre');
  r = appliquer(etat, { type: 'joker' });
  assert.ok(r.ok);
  assert.equal(r.etat.phase, 'defendre');
  assert.equal(r.etat.jokers, 0);
  assert.equal(appliquer(r.etat, { type: 'joker' }).code, 'plus_de_joker');
});

test('Joker refusé une fois la partie finie, et sans annuler l’immunité', () => {
  const fini = etatDe({ chateau: ['RC'], degats: 39, main: ['AP'] });
  const { etat } = jouer(fini, 'AP');
  assert.equal(appliquer(etat, { type: 'joker' }).code, 'finie');
  const e = etatDe({ chateau: ['VT'], main: ['2C'], taverne: ['5T', '6T'], jokers: 1 }, { reste: 'defausse' });
  const apresJoker = appliquer(e, { type: 'joker' }).etat;
  assert.deepEqual(apresJoker.main, ['5T', '6T']);
  const r = jouer(apresJoker, '5T');
  assert.equal(r.etat.degats, 5);
  assert.equal(r.journal.find((j) => j.couleur === 'trefle').applique, false);
});

test('médailles : or 0 Joker, argent 1, bronze 2', () => {
  for (const [jokers, attendue] of [[2, 'or'], [1, 'argent'], [0, 'bronze']]) {
    const e = etatDe({ chateau: ['RC'], degats: 39, main: ['AP'], jokers });
    const { etat } = jouer(e, 'AP');
    assert.equal(medaille(etat), attendue);
    assert.equal(etat.fin.medaille, attendue);
  }
});

test('un Joker à l’étape 4 sauve d’une riposte impossible', () => {
  const e = etatDe({ main: ['2C', '3T'], jokers: 1 });
  const { etat } = jouer(e, '2C');
  assert.equal(etat.phase, 'defendre'); // pas encore perdu
  assert.deepEqual(actionsLegales(etat), [{ type: 'joker' }]);
});

// ------------------------------------------------------------ lectures

test('actions illégales : refus lisible, état intact', () => {
  const e = nouvellePartie({ graine: 2 });
  const copie = JSON.stringify(e);
  const absente = toutesLesCartes().find((id) => !e.main.includes(id) && !id.match(/^[VDR]/));
  const r = appliquer(e, { type: 'jouer', cartes: [absente] });
  assert.equal(r.ok, false);
  assert.match(r.raison, /pas dans la main/);
  assert.equal(appliquer(e, { type: 'defausser', cartes: [e.main[0]] }).code, 'phase');
  assert.equal(appliquer(e, { type: 'voler' }).code, 'action');
  assert.equal(JSON.stringify(e), copie);
  assert.ok(Object.isFrozen(e) && Object.isFrozen(e.main));
});

test('coupsLegaux et ajoutables', () => {
  const e = etatDe({ main: ['5C', '5K', '6C', 'AT', 'RK'] });
  const c = coupsLegaux(e, ['5C']);
  assert.equal(c.jouer.ok, true);
  assert.deepEqual(c.ajoutables.sort(), ['5K', 'AT']);
  assert.equal(coupsLegaux(e, ['AT']).ajoutables.length, 4);
  assert.equal(coupsLegaux(e, ['5C', '6C']).jouer.ok, false);
  assert.equal(coupsLegaux(e).passer.code, 'passe_interdite');
});

test('aperçu : immunité, recrue, riposte et couverture', () => {
  const e = etatDe({ chateau: ['VC', 'DP'], degats: 12, main: ['8C', '10T', '3P'] });
  const a = apercu(e, ['8C']);
  assert.deepEqual(a.pouvoirs, [{ couleur: 'coeur', x: 8, actif: false, bloque: 'immunite', effet: null }]);
  assert.equal(a.vaincu && a.exact && a.recrute, true);
  assert.equal(a.riposte, 0);
  const b = apercu(e, ['3P']);
  assert.equal(b.vaincu, false);
  assert.equal(b.riposte, 7);
  assert.equal(b.couverture, 'oui');
  assert.equal(apercu(e, ['5C']).ok, false);
  assert.equal(ennemi(e).pvRestants, 8);
  assert.equal(peutCouvrir(e), true);
});

// ------------------------------------------------------------ hasard et robot

function robot(graine, regles, choixGraine = graine) {
  let etat = nouvellePartie({ graine, regles });
  let alea = (choixGraine * 2654435761) >>> 0;
  const hasard = () => { alea = (Math.imul(alea, 1664525) + 1013904223) >>> 0; return alea / 4294967296; };
  const actions = [];
  for (let pas = 0; pas < 3000 && etat.phase !== 'gagne' && etat.phase !== 'perdu'; pas++) {
    const possibles = actionsLegales(etat);
    assert.ok(possibles.length > 0, `graine ${graine} : aucune action en phase ${etat.phase}`);
    const action = possibles[Math.floor(hasard() * possibles.length)];
    if (action.type === 'jouer') {
      const a = apercu(etat, action.cartes);
      const r = appliquer(JSON.parse(JSON.stringify(etat)), action); // la sauvegarde rejoue pareil
      assert.ok(r.ok, r.raison);
      if (r.etat.phase !== 'perdu' || r.etat.fin.raison !== 'bloque') {
        assert.equal(r.etat.chateau[0] !== etat.chateau[0], a.vaincu);
        if (!a.vaincu) assert.equal(r.journal.find((j) => j.type === 'riposte').montant, a.riposte);
        else assert.equal(r.journal.some((j) => j.type === 'riposte'), false);
      }
      etat = r.etat;
    } else {
      const r = appliquer(etat, action);
      assert.ok(r.ok, r.raison);
      etat = r.etat;
    }
    actions.push(action);
    verifierCartes(etat);
  }
  return { etat, actions };
}

test('même graine et mêmes actions = même partie', () => {
  const a = robot(42);
  const b = robot(42);
  assert.deepEqual(a.etat, b.etat);
  let etat = nouvellePartie({ graine: 42 });
  for (const action of a.actions) etat = appliquer(etat, action).etat;
  assert.deepEqual(etat, a.etat);
  assert.notDeepEqual(nouvellePartie({ graine: 43 }).main, nouvellePartie({ graine: 42 }).main);
});

test('robot au hasard sur 300 graines : jamais de plantage, toujours une fin, 52 cartes', () => {
  const issues = { gagne: 0, perdu: 0 };
  for (let g = 1; g <= 300; g++) {
    const { etat } = robot(g, g % 2 ? undefined : { passer: 'une_fois' });
    assert.ok(etat.phase === 'gagne' || etat.phase === 'perdu', `graine ${g} sans fin`);
    issues[etat.phase]++;
  }
  assert.equal(issues.gagne + issues.perdu, 300);
});
