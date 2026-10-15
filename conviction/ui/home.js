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
    // Une carte par histoire : ses difficultés sont des boutons sur la carte
    // (deux « Meurtre au 221B » identiques côte à côte se confondaient).
    /** @type {Map<string, Map<string, Puzzle[]>>} collection -> titre -> variantes */
    const groupes = new Map();
    for (const p of visibles) {
      const k = p.collection ?? UI.sansCollection;
      const histoires = groupes.get(k) ?? new Map();
      histoires.set(p.title, [...(histoires.get(p.title) ?? []), p]);
      groupes.set(k, histoires);
    }
    $('collections').innerHTML = [...groupes].map(([nom, hs]) => `<section class="collection"><h2>${esc(nom)}</h2><div class="cartes">${[...hs.values()].map(carte).join('')}</div></section>`).join('')
      || `<p class="vide-liste">${UI.aucune}</p>`;
    const resolues = puzzles.filter((p) => etat(p) === 'resolue').length;
    $('compte').textContent = UI.compte(resolues, puzzles.length);
  }

  /** Une histoire et ses difficultés. @param {Puzzle[]} ps */
  function carte(ps) {
    const p = ps[0];
    const visages = p.persons.filter((x) => !x.victim).slice(0, 4).map((x) => `<span class="v">${portrait(x)}</span>`).join('');
    const variantes = ps.map((v) => {
      const e = etat(v), rec = records[v.id];
      const detail = e === 'resolue' ? `✓ ${rec ? formatClock(rec.time) : UI.resolue}` : e === 'encours' ? UI.enCours : UI.nouvelle;
      return `<a class="variante niv-${v.difficulty}${e === 'resolue' ? ' faite' : ''}" data-diff="${v.difficulty}" href="?enquete=${encodeURIComponent(v.id)}"><b>${esc(UI.niveaux[v.difficulty])}</b><small>${esc(detail)}</small></a>`;
    }).join('');
    return `<article class="carte">
      ${mini(p)}
      <div class="c-txt">
        <h3 class="c-t">${esc(p.title)}</h3>
        <p class="c-m">${esc(p.theme)} · ${p.size}×${p.size}</p>
        <span class="visages" aria-hidden="true">${visages}</span>
        <div class="variantes">${variantes}</div>
      </div></article>`;
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
