// ===== Paper Race : le JEU (écrans, tours, sauvegarde, championnat) =====
// Chargés avant ce fichier : moteur.js (les règles), sons.js, et rendu.js (le
// dessin : $, le canevas, render(), la revue). ligne.js vient après.
// ⚠️ VERSION existe aussi dans sw.js : les changer ensemble, un essai les compare.
const VERSION = 'paper-race-v15';
const BLEU = '#2B4C8C', ROUGE = '#B03A2E', ENCRE = '#1B2430';
// Les quatre autres voitures sont CALCULÉES (tools/paper-race-couleurs.mjs) :
// texte blanc lisible dessus, distinctes pour les trois daltonismes. Le numéro
// peint sur chaque voiture double la couleur, qui n'est jamais seule.
const COUL = [BLEU, ROUGE, '#2C7865', '#9255D5', '#880A5D', '#241E14'];
const NOMS = ['Bleu', 'Rouge', 'Vert', 'Violet', 'Prune', 'Noir'];
const ADJ = ['bleue', 'rouge', 'verte', 'violette', 'prune', 'noire'];
const CLE_REGLAGES = 'paper-race.reglages.v1';
const CLE_ASTUCE = 'paper-race.astuce.carte.v1';   // dit UNE fois qu'on peut déplacer la carte
const CLE_COURSE = 'paper-race.course.v1';

let R = null;
let mode = 'solo';   // le championnat d'abord ; 'gp' (Grand Prix), 'duo', 'ligne' se choisissent
let level = 'normal';
let nbVoitures = 4;  // en Grand Prix : de 2 à 6 voitures
let nbLigne = 2;     // en ligne : de 2 à 6 places (à deux d'abord, c'est le cas le plus courant)
const nbPlaces = () => mode === 'ligne' ? nbLigne : nbVoitures;
let piegesOn = true; // hors championnat, les pièges sont une option (le championnat les garde)
let aideOn = true;   // l'aide au prochain coup : les points gris d'où l'on pourra repartir
// La carte déplacée au doigt sur un grand circuit : on ne voit pas le virage qui
// vient, donc on ne sait pas s'il faut freiner. Elle se recentre sur la voiture
// dès qu'on choisit son point (ou qu'une voiture bouge).
let camLibre = false, glisse = null;

// Les mots des pièges : les MÊMES dans les règles illustrées, en visant et une
// fois dedans. Changer de vocabulaire d'un écran à l'autre reperdrait le joueur.
const MOTS = {
  vise: {
    humide: 'Tu finis dans la flaque : tu ne pourras que freiner',
    huile: "Tu finis sur la tache d'huile : ta vitesse ne changera plus",
    boost: 'Tu finis sur les chevrons : une case de plus',
  },
  dedans: {
    humide: 'Dans la flaque : tu ne peux que freiner',
    huile: "Sur la tache d'huile : ta vitesse ne change plus",
  },
  depart: {
    humide: 'Dans la flaque : repars doucement',
    huile: "Sur la tache d'huile : repars doucement",
  },
};

// qui joue sans qu'on touche l'écran : le fantôme du championnat, ceux du Grand
// Prix, et en ligne les places restées vides au départ (calculées par l'hôte)
const estFantome = (p) => (mode === 'solo' && p === 1) || (mode === 'gp' && p !== 0)
  || (mode === 'ligne' && !!ligne && !!ligne.depart && ligne.depart.fantomes.includes(p));
// à plus de deux, les voitures portent leur numéro
const numerote = () => R && R.cars.length > 2;
function tirage(n) {
  const g = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [g[i], g[j]] = [g[j], g[i]]; }
  return g;
}
let ti = 0;
let selected = null;
let opts = [];
let aiBusy = false;
let flash = null;
let anim = null;        // {pa, from, to, t, dur, crash}
let replay = null;      // {t, dur, then}
let cellPx = 21, PAD = 6;
let raf = null;
let jeton = 0;          // change à chaque course : un minuteur d'une course finie ne joue pas dans la suivante
let precedent = null;   // l'état juste avant le dernier coup du joueur, pour « Annuler »
// Un coup joué n'est FINI qu'une fois le tour passé au suivant (après l'animation,
// ou 40 ms plus tard quand la voiture ne bouge pas). ⚠️ En ligne, appliquer le coup
// suivant du relais avant ce moment le jugeait hors tour sur UN seul téléphone :
// les écrans se désaccordaient et la course se bloquait (vu contre le vrai relais).
let coupEnCours = false;
let ligne = null;       // la course en ligne (ligne.js), ou rien

// ================= pavé =================
// Le repère du pavé est celui de l'écran (haut = vers le haut de la feuille).
// Son nom parlé, lui, dépend de la vitesse : « haut » accélère une voiture qui
// monte et freine une voiture qui descend.
const DIR_ECRAN = ['vers le haut à gauche', 'vers le haut', 'vers le haut à droite',
  'vers la gauche', 'sur place', 'vers la droite',
  'vers le bas à gauche', 'vers le bas', 'vers le bas à droite'];

function padLabel(k, o, car) {
  if (o.interdit) return contrainte(R.track, car) === 'huile' ? "Impossible sur la tache d'huile : la vitesse ne change pas" : 'Impossible dans la flaque : on ne peut que freiner';
  if (o.bloque) return 'Occupé par une autre voiture';
  if (!o.ok) return 'Hors piste';
  const dx = o.dx, dy = o.dy, v = car.v;
  if (!dx && !dy) return (v[0] || v[1]) ? 'Garder la même vitesse' : 'Rester sur place';
  if (!v[0] && !v[1]) return 'Partir ' + DIR_ECRAN[k];
  const dot = dx * v[0] + dy * v[1];
  const tour = v[0] * dy - v[1] * dx;          // y vers le bas : positif = vers la droite
  const cote = tour > 0 ? 'à droite' : tour < 0 ? 'à gauche' : '';
  if (dot > 0) return 'Accélérer' + (cote ? ' en tournant ' + cote : '');
  if (dot < 0) return 'Freiner' + (cote ? ' en tournant ' + cote : '');
  return 'Tourner ' + cote;
}

// en ligne : on attend son tour, la connexion, et le départ
// (des coups du relais pas encore appliqués ici : on n'est pas à jour, on attend)
const attenteLigne = () => mode === 'ligne' && !!ligne && ligne.actif && !!R && (R.turn !== ligne.siege || !ligne.connecte || !ligne.lancee || ligne.file.length > 0);
function occupe() {
  return depart || aiBusy || !!anim || !!replay || !!rejeu || !!revue || (!!R && estFantome(R.turn)) || attenteLigne();
}
// En ligne, pendant que les autres jouent, on prépare SON coup : il part tout
// seul à son tour, et on peut le changer (ou le retirer) jusque-là.
let avance = null;
const peutPreparer = () => mode === 'ligne' && !!ligne && ligne.actif && !!ligne.v2 && ligne.lancee && ligne.connecte
  && !!R && !finie(R) && !depart && R.turn !== ligne.siege && !!R.cars[ligne.siege]
  && !R.cars[ligne.siege].fini && !R.cars[ligne.siege].abandon;
function choixDe(p) { const t = R.turn; R.turn = p; const o = choices(R); R.turn = t; return o; }

function renderPad() {
  const pad = $('pad');
  const avaitFocus = document.activeElement && document.activeElement.classList.contains('padbtn')
    ? +document.activeElement.dataset.k : -1;
  const prep = peutPreparer();
  const qui = prep ? ligne.siege : R.turn, liste = prep ? choixDe(qui) : opts;
  const bloque = !prep && (occupe() || finie(R));
  const car = R.cars[qui];
  pad.innerHTML = liste.map((o, k) => {
    const dis = !o.ok || bloque;
    const on = prep ? avance === k : selected === k;
    const ex = 12 + (k % 3 - 1) * 7, ey = 12 + ((k / 3 | 0) - 1) * 7;
    let inner;
    if (o.interdit) inner = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"></path></svg>';
    else if (o.bloque) inner = '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M7 12h10" stroke-linecap="round"></path></svg>';
    else if (!o.ok) inner = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6 L18 18M18 6 L6 18"></path></svg>';
    else if (k === 4) inner = '<span class="egal" aria-hidden="true">=</span>';
    else inner = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 12 L${ex} ${ey}"></path><circle cx="${ex}" cy="${ey}" r="2.6" fill="currentColor" stroke="none"></circle></svg>`;
    const etat = o.ok ? '' : (o.bloque ? ' pris' : (o.interdit ? ' zone' : ' ko'));
    return `<button type="button" class="padbtn b${qui}${on ? ' on' : ''}${etat}" data-k="${k}" ${dis ? 'disabled' : ''} aria-pressed="${on}" aria-label="${padLabel(k, o, car)}${prep ? ", à jouer dès ton tour" : ''}">${inner}</button>`;
  }).join('');
  for (const b of pad.querySelectorAll('.padbtn')) {
    b.addEventListener('click', () => choisir(+b.dataset.k));
  }
  // innerHTML recrée les boutons : sans ça, le clavier perdait sa place à chaque choix
  if (avaitFocus >= 0) { const b = pad.querySelector(`[data-k="${avaitFocus}"]`); if (b && !b.disabled) b.focus(); }
}

