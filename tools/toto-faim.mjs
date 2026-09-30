import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";

/* toto : la faim en jeu réel. Un robot joue « naturellement » (il file vers la bête
   mangeable la plus proche et mord ; s'il n'y a rien, il patrouille), SANS jamais
   remettre la faim à fond. Deux minutes par lieu, au niveau et à l'équipement du
   moment de la partie. On relève le plus bas de la barre et le temps passé à vide.
   `node tools/toto-faim.mjs [secondes]`. */
const DUREE = (+process.argv[2] || 120) * 1000;
const LIEUX = [
  { nom: "bayou", x: 1500, y: 700, lvl: 3, evo: {}, habit: "" },
  { nom: "plage", x: 4200, y: 800, lvl: 7, evo: { os: 1 }, habit: "os" },
  { nom: "grand large", x: 7200, y: 1200, lvl: 11, evo: { os: 2, ombre: 1 }, habit: "os" },
  { nom: "golfe", x: 10300, y: 1800, lvl: 15, evo: { os: 3, ombre: 2, elec: 1 }, habit: "elec" },
  { nom: "épave", lieu: "epave", lvl: 19, evo: { os: 3, ombre: 3, elec: 3, estomac: 1 }, habit: "os" },
  { nom: "égouts", lieu: "egouts", lvl: 19, evo: { os: 3, ombre: 3, elec: 3, estomac: 1 }, habit: "os" },
  { nom: "Grand Bassin", lieu: "aquarium", lvl: 20, evo: { os: 3, ombre: 3, elec: 3, corps: 3 }, habit: "os" },
  { nom: "laboratoire", lieu: "labo", lvl: 20, evo: { os: 3, ombre: 3, elec: 3, corps: 3 }, habit: "os" }];
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const p = await (await nav.newContext({ ...devices["Pixel 9 landscape"] })).newPage();
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.message));
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
console.log(`robot qui mange ce qui passe, ${DUREE / 1000} s par lieu (la barre part pleine) :`);
for (const L of LIEUX) {
  await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(300);
  const r = await p.evaluate(async ([L, DUREE]) => { const E = window.__essais, P = E.P;
    P.lvl = L.lvl; P.evo = { ...L.evo }; P.habit = L.habit; P.bosses = { b0: 1, b1: 1, b2: 1, b3: 1, b4: 1 }; P.gates = { g1: 1, g2: 1, g3: 1 }; for (const g of E.GATES) g.hp = 0;
    P.epaveVue = true; P.vus = { epave: true, egouts: true, aquarium: true, labo: true }; P.carrefour = true; P.monde = { casse: ["egouts:29,10", "egouts:29,11", "egouts:29,12"], ouvert: ["egouts"] };
    for (const e of E.ents) if (e.boss) e.dead = true;
    if (L.lieu) { E.allerA(L.lieu, "E"); const I = E.INT; if (L.lieu === "aquarium") { P.x = I.w * I.T / 2; P.y = I.oy + 8 * I.T; } } else { P.x = L.x; P.y = L.y; }
    const m0 = E.palm.stats.manges || 0; P.hunger = 100; P.hp = 1e6; let min = 100, vide = 0, mange = 0, somme = 0, n = 0, dir = 1, t0 = performance.now(), last = t0;
    await new Promise((ok) => { const f = () => { const now = performance.now(), dt = (now - last) / 1000; last = now; P.hp = 1e6; P.inv = 1;
      if (E.state !== "play") { if (E.state === "dead") ok(); requestAnimationFrame(f); return; }
      const proies = E.ents.filter((e) => !e.dead && e.kind === "ani" && !e.boss && e.type !== "bras" && Math.hypot(e.x - P.x, e.y - P.y) < 900);
      if (proies.length) { const c = proies.sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y))[0], dx = c.x - P.x, dy = c.y - P.y, d = Math.hypot(dx, dy) || 1;
        P.vx = dx / d * 6; P.vy = dy / d * 6; P.dang = Math.atan2(dy, dx); P.face = dx > 0 ? 1 : -1; }
      else { if (Math.random() < .005) dir *= -1; P.vx = dir * 5; P.vy = 0; P.face = dir; P.dang = dir > 0 ? 0 : Math.PI; }
      min = Math.min(min, P.hunger); if (P.hunger <= 0) vide += dt; somme += P.hunger; n++;
      if (now - t0 > DUREE) ok(); else requestAnimationFrame(f); }; f(); });
    return { min: Math.round(min), vide: Math.round(vide), moy: Math.round(somme / n), fin: Math.round(P.hunger), manges: (E.palm.stats.manges || 0) - m0 }; }, [L, DUREE]);
  console.log(`  ${L.nom.padEnd(13)} niv. ${String(L.lvl).padStart(2)} : plus bas ${String(r.min).padStart(3)} %, moyenne ${String(r.moy).padStart(3)} %, à vide ${r.vide} s, bêtes mangées ${r.manges}`);
}
if (erreurs.length) console.log("erreurs : " + erreurs.join(" | "));
await nav.close(); srv.arreter();
