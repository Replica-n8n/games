import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

/* Les douze constellations de La Bataille, tirées des VRAIES figures du ciel et
   plus jamais dessinées à la main (celles du POC étaient inventées).
   Source : tools/donnees/constellations/constellations.lines.json, du projet
   d3-celestial (Olaf Frohn, licence BSD à côté du fichier, à garder).
   Chaque figure est une suite de traits entre étoiles, en ascension droite et
   déclinaison. On la met à plat comme on la voit depuis l'hémisphère nord (le
   nord en haut, l'est À GAUCHE), on garde ses proportions, et on la cale dans le
   cadre du ciel du jeu (134 × 60).

   node tools/bataille-constellations.mjs            écrit le bloc CIEL dans bataille/index.html
   node tools/bataille-constellations.mjs --controle échoue si le jeu ne porte pas ces figures
   node tools/bataille-constellations.mjs --planche  captures/bataille-constellations.png (POC à gauche, vrai ciel à droite) */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const JEU = path.join(ICI, "..", "bataille", "index.html");
const CADRE = [134, 60];
const SIGNES = [["capricorne", "Cap", "Janvier · le Capricorne"], ["verseau", "Aqr", "Février · le Verseau"], ["poissons", "Psc", "Mars · les Poissons"], ["belier", "Ari", "Avril · le Bélier"],
  ["taureau", "Tau", "Mai · le Taureau"], ["gemeaux", "Gem", "Juin · les Gémeaux"], ["cancer", "Cnc", "Juillet · le Cancer"], ["lion", "Leo", "Août · le Lion"],
  ["vierge", "Vir", "Septembre · la Vierge"], ["balance", "Lib", "Octobre · la Balance"], ["scorpion", "Sco", "Novembre · le Scorpion"], ["sagittaire", "Sgr", "Décembre · le Sagittaire"]];

const source = JSON.parse(fs.readFileSync(path.join(ICI, "donnees", "constellations", "constellations.lines.json"), "utf8"));
const arrondi = (v) => Math.round(v * 1000) / 1000;

/* Deux figures complètes sont illisibles dans un cadre de 134 × 60 (demandé par
   Julie le 2026-10-05) : on en garde la partie que tout le monde reconnaît, avec
   les VRAIES étoiles de la source, jamais des points posés à la main.
   - le Sagittaire devient sa « théière » : huit étoiles nommées, cherchées dans la
     source par leur position (ascension droite et déclinaison, en degrés) ;
   - les Poissons gardent leur tracé, allégé des étoiles qui ne changent pas sa
     forme (à moins de TOLERANCE degrés de la ligne). */
const THEIERE = { gamma: [271.45, -30.42], epsilon: [276.04, -34.38], delta: [275.25, -29.83], lambda: [276.99, -25.42], phi: [281.41, -26.99], sigma: [283.82, -26.3], zeta: [285.65, -29.88], tau: [286.74, -27.67] };
const TRAITS_THEIERE = [["gamma", "delta"], ["gamma", "epsilon"], ["delta", "epsilon"], ["delta", "lambda"], ["lambda", "phi"], ["delta", "phi"], ["phi", "zeta"], ["epsilon", "zeta"], ["phi", "sigma"], ["sigma", "tau"], ["tau", "zeta"]];
const TOLERANCE = 1.6;

function theiere(lignes) {
  const tous = lignes.flat();
  const vraie = ([ra, dec]) => {
    let mieux = null, d = 1e9;
    for (const p of tous) { const e = Math.hypot((((p[0] - ra) % 360) + 540) % 360 - 180, p[1] - dec); if (e < d) { d = e; mieux = p; } }
    if (d > 0.5) throw new Error("étoile de la théière introuvable dans la source, écart " + d.toFixed(2) + "°");
    return mieux;
  };
  const etoiles = Object.fromEntries(Object.entries(THEIERE).map(([nom, pos]) => [nom, vraie(pos)]));
  return TRAITS_THEIERE.map(([a, b]) => [etoiles[a], etoiles[b]]);
}
/* Douglas-Peucker : on ne garde d'une ligne que les étoiles qui en font la forme. */
function allege(ligne) {
  if (ligne.length < 3) return ligne;
  const [a, b] = [ligne[0], ligne[ligne.length - 1]];
  let pire = 0, ou = 0;
  for (let i = 1; i < ligne.length - 1; i++) {
    const p = ligne[i], l2 = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
    const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / l2)) : 0;
    const d = Math.hypot(p[0] - a[0] - t * (b[0] - a[0]), p[1] - a[1] - t * (b[1] - a[1]));
    if (d > pire) { pire = d; ou = i; }
  }
  if (pire <= TOLERANCE) return [a, b];
  return allege(ligne.slice(0, ou + 1)).slice(0, -1).concat(allege(ligne.slice(ou)));
}

