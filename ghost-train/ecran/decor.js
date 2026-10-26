// Ghost Train : le couloir en 3D, par lancer de rayons au pixel (repris de la POC),
// tramé et assombri avec la distance. Direction « Série B » : couleurs franches.
// Les rails du wagon courent au milieu du tapis. Chaque salle a ses matières ;
// la voie choisie à l'aiguillage change le décor jusqu'à ce qu'elle rejoigne le tronc.
import { W, H, CX, FOCALE, DEMI_LARGEUR, SOL, PLAFOND, PORTEE } from '../moteur/constantes.js';

const LV = 8, BRUME = [14, 8, 24];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const pack = (r, g, b) => ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
const fm = (a, b) => ((a % b) + b) % b;

const MATS = {
  LOIN: 0x0e0818,
  PAPIER_A: 0x6a2e86, PAPIER_B: 0x582474, PAPIER_POIS: 0x9a58c0,
  VERT_A: 0x2a6a5a, VERT_B: 0x225a4c, VERT_RAYE: 0x3e8a72,
  BOIS: 0x8a3a1e, BOIS_C: 0xb4562c, BOIS_S: 0x40160a, OR: 0xf0c040,
  TAPIS: 0xb01830, TAPIS_B: 0xf0c040, MARBRE_C: 0xc8c4e0, MARBRE_S: 0x2c2848,
  PLAFOND: 0x2c1c40, POUTRE: 0x4a2a1c, PILIER: 0x2a140a,
  VITRE: 0x7fd0ff, CADRE: 0x2a1408, TOILE: 0x1c3428, TOILE2: 0x3a2030, OEIL: 0xff3030,
  RAIL: 0xdadce8, TRAVERSE: 0x5a3618, PATERE: 0xf0c040, RAIL_S: 0x6a6a80, NUIT: 0x07040f,
  // la Bibliothèque (repris de la POC)
  ETAGERE: 0x4c2c18, ETAGERE_S: 0x1a0e08, LIV0: 0x8e2c2c, LIV1: 0x2c6040, LIV2: 0x2e3e84, LIV3: 0xa08030, LIV4: 0x6e2e70,
  PARQUET_A: 0x6e4428, PARQUET_B: 0x5c3620, PARQUET_J: 0x2a180c, PLAFOND_B: 0x2c1c12,
  // la Salle de bal : miroirs, néons et piste qui s'allume sur les temps
  MIROIR: 0x5a6890, MIROIR_R: 0xc8d6ff, OR_BAL: 0xd8b050, NEON_M: 0xff3fa4, NEON_C: 0x3fe8ff,
  DALLE: 0x1e1236, DALLE_M: 0xff3fa4, DALLE_C: 0x3fe8ff, DALLE_O: 0xffd34a, DALLE_V: 0x9a5cff, PLAFOND_S: 0x150c26, PROJO: 0xfff0c0,
  // le Grenier : planches, chevrons, toiles d'araignée, la lune par une lucarne
  PLANCHE_A: 0x5e4a38, PLANCHE_B: 0x4c3a2c, PLANCHE_J: 0x201810, TOILE_A: 0xb4b4c8, LUNE: 0xcfe6ff, CHEVRON: 0x3a2a1c,
};
const M = {}, RAMPES = [];
for (const k in MATS) {
  const h = MATS[k], r = h >> 16 & 255, g = h >> 8 & 255, b = h & 255, a = new Uint32Array(LV);
  for (let i = 0; i < LV; i++) { const q = i / (LV - 1); a[i] = pack(Math.round(BRUME[0] + (r - BRUME[0]) * q), Math.round(BRUME[1] + (g - BRUME[1]) * q), Math.round(BRUME[2] + (b - BRUME[2]) * q)); }
  M[k] = RAMPES.length; RAMPES.push(a);
}
const LOIN = RAMPES[M.LOIN][LV - 1];

// Les colonnes ne changent jamais : direction du rayon et distance jusqu'au mur
const colDX = new Float32Array(W), colMur = new Float32Array(W);
for (let px = 0; px < W; px++) { const dx = (px - CX + 0.5) / FOCALE; colDX[px] = dx; colMur[px] = Math.abs(dx) > 1e-6 ? DEMI_LARGEUR / Math.abs(dx) : 1e9; }

