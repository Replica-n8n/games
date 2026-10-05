# Rogue-lite : ce que font les meilleurs, et ce qu'on en tire

Recherche du 2026-10-05, demandée par Julie avant toute simulation. Six analyses
lues par un outil qui en rend un résumé détaillé (je n'ai pas eu le texte brut
sous les yeux : les citations ci-dessous sont celles que l'outil a rendues).

## Ce que disent les sources

**Slay the Spire, équilibrage par les chiffres** (Mega Crit, GDC 2019)
- Deux mesures de base par carte : le taux de PRISE (combien de fois elle est
  choisie quand elle est offerte) et le taux de VICTOIRE des paquets qui la
  contiennent. Ils sont passés de 3 graphiques à plus de 90.
- Une carte que personne ne prend « n'est pour ainsi dire pas une carte du jeu ».
  Une carte trop présente dans les paquets gagnants est trop forte.
- Des changements francs et tôt valent mieux que des retouches timides.
- En solo il n'y a pas d'équité à tenir entre joueurs : on règle pour le plaisir.
  Le hasard des rencontres force la variété et soulage l'équilibrage.

**Slay the Spire, la forme des décisions** (Cloudfall Studios)
- Une solution ne résout jamais tout : elle règle une partie du problème, a un
  coût, ou donne un bonus seulement possible. Exemple : plus de dégâts, mais une
  carte morte ajoutée au paquet.
- « Si un choix est évidemment le meilleur quels que soient ton passé et ton
  avenir, on a échoué. » Une carte doit marcher seule et récompenser la
  combinaison.
- Montrer la menace à venir : le joueur choisit pour ce qu'il VOIT arriver, pas
  avec une calculette.
- Tenir une tension entre le court terme (fort tout de suite) et le long terme
  (qui grandit), avec des ennemis qui punissent tantôt l'un, tantôt l'autre.

**« Un parmi trois » est une occasion manquée** (Keith Burgun)
- Si les pouvoirs sont peu liés à la situation, le choix est arbitraire ; s'ils
  y sont très liés et sans contrainte, le meilleur est évident. Dans les deux cas
  c'est un tirage déguisé en décision.
- Remède : faire sortir le choix du jeu lui-même, avec un prix à payer pour
  chaque option (plus ou moins accessible, plus ou moins risquée), plutôt que
  d'un menu posé à côté.

**Balatro, pourquoi c'est jouissif** (Blake Crosley)
- Chaque joker se déclenche à son tour, de gauche à droite, rebondit, et le
  total monte après lui : on APPREND quelles combinaisons comptent en les voyant
  agir. « 300 ms d'animation remplacent la notice. »
- Plusieurs canaux empilés sur chaque événement (carte, compteur, secousse,
  son), aucun ne porte tout seul. La secousse grandit avec le score : c'est une
  information, pas un décor.
- Deux couleurs, deux sens (jetons, multiplicateur) : la couleur EST l'étiquette.

**Ce qui donne ou retire le sentiment de décider** (thom.ee)
- Le hasard d'AVANT la décision (on voit, puis on choisit) donne de la prise ; le
  hasard d'APRÈS (on choisit, puis les dés tombent mal) en retire. Un coup de
  chance après coup passe, un coup de malchance frustre.
- Les premiers choix doivent compter jusqu'à la fin. Les stratégies amusantes
  doivent aussi être celles qui gagnent. Des combinaisons cachées très fortes
  sont une bonne chose.
- Trop de progression permanente entre les parties tue la maîtrise : la partie
  doit pouvoir se gagner dès la première, à l'adresse seule.

**Cinq conseils pour un rogue-lite** (Entalto Studios)
- Préférer ce qui change la façon de jouer à ce qui gonfle un chiffre.
- Hasard pondéré, pas tirage pur ; pouvoir se rattraper d'un mauvais départ.
- Deux pièges symétriques : tout se vaut (le choix ne veut rien dire), ou un
  objet écrase tout (la difficulté disparaît).
- Des parties courtes ; ne pas les allonger artificiellement.
- La sortie n'est pas la fin : ce sont les vraies parties qui montrent les
  combinaisons cassées.

## Ce que ça décide pour La Bataille

1. **On mesure comme Slay the Spire.** Le robot donne, pour chaque récompense, le
   gain de victoires qu'elle apporte seule. Sous le bruit de la mesure, elle
   « n'est pas une carte » : on la renforce ou on la retire. Au-dessus d'une
   douzaine de points, elle écrase les autres : on la baisse ou on lui met un prix.
2. **Des récompenses qui tordent une règle** plutôt que « +10 % » : les petites
   cartes qui frappent comme des Valets, le premier coup doublé pour toi seule.
3. **Un prix dans certaines** : plus de dégâts contre moins de vie. C'est ce qui
   fait un vrai choix.
4. **La valeur doit dépendre de la situation** : le ciel des mois à venir est
   connu d'avance (hasard d'avant la décision), donc une faveur sur les Cœurs vaut
   plus avant le mois des Poissons. À afficher sur l'écran de choix.
