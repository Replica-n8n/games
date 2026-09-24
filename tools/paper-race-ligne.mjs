import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";

/* Paper Race EN LIGNE, de bout en bout : deux téléphones, un relais.
   Le relais doit tourner en local : `npx wrangler dev --port 8787` dans
   serveur-paper-race/ (voir son README). Ce contrôle prouve :
   - créer une course donne une salle d'attente avec un code et un QR code ;
   - le lien d'invitation fait entrer le second téléphone, les feux partent ;
   - chacun joue à son tour, et les DEUX écrans montrent la même course ;
   - un rechargement, une coupure réseau : on revient là où on en était ;
   - l'arrivée, puis la revanche, pour les deux ;
   - quitter prévient l'autre. */

let echecs = 0;
const verifier = (nom, ok, detail) => {
  console.log((ok ? "ok    " : "ECHEC ") + nom + (!ok && detail !== undefined ? "  " + JSON.stringify(detail).slice(0, 400) : ""));
  if (!ok) echecs++;
};

// JEU=https://replica-n8n.github.io/games/paper-race/ : la même chose en PRODUCTION,
// avec le vrai relais Cloudflare
const site = process.env.JEU ? null : await servir();
const URL_JEU = process.env.JEU || site.base + "paper-race/";
const navigateur = await chromium.launch();
const erreurs = [];
async function telephone() {
  const ctx = await navigateur.newContext({ ...devices["Pixel 9"], reducedMotion: "reduce" });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/WebSocket|ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(m.text())) erreurs.push(m.text()); });
  return { ctx, p };
}
const etat = (p) => p.evaluate(() => R ? { id: R.track.id, cars: R.cars.map((c) => c.p.join(",") + "|" + c.coups), tour: R.turn, finie: finie(R), jeu: $("game").style.display === "flex", salle: !$("salle").hidden, siege: ligne.siege, connecte: ligne.connecte, lancee: ligne.lancee, go: $("go").textContent } : null);
// joue UN coup si c'est son tour (le choix de l'ordinateur « vite »), renvoie vrai s'il a joué
const jouerSiTour = (p) => p.evaluate(() => {
  if (!R || finie(R) || occupe() || R.turn !== ligne.siege) return false;
  const q = aiChoice(R, "rapide");
  if (q === null) { $("go").click(); return true; }
  choisir(opts.findIndex((o) => o.p[0] === q[0] && o.p[1] === q[1]));
  $("go").click();
  return true;
});
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

const A = await telephone(), B = await telephone();
await A.p.goto(URL_JEU, { waitUntil: "networkidle" });
await A.p.evaluate(() => localStorage.clear());
await A.p.reload({ waitUntil: "networkidle" });

