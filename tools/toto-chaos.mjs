import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";

/* toto : chasse aux bugs. Un robot joue au hasard (directions, sprints, morsures)
   dans chaque lieu, et l'on surveille : erreurs de la page, jeu figé, position NaN,
   requin coincée dans une paroi. Puis des cas précis : mort pendant le Spécimen,
   Spécimen et Veuve de spectacle au Grand Bassin, harpon et sommeil après la mort.
   `node tools/toto-chaos.mjs [secondes par lieu]`. */
const DUREE = (+process.argv[2] || 15) * 1000;
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const p = await (await nav.newContext({ ...devices["Pixel 9 landscape"] })).newPage();
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.stack.split(String.fromCharCode(10)).slice(0, 2).join(" < ")));
let echecs = 0; const verifie = (ok, m) => { console.log((ok ? "ok    " : "ÉCHEC ") + m); if (!ok) echecs++; };
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(300);
const fin = { lvl: 20, evo: { os: 4, ombre: 4, elec: 4, corps: 4, sonar: 3, estomac: 3, mutante: 1 }, bosses: { b0: 1, b1: 1, b2: 1, b3: 1, b4: 1 }, gates: { g1: 1, g2: 1, g3: 1 } };
const LIEUX = [["bayou", "", 1500, 700], ["plage", "", 4200, 800], ["large", "", 7200, 1300], ["golfe", "", 10300, 2000], ["épave", "epave"], ["égouts", "egouts"], ["Grand Bassin", "aquarium"], ["labo", "labo"]];
for (const [nom, lieu, x, y] of LIEUX) {
  const r = await p.evaluate(async ([lieu, x, y, fin, DUREE]) => { const E = window.__essais, P = E.P; Object.assign(P, JSON.parse(JSON.stringify(fin))); for (const g of E.GATES) g.hp = 0;
    P.epaveVue = true; P.vus = { epave: true, egouts: true, aquarium: true, labo: true }; P.carrefour = true; P.monde = { casse: [], ouvert: ["egouts"], libres: [] };
    if (E.INT) E.allerA(""); if (lieu) E.allerA(lieu, "E"); else { P.x = x; P.y = y; }
    const t0 = performance.now(); let t = 0, nan = 0, mur = 0, fige = 0, dernierTemps = -1, k = 0;
    await new Promise((ok) => { const f = () => { const now = performance.now(); P.hp = Math.max(P.hp, 50); P.hunger = 100; if (E.state === "dead") document.getElementById("bResp").click();
      if (E.state === "menu") document.getElementById("bLeave").click();
      if (++k % 20 === 0) { const a = Math.random() * 6.28; P.vx = Math.cos(a) * 6; P.vy = Math.sin(a) * 6; P.dang = a; P.face = Math.cos(a) > 0 ? 1 : -1; if (Math.random() < .3 && P.dashCd <= 0) E.dash(); }
      if (!isFinite(P.x) || !isFinite(P.y)) nan++;
      const I = E.INT; if (I && E.state === "play") { const i = Math.floor(P.x / I.T), j = Math.floor((P.y - I.oy) / I.T); if (I.map[j] && I.map[j][i] === "#") mur++; }
      if (now - t0 > DUREE) ok(); else requestAnimationFrame(f); }; f(); });
    return { nan, mur, etat: E.state, lieu: E.INT ? E.INT.id : "dehors", ents: E.ents.length, entsNaN: E.ents.filter((e) => !isFinite(e.x) || !isFinite(e.y)).length }; }, [lieu, x, y, fin, DUREE]);
  verifie(!r.nan && !r.entsNaN && r.mur < 3, `${nom} : ${DUREE / 1000} s au hasard (NaN ${r.nan}/${r.entsNaN}, dans une paroi ${r.mur} images, ${r.ents} bêtes, état ${r.etat})`);
}
// le jeu ne doit jamais figer : le temps du jeu avance toujours
const avance = await p.evaluate(async () => { const t = performance.now(); let n = 0; await new Promise((ok) => { const f = () => { n++; performance.now() - t < 1000 ? requestAnimationFrame(f) : ok(); }; requestAnimationFrame(f); }); return n; });
verifie(avance > 30, `la boucle tourne encore (${avance} images en 1 s)`);

