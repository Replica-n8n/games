// Star Patrol : relie le moteur (pur), l'écran, la carte et la sauvegarde.
import { W, H, FPS, SEC } from './moteur/constantes.js';
import { creePartie, pasPartie, repartirDuDrapeau } from './moteur/partie.js';
import { appliquerBilan, CHEMINS, prochaine, PRIX_HANGAR } from './moteur/progression.js';
import { ARMES } from './moteur/tirs.js';
import { MISSIONS, MISSIONS_EXISTANTES } from './contenu/missions.js';
import { PLANETES } from './contenu/planetes.js';
import { dessinerPartie } from './ecran/rendu.js';
import { dessinerInterface } from './ecran/interface.js';
import { remplirCarte } from './ecran/carte.js';
import { remplirHangar } from './ecran/hangar.js';
import { brancherDoigt } from './ecran/commandes.js';
import { lire, ecrire, effacer } from './sauvegarde.js';

const $ = (id) => document.getElementById(id);
const toile = /** @type {HTMLCanvasElement} */ ($('toile')), ctx = toile.getContext('2d');
let echelle = 1;
let sauvegarde = lire();
let partie = null, enPause = false, message = null, demandeSuper = false;
const opt = { invincible: false, zones: false, vite: false };
const doigt = brancherDoigt(toile, { echelle: () => echelle });

const ECRANS = ['carte', 'hangar', 'pause', 'mort', 'bilan'];
/** L'écran d'où l'on est venu au Hangar : on y revient (carte, bilan ou fin de partie ratée). */
let retourHangar = 'carte';
const moduleActuel = () => PLANETES[MISSIONS[partie?.mission.id ?? prochaine(sauvegarde, MISSIONS_EXISTANTES)].planete].module;
/** Le Hangar s'ouvre entre deux missions ; ses boutons portent une pastille quand un achat est possible. */
function majBoutonsHangar() {
  const h = sauvegarde.hangar[moduleActuel()];
  const possible = Object.keys(PRIX_HANGAR).some((k) => h[k] < 3 && sauvegarde.cristaux >= PRIX_HANGAR[k][h[k]]);
  for (const id of ['b-hangar', 'g-hangar', 'm-hangar']) {
    $(id).classList.toggle('achat', possible);
    $(id).setAttribute('aria-label', possible ? 'Hangar, une amélioration est à ta portée' : 'Hangar');
  }
}
function montrer(id) {
  for (const e of ECRANS) $(e).hidden = e !== id;
  $('b-pause').hidden = id !== null;
  $('b-super').hidden = id !== null;
  if (id === 'hangar') {
    remplirHangar({ liste: $('h-liste'), resume: $('h-resume') }, sauvegarde, moduleActuel(), (s) => { sauvegarde = s; ecrire(s); montrer('hangar'); });
    $('h-retour').textContent = { carte: 'Retour à la carte', bilan: 'Retour au bilan', mort: 'Retour' }[retourHangar];
  }
  if (id && id !== 'hangar') majBoutonsHangar();
  if (id === 'mort') {
    const drapeau = !!partie?.auDrapeau;
    $('m-texte').textContent = drapeau
      ? 'Tu repars du drapeau, juste avant le boss, cœurs remplis.'
      : 'La mission est courte : on la recommence. Les astronautes délivrés retournent dans leurs bulles.';
    $('m-recommencer').textContent = drapeau ? 'Repartir du drapeau' : 'Recommencer la mission';
    // Au drapeau la partie continue avec le module qu'elle a : un achat ne compterait pas tout de suite
    $('m-hangar').hidden = drapeau;
  }
  if (id === 'carte') remplirCarte({ planetes: $('planetes'), resume: $('c-resume'), continuer: /** @type {HTMLButtonElement} */ ($('b-continuer')) }, sauvegarde, lancer);
}

function lancer(id) {
  partie = creePartie({ mission: MISSIONS[id], graine: (Date.now() % 100000) + 1, sauvegarde, options: { invincible: opt.invincible } });
  enPause = false; message = null; demandeSuper = false;
  doigt.relacher();
  majSuper();
  montrer(null);
}

function majSuper() {
  const b = $('b-super');
  const pret = partie && partie.jauge >= 100;
  b.classList.toggle('pret', !!pret);
  b.textContent = pret ? 'SUPER' : `${Math.floor(partie?.jauge ?? 0)} %`;
}