function figure(code) {
  const f = source.features.find((x) => x.id === code);
  if (!f) throw new Error("constellation absente de la source : " + code);
  let lignes = f.geometry.coordinates;
  if (code === "Sgr") lignes = theiere(lignes);
  if (code === "Psc") lignes = lignes.map(allege);
  /* L'ascension droite fait le tour du ciel : la Vierge est à cheval sur ±180°. */
  const ref = lignes[0][0][0];
  const deroule = (lon) => { let d = lon - ref; while (d > 180) d -= 360; while (d < -180) d += 360; return d; };
  const tous = lignes.flat();
  const dec0 = tous.reduce((a, p) => a + p[1], 0) / tous.length;
  const k = Math.cos((dec0 * Math.PI) / 180);
  const plat = (p) => [-deroule(p[0]) * k, -p[1]];
  const pts = tous.map(plat);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys), larg = Math.max(...xs) - x0 || 1, haut = Math.max(...ys) - y0 || 1;
  const e = Math.min(CADRE[0] / larg, CADRE[1] / haut);
  const dx = (CADRE[0] - larg * e) / 2, dy = (CADRE[1] - haut * e) / 2;
  const st = [], ln = [], index = new Map();
  const etoile = (p) => {
    const q = plat(p), v = [arrondi((dx + (q[0] - x0) * e) / CADRE[0]), arrondi((dy + (q[1] - y0) * e) / CADRE[1])], cle = v.join();
    if (!index.has(cle)) { index.set(cle, st.length); st.push(v); }
    return index.get(cle);
  };
  for (const l of lignes) for (let i = 1; i < l.length; i++) { const a = etoile(l[i - 1]), b = etoile(l[i]); if (a !== b) ln.push([a, b]); }
  return { st, ln };
}

const CIEL = Object.fromEntries(SIGNES.map(([id, code]) => [id, figure(code)]));
const bloc = "/*CIEL*/var CIEL=" + JSON.stringify(CIEL) + ";/*FIN CIEL*/";
const jeu = fs.readFileSync(JEU, "utf8");
const motif = /\/\*CIEL\*\/[\s\S]*?\/\*FIN CIEL\*\//;

if (process.argv.includes("--controle")) {
  const ok = motif.test(jeu) && motif.exec(jeu)[0] === bloc;
  console.log(ok ? "bataille-constellations : le jeu porte les vraies figures" : "ÉCHEC\nbataille/index.html ne porte pas les figures calculées : relancer sans --controle");
  process.exit(ok ? 0 : 1);
} else if (process.argv.includes("--planche")) {
  /* Les figures du POC, relues dans le commit qui les portait encore. */
  const avant = execFileSync("git", ["show", "bb129cc:bataille/index.html"], { cwd: ICI, maxBuffer: 1 << 26 }).toString("utf8");
  const POC = {};
  for (const [id] of SIGNES) { const m = new RegExp("id:'" + id + "'[\\s\\S]*?st:(\\[\\[[\\s\\S]*?\\]\\]),ln:(\\[\\[[\\s\\S]*?\\]\\])\\}").exec(avant); POC[id] = { st: JSON.parse(m[1].replace(/(^|[\[,])\./g, "$10.")), ln: JSON.parse(m[2]) }; }
  const { chromium } = await import("playwright");
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:24px;background:#000644;color:#f4f2ff;font:500 15px system-ui,sans-serif;width:1180px}
h1{font:600 26px Georgia,serif;margin:0 0 4px}p{margin:0 0 18px;color:#caceff}.g{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.c{background:rgba(255,255,255,.06);border-radius:16px;padding:12px 14px}.c b{display:block;margin-bottom:8px}.d{display:flex;gap:12px}.d div{flex:1;text-align:center;color:#caceff;font-size:14px}canvas{display:block;width:100%;background:#0a1150;border-radius:10px;margin-bottom:4px}</style>
<h1>Les constellations de La Bataille</h1><p>À gauche le tracé du POC (inventé), à droite la vraie figure du ciel, nord en haut, telle qu'on la voit depuis l'hémisphère nord.</p><div class="g" id="g"></div>
<script>const POC=${JSON.stringify(POC)},CIEL=${JSON.stringify(CIEL)},S=${JSON.stringify(SIGNES)};
function trace(c,f){const x=c.getContext("2d"),k=c.width/174,n=f.st.length,gros=n<=12;x.setTransform(k,0,0,k,0,0);const p=f.st.map(s=>[20+s[0]*134,14+s[1]*60]);
x.strokeStyle="rgba(202,206,255,.85)";x.lineWidth=gros?1.5:1.2;f.ln.forEach(l=>{x.beginPath();x.moveTo(p[l[0]][0],p[l[0]][1]);x.lineTo(p[l[1]][0],p[l[1]][1]);x.stroke()});
p.forEach(q=>{x.fillStyle="rgba(244,242,255,.16)";x.beginPath();x.arc(q[0],q[1],gros?9:5,0,7);x.fill();x.fillStyle="#f4f2ff";x.beginPath();x.arc(q[0],q[1],gros?2.8:2,0,7);x.fill()})}
for(const [id,,nom] of S){const d=document.createElement("div");d.className="c";d.innerHTML="<b>"+nom+"</b><div class=d><div><canvas width=522 height=264></canvas>POC</div><div><canvas width=522 height=264></canvas>vrai ciel</div></div>";document.getElementById("g").appendChild(d);const cs=d.querySelectorAll("canvas");trace(cs[0],POC[id]);trace(cs[1],CIEL[id])}</script>`;
  const nav = await chromium.launch(), p = await nav.newPage({ viewport: { width: 1228, height: 900 }, deviceScaleFactor: 1.5 });
  await p.setContent(html);
  fs.mkdirSync(path.join(ICI, "captures"), { recursive: true });
  await p.screenshot({ path: path.join(ICI, "captures", "bataille-constellations.png"), fullPage: true });
  await nav.close();
  console.log("captures/bataille-constellations.png");
} else {
  if (!motif.test(jeu)) { console.log("ÉCHEC\nmarqueurs /*CIEL*/ … /*FIN CIEL*/ absents de bataille/index.html"); process.exit(1); }
  fs.writeFileSync(JEU, jeu.replace(motif, () => bloc));
  console.log("bataille/index.html : " + SIGNES.map(([id]) => id + " " + CIEL[id].st.length).join(", ") + " étoiles");
}
