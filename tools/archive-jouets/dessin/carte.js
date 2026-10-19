// La carte du menu : la maison vue en coupe, la nuit, jusqu'à la Lune.
// Une pièce gagnée se rallume ; une pièce fermée reste dans le bleu de la nuit.
(function () {
  const PJ = window.PJ;
  const { lin, rad, silhouette, cercle, ellipse, rect, hasard, etoile } = PJ;

  // État d'exemple pour la planche : Jardin gagné, Salon à jouer, le reste fermé.
  const ETAPES = [
    { id: 'jardin', nom: 'Le Jardin', jouet: 'avion', x: 66, y: 522, etat: 'gagne', etiq: [96, 498, -2] },
    { id: 'salon', nom: 'Le Salon', jouet: 'voiture', x: 264, y: 420, etat: 'joue', etiq: [140, 366, 2] },
    { id: 'baignoire', nom: 'La Baignoire', jouet: 'canard', x: 186, y: 292, etat: 'ferme', etiq: [214, 270, -2] },
    { id: 'lune', nom: 'La Lune', jouet: 'fusee', x: 266, y: 120, etat: 'ferme', etiq: [124, 118, -2] },
  ];
  const TEXTE = { gagne: 'Gagné ★', joue: 'À jouer', ferme: 'Fermé' };

  const ciel = (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, 480, [[0, '#070f45'], [0.6, '#1b2b69'], [1, '#344281']]);
    ctx.fillRect(0, 0, w, h);
    const r = hasard(77);
    for (let k = 0; k < 90; k++) {
      ctx.fillStyle = `rgba(255,248,225,${0.35 + r() * 0.6})`;
      ctx.beginPath();
      ctx.arc(r() * w, r() * 420, r() * 1.3 + 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = 'rgba(255,230,150,.85)';
      ctx.fill(etoile(4, 4 + r() * 2.5, 1.1, 20 + r() * (w - 40), 70 + r() * 260));
    }
  };

  const lune = (ctx) => {
    const x = 266, y = 120, R = 38;
    ctx.fillStyle = rad(ctx, x, y, R, x, y, R * 2.2, [[0, 'rgba(255,240,190,.28)'], [1, 'rgba(255,240,190,0)']]);
    ctx.beginPath();
    ctx.arc(x, y, R * 2.2, 0, Math.PI * 2);
    ctx.fill();
    silhouette(ctx, [{ p: cercle(x, y, R), fill: rad(ctx, x - 12, y - 14, 0, x, y, R, [[0, '#fffbe8'], [0.7, '#f6e2a6'], [1, '#d9b766']]) }], 1.6);
    ctx.fillStyle = 'rgba(180,140,60,.3)';
    for (const [cx, cy, cr] of [[-16, 14, 6], [14, 18, 4], [20, -10, 5], [-6, -22, 3.5]]) {
      ctx.beginPath();
      ctx.arc(x + cx, y + cy, cr, 0, Math.PI * 2);
      ctx.fill();
    }
    // Le Roi Poussière assis sur la Lune, avec sa couronne
    const rx = x - 34, ry = y - 30;
    PJ.poser(ctx, rx, ry, 34, 0, () => PJ.moutonPoussiere(ctx, 0));
    const c = new Path2D(`M${rx - 10} ${ry - 12} L${rx - 8} ${ry - 22} L${rx - 4} ${ry - 16} L${rx} ${ry - 24} L${rx + 4} ${ry - 16} L${rx + 8} ${ry - 22} L${rx + 10} ${ry - 12} Z`);
    silhouette(ctx, [{ p: c, fill: lin(ctx, 0, y - 64, 0, y - 52, [[0, '#fff2a0'], [1, '#e0a400']]) }], 1.2);
    const vx = rx - 18, vy = ry + 6;
    // La veilleuse volée, sous son bras
    ctx.fillStyle = rad(ctx, vx, vy, 0, vx, vy, 12, [[0, 'rgba(255,220,120,.9)'], [1, 'rgba(255,220,120,0)']]);
    ctx.beginPath();
    ctx.arc(vx, vy, 12, 0, Math.PI * 2);
    ctx.fill();
    silhouette(ctx, [{ p: ellipse(vx, vy, 4, 5.5), fill: '#ffe08a' }], 1);
  };

  const jardin = (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 470, 0, h, [[0, '#2a6b37'], [1, '#0f3019']]);
    ctx.beginPath();
    ctx.moveTo(0, 478);
    ctx.quadraticCurveTo(w / 2, 462, w, 474);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
    // Arbre
    silhouette(ctx, [
      { p: rect(30, 380, 14, 100, 4), fill: lin(ctx, 30, 0, 44, 0, [[0, '#4a2c16'], [1, '#2a170a']]) },
      { p: cercle(37, 360, 34), fill: rad(ctx, 26, 344, 0, 37, 360, 36, [[0, '#3f8a4a'], [1, '#174a24']]) },
      { p: cercle(14, 384, 20), fill: rad(ctx, 8, 376, 0, 14, 384, 22, [[0, '#3a8045'], [1, '#174a24']]) },
      { p: cercle(62, 382, 22), fill: rad(ctx, 56, 372, 0, 62, 382, 24, [[0, '#3a8045'], [1, '#174a24']]) },
    ], 2);
    // Barrière
    ctx.strokeStyle = PJ.TRAIT;
    ctx.lineWidth = 1.5;
    for (let x = 4; x < 120; x += 14) {
      ctx.fillStyle = '#e8dcc0';
      ctx.beginPath();
      ctx.moveTo(x, 482);
      ctx.lineTo(x, 456);
      ctx.lineTo(x + 4, 451);
      ctx.lineTo(x + 8, 456);
      ctx.lineTo(x + 8, 482);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#e8dcc0';
    ctx.fillRect(0, 462, 122, 4);
    // Lucioles : le jardin est gagné, il brille
    const r = hasard(5);
    for (let k = 0; k < 9; k++) {
      const x = 10 + r() * 110, y = 340 + r() * 160;
      ctx.fillStyle = rad(ctx, x, y, 0, x, y, 7, [[0, 'rgba(230,255,140,.95)'], [1, 'rgba(230,255,140,0)']]);
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const maison = (ctx) => {
    const X0 = 128, X1 = 344, TOIT = 232, MID = 345, SOL = 474;
    // Murs extérieurs
    silhouette(ctx, [{ p: rect(X0, TOIT - 4, X1 - X0, SOL - TOIT + 6, 3), fill: '#efe3c6' }], 2.2);
    // Salon (allumé : c'est l'étape à jouer)
    ctx.save();
    ctx.beginPath();
    ctx.rect(X0 + 7, MID + 4, X1 - X0 - 14, SOL - MID - 6);
    ctx.clip();
    ctx.fillStyle = '#2f6b4f';
    ctx.fillRect(X0, MID, X1 - X0, SOL - MID);
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    for (let x = X0; x < X1; x += 16) ctx.fillRect(x, MID, 7, SOL - MID);
    ctx.fillStyle = lin(ctx, 0, SOL - 22, 0, SOL, [[0, '#8a5530'], [1, '#5e3519']]);
    ctx.fillRect(X0, SOL - 22, X1 - X0, 22);
    // Canapé
    silhouette(ctx, [
      { p: rect(X0 + 20, SOL - 62, 92, 30, 10), fill: lin(ctx, 0, SOL - 62, 0, SOL - 32, [[0, '#d24a4a'], [1, '#8f2424']]) },
      { p: rect(X0 + 14, SOL - 46, 104, 26, 8), fill: lin(ctx, 0, SOL - 46, 0, SOL - 20, [[0, '#e85a5a'], [1, '#a32b2b']]) },
    ], 1.6);
    // Lampe dont la lumière chaude remplit la pièce
    ctx.fillStyle = rad(ctx, X1 - 40, MID + 40, 0, X1 - 40, MID + 40, 120, [[0, 'rgba(255,214,120,.55)'], [1, 'rgba(255,214,120,0)']]);
    ctx.fillRect(X0, MID, X1 - X0, SOL - MID);
    silhouette(ctx, [
      { p: rect(X1 - 42, MID + 40, 4, SOL - MID - 62, 1), fill: '#3b2a1a' },
      { p: new Path2D(`M${X1 - 56} ${MID + 42} L${X1 - 24} ${MID + 42} L${X1 - 30} ${MID + 20} L${X1 - 50} ${MID + 20} Z`), fill: '#ffd98a' },
    ], 1.4);
    ctx.restore();
    // Salle de bain (fermée : bleu nuit)
    ctx.save();
    ctx.beginPath();
    ctx.rect(X0 + 7, TOIT + 4, X1 - X0 - 14, MID - TOIT - 4);
    ctx.clip();
    ctx.fillStyle = '#bfe3f2';
    ctx.fillRect(X0, TOIT, X1 - X0, MID - TOIT);
    ctx.strokeStyle = 'rgba(60,110,140,.35)';
    ctx.lineWidth = 1;
    for (let x = X0; x < X1; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, TOIT);
      ctx.lineTo(x, MID);
      ctx.stroke();
    }
    for (let y = TOIT; y < MID; y += 14) {
      ctx.beginPath();
      ctx.moveTo(X0, y);
      ctx.lineTo(X1, y);
      ctx.stroke();
    }
    silhouette(ctx, [
      { p: rect(X0 + 70, MID - 48, 120, 40, 18), fill: lin(ctx, 0, MID - 48, 0, MID - 8, [[0, '#ffffff'], [1, '#c7cfdc']]) },
      { p: rect(X0 + 80, MID - 10, 8, 8, 2), fill: '#d9b13a' },
      { p: rect(X0 + 172, MID - 10, 8, 8, 2), fill: '#d9b13a' },
    ], 1.6);
    ctx.fillStyle = 'rgba(8,18,70,.62)';
    ctx.fillRect(X0, TOIT, X1 - X0, MID - TOIT);
    ctx.restore();
    // Planchers
    ctx.fillStyle = '#7a4a26';
    ctx.strokeStyle = PJ.TRAIT;
    ctx.lineWidth = 1.6;
    for (const y of [MID, SOL - 2]) {
      ctx.beginPath();
      ctx.rect(X0, y - 3, X1 - X0, 6);
      ctx.fill();
      ctx.stroke();
    }
    // Toit et grenier
    const toit = new Path2D(`M${X0 - 14} ${TOIT + 2} L${(X0 + X1) / 2} 160 L${X1 + 14} ${TOIT + 2} Z`);
    const chem = rect(X1 - 52, 168, 18, 40, 2);
    silhouette(ctx, [
      { p: chem, fill: lin(ctx, X1 - 52, 0, X1 - 34, 0, [[0, '#8e3a2a'], [1, '#5c2018']]) },
      { p: toit, fill: lin(ctx, 0, 160, 0, TOIT, [[0, '#b23b34'], [1, '#6e1e1c']]) },
    ]);
    ctx.save();
    ctx.clip(toit);
    ctx.strokeStyle = 'rgba(40,5,10,.45)';
    ctx.lineWidth = 1;
    for (let y = 172; y < TOIT; y += 9) {
      ctx.beginPath();
      ctx.moveTo(X0 - 20, y);
      ctx.lineTo(X1 + 20, y);
      ctx.stroke();
      for (let x = X0 - 20 + ((y / 9) % 2) * 8; x < X1 + 20; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 9);
        ctx.stroke();
      }
    }
    ctx.restore();
    // Lucarne ronde du grenier, ouverte sur le ciel
    const lx = (X0 + X1) / 2, ly = 206;
    silhouette(ctx, [{ p: cercle(lx, ly, 13), fill: '#e8dcc0' }], 1.6);
    ctx.fillStyle = lin(ctx, 0, ly - 10, 0, ly + 10, [[0, '#0b1550'], [1, '#2a3a80']]);
    ctx.beginPath();
    ctx.arc(lx, ly, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3c0';
    ctx.fill(etoile(4, 3, 0.9, lx + 3, ly - 3));
  };

  // Le chemin en pointillés : doré jusqu'à l'étape à jouer, blanc ensuite.
  const chemin = (ctx) => {
    const pts = [[66, 522], [264, 420], [186, 292], [236, 206], [266, 120]];
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 4;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const cx = (x0 + x1) / 2 + (i % 2 ? -40 : 40), cy = (y0 + y1) / 2;
      ctx.setLineDash([2, 9]);
      ctx.strokeStyle = i === 0 ? '#fabc41' : 'rgba(239,239,255,.75)';
      ctx.shadowColor = 'rgba(0,0,30,.8)';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(cx, cy, x1, y1);
      ctx.stroke();
    }
    ctx.restore();
  };

  const cadenas = (ctx, x, y) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = PJ.TRAIT;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, -4, 6, Math.PI, 0);
    ctx.stroke();
    ctx.strokeStyle = '#c8cde0';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    silhouette(ctx, [{ p: rect(-9, -4, 18, 14, 3), fill: lin(ctx, 0, -4, 0, 10, [[0, '#ffe08a'], [1, '#c99000']]) }], 1.4);
    ctx.fillStyle = PJ.TRAIT;
    ctx.beginPath();
    ctx.arc(0, 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-1, 2, 2, 4);
    ctx.restore();
  };

  const medaille = (ctx, e, t) => {
    const { x, y, etat } = e;
    if (etat === 'joue') {
      ctx.fillStyle = rad(ctx, x, y, 20, x, y, 46, [[0, 'rgba(250,188,65,.75)'], [1, 'rgba(250,188,65,0)']]);
      ctx.beginPath();
      ctx.arc(x, y, 46, 0, Math.PI * 2);
      ctx.fill();
    }
    const anneau = etat === 'gagne'
      ? lin(ctx, x - 26, y - 26, x + 26, y + 26, [[0, '#fff2a0'], [0.5, '#f2b300'], [1, '#a86e00']])
      : etat === 'joue' ? '#fabc41' : '#9aa0bd';
    silhouette(ctx, [
      { p: cercle(x, y, 27), fill: anneau },
      { p: cercle(x, y, 21), fill: etat === 'ferme' ? '#4a5078' : rad(ctx, x - 6, y - 6, 0, x, y, 22, [[0, '#fff8f3'], [1, '#ffdea8']]) },
    ], 2);
    ctx.save();
    if (etat === 'ferme') ctx.globalAlpha = 0.45;
    PJ.poser(ctx, x, y + (e.jouet === 'fusee' ? 3 : 0), e.jouet === 'fusee' ? 26 : 30, 0, () => PJ[e.jouet](ctx, t));
    ctx.restore();
    if (etat === 'ferme') cadenas(ctx, x + 17, y + 15);
    if (etat === 'gagne') {
      const s = etoile(5, 10, 4.4, x + 19, y - 18);
      silhouette(ctx, [{ p: s, fill: lin(ctx, x + 10, y - 28, x + 28, y - 8, [[0, '#fff6b0'], [1, '#f2b300']]) }], 1.6);
    }
  };

  // Dessine la carte ; si `couche` est donnée, y pose les étiquettes HTML.
  PJ.carte = (ctx, w, h, t = 0, couche = null) => {
    ciel(ctx, w, h);
    lune(ctx);
    jardin(ctx, w, h);
    maison(ctx);
    chemin(ctx);
    for (const e of ETAPES) medaille(ctx, e, t);
    // Voile sombre sous les boutons, pour qu'ils restent lisibles
    ctx.fillStyle = lin(ctx, 0, h - 190, 0, h, [[0, 'rgba(5,10,40,0)'], [1, 'rgba(5,10,40,.85)']]);
    ctx.fillRect(0, h - 190, w, 190);
    if (couche) {
      couche.innerHTML = ETAPES.map((e, i) =>
        `<div class="etiq ${e.etat}" style="left:${e.etiq[0]}px;top:${e.etiq[1]}px;--r:${e.etiq[2]}deg">${i + 1} · ${e.nom}<small>${TEXTE[e.etat]}</small></div>`
      ).join('');
    }
  };

  // Petites icônes de l'interface
  PJ.boutonCouture = (ctx) => {
    silhouette(ctx, [{ p: cercle(0, 0, 42), fill: rad(ctx, -14, -16, 0, 0, 0, 44, [[0, '#ff8a7a'], [0.6, '#e2453a'], [1, '#a5241c']]) }], 5);
    ctx.strokeStyle = 'rgba(90,10,10,.5)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#fff8f3';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-11, -11);
    ctx.lineTo(11, 11);
    ctx.moveTo(11, -11);
    ctx.lineTo(-11, 11);
    ctx.stroke();
    ctx.fillStyle = '#5a120c';
    for (const [x, y] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  PJ.outilAtelier = (ctx) => {
    ctx.rotate(-0.7);
    silhouette(ctx, [
      { p: rect(-4, -46, 8, 50, 2), fill: lin(ctx, -4, 0, 4, 0, [[0, '#8a93a6'], [0.5, '#f1f4fa'], [1, '#7d8697']]) },
      { p: rect(-11, 2, 22, 44, 9), fill: lin(ctx, -11, 0, 11, 0, [[0, '#a5241c'], [0.4, '#ff6b5e'], [1, '#8f1f18']]) },
    ], 5);
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.fillRect(-6, 8, 3, 32);
  };
})();
