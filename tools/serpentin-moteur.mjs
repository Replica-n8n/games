import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

/* Le moteur de Serpentin, essaye sans navigateur.
   Il ne touche pas au DOM : c'est tout l'interet, les regles se controlent
   ici, en une seconde, sans telephone et sans capture d'ecran.

   Etape 2 : le deplacement, les fleurs, la longueur, le boost, la graine.
   Les collisions et la mort arrivent a l'etape 5, les potions a l'etape 7. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const Moteur = require(path.join(HERE, "..", "serpentin", "moteur.js"));
const R = Moteur.REGLAGES;

let rates = 0, passes = 0;
function essai(nom, fn) {
  try {
    fn();
    passes++;
    console.log("  ok   " + nom);
  } catch (e) {
    rates++;
    console.log("  RATE " + nom + "\n       " + e.message);
  }
}
function vrai(condition, message) {
  if (!condition) throw new Error(message);
}
function proche(a, b, marge, message) {
  /* Sans ce garde, une valeur manquante donne NaN, et `NaN > marge` est faux :
     l'essai passerait sans rien prouver. C'est arrive. */
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error(`${message} : valeur non chiffree, ${a} et ${b}`);
  }
  if (Math.abs(a - b) > marge) {
    throw new Error(`${message} : ${a} attendu ${b} a ${marge} pres`);
  }
}

/* une seconde de jeu, decoupee comme le ferait un ecran a 60 images */
function seconde(partie, n = 1) {
  for (let i = 0; i < 60 * n; i++) partie.pas(1 / 60);
}
function longueurCorps(s) {
  let t = 0;
  for (let i = 1; i < s.corps.length; i++) {
    t += Math.hypot(s.corps[i].x - s.corps[i - 1].x, s.corps[i].y - s.corps[i - 1].y);
  }
  return t;
}

console.log("\nMoteur, etape 2\n");

essai("une partie neuve pose le joueur au centre, a la longueur de depart", () => {
  const p = Moteur.creer({ graine: 1 });
  proche(p.joueur.x, 0, 0.001, "x du joueur");
  proche(p.joueur.y, 0, 0.001, "y du joueur");
  proche(p.joueur.L, R.longueurDepart * R.uniteParAnneau, 0.001, "longueur de depart");
  vrai(p.score === 0, "le score neuf vaut " + p.score);
  vrai(p.fleurs.length === R.fleurs, "il y a " + p.fleurs.length + " fleurs");
});

essai("il avance dans la direction visee", () => {
  const p = Moteur.creer({ graine: 2, fleurs: 0 });
  p.commander({ angle: 0 });
  seconde(p);
  proche(p.joueur.x, R.vitesse, R.vitesse * 0.02, "distance parcourue en une seconde");
  proche(p.joueur.y, 0, 0.5, "derive laterale");
});

essai("il tourne progressivement, pas d'un coup", () => {
  const p = Moteur.creer({ graine: 3, fleurs: 0 });
  p.commander({ angle: Math.PI });
  p.pas(1 / 60);
  vrai(Math.abs(p.joueur.angle) < R.virage / 30,
       "l'angle a saute a " + p.joueur.angle + " en une seule image");
  seconde(p, 2);
  proche(Math.abs(p.joueur.angle), Math.PI, 0.02, "l'angle apres deux secondes");
});

essai("manger une fleur : un point, deux unites de longueur, et elle repousse ailleurs", () => {
  const p = Moteur.creer({ graine: 4, fleurs: 0 });
  const avant = p.joueur.L;
  p.fleurs.push({ x: 40, y: 0, r: 4 });
  p.commander({ angle: 0 });
  seconde(p);
  vrai(p.score === R.pointsFleur, "score " + p.score);
  proche(p.joueur.L, avant + R.gainFleur, 0.001, "longueur apres la fleur");
  vrai(p.fleurs.length === 1, "il reste " + p.fleurs.length + " fleurs");
  vrai(Math.hypot(p.fleurs[0].x - 40, p.fleurs[0].y) > 1, "la fleur est restee au meme endroit");
});

