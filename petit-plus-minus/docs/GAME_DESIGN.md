# ⭐ PIVOT du 2026-09-27 : la boîte à outils

**Le test de l'enfant** : fini en 2 minutes, « c'est vide » ; beaucoup trop de texte (au
combat, il ne savait pas où lire : la pensée en haut, les choix en bas, la réponse au
milieu) ; au mémo à cartes cachées, il touchait au hasard.

**Ce qui change** (décisions de la mère, codées le 2026-09-27) :
- L'accueil EST la boîte à outils : « J'ai besoin de calme » en haut, la **jauge de Minus**
  (quatre Minus, du plus petit au plus gros ; elle remplace la météo et surligne les outils
  qui aident à ce niveau), puis six outils au même niveau.
- **Plus d'étoiles, de niveaux ni de diplômes** : on ne donne pas un diplôme pour une
  respiration.
- Nouveaux outils : **la bougie** (sentir la fleur 4 s, souffler la bougie 6 s) et **Robot
  spaghetti** (raide 5 s, mou 10 s, une partie du corps à la fois).
- **Les paires** remplacent le mémo : toutes les cartes visibles, Minus à gauche, les
  phrases à droite.
- **Réponds à Minus** remplace le combat : la bulle de Minus juste au-dessus de deux
  réponses (un seul endroit où lire), l'autre phrase d'un autre thème, une mauvaise
  réponse ne coûte rien.
- Règle de texte : une phrase à la fois, 12 mots au plus, rien à lire pendant un exercice
  du corps. Aucune étude ne donne un maximum de mots par écran ; repères : 90 mots/min en
  fin de CE2 (Éduscol), les enfants évitent de lire (Nielsen Norman Group).

## Pour les grands : deux écrans distincts (2026-10-02) **[tranché]**

Ce qui n'allait pas (vu par la mère) : après le calcul, la page montrait la liste des peurs
de Minus avec, au-dessus, un bouton vers l'escalier. Venue de l'escalier, elle choisissait
une peur dans la liste et rien ne changeait dans l'escalier : les deux n'ont aucun lien.

- Venu de l'escalier (« Avec un grand », « Trop dur ? »), le calcul mène **droit** à
  « Construire l'escalier ».
- Venu de l'accueil, le calcul ouvre un **menu de deux choix**, chacun avec une ligne qui
  dit ce qu'il change : « Son escalier » et « Les pensées de Minus » (les peurs dont Minus
  parle dans Les paires et Réponds à Minus), chacun sur son écran (`construire`, `themes`).
- Tant qu'on n'est pas repassé par un écran de l'enfant (l'accueil, l'escalier), revenir au
  menu ne redemande pas le calcul ; ensuite, si.

## Pas d'avertissements au parent (2026-10-02) **[tranché]**

La mère a fait retirer de « Pour les grands » les trois avertissements que j'avais écrits :
« il complète l'aide d'un professionnel, il ne la remplace pas », « rien ne quitte ce
téléphone… » et « si l'anxiété dure plusieurs semaines… parlez-en à votre médecin ». Il
reste une phrase qui dit ce qu'est le jeu. Ne pas en remettre de ce genre, ici ou ailleurs,
sans qu'elle le demande. Le rappel « tu peux aller voir un adulte » du SOS s'adresse à
l'enfant et reste (principe 3).

## Petit yoga (2026-10-02) **[tranché]**

Le huitième outil : un **chat roux** montre cinq postures (l'arbre, le dos rond, le cobra,
le papillon, la petite graine), chacune tenue trois respirations au rythme de la bougie
(4 s, 6 s). Pendant l'exercice, un seul mot à lire : le nom de la posture. Postures dans
`js/yoga.js`, dessin dans `js/chat.js`, noms et ordre dans `contenu.json`.

**Décisions de la mère :** ni garçon ni fille pour montrer les postures, donc un animal ;
un chat roux, sans prénom ; le nom « Petit yoga » ; l'accueil à huit tuiles, deux par
rangée (respirer, le corps, les pensées, puis les 5 trésors et les petits pas).

