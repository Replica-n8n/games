// Les affaires inédites sur l'accueil (maquette validée par Julie le
// 2026-10-26, docs/conviction-affaires/) : l'affaire du jour, puis deux
// boîtes, « What if » et « Grand mélange », qui ouvrent une feuille de choix.
// Les affaires se fabriquent dans l'atelier (ui/atelier.js, un Worker) :
// - une RÉSERVE se remplit en arrière-plan tant que l'accueil est ouvert
//   (2 par mode et par niveau « au hasard »), pour que « Tirer » soit
//   immédiat ; une affaire réussie d'un autre niveau que celui cherché est
//   gardée pour son niveau MESURÉ, jamais jetée ;
// - un univers choisi se cherche à la demande, sur plusieurs Workers.
// Une affaire tirée est rangée sous `affaire:<id>` et s'ouvre par
// `?affaire=<id>` ; l'identifiant suffit à la refaire (engine/procedural.js).

import { UI } from '../i18n/fr.js';
import { nomUnivers, EMBLEMES_UNIVERS } from '../i18n/affaires.js';
import { catalogue, universJouables, slugUnivers, numeroDuJour } from '../engine/procedural.js';
import { buste } from './buste.js';
import { plan } from './home.js';
import { load, save } from './storage.js';

/** @typedef {import('../engine/types.js').Puzzle} Puzzle */
/** @typedef {import('../engine/types.js').Difficulty} Difficulty */
/** @typedef {'whatif' | 'melange'} Mode */
/** @typedef {{ mode: Mode, univers?: string, difficulty: Difficulty }} Tache */

const NIVEAUX = /** @type {const} */ (['facile', 'moyen', 'difficile']);
/** Combien d'affaires la réserve garde d'avance, au hasard et par univers choisi. */
const PLEIN = { hasard: 2, univers: 1 };
/** Combien d'affaires tirées on garde (et leur partie) avant d'effacer les plus vieilles. */
const GARDEES = 25;

