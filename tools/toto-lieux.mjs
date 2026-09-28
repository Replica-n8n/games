import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : photographie les lieux de passage entre zones (ponton, écluse, port),
   verrous fermés puis ouverts. Captures dans tools/captures/toto-lieu-*.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CAPT = path.join(HERE, "captures");
fs.mkdirSync(CAPT, { recursive: true });
const PLANS = [["ponton", 2450, 380, false], ["ecluse-fermee", 2700, 380, false], ["ecluse-ouverte", 2800, 380, true], ["port-ferme", 5700, 380, false], ["port-ouvert", 5850, 380, true], ["ecluse-fond", 2800, 800, true]];

const srv = await servir();
const nav = await chromium.launch();
const ctx = await nav.newContext({ ...(devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"]), deviceScaleFactor: 1 });
const page = await ctx.newPage();
const erreurs = [];
page.on("pageerror", (e) => erreurs.push(String(e)));
await page.goto(srv.base + "toto/");
await page.click("#bNew");
for (const [nom, x, y, ouvert] of PLANS) {
  await page.evaluate(([x, y, ouvert]) => {
    const E = window.__essais, P = E.P;
    for (const g of E.GATES) { g.hp = ouvert ? 0 : g.max; if (ouvert) P.gates[g.id] = true; else delete P.gates[g.id]; }
    clearInterval(window.__t); window.__t = setInterval(() => { P.x = x; P.y = y; P.vx = P.vy = 0; P.hp = 1e6; P.hunger = 100; P.inv = 1; E.ents.length = 0; }, 4);
  }, [x, y, ouvert]);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(CAPT, `toto-lieu-${nom}.png`) });
  console.log(nom);
}
if (erreurs.length) console.log("erreurs : " + erreurs.join(" | "));
await nav.close(); srv.arreter();
process.exit(erreurs.length ? 1 : 0);
