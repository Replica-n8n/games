import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Le parcours (V1.8.0, maquette tools/mockup-bataille-parcours.html validée par Julie) :
   l'accueil n'a plus que « Jouer », l'année maudite se choisit après ; le mois
   s'annonce en bandeau qui file à sa place ; le globe ouvre l'atlas (partie en pause),
   qui dit ce que chaque constellation donne et porte les étoiles de maîtrise ; une
   gravure gagnée se montre en action ; la fin d'année fait son bilan.
   Joué dans le vrai jeu. Captures : captures/bataille-parcours-*.png */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, "captures");
fs.mkdirSync(SORTIE, { recursive: true });
const srv = await servir();
const navigateur = await chromium.launch();
const echecs = [];
const verifie = (nom, ok, detail) => { if (!ok) echecs.push(nom + (detail !== undefined ? " : " + detail : "")); };
const erreurs = [];
const page = async (o = {}) => { const c = await navigateur.newContext({ viewport: { width: 360, height: 732 }, deviceScaleFactor: 2, ...o }); const p = await c.newPage(); p.on("pageerror", (e) => erreurs.push(String(e))); return p; };
const attends = (ms) => new Promise((r) => setTimeout(r, ms));
let p = await page();
const photo = (nom) => p.screenshot({ path: path.join(SORTIE, "bataille-parcours-" + nom + ".png") });

await p.goto(srv.base + "bataille/", { waitUntil: "load" });
await p.evaluate(() => navigator.serviceWorker.ready); await p.reload({ waitUntil: "load" });

/* 1. l'accueil : Jouer seul (et Installer) */
verifie("plus d'atlas sur l'accueil", (await p.locator("#atlasBtn").count()) === 0);
verifie("le bouton dit Jouer", (await p.textContent("#startBtn")).trim() === "Jouer", await p.textContent("#startBtn"));
await photo("1-accueil");

/* 2. Jouer : sans année maudite ouverte, pas de choix ; le bandeau du mois */
await p.click("#startBtn");
verifie("sans année maudite, pas de choix d'année", !(await p.isVisible("#annees")));
verifie("le bandeau annonce le mois", await p.isVisible("#bandeau"));
const b0 = await p.evaluate(() => ({ b: window.__essais.bandeau(), mois: document.getElementById("moisT").textContent }));
verifie("le bandeau dit le bon mois", b0.b.texte === b0.mois, JSON.stringify(b0));
await photo("2-bandeau");
await attends(2400); await photo("3-vole");
await attends(500);
verifie("le bandeau est rangé après 2 s", !(await p.isVisible("#bandeau")));
verifie("la règle s'allume à sa place", await p.evaluate(() => document.querySelector(".mois").classList.contains("eclaire")));
await photo("4-pose");
await attends(1200);
verifie("puis redevient blanche", !(await p.evaluate(() => document.querySelector(".mois").classList.contains("eclaire"))));

/* le globe : dans le coin, 44 px, sans toucher la constellation ni son nom */
const geo = await p.evaluate(() => { const g = document.getElementById("globe").getBoundingClientRect(), s = document.getElementById("signe").getBoundingClientRect(); return { g: [g.left, g.top, g.width, g.height], s: [s.left, s.right], vu: !document.getElementById("globe").hidden }; });
verifie("le globe est là, 44 px", geo.vu && geo.g[2] >= 44 && geo.g[3] >= 44, JSON.stringify(geo));
verifie("le nom de la constellation ne passe pas sous le globe", geo.s[1] <= geo.g[0] + 2, JSON.stringify(geo));
/* aucune étoile de la figure sous le globe : relu dans le décor */
const sous = await p.evaluate(() => { const C = window.__essais.ciel(), id = window.__essais.etat().mois; return C[id].st.filter((q) => 179 + q[0] * 121 > 308 - 6 && 16 + q[1] * 54 < 52 + 6).length; });
verifie("aucune étoile de la constellation sous le globe", sous === 0, sous);
/* pire cas : toutes les constellations */
const pire = await p.evaluate(() => { const C = window.__essais.ciel(); return Object.keys(C).filter((id) => C[id].st.some((q) => 179 + q[0] * 121 > 302 && 16 + q[1] * 54 < 58)); });
verifie("aucune des douze constellations ne passe sous le globe", pire.length === 0, pire.join());

