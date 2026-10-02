/* Le chat du Petit yoga : il montre les postures. Ni garçon ni fille (décision de la mère,
   2026-10-02), et il se tient comme un enfant, avec deux bras et deux jambes, pour que
   l'enfant puisse l'imiter. PUR : des articulations en entrée, du SVG en sortie.

   Dessiné selon les leçons du jeu du requin (mémoire « jeux canvas ») :
   - contour d'un seul tenant : TOUS les contours d'abord, épais, puis les aplats
     par-dessus. Contourner chaque membre à part laisse des traits aux jointures ;
   - partir du vrai animal : oreilles, museau, moustaches, coussinets clairs, rayures du
     dos, queue ;
   - le volume par le ventre clair (de face) et les rayures du dos (de profil) ;
   - des parties qui vivent : la queue ondule, les yeux se ferment pendant le souffle.

   `vue` : 0 de face, 1 de profil (il regarde à gauche). De profil, le côté G est le plus
   loin : un ton plus sombre. `yeux` : true = fermés. `queue` : -1 à 1, son ondulation. */

const POIL = [233, 150, 58], POIL_LOIN = [196, 118, 36], BRAS = [241, 168, 80], BRAS_LOIN = [208, 132, 46];
const CLAIR = [252, 232, 200], CLAIR_LOIN = [226, 198, 158];
const TRAIT = "#7A4210", RAYURE = "#B4651A", ROSE = "#F28DB2", NOIR = "#2B2350";
const BORD = 5; // le contour dépasse de 2,5 de chaque côté

const ton = (a, b, t) => "rgb(" + a.map((x, i) => Math.round(x + (b[i] - x) * t)).join(",") + ")";
const n1 = (x) => +x.toFixed(1);
const pt = (p) => n1(p[0]) + " " + n1(p[1]);
const vers = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/* Un point du buste (courbe quadratique cou, dos, bassin) et sa normale côté dos (vers le haut). */
function surLeBuste(j, t) {
  const p = vers(vers(j.cou, j.dos, t), vers(j.dos, j.bassin, t), t);
  const tx = (1 - t) * (j.dos[0] - j.cou[0]) + t * (j.bassin[0] - j.dos[0]);
  const ty = (1 - t) * (j.dos[1] - j.cou[1]) + t * (j.bassin[1] - j.dos[1]);
  const l = Math.hypot(tx, ty) || 1;
  let n = [-ty / l, tx / l];
  if (n[1] > 0) n = [-n[0], -n[1]];
  return { p, n };
}

