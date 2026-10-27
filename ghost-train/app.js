// Ghost Train : relie le moteur (pur), l'écran, les commandes, le son et la sauvegarde.
// Écrans : titre, manoir, jeu, pause, defaite, bilan, reglages. La toile fait 320 x 180
// et s'agrandit sans lissage ; les boutons sont de vrais boutons HTML posés sur elle.
import { W, H, DT, FPS } from './moteur/constantes.js';
import { creePartie, pasPartie } from './moteur/partie.js';
import { appliquerBilan, ouverte } from './moteur/progression.js';
import { MISSIONS, MISSIONS_EXISTANTES } from './contenu/missions.js';
import { creeVue, recevoir, avancerVue, dessinerPartie, peindreSalles } from './ecran/scene.js';
import * as menus from './ecran/menus.js';
import { brancherEntrees } from './entrees.js';
import * as son from './son.js';
import { lire, ecrire as sauver, lireReglages, ecrireReglages } from './sauvegarde.js';

const $ = (id) => document.getElementById(id);
const toile = /** @type {HTMLCanvasElement} */ ($('toile'));
const ctx = toile.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;
const cadre = $('cadre'), zonesEl = $('zones'), bPause = $('b-pause');

let sauvegarde = lire();
let reglages = lireReglages();
son.volumes(reglages);
let ecran = 'titre', partie = null, vue = null, missionId = 'rdc', dernierBilan = null, t = 0, avantReglages = 'titre';
let choisie = menus.proposee(sauvegarde);
let version = '', nouvelle = false, aideInstaller = '';
/** Les bancs peuvent jouer à la place des commandes. @type {((p: any) => any) | null} */
let pilote = null;
/** Les bancs figent la boucle pour avancer la partie pas à pas eux-mêmes. */
let fige = false;

const entrees = brancherEntrees(toile, {
  actif: () => ecran === 'jeu',
  pause: () => { if (ecran === 'jeu') mettrePause(); else if (ecran === 'pause') reprendre(); },
});
const tactile = () => entrees.tactile || matchMedia('(pointer: coarse)').matches;
const portrait = () => innerHeight > innerWidth;

// ---------- Placement : la plus grande toile 16:9 qui tient, en pixels entiers au-delà de x3 ----------
function ajuster() {
  const cs = getComputedStyle($('scene'));
  const lw = innerWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const lh = innerHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  let s = Math.min(lw / W, lh / H);
  if (s >= 3) s = Math.floor(s);
  cadre.style.width = Math.floor(W * s) + 'px'; cadre.style.height = Math.floor(H * s) + 'px';
}
addEventListener('resize', () => { ajuster(); if (portrait() && ecran === 'jeu') mettrePause(); });
ajuster();

/** Pose un bouton HTML sur un rectangle en pixels de jeu. @param {HTMLElement} b */
function poser(b, x, y, w, h) {
  b.style.left = (x / W * 100) + '%'; b.style.top = (y / H * 100) + '%';
  b.style.width = (w / W * 100) + '%'; b.style.height = (h / H * 100) + '%';
}

// ---------- Les zones des écrans de menu deviennent des boutons ----------
let signature = '';
/** @param {menus.Zone[]} zones */
function majZones(zones) {
  const sig = JSON.stringify(zones);
  if (sig === signature) return;
  const avaitFocus = document.activeElement && zonesEl.contains(document.activeElement) ? /** @type {HTMLElement} */ (document.activeElement).dataset.id : null;
  signature = sig;
  zonesEl.replaceChildren(...zones.map((z) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'zone'; b.dataset.id = z.id; b.setAttribute('aria-label', z.label);
    if (z.presse !== undefined) b.setAttribute('aria-pressed', String(z.presse));
    poser(b, z.x, z.y, z.w, z.h);
    b.addEventListener('click', () => action(z.id));
    return b;
  }));
  if (avaitFocus) /** @type {HTMLElement} */ (zonesEl.querySelector(`[data-id="${avaitFocus}"]`))?.focus();
}

