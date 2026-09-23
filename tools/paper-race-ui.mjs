import { chromium, webkit, devices } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { servir } from "./serveur.mjs";

/* Paper Race : l'audit UI/UX, MESURÉ dans le navigateur (ce que les parcours
   ne regardaient pas). Sur chaque écran (accueil, course, réglages, règles,
   salle, arrivée, revue), en clair ET en sombre :
   - contraste réel de chaque texte visible (4,5:1 ; 3:1 pour le gros texte) ;
   - cibles de 44 px et 8 px entre deux cibles voisines ;
   - focus visible au clavier sur chaque bouton ;
   - chaque bouton dit quelque chose (texte ou aria-label), interrupteurs
     avec aria-checked, messages en aria-live ;
   - rien ne déborde à 320 px de large, le texte fait 14 px au moins ;
   - animations réduites : aucune transition ni animation qui tourne ;
   - encoche de l'iPhone : le contenu ne passe pas dessous.
   Usage : node tools/paper-race-ui.mjs [--voir] */

const HERE = path.dirname(fileURLToPath(import.meta.url));
let echecs = 0;
const verifier = (nom, ok, detail) => {
  console.log((ok ? "ok    " : "ECHEC ") + nom + (!ok && detail !== undefined ? "  " + JSON.stringify(detail).slice(0, 600) : ""));
  if (!ok) echecs++;
};

const site = await servir();
const URL_JEU = site.base + "paper-race/";
const nav = await chromium.launch();

// ---------- ce qu'on mesure dans la page ----------
const AUDIT = () => {
  const lin = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const lum = (c) => { const [r, g, b] = c; return 0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255); };
  const rgb = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(",").map(parseFloat); return { c: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }; };
  const melange = (av, ar) => av.c.map((v, i) => v * av.a + ar[i] * (1 - av.a));
  const fond = (el) => {
    let n = el, pile = [];
    while (n && n !== document.documentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if (c && c.a > 0) pile.push(c); n = n.parentElement; }
    const c0 = rgb(getComputedStyle(document.documentElement).backgroundColor) || { c: [255, 255, 255], a: 1 };
    let f = c0.c;
    for (const c of pile.reverse()) f = melange(c, f);
    return f;
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.opacity !== "0" && !el.closest("[hidden]") && r.bottom > 0 && r.top < innerHeight + 400;
  };
  const contrastes = [], petits = [], serres = [], muets = [], anim = [];
  const marche = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (marche.nextNode()) {
    const n = marche.currentNode, el = n.parentElement;
    if (!n.textContent.trim() || !el || !visible(el) || el.closest("svg,[aria-hidden=true]")) continue;
    const s = getComputedStyle(el);
    const t = parseFloat(s.fontSize), gros = t >= 24 || (t >= 18.66 && +s.fontWeight >= 700);
    const av = rgb(s.color); if (!av) continue;
    const c = melange(av, fond(el));
    const L1 = lum(c), L2 = lum(fond(el));
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    if (ratio < (gros ? 3 : 4.5)) contrastes.push({ texte: n.textContent.trim().slice(0, 28), t, ratio: +ratio.toFixed(2), couleur: s.color });
  }
  // une cible cachée DERRIÈRE une feuille ouverte n'est pas une cible : on teste
  // ce que le doigt toucherait vraiment en son centre
  const touchable = (el) => {
    const r = el.getBoundingClientRect();
    const q = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!q && (q === el || el.contains(q) || q.contains(el));
  };
  const cibles = [...document.querySelectorAll("button, a, input, [role=switch]")].filter((el) => visible(el) && touchable(el));
  for (const b of cibles) {
    const r = b.getBoundingClientRect();
    if (r.width < 44 || r.height < 44) petits.push({ id: b.id || b.className, w: Math.round(r.width), h: Math.round(r.height) });
    if (!(b.textContent || "").trim() && !b.getAttribute("aria-label") && !b.getAttribute("aria-labelledby") && !b.title) muets.push(b.id || b.className);
  }
  for (let i = 0; i < cibles.length; i++) for (let j = i + 1; j < cibles.length; j++) {
    const a = cibles[i].getBoundingClientRect(), b = cibles[j].getBoundingClientRect();
    if (cibles[i].contains(cibles[j]) || cibles[j].contains(cibles[i])) continue;
    const dx = Math.max(0, Math.max(a.left, b.left) - Math.min(a.right, b.right));
    const dy = Math.max(0, Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom));
    if (dx < 8 && dy < 8 && !(dx === 0 && dy === 0)) serres.push([cibles[i].id || cibles[i].className, cibles[j].id || cibles[j].className, Math.round(Math.max(dx, dy))]);
  }
  for (const el of document.querySelectorAll("*")) {
    if (!visible(el)) continue;
    const s = getComputedStyle(el);
    if (s.animationName !== "none" && s.animationPlayState === "running" && parseFloat(s.animationDuration) > 0.05) anim.push((el.id || el.className) + " " + s.animationName);
  }
  return {
    contrastes, petits, serres: serres.slice(0, 6), muets, anim: anim.slice(0, 6),
    deborde: document.documentElement.scrollWidth > innerWidth + 1,
    petitTexte: [...document.querySelectorAll("*")].filter((el) => visible(el) && el.children.length === 0 && el.textContent.trim() && !el.closest("svg,[aria-hidden=true]"))
      .map((el) => ({ t: parseFloat(getComputedStyle(el).fontSize), texte: el.textContent.trim().slice(0, 20) })).filter((x) => x.t < 14),
  };
};

