import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* La Bataille en portrait, jouée pour de vrai sur un écran de Pixel 9 (360 × 732)
   puis sur un petit écran (360 × 640, animations réduites) : une année entière,
   mois après mois. Ce que le banc refuse : une erreur de page, un texte sous
   14 px, une cible sous 44 px, moins de 24 px avant l'action, une carte perdue en
   route (toujours 32), un texte trop peu contrasté sur le verre (mesuré sur les
   PIXELS), une partie qui ne se reprend pas. Captures : captures/bataille-jeu-*.png. */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.join(ICI, "captures");
fs.mkdirSync(SORTIE, { recursive: true });
const srv = await servir();
const navigateur = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const echecs = [];
const verifie = (nom, ok, detail) => { if (!ok) echecs.push(nom + (detail !== undefined ? " : " + detail : "")); };
const etat = (p) => p.evaluate(() => window.__essais.etat());
const J0 = 158;

async function toucheCarte(p, u, e) {
  const r = await p.evaluate(() => { const b = document.getElementById("jeu").getBoundingClientRect(); return { l: b.left, t: b.top, w: b.width, h: b.height }; });
  await p.mouse.click(r.l + (u.x / 360) * r.w, r.t + ((u.y - 30 - J0) / (e.T1 - J0)) * r.h);
}
async function mesures(p, nom) {
  const m = await p.evaluate(() => {
    const vu = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest("[hidden]") && getComputedStyle(el).visibility !== "hidden"; };
    const cadre = document.getElementById("cadre");
    const dessus = [...cadre.querySelectorAll(".voile")].find(vu) || cadre;
    const petits = [...dessus.querySelectorAll("*")].filter((el) => vu(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
      .map((el) => [el.id || el.className, parseFloat(getComputedStyle(el).fontSize) * (cadre.getBoundingClientRect().width / 360)]).filter((x) => x[1] < 13.99);
    const cibles = [...dessus.querySelectorAll("button")].filter(vu).map((b) => { const r = b.getBoundingClientRect(); return [b.id || b.className, Math.round(r.width), Math.round(r.height), Math.round(r.bottom)]; });
    const main = document.getElementById("main").getBoundingClientRect(), go = document.getElementById("goBtn");
    return { petits, cibles, ecart: vu(go) && dessus === cadre ? go.getBoundingClientRect().top - main.bottom : null, haut: innerHeight, large: document.documentElement.scrollWidth };
  });
  verifie(nom + " : aucun texte sous 14 px", m.petits.length === 0, JSON.stringify(m.petits));
  for (const c of m.cibles) { verifie(nom + " : cible " + c[0] + " d'au moins 44 px", c[1] >= 44 && c[2] >= 44, c[1] + "×" + c[2]); verifie(nom + " : " + c[0] + " dans l'écran", c[3] <= m.haut, c[3] + " > " + m.haut); }
  if (m.ecart !== null) verifie(nom + " : 24 px avant l'action", m.ecart >= 23.5, m.ecart);
  verifie(nom + " : pas de défilement horizontal", m.large <= 361, m.large);
}
/* Contraste d'un texte posé sur du verre : on photographie l'élément avec puis
   sans son texte, et on compare le plus clair des deux images. */
async function contrasteVerre(p, selecteur, nom) {
  const el = p.locator(selecteur).first();
  const avec = (await el.screenshot()).toString("base64");
  await el.evaluate((e) => { e.style.setProperty("-webkit-text-fill-color", "transparent"); e.querySelectorAll("svg, .barre").forEach((s) => (s.style.visibility = "hidden")); });
  const sans = (await el.screenshot()).toString("base64");
  await el.evaluate((e) => { e.style.removeProperty("-webkit-text-fill-color"); e.querySelectorAll("svg, .barre").forEach((s) => (s.style.visibility = "")); });
  const r = await p.evaluate(async ([a, b]) => {
    const lum = async (src) => { const i = new Image(); i.src = "data:image/png;base64," + src; await i.decode(); const c = document.createElement("canvas"); c.width = i.width; c.height = i.height; const x = c.getContext("2d"); x.drawImage(i, 0, 0);
      /* On écarte le bord : son reflet clair suit l'arrondi (une pastille est ronde sur toute sa hauteur) et aucun texte ne s'y pose. */
      const m = Math.round(Math.min(i.width, i.height) * 0.15), mx = i.width > 3 * i.height ? Math.round(i.height / 2) : m, d = x.getImageData(mx, m, i.width - 2 * mx, i.height - 2 * m).data; let max = 0;
      for (let k = 0; k < d.length; k += 4) { const v = [d[k], d[k + 1], d[k + 2]].map((n) => { n /= 255; return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4; }); max = Math.max(max, 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]); } return max; };
    const t = await lum(a), f = await lum(b); return [(t + 0.05) / (f + 0.05), t, f];
  }, [avec, sans]);
  verifie(nom + " : texte lisible sur le verre (4,5:1)", r[0] >= 4.5, r[0].toFixed(2) + " (texte " + r[1].toFixed(3) + ", fond " + r[2].toFixed(3) + ")");
  return r;
}
async function jusquAuResultat(p, nom) {
  await p.evaluate(() => window.__essais.vitesse(12));
  await p.waitForFunction(() => window.__essais.etat().phase === "result", null, { timeout: 60000 });
  const e = await etat(p);
  verifie(nom + " : 32 cartes en tout", e.moi + e.lui === 32, e.moi + " + " + e.lui);
  return e;
}

