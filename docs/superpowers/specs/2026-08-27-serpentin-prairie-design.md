# Serpentin : la prairie

Spec de conception, 2026-08-27. Premier jeu de serpent du dépôt `games/`.

## Pourquoi

Le jeu visé, `Sneak.io` de Hangover Studios sur le Play Store, est un clone de
slither.io : arène, orbes à manger, on meurt quand sa tête touche le corps d'un
autre. Sa fiche annonce « Contains ads », « In-app purchases » et un partage
d'identifiants d'appareil avec des tiers.

On refait le jeu en PWA : pas de pub, pas d'achat, pas de traceur, pas de
compte, et il marche hors ligne.

**La cible est un enfant de 8 ans.** Cette phrase tranche la plupart des choix
qui suivent : couleurs franches, formes grosses, rien à lire, et on ne meurt
jamais sans avoir vu ce qui nous a tué.

## Périmètre

Livré dans cette version :

- un monde, **la prairie**, jouable de bout en bout
- les potions, la progression par expérience, les quêtes, les apparences
- la PWA complète, installable, hors ligne

Pas livré, et assumé :

- le volcan, le château, le vaisseau. Leur emplacement est prévu dans
  `mondes.js` et les paliers d'expérience les annoncent, mais ils ne sont pas
  écrits.
- les dangers vivants (lave qui coule, lasers, herse)
- le son
- le multijoueur en ligne, qui demanderait un serveur et ferait perdre le hors
  ligne

## Le jeu

### La boucle

Une arène circulaire. On mange des fleurs, on s'allonge, on essaie de faire
mourir les autres serpents, on récolte ce qu'ils laissent. Une partie dure de
une à cinq minutes et se termine par la mort.

### Ce qui tue

**Seuls les autres serpents tuent.** Si ta tête touche le corps d'un autre, tu
meurs. Si un autre touche ton corps, il meurt et laisse des fleurs.

Deux écarts délibérés par rapport au jeu d'origine, parce que la cible a 8 ans :

- **les buissons ne tuent pas** : au contact, la vitesse tombe à 60 % pendant
  une seconde et on perd 5 % de sa longueur, une fois par seconde au plus
- **le bord ne tue pas** : la direction est projetée sur la tangente, on glisse
  le long de la haie

Conséquence voulue : toute mort vient d'une chose qui bougeait à l'écran.

### Foncer

Le boost multiplie la vitesse par 1,9 et coûte de la longueur en continu. Il
s'arrête tout seul en dessous de 8 anneaux. C'est ce qui permet de couper la
route d'un plus gros, donc c'est le seul geste tactique du jeu.

### Valeurs de départ

À régler à la main pendant l'implémentation, rassemblées dans un objet
`REGLAGES` en tête de `moteur.js` :

| Réglage | Départ |
|---|---|
| rayon de l'arène | 1400 unités |
| fleurs présentes | 450 |
| longueur de départ | 10 anneaux |
| vitesse | 2,4 unités par image |
| vitesse en fonçant | x 1,9 |
| coût du boost | 1 unité de longueur par 100 ms |
| une fleur mangée | + 1 point, + 2 unités de longueur |
| un serpent mort | une fleur tous les 12 unités, 3 points la fleur |
| rayon du serpent | 4 + min(14, longueur x 0,012) |

## Les contrôles

**Manche flottant.** Le pouce se pose n'importe où dans la moitié basse de
l'écran, un cercle apparaît là, et le serpent va dans la direction où l'on
tire. Le pouce ne remonte jamais en haut de l'écran.

**Bouton pour foncer**, rond, en bas à droite, sous le pouce, maintenu.
Il est visible en permanence : une fonction que rien n'annonce n'existe pas.

Cible tactile d'au moins 44 px pour les deux.

## Les potions

Une fiole apparaît au sol toutes les 20 secondes environ, trois au maximum en
même temps, et disparaît au bout de 25 secondes si personne ne la ramasse. On
la prend en passant dessus.

L'effet dure 10 secondes, montré par un anneau qui se vide autour de la tête et
par la couleur du serpent. Un seul effet à la fois : une nouvelle potion
remplace l'ancienne et repart de 10 secondes.

| Potion | Effet |
|---|---|
| **Feu** | ton serpent tue celui qu'il touche, sans mourir |
| **Fantôme** | tu traverses les autres serpents sans mourir |
| **Aimant** | les fleurs à moins de 160 unités viennent à toi |

