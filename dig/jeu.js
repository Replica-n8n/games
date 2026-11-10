/* Dig Zen : creuser, laver, dézoomer.
   Les trouvailles sont dans modeles.js (DIG_NIVEAUX). */
const $ = (id) => document.getElementById(id);
const NIV = DIG_NIVEAUX;

/* ================= Hasard ================= */
let graine = (Date.now() % 100000) + 7;
const hasard = () => { graine = (Math.imul(graine, 1664525) + 1013904223) >>> 0; return graine / 4294967296; };
const hsh = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
const cle = (x, y, z) => x + ',' + y + ',' + z;

/* ================= Les terres ================= */
const SOLS = {
  herbe:  { c: 0x7fb069, pv: 1, doux: true },
  sable:  { c: 0xe2c28a, pv: 1, doux: true },
  terre:  { c: 0xa87a50, pv: 1, doux: true },
  ponce:  { c: 0xb3a892, pv: 1, doux: true },
  cendre: { c: 0x8f8a84, pv: 1, doux: true },
  argile: { c: 0xb5654a, pv: 2, doux: false },
  roche:  { c: 0x8a93a0, pv: 3, doux: false },
  lave:   { c: 0x4a4346, pv: 3, doux: false },
  suie:   { c: 0x3f383c, pv: 1, doux: true },
  braise: { c: 0x74352b, pv: 1, doux: true },
  socle:  { c: 0x5a4f48, pv: 99, doux: false },
};
const C_BOUE = 0x4e3b28, cBoue = new THREE.Color(C_BOUE), cBrille = new THREE.Color(0xffd23a);
// Fin du lavage : passé BRILLE_A % la boue qui reste clignote en or ; à ASSEZ % on peut terminer, ou finir à 100 %.
const BRILLE_A = 85, ASSEZ = 96; let brille = 0, assez = false;

/* ================= Progression ================= */
// Chaque chaîne avance d'un cran à la fois (`fait[chaîne]` = nombre de fouilles finies) ; on passe de l'une à l'autre
// quand on veut, et les fouilles libres se font dans n'importe quel ordre.
const CHAINES = Object.keys(DIG_CHAINES), fait = {}; for (const c of CHAINES) fait[c] = 0;
const debut = (c) => NIV.findIndex((d) => d.chaine === c), longueur = (c) => NIV.filter((d) => d.chaine === c).length;
const rang = (i) => i - debut(NIV[i].chaine);                                    // la place d'une fouille dans sa chaîne
const suivante = (i) => NIV[i + 1] && !NIV[i].libre && NIV[i + 1].chaine === NIV[i].chaine ? i + 1 : -1;
const trouvee = (i) => NIV[i].libre ? libresFaits.has(NIV[i].id) : rang(i) < fait[NIV[i].chaine];
const libresFaits = new Set();
try { const s = JSON.parse(localStorage.getItem('dig-zen') || localStorage.getItem('dig-essai') || '{}');
  const lu = s.chaines || { pompei: s.fait };          // avant les chaînes, `fait` comptait Pompéi
  for (const c of CHAINES) fait[c] = Math.max(0, Math.min(longueur(c), +lu[c] || 0));
  for (const id of s.libres || []) if (NIV.some((d) => d.libre && d.id === id)) libresFaits.add(id);
} catch (e) { /* pas de stockage : on repart de zéro */ }
const sauver = () => { try { localStorage.setItem('dig-zen', JSON.stringify({ chaines: fait, libres: [...libresFaits] })); } catch (e) { /* pas de stockage : le jeu marche quand même */ } };

/* ================= Rendu : ce qui ne change pas d'un niveau à l'autre ================= */
const boite = $('scene'), toile = $('toile'), calque = $('calque');
const rendu = new THREE.WebGLRenderer({ canvas: toile, antialias: true, alpha: true });
rendu.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
rendu.shadowMap.enabled = true; rendu.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const ciel = new THREE.HemisphereLight(0xfff6e8, 0x7a6248, 0.7); scene.add(ciel);
const soleil = new THREE.DirectionalLight(0xfff0d8, 0.85);
soleil.castShadow = true; soleil.shadow.mapSize.set(2048, 2048);
soleil.shadow.bias = -0.0006; soleil.shadow.normalBias = 0.03; scene.add(soleil, soleil.target);
const GEO = new THREE.BoxGeometry(1, 1, 1);
const zero = new THREE.Matrix4().makeScale(0, 0, 0), tmpO = new THREE.Object3D(), tmpC = new THREE.Color();
const cam = new THREE.PerspectiveCamera(45, 1, 0.5, 600);
let az = -1.2, el = 1.0, dist = 60, distVoulue = 60, distBase = 60;
const centre = new THREE.Vector3();

// éclats de terre et gouttes
const NE = 400, eclats = new THREE.InstancedMesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), new THREE.MeshLambertMaterial(), NE), E = [];
for (let i = 0; i < NE; i++) { E.push({ vie: 0, p: new THREE.Vector3(), v: new THREE.Vector3() }); eclats.setMatrixAt(i, zero); eclats.setColorAt(i, tmpC.setHex(0xffffff)); }
eclats.frustumCulled = false; scene.add(eclats); let iE = 0;
function eclat(x, y, z, c, f = 1) {
  const e = E[iE]; eclats.setColorAt(iE, tmpC.setHex(c)); eclats.instanceColor.needsUpdate = true; iE = (iE + 1) % NE;
  e.vie = 0.9; e.p.set(x + 0.5, y + 0.5, z + 0.5); e.v.set((hasard() - 0.5) * 8 * f, (3 + hasard() * 7) * f, (hasard() - 0.5) * 8 * f);
}
function majEclats(dt) {
  for (let i = 0; i < NE; i++) { const e = E[i]; if (e.vie <= 0) continue;
    e.vie -= dt; e.v.y -= 25 * dt; e.p.addScaledVector(e.v, dt);
    if (e.vie <= 0) eclats.setMatrixAt(i, zero); else { tmpO.position.copy(e.p); tmpO.rotation.set(e.vie * 6, e.vie * 4, 0); tmpO.scale.setScalar(Math.min(1, e.vie * 2.5)); tmpO.updateMatrix(); eclats.setMatrixAt(i, tmpO.matrix); } }
  eclats.instanceMatrix.needsUpdate = true;
}
// le jet d'eau : un tuyau du bas de l'écran jusqu'au point visé
const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, 1, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.75 }));
jet.visible = false; scene.add(jet);