**Pourquoi un chat qui se tient comme un enfant :** deux bras, deux jambes, les mêmes
articulations que celui qui l'imite. Un chat à quatre pattes ne pourrait montrer ni
l'arbre ni le papillon. Minus n'a pas de membres, le robot est raide. La posture « du
chat » s'appelle « le dos rond », pour ne pas mélanger le personnage et la posture.

**Le dessin** suit les leçons du jeu du requin : contour d'un seul tenant (tous les
contours d'abord, les aplats ensuite), le vrai animal (oreilles, museau, moustaches,
coussinets, rayures, queue), le ventre clair de face et les rayures de profil, des parties
qui vivent (la queue ondule, les yeux se ferment pendant le souffle). La planche
`tools/petit-plus-minus-chat.mjs` sert à le juger hors du jeu.

**Ce que disent les sources, et ce qu'on en a fait :**
- Le yoga fait baisser l'anxiété dans environ 70 % des études chez l'enfant et l'ado,
  mais leur qualité est faible à moyenne, et les programmes sans effet duraient 6 semaines
  ou moins (James-Palmer et coll. 2020). L'Académie américaine de pédiatrie le dit sûr et
  prometteur, sans en faire un traitement principal (2016). **Ici : un moment pour se
  détendre, pas un traitement**, et le jeu ne promet rien d'autre.
- Toutes les études efficaces comportaient des **postures** : d'où un outil de postures,
  pas une respiration de plus.
- Sécurité : très peu d'incidents ; le seul grave est une fracture en **lotus** chez un
  adolescent. Donc jamais de lotus, rien sur la tête ni sur les épaules, rien qui appuie
  sur le cou ; dans l'arbre, le pied se pose SOUS le genou ; trois respirations puis on
  change ; « Sur un tapis. Tout doucement, sans forcer. » avant de commencer. Les tests
  (`tests/yoga.test.js`) refusent une posture nommée lotus, poirier ou chandelle.

## Mes petits pas (2026-10-01) **[tranché]**

Le septième outil, et le seul qui entraîne au courage au lieu de calmer : l'exposition
graduée, dessinée en **escalier**. La fée monte une marche à la fois, le drapeau en haut
est l'objectif. Logique dans `js/pas.js`, écrans `pas*` et `construire`.

**Générique, dans les mots de l'atelier que suit l'enfant.** Aucune liste de peurs ni de
marches préécrites : on ne peut pas prévoir toutes les peurs, et les marches d'un enfant ne
sont pas celles d'un autre. Les trois pas de l'atelier : nommer la peur à vaincre et
l'objectif ; énumérer les étapes de la moins effrayante à la plus effrayante ; affronter
les étapes une à la fois. L'adulte écrit les étapes AVEC lui, derrière le calcul de « Pour
les grands » ; l'enfant touche la taille de Minus pour chacune et l'escalier se range seul.

**Décisions de la mère :**
- Les **trucs** de la boîte (bougie, robot, phrase de courage) servent à se préparer,
  AVANT l'étape, et on peut s'en passer. **Jamais pendant** : l'écran « pendant » ne montre
  aucun truc.
- La **récompense** revient aux parents (« on ne donne que la recette ») : un conseil le
  dit dans « Construire », l'app ne donne ni point ni étoile. En haut : un drapeau.
- Sur l'accueil : une tuile pleine largeur, **provisoire** (un huitième outil, du yoga,
  est prévu ; à huit, la grille redevient 2 × 4).

**Ce que disent les sources, et ce qu'on en a fait :**
- Une étape affrontée **compte même si la peur n'a pas baissé**. Le degré d'habituation
  pendant l'exercice ne prédit pas le résultat, et trop insister sur la baisse renforce
  l'idée que l'anxiété est dangereuse (Craske et coll. 2014 ; Goulet, Ngô et Chaloult 2024 ;
  McGuire et Storch 2019 pour les jeunes). Le message de fin est donc toujours « Tu as
  affronté ton étape », puis « Et Minus a rapetissé » ou « Minus est encore là, et tu es
  resté ». ⚠️ Les preuves viennent surtout d'adultes.