function suivante(id) {
  const ordre = CHEMINS[MISSIONS[id].planete], i = ordre.indexOf(id);
  if (i < 0) return null; // la mission secrète n'est pas sur le chemin : retour à la carte
  const n = ordre[i + 1];
  return n && MISSIONS_EXISTANTES.includes(n) ? n : null;
}

function finir() {
  const b = partie.bilan, M = partie.mission;
  const secretAvant = b.ouvreSecret ? sauvegarde.secrets[b.ouvreSecret] : true;
  sauvegarde = appliquerBilan(sauvegarde, b);
  const secretOuvert = !secretAvant && sauvegarde.secrets[b.ouvreSecret];
  ecrire(sauvegarde);
  const total = Object.keys(M.cages).length;
  const lignes = [
    `<div>Cristaux ramassés : <b>${b.cristaux}</b></div>`,
    `<div>Astronautes délivrés : <span class="points">${'●'.repeat(b.cages.length)}${'○'.repeat(total - b.cages.length)}</span> ${b.cages.length} sur ${total}</div>`,
  ];
  if (b.nouvellesArmes.length) lignes.push(`<div class="bon">Nouvelle arme : ${b.nouvellesArmes.map((a) => ARMES[a].nom).join(', ')}</div>`);
  if (b.avecCopain) lignes.push(b.copainSauve ? '<div class="bon">Copain sauvé</div>' : "<div>Le copain n'a pas été sauvé : rejoue pour l'aider</div>");
  if (secretOuvert) lignes.push("<div class=\"bon\">Un chemin secret s'est ouvert sur la carte !</div>");
  lignes.push(`<div style="color:var(--doux);font-size:14px">Coups encaissés : ${b.coups} · ${Math.round(b.duree / SEC)} s</div>`);
  $('bilan-liste').innerHTML = lignes.join('');
  const n = suivante(M.id);
  $('g-suite').hidden = !n;
  if (n) { $('g-suite').textContent = `Mission suivante : ${MISSIONS[n].nom}`; $('g-suite').onclick = () => lancer(n); }
  partie = null;
  montrer('bilan');
}

function pasJeu() {
  if (!partie || enPause || partie.etat !== 'jeu') return;
  const entree = doigt.lire(partie.M.bas);
  entree.super = demandeSuper; demandeSuper = false;
  pasPartie(partie, entree);
  for (const ev of partie.evenements.splice(0)) {
    if (ev.type === 'message') message = { texte: ev.texte, reste: ev.duree };
    if (ev.type === 'vibre' && navigator.vibrate) try { navigator.vibrate(80); } catch { /* refusé */ }
  }
  if (message && --message.reste <= 0) message = null;
  if (partie.etat === 'mort') montrer('mort');
  if (partie.etat === 'fini') finir();
}

// Boucle à pas fixe : le jeu avance à 60 images par seconde quelle que soit la fréquence de l'écran
let avant = performance.now(), reste = 0;
function boucle(maintenant) {
  requestAnimationFrame(boucle);
  reste += Math.min(100, maintenant - avant); avant = maintenant;
  while (reste >= 1000 / FPS) { pasJeu(); if (opt.vite) pasJeu(); reste -= 1000 / FPS; }
  ctx.setTransform(echelle * devicePixelRatio, 0, 0, echelle * devicePixelRatio, 0, 0);
  if (partie) {
    dessinerPartie(ctx, partie, { zones: opt.zones });
    dessinerInterface(ctx, partie, message);
    majSuper();
  } else {
    ctx.fillStyle = '#0a0f2e'; ctx.fillRect(0, 0, W, H);
  }
}
requestAnimationFrame(boucle);

