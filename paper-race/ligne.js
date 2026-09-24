// ===== Paper Race : la course EN LIGNE, de 2 à 6 téléphones =====
// Chargé après ui.js, dont il partage les noms globaux.
//
// Un relais (serveur-paper-race/, Cloudflare) garde la liste des coups et vérifie
// qui a le droit de jouer quelle voiture. Il ne connaît pas les règles : chaque
// téléphone rejoue les coups avec moteur.js, qui ne laisse aucune place au hasard.
//
// Deux sortes de salles :
// - pr-2 (v9) : 2 à 6 places, règles « grille » (grille tirée au sort par l'hôte,
//   ordre qui tourne, aspiration, photo-finish), pièges en option. Un coup est
//   { v : la voiture, k : 0-8 le pavé, 9 coincé, 10 abandon }. Le relais ne sait
//   pas à qui c'est le tour : un coup hors tour est ignoré par TOUS les téléphones
//   de la même façon. Les places vides au départ roulent en fantômes, calculés
//   par le téléphone de l'hôte (siège 0) et envoyés comme des coups.
// - v7 : deux places, règles d'origine, un coup = un nombre (0-9). Une salle créée
//   avant la mise à jour se joue encore ainsi jusqu'au bout.
//
// ⚠️ C'est le SEUL endroit du jeu qui parle au réseau, et seulement pendant une
// course en ligne. Seul, à deux sur un téléphone, le championnat : hors ligne.
// Rien sur les joueurs : ni nom, ni compte, ni discussion. On rejoint par un
// lien ou un QR code, jamais en tapant un code.
const LOCAL = /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
const RELAIS = LOCAL ? (new URLSearchParams(location.search).get('relais') || 'http://127.0.0.1:8787')
  : 'https://paper-race.jfrxdi0zz.workers.dev';
const CLE_LIGNE = 'paper-race.ligne.v1';
// un joueur parti depuis une minute : sa voiture s'arrête (réglable en local, pour les essais)
const ABSENCE = (LOCAL && +new URLSearchParams(location.search).get('absence')) || 60000;

ligne = {
  actif: false, code: null, jeton: null, siege: 0, connecte: false,
  presents: [false, false], manche: 1, ws: null, file: [], essais: 0, minuteur: null,
  lancee: false,          // la course a démarré (feux passés) pour cette manche
  v2: false, places: 2, pieges: true,
  depart: null,           // pr-2 : { grille, fantomes } envoyé par l'hôte
  humains: null,          // les places tenues par des joueurs à la manche d'avant
  traites: 0,             // coups du relais déjà appliqués (ou ignorés) ici
  absent: null,           // l'hôte surveille : { v, depuis }
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
const hote = () => ligne.siege === 0;

// ---------- la connexion ----------
function connecter() {
  clearTimeout(ligne.minuteur);
  if (!ligne.actif) return;
  let ws;
  // pr-4 : on donne la version de ses règles ; le relais refuse une salle d'une autre version
  const q = (ligne.jeton ? 'jeton=' + ligne.jeton + '&' : '') + 'regles=' + REGLES;
  try { ws = new WebSocket(RELAIS.replace(/^http/, 'ws') + `/salles/${ligne.code}/ws?` + q); }
  catch (e) { return reessayer(); }
  ligne.ws = ws;
  ws.onopen = () => { ligne.essais = 0; };
  ws.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } recevoir(m); };
  ws.onclose = (e) => {
    if (ligne.ws !== ws) return;
    ligne.connecte = false; majLigne();
    if (e.code === 4004 || e.code === 4010) return finLigne("Cette course n'existe plus.");
    if (e.code === 4009) return finLigne('Cette course est complète.');
    if (e.code === 4011) return finLigne('Cette course a déjà commencé.');
    // ⚠️ deux versions des règles ne jouent pas ensemble : les écrans divergeraient
    if (e.code === 4026) return finLigne(texteVersion(ligne.reglesSalle));
    reessayer();
  };
}
// deux versions des règles ne jouent pas ensemble : les écrans divergeraient
function texteVersion(regles) {
  return regles > REGLES ? "Ton jeu n'est pas à jour. Ferme-le et rouvre-le, puis rejoins une nouvelle course."
    : "Cette course vient d'une version plus ancienne du jeu. Fermez-le et rouvrez-le tous les deux, puis relancez une course.";
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
  // ⚠️ le refus arrive tout de suite, la fermeture parfois 10 s plus tard (mesuré en
  // local) : on n'attend pas la fermeture pour le dire
  if (m.t === 'erreur') { if (m.raison === 'version') { ligne.reglesSalle = m.regles; finLigne(texteVersion(m.regles)); } return; }
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
    ligne.v2 = Number.isInteger(m.places);
    ligne.places = ligne.v2 ? m.places : 2;
    ligne.pieges = m.pieges !== false;
    const ti2 = indexDe(m.circuit);
    if (ti2 < 0) return finLigne("Ce circuit n'existe pas dans cette version du jeu.");
    $('salleCircuit').textContent = TRACKS[ti2].nom;
    const departAvant = JSON.stringify(ligne.depart);
    if (ligne.v2) {
      if (m.revanche && ligne.depart) ligne.humains = seigesHumains();
      ligne.depart = m.depart || null;
    }
    // on rebâtit la course depuis les coups du relais : c'est lui qui fait foi
    const nouvelleManche = m.manche !== ligne.manche || !R || R.track.id !== m.circuit;
    const enRetard = !R || nouvelleManche || ligne.traites !== m.coups.length || JSON.stringify(ligne.depart) !== departAvant;
    ligne.manche = m.manche;
    if (enRetard) rebatir(ti2, m.coups);
    if (ligne.v2) ligne.lancee = !!ligne.depart && !m.revanche && (m.coups.length > 0 || ligne.lancee);
    else if (m.revanche || nouvelleManche) ligne.lancee = m.coups.length > 0;
    else if (m.coups.length > 0) ligne.lancee = true;
    // une course pr-2 déjà partie, retrouvée au retour : on reprend sans feux
    if (ligne.v2 && ligne.depart && !ligne.lancee && !m.revanche) ligne.lancee = true;
    if (ligne.lancee) $('salle').hidden = true;
    majLigne(); lancerSiPrets();
    if (ligne.lancee) relancerFantome();
    // pas encore parti (ou une revanche) : la salle d'attente, avec qui est là
    if (!ligne.lancee && (m.revanche || (ligne.v2 && !ligne.depart))) montrerSalle();
    return;
  }
  if (m.t === 'depart') {
    if (m.manche !== ligne.manche || !ligne.v2) return;
    ligne.depart = m.depart;
    rebatir(ti, []);
    lancer();
    return;
  }
  if (m.t === 'coup') {
    if (m.manche !== ligne.manche) return;
    if (m.n < ligne.traites + ligne.file.length) return;     // notre propre coup, déjà joué ici
    // un numéro en avance : il nous manque un coup. On repart de l'état du
    // relais, qui fait foi, plutôt que de jouer les coups dans le désordre.
    if (m.n > ligne.traites + ligne.file.length) return reprendreLeFil();
    ligne.file.push({ k: m.k, v: m.v });
    avancerFile();
  }
}