const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));
const esc = (/** @type {string} */ s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
const atelier = () => new Worker(new URL('./atelier.js', import.meta.url), { type: 'module' });
/** Un numéro d'affaire neuf. */
const numeroNeuf = () => 1 + Math.floor(Math.random() * 9e6);
/** La case de la réserve. @param {Mode} mode @param {string | undefined} univers @param {Difficulty} d */
const cle = (mode, univers, d) => `${mode}|${univers ? slugUnivers(univers) : '*'}|${d}`;

/** @returns {Record<string, Puzzle[]>} */
const reserve = () => load('reserve', {});
/** Range une affaire réussie dans sa case, si elle n'est pas pleine. @param {Puzzle} p @param {Mode} mode @param {string | undefined} univers */
function ranger(p, mode, univers) {
  const r = reserve(), k = cle(mode, univers, p.difficulty);
  const l = r[k] ?? [];
  if (l.length >= (univers ? PLEIN.univers : PLEIN.hasard) || l.some((x) => x.id === p.id)) return false;
  r[k] = [...l, p];
  save('reserve', r);
  return true;
}

/** Garde une affaire tirée, et oublie les plus vieilles (et leurs parties). @param {Puzzle} p */
export function garder(p) {
  save(`affaire:${p.id}`, p);
  const liste = /** @type {string[]} */ (load('affaires', [])).filter((x) => x !== p.id);
  liste.push(p.id);
  for (const vieux of liste.splice(0, Math.max(0, liste.length - GARDEES))) {
    try { localStorage.removeItem(`conviction:affaire:${vieux}`); localStorage.removeItem(`conviction:partie:${vieux}`); } catch { /* rien */ }
  }
  save('affaires', liste);
}

/** Une affaire classée : le compte de son mode (les boîtes l'affichent). @param {Puzzle} p */
export function classerInedite(p) {
  const mode = p.id.split('-')[1];
  const n = /** @type {Record<string, number>} */ (load('inedites', {}));
  const deja = /** @type {string[]} */ (load('inedites-classees', []));
  if (deja.includes(p.id)) return;
  n[mode] = (n[mode] ?? 0) + 1;
  save('inedites', n);
  save('inedites-classees', [...deja, p.id].slice(-GARDEES));
}

/** Refait une affaire depuis son identifiant, dans l'atelier. @param {string} id @returns {Promise<Puzzle | null>} */
export function refaire(id) {
  return new Promise((ok) => {
    const w = atelier();
    w.onmessage = (ev) => { w.terminate(); ok(ev.data.puzzle); };
    w.onerror = () => { w.terminate(); ok(null); };
    w.postMessage({ cmd: 'refaire', id });
  });
}

/** Le jour, 20261026, et ce qu'on en a. */
const aujourdhui = () => numeroDuJour(new Date());

/**
 * Les affaires inédites sur l'accueil, juste sous l'enquête conseillée.
 * @param {Puzzle[]} puzzles @param {Mode | null} ouvrir la feuille à ouvrir tout de suite (`?inedite=`)
 */
export function mountInedites(puzzles, ouvrir) {
  const cat = catalogue(puzzles);
  const us = universJouables(cat);
  const visage = (/** @type {string} */ nom) => {
    const g = cat.tous.find((x) => x.name === nom) ?? cat.tous[0];
    return buste({ ...g, id: 'e', color: 'ocre', clue: { type: 'seated' }, testimony: '' }, '', true);
  };
  const section = document.createElement('section');
  section.className = 'inedites';
  section.id = 'inedites';
  $('une').after(section);
  const feuille = /** @type {HTMLDialogElement} */ (document.createElement('dialog'));
  feuille.className = 'fiche tirage';
  feuille.id = 'tirage';
  document.body.append(feuille);

  // ---------- L'affaire du jour ----------
  const jour = aujourdhui();
  let duJour = load('jour', /** @type {{ jour: number, puzzle: Puzzle } | null} */ (null));
  if (duJour?.jour !== jour) duJour = null;
  let wJour = /** @type {Worker | null} */ (null);
  if (!duJour) {
    wJour = atelier();
    wJour.onmessage = (ev) => {
      wJour?.terminate(); wJour = null;
      if (!ev.data.puzzle) return;
      duJour = { jour, puzzle: ev.data.puzzle };
      save('jour', duJour);
      dessiner();
      remplir();
    };
    wJour.postMessage({ cmd: 'jour', jour });
  }

  // ---------- La réserve, en arrière-plan ----------
  let fond = /** @type {Worker | null} */ (null);
  const manque = () => /** @type {Tache[]} */ (['whatif', 'melange'].flatMap((mode) => NIVEAUX.filter((d) => (reserve()[cle(/** @type {Mode} */ (mode), undefined, d)]?.length ?? 0) < PLEIN.hasard).map((d) => ({ mode: /** @type {Mode} */ (mode), difficulty: d }))));
  function remplir() {
    // Une seule chose à la fois : l'affaire du jour d'abord.
    if (fond || wJour || attente) return;
    const taches = manque();
    if (!taches.length) return;
    fond = atelier();
    fond.onmessage = (ev) => {
      const { puzzle, tache } = ev.data;
      if (puzzle && ranger(puzzle, tache.mode, undefined)) majPretes();
      if (!manque().length) { fond?.terminate(); fond = null; }
    };
    fond.postMessage({ cmd: 'chercher', taches, depart: numeroNeuf(), pas: 1 });
  }
  const arreterFond = () => { fond?.terminate(); fond = null; };

  // ---------- Le dessin ----------
  function dessiner() {
    const n = /** @type {Record<string, number>} */ (load('inedites', {}));
    const classeeJour = /** @type {string[]} */ (load('inedites-classees', [])).includes(`affaire-jour-${jour}`);
    const date = new Date();
    const court = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    // Direction A (2026-10-26) : une rangée de trois tuiles sous l'enquête conseillée,
    // l'affaire du jour en page de journal, les deux modes en boîtes.
    const journal = duJour
      ? `<a class="tuile journal" href="?affaire=${encodeURIComponent(duJour.puzzle.id)}" aria-label="${esc(`${UI.duJour(date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }))}, ${classeeJour ? UI.classee : UI.niveaux[duJour.puzzle.difficulty]}`)}"><span class="date" aria-hidden="true">${esc(court)}</span><b>${UI.duJourCourt}</b><small>${classeeJour ? UI.classee : UI.niveaux[duJour.puzzle.difficulty]}</small></a>`
      : `<span class="tuile journal attente" role="status"><span class="date" aria-hidden="true">${esc(court)}</span><b>${UI.duJourCourt}</b><small>${UI.sePrepare}</small></span>`;
    section.innerHTML = `<h2 class="sec">${UI.jouer}</h2><div class="trois">${journal}
      <button type="button" class="tuile wi" data-mode="whatif" aria-label="${esc(`${UI.whatif}, ${UI.resolues(n.whatif ?? 0)}`)}"><span class="rond" aria-hidden="true">${visage('Cersei')}</span><b>${UI.whatif}</b><small>${UI.resolues(n.whatif ?? 0)}</small></button>
      <button type="button" class="tuile mel" data-mode="melange" aria-label="${esc(`${UI.melange}, ${UI.resolues(n.melange ?? 0)}`)}"><span class="pile" aria-hidden="true">${['Vegapunk', 'Anubis', 'Dr Watson'].map((x) => `<span>${visage(x)}</span>`).join('')}</span><b>${UI.melange}</b><small>${UI.resolues(n.melange ?? 0)}</small></button></div>`;
  }

  // ---------- La feuille de choix ----------
  /** @type {{ mode: Mode, univers?: string, difficulty: Difficulty }} */
  const choix = { mode: 'whatif', difficulty: 'moyen' };
  /** @type {null | { workers: Worker[] }} */
  let attente = null;

  /** @param {Mode} mode */
  function ouvrirFeuille(mode) {
    choix.mode = mode;
    choix.univers = undefined;
    const univ = mode === 'whatif' ? `<h3>${UI.univers}</h3><div class="univers" role="group" aria-label="${UI.univers}">
      <button type="button" data-u="" aria-pressed="true"><span class="f hasard" aria-hidden="true">?</span>${UI.auHasard}</button>
      ${us.map((u) => `<button type="button" data-u="${esc(u)}" aria-pressed="false"><span class="f" aria-hidden="true">${visage(EMBLEMES_UNIVERS[u] ?? cat.gens.get(u)?.[0]?.name ?? '')}</span>${esc(nomUnivers(u))}</button>`).join('')}</div>` : '';
    feuille.innerHTML = `<div class="feuille"><button type="button" class="fermer" data-f="fermer" aria-label="${UI.fermer}">×</button>
      <h2>${mode === 'whatif' ? UI.whatif : UI.melange}</h2><p>${mode === 'whatif' ? UI.whatifTexte : UI.melangeTexte}</p>${univ}
      <h3>${UI.niveau}</h3><div class="niveaux" role="group" aria-label="${UI.niveau}">${NIVEAUX.map((d) => `<button type="button" data-d="${d}" aria-pressed="${d === choix.difficulty}">${UI.niveaux[d]}<small></small></button>`).join('')}</div>
      <div class="action"><button type="button" class="btn principal tirer" data-f="tirer">${UI.tirer}</button></div></div>`;
    majPretes();
    feuille.showModal();
  }

  /** Les niveaux déjà prêts dans la réserve. */
  function majPretes() {
    if (!feuille.open && !feuille.innerHTML) return;
    const r = reserve();
    for (const b of feuille.querySelectorAll('[data-d]')) {
      const d = /** @type {Difficulty} */ (/** @type {HTMLElement} */ (b).dataset.d);
      /** @type {HTMLElement} */ (b.querySelector('small')).textContent = r[cle(choix.mode, choix.univers, d)]?.length ? UI.prete : '';
    }
  }

  feuille.addEventListener('click', (ev) => {
    const t = /** @type {HTMLElement} */ (ev.target).closest('button');
    if (!t) return;
    if (t.dataset.f === 'fermer') { annuler(); feuille.close(); return; }
    if (t.dataset.f === 'annuler') { annuler(); ouvrirFeuille(choix.mode); return; }
    if (t.dataset.u !== undefined) {
      choix.univers = t.dataset.u || undefined;
      for (const b of feuille.querySelectorAll('[data-u]')) b.setAttribute('aria-pressed', String(b === t));
      majPretes();
    }
    if (t.dataset.d) {
      choix.difficulty = /** @type {Difficulty} */ (t.dataset.d);
      for (const b of feuille.querySelectorAll('[data-d]')) b.setAttribute('aria-pressed', String(b === t));
    }
    if (t.dataset.f === 'tirer') tirer();
  });
  feuille.addEventListener('close', annuler);

  function tirer() {
    const r = reserve(), k = cle(choix.mode, choix.univers, choix.difficulty);
    const pret = r[k]?.[0];
    if (pret) {
      r[k] = r[k].slice(1);
      save('reserve', r);
      return partir(pret);
    }
    // Rien d'avance : on cherche sur plusieurs Workers, la réserve attend.
    arreterFond();
    const n = Math.max(1, Math.min(4, (navigator.hardwareConcurrency ?? 2) - 1));
    const depart = numeroNeuf();
    let essais = 0;
    const workers = Array.from({ length: n }, (_, w) => {
      const o = atelier();
      o.onmessage = (ev) => {
        const { puzzle } = ev.data;
        essais++;
        const p = feuille.querySelector('.essais');
        if (p) p.textContent = UI.essais(essais);
        if (!puzzle) return;
        if (puzzle.difficulty === choix.difficulty) { annuler(); partir(puzzle); } else ranger(puzzle, choix.mode, choix.univers);
      };
      o.postMessage({ cmd: 'chercher', taches: [{ ...choix }], depart: depart + w, pas: n });
      return o;
    });
    attente = { workers };
    /** @type {HTMLElement} */ (feuille.querySelector('.action')).innerHTML = `<p class="prepare" role="status">${UI.prepare} <span class="essais"></span></p><button type="button" class="btn" data-f="annuler">${UI.annuler}</button>`;
  }

  function annuler() {
    if (!attente) return;
    for (const w of attente.workers) w.terminate();
    attente = null;
    remplir();
  }

  /** @param {Puzzle} p */
  function partir(p) {
    garder(p);
    location.href = `?affaire=${encodeURIComponent(p.id)}`;
  }

  section.addEventListener('click', (ev) => {
    const b = /** @type {HTMLElement} */ (ev.target).closest('[data-mode]');
    if (b) ouvrirFeuille(/** @type {Mode} */ (/** @type {HTMLElement} */ (b).dataset.mode));
  });
  // L'atelier ne travaille que si la page se voit (batterie).
  document.addEventListener('visibilitychange', () => { if (document.hidden) arreterFond(); else remplir(); });

  dessiner();
  remplir();
  if (ouvrir) ouvrirFeuille(ouvrir);
}
