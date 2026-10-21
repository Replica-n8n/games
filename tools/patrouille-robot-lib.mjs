// Le robot joueur de la Patrouille, dans Node : il joue une mission avec le vrai moteur.
// Il se place sous l'ennemi le plus bas, va chercher cadeaux et cages, esquive les tirs
// rouges proches et lance le super quand l'écran est chargé.
import { creePartie, pasPartie } from '../patrouille/moteur/partie.js';
import { sauvegardeVide } from '../patrouille/moteur/progression.js';
import { MISSIONS } from '../patrouille/contenu/missions.js';

export function decision(p) {
  const j = p.j;
  let cible = null, basY = -1;
  for (const e of p.ennemis) if (!e.cache && e.y > basY && e.y < j.y - 40 && e.y > 0) { basY = e.y; cible = e.x; }
  const cage = p.ennemis.find((e) => e.def.taille === 'cage' && e.y > 0 && e.y < j.y - 60);
  if (cage) cible = cage.x;
  if (p.boss && p.boss.y > 0) cible = p.boss.x; // caché, on se place sous ses yeux
  const ch = p.ennemis.find((e) => e.type === 'chasseur' && e.y > 0 && e.y < j.y - 30);
  if (ch) cible = ch.x;
  for (const o of p.objets) if ((o.k === 'cadeau' || o.k === 'caisse') && o.y > 0) cible = o.x;
  cible ??= 180;
  // Anticipation : pour chaque place possible, on prévoit les tirs rouges et les ennemis
  // sur les 36 prochaines images et on garde la place la moins dangereuse, puis la plus
  // proche de la cible. Un robot qui n'esquive que les tirs déjà collés se fait toucher
  // là où un enfant passe sans peine (vu sur la mission 2 : 4 morts sur 5).
  const ty = p.M.zone[1] - 20;
  let meilleur = j.x, score = Infinity;
  for (let dx = -120; dx <= 120; dx += 12) {
    const x = Math.max(16, Math.min(344, j.x + dx));
    let danger = 0;
    for (const b of p.tirsE) {
      if (b.bleu) continue;
      for (let k = 4; k <= 36; k += 4) {
        const bx = b.x + b.vx * k, by = b.y + b.vy * k, d = Math.hypot(bx - x, by - ty);
        if (d < 22) danger += (22 - d) * (40 - k);
      }
    }
    for (const e of p.ennemis) {
      if (e.cache || e.def.taille === 'cage') continue;
      const d = Math.hypot(e.x - x, e.y + 30 - ty);
      if (d < e.r + 24) danger += (e.r + 24 - d) * 30;
    }
    const s = danger * 10 + Math.abs(x - cible) + Math.abs(dx) * 0.3;
    if (s < score) { score = s; meilleur = x; }
  }
  const sup = p.jauge >= 100 && p.ennemis.filter((e) => !e.cache).length > 5;
  if (p.M.type === 'direct') return { touche: true, dx: meilleur - j.cx, dy: ty - j.cy, super: sup };
  return { touche: true, dx: Math.max(-9, Math.min(9, (meilleur - j.x) * 0.12)), dy: Math.max(-9, Math.min(9, (ty - j.y) * 0.12)), super: sup };
}

/** Joue une mission jusqu'à la fin, la mort ou la limite de temps. */
export function jouer(id, { graine = 1, invincible = false, sauvegarde = sauvegardeVide(), maxSec = 400 } = {}) {
  const p = creePartie({ mission: MISSIONS[id], graine, sauvegarde, options: { invincible } });
  while (p.etat === 'jeu' && p.t < maxSec * 60) pasPartie(p, decision(p));
  return { id, graine, copain: p.copainSauve, etat: p.etat, duree: Math.round(p.t / 60), coups: p.coups, cristaux: p.cristaux, cages: p.cagesLibres.length, totalCages: Object.keys(p.mission.cages).length, armes: p.nouvellesArmes };
}
