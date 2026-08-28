# Un « survivants » dans la prairie

Spec de conception, 2026-08-27. Remplace
[la spec du serpent](2026-08-27-serpentin-prairie-design.md) du même jour, dont
le code sert de socle.

⚠️ **Le nom du jeu n'est pas choisi.** Le dossier reste `games/serpentin/` et
l'adresse reste `replica-n8n.github.io/games/serpentin/`, comme `echecs/` qui
s'appelle encore comme ça alors qu'il contient aussi les dames : une adresse
déjà en ligne ne se change pas pour faire joli. Le titre affiché, le manifeste
et l'icône changeront quand le nom sera décidé.

## Le jeu de référence, vérifié

Vampire Survivors, de poncle. Ce qui suit a été relevé sur la fiche Steam, le
wiki du jeu et des tests de presse, pas de mémoire :

- **on ne contrôle que le déplacement**, les armes frappent seules à intervalle
  régulier
- une partie dure **30, 20 ou 15 minutes** selon le niveau ; au bout du temps
  imparti le **Faucheur** arrive et tue le joueur, un par minute
- les ennemis tués lâchent des **gemmes d'expérience** ; au dessus de 400
  gemmes au sol elles fusionnent
- monter de niveau **met le jeu en pause** et propose **3 ou 4 choix**
- **6 armes et 6 objets passifs** au maximum
- une arme évolue si elle est **au niveau 8**, qu'on porte **l'objet passif**
  correspondant, et qu'on ramasse **un coffre**
- une **vague par minute** ; au dessus de **300 ennemis vivants** les vagues
  s'arrêtent
- les ennemis diffèrent par le déplacement : poursuite, direction fixe, ondulé,
  immobile qui tire, ou qui explose
- entre deux parties, les pièces achètent **28 améliorations permanentes**,
  27 148 513 pièces pour tout maximiser

## Pour qui

**Un enfant de 8 ans.** Comme pour le serpent, c'est cette phrase qui tranche.

| Dans le jeu d'origine | Ici | Pourquoi |
|---|---|---|
| 30 minutes | **8 minutes** | trois fois trop long pour un enfant |
| le Faucheur, imbattable | **un boss battable à la 8ᵉ minute** | on perd toujours dans l'original, par conception. Ici gagner est possible |
| 6 armes + 6 objets | **4 armes + 4 objets** | douze choses à suivre, c'est trop |
| évolution : arme au max + objet + coffre | **arme au max + objet, et ça évolue seul**, annoncé en grand | une règle cachée en trois morceaux ne s'apprend pas tout seul |
| points de vie et armure chiffrés | **5 cœurs** et une seconde d'invincibilité après un coup | un cœur qui disparaît se comprend sans lire |
| vampires, gothique | la prairie, puis volcan, château, vaisseau | déjà décidé et maquetté |
| 27 millions de pièces | **les 20 niveaux et 6 quêtes déjà écrits** | pas de monnaie, pas de grind sans fin |

## Ce que l'enfant peut suivre, mesuré ailleurs

Trois chiffres décident de la mise en scène, et ils ne viennent pas de moi.

| Mesuré | Résultat |
|---|---|
| suivre des objets en mouvement, tâche « Catch the Spies », 6 à 19 ans | 6 ans : 2 objets. **8 ans : 3 objets.** Adulte : 4 |
| reconnaître une quantité d'un coup d'œil, sans compter | 3 à 4 |
| percevoir une foule | le système visuel ne compte pas, il **résume** : une foule est perçue comme une texture, avec sa direction et sa vitesse moyennes |
| temps de réaction à 8 ans | **2 à 3 fois plus lent** qu'un jeune adulte |

**La limite n'est donc pas le nombre de bestioles.** Soixante escargots qui font
tous la même chose ne sont pas soixante choses à suivre, c'en est une : une
masse qui avance. Ce qui sature, c'est le nombre de bestioles qu'il faut suivre
**une par une** parce qu'elles font chacune autre chose.

D'où trois règles, non négociables :

