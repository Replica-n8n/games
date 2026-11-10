// DIG : chaque trouvaille a tous ses morceaux, et aucun voxel sans morceau déclaré.
// node tools/dig-modeles.test.js
const NIV = require('../dig/modeles.js');
let faute = 0;
for (const d of NIV) {
  const dessines = new Set([...d.vox.values()].map((e) => e.part));
  const inconnus = [...dessines].filter((p) => !d.parts.includes(p)), absents = d.parts.filter((p) => !dessines.has(p));
  const dehors = [...d.vox.values()].filter((e) => e.x < 0 || e.x >= d.BX || e.y < 1 || e.y >= d.BY - 1 || e.z < 0 || e.z >= d.BZ).length;
  console.log(d.id, d.vox.size, 'voxels', inconnus.length || absents.length || dehors ? { inconnus, absents, dehors } : 'ok');
  if (inconnus.length || absents.length || dehors) faute = 1;
}
process.exit(faute);
