// Accueil : reprendre l'enquête en cours, puis une carte par histoire, rangée
// par collection. La carte ENTIÈRE se touche et ouvre la fiche de l'histoire :
// son accroche, puis chaque chapitre sur sa ligne avec un vrai bouton
// « Jouer ». (Avant, les difficultés étaient des pastilles qu'on prenait pour
// des étiquettes, et la carte elle-même ne faisait rien : vu par Julie.)
// La couverture est la victime, pas un plan miniature illisible.

import { UI } from '../i18n/fr.js';
import { formatClock } from './state.js';
import { buste } from './buste.js';
import { load } from './storage.js';

/** @typedef {import('../engine/types.js').Puzzle} Puzzle */

const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));

/** @param {Puzzle[]} puzzles dans l'ordre de puzzles/index.json */
export function mountHome(puzzles) {
  /** @type {Record<string, { time: number, hints: number }>} */
  const records = load('records', {});
  /** @param {Puzzle} p @returns {'neuve' | 'encours' | 'resolue'} */
  const etat = (p) => {
    if (records[p.id]) return 'resolue';
    const s = load(`partie:${p.id}`, /** @type {{ actions?: unknown[] } | null} */ (null));
    return s && Array.isArray(s.actions) && s.actions.length ? 'encours' : 'neuve';
  };
  const victime = (/** @type {Puzzle} */ p) => /** @type {import('../engine/types.js').Person} */ (p.persons.find((x) => x.victim));

  // Une histoire = ses chapitres (ou son unique enquête), dans l'ordre.
  /** @type {{ titre: string, collection: string, ch: Puzzle[] }[]} */
  const histoires = [];
  for (const p of puzzles) {
    const collection = p.collection ?? UI.sansCollection;
    const h = histoires.find((x) => x.titre === p.title && x.collection === collection);
    if (h) h.ch.push(p); else histoires.push({ titre: p.title, collection, ch: [p] });
  }

  // Reprendre : la dernière enquête ouverte, si elle n'est pas résolue.
  const derniere = puzzles.find((p) => p.id === load('derniere', ''));
  const reprendre = $('reprendre');
  if (derniere && etat(derniere) === 'encours') {
    const s = load(`partie:${derniere.id}`, { elapsed: 0 });
    reprendre.innerHTML = `<span class="couv" aria-hidden="true">${buste(victime(derniere), '', true)}</span><span class="r-txt"><span class="r-k">${UI.reprendre}</span><span class="r-t">${esc(derniere.title)}</span><span class="r-m">${esc(detailNiveau(derniere))} · ${formatClock(s.elapsed ?? 0)}</span></span><span class="chev" aria-hidden="true">›</span>`;
    reprendre.setAttribute('href', `?enquete=${encodeURIComponent(derniere.id)}`);
    reprendre.hidden = false;
  }

  const collections = [...new Set(histoires.map((h) => h.collection))];
  $('collections').innerHTML = collections.map((c) => `<section class="collection"><h2>${esc(c)}</h2><div class="cartes">${
    histoires.map((h, i) => (h.collection === c ? carte(h, i) : '')).join('')}</div></section>`).join('');
  const resolues = puzzles.filter((p) => etat(p) === 'resolue').length;
  $('compte').textContent = UI.compte(resolues, puzzles.length);

  /** @param {{ titre: string, ch: Puzzle[] }} h @param {number} i */
  function carte(h, i) {
    const p = h.ch[0];
    const faites = h.ch.filter((x) => etat(x) === 'resolue').length;
    const enCours = h.ch.some((x) => etat(x) === 'encours');
    const statut = faites === h.ch.length ? `<span class="statut ok">${UI.classee}</span>` : enCours ? `<span class="statut encours">${UI.enCours}</span>` : '';
    const niveaux = [...new Set(h.ch.map((x) => x.difficulty))].map((d) => `<span class="niv ${d}"><i></i>${UI.niveaux[d]}</span>`).join('');
    return `<button type="button" class="carte${faites === h.ch.length ? ' faite' : ''}" data-h="${i}" aria-haspopup="dialog">
      <span class="couv" aria-hidden="true">${buste(victime(p))}<span class="couv-k">${faites === h.ch.length ? UI.classee : UI.victime}</span></span>
      <span class="c-txt"><span class="c-t">${esc(h.titre)}</span><span class="c-m">${esc(accroche(p))}</span>
      <span class="bas">${h.ch.length > 1 ? `<span class="niv">${UI.nbChapitres(h.ch.length, faites)}</span>` : ''}${niveaux}${statut}</span></span>
      <span class="chev" aria-hidden="true">›</span></button>`;
  }

  // ---------- La fiche d'une histoire ----------
  const fiche = /** @type {HTMLDialogElement} */ ($('fiche'));
  /** @param {{ titre: string, collection: string, ch: Puzzle[] }} h */
  function ouvrir(h) {
    const p = h.ch[0];
    // Le chapitre à jouer : le premier qui n'est pas résolu.
    const prochain = h.ch.find((x) => etat(x) !== 'resolue') ?? null;
    const lignes = h.ch.map((x, k) => {
      const e = etat(x), rec = records[x.id];
      const nom = h.ch.length > 1 ? `${UI.chapitre(k + 1)} · ${x.sousTitre ?? x.title}` : UI.lEnquete;
      const s = load(`partie:${x.id}`, { elapsed: 0 });
      const detail = e === 'resolue' ? formatClock(rec?.time ?? 0) : e === 'encours' ? `${UI.enCours} · ${formatClock(s.elapsed ?? 0)}` : UI.nouvelle;
      const action = e === 'resolue' ? UI.rejouer : e === 'encours' ? UI.reprendre : UI.jouer;
      return `<div class="chap${e === 'resolue' ? ' fait' : ''}"><span class="n" aria-hidden="true">${e === 'resolue' ? '✓' : k + 1}</span>
        <span class="c-txt"><b>${esc(nom)}</b><span class="niv ${x.difficulty}"><i></i>${UI.niveaux[x.difficulty]} · ${esc(detail)}</span>${k > 0 && h.ch.length > 1 ? `<span class="apres">${UI.suiteDu(k)}</span>` : ''}</span>
        <a class="btn${x === prochain ? ' principal' : ''} jouer" href="?enquete=${encodeURIComponent(x.id)}" aria-label="${esc(`${action} : ${nom}`)}">${action}</a></div>`;
    }).join('');
    fiche.innerHTML = `<div class="feuille"><button type="button" class="fermer" data-fermer aria-label="${UI.fermer}">×</button>
      <p class="k">${esc(h.collection)} · ${esc(p.theme)}</p><h2>${esc(h.titre)}</h2>
      <p class="intro">${esc(accroche(p))}</p>${lignes}</div>`;
    fiche.showModal();
    /** @type {HTMLElement | null} */ (fiche.querySelector('.jouer.principal') ?? fiche.querySelector('.jouer'))?.focus();
  }
  $('collections').addEventListener('click', (ev) => {
    const c = /** @type {HTMLElement} */ (ev.target).closest('[data-h]');
    if (c) ouvrir(histoires[Number(/** @type {HTMLElement} */ (c).dataset.h)]);
  });
  // Fermer : la croix, ou un toucher hors de la feuille.
  fiche.addEventListener('click', (ev) => {
    if (ev.target === fiche || /** @type {HTMLElement} */ (ev.target).closest('[data-fermer]')) fiche.close();
  });

  $('accueil').hidden = false;
}

/** « Chapitre 2 · Moyen », sinon « Moyen ». @param {Puzzle} p */
function detailNiveau(p) {
  return [p.chapitre ? UI.chapitre(p.chapitre) : '', UI.niveaux[p.difficulty]].filter(Boolean).join(' · ');
}

/** Les deux premières phrases de l'intro. @param {Puzzle} p */
function accroche(p) {
  return p.intro.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
}

/** @param {string} s */
function esc(s) {
  return s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch] ?? ch);
}
