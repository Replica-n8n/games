import { chromium, devices } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : MAQUETTE, rien de tout cela n'est dans le jeu. La Grande Blanche (au loin,
   puis de près) et le squelette de mégalodon des abysses, dessinés par-dessus le
   vrai jeu pour juger de l'effet et des tailles avant de coder.
   `node tools/toto-maquette-geants.mjs` ; captures tools/captures/toto-maquette-*.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const p = await (await nav.newContext({ ...devices["Pixel 9 landscape"], deviceScaleFactor: 2, serviceWorkers: "block" })).newPage();
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.message));
/* Le jeu vit dans une portée fermée : la maquette est glissée DANS la page servie,
   juste avant `window.__essais`, sans toucher au fichier du dépôt. */
const MAQUETTE = (() => {
  /* La Grande Blanche : museau conique, corps en torpille épais, dorsale en triangle,
     queue en croissant, dos gris ardoise coupé net du ventre blanc, œil noir. */
  window.drawBlanche = (L, t, ouvert, ombre) => { const w = Math.sin(t * 2.2) * .5, lw = Math.max(1.5, L * .008), trait = "rgba(10,16,22,.75)";
    const queue = new Path2D(); queue.moveTo(-L * .44, -L * .03); queue.quadraticCurveTo(-L * .56, -L * .12 + w * L * .03, -L * .68, -L * .3 + w * L * .05); queue.quadraticCurveTo(-L * .6, -L * .06, -L * .575, 0);
    queue.quadraticCurveTo(-L * .6, L * .1, -L * .66, L * .23 + w * L * .04); queue.quadraticCurveTo(-L * .54, L * .1, -L * .44, L * .03); queue.closePath();
    const corps = new Path2D(); corps.moveTo(L * .5, -L * .005); corps.bezierCurveTo(L * .34, -L * .19, -L * .12, -L * .2, -L * .46, -L * .03); corps.lineTo(-L * .46, L * .03);
    corps.bezierCurveTo(-L * .14, L * .2, L * .2, L * .21, L * .4, L * .1); corps.quadraticCurveTo(L * .47, L * .06, L * .5, -L * .005);
    const dors = new Path2D(); dors.moveTo(L * .1, -L * .165); dors.quadraticCurveTo(L * .02, -L * .36, -L * .05, -L * .42); dors.quadraticCurveTo(-L * .05, -L * .28, -L * .12, -L * .16); dors.closePath();
    const d2 = new Path2D(); d2.moveTo(-L * .28, -L * .1); d2.lineTo(-L * .33, -L * .15); d2.lineTo(-L * .35, -L * .085); d2.closePath();
    const anale = new Path2D(); anale.moveTo(-L * .3, L * .1); anale.lineTo(-L * .35, L * .15); anale.lineTo(-L * .36, L * .08); anale.closePath();
    const pelv = new Path2D(); pelv.moveTo(-L * .12, L * .17); pelv.lineTo(-L * .2, L * .24); pelv.lineTo(-L * .22, L * .15); pelv.closePath();
    const pect = new Path2D(); pect.moveTo(L * .2, L * .13); pect.quadraticCurveTo(L * .12, L * .3, -L * .04, L * (.42 + Math.sin(t * 1.6) * .015)); pect.quadraticCurveTo(L * .04, L * .24, L * .05, L * .16); pect.closePath();
    const tout = [queue, corps, dors, d2, anale, pelv, pect];
    if (ombre) { ctx.fillStyle = ombre; for (const f of tout) ctx.fill(f); return; }
    const dos = "#56646d", flanc = "#74838b", ventre = "#f2f1ea";
    silhouette(tout, trait, lw); ctx.fillStyle = dos; ctx.fill(queue); ctx.fill(dors); ctx.fill(d2);
    ctx.fillStyle = ventre; ctx.fill(corps); ctx.fill(anale); ctx.fill(pelv);
    // la coupure nette, en dents de scie, entre le dos gris et le ventre blanc
    ctx.save(); ctx.clip(corps); ctx.fillStyle = degradeV(-L * .2, L * .04, [[0, dos], [1, flanc]]); ctx.beginPath(); ctx.moveTo(-L * .5, -L * .3); ctx.lineTo(L * .55, -L * .3); ctx.lineTo(L * .55, L * .012);
    for (let k = 0; k <= 26; k++) { const x = L * (.5 - k * .038); ctx.lineTo(x, L * (.03 + (k % 2 ? .012 : -.008) + Math.sin(k * 1.7) * .008 - k * .0012)); } ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.14)"; ctx.beginPath(); ctx.ellipse(0, -L * .12, L * .34, L * .014, 0, 0, 6.3); ctx.fill();
    // vieilles balafres
    ctx.strokeStyle = "rgba(225,232,235,.5)"; ctx.lineWidth = lw; for (const [x, y, a] of [[.3, -.07, .5], [.27, -.06, .5], [-.1, -.1, -.4], [-.24, -.02, .3], [.12, -.02, -.6]]) { ctx.beginPath(); ctx.moveTo(L * x, L * y); ctx.lineTo(L * (x - .05 * Math.cos(a)), L * (y + .05 * Math.sin(a))); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = degradeV(L * .13, L * .42, [[0, flanc], [1, dos]]); ctx.fill(pect);
    ctx.strokeStyle = "rgba(20,28,34,.55)"; ctx.lineWidth = lw * 1.2; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(L * (.25 - k * .022), -L * .07); ctx.quadraticCurveTo(L * (.235 - k * .022), 0, L * (.25 - k * .022), L * .07); ctx.stroke(); }
    ctx.fillStyle = "#05070a"; ctx.beginPath(); ctx.arc(L * .37, -L * .045, L * .014, 0, 6.3); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.beginPath(); ctx.arc(L * .373, -L * .049, L * .004, 0, 6.3); ctx.fill();
    ctx.fillStyle = "rgba(20,28,34,.6)"; ctx.beginPath(); ctx.arc(L * .465, -L * .012, L * .004, 0, 6.3); ctx.fill();
    if (ouvert) { // la gueule : la mâchoire tombe, deux rangées de triangles
      ctx.fillStyle = "#4a0a10"; ctx.beginPath(); ctx.moveTo(L * .455, L * .045); ctx.lineTo(L * .27, L * .075); ctx.lineTo(L * .3, L * .2); ctx.quadraticCurveTo(L * .4, L * .2, L * .44, L * .16); ctx.closePath(); ctx.fill(); ctx.strokeStyle = trait; ctx.lineWidth = lw; ctx.stroke();
      ctx.fillStyle = "#fbfaf4"; for (let k = 0; k < 9; k++) { const x = L * (.445 - k * .019), y = L * (.047 + k * .0032); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - L * .009, y + L * .03); ctx.lineTo(x - L * .018, y + L * .003); ctx.fill(); }
      for (let k = 0; k < 7; k++) { const x = L * (.425 - k * .018), y = L * (.172 + k * .004); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - L * .008, y - L * .026); ctx.lineTo(x - L * .016, y + L * .003); ctx.fill(); } }
    else { ctx.strokeStyle = "rgba(10,16,22,.8)"; ctx.lineWidth = lw * 1.3; ctx.beginPath(); ctx.moveTo(L * .45, L * .05); ctx.quadraticCurveTo(L * .36, L * .1, L * .28, L * .085); ctx.stroke();
      ctx.fillStyle = "#fbfaf4"; for (let k = 0; k < 7; k++) { const x = L * (.435 - k * .02), y = L * (.062 + Math.sin(k / 6 * 3.14) * .022); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - L * .007, y + L * .016); ctx.lineTo(x - L * .014, y + L * .002); ctx.fill(); } }
  };
  /* Le mégalodon : ce qu'il en reste vraiment (mâchoires, dents, vertèbres), couché
     dans la vase, la gueule ouverte assez grand pour qu'elle passe dedans. */
  window.drawMegalo = (X, S) => { const Y = floorY(X + S * .5) - S * .5, os = "#c9cdbf", ombre = "#8d9689", trait = "rgba(8,14,16,.8)", lw = S * .012;
    const q = (a, c, d, u) => [(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * c[0] + u * u * d[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * c[1] + u * u * d[1]];
    ctx.save(); ctx.beginPath(); ctx.moveTo(X - S * 5, -5000); ctx.lineTo(X + S * 2, -5000); for (let x = X + S * 2; x >= X - S * 5; x -= 20) ctx.lineTo(x, floorY(x) + 14); ctx.closePath(); ctx.clip();
    // une lueur froide : le plancton s'est installé sur les os
    const g = ctx.createRadialGradient(X + S * .4, Y, S * .1, X + S * .4, Y, S * 1.5); g.addColorStop(0, "rgba(120,220,210,.22)"); g.addColorStop(1, "rgba(120,220,210,0)"); ctx.fillStyle = g; ctx.fillRect(X - S * 2, Y - S * 2, S * 5, S * 4);
    // vertèbres : des disques, de plus en plus petits, qui s'enfoncent puis ressortent
    for (let i = 26; i >= 0; i--) { const x = X - S * .42 - i * S * .15, enfoui = i > 9 && i < 15 ? S * .16 : i >= 15 ? S * .05 : 0, y = Math.min(Y - S * .1 + i * S * .05, floorY(x) - S * .06) + enfoui, r = S * (.11 - i * .0028);
      const d = new Path2D(); d.ellipse(x, y, r * .55, r, .08, 0, 6.3); ctx.strokeStyle = trait; ctx.lineWidth = lw * 2; ctx.stroke(d); ctx.fillStyle = i % 2 ? os : "#b9bfb0"; ctx.fill(d);
      ctx.fillStyle = ombre; ctx.beginPath(); ctx.ellipse(x, y, r * .2, r * .45, .08, 0, 6.3); ctx.fill(); }
    ctx.translate(X, Y); ctx.rotate(.1);
    // arcs des branchies, puis le crâne et son rostre
    for (let k = 0; k < 5; k++) { const x = -S * (.1 + k * .075), a = new Path2D(); a.moveTo(x, -S * .3); a.quadraticCurveTo(x - S * .1, S * .05, x + S * .02, S * .32); ctx.strokeStyle = trait; ctx.lineWidth = S * .05; ctx.lineCap = "round"; ctx.stroke(a); ctx.strokeStyle = k % 2 ? os : "#b9bfb0"; ctx.lineWidth = S * .03; ctx.stroke(a); }
    const crane = new Path2D(); crane.moveTo(-S * .12, -S * .22); crane.bezierCurveTo(-S * .05, -S * .52, S * .45, -S * .56, S * .78, -S * .5); crane.quadraticCurveTo(S * 1.05, -S * .47, S * 1.12, -S * .36); crane.quadraticCurveTo(S * .8, -S * .36, S * .55, -S * .3); crane.quadraticCurveTo(S * .2, -S * .2, -S * .12, -S * .22);
    silhouette([crane], trait, lw); ctx.fillStyle = degradeV(-S * .55, -S * .2, [[0, os], [1, ombre]]); ctx.fill(crane);
    ctx.fillStyle = "#0c1618"; ctx.beginPath(); ctx.ellipse(S * .42, -S * .4, S * .085, S * .06, -.1, 0, 6.3); ctx.fill(); ctx.strokeStyle = trait; ctx.lineWidth = lw; ctx.stroke();
    // mâchoires : deux arcs épais, et les dents, grandes comme une main
    const hA = [S * 1.0, -S * .1], hC = [S * .5, -S * .28], hD = [S * .04, S * .06], bA = [S * .08, -S * .01], bC = [S * .45, S * .47], bD = [S * .95, S * .4];
    const haut = new Path2D(); haut.moveTo(0, -S * .06); haut.quadraticCurveTo(S * .5, -S * .47, S * 1.03, -S * .22); haut.lineTo(...hA); haut.quadraticCurveTo(...hC, ...hD); haut.closePath();
    const bas = new Path2D(); bas.moveTo(0, S * .03); bas.quadraticCurveTo(S * .4, S * .66, S * .98, S * .52); bas.lineTo(...bD); bas.quadraticCurveTo(...bC, ...bA); bas.closePath();
    // dy : +1 la dent pointe vers le bas (mâchoire du haut), -1 vers le haut ; plus grandes à l'avant
    const dents = (A, C, D, dy, n, avant) => { for (let k = 0; k < n; k++) { const u = (k + .5) / n, [x, y] = q(A, C, D, u), [x2, y2] = q(A, C, D, u + .5 / n), [x1, y1] = q(A, C, D, u - .5 / n), h = S * (.05 + .1 * avant(u));
        const d = new Path2D(); d.moveTo(x1, y1); d.lineTo(x, y + h * dy); d.lineTo(x2, y2); d.closePath(); ctx.strokeStyle = trait; ctx.lineWidth = lw * 1.4; ctx.stroke(d); ctx.fillStyle = "#eef0e6"; ctx.fill(d); } };
    dents(hA, hC, hD, 1, 11, (u) => 1 - u); dents(bA, bC, bD, -1, 10, (u) => u);
    silhouette([haut, bas], trait, lw); ctx.fillStyle = degradeV(-S * .45, S * .1, [[0, os], [1, ombre]]); ctx.fill(haut); ctx.fillStyle = degradeV(0, S * .66, [[0, os], [1, ombre]]); ctx.fill(bas);
    // ce qui a poussé dessus
    for (const [x, y, c] of [[.3, -.38, "#3fae8c"], [.72, -.3, "#7fe0d0"], [.2, .34, "#3fae8c"], [.6, .55, "#c46a8a"], [-.2, -.25, "#7fe0d0"]]) { ctx.strokeStyle = c; ctx.lineWidth = S * .012; ctx.lineCap = "round"; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(S * x, S * y); ctx.quadraticCurveTo(S * (x + k * .02), S * (y - .05), S * (x + k * .04 + Math.sin(time * 1.3 + k) * .01), S * (y - .1)); ctx.stroke(); } }
    ctx.restore(); };
  const bg0 = drawBg, sh0 = drawShark; window.__mq = {};
  drawBg = function (...a) { bg0(...a); if (window.__mq.fond) window.__mq.fond(); };
  drawShark = function () { if (window.__mq.avant) window.__mq.avant(); sh0(); if (window.__mq.apres) window.__mq.apres(); };
  window.__say = say;
  window.__scenes = {
    loin: { fond() { ctx.save(); ctx.translate(P.x + 40, P.y - 150); ctx.scale(-1, 1); ctx.globalAlpha = .3; drawBlanche(1050, time, false); ctx.globalAlpha = 1; ctx.restore(); } },
    pres: { avant() { ctx.save(); ctx.translate(P.x + 440, P.y - 60); ctx.scale(-1, 1); ctx.rotate(-.06); ctx.save(); ctx.translate(325, 90); ctx.rotate(.5); drawMarteau({ t: time, bite: 0, mode: "" }, 97); ctx.restore(); drawBlanche(580, time, true); ctx.restore(); } },
    megalo: { fond() { drawMegalo(P.x - 190, 400); } } };
}).toString().replace(/^\(\) => \{/, "").replace(/\}$/, "");
await p.route("**/toto/", async (r) => { const rep = await r.fetch(); const html = await rep.text(); if (!html.includes("window.__essais={")) throw new Error("point d'injection introuvable");
  await r.fulfill({ response: rep, body: html.replace("window.__essais={", MAQUETTE + ";window.__essais={") }); });
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(400);
const scene = async (nom, lvl, x, y, mq, texte) => {
  await p.evaluate(([lvl, x, y, mq, texte]) => { const E = window.__essais, P = E.P; clearInterval(window.__t); P.lvl = lvl; P.gates = { g1: 1, g2: 1, g3: 1 }; for (const g of E.GATES) g.hp = 0; P.bosses = { b0: 1, b1: 1, b2: 1, b3: 1 };
    const yy = y === "fond" ? E.floorY(x) - 175 : y; window.__mq = window.__scenes[mq];
    window.__t = setInterval(() => { P.x = x; P.y = yy; P.vx = .6; P.vy = 0; P.dang = 0; P.face = 1; P.hp = 1e5; P.hunger = 100; P.inv = 0; for (const e of E.ents) if (e.boss || Math.hypot(e.x - x, e.y - yy) < 520) e.dead = true; }, 4);
    setTimeout(() => window.__say(texte, 9), 700); }, [lvl, x, y, mq, texte]);
  await p.waitForTimeout(2200); await p.screenshot({ path: path.join(HERE, "captures", `toto-maquette-${nom}.png`) }); console.log("capture", nom);
};
await scene("1-blanche-au-loin", 12, 7300, 1450,
  "loin",
  "Quelque chose de très grand passe au large. Même les requins-marteaux regardent ailleurs.");
await scene("2-blanche-de-pres", 12, 7300, 1450,
  "pres",
  "La Grande Blanche. Elle ne chasse pas : elle se sert.");
await scene("3-megalodon", 17, 11260, "fond",
  "megalo",
  "Un mégalodon. Seize mètres de requin, mort depuis trois millions d'années. Elle se sent soudain très ado.");
if (erreurs.length) console.log("ERREURS :", [...new Set(erreurs)].join(" | "));
await nav.close(); srv.arreter();
