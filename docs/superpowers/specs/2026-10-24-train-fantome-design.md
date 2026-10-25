# Ghost Train : spec du vrai jeu

Date : 2026-10-24. Branche `train-fantome`.
Point de départ : la POC « Spectro-Brigade », gardée telle quelle dans
`docs/poc/spectro-brigade/` (rail shooter de capture de fantômes, 16 bits, un seul
fichier de 1 100 lignes, déjà installable et hors ligne).

## Objectif

Un rail shooter PWA pour **8 ans et plus**, dans le dépôt `games/`, auquel un adulte
joue sans avoir l'impression d'un jeu pour enfants. **C'est le ton qui fait ce
travail**, pas la difficulté : une seule difficulté, modérée.

## Décisions prises avec elle (2026-10-24)

- Toutes les recommandations de l'avis sur la POC sont validées.
- Ton : **A + C**, comédie d'horreur des années 80 (Ghostbusters, Gremlins,
  Stranger Things) avec un fil d'enquête (Gravity Falls).
- Le **train fantôme** est le cadre : le joueur est assis dans un wagon qui roule sur
  des rails posés dans le manoir. Une fête foraine hantée avec un vrai train fantôme
  viendra comme deuxième lieu, **après** la v1.
- Version 1 : **un manoir complet** (4 missions, la Gouvernante, toute la
  progression). Les autres lieux viendront un par tranche.
- Nom : **Ghost Train** (choisi le 2026-10-24), dossier `ghost-train/`.
- Direction visuelle : **A, « Série B »** (choisie sur `docs/train-directions.png`) :
  bande dessinée en pixels à la Zombies Ate My Neighbors, contours noirs épais,
  couleurs franches, interface en cases de BD, police grasse à contour.
- Difficulté : **une seule**, modérée. Pas de mode Expert, pas de réglage de
  difficulté.

## 1. Univers et ton

- **Le joueur** : une recrue d'une agence de chasseurs de fantômes des années 80,
  avec du matériel bricolé (rayon de capture, piège, flash). On ne voit que ses mains
  et l'appareil, donc pas de genre imposé.
- **Le wagon** : un vieux wagon de train fantôme réparé par l'agence. Il explique
  pourquoi on avance tout seul.
- **Ton** : comédie d'horreur. Fantômes grotesques, parfois inquiétants, jamais gores
  ni mignons. L'humour vient de la radio de l'agence (une cheffe blasée, deux ou trois
  phrases sèches par mission, en bas de l'écran, jamais pendant un pic d'action) et
  des fantômes eux-mêmes.
- **Lumi** reste le fantôme qu'il ne faut pas capturer, mais sans ton « bébé » : plus
  de « COUCOU ! » ni de « HIHI ! ». C'est un fantôme timide qui a peur des autres.
- **L'histoire** : l'ancien propriétaire construisait des trains fantômes pour les
  fêtes foraines. Il a posé des rails dans toute sa maison, puis il a disparu. Les
  secrets du décor reconstituent ce qui s'est passé.
- **Retournement proposé** (à confirmer sur la planche) : Lumi est le propriétaire
  disparu, devenu un fantôme timide, que la Gouvernante retenait prisonnier.
- **La salle de bal** garde les néons et le rythme, mais les « idoles » de la POC
  deviennent un **orchestre fantôme** de bal des années 80.
- Textes : tutoiement, neutres (aucun accord au féminin ou au masculin pour le
  joueur), lisibles par un enfant de 8 ans.

## 2. Le manoir : 4 missions

Chaque mission dure **2 à 3 minutes** : 4 arrêts du wagon, un aiguillage, puis un
mini-boss. Chaque mission apprend **une seule** chose, par le jeu : un premier
fantôme qui ne peut se battre qu'avec la nouvelle action, et une consigne courte
(une ligne) qui disparaît dès que l'action est faite. Pas de bloc de consignes à
l'écran titre.

