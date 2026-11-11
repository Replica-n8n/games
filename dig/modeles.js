/* DIG : les trouvailles, dessinées voxel par voxel.
   Chaque niveau donne : la taille du bloc, les voxels de la trouvaille (dans sa pose
   d'exposition), ses morceaux à découvrir, les couches de terre, la fosse déjà creusée,
   et l'endroit où se pose la trouvaille précédente (le dézoom). */
const DIG_NIVEAUX = (() => {
  const cle = (x, y, z) => x + ',' + y + ',' + z;
  const fabrique = () => { const vox = new Map(); return { vox, v: (x, y, z, c, part) => vox.set(cle(x, y, z), { x, y, z, c, part }) }; };

  /* ---------- 1. L'amphore : debout, le bouchon dépasse ---------- */
  function amphore() {
    const BX = 17, BY = 22, BZ = 13, cx = 8, cz = 6, { vox, v } = fabrique();
    //         y : 0  1   2   3  4    5  6    7  8    9    10   11   12 13   14   15   16   17   18   19
    const RAYON = [0, .5, .5, 1, 1.5, 2, 2.5, 3, 3.5, 3.5, 3.5, 3.5, 3, 2.5, 1.5, 1.2, 1.2, 1.2, 1.8, 1];
    for (let y = 1; y <= 19; y++) {
      const r = RAYON[y];
      const part = y <= 3 ? 'pied' : y <= 11 ? 'panse' : y <= 13 ? 'épaule' : y <= 17 ? 'col' : y === 18 ? 'lèvre' : 'bouchon';
      for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
        if (dx * dx + dz * dz > r * r + 0.01) continue;
        let c = 0xc8703d;
        if (part === 'pied') c = 0xa85a30;
        if (part === 'épaule') c = 0xd4824c;
        if (part === 'col') c = 0xcd7843;
        if (part === 'lèvre') c = 0xdc9560;
        if (part === 'bouchon') c = 0xe9dcb8;
        if (y === 10) c = 0x7d2f20;                                   // la bande peinte
        if (y === 12 && (dx + dz + 20) % 2 === 0) c = 0x7d2f20;       // un liseré sur l'épaule
        if (y === 8 && dz === 3 && Math.abs(dx) <= 1) c = 0x2b1d16;   // l'inscription du marchand
        if (y === 7 && dz === 3 && dx === 0) c = 0x2b1d16;
        v(cx + dx, y, cz + dz, c, part);
      }
    }
    for (const s of [-1, 1]) for (const [dx, y] of [[2, 16], [3, 16], [3, 15], [3, 14], [3, 13]]) v(cx + s * dx, y, cz, 0xb96234, 'anses');
    return {
      id: 'amphore', chaine: 'pompei', nom: 'Amphore', titre: "C'était une amphore romaine !", sous: 'Elle a transporté du vin ou de l\'huile, il y a 2 000 ans.',
      BX, BY, BZ, vox, base: [cx + 0.5, 1, cz + 0.5], leve: 3, elFin: 0.45,
      parts: ['bouchon', 'lèvre', 'col', 'anses', 'épaule', 'panse', 'pied'],
      couches: (yy) => yy <= 5 ? 'argile' : yy <= 11 ? 'sable' : 'terre', caillou: 'roche',
      fosse: (x, y, z) => { const d = (x - cx) ** 2 + (z - cz) ** 2; return (y >= 18 && d <= 20) || (y >= 20 && d <= 34); },
      piocheR: 1.9, pinceauR: 1.5, jetR: 2.2,
      intro: ['Quelque chose est enterré ici', "L'équipe a commencé à creuser et s'est arrêtée : un objet dépasse au fond de la fosse. Qu'est-ce que c'est ?"],
    };
  }

  /* ---------- 2. La villa : l'amphore est posée dans l'atrium ---------- */
  function villa() {
    const BX = 36, BY = 14, BZ = 25, { vox, v } = fabrique();
    const X0 = 3, X1 = 32, Z0 = 3, Z1 = 21, XM = 18;                 // XM : le mur entre l'atrium et le jardin
    const OUV = { x0: 6, x1: 13, z0: 9, z1: 15 };                    // l'ouverture du toit de l'atrium
    const BAS = { x0: 9, x1: 12, z0: 10, z1: 14 };                   // le bassin sous l'ouverture
    const JAR = { x0: 22, x1: 29, z0: 7, z1: 17 };                   // le jardin à ciel ouvert
    const dans = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
    const loin = (r, x, z) => Math.max(r.x0 - x, x - r.x1, r.z0 - z, z - r.z1, 0);
    const ROUGE = 0xa5352b, CREME = 0xe9dcc0, TUILE1 = 0xc65b37, TUILE2 = 0xad4a2b, MARBRE = 0xf2efe6;
    // les sols
    for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) {
      if (x <= XM) {
        if (dans(BAS, x, z)) v(x, 1, z, 0x4fa3d1, 'bassin');
        else if (x >= 5 && x <= 15 && z >= 7 && z <= 17) v(x, 1, z, (x + z) % 2 ? 0xf0ebe0 : 0x2f2a2a, 'mosaïque');
        else v(x, 1, z, 0xd9cdb4, 'dallage');
      } else if (dans(JAR, x, z)) v(x, 1, z, (x * 7 + z * 3) % 5 ? 0x6fae4f : 0x7fbb5a, 'jardin');
      else v(x, 1, z, 0xcbbf9f, 'dallage');
    }
    // le rebord du bassin
    for (let x = BAS.x0; x <= BAS.x1; x++) for (let z = BAS.z0; z <= BAS.z1; z++) if (x === BAS.x0 || x === BAS.x1 || z === BAS.z0 || z === BAS.z1) v(x, 2, z, MARBRE, 'bassin');
    // les murs : rouge pompéien en bas, crème en haut, de petites fenêtres
    const mur = (x, z) => { for (let y = 2; y <= 6; y++) v(x, y, z, y <= 3 ? ROUGE : y === 5 && (x + z) % 4 === 0 ? 0x3a2a22 : CREME, 'murs'); };
    for (let x = X0; x <= X1; x++) { mur(x, Z0); mur(x, Z1); }
    for (let z = Z0; z <= Z1; z++) { mur(X0, z); mur(X1, z); }
    for (let z = Z0 + 1; z < Z1; z++) if (z < 11 || z > 13) mur(XM, z); else for (let y = 5; y <= 6; y++) v(XM, y, z, CREME, 'murs');
    // la porte d'entrée, en bois clouté
    for (let z = 11; z <= 13; z++) for (let y = 2; y <= 4; y++) v(X0, y, z, (y === 3 && z !== 12) ? 0xd9a441 : 0x7a4a26, 'porte');
    // le toit de l'atrium : il penche vers l'ouverture
    for (let x = X0; x <= XM; x++) for (let z = Z0; z <= Z1; z++) {
      if (dans(OUV, x, z)) continue;
      const d = loin(OUV, x, z), h = 7 + (d >= 5 ? 2 : d >= 3 ? 1 : 0);
      for (let y = 7; y <= h; y++) v(x, y, z, d === 1 ? 0xd98a55 : (x + z) % 2 ? TUILE1 : TUILE2, 'toit');
    }
    // le toit de la galerie, autour du jardin
    for (let x = XM + 1; x <= X1; x++) for (let z = Z0; z <= Z1; z++) {
      if (dans(JAR, x, z)) continue;
      const d = loin(JAR, x, z), h = 7 + (d >= 3 ? 1 : 0);
      for (let y = 7; y <= h; y++) v(x, y, z, d === 1 ? 0xd98a55 : (x + z) % 2 ? TUILE1 : TUILE2, 'toit');
    }
    // les colonnes de la galerie
    for (const x of [21, 24, 27, 30]) for (const z of [6, 9, 12, 15, 18]) {
      if (x !== 21 && x !== 30 && z !== 6 && z !== 18) continue;
      for (let y = 2; y <= 6; y++) v(x, y, z, y === 2 ? ROUGE : y === 6 ? 0xe2c27a : MARBRE, 'colonnes');
    }
    // le jardin : haies, fleurs, deux cyprès
    for (let x = 23; x <= 28; x++) for (let z = 8; z <= 16; z++) {
      const bord = x === 23 || x === 28 || z === 8 || z === 16;
      if (bord && z !== 12 && x !== 25 && x !== 26) v(x, 2, z, 0x3f7d3a, 'jardin');
    }
    for (const [x, z, c] of [[24, 10, 0xd8433a], [27, 10, 0xf2c744], [24, 14, 0xf2c744], [27, 14, 0xd8433a], [25, 9, 0xe98bb0], [26, 15, 0xe98bb0]]) v(x, 2, z, c, 'jardin');
    for (const [x, z] of [[23, 8], [28, 16]]) { for (let y = 2; y <= 5; y++) v(x, y, z, y === 2 ? 0x6b4a2b : 0x2f6b3a, 'jardin'); }
    // la fontaine
    for (let x = 25; x <= 26; x++) for (let z = 11; z <= 13; z++) v(x, 2, z, MARBRE, 'fontaine');
    v(25, 3, 12, MARBRE, 'fontaine'); v(26, 3, 12, MARBRE, 'fontaine'); v(25, 4, 12, 0x4fa3d1, 'fontaine'); v(26, 4, 12, 0x4fa3d1, 'fontaine');
    v(25, 3, 11, 0x4fa3d1, 'fontaine'); v(26, 3, 13, 0x4fa3d1, 'fontaine');
    return {
      id: 'villa', chaine: 'pompei', nom: 'Villa', titre: "C'était une villa romaine !", sous: 'Ton amphore attendait dans l\'atrium, près du bassin.',
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.85,
      parts: ['mosaïque', 'bassin', 'toit', 'murs', 'porte', 'dallage', 'colonnes', 'jardin', 'fontaine'],
      couches: (yy) => yy <= 8 ? 'cendre' : yy <= 11 ? 'ponce' : 'terre', caillou: 'lave',
      fosse: (x, y, z) => (y >= 2 && x >= 7 && x <= 12 && z >= 10 && z <= 14) || (y >= 10 && x >= 5 && x <= 14 && z >= 8 && z <= 16) || (y >= 12 && x >= 3 && x <= 16 && z >= 6 && z <= 18),
      mini: { cellules: [[7, 2, 12], [7, 3, 12], [7, 4, 12]], pied: [7.5, 2, 12.5], k: 8 },
      piocheR: 2.3, pinceauR: 2.2, jetR: 3.2,
      intro: ['Elle était posée là', "Ton amphore est toute petite, au fond d'une fosse bien plus grande. Sur quoi était-elle posée ?"],
    };
  }

  /* ---------- 3. La rue : la villa est une des maisons ---------- */
  function rue() {
    const BX = 40, BY = 13, BZ = 30, { vox, v } = fabrique();
    const h = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
    const boite = (x0, x1, y0, y1, z0, z1, c, part) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) { const k = typeof c === 'function' ? c(x, y, z) : c; if (k !== null) v(x, y, z, k, part); } };
    const ROUGE = 0xa5352b, CREME = 0xe9dcc0, MARBRE = 0xf2efe6, NOIR = 0x3a2a22;
    const tuile = (x, y, z) => (x + z) % 2 ? 0xc65b37 : 0xad4a2b;
    const route = (x, z) => (z >= 13 && z <= 17) || (x >= 19 && x <= 21 && z >= 18);
    // le sol : la chaussée en basalte, le reste en dalles claires
    for (let x = 2; x <= 37; x++) for (let z = 2; z <= 27; z++) {
      if (route(x, z)) v(x, 1, z, [0x5c5a5e, 0x67656a, 0x535156][Math.floor(h(x, z) * 3)], 'pavés');
      else v(x, 1, z, h(x, z) > 0.5 ? 0xcfc4a8 : 0xc4b89a, 'trottoirs');
    }
    // les trottoirs surélevés
    for (let x = 2; x <= 37; x++) { v(x, 2, 12, 0xd9cfb6, 'trottoirs'); if (x < 19 || x > 21) v(x, 2, 18, 0xd9cfb6, 'trottoirs'); }
    for (let z = 19; z <= 27; z++) { v(18, 2, z, 0xd9cfb6, 'trottoirs'); v(22, 2, z, 0xd9cfb6, 'trottoirs'); }
    // les pierres de gué, pour traverser sans se mouiller
    for (const x of [15, 28]) for (const z of [14, 16]) v(x, 2, z, 0xe2dccf, 'pavés');
    // la rangée de boutiques, en face de la chaussée : des murs creux, un toit, trois portes et leurs auvents
    boite(16, 36, 2, 3, 4, 10, (x, y, z) => (x === 16 || x === 36 || z === 4 || z === 10) ? (y === 2 ? ROUGE : CREME) : null, 'boutiques');
    boite(16, 36, 4, 4, 4, 10, tuile, 'boutiques'); boite(16, 36, 5, 5, 6, 8, tuile, 'boutiques');
    [[18, 0xc0392b], [22, 0x2e6fa3], [26, 0xe0b030]].forEach(([x, c]) => { v(x, 2, 10, NOIR, 'boutiques'); v(x, 3, 10, NOIR, 'boutiques'); for (let d = -1; d <= 1; d++) v(x + d, 3, 11, d ? c : MARBRE, 'boutiques'); });
    // le comptoir du marchand de plats chauds, avec ses jarres encastrées
    for (let x = 31; x <= 35; x++) { vox.delete(cle(x, 2, 10)); vox.delete(cle(x, 3, 10)); v(x, 2, 11, x % 2 ? MARBRE : 0xc8703d, 'comptoir'); }
    v(31, 2, 10, MARBRE, 'comptoir'); v(35, 2, 10, 0x4f8f5a, 'comptoir'); v(33, 2, 9, 0xe0b030, 'comptoir');
    // la fontaine publique, au coin
    boite(23, 25, 2, 2, 19, 20, MARBRE, 'fontaine'); v(24, 3, 20, MARBRE, 'fontaine'); v(24, 4, 20, MARBRE, 'fontaine');
    v(24, 3, 19, 0x4fa3d1, 'fontaine'); v(23, 3, 19, 0x4fa3d1, 'fontaine'); v(25, 3, 19, 0x4fa3d1, 'fontaine');
    // la boulangerie : la maison, la cour, les meules de lave et le four
    boite(3, 9, 2, 3, 20, 26, (x, y, z) => (y === 2 ? ROUGE : CREME), 'boulangerie'); boite(3, 9, 4, 4, 20, 26, tuile, 'boulangerie'); boite(3, 9, 5, 5, 22, 24, tuile, 'boulangerie');
    v(6, 2, 20, NOIR, 'boulangerie'); v(6, 3, 20, NOIR, 'boulangerie');
    for (let x = 10; x <= 16; x++) v(x, 2, 26, CREME, 'boulangerie');
    for (let z = 20; z <= 26; z++) v(16, 2, z, CREME, 'boulangerie');
    for (const [x, z] of [[11, 22], [13, 24], [14, 21]]) { v(x, 2, z, 0x4a4a4e, 'boulangerie'); v(x, 3, z, 0x626268, 'boulangerie'); }
    boite(10, 11, 2, 3, 24, 25, 0xb5552f, 'boulangerie'); v(12, 2, 25, 0xe2b86a, 'boulangerie');
    // le temple, sur son podium
    boite(27, 35, 2, 2, 21, 27, 0xe6e1d6, 'temple'); boite(29, 33, 2, 2, 20, 20, 0xd9d3c6, 'temple');
    for (const x of [27, 29, 31, 33, 35]) boite(x, x, 3, 5, 21, 21, MARBRE, 'temple');
    for (const z of [23, 25, 27]) { boite(27, 27, 3, 5, z, z, MARBRE, 'temple'); boite(35, 35, 3, 5, z, z, MARBRE, 'temple'); }
    boite(29, 33, 3, 5, 23, 27, (x, y, z) => (y === 3 ? ROUGE : CREME), 'temple'); v(31, 3, 23, NOIR, 'temple'); v(31, 4, 23, NOIR, 'temple');
    boite(27, 35, 6, 6, 21, 27, (x, y, z) => (z === 21 ? MARBRE : tuile(x, y, z)), 'temple');
    boite(29, 33, 7, 7, 21, 27, (x, y, z) => (z === 21 ? MARBRE : tuile(x, y, z)), 'temple');
    boite(31, 31, 8, 8, 21, 27, (x, y, z) => (z === 21 ? 0xe0b030 : tuile(x, y, z)), 'temple');
    // l'arc, au bout de la rue
    for (const z of [12, 18]) boite(37, 37, 2, 5, z, z, MARBRE, 'arc');
    boite(37, 37, 6, 6, 12, 18, MARBRE, 'arc'); boite(37, 37, 7, 7, 13, 17, (x, y, z) => (z === 15 ? 0x8e3b24 : MARBRE), 'arc');
    // la charrette, chargée d'amphores
    boite(6, 8, 2, 2, 15, 15, 0x8a5a36, 'charrette'); v(9, 2, 15, 0x6e4527, 'charrette'); v(6, 3, 15, 0xc8703d, 'charrette'); v(7, 3, 15, 0xc8703d, 'charrette'); v(7, 2, 14, NOIR, 'charrette'); v(7, 2, 16, NOIR, 'charrette');
    // deux pins parasols
    for (const [x, z] of [[24, 24], [13, 23]]) { boite(x, x, 2, 4, z, z, 0x6b4a2b, 'pins'); boite(x - 1, x + 1, 5, 5, z - 1, z + 1, 0x2f6b3a, 'pins'); v(x, 6, z, 0x3f7d3a, 'pins'); }
    // la place de la villa : tout ce qu'elle occupe, à l'échelle de la rue
    const cellules = []; for (let x = 4; x <= 13; x++) for (let y = 2; y <= 4; y++) for (let z = 3; z <= 9; z++) cellules.push([x, y, z]);
    return {
      id: 'rue', chaine: 'pompei', nom: 'Rue', titre: "C'était une rue de Pompéi\u00a0!", sous: 'Ta villa donnait sur la chaussée, à deux pas des boutiques et du temple.',
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.85,
      parts: ['trottoirs', 'pavés', 'boutiques', 'comptoir', 'charrette', 'fontaine', 'boulangerie', 'temple', 'arc', 'pins'],
      couches: (yy) => yy <= 6 ? 'cendre' : yy <= 9 ? 'ponce' : 'terre', caillou: 'lave',
      fosse: (x, y, z) => y >= 2 && x >= 3 && x <= 14 && z >= 2 && z <= 10,
      mini: { cellules, pied: [9, 2, 6.5], k: 3 },
      piocheR: 2.6, pinceauR: 2.6, jetR: 3.6,
      intro: ['Elle était bâtie là', "Ta villa est devenue une maquette au fond de la fosse. De quoi était-elle entourée\u00a0?"],
    };
  }

  /* ---------- 4. La ville : la rue est un trait entre les maisons, au pied du volcan ---------- */
  function ville() {
    const BX = 56, BY = 17, BZ = 44, { vox, v } = fabrique();
    const h = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
    const boite = (x0, x1, y0, y1, z0, z1, c, part) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) { const k = typeof c === 'function' ? c(x, y, z) : c; if (k !== null) v(x, y, z, k, part); } };
    const CREME = 0xe9dcc0, MARBRE = 0xf2efe6, PIERRE = 0xb8b0a0, PAVE = 0x5c5a5e;
    const tuile = (x, z) => [0xc65b37, 0xad4a2b, 0xd06a40][Math.floor(h(x * 3 + 1, z * 5 + 2) * 3)];
    const MUR = { x0: 4, x1: 34, z0: 6, z1: 36 };                    // les remparts
    const LIBRE = { x0: 8, x1: 23, z0: 14, z1: 26 };                 // la place de la rue, et les voies qui l'entourent
    const FORUM = { x0: 24, x1: 33, z0: 7, z1: 13 }, ARENE = { cx: 29, cz: 31, a: 4.6, b: 4.2 };
    const VOLCAN = { cx: 45, cz: 11 }, rayon = (y) => 8.5 - (y - 2) * 0.75;
    const dans = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
    const enVille = (x, z) => x > MUR.x0 && x < MUR.x1 && z > MUR.z0 && z < MUR.z1;
    const voie = (x, z) => enVille(x, z) && (x === 8 || x === 9 || x === 22 || x === 23 || z === 14 || z === 15 || z === 25 || z === 26 || dans(LIBRE, x, z)
      || (x === 15 && (z < 14 || z > 26)) || (x === 28 && z > 15 && z < 25) || ((x === 20 || x === 21) && z > 26));
    const arene = (x, z) => Math.sqrt(((x + 0.5 - ARENE.cx) / ARENE.a) ** 2 + ((z + 0.5 - ARENE.cz) / ARENE.b) ** 2);
    // le sol : la mer au sud, les champs dehors, les voies et les cours dedans
    for (let x = 2; x <= 53; x++) for (let z = 2; z <= 41; z++) {
      if (z >= 39) { v(x, 1, z, h(x, z) > 0.6 ? 0x4fa3d1 : 0x3f8fc0, 'mer'); continue; }
      if (z === 38) { v(x, 1, z, 0xe2c28a, 'mer'); continue; }
      const porte = ((x === 20 || x === 21) && z >= 36) || ((x <= 4) && (z === 14 || z === 15));
      if (voie(x, z) || porte) { v(x, 1, z, h(x, z) > 0.5 ? PAVE : 0x67656a, 'routes'); continue; }
      if (dans(FORUM, x, z) && enVille(x, z)) { v(x, 1, z, 0xe6e1d6, 'forum'); continue; }
      if (enVille(x, z)) { v(x, 1, z, arene(x, z) <= 0.5 ? 0xe2c28a : 0xcfc4a8, arene(x, z) <= 1.05 ? 'amphithéâtre' : 'maisons'); continue; }
      const champ = h(Math.floor(x / 4), Math.floor(z / 3));
      v(x, 1, z, [0x8fbf5a, 0xb9c95a, 0xd9c36a, 0x6fae4f][Math.floor(champ * 4)], 'champs');
      if (h(x + 7, z + 3) < 0.035 && Math.hypot(x - VOLCAN.cx, z - VOLCAN.cz) > 10) v(x, 2, z, 0x2f6b3a, 'champs');   // un arbre
    }
    // les remparts, leurs tours et leurs portes
    for (let x = MUR.x0; x <= MUR.x1; x++) for (const z of [MUR.z0, MUR.z1]) if (!(z === MUR.z1 && (x === 20 || x === 21))) boite(x, x, 2, 3, z, z, (a, y) => (y === 3 && a % 2 ? 0xa39b8b : PIERRE), 'remparts');
    for (let z = MUR.z0; z <= MUR.z1; z++) for (const x of [MUR.x0, MUR.x1]) if (!(x === MUR.x0 && (z === 14 || z === 15))) boite(x, x, 2, 3, z, z, (a, y, b) => (y === 3 && b % 2 ? 0xa39b8b : PIERRE), 'remparts');
    for (const [x, z] of [[4, 6], [33, 6], [4, 35], [33, 35], [18, 35], [22, 35], [4, 12], [4, 16]]) boite(x, x + 1, 2, 5, z, z + 1, (a, y) => (y === 5 ? 0x8e867a : PIERRE), 'remparts');
    // les maisons : des pâtés serrés, toits de tuiles, quelques cours
    for (let x = MUR.x0 + 1; x < MUR.x1; x++) for (let z = MUR.z0 + 1; z < MUR.z1; z++) {
      if (voie(x, z) || dans(FORUM, x, z) || arene(x, z) <= 1.25) continue;
      const lot = h(Math.floor(x / 2) * 2 + 11, Math.floor(z / 2) * 2 + 5);
      if (lot < 0.14) { if (h(x, z) < 0.5) v(x, 2, z, 0x3f7d3a, 'maisons'); continue; }      // une cour, un peu de verdure
      const haut = lot > 0.7 ? 2 : 1;
      for (let y = 2; y < 2 + haut; y++) v(x, y, z, y === 2 ? 0xd9c9a8 : CREME, 'maisons');
      v(x, 2 + haut, z, tuile(Math.floor(x / 2), Math.floor(z / 2)), 'maisons');
    }
    // le forum : la colonnade et le grand temple
    for (let x = 25; x <= 32; x++) for (let z = 8; z <= 12; z++) if ((x === 25 || z === 8 || z === 12) && (x + z) % 2 === 1 && x < 30) boite(x, x, 2, 3, z, z, MARBRE, 'forum');
    boite(30, 32, 2, 2, 9, 11, 0xd9d3c6, 'forum'); boite(31, 32, 3, 3, 9, 11, CREME, 'forum'); boite(30, 32, 4, 4, 9, 11, (x, y, z) => tuile(x, z), 'forum');
    v(30, 3, 9, MARBRE, 'forum'); v(30, 3, 11, MARBRE, 'forum'); v(30, 5, 10, 0xe0b030, 'forum'); v(31, 5, 10, 0xc65b37, 'forum'); v(32, 5, 10, 0xc65b37, 'forum');
    // l'amphithéâtre : des gradins en ovale autour du sable
    for (let x = 23; x <= 34; x++) for (let z = 26; z <= 36; z++) {
      const d = arene(x, z); if (d <= 0.5 || d > 1.05 || !enVille(x, z)) continue;
      const haut = d > 0.85 ? 3 : d > 0.67 ? 2 : 1;
      for (let y = 2; y < 2 + haut; y++) v(x, y, z, y === 1 + haut ? (haut === 3 ? PIERRE : 0xd9d3c6) : 0xc9c2b4, 'amphithéâtre');
    }
    // le volcan : des vignes en bas, la roche en haut, le cratère
    for (let y = 2; y <= 11; y++) { const r = rayon(y);
      for (let dx = -9; dx <= 9; dx++) for (let dz = -9; dz <= 9; dz++) {
        const d2 = dx * dx + dz * dz; if (d2 > r * r) continue;
        const x = VOLCAN.cx + dx, z = VOLCAN.cz + dz;
        if (y >= 10 && d2 <= 1.3) { v(x, y, z, y === 10 ? 0xff7a1a : 0xffc23a, 'lave'); continue; }
        const c = y <= 3 ? ((x + z) % 3 ? 0x5d9a4a : 0x3f7d3a) : y <= 6 ? (h(x, z + y) > 0.5 ? 0x8a6a4a : 0x7a5c40) : y <= 9 ? 0x6b5b55 : 0x4a4346;
        v(x, y, z, c, 'volcan');
      } }
    // une coulée qui descend vers la ville
    for (let y = 9; y >= 3; y--) { const r = rayon(y); let dx = 0; while ((dx + 1) * (dx + 1) * 2 <= r * r) dx++; v(VOLCAN.cx - dx, y, VOLCAN.cz + dx, y % 2 ? 0xff7a1a : 0xe2491c, 'lave'); if (dx > 1) v(VOLCAN.cx - dx + 1, y, VOLCAN.cz + dx, 0xe2491c, 'lave'); }
    // le panache
    for (const [x, y, z] of [[45, 12, 11], [45, 13, 11], [46, 13, 11], [46, 14, 11], [46, 14, 12], [47, 14, 11], [45, 14, 10]]) v(x, y, z, y === 12 ? 0x9a958c : 0xd8d4cc, 'volcan');
    // le port : la jetée et deux bateaux
    boite(20, 21, 2, 2, 39, 40, 0x8a5a36, 'bateaux');
    for (const [x, voile] of [[10, MARBRE], [30, 0xc0392b]]) { boite(x, x + 2, 2, 2, 40, 40, 0x6e4527, 'bateaux'); v(x + 1, 3, 40, voile, 'bateaux'); v(x + 1, 4, 40, voile, 'bateaux'); v(x + 2, 3, 40, voile, 'bateaux'); }
    // la place de la rue, à l'échelle de la ville
    const cellules = []; for (let x = 10; x <= 21; x++) for (let y = 2; y <= 4; y++) for (let z = 16; z <= 24; z++) cellules.push([x, y, z]);
    return {
      id: 'ville', chaine: 'pompei', nom: 'Ville', titre: "C'était Pompéi, au pied du Vésuve\u00a0!", sous: "Une ville entière, endormie sous la cendre depuis l'an 79. Ta rue menait du forum au port.",
      BX, BY, BZ, vox, base: [28, 1, 22], leve: 2, elFin: 0.8,
      parts: ['routes', 'maisons', 'remparts', 'forum', 'amphithéâtre', 'champs', 'volcan', 'lave', 'mer', 'bateaux'],
      couches: (yy) => yy <= 8 ? 'cendre' : yy <= 12 ? 'ponce' : 'terre', caillou: 'lave',
      fosse: (x, y, z) => y >= 2 && x >= 9 && x <= 22 && z >= 15 && z <= 25,
      mini: { cellules, pied: [16, 2, 20.5], k: 3 },
      piocheR: 3.1, pinceauR: 3.0, jetR: 4.4,
      intro: ['Elle menait quelque part', "Ta rue n'est plus qu'un trait au fond de la fosse. Où menait-elle\u00a0?"],
      // la fin de la chaîne : on replonge jusqu'à l'amphore, puis la ville s'anime au soir
      fin: { plonge: 'La ville, la rue, la villa\u2026', depart: 'Tout est parti de cette amphore.', vivant: 'Pompéi, un soir de l\'an 79.' },
      vivant: { fumee: [46.5, 15, 11.5], braise: (e) => e.part === 'lave', lumieres: (e) => (e.part === 'maisons' && e.y === 2 && e.c === 0xd9c9a8) || (e.part === 'remparts' && e.y === 5),
        flotte: (e) => e.part === 'bateaux' && e.x !== 20 && e.x !== 21 },
    };
  }

  /* =====================================================================
     Les fouilles libres : une trouvaille seule, sans suite (libre: true)
     ===================================================================== */
  const boiteDans = (v) => (x0, x1, y0, y1, z0, z1, c, part) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) { const k = typeof c === 'function' ? c(x, y, z) : c; if (k !== null) v(x, y, z, k, part); } };

  /* =====================================================================
     La chaîne de Dité : la cité de fer de l'Enfer de Dante (chants VIII à XI).
     Brasero, porte, rempart et champ de tombes, cité. De l'architecture et du feu,
     aucun personnage ni damné.
     ===================================================================== */
  const FER = 0x4a4650, FER2 = 0x3a3640, NOIR = 0x2a262e, ROUILLE = 0x7a3b2a, ROUGI = 0xd8432a, FEU = 0xff7a1a, FEU2 = 0xffc23a, PIERRE_D = 0x5a5360, STYX1 = 0x1f3b3a, STYX2 = 0x2a4d48, CENDRE_D = 0x6b6468;
  const TERRE_DITE = { couches: (yy) => yy <= 4 ? 'braise' : yy <= 10 ? 'suie' : 'cendre', caillou: 'lave', dessus: 'cendre' };

  /* ---------- 1. Le brasero : la flamme dépasse ---------- */
  function brasero() {
    const BX = 13, BY = 19, BZ = 13, cx = 6, cz = 6, { vox, v } = fabrique();
    const disque = (y, r, c, part, creux = -1) => { for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) { const d2 = dx * dx + dz * dz; if (d2 > r * r + 0.01 || (creux > 0 && d2 <= creux * creux)) continue; v(cx + dx, y, cz + dz, typeof c === 'function' ? c(dx, dz) : c, part); } };
    disque(1, 2.9, FER2, 'socle'); disque(2, 2.3, FER, 'socle'); disque(3, 1.5, (dx, dz) => (dx + dz) % 2 ? ROUILLE : FER, 'socle');
    for (let y = 4; y <= 8; y++) disque(y, y === 6 ? 1.5 : 0.8, y === 6 ? 0xb8862e : FER, 'pied');
    disque(9, 1.5, FER2, 'coupe'); disque(10, 2.5, FER, 'coupe'); disque(11, 3.5, (dx, dz) => (dx * 3 + dz * 5 + 40) % 7 === 0 ? ROUILLE : FER, 'coupe', 2.4); disque(12, 3.5, (dx, dz) => (dx + dz + 20) % 2 ? FER2 : 0xb8862e, 'coupe', 2.9);
    disque(11, 2.4, (dx, dz) => (dx * 5 + dz * 3 + 40) % 3 ? 0xa52a1c : NOIR, 'braises'); disque(12, 2.9, (dx, dz) => (dx * 7 + dz * 2 + 40) % 4 ? ROUGI : 0x4a2018, 'braises');
    disque(13, 2.3, (dx, dz) => dx * dx + dz * dz <= 1 ? FEU2 : FEU, 'flamme'); disque(14, 1.5, (dx, dz) => dx || dz ? FEU : FEU2, 'flamme'); disque(15, 1.2, FEU, 'flamme'); disque(16, 0.5, FEU2, 'flamme'); v(cx, 17, cz, 0xfff0b0, 'flamme'); v(cx + 1, 16, cz, FEU, 'flamme');
    for (const s of [-1, 1]) { v(cx + s * 4, 11, cz, 0xb8862e, 'anneaux'); v(cx + s * 4, 10, cz, 0xb8862e, 'anneaux'); v(cx + s * 4, 9, cz, 0x8a6420, 'anneaux'); v(cx, 11, cz + s * 4, 0xb8862e, 'anneaux'); v(cx, 10, cz + s * 4, 0x8a6420, 'anneaux'); }
    return {
      id: 'brasero', chaine: 'dite', nom: 'Brasero', titre: "C'était un brasero de fer !", sous: 'Il brûlait jour et nuit, pour ceux qui arrivaient par le marais.',
      BX, BY, BZ, vox, base: [cx + 0.5, 1, cz + 0.5], leve: 3, elFin: 0.45,
      parts: ['flamme', 'braises', 'coupe', 'anneaux', 'pied', 'socle'], ...TERRE_DITE,
      fosse: (x, y, z) => { const d = (x - cx) ** 2 + (z - cz) ** 2; return (y >= 15 && d <= 10) || (y >= 17 && d <= 22); },
      piocheR: 1.9, pinceauR: 1.5, jetR: 2.2,
      intro: ['La terre est chaude ici', "Une pointe orange sort de la cendre, au fond de la fosse. On dirait une flamme figée. Qu'est-ce que c'est ?"],
    };
  }

  /* ---------- 2. La porte : le brasero éclairait le seuil ---------- */
  function porte() {
    const BX = 34, BY = 20, BZ = 16, { vox, v } = fabrique(), boite = boiteDans(v);
    for (let x = 2; x <= 31; x++) for (let z = 2; z <= 13; z++) v(x, 1, z, z <= 5 && x >= 13 && x <= 20 ? ((x + z) % 2 ? 0x8a8090 : PIERRE_D) : (x * 3 + z * 7) % 5 ? PIERRE_D : 0x4e4856, 'dalles');
    // le mur de fer, percé de la porte
    boite(8, 25, 2, 10, 7, 9, (x, y, z) => (x >= 14 && x <= 19 && y <= 7) ? null : (x * 5 + y * 3) % 11 === 0 ? ROUILLE : y === 10 ? FER2 : FER, 'mur');
    for (let x = 13; x <= 20; x++) v(x, 8, 6, x === 13 || x === 20 ? 0xb8862e : 0x8a8090, 'mur');                     // le linteau
    for (let x = 8; x <= 25; x += 2) boite(x, x, 11, 11, 7, 9, FER2, 'créneaux');
    // les deux vantaux, fermés : fer sombre et clous d'or
    for (let x = 14; x <= 19; x++) for (let y = 2; y <= 7; y++) v(x, y, 8, (y === 3 || y === 6) && x !== 16 && x !== 17 ? 0xd9a441 : x === 16 || x === 17 ? NOIR : 0x34303a, 'vantaux');
    v(16, 4, 7, 0xd9a441, 'vantaux'); v(17, 4, 7, 0xd9a441, 'vantaux');                                                // les heurtoirs
    // les tours, rougies par le feu vers le haut
    for (const x0 of [2, 26]) {
      boite(x0, x0 + 5, 2, 15, 5, 11, (x, y, z) => { const bord = x === x0 || x === x0 + 5 || z === 5 || z === 11; if (!bord && y < 15) return y % 4 === 1 ? FER2 : null;
        if (y >= 12 && y <= 13 && (x + z) % 2 === 0) return y === 12 ? ROUGI : FEU; return y >= 10 ? ROUILLE : (x + y + z) % 9 === 0 ? ROUILLE : FER; }, 'tours');
      for (let x = x0; x <= x0 + 5; x++) for (let z = 5; z <= 11; z++) if ((x === x0 || x === x0 + 5 || z === 5 || z === 11) && (x + z) % 2 === 0) v(x, 16, z, FER2, 'créneaux');
      // le feu de signal, au sommet
      boite(x0 + 2, x0 + 3, 16, 16, 7, 9, (x, y, z) => z === 8 ? FEU2 : FEU, 'signaux'); v(x0 + 2, 17, 8, FEU, 'signaux'); v(x0 + 3, 17, 8, FEU2, 'signaux'); v(x0 + 3, 18, 8, 0xfff0b0, 'signaux');
    }
    const cellules = []; for (let x = 10; x <= 12; x++) for (let y = 2; y <= 4; y++) for (let z = 3; z <= 5; z++) cellules.push([x, y, z]);
    return {
      id: 'porte', chaine: 'dite', nom: 'Porte', titre: "C'était la porte de Dité !", sous: "Dans l'Enfer de Dante, c'est l'entrée de la cité du bas monde. Ton brasero éclairait le seuil.",
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.5, azFin: 0.5,
      parts: ['dalles', 'vantaux', 'mur', 'créneaux', 'tours', 'signaux'], ...TERRE_DITE,
      fosse: (x, y, z) => (y >= 2 && x >= 9 && x <= 13 && z >= 2 && z <= 6) || (y >= 9 && x >= 8 && x <= 14 && z >= 1 && z <= 7) || (y >= 15 && x >= 6 && x <= 16 && z >= 1 && z <= 9),
      mini: { cellules, pied: [11.5, 2, 4.5], k: 6 },
      piocheR: 2.3, pinceauR: 2.2, jetR: 3.2,
      intro: ['Il éclairait quelque chose', "Ton brasero est tout petit, au fond d'une fosse bien plus grande. Devant quoi brûlait-il ?"],
    };
  }

  /* ---------- 3. Le rempart : le marais dehors, le champ de tombes dedans ---------- */
  function rempart() {
    const BX = 44, BY = 15, BZ = 34, { vox, v } = fabrique(), boite = boiteDans(v);
    const h = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
    for (let x = 2; x <= 41; x++) for (let z = 2; z <= 31; z++) {
      if (z <= 8) { v(x, 1, z, h(x, z) > 0.55 ? STYX2 : STYX1, 'marais'); if (h(x + 5, z + 9) < 0.06 && !(x >= 18 && x <= 26)) v(x, 2, z, 0x55603a, 'marais'); continue; }      // l'eau du Styx et ses roseaux
      if (z <= 9) { v(x, 1, z, 0x3d3a34, 'marais'); continue; }
      const chemin = (x >= 21 && x <= 22) || z === 22 || z === 23;
      v(x, 1, z, chemin ? (h(x, z) > 0.5 ? 0x8a8090 : 0x7a7080) : h(x, z) > 0.5 ? CENDRE_D : 0x5e585c, chemin ? 'sentier' : 'cendres');
    }
    // la barque, vide, au bout du ponton
    boite(21, 22, 2, 2, 7, 9, 0x5a3d28, 'barque'); boite(20, 23, 2, 2, 4, 5, 0x3a2a20, 'barque'); v(19, 2, 4, 0x3a2a20, 'barque'); v(24, 2, 5, 0x3a2a20, 'barque'); v(20, 3, 4, 0x2a1d16, 'barque'); v(23, 3, 5, 0x2a1d16, 'barque');
    for (let y = 3; y <= 5; y++) v(24, y, 4, 0x6e5a40, 'barque'); v(24, 6, 4, FEU, 'barque');                          // sa perche et son fanal
    // le rempart, de part et d'autre de la porte
    for (const [xa, xb] of [[2, 15], [28, 41]]) { boite(xa, xb, 2, 6, 12, 13, (x, y) => (x * 5 + y * 3) % 11 === 0 ? ROUILLE : FER, 'rempart'); for (let x = xa; x <= xb; x += 2) boite(x, x, 7, 7, 12, 13, FER2, 'rempart'); }
    for (const x0 of [2, 38]) { boite(x0, x0 + 3, 2, 9, 11, 14, (x, y, z) => y >= 8 && (x + z) % 2 === 0 ? (y === 8 ? ROUGI : FEU) : y >= 7 ? ROUILLE : FER, 'tours'); boite(x0 + 1, x0 + 2, 10, 10, 12, 13, FEU, 'tours'); v(x0 + 1, 11, 12, FEU2, 'tours'); }
    // les tombes : des coffres de pierre, le couvercle levé, et le feu dedans
    for (const tx of [5, 10, 15, 26, 31, 36]) for (const tz of [17, 26]) {
      if (h(tx, tz) < 0.12) continue;
      boite(tx, tx + 2, 2, 2, tz, tz + 3, (x, y, z) => (x === tx + 1 && z > tz && z < tz + 3) ? null : (x + z) % 3 ? 0x8a8090 : 0x7a7080, 'tombes');
      v(tx + 1, 2, tz + 1, 0xa52a1c, 'flammes'); v(tx + 1, 2, tz + 2, ROUGI, 'flammes'); v(tx + 1, 3, tz + 1, FEU, 'flammes'); v(tx + 1, 3, tz + 2, FEU, 'flammes'); v(tx + 1, 4, tz + 1 + (tx % 2), FEU2, 'flammes');
      boite(tx, tx + 2, 3, 3, tz + 3, tz + 3, 0x9a90a0, 'tombes'); boite(tx, tx + 2, 4, 4, tz + 4, tz + 4, 0x9a90a0, 'tombes');      // le couvercle, appuyé derrière
    }
    for (const [x, z] of [[8, 22], [18, 29], [33, 22], [39, 30], [3, 30]]) { for (let y = 2; y <= 5; y++) v(x, y, z, 0x2a2224, 'arbres morts'); v(x + 1, 5, z, 0x2a2224, 'arbres morts'); v(x - 1, 4, z, 0x2a2224, 'arbres morts'); v(x, 6, z + 1, 0x2a2224, 'arbres morts'); }
    const cellules = []; for (let x = 16; x <= 27; x++) for (let y = 2; y <= 7; y++) for (let z = 10; z <= 15; z++) cellules.push([x, y, z]);
    return {
      id: 'rempart', chaine: 'dite', nom: 'Rempart', titre: "C'était le rempart, et son champ de tombes !", sous: 'Dehors, le marais du Styx et la barque du passeur. Dedans, des tombes ouvertes où le feu ne s\'éteint pas.',
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.8,
      parts: ['marais', 'barque', 'rempart', 'tours', 'sentier', 'cendres', 'tombes', 'flammes', 'arbres morts'], ...TERRE_DITE,
      fosse: (x, y, z) => y >= 2 && x >= 15 && x <= 28 && z >= 9 && z <= 16,
      mini: { cellules, pied: [22, 2, 12.67], k: 3 },
      piocheR: 2.6, pinceauR: 2.6, jetR: 3.6,
      intro: ['Elle gardait quelque chose', "Ta porte est devenue une maquette au fond de la fosse. Que fermait-elle ?"],
    };
  }

  /* ---------- 4. La cité : un anneau de fer au milieu du Styx ---------- */
  function cite() {
    const BX = 58, BY = 18, BZ = 52, { vox, v } = fabrique(), boite = boiteDans(v);
    const h = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
    const CX = 29, CZ = 26, R = 18, dist = (x, z) => Math.hypot(x + 0.5 - CX - 0.5, z + 0.5 - CZ - 0.5);
    const MINI = { x0: 21, x1: 36, z0: 3, z1: 15 }, dansMini = (x, z) => x >= MINI.x0 && x <= MINI.x1 && z >= MINI.z0 && z <= MINI.z1;
    for (let x = 2; x <= 55; x++) for (let z = 2; z <= 49; z++) {
      const d = dist(x, z);
      if (d <= 4.2) { v(x, 1, z, d <= 2.6 ? (h(x, z) > 0.5 ? FEU2 : FEU) : ROUGI, 'gouffre'); continue; }
      if (d < R - 0.5) { const voie = Math.abs(x - CX) <= 0 || Math.abs(z - CZ) <= 0 || Math.abs(d - 10) < 0.7; v(x, 1, z, voie ? 0x8a8090 : h(x, z) > 0.5 ? CENDRE_D : 0x5e585c, voie ? 'voies' : 'cendres'); continue; }
      if (d <= R + 5.5) { v(x, 1, z, d <= R + 0.8 ? 0x3d3a34 : h(x, z) > 0.55 ? STYX2 : STYX1, d <= R + 0.8 ? 'remparts' : 'styx'); continue; }
      v(x, 1, z, h(x, z) > 0.5 ? 0x3d3a34 : 0x4a4444, 'rives'); if (h(x + 3, z + 11) < 0.07) v(x, 2, z, h(x, z) > 0.5 ? 0x2a2224 : 0x55504a, 'rives');
    }
    // le bord du gouffre : un anneau de roche noire
    for (let x = CX - 6; x <= CX + 6; x++) for (let z = CZ - 6; z <= CZ + 6; z++) { const d = dist(x, z); if (d > 4.2 && d <= 5.4) { v(x, 2, z, NOIR, 'gouffre'); if (h(x, z) > 0.6) v(x, 3, z, 0x3a3238, 'gouffre'); } }
    // la muraille en anneau, et ses tours rougies
    for (let x = 2; x <= 55; x++) for (let z = 2; z <= 49; z++) { const d = dist(x, z); if (Math.abs(d - R) > 0.75 || dansMini(x, z)) continue; for (let y = 2; y <= 4; y++) v(x, y, z, (x * 5 + y * 3 + z) % 11 === 0 ? ROUILLE : FER, 'remparts'); if ((x + z) % 2) v(x, 5, z, FER2, 'remparts'); }
    for (let a = 0; a < 8; a++) { const an = a * Math.PI / 4 + Math.PI / 8, x0 = Math.round(CX + Math.cos(an) * R) - 1, z0 = Math.round(CZ + Math.sin(an) * R) - 1; if (dansMini(x0, z0) || dansMini(x0 + 2, z0 + 2)) continue;
      boite(x0, x0 + 2, 2, 8, z0, z0 + 2, (x, y, z) => y >= 7 && (x + z) % 2 === 0 ? (y === 7 ? ROUGI : FEU) : y >= 6 ? ROUILLE : FER, 'tours'); v(x0 + 1, 9, z0 + 1, FEU, 'tours'); v(x0 + 1, 10, z0 + 1, FEU2, 'tours'); }
    // les édifices rouges, coiffés d'un dôme
    for (const [x0, z0, hh] of [[19, 24, 4], [36, 23, 5], [24, 34, 4], [33, 33, 3], [17, 31, 3], [39, 30, 4], [35, 17, 3], [20, 18, 3]]) {
      boite(x0, x0 + 2, 2, 1 + hh, z0, z0 + 2, (x, y, z) => y === 3 && x === x0 + 1 ? FEU : (x + y + z) % 5 === 0 ? 0x8a2a20 : 0xa5352b, 'édifices'); v(x0 + 1, 2 + hh, z0 + 1, ROUGI, 'édifices'); v(x0 + 1, 3 + hh, z0 + 1, 0xd9a441, 'édifices'); }
    // les tombes en feu, semées dans la cendre
    for (let x = 12; x <= 46; x += 2) for (let z = 10; z <= 44; z += 2) { const d = dist(x, z); if (d < 6.5 || d > R - 2.5 || dansMini(x, z) || vox.has(cle(x, 2, z)) || vox.get(cle(x, 1, z)).part !== 'cendres' || h(x * 3, z * 7) > 0.22) continue;
      v(x, 2, z, 0x8a8090, 'tombes'); v(x, 3, z, h(x, z) > 0.5 ? FEU : FEU2, 'flammes'); }
    // la barque du passeur, sur le Styx
    boite(8, 10, 2, 2, 26, 26, 0x3a2a20, 'barque'); v(9, 3, 26, 0x6e5a40, 'barque'); v(9, 4, 26, FEU, 'barque');
    const cellules = []; for (let x = MINI.x0; x <= MINI.x1; x++) for (let y = 2; y <= 5; y++) for (let z = MINI.z0; z <= MINI.z1; z++) cellules.push([x, y, z]);
    return {
      id: 'cite', chaine: 'dite', nom: 'Cité', titre: "C'était Dité, la cité de fer !", sous: "Dante l'a décrite vers 1314 : des murailles de fer, des tours rougies par le feu, et le marais du Styx tout autour.",
      BX, BY, BZ, vox, base: [29, 1, 26], leve: 2, elFin: 0.8,
      parts: ['styx', 'rives', 'barque', 'remparts', 'tours', 'voies', 'cendres', 'édifices', 'tombes', 'flammes', 'gouffre'], ...TERRE_DITE,
      fosse: (x, y, z) => y >= 2 && x >= MINI.x0 - 1 && x <= MINI.x1 + 1 && z >= MINI.z0 - 1 && z <= MINI.z1 + 1,
      mini: { cellules, pied: [29, 2, 9], k: 3 },
      piocheR: 3.1, pinceauR: 3.0, jetR: 4.4,
      intro: ['Il entourait quelque chose', "Ton rempart n'est plus qu'un trait au fond de la fosse. Que protégeait-il ?"],
      fin: { plonge: 'La cité, le rempart, la porte…', depart: 'Tout est parti de ce brasero.', vivant: 'Dité, la cité où le feu ne dort jamais.' },
      vivant: { ciel: 'enfer', fumee: [29.5, 3, 26.5], braise: (e) => e.part === 'flammes' || (e.part === 'gouffre' && e.y === 1), flammes: (e) => e.part === 'flammes' || (e.part === 'tours' && e.y === 10),
        lumieres: (e) => (e.part === 'édifices' && e.y === 2) || (e.part === 'remparts' && e.y === 5), flotte: (e) => e.part === 'barque' },
    };
  }

  /* =====================================================================
     La chaîne de Tokyo : un bol de ramen, l'échoppe, la ruelle aux lanternes, le quartier.
     Des lieux génériques : aucune enseigne ni marque réelle, les écritures sont des traits.
     ===================================================================== */
  const ROUGE_T = 0xc0392b, BOIS = 0xb98a5a, BOIS2 = 0x4a3324, BLANC = 0xf2efe6, TUILE_T = 0x34424e, TUILE_T2 = 0x2a3640, ROSE = 0xf7a8c8, ROSE2 = 0xf9c4d8, VITRE = 0xf2e6a0;
  const TERRE_TOKYO = { couches: (yy) => yy <= 4 ? 'argile' : yy <= 10 ? 'terre' : 'sable', caillou: 'roche' };
  // une boîte creuse : ses murs et son toit seulement
  const coqueDans = (v) => (x0, x1, y0, y1, z0, z1, c, part) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    if (x !== x0 && x !== x1 && z !== z0 && z !== z1 && y !== y1) continue; const k = typeof c === 'function' ? c(x, y, z) : c; if (k !== null) v(x, y, z, k, part); } };

  /* ---------- 1. Le bol de ramen : les baguettes dépassent ---------- */
  function ramen() {
    const BX = 15, BY = 13, BZ = 15, cx = 7, cz = 7, { vox, v } = fabrique();
    const disque = (y, r, c, part, creux = 0) => { for (let dx = -6; dx <= 6; dx++) for (let dz = -6; dz <= 6; dz++) { const d2 = dx * dx + dz * dz; if (d2 > r * r + 0.01 || (creux > 0 && d2 <= creux * creux)) continue; const k = typeof c === 'function' ? c(dx, dz) : c; if (k !== null) v(cx + dx, y, cz + dz, k, part); } };
    disque(1, 1.6, 0x8a2a20, 'pied');
    disque(2, 2.6, ROUGE_T, 'bol'); disque(3, 3.7, (dx, dz) => (dx + dz + 20) % 4 === 0 ? BLANC : ROUGE_T, 'bol'); disque(4, 4.6, ROUGE_T, 'bol', 3.7); disque(5, 5.2, ROUGE_T, 'bol', 4.3); disque(6, 5.7, (dx, dz) => (dx + dz + 20) % 5 === 0 ? 0xd9534a : BLANC, 'bol', 4.7);      // le bord dépasse la soupe
    disque(4, 3.7, 0xc98a4a, 'bouillon'); disque(5, 4.3, (dx, dz) => (dx * 3 + dz * 5 + 40) % 4 === 0 ? null : 0xd9a05b, 'bouillon');
    disque(5, 4.3, (dx, dz) => (dx * 3 + dz * 5 + 40) % 4 === 0 ? 0xf2d98a : null, 'nouilles');
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [-1, 0], [1, 1], [-1, -1], [0, -1]]) v(cx + dx, 6, cz + dz, (dx + dz) % 2 ? 0xf2d98a : 0xe9c96a, 'nouilles');
    for (const [dx, dz] of [[2, 3], [-3, -1], [3, -2]]) v(cx + dx, 6, cz + dz, 0x5aa84a, 'nouilles');                 // la ciboule
    for (const [dx, dz, c] of [[-3, 1, BLANC], [-2, 1, 0xf2a900], [-3, 2, BLANC], [-2, 2, BLANC]]) v(cx + dx, 6, cz + dz, c, 'œuf');
    for (const [dx, dz, c] of [[1, 3, BLANC], [2, 2, 0xe86a92], [3, 1, BLANC], [2, 1, BLANC], [1, 2, BLANC]]) v(cx + dx, 6, cz + dz, c, 'naruto');
    for (let dx = -1; dx <= 1; dx++) for (let y = 6; y <= 8; y++) v(cx + dx, y, cz - 3, 0x1f3a2a, 'nori');
    for (let i = 0; i <= 4; i++) { v(cx + 2 + i, 6 + i, cz - 1, i === 4 ? ROUGE_T : 0x7a4a26, 'baguettes'); v(cx + 2 + i, 6 + i, cz, i === 4 ? ROUGE_T : 0x8a5a36, 'baguettes'); }
    return {
      id: 'ramen', chaine: 'tokyo', nom: 'Ramen', titre: "C'était un bol de ramen !", sous: 'Des nouilles, un œuf, une feuille d\'algue : quelqu\'un allait se régaler.',
      BX, BY, BZ, vox, base: [cx + 0.5, 1, cz + 0.5], leve: 3, elFin: 0.62, recul: 1.45,      // un bloc bas et large : la caméra recule
      parts: ['baguettes', 'nori', 'œuf', 'naruto', 'nouilles', 'bouillon', 'bol', 'pied'], ...TERRE_TOKYO,
      fosse: (x, y, z) => { const d = (x - cx - 5) ** 2 + (z - cz) ** 2; return (y >= 9 && d <= 6) || (y >= 11 && d <= 16); },
      piocheR: 1.9, pinceauR: 1.5, jetR: 3.2,      // un jet large : le dessous du bol est en retrait, sous le bord
      intro: ['Deux bâtons dans la terre', "Deux tiges de bois, bien droites, dépassent au fond de la fosse. Elles sont plantées dans quelque chose. Qu'est-ce que c'est ?"],
    };
  }

  /* ---------- 2. L'échoppe : le bol attendait sur le comptoir ---------- */
  function echoppe() {
    const BX = 30, BY = 17, BZ = 20, { vox, v } = fabrique(), boite = boiteDans(v);
    for (let x = 3; x <= 26; x++) for (let z = 2; z <= 16; z++) v(x, 1, z, z <= 4 ? ((x + z) % 2 ? 0x8a8f9a : 0x7a7f8a) : (x + z) % 2 ? BOIS : 0xa87a4c, 'plancher');
    // les murs : crème, avec des poutres sombres
    for (let x = 3; x <= 26; x++) for (let y = 2; y <= 9; y++) v(x, y, 16, x % 4 === 3 || y === 9 ? BOIS2 : 0xe6d8b8, 'murs');
    for (const x of [3, 26]) for (let z = 9; z <= 15; z++) for (let y = 2; y <= 9; y++) v(x, y, z, z === 9 || y === 9 ? BOIS2 : 0xe6d8b8, 'murs');
    // le comptoir et ses tabourets
    boite(6, 23, 2, 3, 5, 7, (x, y, z) => y === 3 ? 0xc99a62 : z === 5 ? (x % 3 ? 0x7a4a26 : BOIS2) : null, 'comptoir');
    for (const x of [7, 11, 19, 23]) { v(x, 2, 3, BOIS2, 'tabourets'); v(x, 3, 3, ROUGE_T, 'tabourets'); }
    // la cuisine : le fourneau, les marmites, l'étagère à bols
    boite(8, 13, 2, 3, 12, 14, (x, y) => y === 3 ? 0xb8bec6 : 0x8a9098, 'cuisine'); boite(9, 10, 4, 5, 12, 13, (x, y) => y === 5 ? 0xd9a05b : 0x3a3a40, 'cuisine'); v(12, 4, 13, 0x3a3a40, 'cuisine'); v(12, 5, 13, 0xf2efe6, 'cuisine');
    for (let x = 16; x <= 23; x++) v(x, 5, 15, BOIS2, 'cuisine'); for (const [x, c] of [[17, BLANC], [19, ROUGE_T], [21, 0x3f6fb0], [23, BLANC]]) v(x, 6, 15, c, 'cuisine');
    // le toit de tuiles, sur la cuisine seulement : le comptoir est à ciel ouvert
    boite(2, 27, 10, 10, 8, 17, (x, y, z) => (x + z) % 2 ? TUILE_T : TUILE_T2, 'toit'); boite(4, 25, 11, 11, 10, 15, (x, y, z) => (x + z) % 2 ? TUILE_T2 : TUILE_T, 'toit'); boite(6, 23, 12, 12, 12, 13, 0x1f2830, 'toit');
    // le noren : le rideau fendu, rouge à motifs blancs
    for (let x = 5; x <= 24; x++) for (let y = 7; y <= 9; y++) { if (x % 5 === 4 && y <= 8) continue; v(x, y, 8, y === 8 && x % 5 === 1 ? BLANC : ROUGE_T, 'noren'); }
    for (const x of [4, 25]) { v(x, 9, 7, 0x2a2224, 'lanternes'); for (let y = 6; y <= 8; y++) v(x, y, 7, y === 7 ? 0xf2a03a : 0xe04a3a, 'lanternes'); v(x, 5, 7, 0x2a2224, 'lanternes'); }
    // l'enseigne : des traits rouges sur fond blanc, pas de vraie écriture
    boite(11, 18, 11, 14, 9, 9, (x, y) => x === 11 || x === 18 || y === 11 || y === 14 ? BOIS2 : (x * 2 + y) % 3 === 0 ? ROUGE_T : BLANC, 'enseigne');
    const cellules = []; for (let x = 14; x <= 15; x++) for (let y = 4; y <= 5; y++) for (let z = 5; z <= 7; z++) cellules.push([x, y, z]);
    return {
      id: 'echoppe', chaine: 'tokyo', nom: 'Échoppe', titre: "C'était une échoppe de ramen !", sous: 'Quatre tabourets, un comptoir, une marmite qui fume. Ton bol attendait son client.',
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.55, azFin: 2.7,
      parts: ['plancher', 'comptoir', 'tabourets', 'cuisine', 'murs', 'noren', 'toit', 'lanternes', 'enseigne'], ...TERRE_TOKYO,
      fosse: (x, y, z) => (y >= 4 && x >= 12 && x <= 17 && z >= 3 && z <= 7) || (y >= 12 && x >= 10 && x <= 19 && z >= 1 && z <= 7),
      mini: { cellules, pied: [15, 4, 6.5], k: 8 },
      piocheR: 2.3, pinceauR: 2.2, jetR: 3.2,
      intro: ['Il était servi quelque part', "Ton bol est tout petit, au fond d'une fosse bien plus grande. Il est posé sur du bois. Où était-il servi ?"],
    };
  }

  /* ---------- 3. La ruelle : l'échoppe est une des boutiques ---------- */
  function ruelle() {
    const BX = 40, BY = 16, BZ = 28, { vox, v } = fabrique(), boite = boiteDans(v), coque = coqueDans(v);
    for (let x = 2; x <= 37; x++) for (let z = 2; z <= 25; z++) {
      if (z >= 11 && z <= 15) v(x, 1, z, z === 13 ? 0x4a4a52 : (x + z) % 2 ? 0x6a6a72 : 0x5e5e66, 'pavés'); else v(x, 1, z, (x * 3 + z) % 4 ? 0x9a9aa0 : 0x8e8e94, 'sols');
    }
    // les boutiques : [x0, x1, hauteur, mur, auvent]. Rang du nord (face au sud), rang du sud (face au nord)
    const NORD = [[2, 11, 5, 0xe6d8b8, 0x3f6fb0], [13, 20, 4, 0xc9b79a, ROUGE_T], [22, 29, 6, 0xd9cdb4, 0x2f7a43], [31, 37, 4, 0xe6d8b8, 0xf2a03a]];
    const SUD = [[2, 5, 4, 0xd9cdb4, 0x2f7a43], [18, 25, 5, 0xe6d8b8, 0x3f6fb0], [27, 37, 4, 0xc9b79a, ROUGE_T]];
    const boutique = (x0, x1, z0, z1, h, mur, auvent, zf, dz) => {
      coque(x0, x1, 2, 1 + h, z0, z1, (x, y, z) => { if (y === 1 + h) return null; if (z === zf && y <= 3 && x === x0 + 1) return BOIS2;                      // la porte
        if (z === zf && y === 3 && x > x0 + 2 && x < x1 && (x - x0) % 2 === 1) return VITRE; return y === 2 ? 0x8a7a66 : mur; }, 'boutiques');
      boite(x0, x1, 1 + h, 1 + h, z0, z1, (x, y, z) => (x + z) % 2 ? TUILE_T : TUILE_T2, 'toits'); boite(x0 + 1, x1 - 1, 2 + h, 2 + h, z0 + 2, z1 - 2, TUILE_T2, 'toits');
      for (let x = x0; x <= x1; x++) v(x, 4, zf + dz, (x - x0) % 2 ? auvent : BLANC, 'auvents');
    };
    for (const [x0, x1, h, mur, auv] of NORD) boutique(x0, x1, 4, 10, h, mur, auv, 10, 1);
    for (const [x0, x1, h, mur, auv] of SUD) boutique(x0, x1, 16, 22, h, mur, auv, 16, -1);
    // les guirlandes de lanternes, tendues en travers
    for (const x of [8, 21, 28, 34]) { for (let z = 11; z <= 15; z++) v(x, 7, z, 0x2a2224, 'lanternes'); for (const z of [12, 14]) { v(x, 6, z, 0xe04a3a, 'lanternes'); v(x, 5, z, 0xf2a03a, 'lanternes'); } for (const z of [11, 15]) for (let y = 5; y <= 6; y++) v(x, y, z, 0x2a2224, 'lanternes'); }
    // le distributeur de boissons
    for (let y = 2; y <= 4; y++) v(26, y, 15, y === 4 ? ROUGE_T : BLANC, 'distributeur'); v(26, 3, 14, 0x3f6fb0, 'distributeur'); v(26, 2, 14, BLANC, 'distributeur'); v(26, 4, 14, ROUGE_T, 'distributeur');
    // le vélo, le poteau et ses fils, le chat
    v(31, 2, 12, 0x2a2224, 'vélo'); v(33, 2, 12, 0x2a2224, 'vélo'); v(32, 2, 12, 0x3f6fb0, 'vélo'); v(32, 3, 12, 0x3f6fb0, 'vélo'); v(31, 3, 12, 0x2a2224, 'vélo'); v(33, 3, 12, 0x9aa0a8, 'vélo');
    for (let y = 2; y <= 10; y++) v(12, y, 11, 0x6a6a70, 'poteau'); for (let x = 10; x <= 14; x++) v(x, 9, 11, 0x4a4a52, 'poteau'); v(12, 8, 12, 0x8a9098, 'poteau'); v(12, 7, 12, 0x8a9098, 'poteau');
    v(18, 2, 14, BLANC, 'chat'); v(18, 3, 14, BLANC, 'chat'); v(18, 4, 14, 0xf2a03a, 'chat'); v(19, 2, 14, 0xf2a03a, 'chat'); v(17, 3, 14, ROUGE_T, 'chat');
    // le cerisier, au bout de la ruelle
    for (let y = 2; y <= 4; y++) v(36, y, 13, 0x6b4a2b, 'cerisier');
    for (let dx = -2; dx <= 1; dx++) for (let dz = -2; dz <= 2; dz++) for (let y = 5; y <= 7; y++) { if (dx * dx + dz * dz + (y - 6) * (y - 6) * 2 > 5.5) continue; v(36 + dx, y, 13 + dz, (dx + dz + y) % 2 ? ROSE : ROSE2, 'cerisier'); }
    const cellules = []; for (let x = 7; x <= 16; x++) for (let y = 2; y <= 6; y++) for (let z = 16; z <= 22; z++) cellules.push([x, y, z]);
    return {
      id: 'ruelle', chaine: 'tokyo', nom: 'Ruelle', titre: "C'était une ruelle aux lanternes !", sous: 'Des boutiques serrées, des guirlandes en travers, un chat qui attend. Ton échoppe y avait sa place.',
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.8,
      parts: ['pavés', 'sols', 'boutiques', 'toits', 'auvents', 'lanternes', 'distributeur', 'vélo', 'poteau', 'chat', 'cerisier'], ...TERRE_TOKYO,
      fosse: (x, y, z) => y >= 2 && x >= 6 && x <= 17 && z >= 15 && z <= 23,
      mini: { cellules, pied: [12, 2, 19.33], k: 3 },
      piocheR: 2.6, pinceauR: 2.6, jetR: 3.6,
      intro: ['Elle avait des voisines', "Ton échoppe est devenue une maquette au fond de la fosse. Qu'y avait-il autour ?"],
    };
  }

  /* ---------- 4. Le quartier : le grand carrefour, la tour, le sanctuaire, le train ---------- */
  function quartier() {
    const BX = 56, BY = 20, BZ = 46, { vox, v } = fabrique(), boite = boiteDans(v), coque = coqueDans(v);
    const h = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
    const MINI = { x0: 6, x1: 19, z0: 6, z1: 15 };
    for (let x = 2; x <= 53; x++) for (let z = 2; z <= 43; z++) {
      const rx = z >= 20 && z <= 23, rz = x >= 26 && x <= 29;
      if (rx && rz) { v(x, 1, z, (x + z) % 2 ? BLANC : 0x3a3a40, 'passages'); continue; }                                  // le carrefour, traversé en diagonale
      if ((rx && (x === 24 || x === 25 || x === 30 || x === 31)) || (rz && (z === 18 || z === 19 || z === 24 || z === 25))) { v(x, 1, z, (rx ? z : x) % 2 ? BLANC : 0x3a3a40, 'passages'); continue; }
      if (rx || rz) { v(x, 1, z, (rx ? (z === 21 && x % 3 === 0) : (x === 27 && z % 3 === 0)) ? 0xf2c744 : h(x, z) > 0.5 ? 0x3a3a40 : 0x424248, 'routes'); continue; }
      if (x <= 25 && z >= 24 && z <= 39) { v(x, 1, z, x >= 14 && x <= 18 && z >= 34 && z <= 37 ? 0x4fa3d1 : x >= 12 && z >= 31 && z <= 33 ? 0xcfc4a8 : (x * 7 + z * 3) % 5 ? 0x6fae4f : 0x7fbb5a, 'parc'); continue; }
      v(x, 1, z, (x + z) % 2 ? 0xb8b8be : 0xacacb2, 'trottoirs');
    }
    // les immeubles : [x0, x1, z0, z1, hauteur, couleur]
    const tour = (x0, x1, z0, z1, hh, c) => coque(x0, x1, 2, 1 + hh, z0, z1, (x, y, z) => y === 1 + hh ? 0x6a6a72 : y % 2 === 1 && (x + z) % 2 === 0 ? VITRE : c, 'immeubles');
    for (const b of [[31, 36, 3, 9, 12, 0x5a6a80], [38, 43, 3, 8, 9, 0x8a8f9a], [45, 52, 3, 10, 14, 0x3f4a5c], [31, 37, 12, 18, 8, 0x9aa3ad], [39, 44, 11, 18, 11, 0x4a5568], [46, 52, 13, 18, 7, 0x6a7480],
      [31, 35, 25, 30, 6, 0x8a8f9a], [47, 52, 25, 31, 9, 0x5a6a80], [46, 52, 33, 38, 7, 0x9aa3ad], [31, 36, 34, 38, 5, 0x6a7480],
      [21, 24, 3, 10, 6, 0x9aa3ad], [21, 24, 12, 17, 4, 0x8a8f9a], [3, 10, 17, 18, 3, 0xc9b79a], [2, 4, 6, 14, 4, 0xd9cdb4], [6, 19, 2, 4, 3, 0xc9b79a]]) tour(...b);
    // les néons : des enseignes en hauteur, des traits de couleur
    for (const [x, y0, y1, z, c] of [[37, 4, 9, 19, 0xff4fa0], [30, 3, 7, 15, 0x3fd0ff], [45, 5, 10, 19, 0xffe14a], [30, 3, 6, 27, 0x7dff6a], [46, 3, 7, 32, 0xff4fa0], [25, 3, 6, 14, 0xffe14a]]) for (let y = y0; y <= y1; y++) v(x, y, z, c, 'néons');
    boite(32, 35, 14, 15, 9, 9, (x, y) => (x + y) % 2 ? 0x3fd0ff : 0xff4fa0, 'néons'); boite(46, 51, 16, 17, 10, 10, (x, y) => (x + y) % 2 ? 0xffe14a : 0xff7a1a, 'néons');
    // la tour rouge et blanche, en treillis
    for (let y = 2; y <= 15; y++) { const w = Math.max(0, Math.round(4.4 - (y - 2) * 0.32)), c = Math.floor((y - 2) / 3) % 2 ? BLANC : 0xe0452a;
      for (let dx = -w; dx <= w; dx++) for (let dz = -w; dz <= w; dz++) { const bord = Math.abs(dx) === w || Math.abs(dz) === w; if (!bord) continue; const coin = Math.abs(dx) === w && Math.abs(dz) === w;
        if (y === 9 || coin || (dx + dz + y) % 2 === 0) v(41 + dx, y, 32 + dz, y === 9 ? BLANC : c, 'tour'); } }
    boite(39, 43, 9, 9, 30, 34, BLANC, 'tour'); v(41, 16, 32, 0xe0452a, 'tour'); v(41, 17, 32, BLANC, 'tour'); v(41, 18, 32, 0xff4fa0, 'tour');
    // le sanctuaire et son portail rouge
    for (const z of [30, 34]) for (let y = 2; y <= 6; y++) v(22, y, z, 0xd8362a, 'sanctuaire'); for (let z = 29; z <= 35; z++) { v(22, 6, z, 0xd8362a, 'sanctuaire'); v(22, 7, z, 0x2a2224, 'sanctuaire'); } for (let z = 31; z <= 33; z++) v(22, 5, z, 0xd8362a, 'sanctuaire');
    boite(5, 11, 2, 2, 29, 35, 0x9a9aa0, 'sanctuaire'); coque(6, 10, 3, 5, 30, 34, (x, y, z) => y === 5 ? null : x === 10 && z === 32 ? BOIS2 : (x + z) % 2 ? BLANC : 0xd8362a, 'sanctuaire');
    boite(5, 11, 5, 5, 29, 35, 0x2f4a48, 'sanctuaire'); boite(6, 10, 6, 6, 30, 34, 0x3a5a56, 'sanctuaire'); boite(7, 9, 7, 7, 32, 32, 0xd9a441, 'sanctuaire');
    // les cerisiers du parc
    for (const [x, z] of [[4, 26], [10, 26], [17, 27], [4, 37], [11, 38], [21, 38], [16, 30]]) { v(x, 2, z, 0x6b4a2b, 'cerisiers'); v(x, 3, z, 0x6b4a2b, 'cerisiers');
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 4; y <= 5; y++) { if (y === 5 && dx && dz) continue; v(x + dx, y, z + dz, (dx + dz + y) % 2 ? ROSE : ROSE2, 'cerisiers'); } }
    // la voie ferrée sur son viaduc, et le train
    for (let x = 2; x <= 53; x++) { for (const z of [41, 42]) v(x, 4, z, x % 2 ? 0x8a8a92 : 0x7a7a82, 'voie ferrée'); if (x % 6 === 2) for (const z of [41, 42]) for (let y = 2; y <= 3; y++) v(x, y, z, 0x9a9aa0, 'voie ferrée'); }
    for (let x = 14; x <= 31; x++) for (const z of [41, 42]) { v(x, 5, z, x === 22 || x === 23 ? 0x4a4a52 : 0x7ac043, 'train'); v(x, 6, z, x === 22 || x === 23 ? 0x4a4a52 : x % 3 === 0 ? BLANC : 0x2a3640, 'train'); v(x, 7, z, 0xe6e6ea, 'train'); }
    const cellules = []; for (let x = MINI.x0; x <= MINI.x1; x++) for (let y = 2; y <= 5; y++) for (let z = MINI.z0; z <= MINI.z1; z++) cellules.push([x, y, z]);
    return {
      id: 'quartier', chaine: 'tokyo', nom: 'Quartier', titre: "C'était un quartier de Tokyo !", sous: 'Le grand carrefour, la tour rouge et blanche, le sanctuaire sous les cerisiers, le train qui passe. Ta ruelle se cachait entre les immeubles.',
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.8,
      parts: ['routes', 'passages', 'trottoirs', 'immeubles', 'néons', 'tour', 'sanctuaire', 'parc', 'cerisiers', 'voie ferrée', 'train'], ...TERRE_TOKYO,
      fosse: (x, y, z) => y >= 2 && x >= MINI.x0 - 1 && x <= MINI.x1 + 1 && z >= MINI.z0 - 1 && z <= MINI.z1 + 1,
      mini: { cellules, pied: [13, 2, 11], k: 3 },
      piocheR: 3.1, pinceauR: 3.0, jetR: 4.4,
      intro: ['Elle se cachait quelque part', "Ta ruelle n'est plus qu'un trait au fond de la fosse. Qu'y avait-il autour ?"],
      fin: { plonge: 'Le quartier, la ruelle, l\'échoppe…', depart: 'Tout est parti de ce bol de ramen.', vivant: 'Tokyo, quand les néons s\'allument.' },
      vivant: { ciel: 'nuit', lumieres: (e) => e.part === 'immeubles' && e.c === VITRE, neons: (e) => e.part === 'néons' || (e.part === 'tour' && e.y >= 16) || (e.part === 'sanctuaire' && e.c === 0xd9a441),
        glisse: { filtre: (e) => e.part === 'train', course: 11, vitesse: 0.45 } },
    };
  }

  /* =====================================================================
     La chaîne de l'Atlantide, d'après Platon (Timée, Critias) : des anneaux de terre et de mer,
     le temple de Poséidon au centre, des murs d'orichalque. Personne ne l'a vue : tout vient du texte.
     Elle se creuse dans du SABLE FIN, qui coule quand on creuse dessous (`coule`), et la mer la reprend à la fin.
     ===================================================================== */
  const ORI = 0xd9813a, ORI2 = 0xc46a2a, OR_A = 0xf2c744, ARGENT = 0xc9d2de, ARGENT2 = 0xdfe6ee, EAU1 = 0x3f8fc0, EAU2 = 0x4fa3d1, P_BLANC = 0xeeeae0, P_NOIR = 0x3a3a40, P_ROUGE = 0xb5503a;
  const TERRE_ATL = { couches: (yy) => yy <= 3 ? 'vase' : 'sablefin', caillou: 'corail', dessus: 'sablefin', coule: true };
  // Platon : les pierres de l'île étaient blanches, noires et rouges
  const pave = (x, z) => [P_BLANC, P_BLANC, P_ROUGE, P_BLANC, P_NOIR][(x * 3 + z * 7 + 100) % 5];

  /* ---------- 1. Le trident : ses trois pointes dépassent ---------- */
  function trident() {
    const BX = 11, BY = 20, BZ = 9, cx = 5, cz = 4, { vox, v } = fabrique(), boite = boiteDans(v);
    boite(cx - 1, cx + 1, 1, 1, cz - 1, cz + 1, P_NOIR, 'socle'); boite(cx - 1, cx + 1, 2, 2, cz, cz, P_BLANC, 'socle'); v(cx, 2, cz - 1, P_BLANC, 'socle'); v(cx, 2, cz + 1, P_BLANC, 'socle');
    for (let y = 3; y <= 12; y++) v(cx, y, cz, y % 2 ? ORI : ORI2, 'hampe');
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { v(cx + dx, 8, cz + dz, OR_A, 'bague'); v(cx + dx, 4, cz + dz, OR_A, 'bague'); }
    for (let x = cx - 3; x <= cx + 3; x++) v(x, 13, cz, x === cx ? OR_A : ORI, 'traverse'); v(cx - 3, 12, cz, ORI2, 'traverse'); v(cx + 3, 12, cz, ORI2, 'traverse');
    for (const dx of [-3, 0, 3]) { const haut = dx ? 17 : 18; for (let y = 14; y <= haut; y++) v(cx + dx, y, cz, y === haut ? OR_A : y === haut - 1 ? 0xe9a04a : ORI, 'pointes'); }
    v(cx - 2, 16, cz, ORI2, 'pointes'); v(cx + 2, 16, cz, ORI2, 'pointes'); v(cx - 1, 17, cz, ORI2, 'pointes'); v(cx + 1, 17, cz, ORI2, 'pointes');      // les barbes
    return {
      id: 'trident', chaine: 'atlantide', nom: 'Trident', titre: "C'était un trident d'orichalque !", sous: "L'orichalque : un métal rouge doré dont parle Platon, « le plus précieux après l'or ». Le trident est l'arme de Poséidon.",
      BX, BY, BZ, vox, base: [cx + 0.5, 1, cz + 0.5], leve: 3, elFin: 0.4, azFin: 0.35,
      parts: ['pointes', 'traverse', 'bague', 'hampe', 'socle'], ...TERRE_ATL,
      fosse: (x, y, z) => (y >= 16 && Math.abs(x - cx) <= 4 && Math.abs(z - cz) <= 1) || (y >= 18 && Math.abs(x - cx) <= 5 && Math.abs(z - cz) <= 2),
      piocheR: 1.9, pinceauR: 1.5, jetR: 2.2,
      intro: ['Du sable, et trois pointes', "Trois pointes de métal rouge sortent du sable. Attention : ce sable est fin, il coule dès qu'on creuse dessous. Qu'est-ce que c'est ?"],
    };
  }

  /* ---------- 2. Le temple de Poséidon : le trident se dressait devant ---------- */
  function temple() {
    const BX = 34, BY = 18, BZ = 26, { vox, v } = fabrique(), boite = boiteDans(v), coque = coqueDans(v);
    for (let x = 2; x <= 31; x++) for (let z = 2; z <= 23; z++) v(x, 1, z, pave(x, z), 'parvis');
    boite(6, 27, 2, 2, 6, 21, (x, y, z) => (x + z) % 2 ? P_BLANC : 0xe0dccf, 'marches'); boite(7, 26, 3, 3, 7, 20, (x, y, z) => (x + z) % 2 ? 0xe0dccf : P_BLANC, 'marches');
    // les colonnes d'argent, chapiteau d'or
    const col = (x, z) => { for (let y = 4; y <= 9; y++) v(x, y, z, y === 9 ? OR_A : y === 4 ? ARGENT : ARGENT2, 'colonnes'); };
    for (const x of [8, 11, 14, 19, 22, 25]) { col(x, 8); col(x, 19); } for (const z of [11, 14, 17]) { col(8, z); col(25, z); }
    // la salle : des murs d'argent cerclés d'orichalque, une porte sombre
    coque(11, 22, 4, 9, 11, 18, (x, y, z) => y === 9 ? ARGENT : z === 11 && (x === 16 || x === 17) && y <= 7 ? 0x2a2630 : y === 4 || y === 8 ? ORI : (x + y + z) % 7 === 0 ? ARGENT2 : ARGENT, 'murs');
    boite(7, 26, 10, 10, 7, 20, (x, y, z) => x === 7 || x === 26 || z === 7 || z === 20 ? ORI : 0xb8c4d2, 'fronton'); for (let x = 14; x <= 19; x++) v(x, 11, 7, x === 16 || x === 17 ? OR_A : ORI, 'fronton'); v(16, 12, 7, OR_A, 'fronton'); v(17, 12, 7, OR_A, 'fronton');
    boite(8, 25, 11, 11, 8, 19, (x, y, z) => (x + z) % 2 ? 0x7fb8c8 : 0x6aa3b5, 'toit'); boite(9, 24, 12, 12, 10, 17, (x, y, z) => (x + z) % 2 ? 0x6aa3b5 : 0x7fb8c8, 'toit'); boite(10, 23, 13, 13, 13, 14, 0x5a93a5, 'toit');
    // les acrotères : les pointes d'or aux angles et au faîte
    for (const [x, z] of [[7, 7], [26, 7], [7, 20], [26, 20]]) { v(x, 11, z, OR_A, 'acrotères'); v(x, 12, z, OR_A, 'acrotères'); } for (const x of [10, 23]) { v(x, 14, 13, OR_A, 'acrotères'); v(x, 14, 14, OR_A, 'acrotères'); v(x, 15, 13, OR_A, 'acrotères'); }
    // les deux sources : l'une chaude, l'autre froide
    for (const x0 of [2, 27]) { boite(x0, x0 + 3, 2, 2, 2, 5, (x, y, z) => x === x0 || x === x0 + 3 || z === 2 || z === 5 ? P_BLANC : x0 === 2 ? 0x7fd0e8 : EAU2, 'sources'); v(x0 + 1, 3, 3, x0 === 2 ? 0xe8f6fb : EAU2, 'sources'); }
    const cellules = []; for (let x = 16; x <= 17; x++) for (let y = 2; y <= 4; y++) for (let z = 3; z <= 4; z++) cellules.push([x, y, z]);
    return {
      id: 'temple', chaine: 'atlantide', nom: 'Temple', titre: "C'était le temple de Poséidon !", sous: "Platon le décrit couvert d'argent, avec des pointes d'or au sommet. Ton trident se dressait devant ses marches.",
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.55, azFin: 2.7,
      parts: ['parvis', 'sources', 'marches', 'colonnes', 'murs', 'fronton', 'toit', 'acrotères'], ...TERRE_ATL,
      fosse: (x, y, z) => (y >= 2 && x >= 14 && x <= 19 && z >= 2 && z <= 5) || (y >= 12 && x >= 12 && x <= 21 && z >= 1 && z <= 6),
      mini: { cellules, pied: [17, 2, 4], k: 6 },
      piocheR: 2.3, pinceauR: 2.2, jetR: 3.2,
      intro: ['Il gardait une entrée', "Ton trident est tout petit, au fond d'une fosse bien plus grande. Devant quoi se dressait-il ?"],
    };
  }

  /* ---------- 3. L'île centrale : le temple en son milieu, la mer tout autour ---------- */
  function ile() {
    const BX = 44, BY = 15, BZ = 44, C = 22, { vox, v } = fabrique(), boite = boiteDans(v), coque = coqueDans(v);
    const d = (x, z) => Math.hypot(x - C + 0.5, z - C + 0.5), pont = (x, z) => (x === 21 || x === 22) && z >= 36;
    for (let x = 2; x <= 41; x++) for (let z = 2; z <= 41; z++) { const r = d(x, z);
      if (r <= 16) v(x, 1, z, pave(x, z), 'île'); else if (r <= 20.5) v(x, 1, z, (x * 5 + z * 3) % 4 ? EAU1 : EAU2, 'eau'); else v(x, 1, z, (x + z) % 2 ? 0xcfc4a8 : 0xc3b89a, 'quais'); }
    // la muraille d'orichalque, percée d'une porte au sud
    for (let x = 4; x <= 39; x++) for (let z = 4; z <= 39; z++) { const r = d(x, z); if (Math.abs(r - 15.4) > 0.6 || pont(x, z)) continue; for (let y = 2; y <= 4; y++) v(x, y, z, y === 4 ? ORI2 : (x + y + z) % 5 ? ORI : 0xe9a04a, 'muraille'); if ((x + z) % 2) v(x, 5, z, OR_A, 'muraille'); }
    for (const x of [19, 20, 23, 24]) for (let y = 2; y <= 7; y++) for (const z of [36, 37]) v(x, y, z, y === 7 ? OR_A : ORI, 'muraille');
    // le pont de pierre vers l'anneau suivant
    for (let z = 36; z <= 41; z++) for (const x of [21, 22]) v(x, 2, z, (x + z) % 2 ? P_BLANC : 0xe0dccf, 'pont'); for (let z = 38; z <= 41; z++) for (const x of [20, 23]) { v(x, 2, z, P_ROUGE, 'pont'); v(x, 3, z, P_BLANC, 'pont'); }
    // le palais des rois, au nord
    coque(14, 29, 2, 6, 8, 13, (x, y, z) => y === 6 ? P_ROUGE : z === 13 && y <= 4 && (x === 21 || x === 22) ? 0x2a2630 : y === 4 && x % 3 === 0 ? 0x3a4a5c : y === 2 ? P_NOIR : P_BLANC, 'palais');
    for (const x0 of [13, 28]) { boite(x0, x0 + 2, 2, 8, 7, 9, (x, y) => y === 8 ? ORI : P_BLANC, 'palais'); v(x0 + 1, 9, 8, OR_A, 'palais'); v(x0 + 1, 10, 8, OR_A, 'palais'); }
    boite(16, 27, 7, 7, 9, 12, (x, y, z) => (x + z) % 2 ? ORI : ORI2, 'palais');
    // les jardins, de part et d'autre du temple
    for (const x0 of [8, 30]) for (let x = x0; x <= x0 + 5; x++) for (let z = 17; z <= 26; z++) { const bord = x === x0 || x === x0 + 5 || z === 17 || z === 26;
      if (bord && z !== 21 && z !== 22) v(x, 2, z, 0x3f7d3a, 'jardins'); else if (!bord && (x + z) % 4 === 0) v(x, 2, z, [0xd8433a, 0xf2c744, 0xe98bb0][(x + z) % 3], 'jardins'); }
    for (const [x, z] of [[10, 19], [11, 24], [32, 19], [33, 24]]) { v(x, 2, z, 0x6b4a2b, 'jardins'); v(x, 3, z, 0x6b4a2b, 'jardins'); for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) v(x + dx, 4, z + dz, (dx + dz) % 2 ? 0x2f6b3a : 0x3f7d3a, 'jardins'); v(x, 5, z, 0x2f6b3a, 'jardins'); }
    // les fontaines, au sud
    for (const x0 of [15, 26]) { boite(x0, x0 + 2, 2, 2, 30, 32, (x, y, z) => x === x0 + 1 && z === 31 ? EAU2 : P_BLANC, 'fontaines'); v(x0 + 1, 3, 31, EAU2, 'fontaines'); v(x0 + 1, 4, 31, 0xe8f6fb, 'fontaines'); }
    const cellules = []; for (let x = 16; x <= 27; x++) for (let y = 2; y <= 6; y++) for (let z = 17; z <= 26; z++) cellules.push([x, y, z]);
    return {
      id: 'ile', chaine: 'atlantide', nom: 'Île', titre: "C'était l'île centrale !", sous: "Le temple au milieu, le palais des rois, des jardins, et un mur d'orichalque « aux reflets de feu ». Un seul pont pour en sortir.",
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.85,
      parts: ['eau', 'quais', 'île', 'muraille', 'pont', 'palais', 'jardins', 'fontaines'], ...TERRE_ATL,
      fosse: (x, y, z) => y >= 2 && x >= 15 && x <= 28 && z >= 16 && z <= 27,
      mini: { cellules, pied: [22, 2, 22], k: 3 },
      piocheR: 2.8, pinceauR: 2.6, jetR: 3.8,
      intro: ['Il régnait sur quelque chose', "Ton temple est devenu une maquette au fond de la fosse. Sur quoi veillait-il ?"],
    };
  }

  /* ---------- 4. La cité en anneaux : terre, mer, terre, mer, et le grand canal ---------- */
  function atlantide() {
    const BX = 60, BY = 14, BZ = 60, C = 30, { vox, v } = fabrique(), boite = boiteDans(v);
    const h = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
    const d = (x, z) => Math.hypot(x - C + 0.5, z - C + 0.5);
    const MINI = { a: 22, b: 37 }, dansMini = (x, z) => x >= MINI.a && x <= MINI.b && z >= MINI.a && z <= MINI.b;
    const canal = (x, z) => (x === 29 || x === 30) && z > 37, axe = (x, z) => ((x === 29 || x === 30) && z < 22) || ((z === 29 || z === 30) && (x < 22 || x > 37));
    const zone = (r) => r <= 11.5 ? 'terre' : r <= 14.5 ? 'eau' : r <= 20 ? 'terre' : r <= 23.5 ? 'eau' : r <= 28 ? 'terre' : 'dehors';
    for (let x = 2; x <= 57; x++) for (let z = 2; z <= 57; z++) { const r = d(x, z), zo = zone(r);
      if (zo === 'dehors') { if (z >= 53 || canal(x, z)) v(x, 1, z, h(x, z) > 0.55 ? EAU2 : EAU1, 'mer'); else v(x, 1, z, [0x8fbf5a, 0xb9c95a, 0xd9c36a, 0x6fae4f][Math.floor(h(Math.floor(x / 4), Math.floor(z / 3)) * 4)], 'plaine'); continue; }
      if (zo === 'eau' || canal(x, z)) { v(x, 1, z, (x * 5 + z * 3) % 4 ? EAU1 : EAU2, 'canaux'); continue; }
      v(x, 1, z, axe(x, z) ? P_BLANC : pave(x, z), 'anneaux'); }
    // les ponts : sur les trois axes, par-dessus les anneaux de mer
    for (let x = 2; x <= 57; x++) for (let z = 2; z <= 57; z++) if (axe(x, z) && zone(d(x, z)) === 'eau') { v(x, 2, z, (x + z) % 2 ? P_BLANC : 0xe0dccf, 'ponts'); }
    // les murailles : orichalque près du centre, étain ensuite, bronze dehors (Critias)
    for (const [rm, c1, c2] of [[11, ORI, 0xe9a04a], [19.5, ARGENT, ARGENT2], [27.5, 0xb87333, 0x9a5f28]]) for (let x = 2; x <= 57; x++) for (let z = 2; z <= 57; z++) {
      if (Math.abs(d(x, z) - rm) > 0.6 || dansMini(x, z) || axe(x, z) || canal(x, z)) continue; v(x, 2, z, (x + z) % 3 ? c1 : c2, 'murailles'); v(x, 3, z, c1, 'murailles'); if ((x + z) % 2) v(x, 4, z, c2, 'murailles'); }
    // les maisons, sur les deux anneaux de terre : murs blancs, toits rouges
    for (let x = 4; x <= 54; x += 2) for (let z = 4; z <= 54; z += 2) { const r = d(x + 0.5, z + 0.5); if (!((r > 15.6 && r < 18.4) || (r > 24.6 && r < 26.4)) || h(x, z) > 0.62) continue;
      if ([[0, 0], [1, 0], [0, 1], [1, 1]].some(([a, b]) => axe(x + a, z + b) || canal(x + a, z + b) || vox.has(cle(x + a, 2, z + b)))) continue; const haut = h(x + 3, z) > 0.6 ? 2 : 1;
      for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { for (let y = 2; y < 2 + haut; y++) v(x + a, y, z + b, (a + b + y) % 3 ? P_BLANC : 0xe0dccf, 'maisons'); v(x + a, 2 + haut, z + b, (a + b) % 2 ? 0xc65b37 : 0xad4a2b, 'maisons'); } }
    // les navires : dans le grand canal, sur les anneaux de mer, au large
    for (const [x, z, long] of [[29, 46, 0], [40, 33, 1], [17, 22, 1], [12, 55, 1], [44, 55, 1], [30, 9, 1]]) { for (let k = 0; k < 3; k++) v(long ? x + k : x, 2, long ? z : z + k, 0x6e4527, 'navires'); v(long ? x + 1 : x, 3, long ? z : z + 1, P_BLANC, 'navires'); v(long ? x + 1 : x, 4, long ? z : z + 1, k4(x, z), 'navires'); }
    function k4(x, z) { return (x + z) % 2 ? P_BLANC : P_ROUGE; }
    const cellules = []; for (let x = MINI.a; x <= MINI.b; x++) for (let y = 2; y <= 5; y++) for (let z = MINI.a; z <= MINI.b; z++) cellules.push([x, y, z]);
    return {
      id: 'atlantide', chaine: 'atlantide', nom: 'Atlantide', titre: "C'était l'Atlantide !", sous: "Des anneaux de terre et de mer, trois murailles de métal, un grand canal jusqu'au large. Platon raconte qu'elle fut la plus puissante des cités.",
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.9,
      parts: ['mer', 'plaine', 'canaux', 'anneaux', 'ponts', 'murailles', 'maisons', 'navires'], ...TERRE_ATL,
      fosse: (x, y, z) => y >= 2 && x >= MINI.a - 1 && x <= MINI.b + 1 && z >= MINI.a - 1 && z <= MINI.b + 1,
      mini: { cellules, pied: [30, 2, 30], k: 3 },
      piocheR: 3.2, pinceauR: 3.0, jetR: 4.6,
      intro: ['Elle était le cœur de quelque chose', "Ton île n'est plus qu'un rond au fond de la fosse. Qu'y avait-il autour ?"],
      fin: { plonge: 'La cité, l\'île, le temple…', depart: 'Tout est parti de ce trident.', vivant: 'En un jour et une nuit, la mer reprit l\'Atlantide.' },
      vivant: { ciel: 'mer', teinte: 0x7ac8f0, englouti: { duree: 16, haut: 9 }, flotte: (e) => e.part === 'navires', bulles: (e) => e.part === 'maisons' && e.y >= 3 && (e.x * 7 + e.z * 13) % 9 === 0,
        lumieres: (e) => e.part === 'maisons' && e.y === 2 },
    };
  }

  /* =====================================================================
     La chaîne du labyrinthe : la pelote de fil d'Ariane, un carrefour de couloirs, le labyrinthe
     entier, puis le palais de Cnossos, en Crète. Le fil rouge traverse les fouilles.
     Aucun personnage : ni Thésée, ni Minotaure ; un taureau de pierre et des cornes sur les toits.
     ===================================================================== */
  const M_ROUGE = 0xb5352b, M_NOIR = 0x2a2224, M_PIERRE = 0xd9c9a8, M_PIERRE2 = 0xc9b998, M_BASE = 0xb5a488, FIL = 0xd8262a, M_CREME = 0xe9dcc0;
  const TERRE_CRETE = { couches: (yy) => yy <= 4 ? 'argile' : yy <= 9 ? 'terre' : 'sable', caillou: 'roche' };

  /* ---------- 1. La pelote de fil : le fuseau dépasse ---------- */
  function pelote() {
    const BX = 13, BY = 13, BZ = 13, c = 6, { vox, v } = fabrique();
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (dx * dx + dz * dz <= 6) v(c + dx, 1, c + dz, (dx + dz) % 2 ? 0x9a9488 : 0x8a8478, 'socle');
    for (let y = 2; y <= 9; y++) for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) { if (dx * dx + (y - 5.5) * (y - 5.5) + dz * dz > 13.2) continue;
      v(c + dx, y, c + dz, [FIL, 0xe8564a, 0xa52a1c, 0xc0392b][((dx + y + (dz > 0 ? dz : -dz)) % 4 + 4) % 4], 'pelote'); }      // des bandes en biais : le fil enroulé
    // le fuseau de bois la traverse de part en part (un bâton planté dessus en faisait une pomme)
    for (const x of [1, 2, 10, 11]) v(x, 6, c, x === 1 || x === 11 ? 0xb98a5a : 0x8a5a36, 'fuseau');
    // la boucle de fil qui dépasse au sommet, et le brin qui traîne par terre
    for (const [x, y] of [[5, 10], [5, 11], [6, 11], [7, 11], [7, 10]]) v(x, y, c, FIL, 'boucle');
    for (const [x, y, z] of [[6, 4, 10], [6, 3, 10], [6, 2, 11], [6, 1, 11], [7, 1, 11], [8, 1, 11], [9, 1, 10], [10, 1, 9]]) v(x, y, z, FIL, 'brin');
    return {
      id: 'pelote', chaine: 'labyrinthe', nom: 'Pelote', titre: "C'était une pelote de fil rouge !", sous: "Dans la légende, Ariane la donne à Thésée : il la déroule derrière lui pour retrouver la sortie.",
      BX, BY, BZ, vox, base: [c + 0.5, 1, c + 0.5], leve: 3, elFin: 0.5, recul: 1.15,
      parts: ['boucle', 'fuseau', 'pelote', 'brin', 'socle'], ...TERRE_CRETE,
      fosse: (x, y, z) => { const d = (x - c) ** 2 + (z - c) ** 2; return (y >= 10 && d <= 6) || (y >= 12 && d <= 14); },
      piocheR: 1.9, pinceauR: 1.5, jetR: 2.6,
      intro: ['Une boucle rouge dans la terre', "Une petite boucle de fil rouge dépasse au fond de la fosse. Elle tient à quelque chose de rond. Qu'est-ce que c'est ?"],
    };
  }

  /* ---------- 2. Le carrefour : quatre couloirs, et le fil par terre ---------- */
  function carrefour() {
    const BX = 30, BY = 13, BZ = 30, { vox, v } = fabrique(), boite = boiteDans(v), coque = coqueDans(v);
    for (let x = 2; x <= 27; x++) for (let z = 2; z <= 27; z++) v(x, 1, z, z === 15 && x <= 12 ? FIL : (x + z) % 2 ? 0xcfc4a8 : 0xbdb193, z === 15 && x <= 12 ? 'fil' : 'dalles');
    // les quatre massifs de pierre, entre lesquels passent les couloirs
    for (const [x0, z0] of [[2, 2], [18, 2], [2, 18], [18, 18]]) coque(x0, x0 + 9, 2, 6, z0, z0 + 9, (x, y, z) => y === 2 ? M_BASE : y === 5 ? M_ROUGE : y === 6 ? M_PIERRE2 : (x * 3 + y + z * 5) % 7 === 0 ? M_PIERRE2 : M_PIERRE, 'murs');
    // les colonnes crétoises : rouges, plus larges en haut, chapiteau noir
    for (const [x, z] of [[12, 12], [17, 12], [12, 17], [17, 17]]) { for (let y = 2; y <= 6; y++) v(x, y, z, y === 2 || y === 6 ? M_NOIR : M_ROUGE, 'colonnes'); }
    for (const [x, z] of [[12, 5], [17, 24], [5, 17], [24, 12]]) { v(x, 4, z, 0x6e4527, 'torches'); v(x, 5, z, 0xff7a1a, 'torches'); v(x, 6, z, 0xffc23a, 'torches'); }
    // la double hache, au fond du couloir du nord
    boite(14, 15, 2, 2, 2, 3, 0x9a9488, 'labrys'); for (let y = 3; y <= 8; y++) v(15, y, 3, 0x8a5a36, 'labrys');
    for (const [dx, y] of [[-2, 5], [-2, 6], [-2, 7], [-1, 6], [1, 6], [2, 5], [2, 6], [2, 7], [-3, 5], [-3, 7], [3, 5], [3, 7]]) v(15 + dx, y, 3, Math.abs(dx) === 3 ? 0xe0b030 : 0xf2c744, 'labrys');
    for (const [x, z] of [[24, 14], [24, 16], [22, 16]]) { v(x, 2, z, 0x9a5a36, 'jarres'); v(x, 3, z, 0x7a4326, 'jarres'); v(x, 4, z, 0xb06a40, 'jarres'); }
    const cellules = []; for (let x = 13; x <= 16; x++) for (let y = 2; y <= 3; y++) for (let z = 13; z <= 16; z++) cellules.push([x, y, z]);
    return {
      id: 'carrefour', chaine: 'labyrinthe', nom: 'Carrefour', titre: "C'était un carrefour de couloirs !", sous: 'Quatre chemins, des torches, une double hache dorée. Et le fil rouge, par terre, qui dit par où revenir.',
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.75,
      parts: ['dalles', 'fil', 'murs', 'colonnes', 'torches', 'labrys', 'jarres'], ...TERRE_CRETE,
      fosse: (x, y, z) => y >= 2 && x >= 12 && x <= 17 && z >= 12 && z <= 17,
      mini: { cellules, pied: [15, 2, 15], k: 6 },
      piocheR: 2.3, pinceauR: 2.2, jetR: 3.2,
      intro: ['Elle se déroulait quelque part', "Ta pelote est toute petite, au fond d'une fosse bien plus grande. Elle est posée sur des dalles. Où menait son fil ?"],
    };
  }

  /* ---------- 3. Le labyrinthe : le fil rouge va de l'entrée au carrefour ---------- */
  function labyrinthe() {
    const BX = 44, BY = 11, BZ = 44, O = 2, N = 13, { vox, v } = fabrique();
    // un labyrinthe parfait, tiré toujours pareil. Les 9 cases du milieu sont le carrefour (une seule « case » à quatre portes).
    const bloc = (i, j) => i >= 5 && i <= 7 && j >= 5 && j <= 7, id = (i, j) => bloc(i, j) ? 'B' : i + ',' + j;
    let g = 20261110; const alea = () => { g = (Math.imul(g, 1664525) + 1013904223) >>> 0; return g / 4294967296; };
    const voisins = (i, j) => { if (bloc(i, j)) return [[6, 4, 6, 5], [6, 8, 6, 7], [4, 6, 5, 6], [8, 6, 7, 6]];      // [case voisine, case du bloc qui la touche]
      return [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]].filter(([a, b]) => a >= 0 && a < N && b >= 0 && b < N && (!bloc(a, b) || (a === 6 && (b === 5 || b === 7)) || (b === 6 && (a === 5 || a === 7)))).map(([a, b]) => [a, b, i, j]); };
    const vu = new Set(['B']), ouvert = new Set(), parent = new Map(), pile = [[6, 6]];
    const porte = (a, b, c, d) => [a + ',' + b + '|' + c + ',' + d, c + ',' + d + '|' + a + ',' + b];
    while (pile.length) { const [i, j] = pile[pile.length - 1], libres = voisins(i, j).filter(([a, b]) => !vu.has(id(a, b)));
      if (!libres.length) { pile.pop(); continue; } const [a, b, c, d] = libres[Math.floor(alea() * libres.length)];
      vu.add(id(a, b)); for (const k of porte(a, b, c, d)) ouvert.add(k); parent.set(id(a, b), [i, j, a, b]); pile.push([a, b]); }
    // la salle du taureau : quatre cases réunies, dans un angle
    for (const k of [...porte(0, 0, 1, 0), ...porte(0, 0, 0, 1), ...porte(1, 1, 1, 0), ...porte(1, 1, 0, 1)]) ouvert.add(k);
    // le fil : de l'entrée (en bas, au milieu) jusqu'au carrefour, en remontant les parents
    const fil = new Set(); let cur = id(6, 12); while (cur !== 'B') { const [pi, pj, ci, cj] = parent.get(cur); fil.add(ci + ',' + cj); cur = id(pi, pj); }
    const caseDe = (x) => Math.floor((x - O) / 3), mur = (x) => (x - O) % 3 === 0;
    for (let x = O; x <= O + 3 * N; x++) for (let z = O; z <= O + 3 * N; z++) {
      const i = caseDe(x), j = caseDe(z), mx = mur(x), mz = mur(z), dansBloc = x >= O + 15 && x <= O + 24 && z >= O + 15 && z <= O + 24;
      const surFil = !mx && !mz && fil.has(i + ',' + j) && (x - O) % 3 === 1 && (z - O) % 3 >= 1;
      v(x, 1, z, surFil ? FIL : (x + z) % 2 ? 0xcfc4a8 : 0xbdb193, surFil ? 'fil' : 'dalles');
      if (dansBloc || (!mx && !mz)) continue;
      let plein = true;      // un mur : plein, sauf là où deux cases communiquent
      if (mx && !mz) { const a = i - 1; plein = a < 0 || i >= N || !ouvert.has(a + ',' + j + '|' + i + ',' + j); }
      if (mz && !mx) { const b = j - 1; plein = b < 0 || j >= N || !ouvert.has(i + ',' + b + '|' + i + ',' + j); }
      if (z === O + 3 * N && (x === O + 19 || x === O + 20)) plein = false;                                  // l'entrée
      if (mx && mz && x <= O + 3 && z <= O + 3 && x > O && z > O) plein = false;                              // le pilier au milieu de la salle du taureau
      if (!plein) { if (mx !== mz && fil.has(i + ',' + j) && (mx ? (z - O) % 3 === 1 : (x - O) % 3 === 1)) { vox.delete(cle(x, 1, z)); v(x, 1, z, FIL, 'fil'); } continue; }
      for (let y = 2; y <= 3; y++) v(x, y, z, y === 2 ? M_BASE : (x * 3 + z * 5) % 7 === 0 ? M_PIERRE2 : M_PIERRE, 'murs');
      if (mx && mz && (x * 7 + z * 13) % 11 === 0 && x > O && z > O) { v(x, 4, z, 0xff7a1a, 'torches'); v(x, 5, z, 0xffc23a, 'torches'); }
    }
    // l'entrée : deux colonnes rouges et un linteau
    for (const x of [O + 18, O + 21]) for (let y = 2; y <= 5; y++) { vox.delete(cle(x, y, O + 39)); v(x, y, O + 39, y === 5 ? M_NOIR : M_ROUGE, 'entrée'); } for (let x = O + 18; x <= O + 21; x++) v(x, 6, O + 39, M_PIERRE, 'entrée'); v(O + 19, 7, O + 39, 0xf2efe6, 'entrée'); v(O + 20, 7, O + 39, 0xf2efe6, 'entrée');
    // le taureau de pierre, dans sa salle
    for (let x = O + 2; x <= O + 4; x++) { v(x, 2, O + 2, 0x9a9488, 'taureau'); v(x, 3, O + 2, M_NOIR, 'taureau'); } v(O + 4, 4, O + 2, M_NOIR, 'taureau'); v(O + 5, 4, O + 2, M_NOIR, 'taureau'); v(O + 5, 3, O + 2, M_NOIR, 'taureau'); v(O + 5, 5, O + 1, 0xf2efe6, 'taureau'); v(O + 5, 5, O + 3, 0xf2efe6, 'taureau'); v(O + 5, 6, O + 1, 0xf2c744, 'taureau'); v(O + 5, 6, O + 3, 0xf2c744, 'taureau');
    const cellules = []; for (let x = O + 15; x <= O + 24; x++) for (let y = 2; y <= 4; y++) for (let z = O + 15; z <= O + 24; z++) cellules.push([x, y, z]);
    return {
      id: 'labyrinthe', chaine: 'labyrinthe', nom: 'Labyrinthe', titre: "C'était le labyrinthe !", sous: "Bâti par Dédale pour que personne n'en ressorte. Suis le fil rouge : il va de l'entrée jusqu'à ton carrefour.",
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 1.05,
      parts: ['dalles', 'fil', 'murs', 'entrée', 'torches', 'taureau'], ...TERRE_CRETE,
      fosse: (x, y, z) => y >= 2 && x >= O + 14 && x <= O + 25 && z >= O + 14 && z <= O + 25,
      mini: { cellules, pied: [O + 20, 2, O + 20], k: 3 },
      piocheR: 2.8, pinceauR: 2.6, jetR: 3.8,
      intro: ['Il menait partout', "Ton carrefour est devenu une maquette au fond de la fosse. Quatre couloirs en partent. Jusqu'où vont-ils ?"],
    };
  }

  /* ---------- 4. Le palais de Cnossos : le labyrinthe est à ses pieds ---------- */
  function cnossos() {
    const BX = 58, BY = 16, BZ = 52, { vox, v } = fabrique(), boite = boiteDans(v), coque = coqueDans(v);
    const h = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
    const MINI = { x0: 12, x1: 27, z0: 22, z1: 37 };
    for (let x = 2; x <= 55; x++) for (let z = 2; z <= 49; z++) {
      if (z >= 45) { v(x, 1, z, h(x, z) > 0.55 ? 0x4fa3d1 : 0x3f8fc0, 'mer'); continue; }
      if (z === 44) { v(x, 1, z, 0xe2c28a, 'mer'); continue; }
      if ((x >= 34 && x <= 43 && z >= 14 && z <= 33) || ((x === 36 || x === 37) && z >= 34 && z <= 43)) { v(x, 1, z, (x + z) % 2 ? 0xe6dcc6 : 0xd9cdb4, 'cour'); continue; }
      v(x, 1, z, [0x8fa85a, 0xa3b86a, 0x7f9a4f, 0xb9b56a][Math.floor(h(Math.floor(x / 3), Math.floor(z / 3)) * 4)], 'terres');
    }
    // les ailes du palais : toits plats, murs crème, une bande rouge, de petites fenêtres
    const aile = (x0, x1, z0, z1, hh) => coque(x0, x1, 2, 1 + hh, z0, z1, (x, y, z) => y === 1 + hh ? ((x + z) % 2 ? 0xd9cdb4 : 0xcfc4a8) : y === 2 ? M_BASE : y === hh ? M_ROUGE : y % 2 === 1 && (x + z) % 3 === 0 ? 0x3a2a22 : M_CREME, 'palais');
    aile(29, 48, 6, 11, 6); aile(29, 33, 12, 35, 4); aile(44, 50, 12, 35, 5); aile(34, 35, 36, 39, 3); aile(38, 43, 36, 39, 3);
    for (let x = 34; x <= 43; x++) if ((x - 34) % 3 !== 2) v(x, 4, 12, (x - 34) % 3 ? 0x3f8fc0 : 0x7fd0e8, 'palais');                     // la fresque bleue, sur la cour
    for (let x = 34; x <= 43; x++) for (let y = 2; y <= 3; y++) v(x, y, 12, y === 2 ? M_BASE : M_CREME, 'palais');
    // les colonnes rouges, le long de la cour
    for (let z = 15; z <= 33; z += 3) for (const x of [34, 43]) for (let y = 2; y <= 5; y++) v(x, y, z, y === 2 || y === 5 ? M_NOIR : M_ROUGE, 'colonnes');
    // les cornes de pierre, sur les toits
    const cornes = (x, y, z) => { v(x, y, z, 0xf2efe6, 'cornes'); v(x + 1, y, z, 0xf2efe6, 'cornes'); v(x + 2, y, z, 0xf2efe6, 'cornes'); v(x, y + 1, z, 0xf2efe6, 'cornes'); v(x + 2, y + 1, z, 0xf2efe6, 'cornes'); };
    for (const x of [30, 35, 40, 45]) cornes(x, 8, 11); for (const z of [14, 21, 28]) { cornes(30, 6, z); cornes(46, 7, z); }
    // le grand escalier, à l'est
    for (let k = 0; k <= 4; k++) boite(51 + k, 51 + k, 2, 5 - k, 18, 27, (x, y, z) => y === 5 - k ? 0xe6dcc6 : M_BASE, 'escalier');
    // les grandes jarres, rangées dans la réserve
    for (const [x, z] of [[47, 38], [49, 38], [51, 38], [53, 38], [48, 41], [50, 41], [52, 41]]) { v(x, 2, z, 0x9a5a36, 'jarres'); v(x, 3, z, 0x7a4326, 'jarres'); v(x, 4, z, 0xb06a40, 'jarres'); }
    // oliviers et cyprès
    for (const [x, z, cy] of [[5, 6, 0], [12, 9, 1], [20, 5, 0], [6, 16, 1], [24, 14, 0], [5, 41, 0], [30, 42, 1], [45, 43, 0], [53, 8, 1], [53, 31, 0], [9, 4, 0], [22, 41, 0]]) { if (x >= MINI.x0 - 1 && x <= MINI.x1 + 1 && z >= MINI.z0 - 1 && z <= MINI.z1 + 1) continue;
      v(x, 2, z, 0x6b4a2b, 'oliviers'); if (cy) { for (let y = 3; y <= 6; y++) v(x, y, z, 0x2f6b3a, 'oliviers'); } else { v(x, 3, z, 0x6b4a2b, 'oliviers'); for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) v(x + dx, 4, z + dz, (dx + dz) % 2 ? 0x7f9a5a : 0x8fa868, 'oliviers'); v(x, 5, z, 0x8fa868, 'oliviers'); } }
    // le navire à la voile noire, au mouillage
    boite(20, 26, 2, 2, 46, 47, 0x4a3324, 'navire'); v(19, 2, 46, 0x4a3324, 'navire'); v(27, 2, 47, 0x4a3324, 'navire'); v(27, 3, 47, 0xb5352b, 'navire'); for (let y = 3; y <= 8; y++) v(23, y, 46, 0x6e4527, 'navire'); boite(21, 25, 5, 7, 47, 47, 0x1f1f24, 'navire');
    const cellules = []; for (let x = MINI.x0; x <= MINI.x1; x++) for (let y = 2; y <= 4; y++) for (let z = MINI.z0; z <= MINI.z1; z++) cellules.push([x, y, z]);
    return {
      id: 'cnossos', chaine: 'labyrinthe', nom: 'Cnossos', titre: "C'était le palais de Cnossos !", sous: "Le palais du roi Minos, en Crète : des colonnes rouges, des cornes de pierre sur les toits. Il a vraiment existé, et ses mille pièces ont peut-être fait naître la légende.",
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.8,
      parts: ['mer', 'terres', 'cour', 'palais', 'colonnes', 'cornes', 'escalier', 'jarres', 'oliviers', 'navire'], ...TERRE_CRETE,
      fosse: (x, y, z) => y >= 2 && x >= MINI.x0 - 1 && x <= MINI.x1 + 1 && z >= MINI.z0 - 1 && z <= MINI.z1 + 1,
      mini: { cellules, pied: [20, 2, 30], k: 3 },
      piocheR: 3.1, pinceauR: 3.0, jetR: 4.4,
      intro: ['Il était caché sous quelque chose', "Ton labyrinthe n'est plus qu'un carré au fond de la fosse. Qui l'avait fait bâtir ?"],
      fin: { plonge: 'Le palais, le labyrinthe, le carrefour…', depart: 'Tout est parti de cette pelote de fil.', vivant: 'Cnossos, le soir où le navire reprit la mer.' },
      vivant: { lumieres: (e) => e.part === 'palais' && e.c === 0x3a2a22, flammes: (e) => e.part === 'cornes' && e.y >= 7 && e.x % 5 === 0, glisse: { filtre: (e) => e.part === 'navire', course: 14, vitesse: 0.22 } },
    };
  }

  /* =====================================================================
     L'expédition de Montréal : un bagel au sésame, la boulangerie et son four à bois, une rue du
     Plateau, la ville. Aucune vraie enseigne ni marque. Elle se creuse dans la NEIGE : une croûte de
     glace dure traverse le bloc à mi-hauteur, et la pioche doit la casser.
     ===================================================================== */
  const BRIQUE = 0xa5452f, BRIQUE2 = 0x8f3a28, GRIS_P = 0x9a9aa0, FER_F = 0x2a2a30, BAGEL = 0xc98a4a, BAGEL2 = 0xb87a3c, BOIS_M = 0xb98a5a, BOIS_M2 = 0x7a5a36, ERABLE = [0xd8433a, 0xe9762b, 0xf2a03a, 0xc0392b];
  const neige = (yGlace) => ({ couches: (yy) => yy <= 3 ? 'gel' : yy === yGlace ? 'glace' : yy < yGlace ? 'tasse' : 'neige', caillou: 'glace', dessus: 'neige' });

  /* ---------- 1. Le bagel : son dos doré dépasse de la neige ---------- */
  function bagel() {
    const BX = 15, BY = 11, BZ = 15, c = 7, { vox, v } = fabrique();
    const hh = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
    for (let x = 2; x <= 12; x++) for (let z = 2; z <= 12; z++) v(x, 1, z, (x + z) % 2 ? BOIS_M : 0xa87a4c, 'planche');
    // un anneau bien troué : brun doré sur le dos, plus pâle sur les flancs, quelques graines de sésame
    const dedans = (dx, y, dz) => (Math.hypot(dx, dz) - 4.5) ** 2 + (y - 3.9) ** 2 * 1.15 <= 3.7;
    for (let y = 2; y <= 6; y++) for (let dx = -6; dx <= 6; dx++) for (let dz = -6; dz <= 6; dz++) {
      if (!dedans(dx, y, dz)) continue;
      const dos = !dedans(dx, y + 1, dz), g = hh(c + dx, c + dz);
      if (dos && g < 0.16) v(c + dx, y, c + dz, 0xf6ecc8, 'sésame');
      else v(c + dx, y, c + dz, dos ? (g > 0.6 ? 0xb9742f : 0xc4803a) : y <= 3 ? 0xdcae6c : BAGEL, y <= 3 ? 'mie' : 'croûte');
    }
    return {
      id: 'bagel', chaine: 'montreal', nom: 'Bagel', titre: "C'était un bagel au sésame !", sous: 'Roulé à la main, poché dans l\'eau au miel, cuit au feu de bois. Encore tiède, peut-être.',
      BX, BY, BZ, vox, base: [c + 0.5, 1, c + 0.5], leve: 3, elFin: 0.7, recul: 1.45,
      parts: ['sésame', 'croûte', 'mie', 'planche'], ...neige(8),
      fosse: (x, y, z) => { const d = (x - c - 4.5) ** 2 + (z - c) ** 2; return (y >= 6 && d <= 7) || (y >= 9 && d <= 18); },
      piocheR: 1.9, pinceauR: 1.5, jetR: 3.0,
      intro: ['Quelque chose de doré sous la neige', "Un dos rond et doré, piqué de petites graines, dépasse au fond de la fosse. Attention à la croûte de glace : seule la pioche la casse. Qu'est-ce que c'est ?"],
    };
  }

  /* ---------- 2. La boulangerie : le bagel sortait du four ---------- */
  function boulangerie() {
    const BX = 30, BY = 17, BZ = 22, { vox, v } = fabrique(), boite = boiteDans(v);
    const brique = (x, y, z) => (y % 2 ? x + z : x + z + 1) % 4 === 0 ? BRIQUE2 : BRIQUE;
    for (let x = 3; x <= 26; x++) for (let z = 2; z <= 18; z++) v(x, 1, z, z <= 4 ? ((x + z) % 2 ? 0x8a8f9a : 0x7a7f8a) : (x + z) % 2 ? 0xe6dcc6 : 0x3a3a40, 'carrelage');
    for (let x = 3; x <= 26; x++) for (let y = 2; y <= 9; y++) v(x, y, 18, brique(x, y, 18), 'murs');
    for (const x of [3, 26]) for (let z = 10; z <= 17; z++) for (let y = 2; y <= 9; y++) v(x, y, z, brique(x, y, z), 'murs');
    // le four à bois : une voûte de pierre, la gueule noire, le feu au fond
    boite(9, 20, 2, 7, 13, 17, (x, y, z) => { if (z === 13 && x >= 13 && x <= 16 && y >= 3 && y <= 5 && !(y === 5 && (x === 13 || x === 16))) return null; if (z === 14 && x >= 13 && x <= 16 && y >= 3 && y <= 4) return null;
      return y === 7 ? 0x9a8a72 : (x + y + z) % 5 === 0 ? 0xa8967c : 0xb8a48c; }, 'four');
    for (let x = 13; x <= 16; x++) { v(x, 3, 14, x % 2 ? 0xff7a1a : 0xffc23a, 'feu'); if (x === 14 || x === 15) v(x, 4, 14, 0xff7a1a, 'feu'); }
    for (let x = 12; x <= 17; x++) v(x, 6, 12, x === 12 || x === 17 ? 0x9a8a72 : 0x6e5a40, 'four');                 // la tablette devant la gueule
    boite(14, 15, 8, 13, 16, 17, (x, y, z) => y === 13 ? 0x4a4a52 : brique(x, y, z), 'cheminée');
    // le comptoir, ses paniers, la pelle à enfourner, les sacs de farine
    boite(6, 23, 2, 3, 5, 7, (x, y, z) => y === 3 ? 0xc99a62 : z === 5 ? (x % 3 ? BOIS_M2 : 0x4a3324) : null, 'comptoir');
    for (const x0 of [8, 20]) { boite(x0, x0 + 1, 4, 4, 5, 6, 0x9a7a4a, 'paniers'); v(x0, 5, 5, BAGEL, 'paniers'); v(x0 + 1, 5, 6, BAGEL2, 'paniers'); v(x0 + 1, 5, 5, 0xf2e6c0, 'paniers'); }
    for (let y = 2; y <= 9; y++) v(23, y, 12, BOIS_M, 'pelle'); for (let x = 22; x <= 24; x++) for (let y = 10; y <= 11; y++) v(x, y, 12, 0xc99a62, 'pelle');
    for (const [x, z] of [[5, 14], [6, 14], [5, 16]]) { v(x, 2, z, 0xe9e2d0, 'sacs'); v(x, 3, z, 0xd9d0b8, 'sacs'); } v(5, 4, 14, 0xe9e2d0, 'sacs');
    // le toit sur le fournil, et l'auvent rayé sur la rue
    boite(2, 27, 10, 10, 16, 19, (x, y, z) => (x + z) % 2 ? 0x3a3a40 : 0x44444a, 'toit');      // un toit sur le fond seulement : le four doit se voir d'en haut
    for (const x of [2, 27]) boite(x, x, 10, 10, 9, 15, 0x44444a, 'toit'); boite(2, 27, 10, 10, 9, 9, 0x44444a, 'toit');
    for (let x = 4; x <= 25; x++) { v(x, 9, 8, x % 2 ? 0x2f7a43 : 0xf2efe6, 'auvent'); v(x, 8, 7, x % 2 ? 0x2f7a43 : 0xf2efe6, 'auvent'); }
    const cellules = []; for (let x = 14; x <= 15; x++) for (let z = 5; z <= 7; z++) cellules.push([x, 4, z]);
    return {
      id: 'boulangerie', chaine: 'montreal', nom: 'Boulangerie', titre: "C'était une boulangerie de bagels !", sous: 'Le four à bois ne s\'éteint jamais, de jour comme de nuit. Ton bagel venait d\'en sortir.',
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.55, azFin: 2.7,
      parts: ['carrelage', 'comptoir', 'paniers', 'sacs', 'four', 'feu', 'pelle', 'murs', 'cheminée', 'toit', 'auvent'], ...neige(10),
      fosse: (x, y, z) => (y >= 4 && x >= 12 && x <= 17 && z >= 3 && z <= 8) || (y >= 12 && x >= 10 && x <= 19 && z >= 1 && z <= 8),
      mini: { cellules, pied: [15, 4, 6.5], k: 8 },
      piocheR: 2.3, pinceauR: 2.2, jetR: 3.2,
      intro: ['Il attendait sur un comptoir', "Ton bagel est tout petit, au fond d'une fosse bien plus grande. Il est posé sur du bois. D'où sortait-il ?"],
    };
  }

  /* ---------- 3. La rue du Plateau : les triplex et leurs escaliers dehors ---------- */
  function plateau() {
    const BX = 46, BY = 16, BZ = 29, { vox, v } = fabrique(), boite = boiteDans(v), coque = coqueDans(v);
    for (let x = 2; x <= 43; x++) for (let z = 2; z <= 26; z++) {
      if (z >= 12 && z <= 15) v(x, 1, z, (z === 13 || z === 14) && x % 4 === 0 ? 0xf2c744 : (x + z) % 2 ? 0x3a3a40 : 0x424248, 'chaussée');
      else if (z === 10 || z === 11 || z === 16 || z === 17) v(x, 1, z, (x + z) % 2 ? 0xb8b8be : 0xacacb2, 'trottoirs');
      else v(x, 1, z, x >= 18 && x <= 20 && z < 10 ? ((x + z) % 2 ? 0x6fae4f : 0x7fbb5a) : (x * 3 + z) % 4 ? 0x9a9aa0 : 0x8e8e94, x >= 18 && x <= 20 && z < 10 ? 'ruelle' : 'trottoirs');
    }
    // un triplex : trois étages, des fenêtres, une corniche, un balcon et l'escalier en colimaçon devant
    const triplex = (x0, x1, z0, z1, mur, porte, zf, dz) => {
      coque(x0, x1, 2, 9, z0, z1, (x, y, z) => { if (y === 9) return null; if (z === zf && y <= 3 && x === x0 + 1) return porte;
        if (z === zf && (y === 3 || y === 6 || y === 8) && x > x0 + 2 && x < x1 && (x - x0) % 2 === 1) return VITRE; return mur === BRIQUE ? ((y % 2 ? x : x + 1) % 4 === 0 ? BRIQUE2 : BRIQUE) : (x + y) % 5 === 0 ? 0x8a8a90 : mur; }, 'triplex');
      boite(x0, x1, 9, 9, z0, z1, 0x44444a, 'triplex');
      for (let x = x0; x <= x1; x++) { v(x, 10, zf, (x - x0) % 2 ? 0xe6dcc6 : porte, 'corniches'); } v(x0, 11, zf, porte, 'corniches'); v(x1, 11, zf, porte, 'corniches'); v(Math.floor((x0 + x1) / 2), 11, zf, 0xe6dcc6, 'corniches');
      for (let x = x0 + 2; x <= x1; x++) { v(x, 5, zf + dz, 0x6a6a72, 'balcons'); if ((x - x0) % 2 === 0) v(x, 6, zf + dz, FER_F, 'balcons'); }
      // l'escalier : il tourne autour de son poteau, du trottoir au balcon
      for (let k = 0; k <= 3; k++) v(x0 + [0, 1, 1, 0][k], 2 + k, zf + dz * (1 + [0, 0, 1, 1][k]), FER_F, 'escaliers'); for (let y = 2; y <= 5; y++) v(x0, y, zf + dz, y === 5 ? 0x6a6a72 : FER_F, 'escaliers');
    };
    for (const [x0, x1, mur, porte] of [[2, 8, BRIQUE, 0x2f7a43], [10, 16, GRIS_P, 0xc0392b], [22, 28, BRIQUE, 0x3f6fb0], [30, 36, 0xd9cdb4, 0xf2a03a]]) triplex(x0, x1, 3, 8, mur, porte, 8, 1);
    for (const [x0, x1, mur, porte] of [[18, 24, GRIS_P, 0x3f6fb0], [26, 32, BRIQUE, 0xf2a03a], [34, 40, 0xd9cdb4, 0x2f7a43]]) triplex(x0, x1, 19, 24, mur, porte, 19, -1);
    // le dépanneur du coin : une vitrine, un auvent rouge, une enseigne en traits
    coque(38, 43, 2, 7, 3, 8, (x, y, z) => y === 7 ? 0x44444a : z === 8 && y <= 3 && x === 39 ? 0x2a2224 : z === 8 && y === 3 && x >= 41 ? VITRE : y === 2 ? 0x8a8a90 : 0xe9dcc0, 'dépanneur');
    for (let x = 38; x <= 43; x++) { v(x, 4, 9, x % 2 ? 0xc0392b : 0xf2efe6, 'dépanneur'); v(x, 5, 8, (x * 2) % 3 ? 0xf2efe6 : 0xc0392b, 'dépanneur'); }
    // la ruelle verte : des bacs, une vigne, une corde à linge
    for (const [x, z, c] of [[18, 4, 0x3f7d3a], [20, 6, 0x2f6b3a], [18, 8, 0xd8433a], [20, 3, 0xf2c744]]) { v(x, 2, z, 0x7a5a36, 'ruelle'); v(x, 3, z, c, 'ruelle'); }
    for (let x = 17; x <= 21; x++) v(x, 7, 6, x % 2 ? 0xf2efe6 : 0x3f6fb0, 'ruelle');
    // les érables d'automne, et les cônes orange
    for (const [x, z] of [[9, 10], [29, 10], [25, 17], [41, 17]]) { for (let y = 2; y <= 4; y++) v(x, y, z, 0x5a4030, 'érables');
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 5; y <= 7; y++) { if (y === 7 && dx && dz) continue; v(x + dx, y, z + dz, ERABLE[((dx + dz + y) % 4 + 4) % 4], 'érables'); } }
    for (const [x, z] of [[14, 12], [16, 13], [33, 15]]) { v(x, 2, z, 0xff7a1a, 'cônes'); v(x, 3, z, 0xf2efe6, 'cônes'); v(x, 4, z, 0xff7a1a, 'cônes'); }
    const cellules = []; for (let x = 7; x <= 16; x++) for (let y = 2; y <= 6; y++) for (let z = 18; z <= 25; z++) cellules.push([x, y, z]);
    return {
      id: 'plateau', chaine: 'montreal', nom: 'Rue du Plateau', titre: "C'était une rue du Plateau !", sous: 'Des triplex serrés, des escaliers en fer qui tournent dehors, un dépanneur au coin, des cônes orange. Ta boulangerie tenait le coin d\'en face.',
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.75, azFin: 2.9,
      parts: ['chaussée', 'trottoirs', 'triplex', 'corniches', 'balcons', 'escaliers', 'dépanneur', 'ruelle', 'érables', 'cônes'], ...neige(10),
      fosse: (x, y, z) => y >= 2 && x >= 6 && x <= 17 && z >= 17 && z <= 26,
      mini: { cellules, pied: [12, 2, 21.67], k: 3 },
      piocheR: 2.6, pinceauR: 2.6, jetR: 3.6,
      intro: ['Elle avait des voisins', "Ta boulangerie est devenue une maquette au fond de la fosse. Qui habitait autour ?"],
    };
  }

  /* ---------- 4. Montréal : la montagne, le stade, le pont, le fleuve ---------- */
  function montreal() {
    const BX = 62, BY = 20, BZ = 54, { vox, v } = fabrique(), boite = boiteDans(v), coque = coqueDans(v);
    const h = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
    const MINI = { x0: 26, x1: 41, z0: 11, z1: 20 }, dansMini = (x, z) => x >= MINI.x0 - 1 && x <= MINI.x1 + 1 && z >= MINI.z0 - 1 && z <= MINI.z1 + 1;
    const MONT = { x: 13, z: 17, r: 10.5 }, haut = (x, z) => { const d = Math.hypot(x - MONT.x, z - MONT.z); return d >= MONT.r ? 0 : Math.round(7 * Math.cos(d / MONT.r * Math.PI / 2)); };
    const ile = (x, z) => ((x - 51.5) / 6.5) ** 2 + ((z - 47) / 3.2) ** 2 <= 1;
    for (let x = 2; x <= 59; x++) for (let z = 2; z <= 51; z++) {
      if (z >= 42 && !ile(x, z)) { v(x, 1, z, h(x, z) > 0.55 ? 0x4fa3d1 : 0x3f8fc0, 'fleuve'); continue; }
      if (ile(x, z)) { v(x, 1, z, (x + z) % 2 ? 0x6fae4f : 0x7fbb5a, 'île'); continue; }
      if (haut(x, z) > 0) { v(x, 1, z, 0x5a8a48, 'mont Royal'); continue; }
      const rue = x % 6 === 2 || z % 6 === 2 || z === 40 || z === 41;
      v(x, 1, z, rue ? (z >= 40 ? 0x8a8a90 : 0x4a4a52) : (x + z) % 2 ? 0xb8b8be : 0xacacb2, rue ? 'rues' : 'quartiers');
    }
    // la montagne, rousse en automne, et sa croix
    for (let x = 2; x <= 26; x++) for (let z = 5; z <= 29; z++) { const hh2 = haut(x, z); for (let y = 2; y <= 1 + hh2; y++) v(x, y, z, y === 1 + hh2 ? (h(x, z) > 0.45 ? ERABLE[Math.floor(h(x + 1, z) * 4)] : 0x4f7a3a) : 0x5a6a48, 'mont Royal'); }
    for (let y = 9; y <= 14; y++) v(MONT.x, y, MONT.z, 0xe6e6ea, 'croix'); for (const dx of [-2, -1, 1, 2]) v(MONT.x + dx, 12, MONT.z, 0xe6e6ea, 'croix');
    // les quartiers : des toits plats serrés, quelques clochers
    for (let x = 3; x <= 58; x += 2) for (let z = 3; z <= 38; z += 2) { if (x % 6 === 2 || z % 6 === 2 || (x + 1) % 6 === 2 || (z + 1) % 6 === 2 || dansMini(x, z) || dansMini(x + 1, z + 1) || haut(x, z) > 0 || haut(x + 1, z + 1) > 0) continue;
      if ((x >= 12 && x <= 27 && z >= 30) || (x >= 44 && z <= 20) || h(x, z) > 0.8) continue; const hh3 = h(x + 5, z) > 0.7 ? 2 : 1;
      for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { for (let y = 2; y < 2 + hh3; y++) v(x + a, y, z + b, [BRIQUE, 0xd9cdb4, GRIS_P, BRIQUE2][Math.floor(h(x, z + 3) * 4)], 'quartiers'); v(x + a, 2 + hh3, z + b, 0x44444a, 'quartiers'); } }
    // le centre-ville : les tours de verre, au pied de la montagne
    for (const [x0, x1, z0, z1, hh4, c] of [[13, 16, 31, 34, 11, 0x5a7a9a], [18, 21, 31, 35, 14, 0x3f5a78], [23, 26, 32, 35, 9, 0x7a9ab8], [14, 17, 36, 38, 8, 0x8a8f9a], [19, 23, 37, 38, 12, 0x4a6a8a]])
      coque(x0, x1, 2, 1 + hh4, z0, z1, (x, y, z) => y === 1 + hh4 ? 0x3a3a40 : y % 2 === 1 && (x + z) % 2 === 0 ? VITRE : c, 'centre-ville');
    // le stade et sa tour penchée
    for (let x = 44; x <= 58; x++) for (let z = 5; z <= 19; z++) { const d = ((x - 51) / 6.5) ** 2 + ((z - 12.5) / 6) ** 2; if (d > 1) continue; if (d > 0.55) for (let y = 2; y <= (d > 0.8 ? 4 : 3); y++) v(x, y, z, y === 4 ? 0xe6e6ea : 0xcfcfd4, 'stade'); else v(x, 2, z, d < 0.2 ? 0x5a9a4a : 0xf2a03a, 'stade'); }
    for (let k = 0; k <= 11; k++) { const z = 3 + Math.round(k * 0.55); v(51, 2 + k, z, 0xf2f2f4, 'stade'); v(52, 2 + k, z, 0xe0e0e4, 'stade'); if (k < 8) v(51, 2 + k, z - 1, 0xe0e0e4, 'stade'); }
    // le pont : un tablier vert sur ses piles, et sa grande arche
    for (let z = 38; z <= 51; z++) { for (const x of [43, 44]) v(x, 4, z, (z % 2) ? 0x4f7a5a : 0x5a8a66, 'pont'); if (z % 4 === 2) for (const x of [43, 44]) for (let y = 2; y <= 3; y++) v(x, y, z, 0x9a9aa0, 'pont'); }
    for (let z = 41; z <= 49; z++) { const a = Math.round(3.2 * Math.sin((z - 41) / 8 * Math.PI)); for (const x of [43, 44]) { v(x, 5 + a, z, 0x4f7a5a, 'pont'); if (z % 2 === 1 && a > 0) for (let y = 5; y < 5 + a; y++) v(x, y, z, 0x5a8a66, 'pont'); } }
    // l'île : la grande boule en treillis
    for (let dx = -3; dx <= 3; dx++) for (let dy = 0; dy <= 6; dy++) for (let dz = -3; dz <= 3; dz++) { const d = Math.hypot(dx, dy - 3, dz); if (d > 3.4 || d < 2.5) continue; if ((dx + dy + dz) % 2 === 0) v(52 + dx, 2 + dy, 47 + dz, (dx + dz) % 4 === 0 ? 0xdfe8ef : 0xb8c4d2, 'Biosphère'); }
    for (const [x, z] of [[47, 46], [56, 48], [49, 49]]) { v(x, 2, z, 0x5a4030, 'île'); v(x, 3, z, ERABLE[(x + z) % 4], 'île'); v(x, 4, z, ERABLE[(x + z + 1) % 4], 'île'); }
    // la grande roue du Vieux-Port
    for (let dx = -4; dx <= 4; dx++) for (let dy = -4; dy <= 4; dy++) { const d = Math.hypot(dx, dy); if (d >= 3.5 && d <= 4.4) v(31 + dx, 7 + dy, 41, (dx + dy + 20) % 3 === 0 ? [0xd8433a, 0x3f8fc0, 0xf2c744][(dx + 9) % 3] : 0xf2f2f4, 'grande roue'); else if ((dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) && d < 3.5) v(31 + dx, 7 + dy, 41, 0xdfe0e6, 'grande roue'); }
    for (const dx of [-2, 2]) for (let y = 2; y <= 4; y++) v(31 + dx, y, 41, 0x9a9aa0, 'grande roue');
    const cellules = []; for (let x = MINI.x0; x <= MINI.x1; x++) for (let y = 2; y <= 5; y++) for (let z = MINI.z0; z <= MINI.z1; z++) cellules.push([x, y, z]);
    return {
      id: 'montreal', chaine: 'montreal', nom: 'Montréal', titre: "C'était Montréal !", sous: 'La montagne et sa croix, le stade et sa tour penchée, le pont, la grande boule sur son île, la grande roue du port. Ta rue se cachait sur le Plateau.',
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.8,
      parts: ['fleuve', 'île', 'rues', 'quartiers', 'mont Royal', 'croix', 'centre-ville', 'stade', 'pont', 'Biosphère', 'grande roue'], ...neige(12),
      fosse: (x, y, z) => y >= 2 && x >= MINI.x0 - 1 && x <= MINI.x1 + 1 && z >= MINI.z0 - 1 && z <= MINI.z1 + 1,
      mini: { cellules, pied: [33.67, 2, 15.83], k: 3 },
      piocheR: 3.2, pinceauR: 3.0, jetR: 4.6,
      intro: ['Elle menait partout', "Ta rue n'est plus qu'un trait au fond de la fosse. Dans quelle ville était-elle ?"],
      fin: { plonge: 'La ville, la rue, la boulangerie…', depart: 'Tout est parti de ce bagel.', vivant: 'Montréal, à la première neige.' },
      vivant: { ciel: 'hiver', teinte: 0xb8c8e8, flocons: 150, lumieres: (e) => (e.part === 'centre-ville' && e.c === VITRE) || (e.part === 'quartiers' && e.y === 2),
        neons: (e) => e.part === 'croix' || (e.part === 'grande roue' && e.c !== 0xf2f2f4 && e.c !== 0xdfe0e6 && e.c !== 0x9a9aa0) },
    };
  }

  /* ---------- Le tyrannosaure : un squelette debout, monté comme au musée ---------- */
  function dinosaure() {
    const BX = 35, BY = 22, BZ = 13, c0 = 6, { vox, v } = fabrique();
    // le profil, case par case : la tête à gauche, la queue à droite (une ligne = une hauteur)
    const PROFIL = [
      '................................',
      '..CCCCCC........................',
      '.CC.CCCCC.......................',
      'CCCCCC.CCV......................',
      'CCCCCCCCCVV.....................',
      'c.c.c.CC..VV....................',
      'MMMMMMM...VVDDDDDDDBBB..........',
      '.MMMMM.....KDKDKDKDBBBBQQQ......',
      '...........K.K.K.K.BBBB..QQQQ...',
      '..........AK.K.K.K..PPB.....QQQQ',
      '.........AA.K.K.K..PPP.........Q',
      '.........g...KKK...PP...........',
      '...................PP...........',
      '....................PP..........',
      '....................PP..........',
      '...................PP...........',
      '...................PP...........',
      '..................GPGGG.........',
    ];
    const OS = 0xf3e9d2, OS2 = 0xe6d9bd, DENT = 0xfffaf0, GRIFFE = 0x8a7a5c;
    const NOM = { C: 'crâne', c: 'crâne', M: 'mâchoire', V: 'cou', D: 'dos', K: 'côtes', A: 'bras', g: 'bras', B: 'bassin', Q: 'queue', P: 'pattes', G: 'griffes' };
    PROFIL.forEach((ligne, r) => [...ligne].forEach((ch, i) => {
      if (ch === '.') return;
      const x = i + 1, y = 18 - r, part = NOM[ch];
      let zs = [c0], col = (x + y) % 3 ? OS : OS2;
      if (ch === 'C' || ch === 'M') zs = [c0 - 1, c0, c0 + 1];
      if (ch === 'c') { zs = [c0 - 1, c0 + 1]; col = DENT; }
      if (ch === 'K') zs = r === 7 ? [c0 - 1, c0 + 1] : r === 11 ? [c0 - 1, c0, c0 + 1] : [c0 - 2, c0 + 2];
      if (ch === 'B') zs = [c0 - 2, c0 - 1, c0, c0 + 1, c0 + 2];
      if (ch === 'Q' && r === 7) zs = [c0 - 1, c0, c0 + 1];
      if (ch === 'A') zs = [c0 - 2, c0 + 2];
      if (ch === 'g') { zs = [c0 - 2, c0 + 2]; col = GRIFFE; }
      if (ch === 'P') zs = [c0 - 3, c0 - 2, c0 + 2, c0 + 3];
      if (ch === 'G') { zs = [c0 - 3, c0 - 2, c0 + 2, c0 + 3]; col = i === 18 || i === 22 ? GRIFFE : OS2; }
      for (const z of zs) v(x, y, z, col, part);
    }));
    return {
      id: 'dinosaure', libre: true, nom: 'Tyrannosaure', titre: "C'était un tyrannosaure\u00a0!", sous: 'Un squelette entier, debout, comme s\'il allait repartir.',
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.3, azFin: 0.25,
      parts: ['crâne', 'mâchoire', 'cou', 'dos', 'côtes', 'bras', 'bassin', 'queue', 'pattes', 'griffes'],
      couches: (yy) => yy <= 5 ? 'argile' : yy <= 12 ? 'sable' : 'terre', caillou: 'roche',
      fosse: (x, y, z) => y >= 17 && x <= 10 && z >= 3 && z <= 9,
      piocheR: 2.2, pinceauR: 2.0, jetR: 2.6,
      intro: ['Quelque chose est enterré ici', "L'équipe est tombée sur quelque chose de dur et de clair, tout en haut du bloc. Qu'est-ce que c'est\u00a0?"],
    };
  }

  /* ---------- La voiture : une américaine des années 50, deux tons et ailerons ---------- */
  function voiture() {
    const BX = 30, BY = 13, BZ = 15, { vox, v } = fabrique(), boite = boiteDans(v);
    const BLEU = 0x3fb8b0, BLEU2 = 0x35a39c, BLANC = 0xf4f0e6, CHROME = 0xc9ccd1, VITRE = 0xa9d8ee, PNEU = 0x2a2a2a;
    // la caisse : capot, habitacle, coffre
    boite(3, 26, 2, 4, 3, 11, (x, y, z) => (y === 3 && (z === 3 || z === 11) ? BLANC : (x + z) % 5 ? BLEU : BLEU2), 'carrosserie');
    boite(4, 9, 5, 5, 4, 10, null, 'carrosserie');
    // l'habitacle : des vitres tout autour, des montants, un toit blanc
    boite(10, 19, 5, 6, 4, 10, (x, y, z) => { const bord = x === 10 || x === 19 || z === 4 || z === 10; if (!bord) return null; const montant = (x === 10 || x === 19) && (z === 4 || z === 10) || x === 15; return montant ? BLEU : VITRE; }, 'vitres');
    boite(10, 19, 7, 7, 4, 10, BLANC, 'toit');
    // les roues : pneus noirs, flancs blancs, enjoliveurs
    for (const cx of [7, 22]) for (const z of [3, 11]) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const coin = dx && dy; vox.delete(cle(cx + dx, 2 + dy, z));
      v(cx + dx, 2 + dy, z, !dx && !dy ? CHROME : coin ? PNEU : BLANC, 'roues');
    }
    // les pare-chocs, la calandre, les phares
    boite(2, 2, 2, 2, 3, 11, CHROME, 'pare-chocs'); boite(27, 27, 2, 2, 3, 11, CHROME, 'pare-chocs');
    for (let z = 5; z <= 9; z++) { vox.delete(cle(3, 3, z)); v(3, 3, z, z % 2 ? CHROME : 0x8a93a0, 'pare-chocs'); }
    for (const z of [4, 10]) { vox.delete(cle(3, 4, z)); v(3, 4, z, 0xffe9a0, 'phares'); }
    // les ailerons et leurs feux rouges
    for (const z of [3, 11]) { boite(23, 26, 5, 5, z, z, BLEU, 'ailerons'); boite(25, 26, 6, 6, z, z, BLEU, 'ailerons'); vox.delete(cle(26, 4, z)); v(26, 4, z, 0xd8433a, 'phares'); v(26, 5, z, 0xd8433a, 'phares'); }
    return {
      id: 'voiture', libre: true, nom: 'Voiture', titre: "C'était une voiture des années 50\u00a0!", sous: 'Deux tons, des ailerons, du chrome. Qui a bien pu la garer là\u00a0?',
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.45, azFin: -0.6,
      parts: ['toit', 'vitres', 'carrosserie', 'ailerons', 'phares', 'pare-chocs', 'roues'],
      couches: (yy) => yy <= 4 ? 'argile' : yy <= 8 ? 'terre' : 'sable', caillou: 'roche',
      fosse: (x, y, z) => y >= 7 && x >= 11 && x <= 18 && z >= 4 && z <= 10 || (y >= 8 && x >= 9 && x <= 20 && z >= 3 && z <= 11),
      piocheR: 2.0, pinceauR: 1.9, jetR: 2.6,
      intro: ['Quelque chose est enterré ici', "Sous le sable, une surface lisse et blanche, bien trop plate pour être une pierre. Qu'est-ce que c'est\u00a0?"],
    };
  }

  /* ---------- Le robot géant : debout, de la tête aux pieds ---------- */
  function robot() {
    const BX = 21, BY = 30, BZ = 13, { vox, v } = fabrique(), boite = boiteDans(v);
    const BLANC = 0xe9edf2, GRIS = 0x8a93a0, MARINE = 0x2c3e6b, BLEU = 0x2e6fa3, ROUGE = 0xc0392b, JAUNE = 0xf2c744, CYAN = 0x7fe9f0;
    for (const x0 of [6, 12]) {
      boite(x0, x0 + 2, 1, 2, 4, 9, MARINE, 'pieds');
      boite(x0, x0 + 2, 3, 10, 5, 7, (x, y) => (y === 3 ? GRIS : BLANC), 'jambes');
      boite(x0, x0 + 2, 6, 7, 8, 8, ROUGE, 'jambes');                                   // les genouillères
    }
    boite(6, 14, 11, 12, 5, 7, MARINE, 'bassin'); v(10, 11, 8, JAUNE, 'bassin'); v(10, 12, 8, JAUNE, 'bassin');
    boite(6, 14, 13, 19, 4, 8, (x, y) => (y === 13 ? GRIS : BLEU), 'torse');
    boite(7, 13, 16, 18, 9, 9, (x, y) => (x === 10 && y === 17 ? null : ROUGE), 'torse'); v(10, 17, 9, CYAN, 'cœur'); v(9, 17, 9, JAUNE, 'cœur'); v(11, 17, 9, JAUNE, 'cœur');
    for (const x0 of [3, 15]) {
      boite(x0, x0 + 2, 18, 20, 4, 8, (x, y) => (y === 20 ? JAUNE : ROUGE), 'épaules');
      const xb = x0 === 3 ? 3 : 16;
      boite(xb, xb + 1, 11, 17, 5, 7, BLANC, 'bras'); boite(xb, xb + 1, 9, 10, 5, 7, MARINE, 'bras');
    }
    boite(8, 12, 20, 23, 4, 8, BLANC, 'tête');
    for (let x = 9; x <= 11; x++) { vox.delete(cle(x, 22, 8)); v(x, 22, 8, 0x5be37d, 'tête'); }
    vox.delete(cle(10, 20, 8)); v(10, 20, 8, ROUGE, 'tête'); v(10, 24, 6, ROUGE, 'tête'); v(10, 24, 7, ROUGE, 'tête'); boite(12, 12, 24, 26, 6, 6, JAUNE, 'tête');
    boite(8, 12, 14, 18, 2, 3, GRIS, 'réacteurs'); v(9, 13, 2, 0xff7a1a, 'réacteurs'); v(11, 13, 2, 0xff7a1a, 'réacteurs'); v(9, 13, 3, MARINE, 'réacteurs'); v(11, 13, 3, MARINE, 'réacteurs');
    return {
      id: 'robot', libre: true, nom: 'Robot géant', titre: "C'était un robot géant\u00a0!", sous: 'Personne ne sait qui l\'a construit, ni depuis quand il dort là.',
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.3, azFin: 0.45,
      parts: ['tête', 'épaules', 'torse', 'cœur', 'réacteurs', 'bras', 'bassin', 'jambes', 'pieds'],
      couches: (yy) => yy <= 8 ? 'argile' : yy <= 18 ? 'terre' : 'sable', caillou: 'roche',
      fosse: (x, y, z) => y >= 23 && x >= 6 && x <= 14 && z >= 3 && z <= 9,
      piocheR: 2.2, pinceauR: 2.0, jetR: 2.6,
      intro: ['Quelque chose est enterré ici', "Une tige jaune sort de terre, et dessous, du métal blanc. Qu'est-ce que c'est\u00a0?"],
    };
  }


  /* ---------- Le dragon : endormi, enroulé sur son tas d'or ---------- */
  function dragon() {
    const BX = 32, BY = 17, BZ = 28, cx = 15.5, cz = 13.5, { vox, v } = fabrique();
    const h = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
    const VERT = 0x3f8f4a, VERT2 = 0x2f7a3e, VENTRE = 0xd9c36a, CORNE = 0xf2e6c0, AILE = 0xa5352b;
    // le tas d'or, avec quelques pierres précieuses
    for (let x = 2; x <= 29; x++) for (let z = 2; z <= 25; z++) { const d = ((x - cx) / 13) ** 2 + ((z - cz) / 11) ** 2; if (d > 1) continue; const haut = Math.max(1, Math.round(4.2 * (1 - d)));
      for (let y = 1; y <= haut; y++) { const g = h(x * 3 + y, z * 5); if (y === haut && g < 0.06) v(x, y, z, [0xd8433a, 0x3f8fc0, 0x3fb86a][Math.floor(g * 50)], 'joyaux'); else v(x, y, z, [0xf2c744, 0xe0b030, 0xffe07a][Math.floor(g * 3)], 'or'); } }
    // le corps : un gros boudin enroulé, de la tête (a = 0,35) à la queue (a = 5,9), qui s'affine
    const boule = (px, py, pz, r, c, part, test) => { for (let x = Math.floor(px - r); x <= px + r; x++) for (let y = Math.floor(py - r); y <= py + r; y++) for (let z = Math.floor(pz - r); z <= pz + r; z++) {
      if (y < 2 || (x + 0.5 - px) ** 2 + (y + 0.5 - py) ** 2 + (z + 0.5 - pz) ** 2 > r * r) continue; const k = typeof c === 'function' ? c(x, y, z) : c; if (!test || test(x, y, z)) v(x, y, z, k, typeof part === 'function' ? part(x, y, z) : part); } };
    const R = 7.2, pt = (a) => [cx + R * Math.cos(a), 6.2, cz + R * 0.82 * Math.sin(a)];
    for (let a = 0.75; a <= 5.35; a += 0.06) { const [px, py, pz] = pt(a), fin = Math.max(0, (a - 3.9) / 1.45), r = 2.5 - fin * 1.7, queue = a > 4.2;
      boule(px, py + (queue ? -fin * 1.2 : 0), pz, r, (x, y, z) => (Math.hypot(x + 0.5 - cx, (z + 0.5 - cz) / 0.82) < R - 0.9 && y <= 6) ? VENTRE : (x + y * 2 + z) % 3 ? VERT : VERT2,
        (x, y, z) => queue ? 'queue' : (Math.hypot(x + 0.5 - cx, (z + 0.5 - cz) / 0.82) < R - 0.9 && y <= 6) ? 'ventre' : 'corps'); }
    for (let a = 0.9; a <= 4.4; a += 0.42) { const [px, , pz] = pt(a); v(Math.floor(px), 9, Math.floor(pz), CORNE, 'épines'); if (a < 3.6) v(Math.floor(px), 10, Math.floor(pz), 0xe9a04a, 'épines'); }
    { const [px, , pz] = pt(5.4); for (const [dx, dy, dz] of [[0, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, -1], [2, 0, 0]]) v(Math.floor(px) + dx, 5 + dy, Math.floor(pz) + dz, AILE, 'queue'); }     // la pointe en pique
    // la tête : grosse, posée sur l'or en avant du corps, le museau allongé, les yeux clos, deux grandes cornes
    const tx = Math.floor(cx + R + 1), tz = Math.floor(cz + 1), TETE = 0x4fa85a, TETE2 = 0x3f8f4a;
    for (let x = tx - 3; x <= tx + 2; x++) for (let y = 4; y <= 9; y++) for (let z = tz - 3; z <= tz + 3; z++) { if (((x + 0.5 - tx) / 3.2) ** 2 + ((y + 0.5 - 6.6) / 2.9) ** 2 + ((z + 0.5 - tz - 0.5) / 3.4) ** 2 > 1) continue; v(x, y, z, (x + y + z) % 3 ? TETE : TETE2, 'tête'); }
    for (let k = 1; k <= 5; k++) for (let dx = -2; dx <= 1; dx++) for (let y = 4; y <= (k >= 4 ? 6 : 7); y++) { if (k === 5 && (dx === -2 || dx === 1)) continue; v(tx + dx, y, tz - 3 - k, y === 4 ? VENTRE : y === 5 && k >= 2 && (dx === -2 || dx === 1) ? CORNE : (dx + y + k) % 3 ? TETE : TETE2, 'tête'); }      // le museau, ses dents
    for (const dx of [-2, 1]) { v(tx + dx, 7, tz - 7, 0x2a2224, 'tête'); for (const dz of [-2, -1]) v(tx + dx + (dx < 0 ? -1 : 1), 7, tz + dz, 0x2a2224, 'tête'); v(tx + dx + (dx < 0 ? -1 : 1), 8, tz - 3, TETE2, 'tête'); }      // naseaux, paupières closes, arcades
    for (const dx of [-2, 1]) for (let k = 0; k <= 4; k++) { v(tx + dx, 9 + Math.floor(k * 0.8), tz + 2 + Math.floor(k * 0.7), k >= 3 ? 0xe9a04a : CORNE, 'cornes'); if (k < 2) v(tx + dx, 9, tz + 1 + k, CORNE, 'cornes'); }
    for (const [dx, dy, dz] of [[-2, 0, 0], [-2, 1, -1], [-1, 2, -1], [-2, 3, -2], [-1, 4, -2], [-2, 5, -3], [-1, 6, -3]]) v(tx + dx, 8 + dy, tz - 8 + dz, dy > 3 ? 0xe6e6e6 : 0xb8b8b8, 'fumée');
    // l'aile repliée sur le dos : une voile rouge sombre, trois doigts clairs
    { const [ax, , az] = pt(3.3); for (let u = -5; u <= 5; u++) for (let y = 9; y <= 14 - Math.abs(u); y++) v(Math.floor(ax) + 1, y, Math.floor(az) + u, u === 0 || Math.abs(u) === 4 || y === 14 - Math.abs(u) ? CORNE : (u + y) % 2 ? AILE : 0x8f2a22, 'aile'); }
    return {
      id: 'dragon', libre: true, nom: 'Dragon', titre: "C'était un dragon endormi !", sous: 'Roulé en boule sur son trésor, un filet de fumée au bout du museau. Chut.',
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.6, azFin: 1.0,
      parts: ['fumée', 'aile', 'épines', 'cornes', 'tête', 'corps', 'ventre', 'queue', 'or', 'joyaux'],
      couches: (yy) => yy <= 4 ? 'argile' : yy <= 10 ? 'terre' : 'sable', caillou: 'roche',
      fosse: (x, y, z) => { const [ax, , az] = pt(3.3); return y >= 12 && Math.abs(x - ax - 1) <= 2 && Math.abs(z - az) <= 3; },
      piocheR: 2.6, pinceauR: 2.4, jetR: 3.6,
      intro: ['Une pointe rouge dans la terre', "Une pointe rouge sombre sort de terre, tendue comme une voile. Creuse doucement : on dirait que ça respire. Qu'est-ce que c'est ?"],
    };
  }

  /* ---------- Le vaisseau spatial : un explorateur posé sur ses trois pieds (un dessin à nous) ---------- */
  function vaisseau() {
    const BX = 34, BY = 17, BZ = 28, cz = 13.5, { vox, v } = fabrique(), boite = boiteDans(v);
    const COQUE = 0xe6e8ee, COQUE2 = 0xcfd3da, BANDE = 0xff7a1a, VERRE = 0x4fb3e8, SOMBRE = 0x4a4f5c, FEU1 = 0xffc23a;
    // le fuselage : un cigare ventru, deux bandes orange
    for (let x = 6; x <= 28; x++) { const r = 4.3 * Math.sqrt(Math.max(0, 1 - ((x - 17) / 11.8) ** 2));
      for (let y = 3; y <= 12; y++) for (let z = 8; z <= 19; z++) { if (((y + 0.5 - 7.5) * 1.15) ** 2 + (z + 0.5 - cz) ** 2 > r * r) continue; v(x, y, z, x === 12 || x === 13 || x === 21 ? BANDE : (x + y + z) % 4 ? COQUE : COQUE2, x === 12 || x === 13 || x === 21 ? 'bandes' : 'coque'); } }
    // la bulle du cockpit
    for (let x = 21; x <= 27; x++) for (let y = 9; y <= 12; y++) for (let z = 11; z <= 16; z++) { if (((x + 0.5 - 24) / 3.2) ** 2 + ((y + 0.5 - 9.5) / 2.4) ** 2 + ((z + 0.5 - cz) / 2.4) ** 2 > 1) continue; v(x, y, z, (x + z) % 3 ? VERRE : 0x7fcdf2, 'cockpit'); }
    // les ailes en flèche, un moteur au bout de chacune
    for (let x = 7; x <= 19; x++) { const env = 3 + (19 - x) * 0.6; for (const s of [-1, 1]) for (let k = 3; k <= env; k++) { const z = Math.floor(cz + s * k); v(x, 6, z, k > env - 1 ? BANDE : (x + z) % 3 ? COQUE2 : COQUE, 'ailes'); } }
    for (const s of [-1, 1]) { const z0 = Math.floor(cz + s * 10.5); boite(5, 11, 5, 7, z0 - (s < 0 ? 0 : 1), z0 + (s < 0 ? 1 : 0), (x, y) => x === 5 ? (y === 6 ? FEU1 : BANDE) : x === 11 ? COQUE : SOMBRE, 'réacteurs'); }
    // la dérive, les deux gros réacteurs et leurs tuyères
    for (let x = 6; x <= 11; x++) for (let y = 11; y <= 11 + (11 - x) * 0.7 + 1; y++) v(x, y, 13, y >= 14 ? BANDE : COQUE, 'dérive');
    for (const zc of [11, 16]) for (let x = 4; x <= 6; x++) for (let y = 6; y <= 9; y++) for (let z = zc - 1; z <= zc + 1; z++) { if ((y - 7.5) ** 2 + (z - zc) ** 2 > 2.6) continue; v(x, y, z, x === 4 ? ((y + z) % 2 ? FEU1 : BANDE) : SOMBRE, x === 4 ? 'tuyères' : 'réacteurs'); }
    // les trois pieds, la rampe, l'antenne
    for (const [x, z] of [[23, 13], [10, 9], [10, 18]]) { for (let y = 2; y <= 4; y++) v(x, y, z, SOMBRE, 'pieds'); boite(x - 1, x + 1, 1, 1, z - 1, z + 1, 0x6a7080, 'pieds'); }
    for (let k = 0; k <= 2; k++) boite(15, 17, 3 - k, 3 - k, 18 + k, 18 + k, k % 2 ? 0x8a9098 : 0xb8bec6, 'rampe');
    for (let y = 12; y <= 14; y++) v(16, y, 13, SOMBRE, 'antenne'); for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) v(16 + dx, 15, 13 + dz, dx || dz ? COQUE2 : 0xd8433a, 'antenne');
    return {
      id: 'vaisseau', libre: true, nom: 'Vaisseau', titre: "C'était un vaisseau spatial !", sous: 'Posé sur ses trois pieds, la rampe baissée. D\'où venait-il, et où est passé son équipage ?',
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.5, azFin: 0.8,
      parts: ['antenne', 'dérive', 'cockpit', 'coque', 'bandes', 'ailes', 'réacteurs', 'tuyères', 'pieds', 'rampe'],
      couches: (yy) => yy <= 4 ? 'roche' : yy <= 10 ? 'terre' : 'sable', caillou: 'roche',
      fosse: (x, y, z) => y >= 14 && Math.abs(x - 16) <= 3 && Math.abs(z - 13) <= 3,
      piocheR: 2.6, pinceauR: 2.4, jetR: 3.6,
      intro: ['Une petite lumière rouge', "Une tige de métal surmontée d'un point rouge dépasse au fond de la fosse. Ça ne ressemble à rien de connu. Qu'est-ce que c'est ?"],
    };
  }

  /* ---------- Le bateau pirate : trois mâts, des canons, le pavillon noir ---------- */
  function pirate() {
    const BX = 38, BY = 27, BZ = 17, cz = 8, { vox, v } = fabrique(), boite = boiteDans(v);
    const BOIS1 = 0x6e4527, BOIS2 = 0x8a5a36, BOIS3 = 0x4a3324, OR_P = 0xd9a441, TOILE = 0xf2efe6, TOILE2 = 0xe2dccb;
    const large = (x) => 5.2 * Math.sqrt(Math.max(0, 1 - ((x - 17.5) / 13.6) ** 2));
    // la coque : ventrue, plus étroite vers la quille
    for (let x = 4; x <= 31; x++) for (let y = 2; y <= 7; y++) { const w = large(x) * (0.42 + 0.58 * (y - 2) / 5); if (w < 0.5) continue;
      for (let z = 1; z <= 15; z++) { if (Math.abs(z - cz) > w) continue; v(x, y, z, y === 7 ? OR_P : y === 5 ? BOIS2 : (x + y) % 4 ? BOIS1 : BOIS3, 'coque'); } }
    for (let x = 6; x <= 29; x++) for (let z = 1; z <= 15; z++) if (Math.abs(z - cz) <= large(x) - 1) v(x, 8, z, (x + z) % 2 ? 0xc99a62 : 0xb98a5a, 'pont');
    // le château arrière, ses fenêtres, la barre
    for (let x = 4; x <= 10; x++) for (let y = 8; y <= 11; y++) for (let z = 1; z <= 15; z++) { if (Math.abs(z - cz) > large(x) || Math.abs(z - cz) > 4) continue; const bord = x === 4 || x === 10 || Math.abs(z - cz) >= Math.min(4, Math.floor(large(x))) || y === 11;
      if (!bord) continue; v(x, y, z, y === 11 ? 0xc99a62 : y === 9 && (x === 4 ? z % 2 === 0 : x % 2 === 0) ? 0xf2c744 : y === 8 ? OR_P : BOIS1, 'château'); }
    v(9, 12, cz, BOIS3, 'château'); v(9, 13, cz, OR_P, 'château');
    // le beaupré, à l'avant
    for (let k = 0; k <= 4; k++) v(31 + k, 8 + Math.floor(k / 2), cz, BOIS2, 'beaupré'); v(33, 8, cz, OR_P, 'beaupré');
    // les trois mâts, la vigie, les voiles
    for (let y = 9; y <= 22; y++) v(18, y, cz, BOIS3, 'mâts'); for (let y = 9; y <= 19; y++) v(26, y, cz, BOIS3, 'mâts'); for (let y = 12; y <= 18; y++) v(8, y, cz, BOIS3, 'mâts');
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (dx || dz) { v(18 + dx, 19, cz + dz, BOIS2, 'vigie'); if ((dx + dz) % 2) v(18 + dx, 20, cz + dz, BOIS1, 'vigie'); }
    const voile = (x, y0, y1, d) => { for (let y = y0; y <= y1; y++) for (let z = cz - d; z <= cz + d; z++) v(x, y, z, (y - y0) % 3 === 2 ? TOILE2 : TOILE, 'voiles'); for (let z = cz - d; z <= cz + d; z++) v(x - 1, y1 + 1, z, BOIS3, 'mâts'); };
    voile(19, 11, 17, 5); voile(27, 11, 16, 4); voile(27, 18, 18, 3); voile(9, 14, 17, 3);
    // le pavillon noir, tout en haut
    boite(19, 21, 22, 24, cz, cz, (x, y) => (x === 20 && y === 23) ? TOILE : 0x1f1f24, 'pavillon'); v(18, 23, cz, BOIS3, 'pavillon'); v(18, 24, cz, BOIS3, 'pavillon');
    // les canons, qui pointent par les sabords
    for (const x of [12, 16, 21, 25]) for (const s of [-1, 1]) { const z = cz + s * (Math.floor(large(x)) + 1); v(x, 6, z, 0x2a2a30, 'canons'); v(x, 6, z - s, 0x1f1f24, 'canons'); }
    // le berceau, pour qu'il tienne debout
    for (const x of [11, 24]) boite(x, x + 1, 1, 1, cz - 3, cz + 3, 0x9a7a4a, 'berceau');
    return {
      id: 'pirate', libre: true, nom: 'Bateau pirate', titre: "C'était un bateau pirate !", sous: 'Trois mâts, huit canons, le pavillon noir tout en haut. Il ne manque que la mer.',
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.3, azFin: 0.3,
      parts: ['pavillon', 'vigie', 'voiles', 'mâts', 'beaupré', 'pont', 'château', 'canons', 'coque', 'berceau'],
      couches: (yy) => yy <= 5 ? 'argile' : yy <= 14 ? 'sable' : 'terre', caillou: 'roche',
      fosse: (x, y, z) => y >= 22 && x >= 16 && x <= 23 && Math.abs(z - cz) <= 2,
      piocheR: 2.4, pinceauR: 2.2, jetR: 3.2,
      intro: ['Un bout de tissu noir', "Un carré de tissu noir, avec une tache blanche au milieu, claque au fond de la fosse. Qu'est-ce que c'est ?"],
    };
  }

  /* ---------- Le mammouth écorché : une moitié en fourrure, l'autre ouverte comme une planche d'anatomie ---------- */
  function mammouth() {
    const BX = 36, BY = 23, BZ = 16, zc = 7.5, { vox, v } = fabrique();
    const h = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 37.7 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
    const OS_M = 0xf3e9d2, OS_M2 = 0xe2d6b8, MUSCLE = 0xb5443a, MUSCLE2 = 0x9a362e, PEAU = 0x5a3520, IVOIRE = 0xfff6dc;
    const ell = (x, y, z, cx, cy, cz, rx, ry, rz) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 + ((z + 0.5 - cz) / rz) ** 2 <= 1;
    const trompeX = (y) => 29.5 + (y < 6 ? (6 - y) * 0.45 : 0) - (y > 9 ? (y - 9) * 0.55 : 0);
    const PATTES = [[10.5, 5], [10.5, 10], [20.5, 5], [20.5, 10]];
    const forme = (x, y, z) => { if (y < 1) return false;
      if (ell(x, y, z, 15, 12, zc + 0.5, 8.2, 5.4, 4.6) || ell(x, y, z, 20, 16, zc + 0.5, 3.4, 2.6, 3) || ell(x, y, z, 25, 13.5, zc + 0.5, 4, 4, 3.6) || ell(x, y, z, 24.5, 17.2, zc + 0.5, 2.6, 2.4, 2.6)) return true;
      if (y <= 9 && PATTES.some(([lx, lz]) => (x + 0.5 - lx) ** 2 + (z + 0.5 - lz) ** 2 <= 3.6)) return true;
      if (y >= 2 && y <= 12 && (x + 0.5 - trompeX(y)) ** 2 + (z + 0.5 - zc - 0.5) ** 2 <= 2.6) return true;
      return (x === 6 || x === 7) && y >= 10 && y <= 13 && (z === 7 || z === 8) && (x === 7 || y <= 12); };
    const bord = (x, y, z) => [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].some(([a, b, c]) => !forme(x + a, y + b, z + c));
    const bord2 = (x, y, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !forme(x + a, y + b, z));
    const fourrure = (x, y, z) => [0x7a4a2a, 0x8a5a36, 0x6b3f22, 0x7a4a2a][Math.floor(h(x, y, z) * 4)];
    for (let x = 4; x <= 33; x++) for (let y = 1; y <= 20; y++) for (let z = 1; z <= 14; z++) {
      if (!forme(x, y, z)) continue;
      if (z <= 7) { if (bord(x, y, z)) v(x, y, z, y === 1 ? 0x3a2a20 : fourrure(x, y, z), 'fourrure'); continue; }          // le côté intact : la fourrure seule
      if (z === 8) v(x, y, z, bord2(x, y, z) ? PEAU : (x + y) % 3 ? MUSCLE : MUSCLE2, bord2(x, y, z) ? 'peau' : 'muscles');   // la coupe : la peau en liseré, le muscle dedans
    }
    const os = (x, y, z, part, c) => { if (forme(x, y, z)) v(x, y, z, c || ((x + y + z) % 3 ? OS_M : OS_M2), part); };
    // le crâne, la mâchoire, l'orbite
    for (let x = 21; x <= 28; x++) for (let y = 10; y <= 19; y++) for (let z = 8; z <= 11; z++) if (ell(x, y, z, 25, 13.8, zc + 0.5, 3.1, 3.2, 3) || ell(x, y, z, 24.5, 17, zc + 0.5, 2, 1.9, 2.2)) os(x, y, z, 'crâne');
    v(26, 14, 11, 0x2a2224, 'crâne'); v(27, 14, 11, 0x2a2224, 'crâne'); for (let x = 24; x <= 27; x++) v(x, 10, 9, x % 2 ? IVOIRE : OS_M2, 'crâne');
    // la colonne, du crâne à la queue, et les côtes en arceaux
    for (let x = 7; x <= 22; x++) { const yy = Math.round(12 + 5.4 * Math.sqrt(Math.max(0, 1 - ((x - 15) / 8.2) ** 2)) - 1.6 + (x > 17 ? (x - 17) * 0.35 : 0)); for (const z of [8, 9]) os(x, Math.min(yy, 18), z, 'colonne'); if (x % 2) os(x, Math.min(yy, 18) + 1, 8, 'colonne'); }
    for (const x of [11, 13, 15, 17, 19]) for (let y = 7; y <= 16; y++) for (let z = 9; z <= 12; z++) { const r = Math.hypot((y + 0.5 - 12) * 0.86, z + 0.5 - zc - 0.5); if (Math.abs(r - 3.7) < 0.55) os(x, y, z, 'côtes'); }
    // les organes, derrière les côtes
    const organe = (x0, x1, y0, y1, c, part) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (const z of [8, 9, 10]) if (forme(x, y, z) && !(z === 10 && (x === x0 || x === x1) && (y === y0 || y === y1))) v(x, y, z, typeof c === 'function' ? c(x, y) : c, part); };
    organe(17, 20, 11, 14, (x, y) => (x + y) % 2 ? 0xe98ba0 : 0xf2a3b4, 'poumons');
    organe(16, 17, 8, 10, (x, y) => y === 10 ? 0x8f2a22 : 0xc0392b, 'cœur');
    organe(13, 15, 10, 13, (x, y) => (x + y) % 3 ? 0x8a3a2a : 0x7a3024, 'estomac');
    organe(9, 12, 8, 12, (x, y) => (x * 2 + y) % 3 === 0 ? 0xc48a74 : (x + y) % 2 ? 0xe2b09a : 0xd9a08a, 'intestins');
    // les os des pattes du côté ouvert, la trompe en muscle, la queue
    for (const lx of [10, 20]) for (let y = 1; y <= 9; y++) { os(lx, y, 10, 'pattes'); if (y === 5 || y === 1 || y === 9) { os(lx + 1, y, 10, 'pattes'); os(lx, y, 11, 'pattes'); } }
    for (let y = 2; y <= 12; y++) for (let x = 27; x <= 33; x++) for (const z of [9]) if ((x + 0.5 - trompeX(y)) ** 2 + (z + 0.5 - zc - 0.5) ** 2 <= 2.6) v(x, y, z, y % 2 ? MUSCLE : MUSCLE2, 'trompe');
    for (let y = 2; y <= 12; y++) for (let x = 27; x <= 33; x++) for (const z of [6, 7]) if (forme(x, y, z) && bord(x, y, z)) { vox.delete(cle(x, y, z)); v(x, y, z, fourrure(x, y, z), 'trompe'); }
    // les défenses, des deux côtés : elles plongent puis remontent
    for (const cote of [-1, 1]) { let avant = null;
      for (let k = 0; k <= 9; k += 0.25) { const x = Math.round(26.5 + k * 0.75), y = Math.round(9.5 - 3.2 * Math.sin(k / 9 * Math.PI * 0.85) + (k > 5 ? (k - 5) * 1.25 : 0)), z = Math.round(zc + cote * (2.8 + k * 0.28));
        const pose = (px, py, pz) => { vox.delete(cle(px, py, pz)); v(px, py, pz, k > 7.5 ? 0xf2e6c0 : IVOIRE, 'défenses'); };
        pose(x, y, z); if (k < 4.5) pose(x, y - 1, z);
        if (avant && (avant[0] !== x && avant[1] !== y)) pose(x, avant[1], z);      // un coin : on bouche le trou entre deux cubes en diagonale
        avant = [x, y, z]; } }
    // l'oreille, du côté fourrure
    for (let x = 21; x <= 23; x++) for (let y = 12; y <= 15; y++) if (!(x === 21 && y === 15)) v(x, y, 3, 0x5a3520, 'oreille');
    return {
      id: 'mammouth', libre: true, nom: 'Mammouth écorché', titre: "C'était un mammouth, en coupe !", sous: 'D\'un côté sa fourrure, de l\'autre ce qu\'il y a dedans : le crâne, les côtes, le cœur, les poumons. Fais-le tourner.',
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.3, azFin: 0.35,
      parts: ['défenses', 'trompe', 'oreille', 'fourrure', 'peau', 'muscles', 'crâne', 'colonne', 'côtes', 'poumons', 'cœur', 'estomac', 'intestins', 'pattes'],
      couches: (yy) => yy <= 5 ? 'gel' : yy <= 13 ? 'tasse' : 'neige', caillou: 'glace', dessus: 'neige',
      fosse: (x, y, z) => y >= 18 && Math.abs(x - 24) <= 3 && Math.abs(z - 7.5) <= 3,
      piocheR: 2.4, pinceauR: 2.2, jetR: 3.4,
      intro: ['Une bosse sous la neige', "Une bosse couverte de poils roux dépasse au fond de la fosse. D'un côté elle est douce. De l'autre, on voit de l'os. Qu'est-ce que c'est ?"],
    };
  }

  // ⚠️ Les fouilles d'une expédition (`chaine` dans le code) se suivent, de la plus petite à la plus grande : chacune pose la précédente en `mini`.
  return [amphore(), villa(), rue(), ville(), brasero(), porte(), rempart(), cite(), ramen(), echoppe(), ruelle(), quartier(), trident(), temple(), ile(), atlantide(), pelote(), carrefour(), labyrinthe(), cnossos(), bagel(), boulangerie(), plateau(), montreal(), dinosaure(), voiture(), robot(), dragon(), vaisseau(), pirate(), mammouth()];
})();
// Le nom de chaque expédition (le joueur ne lit jamais « chaîne »), dans l'ordre où elles s'affichent.
const DIG_CHAINES = { pompei: 'Pompéi', dite: 'Dité', tokyo: 'Tokyo', atlantide: 'Atlantide', labyrinthe: 'Le labyrinthe', montreal: 'Montréal' };
if (typeof module !== 'undefined') { module.exports = DIG_NIVEAUX; module.exports.CHAINES = DIG_CHAINES; }
