// Ghost Train : relie le moteur (pur), l'écran, les commandes, le son et la sauvegarde.
// Écrans : gare, jeu, pause, defaite, bilan, reglages. La toile fait 320 x 180 et
// s'agrandit sans lissage ; les boutons sont de vrais boutons HTML posés sur elle.
import { W, H, DT, FPS } from './moteur/constantes.js';
import { creePartie, pasPartie } from './moteur/partie.js';
import { appliquerBilan } from './moteur/progression.js';
import { MISSIONS } from './contenu/missions.js';
import { creeVue, recevoir, avancerVue, dessinerPartie } from './ecran/scene.js';
import * as menus from './ecran/menus.js';
import { ecrire } from './ecran/police.js';
import { brancherEntrees } from './entrees.js';
import * as son from './son.js';
import { lire, ecrire as sauver, lireReglages, ecrireReglages } from './sauvegarde.js';

const $ = (id) => document.getElementById(id);
const toile = /** @type {HTMLCanvasElement} */ ($('toile'));
const ctx = toile.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;
const cadre = $('cadre'), zonesEl = $('zones'), bTirer = $('b-tirer'), bPause = $('b-pause');

let sauvegarde = lire();
let reglages = lireReglages();
son.volumes(reglages);
let ecran = 'gare', partie = null, vue = null, missionId = 'hall', dernierBilan = null, image = 0;
let choisie = menus.proposee(sauvegarde);
let version = '', nouvelle = false, aideInstaller = '';
const TIRER = { x: 284, y: 138, r: 24 };
/** Les bancs peuvent jouer à la place des commandes. @type {((p: any) => any) | null} */
let pilote = null;
/** Les bancs figent la boucle pour avancer la partie pas à pas eux-mêmes. */
let fige = false;

const entrees = brancherEntrees(toile, bTirer, {
  gaucher: () => reglages.gaucher,
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
  bTirer.hidden = !jeu || !tactile(); bPause.hidden = !jeu;
  zonesEl.hidden = jeu;
  poser(bTirer, (reglages.gaucher ? W - TIRER.x : TIRER.x) - TIRER.r, TIRER.y - TIRER.r, TIRER.r * 2, TIRER.r * 2);
  poser(bPause, 294, 18, 24, 24);
  if (nom === 'gare' && navigator.serviceWorker) navigator.serviceWorker.getRegistration().then((r) => r && r.update()).catch(() => {});
}

// ---------- Une mission ----------
function lancer(id) {
  missionId = id;
  son.demarrer();
  const aide = reglages.aide, doigt = tactile();
  partie = creePartie({
    mission: MISSIONS[id], graine: (Date.now() % 100000) + 1, sauvegarde,
    options: { marge: aide ? 9 : doigt ? 6 : 3, verrou: aide ? 24 : doigt ? 20 : 14, balance: !reglages.flashsReduits },
  });
  vue = creeVue(reglages);
  entrees.relacher(); entrees.centrer();
  son.jouerMusique(true, MISSIONS[id].bpm); son.bruitage('depart');
  try { /** @type {any} */ (navigator).wakeLock?.request('screen').catch(() => {}); } catch { /* sans verrou d'écran */ }
  montrer('jeu');
}

function mettrePause() { if (ecran !== 'jeu') return; entrees.relacher(); son.rayon(false); son.silence(); montrer('pause'); }
function reprendre() { son.reprendre(); entrees.relacher(); montrer('jeu'); }
function quitter() { son.rayon(false); son.jouerMusique(false); son.reprendre(); partie = null; montrer('gare'); }

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
const installe = () => matchMedia('(display-mode: standalone)').matches || /** @type {any} */ (navigator).standalone === true;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); invitation = e; });
addEventListener('appinstalled', () => { invitation = null; });

