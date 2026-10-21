// Le robot joue chaque mission sur plusieurs graines, sans invincibilité : durée, coups
// encaissés, morts, cristaux, astronautes. Sert à l'équilibrage.
//   node tools/patrouille-robot.mjs
import { MISSIONS } from '../patrouille/contenu/missions.js';
import { jouer } from './patrouille-robot-lib.mjs';

for (const id of Object.keys(MISSIONS)) {
  const r = [1, 2, 3, 4, 5].map((g) => jouer(id, { graine: g }));
  const moy = (k) => (r.reduce((s, x) => s + x[k], 0) / r.length).toFixed(1);
  const morts = r.filter((x) => x.etat === 'mort').length;
  console.log(`${id} : ${morts}/5 morts · ${moy('duree')} s · ${moy('coups')} coups · ${moy('cristaux')} cristaux · ${moy('cages')}/${r[0].totalCages} astronautes`);
}
