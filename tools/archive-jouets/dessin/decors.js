// Les sols des quatre niveaux, vus de dessus. Le jeu les fera défiler ;
// ici, une seule vue fixe de largeur w et de hauteur h.
(function () {
  const PJ = window.PJ;
  const { lin, rad, hasard, etoile } = PJ;

  const jardin = (ctx, w, h) => {
    ctx.fillStyle = lin(ctx, 0, 0, w, h, [[0, '#2f7d3f'], [1, '#1f5e30']]);
    ctx.fillRect(0, 0, w, h);
    const r = hasard(3);
    // Plaques d'herbe plus claire
    for (let k = 0; k < 9; k++) {
      ctx.fillStyle = 'rgba(120,200,110,.12)';
      ctx.beginPath();
      ctx.ellipse(r() * w, r() * h, 30 + r() * 40, 18 + r() * 24, r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Brins d'herbe
    ctx.lineCap = 'round';
    for (let k = 0; k < 260; k++) {
      const x = r() * w, y = r() * h;
      ctx.strokeStyle = r() > 0.5 ? 'rgba(150,220,120,.35)' : 'rgba(10,50,20,.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (r() - 0.5) * 4, y - 4 - r() * 4);
      ctx.stroke();
    }
    // Pâquerettes
    for (let k = 0; k < 10; k++) {
      const x = r() * w, y = r() * h;
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      for (let p = 0; p < 6; p++) {
        const a = (p / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * 3, y + Math.sin(a) * 3, 2.4, 1.3, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffd21f';
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    // Allée de dalles sur le côté
    for (let y = -10; y < h; y += 46) {
      ctx.fillStyle = 'rgba(205,190,160,.55)';
      ctx.strokeStyle = 'rgba(60,50,30,.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(w - 26 + (y % 3) * 2, y, 18, 13, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  };

  const salon = (ctx, w, h) => {
    // Parquet
    ctx.fillStyle = '#9a6233';
    ctx.fillRect(0, 0, w, h);
    const r = hasard(5);
    for (let x = 0, i = 0; x < w; x += 34, i++) {
      for (let y = -((i * 57) % 120); y < h; y += 120) {
        ctx.fillStyle = `hsl(28, ${45 + r() * 10}%, ${34 + r() * 8}%)`;
        ctx.fillRect(x, y, 33, 119);
        ctx.strokeStyle = 'rgba(60,30,10,.25)';
        ctx.lineWidth = 0.8;
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.moveTo(x + 6 + r() * 20, y);
          ctx.bezierCurveTo(x + 4 + r() * 24, y + 40, x + 4 + r() * 24, y + 80, x + 6 + r() * 20, y + 119);
          ctx.stroke();
        }
      }
    }
    // Tapis à motifs
    const m = 26;
    ctx.fillStyle = '#7a2f4a';
    ctx.fillRect(m, 0, w - m * 2, h);
    ctx.strokeStyle = '#f2c66b';
    ctx.lineWidth = 3;
    ctx.strokeRect(m + 8, -4, w - m * 2 - 16, h + 8);
    ctx.fillStyle = 'rgba(242,198,107,.22)';
    for (let y = 20; y < h; y += 56) {
      for (let x = m + 30; x < w - m - 10; x += 56) {
        ctx.beginPath();
        ctx.moveTo(x, y - 14);
        ctx.lineTo(x + 14, y);
        ctx.lineTo(x, y + 14);
        ctx.lineTo(x - 14, y);
        ctx.closePath();
        ctx.fill();
      }
    }
    // Franges
    ctx.strokeStyle = '#f4e3c0';
    ctx.lineWidth = 1.2;
    for (let y = 0; y < h; y += 5) {
      for (const x of [m, w - m]) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (x === m ? -6 : 6), y + 1);
        ctx.stroke();
      }
    }
  };

  const baignoire = (ctx, w, h, t) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#4fb7e8'], [1, '#1e6fb0']]);
    ctx.fillRect(0, 0, w, h);
    // Fond émaillé de la baignoire, vu à travers l'eau
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.beginPath();
    ctx.roundRect(18, -40, w - 36, h + 80, 60);
    ctx.fill();
    // Reflets mouvants (caustiques)
    const r = hasard(11);
    ctx.strokeStyle = 'rgba(255,255,255,.22)';
    ctx.lineWidth = 2;
    for (let k = 0; k < 34; k++) {
      const x = r() * w, y = r() * h, l = 10 + r() * 20;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + l * 0.3, y - 6 + Math.sin(t + k) * 3, x + l * 0.7, y + 6, x + l, y);
      ctx.stroke();
    }
    // Bulles qui remontent
    for (let k = 0; k < 22; k++) {
      const x = r() * w, y = r() * h, rr = 1.5 + r() * 4;
      ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.stroke();
    }
    // La bonde, tout en bas
    ctx.fillStyle = rad(ctx, w / 2, h - 18, 0, w / 2, h - 18, 22, [[0, '#d9dee8'], [0.7, '#9aa2b4'], [1, 'rgba(60,70,90,0)']]);
    ctx.beginPath();
    ctx.arc(w / 2, h - 18, 20, 0, Math.PI * 2);
    ctx.fill();
  };

  const espace = (ctx, w, h, t) => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#0a0d33'], [1, '#1b1450']]);
    ctx.fillRect(0, 0, w, h);
    // Nébuleuse en papier crépon
    ctx.fillStyle = rad(ctx, w * 0.75, h * 0.3, 0, w * 0.75, h * 0.3, w * 0.6, [[0, 'rgba(160,80,220,.35)'], [1, 'rgba(160,80,220,0)']]);
    ctx.fillRect(0, 0, w, h);
    const r = hasard(21);
    for (let k = 0; k < 120; k++) {
      const x = r() * w, y = r() * h, a = 0.4 + r() * 0.6;
      ctx.fillStyle = `rgba(255,250,230,${a})`;
      ctx.beginPath();
      ctx.arc(x, y, r() * 1.4 + 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Quelques étoiles dessinées
    for (let k = 0; k < 5; k++) {
      ctx.fillStyle = 'rgba(255,230,140,.8)';
      ctx.fill(etoile(4, 4 + r() * 3, 1.2, r() * w, r() * h));
    }
    // Planète au loin
    const px = w * 0.18, py = h * 0.62;
    ctx.fillStyle = rad(ctx, px - 8, py - 8, 0, px, py, 26, [[0, '#ffb3c8'], [1, '#a03c74']]);
    ctx.beginPath();
    ctx.arc(px, py, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,160,.6)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(px, py, 34, 8, -0.3, 0, Math.PI * 2);
    ctx.stroke();
  };

  PJ.fond = (ctx, nom, w, h, t = 0) => {
    ctx.save();
    ({ jardin, salon, baignoire, espace })[nom](ctx, w, h, t);
    ctx.restore();
  };
})();
