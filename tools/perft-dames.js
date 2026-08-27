/* Compte les parties possibles en dames internationales sur les premiers
   coups, et compare aux valeurs de référence publiées par la FMJD.
   C'est l'équivalent de perft.js pour les échecs : si les six profondeurs
   tombent juste, la prise obligatoire, la rafle maximale, le vol de la dame
   et la règle du pion déjà sauté sont toutes correctes. */
const m = require(require("path").join(__dirname, "..", "echecs", "moteur-dames.js"));
const { nouvelle, copie, coups, jouer } = m.__essais;

function perft(e, p){
  const l = coups(e);
  if (p === 1) return l.length;
  let n = 0;
  for (const c of l) { const t = copie(e); jouer(t, c); n += perft(t, p - 1); }
  return n;
}

const attendu = [9, 81, 658, 4265, 27117, 167140];
let ok = true;
const profondeurMax = process.argv[2] ? +process.argv[2] : 5;
for (let p = 1; p <= profondeurMax; p++) {
  const t0 = process.hrtime.bigint();
  const got = perft(nouvelle(), p);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  const bon = got === attendu[p - 1];
  if (!bon) ok = false;
  console.log(`perft(${p}) = ${got}  attendu ${attendu[p - 1]}  ${bon ? "OK" : "ECHEC"}  (${Math.round(ms)} ms)`);
}

/* une rafle forcée, pour voir la règle du maximum à l'œuvre */
const e = nouvelle();
e.plateau = e.plateau.map(() => null);
e.plateau[72] = "P";              // pion blanc
[61, 41, 43].forEach(i => e.plateau[i] = "p");   // trois pions noirs alignés pour la rafle
e.trait = "blanc";
const l = coups(e);
console.log("\nrafle forcée : " + l.length + " coup(s), " + (l[0] ? l[0].prises.length : 0) + " pions pris");
console.log(ok ? "\nTOUT EST VERT" : "\nDES TESTS ECHOUENT");
process.exit(ok ? 0 : 1);
