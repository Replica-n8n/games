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
// contre la PROD (JEU=...), le relais est celui de la prod : sans ça, la fin du contrôle
// visait un relais local éteint et plantait sur ECONNREFUSED
const RELAIS = process.env.RELAIS || (process.env.JEU ? "https://paper-race.jfrxdi0zz.workers.dev" : "http://127.0.0.1:8787");
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
// ⚠️ contre le VRAI relais, un coup met quelques dizaines de millisecondes à
// traverser : comparer les écrans en plein vol fait échouer un jeu pourtant juste.
async function sync(tels, ms = 15000) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    const vues = await Promise.all(tels.map((t) => vue(t.p)));
    if (vues.every((v) => v === vues[0])) return true;
    await attendre(150);
  }
  return false;
}

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
// les places 1 et 2 partent au premier arrivé : l'ordre dépend du réseau
const sB = await B.p.evaluate(() => ({ siege: ligne.siege, demarrer: !$("demarrer").hidden, etat: $("salleEtat").textContent }));
const sC = await C.p.evaluate(() => ligne.siege);
verifier("un invité ne lance pas le départ, il sait qui le fait", sB.siege > 0 && sC > 0 && sB.siege !== sC && !sB.demarrer && /créateur/.test(sB.etat), { sB, sC });
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
// ⚠️ la grille est tirée au sort : parfois, quand vient son tour, la case préparée
// n'est plus jouable (une voiture y est). Le jeu l'abandonne alors, c'est voulu, et
// le DIT (« Ton coup préparé n'est plus possible ») ; mais ce contrôle ne faisait plus
// jouer B et attendait pour rien. On se fie à ce message, et à lui seul : l'état
// « plus de coup préparé, à toi » dure aussi 260 ms dans le cas normal, juste avant
// que le coup parte (un premier essai s'y était trompé, 3 échecs sur 3).
await B.p.evaluate(() => { window.__lache = 0; new MutationObserver(() => { if (/n'est plus possible/.test($("toast").textContent)) window.__lache++; }).observe($("toast"), { childList: true, characterData: true, subtree: true }); });
let parti = false, lache = 0;
for (let essai = 0; essai < 4 && !parti; essai++) {
  if (essai > 0) {
    prepare = false;
    for (let i = 0; i < 200 && !prepare; i++) {
      prepare = await B.p.evaluate(() => { if (!peutPreparer()) return false; const o = choixDe(ligne.siege), k = o.findIndex((x) => x.ok); if (k < 0) return false; choisir(k); return avance === k; });
      if (!prepare) { await jouerSiTour(A.p); await jouerSiTour(B.p); await jouerSiTour(C.p); await attendre(80); }
    }
  }
  const avantB = await B.p.evaluate(() => R.cars[ligne.siege].coups);
  const avantLache = await B.p.evaluate(() => window.__lache);
  for (let i = 0; i < 200 && !parti; i++) {
    await jouerSiTour(A.p); await jouerSiTour(C.p); await attendre(80);
    parti = await B.p.evaluate((n) => R.cars[ligne.siege].coups > n, avantB);
    if (!parti && await B.p.evaluate((n) => window.__lache > n, avantLache)) { lache++; await attendre(300); await jouerSiTour(B.p); break; }
  }
}
if (lache) console.log(`      (coup préparé devenu impossible ${lache} fois : B a joué à la main, puis a préparé de nouveau)`);
verifier("le coup préparé part tout seul à son tour", parti, { lache });

// ⚠️ un numéro de coup en AVANCE veut dire qu'il nous manque un coup : on
// reprend le fil auprès du relais au lieu de jouer dans le désordre
await sync([A, B, C]);
const avantTrou = await vue(B.p);
await B.p.evaluate(() => recevoir({ t: 'coup', n: ligne.traites + 5, k: 4, v: 0, manche: ligne.manche }));
await B.p.waitForFunction(() => ligne.connecte, null, { timeout: 15000 }).catch(() => { });
const recolle = await sync([A, B, C], 20000);
verifier("un coup manquant : on reprend le fil auprès du relais", recolle && (await vue(B.p)) === (await vue(A.p)), { avantTrou, b: await vue(B.p), a: await vue(A.p) });

// quelques tours, puis les trois écrans doivent être identiques
await rouler([A, B, C], async () => (await A.p.evaluate(() => R.manche)) >= 4);
const daccord = await sync([A, B, C]);
const v3 = await Promise.all([A, B, C].map((t) => vue(t.p)));
verifier("les trois écrans montrent la même course", daccord && v3[0] === v3[1] && v3[1] === v3[2], v3);

// C recharge en pleine course
await C.p.reload({ waitUntil: "networkidle" });
await C.p.waitForFunction(() => ligne.lancee && R && R.cars.length === 4, null, { timeout: 15000 });
const revenu = await sync([A, C]);
const apres = await Promise.all([A, C].map((t) => vue(t.p)));
verifier("rechargé, on retrouve sa place et la course", revenu && apres[0] === apres[1] && (await C.p.evaluate(() => ligne.siege)) === sC, apres);

// C part : l'hôte arrête sa voiture quand vient son tour (une minute d'absence,
// raccourcie à 3 s en local)
await C.ctx.close();
const retire = await rouler([A, B], () => A.p.evaluate((v) => !!R.cars[v].abandon || finie(R), sC), 900);
await B.p.waitForFunction((v) => !!R.cars[v].abandon || finie(R), sC, { timeout: 20000 }).catch(() => { });
const ab = await Promise.all([A, B].map((t) => t.p.evaluate((v) => ({ ab: !!R.cars[v].abandon, fini: finie(R), go: $("go").textContent }), sC)));
verifier("un joueur parti : l'hôte arrête sa voiture, pour tous", retire && ab.every((x) => x.ab || x.fini), ab);

const fin = await rouler([A, B], () => A.p.evaluate(() => finie(R)), 1500);
await A.p.waitForFunction(() => $("win").style.display === "flex", null, { timeout: 20000 }).catch(() => { });
await attendre(1500);
await sync([A, B]);
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
// ⚠️ contre la PROD, l'absence est FIGÉE à 60 s (elle n'est réglable qu'en local, pour
// qu'aucun joueur ne puisse la raccourcir) : le tour de l'hôte ne revient qu'après. Un
// budget de 90 s faisait échouer ce contrôle pour rien, avec un « pret:false » muet.
const LIMITE = Date.now() + (process.env.JEU ? 180000 : 60000);
while (Date.now() < LIMITE) {
  if (await A.p.evaluate(() => R.turn === ligne.siege && !occupe() && !finie(R))) break;
  await jouerSiTour(B.p); await attendre(100);
}
const garde = await A.p.evaluate(() => {
  if (R.turn !== ligne.siege || occupe()) return { pret: false, turn: R.turn, siege: ligne.siege, occupe: occupe(), finie: finie(R) };
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

// une salle de la v7 (sans places ni version des règles) : ⚠️ depuis pr-4 (v17), un
// téléphone récent n'y entre PLUS. Il y jouerait des règles que l'autre n'a pas (un
// « coincé » n'y donne pas la même chose) et les écrans divergeraient. Il la quitte
// tout de suite, avec un message. (Le code qui jouait ces salles, les branches
// `!ligne.v2` de ligne.js, ne sert donc plus à un téléphone de la v17.)
const r = await fetch(RELAIS + "/salles", { method: "POST", headers: { Origin: "https://replica-n8n.github.io", "content-type": "application/json" }, body: JSON.stringify({ circuit: "ovale" }) });
const v7 = await r.json();
const Y = await telephone();
// ⚠️ ouvrir le lien DIRECTEMENT : aller de la page à la même page avec un autre
// « #salle= » ne recharge rien, le téléphone n'essayait même pas d'entrer (et « il a
// quitté » était vrai pour rien). La preuve qu'il a essayé : le relais lui a dit la
// version de la salle (1, celle d'avant pr-4).
await Y.p.goto(URL_JEU + "#salle=" + v7.code, { waitUntil: "domcontentloaded" });
const quitte = await Y.p.waitForFunction(() => ligne.reglesSalle !== undefined && !ligne.actif && $("menu").style.display === "flex", null, { timeout: 8000 }).then(() => true).catch(() => false);
const vu = await Y.p.evaluate(() => ({ regles: ligne.reglesSalle, msg: $("toastAccueil").textContent }));
verifier("salle v7 : un téléphone v17 la quitte aussitôt, avec le message de version", quitte && vu.regles === 1 && /version plus ancienne/.test(vu.msg), { quitte, ...vu });

verifier("aucune erreur dans la console", erreurs.length === 0, erreurs.slice(0, 5));
await navigateur.close();
console.log(echecs ? `\n${echecs} ECHEC(S)` : "\nCOURSE EN LIGNE À PLUSIEURS OK");
process.exit(echecs ? 1 : 0);