function choisir(k) {
  if (peutPreparer()) {
    const o = choixDe(ligne.siege)[k];
    if (!o || !o.ok) return;
    avance = avance === k ? null : k;
    sonClic(); renderPad(); renderInfo();
    return;
  }
  if (!R || finie(R) || occupe()) return;
  if (!opts[k] || !opts[k].ok) return;
  selected = k; sonClic(); recentrer(); refresh();
}

// ================= bandeaux =================
const pct = (car) => Math.round(Math.max(0, Math.min(1, (car.tour + avanceDe(R.track, car.p) / R.D) / R.laps)) * 100);
const nomDe = (p) => mode === 'ligne' && ligne ? (p === ligne.siege ? 'Toi' : NOMS[p])
  : (mode === 'solo' && p === 1) ? 'Fantôme' : ((mode === 'solo' || mode === 'gp') && p === 0) ? 'Toi' : NOMS[p];
const eme = (r) => r === 1 ? '1er' : r + 'e';

function renderBars() {
  const row = $('plrow'), n = R.cars.length;
  if (row.children.length !== n) row.innerHTML = R.cars.map((c, p) => `<div class="pl b${p}" id="p${p}"></div>`).join('');
  row.classList.toggle('serre', n > 2);
  if (n > 2) {
    // à plus de deux : le numéro de chaque voiture et sa place dans la course
    const cl = classement(R);
    for (let p = 0; p < n; p++) {
      const car = R.cars[p], rang = cl.find(c => c.voiture === p).rang;
      const actif = R.turn === p && !finie(R);
      const el = $('p' + p);
      el.className = 'pl b' + p + (actif ? ' actif' : '');
      el.setAttribute('aria-label', `${nomDe(p)}, voiture ${p + 1} : ${eme(rang)}${car.abandon ? ', a quitté la course' : ''}${actif ? ', à son tour' : ''}`);
      el.innerHTML = `<span class="rond" style="background:${COUL[p]}" aria-hidden="true">${p + 1}</span><span class="rang" aria-hidden="true">${eme(rang)}</span>`;
    }
    return;
  }
  for (let p = 0; p < 2; p++) {
    const car = R.cars[p];
    const actif = R.turn === p && !finie(R);
    const el = $('p' + p);
    el.className = 'pl b' + p + (actif ? ' actif' : '');
    el.setAttribute('aria-label', `${nomDe(p)} : ${car.coups} coups, ${pct(car)} % du tour${actif ? ', à son tour' : ''}`);
    el.innerHTML = `<span class="dot" style="background:${COUL[p]}"></span>
      <span class="pname">${nomDe(p)}</span>
      <span class="jauge"><i style="width:${pct(car)}%;background:${COUL[p]}"></i></span>
      <span class="num" aria-hidden="true">${car.coups}</span>`;
  }
}

function renderInfo() {
  const car = R.cars[R.turn];
  $('speed').textContent = Math.max(Math.abs(car.v[0]), Math.abs(car.v[1]));
  const a = arret(car);
  const dehors = (car.v[0] || car.v[1]) && (!onTrack(R.track, a.point[0], a.point[1]) || !segOk(R.track, car.p, a.point));
  $('stop').textContent = a.coups;
  // course finie : plus rien à craindre, pas d'alerte rouge sur des chiffres figés
  $('stop').classList.toggle('alerte', !!dehors && !finie(R));
  const dispo = opts.filter(o => o.ok).length;
  let txt = dispo + '/9', peu = dispo <= 3;
  if (selected !== null && opts[selected] && opts[selected].ok) {
    const q = opts[selected].p;
    const v = [q[0] - car.p[0], q[1] - car.p[1]];
    const pr = [q[0] + v[0], q[1] + v[1]];
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const t = [pr[0] + dx, pr[1] + dy];
      if (onTrack(R.track, t[0], t[1]) && segOk(R.track, q, t)) n++;
    }
    txt = dispo + ' → ' + n; peu = n <= 3;
  }
  $('issues').textContent = txt;
  $('issues').classList.toggle('alerte', peu && !finie(R));
  const bloque = occupe();
  const coince = !finie(R) && opts.length > 0 && dispo === 0;
  const go = $('go');
  go.textContent = finie(R) ? 'Terminé'
    : (mode === 'solo' && R.turn === 1) ? 'Le fantôme réfléchit…'
      : (mode === 'gp' && estFantome(R.turn)) ? `À ${NOMS[R.turn]}, ${placeDansLeTour()} sur ${vivantes()}`
      : attenteLigne() ? texteAttenteLigne()          // ligne.js
      : coince ? "Coincé : je m'arrête" : 'Tracer';
  go.disabled = coince ? bloque : (selected === null || !opts[selected] || !opts[selected].ok || bloque);
  go.className = !finie(R) ? 'b' + R.turn : 'fin';
  go.classList.toggle('attente', attenteLigne() && !finie(R));
  $('annuler').disabled = !peutAnnuler();
  // Le piège se dit AVANT de tracer. ⚠️ Priorité à la case où l'on EST : c'est
  // elle qui grise des cases du pavé, et un message qui parlerait d'autre chose
  // laisserait le pavé inexpliqué. Sinon, le point visé. La pastille reste tant
  // que la situation dure : elle décrit un état, pas un événement, et un joueur
  // n'avait pas eu le temps de lire l'ancien bandeau.
  const vise = !finie(R) && !occupe() && selected !== null && opts[selected] && opts[selected].ok
    ? zoneDe(R.track, opts[selected].p[0], opts[selected].p[1]) : null;
  const z = finie(R) ? null : contrainte(R.track, car), arrete = !car.v[0] && !car.v[1];
  const zm = $('zonemsg'), type = z || vise;
  zm.textContent = z ? (arrete ? MOTS.depart[z] : MOTS.dedans[z]) : vise ? MOTS.vise[vise] : '';
  zm.className = 'zonemsg' + (type ? ' ' + type : '');
}

// dans le tour de jeu : combien de voitures ont déjà joué, et combien roulent encore
const vivantes = () => R.cars.filter(c => !c.fini && !c.abandon).length;
const placeDansLeTour = () => vivantes() - (R.file ? R.file.length : 0);

function refresh() { renderPad(); renderBars(); renderInfo(); render(); boucle(); }

function newOpts() {
  opts = choices(R);
  selected = null;
  const ok = opts.map((o, k) => o.ok ? k : -1).filter(k => k >= 0);
  if (ok.length === 1) selected = ok[0];
  if (ok.length <= 3 && !finie(R)) sonTension();
  // en ligne : c'est à toi, et ton coup était prêt
  if (avance !== null && mode === 'ligne' && ligne && R.turn === ligne.siege && !finie(R)) {
    const k = avance; avance = null;
    if (opts[k] && opts[k].ok) {
      selected = k;
      const j = jeton;
      setTimeout(() => { if (j === jeton && R.turn === ligne.siege && !occupe() && selected === k && opts[k] && opts[k].ok) { toast('Ton coup préparé part'); commit(k); } }, 260);
    } else toast("Ton coup préparé n'est plus possible : choisis-en un autre");
  }
}

