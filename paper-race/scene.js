// ===== Paper Race : la SCÈNE VIVANTE (1.11.0) =====
// L'heure, la météo et l'ambiance, d'après sa maquette (tools/maquette-paper-race-decors.html).
// ⚠️ Rien ici ne change le jeu : tout est graphique. L'heure, la météo et le visiteur
// rare sont tirés une fois par course (R.ciel, rangé avec la course sauvegardée) et ne
// changent plus ; en ligne, ils se tirent depuis le code de la salle, pour que tous
// les téléphones voient le même ciel.
// Deux couches, peintes sur le plateau même, dans le repère de la carte (la caméra
// est déjà posée) : le SOL (ombres des nuages, nuit, flaques, public, drapeaux), puis
// l'AIR (pluie, brume, sable, feuilles qui volent, étincelles, hélicoptère). ⚠️ Les
// deux passent SOUS les points et les voitures : la brume par-dessus pâlissait les
// points et le panneau sens interdit. Les points jouables restent toujours nets.

const HEURES_CIEL = { jour: { nom: 'Journée', poids: 6 }, couchant: { nom: 'Coucher de soleil', poids: 2 }, nuit: { nom: 'Nuit', poids: 2 } };
const METEOS_CIEL = {
  soleil: { nom: 'Soleil', poids: 5 }, couvert: { nom: 'Couvert', poids: 2 }, pluie: { nom: 'Pluie', poids: 2 },
  apres: { nom: 'Après la pluie', poids: 1, pasLaNuit: true }, brume: { nom: 'Brume du matin', poids: 1, matin: true },
  chaleur: { nom: 'Chaleur', poids: 1, pasLaNuit: true }, sable: { nom: 'Vent de sable', poids: 1 }, feuilles: { nom: "Feuilles d'automne", poids: 1 }
};
function tirerCiel(graine) {
  const r = alea(graine || 1);
  const tire = (t) => { const e = Object.entries(t), tot = e.reduce((a, [, m]) => a + m.poids, 0); let x = r() * tot; for (const [k, m] of e) if ((x -= m.poids) < 0) return k; return e[0][0]; };
  let heure = tire(HEURES_CIEL); const meteo = tire(METEOS_CIEL);
  if (METEOS_CIEL[meteo].matin) heure = 'jour';
  if (METEOS_CIEL[meteo].pasLaNuit && heure === 'nuit') heure = 'couchant';
  return { heure, meteo, visiteur: r() < 1 / 6 };
}
// le ciel de la course en cours, tiré à la première demande
function cielCourse() {
  if (!R) return null;
  const ok = (c) => c && HEURES_CIEL[c.heure] && METEOS_CIEL[c.meteo];
  if (!ok(R.ciel)) {
    let g = (Math.random() * 2147483647) | 0;
    if (mode === 'ligne' && ligne && ligne.code) { g = 7; for (const ch of ligne.code + ':' + (ligne.manche || 0)) g = (g * 31 + ch.charCodeAt(0)) >>> 0; }
    R.ciel = tirerCiel(g || 1);
  }
  return R.ciel;
}
function texteCiel(c) {
  if (!c) return '';
  if (c.heure === 'nuit' && c.meteo === 'soleil') return 'Nuit claire';
  return c.heure === 'jour' ? METEOS_CIEL[c.meteo].nom : `${HEURES_CIEL[c.heure].nom}, ${METEOS_CIEL[c.meteo].nom.toLowerCase()}`;
}
// `?ciel=aucun` : pas de scène (les essais qui lisent les PIXELS du plateau, comme le
// rouge du panneau sens interdit, ne doivent pas dépendre d'une nuit tirée au hasard)
const SANS_CIEL = /[?&]ciel=aucun/.test(location.search);
// la scène bouge-t-elle ? (sinon le plateau ne se redessine que quand il le faut)
function sceneAnimee() {
  return !SANS_CIEL && !!(R && R.ciel && !REDUIT && !document.hidden && $('game').style.display !== 'none');
}

