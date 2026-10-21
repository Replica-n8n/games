// Équilibrage : les deux robots jouent chaque mission sur 8 graines, sans invincibilité,
// avec les armes qu'un joueur aurait déjà trouvées dans les missions d'avant, et les
// améliorations du Hangar qu'un enfant attentif aurait pu s'offrir (patrouille-economie.mjs ;
// --sans-hangar pour un enfant qui n'achète rien).
// On lit : morts et coups de l'« enfant » (la difficulté vécue), et l'utilité des bonus
// (part des munitions et du temps de bonus passés avec un ennemi touchable à l'écran).
//   node tools/patrouille-robot.mjs            tableau
//   node tools/patrouille-robot.mjs --json     données brutes (pour les bancs)
import { MISSIONS } from '../patrouille/contenu/missions.js';
import { sauvegardeVide } from '../patrouille/moteur/progression.js';
import { jouer } from './patrouille-robot-lib.mjs';
import { lacheParMission, niveauxAvant, RAMASSE } from './patrouille-economie.mjs';

const GRAINES = Array.from({ length: 32 }, (_, i) => i + 1);
const ORDRE = ['j1', 'j2', 'j3', 'j4', 'j5', 'jsecret', 'jboss'].filter((id) => MISSIONS[id]);

/** Les armes trouvées dans les cages des missions jouées avant celle-ci. */
function sauvegardeAvant(id, niveaux) {
  const s = sauvegardeVide();
  if (niveaux) { const { tir, coeur, aimant } = niveaux[id]; s.hangar.avion = { tir, coeur, aimant }; }
  for (const m of ORDRE.slice(0, ORDRE.indexOf(id))) for (const c of Object.values(MISSIONS[m].cages)) if (c.arme && !s.armes.includes(c.arme)) s.armes.push(c.arme);
  return s;
}

export function mesurer({ hangar = true } = {}) {
  const niveaux = hangar ? niveauxAvant(lacheParMission(), RAMASSE.attentif) : null;
  const res = {};
  for (const id of ORDRE) {
    res[id] = {};
    for (const profil of ['expert', 'enfant']) {
      const r = GRAINES.map((g) => jouer(id, { graine: g, profil, sauvegarde: sauvegardeAvant(id, niveaux) }));
      const moy = (k) => r.reduce((s, x) => s + x[k], 0) / r.length;
      const moyNul = (k) => { const v = r.map((x) => x[k]).filter((x) => x !== null); return v.length ? v.reduce((a, b) => a + b) / v.length : null; };
      res[id][profil] = { morts: r.filter((x) => x.etat === 'mort').length / r.length, coups: moy('coups'), cristaux: moy('cristaux'), utiliteMun: moyNul('utiliteMun'), utiliteBonus: moyNul('utiliteBonus') };
    }
  }
  return res;
}

if (process.argv[1].endsWith('patrouille-robot.mjs')) {
  const res = mesurer({ hangar: !process.argv.includes('--sans-hangar') });
  if (process.argv.includes('--json')) console.log(JSON.stringify(res));
  else if (process.argv.includes('--controle')) {
    // Garde-fous d'équilibrage : un bon joueur ne meurt jamais, les bonus servent, aucune
    // mission n'écrase l'enfant (au-delà de 40 % d'échecs au premier essai).
    const fautes = [];
    for (const [id, r] of Object.entries(res)) {
      if (r.expert.morts > 0) fautes.push(`${id} : l'expert meurt (${Math.round(r.expert.morts * 100)} %)`);
      if (r.enfant.morts > 0.4) fautes.push(`${id} : l'enfant échoue ${Math.round(r.enfant.morts * 100)} % du temps`);
      for (const k of ['utiliteMun', 'utiliteBonus']) if (r.enfant[k] !== null && r.enfant[k] < 0.9) fautes.push(`${id} : ${k} ${Math.round(r.enfant[k] * 100)} % (bonus gaspillés)`);
    }
    if (fautes.length) { console.log('✗ ' + fautes.join('\n✗ ')); process.exit(1); }
    console.log('✓ équilibrage dans les garde-fous');
  }
  else {
    const pct = (v) => (v === null ? '  -' : `${Math.round(v * 100)}%`.padStart(4));
    for (const [id, r] of Object.entries(res)) {
      console.log([
        id.padEnd(8),
        `expert ${pct(r.expert.morts)} morts ${r.expert.coups.toFixed(1).padStart(4)} coups`,
        `enfant ${pct(r.enfant.morts)} morts ${r.enfant.coups.toFixed(1).padStart(4)} coups`,
        `munitions utiles ${pct(r.enfant.utiliteMun)} · bonus utiles ${pct(r.enfant.utiliteBonus)} · ${r.enfant.cristaux.toFixed(0)} cristaux`,
      ].join(' │ '));
    }
  }
}
