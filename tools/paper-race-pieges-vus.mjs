import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";

/* Paper Race : les pièges se voient AVANT d'y entrer.
   Un joueur n'avait pas compris que les portions bleues étaient mouillées : il
   ne découvrait l'effet qu'une fois dedans, donc trop tard. Ce contrôle prouve,
   dans le navigateur, que :
   - parmi les neuf points visés, SEULS ceux qui tombent dans une zone portent
     la pastille de la couleur du piège (lue dans les pixels du plateau) ;
   - viser un de ces points annonce l'effet avant de tracer, avec les mots des
     règles, et la pastille porte la couleur du piège ;
   - la pastille est POSÉE sur le plateau : le plateau ne bouge pas d'un pixel
     quand elle apparaît (l'ancien bandeau le poussait), et elle ne recouvre
     jamais la mini-carte.
   Usage : node tools/paper-race-pieges-vus.mjs */

let echecs = 0;
const verifier = (nom, ok, detail) => {
  console.log((ok ? "ok    " : "ECHEC ") + nom + (!ok && detail !== undefined ? "  " + JSON.stringify(detail).slice(0, 500) : ""));
  if (!ok) echecs++;
};

const site = await servir();
const nav = await chromium.launch();
const ctx = await nav.newContext({ ...devices["Pixel 9"], reducedMotion: "reduce" });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });

await p.goto(site.base + "paper-race/");
// Spa : un grand circuit, donc la mini-carte est là, et il a les trois pièges
// ⚠️ le circuit ne se choisit qu'en Grand Prix : en solo, c'est le championnat
await p.evaluate(() => localStorage.setItem("paper-race.reglages.v1", JSON.stringify({ mode: "gp", voitures: 2, level: "normal", circuit: "spavrai" })));
await p.reload();
await p.click("#jouer");
await p.waitForFunction(() => R && !depart && !occupe(), null, { timeout: 30000 });

// on pose la voiture du joueur À CÔTÉ d'une case piégée, à l'arrêt : les neuf
// points sont alors ses huit voisines, dont celle du piège
const poser = async (type) => await p.evaluate((type) => {
  const tk = R.track;
  for (const r of tk.zones[type]) {
    for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) {
      if (!onTrack(tk, x, y)) continue;
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const ax = x - dx, ay = y - dy;
        if (!onTrack(tk, ax, ay) || zoneDe(tk, ax, ay)) continue;
        // le fantôme est mis hors course : sinon il pourrait se trouver sur
        // un des neuf points et le bloquer (bloqueur ignore les voitures finies)
        R.cars[1].fini = true;
        R.cars[R.turn].p = [ax, ay]; R.cars[R.turn].v = [0, 0];
        camPose = false; newOpts(); refresh();
        return { type, piege: [x, y], depuis: [ax, ay] };
      }
    }
  }
  return null;
}, type);

// la couleur lue sur le plateau, à l'endroit de la pastille d'un point
const pastilles = async () => await p.evaluate(() => {
  const cv = document.getElementById("board"), d = window.devicePixelRatio || 1;
  const g = cv.getContext("2d");
  return opts.map((o, k) => {
    if (!o.ok) return null;
    // ⚠️ gx/gy donnent la CARTE ; l'écran est une fenêtre dessus (camX, camY)
    const x = (gx(o.p[0]) - Math.round(camX) + cellPx * 0.36) * d;
    const y = (gy(o.p[1]) - Math.round(camY) - cellPx * 0.36) * d;
    if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) return { k, hors: true };
    const px = g.getImageData(Math.round(x), Math.round(y), 1, 1).data;
    return { k, zone: zoneDe(R.track, o.p[0], o.p[1]), rgb: [px[0], px[1], px[2]] };
  }).filter(Boolean);
});

// les couleurs du DESSIN (rendu.js) et celles de la PASTILLE (index.html)
const ATTENDU = { humide: [46, 107, 153], huile: [18, 20, 26], boost: [176, 120, 20] };
const COUL_UI = { humide: "rgb(31, 84, 122)", huile: "rgb(34, 40, 47)", boost: "rgb(122, 84, 16)" };
const proche = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 40;

