// La sauvegarde en données : pièces, missions finies et meilleure note, carnet
// (captures par espèce). Une défaite n'efface rien : ses pièces et ses captures
// sont gardées.
// ⚠️ `v` change seulement si une ancienne sauvegarde ne se lit plus (majeur) :
// v 2 = le manoir en salles (2.0.0) ; une sauvegarde v 1 (le couloir) repart de zéro.

export const ORDRE = ['rdc', 'biblio', 'bal', 'grenier'];
const RANG = { S: 4, A: 3, B: 2, C: 1 };

export function sauvegardeVide() {
  return { v: 2, pieces: 0, missions: {}, carnet: {} };
}

const nombre = (n) => (Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0);

/** Une sauvegarde lue du stockage, quelle qu'elle soit, devient une sauvegarde valide. @param {any} s */
export function normaliser(s) {
  const n = sauvegardeVide();
  if (!s || typeof s !== 'object' || s.v !== 2) return n;
  n.pieces = nombre(s.pieces);
  for (const id of ORDRE) {
    const m = s.missions && s.missions[id];
    if (m && typeof m === 'object') n.missions[id] = { faite: !!m.faite, note: RANG[m.note] ? m.note : null };
  }
  if (s.carnet && typeof s.carnet === 'object') for (const k in s.carnet) n.carnet[k] = nombre(s.carnet[k]);
  return n;
}

/** @param {any} s @param {any} b le bilan d'une partie, finie ou perdue */
export function appliquerBilan(s, b) {
  const n = normaliser(s);
  n.pieces += b.pieces;
  for (const k in b.captures) n.carnet[k] = (n.carnet[k] || 0) + b.captures[k];
  if (b.fini) {
    const m = n.missions[b.mission] || { faite: false, note: null };
    m.faite = true;
    if (!m.note || RANG[b.note] > RANG[m.note]) m.note = b.note;
    n.missions[b.mission] = m;
  }
  return n;
}

/** Les missions s'ouvrent dans l'ordre. @param {any} s @param {string} id */
export function ouverte(s, id) {
  const i = ORDRE.indexOf(id);
  return i === 0 || !!(s.missions[ORDRE[i - 1]] && s.missions[ORDRE[i - 1]].faite);
}
