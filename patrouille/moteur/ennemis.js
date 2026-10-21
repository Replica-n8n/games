// Les comportements communs à toutes les planètes. Une fiche d'ennemi (dans contenu/)
// choisit un comportement et le règle ; chaque planète habille ces comportements avec
// ses propres créatures. Un comportement reçoit l'ennemi `e` et la partie `p`, qui
// fournit p.h (hasard à graine), p.j (le joueur), p.vise, p.anneau et p.ajouter.
import { DEFIL } from './constantes.js';

/** @type {Record<string, (e: any, p: any) => void>} */
export const COMPORTEMENTS = {
  // Fonce tout droit vers le bas (popcorn, en V ou en pluie)
  foncer(e) { e.y += e.def.vitesse ?? 2.6; e.x += e.vx; },
  // Descend en tournoyant autour de sa colonne
  tournoyer(e) { e.y += e.def.vitesse ?? 1.7; e.x = e.x0 + Math.sin(e.age * 0.06 + e.ph) * (e.def.ampleur ?? 50); e.rot = e.age * 0.2; },
  // Entre par le côté, puis pique sur le joueur
  piquer(e, p) {
    if (e.age < e.delai) { e.x += e.vx; return; }
    if (!e.pique) { const a = Math.atan2(p.j.y - e.y, p.j.x - e.x), v = e.def.vitesse ?? 3.2; e.vx = Math.cos(a) * v; e.vy = Math.sin(a) * v; e.pique = true; }
    e.x += e.vx; e.y += e.vy;
  },
  // Descend, s'arrête, vise trois fois, puis s'en va par le côté
  viser(e, p) {
    // Altitude d'arrêt tirée une fois. Sans elle, le perroquet restait au-dessus de l'écran,
    // tirait hors de vue et repartait sans jamais apparaître (1 seul tir rouge en 2 min sur j1).
    e.arret ??= p.h.entre(110, 190);
    if (!e.part && e.y < e.arret) { e.y += 2.4; return; }
    if (!e.part) {
      e.attente = (e.attente || 0) + 1;
      if ([40, 70, 100].includes(e.attente)) p.vise(e, e.def.vitesseTir ?? 3.2, e.def.nTirs ?? 1);
      if (e.attente > 150) e.part = true;
      return;
    }
    e.x += e.x < 180 ? -3 : 3;
  },
  // Planté au sol (défile avec le décor), tire en étoile ; un tir sur deux est bleu.
  // Il se tait dans le bas de l'écran : un anneau tiré à bout portant est injuste.
  etoile(e, p) {
    e.y += DEFIL; e.rot = e.age * 0.02;
    if (e.age % 110 === 60 && e.y > 40 && e.y < 380) p.anneau(e, e.def.branches ?? 8, 1.8, e.age * 0.1, 2);
  },
  // Descend en ondulant (les Gloutonnets)
  onduler(e) { e.y += e.def.vitesse ?? 1.3; e.x += Math.sin(e.age * 0.1) * 1.2; },
  // Traverse l'écran en portant un cadeau
  porteur(e) { e.x += e.vx; e.y = e.y0 + Math.sin(e.age * 0.05) * 14; },
  // Caché sous le feuillage : il tremble (annonce), puis surgit, tire deux fois et s'en va
  cache(e, p) {
    if (e.cache) { e.y += DEFIL; if (e.age > (e.def.attente ?? 80)) { e.cache = false; e.surgi = 0; } return; }
    e.surgi++;
    if (e.surgi < 20) e.y -= 2.5; else e.y += 0.6;
    if (e.surgi === 30 || e.surgi === 70) p.vise(e, 2.8, 3);
    if (e.surgi > 110) e.y += 2.5;
  },
  // Le gros : descend, reste un moment en fabriquant des petits, vise en éventail, repart
  fabrique(e, p) {
    if (!e.part && e.y < 110) { e.y += 1; return; }
    if (!e.part) {
      e.reste = (e.reste ?? e.def.duree ?? 600) - 1;
      if (e.reste % 80 === 0) p.ajouter(e.def.pond, e.x + p.h.entre(-20, 20), e.y + 20);
      if (e.reste % 140 === 70) p.vise(e, 2.4, 5, 0.25);
      if (e.reste <= 0) e.part = true;
      return;
    }
    e.y += 1.5;
  },
  // Chasseur du copain : il le poursuit ; une fois le copain sauvé ou emporté, il s'en va
  chasser(e, p) {
    const c = p.copain;
    if (!c || c.etat !== 'fuit') { e.y -= 2.5; return; }
    const a = Math.atan2(c.y - e.y, c.x - e.x), v = 1.15 + e.age / 900;
    e.x += Math.cos(a) * v; e.y += Math.sin(a) * v;
    if ((e.x - c.x) ** 2 + (e.y - c.y) ** 2 < 14 * 14) p.attraperCopain();
  },
  // Cage d'astronaute posée dans le décor
  cage(e) { e.y += DEFIL; },
};
