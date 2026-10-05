import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* L'arcade tient-elle sa promesse : UNE visite, et tous les jeux marchent sans
   réseau ? On ouvre la page d'accueil, on attend qu'elle annonce « hors ligne »,
   on coupe le réseau, puis on ouvre chaque jeu par sa tuile et on revient.
   Aussi : la grande tuile est le dernier jeu joué, le bouton Installer est là,
   Petit Plus contre Petit Minus n'y figure pas, rien sous 14 px, cibles de 44 px,
   texte des tuiles lisible sur leur couleur. --enligne : la même chose sur la
   production, une fois qu'elle sert la version du dépôt.
   Captures : captures/arcade-*.png. */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, "..");
const SORTIE = path.join(ICI, "captures");
fs.mkdirSync(SORTIE, { recursive: true });
const ENLIGNE = process.argv.includes("--enligne");
const srv = ENLIGNE ? { base: "https://replica-n8n.github.io/games/", arreter() {} } : await servir();
const depot = (f) => (ENLIGNE ? execFileSync("git", ["show", "HEAD:" + f], { cwd: RACINE, maxBuffer: 1 << 26 }).toString("utf8") : fs.readFileSync(path.join(RACINE, f), "utf8"));
const version = /VERSION = "([^"]+)"/.exec(depot("sw.js"))[1];
if (ENLIGNE) {
  let vue = "";
  for (let i = 0; i < 40 && vue !== version; i++) {
    if (i) await new Promise((ok) => setTimeout(ok, 15000));
    const txt = await fetch(srv.base + "sw.js?nc=" + Date.now()).then((r) => (r.ok ? r.text() : ""), () => "");
    vue = (/VERSION = "([^"]+)"/.exec(txt) || [])[1] || "";
  }
  if (vue !== version) { console.log("ÉCHEC\nla production sert « " + vue + " », le dépôt est en " + version); process.exit(1); }
}
const JEUX = [["bataille", "La Bataille"], ["toto", "Teeth of the Ocean"], ["paper-race", "Paper Race"], ["serpentin", "Le chevalier"], ["echecs", "Échecs et Dames"]];
const echecs = [];
const verifie = (nom, ok, detail) => { if (!ok) echecs.push(nom + (detail !== undefined ? " : " + detail : "")); };

const navigateur = await chromium.launch();
const ctx = await navigateur.newContext({ viewport: { width: 360, height: 732 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(String(e)));
await p.goto(srv.base, { waitUntil: "load" });
await p.waitForFunction(() => /hors ligne/.test(document.getElementById("etat").textContent), null, { timeout: 60000 }).catch(() => {});
verifie("l'arcade annonce que tout est prêt hors ligne", (await p.textContent("#etat")) === "5 jeux · hors ligne", await p.textContent("#etat"));
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: path.join(SORTIE, "arcade-accueil.png") });

const m = await p.evaluate(() => {
  const lum = (c) => { const v = c.match(/\d+/g).slice(0, 3).map((n) => { n /= 255; return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const tuiles = [...document.querySelectorAll("a.tuile")].map((a) => { const r = a.getBoundingClientRect(), fond = getComputedStyle(a).backgroundImage, coul = fond !== "none" ? fond.match(/rgb\([^)]*\)/g) : [getComputedStyle(a).backgroundColor];
    const t = lum(getComputedStyle(a).color), pire = Math.min(...coul.map((c) => { const f = lum(c); return (Math.max(t, f) + 0.05) / (Math.min(t, f) + 0.05); }));
    return { jeu: a.dataset.jeu, nom: a.querySelector("b").textContent, grand: a.classList.contains("grand"), w: r.width, h: r.height, contraste: pire }; });
  const petits = [...document.querySelectorAll("body *")].filter((e) => e.getClientRects().length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 14).map((e) => e.tagName);
  return { tuiles, petits, texte: document.body.textContent, large: document.documentElement.scrollWidth, inst: document.getElementById("instBtn").getBoundingClientRect().height };
});
verifie("cinq tuiles, une par jeu", m.tuiles.length === 5 && JEUX.every(([id, nom]) => m.tuiles.some((t) => t.jeu === id && t.nom === nom)), m.tuiles.map((t) => t.jeu).join());
verifie("Petit Plus contre Petit Minus n'est pas dans l'arcade", !/petit/i.test(m.texte) && !(await p.content()).includes("petit-plus-minus"));
verifie("aucun texte sous 14 px", m.petits.length === 0, m.petits.join());
verifie("pas de défilement horizontal", m.large <= 360, m.large);
for (const t of m.tuiles) { verifie("tuile " + t.jeu + " : cible d'au moins 44 px", t.w >= 44 && t.h >= 44); verifie("tuile " + t.jeu + " : nom lisible sur sa couleur (4,5:1)", t.contraste >= 4.5, t.contraste.toFixed(2)); }
verifie("le bouton Installer est là, 44 px au moins", (await p.isVisible("#instBtn")) && m.inst >= 44, m.inst);
await p.click("#instBtn");
verifie("sans invitation, le bouton dit où installer", (await p.isVisible("#instAide")) && (await p.textContent("#instAide")).includes("écran d’accueil"));

/* le réseau est coupé : chaque jeu doit s'ouvrir depuis sa tuile */
await ctx.setOffline(true);
for (const [id] of JEUX) {
  await p.click('a.tuile[data-jeu="' + id + '"]');
  await p.waitForLoadState("load");
  const ok = await p.evaluate(() => document.title !== "Arcade" && document.title !== "" && document.body.children.length > 0 && !!navigator.serviceWorker.controller);
  verifie("hors ligne, " + id + " s'ouvre depuis l'arcade", ok && p.url().includes("/" + id + "/"), p.url() + " « " + (await p.title()) + " »");
  await p.goBack({ waitUntil: "load" });
  const grande = await p.getAttribute("a.tuile.grand", "data-jeu");
  verifie("au retour, la grande tuile est " + id, grande === id && (await p.textContent("a.tuile.grand i")) === "Reprendre", grande);
}
await p.evaluate(() => localStorage.setItem("bataille-partie", JSON.stringify({ v: 1, round: 5 })));
await p.evaluate(() => { localStorage.setItem("arcade-dernier", "bataille"); });
await p.reload({ waitUntil: "load" });
verifie("hors ligne, l'arcade elle-même se recharge", (await p.title()) === "Arcade");
verifie("la grande tuile dit où en est La Bataille", (await p.textContent("a.tuile.grand small")) === "Mois 5 sur 12");
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: path.join(SORTIE, "arcade-reprendre.png") });
verifie("aucune erreur de page", erreurs.length === 0, erreurs.join(" | "));
await navigateur.close();
srv.arreter();
console.log(echecs.length ? "ÉCHEC\n" + echecs.join("\n") : "arcade-pwa" + (ENLIGNE ? " en ligne" : "") + " : tout passe (" + version + ")");
process.exit(echecs.length ? 1 : 0);
