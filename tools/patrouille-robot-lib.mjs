// Les robots joueurs de la Patrouille, dans Node : ils jouent une mission avec le vrai moteur.
// Deux profils :
//   expert : anticipe les tirs sur 36 images, décide à chaque image (un très bon joueur) ;
//   enfant : décide toutes les 9 images, ne prévoit que 16 images, vise à ±18 px près,
//            esquive moins fort. Sert à régler la difficulté : l'expert ne meurt jamais,
//            c'est l'enfant qui dit si une mission est trop dure ou trop facile.
import { creePartie, pasPartie } from '../patrouille/moteur/partie.js';
import { sauvegardeVide } from '../patrouille/moteur/progression.js';
import { creeHasard } from '../patrouille/moteur/hasard.js';
import { MISSIONS } from '../patrouille/contenu/missions.js';
import { H } from '../patrouille/moteur/constantes.js';

export const PROFILS = {
  expert: { periode: 1, horizon: 36, bruit: 0, prudence: 10, retard: 0, attention: 99 },
  // L'enfant voit les tirs avec un temps de réaction (12 images, 0,2 s) et n'en surveille
  // que les 4 plus proches : sans ces limites, il esquivait aussi bien que l'expert.
  enfant: { periode: 9, horizon: 16, bruit: 18, prudence: 4, retard: 12, attention: 4 },
};

/** Un ennemi qu'on peut toucher, à l'écran. */
export const cibleVisible = (p) => p.ennemis.some((e) => !e.cache && e.def.taille !== 'cage' && e.y > 0 && e.y < H) || (p.boss && !p.boss.cache && p.boss.y > 0);

function placeVoulue(p, profil, h, tirsVus) {
  const j = p.j;
  let cible = null, basY = -1;
  for (const e of p.ennemis) if (!e.cache && e.y > basY && e.y < j.y - 40 && e.y > 0) { basY = e.y; cible = e.x; }
  const cage = p.ennemis.find((e) => e.def.taille === 'cage' && e.y > 0 && e.y < j.y - 60);
  if (cage) cible = cage.x;
  if (p.boss && p.boss.y > 0) cible = p.boss.x; // caché, on se place sous ses yeux
  const ch = p.ennemis.find((e) => e.type === 'chasseur' && e.y > 0 && e.y < j.y - 30);
  if (ch) cible = ch.x;
  for (const o of p.objets) if ((o.k === 'cadeau' || o.k === 'caisse') && o.y > 0) cible = o.x;
  cible = (cible ?? 180) + (profil.bruit ? h.entre(-profil.bruit, profil.bruit) : 0);
  // Pour chaque place possible, on prévoit les tirs rouges et les ennemis et on garde la
  // place la moins dangereuse, puis la plus proche de la cible.
  const ty = p.M.zone[1] - 20;
  let meilleur = j.x, score = Infinity;
  for (let dx = -120; dx <= 120; dx += 12) {
    const x = Math.max(16, Math.min(344, j.x + dx));
    let danger = 0;
    for (const b of tirsVus) {
      if (b.bleu) continue;
      // Le danger se lit sur le TRAJET, pas seulement à l'arrivée : sinon le robot file d'un
      // coup à 120 px à travers un tir rouge (vu : un tiers des coups de l'expert sur j2).
      for (let k = 2; k <= profil.horizon; k += 2) {
        const px = j.x + (x - j.x) * Math.min(1, k / 10);
        const bx = b.x + b.vx * k, by = b.y + b.vy * k, d = Math.hypot(bx - px, by - ty);
        if (d < 22) danger += (22 - d) * (40 - k);
      }
    }
    // Le rover bute contre les rochers : une place derrière un rocher est inaccessible
    for (const t of p.terrain) if (t.k === 'rocher' && Math.abs(t.x - x) < t.r + 16 && Math.abs(t.y - ty) < t.r + 40) danger += 400;
    // Un monticule de taupe là où on va passer : on s'écarte
    for (const e of p.ennemis) if (e.cache && e.type === 'taupe' && Math.abs(e.x - x) < 30 && e.y > ty - 160 && e.y < ty + 20) danger += 300;
    for (const e of p.ennemis) {
      if (e.cache || e.def.taille === 'cage') continue;
      const d = Math.hypot(e.x - x, e.y + 30 - ty);
      if (d < e.r + 24) danger += (e.r + 24 - d) * 30;
    }
    const s = danger * profil.prudence + Math.abs(x - cible) + Math.abs(dx) * 0.3;
    if (s < score) { score = s; meilleur = x; }
  }
  return { x: meilleur, y: ty };
}

