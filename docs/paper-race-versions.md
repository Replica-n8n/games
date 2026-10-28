# Paper Race : versions

Numéro en trois chiffres, `majeur.mineur.correctif`, dans `paper-race/sw.js`
(`VERSION = "paper-race-x.y.z"`), qui nomme le cache hors ligne. Le menu
l'affiche (« x.y.z · … »). Il est recopié en tête de `paper-race/ui.js`, ce
n'est pas une deuxième source mais un témoin : `ui.js` vient du cache, et
s'il ne dit pas la même chose que le service, un fichier d'une autre version
s'est glissé dans le cache et le menu propose « Réparer ».
`tools/paper-race-pwa.mjs` refuse deux valeurs différentes.

- **majeur** : une ancienne sauvegarde ne marcherait plus (aucun jusqu'ici) ;
- **mineur** : du nouveau (circuits, modes, dessin) ;
- **correctif** : corrections et retouches.

Ne pas confondre avec `REGLES` (`moteur.js`), la version des règles que le
relais compare en ligne, ni avec `WORKER_VERSION` du relais (`pr-4`).

Jusqu'au 2026-10-17, le numéro était un compteur (`circuit-v1`, puis
`paper-race-v1` à `paper-race-v24`), augmenté à chaque publication. Le
`README.md` raconte l'histoire du jeu avec ces anciens numéros. Correspondance,
reconstruite d'après l'historique :

| Version | Ancien compteur | Date | Contenu |
|---|---|---|---|
| 1.0.0 | v1 | 2026-09-18 | Le dossier s'appelle paper-race/ (avant : circuit/, jamais publié) |
| 1.0.1 | v2 | 2026-09-18 | « Revoir la course » montre la course, les pièges servent |
| 1.0.2 | v3 | 2026-09-18 | L'accueil dit Paper Race, nouvelle icône |
| 1.1.0 | v4 | 2026-09-18 | Un championnat de vrais circuits |
| 1.1.1 | v5 | 2026-09-18 | « Installer le jeu » marche sur iPhone |
| 1.2.0 | v6 | 2026-09-18 | La course en ligne à deux |
| 1.2.1 | v7 | 2026-09-18 | Médailles plus dures, « normal » et « vite » se distinguent |
| 1.3.0 | v8 | 2026-09-19 | Courses jusqu'à six voitures, Bleu ne commence plus toujours |
| 1.4.0 | v9 | 2026-09-19 | En ligne à six, pièges en option, revoir la course au ralenti |
| 1.4.1 | v10 | 2026-09-19 | En ligne, les écrans ne se désaccordent plus |
| 1.4.2 | v11 | 2026-09-19 | Les vrais circuits ressemblent à leur original |
| 1.5.0 | v12 | 2026-09-19 | On voit le virage qui arrive, aide au prochain coup en option |
| 1.5.1 | v13 | 2026-09-19 | Audit complet, un toucher qui choisit de nouveau |
| 1.5.2 | v14 | 2026-09-19 | Recharger la page ne fait plus rater un coup (relais pr-3) |
| 1.5.3 | v15 | 2026-09-20 | À deux on alterne, le drapeau de victoire se voit |
| 1.6.0 | v16 | 2026-09-24 | Les pièges sont dessinés |
| 1.6.1 | v17 | 2026-09-24 | Coincée, la voiture file dans le mur (relais pr-4) |
| 1.6.2 | v18 | 2026-09-24 | Le code des salles v7 retiré |
| 1.6.3 | v19 | 2026-09-24 | On ne roule plus à contresens |
| 1.6.4 | v20 | 2026-09-24 | Dans le mur pour de vrai, plus de demi-tour |
| 1.7.0 | v21 | 2026-09-30 | Le bord de piste (upgrade graphique, étape 1) |
| 1.8.0 | v22 | 2026-09-30 | Le drapeau d'arrivée ondule (étape 2) |
| 1.9.0 | v23 | 2026-09-30 | Les voitures deviennent des monoplaces (étape 3) |
| 1.9.1 | v24 | 2026-09-30 | Le ralenti télé net (étape 4) |
| 1.9.2 | (aucun) | 2026-10-17 | Le numéro passe en trois chiffres |
