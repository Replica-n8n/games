import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { servir } from "./serveur.mjs";

/* Paper Race : la PLANCHE de l'upgrade graphique (méthode de toto).
   Gros plans sans interface de tout ce qui est dessiné, pour comparer avant et
   après une étape, et les images/s mesurées AVEC la carte graphique (sans elle,
   Chromium peint en logiciel et les chiffres mentent).
     node tools/paper-race-planche.mjs avant     → captures/planche-avant-*.png
     node tools/paper-race-planche.mjs apres     → captures/planche-apres-*.png
                                                   + captures/planche-comparee.png
   Échoue sur toute erreur de page. */

const nom = process.argv[2] || "avant";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "captures");
fs.mkdirSync(OUT, { recursive: true });
const fichier = (scene, n = nom) => path.join(OUT, `planche-${n}-${scene}.png`);

const site = await servir();
const URL_JEU = site.base + "paper-race/";
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const erreurs = [];
async function page(reglages, theme = "light") {
  const ctx = await nav.newContext({ ...devices["Pixel 9"], colorScheme: theme, reducedMotion: "no-preference" });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
  await p.goto(URL_JEU);
  await p.evaluate((r) => { localStorage.clear(); localStorage.setItem("paper-race.reglages.v1", JSON.stringify(r)); }, reglages);
  await p.reload();
  return { ctx, p };
}
async function course(reglages) {
  const t = await page(reglages);
  await t.p.click("#jouer");
  await t.p.waitForFunction(() => R && !depart && !occupe(), null, { timeout: 30000 });
  return t;
}
// cadre la caméra sur une case, sans bouger les voitures, et rend
const cadrer = (p, c) => p.evaluate((c) => {
  camLibre = true; camPose = true;
  camX = Math.max(0, Math.min(mapW() - vueW, gx(c[0]) - vueW / 2));
  camY = Math.max(0, Math.min(mapH() - vueH, gy(c[1]) - vueH / 2));
  render();
}, c);
// capture un carré autour d'une case du plateau (en cases de côté)
async function gros(p, c, cases, scene) {
  const box = await p.evaluate(({ c, cases }) => {
    const r = document.getElementById("board").getBoundingClientRect();
    const x = r.left + gx(c[0]) - Math.round(camX), y = r.top + gy(c[1]) - Math.round(camY), d = cases * cellPx / 2;
    return { x: Math.max(r.left, x - d), y: Math.max(r.top, y - d), width: Math.min(2 * d, r.width), height: Math.min(2 * d, r.height) };
  }, { c, cases });
  await p.screenshot({ path: fichier(scene), clip: box });
}

// ---------- 1. les voitures : les six couleurs, numérotées, sur le bitume ----------
{
  const { ctx, p } = await course({ mode: "gp", voitures: 6, level: "normal", circuit: "spavrai", pieges: false });
  // sur la grille de départ, là où la course les pose, un peu tournées
  const c = await p.evaluate(() => {
    opts = []; selected = null;
    R.cars.forEach((car, i) => { caps[i] += (i - 2.5) * 0.12; });
    const xs = R.cars.map((c) => c.p[0]), ys = R.cars.map((c) => c.p[1]);
    return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  });
  await cadrer(p, c); await p.waitForTimeout(150);
  await gros(p, c, 8, "voitures");
  await ctx.close();
}

// ---------- 2. un vrai tracé : virage, vibreurs, sable, herbe ----------
{
  const { ctx, p } = await course({ mode: "gp", voitures: 2, level: "normal", circuit: "monacovrai", pieges: true });
  const c = await p.evaluate(() => {
    R.cars.forEach((car) => { car.p = [0, 0]; car.trail = [[0, 0]]; });   // hors du cadre
    opts = [];
    // le virage le plus serré du tracé
    const T = R.track.trace; let best = 0, k = 0;
    for (let i = 0; i < T.length; i++) {
      const a = T[(i + T.length - 1) % T.length], b = T[i], d = T[(i + 1) % T.length];
      const u = [b[0] - a[0], b[1] - a[1]], v = [d[0] - b[0], d[1] - b[1]];
      const ang = Math.abs(Math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1]));
      if (ang > best) { best = ang; k = i; }
    }
    return T[k];
  });
  await cadrer(p, c); await p.waitForTimeout(150);
  await gros(p, c, 16, "virage");
  await ctx.close();
}

