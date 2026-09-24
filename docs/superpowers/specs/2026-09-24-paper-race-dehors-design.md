# Paper Race : dans le mur pour de vrai, et plus de demi-tour du tout

Date : 2026-09-24. Statut : conception validée (son choix : « A »).

## Pourquoi

Elle a rejoué la v19 sur Monza, capture à l'appui (le menu disait bien
« v19 · service v19 · caches v19 ») :

1. **« Je devais sortir de piste mais il m'a arrêté avant le mur. »** La v17
   arrêtait la voiture coincée sur la DERNIÈRE case de route avant le bord. Elle
   voulait la voiture DANS le mur (sa phrase d'origine : « au lieu d'être dans le
   mur/champ »). J'avais pris son « go » pour un oui à « contre le mur » : à tort.
2. **« J'ai réussi à faire demi-tour plusieurs fois malgré les points en rouge
   interdit. »** La v19 interdisait de reculer en roulant, mais « à l'arrêt tout
   est permis » ouvrait une faille : reculer d'une case, freiner, reculer encore.
   Sur sa capture, le point du milieu est caché sous un cercle.

## 1. Dans le mur pour de vrai (`moteur.js`, `play`, branche sortie)

- Coincé en roulant, la voiture file tout droit et s'arrête sur la PREMIÈRE case
  hors piste de sa trajectoire (sable, herbe) : `dehors: true`, vitesse 0,
  sortie comptée. Son point de retour (`retour`) est la dernière case de route
  avant le bord ; c'est lui qui compte pour l'avancement et le tour.
- Si cette case sort de la feuille, ou si une voiture y est déjà : elle s'arrête
  sur la route, comme en v17.
- **Revenir** : au coup suivant, ses seuls choix sont les cases de piste voisines
  à la fois d'elle ET du point de retour (sinon, sortie dans une épingle, elle
  rentrerait sur l'autre branche : un raccourci). Rester dehors n'est pas un choix.

## 2. Plus de demi-tour du tout (`choices` ET `suivants`)

- À l'arrêt non plus, on ne recule pas.
- Seule exception, mesurée : une case d'où AUCUNE case voisine ne mène vers
  l'avant. Il y en a 136, toutes sur les 3 petits circuits, au bord des îlots ;
  aucune sur les 8 grands. Là seulement, reculer reste permis, sinon la voiture
  serait prise pour toujours.
- La même règle dans `suivants` (la prévision du fantôme), comme en v19.

## 3. À l'écran

- La voiture glisse jusque DANS le mur ; le message : « Trop vite : la voiture
  Bleue finit dans le mur ».
- Dehors, la pastille du plateau : « Hors piste : reviens sur la route ».

`REGLES = 4` (le relais pr-4 refuse de mélanger les versions).

## Contrôles

- Moteur : le cas de Montréal finit HORS piste, collé au bord, `retour` = la case
  d'avant, avancement compté jusqu'au retour ; de là, seuls des retours sur la
  route voisins des deux points ; à l'arrêt sur une ligne droite, reculer est
  interdit ; sur une case sans avant (petit circuit), permis. Vu rouge avec
  l'ancienne règle.
- Navigateur : la voiture est dessinée dehors, le pavé ne propose que le retour,
  la pastille le dit ; à l'arrêt, le panneau sens interdit est là aussi.
- Pars, niveaux, ordre, équité, référence régénérée ; UI, PWA, en ligne local
  puis prod.
