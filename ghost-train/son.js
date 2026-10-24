// Ghost Train : musique et bruitages en synthèse Web Audio (repris de la POC).
// ⚠️ La synthèse a été refusée pour Pièce à conviction : ici c'est le genre
// (chiptune 16 bits), mais c'est à Julie de l'écouter et de trancher.
// Rien ne joue avant un premier geste (règle des navigateurs).

let AC = null, maitre = null, gMusique = null, gSons = null, gRayon = null, bruit = null;
let musique = false, prochaine = 0, pas = 0, bpm = 124;
const vol = { musique: 0.6, sons: 0.8 };
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Le thème du manoir : une basse qui descend, une mélodie inquiète en mineur
const MANOIR = {
  basse: [38, 34, 31, 33],
  air: [69, 74, 77, 76, 74, 69, 65, 69, 70, 74, 77, 74, 70, 65, 62, 65, 67, 70, 74, 73, 74, 70, 67, 64, 69, 73, 76, 79, 77, 76, 73, 69],
};

export function demarrer() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  const C = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
  if (!C) return;
  try { AC = new C(); } catch { return; }
  maitre = AC.createGain(); maitre.gain.value = 1; maitre.connect(AC.destination);
  gMusique = AC.createGain(); gMusique.gain.value = vol.musique * 0.45; gMusique.connect(maitre);
  gSons = AC.createGain(); gSons.gain.value = vol.sons; gSons.connect(maitre);
  bruit = AC.createBuffer(1, AC.sampleRate * 0.6 | 0, AC.sampleRate);
  const d = bruit.getChannelData(0);
  let s = 12345;
  for (let i = 0; i < d.length; i++) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; d[i] = s / 2147483648 - 1; }
  // le bourdonnement du rayon, toujours là, ouvert seulement quand on tire
  gRayon = AC.createGain(); gRayon.gain.value = 0;
  const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.7;
  const o1 = AC.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 92;
  const o2 = AC.createOscillator(); o2.type = 'square'; o2.frequency.value = 184.7;
  const lfo = AC.createOscillator(); lfo.frequency.value = 9; const lg = AC.createGain(); lg.gain.value = 24;
  lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
  o1.connect(bp); o2.connect(bp); bp.connect(gRayon); gRayon.connect(gSons);
  o1.start(); o2.start(); lfo.start();
  prochaine = AC.currentTime + 0.1;
}

/** @param {{musique: number, sons: number}} r */
export function volumes(r) {
  vol.musique = r.musique; vol.sons = r.sons;
  if (!AC) return;
  gMusique.gain.setTargetAtTime(r.musique * 0.45, AC.currentTime, 0.05);
  gSons.gain.setTargetAtTime(r.sons, AC.currentTime, 0.05);
}

/** @param {boolean} oui */
export function rayon(oui) { if (AC) gRayon.gain.setTargetAtTime(oui ? 0.15 : 0, AC.currentTime, 0.03); }

/** @param {boolean} oui @param {number} [tempo] */
export function jouerMusique(oui, tempo = 124) {
  musique = oui; bpm = tempo;
  if (oui && AC) { prochaine = AC.currentTime + 0.1; pas = 0; }
}

export function silence() { if (AC && AC.state === 'running') AC.suspend(); }
export function reprendre() { if (AC && AC.state === 'suspended') AC.resume(); }

function ton(f, t, dur, type, g, dest, glisse) {
  const o = AC.createOscillator(), v = AC.createGain();
  o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
  if (glisse) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * glisse), t + dur);
  v.gain.setValueAtTime(g || 0.2, t); v.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(v); v.connect(dest || gSons); o.start(t); o.stop(t + dur + 0.02);
}
function souffle(t, dur, g, freq, dest, type) {
  const s = AC.createBufferSource(); s.buffer = bruit;
  const f = AC.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.setValueAtTime(freq || 2000, t);
  if (!type) f.frequency.exponentialRampToValueAtTime(200, t + dur);
  const v = AC.createGain(); v.gain.setValueAtTime(g || 0.3, t); v.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(v); v.connect(dest || gSons); s.start(t); s.stop(t + dur);
}

