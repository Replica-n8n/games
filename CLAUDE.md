# games

Un jeu PWA par dossier (`echecs/`, `serpentin/`). Vanilla JS, **aucune
dépendance, aucun outil de build**. Servi par GitHub Pages sur `main` :
`https://replica-n8n.github.io/games/<jeu>/`.

Le `README.md` décrit les jeux, leurs règles et leur état. Ce fichier ne le
répète pas : il donne ce qu'il faut savoir pour y toucher sans rien casser.

## Invariants

- **`VERSION` existe en DEUX exemplaires pour `serpentin/`** : dans `sw.js`,
  qui nomme le cache, et dans `index.html`, qui l'affiche dans le menu. Les
  changer **toutes les deux** à chaque modification d'un fichier de `SHELL`,
  sinon le téléphone continue d'afficher l'ancienne version. ⚠️ Elles ont
  dérivé de trois crans le 2026-09-02 — `sw.js` à `v52`, la page à `v49` : le
  cache se mettait bien à jour, mais le seul endroit où lire ce qui tourne
  mentait. Un essai de `chevalier-moteur.mjs` les compare.
- **Le dossier `echecs/` garde son nom** alors qu'il contient aussi les dames :
  l'adresse était déjà installée sur des téléphones, la renommer casserait ces
  installations.
- **Coquille et moteurs sont interchangeables** : `moteur-echecs.js` et
  `moteur-dames.js` exposent la même API publique (`nouvelle`, `coups`,
  `jouer`, `fin`, `piece`, `forme`, `trait`…), et l'interface appelle l'un ou
  l'autre sans savoir lequel. Ajouter une méthode à un moteur sans l'ajouter à
  l'autre casse ce contrat. Seul le bloc `__essais`, réservé aux scripts
  `perft`, porte les noms internes de chaque moteur et diffère volontairement.
- Chaque jeu est autonome (`index.html`, `manifest.json`, `sw.js`), les portées
  de service worker ne se chevauchent pas.

## Vérifier

Les contrôles vivent dans `tools/`, en Node, sans rien à installer :

```bash
node tools/perft.js
node tools/perft-dames.js
```

`perft` compte les coups légaux à plusieurs profondeurs et les compare à des
références connues : c'est ce qui prouve un moteur, pas une partie jouée à la
main. Les scripts `chevalier-*.mjs` et `echecs-*.mjs` couvrent le reste
(parcours, PWA en ligne, difficulté, icônes).

**Un service worker refuse `file://`.** Toute vérification passe donc par
`tools/serveur.mjs`, qui sert le dépôt sur `127.0.0.1`.

**Rien ne se règle au jugé.** Une difficulté, une vitesse, un équilibrage se
mesurent avec un banc. Et un banc ment tant qu'on n'a pas vérifié où il pose
sa cible : contrôler le banc avant de croire ses chiffres.

## Ajouter un jeu

Un dossier à la racine avec ses `index.html`, `manifest.json` et `sw.js`,
**plus** une ligne dans le tableau du `README.md` et une carte dans
l'`index.html` racine.

## Écriture

Textes en français. Les messages de commit disent **ce qui cassait** avant de
dire ce qui change.