// ---------- ce qui se prépare une fois par circuit ----------
function mesurerTrace(tk) {
  const T = tk.trace, segs = []; let tot = 0;
  for (let i = 0; i < T.length; i++) { const a = T[i], b = T[(i + 1) % T.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push({ a, b, L, s: tot }); tot += L; }
  const pos = (s) => {
    s = ((s % tot) + tot) % tot;
    let k = segs.length - 1; for (let i = 0; i < segs.length; i++) if (s < segs[i].s + segs[i].L) { k = i; break; }
    const g = segs[k], t = (s - g.s) / g.L, ux = (g.b[0] - g.a[0]) / g.L, uy = (g.b[1] - g.a[1]) / g.L;
    return { x: g.a[0] + (g.b[0] - g.a[0]) * t, y: g.a[1] + (g.b[1] - g.a[1]) * t, ux, uy };
  };
  return { pos, tot };
}
function sceneDe(tk) {
  if (tk._scene) return tk._scene;
  const r = alea(4242), S = { projos: [], flaques: [], feuilles: [], bete: null };
  const W = colsDe(tk), H = rowsDe(tk);
  if (tk.trace) {
    const M = mesurerTrace(tk);
    for (let s = 0; s < M.tot; s += 5) for (const c of [1, -1]) { const p = M.pos(s), o = tk.demi + 1.1; S.projos.push([p.x - p.uy * o * c, p.y + p.ux * o * c]); }
    for (let s = 0; s < M.tot; s += 2.7) { const p = M.pos(s), o = (r() - 0.5) * tk.demi * 1.4; S.flaques.push([p.x - p.uy * o, p.y + p.ux * o, 0.42 + r() * 0.4, Math.atan2(p.uy, p.ux)]); }
    for (let s = 0; s < M.tot; s += 0.8) { const p = M.pos(s), o = (tk.demi + 0.2 + r() * 1.2) * (r() < 0.5 ? 1 : -1); S.feuilles.push([p.x - p.uy * o, p.y + p.ux * o, r() * 6, r()]); }
  } else {
    // circuit en rectangles : au bord des rectangles et sur le bitume
    const bords = [];
    for (const R0 of tk.outers.concat(tk.islands)) { const [a, b, c, d] = R0; for (let x = a; x <= c; x += 1) bords.push([x, b], [x, d]); for (let y = b; y <= d; y += 1) bords.push([a, y], [c, y]); }
    bords.forEach((p, i) => { if (i % 5 === 0) S.projos.push(p); });
    for (let k = 0; k < W * H * 0.06; k++) { const x = r() * W, y = r() * H; if (onTrackF(tk, x, y)) S.flaques.push([x, y, 0.42 + r() * 0.4, 0]); }
    for (const p of bords) if (r() < 0.6) S.feuilles.push([p[0] + (r() - 0.5) * 1.6, p[1] + (r() - 0.5) * 1.6, r() * 6, r()]);
  }
  // le visiteur rare : sur l'herbe libre, près du départ (pour qu'on le voie)
  const P = typeof planDecor === 'function' ? planDecor(tk) : null, dep = tk.depart;
  for (let k = 0; k < 400 && !S.bete; k++) {
    const x = (dep.x0 + dep.x1) / 2 + (r() - 0.5) * 16, y = dep.y - 2 - r() * 14;
    if (x < 1 || y < 1 || x > W - 1 || y > H - 1 || onTrackF(tk, x, y)) continue;
    const d = tk.trace ? distTrace(tk, x, y) - tk.demi : (P && P.d ? P.d[Math.floor(y) * W + Math.floor(x)] : 2);
    if (d > 1.5 && d < 4 && !(P && P.eau[Math.floor(y) * W + Math.floor(x)])) S.bete = [x, y];
  }
  S.sorte = /^spa/.test(tk.id) ? 'sanglier' : 'mouette';
  tk._scene = S;
  return S;
}
// les sprites, préparés une fois
let SPRITES = null;
function sprites() {
  if (SPRITES) return SPRITES;
  const nuage = (n, graine) => {
    const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'), r = alea(graine);
    g.filter = `blur(${Math.round(n * 0.07)}px)`; g.fillStyle = 'rgba(28,40,70,1)';
    for (let k = 0; k < 7; k++) { g.beginPath(); g.ellipse(n * (0.3 + r() * 0.4), n * (0.35 + r() * 0.3), n * (0.12 + r() * 0.12), n * (0.09 + r() * 0.1), 0, 0, 6.2832); g.fill(); }
    return c;
  };
  const flou = (n, k) => { const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); gr.addColorStop(0, `rgba(20,25,40,${k})`); gr.addColorStop(1, 'rgba(20,25,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, n, n); return c; };
  SPRITES = { nuages: [0, 1, 2, 3, 4, 5].map(k => nuage(256, k + 3)), helico: flou(128, 0.42) };
  return SPRITES;
}
function spriteArcEnCiel(W, H) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), c = document.createElement('canvas');
  c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
  const g = c.getContext('2d'); g.scale(dpr, dpr);
  const cx = W * 0.62, cy = H * 1.18, R0 = H * 1.02, coul = ['#E8452C', '#F29A2E', '#F2D24B', '#5DC05D', '#3D95E6', '#4B5BC9', '#8A4FD0'];
  g.filter = 'blur(3px)';
  coul.forEach((col, i) => { g.beginPath(); g.arc(cx, cy, R0 - i * 9, Math.PI * 1.05, Math.PI * 1.95); g.strokeStyle = col; g.globalAlpha = 0.55; g.lineWidth = 10; g.stroke(); });
  g.filter = 'none'; g.globalAlpha = 1; g.globalCompositeOperation = 'destination-in';
  const fx = g.createLinearGradient(0, 0, W, 0); fx.addColorStop(0, 'rgba(0,0,0,0)'); fx.addColorStop(0.25, 'rgba(0,0,0,1)'); fx.addColorStop(0.8, 'rgba(0,0,0,1)'); fx.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = fx; g.fillRect(0, 0, W, H);
  const fy = g.createLinearGradient(0, 0, 0, H); fy.addColorStop(0, 'rgba(0,0,0,1)'); fy.addColorStop(0.45, 'rgba(0,0,0,.9)'); fy.addColorStop(0.75, 'rgba(0,0,0,0)');
  g.fillStyle = fy; g.fillRect(0, 0, W, H);
  return c;
}

// ---------- l'état qui bouge ----------
let ETAT_SCENE = { R: null, prec: 0, etincelles: [], gerbes: [], arc: null, nuit: null };
function etatScene(now) {
  if (ETAT_SCENE.R !== R) ETAT_SCENE = { R, prec: now, etincelles: [], gerbes: [], arc: null, nuit: null };
  const dt = Math.max(0, Math.min(0.05, (now - ETAT_SCENE.prec) / 1000)); ETAT_SCENE.prec = now;
  return dt;
}
const VUE = () => ({ x: Math.round(camX), y: Math.round(camY), w: vueW, h: vueH });
// le chemin de la piste (pour la lumière de nuit et l'air qui tremble), en px de la carte
function cheminPiste(g, tk) {
  g.beginPath();
  if (tk.trace) { tk.trace.forEach((q, i) => i ? g.lineTo(gx(q[0]), gy(q[1])) : g.moveTo(gx(q[0]), gy(q[1]))); g.closePath(); }
  else { for (const r of tk.outers) g.rect(gx(r[0]), gy(r[1]), (r[2] - r[0]) * cellPx, (r[3] - r[1]) * cellPx); for (const r of tk.islands) g.rect(gx(r[2]), gy(r[1]), -(r[2] - r[0]) * cellPx, (r[3] - r[1]) * cellPx); }
}
const mouille = (c) => c.meteo === 'pluie' || c.meteo === 'apres';
// la voiture qui bouge (pour les étincelles et les gerbes d'eau)
function voitureQuiBouge() {
  if (!anim || replay || revue) return null;
  const car = R.cars[anim.pa], t = car.trail, a = t[t.length - 2], b = anim.to; if (!a) return null;
  const k = easeOut(anim.t), x = lerp(a[0], b[0], k), y = lerp(a[1], b[1], k), L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (!L) return null;
  return { x, y, ux: (b[0] - a[0]) / L, uy: (b[1] - a[1]) / L, v: vitesse([b[0] - a[0], b[1] - a[1]]) };
}