/* A crée une course sur Le S */
await A.p.click("#enligne");
const bouton = await A.p.evaluate(() => $("jouer").textContent);
verifier("« En ligne » : le bouton devient « Créer la course en ligne »", /en ligne/.test(bouton), bouton);
await A.p.click("#jouer");
await A.p.waitForFunction(() => !$("salle").hidden && /^[A-Z2-9]{4}$/.test($("salleCode").textContent) && ligne.connecte, null, { timeout: 10000 });
const salle = await A.p.evaluate(() => ({ code: $("salleCode").textContent, qr: !!$("salleQr").querySelector("svg"), etat: $("salleEtat").textContent, circuit: $("salleCircuit").textContent }));
verifier("la salle d'attente montre un code, un QR code, et attend l'autre", salle.qr && /attente/.test(salle.etat) && salle.circuit === "Le S", salle);
await A.p.screenshot({ fullPage: true, path: new URL("./captures/paper-race-ligne-salle.png", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1").replace(/%20/g, " ") });

/* B arrive par le lien d'invitation */
await B.p.goto(URL_JEU + "#salle=" + salle.code, { waitUntil: "networkidle" });
await Promise.all([A, B].map(({ p }) => p.waitForFunction(() => ligne.lancee && !depart && R && $("game").style.display === "flex", null, { timeout: 15000 })));
const [ea, eb] = [await etat(A.p), await etat(B.p)];
verifier("le lien fait entrer le second téléphone, la course part des deux côtés", ea.jeu && eb.jeu && !ea.salle && !eb.salle && ea.siege === 0 && eb.siege === 1, { ea, eb });
// v9 : la grille est tirée au sort, l'un ou l'autre ouvre
const [ouvreur, attend, eAttend] = ea.tour === 0 ? ["Bleu", B, eb] : ["Rouge", A, ea];
verifier(`celui qui attend lit « Au tour de ${ouvreur}… »`, new RegExp("Au tour de " + ouvreur).test(eAttend.go), eAttend.go);
const horsTour = await jouerSiTour(attend.p);
verifier("on ne peut pas jouer à la place de l'autre", horsTour === false);

/* dix coups chacun son tour : les deux écrans montrent la même course */
/* ⚠️ on compare une fois les DEUX à jour : contre le vrai relais, le coup met
   quelques dizaines de millisecondes à traverser, et comparer en plein vol
   faisait échouer un test pourtant vert (vu en prod le 2026-09-19). */
const memeCourse = async () => {
  for (let i = 0; i < 40; i++) {
    const [x, y] = [await etat(A.p), await etat(B.p)];
    if (x.cars.join() === y.cars.join()) return true;
    await attendre(150);
  }
  return false;
};
let pareil = true, joues = 0;
for (let i = 0; i < 20 && joues < 10; i++) {
  if (await jouerSiTour(A.p) || await jouerSiTour(B.p)) joues++;
  await attendre(250);
  if (!(await memeCourse())) pareil = false;
}
await attendre(400);
const [a10, b10] = [await etat(A.p), await etat(B.p)];
verifier("dix coups joués, et les deux écrans montrent la même course", joues === 10 && pareil && a10.cars.join() === b10.cars.join(), { joues, a10, b10 });
await B.p.screenshot({ path: new URL("./captures/paper-race-ligne-course.png", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1").replace(/%20/g, " ") });

/* B recharge la page en pleine course */
await B.p.reload({ waitUntil: "networkidle" });
await B.p.waitForFunction(() => ligne.connecte && R && $("game").style.display === "flex", null, { timeout: 10000 });
const bRecharge = await etat(B.p);
verifier("rechargée, la page retrouve la course et sa place", bRecharge.cars.join() === a10.cars.join() && bRecharge.siege === 1, { bRecharge, a10 });

/* A perd le réseau, puis le retrouve */
await A.ctx.setOffline(true);
await A.p.evaluate(() => ligne.ws && ligne.ws.close());
await attendre(400);
const horsLigne = await etat(A.p);
verifier("sans réseau, A voit « Reconnexion… » et ne peut pas jouer", horsLigne.connecte === false && /Reconnexion/.test(horsLigne.go), horsLigne);
await A.ctx.setOffline(false);
await A.p.waitForFunction(() => ligne.connecte, null, { timeout: 20000 });
verifier("le réseau revenu, A se reconnecte tout seul", true);

/* jusqu'à l'arrivée */
for (let i = 0; i < 400; i++) {
  const [x, y] = [await etat(A.p), await etat(B.p)];
  if (x.finie && y.finie) break;
  await jouerSiTour(A.p); await jouerSiTour(B.p);
  await attendre(120);
}
await Promise.all([A, B].map(({ p }) => p.waitForFunction(() => $("win").style.display === "flex", null, { timeout: 15000 })));
const fins = await Promise.all([A, B].map(({ p }) => p.evaluate(() => ({ titre: $("wintitle").textContent, again: $("again").textContent, gagnant: R.winner }))));
verifier("l'arrivée s'affiche sur les deux téléphones, avec « Revanche »", fins[0].gagnant === fins[1].gagnant && fins.every((f) => f.again === "Revanche"), fins);
// v9 : la course en ligne finit sur le classement (téléphone A = voiture 0, B = voiture 1)
verifier("le gagnant lit « Victoire », l'autre sa place", /^Victoire/.test(fins[fins[0].gagnant].titre) && /^Tu finis 2e sur 2/.test(fins[1 - fins[0].gagnant].titre), fins);

/* la revanche */
await A.p.click("#again");
await Promise.all([A, B].map(({ p }) => p.waitForFunction(() => ligne.lancee && !depart && R && R.cars[0].coups === 0 && $("win").style.display !== "flex", null, { timeout: 15000 })));
verifier("la revanche remet la course à zéro sur les deux téléphones", true);

/* A quitte : B le voit */
await A.p.evaluate(() => { $("menubtn").click(); $("quitterLigne").click(); });
await attendre(600);
// v9 : la grille est tirée au sort ; si B ouvre, il joue, et c'est ensuite au tour de A, parti
if (await jouerSiTour(B.p)) await attendre(600);
const bSeul = await etat(B.p);
const aAccueil = await A.p.evaluate(() => ({ accueil: $("menu").style.display === "flex", garde: localStorage.getItem("paper-race.ligne.v1") }));
verifier("A a quitté : il est sur l'accueil et a oublié la course", aAccueil.accueil && aAccueil.garde === null, aAccueil);
verifier("B voit que A s'est absenté", /absenté/.test(bSeul.go), bSeul.go);

/* pr-4 : une salle d'une autre version des règles (ici, une salle de la v16, créée
   sans version) : le téléphone récent la quitte TOUT DE SUITE avec un message clair,
   au lieu de jouer une course qui divergerait (un « coincé » n'y donne pas la même
   chose). ⚠️ Le refus arrive vite, la fermeture parfois 10 s plus tard : on mesure. */
{
  const RELAIS_TEST = process.env.JEU ? "https://paper-race.jfrxdi0zz.workers.dev" : (process.env.RELAIS || "http://127.0.0.1:8787");
  const vieille = await (await fetch(RELAIS_TEST + "/salles", { method: "POST", headers: { Origin: "https://replica-n8n.github.io", "content-type": "application/json" }, body: JSON.stringify({ circuit: "s", places: 2 }) })).json();
  const C = await telephone();
  await C.p.goto(URL_JEU, { waitUntil: "networkidle" });
  await C.p.evaluate(() => { localStorage.clear(); window.__msg = []; new MutationObserver(() => { const t = $("toastAccueil").textContent; if (t) window.__msg.push(t); }).observe($("toastAccueil"), { childList: true, characterData: true, subtree: true }); });
  const t0 = Date.now();
  await C.p.evaluate((code) => { location.hash = "salle=" + code; }, vieille.code);
  await C.p.reload({ waitUntil: "networkidle" });
  await C.p.evaluate(() => { window.__msg = []; new MutationObserver(() => { const t = $("toastAccueil").textContent; if (t) window.__msg.push(t); }).observe($("toastAccueil"), { childList: true, characterData: true, subtree: true }); });
  const vu = await C.p.waitForFunction(() => !ligne.actif && $("menu").style.display === "flex" && /version/.test($("toastAccueil").textContent + window.__msg.join()), null, { timeout: 8000 }).then(() => true).catch(() => false);
  const fin = await C.p.evaluate(() => ({ actif: ligne.actif, accueil: $("menu").style.display === "flex", msg: $("toastAccueil").textContent, vus: window.__msg }));
  verifier("pr-4 : une salle d'une autre version se quitte tout de suite, avec un message clair", vu && /version plus ancienne/.test(fin.msg + fin.vus.join()), { ...fin, ms: Date.now() - t0 });
  await C.ctx.close();
}

verifier("aucune erreur dans la console", erreurs.length === 0, erreurs);
await navigateur.close();
if (site) site.arreter();
console.log(echecs ? `\n${echecs} ECHEC(S)` : "\nCOURSE EN LIGNE OK");
process.exit(echecs ? 1 : 0);