Glace et éclair sont réservées au volcan et au vaisseau.

**Les bots ne ramassent pas les potions dans cette version.** Un bot en feu qui
tue un enfant sans qu'il comprenne pourquoi est le pire résultat possible. À
rouvrir après le premier essai réel.

## Les adversaires

Trois comportements :

- **brouteur** : va à la fleur la plus proche, évite les obstacles et le bord
- **chasseur** : coupe la route du joueur quand il est plus long que lui
- **peureux** : s'écarte de tout serpent plus long que lui

La difficulté monte pendant la partie et avec le niveau du joueur :

- nombre de bots : `8 + score / 400`, plafonné à 22
- agressivité : `min(1 ; 0,15 + score / 6000 + niveau / 40)`, c'est la part de
  bots tirés en chasseur plutôt qu'en brouteur

Le terme en `niveau` est indispensable : sans lui, un enfant de niveau 18, avec
ses potions longues et son boost bon marché, trouverait la prairie vide de
danger et arrêterait de jouer.

## La progression

L'expérience d'une partie vaut **le score divisé par 10**, arrondi à l'entier
inférieur, gagnée même quand on meurt bêtement. Repères visés : une partie
ratée de débutant rapporte environ 15, une partie correcte 60, une bonne partie
300.

Les niveaux distribuent, l'enfant ne dépense pas de points. La colonne de
droite est donnée à tout le monde, dans cet ordre.

| Niv. | XP du niveau | XP cumulée | Ce que ça donne |
|---:|---:|---:|---|
| 2 | 30 | 30 | un serpent |
| 3 | 45 | 75 | potions 11 s |
| 4 | 65 | 140 | un serpent |
| 5 | 90 | 230 | le volcan s'ouvre |
| 6 | 120 | 350 | départ 12 anneaux |
| 7 | 155 | 505 | un serpent |
| 8 | 195 | 700 | boost à 90 % |
| 9 | 240 | 940 | potions 12 s |
| 10 | 290 | 1 230 | le château s'ouvre |
| 11 | 345 | 1 575 | départ 14 anneaux |
| 12 | 405 | 1 980 | deuxième chance |
| 13 | 470 | 2 450 | un serpent |
| 14 | 540 | 2 990 | boost à 80 % |
| 15 | 615 | 3 605 | le vaisseau s'ouvre |
| 16 | 695 | 4 300 | potions 13 s |
| 17 | 780 | 5 080 | un serpent |
| 18 | 870 | 5 950 | départ 16 anneaux |
| 19 | 965 | 6 915 | boost à 70 % |
| 20 | 1 065 | 7 980 | serpent d'or, potions 15 s |

Le niveau 2 tombe dès la première partie, c'est voulu. Ensuite chaque palier
coûte de 50 % de plus que le précédent au début, jusqu'à 10 % de plus vers la
fin. Au delà du niveau 20, l'expérience continue de compter mais ne donne plus
rien : il reste les quêtes.

Il n'y a **pas de barre de vie** dans un jeu de serpent, on meurt au contact.
Le seul équivalent est la **deuxième chance** du niveau 12 : une fois par
partie, on repart à l'endroit de sa mort avec la longueur de départ.

Tous les bonus sont plafonnés : longueur de départ 16 anneaux, potions 15
secondes, boost 70 % de son coût.

Les paliers qui ouvrent un monde (5, 10, 15) affichent dans cette version
« bientôt » : le monde n'existe pas encore, et une récompense annoncée qui
n'arrive jamais se remarque.

### Les quêtes

Six, visibles sur un écran, chacune donne un serpent rare et de l'expérience.

| Quête | Prime |
|---|---|
| survivre 3 minutes dans une partie | 50 |
| manger 10 serpents dans une partie | 80 |
| ramasser 5 potions dans une partie | 80 |
| atteindre 2 000 points | 120 |
| jouer 10 parties | 60 |
| finir une partie sans jamais foncer | 100 |

### Les apparences

Treize serpents : celui du départ, six donnés par les niveaux (2, 4, 7, 13, 17
et le doré du 20), six donnés par les quêtes. Chacun est une couleur et un
motif : uni, rayé, à pois, dégradé. Aucun effet sur le jeu, seulement l'allure.
C'est exactement ce que le jeu du Play Store fait payer.

## Les écrans

