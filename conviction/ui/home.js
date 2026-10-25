// Accueil, direction « Le bureau du détective » (choisie par Julie le
// 2026-10-16, planche docs/conviction-accueil.png). En haut, UNE enquête
// conseillée, en grand : le plan, la photo de la victime, un bouton. Un
// nouveau venu sait quoi faire (la liste de fiches d'avant était « austère »).
// Dessous, les THÈMES seulement, une boîte d'archives chacun (direction A,
// choisie par Julie le 2026-10-17 sur docs/conviction-menu-themes.png : les
// rayons de chemises faisaient 5,5 écrans, on s'y perdait). Une boîte ouvre
// la page de son thème (`?theme=…`, le bouton retour du téléphone y ramène),
// où chaque enquête est une ligne. Un chapitre 2 reste scellé tant que le 1
// n'est pas résolu : l'histoire se suit.

import { UI } from '../i18n/fr.js';
import { formatClock } from './state.js';
import { buste } from './buste.js';
import { furnitureIcon } from './icons.js';
import { load } from './storage.js';
import { TROPHEES, obtenus, gagnerAccueil, medaille } from './trophees.js';

/** @typedef {import('../engine/types.js').Puzzle} Puzzle */

const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));

/** @param {Puzzle[]} puzzles dans l'ordre de puzzles/index.json @param {string | null} [theme] le thème ouvert (`?theme=`) */
export function mountHome(puzzles, theme = null) {
  /** @type {Record<string, { time: number, hints: number }>} */
  const records = load('records', {});
  /** @param {Puzzle} p @returns {'neuve' | 'encours' | 'resolue'} */
  const etat = (p) => {
    if (records[p.id]) return 'resolue';
    const s = load(`partie:${p.id}`, /** @type {{ actions?: unknown[] } | null} */ (null));
    return s && Array.isArray(s.actions) && s.actions.length ? 'encours' : 'neuve';
  };
  const victime = (/** @type {Puzzle} */ p) => /** @type {import('../engine/types.js').Person} */ (p.persons.find((x) => x.victim));
  /** Le chapitre précédent de la même histoire. @param {Puzzle} p */
  const precedent = (p) => (p.chapitre && p.chapitre > 1 ? puzzles.find((x) => x.title === p.title && x.collection === p.collection && x.chapitre === (p.chapitre ?? 0) - 1) : undefined);
  /** Scellé : la suite d'un chapitre pas encore résolu. @param {Puzzle} p */
  const scelle = (p) => { const q = precedent(p); return !!q && etat(q) !== 'resolue' && etat(p) === 'neuve'; };

  // ---------- L'enquête conseillée ----------
  // La dernière ouverte si elle est en cours, sinon la première jouable non résolue.
  const derniere = puzzles.find((p) => p.id === load('derniere', '') && etat(p) === 'encours');
  const conseil = derniere ?? puzzles.find((p) => etat(p) !== 'resolue' && !scelle(p)) ?? puzzles[0];
  const reprise = etat(conseil) === 'encours';
  const tout = etat(conseil) === 'resolue'; // toutes classées : on propose de rejouer
  const s = load(`partie:${conseil.id}`, { elapsed: 0 });
  const v = victime(conseil);
  const une = $('une');
  une.setAttribute('href', `?enquete=${encodeURIComponent(conseil.id)}`);
  une.dataset.ambiance = conseil.ambiance ?? 'jour';
  une.innerHTML = `${plan(conseil, true)}
    <span class="polaroid" aria-hidden="true"><span class="face">${buste(v, '', true)}</span><i>${esc(v.name.split(' ')[0])}</i></span>
    <span class="txt"><span class="k">${esc([reprise ? UI.reprendre : tout ? UI.toutClasse : UI.conseillee, conseil.collection ?? ''].filter(Boolean).join(' · '))}</span>
    <span class="t">${esc(conseil.sousTitre ?? conseil.title)}</span>
    <span class="acc">${esc(reprise ? `${detailNiveau(conseil)} · ${formatClock(s.elapsed ?? 0)}` : accroche(conseil))}</span>
    <span class="btn principal">${reprise ? UI.reprendreEnquete : tout ? UI.rejouer : UI.ouvrirDossier}</span></span>`;

  // ---------- Les thèmes ----------
  const themes = [...new Set(puzzles.map(collectionDe))].map((nom) => ({ nom, ps: puzzles.filter((p) => collectionDe(p) === nom) }));
  const ouvert = themes.find((t) => themeSlug(t.nom) === theme);
  if (ouvert) pageTheme(ouvert);
  else $('collections').innerHTML = `<h2 class="sec">${UI.parTheme}</h2><div class="boites">${themes.map(boite).join('')}</div>`;
  const resolues = puzzles.filter((p) => etat(p) === 'resolue').length;
  $('compte').textContent = UI.affairesClassees(resolues, puzzles.length);

  // ---------- La vitrine des trophées ----------
  const neufs = gagnerAccueil(puzzles, records);
  const gagnes = obtenus();
  $('vitrine').innerHTML = `<h2>${UI.trophees} <span>${UI.surN(Object.keys(gagnes).length, TROPHEES.length)}</span></h2><div class="medailles">${
    TROPHEES.map((t) => `<div class="medaille${gagnes[t.id] ? ' gagnee' : ''}">${medaille(t, !!gagnes[t.id])}<b>${esc(t.nom)}</b><small>${esc(t.desc)}</small></div>`).join('')}</div>`;
  if (neufs.length) annoncer(`${UI.nouveauxTrophees(neufs.length)} : ${neufs.map((t) => t.nom).join(', ')}`);

  /** L'emblème d'un thème : un personnage qui le dit au premier coup d'œil. @param {{ nom: string, ps: Puzzle[] }} t */
  function embleme(t) {
    const tous = t.ps.flatMap((p) => p.persons);
    return tous.find((x) => x.name === EMBLEMES[t.nom]) ?? tous.find((x) => !x.victim) ?? tous[0];
  }

  /** Une boîte d'archives : le thème, ses lieux, un point par enquête. @param {{ nom: string, ps: Puzzle[] }} t */
  function boite(t) {
    const faites = t.ps.filter((p) => etat(p) === 'resolue').length;
    const lieux = [...new Set(t.ps.map((p) => p.theme))].slice(0, 3).join(', ');
    const points = t.ps.map((p) => `<i class="pt${etat(p) === 'resolue' ? ' ok' : etat(p) === 'encours' ? ' cours' : scelle(p) ? ' scel' : ''}"></i>`).join('');
    return `<a class="boite" href="?theme=${themeSlug(t.nom)}" aria-label="${esc(UI.boiteLabel(t.nom, faites, t.ps.length))}"><span class="etiq"><b>${esc(t.nom)}</b></span>`
      + `<span class="face" aria-hidden="true">${buste(embleme(t), '', true)}</span><span class="lieux" aria-hidden="true">${esc(lieux)}</span>`
      + `<span class="pas" aria-hidden="true">${points}<span>${faites}/${t.ps.length}</span></span></a>`;
  }

  /** La page d'un thème : ses enquêtes en lignes, les suites en retrait. @param {{ nom: string, ps: Puzzle[] }} t */
  function pageTheme(t) {
    une.hidden = true;
    $('vitrine').hidden = true;
    /** @type {HTMLElement} */ (document.querySelector('.titre-app')).hidden = true;
    const faites = t.ps.filter((p) => etat(p) === 'resolue').length;
    const histoires = new Set(t.ps.map((p) => p.title)).size;
    $('collections').innerHTML = `<a class="retour-theme" href="./">${UI.tousThemes}</a>`
      + `<header class="titre-theme"><span class="face" aria-hidden="true">${buste(embleme(t), '', true)}</span><span><h1>${esc(t.nom)}</h1><small>${UI.themeCompte(faites, t.ps.length, histoires)}</small></span></header>`
      + `<div class="lignes">${t.ps.map(ligne).join('')}</div>`;
    document.title = `${t.nom} · ${UI.appName}`;
  }

  /** Une enquête du thème : son plan, son titre, son niveau (ou classée, ou scellée). @param {Puzzle} p */
  function ligne(p) {
    const e = etat(p), ferme = scelle(p);
    const titre = p.chapitre && p.chapitre > 1 && p.sousTitre ? p.sousTitre : p.title;
    const sous = [p.chapitre ? UI.chapitre(p.chapitre) : p.theme, e === 'encours' ? UI.enCours : '', ferme ? UI.apresChapitre((p.chapitre ?? 2) - 1) : ''].filter(Boolean).join(' · ');
    const droite = ferme ? '<span class="cire" aria-hidden="true"></span>'
      : e === 'resolue' ? `<span class="etat classee">${UI.classee}</span>` : `<span class="etat ${p.difficulty}">${UI.niveaux[p.difficulty]}</span>`;
    const etiquette = [titre, sous, UI.niveaux[p.difficulty], e === 'resolue' ? UI.classee : '', ferme ? UI.scelle : ''].filter(Boolean).join(', ');
    const cls = `ligne${ferme ? ' scellee' : ''}${p.chapitre && p.chapitre > 1 ? ' chap2' : ''}${e === 'resolue' ? ' faite' : ''}`;
    const dedans = `${plan(p, false)}<span class="t"><b>${esc(titre)}</b><small>${esc(sous)}</small></span>${droite}`;
    return ferme
      ? `<button type="button" class="${cls}" data-scelle="${p.id}" aria-label="${esc(etiquette)}">${dedans}</button>`
      : `<a class="${cls}" href="?enquete=${encodeURIComponent(p.id)}" aria-label="${esc(etiquette)}">${dedans}</a>`;
  }

  // Un chapitre scellé explique pourquoi, au lieu de ne rien faire.
  $('collections').addEventListener('click', (ev) => {
    const b = /** @type {HTMLElement} */ (ev.target).closest('[data-scelle]');
    if (!b) return;
    const p = puzzles.find((x) => x.id === /** @type {HTMLElement} */ (b).dataset.scelle);
    const q = p && precedent(p);
    if (!q) return;
    annoncer(UI.scelleTexte((p.chapitre ?? 2) - 1, q.title));
  });

  $('accueil').hidden = false;
}