// ---------- le SOL ----------
function sceneSol(g) {
  if (SANS_CIEL) return;
  const c = cielCourse(); if (!c) return;
  const now = performance.now(), t = now / 1000, dt = etatScene(now), V = VUE(), C = cellPx, tk = R.track, S = sceneDe(tk), SP = sprites();
  const dans = (x, y, m) => x > V.x - m && x < V.x + V.w + m && y > V.y - m && y < V.y + V.h + m;
  // le coucher de soleil : une lumière orangée d'un côté, mauve de l'autre
  if (c.heure === 'couchant') {
    g.save(); g.globalCompositeOperation = 'multiply';
    const gr = g.createLinearGradient(V.x, V.y, V.x + V.w, V.y + V.h);
    gr.addColorStop(0, 'rgba(255,170,90,.42)'); gr.addColorStop(0.55, 'rgba(250,140,110,.30)'); gr.addColorStop(1, 'rgba(130,90,170,.34)');
    g.fillStyle = gr; g.fillRect(V.x, V.y, V.w, V.h); g.restore();
  }
  // les ombres des nuages, qui glissent avec le vent sur toute la carte
  if ((c.meteo === 'soleil' || c.meteo === 'couvert') && c.heure !== 'nuit') {
    g.save(); g.globalCompositeOperation = 'multiply';
    if (c.meteo === 'couvert') { g.fillStyle = 'rgba(140,148,165,.55)'; g.fillRect(V.x, V.y, V.w, V.h); }
    g.globalAlpha = c.meteo === 'couvert' ? 0.2 : 0.22;
    const MW = mapW(), MH = mapH(), nb = Math.max(3, Math.round(MW * MH / (V.w * V.h) * (c.meteo === 'couvert' ? 6 : 3)));
    for (let k = 0; k < nb; k++) {
      const s = V.w * (0.55 + (k % 3) * 0.2), perX = MW + s * 2, perY = MH + s * 2;
      const x = ((k * 197.3 * 7 + t * V.w * 0.035) % perX) - s, y = ((k * 131.7 * 5 + t * V.h * 0.012) % perY) - s;
      if (dans(x + s / 2, y + s / 2, s)) g.drawImage(SP.nuages[k % 6], x, y, s, s);
    }
    g.restore();
  } else if (c.meteo === 'couvert') { g.fillStyle = 'rgba(30,40,60,.16)'; g.fillRect(V.x, V.y, V.w, V.h); }
  // la pluie mouille tout ; des flaques qui brillent sur la piste
  if (mouille(c)) {
    if (c.meteo === 'pluie') { g.fillStyle = 'rgba(50,65,90,.16)'; g.fillRect(V.x, V.y, V.w, V.h); }
    S.flaques.forEach((f, k) => {
      const x = gx(f[0]), y = gy(f[1]); if (!dans(x, y, C)) return;
      const w = C * f[2];
      g.beginPath(); g.ellipse(x, y, w, w * 0.36, f[3], 0, 6.2832); g.fillStyle = 'rgba(140,178,215,.38)'; g.fill();
      g.beginPath(); g.ellipse(x - w * 0.2, y - w * 0.06, w * 0.35, w * 0.08, f[3], 0, 6.2832); g.fillStyle = `rgba(255,255,255,${0.4 + 0.25 * Math.sin(t * 3 + k)})`; g.fill();
    });
  }
  // la chaleur : l'air tremble au-dessus du bitume, sur la piste seulement
  if (c.meteo === 'chaleur') {
    g.fillStyle = 'rgba(255,190,120,.10)'; g.fillRect(V.x, V.y, V.w, V.h);
    g.save();
    if (tk.trace) {
      // pas de clip sur un trait : on dessine les ondes, puis on ne les garde que sur la piste
      const off = ETAT_SCENE.ondes || (ETAT_SCENE.ondes = document.createElement('canvas'));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (off.width !== Math.round(V.w * dpr)) { off.width = Math.round(V.w * dpr); off.height = Math.round(V.h * dpr); }
      const o = off.getContext('2d'); o.setTransform(dpr, 0, 0, dpr, 0, 0); o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, V.w, V.h);
      o.strokeStyle = 'rgba(255,255,255,.22)'; o.lineWidth = 2;
      for (let k = 0; k < 16; k++) { const y = V.h - ((t * 14 + k * V.h / 16) % V.h); o.beginPath(); for (let x = 0; x <= V.w; x += 8) o.lineTo(x, y + Math.sin((x + V.x) / 13 + t * 4 + k) * 3); o.stroke(); }
      o.globalCompositeOperation = 'destination-in'; o.translate(-V.x, -V.y); cheminPiste(o, tk); o.lineWidth = 2 * tk.demi * C; o.lineJoin = 'round'; o.stroke();
      g.drawImage(off, V.x, V.y, V.w, V.h);
    } else {
      cheminPiste(g, tk); g.clip('evenodd');
      g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 2;
      for (let k = 0; k < 16; k++) { const y = V.y + V.h - ((t * 14 + k * V.h / 16) % V.h); g.beginPath(); for (let x = V.x; x <= V.x + V.w; x += 8) g.lineTo(x, y + Math.sin(x / 13 + t * 4 + k) * 3); g.stroke(); }
    }
    g.restore();
  }
  // les feuilles d'automne posées au bord de la piste
  if (c.meteo === 'feuilles') for (const f of S.feuilles) { const x = gx(f[0]), y = gy(f[1]); if (dans(x, y, C)) feuille(g, x, y, C * 0.32, f[2], f[3]); }
  // le public fait la ola dans les tribunes, les drapeaux flottent
  const P = typeof planDecor === 'function' ? planDecor(tk) : null;
  if (P) for (const tr of P.tribunes) {
    if (!dans(gx(tr.x), gy(tr.y), tr.L * C)) continue;
    g.save(); g.translate(gx(tr.x), gy(tr.y)); g.rotate(tr.ang);
    const L = tr.L * C, e = C * 1.5;
    g.fillStyle = '#ECE7DD'; g.fillRect(-L / 2 + 1, -e / 2 + 1, L - 2, e - 2);
    for (let k = 0; k < 4; k++) {
      const yy = -e / 2 + (k + 0.5) * e / 4;
      for (let x = -L / 2 + C * 0.2, i = 0; x < L / 2; x += C * 0.32, i++) {
        const ola = Math.max(0, Math.sin(t * 2.4 - x / C * 0.5)) ** 6, saut = REDUIT ? 0 : ola * C * 0.14 + Math.sin(t * 9 + i * 1.7 + k) * C * 0.02;
        g.fillStyle = PUBLIC_DECOR[(Math.floor(x / C * 3) + k * 7 + 60) % PUBLIC_DECOR.length];
        g.fillRect(x, yy - C * 0.08 - saut, C * 0.16, C * 0.16 + ola * C * 0.08);
      }
    }
    g.strokeStyle = '#2B4C8C'; g.lineWidth = Math.max(0.8, C * 0.07); g.strokeRect(-L / 2, -e / 2, L, e);
    g.restore();
    const ux = Math.cos(tr.ang), uy = Math.sin(tr.ang);
    for (const k of [-0.5, 0, 0.5]) drapeauAuVent(g, gx(tr.x + ux * tr.L * k + tr.nx * 1.15), gy(tr.y + uy * tr.L * k + tr.ny * 1.15), C, t, k * 3, false, tk);
  }
  const d = tk.depart;
  for (const [x, ph] of [[d.x0 - 0.9, 0], [d.x1 + 0.9, 2]]) if (dans(gx(x), gy(d.y), C * 2)) drapeauAuVent(g, gx(x), gy(d.y), C, t, ph, true, tk);
  // le visiteur rare
  if (c.visiteur && S.bete && dans(gx(S.bete[0]), gy(S.bete[1]), C * 2)) bete(g, S.sorte, gx(S.bete[0]), gy(S.bete[1]), C, t);
  // l'ombre de l'hélicoptère de la télé, au sol
  const h = helico(t, V);
  if (c.heure !== 'nuit') g.drawImage(SP.helico, h.x + C * 0.8, h.y + C * 1.4, C * 3.2, C * 3.2);
  // la nuit : la piste éclairée par les projecteurs, le reste dans l'ombre
  if (c.heure === 'nuit') nuit(g, V, tk, S, P, C);
}

