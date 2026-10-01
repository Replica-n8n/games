import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : l'onglet « Nutriments » de la grotte (ce que sont les nutriments, où les
   trouver, à quoi ils servent), entre Mutations et Palmarès, et les compteurs du
   panneau qui tiennent dans leur cadre. Capture tools/captures/toto-nutriments.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const srv = await servir();
const nav = await chromium.launch();
const p = await (await nav.newContext({ ...devices["Pixel 9 landscape"], deviceScaleFactor: 2 })).newPage();
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.message));
let echecs = 0; const verifie = (ok, m) => { console.log((ok ? "ok    " : "ÉCHEC ") + m); if (!ok) echecs++; };
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(300);
await p.evaluate(() => { const E = window.__essais, P = E.P; P.nut = { p: 106, f: 999, m: 9876, mu: 40 }; P.x = 600; P.y = E.floorY(600) - 120; });
await p.waitForTimeout(400);
const cadre = await p.evaluate(() => { const st = document.getElementById("stat").getBoundingClientRect(); return [...document.querySelectorAll("#nut span")].every((s) => { const r = s.getBoundingClientRect(); return r.right <= st.right - 4 && r.bottom <= st.bottom; }); });
verifie(cadre, "les quatre compteurs tiennent dans le panneau (106, 999, 9,9k, 40)");
await p.evaluate(() => document.getElementById("bGrot").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })));
await p.waitForTimeout(300);
const ordre = await p.evaluate(() => [...document.querySelectorAll(".onglets [role=tab]")].map((b) => b.textContent.trim()));
verifie(ordre.join(",") === "Mutations,Nutriments,Palmarès", "onglets : " + ordre.join(" / "));
await p.click("#tNut"); await p.waitForTimeout(200);
const t = await p.textContent("#pNut");
verifie(/Protéines/.test(t) && /Lipides/.test(t) && /Minéraux/.test(t) && /Mutagène/.test(t) && !/Mutagène pur/.test(t), "les quatre nutriments expliqués (le pur reste caché avant le Grand Bassin)");
verifie(/Où : Les tortues/.test(t) && !/À quoi/.test(t), "pour chacun : où le trouver (sans ligne « À quoi »)");
await p.screenshot({ path: path.join(HERE, "captures", "toto-nutriments.png") });
await p.click("#tPalm"); await p.waitForTimeout(200);
verifie(!(await p.isVisible("#pNut")) && (await p.isVisible("#pPalm")), "passer au palmarès cache l'onglet nutriments");
await p.evaluate(() => { window.__essais.P.vus.aquarium = true; }); await p.click("#tNut"); await p.waitForTimeout(200);
verifie(/Mutagène pur/.test(await p.textContent("#pNut")), "après le Grand Bassin, le mutagène pur apparaît");
verifie(!erreurs.length, "console sans erreur " + erreurs.join(" | "));
await nav.close(); srv.arreter();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est vert."); process.exit(echecs ? 1 : 0);
