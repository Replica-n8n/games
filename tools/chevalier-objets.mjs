import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

/* Ce que l'enfant RENCONTRE vraiment au sol, sur des parties entieres.

   Elle n'est jamais tombee sur un piment en plusieurs parties. Un objet qu'on
   ne croise jamais n'existe pas, quel que soit son poids dans le tirage. Cet
   outil compte donc deux choses tres differentes :

   - ce qui est SEME par le moteur ;
   - ce qui est RAMASSE par un joueur qui joue vraiment.

   Un ecart entre les deux se lit d'un coup d'oeil. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const Bestioles = require(path.join(HERE, "..", "serpentin", "bestioles.js"));
require(path.join(HERE, "..", "serpentin", "meteo.js"));
const Mondes = require(path.join(HERE, "..", "serpentin", "mondes.js"));
const Moteur = require(path.join(HERE, "..", "serpentin", "moteur.js"));
const Armes = require(path.join(HERE, "..", "serpentin", "armes.js"));

Bestioles.reglerEssai(false);
const MONDE = Mondes.prairie;

function jouer(graine, depart) {
  const p = Moteur.creer({ graine, monde: MONDE });
  const a = Armes.creer(p);
  a.donner(depart);
  const tampon = [];
  const semes = {}, pris = {};
  let images = 0, sature = 0;
  const PAS = 1 / 30;

  let avant = p.objets.map((o) => o.sorte);

  while (!p.fini && images < 30 * (p.duree + 2)) {
    let vx = 0, vy = 0;
    p.voisines(p.joueur.x, p.joueur.y, 220, tampon);
    for (const b of tampon) {
      if (!b.vivante) continue;
      const dx = p.joueur.x - b.x, dy = p.joueur.y - b.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > 220) continue;
      const poids = (220 - d) / 220;
      vx += (dx / d) * poids * 2.4;
      vy += (dy / d) * poids * 2.4;
    }
    let proche = null, dm = Infinity;
    for (const g of p.graines.concat(p.objets)) {
      const d = Math.hypot(g.x - p.joueur.x, g.y - p.joueur.y);
      if (d < dm) { dm = d; proche = g; }
    }
    if (proche && dm < 400) {
      const d = dm || 1;
      vx += ((proche.x - p.joueur.x) / d) * 0.9;
      vy += ((proche.y - p.joueur.y) / d) * 0.9;
    }
    const dc = Math.hypot(p.joueur.x, p.joueur.y);
    if (dc > p.rayon - 260) {
      vx -= (p.joueur.x / (dc || 1)) * 3;
      vy -= (p.joueur.y / (dc || 1)) * 3;
    }
    p.commander({ angle: Math.atan2(vy, vx), avance: true });

    /* ⚠️ La place au sol est PARTAGEE : les fruits et legumes attendent d etre
       trouves, les objets aussi. Si le plafond est atteint, plus rien de neuf
       n arrive. On compte combien de temps ca dure. */
    const poses = p.objets.filter((o) => Moteur.LEGUMES.indexOf(o.sorte) < 0).length;
    if (poses >= Moteur.REGLAGES.objetsAuSol) sature++;

    const faits = p.pas(PAS);
    a.pas(PAS);
    if (faits.some((e) => e.type === "niveau")) {
      const choix = a.propositions(3);
      if (choix.length) a.appliquer(choix[0]);
    }

    /* ce qui a disparu du sol a ete ramasse ; ce qui est apparu a ete seme */
    const apres = p.objets.map((o) => o.sorte);
    const reste = apres.slice();
    for (const s of avant) {
      const i = reste.indexOf(s);
      if (i >= 0) reste.splice(i, 1);
      else pris[s] = (pris[s] || 0) + 1;
    }
    for (const s of reste) semes[s] = (semes[s] || 0) + 1;
    avant = apres;

    images++;
  }

  return { tenu: images / 30, semes, pris, sature: sature / 30 };
}

const DEPARTS = Object.keys(Armes.CATALOGUE);
const semes = {}, pris = {};
let tenu = 0, sature = 0, parties = 0;

for (let g = 1; g <= 6; g++) {
  for (const d of DEPARTS) {
    const r = jouer(g * 31, d);
    parties++;
    tenu += r.tenu;
    sature += r.sature;
    for (const k in r.semes) semes[k] = (semes[k] || 0) + r.semes[k];
    for (const k in r.pris) pris[k] = (pris[k] || 0) + r.pris[k];
  }
}

const SORTES = ["coeur", "coffre", "bombe", "glace", "piment"];
const lignes = SORTES.map((s) => ({
  sorte: s,
  semesParPartie: +((semes[s] || 0) / parties).toFixed(2),
  prisParPartie: +((pris[s] || 0) / parties).toFixed(2),
}));
const legumes = Moteur.LEGUMES.reduce((t, n) => t + (semes[n] || 0), 0);

console.log(JSON.stringify({
  parties,
  dureeMoyenne: +(tenu / parties).toFixed(0),
  solPleinParPartie: +(sature / parties).toFixed(1) + " s",
  legumesSemesParPartie: +(legumes / parties).toFixed(2),
  objets: lignes,
}, null, 2));

const piment = lignes.find((l) => l.sorte === "piment");
const jamaisVu = lignes.filter((l) => l.prisParPartie < 0.3);
const ok = piment.prisParPartie >= 0.5 && jamaisVu.length === 0;
console.log(ok
  ? `\nOK : chaque objet est ramasse au moins une fois sur deux parties (piment ${piment.prisParPartie}).`
  : `\nRATE : on ne ramasse presque jamais ${jamaisVu.map((l) => l.sorte).join(", ")}. Le sol est plein ${(sature / parties).toFixed(0)} s par partie.`);
process.exit(ok ? 0 : 1);