export function dessinChat(j, vue = 0, { yeux = false, queue = 0 } = {}) {
  const [hx, hy] = j.tete, [bx, by] = j.bassin, d = 8 * vue;
  const poil = ton(POIL, POIL, 0), poilLoin = ton(POIL, POIL_LOIN, vue), bras = ton(BRAS, BRAS, 0), brasLoin = ton(BRAS, BRAS_LOIN, vue);
  const clair = ton(CLAIR, CLAIR, 0), clairLoin = ton(CLAIR, CLAIR_LOIN, vue);

  // Chaque forme : son tracé, sa couleur, sa largeur. Dans l'ordre où elles se recouvrent.
  const trait = (dd, couleur, large) => ({ d: dd, couleur, large });
  const membre = (a, b, c, couleur, large) => trait(`M${pt(a)} L${pt(b)} L${pt(c)}`, couleur, large);
  const patte = (p, r, couleur) => ({ rond: p, r, couleur });
  const q0 = [bx + 4, by - 2], s = queue;
  const queueTrace = `M${pt(q0)} C${pt([q0[0] + 40 + 5 * s, q0[1] + 12])} ${pt([q0[0] + 60 + 10 * s, q0[1] - 26])} ${pt([q0[0] + 50 + 16 * s, q0[1] - 64])}`;
  const oreille = (cote) => {
    const k = cote > 0 ? 1 : 0; // l'oreille droite est la plus loin de profil
    return [[hx + cote * 25 - k * .6 * d, hy - 10], [hx + cote * 22 - k * .9 * d + (1 - k) * .3 * d, hy - 41], [hx + cote * 4 - k * .6 * d, hy - 23]];
  };
  const triangle = (p) => `M${pt(p[0])} L${pt(p[1])} L${pt(p[2])}Z`;
  const formes = [
    trait(queueTrace, poilLoin, 11),
    membre(j.haG, j.geG, j.piG, poilLoin, 17), patte(j.piG, 10.5, clairLoin),
    trait(`M${pt(j.cou)} Q${pt(j.dos)} ${pt(j.bassin)}`, poil, 34),
    membre(j.haD, j.geD, j.piD, poil, 17), patte(j.piD, 10.5, clair),
    membre(j.epG, j.coG, j.maG, brasLoin, 13), patte(j.maG, 8.5, clairLoin),
    membre(j.epD, j.coD, j.maD, bras, 13), patte(j.maD, 8.5, clair),
    { plein: triangle(oreille(1)), couleur: poilLoin }, { plein: triangle(oreille(-1)), couleur: poil },
    { tete: true, couleur: poil },
  ];
  const tracer = (f, contour) => {
    const c = contour ? TRAIT : f.couleur, plus = contour ? BORD : 0;
    if (f.d) return `<path d="${f.d}" fill="none" stroke="${c}" stroke-width="${f.large + plus}" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (f.rond) return `<circle cx="${n1(f.rond[0])}" cy="${n1(f.rond[1])}" r="${f.r + plus / 2}" fill="${c}"/>`;
    if (f.plein) return `<path d="${f.plein}" fill="${c}" stroke="${c}" stroke-width="${4 + plus}" stroke-linejoin="round"/>`;
    return `<ellipse cx="${n1(hx)}" cy="${n1(hy)}" rx="${29 + plus / 2}" ry="${25.5 + plus / 2}" fill="${c}"/>`;
  };

  // Le ventre clair se voit de face, les rayures du dos de profil.
  const v0 = surLeBuste(j, .2).p, v1 = surLeBuste(j, .96).p, vc = vers(vers(j.cou, j.dos, .2), vers(j.dos, j.bassin, .2), .96);
  const ventre = `<path d="M${pt(v0)} Q${pt(vc)} ${pt(v1)}" fill="none" stroke="${clair}" stroke-width="17" stroke-linecap="round" opacity="${n1(1 - vue)}"/>`;
  const rayures = [.3, .5, .7].map((t) => {
    const { p, n } = surLeBuste(j, t);
    return `M${pt([p[0] + n[0] * 16, p[1] + n[1] * 16])} L${pt([p[0] + n[0] * 6, p[1] + n[1] * 6])}`;
  }).join(" ");
  const dos = `<path d="${rayures}" fill="none" stroke="${RAYURE}" stroke-width="4.5" stroke-linecap="round" opacity="${n1(vue)}"/>`;
  const boutQueue = `<path d="${queueTrace}" fill="none" stroke="${RAYURE}" stroke-width="11" stroke-linecap="round" stroke-dasharray="0 88 40" pathLength="100"/>`;

  // La tête. De profil, tout glisse vers la gauche : il regarde de trois quarts.
  const mx = hx - 1.1 * d, my = hy + 11, ox1 = hx - 11 - d, ox2 = hx + 11 - 1.3 * d, oy = hy - 3;
  const oeil = (x) => (yeux
    ? `<path d="M${n1(x - 4.5)} ${n1(oy)} q4.5 4.5 9 0" fill="none" stroke="${NOIR}" stroke-width="2.6" stroke-linecap="round"/>`
    : `<ellipse cx="${n1(x)}" cy="${n1(oy)}" rx="4.2" ry="5" fill="${NOIR}"/><circle cx="${n1(x - 1.3)}" cy="${n1(oy - 1.8)}" r="1.5" fill="#fff"/>`);
  const coin = (p, a, b, t) => pt(vers(p, vers(a, b, .5), t));
  const rose = (p) => `<path d="M${coin(p[0], p[1], p[2], .3)} L${coin(p[1], p[0], p[2], .42)} L${coin(p[2], p[0], p[1], .3)}Z" fill="${ROSE}"/>`;
  const moustaches = (cote, opacite) => `<path d="M${n1(mx + cote * 11)} ${n1(my)} l${cote * 19} -4 M${n1(mx + cote * 11)} ${n1(my + 4)} l${cote * 19} 3" fill="none" stroke="${NOIR}" stroke-width="1.6" stroke-linecap="round" opacity="${opacite}"/>`;
  const tete = rose(oreille(1)) + rose(oreille(-1))
    + `<path d="M${n1(hx - .5 * d - 8)} ${n1(hy - 24)} v6 M${n1(hx - .5 * d)} ${n1(hy - 25.5)} v8 M${n1(hx - .5 * d + 8)} ${n1(hy - 24)} v6" fill="none" stroke="${RAYURE}" stroke-width="3.5" stroke-linecap="round"/>`
    + `<ellipse cx="${n1(mx)}" cy="${n1(my)}" rx="14" ry="10" fill="${clair}"/>`
    + oeil(ox1) + oeil(ox2)
    + `<path d="M${n1(mx - 4)} ${n1(my - 5)} h8 l-4 4.5z" fill="${ROSE}" stroke="${ROSE}" stroke-width="1.5" stroke-linejoin="round"/>`
    + `<path d="M${n1(mx - 7)} ${n1(my + 3.5)} q3.5 4 7 0 q3.5 4 7 0" fill="none" stroke="${NOIR}" stroke-width="2" stroke-linecap="round"/>`
    + moustaches(-1, 1) + moustaches(1, n1(1 - .75 * vue));

  // Les détails du corps se glissent juste après le buste, avant les membres de devant.
  const iBuste = 3;
  return formes.map((f) => tracer(f, true)).join("")
    + formes.slice(0, 1).map((f) => tracer(f)).join("") + boutQueue
    + formes.slice(1, iBuste + 1).map((f) => tracer(f)).join("") + ventre + dos
    + formes.slice(iBuste + 1).map((f) => tracer(f)).join("") + tete;
}
