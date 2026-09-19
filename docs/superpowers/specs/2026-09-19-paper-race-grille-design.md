# Paper Race : courses de 2 à 6 voitures

Date : 2026-09-19. Statut : conception validée, à relire avant le plan.

## Pourquoi

Aujourd'hui une course oppose deux voitures, et celle qui joue en premier gagne
71 % des courses entre deux fantômes identiques (197 sur 278). Une vraie course
de F1 a une grille. On veut des courses de 2 à 6 voitures, justes, où la tête
change de main.

Usages retenus :

- **A.** Solo « Grand Prix » : le joueur contre 1 à 5 fantômes.
- **B.** En ligne : 2 à 6 humains.
- **D.** En ligne, mélange d'humains et de fantômes.

Le jeu à plusieurs sur un même téléphone reste à deux.

## Ce qui a été mesuré

Banc : fantômes « normal » tous identiques, 40 courses par circuit et par
règle, part des victoires de chaque place de grille. Copie du moteur
généralisée à N voitures (le jeu n'était pas touché).

À deux, sur les 7 circuits (place 0 / place 1, sur 280) :

| règle | place 0 | place 1 | la tête change |
|---|---|---|---|
| chacun son tour (aujourd'hui) | 70 % | 29 % | 2,0 fois |
| ordre qui tourne | 51 % | 46 % | 2,4 fois |
| ordre qui tourne + aspiration | 53 % | 46 % | 2,9 fois |
| simultané, priorité au premier | 81 % | 16 % | 0,4 fois |
| le dernier joue d'abord + aspiration | 56 % | 43 % | 3,0 fois |

À 4 et 6 voitures, grands circuits seulement (Monza, Montréal, Monaco, Spa,
160 courses) :

| règle | 4 voitures | 6 voitures (juste = 17 %) |
|---|---|---|
| chacun son tour | pole 47 % | pole 51 %, dernière place 1 % |
| ordre qui tourne + aspiration | 14 à 34 % selon la place | 13 à 19 % selon la place |

La tête change 4,7 fois par course à 6 au lieu de 2,7.

**Les petits circuits (Le S, l'épingle, l'ovale) ne s'équilibrent pas.** Piste
de 5 cases, le blocage empêche de doubler : la voiture à la corde du premier
virage gagne 50 à 60 % à 4 voitures, et encore environ 70 % à deux. Essayé sans
succès : grille serrée (tous presque sur la ligne), deux tours (pire). Ils
restent donc réservés aux courses à deux.

Limite : des fantômes identiques exagèrent l'effet de la place. Entre humains,
l'écart de niveau pèse davantage.

## Règles (toute course à plusieurs, sauf le championnat)

1. **Grille tirée au sort** avant chaque course.
   - 2 voitures : comme aujourd'hui, côte à côte sur la ligne (m-1, m+1).
   - 3 ou 4 : rangées de 2 (m-1, m+1).
   - 5 ou 6 : rangées de 3 (m-2, m, m+2).
   - La rangée de devant part 2 cases plus loin que la suivante ; la dernière
     rangée est sur la ligne (derrière la ligne, l'avancée repasserait par
     l'arrivée). Vérifié sur piste pour les 7 circuits.
2. **Ordre qui tourne** : au tour de jeu k, la voiture k mod N commence, puis
   les suivantes dans l'ordre de la grille. Les voitures arrivées sont sautées.
3. **Aspiration** : à la fin du tour de jeu, une voiture en mouvement qui se
   trouve à 2 cases ou moins (distance de Tchebychev) d'une voiture plus
   avancée, non arrivée, roulant dans le même sens (produit scalaire des
   vitesses > 0), gagne +1 de vitesse sur son axe principal (même calcul que
   l'accélérateur `apresBoost`).
4. **Blocage contre toutes les voitures** : la trajectoire s'arrête derrière la
   PREMIÈRE voiture rencontrée (la plus proche du départ du coup).
5. **Fin** : dès qu'une voiture franchit la ligne, on finit le tour de jeu.
   Photo-finish : parmi les arrivées de ce tour, gagne la plus tôt sur la ligne
   (fraction du segment avant la ligne). Les autres sont classées par avancée
   (`arc`). Égalité parfaite : ex aequo.

À deux sur tous les circuits ; de 3 à 6 voitures, les 4 grands seulement.

## Ce qui ne change pas

- **Le championnat solo** (un fantôme, pars, médailles, records
  `paper-race.records.v2`) garde exactement ses règles : l'aspiration fausserait
  les pars et rendrait les records incomparables.
- Les pièges, les niveaux de fantôme, la règle de blocage elle-même.

## Moteur (`moteur.js`)

- `newRace(i, laps, fin, opts)` : `opts.n` voitures (2 par défaut),
  `opts.grille` (permutation tirée au sort), `opts.regles` (`'grille'` ou
  `'classique'` pour le championnat). Sans `opts`, résultat identique à
  aujourd'hui : c'est ce qui garde le championnat et les sauvegardes intacts.
- `collision` / `play` parcourent toutes les voitures (le « 1 - turn » disparaît).
- `nextTurn` suit l'ordre qui tourne et déclenche l'aspiration et la fin de
  tour de jeu ; `classement(race)` rend l'ordre d'arrivée.
- L'IA ne change pas : elle voit déjà les autres voitures par `choices`.
- Banc d'équité repris dans `tools/paper-race-equite.js`, sur le vrai moteur ;
  il échoue si une place dépasse le double de la part juste à 6 sur les grands
  circuits, et si l'ancien mode ne redonne pas les chiffres d'aujourd'hui.

## Écran

- Six couleurs de voiture générées et vérifiées (daltonismes, contraste au
  soleil sur le papier), bleu et rouge actuels gardés en 1 et 2. Chaque voiture
  porte son numéro.
- Bandeau « À Vert, 3 sur 6 » ; minicarte avec toutes les voitures.
- Pastille « Aspiration +1 », comme les messages de pièges.
- Fin : classement 1re à 6e, mention « photo-finish » si serré.
- Accueil : « Grand Prix » (solo contre 1 à 5 fantômes, choix du nombre, 4 par
  défaut) ; le choix du circuit se limite aux grands dès 3 voitures.
- À deux sur le même téléphone : nouvelles règles, grille tirée au sort (fini
  « Bleu commence toujours »).

## En ligne

- Relais (`serveur-paper-race`, `WORKER_VERSION` pr-2) : jusqu'à 6 sièges,
  jetons par siège, toujours « ranger les coups, rien de plus ».
- Chaque coup porte `voiture`. Le relais vérifie seulement que le numéro de
  coup suit et que l'expéditeur a le droit de jouer cette voiture (la sienne,
  ou un fantôme s'il est l'hôte). Les téléphones calculent à qui c'est le tour ;
  un coup hors tour est ignoré par tous de la même façon.
- L'hôte choisit nombre de voitures et circuit, peut démarrer avant que la
  salle soit pleine ; les places vides deviennent des fantômes calculés par son
  téléphone. La grille est tirée par l'hôte et envoyée avec le départ.
- Coup choisi d'avance pendant que les autres jouent, envoyé à son tour,
  modifiable jusque-là ; annulé s'il devient impossible.
- Joueur parti : sa voiture s'arrête et reste un obstacle.
- Salles à deux de la v7 : toujours valides (sans `voiture`, siège = n % 2).
- Ordre de déploiement inchangé : relais d'abord, puis le jeu.

## Contrôles avant livraison

- Banc d'équité vert, et rouge quand on remet l'ordre fixe.
- Championnat : mêmes parcours du fantôme, mêmes pars, qu'avant (sortie
  identique au banc actuel `paper-race-difficulte.js --controle`).
- Course en ligne à 3 navigateurs + 1 fantôme contre le relais local, dont un
  qui quitte ; salle v7 à deux encore jouable.
- Playwright Pixel 9, 360x640 et iPhone : six voitures lisibles, bandeau,
  classement.
