import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* MAQUETTE : refaire le dessin des arcanes. Sept illustrations neuves (au lieu des
   petits traits du POC) et trois formes pour les porter, posées DANS LE VRAI JEU
   (on charge bataille/index.html et on rhabille sa main d'arcanes), endormies
   avant le combat puis prêtes pendant. Rien n'est changé dans le jeu.
   Sortie : captures/bataille-arcanes-planche.png */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, "captures");
fs.mkdirSync(SORTIE, { recursive: true });

const OR = "#feca63", CLAIR = "#f4f2ff", VIOLET = "#a57ce5", FOND = "#2b3690", NUIT = "#0b1150", EAU = "#8fd3ff";
const etoile = (cx, cy, R, r, n) => { let d = ""; for (let i = 0; i < 2 * n; i++) { const a = (i * Math.PI) / n, k = i % 2 ? r : R; d += (i ? "L" : "M") + (cx + Math.sin(a) * k).toFixed(1) + " " + (cy - Math.cos(a) * k).toFixed(1); } return d + "Z"; };
const svg = (corps) => `<svg viewBox="0 0 48 48" fill="none" stroke="${CLAIR}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${corps}</svg>`;
const DESSINS = {
  tour: svg(`<path d="M9 13l3 1-1 3-3-1zM37 31l3-1 1 3-3 1zM7 27l2.5.5-.5 2.5-2.5-.5z" fill="${OR}" stroke="none"/>
    <path d="M17 44V21l-2-3v-6h4v3h3v-3h4v3h3v-3h4v6l-2 3v23z" fill="${FOND}"/><path d="M21 44v-6a3 3 0 016 0v6M24 24v5" />
    <path d="M41 2l-10 12h7l-9 11" stroke="${NUIT}" stroke-width="6"/><path d="M41 2l-10 12h7l-9 11" stroke="${OR}" stroke-width="2.8"/>`),
  mort: svg(`<path d="M7 45L39 7" stroke="${VIOLET}" stroke-width="2.4"/><path d="M41 6c-10-5-20-2-26 5 8-3 16-2 22 2z" fill="${OR}" stroke="${NUIT}" stroke-width="1.2"/>
    <path d="M12 24a12 12 0 1124 0c0 4-2 7-4 8v5H16v-5c-2-1-4-4-4-8z" fill="${FOND}"/><circle cx="19" cy="24" r="3.3" fill="${OR}" stroke="none"/><circle cx="29" cy="24" r="3.3" fill="${OR}" stroke="none"/>
    <path d="M24 28l-1.6 3h3.2z" fill="${CLAIR}" stroke="none"/><path d="M20 37v-4M24 37v-4M28 37v-4" stroke-width="1.6"/>`),
  force: svg(`<path d="${etoile(24, 24, 21, 15.5, 12)}" fill="${OR}" stroke="${NUIT}" stroke-width="1.2"/><circle cx="24" cy="25" r="11.5" fill="${FOND}"/>
    <path d="M15.5 17l1-4 3.5 2M32.5 17l-1-4-3.5 2" fill="${FOND}"/><circle cx="19.5" cy="23" r="1.7" fill="${CLAIR}" stroke="none"/><circle cx="28.5" cy="23" r="1.7" fill="${CLAIR}" stroke="none"/>
    <path d="M21.8 27h4.4L24 29.6z" fill="${OR}" stroke="none"/><path d="M24 29.6v1.6c-1.4 2-4 2-5 .2M24 31.2c1.4 2 4 2 5 .2" stroke-width="1.6"/>`),
  roue: svg(`<circle cx="24" cy="24" r="18" fill="${FOND}"/><circle cx="24" cy="24" r="12.5" stroke="${VIOLET}" stroke-width="1.5"/>
    <path d="M24 6v36M6 24h36M11.3 11.3l25.4 25.4M36.7 11.3L11.3 36.7" stroke-width="1.6"/><circle cx="24" cy="24" r="5" fill="${OR}" stroke="${NUIT}" stroke-width="1.2"/>
    ${[[24, 6], [42, 24], [24, 42], [6, 24]].map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${OR}" stroke="${NUIT}" stroke-width="1.2"/>`).join("")}`),
  temperance: svg(`<path d="${etoile(38, 9, 5, 1.8, 4)}" fill="${OR}" stroke="none"/><path d="${etoile(8, 36, 4, 1.5, 4)}" fill="${OR}" stroke="none"/>
    <g transform="rotate(-38 16 14)"><path d="M8 7h16l-2.4 13H10.4z" fill="${FOND}"/></g><path d="M25 27h16l-2.4 15H27.4z" fill="${FOND}"/>
    <path d="M21 19c6 1 11 4 13 8" stroke="${NUIT}" stroke-width="6"/><path d="M21 19c6 1 11 4 13 8" stroke="${EAU}" stroke-width="2.8"/><path d="M27.2 33h11.6" stroke="${EAU}" stroke-width="2.4"/>`),
  etoile: svg(`<path d="${etoile(24, 19, 15, 5.5, 8)}" fill="${OR}" stroke="${NUIT}" stroke-width="1.2"/><path d="${etoile(8, 9, 4.5, 1.6, 4)}" fill="${CLAIR}" stroke="none"/><path d="${etoile(41, 12, 3.6, 1.3, 4)}" fill="${CLAIR}" stroke="none"/><path d="${etoile(40, 30, 2.8, 1, 4)}" fill="${CLAIR}" stroke="none"/>
    <path d="M5 39c4-3 8-3 12 0s8 3 12 0 8-3 12 0M11 45c4-3 8-3 12 0s8 3 12 0" stroke="${EAU}" stroke-width="2.2"/>`),
  soleil: svg(`<path d="${etoile(24, 24, 22.5, 13, 12)}" fill="${OR}" stroke="${NUIT}" stroke-width="1.2"/><circle cx="24" cy="24" r="11.5" fill="#ffe7a8" stroke="${NUIT}" stroke-width="1.4"/>
    <path d="M18.8 22.4c1-1.4 2.6-1.4 3.6 0M25.6 22.4c1-1.4 2.6-1.4 3.6 0M19 27.4c2.8 3.4 7.2 3.4 10 0" stroke="${NUIT}" stroke-width="1.7"/>`),
};
const NOMS = { tour: ["XVI", "La Tour"], mort: ["XIII", "La Mort"], force: ["XI", "La Force"], roue: ["X", "La Roue"], temperance: ["XIV", "Tempérance"], etoile: ["XVII", "L’Étoile"], soleil: ["XIX", "Le Soleil"] };

const CSS = `
#main.va,#main.vb,#main.vc{align-items:flex-end}
#main .arcane.neuf{padding:0;justify-content:flex-start;transition:none}
#main .arcane.neuf .ill svg{width:100%;height:100%;display:block}
#main .arcane.neuf.dort .ill{opacity:.72;filter:saturate(.3)}
/* A. Lames : de vraies cartes de tarot, hautes, tenues en éventail */
#main.va{height:112px;bottom:92px;gap:6px}
#main.va.avecInfo .arcane.neuf{width:86px}
#main.va .arcane.neuf{width:88px;height:110px;border-radius:10px;background:linear-gradient(#1c2678,#0a104a);border:1.5px solid rgba(254,202,99,.55);box-shadow:inset 0 0 0 3px #0a104a,inset 0 0 0 4px rgba(254,202,99,.35),0 8px 16px rgba(0,0,0,.4);align-items:center;gap:0}
#main.va .arcane.neuf .num{font:600 14px/1 var(--display);margin-top:8px;color:var(--accent)}
#main.va .arcane.neuf .ill{width:52px;height:52px;margin-top:5px}
#main.va .arcane.neuf .nom{font:600 14px/1 var(--display);margin-top:6px;white-space:nowrap}
#main.va .arcane.neuf:nth-child(1){transform:rotate(-5deg) translateY(4px)}#main.va .arcane.neuf:nth-child(3){transform:rotate(5deg) translateY(4px)}
#main.va .arcane.neuf.pret{border-color:var(--accent);box-shadow:inset 0 0 0 3px #0a104a,inset 0 0 0 4px var(--accent),0 12px 20px rgba(0,0,0,.45);margin-bottom:8px}
#main.va .arcane.neuf.dort .num,#main.va .arcane.neuf.dort .nom{color:var(--texte2)}
/* B. Médaillons : un disque par arcane, son nom dessous */
#main.vb{height:102px;bottom:94px;gap:14px}
#main.vb .arcane.neuf{width:82px;height:102px;background:none;border:0;box-shadow:none;border-radius:0;align-items:center;position:relative}
#main.vb .arcane.neuf .ill{width:78px;height:78px;border-radius:50%;padding:11px;background:radial-gradient(circle at 50% 35%,#27328a,#0a104a);border:1.5px solid rgba(254,202,99,.5);box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 8px 16px rgba(0,0,0,.4)}
#main.vb .arcane.neuf .num{position:absolute;top:-7px;left:50%;transform:translateX(-50%);font:600 14px/1 var(--display);padding:3px 8px 4px;border-radius:10px;background:#0a104a;border:1px solid rgba(254,202,99,.5);color:var(--accent);z-index:1}
#main.vb .arcane.neuf .nom{font-size:14px;line-height:1;margin-top:8px;white-space:nowrap}
#main.vb .arcane.neuf.pret .ill{border:2px solid var(--accent);background:radial-gradient(circle at 50% 35%,#3441a6,#141c66)}
#main.vb .arcane.neuf.dort .nom{color:var(--texte2)}
/* C. Tuiles illustrées : la forme d'aujourd'hui, le dessin en grand */
#main.vc{height:96px;bottom:96px;gap:8px}
#main.vc .arcane.neuf{width:88px;height:96px;border-radius:22px;align-items:center;position:relative;overflow:hidden}
#main.vc .arcane.neuf .ill{width:48px;height:48px;margin-top:3px}
#main.vc .arcane.neuf .num{font:600 14px/1 var(--display);color:var(--accent);margin-top:8px}
#main.vc .arcane.neuf .nom{font-size:14px;line-height:1;margin-top:4px;white-space:nowrap}
#main.vc .arcane.neuf.dort .nom,#main.vc .arcane.neuf.dort .num{color:var(--texte2)}
`;

const srv = await servir();
const navigateur = await chromium.launch();
const coupes = {};
for (const v of ["a", "b", "c"]) {
  const ctx = await navigateur.newContext({ viewport: { width: 360, height: 732 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(srv.base + "bataille/", { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  await p.click("#startBtn");
  await p.evaluate(() => { Math.random = () => 0.5; window.__essais.mois("lion"); window.__essais.donne(["tour", "temperance", "etoile"], []); });
  await p.addStyleTag({ content: CSS });
  const habille = () => p.evaluate(({ v, DESSINS, NOMS }) => {
    const main = document.getElementById("main"); main.classList.add("v" + v);
    for (const b of main.querySelectorAll(".arcane")) { const nom = b.querySelector(".nom").textContent, id = Object.keys(NOMS).find((k) => NOMS[k][1] === nom);
      b.classList.add("neuf"); b.innerHTML = '<span class="num">' + NOMS[id][0] + '</span><span class="ill">' + DESSINS[id] + '</span><span class="nom">' + nom + "</span>"; }
  }, { v, DESSINS, NOMS });
  const coupe = async (nom) => { coupes[v + nom] = (await p.screenshot({ clip: { x: 0, y: 452, width: 360, height: 280 } })).toString("base64"); };
  await habille(); await p.waitForTimeout(200); await coupe("dort");
  await p.click("#goBtn"); await p.waitForFunction(() => window.__essais.etat().phase === "fight"); await p.waitForTimeout(1700);
  await p.evaluate(() => window.__essais.vitesse(0)); await habille(); await p.waitForTimeout(150); await coupe("pret");
  await ctx.close();
}
const planche = await navigateur.newPage({ viewport: { width: 1260, height: 900 }, deviceScaleFactor: 1.5 });
const FORMES = [["a", "A · Lames", "De vraies cartes de tarot, hautes, tenues en éventail. La carte prête se soulève."], ["b", "B · Médaillons", "Un disque par arcane, son chiffre en haut, son nom dessous. Le plus rond, le plus « Nuit claire »."], ["c", "C · Tuiles illustrées", "La forme d'aujourd'hui, avec le dessin en grand. Le changement le plus discret."]];
await planche.setContent(`<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:28px 30px 34px;background:#000644;color:#f4f2ff;font:500 16px system-ui,sans-serif;width:1200px}
h1{font:600 30px Georgia,serif;margin:0 0 4px}h2{font:600 22px Georgia,serif;margin:0 0 4px;color:#feca63}p{margin:0 0 14px;color:#caceff;line-height:1.35}
.c{display:grid;grid-template-columns:repeat(3,1fr);gap:26px;margin-bottom:30px}.c img{display:block;width:100%;border-radius:18px;margin-bottom:6px;box-shadow:0 0 0 2px #2b3690}
.c small{display:block;font-size:14px;color:#caceff;margin-bottom:12px}
.g{display:grid;grid-template-columns:repeat(7,1fr);gap:14px}.g div{background:rgba(255,255,255,.06);border-radius:18px;padding:14px 8px 12px;text-align:center}
.g svg{width:104px;height:104px;display:block;margin:0 auto 8px}.g b{display:block;font:600 18px Georgia,serif}.g i{font-style:normal;color:#feca63;font:600 14px Georgia,serif}
</style><h1>Les arcanes redessinés</h1><p>Sept illustrations neuves, et trois façons de les tenir en main. Captures du vrai jeu : en haut avant le combat (arcanes endormis), en bas pendant (prêts à lancer).</p>
<div class="c">${FORMES.map(([v, t, d]) => `<div><h2>${t}</h2><p>${d}</p><img src="data:image/png;base64,${coupes[v + "dort"]}"><small>Avant le combat</small><img src="data:image/png;base64,${coupes[v + "pret"]}"><small>Pendant le combat</small></div>`).join("")}</div>
<h2>Les sept illustrations</h2><p>Les mêmes dans les trois formes. À comparer aux petits traits d'aujourd'hui.</p>
<div class="g">${Object.keys(NOMS).map((id) => `<div>${DESSINS[id]}<i>${NOMS[id][0]}</i><b>${NOMS[id][1]}</b></div>`).join("")}</div>`);
await planche.screenshot({ path: path.join(SORTIE, "bataille-arcanes-planche.png"), fullPage: true });
await navigateur.close();
srv.arreter();
console.log("captures/bataille-arcanes-planche.png");
