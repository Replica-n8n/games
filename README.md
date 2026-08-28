# Games

Des jeux à jouer sur le téléphone, un par dossier. Vanilla JS, aucune
dépendance, aucun outil de build. Chaque jeu est une PWA autonome qui
fonctionne hors ligne.

| Dossier | Jeu | Quoi |
|---|---|---|
| [`echecs/`](echecs/) | **Échecs et Dames** | Deux jeux dans une seule app. Joueur contre joueur sur un seul téléphone, règles complètes, pas d'adversaire artificiel, pas de chrono. |
| [`serpentin/`](serpentin/) | **Le chevalier** | Un « survivants » pour enfants : les armes frappent toutes seules, on ne contrôle que le déplacement. ⚠️ en construction. |

⚠️ Le dossier s'appelle encore `echecs/` : l'adresse était déjà en ligne et
installée quand les dames sont arrivées, la renommer aurait cassé les
installations existantes.

## Ajouter un jeu

Créer un dossier à la racine, avec son propre `index.html`, son `manifest.json`
et son `sw.js`. Les portées des service workers ne se chevauchent pas : chaque
jeu est isolé dans son sous-chemin. Ajouter ensuite une ligne dans le tableau
ci-dessus et une carte dans l'`index.html` racine.

## En ligne

GitHub Pages, branche `main`, dossier racine. Activé le 2026-08-27 :

- l'accueil : <https://replica-n8n.github.io/games/>
- les échecs : <https://replica-n8n.github.io/games/echecs/>
- le chevalier : <https://replica-n8n.github.io/games/serpentin/>

Vérifié servi : les six fichiers répondent 200 avec le bon type, le service
worker prend le contrôle au rechargement, et le jeu se relance **hors ligne**,
32 pièces à l'écran. `node tools/echecs-enligne.mjs` rejoue ce contrôle.

⚠️ Le service worker garde les fichiers en cache. Après chaque modification,
changer `VERSION` dans le `sw.js` du jeu concerné, sinon le téléphone continue
d'afficher l'ancienne version.

---

## Échecs et Dames

Une seule app, deux jeux. L'écran d'accueil propose le jeu au lieu d'un bouton
« Commencer », et les 3 points permettent d'en changer en cours de route. Le
dernier jeu choisi est retenu d'une fois sur l'autre.

| Fichier | Rôle |
|---|---|
| [`echecs/index.html`](echecs/index.html) | la coquille : plateau, bandeaux joueurs, menu, surcouches |
| [`echecs/moteur-echecs.js`](echecs/moteur-echecs.js) | les règles des échecs |
| [`echecs/moteur-dames.js`](echecs/moteur-dames.js) | les règles des dames internationales |

La coquille ne connaît aucune règle. Elle demande au moteur la taille du damier,
ce qu'il y a sur chaque case, les coups possibles, et le texte à afficher.
Ajouter un troisième jeu, c'est écrire un troisième moteur et une carte de plus
sur l'écran d'accueil.

## Dames

Dames internationales, le damier français : 10x10, 20 pions chacun, on ne joue
que sur les cases sombres. Toutes les règles qui comptent sont appliquées :
prise obligatoire et **rafle la plus longue imposée**, pion qui prend en avant
comme en arrière, dame qui vole sur toute la diagonale, pion déjà sauté qui ne
peut pas l'être deux fois et qui gêne le passage jusqu'à la fin de la rafle,
promotion seulement si le pion **s'arrête** sur la dernière rangée.

Une rafle se joue case par case : on touche la pièce, puis chaque case
d'arrivée. Le pion reste visible à son point de départ tant que la rafle n'est
pas finie, les cases déjà parcourues sont marquées, et les pions qui vont
tomber sont cerclés de rouge.

Vérifié par `tools/perft-dames.js` contre les valeurs de référence de la FMJD,
jusqu'à six coups : 9, 81, 658, 4265, 27117, 167140. Si ces six nombres tombent
juste, la prise maximale, le vol de la dame et la règle du pion déjà sauté sont
correctes.