function nuit(g, V, tk, S, P, C) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const n = ETAT_SCENE.nuit || (ETAT_SCENE.nuit = document.createElement('canvas'));
  if (n.width !== Math.round(V.w * dpr) || n.height !== Math.round(V.h * dpr)) { n.width = Math.round(V.w * dpr); n.height = Math.round(V.h * dpr); }
  const o = n.getContext('2d'); o.setTransform(dpr, 0, 0, dpr, 0, 0); o.globalCompositeOperation = 'source-over';
  o.clearRect(0, 0, V.w, V.h); o.fillStyle = 'rgba(6,12,34,.80)'; o.fillRect(0, 0, V.w, V.h);
  o.translate(-V.x, -V.y);
  // ⚠️ des ronds de lumière un par un faisaient des taches de nuage noires : c'est la
  // piste entière qui s'éclaire, en fondu sur les bords
  o.globalCompositeOperation = 'destination-out'; o.lineJoin = 'round'; o.lineCap = 'round';
  if (tk.trace) {
    for (const [w, a] of [[2 * tk.demi + 6, 0.16], [2 * tk.demi + 3.5, 0.24], [2 * tk.demi + 1.6, 0.3], [2 * tk.demi, 0.38]]) { cheminPiste(o, tk); o.lineWidth = w * C; o.strokeStyle = `rgba(0,0,0,${a})`; o.stroke(); }
  } else {
    for (const [m, a] of [[3, 0.16], [1.8, 0.24], [0.8, 0.3], [0, 0.38]]) { o.fillStyle = `rgba(0,0,0,${a})`; for (const r of tk.outers) o.fillRect(gx(r[0] - m), gy(r[1] - m), (r[2] - r[0] + 2 * m) * C, (r[3] - r[1] + 2 * m) * C); }
    o.globalCompositeOperation = 'source-over'; o.fillStyle = 'rgba(6,12,34,.62)';
    for (const r of tk.islands) o.fillRect(gx(r[0] + 0.6), gy(r[1] + 0.6), (r[2] - r[0] - 1.2) * C, (r[3] - r[1] - 1.2) * C);
    o.globalCompositeOperation = 'destination-out';
  }
  if (P) for (const t of P.tribunes) { const x = gx(t.x), y = gy(t.y), R0 = C * (t.L / 2 + 1); const gr = o.createRadialGradient(x, y, 0, x, y, R0); gr.addColorStop(0, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); o.fillStyle = gr; o.beginPath(); o.arc(x, y, R0, 0, 6.2832); o.fill(); }
  o.globalCompositeOperation = 'source-over';
  // les fenêtres allumées et les mâts des projecteurs qui brillent
  if (P) { const r = alea(5); for (const b of P.batiments) { const x = gx(b.x), y = gy(b.y); for (let k = 0; k < 3; k++) { const on = r() < 0.7, bleu = r() < 0.2, ox = (r() - 0.5) * b.w * C * 0.7, oy = (r() - 0.5) * b.h * C * 0.7; if (on && x > V.x - C * 3 && x < V.x + V.w + C * 3 && y > V.y - C * 3 && y < V.y + V.h + C * 3) { o.fillStyle = bleu ? 'rgba(170,210,255,.9)' : 'rgba(255,214,120,.95)'; o.fillRect(x + ox, y + oy, C * 0.18, C * 0.14); } } } }
  for (const p of S.projos) {
    const x = gx(p[0]), y = gy(p[1]); if (x < V.x - C || x > V.x + V.w + C || y < V.y - C || y > V.y + V.h + C) continue;
    const gr = o.createRadialGradient(x, y, 0, x, y, C * 0.7); gr.addColorStop(0, 'rgba(255,246,210,1)'); gr.addColorStop(0.25, 'rgba(255,236,180,.8)'); gr.addColorStop(1, 'rgba(255,236,180,0)');
    o.fillStyle = gr; o.beginPath(); o.arc(x, y, C * 0.7, 0, 6.2832); o.fill();
  }
  g.drawImage(n, V.x, V.y, V.w, V.h);
}

