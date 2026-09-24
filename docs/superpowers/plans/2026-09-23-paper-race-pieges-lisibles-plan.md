# Paper Race, des pièges qu'on comprend : plan d'implémentation

Plan tiré de [la spec du 2026-09-23](../specs/2026-09-23-paper-race-pieges-lisibles-design.md).
Six étapes. Chacune dit ce qu'on écrit, **la preuve qui doit passer avant de
continuer**, et si le jeu reste jouable.

Règle de travail : **le contrôle s'écrit avant le code qu'il contrôle**, et on le
voit échouer au moins une fois (défaut injecté) avant de le croire. ⚠️ Rappel du
20 septembre : un contrôle ajouté à la va-vite échouait en permanence sans que je
le voie. Vérifier où le banc pose sa cible AVANT de le croire.

Rien n'est poussé avant l'étape 6 : la prod reste en v15 pendant le chantier.

## Ce qui existe et qu'on suit

- `paper-race/rendu.js` : `pieges(c, tk)` dessine les trois zones dans le DÉCOR,
  qui est mis en cache une fois par course (`buildTerrain`, `terrain = null` pour
  l'invalider). Les neuf points visés, eux, se dessinent à chaque image.
- `paper-race/ui.js` : `renderInfo` remplit `#zonemsg` quand la voiture EST sur
  un piège (`contrainte(R.track, car)`).
- `paper-race/moteur.js` : `zoneDe(tk, x, y)` dit à quelle zone appartient une
  case ; les zones sont des rectangles en cases, sur toute la largeur de piste.
- Contrôles : `tools/paper-race-grille.mjs` (parcours à plusieurs, pièges),
  `tools/paper-race-ui.mjs` (contraste, 44 px, focus), `paper-race-circuits.js`
  (pars), `paper-race-reference.js --controle` (330 courses).

⚠️ Fichiers en CRLF ; `VERSION` dans `sw.js` ET `ui.js` ; `rendu.js` se charge
AVANT `ui.js` ; vérifier `git log` avant chaque commit.

---

## Étape 1 : la forme des pièges, et son contrôle

**But** : pouvoir mesurer, hors navigateur, que le dessin couvre toute la zone.

- Nouveau `paper-race/formes.js` : géométrie PURE (aucun canvas, aucun DOM),
  requérable en Node comme `moteur.js`. Il expose `contourPiege(rect, marge,
  amplitude)` qui rend le polygone ondulé d'une zone, et `dansPolygone(p, poly)`.
- Nouveau `tools/paper-race-pieges.js` : pour les 11 circuits et chaque zone,
  toute case piégée (son centre ET ses quatre coins) doit être dans le polygone.
  Il échoue aussi si le polygone sort de la carte.

**Preuve** : le contrôle passe avec une marge positive, et ÉCHOUE quand on met
une marge négative (le contour rentre dans la zone). Les deux sens vérifiés.

Le jeu ne change pas encore : personne n'utilise `formes.js`.

## Étape 2 : la flaque, la tache, et les règles illustrées

- `rendu.js` : `pieges()` utilise `contourPiege` et dessine la flaque (liseré
  mouillé, dégradé, reflets) et la tache d'huile (noire, irisée, éclaboussures).
  L'accélérateur ne change pas. Le dessin de CHAQUE piège sort dans une fonction
  `dessinPiege(ctx, type, rect, cellPx)`, pour servir aussi ailleurs.
- `index.html` : la feuille « ? » remplace sa ligne sur les pièges par trois
  petites zones dessinées par `dessinPiege`, chacune avec son effet en une ligne.
- `sw.js` : `formes.js` entre dans `SHELL`.

**Preuve** :
- contrôle de l'étape 1 toujours vert avec le vrai dessin ;
- `paper-race-grille.mjs` étendu : les trois dessins existent dans la feuille des
  règles (trois canevas non vides), vu rouge en retirant l'un d'eux ;
- captures Pixel 9 et iPhone, clair et sombre, des trois pièges à l'échelle du
  jeu, **regardées** avant de continuer ;
- `paper-race-ui.mjs` vert (la feuille des règles a changé).

Jouable : les pièges se voient, leur effet s'apprend dans les règles.

## Étape 3 : les neuf points visés disent où ils tombent

- `rendu.js` : un point visé qui atterrit dans une zone porte une pastille de la
  couleur du piège (bleu, noir, jaune), lisible sur le bitume comme sur le vert.
- Ces pastilles suivent l'option « aide au prochain coup » ? **Non** : elles
  disent ce qui EST sur la piste, pas ce qui va se passer ensuite. Elles restent
  toujours affichées, comme la piste elle-même.

**Preuve** : dans `paper-race-grille.mjs`, sur un circuit avec pièges, on place
la voiture devant une zone et on vérifie que les points qui tombent dedans (et
EUX SEULS) portent la pastille ; vu rouge en retirant la règle.

## Étape 4 : la pastille flotte, et prévient avant de tracer

- `index.html` : `#zonemsg` quitte la colonne et devient une pastille posée sur
  le plateau (`position:absolute`, en haut, comme `#rejeubox`), largeur bornée
  pour ne jamais recouvrir la mini-carte. Elle prend la couleur du piège.
- `ui.js` : quand le point choisi tombe dans une zone, la pastille annonce
  l'effet AVANT de tracer, avec les mots des règles (« Tu finis dans la flaque :
  ensuite, tu ne pourras que freiner »). Quand la voiture EST déjà dans une zone,
  ce message-là garde la priorité. La pastille reste tant que la situation dure.