/** Le thème d'une enquête (sa collection). @param {Puzzle} p */
export const collectionDe = (p) => p.collection ?? UI.sansCollection;

/** Le nom d'un thème dans l'adresse : « Le Trône de fer » -> « le-trone-de-fer ». @param {string} nom */
export const themeSlug = (nom) => nom.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Le personnage emblème de chaque thème (sinon son premier personnage). */
const EMBLEMES = /** @type {Record<string, string>} */ ({
  'Affaires originales': 'Victor', 'Sherlock Holmes': 'Dr Watson', 'Hercule Poirot': 'Dragomiroff', 'Agatha Christie': 'Juge Wargrave',
  'Le Trône de fer': 'Cersei', 'Grands classiques': 'Frédéric Larsan', 'Cluedo': 'Colonel Moutarde', 'Benoit Blanc': 'Harlan Thrombey',
  "Les invités de l'Arcade": 'Le Crapaud', 'One Piece': 'Sabo', 'Mythologies': 'Anubis', 'Le jeu de cartes': 'Judith',
});

/** Un message bref en bas de l'écran. @param {string} texte */
function annoncer(texte) {
  const msg = $('msg-scelle');
  msg.textContent = texte;
  msg.hidden = false;
  clearTimeout(Number(msg.dataset.t));
  msg.dataset.t = String(setTimeout(() => { msg.hidden = true; }, 3500));
}

