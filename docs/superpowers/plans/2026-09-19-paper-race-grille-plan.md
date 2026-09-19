# Paper Race, courses de 2 à 6 voitures : plan d'implémentation

Plan tiré de [la spec du 2026-09-19](../specs/2026-09-19-paper-race-grille-design.md).
Huit étapes. Chacune dit ce qu'on écrit, **la preuve qui doit passer avant de
continuer**, et si le jeu reste jouable.

Règle de travail : **le contrôle s'écrit avant le code qu'il contrôle**, et on
le voit échouer au moins une fois (défaut injecté) avant de le croire.

Rien n'est poussé avant l'étape 8 : la prod reste en v7 pendant tout le
chantier. Le relais (étape 6) se déploie AVANT le client, comme en v6.

## Ce qui existe et qu'on suit

- `tools/paper-race-moteur.js` : contrôles du moteur sans navigateur.
- `tools/paper-race-difficulte.js --controle` : parcours du fantôme et pars du
  championnat. Sa sortie actuelle est la référence de « championnat intact ».
- `tools/paper-race-relais.mjs`, `tools/paper-race-ligne.mjs` : relais local
  (`npx wrangler dev`, 127.0.0.1:8787) et course en ligne à plusieurs
  navigateurs.
- `tools/paper-race-pwa.mjs` : parcours Playwright Pixel 9, 360x640, iPhone.

⚠️ Deux-voitures codé en dur, à retrouver partout : `1 - race.turn`
(`collision`, `play`, `nextTurn`), `[0, 1].map` (`newRace`),
`R.cars[0].coups + R.cars[1].coups` (numéro de coup, ui.js et ligne.js),
`mode === 'solo' && R.turn === 1` (tour du fantôme), `1 - ligne.siege`,
`COUL = [BLEU, ROUGE]`, `n % 2` dans le relais.

⚠️ Fichiers en CRLF ; `VERSION` dans `sw.js` ET `ui.js` ; vérifier `git log`
avant chaque commit (d'autres sessions poussent dans `games/`).

---

## Étape 1 : les références, avant de toucher au moteur

**But** : savoir à coup sûr, plus tard, que le championnat n'a pas bougé et que
les nouvelles règles sont justes.

- Ranger la sortie actuelle de `paper-race-difficulte.js --controle` et de
  `paper-race-moteur.js` dans `tools/references/paper-race-v7.txt`.
- Écrire `tools/paper-race-equite.js` sur le VRAI moteur : 2, 4, 6 voitures,
  fantômes « normal », 40 courses par circuit, part des victoires par place.
  Il échoue si, à 6 sur les grands circuits, une place dépasse le double de la
  part juste (33 %), ou si une course à 3+ voitures est proposée sur un petit
  circuit. Option `--ordre fixe` pour le contrôle à rebours.

**Preuve** : le banc d'équité échoue (le moteur ne sait pas encore courir à
plus de deux). Rien d'autre ne change.

## Étape 2 : le moteur à N voitures

`moteur.js` :

- `newRace(i, laps, fin, opts)` ; sans `opts` : exactement la course
  d'aujourd'hui (`regles: 'classique'`, 2 voitures, Bleu commence).
