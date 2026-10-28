import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Ghost Train, l'app installable. Ce que le banc prouve :
   1. SHELL (sw.js) contient TOUT ce que le jeu charge (chaque module ES), et rien
      qui n'existe pas ;
   2. après la première visite, le cache contient chaque fichier À L'OCTET PRÈS
      comme dans le dépôt (un relais de Pages pourrait servir l'ancien) ;
   3. réseau coupé, l'écran titre se recharge et le premier étage se lance et se joue ;
   4. le bouton « Installer » est sur l'écran titre tant que le jeu n'est pas installé ;
   5. la version affichée est celle de sw.js.
     node tools/ghost-train-pwa.mjs             contre le dépôt
     node tools/ghost-train-pwa.mjs --enligne   contre la production */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const JEU = path.join(ICI, "..", "ghost-train");
const ENLIGNE = process.argv.includes("--enligne");
const echecs = [];
const verifie = (nom, ok, detail) => { if (!ok) echecs.push(nom + (detail !== undefined ? " : " + detail : "")); };

const swTexte = fs.readFileSync(path.join(JEU, "sw.js"), "utf8");
const VERSION = swTexte.match(/var VERSION = "([^"]+)"/)[1];
const SHELL = [...swTexte.match(/var SHELL = \[([\s\S]*?)\];/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

// 1. SHELL contre le disque : chaque entrée existe, et chaque module du jeu y est.
for (const f of SHELL) if (f !== "./") verifie(`SHELL : ${f} existe`, fs.existsSync(path.join(JEU, f)));
const modules = (dossier) => fs.readdirSync(path.join(JEU, dossier)).filter((f) => f.endsWith(".js")).map((f) => `./${dossier}/${f}`);
for (const m of [...modules("moteur"), ...modules("contenu"), ...modules("ecran"), "./app.js", "./entrees.js", "./sauvegarde.js", "./son.js"]) verifie(`SHELL contient ${m}`, SHELL.includes(m));

const srv = ENLIGNE ? null : await servir();
const BASE = ENLIGNE ? "https://replica-n8n.github.io/games/ghost-train/" : srv.base + "ghost-train/";
const nav = await chromium.launch();
const ctx = await nav.newContext({ ...devices["Pixel 7 landscape"] });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));

// Première visite : l'écran titre, pour voir tout ce qui est chargé.
const charges = new Set();
p.on("request", (r) => { const u = new URL(r.url()); if (u.href.startsWith(BASE)) charges.add("./" + u.pathname.slice(new URL(BASE).pathname.length)); });
await p.goto(BASE + "?nc=" + Date.now());
await p.waitForFunction(() => window.__essais && window.__essais.ecran === "titre");
await p.evaluate(() => navigator.serviceWorker.ready);
await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 }).catch(() => {});
if (!(await p.evaluate(() => !!navigator.serviceWorker.controller))) { await p.reload(); await p.waitForFunction(() => window.__essais && window.__essais.ecran === "titre"); }
for (const f of charges) {
  const propre = f.split("?")[0];
  if (propre === "./sw.js") continue;
  verifie(`SHELL contient ${propre}, que le jeu charge`, SHELL.includes(propre) || propre === "./");
}

// 2. Le cache contre le dépôt, à l'octet près (lu depuis la page : même origine).
const contenus = await p.evaluate(async ({ version, shell }) => {
  const noms = await caches.keys();
  const nom = noms.find((k) => k.startsWith("ghost-train:") && k.endsWith(version));
  if (!nom) return { nom: null, noms };
  const c = await caches.open(nom), out = {};
  for (const f of shell) {
    const r = await c.match(f);
    out[f] = r ? Array.from(new Uint8Array(await r.arrayBuffer())) : null;
  }
  return { nom, out };
}, { version: VERSION, shell: SHELL });
verifie(`un cache « ghost-train:…${VERSION} » existe`, !!contenus.nom, JSON.stringify(contenus.noms));
if (contenus.nom && !ENLIGNE) {
  for (const f of SHELL) {
    if (f === "./") continue;
    const disque = fs.readFileSync(path.join(JEU, f));
    const cache = contenus.out[f];
    verifie(`cache = dépôt pour ${f}`, cache && Buffer.from(cache).equals(disque), cache ? `${cache.length} octets contre ${disque.length}` : "absent du cache");
  }
}
if (contenus.nom && ENLIGNE) for (const f of SHELL) verifie(`${f} est dans le cache`, !!contenus.out[f]);

// 4 et 5. Installer et version, réseau encore là
verifie("le bouton « Installer » est sur l'écran titre", await p.locator('[data-id="installer"]').count() === 1);
await p.waitForFunction(() => window.__essais && document.querySelector('[data-id="reglages"]'), null, { timeout: 5000 });
await p.locator('[data-id="reglages"]').click();
// la version est dessinée sur la toile : on la lit dans l'état de l'app
const version = await p.evaluate(async () => { for (let i = 0; i < 50; i++) { const t = window.__essais.version; if (t) return t; await new Promise((r) => setTimeout(r, 100)); } return ""; });
verifie("les réglages affichent la version de sw.js", version === "VERSION " + VERSION.replace("ghost-train-", ""), version);
await p.locator('[data-id="retour"]').click();

// 3. Réseau coupé : l'écran titre se recharge, le premier étage se lance et avance.
await ctx.setOffline(true);
await p.reload();
await p.waitForFunction(() => window.__essais && window.__essais.ecran === "titre", null, { timeout: 10000 }).catch(() => {});
verifie("hors ligne, l'écran titre s'affiche", await p.evaluate(() => !!window.__essais && window.__essais.ecran === "titre"));
const joue = await p.evaluate(() => {
  if (!window.__essais) return { jeuAbsent: true }; // un module manque : le jeu n'a pas démarré
  window.__essais.lancer("rdc"); window.__essais.figer(true);
  for (let k = 0; k < 600; k++) window.__essais.pasJeu();
  const P = window.__essais.partie;
  return P ? { t: P.t, ents: P.ents.length, peint: true } : null;
});
verifie("hors ligne, le premier étage se lance et avance", joue && joue.t >= 9.9 && joue.peint, JSON.stringify(joue));
await ctx.setOffline(false);

verifie("aucune erreur de page", erreurs.length === 0, erreurs.join(" | "));
await nav.close();
if (srv) srv.arreter();
if (echecs.length) { console.log("✗ " + echecs.join("\n✗ ")); process.exit(1); }
console.log(`✓ PWA vérifiée ${ENLIGNE ? "en production" : "contre le dépôt"} : ${SHELL.length} fichiers, ${VERSION}, hors ligne`);