// Il nous manque un coup : on se reconnecte, et l'état du relais nous remet
// d'aplomb (rebatir rejoue tout depuis le début de la manche).
function reprendreLeFil() {
  ligne.file = [];
  const ws = ligne.ws; ligne.ws = null;
  if (ws) { try { ws.close(); } catch (e) { } }
  ligne.connecte = false; majLigne();
  connecter();
}

// la course telle que le relais la décrit : v7 (classique à deux) ou grille
function nouvelleCourseLigne(k) {
  if (!ligne.v2) return newRace(k, 1, 'premier');
  const n = ligne.places, grille = ligne.depart ? ligne.depart.grille : [...Array(n).keys()];
  return newRace(k, 1, 'tour', { n, regles: 'grille', grille, pieges: ligne.pieges });
}
// un coup du relais, sans animation. Rend false s'il est ignoré (hors tour).
function appliquer(c) {
  if (!ligne.v2) {
    if (finie(R)) return false;
    if (c === 9) stuck(R);
    else { const o = choices(R)[c]; if (!o || !o.ok) return false; play(R, o.p); }
    nextTurn(R);
    return true;
  }
  if (!c || finie(R)) return false;
  if (c.k === 10) { abandon(R, c.v); return true; }
  if (R.turn !== c.v) return false;
  if (c.k === 9) stuck(R);
  else { const o = choices(R)[c.k]; if (!o || !o.ok) return false; play(R, o.p); }
  nextTurn(R);
  return true;
}

// rejoue la course coup par coup, sans animation
function rebatir(k, coups) {
  remiseAZero();
  mode = 'ligne'; ti = k;
  R = nouvelleCourseLigne(ti);
  for (const c of coups) appliquer(c);
  ligne.traites = coups.length;
  ligne.file = [];
  precedent = null;
  caps.fill(-Math.PI / 2); capsAvant.fill(null);
  // la salle d'attente reste tant que la course n'a pas commencé
  if (coups.length) $('salle').hidden = true;
  newOpts(); montrerJeu(); layout(); refresh();
  if (finie(R)) setTimeout(() => lancerReplay(() => drapeau(showWin)), 300);
}

