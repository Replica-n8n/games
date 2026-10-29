import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Les SEIZE effets dans le vrai jeu (maquette validée par Julie le 2026-10-28 :
   tools/mockup-bataille-effets.html). Le combat est figé, chaque effet posé à la main
   sur les vraies cartes et photographié à trois instants ; puis un vrai combat aux
   gravures mesure le coût d'une image. Planches : bataille/docs/effets-jeu-gravures.png
   et effets-jeu-arcanes.png. */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(ICI, "captures", "effets-jeu");
fs.mkdirSync(TMP, { recursive: true });
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist"] });
const echecs = [];
const verifie = (nom, ok, detail) => { if (!ok) echecs.push(nom + (detail !== undefined ? " : " + detail : "")); };
const p = await nav.newPage({ viewport: { width: 360, height: 732 }, deviceScaleFactor: 2 });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(String(e)));
await p.goto(srv.base + "bataille/", { waitUntil: "load" });
await p.click("#startBtn");
await p.evaluate(() => { const E = window.__essais; ["givre", "ailes", "epine", "phenix", "sangsue"].forEach((g, i) => E.carte(i, g)); E.sansLui(); });
await p.click("#goBtn");
await p.waitForFunction(() => window.__essais.etat().phase === "fight");
await p.waitForTimeout(900);
await p.evaluate(() => window.__essais.fige(true));
/* mes cartes 0 à 4, celles du Maudit 5 à 9 ; 2 et 7 au milieu */
const EFFETS = [
  ["phenix", 2, {}, [0.25, 0.6, 1.2]], ["givre", 2, { v: 7 }, [0.1, 0.5, 1.0]], ["epine", 2, { v: 7 }, [0.2, 0.45, 1.2]],
  ["ailes", 2, { v: 7, o: 6 }, [0.15, 0.3, 0.6]], ["bouclier", 2, { v: 7 }, [0.05, 0.2, 0.5]], ["sangsue", 2, { v: 7 }, [0.25, 0.45, 0.7]],
  ["criniere", 2, { v: 7 }, [0.1, 0.2, 0.4]], ["eclair", 2, { v: 7 }, [0.05, 0.15, 0.4]], ["heritage", 2, {}, [0.3, 0.7, 1.2]],
  ["a_tour", 7, { camp: 1 }, [0.1, 0.25, 0.6]], ["a_mort", 7, { camp: 1 }, [0.2, 0.35, 0.8]], ["a_force", 0, { camp: 1, list: [0, 1, 2, 3, 4] }, [0.2, 0.4, 0.8]],
  ["a_roue", 1, { camp: 1, lo: 1, hi: 8 }, [0.4, 0.7, 1.0]], ["a_temperance", 0, { camp: 1, list: [0, 1, 2, 3, 4] }, [0.3, 0.6, 1.0]],
  ["a_etoile", 2, { camp: 1 }, [0.3, 0.5, 0.8]], ["a_soleil", 5, { camp: 1, list: [5, 6, 7, 8, 9] }, [0.2, 0.4, 1.0]],
];
const cadre = await p.evaluate(() => { const e = window.__essais.etat(); return { T0: e.T0, T1: e.T1 }; });
const clip = { x: 0, y: cadre.T0 - 40, width: 360, height: cadre.T1 - cadre.T0 + 60 };
for (const [id, i, o, instants] of EFFETS) for (const [n, t] of instants.entries()) {
  const ok = await p.evaluate(({ id, i, o, t }) => { const r = window.__essais.effet(id, i, Object.assign({ seul: true, t }, o)); window.__essais.dessine(); return r; }, { id, i, o, t });
  verifie(id + " se pose", ok);
  await p.screenshot({ path: path.join(TMP, id + "-" + n + ".png"), clip });
}
await p.evaluate(() => { window.__essais.effet("phenix", 2, { seul: true, t: 99 }); window.__essais.dessine(); });

