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
await p.goto(srv.base + "bataille/", { waitUntil: "load" });
await p.click("#startBtn");

const jouer = (robot, n, sansLui) => p.evaluate(({ robot, n, sansLui }) => {
  const E = window.__essais, PAS = 1 / 30, sorties = [];
  const alea = (a, b) => a + Math.random() * (b - a);
  E.gele(true);
  for (let g = 0; g < n; g++) {
    E.nouvelle();
    const [m0] = E.paquets();
    const depart = m0.reduce((a, v) => a + v, 0) + E.etat().unites.filter((u) => u.side > 0).reduce((a, u) => a + ({ V: 11, D: 12, R: 13, A: 14 }[u.r] || Number(u.r)), 0);
    const lances = { moi: 0, lui: 0 };
    let fin = null, duree = 0, mois = 0;
    while (!fin) {
      mois++;
      E.lance();
      if (sansLui) E.sansLui();
      let prochain = alea(2.5, 6), garde = 0, avant = null;
      while (E.etat().phase !== "result" && garde++ < 20000) {
        E.pas(PAS);
        const c = E.combat();
        if (c.phase !== "fight") continue;
        if (avant !== null && c.lui.length < avant) lances.lui++;
        avant = c.lui.length;
        duree += PAS;
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
    sorties.push(fin === "bloque" ? { bloque: true } : { moi: fin.moi, lui: fin.lui, mois, depart, duree, lances });
  }
  E.gele(false);
  return sorties;
}, { robot, n, sansLui });

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
if (erreurs.length) console.log("\nERREURS DE PAGE : " + erreurs.join(" | "));
await navigateur.close();
srv.arreter();
process.exit(erreurs.length ? 1 : 0);
