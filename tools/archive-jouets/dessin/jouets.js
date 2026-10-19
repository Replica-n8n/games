// Les quatre jouets du joueur et leurs tirs. Vus de dessus, nez vers le haut
// (le canard, lui, plonge : nez vers le bas).
(function () {
  const PJ = window.PJ;
  const { lin, rad, silhouette, oeil, ombre, cercle, ellipse, rect, etoile } = PJ;

  // ---------- Avion en papier (feuille de cahier à grands carreaux) ----------
  PJ.avion = (ctx, t = 0) => {
    const flotte = Math.sin(t * 3) * 1.5;
    ombre(ctx, 8, 44, 36, 9, 0.3);
    ctx.translate(0, flotte);
    // Traînées d'air au bout des ailes
    ctx.save();
    ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      ctx.strokeStyle = lin(ctx, 0, 32, 0, 56, [[0, 'rgba(255,255,255,.7)'], [1, 'rgba(255,255,255,0)']]);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(s * 42, 34);
      ctx.lineTo(s * 42, 54 + Math.sin(t * 9 + s) * 3);
      ctx.stroke();
    }
    ctx.restore();
    const ailG = new Path2D('M0 -46 L-44 32 L-5 26 Z');
    const ailD = new Path2D('M0 -46 L44 32 L5 26 Z');
    const quille = new Path2D('M0 -42 L-5 26 L0 37 L5 26 Z');
    silhouette(ctx, [
      { p: quille, fill: lin(ctx, 0, -40, 0, 37, [[0, '#c9d1e6'], [1, '#97a3c4']]) },
      { p: ailG, fill: lin(ctx, -44, 0, 0, 0, [[0, '#f4f6fc'], [1, '#ffffff']]) },
      { p: ailD, fill: lin(ctx, 0, 0, 44, 0, [[0, '#f2f4fa'], [1, '#cfd6e8']]) },
    ]);
    // Grands carreaux (Seyès) sur les ailes
    ctx.save();
    const ailes = new Path2D();
    ailes.addPath(ailG);
    ailes.addPath(ailD);
    ctx.clip(ailes);
    for (let y = -46, i = 0; y < 36; y += 2.4, i++) {
      ctx.strokeStyle = i % 4 === 0 ? 'rgba(70,110,210,.45)' : 'rgba(110,150,230,.22)';
      ctx.lineWidth = i % 4 === 0 ? 0.7 : 0.45;
      ctx.beginPath();
      ctx.moveTo(-46, y);
      ctx.lineTo(46, y);
      ctx.stroke();
    }
    for (let x = -40; x < 46; x += 9.6) {
      ctx.strokeStyle = 'rgba(70,110,210,.32)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(x, -46);
      ctx.lineTo(x, 36);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(220,60,80,.6)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-31, -46);
    ctx.lineTo(-31, 36);
    ctx.stroke();
    // Ombre de l'aile droite, plus loin de la lumière
    ctx.fillStyle = 'rgba(40,40,90,.08)';
    ctx.fill(ailD);
    ctx.restore();
    // Plis
    ctx.strokeStyle = 'rgba(36,24,58,.35)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(0, -44);
    ctx.lineTo(-24, 29);
    ctx.moveTo(0, -44);
    ctx.lineTo(24, 29);
    ctx.stroke();
    // Gribouillis au feutre : une étoile et un éclair
    ctx.strokeStyle = '#f08a1c';
    ctx.lineWidth = 1.4;
    ctx.lineJoin = 'round';
    ctx.stroke(etoile(5, 6, 2.6, 22, 16, -Math.PI / 2 + 0.2));
    ctx.strokeStyle = '#2f9e6a';
    ctx.beginPath();
    ctx.moveTo(-18, 8);
    ctx.lineTo(-23, 15);
    ctx.lineTo(-19, 15);
    ctx.lineTo(-24, 23);
    ctx.stroke();
    // Yeux sur le nez
    oeil(ctx, -4.4, -20, 4.2, { iris: '#3a7be0', regard: [0, -0.8] });
    oeil(ctx, 4.4, -20, 4.2, { iris: '#3a7be0', regard: [0, -0.8] });
  };

  PJ.tirTrombone = (ctx) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const p = new Path2D('M-5 22 L-5 -18 A7 7 0 0 1 9 -18 L9 16 A5 5 0 0 1 -1 16 L-1 -12 A2.6 2.6 0 0 1 4.2 -12 L4.2 12');
    ctx.strokeStyle = PJ.TRAIT;
    ctx.lineWidth = 7;
    ctx.stroke(p);
    ctx.strokeStyle = lin(ctx, -6, 0, 10, 0, [[0, '#8f99ad'], [0.45, '#f4f7ff'], [1, '#a9b2c6']]);
    ctx.lineWidth = 3.4;
    ctx.stroke(p);
  };

  // ---------- Voiture télécommandée ----------
  PJ.voiture = (ctx, t = 0) => {
    ombre(ctx, 6, 6, 44, 50, 0.32);
    const roues = [[-36, -34], [24, -34], [-36, 12], [24, 12]].map(([x, y]) => rect(x, y, 12, 22, 4));
    const corps = rect(-27, -42, 54, 82, 17);
    const aileron = rect(-31, 30, 62, 9, 3);
    silhouette(ctx, [
      ...roues.map((p) => ({ p, fill: lin(ctx, -36, 0, 36, 0, [[0, '#1d1b26'], [0.5, '#4a4758'], [1, '#1d1b26']]) })),
      { p: corps, fill: lin(ctx, -27, 0, 27, 0, [[0, '#9c0f27'], [0.3, '#ff5466'], [0.55, '#e8263d'], [1, '#8a0b20']]) },
      { p: aileron, fill: lin(ctx, 0, 30, 0, 39, [[0, '#3b3948'], [1, '#17161f']]) },
    ]);
    // Rainures des pneus (qui défilent)
    ctx.strokeStyle = 'rgba(255,255,255,.18)';
    ctx.lineWidth = 1.2;
    for (const [x, y] of [[-36, -34], [24, -34], [-36, 12], [24, 12]]) {
      for (let k = 0; k < 5; k++) {
        const yy = y + 2 + ((k * 4.4 + t * 40) % 20);
        ctx.beginPath();
        ctx.moveTo(x + 2, yy);
        ctx.lineTo(x + 10, yy);
        ctx.stroke();
      }
    }
    // Bandes blanches
    ctx.save();
    ctx.clip(corps);
    ctx.fillStyle = '#fff6ef';
    ctx.fillRect(-7, -42, 4, 82);
    ctx.fillRect(3, -42, 4, 82);
    // Reflet de vernis
    ctx.fillStyle = lin(ctx, -27, 0, -10, 0, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fillRect(-24, -40, 12, 78);
    ctx.restore();
    // Pare-brise avec les yeux
    const vitre = new Path2D('M-19 -4 L19 -4 L15 -22 L-15 -22 Z');
    ctx.lineWidth = 3;
    ctx.strokeStyle = PJ.TRAIT;
    ctx.lineJoin = 'round';
    ctx.stroke(vitre);
    ctx.fillStyle = lin(ctx, 0, -22, 0, -4, [[0, '#7cc0ff'], [1, '#1d3f8a']]);
    ctx.fill(vitre);
    oeil(ctx, -7, -13, 5.2, { iris: '#2f9e6a', regard: [0, -0.7] });
    oeil(ctx, 7, -13, 5.2, { iris: '#2f9e6a', regard: [0, -0.7] });
    // Numéro sur le toit
    ctx.lineWidth = 2.4;
    ctx.fillStyle = '#fff6ef';
    ctx.beginPath();
    ctx.arc(0, 14, 9.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();
    ctx.fillStyle = PJ.TRAIT;
    ctx.font = '900 14px Grandstander, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('8', 0, 15);
    // Phares
    for (const s of [-1, 1]) {
      ctx.fillStyle = rad(ctx, s * 15, -38, 0, s * 15, -38, 6, [[0, '#fffbe0'], [0.6, '#ffd84a'], [1, '#e09a00']]);
      ctx.beginPath();
      ctx.ellipse(s * 15, -37.5, 5.5, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    // Antenne qui oscille, boule rouge
    const bal = Math.sin(t * 6) * 4;
    ctx.strokeStyle = PJ.TRAIT;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(17, 26);
    ctx.quadraticCurveTo(20, 40, 23 + bal, 50);
    ctx.stroke();
    ctx.fillStyle = rad(ctx, 22 + bal, 49, 0, 23 + bal, 50, 4, [[0, '#ff8a8a'], [1, '#c4102a']]);
    ctx.beginPath();
    ctx.arc(23 + bal, 50, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.stroke();
  };

  PJ.tirBouchon = (ctx) => {
    const p = rect(-8, -14, 16, 28, 5);
    silhouette(ctx, [{ p, fill: lin(ctx, -8, 0, 8, 0, [[0, '#9a6a35'], [0.4, '#e3b77a'], [1, '#8c5d2c']]) }], 2.4);
    ctx.fillStyle = 'rgba(90,50,20,.5)';
    const h = PJ.hasard(7);
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.arc(-5 + h() * 10, -11 + h() * 22, 0.8 + h(), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-8, -14, 16, 4);
  };

  // ---------- Canard sous-marin (plonge : nez vers le bas) ----------
  PJ.canard = (ctx, t = 0) => {
    // Remous autour
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.lineWidth = 1.6;
    for (let k = 0; k < 2; k++) {
      const r = 38 + ((t * 14 + k * 9) % 18);
      ctx.globalAlpha = 1 - ((t * 14 + k * 9) % 18) / 18;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.85, r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    const jaune = (x0, y0, r) => rad(ctx, x0 - r * 0.35, y0 - r * 0.4, 0, x0, y0, r * 1.1, [[0, '#fff58a'], [0.55, '#ffd21f'], [1, '#e29a00']]);
    const queue = new Path2D('M-9 -36 Q0 -54 9 -36 Z');
    const corps = ellipse(0, -6, 29, 35);
    const ailG = ellipse(-25, -4, 9, 19, 0.15);
    const ailD = ellipse(25, -4, 9, 19, -0.15);
    const tete = cercle(0, 25, 18);
    const bec = new Path2D('M-9 38 Q0 52 9 38 Q0 42 -9 38 Z');
    // Hélice derrière
    ctx.save();
    ctx.translate(0, -48);
    ctx.rotate(t * 14);
    const pales = [0, 1, 2].map((k) => {
      const p = new Path2D();
      p.ellipse(0, -7, 3.6, 8, 0, 0, Math.PI * 2);
      const m = new DOMMatrix().rotate((k * 360) / 3);
      const q = new Path2D();
      q.addPath(p, m);
      return q;
    });
    silhouette(ctx, pales.map((p) => ({ p, fill: lin(ctx, -4, 0, 4, 0, [[0, '#7d8798'], [0.5, '#e8edf6'], [1, '#7d8798']]) })), 1.8);
    ctx.restore();
    silhouette(ctx, [
      { p: queue, fill: jaune(0, -42, 12) },
      { p: corps, fill: jaune(0, -6, 35) },
      { p: ailG, fill: jaune(-25, -6, 18) },
      { p: ailD, fill: jaune(25, -6, 18) },
      { p: tete, fill: jaune(0, 25, 18) },
      { p: bec, fill: lin(ctx, 0, 38, 0, 50, [[0, '#ffae3d'], [1, '#e8580c']]) },
    ]);
    // Moyeu d'hélice
    ctx.fillStyle = '#596274';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -48, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Plumes des ailes
    ctx.strokeStyle = 'rgba(160,90,0,.55)';
    ctx.lineWidth = 1.2;
    for (const s of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(s * 22, -14 + k * 7);
        ctx.quadraticCurveTo(s * 28, -10 + k * 7, s * 30, -6 + k * 7);
        ctx.stroke();
      }
    }
    // Hublot sur le dos : anneau de laiton, vitre, rivets
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = PJ.TRAIT;
    ctx.fillStyle = lin(ctx, -12, -22, 12, 2, [[0, '#ffe7a3'], [0.5, '#c9932e'], [1, '#7a5512']]);
    ctx.beginPath();
    ctx.arc(0, -12, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = rad(ctx, -3, -15, 0, 0, -12, 8, [[0, '#bff0ff'], [0.6, '#2f8fd0'], [1, '#13457a']]);
    ctx.beginPath();
    ctx.arc(0, -12, 7.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    ctx.beginPath();
    ctx.ellipse(-3, -15, 2.6, 1.4, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a3d0a';
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 9.8, -12 + Math.sin(a) * 9.8, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    // Périscope
    ctx.lineWidth = 2;
    ctx.fillStyle = lin(ctx, 8, 0, 16, 0, [[0, '#8a93a6'], [1, '#d7deea']]);
    ctx.beginPath();
    ctx.arc(13, 10, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1b2a55';
    ctx.beginPath();
    ctx.arc(13, 12, 1.8, 0, Math.PI * 2);
    ctx.fill();
    // Yeux, qui regardent vers le bas
    oeil(ctx, -7, 27, 4.6, { iris: '#1f6fd1', regard: [0, 0.8] });
    oeil(ctx, 7, 27, 4.6, { iris: '#1f6fd1', regard: [0, 0.8] });
  };

  PJ.tirBulle = (ctx) => {
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(36,24,58,.55)';
    ctx.fillStyle = rad(ctx, -4, -5, 0, 0, 0, 12, [[0, 'rgba(255,255,255,.55)'], [0.7, 'rgba(160,220,255,.25)'], [1, 'rgba(120,190,255,.6)']]);
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-4, -5, 3.4, 2, -0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,160,230,.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 8.5, 0.3, 1.4);
    ctx.stroke();
  };

  // ---------- Fusée en carton (rouleau, cône en papier, hublot bouchon) ----------
  PJ.fusee = (ctx, t = 0) => {
    // Flamme qui vacille
    const f = Math.sin(t * 22) * 3 + Math.sin(t * 37) * 2;
    const flamme = new Path2D(`M-11 36 Q-14 ${50 + f} 0 ${66 + f * 1.5} Q14 ${50 - f} 11 36 Z`);
    ctx.fillStyle = lin(ctx, 0, 36, 0, 66, [[0, '#fff7c2'], [0.35, '#ffc02e'], [0.75, '#ff6a1f'], [1, 'rgba(230,40,30,0)']]);
    ctx.fill(flamme);
    const coeur = new Path2D(`M-5 36 Q-6 ${46 + f} 0 ${54 + f} Q6 ${46 - f} 5 36 Z`);
    ctx.fillStyle = 'rgba(255,255,240,.9)';
    ctx.fill(coeur);
    const tube = rect(-18, -30, 36, 64, 3);
    const cone = new Path2D('M-19.5 -29 Q-17 -52 0 -64 Q17 -52 19.5 -29 Z');
    const aileG = new Path2D('M-17 6 L-35 30 L-35 40 L-17 31 Z');
    const aileD = new Path2D('M17 6 L35 30 L35 40 L17 31 Z');
    const tuyere = rect(-12, 31, 24, 8, 2);
    const carton = lin(ctx, -18, 0, 18, 0, [[0, '#7a4b22'], [0.32, '#e2ad70'], [0.62, '#c58c4f'], [1, '#6b4019']]);
    silhouette(ctx, [
      { p: aileG, fill: lin(ctx, -35, 0, -17, 0, [[0, '#8f5a28'], [1, '#c9884a']]) },
      { p: aileD, fill: lin(ctx, 17, 0, 35, 0, [[0, '#b97a3e'], [1, '#7c4a1e']]) },
      { p: tuyere, fill: lin(ctx, -12, 0, 12, 0, [[0, '#5d6575'], [0.4, '#d5dbe6'], [1, '#4a5160']]) },
      { p: tube, fill: carton },
      { p: cone, fill: lin(ctx, -19, 0, 19, 0, [[0, '#a8231c'], [0.35, '#ff6e5a'], [0.7, '#e2392c'], [1, '#931b15']]) },
    ]);
    // Couture en spirale du rouleau et cannelures
    ctx.save();
    ctx.clip(tube);
    ctx.strokeStyle = 'rgba(80,45,15,.55)';
    ctx.lineWidth = 1.1;
    for (let k = -2; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(-18, -18 + k * 26);
      ctx.lineTo(18, -32 + k * 26);
      ctx.stroke();
    }
    ctx.restore();
    // Plis du papier du cône
    ctx.strokeStyle = 'rgba(90,10,10,.35)';
    ctx.lineWidth = 0.9;
    for (const x of [-9, 0, 9]) {
      ctx.beginPath();
      ctx.moveTo(x * 1.8, -30);
      ctx.lineTo(x * 0.2, -60);
      ctx.stroke();
    }
    // Ruban adhésif sur les ailerons
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(s * 18, 20);
      ctx.rotate(s * -0.5);
      ctx.fillStyle = 'rgba(255,250,225,.55)';
      ctx.fillRect(-7, -3.5, 14, 7);
      ctx.strokeStyle = 'rgba(160,130,80,.5)';
      ctx.lineWidth = 0.7;
      ctx.strokeRect(-7, -3.5, 14, 7);
      ctx.restore();
    }
    // Hublot : un bouchon de bouteille bleu, cranté
    ctx.save();
    ctx.translate(0, -9);
    const crans = new Path2D();
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * Math.PI * 2;
      const r = k % 2 ? 12.4 : 11.2;
      k ? crans.lineTo(Math.cos(a) * r, Math.sin(a) * r) : crans.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    crans.closePath();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = PJ.TRAIT;
    ctx.lineJoin = 'round';
    ctx.stroke(crans);
    ctx.fillStyle = rad(ctx, -4, -4, 0, 0, 0, 13, [[0, '#7fd0ff'], [1, '#1b62c4']]);
    ctx.fill(crans);
    ctx.fillStyle = rad(ctx, -2, -3, 0, 0, 0, 9, [[0, '#2a3f7a'], [1, '#0d1638']]);
    ctx.beginPath();
    ctx.arc(0, 0, 8.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    oeil(ctx, -3.6, -9.5, 3.6, { iris: '#f0a020', regard: [0, -0.7] });
    oeil(ctx, 3.6, -9.5, 3.6, { iris: '#f0a020', regard: [0, -0.7] });
    // Gommettes étoiles collées
    for (const [x, y, r, a] of [[-9, 14, 4.6, 0.3], [9, 22, 3.8, -0.4]]) {
      const e = etoile(5, r, r * 0.45, x, y, -Math.PI / 2 + a);
      ctx.lineWidth = 1.4;
      ctx.stroke(e);
      ctx.fillStyle = lin(ctx, x - r, y - r, x + r, y + r, [[0, '#fff3a0'], [1, '#f2b300']]);
      ctx.fill(e);
    }
    // Pointe dorée
    ctx.fillStyle = '#ffd34d';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, -64, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };

  PJ.tirGommette = (ctx, t = 0) => {
    const e = etoile(5, 13, 6, 0, 0, -Math.PI / 2 + t * 4);
    silhouette(ctx, [{ p: e, fill: lin(ctx, -12, -12, 12, 12, [[0, '#fff6b0'], [0.5, '#ffd21f'], [1, '#e89a00']]) }], 2.2);
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.beginPath();
    ctx.arc(-3, -4, 2.4, 0, Math.PI * 2);
    ctx.fill();
  };
})();