- La cinématique passe par-dessus pendant son ralenti.

**Preuve** :
- **le jeu ne bouge plus** : la position du plateau est identique au pixel près
  avec et sans message (vu rouge en remettant le bandeau dans la colonne) ;
- viser un point qui tombe dans un piège fait apparaître la pastille avant le
  tracé, et elle disparaît quand on vise ailleurs ; vu rouge en retirant la règle ;
- quand la voiture est déjà dans la zone, ce message garde la priorité ;
- la pastille ne recouvre pas la mini-carte, sur Pixel 9 et à 360 x 640.

## Étape 5 : rien d'autre n'a bougé

- `paper-race-reference.js --controle` : 330 courses identiques.
- `paper-race-circuits.js` : pars des 11 circuits inchangés.
- `paper-race-moteur.js`, `paper-race-traces.js --controle`,
  `paper-race-couleurs.mjs --controle`, `paper-race-pwa.mjs`,
  `paper-race-installer.mjs`.
- En ligne (relais local puis PROD) : `paper-race-relais.mjs`,
  `paper-race-ligne.mjs`, `paper-race-ligne-plusieurs.mjs`. ⚠️ Toujours contre le
  VRAI relais avant de conclure.

## Étape 6 : livraison v16

- `VERSION` paper-race-v16 dans `sw.js` ET `ui.js` ; `SHELL` à jour.
- `README.md` (section v16 : pourquoi le bleu n'était pas compris, ce qu'on a
  changé) et `CLAUDE.md` (invariant : un piège se dessine par `dessinPiege`, le
  dessin couvre toujours la zone, `formes.js` est pur et testé hors navigateur).
- Tous les contrôles, commit, `git log` vérifié, push, contrôle de la prod
  10 minutes après (cache de Pages), mémoire mise à jour.

---

## Ce qui a changé en route (24 septembre)

- **Les contrôles des étapes 3 et 4 vivent dans un outil à eux**,
  `tools/paper-race-pieges-vus.mjs`, et non dans `paper-race-grille.mjs` : ce
  dernier parle des courses à plusieurs, pas du dessin. L'outil lit les PIXELS du
  plateau à l'endroit des pastilles, mesure le contraste de la pastille en clair
  et en sombre, et vérifie que le plateau ne bouge pas d'un pixel.
- **La pastille se range en haut à GAUCHE**, pas au centre : centrée, sa largeur
  devait tenir entre les deux côtés de la mini-carte, soit une centaine de
  pixels, donc quatre lignes de texte en travers du plateau.
- **Priorité au message de la case où l'on est**, comme prévu : c'est lui qui
  explique les cases grisées du pavé.
- `paper-race-pwa.mjs` disait « mouillée » : il dit « flaque », comme les règles.
