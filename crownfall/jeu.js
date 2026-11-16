// Crownfall : l'interface. Les règles vivent dans moteur.js (pur, testé),
// le dessin dans dessin.js. Ici : afficher l'état, animer le journal, sauver.
import * as M from './moteur.js';
import { S, RANG, NOMS, pip, ICO, fig, unite, POUV, carteGrande, decor, medaille, ECU } from './dessin.js';

const $ = (id) => document.getElementById(id);
const cadre = $('cadre'), ecranEl = $('ecran'), couche = $('couche');

/* ------------------------------------------------------------ noms et cartes */
// Le moteur écrit K pour Carreau, le dessin D (comme la maquette).
const SU = { C: 'C', K: 'D', T: 'T', P: 'P' };
const NOM_COUL = { C: 'Cœur', K: 'Carreau', T: 'Trèfle', P: 'Pique' };
const LETTRE = { coeur: 'C', carreau: 'K', trefle: 'T', pique: 'P' };
const lettre = (id) => id.slice(-1);
const rangDe = (id) => id.slice(0, -1);
const figId = (id) => rangDe(id) + SU[lettre(id)];
const nomFig = (id) => NOMS[figId(id)];
const titreFig = (id) => `${RANG[rangDe(id)]} de ${NOM_COUL[lettre(id)]}`;
const feminin = (id) => rangDe(id) === 'D';
const nomCarte = (id) => {
  const r = rangDe(id);
  const n = { A: 'As', V: 'Valet', D: 'Dame', R: 'Roi' }[r] || r;
  return `${n} de ${NOM_COUL[lettre(id)]}`;
};

/* ------------------------------------------------------------ état de l'app */
const CLE_PARTIE = 'crownfall-partie', CLE_MEDAILLES = 'crownfall-medailles';
let E = null;          // état du moteur (gelé)
let sel = [];          // cartes choisies : l'attaque, ou ce qui est dans l'écu
let occupe = false;    // une animation joue : on ne touche à rien
let ecran = 'accueil';
let finInfo = null;    // ce qu'il faut dire à l'écran de fin
const LENT = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.15 : 1;
const attendre = (ms) => new Promise((r) => setTimeout(r, ms * LENT));

function lire(cle, defaut) {
  try { const v = localStorage.getItem(cle); return v ? JSON.parse(v) : defaut; } catch { return defaut; }
}
function ecrire(cle, v) {
  try { if (v === null) localStorage.removeItem(cle); else localStorage.setItem(cle, JSON.stringify(v)); } catch { /* stockage plein ou refusé : on joue quand même */ }
}
function sauver() { ecrire(CLE_PARTIE, E && !E.fin ? E : null); }
const medaillesGagnees = () => lire(CLE_MEDAILLES, []);

function reprendreSauvegarde() {
  const e = lire(CLE_PARTIE, null);
  // Une sauvegarde d'une autre forme (moteur changé) ne se recharge pas : on la jette.
  if (!e || e.format !== M.FORMAT || !Array.isArray(e.main)) return null;
  return e;
}

/* ------------------------------------------------------------ mise à l'échelle */
function mettreAEchelle() {
  const k = Math.min(innerWidth / 360, innerHeight / 732);
  cadre.style.transform = `scale(${k})`;
  cadre.style.marginTop = `${Math.max(0, (innerHeight - 732 * k) / 2)}px`;
}
addEventListener('resize', mettreAEchelle);
mettreAEchelle();
const echelle = () => cadre.getBoundingClientRect().width / 360;

/* ------------------------------------------------------------ la salle */
const RANGEES = { V: 'PCDT', D: 'TCPD', R: 'PCTD' }; // ordre des trônes, lettres du dessin
function salle(e, o = {}) {
  const restent = new Set(e ? e.chateau.map(figId) : []);
  const courant = e && e.chateau[0] ? figId(e.chateau[0]) : null;
  const ch = {};
  for (const r of 'RDV') {
    ch[r] = [...RANGEES[r]].map((s) => {
      const id = r + s;
      if (!e) return [s, 'assis'];
      if (id === courant && !o.assise) return [s, 'leve'];
      return [s, restent.has(id) ? 'assis' : 'vide'];
    });
  }
  return decor(ch, o);
}

const ennemiSVG = (id, cls = '') =>
  `<svg class="abs ennemi ${cls}" style="left:130px;top:198px" width="100" height="188" viewBox="0 0 120 230" role="img" aria-label="${nomFig(id)}, ${titreFig(id)}">${fig(figId(id), { full: 1 })}</svg>`;

function puces(en, cls = '') {
  const s = SU[lettre(en.id)];
  return `<div class="abs puce coin ${cls}" style="left:10px;top:226px" title="Son attaque">${ICO.epee('#f0c040')}${en.bouclier ? `<s>${en.attaque}</s> ` : ''}${en.attaqueEffective}</div>`
    + (en.bouclier ? `<div class="abs puce coin" style="left:10px;top:264px" title="Ton bouclier">${ICO.ecu('#8f84e6')} ${en.bouclier}</div>` : '')
    + `<div class="abs puce coin" style="right:10px;top:226px" title="Le pouvoir de sa couleur n'a pas d'effet sur elle">${pip(s, 16, S[s].t[3])} sans effet</div>`;
}

function troupe(id, w = 60, style = '') {
  const r = rangDe(id), s = SU[lettre(id)];
  if (r === 'V' || r === 'D' || r === 'R') {
    return `<svg width="${w}" height="${w * 88 / 72}" viewBox="14 -6 92 112" style="${style}">${fig(figId(id))}</svg>`;
  }
  return unite(r, s, { w, style });
}