for (const type of ["humide", "huile", "boost"]) {
  const pose = await poser(type);
  verifier(`${type} : on trouve une case piégée avec une voisine libre`, !!pose, pose);
  if (!pose) continue;
  const vus = await pastilles();
  const attendue = ATTENDU[type];
  // un point hors de l'écran ne se juge pas : la mesure serait vide, pas verte
  verifier(`${type} : les neuf points sont visibles à l'écran`, vus.every((v) => v.rgb), vus);
  const marques = vus.filter((v) => v.rgb && v.zone && proche(v.rgb, ATTENDU[v.zone]));
  const faux = vus.filter((v) => v.rgb && !v.zone && Object.values(ATTENDU).some((c) => proche(v.rgb, c)));
  const oublies = vus.filter((v) => v.rgb && v.zone && !proche(v.rgb, ATTENDU[v.zone]));
  verifier(`${type} : les points qui tombent dans le piège portent sa pastille`, marques.length > 0 && oublies.length === 0, { vus, attendue });
  verifier(`${type} : les autres points n'en portent pas`, faux.length === 0, faux);

  // viser un de ces points : l'effet est annoncé AVANT de tracer
  const avant = await p.evaluate(() => { selected = null; refresh(); const r = document.getElementById("board").getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, texte: document.getElementById("zonemsg").textContent }; });
  const apres = await p.evaluate(() => {
    const k = opts.findIndex((o) => o.ok && zoneDe(R.track, o.p[0], o.p[1]));
    selected = k; refresh();
    const b = document.getElementById("board").getBoundingClientRect();
    const z = document.getElementById("zonemsg").getBoundingClientRect();
    const m = document.getElementById("minicarte");
    const mr = m.hidden ? null : m.getBoundingClientRect();
    const w = document.getElementById("boardwrap").getBoundingClientRect();
    const st = getComputedStyle(document.getElementById("zonemsg"));
    return {
      texte: document.getElementById("zonemsg").textContent,
      classe: document.getElementById("zonemsg").className,
      couleur: st.borderTopColor,
      board: { x: b.x, y: b.y, w: b.width, h: b.height },
      surLePlateau: z.top >= w.top - 1 && z.bottom <= w.bottom + 1 && z.left >= w.left - 1 && z.right <= w.right + 1,
      chevauche: mr ? !(z.right <= mr.left || z.left >= mr.right || z.bottom <= mr.top || z.top >= mr.bottom) : null,
      minicarte: !!mr,
    };
  });
  verifier(`${type} : l'effet est annoncé avant de tracer`, apres.texte.startsWith("Tu finis") && apres.classe.includes(type), apres);
  // viser ailleurs : plus de pastille (elle décrit la situation, pas l'histoire)
  const ailleurs = await p.evaluate(() => {
    const k = opts.findIndex((o) => o.ok && !zoneDe(R.track, o.p[0], o.p[1]));
    selected = k; refresh();
    return { k, texte: document.getElementById("zonemsg").textContent };
  });
  verifier(`${type} : viser ailleurs efface la pastille`, ailleurs.k >= 0 && ailleurs.texte === "", ailleurs);
  // déjà DANS la zone : c'est ce message-là qui reste, car c'est lui qui
  // explique les cases grisées du pavé
  const dedans = await p.evaluate((type) => {
    const tk = R.track;
    for (const r of tk.zones[type]) for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) {
      if (!onTrack(tk, x, y)) continue;
      R.cars[R.turn].p = [x, y]; R.cars[R.turn].v = [0, 0];
      camPose = false; newOpts();
      selected = opts.findIndex((o) => o.ok && zoneDe(R.track, o.p[0], o.p[1]));
      refresh();
      return { texte: document.getElementById("zonemsg").textContent, classe: document.getElementById("zonemsg").className };
    }
    return null;
  }, type);
  // l'accélérateur, lui, n'impose RIEN une fois dessus : il n'a pas de message
  // d'état, c'est donc celui du point visé qui reste
  if (type === "boost") verifier(`${type} : sur l'accélérateur, c'est le point visé qui parle`, dedans.texte.startsWith("Tu finis") && dedans.classe.includes(type), dedans);
  else verifier(`${type} : dans la zone, c'est ce message qui reste`, !dedans.texte.startsWith("Tu finis") && dedans.classe.includes(type), dedans);
  verifier(`${type} : la pastille porte la couleur du piège`, apres.couleur === COUL_UI[type], { vu: apres.couleur, attendu: COUL_UI[type] });
  verifier(`${type} : le plateau ne bouge pas d'un pixel`,
    avant.x === apres.board.x && avant.y === apres.board.y && avant.w === apres.board.w && avant.h === apres.board.h, { avant, apres: apres.board });
  verifier(`${type} : la pastille est posée sur le plateau`, apres.surLePlateau, apres);
  verifier(`${type} : la pastille ne recouvre pas la mini-carte`, apres.minicarte && apres.chevauche === false, apres);
}

verifier("aucune erreur dans la console", erreurs.length === 0, erreurs.slice(0, 5));
await ctx.close();

/* ---------- la pastille se lit, en clair comme en sombre ----------
   Elle porte la couleur de son piège : trois couleurs de plus à vérifier, et
   l'audit UI ne passe pas dessus (elle n'apparaît qu'en visant un piège). */
const lum = (c) => {
  const [r, g, b] = c.match(/\d+/g).slice(0, 3).map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
for (const theme of ["light", "dark"]) {
  const c2 = await nav.newContext({ ...devices["Pixel 9"], colorScheme: theme, reducedMotion: "reduce" });
  const q = await c2.newPage();
  await q.goto(site.base + "paper-race/");
  await q.evaluate(() => localStorage.setItem("paper-race.reglages.v1", JSON.stringify({ mode: "gp", voitures: 2, level: "normal", circuit: "spavrai" })));
  await q.reload();
  await q.click("#jouer");
  await q.waitForFunction(() => R && !depart && !occupe(), null, { timeout: 30000 });
  for (const type of ["humide", "huile", "boost"]) {
    const vu = await q.evaluate((type) => {
      const tk = R.track;
      for (const r of tk.zones[type]) for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) {
        if (!onTrack(tk, x, y)) continue;
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const ax = x - dx, ay = y - dy;
          if (!onTrack(tk, ax, ay) || zoneDe(tk, ax, ay)) continue;
          R.cars[1].fini = true; R.cars[R.turn].p = [ax, ay]; R.cars[R.turn].v = [0, 0];
          camPose = false; newOpts();
          selected = opts.findIndex((o) => o.ok && zoneDe(R.track, o.p[0], o.p[1]));
          refresh();
          const st = getComputedStyle(document.getElementById("zonemsg"));
          return { texte: st.color, fond: st.backgroundColor, taille: parseFloat(st.fontSize) };
        }
      }
      return null;
    }, type);
    const r = contraste(vu.texte, vu.fond);
    verifier(`[${theme}] ${type} : la pastille se lit (4,5:1)`, r >= 4.5, { ...vu, ratio: +r.toFixed(2) });
  }
  await c2.close();
}

await nav.close(); await site.fermer?.();
console.log(echecs ? `\n${echecs} ECHEC(S)` : "\nPAPER RACE PIÈGES VUS OK");
process.exit(echecs ? 1 : 0);
