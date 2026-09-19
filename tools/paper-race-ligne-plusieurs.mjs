import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";

/* Paper Race EN LIGNE à plusieurs (relais pr-2), de bout en bout.
   Le relais doit tourner en local : `npx wrangler dev --port 8787` dans
   serveur-paper-race/. Ce contrôle prouve :
   - une salle de 4 places, sans pièges : trois téléphones entrent par le lien,
     l'hôte démarre, la place vide roule en fantôme (calculé par l'hôte) ;
   - les TROIS écrans montrent la même course, coup après coup ;
   - un coup préparé pendant que les autres jouent part tout seul à son tour ;
   - un joueur qui recharge reprend sa place ; un joueur qui part est arrêté
     par l'hôte (délai d'absence raccourci à 3 s pour l'essai) et reste un
     obstacle ; la course va jusqu'au classement de 4 ;
   - la revanche retire une grille ; une salle v7 (sans places) se joue encore
     à deux avec les règles d'origine.
   JEU=... et RELAIS=... : la même chose contre la production. */

let echecs = 0;
const verifier = (nom, ok, detail) => {
  console.log((ok ? "ok    " : "ECHEC ") + nom + (!ok && detail !== undefined ? "  " + JSON.stringify(detail).slice(0, 500) : ""));
  if (!ok) echecs++;
};
const site = process.env.JEU ? null : await servir();
const BASE = process.env.JEU || site.base + "paper-race/";
const RELAIS = process.env.RELAIS || "http://127.0.0.1:8787";
const URL_JEU = BASE + (process.env.JEU ? "" : "?absence=" + (process.env.ABSENCE || 3000) + (process.env.RELAIS ? "&relais=" + process.env.RELAIS : ""));
const navigateur = await chromium.launch();
const erreurs = [];
async function telephone() {
  const ctx = await navigateur.newContext({ ...devices["Pixel 9"], reducedMotion: "reduce" });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/WebSocket|ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(m.text())) erreurs.push(m.text()); });
  return { ctx, p };
}
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const vue = (p) => p.evaluate(() => R ? JSON.stringify({ c: R.cars.map((c) => [c.p, c.coups, !!c.fini, !!c.abandon]), t: R.turn, m: R.manche, g: R.grille, f: finie(R) }) : null);
const jouerSiTour = (p) => p.evaluate(() => {
  if (!R || finie(R) || occupe() || R.turn !== ligne.siege) return false;
  const q = aiChoice(R, "normal", Math.random);
  if (q === null) { $("go").click(); return true; }
  choisir(opts.findIndex((o) => o.p[0] === q[0] && o.p[1] === q[1]));
  $("go").click();
  return true;
});
// fait tourner la course : chacun joue quand c'est son tour, jusqu'à la condition
async function rouler(tels, jusque, max = 900) {
  for (let i = 0; i < max; i++) {
    for (const t of tels) await jouerSiTour(t.p).catch(() => false);
    if (await jusque()) return true;
    await attendre(60);
  }
  return false;
}

const A = await telephone(), B = await telephone(), C = await telephone();
await A.p.goto(URL_JEU, { waitUntil: "networkidle" });
await A.p.evaluate(() => { localStorage.clear(); localStorage.setItem("paper-race.reglages.v1", JSON.stringify({ mode: "duo", places: 4, pieges: false, circuit: "monza" })); });
await A.p.reload({ waitUntil: "networkidle" });
await A.p.click("#enligne");
const acc = await A.p.evaluate(() => ({ voitures: !$("voitures").hidden, pieges: !$("pieges").hidden && $("pieges").getAttribute("aria-checked"), n: nbPlaces() }));
verifier("en ligne : on choisit le nombre de voitures et les pièges", acc.voitures && acc.pieges === "false" && acc.n === 4, acc);
await A.p.click("#jouer");
await A.p.waitForFunction(() => !$("salle").hidden && ligne.connecte && ligne.v2, null, { timeout: 10000 });
const code = await A.p.evaluate(() => ligne.code);
const s0 = await A.p.evaluate(() => ({ places: $("sallePlaces").children.length, demarrer: !$("demarrer").hidden, etat: $("salleEtat").textContent }));
verifier("salle : 4 places, l'hôte peut démarrer", s0.places === 4 && s0.demarrer && /1 joueur sur 4/.test(s0.etat), s0);

