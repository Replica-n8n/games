# Échecs et Dames : versions

Numéro en trois chiffres, `majeur.mineur.correctif`, écrit UNE fois dans
`echecs/sw.js` (`VERSION = "damier-x.y.z"`) : il nomme le cache hors ligne. Le jeu
ne l'affiche nulle part.

- **majeur** : une ancienne sauvegarde ne marcherait plus (aucun jusqu'ici) ;
- **mineur** : du nouveau (un jeu, une fonction) ;
- **correctif** : corrections et retouches.

Jusqu'au 2026-10-17, le numéro était un compteur (`echecs-v1` à `echecs-v4`, puis
`damier-v5` à `damier-v10`), augmenté à chaque publication. Correspondance,
reconstruite d'après l'historique :

| Version | Ancien compteur | Date | Contenu |
|---|---|---|---|
| 1.0.0 | echecs-v1 | 2026-08-27 | Les échecs à deux sur un seul téléphone |
| 1.1.0 | echecs-v2 | 2026-08-27 | Écran de fin de partie |
| 1.2.0 | echecs-v3 | 2026-08-27 | Les pièces qui peuvent parer un échec se montrent |
| 1.3.0 | echecs-v4 | 2026-08-27 | Installer depuis le menu |
| 1.4.0 | damier-v5 | 2026-08-27 | Les dames rejoignent les échecs |
| 1.4.1 | damier-v6 | 2026-09-15 | Les panneaux ne cachent plus le plateau |
| 1.4.2 | damier-v7 | 2026-09-15 | Une mise à jour n'efface plus le hors ligne des autres apps |
| 1.4.3 | damier-v8 | 2026-09-17 | Le zoom est permis, la page a une description |
| 1.4.4 | damier-v9 | 2026-09-17 | L'icône n'apparaît plus collée au milieu au chargement |
| 1.4.5 | damier-v10 | 2026-09-18 | Une mise à jour juste après une publication prend le nouveau code |
| 1.4.6 | (aucun) | 2026-10-17 | Le numéro passe en trois chiffres |
