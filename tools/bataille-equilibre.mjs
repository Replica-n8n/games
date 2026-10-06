import { chromium } from "playwright";
import { servir } from "./serveur.mjs";

/* Le jeu est-il équitable, et qu'est-ce qui fait gagner ? Des robots jouent des
   centaines d'années entières contre le Maudit, avec le VRAI moteur du jeu
   (bataille/index.html, sans dessin : crochets gele / pas / lance / suivant).
   On ne règle rien ici : on mesure.

   Les robots ne diffèrent que par leur façon de lancer les arcanes :
   - jamais    : ne lance aucun arcane (un joueur qui ne sait pas ce qu'ils font) ;
   - hasard    : les lance n'importe quand, exactement comme le Maudit ;
   - attentif  : les lance au bon moment (les conseils de la fiche du jeu).
   Aucun n'échange ses cartes : le placement se fait à l'aveugle, les cartes
   adverses sont cachées.

   node tools/bataille-equilibre.mjs [parties par robot, 300 par défaut] */

const N = Number(process.argv[2]) || 300;
const srv = await servir();
const navigateur = await chromium.launch();
const p = await navigateur.newPage({ viewport: { width: 360, height: 732 } });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(String(e)));
await p.goto(srv.base + "bataille/?classique", { waitUntil: "load" });
await p.click("#startBtn");

const jouer = (robot, n, sansLui, placement, mod) => p.evaluate(({ robot, n, sansLui, placement, mod }) => {
  const E = window.__essais, PAS = 1 / 30, sorties = [];
  const alea = (a, b) => a + Math.random() * (b - a);
  E.gele(true);
  for (let g = 0; g < n; g++) {
    E.mod(mod || null);
    E.nouvelle();
    if (mod && mod.arcane) E.arcanePlus();
    const [m0] = E.paquets();
    const depart = m0.reduce((a, v) => a + v, 0) + E.etat().unites.filter((u) => u.side > 0).reduce((a, u) => a + ({ V: 11, D: 12, R: 13, A: 14 }[u.r] || Number(u.r)), 0);
    const lances = { moi: 0, lui: 0 };
    let fin = null, duree = 0, mois = 0, cote = 0, cartes = 0;
    while (!fin) {
      mois++;
      if (mod && mod.unMois) E.mod(mois === mod.unMois ? mod : null);
      if (placement) E.ordonne(placement);
      E.lance();
      if (sansLui) E.sansLui();
      let prochain = alea(2.5, 6), garde = 0, avant = null, xs = {};
      while (E.etat().phase !== "result" && garde++ < 20000) {
        E.pas(PAS);
        const c = E.combat();
        if (c.phase !== "fight") continue;
        if (avant !== null && c.lui.length < avant) lances.lui++;
        avant = c.lui.length;
        duree += PAS;
        /* le chemin fait DE CÔTÉ par chaque carte vivante : une carte qui se bat ne doit pas se promener */
        for (const u of c.u) { if (u.mort) continue; if (xs[u.i] === undefined) cartes++; else cote += Math.abs(u.x - xs[u.i]); xs[u.i] = u.x; }
        if (!c.moi.length || robot === "jamais") continue;
        const miens = c.u.filter((u) => u.c > 0 && !u.mort), leurs = c.u.filter((u) => u.c < 0 && !u.mort);
        let choix = null;
        if (robot === "hasard") { if (c.t >= prochain) { choix = c.moi[Math.floor(Math.random() * c.moi.length)]; prochain = c.t + alea(4, 8); } }
        else for (const id of c.moi) {
          const ok = id === "tour" ? c.t > 0.5 && leurs.length > 0
            : id === "mort" ? leurs.some((u) => u.v >= 11 && u.hp / u.max < 0.6 && u.hp > 8)
            : id === "force" ? miens.filter((u) => u.frappe).length >= 3
            : id === "roue" ? miens.some((u) => u.hp / u.max < 0.3) && leurs.some((u) => u.hp / u.max > 0.8)
            : id === "temperance" ? miens.filter((u) => u.max - u.hp >= 15).length >= 2
            : id === "etoile" ? c.tombes[0].length > 0 && (c.tombes[0][c.tombes[0].length - 1] >= 11 || c.t > 8)
            : id === "soleil" ? leurs.filter((u) => u.frappe).length >= 3 : false;
          if (ok) { choix = id; break; }
        }
        if (choix && E.jette(choix, 1)) lances.moi++;
      }
      if (garde >= 20000) { fin = "bloque"; break; }
      E.suivant();
      const e = E.etat();
      if (e.phase === "end") { const [a, b] = E.paquets(); fin = { moi: a.length, lui: b.length }; }
    }
    sorties.push(fin === "bloque" ? { bloque: true } : { moi: fin.moi, lui: fin.lui, mois, depart, duree, lances, cote, cartes });
  }
  E.mod(null);
  E.gele(false);
  return sorties;
}, { robot, n, sansLui, placement, mod });