- `opts = { n, grille, regles: 'grille' }` : `grilleDe(tk, n)` (rangées de 2
  puis de 3, 2 cases d'écart, dernière rangée sur la ligne), `grille` = la
  permutation tirée au sort (voiture i sur la place grille[i]).
- `bloqueur(race, from, to)` : la voiture la plus proche sur le segment ;
  `collision` et `play` s'en servent (plus de `1 - turn`).
- `nextTurn` : ordre qui tourne (`race.manche`, `race.ordre`), voitures
  arrivées sautées ; en fin de tour de jeu : aspiration (`race.dernier` passe à
  `{ type: 'aspiration', joueurs: [...] }` pour l'écran), puis fin de course si
  quelqu'un est arrivé dans ce tour.
- `race.fin = 'tour'` pour les courses à plusieurs ; `finie` en tient compte.
- `classement(race)` : arrivées du tour triées au photo-finish, puis les autres
  par `arc` ; ex aequo marqués.
- `coupsJoues(race)` : somme des coups de toutes les voitures (remplace les
  additions à deux dans ui.js et ligne.js).

Nouveaux contrôles dans `paper-race-moteur.js` : blocage par la PREMIÈRE voiture
de trois alignées ; aspiration donnée et refusée (sens opposé, à 3 cases,
voiture devant arrivée) ; photo-finish entre deux arrivées du même tour ;
ordre qui tourne qui saute une voiture arrivée ; grille sur piste pour 7
circuits × 2..6.

**Preuve** :
- anciens contrôles et `--controle` du championnat identiques octet pour octet
  à la référence de l'étape 1 ;
- banc d'équité vert, et ROUGE avec `--ordre fixe` ;
- chaque nouveau contrôle vu rouge une fois (règle retirée à la main).

Le jeu est inchangé à l'écran (rien ne passe encore `opts`).

## Étape 3 : six couleurs, et la maquette de l'écran

- Script `tools/paper-race-couleurs.mjs` : part de BLEU et ROUGE, cherche 4
  autres teintes, vérifie deux à deux la distance perçue en vision normale,
  deutéranope, protanope, tritanope, et le contraste sur le papier (#FAFBF8) et
  sur le bitume (#D6D8D1). Refuse toute paire sous le seuil.
- Maquette HTML autonome : piste Monza, 6 voitures numérotées, bandeau
  « À Vert, 3 sur 6 », pastille « Aspiration +1 », carte de classement 1re à
  6e avec « photo-finish ». Captures Pixel 9 et 360x640, audit (44 px, 24 px
  avant l'action, contraste), puis **relecture avant l'étape 4**.

**Preuve** : le script refuse une palette où l'on remet une paire trop proche ;
la maquette validée.

## Étape 4 : l'écran à N voitures, et « À deux » avec les nouvelles règles

`ui.js` :

- `COUL`, `NOMS` à 6 ; numéro dessiné sur chaque voiture et sur la minicarte ;
  toutes les boucles de dessin sur `R.cars` (trace, halo, voiture « partie »,
  minicarte, rejeu « Revoir la course »).
- `estFantome(p)` remplace `mode === 'solo' && R.turn === 1`.
- Bandeau de tour, pastille d'aspiration (même mécanique que `zonemsg`),
  carte de fin : classement.
- « À deux » passe à `regles: 'grille'` : grille tirée au sort, ordre qui
  tourne, aspiration, tous les circuits.
- Sauvegarde de course v3 (`n`, `grille`, `regles`, `manche`) ; une sauvegarde
  v2 se relit en `classique`. Le championnat garde `newRace(ti, 1, 'joueur')`.

**Preuve** : `paper-race-pwa.mjs` étendu (course à deux jusqu'au bout,
classement, Revoir la course, reprise après rechargement d'une sauvegarde v2
ET v3) sur Pixel 9, 360x640 et iPhone ; le championnat rejoué redonne le même
score qu'en v7 pour une même suite de coups.

Jouable : championnat identique, « À deux » nouvelle formule.

## Étape 5 : Grand Prix solo

- Accueil : quatrième choix « Grand Prix » dans « Qui joue ? » (ou choix du
  nombre de voitures sous « Seul » : trancher sur la maquette de l'étape 3),
  sélecteur 2 à 6, 4 par défaut, niveau des fantômes réutilisé.
- Circuits : les petits grisés dès 3 voitures, avec la raison écrite (« trop
  étroit pour doubler à plusieurs »), pas seulement grisés.
- Les fantômes jouent l'un après l'autre avec le délai actuel ; le joueur peut
  toucher « passer l'animation ».
- Pas de record ni de médaille en Grand Prix (le championnat les garde).

**Preuve** : Grand Prix à 6 sur Spa joué jusqu'au classement dans Playwright ;
petits circuits refusés à 3+ ; durée d'un tour de jeu à 6 mesurée (cible :
moins de 4 s d'attente entre deux coups du joueur).

## Étape 6 : le relais pr-2

`serveur-paper-race/worker.js` :

- Création : `{ circuit, places: n }` (2 par défaut) ; `jetons` à n places.
- Nouveau message `depart` (hôte seulement, avant le premier coup) :
  `{ grille, fantomes: [sièges] }`, rangé et renvoyé dans `etat`.
- Coup : `{ n, k, v }` ; accepté si `n` suit, et si `v` est le siège de
  l'expéditeur, ou un fantôme et l'expéditeur est l'hôte. Le relais ne calcule
  pas le tour : ce sont les téléphones qui ignorent un coup hors tour, tous de
  la même façon.
- `k = 10` : abandon (hôte seulement, pour un siège absent depuis 60 s) ; la
  voiture s'arrête et reste un obstacle.
- Salle sans `places` (v7) : règle actuelle `n % 2`, coups sans `v`.
- Revanche : l'hôte envoie une nouvelle `grille`.

**Preuve** : `paper-race-relais.mjs` étendu contre `wrangler dev` : 6 sièges,
7e refusé, coup d'un siège pour un autre refusé, coup fantôme d'un non-hôte
refusé, abandon, salle v7 intacte ; chaque refus vu accepté une fois en
retirant sa vérification. Puis **déploiement du relais** (`npx wrangler
deploy`) et même contrôle contre la prod.

## Étape 7 : la course en ligne à plusieurs

`ligne.js` :

- Salle : l'hôte choisit le nombre de voitures (grands circuits dès 3) ;
  liste des places (présent, en attente, fantôme) ; « Démarrer maintenant »
  qui transforme les places vides en fantômes.
- `rebatir` lit les coups `{ v, k }` et la grille ; ignore un coup hors tour.
- Fantômes : calculés par l'hôte seul, avec un aléa tiré d'une graine rangée
  dans `depart` (le rejeu chez les autres ne recalcule pas, il lit les coups).
- Coup choisi d'avance : pavé actif pendant l'attente, choix surligné, envoyé
  à son tour ; annulé et signalé s'il n'est plus possible.
- Absence : après 60 s, l'hôte envoie l'abandon ; message « Vert a quitté la
  course ».

**Preuve** : `paper-race-ligne.mjs` à 3 navigateurs + 1 fantôme contre le
relais local puis la prod : course jusqu'au classement identique sur les 3
écrans, un joueur qui recharge en pleine course et reprend sa place, un qui
quitte (abandon), revanche avec nouvelle grille, coup d'avance envoyé et coup
d'avance annulé. Salle à deux créée par le client v7 (fichier de prod) toujours
jouable avec le nouveau client.

## Étape 8 : livraison v8

- `VERSION` paper-race-v8 dans `sw.js` et `ui.js` ; `SHELL` à jour.
- Règles (`#regles`) : grille, ordre qui tourne, aspiration, photo-finish,
  petits circuits à deux.
- `games/README.md` (section v8) et `games/CLAUDE.md` (invariants : championnat
  sans `opts`, `bloqueur` jamais `1 - turn`, relais avant client).
- Tous les contrôles de nouveau : moteur, championnat = référence, équité,
  relais prod, ligne prod, PWA trois profils, hors ligne.
- Commit, `git log` vérifié, push ; contrôle de la prod après 10 min (cache de
  Pages) ; mémoire `projet_paper_race.md` mise à jour.
