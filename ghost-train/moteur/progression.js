// La sauvegarde en données : pièces, missions finies et meilleure note, dossier
// du manoir (secrets trouvés), carnet (captures par espèce). Une défaite n'efface
// rien : ses pièces, ses captures et ses secrets sont gardés.
// ⚠️ `v` change seulement si une ancienne sauvegarde ne se lit plus (majeur).

export const ORDRE = ['hall', 'bibliotheque', 'bal', 'grenier'];
const RANG = { S: 4, A: 3, B: 2, C: 1 };

export function sauvegardeVide() {
  return { v: 1, pieces: 0, missions: {}, dossier: [], carnet: {} };
}

const nombre = (n) => (Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0);

/** Une sauvegarde lue du stockage, quelle qu'elle soit, devient une sauvegarde valide. @param {any} s */
export function normaliser(s) {
  const n = sauvegardeVide();
  if (!s || typeof s !== 'object' || s.v !== 1) return n;
  n.pieces = nombre(s.pieces);
  for (const id of ORDRE) {
    const m = s.missions && s.missions[id];
    if (m && typeof m === 'object') n.missions[id] = { faite: !!m.faite, note: RANG[m.note] ? m.note : null };
  }
  if (Array.isArray(s.dossier)) n.dossier = [...new Set(s.dossier.filter((x) => typeof x === 'string'))];
  if (s.carnet && typeof s.carnet === 'object') for (const k in s.carnet) n.carnet[k] = nombre(s.carnet[k]);
  return n;
}

/** @param {any} s @param {any} b le bilan d'une partie, finie ou perdue */
export function appliquerBilan(s, b) {
  const n = normaliser(s);
  n.pieces += b.pieces;
  for (const k in b.captures) n.carnet[k] = (n.carnet[k] || 0) + b.captures[k];
  for (const id of b.secrets) if (!n.dossier.includes(id)) n.dossier.push(id);
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
