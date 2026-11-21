import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* toto : MAQUETTE (la piste C « halo » est dans le jeu depuis toto-1.22.1 : sans variante,
   on voit le rendu du jeu). À quoi ressemble une bête qui
   BRÛLE (Sang de lave) ? Aujourd'hui, des bouffées orange ; trois pistes :
   A « torche » (de vraies flammes sur le dos, comme la dorsale de la requin),
   B « braises » (des points incandescents sur le corps, fumée sombre, une petite flamme),
   C « halo » (une lueur orange qui pulse et des étincelles, sans flamme).
   Quatre bêtes immobiles (barracuda, alligator, marteau, tortue), au soleil puis au noir.
   `node tools/toto-maquette-brule.mjs` ; captures tools/captures/toto-brule-*.png. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CAPT = path.join(HERE, "captures");
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctxN = await nav.newContext({ ...devices["Pixel 9 landscape"], deviceScaleFactor: 2, serviceWorkers: "block" });
const p = await ctxN.newPage();
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.message));

const MAQUETTE = (() => {
  window.__variante = "";
  const d0 = drawEnt;
  // une langue de feu réaliste, comme celles de la dorsale (blanc, jaune, orange, rouge)
  const langue = (q, t) => { const u = q.v / q.m; if (u >= .6) return; const r = q.r0 * (1 + u * 1.4), col = u < .12 ? "255,246,200" : u < .3 ? "255,200,60" : u < .45 ? "250,130,28" : "210,64,18";
    const hh = r * (2.4 + Math.sin(t * 23 + q.r0 * 7) * .5), dx = Math.sin(t * 17 + q.x * .1) * r * .5;
    ctx.fillStyle = `rgba(${col},${.62 - u * .5})`; ctx.beginPath(); ctx.moveTo(q.x + dx, q.y - hh); ctx.quadraticCurveTo(q.x + r * 1.1, q.y - r * .3, q.x, q.y + r); ctx.quadraticCurveTo(q.x - r * 1.1, q.y - r * .3, q.x + dx, q.y - hh); ctx.fill(); };
  const fumee = (q, a) => { const u = q.v / q.m; ctx.fillStyle = `rgba(40,28,20,${a * (1 - u)})`; ctx.beginPath(); ctx.arc(q.x, q.y, q.r0 * (1 + u * 2.5), 0, 6.3); ctx.fill(); };
  const etincelle = (q) => { const u = q.v / q.m; ctx.fillStyle = `rgba(255,${Math.round(220 - 80 * u)},120,${1 - u})`; ctx.fillRect(q.x - 1.5, q.y - 1.5, 3, 3); };
  const lueur = (e, R, a) => { ctx.globalCompositeOperation = "lighter"; const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, R); g.addColorStop(0, `rgba(255,150,40,${a})`); g.addColorStop(1, "rgba(255,80,20,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y, R, 0, 6.3); ctx.fill(); ctx.globalCompositeOperation = "source-over"; };
  const avance = (fx) => { for (const q of fx) { q.v += 1 / 60; if (q.etincelle) q.vy += .06; else { q.vy -= q.fumee ? .02 : .05; q.vx *= .96; } q.x += q.vx; q.y += q.vy; } return fx.filter((q) => q.v < q.m); };
  const surDos = (e) => [e.x + (Math.random() - .5) * e.r * 1.5, e.y - e.r * (.2 + Math.random() * .35)];
  drawEnt = function (e) { d0(e); const v = window.__variante; if (!v || !(e.brule > 0) || e.kind !== "ani") return; const t = time, pl = .75 + .25 * Math.sin(t * 4 + e.x), r = e.r;
    e.fx = e.fx || [];
    if (v === "A") { lueur(e, r * 1.5, .3 * pl);
      for (let k = 0; k < 3; k++) { const [x, y] = surDos(e); e.fx.push({ x, y, vx: rand(-.3, .3), vy: rand(-1.2, -.5), v: 0, m: rand(.35, .7), r0: r * rand(.12, .2) }); }
      if (Math.random() < .3) { const [x, y] = surDos(e); e.fx.push({ x, y, vx: rand(-2, 2), vy: rand(-2.5, -.8), v: 0, m: rand(.3, .6), etincelle: true }); }
      e.fx = avance(e.fx); for (const q of e.fx) if (!q.etincelle && q.v / q.m > .55) fumee(q, .45); for (const q of e.fx) q.etincelle ? etincelle(q) : langue(q, t); }
    if (v === "B") { lueur(e, r * 1.1, .18 * pl);
      // des braises posées sur le corps, qui s'allument et s'éteignent
      for (let k = 0; k < 9; k++) { const h1 = hash(k * 7.1 + e.r), h2 = hash(k * 3.3 + 1), a = Math.sin(t * (3 + h1 * 4) + k) * .5 + .5, x = e.x + (h1 - .5) * r * 1.5, y = e.y + (h2 - .5) * r * .9;
        ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(255,${Math.round(120 + 100 * a)},40,${.35 + .6 * a})`; ctx.beginPath(); ctx.arc(x, y, Math.max(1.5, r * (.05 + .04 * a)), 0, 6.3); ctx.fill(); ctx.globalCompositeOperation = "source-over"; }
      if (Math.random() < .5) { const [x, y] = surDos(e); e.fx.push({ x, y, vx: rand(-.3, .3), vy: rand(-1, -.4), v: 0, m: rand(.8, 1.4), r0: r * rand(.12, .2), fumee: true }); }
      if (Math.random() < .6) { const [x, y] = surDos(e); e.fx.push({ x, y, vx: rand(-.2, .2), vy: rand(-.9, -.4), v: 0, m: rand(.3, .5), r0: r * rand(.08, .12) }); }
      e.fx = avance(e.fx); for (const q of e.fx) if (q.fumee) fumee(q, .4); for (const q of e.fx) if (!q.fumee) langue(q, t); }
    if (v === "C") { lueur(e, r * (1.5 + .25 * Math.sin(t * 6)), .45 * pl);
      ctx.strokeStyle = `rgba(255,170,60,${.5 * pl})`; ctx.lineWidth = Math.max(2, r * .08); ctx.beginPath(); ctx.ellipse(e.x, e.y, r * 1.2, r * .8, 0, 0, 6.3); ctx.stroke();
      for (let k = 0; k < 2; k++) { const [x, y] = surDos(e); e.fx.push({ x, y, vx: rand(-1.2, 1.2), vy: rand(-2.5, -1), v: 0, m: rand(.4, .8), etincelle: true }); }
      e.fx = avance(e.fx); for (const q of e.fx) etincelle(q); } };
}).toString().replace(/^\(\) => \{/, "").replace(/\}$/, "");
await p.route("**/toto/", async (r) => { const rep = await r.fetch(); let html = await rep.text(); if (!html.includes("window.__essais={")) throw new Error("point d'injection introuvable");
  html = html.replace("window.__essais={", MAQUETTE + ";window.__essais={");
  // les variantes remplacent les bouffées orange d'aujourd'hui
  html = html.replace("if(!reduit.matches&&Math.random()<.5)parts.push(", "if(!window.__variante&&!reduit.matches&&Math.random()<.5)parts.push(");
  await r.fulfill({ response: rep, body: html }); });
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(400);

const scene = (x, y, zoom) => p.evaluate(([x, y, zoom]) => { const E = window.__essais, P = E.P; clearInterval(window.__t); P.lvl = 6; P.gates = { g1: 1, g2: 1, g3: 1 }; for (const g of E.GATES) g.hp = 0;
  for (const id of ["hud", "btns", "narr", "mini", "stat", "obj", "bossbar", "aide"]) { const el = document.getElementById(id); if (el) el.style.visibility = "hidden"; }
  window.__zoom = zoom; window.__camCible = { x, y };
  for (const e of E.ents) e.dead = true;
  const betes = [["barracuda", -250, -50], ["alligator", -90, 40], ["marteau", 80, -40], ["tortue", 250, 40]].map(([t, dx, dy]) => { const e = E.mkEnt(t, x + dx, y + dy); e.maquette = [x + dx, y + dy]; e.face = 1; E.ents.push(e); return e; });
  window.__t = setInterval(() => { P.x = x - 650; P.y = y; P.vx = P.vy = 0; P.hp = 1e5; P.hunger = 100; P.inv = 9;
    for (const e of E.ents) if (e.maquette) { [e.x, e.y] = e.maquette; e.vx = 1; e.vy = 0; e.face = 1; e.hp = e.maxhp; e.brule = 99; e.bruleD = 0; e.bruleT = 0; e.atkCd = 9; e.flash = 0; } else e.dead = true; }, 4); }, [x, y, zoom]);
const VARIANTES = [["", "Aujourd'hui"], ["A", "A. Torche"], ["B", "B. Braises"], ["C", "C. Halo"]];
const planche = async (nom, x, y) => { const imgs = [];
  for (const [v] of VARIANTES) { await scene(x, y, 1); await p.evaluate((v) => { window.__variante = v; }, v); await p.waitForTimeout(1500);
    const f = path.join(CAPT, `toto-brule-${nom}-${v || "0"}.png`); await p.screenshot({ path: f }); imgs.push(f); console.log(nom, v || "aujourd'hui"); }
  const b64 = (f) => "data:image/png;base64," + fs.readFileSync(f).toString("base64");
  const pl = await (await nav.newContext({ viewport: { width: 1600, height: 680 } })).newPage();
  await pl.setContent(`<body style="margin:0;background:#0b1118;font:700 26px system-ui;display:grid;grid-template-columns:1fr 1fr;align-content:start;gap:12px;padding:12px">${imgs.map((f, i) => `<figure style="margin:0;position:relative;overflow:hidden;border-radius:10px"><img src="${b64(f)}" style="width:100%;display:block"><figcaption style="position:absolute;left:14px;top:10px;background:#f5b800;color:#16233f;padding:4px 12px;border-radius:6px">${VARIANTES[i][1]}</figcaption></figure>`).join("")}</body>`);
  await pl.screenshot({ path: path.join(CAPT, `toto-brule-planche-${nom}.png`), fullPage: true }); await pl.close(); };
await planche("soleil", 7300, 900);
await planche("noir", 11250, 2850);
if (erreurs.length) console.log("ERREURS :", [...new Set(erreurs)].join(" | "));
await nav.close(); srv.arreter();