/** Le plan en miniature, comme sur la maquette : sols, murs, et les meubles en grand. @param {Puzzle} p @param {boolean} meubles */
export function plan(p, meubles) {
  const n = p.size;
  const mat = new Map(p.rooms.map((r) => [r.id, r.material]));
  const f = new Map();
  if (meubles) for (const m of p.furniture) for (const [r, c] of m.cells) f.set(r * n + c, m.type);
  let h = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const k = p.layout[r][c];
      if (k === '.') { h += '<i class="hors"></i>'; continue; }
      const w = [r === 0 || p.layout[r - 1][c] !== k ? 'wt' : '', c === 0 || p.layout[r][c - 1] !== k ? 'wl' : '', r === n - 1 ? 'wb' : '', c === n - 1 ? 'wr' : ''].filter(Boolean).join(' ');
      const t = f.get(r * n + c);
      h += `<i class="sol-${mat.get(k)} ${w}">${t ? furnitureIcon(t, '') : ''}</i>`;
    }
  }
  return `<span class="plan-mini" style="--n:${n}" data-ambiance="${p.ambiance ?? 'jour'}" aria-hidden="true">${h}</span>`;
}

/** « Chapitre 2 · Moyen », sinon « Moyen ». @param {Puzzle} p */
function detailNiveau(p) {
  return [p.chapitre ? UI.chapitre(p.chapitre) : '', UI.niveaux[p.difficulty]].filter(Boolean).join(' · ');
}

/** La première phrase de l'intro (deux si la première est courte). @param {Puzzle} p */
function accroche(p) {
  const ph = p.intro.split(/(?<=[.!?])\s+/);
  return ph[0].length < 40 && ph[1] ? `${ph[0]} ${ph[1]}` : ph[0];
}

/** @param {string} s */
function esc(s) {
  return s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch] ?? ch);
}