- **Aucun chiffre de répétitions** n'existe : « plusieurs fois », jusqu'à y entrer sans trop
  de peur (AnxietyBC). `FOIS = 3` est un minimum ; ensuite l'enfant choisit « Je monte » ou
  « Je refais cette étape ». Rien ne monte à sa place.
- **Varier** l'heure, la pièce, qui est là aide le progrès à tenir (conseil au parent).
- La relaxation ou la respiration utilisées PENDANT l'exposition peuvent devenir un signal
  de sécurité (Goulet 2024), et les TCC de l'enfant avec relaxation font moins bien
  (Whiteside et coll. 2020) : d'où les trucs avant seulement.
- **Trop dur ne punit pas** : on glisse une étape plus petite avant la sienne, qui garde
  ce qu'il y a déjà fait (AnxietyBC : découper, ne pas presser).
- Féliciter l'effort et prévoir une récompense (AnxietyBC, Société canadienne de
  pédiatrie) : laissé aux parents.

Sept marches au plus (au-delà, une marche ferait moins de 44 px). Un seul escalier à la
fois ; « Recommencer un escalier » demande confirmation. L'escalier et la taille de Minus
avant et après chaque étape restent sur le téléphone (`etat.escalier`).

Ce qui suit est l'historique de la première version (duel, étoiles, niveaux), gardé pour
comprendre les décisions ; ce qui contredit le pivot ne vaut plus.

# Game design : Petit Plus contre Petit Minus

Repris du kit brainstormé le 2026-09-25, puis optimisé (voir `OPTIMISATION.md`).
Les cinq décisions ouvertes par l'optimisation ont été tranchées le 2026-09-25 et sont
marquées **[tranché]**.

## Intention

Apprendre à un enfant d'environ 8 ans, en jouant, à reconnaître son anxiété et à
utiliser quelques outils pour l'apaiser, afin qu'il puisse s'en servir seul dans la
vraie vie. Le jeu complète, sans le remplacer, un éventuel accompagnement par un
professionnel.

### Fondements

- **Externalisation** : l'anxiété devient un personnage (Petit Minus). L'enfant
  comprend que ce n'est pas *lui*, c'est une petite voix qui lui parle, et qu'on peut
  lui répondre.
- **Outils concrets** tirés des approches utilisées avec les enfants : respiration
  lente, ancrage sensoriel 5-4-3-2-1, pensées alternatives (phrases aidantes),
  relaxation musculaire, report des soucis, exposition graduée.
- **Minus ne disparaît jamais complètement.** Un peu de peur est normal et même utile.
  Le but est qu'il devienne tout petit et gérable. Sinon l'enfant se sentirait en échec
  le jour où Minus revient.

## Personnages

- **Petit Plus** : petite fée (robe rose, cheveux dorés, ailes bleu clair, baguette
  étoile). Elle grandit avec l'entraînement et pendant le combat. Le positif doit finir
  visiblement plus grand que le négatif.
- **Petit Minus** : petit démon violet, cornes, sourcils froncés, grognon mais mignon.
  Il a une version endormie (quand tout va bien). Il rétrécit quand l'enfant lui répond.
- **[tranché] Petit Plus est une fille** : « elle », « grande et forte », « prête ».
  Le kit se contredisait (« devenu grand et fort » et « plus forte »). Petit Minus
  reste « il ».

## Boucle quotidienne

```
Accueil ─┬─ « Comment est Petit Minus aujourd'hui ? »
         │     ├─ Endormi / Petit  → Entraînement (rituel ~5 min, étoiles) → (Combat)
         │     └─ Moyen / Énorme   → SOS Minus (calme, sans score) → « Minus a-t-il rétréci ? »
         └─ « J'ai besoin de calme » → SOS Minus directement   [tranché]
```

