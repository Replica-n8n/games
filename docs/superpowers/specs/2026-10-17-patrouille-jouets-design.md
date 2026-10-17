# La Patrouille des Jouets : design

Date : 2026-10-17. Titre provisoire. Shoot'em up vertical, PWA, pour 8 ans et plus.
Dossier : `games/patrouille/`, jeu autonome, listé dans l'Arcade.

## Public et principes

- Enfant de 8 ans, téléphone tenu d'une main, en portrait.
- Aucune violence réaliste : les ennemis éclatent en confettis, les méchants
  sont plus rigolos qu'effrayants.
- Presque pas de texte à lire : tout ce qui compte se voit (icônes, jauges,
  prix en boutons dessinés).

## Univers

La nuit, les jouets d'une chambre prennent vie. Le Roi Poussière sort de sous
le lit et vole la veilleuse. Les jouets partent la reprendre, pièce après pièce,
jusqu'à la Lune.

Introduction : 3 images au premier lancement, passables d'un toucher, revoyables
depuis la carte.

## Menu : la carte de la maison

Écran d'accueil = carte avec 4 étapes reliées par un chemin en pointillés :
Jardin → Salon → Baignoire → Lune.

- Déblocage **dans l'ordre strict** : battre le boss d'une étape ouvre la
  suivante. Une étape fermée affiche un cadenas.
- Une étape déjà gagnée reste rejouable (pour gagner des boutons).
- Accès à l'Atelier depuis la carte.
- Bouton « Installer » sur cet écran dès la première livraison.

## Les 4 modes

