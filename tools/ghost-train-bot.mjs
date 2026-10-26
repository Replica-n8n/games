// Ghost Train : un joueur automatique, pour les tests et l'équilibrage.
// Il vise la menace la plus urgente (projectile, puis le fantôme le plus proche),
// ne vise jamais Lumi ni un leurre, bascule le levier vers la voie voulue, ramasse
// les secrets quand rien ne presse, et lâche la détente avant la surchauffe.
// Dès la Bibliothèque il flashe ce qui se cache (Drap, Ombre), les livres du
// Bibliothécaire et le bouclier de la Gouvernante ; il lance la super-attaque
// pleine ; l'expert slamme au Grenier.
//   profil 'expert' : vise juste, lâche à 85 % de chauffe, slamme
//   profil 'enfant' : vise avec du retard et un peu à côté, ne regarde pas la chauffe,
//     flashe en retard, ne slamme jamais
import { touchable } from '../ghost-train/moteur/actions.js';
import { estTir } from '../ghost-train/moteur/fantomes.js';

/** @param {'expert'|'enfant'} profil @param {{voie?: 'g'|'d', graine?: number}} [o] */
export function creeBot(profil = 'expert', o = {}) {
  let s = (o.graine || 1) >>> 0 || 1;
  const alea = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const vise = { x: 160, y: 90 };
  let lache = 0, image = 0, attenteFlash = 0;
  return function jouer(p) {
    image++;
    const A = p.mission.actions || {};
    const vivants = p.ents.filter((e) => e.etat === 'vit' && e.boite && !e.mort);
    let cible = vivants.find((e) => estTir(e));
    // à l'aiguillage : basculer le levier s'il ne donne pas la voie voulue, sinon attendre
    if (!cible && p.rail === 'aiguillage') { if (p.levier && p.levier.cote !== (o.voie || 'g')) cible = p.levier; else return { x: vise.x, y: vise.y, tire: false }; }
    // ce qu'il faudrait flasher : un Drap ou une Ombre cachés, un boss protégé
    let aFlasher = null;
    if (A.flash) {
      aFlasher = vivants.find((e) => (e.type === 'drap' || e.type === 'ombre') && !touchable(p, e) && e.z - p.camZ < 9)
        || vivants.find((e) => (e.type === 'bibliothecaire' && p.ents.some((l) => l.type === 'livre' && !l.mort) && e.entree >= 1.6) || (e.type === 'gouvernante' && e.bouclier && e.entree >= 1.6));
    }
    if (!cible) {
      const f = vivants.filter((e) => e.hostile && touchable(p, e)).sort((a, b) => a.z - b.z);
      cible = f[0];
    }
    if (!cible && aFlasher) cible = aFlasher;
    if (!cible) cible = vivants.find((e) => e.type === 'secret');
    let tire = !!cible, flash = false, sup = false;
    if (cible) {
      let tx = cible.boite.cx, ty = cible.boite.cy;
      // le slam : le viseur tire à l'opposé du fantôme qui se débat, par petits coups
      if (profil === 'expert' && A.slam && cible.tenu && image % 24 < 16) { tx -= cible.traction.dx * 14; ty -= cible.traction.dy * 14; }
      const k = profil === 'expert' ? 0.5 : 0.12;
      vise.x += (tx - vise.x) * k; vise.y += (ty - vise.y) * k;
      if (profil === 'enfant') { vise.x += (alea() - 0.5) * 6; vise.y += (alea() - 0.5) * 6; }
    }
    if (aFlasher && p.flashCD <= 0) {
      const b = aFlasher.boite, d = Math.hypot(b.cx - vise.x, b.cy - vise.y);
      if (cible === aFlasher || d < 30) {
        if (profil === 'expert' ? d < 14 : (attenteFlash += 1 / 60) > 0.8 && d < 20) { flash = true; attenteFlash = 0; }
      }
    }
    if (A.super && p.jauge >= 1) {
      const n = vivants.filter((e) => e.hostile).length;
      if (n >= 3 || (p.boss && p.boss.etat === 'vit' && p.boss.entree >= 1.6)) sup = true;
    }
    // Ne jamais tirer quand Lumi est sous le viseur : la marge du viseur de la partie + 2 pixels
    const M = p.options.marge + 2, lumi = vivants.find((e) => e.type === 'lumi');
    if (lumi && vise.x > lumi.boite.x - M && vise.x < lumi.boite.x + lumi.boite.w + M && vise.y > lumi.boite.y - M && vise.y < lumi.boite.y + lumi.boite.h + M) tire = false;
    if (profil === 'expert') {
      if (p.chauffe > 0.85) lache = 0.6;
      if (lache > 0) { lache -= 1 / 60; tire = false; }
    }
    return { x: vise.x, y: vise.y, tire, flash, super: sup };
  };
}
