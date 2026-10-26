import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Ghost Train : le jeu dans un vrai navigateur, téléphone en paysage. Le banc
   joue la mission 1 avec le robot (crochet __essais.piloter) et photographie
   chaque moment dans docs/ghost-train-ui/ ; il échoue sur une erreur de page,
   un écran qui n'arrive pas, ou un bouton plus petit que 44 px.
   Il mesure aussi les images/s AVEC la carte graphique pendant une vraie minute
   de jeu (moyenne et pire image).
     node tools/ghost-train-ui.mjs */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, "..", "docs", "ghost-train-ui");
fs.mkdirSync(SORTIE, { recursive: true });
const echecs = [];
const verifie = (nom, ok, detail) => { if (!ok) echecs.push(nom + (detail !== undefined ? " : " + detail : "")); };

// Le décor ne s'écrit JAMAIS en brut sur la toile du jeu (1.0.1) : sur Android, il
// repassait par carreaux par-dessus le wagon et la radio. Aucun navigateur de banc
// ne le reproduit, d'où ce contrôle du code.
for (const f of fs.readdirSync(path.join(ICI, "..", "ghost-train", "ecran"))) {
  const code = fs.readFileSync(path.join(ICI, "..", "ghost-train", "ecran", f), "utf8");
  verifie(`ecran/${f} : pas de putImageData sur la toile du jeu`, !/\bctx\.putImageData/.test(code));
}
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctx = await nav.newContext({ ...devices["Pixel 7 landscape"] });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
await p.goto(srv.base + "ghost-train/");
await p.waitForFunction(() => window.__essais && window.__essais.ecran === "gare");
const image = async (nom) => { await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))); await p.locator("#toile").screenshot({ path: path.join(SORTIE, nom + ".png") }); };

// 1. La gare : la mission 1 se lance, les autres sont « SUPPRIMÉ »
await image("1-gare");
verifie("gare : bouton Partir", await p.locator('[data-id="partir:hall"]').count() === 1);
verifie("gare : bouton Réglages", await p.locator('[data-id="reglages"]').count() === 1);

// 2. La mission jouée par le robot, en pas accélérés, photographiée à chaque moment
await p.evaluate(async () => {
  const { creeBot } = await import("/tools/ghost-train-bot.mjs");
  window.__creeBot = creeBot;
  window.__bot = creeBot("expert", { voie: "d" });
  window.__essais.piloter((q) => window.__bot(q));
  window.__essais.lancer("hall");
  window.__essais.figer(true);
});
verifie("jeu : bouton TIRER au doigt", await p.locator("#b-tirer").isVisible());
const tirer = await p.locator("#b-tirer").boundingBox();
verifie("TIRER fait au moins 44 px", tirer && tirer.width >= 44 && tirer.height >= 44, tirer && `${Math.round(tirer.width)} px`);
const pause = await p.locator("#b-pause").boundingBox();
verifie("Pause fait au moins 44 px", pause && pause.width >= 44, pause && `${Math.round(pause.width)} px`);

/** Avance la partie jusqu'à ce que `cond` soit vrai (au plus `max` secondes de jeu). */
const jusqua = (cond, max = 200) => p.evaluate(({ cond, max }) => {
  const f = new Function("p", "return " + cond);
  for (let i = 0; i < max * 60; i++) {
    const q = window.__essais.partie;
    if (!q || window.__essais.ecran !== "jeu") return false;
    if (f(q)) return true;
    window.__essais.pasJeu();
  }
  return false;
}, { cond, max });

const MOMENTS = [
  ["3-goule-tenue", "p.ents.some(e => e.tenu && e.type === 'goule' && e.boite)"],
  ["4-lumi", "p.ents.some(e => e.type === 'lumi' && e.boite && e.boite.cx > 100 && e.boite.cx < 220)"],
  ["5-secret", "p.ents.some(e => e.type === 'secret' && e.boite && e.charge > 0.2)"],
  ["6-aiguillage", "p.rail === 'aiguillage' && p.levier && p.levier.charge > 0.15"],
  ["6b-clac", "p.rail === 'aiguillage' && p.levier && p.levier.cote === 'd'"],
  ["7-vestiaire", "p.voie === 'd' && p.rail === 'arret' && p.camZ === 46 && p.ents.some(e => e.type === 'gouleVol') && p.ents.some(e => e.type === 'goule')"],
  ["8-majordome", "p.boss && p.boss.entree > 2.5 && p.tire"],
  ["9-leurres", "p.ents.filter(e => e.type === 'leurre').length === 2 && p.boss.x !== undefined && Math.abs(p.boss.x - p.boss.cible) < 0.1"],
  ["10-capture-boss", "p.boss && p.boss.etat === 'cap' && p.boss.ct > 0.6"],
];
for (const [nom, cond] of MOMENTS) {
  const ok = await jusqua(cond);
  verifie(`moment ${nom}`, ok, ok ? "" : JSON.stringify(await p.evaluate(() => { const q = window.__essais.partie; return { ecran: window.__essais.ecran, t: q && q.t, rail: q && q.rail, etat: q && q.etat, camZ: q && q.camZ }; })));
  if (ok) { await image(nom); console.log(nom, await p.evaluate(() => window.__essais.partie.t.toFixed(1))); }
}
const fini = await jusqua("false", 30);
await p.waitForFunction(() => window.__essais.ecran === "bilan", null, { timeout: 5000 }).catch(() => {});
verifie("bilan après la mission", await p.evaluate(() => window.__essais.ecran) === "bilan");
await image("11-bilan");
verifie("bilan : note écrite à la gare", await p.evaluate(() => !!window.__essais.sauvegarde.missions.hall?.note));

