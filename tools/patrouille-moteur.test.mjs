// Star Patrol : tests du moteur (pur, sans DOM).
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
// Une cible immobile en haut de l'écran, qui ne meurt pas : « un ennemi est à l'écran »
const cibleFixe = (p) => {
  if (!p.ennemis.some((e) => e.cibleTest)) p.ajouter('perroquet', 180, 120, { arret: 100, attente: 0, pv: 1e9, cibleTest: true });
  for (const e of p.ennemis) if (e.cibleTest) { e.attente = 0; e.y = 120; }
};
test('arme : les munitions s\'épuisent quand il y a des ennemis, puis retour au tir de base', () => {
  const p = partieVide({ options: { invincible: true } });
  prendreCadeau(p, { arme: 'crayon' });
  assert.equal(p.arme.k, 'crayon');
  for (let k = 0; k < ARMES.crayon.mun * ARMES.crayon.cad + 30; k++) { cibleFixe(p); pasPartie(p, RIEN); }
  assert.equal(p.arme, null);
});
test('arme : écran vide, les munitions ne s\'épuisent pas (retour de Julie : bonus gaspillés)', () => {
  const p = partieVide();
  prendreCadeau(p, { arme: 'crayon' });
  for (let k = 0; k < 600; k++) pasPartie(p, RIEN);
  assert.equal(p.arme?.mun, ARMES.crayon.mun);
});
test('bonus : écran vide, leur temps ne s\'écoule pas ; avec des ennemis, si', () => {
  const p = partieVide({ options: { invincible: true } });
  prendreCadeau(p, { bonus: 'compagnons' });
  const d = p.compagnons;
  for (let k = 0; k < 300; k++) pasPartie(p, RIEN);
  assert.equal(p.compagnons, d);
  for (let k = 0; k < 60; k++) { cibleFixe(p); pasPartie(p, RIEN); }
  assert.ok(p.compagnons < d);
});
test('arme : en ramasser une autre la remplace, munitions pleines', () => {
  const p = partieVide();
  prendreCadeau(p, { arme: 'crayon' });
  for (let k = 0; k < 100; k++) { cibleFixe(p); pasPartie(p, RIEN); }
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

// =================== Tranche 2 ===================
import { repartirDuDrapeau } from '../patrouille/moteur/partie.js';
import { acheter, PRIX_HANGAR } from '../patrouille/moteur/progression.js';
import { FORMATIONS } from '../patrouille/moteur/vagues.js';

test('copain : abattre ses trois poursuivants le sauve, il devient allié', () => {
  const p = partieVide();
  FORMATIONS.copain(p, {});
  assert.equal(p.copain.etat, 'fuit');
  for (const e of p.ennemis.filter((x) => x.type === 'chasseur')) e.pv = 0, e.mort = true;
  p.ennemis = p.ennemis.filter((e) => !e.mort);
  pasPartie(p, RIEN);
  assert.equal(p.copain.etat, 'ami');
  assert.ok(p.copainSauve);
});
test('copain : si un poursuivant l\'attrape, il est emporté', () => {
  const p = partieVide();
  FORMATIONS.copain(p, {});
  const ch = p.ennemis.find((x) => x.type === 'chasseur');
  ch.x = p.copain.x; ch.y = p.copain.y;
  pasPartie(p, RIEN);
  assert.equal(p.copain.etat, 'pris');
  assert.ok(!p.copainSauve);
});
test('robot de combat : il encaisse 5 coups sans toucher aux cœurs, puis se démonte', () => {
  const p = partieVide();
  prendreCadeau(p, { robot: true });
  assert.ok(p.robot);
  for (let n = 0; n < 5; n++) {
    p.j.inv = 0;
    tirEnnemi(p, p.j.x, p.j.y - 30, Math.PI / 2, 3, false);
    for (let k = 0; k < 20; k++) pasPartie(p, RIEN);
  }
  assert.equal(p.coeurs, p.coeursMax);
  assert.equal(p.robot, null);
});
test('drapeau : après une mort, on repart du drapeau, cœurs pleins, sans le boss ni les tirs', () => {
  const p = partieVide();
  p.vagues = [[1, { f: 'drapeau' }], [3, { f: 'boss', type: 'cameleon' }]];
  for (let k = 0; k < 4 * 60; k++) pasPartie(p, RIEN);
  assert.ok(p.auDrapeau);
  assert.ok(p.boss);
  p.coeurs = 0; p.etat = 'mort';
  repartirDuDrapeau(p);
  assert.equal(p.etat, 'jeu');
  assert.equal(p.coeurs, p.coeursMax);
  assert.equal(p.boss, null);
  assert.equal(p.tirsE.length, 0);
  assert.ok(p.t <= 1 * 60 + 1);
});
test('boss : caché dans le feuillage, il ne prend aucun dégât ; battu, la mission peut finir', () => {
  const p = partieVide();
  p.vagues = [[0.1, { f: 'boss', type: 'cameleon' }], [0.2, { f: 'fin' }]];
  pasPartie(p, RIEN); pasPartie(p, RIEN);
  for (let k = 0; k < 7 * 60; k++) pasPartie(p, RIEN);
  const b = p.boss;
  b.cache = true; const pv = b.pv;
  p.blesserBoss(10);
  assert.equal(b.pv, pv);
  b.cache = false;
  p.blesserBoss(b.pv + 5);
  assert.equal(p.boss, null);
  for (let k = 0; k < 5 * 60 && p.etat === 'jeu'; k++) pasPartie(p, RIEN);
  assert.equal(p.etat, 'fini');
});
test('progression : sauver le copain de la bonne mission ouvre la mission secrète', () => {
  let s = sauvegardeVide();
  assert.ok(!estOuverte(s, 'jsecret'));
  s = appliquerBilan(s, { mission: 'j3', cristaux: 0, cages: [], nouvellesArmes: [], copainSauve: false, ouvreSecret: 'jungle' });
  assert.ok(!estOuverte(s, 'jsecret'));
  s = appliquerBilan(s, { mission: 'j3', cristaux: 0, cages: [], nouvellesArmes: [], copainSauve: true, ouvreSecret: 'jungle' });
  assert.ok(estOuverte(s, 'jsecret'));
  assert.equal(normaliser(JSON.parse(JSON.stringify(s))).secrets.jungle, true);
});
test('Hangar : acheter coûte le prix, monte d\'un niveau, s\'arrête au maximum', () => {
  let s = sauvegardeVide();
  s.cristaux = 500;
  s = acheter(s, 'avion', 'tir');
  assert.equal(s.hangar.avion.tir, 1);
  assert.equal(s.cristaux, 500 - PRIX_HANGAR.tir[0]);
  s = acheter(acheter(acheter(s, 'avion', 'tir'), 'avion', 'tir'), 'avion', 'tir');
  assert.equal(s.hangar.avion.tir, 3);
  const pauvre = acheter({ ...sauvegardeVide(), cristaux: 1 }, 'avion', 'coeur');
  assert.equal(pauvre.hangar.avion.coeur, 0);
});

test('perroquet : il descend à l\'écran, s\'arrête et tire (il restait caché au-dessus)', () => {
  const p = partieVide({ options: { invincible: true } });
  p.niveauTir = 0; p.j.cad = 1e9; // le joueur ne tire pas : on regarde le perroquet seul
  const e = p.ajouter('perroquet', 180, -24, {});
  let vu = false, tirs = 0;
  for (let k = 0; k < 200; k++) { const n = p.tirsE.length; pasPartie(p, RIEN); p.j.cad = 1e9; if (e.y > 60) vu = true; tirs += p.tirsE.length - n; }
  assert.ok(vu, 'le perroquet n\'est jamais apparu');
  assert.ok(tirs >= 3, `il n'a tiré que ${tirs} fois`);
});

// =================== Tranche 3 : le Désert ===================
const desertVide = () => { const p = creePartie({ mission: MISSIONS.d1, graine: 7, sauvegarde: sauvegardeVide() }); p.vagues = []; return p; };
test('rocher : il bloque le rover, qui ne passe pas au travers', () => {
  const p = desertVide();
  FORMATIONS.rocher(p, { x: p.j.x, r: 22 }); p.terrain[0].y = p.j.y - 60;
  for (let k = 0; k < 90; k++) pasPartie(p, { touche: true, dx: 0, dy: -6 });
  const t = p.terrain[0];
  assert.ok(Math.hypot(p.j.x - t.x, p.j.y - t.y) >= t.r + 12, 'le rover est entré dans le rocher');
});
test('rocher : il arrête un tir rouge (on peut s\'abriter)', () => {
  const p = desertVide();
  FORMATIONS.rocher(p, { x: p.j.x, r: 24 }); p.terrain[0].y = p.j.y - 70;
  tirEnnemi(p, p.j.x, p.j.y - 160, Math.PI / 2, 4, false);
  for (let k = 0; k < 60; k++) pasPartie(p, RIEN);
  assert.equal(p.coups, 0);
});
test('sable mou : le rover y roule deux fois moins vite', () => {
  const vitesse = (avecSable) => {
    const p = desertVide();
    if (avecSable) { FORMATIONS.sable(p, { x: p.j.x, w: 300, h: 400 }); p.terrain[0].y = p.j.y - 200; }
    let vmax = 0; // la vitesse de pointe, avant d'atteindre le bord de l'écran
    for (let k = 0; k < 20; k++) { pasPartie(p, { touche: true, dx: 9, dy: 0 }); vmax = Math.max(vmax, Math.abs(p.j.vx)); }
    return vmax;
  };
  assert.ok(vitesse(true) <= vitesse(false) * 0.55);
});
test('tremplin : en l\'air, un tir rouge ne touche pas', () => {
  const p = desertVide();
  FORMATIONS.tremplin(p, { x: p.j.x }); p.terrain[0].y = p.j.y;
  pasPartie(p, RIEN);
  for (let k = 0; k < 20; k++) pasPartie(p, RIEN);
  assert.ok(p.j.z > 0.3, 'le rover ne saute pas');
  tirEnnemi(p, p.j.x, p.j.y, 0, 0, false);
  pasPartie(p, RIEN);
  assert.equal(p.coups, 0);
});
test('taupe : son monticule l\'annonce, et elle ne tire jamais à bout portant', () => {
  const p = desertVide();
  FORMATIONS.taupe(p, {});
  const e = p.ennemis[0];
  assert.ok(e.cache, 'la taupe doit d\'abord être cachée sous son monticule');
  e.age = 200; e.y = p.j.y - 40; e.x = p.j.x; // elle sort tout près du rover
  for (let k = 0; k < 70; k++) { pasPartie(p, RIEN); e.y = p.j.y - 40; }
  assert.equal(p.tirsE.length, 0);
});

// ---------- Tremplins (1.4.0) ----------
test('tremplin : ses cristaux en l\'air ne s\'attrapent qu\'en sautant', () => {
  const auSol = desertVide(), enLAir = desertVide();
  for (const p of [auSol, enLAir]) { FORMATIONS.tremplin(p, { x: p.j.x }); p.terrain[0].y = p.j.y - 200; for (const o of p.objets) o.y += p.j.y + 24 - 200; }
  auSol.terrain = []; // sans tremplin, le rover reste au sol sous les cristaux
  for (let k = 0; k < 260; k++) { pasPartie(auSol, RIEN); pasPartie(enLAir, RIEN); }
  assert.equal(auSol.cristaux, 0);
  assert.ok(enLAir.cristaux >= 4, `en sautant, ${enLAir.cristaux} cristaux seulement`);
});
test('muraille : on la passe en sautant le tremplin, sans être repoussé', () => {
  const p = desertVide();
  FORMATIONS.muraille(p, { x: p.j.x });
  const dy = p.j.y - 200; for (const t of p.terrain) t.y += dy + 20;
  let pousse = 0, y0 = p.j.y;
  for (let k = 0; k < 400; k++) { pasPartie(p, RIEN); pousse = Math.max(pousse, Math.abs(p.j.y - y0)); }
  assert.ok(pousse < 8, `le rover a été repoussé de ${Math.round(pousse)} px`);
});
test('atterrissage : il sonne un scorpion tout proche', () => {
  const p = desertVide();
  FORMATIONS.tremplin(p, { x: p.j.x }); p.terrain[0].y = p.j.y; p.objets = [];
  const e = p.ajouter('scorpion', p.j.x + 40, p.j.y - 30);
  for (let k = 0; k < 82; k++) { pasPartie(p, RIEN); e.y = p.j.y - 30; e.x = p.j.x + 40; }
  assert.ok(e.etourdi > 0, 'le scorpion n\'est pas sonné');
});