// les places tenues par des joueurs (pas des fantômes)
function seigesHumains() {
  const f = ligne.depart ? ligne.depart.fantomes : [];
  return [...Array(ligne.places).keys()].filter(i => !f.includes(i));
}

// tout le monde est là, la course n'a pas commencé : on part
function lancerSiPrets() {
  if (!ligne.actif || ligne.lancee || !R) return;
  if (ligne.v2) {
    // pr-2 : c'est l'hôte qui lance, quand toutes les places (ou tous les joueurs
    // de la manche d'avant, pour une revanche) sont là ; sinon il appuie sur « Démarrer »
    if (!hote() || ligne.depart || !ligne.connecte) return;
    const attendus = ligne.humains || [...Array(ligne.places).keys()];
    if (attendus.every(i => ligne.presents[i])) envoyerDepart();
    return;
  }
  if (ligne.traites > 0) return;
  if (!ligne.presents[0] || !ligne.presents[1]) return;
  lancer();
}
function envoyerDepart() {
  envoyer({ t: 'depart', manche: ligne.manche, grille: tirage(ligne.places) });
}
// les feux, sur chaque téléphone
function lancer() {
  ligne.lancee = true;
  $('salle').hidden = true;
  montrerJeu(); layout(); refresh();
  audio();
  const j = jeton;
  feuxDepart(() => { if (j !== jeton) return; refresh(); relancerFantome(); });
}
// l'hôte fait jouer le fantôme dont c'est le tour (après un retour, un départ…)
function relancerFantome() {
  if (!ligne.actif || !ligne.v2 || !hote() || !R || finie(R) || !estFantome(R.turn) || aiBusy || anim || depart) return;
  const j = jeton;
  setTimeout(() => { if (j === jeton && !aiBusy && !anim && R && !finie(R) && estFantome(R.turn)) aiTurn(); }, 300);
}

// le coup d'un autre téléphone : on le joue comme s'il avait touché le pavé
function avancerFile() {
  if (!ligne.file.length || !R || finie(R)) return;
  if (anim || replay || rejeu || depart || aiBusy || coupEnCours) { setTimeout(avancerFile, 120); return; }
  const c = ligne.file.shift();
  ligne.traites++;
  ligne.distant = true;
  if (!ligne.v2) {
    if (c.k === 9) forceArret();
    else if (opts[c.k] && opts[c.k].ok) { selected = c.k; commit(c.k); }
  } else if (c.k === 10) {
    quitte(c.v);
  } else if (R.turn === c.v) {
    if (c.k === 9) forceArret();
    else if (opts[c.k] && opts[c.k].ok) { selected = c.k; commit(c.k); }
  }
  ligne.distant = false;
  setTimeout(avancerFile, 60);
}

// appelé par commit / forceArret pour un coup joué SUR CE téléphone (le joueur,
// ou un fantôme chez l'hôte)
function coupLocal(k, v) {
  if (!ligne.actif || ligne.distant) return;
  const n = ligne.traites++;
  const ok = envoyer(ligne.v2 ? { t: 'coup', n, k, v } : { t: 'coup', n, k });
  // perdu en route : le relais renverra son état à la reconnexion, qui fait foi
  if (!ok) reessayer();
}

// une voiture quitte la course : elle s'arrête là où elle est et reste un obstacle
function quitte(v) {
  if (!R || finie(R)) return;
  abandon(R, v);
  toast(`${NOMS[v]} a quitté la course : sa voiture reste sur la piste`);
  if (finie(R)) { conclure(); renderInfo(); const j = jeton; setTimeout(() => { if (j === jeton) lancerReplay(() => drapeau(showWin)); }, 280); return; }
  newOpts(); refresh();
  relancerFantome();
}

// L'hôte surveille les absents : c'est le tour d'un joueur parti depuis une
// minute, sa voiture s'arrête (sinon toute la course l'attendrait pour toujours).
setInterval(() => {
  if (!ligne.actif || !ligne.v2 || !hote() || !ligne.lancee || !ligne.connecte || !R || finie(R) || anim || aiBusy || coupEnCours || ligne.file.length) { ligne.absent = null; return; }
  const v = R.turn;
  if (v === ligne.siege || estFantome(v) || ligne.presents[v]) { ligne.absent = null; return; }
  if (!ligne.absent || ligne.absent.v !== v) { ligne.absent = { v, depuis: Date.now() }; return; }
  if (Date.now() - ligne.absent.depuis < ABSENCE) return;
  ligne.absent = null;
  coupLocal(10, v);
  quitte(v);
}, 1000);

