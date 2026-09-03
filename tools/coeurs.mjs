/* JOUER LES PARTIES SUR TOUS LES COEURS PLUTOT QUE L'UNE APRES L'AUTRE.

   Elle a demande, le 2026-09-03 : « es-tu oblige de faire des dizaines de
   vraies parties ? ne peux-tu pas mettre un accelerateur ? ». Mesure de la
   suite complete ce jour-la : 7 min 15 s, dont 172 s pour
   `chevalier-objets.mjs` et 53 s pour `chevalier-difficulte.mjs`.

   ⚠️ CES DEUX-LA NE JOUENT PAS EN TEMPS REEL, et c'est important de ne pas se
   tromper de remede : ils ne touchent jamais au navigateur, ils font tourner
   le moteur en boucle serree. `chevalier-difficulte.mjs` simule vingt parties
   de huit minutes — 160 minutes de jeu — en 53 secondes, soit deja CENT
   QUATRE-VINGT FOIS le temps reel. Les accelerer davantage n'a pas de sens :
   ils sont limites par le processeur, pas par une horloge.

   Ce qui reste, c'est qu'ils utilisent UN SEUL coeur pendant que les sept
   autres ne font rien. Chaque partie est independante des autres — meme
   graine, meme resultat, aucun etat partage — donc rien n'empeche de les
   distribuer. C'est tout ce que fait ce fichier.

   Usage, dans un banc :

     const resultats = await repartir(import.meta.url, taches, faireUne);

   Le parent decoupe `taches` en autant de tranches que de coeurs, relance le
   MEME fichier une fois par tranche avec `TRANCHE=i/n`, et recolle les
   resultats dans l'ordre. L'enfant, lui, voit `TRANCHE`, ne joue que ses
   taches, imprime son lot et s'arrete : tout ce qui suit l'appel dans le banc
   n'existe que pour le parent.

   ⚠️ Deux regles pour s'en servir sans se faire mordre :

   - RIEN NE DOIT S'IMPRIMER AVANT l'appel : la sortie de l'enfant est lue par
     le parent, et une ligne de trop la rend illisible. Le lot est encadre par
     un caractere de controle pour cette raison, mais autant ne pas jouer avec.
   - `faireUne` doit etre une VRAIE fonction pure de sa tache. Si deux parties
     se parlaient par une variable de module, les decouper changerait le
     resultat — et un banc qui change de reponse selon le nombre de coeurs de
     la machine ne vaut rien. */
import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";
import os from "node:os";

/* le lot est encadre par cette balise : le parent ne lit que ce qu'il y a
   entre les deux, ce qui laisse les enfants ecrire ce qu'ils veulent autour */
const BALISE = "<<<lot>>>";

export async function repartir(fichierUrl, taches, faireUne) {
  const part = process.env.TRANCHE;

  /* --------------------------------------------------------- chez l'enfant */
  if (part) {
    const [i, n] = part.split("/").map(Number);
    const lot = [];
    for (let k = i; k < taches.length; k += n) lot.push(faireUne(taches[k], k));
    process.stdout.write(BALISE + JSON.stringify(lot) + BALISE);
    process.exit(0);
  }

  /* --------------------------------------------------------- chez le parent */
  const coeurs = os.availableParallelism ? os.availableParallelism() : os.cpus().length;
  const n = Math.max(1, Math.min(coeurs, taches.length, 8));
  if (n === 1) return taches.map(faireUne);

  const fichier = fileURLToPath(fichierUrl);
  const lots = await Promise.all(
    Array.from({ length: n }, (_, i) => new Promise((ok, ko) => {
      const e = fork(fichier, process.argv.slice(2), {
        env: { ...process.env, TRANCHE: i + "/" + n },
        stdio: ["ignore", "pipe", "inherit", "ipc"],
      });
      let sortie = "";
      e.stdout.on("data", (d) => { sortie += d; });
      e.on("exit", (code) => {
        const m = sortie.split(BALISE);
        if (code !== 0 || m.length < 3) {
          return ko(new Error("la tranche " + i + "/" + n + " a echoue (code " + code + ")"));
        }
        ok(JSON.parse(m[1]));
      });
    }))
  );

  /* la tranche i a joue les taches i, i+n, i+2n... : on remet dans l'ordre,
     sinon deux machines a nombre de coeurs different n'afficheraient pas la
     meme liste de parties */
  const resultats = new Array(taches.length);
  lots.forEach((lot, i) => lot.forEach((r, k) => { resultats[i + k * n] = r; }));
  return resultats;
}
