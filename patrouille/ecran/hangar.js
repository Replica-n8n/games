// Le Hangar : on y dépense ses cristaux pour améliorer le module de chaque planète.
// Ce qui reste d'une séance à l'autre se voit ici et sur la carte.
import { PRIX_HANGAR, acheter } from '../moteur/progression.js';
import { NOM_MODULE } from '../contenu/planetes.js';

const AMELIORATIONS = [
  { k: 'tir', nom: 'Tir de base', niveaux: ['cadence plus rapide', 'tir double', 'tir en éventail'] },
  { k: 'coeur', nom: 'Cœurs', niveaux: ['4 cœurs', '5 cœurs', '6 cœurs'] },
  { k: 'aimant', nom: 'Aimant à cristaux', niveaux: ['attire de plus loin', 'encore plus loin', 'très loin'] },
];

/**
 * @param {{ liste: HTMLElement, resume: HTMLElement }} el
 * @param {any} s  la sauvegarde
 * @param {string} module  le module à améliorer
 * @param {(s: any) => void} changer  reçoit la nouvelle sauvegarde après un achat
 */
export function remplirHangar(el, s, module, changer) {
  const astronautes = Object.values(s.missions).reduce((n, m) => n + m.cages.length, 0);
  el.resume.textContent = `${NOM_MODULE[module]} · ${s.cristaux} ${s.cristaux > 1 ? 'cristaux' : 'cristal'} · ${astronautes} ${astronautes > 1 ? 'astronautes' : 'astronaute'} à bord du vaisseau-mère`;
  el.liste.innerHTML = '';
  for (const a of AMELIORATIONS) {
    const n = s.hangar[module][a.k], max = n >= 3, prix = PRIX_HANGAR[n];
    const ligne = document.createElement('div');
    ligne.className = 'amelioration';
    ligne.innerHTML = `<b>${a.nom} <span class="niveaux" aria-label="niveau ${n} sur 3">${'●'.repeat(n)}${'○'.repeat(3 - n)}</span></b><small>${max ? 'Au maximum' : 'Prochain : ' + a.niveaux[n]}</small>`;
    const b = document.createElement('button');
    b.className = 'acheter';
    b.textContent = max ? 'Max' : `${prix} cristaux`;
    b.disabled = max || s.cristaux < prix;
    b.onclick = () => changer(acheter(s, module, a.k));
    ligne.append(b);
    el.liste.append(ligne);
  }
}