function troupes(table, entrantes = []) {
  if (!table.length) return '';
  const montre = table.slice(-6);
  const pas = montre.length > 1 ? Math.min(50, 90 / (montre.length - 1)) : 0;
  return `<div class="abs troupes" style="left:6px;top:304px;display:flex">${montre.map((id, i) => {
    const style = i ? `margin-left:${pas - 60}px;margin-top:10px` : '';
    const cls = entrantes.includes(id) ? 'entre' : '';
    return `<span class="${cls}" style="display:block;animation-delay:${entrantes.indexOf(id) * 70}ms">${troupe(id, 60, style)}</span>`;
  }).join('')}</div>`;
}

const piles = (e) => `<div class="abs" style="right:12px;top:300px;display:flex;gap:10px">
  <div class="pile" id="pTaverne" title="La taverne : ta pioche"><div class="dos coin"></div>${e.taverne.length}<small>Taverne</small></div>
  <div class="pile" id="pDefausse" title="La défausse"><div class="dos def coin"></div>${e.defausse.length}<small>Défausse</small></div></div>`;

const boutonMenu = `<button class="menu-btn coin" data-act="menu" aria-label="Pause">
  <svg width="22" height="18" viewBox="0 0 22 18"><path d="M0 0h22v3H0ZM0 7.500h22v3H0ZM0 15h22v3H0Z" fill="#f0c040"/></svg></button>`;

/* ------------------------------------------------------------ la main */
function carteHTML(id, o = {}) {
  const r = rangDe(id), s = SU[lettre(id)], L = S[s].L;
  const fiche = M.carte(id);
  const bas = fiche.figure ? ICO.epee(L, 13) + fiche.valeur : POUV[s](L);
  const cls = ['carte', 'coin', o.sel && 'sel', o.immun && 'immun', o.off && 'off', o.neuve && 'neuve'].filter(Boolean).join(' ');
  return `<button class="${cls}" data-carte="${id}" style="background:${`repeating-conic-gradient(from 9deg at 50% 55%,${S[s].t[2]} 0 18deg,${S[s].t[1]} 18deg 36deg)`};${o.style || ''}" aria-pressed="${!!o.sel}" aria-label="${nomCarte(id)}${o.immun ? ', sans effet sur elle' : ''}"><span class="v" style="background:${S[s].t[0]};color:${L}">${r}</span>${pip(s, 24, L)}<span class="bas" style="color:${L}">${bas}</span></button>`;
}

function mainHTML(e, o = {}) {
  const ids = e.main.filter((id) => !(o.cachees || []).includes(id));
  const n = ids.length;
  const pas = n > 6 ? (344 - 52) / (n - 1) - 52 : 4;
  const immune = e.chateau[0] ? lettre(e.chateau[0]) : null;
  const legaux = o.legaux;
  return `<div class="main" style="gap:0">${ids.map((id, i) => carteHTML(id, {
    sel: o.choisies && o.choisies.includes(id),
    immun: lettre(id) === immune,
    off: legaux && !o.choisies.includes(id) && !legaux.includes(id),
    neuve: (o.neuves || []).includes(id),
    style: `margin-left:${i ? pas : 0}px;${n > 6 ? 'box-shadow:-3px 0 0 #0d1d33;' : ''}${(o.neuves || []).includes(id) ? `animation-delay:${(o.neuves.indexOf(id)) * 60 + (o.delaiNeuves || 0)}ms;` : ''}`,
  })).join('')}${n === 0 ? '<div class="vide coin" aria-label="Main vide"></div>' : ''}</div>`;
}

/* ------------------------------------------------------------ la plaque et l'aperçu */
function plaque(en, o = {}) {
  const pv = en.pv, reste = en.pvRestants;
  const coup = Math.min(o.coup || 0, reste);
  const apres = reste - coup;
  return `<div class="plaque coin"><div class="l1"><span class="nom">${nomFig(en.id)}${o.riposte ? ' riposte' : ''}</span><span class="titre">${o.riposte ? '' : titreFig(en.id)}</span><span class="pv" id="pv">${o.pvAffiche ?? reste} / ${pv}</span></div>
    <div class="barre"><i class="reste" id="reste" style="width:${(o.resteAffiche ?? apres) / pv * 100}%"></i><i class="coup" style="left:${apres / pv * 100}%;width:${coup / pv * 100}%"></i></div></div>`;
}

const SYMB = { coeur: 'C', carreau: 'K', trefle: 'T', pique: 'P' };
function lignesApercu(a, en) {
  const nom = nomFig(en.id);
  let l1 = a.double ? `${a.valeur} × 2 = ${a.degats} dégâts` : `${a.degats} dégât${a.degats > 1 ? 's' : ''}`;
  if (a.victoire) l1 += ' · le trône tombe !';
  else if (a.exact) l1 += ` · pile à zéro : ${nom} te rejoint`;
  else if (a.vaincu) l1 += ` · ${nom} tombe`;
  else if (a.riposte > 0) l1 += ` · puis riposte de ${a.riposte}`;
  else l1 += ' · ton bouclier pare tout';
  const effets = a.pouvoirs.map((p) => {
    const s = SU[SYMB[p.couleur]], ic = pip(s, 14, S[s].t[3]);
    if (!p.actif) return `${ic} sans effet`;
    if (p.couleur === 'coeur') return `${ic} ${p.effet.recyclees} reviennent`;
    if (p.couleur === 'carreau') return `${ic} pioche ${p.effet.piochees}`;
    if (p.couleur === 'pique') return `${ic} bouclier ${p.effet.bouclier}`;
    return `${ic} double`;
  });
  let l2 = effets.join(' · ');
  if (a.couverture === 'non') l2 = `${l2 ? l2 + ' · ' : ''}<span class="alerte">ta main ne pourra pas parer</span>`;
  else if (a.couverture === 'selon_pioche') l2 = `${l2 ? l2 + ' · ' : ''}<span class="alerte">parer dépendra de la pioche</span>`;
  return `${l1}${l2 ? `<br>${l2}` : ''}`;
}

