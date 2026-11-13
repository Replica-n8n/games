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
  sablefin: { c: 0xe9d6a4, pv: 1, doux: true, coule: true },      // il tombe et glisse quand on creuse dessous
  vase:   { c: 0x5f7a72, pv: 1, doux: true },
  neige:  { c: 0xf4f7fa, pv: 1, doux: true },
  tasse:  { c: 0xdbe6ee, pv: 1, doux: true },       // la neige tassée, sous la croûte
  glace:  { c: 0x9fd0ea, pv: 3, doux: false },      // la croûte de glace : trois coups de pioche
  gel:    { c: 0x6f6258, pv: 1, doux: true },       // la terre gelée, tout au fond
  // ce qui habille le dessus (SURFACES) : tout s'en va d'un coup de pioche ou de pinceau
  touffe: { c: 0x5f9a4f, pv: 1, doux: true }, seche: { c: 0xa9b06a, pv: 1, doux: true }, touffe_s: { c: 0x7f8f4a, pv: 1, doux: true },
  fleur_r: { c: 0xd8433a, pv: 1, doux: true }, fleur_j: { c: 0xf2c744, pv: 1, doux: true }, fleur_b: { c: 0xf6f2e8, pv: 1, doux: true }, fleur_v: { c: 0x9a6ad8, pv: 1, doux: true },
  galet: { c: 0x9a9488, pv: 1, doux: true }, dalle: { c: 0xa9a9b0, pv: 1, doux: true }, fissure: { c: 0x6f6f78, pv: 1, doux: true },
  braise_v: { c: 0xff7a1a, pv: 1, doux: true }, caillou_n: { c: 0x2f2a2e, pv: 1, doux: true },
  coquille: { c: 0xf6e6d8, pv: 1, doux: true, coule: true }, roseau: { c: 0x7a9a4a, pv: 1, doux: true, coule: true }, flaque: { c: 0x6ab8e0, pv: 1, doux: true, coule: true },
  congere: { c: 0xffffff, pv: 1, doux: true }, trace: { c: 0xcfdbe6, pv: 1, doux: true },
  corail: { c: 0xe8746a, pv: 2, doux: false, coule: true },       // dur, mais posé dans le sable : il descend avec lui au lieu de rester en l'air
  // Dracula : l'humus noir du sous-bois, et des racines dures ; Camelot : la craie, et ses silex
  humus: { c: 0x3d2c22, pv: 1, doux: true }, racine: { c: 0x6a4428, pv: 3, doux: false },
  mousse: { c: 0x4f6a3a, pv: 1, doux: true }, fougere: { c: 0x3f7a3a, pv: 1, doux: true }, champi: { c: 0xc0392b, pv: 1, doux: true }, feuille: { c: 0x8a5a2a, pv: 1, doux: true },
  craie: { c: 0xe8e4d6, pv: 1, doux: true }, silex: { c: 0x3a3f4a, pv: 3, doux: false },
  // Lisbonne : les gravats du tremblement de terre de 1755 (deux coups), des éclats d'azulejos (durs), le pavé en vagues noires et blanches
  gravats: { c: 0xb8a088, pv: 2, doux: false }, tesson: { c: 0x3a6ab8, pv: 3, doux: false }, paveb: { c: 0xeeeae2, pv: 1, doux: true }, paven: { c: 0x4a4a52, pv: 1, doux: true },
  // l'Eldorado : la terre noire des Andes, des pépites d'or (dures) ; Babylone : le limon du fleuve, le bitume des briques ;
  // Pétra : le grès en couches roses et rouges ; Uruk : la brique crue fondue, et les cônes d'argile de ses mosaïques
  terrenoire: { c: 0x2e241e, pv: 1, doux: true }, pepite: { c: 0xe0b030, pv: 3, doux: false }, limon: { c: 0xb8a888, pv: 1, doux: true }, bitume: { c: 0x1e1a1c, pv: 2, doux: false },
  gres: { c: 0xd88a6a, pv: 1, doux: true }, gresr: { c: 0xb8604a, pv: 1, doux: true }, crue: { c: 0xc8a878, pv: 1, doux: true }, cone: { c: 0x8a3a2a, pv: 3, doux: false },
  socle:  { c: 0x5a4f48, pv: 99, doux: false },
};
/* Le dessus de chaque lieu : sa matière, des taches d'une autre matière, et ce qui dépasse (chance par case). */
const SURFACES = {
  pre:      { dessus: 'herbe', deco: [['touffe', 0.1], ['fleur_r', 0.015], ['fleur_j', 0.015], ['fleur_b', 0.015], ['galet', 0.012]] },
  garrigue: { dessus: 'seche', tache: ['terre', 0.75], deco: [['touffe_s', 0.07], ['fleur_v', 0.03], ['galet', 0.04]] },
  ville:    { dessus: 'dalle', tache: ['fissure', 0.95], deco: [['touffe', 0.035], ['galet', 0.012]] },
  cendre:   { dessus: 'cendre', tache: ['suie', 0.6], deco: [['caillou_n', 0.05], ['braise_v', 0.02]] },
  plage:    { dessus: 'sablefin', tache: ['flaque', 1.05], deco: [['roseau', 0.04], ['coquille', 0.03]] },
  neige:    { dessus: 'neige', tache: ['trace', 0.95], deco: [['congere', 0.09]] },
  desert:   { dessus: 'sable', tache: ['terre', 0.9], deco: [['touffe_s', 0.03], ['galet', 0.03]] },
  calcada:  { dessus: 'paveb', vagues: 'paven', deco: [['touffe', 0.02], ['galet', 0.01]] },
  sousbois: { dessus: 'humus', tache: ['mousse', 0.6], deco: [['fougere', 0.07], ['feuille', 0.08], ['champi', 0.015], ['galet', 0.015]] },
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
const libresFaits = new Set(); let dernier = '';      // la dernière chaîne jouée : c'est elle que « Continuer » propose
try { const s = JSON.parse(localStorage.getItem('dig-zen') || localStorage.getItem('dig-essai') || '{}');
  const lu = s.chaines || { pompei: s.fait };          // avant les chaînes, `fait` comptait Pompéi
  for (const c of CHAINES) fait[c] = Math.max(0, Math.min(longueur(c), +lu[c] || 0));
  for (const id of s.libres || []) if (NIV.some((d) => d.libre && d.id === id)) libresFaits.add(id);
  if (CHAINES.includes(s.dernier)) dernier = s.dernier;
} catch (e) { /* pas de stockage : on repart de zéro */ }
const sauver = () => { try { localStorage.setItem('dig-zen', JSON.stringify({ chaines: fait, libres: [...libresFaits], dernier })); } catch (e) { /* pas de stockage : le jeu marche quand même */ } };

/* ================= Rendu : ce qui ne change pas d'un niveau à l'autre ================= */
const boite = $('scene'), toile = $('toile');      // #calque reste dans la page : l'ancien script (cache de Pages) s'en sert encore 10 min
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
/* Mouvements réduits (réglage du téléphone, lu à chaque fois : il peut changer en cours de partie) : pas de secousse,
   trois fois moins d'éclats, des survols de caméra plus courts. Les scènes animées restent, elles sont lentes. */
const reduit = matchMedia('(prefers-reduced-motion: reduce)');
function eclat(x, y, z, c, f = 1, taille = 1) {
  if (reduit.matches && Math.random() > 0.33) return;      // Math.random : `hasard` est la graine du terrain, ne pas la décaler
  const e = E[iE]; eclats.setColorAt(iE, tmpC.setHex(c)); eclats.instanceColor.needsUpdate = true; iE = (iE + 1) % NE;
  e.vie = 0.9; e.s = taille; e.p.set(x + 0.5, y + 0.5, z + 0.5); e.v.set((hasard() - 0.5) * 8 * f, (3 + hasard() * 7) * f, (hasard() - 0.5) * 8 * f);
}
function majEclats(dt) {
  for (let i = 0; i < NE; i++) { const e = E[i]; if (e.vie <= 0) continue;
    e.vie -= dt; e.v.y -= 25 * dt; e.p.addScaledVector(e.v, dt);
    if (e.vie <= 0) eclats.setMatrixAt(i, zero); else { tmpO.position.copy(e.p); tmpO.rotation.set(e.vie * 6, e.vie * 4, 0); tmpO.scale.setScalar(Math.min(1, e.vie * 2.5) * e.s); tmpO.updateMatrix(); eclats.setMatrixAt(i, tmpO.matrix); } }
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
  /* Le DESSUS du bloc n'est plus une dalle plate percée d'un rectangle (Julie : « trop carré, trop propre ») :
     1. le terrain est bosselé et ses bords s'éboulent (H = hauteur du sol en chaque colonne) ;
     2. la fosse a des bords inégaux, des éboulis au fond et un tas de déblais à côté ;
     3. le dessus est habillé selon le lieu (SURFACES).
     Rien de tout ça ne touche à la trouvaille : une colonne ne descend jamais sous ce qu'elle recouvre. */
  const g1 = hasard() * 6.28, g2 = hasard() * 6.28, g3 = hasard() * 6.28, maxi = BY >= 16 ? 3 : 2;
  const theme = SURFACES[def.surface || { herbe: 'pre', cendre: 'cendre', sablefin: 'plage', neige: 'neige' }[def.dessus || 'herbe'] || 'pre'];
  const H = [];
  let fx0 = 1e9, fx1 = -1, fz0 = 1e9, fz1 = -1;      // l'ouverture de la fosse, vue du dessus
  for (let x = 0; x < BX; x++) for (let z = 0; z < BZ; z++) if (def.fosse(x, BY - 2, z)) { fx0 = Math.min(fx0, x); fx1 = Math.max(fx1, x); fz0 = Math.min(fz0, z); fz1 = Math.max(fz1, z); }
  const deblai = (x, z) => fx1 >= 0 && ((x - (fx1 + 2.5 < BX - 2 ? fx1 + 2.5 : fx0 - 2.5)) / 2.2) ** 2 + ((z - (fz0 + fz1) / 2) / Math.max(2, (fz1 - fz0) / 2 + 0.5)) ** 2 <= 1;
  for (let x = 0; x < BX; x++) { H[x] = []; for (let z = 0; z < BZ; z++) {
    let creux = Math.round(0.9 + 0.75 * Math.sin(x * 0.47 + g1) * Math.cos(z * 0.39 + g2) + 0.45 * Math.sin((x + z) * 0.23 + g3));
    const d = Math.min(x, BX - 1 - x, z, BZ - 1 - z), coin = Math.min(x, BX - 1 - x) <= 1 && Math.min(z, BZ - 1 - z) <= 1;
    if (d === 0) creux += 1 + Math.floor(hsh(x + 7, 3, z + 5) * 2.2); else if (d === 1 && hsh(x + 2, 9, z + 4) < 0.5) creux += 1;
    if (coin) creux += 1;
    creux = Math.max(0, Math.min(d <= 1 ? maxi + 1 : maxi, creux));
    if (deblai(x, z)) creux = 0;
    let h = BY - 1 - creux;
    for (let y = BY - 2; y > h; y--) if (def.vox.has(cle(x, y, z)) || fixes.has(cle(x, y, z))) { h = Math.min(BY - 1, y + 1); break; }      // jamais sous la trouvaille
    H[x][z] = Math.max(3, h); } }
  const tache = (x, z) => theme.vagues ? (x + Math.round(2 * Math.sin(z * 0.7)) + 40) % 5 < 2 : theme.tache && Math.sin(x * 0.61 + g2) * Math.sin(z * 0.53 + g1) + 0.5 * Math.sin((x - z) * 0.37 + g3) > theme.tache[1];
  const dessus = (x, z) => deblai(x, z) && !def.coule ? def.couches(BY - 3) : tache(x, z) ? theme.vagues || theme.tache[0] : theme.dessus || def.dessus || 'herbe';
  // la fosse, élargie par endroits : jamais contre la trouvaille (c'est la dernière couche, celle du pinceau)
  const contre = (x, y, z) => V6.some(([a, b, c]) => def.vox.has(cle(x + a, y + b, z + c)) || fixes.has(cle(x + a, y + b, z + c)));
  // (pas dans un sol qui coule : un bord élargi au hasard laisserait du sable suspendu au-dessus du vide)
  const trou = (x, y, z) => def.fosse(x, y, z) || (!def.coule && y >= 2 && !contre(x, y, z) && hsh(x * 3 + 1, y, z * 5 + 2) < (y >= BY - 3 ? 0.62 : 0.34)
    && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, c]) => def.fosse(x + a, y, z + c)));
  for (let x = 0; x < BX; x++) for (let y = 0; y < BY; y++) for (let z = 0; z < BZ; z++) {
    const k = cle(x, y, z), o = def.vox.get(k);
    if (o) { M.set(k, { x, y, z, t: 'os', c: o.c, part: o.part, sale: 0.85 + hsh(x, y, z) * 0.15 }); continue; }
    if (fixes.has(k)) { M.set(k, { x, y, z, t: 'fixe' }); continue; }
    if (y > H[x][z] || (y > 0 && trou(x, y, z))) continue;
    let s = y === H[x][z] && y > 0 ? dessus(x, z) : solEn(x, y, z);
    if (s !== 'socle' && y !== H[x][z]) {      // des cailloux durs, plus souvent contre la trouvaille
      const pres = V6.some(([a, b, c]) => def.vox.has(cle(x + a, y + b, z + c)));
      if (hasard() < (pres ? 0.12 : 0.04)) s = def.caillou;
    }
    M.set(k, { x, y, z, t: 'sol', s, pv: SOLS[s].pv });
  }
  // les éboulis au fond de la fosse, et ce qui pousse ou traîne sur le dessus
  for (let x = 0; x < BX; x++) for (let z = 0; z < BZ; z++) {
    for (let y = 2; y < BY - 1; y++) { const k = cle(x, y, z), b = M.get(cle(x, y - 1, z));
      if (!def.coule && !M.has(k) && def.fosse(x, y, z) && b && b.t === 'sol' && b.s !== 'socle' && !contre(x, y, z) && hsh(x + 11, y, z + 3) < 0.16) { const s = solEn(x, y, z); M.set(k, { x, y, z, t: 'sol', s, pv: SOLS[s].pv }); break; } }
    const y = H[x][z] + 1, sol = M.get(cle(x, y - 1, z)); if (y > BY - 1 || !sol || sol.t !== 'sol' || M.has(cle(x, y, z)) || trou(x, y, z) || deblai(x, z)) continue;
    let r = hsh(x + 5, 1, z + 9); for (const [nom, p] of theme.deco) { if (r < p) { M.set(cle(x, y, z), { x, y, z, t: 'sol', s: nom, pv: 1 }); break; } r -= p; }
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
  vu = new Set(); propres = new Set(); conseilsVus = new Set(); cacherConseil(); annonces = []; sortie = 0; squel.position.y = 0; jet.visible = false; coulees.clear(); glissants.clear(); vie = null; retour = false; anims.length = 0; ambiance(0);
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
/* Les messages de fouille (Julie : la bulle « le pinceau » naissait SOUS le doigt, revenait sans cesse, partait trop vite ;
   « Bassin » s'affichait au milieu de l'écran). Mesuré avant : 14 bulles en 20 s, à 22 px du doigt ; 8 cartes empilées au milieu.
   - `conseil` : un seul message, posé au-dessus des outils (le doigt creuse plus haut), une flèche vers l'outil à prendre, qui
     s'allume. Chaque conseil ne vient qu'UNE fois par fouille, et reste jusqu'à ce qu'on touche l'outil (un conseil sans outil : 6 s).
   - `annonce` : la pastille du morceau s'allume en haut, et un bandeau court s'affiche juste dessous. Les morceaux trouvés
     ensemble sont REGROUPÉS (« 3 morceaux dégagés ») au lieu de s'empiler.
   Les deux sont créés ici et non dans la page : Pages peut servir l'ancienne page avec le nouveau script. */
const conseilEl = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'conseil', id: 'conseil', hidden: true }));
conseilEl.setAttribute('role', 'status');
const bandeauEl = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'bandeau', id: 'bandeau', hidden: true }));
bandeauEl.setAttribute('role', 'status');
let conseilsVus = new Set(), conseilCible = null, conseilFin = 0;
function conseil(id, html, cible = null) {
  if (conseilsVus.has(id) || phase !== 'fouille') return; conseilsVus.add(id);
  cacherConseil(); conseilEl.innerHTML = html; conseilEl.hidden = false; conseilCible = cible;
  const outils = document.querySelector('.outils').getBoundingClientRect();
  conseilEl.style.bottom = (innerHeight - outils.top + 12) + 'px';
  const b = cible && $(cible).getBoundingClientRect(), c = conseilEl.getBoundingClientRect();
  conseilEl.classList.toggle('fleche', !!b); if (b) { conseilEl.style.setProperty('--fleche', Math.round(Math.max(16, Math.min(c.width - 30, b.left + b.width / 2 - c.left - 8))) + 'px'); $(cible).classList.add('appel'); }      // la flèche reste sous le conseil, au-dessus de l'outil
  clearTimeout(conseilFin); if (!cible) conseilFin = setTimeout(cacherConseil, 6000);      // un conseil d'outil reste jusqu'à ce qu'on le prenne
}
function cacherConseil() { conseilEl.hidden = true; if (conseilCible) $(conseilCible).classList.remove('appel'); conseilCible = null; clearTimeout(conseilFin); }
let annonces = [], annonceT = 0, bandeauFin = 0;
function annonce(part, propre = false) {
  annonces.push([part, propre]);
  const s = [...$('os').children].find((x) => x.dataset.p === part); if (s) { s.classList.remove('neuf'); void s.offsetWidth; s.classList.add('neuf'); setTimeout(() => s.classList.remove('neuf'), 1700); }
  clearTimeout(annonceT); annonceT = setTimeout(montrerAnnonces, 250);      // ce qui se découvre ensemble se dit ensemble
}
function montrerAnnonces() {
  const lot = annonces; annonces = []; if (!lot.length) return;
  const propre = lot[0][1], n = def.parts.length, nom = (p) => p[0].toUpperCase() + p.slice(1);
  const compte = propre ? `${propres.size}/${n} lavés` : `${vu.size}/${n}`;
  bandeauEl.innerHTML = (lot.length === 1 ? `${propre ? 'Tout propre' : 'Morceau dégagé'} : <b>${nom(lot[0][0])}</b>` : `<b>${lot.length} morceaux ${propre ? 'tout propres' : 'dégagés'}</b>`) + ` <small>${compte}</small>`;
  bandeauEl.style.top = ($('os').getBoundingClientRect().bottom + 8) + 'px';
  bandeauEl.hidden = false; bandeauEl.classList.remove('on'); void bandeauEl.offsetWidth; bandeauEl.classList.add('on');
  clearTimeout(bandeauFin); bandeauFin = setTimeout(() => { bandeauEl.hidden = true; }, 2600);
}
function recit(t) { const r = $('recit'); if (!t) { r.style.opacity = 0; setTimeout(() => { r.hidden = true; }, 600); return; } r.textContent = t; r.hidden = false; r.style.opacity = 1; }

