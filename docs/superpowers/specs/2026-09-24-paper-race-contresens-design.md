# Paper Race : on ne roule pas à contresens

Date : 2026-09-24. Statut : conception validée (son choix : « a »).

## Pourquoi

Elle l'a relevé : une voiture peut faire demi-tour et rouler à l'envers, ce qui
n'a aucun sens. Ce n'est pas une triche (repasser la ligne à l'envers retire un
tour), mais c'est absurde à voir, et à plusieurs une voiture à contresens peut
bloquer les autres de face.

Mesuré avant de trancher :
- le tour parfait ne recule JAMAIS : interdire tout recul ne change aucun des 11
  pars ;
- l'ordinateur recule 117 coups sur 20 872 (0,6 %), jusqu'à 4 cases, une fois
  6 coups de suite (surtout pour se replacer après une erreur dans une épingle).

## 1. La règle (`moteur.js`, `choices`)

- « Reculer » = un coup dont la progression sur la carte d'avancement est
  négative (`progress`, la même mesure que le tour et le classement).
- Quand la voiture ROULE, un point qui fait reculer n'est pas jouable : il porte
  `contresens: true` et `ok: false`.
- **À l'arrêt, tout est permis** (comme sur les pièges) : on peut toujours
  repartir, même mal placé, et on ne reste jamais coincé à cause de cette règle.
  Un pas en arrière à l'arrêt donne une vitesse vers l'arrière ; le coup suivant
  ne peut plus reculer davantage, il faut freiner ou tourner.
- L'ordinateur passe par `choices` : il suit la règle sans rien de plus. Le
  solveur des pars n'en dépend pas, et les pars ne bougent pas (mesuré).
- `REGLES = 3`. Le relais pr-4 refuse déjà de mélanger deux versions.

## 2. À l'écran

- Sur la piste : le point interdit porte un panneau **sens interdit** (disque
  rouge, barre blanche), distinct de la croix (hors piste) et du cercle barré à
  la couleur d'une autre voiture (case occupée).
- Le pavé : le bouton est grisé, son nom dit « Contresens : on ne recule pas ».
- Les règles « ? » : une ligne avec le panneau, « On ne roule pas à contresens.
  À l'arrêt, tu peux repartir dans tous les sens. »

## Ce qu'on ne fait pas

- Aucune sanction après coup (pas de sortie de piste pour contresens).
- Aucune tolérance « un peu » : c'est plus dur à expliquer.

## Contrôles

- Moteur : une voiture qui roule n'a aucun point jouable qui recule, et ces
  points portent `contresens` ; à l'arrêt, un pas en arrière est permis ; vu
  rouge sans la règle.
- Pars : `paper-race-circuits.js` inchangé (11 circuits).
- Référence régénérée. ⚠️ Prévu : « seules changent les courses où l'ordinateur
  reculait ». FAUX, mesuré : 288 puis 318 courses changent, car le fantôme tire
  un nombre au hasard par coup jouable (retirer un coup décale toute la suite).
  La preuve que rien d'autre n'a bougé vient donc des pars, niveaux, ordre et
  équité.
- ⚠️ Trouvé en route : le fantôme PRÉVOIT ses coups avec `suivants`, qui ignorait
  la règle ; il comptait se rattraper en reculant et sortait de la piste
  (Montréal 1,25 accident par course, ordre du championnat cassé, niveaux trop
  proches sur l'ovale). `suivants` applique maintenant la même règle : accidents
  1,39 au total contre 1,77 avant (8 courses par circuit), tout est vert.
- Niveaux, difficulté, équité : toujours séparés, dans l'ordre, équitables.
- Navigateur : le panneau est dessiné là où il faut (pixels), le pavé le dit,
  les règles le montrent ; UI (contraste, 44 px), PWA, en ligne.
