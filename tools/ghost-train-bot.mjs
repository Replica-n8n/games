// Ghost Train : un joueur automatique, pour les tests et l'équilibrage.
// Il vise la menace la plus urgente (assiette, puis le fantôme le plus proche),
// ne vise jamais Lumi ni un leurre, choisit sa voie, ramasse les secrets quand
// rien ne presse, et lâche la détente avant la surchauffe.
//   profil 'expert' : vise juste, lâche à 85 % de chauffe
//   profil 'enfant' : vise avec du retard et un peu à côté, ne regarde pas la chauffe

/** @param {'expert'|'enfant'} profil @param {{voie?: 'g'|'d', graine?: number}} [o] */
export function creeBot(profil = 'expert', o = {}) {
  let s = (o.graine || 1) >>> 0 || 1;
  const alea = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const vise = { x: 160, y: 90 };
  let lache = 0;
  return function jouer(p) {
    const vivants = p.ents.filter((e) => e.etat === 'vit' && e.boite && !e.mort);
    let cible = vivants.find((e) => e.type === 'assiette');
    if (!cible && p.rail === 'aiguillage') cible = vivants.find((e) => e.type === 'levier' && e.cote === (o.voie || 'g'));
    if (!cible) {
      const f = vivants.filter((e) => e.hostile && !(e.type === 'majordome' && e.entree < 1.6)).sort((a, b) => a.z - b.z);
      cible = f[0];
    }
    if (!cible) cible = vivants.find((e) => e.type === 'secret');
    // Ne jamais tirer quand Lumi est sous le viseur
    let tire = !!cible;
    if (cible) {
      const tx = cible.boite.cx, ty = cible.boite.cy;
      const k = profil === 'expert' ? 0.5 : 0.12;
      vise.x += (tx - vise.x) * k; vise.y += (ty - vise.y) * k;
      if (profil === 'enfant') { vise.x += (alea() - 0.5) * 6; vise.y += (alea() - 0.5) * 6; }
    }
    const lumi = vivants.find((e) => e.type === 'lumi');
    if (lumi && vise.x > lumi.boite.x - 4 && vise.x < lumi.boite.x + lumi.boite.w + 4 && vise.y > lumi.boite.y - 4 && vise.y < lumi.boite.y + lumi.boite.h + 4) tire = false;
    if (profil === 'expert') {
      if (p.chauffe > 0.85) lache = 0.6;
      if (lache > 0) { lache -= 1 / 60; tire = false; }
    }
    return { x: vise.x, y: vise.y, tire };
  };
}
