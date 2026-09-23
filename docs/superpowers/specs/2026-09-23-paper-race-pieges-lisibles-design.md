# Paper Race : des pièges qu'on comprend sans notice

Date : 2026-09-23. Statut : conception validée, à relire avant le plan.

## Pourquoi

Un joueur n'a pas compris les pièges : il ne savait pas que les portions bleues
étaient des zones mouillées. Le dessin actuel ne ressemble à rien de connu (une
bande hachurée), rien ne le nomme, et le seul message arrive une fois la voiture
dedans, donc trop tard pour anticiper.

Les jeux de course résolvent ça autrement : le piège est un OBJET reconnaissable
(flaque, tache d'huile, plaque de verglas), l'effet se voit au moment où on le
subit, et la piste prévient avant. Une différence compte chez nous : nos courses
font UN tour, là où un jeu de course en fait trois. Le joueur croise donc chaque
piège une seule fois : il doit comprendre du premier coup d'œil.

Son choix, après avoir vu les maquettes : **le dessin seul, sans mot peint sur la
piste**. L'effet s'apprend donc ailleurs (règles illustrées, avertissement au
moment de viser).

## 1. Le dessin des pièges (`rendu.js`, fonction `pieges`)

Trois objets, dessinés pareil sur les 11 circuits :

- **Flaque d'eau** : contour ondulé, liseré mouillé plus clair à l'intérieur,
  dégradé bleu (plus sombre au centre), trois ou quatre reflets blancs.
- **Tache d'huile** : noire, irisée (violet, vert, cuivre) et quelques
  éclaboussures autour de la zone.
- **Accélérateur** : inchangé (chevrons jaunes orientés dans le sens de la
  marche). Il est déjà compris : c'est la convention des jeux de course.

⚠️ **Le dessin couvre toute la zone piégée, jamais moins.** Une zone est un
rectangle en cases ; le contour ondulé déborde vers l'EXTÉRIEUR (marge d'une
demi-case au moins) et se découpe aux bords de la piste. Sinon une case piégée
serait hors du dessin, et le joueur croirait passer à côté.

## 2. Les règles illustrées (feuille « ? »)

La ligne actuelle sur les pièges est remplacée par les TROIS dessins, tels qu'ils
apparaissent sur la piste, chacun avec son effet :

| Dessin | Effet |
|---|---|
| Flaque d'eau | Tu ne peux que freiner |
| Tache d'huile | Ta vitesse ne change plus |
| Chevrons jaunes | Une case de plus |

Les dessins viennent du même code que la piste (une petite fonction de rendu
partagée), pour qu'ils ne divergent jamais. Les mots employés ici sont ceux des
messages en course.

## 3. Prévenir au moment de viser (`rendu.js`, `ui.js`)

- **Les neuf points visés** : ceux qui tombent dans un piège portent une pastille
  de la couleur du piège (bleu, noir, jaune). On voit où l'on finit avant de
  choisir.
- **Le point choisi** : le bandeau sous le plateau annonce l'effet AVANT de
  tracer, avec les mots des règles : « Tu finis dans la flaque : ensuite, tu ne
  pourras que freiner. »
- **Une fois dedans** : le message actuel reste, avec les mêmes mots.

## 4. Le bandeau flotte au lieu de pousser le jeu

Elle l'a vu en jouant : quand le bandeau apparaît, il pousse le plateau vers le
haut, et tout redescend quand il part. C'est qu'il est un bloc de la colonne
(`flex:0 0 auto`), entre le plateau et le pavé, alors que les deux autres
messages flottent déjà par-dessus le plateau (la cinématique en haut, les
messages passagers en bas).

- **Il devient une pastille posée sur le plateau**, en haut, au même endroit que
  la cinématique : plus aucun déplacement du jeu quand il apparaît ou disparaît.
- **Il reste tant que la situation dure.** Ce n'est pas un message passager : il
  décrit un état (« tu es dans la flaque », « tu finis dans la flaque »). Elle l'a
  dit : on avait à peine le temps de le lire.
- **Il porte la couleur du piège**, comme les pastilles des points visés.
- **La cinématique passe par-dessus** le temps de son ralenti, puis la pastille
  revient.
- **Les messages passagers** (aspiration, accrochage, sortie de piste) ne
  changent pas : ils restent en bas et disparaissent, ce qui est leur rôle.
- ⚠️ La pastille ne doit jamais recouvrir la mini-carte (en haut à droite sur les
  grands circuits) : sa largeur est bornée, et un contrôle le vérifie.

## Ce qu'on ne fait pas

- Aucun mot peint sur la piste (son choix).
- Aucune carte de tutoriel au départ : elle serait fermée sans être lue.
- Aucun son : le jeu se joue souvent en silence.
- Aucun changement de règle : pars, médailles, records et tracés ne bougent pas.

## Contrôles

- **Couverture** : pour chaque circuit et chaque zone, toute case piégée est sous
  le dessin (contrôle géométrique, pas un coup d'œil). Il échoue si le contour
  rentre à l'intérieur de la zone.
- **Captures** des trois pièges à l'échelle du jeu (Pixel 9, iPhone), en clair et
  en sombre, pour juger à l'œil.
- **Avertissement** : viser un point qui tombe dans un piège fait apparaître la
  pastille avant de tracer ; prouvé en retirant la règle.
- **Le jeu ne bouge plus** : on mesure la position du plateau avec et sans
  message, elle doit être identique au pixel près ; et la pastille ne recouvre
  pas la mini-carte.
- **Pastilles** : parmi les neuf points, seuls ceux qui tombent dans une zone
  portent la pastille.
- **Règles illustrées** : les trois dessins sont présents dans la feuille « ? »,
  et `paper-race-ui.mjs` repasse dessus (contraste, 44 px, focus).
- **Rien d'autre ne bouge** : `paper-race-reference.js --controle` (330 courses)
  et `paper-race-circuits.js` (pars des 11 circuits) restent verts.
