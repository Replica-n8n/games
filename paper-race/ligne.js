// ===== Paper Race : la course EN LIGNE, sur deux téléphones =====
// Chargé après ui.js, dont il partage les noms globaux.
//
// Un relais (serveur-paper-race/, Cloudflare) garde la liste des coups et vérifie
// que chacun joue à son tour. Il ne connaît pas les règles : chaque téléphone
// rejoue les coups avec moteur.js, qui ne laisse aucune place au hasard.
// Un coup est le numéro d'une des neuf cases du pavé (0 à 8), ou 9 : « coincé ».
//
// ⚠️ C'est le SEUL endroit du jeu qui parle au réseau, et seulement pendant une
// course en ligne. Seul, à deux sur un téléphone, le championnat : hors ligne.
// Rien sur les joueurs : ni nom, ni compte, ni discussion. On rejoint par un
// lien ou un QR code, jamais en tapant un code.
const LOCAL = /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
const RELAIS = LOCAL ? (new URLSearchParams(location.search).get('relais') || 'http://127.0.0.1:8787')
  : 'https://paper-race.jfrxdi0zz.workers.dev';
const CLE_LIGNE = 'paper-race.ligne.v1';

ligne = {
  actif: false, code: null, jeton: null, siege: 0, connecte: false,
  presents: [false, false], manche: 1, ws: null, file: [], essais: 0, minuteur: null,
  lancee: false,          // la course a démarré (feux passés) pour cette manche
};

function rangerLigne() {
  try { localStorage.setItem(CLE_LIGNE, JSON.stringify({ code: ligne.code, jeton: ligne.jeton, siege: ligne.siege })); } catch (e) { }
}
function oublierLigne() {
  try { localStorage.removeItem(CLE_LIGNE); } catch (e) { }
}
function lireLigne() {
  try { const o = JSON.parse(localStorage.getItem(CLE_LIGNE) || 'null'); if (o && /^[A-Z2-9]{4}$/.test(o.code)) return o; } catch (e) { }
  return null;
}
const lienSalle = (code) => location.origin + location.pathname.replace(/index\.html$/, '') + '#salle=' + code;

// ---------- la connexion ----------
function connecter() {
  clearTimeout(ligne.minuteur);
  if (!ligne.actif) return;
  let ws;
  try { ws = new WebSocket(RELAIS.replace(/^http/, 'ws') + `/salles/${ligne.code}/ws` + (ligne.jeton ? '?jeton=' + ligne.jeton : '')); }
  catch (e) { return reessayer(); }
  ligne.ws = ws;
  ws.onopen = () => { ligne.essais = 0; };
  ws.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } recevoir(m); };
  ws.onclose = (e) => {
    if (ligne.ws !== ws) return;
    ligne.connecte = false; majLigne();
    if (e.code === 4004 || e.code === 4010) return finLigne("Cette course n'existe plus.");
    if (e.code === 4009) return finLigne('Cette course a déjà deux joueurs.');
    reessayer();
  };
}
// le réseau tombe (ascenseur, tunnel, écran éteint) : on revient, de plus en plus lentement
function reessayer() {
  if (!ligne.actif) return;
  ligne.essais++;
  ligne.minuteur = setTimeout(connecter, Math.min(15000, 800 * ligne.essais));
}
function envoyer(obj) {
  if (ligne.ws && ligne.ws.readyState === 1) { ligne.ws.send(JSON.stringify(obj)); return true; }
  return false;
}
// l'écran se rallume : on se reconnecte tout de suite, sans attendre le prochain essai
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && ligne.actif && (!ligne.ws || ligne.ws.readyState > 1)) connecter();
});
window.addEventListener('online', () => { if (ligne.actif && (!ligne.ws || ligne.ws.readyState > 1)) connecter(); });

