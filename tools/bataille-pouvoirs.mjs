import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Chaque mois change-t-il vraiment la règle qu'il annonce ? Le banc pose dix
   cartes connues, fige le hasard (Math.random = 0,5 : pas de coup critique, dégâts
   au milieu de leur fourchette) et MESURE l'effet de chacun des douze mois, plus
   ce qui doit se voir : l'étoile d'or des cartes avantagées et les flèches du
   Sagittaire en vol. Captures : captures/bataille-pouvoir-*.png. */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, "captures");
fs.mkdirSync(SORTIE, { recursive: true });
const srv = await servir();
const navigateur = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const echecs = [];
const verifie = (nom, ok, detail) => { if (!ok) echecs.push(nom + (detail !== undefined ? " : " + detail : "")); };

/* colonne par colonne : aucune égalité, toutes les couleurs des deux côtés */
const MOI = [["7", "♠"], ["R", "♥"], ["10", "♦"], ["D", "♣"], ["A", "♣"]];
const LUI = [["8", "♠"], ["V", "♥"], ["9", "♦"], ["10", "♣"], ["R", "♦"]];
const VAL = { 7: 7, 8: 8, 9: 9, 10: 10, V: 11, D: 12, R: 13, A: 14 };
const vie = (c) => 12 + VAL[c[0]] * 3.5, frappe = (c) => 3 + VAL[c[0]] * 0.5;
const TOUTES = [...MOI, ...LUI];