function montrer(nom) {
  ecran = nom;
  const jeu = nom === 'jeu';
  bPause.hidden = !jeu; zonesEl.hidden = jeu;
  poser(bPause, 298, 0, 22, 22);
  // une nouvelle version se cherche hors partie seulement
  if ((nom === 'titre' || nom === 'manoir') && navigator.serviceWorker) navigator.serviceWorker.getRegistration().then((r) => r && r.update()).catch(() => {});
}

// ---------- Une mission ----------
function lancer(id) {
  missionId = id;
  son.demarrer();
  partie = creePartie({ mission: MISSIONS[id], graine: (Date.now() % 100000) + 1, options: { marge: reglages.aide ? 6 : tactile() ? 3 : 1 } });
  vue = creeVue(reglages);
  peindreSalles(MISSIONS[id].salles);
  entrees.relacher();
  son.jouerMusique(true, MISSIONS[id].bpm, MISSIONS[id].musique); son.bruitage('depart');
  try { /** @type {any} */ (navigator).wakeLock?.request('screen').catch(() => {}); } catch { /* sans verrou d'écran */ }
  montrer('jeu');
}

function mettrePause() { if (ecran !== 'jeu') return; entrees.relacher(); son.rayon(false); son.silence(); montrer('pause'); }
function reprendre() { son.reprendre(); entrees.relacher(); montrer('jeu'); }
function quitter() { son.rayon(false); son.jouerMusique(false); son.reprendre(); partie = null; choisie = menus.proposee(sauvegarde); montrer('manoir'); }

function terminer() {
  const b = partie.bilan;
  sauvegarde = appliquerBilan(sauvegarde, b);
  sauver(sauvegarde);
  dernierBilan = b;
  choisie = menus.proposee(sauvegarde);
  son.rayon(false); son.jouerMusique(false);
  montrer(b.fini ? 'bilan' : 'defaite');
}

function reglage(id) {
  const [cle, sens] = id.split(':');
  if (sens) reglages[cle] = Math.max(0, Math.min(1, Math.round((reglages[cle] + (sens === '+' ? 0.2 : -0.2)) * 5) / 5));
  else reglages[cle] = !reglages[cle];
  ecrireReglages(reglages); son.demarrer(); son.volumes(reglages); son.bruitage('clic');
}

/** @type {any} */
let invitation = null;
const installe = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || /** @type {any} */ (navigator).standalone === true;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); invitation = e; });
addEventListener('appinstalled', () => { invitation = null; });

function action(id) {
  son.demarrer();
  if (id.startsWith('choisir:')) {
    const etage = id.split(':')[1];
    if (ouverte(sauvegarde, etage) && MISSIONS_EXISTANTES.includes(etage)) { choisie = etage; son.bruitage('clic'); }
    else son.bruitage('triste');
    return;
  }
  switch (id) {
    case 'jouer': son.bruitage('clic'); return montrer('manoir');
    case 'entrer': if (MISSIONS_EXISTANTES.includes(choisie) && ouverte(sauvegarde, choisie)) lancer(choisie); return;
    case 'reglages': son.bruitage('clic'); avantReglages = ecran; return montrer('reglages');
    case 'retour': son.bruitage('clic'); return montrer(avantReglages);
    case 'reprendre': return reprendre();
    case 'manoir': return quitter();
    case 'rejouer': return lancer(missionId);
    case 'recharger': return location.reload();
    case 'installer':
      if (invitation) { const i = invitation; invitation = null; i.prompt(); return; }
      aideInstaller = /iPhone|iPad|iPod/.test(navigator.userAgent)
        ? "SUR IPHONE : PARTAGER, PUIS « SUR L'ÉCRAN D'ACCUEIL »."
        : "MENU DU NAVIGATEUR, PUIS « INSTALLER L'APPLICATION ».";
      return;
  }
  if (ecran === 'reglages') reglage(id);
}
bPause.addEventListener('click', () => mettrePause());
document.addEventListener('visibilitychange', () => { if (document.hidden && ecran === 'jeu') mettrePause(); });