let EM = 0;
// La salle et l'horloge de la musique de la partie en cours (réglées par dessinerDecor)
let SALLE = 'hall', TEMPS = 0, PHASE = 0;
function hh(n) { n = Math.imul(n ^ 61 ^ (n >>> 16), 9); n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return n >>> 0; }

/** Murs et plafond des salles 2 à 4 (s : 0 mur, 2 plafond), sol hors des rails (s : 1). */
function autreSalle(s, x, y, z, cote) {
  if (SALLE === 'bibliotheque') {
    if (s === 0) {
      if (z % 4 < 0.28 || y > 0.95) return M.ETAGERE;
      const yy = y + 1.5, rayon = (yy / 0.5) | 0, f = yy % 0.5;
      if (f < 0.06) return M.ETAGERE;
      const bi = (z * 9) | 0, hv = hh(bi * 7 + rayon * 131 + (cote > 0 ? 999 : 0));
      if (f < 0.08 + ((hv >> 3) & 3) * 0.045) return M.ETAGERE_S;
      if ((z * 9) % 1 < 0.12) return M.ETAGERE_S;
      return M.LIV0 + (hv % 5);
    }
    if (s === 1) {
      const pl = Math.floor(x * 3.5), fx = x * 3.5 - pl;
      if (fx < 0.08) return M.PARQUET_J;
      const off = (hh(pl + 500) % 100) / 50;
      if ((z + off) % 2.2 < 0.05) return M.PARQUET_J;
      return pl & 1 ? M.PARQUET_A : M.PARQUET_B;
    }
    if (z % 2 < 0.22 || fm(x * 1.5, 1) < 0.1) return M.ETAGERE;
    return M.PLAFOND_B;
  }
  if (SALLE === 'bal') {
    const pouls = 1 - PHASE;
    if (s === 0) {
      const pz = z % 2.5;
      if (pz < 0.22) return M.OR_BAL;
      if (y > 0.8) return y > 0.86 ? M.DALLE : M.OR_BAL;
      if (y < -0.95 && y > -1.08) { EM = 0.45 + pouls * 0.5; return ((z / 2.5 | 0) + TEMPS) & 1 ? M.NEON_M : M.NEON_C; }
      if (y < -1.08) return M.PLAFOND_S;
      const r = pz + y * 0.6;
      if (fm(r, 1.2) < 0.08 || fm(r + 0.18, 1.2) < 0.03) return M.MIROIR_R;
      return M.MIROIR;
    }
    if (s === 1) {
      const tx = Math.floor(x * 1.3), tz = Math.floor(z * 1.3);
      if (fm(x * 1.3, 1) < 0.06 || fm(z * 1.3, 1) < 0.06) return M.DALLE;
      const hv = hh(tx * 73856093 ^ tz * 19349663 ^ (TEMPS * 83492791));
      if ((hv & 3) === 0) { EM = 0.35 + pouls * 0.55; return M.DALLE_M + ((hv >> 2) & 3); }
      return M.DALLE;
    }
    const sp = fm(z, 3);
    if (sp > 1.3 && sp < 1.7 && Math.abs(fm(x + 0.75, 1.5) - 0.75) < 0.14) { EM = 0.85; return M.PROJO; }
    return M.PLAFOND_S;
  }
  // le Grenier
  if (s === 0) {
    const pz = z % 3;
    if (pz < 0.3) return M.CHEVRON;
    if (y < -1.1 && pz < 1.0) { const a = ((pz - 0.3) * 14 + (y + 1.5) * 14) | 0, b = ((pz - 0.3) * 20 - (y + 1.5) * 6 + 40) | 0; if (a % 3 === 0 || b % 5 === 0) return M.TOILE_A; }
    if (cote < 0 && z % 11 > 5 && z % 11 < 5.8 && y < 0.1 && y > -0.9) { EM = 0.8; return M.LUNE; }
    const v = (y + 2) * 6; if (v % 1 < 0.1) return M.PLANCHE_J; return (v | 0) & 1 ? M.PLANCHE_A : M.PLANCHE_B;
  }
  if (s === 1) {
    const pl = Math.floor(x * 2.2), fx = x * 2.2 - pl;
    if (fx < 0.07) return M.PLANCHE_J;
    const off = (hh(pl + 77) % 100) / 40; if ((z + off) % 3 < 0.05) return M.PLANCHE_J;
    return pl & 1 ? M.PLANCHE_A : M.PLANCHE_B;
  }
  return z % 1.5 < 0.25 ? M.CHEVRON : M.PLANCHE_J;
}
/** La matière d'un point. s : 0 mur, 1 sol, 2 plafond. v : variante de voie ('g', 'd' ou null). */
function matiere(s, x, y, z, cote, v, eclair, f) {
  EM = 0;
  const pz = Math.round(z / 12) * 12;
  if (s !== 1 && pz > 0 && Math.abs(z - pz) < 0.25) return M.PILIER;
  if (SALLE !== 'hall' && (s === 0 || s === 2)) return autreSalle(s, x, y, z, cote);
  if (s === 0) {
    if (y > 0.24) { const u = z % 1.6; if (u < 0.07 || y > 1.07) return M.BOIS_S; if (u < 0.14 || y < 0.33 || y > 0.98) return M.BOIS_C; return M.BOIS; }
    if (y > 0.15) return M.OR;
    // la galerie (voie de gauche) a un tableau tous les 4 pas, le tronc tous les 8
    const pas = v === 'g' ? 4 : 8, wz = z % pas;
    if (wz > pas / 2 - 1 && wz < pas / 2 + 0.8 && y > -1.1 && y < -0.1) {
      const u = wz - (pas / 2 - 1), q = y + 1.1;
      if (cote < 0 && v !== 'g') {
        if (u < 0.1 || u > 1.7 || q < 0.08 || q > 0.92 || Math.abs(u - 0.9) < 0.05 || Math.abs(q - 0.45) < 0.04) return M.CADRE;
        EM = 0.55 + eclair * 0.45; return M.VITRE;
      }
      if (u < 0.14 || u > 1.66 || q < 0.12 || q > 0.88) return M.OR;
      if (q > 0.32 && q < 0.42 && ((u > 0.62 && u < 0.75) || (u > 1.05 && u < 1.18))) { EM = 0.8; return M.OEIL; }
      return (Math.floor(z / pas) & 1) ? M.TOILE2 : M.TOILE;
    }
    // le vestiaire (voie de droite) : papier vert rayé et patères dorées
    if (v === 'd') {
      if (y > -0.35 && y < -0.25 && fm(z, 1.2) < 0.12) return M.PATERE;
      return fm(z * 3, 1) < 0.18 ? M.VERT_RAYE : ((z * 1.5 | 0) & 1 ? M.VERT_A : M.VERT_B);
    }
    const zz = z * 4;
    if ((zz | 0) & 1) { const fy = fm(y * 4, 1), fz = zz % 1; if (fz > 0.35 && fz < 0.65 && fy > 0.35 && fy < 0.65) return M.PAPIER_POIS; return M.PAPIER_B; }
    return M.PAPIER_A;
  }
  if (s === 1) {
    const ax = Math.abs(x);
    // l'aiguillage : après z0 la voie se dédouble, chaque voie file vers son tunnel ;
    // la voie donnée par le levier brille, l'autre reste terne
    if (f && z > f.z0) {
      const e = Math.min(1, (z - f.z0) / (f.zMur - f.z0)) * 1.2;
      for (const [c, k] of /** @type {[number, string][]} */ ([[-e, 'g'], [e, 'd']])) {
        const ex = Math.abs(x - c);
        if (Math.abs(ex - 0.32) < 0.04) return f.cote === k ? M.RAIL : M.RAIL_S;
        if (ex < 0.48 && fm(z, 0.8) < 0.16) return M.TRAVERSE;
      }
      if (SALLE !== 'hall') return autreSalle(s, x, y, z, cote);
      if (ax < 0.72 + e) return ax > 0.6 + e ? M.TAPIS_B : M.TAPIS;
      return ((Math.floor(x * 1.25) + Math.floor(z * 1.25)) & 1) ? M.MARBRE_C : M.MARBRE_S;
    }
    if (Math.abs(ax - 0.32) < 0.04) return M.RAIL;
    if (ax < 0.48 && fm(z, 0.8) < 0.16) return M.TRAVERSE;
    if (SALLE !== 'hall') return autreSalle(s, x, y, z, cote);
    if (ax < 0.72) return ax > 0.6 ? M.TAPIS_B : M.TAPIS;
    return ((Math.floor(x * 1.25) + Math.floor(z * 1.25)) & 1) ? M.MARBRE_C : M.MARBRE_S;
  }
  if (s === 3) {
    // le mur du fond de l'aiguillage, percé de deux tunnels en arc
    for (const c of [-1.2, 1.2]) {
      const u = (x - c) / 0.7;
      if (Math.abs(u) <= 1 && y > -0.75 + u * u * 0.35) return M.NUIT;
      if (Math.abs(u) <= 1.12 && y > -0.86 + u * u * 0.35) return M.OR;
    }
    if (y > 0.24) return y > 0.98 ? M.BOIS_S : M.BOIS;
    if (y > 0.15) return M.OR;
    return M.PAPIER_A;
  }
  return z % 2 < 0.3 ? M.POUTRE : M.PLAFOND;
}

