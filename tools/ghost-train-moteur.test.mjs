// Ghost Train : tests du moteur (pur, sans DOM).
//   node --test tools/ghost-train-moteur.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creePartie, pasPartie } from '../ghost-train/moteur/partie.js';
import { naitre } from '../ghost-train/moteur/fantomes.js';
import { calerBoites } from '../ghost-train/moteur/projection.js';
import { noteDe } from '../ghost-train/moteur/notes.js';
import { sauvegardeVide, normaliser, appliquerBilan, ouverte } from '../ghost-train/moteur/progression.js';
import { MISSIONS } from '../ghost-train/contenu/missions.js';
import { DT, RAYON, COEURS } from '../ghost-train/moteur/constantes.js';
import { creeBot } from './ghost-train-bot.mjs';

const RIEN = { x: 160, y: 90, tire: false };
const hall = (o = {}) => creePartie({ mission: MISSIONS.hall, graine: 7, ...o });
const secondes = (p, s, entree = RIEN) => { for (let i = 0; i < s * 60; i++) pasPartie(p, typeof entree === 'function' ? entree(p) : entree); };
/** Le viseur sur le centre de e, détente tenue */
const sur = (e) => () => ({ x: e.boite ? e.boite.cx : 0, y: e.boite ? e.boite.cy : 0, tire: true });
/** Une partie arrêtée au premier arrêt, sans ses vagues : on teste une chose à la fois */
const auPremierArret = () => {
  const p = hall();
  secondes(p, 0.1);
  p.camZ = p.cible.z - 0.01; secondes(p, 0.05);
  p.file = [];
  return p;
};

test('rail : le wagon roule jusqu\'au premier arrêt et s\'y arrête', () => {
  const p = hall();
  secondes(p, 1);
  assert.equal(p.rail, 'roule');
  assert.ok(p.camZ > 3 && p.camZ < 3.6, `camZ = ${p.camZ}`);
  secondes(p, 2);
  assert.equal(p.rail, 'arret');
  assert.equal(p.camZ, 8);
});

test('rail : le wagon repart quand plus rien ne bloque', () => {
  const p = auPremierArret();
  p.ents = [];
  secondes(p, 1);
  assert.equal(p.rail, 'roule');
});

test('rayon : tenir le rayon sur une goule la capture et lâche ses pièces', () => {
  const p = auPremierArret();
  const g = naitre(p, 'goule', 0); g.z = p.camZ + 8; calerBoites(p);
  const t = 1 / (RAYON.puissance * RAYON.faible);
  secondes(p, t + 0.2, sur(g));
  assert.equal(g.etat, 'cap');
  assert.equal(p.prises, 1);
  assert.equal(p.pieces, 3);
  assert.equal(p.captures.goule, 1);
});

test('rayon : à côté du fantôme, rien ne se passe', () => {
  const p = auPremierArret();
  const g = naitre(p, 'goule', 0); g.z = p.camZ + 8; g.vit = 0; calerBoites(p);
  secondes(p, 1, () => ({ x: 20, y: 20, tire: true }));
  assert.equal(g.pv, 1);
});

test('chauffe : tirer sans arrêt surchauffe, le rayon se coupe puis repart', () => {
  const p = auPremierArret();
  secondes(p, 1 / RAYON.chauffe + 0.1, { x: 20, y: 20, tire: true });
  assert.ok(p.surchauffe > 0, 'en surchauffe');
  assert.equal(p.tire, false);
  assert.equal(p.consigne?.texte, 'LÂCHE POUR REFROIDIR');
  secondes(p, RAYON.surchauffe + 0.1, RIEN);
  assert.equal(p.surchauffe, 0);
  assert.notEqual(p.consigne?.texte, 'LÂCHE POUR REFROIDIR');
});

test('goule : arrivée au wagon, elle coûte un cœur', () => {
  const p = auPremierArret();
  const g = naitre(p, 'goule', 0); g.z = p.camZ + 3;
  secondes(p, 2);
  assert.equal(p.coeurs, COEURS - 1);
  assert.ok(g.mort);
});

test('Lumi : la viser coûte un cœur, la laisser passer en rend un', () => {
  const a = auPremierArret();
  const l = naitre(a, 'lumi', -1); calerBoites(a);
  secondes(a, 0.2, sur(l));
  assert.equal(a.coeurs, COEURS - 1);
  assert.equal(a.lumi.touche, true);

  const b = auPremierArret();
  b.coeurs = 3;
  naitre(b, 'lumi', -1);
  secondes(b, 10);
  assert.equal(b.coeurs, 4);
  assert.equal(b.lumi.sauve, true);
});

test('aiguillage : sans choix, la voie de gauche après le délai', () => {
  const p = hall();
  const aig = MISSIONS.hall.parcours.find((e) => e.aiguillage);
  p.suite = p.suite.slice(p.suite.indexOf(aig)); p.cible = p.suite.shift(); p.camZ = aig.z - 0.01;
  secondes(p, 0.1);
  assert.equal(p.rail, 'aiguillage');
  secondes(p, 4.1);
  assert.equal(p.voie, 'g');
  assert.equal(p.rail, 'roule');
});

