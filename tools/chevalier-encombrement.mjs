/* COMBIEN DE CHOSES Y A-T-IL A L'ECRAN, ET COMBIEN DEMANDENT UNE DECISION ?

   Sa question : « existe-t-il une etude ou une mesure pour savoir quelle
   quantite d'elements maximum on doit afficher pour un enfant ? Au bout d'un
   moment y a tellement de mobs, de graines a terre, de projectiles, de fleches
   ou de boucliers tournoyants, de bonus... Je me pose la question pour ses
   yeux et son cerveau. »

   ⚠️ IL N'EXISTE PAS DE NOMBRE MAXIMUM PUBLIE. Ce qui existe, et qu'on peut
   appliquer ici :
   - on ne saisit d'un coup d'oeil que 3 a 4 objets ; au-dela il faut chercher ;
   - l'ENCOMBREMENT (crowding) : un objet entoure d'autres devient illisible
     meme s'il est assez gros. L'espace libre qu'il lui faut vaut environ la
     MOITIE de sa distance au point regarde (regle de Bouma). Au bord de
     l'ecran, il en faut donc beaucoup ;
   - cette zone est PLUS LARGE chez l'enfant et ne se resserre que vers 10-12
     ans. On prend donc 0,7 au lieu de 0,5 ;
   - ce qui coute, ce n'est pas le nombre d'objets, c'est le nombre de choses
     qui demandent une DECISION en meme temps.

   Cet outil ne juge pas : il compte. Il joue de vraies parties avec le joueur
   simule, regarde ce qui tombe dans un ecran de telephone (412 x 915) centre
   sur le chevalier, et sort, par categorie : la mediane, le pire moment, et
   la part du temps passe au-dessus de quelques seuils. Il mesure aussi :
   - « a decider » : bestioles vivantes et projectiles hostiles a moins de 220
     unites, c'est-a-dire ce qui peut le toucher dans la seconde ;
   - « mal separes » : les dangers dont le voisin le plus proche est plus pres
     que l'espace exige par la regle de Bouma, version enfant.

   SEMENCE, MONDES et PARTIES se reglent par l'environnement. */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { repartir } from "./coeurs.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
require(path.join(HERE, "..", "serpentin", "bestioles.js"));
require(path.join(HERE, "..", "serpentin", "meteo.js"));
const Mondes = require(path.join(HERE, "..", "serpentin", "mondes.js"));
const Moteur = require(path.join(HERE, "..", "serpentin", "moteur.js"));
const Armes = require(path.join(HERE, "..", "serpentin", "armes.js"));

/* un ecran de telephone, en unites du jeu : la camera avance unite pour pixel */
const LARGE = Number(process.env.LARGE || 412);
const HAUT = Number(process.env.HAUT || 915);
/* 0,5 chez l'adulte (Bouma), 0,7 pour un enfant de huit ans */
const BOUMA = Number(process.env.BOUMA || 0.7);
const PRES = 220;            /* ce qui peut le toucher dans la seconde */
const SEMENCE = Number(process.env.SEMENCE || 137);
const PARTIES = Number(process.env.PARTIES || 4);
const MONDES = (process.env.MONDES || "prairie,ile,volcan").split(",");
const PERSO = process.env.PERSO || "chevalier";

