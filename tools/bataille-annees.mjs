import { chromium } from "playwright";
import { servir } from "./serveur.mjs";

/* Les années maudites sont-elles une VRAIE échelle ? Des robots jouent des années
   entières du jeu à atouts (gravures, atouts, atlas), avec le vrai moteur et sans
   dessin, à chaque marche de 0 (l'année de base) à 8. Ils choisissent gravures,
   cartes et atouts AU HASARD (crochet `auto`) et lancent leurs arcanes au hasard,
   comme le Maudit : c'est un joueur moyen, pas un bon joueur.
   Ce qu'on attend : l'année de base autour de 50 %, puis une pente qui descend à
   chaque marche, sans marche plate ni falaise.

   node tools/bataille-annees.mjs [années par marche, 200 par défaut] [--tout]
   --tout : tout l'atlas ouvert (les 12 déblocages dans le tirage). */

const N = Number(process.argv[2]) || 200;
const TOUT = process.argv.includes("--tout");
const srv = await servir();
const navigateur = await chromium.launch();
const p = await navigateur.newPage({ viewport: { width: 360, height: 732 } });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(String(e)));
await p.goto(srv.base + "bataille/", { waitUntil: "load" });
await p.click("#startBtn");

const jouer = (pal, n, table) => p.evaluate(({ pal, n, tout, table }) => {
  const E = window.__essais, PAS = 1 / 30, sorties = [];
  E.gele(true); E.auto(true); E.atlas({ joue: pal, tout }); const avant = E.paliers(); if (table) E.paliers(table);
  for (let g = 0; g < n; g++) {
    E.nouvelle();
    let fin = null, mois = 0, gravures = 0;
    while (!fin) {
      mois++;
      E.lance();
      let prochain = 2.5 + Math.random() * 3.5, garde = 0;
      while (E.etat().phase !== "result" && garde++ < 20000) {
        E.pas(PAS);
        const c = E.combat();
        if (c.phase === "fight" && c.moi.length && c.t >= prochain) { E.jette(c.moi[Math.floor(Math.random() * c.moi.length)], 1); prochain = c.t + 4 + Math.random() * 4; }
      }
      if (garde >= 20000) { fin = "bloque"; break; }
      E.suivant();
      if (E.etat().phase === "end") { const [a, b] = E.paquets(); fin = { moi: a.length, lui: b.length }; }
    }
    const gr = E.gravures();
    sorties.push(fin === "bloque" ? { bloque: true } : { moi: fin.moi, lui: fin.lui, mois, gMoi: gr[0].length, gLui: gr[1].length });
  }
  E.paliers(avant); E.auto(false); E.gele(false);
  return sorties;
}, { pal, n, tout: TOUT, table });

const gagne = (s) => { const ok = s.filter((x) => !x.bloque); return ok.filter((x) => x.moi > x.lui).length / ok.length * 100; };
/* --gravures : ce que vaut chaque gravure. Le robot commence l'année de base avec
   TROIS cartes portant la même gravure (une seule se perdrait dans le bruit). Une
   gravure qui fait gagner beaucoup plus que les autres écrase le choix. */
if (process.argv.includes("--gravures")) {
  const essai = (g) => p.evaluate(({ n, g }) => {
    const E = window.__essais, PAS = 1 / 30; let gagnees = 0;
    E.gele(true); E.auto(true); E.atlas({ joue: 0, tout: true });
    for (let k = 0; k < n; k++) {
      E.nouvelle();
      if (g) { const d = E.paquets()[0]; for (let i = 0; i < 3 && i < d.length; i++) E.grave(1, i, g); }
      let fin = null, garde = 0;
      while (!fin && garde < 200000) {
        E.lance(); let prochain = 2.5 + Math.random() * 3.5;
        while (E.etat().phase !== "result" && garde++ < 200000) { E.pas(PAS); const c = E.combat(); if (c.phase === "fight" && c.moi.length && c.t >= prochain) { E.jette(c.moi[Math.floor(Math.random() * c.moi.length)], 1); prochain = c.t + 4 + Math.random() * 4; } }
        E.suivant(); if (E.etat().phase === "end") { const [a, b] = E.paquets(); fin = a.length > b.length; }
      }
      if (fin) gagnees++;
    }
    E.auto(false); E.gele(false); return gagnees / n * 100;
  }, { n: N, g });
  console.log("\n" + N + " années par gravure, trois cartes gravées dès janvier\n");
  const base = await essai(null);
  console.log("sans gravure de départ".padEnd(24) + base.toFixed(0).padStart(4) + " %");
  for (const g of ["epine", "phenix", "ailes", "bouclier", "sangsue", "criniere", "eclair", "heritage", "givre"]) { const t = await essai(g); console.log(g.padEnd(24) + t.toFixed(0).padStart(4) + " %   " + (t - base >= 0 ? "+" : "") + (t - base).toFixed(0)); }
  await navigateur.close(); srv.arreter(); process.exit(erreurs.length ? 1 : 0);
}
/* --pieces : chaque malédiction SEULE, pour savoir combien de points elle coûte */
if (process.argv.includes("--pieces")) {
  const B = { g: 0, f: 1, n: 3, eg: 0, a: 0 };
  const PIECES = [["rien (repère)", {}], ["1 carte gravée", { g: 1 }], ["2 cartes gravées", { g: 2 }], ["3 cartes gravées", { g: 3 }], ["vie +2 %", { f: 1.02 }], ["vie +4 %", { f: 1.04 }], ["vie +8 %", { f: 1.08 }],
    ["atout parmi deux", { n: 2 }], ["atout imposé (un seul)", { n: 1 }], ["grave à égalité", { eg: 1 }], ["un arcane de plus", { a: 1 }]];
  console.log("\n" + N + " années par malédiction, chacune seule\n");
  let base = null;
  for (const [nom, m] of PIECES) { const t = gagne(await jouer(1, N, [B, Object.assign({}, B, m)])); if (base === null) base = t; console.log(nom.padEnd(24) + t.toFixed(0).padStart(4) + " %   " + (t - base >= 0 ? "+" : "") + (t - base).toFixed(0)); }
  await navigateur.close(); srv.arreter(); process.exit(erreurs.length ? 1 : 0);
}
console.log("\n" + N + " années par marche, robot au hasard" + (TOUT ? ", tout l'atlas ouvert" : ", atlas vide") + "\n");
const taux = [];
for (let pal = 0; pal <= 8; pal++) {
  const s = await jouer(pal, N), ok = s.filter((x) => !x.bloque), n = ok.length;
  const g = ok.filter((x) => x.moi > x.lui).length / n * 100;
  taux.push(g);
  console.log((pal ? "année maudite " + pal : "année de base  ").padEnd(16) + "  gagne " + g.toFixed(0).padStart(3) + " %"
    + "   gravures en fin d'année : toi " + (ok.reduce((a, x) => a + x.gMoi, 0) / n).toFixed(1) + ", Maudit " + (ok.reduce((a, x) => a + x.gLui, 0) / n).toFixed(1)
    + (s.length - n ? "   ⚠️ " + (s.length - n) + " bloquées" : ""));
}
const bruit = 1.96 * Math.sqrt(0.25 / N) * 100;
console.log("\nBruit de la mesure : ± " + bruit.toFixed(0) + " points par marche.");
if (erreurs.length) console.log("\nERREURS DE PAGE : " + erreurs.join(" | "));
await navigateur.close();
srv.arreter();
process.exit(erreurs.length ? 1 : 0);
