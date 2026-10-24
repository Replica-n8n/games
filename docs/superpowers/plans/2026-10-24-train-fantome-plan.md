# Ghost Train : plan de construction

Plan tiré de [la spec](../specs/2026-10-24-train-fantome-design.md), validée par
Julie le 2026-10-24. Point de départ : la POC `docs/poc/spectro-brigade/`.

Chaque tranche finit par une version jouable (page privée ou `localhost`), MONTRÉE
par des captures, et attend son avis avant la suivante. Rien ne part sur `main`
(la prod) avant son « go prod ».

## Où vit le jeu

- Branche `train-fantome`, worktree `games-train/`. Dossier du jeu : `ghost-train/` (nom choisi à
  l'étape 0 ; `<jeu>` ci-dessous = `ghost-train`).
- Modules ES sans build, moteur pur (aucun DOM, aucun `Math.random`, hasard à
  graine), comme `patrouille/`. Pas fixe à 60 images/s.
- Types JSDoc vérifiés par `tsc --checkJs` (`<jeu>/jsconfig.json`).
- `tools/node_modules` : jonction vers celui du dépôt principal (Playwright).

## Étape 0 : montrer d'abord (aucun code du jeu)

1. **Planche de directions** `tools/mockup-train-directions.html`, capturée par
   `tools/mockup-train-directions.mjs` dans `docs/train-directions.png`. Trois
   directions À L'INTÉRIEUR du ton choisi (comédie d'horreur années 80), qui se
   distinguent par la forme, la matière et la typo, pas par la teinte. Pour chacune,
   le MÊME contenu : une scène de jeu (couloir, wagon, appareil, deux fantômes,
   Lumi, HUD) et le tableau des départs de la gare.
2. **Police pixel** maison (majuscules accentuées) prototypée dans la planche :
   elle servira telle quelle à l'étape 1.
3. **Noms** : 6 à 8 propositions écrites en logo dans la police de la planche.
4. Je regarde la planche avant de l'envoyer. Elle choisit une direction et un nom.

## Étape 1 : la base, mission 1 jouable

Tâches, dans l'ordre, chacune testée avant la suivante :

1. `moteur/hasard.js`, `moteur/partie.js` : rail (positions, arrêts, attente de
   la file d'apparition), cœurs, fin de mission. Tests Node.
2. `moteur/actions.js` : rayon, chauffe et surchauffe, capture, pièces lâchées.
   Repris de la POC (`applyBeam`, `capture`), avec la visée passée en paramètre.
3. `moteur/fantomes.js` : la Goule et le Majordome ; `contenu/missions.js` :
   mission 1 avec son aiguillage et ses 3 secrets ; `contenu/especes.js`.
4. `ecran/police.js` (celle de l'étape 0), `ecran/decor.js` (le lancer de rayons
   de la POC, découpé, matières du Grand Hall), `ecran/dessins.js` (la direction
   choisie), `ecran/hud.js`.
5. `entrees.js` (pouce gauche relatif, pouce droit TIRER, souris, clavier, mode
   gaucher), `son.js` (repris de la POC), `app.js`.
6. `ecran/gare.js` simplifiée (mission 1 seule), `ecran/reglages.js`, pause en
   portrait, flashs réduits.
7. PWA : `manifest.json`, `sw.js` (`<jeu>-1.0.0`, SHELL complet, `?v=`),
   bouton Installer, zoom bloqué, icônes. Liste « Ajouter un jeu » du `CLAUDE.md`
   (README, arcade, versions), sans publier.
8. Bancs : `<jeu>-moteur.test.mjs`, `<jeu>-pwa.mjs`, `<jeu>-ui.mjs` (captures de
   chaque écran, téléphone paysage), images/s avec la carte graphique.

Montrer : captures du jeu et de la gare, la mission 1 jouable.

## Étape 2 : missions 2 à 4

Une mission par sous-tranche, chacune avec sa salle (matières du décor), ses
nouveaux fantômes, son mini-boss et sa mécanique : flash (2), parfait et
super-attaque (3), slam et Gouvernante (4). Retour des espèces précédentes.
Lumi dans chaque mission. Robot de base pour vérifier 2 à 3 minutes par mission.

## Étape 3 : la progression

`moteur/progression.js` (sauvegarde en données, versionnée), atelier (3 x 3
niveaux, visibles sur l'appareil, planche des 3 niveaux), carnet, dossier et
vraie fin, notes S à C, gare complète (tableau à palettes, « SUPPRIMÉ »), radio
de la cheffe (`contenu/textes.js`).

## Étape 4 : équilibrage et essai

`<jeu>-robot.mjs` règle les seuils des notes et les prix (on le fait échouer une
fois). Images/s sur la salle de bal. Son essai sur un vrai téléphone. Puis « go
prod » : publication, `--enligne`, arcade.

## Ce qui reste ouvert

- Le nom et la direction (étape 0).
- Le retournement (Lumi = le propriétaire) : à confirmer avec les textes, étape 3.
- La musique en synthèse : à lui faire écouter dès l'étape 1.