// ---------- créer, rejoindre, quitter ----------
async function creerLigne() {
  const b = $('jouer');
  b.disabled = true;
  try {
    if (!circuitPermis(ti)) ti = grandsCircuits()[0];
    const r = await fetch(RELAIS + '/salles', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ circuit: TRACKS[ti].id, places: nbLigne, pieges: piegesOn, regles: REGLES }) });
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
  ligne.depart = null; ligne.humains = null; ligne.traites = 0; ligne.file = []; ligne.absent = null;
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
  ligne.depart = null;
  $('salle').hidden = true;
  if (mode === 'ligne') mode = 'duo';
  R = null;          // sinon versAccueil rangerait la course en ligne comme une course locale
  versAccueil();
  if (message) toastAccueil(message);
}

// la salle d'attente : le lien, le QR code, qui est là, et le départ
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
  $(hote() && ligne.v2 ? 'demarrer' : 'inviter').focus();
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
$('demarrer').addEventListener('click', () => { if (ligne.v2 && hote() && !ligne.depart) envoyerDepart(); });
$('salleQuitter').addEventListener('click', () => finLigne());
$('quitterLigne').addEventListener('click', () => { fermer(); finLigne(); });

// ce qu'on attend, dit sur le bouton « Tracer » (ui.js l'appelle)
function texteAttenteLigne() {
  if (!ligne.connecte) return 'Reconnexion…';
  if (!ligne.lancee) return ligne.v2 ? 'En attente du départ…' : "En attente de l'autre joueur…";
  const v = R.turn;
  if (estFantome(v)) return hote() ? `${NOMS[v]} (fantôme) joue…` : `${NOMS[v]} (fantôme) joue chez l'hôte…`;
  if (!ligne.presents[v]) return `${NOMS[v]} s'est absenté…`;
  return `Au tour de ${NOMS[v]}…` + (avance !== null ? ' · ton coup est prêt' : '');
}

// ce que l'écran dit de la connexion
function majLigne() {
  if (!ligne.actif) { $('quitterLigne').hidden = true; return; }
  $('quitterLigne').hidden = false;
  const plusieurs = ligne.v2 && ligne.places > 2;
  $('salleLoin').textContent = plusieurs ? 'Les autres joueurs sont loin' : "L'autre joueur est loin";
  $('salleProche').textContent = plusieurs ? 'Ils sont à côté de toi' : 'Il est à côté de toi';
  $('salleScan').textContent = plusieurs ? "Chacun scanne ce code avec l'appareil photo de son téléphone." : "Il scanne ce code avec l'appareil photo de son téléphone.";
  if (ligne.v2) {
    const f = ligne.depart ? ligne.depart.fantomes : [];
    const la = ligne.presents.filter(Boolean).length;
    $('sallePlaces').hidden = false;
    $('sallePlaces').innerHTML = [...Array(ligne.places).keys()].map(i => {
      const etat = i === ligne.siege ? "c'est toi" : f.includes(i) ? 'fantôme' : ligne.presents[i] ? 'est là' : 'place libre';
      return `<li class="${ligne.presents[i] || i === ligne.siege ? '' : 'vide'}"><span class="rond" style="background:${COUL[i]}" aria-hidden="true">${i + 1}</span><span>${NOMS[i]} <i>${etat}</i></span></li>`;
    }).join('');
    const libre = ligne.presents.some(p => !p);
    // à deux, on part quand l'autre arrive, comme avant : pas de bouton
    const bouton = hote() && !ligne.depart && ligne.places > 2;
    $('demarrer').hidden = !bouton;
    $('demarrer').textContent = libre ? 'Démarrer maintenant' : 'Démarrer';
    $('demarrerAide').hidden = !bouton || !libre;
    $('salleEtat').textContent = !ligne.connecte ? 'Connexion au relais…'
      : ligne.places === 2 ? (la === 2 ? 'Il est là ! La course commence.' : "En attente de l'autre joueur…")
      : hote() ? `${la} joueur${la > 1 ? 's' : ''} sur ${ligne.places}, en attente des autres : envoie le lien, ou démarre quand tu veux.`
        : `${la} joueur${la > 1 ? 's' : ''} sur ${ligne.places} : le créateur de la course lance le départ.`;
  } else {
    $('sallePlaces').hidden = true; $('demarrer').hidden = true; $('demarrerAide').hidden = true;
    const autre = 1 - ligne.siege;
    $('salleEtat').textContent = !ligne.connecte ? 'Connexion au relais…'
      : ligne.presents[autre] ? 'Il est là ! La course commence.' : "En attente de l'autre joueur…";
  }
  if (R && $('game').style.display === 'flex') {
    $('parline').textContent = 'par ' + parCourse() + (ligne.connecte ? ' · en ligne' : ' · reconnexion…');
    renderInfo(); renderBars(); renderPad();
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