// ================= championnat =================
// Seul, on court le championnat : les circuits s'ouvrent dans l'ordre (rangé du
// plus facile au plus dur par tools/paper-race-difficulte.js), le suivant dès
// qu'on a FINI le précédent, gagné ou pas. Chaque circuit garde ton meilleur
// tour et sa médaille face au par. À deux, on court librement sur ce qui est
// ouvert. Aucune série, aucun rendez-vous : rien ne se perd si on ne vient pas.
// ⚠️ v2 (2026-09-18) : les pièges sont revenus et les pars ont changé, un record
// d'avant ne se compare plus. Les médailles repartent de zéro ; les circuits
// déjà FINIS restent ouverts (on lit aussi v1 pour ça).
const CLE_RECORDS = 'paper-race.records.v2', CLE_RECORDS_V1 = 'paper-race.records.v1';
function lireRecords(cle) {
  try { const r = JSON.parse(localStorage.getItem(cle) || '{}'); return r && typeof r === 'object' ? r : {}; } catch (e) { return {}; }
}
const records = () => lireRecords(CLE_RECORDS);
// Or : à 5 % du tour parfait, le niveau de l'ordinateur « vite ». Argent : à
// 20 %. Bronze : avoir fini. (10 % et 30 % d'abord : un joueur a tout fini en or.)
function seuils(tk) { return { or: Math.ceil(tk.par * 1.05), argent: Math.ceil(tk.par * 1.2) }; }
// le par de LA course : sans pièges (option hors championnat), le tour parfait change
const parCourse = () => R && R.pieges === false ? TRACKS[ti].parSans : TRACKS[ti].par;
function medaille(tk, coups) {
  if (!coups) return null;
  const s = seuils(tk);
  return coups <= s.or ? 'or' : coups <= s.argent ? 'argent' : 'bronze';
}
const NOM_MEDAILLE = { or: "d'or", argent: "d'argent", bronze: 'de bronze' };
// ⚠️ un circuit déjà FINI reste ouvert, même si un circuit neuf s'est glissé avant
// lui dans l'ordre (v11 : les vrais tracés s'intercalent entre les anciens)
function ouvert(k) {
  const fini = (id) => !!records()[id] || !!lireRecords(CLE_RECORDS_V1)[id];
  return k === 0 || fini(TRACKS[k - 1].id) || fini(TRACKS[k].id);
}
// le circuit à courir ensuite : le premier ouvert jamais fini, sinon le dernier ouvert
function prochain() {
  const r = Object.assign({}, lireRecords(CLE_RECORDS_V1), records()); let dernier = 0;
  for (let k = 0; k < TRACKS.length; k++) {
    if (!ouvert(k)) break;
    dernier = k;
    if (!r[TRACKS[k].id]) return k;
  }
  return dernier;
}
function noterRecord(tk, coups) {
  const r = records(), avant = r[tk.id] ? r[tk.id].coups : null;
  const mieux = avant === null || coups < avant;
  if (mieux) { r[tk.id] = { coups }; try { localStorage.setItem(CLE_RECORDS, JSON.stringify(r)); } catch (e) { } }
  return { avant, mieux };
}
function svgMedaille(m, t) {
  const c = { or: ['#E2B33C', '#9C7414'], argent: ['#C9CED6', '#6E7683'], bronze: ['#CD8B55', '#8A5226'] }[m];
  return `<svg class="medaille" width="${t}" height="${t}" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2h3l1 6-3 1zM13 2h3l-1 7-3-1z" fill="#2B4C8C"/><circle cx="12" cy="15" r="7" fill="${c[0]}" stroke="${c[1]}" stroke-width="1.6"/><path d="M12 11.2l1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z" fill="${c[1]}" opacity=".7"/></svg>`;
}

// ================= mémoire : annuler, reprendre =================
// L'état de la course tient en JSON ; seul le circuit (et son cache de champ) se
// rebranche depuis TRACKS.
// v3 (v8) : une course « grille » garde aussi sa grille, son ordre et son tour de jeu.
const CHAMPS_GRILLE = ['n', 'grille', 'ordre', 'manche', 'file', 'arrivees', 'aspires', 'abandons', 'terminee', 'photo', 'pieges'];
function instantane() {
  const o = {
    v: 3, id: R.track.id, fin: R.fin, laps: R.laps, cars: R.cars, turn: R.turn, winner: R.winner, dernier: R.dernier,
    regles: R.regles || 'classique', mode, level, caps, capsAvant, dernierMoment
  };
  if (R.regles === 'grille') for (const k of CHAMPS_GRILLE) o[k] = R[k];
  return JSON.parse(JSON.stringify(o));
}
const courseValide = (o) => o && (o.v === 2 || o.v === 3) && indexDe(o.id) >= 0 && Array.isArray(o.cars)
  && o.cars.length >= 2 && o.cars.length <= 6 && (o.regles === 'grille' || o.cars.length === 2)
  && o.cars.every(c => c && Array.isArray(c.p) && Array.isArray(c.v) && Array.isArray(c.trail))
  && (o.regles !== 'grille' || (Array.isArray(o.grille) && o.grille.length === o.cars.length && Array.isArray(o.file)));

// ⚠️ v2 : le circuit se retrouve par son id. Avant la v4 on rangeait son NUMÉRO,
// et l'ordre des circuits a changé avec le championnat : une course v1 aurait
// repris sur un autre circuit. Elle est simplement ignorée.
const indexDe = (id) => TRACKS.findIndex(t => t.id === id);
function restaurer(o) {
  if (!courseValide(o)) return false;
  mode = o.mode === 'solo' || o.mode === 'gp' ? o.mode : 'duo';
  if (NIVEAUX[o.level]) level = o.level;
  ti = indexDe(o.id);
  const n = o.cars.length;
  if (o.regles === 'grille') {
    R = newRace(ti, o.laps || 1, 'tour', { n, regles: 'grille', grille: o.grille, ordre: o.ordre, pieges: o.pieges !== false });
    for (const k of CHAMPS_GRILLE) if (o[k] !== undefined) R[k] = JSON.parse(JSON.stringify(o[k]));
    if (mode === 'gp') nbVoitures = n;
  } else R = newRace(ti, o.laps || 1, o.fin);
  R.cars = JSON.parse(JSON.stringify(o.cars));
  R.turn = Number.isInteger(o.turn) && o.turn >= 0 && o.turn < n ? o.turn : 0;
  R.winner = Number.isInteger(o.winner) && o.winner >= 0 && o.winner < n ? o.winner : null;
  R.dernier = o.dernier || null;
  if (Array.isArray(o.caps)) o.caps.forEach((c, i) => { if (i < 6) caps[i] = c; });
  if (Array.isArray(o.capsAvant)) o.capsAvant.forEach((c, i) => { if (i < 6) capsAvant[i] = c; });
  dernierMoment = typeof o.dernierMoment === 'number' ? o.dernierMoment : -9;
  return true;
}

function sauverCourse(ecran) {
  if (!R || mode === 'ligne') return;   // en ligne, c'est le relais qui garde la course
  try {
    if (finie(R)) { localStorage.removeItem(CLE_COURSE); return; }
    const o = instantane(); o.ecran = ecran || 'jeu';
    localStorage.setItem(CLE_COURSE, JSON.stringify(o));
  } catch (e) { }
}

function lireCourse() {
  try {
    const o = JSON.parse(localStorage.getItem(CLE_COURSE) || 'null');
    if (courseValide(o)) {
      const fini = o.regles === 'grille' ? !!o.terminee : o.fin === 'joueur' ? o.cars[0].fini : o.winner !== null;
      if (!fini) return o;
    }
  } catch (e) { }
  return null;
}

function peutAnnuler() {
  if (mode === 'ligne') return false;
  return !!precedent && !!R && !finie(R) && !occupe();
}

function annuler() {
  if (!peutAnnuler()) return;
  const o = precedent; precedent = null;
  jeton++;
  restaurer(o);
  flash = null;
  newOpts(); refresh();
  sauverCourse('jeu');
  toast('Coup annulé');
}

