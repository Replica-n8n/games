// Accueil : reprendre l'enquête en cours, puis toutes les enquêtes rangées
// par collection, filtrables par difficulté. Chaque carte montre le plan en
// miniature et les visages des personnes, son état et son record.

import { UI } from '../i18n/fr.js';
import { formatClock } from './state.js';
import { portrait } from './portraits.js';
import { load, save } from './storage.js';

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
  let filtre = load('filtre', 'toutes');

  // Reprendre : la dernière enquête ouverte, si elle n'est pas résolue.
  const derniere = puzzles.find((p) => p.id === load('derniere', ''));
  const reprendre = $('reprendre');
  if (derniere && etat(derniere) === 'encours') {
    const s = load(`partie:${derniere.id}`, { elapsed: 0 });
    reprendre.innerHTML = `${mini(derniere)}<span class="r-txt"><span class="r-k">${UI.reprendre}</span><span class="r-t">${esc(derniere.title)}</span><span class="r-m">${esc(UI.niveaux[derniere.difficulty])} · ${formatClock(s.elapsed ?? 0)}</span></span>`;
    reprendre.setAttribute('href', `?enquete=${encodeURIComponent(derniere.id)}`);
    reprendre.hidden = false;
  }

  function render() {
    for (const b of $('filtres').querySelectorAll('button')) b.setAttribute('aria-pressed', String(/** @type {HTMLElement} */ (b).dataset.f === filtre));
    const visibles = puzzles.filter((p) => filtre === 'toutes' || p.difficulty === filtre);
    /** @type {Map<string, Puzzle[]>} */
    const groupes = new Map();
    for (const p of visibles) {
      const k = p.collection ?? UI.sansCollection;
      groupes.set(k, [...(groupes.get(k) ?? []), p]);
    }
    $('collections').innerHTML = [...groupes].map(([nom, ps]) => `<section class="collection"><h2>${esc(nom)}</h2><div class="cartes">${ps.map(carte).join('')}</div></section>`).join('')
      || `<p class="vide-liste">${UI.aucune}</p>`;
    const resolues = puzzles.filter((p) => etat(p) === 'resolue').length;
    $('compte').textContent = UI.compte(resolues, puzzles.length);
  }

  /** @param {Puzzle} p */
  function carte(p) {
    const e = etat(p);
    const rec = records[p.id];
    const visages = p.persons.filter((x) => !x.victim).slice(0, 4).map((x) => `<span class="v">${portrait(x)}</span>`).join('');
    const statut = e === 'resolue' ? `<span class="etat ok">✓ ${UI.resolue}${rec ? ` · ${formatClock(rec.time)}` : ''}</span>`
      : e === 'encours' ? `<span class="etat encours">${UI.enCours}</span>` : `<span class="etat">${UI.nouvelle}</span>`;
    return `<a class="carte" href="?enquete=${encodeURIComponent(p.id)}">
      ${mini(p)}
      <span class="c-txt">
        <span class="c-t">${esc(p.title)}</span>
        <span class="c-m"><span class="niv niv-${p.difficulty}">${esc(UI.niveaux[p.difficulty])}</span> ${esc(p.theme)} · ${p.size}×${p.size}</span>
        <span class="visages" aria-hidden="true">${visages}</span>
        ${statut}
      </span></a>`;
  }

  $('filtres').addEventListener('click', (ev) => {
    const b = /** @type {HTMLElement} */ (ev.target).closest('button');
    if (!b) return;
    filtre = b.dataset.f ?? 'toutes';
    save('filtre', filtre);
    render();
  });

  render();
  $('accueil').hidden = false;
}

/** Le plan en miniature : sols et murs, sans meubles. @param {Puzzle} p */
export function mini(p) {
  const mat = new Map(p.rooms.map((r) => [r.id, r.material]));
  const n = p.size;
  let h = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const k = p.layout[r][c];
      const w = [r === 0 || p.layout[r - 1][c] !== k ? 'wt' : '', c === 0 || p.layout[r][c - 1] !== k ? 'wl' : '', r === n - 1 ? 'wb' : '', c === n - 1 ? 'wr' : ''].filter(Boolean).join(' ');
      h += `<i class="sol-${mat.get(k)} ${w}"></i>`;
    }
  }
  return `<span class="mini" style="--n:${n}" data-ambiance="${p.ambiance ?? 'jour'}" aria-hidden="true">${h}</span>`;
}

/** @param {string} s */
function esc(s) {
  return s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch] ?? ch);
}