| Mission | Ce qu'on apprend | Nouveaux fantômes | Mini-boss |
|---|---|---|---|
| 1. Le Grand Hall | viser, tenir le rayon, la surchauffe | la Goule | le Majordome |
| 2. La Bibliothèque | le flash qui étourdit et révèle | le Drap invisible, l'Ombre | le Bibliothécaire, protégé par ses livres volants que le flash fait tomber |
| 3. La Salle de bal | capturer sur le temps = PARFAIT, et la super-attaque | l'orchestre fantôme, qui tire des notes en rythme | le Chef d'orchestre |
| 4. Le Grenier | le slam (tirer à l'opposé du fantôme qui tire) | le Crâne cracheur | **la Gouvernante**, qui demande tout à la fois |

Les actions apprises restent disponibles dans les missions suivantes, et les fantômes
des missions précédentes y reviennent.

- **Lumi** passe une fois par mission. L'épargner rend un cœur ; le toucher au rayon
  en coûte un.
- **Aiguillage** : une fois par mission, le wagon s'arrête devant un levier. On tire
  dessus pour choisir entre deux voies (sans tir, le wagon prend la voie de gauche
  au bout de 4 secondes). Chaque voie a son propre arrêt et son propre secret ; elles
  se rejoignent avant le mini-boss. Tout trouver demande donc de rejouer.
- **Cœurs** : 5. À zéro, on reprend au début de la mission. Pas de point de reprise
  à l'intérieur d'une mission (elles sont courtes).
- **Les mini-boss** ont une barre de vie en haut de l'écran et une phase de plus que
  les fantômes ordinaires. La Gouvernante garde ce qu'elle fait dans la POC (bouclier
  cassé au flash, tirs, appel de goules) et y ajoute le slam.

## 3. Ce qui donne envie de revenir

- **Score allégé** : on garde le PARFAIT (capture sur le temps de la musique) et la
  super-attaque qu'il remplit. **Le combo est retiré.** La super-attaque perd le nom
  d'« hymne » : c'est un appareil de l'agence, nommé avec le reste sur la planche.
- **Note S, A, B ou C par mission**, sur 4 critères : part des fantômes capturés,
  Lumi épargné, cœurs perdus, parfaits. Les seuils sont réglés par le robot (section
  5), jamais au jugé. Seule la meilleure note est gardée.
- **Pièces** : lâchées par les fantômes capturés, **gardées même en cas de défaite**.
  Elles s'achètent à l'atelier de l'agence : **Rayon** (puissance), **Refroidissement**
  (la chauffe monte moins vite), **Flash** (recharge et portée), 3 niveaux chacun.
  **Chaque niveau se voit sur l'appareil** (une pièce de plus, une couleur qui
  change), prouvé par une planche des 3 niveaux côte à côte. Les prix sont réglés
  pour que tout soit acheté autour de la fin du manoir, en rejouant un peu.
- **Carnet des fantômes** : une page par espèce, grisée tant qu'elle n'a pas été
  capturée, avec son dessin, le nombre capturé et une remarque de la cheffe.
- **Dossier du manoir** : **12 secrets**, 3 par mission (un par voie d'aiguillage et
  un sur le tronc commun), à viser dans le décor (affiche, plan, photo, journal).
  Chacun ouvre une page du dossier. Finir la mission 4 donne la fin normale ; le
  dossier complet débloque la vraie fin.
- **Écran principal : la gare du train fantôme.** Un tableau des départs à palettes
  façon gare des années 80, une ligne par mission avec sa note et ses secrets
  trouvés (« 2/3 »), les missions non débloquées affichées « SUPPRIMÉ ». De la gare,
  on va à l'atelier, au carnet, au dossier et aux réglages. Les missions se
  débloquent dans l'ordre et se rejouent librement.
- **Réglages** : volume du son et de la musique séparés, aide à la visée (zone de
  capture plus large et rayon qui s'accroche), flashs réduits (activés d'office
  sous `prefers-reduced-motion`), commandes pour gaucher. Pas de réglage de
  difficulté.

## 4. Commandes

- **Paysage.** En portrait : panneau « Tourne ton téléphone » et partie en pause.
- **Tactile** : le pouce gauche glisse n'importe où sur la moitié gauche pour viser
  (visée relative, comme la POC). Le pouce droit a **TIRER** (gros bouton, maintenu),
  **FLASH** et la **super-attaque**, tous trois à sa portée, au moins 48 px chacun
  sur un téléphone. En mode gaucher, les côtés s'inversent.
- **Souris et clavier** : viser à la souris, clic gauche pour le rayon, clic droit
  ou F pour le flash, E pour la super-attaque, P ou Échap pour la pause.
- Le slam se fait en glissant la visée à l'opposé de la flèche du fantôme pendant
  qu'on tient le rayon.

## 5. Technique