// ================= tours =================
function commit(k) {
  const car = R.cars[R.turn];
  const depart = car.p.slice();
  const pa = R.turn;
  // en solo, annuler défait le coup du joueur ET la réponse du fantôme : on ne
  // garde donc que l'état d'avant un coup humain
  if (!estFantome(pa)) precedent = instantane();
  camLibre = false;
  coupEnCours = true;
  const ev = play(R, opts[k].p);
  if (mode === 'ligne') coupLocal(k, pa);
  const arrivee = car.p.slice();
  const len = Math.hypot(arrivee[0] - depart[0], arrivee[1] - depart[1]);
  const j = jeton;
  flash = null;
  opts = []; selected = null;
  renderPad(); renderInfo();

  const vit = Math.max(Math.abs(depart[0] - arrivee[0]), Math.abs(depart[1] - arrivee[1]));
  // les fantômes du Grand Prix roulent plus vite à l'écran : jusqu'à cinq entre deux de tes coups
  const dur = REDUIT ? 1 : Math.min(320, 180 + len * 16) * (mode === 'gp' && pa !== 0 ? 0.6 : 1);
  if (ev.type === 'sortie' || ev.type === 'blocage') { sonSortie(); secousse = 14; }
  else {
    moteur(vit, dur / 1000);
    if (vit >= 4) secousse = Math.min(7, vit * 1.1);
    const avant = capsAvant[pa];
    if (avant !== null && len > 1) {
      let da = Math.abs(Math.atan2(arrivee[1] - depart[1], arrivee[0] - depart[0]) - avant);
      while (da > Math.PI) da = Math.abs(da - 2 * Math.PI);
      if (da > 0.45) sonCrisse(Math.min(1, da));
    }
  }
  capsAvant[pa] = len ? Math.atan2(arrivee[1] - depart[1], arrivee[0] - depart[0]) : capsAvant[pa];

  const avantMoi = avanceDe(R.track, depart);
  const avantAutres = R.cars.map((c, i) => i === pa || c.fini ? null : avanceDe(R.track, c.p));

  const suite = () => {
    if (j !== jeton) return;
    coupEnCours = false;
    if (ev.type === 'sortie') {
      flash = ev;
      toast(`Sortie de piste : la voiture ${ADJ[ev.joueur]} repart à l'arrêt`);
    }
    if (ev.type === 'boost') { note(740, .12, .08, 'square'); note(980, .16, .08, 'square', .1); toast('Accélérateur : une case de plus'); }
    if (ev.type === 'blocage') toast(`Accrochage : la voiture ${ADJ[ev.joueur]} s'arrête derrière l'autre`);
    if (ev.type === 'arrivee' && !finie(R)) {
      if (R.regles === 'grille') toast(`${nomDe(pa) === 'Toi' ? 'Tu passes' : NOMS[pa] + ' passe'} la ligne : on finit le tour de jeu`);
      else toast('Le fantôme est arrivé : finis ton tour !');
    }
    // à plusieurs, la course s'arrête à la fin du tour de jeu : c'est nextTurn qui le dit
    if (!finie(R)) avancerTour();
    if (finie(R)) {
      precedent = null; sauverCourse(); conclure(); renderInfo();
      setTimeout(() => { if (j === jeton) lancerReplay(() => drapeau(showWin)); }, 280);
      return;
    }
    newOpts(); refresh();
    sauverCourse('jeu');
    if (estFantome(R.turn)) setTimeout(() => { if (j === jeton) aiTurn(); }, mode === 'gp' ? 90 : 480);
  };

  const apres = () => {
    if (j !== jeton) return;
    // en Grand Prix, seuls TES moments forts passent au ralenti : cinq fantômes, ce serait long
    const m = REDUIT || (mode === 'gp' && pa !== 0) ? null : momentFort(ev, pa, depart, arrivee, avantMoi, avantAutres);
    if (m && dernierMoment < coupsJoues(R) - 1) {
      dernierMoment = coupsJoues(R);
      lancerRejeu(m, pa, depart, arrivee, suite);
    } else suite();
  };
  if (len === 0 || REDUIT) { setTimeout(apres, 40); render(); return; }
  anim = { pa, to: arrivee, t: 0, t0: performance.now(), dur: dur, fin: apres };
  boucle();
}

function forceArret() {
  const j = jeton;
  if (!estFantome(R.turn)) precedent = instantane();
  const pa = R.turn;
  const ev = stuck(R);
  if (mode === 'ligne') coupLocal(9, pa);
  sonSortie();
  toast(`La voiture ${ADJ[ev.joueur]} n'a plus aucune trajectoire : elle s'arrête net`);
  opts = []; selected = null;
  if (!finie(R)) avancerTour();
  if (finie(R)) { precedent = null; sauverCourse(); conclure(); setTimeout(() => { if (j === jeton) lancerReplay(() => drapeau(showWin)); }, 300); return; }
  newOpts(); refresh();
  sauverCourse('jeu');
  if (estFantome(R.turn)) setTimeout(() => { if (j === jeton) aiTurn(); }, mode === 'gp' ? 160 : 480);
}

// Au suivant. À plusieurs, la fin d'un tour de jeu donne l'aspiration : on la dit.
function avancerTour() {
  const m0 = R.manche;
  nextTurn(R);
  if (R.regles !== 'grille' || (R.manche === m0 && !finie(R)) || !R.aspires || !R.aspires.length) return;
  const qui = R.aspires.map(p => nomDe(p) === 'Toi' ? 'toi' : NOMS[p]);
  toast(`Aspiration : +1 de vitesse pour ${qui.join(', ')}`);
}

function lancerReplay(apres) {
  flash = null;
  replay = {
    t: 0, t0: performance.now(), dur: REDUIT ? 1 : 2600,
    fin: apres || showWin
  };
  boucle();
}

function aiTurn() {
  if (!R || finie(R)) return;
  // en ligne, seul l'hôte fait jouer les fantômes : les autres reçoivent leurs coups
  if (mode === 'ligne' && !(ligne && ligne.siege === 0)) return;
  // l'hôte n'est pas à jour : le dernier coup de la file relancera le fantôme
  if (mode === 'ligne' && ligne.file.length) return;
  const j = jeton;
  aiBusy = true; renderInfo();
  // en Grand Prix, jusqu'à cinq fantômes jouent entre deux de tes coups : ils vont plus vite
  const vif = mode === 'gp';
  setTimeout(() => {
    if (j !== jeton) return;
    const q = aiChoice(R, level, Math.random);
    if (q === null) { aiBusy = false; forceArret(); return; }
    const k = opts.findIndex(o => o.p[0] === q[0] && o.p[1] === q[1]);
    selected = k >= 0 ? k : 4;
    render();
    setTimeout(() => { if (j !== jeton) return; aiBusy = false; commit(selected); }, vif ? 150 : 500);
  }, vif ? 60 : 340);
}

// Un doigt sur la carte : on regarde plus loin en la faisant glisser (sur un
// grand circuit), et un simple toucher choisit toujours son point.
const peutGlisser = () => grand && !!R && !anim && !replay && !rejeu && !revue && !depart;
cv.addEventListener('pointerdown', (ev) => {
  // ⚠️ on suit TOUJOURS le doigt, même quand la carte ne se déplace pas (petit
  // circuit) : sinon le toucher ne choisissait plus aucun point.
  glisse = { x: ev.clientX, y: ev.clientY, cx: camX, cy: camY, bouge: false, id: ev.pointerId, carte: peutGlisser() };
  try { cv.setPointerCapture(ev.pointerId); } catch (e) { }
});
cv.addEventListener('pointermove', (ev) => {
  if (!glisse || ev.pointerId !== glisse.id || !glisse.carte) return;
  const dx = ev.clientX - glisse.x, dy = ev.clientY - glisse.y;
  if (!glisse.bouge && Math.hypot(dx, dy) < 10) return;     // un toucher qui tremble reste un toucher
  glisse.bouge = true;
  camLibre = true; camPose = true;
  camX = borneCam(glisse.cx - dx, mapW() - vueW);
  camY = borneCam(glisse.cy - dy, mapH() - vueH);
  ev.preventDefault();
  render();
});
for (const fin of ['pointerup', 'pointercancel']) cv.addEventListener(fin, (ev) => {
  if (!glisse || ev.pointerId !== glisse.id) return;
  const bouge = glisse.bouge; glisse = null;
  if (bouge || ev.type !== 'pointerup') return;
  // un toucher : le point visé, comme avant
  if (!R || finie(R) || occupe()) return;
  const b = cv.getBoundingClientRect();
  const x = ev.clientX - b.left - 2 + camX, y = ev.clientY - b.top - 2 + camY;
  let bk = -1, bd = 1e9;
  opts.forEach((o, k) => {
    if (!o.ok) return;
    const d = Math.hypot(gx(o.p[0]) - x, gy(o.p[1]) - y);
    if (d < bd) { bd = d; bk = k; }
  });
  if (bk >= 0 && bd < cellPx * 0.6) choisir(bk);
});

// ================= écrans =================
let minuteurToast = null;
function toast(txt) {
  const t = $('toast');
  // vidé puis réécrit : une même annonce deux fois de suite est relue
  t.textContent = '';
  t.classList.add('on');
  requestAnimationFrame(() => { t.textContent = txt; });
  clearTimeout(minuteurToast);
  minuteurToast = setTimeout(() => t.classList.remove('on'), 2600);
}

function drapeau(apres) {
  const d = $('drapeau');
  d.style.display = 'block';
  d.classList.remove('on');
  void d.offsetWidth;
  d.classList.add('on');
  souffle(0.9, 700, 220, 0.09, 0.7);
  note(523, .18, .09, 'triangle', .1); note(659, .18, .09, 'triangle', .26); note(880, .4, .1, 'triangle', .42);
  // ⚠️ le drapeau est une IMAGE, pas une animation : avec « animations réduites »
  // il ne restait que 60 ms à l'écran, donc invisible (vu sur son iPhone).
  setTimeout(apres, REDUIT ? 900 : 1250);
}

