// ===== Circuit quadrillé : le son =====
// Tout est synthétisé par Web Audio : aucun fichier, rien à télécharger, marche hors ligne.
// Le contexte ne s'éveille qu'au premier geste (bouton Jouer), sinon le navigateur le refuse.
let sonOn = true;

let AC = null, bruit = null;

function audio() {
  // un telephone endort le contexte quand l'app passe en arriere-plan : on le reveille
  if (AC) { if (AC.state === 'suspended' && AC.resume) AC.resume().catch(() => {}); return AC; }
  try {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    AC = new C();
    const n = AC.sampleRate * 1.2;
    bruit = AC.createBuffer(1, n, AC.sampleRate);
    const d = bruit.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { AC = null; }
  return AC;
}

function souffle(dur, f0, f1, vol, q) {
  const ac = audio(); if (!ac || !sonOn) return;
  try {
    const src = ac.createBufferSource(); src.buffer = bruit;
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass';
    bp.Q.value = q || 1.2;
    bp.frequency.setValueAtTime(f0, ac.currentTime);
    bp.frequency.exponentialRampToValueAtTime(f1, ac.currentTime + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(vol, ac.currentTime + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    src.connect(bp); bp.connect(g); g.connect(ac.destination);
    src.start(); src.stop(ac.currentTime + dur + 0.05);
  } catch (e) { }
}

function note(freq, dur, vol, type, delai) {
  const ac = audio(); if (!ac || !sonOn) return;
  try {
    const t0 = ac.currentTime + (delai || 0);
    const o = ac.createOscillator(); o.type = type || 'sine'; o.frequency.value = freq;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  } catch (e) { }
}

function moteur(vit, dur) {
  const ac = audio(); if (!ac || !sonOn) return;
  try {
    const t0 = ac.currentTime, f0 = 66 + vit * 30;
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t0);
    o.frequency.linearRampToValueAtTime(f0 * 1.55, t0 + dur * 0.65);
    o.frequency.linearRampToValueAtTime(f0 * 1.12, t0 + dur);
    const o2 = ac.createOscillator(); o2.type = 'square'; o2.frequency.setValueAtTime(f0 * 1.51, t0);
    o2.frequency.linearRampToValueAtTime(f0 * 2.3, t0 + dur * 0.65);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(700 + vit * 220, t0); lp.Q.value = 3.5;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.055 + vit * 0.012, t0 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.08);
    o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(ac.destination);
    o.start(t0); o2.start(t0); o.stop(t0 + dur + 0.12); o2.stop(t0 + dur + 0.12);
    if (vit >= 3) souffle(dur * 0.8, 2200 + vit * 300, 900, 0.035 + vit * 0.004, 0.8);
  } catch (e) { }
}
const sonCrisse = (f) => souffle(0.28, 2600, 1100, 0.05 + f * 0.02, 4.5);
const sonBip = (haut) => note(haut ? 1050 : 620, haut ? 0.5 : 0.18, 0.11, 'square');
const sonSortie = () => { souffle(0.55, 3200, 700, 0.17, 3.2); note(90, 0.3, 0.13, 'triangle', 0.15); };
const sonTension = () => note(180, 0.16, 0.055, 'triangle');
const sonClic = () => note(520, 0.05, 0.05, 'square');
const sonVictoire = () => { note(523, .16, .09, 'triangle', 0); note(659, .16, .09, 'triangle', .13); note(880, .30, .10, 'triangle', .26); };
