/* DIG : MAQUETTE d'une fouille libre, la requin-bouledogue de Teeth of the Ocean (games/toto), dans ses trois habits.
   Couleurs et détails repris de `HAB` et `drawShark` de toto/index.html, au niveau 3 : os (casque, plaques et piques
   d'ivoire, lames de la queue), ombre (noir violacé rayé, museau violet, yeux violets, crocs), bio-électrique (bleu,
   veines néon, tentacules de méduse aux bouts clairs). `node tools/dig-maquettes.mjs requin`. */
(() => {
  const cle = (x, y, z) => x + ',' + y + ',' + z;
  const fab = () => { const vox = new Map(); return { vox, v: (x, y, z, c, part) => vox.set(cle(x, y, z), { x, y, z, c, part }) }; };
  const hex = (s) => parseInt(s.slice(1), 16), sombre = (c, k) => ((((c >> 16) & 255) * k) << 16) | ((((c >> 8) & 255) * k) << 8) | ((c & 255) * k);
  const HABITS = {
    os: { nom: 'Os', corps: '#b0b2a8', ventre: '#ece8da', nag: '#979a90', oeil: '#0a0f14' },
    ombre: { nom: 'Ombre', corps: '#231a31', ventre: '#6f6784', nag: '#120c1a', oeil: '#b36bff' },
    elec: { nom: 'Bio-électrique', corps: '#1d6fd6', ventre: '#c2e8ff', nag: '#1647a0', oeil: '#bff6ff' },
  };
  const IVOIRE = 0xefe7d2, NEON = 0x96f5ff, VIOLET = 0x8a4dff;

  function requin(h) {
    const H = HABITS[h], CORPS = hex(H.corps), VENTRE = hex(H.ventre), NAG = hex(H.nag), DOS = sombre(hex(H.corps), 0.72) & 0xffffff;
    const BX = 42, BY = 26, BZ = 21, cz = 10, yc = 11, L = 30, X0 = 7, { vox, v } = fab();
    // u : de -0.45 (la queue) à 0.575 (le museau), comme le dessin de toto ; x = X0 + (u + 0.45) * L
    const X = (u) => Math.round(X0 + (u + 0.45) * L), U = (x) => (x - X0) / L - 0.45;
    const haut = (u) => u > 0.2 ? 0.195 * Math.sqrt(Math.max(0, 1 - ((u - 0.2) / 0.38) ** 2)) : 0.035 + 0.16 * Math.sin((u + 0.45) / 0.65 * Math.PI / 2);
    const bas = (u) => u > 0.2 ? 0.165 * Math.sqrt(Math.max(0, 1 - ((u - 0.2) / 0.38) ** 2)) : 0.03 + 0.135 * Math.sin((u + 0.45) / 0.65 * Math.PI / 2);
    // le corps : une coupe en ellipse à chaque tranche, le dos sombre, les flancs, le ventre clair
    for (let x = X(-0.45); x <= X(0.575); x++) {
      const u = U(x), t = haut(u) * L, b = bas(u) * L, w = (t + b) * 0.42, ym = yc + (t - b) / 2, hh = (t + b) / 2;
      for (let y = Math.floor(yc - b); y <= Math.ceil(yc + t); y++) for (let z = cz - 6; z <= cz + 6; z++) {
        if (((y + 0.5 - ym) / (hh + 0.5)) ** 2 + ((z - cz) / (w + 0.5)) ** 2 > 1) continue;
        const r = (y - yc) / L, ventre = r < -0.01 + 0.025 * Math.sin(u * 14);
        let c = ventre ? VENTRE : r > 0.1 ? DOS : CORPS, part = ventre ? 'ventre' : 'corps';
        if (h === 'ombre' && !ventre && [0.18, 0.07, -0.04, -0.15, -0.26].some((s) => Math.abs(u - s - r * 0.3) < 0.02)) c = 0x0a0610;
        if (h === 'elec' && Math.abs(z - cz) >= w - 0.5 && [0.0, 0.04, 0.08].some((k) => Math.abs(r - (-0.02 + k - u * 0.06)) < 0.012) && u > -0.4 && u < 0.32) { c = NEON; part = 'veines'; }
        if (h === 'os' && !ventre && ((u > 0.3 && r > 0.03) || (u > 0.16 && r > 0.08 && [0.08, -0.04, -0.16, -0.28].some((s) => Math.abs(u - s) < 0.04)))) { c = IVOIRE; part = 'cuirasse'; }
        if (h === 'os' && !ventre && r > 0.06 && [0.08, -0.04, -0.16, -0.28].some((s) => Math.abs(u - s) < 0.04)) { c = IVOIRE; part = 'cuirasse'; }
        v(x, y, z, c, part);
      }
    }
    // les fentes des branchies, l'œil de chaque côté (et ce qu'il porte autour)
    for (const s of [-1, 1]) {
      const wz = (u) => { const t = haut(u) * L, b = bas(u) * L; return Math.round((t + b) * 0.42); };
      for (let k = 0; k < 3; k++) { const x = X(0.22 - k * 0.04); for (let y = yc - 1; y <= yc + 1; y++) v(x, y, cz + s * wz(0.22 - k * 0.04), h === 'ombre' ? 0x0a0610 : 0x2a3540, 'branchies'); }
      const xo = X(0.37), zo = cz + s * (wz(0.37)), yo = yc + 1;
      v(xo, yo, zo, hex(H.oeil), 'yeux');
      if (h === 'os') { v(xo - 1, yo + 1, zo, IVOIRE, 'cuirasse'); v(xo, yo + 1, zo, IVOIRE, 'cuirasse'); v(xo + 1, yo + 1, zo, IVOIRE, 'cuirasse'); }
      // la gueule fermée, un trait sombre et quelques dents (des lames d'os pour l'habit d'os)
      for (let x = X(0.3); x <= X(0.52); x++) v(x, yc - 2, cz + s * wz(U(x)), x % 2 && h !== 'os' ? 0xf6f4ee : h === 'os' ? IVOIRE : 0x1d2a33, 'gueule');
    }
    // le museau violet pointu de l'ombre
    if (h === 'ombre') for (let x = X(0.42); x <= X(0.575); x++) for (let z = cz - 1; z <= cz + 1; z++) v(x, yc + Math.round(haut(U(x)) * L) + (x % 2 ? 0 : -1), z, 0x5b2d8a, 'museau');
    // l'aileron dorsal : un triangle couché vers l'arrière
    for (let x = X(-0.17); x <= X(0.08); x++) { const u = U(x), base = yc + Math.round(haut(u) * L), pointe = Math.round((0.41 - 0.21 * (u + 0.17) / 0.25) * L * (u < -0.12 ? (u + 0.17) / 0.05 : 1));
      for (let y = base; y <= yc + pointe; y++) { const bord = y === yc + pointe || x === X(-0.17); v(x, y, cz, h === 'elec' && bord ? NEON : h === 'ombre' && bord ? VIOLET : y > yc + pointe - 3 ? DOS : NAG, 'aileron'); } }
    if (h === 'os') for (const s of [0.08, -0.04, -0.16, -0.28]) { const x = X(s), y = yc + Math.round(haut(s) * L) + 1; v(x, y, cz, IVOIRE, 'piques'); v(x, y + 1, cz, IVOIRE, 'piques'); }
    // les pectorales, vers le bas et l'arrière, de chaque côté
    for (const s of [-1, 1]) for (let k = 0; k <= 6; k++) { const x = X(0.15) - k, y = yc - 2 - Math.floor(k * 0.8), z = cz + s * (4 + Math.floor(k / 2));
      v(x, y, z, h === 'elec' && k === 6 ? NEON : NAG, 'pectorales'); if (k < 5) v(x - 1, y, z, NAG, 'pectorales'); }
    // la queue en croissant : un grand lobe en haut, un petit en bas
    for (let k = 0; k <= 8; k++) { const x = X(-0.45) - Math.round(k * 0.5), ep = Math.max(1, 3 - Math.floor(k / 3));
      for (let d = 0; d <= ep; d++) for (const z of k < 5 ? [cz - 1, cz, cz + 1] : [cz]) v(x + d, yc + 1 + k - d, z, d === 0 && h === 'os' && k >= 3 ? IVOIRE : d === 0 && h === 'elec' ? NEON : k > 5 ? NAG : DOS, 'queue'); }
    for (let k = 0; k <= 5; k++) { const x = X(-0.45) - Math.round(k * 0.55), ep = k < 3 ? 2 : 1;
      for (let d = 0; d <= ep; d++) for (const z of k < 3 ? [cz - 1, cz, cz + 1] : [cz]) v(x + d, yc - 1 - k + d, z, d === 0 && h === 'os' && k >= 2 ? IVOIRE : d === 0 && h === 'elec' ? NEON : NAG, 'queue'); }
    // les tentacules de méduse de l'habit bio-électrique, en éventail de part et d'autre de la tête
    if (h === 'elec') for (const s of [-1, 1]) for (const r of [0, 1]) { for (let k = 1; k <= 4; k++) v(X(0.28) - k - r * 2, yc + (r ? -1 : 1) - Math.floor(k / 2), cz + s * (5 + k), NEON, 'tentacules'); v(X(0.28) - 5 - r * 2, yc + (r ? -1 : 1) - 3, cz + s * 10, 0xe8fdff, 'tentacules'); }
    // la balafre de son histoire, sur le flanc
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) v(X(0.02) + k, yc + 3 - k, cz + s * 5, h === 'os' ? 0x784646 : 0xe6dcd2, 'balafre');
    // le socle de musée et ses deux tiges
    for (let x = 12; x <= 30; x++) for (let z = cz - 4; z <= cz + 4; z++) v(x, 1, z, (x + z) % 2 ? 0x5a4f48 : 0x4a423c, 'socle');
    for (const x of [16, 26]) for (let y = 2; y < yc - Math.floor(bas(U(x)) * L); y++) v(x, y, cz, 0x8a8a90, 'socle');
    return {
      id: 'requin-' + h, libre: true, nom: 'Requin (' + H.nom + ')', titre: "C'était la requin-bouledogue !", sous: "L'héroïne de Teeth of the Ocean, dans son habit " + H.nom.toLowerCase() + ". Elle a grandi, muté, et la voilà au musée.",
      BX, BY, BZ, vox, base: [BX / 2, 1, BZ / 2], leve: 2, elFin: 0.35, azFin: 0.25,
      parts: [...new Set([...vox.values()].map((e) => e.part))],
      couches: (yy) => yy <= 4 ? 'vase' : yy <= 12 ? 'sable' : 'sablefin', caillou: 'corail', dessus: 'sablefin',
      fosse: (x, y, z) => y >= 20 && x >= X(-0.2) && x <= X(0.1) && Math.abs(z - cz) <= 2,
      piocheR: 2.4, pinceauR: 2.2, jetR: 3.4,
      intro: ['Un aileron dans le sable', "Un aileron dépasse au fond de la fosse. Il ne bouge pas. Qu'est-ce que c'est ?"],
    };
  }
  DIG_NIVEAUX.push(requin('os'), requin('ombre'), requin('elec'));
})();