1. **Météo de Minus** : l'enfant apprend à repérer son niveau d'anxiété (compétence clé
   en soi). Son choix oriente vers le bon mode, et il est gardé, horodaté, pour
   l'espace parent.
2. **Entraînement** quand ça va : « On s'entraîne quand tout est calme, comme les
   pompiers, pour être prêts le jour du vrai feu. » Les mini-jeux donnent des étoiles
   qui font grandir Petit Plus (niveaux).
3. **SOS** quand ça ne va pas : court, lent, sans score. 3 respirations guidées, puis
   choisir une phrase de courage, la dire doucement, puis « Minus a-t-il rétréci ? »
   (oui / un peu / non). Chaque réponse est valorisée ; « un peu » et « non » proposent
   de refaire un souffle ou d'aller voir un adulte. Le rappel « tu peux toujours aller
   voir un adulte » est toujours visible.
4. **Combat** : moment de jeu pour répéter les phrases aidantes.

**Le SOS après la critique impeccable du 2026-09-25** (26/36) :
- Les respirations suivent la **bulle** (un cycle de 8 s = une pastille), pas un bouton ;
  « J'ai fini de respirer » n'apparaît qu'après la 3e, et la bulle continue tant que
  l'enfant veut.
- **Minus est montré** quand on dit la phrase et qu'on se demande s'il a rétréci (gros
  par « J'ai besoin de calme » et pour « Énorme », un peu moins pour « Moyen »). Chaque
  réponse porte un petit Minus de sa taille, et à la fin Minus prend la taille que
  l'ENFANT a choisie (moitié pour « oui », trois quarts pour « un peu », inchangé pour
  « non »). Un miroir, pas un score : le jeu ne décide jamais à sa place.
