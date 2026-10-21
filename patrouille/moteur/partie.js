// Une mission, image par image. Pur : aucun DOM, aucun canvas, aucun Math.random.
// L'écran lit l'état (p.j, p.ennemis, p.tirsE…) et vide p.evenements (messages, vibrations).
import { W, H, SEC, ZT, ZB } from './constantes.js';
import { creeHasard } from './hasard.js';
import { MODULES, nouveauJoueur, piloter } from './pilotage.js';
import { ARMES, tirBase } from './tirs.js';
import { COMPORTEMENTS } from './ennemis.js';
import { POIDS_BONUS, NOM_BONUS, appliquerBonus } from './bonus.js';
import { majMilieux, forces } from './milieux.js';
import { FORMATIONS } from './vagues.js';
import { ENNEMIS } from '../contenu/ennemis.js';
import { PLANETES } from '../contenu/planetes.js';

const RECOLTE = { petit: 1, moyen: 3, gros: 12, porteur: 2, cage: 0 };
const JAUGE = { petit: 4, moyen: 10, gros: 25, porteur: 6, cage: 0 };
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

/**
 * @param {{ mission: any, graine?: number, sauvegarde: any, options?: { invincible?: boolean } }} reglages
 */
export function creePartie({ mission, graine = 1, sauvegarde, options = {} }) {
  const planete = PLANETES[mission.planete];
  const module = planete.module, M = MODULES[module];
  const hangar = sauvegarde.hangar[module];
  const p = {
    mission, planete, module, M, options,
    h: creeHasard(graine),                    // le jeu
    hv: creeHasard((graine ^ 0x9e3779b9) >>> 0), // les effets visuels, pour ne pas changer la partie
    t: 0, idx: 0, vagues: mission.vagues, fin: false, finT: 0, etat: 'jeu',
    j: nouveauJoueur(M),
    coeursMax: 3 + hangar.coeur, coeurs: 3 + hangar.coeur,
    niveauTir: hangar.tir, rayonAimant: 30 + 30 * hangar.aimant,
    arme: null, bouclier: false, aimant: 0, compagnons: 0, etoile: 0,
    jauge: 0, cristaux: 0, coups: 0,
    armesConnues: [...sauvegarde.armes], nouvellesArmes: [], cagesLibres: [],
    ennemis: [], tirsJ: [], tirsE: [], objets: [], effets: [], terrain: [],
    evenements: [], secousse: 0, bilan: null, vus: {},
  };
  p.ajouter = (type, x, y, extra = {}) => {
    const def = ENNEMIS[type];
    if (!def) throw new Error(`ennemi inconnu : ${type}`);
    const e = { type, def, x, y, x0: x, y0: y, vx: 0, vy: 0, pv: def.pv, r: def.r, age: 0, ph: p.h.entre(0, 6), rot: 0, flash: 0, ...extra };
    p.ennemis.push(e);
    return e;
  };
  p.ajouterCage = (id, x, y) => p.ajouter('cage', x, y, { cid: id });
  p.message = (texte, duree = 3 * SEC) => p.evenements.push({ type: 'message', texte, duree });
  const bleu = (e) => p.h.suivant() < (e.def.pBleu ?? 0.3);
  p.vise = (e, v, n = 1, ecart = 0.22) => {
    const a = Math.atan2(p.j.y - e.y, p.j.x - e.x);
    for (let i = 0; i < n; i++) tirEnnemi(p, e.x, e.y, a + (i - (n - 1) / 2) * ecart, v, bleu(e));
  };
  p.anneau = (e, n, v, dec = 0, tousLesN = 0) => {
    for (let i = 0; i < n; i++) tirEnnemi(p, e.x, e.y, dec + (i / n) * Math.PI * 2, v, tousLesN ? i % tousLesN === 0 : bleu(e));
  };
  return p;
}

/** Un tir ennemi : bleu (s'avale, charge le super) ou rouge (blesse). */
export function tirEnnemi(p, x, y, angle, v, bleu = false) {
  p.tirsE.push({ x, y, vx: Math.cos(angle) * v, vy: Math.sin(angle) * v, r: 5, bleu });
}