function jouer({ monde, graine }) {
  const p = Moteur.creer({ graine, monde: Mondes.tous[monde] });
  const a = Armes.creer(p, PERSO);
  a.donner(Armes.PERSOS[PERSO].armes[0]);
  const tampon = [];
  const PAS = 1 / 30;
  const releves = [];
  let prochainReleve = 0;
  /* ⚠️ ON GARDE LE PIRE MOMENT, pas seulement son chiffre : un nombre ne dit
     pas si l'ecran reste lisible. `chevalier-encombrement-vu.mjs` rejoue cette
     photo dans le navigateur et la capture. */
  let pire = null;

  while (!p.fini && p.temps < p.duree + 90) {
    /* le meme joueur simule que le banc de difficulte : il fuit ce qui
       approche, ramasse ce qui traine, suit le chaton */
    let vx = 0, vy = 0;
    p.voisines(p.joueur.x, p.joueur.y, 220, tampon);
    for (const b of tampon) {
      if (!b.vivante) continue;
      const dx = p.joueur.x - b.x, dy = p.joueur.y - b.y, d = Math.hypot(dx, dy) || 1;
      if (d > 220) continue;
      const poids = (220 - d) / 220;
      vx += (dx / d) * poids * 2.4; vy += (dy / d) * poids * 2.4;
    }
    let proche = null, dm = Infinity;
    for (const g of p.graines.concat(p.objets)) {
      const d = Math.hypot(g.x - p.joueur.x, g.y - p.joueur.y);
      if (d < dm) { dm = d; proche = g; }
    }
    if (proche && dm < 400) {
      vx += ((proche.x - p.joueur.x) / (dm || 1)) * 0.9;
      vy += ((proche.y - p.joueur.y) / (dm || 1)) * 0.9;
    }
    const chaton = p.chat.chaton;
    if (chaton && !p.chat.pattes[2]) {
      const d = Math.hypot(chaton.x - p.joueur.x, chaton.y - p.joueur.y) || 1;
      vx += ((chaton.x - p.joueur.x) / d) * 1.6; vy += ((chaton.y - p.joueur.y) / d) * 1.6;
    }
    const dc = Math.hypot(p.joueur.x, p.joueur.y);
    if (dc > p.rayon - 260) { vx -= (p.joueur.x / (dc || 1)) * 3; vy -= (p.joueur.y / (dc || 1)) * 3; }
    p.commander({ angle: Math.atan2(vy, vx), avance: true });

    const faits = p.pas(PAS);
    a.pas(PAS);
    if (faits.some((e) => e.type === "niveau")) {
      const choix = a.propositions(3);
      if (choix.length) a.appliquer(choix[0]);
    }

    if (p.temps >= prochainReleve) {
      prochainReleve = p.temps + 1;
      const vue = regarder(p, a);
      releves.push(vue);
      if (!pire || vue.aDecider > pire.vue.aDecider) pire = { vue, photo: photographier(p, a) };
    }
  }
  return { monde, graine, tenu: +p.temps.toFixed(0), releves, pire };
}

/* de quoi rejouer l'instant dans le navigateur : ou est chacun, et avec quoi
   se bat le chevalier. Les projectiles de ses armes ne sont pas rejoues : ils
   renaissent d'eux-memes en une seconde de jeu. */
function photographier(p, a) {
  const j = p.joueur;
  const pres = (o) => Math.abs(o.x - j.x) <= LARGE && Math.abs(o.y - j.y) <= HAUT;
  return {
    t: Math.round(p.temps),
    monde: p.monde.nom,
    niveau: p.niveau,
    joueur: { x: j.x, y: j.y, angle: j.angle },
    armes: a.armes.map((x) => ({ nom: x.nom, niveau: x.niveau })),
    objets: a.objets.map((x) => ({ nom: x.nom, niveau: x.niveau })),
    bestioles: p.bestioles.filter((b) => b.vivante && pres(b))
      .map((b) => ({ espece: b.nom, x: b.x, y: b.y, angle: b.angle })),
    graines: p.graines.filter(pres).map((g) => ({ x: g.x, y: g.y, valeur: g.valeur })),
    sol: p.objets.filter(pres).map((o) => ({ sorte: o.sorte, x: o.x, y: o.y })),
    tirs: p.tirs.filter(pres).map((t) => ({ x: t.x, y: t.y, vx: t.vx, vy: t.vy, r: t.r,
                                           vie: t.vie, couleur: t.couleur })),
  };
}