/* ================= Creuser ================= */
const vide = (x, y, z) => x >= 0 && x < BX && z >= 0 && z < BZ && y >= 0 && y < BY && !M.has(cle(x, y, z));
const expose = (e) => V6.some(([a, b, c]) => vide(e.x + a, e.y + b, e.z + c));
function retirer(e) {      // un cube de terre s'en va : ses voisins enterrés touchent l'air à leur tour
  cacher(e); M.delete(cle(e.x, e.y, e.z));
  for (const [a, b, c] of V6) { const f = M.get(cle(e.x + a, e.y + b, e.z + c)); if (f && f.t === 'sol') montrer(f); }
  if (def.coule && phase === 'fouille') autour(e.x, e.z);
}
/* Le sable fin : un cube qui a du vide dessous tombe ; au bord d'un trou d'au moins deux cases, il glisse dedans.
   Les colonnes à revoir attendent dans `coulees`, et la boucle en traite un peu à chaque image : on VOIT le sable couler. */
const coulees = new Set(), V4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const autour = (x, z) => { coulees.add(x + ',' + z); for (const [a, c] of V4) if (x + a >= 0 && x + a < BX && z + c >= 0 && z + c < BZ) coulees.add((x + a) + ',' + (z + c)); };
const rafraichir = (f) => { if (f && f.t === 'sol') { if (aLAir(f)) montrer(f); else cacher(f); } };
/* Un cube qui coule GLISSE d'une case à l'autre au lieu d'y sauter (Julie : « on dirait un bug graphique tellement c'est
   saccadé, on ne comprend pas qu'il s'écoule »). Mesuré avant : tout le sable tombait en 6 images, chaque cube sautant
   d'une case et demie. Maintenant `couler` avance d'un pas toutes les PAS_COULE secondes, et chaque cube déplacé file
   de son ancienne place à la nouvelle pendant ce pas, en accélérant comme une chute. La grille, elle, change d'un coup. */