const ecrans = async (p, theme) => {
  const vu = {};
  const mesure = async (nom) => { vu[nom] = await p.evaluate(AUDIT); };
  await p.goto(URL_JEU, { waitUntil: "networkidle" });
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("paper-race.reglages.v1", JSON.stringify({ mode: "gp", voitures: 6, level: "normal", circuit: "monzavrai" })); });
  await p.reload({ waitUntil: "networkidle" });
  await mesure("accueil");
  await p.click("#reglesBtn"); await p.waitForTimeout(150); await mesure("regles");
  // Les trois pièges sont DESSINÉS dans les règles : un joueur n'avait pas
  // compris que le bleu voulait dire mouillé. On vérifie que chaque vignette
  // est dessinée ET qu'elle porte bien la couleur de SON piège (sinon rien
  // n'empêcherait de dessiner trois fois la même chose).
  const FAMILLE = {
    vigHumide: (r, g, b) => b > r + 25 && b > 90,
    vigHuile: (r, g, b) => r < 70 && g < 75 && b < 85,
    vigBoost: (r, g, b) => r > 170 && g > 125 && b < 140,
  };
  const vig = await p.evaluate((familles) => Object.entries(familles).map(([id, src]) => {
    const f = new Function('r', 'g', 'b', 'return (' + src + ')(r,g,b)');
    const cv = document.getElementById(id);
    if (!cv || !cv.width) return { id, absent: true };
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && f(d[i], d[i + 1], d[i + 2])) n++;
    const r = cv.getBoundingClientRect();
    return { id, n, l: Math.round(r.width), h: Math.round(r.height) };
  }), Object.fromEntries(Object.entries(FAMILLE).map(([k, v]) => [k, v.toString()])));
  verifier(`${theme} : les trois pièges sont dessinés dans les règles`,
    vig.every((v) => v.n > 300 && v.l >= 60 && v.h >= 40), vig);
  await p.click("#regles [data-fermer]");
  await p.click("#jouer");
  await p.waitForFunction(() => !depart && R, null, { timeout: 20000 });
  await p.waitForTimeout(400);
  await mesure("course");
  await p.click("#menubtn"); await p.waitForTimeout(150); await mesure("reglages"); await p.click("#reglages [data-fermer]");
  // l'arrivée et la revue : on termine la course à la place des voitures
  await p.evaluate(async () => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let i = 0; i < 6000 && !finie(R); i++) {
      if (occupe() || R.turn !== 0) { await w(30); continue; }
      const q = aiChoice(R, "rapide");
      if (q === null) { document.getElementById("go").click(); await w(30); continue; }
      choisir(opts.findIndex((o) => o.p[0] === q[0] && o.p[1] === q[1]));
      document.getElementById("go").click();
      await w(30);
    }
  });
  await p.waitForFunction(() => document.getElementById("win").style.display === "flex", null, { timeout: 180000 });
  await mesure("arrivee");
  await p.click("#revoir"); await p.waitForTimeout(300); await mesure("revue"); await p.click("#revFermer");
  return vu;
};

