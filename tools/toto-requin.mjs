import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : planche complète de la requin. Ligne 1 : au naturel (gueule fermée,
   gueule ouverte, en nage). Puis chaque habit à ses trois niveaux, gueule fermée.
   `node tools/toto-requin.mjs [nom]` ; capture tools/captures/toto-requin[-nom].png.
   Échoue sur une erreur de page. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const nom = process.argv[2] ? "-" + process.argv[2] : "";
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctx = await nav.newContext({ ...(devices["Pixel 9 landscape"] || devices["Pixel 7 landscape"]), deviceScaleFactor: 2 });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(400);
await p.evaluate(() => { for (const id of ["hud", "btns", "narr", "bossbar", "aide"]) document.getElementById(id).style.visibility = "hidden"; });
const vue = p.viewportSize(), cadre = { x: vue.width / 2 - 170, y: vue.height / 2 - 95, width: 340, height: 190 };
const CAS = [["", 0, "fermée"], ["", 0, "ouverte"], ["", 0, "nage"]];
for (const h of ["os", "ombre", "elec"]) for (const n of [1, 2, 3]) CAS.push([h, n, "fermée"]);
const images = [];
for (const [habit, niv, pose] of CAS) {
  await p.evaluate(([habit, niv, pose]) => { const E = window.__essais, P = E.P; P.evo = habit ? { [habit]: niv } : {}; P.habit = habit; window.__zoom = 2.6; clearInterval(window.__t);
    window.__camCible = { x: 1500, y: 700 };
    window.__t = setInterval(() => { E.ents.length = 0; P.x = 1500; P.y = 700; P.vx = pose === "nage" ? 4 : 0; P.vy = 0; P.dang = 0; P.face = 1; P.hp = 1e5; P.inv = 0;
      P.biteT = pose === "ouverte" ? .2 : 0; P.biteCd = 9; if (pose !== "nage") P.t = 0; }, 4); }, [habit, niv, pose]);
  await p.waitForTimeout(pose === "nage" ? 1130 : 700);
  images.push({ habit, niv, pose, b64: (await p.screenshot({ clip: cadre })).toString("base64") });
}
const noms = { "": "Naturel", os: "Os", ombre: "Ombre", elec: "Bio-électrique" };
const cell = (i) => `<figure style="margin:0"><img style="width:320px;border-radius:6px;display:block" src="data:image/png;base64,${i.b64}"><figcaption style="padding:2px">${i.habit ? "niveau " + i.niv : "gueule " + (i.pose === "nage" ? "fermée, en nage" : i.pose)}</figcaption></figure>`;
const planche = await ctx.newPage();
await planche.setViewportSize({ width: 1110, height: 700 });
await planche.setContent(`<body style="margin:0;background:#14263B;font:700 16px sans-serif;color:#fff"><div style="display:grid;grid-template-columns:120px repeat(3,320px);gap:8px;padding:12px">
  ${["", "os", "ombre", "elec"].map((h) => `<div style="align-self:center">${noms[h]}</div>` + images.filter((i) => i.habit === h).map(cell).join("")).join("")}</div></body>`);
await planche.screenshot({ path: path.join(HERE, "captures", `toto-requin${nom}.png`), fullPage: true });
await nav.close(); srv.arreter();
if (erreurs.length) { console.log("ERREURS :", erreurs); process.exit(1); }
console.log("ok");
