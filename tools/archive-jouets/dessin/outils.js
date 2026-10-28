// Outils de dessin partagés : contour d'un seul tenant, dégradés, yeux, ombres.
// Chaque dessin travaille dans une boîte de -50 à 50 ; `taille` est sa largeur en px.
(function () {
  const PJ = (window.PJ = window.PJ || {});
  PJ.TRAIT = '#24183a';

  PJ.lin = (ctx, x0, y0, x1, y1, arrets) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    for (const [o, c] of arrets) g.addColorStop(o, c);
    return g;
  };
  PJ.rad = (ctx, x0, y0, r0, x1, y1, r1, arrets) => {
    const g = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
    for (const [o, c] of arrets) g.addColorStop(o, c);
    return g;
  };

  // Place un dessin : centre (x, y), largeur `taille`, rotation facultative.
  PJ.poser = (ctx, x, y, taille, rot, fn) => {
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    ctx.scale(taille / 100, taille / 100);
    fn();
    ctx.restore();
  };

  // Contour d'un seul tenant : tous les traits épais d'abord, puis les remplissages.
  PJ.silhouette = (ctx, formes, e = 2.6) => {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = PJ.TRAIT;
    ctx.lineWidth = e * 2;
    for (const f of formes) if (!f.sansTrait) ctx.stroke(f.p);
    for (const f of formes) {
      ctx.fillStyle = f.fill;
      ctx.fill(f.p);
    }
    ctx.restore();
  };

  PJ.ombre = (ctx, x, y, rx, ry, a = 0.3) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    ctx.fillStyle = PJ.rad(ctx, 0, 0, 0, 0, 0, rx, [
      [0, `rgba(10,6,30,${a})`],
      [1, 'rgba(10,6,30,0)'],
    ]);
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Œil à iris, pupille, reflet et paupière.
  // regard : [dx, dy] de -1 à 1 ; paupiere : 0 ouvert à 1 fermé ; peau : couleur de la paupière.
  PJ.oeil = (ctx, x, y, r, o = {}) => {
    const { iris = '#3a7be0', regard = [0, 0], paupiere = 0, peau = '#f2c79a', lueur = null } = o;
    ctx.save();
    ctx.translate(x, y);
    const blanc = new Path2D();
    blanc.ellipse(0, 0, r, r * 1.12, 0, 0, Math.PI * 2);
    ctx.lineWidth = r * 0.32;
    ctx.strokeStyle = PJ.TRAIT;
    ctx.stroke(blanc);
    ctx.fillStyle = PJ.rad(ctx, -r * 0.3, -r * 0.4, 0, 0, 0, r * 1.2, [
      [0, '#ffffff'],
      [1, '#dcdff0'],
    ]);
    ctx.fill(blanc);
    ctx.save();
    ctx.clip(blanc);
    const ix = regard[0] * r * 0.38, iy = regard[1] * r * 0.38;
    const ri = r * 0.62;
    ctx.fillStyle = lueur
      ? PJ.rad(ctx, ix, iy, 0, ix, iy, ri, [[0, '#fff6c8'], [0.5, lueur], [1, '#7a2a00']])
      : PJ.rad(ctx, ix, iy - ri * 0.3, 0, ix, iy, ri, [[0, iris], [0.75, iris], [1, PJ.TRAIT]]);
    ctx.beginPath();
    ctx.arc(ix, iy, ri, 0, Math.PI * 2);
    ctx.fill();
    if (!lueur) {
      ctx.fillStyle = '#120a22';
      ctx.beginPath();
      ctx.arc(ix, iy, ri * 0.48, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ix - ri * 0.38, iy - ri * 0.4, ri * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ix + ri * 0.32, iy + ri * 0.34, ri * 0.13, 0, Math.PI * 2);
    ctx.fill();
    if (paupiere > 0) {
      ctx.fillStyle = peau;
      ctx.fillRect(-r * 1.2, -r * 1.3, r * 2.4, r * 2.5 * paupiere);
      ctx.strokeStyle = PJ.TRAIT;
      ctx.lineWidth = r * 0.22;
      ctx.beginPath();
      ctx.moveTo(-r * 1.2, -r * 1.3 + r * 2.5 * paupiere);
      ctx.lineTo(r * 1.2, -r * 1.3 + r * 2.5 * paupiere);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  };

  // Sourcil : pour un sourcil gauche, angle négatif = bout côté nez plus bas (froncé) ;
  // les appels donnent l'angle opposé au sourcil droit.
  PJ.sourcil = (ctx, x, y, l, angle, cote, couleur = PJ.TRAIT, e = 2.2) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-angle * cote);
    ctx.strokeStyle = couleur;
    ctx.lineWidth = e;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-l / 2, 0);
    ctx.quadraticCurveTo(0, -l * 0.18, l / 2, 0);
    ctx.stroke();
    ctx.restore();
  };

  // Étoile à n branches (gommettes, décor).
  PJ.etoile = (n, r1, r2, x = 0, y = 0, rot = -Math.PI / 2) => {
    const p = new Path2D();
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 ? r2 : r1;
      const a = rot + (i * Math.PI) / n;
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      i ? p.lineTo(px, py) : p.moveTo(px, py);
    }
    p.closePath();
    return p;
  };

  // Hasard reproductible (mêmes pores, mêmes étoiles à chaque image).
  PJ.hasard = (graine) => {
    let s = graine >>> 0 || 1;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  };

  PJ.cercle = (x, y, r) => {
    const p = new Path2D();
    p.arc(x, y, r, 0, Math.PI * 2);
    return p;
  };
  PJ.ellipse = (x, y, rx, ry, rot = 0) => {
    const p = new Path2D();
    p.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    return p;
  };
  PJ.rect = (x, y, w, h, r = 0) => {
    const p = new Path2D();
    p.roundRect(x, y, w, h, r);
    return p;
  };
})();
