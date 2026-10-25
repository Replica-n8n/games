// Les ennemis, deux par monde. Ils viennent vers le joueur : tête vers le bas
// (dans la baignoire, ils montent : tête vers le haut, le moteur les tourne).
(function () {
  const PJ = window.PJ;
  const { lin, rad, silhouette, oeil, sourcil, ombre, cercle, ellipse, rect, etoile, hasard } = PJ;
  const NOIR = '#2a2233';

  // Bouche : 'grogne' (arc vers le bas), 'rit' (dents), 'o'
  const bouche = (ctx, x, y, l, forme) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = PJ.TRAIT;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    if (forme === 'o') {
      ctx.fillStyle = '#5a1630';
      ctx.beginPath();
      ctx.ellipse(0, 0, l * 0.3, l * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (forme === 'rit') {
      const p = new Path2D(`M${-l / 2} 0 Q0 ${l * 0.75} ${l / 2} 0 Z`);
      ctx.fillStyle = '#5a1630';
      ctx.fill(p);
      ctx.save();
      ctx.clip(p);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-l / 2, -1, l, l * 0.18);
      ctx.restore();
      ctx.stroke(p);
    } else {
      ctx.beginPath();
      ctx.moveTo(-l / 2, l * 0.12);
      ctx.quadraticCurveTo(0, -l * 0.28, l / 2, l * 0.12);
      ctx.stroke();
    }
    ctx.restore();
  };

  // ---------- Guêpe ----------
  PJ.guepe = (ctx, t = 0) => {
    ombre(ctx, 8, 14, 30, 14, 0.25);
    const bat = Math.sin(t * 50) * 0.25;
    const ailes = [-1, 1].map((s) => ellipse(s * 17, -10, 16, 8, s * (0.55 + bat)));
    ctx.save();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(36,24,58,.7)';
    for (const a of ailes) {
      ctx.fillStyle = 'rgba(225,242,255,.6)';
      ctx.fill(a);
      ctx.stroke(a);
    }
    ctx.restore();
    const dard = new Path2D('M-3 -36 L0 -46 L3 -36 Z');
    const abdo = ellipse(0, -18, 13, 18);
    const thorax = cercle(0, 3, 10);
    const tete = ellipse(0, 18, 13, 11);
    // Pattes
    ctx.strokeStyle = PJ.TRAIT;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (const s of [-1, 1])
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(s * 7, -2 + k * 5);
        ctx.lineTo(s * 16, k * 7 - 4);
        ctx.lineTo(s * 18, k * 7 + 2);
        ctx.stroke();
      }
    silhouette(ctx, [
      { p: dard, fill: '#3a2c3a' },
      { p: abdo, fill: rad(ctx, -4, -24, 0, 0, -18, 20, [[0, '#fff27a'], [0.6, '#ffc61a'], [1, '#d98a00']]) },
      { p: thorax, fill: rad(ctx, -3, 0, 0, 0, 3, 11, [[0, '#6b5040'], [1, '#2b1d18']]) },
      { p: tete, fill: rad(ctx, -4, 14, 0, 0, 18, 14, [[0, '#fff27a'], [0.6, '#ffc61a'], [1, '#d98a00']]) },
    ]);
    ctx.save();
    ctx.clip(abdo);
    ctx.fillStyle = NOIR;
    for (const y of [-30, -21, -12]) ctx.fillRect(-14, y, 28, 4.6);
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.beginPath();
    ctx.ellipse(-5, -24, 3, 7, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Poils du thorax
    ctx.strokeStyle = 'rgba(255,220,160,.5)';
    ctx.lineWidth = 0.8;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 7, 3 + Math.sin(a) * 7);
      ctx.lineTo(Math.cos(a) * 9.5, 3 + Math.sin(a) * 9.5);
      ctx.stroke();
    }
    // Antennes
    ctx.strokeStyle = PJ.TRAIT;
    ctx.lineWidth = 1.8;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 4, 27);
      ctx.quadraticCurveTo(s * 8, 36, s * 14, 34);
      ctx.stroke();
      ctx.fillStyle = NOIR;
      ctx.beginPath();
      ctx.arc(s * 14, 34, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    oeil(ctx, -5.5, 17, 4.4, { iris: '#c0392b', regard: [0, 0.7], paupiere: 0.32, peau: '#ffc61a' });
    oeil(ctx, 5.5, 17, 4.4, { iris: '#c0392b', regard: [0, 0.7], paupiere: 0.32, peau: '#ffc61a' });
    sourcil(ctx, -6, 12, 8, -0.45, 1);
    sourcil(ctx, 6, 12, 8, 0.45, 1);
    bouche(ctx, 0, 24.5, 6, 'grogne');
  };

  // ---------- Cerf-volant pirate ----------
  PJ.cerfVolant = (ctx, t = 0) => {
    // Queue de nœuds qui ondule (vers le haut : il fonce vers le bas)
    ctx.strokeStyle = PJ.TRAIT;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -40);
    const pts = [];
    for (let k = 1; k <= 4; k++) {
      const y = -40 - k * 9;
      const x = Math.sin(t * 5 + k * 0.9) * 6;
      pts.push([x, y]);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    pts.forEach(([x, y], k) => {
      const n = new Path2D(`M${x} ${y} L${x - 6} ${y - 3.5} L${x - 6} ${y + 3.5} Z M${x} ${y} L${x + 6} ${y - 3.5} L${x + 6} ${y + 3.5} Z`);
      silhouette(ctx, [{ p: n, fill: k % 2 ? '#f2f2f2' : '#d6263c' }], 1.3);
    });
    ombre(ctx, 10, 16, 30, 26, 0.22);
    const q = [
      ['M0 -40 L-29 0 L0 0 Z', lin(ctx, -29, -40, 0, 0, [[0, '#ff4d5e'], [1, '#b0102a']])],
      ['M0 -40 L29 0 L0 0 Z', lin(ctx, 0, -40, 29, 0, [[0, '#3a3346'], [1, '#17131f']])],
      ['M0 46 L-29 0 L0 0 Z', lin(ctx, -29, 0, 0, 46, [[0, '#3a3346'], [1, '#17131f']])],
      ['M0 46 L29 0 L0 0 Z', lin(ctx, 0, 0, 29, 46, [[0, '#e8283f'], [1, '#8f0c22']])],
    ].map(([d, fill]) => ({ p: new Path2D(d), fill }));
    silhouette(ctx, q);
    // Baguettes en bois
    ctx.strokeStyle = '#c99a5b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -38);
    ctx.lineTo(0, 44);
    ctx.moveTo(-27, 0);
    ctx.lineTo(27, 0);
    ctx.stroke();
    // Visage peint : un bandeau sur l'œil, un sourire à dent d'or
    const visage = cercle(0, 8, 15);
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = PJ.TRAIT;
    ctx.stroke(visage);
    ctx.fillStyle = rad(ctx, -4, 3, 0, 0, 8, 16, [[0, '#fff3e0'], [1, '#e9cfa6']]);
    ctx.fill(visage);
    ctx.strokeStyle = PJ.TRAIT;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(13, 12);
    ctx.stroke();
    ctx.fillStyle = NOIR;
    ctx.beginPath();
    ctx.ellipse(5, 5, 5, 4.4, 0.4, 0, Math.PI * 2);
    ctx.fill();
    oeil(ctx, -5.5, 4.5, 3.8, { iris: '#2f6ad0', regard: [0, 0.6] });
    sourcil(ctx, -5.5, -0.5, 7, -0.4, 1);
    const sourire = new Path2D('M-8 13 Q0 21 8 12 Q0 16 -8 13 Z');
    ctx.fillStyle = '#5a1630';
    ctx.fill(sourire);
    ctx.lineWidth = 1.6;
    ctx.stroke(sourire);
    ctx.fillStyle = '#ffd34d';
    ctx.fillRect(1, 13.5, 3, 2.6);
    // Pois blancs sur le rouge
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (const [x, y] of [[-10, -16], [-16, -6], [12, 26], [16, 18]]) {
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // ---------- Soldat de plomb (vu de trois quarts, avec son tambour) ----------
  PJ.soldat = (ctx, t = 0) => {
    const pas = Math.sin(t * 8) * 1.5;
    ombre(ctx, 4, 44, 26, 7, 0.35);
    const socle = ellipse(0, 40, 20, 6);
    const jambes = new Path2D(`M-9 14 L-10 ${38 + pas} L-2 ${38 + pas} L-1 16 L1 16 L2 ${38 - pas} L10 ${38 - pas} L9 14 Z`);
    const veste = rect(-13, -10, 26, 28, 6);
    const brasG = rect(-19, -8, 7, 22, 3.5);
    const brasD = rect(12, -8, 7, 22, 3.5);
    const tete = cercle(0, -17, 9.5);
    const shako = rect(-10, -48, 20, 26, 4);
    const tambour = ellipse(0, 16, 12, 9);
    const metal = (x0, x1, c0, c1, c2) => lin(ctx, x0, 0, x1, 0, [[0, c0], [0.35, c1], [1, c2]]);
    silhouette(ctx, [
      { p: socle, fill: lin(ctx, 0, 34, 0, 46, [[0, '#4fa36a'], [1, '#22603a']]) },
      { p: jambes, fill: metal(-10, 10, '#20387a', '#4f78d6', '#172a5e') },
      { p: brasG, fill: metal(-19, -12, '#8a0f22', '#e8394d', '#7a0c1d') },
      { p: brasD, fill: metal(12, 19, '#8a0f22', '#e8394d', '#7a0c1d') },
      { p: veste, fill: metal(-13, 13, '#8a0f22', '#ff4b5f', '#7a0c1d') },
      { p: tete, fill: rad(ctx, -3, -20, 0, 0, -17, 11, [[0, '#ffe1c4'], [1, '#e2a77a']]) },
      { p: shako, fill: metal(-10, 10, '#141420', '#4a4a5e', '#0d0d16') },
      { p: tambour, fill: metal(-12, 12, '#d8dce8', '#ffffff', '#9aa2b8') },
    ]);
    // Bandoulières blanches en croix, boutons dorés
    ctx.save();
    ctx.clip(veste);
    ctx.strokeStyle = '#f4f2ea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-13, -10);
    ctx.lineTo(13, 14);
    ctx.moveTo(13, -10);
    ctx.lineTo(-13, 14);
    ctx.stroke();
    ctx.restore();
    // Tambour : cerclage rouge en zigzag
    ctx.save();
    ctx.clip(tambour);
    ctx.fillStyle = '#d6263c';
    ctx.fillRect(-13, 12, 26, 14);
    ctx.strokeStyle = '#ffd34d';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let k = 0; k <= 8; k++) ctx.lineTo(-12 + k * 3, k % 2 ? 22 : 15);
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = PJ.TRAIT;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 12.5, 11, 4.6, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Baguettes
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#c99a5b';
    ctx.beginPath();
    ctx.moveTo(-16, 10);
    ctx.lineTo(-5, 4 + pas);
    ctx.moveTo(16, 10);
    ctx.lineTo(5, 4 - pas);
    ctx.stroke();
    // Plaque et plumet du shako
    ctx.fillStyle = lin(ctx, -5, -40, 5, -30, [[0, '#fff2a8'], [1, '#c99000']]);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = PJ.TRAIT;
    const plaque = etoile(6, 5.4, 3, 0, -34);
    ctx.fill(plaque);
    ctx.stroke(plaque);
    const plumet = ellipse(0, -52, 4, 7);
    silhouette(ctx, [{ p: plumet, fill: lin(ctx, 0, -59, 0, -45, [[0, '#ff7a88'], [1, '#c4102a']]) }], 1.6);
    // Reflet de métal sur le shako
    ctx.fillStyle = 'rgba(255,255,255,.28)';
    ctx.fillRect(-7, -46, 3, 22);
    // Visage
    oeil(ctx, -3.6, -18, 2.8, { iris: '#2b3f8a', regard: [0, 0.3], paupiere: 0.35, peau: '#efbf98' });
    oeil(ctx, 3.6, -18, 2.8, { iris: '#2b3f8a', regard: [0, 0.3], paupiere: 0.35, peau: '#efbf98' });
    ctx.fillStyle = 'rgba(240,90,90,.45)';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(s * 6, -13.5, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    const moustache = new Path2D('M0 -13 Q-5 -15 -8 -11 Q-4 -12 0 -11 Q4 -12 8 -11 Q5 -15 0 -13 Z');
    ctx.fillStyle = '#3b2416';
    ctx.fill(moustache);
    // Jugulaire dorée
    ctx.strokeStyle = '#e0a800';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -17, 9.5, 0.3, Math.PI - 0.3);
    ctx.stroke();
  };

  // ---------- Brique qui roule (vue de dessus, les deux tenons de devant sont ses yeux) ----------
  PJ.brique = (ctx, t = 0) => {
    ombre(ctx, 6, 6, 34, 46, 0.3);
    const roues = [[-28, -32], [20, -32], [-28, 18], [20, 18]].map(([x, y]) => rect(x, y, 8, 15, 3));
    const corps = rect(-23, -42, 46, 84, 5);
    silhouette(ctx, [
      ...roues.map((p) => ({ p, fill: '#22202b' })),
      { p: corps, fill: lin(ctx, -23, 0, 23, 0, [[0, '#16884a'], [0.3, '#3fd07e'], [1, '#0f6a39']]) },
    ]);
    const tenon = (x, y) => {
      ctx.fillStyle = 'rgba(0,40,20,.35)';
      ctx.beginPath();
      ctx.arc(x + 1.5, y + 2, 7.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = 'rgba(10,50,30,.7)';
      ctx.fillStyle = rad(ctx, x - 2.5, y - 2.5, 0, x, y, 7.4, [[0, '#8ef0b2'], [0.6, '#35c374'], [1, '#18874a']]);
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };
    for (let r = 0; r < 3; r++) for (const c of [-1, 1]) tenon(c * 11, -30 + r * 20);
    // Les deux tenons de devant : des yeux
    oeil(ctx, -11, 31, 7.2, { iris: '#e0402a', regard: [0, 0.8], paupiere: 0.3, peau: '#2ab565' });
    oeil(ctx, 11, 31, 7.2, { iris: '#e0402a', regard: [0, 0.8], paupiere: 0.3, peau: '#2ab565' });
    sourcil(ctx, -11, 23, 13, -0.4, 1, PJ.TRAIT, 3);
    sourcil(ctx, 11, 23, 13, 0.4, 1, PJ.TRAIT, 3);
    // Reflet plastique
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.fillRect(-20, -40, 4, 80);
  };

  // ---------- Poisson-éponge (éponge de cuisine, grattoir vert sur le dos) ----------
  PJ.poissonEponge = (ctx, t = 0) => {
    const nage = Math.sin(t * 8) * 0.25;
    const queue = new Path2D();
    queue.addPath(new Path2D('M0 -26 L-15 -46 L15 -46 Z'), new DOMMatrix().rotate(nage * 30));
    const corps = rect(-20, -32, 40, 66, 14);
    const nagG = new Path2D('M-19 0 L-32 -8 L-30 10 Z');
    const nagD = new Path2D('M19 0 L32 -8 L30 10 Z');
    const jaune = lin(ctx, -20, 0, 20, 0, [[0, '#d9a812'], [0.35, '#ffe46a'], [1, '#c99a0c']]);
    silhouette(ctx, [
      { p: queue, fill: lin(ctx, 0, -46, 0, -26, [[0, '#3aa24f'], [1, '#1f6e33']]) },
      { p: nagG, fill: '#f2c629' },
      { p: nagD, fill: '#d9ab12' },
      { p: corps, fill: jaune },
    ]);
    ctx.save();
    ctx.clip(corps);
    // Grattoir vert le long du dos
    ctx.fillStyle = lin(ctx, -8, 0, 8, 0, [[0, '#1f6e33'], [0.4, '#4cbf63'], [1, '#1a5e2b']]);
    ctx.fillRect(-8, -32, 16, 44);
    ctx.strokeStyle = 'rgba(10,40,15,.45)';
    ctx.lineWidth = 0.8;
    for (let k = 0; k < 14; k++) {
      ctx.beginPath();
      ctx.moveTo(-8, -32 + k * 3.4);
      ctx.lineTo(8, -29 + k * 3.4);
      ctx.stroke();
    }
    // Pores de l'éponge
    const h = hasard(42);
    ctx.fillStyle = 'rgba(150,100,0,.45)';
    for (let k = 0; k < 40; k++) {
      const x = -19 + h() * 38, y = -30 + h() * 62;
      if (Math.abs(x) < 9 && y < 12) continue;
      ctx.beginPath();
      ctx.ellipse(x, y, 0.8 + h() * 1.6, 0.6 + h() * 1.1, h() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    oeil(ctx, -8, 20, 5.6, { iris: '#7b3fc4', regard: [0, 0.6] });
    oeil(ctx, 8, 20, 5.6, { iris: '#7b3fc4', regard: [0, 0.6] });
    sourcil(ctx, -8, 12.5, 9, -0.35, 1);
    sourcil(ctx, 8, 12.5, 9, 0.35, 1);
    bouche(ctx, 0, 29.5, 7, 'o');
  };

  // ---------- Bateau de bain (coque rouge, cabine blanche, cheminée) ----------
  PJ.bateauBain = (ctx, t = 0) => {
    const tangue = Math.sin(t * 3) * 0.06;
    ctx.rotate(tangue);
    ombre(ctx, 4, 4, 30, 46, 0.25);
    const coque = new Path2D('M0 44 Q24 30 24 -6 L22 -40 Q0 -46 -22 -40 L-24 -6 Q-24 30 0 44 Z');
    const pont = new Path2D('M0 36 Q18 26 18 -6 L17 -34 Q0 -38 -17 -34 L-18 -6 Q-18 26 0 36 Z');
    const cabine = rect(-12, -24, 24, 26, 5);
    const chem = cercle(0, -30, 6.5);
    silhouette(ctx, [
      { p: coque, fill: lin(ctx, -24, 0, 24, 0, [[0, '#a5122a'], [0.35, '#ff5266'], [1, '#8f0c22']]) },
      { p: pont, fill: lin(ctx, -18, 0, 18, 0, [[0, '#d7b98c'], [0.4, '#f6e2bd'], [1, '#c3a271']]) },
      { p: cabine, fill: lin(ctx, -12, 0, 12, 0, [[0, '#d7dbe8'], [0.4, '#ffffff'], [1, '#aeb6ca']]) },
      { p: chem, fill: rad(ctx, -2, -32, 0, 0, -30, 7, [[0, '#ffd85a'], [1, '#e08a00']]) },
    ]);
    // Lattes du pont
    ctx.save();
    ctx.clip(pont);
    ctx.strokeStyle = 'rgba(120,80,30,.35)';
    ctx.lineWidth = 0.8;
    for (let x = -16; x < 18; x += 5) {
      ctx.beginPath();
      ctx.moveTo(x, -40);
      ctx.lineTo(x, 40);
      ctx.stroke();
    }
    ctx.restore();
    // Hublots-yeux sur la cabine
    oeil(ctx, -5, -10, 4.2, { iris: '#1f6fd1', regard: [0, 0.8], paupiere: 0.3, peau: '#e8ebf3' });
    oeil(ctx, 5, -10, 4.2, { iris: '#1f6fd1', regard: [0, 0.8], paupiere: 0.3, peau: '#e8ebf3' });
    sourcil(ctx, -5, -15.5, 7, -0.4, 1);
    sourcil(ctx, 5, -15.5, 7, 0.4, 1);
    // Bouée sur l'avant
    ctx.lineWidth = 4;
    ctx.strokeStyle = PJ.TRAIT;
    ctx.beginPath();
    ctx.arc(0, 22, 6, 0, Math.PI * 2);
    ctx.stroke();
    for (let k = 0; k < 4; k++) {
      ctx.strokeStyle = k % 2 ? '#ffffff' : '#ff5266';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(0, 22, 6, (k * Math.PI) / 2, ((k + 1) * Math.PI) / 2);
      ctx.stroke();
    }
    // Fumée de bulles de savon
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.strokeStyle = 'rgba(36,24,58,.4)';
    ctx.lineWidth = 1;
    for (let k = 0; k < 3; k++) {
      const y = -40 - k * 7 - ((t * 10) % 7);
      ctx.beginPath();
      ctx.arc(Math.sin(t * 3 + k) * 3, y, 2.4 + k, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  };

  // ---------- Mouton de poussière ----------
  PJ.moutonPoussiere = (ctx, t = 0) => {
    const h = hasard(9);
    const touffes = [cercle(0, 0, 27)];
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2 + Math.sin(t * 2 + k) * 0.04;
      const r = 26 + h() * 4;
      touffes.push(cercle(Math.cos(a) * r, Math.sin(a) * r, 7 + h() * 4));
    }
    const gris = rad(ctx, -10, -12, 0, 0, 0, 40, [[0, '#ecebf2'], [0.6, '#b4b0c4'], [1, '#7d7892']]);
    silhouette(ctx, touffes.map((p) => ({ p, fill: gris })), 2.4);
    // Duvet : petits poils
    ctx.strokeStyle = 'rgba(70,64,90,.6)';
    ctx.lineWidth = 1;
    for (let k = 0; k < 26; k++) {
      const a = h() * Math.PI * 2, r = 30 + h() * 8;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(a) * 4, y + Math.sin(a) * 4 - 2, x + Math.cos(a + 0.6) * 7, y + Math.sin(a + 0.6) * 7);
      ctx.stroke();
    }
    // Un fil bleu et une miette coincés dedans
    ctx.strokeStyle = '#3a7be0';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-26, -14);
    ctx.bezierCurveTo(-14, -26, -4, -10, 6, -24);
    ctx.stroke();
    ctx.fillStyle = '#c98a3e';
    ctx.strokeStyle = PJ.TRAIT;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, -18);
    ctx.lineTo(23, -15);
    ctx.lineTo(19, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    oeil(ctx, -9, 2, 7, { iris: '#8a4fd8', regard: [0, 0.6], paupiere: 0.28, peau: '#c9c5d6' });
    oeil(ctx, 9, 2, 7, { iris: '#8a4fd8', regard: [0, 0.6], paupiere: 0.28, peau: '#c9c5d6' });
    sourcil(ctx, -9, -6, 12, -0.35, 1, PJ.TRAIT, 2.6);
    sourcil(ctx, 9, -6, 12, 0.35, 1, PJ.TRAIT, 2.6);
    // Sourire à une dent
    const b = new Path2D('M-8 14 Q0 22 8 14 Q0 17 -8 14 Z');
    ctx.fillStyle = '#4a1630';
    ctx.fill(b);
    ctx.lineWidth = 1.8;
    ctx.stroke(b);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-2.5, 15, 3.4, 3);
  };

  // ---------- Satellite mécanique (jouet à remonter) ----------
  PJ.satellite = (ctx, t = 0) => {
    const tourne = Math.sin(t * 2) * 0.1;
    ctx.rotate(tourne);
    const panG = rect(-48, -9, 28, 18, 2);
    const panD = rect(20, -9, 28, 18, 2);
    const bras = rect(-22, -2, 44, 4, 1);
    const corps = rect(-16, -18, 32, 34, 6);
    const antenne = new Path2D('M-9 16 Q0 34 9 16 Z');
    const clef = new Path2D('M-2 -18 L-2 -26 L-9 -30 L-9 -38 L-2 -34 L2 -34 L9 -38 L9 -30 L2 -26 L2 -18 Z');
    const tole = (x0, x1) => lin(ctx, x0, 0, x1, 0, [[0, '#8e97a8'], [0.35, '#f1f4fa'], [1, '#7d8697']]);
    silhouette(ctx, [
      { p: bras, fill: '#9aa3b4' },
      { p: panG, fill: lin(ctx, -48, -9, -20, 9, [[0, '#4f8cf0'], [1, '#1b3f9a']]) },
      { p: panD, fill: lin(ctx, 20, -9, 48, 9, [[0, '#4f8cf0'], [1, '#1b3f9a']]) },
      { p: clef, fill: lin(ctx, -9, 0, 9, 0, [[0, '#b88a2a'], [0.5, '#ffe08a'], [1, '#a07418']]) },
      { p: corps, fill: tole(-16, 16) },
      { p: antenne, fill: lin(ctx, 0, 16, 0, 26, [[0, '#ffffff'], [1, '#b8bfcd']]) },
    ]);
    // Cellules des panneaux
    ctx.strokeStyle = 'rgba(200,225,255,.55)';
    ctx.lineWidth = 0.8;
    for (const x0 of [-48, 20]) {
      for (let k = 1; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(x0 + k * 7, -9);
        ctx.lineTo(x0 + k * 7, 9);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      ctx.lineTo(x0 + 28, 0);
      ctx.stroke();
    }
    // Rivets et bande rouge
    ctx.fillStyle = '#d6263c';
    ctx.fillRect(-16, 6, 32, 5);
    ctx.fillStyle = '#5c6474';
    for (const [x, y] of [[-12, -14], [12, -14], [-12, 13], [12, 13]]) {
      ctx.beginPath();
      ctx.arc(x, y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    oeil(ctx, -6, -4, 5, { iris: '#18a39a', regard: [0, 0.6], paupiere: 0.25, peau: '#c9cfdc' });
    oeil(ctx, 6, -4, 5, { iris: '#18a39a', regard: [0, 0.6], paupiere: 0.25, peau: '#c9cfdc' });
    sourcil(ctx, -6, -10.5, 8, -0.35, 1);
    sourcil(ctx, 6, -10.5, 8, 0.35, 1);
    // Petite lumière qui clignote au bout de l'antenne
    ctx.fillStyle = Math.sin(t * 6) > 0 ? '#ff4d5e' : '#7a1a26';
    ctx.strokeStyle = PJ.TRAIT;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 30, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
})();