// ---------- l'AIR ----------
function sceneAir(g) {
  if (SANS_CIEL) return;
  const c = R && R.ciel; if (!c) return;
  const now = performance.now(), t = now / 1000, V = VUE(), C = cellPx, dt = Math.max(0, Math.min(0.05, (now - (ETAT_SCENE.precAir || now)) / 1000));
  ETAT_SCENE.precAir = now;
  const r = Math.random;
  // les étincelles et les gerbes d'eau derrière la voiture qui bouge
  const vb = voitureQuiBouge();
  if (vb && !REDUIT) {
    const bx = gx(vb.x) - vb.ux * C * 0.55, by = gy(vb.y) - vb.uy * C * 0.55;
    if (mouille(c)) { if (r() < 0.9) ETAT_SCENE.gerbes.push({ x: bx, y: by, vx: -vb.ux * C * 2 + (r() - 0.5) * C, vy: -vb.uy * C * 2 + (r() - 0.5) * C, t: 0 }); }
    else if (vb.v >= 3 && r() < 0.35) for (let k = 0; k < 3; k++) ETAT_SCENE.etincelles.push({ x: bx, y: by, vx: -vb.ux * C * (5 + r() * 4) + (r() - 0.5) * C * 3, vy: -vb.uy * C * (5 + r() * 4) + (r() - 0.5) * C * 3, t: 0 });
  }
  for (let i = ETAT_SCENE.gerbes.length - 1; i >= 0; i--) {
    const o = ETAT_SCENE.gerbes[i]; o.t += dt * 1.6; if (o.t >= 1) { ETAT_SCENE.gerbes.splice(i, 1); continue; }
    o.x += o.vx * dt; o.y += o.vy * dt;
    g.beginPath(); g.arc(o.x, o.y, C * (0.15 + o.t * 0.5), 0, 6.2832); g.fillStyle = `rgba(235,242,250,${0.35 * (1 - o.t)})`; g.fill();
  }
  if (ETAT_SCENE.etincelles.length) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = ETAT_SCENE.etincelles.length - 1; i >= 0; i--) {
      const o = ETAT_SCENE.etincelles[i]; o.t += dt * 3; if (o.t >= 1) { ETAT_SCENE.etincelles.splice(i, 1); continue; }
      const x0 = o.x, y0 = o.y; o.x += o.vx * dt; o.y += o.vy * dt;
      g.strokeStyle = `rgba(255,${Math.round(180 - o.t * 120)},60,${1 - o.t})`; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x0, y0); g.lineTo(o.x, o.y); g.stroke();
    }
    g.restore();
  }
  // le feu arrière rouge, allumé sous la pluie, dans la brume et la nuit, comme les vraies
  if ((mouille(c) || c.meteo === 'brume' || c.heure === 'nuit') && !replay && !revue && Math.sin(t * 25) > 0) {
    R.cars.forEach((car, p) => {
      if (car.fini) return;
      let pos = car.p, ang = caps[p];
      if (anim && anim.pa === p) { const vb2 = voitureQuiBouge(); if (vb2) { pos = [vb2.x, vb2.y]; ang = Math.atan2(vb2.uy, vb2.ux); } }
      const x = gx(pos[0]) - Math.cos(ang) * C * 0.56, y = gy(pos[1]) - Math.sin(ang) * C * 0.56;
      g.fillStyle = 'rgba(255,40,40,.25)'; g.beginPath(); g.arc(x, y, C * 0.35, 0, 6.2832); g.fill();
      g.fillStyle = 'rgba(255,40,40,.95)'; g.beginPath(); g.arc(x, y, C * 0.1, 0, 6.2832); g.fill();
    });
  }
  // la pluie, la brume, le sable, les feuilles qui volent (dans le repère de l'écran)
  g.save(); g.translate(V.x, V.y);
  const W = V.w, H = V.h;
  if (c.meteo === 'pluie') {
    g.strokeStyle = 'rgba(225,236,250,.62)'; g.lineWidth = 1.2; g.lineCap = 'round'; g.beginPath();
    for (let k = 0; k < 230; k++) { const sp = 0.9 + (k % 7) * 0.08, l = 9 + (k % 5) * 2, y = ((k * 53.7 + t * H * 1.6 * sp) % (H + 40)) - 20, x = ((k * 97.3 - t * H * 0.35 * sp) % (W + 80) + W + 80) % (W + 80) - 40; g.moveTo(x, y); g.lineTo(x + l * 0.22, y - l); }
    g.stroke();
    for (let k = 0; k < 26; k++) { const ph = (t * 1.1 + k * 0.37) % 1, x = (k * 151.3) % W, y = (k * 89.1 + Math.floor(t * 1.1 + k * 0.37) * 61) % H; g.beginPath(); g.ellipse(x, y, 2 + ph * 7, 1 + ph * 3, 0, 0, 6.2832); g.strokeStyle = `rgba(230,240,252,${0.6 * (1 - ph)})`; g.lineWidth = 1; g.stroke(); }
  }
  if (c.meteo === 'apres' && c.heure !== 'nuit') {
    if (!ETAT_SCENE.arc || ETAT_SCENE.arc.w !== W) ETAT_SCENE.arc = { w: W, c: spriteArcEnCiel(W, H) };
    g.globalAlpha = 0.5 + 0.08 * Math.sin(t * 0.8); g.drawImage(ETAT_SCENE.arc.c, 0, 0, W, H); g.globalAlpha = 1;
    for (let k = 0; k < 14; k++) { const x = (k * 71.7) % W, y = (k * 113.9) % H, a = Math.max(0, Math.sin(t * 2 + k * 1.3)); g.fillStyle = `rgba(255,255,255,${0.7 * a})`; g.beginPath(); g.arc(x, y, 1.6, 0, 6.2832); g.fill(); }
  }
  const nappe = (x, y, w, h, coul) => { g.save(); g.translate(x, y); g.scale(w, h); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, coul[0]); gr.addColorStop(0.55, coul[1]); gr.addColorStop(1, coul[2]); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, 6.2832); g.fill(); g.restore(); };
  if (c.meteo === 'brume') {
    // ⚠️ des nappes en dégradé, sans flou : un flou recalculé à chaque image coûte cher
    g.fillStyle = 'rgba(245,247,250,.14)'; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 4; k++) {
      const bw = W * (1.1 + (k % 2) * 0.5), per = W + bw, bx = ((k * 211 + t * W * 0.012) % per) - bw * 0.5, by = H * (0.12 + k * 0.25);
      for (const dx of [0, -per]) nappe(bx + dx, by, bw / 2, H * 0.17, ['rgba(250,251,253,.55)', 'rgba(250,251,253,.28)', 'rgba(250,251,253,0)']);
    }
  }
  if (c.meteo === 'sable') {
    g.fillStyle = 'rgba(232,206,160,.20)'; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 5; k++) { const per = W * 2.2, x = ((k * 263 + t * W * 0.42 * (0.8 + (k % 3) * 0.15)) % per) - W * 0.6, y = H * (0.1 + k * 0.2) + Math.sin(t * 0.7 + k) * 12; nappe(x, y, W * 0.55, H * 0.1, ['rgba(238,216,174,.55)', 'rgba(238,216,174,.28)', 'rgba(238,216,174,0)']); }
    g.lineCap = 'round';
    for (let k = 0; k < 16; k++) {
      const per = W + 160, x0 = ((k * 97.1 + t * W * 0.55 * (0.8 + (k % 4) * 0.1)) % per) - 120, y0 = (k * 61.7) % H, L = 70 + (k % 5) * 18;
      const gr = g.createLinearGradient(x0, 0, x0 + L, 0); gr.addColorStop(0, 'rgba(248,234,204,0)'); gr.addColorStop(0.5, 'rgba(248,234,204,.85)'); gr.addColorStop(1, 'rgba(248,234,204,0)');
      g.strokeStyle = gr; g.lineWidth = 2.6; g.beginPath();
      for (let u = 0; u <= L; u += 6) g.lineTo(x0 + u, y0 + Math.sin(u / 14 + t * 3 + k) * 3.5);
      g.stroke();
    }
    g.fillStyle = 'rgba(240,222,184,.75)';
    for (let k = 0; k < 150; k++) { const sp = 0.8 + (k % 7) * 0.08, x = ((k * 53.3 + t * W * 1.1 * sp) % (W + 20)) - 10, y = (k * 29.9) % H + Math.sin(t * 4 + k) * 3; g.fillRect(x, y, 1.6, 1.6); }
  }
  if (c.meteo === 'feuilles') for (let k = 0; k < 40; k++) { const sp = 0.6 + (k % 5) * 0.12, x = ((k * 83.1 + t * W * 0.16 * sp) % (W + 40)) - 20, y = ((k * 47.3 + t * H * 0.07 * sp) % (H + 40)) - 20 + Math.sin(t * 2 + k) * 10; feuille(g, x, y, C * 0.34, t * 2.5 + k, (k % 4) / 4); }
  g.restore();
  // l'hélicoptère de la télé, qui tourne au-dessus de la course
  const h = helico(t, V);
  dessinHelico(g, h.x, h.y, h.a, C, t, c.heure === 'nuit');
}

