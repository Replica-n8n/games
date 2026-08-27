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

console.log(`\n${passes} passes, ${rates} rates\n`);
process.exit(rates ? 1 : 0);