// 2 bis. Les missions 2 à 4, jouées chacune jusqu'au bilan par l'expert
const AUTRES = {
  bibliotheque: [["b1-drap", "p.ents.some(e => e.type === 'drap' && e.revele > 0 && e.boite)"], ["b2-ombre", "p.ents.some(e => e.type === 'ombre' && e.revele > 0 && e.boite)"], ["b3-bibliothecaire", "p.boss && p.boss.entree > 2.5 && p.ents.some(e => e.type === 'livre')"]],
  bal: [["s1-saxo", "p.ents.some(e => e.type === 'saxo' && e.boite && e.boite.w > 16)"], ["s2-parfait", "p.parfaits >= 1"], ["s3-super", "p.superT > 0.25"], ["s4-chef", "p.boss && p.boss.entree > 2.5"]],
  grenier: [["g1-crane", "p.ents.some(e => e.type === 'crane' && e.etat === 'vit' && e.boite && e.boite.w > 17)"], ["g2-gouvernante", "p.boss && p.boss.entree > 2.5 && p.boss.bouclier"], ["g3-etourdie", "p.boss && p.boss.etourdi > 0.5"]],
};
for (const [id, moments] of Object.entries(AUTRES)) {
  await p.evaluate((id) => { window.__bot = window.__creeBot("expert", { voie: "d" }); window.__essais.piloter((q) => window.__bot(q)); window.__essais.lancer(id); window.__essais.figer(true); }, id);
  for (const [nom, cond] of moments) {
    const ok = await jusqua(cond, 300);
    verifie(`${id} : moment ${nom}`, ok); console.log(id, nom, ok, await p.evaluate(() => { const q = window.__essais.partie; return window.__essais.ecran + " " + (q && q.t.toFixed(1)) + " " + (q && q.etat); }));
    if (ok) await image(nom);
  }
  await jusqua("false", 300);
  await p.waitForFunction(() => window.__essais.ecran !== "jeu", null, { timeout: 5000 }).catch(() => {});
  verifie(`${id} : l'expert finit la mission`, await p.evaluate(() => window.__essais.ecran) === "bilan", await p.evaluate(() => window.__essais.ecran));
  await p.evaluate(() => window.__essais.action('gare'));
}

// 3. Les réglages
await p.evaluate(() => window.__essais.action('gare'));
await p.locator('[data-id="reglages"]').click();
await image("12-reglages");
await p.locator('[data-id="gaucher"]').click();
verifie("réglages : gaucher retenu", await p.evaluate(() => window.__essais.reglages.gaucher === true));
await p.locator('[data-id="gaucher"]').click();
await p.locator('[data-id="retour"]').click();

// 4. Pause (Échap), puis défaite sans robot
await p.evaluate(() => { window.__essais.piloter(() => ({ x: 20, y: 20, tire: false })); window.__essais.lancer("hall"); window.__essais.figer(true); });
await jusqua("p.t > 3");
await p.keyboard.press("Escape");
verifie("pause", await p.evaluate(() => window.__essais.ecran) === "pause");
await image("13-pause");
await p.locator('[data-id="reprendre"]').click();
// La bave : une goule frappe le wagon, l'écran en garde la trace et elle dégouline
verifie("bave : une goule frappe", await jusqua("p.coeursPerdus >= 1", 120));
await p.evaluate(() => { for (let k = 0; k < 70; k++) window.__essais.pasJeu(); });
await image("14a-bave");
await jusqua("false", 200);
await p.waitForFunction(() => window.__essais.ecran === "defaite", null, { timeout: 5000 }).catch(() => {});
verifie("défaite", await p.evaluate(() => window.__essais.ecran) === "defaite");
await image("14-defaite");

// 5. Images/s pendant 20 s de vraie partie au premier arrêt, avec la carte graphique
await p.evaluate(() => { window.__essais.piloter((q) => window.__bot(q)); window.__essais.lancer("hall"); window.__essais.figer(false); });
const mesure = await p.evaluate(() => new Promise((r) => {
  const t = []; let avant = performance.now(); const debut = avant;
  const f = (m) => { t.push(m - avant); avant = m; if (m - debut < 20000) requestAnimationFrame(f); else r(t); };
  requestAnimationFrame(f);
}));
const ips = 1000 / (mesure.reduce((a, b) => a + b, 0) / mesure.length), pire = Math.max(...mesure.slice(5));
console.log(`images/s : ${ips.toFixed(1)} en moyenne, pire image ${pire.toFixed(0)} ms`);
verifie("images/s ≥ 55", ips >= 55, ips.toFixed(1));

// 6. En portrait : demander de tourner le téléphone
await p.setViewportSize({ width: 412, height: 915 });
await p.waitForTimeout(200);
await image("15-portrait");
verifie("portrait : la partie se met en pause", await p.evaluate(() => window.__essais.ecran) === "pause");

await nav.close();
srv.arreter();
for (const e of erreurs) echecs.push("erreur de page : " + e);
if (echecs.length) { console.log("✗ " + echecs.join("\n✗ ")); process.exit(1); }
console.log(`✓ captures dans docs/ghost-train-ui/ (${fs.readdirSync(SORTIE).length})`);