1. **Au plus trois « individus » à l'écran** : hérisson, crapaud, pissenlit,
   Reine. Tout le reste est de la masse. Un individu doit être visiblement
   différent de la foule : plus gros, plus contrasté, avec un halo.
2. **Soixante bestioles au plafond**, pas 300. Pas pour une raison cognitive :
   le jeu de référence remplit un écran de PC, le Pixel 9a fait 360 × 732
   points, soit huit fois moins de surface. À densité égale, ça fait une
   soixantaine.
3. **Une seconde de préavis avant tout ce qui frappe.** Le hérisson se met en
   boule et s'arrête avant de charger, le crapaud gonfle avant de cracher, le
   pissenlit enfle avant d'éclater. Un enfant qui réagit deux à trois fois plus
   lentement ne peut rien faire d'une attaque qui part sans prévenir.

## Une partie

Huit minutes. **On joue un chevalier.** Il se déplace, ses armes frappent
toutes seules. Les bestioles arrivent par vagues, une nouvelle vague chaque
minute. Les bestioles tuées lâchent des **graines d'expérience** qu'on ramasse
en passant dessus.
Assez de graines et on monte de niveau : **le jeu s'arrête et propose trois
choix**. À la 8ᵉ minute arrive **la Reine**, qu'on peut battre.

Une partie finit de trois façons : les cinq cœurs sont perdus, la Reine est
battue (victoire), ou le joueur arrête.

### Ce qui blesse

Le contact avec une bestiole coûte **un cœur**, puis le joueur est
**invincible 1,8 seconde**, et **le choc repousse les bestioles collées à
lui**. Une seconde ne suffisait pas : on ressortait du délai dans le même tas
et on reperdait un cœur aussitôt. Sans ce délai, entrer dans
un groupe coûte cinq cœurs en un dixième de seconde, et l'enfant ne comprend
pas ce qui s'est passé.

Les obstacles du décor (buissons) **ne blessent pas** : ils ralentissent, comme
dans le serpent. Le bord de l'arène ne blesse pas non plus.

### Les bestioles

Les cinq comportements viennent des catégories vérifiées du jeu d'origine,
habillées pour la prairie.

| Bestiole | Comportement | Arrive à partir de |
|---|---|---|
| **Escargot** | te suit lentement, sans jamais lâcher | 0:00 |
| **Abeille** | rapide, trajectoire ondulée | 0:35 |
| **Hérisson** | se met en boule à **210 unités**, s'arrête une seconde, puis **fonce tout droit** assez loin pour traverser | 1:10 |
| **Crapaud** | ne bouge pas, gonfle, puis **crache une bulle** | 1:55 |
| **Pissenlit** | s'approche, **enfle**, puis éclate | 2:40 |

⚠️ **Le hérisson doit pouvoir toucher.** Il se préparait à 320 unités, sa ruée
le laissait à 80 du chevalier, immobile, dans la portée des armes : mesuré,
avec trois boucliers il ne s'approchait jamais à moins de 77 unités alors que
le contact est à 31. Il se prépare maintenant à 210, charge assez longtemps
pour traverser, et il a six points de vie au lieu de quatre pour survivre à
l'approche. Mesuré en partie réelle : 15 charges, 3 contacts en 200 secondes.

⚠️ **Tout arrive avant la troisième minute.** Au premier essai, seules les deux
premières bestioles avaient jamais été vues : on meurt bien avant les autres.
Un contrôle refuse désormais toute bestiole qui arriverait après 3:00.
| **La Reine** | le boss : beaucoup de vie, lent, lâche le coffre | 8:00 |

Les points de vie d'une bestiole montent avec la minute d'apparition, comme
dans l'original où ils montent avec le niveau du joueur.

**Plafond : 60 bestioles vivantes, dont au plus 3 individus.** Au delà, on
arrête d'en faire naître. Le chiffre vient de la surface de l'écran et de la
limite de suivi mesurée à 8 ans, et il se confirmera à la mesure.

### Les armes

Six armes possibles, **quatre emplacements**. Chacune frappe seule, avec son
propre délai de recharge. Six niveaux par arme.