essai("le nombre de fleurs de l'arene ne bouge pas quand on broute", () => {
  const p = Moteur.creer({ graine: 5 });
  seconde(p, 6);
  vrai(p.fleurs.length === R.fleurs, "il reste " + p.fleurs.length + " fleurs");
  vrai(p.score > 0, "le joueur n'a rien mange en six secondes");
});

essai("le corps ne depasse jamais la longueur gagnee", () => {
  const p = Moteur.creer({ graine: 6 });
  for (let i = 0; i < 60 * 8; i++) {
    p.pas(1 / 60);
    vrai(longueurCorps(p.joueur) <= p.joueur.L + R.echantillon + 0.001,
         "corps " + longueurCorps(p.joueur).toFixed(1) + " pour une longueur de " + p.joueur.L.toFixed(1));
  }
});

essai("foncer va plus vite et coute de la longueur", () => {
  const calme = Moteur.creer({ graine: 7, fleurs: 0 });
  calme.commander({ angle: 0 });
  seconde(calme);

  const vite = Moteur.creer({ graine: 7, fleurs: 0 });
  const avant = vite.joueur.L;
  vite.commander({ angle: 0, fonce: true });
  seconde(vite);

  proche(vite.joueur.x, calme.joueur.x * R.facteurBoost, R.vitesse * 0.03, "distance en fonçant");
  proche(vite.joueur.L, avant - R.coutBoost, 0.05, "longueur perdue en une seconde de boost");
});

essai("on ne peut pas foncer en dessous du plancher", () => {
  const p = Moteur.creer({ graine: 8, fleurs: 0 });
  p.commander({ angle: 0, fonce: true });
  seconde(p, 30);
  const plancher = R.plancherBoost * R.uniteParAnneau;
  proche(p.joueur.L, plancher, 0.05, "longueur au plancher");
  vrai(p.joueur.fonce === false, "le serpent fonce encore alors qu'il est au plancher");
});

essai("meme graine, meme partie", () => {
  const jouer = () => {
    const p = Moteur.creer({ graine: 42 });
    for (let i = 0; i < 200; i++) {
      p.commander({ angle: Math.sin(i / 20) * 2 });
      p.pas(1 / 60);
    }
    return JSON.stringify([p.score, p.joueur.x, p.joueur.y, p.fleurs.slice(0, 5)]);
  };
  vrai(jouer() === jouer(), "deux parties de meme graine ont divergé");
});

essai("aucun acces au DOM", () => {
  vrai(typeof document === "undefined", "il y a un document dans Node, l'essai ne prouve rien");
  const p = Moteur.creer({ graine: 9 });
  seconde(p, 2);
  vrai(p.score >= 0, "le moteur a besoin d'un navigateur");
});

console.log("\nMoteur, etape 5 : mourir\n");

/* joue jusqu'a ce que `fin` soit vrai, ou n secondes au plus */
function jusqua(partie, fin, secondes = 5) {
  for (let i = 0; i < 60 * secondes; i++) {
    partie.pas(1 / 60);
    if (fin()) return i / 60;
  }
  return null;
}

essai("ma tete contre le corps d'un autre : je meurs, lui vit", () => {
  const p = Moteur.creer({ graine: 10, fleurs: 0 });
  /* l'autre descend et laisse un corps en travers de ma route */
  const autre = p.ajouter({ x: 200, y: -100, angle: Math.PI / 2, L: 400 });
  p.commander({ angle: 0 });
  const t = jusqua(p, () => !p.joueur.vivant, 4);
  vrai(t !== null, "personne n'est mort en quatre secondes");
  vrai(p.joueur.vivant === false, "le joueur a survecu");
  vrai(autre.vivant === true, "l'autre est mort alors qu'il n'a rien touche");
  vrai(p.fini === true, "la partie n'est pas marquee finie");
});

