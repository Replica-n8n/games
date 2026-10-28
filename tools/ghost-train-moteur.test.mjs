// Ghost Train : le moteur des salles, sans navigateur.
//   node --test tools/ghost-train-moteur.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creePartie, pasPartie } from '../ghost-train/moteur/partie.js';
import { naitre, boite } from '../ghost-train/moteur/fantomes.js';
import { creeRobot } from '../ghost-train/moteur/joueur.js';
import { normaliser, appliquerBilan, ouverte, sauvegardeVide } from '../ghost-train/moteur/progression.js';
import { noteDe } from '../ghost-train/moteur/notes.js';
import { RAYON, FRAPPE, ALERTE, W, H, FLASH } from '../ghost-train/moteur/constantes.js';
import { MISSIONS } from '../ghost-train/contenu/missions.js';
import { SALLES } from '../ghost-train/contenu/salles.js';
import { ESPECES } from '../ghost-train/contenu/especes.js';

const RDC = MISSIONS.rdc;
const repos = { x: 0, y: 0, bas: false };
const pas = (p, n, e = repos) => { for (let k = 0; k < n; k++) pasPartie(p, typeof e === 'function' ? e(p) : e); };
/** Une partie dont la salle est vide et le déroulé arrêté : on y pose ce qu'on veut. */
function salleVide(salle = 'salon', mission = RDC) {
  const p = creePartie({ mission: { ...mission, salles: [salle], deroules: { [salle]: [[999, 'attendre']] } }, graine: 3 });
  p.titre = 0;
  return p;
}
function salleVideAncienne(salle = 'salon') {
  const p = creePartie({ mission: RDC, graine: 3 });
  const n = RDC.salles.indexOf(salle);
  if (n > 0) { p.n = n; p.salle = salle; }
  p.deroule = [[999, 'attendre']]; p.titre = 0;
  if (n > 0) { const s = creePartie({ mission: { ...RDC, salles: [salle], deroules: { [salle]: [] } }, graine: 3 }).s; p.s = s; }
  return p;
}
const viser = (e) => ({ x: e.x, y: e.y, bas: true });

test("les données : chaque cachette, chaque espèce et chaque objet existent et tiennent à l\'écran", () => {
  for (const m of Object.values(MISSIONS)) {
    assert.equal(m.salles.length, 3);
    for (const s of m.salles) {
      const S = SALLES[s];
      assert.ok(S, s);
      for (const c of Object.values(S.cachettes)) assert.ok(c.x > 0 && c.x < W && c.y > 0 && c.y < H);
      for (const o of S.objets) assert.ok(o.x >= 0 && o.x + o.w <= W && o.y >= 0 && o.y + o.h <= H, o.id);
      for (const a of m.deroules[s]) {
        if (a[1] === 'sort') { assert.ok(ESPECES[a[2]], a[2]); assert.ok(S.cachettes[a[3]], `${s} : ${a[3]}`); }
        if (a[1] === 'chat' || a[1] === 'boss') assert.ok(S.cachettes[a[2]], `${s} : ${a[2]}`);
      }
    }
  }
});

test("une cachette prévient 0,8 s avant que le fantôme sorte", () => {
  const p = creePartie({ mission: RDC, graine: 1 });
  pas(p, Math.round(2 * 60) + 1);
  assert.ok(p.s.alerte.ascenseur > 0, 'l\'armoire prévient');
  assert.equal(p.ents.filter((e) => e.type === 'ecto').length, 0, 'rien n\'est encore sorti');
  pas(p, Math.round(ALERTE * 60) + 2);
  assert.equal(p.ents.filter((e) => e.type === 'ecto').length, 1, "l'ecto est sorti");
});

test("un fantôme qui arrive jusqu\'à nous coûte un cœur et laisse de la bave", () => {
  const p = salleVide();
  const e = naitre(p, 'ecto', 160, 100, FRAPPE - 0.01); e.etat = 'vit';
  pas(p, 5);
  assert.equal(p.coeurs, 4);
  assert.ok(p.evenements.some((v) => v.type === 'bave'));
});