// ---------- 3. un circuit dessiné : coin, pneus, vibreurs, départ ----------
{
  const { ctx, p } = await course({ mode: "gp", voitures: 2, level: "normal", circuit: "s", pieges: false });
  const c = await p.evaluate(() => { opts = []; const O = R.track.outers[0]; return [O[0] + 3, O[1] + 3]; });
  await cadrer(p, c); await p.waitForTimeout(150);
  await gros(p, c, 9, "coin");
  const d = await p.evaluate(() => { const L = R.track.depart; return [(L.x0 + L.x1) / 2, L.y]; });
  await cadrer(p, d); await p.waitForTimeout(150);
  await gros(p, d, 8, "depart");
  await ctx.close();
}

// ---------- 4. un coup à jouer : tracé, neuf points, arrêt, prochain coup ----------
{
  const { ctx, p } = await course({ mode: "gp", voitures: 2, level: "normal", circuit: "spavrai", pieges: false, aide: true });
  const c = await p.evaluate(() => {
    // dans le VRAI sens de la course (sensEn), depuis le départ
    const moi = R.turn, car = R.cars[moi], L = R.track.depart;
    const o0 = [Math.round((L.x0 + L.x1) / 2), L.y], d = sensEn(R.track, o0[0], o0[1]);
    const at = (k) => [o0[0] + d[0] * k, o0[1] + d[1] * k];
    car.trail = [at(0), at(1), at(3), at(6)];
    car.p = at(6); car.v = [d[0] * 3, d[1] * 3]; caps[moi] = Math.atan2(d[1], d[0]);
    const autre = R.cars.findIndex((x, i) => i !== moi); R.cars[autre].p = [L.x1, L.y];
    newOpts(); const k = opts.findIndex((o) => o.ok); selected = k >= 0 ? k : null; refresh();
    return at(8);
  });
  await cadrer(p, c); await p.waitForTimeout(150);
  await gros(p, c, 11, "coup");
  // la mini-carte
  const mini = await p.evaluate(() => { const r = document.getElementById("minicarte").getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; });
  await p.screenshot({ path: fichier("minicarte"), clip: mini });
  // le ralenti télé (cinématique) : figé à mi-course
  await p.evaluate(() => {
    const moi = R.turn, car = R.cars[moi];
    lancerRejeu("Pleine vitesse", moi, car.trail[car.trail.length - 2].slice(), car.p.slice(), null);
  });
  await p.waitForTimeout(550);
  await p.evaluate(() => { if (rejeu) { rejeu.t0 = performance.now() - rejeu.dur * 0.55; } });
  const rb = await p.evaluate(() => { const r = document.getElementById("rejeubox").getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; });
  await p.screenshot({ path: fichier("ralenti"), clip: rb });
  await ctx.close();
}

// ---------- 5. l'arrivée : le drapeau ; l'accueil : les tuiles des circuits ----------
{
  const { ctx, p } = await page({ mode: "gp", voitures: 2, level: "normal", circuit: "spavrai" });
  // le vrai drapeau de fin de course, en pleine animation (le jeu l'appelle ainsi)
  await p.evaluate(() => drapeau(() => { }));
  await p.waitForTimeout(1200);
  await p.screenshot({ path: fichier("drapeau"), clip: { x: 0, y: 120, width: 412, height: 480 } });
  await p.evaluate(() => { document.getElementById("drapeau").style.display = "none"; });
  await p.screenshot({ path: fichier("accueil") });
  await ctx.close();
}

// ---------- 6. images/s AVEC la carte graphique ----------
// Le jeu ne dessine que quand quelque chose bouge : on mesure pendant que six
// voitures jouent (déplacements animés) puis pendant le rejeu de fin de course.
const ips = {};
{
  const { ctx, p } = await course({ mode: "gp", voitures: 6, level: "rapide", circuit: "spavrai", pieges: true });
  const mesure = () => p.evaluate(() => new Promise((ok) => {
    const t = []; let n = 0;
    const f = (now) => { t.push(now); if (++n < 240) requestAnimationFrame(f); else ok(t); };
    requestAnimationFrame(f);
  }));
  // six voitures qui jouent sans fin : le joueur aussi est confié au fantôme
  await p.evaluate(() => { window.__auto = setInterval(() => { if (R && !finie(R) && !occupe() && !estFantome(R.turn)) { const q = aiChoice(R, "rapide"); const k = q ? opts.findIndex((o) => o.p[0] === q[0] && o.p[1] === q[1]) : -1; if (k >= 0) commit(k); else forceArret(); } }, 30); });
  const t1 = await mesure();
  await p.evaluate(() => { clearInterval(window.__auto); });
  await p.waitForFunction(() => !occupe() || estFantome(R.turn), null, { timeout: 10000 }).catch(() => { });
  await p.evaluate(() => lancerReplay(() => { }));
  const t2 = await mesure();
  // le ralenti télé : relancé en boucle pendant la mesure
  await p.waitForFunction(() => !replay, null, { timeout: 15000 }).catch(() => { });
  await p.evaluate(() => {
    const go = () => { const pa = R.turn, c = R.cars[pa], t = c.trail; if (t.length > 1) lancerRejeu("Pleine vitesse", pa, t[t.length - 2].slice(), c.p.slice(), null); };
    go(); window.__rejeux = setInterval(go, 1250);
  });
  const t3 = await mesure();
  await p.evaluate(() => clearInterval(window.__rejeux));
  const resume = (t) => { const d = t.slice(1).map((x, i) => x - t[i]); d.sort((a, b) => a - b); const moy = (t[t.length - 1] - t[0]) / (t.length - 1); return { ips: Math.round(1000 / moy), pire: Math.round(d[d.length - 1]), p95: Math.round(d[Math.floor(d.length * 0.95)]) }; };
  ips.course = resume(t1); ips.rejeu = resume(t2); ips.ralenti = resume(t3);
  await ctx.close();
}
fs.writeFileSync(path.join(OUT, `planche-${nom}-ips.json`), JSON.stringify(ips, null, 2));
console.log("images/s (carte graphique) :", JSON.stringify(ips));