// mort pendant le Spécimen : au retour, le combat repart proprement
const mort = await p.evaluate(async (fin) => { const E = window.__essais, P = E.P; if (E.INT) E.allerA(""); Object.assign(P, JSON.parse(JSON.stringify(fin))); P.monde = { casse: [], ouvert: ["egouts"], libres: [37] };
  E.allerA("labo", "E"); const I = E.INT, b = E.ents.find((e) => e.type === "specimen"); P.grotto = 0; P.grotLieu = "labo";
  E.briser(62, 12, "I"); P.x = 58 * I.T; P.y = I.oy + 12 * I.T; await new Promise((ok) => setTimeout(ok, 300)); b.bu = 2; b.hp = b.maxhp * .3; await new Promise((ok) => setTimeout(ok, 1500));
  const avant = { phase: b.phase, r: Math.round(b.r), plafond: !!I.plafond, allies: E.ents.filter((e) => e.allie).length };
  P.harpon = { e: b, t: 9 }; P.dodo = 4; P.encre = 2; P.hunger = 0; P.hp = .01; await new Promise((ok) => setTimeout(ok, 500)); document.getElementById("bResp").click(); await new Promise((ok) => setTimeout(ok, 400));
  return { avant, apres: { phase: b.phase, r: Math.round(b.r), rBoss: b.boss.r, hpPlein: b.hp === b.maxhp, plafond: !!E.INT.plafond, allies: E.ents.filter((e) => e.allie && !e.dead).length, onde: !!E.INT.onde }, harpon: !!P.harpon, dodo: P.dodo, encre: P.encre }; }, fin);
console.log("      avant la mort :", JSON.stringify(mort.avant), " après :", JSON.stringify(mort.apres));
verifie(mort.avant.phase === 3 && mort.avant.plafond, "le cas est bien atteint (phase 3, bassin qui se vide)");
verifie(!mort.apres.plafond && mort.apres.r === mort.apres.rBoss && mort.apres.allies === 0 && mort.apres.phase !== 3, "après la mort, le bassin est plein, le Spécimen reprend sa taille, les alliés repartent");
verifie(!mort.harpon && !mort.dodo && !mort.encre, "après la mort, plus de harpon, de sommeil ni d'encre");

// Spécimen et Veuve de spectacle au Grand Bassin
const spec = await p.evaluate(async (fin) => { const E = window.__essais, P = E.P; if (E.INT) E.allerA(""); Object.assign(P, JSON.parse(JSON.stringify(fin))); P.monde = { casse: [], ouvert: ["egouts"], libres: [37, 42] };
  E.allerA("aquarium", "E"); const I = E.INT; P.x = 17 * I.T; P.y = I.oy + 9 * I.T; I.arene = { vague: 24, etat: "attente", t: 0, aLacher: [] }; E.lancerVague(); for (const q of I.arene.aLacher) q.d = 0;
  await new Promise((ok) => setTimeout(ok, 400)); const b = E.ents.find((e) => e.type === "specimen"); b.hp = b.maxhp * .3; b.mode = "charge"; b.mode2 = "charge";
  await new Promise((ok) => setTimeout(ok, 200)); b.mode = "circle"; const t0 = performance.now(); let ondeVue = false, ondeFinie = false;
  await new Promise((ok) => { const f = () => { P.hp = 1e5; if (I.onde) ondeVue = true; if (ondeVue && !I.onde) ondeFinie = true; if (ondeFinie || performance.now() - t0 > 3000) ok(); else requestAnimationFrame(f); }; f(); });
  const hors = E.ents.filter((e) => e.allie && (e.x < 0 || e.x > I.w * I.T || e.y < I.oy || e.y > I.oy + I.h * I.T)).length;
  return { ondeVue, ondeFinie, allies: E.ents.filter((e) => e.allie).length, hors }; }, fin);
verifie(spec.ondeVue && spec.ondeFinie, "au Grand Bassin, l'onde du Spécimen part, frappe et s'efface");
verifie(spec.hors === 0, `les alliés apparaissent dans le bassin (${spec.allies} alliés, ${spec.hors} hors de la carte)`);
verifie(!erreurs.length, "console sans erreur" + (erreurs.length ? " : " + [...new Set(erreurs)].join(" | ") : ""));
await nav.close(); srv.arreter();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est vert."); process.exit(echecs ? 1 : 0);
