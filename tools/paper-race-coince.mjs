import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";

/* Paper Race : coincé en roulant, la voiture file dans le mur (v17).
   Elle l'a vu en jouant : quand le prochain coup envoie dans le mur, la voiture
   s'arrêtait au milieu de la route. Ce contrôle rejoue, dans le navigateur, le cas
   d'une vraie course de référence (Montréal : lancée vers le bas à 5, rien de
   jouable) et prouve que :
   - le bouton dit ce qui va se passer (« Tout droit dans le mur ») ;
   - la voiture arrive sur la dernière case de piste avant le bord (crashPoint),
     pas sur place ;
   - le message le dit (« Trop vite : … finit dans le mur ») ;
   - à l'arrêt, le bouton garde « Coincé : je m'arrête ».
   Usage : node tools/paper-race-coince.mjs */

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
// ⚠️ le circuit ne se choisit qu'en Grand Prix : en solo, c'est le championnat
await p.evaluate(() => localStorage.setItem("paper-race.reglages.v1", JSON.stringify({ mode: "gp", voitures: 2, level: "normal", circuit: "montrealvrai", pieges: false })));
await p.reload();
await p.click("#jouer");
await p.waitForFunction(() => R && !depart && !occupe(), null, { timeout: 30000 });

// tous les messages passagers, même ceux qu'un autre remplace aussitôt
await p.evaluate(() => {
  window.__messages = [];
  new MutationObserver(() => { const t = document.getElementById("toast").textContent; if (t) window.__messages.push(t); })
    .observe(document.getElementById("toast"), { childList: true, characterData: true, subtree: true });
});

// le cas de Montréal : la voiture du joueur, lancée vers le bas à 5
const cas = await p.evaluate(() => {
  const moi = R.turn, autre = R.cars.findIndex((c, i) => i !== moi);
  R.cars[autre].p = [8, 70];                     // loin, hors de la trajectoire
  R.cars[moi].p = [9, 81]; R.cars[moi].v = [-1, 5];
  camPose = false; newOpts(); refresh();
  return {
    moi, bouton: document.getElementById("go").textContent, actif: !document.getElementById("go").disabled,
    jouables: opts.filter((o) => o.ok).length, bord: crashPoint(R.track, [9, 81], projected(R.cars[moi])),
  };
});
verifier("le cas est bien coincé : aucun point jouable", cas.jouables === 0, cas);
verifier("le bouton dit ce qui va se passer", cas.bouton === "Tout droit dans le mur" && cas.actif, cas);

await p.click("#go");
await p.waitForFunction((moi) => R.cars[moi].coups >= 1 && !anim, cas.moi, { timeout: 10000 });
await p.waitForTimeout(400);
const apres = await p.evaluate((moi) => ({ p: R.cars[moi].p, v: R.cars[moi].v, sorties: R.cars[moi].crashes, messages: window.__messages }), cas.moi);
verifier("la voiture arrive contre le bord, pas sur place", apres.p.join() === cas.bord.join() && cas.bord.join() !== "9,81", { apres, bord: cas.bord });
verifier("elle repart à l'arrêt, une sortie comptée", apres.v.join() === "0,0" && apres.sorties === 1, apres);
verifier("le message le dit", apres.messages.some((t) => /Trop vite : la voiture .* finit dans le mur/.test(t)), apres.messages);

// à l'arrêt, rien de jouable : le bouton garde son texte d'avant
const arret = await p.evaluate(() => {
  const moi = R.turn;
  R.cars[moi].v = [0, 0];
  return texteCoince(R.cars[moi]);
});
verifier("à l'arrêt, le bouton dit « Coincé : je m'arrête »", arret === "Coincé : je m'arrête", arret);

verifier("aucune erreur dans la console", erreurs.length === 0, erreurs.slice(0, 5));
await ctx.close(); await nav.close(); await site.fermer?.();
console.log(echecs ? `\n${echecs} ECHEC(S)` : "\nPAPER RACE COINCÉ OK");
process.exit(echecs ? 1 : 0);
