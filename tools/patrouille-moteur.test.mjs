// La Patrouille des Étoiles : tests du moteur (pur, sans DOM).
//   node --test tools/patrouille-moteur.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creeHasard } from '../patrouille/moteur/hasard.js';
import { MODULES, nouveauJoueur, piloter } from '../patrouille/moteur/pilotage.js';
import { ARMES } from '../patrouille/moteur/tirs.js';
import { creePartie, pasPartie, prendreCadeau, tirEnnemi } from '../patrouille/moteur/partie.js';
import { sauvegardeVide, normaliser, estOuverte, prochaine, appliquerBilan } from '../patrouille/moteur/progression.js';
import { MISSIONS } from '../patrouille/contenu/missions.js';

const RIEN = { touche: false, dx: 0, dy: 0, super: false };
const geste = (dx, dy = 0) => ({ touche: true, dx, dy, super: false });
const partieVide = (opts = {}) => {
  const p = creePartie({ mission: MISSIONS.j1, graine: 7, sauvegarde: sauvegardeVide(), ...opts });
  p.vagues = []; // pas d'ennemis : on teste une mécanique à la fois
  return p;
};

// ---------- Hasard ----------
test('hasard : même graine, même suite', () => {
  const a = creeHasard(42), b = creeHasard(42);
  for (let i = 0; i < 100; i++) assert.equal(a.suivant(), b.suivant());
  const c = creeHasard(43);
  assert.notEqual(creeHasard(42).suivant(), c.suivant());
});

// ---------- Pilotage ----------
for (const m of ['rover', 'sousmarin', 'vaisseau']) {
  test(`pilotage ${m} : aucun demi-tour au lâcher après des va-et-vient`, () => {
    const M = MODULES[m], j = nouveauJoueur(M);
    j.x = 180;
    for (let r = 0; r < 3; r++) { for (let k = 0; k < 12; k++) piloter(j, M, geste(12)); for (let k = 0; k < 12; k++) piloter(j, M, geste(-12)); }
    let demi = 0, sens = 0;
    for (let k = 0; k < 300; k++) {
      const x0 = j.x; piloter(j, M, RIEN); const d = j.x - x0;
      const s = Math.abs(d) < 0.05 ? 0 : Math.sign(d);
      if (s && sens && s !== sens) demi++;
      if (s) sens = s;
    }
    assert.equal(demi, 0);
  });
}
test('pilotage : un courant fait dériver le sous-marin doigt levé', () => {
  const M = MODULES.sousmarin, j = nouveauJoueur(M);
  j.x = 180;
  for (let k = 0; k < 90; k++) piloter(j, M, RIEN, { fx: 0.14, fy: 0, lent: 1 });
  assert.ok(j.x - 180 > 40, `dérive ${j.x - 180}`);
});
test('pilotage : le sable mou ralentit le rover', () => {
  const M = MODULES.rover;
  const vitesse = (lent) => { const j = nouveauJoueur(M); j.x = 60; for (let k = 0; k < 40; k++) piloter(j, M, geste(20), { fx: 0, fy: 0, lent }); return j.x; };
  assert.ok(vitesse(0.45) < vitesse(1) - 30);
});
test('pilotage : l\'avion suit le doigt vite et sans dépasser', () => {
  const M = MODULES.avion, j = nouveauJoueur(M);
  j.x = j.cx = 90;
  piloter(j, M, geste(150));
  let max = 0;
  for (let k = 0; k < 20; k++) { piloter(j, M, RIEN); max = Math.max(max, j.x); }
  assert.ok(Math.abs(j.x - 240) < 2);
  assert.ok(max <= 240.5);
});
test('pilotage : le module reste dans sa zone et dans l\'écran', () => {
  for (const m of Object.keys(MODULES)) {
    const M = MODULES[m], j = nouveauJoueur(M);
    for (let k = 0; k < 200; k++) piloter(j, M, geste(30, 30));
    assert.ok(j.x <= 344 && j.y <= M.zone[1], m);
    for (let k = 0; k < 200; k++) piloter(j, M, geste(-30, -30));
    assert.ok(j.x >= 16 && j.y >= M.zone[0], m);
  }
});

// ---------- Armes ----------
test('arme : les munitions s\'épuisent, puis retour au tir de base', () => {
  const p = partieVide();
  prendreCadeau(p, { arme: 'crayon' });
  assert.equal(p.arme.k, 'crayon');
  for (let k = 0; k < ARMES.crayon.mun * ARMES.crayon.cad + 30; k++) pasPartie(p, RIEN);
  assert.equal(p.arme, null);
});
test('arme : en ramasser une autre la remplace, munitions pleines', () => {
  const p = partieVide();
  prendreCadeau(p, { arme: 'crayon' });
  for (let k = 0; k < 100; k++) pasPartie(p, RIEN);
  prendreCadeau(p, { arme: 'bulles' });
  assert.equal(p.arme.k, 'bulles');
  assert.equal(p.arme.mun, ARMES.bulles.mun);
});