async function mois(id, capture) {
  const ctx = await navigateur.newContext({ viewport: { width: 360, height: 732 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const erreurs = [];
  p.on("pageerror", (e) => erreurs.push(String(e)));
  await p.goto(srv.base + "bataille/", { waitUntil: "load" });
  await p.click("#startBtn");
  await p.evaluate(([id, m, l]) => { Math.random = () => 0.5; window.__essais.mois(id); window.__essais.pose(m, l); window.__essais.donne([], []); }, [id, MOI, LUI]);
  await p.waitForTimeout(250);
  const avant = await p.evaluate(() => window.__essais.etat());
  if (capture === "placement") await p.screenshot({ path: path.join(SORTIE, "bataille-pouvoir-" + id + ".png") });
  await p.click("#goBtn");
  await p.waitForFunction(() => window.__essais.etat().phase === "fight");
  if (capture === "vol") { await p.waitForTimeout(260); await p.evaluate(() => window.__essais.vitesse(0)); await p.waitForTimeout(80); await p.screenshot({ path: path.join(SORTIE, "bataille-pouvoir-" + id + ".png") }); await p.evaluate(() => window.__essais.vitesse(1)); }
  return { p, ctx, avant, erreurs, etat: () => p.evaluate(() => window.__essais.etat()), fige: () => p.evaluate(() => window.__essais.vitesse(0)) };
}
const fin = async (m, id) => { verifie(id + " : aucune erreur de page", m.erreurs.length === 0, m.erreurs.join(" | ")); await m.ctx.close(); };
const proche = (a, b) => Math.abs(a - b) < 0.011;
const etoiles = (e) => e.unites.filter((u) => u.favori).map((u) => u.r + u.s).sort().join(" ");
const attendues = (f) => TOUTES.filter((c, i) => f(c, i % 5)).map((c) => c[0] + c[1]).sort().join(" ");

/* --- les mois qui changent la vie des cartes --- */
for (const [id, regle, fav] of [
  ["capricorne", (c) => Math.round(vie(c) * 1.3), null],
  ["balance", () => 45, null],
  ["cancer", (c, col) => Math.round(vie(c) * (col === 0 || col === 4 ? 1.5 : 1)), (c, col) => col === 0 || col === 4],
]) {
  const m = await mois(id, id === "cancer" ? "placement" : null);
  await m.fige();
  const e = await m.etat();
  e.unites.forEach((u, i) => verifie(id + " : vie de " + u.r + u.s, u.max === regle(TOUTES[i], i % 5), u.max + " au lieu de " + regle(TOUTES[i], i % 5)));
  verifie(id + " : étoiles d'or", etoiles(m.avant) === (fav ? attendues(fav) : ""), etoiles(m.avant));
  await fin(m, id);
}
/* --- Taureau : les Carreaux bloquent le premier coup --- */
{
  const m = await mois("taureau", "placement"); await m.fige();
  const e = await m.etat();
  e.unites.forEach((u) => verifie("taureau : bouclier de " + u.r + u.s, u.shield === (u.s === "♦")));
  verifie("taureau : étoiles d'or sur les Carreaux", etoiles(m.avant) === attendues((c) => c[1] === "♦"), etoiles(m.avant));
  const c1 = await m.p.evaluate(() => window.__essais.coup(5, 2)), c2 = await m.p.evaluate(() => window.__essais.coup(5, 2));
  verifie("taureau : le premier coup sur un Carreau est bloqué, pas le deuxième", c1.degats === 0 && c2.degats === Math.round(frappe(LUI[0])), c1.degats + " puis " + c2.degats);
  await fin(m, "taureau");
}
/* --- Gémeaux : une carte de chaque camp se dédouble --- */
{
  const m = await mois("gemeaux", null); await m.fige();
  const e = await m.etat();
  verifie("gémeaux : un double par camp", e.unites.filter((u) => u.clone && u.side > 0).length === 1 && e.unites.filter((u) => u.clone && u.side < 0).length === 1, e.unites.filter((u) => u.clone).length);
  await fin(m, "gemeaux");
}
/* --- Sagittaire : chaque Trèfle tire, la flèche vole puis blesse --- */
{
  const m = await mois("sagittaire", "vol");
  verifie("sagittaire : étoiles d'or sur les Trèfles", etoiles(m.avant) === attendues((c) => c[1] === "♣"), etoiles(m.avant));
  verifie("sagittaire : trois Trèfles, trois flèches", (await m.p.evaluate(() => window.__essais.tirees())) === 3);
  verifie("sagittaire : le ruban l'annonce", (await m.p.textContent("#ruban")) === "Les Trèfles tirent");
  await m.p.waitForTimeout(650); await m.fige();
  const e = await m.etat();
  /* D♣ tire sur 10♣ (colonne IV), A♣ sur R♦ (colonne V), 10♣ sur D♣ : 12 chacun */
  const touches = e.unites.filter((u) => u.max - u.hp === 12).map((u) => u.r + u.s).sort().join(" ");
  verifie("sagittaire : 12 de dégâts sur les trois cibles, rien ailleurs", touches === "10♣ D♣ R♦" && e.unites.filter((u) => u.hp === u.max).length === 7, touches);
  await fin(m, "sagittaire");
}
/* --- les mois qui changent les coups : on frappe à la main, le combat figé --- */
{
  const m = await mois("lion", "placement"); await m.fige();
  verifie("lion : étoiles d'or sur les figures", etoiles(m.avant) === attendues((c) => "VDR".includes(c[0])), etoiles(m.avant));
  const fig = await m.p.evaluate(() => window.__essais.coup(1, 6)), pas = await m.p.evaluate(() => window.__essais.coup(0, 5));
  verifie("lion : un Roi frappe une fois et demie plus fort", fig.degats === Math.round(frappe(MOI[1]) * 1.5), fig.degats);
  verifie("lion : un 7 frappe normalement", pas.degats === Math.round(frappe(MOI[0])), pas.degats);
  await fin(m, "lion");
}
{
  const m = await mois("belier", null); await m.fige();
  const c1 = await m.p.evaluate(() => window.__essais.coup(0, 5)), c2 = await m.p.evaluate(() => window.__essais.coup(0, 5));
  verifie("bélier : le premier coup fait double, le deuxième non", c1.degats === Math.round(frappe(MOI[0]) * 2) && c2.degats === Math.round(frappe(MOI[0])), c1.degats + " puis " + c2.degats);
  await fin(m, "belier");
}
{
  const m = await mois("poissons", null); await m.fige();
  verifie("poissons : étoiles d'or sur les Cœurs", etoiles(m.avant) === attendues((c) => c[1] === "♥"), etoiles(m.avant));
  await m.p.evaluate(() => { window.__essais.blesse(1, 20); window.__essais.blesse(0, 20); });
  const coeur = await m.p.evaluate(() => window.__essais.coup(1, 6)), pique = await m.p.evaluate(() => window.__essais.coup(0, 5));
  verifie("poissons : un Cœur se soigne de 40 % de son coup", proche(coeur.soin, frappe(MOI[1]) * 0.4), coeur.soin);
  verifie("poissons : un Pique ne se soigne pas", pique.soin === 0, pique.soin);
  await fin(m, "poissons");
}
{
  const m = await mois("scorpion", null); await m.fige();
  const c = await m.p.evaluate(() => window.__essais.coup(0, 5));
  verifie("scorpion : un coup empoisonne pour 3 secondes", c.poison === 3, c.poison);
  await fin(m, "scorpion");
}
{
  const m = await mois("verseau", "placement"); await m.fige();
  verifie("verseau : étoiles d'or sur les Piques", etoiles(m.avant) === attendues((c) => c[1] === "♠"), etoiles(m.avant));
  const pique = await m.p.evaluate(() => window.__essais.rythme(0)), coeur = await m.p.evaluate(() => window.__essais.rythme(1));
  verifie("verseau : un Pique frappe deux fois plus souvent", proche(pique * 2, coeur), pique + " contre " + coeur);
  await fin(m, "verseau");
}
/* --- Vierge : chaque carte vaincue en rapporte une deuxième --- */
{
  const m = await mois("vierge", null);
  await m.p.evaluate(() => window.__essais.vitesse(12));
  await m.p.waitForFunction(() => window.__essais.etat().phase === "result", null, { timeout: 60000 });
  const n = (await m.p.textContent("#pageP")).match(/\d+/g).map(Number), total = n[0] + n[1];
  verifie("vierge : les cartes changent de camp deux par deux", total % 2 === 0 && total >= 10, n.join(" + "));
  await fin(m, "vierge");
}
await navigateur.close();
srv.arreter();
console.log(echecs.length ? "ÉCHEC\n" + echecs.join("\n") : "bataille-pouvoirs : les douze mois font ce qu'ils annoncent");
process.exit(echecs.length ? 1 : 0);