/* ================= Une trouvaille propre (mini du dézoom, vignette, vitrine) ================= */
function objetPropre(i) {
  const d = NIV[i], g = new THREE.Group(), a = [...d.vox.values()];
  const im = new THREE.InstancedMesh(GEO, new THREE.MeshLambertMaterial(), a.length);
  tmpO.rotation.set(0, 0, 0); tmpO.scale.setScalar(1);
  a.forEach((e, n) => { tmpO.position.set(e.x + 0.5, e.y + 0.5, e.z + 0.5); tmpO.updateMatrix(); im.setMatrixAt(n, tmpO.matrix); im.setColorAt(n, tmpC.setHex(e.c).offsetHSL(0, 0, (hsh(e.x, e.y, e.z) - 0.5) * 0.05)); });
  im.castShadow = true; im.receiveShadow = true; g.add(im);
  if (d.mini) g.add(poserMini(i));
  return g;
}
// la trouvaille précédente, à sa vraie taille dans celle-ci
function poserMini(i) {
  const d = NIV[i], prec = NIV[i - 1], k = d.mini.k, g = objetPropre(i - 1);
  g.scale.setScalar(1 / k);
  g.position.set(d.mini.pied[0] - prec.base[0] / k, d.mini.pied[1] - prec.base[1] / k, d.mini.pied[2] - prec.base[2] / k);
  return g;
}
for (const d of NIV) {       // la boîte de chaque trouvaille, pour la cadrer
  const b = { x0: 1e9, y0: 1e9, z0: 1e9, x1: -1e9, y1: -1e9, z1: -1e9 };
  for (const e of d.vox.values()) { b.x0 = Math.min(b.x0, e.x); b.x1 = Math.max(b.x1, e.x + 1); b.y0 = Math.min(b.y0, e.y); b.y1 = Math.max(b.y1, e.y + 1); b.z0 = Math.min(b.z0, e.z); b.z1 = Math.max(b.z1, e.z + 1); }
  d.boite = b;
}

/* ================= Le niveau en cours ================= */
let iN = 0, def, BX, BY, BZ, M = new Map(), racine = null, terre, squel, OS = [], VIS = [], visPart = {}, decPart = {};
let vu = new Set(), propres = new Set(), phase = 'attente', sortie = 0, t0 = 0, tSortie = 0;
const CENTRE = new THREE.Vector3();

function solEn(x, y, z) {
  if (y === 0) return 'socle';
  if (y === BY - 1) return def.dessus || 'herbe';
  return def.couches(y + Math.round(Math.sin(x * 0.31) * 0.8 + Math.cos(z * 0.43 + x * 0.1) * 0.7));
}
function colorer(e) {
  if (e.t === 'os') { tmpC.setHex(e.c).lerp(cBoue, e.sale * 0.9); if (brille && e.sale > 0.2) tmpC.lerp(cBrille, brille); } else tmpC.setHex(SOLS[e.s].c);
  tmpC.offsetHSL(0, 0, (hsh(e.x, e.y, e.z) - 0.5) * (e.t === 'os' ? 0.05 : 0.07));
  if (e.t === 'sol' && e.pv < SOLS[e.s].pv) tmpC.offsetHSL(0, -0.05, 0.08);   // entamé
  e.im.setColorAt(e.i, tmpC); e.im.instanceColor.needsUpdate = true;
}
function faireMaillage(filtre) {
  const a = [...M.values()].filter(filtre), im = new THREE.InstancedMesh(GEO, new THREE.MeshLambertMaterial(), Math.max(1, a.length));
  tmpO.rotation.set(0, 0, 0); tmpO.scale.setScalar(1);
  if (!a.length) im.setMatrixAt(0, zero);
  a.forEach((e, i) => { tmpO.position.set(e.x + 0.5, e.y + 0.5, e.z + 0.5); tmpO.updateMatrix(); im.setMatrixAt(i, tmpO.matrix); e.im = im; e.i = i; colorer(e); });
  im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; return im;
}
const V6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
/* La terre ne dessine que les cubes qui touchent l'air (la ville : 42 000 cubes, 32 images/s quand tout était dessiné).
   Les cubes montrés occupent les premières places du maillage (im.count) ; L[i] dit quel cube est à la place i. */
