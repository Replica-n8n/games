import { webkit, chromium, devices } from "playwright";
import { servir } from "./serveur.mjs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const CAPTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), "captures");

/* Paper Race : le bouton d'installation FAIT quelque chose, partout.
   Signalé par un joueur le 2026-09-18 : « l'installation n'a pas marché sur
   mon iPhone ». Sur iPhone aucune page ne peut s'installer seule ; le bouton
   réécrivait une phrase déjà affichée, donc rien ne bougeait à l'écran.
   Il doit maintenant DÉPLIER des étapes, adaptées à l'endroit où l'on est. */

let echecs = 0;
const verifier = (nom, ok, detail) => {
  console.log((ok ? "ok    " : "ECHEC ") + nom + (!ok && detail !== undefined ? "  " + JSON.stringify(detail) : ""));
  if (!ok) echecs++;
};

const site = await servir();
const URL_JEU = site.base + "paper-race/";
const INSTAGRAM = devices["iPhone 13"].userAgent + " Instagram 312.0.0.0";

async function essai(nom, moteur, profil) {
  const b = await moteur.launch();
  const ctx = await b.newContext(profil);
  const p = await ctx.newPage();
  const erreurs = [];
  p.on("pageerror", (e) => erreurs.push(e.message));
  await p.goto(URL_JEU, { waitUntil: "networkidle" });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: "networkidle" });
  const r = await p.evaluate(async () => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    document.getElementById("reglagesBtn").click();
    await w(200);
    const bouton = document.getElementById("installer"), etapes = document.getElementById("astuce");
    const avant = { visible: !bouton.hidden, texte: bouton.textContent.trim(), etapes: !etapes.hidden, recommencer: !document.getElementById("recommencer").hidden, accueil: !document.getElementById("accueil").hidden };
    bouton.click(); await w(200);
    const ouvert = { etapes: !etapes.hidden, lignes: [...etapes.querySelectorAll("li")].map((l) => l.textContent.trim()) };
    return { avant, ouvert };
  });
  await p.screenshot({ path: path.join(CAPTURES, `paper-race-installer-${nom}.png`) });
  r.replie = await p.evaluate(async () => { document.getElementById("installer").click(); await new Promise((ok) => setTimeout(ok, 100)); return document.getElementById("astuce").hidden; });
  await b.close();
  return { ...r, erreurs };
}

const iphone = await essai("iphone", webkit, { ...devices["iPhone 13"] });
verifier("iPhone : le bouton dit « Ajouter à l'écran d'accueil »", iphone.avant.visible && /écran d'accueil/.test(iphone.avant.texte), iphone.avant);
verifier("iPhone : les étapes sont repliées au départ (le bouton a donc un effet visible)", !iphone.avant.etapes, iphone.avant);
verifier("iPhone : toucher le bouton déplie 3 étapes, dont Partager", iphone.ouvert.etapes && iphone.ouvert.lignes.length === 3 && /Partager/.test(iphone.ouvert.lignes[0]), iphone.ouvert);
verifier("iPhone : un second appui les replie", iphone.replie);
verifier("iPhone : aucune erreur", iphone.erreurs.length === 0, iphone.erreurs);
verifier("depuis l'accueil, les réglages ne proposent ni « Recommencer » ni « Retour à l'accueil »", !iphone.avant.recommencer && !iphone.avant.accueil, iphone.avant);

const insta = await essai("instagram", webkit, { ...devices["iPhone 13"], userAgent: INSTAGRAM });
verifier("Instagram sur iPhone : on dit d'ouvrir Safari", insta.ouvert.etapes && /Safari/.test(insta.ouvert.lignes.join(" ")), insta.ouvert);

const android = await essai("android", chromium, { ...devices["Pixel 9"] });
verifier("Android sans invitation : « Installer le jeu » déplie les étapes de Chrome", /Installer le jeu/.test(android.avant.texte) && android.ouvert.etapes && /Chrome/.test(android.ouvert.lignes.join(" ")), android);

site.arreter();
console.log(echecs ? `\n${echecs} ECHEC(S)` : "\nINSTALLATION OK");
process.exit(echecs ? 1 : 0);
