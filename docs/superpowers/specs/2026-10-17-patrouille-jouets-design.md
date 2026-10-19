# La Patrouille des Jouets : design

Date : 2026-10-17, refondue le 2026-10-19 (missions courtes, armes, idées de
Star Fox, Metal Slug et Saros). Titre provisoire. Shoot'em up vertical, PWA,
pour 8 ans et plus. Dossier : `games/patrouille/`, jeu autonome, listé dans
l'Arcade.

## Public et principes

- Enfant de 8 ans, téléphone tenu d'une main, en portrait.
- **Des séances courtes qui font avancer une aventure** : le rythme du chevalier
  (une partie vive) et la progression du requin (on reprend là où on s'était
  arrêté). Une mission dure 2 à 3 minutes ; une séance, 3 ou 4 missions,
  environ 10 minutes ; l'aventure entière, environ 1 h 15 en beaucoup de séances.
- Aucune violence réaliste : les ennemis éclatent en confettis, les méchants
  sont plus rigolos qu'effrayants.
- Presque pas de texte à lire : tout ce qui compte se voit (icônes, jauges,
  prix en boutons dessinés).
- Rendre le jeu plus varié ne doit pas le rendre plus facile : chaque aide est
  limitée (munitions, durée) et l'équilibrage se fait au robot puis en jouant.

## Univers

La nuit, les jouets d'une chambre prennent vie. Le Roi Poussière sort de sous
le lit, vole la veilleuse et enferme des jouets dans des cages de poussière.
La Patrouille part les délivrer, pièce après pièce, jusqu'à la Lune.

Introduction : 3 images au premier lancement, passables d'un toucher, revoyables
depuis la carte.

## La carte de la maison : l'aventure

L'écran d'accueil est la maison en coupe (planche validée). Chaque monde est une
pièce, et chaque pièce contient un **chemin de missions** :

- **5 missions + 1 mission du boss** par monde, soit 24 missions en tout.
- Un des chemins de chaque monde **bifurque** vers une **mission secrète**
  (Star Fox), fermée tant qu'on n'a pas réussi l'exploit qui l'ouvre (voir
  « Copain à sauver »). Elle rapporte une arme en avance et un jouet doré pour la
  chambre. On peut finir le jeu sans aucune mission secrète.
- Déblocage dans l'ordre : finir une mission ouvre la suivante ; battre le boss
  d'un monde ouvre le monde suivant. Une mission fermée affiche un cadenas.
- Une mission finie se rejoue quand on veut (boutons, prisonniers oubliés,
  chemin secret).
- **Reprendre là où on s'est arrêté** : le gros bouton du bas dit « Continuer :
  le Salon, mission 3 ». La pièce se rallume petit à petit, une lampe par
  mission finie.
- La **chambre** (le point de départ) se remplit des jouets délivrés : c'est la
  collection qu'on voit grandir d'une séance à l'autre.
- Accès à l'Atelier depuis la carte. Bouton « Installer » sur cet écran dès la
  première livraison.

## Les 4 mondes