**Départ** : le titre, le serpent choisi qui ondule, un gros bouton **Jouer**,
et deux entrées discrètes, Serpents et Quêtes. Aucune phrase d'explication : on
annonce en rendant le contrôle visible, pas en écrivant une notice.

**En jeu** : score en haut à gauche, les trois premiers en haut à droite,
mini-carte ronde en bas au centre, manche flottant à gauche, bouton pour foncer
à droite, anneau de potion autour de la tête quand un effet est actif.

**Fin de partie** : le score, l'expérience gagnée, la barre qui se remplit sous
les yeux de l'enfant, ce qui vient d'être débloqué, et un gros bouton
**Rejouer**. La barre se remplit après un court délai, pour qu'on la voie
bouger.

**Menu (3 points)** : recommencer, choisir son serpent, installer le jeu,
effacer la progression. L'entrée d'installation reprend le mécanisme des
échecs : on garde `beforeinstallprompt` sous la main et on le propose depuis le
menu, parce que la bannière automatique de Chrome n'apparaît qu'une fois.

## Le stockage

Une seule clé `localStorage`, `serpentin.v1` :

```
{ xp, niveau, serpentChoisi, serpentsDebloques: [], quetes: {}, meilleurScore, parties }
```

Rien ne sort du téléphone. Aucun compte, aucune requête réseau pendant une
partie.

## Les fichiers

`games/serpentin/`, sur le modèle de `games/echecs/`.

| Fichier | Ce qu'il fait |
|---|---|
| `index.html` | l'écran, le HUD, les menus, la boucle d'affichage, les entrées tactiles |
| `moteur.js` | monde, serpents, collisions, potions, difficulté. Aucun DOM |
| `mondes.js` | la description d'un monde : couleurs, obstacles, potions. La prairie est le premier objet |
| `progression.js` | expérience, niveaux, quêtes, déblocages, lecture et écriture du stockage |
| `manifest.json`, `sw.js`, `icone-192.png`, `icone-512.png` | la PWA |

`moteur.js` et `progression.js` ne touchent pas au DOM : ils s'essaient dans
Node sans navigateur, comme `perft.js` le fait pour les échecs.

Ajouter un monde plus tard doit coûter un objet dans `mondes.js` et rien
d'autre. Si l'implémentation demande de toucher à `moteur.js` pour ajouter un
monde, c'est que la frontière est mal placée.

⚠️ Le service worker garde les fichiers en cache : changer `VERSION` dans
`serpentin/sw.js` à chaque modification, sinon le téléphone garde l'ancienne
version.

## La vérification

Rien n'est déclaré fini sans ces quatre contrôles.

| Contrôle | Ce qu'il prouve |
|---|---|
| `tools/serpentin-moteur.mjs` | dans Node, sans navigateur : la croissance en mangeant, la mort tête contre corps, la survie corps contre tête, le buisson qui ralentit sans tuer, le bord qui fait glisser, les potions qui expirent à 10 s |
| `tools/serpentin-progression.mjs` | dans Node : la table d'expérience, les paliers, les plafonds, les quêtes, la relecture du stockage |
| `tools/serpentin-pixel9.mjs` | le parcours complet en Chromium, profil Pixel 9 (360 x 915 points CSS, le cas le plus étroit) : départ, manche, boost, potion ramassée, mort, écran de fin, expérience gagnée, zéro erreur console |
| `tools/serpentin-images.mjs` | les images par seconde avec 22 serpents et 450 fleurs |

Objectif de performance : **60 images par seconde**. En dessous de 50, je baisse
le plafond de serpents et je le dis, plutôt que de livrer un jeu qui saccade.

Playwright ne connaît pas le Pixel 9a. Le profil Pixel 9 a la même dalle et un
écran plus étroit, donc il est plus exigeant pour le HUD. Le contrôle final
reste le téléphone dans la main.

## Ce qui reste ouvert

- **Le nom.** Serpentin par défaut, sinon Gloups ou Zigzag.
- **Les bots et les potions.** Ils les ignorent pour l'instant, à rouvrir après
  le premier essai réel.
- **Le son.** Hors périmètre, mais quelques bips en WebAudio coûtent peu et
  changent beaucoup pour un enfant.
- **La difficulté.** Toutes les valeurs chiffrées de cette spec sont des points
  de départ. Elles se règlent en jouant, pas sur le papier.