/* ce qui tombe dans l'ecran, centre sur le chevalier */
function regarder(p, a) {
  const j = p.joueur;
  const g = j.x - LARGE / 2, d = j.x + LARGE / 2, h = j.y - HAUT / 2, b = j.y + HAUT / 2;
  const vu = (o) => o && o.x >= g && o.x <= d && o.y >= h && o.y <= b;

  const bestioles = p.bestioles.filter((x) => x.vivante && vu(x));
  const hostiles = bestioles.slice();
  /* tout ce qui vole ou attend par terre et peut lui couter un coeur */
  for (const liste of [p.tirs, p.crachats, p.rochers, p.anneaux, p.flaques, p.nuees, p.toiles]) {
    for (const x of liste) if (vu(x)) hostiles.push(x);
  }
  const graines = p.graines.filter(vu);
  const objets = p.objets.filter(vu);
  const armes = a.projectiles.filter(vu);
  const decor = p.obstacles.filter(vu).length + p.epouvantails.filter(vu).length;

  /* ce qui demande une decision tout de suite */
  const aDecider = hostiles.filter((x) => Math.hypot(x.x - j.x, x.y - j.y) <= PRES).length;

  /* ENCOMBREMENT : pour chaque danger, l'espace libre exige grandit avec sa
     distance au chevalier (regle de Bouma, version enfant). Le voisin compte,
     qu'il soit dangereux ou non : une graine collee a une bestiole gene
     autant. */
  /* ⚠️ SEULEMENT SUR CE QUI EST PROCHE. Applique a tout l'ecran, la regle
     exigerait plus de 300 unites de vide autour d'un objet du bord : elle
     declarait 77 % du temps « mal separe » et ne disait plus rien. Elle vaut
     pour ce que l'enfant doit LIRE maintenant, donc pour les dangers a moins
     de 220 unites, ceux qui peuvent le toucher dans la seconde. */
  const tout = hostiles.concat(graines, objets, armes);
  let malSepares = 0;
  for (const x of hostiles) {
    const ecc = Math.hypot(x.x - j.x, x.y - j.y);
    if (ecc > PRES) continue;
    const exige = BOUMA * ecc;
    let libre = Infinity;
    for (const y of tout) {
      if (y === x) continue;
      const e = Math.hypot(y.x - x.x, y.y - x.y);
      if (e < libre) libre = e;
    }
    if (libre < exige) malSepares++;
  }

  return {
    t: Math.round(p.temps),
    bestioles: bestioles.length,
    hostiles: hostiles.length,
    graines: graines.length,
    objets: objets.length,
    armes: armes.length,
    decor,
    total: hostiles.length + graines.length + objets.length + armes.length + decor,
    aDecider,
    malSepares,
  };
}

const taches = [];
for (const monde of MONDES) {
  for (let i = 1; i <= PARTIES; i++) taches.push({ monde, graine: i * SEMENCE });
}
const parties = await repartir(import.meta.url, taches, jouer);

const tous = parties.flatMap((x) => x.releves);
const nombre = (liste) => liste.slice().sort((m, n) => m - n);
const quantile = (liste, q) => nombre(liste)[Math.min(liste.length - 1, Math.floor(liste.length * q))];
const colonne = (nom) => tous.map((r) => r[nom]);

const CATEGORIES = ["total", "bestioles", "hostiles", "graines", "objets", "armes", "decor", "aDecider", "malSepares"];
const bilan = {};
for (const c of CATEGORIES) {
  const v = colonne(c);
  bilan[c] = {
    mediane: quantile(v, 0.5),
    neuvieme: quantile(v, 0.9),
    pire: Math.max(...v),
  };
}

/* la part du temps passee au-dessus de quelques seuils qui parlent */
const part = (nom, seuil) =>
  Math.round(1000 * colonne(nom).filter((x) => x > seuil).length / tous.length) / 10;

console.log(JSON.stringify({
  ecran: LARGE + " x " + HAUT + ", Bouma " + BOUMA,
  releves: tous.length,
  parties: parties.map((x) => x.monde + " " + x.graine + " : " + x.tenu + " s"),
  bilan,
  partDuTemps: {
    "plus de 4 choses a decider": part("aDecider", 4) + " %",
    "plus de 8 choses a decider": part("aDecider", 8) + " %",
    "plus de 50 graines a l ecran": part("graines", 50) + " %",
    "plus de 150 graines a l ecran": part("graines", 150) + " %",
    "plus de 100 elements en tout": part("total", 100) + " %",
    "plus d un danger proche mal separe": part("malSepares", 1) + " %",
    "plus de 3 dangers proches mal separes": part("malSepares", 3) + " %",
  },
}, null, 2));

const pires = parties.map((x) => x.pire).filter(Boolean).sort((m, n) => n.vue.aDecider - m.vue.aDecider);
if (pires.length) {
  const ou = path.join(HERE, "captures", "encombrement-pire.json");
  fs.mkdirSync(path.dirname(ou), { recursive: true });
  fs.writeFileSync(ou, JSON.stringify(pires[0].photo));
  console.log("pire moment garde dans captures/encombrement-pire.json : " +
    pires[0].vue.aDecider + " choses a decider a " + pires[0].photo.t + " s, " +
    pires[0].photo.monde);
}

console.log("\nOK : ce que l'ecran montre, compte par seconde. Aucun seuil n'est exige :" +
  "\nil n'existe pas de nombre maximum publie, c'est une mesure pour decider.");
process.exit(0);