// ---------- ce que dit le relais ----------
function recevoir(m) {
  if (m.t === 'erreur') return;
  if (m.t === 'presence') {
    ligne.presents = m.presents;
    majLigne(); lancerSiPrets();
    return;
  }
  if (m.t === 'etat') {
    ligne.connecte = true;
    if (typeof m.siege === 'number') ligne.siege = m.siege;
    if (m.jeton) { ligne.jeton = m.jeton; }
    rangerLigne();
    ligne.presents = m.presents || ligne.presents;
    const ti2 = indexDe(m.circuit);
    if (ti2 < 0) return finLigne("Ce circuit n'existe pas dans cette version du jeu.");
    $('salleCircuit').textContent = TRACKS[ti2].nom;
    // on rebâtit la course depuis les coups du relais : c'est lui qui fait foi
    const nouvelleManche = m.manche !== ligne.manche || !R || R.track.id !== m.circuit;
    const enRetard = !R || nouvelleManche || totalCoups() !== m.coups.length;
    ligne.manche = m.manche;
    if (enRetard) rebatir(ti2, m.coups);
    if (m.revanche || nouvelleManche) ligne.lancee = m.coups.length > 0;
    else if (m.coups.length > 0) ligne.lancee = true;
    majLigne(); lancerSiPrets();
    // une revanche alors que l'autre est parti : on remontre le lien pour le réinviter
    if (m.revanche && !ligne.lancee && !ligne.presents[1 - ligne.siege]) montrerSalle();
    return;
  }
  if (m.t === 'coup') {
    if (m.manche !== ligne.manche) return;
    if (m.n < totalCoups()) return;            // notre propre coup, déjà joué ici
    ligne.file.push(m.k);
    avancerFile();
  }
}
const totalCoups = () => R ? R.cars[0].coups + R.cars[1].coups : 0;

// rejoue la course coup par coup, sans animation
function rebatir(k, coups) {
  remiseAZero();
  mode = 'ligne'; ti = k;
  R = newRace(ti, 1, 'premier');
  for (const c of coups) {
    if (finie(R)) break;
    if (c === 9) stuck(R);
    else { const o = choices(R)[c]; if (!o || !o.ok) break; play(R, o.p); }
    nextTurn(R);
  }
  ligne.file = [];
  precedent = null;
  caps[0] = caps[1] = -Math.PI / 2; capsAvant[0] = capsAvant[1] = null;
  // la salle d'attente reste tant que la course n'a pas commencé
  if (coups.length) $('salle').hidden = true;
  newOpts(); montrerJeu(); layout(); refresh();
  if (finie(R)) setTimeout(() => lancerReplay(() => drapeau(showWin)), 300);
}

// les deux sont là, la course n'a pas commencé : les feux, sur chaque téléphone
function lancerSiPrets() {
  if (!ligne.actif || ligne.lancee || !R || totalCoups() > 0) return;
  if (!ligne.presents[0] || !ligne.presents[1]) return;
  ligne.lancee = true;
  $('salle').hidden = true;
  montrerJeu(); layout(); refresh();
  audio();
  feuxDepart(() => refresh());
}

// le coup de l'autre : on le joue comme s'il avait touché le pavé
function avancerFile() {
  if (!ligne.file.length || !R || finie(R)) return;
  if (anim || replay || rejeu || depart) { setTimeout(avancerFile, 120); return; }
  const k = ligne.file.shift();
  ligne.distant = true;
  if (k === 9) forceArret();
  else if (opts[k] && opts[k].ok) { selected = k; commit(k); }
  ligne.distant = false;
  setTimeout(avancerFile, 60);
}

// appelé par commit / forceArret pour un coup joué SUR CE téléphone
function coupLocal(n, k) {
  if (!ligne.actif || ligne.distant) return;
  if (!envoyer({ t: 'coup', n, k })) {
    // perdu en route : le relais renverra son état à la reconnexion, qui fait foi
    reessayer();
  }
}