/* 3. un mois gagné allume une constellation : la gravure (ou l'atout) se montre */
let vu = false;
for (let m = 0; m < 40 && !vu; m++) {
  if (await p.isVisible("#end")) await p.click("#againBtn"); if (await p.isVisible("#annees")) await p.click("#anneesOk");
  await p.click("#goBtn"); await p.evaluate(() => window.__essais.vitesse(12));
  await p.waitForFunction(() => window.__essais.etat().phase === "result", null, { timeout: 60000 });
  await p.evaluate(() => window.__essais.vitesse(1));
  const nouveau = await p.isVisible("#pageN") && /s’allume/.test(await p.textContent("#pageN"));
  await p.click("#goBtn");
  if (await p.isVisible("#end")) continue;
  if (nouveau) {
    vu = true;
    const t = await p.textContent("#choixT");
    verifie("la feuille dit la nouveauté", /^Nouvel(le gravure|\satout)/.test(t), t);
    await attends(900); await photo("5-nouveau");
    const apercu = await p.evaluate(() => { const c = document.querySelector("#choixL canvas.apercu"); if (!c) return null; const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; });
    if (/gravure/.test(t)) verifie("la gravure joue son effet sur une carte", apercu > 2000, apercu);
    await p.click("#choixOk");
    verifie("puis vient le choix habituel", await p.isVisible("#choix"));
  } else if (await p.isVisible("[data-gravure]")) { await p.click("[data-gravure] >> nth=0"); await p.click(".pc:not(:disabled) >> nth=0"); await p.click("#choixOk"); }
  if (await p.isVisible("[data-gravure]")) { await p.click("[data-gravure] >> nth=0"); await p.click(".pc:not(:disabled) >> nth=0"); await p.click("#choixOk"); }
  if (await p.isVisible("[data-atout]")) await p.click("#choixL .option >> nth=0");
}
verifie("une constellation allumée dans l'année", vu);

/* 4. la fin d'année : finir l'année, les robots choisissent */
await p.evaluate(() => window.__essais.auto(true));
for (let k = 0; k < 30 && !(await p.isVisible("#end")); k++) {
  const ph = await p.evaluate(() => window.__essais.etat().phase);
  if (ph === "place") { await p.click("#goBtn"); await p.evaluate(() => window.__essais.vitesse(12)); await p.waitForFunction(() => window.__essais.etat().phase === "result", null, { timeout: 60000 }); }
  if (await p.isVisible("#choix")) { if (await p.isVisible("#choixOk")) await p.click("#choixOk"); else await p.click("#choixL .option >> nth=0"); continue; }
  await p.click("#goBtn");
}
verifie("l'année se termine", await p.isVisible("#end"));
const fin = await p.evaluate(() => ({ cases: document.querySelectorAll("#frise > div:not(.leg)").length, joues: window.__essais.stats().mois.filter(Boolean).length, faits: document.querySelectorAll("#faits .fx").length, chiffres: document.querySelectorAll("#chiffres > div").length, mvp: !document.getElementById("mvp").hidden, don: window.__essais.stats().don, deborde: (() => { const e = document.getElementById("end"); return e.scrollHeight > e.clientHeight + 1; })() }));
verifie("la frise a douze mois", fin.cases === 12, JSON.stringify(fin));
verifie("trois faits", fin.faits === 3, JSON.stringify(fin));
verifie("quatre chiffres", fin.chiffres === 4, JSON.stringify(fin));
verifie("une carte de l'année", fin.mvp, JSON.stringify(fin));
verifie("des dégâts comptés", fin.don > 0, JSON.stringify(fin));
verifie("la page de fin tient dans l'écran", !fin.deborde, JSON.stringify(fin));
const nomMvp = await p.textContent("#mvp strong");
verifie("la carte de l'année porte son vrai nom (pas « le R »)", !/^L[ea] [RDVA] /.test(nomMvp), nomMvp);
await photo("6-fin");
await p.evaluate(() => window.__essais.auto(false));