| Arme | Ce qu'elle fait |
|---|---|
| **Épée** | moulinet devant soi, dans la direction du déplacement |
| **Bouclier** | tourne autour du chevalier. **Un bouclier de plus à chaque niveau**, et il frappe **tout** ce qu'il touche, pas seulement la première bestiole |
| **Arc** | **une flèche de plus à chaque niveau**, chacune sur une bestiole **différente** |
| **Hache** | part devant, revient, traverse |
| **Feu de camp** | pose une zone qui brûle quelques secondes |
| **Cri de guerre** | repousse et blesse tout autour |

Les armes frappent seules, donc l'enfant ne les suit pas : elles ne mangent pas
ses trois places de suivi. Le risque est ailleurs, et il est réel : **les tirs
du joueur peuvent casser la lisibilité de la foule**, qui repose sur la
ressemblance entre les bestioles. Deux règles en découlent :

- **une famille de couleurs pour le chevalier et ses armes** (clair et chaud :
  doré, blanc, orangé), **une autre pour les bestioles** (sombre et froid).
  Dans tous les mondes, sans exception.
- **peu d'effets gros plutôt que beaucoup de petits.** Quarante points blancs
  détruisent la lecture, deux grands arcs de lame ne la touchent pas. Les
  projectiles du joueur sont plafonnés à **40**.

### Les objets

Six objets, **quatre emplacements**. Cinq niveaux chacun.

⚠️ **Une carte doit dire ce que CE niveau change**, pas ce que l'arme fait en
général : « Épée niveau 3 » ne veut rien dire tout seul. Le texte est engendré
depuis les chiffres de l'arme, donc il ne peut pas mentir, et il s'arrête à
deux changements : à 8 ans une carte se lit en deux secondes. Le tableau
complet, niveau par niveau, est dans le README, engendré par
`tools/chevalier-tableaux.mjs`.

⚠️ **Un objet doit se voir.** Les gantelets donnaient +15 % de dégâts : sans
effet visible, puisque presque tout meurt en un coup dans les premières
minutes. Ils donnent maintenant **+1 dégât à plat**, ce qui suit exactement la
vie des bestioles (+1 toutes les deux minutes), **et un recul** sur chaque
coup, qui se voit immédiatement même quand la bestiole meurt sur le champ.

Un contrôle interdit désormais qu'un objet ne change rien : chacun doit
modifier une valeur que quelqu'un lit.

⚠️ **L'arme de départ est tirée au hasard** parmi les trois, comme dans un
rogue lite : deux parties ne se ressemblent pas. Aucune ne doit être un piège,
et `chevalier-difficulte.mjs` mesure les trois séparément, sinon une arme
injouable se cacherait dans la moyenne.

Historique, et la raison pour laquelle l'épée a été élargie :
**au premier essai le départ était toujours l'épée, pas le bouclier.** L'épée ne frappe que
devant : à l'arrêt, on se fait manger par ce qui arrive de derrière sans rien
tuer. Le bouclier tourne et protège de tous les côtés. Constaté au premier
essai, où tenir deux minutes était déjà un exploit.

⚠️ **Le heaume remplit tous les cœurs**, il n'en ajoute pas seulement un. Un
cœur de plus quand il t'en reste deux ne récompense rien : à quoi bon en avoir
huit s'il n'en reste que deux avant de mourir. C'est le seul moment de la
partie où l'on repart entier, et ça doit se sentir. Corrigé le 2026-08-27,
après son premier essai.

| Objet | Effet |
|---|---|
| **Bottes** | on se déplace plus vite |
| **Gantelets** | **+1 dégât à plat** par niveau, et **les coups repoussent** |
| **Longue-vue** | les armes touchent plus large |
| **Sablier** | les armes se rechargent plus vite |
| **Pierre d'aimant** | les graines viennent **de plus en plus loin** à chaque niveau |
| **Heaume** | un cœur de plus, **et tous les cœurs remplis** |

### Les évolutions

Trois pour commencer. Arme au niveau 6 **plus** l'objet correspondant, et
l'évolution se déclenche **toute seule**, avec une annonce plein écran.

