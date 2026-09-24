# Paper Race, coincé contre le mur : plan d'implémentation

Plan tiré de [la spec du 2026-09-24](../specs/2026-09-24-paper-race-coince-mur-design.md).
Règle de travail : le contrôle s'écrit AVANT le code, on le voit rouge, puis vert.

## Étape 1 : la règle, dans le moteur

- `tools/paper-race-moteur.js` : trois cas (mur, voiture qui bouche, arrêt),
  écrits d'abord, vus rouges avec l'ancien `stuck`.
- `moteur.js` : `stuck` joue le point projeté par `play` quand la voiture roule ;
  `REGLES = 2` exporté.
- `tools/paper-race-reference.js` : régénérer la référence, et prouver que les
  courses changées sont EXACTEMENT celles qui contiennent un « coincé ».
- Vert : moteur, circuits (pars), niveaux, difficulté (`--controle`), équité.

## Étape 2 : l'écran

- `ui.js` : `forceArret` passe par l'animation d'un coup joué (extraire de
  `commit` ce qui suit le calcul du coup) ; message et bouton selon la spec.
- Contrôle navigateur (nouvel outil `tools/paper-race-coince.mjs`) : voiture
  lancée vers un mur sans point jouable → bouton « Tout droit dans le mur », la
  voiture arrive sur la case prévue par `crashPoint`, le message le dit. Vu rouge
  avec l'ancienne règle.

## Étape 3 : le relais pr-4 et la version des règles

- `serveur-paper-race/worker.js` : `regles` à la création, comparé à la
  connexion, refus 4026 ; `WORKER_VERSION = 'pr-4'`.
- `ligne.js` : envoie `regles` à la création et à la connexion ; 4026 → message.
- `tools/paper-race-relais.mjs` étendu (les quatre cas de la spec), vu rouge sur
  pr-3.
- Relais local : `paper-race-relais.mjs`, `paper-race-ligne.mjs`,
  `paper-race-ligne-plusieurs.mjs`.

## Étape 4 : livraison v17

- Tous les contrôles (dont UI, PWA, grille, pièges vus, installer).
- ⚠️ Déployer le relais pr-4 AVANT de pousser le jeu ; vérifier `GET /`.
- `VERSION` v17 (`sw.js`, `ui.js`), README, CLAUDE.md, commit, push.
- Prod : `JEU=… paper-race-ligne.mjs` et `paper-race-ligne-plusieurs.mjs`,
  mémoire.
