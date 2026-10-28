import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* MAQUETTE des affaires inédites sur l'accueil (rien n'est codé dans home.js) :
   l'affaire du jour, les boîtes « What if » et « Grand mélange », puis la
   feuille de choix du « What if ». Les plans et visages sont les vrais (une
   vraie affaire du jour tirée par procedural.js). Captures dans
   docs/conviction-affaires/. */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.join(ICI, "..", "docs", "conviction-affaires");
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctx = await nav.newContext({ ...devices["Pixel 9"] });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
await p.goto(`${srv.base}conviction/`);
await p.waitForSelector("#une .t");
await p.evaluate(async () => {
  const { catalogue, essai, universJouables } = await import("./engine/procedural.js");
  const { plan } = await import("./ui/home.js");
  const { buste } = await import("./ui/buste.js");
  const ids = await (await fetch("puzzles/index.json")).json();
  const cat = catalogue(await Promise.all(ids.map(async (id) => (await fetch(`puzzles/${id}.json`)).json())));
  const jour = essai(cat, { mode: "whatif", numero: 2026102600, jour: true, penche: "moyen" });
  const v = jour.persons.find((x) => x.victim);
  const visage = (nom) => buste(cat.tous.find((x) => x.name === nom) ?? cat.tous.find((x) => x.name.includes(nom)) ?? cat.tous[0], "", true);
  const css = document.createElement("style");
  css.textContent = `
    .inedites .boite .faces { display: flex; margin-top: auto; }
    .inedites .boite .faces span { width: 34px; height: 34px; border-radius: 50%; overflow: hidden; margin-right: -8px; box-shadow: 0 0 0 2px #f6f0e2; }
    .inedites .boite .faces svg { width: 100%; height: 100%; display: block; }
    .inedites .boite.mel { background: linear-gradient(#8f7bb8, #6f5a9a) #7d68a8; }
    .inedites .boite.mel .lieux { color: #1d1430; }
    .feuille { position: fixed; inset: auto 0 0 0; max-height: 88vh; overflow: auto; background: #f4efe6; color: #1b1410; border-radius: 20px 20px 0 0; padding: 20px 16px 24px; box-shadow: 0 -10px 30px rgb(0 0 0 / .5); z-index: 50; }
    .feuille h2 { font: 800 1.5rem var(--display); margin: 0 0 4px; }
    .feuille p { margin: 0 0 14px; color: #4a3a2a; }
    .feuille h3 { font: 800 0.875rem var(--display); text-transform: uppercase; letter-spacing: .06em; color: #7a5a1a; margin: 16px 0 8px; }
    .univers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .univers button { display: flex; flex-direction: column; align-items: center; gap: 4px; min-height: 92px; padding: 8px 4px; border: 2px solid #d8ccb6; border-radius: 12px; background: #fffaf0; font: 700 0.8125rem/1.15 var(--body); color: #1b1410; }
    .univers button.choisi { border-color: #8a5a10; background: #ffe8b0; }
    .univers .f { width: 44px; height: 44px; border-radius: 50%; overflow: hidden; }
    .univers .f svg { width: 100%; height: 100%; display: block; }
    .niveaux { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; background: #e6dccb; padding: 4px; border-radius: 999px; }
    .niveaux button { min-height: 44px; border: 0; border-radius: 999px; background: none; font: 800 1rem var(--display); color: #1b1410; }
    .niveaux button.choisi { background: #1b1410; color: #fff; }
    .niveaux small { display: block; font: 600 0.75rem var(--body); opacity: .75; }
    .tirer { display: block; width: 100%; min-height: 52px; margin-top: 18px; border: 0; border-radius: 999px; background: #ffd166; font: 800 1.125rem var(--display); color: #1b1410; }`;
  document.head.append(css);
  const s = document.createElement("section");
  s.className = "inedites";
  s.innerHTML = `<h2 class="sec">Affaires inédites</h2>
    <a class="une" data-ambiance="${jour.ambiance ?? "soir"}">${plan(jour, true)}
      <span class="polaroid" aria-hidden="true"><span class="face">${buste(v, "", true)}</span><i>${v.name.split(" ").pop()}</i></span>
      <span class="txt"><span class="k">L'affaire du jour · 26 octobre</span><span class="t">${jour.floor}</span>
      <span class="acc">La même pour tout le monde · ${jour.difficulty === "moyen" ? "Moyen" : jour.difficulty}</span><span class="btn principal">Ouvrir le dossier</span></span></a>
    <div class="boites" style="margin-top:12px">
      <a class="boite"><span class="etiq"><b>What if</b></span><span class="face">${visage("Cersei")}</span><span class="lieux">Un univers, et n'importe qui peut tomber</span><span class="pas"><span>4 résolues</span></span></a>
      <a class="boite mel"><span class="etiq"><b>Grand mélange</b></span><span class="lieux">Tous les mondes au même endroit</span><span class="faces">${["Vegapunk", "Anubis", "Watson", "Judith"].map((n) => `<span>${visage(n)}</span>`).join("")}</span></a>
    </div>`;
  document.getElementById("une").after(s);
  // La feuille de choix du What if (cachée pour la première capture).
  const EMB = { "Affaires originales": "Victor", "Sherlock Holmes": "Dr Watson", "Hercule Poirot": "Dragomiroff", "Village anglais": "Miss Marple", "Le Trône de fer": "Cersei", "Cluedo": "Colonel Moutarde", "Benoit Blanc": "Harlan Thrombey", "One Piece": "Sabo", "Rome": "Brutus", "Le jeu de cartes": "Judith", "L'Égypte des dieux": "Anubis", "Asgard": "Loki", "La Crète": "Thésée" };
  const us = universJouables(cat);
  const f = document.createElement("div");
  f.className = "feuille"; f.hidden = true; f.id = "feuille";
  f.innerHTML = `<h2>What if</h2><p>Le lieu et les gens d'un univers. Cette fois, n'importe qui peut mourir, et n'importe qui peut être coupable.</p>
    <h3>Univers</h3><div class="univers"><button class="choisi"><span class="f" style="display:grid;place-items:center;background:#1b1410;color:#ffd166;font:800 1.5rem var(--display)">?</span>Au hasard</button>${us.slice(0, 11).map((u) => {
      const g = cat.gens.get(u); const e = g.find((x) => x.name === EMB[u]) ?? g[0];
      return `<button><span class="f">${buste(e, "", true)}</span>${u}</button>`; }).join("")}</div>
    <h3>Niveau</h3><div class="niveaux"><button>Facile</button><button class="choisi">Moyen</button><button>Difficile</button></div>
    <button class="tirer">Tirer une affaire</button>`;
  document.body.append(f);
});
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(400);
await p.screenshot({ path: path.join(DOCS, "accueil.png"), fullPage: true });
await p.evaluate(() => { document.getElementById("feuille").hidden = false; });
await p.waitForTimeout(200);
await p.screenshot({ path: path.join(DOCS, "feuille-whatif.png") });
await nav.close();
srv.arreter();
console.log(erreurs.length ? `✗ erreurs : ${erreurs.join(" | ")}` : "✓ maquette écrite dans docs/conviction-affaires/");
