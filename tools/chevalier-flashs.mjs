import { chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";

/* LES FLASHS DU CHEVALIER, MESURES IMAGE PAR IMAGE.

   Le jeu vise des enfants de huit ans. Une lumiere qui clignote trop vite peut
   declencher une crise chez un enfant photosensible, et c'est un risque qu'on
   ne voit pas en jouant : il faut le compter.

   La regle est celle des WCAG 2.3.1 (seuil general et seuil rouge) :
   - pas plus de TROIS flashs dans n'importe quelle seconde ;
   - un flash, c'est une paire de variations opposees de luminance relative
     d'au moins 0,10, dont l'etat le plus sombre est sous 0,80 ;
   - seulement s'il couvre une surface assez grande : 25 % d'un champ de vision
     de 10 degres. Telephone tenu a 30 cm, ce champ fait ~5 cm, soit ~315 px CSS
     sur un Pixel 9 ; la surface a surveiller est donc un carre de ~160 px CSS.
   - le flash rouge sature compte a part, avec le meme plafond.

   Comment on mesure sans rien rater :
   - le temps du jeu est REMPLACE par une horloge qu'on avance nous-memes
     (performance.now et requestAnimationFrame) : chaque 60e de seconde est
     dessine puis mesure, meme si le navigateur est lent. Une capture d'ecran en
     boucle aurait saute les flashs de 100 ms ;
   - chaque image du canevas est reduite en cases de 8 px CSS, et chaque carre
     de 160 px (glissant par pas de 80 px) suit sa propre luminance moyenne.
   ⚠️ Seul le canevas est mesure : les ecrans en HTML (roue, cartes, fin) sont
   des panneaux fixes, sans clignotement.

   Scenarios : ceux qui produisent de la lumiere qui change vite. */

const HORLOGE = () => {
  let t = 1000; const file = [];
  performance.now = () => t;
  window.requestAnimationFrame = (cb) => { file.push(cb); return file.length; };
  window.__horloge = {
    avancer(ms) { t += ms; const q = file.splice(0); for (const cb of q) cb(t); },
  };
};

const site = await servir();
const nav = await chromium.launch();
const ctx = await nav.newContext({ ...devices["Pixel 9"], serviceWorkers: "block" });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(e.message));
await p.addInitScript(HORLOGE);
await p.goto(site.jeu, { waitUntil: "load" });
await p.evaluate(() => { for (let i = 0; i < 30; i++) window.__horloge.avancer(1000 / 60); });

/* Joue `secondes` a 60 images par seconde et renvoie, pour le pire carre, le
   plus grand nombre de flashs (general et rouge) trouve dans une seconde. */
async function mesurer(nom, preparer, secondes, pendant = null, arg = null) {
  await p.evaluate(preparer, arg);
  const r = await p.evaluate(({ secondes, pendant }) => {
    const cv = document.getElementById("jeu");
    const [L, H] = window.jeu.taille();
    const CASE = 8, BLOC = 20, PAS = 10;          /* cases de 8 px, carres de 160 px */
    const w = Math.ceil(L / CASE), h = Math.ceil(H / CASE);
    const petit = document.createElement("canvas"); petit.width = w; petit.height = h;
    const g = petit.getContext("2d", { willReadFrequently: true });
    const lin = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const v = i / 255; lin[i] = v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }
    const blocs = [];
    for (let by = 0; by + BLOC <= h; by += PAS) for (let bx = 0; bx + BLOC <= w; bx += PAS) blocs.push([bx, by]);
    const lum = blocs.map(() => []), rouge = blocs.map(() => []);
    const n = Math.round(secondes * 60);
    const agir = pendant ? new Function("i", pendant) : null;
    for (let i = 0; i < n; i++) {
      if (agir) agir(i);
      window.__horloge.avancer(1000 / 60);
      /* une montee de niveau arrete le jeu : on prend la premiere carte */
      const carte = document.querySelector("#ecranMontee:not([hidden]) .carte, .carte");
      if (carte && carte.offsetParent) carte.click();
      g.drawImage(cv, 0, 0, w, h);
      const d = g.getImageData(0, 0, w, h).data;
      const Lc = new Float32Array(w * h), Rc = new Uint8Array(w * h);
      for (let k = 0, q = 0; k < d.length; k += 4, q++) {
        const R = d[k], G = d[k + 1], B = d[k + 2];
        Lc[q] = .2126 * lin[R] + .7152 * lin[G] + .0722 * lin[B];
        Rc[q] = (R / (R + G + B + 1) >= .8 && R > 128) ? 1 : 0;   /* rouge sature */
      }
      blocs.forEach(([bx, by], b) => {
        let s = 0, sr = 0;
        for (let y = by; y < by + BLOC; y++) for (let x = bx; x < bx + BLOC; x++) { s += Lc[y * w + x]; sr += Rc[y * w + x]; }
        lum[b].push(s / (BLOC * BLOC)); rouge[b].push(sr / (BLOC * BLOC));
      });
    }
    /* transitions : variations d'au moins `seuil` entre deux extremes successifs */
    /* ⚠️ On suit le plus bas ET le plus haut depuis la derniere transition.
       Une premiere version ne suivait qu'un extreme : elle ne voyait jamais
       une MONTEE, et l'eclair de l'orage comptait zero flash. */
    function transitions(serie, seuil, sombreMax) {
      const tr = []; let bas = serie[0], haut = serie[0], sens = 0;
      for (let i = 1; i < serie.length; i++) {
        const v = serie[i];
        if (sens !== 1 && v - bas >= seuil && bas < sombreMax) { tr.push(i); sens = 1; bas = haut = v; continue; }
        if (sens !== -1 && haut - v >= seuil && v < sombreMax) { tr.push(i); sens = -1; bas = haut = v; continue; }
        bas = Math.min(bas, v); haut = Math.max(haut, v);
      }
      return tr;
    }
    /* flashs dans la pire seconde : paires de transitions opposees */
    function pireSeconde(tr) {
      let pire = 0;
      for (let a = 0; a < tr.length; a++) {
        let c = 0; while (a + c < tr.length && tr[a + c] - tr[a] < 60) c++;
        pire = Math.max(pire, Math.floor(c / 2));
      }
      return pire;
    }
    let general = 0, rougeMax = 0, ou = null, amplitude = 0;
    blocs.forEach(([bx, by], b) => {
      const f = pireSeconde(transitions(lum[b], .10, .80));
      const fr = pireSeconde(transitions(rouge[b], .25, 1.01));
      const serie = lum[b]; let amp = 0;
      for (let i = 1; i < serie.length; i++) amp = Math.max(amp, Math.abs(serie[i] - serie[i - 1]));
      amplitude = Math.max(amplitude, amp);
      if (f > general || fr > rougeMax) ou = [bx * CASE, by * CASE];
      general = Math.max(general, f); rougeMax = Math.max(rougeMax, fr);
    });
    return { general, rouge: rougeMax, ou, sautMax: Math.round(amplitude * 1000) / 1000, images: n, carres: blocs.length };
  }, { secondes, pendant });
  console.log(`${nom.padEnd(22)} flashs/s max : ${r.general} (rouge ${r.rouge})  plus grand saut de luminance d'une image a l'autre : ${r.sautMax}  [${r.images} images, ${r.carres} carres]`);
  return { nom, ...r };
}

