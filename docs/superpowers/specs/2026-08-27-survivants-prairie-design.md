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

## Une partie

Huit minutes. Le joueur se déplace, ses armes frappent toutes seules. Les
bestioles arrivent par vagues, une nouvelle vague chaque minute. Les bestioles
tuées lâchent des **graines d'expérience** qu'on ramasse en passant dessus.
Assez de graines et on monte de niveau : **le jeu s'arrête et propose trois
choix**. À la 8ᵉ minute arrive **la Reine**, qu'on peut battre.

Une partie finit de trois façons : les cinq cœurs sont perdus, la Reine est
battue (victoire), ou le joueur arrête.

### Ce qui blesse

Le contact avec une bestiole coûte **un cœur**, puis le joueur est
**invincible une seconde**, le temps de se dégager. Sans ce délai, entrer dans
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
| **Abeille** | rapide, trajectoire ondulée | 1:00 |
| **Hérisson** | fonce en ligne droite et ne corrige jamais : ça s'esquive | 3:00 |
| **Crapaud** | ne bouge pas, crache une bulle toutes les 2 s | 4:00 |
| **Pissenlit** | s'approche puis **éclate** en graines qui blessent | 6:00 |
| **La Reine** | le boss : beaucoup de vie, lent, lâche le coffre | 8:00 |

Les points de vie d'une bestiole montent avec la minute d'apparition, comme
dans l'original où ils montent avec le niveau du joueur. Le nombre de bestioles
vivantes est **plafonné** : au delà, on arrête d'en faire naître. Ce plafond
est un réglage, et il sera fixé **par la mesure**, pas sur le papier.

### Les armes

Six armes possibles, **quatre emplacements**. Chacune frappe seule, avec son
propre délai de recharge. Six niveaux par arme.

| Arme | Ce qu'elle fait |
|---|---|
| **Arrosoir** | un jet devant soi, dans la direction du déplacement |
| **Boomerang** | part devant, revient, traverse |
| **Papillons** | deux papillons tournent autour du joueur en permanence |
| **Graines** | tirées vers la bestiole la plus proche |
| **Ruche** | pose une zone qui blesse pendant quelques secondes |
| **Éternuement** | repousse tout autour de soi et blesse |

### Les objets

Six objets, **quatre emplacements**. Cinq niveaux chacun.

| Objet | Effet |
|---|---|
| **Chaussures** | on se déplace plus vite |
| **Gants** | les armes tapent plus fort |
| **Loupe** | les armes touchent plus large |
| **Montre** | les armes se rechargent plus vite |
| **Aimant** | les graines viennent de plus loin |
| **Cœur** | un cœur de plus |

### Les évolutions

Trois pour commencer. Arme au niveau 6 **plus** l'objet correspondant, et
l'évolution se déclenche **toute seule**, avec une annonce plein écran.

| Arme au maximum | avec | devient |
|---|---|---|
| Arrosoir | Loupe | **Jet d'eau** : le jet traverse tout l'écran |
| Papillons | Montre | **Nuée** : six papillons, deux fois plus vite |
| Graines | Gants | **Tournesol** : trois graines à la fois, qui percent |

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

| Objet | Effet |
|---|---|
| **Graine d'expérience** | fait monter la barre. Vertes, puis dorées, plus grosses |
| **Fraise** | rend un cœur |
| **Cloche** | fait disparaître toutes les bestioles à l'écran |
| **Coffre** | lâché par la Reine : monte une arme au hasard de deux niveaux |

## L'écran

**Départ** : le titre, le personnage qui bouge, un gros bouton **Jouer**, deux
entrées discrètes Quêtes et Apparences. Aucune phrase d'explication.

**En jeu** : les cœurs en haut à gauche, le **chronomètre** en haut au centre,
la **barre d'expérience** en haut sur toute la largeur, le manche flottant en
bas à gauche. Rien d'autre.

**Montée de niveau** : le jeu s'arrête, trois grandes cartes, une image par
carte et deux mots. On touche, on repart. C'est le seul écran qui interrompt le
jeu, donc il doit se lire en deux secondes.

**Fin de partie** : le temps tenu, le score, l'expérience gagnée, la barre qui
se remplit, ce qui vient d'être débloqué, un gros bouton **Rejouer**. Même
délai de 900 ms qu'avant, pour voir ce qui nous a eus.

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

**Rien ne s'écrit avant d'avoir mesuré 300 bestioles factices à l'écran.** Si
le budget de 16,7 ms est dépassé, on ajoute une grille spatiale ; si ça ne
suffit pas, on baisse le plafond de bestioles et on l'écrit ici.

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
- **le personnage** : qui joue ? Un enfant, un animal, une coccinelle ?
- **le son**, toujours hors périmètre, toujours pas cher à ajouter ensuite
- toutes les valeurs chiffrées, qui se règlent en jouant
