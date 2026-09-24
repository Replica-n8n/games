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
- SANS exception. J'en prévoyais une (« 136 cases sans avant, au bord des îlots »)
  : FAUX, ces cases étaient des coins d'îlot d'où rien ne part ni n'arrive.
  Recompté en ne gardant que les cases d'où l'on peut bouger : AUCUNE sur les
  11 circuits n'interdit d'aller vers l'avant. Un contrôle permanent le garde vrai.
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
  interdit ; de toute case, on peut repartir vers l'avant (11 circuits). Vu rouge avec
  l'ancienne règle.
- Navigateur : la voiture est dessinée dehors, le pavé ne propose que le retour,
  la pastille le dit ; à l'arrêt, le panneau sens interdit est là aussi.
- Pars, niveaux, ordre, équité, référence régénérée ; UI, PWA, en ligne local
  puis prod.

## Ce que les mesures ont montré en route

- Équité : un premier banc (160 courses) donnait 31 % à la 3e place à 6 sur les
  vrais tracés. Sur 480 : 27 % en v19 COMME en v20. Du bruit, et un biais ancien.
  Le banc passe à 120 courses par circuit.
- Ordre du championnat : Montréal plus dur pour le fantôme (0,56 → 0,73 accident
  par course sur 200 courses ; les deux règles y contribuent), à égalité avec
  L'échelle et Monza. Le banc passe à 40 courses, et une égalité à 0,5 point près
  n'impose plus d'ordre ; il échoue toujours sur une vraie inversion (vu : Spa
  échangé avec Le canal).