for (const [suffixe, hauteur, calme] of [["", 732, false], ["-petit", 640, true]]) {
  const ctx = await navigateur.newContext({ viewport: { width: 360, height: hauteur }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, reducedMotion: calme ? "reduce" : "no-preference" });
  const p = await ctx.newPage();
  const erreurs = [];
  p.on("pageerror", (e) => erreurs.push(String(e)));
  await p.goto(srv.base + "bataille/", { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(SORTIE, "bataille-jeu-titre" + suffixe + ".png") });
  await mesures(p, "titre" + suffixe);
  /* Installer : le bouton est là tant que le jeu n'est pas installé. Sans invitation
     du navigateur il dit où est la commande ; avec, il la déclenche. */
  verifie("titre" + suffixe + " : le bouton Installer est visible", await p.isVisible("#instBtn"));
  await p.click("#instBtn");
  verifie("titre" + suffixe + " : sans invitation, le bouton dit où installer", (await p.isVisible("#instAide")) && (await p.textContent("#instAide")).includes("écran d\u2019accueil"));
  await p.screenshot({ path: path.join(SORTIE, "bataille-jeu-installer" + suffixe + ".png") });
  await mesures(p, "titre avec aide" + suffixe);
  await p.click("#instBtn");
  const invite = await p.evaluate(async () => { const e = new Event("beforeinstallprompt", { cancelable: true }); window.__invite = 0; e.prompt = () => { window.__invite++; }; e.userChoice = Promise.resolve({ outcome: "dismissed" });
    window.dispatchEvent(e); document.getElementById("instBtn").click(); await 0; return [window.__invite, e.defaultPrevented]; });
  verifie("titre" + suffixe + " : avec invitation, le bouton la déclenche", invite[0] === 1 && invite[1] === true, invite.join());
  await p.click("#startBtn");
  await p.evaluate(() => { window.__essais.mois("lion"); window.__essais.donne(["tour", "temperance", "etoile"]); });
  await p.waitForTimeout(300);
  let e = await etat(p);
  verifie("placement" + suffixe + " : cinq cartes de chaque côté", e.unites.length === 10);
  const bas = Math.max(...e.unites.filter((u) => u.side > 0).map((u) => u.y));
  verifie("placement" + suffixe + " : mes cartes tiennent sur le tapis", bas + 16 <= e.T1, bas + " / " + e.T1);

  /* échanger deux cartes */
  const [a, b] = [0, 1].map((l) => e.unites.find((u) => u.side > 0 && u.lane === l));
  await toucheCarte(p, a, e);
  await p.waitForTimeout(150);
  await p.screenshot({ path: path.join(SORTIE, "bataille-jeu-placement" + suffixe + ".png") });
  await mesures(p, "placement" + suffixe);
  await toucheCarte(p, b, e);
  await p.waitForTimeout(400);
  let e2 = await etat(p);
  const en = (l) => { const u = e2.unites.find((x) => x.side > 0 && x.lane === l); return u.r + u.s; };
  verifie("placement" + suffixe + " : deux cartes touchées s'échangent", en(0) === b.r + b.s && en(1) === a.r + a.s, en(0) + " " + en(1));
  /* la fiche des arcanes : par le « i », ou en touchant un arcane endormi */
  verifie("placement" + suffixe + " : le « i » est là avant le combat", await p.isVisible("#infoBtn"));
  await p.click("#infoBtn");
  const fiche = await p.textContent("#fiche");
  verifie("placement" + suffixe + " : la fiche explique mes trois arcanes", (await p.isVisible("#fiche")) && ["La Tour", "La foudre frappe", "Tempérance", "Soigne toutes tes cartes", "L\u2019Étoile", "Le bon moment"].every((t) => fiche.includes(t)), fiche.slice(0, 80));
  await p.screenshot({ path: path.join(SORTIE, "bataille-jeu-fiche" + suffixe + ".png") });
  await mesures(p, "fiche" + suffixe);
  const dans = await p.evaluate(() => { const f = document.querySelector(".feuille").getBoundingClientRect(); return f.top >= 0 && f.bottom <= innerHeight; });
  verifie("fiche" + suffixe + " : elle tient dans l'écran", dans);
  await p.click("#ficheOk");
  verifie("placement" + suffixe + " : « Compris » referme la fiche", !(await p.isVisible("#fiche")));
  await p.click("#main .arcane >> nth=0");
  verifie("placement" + suffixe + " : toucher un arcane endormi ouvre la fiche", await p.isVisible("#fiche"));
  await p.click("#ficheOk");
  if (!suffixe) await contrasteVerre(p, "#main .arcane", "arcane endormi");

  /* combat */
  await p.click("#goBtn");
  await p.waitForFunction(() => window.__essais.etat().phase === "fight");
  await p.waitForTimeout(1900);
  if (!suffixe) {
    const ips = await p.evaluate(() => new Promise((ok) => { let n = 0; const t0 = performance.now(); const f = (t) => { n++; t - t0 < 4000 ? requestAnimationFrame(f) : ok((n * 1000) / (t - t0)); }; requestAnimationFrame(f); }));
    console.log("images/s en combat (avec carte graphique) : " + ips.toFixed(0));
    verifie("combat : au moins 50 images/s", ips >= 50, ips.toFixed(0));
    await contrasteVerre(p, "#main .arcane", "arcane prêt");
    /* une annonce recouvre le compte le temps de se lire : on attend qu’elle parte */
    await p.waitForFunction(() => !document.getElementById("ruban").classList.contains("vu"), null, { timeout: 15000 });
    await p.waitForTimeout(300);
    await contrasteVerre(p, ".compte", "compte");
  }
  await p.click("#main button >> nth=0");
  await p.waitForTimeout(250);
  await p.screenshot({ path: path.join(SORTIE, "bataille-jeu-combat" + suffixe + ".png") });
  await mesures(p, "combat" + suffixe);
  e2 = await etat(p);
  verifie("combat" + suffixe + " : l'arcane lancé quitte la main", e2.arcanes.length === 2, e2.arcanes.join());
  verifie("combat" + suffixe + " : le ruban dit ce que l'arcane a fait", /^La Tour foudroie le (7|8|9|10|V|D|R|A)[♠♥♦♣]$/.test(await p.textContent("#ruban")), await p.textContent("#ruban"));
  verifie("combat" + suffixe + " : le « i » s'efface pendant le combat", !(await p.isVisible("#infoBtn")));
  await p.click("#v2");
  verifie("combat" + suffixe + " : la vitesse choisie se voit", (await p.getAttribute("#v2", "aria-pressed")) === "true" && (await p.getAttribute("#v1", "aria-pressed")) === "false");

  /* fin du mois, puis toute l'année */
  await jusquAuResultat(p, "mois 1" + suffixe);
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(SORTIE, "bataille-jeu-fin-mois" + suffixe + ".png") });
  await mesures(p, "fin de mois" + suffixe);
  if (!suffixe) await contrasteVerre(p, "#page", "page de fin de mois");
  verifie("fin de mois" + suffixe + " : la page annonce le mois", /^Août /.test(await p.textContent("#pageT")));

  /* reprise : on recharge au début du mois 2 */
  await p.click("#goBtn");
  e = await etat(p);
  await p.reload({ waitUntil: "load" });
  verifie("reprise" + suffixe + " : le titre propose de reprendre", (await p.textContent("#startBtn")).startsWith("Reprendre · mois " + e.round), await p.textContent("#startBtn"));
  await p.click("#startBtn");
  e2 = await etat(p);
  const cartes = (x) => x.unites.filter((u) => u.side > 0).map((u) => u.r + u.s).sort().join();
  verifie("reprise" + suffixe + " : même mois, mêmes cartes", e2.round === e.round && e2.mois === e.mois && cartes(e2) === cartes(e) && e2.moi === e.moi, e2.round + " " + e2.mois);

  /* les douze ciels sont de vraies figures : assez d'étoiles, toutes dans le cadre */
  const ciel = await p.evaluate(() => window.__essais.ciel());
  verifie("ciel" + suffixe + " : douze constellations", Object.keys(ciel).length === 12);
  for (const [id, f] of Object.entries(ciel)) verifie("ciel" + suffixe + " : " + id + " tient dans son cadre", f.st.length >= 4 && f.ln.length >= 3 && f.st.every((s) => s[0] >= 0 && s[0] <= 1 && s[1] >= 0 && s[1] <= 1) && f.ln.every((l) => l[0] < f.st.length && l[1] < f.st.length), f.st.length);
  let garde = 0, fini = false;
  const vus = [];
  while (!fini && garde++ < 14) {
    vus.push((await etat(p)).mois);
    await p.click("#goBtn");
    await jusquAuResultat(p, "mois " + (garde + 1) + suffixe + " (" + vus[vus.length - 1] + ")");
    await p.click("#goBtn");
    fini = await p.isVisible("#end");
  }
  console.log("mois joués" + suffixe + " : août, " + vus.join(", "));
  verifie("année" + suffixe + " : la partie se termine", fini);
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(SORTIE, "bataille-jeu-fin" + suffixe + ".png") });
  await mesures(p, "fin" + suffixe);
  verifie("fin" + suffixe + " : la partie finie ne se reprend pas", (await p.evaluate(() => localStorage.getItem("bataille-partie"))) === null);
  await p.click("#againBtn");
  e = await etat(p);
  verifie("rejouer" + suffixe + " : une nouvelle année commence", e.round === 1 && e.phase === "place" && e.moi + e.lui + e.unites.length === 32);
  verifie("aucune erreur de page" + suffixe, erreurs.length === 0, erreurs.join(" | "));
  await ctx.close();
}
await navigateur.close();
srv.arreter();
console.log(echecs.length ? "ÉCHEC\n" + echecs.join("\n") : "bataille-ui : tout passe");
process.exit(echecs.length ? 1 : 0);
