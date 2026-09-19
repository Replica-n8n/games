// Paper Race : les six couleurs de voiture, CALCULÉES, jamais choisies à l'œil.
//   node tools/paper-race-couleurs.mjs            cherche les 4 teintes qui manquent
//   node tools/paper-race-couleurs.mjs --controle vérifie la palette de ui.js
// Contraintes : bleu et rouge d'origine gardés ; texte blanc lisible dessus
// (boutons, carte de fin : 4,5:1) ; lisible sur le bitume (3:1) ; et deux
// voitures toujours distinctes, en vision normale ET pour les trois daltonismes
// (simulation de Machado 2009, sévérité 1). Les numéros sur les voitures
// doublent la couleur : elle ne doit jamais être la seule information.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const BITUME = '#D6D8D1', BLANC = '#FFFFFF', NUIT = '#131315';
const SEUIL = 0.075;            // distance OKLab minimale, sous chaque vision

const hex2rgb = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const rgb2hex = (c) => '#' + c.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const lin = (v) => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
const delin = (v) => v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
const lum = (h) => { const [r, g, b] = hex2rgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contraste = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

// Machado, Oliveira, Fernandes 2009, sévérité 1.0, en RVB linéaire
const MACHADO = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]]
};
const VISIONS = ['normale', 'protan', 'deutan', 'tritan'];
function vue(h, vision) {
  const c = hex2rgb(h).map(lin);
  if (vision === 'normale') return c;
  return MACHADO[vision].map(r => Math.max(0, Math.min(1, r[0] * c[0] + r[1] * c[1] + r[2] * c[2])));
}
function oklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
function oklch2hex(L, C, h) {
  const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180);
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
  if (rgb.some(v => v < -0.001 || v > 1.001)) return null;     // hors de l'écran
  return rgb2hex(rgb.map(delin));
}
const dist = (a, b, vision) => { const x = oklab(vue(a, vision)), y = oklab(vue(b, vision)); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
const pire = (a, b) => Math.min(...VISIONS.map(v => dist(a, b, v)));
const lisible = (h) => contraste(h, BLANC) >= 4.5 && contraste(h, BITUME) >= 3;

// la version claire, pour les traits et textes sur le fond sombre (4,5:1 sur la nuit)
function claire(h) {
  const [L, a, b] = oklab(hex2rgb(h).map(lin));
  const C = Math.hypot(a, b), H = Math.atan2(b, a) * 180 / Math.PI;
  for (let l = L; l <= 0.95; l += 0.01) {
    // la teinte d abord : on éclaircit plutôt que de griser (un violet gris ne se nomme plus)
    for (let c = C; c >= C * 0.6; c -= 0.01) { const x = oklch2hex(l, c, H); if (x && contraste(x, NUIT) >= 4.5) return x; }
  }
  return '#FFFFFF';
}

function bilan(pal) {
  let min = Infinity, paire = null;
  for (let i = 0; i < pal.length; i++) for (let j = i + 1; j < pal.length; j++) {
    const d = pire(pal[i], pal[j]); if (d < min) { min = d; paire = [i, j]; }
  }
  return { min, paire };
}

if (process.argv.includes('--controle')) {
  const ui = fs.readFileSync(path.join(ici, '..', 'paper-race', 'ui.js'), 'utf8');
  const m = ui.match(/const COUL = \[([^\]]+)\]/), noms = ui.match(/const NOMS = \[([^\]]+)\]/);
  const cst = Object.fromEntries([...ui.matchAll(/(\w+) = '(#[0-9A-Fa-f]{6})'/g)].map(x => [x[1], x[2]]));
  const pal = m[1].split(',').map(s => s.trim()).map(s => s.startsWith("'") ? s.slice(1, -1) : cst[s]);
  let ko = 0;
  if (pal.length !== 6 || noms[1].split(',').length !== 6) { console.log('ECHEC : 6 couleurs et 6 noms attendus'); ko++; }
  for (const h of pal) if (!lisible(h)) { console.log(`ECHEC : ${h} illisible (blanc ${contraste(h, BLANC).toFixed(2)}, bitume ${contraste(h, BITUME).toFixed(2)})`); ko++; }
  const b = bilan(pal);
  if (b.min < SEUIL) { console.log(`ECHEC : ${pal[b.paire[0]]} et ${pal[b.paire[1]]} trop proches (${b.min.toFixed(3)} < ${SEUIL})`); ko++; }
  const css = fs.readFileSync(path.join(ici, '..', 'paper-race', 'index.html'), 'utf8');
  for (let i = 2; i < pal.length; i++) if (!css.includes(`--c${i}:${pal[i]}`)) { console.log(`ECHEC : --c${i}:${pal[i]} absent du CSS`); ko++; }
  if (ko) process.exit(1);
  console.log(`COULEURS OK : ${pal.join(' ')} · écart minimal ${b.min.toFixed(3)} (seuil ${SEUIL}), texte blanc lisible partout`);
} else {
  const base = ['#2B4C8C', '#B03A2E'];
  // une couleur par famille qu'on sait NOMMER : « à Vert » se dit, « à Bleu 2 » non
  const FAMILLES = {
    // L : clarté OKLab minimale, sinon le maximin choisit des presque-noirs (« ocre » #341600)
    vert: { h: [135, 175], c: 0.08, L: 0.40 }, ocre: { h: [55, 85], c: 0.09, L: 0.45 }, violet: { h: [290, 325], c: 0.09, L: 0.40 },
    rose: { h: [340, 365], c: 0.10, L: 0.42 }, graphite: { h: [0, 360], c: 0, cmax: 0.025, L: 0.24, Lmax: 0.36 }
  };
  const dans = (h, [a, b]) => (h >= a && h <= b) || (h + 360 >= a && h + 360 <= b);
  const parFamille = {};
  for (const [nom, f] of Object.entries(FAMILLES)) {
    parFamille[nom] = [];
    for (let L = 0.24; L <= 0.62; L += 0.02) for (let C = 0; C <= 0.2; C += 0.01) for (let h = 0; h < 360; h += 3) {
      if (!dans(h, f.h) || C < f.c || (f.cmax !== undefined && C > f.cmax) || L < f.L - 1e-9 || (f.Lmax && L > f.Lmax + 1e-9)) continue;
      const x = oklch2hex(L, C, h); if (x && lisible(x)) parFamille[nom].push(x);
    }
  }
  const noms = Object.keys(FAMILLES);
  const perms = (l) => l.length <= 1 ? [l] : l.flatMap((x, i) => perms(l.filter((_, j) => j !== i)).map(r => [x, ...r]));
  let pal = null, meilleur = -1, familles = null;
  for (const exclue of noms) {
    for (const ordre of perms(noms.filter(n => n !== exclue))) {
      const p = base.slice();
      for (const f of ordre) {
        let best = null, bd = -1;
        for (const c of parFamille[f]) { const d = Math.min(...p.map(q => pire(q, c))); if (d > bd) { bd = d; best = c; } }
        p.push(best);
      }
      const m = bilan(p).min;
      if (m > meilleur) { meilleur = m; pal = p; familles = ordre; }
    }
  }
  console.log('familles  ', ['bleu', 'rouge', ...familles].join(' '));
  const b = bilan(pal);
  console.log('palette   ', pal.join(' '));
  console.log('claires   ', pal.map(claire).join(' '));
  console.log('blanc     ', pal.map(h => contraste(h, BLANC).toFixed(1)).join(' '));
  console.log('bitume    ', pal.map(h => contraste(h, BITUME).toFixed(1)).join(' '));
  console.log('écart min ', b.min.toFixed(3), 'entre', pal[b.paire[0]], 'et', pal[b.paire[1]]);
  for (const v of VISIONS) console.log('  ' + v.padEnd(8), pal.map(h => rgb2hex(vue(h, v).map(delin))).join(' '));
}