// Boutons et écrans
$('b-pause').onclick = () => { enPause = true; montrer('pause'); };
$('p-reprendre').onclick = () => { enPause = false; doigt.relacher(); montrer(null); };
$('p-carte').onclick = () => { partie = null; montrer('carte'); };
$('m-recommencer').onclick = () => {
  if (partie?.auDrapeau) { repartirDuDrapeau(partie); doigt.relacher(); message = null; montrer(null); }
  else lancer(partie.mission.id);
};
const ouvrirHangar = (depuis) => { retourHangar = depuis; montrer('hangar'); };
$('b-hangar').onclick = () => ouvrirHangar('carte');
$('g-hangar').onclick = () => ouvrirHangar('bilan');
$('m-hangar').onclick = () => ouvrirHangar('mort');
$('h-retour').onclick = () => montrer(retourHangar);
$('m-carte').onclick = () => { partie = null; montrer('carte'); };
$('g-carte').onclick = () => montrer('carte');
$('b-super').onclick = () => { demandeSuper = true; };
for (const k of ['invincible', 'zones', 'vite']) $('o-' + k).addEventListener('change', (e) => { opt[k] = /** @type {HTMLInputElement} */ (e.target).checked; });
let confirmer = false;
$('o-effacer').onclick = () => {
  if (!confirmer) { confirmer = true; $('o-effacer').textContent = 'Toucher encore pour tout effacer'; return; }
  confirmer = false; $('o-effacer').textContent = 'Effacer la sauvegarde';
  effacer(); sauvegarde = lire(); montrer('carte');
};
// L'app passe en arrière-plan : pause automatique
document.addEventListener('visibilitychange', () => { if (document.hidden && partie && partie.etat === 'jeu') { enPause = true; montrer('pause'); } });
// Pas de zoom de page dans un jeu tactile (double appui sur iPhone)
document.addEventListener('dblclick', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());

function redim() {
  const r = $('cadre').getBoundingClientRect();
  echelle = Math.min(r.width / W, r.height / H);
  const w = Math.floor(W * echelle), h = Math.floor(H * echelle);
  $('jeu').style.width = w + 'px'; $('jeu').style.height = h + 'px';
  toile.style.width = w + 'px'; toile.style.height = h + 'px';
  toile.width = Math.floor(w * devicePixelRatio); toile.height = Math.floor(h * devicePixelRatio);
}
addEventListener('resize', redim);
redim();
montrer('carte');

// ---------- Service worker : hors ligne et mises à jour ----------
// Un rechargement ne redemande pas sw.js : il faut update(), à l'ouverture et à chaque
// retour sur l'onglet. Une nouvelle version ne recharge JAMAIS la page d'elle-même (on
// pourrait être en pleine mission) : un bandeau sur la carte propose de recharger.
if ('serviceWorker' in navigator) {
  const avait = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (avait) $('maj').hidden = false; });
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    const maj = () => { reg.update().catch(() => {}); };
    maj();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) maj(); });
  }).catch(() => {});
  navigator.serviceWorker.ready.then((reg) => {
    if (!reg.active) return;
    const canal = new MessageChannel();
    canal.port1.onmessage = (e) => { $('version').textContent = `Version ${String(e.data).replace('patrouille-', '')}`; };
    reg.active.postMessage('version', [canal.port2]);
  }).catch(() => {});
}
$('recharger').addEventListener('click', () => location.reload());

// ---------- Installer : un bouton sur la carte tant que le jeu n'est pas installé ----------
// Chrome donne son invitation (beforeinstallprompt) ; sans elle (iPhone, ou invitation
// déjà refusée), le bouton dit où se trouve la commande.
/** @type {any} */
let invitation = null;
const installe = () => matchMedia('(display-mode: standalone)').matches || /** @type {any} */ (navigator).standalone === true;
const majInstaller = () => { $('installer').hidden = installe(); if (installe()) $('aide-installer').hidden = true; };
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); invitation = e; majInstaller(); });
addEventListener('appinstalled', () => { invitation = null; majInstaller(); });
$('installer').addEventListener('click', () => {
  if (invitation) { const i = invitation; invitation = null; i.prompt(); i.userChoice?.then(majInstaller, majInstaller); return; }
  $('aide-installer').textContent = /iPhone|iPad|iPod/.test(navigator.userAgent)
    ? 'Sur iPhone : touche Partager, puis « Sur l\u2019écran d\u2019accueil ».'
    : 'Ouvre le menu du navigateur, puis « Installer l\u2019application » ou « Ajouter à l\u2019écran d\u2019accueil ».';
  $('aide-installer').hidden = !$('aide-installer').hidden;
});
majInstaller();

// Crochets de test (bancs Playwright)
/** @type {any} */ (window).__patrouille = { get partie() { return partie; }, get sauvegarde() { return sauvegarde; }, lancer, opt, pasJeu, montrer, PLANETES };
