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
  RAIL: 0xdadce8, TRAVERSE: 0x5a3618, PATERE: 0xf0c040,
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
/** La matière d'un point. s : 0 mur, 1 sol, 2 plafond. v : variante de voie ('g', 'd' ou null). */
function matiere(s, x, y, z, cote, v, eclair) {
  EM = 0;
  const pz = Math.round(z / 12) * 12;
  if (s !== 1 && pz > 0 && Math.abs(z - pz) < 0.25) return M.PILIER;
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
    if (Math.abs(ax - 0.32) < 0.04) return M.RAIL;
    if (ax < 0.48 && fm(z, 0.8) < 0.16) return M.TRAVERSE;
    if (ax < 0.72) return ax > 0.6 ? M.TAPIS_B : M.TAPIS;
    return ((Math.floor(x * 1.25) + Math.floor(z * 1.25)) & 1) ? M.MARBRE_C : M.MARBRE_S;
  }
  return z % 2 < 0.3 ? M.POUTRE : M.PLAFOND;
}

/** @type {ImageData | null} */
let img = null, buf = null;

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{camZ: number, horizon: number, branche?: any}} p
 * @param {number} [eclair] 0 à 1, l'éclair dans les fenêtres
 */
export function dessinerDecor(ctx, p, eclair = 0) {
  if (!img) { img = ctx.createImageData(W, H); buf = new Uint32Array(img.data.buffer); }
  const camZ = p.camZ, b = p.branche;
  for (let py = 0; py < H; py++) {
    const dy = (py - p.horizon + 0.5) / FOCALE;
    const tS = dy > 1e-4 ? SOL / dy : 1e9, tP = dy < -1e-4 ? PLAFOND / dy : 1e9;
    const tSP = tS < tP ? tS : tP, sp = tS < tP ? 1 : 2;
    const ligne = py * W, by = (py & 3) << 2;
    for (let px = 0; px < W; px++) {
      const dx = colDX[px];
      let t = colMur[px], s = 0;
      if (tSP < t) { t = tSP; s = sp; }
      if (t > PORTEE) { buf[ligne + px] = LOIN; continue; }
      const z = camZ + t;
      const v = b && z >= b.z0 && z < b.z1 ? b.cote : null;
      const mat = matiere(s, s === 0 ? (dx < 0 ? -DEMI_LARGEUR : DEMI_LARGEUR) : dx * t, dy * t, z, dx < 0 ? -1 : 1, v, eclair);
      const c = 1 - t / PORTEE;
      let L = c * c * 1.15 + eclair * 0.3 * c;
      if (EM && L < EM) L = EM;
      let lv = (L * (LV - 1) + BAYER[by + (px & 3)]) | 0;
      if (lv > LV - 1) lv = LV - 1; else if (lv < 0) lv = 0;
      buf[ligne + px] = RAMPES[mat][lv];
    }
  }
  ctx.putImageData(img, 0, 0);
}
