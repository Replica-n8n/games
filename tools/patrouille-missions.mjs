// Vérifie chaque fiche de mission : formations et ennemis connus, cages déclarées et
// posées, fin présente, durée de 2 à 3 minutes jouée par le robot invincible.
//   node tools/patrouille-missions.mjs
import { MISSIONS } from '../patrouille/contenu/missions.js';
import { ENNEMIS } from '../patrouille/contenu/ennemis.js';
import { FORMATIONS } from '../patrouille/moteur/vagues.js';
import { jouer } from './patrouille-robot-lib.mjs';

const fautes = [];
for (const [id, m] of Object.entries(MISSIONS)) {
  const posees = new Set();
  let fin = false;
  for (const [t, v] of m.vagues) {
    if (!FORMATIONS[v.f]) fautes.push(`${id} à ${t} s : formation inconnue « ${v.f} »`);
    for (const champ of ['type', 'cache']) if (v[champ] && !ENNEMIS[v[champ]]) fautes.push(`${id} à ${t} s : ennemi inconnu « ${v[champ]} »`);
    if (v.f === 'cage') { if (!m.cages[v.id]) fautes.push(`${id} : cage « ${v.id} » posée mais pas déclarée`); posees.add(v.id); }
    if (v.f === 'fin') fin = true;
  }
  for (const c of Object.keys(m.cages)) if (!posees.has(c)) fautes.push(`${id} : cage « ${c} » déclarée mais jamais posée`);
  if (!fin) fautes.push(`${id} : pas de « fin »`);
  const durees = [1, 2, 3].map((g) => jouer(id, { graine: g, invincible: true }).duree);
  const ok = durees.every((d) => d >= 120 && d <= 180);
  console.log(`${ok ? '✓' : '✗'} ${id} « ${m.nom} » : ${durees.join(' / ')} s`);
  if (!ok) fautes.push(`${id} : durée hors de 2 à 3 minutes (${durees.join(', ')} s)`);
}
if (fautes.length) { console.log('✗ ' + fautes.join('\n✗ ')); process.exit(1); }
console.log('✓ toutes les missions sont valides');