let suivant = -1, bilan = null;
// ⚠️ Le bilan se fait UNE fois, à l'arrivée. Calculé dans showWin, « Revoir la
// course » le refaisait : le record venait d'être rangé, donc « Nouveau record »
// devenait « Ton record », et « Nouveau circuit ouvert » disparaissait.
function conclure() {
  bilan = null;
  if (mode !== 'solo') return;
  const tk = TRACKS[ti];
  const etaitOuvert = ti + 1 < TRACKS.length && ouvert(ti + 1);
  bilan = { etaitOuvert, rec: noterRecord(tk, R.cars[0].coups) };
}
function showWin() {
  const tk = TRACKS[ti], par = parCourse();
  const solo = mode === 'solo';
  suivant = -1;
  let titre, sub, m = null;
  if (solo) {
    // en championnat, la course va jusqu'à TON arrivée : c'est ton tour qui compte
    const moi = R.cars[0], fant = R.cars[1];
    if (!bilan) conclure();
    const { etaitOuvert, rec } = bilan;
    m = medaille(tk, moi.coups);
    titre = `Tu boucles le tour en ${moi.coups} coups !`;
    const s = seuils(tk);
    const cible = m === 'or' ? (moi.coups <= par ? 'Le tour parfait !' : `Le par est à ${par} : le tour parfait existe.`)
      : m === 'argent' ? `L'or est à ${s.or} coups.` : `L'argent est à ${s.argent} coups, l'or à ${s.or}.`;
    const record = rec.avant === null ? '' : rec.mieux ? ` Nouveau record, tu avais ${rec.avant}.` : ` Ton record : ${rec.avant}.`;
    const fantome = fant.fini ? ` Le fantôme a bouclé en ${fant.coups}.` : " Le fantôme n'était pas arrivé !";
    sub = cible + record + fantome;
    if (ti + 1 < TRACKS.length) {
      suivant = ti + 1;
      if (!etaitOuvert) sub += ` Nouveau circuit ouvert : ${TRACKS[ti + 1].nom}.`;
    }
  } else if (R.regles === 'grille') {
    // à plusieurs : le classement complet
    const cl = classement(R), w = cl[0].voiture, gagnant = R.cars[w];
    const moi = mode === 'gp' ? cl.find(c => c.voiture === 0) : mode === 'ligne' && ligne ? cl.find(c => c.voiture === ligne.siege) : null;
    titre = moi ? (moi.rang === 1 ? `Victoire en ${gagnant.coups} coups !` : `Tu finis ${eme(moi.rang)} sur ${R.cars.length}`)
      : `${NOMS[w]} gagne en ${gagnant.coups} coups !`;
    const ec = gagnant.coups - par;
    sub = R.photo ? 'Photo-finish : plusieurs voitures ont passé la ligne dans le même tour de jeu, la première sur la ligne gagne.'
      : ec <= 0 ? 'Pile le par : le tour parfait !' : `Le par est à ${par} coups.`;
    $('winclass').innerHTML = cl.map(c => {
      const qui = nomDe(c.voiture);
      const note = c.abandon ? 'a quitté la course' : c.fini ? (R.photo && c.rang <= R.arrivees.length ? 'sur la ligne' : 'arrivée') : 'en course';
      return `<li><span class="rg">${eme(c.rang)}</span><span class="rond" style="background:${COUL[c.voiture]}">${c.voiture + 1}</span><span>${qui}${c.exaequo ? ' (ex aequo)' : ''} <i>${note}</i></span></li>`;
    }).join('');
  } else {
    const p = R.winner, gagnant = R.cars[p], ec = gagnant.coups - par;
    titre = mode === 'ligne' && ligne && p === ligne.siege ? `Tu boucles le tour en ${gagnant.coups} coups !`
      : `${NOMS[p]} boucle le tour en ${gagnant.coups} coups !`;
    sub = ec <= 0 ? 'Pile le par : le tour parfait !'
      : `Le par est à ${par} : ${ec} coup${ec > 1 ? 's' : ''} à gagner la prochaine fois.`;
    sub += gagnant.crashes ? ` ${gagnant.crashes} sortie${gagnant.crashes > 1 ? 's' : ''} de piste.` : ' Sans une seule sortie de piste.';
  }
  $('winclass').hidden = R.regles !== 'grille';
  $('wincard').className = 'wincard b' + (solo ? 0 : R.winner);
  $('winmedaille').innerHTML = m ? svgMedaille(m, 44) + `<span>Médaille ${NOM_MEDAILLE[m]}</span>` : '';
  $('winmedaille').hidden = !m;
  $('wintitle').textContent = titre;
  $('winsub').textContent = sub;
  $('suivant').hidden = suivant < 0;
  if (suivant >= 0) $('suivant').textContent = `Manche suivante : ${TRACKS[suivant].nom}`;
  $('again').className = suivant >= 0 ? 'outline' : 'light';
  $('again').textContent = mode === 'ligne' ? 'Revanche' : 'Refaire la course';
  $('backmenu').textContent = mode === 'ligne' ? 'Quitter la course en ligne' : 'Changer de circuit';
  $('win').style.display = 'flex';
  (suivant >= 0 ? $('suivant') : $('again')).focus();
}

let depart = false;

function feuxDepart(apres) {
  const box = $('feux');
  const lampes = box.querySelectorAll('.lampe');
  const j = jeton;
  lampes.forEach(l => l.className = 'lampe');
  box.style.display = 'flex';
  depart = true;
  let i = 0;
  const fin = () => { if (j !== jeton) return; box.style.display = 'none'; depart = false; apres(); };
  const pas = () => {
    if (j !== jeton) return;
    if (i < lampes.length) {
      lampes[i].classList.add('rouge');
      sonBip(false);
      i++;
      setTimeout(pas, REDUIT ? 160 : 620);
    } else {
      setTimeout(() => {
        if (j !== jeton) return;
        lampes.forEach(l => { l.classList.remove('rouge'); l.classList.add('verte'); });
        sonBip(true);
        moteur(5, 0.5);
        setTimeout(fin, REDUIT ? 200 : 620);
      }, REDUIT ? 200 : 400 + Math.random() * 700);
    }
  };
  setTimeout(pas, 320);
}

function montrerJeu() {
  $('win').style.display = 'none';
  $('drapeau').style.display = 'none';
  $('menu').style.display = 'none';
  $('game').style.display = 'flex';
  $('trackname').textContent = TRACKS[ti].nom;
  $('parline').textContent = 'par ' + parCourse();
}

function remiseAZero() {
  jeton++;
  coupEnCours = false;
  camLibre = false; glisse = null;
  if (revue) { revue = null; $('revuebar').hidden = true; $('bas').hidden = false; }
  avance = null;
  terrain = null;
  rejeu = null; anim = null; replay = null; flash = null; aiBusy = false; depart = false;
  $('rejeubox').classList.remove('on');
  $('feux').style.display = 'none';
}

// Le Grand Prix court sur tous les circuits, mais à plus de deux seulement sur
// les grands : les petits sont trop étroits pour doubler (mesuré, voir la spec).
const grandsCircuits = () => TRACKS.map((t, k) => k).filter(k => pelotonPermis(TRACKS[k]));
const aPlusieurs = () => mode === 'gp' || mode === 'ligne';
const circuitPermis = (k) => !aPlusieurs() || nbPlaces() <= 2 || pelotonPermis(TRACKS[k]);

function start() {
  remiseAZero();
  if (mode !== 'solo') { if (!circuitPermis(ti)) ti = grandsCircuits()[0]; }
  else if (!ouvert(ti)) ti = prochain();
  bilan = null;
  // le championnat garde la course de la v7 ; à deux et en Grand Prix, la grille
  if (mode === 'solo') R = newRace(ti, 1, 'joueur');
  else { const n = mode === 'gp' ? nbVoitures : 2; R = newRace(ti, 1, 'tour', { n, regles: 'grille', grille: tirage(n), pieges: piegesOn }); }
  precedent = null;
  dernierMoment = -9;
  caps.fill(-Math.PI / 2);
  capsAvant.fill(null);
  newOpts();
  montrerJeu();
  layout(); refresh();
  requestAnimationFrame(() => { layout(); render(); });
  audio(); saveReglages(); sauverCourse('jeu');
  const j = jeton;
  feuxDepart(() => { refresh(); astuceCarte(); if (estFantome(R.turn)) setTimeout(() => { if (j === jeton) aiTurn(); }, 400); });
}

