// Écran de jeu : le plan, le choix de la personne, les outils, le dossier.
// Le DOM du plan est construit UNE fois ; chaque rendu met à jour les cases
// existantes (une case recréée perdrait le focus clavier et ses animations).

import { boardOf, coord, evaluateClue } from '../engine/index.js';
import { FURNITURE } from '../engine/furniture.js';
import { FURNITURE_NAMES, UI } from '../i18n/fr.js';
import { Game, formatClock } from './state.js';
import { furnitureIcon, UNDO, REDO } from './icons.js';
import { load, save } from './storage.js';

/** @typedef {import('../engine/types.js').Puzzle} Puzzle */
/** @typedef {import('../engine/types.js').Person} Person */
/** @typedef {import('../engine/types.js').Pos} Pos */

const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** @param {Person} p */
const pawnColor = (p) => (p.victim ? 'var(--p-v)' : `var(--p-${p.color})`);

/**
 * @param {Puzzle} puzzle @param {number} number numéro du dossier
 * @param {{ guides: boolean, vibrate: boolean }} settings
 */
export function mountGame(puzzle, number, settings) {
  const b = boardOf(puzzle);
  const n = puzzle.size;
  const saveKey = `partie:${puzzle.id}`;
  const game = new Game(puzzle, load(saveKey, null));
  const victim = /** @type {Person} */ (puzzle.persons.find((p) => p.victim));
  const byId = new Map(puzzle.persons.map((p) => [p.id, p]));
  const roomName = new Map(puzzle.rooms.map((r) => [r.id, r.name]));
  const roomIndex = new Map(puzzle.rooms.map((r, i) => [r.id, i + 1]));

  /** Interface seulement, jamais sauvegardé sauf `sel`. */
  const ui = {
    sel: /** @type {string | null} */ (puzzle.persons.find((p) => !game.placement[p.id])?.id ?? null),
    mode: /** @type {'place' | 'mark'} */ ('place'),
    checked: false,
    hl: /** @type {Pos[]} */ ([]),
    focus: /** @type {Pos} */ ([0, 0]),
    justPlaced: /** @type {string | null} */ (null),
  };

  // ---------- En-tête et dossier, une fois ----------
  $('eyebrow').textContent = `${UI.dossier} ${String(number).padStart(3, '0')} · ${puzzle.theme}`;
  $('titre').textContent = puzzle.title;
  document.title = `${puzzle.title} · ${document.title.split(' · ').pop()}`;
  $('difficulte').textContent = UI.niveaux[puzzle.difficulty];
  $('etage').textContent = puzzle.floor;
  $('taille').textContent = UI.taille(n);
  $('intro').textContent = puzzle.intro;
  $('accuse-question').textContent = UI.accuserQuestion(victim.name);
  $('b-annuler').innerHTML = UNDO;
  $('b-retablir').innerHTML = REDO;

  const types = [...new Set(puzzle.furniture.map((f) => f.type))];
  const blocking = types.filter((t) => FURNITURE[t] === 'block').map((t) => FURNITURE_NAMES[t].name.toLowerCase());
  const seats = types.filter((t) => FURNITURE[t] === 'seat').map((t) => FURNITURE_NAMES[t].name.toLowerCase());
  $('regles').innerHTML = UI.reglesListe(blocking, seats).map((r) => `<li>${esc(r)}</li>`).join('');
  $('legende').innerHTML =
    puzzle.rooms.map((r) => `<span><i class="sw" style="--room:var(--r-${roomIndex.get(r.id)})"></i>${esc(r.name)}</span>`).join('') +
    '<span class="sep"></span>' +
    types.map((t) => `<span>${furnitureIcon(t, '')}${FURNITURE_NAMES[t].name}${FURNITURE[t] === 'seat' ? ` · ${UI.siege}` : ''}</span>`).join('');

  // ---------- Plan ----------
  const grid = $('grille');
  grid.style.setProperty('--n', String(n));
  grid.setAttribute('aria-label', `${puzzle.floor}, ${UI.taille(n)}`);
  let html = '<div role="row"><span class="lab"></span>';
  for (let c = 0; c < n; c++) html += `<span class="lab" role="columnheader">${String.fromCharCode(65 + c)}</span>`;
  html += '</div>';
  const labeled = new Set();
  for (let r = 0; r < n; r++) {
    html += `<div role="row"><span class="lab" role="rowheader">${r + 1}</span>`;
    for (let c = 0; c < n; c++) {
      const k = b.room(r, c), f = b.furniture(r, c);
      const cls = ['cell'];
      if (r === 0 || b.room(r - 1, c) !== k) cls.push('wt');
      if (r === n - 1 || b.room(r + 1, c) !== k) cls.push('wb');
      if (c === 0 || b.room(r, c - 1) !== k) cls.push('wl');
      if (c === n - 1 || b.room(r, c + 1) !== k) cls.push('wr');
      if (b.blocked(r, c)) cls.push('blocked');
      let inner = '';
      if (!labeled.has(k)) { labeled.add(k); inner += `<span class="roomname" aria-hidden="true">${esc(roomName.get(k) ?? '')}</span>`; }
      if (f) inner += furnitureIcon(f);
      inner += '<span class="mark" aria-hidden="true" hidden>✕</span><span class="pawn" aria-hidden="true" hidden></span>';
      html += `<button type="button" role="gridcell" class="${cls.join(' ')}" style="--room:var(--r-${roomIndex.get(k)})" data-r="${r}" data-c="${c}" tabindex="-1"${b.blocked(r, c) ? ' aria-disabled="true"' : ''}>${inner}</button>`;
    }
    html += '</div>';
  }
  grid.innerHTML = html;
  /** @type {HTMLButtonElement[]} */
  const cells = [...grid.querySelectorAll('.cell')].map((e) => /** @type {HTMLButtonElement} */ (e));
  const cellAt = (/** @type {Pos} */ [r, c]) => cells[r * n + c];
  const posOf = (/** @type {Element} */ el) => /** @type {Pos} */ ([Number(/** @type {HTMLElement} */ (el).dataset.r), Number(/** @type {HTMLElement} */ (el).dataset.c)]);

  // ---------- Choix (téléphone) et liste des témoignages ----------
  $('choix').innerHTML = puzzle.persons.map((p, i) =>
    `<button type="button" class="chip${p.victim ? ' victim' : ''}" data-id="${p.id}" style="--pc:${pawnColor(p)}" aria-label="${esc(`${i + 1}. ${p.name}, ${p.role}`)}"><i aria-hidden="true">${p.name[0]}</i></button>`).join('');
  $('liste').innerHTML = puzzle.persons.map((p) =>
    `<button type="button" class="suspect${p.victim ? ' victim' : ''}" data-id="${p.id}" style="--pc:${pawnColor(p)}">
      <span class="chip-i" aria-hidden="true">${p.name[0]}</span>
      <span><span class="who">${esc(p.name)}</span> <span class="role">${esc(p.role)}</span><q>${esc(p.testimony)}</q></span>
      <span class="where"></span></button>`).join('');
  $('acc').innerHTML = puzzle.persons.filter((p) => !p.victim).map((p) =>
    `<button type="button" data-acc="${p.id}"><i style="--pc:${pawnColor(p)}"></i>${esc(p.name)}</button>`).join('');

  // ---------- Rendu ----------
  function render() {
    const bad = game.conflicts();
    const guides = new Set();
    if (settings.guides) for (const id in game.placement) { const [r, c] = game.placement[id]; for (let i = 0; i < n; i++) { guides.add(r * n + i); guides.add(i * n + c); } }
    for (const el of cells) {
      const pos = posOf(el), [r, c] = pos;
      const who = game.occupant(pos);
      const p = who ? /** @type {Person} */ (byId.get(who)) : null;
      const marked = !p && game.marked(pos);
      el.classList.toggle('has-token', !!p);
      el.classList.toggle('hl', ui.hl.some(([a, d]) => a === r && d === c));
      el.classList.toggle('guide', !p && guides.has(r * n + c) && !b.blocked(r, c));
      /** @type {HTMLElement} */ (el.querySelector('.mark')).hidden = !marked;
      const pawn = /** @type {HTMLElement} */ (el.querySelector('.pawn'));
      pawn.hidden = !p;
      if (p) {
        pawn.textContent = p.name[0];
        pawn.dataset.id = p.id;
        pawn.style.setProperty('--pc', pawnColor(p));
        pawn.classList.toggle('victim', !!p.victim);
        pawn.classList.toggle('bad', bad.has(p.id));
        pawn.classList.toggle('pose', ui.justPlaced === p.id && !reduceMotion());
      }
      const f = b.furniture(r, c);
      el.setAttribute('aria-label', UI.caseLabel(coord(pos), roomName.get(b.room(r, c)) ?? '', f ? FURNITURE_NAMES[f].name : null, p ? p.name : null, marked));
      el.tabIndex = r === ui.focus[0] && c === ui.focus[1] ? 0 : -1;
    }
    ui.justPlaced = null;

    for (const el of $('choix').querySelectorAll('.chip')) {
      const id = /** @type {HTMLElement} */ (el).dataset.id ?? '';
      el.setAttribute('aria-pressed', String(ui.sel === id));
      el.classList.toggle('placed', !!game.placement[id]);
    }
    const sel = ui.sel ? byId.get(ui.sel) : null;
    $('temoin').innerHTML = sel ? `<b>${esc(sel.name)}</b>, ${esc(sel.role)} : <q>${esc(sel.testimony)}</q>` : '';

    for (const el of $('liste').querySelectorAll('.suspect')) {
      const id = /** @type {HTMLElement} */ (el).dataset.id ?? '';
      const pos = game.placement[id];
      el.setAttribute('aria-pressed', String(ui.sel === id));
      el.classList.toggle('placed', !!pos);
      const where = /** @type {HTMLElement} */ (el.querySelector('.where'));
      let text = UI.aPlacer, cls = '';
      if (pos) {
        text = coord(pos);
        if (bad.has(id)) { text += ` · ${UI.conflit}`; cls = 'bad'; }
        else if (ui.checked) {
          const v = evaluateClue(puzzle, game.placement, id);
          text += ` ${UI.verifie[String(v)]}`;
          cls = v === true ? 'ok' : v === false ? 'bad' : '';
        }
      }
      where.textContent = text;
      where.className = `where ${cls}`;
    }

    $('m-placer').setAttribute('aria-pressed', String(ui.mode === 'place'));
    $('m-barrer').setAttribute('aria-pressed', String(ui.mode === 'mark'));
    /** @type {HTMLButtonElement} */ ($('b-annuler')).disabled = !game.canUndo;
    /** @type {HTMLButtonElement} */ ($('b-retablir')).disabled = !game.canRedo;
    $('nb-indices').textContent = String(game.hints);
    tick();

    const solved = game.solved;
    $('accuse').hidden = !solved;
    const verdict = $('verdict');
    if (!solved || !game.accused) verdict.hidden = true;
    else {
      verdict.hidden = false;
      const accused = /** @type {Person} */ (byId.get(game.accused));
      const right = game.accuse(game.accused);
      verdict.className = right ? 'verdict win' : 'verdict';
      const [r, c] = puzzle.solution[accused.id];
      verdict.innerHTML = right
        ? `<strong>${UI.gagne}</strong>${esc(puzzle.verdict)}`
        : `<strong>${UI.perdu}</strong>${esc(UI.perduTexte(accused.name, roomName.get(b.room(r, c)) ?? '', victim.name))}`;
    }
    save(saveKey, game.toJSON());
  }

  function tick() { $('chrono').textContent = formatClock(game.clock()); }

  /** @param {string} msg @param {'' | 'warn' | 'ok' | 'hint'} [kind] */
  function status(msg, kind = '') {
    const s = $('status');
    s.className = `status${kind ? ` ${kind}` : ''}`;
    // Vider puis réécrire : une même annonce est relue par le lecteur d'écran.
    s.textContent = '';
    requestAnimationFrame(() => {
      s.textContent = msg;
      // Un message long (un indice) ne doit pas finir sous le bord de l'écran.
      if (s.getBoundingClientRect().bottom > innerHeight) s.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' });
    });
  }

  const buzz = () => { if (settings.vibrate) navigator.vibrate?.(10); };
  const nextUnplaced = () => puzzle.persons.find((p) => !game.placement[p.id])?.id ?? null;

  /** Placer `id` en `pos`, avec les messages du prototype. @param {string} id @param {Pos} pos */
  function place(id, pos) {
    const p = /** @type {Person} */ (byId.get(id));
    if (b.blocked(pos[0], pos[1])) {
      const f = b.furniture(pos[0], pos[1]);
      status(UI.bloque(f ? FURNITURE_NAMES[f].the : ''), 'warn');
      return;
    }
    const wasSolved = game.solved;
    game.do({ t: 'place', p: id, pos });
    ui.justPlaced = id;
    ui.checked = false; ui.hl = [];
    buzz();
    if (game.conflicts().has(id)) status(UI.conflitPose(p.name), 'warn');
    else if (puzzle.persons.every((x) => game.placement[x.id])) status(game.solved ? UI.complet : UI.incoherent, game.solved ? 'ok' : 'warn');
    else status(UI.place(p.name, coord(pos)));
    ui.sel = nextUnplaced();
    render();
    if (game.solved && !wasSolved) {
      if (settings.vibrate) navigator.vibrate?.([30, 60, 30]);
      $('accuse').scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'nearest' });
    }
  }

  /** Toucher une case (ou Entrée dessus). @param {Pos} pos */
  function activate(pos) {
    const who = game.occupant(pos);
    ui.focus = pos;
    if (ui.mode === 'mark') {
      if (who) { status(UI.retirerDabord, 'warn'); return; }
      if (b.blocked(pos[0], pos[1])) return;
      game.do({ t: 'mark', pos });
      ui.checked = false; ui.hl = [];
      render();
      return;
    }
    if (who) {
      game.do({ t: 'remove', p: who });
      ui.sel = who; ui.checked = false; ui.hl = [];
      status(UI.retire(/** @type {Person} */ (byId.get(who)).name));
      render();
      return;
    }
    if (!ui.sel) {
      if (!b.blocked(pos[0], pos[1])) { status(UI.choisirDabord, 'warn'); return; }
    }
    place(/** @type {string} */ (ui.sel ?? ''), pos);
  }

  /** @param {string | null} id */
  function select(id) {
    ui.sel = ui.sel === id ? null : id;
    ui.mode = 'place';
    render();
    if (ui.sel) status(UI.ou(/** @type {Person} */ (byId.get(ui.sel)).name));
  }

  // ---------- Événements ----------
  let dragged = false; // un glisser vient de finir : ignorer le clic qui suit
  grid.addEventListener('click', (e) => {
    if (dragged) { dragged = false; return; }
    const el = /** @type {HTMLElement} */ (e.target).closest('.cell');
    if (el) activate(posOf(el));
  });
  for (const id of ['choix', 'liste']) {
    $(id).addEventListener('click', (e) => {
      if (dragged) { dragged = false; return; }
      const el = /** @type {HTMLElement} */ (e.target).closest('[data-id]');
      if (el) select(/** @type {HTMLElement} */ (el).dataset.id ?? null);
    });
  }
  $('acc').addEventListener('click', (e) => {
    const el = /** @type {HTMLElement} */ (e.target).closest('[data-acc]');
    if (!el) return;
    game.accuse(/** @type {HTMLElement} */ (el).dataset.acc ?? '');
    render();
    $('verdict').scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'nearest' });
  });
  $('m-placer').addEventListener('click', () => { ui.mode = 'place'; render(); status(UI.modePlacer); });
  $('m-barrer').addEventListener('click', () => { ui.mode = 'mark'; render(); status(UI.modeBarrer); });
  $('b-annuler').addEventListener('click', undo);
  $('b-retablir').addEventListener('click', redo);
  function undo() { const ok = game.undo(); ui.checked = false; ui.hl = []; render(); status(ok ? UI.annule : UI.rienAAnnuler); }
  function redo() { const ok = game.redo(); ui.checked = false; ui.hl = []; render(); status(ok ? UI.retabli : UI.rienARetablir); }
  $('b-indice').addEventListener('click', () => {
    const h = game.hint();
    ui.hl = h.cells;
    render();
    status(h.text, h.kind === 'conflict' || h.kind === 'wrong' ? 'warn' : 'hint');
  });
  $('b-verifier').addEventListener('click', () => {
    ui.checked = true; ui.hl = [];
    render();
    const placed = puzzle.persons.filter((p) => game.placement[p.id]);
    if (!placed.length) { status(UI.rien, 'warn'); return; }
    const values = placed.map((p) => evaluateClue(puzzle, game.placement, p.id));
    const wrong = values.filter((v) => v === false).length, open = values.filter((v) => v === null).length;
    const conflicts = game.conflicts().size > 0;
    if (wrong) status(UI.verifKo(wrong, conflicts), 'warn');
    else if (conflicts) status(UI.verifConflits, 'warn');
    else status(UI.verifOk(placed.length - open, open), 'ok');
  });
  $('b-recommencer').addEventListener('click', () => {
    if (!Object.keys(game.placement).length && !game.marks.size) return;
    game.do({ t: 'clear' });
    ui.checked = false; ui.hl = []; ui.sel = puzzle.persons[0].id;
    render();
    status(UI.recommence);
  });

  // Clavier : flèches, Entrée place, X barre, 1 à N choisit, Ctrl+Z / Ctrl+Y.
  grid.addEventListener('keydown', (e) => {
    const [r, c] = ui.focus;
    /** @type {Record<string, Pos>} */
    const moves = { ArrowUp: [r - 1, c], ArrowDown: [r + 1, c], ArrowLeft: [r, c - 1], ArrowRight: [r, c + 1], Home: [r, 0], End: [r, n - 1] };
    const to = moves[e.key];
    if (to) {
      e.preventDefault();
      ui.focus = [Math.max(0, Math.min(n - 1, to[0])), Math.max(0, Math.min(n - 1, to[1]))];
      for (const el of cells) el.tabIndex = -1;
      const el = cellAt(ui.focus);
      el.tabIndex = 0;
      el.focus();
      return;
    }
    if (e.key === 'x' || e.key === 'X') {
      e.preventDefault();
      const was = ui.mode;
      ui.mode = 'mark'; activate(ui.focus); ui.mode = was; render();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      const who = game.occupant(ui.focus);
      if (who) { e.preventDefault(); activate(ui.focus); }
    }
  });
  grid.addEventListener('focusin', (e) => {
    const el = /** @type {HTMLElement} */ (e.target).closest('.cell');
    if (el) ui.focus = posOf(el);
  });
  document.addEventListener('keydown', (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    if (t.closest('input, textarea, select')) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
    if (mod || e.altKey) return;
    const k = Number(e.key);
    if (Number.isInteger(k) && k >= 1 && k <= puzzle.persons.length) {
      e.preventDefault();
      ui.sel = null;
      select(puzzle.persons[k - 1].id);
    }
  });

  // ---------- Glisser-déposer (souris et doigt) ----------
  const ghost = $('fantome');
  /** @type {{ id: string, x: number, y: number, on: boolean, over: HTMLElement | null, el: HTMLElement } | null} */
  let drag = null;
  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const t = /** @type {HTMLElement} */ (e.target);
    const src = t.closest('.pawn[data-id], .chip[data-id], .suspect .chip-i');
    if (!src) return;
    const id = /** @type {HTMLElement} */ (src).dataset.id ?? /** @type {HTMLElement | null} */ (src.closest('[data-id]'))?.dataset.id;
    if (!id) return;
    drag = { id, x: e.clientX, y: e.clientY, on: false, over: null, el: /** @type {HTMLElement} */ (src) };
  });
  document.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.on) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
      drag.on = true;
      const p = /** @type {Person} */ (byId.get(drag.id));
      ghost.textContent = p.name[0];
      ghost.style.setProperty('--pc', pawnColor(p));
      ghost.classList.toggle('victim', !!p.victim);
      ghost.hidden = false;
      try { drag.el.setPointerCapture(e.pointerId); } catch { /* le pointeur a déjà disparu */ }
    }
    ghost.style.left = `${e.clientX}px`;
    ghost.style.top = `${e.clientY}px`;
    const under = /** @type {HTMLElement | null} */ (document.elementFromPoint(e.clientX, e.clientY)?.closest('.cell') ?? null);
    if (under !== drag.over) {
      drag.over?.classList.remove('drop');
      drag.over = under;
      under?.classList.add('drop');
    }
  });
  const endDrag = (/** @type {PointerEvent} */ e) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.on) return;
    ghost.hidden = true;
    d.over?.classList.remove('drop');
    dragged = true;
    setTimeout(() => { dragged = false; }, 0);
    if (e.type === 'pointerup' && d.over) {
      const pos = posOf(d.over);
      if (game.placement[d.id] && game.occupant(pos) === d.id) return;
      ui.sel = d.id;
      ui.focus = pos;
      place(d.id, pos);
    }
  };
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);

  // ---------- Chronomètre : il ne court que si la page est visible ----------
  const visible = () => document.visibilityState === 'visible';
  if (visible()) game.resume();
  let timer = setInterval(tick, 1000);
  document.addEventListener('visibilitychange', () => {
    if (visible()) { game.resume(); clearInterval(timer); timer = setInterval(tick, 1000); tick(); }
    else { game.pause(); clearInterval(timer); save(saveKey, game.toJSON()); }
  });
  addEventListener('pagehide', () => save(saveKey, game.toJSON()));

  render();
  status(game.solved ? UI.complet : ui.sel ? UI.ou(/** @type {Person} */ (byId.get(ui.sel)).name) : UI.depart, game.solved ? 'ok' : '');
  $('jeu').hidden = false;

  // Crochets pour les bancs d'essai (aucun effet en jeu).
  return { game, ui, render };
}

/** @param {string} s */
function esc(s) {
  return s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch] ?? ch);
}