// ---------- Un pas de jeu ----------
function pasJeu() {
  if (ecran !== 'jeu' || !partie || portrait()) return;
  vue.tactile = tactile();
  pasPartie(partie, pilote ? pilote(partie) : entrees.lire());
  for (const ev of partie.evenements.splice(0)) {
    if (ev.type === 'son') son.bruitage(ev.nom);
    else recevoir(vue, ev);
    if (ev.type === 'pieces') son.bruitage('piece');
    if (ev.type === 'coup' && navigator.vibrate && !reglages.flashsReduits) try { navigator.vibrate(60); } catch { /* refusé */ }
  }
  avancerVue(vue, DT);
  son.rayon(partie.tire);
  if (partie.etat === 'mort' || partie.etat === 'fini') terminer();
}

function dessiner() {
  if (portrait()) { menus.tourner(ctx); majZones([]); return; }
  let zones = [];
  if (ecran === 'jeu' || ecran === 'pause') {
    dessinerPartie(ctx, partie, vue);
    if (ecran === 'pause') zones = menus.pause(ctx);
  } else if (ecran === 'titre') zones = menus.titre(ctx, sauvegarde, { installer: !installe(), t, aide: aideInstaller, nouvelle });
  else if (ecran === 'manoir') zones = menus.manoir(ctx, sauvegarde, { choisie, t });
  else if (ecran === 'reglages') zones = menus.reglages(ctx, reglages, version, sauvegarde);
  else if (ecran === 'defaite') zones = menus.defaite(ctx, dernierBilan, sauvegarde);
  else if (ecran === 'bilan') zones = menus.bilan(ctx, dernierBilan, sauvegarde);
  majZones(zones);
}

// Boucle à pas fixe : le jeu avance à 60 pas par seconde quel que soit l'écran
let avant = performance.now(), reste = 0;
function boucle(maintenant) {
  requestAnimationFrame(boucle);
  reste += Math.min(100, maintenant - avant); avant = maintenant;
  while (reste >= 1000 / FPS) { if (!fige) pasJeu(); t += DT; reste -= 1000 / FPS; }
  dessiner();
}
montrer('titre');
requestAnimationFrame(boucle);
// les salles du premier étage se peignent pendant qu'on regarde l'écran titre
setTimeout(() => peindreSalles(MISSIONS.rdc.salles), 300);

// ---------- Service : hors ligne, et une nouvelle version qui se propose sans couper une partie ----------
// ⚠️ Le service de l'arcade (racine du dépôt) peut contrôler la page au premier
// passage : on ne demande la version qu'à NOTRE service, et seul un changement de
// NOTRE service annonce une nouvelle version.
if ('serviceWorker' in navigator) {
  const notre = (sw) => !!sw && /\/ghost-train\/sw\.js/.test(sw.scriptURL);
  const avait = notre(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (avait && notre(navigator.serviceWorker.controller)) nouvelle = true; });
  const demander = (sw) => {
    const canal = new MessageChannel();
    canal.port1.onmessage = (e) => { version = `VERSION ${String(e.data).replace('ghost-train-', '')}`; };
    sw.postMessage('version', [canal.port2]);
  };
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    reg.update().catch(() => {});
    const sw = reg.active || reg.waiting || reg.installing;
    if (reg.active) demander(reg.active);
    else if (sw) sw.addEventListener('statechange', () => { if (sw.state === 'activated') demander(sw); });
  }).catch(() => {});
}
// Zoom bloqué : deux appuis rapides zoomaient toute la page sur iPhone
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gesturestart', (e) => e.preventDefault());

// Crochets de test (bancs Playwright)
/** @type {any} */ (window).__essais = {
  get partie() { return partie; }, get ecran() { return ecran; }, get version() { return version; }, get sauvegarde() { return sauvegarde; }, get reglages() { return reglages; },
  lancer, montrer, action, pasJeu,
  invincible() { if (partie) partie.options.invincible = true; },
  /** @param {((p: any) => any) | null} f */ piloter(f) { pilote = f; },
  /** @param {boolean} oui */ figer(oui) { fige = oui; },
};