let dernierePiece = 0;
/** @param {string} nom */
export function bruitage(nom) {
  if (!AC) return;
  const t = AC.currentTime;
  switch (nom) {
    case 'capture': [72, 76, 79, 84].forEach((m, i) => ton(mtof(m), t + i * 0.055, 0.09, 'square', 0.12)); break;
    case 'piege': souffle(t, 0.08, 0.3, 3000); ton(220, t, 0.12, 'square', 0.12, gSons, 0.5); break;
    case 'coup': souffle(t, 0.35, 0.5, 1200); ton(160, t, 0.3, 'sawtooth', 0.15, gSons, 0.4); break;
    case 'merci': [84, 88, 91, 96].forEach((m, i) => ton(mtof(m), t + i * 0.08, 0.25, 'triangle', 0.16)); break;
    case 'lumi': [79, 76, 79].forEach((m, i) => ton(mtof(m), t + i * 0.1, 0.12, 'triangle', 0.08)); break;
    case 'triste': [76, 72, 67].forEach((m, i) => ton(mtof(m), t + i * 0.12, 0.22, 'triangle', 0.18)); break;
    case 'assiette': ton(1400, t, 0.12, 'triangle', 0.06, gSons, 0.7); break;
    case 'pop': souffle(t, 0.06, 0.25, 5000); ton(1800, t, 0.05, 'square', 0.04); break;
    case 'pouf': souffle(t, 0.15, 0.25, 3000); break;
    case 'rire': [84, 81, 84, 81, 79].forEach((m, i) => ton(mtof(m), t + i * 0.07, 0.08, 'square', 0.06)); break;
    case 'surchauffe': souffle(t, 0.6, 0.25, 6000); ton(880, t, 0.3, 'square', 0.06, gSons, 0.5); break;
    case 'levier': ton(330, t, 0.1, 'square', 0.1); ton(440, t + 0.12, 0.1, 'square', 0.1); break;
    case 'aiguille': souffle(t, 0.2, 0.4, 900); ton(110, t, 0.2, 'square', 0.2, gSons, 0.5); break;
    case 'secret': [79, 83, 86, 91].forEach((m, i) => ton(mtof(m), t + i * 0.06, 0.18, 'triangle', 0.14)); break;
    case 'boss': ton(55, t, 1.2, 'sawtooth', 0.2, gSons, 0.5); souffle(t, 1, 0.2, 500); break;
    case 'victoire': [74, 77, 81, 86, 81, 86, 89].forEach((m, i) => ton(mtof(m), t + i * 0.11, 0.2, 'square', 0.12)); break;
    case 'defaite': [69, 65, 62, 57, 50].forEach((m, i) => ton(mtof(m), t + i * 0.16, 0.3, 'triangle', 0.18)); break;
    case 'depart': [62, 65, 69, 74].forEach((m, i) => ton(mtof(m), t + i * 0.07, 0.12, 'square', 0.12)); break;
    case 'piece': if (t - dernierePiece < 0.05) break; dernierePiece = t; ton(1760, t, 0.05, 'square', 0.04); ton(2640, t + 0.05, 0.08, 'square', 0.04); break;
    case 'clic': ton(660, t, 0.04, 'square', 0.05); break;
  }
}

// La musique se programme un peu en avance, à pas de double-croche
setInterval(() => {
  if (!AC || !musique || AC.state !== 'running') return;
  const dc = 60 / bpm / 4;
  if (prochaine < AC.currentTime) prochaine = AC.currentTime + 0.05;
  while (prochaine < AC.currentTime + 0.15) {
    const mesure = pas >> 4, s = pas & 15;
    if ((s & 1) === 0) {
      const r = MANOIR.basse[mesure];
      ton(mtof(s % 4 === 0 ? r : r + 12), prochaine, dc * 1.6, 'triangle', 0.35, gMusique);
      if (!(s === 14 && (mesure & 1))) ton(mtof(MANOIR.air[pas >> 1]), prochaine, dc * 1.7, 'square', 0.085, gMusique);
    }
    if (s % 4 === 2) souffle(prochaine, 0.04, 0.12, 8000, gMusique);
    if (s % 8 === 0) ton(120, prochaine, 0.12, 'sine', 0.4, gMusique, 0.3);
    prochaine += dc; pas = (pas + 1) % 64;
  }
}, 25);
