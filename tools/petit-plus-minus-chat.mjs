import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

/* La planche du chat du Petit yoga : les cinq postures en gros plan, yeux ouverts et
   yeux fermés, hors du jeu. Sert à JUGER le dessin (méthode du requin : une planche avant
   de livrer). Échoue si un dessin sort du cadre ou contient un nombre illisible. */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const JEU = path.join(ICI, "..", "petit-plus-minus");
const { dessinChat } = await import(pathToFileURL(path.join(JEU, "js", "chat.js")));
const { POSTURES, DEBOUT, CADRE } = await import(pathToFileURL(path.join(JEU, "js", "yoga.js")));
const noms = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(JEU, "contenu.json"), "utf8")).yoga?.postures?.map((p) => [p.id, p.nom]) || []);

const case_ = (titre, pose, opts) => `<figure><svg viewBox="0 0 ${CADRE.largeur} ${CADRE.hauteur}"><circle cx="150" cy="150" r="138" fill="#CFE8A9"/>`
  + `<rect x="14" y="${CADRE.tapis}" width="272" height="14" rx="7" fill="#F28DB2"/><g class="chat">${dessinChat(pose.j, pose.vue, opts)}</g></svg><figcaption>${titre}</figcaption></figure>`;
const cases = [case_("Debout", DEBOUT, {}), ...Object.entries(POSTURES).map(([id, p]) => case_(noms[id] || id, p, {})),
  ...Object.entries(POSTURES).slice(0, 2).map(([id, p]) => case_((noms[id] || id) + ", yeux fermés", p, { yeux: true, queue: 1 }))];
const html = `<body style="margin:0;padding:16px;background:#EEF7DF;font:800 20px sans-serif;color:#2B2350;display:grid;grid-template-columns:repeat(4,300px);gap:16px">`
  + `<style>figure{margin:0;text-align:center}svg{display:block;width:300px;background:#fff;border-radius:18px}</style>${cases.join("")}`;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1296, height: 760 }, deviceScaleFactor: 1 });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
await p.setContent(html);
const dehors = await p.$$eval("svg", (l) => l.map((s, i) => { const g = s.querySelector(".chat").getBBox(); return (g.x < 0 || g.y < 0 || g.x + g.width > 300 || g.y + g.height > 290) ? i + " : " + [g.x, g.y, g.x + g.width, g.y + g.height].map(Math.round).join(" ") : null; }).filter(Boolean));
const fichier = path.join(ICI, "captures", "ppm-chat-planche.png");
await p.screenshot({ path: fichier, fullPage: true });
await b.close();
const illisible = /NaN|undefined/.test(cases.join(""));
console.log(dehors.length ? "ÉCHEC hors du cadre : " + dehors.join(" | ") : "ok    chaque posture tient dans le cadre");
console.log(illisible ? "ÉCHEC un dessin contient NaN ou undefined" : "ok    aucun nombre illisible");
console.log(erreurs.length ? "ÉCHEC " + erreurs.join(" | ") : "ok    aucune erreur", "\n" + fichier);
process.exit(dehors.length || illisible || erreurs.length ? 1 : 0);
