import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Banc de l'écran de la Patrouille (le vrai jeu, patrouille/index.html) :
   aucune erreur, aucun texte sous 14 px, rien qui déborde, une mission jouée jusqu'au
   bilan, la sauvegarde et « Continuer » qui tiennent après rechargement.
   Captures dans docs/patrouille-t1-*.png, aux formats 360×732 et 360×640. */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.join(ICI, "..", "docs");
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const fautes = [];

async function verifierEcran(p, nom) {
  const r = await p.evaluate(() => {
    const vis = [...document.querySelectorAll('.ecran')].filter((e) => !e.hidden);
    const petits = [];
    for (const ec of vis) for (const el of ec.querySelectorAll('*')) {
      if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 14) petits.push(`${el.tagName}.${el.className} « ${el.textContent.trim().slice(0, 20)} » ${fs}px`);
    }
    const deborde = document.documentElement.scrollWidth > innerWidth + 1 || vis.some((e) => e.scrollWidth > e.clientWidth + 1);
    return { petits, deborde };
  });
  if (r.petits.length) fautes.push(`${nom} : textes sous 14 px : ${r.petits.join(' ; ')}`);
  if (r.deborde) fautes.push(`${nom} : débordement horizontal`);
}

for (const [w, h] of [[360, 732], [360, 640]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true });
  const erreurs = [];
  p.on("pageerror", (e) => erreurs.push(e.message));
  p.on("console", (m) => m.type() === "error" && erreurs.push(m.text()));
  await p.goto(srv.base + "patrouille/index.html?nc=" + Date.now());
  await p.evaluate(() => { try { localStorage.removeItem('patrouille:sauvegarde'); } catch {} });
  await p.reload(); await p.waitForTimeout(400);
  const tag = `${w}x${h}`;
  await verifierEcran(p, `carte ${tag}`);
  await p.screenshot({ path: path.join(DOCS, `patrouille-t1-carte-${tag}.png`) });
  const continuer0 = await p.textContent('#b-continuer');
  // Une mission jouée (invincible), capture en pleine action puis bilan
  await p.evaluate(() => { document.getElementById('o-invincible').click(); document.getElementById('b-continuer').click(); });
  await p.evaluate(() => { for (let k = 0; k < 47 * 60; k++) window.__patrouille.pasJeu(); });
  await p.waitForTimeout(150);
  await p.screenshot({ path: path.join(DOCS, `patrouille-t1-mission-${tag}.png`) });
  await p.evaluate(() => { for (let k = 0; k < 200 * 60 && window.__patrouille.partie; k++) window.__patrouille.pasJeu(); });
  await p.waitForTimeout(150);
  const bilanVu = await p.evaluate(() => !document.getElementById('bilan').hidden);
  if (!bilanVu) fautes.push(`${tag} : le bilan n'apparaît pas à la fin de la mission`);
  await verifierEcran(p, `bilan ${tag}`);
  await p.screenshot({ path: path.join(DOCS, `patrouille-t1-bilan-${tag}.png`) });
  // Retour à la carte, puis rechargement : la progression doit tenir
  await p.evaluate(() => document.getElementById('g-carte').click());
  await p.reload(); await p.waitForTimeout(400);
  const continuer1 = await p.textContent('#b-continuer');
  const j2 = await p.evaluate(() => !document.querySelectorAll('.planete')[3].querySelectorAll('.mission')[1].disabled);
  if (continuer1 === continuer0) fautes.push(`${tag} : « Continuer » n'a pas avancé après la mission (${continuer1})`);
  if (!j2) fautes.push(`${tag} : la mission 2 n'est pas ouverte après la mission 1`);
  await p.screenshot({ path: path.join(DOCS, `patrouille-t1-carte-apres-${tag}.png`) });
  // Le Hangar : acheter une amélioration, elle tient après rechargement
  await p.evaluate(() => document.getElementById('b-hangar').click());
  await verifierEcran(p, `hangar ${tag}`);
  await p.screenshot({ path: path.join(DOCS, `patrouille-t2-hangar-${tag}.png`) });
  const achat = await p.evaluate(() => { const b = document.querySelector('.acheter'); const ok = !b.disabled; b.click(); return ok; });
  await p.reload(); await p.waitForTimeout(300);
  const niveau = await p.evaluate(() => window.__patrouille.sauvegarde.hangar.avion.tir);
  if (achat && niveau !== 1) fautes.push(`${tag} : l'achat au Hangar n'a pas tenu (niveau ${niveau})`);
  if (!achat) fautes.push(`${tag} : rien d'achetable au Hangar après la mission 1`);
  // La mission secrète est sur la carte, cadenassée, avec ce qu'il faut faire
  const secret = await p.evaluate(() => { const b = document.querySelector('.secrete'); return b && { ferme: b.disabled, texte: b.textContent }; });
  if (!secret || !secret.ferme || !/copain/.test(secret.texte)) fautes.push(`${tag} : la mission secrète n'est pas annoncée sur la carte (${JSON.stringify(secret)})`);
  // La mission du boss : alerte, Caméléon, barre de vie (capture)
  await p.evaluate(() => { window.__patrouille.lancer('jboss'); for (let k = 0; k < 95 * 60; k++) window.__patrouille.pasJeu(); });
  await p.waitForTimeout(150);
  await p.screenshot({ path: path.join(DOCS, `patrouille-t2-boss-${tag}.png`) });
  console.log(`${tag} : « ${continuer0} » → « ${continuer1} »`);
  if (erreurs.length) fautes.push(`${tag} : erreurs de page : ${erreurs.join(' | ')}`);
  await p.close();
}
await nav.close();
srv.arreter();
if (fautes.length) { console.log("✗ " + fautes.join("\n✗ ")); process.exit(1); }
console.log("✓ écran vérifié (carte, mission, bilan, Hangar, mission secrète, boss)");
