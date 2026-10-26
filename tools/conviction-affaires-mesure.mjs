import { chromium } from "playwright";
import { servir } from "./serveur.mjs";

/* Combien coûte un essai du générateur d'affaires dans un navigateur ralenti
   comme un téléphone (processeur 4 fois plus lent), et ce que donnent les
   essais : facile, moyen, difficile ou raté. */
const srv = await servir();
const nav = await chromium.launch();
const p = await nav.newPage();
const cdp = await p.context().newCDPSession(p);
await p.goto(srv.base + "tools/mockup-conviction-affaires-mesure.html");
await p.waitForSelector("body[data-pret]", { state: "attached" });
for (const lent of [1, 4]) {
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: lent });
  for (const mode of ["whatif", "melange"]) {
    const r = await p.evaluate((m) => window.mesurer(m, 45), mode);
    console.log(`processeur ÷${lent} · ${mode.padEnd(8)} · ${r.msParEssai} ms par essai · ${JSON.stringify(r.sortes)}`);
  }
}
await nav.close();
srv.arreter();
