import { chromium } from "playwright";
import { servir } from "./serveur.mjs";
import { lire } from "../serveur-bataille/worker.js";

/* Les mesures de La Bataille : à la fin d'une année, le jeu envoie UNE fiche au
   compteur (serveur-bataille/). Ce banc n'envoie rien au vrai compteur : il
   intercepte l'envoi et vérifie
   - que la fiche a exactement la forme que le compteur accepte (son propre `lire`) ;
   - qu'elle ne contient RIEN d'autre : aucune clé qui pourrait désigner un joueur ;
   - qu'une panne de réseau la garde en file, et que la file part au lancement suivant ;
   - que sans `window.__mesures`, un banc sur 127.0.0.1 n'envoie jamais rien. */

const COMPTEUR = "https://bataille-mesures.jfrxdi0zz.workers.dev/fin";
const CLES = ["choix", "ecart", "g", "mode", "mois", "r", "v"];
const REGLAGES = COMPTEUR.replace("/fin", "/reglages");
const srv = await servir();
const navigateur = await chromium.launch();
const echecs = [];
const verifie = (nom, ok, detail) => { if (!ok) echecs.push(nom + (detail !== undefined ? " : " + detail : "")); };

async function annee(p, essai) {
  await p.click("#startBtn");
  for (let garde = 0; garde < 14; garde++) {
    await p.click("#goBtn");
    await p.evaluate(() => window.__essais.vitesse(12));
    await p.waitForFunction(() => window.__essais.etat().phase === "result", null, { timeout: 60000 });
    await p.click("#goBtn");
    if (await p.isVisible("#end")) return;
    if (essai) await p.click("#choixL .option >> nth=0");
  }
}
async function page(mesures, reseau) {
  const ctx = await navigateur.newContext({ viewport: { width: 360, height: 732 } });
  const p = await ctx.newPage();
  const recues = [], erreurs = [];
  p.on("pageerror", (e) => erreurs.push(String(e)));
  if (mesures) await p.addInitScript(() => { window.__mesures = true; });
  await ctx.route(COMPTEUR, async (route) => { if (!reseau.ok) return route.abort(); recues.push({ corps: route.request().postData(), entetes: route.request().headers() }); await route.fulfill({ status: reseau.fini ? 410 : 200, contentType: "application/json", body: JSON.stringify({ g: 4, f: 1.04, s: { vampire: 0.85 }, mesure: !reseau.fini }), headers: { "Access-Control-Allow-Origin": "*" } }); });
  await ctx.route(REGLAGES, (route) => (reseau.ok ? route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ g: 3, f: 1.02, s: {}, mesure: true }), headers: { "Access-Control-Allow-Origin": "*" } }) : route.abort()));
  return { ctx, p, recues, erreurs };
}

/* 1. une année d'essai : une fiche, de la bonne forme, et rien de plus */
{
  const reseau = { ok: true }, { ctx, p, recues, erreurs } = await page(true, reseau);
  await p.goto(srv.base + "bataille/", { waitUntil: "load" });
  await p.evaluate(() => navigator.serviceWorker.ready); await p.reload({ waitUntil: "load" });
  await annee(p, true);
  await p.waitForTimeout(600);
  verifie("une année, une fiche", recues.length === 1, recues.length);
  const f = recues[0] ? JSON.parse(recues[0].corps) : {};
  verifie("la fiche est celle que le compteur accepte", !!lire(f), JSON.stringify(f).slice(0, 160));
  verifie("la fiche ne porte que les sept champs prévus", Object.keys(f).sort().join() === CLES.join(), Object.keys(f).join());
  verifie("la fiche dit le mode, la version et les choix", f.mode === "essai" && /^V\d+$/.test(f.v) && f.choix.length === f.mois - 1 && f.choix.every((c) => c.o.length === 3 && c.o.includes(c.c)), f.v + " " + f.mode + " " + (f.choix || []).length + "/" + f.mois);
  verifie("aucune adresse de page n'accompagne l'envoi", !recues[0] || !recues[0].entetes.referer, recues[0] && recues[0].entetes.referer);
  verifie("la file est vide après l'envoi", (await p.evaluate(() => localStorage.getItem("bataille-mesures"))) === "[]");
  verifie("la fiche porte le numéro du réglage reçu au lancement", f.g === 3, f.g);
  verifie("le compteur répond les réglages, le jeu les prend", await p.evaluate(() => { const r = window.__essais.essai().reg; return r.g === 4 && r.f === 1.04 && r.s.vampire === 0.85; }));
  verifie("aucune erreur de page (essai)", erreurs.length === 0, erreurs.join(" | "));

  /* 2. panne de réseau : la fiche attend, puis part au lancement suivant */
  reseau.ok = false;
  await p.click("#againBtn"); await p.evaluate(() => { document.getElementById("title").hidden = false; });
  await annee(p, true);
  await p.waitForTimeout(600);
  const enFile = JSON.parse(await p.evaluate(() => localStorage.getItem("bataille-mesures")));
  verifie("réseau coupé : la fiche reste en file", enFile.length === 1 && recues.length === 1, enFile.length + " en file, " + recues.length + " reçues");
  reseau.ok = true;
  await p.reload({ waitUntil: "load" });
  await p.waitForFunction(() => localStorage.getItem("bataille-mesures") === "[]", null, { timeout: 15000 }).catch(() => {});
  verifie("au lancement suivant, la file part", recues.length === 2 && !!lire(JSON.parse(recues[1].corps)), recues.length);
  /* 3. le compteur a fini de mesurer : le jeu se tait pour de bon */
  reseau.fini = true;
  await annee(p, true); await p.waitForTimeout(600);
  const n3 = recues.length;
  verifie("mesure terminée : la file est vidée et le jeu le retient", (await p.evaluate(() => localStorage.getItem("bataille-mesures"))) === "[]" && (await p.evaluate(() => window.__essais.essai().reg.mesure)) === false);
  await p.click("#againBtn"); await p.evaluate(() => { document.getElementById("title").hidden = false; });
  await annee(p, true); await p.waitForTimeout(600);
  verifie("mesure terminée : plus aucune fiche ne part", recues.length === n3, recues.length - n3);
  await ctx.close();
}
/* 4. sans window.__mesures, un banc local n'envoie rien */
{
  const { ctx, p, recues } = await page(false, { ok: true });
  await p.goto(srv.base + "bataille/?classique", { waitUntil: "load" });
  await p.evaluate(() => navigator.serviceWorker.ready); await p.reload({ waitUntil: "load" });
  await annee(p, false);
  await p.waitForTimeout(600);
  verifie("un banc local n'envoie rien et ne met rien en file", recues.length === 0 && !(await p.evaluate(() => localStorage.getItem("bataille-mesures"))), recues.length);
  await ctx.close();
}
await navigateur.close();
srv.arreter();
console.log(echecs.length ? "ÉCHEC\n" + echecs.join("\n") : "bataille-mesures : tout passe");
process.exit(echecs.length ? 1 : 0);