const pc = (x, n) => ((100 * x) / n).toFixed(0).padStart(3) + " %";
function resume(nom, s) {
  const ok = s.filter((x) => !x.bloque), n = ok.length;
  const g = ok.filter((x) => x.moi > x.lui).length, e = ok.filter((x) => x.moi === x.lui).length;
  const marge = 1.96 * Math.sqrt((g / n) * (1 - g / n) / n) * 100;
  console.log(nom.padEnd(34) + " gagne " + pc(g, n) + " (± " + marge.toFixed(0) + ")  égalité " + pc(e, n) + "  perd " + pc(n - g - e, n)
    + "   écart moyen " + (ok.reduce((a, x) => a + x.moi - x.lui, 0) / n).toFixed(1).padStart(5) + " cartes"
    + "   fin avant décembre " + pc(ok.filter((x) => x.mois < 12).length, n)
    + (s.length - n ? "   ⚠️ " + (s.length - n) + " parties bloquées" : ""));
  return ok;
}

/* --recompenses : les idées de récompenses du rogue-lite, mesurées UNE PAR UNE avant
   d'en construire une seule (méthode de Slay the Spire : ce qu'une carte change au
   taux de victoire). Chacune est donnée au robot « hasard » pour toute l'année, le
   Maudit ne reçoit rien : on lit donc ce qu'elle vaut seule. Sous le bruit, elle
   « n'est pas une carte » ; au-dessus de 12 points, elle écrase les autres.
   Voir bataille/docs/recherche-roguelite.md. */
if (process.argv.includes("--recompenses")) {
  /* Deuxième passe (2026-10-05) : tout se mesure sur UN mois, le premier sauf
     mention, puisque la première passe a montré qu'un avantage gardé toute l'année
     fait gagner à coup sûr. Les valeurs sont celles ajustées après cette passe. */
  const IDEES = [
    ["Vampire : tes cartes se soignent de 20 % de leurs coups", { vampire: 0.2 }],
    ["Infirmerie : toutes tes cartes ont 15 % de vie en plus", { vie: 1.15 }],
    ["Garde royale : tes figures ont 30 % de vie en plus", { vieFig: 1.3 }],
    ["Pari : 40 % de dégâts en plus, 20 % de vie en moins", { degats: 1.4, vie: 0.8 }],
    ["Protégée des Cœurs, renforcée : tes Cœurs frappent 2 fois plus fort", { force: "♥", forceK: 2 }],
    ["Les petits, renforcés : tes 7, 8, 9 frappent comme des As", { petits: 14 }],
    ["Premier sang, renforcé : le premier coup de tes cartes est triplé", { premier: 3 }],
    ["Rempart, renforcé : 30 % de dégâts reçus en moins", { armure: 0.7 }],
    ["Renfort, réduit : une sixième carte, à moitié de sa vie", { renfort: 0.5 }],
    ["Butin, renforcé : le mois gagné rapporte 2 cartes de plus", { butin: 2 }],
    ["Main pleine : un arcane de plus", { arcane: true }],
    ["PAIRE Vampire + Infirmerie", { vampire: 0.2, vie: 1.15 }],
    ["PAIRE Pari + Vampire", { degats: 1.4, vie: 0.8, vampire: 0.2 }],
    ["PAIRE Garde royale + Infirmerie", { vieFig: 1.3, vie: 1.15 }],
    ["AU MOIS 6 Vampire", { vampire: 0.2, unMois: 6 }],
    ["AU MOIS 6 Infirmerie", { vie: 1.15, unMois: 6 }],
    ["TOUTE L'ANNÉE, petite : 3 % de vie en plus", { vie: 1.03, annee: true }],
    ["TOUTE L'ANNÉE, petite : se soigne de 4 % de ses coups", { vampire: 0.04, annee: true }],
  ];
  const taux = (s) => (100 * s.filter((x) => x.moi > x.lui).length) / s.length;
  const bruit = 1.96 * Math.sqrt(0.5 / N) * 100;
  console.log("\n" + N + " années par récompense, robot « hasard », le Maudit ne reçoit rien\n");
  const base = taux(resume("sans récompense (repère)", await jouer("hasard", N, false, 0, null)));
  console.log("");
  const lignes = [];
  /* Deux durées : gardée toute l'année (une « faveur »), ou valable un seul mois, le premier (un « atout »). */
  for (const [nom, mod] of IDEES) { const m = mod.annee ? mod : Object.assign({ unMois: 1 }, mod), t = taux(await jouer("hasard", N, false, 0, m)); lignes.push([nom, t - base]); console.log("  mesuré : " + nom.split(" : ")[0]); }
  lignes.sort((a, b) => b[1] - a[1]);
  const avis = (g) => (g > 12 ? "trop forte" : Math.abs(g) <= bruit ? "sans effet" : g < 0 ? "nuisible  " : "bonne     ");
  const pts = (g) => ((g >= 0 ? "+" : "") + g.toFixed(0)).padStart(4);
  console.log("");
  for (const [nom, g] of lignes) console.log(pts(g) + " " + avis(g) + "   " + nom);
  console.log("\nBruit de la mesure : ± " + bruit.toFixed(0) + " points. Repère : " + base.toFixed(0) + " % de victoires.");
  await navigateur.close();
  srv.arreter();
  process.exit(erreurs.length ? 1 : 0);
}
/* --placement : un joueur dit gagner à coup sûr en rangeant ses cartes de gauche à
   droite. On le mesure à armes égales (robot « hasard »), contre le même robot
   qui ne touche pas à ses cartes. */
