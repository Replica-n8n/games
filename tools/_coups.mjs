// Qui touche le robot enfant ? (diagnostic)
import { creePartie, pasPartie } from '../patrouille/moteur/partie.js';
import { MISSIONS } from '../patrouille/contenu/missions.js';
import { sauvegardeVide } from '../patrouille/moteur/progression.js';
import { creerRobot, PROFILS } from './patrouille-robot-lib.mjs';
for (const id of process.argv.slice(2)) {
  const causes = {};
  for (let g = 1; g <= 12; g++) {
    const s = sauvegardeVide(); s.armes = ['crayon', 'elastiques', 'arrosoir', 'billes', 'avions']; s.hangar.rover = { tir: 2, coeur: 1, aimant: 1 };
    const p = creePartie({ mission: MISSIONS[id], graine: g, sauvegarde: s }); const r = creerRobot(PROFILS.enfant, g);
    while (p.etat === 'jeu' && p.t < 300 * 60) {
      const avant = p.coups, tirs = p.tirsE.filter((b) => !b.bleu && Math.hypot(b.x - p.j.x, b.y - p.j.y) < 30).length;
      const proche = p.ennemis.filter((e) => !e.cache && Math.hypot(e.x - p.j.x, e.y - p.j.y) < e.r + 20).map((e) => e.type);
      pasPartie(p, r(p));
      if (p.coups > avant) { const k = proche.length ? 'contact ' + proche[0] : tirs ? 'tir' : 'autre'; causes[k] = (causes[k] || 0) + 1; }
    }
  }
  console.log(id, JSON.stringify(causes));
}