const aLAir = (e) => V6.some(([a, b, c]) => { const x = e.x + a, y = e.y + b, z = e.z + c; return y >= 0 && (x < 0 || x >= BX || y >= BY || z < 0 || z >= BZ || !M.has(cle(x, y, z))); });
function ecrire(e) { tmpO.rotation.set(0, 0, 0); tmpO.scale.setScalar(1); tmpO.position.set(e.x + 0.5, e.y + 0.5, e.z + 0.5); tmpO.updateMatrix(); e.im.setMatrixAt(e.i, tmpO.matrix); e.im.instanceMatrix.needsUpdate = true; colorer(e); }
function maillageTerre() {
  const a = [...M.values()].filter((e) => e.t === 'sol'), im = new THREE.InstancedMesh(GEO, new THREE.MeshLambertMaterial(), Math.max(1, a.length));
  for (const e of a) { e.im = im; e.montre = aLAir(e); }
  a.sort((p, q) => q.montre - p.montre);
  im.setColorAt(0, tmpC.setHex(0xffffff)); im.userData.L = a; im.count = a.filter((e) => e.montre).length;
  a.forEach((e, i) => { e.i = i; if (e.montre) ecrire(e); });
  im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; return im;
}
function montrer(e) {
  if (e.montre) return;
  const im = e.im, L = im.userData.L, n = im.count, autre = L[n];
  L[n] = e; L[e.i] = autre; autre.i = e.i; e.i = n; im.count = n + 1; e.montre = true; ecrire(e);
}
function cacher(e) {
  if (!e.montre) return;
  const im = e.im, L = im.userData.L, n = im.count - 1, dernier = L[n];
  L[e.i] = dernier; dernier.i = e.i; L[n] = e; e.i = n; im.count = n; e.montre = false;
  if (dernier !== e) ecrire(dernier);
}
const VERS_DEHORS = [[0, 1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [1, 1, 0], [-1, 1, 0], [0, 1, 1], [0, 1, -1]];

// rend à la carte graphique ce qu'un groupe a pris (le cube GEO est partagé : on le garde)
function jeter(g) { scene.remove(g); g.traverse((o) => { if (o.material) o.material.dispose(); if (o.geometry && o.geometry !== GEO) o.geometry.dispose(); if (o.isInstancedMesh) o.dispose(); }); }
function construire(i) {
  if (racine) jeter(racine);
  iN = i; def = NIV[i]; BX = def.BX; BY = def.BY; BZ = def.BZ;
  M = new Map(); racine = new THREE.Group(); scene.add(racine);
  const fixes = new Set((def.mini ? def.mini.cellules : []).map((c) => cle(...c)));
  for (let x = 0; x < BX; x++) for (let y = 0; y < BY; y++) for (let z = 0; z < BZ; z++) {
    const k = cle(x, y, z), o = def.vox.get(k);
    if (o) { M.set(k, { x, y, z, t: 'os', c: o.c, part: o.part, sale: 0.85 + hsh(x, y, z) * 0.15 }); continue; }
    if (fixes.has(k)) { M.set(k, { x, y, z, t: 'fixe' }); continue; }
    if (y > 0 && def.fosse(x, y, z)) continue;
    let s = solEn(x, y, z);
    if (s !== 'socle' && y !== BY - 1) {      // des cailloux durs, plus souvent contre la trouvaille
      const pres = V6.some(([a, b, c]) => def.vox.has(cle(x + a, y + b, z + c)));
      if (hasard() < (pres ? 0.12 : 0.04)) s = def.caillou;
    }
    M.set(k, { x, y, z, t: 'sol', s, pv: SOLS[s].pv });
  }
  terre = maillageTerre();
  squel = new THREE.Group(); squel.add(faireMaillage((e) => e.t === 'os'));
  if (def.mini) squel.add(poserMini(i));
  racine.add(terre, squel);
  // le socle en bois sous le bloc
  const b = new THREE.Mesh(new THREE.BoxGeometry(BX + 4, 1.2, BZ + 4), new THREE.MeshLambertMaterial({ color: 0x8a5a36 })); b.position.set(BX / 2, -0.6, BZ / 2); b.receiveShadow = true;
  const p = new THREE.Mesh(new THREE.BoxGeometry(BX + 5, 0.4, BZ + 5), new THREE.MeshLambertMaterial({ color: 0x6e4527 })); p.position.set(BX / 2, -1.3, BZ / 2);
  racine.add(b, p);
  // caméra et soleil à la mesure du bloc
  CENTRE.set(BX / 2, BY * 0.4, BZ / 2);
  const g = Math.max(BX, BY, BZ) * 1.1;
  soleil.position.set(CENTRE.x - g * 0.7, g * 1.8, CENTRE.z + g * 0.9); soleil.target.position.copy(CENTRE);
  Object.assign(soleil.shadow.camera, { left: -g, right: g, top: g, bottom: -g, near: 1, far: g * 5 }); soleil.shadow.camera.updateProjectionMatrix();
  // ce qu'on pourra laver : les voxels de la trouvaille visibles du dehors
  OS = [...M.values()].filter((e) => e.t === 'os');
  const plein = (x, y, z) => def.vox.has(cle(x, y, z));
  VIS = OS.filter((e) => VERS_DEHORS.some(([a, b2, c]) => { let x = e.x + a, y = e.y + b2, z = e.z + c; while (x >= 0 && x < BX && y < BY && z >= 0 && z < BZ) { if (plein(x, y, z)) return false; x += a; y += b2; z += c; } return true; }));
  visPart = {}; for (const pt of def.parts) visPart[pt] = VIS.filter((e) => e.part === pt);
  // ce qu'on peut DÉGAGER : parmi ces voxels, ceux qui touchent de la terre ou la fosse. Un sol caché sous un mur
  // ou sous la trouvaille précédente ne sera jamais à l'air : le compter rendait un morceau introuvable (les trottoirs de la rue).
  const terreOuAir = (x, y, z) => x >= 0 && x < BX && y >= 1 && y < BY && z >= 0 && z < BZ && !plein(x, y, z) && !fixes.has(cle(x, y, z));
  decPart = {}; for (const pt of def.parts) { const a = visPart[pt].filter((e) => V6.some(([i2, j2, k2]) => terreOuAir(e.x + i2, e.y + j2, e.z + k2))); decPart[pt] = a.length ? a : OS.filter((e) => e.part === pt); }
  vu = new Set(); propres = new Set(); sortie = 0; squel.position.y = 0; jet.visible = false; vie = null; retour = false; anims.length = 0; ambiance(0);
  $('os').innerHTML = def.parts.map((pt) => `<span data-p="${pt}">?</span>`).join('');
  for (const id of ['pioche', 'pinceau']) $(id).hidden = false;
  $('jet').hidden = true; $('sortir').hidden = true; $('fin').hidden = true; $('assez').hidden = true; brille = 0; assez = false;
  cadrer(); centre.copy(CENTRE);
  verifierDecouvertes(true); majHud();
}

function cadrer() {
  const w = boite.clientWidth, h = boite.clientHeight, a = w / h; rendu.setSize(w, h, false);
  cam.aspect = a; cam.updateProjectionMatrix();
  if (!def) return;
  distBase = (a < 0.8 ? 2.05 : 1.4) * Math.max(BX, BY * 1.15, BZ) * (def.recul || 1);
  if (!dezoom && !vitrine) { distVoulue = distBase; dist = distBase; }
}
new ResizeObserver(cadrer).observe(boite);

/* ================= Interface ================= */
const propreP = () => { let s = 0; for (const e of VIS) s += e.sale; return Math.round(100 * (1 - s / (VIS.length * 0.925))); };
function majHud() {
  const lav = ['lavage', 'fin', 'retour', 'vivante'].includes(phase), n = def.parts.length;      // une fois lavée, la barre reste sur « Propre »
  const p = lav ? Math.max(0, Math.min(100, propreP())) : degage;
  $('etatTxt').textContent = lav ? `Propre : ${p} %` : `Dégagé : ${p} %`;
  const b = $('etatBarre'); b.style.width = p + '%'; b.style.background = lav ? '#7fc8f0' : '#f0c060';
  for (const s of $('os').children) { const pt = s.dataset.p; if (vu.has(pt)) { s.textContent = pt; s.classList.add('vu'); } s.classList.toggle('propre', propres.has(pt)); }
  $('sortir').hidden = vu.size < n || phase !== 'fouille';
}
const v3 = new THREE.Vector3();
let dernierAvis = 0;
function bulle(t, x, y, z) {
  if (performance.now() - dernierAvis < 1500) return; dernierAvis = performance.now();
  v3.set(x, y, z).project(cam);
  const d = document.createElement('div'); d.className = 'bulle'; d.textContent = t;
  d.style.left = Math.min(boite.clientWidth - 130, Math.max(130, (v3.x + 1) / 2 * boite.clientWidth)) + 'px'; d.style.top = Math.max(110, (1 - v3.y) / 2 * boite.clientHeight) + 'px';
  calque.appendChild(d); setTimeout(() => d.remove(), 1300);
}
function annonce(part, propre = false) {
  const d = document.createElement('div'), nom = part[0].toUpperCase() + part.slice(1); d.className = 'trouve';
  d.innerHTML = propre ? `<small>Tout propre !</small><b>${nom}</b><small>${propres.size}/${def.parts.length} lavés</small>` : `<small>Morceau dégagé !</small><b>${nom}</b><small>${vu.size}/${def.parts.length}</small>`;
  calque.appendChild(d); setTimeout(() => d.remove(), 2200);
}
function recit(t) { const r = $('recit'); if (!t) { r.style.opacity = 0; setTimeout(() => { r.hidden = true; }, 600); return; } r.textContent = t; r.hidden = false; r.style.opacity = 1; }

/* ================= Creuser ================= */
const vide = (x, y, z) => x >= 0 && x < BX && z >= 0 && z < BZ && y >= 0 && y < BY && !M.has(cle(x, y, z));
const expose = (e) => V6.some(([a, b, c]) => vide(e.x + a, e.y + b, e.z + c));
function retirer(e) {      // un cube de terre s'en va : ses voisins enterrés touchent l'air à leur tour
  cacher(e); M.delete(cle(e.x, e.y, e.z));
  for (const [a, b, c] of V6) { const f = M.get(cle(e.x + a, e.y + b, e.z + c)); if (f && f.t === 'sol') montrer(f); }
}
// Un morceau ne compte que lorsqu'on le VOIT : SEUIL de sa surface à l'air libre.
// (Un seul voxel effleuré le cochait, et la liste annonçait une trouvaille invisible à l'écran.)
const SEUIL = 0.6; let degage = 0;
function verifierDecouvertes(muet = false) {
  let tout = 0, libre = 0;
  for (const pt of def.parts) {
    const a = decPart[pt]; let n = 0;
    for (const e of a) if (expose(e)) n++;
    tout += a.length; libre += n;
    if (vu.has(pt) || n < a.length * SEUIL) continue;
    vu.add(pt); if (muet) continue;
    annonce(pt); const e = a[0]; for (let k = 0; k < 10; k++) eclat(e.x, e.y + 1, e.z, 0xffe7a0, 0.6);
  }
  degage = Math.round(100 * libre / tout);
}
let outil = 'pioche', secousse = 0;
// lancer de rayon dans la grille : premier voxel plein, et la case vide juste avant
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function viser(cx, cy, oy = 0, osSeul = false) {
  const r = toile.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, cam);
  const O = [ray.ray.origin.x, ray.ray.origin.y - oy, ray.ray.origin.z], D = [ray.ray.direction.x, ray.ray.direction.y, ray.ray.direction.z], B = [BX, BY, BZ];
  // où le rayon entre dans le bloc
  let t = 0, tFin = Infinity;
  for (let a = 0; a < 3; a++) {
    if (Math.abs(D[a]) < 1e-9) { if (O[a] < 0 || O[a] >= B[a]) return null; continue; }
    let u = -O[a] / D[a], v = (B[a] - O[a]) / D[a]; if (u > v) [u, v] = [v, u];
    t = Math.max(t, u); tFin = Math.min(tFin, v);
  }
  if (t > tFin) return null;
  // puis de case en case : chaque case traversée est visitée une fois, dans l'ordre, aucune n'est sautée
  const c = [0, 0, 0], pas = [0, 0, 0], tBord = [0, 0, 0], tCase = [0, 0, 0];
  for (let a = 0; a < 3; a++) {
    c[a] = Math.min(B[a] - 1, Math.max(0, Math.floor(O[a] + D[a] * (t + 1e-4)))); pas[a] = Math.sign(D[a]);
    tCase[a] = pas[a] ? 1 / Math.abs(D[a]) : Infinity;
    tBord[a] = pas[a] > 0 ? (c[a] + 1 - O[a]) / D[a] : pas[a] < 0 ? (c[a] - O[a]) / D[a] : Infinity;
  }
  let avant = null;
  for (;;) {
    const e = M.get(cle(c[0], c[1], c[2]));
    if (e && (!osSeul || e.t === 'os')) return { e, avant: avant || [c[0] - pas[0], c[1] - pas[1], c[2] - pas[2]] };
    if (!e) avant = [c[0], c[1], c[2]];
    const a = tBord[0] < tBord[1] ? (tBord[0] < tBord[2] ? 0 : 2) : (tBord[1] < tBord[2] ? 1 : 2);
    c[a] += pas[a]; if (c[a] < 0 || c[a] >= B[a]) return null;
    tBord[a] += tCase[a];
  }
}
function frapper(h) {
  if (phase !== 'fouille') return;
  const { e } = h; let n = 0, osTouche = false, prochePres = false, tropDur = false;
  if (outil === 'pioche') {
    const [cx, cy, cz] = h.avant.map((q) => q + 0.5), R = def.piocheR;
    const colle = (x, y, z) => V6.some(([a, b, c]) => def.vox.has(cle(x + a, y + b, z + c)));
    for (let x = Math.floor(cx - R); x <= cx + R; x++) for (let y = Math.max(0, Math.floor(cy - R)); y <= cy + R; y++) for (let z = Math.floor(cz - R); z <= cz + R; z++) {
      const d2 = (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 + (z + 0.5 - cz) ** 2, f = M.get(cle(x, y, z));
      if (!f || f.t === 'fixe') continue;
      if (f.t === 'os') { if (d2 <= R * R) osTouche = true; continue; }
      if (d2 > R * R || f.s === 'socle') continue;
      if (SOLS[f.s].doux && colle(x, y, z)) { prochePres = true; continue; }
      f.pv--; if (f.pv <= 0) { retirer(f); n++; if (n % 2 === 0) eclat(x, y, z, SOLS[f.s].c, 1); } else colorer(f);
    }
    if (!n && (osTouche || prochePres)) bulle('Quelque chose juste là : le pinceau', h.avant[0], h.avant[1] + 3, h.avant[2]);
    secousse = Math.max(secousse, n ? 0.18 : 0.08);
  } else {
    // pinceau : seulement la terre meuble, jamais la trouvaille
    const R = def.pinceauR, m = Math.ceil(R), [cx, cy, cz] = [e.x + 0.5, e.y + 0.5, e.z + 0.5];
    for (let x = e.x - m; x <= e.x + m; x++) for (let y = Math.max(1, e.y - m); y <= e.y + m; y++) for (let z = e.z - m; z <= e.z + m; z++) {
      const f = M.get(cle(x, y, z)); if (!f || f.t !== 'sol') continue;
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 + (z + 0.5 - cz) ** 2 > R * R) continue;
      if (!SOLS[f.s].doux) { if (f === e) tropDur = true; continue; }
      retirer(f); n++; if (n % 2 === 0) eclat(x, y, z, SOLS[f.s].c, 0.5);
    }
    if (tropDur) bulle('Trop dur : la pioche !', e.x, e.y + 3, e.z);
    else if (e.t === 'os' && !n) bulle('Dégagé : le reste au jet d\'eau', e.x, e.y + 3, e.z);
  }
  verifierDecouvertes(); majHud();
}

