// Les sceaux au robot enfant : réussis, ratés, et où l'on perd ses cœurs aux combles.
//   node tools/ghost-train-sceaux-mesure.mjs [n]
import { creePartie, pasPartie } from '../ghost-train/moteur/partie.js';
import { creeRobot } from '../ghost-train/moteur/joueur.js';
import { MISSIONS } from '../ghost-train/contenu/missions.js';

const N = Number(process.argv[2]) || 40, niveau = process.argv[3] || 'enfant';
const t = { parties: 0, morts: 0, sceaux: 0, rates: 0, libere: 0, coups: {}, coupsPendant: 0, tempsSceau: 0, duree: 0 };
for (let g = 1; g <= N; g++) {
  const p = creePartie({ mission: MISSIONS.grenier, graine: g, options: {} }), robot = creeRobot(niveau, g * 31 + 7);
  for (let k = 0; k < 60 * 400 && p.etat !== 'fini' && p.etat !== 'mort'; k++) {
    pasPartie(p, robot(p));
    if (p.sceau) t.tempsSceau += 1 / 60;
    for (const ev of p.evenements) {
      if (ev.type === 'coup') { const c = `${ev.salle}:${ev.par}`; t.coups[c] = (t.coups[c] || 0) + 1; if (p.sceau) t.coupsPendant++; }
      if (ev.type === 'texte' && /^RATÉ/.test(ev.s)) t.rates++;
      if (ev.type === 'texte' && /LIBÈRE/.test(ev.s)) t.libere++;
    }
    p.evenements.length = 0;
  }
  t.parties++; t.morts += p.etat === 'mort' ? 1 : 0; t.sceaux += p.sceaux; t.duree += p.t;
}
console.log(`${niveau} · ${t.parties} parties : ${t.morts} perdues, ${(t.sceaux / N).toFixed(1)} sceaux réussis, ${(t.rates / N).toFixed(2)} ratés, ${(t.libere / N).toFixed(2)} Gouvernante libérée, ${(t.tempsSceau / N).toFixed(0)} s à tracer sur ${(t.duree / N).toFixed(0)} s`);
console.log('cœurs perdus (salle:par) :', Object.entries(t.coups).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(v / N).toFixed(2)}`).join(' · '), `· pendant un sceau ${(t.coupsPendant / N).toFixed(2)}`);