// Une fonction que rien n'annonce n'existe pas : on le dit une fois, au premier
// grand circuit, là où la carte dépasse l'écran.
function astuceCarte() {
  if (!grand) return;
  try { if (localStorage.getItem(CLE_ASTUCE)) return; localStorage.setItem(CLE_ASTUCE, '1'); } catch (e) { }
  toast('Fais glisser la carte pour voir plus loin');
}

// Reprendre là où on en était : rechargement, écran éteint, application tuée.
function reprendre(o) {
  remiseAZero();
  if (!restaurer(o)) return false;
  precedent = null;
  newOpts();
  montrerJeu();
  layout(); refresh();
  requestAnimationFrame(() => { layout(); render(); });
  sauverCourse('jeu');
  if (estFantome(R.turn)) { const j = jeton; setTimeout(() => { if (j === jeton) aiTurn(); }, 500); }
  return true;
}

function versAccueil() {
  if (R && !finie(R)) sauverCourse('accueil');
  remiseAZero();
  $('drapeau').style.display = 'none'; $('win').style.display = 'none';
  $('game').style.display = 'none'; $('menu').style.display = 'flex';
  majAccueil();
  $('jouer').focus();
}

function saveReglages() {
  try { localStorage.setItem(CLE_REGLAGES, JSON.stringify({ mode, level, voitures: nbVoitures, places: nbLigne, pieges: piegesOn, aide: aideOn, circuit: TRACKS[ti].id, sonOn })); } catch (e) { }
}

// ================= feuilles (réglages, règles) =================
let ouvreur = null;
function ouvrir(id) {
  ouvreur = document.activeElement;
  $(id).hidden = false;
  if (id === 'reglages') majReglages();
  // les trois pièges, dessinés par le MÊME code que la piste (sinon ils
  // finiraient par ne plus lui ressembler)
  if (id === 'regles') for (const [cv, type] of [['vigHumide', 'humide'], ['vigHuile', 'huile'], ['vigBoost', 'boost']]) vignettePiege($(cv), type);
  const corps = $(id).querySelector('.corps');
  if (corps) corps.scrollTop = 0;
  const b = $(id).querySelector('.corps button:not([hidden])');
  if (b) b.focus();
}
function fermer() {
  let ferme = false;
  for (const id of ['reglages', 'regles']) if (!$(id).hidden) { $(id).hidden = true; ferme = true; }
  if (ferme && ouvreur && ouvreur.focus) ouvreur.focus();
  return ferme;
}
for (const id of ['reglages', 'regles']) {
  $(id).addEventListener('click', (e) => { if (e.target === $(id) || e.target.closest('[data-fermer]')) fermer(); });
}

function majReglages() {
  $('sonOui').setAttribute('aria-pressed', sonOn);
  $('sonNon').setAttribute('aria-pressed', !sonOn);
  $('aideOui').setAttribute('aria-pressed', aideOn);
  $('aideNon').setAttribute('aria-pressed', !aideOn);
  // ⚠️ au démarrage, la course est cachée par la FEUILLE DE STYLE : son style en
  // ligne est vide, et « !== 'none' » la croyait affichée. L'accueil proposait
  // donc « Recommencer la course » sans aucune course.
  const enCourse = $('game').style.display === 'flex';
  const enLigne = !!(ligne && ligne.actif);
  $('recommencer').hidden = !enCourse || enLigne;
  $('accueil').hidden = !enCourse || enLigne;
  $('quitterLigne').hidden = !enLigne;
  verifierInstalle();
  diagnostic();
}

// ================= accueil =================
// La vignette d'un circuit, dans une boîte fixe : chaque circuit a sa taille.
function vignette(k) {
  const tk = TRACKS[k], C = tk.cols || 21, Rw = tk.rows || 26;
  const BW = 44, BH = 54, e = Math.min((BW - 2) / C, (BH - 2) / Rw);
  const c = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  c.width = BW * dpr; c.height = BH * dpr; c.style.width = BW + 'px'; c.style.height = BH + 'px';
  const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const ox = (BW - C * e) / 2, oy = (BH - Rw * e) / 2;
  const X = (v) => ox + v * e, Y = (v) => oy + v * e;
  x.fillStyle = '#DCE8D2'; x.fillRect(0, 0, BW, BH);
  if (tk.trace) {
    x.beginPath(); tk.trace.forEach((q, i) => i ? x.lineTo(X(q[0]), Y(q[1])) : x.moveTo(X(q[0]), Y(q[1]))); x.closePath();
    x.lineJoin = 'round'; x.lineCap = 'round';
    x.lineWidth = 2 * tk.demi * e + 2; x.strokeStyle = '#5A6473'; x.stroke();
    x.lineWidth = 2 * tk.demi * e; x.strokeStyle = '#D6D8D1'; x.stroke();
  } else {
    x.fillStyle = '#5A6473';
    for (const r of tk.outers) x.fillRect(X(r[0]) - 1, Y(r[1]) - 1, (r[2] - r[0]) * e + 2, (r[3] - r[1]) * e + 2);
    x.fillStyle = '#D6D8D1';
    for (const r of tk.outers) x.fillRect(X(r[0]), Y(r[1]), (r[2] - r[0]) * e, (r[3] - r[1]) * e);
    x.fillStyle = '#5A6473';
    for (const r of tk.islands) x.fillRect(X(r[0]) - 1, Y(r[1]) - 1, (r[2] - r[0]) * e + 2, (r[3] - r[1]) * e + 2);
    x.fillStyle = '#DCE8D2';
    for (const r of tk.islands) x.fillRect(X(r[0]), Y(r[1]), (r[2] - r[0]) * e, (r[3] - r[1]) * e);
  }
  const L = tk.depart;
  x.fillStyle = '#22282F'; x.fillRect(X(L.x0), Y(L.y) - 1, (L.x1 - L.x0) * e, 2);
  return c;
}

const CADENAS = '<svg class="cadenas" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

// Les circuits, dans l'ordre du championnat : numéro de manche, vignette, nom,
// et ce qu'on y a fait. Un circuit fermé se VOIT (cadenas) et dit comment
// l'ouvrir : une fonction qu'on ne voit pas n'existe pas.
function majCircuits() {
  const r = records(), boite = $('circuits');
  if (boite.children.length !== TRACKS.length) {
    boite.innerHTML = TRACKS.map((t, k) => `<button class="tuile circ" id="tk${k}" type="button"></button>`).join('');
    for (let k = 0; k < TRACKS.length; k++) $('tk' + k).addEventListener('click', () => {
      if (mode !== 'solo') {
        if (!circuitPermis(k)) { toastAccueil(`${TRACKS[k].nom} est trop étroit pour doubler à plusieurs : 2 voitures seulement`); return; }
      } else if (!ouvert(k)) { toastAccueil(`Finis ${TRACKS[k - 1].nom} pour ouvrir ${TRACKS[k].nom}`); return; }
      ti = k; majAccueil(); saveReglages();
    });
  }
  // hors championnat, tout est ouvert : le championnat ne ferme que le championnat
  const gp = mode !== 'solo';
  for (let k = 0; k < TRACKS.length; k++) {
    const tk = TRACKS[k], b = $('tk' + k), ouv = gp || ouvert(k), rec = r[tk.id], m = rec ? medaille(tk, rec.coups) : null;
    const etroit = gp && !circuitPermis(k);
    b.classList.toggle('ferme', !ouv);
    b.classList.toggle('etroit', etroit);
    b.setAttribute('aria-pressed', k === ti && ouv && !etroit);
    b.setAttribute('aria-disabled', !ouv || etroit);
    const detail = etroit ? 'à deux seulement : trop étroit' : !ouv ? `Finis ${TRACKS[k - 1].nom}` : rec ? `record ${rec.coups} · par ${tk.par}` : `par ${mode !== 'solo' && !piegesOn ? tk.parSans : tk.par}`;
    b.setAttribute('aria-label', `Manche ${k + 1} : ${tk.nom}, ${detail}${m ? ', médaille ' + NOM_MEDAILLE[m] : ''}${ouv ? '' : ', fermé'}`);
    b.innerHTML = `<span class="num-manche" aria-hidden="true">${k + 1}</span><span class="txt"><b>${tk.nom}</b><i>${detail}</i></span>`
      + (m ? svgMedaille(m, 26) : '') + (ouv ? '' : CADENAS) + '<span class="coche" aria-hidden="true">✓</span>';
    b.insertBefore(vignette(k), b.children[1]);
  }
}