if (process.argv.includes("--placement")) {
  console.log("\n" + N + " années par rangement, robot « hasard » (à armes égales avec le Maudit)\n");
  resume("cartes laissées comme données", await jouer("hasard", N, false, 0));
  const taux = (s) => (100 * s.filter((x) => x.moi > x.lui).length) / s.length;
  const monte = taux(resume("rangées de la plus faible à la plus forte", await jouer("hasard", N, false, 1)));
  const descend = taux(resume("rangées de la plus forte à la plus faible", await jouer("hasard", N, false, -1)));
  /* Le tapis est symétrique : ranger dans un sens ou dans l'autre doit revenir au
     même. On tolère le bruit de la mesure (deux fois la marge d'un échantillon). */
  const bruit = 2 * 1.96 * Math.sqrt(0.25 / N) * 100;
  const penche = Math.abs(monte - descend) > bruit;
  console.log("\nÉcart entre les deux sens : " + Math.abs(monte - descend).toFixed(0) + " points (bruit toléré : " + bruit.toFixed(0) + ")" + (penche ? "\n\nÉCHEC : le tapis penche, un sens de rangement fait gagner" : ""));
  await navigateur.close();
  srv.arreter();
  process.exit(erreurs.length || penche ? 1 : 0);
}
console.log("\n" + N + " années par robot, contre le Maudit qui lance ses arcanes au hasard\n");
const R = {};
for (const robot of ["jamais", "hasard", "attentif"]) R[robot] = resume("robot « " + robot + " »", await jouer(robot, N, false));
console.log("\nTémoin : personne ne lance d'arcane (le jeu nu doit être à 50/50)\n");
const temoin = resume("robot « jamais », Maudit muet", await jouer("jamais", N, true));

/* La main de départ décide-t-elle de la partie ? On range les parties du robot
   « hasard » (à armes égales) selon la valeur des 16 cartes reçues. */
const tri = [...R.hasard].sort((a, b) => a.depart - b.depart), q = Math.floor(tri.length / 4);
console.log("\nLa main de départ (robot « hasard », à armes égales), du quart le plus faible au plus fort\n");
for (let i = 0; i < 4; i++) { const t = tri.slice(i * q, i === 3 ? tri.length : (i + 1) * q); console.log("  valeur des 16 cartes " + t[0].depart + " à " + t[t.length - 1].depart + " : gagne " + pc(t.filter((x) => x.moi > x.lui).length, t.length)); }
const tous = [...R.jamais, ...R.hasard, ...R.attentif, ...temoin];
console.log("\nDurée moyenne d'une année : " + (tous.reduce((a, x) => a + x.duree, 0) / tous.length / 60).toFixed(1) + " min de combat (hors placement), "
  + (tous.reduce((a, x) => a + x.mois, 0) / tous.length).toFixed(1) + " mois joués");
console.log("Arcanes lancés par année : robot attentif " + (R.attentif.reduce((a, x) => a + x.lances.moi, 0) / R.attentif.length).toFixed(1)
  + ", Maudit " + (R.attentif.reduce((a, x) => a + x.lances.lui, 0) / R.attentif.length).toFixed(1));
/* Vu par Julie le 2026-10-05 : à deux contre deux, les cartes glissaient d'un bord
   à l'autre du tapis sans frapper (chacune se décalait par rapport à l'autre).
   Une colonne fait 68 px : au-delà de 60 px de côté par carte et par mois, ce
   n'est plus se ranger, c'est se promener. */
const parCarte = tous.reduce((a, x) => a + x.cote, 0) / tous.reduce((a, x) => a + x.cartes, 0);
console.log("Chemin fait de côté : " + parCarte.toFixed(0) + " px par carte et par mois (une colonne = 68 px)");
if (parCarte > 60) { console.log("\nÉCHEC : les cartes se promènent de côté au lieu de se battre"); erreurs.push("promenade"); }
if (erreurs.length) console.log("\nERREURS DE PAGE : " + erreurs.join(" | "));
await navigateur.close();
srv.arreter();
process.exit(erreurs.length ? 1 : 0);