5. **Chaque récompense se VOIT agir** en combat, à son tour, comme l'étoile d'or
   des mois. Sans ça elle n'existe pas pour la joueuse (déjà vécu avec les arcanes
   et les flèches).
6. **Peu au départ, courtes parties.** Une dizaine de récompenses mesurées ; une
   année ne doit pas durer deux fois plus longtemps.
7. **Pas de progression permanente pour l'instant** : une année doit pouvoir se
   gagner dès la première.

Limite assumée : on garde l'écran « une parmi trois », que Burgun critique. Le
remède retenu est de lier chaque option à la situation (points 3 et 4), pas de
changer de forme. À revoir si, en jouant, le choix lui paraît toujours le même.

## Sources

- https://www.gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder
- https://www.cloudfallstudios.com/blog/2020/11/2/game-design-tips-reverse-engineering-slay-the-spires-decisions
- https://keithburgun.net/pick-1-of-3-is-a-missed-game-design-opportunity/
- https://blakecrosley.com/guides/design/balatro
- https://thom.ee/blog/what-makes-or-breaks-agency-in-roguelikes/
- https://entaltostudios.com/5-essential-tips-to-make-your-roguelite-game-work/

## Première simulation (2026-10-05)

`node tools/bataille-equilibre.mjs 300 --recompenses` : chaque idée donnée seule au
robot « hasard », le Maudit ne recevant rien. Repère : 53 % de victoires, bruit de
8 points. Gain en points de victoire :

| Récompense | Gardée toute l'année | Un seul mois (le premier) |
|---|---|---|
| Renfort : une sixième carte | +47 | +20 |
| Vampire : se soigne de 20 % de ses coups | +44 | +13 |
| Infirmerie : 15 % de vie en plus | +44 | +10 |
| Garde royale : figures à 30 % de vie en plus | +42 | +10 |
| Pari : 40 % de dégâts en plus, 20 % de vie en moins | +36 | +8 |
| Premier sang : premier coup doublé | +47 | +6 |
| Main pleine : un arcane de plus | +8 | +3 |
| Rempart : 15 % de dégâts reçus en moins | +45 | +2 |
| Butin : une carte de plus par mois gagné | +17 | 0 |
| Protégée des Cœurs : Cœurs à 25 % de dégâts en plus | +27 | 0 |
| Les petits : 7, 8, 9 frappent comme des Valets | +25 | -5 |

Ce que ça dit :
- **Le jeu fait boule de neige.** Un avantage de 15 % gardé douze mois donne près
  de 100 % de victoires : chaque mois gagné rapporte des cartes, qui font gagner
  le suivant. Aucune « faveur de toute l'année » de cette taille n'est jouable si
  le Maudit ne reçoit rien.
- **Sur un seul mois, les ordres de grandeur sont sains** (0 à +13), sauf le
  Renfort (+20) : une carte de plus pèse plus que n'importe quel pourcentage.
- **La vie vaut plus que les dégâts** : soin et vie donnent +10 à +13, les bonus de
  dégâts restent dans le bruit sur un mois.
- **Un arcane seul vaut peu** (+3 à +8) : ce qui coûtait cher, c'était de n'en
  lancer aucun.

Limites : « un seul mois » veut dire ici le PREMIER mois, là où l'avance pèse le
plus longtemps ; la longue-vue n'est pas mesurable par le robot ; aucune paire de
récompenses n'a été mesurée ensemble.