essai("sa tete contre mon corps : il meurt, je vis", () => {
  const p = Moteur.creer({ graine: 11, fleurs: 0 });
  const autre = p.ajouter({ x: 60, y: -140, angle: Math.PI / 2, L: 400 });
  p.commander({ angle: 0 });
  const t = jusqua(p, () => !autre.vivant, 4);
  vrai(t !== null, "l'autre n'est pas mort en quatre secondes");
  vrai(p.joueur.vivant === true, "le joueur est mort alors qu'on l'a touche par le corps");
});

essai("tete contre tete : le plus court meurt", () => {
  const p = Moteur.creer({ graine: 12, fleurs: 0 });
  const gros = p.ajouter({ x: 300, y: 0, angle: Math.PI, L: 600 });
  p.commander({ angle: 0 });
  jusqua(p, () => !p.joueur.vivant || !gros.vivant, 4);
  vrai(p.joueur.vivant === false, "le petit a survecu au choc frontal");
  vrai(gros.vivant === true, "le gros est mort dans un choc frontal contre plus petit");
});

essai("un mort devient des fleurs, qui valent plus et ne repoussent pas", () => {
  const p = Moteur.creer({ graine: 13, fleurs: 0 });
  const autre = p.ajouter({ x: 60, y: -140, angle: Math.PI / 2, L: 240 });
  p.commander({ angle: 0 });
  jusqua(p, () => !autre.vivant, 4);
  vrai(p.fleurs.length > 0, "le mort n'a rien laisse");
  vrai(p.fleurs.every((f) => f.mort), "il y a des fleurs qui ne viennent pas du mort");
  const combien = p.fleurs.length;
  const avantL = p.joueur.L, avantScore = p.score;
  /* les fleurs sont restees derriere : le joueur fait demi tour pour les
     ramasser, sinon on ne prouve rien */
  p.commander({ angle: Math.PI });
  seconde(p, 3);
  vrai(p.fleurs.length < combien, "les fleurs du mort n'ont pas ete ramassees");
  vrai(p.score - avantScore >= R.pointsFleurMort, "une fleur de mort n'a pas rapporte plus");
  vrai(p.joueur.L > avantL, "le joueur n'a pas grossi en mangeant le mort");
});

essai("le buisson ralentit et coute de la longueur, mais ne tue pas", () => {
  const monde = { rayon: 1400, obstacles: [{ x: 150, y: 0, r: 30, i: 0 }] };
  const p = Moteur.creer({ graine: 14, fleurs: 0, monde: monde });
  const avant = p.joueur.L;
  p.commander({ angle: 0 });
  seconde(p);
  vrai(p.joueur.vivant === true, "le buisson a tue");
  proche(p.joueur.L, avant * (1 - R.coutBuisson), 0.5, "longueur apres le buisson");
  /* pendant le ralentissement, on avance moins vite */
  const x1 = p.joueur.x;
  seconde(p, 0.5);
  const parcouru = p.joueur.x - x1;
  vrai(parcouru < R.vitesse * 0.5, "le serpent n'a pas ralenti : " + parcouru.toFixed(0));
});

essai("le buisson ne coute pas deux fois dans la meme seconde", () => {
  const monde = { rayon: 1400, obstacles: [{ x: 150, y: 0, r: 90, i: 0 }] };
  const p = Moteur.creer({ graine: 15, fleurs: 0, monde: monde });
  const avant = p.joueur.L;
  p.commander({ angle: 0 });
  seconde(p, 1.2);
  proche(p.joueur.L, avant * (1 - R.coutBuisson), 0.5,
         "le buisson a mordu plusieurs fois en une seconde");
});

essai("le bord fait glisser, il ne tue pas", () => {
  const p = Moteur.creer({ graine: 16, fleurs: 0 });
  p.commander({ angle: 0 });
  seconde(p, 14);
  const d = Math.hypot(p.joueur.x, p.joueur.y);
  vrai(p.joueur.vivant === true, "le bord a tue");
  vrai(d <= p.rayon + 0.5, "le serpent est sorti de l'arene : " + d.toFixed(0));
  proche(d, p.rayon - Moteur.rayonSerpent(p.joueur), 2, "distance au centre");
  /* il glisse : il continue d'avancer le long de la haie */
  const avant = { x: p.joueur.x, y: p.joueur.y };
  seconde(p, 1);
  vrai(Math.hypot(p.joueur.x - avant.x, p.joueur.y - avant.y) > 60,
       "le serpent est reste colle au bord sans glisser");
});

