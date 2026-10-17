// Les boss. Vus de face. etat : 'calme' (phase 1), 'colere' (phase 2), 'battu'.
(function () {
  const PJ = window.PJ;
  const { lin, rad, silhouette, oeil, sourcil, ombre, cercle, ellipse, rect, hasard } = PJ;
  const TOILE = '#d8b27a';

  // Écossais : fond rouge, bandes vertes, filets jaunes, découpé par `forme`.
  const ecossais = (ctx, forme, x0, x1) => {
    ctx.save();
    ctx.clip(forme);
    ctx.fillStyle = lin(ctx, x0, 0, x1, 0, [[0, '#8f1f18'], [0.35, '#e0473a'], [1, '#7d1912']]);
    ctx.fillRect(-60, -60, 120, 120);
    ctx.fillStyle = 'rgba(25,80,45,.55)';
    for (let k = -60; k < 60; k += 11) {
      ctx.fillRect(k, -60, 4.5, 120);
      ctx.fillRect(-60, k, 120, 4.5);
    }
    ctx.strokeStyle = 'rgba(255,215,90,.55)';
    ctx.lineWidth = 0.6;
    for (let k = -55; k < 60; k += 11) {
      ctx.beginPath();
      ctx.moveTo(k + 7.5, -60);
      ctx.lineTo(k + 7.5, 60);
      ctx.moveTo(-60, k + 7.5);
      ctx.lineTo(60, k + 7.5);
      ctx.stroke();
    }
    ctx.restore();
  };

  // Touffe de paille : un éventail de brins.
  const paille = (ctx, x, y, angle, l, n = 7, graine = 1) => {
    const h = hasard(graine);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.lineCap = 'round';
    for (const [c, e] of [[PJ.TRAIT, 2.6], [null, 1.3]]) {
      const hh = hasard(graine);
      for (let k = 0; k < n; k++) {
        const a = (k / (n - 1) - 0.5) * 1.1 + (hh() - 0.5) * 0.2;
        const ll = l * (0.7 + hh() * 0.4);
        ctx.strokeStyle = c || (k % 2 ? '#f6d36a' : '#e0b042');
        ctx.lineWidth = e;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(Math.sin(a) * ll * 0.5, ll * 0.5, Math.sin(a) * ll, Math.cos(a) * ll);
        ctx.stroke();
      }
    }
    h();
    ctx.restore();
  };

  // Corbeau de profil, tourné vers la droite (s = -1 : vers la gauche).
  const corbeau = (ctx, x, y, s = 1, vole = false, t = 0) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, 1);
    const plume = lin(ctx, 0, -8, 0, 8, [[0, '#4a4f74'], [1, '#141629']]);
    const corps = ellipse(0, 0, 9, 6.5, -0.2);
    const tete = cercle(7, -5, 4.6);
    const queue = new Path2D('M-7 1 L-15 5 L-14 -1 Z');
    const bec = new Path2D('M10.5 -6 L16 -4.2 L10.5 -2.8 Z');
    const aile = vole
      ? new Path2D(`M-2 -2 Q-6 ${-16 - Math.sin(t * 20) * 3} 4 -14 Q4 -6 3 -2 Z`)
      : new Path2D('M-6 -2 Q0 -6 6 0 Q0 4 -6 2 Z');
    silhouette(ctx, [
      { p: queue, fill: plume },
      { p: corps, fill: plume },
      { p: tete, fill: plume },
      { p: bec, fill: lin(ctx, 10, -6, 16, -3, [[0, '#ffc23d'], [1, '#e07a0c']]) },
      { p: aile, fill: lin(ctx, 0, -10, 0, 3, [[0, '#5d6390'], [1, '#22253f']]) },
    ], 1.4);
    if (!vole) {
      ctx.strokeStyle = '#e07a0c';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-1, 6);
      ctx.lineTo(-1, 9);
      ctx.moveTo(2, 6);
      ctx.lineTo(2, 9);
      ctx.stroke();
    }
    oeil(ctx, 8.4, -6, 1.9, { iris: '#ffb020', regard: [0.6, 0] });
    ctx.restore();
  };

  // Œil en spirale (étourdi).
  const spirale = (ctx, x, y, r) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = PJ.TRAIT;
    ctx.lineWidth = r * 0.3;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = r * 0.22;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 5; a += 0.2) {
      const rr = (a / (Math.PI * 5)) * r * 0.8;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.stroke();
    ctx.restore();
  };

  PJ.epouvantail = (ctx, t = 0, etat = 'calme') => {
    const colere = etat === 'colere', battu = etat === 'battu';
    const h = hasard(17);
    if (colere) {
      // Halo orangé derrière lui
      ctx.fillStyle = rad(ctx, 0, -20, 0, 0, -20, 60, [[0, 'rgba(255,140,30,.45)'], [1, 'rgba(255,140,30,0)']]);
      ctx.fillRect(-60, -80, 120, 130);
    }
    ombre(ctx, 0, 66, 34, 7, 0.4);
    // Piquet
    const piquet = rect(-3.2, 10, 6.4, 57, 2);
    silhouette(ctx, [{ p: piquet, fill: lin(ctx, -3, 0, 3, 0, [[0, '#6b4220'], [0.4, '#b98048'], [1, '#5a3618']]) }], 2);
    if (battu) {
      // Paille tombée par terre
      for (let k = 0; k < 6; k++) paille(ctx, -26 + k * 10, 63, Math.PI / 2 + (k % 2 ? 0.4 : -0.4), 9, 5, 30 + k);
    }
    ctx.save();
    if (battu) ctx.rotate(0.13);
    if (colere) ctx.rotate(Math.sin(t * 9) * 0.03);
    // Traverse des bras
    const traverse = rect(-50, -8, 100, 6, 2);
    silhouette(ctx, [{ p: traverse, fill: lin(ctx, 0, -8, 0, -2, [[0, '#c48a50'], [1, '#6b4220']]) }], 2);
    // Paille aux poignets et sous la chemise
    paille(ctx, -42, -3, Math.PI / 2 + 0.2, 12, 7, 3);
    paille(ctx, 42, -3, -Math.PI / 2 - 0.2, 12, 7, 4);
    for (let k = 0; k < 4; k++) paille(ctx, -14 + k * 9.5, 29, 0, 11, 6, 10 + k);
    // Chemise à carreaux et manches
    const mancheG = new Path2D('M-13 -13 L-40 -11 L-42 4 L-14 9 Z');
    const mancheD = new Path2D('M13 -13 L40 -11 L42 4 L14 9 Z');
    const torse = new Path2D('M-16 -13 L16 -13 L21 31 Q0 35 -21 31 Z');
    silhouette(ctx, [
      { p: mancheG, fill: '#c0392b' },
      { p: mancheD, fill: '#c0392b' },
      { p: torse, fill: '#c0392b' },
    ]);
    ecossais(ctx, mancheG, -42, -13);
    ecossais(ctx, mancheD, 13, 42);
    ecossais(ctx, torse, -21, 21);
    // Pièce bleue cousue
    ctx.save();
    ctx.translate(8, 12);
    ctx.rotate(0.12);
    ctx.fillStyle = lin(ctx, -6, -6, 6, 6, [[0, '#5b8ef0'], [1, '#2a55b8']]);
    ctx.strokeStyle = PJ.TRAIT;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.rect(-6, -6, 12, 11);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([1.6, 1.4]);
    ctx.strokeStyle = '#fff3c8';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-4.4, -4.4, 8.8, 7.8);
    ctx.restore();
    // Boutons de la chemise et ceinture de corde
    ctx.fillStyle = '#f2e3c0';
    ctx.strokeStyle = PJ.TRAIT;
    ctx.lineWidth = 1;
    for (const y of [-6, 2]) {
      ctx.beginPath();
      ctx.arc(-2, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = lin(ctx, 0, 20, 0, 24, [[0, '#d9b070'], [1, '#8a6330']]);
    ctx.fillRect(-19.5, 20, 39, 3.6);
    ctx.strokeStyle = 'rgba(70,45,15,.6)';
    ctx.lineWidth = 0.8;
    for (let x = -19; x < 20; x += 2.6) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x + 2, 23.6);
      ctx.stroke();
    }
    // Corbeau perché sur le bras (il s'envole quand l'épouvantail est battu)
    if (battu) corbeau(ctx, 34, -54, 1, true, t);
    else corbeau(ctx, -33, -16, 1, colere, t);
    // Tête en toile de jute
    paille(ctx, -15, -40, 1.2, 10, 6, 5);
    paille(ctx, 15, -40, -1.2, 10, 6, 6);
    paille(ctx, 0, -13, 0, 6, 5, 7);
    const tete = ellipse(0, -29, 17, 17.5);
    silhouette(ctx, [{ p: tete, fill: rad(ctx, -6, -36, 0, 0, -29, 20, [[0, '#f0d3a0'], [0.7, TOILE], [1, '#a8814a']]) }]);
    ctx.save();
    ctx.clip(tete);
    ctx.strokeStyle = 'rgba(110,75,30,.22)';
    ctx.lineWidth = 0.7;
    for (let k = -50; k < 0; k += 2.2) {
      ctx.beginPath();
      ctx.moveTo(-20, k);
      ctx.lineTo(20, k);
      ctx.stroke();
    }
    for (let k = -20; k < 20; k += 2.2) {
      ctx.beginPath();
      ctx.moveTo(k, -50);
      ctx.lineTo(k, 0);
      ctx.stroke();
    }
    // Ombre du côté droit
    ctx.fillStyle = 'rgba(80,50,20,.18)';
    ctx.beginPath();
    ctx.ellipse(10, -26, 10, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Corde au cou
    ctx.fillStyle = lin(ctx, 0, -15, 0, -11, [[0, '#d9b070'], [1, '#8a6330']]);
    ctx.strokeStyle = PJ.TRAIT;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-11, -15, 22, 4, 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(5, -12, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Joues
    ctx.fillStyle = 'rgba(230,90,80,.4)';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(s * 10.5, -24, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Yeux et sourcils selon l'état
    if (battu) {
      spirale(ctx, -6.8, -33, 5);
      spirale(ctx, 6.8, -33, 5);
    } else if (colere) {
      oeil(ctx, -6.8, -33, 5.2, { lueur: '#ff9a1a' });
      oeil(ctx, 6.8, -33, 5.2, { lueur: '#ff9a1a' });

    } else {
      oeil(ctx, -6.8, -33, 5.2, { iris: '#3f8a3a', regard: [0.3, 0.2], paupiere: 0.38, peau: '#dcb67f' });
      oeil(ctx, 6.8, -33, 5.2, { iris: '#3f8a3a', regard: [0.3, 0.2], paupiere: 0.38, peau: '#dcb67f' });

    }
    // Nez carotte
    const nez = new Path2D('M-1.5 -32.5 Q-3.2 -29 -1.2 -25.6 L11 -24.4 Z');
    silhouette(ctx, [{ p: nez, fill: lin(ctx, 0, -30, 8, -23, [[0, '#ffa245'], [1, '#e0600c']]) }], 1.3);
    // Bouche cousue
    ctx.strokeStyle = PJ.TRAIT;
    ctx.lineCap = 'round';
    if (colere) {
      const b = new Path2D('M-9 -21 L-5 -17 L-1 -20 L3 -16 L7 -20 L9 -18 Q0 -10 -9 -21 Z');
      ctx.fillStyle = '#3a0f1c';
      ctx.fill(b);
      ctx.lineWidth = 1.6;
      ctx.stroke(b);
    } else if (battu) {
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-8, -19);
      for (let k = 1; k <= 8; k++) ctx.lineTo(-8 + k * 2, -19 + (k % 2 ? -1.6 : 1.6));
      ctx.stroke();
    } else {
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-8, -20);
      ctx.quadraticCurveTo(0, -16.5, 9, -22.5);
      ctx.stroke();
    }
    // Points de couture en travers de la bouche
    ctx.lineWidth = 1.1;
    for (let k = 0; k < 5; k++) {
      const x = -6 + k * 3.4, y = colere ? -18.5 : battu ? -19 : -20 + k * -0.4 + (k * k) * 0.0;
      ctx.beginPath();
      ctx.moveTo(x - 1, y - 1.8);
      ctx.lineTo(x + 1, y + 1.8);
      ctx.stroke();
    }
    // Chapeau de paille
    ctx.save();
    if (battu) {
      ctx.translate(-30, -50);
      ctx.rotate(-0.6);
      ctx.translate(0, 45);
    } else if (colere) {
      ctx.translate(0, -45);
      ctx.rotate(-0.22);
      ctx.translate(0, 45);
    }
    const bord = ellipse(0, -45, 28, 6.5);
    const calotte = new Path2D('M-14 -45 Q-15 -64 0 -64 Q15 -64 14 -45 Z');
    const pailleCh = (y0, y1) => lin(ctx, 0, y0, 0, y1, [[0, '#ffe58a'], [1, '#c8902a']]);
    silhouette(ctx, [
      { p: bord, fill: pailleCh(-52, -38) },
      { p: calotte, fill: pailleCh(-64, -45) },
    ]);
    ctx.save();
    ctx.clip(calotte);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-16, -51, 32, 4.5);
    ctx.strokeStyle = 'rgba(140,90,20,.4)';
    ctx.lineWidth = 0.7;
    for (let k = -16; k < 16; k += 2.4) {
      ctx.beginPath();
      ctx.moveTo(k, -66);
      ctx.lineTo(k + 1.5, -45);
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.clip(bord);
    ctx.strokeStyle = 'rgba(140,90,20,.4)';
    ctx.lineWidth = 0.7;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.ellipse(0, -45, 18 + k * 4, 3.6 + k * 1, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    // Trou dans le chapeau, paille qui en sort
    paille(ctx, 6, -60, Math.PI + 0.3, 6, 4, 8);
    ctx.restore();
    // Sourcils par-dessus le bord du chapeau, sinon on ne les voit pas
    if (colere) {
      sourcil(ctx, -7, -39, 10, -0.6, 1, '#5a3a14', 3.2);
      sourcil(ctx, 7, -39, 10, 0.6, 1, '#5a3a14', 3.2);
    } else if (!battu) {
      sourcil(ctx, -7, -38.6, 9, -0.12, 1, '#5a3a14', 2.8);
      sourcil(ctx, 7, -40.4, 9, -0.1, 1, '#5a3a14', 2.8);
    }
    ctx.restore();
    if (colere) {
      // Brins de paille arrachés qui volent
      ctx.strokeStyle = '#f6d36a';
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      for (let k = 0; k < 14; k++) {
        const x = (h() - 0.5) * 100, y = -70 + h() * 100, a = h() * 3;
        if (Math.abs(x) < 24 && y > -66) continue;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a + t);
        ctx.strokeStyle = PJ.TRAIT;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-3.5, 0);
        ctx.lineTo(3.5, 0);
        ctx.stroke();
        ctx.strokeStyle = '#f6d36a';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      }
    }
    if (battu) {
      // Petites étoiles qui tournent au-dessus de la tête
      for (let k = 0; k < 3; k++) {
        const a = t * 3 + (k * Math.PI * 2) / 3;
        const p = PJ.etoile(5, 3.6, 1.6, Math.cos(a) * 16, -50 + Math.sin(a) * 4);
        silhouette(ctx, [{ p, fill: '#ffd21f' }], 1);
      }
    }
  };
})();
