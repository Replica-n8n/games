/* DIG : MAQUETTES de trois fouilles libres (le carnet de mystères, le géant sous la ville, le repaire dans le volcan).
   Rien de ceci n'est dans le jeu : tools/dig-maquettes.mjs l'ajoute à modeles.js le temps de les photographier.
   Des clins d'œil à des IDÉES (un carnet codé, un géant de métal endormi, le repaire de méchant), jamais à un dessin connu. */
(() => {
  const cle = (x, y, z) => x + ',' + y + ',' + z;
  const fab = () => { const vox = new Map(); return { vox, v: (x, y, z, c, part) => vox.set(cle(x, y, z), { x, y, z, c, part }) }; };
  const boiteDans = (v) => (x0, x1, y0, y1, z0, z1, c, part) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) { const k = typeof c === 'function' ? c(x, y, z) : c; if (k !== null) v(x, y, z, k, part); } };
  const bruit = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };

  /* ---------- Le carnet de mystères, ouvert sur un coffre ---------- */
  function carnet() {
    const BX = 23, BY = 13, BZ = 18, { vox, v } = fab(), boite = boiteDans(v);
    boite(3, 18, 1, 4, 4, 13, (x, y, z) => x === 3 || x === 18 || x === 10 || x === 11 ? 0x4a4a52 : y === 4 ? ((x + z) % 2 ? 0x8a5a32 : 0x7a4a2a) : (y + x) % 3 ? 0x6a4228 : 0x5a3820, 'coffre');
    v(10, 3, 3, 0xd9a441, 'coffre'); v(11, 3, 3, 0xd9a441, 'coffre');
    boite(4, 17, 5, 5, 5, 12, (x, y, z) => x === 10 || x === 11 ? 0x4a1a14 : 0x6a2a1e, 'couverture');
    // les pages, et dessus des lignes d'encre, des dessins, un message en code
    for (let x = 5; x <= 16; x++) for (let z = 6; z <= 11; z++) { if (x === 10 || x === 11) continue;
      const ligne = z % 2 === 0 && bruit(x, z) > 0.55, croquis = x >= 12 && x <= 14 && z >= 9 && z <= 10;
      v(x, 6, z, croquis ? 0x3a6a8a : ligne ? 0x6a5a6a : (x + z) % 5 ? 0xf2e6c8 : 0xe6d8b4, croquis ? 'dessins' : ligne ? 'encre' : 'pages'); }
    v(10, 6, 6, 0x2a2230, 'encre'); v(11, 6, 11, 0x2a2230, 'encre');      // l'encre déborde sur la reliure
    for (const [x, y, z] of [[10, 5, 13], [10, 4, 13], [10, 3, 13]]) v(x, y, z, 0xc0392b, 'signet');
    // la loupe posée sur la page de droite
    for (const [a, b] of [[0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [-1, 1], [1, 1], [-1, -1]]) v(14 + a, 7, 8 + b, a && b ? 0x8a6a3a : 0xb8862e, 'loupe');
    v(14, 7, 8, 0xbfe6f2, 'loupe'); v(16, 7, 10, 0x4a3324, 'loupe'); v(17, 7, 11, 0x4a3324, 'loupe');
    // la lanterne, et un éclat de cristal violet
    boite(20, 21, 1, 1, 7, 8, 0x3a3a40, 'lanterne'); boite(20, 21, 2, 3, 7, 8, (x, y, z) => (x + z) % 2 ? 0xffd97a : 0xf2c744, 'lanterne'); boite(20, 21, 4, 4, 7, 8, 0x3a3a40, 'lanterne'); v(20, 5, 7, 0x3a3a40, 'lanterne');
    v(5, 6, 12, 0x8a5ad8, 'cristal'); v(5, 7, 12, 0xb08af0, 'cristal'); v(6, 6, 12, 0x6a3ab8, 'cristal');
    return {
      id: 'carnet', libre: true, nom: 'Carnet de mystères', titre: "C'était un carnet de mystères !", sous: "Des notes, des croquis de créatures, et des messages en code. Quelqu'un menait l'enquête ici.",
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.75,
      parts: ['loupe', 'pages', 'encre', 'dessins', 'couverture', 'signet', 'cristal', 'coffre', 'lanterne'],
      couches: (yy) => yy <= 3 ? 'argile' : 'terre', caillou: 'roche', surface: 'pre',
      fosse: (x, y, z) => (y >= 8 && Math.abs(x - 14) <= 2 && Math.abs(z - 8) <= 2) || (y >= 10 && Math.abs(x - 13) <= 4 && Math.abs(z - 8) <= 4),
      piocheR: 2.0, pinceauR: 1.6, jetR: 2.6,
      intro: ['Un rond de verre', "Un petit rond de verre bleuté brille au fond de la fosse, cerclé de laiton. Dessous, on dirait du papier. Qu'est-ce que c'est ?"],
    };
  }

  /* ---------- Le géant de métal, endormi sous une ville ---------- */
  function geant() {
    const BX = 44, BY = 17, BZ = 26, { vox, v } = fab(), boite = boiteDans(v);
    const ACIER = 0x8a96a8, ACIER2 = 0x6a7486, SOMBRE = 0x3a4252, ORANGE = 0xe07a2a;
    const plaque = (x, y, z) => (x * 3 + z * 5 + y) % 7 === 0 ? ACIER2 : (x + z) % 9 === 0 ? ORANGE : ACIER;
    // couché sur le dos : la tête à gauche, les pieds dressés à droite
    boite(4, 9, 1, 5, 10, 15, (x, y, z) => y === 5 && x >= 6 && x <= 8 && z >= 11 && z <= 14 ? null : plaque(x, y, z), 'tête');
    for (let z = 11; z <= 14; z++) v(7, 5, z, 0xd8302a, 'visière'); v(6, 5, 11, SOMBRE, 'tête'); v(6, 5, 14, SOMBRE, 'tête'); v(8, 5, 12, SOMBRE, 'tête'); v(8, 5, 13, SOMBRE, 'tête');
    for (const z of [10, 15]) { v(5, 6, z, ACIER2, 'tête'); v(4, 7, z, ORANGE, 'tête'); }
    boite(10, 11, 1, 3, 11, 14, SOMBRE, 'torse');                                                       // le cou
    boite(12, 25, 1, 5, 7, 18, plaque, 'torse');
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (Math.abs(dx) + Math.abs(dz) <= 1) v(18 + dx, 6, 12 + dz, dx || dz ? 0x2a8ab8 : 0x7ae0ff, 'cœur');
    for (const [z0, z1] of [[3, 6], [19, 22]]) { boite(12, 15, 1, 5, z0, z1, ORANGE, 'bras'); boite(16, 24, 1, 3, z0, z1, plaque, 'bras'); boite(25, 27, 1, 3, z0, z1, SOMBRE, 'mains'); }
    for (const [z0, z1] of [[8, 11], [14, 17]]) { boite(26, 38, 1, 4, z0, z1, plaque, 'jambes'); boite(39, 41, 1, 7, z0, z1, (x, y) => y >= 6 ? ORANGE : SOMBRE, 'pieds'); }
    // la ville bâtie sur son dos : des rues, des maisons, une tour
    const MAISON = [0xd9cdb4, 0xa5452f, 0xe6dcc6, 0x9a9aa0], TOIT = 0x44444a;
    for (let x = 12; x <= 37; x += 2) for (const z of [8, 10, 14, 16]) {
      const surTorse = x <= 24, surJambe = x >= 26 && (z === 8 || z === 10 || z === 14 || z === 16); if (!surTorse && !surJambe) continue;
      if (surTorse && Math.abs(x - 18) <= 1 && z >= 10 && z <= 14) continue;
      if (bruit(x, z) > 0.4) continue; const y0 = surTorse ? 6 : 5, hh = 1 + Math.floor(bruit(x + 3, z) * 2);
      for (let y = y0; y < y0 + hh; y++) v(x, y, z + (z === 10 || z === 16 ? 1 : 0), MAISON[Math.floor(bruit(x, z + 7) * 4)], 'ville');
      v(x, y0 + hh, z + (z === 10 || z === 16 ? 1 : 0), TOIT, 'ville');
    }
    for (let y = 6; y <= 13; y++) v(14, y, 12, y % 2 ? 0xd9cdb4 : 0xf2e6a0, 'tour'); v(14, 14, 12, 0xd8302a, 'tour');
    return {
      id: 'geant', libre: true, nom: 'Géant sous la ville', titre: "C'était un géant de métal, sous une ville !", sous: "Quelqu'un a bâti toute une ville sur son dos, sans savoir qu'il dormait dessous. Et voilà que sa visière s'allume…",
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.6,
      parts: ['tour', 'ville', 'cœur', 'tête', 'visière', 'torse', 'bras', 'mains', 'jambes', 'pieds'],
      couches: (yy) => yy <= 4 ? 'argile' : 'terre', caillou: 'roche', surface: 'ville',
      fosse: (x, y, z) => (y >= 12 && Math.abs(x - 14) <= 2 && Math.abs(z - 12) <= 2) || (y >= 15 && Math.abs(x - 14) <= 4 && Math.abs(z - 12) <= 4),
      piocheR: 2.5, pinceauR: 2.4, jetR: 3.4,
      intro: ['Une antenne dans la terre', "Une petite tour à fenêtres sort de la fosse, un point rouge tout en haut. Une ville enterrée ? Creuse bien : il y a peut-être plus gros dessous."],
    };
  }

  /* ---------- Le repaire secret, dans un volcan ---------- */
  function repaire() {
    const BX = 39, BY = 23, BZ = 39, C = 19, { vox, v } = fab(), boite = boiteDans(v);
    const R = (y) => 18 - 0.62 * y, IN = (y) => y >= 5 ? Math.min(6.4, R(y) - 1.6) : -1;
    // une COUPE, comme une maquette de musée : un quartier du volcan est retiré du côté de la caméra (azFin), pour voir dedans
    const AZ = 0.6, A0 = Math.atan2(Math.cos(AZ), Math.sin(AZ)), ecart = (a) => Math.abs(Math.atan2(Math.sin(a - A0), Math.cos(a - A0))), COUPE = 0.8;
    for (let y = 1; y <= 20; y++) for (let x = 0; x < BX; x++) for (let z = 0; z < BZ; z++) {
      const r = Math.hypot(x - C, z - C), ext = R(y), int = IN(y); if (r > ext || (int > 0 && r < int)) continue;
      const a = Math.atan2(z - C, x - C), e = ecart(a); if (y >= 2 && e < COUPE) continue;
      const tranche = (e - COUPE) * r < 1.4, peau = r > ext - 1.3 || (int > 0 && r < int + 1.3) || y === 1 || tranche; if (!peau) continue;
      const coulee = r > ext - 1.3 && y >= 6 && y <= 18 && [2.2, -0.6, 3.0].some((c) => Math.abs(a - c) < 0.09 + bruit(y, 3) * 0.06);
      v(x, y, z, coulee ? (y % 2 ? 0xff7a1a : 0xffa63a) : tranche && r < ext - 1.3 && (int < 0 || r > int + 1.3) ? (bruit(x, y + z) > 0.5 ? 0x6a2a1a : 0x8a3a1a) : y >= 18 ? (bruit(x, z + y) > 0.5 ? 0x6a3a2a : 0x5a3024) : bruit(x + y, z) > 0.5 ? 0x3a3438 : 0x4a4248, coulee ? 'lave' : 'volcan');
    }
    // la porte blindée dans la pente, rayée jaune et noir
    { const a = A0 - 1.35, ca = Math.cos(a), sa = Math.sin(a);
      for (let t = -3; t <= 3; t++) for (let y = 1; y <= 5; y++) { const r = R(y) + 0.4, x = Math.round(C + r * ca - t * sa), z = Math.round(C + r * sa + t * ca);
        v(x, y, z, Math.abs(t) === 3 || y === 5 ? ((t + y + 9) % 2 ? 0xf2c744 : 0x2a2a30) : y % 2 ? 0x8a96a8 : 0x7a8698, 'porte'); } }
    // dans le cratère : la plateforme, la fusée et sa tour
    for (let x = C - 6; x <= C + 6; x++) for (let z = C - 6; z <= C + 6; z++) if (Math.hypot(x - C, z - C) < IN(5) + 0.5) v(x, 5, z, (x + z) % 2 ? 0x8a8a90 : 0x7a7a82, 'plateforme');
    for (let y = 6; y <= 17; y++) for (const [a, b] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) v(C + a, y, C + b, a || b ? (y === 12 ? 0xd8302a : 0xf2f2f4) : 0xe6e6ea, 'fusée');
    v(C, 18, C, 0xd8302a, 'fusée'); v(C, 19, C, 0xd8302a, 'fusée');
    for (const [a, b] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) { v(C + a, 6, C + b, 0xd8302a, 'fusée'); v(C + a, 7, C + b, 0xd8302a, 'fusée'); }
    for (let y = 6; y <= 15; y++) v(C + 4, y, C, y % 3 ? 0x5a5a62 : 0xf2c744, 'tour'); v(C + 3, 13, C, 0x5a5a62, 'tour'); v(C + 2, 13, C, 0x5a5a62, 'tour');
    // le pupitre, le grand écran, le fauteuil qui pivote, et le chat blanc
    boite(C - 2, C + 2, 6, 6, C - 4, C - 4, 0x4a4a52, 'pupitre'); for (let x = C - 2; x <= C + 2; x++) v(x, 7, C - 4, (x % 2) ? 0xff4a3a : 0x3ad07a, 'pupitre');
    boite(C - 3, C + 3, 8, 10, C - 6, C - 6, (x, y) => y === 9 && x === C ? 0xf2c744 : (x + y) % 2 ? 0x2a8ab8 : 0x3aa0d0, 'écran');
    v(C, 6, C - 2, 0x2a2a30, 'fauteuil'); v(C, 7, C - 2, 0x8a1a28, 'fauteuil'); v(C, 7, C - 1, 0x8a1a28, 'fauteuil'); v(C, 8, C - 1, 0x8a1a28, 'fauteuil');
    v(C, 8, C - 2, 0xf6f4f0, 'chat'); v(C - 1, 8, C - 2, 0xf6f4f0, 'chat'); v(C - 1, 9, C - 2, 0xf6f4f0, 'chat');
    return {
      id: 'repaire', libre: true, nom: 'Repaire secret', titre: "C'était un repaire secret, dans un volcan !", sous: "Une porte blindée dans la pente, une fusée prête à partir, un grand écran et un fauteuil qui pivote. Le chat blanc garde la place.",
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.5, azFin: 0.6,
      parts: ['fusée', 'tour', 'volcan', 'lave', 'plateforme', 'pupitre', 'écran', 'fauteuil', 'chat', 'porte'],
      couches: (yy) => yy <= 4 ? 'braise' : yy <= 11 ? 'suie' : 'cendre', caillou: 'lave', dessus: 'cendre',
      fosse: (x, y, z) => y >= 18 && Math.hypot(x - C, z - C) <= 3.5,
      piocheR: 2.6, pinceauR: 2.4, jetR: 3.6,
      intro: ['Une pointe rouge', "Au fond de la fosse, une pointe rouge et blanche, toute lisse. Ce n'est pas de la roche. Qu'est-ce que c'est ?"],
    };
  }

  DIG_NIVEAUX.push(carnet(), geant(), repaire());
})();