- **Dossier dans `games/`**, nom choisi avec le titre. Vanilla, sans dépendance ni
  build, **modules ES comme `patrouille/`**, avec un moteur PUR (aucun DOM, aucun
  `Math.random` : hasard à graine) pour que le robot joue dans Node. Découpage :
  - `moteur/` (pur) : `partie.js` (état, rail, score, notes, cœurs), `fantomes.js`
    (comportement de chaque espèce et des boss), `actions.js` (rayon, chauffe,
    flash, slam, super-attaque, parfait), `progression.js` (pièces, atelier,
    carnet, dossier, sauvegarde en données) ;
  - `contenu/` (données seulement) : `missions.js` (arrêts, voies, secrets, Lumi),
    `especes.js`, `textes.js` (radio de la cheffe, carnet, dossier) ;
  - `ecran/` (dessine sans jamais modifier la partie) : `decor.js` (le couloir en
    3D de la POC, un jeu de matières par salle), `dessins.js` (sprites), `police.js`
    (notre police pixel), `hud.js`, `gare.js`, `atelier.js`, `carnet.js`,
    `dossier.js`, `reglages.js` ;
  - `son.js`, `entrees.js`, `app.js` (boucle et branchements) ;
  - `index.html`, `manifest.json`, `sw.js` (SHELL liste CHAQUE module), icônes.
- **Police maison** : la POC affiche « éTAGE » et « BIBLIOTHèQUE » parce que Press
  Start 2P n'a pas de majuscules accentuées. Une police bitmap dessinée par nous
  garantit les accents, reste nette et ne demande aucun téléchargement.
- **PWA comme les autres jeux** : version en trois chiffres (`x.y.z`) dans `sw.js` et
  affichée dans les réglages, contrôlée par `tools/versions.test.mjs` ; `?v=VERSION`
  à l'installation ; `reg.update()` au retour à la gare ; bouton Installer sur
  l'écran d'accueil ; zoom bloqué (`dblclick`, `gesturestart`) ; aucune ressource
  externe.
- **Arcade et dépôt** : la liste « Ajouter un jeu » du `CLAUDE.md` (ligne du
  `README.md`, `JEUX` de l'arcade et de `arcade-pwa.mjs`, icône dans le `sw.js`
  racine, version de l'arcade augmentée, `docs/<jeu>-versions.md`, `JEUX` de
  `tools/versions.test.mjs`). Le jeu commence à `1.0.0`. Une section dans le
  `CLAUDE.md` pour ce qui est fragile.
- **Sauvegardes** dans `localStorage`, toujours dans un `try` : la progression
  (missions, notes, pièces, améliorations, carnet, dossier), qu'une défaite n'efface
  jamais, et les réglages, à part.
- **Animations réduites et flashs** : l'éclair, l'écran rouge des coups et le blanc
  de capture du boss passent tous par le réglage « flashs réduits ».
- **Crochet de test** `window.__essais` (aller à une mission, à un arrêt, invincible,
  remplir la super-attaque, état), comme les autres jeux.

## 6. Bancs

- `tools/<jeu>-pwa.mjs` : fichiers servis, hors ligne, version cohérente, `--enligne`
  pour la prod.
- `tools/<jeu>-moteur.test.mjs` : le moteur dans Node (rail, aiguillages, notes,
  achats, sauvegarde).
- `tools/<jeu>-robot.mjs` : un robot joue chaque mission et mesure la durée, la note,
  les pièces gagnées et les cœurs perdus. Il règle les seuils des notes et les prix.
  On le fait échouer une fois avant de croire son vert.
- `tools/<jeu>-planche.mjs` : planches visuelles (fantômes, 3 niveaux de l'appareil,
  gare, chaque salle).
- Images/s mesurées **avec la carte graphique**, moyenne et pire image, sur la salle
  de bal (la plus chargée).

## 7. Ordre de construction

0. **Montrer d'abord** : une planche de la direction années 80 (fantômes, wagon,
   appareil, gare, HUD) et une liste de noms. Rien n'est codé avant son choix.
1. **La base** : le code découpé, la police, la PWA, les commandes, les réglages, la
   gare simplifiée, et la mission 1 jouable de bout en bout.
2. **Les missions 2 à 4**, avec leurs mini-boss et la Gouvernante.
3. **La progression** : atelier, carnet, dossier et vraie fin, notes, gare complète.
4. **L'équilibrage** par le robot, puis son essai sur un vrai téléphone.

Chaque tranche se montre (captures, planche) avant la prod.

## Hors de la v1

Fête foraine hantée et autres lieux, mode Expert, classement en ligne, défi du jour,
multijoueur.