| Arme au maximum | avec | devient |
|---|---|---|
| Épée | Longue-vue | **Épée du vent** : le moulinet traverse l'écran |
| Bouclier | Sablier | **Ronde des boucliers** : un deuxième anneau, qui tourne dans l'autre sens |
| Arc | Gantelets | **Arc long** : chaque flèche traverse tout ce qu'elle rencontre et va deux fois plus loin |

## Le temps qu'il fait

Il change tout seul pendant la partie, et **jamais deux fois de suite le
même** : sinon on ne remarque pas qu'il a changé. Il fait beau les trente
premières secondes, le temps de comprendre le jeu.

| Temps | Ce que ça change |
|---|---|
| **Beau** | rien, l'état par défaut |
| **Pluie** | des gouttes penchées, le sol un peu plus bleu. Rien de mécanique |
| **Nuit** | le soir tombe sur le décor, des lucioles passent |
| Orage, neige | à venir |

⚠️ **La nuit ne cache jamais une menace.** Le voile est peint sur le **sol**,
sous les bestioles, et chaque bestiole reçoit un **halo clair** qui la
redétache du fond. Ce n'est pas de la précaution : mesuré, sans le halo, le
contraste entre l'herbe et un escargot tombait de 91 à 13 alors que la
bestiole n'avait pas été assombrie d'un pixel. Un enfant qui meurt de quelque
chose qu'il n'a pas vu arrête de jouer.

L'opacité du voile est plafonnée à 0,6 par un contrôle, et le voile ne touche à
aucune règle : trois parties menées exactement pareil sous trois temps
différents finissent identiques, cœur pour cœur.

Chaque temps vit dans `meteo.js`, avec sa durée, son poids et son dessin.
Ajouter un temps ne doit toucher que ce fichier.

## Les deux progressions

Elles ne se mélangent pas, et c'est important à 8 ans.