/* ------------------------------------------------------------ écrans */
function afficher(html) { ecranEl.innerHTML = html; }

function accueil() {
  ecran = 'accueil';
  finInfo = null;
  const enCours = E && !E.fin;
  const m = medaillesGagnees();
  afficher(`<div class="scene">${salle(null)}</div>
    <div class="centre titre-jeu"><h1>Crownfall</h1><p>Douze figures. Une seule main.</p></div>
    <div class="medailles" style="margin-top:16px" role="img" aria-label="Médailles gagnées : ${m.length ? m.join(', ') : 'aucune'}">${['bronze', 'argent', 'or'].map((x) => medaille(x, 34, !m.includes(x))).join('')}</div>
    <p class="legende">Or sans Joker · argent avec un · bronze avec deux</p>
    <div class="pousse"></div>
    <div class="rangee"><button class="second coin" data-act="regles">Règles</button><button class="second coin" data-act="installer" id="instBtn" style="flex:2">Installer le jeu</button></div>
    <p class="aide coin" id="instAide" hidden></p>
    <div class="actions">${enCours
      ? `<button class="passer coin" data-act="nouvelle">Nouvelle partie</button><button class="attaquer coin" data-act="reprendre">Reprendre</button>`
      : `<button class="attaquer coin" data-act="jouer">Jouer</button>`}</div>
    <p class="version" id="version">${VERSION ? 'Version ' + VERSION.replace(/^crownfall-/, '') : ''}</p>`);
  majInstaller();
  prendreMaj();
}

/* L'écran de combat. `vue` = l'état à montrer (pendant une animation, un état
   intermédiaire) ; `fx` = ce qui doit bouger à l'affichage. */
function combat(vue = E, fx = {}) {
  ecran = 'combat';
  const en = M.ennemi(vue);
  const defendre = vue.phase === 'defendre' && !fx.sansEcu;
  let scene = salle(vue, { assise: fx.assise }) + boutonMenu;
  if (en && !fx.sansEnnemi) scene += ennemiSVG(en.id, fx.ennemiCls || '') + puces(en, fx.pucesCls || '');
  scene += troupes(vue.table, fx.entrantes || []) + piles(vue);
  if (fx.coup) {
    scene += `<svg class="abs boum" style="left:112px;top:238px" width="136" height="136" viewBox="-68 -68 136 136" aria-hidden="true"><path d="M0-64L14-20L58-34L26 0L58 34L14 20L0 64L-14 20L-58 34L-26 0L-58-34L-14-20Z" fill="#f0c040"/><path d="M0-36L8-11L33-19L15 0L33 19L8 11L0 36L-8 11L-33 19L-15 0L-33-19L-8-11Z" fill="#fff"/></svg>
      <div class="abs chiffre-coup gothique" style="left:212px;top:226px;font-size:54px;line-height:1;color:#f0c040;text-shadow:0 3px 0 #0b1626">${fx.coup}</div>`;
  }
  let total = 0;
  if (defendre) {
    total = sel.reduce((t, id) => t + M.carte(id).valeur, 0);
    const niveau = Math.min(1, total / vue.riposte);
    const y = 136 - niveau * 136;
    scene += `<svg class="abs ecu-zone ${fx.ecuCls || ''}" id="ecu" width="124" height="120" viewBox="0 0 140 136" aria-hidden="true"><defs><clipPath id="ecuC"><path d="${ECU}"/></clipPath></defs>
        <path d="${ECU}" fill="#0b1626" opacity=".9"/><g clip-path="url(#ecuC)"><path d="M0 ${y}h70v${136 - y}H0Z" fill="#8f84e6" opacity=".6"/><path d="M70 ${y}h70v${136 - y}H70Z" fill="#5648b8" opacity=".6"/>${niveau > 0 && niveau < 1 ? `<path d="M0 ${y}h140v3H0Z" fill="#f4f1ff"/>` : ''}</g>
        <path class="bord" d="${ECU}" fill="none" stroke="#f0c040" stroke-width="3.500" stroke-dasharray="${total >= vue.riposte ? 'none' : '9 6'}"/></svg>
      <div class="abs ecu-chiffre gothique" aria-live="polite">${total} / ${vue.riposte}</div>
      <div class="abs ecu-cartes">${sel.map((id) => carteHTML(id, { style: '' }).replace('class="carte', 'data-ecu="1" class="carte')).join('')}</div>`;
  }
  let html = `<div class="scene">${scene}</div>`;
  if (fx.bandeau) html += `<div class="plaque coin doree"><div class="l1"><span class="nom">${fx.bandeau[0]}</span></div><div class="sous">${fx.bandeau[1]}</div></div>`;
  else if (en) {
    // La part rayée de la barre : ce que la sélection va retirer.
    const prevu = !fx.figee && vue.phase === 'jouer' && sel.length ? M.apercu(vue, sel) : null;
    html += plaque(en, { riposte: defendre, coup: prevu && prevu.ok ? prevu.degats : 0, pvAffiche: fx.pvAffiche, resteAffiche: fx.resteAffiche });
  }

  // L'aperçu : ce que fera la sélection, ou ce qu'il faut faire.
  let texte = fx.texte;
  let legaux = null, bouton = '';
  const c = M.coupsLegaux(vue, sel);
  if (texte === undefined) {
    if (vue.phase === 'jouer') {
      if (!vue.main.length) texte = 'Plus une carte : retourne le Joker';
      else if (!sel.length) texte = 'Choisis tes cartes';
      else { const a = M.apercu(vue, sel); texte = a.ok ? lignesApercu(a, en) : a.raison; }
    } else if (defendre) {
      if (M.valeurMain(vue) < vue.riposte) texte = `Ta main vaut ${M.valeurMain(vue)}, il faut ${vue.riposte} : retourne le Joker`;
      else if (!sel.length) texte = `Remplis l'écu : jette des cartes pour ${vue.riposte}<br>touche-les ou glisse-les dessus`;
      else if (total < vue.riposte) texte = `Encore ${vue.riposte - total} à parer`;
      else if (!c.defausser.ok) texte = 'Une carte de trop : l\'écu est plein sans la plus petite.<br>Touche-la dans l\'écu pour la reprendre.';
      else texte = 'L\'écu est plein';
    } else texte = '';
  }
  if (!fx.figee) {
    if (vue.phase === 'jouer') {
      legaux = sel.length ? c.ajoutables : null;
      const ok = sel.length && c.jouer.ok;
      bouton = `<button class="attaquer coin${ok ? '' : ' off'}" data-act="attaquer" ${ok ? '' : 'aria-disabled="true"'}>Attaquer</button>`;
    } else if (defendre) {
      const ok = c.defausser.ok;
      const lib = ok ? 'Encaisser' : total < vue.riposte ? `Encore ${vue.riposte - total}` : 'Une carte de trop';
      bouton = `<button class="attaquer coin${ok ? '' : ' off'}" data-act="encaisser" ${ok ? '' : 'aria-disabled="true"'}>${lib}</button>`;
    }
  } else {
    bouton = `<button class="attaquer coin off" aria-disabled="true">${vue.phase === 'defendre' ? 'Riposte' : 'Attaquer'}</button>`;
  }
  html += `<div class="apercu" aria-live="polite">${texte}</div>`;
  html += mainHTML(vue, { choisies: vue.phase === 'jouer' ? sel : [], cachees: defendre ? sel : [], legaux, neuves: fx.neuves, delaiNeuves: fx.delaiNeuves });
  const jok = vue.jokers;
  html += `<div class="pousse"></div><div class="actions"><button class="jeton coin${jok ? '' : ' off'}" data-act="joker" aria-label="Joker, ${jok} restant${jok > 1 ? 's' : ''}">${ICO.fou('#f0c040')}Joker<b class="coin">${jok}</b></button>${bouton}</div>`;
  if (fx.taille) {
    html += `<svg class="abs taille" style="left:0;top:520px;pointer-events:none" width="360" height="130" viewBox="0 0 360 130" aria-hidden="true"><path d="M0 104L360 8V30L0 122Z" fill="#b8233f"/><path d="M0 110L360 16V22L0 116Z" fill="#ffc4cb"/></svg>
      <div class="abs neuf gothique" style="left:0;right:0;text-align:center;top:536px;font-size:64px;line-height:1;color:#fff;text-shadow:0 4px 0 #7a1230;pointer-events:none">${fx.taille}</div>`;
  }
  afficher(html);
}

