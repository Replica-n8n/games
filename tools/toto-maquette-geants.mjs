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
  window.drawBlanche = (L, t, ouvert, ombre, pendue) => { const w = Math.sin(t * 2.2) * .5, lw = Math.max(1.5, L * .008), trait = "rgba(10,16,22,.75)";
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
    if (ombre) { ctx.fillStyle = ombre; for (const f of tout) ctx.fill(f);
      if (pendue) { // « pendue » sert ici de liseré : la lumière d'en haut accroche le dos, un œil pâle, des dents à peine
        ctx.save(); ctx.beginPath(); ctx.rect(-L, -L, L * 2, L * .98); ctx.clip(); ctx.strokeStyle = pendue; ctx.lineWidth = L * .0035; for (const f of [corps, dors, queue]) ctx.stroke(f); ctx.restore();
        ctx.fillStyle = "rgba(200,235,225,.55)"; ctx.beginPath(); ctx.arc(L * .37, -L * .045, L * .008, 0, 6.3); ctx.fill(); ctx.fillStyle = "rgba(2,4,6,.9)"; ctx.beginPath(); ctx.arc(L * .371, -L * .045, L * .004, 0, 6.3); ctx.fill();
        ctx.fillStyle = "rgba(190,200,195,.3)"; for (let k = 0; k < 9; k++) { const x = L * (.44 - k * .018), y = L * (.06 + Math.sin(k / 8 * 3.14) * .022); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - L * .007, y + L * .02); ctx.lineTo(x - L * .014, y + L * .002); ctx.fill(); }
        ctx.strokeStyle = "rgba(120,150,160,.14)"; ctx.lineWidth = L * .003; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(L * (.25 - k * .022), -L * .07); ctx.quadraticCurveTo(L * (.235 - k * .022), 0, L * (.25 - k * .022), L * .07); ctx.stroke(); } }
      return; }
    const dos = "#cfd6d9", flanc = "#e6eaea", ventre = "#ffffff";
    silhouette(tout, trait, lw); ctx.fillStyle = dos; ctx.fill(queue); ctx.fill(dors); ctx.fill(d2);
    ctx.fillStyle = ventre; ctx.fill(corps); ctx.fill(anale); ctx.fill(pelv);
    // la coupure nette, en dents de scie, entre le dos gris et le ventre blanc
    ctx.save(); ctx.clip(corps); ctx.fillStyle = degradeV(-L * .2, L * .04, [[0, dos], [1, flanc]]); ctx.beginPath(); ctx.moveTo(-L * .5, -L * .3); ctx.lineTo(L * .55, -L * .3); ctx.lineTo(L * .55, L * .012);
    for (let k = 0; k <= 26; k++) { const x = L * (.5 - k * .038); ctx.lineTo(x, L * (.03 + (k % 2 ? .012 : -.008) + Math.sin(k * 1.7) * .008 - k * .0012)); } ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.14)"; ctx.beginPath(); ctx.ellipse(0, -L * .12, L * .34, L * .014, 0, 0, 6.3); ctx.fill();
    // vieilles balafres
    ctx.strokeStyle = "rgba(120,135,145,.55)"; ctx.lineWidth = lw; for (const [x, y, a] of [[.3, -.07, .5], [.27, -.06, .5], [-.1, -.1, -.4], [-.24, -.02, .3], [.12, -.02, -.6]]) { ctx.beginPath(); ctx.moveTo(L * x, L * y); ctx.lineTo(L * (x - .05 * Math.cos(a)), L * (y + .05 * Math.sin(a))); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = degradeV(L * .13, L * .42, [[0, flanc], [1, dos]]); ctx.fill(pect);
    ctx.strokeStyle = "rgba(60,75,85,.6)"; ctx.lineWidth = lw * 1.2; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(L * (.25 - k * .022), -L * .07); ctx.quadraticCurveTo(L * (.235 - k * .022), 0, L * (.25 - k * .022), L * .07); ctx.stroke(); }
    ctx.fillStyle = "#05070a"; ctx.beginPath(); ctx.arc(L * .37, -L * .045, L * .014, 0, 6.3); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.beginPath(); ctx.arc(L * .373, -L * .049, L * .004, 0, 6.3); ctx.fill();
    ctx.fillStyle = "rgba(20,28,34,.6)"; ctx.beginPath(); ctx.arc(L * .465, -L * .012, L * .004, 0, 6.3); ctx.fill();
    if (ouvert) { // la gueule : la mâchoire tombe, deux rangées de triangles
      ctx.fillStyle = "#4a0a10"; ctx.beginPath(); ctx.moveTo(L * .455, L * .045); ctx.lineTo(L * .27, L * .075); ctx.lineTo(L * .3, L * .2); ctx.quadraticCurveTo(L * .4, L * .2, L * .44, L * .16); ctx.closePath(); ctx.fill(); ctx.strokeStyle = trait; ctx.lineWidth = lw; ctx.stroke();
      ctx.fillStyle = "#fbfaf4"; for (let k = 0; k < 9; k++) { const x = L * (.445 - k * .019), y = L * (.047 + k * .0032); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - L * .009, y + L * .03); ctx.lineTo(x - L * .018, y + L * .003); ctx.fill(); }
      for (let k = 0; k < 7; k++) { const x = L * (.425 - k * .018), y = L * (.172 + k * .004); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - L * .008, y - L * .026); ctx.lineTo(x - L * .016, y + L * .003); ctx.fill(); } }
    else { ctx.strokeStyle = "rgba(10,16,22,.8)"; ctx.lineWidth = lw * 1.3; ctx.beginPath(); ctx.moveTo(L * .45, L * .05); ctx.quadraticCurveTo(L * .36, L * .1, L * .28, L * .085); ctx.stroke();
      ctx.fillStyle = "#fbfaf4"; for (let k = 0; k < 7; k++) { const x = L * (.435 - k * .02), y = L * (.062 + Math.sin(k / 6 * 3.14) * .022); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - L * .007, y + L * .016); ctx.lineTo(x - L * .014, y + L * .002); ctx.fill(); } }
  };
  /* Le mégalodon, VIVANT, de face, au fond du noir : deux yeux qui luisent, puis une
     gueule plus large que l'écran qui s'ouvre. o = ouverture (0 fermée, 1 béante). */
  window.drawMega = (cx, cy, W, o, a) => { ctx.save(); ctx.translate(cx, cy); ctx.globalAlpha = a;
    const h1 = W * (.1 + .16 * o), h2 = W * (.06 + .3 * o), t = time;
    // le contour du museau, à peine : une lueur froide sur la peau
    ctx.strokeStyle = "rgba(120,160,170,.1)"; ctx.lineWidth = W * .012; ctx.beginPath(); ctx.moveTo(-W * .62, W * .1); ctx.bezierCurveTo(-W * .6, -W * .5, -W * .25, -W * .72, 0, -W * .74); ctx.bezierCurveTo(W * .25, -W * .72, W * .6, -W * .5, W * .62, W * .1); ctx.stroke();
    // les yeux : deux disques pâles, pupille noire, qui clignent rarement
    const cl = (t % 5) > 4.8 ? .15 : 1;
    for (const k of [-1, 1]) { const ex = k * W * .3, ey = -W * .33, r = W * .036; const g = ctx.createRadialGradient(ex, ey, r * .3, ex, ey, r * 4.5); g.addColorStop(0, "rgba(190,255,225,.5)"); g.addColorStop(1, "rgba(190,255,225,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ex, ey, r * 4.5, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#d9ffe9"; ctx.beginPath(); ctx.ellipse(ex, ey, r, r * cl, 0, 0, 6.3); ctx.fill(); ctx.fillStyle = "#020405"; ctx.beginPath(); ctx.ellipse(ex - k * r * .15, ey, r * .5, r * .62 * cl, 0, 0, 6.3); ctx.fill(); }
    if (o > 0) { // la gueule : un gouffre rouge sombre, deux rangées de dents qui sortent du noir
      const bouche = new Path2D(); bouche.moveTo(-W * .5, 0); bouche.bezierCurveTo(-W * .3, -h1 * 1.5, W * .3, -h1 * 1.5, W * .5, 0); bouche.bezierCurveTo(W * .32, h2 * 1.4, -W * .32, h2 * 1.4, -W * .5, 0);
      const g = ctx.createRadialGradient(0, h2 * .2, W * .02, 0, h2 * .2, W * .5); g.addColorStop(0, "rgba(78,8,14,.97)"); g.addColorStop(.45, "rgba(28,3,7,.98)"); g.addColorStop(1, "rgba(2,2,4,.98)"); ctx.fillStyle = g; ctx.fill(bouche);
      const bz = (p0, p1, p2, p3, u) => { const v = 1 - u; return v * v * v * p0 + 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u * p3; };
      // chaque dent sort du noir : sombre à la racine, ivoire à la pointe, éteinte sur les côtés
      const rang = (hh, dy, n, taille, clair) => { for (let k = 0; k < n; k++) { const u = (k + .5) / n, x = bz(-W * .5, -W * .3, W * .3, W * .5, u), y = bz(0, hh, hh, 0, u), c = Math.pow(1 - Math.abs(u - .5) * 2, .7), l = W * taille * (.35 + .65 * c), w = W / n * .46, v = clair * (.12 + .88 * c);
          const col = (m) => `rgb(${Math.round(10 + 226 * v * m)},${Math.round(10 + 222 * v * m)},${Math.round(12 + 204 * v * m)})`, gd = ctx.createLinearGradient(0, y, 0, y + l * dy); gd.addColorStop(0, col(.22)); gd.addColorStop(1, col(1));
          ctx.fillStyle = gd; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x + Math.sin(k * 2.3) * w * .2, y + l * dy); ctx.lineTo(x + w, y); ctx.closePath(); ctx.fill(); } };
      rang(-h1 * 1.5 * .75 + W * .05, 1, 20, .06, .3); rang(h2 * 1.4 * .75 - W * .05, -1, 18, .05, .3);
      rang(-h1 * 1.5 * .75, 1, 17, .1, 1); rang(h2 * 1.4 * .75, -1, 15, .085, 1);
      ctx.strokeStyle = "rgba(140,170,175,.1)"; ctx.lineWidth = W * .014; ctx.stroke(bouche); }
    ctx.restore(); };
  /* La potence du port : la Grande Blanche pendue par la queue, le record du port. */
  window.drawPotence = (x) => { const b = SURF - 26, trait = "rgba(14,20,28,.75)"; ctx.save(); ctx.translate(x, b); ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (const [c, l] of [[trait, 15], ["#7a5a36", 10]]) { ctx.strokeStyle = c; ctx.lineWidth = l; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -270); ctx.lineTo(150, -270); ctx.moveTo(0, -200); ctx.lineTo(60, -270); ctx.moveTo(-34, 0); ctx.lineTo(0, -60); ctx.stroke(); }
    ctx.strokeStyle = "#d8c9a0"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(120, -270); ctx.lineTo(120, -240); ctx.stroke();
    ctx.save(); ctx.translate(120, -122 + Math.sin(time * .8) * 1.5); ctx.rotate(Math.PI / 2 + Math.sin(time * .8) * .025); ctx.scale(1, -1); drawBlanche(215, 0, false); ctx.restore();
    ctx.strokeStyle = "#d8c9a0"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(120, -236, 8, 0, 6.3); ctx.stroke();
    // l'écriteau
    ctx.fillStyle = trait; ctx.fillRect(-150, -112, 124, 66); ctx.fillStyle = "#f3efe6"; ctx.fillRect(-147, -109, 118, 60); ctx.fillStyle = "#7a5a36"; ctx.fillRect(-92, -49, 8, 49);
    ctx.fillStyle = "#16233f"; ctx.textAlign = "center"; ctx.font = "800 15px 'Barlow Semi Condensed'"; ctx.fillText("RECORD DU PORT", -88, -90); ctx.font = "700 13px 'Barlow Semi Condensed'"; ctx.fillText("Grand requin blanc", -88, -73); ctx.fillStyle = "#b3261e"; ctx.font = "800 15px 'Barlow Semi Condensed'"; ctx.fillText("5,80 m  Cap. Rustin", -88, -56); ctx.textAlign = "left";
    ctx.restore(); };
  const bg0 = drawBg, sh0 = drawShark; window.__mq = {};
  drawBg = function (...a) { bg0(...a); if (window.__mq.fond) window.__mq.fond(); };
  drawShark = function () { if (window.__mq.avant) window.__mq.avant(); sh0(); if (window.__mq.apres) window.__mq.apres(); };
  window.__say = say;
  window.__scenes = {
    potence: { fond() { drawPotence(P.x - 150); } },
    pres: { avant() { ctx.save(); ctx.translate(P.x + 440, P.y - 60); ctx.scale(-1, 1); ctx.rotate(-.06); ctx.save(); ctx.translate(325, 90); ctx.rotate(.5); drawMarteau({ t: time, bite: 0, mode: "" }, 97); ctx.restore(); drawBlanche(580, time, true); ctx.restore(); } },
        megaCorps: { fond() { megaPasse(P.x + 190, P.y + 25); } },
    megaNoir: { fond() { megaPasse(P.x + 190, P.y + 25); } } };
  /* Le mégalodon passe dans le fond : UN seul contour (aucune nageoire rapportée),
     une bête d'un autre âge : tête massive, mâchoire qui avance, dos crénelé, queue
     au lobe supérieur très long ; presque noir, seuls le dos, l'œil et les dents luisent. */
  function megaPasse(x, y) { const L = 1080; ctx.save();
    ctx.beginPath(); ctx.moveTo(x - 2000, -5000); ctx.lineTo(x + 2000, -5000); for (let k = x + 2000; k >= x - 2000; k -= 20) ctx.lineTo(k, floorY(k) - 6); ctx.closePath(); ctx.clip();
    ctx.translate(x, y + Math.sin(time * .5) * 12); ctx.scale(-L, L * 1.1); const m = new Path2D();
    m.moveTo(.5, -.03); m.bezierCurveTo(.46, -.12, .38, -.19, .28, -.22); m.bezierCurveTo(.22, -.235, .17, -.24, .13, -.245);
    m.quadraticCurveTo(.06, -.36, -.03, -.47); m.quadraticCurveTo(-.05, -.33, -.13, -.225);
    for (let k = 0; k < 5; k++) { m.lineTo(-.142 - k * .03, -.243 + k * .013); m.lineTo(-.16 - k * .03, -.212 + k * .013); }
    m.lineTo(-.3, -.15); m.lineTo(-.335, -.2); m.lineTo(-.36, -.12); m.bezierCurveTo(-.4, -.09, -.44, -.06, -.47, -.05);
    m.quadraticCurveTo(-.58, -.16, -.74, -.42); m.quadraticCurveTo(-.64, -.12, -.6, -.02); m.quadraticCurveTo(-.62, .1, -.68, .22); m.quadraticCurveTo(-.56, .1, -.47, .05);
    m.bezierCurveTo(-.42, .07, -.38, .1, -.35, .12); m.lineTo(-.385, .19); m.lineTo(-.31, .14); m.bezierCurveTo(-.26, .17, -.22, .2, -.2, .21); m.lineTo(-.245, .3); m.lineTo(-.13, .24);
    m.bezierCurveTo(-.05, .27, .04, .27, .1, .25); m.quadraticCurveTo(.02, .4, -.1, .52); m.quadraticCurveTo(.12, .4, .22, .21);
    m.bezierCurveTo(.3, .2, .38, .17, .43, .13); m.lineTo(.485, .085); m.lineTo(.34, .07); m.lineTo(.495, .02); m.quadraticCurveTo(.505, -.005, .5, -.03); m.closePath();
    // le liseré d'abord, la masse par-dessus : il ne reste que le bord extérieur, et seulement le dos
    ctx.save(); ctx.beginPath(); ctx.rect(-1, -1, 2, 1.02); ctx.clip(); ctx.strokeStyle = "rgba(120,165,185,.42)"; ctx.lineWidth = .006; ctx.lineJoin = "round"; ctx.stroke(m); ctx.restore();
    ctx.fillStyle = "rgb(2,5,10)"; ctx.globalAlpha = .86; ctx.fill(m); ctx.globalAlpha = 1;
    // les dents : grandes, inégales, dans une gueule qui ne ferme pas tout à fait
    ctx.fillStyle = "rgba(205,210,198,.5)";
    for (let k = 0; k < 9; k++) { const u = k / 9, xx = .488 - u * .14, yy = .022 + u * .046, h = .03 * (1 - u * .6) * (k % 3 === 1 ? .6 : 1); ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx - .007, yy + h); ctx.lineTo(xx - .014, yy + .004); ctx.fill(); }
    for (let k = 0; k < 8; k++) { const u = k / 8, xx = .478 - u * .13, yy = .084 - u * .014, h = .026 * (1 - u * .6) * (k % 3 === 2 ? .6 : 1); ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx - .007, yy - h); ctx.lineTo(xx - .014, yy - .001); ctx.fill(); }
    // l'œil, petit et enfoncé sous une arcade ; les fentes des branchies ; de vieilles cicatrices
    ctx.fillStyle = "rgba(200,235,225,.6)"; ctx.beginPath(); ctx.arc(.385, -.075, .007, 0, 6.3); ctx.fill(); ctx.fillStyle = "rgba(1,2,4,.95)"; ctx.beginPath(); ctx.arc(.386, -.075, .0035, 0, 6.3); ctx.fill();
    ctx.strokeStyle = "rgba(120,165,185,.3)"; ctx.lineWidth = .004; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(.41, -.1); ctx.quadraticCurveTo(.385, -.105, .36, -.085); ctx.stroke();
    ctx.strokeStyle = "rgba(120,150,160,.13)"; ctx.lineWidth = .003; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(.26 - k * .022, -.08); ctx.quadraticCurveTo(.245 - k * .022, 0, .26 - k * .022, .08); ctx.stroke(); }
    ctx.strokeStyle = "rgba(150,175,185,.12)"; for (const [sx, sy, a] of [[.1, -.12, .5], [.08, -.1, .5], [-.2, -.05, -.4], [.3, .02, .9], [-.36, -.02, .3]]) { ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - .07 * Math.cos(a), sy + .07 * Math.sin(a)); ctx.stroke(); }
    ctx.restore(); }
}).toString().replace(/^\(\) => \{/, "").replace(/\}$/, "");
await p.route("**/toto/", async (r) => { const rep = await r.fetch(); const html = await rep.text(); if (!html.includes("window.__essais={")) throw new Error("point d'injection introuvable");
  await r.fulfill({ response: rep, body: html.replace("window.__essais={", MAQUETTE + ";window.__essais={") }); });