**Pendant la partie** : les graines font monter de niveau, chaque niveau
propose trois choix (une arme, une amélioration d'arme, un objet). Tout est
perdu à la fin de la partie. C'est le jeu.

**Entre les parties** : le score de fin de partie donne de l'expérience, et
**la table des 20 niveaux, les 6 quêtes et les 13 apparences déjà écrites**
dans [la spec du serpent](2026-08-27-serpentin-prairie-design.md) sont reprises
telles quelles. L'expérience vaut toujours **le score divisé par 10**, et les
plafonds ne bougent pas.

Deux paliers changent de contenu, parce que le jeu n'est plus le même :

| Niveau | Avant | Maintenant |
|---|---|---|
| 6, 11, 18 | départ plus long | **une bestiole de moins** dans la première vague |
| 8, 14, 19 | boost moins cher | **une arme de départ au choix** |

Le reste ne bouge pas : les mondes s'ouvrent aux niveaux 5, 10 et 15, la
deuxième chance reste au niveau 12, les potions deviennent les **objets à
ramasser** dans l'arène.

## Ce qu'on ramasse au sol

Un objet tombe toutes les 20 secondes, le premier à la 12ᵉ. **C'est eux qui
donnent le rythme** : sans eux, une partie n'est qu'une longue montée de
tension sans respiration.

| Objet | Effet |
|---|---|
| **Graine d'expérience** | fait monter la barre. Vertes, puis dorées, plus grosses |
| **Fraise** | rend un cœur. Elle n'est ramassée **que s'il en manque un** : marcher dessus à cinq cœurs ne la gaspille pas |
| **Bombe** | un souffle orange, les bestioles **rougissent**, puis elles tombent. Tuer dans la même image ne se voit pas |
| **Glace** | fige toutes les bestioles pendant 10 secondes |
| **Coffre** | il **répand ses graines par terre** : les ramasser fait partie du plaisir, un chiffre qui monte tout seul n'en donne aucun |

## L'écran

**Départ** : le titre, le personnage qui bouge, un gros bouton **Jouer**, deux
entrées discrètes Quêtes et Apparences. Aucune phrase d'explication.

**En jeu** : les cœurs en haut à gauche, **les quatre icônes d'armes juste en
dessous**, le **chronomètre** en haut au centre, la **barre d'expérience** en
haut sur toute la largeur, le manche flottant en bas à gauche. Rien d'autre.

Les icônes d'armes ne sont pas une décoration : sans elles, quand l'écran
propose d'améliorer l'épée, l'enfant ne sait pas s'il l'a déjà.

**La roue, au début de chaque partie** : avant de voir la moindre bestiole,
une roue tourne et s'arrête sur l'arme de départ, avec son nom en grand.
Elle ne décide rien, la partie a déjà tiré son arme : la roue la **montre**.
Sans ça, un enfant ne comprend pas pourquoi deux parties ne se jouent pas
pareil. On peut la toucher pour l'abréger, parce qu'au bout de vingt parties
l'attente lasse.

**Montée de niveau** : d'abord **une onde souffle tout ce qui est autour** du
chevalier, en grand, pendant une demi seconde. Puis le jeu s'arrête et
propose trois grandes cartes. Sans cette onde, on revient de l'écran de choix
pour se faire manger dans la seconde.

Trois grandes cartes, une image par
carte et deux mots. On touche, on repart. C'est le seul écran qui interrompt le
jeu, donc il doit se lire en deux secondes.

**Fin de partie** : le nombre de **graines ramassées** en grand, puis un
tableau qui explique d'où il vient : temps tenu, bestioles battues, niveau
atteint, armes emportées. Et un gros bouton **Rejouer**. Même
délai de 900 ms qu'avant, pour voir ce qui nous a eus.

**Menu**, les 3 points en haut à droite : **installer le jeu**, recommencer,
continuer. Il **arrête le jeu** tant qu'il est ouvert. L'invitation
d'installation de Chrome n'apparaît qu'une fois et jamais si elle a été
ignorée : on la garde sous la main et on la propose ici. Si le navigateur ne la
donne pas, le menu dit où la trouver, parce qu'un jeu qu'on ne peut pas
installer n'est pas une PWA.

⚠️ **Il n'y a plus de bouton FONCE** : dans le jeu de référence, on ne contrôle
que le déplacement, et c'est ce qui rend le jeu jouable à une main.

## Ce qu'on garde du serpent

Sur 2 056 lignes écrites, environ **85 % servent encore**. Ce n'est pas une
estimation de principe, c'est un relevé fichier par fichier.

| Repris tel quel | Où |
|---|---|
| coquille PWA, manifeste, service worker, icônes | `sw.js`, `manifest.json` |
| canvas, DPR, redimensionnement, caméra qui suit, dézoom | `index.html` |
| sol en damier en coordonnées monde, culling hors écran | `index.html` |
| **le manche flottant** : c'est exactement le contrôle du jeu de référence | `index.html` |
| écran de fin, bouton Rejouer, délai de 900 ms | `index.html` |
| compteur d'images `?mesure=1`, réglages par l'adresse `?vitesse=170` | `index.html` |
| générateur à graine, `normaliser`, structure `creer / pas(dt) / evenements` | `moteur.js:77` |
| semis d'obstacles depuis le descripteur du monde | `moteur.js:151` |
| population qui monte, naissances loin du joueur | `moteur.js:201` |
| **pilotage** : viser une cible, trois répulsions. C'est l'IA des bestioles | `moteur.js:251` |
| ramassage au sol, objets qui repoussent ailleurs | `moteur.js:139, 453` |
| mourir en laissant tomber quelque chose | `moteur.js:529` |
| bord qui fait glisser, obstacles qui ralentissent | `moteur.js:388` |
| `mondes.js` en entier, et sa règle de frontière | `mondes.js` |
| les cinq scripts de contrôle et le serveur local | `tools/` |

| Supprimé | Lignes |
|---|---|
| le corps en polyligne et sa découpe | `moteur.js:420-451` |
| tête contre corps et la résolution du face à face | `moteur.js:478-527` |
| le dessin du serpent | `index.html`, 48 lignes |
| le bouton FONCE et le boost | |

Les collisions deviennent **cercle contre cercle**, plus simples que ce qui
existe.

## Les fichiers

`games/serpentin/`, le dossier ne change pas de nom tant que le jeu n'en a pas.

| Fichier | Ce qu'il fait |
|---|---|
| `index.html` | écran, HUD, écrans de départ, de montée de niveau et de fin, entrées tactiles |
| `moteur.js` | monde, joueur, bestioles, vagues, dégâts, graines, ramassages. Aucun DOM |
| `armes.js` | **une définition par arme** : portée, dégâts, recharge, forme du tir, évolution |
| `bestioles.js` | **une définition par bestiole** : vitesse, vie, déplacement, dessin |
| `mondes.js` | la prairie, puis les autres. Décor, couleurs, obstacles |
| `progression.js` | expérience permanente, niveaux, quêtes, apparences, stockage |
| `manifest.json`, `sw.js`, icônes | la PWA |

Même règle de frontière que pour les mondes : **ajouter une arme ou une
bestiole doit coûter un objet dans son fichier, et rien d'autre.** Si
`moteur.js` doit être modifié pour ajouter une arme, la frontière est mal
placée.

## Le risque, et comment on le lève

On a mesuré **0,9 ms par image avec 23 serpents**. Le jeu de référence monte à
**300 ennemis vivants**. Ce n'est pas la même échelle.

- une bestiole est un cercle, pas une polyligne : le dessin coûte moins cher
- mais **les armes frappent en zone**, donc chaque image teste des dizaines de
  projectiles contre des centaines de bestioles. C'est là que ça casse
- l'aimant teste aussi toutes les graines au sol

**Rien ne s'écrit avant d'avoir mesuré 300 bestioles factices à l'écran.** Le
jeu en affichera 60, mais on mesure à 300 pour savoir de combien de marge on
dispose. Si le budget de 16,7 ms est dépassé à 300, on ajoute une grille
spatiale ; s'il l'est déjà à 60, on baisse le plafond et on l'écrit ici.

## D'où viennent les chiffres

Les trois règles de mise en scène ne sortent pas d'une intuition :

- suivi d'objets en mouvement chez l'enfant : Trick, Jaspers-Fayer et Sethi,
  « Multiple-object tracking in children: the Catch the Spies task »,
  *Cognitive Development* 20 (2005), 373-387. Six ans : 2 objets, huit ans :
  3, adulte : 4. L'article lui-même est payant, les chiffres viennent d'un
  compte rendu détaillé de l'étude.
- perception d'une foule comme texture : Whitney et Yamanashi Leib, « Ensemble
  Perception », *Annual Review of Psychology* (2018).
- subitisation, 3 à 4 objets reconnus sans compter : convergent sur plusieurs
  sources pédagogiques, aucune primaire lue.
- temps de réaction 2 à 3 fois plus lent à 8 ans : ordre de grandeur donné par
  les sources accessibles, l'article de *Procedia* n'était pas consultable.

Les deux premiers points sont solides, les deux derniers sont des ordres de
grandeur. Ils vont tous dans le même sens, et aucune règle ci-dessus ne repose
sur les deux derniers seuls.

## La vérification

| Contrôle | Ce qu'il prouve |
|---|---|
| `serpentin-moteur.mjs` | sans navigateur : vagues, dégâts et invincibilité, graines, montée de niveau, évolutions, boss |
| `serpentin-progression.mjs` | sans navigateur : table d'expérience, plafonds, quêtes, stockage |
| `serpentin-pixel9.mjs` | parcours complet, profil Pixel 9 : jouer, monter de niveau, choisir, mourir, rejouer |
| `serpentin-images.mjs` | images par seconde **au plafond de bestioles**, moteur et dessin séparés |
| `serpentin-enligne.mjs` | ce que GitHub Pages sert vraiment, dont le hors ligne |

Objectif inchangé : **60 images par seconde**, jamais moins de 50, mesuré et
pas supposé.

## Ce qui reste ouvert

- **le nom du jeu**, et donc le titre, l'icône et le manifeste
- ~~le personnage~~ : **c'est un chevalier**, décidé le 2026-08-27
- **le son**, toujours hors périmètre, toujours pas cher à ajouter ensuite
- toutes les valeurs chiffrées, qui se règlent en jouant