| Mode | Jouet | Tir | Super-pouvoir | Ennemis | Boss |
|---|---|---|---|---|---|
| Aérien, Jardin | Avion en papier | Trombones | Rafale de feuilles (balaie l'écran) | Guêpes, cerfs-volants pirates, graines | L'Épouvantail |
| Terrestre, Salon | Voiture télécommandée | Bouchons | Turbo : traverse tout sans dégât quelques secondes | Soldats de plomb, Lego qui roulent, toupies | L'Aspirateur |
| Aquatique, Baignoire | Canard sous-marin | Bulles | Grosse bulle qui emprisonne les ennemis proches | Poissons-éponges, bateaux de bain, mousse | La Pieuvre-savon |
| Spatial, Lune | Fusée en carton | Gommettes étoiles | Pluie d'étoiles | Moutons de poussière, satellites-jouets | Le Roi Poussière |

Particularité : dans la Baignoire, le décor **défile vers le bas** (on plonge
vers la bonde). Les trois autres défilent vers le haut.

Taille v1 : **1 niveau + 1 boss par mode**, environ 3 à 4 minutes chacun.

## Déroulé d'une partie

- **Commandes** : le jouet suit le doigt, décalé au-dessus de lui pour rester
  visible. Tir automatique et continu. Un gros bouton (en bas, côté pouce)
  lance le super-pouvoir quand sa jauge est pleine ; la jauge se remplit en
  battant des ennemis.
- **Cœurs** : 3 au départ (plus avec l'Atelier). Un coup reçu retire un cœur
  et rend le jouet invulnérable un court instant (clignote).
- **Drapeaux** : deux par niveau, au milieu et juste avant le boss. À zéro
  cœur, on repart du dernier drapeau franchi, cœurs remplis, boutons du
  passage perdus depuis ce drapeau. Jamais de retour au début du niveau.
- **Boutons de couture** : monnaie, lâchés par les ennemis, à ramasser.
- **Boss** : barre de vie visible, 2 phases (la seconde change d'attaque).
  Le battre gagne l'étape et ouvre la suivante.
- Messages en bas de l'écran, jamais par-dessus l'action.
- Pause accessible à tout moment, et automatique quand l'app passe en arrière-plan.

## L'Atelier

Entre les niveaux, on dépense ses boutons. Pour **chaque jouet**, 3
améliorations à 3 niveaux chacune :

1. Puissance du tir (cadence puis tir double puis tir en éventail).
2. Un cœur de plus par niveau d'amélioration.
3. Aimant à boutons (rayon d'attraction croissant).

Prix affiché en boutons dessinés, achat visible tout de suite sur l'aperçu du
jouet. Les prix sont fixés par l'équilibrage robot (voir Vérifications).

## Hors v1 (volontairement)

Peintures et autocollants, album des ennemis, étoiles par niveau, plusieurs
niveaux par mode, jeu à deux, sons (à décider à part).

## Architecture

Un moteur unique et 4 fiches de mode (patron coquille + moteurs du dépôt).
Ajouter un niveau = écrire une fiche, pas du code de jeu.

```
patrouille/
  index.html, manifest.json, sw.js, icônes
  moteur.js        boucle à pas fixe, entités, collisions, drapeaux, boss
  controle.js      doigt, décalage, bouton du super-pouvoir
  dessin/          un fichier par jouet, famille d'ennemis, boss, décor
  modes/           jardin.js, salon.js, baignoire.js, lune.js
  atelier.js       améliorations et prix
  sauvegarde.js    localStorage, clé propre au jeu
```

- **Fiche de mode** : jouet, tir, super-pouvoir, sens du défilement, couches
  de décor en parallaxe, liste minutée des vagues, positions des drapeaux, boss
  (phases, attaques, points de vie).
- **Moteur** : ne connaît aucun mode en particulier ; il lit la fiche.
- **Sauvegarde** : étapes gagnées, boutons, niveaux d'amélioration par jouet,
  intro vue. L'Arcade, même origine, peut la relire pour « Reprendre ».
  Toute lecture et écriture protégée (try/catch), le jeu démarre même si le
  stockage est vide ou bloqué.

## Dessin

- Tout en canvas, contours d'abord puis dégradés et reflets ; aucun aplat.
- Boss au niveau des bustes de Pièce à conviction (expressions, yeux à reflets).
- Palette calculée et contrastes mesurés ; polices hébergées dans le dépôt.
- Aucun `backdrop-filter` pendant une partie ; zoom de page bloqué.

## Versions et cache

- Version en trois chiffres : `patrouille-1.0.0`.
- `?v=VERSION` sur les fichiers à l'installation du service worker,
  `reg.update()` au retour sur la carte.
- Chaque nouvel élément HTML reste facultatif côté JS (Pages cache le HTML).

## Vérifications

- **Tests du moteur** : collisions, perte de cœur et invulnérabilité, reprise
  au drapeau, déblocage dans l'ordre, prix et effets de l'Atelier, sauvegarde
  vide ou corrompue.
- **Robot joueur** par niveau : un robot « moyen » sans amélioration doit finir
  le Jardin ; les niveaux suivants sont réglés pour un robot ayant les
  améliorations qu'on peut s'offrir à ce stade.
- **Images par seconde** mesurées avec le GPU activé, sur le niveau le plus
  chargé.
- **PWA** : relance hors ligne prouvée, pas seulement la présence du manifeste.

## Ordre de construction

1. Planche visuelle : les 4 jouets, quelques ennemis, un boss, la carte du menu.
   Validée par elle avant tout code de jeu.
2. Moteur + Jardin jouable de bout en bout (avec drapeaux et boss).
3. Atelier et sauvegarde.
4. Salon, puis Baignoire (défilement inversé), puis Lune et le Roi Poussière.
5. Intro, Installer, captures avant livraison, et l'entrée dans l'Arcade selon
   « Ajouter un jeu » du `CLAUDE.md` : ligne du `README.md`, `JEUX` de
   l'`index.html` racine, icône dans `SHELL` du `sw.js` racine, `VERSION` de
   l'arcade augmentée, `arcade-pwa.mjs`, `docs/patrouille-versions.md` et
   `JEUX` de `tools/versions.test.mjs`.
