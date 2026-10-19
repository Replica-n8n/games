import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* Banc de la POC 2 : un robot joue les missions du Jardin dans l'ordre de la carte
   (m1, m2 en sauvant le copain, la mission secrète, m3 et son boss), puis la page
   est rechargée pour vérifier la sauvegarde et « Continuer ».
   Captures dans docs/patrouille-poc2-*.png. Échoue sur une erreur de page. */
const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.join(ICI, "..", "docs");
const invincible = process.argv.includes("--invincible");
const srv = await servir();
const nav = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const p = await nav.newPage({ viewport: { width: 400, height: 760 }, deviceScaleFactor: 2 });
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
await p.goto(srv.base + "patrouille/poc2.html?nc=" + Date.now());
await p.evaluate(() => { try { localStorage.removeItem('patrouille-poc2'); } catch (e) {} });
await p.reload();
await p.waitForTimeout(300);
if (invincible) await p.evaluate(() => { document.getElementById('o-invincible').checked = true; document.getElementById('o-invincible').dispatchEvent(new Event('change')); });

// Robot : priorité aux poursuivants du copain, puis cadeaux et caisse, puis cages, puis l'ennemi le plus bas ;
// il esquive les tirs rouges proches et va chercher les bleus tout près.
const robot = `(() => {
  const P = window.__poc, S = P.S, j = S.j;
  let cible = S.boss ? S.boss.x : null, basY = -1;
  for (const e of S.ennemis) if (e.y > basY && e.y < j.y - 40 && e.y > 0) { basY = e.y; cible = e.x; }
  const cage = S.ennemis.find((e) => e.type === 'cage' && e.y > 0 && e.y < j.y - 60); if (cage) cible = cage.x;
  const ch = S.ennemis.find((e) => e.type === 'chasseur' && e.y < j.y - 30 && e.y > 0); if (ch) cible = ch.x;
  for (const o of S.objets) if (o.k !== 'bouton' && o.y > 0) cible = o.x;
  let dx = 0, dy = 0;
  for (const b of S.tirsE) {
    const d = Math.hypot(b.x - j.x, b.y - j.y);
    if (!b.bleu && d < 60) dx += (j.x - b.x) / (d * d) * 900;
    if (b.bleu && d < 50) dx += (b.x - j.x) * 0.3;
  }
  j.cx = Math.max(16, Math.min(344, (cible ?? 180) + dx));
  const caisse = S.objets.find((o) => o.k !== 'bouton');
  j.cy = caisse && caisse.y > j.y - 200 ? Math.max(80, Math.min(540, caisse.y)) : 510;
  if (S.jauge >= 100 && (S.boss || S.ennemis.length > 6)) document.getElementById('superb').click();
})()`;

const vis = (id) => p.evaluate((i) => !document.getElementById(i).classList.contains('cache'), id);
async function capture(nom) { await p.screenshot({ path: path.join(DOCS, `patrouille-poc2-${nom}.png`) }); }

async function joue(id) {
  await p.evaluate((i) => window.__poc.lancer(i), id);
  const j = { id, morts: 0, fin: null, vu: {} };
  for (let pasN = 0; pasN < 420 * 60; pasN += 30) {
    const e = await p.evaluate(({ code }) => {
      const P = window.__poc;
      for (let k = 0; k < 30; k++) { if (!P.S || !P.S.enJeu) break; eval(code); P.pas(); }
      const S = P.S;
      return S && { t: S.t, enJeu: S.enJeu, arme: S.arme?.k, robot: !!S.robot, copain: S.copain?.etat, toupies: S.toupies > 0, etoile: S.etoile > 0, boss: !!S.boss,
        ennemis: S.ennemis.length, tirsE: S.tirsE.length, bleus: S.tirsE.filter((b) => b.bleu).length, stats: S.stats, cages: S.cagesLibres.length };
    }, { code: robot });
    if (!e) break;
    if (e.arme && !j.vu['arme-' + e.arme]) { j.vu['arme-' + e.arme] = 1; if (e.tirsE >= 3 || e.ennemis >= 4) await capture('arme-' + e.arme); }
    if (e.robot && !j.vu.robot) { j.vu.robot = 1; await capture('robot'); }
    if (e.copain === 'fuit' && !j.vu.copain && e.ennemis >= 3) { j.vu.copain = 1; await capture('copain'); }
    if (e.bleus >= 3 && e.tirsE >= 6 && !j.vu.tirs) { j.vu.tirs = 1; await capture('tirs-' + id); }
    if (e.boss && e.tirsE >= 10 && !j.vu.boss) { j.vu.boss = 1; await capture('boss'); }
    if (e.toupies) j.vu.toupies = 1;
    if (e.etoile) j.vu.etoile = 1;
    if (e.copain === 'ami') j.vu.copainSauve = 1;
    if (await vis('mort')) { j.morts++; await p.evaluate(() => document.getElementById('d-reprendre').click()); if (j.morts > 8) { j.fin = 'trop de morts'; break; } continue; }
    if (await vis('bilan')) {
      j.fin = `fini à ${Math.round(e.t / 60)} s`; j.stats = e.stats; j.cages = e.cages;
      j.bilan = await p.evaluate(() => document.getElementById('bilan-liste').innerText.replace(/\n/g, ' | '));
      await capture('bilan-' + id);
      break;
    }
  }
  return j;
}

const journaux = [];
for (const id of ['m1', 'm2', 'secret', 'm3']) {
  const ouverte = await p.evaluate((i) => { const s = window.__poc.sauve; return i !== 'secret' || s.secret; }, id);
  if (!ouverte) { journaux.push({ id, fin: 'fermée (copain non sauvé)' }); continue; }
  const j = await joue(id);
  journaux.push(j);
  console.log(JSON.stringify(j));
}
// La carte après la partie, puis la page rechargée : la progression doit tenir
await p.evaluate(() => document.getElementById('g-carte').click());
await capture('carte');
await p.reload(); await p.waitForTimeout(300);
const apres = await p.evaluate(() => ({ continuer: document.getElementById('b-continuer').textContent, chambre: document.querySelector('.chambre').innerText, sauve: window.__poc.sauve }));
console.log("après rechargement :", apres.continuer, "|", apres.chambre, "| armes", apres.sauve.armes.join(","), "| secret", apres.sauve.secret);
await nav.close();
srv.arreter();
if (erreurs.length) { console.log("✗ erreurs :", erreurs.join(" | ")); process.exit(1); }
console.log("✓ aucune erreur de page");