/* ------------------------------------------------------------ fins */
function finEcran() {
  ecran = 'fin';
  const f = E.fin;
  if (f.issue === 'gagne') {
    const noms = { or: 'Médaille d\'or', argent: 'Médaille d\'argent', bronze: 'Médaille de bronze' };
    const m = medaillesGagnees();
    afficher(`<div class="scene">${salle(E, { clair: 1 })}<div class="abs" style="left:130px;top:226px">${medaille(f.medaille, 100)}</div></div>
      <div class="centre" style="margin-top:14px"><div class="fin-titre" style="color:#f0c040">Victoire</div>
        <div style="font-size:19px;font-weight:700;margin-top:8px">${noms[f.medaille]}</div>
        <div style="font-size:16px;margin-top:2px">Les douze sont tombés · ${f.jokersUtilises ? `${f.jokersUtilises} Joker${f.jokersUtilises > 1 ? 's' : ''} joué${f.jokersUtilises > 1 ? 's' : ''}` : 'aucun Joker'}</div></div>
      <div class="medailles" style="margin-top:16px">${['bronze', 'argent', 'or'].map((x) => medaille(x, 30, !m.includes(x))).join('')}</div>
      <div class="pousse"></div><div class="actions"><button class="passer coin" data-act="accueil">Accueil</button><button class="attaquer coin" data-act="jouer">Rejouer</button></div>`);
  } else {
    const en = M.ennemi(E);
    const reste = 12 - E.vaincus;
    let pourquoi = 'Plus une carte en main, plus de Joker';
    if (f.raison === 'riposte' && finInfo && en) pourquoi = `${nomFig(en.id)} frappait à ${finInfo.riposte}, ta main valait ${finInfo.main}`;
    afficher(`<div class="scene">${salle(E)}${en ? ennemiSVG(en.id) + puces(en) : ''}</div>
      <div class="centre" style="margin-top:14px"><div class="fin-titre" style="font-size:42px">La garde a cédé</div>
        <div style="font-size:17px;font-weight:700;margin-top:10px">${pourquoi}</div>
        <div style="font-size:16px;margin-top:6px;color:#fff0b0">${E.vaincus} figure${E.vaincus > 1 ? 's' : ''} vaincue${E.vaincus > 1 ? 's' : ''}. Plus que ${reste} avant le trône.</div></div>
      <div class="pousse"></div><div class="actions"><button class="passer coin" data-act="accueil">Accueil</button><button class="attaquer coin" data-act="jouer">Rejouer</button></div>`);
  }
  prendreMaj();
}

