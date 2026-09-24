import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";

/* Paper Race : on ne roule pas à contresens (v19).
   Une voiture pouvait faire demi-tour et rouler à l'envers. Qui ROULE ne peut plus
   reculer ; à l'arrêt, tout est permis. Ce contrôle prouve, dans le navigateur :
   - les points qui feraient reculer portent le panneau « sens interdit » (lu dans
     les PIXELS du plateau : le rouge des panneaux), et eux seuls ;
   - le pavé les grise et les nomme (« Contresens : on ne recule pas ») ;
   - la feuille des règles le dit.
   Usage : node tools/paper-race-contresens.mjs */

let echecs = 0;
const verifier = (nom, ok, detail) => {
  console.log((ok ? "ok    " : "ECHEC ") + nom + (!ok && detail !== undefined ? "  " + JSON.stringify(detail).slice(0, 500) : ""));
  if (!ok) echecs++;
};

const site = await servir();
const nav = await chromium.launch();
const ctx = await nav.newContext({ ...devices["Pixel 9"], reducedMotion: "reduce" });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });

await p.goto(site.base + "paper-race/");
await p.evaluate(() => localStorage.setItem("paper-race.reglages.v1", JSON.stringify({ mode: "gp", voitures: 2, level: "normal", circuit: "ovale", pieges: false })));
await p.reload();

// la feuille des règles
await p.click("#reglesBtn"); await p.waitForTimeout(200);
const regle = await p.evaluate(() => [...document.querySelectorAll(".regles > li")].some((li) => /contresens/.test(li.textContent) && li.querySelector("svg circle")));
verifier("les règles disent qu'on ne roule pas à contresens, avec le panneau", regle);
await p.click("#regles [data-fermer]");

await p.click("#jouer");
await p.waitForFunction(() => R && !depart && !occupe(), null, { timeout: 30000 });

// une ligne droite ; la voiture y RECULE déjà d'une case
const cas = await p.evaluate(() => {
  const tk = R.track, moi = R.turn, autre = R.cars.findIndex((c, i) => i !== moi);
  let pos = null, dir = null;
  for (let y = 2; y < 24 && !pos; y++) for (let x = 2; x < 19 && !pos; x++) for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const libre = [-3, -2, -1, 0, 1, 2].every((k) => [-1, 0, 1].every((l) => onTrack(tk, x + d[0] * k + d[1] * l, y + d[1] * k + d[0] * l)));
    if (libre && progress(tk, [x, y], [x + d[0], y + d[1]]) > 0 && progress(tk, [x, y], [x - d[0], y - d[1]]) < 0) { pos = [x, y]; dir = d; break; }
  }
  R.cars[autre].p = [1, 1];
  R.cars[moi].p = pos.slice(); R.cars[moi].v = [-dir[0], -dir[1]];
  camPose = false; newOpts(); refresh();
  const cv = document.getElementById("board"), dpr = window.devicePixelRatio || 1, g = cv.getContext("2d");
  const r = Math.max(4.5, cellPx * 0.3);
  const pts = opts.map((o, k) => {
    // au-dessus de la barre blanche, dans le disque
    const x = (gx(o.p[0]) - Math.round(camX)) * dpr, y = (gy(o.p[1]) - Math.round(camY) - r * 0.6) * dpr;
    const px = g.getImageData(Math.round(x), Math.round(y), 1, 1).data;
    const b = document.querySelector(`.padbtn[data-k="${k}"]`);
    return { k, sens: !!o.contresens, ok: o.ok, rgb: [px[0], px[1], px[2]], nom: b.getAttribute("aria-label"), gris: b.disabled, classe: b.className };
  });
  return { pos, dir, pts };
});
const rouge = (c) => c[0] > 150 && c[1] < 70 && c[2] < 80;
const interdits = cas.pts.filter((x) => x.sens);
verifier("en reculant, des points feraient reculer encore", interdits.length > 0, cas);
verifier("ces points portent le panneau sens interdit (rouge)", interdits.every((x) => rouge(x.rgb)), interdits);
verifier("les autres points n'en portent pas", cas.pts.filter((x) => !x.sens).every((x) => !rouge(x.rgb)), cas.pts.filter((x) => !x.sens));
verifier("le pavé les grise et les nomme", interdits.every((x) => x.gris && x.nom === "Contresens : on ne recule pas" && /sens/.test(x.classe)), interdits);
verifier("freiner reste possible", cas.pts.some((x) => x.ok), cas.pts);

verifier("aucune erreur dans la console", erreurs.length === 0, erreurs.slice(0, 5));
await ctx.close(); await nav.close(); await site.fermer?.();
console.log(echecs ? `\n${echecs} ECHEC(S)` : "\nPAPER RACE CONTRESENS OK");
process.exit(echecs ? 1 : 0);
