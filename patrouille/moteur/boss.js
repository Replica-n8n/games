// Les boss. Chacun : une entrée, 2 phases (la seconde reprend les ennemis de sa
// planète), une barre de vie visible. Environ 45 s avec le module de départ :
// à 260 points de vie, le premier boss de la POC tenait plus de 2 minutes.
import { W, SEC } from './constantes.js';
import { tremplin } from './milieux.js';

/** @type {Record<string, { nom: string, pv: number, r: number, maj: (b: any, p: any) => void }>} */
export const BOSS = {
  // Le Grand Caméléon (Jungle). Phase 2 : il se fond dans le feuillage, on ne peut
  // plus le toucher, mais ses yeux le trahissent et le feuillage tremble avant qu'il
  // ressorte.
  cameleon: {
    nom: 'le Grand Caméléon', pv: 135, r: 38,
    maj(b, p) {
      if (b.y < 140) { b.y += 1.2; return; }
      if (b.phase === 1 && b.pv < b.pvMax / 2) {
        b.phase = 2; b.cycle = 0;
        p.message('Il se fond dans le feuillage ! Ses yeux le trahissent', 3 * SEC);
      }
      const a = Math.atan2(p.j.y - b.y, p.j.x - b.x);
      if (b.phase === 1) {
        b.x = W / 2 + Math.sin(b.age * 0.012) * 110;
        if (b.age % 70 === 0) for (let i = -1; i <= 1; i++) p.tirer(b.x, b.y + 20, a + i * 0.2, 2.8, i === 0);
        if (b.age % 240 === 120) for (let i = -1; i <= 1; i++) p.ajouter('scarabee', b.x + i * 22, b.y + 20, { vx: 0, delai: 0 });
        return;
      }
      // Phase 2 : visible 4 s (il attaque), caché 3 s (il change de place)
      b.cycle++;
      if (b.cycle < 240) {
        b.cache = false;
        if (b.cycle % 90 === 20) for (let i = -2; i <= 2; i++) p.tirer(b.x, b.y + 20, a + i * 0.18, 3, Math.abs(i) === 2);
        if (b.cycle === 150) for (let i = 0; i < 12; i++) p.tirer(b.x, b.y, (i / 12) * Math.PI * 2 + b.age * 0.05, 2, i % 3 === 0);
      } else {
        if (!b.cache) { b.cache = true; b.cibleX = p.h.entre(70, W - 70); }
        b.x += Math.sign(b.cibleX - b.x) * Math.min(1.5, Math.abs(b.cibleX - b.x));
        if (b.cycle >= 420) { b.cycle = 0; b.cache = false; for (let i = 0; i < 12; i++) p.tirer(b.x, b.y, (i / 12) * Math.PI * 2, 2, i % 3 === 0); }
      }
    },
  },
  // Le Scarabée géant (Désert). Phase 1 : il va et vient en haut, tire en éventail et
  // pousse des rochers qui roulent vers le rover (on les casse, ou on s'écarte). Phase 2 :
  // il s'enfouit (un sillon de sable le trahit), ressort ailleurs en tirant en rond et
  // pousse trois rochers d'un coup.
  scarabeeGeant: {
    nom: 'le Scarabée géant', pv: 95, r: 40,
    maj(b, p) {
      if (b.y < 130 && !b.cache) { b.y += 1.2; return; }
      if (b.phase === 1 && b.pv < b.pvMax / 2) {
        b.phase = 2; b.cycle = 0;
        p.message("Il s'enfouit dans le sable ! Suis le sillon", 3 * SEC);
      }
      const a = Math.atan2(p.j.y - b.y, p.j.x - b.x);
      const pousse = (dx) => p.ajouter('boulet', b.x + dx, b.y + 34, { vx: Math.max(-1.2, Math.min(1.2, (p.j.x - b.x - dx) / 200)) });
      // Un tremplin sous le rover, réglé pour qu'il y arrive quand le rocher est tout près :
      // on peut sauter par-dessus (le sol défile à 1,2 px par image, le rocher roule à 2,2)
      const sauterPossible = () => tremplin(p, Math.max(40, Math.min(W - 40, p.j.x)), p.j.y - 150, false);
      if (b.phase === 1) {
        b.x = W / 2 + Math.sin(b.age * 0.01) * 120;
        if (b.age % 75 === 0) for (let i = -1; i <= 1; i++) p.tirer(b.x, b.y + 24, a + i * 0.22, 2.8, i === 0);
        if (b.age % 200 === 100) { pousse(0); sauterPossible(); }
        return;
      }
      // Phase 2 : dehors 4 s, sous le sable 2,5 s
      b.cycle++;
      if (b.cycle < 240) {
        b.cache = false;
        if (b.cycle % 80 === 30) for (let i = -2; i <= 2; i++) p.tirer(b.x, b.y + 24, a + i * 0.18, 3, Math.abs(i) === 2);
        if (b.cycle === 120) { pousse(-40); pousse(0); pousse(40); sauterPossible(); }
      } else {
        if (!b.cache) { b.cache = true; b.cibleX = p.h.entre(70, W - 70); }
        b.x += Math.sign(b.cibleX - b.x) * Math.min(1.6, Math.abs(b.cibleX - b.x));
        if (b.cycle >= 390) { b.cycle = 0; b.cache = false; for (let i = 0; i < 10; i++) p.tirer(b.x, b.y, (i / 10) * Math.PI * 2, 2, i % 3 === 0); }
      }
    },
  },
};

/** @param {any} p @param {string} type */
export function creerBoss(p, type) {
  const def = BOSS[type];
  if (!def) throw new Error(`boss inconnu : ${type}`);
  const pv = Math.round(def.pv * (0.6 + 0.4 * (p.intensite ?? 1)));
  p.boss = { type, def, x: W / 2, y: -60, r: def.r, pv, pvMax: pv, age: 0, phase: 1, flash: 0, cache: false, cycle: 0 };
  p.message(`${def.nom[0].toUpperCase()}${def.nom.slice(1)} !`, 2 * SEC);
}
