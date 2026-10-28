// La carte du système solaire, en formes simples (HTML) : de bas en haut, Jungle,
// Désert, Océan, Ceinture. Une pastille par mission ; les missions pas encore écrites
// sont marquées « bientôt ».
import { PLANETES_ORDRE, CHEMINS, SECRETES, estOuverte, prochaine } from '../moteur/progression.js';
import { PLANETES, NOM_MODULE } from '../contenu/planetes.js';
import { MISSIONS, MISSIONS_EXISTANTES } from '../contenu/missions.js';
import { LISTE_ARMES } from '../moteur/tirs.js';

/**
 * @param {{ planetes: HTMLElement, resume: HTMLElement, continuer: HTMLButtonElement }} el
 * @param {any} s  la sauvegarde
 * @param {(id: string) => void} lancer
 */
export function remplirCarte(el, s, lancer, toutOuvert = false) {
  // toutOuvert : réglage de test, chaque mission écrite se lance sans avoir fini celles d'avant
  const ouvert = (id) => toutOuvert || estOuverte(s, id);
  const astronautes = Object.values(s.missions).reduce((n, m) => n + m.cages.length, 0);
  const pl = (n, un, des) => `${n} ${n > 1 ? des : un}`;
  el.resume.textContent = `${pl(astronautes, 'astronaute délivré', 'astronautes délivrés')} · ${s.armes.length} ${s.armes.length > 1 ? 'armes' : 'arme'} sur ${LISTE_ARMES.length} · ${pl(s.cristaux, 'cristal', 'cristaux')}`;
  el.planetes.innerHTML = '';
  for (const pid of [...PLANETES_ORDRE].reverse()) {
    const P = PLANETES[pid];
    const bloc = document.createElement('section');
    bloc.className = 'planete';
    bloc.style.setProperty('--c', P.couleur);
    const existantes = CHEMINS[pid].filter((id) => MISSIONS_EXISTANTES.includes(id));
    if (!existantes.length) bloc.classList.add('lointaine');
    // Une planète sans aucune mission écrite tient sur une ligne : l'action principale
    // (« Continuer ») doit rester visible sans faire défiler, même sur un écran de 640 px.
    if (!existantes.length) {
      bloc.innerHTML = `<h2>${P.nom} <small>${NOM_MODULE[P.module]} · bientôt</small></h2>`;
      el.planetes.append(bloc);
      continue;
    }
    bloc.innerHTML = `<h2>${P.nom} <small>${NOM_MODULE[P.module]}</small></h2>`;
    const chemin = document.createElement('div');
    chemin.className = 'chemin';
    CHEMINS[pid].forEach((id, i) => {
      const b = document.createElement('button');
      const M = MISSIONS[id], m = s.missions[id];
      const ouverte = M && ouvert(id);
      b.className = 'mission' + (m?.fini ? ' finie' : ouverte ? ' ouverte' : '');
      b.disabled = !ouverte;
      const boss = id.endsWith('boss');
      const nCages = M ? Object.keys(M.cages).length : 0;
      const points = M && ouverte ? `<span class="points">${'●'.repeat(m?.cages.length ?? 0)}${'○'.repeat(nCages - (m?.cages.length ?? 0))}</span>` : '';
      b.innerHTML = `<b>${boss ? 'Boss' : i + 1}</b>${M ? (ouverte ? points : '<small aria-hidden="true">🔒</small>') : '<small aria-hidden="true">…</small>'}`;
      b.setAttribute('aria-label', `${P.nom}, ${boss ? 'boss' : 'mission ' + (i + 1)}${M ? (m?.fini ? ', finie' : ouverte ? ', à jouer' : ', fermée') : ', bientôt'}`);
      if (M) b.title = M.nom;
      b.onclick = () => lancer(id);
      chemin.append(b);
    });
    // La mission secrète : la bifurcation se voit dès le début, cadenassée, avec ce qu'il faut faire
    const sid = SECRETES[pid], S = MISSIONS[sid];
    if (S) {
      const ouvreur = CHEMINS[pid].find((id) => MISSIONS[id]?.ouvreSecret === pid);
      const b = document.createElement('button');
      const ouverte = ouvert(sid), m = s.missions[sid];
      b.className = 'mission secrete' + (m?.fini ? ' finie' : ouverte ? ' ouverte' : '');
      b.disabled = !ouverte;
      b.innerHTML = ouverte
        ? `<b>Mission secrète : ${S.nom}</b>`
        : `<b>🔒 Mission secrète</b><small>Sauve le copain de la mission ${CHEMINS[pid].indexOf(ouvreur) + 1}</small>`;
      b.onclick = () => lancer(sid);
      chemin.append(b);
    }
    bloc.append(chemin);
    if (existantes.length < CHEMINS[pid].length) {
      const n = document.createElement('p');
      n.className = 'bientot';
      n.textContent = 'Les missions suivantes arrivent bientôt.';
      bloc.append(n);
    }
    el.planetes.append(bloc);
  }
  const p = prochaine(s, MISSIONS_EXISTANTES);
  const M = MISSIONS[p];
  el.continuer.textContent = `Continuer : ${PLANETES[M.planete].nom}, mission ${CHEMINS[M.planete].indexOf(p) + 1}`;
  el.continuer.onclick = () => lancer(p);
}