/* la Tour en grand, mesurée AVANT le vrai combat : s'il se finit, la carte 7 n'existe plus */
const fort = await p.evaluate(() => { const E = window.__essais; E.fige(true); E.effet('a_tour', 7, { seul: true, camp: 1, t: 0.07 }); E.dessine(); return { secousse: document.getElementById('jeu').style.transform, eclat: +document.getElementById('eclat').style.opacity }; });
/* un vrai combat, dix gravures : combien coûte une image ? */
await p.evaluate(() => { const E = window.__essais; ["bouclier", "eclair", "givre", "epine", "ailes"].forEach((g, i) => E.carte(5 + i, g)); E.vitesse(1); E.fige(false); });
const vus = new Set(); let ms = 0, pic = 0;
for (let i = 0; i < 60; i++) {
  await p.waitForTimeout(100);
  const e = await p.evaluate(() => window.__essais.effets());
  e.ids.forEach((x) => vus.add(x));
  if (e.effets > pic) { pic = e.effets; ms = await p.evaluate(() => window.__essais.peins(30) / 30); }
  if ((await p.evaluate(() => window.__essais.etat().phase)) !== "fight") break;
}
verifie("une image se peint en moins de 16 ms au plus fort des effets", ms < 16, ms.toFixed(1) + " ms pour " + pic + " effets");
verifie("des gravures agissent dans un vrai combat", vus.size >= 3, [...vus].join());
verifie("aucune erreur de page", erreurs.length === 0, erreurs.join(" | "));

/* en animations réduites : aucune secousse, l'éclat au tiers */
const pc = await nav.newPage({ viewport: { width: 360, height: 732 }, reducedMotion: 'reduce' });
await pc.goto(srv.base + 'bataille/', { waitUntil: 'load' });
await pc.click('#startBtn');await pc.click('#goBtn');
await pc.waitForFunction(() => window.__essais.etat().phase === 'fight');
const calme = await pc.evaluate(() => { const E = window.__essais; E.fige(true); E.effet('a_tour', 7, { seul: true, camp: 1, t: 0.07 }); E.dessine(); return { secousse: document.getElementById('jeu').style.transform, eclat: +document.getElementById('eclat').style.opacity }; });
verifie('animations réduites : pas de secousse', calme.secousse === '', calme.secousse);
verifie('animations réduites : éclat au tiers', calme.eclat > 0 && calme.eclat <= 0.25, calme.eclat);
verifie('la Tour secoue le tapis', fort.secousse !== '', fort.secousse);
verifie('la Tour éclaire tout l écran', fort.eclat >= 0.5, fort.eclat);
await pc.close();

async function planche(ids, fichier, titre) {
  const q = await nav.newPage({ viewport: { width: 1400, height: 900 } });
  const cases = ids.map(([id]) => `<div><div style="font:600 18px Georgia;color:#feca63;margin:6px 0">${id.replace("a_", "")}</div><div style="display:flex;gap:6px">${[0, 1, 2].map((n) => `<img src="data:image/png;base64,${fs.readFileSync(path.join(TMP, id + "-" + n + ".png")).toString("base64")}" style="width:150px;border-radius:10px">`).join("")}</div></div>`).join("");
  await q.setContent(`<body style="margin:0;background:#05082a;color:#f4f2ff;padding:16px"><div style="font:600 22px Georgia;margin-bottom:8px">${titre}</div><div style="display:grid;grid-template-columns:repeat(3,auto);gap:14px 24px;justify-content:start">${cases}</div></body>`);
  await q.screenshot({ path: path.join(ICI, "..", "bataille", "docs", fichier), fullPage: true });
  await q.close();
}
await planche(EFFETS.slice(0, 9), "effets-jeu-gravures.png", "Dans le jeu : les gravures");
await planche(EFFETS.slice(9), "effets-jeu-arcanes.png", "Dans le jeu : les arcanes");
await nav.close();
srv.arreter();
console.log(echecs.length ? "ÉCHEC\n" + echecs.join("\n") : "bataille-effets-jeu : tout passe (" + ms.toFixed(1) + " ms par image, " + pic + " effets ; vus : " + [...vus].join(" ") + ")");
process.exit(echecs.length ? 1 : 0);
