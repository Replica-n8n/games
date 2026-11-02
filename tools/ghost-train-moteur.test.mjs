// Ghost Train : le moteur des salles, sans navigateur.
//   node --test tools/ghost-train-moteur.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creePartie, pasPartie } from '../ghost-train/moteur/partie.js';
import { naitre, boite } from '../ghost-train/moteur/fantomes.js';
import { capturer } from '../ghost-train/moteur/rayon.js';
import { ouvrirSceau } from '../ghost-train/moteur/sceaux.js';
import { equiper, occuper } from '../ghost-train/moteur/manies.js';
import { creeRobot } from '../ghost-train/moteur/joueur.js';
import { normaliser, appliquerBilan, ouverte, sauvegardeVide } from '../ghost-train/moteur/progression.js';
import { noteDe } from '../ghost-train/moteur/notes.js';
import { RAYON, FRAPPE, ALERTE, W, H, TORCHE, PECHE, ASPIRE, ECHAPPE, SCEAU, MANIES } from '../ghost-train/moteur/constantes.js';
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

test("la torche révèle puis étourdit l'Ombre ; cachée, le rayon passe au travers", () => {
  const p = salleVide('fumoir', MISSIONS.biblio);
  const o = naitre(p, 'ombre', 160, 90, 1); o.etat = 'vit'; o.croit = 0;
  pas(p, 30, () => viser(o));
  assert.equal(o.pv, o.pv0, 'cachée, le rayon ne la touche pas');
  pasPartie(p, { x: o.x, y: o.y, bas: false, torche: true });
  assert.ok(o.revele > 0 && !(o.etourdi > 0), 'éclairée, elle se révèle tout de suite');
  pas(p, 32, () => ({ x: o.x, y: o.y, bas: false, torche: true }));
  assert.ok(o.etourdi > 0, 'éclairée une demi-seconde, elle est étourdie');
  assert.ok(p.torche.pile < 1, 'la pile a servi');
  pas(p, 60, () => viser(o));
  assert.equal(o.etat, 'cap', 'révélée, elle se capture');
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

test("les livres du Bibliothécaire le protègent ; la torche sur lui les fait tomber", () => {
  const p = salleVide('archives', MISSIONS.biblio);
  const b = naitre(p, 'bibliothecaire', 160, 64, 1.25); b.etat = 'vit'; p.boss = b;
  pas(p, 2);
  assert.equal(p.ents.filter((e) => e.garde).length, 4, 'quatre livres');
  pas(p, 30, () => viser(b));
  assert.equal(b.pv, b.pv0, 'le rayon ricoche');
  pas(p, 150, () => ({ x: b.x, y: b.y, bas: false, torche: true }));
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

// les sceaux (combles) : le doigt suit les jalons du sceau, là où il est (fx, fy)
const doigt = (x, y, bas = true) => ({ x, y, fx: x, fy: y, bas });
/** Verse le sceau ouvert, trait après trait, jalon par jalon (à l'envers si `envers`), en levant le
 * doigt entre deux traits ; `jusque` arrête le trait en cours à mi-chemin. */
function tracer(p, { envers = false, jusque = 1, lever = true } = {}) {
  const S = p.sceau;
  for (let t = S.i; t < S.traits.length && p.sceau === S; t++) {
    const j = envers ? [...S.traits[t].jalons].reverse() : S.traits[t].jalons, fin = Math.round((j.length - 1) * jusque);
    pasPartie(p, doigt(j[0][0], j[0][1], false));
    for (let i = 0; i <= fin && p.sceau === S && S.i === t; i++) pasPartie(p, doigt(j[i][0], j[i][1]));
    if (jusque < 1) break;
  }
  if (lever) pasPartie(p, doigt(0, 0, false));
}
function sonne(type = 'drap', salle = 'chambre') {
  const p = salleVide(salle, MISSIONS.grenier);
  const e = naitre(p, type, 160, 80, 1.1); e.etat = 'vit'; e.croit = 0;
  for (let k = 0; k < 400 && !p.sceau; k++) pasPartie(p, viser(e));
  return { p, e };
}

test("les sceaux : aux combles, un coriace aspiré est sonné à 35 % et demande un sceau", () => {
  const { p, e } = sonne('drap');
  assert.ok(p.sceau && p.sceau.e === e, "un sceau s'ouvre");
  assert.ok(Math.abs(e.pv - e.pv0 * SCEAU.seuil) < 0.02);
  assert.ok(MISSIONS.grenier.sceaux.chambre.includes(p.sceau.forme));
  // un ecto s'aspire comme avant ; un drap ailleurs qu'aux combles aussi
  const q = salleVide('chambre', MISSIONS.grenier), a = naitre(q, 'ecto', 160, 80, 1.1); a.etat = 'vit'; a.croit = 0;
  pas(q, 200, () => viser(a)); assert.equal(q.sceau, null); assert.equal(a.etat, 'cap');
  const r = salleVide('salon'), d = naitre(r, 'drap', 160, 80, 1.1); d.etat = 'vit'; d.croit = 0;
  pas(r, 200, () => viser(d)); assert.equal(r.sceau, null); assert.equal(d.etat, 'cap');
});

test("les sceaux : tracé d'un seul trait, il est scellé ; à l'envers aussi", () => {
  for (const envers of [false, true]) {
    const { p, e } = sonne('crane', 'combles');
    pasPartie(p, doigt(0, 0, false));
    const pieces = p.pieces;
    tracer(p, { envers });
    assert.equal(p.sceau, null, 'sceau fermé'); assert.equal(e.etat, 'cap'); assert.equal(p.sceaux, 1);
    assert.ok(p.pieces >= pieces + ESPECES.crane.pieces + SCEAU.bonus);
  }
});

test("les sceaux : le doigt déjà posé doit se lever ; lever en route efface le tracé", () => {
  const { p } = sonne('drap');
  const j = p.sceau.jalons;
  // le doigt encore posé (il aspirait) glisse sur le sceau : rien ne compte
  for (const [x, y] of j) pasPartie(p, doigt(x, y));
  assert.ok(p.sceau && !p.sceau.trace, 'il faut lever le doigt');
  tracer(p, { jusque: 0.5 });
  assert.ok(p.sceau && !p.sceau.trace, 'levé à mi-chemin : tracé effacé');
  tracer(p);
  assert.equal(p.sceau, null);
});

test("les sceaux : en deux traits, le premier versé reste acquis quand le doigt se lève", () => {
  const { p } = sonne('drap', 'combles');
  p.sceau = null;
  // on force un pentacle : l'étoile, puis le cercle
  const e = p.ents.find((x) => x.type === 'drap');
  p.mission = { ...p.mission, sceaux: { combles: ['pentacle'] } };
  ouvrirSceau(p, e);
  assert.equal(p.sceau.traits.length, 2);
  const q = salleVide('combles', { ...MISSIONS.grenier, sceaux: { combles: ['feu'] } }), f = naitre(q, 'drap', 160, 80, 1.1); ouvrirSceau(q, f);
  assert.ok(p.sceau.duree > q.sceau.duree * 1.8, "un pentacle laisse bien plus de temps qu'un triangle");
  const S = p.sceau, etoile = S.traits[0].jalons;
  pasPartie(p, doigt(0, 0, false));
  for (const [x, y] of etoile) pasPartie(p, doigt(x, y));
  assert.equal(S.i, 1, "l'étoile est versée");
  pasPartie(p, doigt(0, 0, false));
  assert.equal(S.i, 1, 'lever le doigt ne la défait pas');
  tracer(p, { jusque: 0.5 });
  assert.ok(p.sceau === S && S.i === 1 && !S.trace, 'le cercle levé à mi-chemin est effacé, pas l\'étoile');
  tracer(p);
  assert.equal(p.sceau, null); assert.equal(e.etat, 'cap');
});

test("les sceaux : le temps écoulé, le sceau se brise et il reprend 70 % de sa vie", () => {
  const { p, e } = sonne('drap');
  pas(p, Math.ceil(p.sceau.duree * 60) + 5, () => doigt(0, 0, false));
  assert.equal(p.sceau, null); assert.equal(e.etat, 'vit');
  assert.ok(Math.abs(e.pv - e.pv0 * SCEAU.rate) < 0.02);
});

test("les sceaux : pendant le tracé, le reste avance au tiers", () => {
  const { p } = sonne('drap');
  const o = naitre(p, 'ecto', 60, 80, 0.8); o.etat = 'vit';
  const s0 = o.s; pas(p, 60, () => doigt(0, 0, false));
  const lent = o.s - s0;
  const q = salleVide('chambre', MISSIONS.grenier), o2 = naitre(q, 'ecto', 60, 80, 0.8); o2.etat = 'vit';
  pas(q, 60);
  const normal = o2.s - 0.8;
  assert.ok(lent > normal * 0.2 && lent < normal * 0.45, `${lent} contre ${normal}`);
});

test("les sceaux : la Gouvernante pêchée demande trois sceaux ; un raté la libère", () => {
  const ouvre = () => {
    const p = salleVide('combles', MISSIONS.grenier);
    const g = naitre(p, 'gouvernante', 160, 66, 1.25); g.etat = 'vit'; p.boss = g;
    capturer(p, g, 1); assert.ok(p.peche);
    p.peche.prog = 0.999; pasPartie(p, { x: p.peche.zx, y: p.peche.zy, bas: true });
    return { p, g };
  };
  let { p, g } = ouvre();
  assert.ok(p.sceau && p.sceau.e === g && p.sceau.total === 3 && !p.aspire);
  for (let k = 0; k < 3; k++) {
    assert.equal(p.sceau.n, k);
    tracer(p);
    for (let i = 0; i < 60 && !p.sceau && !p.aspire; i++) pasPartie(p, doigt(0, 0, false));
  }
  assert.equal(p.sceau, null); assert.ok(p.aspire && p.aspire.e === g, 'au piège');
  ({ p, g } = ouvre());
  pas(p, Math.ceil(p.sceau.duree * 60) + 5, () => doigt(0, 0, false));
  assert.equal(p.sceau, null); assert.ok(!p.aspire && !p.peche);
  assert.ok(Math.abs(g.pv - g.pv0 * PECHE.casse) < 0.01); assert.equal(g.etat, 'vit');
});

test("les sceaux : les robots les tracent (l'expert sans faute)", () => {
  for (const niveau of ['expert', 'enfant']) {
    const { p } = sonne('drap', 'lingerie');
    const robot = creeRobot(niveau, 5);
    for (let k = 0; k < 600 && p.sceau; k++) pasPartie(p, robot(p));
    if (niveau === 'expert') { assert.equal(p.sceaux, 1); }
    else assert.ok(p.sceaux === 1 || p.sceau === null);
  }
});

test("le bouclier de la Gouvernante : le rayon ricoche ; la torche le brise", () => {
  const p = salleVide('combles', MISSIONS.grenier);
  const g = naitre(p, 'gouvernante', 160, 66, 1.25); g.etat = 'vit'; p.boss = g;
  pas(p, 1); g.bouclier = true; g.tBouclier = 3;
  pas(p, 20, () => viser(g));
  assert.equal(g.pv, g.pv0);
  pas(p, 33, () => ({ x: g.x, y: g.y, bas: false, torche: true }));
  assert.ok(!g.bouclier && g.etourdi > 0);
});

test("la pile de la torche : vide en 5 secondes, elle repart éteinte, et rien sans la bibliothèque", () => {
  const p = salleVide('fumoir', MISSIONS.biblio);
  pas(p, 60 * 5 + 2, () => ({ x: 160, y: 90, bas: false, torche: true }));
  assert.ok(p.torche.vide && !p.torche.on, 'vide, elle se coupe');
  pas(p, 60, () => ({ x: 160, y: 90, bas: false, torche: true }));
  assert.ok(!p.torche.on, 'tenir le bouton ne la rallume pas');
  pas(p, 60 * 2.5, () => ({ x: 160, y: 90, bas: false, torche: false }));
  assert.ok(!p.torche.vide, 'éteinte, elle se recharge');
  const q = salleVide();
  pas(q, 10, () => ({ x: 160, y: 90, bas: false, torche: true }));
  assert.ok(!q.torche.on, 'pas de torche au rez-de-chaussée');
});

test("tous les étages se finissent avec le robot expert", () => {
  for (const m of Object.values(MISSIONS)) {
    const p = creePartie({ mission: m, graine: 4 }); const r = creeRobot('expert', 5);
    pas(p, 60 * 300, r);
    assert.equal(p.etat, 'fini', m.id);
  }
});

test("la surchauffe coûte : le fantôme tenu s'échappe, sa vie revient et il recule", () => {
  const p = salleVide();
  const e = naitre(p, 'ecto', 160, 90, 1.5); e.etat = 'vit'; e.croit = 0; e.pv = e.pv0 = 1000;
  p.chauffe = 0.99;
  pas(p, 4, () => viser(e));
  assert.ok(p.surchauffe);
  assert.equal(e.pv, e.pv0, 'sa vie est revenue');
  assert.ok(Math.abs(e.s - (1.5 - ECHAPPE.recul)) < 0.05, 'il a reculé');
  assert.equal(p.echappes, 1); assert.equal(p.surchauffes, 1);
});

/** Un boss qu'on vient de vider : la pêche commence. */
function bossPeche() {
  const p = salleVide('cuisine');
  const b = naitre(p, 'majordome', 160, 66, 1.25); b.etat = 'vit'; p.boss = b;
  const e = naitre(p, 'ecto', 100, 90, 1); e.etat = 'vit'; e.croit = 0;
  b.pv = 0.01;
  pas(p, 2, () => viser(b));
  return { p, b, e };
}

test("un boss vaincu se pêche : ce qui reste part avec lui, puis le piège l'avale et il compte", () => {
  const { p, b, e } = bossPeche();
  assert.ok(p.peche, 'la pêche commence'); assert.equal(b.etat, 'vit'); assert.equal(e.etat, 'cap', 'l\'ecto part avec lui');
  // le doigt dans le cercle, toujours : la prise monte, le rayon refroidit
  p.chauffe = 0.5;
  pas(p, 60, (q) => ({ x: q.peche.zx, y: q.peche.zy, bas: true }));
  assert.ok(p.peche.prog > 0.1, 'la prise avance'); assert.ok(p.chauffe < 0.5, 'bien tirer refroidit');
  for (let k = 0; k < 60 * 30 && p.peche; k++) pasPartie(p, { x: p.peche.zx, y: p.peche.zy, bas: true });
  assert.ok(p.aspire && !b.mort, 'pêché : il est aspiré');
  assert.equal(p.casses, 0, 'qui suit le cercle ne casse jamais');
  const avant = p.pieces;
  pas(p, Math.ceil(ASPIRE.fin * 60) + 2);
  assert.ok(b.mort && !p.aspire, 'au fond du piège');
  assert.equal(p.pieces, avant + ESPECES.majordome.pieces);
});

test("à la pêche, tirer à l'opposé pendant son élan casse la ligne : il repart avec un quart de sa vie", () => {
  const { p, b } = bossPeche();
  pas(p, 60 * 20, (q) => q.peche ? { x: q.peche.e.x - q.peche.dir * PECHE.ecart, y: q.peche.zy, bas: true } : repos);
  assert.ok(p.casses >= 1, 'la ligne a cassé');
  assert.ok(b.casses >= 1);
  assert.ok(!p.surchauffe, 'le rayon ne se bloque pas après une ligne cassée');
});


test("la boutique : fermée avant le rez-de-chaussée, un rayon s'achète une fois et se prend en main", async () => {
  const { acheter, prendre, boutiqueOuverte, rayonEnMain, vue } = await import('../ghost-train/moteur/boutique.js');
  const { RAYONS } = await import('../ghost-train/contenu/rayons.js');
  // une sauvegarde d'avant la boutique reçoit le rayon de départ, sans rien perdre
  const ancienne = normaliser({ v: 2, pieces: 300, missions: { rdc: { faite: true, note: 'A' } }, carnet: { ecto: 4 } });
  assert.deepEqual([ancienne.rayons, ancienne.rayon, ancienne.boutiqueVue, ancienne.pieces, ancienne.carnet.ecto], [['neon'], 'neon', false, 300, 4]);
  const fermee = { ...ancienne, missions: {} };
  assert.equal(boutiqueOuverte(fermee), false);
  assert.equal(acheter(fermee, 'ecto'), null, 'fermée, rien ne s\'achète');
  const s = acheter(ancienne, 'ecto');
  assert.deepEqual([s.pieces, s.rayons, s.rayon, rayonEnMain(s).id], [150, ['neon', 'ecto'], 'ecto', 'ecto']);
  assert.equal(acheter(s, 'ecto'), null, 'jamais deux fois');
  assert.equal(acheter(s, 'arc'), null, 'pas assez de pièces');
  assert.equal(acheter(s, 'inconnu'), null);
  assert.equal(prendre(s, 'neon').rayon, 'neon');
  assert.equal(prendre(s, 'or'), null, 'pas acheté');
  assert.equal(ancienne.pieces, 300, 'la sauvegarde d\'origine n\'est pas touchée');
  assert.equal(vue(s).boutiqueVue, true);
  // une sauvegarde abîmée : rayon inconnu ou pas acheté, on revient au néon
  const abimee = normaliser({ v: 2, pieces: 0, missions: {}, rayons: ['zut', 'or'], rayon: 'glace' });
  assert.deepEqual([abimee.rayons, abimee.rayon], [['neon', 'or'], 'neon']);
  // les prix : le premier dès l'ouverture (environ 175 pièces au rez-de-chaussée), tous en 2 300
  assert.equal(RAYONS.reduce((n, r) => n + r.prix, 0), 2300);
  assert.ok(RAYONS[1].prix <= 170);
  assert.equal(new Set(RAYONS.map((r) => r.id)).size, RAYONS.length);
});

test("l'orage du plan : un éclair toutes les 12 s, rien à t = 0, le tonnerre une fois par éclair", async () => {
  const { flash, tonne, ORAGE } = await import('../ghost-train/ecran/hante.js');
  assert.equal(flash(0), 0, 'un écran figé (t = 0) ne tonne pas');
  const coups = []; let t = 0;
  for (; t < 60; t += 1 / 60) if (tonne(t, t + 1 / 60)) coups.push(t);
  assert.equal(coups.length, 5, '60 s, cinq tonnerres');
  for (const c of coups) assert.ok(flash(c - ORAGE.tonnerre + 0.04) > 0.5, 'le tonnerre suit un éclair');
  assert.ok(flash(6.02, true) <= 0.3, 'adouci quand les flashs sont réduits');
});

// ---- les manières (moteur/manies.js, d'après Luigi's Mansion) ----
test("la casserole : le rayon glisse dessus, elle chauffe, tombe au bout d'1 s, puis il s'aspire", () => {
  const p = salleVide('cuisine');
  const e = equiper(naitre(p, 'ecto', 160, 80, 1), 'casserole'); e.etat = 'vit'; e.croit = 0;
  pas(p, 50, () => viser(e));
  assert.equal(e.pv, e.pv0, 'casqué, il ne perd rien'); assert.equal(e.equipe, 'casserole');
  pas(p, 12, () => viser(e));
  assert.equal(e.equipe, null, 'au bout d\'1 s, la casserole brûle et tombe');
  pas(p, 50, () => viser(e));
  assert.equal(e.etat, 'cap');
});

test("les lunettes : la torche ne l'étourdit pas ; éclairé, il les ôte ; il ne s'aspire qu'étourdi", () => {
  const p = salleVide('fumoir', MISSIONS.biblio);
  const e = equiper(naitre(p, 'ecto', 160, 80, 1), 'lunettes'); e.etat = 'vit'; e.croit = 0;
  pas(p, 60, () => viser(e));
  assert.equal(e.pv, e.pv0, 'sans être étourdi, le rayon glisse');
  const lampe = () => ({ x: e.x, y: e.y, bas: false, torche: true });
  pas(p, 40, lampe);
  assert.ok(!(e.etourdi > 0), 'avec ses lunettes, la torche ne l\'étourdit pas');
  pas(p, 15, lampe);
  assert.equal(e.equipe, null, 'éclairé 0,8 s, il enlève ses lunettes');
  pas(p, 35, lampe);
  assert.ok(e.etourdi > 0, 'sans lunettes, la torche l\'étourdit');
  pas(p, 50, () => viser(e));
  assert.equal(e.etat, 'cap', 'étourdi, il s\'aspire');
});

test("le masque : le rayon ne prend que près du temps", () => {
  const p = salleVide('vestiaire', MISSIONS.bal);
  const e = equiper(naitre(p, 'ecto', 160, 80, 1), 'masque'); e.etat = 'vit'; e.croit = 0;
  let pris = 0, glisse = 0;
  for (let k = 0; k < 120; k++) { const avant = e.pv; pasPartie(p, viser(e)); if (e.etat !== 'vit') break; (e.pv < avant ? pris++ : glisse++); }
  assert.ok(pris > 0 && glisse > 0, `il prend sur le temps (${pris}) et glisse entre (${glisse})`);
});

test("pris sur le fait : par surprise il paie double ; s'il nous voit, il file dans une cachette et ressort", () => {
  const p = salleVide('manger');
  const e = occuper(p, 'ecto', 'mange', [150, 74, 0.8]);
  pas(p, 30, () => viser(e));
  assert.ok(!e.surpris && e.pv === e.pv0, 'les premiers instants, le rayon glisse (un doigt resté posé depuis la salle précédente)');
  pas(p, 70);
  assert.equal(e.s, 0.8, 'occupé, il ne vient pas vers nous');
  const avant = p.pieces;
  pas(p, 60, () => viser(e));
  assert.equal(e.etat, 'cap'); assert.equal(p.surprises, 1);
  assert.equal(p.pieces - avant, ESPECES.ecto.pieces * 2, 'par surprise : pièces doublées');
  const f = occuper(p, 'ecto', 'mange', [150, 74, 0.8]), vus = p.vus;
  pas(p, Math.ceil(60 * (MANIES.veille.mange + 0.1)));
  assert.ok(f.mort, 'sa veille écoulée, il nous a vus et a filé');
  assert.equal(p.vus, vus - 1, 'il ne compte pas deux fois');
  pas(p, Math.ceil(60 * (MANIES.retour + 0.2)));
  assert.ok(p.ents.some((x) => x.type === 'ecto' && !x.occupe && !x.mort), 'il ressort de la cachette pour se battre');
});

test("pris sur le fait : la torche ou un voisin capturé le fait filer", () => {
  const p = salleVide('bibliotheque', MISSIONS.biblio);
  const e = occuper(p, 'drap', 'lit', [196, 100, 0.75]);
  pasPartie(p, { x: e.x, y: e.y, bas: false, torche: true });
  assert.ok(e.mort, 'éclairé, il se sauve');
  const a = occuper(p, 'ecto', 'lit', [150, 90, 0.8]), b = naitre(p, 'ecto', 180, 90, 1); b.etat = 'vit';
  capturer(p, b, 1);
  assert.ok(a.mort, 'un fantôme capturé à côté : il a vu');
});

test("la fouille : un caché ne sort qu'au rayon posé sur son meuble, et la salle attend qu'on le trouve", () => {
  const p = creePartie({ mission: { ...RDC, salles: ['cuisine'], deroules: { cuisine: [[0, 'cache', 'ecto', 'fenetre'], [0, 'butin', 'marmite', 6]] } }, graine: 3 });
  pas(p, 60 * 5);
  assert.equal(p.etat, 'jeu', 'tant qu\'il est caché, la salle n\'est pas finie');
  assert.ok(!p.ents.length, 'rien ne sort tout seul');
  const C = SALLES.cuisine.cachettes, avant = p.pieces;
  pas(p, 30, () => ({ x: C.marmite.x, y: C.marmite.y, bas: true }));
  assert.equal(p.pieces - avant, 6, 'la marmite fouillée lâche ses pièces');
  pas(p, 30, () => ({ x: C.fenetre.x, y: C.fenetre.y, bas: true }));
  assert.ok(p.ents.some((e) => e.type === 'ecto'), 'la fenêtre fouillée : BOUH !');
});

test("les manières sont dans chaque étage", () => {
  for (const m of Object.values(MISSIONS)) {
    const a = Object.values(m.deroules).flat();
    assert.ok(a.some((x) => x[1] === 'occupe'), m.id + ' : un fantôme occupé');
    assert.ok(a.some((x) => x[1] === 'cache'), m.id + ' : un caché à fouiller');
    for (const x of a) if (x[1] === 'cache' || x[1] === 'butin') assert.ok(SALLES[Object.keys(m.deroules).find((s) => m.deroules[s].includes(x))].cachettes[x[1] === 'cache' ? x[3] : x[2]], 'cachette connue');
  }
});