## Échecs

Un seul fichier, [`echecs/index.html`](echecs/index.html) : modèle de jeu et
interface, environ 600 lignes, sans dépendance.

**Installation** : le jeu garde sous la main l'invitation d'installation de
Chrome (`beforeinstallprompt`) et la propose dans les 3 points, « Installer le
jeu ». La bannière automatique du navigateur n'apparaît qu'une fois et jamais
si elle a été ignorée : compter dessus, c'est n'avoir aucune installation.
L'entrée disparaît une fois le jeu installé.

**Ce qui est joué** : tous les coups légaux, roque, prise en passant, échec,
mat, pat. Seule simplification assumée, la promotion donne toujours une dame.

**En échec, on ne reste pas coincé** : quand la pièce touchée ne peut pas
bouger, le jeu entoure celles qui peuvent parer l'échec, et le dit sous le
plateau. Un roi sans case n'est pas un mat : une autre pièce peut couper la
ligne ou prendre l'attaquant. `tools/echecs-parade.mjs` rejoue la position qui
a soulevé la question.

**L'écran** : une barre d'état en haut, un bandeau par joueur avec ses prises
et son avantage matériel, le plateau entre les deux. Deux surcouches, la même
mise en page : celle du départ avec « Commencer », celle de fin de partie avec
le roi couché, le résultat et « Recommencer ». La fin de partie s'affiche avec
900 ms de retard, pour laisser voir la position finale et le roi en échec. Les 3 points en haut à
droite ouvrent une feuille par le bas : annuler le dernier coup, choisir entre
un plateau qui pivote et un plateau fixe, recommencer la partie. Le choix du
plateau est retenu d'une partie à l'autre.

**Plateau qui pivote ou fixe** : pivoter n'a de sens que si les deux joueurs
regardent l'écran depuis le même côté, c'est à dire si on se passe le téléphone.
Assis face à face avec le téléphone posé à plat, la disposition par défaut est
déjà bonne pour les deux et pivoter éloignerait les pièces du joueur au trait.
D'où les deux options.

### Vérification

Le générateur de coups est vérifié par `perft` contre les valeurs de référence
connues : position de départ jusqu'à la profondeur 4 (197 281 coups), position
« kiwipete » jusqu'à 3, position 3 jusqu'à 4. Le script d'essai extrait le bloc
`modele` directement du HTML livré, il ne teste pas une copie.

Le parcours complet a été joué en Chromium, profil Pixel 7 : départ, coups
possibles, prise, rotation, les deux options de plateau, persistance du choix
après rechargement, mat. Zéro erreur console.

Les deux scripts sont dans [`tools/`](tools/) et se relancent depuis ce dossier :

```
cd tools
npm i playwright && npx playwright install chromium   # une seule fois
node perft.js
node echecs-pixel7.mjs
```

`perft.js` ne demande que Node. Les scripts Playwright affichent leurs mesures
en JSON et déposent leurs captures dans `tools/captures/` :

| Script | Ce qu'il contrôle |
|---|---|
| `perft.js` | le générateur de coups, contre les valeurs de référence |
| `parcours.mjs` | le parcours complet des DEUX jeux, profil Pixel 7 |
| `perft-dames.js` | les dames, contre les valeurs de référence de la FMJD |
| `echecs-parade.mjs` | la position où le roi est en échec sans case libre |
| `echecs-enligne.mjs` | ce que GitHub Pages sert vraiment, dont le hors ligne |
| `position.js` | analyse une position en FEN, coups légaux et cases du roi |
| `fait-artifact.js` | fabrique `echecs/artifact.html`, la version d'aperçu |

---

## Le chevalier

Un « survivants » pour enfants, dans la prairie. On joue un chevalier, **on ne
contrôle que le déplacement**, les armes frappent toutes seules. Les bestioles
arrivent par vagues, on ramasse leurs graines, on monte de niveau et on choisit
entre trois cartes. Huit minutes.

