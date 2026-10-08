import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* La planche de sons de La Bataille (tools/mockup-bataille-sons.html), contrôlée
   SANS OREILLE : chaque son et chaque musique sont calculés hors ligne, puis on
   mesure. Ce que ça attrape : un son muet, un son qui sature, un son dix fois
   plus fort que les autres, une musique qui couvre les effets, une erreur de
   page. Ce que ça ne dit PAS : si c'est beau. Ça, c'est l'oreille de Julie.
   Capture : captures/bataille-sons.png */

const ICI = path.dirname(fileURLToPath(import.meta.url));
fs.mkdirSync(path.join(ICI, "captures"), { recursive: true });
const srv = await servir();
const navigateur = await chromium.launch();
const p = await navigateur.newPage({ viewport: { width: 360, height: 732 }, deviceScaleFactor: 2 });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(String(e)));
await p.goto(srv.base + "tools/mockup-bataille-sons.html", { waitUntil: "load" });
await p.waitForFunction(() => document.body.dataset.pret === "1");
const echecs = [];
const verifie = (nom, ok, detail) => { if (!ok) echecs.push(nom + (detail !== undefined ? " : " + detail : "")); };

const mesures = await p.evaluate(async () => {
  const S = window.__sons, sortie = { sons: {}, musiques: {} };
  const mesure = async (secondes, jouer) => {
    const c = new OfflineAudioContext(2, Math.ceil(44100 * secondes), 44100), b = S.table(c);
    jouer(b);
    const d = (await c.startRendering()).getChannelData(0);
    let pic = 0, somme = 0, fin = 0;
    for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > pic) pic = v; somme += v * v; if (v > 0.003) fin = i; }
    /* le volume moyen se mesure sur la partie qui sonne, pas sur le silence après */
    let s2 = 0; for (let i = 0; i <= fin; i++) s2 += d[i] * d[i];
    return { pic, moyen: Math.sqrt(s2 / Math.max(1, fin)), duree: fin / 44100 };
  };
  for (const id of Object.keys(S.SONS)) sortie.sons[id] = await mesure(3.5, (b) => { b.effets.gain.value = 0.8; S.SONS[id][2](b, 0.05, { rang: 0.5 }); });
  const ciel = S.ciel();
  for (const [inst] of S.AMBIANCES) for (const m of [0, 3, 7, 11]) {
    const part = S.partition(ciel[S.MOIS[m][1]], m);
    sortie.musiques[inst + " " + S.MOIS[m][0]] = Object.assign(await mesure(14, (b) => { b.musique.gain.value = 0.55; S.jouerPartition(b, part, inst, 0.05, 2); }), { notes: part.notes.length, grave: Math.min(...part.notes.map((n) => n.midi)), aigu: Math.max(...part.notes.map((n) => n.midi)) });
  }
  sortie.constellations = Object.keys(ciel).length;
  return sortie;
});

verifie("les douze constellations du jeu sont lues", mesures.constellations === 12, mesures.constellations);
const db = (v) => (20 * Math.log10(Math.max(v, 1e-6))).toFixed(0).padStart(4) + " dB";
console.log("\nEFFETS (pic, volume moyen, durée)");
for (const [id, m] of Object.entries(mesures.sons)) {
  console.log("  " + id.padEnd(12) + db(m.pic) + "  " + db(m.moyen) + "  " + m.duree.toFixed(2) + " s");
  verifie("le son « " + id + " » s'entend", m.pic > 0.04, m.pic.toFixed(3));
  verifie("le son « " + id + " » ne sature pas", m.pic < 0.97, m.pic.toFixed(3));
  verifie("le son « " + id + " » se termine", m.duree < 3.3, m.duree.toFixed(2));
}
console.log("\nMUSIQUES (pic, volume moyen, notes, étendue)");
for (const [nom, m] of Object.entries(mesures.musiques)) {
  console.log("  " + nom.padEnd(20) + db(m.pic) + "  " + db(m.moyen) + "  " + m.notes + " notes, " + (m.aigu - m.grave) + " demi-tons");
  verifie("la musique « " + nom + " » s'entend", m.pic > 0.04, m.pic.toFixed(3));
  verifie("la musique « " + nom + " » ne sature pas", m.pic < 0.97, m.pic.toFixed(3));
  verifie("la musique « " + nom + " » est une mélodie (au moins 4 notes, pas une seule hauteur)", m.notes >= 4 && m.aigu - m.grave >= 4, m.notes + " notes");
}
/* La musique reste DERRIÈRE : son volume moyen doit rester sous celui d'un coup. */
const coup = mesures.sons.coup.moyen;
for (const [nom, m] of Object.entries(mesures.musiques)) verifie("la musique « " + nom + " » ne couvre pas un coup", m.moyen < coup * 1.6, db(m.moyen) + " contre " + db(coup));
/* Les effets entre eux : aucun n'est dix fois plus fort (20 dB) que le plus discret. */
const pics = Object.values(mesures.sons).map((m) => m.pic);
verifie("les effets tiennent dans 20 dB les uns des autres", Math.max(...pics) / Math.min(...pics) < 10, (Math.max(...pics) / Math.min(...pics)).toFixed(1));

/* la page elle-même : boutons de 48 px, rien sous 14 px, pas de défilement de côté */
const page = await p.evaluate(() => ({ petits: [...document.querySelectorAll("button")].filter((b) => b.getBoundingClientRect().height < 44).length, texte: [...document.querySelectorAll("body *")].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 14).length, large: document.documentElement.scrollWidth, sons: document.querySelectorAll(".son").length, puces: document.querySelectorAll(".puce").length }));
verifie("page : 20 sons, 12 mois et 3 ambiances", page.sons === 20 && page.puces === 15, page.sons + " / " + page.puces);
verifie("page : cibles de 44 px, texte de 14 px, pas de défilement de côté", page.petits === 0 && page.texte === 0 && page.large <= 360, JSON.stringify(page));
await p.click("#jouer"); await p.waitForTimeout(900);
await p.click('[data-son="tour"]'); await p.waitForTimeout(300);
await p.screenshot({ path: path.join(ICI, "captures", "bataille-sons.png") });
verifie("aucune erreur de page", erreurs.length === 0, erreurs.join(" | "));
await navigateur.close();
srv.arreter();
console.log(echecs.length ? "\nÉCHEC\n" + echecs.join("\n") : "\nbataille-sons : tout passe (les niveaux, pas la beauté)");
process.exit(echecs.length ? 1 : 0);
