import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "./serveur.mjs";

/* MAQUETTE : dire dans l'arcade qu'un jeu a du nouveau (demandé par Julie le
   2026-10-28). On charge la VRAIE page d'accueil et on l'habille de trois façons :
   A. la pastille « Nouveau » et une ligne dans la tuile ;
   B. la pastille, et un bandeau « Quoi de neuf » en haut de la mosaïque ;
   C. la pastille, et une feuille qui s'ouvre au toucher, avant de jouer.
   Rien n'est changé dans l'arcade. Sortie : docs/arcade-nouveautes-maquette.png */

const ICI = path.dirname(fileURLToPath(import.meta.url));
const srv = await servir();
const navigateur = await chromium.launch();
const ctx = await navigateur.newContext({ viewport: { width: 360, height: 732 }, deviceScaleFactor: 2, serviceWorkers: "block" });
const p = await ctx.newPage();
await p.addInitScript(() => localStorage.setItem("arcade-dernier", "bataille"));
const NOUVEAU = {
  bataille: { v: "1.6", txt: "Gravures, atlas du ciel et 8 années maudites" },
  "ghost-train": { v: "2.1", txt: "Les quatre étages de l'hôtel sont ouverts" },
  patrouille: { v: "1.5", txt: "Le Désert et deux nouveaux boss" },
};
const photos = [];
for (const variante of ["A", "B", "C"]) {
  await p.goto(srv.base + "index.html", { waitUntil: "networkidle" });
  await p.evaluate(({ N, variante }) => {
    document.getElementById("etat").textContent = "8 jeux · hors ligne";
    const css = document.createElement("style");
    css.textContent = `
      .pastille{position:relative;z-index:2;margin-top:8px;width:max-content;display:flex;align-items:center;gap:6px;background:#fff;color:#0d0d14;font:700 14px 'Outfit',sans-serif;padding:5px 11px 5px 9px;border-radius:14px;box-shadow:0 4px 10px rgba(0,0,0,.35)}
      .pastille::before{content:"";width:8px;height:8px;border-radius:50%;background:#ff3b5c}
      a.tuile .neuf{display:block;position:relative;z-index:1;margin-top:8px;font-size:14px;line-height:1.25;max-width:13ch;font-weight:600;opacity:.95}
      a.tuile.grand .neuf{max-width:20ch;font-size:15px}
      a.tuile.grand:has(.neuf){height:214px}
      .bandeau{grid-column:1/3;background:#1c1b29;border-radius:22px;padding:14px 16px;display:flex;flex-direction:column;gap:10px}
      .bandeau h2{margin:0;font:700 16px 'Unbounded',sans-serif;display:flex;justify-content:space-between;align-items:center}
      .bandeau h2 button{font:600 14px 'Outfit';color:#b9b6c9;background:none;border:0;min-height:44px;padding:0 4px}
      .bandeau .l{display:flex;gap:12px;align-items:center;min-height:44px}
      .bandeau .l img{width:40px;height:40px;border-radius:10px;flex:none}
      .bandeau .l b{display:block;font:600 15px 'Outfit'}.bandeau .l span{display:block;font-size:14px;color:#b9b6c9;line-height:1.25}
      .voileM{position:fixed;inset:0;background:rgba(5,5,12,.6);display:flex;align-items:flex-end;padding:12px;z-index:5}
      .feuilleM{width:100%;background:#1c1b29;border-radius:28px;padding:20px 18px 16px;display:flex;flex-direction:column;gap:12px}
      .feuilleM .haut{display:flex;gap:14px;align-items:center}.feuilleM img{width:64px;height:64px;border-radius:16px}
      .feuilleM h2{margin:0;font:700 20px/1.15 'Unbounded',sans-serif}.feuilleM small{color:#b9b6c9;font-size:14px}
      .feuilleM ul{margin:0;padding-left:20px;font-size:16px;line-height:1.45}
      .feuilleM .jouer{height:56px;border-radius:28px;background:#fff;color:#0d0d14;font:700 17px 'Outfit';display:flex;align-items:center;justify-content:center}`;
    document.head.appendChild(css);
    document.querySelectorAll("a.tuile").forEach((a) => {
      const n = N[a.dataset.jeu]; if (!n) return;
      const pa = document.createElement("span"); pa.className = "pastille"; pa.textContent = "Nouveau"; a.querySelector("b").after(pa);
      /* la ligne ne tient que sur la grande tuile : sur une petite, elle passerait sous l'icône */
      if (variante === "A" && a.classList.contains("grand")) { const s = document.createElement("span"); s.className = "neuf"; s.textContent = n.txt; pa.after(s); }
    });
    if (variante === "B") {
      const b = document.createElement("section"); b.className = "bandeau";
      b.innerHTML = '<h2>Quoi de neuf<button type="button">Vu</button></h2>' + Object.entries(N).map(([id, n]) => `<div class="l"><img src="./${id}/icone-192.png" alt=""><div><b>${document.querySelector(`[data-jeu="${id}"] b`).textContent}</b><span>${n.txt}</span></div></div>`).join("");
      const g = document.getElementById("grille"); g.insertBefore(b, g.children[1]);
    }
    if (variante === "C") {
      const v = document.createElement("div"); v.className = "voileM";
      v.innerHTML = `<div class="feuilleM"><div class="haut"><img src="./bataille/icone-192.png" alt=""><div><h2>Nouveau dans La Bataille</h2><small>Version 1.6</small></div></div>
        <ul><li>Gagne un mois : grave une de tes cartes.</li><li>L'atlas du ciel s'allume mois après mois.</li><li>Huit années maudites, de plus en plus dures.</li></ul><div class="jouer">Jouer</div></div>`;
      document.body.appendChild(v);
    }
  }, { N: NOUVEAU, variante });
  await p.waitForTimeout(400);
  const f = path.join(ICI, "captures", "arcade-nouveautes-" + variante + ".png");
  await p.screenshot({ path: f });
  photos.push(f);
}
const LEG = {
  A: ["A · Dans la tuile", "La pastille, et une ligne sur la grande tuile (le dernier jeu joué). Rien à toucher en plus."],
  B: ["B · Bandeau « Quoi de neuf »", "Tout ce qui a changé, réuni en haut. « Vu » le range."],
  C: ["C · Feuille au toucher", "Toucher la tuile ouvre le détail, puis Jouer. Un geste de plus."],
};
const q = await navigateur.newPage({ viewport: { width: 1200, height: 900 } });
await q.goto(srv.base + "index.html");
await q.setContent(`<body style="margin:0;background:#05050c;color:#fff;font:500 15px Outfit,sans-serif;padding:20px;display:flex;gap:20px">${["A", "B", "C"].map((v) => `<div style="width:360px"><div style="font:700 18px Unbounded,sans-serif;margin-bottom:4px">${LEG[v][0]}</div><div style="color:#b9b6c9;min-height:40px;margin-bottom:8px">${LEG[v][1]}</div><img src="${srv.base}tools/captures/arcade-nouveautes-${v}.png" style="width:360px;border-radius:24px;box-shadow:0 0 0 2px #2a2938"></div>`).join("")}</body>`);
await q.waitForLoadState("networkidle");
await q.screenshot({ path: path.join(ICI, "..", "docs", "arcade-nouveautes-maquette.png"), fullPage: true });
await navigateur.close();
srv.arreter();
console.log("maquette : docs/arcade-nouveautes-maquette.png");