// ---------- les petits dessins ----------
function helico(t, V) {
  const x = V.x + V.w * 0.5 + Math.sin(t * 0.21) * V.w * 0.32, y = V.y + V.h * 0.45 + Math.sin(t * 0.13 + 1) * V.h * 0.28;
  return { x, y, a: Math.atan2(Math.cos(t * 0.13 + 1) * 0.13 * V.h * 0.28, Math.cos(t * 0.21) * 0.21 * V.w * 0.32) };
}
function dessinHelico(g, x, y, a, C, t, nuitOn) {
  g.save(); g.translate(x, y); g.rotate(a);
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-C * 1.5 + 2, -C * 0.09 + 3, C * 1.2, C * 0.18); g.beginPath(); g.ellipse(2, 3, C * 0.62, C * 0.36, 0, 0, 6.2832); g.fill();
  g.fillStyle = '#F4F1EC'; g.fillRect(-C * 1.5, -C * 0.09, C * 1.2, C * 0.18);
  g.fillStyle = '#2B4C8C'; g.fillRect(-C * 1.55, -C * 0.32, C * 0.14, C * 0.64);
  g.beginPath(); g.ellipse(0, 0, C * 0.62, C * 0.36, 0, 0, 6.2832); g.fillStyle = '#F4F1EC'; g.fill();
  g.beginPath(); g.ellipse(C * 0.25, 0, C * 0.3, C * 0.26, 0, 0, 6.2832); g.fillStyle = '#7FB4D8'; g.fill();
  g.fillStyle = '#B03A2E'; g.fillRect(-C * 0.45, -C * 0.36, C * 0.5, C * 0.1);
  g.beginPath(); g.arc(0, 0, C * 1.15, 0, 6.2832); g.fillStyle = 'rgba(40,45,55,.10)'; g.fill();
  g.rotate(REDUIT ? 0.4 : t * 18); g.strokeStyle = 'rgba(40,45,55,.55)'; g.lineWidth = 2.2;
  g.beginPath(); g.moveTo(-C * 1.15, 0); g.lineTo(C * 1.15, 0); g.moveTo(0, -C * 1.15); g.lineTo(0, C * 1.15); g.stroke();
  g.restore();
  if (nuitOn && Math.sin(t * 6) > 0.6) { g.fillStyle = 'rgba(255,50,50,.9)'; g.beginPath(); g.arc(x, y, 2.6, 0, 6.2832); g.fill(); }
}
function feuille(g, x, y, s, a, c) {
  g.save(); g.translate(x, y); g.rotate(a);
  g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(0, -s * 0.65, s, 0); g.quadraticCurveTo(0, s * 0.65, -s, 0);
  g.fillStyle = ['#D9662B', '#C8402F', '#E9A93A', '#9A5B2E'][Math.floor(c * 4) % 4]; g.fill();
  g.strokeStyle = 'rgba(80,40,20,.5)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-s * 0.9, 0); g.lineTo(s * 0.9, 0); g.stroke();
  g.restore();
}
// le drapeau du pays (ou le damier au départ), qui flotte au vent.
// ⚠️ PAS « drapeau » : ui.js a déjà drapeau() (le grand drapeau d'arrivée), et le
// dernier script chargé gagne : chaque petit drapeau relançait l'arrivée, à chaque
// image (8 images/s mesurées)
function drapeauAuVent(g, x, y, C, t, ph, damier, tk) {
  const lg = C * 0.9, ht = C * 0.55;
  g.strokeStyle = '#5A6473'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y + C * 0.3); g.lineTo(x, y - C * 0.6); g.stroke();
  const pts = []; for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push([x + u * lg, y - C * 0.6 + (REDUIT ? 0 : Math.sin(t * 7 + ph - u * 3) * u * C * 0.12)]); }
  const bande = (y0, y1, col, q) => { q = q || pts; g.beginPath(); q.forEach(([px, py], k) => k ? g.lineTo(px, py + y0 * ht) : g.moveTo(px, py + y0 * ht)); for (let k = q.length - 1; k >= 0; k--) g.lineTo(q[k][0], q[k][1] + y1 * ht); g.closePath(); g.fillStyle = col; g.fill(); };
  g.save(); g.translate(1.5, 2); bande(0, 1, 'rgba(0,0,0,.2)'); g.restore();
  if (damier) {
    bande(0, 1, '#F4F1EC');
    for (let cc = 0; cc < 4; cc++) for (let rg = 0; rg < 2; rg++) if ((cc + rg) % 2) bande(rg * 0.5, (rg + 1) * 0.5, '#22282F', pts.slice(cc * 2, cc * 2 + 3));
  } else if (/^spa/.test(tk.id)) { bande(0, 0.34, '#22282F'); bande(0.33, 0.67, '#F2C84B'); bande(0.66, 1, '#D43A2E'); }
  else if (/^monaco/.test(tk.id)) { bande(0, 0.5, '#D43A2E'); bande(0.5, 1, '#F8F5EE'); }
  else if (/^monza/.test(tk.id)) { const q = (a, b) => pts.slice(a, b + 1); bande(0, 1, '#2E9A4A', q(0, 3)); bande(0, 1, '#F8F5EE', q(3, 5)); bande(0, 1, '#D43A2E', q(5, 8)); }
  else if (/^montreal/.test(tk.id)) { const q = (a, b) => pts.slice(a, b + 1); bande(0, 1, '#D43A2E', q(0, 2)); bande(0, 1, '#F8F5EE', q(2, 6)); bande(0, 1, '#D43A2E', q(6, 8)); }
  else { bande(0, 0.5, '#2B4C8C'); bande(0.5, 1, '#F4F1EC'); }
}
// le visiteur rare, en autocollant de papier découpé
function bete(g, sorte, x, y, C, t) {
  const saut = REDUIT ? 0 : Math.max(0, Math.sin(t * 2.2)) ** 8 * C * 0.25;
  g.save(); g.translate(x, y - saut);
  const contour = (f) => { g.save(); g.translate(2, 3); f(); g.fillStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,.22)'; g.fill(); g.stroke(); g.restore(); g.save(); g.lineWidth = 4; g.strokeStyle = '#fff'; g.lineJoin = 'round'; f(); g.stroke(); g.restore(); f(); };
  if (sorte === 'mouette') {
    contour(() => { g.beginPath(); g.ellipse(0, 0, C * 0.5, C * 0.3, 0, 0, 6.2832); });
    g.fillStyle = '#FFFFFF'; g.fill();
    g.beginPath(); g.ellipse(-C * 0.1, -C * 0.02, C * 0.32, C * 0.16, -0.2, 0, 6.2832); g.fillStyle = '#9AA6B4'; g.fill();
    g.beginPath(); g.arc(C * 0.42, -C * 0.22, C * 0.18, 0, 6.2832); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = '#C9D1DA'; g.lineWidth = 1; g.stroke();
    g.beginPath(); g.moveTo(C * 0.58, -C * 0.24); g.lineTo(C * 0.78, -C * 0.2); g.lineTo(C * 0.58, -C * 0.16); g.fillStyle = '#F29A2E'; g.fill();
    g.beginPath(); g.arc(C * 0.46, -C * 0.26, C * 0.035, 0, 6.2832); g.fillStyle = '#1B2430'; g.fill();
    g.strokeStyle = '#F29A2E'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-C * 0.05, C * 0.28); g.lineTo(-C * 0.08, C * 0.45); g.moveTo(C * 0.12, C * 0.28); g.lineTo(C * 0.12, C * 0.45); g.stroke();
  } else {
    contour(() => { g.beginPath(); g.ellipse(0, 0, C * 0.62, C * 0.36, 0, 0, 6.2832); });
    g.fillStyle = '#5A4232'; g.fill();
    g.beginPath(); g.ellipse(C * 0.55, -C * 0.05, C * 0.3, C * 0.24, -0.2, 0, 6.2832); g.fillStyle = '#4A3628'; g.fill();
    g.beginPath(); g.ellipse(C * 0.84, 0, C * 0.1, C * 0.08, 0, 0, 6.2832); g.fillStyle = '#C79A84'; g.fill();
    g.beginPath(); g.moveTo(C * 0.45, -C * 0.24); g.lineTo(C * 0.5, -C * 0.44); g.lineTo(C * 0.6, -C * 0.26); g.fillStyle = '#3A2A20'; g.fill();
    g.beginPath(); g.arc(C * 0.66, -C * 0.1, C * 0.035, 0, 6.2832); g.fillStyle = '#F2E6B8'; g.fill();
    g.strokeStyle = '#F4F1EC'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(C * 0.78, C * 0.08); g.lineTo(C * 0.86, C * 0.16); g.stroke();
    g.strokeStyle = '#3A2A20'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-C * 0.6, -C * 0.05); g.quadraticCurveTo(-C * 0.75, -C * 0.2 + Math.sin(t * 10) * C * 0.06, -C * 0.82, -C * 0.1); g.stroke();
  }
  g.restore();
}