| Mode | Jouet | Tir de base | Super-pouvoir | Boss |
|---|---|---|---|---|
| Aérien, Jardin | Avion en papier | Trombones | Rafale de feuilles (balaie l'écran) | L'Épouvantail |
| Terrestre, Salon | Voiture télécommandée | Bouchons | Turbo : traverse tout sans dégât quelques secondes | L'Aspirateur |
| Aquatique, Baignoire | Canard sous-marin | Bulles | Grosse bulle qui emprisonne les ennemis proches | La Pieuvre-savon |
| Spatial, Lune | Fusée en carton | Gommettes étoiles | Pluie d'étoiles | Le Roi Poussière |

Dans la Baignoire, le décor **défile vers le bas** (on plonge vers la bonde). Les
trois autres défilent vers le haut.

## Les missions

- **Une mission normale dure 2 à 3 minutes**, sans drapeau : si on perd tous ses
  cœurs, on la recommence (elle est courte). Elle finit par un gros ennemi ou une
  vague finale, puis un bilan : boutons, prisonniers délivrés, arme trouvée.
- **La mission du boss** a un drapeau juste avant le boss : à zéro cœur, on
  repart du drapeau, cœurs remplis.
- **Progression des ennemis dans un monde** : la mission 1 présente 3 ou 4
  ennemis, chaque mission en ajoute, la mission 5 les mélange tous ; le gros
  ennemi du monde sert de fin de mission 3 et 5, le boss reprend leurs attaques.
- Une mission = une fiche de vagues qui réutilise les ennemis dessinés : 24
  missions ne demandent pas plus de dessins que 4.

## Ennemis : 8 par monde

Décidé le 2026-10-17 après la veille du genre : DonPachi compte environ 12 types
par niveau, en majorité des petits qui meurent d'un tir. Ici : **3 petits,
3 moyens, 1 gros, puis le boss**. Les **moutons de poussière** (soldats du Roi)
passent dans les quatre mondes : c'est le fil de l'histoire.

| Monde | Petits (un tir) | Moyens | Gros |
|---|---|---|---|
| Jardin | guêpes en V, graines d'érable qui tournoient, coccinelles | cerf-volant pirate (zigzag, tire), libellule qui s'arrête et vise, pissenlit planté qui sème en étoile | ruche suspendue qui lâche des guêpes |
| Salon | billes qui roulent, toupies qui rebondissent sur les bords, soldats de plomb en rang | brique qui roule et fonce, diable en boîte qui surgit, robot à clé | train électrique en plusieurs wagons |
| Baignoire | poissons-éponges, bulles de mousse qui éclatent en petites bulles, crevettes | bateau de bain, poisson-ballon qui gonfle et éclate en piquants, crabe en pinces à linge | requin gonflable |
| Lune | moutons de poussière, boulettes de papier, étoiles filantes | satellite mécanique, soucoupe en assiette en carton, robot astronaute | station en boîte de conserve |

Rôles : un **petit** sert de « popcorn » (vient en groupe, meurt d'un tir,
rapporte des boutons) ; un **moyen** pose une question au joueur (viser,
esquiver, choisir sa cible) ; le **gros** encaisse, occupe l'écran et protège
ou fabrique des petits. Un même gabarit recoloré ne compte pas comme un nouvel
ennemi.

## Pendant une mission

- **Commandes** : on glisse n'importe où et le jouet reproduit le mouvement du
  doigt (commande relative, façon DoDonPachi sur téléphone), avec un léger
  lissage (Sky Force). Le doigt ne cache jamais le jouet, qui ne sort jamais de
  l'écran ni ne passe sous le bouton du super. Tir automatique et continu.
- **Super-pouvoir** : gros bouton en bas, côté pouce, actif quand la jauge est
  pleine. La jauge se remplit en battant des ennemis **et en avalant des tirs
  bleus** (voir plus bas).
- **Cœurs** : 3 au départ (plus avec l'Atelier). Un coup retire un cœur et rend
  le jouet invulnérable un court instant (il clignote) ; les tirs tout proches
  disparaissent.
- **Zone touchée** bien plus petite que le dessin (le cœur du jouet, autour des
  yeux) : frôler un tir ne fait rien.
- **Boutons de couture** : la monnaie, lâchés par les ennemis.
- Messages aux deux tiers de l'écran, jamais sur le jouet. Pause à tout moment,
  et automatique quand l'app passe en arrière-plan.

### Tirs bleus et tirs rouges (idée de Saros)

- **Rouges** (piquants, cerclés de sombre) : ils blessent, on les esquive.
- **Bleus** (bulles rondes à reflet) : le jouet les **avale** en les touchant,
  sans dégât, et chacun remplit un peu la jauge du super.
- Le choix : aller chercher les bleus au milieu des rouges pour charger le super,
  ou rester à l'abri. Les deux se distinguent par la couleur **et** la forme
  (lisibles sans voir les couleurs), et aucune des deux teintes n'apparaît dans
  les décors ni dans les tirs du joueur.

### Les armes (idée de Metal Slug)

Le tir de base dure toujours. Une **arme spéciale** se ramasse, dure un nombre de
tirs (jauge visible sous le jouet), puis on revient au tir de base. **Une seule à
la fois** : en ramasser une autre remplace la première, c'est un choix.

| Arme | Ce qu'elle fait |
|---|---|
| Lance-crayons | un trait qui traverse tous les ennemis alignés |
| Arrosoir | un jet continu, court mais très puissant de près |
| Élastiques | 5 tirs en éventail |
| Avions téléguidés | des petits avions qui vont chercher les ennemis tout seuls |
| Billes | elles rebondissent sur les bords de l'écran |
| Grosses bulles | lentes, elles éclatent en touchant plusieurs ennemis à la fois |

- **Collection** : une arme trouvée une fois peut ensuite tomber dans toutes les
  missions. On découvre les 6 au fil de l'aventure (une à deux par monde, une en
  avance par mission secrète). Elles se reconnaissent à leur dessin, jamais à
  une lettre.

### Les bonus

Lâchés par les **porteurs** (ennemis qui brillent et tiennent un paquet cadeau)
et par les **prisonniers** délivrés. Le cadeau dit ce qu'il contient par son
dessin.

- **Bouclier** : encaisse un coup.
- **Aimant géant** 10 s : tous les boutons de l'écran arrivent.
- **Toupies-compagnons** 15 s : deux toupies tournent autour du jouet et tirent
  avec lui (remplace l'ancien « tir double »).
- **Étoile** : invincible 5 s.
- **Cœur** : rend un cœur (rare).

Tous perdus à la fin de la mission.

### Jouets prisonniers (idée de Metal Slug)

- 2 ou 3 jouets par mission, enfermés dans des **cages de poussière** posées dans
  le décor ou portées par un ennemi. On tire sur la cage : le jouet est libre,
  lance un cadeau (une arme ou un bonus) et file vers la chambre.
- Le bilan de mission compte les délivrés (« 2 sur 3 »), la carte les montre par
  mission, et un prisonnier oublié donne une raison de rejouer.
- Perdre tous ses cœurs dans une mission remet son compte à zéro : on les
  délivre à nouveau en recommençant.

### Copain à sauver (idée de Star Fox)

- Dans certaines missions, un **copain jouet** arrive, poursuivi par des ennemis,
  et appelle à l'aide (une bulle avec un point d'exclamation, pas de texte).
- Les abattre avant qu'ils l'attrapent : il vole à côté du joueur et tire avec
  lui jusqu'à la fin de la mission. Le rater ne coûte rien d'autre.
- Le sauver dans la bonne mission est **l'exploit qui ouvre la mission
  secrète** du monde. La carte montre la bifurcation dès le début, cadenassée,
  avec le dessin du copain dessus : on sait quoi chercher.

### Le véhicule (idée de Metal Slug)

- Rare : une caisse de jouets tombe, et le jouet monte dans un **robot en Lego**
  pendant 20 secondes. Plus gros, tir puissant, il encaisse 5 coups sans que
  le joueur perde de cœur.
- À la fin (ou quand il a encaissé 5 coups), le robot se démonte en briques et
  le jouet repart, invulnérable un court instant.

### Le boss

- **Annoncé** (alerte, puis calme), barre de vie visible, 2 phases (la seconde
  change d'attaque et reprend les ennemis du monde).
- Il ne doit pas être une « éponge » : environ 45 s avec le jouet de départ
  (mesuré sur la POC : à 260 points de vie, l'Épouvantail tenait plus de 2 min).

## L'Atelier : ce qui reste d'une séance à l'autre

Entre les missions, on dépense ses boutons. Pour **chaque jouet**, 3
améliorations à 3 niveaux (comme l'arbre de Saros, mais simple) :

1. Puissance du tir de base (cadence, puis tir double, puis éventail).
2. Un cœur de plus par niveau.
3. Aimant à boutons (rayon croissant).

Prix affiché en boutons dessinés, achat visible tout de suite sur le jouet. Les
prix sont fixés par l'équilibrage robot. Mesuré sur la POC : environ 90 boutons
par niveau de 3 min 25, donc environ 60 par mission de 2 à 3 min.

Ce qui reste, en tout : missions finies, prisonniers délivrés et chambre, armes
découvertes, missions secrètes, boutons et améliorations.

## Réglages pour les parents (idée de Saros)

Dans un menu à part : cœurs supplémentaires, ralentir les tirs ennemis, rendre
le jouet invincible pour une séance. Ils aident sans rien changer à la
progression.

## Ce qu'on retient des meilleurs

Veilles du 2026-10-17 (DonPachi, DoDonPachi sur téléphone, Sky Force, TwinBee et
Parodius, jeux de tir gratuits du type Galaxy Attack, articles de Game Developer)
et du 2026-10-19 (Star Fox 64, Metal Slug, Saros).

**On prend :**
- le mélange petits, moyens, gros qui ne se comportent pas pareil ;
- chaque vague est une petite énigme qui demande une décision ; la première vague
  est facile ; un ennemi nouveau arrive d'abord **seul**, puis mélangé ; des
  respirations entre les passages chargés ;
- le boss annoncé, dont les attaques reprennent la mission, et un premier boss
  qui se bat sans tout perdre ;
- des tirs ennemis vifs et lents, la commande relative, une zone touchée petite ;
- **Star Fox** : chemins qui bifurquent vers une mission secrète, copain à sauver ;
- **Metal Slug** : armes à munitions, prisonniers qui donnent des cadeaux et dont
  le compte se perd à la mort, véhicule temporaire, humour ;
- **Saros** : tirs bleus à avaler pour charger le super, progression qui reste
  d'une partie à l'autre, réglages d'accessibilité ;
- des bonus qu'on voit, et rien à lire pour jouer.

**On évite :**
- pub pour continuer, achats qui font gagner, énergie qui se recharge, chat
  ouvert : **aucun** dans ce jeu ;
- des ennemis trop familiers et des décors fades (reproche fait à Sky Force) ;
- **trop peu d'armes**, le principal reproche fait à Saros : 6 armes et 5 bonus ;
- rejouer dix fois la même mission pour avancer : un enfant qui joue bien passe
  chaque mission du premier ou du deuxième coup ;
- les vagues répétées sans raison et les ennemis « éponges » : un petit meurt
  d'un tir, un moyen en 3 à 6.

## Hors v1 (volontairement)

Peintures et autocollants, album des ennemis, étoiles par mission, jeu à deux,
sons (à décider à part), « Nuit noire » (deuxième tour plus dur) et mode infini
(à voir après la v1).

## Architecture

Un moteur unique, des fiches de monde et des fiches de mission (patron coquille
+ moteurs du dépôt). Ajouter une mission = écrire une fiche, pas du code de jeu.

```
patrouille/
  index.html, manifest.json, sw.js, icônes
  moteur.js        boucle à pas fixe, entités, collisions, drapeau, boss
  controle.js      glisser relatif, lissage, bouton du super
  armes.js         tir de base, 6 armes spéciales, munitions
  bonus.js         cadeaux, porteurs, prisonniers, copain, véhicule
  dessin/          jouets, ennemis, boss, décors, carte (déjà commencés)
  mondes/          jardin.js, salon.js, baignoire.js, lune.js (ennemis, boss, décor)
  missions/        une fiche par mission (vagues minutées, prisonniers, porteurs)
  carte.js         la maison, les chemins, la bifurcation, « Continuer »
  atelier.js       améliorations et prix
  sauvegarde.js    localStorage, clé propre au jeu
```

- **Fiche de mission** : monde, liste minutée des vagues, position des cages et
  des porteurs, copain éventuel, drapeau éventuel, fin (gros ennemi ou boss).
- **Moteur** : ne connaît aucun monde en particulier ; il lit les fiches.
- **Sauvegarde** : missions finies et prisonniers par mission, missions
  secrètes, armes découvertes, boutons, améliorations par jouet, dernière
  mission jouée, intro vue, réglages des parents. L'Arcade, même origine, peut
  la relire pour « Reprendre ». Toute lecture et écriture protégée (try/catch),
  le jeu démarre même si le stockage est vide ou bloqué.

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

- **Tests du moteur** : collisions, tirs bleus avalés et rouges qui blessent,
  munitions et remplacement d'arme, bonus et leur durée, prisonniers et remise à
  zéro, copain et ouverture de la mission secrète, véhicule, drapeau du boss,
  déblocage dans l'ordre, Atelier, sauvegarde vide ou corrompue.
- **Lisibilité** : sur une capture de chaque monde au plus chargé, les tirs
  rouges et bleus se repèrent (contraste mesuré sur les pixels contre le décor).
- **Robot joueur** par mission (banc de la POC étendu) : durée de 2 à 3 min, un
  robot moyen avec les améliorations qu'on peut s'offrir à ce stade finit la
  mission ; boss autour de 45 s.
- **Images par seconde** mesurées avec le GPU activé, sur la mission la plus
  chargée.
- **PWA** : relance hors ligne prouvée, pas seulement la présence du manifeste.

## Ordre de construction

1. Planche visuelle (faite, `docs/patrouille-planche.png`) et POC des mécaniques
   (validée par elle le 2026-10-19, `patrouille/poc.html`).
2. **POC 2, toujours en formes simples** : armes à munitions, 5 bonus, tirs bleus
   et rouges, prisonniers, copain, véhicule, et 3 missions courtes sur une carte
   minimale avec « Continuer ». Validée par elle avant le vrai moteur.
3. Seconde planche : les ennemis qui manquent, porteur, cages, copain, robot en
   Lego, les 6 armes et les cadeaux, les tirs bleus et rouges sur chaque décor.
4. Moteur + Jardin complet (6 missions dont la secrète, boss), carte, sauvegarde,
   Atelier.
5. Salon, puis Baignoire (défilement inversé), puis Lune et le Roi Poussière.
6. Intro, réglages des parents, Installer, captures avant livraison, et l'entrée
   dans l'Arcade selon « Ajouter un jeu » du `CLAUDE.md` : ligne du `README.md`,
   `JEUX` de l'`index.html` racine, icône dans `SHELL` du `sw.js` racine,
   `VERSION` de l'arcade augmentée, `arcade-pwa.mjs`,
   `docs/patrouille-versions.md` et `JEUX` de `tools/versions.test.mjs`.
