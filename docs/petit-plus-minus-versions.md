# Petit Plus contre Petit Minus : versions

Numéro en trois chiffres, `majeur.mineur.correctif`, écrit UNE fois dans
`petit-plus-minus/sw.js` (`VERSION = "ppm-x.y.z"`) : il nomme le cache hors
ligne. La page peut le demander au service (`window.ppm.versionDuService()`),
mais ne l'affiche pas.

- **majeur** : une ancienne sauvegarde ne marcherait plus (aucun jusqu'ici) ;
- **mineur** : du nouveau (un outil, du contenu) ;
- **correctif** : corrections et retouches.

Jusqu'au 2026-10-17, le numéro était un compteur (`ppm-6` à `ppm-22` ; les
premiers numéros n'ont jamais été publiés), augmenté à chaque publication.
Correspondance, reconstruite d'après l'historique :

| Version | Ancien compteur | Date | Contenu |
|---|---|---|---|
| 0.1.0 | ppm-6 | 2026-09-26 | Étapes 1 à 5, pas encore en ligne |
| 1.0.0 | ppm-8 | 2026-09-26 | Mise en ligne, bouton Installer |
| 1.1.0 | ppm-9 | 2026-09-26 | 25 phrases de courage vérifiées, par thème |
| 1.2.0 | ppm-10 | 2026-09-26 | « Mes Minus » : l'enfant choisit ses peurs avec un adulte |
| 1.2.1 | ppm-11 | 2026-09-27 | Corrections de la vérification des parcours |
| 1.2.2 | ppm-12 | 2026-09-27 | Accueil plus clair, « Mes Minus » confirme chaque choix |
| 1.2.3 | ppm-13 | 2026-09-27 | SOS fiable au retour, phrase rendue, indice, aide au parent |
| 1.2.4 | ppm-14 | 2026-09-27 | Deux régressions corrigées |
| 1.3.0 | ppm-15 | 2026-09-27 | La boîte à outils remplace le jeu à étapes |
| 1.3.1 | ppm-16 | 2026-10-01 | Le calme sous le pouce, l'accueil remplit l'écran |
| 1.3.2 | ppm-17 | 2026-10-01 | Le robot ne reste plus pendant « Spaghetti… » |
| 1.4.0 | ppm-18 | 2026-10-01 | « Mes petits pas », l'escalier d'une peur |
| 1.5.0 | ppm-19 | 2026-10-02 | « Petit yoga », cinq postures |
| 1.5.1 | ppm-20 | 2026-10-02 | Pour les grands : avertissements au parent retirés |
| 1.5.2 | ppm-21 | 2026-10-02 | L'escalier et les peurs de Minus ne sont plus mélangés |
| 1.5.3 | ppm-22 | 2026-10-02 | « Réponds à Minus » dit qu'il faut toucher une phrase |
| 1.5.4 | (aucun) | 2026-10-17 | Le numéro passe en trois chiffres |
