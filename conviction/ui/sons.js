// Les sons de la scène d'accusation, fabriqués par le navigateur (Web Audio) :
// aucun fichier à télécharger, rien à mettre en cache. Deux sons seulement,
// choisis par Julie : le CLAC des barreaux et le coup du tampon « Affaire
// classée ». Silencieux tant que le réglage `son` est coupé.

/** @type {AudioContext | null} */
let ctx = null;

/** Le contexte audio, créé au premier geste (les navigateurs l'exigent). */
function audio() {
  if (!ctx) {
    const C = window.AudioContext ?? /** @type {any} */ (window).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Un bruit blanc de `duree` secondes. @param {AudioContext} a @param {number} duree */
function bruit(a, duree) {
  const b = a.createBuffer(1, Math.ceil(a.sampleRate * duree), a.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = a.createBufferSource();
  s.buffer = b;
  return s;
}

/** Une enveloppe : attaque brève, puis décroissance exponentielle. @param {AudioContext} a @param {number} t @param {number} fort @param {number} duree */
function enveloppe(a, t, fort, duree) {
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(fort, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  return g;
}

/** CLAC : la grille de fer qui tombe. Un choc métallique (partiels
 *  inharmoniques), le cliquetis des barreaux, puis le bruit sourd au sol. */
export function clac() {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + 0.01;
  const sortie = a.createGain();
  sortie.gain.value = 0.55;
  sortie.connect(a.destination);
  // Le choc du métal.
  for (const [f, fort, duree] of [[196, 0.5, 0.9], [523, 0.35, 0.7], [1187, 0.22, 0.5], [2237, 0.12, 0.35], [3410, 0.07, 0.25]]) {
    const o = a.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f * 1.02, t);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.08);
    const g = enveloppe(a, t, fort, duree);
    o.connect(g).connect(sortie);
    o.start(t); o.stop(t + duree + 0.05);
  }
  // L'impact : un coup de bruit aigu, très court.
  const n = bruit(a, 0.12);
  const hp = a.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 2600; hp.Q.value = 0.8;
  n.connect(hp).connect(enveloppe(a, t, 0.9, 0.1)).connect(sortie);
  n.start(t);
  // Le cliquetis des barreaux qui vibrent encore.
  for (let k = 1; k <= 3; k++) {
    const tk = t + 0.09 * k;
    const c = bruit(a, 0.05);
    const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200 + k * 400; bp.Q.value = 6;
    c.connect(bp).connect(enveloppe(a, tk, 0.35 / k, 0.05)).connect(sortie);
    c.start(tk);
  }
  // Le bruit sourd au sol.
  const o = a.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(90, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.25);
  o.connect(enveloppe(a, t, 0.8, 0.3)).connect(sortie);
  o.start(t); o.stop(t + 0.35);
}

/** TAMPON : le coup sec du tampon encreur sur le papier du dossier. */
export function tampon() {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + 0.01;
  const sortie = a.createGain();
  sortie.gain.value = 0.6;
  sortie.connect(a.destination);
  // Le bois du manche qui frappe la table.
  const o = a.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(160, t);
  o.frequency.exponentialRampToValueAtTime(60, t + 0.09);
  o.connect(enveloppe(a, t, 1, 0.14)).connect(sortie);
  o.start(t); o.stop(t + 0.2);
  // Le papier écrasé : un bruit étouffé.
  const n = bruit(a, 0.09);
  const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
  n.connect(lp).connect(enveloppe(a, t, 0.7, 0.08)).connect(sortie);
  n.start(t);
}