/* ------------------------------------------------------------ feuilles */
function feuille(html) {
  couche.innerHTML = `<div class="voile" data-act="fermer"></div><div class="feuille" role="dialog" aria-modal="true">${html}</div>`;
  const b = couche.querySelector('.feuille button:last-of-type');
  if (b) b.focus({ preventScroll: true });
}
const fermer = () => { couche.innerHTML = ''; };
const ouverte = () => couche.innerHTML !== '';

function feuilleJoker() {
  const avant = ['or', 'argent', 'bronze'][M.JOKERS - E.jokers];
  const apres = ['or', 'argent', 'bronze'][M.JOKERS - E.jokers + 1];
  feuille(`${ICO.fou('#f0c040').replace(/"26"/g, '"56"')}
    <h2>Jouer le Joker</h2>
    <p>Jette ta main, repioche ${M.MAIN_MAX} cartes</p>
    <div class="medailles">${medaille(avant, 30, 1)}<span>devient</span>${medaille(apres, 30)}</div>
    <div class="actions"><button class="passer coin" data-act="fermer">Garder</button><button class="attaquer coin" data-act="utiliserJoker">Utiliser</button></div>`);
}

function feuillePause() {
  feuille(`<h2>Pause</h2>
    <div class="pile-boutons"><button class="second coin" data-act="regles">Règles</button><button class="second coin" data-act="accueil">Accueil · la partie est gardée</button></div>
    <div class="actions"><button class="attaquer coin" data-act="fermer">Reprendre</button></div>`);
}

function feuilleNouvelle() {
  feuille(`<h2>Nouvelle partie ?</h2>
    <p>La partie en cours sera perdue.</p>
    <div class="actions"><button class="passer coin" data-act="fermer">Non</button><button class="attaquer coin" data-act="jouer">Oui, recommencer</button></div>`);
}

function regles() {
  const ex = (id) => carteHTML(id);
  couche.innerHTML = `<div class="regles" role="dialog" aria-modal="true" aria-label="Règles">
    <div class="haut"><h2>Règles</h2><button class="second coin" data-act="fermer">Fermer</button></div>
    <div class="texte">
      <p>Douze figures siègent dans la salle du trône : quatre Valets, quatre Dames, quatre Rois. Abats-les une à une, avec une seule main de ${M.MAIN_MAX} cartes.</p>
      <h3>Ton tour</h3>
      <p><b>1. Attaque.</b> Joue une carte, ou plusieurs de même valeur dont le total ne dépasse pas 10 (deux 4, trois 3…), ou un As avec une autre carte.</p>
      <p><b>2. Pouvoir.</b> La couleur jouée agit, X étant le total joué :</p>
      <div class="pouv">${ex('5C')}<p><b>Soin</b> : X cartes de la défausse retournent sous la taverne.</p></div>
      <div class="pouv">${ex('5K')}<p><b>Pioche</b> : tu pioches X cartes, jamais plus de ${M.MAIN_MAX} en main.</p></div>
      <div class="pouv">${ex('5P')}<p><b>Bouclier</b> : son attaque baisse de X, jusqu'à sa chute.</p></div>
      <div class="pouv">${ex('5T')}<p><b>Double</b> : tes dégâts comptent double.</p></div>
      <p>Une figure ne craint pas sa propre couleur : son pouvoir est barré sur tes cartes.</p>
      <p><b>3. Dégâts.</b> Si ses PV tombent pile à zéro, elle te rejoint : elle part sur ta taverne et tu pourras la jouer. Au-delà, elle va à la défausse. La suivante se lève et tu rejoues.</p>
      <p><b>4. Riposte.</b> Sinon elle frappe : remplis l'écu en jetant des cartes dont la valeur couvre son attaque. Si ta main n'y suffit pas, la partie est perdue.</p>
      <h3>Les figures</h3>
      <ul><li>Valet : 20 PV, frappe à 10</li><li>Dame : 30 PV, frappe à 15</li><li>Roi : 40 PV, frappe à 20</li></ul>
      <p>Recrutée, une figure vaut 10, 15 ou 20. L'As vaut 1.</p>
      <h3>Les Jokers</h3>
      <p>Tu en as deux. Avant d'attaquer ou avant d'encaisser, un Joker jette ta main et en repioche ${M.MAIN_MAX}. On ne passe jamais son tour.</p>
      <p>Les douze vaincues, la médaille dit combien de Jokers ont servi : or sans Joker, argent avec un, bronze avec deux.</p>
      <p class="credit">D'après les règles de Regicide (Badgers From Mars), jeu coopératif pour 1 à 4 joueurs. Ici en solo, dessins à nous.</p>
    </div></div>`;
  couche.querySelector('.regles button').focus({ preventScroll: true });
}

/* ------------------------------------------------------------ jouer */
function nouvellePartie() {
  const g = new Uint32Array(1);
  crypto.getRandomValues(g);
  E = M.nouvellePartie({ graine: g[0] });
  sel = [];
  finInfo = null;
  sauver();
  fermer();
  combat(E, { assise: true, figee: true, texte: `${nomFig(E.chateau[0])} se lève` });
  occupe = true;
  attendre(350).then(() => {
    combat(E, { ennemiCls: 'leve' });
    occupe = false;
  });
}