function action(id) {
  son.demarrer();
  if (id.startsWith('partir:')) return lancer(id.slice(7));
  if (id.startsWith('choisir:')) { choisie = id.slice(8); son.bruitage('clic'); return; }
  switch (id) {
    case 'reglages': son.bruitage('clic'); return montrer('reglages');
    case 'retour': son.bruitage('clic'); return montrer('gare');
    case 'reprendre': return reprendre();
    case 'gare': return quitter();
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
  pasPartie(partie, pilote ? pilote(partie) : entrees.lire(DT));
  for (const ev of partie.evenements.splice(0)) {
    if (ev.type === 'son') son.bruitage(ev.nom);
    else recevoir(vue, ev, partie);
    if (ev.type === 'coup' && navigator.vibrate && !reglages.flashsReduits) try { navigator.vibrate(60); } catch { /* refusé */ }
  }
  const avant = vue.compteur;
  avancerVue(vue, partie, DT);
  if (vue.compteur > avant) son.bruitage('piece');
  son.rayon(partie.tire);
  if (partie.etat === 'mort' || partie.etat === 'fini') terminer();
}

function heure() { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }

/** Les commandes au doigt, dessinées sur la toile sous leurs boutons HTML. */
function dessinerCommandes() {
  const x = reglages.gaucher ? W - TIRER.x : TIRER.x, tire = partie && partie.tire;
  if (!bTirer.hidden) {
    ctx.globalAlpha = tire ? 0.8 : 0.55;
    ctx.fillStyle = '#120818'; ctx.beginPath(); ctx.arc(x, TIRER.y, TIRER.r + 1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = tire ? '#ff8a1c' : '#ffffff'; ctx.beginPath(); ctx.arc(x, TIRER.y, TIRER.r - 1, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ecrire(ctx, 'TIRER', x, TIRER.y - 4, { centre: true, gras: true, coul: '#120818' });
  }
  ctx.fillStyle = '#120818'; ctx.fillRect(294, 18, 24, 24); ctx.fillStyle = '#ffffff'; ctx.fillRect(295, 19, 22, 22);
  ctx.fillStyle = '#120818'; ctx.fillRect(301, 24, 3, 12); ctx.fillRect(308, 24, 3, 12);
}

function dessiner() {
  if (portrait()) { menus.tourner(ctx); majZones([]); return; }
  let zones = [];
  if (ecran === 'jeu' || ecran === 'pause') {
    dessinerPartie(ctx, partie, vue);
    if (ecran === 'jeu') dessinerCommandes();
    if (ecran === 'pause') zones = menus.pause(ctx);
  } else if (ecran === 'gare') {
    zones = menus.gare(ctx, sauvegarde, { installer: !installe(), heure: heure(), choisie, image: image++ });
    if (nouvelle) {
      ctx.fillStyle = '#120818'; ctx.fillRect(8, 108, 98, 30); ctx.fillStyle = '#6ee03a'; ctx.fillRect(9, 109, 96, 28);
      ecrire(ctx, 'NOUVELLE', 57, 113, { centre: true, coul: '#120818', gras: true });
      ecrire(ctx, 'VERSION : ICI', 57, 125, { centre: true, coul: '#120818' });
      zones.push({ id: 'recharger', x: 8, y: 108, w: 98, h: 30, label: 'Nouvelle version prête : recharger' });
    } else if (aideInstaller) ecrire(ctx, aideInstaller, 160, 132, { centre: true, coul: '#fff27a', contour: '#120818' });
  } else if (ecran === 'reglages') zones = menus.reglages(ctx, reglages, version);
  else if (ecran === 'defaite') zones = menus.defaite(ctx, dernierBilan);
  else if (ecran === 'bilan') zones = menus.bilan(ctx, dernierBilan, MISSIONS[missionId]);
  majZones(zones);
}

// Boucle à pas fixe : le jeu avance à 60 pas par seconde quel que soit l'écran
let avant = performance.now(), reste = 0;
function boucle(maintenant) {
  requestAnimationFrame(boucle);
  reste += Math.min(100, maintenant - avant); avant = maintenant;
  while (reste >= 1000 / FPS) { if (!fige) pasJeu(); reste -= 1000 / FPS; }
  dessiner();
}
montrer('gare');
requestAnimationFrame(boucle);

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
// Zoom bloqué : deux appuis rapides sur TIRER zoomaient toute la page sur iPhone
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