test('aiguillage : viser le panneau de droite prend la voie de droite', () => {
  const p = hall();
  const aig = MISSIONS.hall.parcours.find((e) => e.aiguillage);
  p.suite = p.suite.slice(p.suite.indexOf(aig)); p.cible = p.suite.shift(); p.camZ = aig.z - 0.01;
  secondes(p, 0.1);
  const d = p.ents.find((e) => e.type === 'levier' && e.cote === 'd');
  secondes(p, 0.5, sur(d));
  assert.equal(p.voie, 'd');
  assert.equal(p.cible.arret.secret.id, 'hall-plan');
});

test('secret : le viser le range au dossier, et il ne revient pas', () => {
  const p = auPremierArret();
  const s = naitre(p, 'secret', 1.95, { id: 'hall-affiche', forme: 'affiche', x: 1.95, y: -0.55, dz: 6 }); calerBoites(p);
  secondes(p, 0.6, sur(s));
  assert.deepEqual(p.secrets, ['hall-affiche']);
  const sv = appliquerBilan(sauvegardeVide(), { mission: 'hall', fini: false, pieces: 0, captures: {}, secrets: p.secrets });
  const q = hall({ sauvegarde: sv });
  secondes(q, 30, creeBot('expert'));
  assert.ok(!q.ents.some((e) => e.type === 'secret' && e.id === 'hall-affiche'));
});

test('majordome : à mi-vie il se dédouble ; viser un leurre le dissipe sans le compter', () => {
  const p = hall();
  p.suite = []; p.cible = { z: 1, boss: 'majordome' };
  secondes(p, 0.4);
  const b = p.boss;
  assert.ok(b);
  secondes(p, 1.7);
  b.pv = b.pv0 / 2 - 0.01;
  secondes(p, 0.1);
  const leurres = p.ents.filter((e) => e.type === 'leurre');
  assert.equal(leurres.length, 2);
  secondes(p, 1.5);
  const l = p.ents.find((e) => e.type === 'leurre');
  secondes(p, 0.3, sur(l));
  assert.ok(l.mort);
  assert.equal(p.total, 1, 'les leurres ne comptent pas dans le total');
});

test('verrou : une assiette devant le Majordome tenu se vise quand même', () => {
  const p = hall();
  p.suite = []; p.cible = { z: 1, boss: 'majordome' };
  secondes(p, 2.2);
  const b = p.boss; b.tAssiette = 99;
  secondes(p, 0.3, sur(b));
  assert.equal(p.verrou, b, 'le rayon tient le Majordome');
  const a = naitre(p, 'assiette', b.x); a.z = b.z - 2; a.y = b.y; a.tx = b.x; a.ty = b.y; a.vit = 0; calerBoites(p);
  secondes(p, 0.3, () => ({ x: a.boite.cx, y: a.boite.cy, tire: true }));
  assert.ok(a.mort, "l'assiette est détruite");
});

test('mission 1 : le robot expert la finit sans mourir ni toucher Lumi, en 1 min 25 à 3 min (un humain vise moins vite)', () => {
  for (const voie of /** @type {const} */ (['g', 'd'])) {
    const p = hall({ graine: 3 });
    const bot = creeBot('expert', { voie });
    let n = 0;
    while (p.etat !== 'fini' && p.etat !== 'mort' && n++ < 60 * 300) pasPartie(p, bot(p));
    assert.equal(p.etat, 'fini', `voie ${voie} : ${p.etat} à ${p.t.toFixed(0)} s, cœurs ${p.coeurs}`);
    assert.ok(p.t >= 85 && p.t <= 180, `voie ${voie} : ${p.t.toFixed(0)} s`);
    assert.notEqual(p.bilan.lumi, 'touche');
    assert.equal(p.bilan.secrets.length, 2, `voie ${voie} : ${p.bilan.secrets}`);
  }
});

test('note : S sans faute, C quand presque tout s\'échappe', () => {
  assert.equal(noteDe({ prises: 20, total: 20, lumi: 'epargne', coeursPerdus: 0 }), 'S');
  assert.equal(noteDe({ prises: 20, total: 20, lumi: 'touche', coeursPerdus: 0 }), 'B');
  assert.equal(noteDe({ prises: 5, total: 20, lumi: 'epargne', coeursPerdus: 0 }), 'C');
});

test('sauvegarde : une sauvegarde abîmée redevient valide ; une défaite garde les pièces', () => {
  assert.deepEqual(normaliser(null), sauvegardeVide());
  assert.deepEqual(normaliser({ v: 1, pieces: -4, missions: 'x', dossier: [3, 'a', 'a'] }).dossier, ['a']);
  const s = appliquerBilan(sauvegardeVide(), { mission: 'hall', fini: false, pieces: 12, captures: { goule: 4 }, secrets: [] });
  assert.equal(s.pieces, 12);
  assert.equal(s.carnet.goule, 4);
  assert.equal(ouverte(s, 'bibliotheque'), false);
  const t = appliquerBilan(s, { mission: 'hall', fini: true, note: 'B', pieces: 30, captures: {}, secrets: [] });
  assert.equal(ouverte(t, 'bibliotheque'), true);
  const u = appliquerBilan(t, { mission: 'hall', fini: true, note: 'C', pieces: 0, captures: {}, secrets: [] });
  assert.equal(u.missions.hall.note, 'B', 'la meilleure note reste');
});

test('hasard : même graine et mêmes gestes, même partie', () => {
  const jouer = () => { const p = hall({ graine: 11 }), bot = creeBot('expert'); secondes(p, 60, bot); return [p.camZ, p.prises, p.coeurs, p.t]; };
  assert.deepEqual(jouer(), jouer());
  assert.equal(DT, 1 / 60);
});