/** Un robot : renvoie une fonction qui donne le geste de chaque image. */
export function creerRobot(profil = PROFILS.expert, graine = 1) {
  const h = creeHasard(graine * 7919);
  let voulue = null, n = 0;
  const memoire = [];
  return (p) => {
    // Ce que le robot « voit » des tirs : l'état d'il y a `retard` images, les plus proches seulement
    memoire.push(p.tirsE.map((b) => ({ x: b.x, y: b.y, vx: b.vx, vy: b.vy, bleu: b.bleu })));
    if (memoire.length > profil.retard + 1) memoire.shift();
    const vus = memoire[0].filter((b) => !b.bleu)
      .sort((a, b) => Math.hypot(a.x - p.j.x, a.y - p.j.y) - Math.hypot(b.x - p.j.x, b.y - p.j.y))
      .slice(0, profil.attention);
    if (!voulue || n++ % profil.periode === 0) voulue = placeVoulue(p, profil, h, vus);
    const j = p.j;
    const sup = p.jauge >= 100 && p.ennemis.filter((e) => !e.cache).length > 5;
    if (p.M.type === 'direct') return { touche: true, dx: voulue.x - j.cx, dy: voulue.y - j.cy, super: sup };
    return { touche: true, dx: Math.max(-9, Math.min(9, (voulue.x - j.x) * 0.12)), dy: Math.max(-9, Math.min(9, (voulue.y - j.y) * 0.12)), super: sup };
  };
}

/** Compatibilité : le geste de l'expert. */
export const decision = (() => { const r = creerRobot(PROFILS.expert); return (p) => r(p); })();

/**
 * Joue une mission jusqu'à la fin, la mort ou la limite de temps.
 * Mesure aussi l'utilité des bonus : munitions tirées et temps de bonus passés avec un
 * ennemi touchable à l'écran.
 */
export function jouer(id, { graine = 1, invincible = false, sauvegarde = sauvegardeVide(), maxSec = 400, profil = 'expert' } = {}) {
  const p = creePartie({ mission: MISSIONS[id], graine, sauvegarde, options: { invincible } });
  const robot = creerRobot(PROFILS[profil], graine);
  const u = { mun: 0, munUtiles: 0, bonus: 0, bonusUtiles: 0 };
  while (p.etat === 'jeu' && p.t < maxSec * 60) {
    const munAvant = p.arme?.mun, armeAvant = p.arme?.k;
    const avant = { aimant: p.aimant, compagnons: p.compagnons, etoile: p.etoile };
    pasPartie(p, robot(p));
    const visible = cibleVisible(p), cristaux = p.objets.some((o) => o.k === 'cristal');
    if (armeAvant && (p.arme?.k !== armeAvant || p.arme.mun < munAvant)) { u.mun++; if (visible) u.munUtiles++; }
    // On ne compte que le temps de bonus réellement consommé (en pause, il n'est pas perdu)
    for (const k of ['aimant', 'compagnons', 'etoile']) {
      if (avant[k] > 0 && p[k] === avant[k] - 1) { u.bonus++; if (visible || (k === 'aimant' && cristaux)) u.bonusUtiles++; }
    }
  }
  return {
    id, graine, copain: p.copainSauve, etat: p.etat, duree: Math.round(p.t / 60), coups: p.coups, cristaux: p.cristaux,
    cages: p.cagesLibres.length, totalCages: Object.keys(p.mission.cages).length, armes: p.nouvellesArmes,
    utiliteMun: u.mun ? u.munUtiles / u.mun : null, utiliteBonus: u.bonus ? u.bonusUtiles / u.bonus : null,
  };
}