// ---------- créer, rejoindre, quitter ----------
async function creerLigne() {
  const b = $('jouer');
  b.disabled = true;
  try {
    const r = await fetch(RELAIS + '/salles', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ circuit: TRACKS[ti].id }) });
    if (!r.ok) throw new Error(r.status);
    const o = await r.json();
    entrerLigne(o.code, o.jeton);
    montrerSalle();
  } catch (e) {
    toastAccueil("Pas de réseau : la course en ligne a besoin d'Internet.");
  } finally { b.disabled = false; }
}
function entrerLigne(code, jeton) {
  ligne.actif = true; ligne.code = code; ligne.jeton = jeton || null;
  ligne.manche = 0; ligne.lancee = false; ligne.presents = [false, false];
  mode = 'ligne';
  rangerLigne();
  connecter();
}
function finLigne(message) {
  ligne.actif = false;
  clearTimeout(ligne.minuteur);
  const ws = ligne.ws; ligne.ws = null;
  if (ws) { try { ws.close(); } catch (e) { } }
  oublierLigne();
  $('salle').hidden = true;
  if (mode === 'ligne') mode = 'duo';
  R = null;          // sinon versAccueil rangerait la course en ligne comme une course locale
  versAccueil();
  if (message) toastAccueil(message);
}

// la salle d'attente : le lien, le QR code, et l'autre qui arrive
function montrerSalle() {
  $('salleCircuit').textContent = TRACKS[ti].nom;
  $('salleCode').textContent = ligne.code;
  const url = lienSalle(ligne.code);
  $('salleLien').textContent = url.replace(/^https?:\/\//, '');
  try {
    const q = qrcode(0, 'M'); q.addData(url); q.make();
    $('salleQr').innerHTML = q.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
  } catch (e) { $('salleQr').textContent = ''; }
  $('salle').hidden = false;
  majLigne();
  $('inviter').focus();
}
$('inviter').addEventListener('click', async () => {
  const url = lienSalle(ligne.code);
  const texte = `On fait une course à Paper Race ? ${TRACKS[ti].nom}, touche le lien :`;
  if (navigator.share) {
    try { await navigator.share({ title: 'Paper Race', text: texte, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(url); toast('Lien copié : colle-le dans un message'); $('salleEtat').textContent = 'Lien copié : colle-le dans un message.'; }
  catch (e) { $('salleEtat').textContent = url; }
});
$('salleQuitter').addEventListener('click', () => finLigne());
$('quitterLigne').addEventListener('click', () => { fermer(); finLigne(); });

// ce que l'écran dit de la connexion
function majLigne() {
  if (!ligne.actif) { $('quitterLigne').hidden = true; return; }
  $('quitterLigne').hidden = false;
  const autre = 1 - ligne.siege;
  $('salleEtat').textContent = !ligne.connecte ? 'Connexion au relais…'
    : ligne.presents[autre] ? 'Il est là ! La course commence.' : "En attente de l'autre joueur…";
  if (R && $('game').style.display === 'flex') {
    $('parline').textContent = 'par ' + TRACKS[ti].par + (ligne.connecte ? ' · en ligne' : ' · reconnexion…');
    renderInfo(); renderBars();
  }
}

// ---------- au démarrage : un lien d'invitation, ou une course en cours ----------
function demarrageLigne() {
  const h = location.hash.match(/salle=([A-Z2-9]{4})/);
  const garde = lireLigne();
  if (h) {
    history.replaceState(null, '', location.pathname + location.search);
    const code = h[1];
    entrerLigne(code, garde && garde.code === code ? garde.jeton : null);
    return true;
  }
  if (garde) { entrerLigne(garde.code, garde.jeton); return true; }
  return false;
}

// ⚠️ ici et pas dans l'init de ui.js : ui.js s'exécute AVANT ce fichier, et y
// appeler demarrageLigne() échouait (« not defined ») : aucun lien d'invitation
// n'était jamais lu.
if (demarrageLigne()) montrerSalle();
