# games

Un jeu PWA par dossier (`echecs/`, `serpentin/`, `paper-race/`). Vanilla JS, **aucune
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
- **`paper-race/` : le dessin est dans `rendu.js`, le jeu dans `ui.js`** (scripts
  classiques : ils partagent leurs noms globaux, et `rendu.js` se charge AVANT
  `ui.js` car il donne `$`, le canevas et `render()`. Les branchements de
  « Revoir la course » attendent `brancherRevue()`, appelé par `ui.js`, sinon ils
  s'exécuteraient avant que `ui.js` existe).
- **`paper-race/` : `VERSION` en deux exemplaires** aussi, dans `sw.js` et en tête
  de `ui.js`. `tools/paper-race-pwa.mjs` les compare, vérifie que chaque `$('id')`
  de `ui.js` existe dans le HTML, et compare le cache installé au dépôt.
- **`paper-race/` : son `CLAUDE.md` d'origine est devenu cette section.** Ce qui
  est fragile : la carte d'avancement (`champ`, `avanceDe`) ne doit JAMAIS
  revenir à une mesure angulaire (l'ordinateur se garait dans les virages
  larges) ; dans `aiChoice` la survie est un FILTRE, jamais un objectif
  (sinon l'arrêt devient le plus sûr) ; les îlots d'un circuit forment un seul
  bloc loin du bord, couloir de 5 cases ; le décor se dessine une fois
  (`terrain = null` pour l'invalider). Le quadrillage reste comptable : pas de
  perspective sur la surface de jeu. Volontairement absents : défi quotidien,
  classement, série de jours, éditeur de circuit.
- **`paper-race/` : l'ordre de `TRACKS` EST le championnat** (`ORDRE` dans
  `moteur.js`), rangé par difficulté mesurée ; `paper-race-difficulte.js
  --controle` échoue s'il ne l'est plus. Les sauvegardes et réglages désignent
  un circuit par son `id`, jamais par son numéro (l'ordre a changé en v4). Un
  tracé ajouté passe `paper-race-circuits.js` : pas de raccourci, par exact.
- **`paper-race/` : les pièges se posent sur une ligne droite, avant un
  virage**, sur toute la largeur de la piste (dans un virage, ils sont mortels).
  Après tout changement de piège ou de niveau : recalculer les pars
  (`paper-race-circuits.js` les vérifie) et relancer `paper-race-niveaux.js`.
- **`paper-race/` : un piège se DESSINE, il ne se devine pas.** Un joueur n'avait
  pas compris que le bleu voulait dire mouillé. `formes.js` (géométrie PURE,
  requérable en Node comme `moteur.js`) donne le contour ; `dessinPiege` de
  `rendu.js` dessine la flaque, la tache d'huile et les chevrons, et sert AUSSI
  aux vignettes de la feuille des règles, pour que les deux ne divergent jamais.
  Le contour ENGLOBE toujours la zone (`tools/paper-race-pieges.js` le mesure
  hors navigateur) : plus petit, il ferait croire qu'on passe à côté. Les mots
  des pièges vivent dans `MOTS` (`ui.js`) et sont les mêmes dans les règles, en
  visant et une fois dedans. `#zonemsg` est une pastille POSÉE sur le plateau :
  la remettre dans la colonne ferait sauter le plateau quand elle apparaît.
  `tools/paper-race-pieges-vus.mjs` mesure tout ça dans le navigateur.
- **`paper-race/` : `REGLES` (dans `moteur.js`) est la version des RÈGLES**, pas
  du code. À augmenter à CHAQUE règle qui change le résultat d'un coup : en
  ligne, chaque téléphone rejoue la course avec son propre moteur, et le relais
  (pr-4) refuse de mélanger deux versions dans une salle. L'oublier, c'est deux
  écrans qui divergent pour de bon dès qu'un téléphone n'est pas à jour. 2 = v17
  (coincé en roulant, la voiture file dans le mur au lieu de s'arrêter net).
- **`paper-race/` : le seul accès réseau est la course EN LIGNE** (`ligne.js`,
  relais `serveur-paper-race/`). Seul, à deux sur un téléphone, le
  championnat : hors ligne, toujours. Le relais ne connaît pas les règles, il
  ordonne les coups ; un coup = une case du pavé (0 à 8) ou 9 (« coincé »).
  Relais pr-4 : la salle retient `regles`, un téléphone d'une autre version est
  refusé (code 4026, et le message `erreur` « version » part AVANT la fermeture,
  qui peut traîner 10 s). Relais pr-3 : le WebSocket s'accepte AVANT de lire l'état (sinon un coup joué
  entre les deux est perdu pour celui qui se connecte), et un client qui voit un
  numéro de coup en avance reprend le fil auprès du relais.
  Relais pr-2 (v9) : 2 à 6 places, un coup = { v : voiture, k : 0-9, 10 abandon } ;
  il vérifie QUI joue quelle voiture, pas à qui c'est le tour : chaque téléphone
  ignore pareil un coup hors tour. Les fantômes en ligne sont calculés par
  l'hôte seul. Une salle sans `places` est une salle v7 et garde ses règles.
  Toute règle ajoutée au moteur doit rester sans hasard, sinon les deux
  téléphones ne verraient plus la même course. Déployer le relais AVANT de
  publier un jeu qui s'en sert.
- **`paper-race/` : le championnat crée ses courses SANS options**
  (`newRace(ti, 1, 'joueur')`) : c'est la course de la v7, et
  `paper-race-reference.js --controle` vérifie que les courses classiques (330 depuis v11)
  restent identiques. Les courses à plusieurs passent `regles: 'grille'`. Dans
  le moteur, une autre voiture se trouve par `bloqueur` et les tours par
  `nextTurn` : plus jamais `1 - turn`. À plus de deux voitures, seulement les
  grands circuits (`pelotonPermis`). Les couleurs de voiture se recalculent avec
  `paper-race-couleurs.mjs`, jamais à l'œil.
- **`paper-race/` : un tracé qui porte le nom d'un vrai lieu doit lui ressembler.**
  Les vrais tracés se construisent avec `tools/paper-race-traces.js` depuis
  `tools/donnees/circuits/` (MIT, garder la licence), jamais à la main ; un
  circuit dessiné à la main prend un nom inventé. Ajouter un circuit : l'insérer
  dans `ORDRE` à sa place MESURÉE, donner `par` et `parSans` (le solveur), et ne
  jamais changer l'`id` d'un circuit existant (records et sauvegardes y tiennent).
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