test("le rayon aspire un ecto en 0,75 s ; il surchauffe à 1 et repart à 0,33", () => {
  const p = salleVide();
  const e = naitre(p, 'ecto', 160, 90, 1); e.etat = 'vit'; e.croit = 0;
  pas(p, 40, () => viser(e));
  assert.equal(e.etat, 'vit', 'pas encore à 0,66 s');
  pas(p, 10, () => viser(e));
  assert.equal(e.etat, 'cap', 'capturée vers 0,8 s');
  assert.equal(p.captures, 1); assert.equal(p.pieces, ESPECES.ecto.pieces);
  const q = salleVide();
  pas(q, Math.ceil(60 / RAYON.chauffe) + 2, { x: 10, y: 170, bas: true });
  assert.ok(q.surchauffe, 'surchauffe');
  pas(q, 30, { x: 10, y: 170, bas: true });
  assert.ok(!q.tire, 'il ne tire plus pendant la surchauffe');
  pas(q, Math.ceil(((1 - RAYON.reprise) / RAYON.refroidit) * 60) + 2);
  assert.ok(!q.surchauffe, 'il repart');
});

test("le chat ne se capture pas et ne compte pas", () => {
  const p = salleVide();
  const c = naitre(p, 'chat', 160, 140, 1.2); c.etat = 'vit';
  pas(p, 30, () => viser(c));
  assert.notEqual(c.etat, 'cap');
  assert.equal(p.vus, 0); assert.equal(p.captures, 0);
  assert.ok(c.feule, 'il crache et file');
});

test("le lustre écrase les fantômes du milieu et paie double", () => {
  const p = salleVide('salon');
  const a = naitre(p, 'ecto', 150, 100, 1), b = naitre(p, 'ecto', 175, 100, 1), loin = naitre(p, 'ecto', 40, 100, 1);
  for (const e of [a, b, loin]) { e.etat = 'vit'; e.croit = 0; e.tx = e.x; }
  const lu = p.s.objets.lustre;
  pas(p, 60, { x: lu.x + lu.w / 2, y: lu.y + lu.h / 2, bas: true });
  assert.ok(lu.fini, 'le lustre est tombé');
  assert.equal(a.etat, 'cap'); assert.equal(b.etat, 'cap'); assert.equal(loin.etat, 'vit');
  assert.equal(p.pieces, ESPECES.ecto.pieces * 2 * 2);
});

test("le bouchon de la bouteille assomme le fantôme le plus proche", () => {
  const p = salleVide('manger');
  const loin = naitre(p, 'ecto', 100, 80, 0.8), pres = naitre(p, 'ecto', 220, 110, 1.6);
  for (const e of [loin, pres]) { e.etat = 'vit'; e.croit = 0; }
  const bo = p.s.objets.bouteille;
  pas(p, 40, { x: bo.x + bo.w / 2, y: bo.y + bo.h / 2, bas: true });
  assert.ok(bo.fini);
  assert.equal(pres.etat, 'cap'); assert.equal(loin.etat, 'vit');
});

test("« attendre » retient la suite tant qu\'un fantôme est là", () => {
  const p = creePartie({ mission: { ...RDC, salles: ['salon'], deroules: { salon: [[0.1, 'sort', 'ecto', 'ascenseur'], [0.2, 'attendre'], [0.3, 'sort', 'drap', 'miroir']] } }, graine: 2 });
  p.options.invincible = true;
  pas(p, 120);
  assert.ok(!p.ents.some((e) => e.type === 'drap'), 'le drap attend');
  for (const e of p.ents) e.mort = true;
  pas(p, 2 * 60);
  assert.ok(p.ents.some((e) => e.type === 'drap') || p.attente.length, 'puis il sort');
});

