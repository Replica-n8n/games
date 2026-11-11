import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Dig Zen, l'app installable. Ce que le banc prouve :
   1. SHELL (sw.js) contient TOUT ce que le jeu charge, et rien qui n'existe pas ;
      le jeu ne demande RIEN à un autre site (Three.js et polices sont dans le dossier) ;
   2. après la première visite, le cache contient chaque fichier À L'OCTET PRÈS ;
   3. réseau coupé, le jeu se recharge, la première fouille se lance et la pioche creuse ;
   4. on arrive sur l'accueil, qui couvre les outils, et « Installer le jeu » y est ;
   5. l'étagère affiche la version de sw.js.
     node tools/dig-pwa.mjs             contre le dépôt
     node tools/dig-pwa.mjs --enligne   contre la production */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const JEU = path.join(ICI, "..", "dig");
const ENLIGNE = process.argv.includes("--enligne");
const echecs = [];
const verifie = (nom, ok, detail) => { if (!ok) echecs.push(nom + (detail !== undefined ? " : " + detail : "")); };

const swTexte = fs.readFileSync(path.join(JEU, "sw.js"), "utf8");
const VERSION = swTexte.match(/var VERSION = "([^"]+)"/)[1];
const SHELL = [...swTexte.match(/var SHELL = \[([\s\S]*?)\];/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
for (const f of SHELL) if (f !== "./") verifie(`SHELL : ${f} existe`, fs.existsSync(path.join(JEU, f)));

const srv = ENLIGNE ? null : await servir();
const BASE = ENLIGNE ? "https://replica-n8n.github.io/games/dig/" : srv.base + "dig/";
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctx = await nav.newContext({ ...devices["Pixel 7"] });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));

const charges = new Set(), ailleurs = new Set();
p.on("request", (r) => { const u = new URL(r.url()); if (u.href.startsWith(BASE)) charges.add("./" + u.pathname.slice(new URL(BASE).pathname.length)); else if (u.protocol.startsWith("http")) ailleurs.add(u.origin); });
const pret = () => p.waitForFunction(() => window.__essais && window.__essais.phase === "attente", null, { timeout: 15000 });
await p.goto(BASE + "?nc=" + Date.now());
await pret();
await p.evaluate(() => navigator.serviceWorker.ready);
await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 }).catch(() => {});
if (!(await p.evaluate(() => !!navigator.serviceWorker.controller))) { await p.reload(); await pret(); }
await p.waitForTimeout(800);       // les polices se demandent après le premier dessin
for (const f of charges) { const propre = f.split("?")[0]; if (propre !== "./sw.js") verifie(`SHELL contient ${propre}, que le jeu charge`, SHELL.includes(propre) || propre === "./"); }
verifie("le jeu ne demande rien à un autre site", ailleurs.size === 0, [...ailleurs].join());
verifie("les deux polices sont chargées", await p.evaluate(() => document.fonts.check('16px "Alfa Slab One"') && document.fonts.check('700 16px "Atkinson Hyperlegible"')));

const contenus = await p.evaluate(async ({ version, shell }) => {
  const noms = await caches.keys(), nom = noms.find((k) => k.startsWith("dig:") && k.endsWith(version));
  if (!nom) return { nom: null, noms };
  const c = await caches.open(nom), out = {};
  for (const f of shell) { const r = await c.match(f); out[f] = r ? Array.from(new Uint8Array(await r.arrayBuffer())) : null; }
  return { nom, out };
}, { version: VERSION, shell: SHELL });
verifie(`un cache « dig:…${VERSION} » existe`, !!contenus.nom, JSON.stringify(contenus.noms));
if (contenus.nom) for (const f of SHELL) {
  if (f === "./") continue;
  const cache = contenus.out[f];
  if (ENLIGNE) verifie(`${f} est dans le cache`, !!cache);
  else { const disque = fs.readFileSync(path.join(JEU, f)); verifie(`cache = dépôt pour ${f}`, cache && Buffer.from(cache).equals(disque), cache ? `${cache.length} octets contre ${disque.length}` : "absent du cache"); }
}

verifie("on arrive sur l'accueil, et il couvre la pioche et le pinceau", await p.evaluate(() => { const m = document.getElementById("etagere"), b = document.getElementById("pioche").getBoundingClientRect(), e = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return !m.hidden && !!e && e.closest("#etagere") === m; }));
verifie("« Installer le jeu » est sur l'accueil", await p.locator("#installer").isVisible());
await p.locator("#installer").click();
verifie("sans invitation du navigateur, le bouton dit où installer", await p.locator("#aideInstaller").isVisible());
const version = await p.evaluate(async () => { for (let i = 0; i < 50; i++) { const t = document.getElementById("version").textContent; if (t) return t; await new Promise((r) => setTimeout(r, 100)); } return ""; });
verifie("l'accueil affiche la version de sw.js", version === "Version " + VERSION.replace("dig-", ""), version);
const manifeste = await p.evaluate(async () => (await fetch(document.querySelector('link[rel="manifest"]').href)).json());
verifie("le manifeste nomme le jeu Dig Zen, avec trois icônes", manifeste.name === "Dig Zen" && manifeste.icons.length === 3);

// 3. Réseau coupé
await ctx.setOffline(true);
await p.reload();
await pret().catch(() => {});
verifie("hors ligne, la carte de départ s'affiche", await p.evaluate(() => !!window.__essais && window.__essais.phase === "attente"));
await p.locator("#continuer").click(); await p.locator("#go").click();
const b = await p.locator("#toile").boundingBox();
const avant = await p.evaluate(() => [...M.values()].filter((e) => e.t === "sol").length);
await p.mouse.move(b.x + b.width / 2, b.y + b.height * 0.42); await p.mouse.down(); await p.waitForTimeout(1500); await p.mouse.up();
const apres = await p.evaluate(() => [...M.values()].filter((e) => e.t === "sol").length);
verifie("hors ligne, la pioche creuse", apres < avant, `${avant} cubes de terre avant, ${apres} après`);
await ctx.setOffline(false);

verifie("aucune erreur de page", erreurs.length === 0, erreurs.join(" | "));
await nav.close();
if (srv) srv.arreter();
if (echecs.length) { console.log("✗ " + echecs.join("\n✗ ")); process.exit(1); }
console.log(`✓ PWA vérifiée ${ENLIGNE ? "en production" : "contre le dépôt"} : ${SHELL.length} fichiers, ${VERSION}, hors ligne`);
