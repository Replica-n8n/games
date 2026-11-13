// DIG : audit d'interface écran par écran (impeccable « audit », grille ui-ux-pro-max) : cibles de 44 px, contraste du
// texte sur son vrai fond, textes de moins de 14 px, boutons sans nom, débordement horizontal, et texte agrandi à 130 %.
// node tools/dig-audit-ui.mjs  ->  la liste des constats, écran par écran
import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";
const srv = await servir(); const nav = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const err = [];
const ECRANS = {
  accueil: () => { fait.pompei = 2; libresFaits.add('dinosaure'); sauver(); ouvrirEtagere('accueil'); },
  expeditions: () => ouvrirEtagere('chaines'),
  libres: () => ouvrirEtagere('libres'),
  galerie: () => ouvrirEtagere('etagere'),
  vitrine: () => ouvrirVitrine(0),
  intro: () => { fermerVitrine(); lancer(1); },
  fouille: () => { document.getElementById('go').click(); },
  lavage: () => { for (const e of [...M.values()]) if (e.t === 'sol' && e.y >= 1) retirer(e); verifierDecouvertes(); majHud(); document.getElementById('sortir').click(); },
  fin: () => { for (const e of OS) { e.sale = 0; colorer(e); } terminer(); },
};
const audit = () => {
  const lum = (c) => { const m = c.match(/[\d.]+/g); if (!m) return null; const [r, g, b, a = 1] = m.map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return { L: 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b), a }; };
  const fond = (el) => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.backgroundImage !== 'none' && !s.backgroundImage.startsWith('url')) return 'degrade'; const l = lum(s.backgroundColor); if (l && l.a > 0.9) return s.backgroundColor; } return 'rgb(255,255,255)'; };
  const vis = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && +s.opacity > 0.05 && r.bottom > 0 && r.top < innerHeight; };
  const out = [];
  for (const b of document.querySelectorAll('button, a, [role=button], input, select')) { if (!vis(b)) continue; const r = b.getBoundingClientRect(), nom = (b.getAttribute('aria-label') || b.textContent || b.title || '').trim();
    if (r.width < 44 || r.height < 44) out.push(['cible < 44 px', (b.id || b.className || b.tagName) + ' ' + Math.round(r.width) + '×' + Math.round(r.height) + ' « ' + nom.slice(0, 30) + ' »']);
    if (!nom) out.push(['bouton sans nom', b.id || b.className || b.outerHTML.slice(0, 60)]); }
  const textes = [...document.querySelectorAll('body *')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && e.tagName !== 'CANVAS');
  for (const e of textes) { const s = getComputedStyle(e), px = parseFloat(s.fontSize), t = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').slice(0, 30);
    if (px < 14) out.push(['texte < 14 px', Math.round(px * 10) / 10 + ' px « ' + t + ' » (' + (e.id || e.className || e.tagName) + ')']);
    const f = fond(e); if (f === 'degrade') continue; const a = lum(s.color), b = lum(f); if (!a || !b) continue; const ratio = (Math.max(a.L, b.L) + 0.05) / (Math.min(a.L, b.L) + 0.05), gros = px >= 24 || (px >= 18.6 && +s.fontWeight >= 700);
    if (ratio < (gros ? 3 : 4.5)) out.push(['contraste', ratio.toFixed(2) + ':1 « ' + t + ' » ' + s.color + ' sur ' + f]); }
  if (document.documentElement.scrollWidth > innerWidth + 1) out.push(['débordement horizontal', document.documentElement.scrollWidth + ' px']);
  return out;
};
for (const [nomCtx, opts] of [['normal', {}], ['texte 130 %', { zoom: 1.3 }]]) {
  const p = await (await nav.newContext({ ...devices['Pixel 7'], viewport: { width: 412, height: 860 } })).newPage(); p.on('pageerror', (e) => err.push(e.stack));
  await p.goto(srv.base + 'dig/'); await p.waitForFunction(() => window.__essais);
  if (opts.zoom) await p.addStyleTag({ content: `html{font-size:${opts.zoom * 100}%} body{zoom:1}` }).catch(() => {});
  console.log('\n===== ' + nomCtx);
  for (const [ecran, f] of Object.entries(ECRANS)) {
    await p.evaluate(`(${f.toString()})()`).catch((e) => console.log('  (', ecran, 'non atteint :', e.message.split('\n')[0], ')'));
    await p.waitForTimeout(ecran === 'lavage' ? 7000 : 900);
    const c = await p.evaluate(audit); console.log('--', ecran, c.length ? '' : 'rien');
    const vus = new Set(); for (const [k, d] of c) { const cle = k + d; if (vus.has(cle)) continue; vus.add(cle); console.log('   ' + k + ' : ' + d); }
    if (nomCtx === 'normal') await p.screenshot({ path: `tools/captures/dig/audit-${ecran}.png` });
  }
  await p.close();
}
await nav.close(); srv.arreter(); console.log(err.length ? err : '\naucune erreur');

// Mouvements réduits : le téléphone le demande -> pas de secousse, survol de caméra raccourci, moins d'éclats
{ const p = await (await (await chromium.launch()).newContext({ ...devices['Pixel 7'], viewport: { width: 412, height: 860 }, reducedMotion: 'reduce' })).newPage();
  const srv2 = await servir(); await p.goto(srv2.base + 'dig/'); await p.waitForFunction(() => window.__essais);
  const r = await p.evaluate(async () => { lancer(0); document.getElementById('go').click();
    const pt = (() => { const b = toile.getBoundingClientRect(); for (let y = b.height * 0.4; y < b.height * 0.8; y += 10) for (let x = b.width * 0.3; x < b.width * 0.7; x += 10) { const h = viser(b.left + x, b.top + y); if (h) return h; } })();
    frapper(pt); const c0 = cam.position.clone(); await new Promise((f) => requestAnimationFrame(() => requestAnimationFrame(f)));
    const bouge = cam.position.distanceTo(c0); let n = 0; for (let k = 0; k < 300; k++) { const avant = iE; eclat(5, 5, 5, 0xffffff); if (iE !== avant) n++; }
    return { reduit: reduit.matches, cameraSecouee: +bouge.toFixed(3), eclatsSur300: n }; });
  console.log('\n===== mouvements réduits', r, r.reduit && r.cameraSecouee < 0.01 && r.eclatsSur300 < 150 ? 'OK' : 'ECHEC');
  srv2.arreter(); await p.context().browser().close(); }