/** @type {ImageData | null} */
let img = null, buf = null;
/** @type {HTMLCanvasElement | null} */
let toile = null, tctx = null;

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{camZ: number, horizon: number, branche?: any, fourche?: {z0: number, zMur: number, cote: 'g'|'d'}, mission?: any, nTemps?: number, phase?: number}} p
 * @param {number} [eclair] 0 à 1, l'éclair dans les fenêtres
 */
export function dessinerDecor(ctx, p, eclair = 0) {
  if (!img) {
    toile = document.createElement('canvas'); toile.width = W; toile.height = H;
    tctx = toile.getContext('2d');
    img = tctx.createImageData(W, H); buf = new Uint32Array(img.data.buffer);
  }
  const camZ = p.camZ, b = p.branche, f = p.fourche;
  SALLE = (p.mission && p.mission.salle) || 'hall'; TEMPS = p.nTemps || 0; PHASE = p.phase || 0;
  for (let py = 0; py < H; py++) {
    const dy = (py - p.horizon + 0.5) / FOCALE;
    const tS = dy > 1e-4 ? SOL / dy : 1e9, tP = dy < -1e-4 ? PLAFOND / dy : 1e9;
    const tSP = tS < tP ? tS : tP, sp = tS < tP ? 1 : 2;
    const ligne = py * W, by = (py & 3) << 2;
    for (let px = 0; px < W; px++) {
      const dx = colDX[px];
      let t = colMur[px], s = 0;
      if (tSP < t) { t = tSP; s = sp; }
      if (f && camZ + t > f.zMur) { t = f.zMur - camZ; s = 3; }
      if (t > PORTEE) { buf[ligne + px] = LOIN; continue; }
      const z = camZ + t;
      const v = b && z >= b.z0 && z < b.z1 ? b.cote : null;
      const mat = matiere(s, s === 0 ? (dx < 0 ? -DEMI_LARGEUR : DEMI_LARGEUR) : dx * t, dy * t, z, dx < 0 ? -1 : 1, v, eclair, f);
      const c = 1 - t / PORTEE;
      let L = c * c * 1.15 + eclair * 0.3 * c;
      if (EM && L < EM) L = EM;
      let lv = (L * (LV - 1) + BAYER[by + (px & 3)]) | 0;
      if (lv > LV - 1) lv = LV - 1; else if (lv < 0) lv = 0;
      buf[ligne + px] = RAMPES[mat][lv];
    }
  }
  // ⚠️ JAMAIS de putImageData sur la toile du jeu : sur un téléphone Android, la
  // toile se peint par carreaux de 64 pixels et le décor écrit en brut passait
  // PAR-DESSUS le wagon, l'appareil et la radio dessinés après lui (vu par Julie,
  // 1.0.0). Le décor s'écrit dans une toile à part, recopiée comme une image.
  tctx.putImageData(img, 0, 0);
  ctx.drawImage(toile, 0, 0);
}
