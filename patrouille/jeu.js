// La Patrouille des Étoiles : relie le moteur (pur), l'écran, la carte et la sauvegarde.
import { W, H, FPS, SEC } from './moteur/constantes.js';
import { creePartie, pasPartie } from './moteur/partie.js';
import { appliquerBilan, CHEMINS } from './moteur/progression.js';
import { ARMES } from './moteur/tirs.js';
import { MISSIONS, MISSIONS_EXISTANTES } from './contenu/missions.js';
import { PLANETES } from './contenu/planetes.js';
import { dessinerPartie } from './ecran/rendu.js';
import { dessinerInterface } from './ecran/interface.js';
import { remplirCarte } from './ecran/carte.js';
import { brancherDoigt } from './ecran/commandes.js';
import { lire, ecrire, effacer } from './sauvegarde.js';

const $ = (id) => document.getElementById(id);
const toile = /** @type {HTMLCanvasElement} */ ($('toile')), ctx = toile.getContext('2d');
let echelle = 1;
let sauvegarde = lire();
let partie = null, enPause = false, message = null, demandeSuper = false;
const opt = { invincible: false, zones: false, vite: false };
const doigt = brancherDoigt(toile, { echelle: () => echelle });

const ECRANS = ['carte', 'pause', 'mort', 'bilan'];
function montrer(id) {
  for (const e of ECRANS) $(e).hidden = e !== id;
  $('b-pause').hidden = id !== null;
  $('b-super').hidden = id !== null;
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
  const ordre = CHEMINS[MISSIONS[id].planete];
  const n = ordre[ordre.indexOf(id) + 1];
  return n && MISSIONS_EXISTANTES.includes(n) ? n : null;
}

function finir() {
  const b = partie.bilan, M = partie.mission;
  sauvegarde = appliquerBilan(sauvegarde, b);
  ecrire(sauvegarde);
  const total = Object.keys(M.cages).length;
  const lignes = [
    `<div>Cristaux ramassés : <b>${b.cristaux}</b></div>`,
    `<div>Astronautes délivrés : <span class="points">${'●'.repeat(b.cages.length)}${'○'.repeat(total - b.cages.length)}</span> ${b.cages.length} sur ${total}</div>`,
  ];
  if (b.nouvellesArmes.length) lignes.push(`<div class="bon">Nouvelle arme : ${b.nouvellesArmes.map((a) => ARMES[a].nom).join(', ')}</div>`);
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
$('m-recommencer').onclick = () => lancer(partie.mission.id);
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

// Crochets de test (bancs Playwright)
/** @type {any} */ (window).__patrouille = { get partie() { return partie; }, get sauvegarde() { return sauvegarde; }, lancer, opt, pasJeu, PLANETES };