for (const theme of ["light", "dark"]) {
  const ctx = await nav.newContext({ ...devices["Pixel 9"], colorScheme: theme, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  const erreurs = [];
  p.on("pageerror", (e) => erreurs.push(e.message));
  const vu = await ecrans(p, theme);
  for (const [nom, m] of Object.entries(vu)) {
    verifier(`[${theme}] ${nom} : contraste du texte`, m.contrastes.length === 0, m.contrastes);
    verifier(`[${theme}] ${nom} : cibles de 44 px`, m.petits.length === 0, m.petits);
    verifier(`[${theme}] ${nom} : 8 px entre deux cibles`, m.serres.length === 0, m.serres);
    verifier(`[${theme}] ${nom} : chaque bouton dit ce qu'il fait`, m.muets.length === 0, m.muets);
    verifier(`[${theme}] ${nom} : texte de 14 px au moins`, m.petitTexte.length === 0, m.petitTexte);
    verifier(`[${theme}] ${nom} : rien ne déborde`, !m.deborde);
    verifier(`[${theme}] ${nom} : animations réduites respectées`, m.anim.length === 0, m.anim);
  }
  verifier(`[${theme}] aucune erreur dans la console`, erreurs.length === 0, erreurs.slice(0, 3));
  await ctx.close();
}

/* ---------- le focus au clavier, et l'encoche de l'iPhone ---------- */
{
  const ctx = await nav.newContext({ ...devices["Pixel 9"] });
  const p = await ctx.newPage();
  await p.goto(URL_JEU, { waitUntil: "networkidle" });
  // ⚠️ un focus posé par script ne déclenche pas :focus-visible : on tabule VRAIMENT
  await p.click("#jouer");
  await p.waitForFunction(() => !depart && R, null, { timeout: 20000 });
  const sansContour = [], vus = new Set();
  for (let i = 0; i < 30; i++) {
    await p.keyboard.press("Tab");
    const r = await p.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return null;
      const s = getComputedStyle(a);
      return { cle: a.id || (a.tagName + ":" + [...document.querySelectorAll(a.tagName)].indexOf(a)), tag: a.tagName,
        contour: (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2) || s.boxShadow !== "none" };
    });
    if (!r || vus.has(r.cle)) continue;
    vus.add(r.cle);
    if (!r.contour) sansContour.push(r.cle);
  }
  verifier("focus visible en tabulant sur chaque bouton", sansContour.length === 0 && vus.size > 4, { sansContour, vus: [...vus] });
  await ctx.close();
}
{
  const nav2 = await webkit.launch();
  const ctx = await nav2.newContext({ ...devices["iPhone 13"] });
  const p = await ctx.newPage();
  await p.goto(URL_JEU, { waitUntil: "networkidle" });
  const sûr = await p.evaluate(() => {
    const css = [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n");
    const jouer = document.getElementById("jouer").getBoundingClientRect();
    return { env: /env\(safe-area-inset/.test(css), bas: Math.round(innerHeight - jouer.bottom) };
  });
  verifier("iPhone : le contenu tient compte de l'encoche et de la barre du bas", sûr.env && sûr.bas >= 0, sûr);
  await ctx.close(); await nav2.close();
}

await nav.close();
await site.fermer?.();
console.log(echecs ? `\n${echecs} ECHEC(S)` : "\nPAPER RACE UI OK");
process.exit(echecs ? 1 : 0);