test("le robot expert finit l\'étage, et la même graine rejoue la même partie", () => {
  const jouer = () => { const p = creePartie({ mission: RDC, graine: 5 }); const r = creeRobot('expert', 9); pas(p, 60 * 300, r); return p; };
  const a = jouer(), b = jouer();
  assert.equal(a.etat, 'fini'); assert.equal(a.bilan.salles, 3);
  assert.deepEqual([a.pieces, a.captures, a.coeurs, Math.round(a.t * 60)], [b.pieces, b.captures, b.coeurs, Math.round(b.t * 60)]);
});

test("la boîte d\'un fantôme suit sa taille", () => {
  const p = salleVide();
  const e = naitre(p, 'ecto', 100, 100, 2);
  const b = boite(e);
  assert.equal(b.w, ESPECES.ecto.taille[0] * 2); assert.equal(b.x, 100 - b.w / 2);
});

test("la sauvegarde : une 1.x repart de zéro, les étages s\'ouvrent dans l\'ordre, la meilleure note reste", () => {
  assert.deepEqual(normaliser({ v: 1, pieces: 50, missions: { hall: { faite: true } } }), sauvegardeVide());
  let s = sauvegardeVide();
  assert.ok(ouverte(s, 'rdc')); assert.ok(!ouverte(s, 'biblio'));
  s = appliquerBilan(s, { mission: 'rdc', fini: true, note: 'A', pieces: 100, captures: { ecto: 20 } });
  assert.ok(ouverte(s, 'biblio'));
  s = appliquerBilan(s, { mission: 'rdc', fini: true, note: 'B', pieces: 50, captures: {} });
  assert.equal(s.missions.rdc.note, 'A'); assert.equal(s.pieces, 150); assert.equal(s.carnet.ecto, 20);
  s = appliquerBilan(s, { mission: 'rdc', fini: false, note: null, pieces: 10, captures: {} });
  assert.equal(s.pieces, 160, 'une défaite garde ses pièces');
});

test("la note : S sans rien rater ni perdre, C quand on rate beaucoup", () => {
  assert.equal(noteDe({ prises: 43, total: 43, lumi: 'aucun', coeursPerdus: 0 }), 'S');
  assert.equal(noteDe({ prises: 20, total: 43, lumi: 'aucun', coeursPerdus: 4 }), 'C');
});

test("le flash révèle et étourdit l'Ombre ; cachée, le rayon passe au travers", () => {
  const p = salleVide('fumoir', MISSIONS.biblio);
  const o = naitre(p, 'ombre', 160, 90, 1); o.etat = 'vit'; o.croit = 0;
  pas(p, 30, () => viser(o));
  assert.equal(o.pv, o.pv0, 'cachée, le rayon ne la touche pas');
  pasPartie(p, { x: o.x, y: o.y, bas: false, flash: true });
  assert.ok(o.revele > 0 && o.etourdi > 0, 'révélée et étourdie');
  pas(p, 60, () => viser(o));
  assert.equal(o.etat, 'cap', 'révélée, elle se capture');
  assert.ok(p.flashCD >= 0, 'le flash se recharge');
});

test("Lumi : le toucher le fait fuir et compte contre la note ; l'épargner rend un cœur", () => {
  const p = salleVide('fumoir', MISSIONS.biblio);
  p.coeurs = 3;
  const l = naitre(p, 'lumi', 20, 84, 1); l.etat = 'vit';
  pas(p, 60 * 12);
  assert.equal(p.coeurs, 4, 'épargné, il rend un cœur');
  const l2 = naitre(p, 'lumi', 20, 84, 1); l2.etat = 'vit';
  pas(p, 4, () => viser(l2));
  assert.ok(l2.fuite && p.lumi.touche === 1, 'touché, il fuit');
  assert.equal(p.captures, 0);
});