await p.addInitScript(() => localStorage.setItem("toto-aide", "1"));
await p.goto(srv.base + "toto/"); await p.click("#bNew"); await p.waitForTimeout(400);
const scene = async (nom, lvl, x, y, mq, texte) => {
  await p.evaluate(([lvl, x, y, mq, texte]) => { const E = window.__essais, P = E.P; clearInterval(window.__t); P.lvl = lvl; P.gates = { g1: 1, g2: 1, g3: 1 }; for (const g of E.GATES) g.hp = 0; P.bosses = { b0: 1, b1: 1, b2: 1, b3: 1 };
    const yy = y; window.__mq = window.__scenes[mq];
    window.__t = setInterval(() => { P.x = x; P.y = yy; P.vx = .6; P.vy = 0; P.dang = 0; P.face = 1; P.hp = 1e5; P.hunger = 100; P.inv = 0; for (const e of E.ents) if (e.boss || Math.hypot(e.x - x, e.y - yy) < 520) e.dead = true; }, 4);
    if (texte) setTimeout(() => window.__say(texte, 9), 700); else document.getElementById("narr").style.opacity = 0; }, [lvl, x, y, mq, texte]);
  await p.waitForTimeout(2200); await p.screenshot({ path: path.join(HERE, "captures", `toto-maquette-${nom}.png`) }); console.log("capture", nom);
};
await scene("1-blanche-au-port", 8, 5120, 372, "potence", "Le record du port. Ils ont posé pour la photo. Elle retient les visages.");
await scene("2-blanche-vivante", 12, 7300, 1450, "pres", "La Grande Blanche. Elle ne chasse pas : elle se sert.");
await scene("3-megalodon-golfe", 17, 10400, 2150, "megaCorps", "");
await scene("4-megalodon-abysses", 17, 11250, 2850, "megaNoir", "Le fond du golfe vient de bouger.");
if (erreurs.length) console.log("ERREURS :", [...new Set(erreurs)].join(" | "));
await nav.close(); srv.arreter();
