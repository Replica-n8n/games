import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : MAQUETTE de l'habit de feu, gardée pour l'histoire : depuis toto-1.22.0 le jeu
   le dessine lui-même (`drawFeu`), et ce script le dessinerait deux fois. Un habit de feu, « Cœur de
   volcan » : sous l'eau le feu est du MAGMA (peau de basalte fendue de braise, vapeur
   qui monte). Les 4 niveaux en gros plan, puis la requin en jeu, au soleil et au noir.
   Le code est glissé dans la page servie (le jeu vit dans une portée fermée).
   `node tools/toto-maquette-feu.mjs` ; captures tools/captures/toto-feu-*.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CAPT = path.join(HERE, "captures");
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctxN = await nav.newContext({ ...devices["Pixel 9 landscape"], deviceScaleFactor: 2, serviceWorkers: "block" });
const p = await ctxN.newPage();
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.message));

const MAQUETTE = (() => {
  HAB.feu = { corps: ["#25201e", "#25201e", "#25201e", "#25201e"], ventre: ["#4c403b", "#4c403b", "#4c403b", "#4c403b"], nag: ["#1e1918", "#1e1918", "#1e1918", "#1e1918"], oeil: "#ffcf40" };
  window.__flammes = [];
  const sh0 = drawShark;
  /* Le mélange : la carapace noire au poitrail de lave (maquette 3, niveau 2), la
     dorsale qui EST une flamme (maquette 4, niveau 1), et un feu réaliste (maquette 2) :
     langues qui montent vers la surface, cœur blanc, jaune, orange, fumée brune. */
  drawShark = function () { sh0(); if (P.habit !== "feu") return; const n = lv("feu"), L = P.r * 2.8, t = time, pl = reduit.matches ? .85 : .75 + .25 * Math.sin(t * 3);
    const ang = P.dang, sy = Math.cos(ang) < 0 ? -1 : 1, ca = Math.cos(ang), sa = Math.sin(ang);
    const monde = (lx, ly) => [P.x + ca * lx * L - sa * ly * sy * L, P.y + sa * lx * L + ca * ly * sy * L];
    ctx.save(); ctx.translate(P.x, P.y); ctx.rotate(ang); if (sy < 0) ctx.scale(1, -1);
    const lueur = (a) => `rgba(255,${Math.round(110 + 60 * pl)},30,${a})`;
    ctx.save(); ctx.beginPath(); ctx.ellipse(L * .05, -L * .02, L * .5, L * .16, 0, 0, 6.3); ctx.clip();
    const veine = [[.3, -.06], [.24, -.095], [.15, -.07], [.06, -.1], [-.03, -.07], [-.12, -.095], [-.21, -.06], [-.31, -.075], [-.4, -.04]];
    const fourches = [[[.31, -.06], [.285, -.01], [.3, .035]], [[.15, -.07], [.13, -.13], [.155, -.17]], [[-.03, -.07], [-.015, -.01], [-.06, .045]], [[.24, -.095], [.215, -.15]], [[-.21, -.06], [-.24, -.12]], [[-.12, -.095], [-.1, -.03], [-.13, .02]]];
    const traits = [[veine.slice(0, 3), fourches[0]], [veine.slice(0, 6), fourches[0], fourches[1]], [veine, ...fourches.slice(0, 4)], [veine, ...fourches]][n - 1] || [];
    for (const [k, fv] of traits.entries()) { const principal = k === 0; ctx.beginPath(); fv.forEach(([x, y], i) => i ? ctx.lineTo(L * x, L * y) : ctx.moveTo(L * x, L * y));
      ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = lueur(.3 * pl); ctx.lineWidth = L * (principal ? .03 + .006 * n : .02); ctx.stroke();
      ctx.strokeStyle = "rgba(220,70,20,.95)"; ctx.lineWidth = L * (principal ? .011 + .002 * n : .007); ctx.stroke();
      ctx.strokeStyle = `rgba(255,${Math.round(205 + 40 * pl)},120,.95)`; ctx.lineWidth = L * (principal ? .004 + .001 * n : .003); ctx.stroke(); }
    ctx.restore();
    // les pointes du dos (celles du niveau 2)
    const dosY = (x) => -L * (.195 - .4 * (x - .15) * (x - .15)) + L * .012;
    const pointe = (x, hh) => { const X = L * x, Y = dosY(x), w = L * .03; ctx.beginPath(); ctx.moveTo(X + w, Y + L * .01); ctx.quadraticCurveTo(X + w * .2, Y - L * hh * .5, X - L * .05, Y - L * hh); ctx.quadraticCurveTo(X - w * .5, Y - L * hh * .35, X - w, Y + L * .012); ctx.closePath(); ctx.fillStyle = HAB.feu.nag[0]; ctx.fill(); ctx.strokeStyle = "rgba(8,5,4,.85)"; ctx.lineWidth = L * .006; ctx.stroke(); };
    [-.18, -.23].forEach((x, k) => pointe(x, .06 * (1 - k * .13)));
    // la dorsale de feu : la nageoire devient un foyer, jaune à la base, orange au bout
    const fin = new Path2D(); fin.moveTo(L * .1, -L * .16); fin.quadraticCurveTo(L * .01, -L * .34, -L * .15, -L * .43); fin.quadraticCurveTo(-L * .11, -L * .27, -L * .19, -L * .13); fin.closePath();
    ctx.fillStyle = HAB.feu.nag[0]; ctx.fill(fin); ctx.strokeStyle = "rgba(8,5,4,.85)"; ctx.lineWidth = L * .006; ctx.stroke(fin);
    const gf = ctx.createLinearGradient(0, -L * .15, -L * .05, -L * .43); gf.addColorStop(0, `rgba(255,${Math.round(235 + 20 * pl)},170,1)`); gf.addColorStop(.3, "rgba(255,165,40,.9)"); gf.addColorStop(.65, "rgba(225,70,20,.45)"); gf.addColorStop(1, "rgba(225,70,20,0)"); ctx.fillStyle = gf; ctx.fill(fin);
    const wag = Math.sin(P.t * (7 + Math.hypot(P.vx, P.vy) * .9)) * .28;
    if (false) { ctx.save(); ctx.translate(-L * .4, 0); ctx.rotate(wag); const qf = new Path2D(); qf.moveTo(L * .06, -L * .05); qf.bezierCurveTo(-L * .06, -L * .12, -L * .18, -L * .24, -L * .3, -L * .31); qf.bezierCurveTo(-L * .27, -L * .2, -L * .2, -L * .06, -L * .12, -L * .005); qf.bezierCurveTo(-L * .18, L * .05, -L * .22, L * .12, -L * .24, L * .19); qf.bezierCurveTo(-L * .12, L * .13, -L * .02, L * .07, L * .06, L * .05); qf.closePath();
      ctx.fillStyle = HAB.feu.nag[0]; ctx.fill(qf); ctx.strokeStyle = "rgba(8,5,4,.85)"; ctx.lineWidth = L * .006; ctx.stroke(qf);
      const gq = ctx.createLinearGradient(L * .04, 0, -L * .28, 0); gq.addColorStop(0, `rgba(255,${Math.round(235 + 20 * pl)},170,.9)`); gq.addColorStop(.18, "rgba(255,165,40,.7)"); gq.addColorStop(.42, "rgba(225,70,20,.2)"); gq.addColorStop(1, "rgba(225,70,20,0)"); ctx.fillStyle = gq; ctx.fill(qf); ctx.restore(); }
    // l'œil de braise, la gueule qui rougeoie
    const go = ctx.createRadialGradient(L * .37, -L * .045, 0, L * .37, -L * .045, L * .05); go.addColorStop(0, `rgba(255,170,40,${.7 * pl})`); go.addColorStop(1, "rgba(255,90,20,0)"); ctx.fillStyle = go; ctx.beginPath(); ctx.arc(L * .37, -L * .045, L * .05, 0, 6.3); ctx.fill();
    if (false) { ctx.strokeStyle = `rgba(255,${Math.round(150 + 60 * pl)},50,.95)`; ctx.lineWidth = L * .014; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(L * .51, L * .055); ctx.quadraticCurveTo(L * .4, L * .09, L * .3, L * .055); ctx.stroke(); }
    if (n >= 4) { const ex = L * .37, ey = -L * .045, S = 1.9;
      ctx.globalCompositeOperation = "lighter"; const gr = ctx.createRadialGradient(ex, ey, 0, ex, ey, L * .1); gr.addColorStop(0, `rgba(255,220,90,${.35 * pl})`); gr.addColorStop(1, "rgba(255,120,20,0)"); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(ex, ey, L * .1, 0, 6.3); ctx.fill(); ctx.globalCompositeOperation = "source-over";
      // la traînée : une flamme effilée qui part de l'œil vers l'arrière et le haut, et ondule
      const o = reduit.matches ? 0 : Math.sin(t * 9) * .02, o2 = reduit.matches ? 0 : Math.sin(t * 13 + 1) * .015;
      // une flamme large, collée à l'œil, qui monte vers l'arrière ; trois couches, du rouge au blanc
      for (const [k, col] of [[1, "rgba(240,90,20,.8)"], [.72, "rgba(255,180,40,.92)"], [.45, "rgba(255,240,170,1)"]]) { const w = L * .032 * k, tx = ex - L * (.07 + .07 * k), ty = ey - L * (.06 + .08 * k) + L * o;
        ctx.beginPath(); ctx.moveTo(ex + w * .9, ey + w * .3); ctx.bezierCurveTo(ex + w * .4, ey - w * 1.6, tx + L * .035, ty + L * .03 + L * o2, tx, ty);
        ctx.bezierCurveTo(tx + L * .02, ty + L * .06, ex - w * 1.8, ey + w * .2, ex - w * .4, ey + w * .7); ctx.quadraticCurveTo(ex + w * .4, ey + w * 1.1, ex + w * .9, ey + w * .3); ctx.fillStyle = col; ctx.fill(); }
      // l'œil lui-même : une amande jaune-blanc, plissée, sans pupille
      ctx.fillStyle = "#fff6c8"; ctx.beginPath(); ctx.moveTo(ex + L * .03, ey + L * .006); ctx.quadraticCurveTo(ex, ey - L * .028, ex - L * .03, ey - L * .006); ctx.quadraticCurveTo(ex, ey + L * .016, ex + L * .03, ey + L * .006); ctx.strokeStyle = "rgba(60,14,4,.9)"; ctx.lineWidth = L * .008; ctx.stroke(); ctx.fill(); }
    ctx.restore();
    if (n >= 4 && Math.random() < .35) for (let k = 0; k < 1; k++) { const [x, y] = monde(.34 + rand(-.03, .03), -.08 + rand(-.03, .02)); __flammes.push({ x, y, vx: rand(-.4, .4) - ca * 1.3, vy: rand(-1.1, -.4), v: 0, m: rand(.3, .55), r0: L * rand(.01, .017) }); }
    // le feu réaliste : des langues qui naissent DANS la dorsale et montent vers la surface
    const dansFin = () => { let u = Math.random(), v = Math.random(); if (u + v > 1) { u = 1 - u; v = 1 - v; } const A = [.1, -.16], B = [-.15, -.43], C = [-.19, -.13]; return [A[0] + u * (B[0] - A[0]) + v * (C[0] - A[0]), A[1] + u * (B[1] - A[1]) + v * (C[1] - A[1])]; };
        const dansQueue = () => { let u = Math.random(), v = Math.random(); if (u + v > 1) { u = 1 - u; v = 1 - v; } const A = [.04, 0], B = [-.3, -.31], C = [-.24, .19], x = A[0] + u * (B[0] - A[0]) + v * (C[0] - A[0]), y = A[1] + u * (B[1] - A[1]) + v * (C[1] - A[1]); return [-.4 + x * Math.cos(wag) - y * Math.sin(wag), x * Math.sin(wag) + y * Math.cos(wag)]; };
    if (false) for (let k = 0; k < 7; k++) { const [x, y] = monde(...dansQueue()); __flammes.push({ x, y, vx: rand(-.4, .4) - ca * 1.2, vy: rand(-1.3, -.4), v: 0, m: rand(.35, .7), r0: L * rand(.014, .024) }); }
    if (false) for (let k = 0; k < 6; k++) { const [x, y] = monde(.53 + rand(0, .04), .07 + rand(-.01, .01)); __flammes.push({ x, y, vx: ca * rand(2.5, 5) + rand(-.4, .4), vy: sa * rand(2.5, 5) + rand(-.5, .2), v: 0, m: rand(.3, .55), r0: L * rand(.016, .03), souffle: true }); }
    const fF = [0, .35, .55, .78, 1][n]; // la flamme de la dorsale grandit à chaque niveau
    for (let k = 0; k < Math.round(2 + 4 * fF); k++) { const [lx, ly] = dansFin(), [x, y] = monde(lx, ly); __flammes.push({ x, y, vx: rand(-.4, .4) - ca * 1.2, vy: rand(-1.3, -.4) * (.5 + .5 * fF), v: 0, m: rand(.35, .75) * (.45 + .55 * fF), r0: L * rand(.014, .026) * (.6 + .4 * fF) }); }
    if (Math.random() < .4 * fF) { const [x, y] = monde(...dansFin()); __flammes.push({ x, y, vx: rand(-2.5, 2.5), vy: rand(-3, -.8), v: 0, m: rand(.3, .6), etincelle: true }); }
    for (const q of __flammes) { q.v += 1 / 60; if (q.etincelle) q.vy += .08; else if (q.souffle) { q.vx *= .94; q.vy = q.vy * .94 - .07; } else { q.vy -= .05; q.vx *= .96; } q.x += q.vx; q.y += q.vy; } __flammes = __flammes.filter((q) => q.v < q.m);
    for (const q of __flammes) { if (q.etincelle) continue; const u = q.v / q.m; if (u < .55) continue; ctx.fillStyle = `rgba(48,32,22,${.5 * (1 - u)})`; ctx.beginPath(); ctx.arc(q.x, q.y, q.r0 * (1.6 + u * 2.2), 0, 6.3); ctx.fill(); }
    for (const q of __flammes) { const u = q.v / q.m;
      if (q.etincelle) { ctx.fillStyle = `rgba(255,${Math.round(220 - 80 * u)},120,${1 - u})`; ctx.fillRect(q.x - 1.5, q.y - 1.5, 3, 3); continue; }
      if (u >= .6) continue; const r = q.r0 * (1 + u * 1.4), col = u < .12 ? [255, 246, 200] : u < .3 ? [255, 200, 60] : u < .45 ? [250, 130, 28] : [210, 64, 18];
      const hh = r * (2.4 + Math.sin(t * 23 + q.r0 * 7) * .5), dx = Math.sin(t * 17 + q.x * .1) * r * .5;
      ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${.62 - u * .5})`; ctx.beginPath(); ctx.moveTo(q.x + dx, q.y - hh); ctx.quadraticCurveTo(q.x + r * 1.1, q.y - r * .3, q.x, q.y + r); ctx.quadraticCurveTo(q.x - r * 1.1, q.y - r * .3, q.x + dx, q.y - hh); ctx.fill(); }
  };
  window.__feu = (n) => { P.habit = "feu"; P.evo.feu = n; __flammes = []; };
}).toString().replace(/^\(\) => \{/, "").replace(/\}$/, "");
await p.route("**/toto/", async (r) => { const rep = await r.fetch(); const html = await rep.text(); if (!html.includes("window.__essais={")) throw new Error("point d'injection introuvable");
  await r.fulfill({ response: rep, body: html.replace("window.__essais={", MAQUETTE + ";window.__essais={") }); });
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(400);

const tenir = (lvl, x, y, zoom, hud) => p.evaluate(([lvl, x, y, zoom, hud]) => { const E = window.__essais, P = E.P; clearInterval(window.__t); P.lvl = lvl; P.gates = { g1: 1, g2: 1, g3: 1 }; for (const g of E.GATES) g.hp = 0;
  for (const id of ["hud", "btns", "narr", "mini", "stat", "obj", "bossbar", "aide"]) { const el = document.getElementById(id); if (el) el.style.visibility = hud ? "" : "hidden"; }
  window.__zoom = zoom || 0; window.__camCible = zoom ? { x, y } : null;
  window.__t = setInterval(() => { P.x = x; P.y = y + Math.sin(performance.now() / 700) * 6; P.vx = 2.5; P.vy = 0; P.dang = 0; P.face = 1; P.hp = 1e5; P.hunger = 100; P.inv = 0; for (const e of E.ents) if (Math.hypot(e.x - x, e.y - y) < 600) e.dead = true; }, 4); }, [lvl, x, y, zoom, hud]);
const gros = [];
for (const n of [1, 2, 3, 4]) { await tenir(17, 10400, 2150, 1.45, false); await p.evaluate((n) => window.__feu(n), n); await p.waitForTimeout(1600);
  const f = path.join(CAPT, `toto-feu-niveau-${n}.png`); await p.screenshot({ path: f }); gros.push(f); console.log("niveau", n); }
await tenir(12, 7300, 900, 0, true); await p.evaluate(() => window.__feu(4)); await p.waitForTimeout(1600);
await p.screenshot({ path: path.join(CAPT, "toto-feu-en-jeu-large.png") }); console.log("capture en jeu, large");
await tenir(17, 11250, 2850, 0, true); await p.evaluate(() => window.__feu(4)); await p.waitForTimeout(1600);
await p.screenshot({ path: path.join(CAPT, "toto-feu-en-jeu-abysses.png") }); console.log("capture en jeu, abysses");
const b64 = (f) => "data:image/png;base64," + fs.readFileSync(f).toString("base64");
const NOMS = ["1. Étincelle", "2. Veine", "3. Lave", "4. Regard de feu"];
const pl = await (await nav.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
await pl.setContent(`<body style="margin:0;background:#0b1118;font:700 26px system-ui;display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px">${gros.map((f, i) => `<figure style="margin:0;position:relative;overflow:hidden;border-radius:10px;height:420px"><img src="${b64(f)}" style="width:100%;height:100%;object-fit:cover"><figcaption style="position:absolute;left:14px;top:10px;background:#f5b800;color:#16233f;padding:4px 12px;border-radius:6px">${NOMS[i]}</figcaption></figure>`).join("")}</body>`);
await pl.screenshot({ path: path.join(CAPT, "toto-feu-planche.png"), fullPage: true }); console.log("planche");
if (erreurs.length) console.log("ERREURS :", [...new Set(erreurs)].join(" | "));
await nav.close(); srv.arreter();
