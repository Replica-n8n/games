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
      id: 'amphore', nom: 'Amphore', titre: "C'était une amphore romaine !", sous: 'Elle a transporté du vin ou de l\'huile, il y a 2 000 ans.',
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
      id: 'villa', nom: 'Villa', titre: "C'était une villa romaine !", sous: 'Ton amphore attendait dans l\'atrium, près du bassin.',
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
      id: 'rue', nom: 'Rue', titre: "C'était une rue de Pompéi\u00a0!", sous: 'Ta villa donnait sur la chaussée, à deux pas des boutiques et du temple.',
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
      id: 'ville', nom: 'Ville', titre: "C'était Pompéi, au pied du Vésuve\u00a0!", sous: "Une ville entière, endormie sous la cendre depuis l'an 79. Ta rue menait du forum au port.",
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

  return [amphore(), villa(), rue(), ville(), dinosaure(), voiture(), robot()];
})();
if (typeof module !== 'undefined') module.exports = DIG_NIVEAUX;