// ---------- Bonus et coups ----------
test('tir rouge : il retire un cœur ; tir bleu : il remplit le super sans blesser', () => {
  const p = partieVide();
  const c0 = p.coeurs;
  tirEnnemi(p, p.j.x, p.j.y - 20, Math.PI / 2, 2, true);
  for (let k = 0; k < 20; k++) pasPartie(p, RIEN);
  assert.equal(p.coeurs, c0);
  assert.ok(p.jauge > 0);
  tirEnnemi(p, p.j.x, p.j.y - 20, Math.PI / 2, 2, false);
  for (let k = 0; k < 20; k++) pasPartie(p, RIEN);
  assert.equal(p.coeurs, c0 - 1);
});
test('bouclier : il encaisse un coup à la place d\'un cœur', () => {
  const p = partieVide();
  prendreCadeau(p, { bonus: 'bouclier' });
  tirEnnemi(p, p.j.x, p.j.y - 20, Math.PI / 2, 2, false);
  for (let k = 0; k < 20; k++) pasPartie(p, RIEN);
  assert.equal(p.coeurs, p.coeursMax);
  assert.equal(p.bouclier, false);
});
test('étoile : invincible pendant 5 s', () => {
  const p = partieVide();
  prendreCadeau(p, { bonus: 'etoile' });
  tirEnnemi(p, p.j.x, p.j.y - 20, Math.PI / 2, 2, false);
  for (let k = 0; k < 20; k++) pasPartie(p, RIEN);
  assert.equal(p.coeurs, p.coeursMax);
});
test('cœur : jamais plus que le maximum', () => {
  const p = partieVide();
  prendreCadeau(p, { bonus: 'coeur' });
  assert.equal(p.coeurs, p.coeursMax);
});
test('plus de cœurs : la partie passe à « mort »', () => {
  const p = partieVide();
  for (let n = 0; n < p.coeursMax; n++) {
    p.j.inv = 0;
    tirEnnemi(p, p.j.x, p.j.y - 20, Math.PI / 2, 2, false);
    for (let k = 0; k < 20; k++) pasPartie(p, RIEN);
  }
  assert.equal(p.etat, 'mort');
});

// ---------- Cages ----------
test('cage : la détruire délivre l\'astronaute et lâche son cadeau', () => {
  const p = partieVide();
  const id = Object.keys(p.mission.cages)[0];
  const e = p.ajouterCage(id, p.j.x, p.j.y - 120);
  for (let k = 0; k < 400 && !p.cagesLibres.includes(id); k++) pasPartie(p, RIEN);
  assert.ok(p.cagesLibres.includes(id));
  assert.ok(e.mort);
});

// ---------- Partie : déterminisme et fin ----------
test('partie : même graine et mêmes gestes donnent la même partie', () => {
  const jouer = () => {
    const p = creePartie({ mission: MISSIONS.j1, graine: 99, sauvegarde: sauvegardeVide(), options: { invincible: true } });
    for (let k = 0; k < 40 * 60; k++) pasPartie(p, k % 50 < 25 ? geste(3) : geste(-3));
    return JSON.stringify([p.t, p.cristaux, p.ennemis.length, p.tirsE.length, Math.round(p.j.x * 100), p.jauge]);
  };
  assert.equal(jouer(), jouer());
});
test('partie : une mission finit, avec un bilan', () => {
  const p = creePartie({ mission: MISSIONS.j1, graine: 3, sauvegarde: sauvegardeVide(), options: { invincible: true } });
  for (let k = 0; k < 6 * 60 * 60 && p.etat === 'jeu'; k++) pasPartie(p, RIEN);
  assert.equal(p.etat, 'fini');
  assert.equal(p.bilan.mission, 'j1');
  assert.ok(Array.isArray(p.bilan.cages));
});

// ---------- Progression et sauvegarde ----------
test('sauvegarde : vide, corrompue ou d\'un autre format, elle redevient valide', () => {
  for (const brut of [null, undefined, 'n\'importe quoi', 42, {}, { missions: 'x' }, { cristaux: -5, armes: 'a' }]) {
    const s = normaliser(brut);
    assert.equal(typeof s.cristaux, 'number');
    assert.ok(s.cristaux >= 0);
    assert.ok(Array.isArray(s.armes));
    assert.equal(typeof s.missions, 'object');
  }
});
test('progression : j1 ouverte, j2 ouverte après j1, Continuer pointe la suivante', () => {
  let s = sauvegardeVide();
  assert.ok(estOuverte(s, 'j1'));
  assert.ok(!estOuverte(s, 'j2'));
  assert.equal(prochaine(s), 'j1');
  s = appliquerBilan(s, { mission: 'j1', cristaux: 30, cages: ['a'], nouvellesArmes: ['crayon'] });
  assert.ok(estOuverte(s, 'j2'));
  assert.equal(prochaine(s), 'j2');
  assert.equal(s.cristaux, 30);
  assert.deepEqual(s.armes, ['crayon']);
});
test('progression : rejouer une mission ajoute les astronautes oubliés sans doublon', () => {
  let s = sauvegardeVide();
  s = appliquerBilan(s, { mission: 'j1', cristaux: 10, cages: ['a'], nouvellesArmes: [] });
  s = appliquerBilan(s, { mission: 'j1', cristaux: 10, cages: ['a', 'b'], nouvellesArmes: [] });
  assert.deepEqual(s.missions.j1.cages.sort(), ['a', 'b']);
  assert.equal(s.cristaux, 20);
});