/* 5. une année maudite ouverte : le choix vient après Jouer ; l'atlas et ses étoiles */
await p.evaluate(() => localStorage.setItem("bataille-atlas", JSON.stringify({ lu: { capricorne: 1, verseau: 1, belier: 1, lion: 1, vierge: 1, cancer: 1, taureau: 1, poissons: 1 }, ans: 4, max: 3, joue: 3, m: { capricorne: 8, verseau: 3, belier: 3, lion: 3, cancer: 0 }, vu: 0 })));
await p.evaluate(() => localStorage.removeItem("bataille-partie"));
await p.reload({ waitUntil: "load" });
await p.click("#startBtn");
verifie("Jouer ouvre le choix de l'année", await p.isVisible("#annees"));
verifie("année de base + 3 ouvertes + la suivante fermée", (await p.locator("#anneesL .an").count()) === 5 && (await p.locator("#anneesL .an:disabled").count()) === 1);
verifie("la dernière ouverte est choisie d'avance", /maudite 3/.test(await p.textContent("#anneesOk")), await p.textContent("#anneesOk"));
await photo("7-annees");
await p.click("#anneesL .an >> nth=2");
verifie("choisir une année change le bouton", /maudite 2/.test(await p.textContent("#anneesOk")));
await p.click("#anneesOk");
verifie("la partie est de l'année choisie", (await p.evaluate(() => window.__essais.atlas({}).pal)) === 2);
await attends(3200);
verifie("le globe a son point d'or (du nouveau)", await p.isVisible("#globePt"));
const t0 = await p.evaluate(() => window.__essais.etat());
await p.click("#globe");
verifie("le globe ouvre l'atlas", await p.isVisible("#atlas"));
verifie("douze constellations", (await p.locator("#atlasC button").count()) === 12);
verifie("le compte des étoiles", /8 constellations sur 12 · 6 étoiles sur 36/.test(await p.textContent("#atlasS")), await p.textContent("#atlasS"));
await photo("8-atlas");
await p.click("#atlasC button >> nth=7");
verifie("le Lion dit ce qu'il donne et la prochaine étoile", /Crinière/.test(await p.textContent("#atlasD")) && /année maudite 6/.test(await p.textContent("#atlasD")), await p.textContent("#atlasD"));
await photo("9-lion");
await p.click("#atlasC button >> nth=10");
verifie("une constellation éteinte dit comment l'allumer", /Gagne novembre/.test(await p.textContent("#atlasD")), await p.textContent("#atlasD"));
await p.click("#atlasC button >> nth=0");
verifie("trois étoiles : le dos de carte se prend", await p.isVisible("#atlasD .dos"));
await p.click("#atlasD .dos");
verifie("le dos est pris", (await p.evaluate(() => JSON.parse(localStorage.getItem("bataille-atlas")).dos)) === "capricorne");
await photo("10-dos");
const geomA = await p.evaluate(() => { const f = document.querySelector("#atlas .feuille").getBoundingClientRect(); return { haut: f.top, bas: f.bottom }; });
verifie("l'atlas tient dans l'écran", geomA.haut >= 0 && geomA.bas <= 732, JSON.stringify(geomA));
await attends(600);
const t1 = await p.evaluate(() => window.__essais.etat());
verifie("la partie attend pendant l'atlas", t0.phase === t1.phase && JSON.stringify(t0.unites.map((u) => u.lane)) === JSON.stringify(t1.unites.map((u) => u.lane)));
await p.click("#atlasOk");
verifie("le point d'or s'éteint une fois vu", !(await p.isVisible("#globePt")));

/* 6. la maîtrise dans le ciel du mois : 2 étoiles = scintille + étoile filante */
await p.evaluate(() => { const id = window.__essais.etat().mois; window.__essais.etoiles(id, 6); });
const astres = await p.evaluate(() => ({ s: document.querySelectorAll("#astres .scint").length, f: document.querySelectorAll("#astres .filante").length }));
verifie("deux étoiles : la constellation scintille et une étoile filante passe", astres.s > 0 && astres.f === 1, JSON.stringify(astres));
await attends(1700); await photo("11-ciel");

/* 7. animations réduites : le bandeau s'efface sans voler, rien ne scintille */
p = await page({ reducedMotion: "reduce" });
await p.goto(srv.base + "bataille/", { waitUntil: "load" });
await p.evaluate(() => localStorage.setItem("bataille-atlas", JSON.stringify({ lu: { capricorne: 1 }, ans: 0, max: 0, joue: 0, m: { capricorne: 8 } })));
await p.reload({ waitUntil: "load" });
await p.click("#startBtn");
verifie("animations réduites : le bandeau s'affiche", await p.isVisible("#bandeau"));
await p.mouse.click(180, 400);
await attends(400);
verifie("animations réduites : il s'efface au toucher", !(await p.isVisible("#bandeau")));
verifie("animations réduites : pas de transformation", (await p.evaluate(() => document.getElementById("bandeau").style.transform)) === "");
verifie("animations réduites : rien ne scintille", (await p.locator("#astres i").count()) === 0);

/* 8. le jeu classique : ni globe ni choix d'année */
p = await page();
await p.goto(srv.base + "bataille/?classique", { waitUntil: "load" });
await p.evaluate(() => localStorage.setItem("bataille-atlas", JSON.stringify({ lu: { capricorne: 1 }, ans: 2, max: 2, joue: 2 })));
await p.reload({ waitUntil: "load" });
await p.click("#startBtn");
verifie("classique : pas de choix d'année", !(await p.isVisible("#annees")));
verifie("classique : pas de globe", !(await p.isVisible("#globe")));

await navigateur.close();
srv.arreter();
if (erreurs.length) echecs.push("erreurs JS : " + erreurs.join(" | "));
if (echecs.length) { console.log("ÉCHEC bataille-parcours\n- " + echecs.join("\n- ")); process.exit(1); }
console.log("bataille-parcours : tout passe");
