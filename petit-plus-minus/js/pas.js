/* « Mes petits pas » : l'escalier d'une peur, logique PURE (ni DOM, ni stockage).
   C'est l'exposition graduée des TCC, dans les mots de l'atelier que suit l'enfant :
   nommer la peur et l'objectif, énumérer les étapes de la moins effrayante à la plus
   effrayante, les affronter une à la fois. Les choix ci-dessous viennent des sources
   lues le 2026-10-01 (docs/GAME_DESIGN.md, « Mes petits pas ») :
   - une étape affrontée COMPTE même si la peur n'a pas baissé (le but est de constater
     qu'elle se supporte, pas de la faire baisser) ;
   - aucun chiffre de répétitions n'existe : FOIS est un minimum, ensuite c'est l'enfant
     qui décide de monter ;
   - trop dur ne punit pas : on glisse une étape plus petite avant.
   Chaque fonction rend un nouvel escalier au lieu de modifier celui qu'on lui passe. */

export const FOIS = 3;
/* 7 au plus : au-delà, une marche ferait moins de 44 px de large sur un écran de 360. */
export const MAX_ETAPES = 7;
export const MAX_TRACES = 400;
export const LONGUEUR_ETAPE = 66;
export const LONGUEUR_NOM = 40;

export function escalierVide() {
  return { peur: "", objectif: "", etapes: [], ici: 0, suite: 1, traces: [] };
}

/* Un escalier lu dans le stockage peut être absent, ancien ou abîmé : on le répare. */
export function lireEscalier(e) {
  const v = escalierVide();
  if (!e || typeof e !== "object" || !Array.isArray(e.etapes)) return v;
  const etapes = e.etapes.filter((x) => x && typeof x === "object").slice(0, MAX_ETAPES).map((x, i) => ({
    id: Number.isInteger(x.id) ? x.id : i + 1,
    texte: typeof x.texte === "string" ? x.texte.slice(0, LONGUEUR_ETAPE) : "",
    peur: [0, 1, 2, 3].includes(x.peur) ? x.peur : 3,
    fois: Number.isInteger(x.fois) && x.fois > 0 ? x.fois : 0,
  }));
  const ici = Number.isInteger(e.ici) ? Math.max(0, Math.min(e.ici, Math.max(0, etapes.length - 1))) : 0;
  return {
    peur: typeof e.peur === "string" ? e.peur.slice(0, LONGUEUR_NOM) : "",
    objectif: typeof e.objectif === "string" ? e.objectif.slice(0, LONGUEUR_NOM) : "",
    etapes, ici,
    suite: Math.max(Number.isInteger(e.suite) ? e.suite : 1, ...etapes.map((x) => x.id + 1)),
    traces: Array.isArray(e.traces) ? e.traces.slice(-MAX_TRACES) : [],
  };
}

/* Une ligne laissée vide dans « Construire » ne devient pas une marche : on la retire
   avant de montrer l'escalier à l'enfant. */
export function nettoyer(esc) {
  return esc.etapes.filter((x) => x.texte.trim() === "").reduce((e, x) => retirerEtape(e, x.id), esc);
}

export const etapeCourante = (esc) => esc.etapes[esc.ici] || null;
const derniere = (esc) => esc.ici >= esc.etapes.length - 1;
/* Après FOIS fois, il PEUT monter. Rien ne l'y oblige, rien ne le fait à sa place. */
export const peutMonter = (esc) => { const c = etapeCourante(esc); return !!c && !derniere(esc) && c.fois >= FOIS; };
export const enHaut = (esc) => { const c = etapeCourante(esc); return !!c && derniere(esc) && c.fois >= FOIS; };
/* A-t-il commencé à monter ? Sert à proposer « glisser une étape plus petite ». */
export const commence = (esc) => esc.ici > 0 || esc.etapes.some((x) => x.fois > 0);

export function nommer(esc, champ, texte) {
  if (champ !== "peur" && champ !== "objectif") return esc;
  return { ...esc, [champ]: String(texte).slice(0, LONGUEUR_NOM) };
}

/* Les marches déjà montées ne bougent plus ; les autres se rangent de la moins effrayante
   à la plus effrayante. À peur égale, l'ordre d'écriture est gardé (tri stable). */
function ranger(esc) {
  const montees = esc.etapes.slice(0, esc.ici);
  const reste = esc.etapes.slice(esc.ici).map((x, i) => [x, i]).sort((a, b) => a[0].peur - b[0].peur || a[1] - b[1]).map(([x]) => x);
  return { ...esc, etapes: [...montees, ...reste] };
}

export function ajouterEtape(esc) {
  if (esc.etapes.length >= MAX_ETAPES) return esc;
  // La plus effrayante par défaut : elle se place en haut, il la descendra en touchant Minus.
  return { ...esc, etapes: [...esc.etapes, { id: esc.suite, texte: "", peur: 3, fois: 0 }], suite: esc.suite + 1 };
}

/* « Trop dur » : une étape plus petite, juste AVANT celle où il est. Elle devient la
   sienne ; celle qu'il n'arrivait pas à faire l'attend, avec ce qu'il y a déjà fait. */
export function glisserEtape(esc) {
  const c = etapeCourante(esc);
  if (!c || esc.etapes.length >= MAX_ETAPES) return esc;
  const etapes = [...esc.etapes];
  etapes.splice(esc.ici, 0, { id: esc.suite, texte: "", peur: c.peur, fois: 0 });
  return { ...esc, etapes, suite: esc.suite + 1 };
}

export function ecrireEtape(esc, id, texte) {
  return { ...esc, etapes: esc.etapes.map((x) => (x.id === id ? { ...x, texte: String(texte).replace(/\s+/g, " ").slice(0, LONGUEUR_ETAPE) } : x)) };
}

export function mesurerEtape(esc, id, peur) {
  if (![0, 1, 2, 3].includes(peur)) return esc;
  const i = esc.etapes.findIndex((x) => x.id === id);
  if (i < 0) return esc;
  // Une marche déjà montée garde sa place : on note seulement sa nouvelle mesure.
  return ranger({ ...esc, etapes: esc.etapes.map((x) => (x.id === id ? { ...x, peur } : x)) });
}

export function retirerEtape(esc, id) {
  const i = esc.etapes.findIndex((x) => x.id === id);
  if (i < 0) return esc;
  const etapes = esc.etapes.filter((x) => x.id !== id);
  const ici = Math.max(0, Math.min(i < esc.ici ? esc.ici - 1 : esc.ici, etapes.length - 1));
  return { ...esc, etapes, ici };
}

/* Il a affronté son étape : elle compte, quelle que soit la taille de Minus après.
   `remplacer` : revenu en arrière dans le MÊME passage, il a changé sa réponse ; l'étape
   n'est pas comptée deux fois, la trace est corrigée. */
export function affronter(esc, avant, apres, instant, remplacer) {
  const c = etapeCourante(esc);
  if (!c) return esc;
  const trace = { t: instant, etape: c.id, avant, apres };
  if (remplacer && esc.traces.length) return { ...esc, traces: [...esc.traces.slice(0, -1), trace] };
  return {
    ...esc,
    etapes: esc.etapes.map((x) => (x.id === c.id ? { ...x, fois: x.fois + 1 } : x)),
    traces: [...esc.traces, trace].slice(-MAX_TRACES),
  };
}

export function monter(esc) {
  return peutMonter(esc) ? { ...esc, ici: esc.ici + 1 } : esc;
}