- Les trois réponses ont la même couleur ; les choix sont en bas, sous le pouce.
- Après « oui », le rappel devient « Tu peux toujours aller voir un adulte que tu
  aimes. » (il disait encore « Minus est gros aujourd'hui »).
- Questions laissées ouvertes par la critique : « duel » ou « apprivoiser » ? l'accueil
  doit-il montrer Minus endormi quand la dernière météo était calme ?

**[tranché] SOS en un appui depuis l'accueil.** Par la météo, un enfant qui a très peur
devait appuyer sur « C'est parti », lire une question, choisir « Énorme », lire un
message, puis appuyer sur « SOS Minus » : 3 appuis et deux lectures. L'accueil porte
donc un bouton « J'ai besoin de calme » (`contenu.json > accueil.boutonCalme`) qui
ouvre le SOS directement, **sans rien noter dans la météo** : on ne fait pas remplir
une case à un enfant qui a peur. La météo reste le chemin normal.

## Combat (prototype validé)

- Minus lance une pensée anxieuse. L'enfant choisit parmi 3 phrases de courage.
- Chaque pensée a **sa meilleure réponse** : « super efficace », −3 à Minus, +3 à Plus.
  Les autres phrases restent positives et aident un peu (−1 / +1) avec un message
  d'encouragement, jamais de punition. La même pensée revient tant que la meilleure
  réponse n'a pas été trouvée.
- Petit Plus commence avec un **bonus de force** issu de l'entraînement.
  **[tranché] Bonus = niveau de Petit Plus, plafonné à 4** (`combat.bonusMax`) :
  l'entraînement compte sans rendre le combat gagné d'avance.
- Deux jauges : « Force de Plus » et « Taille de Minus ». Les deux personnages changent
  de taille à l'écran, ancrés en bas.
- **Les choix sont bloqués pendant l'animation de taille** : sans ça, un deuxième appui
  compte une réponse de trop (défaut déjà vu sur nos autres jeux).
- Victoire : Minus minuscule (« pff… »), « il reviendra peut-être, mais tu sais comment
  le rendre petit », une phrase de courage mise en avant.
- Paramètres dans `contenu.json > combat`, logique pure dans `js/jeu.js`.

## Étoiles et niveaux

**[tranché] 10 étoiles par niveau** (`limites.etoilesParNiveau`). La maquette
d'entraînement affichait « 7 étoiles sur 10 avant le niveau 4 » sans règle. Avec le plafond de 4 étoiles par
jour en mini-jeux, un niveau prend au moins 3 jours : les missions de la vraie vie
(3 étoiles, hors plafond) accélèrent, ce qui est le but.

Le plafond est compté **par jour local** (`AAAA-MM-JJ` calculé à chaque étoile, pas au
lancement), pour qu'une app restée ouverte après minuit reparte à zéro.

## Mini-jeux d'entraînement

| Jeu | Technique | Statut |
|---|---|---|
| Souffle magique | respiration lente, bulle 4 s / 4 s, 3 cycles | prototype |
| Chasse aux 5 trésors | ancrage 5-4-3-2-1 : l'enfant touche une gemme par chose trouvée autour de lui | prototype |
| Mémo des phrases | memory 8 cartes : pensée de Minus ↔ phrase de Plus ; à chaque paire, on invite à répéter la phrase | prototype |
| Robot et spaghetti | relaxation musculaire : se raidir puis devenir tout mou, guidé | à faire |
| La boîte à soucis | dessiner son souci, le ranger, en reparler au « moment soucis » avec un parent | à faire |
| Échelle du courage | petits défis réels gradués, validés par le parent (rapporte le plus d'étoiles) | à faire |

**Sans animation** (réglage « réduire les animations » du téléphone), la bulle de
respiration ne grossit pas : le rythme passe par le mot affiché (« Inspire… »,
« Souffle… ») et par un remplissage qui change de teinte. Un outil de calme ne doit
jamais disparaître parce qu'un réglage d'accessibilité est actif.

## Garder l'intérêt sans rendre dépendant

- **Rituel court** (~5 min), plafond d'étoiles quotidien pour les mini-jeux ; ensuite
  Petit Plus dit « On s'est bien entraînés, à demain ! ». Aucun chrono affiché.
- **La vraie vie rapporte le plus** : missions réelles (« j'ai levé la main en
  classe », « j'ai utilisé mon souffle avant le contrôle ») validées par le parent.
- **Personnalisation** : avec un parent, l'enfant écrit ses propres pensées de Minus et
  ses propres phrases de courage. De nouveaux Minus peuvent apparaître selon ses vraies
  peurs (école, noir, séparation…).
- **Journal des victoires** : voir, semaine après semaine, ce qu'il a surmonté.
- **Diplômes** : quand une phrase ou une technique est acquise, Petit Plus dit
  « celle-là, tu la connais par cœur, tu n'as plus besoin de moi », puis une carte à
  imprimer et garder dans le cartable. Finir est une réussite.
- **[tranché] Une seule collection : « Mes diplômes ».** L'accueil du kit avait un
  bouton « Mes badges » et la victoire un badge « Étoile du courage », sans règle, à
  côté des diplômes du game design. Deux collections parallèles, c'était une mécanique
  de plus à nourrir.

## À éviter absolument

Séries de jours qui se perdent, notifications culpabilisantes, Minus qui grossit si on
ne joue pas, classements, achats intégrés, pubs, collecte de données, textes anxiogènes
ou images effrayantes. Et, côté PWA : aucune notification push, aucune demande
d'installation insistante, aucun badge d'icône.

## Espace parent

Derrière un **bouton visible « Espace parent »** et une petite barrière (un calcul
simple). Pas d'appui long caché : une fonction que rien n'annonce n'existe pas, y compris
pour le parent.

Contient : validation des missions réelles, édition des pensées et phrases
personnalisées, historique de la météo de Minus (pour en parler, pas pour surveiller),
réglage de la durée du rituel, conseils pour accompagner l'enfant et rappel qu'en cas
d'anxiété importante ou durable, un professionnel peut aider. Plus, côté PWA :

- **Sauvegarder / restaurer** la progression dans un fichier (rien ne quitte le
  téléphone autrement, donc c'est le seul filet si le navigateur efface ses données
  ou si on change de téléphone) ;
- **Installer le jeu** (bouton, ou le chemin du menu ⋮ quand Chrome ne propose rien) ;
- **La ligne de diagnostic** (version du service, caches) et le bouton **« Réparer la
  mise à jour »**.

## Vérification des parcours (critique impeccable du 2026-09-27 : 30/40)

Corrigé : la victoire ne pousse plus à rejouer (« À demain ! » est le bouton plein) ; au
plafond, plus de « Rejouer » et le combat se fait discret ; « Mes Minus » derrière un calcul,
depuis « Pour les grands » ; l'aide d'installation s'affiche en haut, dans l'écran ; le retour
d'Android remonte d'une étape dans le SOS (le bouton retour de l'en-tête, lui, le quitte) ;
la fin du SOS est notée en silence (d'où, et la réponse) pour le futur espace parent ; la
météo gardée au retour, sans double note ; « Mes diplômes » caché tant qu'il n'existe pas ;
typographie française (espaces insécables) dans tout contenu.json.

## Feuille de route (réordonnée)

0. ✅ **Maquette cliquable au vrai format (360 px)** de l'accueil, de la météo et du SOS,
   avec les corrections de `DESIGN.md` : montrée et choisie avant tout code.
1. ✅ Socle (2026-09-25) : squelette PWA, thème, polices hébergées, personnages SVG
   animables, chargement vérifié de `contenu.json`, service worker, bancs.
2. ✅ Accueil, Météo, SOS (2026-09-25). Le retour d'Android ramène à l'écran d'avant ;
   un appui dans les 700 ms qui suivent un changement d'étape du SOS est ignoré (le
   bouton suivant peut apparaître sous le doigt) ; « Entraîner » et « Mes diplômes »
   disent « Bientôt » tant que leurs écrans n'existent pas.
3. ✅ Stockage (2026-09-25) : étoiles, niveaux, plafond quotidien (logique prête, rien ne
   donne encore d'étoile), historique de la météo noté quand l'enfant CONFIRME (bouton
   du bas), 400 notes au plus. Le SOS direct ne note rien.
4. ✅ Entraînement (2026-09-25) : écran du niveau (jauge, « 1 étoile » au singulier) et
   les 3 jeux jouables seulement, sans carte pour ceux qui n'existent pas (impasses).
   Souffle magique : 3 respirations au rythme de la bulle, +1 étoile. Chasse aux trésors :
   5 étapes, une gemme par chose trouvée, +1. Mémo : 4 paires tirées au hasard parmi 5,
   verrou de 1,4 s sur une erreur, +2 ; gagné, les cartes laissent place aux 4 phrases
   apprises. Au plafond (4 étoiles par jour), les jeux restent ouverts, sans étoile, et
   Petit Plus dit « à demain ». « Entraîner » et la branche calme de la météo y mènent.
5. ✅ Combat et Victoire (2026-09-25) : bouton « Petit Plus est prête : au combat ! » en bas
   de l'entraînement. Force de départ = niveau (plafonné à 4), pensées dans un ordre tiré
   au hasard, 3 phrases mélangées à chaque tour, appuis ignorés 550 ms pendant
   l'animation, 500 ms sans rebond. Petit Plus va de la moitié à sa pleine taille (plus
   grande, sa tête passait sous les jauges), Minus de pleine taille à 0,28, jamais effacé.
   La pensée et le message ont une hauteur fixe : rien ne saute sous le doigt. Victoire :
   Petit Plus grande, Minus « pff… », et la phrase qui a gagné (pas de badge : une seule
   collection, les diplômes). Le combat ne donne pas d'étoile : c'est un moment de jeu, pas
   une source de récompense qui pousserait à rejouer.
6. Espace parent : missions réelles (Échelle du courage), sauvegarde, installation,
   diagnostic.
7. Personnalisation des paires pensée/phrase.
8. Journal des victoires et diplômes imprimables.
9. Mini-jeux restants (Robot et spaghetti, Boîte à soucis), voix off optionnelle.
10. Relecture du contenu avec un professionnel de l'enfance.
