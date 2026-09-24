# Paper Race : coincé, la voiture file dans le mur

Date : 2026-09-24. Statut : conception validée (« go », puis « reprend »).

## Pourquoi

Elle l'a vu en jouant : quand le prochain coup envoie dans le mur, la voiture
s'arrête au milieu de la route au lieu d'aller dans le mur. C'est illogique.

La cause : quand aucun des neuf points n'est jouable, le bouton devient
« Coincé : je m'arrête » et `stuck()` fige la voiture EXACTEMENT où elle est,
vitesse 0. Elle freine sur place, à n'importe quelle vitesse. La règle qui fait
glisser une voiture jusqu'au bord existe déjà dans le moteur (`play`, branche
« sortie », avec `crashPoint`), mais un joueur ne pouvait jamais la déclencher :
un point hors piste ne se choisit pas.

Mesuré sur les 330 courses de référence : 64 courses (19 %) ont au moins un
« coincé », 76 fois ; dans 42 cas la voiture aurait dû avancer de 1 à 4 cases.

## 1. La règle (`moteur.js`, `stuck`)

- Coincé = aucun point jouable. La voiture continue TOUT DROIT sur sa lancée :
  le moteur joue son point projeté (`projected`) avec `play`, qui sait déjà
  - l'arrêter sur la dernière case de piste avant le bord, vitesse 0, sortie
    comptée (branche « sortie ») ;
  - l'arrêter juste derrière une voiture qui bouche le passage (« blocage »).
- À l'ARRÊT (vitesse 0), rien ne change : elle reste où elle est (le point
  projeté est la case même ; la faire « jouer » ajouterait un pas au tracé).
- L'événement porte `coince: true`, pour que l'écran le dise.
- Pars inchangés : le tour parfait ne se coince jamais.

## 2. À l'écran (`ui.js`)

- La voiture GLISSE jusqu'au mur, avec la secousse et le son de sortie : le
  coincé passe par la même animation qu'un coup joué.
- Le message : « Trop vite : la voiture Bleue finit dans le mur » (ou « derrière
  l'autre voiture » quand c'est une voiture qui bouche). À l'arrêt, le message
  d'aujourd'hui reste (« n'a plus aucune trajectoire : elle s'arrête net »).
- Le bouton dit ce qui va se passer : « Tout droit dans le mur » quand la
  voiture roule, « Coincé : je m'arrête » quand elle est à l'arrêt.

## 3. En ligne : une salle ne mélange pas deux versions des règles

Les téléphones rejouent chacun la course. Un téléphone resté en v16 (une appli
installée s'ouvre d'abord sur sa version en cache) laisserait la voiture sur
place, l'autre la mettrait contre le mur : deux courses différentes, pour de bon.

- `moteur.js` expose `REGLES = 2` (1 = toutes les versions jusqu'à la v16).
- Relais **pr-4** : la salle retient `regles` à sa création ; à la connexion, le
  téléphone donne les siennes (`?regles=2`). Différentes : refus, code 4026, et
  le relais dit la version de la salle. Un téléphone de la v16 n'envoie rien, une
  salle de la v16 n'a rien : ils se reconnaissent entre eux, et les courses en
  cours au moment du déploiement continuent.
- Le jeu v17 affiche : « La course a été créée avec une autre version du jeu.
  Fermez et rouvrez le jeu tous les deux, puis relancez une course. »
- Déployer le relais AVANT le jeu, comme pr-2 et pr-3.

## Ce qu'on ne fait pas

- La voiture ne sort pas dans l'herbe (le moteur ne sait pas rouler hors piste).
- Aucun tour perdu en plus.
- Le hasard n'entre pas dans la règle : tous les téléphones calculent pareil.

## Contrôles

- Moteur : une voiture lancée vers un mur, sans point jouable, finit sur la
  dernière case avant le bord, vitesse 0, une sortie comptée ; lancée vers une
  voiture, elle s'arrête derrière ; à l'arrêt, elle ne bouge pas et son tracé ne
  s'allonge pas. Vu rouge avec l'ancienne règle.
- Référence : régénérée ; SEULES les courses qui contiennent un « coincé »
  changent (compté, pas supposé).
- Relais : une salle pr-4 refuse un téléphone sans version ou d'une autre
  version, accepte la sienne ; une salle sans version accepte un téléphone sans
  version.
- Navigateur : coincé en roulant, la voiture arrive au bord de la piste, le
  bouton et le message le disent.
- Tout le reste : circuits (pars), pièges, UI, PWA, grille, en ligne contre le
  relais local puis la PROD.
