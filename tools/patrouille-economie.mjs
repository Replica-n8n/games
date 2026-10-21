// Économie du Hangar : combien de cristaux une mission LÂCHE, et ce qu'un joueur peut
// acheter mission après mission. Les robots ramassent mal (un quart des cristaux), un
// enfant attentif presque tout : les prix se règlent sur ce qu'il lâche, pas sur le robot.
// Le joueur achète toujours le moins cher (tir, puis cœurs, puis aimant à prix égal).
// Chaque planète a son module et son Hangar : seule la Jungle (avion) existe pour l'instant.
//   node tools/patrouille-economie.mjs              tableau
//   node tools/patrouille-economie.mjs --controle   garde-fous des prix
import { creePartie, pasPartie } from '../patrouille/moteur/partie.js';
import { MISSIONS } from '../patrouille/contenu/missions.js';
import { sauvegardeVide, PRIX_HANGAR } from '../patrouille/moteur/progression.js';
import { creerRobot, PROFILS } from './patrouille-robot-lib.mjs';

export const ORDRE = ['j1', 'j2', 'j3', 'j4', 'j5', 'jsecret', 'jboss'].filter((id) => MISSIONS[id]);
const GRAINES = 8;
/** Part des cristaux lâchés qu'un enfant ramasse (avec l'aimant de la mission). */
export const RAMASSE = { attentif: 0.85, parfait: 1 };

/** Cristaux lâchés en moyenne par mission (robot expert invincible : la mission se joue en entier). */
export function lacheParMission() {
  const res = {};
  for (const id of ORDRE) {
    let total = 0;
    for (let g = 1; g <= GRAINES; g++) {
      const p = creePartie({ mission: MISSIONS[id], graine: g, sauvegarde: sauvegardeVide(), options: { invincible: true } });
      const robot = creerRobot(PROFILS.expert, g), vus = new WeakSet();
      while (p.etat === 'jeu' && p.t < 400 * 60) {
        pasPartie(p, robot(p));
        for (const o of p.objets) if (o.k === 'cristal' && !vus.has(o)) { vus.add(o); total++; }
      }
    }
    res[id] = total / GRAINES;
  }
  return res;
}

/** Niveaux du Hangar AVANT chaque mission, pour un joueur qui achète dès qu'il peut. */
export function niveauxAvant(lache, part) {
  const h = { tir: 0, coeur: 0, aimant: 0 };
  let cristaux = 0;
  const res = {};
  for (const id of ORDRE) {
    res[id] = { ...h, reste: Math.round(cristaux) };
    cristaux += lache[id] * part;
    for (;;) {
      const k = ['tir', 'coeur', 'aimant'].filter((x) => h[x] < 3).sort((a, b) => PRIX_HANGAR[a][h[a]] - PRIX_HANGAR[b][h[b]])[0];
      if (!k || cristaux < PRIX_HANGAR[k][h[k]]) break;
      cristaux -= PRIX_HANGAR[k][h[k]]; h[k]++;
    }
  }
  res.fin = { ...h, reste: Math.round(cristaux) };
  return res;
}

const PRIX = Object.entries(PRIX_HANGAR).map(([k, v]) => `${k} ${v.join('/')}`).join(', ');
const somme = (h) => h.tir + h.coeur + h.aimant;

if (process.argv[1].endsWith('patrouille-economie.mjs')) {
  const lache = lacheParMission();
  const att = niveauxAvant(lache, RAMASSE.attentif), par = niveauxAvant(lache, RAMASSE.parfait);
  if (process.argv.includes('--controle')) {
    // Garde-fous : une amélioration (pas plus de deux) après la première mission ; le
    // module n'est jamais au maximum avant le boss, même en ramassant tout.
    const fautes = [];
    if (somme(par.j2) > 2) fautes.push(`après j1, déjà ${somme(par.j2)} améliorations en ramassant tout`);
    if (somme(att.j2) < 1) fautes.push('après j1, rien à acheter pour un enfant attentif');
    if (somme(par.jboss) >= 9) fautes.push('le module est au maximum avant le boss');
    if (somme(att.jboss) < 5) fautes.push(`seulement ${somme(att.jboss)} améliorations avant le boss pour un enfant attentif`);
    if (fautes.length) { console.log('✗ ' + fautes.join('\n✗ ')); process.exit(1); }
    console.log(`✓ économie du Hangar dans les garde-fous (${PRIX})`);
  } else {
    console.log(`Prix : ${PRIX} (9 niveaux = ${Object.values(PRIX_HANGAR).flat().reduce((a, b) => a + b)} cristaux)`);
    for (const id of [...ORDRE, 'fin']) {
      const a = att[id], b = par[id];
      console.log(`${(id === 'fin' ? 'après le boss' : 'avant ' + id).padEnd(14)} lâchés ${id === 'fin' ? '   ' : String(Math.round(lache[id])).padStart(3)} │ attentif ${somme(a)}/9 (tir ${a.tir} cœurs ${a.coeur} aimant ${a.aimant}) │ parfait ${somme(b)}/9`);
    }
  }
}