// ---------- la planche d'inventaire (avant) ----------
const scenesInv = ["voitures", "virage", "coin", "depart", "coup", "ralenti", "minicarte", "drapeau"];
if (nom === "avant") {
  const img = (f) => "data:image/png;base64," + fs.readFileSync(f).toString("base64");
  const cases = scenesInv.map((s) => `<figure><img src="${img(fichier(s))}"><figcaption>${s}</figcaption></figure>`).join("");
  const html = `<meta charset="utf-8"><style>body{font:15px system-ui;margin:16px;background:#f4f2ee}h1{font-size:20px}div{display:flex;flex-wrap:wrap;gap:14px}figure{margin:0}img{max-width:320px;max-height:320px;border:1px solid #ccc;background:#fff;display:block}figcaption{padding:4px 0;color:#333}</style><h1>Paper Race : planche AVANT</h1><p>Images/s avec la carte graphique : ${JSON.stringify(ips)}</p><div>${cases}</div>`;
  const ctx = await nav.newContext({ viewport: { width: 1100, height: 900 } });
  const p = await ctx.newPage(); await p.setContent(html);
  await p.screenshot({ path: path.join(OUT, "planche-avant.png"), fullPage: true });
  await ctx.close();
}

// ---------- la planche comparée : avant | après, scène par scène ----------
const scenes = ["voitures", "virage", "coin", "depart", "coup", "ralenti", "minicarte", "drapeau", "accueil"];
if (nom !== "avant" && scenes.every((s) => fs.existsSync(fichier(s, "avant")))) {
  const img = (f) => "data:image/png;base64," + fs.readFileSync(f).toString("base64");
  const ipsAvant = fs.existsSync(path.join(OUT, "planche-avant-ips.json")) ? JSON.parse(fs.readFileSync(path.join(OUT, "planche-avant-ips.json"), "utf8")) : null;
  const lignes = scenes.map((s) => `<tr><th>${s}</th><td><img src="${img(fichier(s, "avant"))}"></td><td><img src="${img(fichier(s))}"></td></tr>`).join("");
  const html = `<meta charset="utf-8"><style>body{font:15px system-ui;margin:16px;background:#f4f2ee}table{border-collapse:collapse}th{text-align:left;padding:8px;vertical-align:top}td{padding:6px;vertical-align:top}img{max-width:460px;max-height:460px;border:1px solid #ccc;background:#fff}h1{font-size:20px}</style>
<h1>Paper Race : planche ${nom}</h1><p>Images/s avec la carte graphique : avant ${JSON.stringify(ipsAvant)} · après ${JSON.stringify(ips)}</p>
<table><tr><th></th><th>avant</th><th>après</th></tr>${lignes}</table>`;
  const ctx = await nav.newContext({ viewport: { width: 1100, height: 900 } });
  const p = await ctx.newPage();
  await p.setContent(html);
  await p.screenshot({ path: path.join(OUT, `planche-comparee-${nom}.png`), fullPage: true });
  await ctx.close();
  console.log("planche comparée :", path.join(OUT, `planche-comparee-${nom}.png`));
}

await nav.close(); await site.fermer?.();
if (erreurs.length) { console.log("ECHEC : erreurs de page", erreurs.slice(0, 5)); process.exit(1); }
console.log("PLANCHE OK (" + nom + ")");
process.exit(0);