// ---------- l'arrivée : confettis de papier, et feux d'artifice le soir ----------
let FETE = null;
function lancerFete() {
  const cvf = $('feteArrivee'); if (!cvf) return;
  const W = innerWidth, H = innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1), r = Math.random;
  cvf.width = Math.round(W * dpr); cvf.height = Math.round(H * dpr);
  const g = cvf.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const soir = R && R.ciel && R.ciel.heure !== 'jour';
  FETE = { g, W, H, t: 0, prec: performance.now(), soir, fusees: [], eclats: [],
    confettis: Array.from({ length: 140 }, () => ({ x: r() * W, y: -r() * H, vy: 70 + r() * 80, vx: (r() - 0.5) * 40, a: r() * 6, va: (r() - 0.5) * 8, c: PUBLIC_DECOR[Math.floor(r() * PUBLIC_DECOR.length)], w: 6 + r() * 5 })) };
  if (REDUIT) { // une seule image : les confettis posés
    for (const o of FETE.confettis) o.y = r() * H;
    imageFete(0); FETE = null; return;
  }
  requestAnimationFrame(boucleFete);
}
function boucleFete(now) {
  if (!FETE) return;
  const dt = Math.max(0, Math.min(0.05, (now - FETE.prec) / 1000)); FETE.prec = now;
  imageFete(dt);
  if (FETE && FETE.t < 8 && $('win').style.display === 'flex') requestAnimationFrame(boucleFete);
  else { if (FETE) FETE.g.clearRect(0, 0, FETE.W, FETE.H); FETE = null; }
}
function imageFete(dt) {
  const F = FETE, g = F.g, r = Math.random; F.t += dt;
  g.clearRect(0, 0, F.W, F.H);
  if (F.soir && F.t < 5 && r() < dt * 2.6) F.fusees.push({ x: F.W * (0.15 + r() * 0.7), y: F.H, vy: -F.H * (0.9 + r() * 0.4), c: PUBLIC_DECOR[Math.floor(r() * PUBLIC_DECOR.length)], h: F.H * (0.15 + r() * 0.3) });
  g.globalCompositeOperation = 'lighter';
  for (let i = F.fusees.length - 1; i >= 0; i--) {
    const o = F.fusees[i]; o.y += o.vy * dt;
    g.fillStyle = '#FFE9B0'; g.beginPath(); g.arc(o.x, o.y, 2.2, 0, 6.2832); g.fill();
    if (o.y <= o.h) { F.fusees.splice(i, 1); for (let k = 0; k < 46; k++) { const a = k / 46 * 6.2832, v = 70 + r() * 90; F.eclats.push({ x: o.x, y: o.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: o.c, t: 0 }); } }
  }
  for (let i = F.eclats.length - 1; i >= 0; i--) {
    const o = F.eclats[i]; o.t += dt * 0.8; if (o.t >= 1) { F.eclats.splice(i, 1); continue; }
    o.vy += 70 * dt; o.x += o.vx * dt; o.y += o.vy * dt;
    g.globalAlpha = 1 - o.t; g.fillStyle = o.c; g.beginPath(); g.arc(o.x, o.y, 2.4, 0, 6.2832); g.fill();
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  for (const o of F.confettis) {
    o.y += o.vy * dt; o.x += o.vx * dt + Math.sin(F.t * 3 + o.a) * 0.6; o.a += o.va * dt;
    if (F.t < 5 && o.y > F.H + 10) { o.y = -10; o.x = Math.random() * F.W; }
    g.save(); g.translate(o.x, o.y); g.rotate(o.a); g.scale(1, Math.cos(o.a * 1.7)); g.fillStyle = o.c; g.fillRect(-o.w / 2, -o.w * 0.3, o.w, o.w * 0.6); g.restore();
  }
}