/** Ramasser un cadeau : { arme } remplace l'arme (munitions pleines), { bonus } l'applique. */
export function prendreCadeau(p, c) {
  if (c.arme) { p.arme = { k: c.arme, mun: ARMES[c.arme].mun }; p.message(ARMES[c.arme].nom, 1.5 * SEC); }
  else if (c.bonus) { appliquerBonus(p, c.bonus); p.message(NOM_BONUS[c.bonus], 2 * SEC); }
}

const balle = (p, o) => p.tirsJ.push({ vx: 0, vy: -9, dmg: 1, r: 4, ...o });

function tirer(p) {
  const j = p.j;
  if (--j.cad > 0) return;
  if (p.arme) {
    const A = ARMES[p.arme.k];
    j.cad = A.cad; A.tir(j, (b) => balle(p, b), p.h);
    if (--p.arme.mun <= 0) { p.arme = null; p.message('Plus de munitions : retour au tir de base', 2 * SEC); }
    return;
  }
  const base = tirBase(p.module, p.niveauTir);
  j.cad = base.cad; base.tir(j, (b) => balle(p, b));
}

function tirCompagnons(p) {
  if (p.compagnons <= 0) return;
  for (let k = 0; k < 2; k++) {
    const a = p.t * 0.08 + k * Math.PI;
    if (p.t % 18 === k * 9) balle(p, { x: p.j.x + Math.cos(a) * 30, y: p.j.y + Math.sin(a) * 30 - 6 });
  }
}

function remplit(p, n) {
  const avant = p.jauge;
  p.jauge = Math.min(100, p.jauge + n);
  if (p.jauge >= 100 && avant < 100 && !p.vus.super) { p.vus.super = true; p.message('Super-pouvoir prêt : touche le bouton'); }
}

function eclats(p, x, y, couleur, n = 8, v = 3) {
  for (let i = 0; i < n; i++) {
    const a = p.hv.suivant() * Math.PI * 2, s = (0.5 + p.hv.suivant() * 0.5) * v;
    p.effets.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vie: 30, couleur });
  }
}

function lacherCadeau(p, x, y, contenu) { p.objets.push({ k: 'cadeau', x, y, vx: 0, vy: 0.9, ...contenu }); }

function liberer(p, e) {
  const def = p.mission.cages[e.cid] ?? { bonus: true };
  if (!p.cagesLibres.includes(e.cid)) p.cagesLibres.push(e.cid);
  p.effets.push({ astronaute: true, x: e.x, y: e.y, vie: 70, dore: !!def.dore });
  eclats(p, e.x, e.y, '#5fd68a', 14);
  if (def.arme) {
    const neuve = !p.armesConnues.includes(def.arme) && !p.nouvellesArmes.includes(def.arme);
    if (neuve) { p.nouvellesArmes.push(def.arme); p.message(`Nouvelle arme : ${ARMES[def.arme].nom} !`); }
    else p.message('Astronaute délivré !', 1.5 * SEC);
    lacherCadeau(p, e.x, e.y, { arme: def.arme });
  } else {
    p.message('Astronaute délivré !', 1.5 * SEC);
    lacherCadeau(p, e.x, e.y, { bonus: p.h.pondere(POIDS_BONUS) });
  }
}

function blesse(p, e, d) {
  if (e.mort || e.cache) return;
  e.pv -= d; e.flash = 4;
  if (e.pv > 0) return;
  e.mort = true;
  const taille = e.def.taille;
  if (taille === 'cage') { liberer(p, e); return; }
  eclats(p, e.x, e.y, e.def.couleur, taille === 'gros' ? 30 : 10, taille === 'gros' ? 5 : 3);
  for (let i = 0; i < RECOLTE[taille]; i++) p.objets.push({ k: 'cristal', x: e.x + p.h.entre(-8, 8), y: e.y, vx: p.h.entre(-1.2, 1.2), vy: p.h.entre(-1.5, 0.5) });
  remplit(p, JAUGE[taille]);
  if (e.type === 'porteur') {
    const connues = [...p.armesConnues, ...p.nouvellesArmes];
    if (connues.length && p.h.suivant() < 0.5) lacherCadeau(p, e.x, e.y, { arme: p.h.choix(connues) });
    else lacherCadeau(p, e.x, e.y, { bonus: p.h.pondere(POIDS_BONUS) });
    if (!p.vus.cadeau) { p.vus.cadeau = true; p.message('Un cadeau ! Attrape-le'); }
  }
}

