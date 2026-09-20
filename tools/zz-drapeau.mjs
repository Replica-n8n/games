import { webkit, chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";
const site = await servir();
for (const [nom, lance, dev] of [["iPhone", webkit, devices["iPhone 13"]], ["Android", chromium, devices["Pixel 9"]]]) {
  const b = await lance.launch();
  const ctx = await b.newContext({ ...dev });
  const p = await ctx.newPage();
  const erreurs = [];
  p.on("pageerror", (e) => erreurs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
  await p.goto(site.base + "paper-race/");
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("paper-race.reglages.v1", JSON.stringify({ mode: "solo", level: "normal", circuit: "s" })); });
  await p.reload();
  await p.click("#jouer");
  await p.waitForFunction(() => !depart && R, null, { timeout: 20000 });
  // on joue jusqu'à l'arrivée, puis on regarde le drapeau APRÈS le rejeu
  await p.evaluate(async () => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    window.__vu = { drapeau: 0, classe: "", affiche: "" };
    const d = document.getElementById("drapeau");
    // le drapeau compte quand il est VRAIMENT au premier plan (pas caché derrière
    // la carte d'arrivée, qui reste affichée par-dessus)
    const oeil = setInterval(() => {
      const dessus = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      if (dessus === d) { window.__vu.drapeau++; window.__vu.classe = d.className; }
    }, 20);
    for (let i = 0; i < 4000 && !finie(R); i++) {
      if (occupe()) { await w(30); continue; }
      const q = aiChoice(R, "rapide");
      if (q === null) { document.getElementById("go").click(); await w(30); continue; }
      choisir(opts.findIndex((o) => o.p[0] === q[0] && o.p[1] === q[1]));
      document.getElementById("go").click();
      await w(30);
    }
    await w(6000);
    clearInterval(oeil);
  });
  const vu = await p.evaluate(() => ({ ...window.__vu, win: document.getElementById("win").style.display, titre: document.getElementById("wintitle").textContent }));
  console.log(nom, "drapeau visible ~" + (vu.drapeau * 20) + " ms", JSON.stringify(vu), "erreurs:", erreurs.slice(0, 3));
  await ctx.close(); await b.close();
}
await site.fermer?.(); process.exit(0);
