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
   choisir une phrase magique, la dire doucement, puis « Minus a-t-il rétréci ? »
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

- Minus lance une pensée anxieuse. L'enfant choisit parmi 3 phrases magiques.
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
  le rendre petit », une phrase magique mise en avant.
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
  ses propres phrases magiques. De nouveaux Minus peuvent apparaître selon ses vraies
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