function touche(p) {
  if (p.j.inv > 0 || p.options.invincible || p.etoile > 0 || p.j.z > 0.3 || p.etat !== 'jeu') return;
  if (p.bouclier) { p.bouclier = false; p.j.inv = 60; eclats(p, p.j.x, p.j.y, '#8ff', 14); p.message('Le bouclier t\'a protégé', 2 * SEC); return; }
  p.coeurs--; p.coups++; p.j.inv = 100; p.secousse = 10;
  eclats(p, p.j.x, p.j.y, '#ffffff', 16, 4);
  p.tirsE = p.tirsE.filter((b) => dist2(b, p.j) > 90 * 90); // gentil : les tirs tout près disparaissent
  p.evenements.push({ type: 'vibre' });
  if (p.coeurs <= 0) p.etat = 'mort';
}

function superPouvoir(p) {
  if (p.jauge < 100) return;
  p.jauge = 0;
  p.effets.push({ onde: 0 });
  p.tirsE = [];
  for (const e of p.ennemis) if (e.def.taille !== 'cage') blesse(p, e, 15);
}

const vivants = (p) => p.ennemis.filter((e) => !e.mort && !e.cache && e.y > -10);

function majTirsJoueur(p) {
  for (const b of p.tirsJ) {
    if (b.acc) b.vy = Math.max(-10, b.vy + b.acc);
    if (b.guide) {
      let cible = null, meilleur = 1e9;
      for (const e of vivants(p)) { if (e.def.taille === 'cage') continue; const d = dist2(b, e); if (d < meilleur) { meilleur = d; cible = e; } }
      if (cible) {
        const a = Math.atan2(b.vy, b.vx), v = Math.hypot(b.vx, b.vy), c = Math.atan2(cible.y - b.y, cible.x - b.x);
        const da = Math.max(-0.12, Math.min(0.12, ((c - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI));
        const nv = Math.min(7, v + 0.15);
        b.vx = Math.cos(a + da) * nv; b.vy = Math.sin(a + da) * nv;
      }
    }
    b.x += b.vx; b.y += b.vy;
    if (b.rebond !== undefined) {
      if ((b.x < 4 && b.vx < 0) || (b.x > W - 4 && b.vx > 0)) { b.vx *= -1; b.rebond--; }
      if (b.y < 4 && b.vy < 0) { b.vy *= -1; b.rebond--; }
      if (b.rebond < 0) b.mort = true;
    }
    if (b.vie !== undefined && --b.vie <= 0) b.mort = true;
  }
  p.tirsJ = p.tirsJ.filter((b) => !b.mort && b.y > -30 && b.y < H + 30 && b.x > -30 && b.x < W + 30);
}

function collisionsTirs(p) {
  for (const b of p.tirsJ) {
    for (const e of vivants(p)) {
      if (dist2(b, e) >= (e.r + b.r) ** 2) continue;
      if (b.perce) { if (!b.perce.has(e)) { b.perce.add(e); blesse(p, e, b.dmg); } continue; }
      if (b.zone) {
        p.effets.push({ zone: true, x: b.x, y: b.y, r: b.zone, vie: 16 });
        for (const f of vivants(p)) if (dist2(b, f) < (b.zone + f.r) ** 2) blesse(p, f, b.dmg);
      } else blesse(p, e, b.dmg);
      b.mort = true;
      break;
    }
  }
  p.tirsJ = p.tirsJ.filter((b) => !b.mort);
}

function majTirsEnnemis(p) {
  const j = p.j;
  for (const b of p.tirsE) {
    b.x += b.vx; b.y += b.vy;
    if (b.bleu) { if (dist2(b, j) < (b.r + ZB) ** 2) { b.mort = true; remplit(p, 5); p.effets.push({ x: b.x, y: b.y, vx: 0, vy: 0, vie: 12, couleur: '#4fd6ff' }); } }
    else if (dist2(b, j) < (b.r + ZT) ** 2) { b.mort = true; touche(p); }
  }
  p.tirsE = p.tirsE.filter((b) => !b.mort && b.y > -20 && b.y < H + 20 && b.x > -20 && b.x < W + 20);
}

function contacts(p) {
  for (const e of p.ennemis) {
    if (e.mort || e.cache || e.def.taille === 'cage') continue;
    if (dist2(e, p.j) < (e.r * 0.7 + ZT) ** 2) {
      if (p.etoile > 0) { if (p.t % 6 === 0) blesse(p, e, 1); }
      else { touche(p); blesse(p, e, 2); }
    }
  }
}

function majObjets(p) {
  const j = p.j;
  for (const o of p.objets) {
    const d2 = dist2(o, j);
    if (o.k === 'cristal' && (p.aimant > 0 || d2 < p.rayonAimant ** 2)) {
      const d = Math.sqrt(d2) || 1; o.x += ((j.x - o.x) / d) * 7; o.y += ((j.y - o.y) / d) * 7;
    } else {
      o.vy = Math.min(o.vy + 0.05, o.k === 'cristal' ? 1.6 : 0.9); o.vx *= 0.97; o.x += o.vx; o.y += o.vy;
    }
    if (d2 < (o.k === 'cristal' ? 16 : 24) ** 2) { o.mort = true; if (o.k === 'cristal') p.cristaux++; else prendreCadeau(p, o); }
  }
  p.objets = p.objets.filter((o) => !o.mort && o.y < H + 20);
}

function majEffets(p) {
  for (const f of p.effets) {
    if (f.onde !== undefined) { f.onde += 14; if (f.onde > 800) f.mort = true; continue; }
    if (f.astronaute) { f.y -= 3; if (--f.vie <= 0) f.mort = true; continue; }
    if (f.zone) { if (--f.vie <= 0) f.mort = true; continue; }
    f.x += f.vx; f.y += f.vy; f.vx *= 0.94; f.vy *= 0.94;
    if (--f.vie <= 0) f.mort = true;
  }
  p.effets = p.effets.filter((f) => !f.mort);
}

function terminer(p) {
  p.etat = 'fini';
  p.bilan = { mission: p.mission.id, cristaux: p.cristaux, cages: [...p.cagesLibres], nouvellesArmes: [...p.nouvellesArmes], coups: p.coups, duree: p.t };
}

/**
 * Une image de jeu.
 * @param {any} p
 * @param {{ touche: boolean, dx: number, dy: number, super?: boolean }} entree
 */
export function pasPartie(p, entree) {
  if (p.etat !== 'jeu') return;
  p.t++;
  while (p.idx < p.vagues.length && p.vagues[p.idx][0] * SEC <= p.t) {
    const v = p.vagues[p.idx++][1], f = FORMATIONS[v.f];
    if (!f) throw new Error(`formation inconnue : ${v.f}`);
    f(p, v);
  }
  for (const k of ['aimant', 'compagnons', 'etoile', 'secousse']) if (p[k] > 0) p[k]--;
  majMilieux(p);
  piloter(p.j, p.M, entree, forces(p));
  if (p.j.inv > 0) p.j.inv--;
  if (entree.super) superPouvoir(p);
  const calme = p.fin && !p.ennemis.some((e) => e.def.taille !== 'cage');
  if (!calme) { tirer(p); tirCompagnons(p); }
  majTirsJoueur(p);
  for (const e of p.ennemis) {
    e.age++; if (e.flash) e.flash--;
    COMPORTEMENTS[e.def.comportement](e, p);
    if (e.y > H + 60 || e.y < -280 || (e.age > 30 && (e.x < -90 || e.x > W + 90))) e.sorti = true;
  }
  collisionsTirs(p);
  p.ennemis = p.ennemis.filter((e) => !e.mort && !e.sorti);
  majTirsEnnemis(p);
  contacts(p);
  majObjets(p);
  majEffets(p);
  if (calme && !p.objets.some((o) => o.k === 'cadeau') && ++p.finT > 1.5 * SEC) terminer(p);
}