const PAS_COULE = 0.07, glissants = new Map(); let pasCoule = 0;
function deplacer(f, x, y, z) {
  const ox = f.x, oy = f.y, oz = f.z; M.delete(cle(ox, oy, oz)); f.x = x; f.y = y; f.z = z; M.set(cle(x, y, z), f);
  const g = glissants.get(f), de = g ? g.ici : [ox, oy, oz];
  if (f.montre) ecrire(f); rafraichir(f);
  glissants.set(f, { de, ici: de.slice(), t: 0 });
  for (const [a, b, c] of V6) { rafraichir(M.get(cle(ox + a, oy + b, oz + c))); rafraichir(M.get(cle(x + a, y + b, z + c))); }
}
function glisser(dt) {
  const ims = new Set(); tmpO.rotation.set(0, 0, 0); tmpO.scale.setScalar(1);
  dt = Math.min(dt, 0.03);      // une image en retard ne fait pas SAUTER le cube : il finit sa glissade un peu plus tard
  for (const [f, g] of glissants) { g.t = Math.min(1, g.t + dt / PAS_COULE); const k = g.t * g.t;
    // la place visée sur la courbe de chute, mais jamais plus de 0,6 case par image (un cube qui dévale deux cases d'un coup sautait)
    const vise = [g.de[0] + (f.x - g.de[0]) * k, g.de[1] + (f.y - g.de[1]) * k, g.de[2] + (f.z - g.de[2]) * k], ec = Math.hypot(vise[0] - g.ici[0], vise[1] - g.ici[1], vise[2] - g.ici[2]);
    g.ici = ec <= 0.6 ? vise : g.ici.map((q, i) => q + (vise[i] - q) * 0.6 / ec); g.fini = g.t >= 1 && ec <= 0.6;
    if (f.montre && M.get(cle(f.x, f.y, f.z)) === f) { tmpO.position.set(g.ici[0] + 0.5, g.ici[1] + 0.5, g.ici[2] + 0.5); tmpO.updateMatrix(); f.im.setMatrixAt(f.i, tmpO.matrix); ims.add(f.im); }
    if (g.fini) glissants.delete(f); }
  for (const im of ims) im.instanceMatrix.needsUpdate = true;
}
function couler() {
  const lot = []; for (const k of coulees) { lot.push(k); if (lot.length >= 140) break; }
  for (const k of lot) { coulees.delete(k); const [x, z] = k.split(',').map(Number); let bouge = false;
    for (let y = 2; y < BY; y++) { const f = M.get(cle(x, y, z)); if (!f || f.t !== 'sol' || !SOLS[f.s].coule) continue;
      if (!M.has(cle(x, y - 1, z))) { deplacer(f, x, y - 1, z); bouge = true; continue; }
      if (y < 3) continue;
      const d0 = (x * 7 + y * 3 + z * 5) % 4;
      for (let i = 0; i < 4; i++) { const [a, c] = V4[(d0 + i) % 4], nx = x + a, nz = z + c; if (nx < 0 || nx >= BX || nz < 0 || nz >= BZ) continue;
        if (M.has(cle(nx, y, nz)) || M.has(cle(nx, y - 1, nz)) || M.has(cle(nx, y - 2, nz))) continue;
        deplacer(f, nx, y - 1, nz); autour(nx, nz); bouge = true; if ((nx * 3 + y + nz * 5) % 4 === 0) eclat(nx, y, nz, SOLS[f.s].c, 0.35); break; } }
    if (bouge) autour(x, z); }
  if (!coulees.size) { verifierDecouvertes(); majHud(); }
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
// une case de terre « colle » à la trouvaille quand elle la touche : c'est la dernière couche, celle du pinceau
const colle = (x, y, z) => V6.some(([a, b, c]) => def.vox.has(cle(x + a, y + b, z + c)));
function frapper(h) {
  if (phase !== 'fouille') return;
  const { e } = h; let n = 0, osTouche = false, prochePres = false, tropDur = false, loin = false;
  if (outil === 'pioche') {
    const [cx, cy, cz] = h.avant.map((q) => q + 0.5), R = def.piocheR;
    for (let x = Math.floor(cx - R); x <= cx + R; x++) for (let y = Math.max(0, Math.floor(cy - R)); y <= cy + R; y++) for (let z = Math.floor(cz - R); z <= cz + R; z++) {
      const d2 = (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 + (z + 0.5 - cz) ** 2, f = M.get(cle(x, y, z));
      if (!f || f.t === 'fixe') continue;
      if (f.t === 'os') { if (d2 <= R * R) osTouche = true; continue; }
      if (d2 > R * R || f.s === 'socle') continue;
      if (SOLS[f.s].doux && colle(x, y, z)) { prochePres = true; continue; }
      f.pv--; if (f.pv <= 0) { retirer(f); n++; if (n % 2 === 0) eclat(x, y, z, SOLS[f.s].c, 1); } else colorer(f);
    }
    if (!n && (osTouche || prochePres)) conseil('pinceau', `${pic('pinceau')}<span>La pioche s'arrête : c'est la dernière couche. <b>Prends le pinceau.</b></span>`, 'pinceau');
    secousse = Math.max(secousse, n ? 0.18 : 0.08);
  } else {
    // pinceau : seulement la DERNIÈRE COUCHE, la terre meuble qui touche la trouvaille. Il enlevait toute la terre meuble,
    // plus vite que la pioche et sans s'arrêter : la pioche ne servait plus à rien (vu par Julie en jouant).
    const R = def.pinceauR, m = Math.ceil(R), [cx, cy, cz] = [e.x + 0.5, e.y + 0.5, e.z + 0.5];
    for (let x = e.x - m; x <= e.x + m; x++) for (let y = Math.max(1, e.y - m); y <= e.y + m; y++) for (let z = e.z - m; z <= e.z + m; z++) {
      const f = M.get(cle(x, y, z)); if (!f || f.t !== 'sol') continue;
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 + (z + 0.5 - cz) ** 2 > R * R) continue;
      if (!SOLS[f.s].doux) { if (f === e) tropDur = true; continue; }
      if (!colle(x, y, z)) { loin = true; continue; }
      retirer(f); n++; if (n % 2 === 0) eclat(x, y, z, SOLS[f.s].c, 0.5);
    }
    if (tropDur) conseil('dur', `${pic('pioche')}<span>Trop dur pour le pinceau. <b>Prends la pioche.</b></span>`, 'pioche');
    else if (!n && loin) conseil('loin', `${pic('pioche')}<span>Le pinceau n'enlève que la dernière couche, contre la trouvaille. Ici, <b>prends la pioche.</b></span>`, 'pioche');
    else if (e.t === 'os' && !n) conseil('jet', `<span>C'est déjà dégagé ici : <b>le reste partira au jet d'eau.</b></span>`);
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
// ⟲ fait tourner la trouvaille dans le sens de sa flèche : la caméra part donc dans l'autre (ils étaient inversés, vu par Julie)
for (const [id, s] of [['g', -1], ['d', 1]]) { const b = $(id);
  b.addEventListener('pointerdown', () => { tourneBtn = s; }); for (const t of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(t, () => { tourneBtn = 0; }); }
// l'icône d'un outil, reprise de son bouton (un dessin, pas un emoji)
const pic = (id) => ($(id).querySelector('.pic') || { outerHTML: '' }).outerHTML;
for (const id of ['pioche', 'pinceau']) $(id).addEventListener('click', () => { outil = id; if (conseilCible === id) cacherConseil(); for (const j of ['pioche', 'pinceau']) $(j).setAttribute('aria-pressed', j === id); });

/* ================= Sortir la trouvaille, puis la laver ================= */
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
$('sortir').addEventListener('click', async () => {
  if (phase !== 'fouille') return;
  phase = 'sortie'; geste = null; cacherConseil(); majHud(); tSortie = performance.now();
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
  // les éclaboussures : des gouttes qui giclent du point touché, brunes tant que ça lave de la boue
  const g = Math.max(0.5, R / 4.4), boue = h.e.sale > 0.3;
  for (let k = 0; k < 3; k++) eclat(cx - 0.5 + (hasard() - 0.5) * R * 0.6, cy + oy, cz - 0.5 + (hasard() - 0.5) * R * 0.6, k === 0 && boue ? 0x8a6a4a : k === 1 ? 0xffffff : 0xbfe8ff, 0.5 + g * 0.5, 0.55 + g * 0.5);
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
    $('rang').textContent = def.sous + (dernier && !def.libre ? ` L\'expédition « ${DIG_CHAINES[def.chaine]} » est terminée.` : '');
    $('score').innerHTML = `<span>Temps de fouille</span><span>${mn(tSortie - t0)}</span><span>Temps de lavage</span><span>${mn(tFin - tSortie)}</span><span>Lavée</span><span>${pct >= 100 ? 'à 100 % !' : 'à ' + pct + ' %'}</span>`;
    const final = !def.libre && dernier && def.fin;      // la dernière fouille d'une chaîne a droit à sa fin
    const anime = def.libre && def.vivant;           // une fouille libre qui s'anime : sa scène, sans grand retour
    $('suite').textContent = final ? 'Le grand retour' : anime ? 'Et maintenant ?' : dernier ? 'Voir la galerie' : 'Regarder autour';
    $('finEtagere').hidden = dernier && !final && !anime;
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
  dezoom = { t: 0, dur: reduit.matches ? 2.5 : 6, c0: mini.position.clone().add(precCentre.multiplyScalar(1 / k)), c1: CENTRE.clone(), d0: precDist / k, d1: distBase, el0: el };
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
$('suite').addEventListener('click', () => { if (suivante(iN) >= 0) regarderAutour(); else if (!def.libre && def.fin) grandRetour(); else if (def.libre && def.vivant) { $('fin').hidden = true; vivre(); } else ouvrirEtagere(); });
/* ================= Fin de chaîne : le grand retour, puis la scène vivante ================= */
// Des animations courtes : f(u) reçoit u de 0 à 1, la boucle les fait avancer.
const anims = [];
const tween = (dur, f) => new Promise((r) => anims.push({ t: 0, dur, f, r }));
const lisse = (u) => u * u * (3 - 2 * u);
function majAnims(dt) { for (let i = anims.length - 1; i >= 0; i--) { const a = anims[i]; a.t += dt; a.f(lisse(Math.min(1, a.t / a.dur))); if (a.t >= a.dur) { anims.splice(i, 1); a.r(); } } }
const cJour = new THREE.Color(0xfff0d8), cSoir = new THREE.Color(0xff9a5a);
let soir = 0;
function ambiance(k) {       // 0 = le jour de la fouille, 1 = le soir de la scène vivante
  /* Une fouille LIBRE garde presque la lumière du jour : le soir d'une expédition (soleil divisé par deux, orangé) rendait le
     vaisseau blanc gris-brun, comme encore boueux (vu par Julie sur son téléphone). Le fond du ciel change quand même. */
  const kl = def && def.libre ? k * 0.2 : k;
  soir = k; soleil.intensity = 0.85 - 0.5 * kl; ciel.intensity = 0.7 - 0.22 * kl;
  soleil.color.copy(cJour).lerp(def && def.vivant && def.vivant.teinte ? tmpC.setHex(def.vivant.teinte) : cSoir, kl);
  boite.classList.toggle('soir', k > 0.3); if (!k) boite.classList.remove('enfer', 'nuit', 'mer', 'hiver');
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
  await tween(reduit.matches ? 3.5 : 9, poser);
  recit(def.fin.depart);
  await attendre(2800);
  if (def !== moi) return;
  recit('');
  await tween(reduit.matches ? 2 : 4.5, (u) => poser(1 - u));
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
  vie.neonDe = new Map(ne.map((e, i) => [e, i]));
  /* ce qui BOUGE (les fouilles libres) : chaque entrée de `bouge` tourne un morceau autour d'une articulation `p`
     (mâchoire, tête, queue, bras), le fait respirer (`s`), le soulève (`monte`, `dy`) ou le pose sur l'eau (`flotte`).
     `dans` : l'entrée qui le porte (le pavillon tourne, ET tangue avec le bateau). Un cube suit la PREMIÈRE entrée qui le prend. */
  vie.bouge = (v.bouge || []).map((b) => ({ ...b, pv: new THREE.Vector3(...b.p), q: new THREE.Quaternion(), k: 1, d: 0 }));
  vie.bouge.forEach((b) => { b.parent = b.dans !== undefined ? vie.bouge[b.dans] : null; });
  vie.bougeurs = new Map(); for (const e of OS) { const b = vie.bouge.find((b2) => b2.f(e)); if (b) vie.bougeurs.set(e, b); }
  // ce qui roule : un aller-retour le long de x (le train)
  vie.glisse = v.glisse ? OS.filter(v.glisse.filtre) : [];
  // la mer qui monte : une nappe d'eau qui recouvre tout, et des bulles qui s'échappent
  if (v.englouti) { vie.mer = new THREE.Mesh(new THREE.BoxGeometry(BX + 3, 1, BZ + 3), new THREE.MeshBasicMaterial({ color: 0x2f8fc8, transparent: true, opacity: 0.62, depthWrite: false })); vie.mer.renderOrder = 5; vie.mer.position.set(BX / 2, 0, BZ / 2); g.add(vie.mer); }
  vie.bulles = OS.filter(v.bulles || (() => false)).map((e) => [e.x + 0.5, e.y + 1, e.z + 0.5]);
  vie.bulle = new THREE.InstancedMesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), basic(0xdff4ff), Math.max(1, vie.bulles.length)); vie.bulle.frustumCulled = false; vie.bulle.setMatrixAt(0, zero); g.add(vie.bulle);
  // la neige qui tombe : des flocons qui descendent en biais et reviennent par le haut
  vie.flocon = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), basic(0xffffff), Math.max(1, v.flocons || 0)); vie.flocon.frustumCulled = false; vie.flocon.setMatrixAt(0, zero); g.add(vie.flocon);
  if (v.ciel) boite.classList.add(v.ciel);
  tween(3.5, ambiance); recit(v.texte || def.fin.vivant); setTimeout(() => { if (phase === 'vivante') recit(''); }, 5000);
  $('retour').hidden = false;
}
const AXES = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) }, tv = new THREE.Vector3();
function bouger(t, niveau) {
  for (const b of vie.bouge) { const w = t * (b.v || 1) + (b.ph || 0), a = b.mode === 'ouvre' ? (b.amp || 0) * (0.5 - 0.5 * Math.cos(w)) : (b.amp || 0) * Math.sin(w);
    b.q.setFromAxisAngle(AXES[b.axe || 'y'], a); b.k = 1 + (b.s || 0) * Math.sin(w);
    b.d = (b.dy || 0) * Math.sin(w) + (b.monte || 0) * lisse(Math.min(1, Math.max(0, t - 1) / 3)) + (b.flotte ? Math.max(0, niveau - 2.1) : 0); }
  const touches = new Set();
  for (const [e, b0] of vie.bougeurs) { tv.set(e.x + 0.5, e.y + 0.5, e.z + 0.5); tmpO.quaternion.identity(); let k = 1;
    for (let b = b0; b; b = b.parent) { tv.sub(b.pv).multiplyScalar(b.k).applyQuaternion(b.q).add(b.pv); tv.y += b.d; tmpO.quaternion.premultiply(b.q); k *= b.k; }
    tmpO.position.copy(tv); tmpO.scale.setScalar(k); tmpO.updateMatrix(); e.im.setMatrixAt(e.i, tmpO.matrix); touches.add(e.im);
    const n = vie.neonDe.get(e); if (n !== undefined) { tmpO.scale.setScalar(k * 1.06); tmpO.updateMatrix(); vie.neons.setMatrixAt(n, tmpO.matrix); } }
  for (const im of touches) im.instanceMatrix.needsUpdate = true;
  vie.neons.instanceMatrix.needsUpdate = true; tmpO.rotation.set(0, 0, 0); tmpO.scale.setScalar(1);
}
function majVie(dt) {
  const v = def.vivant; vie.t += dt; const t = vie.t;
  tmpO.rotation.set(0, 0, 0);
  vie.fenPos.forEach((p, i) => { tmpO.position.set(p[0], p[1], p[2]); tmpO.scale.setScalar(soir * (0.85 + 0.15 * Math.sin(t * 3 + i * 1.7))); tmpO.updateMatrix(); vie.fen.setMatrixAt(i, tmpO.matrix); });
  if (!vie.fenPos.length) vie.fen.setMatrixAt(0, zero);
  vie.fen.instanceMatrix.needsUpdate = true;
  vie.braise.material.color.setHex(0xff7a1a).lerp(tmpC.setHex(0xffd23a), 0.5 + 0.5 * Math.sin(t * 2.2));
  // `fumeeSuit` : le numéro de l'entrée de `bouge` qui porte la fumée (le vaisseau décolle : sans ça, elle sortait du vide, vu par Julie)
  if (v.fumee) { const fy = v.fumeeSuit !== undefined && vie.bouge[v.fumeeSuit] ? vie.bouge[v.fumeeSuit].d : 0; for (let i = 0; i < 26; i++) { const a = ((t * 0.16 + i / 26) % 1), s = 0.5 + a * 1.9;
      tmpO.position.set(v.fumee[0] + a * 4 * (v.fumee[3] || 1) + Math.sin(i * 2.4 + a * 5) * 0.7, v.fumee[1] + fy + a * 9, v.fumee[2] + Math.cos(i * 1.9 + a * 4) * 0.7); tmpO.rotation.set(i, a * 2 + i, 0);
      tmpO.scale.setScalar(a > 0.8 ? s * (1 - a) * 5 : s); tmpO.updateMatrix(); vie.fumee.setMatrixAt(i, tmpO.matrix); }
    vie.fumee.instanceMatrix.needsUpdate = true; }
  vie.feux.forEach((p, i) => { for (let k = 0; k < 2; k++) { const a = (t * 0.9 + i * 0.37 + k * 0.5) % 1; tmpO.position.set(p[0] + Math.sin(i * 3.1 + a * 6 + k) * 0.22, p[1] + a * 1.5, p[2] + Math.cos(i * 2.3 + a * 5 + k) * 0.22); tmpO.rotation.set(a * 3, i, 0); tmpO.scale.setScalar(1.1 - a); tmpO.updateMatrix(); vie.feu.setMatrixAt(i * 2 + k, tmpO.matrix); } });
  if (vie.feux.length) { vie.feu.instanceMatrix.needsUpdate = true; vie.feu.material.color.setHex(0xffc23a).lerp(tmpC.setHex(0xff7a1a), 0.5 + 0.5 * Math.sin(t * 7)); }
  // l'eau monte lentement ; les bulles ne partent que de ce qui est déjà sous l'eau ; ce qui flotte monte avec elle
  let niveau = 0;
  if (vie.mer) { niveau = 1.2 + lisse(Math.min(1, Math.max(0, t - 4) / v.englouti.duree)) * v.englouti.haut; vie.mer.scale.y = niveau; vie.mer.position.y = niveau / 2; }
  vie.bulles.forEach((p, i) => { const a = (t * 0.35 + i * 0.137) % 1, sous = p[1] < niveau; tmpO.position.set(p[0] + Math.sin(i + a * 9) * 0.3, p[1] + a * Math.max(0.5, niveau - p[1]), p[2] + Math.cos(i * 1.7 + a * 7) * 0.3); tmpO.rotation.set(0, 0, 0); tmpO.scale.setScalar(sous ? 0.5 + a * 0.8 : 0); tmpO.updateMatrix(); vie.bulle.setMatrixAt(i, tmpO.matrix); });
  if (vie.bulles.length) vie.bulle.instanceMatrix.needsUpdate = true;
  tmpO.rotation.set(0, 0, 0); tmpO.scale.setScalar(1);
  for (const e of vie.flotte) { tmpO.position.set(e.x + 0.5, e.y + 0.5 + Math.max(0, niveau - 2.1) + 0.16 * Math.sin(t * 1.6 + Math.floor(e.x / 6)), e.z + 0.5); tmpO.updateMatrix(); e.im.setMatrixAt(e.i, tmpO.matrix); }
  if (vie.flotte.length) vie.flotte[0].im.instanceMatrix.needsUpdate = true;
  if (vie.bougeurs.size) bouger(t, niveau);
  if (vie.glisse.length) { const dx = v.glisse.course * Math.sin(t * v.glisse.vitesse); for (const e of vie.glisse) { tmpO.position.set(e.x + 0.5 + dx, e.y + 0.5, e.z + 0.5); tmpO.updateMatrix(); e.im.setMatrixAt(e.i, tmpO.matrix); } vie.glisse[0].im.instanceMatrix.needsUpdate = true; }
  vie.neons.material.color.setScalar(0.82 + 0.18 * Math.sin(t * 5));
  if (v.flocons) { const H = BY + 6; tmpO.rotation.set(0, 0, 0);
    for (let i = 0; i < v.flocons; i++) { const a = (hsh(i, 1, 7) + t * (0.05 + hsh(i, 3, 2) * 0.05)) % 1; tmpO.position.set(((hsh(i, 5, 1) * (BX + 8) + t * 0.6 + Math.sin(t + i) * 0.5) % (BX + 8)) - 4, H * (1 - a), hsh(i, 2, 9) * (BZ + 8) - 4); tmpO.scale.setScalar(soir * (0.7 + hsh(i, 9, 4))); tmpO.updateMatrix(); vie.flocon.setMatrixAt(i, tmpO.matrix); }
    vie.flocon.instanceMatrix.needsUpdate = true; }
  if (!geste && !vitrine) az += dt * 0.1;
}

