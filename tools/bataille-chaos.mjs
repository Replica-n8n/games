import { chromium } from "playwright";
import { servir } from "./serveur.mjs";

/* Une partie « au hasard », plus rude que les bancs : trois années jouées par le robot,
   en ouvrant l'atlas n'importe quand, en rechargeant la page en pleine année (la partie
   doit reprendre), en touchant le bandeau. À chaque mois : 32 cartes, aucune erreur,
   et les stats de l'année suivent (un mois compté par mois joué). */

const srv = await servir();
const navigateur = await chromium.launch();
const echecs = [];
const verifie = (nom, ok, detail) => { if (!ok) echecs.push(nom + (detail !== undefined ? " : " + detail : "")); };
const c = await navigateur.newContext({ viewport: { width: 360, height: 732 } });
const p = await c.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(String(e)));
let graine = 7; const alea = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
await p.goto(srv.base + "bataille/", { waitUntil: "load" });
const lancer = async () => { await p.click("#startBtn"); if (await p.isVisible("#annees")) { if (alea() < 0.5) await p.click("#anneesL .an >> nth=0"); await p.click("#anneesOk"); } };
await lancer();
let annees = 0, mois = 0, recharges = 0;
while (annees < 3 && mois < 60) {
  if (await p.isVisible("#end")) {
    annees++;
    const fin = await p.evaluate(() => ({ faits: document.querySelectorAll("#faits .fx").length, cases: document.querySelectorAll("#frise > div:not(.leg)").length }));
    verifie("fin " + annees + " : trois faits, douze cases", fin.faits === 3 && fin.cases === 12, JSON.stringify(fin));
    await p.click("#againBtn"); if (await p.isVisible("#annees")) await p.click("#anneesOk");
    continue;
  }
  const e = await p.evaluate(() => window.__essais.etat());
  if (e.phase === "place") {
    verifie("mois " + mois + " : 32 cartes", e.moi + e.lui + e.unites.filter((u) => !u.clone).length === 32, e.moi + "+" + e.lui + "+" + e.unites.length);
    const st = await p.evaluate(() => window.__essais.stats());
    verifie("mois " + mois + " : un mois compté par mois joué", st && st.mois.filter(Boolean).length === e.round - 1, (st && st.mois.filter(Boolean).length) + " pour le mois " + e.round);
    if (alea() < 0.3) { await p.click("#globe"); await p.click("#atlasC button >> nth=" + Math.floor(alea() * 12)); await p.click("#atlasOk"); }
    if (alea() < 0.15 && e.round > 1) { await p.reload({ waitUntil: "load" }); recharges++; verifie("après rechargement, la partie reprend", /Reprendre/.test(await p.textContent("#startBtn")), await p.textContent("#startBtn")); await lancer();
      const e2 = await p.evaluate(() => window.__essais.etat()); verifie("reprise au même mois", e2.round === e.round, e2.round + " / " + e.round); }
    await p.click("#goBtn"); await p.evaluate(() => window.__essais.vitesse(12));
    if (alea() < 0.4) { await p.waitForTimeout(400); if (await p.isVisible("#globe")) { await p.click("#globe"); await p.waitForTimeout(200); await p.click("#atlasOk"); } }
    await p.waitForFunction(() => window.__essais.etat().phase === "result", null, { timeout: 60000 });
    mois++;
    await p.click("#goBtn");
    continue;
  }
  /* les feuilles entre deux mois */
  if (await p.isVisible("#choix")) {
    if (await p.isVisible("#choixOk") && !(await p.isVisible(".pc"))) await p.click("#choixOk");
    else if (await p.isVisible("[data-gravure]")) await p.click("[data-gravure] >> nth=" + Math.floor(alea() * 3));
    else if (await p.isVisible(".pc:not(:disabled)")) { await p.click(".pc:not(:disabled) >> nth=0"); await p.click("#choixOk"); }
    else if (await p.isVisible("#choixOk")) await p.click("#choixOk");
    else await p.click("#choixL .option >> nth=" + Math.floor(alea() * 3));
    continue;
  }
  await p.waitForTimeout(100);
}
verifie("trois années jouées", annees === 3, annees + " années, " + mois + " mois");
verifie("au moins un rechargement en pleine année", recharges > 0);
await navigateur.close(); srv.arreter();
if (erreurs.length) echecs.push("erreurs JS : " + erreurs.join(" | "));
if (echecs.length) { console.log("ÉCHEC bataille-chaos\n- " + echecs.slice(0, 15).join("\n- ")); process.exit(1); }
console.log("bataille-chaos : tout passe (" + annees + " années, " + mois + " mois, " + recharges + " rechargements)");