// un message sur l'accueil (le bandeau de la course n'y est pas visible)
let minuteurAccueil = null;
function toastAccueil(txt) {
  const t = $('toastAccueil');
  t.textContent = '';
  t.classList.add('on');
  requestAnimationFrame(() => { t.textContent = txt; });
  clearTimeout(minuteurAccueil);
  minuteurAccueil = setTimeout(() => t.classList.remove('on'), 2600);
}

function majAccueil() {
  if (mode !== 'solo') { if (!circuitPermis(ti)) ti = grandsCircuits()[0]; }
  else if (!ouvert(ti)) ti = prochain();
  majCircuits();
  const seul = mode === 'solo' || mode === 'gp';
  $('duo').setAttribute('aria-pressed', mode === 'duo');
  $('solo').setAttribute('aria-pressed', seul);
  $('enligne').setAttribute('aria-pressed', mode === 'ligne');
  $('championnat').setAttribute('aria-pressed', mode === 'solo');
  // le nombre de manches suit les circuits (il disait encore « 7 » avec 11 circuits)
  $('championnat').querySelector('i').textContent = `${TRACKS.length} manches, médailles`;
  $('grandprix').setAttribute('aria-pressed', mode === 'gp');
  $('formule').hidden = !seul;
  $('voitures').hidden = !aPlusieurs();
  $('pieges').hidden = mode === 'solo';
  $('pieges').setAttribute('aria-checked', piegesOn);
  $('piegesEtat').textContent = piegesOn ? 'oui' : 'non';
  for (let n = 2; n <= 6; n++) $('v' + n).setAttribute('aria-pressed', n === nbPlaces());
  $('labNiveau').textContent = mode === 'gp' ? 'Les fantômes roulent' : 'Le fantôme roule';
  $('jouer').textContent = mode === 'ligne' ? 'Créer la course en ligne' : 'Jouer';
  $('niveaux').hidden = !seul;
  for (const j of ['tranquille', 'normal', 'rapide']) $(j).setAttribute('aria-pressed', j === level);
  const o = lireCourse();
  $('reprendre').hidden = !o;
  if (o) {
    const qui = o.mode === 'solo' ? 'championnat' : o.mode === 'gp' ? `Grand Prix à ${o.cars.length}` : 'à deux';
    $('reprendreInfo').textContent = `${TRACKS[indexDe(o.id)].nom}, ${qui} · ${o.cars.reduce((t, c) => t + c.coups, 0)} coups joués`;
  }
}

// ================= installation, version, réparation =================
// On ne retient jamais « installé » : ça survivrait à une désinstallation et le
// bouton ne reviendrait plus. On redemande au navigateur à chaque ouverture.
let invitation = null, installeCetteFois = false;
function dansLApplication() {
  return navigator.standalone === true ||
    ['standalone', 'fullscreen', 'minimal-ui'].some(m => window.matchMedia('(display-mode: ' + m + ')').matches);
}
const UA = navigator.userAgent;
const estIOS = /iPad|iPhone|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// un navigateur intégré (Instagram, Facebook, Messenger, Snapchat, l'app Google…)
// ne sait PAS ajouter une page à l'écran d'accueil : il faut ouvrir Safari
const integre = /FBAN|FBAV|FB_IAB|Instagram|Snapchat|Line\/|GSA\/|MicroMessenger|TikTok/i.test(UA);
const PARTAGER = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-label="Partager" role="img"><path d="M12 3v12"/><path d="m8 7 4-4 4 4"/><path d="M6 11H5v10h14V11h-1"/></svg>';
const PLUS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
function etapesInstallation() {
  if (estIOS && integre) return [
    'Cette page est ouverte dans une autre application : elle ne peut pas ajouter de jeu.',
    'Touche les 3 points ou le bouton de partage, puis « Ouvrir dans Safari ».',
    'Dans Safari, reviens ici et touche à nouveau ce bouton.'];
  if (estIOS) return [
    `Touche ${PARTAGER} Partager, en bas de Safari (en haut à droite dans Chrome).`,
    `Fais défiler et choisis ${PLUS} « Sur l'écran d'accueil ».`,
    'Touche « Ajouter » : Paper Race apparaît avec les autres applications.'];
  return [
    'Touche les 3 points en haut à droite de Chrome.',
    "Choisis « Ajouter à l'écran d'accueil », puis « Installer »."];
}
function verifierInstalle() {
  const b = $('installer'), astuce = $('astuce');
  if (dansLApplication() || installeCetteFois) { b.hidden = true; astuce.hidden = true; return; }
  // dans le doute, on montre : un bouton en trop se ferme, un bouton absent n'existe pas
  b.hidden = false;
  $('installerTexte').textContent = estIOS ? "Ajouter à l'écran d'accueil" : 'Installer le jeu';
  if (!navigator.getInstalledRelatedApps) return;
  navigator.getInstalledRelatedApps().then((liste) => {
    if (dansLApplication() || installeCetteFois) return;
    if (liste && liste.length) { b.hidden = true; astuce.hidden = true; }
  }).catch(() => { });
}
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); invitation = e; installeCetteFois = false; });
window.addEventListener('appinstalled', () => { invitation = null; installeCetteFois = true; verifierInstalle(); });
$('installer').addEventListener('click', () => {
  if (invitation) {
    invitation.prompt();
    invitation.userChoice.finally(() => { invitation = null; });
    return;
  }
  // pas d'invitation (iPhone, ou déjà refusée sur Android) : le bouton DÉPLIE les
  // étapes, et le montre en se transformant ; un second appui les replie
  const a = $('astuce');
  if (a.hidden) {
    $('astuceEtapes').innerHTML = etapesInstallation().map(t => `<li>${t}</li>`).join('');
    a.hidden = false;
    $('installer').setAttribute('aria-expanded', 'true');
    a.scrollIntoView({ block: 'nearest', behavior: REDUIT ? 'auto' : 'smooth' });
  } else {
    a.hidden = true;
    $('installer').setAttribute('aria-expanded', 'false');
  }
});

function diagnostic() {
  $('menuVersion').textContent = VERSION.replace('paper-race-', '');
  const bouts = { service: '…', caches: '…' };
  const montrer = () => { $('menuDiag').textContent = 'service ' + bouts.service + (window.majEchouee ? ' · mise à jour échouée' : '') + ' · caches ' + bouts.caches; };
  montrer();
  const sw = navigator.serviceWorker && navigator.serviceWorker.controller;
  if (!sw) { bouts.service = 'aucun'; montrer(); }
  else {
    const canal = new MessageChannel(); let repondu = false;
    canal.port1.onmessage = (e) => {
      repondu = true;
      bouts.service = String(e.data).replace('paper-race-', '');
      // la page et le service ne sont pas d'accord : on propose de tout remettre à plat
      $('reparer').hidden = e.data === VERSION;
      montrer();
    };
    sw.postMessage('version', [canal.port2]);
    setTimeout(() => { if (repondu) return; bouts.service = 'muet'; $('reparer').hidden = false; montrer(); }, 1500);
  }
  if (window.caches) caches.keys().then((cles) => {
    bouts.caches = cles.filter(k => k.indexOf('paper-race:') === 0).map(k => k.split(':').pop().replace('paper-race-', '')).join(', ') || 'aucun';
    montrer();
  }).catch(() => { });
}

// Réparer : on oublie ce que le téléphone a gardé de CE jeu (caches, service),
// puis on recharge. La course en cours, elle, est dans localStorage et revient.
$('reparer').addEventListener('click', () => {
  if (R && $('game').style.display !== 'none') sauverCourse('jeu');
  const fini = () => location.reload();
  const effacer = window.caches ? caches.keys().then(cles => Promise.all(cles.filter(k => k.indexOf('paper-race:') === 0).map(k => caches.delete(k)))) : Promise.resolve();
  const desinscrire = navigator.serviceWorker && navigator.serviceWorker.getRegistrations
    ? navigator.serviceWorker.getRegistrations().then(regs => Promise.all(regs.filter(g => g.scope.indexOf('/paper-race/') >= 0).map(g => g.unregister())))
    : Promise.resolve();
  Promise.all([effacer, desinscrire]).then(fini, fini);
});

// ================= branchements =================
function recaler() { if (R && $('game').style.display !== 'none') { layout(); render(); } }
window.addEventListener('resize', recaler);
window.addEventListener('orientationchange', () => setTimeout(recaler, 120));
if (window.visualViewport) window.visualViewport.addEventListener('resize', recaler);
// écran éteint, onglet quitté : on range la course tout de suite
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && R && !finie(R) && $('game').style.display !== 'none') sauverCourse('jeu');
});