console.log("\nMoteur, etape 6 : les adversaires\n");

const MONDE_PEUPLE = {
  rayon: 1400,
  fleurs: 300,
  obstacles: [],
  bots: { depart: 8, max: 22, parScore: 400 },
};

essai("l'arene se peuple toute seule", () => {
  const p = Moteur.creer({ graine: 20, monde: MONDE_PEUPLE });
  seconde(p, 1);
  vrai(p.serpents.length === 9, "il y a " + p.serpents.length + " serpents avec le joueur");
  vrai(p.serpents.slice(1).every((s) => s.L > 0), "un bot est ne sans longueur");
});

essai("la difficulte monte avec le score et avec le niveau", () => {
  const p = Moteur.creer({ graine: 21, monde: MONDE_PEUPLE, niveau: 1 });
  const debut = p.difficulte();
  vrai(debut.cible === 8, "au depart la cible est " + debut.cible);
  p.score = 4000;
  vrai(p.difficulte().cible === 18, "a 4000 points la cible est " + p.difficulte().cible);
  p.score = 1000000;
  vrai(p.difficulte().cible === 22, "le plafond de 22 n'est pas tenu");

  const haut = Moteur.creer({ graine: 21, monde: MONDE_PEUPLE, niveau: 18 });
  vrai(haut.difficulte().agressivite > debut.agressivite,
       "un joueur de niveau 18 ne trouve pas la prairie plus dangereuse");
  haut.score = 1000000;
  vrai(haut.difficulte().agressivite <= 1, "l'agressivite depasse 1");
});

essai("un chasseur vient sur le joueur, un peureux s'en va", () => {
  const p = Moteur.creer({ graine: 22, fleurs: 0, bots: false });
  p.commander({ angle: 0 });
  const chasseur = p.ajouter({ x: 400, y: 320, angle: 0, L: 700, role: "chasseur" });
  const peureux  = p.ajouter({ x: -400, y: -320, angle: 0, L: 60, role: "peureux" });
  const loin = (s) => Math.hypot(s.x - p.joueur.x, s.y - p.joueur.y);
  const avantC = loin(chasseur), avantP = loin(peureux);
  seconde(p, 1.5);
  vrai(loin(chasseur) < avantC - 40,
       "le chasseur ne s'est pas rapproche : " + avantC.toFixed(0) + " puis " + loin(chasseur).toFixed(0));
  vrai(loin(peureux) > avantP,
       "le peureux ne s'est pas eloigne : " + avantP.toFixed(0) + " puis " + loin(peureux).toFixed(0));
});

essai("un bot evite le buisson qui est sur sa route", () => {
  const monde = { rayon: 1400, obstacles: [{ x: 300, y: 0, r: 60, i: 0 }] };
  const p = Moteur.creer({ graine: 23, fleurs: 0, monde: monde, bots: false });
  const bot = p.ajouter({ x: 0, y: 0, angle: 0, L: 200, role: "brouteur" });
  let touche = 0;
  for (let i = 0; i < 60 * 4; i++) {
    p.pas(1 / 60);
    if (p.evenements.some((e) => e.type === "buisson" && e.serpent === bot)) touche++;
  }
  vrai(touche === 0, "le bot est entre " + touche + " fois dans le buisson");
  vrai(Math.hypot(bot.x, bot.y) > 200, "le bot n'a pas avance");
});

essai("les bots restent dans l'arene", () => {
  const p = Moteur.creer({ graine: 24, monde: MONDE_PEUPLE });
  seconde(p, 20);
  const dehors = p.serpents.filter((s) => s.vivant && Math.hypot(s.x, s.y) > p.rayon + 1);
  vrai(dehors.length === 0, dehors.length + " serpents sont sortis de l'arene");
});

console.log(`\n${passes} passes, ${rates} rates\n`);
process.exit(rates ? 1 : 0);