test("les livres du Bibliothécaire le protègent ; le flash les fait tomber", () => {
  const p = salleVide('archives', MISSIONS.biblio);
  const b = naitre(p, 'bibliothecaire', 160, 64, 1.25); b.etat = 'vit'; p.boss = b;
  pas(p, 2);
  assert.equal(p.ents.filter((e) => e.garde).length, 4, 'quatre livres');
  pas(p, 30, () => viser(b));
  assert.equal(b.pv, b.pv0, 'le rayon ricoche');
  pasPartie(p, { x: b.x, y: b.y, bas: false, flash: true });
  pas(p, 30);
  assert.equal(p.ents.filter((e) => e.garde && e.etat === 'vit').length, 0, 'les livres sont tombés');
  pas(p, 30, () => viser(b));
  assert.ok(b.pv < b.pv0, 'à découvert, il prend le rayon');
});

test("le rythme : une capture sur le temps est PARFAITE, paie double et remplit la super", () => {
  const p = salleVide('bal', MISSIONS.bal);
  const e = naitre(p, 'ecto', 160, 90, 1); e.etat = 'vit'; e.croit = 0; e.pv = 0.01;
  // attendre juste le temps
  while (!(p.phase < 0.05)) pasPartie(p, { x: 0, y: 0, bas: false });
  pasPartie(p, viser(e));
  assert.equal(e.etat, 'cap');
  assert.equal(p.parfaits, 1); assert.equal(p.pieces, 6);
  assert.ok(p.jauge >= 0.25 - 1e-9);
});

test("la super capture tout ce qui est à l'écran et ôte 3 à un boss", () => {
  const p = salleVide('kiosque', MISSIONS.bal);
  const a = naitre(p, 'ecto', 100, 90, 1), b = naitre(p, 'drap', 220, 90, 1), c = naitre(p, 'chef', 160, 62, 1.25);
  for (const e of [a, b, c]) { e.etat = 'vit'; e.croit = 0; }
  p.boss = c; p.jauge = 1;
  pasPartie(p, { x: 0, y: 0, bas: false, super: true });
  pas(p, 30);
  assert.equal(a.etat, 'cap'); assert.equal(b.etat, 'cap');
  assert.equal(c.pv, c.pv0 - 3);
});

test("le slam : tenu, il tire ; un coup sec à l'opposé lui ôte 60 %", () => {
  const p = salleVide('chambre', MISSIONS.grenier);
  const e = naitre(p, 'ecto', 160, 90, 1.2); e.etat = 'vit'; e.croit = 0;
  pas(p, 5, () => viser(e));
  assert.ok(e.lutte, 'aux combles, il lutte');
  const pv = e.pv, { dx, dy } = e.traction;
  for (let k = 0; k < 8; k++) pasPartie(p, { x: e.x - dx * 9 * (k + 1), y: e.y - dy * 9 * (k + 1), bas: true });
  assert.ok(p.slams === 1, 'SLAM');
  assert.ok(e.pv < pv - e.pv0 * 0.5 || e.etat === 'cap');
});

test("le bouclier de la Gouvernante : le rayon ricoche ; le flash le brise", () => {
  const p = salleVide('combles', MISSIONS.grenier);
  const g = naitre(p, 'gouvernante', 160, 66, 1.25); g.etat = 'vit'; p.boss = g;
  pas(p, 1); g.bouclier = true; g.tBouclier = 3;
  pas(p, 20, () => viser(g));
  assert.equal(g.pv, g.pv0);
  pasPartie(p, { x: g.x, y: g.y, bas: false, flash: true });
  assert.ok(!g.bouclier && g.etourdi > 0);
});

test("tous les étages se finissent avec le robot expert", () => {
  for (const m of Object.values(MISSIONS)) {
    const p = creePartie({ mission: m, graine: 4 }); const r = creeRobot('expert', 5);
    pas(p, 60 * 300, r);
    assert.equal(p.etat, 'fini', m.id);
  }
});
