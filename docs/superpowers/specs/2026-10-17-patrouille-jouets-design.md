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
| Aérien, Jardin | Avion en papier | Trombones | Rafale de feuilles (balaie l'écran) | voir « Ennemis » | L'Épouvantail |
| Terrestre, Salon | Voiture télécommandée | Bouchons | Turbo : traverse tout sans dégât quelques secondes | voir « Ennemis » | L'Aspirateur |
| Aquatique, Baignoire | Canard sous-marin | Bulles | Grosse bulle qui emprisonne les ennemis proches | voir « Ennemis » | La Pieuvre-savon |
| Spatial, Lune | Fusée en carton | Gommettes étoiles | Pluie d'étoiles | voir « Ennemis » | Le Roi Poussière |

Particularité : dans la Baignoire, le décor **défile vers le bas** (on plonge
vers la bonde). Les trois autres défilent vers le haut.

Taille v1 : **1 niveau + 1 boss par mode**, environ 3 à 4 minutes chacun.

## Ennemis : 8 par monde

Décidé le 2026-10-17 après la veille du genre (voir « Ce qu'on retient des
meilleurs ») : 2 ou 3 types par monde, c'était trop peu. DonPachi compte
environ 12 types par niveau, en majorité des petits qui meurent d'un tir.
Pour un niveau de 3 à 4 minutes et un enfant de 8 ans : **3 petits, 3 moyens,
1 gros, puis le boss**. Les **moutons de poussière** (soldats du Roi) passent
aussi dans les quatre mondes, en petit nombre : c'est le fil de l'histoire.

| Monde | Petits (un tir) | Moyens | Gros |
|---|---|---|---|
| Jardin | guêpes en V, graines d'érable qui tournoient, coccinelles | cerf-volant pirate (zigzag, tire), libellule qui s'arrête et vise, pissenlit planté qui sème en étoile | ruche suspendue qui lâche des guêpes |
| Salon | billes qui roulent, toupies qui rebondissent sur les bords, soldats de plomb en rang | brique qui roule et fonce, diable en boîte qui surgit, robot à clé | train électrique en plusieurs wagons |
| Baignoire | poissons-éponges, bulles de mousse qui éclatent en petites bulles, crevettes | bateau de bain, poisson-ballon qui gonfle et éclate en piquants, crabe en pinces à linge | requin gonflable |
| Lune | moutons de poussière, boulettes de papier, étoiles filantes | satellite mécanique, soucoupe en assiette en carton, robot astronaute | station en boîte de conserve |

Rôles : un **petit** sert de « popcorn » (vient en groupe, meurt d'un tir, rapporte
des boutons) ; un **moyen** pose une question au joueur (viser, esquiver, choisir
sa cible) ; le **gros** encaisse, occupe l'écran et protège ou fabrique des petits.
Chaque ennemi a son propre comportement dans sa fiche ; un même gabarit recoloré
ne compte pas comme un nouvel ennemi.

## Déroulé d'une partie

- **Commandes** : on glisse n'importe où sur l'écran et le jouet reproduit le
  mouvement du doigt (commande relative, façon DoDonPachi sur téléphone) : le
  doigt peut rester en bas, il ne cache jamais le jouet. Un très léger lissage
  du mouvement (comme Sky Force) rend l'esquive naturelle. Le jouet ne sort
  jamais de l'écran. Tir automatique et continu. Un gros bouton (en bas, côté pouce)
  lance le super-pouvoir quand sa jauge est pleine ; la jauge se remplit en
  battant des ennemis.
- **Cœurs** : 3 au départ (plus avec l'Atelier). Un coup reçu retire un cœur
  et rend le jouet invulnérable un court instant (clignote).
- **Drapeaux** : deux par niveau, au milieu et juste avant le boss. À zéro
  cœur, on repart du dernier drapeau franchi, cœurs remplis, boutons du
  passage perdus depuis ce drapeau. Jamais de retour au début du niveau.
- **Boutons de couture** : monnaie, lâchés par les ennemis, à ramasser.
- **Bonus à attraper pendant le niveau** (façon TwinBee) : un ennemi
  **porteur**, reconnaissable (il brille et tient un paquet cadeau), lâche un
  cadeau. Trois bonus : **tir double** 10 s, **bouclier** qui absorbe un coup,
  **aimant géant** 10 s (tous les boutons de l'écran arrivent). Perdus à la fin
  du niveau ou en repartant d'un drapeau. Le cadeau dit ce qu'il contient par
  son dessin, jamais par un mot.
- **Zone touchée** bien plus petite que le dessin du jouet (le cœur du jouet,
  autour des yeux) : frôler un tir ne fait rien.
- **Tirs ennemis** : lents, gros, d'une même couleur vive dans les quatre
  mondes, cerclés de sombre, jamais dans une teinte du décor ni des tirs du
  joueur. On doit les voir du coin de l'œil.
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

## Ce qu'on retient des meilleurs

Veille du 2026-10-17 (DonPachi, DoDonPachi sur téléphone, Sky Force, TwinBee et
Parodius, jeux de tir gratuits du type Galaxy Attack, articles de Game Developer).

**On prend :**
- le mélange petits, moyens, gros qui ne se comportent pas pareil ;
- chaque vague est une petite énigme qui demande une décision ; la première
  vague du niveau est facile ; un ennemi nouveau arrive d'abord **seul**, puis
  mélangé aux autres ; des respirations entre les passages chargés ;
- le boss est **annoncé** (alerte, puis calme), ses attaques reprennent ce que le
  niveau a montré, et le premier boss se bat sans tout perdre ;
- des tirs ennemis vifs et lents ; la commande relative ; une zone touchée petite ;
- des bonus qu'on voit et qu'on a envie d'attraper, et rien à lire pour jouer.

**On évite :**
- pub pour continuer, achats qui font gagner, énergie qui se recharge, chat
  ouvert : **aucun** dans ce jeu ;
- des ennemis trop familiers et des décors fades (reproche fait à Sky Force) :
  chaque ennemi est un objet de la maison détourné, avec un visage ;
- rejouer dix fois le même niveau pour avancer : l'Atelier aide, mais un
  enfant qui joue bien passe chaque niveau du premier ou du deuxième coup ;
- les vagues répétées sans raison et les ennemis qui encaissent trop
  (« éponges ») : un petit meurt d'un tir, un moyen en 3 à 6.

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
  controle.js      glisser relatif, lissage, bouton du super-pouvoir
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
- **Lisibilité** : sur une capture de chaque niveau au plus chargé, les tirs
  ennemis se repèrent (contraste mesuré sur les pixels contre le décor).
- **Robot joueur** par niveau : un robot « moyen » sans amélioration doit finir
  le Jardin ; les niveaux suivants sont réglés pour un robot ayant les
  améliorations qu'on peut s'offrir à ce stade.
- **Images par seconde** mesurées avec le GPU activé, sur le niveau le plus
  chargé.
- **PWA** : relance hors ligne prouvée, pas seulement la présence du manifeste.

## Ordre de construction

1. Planche visuelle : les 4 jouets, quelques ennemis, un boss, la carte du menu
   (faite, `docs/patrouille-planche.png`). Puis une seconde planche : les ennemis
   qui manquent (8 par monde), l'ennemi porteur et ses 3 cadeaux, les tirs
   ennemis sur chaque décor. Validées par elle avant tout code de jeu.
2. Moteur + Jardin jouable de bout en bout (avec drapeaux et boss).
3. Atelier et sauvegarde.
4. Salon, puis Baignoire (défilement inversé), puis Lune et le Roi Poussière.
5. Intro, Installer, captures avant livraison, et l'entrée dans l'Arcade selon
   « Ajouter un jeu » du `CLAUDE.md` : ligne du `README.md`, `JEUX` de
   l'`index.html` racine, icône dans `SHELL` du `sw.js` racine, `VERSION` de
   l'arcade augmentée, `arcade-pwa.mjs`, `docs/patrouille-versions.md` et
   `JEUX` de `tools/versions.test.mjs`.