for (const t of [B, C]) await t.p.goto(URL_JEU + "#salle=" + code, { waitUntil: "networkidle" });
await A.p.waitForFunction(() => ligne.presents.filter(Boolean).length === 3, null, { timeout: 10000 });
const sB = await B.p.evaluate(() => ({ siege: ligne.siege, demarrer: !$("demarrer").hidden, etat: $("salleEtat").textContent }));
verifier("un invité ne lance pas le départ, il sait qui le fait", sB.siege === 1 && !sB.demarrer && /créateur/.test(sB.etat), sB);
await A.p.screenshot({ path: new URL("./captures/paper-race-ligne-salle-4.png", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1").replace(/%20/g, " ") });
await A.p.click("#demarrer");
for (const t of [A, B, C]) await t.p.waitForFunction(() => ligne.lancee && R && R.cars.length === 4 && !depart, null, { timeout: 15000 });
const d = await Promise.all([A, B, C].map((t) => t.p.evaluate(() => ({ g: R.grille.join(), f: ligne.depart.fantomes.join(), pieges: R.pieges, siege: ligne.siege }))));
verifier("départ : même grille partout, la place 4 roule en fantôme, sans pièges", d.every((x) => x.g === d[0].g && x.f === "3" && x.pieges === false), d);

// le coup préparé : B choisit pendant que les autres jouent
let prepare = false;
for (let i = 0; i < 200 && !prepare; i++) {
  prepare = await B.p.evaluate(() => {
    if (!peutPreparer()) return false;
    const o = choixDe(ligne.siege), k = o.findIndex((x, i) => x.ok && i === 4) >= 0 ? 4 : o.findIndex((x) => x.ok);
    if (k < 0) return false;
    choisir(k); return avance === k;
  });
  // si c'est à B, il joue (sinon personne n'avance) ; on prépare au tour suivant
  if (!prepare) { await jouerSiTour(A.p); await jouerSiTour(B.p); await jouerSiTour(C.p); await attendre(80); }
}
verifier("en attendant son tour, on prépare son coup", prepare);
const avantB = await B.p.evaluate(() => R.cars[ligne.siege].coups);
let parti = false;
for (let i = 0; i < 200 && !parti; i++) {
  await jouerSiTour(A.p); await jouerSiTour(C.p); await attendre(80);
  parti = await B.p.evaluate((n) => R.cars[ligne.siege].coups > n, avantB);
}
verifier("le coup préparé part tout seul à son tour", parti);

// quelques tours, puis les trois écrans doivent être identiques
await rouler([A, B, C], async () => (await A.p.evaluate(() => R.manche)) >= 4);
await attendre(1500);
const v3 = await Promise.all([A, B, C].map((t) => vue(t.p)));
verifier("les trois écrans montrent la même course", v3[0] === v3[1] && v3[1] === v3[2], v3);

// C recharge en pleine course
await C.p.reload({ waitUntil: "networkidle" });
await C.p.waitForFunction(() => ligne.lancee && R && R.cars.length === 4, null, { timeout: 15000 });
await attendre(800);
const apres = await Promise.all([A, C].map((t) => vue(t.p)));
verifier("rechargé, on retrouve sa place et la course", apres[0] === apres[1] && (await C.p.evaluate(() => ligne.siege)) === 2, apres);

// C part : l'hôte arrête sa voiture quand vient son tour
await C.ctx.close();
const retire = await rouler([A, B], () => A.p.evaluate(() => !!R.cars[2].abandon || finie(R)), 900);
// le relais doit encore porter l'abandon jusqu'à B (un aller-retour chez Cloudflare)
await B.p.waitForFunction(() => !!R.cars[2].abandon || finie(R), null, { timeout: 15000 }).catch(() => { });
const ab = await Promise.all([A, B].map((t) => t.p.evaluate(() => ({ ab: !!R.cars[2].abandon, fini: finie(R), go: $("go").textContent }))));
verifier("un joueur parti : l'hôte arrête sa voiture, pour tous", retire && ab.every((x) => x.ab || x.fini), ab);

const fin = await rouler([A, B], () => A.p.evaluate(() => finie(R)), 1500);
await A.p.waitForFunction(() => $("win").style.display === "flex", null, { timeout: 20000 }).catch(() => { });
await attendre(1500);
const cl = await Promise.all([A, B].map((t) => t.p.evaluate(() => ({ n: document.querySelectorAll("#winclass li").length, txt: $("winclass").textContent, titre: $("wintitle").textContent, v: JSON.stringify(R.cars.map((c) => c.p)) }))));
verifier("arrivée : classement de 4, même course sur les deux écrans", fin && cl.every((x) => x.n === 4) && cl[0].v === cl[1].v, cl);
verifier("le joueur parti apparaît comme tel", /a quitté la course/.test(cl[0].txt), cl[0].txt);
await A.p.screenshot({ path: new URL("./captures/paper-race-ligne-arrivee-4.png", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1").replace(/%20/g, " ") });

// revoir la course, en ligne aussi : pause, coup par coup
await A.p.click("#revoir");
await A.p.waitForFunction(() => !!revue && !$("revuebar").hidden, null, { timeout: 5000 });
await A.p.click("#revSuiv"); await A.p.click("#revSuiv");
const rv = await A.p.evaluate(() => ({ t: revue.t, pause: revue.pause, info: $("revInfo").textContent }));
verifier("revoir : coup par coup, en pause", rv.t === 2 && rv.pause && /Coup 2 sur/.test(rv.info), rv);
await A.p.click("#revFermer");

// la revanche : nouvelle manche, nouvelle grille (C est parti : l'hôte démarre à la main)
await A.p.evaluate(() => { $("again").click(); });
await A.p.waitForFunction(() => ligne.manche === 2 && !$("salle").hidden, null, { timeout: 10000 });
await A.p.click("#demarrer");
for (const t of [A, B]) await t.p.waitForFunction(() => ligne.manche === 2 && ligne.lancee && R && R.cars.every((c) => c.coups === 0) && !depart, null, { timeout: 15000 });
const rev = await Promise.all([A, B].map((t) => t.p.evaluate(() => R.grille.join())));
verifier("revanche : une nouvelle course, la même grille sur les deux écrans", rev[0] === rev[1], rev);
// ⚠️ un coup du relais qui arrive pendant qu'un coup local se termine doit ATTENDRE :
// appliqué trop tôt, il était jugé hors tour sur un seul téléphone (écrans désaccordés)
for (let i = 0; i < 200; i++) {
  if (await A.p.evaluate(() => R.turn === ligne.siege && !occupe() && !finie(R))) break;
  await jouerSiTour(B.p); await attendre(100);
}
const garde = await A.p.evaluate(() => {
  if (R.turn !== ligne.siege || occupe()) return { pret: false };
  const k = opts.findIndex((o) => o.ok);
  selected = k; commit(k);
  const avant = ligne.traites;
  ligne.file.push({ k: 9, v: 99 });          // un faux coup, arrivé à ce moment-là
  avancerFile();
  const attend = ligne.traites === avant;
  ligne.file = [];
  return { pret: true, attend };
});
verifier("un coup reçu pendant qu'un coup se termine attend son tour", garde.pret && garde.attend, garde);
for (const t of [A, B]) await t.ctx.close();

// une salle de la v7 (sans places) : deux téléphones, règles d'origine
const r = await fetch(RELAIS + "/salles", { method: "POST", headers: { Origin: "https://replica-n8n.github.io", "content-type": "application/json" }, body: JSON.stringify({ circuit: "ovale" }) });
const v7 = await r.json();
const X = await telephone(), Y = await telephone();
await X.p.goto(URL_JEU, { waitUntil: "networkidle" });
await X.p.evaluate((o) => localStorage.setItem("paper-race.ligne.v1", JSON.stringify({ code: o.code, jeton: o.jeton, siege: 0 })), v7);
await X.p.reload({ waitUntil: "networkidle" });
await Y.p.goto(URL_JEU + "#salle=" + v7.code, { waitUntil: "networkidle" });
for (const t of [X, Y]) await t.p.waitForFunction(() => ligne.lancee && R && !depart, null, { timeout: 15000 });
await rouler([X, Y], async () => (await X.p.evaluate(() => R.cars[0].coups + R.cars[1].coups)) >= 6, 300);
await attendre(800);
const w = await Promise.all([X, Y].map((t) => t.p.evaluate(() => JSON.stringify({ r: R.regles, c: R.cars.map((c) => c.p), v2: ligne.v2 }))));
verifier("salle v7 : règles d'origine, même course sur les deux écrans", w[0] === w[1] && JSON.parse(w[0]).r === "classique" && JSON.parse(w[0]).v2 === false, w);

verifier("aucune erreur dans la console", erreurs.length === 0, erreurs.slice(0, 5));
await navigateur.close();
console.log(echecs ? `\n${echecs} ECHEC(S)` : "\nCOURSE EN LIGNE À PLUSIEURS OK");
process.exit(echecs ? 1 : 0);