function toucherCarte(id, depuisEcu) {
  if (occupe || ecran !== 'combat') return;
  if (E.phase === 'jouer') {
    if (sel.includes(id)) sel = sel.filter((x) => x !== id);
    else {
      const c = M.coupsLegaux(E, sel);
      // Une carte qui ne va pas avec le choix en cours commence un nouveau choix.
      sel = !sel.length || c.ajoutables.includes(id) ? [...sel, id] : [id];
    }
  } else if (E.phase === 'defendre') {
    if (depuisEcu || sel.includes(id)) sel = sel.filter((x) => x !== id);
    else {
      const total = sel.reduce((t, x) => t + M.carte(x).valeur, 0);
      if (total >= E.riposte) return pulse('#ecu');
      sel = [...sel, id];
    }
  }
  combat();
}

function pulse(sel) {
  const el = ecranEl.querySelector(sel);
  if (el) el.animate([{ transform: 'none' }, { transform: 'scale(1.08)' }, { transform: 'none' }], { duration: 260 });
}

function voler(els, vers, ms = 320) {
  const k = echelle();
  const cible = vers && ecranEl.querySelector(vers);
  return Promise.all(els.filter(Boolean).map((el) => {
    let dx = 0, dy = -140;
    if (cible) {
      const a = el.getBoundingClientRect(), b = cible.getBoundingClientRect();
      dx = (b.left + b.width / 2 - a.left - a.width / 2) / k;
      dy = (b.top + b.height / 2 - a.top - a.height / 2) / k;
    }
    return el.animate([{ transform: getComputedStyle(el).transform === 'none' ? 'none' : getComputedStyle(el).transform, opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) scale(.55)`, opacity: 0 }], { duration: ms * LENT, easing: 'ease-in', fill: 'forwards' }).finished.catch(() => {});
  }));
}

async function attaquer() {
  if (occupe || E.phase !== 'jouer' || !sel.length) return;
  const cartes = [...sel];
  const avant = E;
  const r = M.appliquer(E, { type: 'jouer', cartes });
  if (!r.ok) { combat(E, { texte: r.raison }); return; }
  occupe = true;
  sel = [];
  E = r.etat;
  sauver();
  const j = r.journal;
  const deg = j.find((x) => x.type === 'degats');
  const vaincu = j.find((x) => x.type === 'ennemi_vaincu');
  const rip = j.find((x) => x.type === 'riposte');
  const pique = j.find((x) => x.type === 'pouvoir' && x.couleur === 'pique' && x.applique);
  const carreau = j.find((x) => x.type === 'pouvoir' && x.couleur === 'carreau' && x.applique);

  // 1. Les cartes choisies quittent la main.
  await voler(cartes.map((id) => ecranEl.querySelector(`.main [data-carte="${id}"]`)), null, 300);

  // 2. Les troupes entrent, le coup porte.
  const enAvant = M.ennemi(avant);
  const vue = { ...avant, main: E.main, table: [...avant.table, ...cartes], degats: Math.min(enAvant.pv, avant.degats + deg.montant),
    bouclier: pique ? pique.bouclier : avant.bouclier, taverne: E.taverne, defausse: vaincu ? avant.defausse : E.defausse, phase: 'jouer' };
  const resteAvant = enAvant.pvRestants;
  const resteApres = Math.max(0, enAvant.pv - vue.degats);
  combat(vue, { figee: true, entrantes: cartes, coup: deg.montant, ennemiCls: 'secoue', pucesCls: pique ? 'pulse' : '',
    pvAffiche: resteAvant, resteAffiche: resteAvant, neuves: carreau ? carreau.piochees : [], delaiNeuves: 500,
    texte: resumeCoup(j, enAvant) });
  await attendre(420);
  const barre = $('reste'), pv = $('pv');
  if (barre) barre.style.width = `${resteApres / enAvant.pv * 100}%`;
  if (pv) pv.textContent = `${resteApres} / ${enAvant.pv}`;
  await attendre(900);

  if (vaincu) {
    // 3a. Elle tombe : pile à zéro, elle devient une carte qui file dans la taverne.
    const nom = nomFig(vaincu.ennemi), e2 = feminin(vaincu.ennemi) ? 'e' : '';
    const bandeau = vaincu.exact ? ['Pile à zéro !', `${nom} rejoint ta taverne`] : [`${nom} est vaincu${e2}`, 'Elle part à la défausse'.replace('Elle', e2 ? 'Elle' : 'Il')];
    combat({ ...vue, table: [] }, { figee: true, sansEnnemi: true, bandeau, texte: '' });
    const scene = ecranEl.querySelector('.scene');
    if (vaincu.exact) {
      const r2 = rangDe(vaincu.ennemi);
      scene.insertAdjacentHTML('beforeend', `<div class="abs" id="recrue" style="left:150px;top:236px;transform:rotate(14deg) scale(.6);transform-origin:top left">${carteGrande(r2, SU[lettre(vaincu.ennemi)], figId(vaincu.ennemi), M.carte(vaincu.ennemi).valeur)}</div>`);
      await attendre(500);
      await voler([$('recrue')], '#pTaverne', 600);
    } else {
      scene.insertAdjacentHTML('beforeend', ennemiSVG(vaincu.ennemi).replace('class="abs ennemi ', 'id="chute" class="abs ennemi '));
      await voler([$('chute')], '#pDefausse', 650);
    }
    await attendre(250);
    if (E.phase === 'gagne') { victoire(); return; }
    combat(E, { ennemiCls: 'leve', texte: `${nomFig(E.chateau[0])} se lève · tu rejoues` });
    await attendre(700);
    occupe = false;
    if (E.phase === 'perdu') { finEcran(); }
    return;
  }

  // 3b. Elle ANNONCE sa riposte : le coup ne part qu'une fois l'écu rempli
  // (encaisser). Avant, elle frappait ici, avant qu'on ait choisi de quoi parer.
  if (rip && rip.montant > 0) {
    if (E.phase === 'perdu') {
      // Main trop faible et plus de Joker : rien à parer, le coup part tout de suite.
      combat(vue, { figee: true, ennemiCls: 'elan', taille: rip.montant, texte: `${nomFig(enAvant.id)} riposte : ${rip.montant}` });
      await attendre(1000);
      finInfo = { riposte: rip.montant, main: M.valeurMain(E) }; occupe = false; finEcran(); return;
    }
    combat(vue, { figee: true, texte: `${nomFig(enAvant.id)} prépare sa riposte : ${rip.montant}<br>pare-la avec tes cartes` });
    await attendre(900);
    combat();
  } else {
    combat(vue, { figee: true, texte: 'Ton bouclier pare toute sa riposte' });
    await attendre(900);
    combat();
  }
  occupe = false;
  if (E.phase === 'perdu') finEcran();
}

function resumeCoup(j, en) {
  const deg = j.find((x) => x.type === 'degats');
  const bouts = [deg.double ? `${deg.montant / 2} × 2 = ${deg.montant} dégâts` : `${deg.montant} dégât${deg.montant > 1 ? 's' : ''}`];
  for (const p of j.filter((x) => x.type === 'pouvoir')) {
    const s = SU[LETTRE[p.couleur]], ic = pip(s, 14, S[s].t[3]);
    if (!p.applique) bouts.push(`${ic} sans effet sur ${nomFig(en.id)}`);
    else if (p.couleur === 'coeur') bouts.push(`${ic} ${p.recyclees} carte${p.recyclees > 1 ? 's' : ''} sous la taverne`);
    else if (p.couleur === 'carreau') bouts.push(`${ic} tu pioches ${p.piochees.length}`);
    else if (p.couleur === 'pique') bouts.push(`${ic} bouclier ${p.bouclier}`);
  }
  return bouts[0] + (bouts.length > 1 ? '<br>' + bouts.slice(1).join(' · ') : '');
}

async function encaisser() {
  if (occupe || E.phase !== 'defendre') return;
  const cartes = [...sel];
  const r = M.appliquer(E, { type: 'defausser', cartes });
  if (!r.ok) { combat(E, { texte: r.raison }); return; }
  occupe = true;
  // Le coup part MAINTENANT, contre l'écu rempli, puis les cartes vont à la défausse.
  const en = M.ennemi(E);
  combat(E, { figee: true, ennemiCls: 'elan', ecuCls: 'secoue', texte: `${nomFig(en.id)} frappe : ${E.riposte}<br>ton écu tient` });
  await attendre(900);
  await voler([...ecranEl.querySelectorAll('.ecu-cartes .carte')], '#pDefausse', 420);
  sel = [];
  E = r.etat;
  sauver();
  occupe = false;
  if (E.phase === 'perdu') { finEcran(); return; }
  combat(E, { texte: 'Tu as tenu. À toi.' });
}

async function utiliserJoker() {
  fermer();
  if (occupe || !E || E.fin) return;
  const avant = E;
  const r = M.appliquer(E, { type: 'joker' });
  if (!r.ok) { combat(E, { texte: r.raison }); return; }
  occupe = true;
  await voler([...ecranEl.querySelectorAll('.main .carte, .ecu-cartes .carte')], '#pDefausse', 380);
  sel = [];
  E = r.etat;
  sauver();
  const jk = r.journal.find((x) => x.type === 'joker');
  if (E.phase === 'perdu') {
    finInfo = { riposte: avant.riposte, main: M.valeurMain(E) };
    occupe = false; finEcran(); return;
  }
  combat(E, { neuves: jk.piochees, texte: `Main neuve : ${jk.piochees.length} cartes` });
  await attendre(600);
  occupe = false;
}

function victoire() {
  const m = medaillesGagnees();
  if (!m.includes(E.fin.medaille)) ecrire(CLE_MEDAILLES, [...m, E.fin.medaille]);
  sauver();
  occupe = false;
  finEcran();
}

/* ------------------------------------------------------------ boutons */
const ACTIONS = {
  jouer: () => { fermer(); nouvellePartie(); },
  reprendre: () => { fermer(); sel = []; combat(); },
  nouvelle: feuilleNouvelle,
  accueil: () => { fermer(); if (E && E.fin) { E = null; sauver(); } accueil(); },
  regles,
  menu: () => { if (!occupe) feuillePause(); },
  fermer,
  attaquer,
  encaisser,
  joker: () => { if (!occupe && E && E.jokers > 0 && !E.fin) feuilleJoker(); },
  utiliserJoker,
  installer,
};

let ignorerClic = false;
cadre.addEventListener('click', (ev) => {
  if (ignorerClic) { ignorerClic = false; return; }
  const b = ev.target.closest('[data-act],[data-carte]');
  if (!b) return;
  if (b.dataset.carte) { toucherCarte(b.dataset.carte, !!b.dataset.ecu); return; }
  if (b.getAttribute('aria-disabled') === 'true' && b.dataset.act !== 'menu') {
    if (b.dataset.act === 'attaquer' || b.dataset.act === 'encaisser') pulse('.apercu');
    return;
  }
  const f = ACTIONS[b.dataset.act];
  if (f) f();
});

/* Glisser une carte sur l'écu (riposte) : en plus du toucher, jamais à la place. */
let tir = null;
cadre.addEventListener('pointerdown', (ev) => {
  const el = ev.target.closest('.main [data-carte]');
  if (!el || occupe || !E || E.phase !== 'defendre' || ecran !== 'combat' || ouverte()) return;
  tir = { el, id: el.dataset.carte, x: ev.clientX, y: ev.clientY, glisse: false, pid: ev.pointerId };
});
cadre.addEventListener('pointermove', (ev) => {
  if (!tir || ev.pointerId !== tir.pid) return;
  const k = echelle(), dx = (ev.clientX - tir.x) / k, dy = (ev.clientY - tir.y) / k;
  if (!tir.glisse && Math.hypot(dx, dy) > 8) {
    tir.glisse = true;
    tir.el.classList.add('tire');
    try { tir.el.setPointerCapture(ev.pointerId); } catch { /* rien */ }
  }
  if (tir.glisse) {
    tir.el.style.transform = `translate(${dx}px,${dy}px) rotate(6deg)`;
    const ecu = $('ecu');
    if (ecu) ecu.classList.toggle('vise', surEcu(ev));
  }
});
function surEcu(ev) {
  const ecu = $('ecu');
  if (!ecu) return false;
  const r = ecu.getBoundingClientRect(), m = 20 * echelle();
  return ev.clientX > r.left - m && ev.clientX < r.right + m && ev.clientY > r.top - m && ev.clientY < r.bottom + m;
}
function finTir(ev) {
  if (!tir || ev.pointerId !== tir.pid) return;
  const t = tir;
  tir = null;
  if (!t.glisse) return; // un simple toucher : le clic s'en charge
  ignorerClic = true;
  setTimeout(() => { ignorerClic = false; }, 0);
  if (ev.type === 'pointerup' && surEcu(ev)) toucherCarte(t.id, false);
  else { t.el.classList.remove('tire'); t.el.style.transform = ''; const ecu = $('ecu'); if (ecu) ecu.classList.remove('vise'); }
}
cadre.addEventListener('pointerup', finTir);
cadre.addEventListener('pointercancel', finTir);

/* Deux appuis rapides zoomaient toute la page sur iPhone. */
addEventListener('dblclick', (e) => e.preventDefault());
addEventListener('gesturestart', (e) => e.preventDefault());

/* Le geste retour d'Android : pendant une partie, il ouvre la pause (ou ferme
   la feuille ouverte), un second la referme. Hors partie, il quitte d'un coup.
   Deux entrées d'historique « gardes », posées sur un TOUCHER, jamais dans
   `popstate` : Chrome saute au retour une entrée posée sans geste. */
(function () {
  const enPartie = () => ecran === 'combat';
  const niveau = () => (history.state && history.state.garde) || 0;
  let dernier = niveau();
  function poser() { if (!enPartie()) return; while (niveau() < 2) history.pushState({ garde: niveau() + 1 }, ''); dernier = 2; }
  addEventListener('pointerdown', poser, true);
  addEventListener('keydown', poser, true);
  addEventListener('popstate', () => {
    const n = niveau(), recule = n < dernier;
    dernier = n;
    if (!recule) return;
    if (!enPartie()) { history.go(-(n + 1)); return; }
    if (ouverte()) fermer();
    else if (!occupe) feuillePause();
  });
})();

/* Échap ferme la feuille ou ouvre la pause, au clavier. */
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (ouverte()) fermer();
  else if (ecran === 'combat' && !occupe) feuillePause();
});

/* ------------------------------------------------------------ installation */
/* Un bouton sur l'accueil, TOUJOURS, tant que le jeu n'est pas installé. Chrome
   donne son invitation ; sans elle (iPhone), le bouton montre où est la commande. */
let invitation = null;
const installe = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
function majInstaller() {
  const b = $('instBtn');
  if (!b) return;
  b.hidden = installe();
  if (installe()) $('instAide').hidden = true;
}
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); invitation = e; majInstaller(); });
addEventListener('appinstalled', () => { invitation = null; majInstaller(); });
function installer() {
  if (invitation) {
    const i = invitation;
    invitation = null;
    i.prompt();
    if (i.userChoice && i.userChoice.then) i.userChoice.then(majInstaller, majInstaller);
    return;
  }
  const a = $('instAide');
  a.textContent = /iPhone|iPad|iPod/.test(navigator.userAgent)
    ? 'Touche Partager, puis « Sur l’écran d’accueil ».'
    : 'Ouvre le menu du navigateur, puis « Ajouter à l’écran d’accueil ».';
  a.hidden = !a.hidden;
}

/* ------------------------------------------------------------ mise à jour */
/* Un rechargement ne redemande pas sw.js : il faut update(). La nouvelle version
   ne se prend qu'à l'accueil ou à l'écran de fin, jamais en pleine partie. */
let VERSION = '';
let majPrete = false;
function prendreMaj() { if (majPrete && (ecran === 'accueil' || ecran === 'fin') && !occupe) location.reload(); }
if ('serviceWorker' in navigator) {
  const avait = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (avait) { majPrete = true; prendreMaj(); } });
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    const maj = () => reg.update().catch(() => {});
    maj();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) maj(); });
  }).catch(() => {});
  navigator.serviceWorker.ready.then((reg) => {
    if (!reg.active) return;
    const canal = new MessageChannel();
    canal.port1.onmessage = (e) => {
      VERSION = String(e.data);
      const v = $('version');
      if (v) v.textContent = 'Version ' + VERSION.replace(/^crownfall-/, '');
    };
    reg.active.postMessage('version', [canal.port2]);
  }).catch(() => {});
}

/* ------------------------------------------------------------ départ */
E = reprendreSauvegarde();
accueil();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (ecran === 'accueil') accueil(); });

/* Crochets pour les bancs de tools/ : rien ici ne sert au jeu. */
window.__crownfall = {
  etat: () => E,
  ecran: () => ecran,
  occupe: () => occupe,
  selection: () => [...sel],
  poser: (etat) => { E = etat; sel = []; sauver(); combat(); },
  moteur: M,
};