brancherRevue();          // les boutons de « Revoir la course » (rendu.js)
$('go').addEventListener('click', () => {
  if (!R || finie(R) || occupe()) return;
  if (opts.length && opts.filter(o => o.ok).length === 0) { forceArret(); return; }
  if (selected !== null && opts[selected] && opts[selected].ok) commit(selected);
});
$('annuler').addEventListener('click', annuler);
$('menubtn').addEventListener('click', () => ouvrir('reglages'));
$('reglagesBtn').addEventListener('click', () => ouvrir('reglages'));
$('reglesBtn').addEventListener('click', () => ouvrir('regles'));
$('recommencer').addEventListener('click', () => { fermer(); start(); });
$('accueil').addEventListener('click', () => { fermer(); versAccueil(); });
$('again').addEventListener('click', () => {
  $('drapeau').style.display = 'none';
  // en ligne : la revanche se demande au relais, qui remet la course à zéro pour les deux
  if (mode === 'ligne' && ligne && ligne.actif) { $('win').style.display = 'none'; envoyer({ t: 'revanche', manche: ligne.manche }); return; }
  start();
});
$('suivant').addEventListener('click', () => { if (suivant < 0) return; ti = suivant; $('drapeau').style.display = 'none'; saveReglages(); start(); });
$('backmenu').addEventListener('click', () => { if (mode === 'ligne' && ligne && ligne.actif) finLigne(); else versAccueil(); });
// le drapeau à damier reste plein écran après l'arrivée : sans l'enlever, le
// rejeu passait DERRIÈRE lui et le bouton ne montrait rien
$('revoir').addEventListener('click', ouvrirRevue);
$('jouer').addEventListener('click', () => { if (mode === 'ligne') creerLigne(); else start(); });
$('reprendre').addEventListener('click', () => { const o = lireCourse(); if (!o || !reprendre(o)) majAccueil(); });

$('duo').addEventListener('click', () => { mode = 'duo'; majAccueil(); saveReglages(); });
$('enligne').addEventListener('click', () => { mode = 'ligne'; majAccueil(); });
$('solo').addEventListener('click', () => {
  if (mode !== 'gp') mode = 'solo';
  majAccueil(); saveReglages();
  // sur un petit écran, les niveaux naissent sous le pli : on les amène au-dessus du bouton
  $('niveaux').scrollIntoView({ block: 'nearest', behavior: REDUIT ? 'auto' : 'smooth' });
});
$('championnat').addEventListener('click', () => { mode = 'solo'; majAccueil(); saveReglages(); });
$('pieges').addEventListener('click', () => { piegesOn = !piegesOn; sonClic(); majAccueil(); saveReglages(); });
$('grandprix').addEventListener('click', () => {
  mode = 'gp'; majAccueil(); saveReglages();
  $('voitures').scrollIntoView({ block: 'nearest', behavior: REDUIT ? 'auto' : 'smooth' });
});
for (let n = 2; n <= 6; n++) {
  $('v' + n).addEventListener('click', () => {
    if (mode === 'ligne') nbLigne = n; else nbVoitures = n;
    if (!circuitPermis(ti)) { ti = grandsCircuits()[0]; toastAccueil(`À ${n}, on court sur les grands circuits : ${TRACKS[ti].nom}`); }
    majAccueil(); saveReglages();
  });
}
for (const id of ['tranquille', 'normal', 'rapide']) {
  $(id).addEventListener('click', () => { level = id; majAccueil(); saveReglages(); });
}
$('aideOui').addEventListener('click', () => { aideOn = true; sonClic(); majReglages(); saveReglages(); render(); });
$('aideNon').addEventListener('click', () => { aideOn = false; majReglages(); saveReglages(); render(); });
$('sonOui').addEventListener('click', () => { sonOn = true; sonClic(); majReglages(); saveReglages(); });
$('sonNon').addEventListener('click', () => { sonOn = false; majReglages(); saveReglages(); });

// ================= clavier =================
// Chiffres du pavé numérique : 7 8 9 en haut, 1 2 3 en bas, 5 = même vitesse.
// Flèches : déplacer le choix. Entrée : tracer. Ctrl+Z ou Retour arrière : annuler.
const PAVE_NUM = { '7': 0, '8': 1, '9': 2, '4': 3, '5': 4, '6': 5, '1': 6, '2': 7, '3': 8 };
const FLECHES = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (fermer()) e.preventDefault(); else if (revue) { e.preventDefault(); fermerRevue(); } return; }
  // en revoyant la course : ← → coup par coup, espace pour lecture / pause
  if (revue && $('reglages').hidden) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); $('revPrec').click(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); $('revSuiv').click(); }
    else if (e.key === ' ' && e.target === document.body) { e.preventDefault(); $('revLecture').click(); }
    return;
  }
  if (!$('reglages').hidden || !$('regles').hidden) return;
  if ($('game').style.display === 'none' || $('win').style.display === 'flex' || !R) return;
  if (e.altKey || e.metaKey) return;
  if ((e.ctrlKey && (e.key === 'z' || e.key === 'Z')) || (e.key === 'Backspace' && !e.ctrlKey)) {
    e.preventDefault(); annuler(); return;
  }
  if (e.ctrlKey) return;
  const chiffre = e.code && e.code.indexOf('Numpad') === 0 ? e.code.slice(6) : e.key;
  if (PAVE_NUM[chiffre] !== undefined) { e.preventDefault(); choisir(PAVE_NUM[chiffre]); return; }
  if (FLECHES[e.key]) {
    e.preventDefault();
    const [dx, dy] = FLECHES[e.key];
    const k0 = selected === null ? 4 : selected;
    const cx = (k0 % 3) + dx, cy = ((k0 / 3) | 0) + dy;
    if (cx >= 0 && cx <= 2 && cy >= 0 && cy <= 2) choisir(cy * 3 + cx);
    return;
  }
  if (e.key === 'Enter') {
    const a = document.activeElement;
    // Entrée sur un autre bouton (menu, annuler) garde son sens
    if (a && a.tagName === 'BUTTON' && !a.classList.contains('padbtn') && a.id !== 'go') return;
    e.preventDefault();
    if (!$('go').disabled) $('go').click();
  }
});

// ================= démarrage =================
(function init() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(CLE_REGLAGES) || 'null'); } catch (e) { }
  if (s) {
    if (NIVEAUX[s.level]) level = s.level;
    // le circuit par son id : l'ancien numéro (avant la v4) désignait un autre ordre
    if (typeof s.circuit === 'string' && indexDe(s.circuit) >= 0) ti = indexDe(s.circuit);
    if (typeof s.sonOn === 'boolean') sonOn = s.sonOn;
    if (s.mode === 'solo' || s.mode === 'duo' || s.mode === 'gp') mode = s.mode;
    if (Number.isInteger(s.voitures) && s.voitures >= 2 && s.voitures <= 6) nbVoitures = s.voitures;
    if (typeof s.pieges === 'boolean') piegesOn = s.pieges;
    if (typeof s.aide === 'boolean') aideOn = s.aide;
    if (Number.isInteger(s.places) && s.places >= 2 && s.places <= 6) nbLigne = s.places;
  }
  $('menuVersion').textContent = VERSION.replace('paper-race-', '');
  // une course laissée en plein jeu (rechargement, mise à jour, app tuée) reprend
  // directement ; une course laissée depuis l'accueil attend qu'on la reprenne
  const o = lireCourse();
  $('menu').style.display = 'flex';
  majAccueil();
  // (un lien d'invitation #salle=CODE est lu par ligne.js, chargé APRÈS ce fichier)
  if (o && o.ecran === 'jeu' && !/salle=/.test(location.hash)) reprendre(o);
})();

// ================= service worker =================
// Le nouveau service prend la main tout seul (skipWaiting + claim), mais la page
// déjà chargée garde l'ancien code : on la recharge une fois, et seulement s'il
// y avait déjà un service (sinon, première visite, rien n'est périmé).
// La course en cours survit : elle est rangée après chaque coup.
if ('serviceWorker' in navigator) {
  let rechargeFaite = false;
  const avaitUnControleur = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (rechargeFaite || !avaitUnControleur) return;
    rechargeFaite = true;
    if (R && !finie(R) && $('game').style.display !== 'none') sauverCourse('jeu');
    location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const neuf = reg.installing;
        if (neuf) neuf.addEventListener('statechange', () => { if (neuf.state === 'redundant') window.majEchouee = true; });
      });
      return reg.update();
    }).catch(() => { });
  });
}