$('finEtagere').addEventListener('click', () => ouvrirEtagere());

/* ================= L'étagère et la vitrine ================= */
let vitrine = null, enVitrine = -1;
function vignette(i) {
  const d = NIV[i]; if (d.img) return d.img;
  const r2 = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r2.setSize(320, 292); r2.setPixelRatio(1);
  const s = new THREE.Scene(); s.add(new THREE.HemisphereLight(0xfff6e8, 0x7a6248, 0.8)); const l = new THREE.DirectionalLight(0xfff0d8, 0.8); l.position.set(-30, 60, 40); s.add(l, objetPropre(i));
  const b = d.boite, c = new THREE.Vector3((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2), g = Math.max(b.x1 - b.x0, (b.y1 - b.y0) * 1.1, b.z1 - b.z0);
  const c2 = new THREE.PerspectiveCamera(35, 320 / 292, 0.5, 600); c2.position.set(c.x + g * 1.2, c.y + g * (d.elFin < 0.6 ? 0.5 : 1.1), c.z + g * 1.5); c2.lookAt(c);
  r2.render(s, c2); d.img = r2.domElement.toDataURL('image/png'); r2.dispose(); if (r2.forceContextLoss) r2.forceContextLoss();
  return d.img;
}
/* Le menu : l'accueil, les chaînes, les fouilles libres, l'étagère. Une seule vue à la fois, par-dessus tout le reste
   (outils compris). La galerie (dite « étagère » dans le code) ne montre que ce qui est TROUVÉ : on y admire, ou on rejoue. */
let partie = false;                                       // une fouille est-elle en cours (« Creuser » touché, pas encore quittée) ?
const prochaine = (c) => fait[c] < longueur(c) ? debut(c) + fait[c] : -1;
// Le nom qu'on a le droit de lire : le vrai une fois l'expédition terminée, son nom de terrain avant.
const nomExp = (c) => fait[c] >= longueur(c) ? DIG_CHAINES[c] : DIG_TERRAINS[c];
const aFaire = () => { const c = [dernier, ...CHAINES].find((k) => k && prochaine(k) >= 0); return c ? prochaine(c) : NIV.findIndex((d, i) => d.libre && !trouvee(i)); };
function ouvrirEtagere(vue = 'etagere') {
  fermerVitrine(); quitterScene(); desarmer();
  const pleine = (i) => `<button class="case" data-i="${i}" aria-label="${NIV[i].nom}"><img alt="" src="${vignette(i)}"><b>${NIV[i].nom}</b></button>`;
  const trouves = NIV.filter((d, i) => trouvee(i)).length, nLibres = NIV.filter((d) => d.libre).length, nChaines = NIV.length - nLibres;
  const dansChaines = CHAINES.reduce((n, c) => n + fait[c], 0);
  // l'accueil : trois entrées, et tout en bas, sous le pouce, de quoi creuser tout de suite
  $('resChaines').textContent = `${CHAINES.length} expéditions · ${dansChaines} trouvaille${dansChaines > 1 ? 's' : ''} sur ${nChaines}`;
  $('resLibres').textContent = `${nLibres} fouilles · ${libresFaits.size} trouvée${libresFaits.size > 1 ? 's' : ''}`;
  $('resEtagere').textContent = trouves ? `${trouves} trouvaille${trouves > 1 ? 's' : ''} à admirer ou à rejouer` : 'Vide pour l\'instant';
  const i0 = aFaire(), d0 = i0 >= 0 ? NIV[i0] : null;
  $('continuer').textContent = partie ? 'Reprendre la fouille' : !d0 ? 'Tout est trouvé : la galerie' : d0.libre ? 'Creuser une fouille libre'
    : fait[d0.chaine] ? `Continuer : ${nomExp(d0.chaine)} (${fait[d0.chaine] + 1} sur ${longueur(d0.chaine)})` : `Commencer : ${nomExp(d0.chaine)}`;
  // les chaînes : quatre cases par chaîne, et le bouton pour la suite
  let h = '';
  for (const c of CHAINES) { const p = prochaine(c);
    h += `<div class="rayon"><h2>${nomExp(c)}<small>${fait[c]} sur ${longueur(c)}</small></h2><div class="cases quatre">`;
    NIV.forEach((d, i) => { if (d.chaine === c) h += trouvee(i) ? `<button class="case" data-i="${i}" aria-label="${d.nom}"><img alt="" src="${vignette(i)}"></button>` : `<div class="case ${i === p ? 'prochaine' : 'vide'}" aria-label="Pas encore trouvée">?</div>`; });
    h += '</div>' + (p >= 0 ? `<button class="aller" data-creuser="${p}">${fait[c] ? 'Continuer' : 'Commencer'}</button>` : `<p class="fini">Expédition terminée (sur le terrain : ${DIG_TERRAINS[c]})</p>`) + '</div>'; }
  $('rayons').innerHTML = h;
  let l = ''; NIV.forEach((d, i) => { if (d.libre) l += trouvee(i) ? pleine(i) : `<button class="case creuser" data-creuser="${i}" aria-label="Creuser une fouille inconnue"><span>?</span><b>Creuser</b></button>`; });
  $('casesLibres').innerHTML = l;
  // l'étagère : seulement les trouvailles, rangées par chaîne
  let e = '';
  for (const c of CHAINES) if (fait[c]) { e += `<h2>${nomExp(c)}</h2><div class="cases">`; NIV.forEach((d, i) => { if (d.chaine === c && trouvee(i)) e += pleine(i); }); e += '</div>'; }
  if (libresFaits.size) { e += '<h2>Fouilles libres</h2><div class="cases">'; NIV.forEach((d, i) => { if (d.libre && trouvee(i)) e += pleine(i); }); e += '</div>'; }
  $('vitrines').innerHTML = e;
  $('motEtagere').textContent = trouves ? 'Touche une trouvaille pour l\'admirer, ou pour la rejouer.' : 'Elle est vide pour l\'instant. Ta première trouvaille viendra s\'y exposer.';
  for (const v of $('etagere').querySelectorAll('section')) v.hidden = v.dataset.vue !== vue;
  $('fin').hidden = true; $('etagere').hidden = false; $('etagere').querySelector('.dedans').scrollTop = 0; majInstaller();
}
const fermerMenu = () => { $('etagere').hidden = true; if (phase === 'fin') $('fin').hidden = false; };
$('etagere').addEventListener('click', (ev) => {
  const b = ev.target.closest('button'); if (!b) return;
  if (b.dataset.aller) ouvrirEtagere(b.dataset.aller);
  else if (b.dataset.creuser) lancer(+b.dataset.creuser);
  else if (b.dataset.i) ouvrirVitrine(+b.dataset.i);
});
$('continuer').addEventListener('click', () => { if (partie) return fermerMenu(); const i = aFaire(); if (i >= 0) lancer(i); else ouvrirEtagere('etagere'); });
/* La scène vivante, revue depuis la galerie (demandé par Julie) : la dernière trouvaille d'une expédition ne s'ouvre pas
   dans une vitrine figée, mais telle qu'on l'a quittée à la fin : sortie de terre, propre, animée. On rebâtit sa fouille,
   on retire toute la terre d'un coup, et on lance `vivre`. La fouille en cours, s'il y en avait une, est abandonnée,
   comme avec « Rejouer ». */
let enScene = -1;
function ouvrirScene(i) {
  fermerVitrine(); quitterScene(); $('etagere').hidden = true; $('intro').hidden = true; $('fin').hidden = true; partie = false;
  dezoom = null; recit(''); construire(i); phase = 'vivante'; az = def.libre ? def.azFin : -1.2; el = def.libre ? def.elFin : 0.8;
  for (const e of [...M.values()]) if (e.t === 'sol' && e.y >= 1) retirer(e);
  for (const e of OS) { e.sale = 0; colorer(e); }
  for (const pt of def.parts) { vu.add(pt); propres.add(pt); }
  sortie = 3; squel.position.y = def.leve; majHud();
  enScene = enVitrine = i; document.body.classList.add('vitrine');
  $('nomVitrine').textContent = def.nom; $('nomVitrine').hidden = false; $('nomVitrine').classList.add('clair'); $('rejouer').hidden = false; $('oublier').hidden = false; desarmerOubli();
  vivre();
}
function quitterScene() {
  if (enScene < 0) return;
  enScene = enVitrine = -1; document.body.classList.remove('vitrine'); $('nomVitrine').classList.remove('clair'); recit('');
  for (const id of ['nomVitrine', 'rejouer', 'oublier', 'retour']) $(id).hidden = true;
}
function ouvrirVitrine(i) {
  if (NIV[i].vivant && trouvee(i)) return ouvrirScene(i);
  $('etagere').hidden = true;
  const d = NIV[i], b = d.boite, g = new THREE.Group(), o = objetPropre(i); g.add(o); enVitrine = i;
  const lx = b.x1 - b.x0, lz = b.z1 - b.z0, socle = new THREE.Mesh(new THREE.BoxGeometry(lx + 4, 1.2, lz + 4), new THREE.MeshLambertMaterial({ color: 0x8a5a36 }));
  socle.position.set((b.x0 + b.x1) / 2, b.y0 - 0.6, (b.z0 + b.z1) / 2); socle.receiveShadow = true; g.add(socle);
  scene.add(g); racine.visible = false;
  const taille = Math.max(lx, (b.y1 - b.y0) * 1.15, lz);
  vitrine = { g, garde: { az, el, dist, distVoulue, distBase }, c: new THREE.Vector3((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2) };
  distBase = taille * (boite.clientWidth / boite.clientHeight < 0.8 ? 2.4 : 1.7) * (d.recul || 1); dist = distVoulue = distBase; el = Math.min(0.7, d.elFin); if (d.azFin !== undefined) az = d.azFin;
  soleil.target.position.copy(vitrine.c); if (vie) ambiance(0);
  document.body.classList.add('vitrine'); $('nomVitrine').textContent = d.nom; $('nomVitrine').hidden = false; $('retour').hidden = false; $('rejouer').hidden = false; $('oublier').hidden = false; desarmerOubli();
}
function fermerVitrine() {
  if (!vitrine) return;
  jeter(vitrine.g); racine.visible = true; ({ az, el, dist, distVoulue, distBase } = vitrine.garde);
  soleil.target.position.copy(CENTRE); vitrine = null; if (vie) { ambiance(1); if (def.vivant.ciel) boite.classList.add(def.vivant.ciel); }
  document.body.classList.remove('vitrine'); $('nomVitrine').hidden = true; $('retour').hidden = phase !== 'vivante'; $('rejouer').hidden = true; $('oublier').hidden = true; enVitrine = -1;
}
$('retour').addEventListener('click', () => ouvrirEtagere('etagere'));
$('rejouer').addEventListener('click', () => { const i = enVitrine; if (i < 0) return; fermerVitrine(); lancer(i); });      // rejouer n'enlève rien à la galerie
/* « Remettre sous terre » : la trouvaille quitte la galerie, pour laisser la surprise à quelqu'un d'autre (demandé par Julie).
   Dans une expédition la progression est un compte : remettre la 2e sous terre y remet aussi la 3e et la 4e, et le bouton le dit.
   Deux touchers : le premier demande, le second le fait. */
let oubli = 0;
const desarmerOubli = () => { clearTimeout(oubli); oubli = 0; $('oublier').textContent = 'Remettre sous terre'; $('oublier').classList.remove('arme'); };
$('oublier').addEventListener('click', () => {
  const i = enVitrine, d = NIV[i]; if (i < 0 || !trouvee(i)) return;
  const apres = d.libre ? 0 : fait[d.chaine] - rang(i) - 1;
  if (!oubli) { $('oublier').textContent = apres > 0 ? `Avec ${apres === 1 ? 'la suivante' : 'les ' + apres + ' suivantes'} de l\'expédition. Touche encore` : 'Elle quittera la galerie. Touche encore';
    $('oublier').classList.add('arme'); oubli = setTimeout(desarmerOubli, 4000); return; }
  if (d.libre) libresFaits.delete(d.id); else fait[d.chaine] = rang(i);
  sauver(); ouvrirEtagere('etagere');
});
$('ouvrirEtagere').addEventListener('click', () => { if (!dezoom && !enRoute && !retour && phase !== 'sortie') ouvrirEtagere('accueil'); });
let sur = 0;             // deux touchers : le premier demande, le second efface
const desarmer = () => { clearTimeout(sur); sur = 0; $('toutRefaire').textContent = 'Tout recommencer'; };
$('toutRefaire').addEventListener('click', () => {
  if (!sur) { $('toutRefaire').textContent = 'Vider la galerie ? Touche encore pour confirmer'; sur = setTimeout(desarmer, 4000); return; }
  desarmer(); for (const c of CHAINES) fait[c] = 0; libresFaits.clear(); dernier = ''; sauver(); lancer(0); ouvrirEtagere('accueil');
});

/* ================= Démarrer un niveau depuis sa carte ================= */
function lancer(i) {
  fermerVitrine(); quitterScene(); $('etagere').hidden = true; partie = false;
  dezoom = null; recit(''); construire(i); phase = 'attente'; az = -1.2; el = 1.0; $('retour').hidden = true;
  if (def.chaine && def.chaine !== dernier) { dernier = def.chaine; sauver(); }
  $('introTitre').textContent = def.intro[0]; $('introTexte').textContent = def.intro[1];
  $('indice').textContent = 'Garde le doigt sur la terre pour creuser. Glisse à côté du bloc pour le tourner.'; $('indice').hidden = false;
  $('intro').hidden = false;
}
$('go').addEventListener('click', () => { $('intro').hidden = true; phase = 'fouille'; partie = true; t0 = performance.now(); });

/* ================= Boucle ================= */
// Le cercle sous le doigt : il suit le geste tant qu'on creuse ou qu'on lave, et s'en va dès que le geste n'est plus (lâché, fin de phase…).
// Créé ici et non dans la page : Pages peut servir l'ancienne page (sans lui) avec le nouveau script ; sans son style, il reste invisible.
const doigt = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'doigt', id: 'doigt' })); doigt.setAttribute('aria-hidden', 'true'); let doigtVu = '';
function montrerDoigt() {
  const g = geste && (geste.type === 'creuse' || geste.type === 'lave') && !vitrine ? geste : null, etat = g ? g.type : '';
  if (g) doigt.style.translate = g.x + 'px ' + g.y + 'px';
  if (etat !== doigtVu) { doigtVu = etat; doigt.classList.toggle('on', !!g); doigt.classList.toggle('lave', etat === 'lave'); }
}
let tPrec = performance.now();
function image(t) {
  requestAnimationFrame(image);
  const dt = Math.min(0.05, (t - tPrec) / 1000); tPrec = t;
  if (geste && geste.type === 'lave' && phase === 'lavage' && !vitrine) laver(dt); else jet.visible = false;
  if (geste && geste.type === 'creuse' && t - dernierCoup > (outil === 'pioche' ? 200 : 110)) { const h = viser(geste.x, geste.y); if (h) frapper(h); dernierCoup = t; }
  if (phase === 'lavage' && (assez || propreP() >= BRILLE_A)) { brille = 0.6 + 0.35 * Math.sin(t / 170); for (const e of OS) if (e.sale > 0.2) colorer(e); }   // toute la boue, même celle qui ne compte pas : ce qui se voit sale doit briller
  majAnims(dt); if (vie) majVie(dt); montrerDoigt();
  if (coulees.size) { if (phase === 'fouille') { pasCoule += dt; if (pasCoule >= PAS_COULE) { pasCoule = 0; couler(); } } else coulees.clear(); }
  if (glissants.size) glisser(dt);
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
  if (secousse && !reduit.matches) { cam.position.x += (Math.random() - 0.5) * secousse; cam.position.y += (Math.random() - 0.5) * secousse; }
  cam.lookAt(centre);
  majEclats(dt);
  rendu.render(scene, cam);
}
// On arrive sur l'ACCUEIL. Derrière lui, la prochaine fouille est déjà prête.
{ const i = aFaire(); lancer(i >= 0 ? i : 0); }

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
ouvrirEtagere('accueil');
requestAnimationFrame(image);