Clone sans publicité ni achat de **Vampire Survivors**, vérifié à la source
puis adapté : 8 minutes au lieu de 30, un boss battable au lieu du Faucheur
imbattable, cinq cœurs au lieu de points de vie chiffrés, aucune monnaie.

⚠️ **Le dossier s'appelle encore `serpentin/`** : il a contenu un jeu de
serpent, l'adresse était déjà en ligne, et une adresse ne se change pas pour
faire joli. Même raison que `echecs/`, qui contient aussi les dames.

**La cible est un enfant de 8 ans**, et trois règles en découlent, tirées de
mesures et pas d'une intuition :

- **au plus trois « individus » à l'écran** : à 8 ans on suit trois objets en
  mouvement, quatre chez l'adulte. Le reste est de la foule, et une foule se
  lit comme une texture
- **soixante bestioles au plafond**, pas les 300 du jeu de référence : l'écran
  du téléphone fait huit fois moins de surface qu'un écran de PC
- **une seconde de préavis** avant toute attaque : à 8 ans on réagit deux à
  trois fois plus lentement

Conception : [la spec](docs/superpowers/specs/2026-08-27-survivants-prairie-design.md)
et [le plan](docs/superpowers/plans/2026-08-27-survivants-prairie-plan.md).

### Les fichiers

| Fichier | Ce qu'il fait |
|---|---|
| `index.html` | l'écran, le HUD, les trois surcouches, le manche flottant |
| `moteur.js` | le monde, le chevalier, les vagues, les dégâts, les graines. Aucun DOM |
| `bestioles.js` | **une définition par bestiole** : ses chiffres et son dessin |
| `armes.js` | **une définition par arme** : sa portée, sa cadence, sa forme, son dessin |
| `mondes.js` | le décor d'un monde : couleurs, obstacles |

Règle de frontière : ajouter une arme, une bestiole ou un monde doit coûter un
objet dans **son** fichier, et rien d'autre.

### Régler en jouant

Toutes les valeurs sont dans `REGLAGES`, en tête de
[`serpentin/moteur.js`](serpentin/moteur.js), et n'importe laquelle se remplace
par un paramètre d'adresse :

```
https://replica-n8n.github.io/games/serpentin/?vitesse=190&plafond=40
```

`?mesure=1` affiche les images par seconde et le nombre de bestioles sur le
vrai téléphone.

### Les contrôles

| Script de `tools/` | Ce qu'il contrôle |
|---|---|
| `chevalier-moteur.mjs` | les règles, **sans navigateur** : l'invincibilité, les cinq cœurs, les graines, l'aimant, les objets au sol, l'onde de la montée de niveau, le préavis du hérisson, le plafond de trois individus, les trois cartes sans doublon |
| `chevalier-difficulte.mjs` | fait **jouer huit parties entières** par un joueur simulé qui fuit et ramasse, et garde un plancher de survie |
| `chevalier-foule.mjs` | ce que coûte la foule, moteur seul, à 60, 150 et **300 bestioles** |
| `chevalier-parcours.mjs` | le parcours complet en Chromium, profil **Pixel 9** : jouer, se déplacer, tuer, monter de niveau avec le jeu **arrêté**, mourir |
| `chevalier-pwa.mjs` | la page s'ouvre, le service worker prend le contrôle, et **le jeu se relance hors ligne** |
| `chevalier-enligne.mjs` | ce que **GitHub Pages sert vraiment**, dont le hors ligne |
| `chevalier-icones.mjs` | refabrique les deux icônes depuis `serpentin/icone.html` |
| `serveur.mjs` | le serveur local partagé, parce qu'un service worker refuse `file://` |

### Ce que ça coûte

Moteur seul, mesuré : **0,27 ms par image à 60 bestioles**, **1,77 ms à 300**,
pour un budget de 16,7 ms à 60 images par seconde. Le jeu en affiche 60.