/* ================= Toucher : creuser sur le bloc, tourner à côté ================= */
const doigts = new Map(); let geste = null, dernierCoup = 0, ecartPince = 0;
const zoomer = (f) => { distVoulue = Math.min(distBase * 1.7, Math.max(distBase * 0.3, distVoulue * f)); };
toile.addEventListener('pointerdown', (ev) => {
  toile.setPointerCapture(ev.pointerId); doigts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
  if (dezoom || retour || phase === 'attente' || phase === 'sortie') { geste = null; return; }
  if (doigts.size === 2) { const [a, b] = [...doigts.values()]; ecartPince = Math.hypot(a.x - b.x, a.y - b.y); geste = { type: 'pince' }; return; }
  // pendant le lavage, comme à la pioche : le doigt sur la trouvaille arrose, le doigt à côté fait tourner
  if (phase === 'lavage' && !vitrine) { geste = { type: viser(ev.clientX, ev.clientY, squel.position.y, true) ? 'lave' : 'tourne', x: ev.clientX, y: ev.clientY }; return; }
  const h = phase === 'fouille' && !vitrine ? viser(ev.clientX, ev.clientY) : null;
  if (h) { geste = { type: 'creuse', x: ev.clientX, y: ev.clientY }; frapper(h); dernierCoup = performance.now(); $('indice').hidden = true; }
  else geste = { type: 'tourne', x: ev.clientX, y: ev.clientY };
});
toile.addEventListener('pointermove', (ev) => {
  if (!doigts.has(ev.pointerId)) return; doigts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
  if (!geste) return;
  if (geste.type === 'pince' && doigts.size === 2) { const [a, b] = [...doigts.values()], e = Math.hypot(a.x - b.x, a.y - b.y); zoomer(ecartPince / e); ecartPince = e; return; }
  if (geste.type === 'tourne') { az -= (ev.clientX - geste.x) * 0.008; el = Math.min(1.45, Math.max(0.2, el + (ev.clientY - geste.y) * 0.006)); geste.x = ev.clientX; geste.y = ev.clientY; return; }
  if (geste.type === 'creuse' || geste.type === 'lave') { geste.x = ev.clientX; geste.y = ev.clientY; }
});
const lacher = (ev) => { doigts.delete(ev.pointerId); if (!doigts.size) geste = null; };
toile.addEventListener('pointerup', lacher); toile.addEventListener('pointercancel', lacher);
toile.addEventListener('wheel', (ev) => { ev.preventDefault(); zoomer(1 + ev.deltaY * 0.001); }, { passive: false });
document.addEventListener('dblclick', (ev) => ev.preventDefault()); document.addEventListener('gesturestart', (ev) => ev.preventDefault());
let tourneBtn = 0;
for (const [id, s] of [['g', 1], ['d', -1]]) { const b = $(id);
  b.addEventListener('pointerdown', () => { tourneBtn = s; }); for (const t of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(t, () => { tourneBtn = 0; }); }
for (const id of ['pioche', 'pinceau']) $(id).addEventListener('click', () => { outil = id; for (const j of ['pioche', 'pinceau']) $(j).setAttribute('aria-pressed', j === id); });

/* ================= Sortir la trouvaille, puis la laver ================= */
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
$('sortir').addEventListener('click', async () => {
  if (phase !== 'fouille') return;
  phase = 'sortie'; geste = null; majHud(); tSortie = performance.now();
  for (let y = BY - 1; y >= 1; y--) {         // la terre part couche par couche
    for (const e of [...M.values()]) if (e.t === 'sol' && e.y === y) { retirer(e); if (hasard() < 0.12) eclat(e.x, e.y, e.z, SOLS[e.s].c, 0.8); }
    await attendre(110);
  }
  sortie = 0.0001; distVoulue = distBase;
  await attendre(2200);
  phase = 'lavage'; for (const id of ['pioche', 'pinceau']) $(id).hidden = true; $('jet').hidden = false;
  for (const pt of def.parts) if (!visPart[pt].length) propres.add(pt);
  majHud();
});
const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vUp = new THREE.Vector3(0, 1, 0);
function laver(dt) {
  const oy = squel.position.y, h = viser(geste.x, geste.y, oy, true);
  if (!h) { jet.visible = false; return; }
  const cx = h.e.x + 0.5, cy = h.e.y + 0.5, cz = h.e.z + 0.5, R = def.jetR;
  vB.set(cx, cy + oy, cz); vA.set(0.3, -0.95, 0.93).unproject(cam);
  jet.visible = true; jet.position.copy(vA).add(vB).multiplyScalar(0.5); jet.scale.set(1, vA.distanceTo(vB), 1);
  jet.quaternion.setFromUnitVectors(vUp, vB.clone().sub(vA).normalize());
  for (const e of OS) {
    if (e.sale <= 0) continue;
    const d = Math.hypot(e.x + 0.5 - cx, e.y + 0.5 - cy, e.z + 0.5 - cz); if (d > R) continue;
    const avant = e.sale; e.sale = Math.max(0, e.sale - dt * 1.1 * (1 - d / R * 0.7)); colorer(e);
    if (avant > 0.3 && e.sale <= 0.3 && hasard() < 0.4) eclat(e.x, e.y + oy, e.z, C_BOUE, 0.5);
  }
  if (hasard() < 0.8) eclat(cx - 0.5, cy + oy, cz - 0.5, 0xd8f1ff, 0.45);
  for (const pt of def.parts) if (!propres.has(pt)) { const a = visPart[pt]; let ok = 0; for (const e of a) if (e.sale < 0.2) ok++; if (ok >= a.length * 0.9) { propres.add(pt); annonce(pt, true); } }
  majHud();
  const pp = propreP();
  if (pp >= 100) terminer();
  else if (!assez && (pp >= ASSEZ || propres.size === def.parts.length)) { assez = true; $('jet').hidden = true; $('assez').hidden = false; }
}
$('assez').addEventListener('click', terminer);
const mn = (ms) => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}`; };
function terminer() {
  if (phase !== 'lavage') return;
  const pct = Math.max(0, Math.min(100, propreP()));
  phase = 'fin'; geste = null; jet.visible = false; brille = 0; $('assez').hidden = true; const tFin = performance.now();
  for (const e of OS) { e.sale = 0; colorer(e); }
  for (const pt of def.parts) propres.add(pt);
  for (let k = 0; k < 40; k++) { const e = OS[Math.floor(hasard() * OS.length)]; eclat(e.x, e.y + squel.position.y + 1, e.z, 0xfff3c0, 0.8); }
  $('jet').hidden = true; majHud();
  if (def.libre) libresFaits.add(def.id); else fait[def.chaine] = Math.max(fait[def.chaine], rang(iN) + 1);
  sauver();
  const dernier = suivante(iN) < 0, moi = def;
  setTimeout(() => {
    if (phase !== 'fin' || def !== moi) return;      // on est déjà parti creuser ailleurs
    $('finTitre').textContent = def.titre;
    $('rang').textContent = def.sous + (dernier && !def.libre ? ` La chaîne « ${DIG_CHAINES[def.chaine]} » est complète.` : '');
    $('score').innerHTML = `<span>Temps de fouille</span><span>${mn(tSortie - t0)}</span><span>Temps de lavage</span><span>${mn(tFin - tSortie)}</span><span>Lavée</span><span>${pct >= 100 ? 'à 100 % !' : 'à ' + pct + ' %'}</span>`;
    const final = !def.libre && dernier && def.fin;      // la dernière fouille d'une chaîne a droit à sa fin
    $('suite').textContent = final ? 'Le grand retour' : dernier ? 'Voir l\'étagère' : 'Regarder autour';
    $('finEtagere').hidden = dernier && !final;
    $('fin').hidden = false;
  }, 1600);
}

/* ================= Le dézoom : la trouvaille devient le bout qui dépasse ================= */
let dezoom = null, enRoute = false;
const doux = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
async function regarderAutour() {
  $('fin').hidden = true; phase = 'attente'; enRoute = true;
  // la caméra se place du côté où la fosse du bloc suivant est ouverte
  const azVoulu = 1.2, a0 = az, e0 = el; let d = ((azVoulu - a0) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
  for (let t = 0; t < 1; t += 1 / 40) { const k = doux(t); az = a0 + d * k; el = e0 + (1.2 - e0) * k; await attendre(16); }
  az = azVoulu; el = 1.2;
  $('poussiere').classList.add('on'); await attendre(380);
  const precCentre = CENTRE.clone(), precDist = dist, suivant = suivante(iN), k = NIV[suivant].mini.k;
  dezoom = { t: 0 };                     // posé avant construire : cadrer() ne doit pas recadrer
  construire(suivant);
  const mini = squel.children[1];
  dezoom = { t: 0, dur: 6, c0: mini.position.clone().add(precCentre.multiplyScalar(1 / k)), c1: CENTRE.clone(), d0: precDist / k, d1: distBase, el0: el };
  dist = dezoom.d0; distVoulue = distBase; centre.copy(dezoom.c0);
  $('indice').hidden = true;
  await attendre(120); $('poussiere').classList.remove('on'); enRoute = false;
  recit(def.intro[1]);
}
function finDezoom() {
  dezoom = null; phase = 'fouille'; t0 = performance.now();
  setTimeout(() => recit(''), 2500);
  $('indice').textContent = 'Creuse autour pour découvrir la suite.'; $('indice').hidden = false;
}
$('suite').addEventListener('click', () => { if (suivante(iN) >= 0) regarderAutour(); else if (!def.libre && def.fin) grandRetour(); else ouvrirEtagere(); });
/* ================= Fin de chaîne : le grand retour, puis la scène vivante ================= */
// Des animations courtes : f(u) reçoit u de 0 à 1, la boucle les fait avancer.
const anims = [];
const tween = (dur, f) => new Promise((r) => anims.push({ t: 0, dur, f, r }));
const lisse = (u) => u * u * (3 - 2 * u);
function majAnims(dt) { for (let i = anims.length - 1; i >= 0; i--) { const a = anims[i]; a.t += dt; a.f(lisse(Math.min(1, a.t / a.dur))); if (a.t >= a.dur) { anims.splice(i, 1); a.r(); } } }
const cJour = new THREE.Color(0xfff0d8), cSoir = new THREE.Color(0xff9a5a);
let soir = 0;
function ambiance(k) {       // 0 = le jour de la fouille, 1 = le soir de la scène vivante
  soir = k; soleil.intensity = 0.85 - 0.5 * k; ciel.intensity = 0.7 - 0.22 * k; soleil.color.copy(cJour).lerp(cSoir, k);
  boite.classList.toggle('soir', k > 0.3); if (!k) boite.classList.remove('enfer', 'nuit');
}
let retour = false, vie = null;
async function grandRetour() {
  const moi = def; $('fin').hidden = true; phase = 'retour'; retour = true; $('indice').hidden = true;
  // la toute première trouvaille, tout au fond des poupées russes
  let g = squel, n = iN, k = 1; while (NIV[n].mini) { k *= NIV[n].mini.k; g = g.children[1]; n--; }
  const b = NIV[n].boite; g.updateWorldMatrix(true, false);
  const c1 = g.localToWorld(new THREE.Vector3((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2));
  const d1 = Math.max(b.x1 - b.x0, (b.y1 - b.y0) * 1.15, b.z1 - b.z0) * 2.4 / k;
  const c0 = centre.clone(), d0 = distBase, a0 = az, e0 = el, da = ((1.2 - a0) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
  const poser = (u) => { dist = Math.exp(Math.log(d0) + (Math.log(d1) - Math.log(d0)) * u); centre.lerpVectors(c1, c0, (dist - d1) / (d0 - d1)); az = a0 + da * u; el = e0 + (1.1 - e0) * u; };
  recit(def.fin.plonge);
  await tween(9, poser);
  recit(def.fin.depart);
  await attendre(2800);
  if (def !== moi) return;
  recit('');
  await tween(4.5, (u) => poser(1 - u));
  retour = false; dist = distVoulue = distBase;
  vivre();
}
// La scène vivante : ce que la trouvaille déclare dans `vivant` (fumée, lumières, braise, ce qui flotte).
function vivre() {
  phase = 'vivante'; const v = def.vivant, g = new THREE.Group(); squel.add(g);
  const basic = (c) => new THREE.MeshBasicMaterial({ color: c });
  vie = { t: 0, g, flotte: OS.filter(v.flotte || (() => false)) };
  // les lumières aux fenêtres : un petit carré clair sur une face libre d'un mur
  const fen = [];
  for (const e of OS) { if (!v.lumieres || !v.lumieres(e) || hsh(e.x + 3, e.y, e.z + 5) > 0.3) continue;
    const cote = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, c]) => !def.vox.has(cle(e.x + a, e.y, e.z + c)))[0]; if (cote) fen.push([e.x + 0.5 + cote[0] * 0.5, e.y + 0.55, e.z + 0.5 + cote[1] * 0.5]); }
  vie.fen = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), basic(0xffd97a), Math.max(1, fen.length)); vie.fenPos = fen; g.add(vie.fen);
  // la braise : la lave qui rougeoie
  const br = OS.filter(v.braise || (() => false));
  vie.braise = new THREE.InstancedMesh(new THREE.BoxGeometry(1.05, 1.05, 1.05), basic(0xff7a1a), Math.max(1, br.length)); g.add(vie.braise);
  tmpO.rotation.set(0, 0, 0); tmpO.scale.setScalar(br.length ? 1 : 0); br.forEach((e, i) => { tmpO.position.set(e.x + 0.5, e.y + 0.5, e.z + 0.5); tmpO.updateMatrix(); vie.braise.setMatrixAt(i, tmpO.matrix); });
  if (!br.length) vie.braise.setMatrixAt(0, zero);
  // la fumée : des bouffées qui montent et grossissent
  vie.fumee = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xe6e0d8 }), v.fumee ? 26 : 1); vie.fumee.frustumCulled = false; g.add(vie.fumee);
  if (!v.fumee) vie.fumee.setMatrixAt(0, zero);
  // les flammes : de petits cubes clairs qui montent et s'éteignent
  vie.feux = OS.filter(v.flammes || (() => false)).map((e) => [e.x + 0.5, e.y + 1, e.z + 0.5]);
  vie.feu = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), basic(0xffc23a), Math.max(1, vie.feux.length * 2)); vie.feu.frustumCulled = false; vie.feu.setMatrixAt(0, zero); g.add(vie.feu);
  // les néons : chacun garde sa couleur, et brille même la nuit
  const ne = OS.filter(v.neons || (() => false));
  vie.neons = new THREE.InstancedMesh(new THREE.BoxGeometry(1.06, 1.06, 1.06), basic(0xffffff), Math.max(1, ne.length)); g.add(vie.neons); vie.neons.setMatrixAt(0, zero);
  tmpO.rotation.set(0, 0, 0); tmpO.scale.setScalar(1); ne.forEach((e, i) => { tmpO.position.set(e.x + 0.5, e.y + 0.5, e.z + 0.5); tmpO.updateMatrix(); vie.neons.setMatrixAt(i, tmpO.matrix); vie.neons.setColorAt(i, tmpC.setHex(e.c)); });
  if (!ne.length) vie.neons.setColorAt(0, tmpC.setHex(0xffffff));
  // ce qui roule : un aller-retour le long de x (le train)
  vie.glisse = v.glisse ? OS.filter(v.glisse.filtre) : [];
  if (v.ciel) boite.classList.add(v.ciel);
  tween(3.5, ambiance); recit(def.fin.vivant); setTimeout(() => { if (phase === 'vivante') recit(''); }, 5000);
  $('retour').hidden = false;
}
function majVie(dt) {
  const v = def.vivant; vie.t += dt; const t = vie.t;
  tmpO.rotation.set(0, 0, 0);
  vie.fenPos.forEach((p, i) => { tmpO.position.set(p[0], p[1], p[2]); tmpO.scale.setScalar(soir * (0.85 + 0.15 * Math.sin(t * 3 + i * 1.7))); tmpO.updateMatrix(); vie.fen.setMatrixAt(i, tmpO.matrix); });
  if (!vie.fenPos.length) vie.fen.setMatrixAt(0, zero);
  vie.fen.instanceMatrix.needsUpdate = true;
  vie.braise.material.color.setHex(0xff7a1a).lerp(tmpC.setHex(0xffd23a), 0.5 + 0.5 * Math.sin(t * 2.2));
  if (v.fumee) { for (let i = 0; i < 26; i++) { const a = ((t * 0.16 + i / 26) % 1), s = 0.5 + a * 1.9;
      tmpO.position.set(v.fumee[0] + a * 4 + Math.sin(i * 2.4 + a * 5) * 0.7, v.fumee[1] + a * 9, v.fumee[2] + Math.cos(i * 1.9 + a * 4) * 0.7); tmpO.rotation.set(i, a * 2 + i, 0);
      tmpO.scale.setScalar(a > 0.8 ? s * (1 - a) * 5 : s); tmpO.updateMatrix(); vie.fumee.setMatrixAt(i, tmpO.matrix); }
    vie.fumee.instanceMatrix.needsUpdate = true; }
  vie.feux.forEach((p, i) => { for (let k = 0; k < 2; k++) { const a = (t * 0.9 + i * 0.37 + k * 0.5) % 1; tmpO.position.set(p[0] + Math.sin(i * 3.1 + a * 6 + k) * 0.22, p[1] + a * 1.5, p[2] + Math.cos(i * 2.3 + a * 5 + k) * 0.22); tmpO.rotation.set(a * 3, i, 0); tmpO.scale.setScalar(1.1 - a); tmpO.updateMatrix(); vie.feu.setMatrixAt(i * 2 + k, tmpO.matrix); } });
  if (vie.feux.length) { vie.feu.instanceMatrix.needsUpdate = true; vie.feu.material.color.setHex(0xffc23a).lerp(tmpC.setHex(0xff7a1a), 0.5 + 0.5 * Math.sin(t * 7)); }
  tmpO.rotation.set(0, 0, 0); tmpO.scale.setScalar(1);
  for (const e of vie.flotte) { tmpO.position.set(e.x + 0.5, e.y + 0.5 + 0.16 * Math.sin(t * 1.6 + Math.floor(e.x / 6)), e.z + 0.5); tmpO.updateMatrix(); e.im.setMatrixAt(e.i, tmpO.matrix); }
  if (vie.flotte.length) vie.flotte[0].im.instanceMatrix.needsUpdate = true;
  if (vie.glisse.length) { const dx = v.glisse.course * Math.sin(t * v.glisse.vitesse); for (const e of vie.glisse) { tmpO.position.set(e.x + 0.5 + dx, e.y + 0.5, e.z + 0.5); tmpO.updateMatrix(); e.im.setMatrixAt(e.i, tmpO.matrix); } vie.glisse[0].im.instanceMatrix.needsUpdate = true; }
  vie.neons.material.color.setScalar(0.82 + 0.18 * Math.sin(t * 5));
  if (!geste && !vitrine) az += dt * 0.1;
}

$('finEtagere').addEventListener('click', () => ouvrirEtagere());

/* ================= L'étagère et la vitrine ================= */
let vitrine = null;
function vignette(i) {
  const d = NIV[i]; if (d.img) return d.img;
  const r2 = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r2.setSize(320, 292); r2.setPixelRatio(1);
  const s = new THREE.Scene(); s.add(new THREE.HemisphereLight(0xfff6e8, 0x7a6248, 0.8)); const l = new THREE.DirectionalLight(0xfff0d8, 0.8); l.position.set(-30, 60, 40); s.add(l, objetPropre(i));
  const b = d.boite, c = new THREE.Vector3((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2), g = Math.max(b.x1 - b.x0, (b.y1 - b.y0) * 1.1, b.z1 - b.z0);
  const c2 = new THREE.PerspectiveCamera(35, 320 / 292, 0.5, 600); c2.position.set(c.x + g * 1.2, c.y + g * (d.elFin < 0.6 ? 0.5 : 1.1), c.z + g * 1.5); c2.lookAt(c);
  r2.render(s, c2); d.img = r2.domElement.toDataURL('image/png'); r2.dispose(); if (r2.forceContextLoss) r2.forceContextLoss();
  return d.img;
}
function ouvrirEtagere() {
  fermerVitrine(); desarmer();
  const pleine = (i) => `<button class="case" data-i="${i}"><img alt="" src="${vignette(i)}"><b>${NIV[i].nom}</b></button>`;
  const vide = '<div class="case vide" aria-label="Pas encore trouvée">?</div>';
  const creuser = (i) => `<button class="case creuser" data-creuser="${i}" aria-label="Creuser une fouille inconnue"><span>?</span><b>Creuser</b></button>`;
  // un rayon par chaîne : ce qui est trouvé, puis la prochaine fouille à creuser, puis des « ? »
  let h = '', l = '';
  for (const c of CHAINES) { h += `<h2>${DIG_CHAINES[c]}</h2><div class="cases">`;
    NIV.forEach((d, i) => { if (d.chaine === c) h += trouvee(i) ? pleine(i) : rang(i) === fait[c] ? creuser(i) : vide; }); h += '</div>'; }
  NIV.forEach((d, i) => { if (d.libre) l += trouvee(i) ? pleine(i) : creuser(i); });
  $('rayons').innerHTML = h; $('casesLibres').innerHTML = l; $('fin').hidden = true; $('etagere').hidden = false;
}
for (const id of ['rayons', 'casesLibres']) $(id).addEventListener('click', (ev) => {
  const b = ev.target.closest('button.case'); if (!b) return;
  if (b.dataset.creuser) { $('etagere').hidden = true; lancer(+b.dataset.creuser); } else ouvrirVitrine(+b.dataset.i);
});
function ouvrirVitrine(i) {
  $('etagere').hidden = true;
  const d = NIV[i], b = d.boite, g = new THREE.Group(), o = objetPropre(i); g.add(o);
  const lx = b.x1 - b.x0, lz = b.z1 - b.z0, socle = new THREE.Mesh(new THREE.BoxGeometry(lx + 4, 1.2, lz + 4), new THREE.MeshLambertMaterial({ color: 0x8a5a36 }));
  socle.position.set((b.x0 + b.x1) / 2, b.y0 - 0.6, (b.z0 + b.z1) / 2); socle.receiveShadow = true; g.add(socle);
  scene.add(g); racine.visible = false;
  const taille = Math.max(lx, (b.y1 - b.y0) * 1.15, lz);
  vitrine = { g, garde: { az, el, dist, distVoulue, distBase }, c: new THREE.Vector3((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2) };
  distBase = taille * (boite.clientWidth / boite.clientHeight < 0.8 ? 2.4 : 1.7) * (d.recul || 1); dist = distVoulue = distBase; el = Math.min(0.7, d.elFin); if (d.azFin !== undefined) az = d.azFin;
  soleil.target.position.copy(vitrine.c); if (vie) ambiance(0);
  document.body.classList.add('vitrine'); $('nomVitrine').textContent = d.nom; $('nomVitrine').hidden = false; $('retour').hidden = false;
}
function fermerVitrine() {
  if (!vitrine) return;
  jeter(vitrine.g); racine.visible = true; ({ az, el, dist, distVoulue, distBase } = vitrine.garde);
  soleil.target.position.copy(CENTRE); vitrine = null; if (vie) { ambiance(1); if (def.vivant.ciel) boite.classList.add(def.vivant.ciel); }
  document.body.classList.remove('vitrine'); $('nomVitrine').hidden = true; $('retour').hidden = phase !== 'vivante';
}
$('retour').addEventListener('click', ouvrirEtagere);
$('ouvrirEtagere').addEventListener('click', () => { if (!dezoom && !enRoute && !retour && phase !== 'sortie') ouvrirEtagere(); });
$('fermerEtagere').addEventListener('click', () => { $('etagere').hidden = true; if (phase === 'fin') $('fin').hidden = false; });
let sur = 0;             // deux touchers : le premier demande, le second efface
const desarmer = () => { clearTimeout(sur); sur = 0; $('toutRefaire').textContent = 'Tout recommencer'; };
$('toutRefaire').addEventListener('click', () => {
  if (!sur) { $('toutRefaire').textContent = 'Vider l\'étagère ? Touche encore pour confirmer'; sur = setTimeout(desarmer, 4000); return; }
  desarmer(); for (const c of CHAINES) fait[c] = 0; libresFaits.clear(); sauver(); $('etagere').hidden = true; lancer(0);
});

/* ================= Démarrer un niveau depuis sa carte ================= */
function lancer(i) {
  dezoom = null; recit(''); construire(i); phase = 'attente'; az = -1.2; el = 1.0; $('retour').hidden = true;
  $('introTitre').textContent = def.intro[0]; $('introTexte').textContent = def.intro[1];
  $('indice').textContent = 'Garde le doigt sur la terre pour creuser. Glisse à côté du bloc pour le tourner.'; $('indice').hidden = false;
  $('intro').hidden = false;
}
$('go').addEventListener('click', () => { $('intro').hidden = true; phase = 'fouille'; t0 = performance.now(); });

/* ================= Boucle ================= */
let tPrec = performance.now();
function image(t) {
  requestAnimationFrame(image);
  const dt = Math.min(0.05, (t - tPrec) / 1000); tPrec = t;
  if (geste && geste.type === 'lave' && phase === 'lavage' && !vitrine) laver(dt); else jet.visible = false;
  if (geste && geste.type === 'creuse' && t - dernierCoup > (outil === 'pioche' ? 200 : 110)) { const h = viser(geste.x, geste.y); if (h) frapper(h); dernierCoup = t; }
  if (phase === 'lavage' && (assez || propreP() >= BRILLE_A)) { brille = 0.6 + 0.35 * Math.sin(t / 170); for (const e of OS) if (e.sale > 0.2) colorer(e); }   // toute la boue, même celle qui ne compte pas : ce qui se voit sale doit briller
  majAnims(dt); if (vie) majVie(dt);
  az += tourneBtn * dt * 1.4;
  if (sortie) { sortie += dt; squel.position.y = Math.min(def.leve, sortie * 3); if (sortie < 2.6) { const k = Math.min(1, dt * 2); el += (def.elFin - el) * k;
      // une trouvaille qui a un profil (le dinosaure, la voiture) se présente de côté
      if (def.azFin !== undefined) az += (((def.azFin - az) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI) * k; } }
  if (phase === 'fin' && !$('fin').hidden && !vitrine) az += dt * 0.25;
  if (vitrine) { if (!geste) az += dt * 0.2; centre.copy(vitrine.c); dist += (distVoulue - dist) * Math.min(1, dt * 6); }
  else if (dezoom && dezoom.dur) {
    dezoom.t += dt; const e = doux(Math.min(1, dezoom.t / dezoom.dur));
    dist = Math.exp(Math.log(dezoom.d0) + (Math.log(dezoom.d1) - Math.log(dezoom.d0)) * e);
    centre.lerpVectors(dezoom.c0, dezoom.c1, (dist - dezoom.d0) / (dezoom.d1 - dezoom.d0));
    el = dezoom.el0 + (1.0 - dezoom.el0) * e;
    if (dezoom.t >= dezoom.dur) finDezoom();
  } else if (!dezoom && !retour) {
    dist += (distVoulue - dist) * Math.min(1, dt * 6);
    centre.copy(CENTRE); centre.y += squel.position.y;
  }
  secousse = Math.max(0, secousse - dt * 2);
  cam.near = Math.max(0.05, dist * 0.02); cam.updateProjectionMatrix();
  cam.position.set(centre.x + dist * Math.sin(az) * Math.cos(el), centre.y + dist * Math.sin(el), centre.z + dist * Math.cos(az) * Math.cos(el));
  if (secousse) { cam.position.x += (Math.random() - 0.5) * secousse; cam.position.y += (Math.random() - 0.5) * secousse; }
  cam.lookAt(centre);
  majEclats(dt);
  rendu.render(scene, cam);
}
{ const reste = NIV.findIndex((d, i) => !trouvee(i) && (d.libre || rang(i) === fait[d.chaine])); lancer(reste >= 0 ? reste : 0); }      // la première fouille qui reste à faire

/* ================= L'app installable : hors ligne, bouton Installer, version ================= */
// « Installer le jeu » reste sur la carte de départ tant que le jeu n'est pas installé.
let invitation = null;
const installe = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
const majInstaller = () => { $('installer').hidden = installe(); };
addEventListener('beforeinstallprompt', (ev) => { ev.preventDefault(); invitation = ev; });
addEventListener('appinstalled', () => { invitation = null; $('installer').hidden = true; $('aideInstaller').hidden = true; });
$('installer').addEventListener('click', async () => {
  if (invitation) { invitation.prompt(); try { await invitation.userChoice; } catch (e) { /* refusé : rien à faire */ } invitation = null; majInstaller(); return; }
  // pas d'invitation (iPhone, Firefox) : on dit où est le bouton du navigateur
  $('aideInstaller').textContent = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'Touche Partager, puis « Sur l\'écran d\'accueil ».' : 'Ouvre le menu du navigateur, puis « Installer » ou « Ajouter à l\'écran d\'accueil ».';
  $('aideInstaller').hidden = false;
});
majInstaller();
// ⚠️ Le service de l'arcade peut contrôler la page au premier passage : on ne demande la version qu'au NÔTRE.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const demander = (sw) => { const canal = new MessageChannel(); canal.port1.onmessage = (ev) => { $('version').textContent = 'Version ' + String(ev.data).replace('dig-', ''); }; sw.postMessage('version', [canal.port2]); };
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    reg.update().catch(() => {});       // un rechargement ne redemande pas sw.js tout seul
    const sw = reg.active || reg.waiting || reg.installing;
    if (reg.active) demander(reg.active); else if (sw) sw.addEventListener('statechange', () => { if (sw.state === 'activated') demander(sw); });
    // à l'étagère, entre deux fouilles : le bon moment pour chercher une nouvelle version
    $('ouvrirEtagere').addEventListener('click', () => reg.update().catch(() => {}));
  }).catch(() => {});
}
window.__essais = { get phase() { return phase; }, get niveau() { return def.id; }, lancer, fait };
requestAnimationFrame(image);