const scenarios = [];

/* 1. une partie ordinaire, pleine de bestioles, toutes les armes du magicien */
scenarios.push(await mesurer("partie chargee", () => {
  window.jeu.choisirPerso("magicien"); window.jeu.choisirMonde("prairie"); window.jeu.commencer(31);
  const g = window.jeu.partie(); g.joueur.invincibleJusqua = 1e9;
  for (let i = 0; i < 40; i++) g.naitre(["escargot", "abeille", "herisson"][i % 3]);
}, 8));

/* 2. l'orage : la foudre tombe toutes les 2,4 s, et l'eclair est blanc */
scenarios.push(await mesurer("orage", () => {
  window.jeu.choisirPerso("chevalier"); window.jeu.choisirMonde("prairie"); window.jeu.commencer(32);
  const g = window.jeu.partie(); g.joueur.invincibleJusqua = 1e9;
  window.jeu.changerLeTemps("orage");
  for (let i = 0; i < 25; i++) g.naitre(["escargot", "abeille"][i % 2]);
}, 12));

/* 3. la fin de l'etoile d'invincibilite : l'ecran dore clignote 1,5 s */
scenarios.push(await mesurer("fin de l'etoile", () => {
  window.jeu.commencer(33);
  const g = window.jeu.partie(); g.joueur.invincibleJusqua = 1e9;
  g.etoileJusqua = g.temps + 2.5;
}, 3.5));

/* 4. le chat geant : trois coups de griffe et le grand flash */
scenarios.push(await mesurer("chat geant", () => {
  window.jeu.commencer(34);
  const g = window.jeu.partie(); g.joueur.invincibleJusqua = 1e9;
  /* les trois pattes d'office : c'est la mise en scene qu'on mesure, pas le chemin */
  g.chat.pattes = [true, true, true]; g.chat.pret = true;
  for (let i = 0; i < 20; i++) g.naitre(["escargot", "abeille", "herisson"][i % 3]);
}, 4, "if (i === 20) window.jeu.invoquerChat();"));

/* 5. les boss : le crabe et sa pince, le dragon et sa lave qui retombe */
for (const [monde, quoi] of [["ile", "boss crabe"], ["volcan", "boss dragon"], ["prairie", "boss reine"]]) {
  scenarios.push(await mesurer(quoi, (m) => {
    window.jeu.choisirMonde(m); window.jeu.commencer(35);
    const g = window.jeu.partie(); g.joueur.invincibleJusqua = 1e9;
    window.jeu.repeterBoss ? window.jeu.repeterBoss() : g.invoquerBoss(30);
  }, 10, null, monde));
}

await nav.close(); site.arreter();

const griefs = [];
for (const s of scenarios) {
  if (s.general > 3) griefs.push(`${s.nom} : ${s.general} flashs dans une seconde (plafond 3), carre en ${s.ou}`);
  if (s.rouge > 3) griefs.push(`${s.nom} : ${s.rouge} flashs ROUGES dans une seconde (plafond 3), carre en ${s.ou}`);
}
if (erreurs.length) griefs.push("erreurs de page : " + erreurs.slice(0, 3).join(" | "));
const orage = scenarios.find((s) => s.nom === "orage");
if (orage && orage.general < 1) griefs.push("orage : aucun flash compte alors que la foudre tombe toutes les 2,4 s (le banc est aveugle)");
const chat = scenarios.find((s) => s.nom === "chat geant");
if (chat && chat.sautMax < .02) griefs.push("chat geant : aucun changement de lumiere mesure, l'invocation n'a pas du partir (le banc ne mesure rien)");
console.log(griefs.length ? "\nRATE :\n  - " + griefs.join("\n  - ") : "\nOK : aucun scenario ne depasse 3 flashs par seconde, ni en general ni en rouge.");
process.exit(griefs.length ? 1 : 0);
